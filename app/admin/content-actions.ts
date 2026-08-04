"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/auth";

/**
 * Content mutations for the admin panel.
 *
 * Every one calls requireAdmin() first. A server action is a public HTTP
 * endpoint — it can be invoked directly, whatever the page around it rendered —
 * so "the page checked" is not a guarantee about the action.
 *
 * All writes go through the ADMIN'S OWN session, never the service role. RLS is
 * therefore doing the authorising, which means a mistake here fails closed at
 * the database rather than silently succeeding with god-mode credentials.
 */

const IST_OFFSET = "+05:30";

/**
 * Converts a datetime-local value to an absolute instant.
 *
 * `<input type="datetime-local">` yields "2026-08-10T18:00" with no timezone.
 * `new Date()` on that string uses the SERVER's local zone — UTC on Vercel — so
 * a session entered as 6pm would be stored as 6pm UTC and shown to parents as
 * 11:30pm IST. Every webinar silently 5½ hours out.
 *
 * The admins are in India and the site displays IST throughout, so the value is
 * explicitly interpreted as IST.
 */
function istToIso(local: string): string | null {
  if (!local) return null;
  const withSeconds = local.length === 16 ? `${local}:00` : local;
  const parsed = new Date(`${withSeconds}${IST_OFFSET}`);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function text(form: FormData, key: string): string {
  return String(form.get(key) ?? "").trim();
}

function optionalText(form: FormData, key: string): string | null {
  const value = text(form, key);
  return value === "" ? null : value;
}

function optionalNumber(form: FormData, key: string): number | null {
  const value = text(form, key);
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function checkbox(form: FormData, key: string): boolean {
  return form.get(key) === "on" || form.get(key) === "true";
}

// --- Webinar sessions --------------------------------------------------------

export async function saveSession(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = optionalText(form, "id");
  const startsAt = istToIso(text(form, "starts_at"));
  if (!text(form, "title") || !startsAt) return;

  const payload = {
    title: text(form, "title"),
    starts_at: startsAt,
    duration_minutes: optionalNumber(form, "duration_minutes") ?? 60,
    zoom_url: optionalText(form, "zoom_url"),
    capacity: optionalNumber(form, "capacity"),
    is_active: checkbox(form, "is_active"),
  };

  if (id) {
    await supabase.from("webinar_sessions").update(payload).eq("id", id);
  } else {
    await supabase.from("webinar_sessions").insert(payload);
  }

  revalidatePath("/admin/sessions");
  revalidatePath("/admin");
  // The public landing page caches for an hour; without this a newly scheduled
  // session would not appear to parents until that expired.
  revalidatePath("/webinar");
}

export async function deleteSession(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("webinar_sessions").delete().eq("id", id);

  revalidatePath("/admin/sessions");
  revalidatePath("/webinar");
}

// --- Programmes --------------------------------------------------------------

export async function saveCourse(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = optionalText(form, "id");
  const title = text(form, "title");
  const slug =
    optionalText(form, "slug") ??
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  if (!title || !slug) return;

  const payload = {
    title,
    slug,
    summary: optionalText(form, "summary"),
    age_min: optionalNumber(form, "age_min") ?? 10,
    age_max: optionalNumber(form, "age_max") ?? 14,
    duration_weeks: optionalNumber(form, "duration_weeks"),
    price_inr: optionalNumber(form, "price_inr"),
    is_published: checkbox(form, "is_published"),
    sort_order: optionalNumber(form, "sort_order") ?? 0,
  };

  if (id) {
    await supabase.from("courses").update(payload).eq("id", id);
  } else {
    await supabase.from("courses").insert(payload);
  }

  revalidatePath("/admin/programs");
  revalidatePath("/courses");
}

export async function deleteCourse(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("courses").delete().eq("id", id);

  revalidatePath("/admin/programs");
  revalidatePath("/courses");
}

// --- Testimonials ------------------------------------------------------------

export async function saveTestimonial(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = optionalText(form, "id");
  const quote = text(form, "quote");
  const parentName = text(form, "parent_name");
  if (!quote || !parentName) return;

  const payload = {
    parent_name: parentName,
    child_first_name: optionalText(form, "child_first_name"),
    city: optionalText(form, "city"),
    quote,
    rating: optionalNumber(form, "rating"),
    consent_ref: optionalText(form, "consent_ref"),
    is_published: checkbox(form, "is_published"),
    sort_order: optionalNumber(form, "sort_order") ?? 0,
  };

  // The database also enforces this (0003). Checked here too so the admin gets
  // a sane outcome rather than an opaque constraint violation.
  if (payload.is_published && payload.child_first_name && !payload.consent_ref) {
    return;
  }

  if (id) {
    await supabase.from("testimonials").update(payload).eq("id", id);
  } else {
    await supabase.from("testimonials").insert(payload);
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

export async function deleteTestimonial(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id);

  revalidatePath("/admin/testimonials");
  revalidatePath("/");
}

// --- Student projects --------------------------------------------------------

export async function saveProject(form: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const id = optionalText(form, "id");
  const title = text(form, "title");
  const studentFirstName = text(form, "student_first_name");
  if (!title || !studentFirstName) return;

  const payload = {
    title,
    summary: text(form, "summary"),
    student_first_name: studentFirstName,
    student_age: optionalNumber(form, "student_age"),
    consent_ref: optionalText(form, "consent_ref"),
    is_published: checkbox(form, "is_published"),
    sort_order: optionalNumber(form, "sort_order") ?? 0,
  };

  // Publishing a child's work without recorded parental consent is a DPDP
  // violation, not a policy preference. The database refuses it too.
  if (payload.is_published && !payload.consent_ref) return;

  if (id) {
    await supabase.from("student_projects").update(payload).eq("id", id);
  } else {
    await supabase.from("student_projects").insert(payload);
  }

  revalidatePath("/admin/projects");
  revalidatePath("/");
}

export async function deleteProject(form: FormData) {
  await requireAdmin();
  const id = text(form, "id");
  if (!id) return;

  const supabase = await createClient();
  await supabase.from("student_projects").delete().eq("id", id);

  revalidatePath("/admin/projects");
  revalidatePath("/");
}

// --- Site settings -----------------------------------------------------------

export async function saveSetting(form: FormData) {
  await requireAdmin();
  const key = text(form, "key");
  const value = text(form, "value");
  if (!key) return;

  const supabase = await createClient();
  await supabase
    .from("site_settings")
    .upsert({ key, value: JSON.stringify(value) }, { onConflict: "key" });

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
