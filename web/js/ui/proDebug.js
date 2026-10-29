// Settings' Pro parts (MONETIZATION-PLAN.md): the Pro card and the tips (when the gates are on: the Play build, or
// the test switch), and the debug panel for the gates and the purchase (user, 2026-10-27: "create a way to debug the
// payment gates"). The panel opens with seven taps on the version line, in every build but the Play one (where test
// switches would hand out Pro); it is kept apart from the player's data (pro.js `dev`), so a backup never carries it.
import { settings } from '../store.js';
import { DRONES, DRONE_GROUPS, droneName } from '../practice/drones.js';
import { h, toast, icon, heart, bubbleOnTap } from './dom.js';
import { PLAY, PRO_ID, TIPS, PRICE, placeholder, proSub, FREE_LEVELS, FREE_SOUNDS, PRO_SOUND_NOTES, gatesOn, isPro, owned, proRecord, dev, setDev, setOwned, proRoomItems } from '../pro.js';
import { PAD_SOUNDS } from '../audio.js';
import { STAGES, LESSONS, UNITS } from '../course/data.js';
import { LEVELS, EXERCISES, moduleOf } from '../curriculum/index.js';
import { STYLES, GENRES } from '../practice/styles.js';
import { progName } from '../practice/harmony.js';
import { syncPro, restorePro, billingLog, pretendDayPassed, canBuy, prices } from '../billing.js';
import { openPro, tip, FREE_LINE } from './proSheet.js';
import { openRate, askPlay, rateState, resetRate, RATE_AT } from './rate.js';
import { resetNews } from '../news.js';

/** The Pro card and Support BassClass (the tips), for Settings; nothing while the gates are off. */
export function proFields(field) {
  if (!gatesOn()) return [];
  const mine = owned();
  // (one at a time; Google Play not reached is not "never bought": QA round 19)
  let restoring = false;
  const restore = async () => {
    if (restoring) return;
    restoring = true;
    const r = await restorePro().finally(() => { restoring = false; });
    toast(r === 'owned' ? 'Pro restored: thank you!' : r === 'error' ? 'Google Play could not be reached. Try again.' : 'No purchase of Pro was found on this Google account', 3000);
  };
  // the offer: gold, with its full price (Google Play's, in the player's currency, once it answers; user, 2026-10-27:
  // "add the full price and make the button appealing")
  const cta = proButton(() => openPro());
  if (!mine && canBuy()) prices().then((p) => { if (p[PRO_ID]) cta.setPrice(p[PRO_ID]); }).catch(() => {});
  const proField = field('BassClass Pro', mine
    ? h('div', { class: 'row' }, h('span', { class: 'pro-owned' }, '⭐ Pro is yours. Thank you!'))
    : h('div', { class: 'row pro-offer' }, cta, h('button', { class: 'btn', onClick: restore }, 'Restore purchase')));
  // its ⓘ: everything Pro opens, in full (user, 2026-10-27: "detailed, expanded, to show how much content")
  proField.querySelector('.field-head')?.append(bubbleOnTap(h('button', { class: 'info-btn', type: 'button', title: 'What BassClass Pro opens', 'aria-label': 'What BassClass Pro opens', 'aria-expanded': 'false', html: icon('info') }), proDetails, { width: 500 }));
  const out = [proField];
  // Support BassClass: a rating on Google Play (user, 2026-10-27), and the tips where buying works
  const tipRow = h('div', { class: 'row' },
    h('button', { class: 'btn', onClick: rateApp }, '⭐ Rate BassClass on Google Play'),
    ...(canBuy() ? TIPS.map(([id, label]) => h('button', { class: 'btn tip-btn', 'data-tip': id, onClick: () => tip(id) }, heart(), h('span', { class: 'tip-label' }, `Tip ${placeholder(label) || '…'}`))) : []));
  // (the tips' prices in the player's currency)
  if (canBuy()) prices().then((p) => tipRow.querySelectorAll('[data-tip]').forEach((b) => { if (p[b.dataset.tip]) b.querySelector('.tip-label').textContent = `Tip ${p[b.dataset.tip]}`; })).catch(() => {});
  out.push(field('Support BassClass', tipRow, ['⭐ A rating and a few words on Google Play help other bass players find BassClass', '☕ A tip helps: buy me a coffee', '🔓 Neither unlocks anything: they just say thank you']));
  return out;
}

/**
 * Everything Pro opens, in full, counted and named from the data, so the list grows with the app (user, 2026-10-27:
 * "remember to update the list if the app grows"; a new Pro sound adds its line to pro.js PRO_SOUND_NOTES): the Course's
 * stages and their units, the Library's levels and their topics, the song studies, the drum patterns by genre and the
 * fills, the progressions by name, the sounds; then what stays free.
 */
function proDetails() {
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
    for (const u of units.filter((x) => x.stage === s)) out.push(sub(`${u.n}. ${u.title}`));
  }
  // the Library
  const pro = EXERCISES.filter((t) => t.level > FREE_LEVELS);
  const songs = pro.filter((t) => t.module === 'music').length;
  // ("most in every key": the rhythm drills and the song studies keep theirs, QA round 19)
  out.push(head(`📚 Library Levels ${FREE_LEVELS + 1}–6: ${pro.length} more exercises (${songs} of them song-style studies, with their backing), most in every key, each with its own variations`));
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

/** The gold "Get BassClass Pro" button with its price (Settings and the Pro sheet); `setPrice` shows Play's. */
export function proButton(onClick, price = placeholder(PRICE)) {
  const sub = h('span', { class: 'pro-cta-sub' }, proSub(price));
  const b = h('button', { class: 'btn pro-cta', type: 'button', onClick }, h('span', { class: 'pro-cta-top' }, '⭐ Get BassClass Pro'), sub);
  b.setPrice = (p) => { sub.textContent = proSub(p); };
  return b;
}

/** BassClass's page on Google Play, to rate it: the Play Store app on Android (the app's bridge), else the web page. */
export function rateApp() {
  try {
    if (window.BassClassNative?.openStore) { window.BassClassNative.openStore(); return; }
  } catch { /* the bridge failed: the web page instead */ }
  window.open('https://play.google.com/store/apps/details?id=com.bassclass.app', '_blank', 'noopener');
}

/** Seven taps on the version line show or hide the debug panel (never in the Play build). */
export function devTaps(el, rerender) {
  if (PLAY) return el;
  let n = 0, last = 0;
  el.addEventListener('click', () => {
    const now = Date.now();
    n = now - last < 700 ? n + 1 : 1;
    last = now;
    if (n >= 7) { n = 0; setDev({ on: !dev().on }); toast(dev().on ? 'Pro debug panel on' : 'Pro debug panel off'); rerender(); }
  });
  return el;
}

/** The debug panel: the gates, the purchase, the simulated Google Play and its answers, the refund rule, the log. */
export function devPanel(rerender) {
  if (PLAY || !dev().on) return null;
  const d = dev(), r = proRecord();
  const seg = (opts, cur, set) => h('div', { class: 'seg' }, opts.map(([v, l]) => h('button', { class: cur === v ? 'on' : '', type: 'button', onClick: () => { set(v); rerender(); } }, l)));
  const line = (label, ...kids) => h('div', { class: 'dev-line' }, h('span', { class: 'dev-label' }, label), ...kids);
  return h('section', { class: 'block dev-panel' },
    h('div', { class: 'block-head' }, h('h2', {}, '🛠 Pro debug'), h('div', { class: 'grow' }),
      h('button', { class: 'btn small', type: 'button', onClick: () => { setDev({ on: false }); rerender(); } }, 'Hide')),
    h('p', { class: 'muted small' }, 'Test builds only (never in the Play build). The gates act as in the Play build; purchases go to a simulated Google Play.'),
    line('Gates', seg([[false, 'Off (as now)'], [true, 'On (as on Play)']], d.gates, (v) => setDev({ gates: v }))),
    line('Pro owned', seg([[false, 'No'], [true, 'Yes']], owned(), (v) => {
      setOwned(v);
      setDev({ sim: v ? [...new Set([...dev().sim, PRO_ID])] : dev().sim.filter((x) => x !== PRO_ID) });
    })),
    line('Next purchase', seg([['ok', 'Succeeds'], ['cancel', 'Cancelled'], ['pending', 'Pending'], ['error', 'Fails']], d.next, (v) => setDev({ next: v }))),
    line('Try', h('div', { class: 'row' },
      h('button', { class: 'btn small', type: 'button', onClick: () => openPro('Level 4 is part of BassClass Pro (test)') }, 'Open the Pro sheet'),
      h('button', { class: 'btn small', type: 'button', onClick: async () => { await syncPro({ force: true }); rerender(); } }, 'Check with Play now'),
      h('button', { class: 'btn small', type: 'button', onClick: () => { setDev({ sim: dev().sim.filter((x) => x !== PRO_ID) }); toast('Play no longer reports Pro (a refund): check twice, a day apart'); rerender(); } }, 'Refund'),
      // (a new phone, or the app reinstalled: this phone has forgotten Pro, Google Play still has it; Restore brings it back)
      h('button', { class: 'btn small', type: 'button', onClick: () => { setOwned(false); setDev({ sim: [...new Set([...dev().sim, PRO_ID])] }); toast('A new phone: Pro forgotten here, Google Play still has it. Try Restore purchase'); rerender(); } }, 'New phone'),
      h('button', { class: 'btn small', type: 'button', onClick: () => { pretendDayPassed(); rerender(); } }, 'A day passes'),
      h('button', { class: 'btn small', type: 'button', onClick: () => { setOwned(false); setDev({ sim: [], next: 'ok' }); rerender(); } }, 'Reset'))),
    // the rate reminder (ui/rate.js): asks at 10 and 20 hours played, at the end of something
    line('Rate reminder', h('div', { class: 'row' },
      h('button', { class: 'btn small', type: 'button', onClick: () => openRate({ test: true }) }, 'Show it now'),
      // (Google Play's own card: only in the Android app, and it shows only in an app installed from Play)
      window.BassClassNative?.requestReview ? h('button', { class: 'btn small', type: 'button', onClick: async () => {
        const r = await askPlay({ test: true });
        toast(r === 'error' ? 'Google Play could not open its rating card' : 'Google Play answered (its card shows only in an app installed from Play)', 4000);
      } }, 'Google Play\'s card') : null,
      h('button', { class: 'btn small', type: 'button', onClick: () => { resetRate(); toast('The rate reminder will ask again at its marks'); rerender(); } }, 'Reset'),
      h('code', { class: 'dev-state' }, (() => { const r = rateState(); return `${Math.floor(r.minutes / 60)}h${String(r.minutes % 60).padStart(2, '0')} played · asks at ${RATE_AT.map((m) => `${m / 60} h`).join(' and ')} · asked ${r.asked} · rated ${r.rated ? 'yes' : 'no'}`; })()))),
    // the "New" chips (news.js): the latest additions count as new again, to see them
    line('New chips', h('div', { class: 'row' },
      h('button', { class: 'btn small', type: 'button', onClick: () => { resetNews(); toast('The latest additions show "New" again'); rerender(); } }, 'Show them again'))),
    line('State', h('code', { class: 'dev-state' }, `gates ${gatesOn() ? 'on' : 'off'} · everything open: ${isPro() ? 'yes' : 'no'} · owned: ${owned() ? 'yes' : 'no'} · record ${JSON.stringify(r)} · Play reports: ${JSON.stringify(d.sim)}`)),
    h('pre', { class: 'dev-log' }, billingLog().join('\n') || 'No billing events yet.'));
}
