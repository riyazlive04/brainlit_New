import { SITE } from "@/lib/site";
import { CONTACT_EMAIL, JURISDICTION } from "@/lib/legal";

/**
 * Organization structured data, emitted once site-wide.
 *
 * `EducationalOrganization` rather than plain `Organization`: it is the
 * accurate type, and it is what Google uses to understand that this is a school
 * rather than a shop — which changes how the site is surfaced for parent
 * queries.
 */
export function OrganizationSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${SITE.url}#organization`,
    name: SITE.legalName,
    alternateName: SITE.tagline,
    url: SITE.url,
    logo: `${SITE.url}/brainlit-mark.svg`,
    description: SITE.description,
    email: CONTACT_EMAIL,
    founder: { "@type": "Person", name: SITE.founder },
    address: {
      "@type": "PostalAddress",
      addressLocality: JURISDICTION.city,
      addressRegion: JURISDICTION.state,
      addressCountry: "IN",
    },
    areaServed: { "@type": "Country", name: "India" },
    audience: {
      "@type": "EducationalAudience",
      educationalRole: "student",
      audienceType: `Children aged ${SITE.ageRange.min}–${SITE.ageRange.max}`,
    },
    knowsLanguage: ["en", "ta"],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
