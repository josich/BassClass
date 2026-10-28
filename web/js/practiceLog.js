// Practice log: the minutes an exercise or the Practice room plays, per day (localStorage, failure-tolerant
// like store.js). The player and the room report when they start and stop. A run with no touch or key for a
// while stops counting there (20 minutes in an exercise, 60 in the room, where a play-along runs long), and
// nothing counts while the app is hidden or asleep. Each day keeps the goal it had (the session length), so
// a later change does not repaint the past. Shown as Home's headline.
const KEY = 'bassclass.log.v1';
const GOALS = 'bassclass.loggoal.v1';
const TICK = 15e3;      // a run in progress is credited this often, so a closed app loses little
const KEEP = 400;       // days kept
/** A day counts as practised from 30 seconds (its bar shows 1′). */
export const DAY_MIN = 0.5;

/** The local date as 'YYYY-MM-DD'. */
export function dayKey(t = Date.now()) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** A { day: value } record, keeping only dates with a valid value (`ok` returns it, or null). */
function readDays(key, ok) {
  let v;
  try { v = JSON.parse(localStorage.getItem(key) || '{}'); } catch { v = null; }
  const out = {};
  if (v && typeof v === 'object' && !Array.isArray(v)) {
    for (const [k, x] of Object.entries(v)) {
      const y = /^\d{4}-\d\d-\d\d$/.test(k) ? ok(x) : null;
      if (y != null) out[k] = y;
    }
  }
  return out;
}
function writeDays(key, map) {
  const days = Object.keys(map).sort();
  for (const k of days.slice(0, Math.max(0, days.length - KEEP))) delete map[k];
  try { localStorage.setItem(key, JSON.stringify(map)); } catch { /* storage unavailable */ }
}
let log = readDays(KEY, (s) => (Number.isFinite(s) && s > 0 ? Math.min(86400, s) : null));
let goals = readDays(GOALS, (g) => ([15, 30, 45, 60].includes(g) ? g : null));

let running = false;    // a run is playing (in an exercise or the room)
let since = null;       // credited up to here (null: not counting, e.g. hidden)
let timer = null;
let idle = 20 * 60e3;
let lastInput = Date.now();

/** Adds the time played since the last credit to today: up to `idle` after the last touch, and never a frozen gap. */
function credit() {
  if (since == null) return;
  const now = Date.now();
  // (a tick far later than due means the timers were frozen: the phone slept, so only the due ticks count)
  const sec = (Math.min(now, lastInput + idle, since + 2 * TICK) - since) / 1000;
  since = now;
  if (sec <= 0) return;
  const k = dayKey(now);
  log[k] = Math.min(86400, Math.round(((log[k] || 0) + sec) * 10) / 10);
  writeDays(KEY, log);
}

const touched = () => {
  // (what was played until now counts before the touch moves the idle limit)
  if (since != null && Date.now() - since > TICK) credit();
  lastInput = Date.now();
};

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', touched, { capture: true, passive: true });
  window.addEventListener('keydown', touched, { capture: true, passive: true });
  // hidden: what was played counts, then nothing until the app is back
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { credit(); since = null; } else if (running) since = Date.now();
  });
}

/** The player or the room started (true) or stopped (false); `idleMin`: minutes without a touch that still count. */
export function logPlaying(on, { idleMin = 20 } = {}) {
  clearInterval(timer);
  timer = null;
  if (on) {
    running = true;
    idle = idleMin * 60e3;
    touched();
    if (since == null && !document.hidden) since = Date.now();
    timer = setInterval(credit, TICK);
  } else {
    credit();
    running = false;
    since = null;
  }
}

/** Today's goal in minutes (the session length), kept with the day. */
export function setDayGoal(min) {
  const k = dayKey();
  if (goals[k] === min || ![15, 30, 45, 60].includes(min)) return;
  goals[k] = min;
  writeDays(GOALS, goals);
}

/** The last `n` days, oldest first, today last: [{ date, min, goal }] (goal: null before goals were kept). */
export function lastDays(n = 7) {
  credit();
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (n - 1 - i));
    const k = dayKey(date.getTime());
    return { date, min: (log[k] || 0) / 60, goal: goals[k] ?? null };
  });
}

/** All the minutes played that the log keeps (its last 400 days): the rate reminder's hours of use. */
export function totalMinutes() {
  credit();
  return Object.values(log).reduce((a, s) => a + s, 0) / 60;
}

/** Days in a row with 30 seconds or more of practice, up to today (a today not played yet keeps yesterday's run). */
export function streak() {
  credit();
  const now = new Date();
  let n = 0;
  for (let i = 0; i < KEEP; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    if ((log[dayKey(d.getTime())] || 0) >= DAY_MIN * 60) n++;
    else if (i > 0) break;
  }
  return n;
}

export function resetLog() {
  log = {};
  goals = {};
  writeDays(KEY, log);
  writeDays(GOALS, goals);
}
