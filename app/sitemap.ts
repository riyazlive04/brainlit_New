import type { MetadataRoute } from "next";
import { getPublishedCourses } from "@/lib/content";
import { SITE } from "@/lib/site";

/**
 * Sitemap.
 *
 * Generated rather than hand-written, so a new program cannot be added and then
 * silently left out of search — the most common way a page ends up unindexed.
 *
 * `/webinar` is deliberately absent: it is noindex, and listing a noindex URL
 * in a sitemap sends Google contradictory instructions. `/lab` is internal.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Read from the database, so a programme published in the admin panel is
  // submitted to search engines without anyone remembering to edit this file.
  const courses = await getPublishedCourses();

  const lastModified = new Date();

  const staticRoutes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.8, changeFrequency: "monthly" },
    { path: "/courses", priority: 0.9, changeFrequency: "weekly" },
    { path: "/faq", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.6, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/refund", priority: 0.3, changeFrequency: "yearly" },
  ];

  return [
    ...staticRoutes.map((route) => ({
      url: `${SITE.url}${route.path}`,
      lastModified,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...courses.map((course) => ({
      url: `${SITE.url}/courses/${course.slug}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
