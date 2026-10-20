// Navigation shared by the router (app.js) and the screens.
export const nav = { replacing: false };

/** Shows `hash` in place of the current screen, without a new history entry (Back skips it). */
export function replaceHash(hash) {
  if (location.hash === hash) return;
  nav.replacing = true;
  location.replace(hash);
}
