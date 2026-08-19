import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";

/**
 * Published content, read for the public site.
 *
 * Uses the cookie-free client so pages stay statically renderable with ISR —
 * the cookie-bound one would force every page that calls this to render per
 * request. Same trap that silently killed the webinar date.
 *
 * Every function returns an empty array on failure rather than throwing. A
 * database blip must not take down the homepage; a missing testimonials
 * section is a far better outcome than a 500 for a parent arriving from an ad.
 *
 * RLS restricts these to published rows, so `is_published` is not filtered here
 * — but it is anyway, because relying on a policy you cannot see from the call
 * site is how someone later "optimises" it into a leak.
 */

export type PublicCourse = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  age_min: number;
  age_max: number;
  duration_weeks: number | null;
  price_inr: number | null;
  hero_copy: string | null;
  image_path: string | null;
};

export type PublicTestimonial = {
  id: string;
  parent_name: string;
  child_first_name: string | null;
  city: string | null;
  quote: string;
  video_path: string | null;
  photo_path: string | null;
};

export type PublicProject = {
  id: string;
  title: string;
  summary: string;
  student_first_name: string;
  student_age: number | null;
};

type QueryError = { message: string; code?: string };

/**
 * PromiseLike, not Promise: Supabase's query builder is a thenable that only
 * executes when awaited, so it satisfies `await` without being a real Promise.
 */
type Runner<T> = (client: ReturnType<typeof createPublicClient>) => PromiseLike<{
  data: T[] | null;
  error: QueryError | null;
}>;

/** 42703 undefined_column — a migration adding a column has not been applied. */
const isMissingColumn = (error: QueryError) =>
  error.code === "42703" || /column .* does not exist/i.test(error.message);

/**
 * 42P01 undefined_table, or PostgREST's own PGRST205 when the table is absent
 * from its schema cache — a migration creating a table has not been applied.
 */
const isMissingTable = (error: QueryError) =>
  error.code === "42P01" ||
  error.code === "PGRST205" ||
  /could not find the table|relation .* does not exist/i.test(error.message);

/** Runs a query and hands back the error rather than logging it. */
async function runQuery<T>(
  run: Runner<T>,
  label: string,
): Promise<{ rows: T[]; error: QueryError | null }> {
  if (!isSupabaseConfigured) return { rows: [], error: null };

  try {
    const { data, error } = await run(createPublicClient());
    if (error) return { rows: [], error };
    return { rows: data ?? [], error: null };
  } catch (cause) {
    return {
      rows: [],
      error: {
        message: cause instanceof Error ? cause.message : `${label} failed`,
      },
    };
  }
}

/**
 * The default path: log, and return an empty array.
 *
 * A missing migration is logged as a WARNING, not an error. It is a
 * configuration state with a known fix, not a fault — and in development
 * `console.error` from a server component raises the full-screen Next.js error
 * overlay, which puts a red wall over a page that is in fact working correctly.
 * Anything genuinely unexpected still logs as an error.
 */
async function safeQuery<T>(run: Runner<T>, label: string): Promise<T[]> {
  const { rows, error } = await runQuery(run, label);

  if (error) {
    if (isMissingTable(error)) {
      console.warn(
        `[content] ${label}: table not found - apply the pending migrations in supabase/migrations. Section will render nothing.`,
      );
    } else {
      console.error(`[content] ${label} failed:`, error);
    }
  }

  return rows;
}

/** Everything on `courses` that has existed since 0001_init.sql. */
const COURSE_BASE =
  "id, slug, title, summary, age_min, age_max, duration_weeks, price_inr, hero_copy";

export async function getPublishedCourses(): Promise<PublicCourse[]> {
  const full = await runQuery<PublicCourse>(
    (client) =>
      client
        .from("courses")
        .select(`${COURSE_BASE}, image_path`)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "courses",
  );

  if (!full.error) return full.rows;
  if (!isMissingColumn(full.error)) return coursesFailed("courses", full.error);

  console.warn(
    "[content] courses: image_path is missing - apply supabase/migrations/0006_course_image.sql to enable programme photos. Falling back to no image.",
  );

  const fallback = await runQuery<Omit<PublicCourse, "image_path">>(
    (client) =>
      client
        .from("courses")
        .select(COURSE_BASE)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "courses",
  );

  if (fallback.error) return coursesFailed("courses", fallback.error);
  return fallback.rows.map((row) => ({ ...row, image_path: null }));
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse | null> {
  const label = `course ${slug}`;

  const full = await runQuery<PublicCourse>(
    (client) =>
      client
        .from("courses")
        .select(`${COURSE_BASE}, image_path`)
        .eq("is_published", true)
        .eq("slug", slug)
        .limit(1),
    label,
  );

  if (!full.error) return full.rows[0] ?? null;
  if (!isMissingColumn(full.error)) return coursesFailed(label, full.error)[0] ?? null;

  const fallback = await runQuery<Omit<PublicCourse, "image_path">>(
    (client) =>
      client
        .from("courses")
        .select(COURSE_BASE)
        .eq("is_published", true)
        .eq("slug", slug)
        .limit(1),
    label,
  );

  if (fallback.error) return coursesFailed(label, fallback.error)[0] ?? null;
  const row = fallback.rows[0];
  return row ? { ...row, image_path: null } : null;
}

/** Shared reporting for the two above, so the messages cannot drift apart. */
function coursesFailed(label: string, error: QueryError): PublicCourse[] {
  if (isMissingTable(error)) {
    console.warn(
      `[content] ${label}: table not found - apply the pending migrations in supabase/migrations.`,
    );
  } else {
    console.error(`[content] ${label} failed:`, error);
  }
  return [];
}

/** Everything that has existed since 0001_init.sql. */
const TESTIMONIAL_BASE = "id, parent_name, child_first_name, city, quote";

/**
 * Published testimonials, degrading gracefully when 0004 has not been applied.
 *
 * `video_path` arrived in 0004_testimonial_video.sql. Selecting a column that
 * does not exist fails the WHOLE query, so before this fallback existed a
 * database holding perfectly good text testimonials rendered nothing at all —
 * and logged an error on every page build. The section was dark for a reason
 * that had nothing to do with its own content.
 *
 * So: ask for the video column, and if the database has not got there yet, ask
 * again without it and treat every testimonial as text-only. Text quotes work
 * today; video appears the moment the migration runs, with no code change.
 *
 * The retry only ever happens while a migration is outstanding. Once 0004 is
 * applied the first query succeeds and this costs nothing.
 */
export async function getPublishedTestimonials(): Promise<PublicTestimonial[]> {
  const first = await runQuery<PublicTestimonial>(
    (client) =>
      client
        .from("testimonials")
        .select(`${TESTIMONIAL_BASE}, video_path, photo_path`)
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "testimonials",
  );

  if (!first.error) return first.rows;

  if (isMissingColumn(first.error)) {
    console.warn(
      "[content] testimonials: video_path or photo_path is missing - apply the pending migrations in supabase/migrations. Falling back to text-only.",
    );

    const fallback = await runQuery<
      Omit<PublicTestimonial, "video_path" | "photo_path">
    >(
      (client) =>
        client
          .from("testimonials")
          .select(TESTIMONIAL_BASE)
          .eq("is_published", true)
          .order("sort_order", { ascending: true }),
      "testimonials",
    );

    if (fallback.error) {
      console.error("[content] testimonials failed:", fallback.error);
      return [];
    }

    return fallback.rows.map((row) => ({
      ...row,
      video_path: null,
      photo_path: null,
    }));
  }

  if (isMissingTable(first.error)) {
    console.warn(
      "[content] testimonials: table not found - apply the pending migrations in supabase/migrations.",
    );
    return [];
  }

  console.error("[content] testimonials failed:", first.error);
  return [];
}

export function getPublishedProjects() {
  return safeQuery<PublicProject>(
    (client) =>
      client
        .from("student_projects")
        .select("id, title, summary, student_first_name, student_age")
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "student projects",
  );
}
