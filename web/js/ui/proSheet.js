// The Pro sheet (MONETIZATION-PLAN.md): over the screen, opened only by a tap on something that is Pro, with one line
// saying why. What Pro opens, its price (Google Play's, in the player's currency), Buy and Restore (kept in view at the
// sheet's foot on small phones, QA round 19), a thank-you once owned. Escape, ✕, a tap outside or Back close it (its
// own history entry, as the picker's). `then`: what the tap was for, done after a purchase ("Let's play"); `cancel`:
// done when it closes without one (a picker opens again where it was).
import { h, icon, toast, heart } from './dom.js';
import { EXERCISES } from '../curriculum/index.js';
import { LESSONS } from '../course/data.js';
import { PRO_ID, PRICE, placeholder, proSub, FREE_LEVELS, FREE_TASTE, owned, proContents, PLAY } from '../pro.js';
import { buy, prices, restorePro, canBuy } from '../billing.js';

let openNow = null;

/** The free part, in one line (the sheet, Settings' Pro ⓘ, About's terms). */
export const FREE_LINE = `Levels 1–${FREE_LEVELS} of the course and the Library, ${FREE_TASTE} lessons of each later stage to try, the tuner, the whole metronome, and the Practice room's starter set: 3 drum patterns of each genre, the Pop & rock and Blues progressions, My progression, the drone (its root and 5th or octave, the triads, the five basic 7th chords and their spread and shell voicings) and the Neck`;

/** Runs `fn` once the sheet's history entry is gone (its own Back has landed), or at once when there was none. */
function afterBack(wentBack, fn) {
  if (!fn) return;
  if (!wentBack) { fn(); return; }
  let done = false;
  const go = () => { if (!done) { done = true; fn(); } };
  addEventListener('popstate', () => setTimeout(go, 0), { once: true });
  setTimeout(go, 400);
}

export function openPro(reason = '', { then, cancel } = {}) {
  if (openNow) openNow();
  const c = proContents(EXERCISES, LESSONS);
  const body = h('div', { class: 'pro-body' });
  const foot = h('div', { class: 'pro-foot' });
  const closeBtn = h('button', { class: 'icon-btn picker-close', type: 'button', 'aria-label': 'Close', html: icon('close') });
  const panel = h('div', { class: 'picker pro-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'BassClass Pro', tabindex: '-1' },
    h('div', { class: 'picker-head' }, h('h2', {}, '⭐ BassClass Pro'), h('div', { class: 'grow' }), closeBtn), body, foot);
  const backdrop = h('div', { class: 'picker-backdrop pro-backdrop' }, panel);
  let price = placeholder(PRICE);
  let busy = false;
  let bought = false;

  const thanks = () => {
    bought = true;
    body.replaceChildren(
      h('p', { class: 'pro-why' }, '🎉 Thank you!'),
      h('p', {}, 'BassClass Pro is yours, for good: every level, every pattern and progression, every sound and drone chord, and the new content we add to them.'));
    foot.replaceChildren(h('div', { class: 'row pro-actions' }, h('button', { class: 'btn primary', type: 'button', onClick: () => close(undefined, then) }, 'Let\'s play')));
  };

  const offer = (msg = '') => {
    const buyBtn = h('button', { class: 'btn pro-cta pro-buy', type: 'button', disabled: busy || !canBuy() },
      h('span', { class: 'pro-cta-top' }, busy ? 'One moment…' : '⭐ Get BassClass Pro'),
      h('span', { class: 'pro-cta-sub' }, proSub(price)));
    const restore = h('button', { class: 'btn', type: 'button', disabled: busy || !canBuy() }, 'Restore purchase');
    buyBtn.addEventListener('click', async () => {
      if (busy) return;
      busy = true; offer();
      const r = await buy(PRO_ID);
      busy = false;
      if (closed) return;
      if (r === 'ok' || r === 'owned') { thanks(); return; }
      offer({
        pending: '⏳ Your purchase is pending: Pro opens as soon as Google Play completes it.',
        cancel: '',
        error: '⚠ Google Play could not complete it. Try again in a moment.',
      }[r] ?? '');
    });
    restore.addEventListener('click', async () => {
      if (busy) return;
      busy = true; offer();
      const r = await restorePro();
      busy = false;
      if (closed) return;
      if (r === 'owned') { thanks(); return; }
      // (Google Play not reached is not "never bought": QA round 19)
      offer(r === 'error' ? '⚠ Google Play could not be reached. Check the connection and try again.' : 'No purchase of Pro was found on this Google account.');
    });
    body.replaceChildren(...[
      reason ? h('p', { class: 'pro-why' }, `🔒 ${reason}`) : null,
      h('ul', { class: 'pro-list' },
        h('li', {}, `🎓 Levels ${FREE_LEVELS + 1}–6: ${c.les} more lessons and ${c.ex} more exercises (${c.songs} of them song-style studies)`),
        h('li', {}, `🥁 All ${c.styles} drum patterns, and fills`),
        h('li', {}, '🎹 Every progression (soul, jazz, minor, vamps…)'),
        h('li', {}, '🎸 The Piano, Organ and Guitar sounds'),
        h('li', {}, '🎵 Every drone chord: 6ths and added notes, 9ths to 13ths, altered dominants, voicings in 4ths'),
        h('li', {}, '✨ The new content we add to them')),
      h('p', { class: 'muted small' }, `Free for good: ${FREE_LINE}. No subscription, no ads.`),
      msg ? h('p', { class: 'pro-msg' }, msg) : null,
      canBuy() ? null : h('p', { class: 'pro-msg' }, PLAY ? 'Google Play is not available on this phone.' : 'Buying works in the app from Google Play.'),
    ].filter(Boolean));
    foot.replaceChildren(h('div', { class: 'row pro-actions' }, buyBtn, restore));
  };

  // Back (Android's, or the browser's) closes it and stays on the screen
  history.pushState({ ...(history.state || {}), picker: true }, '');
  const onPop = () => close('back', bought ? null : cancel);
  addEventListener('popstate', onPop);
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(undefined, bought ? null : cancel); } };
  document.addEventListener('keydown', onKey, true);
  closeBtn.addEventListener('click', () => close(undefined, bought ? null : cancel));
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(undefined, bought ? null : cancel); });
  let closed = false;
  function close(how, after) {
    if (closed) return;
    closed = true;
    openNow = null;
    backdrop.remove();
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('popstate', onPop);
    removeEventListener('bassclass-pro', onPro);
    const back = !how && !!history.state?.picker;
    if (back) history.back();
    afterBack(back, after);
  }
  openNow = () => close();
  // (Pro arrived while the sheet is open, unasked: a pending purchase completed, or a slow one after all)
  const onPro = () => { if (!closed && !bought && owned()) thanks(); };
  addEventListener('bassclass-pro', onPro);
  document.body.append(backdrop);
  if (owned()) thanks(); else offer();
  panel.focus({ preventScroll: true });
  // the price in the player's currency
  prices().then((p) => { if (closed || !p[PRO_ID]) return; price = p[PRO_ID]; if (!owned() && !busy) offer(); }).catch(() => {});
  return close;
}

/** A tip (Settings: Support BassClass): it unlocks nothing; one at a time (QA round 19: three quick taps bought three). */
let tipping = false;
export async function tip(id) {
  if (tipping) return;
  tipping = true;
  try {
    const r = await buy(id, true);
    if (r === 'ok') toast(h('span', { class: 'toast-heart' }, 'Thank you for the tip! ', heart()), 2500);
    else if (r === 'pending') toast('Your tip is pending with Google Play', 2500);
    else if (r === 'error') toast('Google Play could not complete it. Try again.', 2500);
  } finally {
    tipping = false;
  }
}
