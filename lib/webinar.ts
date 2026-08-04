import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/env";

export type WebinarSession = {
  id: string;
  title: string;
  starts_at: string;
  duration_minutes: number;
};

/**
 * The next upcoming session.
 *
 * Columns are listed explicitly and `zoom_url` is deliberately absent: `anon`
 * has no column grant for it, so `select("*")` would fail outright. That is the
 * schema doing its job — the join link must never reach a page, or anyone could
 * walk into a live session with children without registering.
 *
 * Returns null when Supabase is unconfigured or no session is scheduled, and
 * the page falls back to a generic registration form rather than breaking.
 */
export async function getNextWebinarSession(): Promise<WebinarSession | null> {
  if (!isSupabaseConfigured) return null;

  try {
    // Cookie-free on purpose — see lib/supabase/public.ts. Using the
    // session-bound client here silently disabled this whole feature.
    const supabase = createPublicClient();

    const { data, error } = await supabase
      .from("webinar_sessions")
      .select("id, title, starts_at, duration_minutes")
      .eq("is_active", true)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (error) {
    // A missing session must never take down the landing page — this is the
    // page paid traffic lands on.
    console.error("[webinar] could not load next session:", error);
    return null;
  }
}

export function formatSessionDate(startsAt: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  }).format(new Date(startsAt));
}

export function formatSessionTime(startsAt: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(startsAt));
}
