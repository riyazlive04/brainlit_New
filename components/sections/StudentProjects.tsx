import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { PROJECTS } from "@/content/home";

/**
 * Student project showcase.
 *
 * Renders nothing while `PROJECTS` is empty. Beyond the honesty problem, this
 * section carries a legal one: publishing a child's work is processing a
 * child's personal data, which under India's DPDP Act 2023 requires verifiable
 * parental consent. Children are shown as first name and age only — never a
 * full name, school or photograph.
 */
export function StudentProjects() {
  if (PROJECTS.length === 0) return null;

  return (
    <section className="relative z-10 bg-paper py-24 sm:py-32">
      <Container>
        <Reveal className="max-w-2xl">
          <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
            Student work
          </p>
          <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
            What a ten-year-old builds when you teach them to think first.
          </h2>
        </Reveal>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <Reveal as="li" key={project.title} delay={i * 80}>
              <article className="h-full rounded-2xl border border-mist p-7 transition-colors hover:border-violet/35">
                <h3 className="font-display text-[length:var(--text-h3)] text-ink">
                  {project.title}
                </h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
                  {project.summary}
                </p>
                <p className="mt-5 text-sm font-medium text-violet">
                  {project.studentFirstName}, age {project.age}
                </p>
              </article>
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
