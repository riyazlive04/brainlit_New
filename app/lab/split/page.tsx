import { SceneMount } from "@/components/three/SceneMount";
import { Container } from "@/components/ui/Container";
import {
  HeroCopy,
  PhilosophyCopy,
  ProblemCopy,
} from "@/components/lab/LabCopy";

/**
 * Variant 1 — Split.
 *
 * The mark is pushed into the right half of the viewport and the copy occupies
 * the left. Text and particles never share the same pixels, so readability is
 * guaranteed rather than negotiated.
 */
export default function SplitVariant() {
  return (
    <div data-three-zone className="relative">
      <SceneMount offsetX={1.55} scale={0.92} />

      <section className="relative z-10 flex min-h-[100svh] items-center">
        <Container size="wide">
          <div className="max-w-xl lg:max-w-2xl">
            <HeroCopy align="left" />
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="wide">
          <div className="max-w-xl">
            <ProblemCopy />
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="wide">
          <div className="max-w-xl">
            <PhilosophyCopy />
          </div>
        </Container>
      </section>
    </div>
  );
}
