// The guided Course: the Home block (continue + today's session), the course map, the lesson page
// and the placement check. Lessons open exercises with preset options and a tempo goal (see
// course/data.js); everything stays open, the course only points at the next step.
import { h, icon, toast, note, rng } from './dom.js';
import { settings } from '../store.js';
import { byId, defaultParams } from '../curriculum/index.js';
import { paramSummary } from './exercise.js';
import { exHref, go, buildRoutine, setRoutine } from './screens.js';
import {
  STAGES, LESSONS, UNITS, lessonById, SESSION_LENGTHS,
  stepState, stepPassed, stepClean, canTicked, setCan, isComplete, isDue, nextReview, dueLessons,
  status, started, anyProgress, continueLesson, courseStats, knownUnits, setKnown, placed,
  sessionMinutes, setSessionMinutes, setLast, resetCourse,
} from '../course/progress.js';

const back = (fallback) => (history.state?.depth > 0 ? history.back() : go(fallback));
const lessonHref = (l) => `#/course/${l.id}`;
/** Opens one step of a lesson (`extra`: { demo: 1 } for the demo). */
export const stepHref = (lesson, i, extra = {}) => exHref(lesson.steps[i].ex, { ...lesson.steps[i].p, ls: `${lesson.id}.${i}`, ...extra });
const where = (l) => [`Stage ${STAGES.indexOf(l.stage) + 1} · ${l.stage.title}`, l.unit ? `Unit ${UNITS.find((u) => u.id === l.unit.id).n} · ${l.unit.title}` : null].filter(Boolean).join(' · ');
const lessonName = (l) => (l.kind === 'lesson' ? `Lesson ${l.num} · ${l.title}` : l.title);
const STATUS_ICON = { done: '✓', known: '✓', started: '◐', new: '○' };

/** The step's own options in words ("Major (Ionian) · Root on: A string"): the rest stay the player's. */
function presetSummary(tpl, p) {
  const defs = Object.fromEntries(Object.keys(p).filter((k) => tpl.params?.[k]).map((k) => [k, tpl.params[k]]));
  return paramSummary({ params: defs }, { ...defaultParams(tpl), ...p }, settings);
}
const daysUntil = (t) => Math.max(0, Math.ceil((t - Date.now()) / 86400000));

// ---------------------------------------------------------------- today's session
// About five minutes per item: a warm-up for the hands, the reviews that are due, the next steps
// of the course, and (30 and 45 minutes) an ear or reading drill at the end.
const EXTRA = {
  1: [{ id: 'ear-triads', params: { set: 'mm' }, slot: 'Ear' }, { id: 'rd-naturals', params: { range: 'all' }, slot: 'Reading' }],
  2: [{ id: 'iv-ear-quiz', params: { set: 'basic' }, slot: 'Ear' }, { id: 'ear-triads', params: { set: 'all' }, slot: 'Ear' },
    { id: 'rd-accidentals', params: { range: 'all' }, slot: 'Reading' }, { id: 'rd-melodies', params: { key: '7' }, slot: 'Reading' }],
};

function reviewStep(l) {
  // the last practice step with a tempo goal is the one that shows whether the lesson stuck
  let i = l.steps.length - 1;
  while (i > 0 && (l.steps[i].music || !l.steps[i].goal)) i--;
  return i;
}

export function buildSession(minutes) {
  const n = Math.round(minutes / 5);
  const t = new Date();
  const day = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
  const rand = rng(day * 7 + minutes);
  const cont = continueLesson();
  const stage = cont?.stage || STAGES[STAGES.length - 1];
  const items = [];
  const pool = EXTRA[stage.level] || EXTRA[2];
  const tail = n >= 6 ? pool[Math.floor(rand() * pool.length)] : null;
  // room for the reviews and lessons (the warm-up opens the session, the ear or reading drill ends it)
  const room = n - 1 - (tail ? 1 : 0);
  for (const l of dueLessons().slice(0, Math.max(1, Math.floor(n / 3)))) {
    const i = reviewStep(l);
    items.push({ id: l.steps[i].ex, params: l.steps[i].p, ls: `${l.id}.${i}`, slot: 'Review', lesson: l });
  }
  if (cont) {
    for (const l of LESSONS.slice(LESSONS.indexOf(cont))) {
      if (items.length >= room) break;
      if (l.optional || ['done', 'known'].includes(status(l))) continue;
      l.steps.forEach((s, i) => {
        if (items.length < room && !stepClean(l, i)) items.push({ id: s.ex, params: s.p, ls: `${l.id}.${i}`, slot: l.kind === 'lesson' ? `Lesson ${l.num}` : l.kind === 'check' ? 'Checkpoint' : 'Stage test', lesson: l });
      });
    }
  }
  // the course is finished (or nothing is left today): keep the lessons fresh with early reviews
  if (items.length < room) {
    const doneList = LESSONS.filter((l) => status(l) === 'done' && !items.some((x) => x.lesson === l)).sort((a, b) => nextReview(a) - nextReview(b));
    for (const l of doneList) {
      if (items.length >= room) break;
      const i = reviewStep(l);
      items.push({ id: l.steps[i].ex, params: l.steps[i].p, ls: `${l.id}.${i}`, slot: 'Review', lesson: l });
    }
  }
  if (tail) items.push(tail);
  // the warm-up: from the daily routine of the stage's level, never an exercise the session already has
  const warm = buildRoutine(stage.level, day + stage.level * 7).find((x) => !items.some((it) => it.id === x.id));
  if (warm) items.unshift({ id: warm.id, params: warm.params, slot: 'Warm-up' });
  return items.slice(0, n);
}

function sessionItemHref(it, i) {
  return exHref(it.id, { ...it.params, ...(it.ls ? { ls: it.ls } : {}), wu: i });
}

// ---------------------------------------------------------------- Home block
export function courseBlock() {
  const section = h('section', { class: 'block course-block' });
  const cont = continueLesson();
  const stats = courseStats();
  const head = h('div', { class: 'block-head' }, h('h2', {}, '🎓 Course'), h('div', { class: 'grow' }),
    h('button', { class: 'btn', onClick: () => go('#/course') }, 'Course map'));
  if (!anyProgress() && !placed()) {
    const first = LESSONS[0];
    section.append(head,
      h('p', { class: 'muted small' }, 'A guided path from your first notes: short lessons, each with an idea, a demo, practice steps with tempo goals and the mistakes to avoid, and a checkpoint after every unit. Everything stays open: the course just shows you the next step.'),
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onClick: () => go(lessonHref(first)) }, `▶ Start: ${lessonName(first)}`),
        h('button', { class: 'btn', onClick: () => go('#/course/placement') }, 'Already play? Find your level')));
    return section;
  }
  const next = cont
    ? h('div', { class: 'course-next', onClick: () => go(lessonHref(cont)) },
      h('small', {}, where(cont)),
      h('b', {}, lessonName(cont)),
      h('span', { class: 'idea' }, cont.idea || ''),
      h('div', { class: 'row' }, h('button', { class: 'btn primary' }, started(cont) ? '▶ Continue' : '▶ Start lesson'), h('div', { class: 'grow' }),
        h('span', { class: 'muted small' }, `${stats.done + stats.known}/${stats.total} lessons`)),
      h('div', { class: 'bar' }, h('i', { style: { width: `${((stats.done + stats.known) / stats.total) * 100}%` } })))
    : h('div', { class: 'course-next done' },
      h('b', {}, '✓ Stages 1 and 2 complete'),
      h('span', { class: 'muted small' }, 'More stages are on the way. Until then, today\'s session keeps your lessons fresh, and the Library\'s Level 3 is the next step.'));
  section.append(head, h('div', { class: 'course-cols' }, next, sessionPanel()));
  return section;
}

function sessionPanel() {
  const wrap = h('div', { class: 'session' });
  const render = () => {
    const minutes = sessionMinutes();
    const items = buildSession(minutes);
    const start = (i) => { setRoutine(items, 'Session'); go(sessionItemHref(items[i], i)); };
    wrap.replaceChildren(
      h('div', { class: 'row session-head' }, h('b', {}, 'Today\'s session'), h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, SESSION_LENGTHS.map((m) => h('button', { class: m === minutes ? 'on' : '', onClick: () => { setSessionMinutes(m); render(); } }, `${m} min`))),
        h('button', { class: 'btn primary', disabled: !items.length, onClick: () => start(0) }, '▶ Start')),
      h('div', { class: 'routine session-list' }, items.map((it, i) => {
        const t = byId.get(it.id);
        const goal = it.lesson?.steps[Number(it.ls.split('.')[1])].goal;
        return h('div', { class: 'item', onClick: () => start(i) },
          h('div', { class: 'n' }, i + 1),
          h('div', { class: 't' }, h('b', {}, `${it.slot}: `, h('span', { class: 'ex-num' }, t.num), t.title),
            h('span', {}, [it.lesson?.title, presetSummary(t, it.params)].filter(Boolean).join(' · '))),
          goal ? h('span', { class: 'chip', title: `Goal: ${goal} BPM` }, `🎯 ${goal}`) : null);
      })));
  };
  render();
  return wrap;
}

// ---------------------------------------------------------------- course map
export function courseScreen(main) {
  const stats = courseStats();
  const cont = continueLesson();
  const row = (l) => {
    const st = status(l);
    const isNext = l === cont;
    return h('a', { class: `les-row ${st}${isNext ? ' next' : ''}${l.kind !== 'lesson' ? ' check' : ''}`, href: lessonHref(l) },
      h('span', { class: 'st' }, isNext ? '▶' : STATUS_ICON[st]),
      h('span', { class: 'num' }, l.num),
      h('span', { class: 'tt' }, l.kind === 'lesson' ? l.title : l.kind === 'check' ? 'Checkpoint' : l.title),
      l.optional ? h('span', { class: 'chip' }, 'optional') : null,
      st === 'known' ? h('span', { class: 'chip' }, 'known') : null,
      isDue(l) ? h('span', { class: 'chip due' }, 'review') : null);
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/') }),
      h('h1', {}, 'Course'), h('span', { class: 'muted' }, `${stats.done} of ${stats.total} lessons done${stats.known ? ` · ${stats.known} known` : ''}`), h('div', { class: 'grow' }),
      cont ? h('button', { class: 'btn primary', onClick: () => go(lessonHref(cont)) }, `▶ ${lessonName(cont)}`) : null,
      h('button', { class: 'btn', onClick: () => go('#/course/placement') }, placed() ? 'Placement check' : 'Find your level')),
    h('p', { class: 'muted small course-intro' }, 'Work through the lessons in order, or jump to any of them: nothing is locked. A step is done when you reach its goal tempo for a full loop and tick ✓ Clean. Completed lessons come back for short reviews (after 1, 3, 7 and 21 days) in today\'s session on Home.'),
    ...STAGES.flatMap((stage, si) => {
      const list = stage.lessons.filter((l) => !l.optional);
      const done = list.filter((l) => status(l) === 'done').length;
      return [
        h('div', { class: 'section' }, h('span', { class: `chip lv lv${stage.level}` }, `Stage ${si + 1}`), h('h2', {}, stage.title), h('span', { class: 'muted small' }, `${done}/${list.length} · ${stage.desc}`)),
        h('div', { class: 'grid unit-grid' },
          UNITS.filter((u) => u.stage === stage).map((u) => h('div', { class: 'unit-card' },
            h('h3', {}, h('span', { class: 'ex-num' }, u.n), u.title),
            h('p', {}, u.goal),
            h('div', { class: 'les-list' }, u.list.map(row)))),
          stage.lessons.filter((l) => l.kind === 'test').map((l) => h('div', { class: 'unit-card test' },
            h('h3', {}, '★ Stage test'), h('p', {}, 'Everything from this stage at once.'), h('div', { class: 'les-list' }, row(l))))),
      ];
    }),
    h('p', { class: 'muted small', style: { marginTop: '18px' } }, 'More stages (Level 3 onward) are on the way. The Library and the Path have every exercise in the meantime.'),
    h('div', { class: 'row' }, h('button', { class: 'btn', onClick: () => {
      if (!confirm('Reset all course progress (tempos, ticks, reviews and your placement)?')) return;
      resetCourse();
      toast('Course progress reset');
      courseScreen(main);
    } }, 'Reset course progress')));
}

// ---------------------------------------------------------------- lesson page
export function lessonScreen(main, id) {
  const l = lessonById.get(id);
  if (!l) { location.replace('#/course'); return; }
  setLast(l.id);
  const idx = LESSONS.indexOf(l);
  const prev = LESSONS[idx - 1], nextL = LESSONS[idx + 1];
  const st = status(l);
  const stepRow = (s, i) => {
    const t = byId.get(s.ex);
    const ss = stepState(l.id, i);
    const clean = stepClean(l, i), passed = stepPassed(l, i);
    const tempo = s.goal ? `from ${s.from} → goal ${s.goal} BPM${ss.best ? ` · best ${ss.best}` : ''}` : `one full loop${ss.loops ? ' · played' : ''}`;
    return h('a', { class: `step-row${clean ? ' clean' : passed ? ' passed' : ''}${s.music ? ' music' : ''}`, href: stepHref(l, i) },
      h('span', { class: 'n' }, clean ? '✓' : i + 1),
      h('span', { class: 't' },
        s.music ? h('small', { class: 'music-tag' }, '🎵 Make music') : null,
        h('b', {}, h('span', { class: 'ex-num' }, t.num), t.title),
        h('span', { class: 'do' }, s.do || presetSummary(t, s.p)),
        h('span', { class: 'tempo' }, tempo)),
      h('span', { class: 'go', html: icon('next') }));
  };
  const canList = (l.can || []).map((text, i) => {
    const box = h('input', { type: 'checkbox', checked: canTicked(l, i) });
    box.addEventListener('change', () => { if (setCan(l, i, box.checked)) toast(`${l.kind === 'lesson' ? 'Lesson' : l.title} complete ✓`); lessonScreen(main, id); });
    return h('label', { class: 'can-row' }, box, h('span', {}, text));
  });
  const demoAt = l.steps.findIndex((s) => s.goal) >= 0 ? l.steps.findIndex((s) => s.goal) : 0;
  const footer = isComplete(l)
    ? h('div', { class: 'les-done' }, h('b', {}, '✓ Complete'), h('span', { class: 'muted small' },
      isDue(l) ? 'A review is due: play the steps once more at the goal tempo and tick ✓ Clean.' : `Next review in ${daysUntil(nextReview(l))} day${daysUntil(nextReview(l)) === 1 ? '' : 's'}, in today's session.`))
    : null;
  main.replaceChildren(
    h('div', { class: 'page-head les-head' },
      h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/course') }),
      h('div', { class: 'les-title' }, h('small', {}, where(l)), h('h1', {}, lessonName(l))),
      h('div', { class: 'grow' }),
      st === 'known' ? h('span', { class: 'chip' }, 'known (placement)') : null,
      prev ? h('button', { class: 'icon-btn', title: `Previous: ${lessonName(prev)}`, 'aria-label': 'Previous lesson', html: icon('prev'), onClick: () => go(lessonHref(prev)) }) : null,
      nextL ? h('button', { class: 'icon-btn', title: `Next: ${lessonName(nextL)}`, 'aria-label': 'Next lesson', html: icon('next'), onClick: () => go(lessonHref(nextL)) }) : null),
    h('div', { class: 'les-cols' },
      h('div', { class: 'les-main' },
        l.idea ? h('div', { class: 'idea-box' }, l.idea) : null,
        ...(l.concept || []).map((para) => h('p', {}, para)),
        l.kind === 'lesson'
          ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => go(stepHref(l, demoAt, { demo: 1 })) }, '▶ Hear it'),
            h('span', { class: 'muted small' }, 'The app plays it once at the goal tempo: watch the neck and listen.'))
          : h('p', { class: 'muted' }, l.kind === 'check'
            ? 'Before moving on: play each step at its goal tempo, cleanly, and tick what you can honestly do. Anything shaky? Go back to its lesson; nothing is locked.'
            : 'The whole stage in a few minutes: the steps below at their goal tempos, and the list of what you can now do.'),
        canList.length ? h('div', { class: 'can-list' }, h('h4', {}, 'I can…'), ...canList) : null,
        l.mistakes?.length ? h('div', {}, h('h4', {}, 'Watch out for'), h('ul', { class: 'mistakes' }, l.mistakes.map((m) => h('li', {}, m)))) : null),
      h('div', { class: 'les-steps' },
        h('h4', {}, 'Practise'),
        h('p', { class: 'muted small' }, 'Reach the goal tempo for a full loop, then tick ✓ Clean in the exercise when it really was clean.'),
        ...l.steps.map(stepRow),
        footer,
        nextL ? h('button', { class: `btn${isComplete(l) ? ' primary' : ''} les-next`, onClick: () => go(lessonHref(nextL)) }, `Next: ${lessonName(nextL)} ›`) : null)));
}

// ---------------------------------------------------------------- placement check
const PLACEMENT = [
  ['I pluck with alternating fingers and fret with one finger per fret.', ['u-hands']],
  ['I keep steady time with a metronome and can count 8ths, triplets and 16ths.', ['u-time']],
  ['I know the notes on the E and A strings, sharps and flats, and the octave shape.', ['u-notes']],
  ['I play root, 5th and octave lines through a song.', ['u-lines']],
  ['I play major, minor and pentatonic scales and major and minor triads in any key.', ['u-scales', 'u-chords']],
  ['I read bass-clef notes in first position.', ['u-reading']],
  ['I rake, mute cleanly and shift up the neck without a gap.', ['u-hands2']],
  ['I play off-beats, swing, dotted rhythms and syncopation.', ['u-feel']],
  ['I find any note anywhere up to fret 12 and play every interval.', ['u-neck', 'u-intervals']],
  ['I know the four triad types, the five 7th chords and the chords of a major key.', ['u-triads2', 'u-sevenths']],
  ['I play the 12-bar blues with boogie and shuffle lines, octave grooves and riffs.', ['u-blues', 'u-grooves']],
  ['I read melodies with sharps, flats and a key signature.', ['u-reading2']],
];

export function placementScreen(main) {
  const known = knownUnits();
  const answers = PLACEMENT.map(([, units]) => (placed() ? units.every((u) => known[u]) : null));
  const rows = h('div', { class: 'place-list' });
  const done = h('button', { class: 'btn primary' }, 'See my starting point');
  const render = () => {
    rows.replaceChildren(...PLACEMENT.map(([text], i) => h('div', { class: 'place-row' },
      h('span', {}, text),
      h('div', { class: 'seg' }, [[true, 'Yes'], [false, 'Not yet']].map(([v, lab]) => h('button', { class: answers[i] === v ? 'on' : '', onClick: () => { answers[i] = v; render(); } }, lab))))));
    done.disabled = answers.some((a) => a == null);
  };
  done.addEventListener('click', () => {
    // units answered "yes" are marked as known; the course starts at the first lesson that is not
    setKnown(PLACEMENT.flatMap(([, units], i) => (answers[i] ? units : [])));
    const cont = continueLesson();
    note(cont ? `Start here: ${lessonName(cont)}` : 'You know everything in Stages 1 and 2');
    location.replace('#/course');
  });
  render();
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/course') }),
      h('h1', {}, 'Find your level'), h('span', { class: 'muted' }, 'Answer honestly. Units you already know are marked as known and the course starts at the first gap. You can change this any time.')),
    rows,
    h('div', { class: 'row', style: { marginTop: '12px' } }, done));
}
