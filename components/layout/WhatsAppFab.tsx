import { SocialIcon } from "@/components/brand/SocialIcon";
import { SOCIAL_LINKS } from "@/lib/site";

/**
 * The floating WhatsApp button, bottom right of every marketing page.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * IT GOES TO THE PARENT COMMUNITY, not to a sales chat. That is the whole
 * difference between this and the sticky bar that used to live down here: this
 * one asks a parent to join a group of other parents, which is a smaller ask
 * than booking a session and a much smaller one than enrolling.
 *
 * `z-40`, and the reason is not cosmetic. The homepage mounts a `fixed inset-0
 * z-0` canvas that never unmounts, and a positioned z-0 element paints above a
 * static one wherever it sits in the document — that canvas has already
 * swallowed the entire footer once. Everything that has to stay clickable over
 * it carries an explicit z-index; see the note in SiteFooter.
 *
 * Bottom right rather than bottom left because the dev-tools indicator lives
 * bottom left in development, and because a right-hand thumb reaches it. The
 * padding is `env(safe-area-inset-*)` so it clears the iOS home indicator
 * rather than sitting under it.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rendered from the marketing layout, so it is on every page in that group. It
 * is deliberately NOT on /webinar: that route sits outside the group, has no
 * header and no footer, and is built as a distraction-free landing page whose
 * one job is the form. A floating button offering somewhere else to go is
 * exactly the distraction it was stripped of.
 */
/**
 * The words on the button.
 *
 * NOT `SOCIAL_LINKS[whatsapp].label`, which is "WhatsApp community" and is the
 * footer's Connect entry. That one is a NAME sitting in a list of other names,
 * where "Join our" would read as an instruction shouted in a directory. This
 * one is a call to action floating over a page. Same destination, two jobs, and
 * borrowing the shared string would have changed the footer to match.
 */
const FAB_LABEL = "Join our WhatsApp community";

export function WhatsAppFab() {
  const community = SOCIAL_LINKS.find((link) => link.key === "whatsapp");
  // Same contract as every other link on the site: nothing renders if there is
  // nowhere for it to go.
  if (!community) return null;

  return (
    /**
     * NO `aria-label` ANY MORE, and that is the fix rather than an omission.
     *
     * It used to read "Join the BrainLIT parent community on WhatsApp" over a
     * button with no text at all, which was right when the button was a bare
     * circle. Now that the words are on screen, an aria-label OVERRIDES them -
     * and WCAG 2.5.3 (Label in Name) asks that the accessible name contain the
     * visible text, so somebody using voice control can say what they can see.
     * "Click join our WhatsApp community" would have matched nothing.
     *
     * Letting the visible label be the accessible name keeps the two identical
     * by construction, which is the only version that cannot drift.
     */
    <a
      href={community.href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 inline-flex items-center justify-end gap-2 rounded-full transition-transform duration-200 [transition-timing-function:var(--ease-out-expo)] hover:scale-105 focus-visible:scale-105"
    >
      {/* THE WORDS GET A PLATE, exactly as the chat launcher's do and for the
          same reason: this floats over both halves of the page, and text with
          nothing behind it has no fixed contrast. `text-ink` rather than the
          brand gradient - that gradient is the BrainLIT wordmark's own, and
          lending it to an outbound link would say this is us when it is a
          WhatsApp group.

          `text-sm`, where the launcher is 1.05rem: this string is twenty-seven
          characters against its thirteen, and at the larger size the pill plus
          the circle overflows a 320px phone. */}
      <span className="rounded-full bg-paper/92 px-3 py-1.5 text-sm leading-none font-semibold whitespace-nowrap text-ink shadow-[0_2px_8px_-2px_rgba(11,16,32,0.25)] ring-1 ring-mist/70 backdrop-blur-sm">
        {FAB_LABEL}
      </span>

      {/* `shrink-0`: the pill is the flexible one. Without this the circle is
          what gives way on a narrow screen, and a squashed WhatsApp mark reads
          as a rendering fault rather than a tight fit. */}
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15"
      >
        {/* `current`, not `brand`: the brand green is already the button, and a
            green glyph on it would be a green circle with a hole in it. */}
        <SocialIcon network="whatsapp" tone="current" className="size-7" />
      </span>
    </a>
  );
}
