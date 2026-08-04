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
};

export type PublicTestimonial = {
  id: string;
  parent_name: string;
  child_first_name: string | null;
  city: string | null;
  quote: string;
  video_path: string | null;
};

export type PublicProject = {
  id: string;
  title: string;
  summary: string;
  student_first_name: string;
  student_age: number | null;
};

async function safeQuery<T>(
  // PromiseLike, not Promise: Supabase's query builder is a thenable that only
  // executes when awaited, so it satisfies `await` without being a real Promise.
  run: (client: ReturnType<typeof createPublicClient>) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  label: string,
): Promise<T[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data, error } = await run(createPublicClient());
    if (error) throw new Error(error.message);
    return data ?? [];
  } catch (error) {
    console.error(`[content] ${label} failed:`, error);
    return [];
  }
}

export function getPublishedCourses() {
  return safeQuery<PublicCourse>(
    (client) =>
      client
        .from("courses")
        .select("id, slug, title, summary, age_min, age_max, duration_weeks, price_inr")
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "courses",
  );
}

export async function getCourseBySlug(slug: string): Promise<PublicCourse | null> {
  const rows = await safeQuery<PublicCourse>(
    (client) =>
      client
        .from("courses")
        .select("id, slug, title, summary, age_min, age_max, duration_weeks, price_inr")
        .eq("is_published", true)
        .eq("slug", slug)
        .limit(1),
    `course ${slug}`,
  );
  return rows[0] ?? null;
}

export function getPublishedTestimonials() {
  return safeQuery<PublicTestimonial>(
    (client) =>
      client
        .from("testimonials")
        .select("id, parent_name, child_first_name, city, quote, video_path")
        .eq("is_published", true)
        .order("sort_order", { ascending: true }),
    "testimonials",
  );
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
