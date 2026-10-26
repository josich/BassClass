// Course progress (localStorage, failure-tolerant like store.js): per step the best and last tempo,
// the loops played and the "clean" tick; per lesson the day it was completed and its reviews; the
// "I can" ticks of checkpoints; the units the placement check marked as known.
import { STAGES, LESSONS, UNITS, lessonById } from './data.js';
import { masteryCovers, stepMasters, setMastered, onMastery, levelPassed } from '../mastery.js';

const KEY = 'bassclass.course.v1';
const DAY = 86400000;
// days until the next review of a completed lesson, by how many reviews are done
const INTERVALS = [1, 3, 7, 21, 60];
export const SESSION_LENGTHS = [15, 30, 45, 60];
// Steps are stored by index. A released step whose notes later changed is listed here: what was
// saved for it before the change is dropped once (the store's `rev`), so an old tempo or tick
// never counts for different notes. `at`: the change shipped before its entry did, so a ✓ Clean
// ticked after `at` was made on the new notes and stays; without `at` (the entry ships with its
// change) everything stored before is dropped.
export const CHANGED_STEPS = [
  // f060af0 (v1.0.38): the Stage 1 test's first groove and the swing lesson's blues vamp
  { rev: 1, at: 1792512454000, steps: ['s1-test.0', 'swing.1'] },
  // QA round 9 leftovers (v1.0.45): a key fixed where the text names it or the neck needs it
  { rev: 2, steps: ['open-triads.0', 'u-triads4-check.1', 'upper-structures.1', 'colour-chords.0'] },
  // QA round 9 fixes, 8aa8df6 (v1.0.44): checkpoints and tests moved to the variants the lessons
  // teach, voice-led arpeggios in written 8ths
  { rev: 3, at: 1792572468000, steps: [
    'u-positions-check.0', 'u-positions-check.1', 'u-scales3-check.1', 'one-string.1', 'sequences.2',
    'inversions.0', 'harmonised-triads.1', 'u-triads3-check.1', 'u-sevenths3-check.0',
    'u-moving-check.0', 'u-moving-check.1', 'u-jazz-first-check.0', 'u-time4-check.0',
    'u-time4-check.1', 'u-modes4-check.0', 'u-modes4-check.1', 'ii-v-i-lines.0', 'ii-v-i-lines.1',
    'u-voicelead-check.1', 'u-sevenths4-check.0', 'u-sevenths4-check.1', 'u-tenths-check.0',
    'u-tenths-check.1', 'walk-mixed.1', 'u-walking4-check.1', 'u-grooves4-check.1', 's4-test.3',
    'u-hands5-check.1', 'u-outside-check.0', 'u-outside-check.1', 'u-bebop-check.0', 'u-bebop-check.1',
    'u-modes5-check.0', 'u-modes5-check.1', 'u-superimpose-check.0', 'u-superimpose-check.1',
    'u-triads5-check.0', 'u-triads5-check.1', 'u-colours-check.0', 'u-colours-check.1',
    'u-arps5-check.0', 'u-arps5-check.1', 'u-harmony5-check.0', 'u-harmony5-check.1',
    'u-walking5-check.1', 'u-licks-check.0', 'u-licks-check.1', 'u-solo-check.0', 'u-solo-check.1',
    's5-test.0', 's5-test.1', 's5-test.4', 'u-chords-all-keys-check.1', 'u-modern-check.0',
    'u-modern-check.1', 'giant-steps-arps.0', 'giant-steps-arps.1', 'rhythm-changes-arps.0',
    'u-coltrane-check.1', 'u-masters-check.0', 'u-masters-check.1', 's6-test.4',
  ] },
  // QA round 10: the R-5-10 checkpoint step in F (as its lesson)
  { rev: 4, steps: ['u-triads4-check.2'] },
  // QA round 12: song studies whose notes changed (Seven Nation Army without dotted notes, Teen Spirit's
  // verse, Californication's F, Feel Good's D octave, Money's middle part, Classical Thump's strokes)
  { rev: 5, steps: ['u-scales-check.2', 's1-test.6', 's2-test.6', 's2-test.7', 'u-time4-check.5', 's6-test.8'] },
  // QA round 13: Billie Jean's C♯m7 bar, Longview in E, Classical Thump's A7 and B7 pops
  { rev: 6, steps: ['u-triads3-check.3', 's3-test.7', 's6-test.8'] },
];
const REV = CHANGED_STEPS.length;
// a step whose notes changed after the player finished its lesson asks to be played again, but the
// lesson stays finished (level, Continue and reviews do not move): see isComplete
const CHANGED_KEYS = new Set(CHANGED_STEPS.flatMap((c) => c.steps));
// A lesson completed stays complete when steps or "I can" lines are appended later: its record keeps
// how many it had (`n`, `c`). Records from before that (v1.0.49 and older) take these counts (v1.0.43,
// the same through v1.0.49) for the checkpoints and tests that have grown since: [steps, "I can" lines].
// Every such record gets its counts filled in once on load, so a later append never depends on this table.
const COUNTS_V143 = {
  'u-lines-check': [2, 3], 'u-scales-check': [2, 3], 's1-test': [5, 4], 'u-feel-check': [3, 3], 's2-test': [5, 4],
  'u-all-keys-check': [2, 2],
  'u-hands-check': [2, 4], 'u-notes-check': [2, 3], 'u-neck-check': [2, 3], 'u-sevenths-check': [2, 2],
  'u-blues-check': [3, 3], 'u-funk-check': [3, 3], 'u-positions-check': [2, 3],
  'u-scales3-check': [2, 3], 'u-sequences-check': [2, 2], 'u-triads3-check': [2, 3],
  'u-sevenths3-check': [2, 3], 'u-moving-check': [2, 3], 'u-jazz-first-check': [2, 3],
  's3-test': [5, 6], 'u-stamina-check': [2, 3], 'u-time4-check': [3, 3], 'u-keys-check': [3, 3],
  'u-minor-check': [2, 3], 'u-modes4-check': [2, 3], 'u-triads4-check': [2, 3],
  'u-voicelead-check': [2, 3], 'u-grooves4-check': [2, 2], 's4-test': [5, 6], 'u-hands5-check': [2, 3],
  'u-outside-check': [2, 3], 'u-bebop-check': [2, 3], 'u-modes5-check': [2, 3],
  'u-superimpose-check': [2, 2], 'u-colours-check': [2, 3], 'u-arps5-check': [2, 3],
  'u-walking5-check': [2, 3], 'u-licks-check': [2, 3], 'u-solo-check': [2, 3], 's5-test': [5, 6],
  'u-chords-all-keys-check': [3, 3], 'u-modern-check': [2, 3], 'u-coltrane-check': [2, 3],
  's6-test': [5, 5],
};

function load() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { v = null; }
  const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
  const num = (x) => (Number.isFinite(x) && x >= 0 ? x : 0);
  // a tempo is 30–260 BPM (0: none yet)
  const bpm = (x) => (Number.isFinite(x) && x > 0 ? Math.max(30, Math.min(260, Math.round(x))) : 0);
  v = obj(v);
  const steps = {};
  for (const [k, s] of Object.entries(obj(v.steps))) {
    if (!s || typeof s !== 'object') continue;
    steps[k] = { best: bpm(s.best), last: bpm(s.last), loops: num(s.loops), clean: num(s.clean) };
  }
  // (a stored revision that is not a whole number counts as none; one above REV, from a backup made by a
  // newer BassClass, counts as REV: its records already follow every change this version knows)
  const rev = Number.isInteger(v.rev) && v.rev >= 0 ? Math.min(v.rev, REV) : 0;
  for (const c of CHANGED_STEPS) {
    if (rev >= c.rev) continue;
    for (const k of c.steps) if (steps[k] && !(c.at && steps[k].clean > c.at)) delete steps[k];
  }
  const lessons = {};
  let filled = false;
  for (const [k, s] of Object.entries(obj(v.lessons))) {
    if (!(s && typeof s === 'object' && lessonById.has(k))) continue;
    const rec = { done: num(s.done), reviews: num(s.reviews), next: num(s.next), n: num(s.n), c: num(s.c) };
    // a lesson completed before the counts were kept: the counts it had then (see COUNTS_V143)
    if (rec.done && !rec.n) {
      const l = lessonById.get(k);
      [rec.n, rec.c] = COUNTS_V143[k] || [l.steps.length, (l.can || []).length];
      filled = true;
    }
    lessons[k] = rec;
  }
  const flags = (x) => Object.fromEntries(Object.entries(obj(x)).filter(([, f]) => f === true));
  return {
    rev: REV, steps, lessons, can: flags(v.can), known: flags(v.known),
    placed: num(v.placed),
    minutes: SESSION_LENGTHS.includes(v.minutes) ? v.minutes : 30,
    last: typeof v.last === 'string' && lessonById.has(v.last) ? v.last : '',
    filled,
  };
}

let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ ...state, filled: undefined })); } catch { /* storage unavailable */ }
}
// (counts filled in on load are stored at once)
if (state.filled) save();
delete state.filled;

const skey = (lid, i) => `${lid}.${i}`;
export const stepState = (lid, i) => state.steps[skey(lid, i)] || { best: 0, last: 0, loops: 0, clean: 0 };

/** Has this step's tempo goal been reached here (no goal: one full loop played)? */
function ownPassed(lesson, i) {
  const st = stepState(lesson.id, i);
  const goal = lesson.steps[i]?.goal;
  return goal ? st.best >= goal : st.loops > 0;
}
const ownClean = (lesson, i) => !!stepState(lesson.id, i).clean;
// (a step on an exercise mastered anywhere, at a goal no harder than the exercise's, is passed and clean:
// one record of progress everywhere; user, 2026-10-26)
const covered = (lesson, i) => !!lesson.steps[i] && masteryCovers(lesson.steps[i]);
/** Has this step's tempo goal been reached (no goal: one full loop played), here or by mastering its exercise? */
export const stepPassed = (lesson, i) => ownPassed(lesson, i) || covered(lesson, i);
export const stepClean = (lesson, i) => ownClean(lesson, i) || covered(lesson, i);
/** A step passed and ✓ Clean that is at least as hard as its exercise's goal masters the exercise everywhere. */
function masterFrom(lesson, i) {
  const step = lesson.steps[i];
  if (step && ownPassed(lesson, i) && ownClean(lesson, i) && stepMasters(step)) setMastered(step.ex, true);
}

/** A full loop of a lesson step was played at `bpm`. Returns true when this loop reached the goal for the first time. */
export function recordLoop(lesson, i, bpm) {
  const was = stepPassed(lesson, i);
  const st = { ...stepState(lesson.id, i) };
  st.loops += 1;
  st.best = Math.max(st.best, bpm);
  st.last = bpm;
  state.steps[skey(lesson.id, i)] = st;
  save();
  masterFrom(lesson, i);
  return !was && stepPassed(lesson, i);
}
/** The tempo the step was last practised at (where it reopens). */
export function rememberTempo(lesson, i, bpm) {
  state.steps[skey(lesson.id, i)] = { ...stepState(lesson.id, i), last: bpm };
  save();
}

/** Tick or untick "clean" on a step. Returns true when this completed the lesson. */
export function setClean(lesson, i, on) {
  state.steps[skey(lesson.id, i)] = { ...stepState(lesson.id, i), clean: on ? Date.now() : 0 };
  if (on) masterFrom(lesson, i);
  return settle(lesson);
}
export const canTicked = (lesson, i) => !!state.can[skey(lesson.id, i)];
export function setCan(lesson, i, on) {
  if (on) state.can[skey(lesson.id, i)] = true; else delete state.can[skey(lesson.id, i)];
  return settle(lesson);
}

/** Every step clean and every "I can" ticked; for a lesson completed before, those it had then. */
export function isComplete(lesson) {
  const rec = state.lessons[lesson.id];
  const was = rec?.done ? (rec.n ? [rec.n, rec.c] : COUNTS_V143[lesson.id]) : null;
  const n = was ? Math.min(was[0], lesson.steps.length) : lesson.steps.length;
  const c = was ? Math.min(was[1], (lesson.can || []).length) : (lesson.can || []).length;
  for (let i = 0; i < n; i++) if (!stepClean(lesson, i) && !(rec?.done && CHANGED_KEYS.has(skey(lesson.id, i)))) return false;
  for (let i = 0; i < c; i++) if (!canTicked(lesson, i)) return false;
  return true;
}

/** Keeps the completion record in step with the ticks; returns true when the lesson has just been completed. */
function settle(lesson) {
  let fresh = false;
  if (isComplete(lesson) && !state.lessons[lesson.id]?.done) {
    const now = Date.now();
    state.lessons[lesson.id] = { done: now, reviews: 0, next: now + INTERVALS[0] * DAY, n: lesson.steps.length, c: (lesson.can || []).length };
    fresh = true;
  }
  save();
  return fresh;
}

const endOfToday = () => { const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime(); };
/** A completed lesson whose next review is today or overdue. */
export const isDue = (lesson) => isComplete(lesson) && (state.lessons[lesson.id]?.next || 0) > 0 && state.lessons[lesson.id].next <= endOfToday();
export const nextReview = (lesson) => state.lessons[lesson.id]?.next || 0;
/** A review was played clean: the next one comes later each time. Returns the days to the next review. */
export function reviewed(lesson) {
  const r = state.lessons[lesson.id] || { done: Date.now(), reviews: 0, next: 0 };
  r.reviews += 1;
  const days = INTERVALS[Math.min(r.reviews, INTERVALS.length - 1)];
  r.next = Date.now() + days * DAY;
  state.lessons[lesson.id] = r;
  save();
  return days;
}
export const dueLessons = () => LESSONS.filter(isDue).sort((a, b) => nextReview(a) - nextReview(b));

// ---------------------------------------------------------------- placement & status
// (known: the placement said so, or the stage's Library level is 80% mastered; user, 2026-10-26)
export const isKnown = (lesson) => levelPassed(STAGES.indexOf(lesson.stage) + 1)
  || (lesson.unit ? !!state.known[lesson.unit.id] : lesson.stage.units.every((u) => state.known[u.id]));
export const knownUnits = () => ({ ...state.known });
export function setKnown(ids) {
  state.known = Object.fromEntries(ids.map((id) => [id, true]));
  state.placed = Date.now();
  save();
  // a new level: today's session is planned again for it
  clearSession();
}
export const placed = () => state.placed > 0;

export function started(lesson) {
  return lesson.steps.some((_, i) => { const st = stepState(lesson.id, i); return st.loops > 0 || st.clean; }) || (lesson.can || []).some((_, i) => canTicked(lesson, i));
}
/** 'done' | 'known' (placement) | 'started' | 'new' */
export function status(lesson) {
  if (isComplete(lesson)) return 'done';
  if (isKnown(lesson)) return 'known';
  return started(lesson) ? 'started' : 'new';
}
export const anyProgress = () => LESSONS.some((l) => status(l) === 'done' || started(l));

export function setLast(id) { if (lessonById.has(id) && state.last !== id) { state.last = id; save(); } }

/**
 * Where to carry on: the lesson last opened if it is still unfinished, otherwise the first lesson
 * in course order that is neither done, known nor optional. Null when the course is complete.
 */
export function continueLesson() {
  const last = lessonById.get(state.last);
  if (last && !last.optional && ['started', 'new'].includes(status(last)) && started(last)) return last;
  return LESSONS.find(open) || null;
}

// A lesson added to a unit after the player passed its checkpoint (`added`: when it shipped) is new
// material, not a gap: it does not lower the level, and Continue does not go back for it (the map
// shows it as new). A lesson the unit always had stays in the course order.
function addedLater(l) {
  if (l.kind !== 'lesson' || !l.unit || !l.added) return false;
  const check = LESSONS.find((x) => x.kind === 'check' && x.unit === l.unit);
  const rec = check && state.lessons[check.id];
  return !!rec?.done && rec.done < l.added && status(check) === 'done';
}
const open = (l) => !l.optional && ['started', 'new'].includes(status(l)) && !addedLater(l);

/** The first lesson in course order that is neither done, known nor optional (where the player's level is). */
export const firstGap = () => LESSONS.find(open) || null;

/** Lessons done and known (checkpoints and tests are not counted as lessons). */
export function courseStats() {
  const list = LESSONS.filter((l) => !l.optional && l.kind === 'lesson');
  return { done: list.filter((l) => status(l) === 'done').length, known: list.filter((l) => status(l) === 'known').length, total: list.length };
}

// an exercise mastered (or taken back) anywhere: the lessons that use it are settled again, so one
// completed by it gets its completion day and its reviews
onMastery((ex) => {
  let fresh = false;
  for (const l of LESSONS) if (l.steps.some((s) => s.ex === ex) && isComplete(l) && !state.lessons[l.id]?.done) { record(l); fresh = true; }
  if (fresh) save();
});
function record(lesson) {
  const now = Date.now();
  state.lessons[lesson.id] = { done: now, reviews: 0, next: now + INTERVALS[0] * DAY, n: lesson.steps.length, c: (lesson.can || []).length };
}
// (lessons completed by exercises mastered before this rule get their records once, on load)
{
  let fresh = false;
  for (const l of LESSONS) if (!state.lessons[l.id]?.done && isComplete(l)) { record(l); fresh = true; }
  if (fresh) save();
}

export const sessionMinutes = () => state.minutes;
export function setSessionMinutes(m) { if (SESSION_LENGTHS.includes(m)) { state.minutes = m; save(); } }

export function resetCourse() {
  // (a reset store is up to date: the changed steps are not dropped again at the next start)
  state = { rev: REV, steps: {}, lessons: {}, can: {}, known: {}, placed: 0, minutes: state.minutes, last: '' };
  save();
  sessions = { cur: null, history: [] };
  saveSessions();
}

// ---------------------------------------------------------------- today's session (Home)
// The session as it was planned (one list per length, kept from its first view), the warm-ups added
// to it and the items played. It stays until it is marked as practised; the last sessions practised
// plan the next one. (localStorage, failure-tolerant)
const SKEY = 'bassclass.session.v1';
const HISTORY = 12;
function loadSessions() {
  let v;
  try { v = JSON.parse(localStorage.getItem(SKEY) || 'null'); } catch { v = null; }
  const obj = (x) => !!x && typeof x === 'object' && !Array.isArray(x);
  const step = (x) => x.ls == null || (typeof x.ls === 'string' && /^[\w-]+\.\d+$/.test(x.ls));
  const items = (a) => (Array.isArray(a) ? a.filter((x) => obj(x) && typeof x.id === 'string' && typeof x.slot === 'string'
    && step(x) && (!(x.demo || x.rv) || typeof x.ls === 'string') && (x.params == null || obj(x.params))) : []);
  const whole = (x, lo, hi) => Math.min(hi, Math.max(lo, Math.round(Number(x)) || lo));
  const c = obj(v) && obj(v.cur) ? v.cur : null;
  const cur = c && Number.isFinite(c.seed) ? {
    seed: c.seed >>> 0, at: Number(c.at) || Date.now(), level: whole(c.level, 1, 6), focus: whole(c.focus, 0, 99),
    lists: Object.fromEntries(Object.entries(obj(c.lists) ? c.lists : {}).filter(([m]) => SESSION_LENGTHS.includes(Number(m))).map(([m, a]) => [m, items(a)])),
    extra: items(c.extra), played: Array.isArray(c.played) ? c.played.filter((k) => typeof k === 'string') : [],
  } : null;
  const history = (obj(v) && Array.isArray(v.history) ? v.history : []).filter(obj).slice(0, HISTORY)
    .map((s) => ({ at: Number(s.at) || 0, focus: whole(s.focus, 0, 99), ids: Array.isArray(s.ids) ? s.ids.filter((x) => typeof x === 'string') : [] }));
  return { cur, history };
}
let sessions = loadSessions();
function saveSessions() {
  try { localStorage.setItem(SKEY, JSON.stringify(sessions)); } catch { /* storage unavailable */ }
}
/** The session being worked on (null: none planned yet) and the last ones practised, newest first. */
export const sessionStore = () => sessions;
export function setSession(cur) { sessions.cur = cur; saveSessions(); }
/** An item of the session was played through once. */
export function sessionPlayed(key) {
  const c = sessions.cur;
  if (c && !c.played.includes(key)) { c.played.push(key); saveSessions(); }
}
/** The session is done: it joins the history (its exercises, `ids`) and the next one gets planned. */
export function sessionPractised(ids) {
  const c = sessions.cur;
  if (c) sessions.history = [{ at: Date.now(), focus: c.focus, ids }, ...sessions.history].slice(0, HISTORY);
  sessions.cur = null;
  saveSessions();
}
/** Plan today's session again (a new level). */
export function clearSession() { sessions.cur = null; saveSessions(); }

export { STAGES, LESSONS, UNITS, lessonById };
