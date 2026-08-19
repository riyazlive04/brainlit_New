import { SITE, SOCIAL_LINKS } from "@/lib/site";
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
      audienceType: `Children aged ${SITE.ageRange.min}-${SITE.ageRange.max}`,
    },
    knowsLanguage: ["en", "ta"],

    /**
     * The accounts that are also us.
     *
     * `sameAs` is the property that ties this domain to those profiles as ONE
     * entity rather than several that happen to share a name. It is what a
     * knowledge panel is assembled from, and it is the difference between a
     * search engine inferring the relationship from an outbound link and being
     * told it.
     *
     * The WhatsApp group is in the list and belongs there. It is not a profile
     * in the usual sense, but the property's own definition is "a URL for the
     * entity's official presence" rather than "a social network".
     */
    sameAs: SOCIAL_LINKS.map((link) => link.href),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
