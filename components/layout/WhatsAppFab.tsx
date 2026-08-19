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
export function WhatsAppFab() {
  const community = SOCIAL_LINKS.find((link) => link.key === "whatsapp");
  // Same contract as every other link on the site: nothing renders if there is
  // nowhere for it to go.
  if (!community) return null;

  return (
    <a
      href={community.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Join the BrainLIT parent community on WhatsApp"
      className="fixed right-[max(1rem,env(safe-area-inset-right))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full bg-[#25D366] text-white shadow-lg shadow-black/15 transition-transform duration-200 [transition-timing-function:var(--ease-out-expo)] hover:scale-105 focus-visible:scale-105"
    >
      {/* `current`, not `brand`: the brand green is already the button, and a
          green glyph on it would be a green circle with a hole in it. */}
      <SocialIcon network="whatsapp" tone="current" className="size-7" />
    </a>
  );
}
