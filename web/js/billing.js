// Buying Pro and tips (MONETIZATION-PLAN.md): Google Play Billing in the Play Store build, through the Android
// app's bridge, with no server: the phone asks Play what the account owns. Everywhere else, with the gates switched
// on for testing (pro.js), a simulated Google Play answers instead, as the debug panel says (Settings: seven taps on
// the version line), so every path of the purchase can be tried before the real one exists.
//
// The bridge the Play build's MainActivity is to give (not built yet: LAUNCH-TODO.md):
//   BassClassNative.billingBuy(id, consumable, req)   buys (a consumable, a tip, is consumed so it can be bought again)
//   BassClassNative.billingOwned(req)                  the one-time products the account owns
//   BassClassNative.billingPrices(idsJson, req)        each product's price in the player's currency
// each answered by a `bassclass-billing` event, detail { req, result: 'ok' | 'pending' | 'cancel' | 'error' |
// 'owned', ids: [...], prices: { id: '7,99 €' } }. A purchase is acknowledged by the app at once (Play refunds one left
// unacknowledged for three days).
import { PLAY, PRO_ID, TIPS, PRICE, dev, setDev, gatesOn, proRecord, setOwned, setMiss } from './pro.js';

const DAY = 24 * 60 * 60 * 1000;
const log = [];
/** The last billing events (for the debug panel). */
export const billingLog = () => log.slice(-30);
const note = (msg) => { log.push(`${new Date().toLocaleTimeString('en-GB')} ${msg}`); if (log.length > 60) log.shift(); };

const native = () => (PLAY && window.BassClassNative?.billingBuy ? window.BassClassNative : null);
let reqs = 0;
const waiting = new Map();
addEventListener('bassclass-billing', (e) => {
  const d = e.detail || {};
  const done = waiting.get(d.req);
  if (done) { waiting.delete(d.req); done(d); }
});
/** A question to the Android app, answered by its event (or nothing after 60 s). */
function ask(call) {
  const req = `r${++reqs}`;
  return new Promise((resolve) => {
    waiting.set(req, resolve);
    try { call(req); } catch (err) { waiting.delete(req); resolve({ result: 'error', error: String(err) }); }
    setTimeout(() => { if (waiting.delete(req)) resolve({ result: 'error', error: 'no answer' }); }, 60000);
  });
}

// ---------------------------------------------------------------- the simulated Google Play (testing only)
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const sim = {
  async buy(id, consumable) {
    await pause(700);
    const d = dev();
    const result = d.next || 'ok';
    if (result === 'ok' && !consumable && !d.sim.includes(id)) setDev({ sim: [...d.sim, id] });
    if (result === 'ok' && d.sim.includes(id) && !consumable) return { result: 'owned' };
    return { result };
  },
  async owned() { await pause(300); return { result: 'ok', ids: dev().sim }; },
  async prices(ids) { await pause(200); return { result: 'ok', prices: Object.fromEntries(ids.map((id) => [id, id === PRO_ID ? `${PRICE} (test)` : `${TIPS.find(([t]) => t === id)?.[1] || ''} (test)`])) }; },
};

/** Buying is possible here: the Play build's Google Play, or the simulated one while testing. */
export const canBuy = () => !!native() || (!PLAY && gatesOn());

/** Buys a product; resolves 'ok' | 'pending' | 'cancel' | 'error' | 'owned'. */
export async function buy(id, consumable = false) {
  note(`buy ${id}${consumable ? ' (tip)' : ''}…`);
  const n = native();
  const d = n ? await ask((req) => n.billingBuy(id, !!consumable, req)) : PLAY ? { result: 'error', error: 'Google Play is not available' } : await sim.buy(id, consumable);
  note(`buy ${id}: ${d.result}${d.error ? ` (${d.error})` : ''}`);
  if (!consumable && (d.result === 'ok' || d.result === 'owned') && id === PRO_ID) setOwned(true);
  return d.result || 'error';
}

/** The prices in the player's currency: { id: text } (the defaults where Play says nothing). */
export async function prices() {
  const ids = [PRO_ID, ...TIPS.map(([id]) => id)];
  const base = Object.fromEntries([[PRO_ID, PRICE], ...TIPS]);
  const n = native();
  const d = n ? await ask((req) => n.billingPrices(JSON.stringify(ids), req)) : !PLAY && gatesOn() ? await sim.prices(ids) : {};
  return { ...base, ...(d.prices || {}) };
}

let lastSync = 0;
/**
 * Asks Google Play what the account owns and follows it: a purchase made on another phone (or before a reinstall)
 * turns Pro on; a refund turns it off, but only when a second check at least a day after the first miss still
 * finds nothing (a phone offline or a slow Play never takes Pro away by mistake). `force`: now, whatever the time.
 * Resolves true when Pro is owned.
 */
export async function syncPro({ force = false } = {}) {
  if (!gatesOn()) return true;
  if (!force && Date.now() - lastSync < 30 * 60 * 1000) return proRecord().owned;
  lastSync = Date.now();
  const n = native();
  const d = n ? await ask((req) => n.billingOwned(req)) : PLAY ? { result: 'error' } : await sim.owned();
  if (d.result !== 'ok') { note(`check: ${d.result} (nothing changed)`); return proRecord().owned; }
  const has = (d.ids || []).includes(PRO_ID);
  const r = proRecord();
  if (has) {
    if (!r.owned || r.miss) { setOwned(true); note('check: Pro owned'); }
    return true;
  }
  if (!r.owned) { note('check: not owned'); return false; }
  if (!r.miss) { setMiss(Date.now()); note('check: Pro missing (first time): kept for a day'); return true; }
  if (Date.now() - r.miss >= DAY) { setOwned(false); note('check: Pro missing a day later: taken back (refund)'); return false; }
  note('check: Pro still missing, less than a day after the first miss: kept');
  return true;
}
/** Testing: the first miss moves a day back (as if a day had passed). */
export function pretendDayPassed() {
  const r = proRecord();
  if (r.miss) setMiss(r.miss - DAY);
  note('a day passes (test)');
}
