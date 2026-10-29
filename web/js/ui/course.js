// The guided Course: the Home block (continue + today's session), the course map, the lesson page
// and the placement check. Lessons open exercises with preset options and a tempo goal (see
// course/data.js); everything stays open, the course only points at the next step.
import { h, icon, toast, rng, infoBtn } from './dom.js';
import { settings, saveSettings } from '../store.js';
import { EXERCISES, byId } from '../curriculum/index.js';
import { SUB_NAMES, paramOptions } from './exercise.js';
import { exHref, go, buildRoutine, routineParams, setRoutine, routineHref, proChip, newChip } from './screens.js';
import { isNew, newCount, markUsed } from '../news.js';
import { isPro, lessonLock, exerciseLock, levelLocked, FREE_LEVELS, FREE_TASTE } from '../pro.js';
import { openPro } from './proSheet.js';
import { maybeAskRating } from './rate.js';
import { replaceHash, goBack, canGoBack, nav } from './nav.js';
import { NEXT_LEVEL, COMPLETE } from '../course/data.js';
import { PLACEMENT } from '../course/placement.js';
import {
  STAGES, LESSONS, UNITS, lessonById, SESSION_LENGTHS,
  stepPassed, stepClean, stepCovered, untickStep, canTicked, setCan, isComplete, isDue, nextReview, dueLessons,
  status, started, anyProgress, continueLesson, firstGap, courseStats, knownUnits, setKnown, placed,
  sessionMinutes, setSessionMinutes, setLast, resetCourse,
  sessionStore, setSession, sessionPractised, clearSession,
} from '../course/progress.js';

const back = (fallback) => (canGoBack() ? goBack() : go(fallback));
const lessonHref = (l) => `#/course/${l.id}`;
/** Opens one step of a lesson (`extra`: { demo: 1 } for the demo). */
export const stepHref = (lesson, i, extra = {}) => exHref(lesson.steps[i].ex, { ...lesson.steps[i].p, ls: `${lesson.id}.${i}`, ...extra });
// (units are named, not numbered: QA rounds 20–21)
const where = (l) => [`Stage ${STAGES.indexOf(l.stage) + 1} · ${l.stage.title}`, l.unit?.title].filter(Boolean).join(' · ');
const lessonName = (l) => (l.kind === 'lesson' ? `Lesson ${l.num} · ${l.title}` : l.title);
const STATUS_ICON = { done: '✓', known: '✓', started: '◐', new: '○' };
/** A Pro stage's lessons free to try, counted on its header: "2 free" (QA round 21). */
const tasteChip = (list) => {
  const n = levelLocked(list[0]?.stage.level) ? list.filter((l) => !lessonLock(l)).length : 0;
  return n ? h('span', { class: 'chip try', title: `${n} lessons of this stage are free to try` }, `${n} free`) : null;
};
/** "Stages 1 and 2", "Stages 1–3"… */
const stagesName = () => (STAGES.length === 2 ? 'Stages 1 and 2' : `Stages 1–${STAGES.length}`);

const daysUntil = (t) => Math.max(0, Math.ceil((t - Date.now()) / 86400000));
const reviewWhen = (l) => { const d = daysUntil(nextReview(l)); return d <= 1 ? 'Next review tomorrow' : `Next review in ${d} days`; };
/** The step a review plays: the last practice step with a tempo goal shows whether the lesson stuck. */
export function reviewStep(l) {
  let i = l.steps.length - 1;
  while (i > 0 && (l.steps[i].music || !l.steps[i].goal)) i--;
  return i;
}
/** The step "Hear it" plays: the first one with a tempo goal (none: the lesson is an ear lesson). */
const demoStep = (l) => l.steps.findIndex((s) => s.goal);

// ---------------------------------------------------------------- today's session
// A teacher's plan for the day at the player's level, about five minutes an exercise: two warm-ups
// (more on request), then the reviews that are due, the next steps of the course (a lesson not
// started opens with its demo) and a focus topic that moves on every session (scales, chords, lines
// and grooves, ear and reading). Warm-ups and focus come from lessons already done or known (the
// latest first), or from the Library at the player's level; what the last two sessions played is
// left out. Once nothing new is left, Library exercises from Levels 5–6 fill in. The session stays
// as it was planned until it is marked as practised.
const isEar = (id) => ['ear', 'reading'].includes(byId.get(id).module) || id === 'iv-ear-quiz';
const practised = (l) => ['done', 'known'].includes(status(l));
/** A free player whose next lesson is Pro: the next lesson free to try (pro.js FREE_TASTE), in its stage or a later
 * one (QA round 21: after Stage 4's two, Stage 5's), or null. */
function tryLesson(cont) {
  if (!cont || !lessonLock(cont)) return null;
  return LESSONS.slice(LESSONS.indexOf(cont)).find((l) => l.kind === 'lesson' && !l.optional && !practised(l) && !lessonLock(l)) || null;
}
const WARM = ['technique', 'fretboard', 'rhythm'];
export const FOCUS = [
  { name: 'Scales', of: (t) => ['scales', 'modes'].includes(t.module) },
  { name: 'Chords', of: (t) => ['triads', 'arpeggios', 'harmony'].includes(t.module) },
  { name: 'Lines and grooves', of: (t) => ['grooves', 'walking', 'licks', 'slap', 'music'].includes(t.module) },
  { name: 'Ear and reading', of: (t) => isEar(t.id) },
];
/** The player's level: the stage of the first lesson not done or known (6 once nothing new is left). */
export const playerLevel = () => firstGap()?.stage.level ?? 6;
const stepItem = (l, i, slot, extra = {}) => ({ id: l.steps[i].ex, params: l.steps[i].p, ls: `${l.id}.${i}`, slot, ...extra });
const libItem = (t, level, rand, slot) => ({ id: t.id, params: routineParams(t, level, rand), slot });
/** A few words for an option's value: its label without the parentheses ("Index (i)" → "Index"). */
const optWords = (def, v) => {
  const lab = String((paramOptions(def, settings).find((o) => String(o[0]) === String(v)) || [, v])[1]);
  const w = lab.replace(/\s*\([^)]*\)/g, '').trim() || lab;
  // (a bare number says what it counts, briefly: "8 per string", "Fingers: 1-2", not "8" or "1-2")
  if (!/^[\d\s\-–:/]+$/.test(w)) return w;
  return /^Notes per /.test(def.label) ? `${w} per ${def.label.slice(10)}` : `${def.label}: ${w}`;
};
/**
 * What tells apart the rows of one exercise in a list ("Beats 2 & 4", "5/4"): the options that
 * differ between them, else the notes per beat; '' for an exercise listed once.
 * `list`: [{ ex, p, sub }].
 */
function variants(list) {
  const out = list.map(() => '');
  const byEx = new Map();
  list.forEach((x, i) => { if (!byEx.has(x.ex)) byEx.set(x.ex, []); byEx.get(x.ex).push(i); });
  for (const [ex, idx] of byEx) {
    const t = byId.get(ex);
    if (idx.length < 2 || !t) continue;
    // (an option a step leaves to the player reads "any key")
    const full = idx.map((i) => Object.fromEntries(Object.keys(t.params || {}).map((k) => [k, k in (list[i].p || {}) ? list[i].p[k] : '*'])));
    // the differing options in order, as many as it takes for every row to read differently (three at most)
    const keys = [];
    const sig = () => idx.map((_, j) => keys.map((k) => String(full[j][k])).join('|'));
    for (const k of Object.keys(t.params || {}).filter((k2) => new Set(full.map((p) => String(p[k2]))).size > 1)) {
      if (keys.length >= 3 || (keys.length && new Set(sig()).size === idx.length)) break;
      keys.push(k);
    }
    // each option gets its share of the room, so a long first option cannot hide the one that differs
    const room = Math.max(10, Math.floor(32 / Math.max(1, keys.length)));
    const cut = (w) => (w.length > room ? `${w.slice(0, room - 1).trimEnd()}…` : w);
    idx.forEach((i, j) => {
      let w = keys.map((k) => cut(full[j][k] === '*' ? `any ${(t.params[k].label || k).toLowerCase()}` : optWords(t.params[k], full[j][k]))).join(' · ');
      if (!w && list[i].sub && new Set(idx.map((x) => list[x].sub)).size > 1) w = SUB_NAMES[list[i].sub];
      out[i] = w;
    });
  }
  return out;
}
/** The tag of a session item: its slot, with what tells it apart from a row of the same exercise (else which step it is). */
// a session row's tag: only what the title does not say, a review, a test, the focus topic, a Library fill-in
// (user, 2026-10-27: no lesson numbers or variants, so the session takes less room beside the favourites)
const stepTag = (it) => (it.warm || /^Lesson /.test(it.slot) ? '' : it.slot);
/** An item's identity inside its session (what gets ticked when it is played). */
const itemKey = (it) => [it.id, it.ls || '', it.demo ? 'demo' : '', it.rv ? 'review' : ''].join('|');
const lessonOf = (it) => (it.ls ? lessonById.get(it.ls.split('.')[0]) : null);

/** Steps of lessons already done or known that `of` accepts, the latest lessons first. */
function metSteps(of) {
  // (a free player's session never offers what is Pro: pro.js)
  return LESSONS.filter((l) => practised(l) && !lessonLock(l)).reverse()
    .flatMap((l) => l.steps.map((s, i) => ({ l, s, i, t: byId.get(s.ex) })))
    .filter((x) => !x.s.music && of(x.t));
}
/** `n` items for a slot: the steps of the latest lessons met (a random pick among the closest), else the Library. */
function pickFor(of, n, { level, rand, slot, skip, withGoal = false }) {
  const out = [];
  const used = (id) => skip(id) || out.some((x) => x.id === id);
  const steps = metSteps(of).filter((x) => !withGoal || x.s.goal || isEar(x.s.ex));
  while (out.length < n) {
    const pool = steps.filter((x) => !used(x.s.ex)).slice(0, 6);
    if (!pool.length) break;
    const x = pool[Math.floor(rand() * pool.length)];
    out.push(stepItem(x.l, x.i, slot));
  }
  const lib = EXERCISES.filter((t) => of(t) && t.level <= level && t.level >= Math.max(1, level - 1) && !exerciseLock(t));
  while (out.length < n) {
    const pool = lib.filter((t) => !used(t.id));
    if (!pool.length) break;
    out.push(libItem(pool[Math.floor(rand() * pool.length)], level, rand, slot));
  }
  return out;
}
// the exercises only optional lessons use (two-hand tapping, double thumbing): never a warm-up
const OPTIONAL_ONLY = (() => {
  const need = new Set(LESSONS.filter((l) => !l.optional).flatMap((l) => l.steps.map((s) => s.ex)));
  return new Set(LESSONS.filter((l) => l.optional).flatMap((l) => l.steps.map((s) => s.ex)).filter((id) => !need.has(id)));
})();
/** Warm-ups: one for the hands first, then the neck or time; `taken` are the ids already in the session. */
function warmUps(n, { level, rand, recent, taken }) {
  const skip = (id) => recent.has(id) || taken.has(id) || OPTIONAL_ONLY.has(id);
  const out = [];
  [(t) => t.module === 'technique', (t) => WARM.includes(t.module)].forEach((of, k) => {
    if (out.length >= n) return;
    out.push(...pickFor(of, k ? n - out.length : 1, { level, rand, slot: 'Warm-up', skip: (id) => skip(id) || out.some((x) => x.id === id), withGoal: true }));
  });
  return out.map((x) => ({ ...x, warm: 1 }));
}
/** The exercises of the next lessons of the course (a warm-up never plays one of them first). */
function upcoming() {
  const cont = continueLesson();
  if (!cont) return new Set();
  const next = LESSONS.slice(LESSONS.indexOf(cont)).filter((l) => !l.optional && !practised(l)).slice(0, 4);
  return new Set(next.flatMap((l) => l.steps.map((s) => s.ex)));
}

function buildSession(minutes, cur, history) {
  // (the warm-ups and the focus come from the session's own seed, so they stay the same whatever
  // its length)
  const rand = rng(cur.seed + minutes * 101);
  // a free player's session keeps to the free levels: Pro's lessons and exercises are never offered there
  // (MONETIZATION-PLAN.md: never a wall in the middle of practising)
  const level = isPro() ? cur.level : Math.min(cur.level, FREE_LEVELS);
  let cont = continueLesson();
  const proNext = cont && lessonLock(cont);
  // (the next lesson is Pro: a lesson free to try in its place, if one is left)
  if (proNext) cont = tryLesson(cont);
  const recent = new Set(history.slice(0, 2).flatMap((s) => s.ids));
  const items = [];
  const has = (id) => items.some((x) => x.id === id);
  // exercises after the warm-ups (a demo is a minute, not a slot)
  const count = () => items.filter((x) => !x.demo && !x.warm).length;
  const n = Math.max(1, Math.round((minutes - 6) / 5));
  // a new player (nothing met yet) gets the first lessons after the warm-ups, nothing beside them
  const fresh = !LESSONS.some(practised);
  items.push(...warmUps(2, { level, rand: rng(cur.seed), recent, taken: upcoming() }));
  // the focus topic: one exercise from 30 minutes, two from 45
  const focusN = fresh ? 0 : n >= 8 ? 2 : n >= 4 ? 1 : 0;
  // reviews that are due: up to a quarter of the session while there is new material, half once not
  for (const l of dueLessons().filter((x) => !lessonLock(x)).slice(0, cont ? Math.max(1, Math.floor(n / 4)) : Math.ceil(n / 2))) items.push(stepItem(l, reviewStep(l), 'Review', { rv: 1 }));
  if (cont) {
    // new material: one lesson (or checkpoint) per 15 minutes, so each gets its time
    let lessons = 0;
    for (const l of LESSONS.slice(LESSONS.indexOf(cont))) {
      if (count() >= n - focusN || lessons >= (fresh ? n : Math.max(1, Math.round(minutes / 15)))) break;
      if (l.optional || practised(l)) continue;
      // (a free player's lessons to try in a Pro stage come in; the session stops at the first that is Pro)
      if (lessonLock(l)) break;
      lessons++;
      const slot = l.kind === 'lesson' ? `Lesson ${l.num}` : l.kind === 'check' ? 'Checkpoint' : 'Stage test';
      // (a demo of an exercise the session already plays for you once is not played again: QA round 20)
      if (l.kind === 'lesson' && !started(l) && demoStep(l) >= 0 && !items.some((x) => x.demo && x.id === l.steps[demoStep(l)].ex)) items.push(stepItem(l, demoStep(l), slot, { demo: 1 }));
      l.steps.forEach((s, i) => { if (count() < n - focusN && !stepClean(l, i)) items.push(stepItem(l, i, slot)); });
    }
  }
  const focus = FOCUS[cur.focus % FOCUS.length];
  const focusRand = rng(cur.seed + 1);
  items.push(...pickFor(focus.of, Math.min(focusN, n - count()), { level, rand: focusRand, slot: focus.name, skip: (id) => recent.has(id) || has(id) }));
  // still room: early reviews of lessons met before, then the Library at the player's level (Levels
  // 5–6 once the course is through; a free player's own levels, QA round 19)
  if (count() < n && (cont || !isPro())) {
    const fresh = LESSONS.filter((l) => practised(l) && !l.optional && !lessonLock(l) && !items.some((x) => lessonOf(x) === l))
      .sort((a, b) => (nextReview(a) || Infinity) - (nextReview(b) || Infinity) || rand() - 0.5);
    for (const l of fresh) {
      if (count() >= n) break;
      items.push(stepItem(l, reviewStep(l), 'Review', isComplete(l) ? { rv: 1 } : {}));
    }
  }
  // after the course the song studies of Levels 5–6 come back too, one in four fill-ins: the payoff
  if (!cont && !fresh) {
    const songs = EXERCISES.filter((t) => t.module === 'music' && (isPro() ? t.level >= 5 : t.level <= level && t.level >= level - 1) && !recent.has(t.id) && !has(t.id) && !exerciseLock(t));
    for (let k = 0; k < Math.max(1, Math.floor((n - count()) / 4)) && songs.length && count() < n; k++) {
      const t = songs.splice(Math.floor(rand() * songs.length), 1)[0];
      items.push({ id: t.id, params: { part: t.params.part.options.some((o) => o[0] === 'all') ? 'all' : '0' }, slot: `Library · L${t.level}` });
    }
  }
  // (a routine has one exercise of each kind: as many as the room needs)
  for (let k = 0; count() < n && !fresh && k < 6; k++) {
    for (const it of buildRoutine(cont || proNext || !isPro() ? level : NEXT_LEVEL, cur.seed + minutes + k * 7919)) {
      if (count() >= n) break;
      if (!has(it.id) && !recent.has(it.id) && !exerciseLock(byId.get(it.id))) items.push({ id: it.id, params: it.params, slot: `Library · L${byId.get(it.id).level}` });
    }
  }
  return items.filter((it) => !itemLock(it));
}
/** Why a session item is closed to a free player (pro.js), or null. */
const itemLock = (it) => (it.ls ? lessonLock(lessonOf(it)) : exerciseLock(byId.get(it.id)));

/** Today's session: planned once for each length and kept until it is marked as practised. */
function todaysSession(minutes) {
  const store = sessionStore();
  let cur = store.cur;
  // a plan from an earlier day with nothing played is planned again (new reviews, the course moved on);
  // one started stays until ✓ Practised (its focus too)
  const day = (t) => new Date(t).toDateString();
  if (cur && !cur.played.length && !cur.extra.length && day(cur.at) !== day(Date.now())) cur = { ...cur, seed: Math.floor(Math.random() * 2 ** 31), at: Date.now(), level: playerLevel(), lists: {} };
  // (the level moved on, by mastery too, before anything was played: planned again for it, as a placement does: QA
  // round 19)
  if (cur && !cur.played.length && !cur.extra.length && cur.level !== playerLevel()) cur = { ...cur, level: playerLevel(), lists: {} };
  if (!cur) cur = { seed: Math.floor(Math.random() * 2 ** 31), at: Date.now(), level: playerLevel(), focus: ((store.history[0]?.focus ?? -1) + 1) % FOCUS.length, lists: {}, extra: [], played: [] };
  if (cur !== store.cur) setSession(cur);
  // (an item whose exercise or lesson step no longer exists is left out; a list with nothing left is
  // planned again)
  const live = (it) => byId.has(it.id) && (!it.ls || lessonOf(it)?.steps[Number(it.ls.split('.')[1])]?.ex === it.id) && !itemLock(it);
  // (Pro bought, or the gates switched: the plans are made again for what the player can open now)
  if ((cur.pro ?? isPro()) !== isPro()) { cur.lists = {}; cur.pro = isPro(); setSession(cur); }
  if (!cur.lists[minutes]?.some(live)) { cur.lists[minutes] = buildSession(minutes, cur, store.history); cur.pro = isPro(); setSession(cur); }
  const list = cur.lists[minutes].filter(live);
  const warm = [...list.filter((x) => x.warm), ...cur.extra.filter(live)];
  return { cur, warm, main: list.filter((x) => !x.warm) };
}

const SESSION_INFO = [
  'Today\'s practice, planned for your level:',
  '🔥 2 warm-ups · + More warm-up for another',
  '↻ The reviews that are due',
  '▶ The next steps of the course',
  '🎧 Hear it: a new lesson\'s exercise, played once for you: listen and watch the neck, then play it',
  '🧭 A focus topic, a new one each session',
  '⏱ Warm-ups ~3 min, the rest ~5 min · ✓ once played through',
  '✓ Practised: the next session follows on',
];
const COURSE_INFO = [
  '6 stages, from your first notes',
  '💡 Each lesson: an idea, a demo, steps with a 🎯 tempo goal',
  '✓ A checkpoint after every unit, a test after every stage',
  '🔓 Nothing is locked · Map: every lesson',
];

/** A description that lists things ("Hold the bass, keep steady time and …") as one short line each. */
const listLines = (text) => text.replace(/\.$/, '').split(/,\s+(?:and\s+)?/).map((x) => `• ${x[0].toUpperCase()}${x.slice(1)}`);

// ---------------------------------------------------------------- Home blocks
/** Where the course goes on: one button, and the map in the corner. */
export function courseBlock() {
  const cont = continueLesson();
  // a free player whose next lesson is Pro: the next lesson free to try, while one is left (FREE_TASTE)
  const taste = tryLesson(cont);
  // a free player whose next lesson is Pro, or who knows every stage (placed): the free stages are behind them,
  // the rest is Pro, and today's session keeps them practising (QA round 19: no bare wall, no "Course complete" for
  // stages never opened)
  const proWall = !taste && !isPro() && (!cont || lessonLock(cont)) && LESSONS.some((l) => lessonLock(l));
  // one row: the title, where the course goes on, the map in the corner
  return h('section', { class: 'block course-block' },
    h('div', { class: 'block-head course-row' }, h('h2', {}, '🎓 Course'), infoBtn(isPro() ? COURSE_INFO : [...COURSE_INFO.slice(0, -1), `🔓 Stages 1–${FREE_LEVELS} free, ${FREE_LEVELS + 1}–6 with Pro: ${FREE_TASTE} lessons of each free to try · Map: every lesson`], 'About the course'),
      proWall
        ? h('div', { class: 'course-done course-wall grow' }, `✓ Stages 1–${FREE_LEVELS}`, h('button', { class: 'btn small locked', onClick: () => openPro(`Stage ${cont ? cont.stage.level : FREE_LEVELS + 1} is part of BassClass Pro`, { then: () => { if (cont) go(lessonHref(cont)); } }) }, `Stages ${FREE_LEVELS + 1}–6`, proChip('Pro')))
        : cont
          ? h('button', { class: 'btn primary course-go', onClick: () => go(lessonHref(taste || cont)) },
            h('b', {}, taste ? '▶ Try free' : anyProgress() || placed() ? '▶ Continue' : '▶ Start'), h('span', {}, lessonName(taste || cont)))
          : h('div', { class: 'course-done grow' }, '✓ Course complete'),
      h('button', { class: 'btn map-btn', title: 'Course map: every lesson', onClick: () => go('#/course') }, h('span', { html: icon('path') }), 'Map')));
}

/** Today's session: warm-ups, the day's practice, ▶ Start and ✓ Practised. `onLength`: its length changed. */
export function sessionBlock({ onLength } = {}) {
  const section = h('section', { class: 'block session-block' });
  const render = () => {
    const minutes = sessionMinutes();
    const { cur, warm, main } = todaysSession(minutes);
    const all = [...warm, ...main].map((it) => ({ ...it, key: itemKey(it) }));
    const played = new Set(cur.played);
    // ticked once played in this session; the course's own next steps also once they are clean (a demo
    // once its lesson is started), never a warm-up, review or focus step of a lesson done before
    const courseItem = (it) => !!it.ls && !it.warm && !it.rv && /^(Lesson|Checkpoint|Stage test)/.test(it.slot);
    const isPlayed = (it) => played.has(it.key) || (courseItem(it) && (it.demo ? started(lessonOf(it)) : stepClean(lessonOf(it), Number(it.ls.split('.')[1]))));
    const start = (i) => { setRoutine(all, 'Session'); go(routineHref(all[i], i)); };
    // (the rows the player plays are numbered; a "Hear it" demo, only listened to, shows 🎧: user, 2026-10-28)
    const nums = [];
    all.reduce((k, it, i) => { nums[i] = it.demo ? null : k + 1; return it.demo ? k : k + 1; }, 0);
    // (rows of the same exercise carry what tells them apart, so no two read alike: QA round 20)
    const vs = variants(all.map((it) => ({ ex: it.demo ? `demo:${it.id}` : it.id, p: it.params, sub: it.ls ? lessonOf(it)?.steps[Number(it.ls.split('.')[1])]?.sub : null })));
    const row = (it, i) => {
      const done = isPlayed(it);
      // (a demo is named after the exercise it plays, not its lesson: user, 2026-10-28)
      const title = `${it.demo ? 'Hear it: ' : ''}${byId.get(it.id).title}`;
      return h('div', { class: `item${done ? ' played' : ''}${it.demo ? ' demo' : ''}`, title: it.demo ? 'Listen: the app plays this lesson\'s example once' : null, onClick: () => start(i) },
        h('div', { class: 'n', 'aria-label': it.demo ? 'Listen' : null }, done ? '✓' : it.demo ? '🎧' : nums[i]),
        h('div', { class: 't' }, h('b', {}, title)),
        stepTag(it) || vs[i] ? h('span', { class: 'tag' }, [stepTag(it), vs[i]].filter(Boolean).join(' · ')) : null);
    };
    const more = () => {
      const taken = new Set(all.map((x) => x.id));
      const [w] = warmUps(1, { level: cur.level, rand: rng(cur.seed + cur.extra.length * 7919 + 1), recent: new Set(), taken });
      if (!w) { toast('No other warm-up at your level'); return; }
      cur.extra.push(w);
      setSession(cur);
      render();
    };
    const next = all.findIndex((it) => !isPlayed(it));
    section.replaceChildren(
      h('div', { class: 'block-head' }, h('h2', {}, '📅 Today\'s session'), infoBtn(SESSION_INFO, 'About today\'s session'), h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, SESSION_LENGTHS.map((m) => h('button', { class: m === minutes ? 'on' : '', onClick: () => { setSessionMinutes(m); render(); onLength?.(); } }, `${m}′`)))),
      h('h4', { class: 'session-sub' }, 'Warm-up'),
      h('div', { class: 'routine session-list' }, all.slice(0, warm.length).map((it, i) => row(it, i)),
        h('button', { class: 'btn more-warm', onClick: more }, '+ More warm-up')),
      h('h4', { class: 'session-sub' }, 'Practice'),
      h('div', { class: 'routine session-list' }, all.slice(warm.length).map((it, i) => row(it, warm.length + i))),
      h('div', { class: 'row session-foot' },
        h('button', { class: 'btn primary', disabled: !all.length, onClick: () => start(Math.max(0, next)) }, next > 0 ? '▶ Carry on' : '▶ Start'),
        h('div', { class: 'grow' }),
        h('button', { class: `btn${next < 0 ? ' primary' : ''}`, onClick: () => {
          // (nothing played yet: ask first, so a double tap never files a plan unseen)
          if (!all.some(isPlayed) && !confirm('Nothing played yet. Mark this session as practised anyway?')) return;
          sessionPractised(all.map((x) => x.id));
          toast('Practised ✓ The next session is ready.', 2500);
          render();
          // (a session done: a moment the rate reminder may ask, after the toast)
          setTimeout(maybeAskRating, 2600);
        } }, '✓ Practised')));
  };
  // (a stored plan that cannot be shown is planned again instead of leaving Home empty)
  const safe = () => {
    try { render(); } catch (err) { console.error(err); clearSession(); render(); }
  };
  safe();
  return section;
}

// ---------------------------------------------------------------- course map
// each stage folds, like the Library's levels: the stages left open are remembered, and until the
// player opens or folds one, only the stage of the next lesson is open. When the next lesson moves to
// another stage, that stage opens once (the folds the player chose stay as they were).
const stageNo = (cont) => (cont ? STAGES.indexOf(cont.stage) + 1 : STAGES.length);
function mapOpen(cont) {
  const at = stageNo(cont);
  if (settings.mapOpen == null) return new Set([at]);
  const s = new Set(settings.mapOpen);
  if (settings.mapAt !== at) { s.add(at); saveSettings({ mapOpen: [...s].sort(), mapAt: at }); }
  return s;
}
function setMapOpen(cont, n, open) {
  const s = mapOpen(cont);
  if (open) s.add(n); else s.delete(n);
  saveSettings({ mapOpen: [...s].sort(), mapAt: stageNo(cont) });
}
export function courseScreen(main) {
  const stats = courseStats();
  const cont = continueLesson();
  const open = mapOpen(cont);
  // jump to a stage (opening it if it is folded)
  const jump = (n) => {
    const fold = main.querySelector(`#stage-${n}`);
    if (!fold) return;
    if (!fold.open) { fold.open = true; setMapOpen(cont, n, true); }
    fold.scrollIntoView({ block: 'start' });
  };
  const row = (l) => {
    const st = status(l);
    const isNext = l === cont;
    return h('a', { class: `les-row ${st}${isNext ? ' next' : ''}${l.kind !== 'lesson' ? ' check' : ''}${lessonLock(l) ? ' locked' : ''}`, href: lessonHref(l) },
      h('span', { class: 'st' }, isNext ? '▶' : STATUS_ICON[st]),
      h('span', { class: 'num' }, l.num),
      h('span', { class: 'tt' }, l.kind === 'lesson' ? l.title : l.kind === 'check' ? 'Checkpoint' : l.title),
      l.optional ? h('span', { class: 'chip' }, 'optional') : null,
      newChip(isNew(`lesson:${l.id}`)),
      proChip(lessonLock(l)),
      levelLocked(l.stage.level) && !lessonLock(l) ? h('span', { class: 'chip try', title: 'Free to try: the rest of this stage is part of BassClass Pro' }, 'Free') : null,
      st === 'known' ? h('span', { class: 'chip' }, 'known') : null,
      isDue(l) ? h('span', { class: 'chip due' }, 'review') : null);
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/') }),
      h('h1', {}, 'Course map'), infoBtn(['▶ next lesson · ◐ started · ✓ done or known', '🔓 In order, or jump anywhere', '🎯 A step: one full loop at its goal tempo, then ✓ Clean', '↻ Done lessons come back as reviews (1, 3, 7, 21, 60 days)'], 'About the course map'),
      h('span', { class: 'muted' }, `${stats.done} of ${stats.total} lessons done${stats.known ? ` · ${stats.known} known` : ''}`)),
    // jump to a stage (the map is long on a phone)
    h('div', { class: 'tabs lv-jump map-jump' }, STAGES.map((stage, si) => h('button', { title: stage.title, onClick: () => jump(si + 1) }, `S${si + 1}`))),
    ...STAGES.flatMap((stage, si) => {
      // lessons only (checkpoints and the test are not counted, as on Home)
      const list = stage.lessons.filter((l) => !l.optional && l.kind === 'lesson');
      const done = list.filter((l) => status(l) === 'done').length;
      const known = list.filter((l) => status(l) === 'known').length;
      const fold = h('details', { class: 'lv-fold map-fold', id: `stage-${si + 1}`, open: open.has(si + 1) },
        h('summary', { class: 'section stage-head' }, h('span', { class: `chip lv lv${stage.level}` }, `Stage ${si + 1}`), h('h2', {}, stage.title), proChip(levelLocked(stage.level) ? `Stage ${stage.level} is part of BassClass Pro` : null), tasteChip(list), newChip(newCount(list.map((l) => `lesson:${l.id}`)) > 0, newCount(list.map((l) => `lesson:${l.id}`))), infoBtn(listLines(stage.desc), `About Stage ${si + 1}`), h('span', { class: 'muted small' }, `${done}/${list.length} lessons${known ? ` (${known} known)` : ''}`)),
        h('div', { class: 'grid unit-grid' },
          UNITS.filter((u) => u.stage === stage).map((u) => h('div', { class: 'unit-card' },
            h('h3', {}, u.title, infoBtn(u.goal, `About ${u.title}`)),
            h('div', { class: 'les-list' }, u.list.map(row)))),
          stage.lessons.filter((l) => l.kind === 'test').map((l) => h('div', { class: 'unit-card test' },
            h('h3', {}, '★ Stage test'), h('div', { class: 'les-list' }, row(l))))));
      // (the toggle event also fires when the map is drawn: only a change is saved)
      fold.addEventListener('toggle', () => { if (mapOpen(cont).has(si + 1) !== fold.open) setMapOpen(cont, si + 1, fold.open); });
      return [fold];
    }),
    ...(COMPLETE ? [] : [h('p', { class: 'muted small', style: { marginTop: '18px' } }, `More stages (Level ${NEXT_LEVEL} onward) are on the way. The Library has every exercise in the meantime, by level or by topic.`)]),
    h('div', { class: 'row', style: { marginTop: '18px' } }, h('button', { class: 'btn', onClick: () => {
      if (!confirm('Reset all course progress (tempos, ticks, reviews and your level)?')) return;
      resetCourse();
      toast('Course progress reset');
      courseScreen(main);
    } }, 'Reset course progress')));
  // a fresh visit shows the next lesson when it is not on the first screen (a new player, whose next
  // lesson is the first, sees the top); Back keeps the place the player left (the router restores
  // it, the top too; two frames: after the router's own restore)
  // (a next lesson in a folded stage is not scrolled to)
  const nextRow = main.querySelector('details[open] .les-row.next');
  if (nextRow && !nav.returning && nextRow !== main.querySelector('details[open] .les-row')) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const r = nextRow.getBoundingClientRect(), m = main.getBoundingClientRect();
      if (r.top < m.top + 60 || r.bottom > m.bottom) nextRow.scrollIntoView({ block: 'center' });
    }));
  }
}

// ---------------------------------------------------------------- lesson page
export function lessonScreen(main, id) {
  const l = lessonById.get(id);
  if (!l) { replaceHash('#/course'); return; }
  // a Pro lesson opens for a free player as a preview: read it, hear it, try each step once (user, 2026-10-29: "allow
  // free users to check what is in Pro"); nothing is ticked or recorded
  const preview = lessonLock(l);
  if (!preview) setLast(l.id);
  markUsed(`lesson:${l.id}`);
  const rerender = () => { const y = main.scrollTop; lessonScreen(main, id); main.scrollTop = y; };
  const idx = LESSONS.indexOf(l);
  const prev = LESSONS[idx - 1], nextL = LESSONS[idx + 1];
  const st = status(l);
  const due = isDue(l);
  const rv = reviewStep(l);
  // rows of the same exercise are told apart by a chip ("Beats 2 & 4")
  const vars = variants(l.steps);
  const stepRow = (s, i) => {
    const t = byId.get(s.ex);
    const clean = stepClean(l, i), passed = stepPassed(l, i);
    // the essentials only: the Library number and the goal (the step's text is the exercise's tip)
    const tempo = `#${t.num} · ${s.goal ? `🎯 ${s.goal} BPM${s.sub ? ` in ${SUB_NAMES[s.sub]}` : ''}` : 'one full round'}`;
    // a tick can be taken back, after a question (user, 2026-10-29); a step its exercise's mastery ticks says so,
    // and its untick takes the mastery back too
    const byMastery = clean && stepCovered(l, i);
    const untick = clean ? h('button', { class: 'icon-btn untick', title: 'Untick: practise this step again', 'aria-label': 'Untick this step', onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm(byMastery ? 'This step is ticked because you mastered its exercise. Untick it? ✓ Mastered is taken back too, in the Library and the course.' : 'Untick this step? The lesson counts as done again once every step is ticked.')) return;
      untickStep(l, i);
      rerender();
    } }, '↺') : null;
    return h('a', { class: `step-row${clean ? ' clean' : passed ? ' passed' : ''}${s.music ? ' music' : ''}`, href: stepHref(l, i, due && i === rv ? { rv: 1 } : {}) },
      h('span', { class: 'n' }, clean ? '✓' : i + 1),
      h('span', { class: 't' },
        s.music ? h('small', { class: 'music-tag' }, '🎵 Make music') : null,
        h('b', {}, t.title, vars[i] ? h('span', { class: 'chip var' }, vars[i]) : null, due && i === rv ? h('span', { class: 'chip due' }, 'review') : null),
        h('span', { class: 'tempo' }, tempo, byMastery ? h('span', { class: 'by-mastery' }, ' · ✓ mastered in the Library') : null)),
      untick,
      h('span', { class: 'go', html: icon('next') }));
  };
  const canList = (l.can || []).map((text, i) => {
    const box = h('input', { type: 'checkbox', checked: canTicked(l, i), disabled: !!preview });
    box.addEventListener('change', () => { if (setCan(l, i, box.checked)) toast(`${l.kind === 'lesson' ? 'Lesson' : l.title} complete ✓`); rerender(); });
    return h('label', { class: 'can-row' }, box, h('span', {}, text));
  });
  const demoAt = demoStep(l);
  const footer = isComplete(l)
    ? h('div', { class: 'les-done' }, h('b', {}, '✓ Complete'), h('span', { class: 'muted small' },
      due ? `A review is due: play step ${rv + 1} once more at its goal tempo and tick ✓ Still clean?` : `${reviewWhen(l)}, in that day's session on Home.`))
    : null;
  const intro = l.kind === 'lesson' && demoAt >= 0
    ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => go(stepHref(l, demoAt, { demo: 1 })) }, '▶ Hear it'),
      infoBtn('👂 Played once at the goal tempo: watch the neck and listen', 'About Hear it'))
    : null;
  const canInfo = l.kind === 'check'
    ? ['🎯 Each step at its goal tempo, cleanly', '✓ Tick only what you can really do', '↩ Shaky? Back to its lesson: nothing is locked']
    : ['🎯 The whole stage: each step at its goal tempo', '✓ Then tick what you can now do'];
  const stepsInfo = [l.steps.some((s) => s.goal)
    ? '🎯 One full loop from the first note at the goal tempo, then ✓ Clean'
    : '👂 One full round, then ✓ if you named every answer first',
  ...(l.kind === 'lesson' && demoAt < 0 ? ['An ear lesson: no demo, the rounds play before their answers'] : [])];
  main.replaceChildren(
    h('div', { class: 'page-head les-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/course') }),
      h('div', { class: 'les-title' }, h('small', {}, where(l), l.optional ? h('span', { class: 'chip opt' }, 'optional') : null), h('h1', {}, lessonName(l))),
      h('div', { class: 'grow' }),
      st === 'known' ? h('span', { class: 'chip' }, 'known (My level)') : null,
      prev ? h('button', { class: 'icon-btn', title: `Previous: ${lessonName(prev)}`, 'aria-label': 'Previous lesson', html: icon('prev'), onClick: () => go(lessonHref(prev)) }) : null,
      nextL ? h('button', { class: 'icon-btn', title: `Next: ${lessonName(nextL)}`, 'aria-label': 'Next lesson', html: icon('next'), onClick: () => go(lessonHref(nextL)) }) : null),
    preview ? h('div', { class: 'pro-preview-bar' }, h('span', {}, '⭐ A Pro lesson: read it, hear it and try its steps once'),
      h('button', { class: 'btn small locked', onClick: () => openPro(preview, { then: rerender }) }, 'Get Pro', proChip(preview))) : null,
    h('div', { class: 'les-cols' },
      h('div', { class: 'les-main' },
        l.idea ? h('div', { class: 'idea-box' }, l.idea) : null,
        // (open on the first stage: the basics a beginner needs to read)
        l.concept?.length ? h('details', { class: 'les-read', open: l.stage === STAGES[0] }, h('summary', {}, '📖 Read more'), ...l.concept.map((para) => h('p', {}, para))) : null,
        l.tuner ? h('div', { class: 'row' }, h('button', { class: 'btn', onClick: () => go('#/tuner') }, 'Open the tuner')) : null,
        intro,
        canList.length ? h('div', { class: 'can-list' }, h('h4', {}, 'I can…', infoBtn(canInfo, 'About this list')), ...canList) : null),
      h('div', { class: 'les-steps' },
        h('h4', {}, 'Practise', infoBtn(stepsInfo, 'About the steps')),
        ...l.steps.map(stepRow),
        footer,
        // (the title gives way, the Pro chip and › keep their place: QA round 21)
        nextL ? h('button', { class: `btn${isComplete(l) && !lessonLock(nextL) ? ' primary' : ''} les-next${lessonLock(nextL) ? ' locked' : ''}`, onClick: () => go(lessonHref(nextL)) }, h('span', { class: 'les-next-t' }, `Next: ${lessonName(nextL)}`), proChip(lessonLock(nextL)), h('span', {}, '›')) : null),
      l.mistakes?.length ? h('details', { class: 'les-more' }, h('summary', {}, `⚠ Watch out (${l.mistakes.length})`), h('ul', { class: 'mistakes' }, l.mistakes.map((m) => h('li', {}, m)))) : null));
}

// ---------------------------------------------------------------- placement check

export function placementScreen(main) {
  const known = knownUnits();
  // every line starts at "Not yet": the player taps Yes for what they already play (an earlier
  // placement shows its own answers). `set` holds the lines answered on this visit: "All yes" fills
  // the earlier stages' other lines.
  const answers = PLACEMENT.map(([, units]) => placed() && units.every((u) => known[u]));
  const set = new Set();
  const rows = h('div', { class: 'place-list' });
  const done = h('button', { class: 'btn primary' }, 'See my starting point');
  // the questions grouped by the stage of their units, each stage with "all yes" / "all not yet"
  const stageOf = (i) => UNITS.find((u) => u.id === PLACEMENT[i][1][0])?.stage;
  const render = () => {
    const out = [];
    STAGES.forEach((stage, si) => {
      const idx = PLACEMENT.map((_, i) => i).filter((i) => stageOf(i) === stage);
      if (!idx.length) return;
      // "All not yet" also answers the later stages; "All yes" the earlier lines not answered yet
      const all = (v) => {
        PLACEMENT.forEach((_, i) => {
          const s2 = STAGES.indexOf(stageOf(i));
          if (s2 === si || (v === false && s2 > si) || (v === true && s2 < si && !set.has(i))) { answers[i] = v; set.add(i); }
        });
        render();
      };
      out.push(h('div', { class: 'place-stage' }, h('span', { class: `chip lv lv${stage.level}` }, `Stage ${si + 1}`), h('b', {}, stage.title), h('div', { class: 'grow' }),
        h('button', { class: 'btn', onClick: () => all(true) }, 'All yes'), h('button', { class: 'btn', onClick: () => all(false) }, 'All not yet')));
      for (const i of idx) {
        out.push(h('div', { class: 'place-row' },
          h('span', {}, PLACEMENT[i][0]),
          h('div', { class: 'seg' }, [[true, 'Yes'], [false, 'Not yet']].map(([v, lab]) => h('button', { class: answers[i] === v ? 'on' : '', onClick: () => { answers[i] = v; set.add(i); render(); } }, lab)))));
      }
    });
    rows.replaceChildren(...out);
  };
  done.addEventListener('click', () => {
    // units answered "yes" are marked as known; the course starts at the first lesson that is not
    setKnown(PLACEMENT.flatMap(([, units], i) => (answers[i] ? units : [])));
    const cont = continueLesson();
    // (a free player whose starting point is Pro: what the session holds meanwhile: QA round 19)
    const free = !isPro();
    toast(cont && !lessonLock(cont) ? `Start here: ${lessonName(cont)}`
      : free && tryLesson(cont) ? `Your starting point is Stage ${cont.stage.level}, part of BassClass Pro. ${FREE_TASTE} lessons of each Pro stage are free to try: start with ${lessonName(tryLesson(cont))}`
      : free ? `Your starting point is Stage ${cont ? cont.stage.level : 6}, part of BassClass Pro: today's session keeps you practising Levels ${FREE_LEVELS - 1}–${FREE_LEVELS} meanwhile`
        : `You know ${stagesName()}: today's session brings Library exercises from Levels 5 and 6`, 4500);
    // back to where the check was opened from (the map or Home), which now shows the starting point
    if (canGoBack()) goBack(); else replaceHash('#/');
  });
  render();
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/') }),
      h('h1', {}, 'My level'), infoBtn(['☐ Every line starts at Not yet', '✓ Tap Yes for what you already play', '⇈ All yes on a stage: the stages before it too', '✓ What you know is marked as known', '▶ The course starts at the first gap', '↻ Change it any time'], 'About this survey')),
    rows,
    h('div', { class: 'row', style: { marginTop: '12px' } }, done));
}
