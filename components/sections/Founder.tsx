import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { FOUNDER } from "@/content/home";

/**
 * Founder.
 *
 * Parents buying education want to know who is behind it. The quote is written
 * from the mission in the discovery document and should be replaced with the
 * founder's own words; the photograph and bio are still outstanding, and the
 * layout adapts rather than showing a placeholder avatar.
 */
export function Founder() {
  return (
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container size="default">
        <Reveal className="grid items-center gap-12 md:grid-cols-[auto_1fr]">
          {FOUNDER.photoUrl && (
            <Image
              src={FOUNDER.photoUrl}
              alt={`${FOUNDER.name}, ${FOUNDER.role} of BrainLIT`}
              width={200}
              height={200}
              className="size-40 rounded-full object-cover sm:size-48"
            />
          )}

          <div>
            <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
              Who is behind this
            </p>

            <blockquote className="mt-6 font-display text-[length:var(--text-h3)] leading-snug font-medium text-ink">
              “{FOUNDER.quote}”
            </blockquote>

            {FOUNDER.bio && (
              <p className="mt-6 max-w-2xl text-[0.975rem] leading-relaxed text-slate">
                {FOUNDER.bio}
              </p>
            )}

            <p className="mt-6 text-sm text-slate">
              <span className="font-display font-semibold text-ink">
                {FOUNDER.name}
              </span>
              {" · "}
              {FOUNDER.role}
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
