// Practice log: the minutes an exercise plays, per day (localStorage, failure-tolerant like store.js).
// The player reports when it starts and stops; a run left playing with no touch or key for 20 minutes
// stops counting there (a loop left on is not practice). Shown as the week's bars on Home.
const KEY = 'bassclass.log.v1';
const IDLE = 20 * 60e3;
const TICK = 15e3;      // a run in progress is credited this often, so a closed app loses little
const KEEP = 400;       // days kept

/** The local date as 'YYYY-MM-DD'. */
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function read() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { v = null; }
  const out = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, s] of Object.entries(v)) if (/^\d{4}-\d\d-\d\d$/.test(k) && Number.isFinite(s) && s > 0) out[k] = Math.min(86400, s);
  }
  return out;
}
let log = read();
function save() {
  const days = Object.keys(log).sort();
  for (const k of days.slice(0, Math.max(0, days.length - KEEP))) delete log[k];
  try { localStorage.setItem(KEY, JSON.stringify(log)); } catch { /* storage unavailable */ }
}

let since = null;       // credited up to here while a run plays
let timer = null;
let lastInput = Date.now();
const touched = () => { lastInput = Date.now(); };

/** Adds the time played since the last credit (up to 20 minutes after the last touch) to today. */
function credit() {
  if (since == null) return;
  const now = Date.now();
  const sec = (Math.min(now, lastInput + IDLE) - since) / 1000;
  since = now;
  if (sec <= 0) return;
  const k = dayKey(now);
  log[k] = Math.min(86400, Math.round(((log[k] || 0) + sec) * 10) / 10);
  save();
}

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', touched, { capture: true, passive: true });
  window.addEventListener('keydown', touched, { capture: true, passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) credit(); });
}

/** The player started (true) or stopped (false) playing. */
export function logPlaying(on) {
  clearInterval(timer);
  timer = null;
  if (on) {
    touched();
    if (since == null) since = Date.now();
    timer = setInterval(credit, TICK);
  } else {
    credit();
    since = null;
  }
}

/** The last `n` days, oldest first, today last: [{ date, min }] (a run in progress included). */
export function lastDays(n = 7) {
  credit();
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i));
    return { date, min: (log[dayKey(date.getTime())] || 0) / 60 };
  });
}

/** Days in a row with a minute or more of practice, up to today (a today not played yet keeps yesterday's run). */
export function streak() {
  credit();
  const now = new Date();
  let n = 0;
  for (let i = 0; i < KEEP; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    if ((log[dayKey(d.getTime())] || 0) >= 60) n++;
    else if (i > 0) break;
  }
  return n;
}

export function resetLog() {
  log = {};
  save();
}
