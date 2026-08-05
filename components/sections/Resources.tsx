import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/ui/Reveal";
import { NewsletterForm } from "@/components/forms/NewsletterForm";
import { RESOURCES } from "@/content/home";

/**
 * Free guides and the newsletter, in one band.
 *
 * The newsletter always renders; the guides appear as they are written. That
 * ordering is deliberate — a subscribe box alone reads as a request, whereas a
 * subscribe box next to something already given away reads as an exchange.
 *
 * NEEDS INPUT: each entry in RESOURCES needs a real file at its `href`. A guide
 * listed here that 404s is the first promise we make to a parent, broken.
 *
 * Note what this does NOT do: gate the downloads behind an email. The brief
 * asked to "exchange for email signup". Gating is standard practice and it does
 * work, but it also means a parent looking for a screen-time checklist has to
 * hand over contact details to a company they have never heard of. Given the
 * audience and that everything else on this site is built on not doing that,
 * the guides are free and the subscribe box sits beside them. Easy to change if
 * the client wants it the other way — it is one link swap per resource.
 */
export function Resources() {
  const hasResources = RESOURCES.length > 0;

  return (
    <section className="relative z-10 bg-mist/30 py-24 sm:py-32">
      <Container>
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-20">
          {/* ------------------------------------------------------- Guides */}
          <div>
            <Reveal className="max-w-xl">
              <p className="font-display text-sm font-medium tracking-[0.2em] text-violet uppercase">
                Free for any parent
              </p>
              <h2 className="mt-5 text-[length:var(--text-h2)] text-ink">
                {hasResources
                  ? "Take these, whether or not you ever enrol."
                  : "Useful things, on the way."}
              </h2>
            </Reveal>

            {hasResources ? (
              <ul className="mt-12 grid gap-4 sm:grid-cols-2">
                {RESOURCES.map((resource, i) => (
                  <Reveal as="li" key={resource.href} delay={i * 60}>
                    <a
                      href={resource.href}
                      className="group flex h-full flex-col rounded-2xl border border-mist bg-paper p-6 transition-colors hover:border-violet/40"
                    >
                      <h3 className="font-display text-[1.0625rem] font-semibold text-ink group-hover:text-indigo">
                        {resource.title}
                      </h3>
                      <p className="mt-2.5 flex-1 text-[0.95rem] leading-relaxed text-slate">
                        {resource.body}
                      </p>
                      <p className="mt-5 flex items-center gap-2 text-sm font-medium text-violet">
                        Download
                        {resource.meta && (
                          <span className="font-normal text-slate">
                            · {resource.meta}
                          </span>
                        )}
                      </p>
                    </a>
                  </Reveal>
                ))}
              </ul>
            ) : (
              <Reveal className="mt-8 max-w-xl">
                <p className="text-[0.975rem] leading-relaxed text-slate">
                  We are writing a short set of guides for parents — on AI at
                  home, on screen time, on the questions worth asking your
                  child. They will be free and they will not ask for anything in
                  return. Subscribe and you will get them as they land.
                </p>
              </Reveal>
            )}
          </div>

          {/* --------------------------------------------------- Newsletter */}
          <Reveal
            delay={80}
            className="self-start rounded-3xl border border-mist bg-paper p-7 sm:p-8"
          >
            <h2 className="font-display text-[length:var(--text-h3)] text-ink">
              The AI parenting newsletter
            </h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-slate">
              Once a week. What actually changed in AI, what it means for a
              child, and what to do about it — in plain language, no jargon.
            </p>

            <NewsletterForm source="home" className="mt-6" />

            <p className="mt-4 text-sm leading-relaxed text-slate">
              Your email is used for the newsletter and nothing else. Unsubscribe
              in one click, any time.
            </p>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
