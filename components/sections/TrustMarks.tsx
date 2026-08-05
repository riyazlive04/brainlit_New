import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { TRUST_MARKS, type TrustMark } from "@/content/home";

/**
 * Featured in, partner schools, guest talks, awards.
 *
 * SHIPS EMPTY and renders nothing until real entries exist. Of everything on
 * this page this is the one section where an invented item is not merely
 * dishonest but actionable — every entry is a claim about a third party who did
 * not agree to appear here.
 *
 * The brief suggested leaving visible placeholders. That is a common pattern
 * and it is the wrong call for this audience: a row of grey boxes labelled
 * "Featured in" tells a parent either that we are pretending, or that nobody
 * has covered us and we would rather they did not notice. Silence says less.
 */

const GROUPS: { kind: TrustMark["kind"]; heading: string }[] = [
  { kind: "media", heading: "Featured in" },
  { kind: "school", heading: "Partner schools" },
  { kind: "talk", heading: "Guest talks" },
  { kind: "award", heading: "Recognition" },
];

export function TrustMarks() {
  if (TRUST_MARKS.length === 0) return null;

  const present = GROUPS.map((group) => ({
    ...group,
    items: TRUST_MARKS.filter((mark) => mark.kind === group.kind),
  })).filter((group) => group.items.length > 0);

  return (
    <section className="relative z-10 border-y border-mist bg-paper py-16 sm:py-20">
      <Container>
        <h2 className="sr-only">Where BrainLIT has appeared</h2>

        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {present.map((group, i) => (
            <Reveal key={group.kind} delay={i * 70}>
              <h3 className="font-display text-xs font-semibold tracking-[0.16em] text-slate uppercase">
                {group.heading}
              </h3>
              <ul className="mt-5 space-y-2.5">
                {group.items.map((mark) => (
                  <li key={mark.label}>
                    {mark.url ? (
                      <a
                        href={mark.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display text-[0.975rem] font-semibold text-ink hover:text-indigo hover:underline"
                      >
                        {mark.label}
                      </a>
                    ) : (
                      <span className="font-display text-[0.975rem] font-semibold text-ink">
                        {mark.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
