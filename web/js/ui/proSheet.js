// The Pro sheet (MONETIZATION-PLAN.md): over the screen, opened only by a tap on something that is Pro, with one line
// saying why. What Pro opens, its price (Google Play's, in the player's currency), Buy and Restore; a thank-you once
// owned. Escape, ✕, a tap outside or Back close it (its own history entry, as the picker's).
import { h, icon, toast } from './dom.js';
import { EXERCISES } from '../curriculum/index.js';
import { LESSONS } from '../course/data.js';
import { PRO_ID, PRICE, FREE_LEVELS, owned, proContents, PLAY } from '../pro.js';
import { buy, prices, syncPro, canBuy } from '../billing.js';

let openNow = null;

export function openPro(reason = '') {
  if (openNow) openNow();
  const c = proContents(EXERCISES, LESSONS);
  const body = h('div', { class: 'pro-body' });
  const closeBtn = h('button', { class: 'icon-btn picker-close', type: 'button', 'aria-label': 'Close', html: icon('close') });
  const panel = h('div', { class: 'picker pro-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'BassClass Pro', tabindex: '-1' },
    h('div', { class: 'picker-head' }, h('h2', {}, '⭐ BassClass Pro'), h('div', { class: 'grow' }), closeBtn), body);
  const backdrop = h('div', { class: 'picker-backdrop pro-backdrop' }, panel);
  let price = PRICE;
  let busy = false;

  const thanks = () => body.replaceChildren(
    h('p', { class: 'pro-why' }, '🎉 Thank you!'),
    h('p', {}, 'BassClass Pro is yours, for good: every level, every pattern and progression, every sound, and everything we add.'),
    h('div', { class: 'row pro-actions' }, h('button', { class: 'btn primary', type: 'button', onClick: () => close() }, 'Let\'s play')));

  const offer = (msg = '') => {
    const buyBtn = h('button', { class: 'btn pro-cta pro-buy', type: 'button', disabled: busy || !canBuy() },
      h('span', { class: 'pro-cta-top' }, busy ? 'One moment…' : '⭐ Get BassClass Pro'),
      h('span', { class: 'pro-cta-sub' }, `${price} · one payment, yours for good`));
    const restore = h('button', { class: 'btn', type: 'button', disabled: busy || !canBuy() }, 'Restore purchase');
    buyBtn.addEventListener('click', async () => {
      busy = true; offer();
      const r = await buy(PRO_ID);
      busy = false;
      if (r === 'ok' || r === 'owned') { thanks(); return; }
      offer({
        pending: '⏳ Your purchase is pending: Pro opens as soon as Google Play completes it.',
        cancel: '',
        error: '⚠ Google Play could not complete it. Try again in a moment.',
      }[r] ?? '');
    });
    restore.addEventListener('click', async () => {
      busy = true; offer();
      const on = await syncPro({ force: true });
      busy = false;
      if (on && owned()) { thanks(); return; }
      offer('No purchase of Pro was found on this Google account.');
    });
    body.replaceChildren(...[
      reason ? h('p', { class: 'pro-why' }, `🔒 ${reason}`) : null,
      h('ul', { class: 'pro-list' },
        h('li', {}, `🎓 Levels ${FREE_LEVELS + 1}–6: ${c.les} more lessons and ${c.ex} more exercises, with their song studies`),
        h('li', {}, `🥁 All ${c.styles} drum patterns, and fills`),
        h('li', {}, '🎹 Every progression (jazz, minor, vamps…) and My progression'),
        h('li', {}, '🎸 The Piano, Organ and Guitar sounds'),
        h('li', {}, '✨ Everything we add next')),
      h('p', { class: 'muted small' }, `Levels 1–${FREE_LEVELS}, the tuner and the metronome stay free. One payment, yours for good: no subscription, no ads.`),
      msg ? h('p', { class: 'pro-msg' }, msg) : null,
      canBuy() ? null : h('p', { class: 'pro-msg' }, PLAY ? 'Google Play is not available on this phone.' : 'Buying works in the app from Google Play.'),
      h('div', { class: 'row pro-actions' }, buyBtn, restore)].filter(Boolean));
  };

  // Back (Android's, or the browser's) closes it and stays on the screen
  history.pushState({ ...(history.state || {}), picker: true }, '');
  const onPop = () => close('back');
  addEventListener('popstate', onPop);
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
  document.addEventListener('keydown', onKey, true);
  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  let closed = false;
  function close(how) {
    if (closed) return;
    closed = true;
    openNow = null;
    backdrop.remove();
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('popstate', onPop);
    if (!how && history.state?.picker) history.back();
  }
  openNow = () => close();
  document.body.append(backdrop);
  if (owned()) thanks(); else offer();
  panel.focus({ preventScroll: true });
  // the price in the player's currency
  prices().then((p) => { if (closed || !p[PRO_ID]) return; price = p[PRO_ID]; if (!owned() && !busy) offer(); }).catch(() => {});
  return close;
}

/** A tip (Settings: Support BassClass): it unlocks nothing. */
export async function tip(id) {
  const r = await buy(id, true);
  if (r === 'ok') toast('Thank you for the tip! 💛', 2500);
  else if (r === 'pending') toast('Your tip is pending with Google Play', 2500);
  else if (r === 'error') toast('Google Play could not complete it. Try again.', 2500);
}
