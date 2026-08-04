import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
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
