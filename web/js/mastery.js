// One record of what the player has mastered, everywhere in the app (user, 2026-10-26: "the checks have
// to be extensive to all the app regardless in what section it has been achieved"). An exercise is
// mastered when a full loop reached its goal and the player ticked it: in the Library (✓ Mastered), in
// today's session, or in a lesson (a step at least as hard as the goal, passed and ✓ Clean). Its goal
// is the hardest of its steps in its own level's stage of the course (tempo × notes per beat), so the
// Library and the course ask the same; an exercise without one (an ear round) needs one full loop. A
// mastered exercise passes the course's steps on it up to its goal, and a level of the Library 80%
// mastered counts as known in the course: the player's level moves on (course/progress.js).
import { EXERCISES, byId } from './curriculum/index.js';
import { STAGES, LESSONS } from './course/data.js';
import { getProgress, updateProgress } from './store.js';

/** The share of a level's exercises mastered that moves the player's level on. */
export const LEVEL_PASS = 0.8;

// each exercise's goal: { bpm, sub } (sub null on a written rhythm), or null (no tempo goal); worked out on
// first use (the course and the curriculum may still be loading when this module is)
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
      const was = GOALS.get(s.ex);
      if (!was || g.bpm * (g.sub || 1) > was.bpm * (was.sub || 1)) GOALS.set(s.ex, g);
    }
  }
  return GOALS;
}

/** An exercise's goal: { bpm, sub } or null (one full loop is enough). */
export const goalOf = (id) => goals().get(id) || null;
const SUB_NAMES = { 1: 'quarters', 2: '8ths', 3: 'triplets', 4: '16ths', 6: '16ths' };
/** The goal in words: "92 BPM in 8ths", "120 BPM", or "one full loop". */
export function goalText(id) {
  const g = goalOf(id);
  if (!g) return 'one full loop';
  return `${g.bpm} BPM${g.sub ? ` in ${SUB_NAMES[g.sub] || `${g.sub} per beat`}` : ''}`;
}
/** Does a full loop at `bpm`, `sub` notes per beat (null: a written rhythm), reach the goal? */
export function meetsGoal(id, bpm, sub) {
  const g = goalOf(id);
  if (!g) return true;
  return bpm >= g.bpm && (g.sub == null || sub == null || sub >= g.sub);
}
/** Is a step (of a lesson) at least as hard as its exercise's goal, so passing it masters the exercise? */
export function stepMasters(step) {
  const g = goalOf(step.ex);
  if (!g) return true;
  return !!step.goal && step.goal >= g.bpm && (g.sub == null || (step.sub ?? g.sub) >= g.sub);
}
/** Does the exercise's mastery pass this step (its goal no harder than the exercise's)? */
export function masteryCovers(step) {
  if (!isMastered(step.ex)) return false;
  const g = goalOf(step.ex);
  if (!step.goal) return true;
  if (!g) return false;
  return step.goal <= g.bpm && (step.sub == null || g.sub == null || step.sub <= g.sub);
}

export const isMastered = (id) => !!getProgress(id)?.done;
const listeners = new Set();
/** Called with the exercise id when it is mastered or unmastered (the course settles its lessons). */
export const onMastery = (fn) => { listeners.add(fn); return () => listeners.delete(fn); };
/** Master an exercise, or take it back. */
export function setMastered(id, on) {
  if (isMastered(id) === !!on) return;
  updateProgress(id, { done: !!on });
  for (const fn of listeners) fn(id);
}

/** A Library level's exercises: how many there are and how many are mastered. */
export function levelMastery(level) {
  const list = EXERCISES.filter((t) => t.level === level);
  return { total: list.length, done: list.filter((t) => isMastered(t.id)).length };
}
/** Is a level mastered enough (80%) to count as known? */
export function levelPassed(level) {
  const { total, done } = levelMastery(level);
  return total > 0 && done / total >= LEVEL_PASS;
}
