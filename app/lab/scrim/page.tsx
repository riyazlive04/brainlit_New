import { SceneMount } from "@/components/three/SceneMount";
import { Container } from "@/components/ui/Container";
import {
  HeroCopy,
  PhilosophyCopy,
  ProblemCopy,
} from "@/components/lab/LabCopy";

/**
 * Variant 3 — Scrim.
 *
 * The mark keeps the centre. Copy sits on a translucent white card so it stays
 * legible over the particles.
 *
 * The card is doing real work: contrast against a moving stipple field cannot
 * be guaranteed by colour alone, because every particle that drifts behind a
 * letter changes the local background. A scrim makes the guarantee structural.
 * It is also, visibly, a compromise — the other three variants avoid the
 * collision instead of covering it.
 */
export default function ScrimVariant() {
  return (
    <div data-three-zone className="relative">
      <SceneMount scale={1.05} />

      <section className="relative z-10 flex min-h-[100svh] items-center">
        <Container className="text-center">
          <div className="rounded-[2rem] bg-white/80 px-6 py-12 backdrop-blur-md sm:px-12">
            <HeroCopy align="center" />
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="narrow" className="text-center">
          <div className="rounded-[2rem] bg-white/80 px-6 py-12 backdrop-blur-md sm:px-10">
            <ProblemCopy />
          </div>
        </Container>
      </section>

      <section className="relative z-10 flex min-h-[90svh] items-center">
        <Container size="narrow" className="text-center">
          <div className="rounded-[2rem] bg-white/80 px-6 py-12 backdrop-blur-md sm:px-10">
            <PhilosophyCopy />
          </div>
        </Container>
      </section>
    </div>
  );
}
