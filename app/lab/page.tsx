import Link from "next/link";
import { Container } from "@/components/ui/Container";

const VARIANTS = [
  {
    href: "/lab/split",
    title: "1 · Split",
    summary:
      "Copy holds the left column, the mark holds the right. Nothing ever overlaps.",
    tradeoff:
      "Safest and most readable. Familiar — it is what most 3D product sites do.",
  },
  {
    href: "/lab/stacked",
    title: "2 · Stacked",
    summary:
      "The mark sits above, the copy sits below it. Full-width text, clear air between them.",
    tradeoff:
      "Keeps the mark centred and symmetrical, which suits a logo. Costs vertical space.",
  },
  {
    href: "/lab/scrim",
    title: "3 · Scrim",
    summary:
      "The mark stays centred behind the copy, but each text block sits on a soft white card.",
    tradeoff:
      "Most dramatic — the brain stays the focus. The cards are a visible admission that text and particles are fighting.",
  },
  {
    href: "/lab/aside",
    title: "4 · Quiet aside",
    summary:
      "The mark shrinks and moves to the edge as an accent. Copy leads.",
    tradeoff:
      "Best for reading and conversion. The 3D becomes atmosphere rather than spectacle.",
  },
];

export default function LabIndex() {
  return (
    <Container size="default" className="py-20">
      <h1 className="text-[length:var(--text-h1)] text-ink">
        Four ways to stop the text fighting the brain
      </h1>
      <p className="mt-5 max-w-2xl text-[length:var(--text-lead)] leading-relaxed text-slate">
        Same words, same scene, same scroll beats in all four. Only the
        arrangement changes. Scroll each one properly — the problem only shows
        up in the second and third screens, where body copy currently lands on
        top of the particles.
      </p>

      <ul className="mt-12 grid gap-5 sm:grid-cols-2">
        {VARIANTS.map((v) => (
          <li key={v.href}>
            <Link
              href={v.href}
              className="block h-full rounded-2xl border border-mist p-6 transition-colors hover:border-violet/40 hover:bg-mist/30"
            >
              <h2 className="font-display text-[length:var(--text-h3)] font-semibold text-ink">
                {v.title}
              </h2>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-slate">
                {v.summary}
              </p>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-violet">
                {v.tradeoff}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
