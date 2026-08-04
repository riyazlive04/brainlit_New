/**
 * Minimal class-name joiner.
 *
 * Deliberately not `clsx` + `tailwind-merge`: this project ships a very small,
 * disciplined set of components and does not need conflict resolution. Adding
 * two dependencies to the client bundle to save a few characters is a bad trade
 * on a site whose primary audience is on 4G.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
