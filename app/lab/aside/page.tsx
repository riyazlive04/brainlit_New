import { SceneMount } from "@/components/three/SceneMount";
import { Container } from "@/components/ui/Container";
import {
  HeroCopy,
  PhilosophyCopy,
  ProblemCopy,
} from "@/components/lab/LabCopy";

/**
 * Variant 4 — Quiet aside.
 *
 * The mark shrinks and retreats to the right edge, becoming atmosphere rather
 * than spectacle. The copy leads and reads at full strength.
 *
 * This is the version that most respects the audience: parents skimming on a
 * phone, deciding in seconds whether this is worth their child's time. The 3D
 * still signals "these people are serious about technology" without asking to
 * be admired first.
 */
export default function AsideVariant() {
  return (
    <div data-three-zone className="relative">
      <SceneMount offsetX={2.35} offsetY={0.25} scale={0.62} />

      <section className="relative z-10 flex min-h-[100svh] items-center">
        <Container size="wide">
          <div className="max-w-2xl">
            <HeroCopy align="left" />
            <p className="mt-6 text-sm text-slate">
              Live online · Small batches · For parents in Chennai and across
              India
            </p>
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="wide">
          <div className="max-w-2xl">
            <ProblemCopy />
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="wide">
          <div className="max-w-2xl">
            <PhilosophyCopy />
          </div>
        </Container>
      </section>
    </div>
  );
}
