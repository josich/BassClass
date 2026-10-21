// Navigation shared by the router (app.js) and the screens.
// depth: how many screens deep the current one is (set by the router); returning: the screen was
// reached with Back/Forward
export const nav = { replacing: false, backing: false, depth: -1, returning: false };

/**
 * Is there an in-app screen to go back to? A screen opened a moment ago may not have its depth yet
 * (the router tags it when the hashchange runs): then there is one behind it, unless it replaced
 * the current screen.
 */
export function canGoBack() {
  const d = history.state?.depth;
  if (typeof d === 'number') return d > 0;
  return nav.replacing ? nav.depth > 0 : nav.depth >= 0;
}

/** Shows `hash` in place of the current screen, without a new history entry (Back skips it). */
export function replaceHash(hash) {
  if (location.hash === hash) return;
  nav.replacing = true;
  location.replace(hash);
}

/**
 * Goes back one screen. Until the previous screen is shown, presses are ignored: a screen opened
 * while Back is still on its way would get the wrong depth (QA round 9), and a second tap on Back
 * cannot go two screens back.
 */
export function goBack() {
  if (nav.backing) return;
  nav.backing = true;
  const block = (e) => { e.preventDefault(); e.stopPropagation(); };
  const done = () => {
    nav.backing = false;
    clearTimeout(timer);
    window.removeEventListener('hashchange', done);
    document.removeEventListener('click', block, true);
  };
  const timer = setTimeout(done, 1000);
  window.addEventListener('hashchange', done);
  document.addEventListener('click', block, true);
  history.back();
}
