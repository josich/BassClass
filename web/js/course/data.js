// The guided Course: stages → units → lessons → steps, built from the exercises of the Library.
// A step opens one exercise with preset options (`p`, only the options that matter: the rest stay
// the player's own). It starts at `from` BPM; its pass mark is the `goal` tempo, which the app
// records, plus the player's own "clean" tick (no goal: one full loop). A step marked `music`
// puts the lesson to work in a musical setting, with the backing it names.
// Nothing is locked: the Course only recommends the next lesson.
// Ids are stored in the player's progress: never rename one. Steps are stored by their place in the
// lesson ("pluck.1"): add new steps at the end of a lesson, never insert or reorder them.
// `sub` (notes per beat) is part of a step whose exercise lets the player choose it.

import s1 from './stages/s1.js';
import s2 from './stages/s2.js';
import s3 from './stages/s3.js';
import s4 from './stages/s4.js';
import s5 from './stages/s5.js';
import s6 from './stages/s6.js';
import { LESSON_NUMBERS } from './numbers.js';

export const STAGES = [s1, s2, s3, s4, s5, s6];
/** The Library level after the last stage (the course reaches Level 6 when it is complete). */
export const NEXT_LEVEL = Math.min(6, STAGES[STAGES.length - 1].level + 1);
export const COMPLETE = STAGES[STAGES.length - 1].level >= 6;

// ---------------------------------------------------------------- flattened view
// Every lesson (checkpoints included) in course order. A lesson's number is its stage and its own number in that
// stage ("3.15"), fixed in numbers.js and kept for good (user, 2026-10-28); one not given a number yet gets the next
// free one of its stage for now (the self-test asks for it). Units have names; a checkpoint is "◆" (a ✓ read as done
// beside its status: QA round 20), a test "★".
export const LESSONS = [];
export const UNITS = [];
// (each stage's numbers in use, so a lesson without one gets the next free number of its stage)
const usedNums = new Map();
function lessonNumber(stage, id) {
  if (!usedNums.has(stage)) usedNums.set(stage, new Set(stage.units.flatMap((un) => un.lessons.map((l) => LESSON_NUMBERS[l.id])).filter((n) => n != null)));
  const used = usedNums.get(stage);
  if (LESSON_NUMBERS[id] != null) return LESSON_NUMBERS[id];
  let n = 1;
  while (used.has(n)) n++;
  used.add(n);
  return n;
}
{
  let u = 0;
  for (const stage of STAGES) {
    const stageLessons = [];
    for (const unit of stage.units) {
      u++;
      const list = unit.lessons.map((l) => ({ ...l, kind: 'lesson', unit, stage, num: `${stage.level}.${lessonNumber(stage, l.id)}` }));
      if (unit.check) list.push({ ...unit.check, id: `${unit.id}-check`, kind: 'check', title: `Checkpoint: ${unit.title}`, unit, stage, num: '◆', idea: unit.goal });
      UNITS.push({ ...unit, n: u, stage, list });
      LESSONS.push(...list);
      stageLessons.push(...list);
    }
    if (stage.check) {
      const test = { ...stage.check, id: `${stage.id}-test`, kind: 'test', title: `Stage test: ${stage.title}`, unit: null, stage, num: '★', idea: stage.desc };
      LESSONS.push(test);
      stageLessons.push(test);
    }
    stage.lessons = stageLessons;
  }
}
export const lessonById = new Map(LESSONS.map((l) => [l.id, l]));
