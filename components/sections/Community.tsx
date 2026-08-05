import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { COMMUNITY } from "@/content/home";

/**
 * The parent WhatsApp community.
 *
 * Hidden until NEXT_PUBLIC_WHATSAPP_COMMUNITY_URL is set. A "join our
 * community" section with a dead button is worse than no section: it is the
 * first thing a parent tries that does not work.
 *
 * The "no selling, leave whenever" line stays. A parent's real objection to a
 * WhatsApp group is not whether it is useful — it is whether it will become a
 * sales channel with their number in it.
 */
export function Community() {
  if (!COMMUNITY.inviteUrl) return null;

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container size="default">
        <Reveal className="overflow-hidden rounded-3xl border border-mist">
          <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)] lg:items-center lg:gap-16">
            <div>
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                Community
              </p>
              <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
                {COMMUNITY.heading}
              </h2>
              <p className="mt-5 text-[length:var(--text-lead)] leading-relaxed text-slate">
                {COMMUNITY.body}
              </p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                {COMMUNITY.benefits.map((benefit) => (
                  <li key={benefit} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-brand-gradient"
                    />
                    <span className="text-[0.95rem] leading-relaxed text-slate">
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:text-center">
              <Button
                href={COMMUNITY.inviteUrl}
                external
                variant="solid"
                size="lg"
                className="w-full sm:w-auto"
              >
                Join the group
              </Button>
              <p className="mt-4 text-sm leading-relaxed text-slate">
                Opens WhatsApp. Your number is visible to other members of the
                group, as in any WhatsApp community.
              </p>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
