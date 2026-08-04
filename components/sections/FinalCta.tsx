import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";
import { whatsappHref } from "@/lib/site";

export function FinalCta() {
  const whatsapp = whatsappHref();

  return (
    <section className="relative z-10 border-t border-mist bg-paper py-24 sm:py-32">
      <Container size="narrow" className="text-center">
        <Reveal>
          <h2 className="text-[length:var(--text-h2)] text-ink">
            Start with a free session for parents.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[length:var(--text-lead)] leading-relaxed text-slate">
            No pitch you have to sit through. See how we teach thinking, ask
            what you want to ask, then decide.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button href="/webinar" variant="spark" size="lg">
              Reserve your free seat
            </Button>
            {whatsapp && (
              <Button href={whatsapp} external variant="outline" size="lg">
                Ask on WhatsApp
              </Button>
            )}
          </div>

          <p className="mt-6 text-sm text-slate">
            Free · Live online · For parents, not children
          </p>
        </Reveal>
      </Container>
    </section>
  );
}
