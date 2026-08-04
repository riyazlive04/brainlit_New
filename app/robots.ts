import type { MetadataRoute } from "next";
import { IS_CANONICAL_HOST, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  /**
   * Anything that is not the real domain refuses all crawling.
   *
   * A preview deployment is a byte-for-byte copy of the site on a different
   * host. Indexed, it competes with brainlit.in for brainlit.in's own terms,
   * and Google may pick the wrong one as canonical. That is a genuinely
   * expensive mistake to unwind, and it happens silently.
   *
   * The rule keys off the resolved host rather than NODE_ENV, because a
   * preview deployment is a production build — NODE_ENV would say "production"
   * on both and block nothing.
   */
  if (!IS_CANONICAL_HOST) {
    return {
      rules: [{ userAgent: "*", disallow: "/" }],
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          // The admin pages are already noindex, which is the stronger signal —
          // this just stops crawlers spending budget on URLs that will only
          // ever redirect them to a login screen.
          "/admin",
          "/admin/",
          // Internal layout comparison pages, same reasoning.
          "/lab",
          "/lab/",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
