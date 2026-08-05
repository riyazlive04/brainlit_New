import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappHref } from "@/lib/site";

/**
 * The last thing on the page.
 *
 * Ink rather than white, and it is the only section besides Why Now that is.
 * That is what makes it read as an ending rather than as one more band — a
 * reader who has scrolled this far should be able to feel the page close.
 *
 * The headline is the brief's line, unchanged: it is the strongest sentence in
 * the whole document. The subhead does the honest work underneath it, because a
 * claim that large needs something concrete immediately after it or it reads as
 * advertising.
 */
export function FinalCta() {
  const whatsapp = whatsappHref();

  return (
    <section className="relative z-10 overflow-hidden bg-ink py-28 sm:py-36">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 70% 60% at 50% 120%, var(--color-violet), transparent 65%)," +
            "radial-gradient(ellipse 50% 40% at 50% -10%, var(--color-indigo), transparent 60%)",
        }}
      />

      <Container size="narrow" className="relative text-center">
        <Reveal>
          <h2 className="text-[length:var(--text-h1)] text-white">
            Give your child the one skill{" "}
            <span className="bg-brand-gradient-bright bg-clip-text text-transparent">
              AI can never replace
            </span>
            .
          </h2>

          <p className="mx-auto mt-7 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-mist/75">
            Start with the free session for parents. No pitch you have to sit
            through — see how we teach thinking, ask what you want to ask, then
            decide.
          </p>

          <div className="mt-11 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/webinar" variant="spark" size="lg">
              Reserve your free parent session
            </Button>
            {whatsapp && (
              <Button
                href={whatsapp}
                external
                size="lg"
                className="border border-white/25 bg-white/5 text-white backdrop-blur-sm hover:border-white/45 hover:bg-white/10"
              >
                Ask on WhatsApp
              </Button>
            )}
          </div>

          <p className="mt-7 text-sm text-mist/55">
            Free · Live online · For parents, not children
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
