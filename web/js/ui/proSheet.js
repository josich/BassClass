// The Pro sheet (MONETIZATION-PLAN.md): over the screen, opened only by a tap on something that is Pro, with one line
// saying why. What Pro opens, its price (Google Play's, in the player's currency), Buy and Restore (kept in view at the
// sheet's foot on small phones, QA round 19), a thank-you once owned. Escape, ✕, a tap outside or Back close it (its
// own history entry, as the picker's). `then`: what the tap was for, done after a purchase ("Let's play"); `cancel`:
// done when it closes without one (a picker opens again where it was).
import { h, icon, toast, heart, bubbleOnTap } from './dom.js';
import { EXERCISES, LEVELS, byId, moduleOf } from '../curriculum/index.js';
import { STAGES, LESSONS, UNITS } from '../course/data.js';
import { PRO_ID, PRICE, placeholder, proSub, FREE_LEVELS, FREE_TASTE, FREE_SOUNDS, PRO_SOUND_NOTES, owned, proContents, proRoomItems, isProContent, PLAY } from '../pro.js';
import { settings } from '../store.js';
import { DRONES, DRONE_GROUPS, droneName } from '../practice/drones.js';
import { PAD_SOUNDS } from '../audio.js';
import { STYLES, GENRES } from '../practice/styles.js';
import { progName } from '../practice/harmony.js';
import { buy, prices, restorePro, canBuy } from '../billing.js';

let openNow = null;

// What Pro opens, named the way a player looks for it (user, 2026-11-03: the review's "a Pro sheet that names the
// studies and grooves"; styles and techniques, never song titles on a purchase screen). A line shows only while every
// exercise it names exists and is Pro, so it stays true as the content moves.
export const HIGHLIGHTS = [
  ['🎼', 'Modes of melodic and harmonic minor, chord-scale on every chord, upper structures', ['md-melodic-modes', 'md-harmonic-modes', 'md-chord-scale', 'tri-upper-structures']],
  ['🪜', 'Two-octave, extended (9ths to 13ths) and altered arpeggios, Giant Steps', ['arp-two-octaves', 'arp-extended', 'arp-altered-dominants', 'arp-giant-steps']],
  ['🚶', 'Walking bass: chromatic approaches, enclosures, two chords a bar, minor blues', ['wk-approach', 'wk-enclosures', 'wk-two-per-bar', 'wk-minor']],
  ['🎷', 'Jazz licks: ii – V – I, minor, bebop and modern sounds', ['lk-ii-v-i', 'lk-minor-ii-v-i', 'lk-bebop', 'lk-modern']],
  ['👍', 'Slap: grooves, 16th-note octaves, ghost-note funk, double thumbing', ['sl-grooves', 'sl-octaves-16', 'sl-advanced', 'sl-double-thumb']],
  ['🎶', 'Grooves: Latin, hip-hop and electronic, gospel and R&B, soul, odd metres', ['gr-latin', 'gr-electronic', 'gr-gospel', 'gr-soul', 'gr-odd-meters']],
];
/** The highlights that hold now (the self-test checks every one does). */
export const proHighlights = () => HIGHLIGHTS.filter(([, , ids]) => ids.every((id) => byId.has(id) && isProContent(byId.get(id))));

/** The free part, in one line (the sheet, Settings' Pro ⓘ, About's terms). */
export const FREE_LINE = `Levels 1–${FREE_LEVELS} of the course and the Library, ${FREE_TASTE} lessons of each later stage to try, the tuner, the whole metronome, and the Practice room's starter set: 3 drum patterns of each genre, the Pop & rock and Blues progressions, My progression, the drone (its root and 5th or octave, the triads, the five basic 7th chords and their spread and shell voicings) and the Neck`;

/**
 * Everything Pro opens, in full, counted and named from the data, so the list grows with the app (user, 2026-10-27:
 * "remember to update the list if the app grows"; a new Pro sound adds its line to pro.js PRO_SOUND_NOTES): the Course's
 * stages and their units, the Library's levels and their topics, the song studies, the drum patterns by genre and the
 * fills, the progressions by name, the sounds; then what stays free.
 */
export function proDetails() {
  const sub = (text) => h('span', { class: 'pro-detail-sub' }, text);
  const head = (text) => h('b', { class: 'pro-detail-head' }, text);
  const out = [head('⭐ BassClass Pro opens all of this, for good:')];
  // the Course
  const stages = STAGES.filter((s) => s.level > FREE_LEVELS);
  // (lessons as the map counts them, the optional ones apart: QA round 19)
  // (the lessons free to try left out: FREE_TASTE)
  const lessonsOf = (s) => LESSONS.filter((l) => l.stage === s && l.kind === 'lesson' && !l.optional && !l.free);
  const optional = LESSONS.filter((l) => stages.includes(l.stage) && l.kind === 'lesson' && l.optional && !l.free).length;
  const units = UNITS.filter((u) => stages.includes(u.stage));
  out.push(head(`🎓 Course Stages ${FREE_LEVELS + 1}–6: ${stages.reduce((a, s) => a + lessonsOf(s).length, 0)} more lessons${optional ? ` (and ${optional} optional ones)` : ''} in ${units.length} units, with their checkpoints, stage tests and reviews`));
  for (const s of stages) {
    out.push(`Stage ${s.level} · ${s.title}: ${lessonsOf(s).length} lessons`);
    for (const u of units.filter((x) => x.stage === s)) out.push(sub(u.title));
  }
  // the Library
  const pro = EXERCISES.filter((t) => t.level > FREE_LEVELS);
  const songs = pro.filter((t) => t.module === 'music').length, tunes = pro.filter((t) => t.module === 'tunes').length;
  // ("most in every key": the rhythm drills and the song studies keep theirs, QA round 19)
  out.push(head(`📚 Library Levels ${FREE_LEVELS + 1}–6: ${pro.length} more exercises (${songs} of them song-style studies and ${tunes} classic tunes, with their backing), most in every key, each with its own variations`));
  for (const L of LEVELS.filter((x) => x.n > FREE_LEVELS)) {
    const list = pro.filter((t) => t.level === L.n);
    const byTopic = new Map();
    for (const t of list) byTopic.set(t.module, (byTopic.get(t.module) || 0) + 1);
    out.push(`Level ${L.n} · ${L.name}: ${list.length} exercises`);
    out.push(sub([...byTopic].map(([m, n]) => `${moduleOf(m)?.name || m} ${n}`).join(' · ')));
  }
  // the Practice room
  const room = proRoomItems();
  out.push(head(`🥁 ${room.styles.length} more drum patterns (all ${Object.keys(STYLES).length}), and fills every 4 or 8 bars`));
  for (const g of GENRES) {
    const n = room.styles.filter((k) => STYLES[k].genre === g.key);
    if (n.length) out.push(sub(`${g.icon} ${g.name}: ${n.length} more · ${n.slice(0, 4).map((k) => STYLES[k].name).join(', ')}${n.length > 4 ? '…' : ''}`));
  }
  const progs = room.progGroups.flatMap(([, keys]) => keys);
  out.push(head(`🎹 ${progs.length} more progressions`));
  for (const [g, keys] of room.progGroups) out.push(sub(`${g}: ${keys.map(progName).join(', ')}`));
  // (the drone's chords, by group: practice/drones.js)
  out.push(head(`🎵 ${room.drones.length} more drone chords and voicings`));
  for (const [g, name] of DRONE_GROUPS) {
    const list = room.drones.filter((k) => DRONES[k].group === g);
    if (list.length) out.push(sub(`${name}: ${list.map((k) => droneName(0, k, settings.notation)).join(', ')}`));
  }
  const sounds = Object.keys(PAD_SOUNDS).filter((k) => !FREE_SOUNDS.has(k));
  out.push(head(`🎛 ${sounds.length} more sounds for the harmony`));
  out.push(...sounds.map((k) => sub(PRO_SOUND_NOTES[k] || k)));
  // ("to these parts": the terms' scope, legal.js)
  out.push(head('✨ And the new content we add to them next: lessons, studies, patterns and sounds'));
  out.push(head(`🆓 Always free: ${FREE_LINE}, the practice log and backup`));
  out.push('💳 One payment, yours for good: no subscription, no ads. A new phone: Restore purchase.');
  return out;
}

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
        h('li', {}, `🎓 Levels ${FREE_LEVELS + 1}–6: ${c.les} more lessons and ${c.ex} more exercises (${c.songs} of them song-style studies, ${c.tunes} classic tunes)`),
        ...proHighlights().map(([ico, text]) => h('li', {}, `${ico} ${text}`)),
        h('li', {}, `🎛 The whole Practice room: all ${c.styles} drum patterns and fills, every progression and drone chord, the Piano, Organ and Guitar sounds`),
        h('li', {}, '✨ The new content we add to them')),
      // (everything, by name: the list Settings' Pro ⓘ shows)
      bubbleOnTap(h('button', { class: 'btn small pro-all', type: 'button', 'aria-expanded': 'false' }, '📋 See everything Pro opens'), proDetails, { width: 500 }),
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
