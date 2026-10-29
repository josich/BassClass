// The rate reminder (user, 2026-10-28: "a couple of times separated by hours of use: after 10 h, then after 20 h,
// always at the end of an event, not in the middle of something running; 5 stars and a short text"): once the
// practice log holds 10 hours of playing, and again at 20, a card asks for a rating on Google Play, shown only when
// the player has just finished something (left an exercise or the Practice room, or ticked ✓ Practised), never
// while anything plays or another sheet is open. The five stars are a picture, not a choice (launch legal review,
// 2026-10-28: stars that look like an input but all do the same); its one button opens the Play Store page (no
// filtering of ratings, as Google asks). Rated, it never asks again; "Not now" waits for the next mark. Only
// where there is a Play listing to rate (the Play build, or the gates switched on for testing: Settings' debug
// panel shows it at once, and resets it).
// In the Android app the mark opens Google Play's own rating card instead (in-app review, user 2026-10-28: "add
// the in-app review card"; `BassClassNative.requestReview`), with nothing of ours before it, as Google asks (no
// question and no button in front of its card). Play shows it at most so often and never says whether the player
// rated: the mark counts as asked. When Play cannot show it (an error), our card asks instead.
import { h, icon } from './dom.js';
import { gatesOn } from '../pro.js';
import { totalMinutes } from '../practiceLog.js';
import { rateApp } from './proDebug.js';

const KEY = 'bassclass.rate.v1';
/** The marks, in minutes of playing: 10 hours, then 20. */
export const RATE_AT = [600, 1200];

function read() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { v = null; }
  const ok = v && typeof v === 'object' && !Array.isArray(v);
  return { rated: ok && v.rated === true, asked: ok && Number.isInteger(v.asked) ? Math.max(0, Math.min(RATE_AT.length, v.asked)) : 0 };
}
function write(r) { try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* storage unavailable */ } }
/** The reminder's state, for the debug panel. */
export const rateState = () => ({ ...read(), minutes: Math.round(totalMinutes()) });
export const resetRate = () => write({ rated: false, asked: 0 });

let openNow = null;
/** Something else is on screen: a sheet, a picker, a bubble, or the player is busy: in an exercise, the room or
 * the tuner, entered a moment after leaving the last (QA round 20). */
const busy = () => !!openNow || !!document.querySelector('.picker-backdrop, .info-pop') || document.hidden
  || document.body.classList.contains('in-ex') || /^#\/(ex|practice|explorer|tuner)\b/.test(location.hash);

/** At the end of something: asks when a mark has been passed and not asked yet. */
export function maybeAskRating() {
  if (!gatesOn()) return;
  const r = read();
  if (r.rated || r.asked >= RATE_AT.length || totalMinutes() < RATE_AT[r.asked] || busy()) return;
  if (window.BassClassNative?.requestReview) askPlay(); else openRate();
}

/** The marks passed so far count as asked (passed both at once, as after a backup: one ask, the next mark waits). */
function markAsked(rated) {
  const r = read();
  const asked = Math.max(r.asked + 1, RATE_AT.filter((m) => totalMinutes() >= m).length);
  write({ rated: r.rated || rated, asked: Math.min(RATE_AT.length, asked) });
}

let asking = false;
/** Google Play's card (the Android app); its answer: 'done' (shown or not, Play does not say), or 'error'. */
export function askPlay({ test = false } = {}) {
  if (asking) return Promise.resolve('busy');
  asking = true;
  return new Promise((resolve) => {
    const finish = (result) => {
      removeEventListener('bassclass-review', onAnswer);
      clearTimeout(timer);
      asking = false;
      if (!test) { if (result === 'error') openRate(); else markAsked(false); }
      resolve(result);
    };
    const onAnswer = (e) => finish(e.detail === 'error' ? 'error' : 'done');
    addEventListener('bassclass-review', onAnswer);
    // (no answer within a minute: as done, so it never asks twice for one mark)
    const timer = setTimeout(() => finish('done'), 60000);
    try { window.BassClassNative.requestReview(); } catch { finish('error'); }
  });
}

/** The card itself (`test`: from the debug panel, the answer not stored). */
export function openRate({ test = false } = {}) {
  if (openNow) return;
  const answer = (rated) => { if (!test) markAsked(rated); };
  const rate = () => { answer(true); close(); rateApp(); };
  const later = () => { answer(false); close(); };
  const stars = h('div', { class: 'rate-stars', 'aria-hidden': 'true' }, [1, 2, 3, 4, 5].map(() => h('span', { class: 'rate-star' }, '★')));
  const closeBtn = h('button', { class: 'icon-btn picker-close', type: 'button', 'aria-label': 'Not now', html: icon('close'), onClick: later });
  const panel = h('div', { class: 'picker rate-card', role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Rate BassClass', tabindex: '-1' },
    h('div', { class: 'picker-head' }, h('div', { class: 'grow' }), closeBtn),
    stars,
    h('h2', {}, 'Help us by rating BassClass'),
    h('p', { class: 'muted' }, 'A few stars and words on Google Play help other bass players find the app. Thank you!'),
    h('div', { class: 'row rate-actions' },
      h('button', { class: 'btn pro-cta', type: 'button', onClick: rate }, '⭐ Rate on Google Play'),
      h('button', { class: 'btn', type: 'button', onClick: later }, 'Not now')));
  const backdrop = h('div', { class: 'picker-backdrop rate-backdrop' }, panel);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) later(); });
  // Back (Android's, or the browser's) answers "not now" and stays on the screen, as the other sheets do
  history.pushState({ ...(history.state || {}), picker: true }, '');
  const onPop = () => { answer(false); close('back'); };
  addEventListener('popstate', onPop);
  const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); later(); } };
  document.addEventListener('keydown', onKey, true);
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
  openNow = close;
  document.body.append(backdrop);
  panel.focus({ preventScroll: true });
}
