// Course progress (localStorage, failure-tolerant like store.js): per step the best and last tempo,
// the loops played and the "clean" tick; per lesson the day it was completed and its reviews; the
// "I can" ticks of checkpoints; the units the placement check marked as known.
import { STAGES, LESSONS, UNITS, lessonById } from './data.js';

const KEY = 'bassclass.course.v1';
const DAY = 86400000;
// days until the next review of a completed lesson, by how many reviews are done
const INTERVALS = [1, 3, 7, 21, 60];
export const SESSION_LENGTHS = [15, 30, 45];

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
  const lessons = {};
  for (const [k, s] of Object.entries(obj(v.lessons))) {
    if (s && typeof s === 'object' && lessonById.has(k)) lessons[k] = { done: num(s.done), reviews: num(s.reviews), next: num(s.next) };
  }
  const flags = (x) => Object.fromEntries(Object.entries(obj(x)).filter(([, f]) => f === true));
  return {
    steps, lessons, can: flags(v.can), known: flags(v.known),
    placed: num(v.placed),
    minutes: SESSION_LENGTHS.includes(v.minutes) ? v.minutes : 30,
    last: typeof v.last === 'string' && lessonById.has(v.last) ? v.last : '',
  };
}

let state = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

const skey = (lid, i) => `${lid}.${i}`;
export const stepState = (lid, i) => state.steps[skey(lid, i)] || { best: 0, last: 0, loops: 0, clean: 0 };

/** Has this step's tempo goal been reached (no goal: one full loop played)? */
export function stepPassed(lesson, i) {
  const st = stepState(lesson.id, i);
  const goal = lesson.steps[i]?.goal;
  return goal ? st.best >= goal : st.loops > 0;
}
export const stepClean = (lesson, i) => !!stepState(lesson.id, i).clean;

/** A full loop of a lesson step was played at `bpm`. Returns true when this loop reached the goal for the first time. */
export function recordLoop(lesson, i, bpm) {
  const was = stepPassed(lesson, i);
  const st = { ...stepState(lesson.id, i) };
  st.loops += 1;
  st.best = Math.max(st.best, bpm);
  st.last = bpm;
  state.steps[skey(lesson.id, i)] = st;
  save();
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
  return settle(lesson);
}
export const canTicked = (lesson, i) => !!state.can[skey(lesson.id, i)];
export function setCan(lesson, i, on) {
  if (on) state.can[skey(lesson.id, i)] = true; else delete state.can[skey(lesson.id, i)];
  return settle(lesson);
}

export const isComplete = (lesson) => lesson.steps.every((_, i) => stepClean(lesson, i)) && (lesson.can || []).every((_, i) => canTicked(lesson, i));

/** Keeps the completion record in step with the ticks; returns true when the lesson has just been completed. */
function settle(lesson) {
  let fresh = false;
  if (isComplete(lesson) && !state.lessons[lesson.id]?.done) {
    const now = Date.now();
    state.lessons[lesson.id] = { done: now, reviews: 0, next: now + INTERVALS[0] * DAY };
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
export const isKnown = (lesson) => (lesson.unit ? !!state.known[lesson.unit.id] : lesson.stage.units.every((u) => state.known[u.id]));
export const knownUnits = () => ({ ...state.known });
export function setKnown(ids) {
  state.known = Object.fromEntries(ids.map((id) => [id, true]));
  state.placed = Date.now();
  save();
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
  return LESSONS.find((l) => !l.optional && ['started', 'new'].includes(status(l))) || null;
}

/** Lessons done and known (checkpoints and tests are not counted as lessons). */
export function courseStats() {
  const list = LESSONS.filter((l) => !l.optional && l.kind === 'lesson');
  return { done: list.filter((l) => status(l) === 'done').length, known: list.filter((l) => status(l) === 'known').length, total: list.length };
}

export const sessionMinutes = () => state.minutes;
export function setSessionMinutes(m) { if (SESSION_LENGTHS.includes(m)) { state.minutes = m; save(); } }

export function resetCourse() {
  state = { steps: {}, lessons: {}, can: {}, known: {}, placed: 0, minutes: state.minutes, last: '' };
  save();
}

export { STAGES, LESSONS, UNITS, lessonById };
