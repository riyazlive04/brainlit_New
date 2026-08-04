import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env, isSupabaseConfigured } from "@/lib/env";

/**
 * Refreshes the Supabase session on every request, and gates /admin.
 *
 * Two things happen here that cannot happen anywhere else:
 *
 * 1. Token refresh. Server Components cannot write cookies, so without
 *    middleware an admin's session expires mid-session and they are bounced to
 *    the login screen while still clicking around.
 *
 * 2. A redirect before any admin page renders. This is convenience, not
 *    security — see lib/admin/auth.ts. Middleware sees only the cookie, so it
 *    knows a session exists but not whether that user is an admin. The role is
 *    checked again server-side on every page, and RLS refuses regardless.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(env.supabaseUrl, env.supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser(), not getSession(). getSession() reads the cookie and trusts it;
  // getUser() verifies the token with the auth server. For a route guard, the
  // difference is whether a forged cookie gets past.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminArea = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminArea && !isLoginPage && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    // Send them back where they were headed once they are in.
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isLoginPage && user) {
    const adminUrl = request.nextUrl.clone();
    adminUrl.pathname = "/admin";
    adminUrl.search = "";
    return NextResponse.redirect(adminUrl);
  }

  return response;
}
