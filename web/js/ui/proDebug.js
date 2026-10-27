// Settings' Pro parts (MONETIZATION-PLAN.md): the Pro card and the tips (when the gates are on: the Play build, or
// the test switch), and the debug panel for the gates and the purchase (user, 2026-10-27: "create a way to debug the
// payment gates"). The panel opens with seven taps on the version line, in every build but the Play one (where test
// switches would hand out Pro); it is kept apart from the player's data (pro.js `dev`), so a backup never carries it.
import { h, toast } from './dom.js';
import { PLAY, PRO_ID, TIPS, PRICE, gatesOn, isPro, owned, proRecord, dev, setDev, setOwned } from '../pro.js';
import { syncPro, billingLog, pretendDayPassed, canBuy, prices } from '../billing.js';
import { openPro, tip } from './proSheet.js';

/** The Pro card and Support BassClass (the tips), for Settings; nothing while the gates are off. */
export function proFields(field) {
  if (!gatesOn()) return [];
  const mine = owned();
  const restore = async () => {
    const on = await syncPro({ force: true });
    toast(on && owned() ? 'Pro restored: thank you!' : 'No purchase of Pro was found on this Google account', 3000);
  };
  // the offer: gold, with its full price (Google Play's, in the player's currency, once it answers; user, 2026-10-27:
  // "add the full price and make the button appealing")
  const cta = proButton(() => openPro());
  if (!mine && canBuy()) prices().then((p) => { if (p[PRO_ID]) cta.setPrice(p[PRO_ID]); }).catch(() => {});
  const out = [field('BassClass Pro', mine
    ? h('div', { class: 'row' }, h('span', { class: 'pro-owned' }, '⭐ Pro is yours. Thank you!'))
    : h('div', { class: 'row pro-offer' }, cta, h('button', { class: 'btn', onClick: restore }, 'Restore purchase')),
  ['🎓 Levels 1–3, the tuner and the metronome are free', '⭐ Pro opens Levels 4–6, every drum pattern and progression, and the extra sounds', '💳 One payment, yours for good: no subscription, no ads', '📱 A new phone: Restore purchase (the same Google account)'])];
  // Support BassClass: a rating on Google Play (user, 2026-10-27), and the tips where buying works
  const tipRow = h('div', { class: 'row' },
    h('button', { class: 'btn', onClick: rateApp }, '⭐ Rate BassClass on Google Play'),
    ...(canBuy() ? TIPS.map(([id, label]) => h('button', { class: 'btn', 'data-tip': id, onClick: () => tip(id) }, `💛 Tip ${label}`)) : []));
  // (the tips' prices in the player's currency)
  if (canBuy()) prices().then((p) => tipRow.querySelectorAll('[data-tip]').forEach((b) => { if (p[b.dataset.tip]) b.textContent = `💛 Tip ${p[b.dataset.tip]}`; })).catch(() => {});
  out.push(field('Support BassClass', tipRow, ['⭐ A rating and a few words on Google Play help other bass players find BassClass', '💛 A tip helps keep it growing', '🔓 Neither unlocks anything: Pro is the same for everyone']));
  return out;
}

/** The gold "Get BassClass Pro" button with its price (Settings and the Pro sheet); `setPrice` shows Play's. */
export function proButton(onClick, price = PRICE) {
  const sub = h('span', { class: 'pro-cta-sub' }, `${price} · one payment, yours for good`);
  const b = h('button', { class: 'btn pro-cta', type: 'button', onClick }, h('span', { class: 'pro-cta-top' }, '⭐ Get BassClass Pro'), sub);
  b.setPrice = (p) => { sub.textContent = `${p} · one payment, yours for good`; };
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
    line('State', h('code', { class: 'dev-state' }, `gates ${gatesOn() ? 'on' : 'off'} · everything open: ${isPro() ? 'yes' : 'no'} · owned: ${owned() ? 'yes' : 'no'} · record ${JSON.stringify(r)} · Play reports: ${JSON.stringify(d.sim)}`)),
    h('pre', { class: 'dev-log' }, billingLog().join('\n') || 'No billing events yet.'));
}
