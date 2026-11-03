// One record of what the player has mastered, everywhere in the app (user, 2026-10-26: "the checks have
// to be extensive to all the app regardless in what section it has been achieved"). Since 2026-11-02 (user; the
// rules and each exercise's main option in docs/MASTERY.md): an exercise's main option (curriculum/main.js: the Scale
// of #114, never its key or root string) has choices; a choice is cleared when a full loop on it reached the
// exercise's goal and the player ticked ✓ Cleared, wherever: in the Library, today's session, or a lesson (a step at
// least as hard as the goal, passed and ✓ Clean, clears its choice); a game clears a mode at 8 of 10 on its own. The
// app masters the exercise once enough choices are cleared: all of them, or 80% where the main option says so (an
// "all" choice clears every one it plays); an exercise without a main option has one choice, '*'. The ⋯ menu takes
// the mastery back, with its ticks. Its goal is the hardest of its steps in its own level's stage of the course
// (tempo × notes per beat), so the Library and the course ask the same; an exercise without one (an ear round) needs
// one full loop. A mastered exercise passes the course's steps on it up to its goal, and a level of the Library 80%
// mastered counts as known in the course: the player's level moves on (course/progress.js).
import { EXERCISES, byId, defaultParams } from './curriculum/index.js';
import { MAIN } from './curriculum/main.js';
import { STAGES, LESSONS } from './course/data.js';
import { getProgress, updateProgress, allProgress, settings } from './store.js';
import { makeCtx } from './fretboard.js';

/** The share of a level's exercises mastered that moves the player's level on. */
export const LEVEL_PASS = 0.8;

// each exercise's goal: { bpm, sub } (sub null on a written rhythm), or null (no tempo goal); and each choice of its
// main option its own, from the steps on that choice (2026-11-02: a 12/8 gospel ballad and a jazz waltz in one exercise
// do not share a tempo); worked out on first use (the course and the curriculum may still be loading when this module is)
let GOALS = null;
function goals() {
  if (GOALS) return GOALS;
  GOALS = new Map();
  for (const l of LESSONS) {
    const level = STAGES.indexOf(l.stage) + 1;
    for (const s of l.steps) {
      const t = byId.get(s.ex);
      if (!t || t.level !== level || !s.goal) continue;
      const g = { bpm: s.goal, sub: s.sub ?? null };
      for (const key of [s.ex, `${s.ex}|${choiceOf(s.ex, s.p)}`]) {
        const was = GOALS.get(key);
        if (!was || g.bpm * (g.sub || 1) > was.bpm * (was.sub || 1)) GOALS.set(key, g);
      }
    }
  }
  // (the classic tunes are in no lesson yet: each part's goal is the tune's own tempo, in its written rhythm)
  for (const t of EXERCISES) {
    if (t.module !== 'tunes' || GOALS.has(t.id)) continue;
    const g = { bpm: t.bpm, sub: null };
    GOALS.set(t.id, g);
    for (const v of [...(t.params?.part?.options || []).map((o) => o[0]), '*']) GOALS.set(`${t.id}|${v}`, g);
  }
  return GOALS;
}

// a choice's bar and its own tempo, built once: "12/8:4" and 60 for the 12/8 slow blues
const SHAPES = new Map();
export function shapeOf(id, v) {
  const key = `${id}|${v}`;
  if (!SHAPES.has(key)) {
    let shape = null;
    try {
      const t = byId.get(id), m = mainOf(id);
      const S = { ...settings, strings: 4 };
      const inst = t.build({ ...defaultParams(t), ...(m ? { [m.by]: v } : {}) }, makeCtx(S), S);
      shape = { meter: `${(inst.timeSig || [4, 4]).join('/')}:${inst.beatsPerBar || 4}`, bpm: inst.bpm || t.bpm || null };
    } catch { shape = null; }
    SHAPES.set(key, shape);
  }
  return SHAPES.get(key);
}
// a choice without steps of its own (QA round 23: the 12/8 slow blues was asked for the shuffle's 120, the 7/4 for
// the 7/8's 170): the hardest goal of the choices in its own metre; none there, a goal from its own tempo (15% over
// it, to 4 BPM); the exercise's when its tempo is not known
const FALLBACK = new Map();
function fallbackGoal(id, v, all) {
  const key = `${id}|${v}`;
  if (FALLBACK.has(key)) return FALLBACK.get(key);
  const shape = shapeOf(id, v);
  let g = all;
  if (shape) {
    let best = null;
    const m = mainOf(id);
    for (const o of (m && byId.get(id)?.params?.[m.by]?.options) || []) {
      const c = String(o[0]), own = goals().get(`${id}|${c}`);
      if (!own || c === v || shapeOf(id, c)?.meter !== shape.meter) continue;
      if (!best || own.bpm * (own.sub || 1) > best.bpm * (best.sub || 1)) best = own;
    }
    if (best) g = best;
    else if (shape.bpm) g = { bpm: Math.round((shape.bpm * 1.15) / 4) * 4, sub: all.sub ?? null };
  }
  FALLBACK.set(key, g);
  return g;
}
/** An exercise's goal (`choice`: one of its main option's: its own from its steps, else see above): { bpm, sub } or null (one full loop). */
export function goalOf(id, choice = null) {
  const all = goals().get(id) || null;
  if (choice == null || !all) return all;
  return goals().get(`${id}|${choice}`) || fallbackGoal(id, String(choice), all);
}
/** What a goal tempo counts in ("92 BPM in 8ths"): one list for the Library, the lessons and the session (QA round 19). */
export const SUB_NAMES = { 0.25: 'whole notes', 0.5: 'half notes', 1: 'quarter notes', 2: '8ths', 3: 'triplets', 4: '16ths', 5: 'quintuplets', 6: 'sextuplets' };
/** The goal in words: "92 BPM in 8ths", "120 BPM", or "one full loop". */
export function goalText(id, choice = null) {
  const g = goalOf(id, choice);
  if (!g) return 'one full loop';
  return `${g.bpm} BPM${g.sub ? ` in ${SUB_NAMES[g.sub] || `${g.sub} per beat`}` : ''}`;
}
/** Does a full loop at `bpm`, `sub` notes per beat (null: a written rhythm), reach the goal? */
export function meetsGoal(id, bpm, sub, choice = null) {
  const g = goalOf(id, choice);
  if (!g) return true;
  return bpm >= g.bpm && (g.sub == null || sub == null || sub >= g.sub);
}
/** Is a step (of a lesson) at least as hard as its exercise's goal, so passing it masters the exercise? */
export function stepMasters(step) {
  const g = goalOf(step.ex, choiceOf(step.ex, step.p));
  if (!g) return true;
  return !!step.goal && step.goal >= g.bpm && (g.sub == null || (step.sub ?? g.sub) >= g.sub);
}
/**
 * What passes this step from the Library, its goal no harder than its choice's: 'mastered' (the exercise), 'cleared'
 * (the step's choice ✓ Cleared: QA round 23, user's choice), or null.
 */
export function coverOf(step) {
  const v = choiceOf(step.ex, step.p);
  const by = isMastered(step.ex) ? 'mastered' : isCleared(step.ex, v) ? 'cleared' : null;
  if (!by) return null;
  const g = goalOf(step.ex, v);
  if (!step.goal) return by;
  if (!g) return null;
  return step.goal <= g.bpm && (step.sub == null || g.sub == null || step.sub <= g.sub) ? by : null;
}
/** Does the Library pass this step (its exercise mastered, or its choice cleared, at a goal no harder)? */
export const masteryCovers = (step) => !!coverOf(step);

export const isMastered = (id) => !!getProgress(id)?.done;
const listeners = new Set();
/** Called with the exercise id when it is mastered or unmastered (the course settles its lessons). */
export const onMastery = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
const tell = (id) => { for (const fn of listeners) fn(id); };

// ---- main options and their choices
/** An exercise's main option: { by, all, pct, only, game }, or null (one choice, '*'). */
export function mainOf(id) {
  const m = MAIN[id];
  return !m ? null : typeof m === 'string' ? { by: m } : m;
}
/** The choices that count on a bass of `strings` (the options it offers there; an "all" choice is not one of them). */
export function choicesOf(id, strings = settings.strings) {
  const m = mainOf(id);
  if (!m) return ['*'];
  if (m.only) return [...m.only];
  const def = byId.get(id)?.params?.[m.by];
  return (def?.options || []).filter((o) => !(o[2]?.minStrings > strings)).map((o) => String(o[0])).filter((v) => v !== m.all);
}
/** How many cleared choices master it: all of them, or 80% (rounded up) where the main option says so. */
export function neededOf(id, strings) {
  const n = choicesOf(id, strings).length, m = mainOf(id);
  return m?.pct ? Math.ceil(m.pct * n - 1e-9) : n;
}
/** The choice options `p` play: the main option's value (the exercise's own when `p` leaves it out), or '*'. */
export function choiceOf(id, p = {}) {
  const m = mainOf(id);
  if (!m) return '*';
  return String(p[m.by] ?? defaultParams(byId.get(id))[m.by]);
}
/** The name of a choice as its option shows it ("Major pentatonic"), or null. */
export function choiceName(id, v) {
  const m = mainOf(id);
  if (!m) return null;
  const o = byId.get(id)?.params?.[m.by]?.options?.find((x) => String(x[0]) === String(v));
  return o ? String(o[1]) : null;
}
const rec = (id) => getProgress(id) || {};
/** Is choice `v` cleared (by its own tick, or by the "all" choice that plays it)? */
export function isCleared(id, v) {
  const c = rec(id).cleared || {}, m = mainOf(id);
  return !!c[v] || (!!m?.all && v !== m.all && !!c[m.all]);
}
/** Has a full loop on choice `v` reached the goal (or one on the "all" choice)? */
export function goalMet(id, v) {
  const g = rec(id).metOn || {}, m = mainOf(id);
  return !!g[v] || (!!m?.all && !!g[m.all]);
}
/** The choices that count: { done (cleared), of (all of them), need }. */
export function clearedCount(id, strings) {
  const list = choicesOf(id, strings);
  return { done: list.filter((v) => isCleared(id, v)).length, of: list.length, need: neededOf(id, strings) };
}
/** A full loop on choice `v` reached the goal (the Library, today's session): ✓ Cleared can be ticked on it. */
export function recordGoal(id, v) {
  if (goalMet(id, v)) return;
  updateProgress(id, { metOn: { ...(rec(id).metOn || {}), [v]: true } });
}
/** The mastery follows the cleared choices: set once enough are, taken back when one fewer is. */
function settle(id) {
  const c = clearedCount(id);
  const ok = c.of > 0 && c.done >= c.need;
  if (ok === isMastered(id)) return;
  updateProgress(id, { done: ok });
  tell(id);
}
/** Tick or untick ✓ Cleared on choice `v` (unticking one the "all" choice covers takes that tick back too). */
export function setCleared(id, v, on) {
  const c = { ...(rec(id).cleared || {}) }, m = mainOf(id);
  if (on) c[v] = true;
  else {
    delete c[v];
    // (unticking one choice the "all" choice cleared keeps the others it played: QA round 23)
    if (m?.all && v !== m.all && c[m.all]) { delete c[m.all]; for (const o of choicesOf(id)) if (o !== v) c[o] = true; }
  }
  updateProgress(id, { cleared: c });
  settle(id);
}
/** A game's round on mode `v` scored `score` of `total`: its best is kept, and 8 of 10 or better clears the mode. */
export function recordGame(id, v, score, total) {
  const bests = { ...(rec(id).bests || {}) };
  bests[v] = Math.max(bests[v] ?? 0, Math.round((score / total) * 10));
  updateProgress(id, { bests });
  if (score / total >= 0.8 && !isCleared(id, v)) setCleared(id, v, true);
}
/**
 * Master an exercise (every choice cleared), or take it back with its ticks (the ⋯ menu). `keep`: take back only 🏅,
 * the cleared choices staying (a lesson step unticked: QA round 24, unticking one step wiped every choice).
 */
export function setMastered(id, on, keep = false) {
  if (on) {
    const c = { ...(rec(id).cleared || {}) };
    for (const v of choicesOf(id)) c[v] = true;
    updateProgress(id, { cleared: c });
    settle(id);
    return;
  }
  const was = isMastered(id);
  updateProgress(id, keep ? { done: false } : { cleared: {}, done: false });
  if (was) tell(id);
}

/** A Library level's exercises: how many there are and how many are mastered. */
export function levelMastery(level) {
  const list = EXERCISES.filter((t) => t.level === level);
  return { total: list.length, done: list.filter((t) => isMastered(t.id)).length };
}
// a level passed is measured against the number of exercises it had then (`bassclass.levels.v1`: { level: count }),
// so exercises an update adds to it never take it back (QA round 20: Levels 3–5 grew, and 35 of 43 became 35 of 46);
// unmastering below 80% of that count still does
const LEVELS_KEY = 'bassclass.levels.v1';
let passedAt = null;
function readPassed() {
  if (passedAt) return passedAt;
  try {
    const v = JSON.parse(localStorage.getItem(LEVELS_KEY) || '{}');
    passedAt = v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch { passedAt = {}; }
  return passedAt;
}
// the exercises added after the record shipped (2026-10-29): a player who had progress before them, and no record of
// a level yet, is measured without the ones not mastered, as the record would have (QA round 22: 36 of 44 = 82%
// became 36 of 47 = 77% on the first run of the record)
const ADDED_AFTER = new Set(['game-ear-notes', 'game-read-notes', 'game-ear-intervals', 'gr-fills', 'tech-pick-alt', 'game-ear-chordtones', 'lk-rock-blues', 'tech-pick-gallop', 'sl-octaves-16']);
const ADDED_AT = 1793285509000;
let fromBefore = null;
const playedBefore = () => (fromBefore ??= Object.values(allProgress()).some((e) => e?.last && e.last < ADDED_AT));
/** Is a level mastered enough (80%) to count as known? */
export function levelPassed(level) {
  const { total, done } = levelMastery(level);
  if (!total) return false;
  const was = readPassed()[level];
  const recorded = Number.isInteger(was) && was > 0 && was < total;
  const added = !recorded && was == null && playedBefore() ? EXERCISES.filter((t) => t.level === level && ADDED_AFTER.has(t.id) && !isMastered(t.id)).length : 0;
  const count = recorded ? was : total - added;
  const ok = done / count >= LEVEL_PASS;
  if (ok && !recorded && was !== count) {
    passedAt[level] = count;
    try { localStorage.setItem(LEVELS_KEY, JSON.stringify(passedAt)); } catch { /* storage unavailable */ }
  }
  return ok;
}
