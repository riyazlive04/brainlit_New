import { SceneMount } from "@/components/three/SceneMount";
import { Container } from "@/components/ui/Container";
import {
  HeroCopy,
  PhilosophyCopy,
  ProblemCopy,
} from "@/components/lab/LabCopy";

/**
 * Variant 2 — Stacked.
 *
 * The mark is lifted into the upper third and the copy sits beneath it with
 * clear air between. Keeps the logo centred and symmetrical, which is how a
 * logo wants to be seen, at the cost of vertical room.
 */
export default function StackedVariant() {
  return (
    <div data-three-zone className="relative">
      <SceneMount offsetY={1.15} scale={0.72} />

      <section className="relative z-10 flex min-h-[100svh] items-end pb-[12vh]">
        <Container className="text-center">
          <HeroCopy align="center" />
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-end pb-[14vh]">
        <Container size="narrow" className="text-center">
          <ProblemCopy />
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-end pb-[14vh]">
        <Container size="narrow" className="text-center">
          <PhilosophyCopy />
        </Container>
      </section>
    </div>
  );
}
