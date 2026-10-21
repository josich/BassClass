// The guided Course: the Home block (continue + today's session), the course map, the lesson page
// and the placement check. Lessons open exercises with preset options and a tempo goal (see
// course/data.js); everything stays open, the course only points at the next step.
import { h, icon, toast, rng } from './dom.js';
import { settings } from '../store.js';
import { byId, defaultParams } from '../curriculum/index.js';
import { paramSummary, SUB_NAMES } from './exercise.js';
import { exHref, go, buildRoutine, setRoutine, routineHref } from './screens.js';
import { replaceHash } from './nav.js';
import { NEXT_LEVEL, COMPLETE } from '../course/data.js';
import {
  STAGES, LESSONS, UNITS, lessonById, SESSION_LENGTHS,
  stepState, stepPassed, stepClean, setClean, canTicked, setCan, isComplete, isDue, nextReview, dueLessons,
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
/** "Stages 1 and 2", "Stages 1–3"… */
const stagesName = () => (STAGES.length === 2 ? 'Stages 1 and 2' : `Stages 1–${STAGES.length}`);
/** "goal 96 BPM in 8ths", or "one full round" for an ear or note-finding step. */
const goalText = (s) => (s.goal ? `goal ${s.goal} BPM${s.sub ? ` in ${SUB_NAMES[s.sub]}` : ''}` : 'one full round');

/** The step's own options in words ("Major (Ionian) · Root on: A string"): the rest stay the player's. */
function presetSummary(tpl, p) {
  const defs = Object.fromEntries(Object.keys(p).filter((k) => tpl.params?.[k]).map((k) => [k, tpl.params[k]]));
  return paramSummary({ params: defs }, { ...defaultParams(tpl), ...p }, settings);
}
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
// About five minutes per item: a warm-up, the reviews that are due, the next steps of the course
// (a lesson not started yet opens with its demo), and at 30 and 45 minutes an ear or reading drill.
// The warm-up and the drill come from lessons already done (or known), so nothing untaught turns up.
const EAR_MODULES = ['ear', 'reading', 'intervals'];
const practised = (l) => ['done', 'known'].includes(status(l));

export function buildSession(minutes) {
  const n = Math.round(minutes / 5);
  const t = new Date();
  const day = t.getFullYear() * 10000 + (t.getMonth() + 1) * 100 + t.getDate();
  const rand = rng(day * 7 + minutes);
  const pick = (list) => list[Math.floor(rand() * list.length)];
  const cont = continueLesson();
  const items = [];
  const has = (id) => items.some((x) => x.id === id);
  const stepItem = (l, i, slot, extra = {}) => ({ id: l.steps[i].ex, params: l.steps[i].p, ls: `${l.id}.${i}`, slot, lesson: l, ...extra });
  const count = () => items.filter((x) => !x.demo).length; // a demo is a minute, not a slot

  // what the player has already met: the source of the warm-up and the ear or reading drill
  const met = LESSONS.filter(practised).flatMap((l) => l.steps.map((s, i) => ({ l, s, i }))).filter((x) => !x.s.music);
  const earPool = met.filter((x) => EAR_MODULES.includes(byId.get(x.s.ex).module));
  const handsPool = met.filter((x) => !EAR_MODULES.includes(byId.get(x.s.ex).module) && x.s.goal);
  const tail = n >= 6 && earPool.length ? pick(earPool) : null;
  const room = n - (handsPool.length ? 1 : 0) - (tail ? 1 : 0);

  for (const l of dueLessons().slice(0, Math.max(1, Math.floor(n / 3)))) items.push(stepItem(l, reviewStep(l), 'Review', { rv: 1 }));
  if (cont) {
    // new material: one lesson (or checkpoint) per 15 minutes, so each gets its time
    let lessons = 0;
    for (const l of LESSONS.slice(LESSONS.indexOf(cont))) {
      if (count() >= room || lessons >= Math.max(1, Math.round(minutes / 15))) break;
      if (l.optional || practised(l)) continue;
      lessons++;
      const slot = l.kind === 'lesson' ? `Lesson ${l.num}` : l.kind === 'check' ? 'Checkpoint' : 'Stage test';
      if (l.kind === 'lesson' && !started(l) && demoStep(l) >= 0) items.push(stepItem(l, demoStep(l), slot, { demo: 1 }));
      l.steps.forEach((s, i) => { if (count() < room && !stepClean(l, i)) items.push(stepItem(l, i, slot)); });
    }
  }
  // nothing new left (the course is done, or known from the placement): early reviews, then the
  // Library's next level until the next stage of the course exists
  if (count() < room) {
    const fresh = LESSONS.filter((l) => practised(l) && !l.optional && !items.some((x) => x.lesson === l))
      .sort((a, b) => (nextReview(a) || Infinity) - (nextReview(b) || Infinity) || rand() - 0.5);
    // with nothing new in the course, about half the room goes to the Library's next level
    const upTo = cont ? room : Math.max(1, Math.ceil(room / 2));
    for (const l of fresh) {
      if (count() >= upTo) break;
      items.push(stepItem(l, reviewStep(l), 'Review', isComplete(l) ? { rv: 1 } : {}));
    }
  }
  if (count() < room && !cont) {
    for (const it of buildRoutine(NEXT_LEVEL, day + 21)) {
      if (count() >= room) break;
      if (!has(it.id)) items.push({ id: it.id, params: it.params, slot: `Level ${NEXT_LEVEL}` });
    }
  }
  if (tail) items.push(stepItem(tail.l, tail.i, byId.get(tail.s.ex).module === 'reading' ? 'Reading' : 'Ear'));
  const warm = handsPool.filter((x) => !has(x.s.ex));
  if (warm.length) { const w = pick(warm); items.unshift(stepItem(w.l, w.i, 'Warm-up')); }
  return items;
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
  const reached = stats.done + stats.known;
  const next = cont
    ? h('div', { class: 'course-next', onClick: () => go(lessonHref(cont)) },
      h('small', {}, where(cont)),
      h('b', {}, lessonName(cont)),
      h('span', { class: 'idea' }, cont.idea || ''),
      h('div', { class: 'row' }, h('button', { class: 'btn primary' }, started(cont) ? '▶ Continue lesson' : '▶ Start lesson'), h('div', { class: 'grow' }),
        h('span', { class: 'muted small' }, `${reached}/${stats.total} lessons`)),
      h('div', { class: 'bar' }, h('i', { style: { width: `${(reached / stats.total) * 100}%` } })))
    : h('div', { class: 'course-next done' },
      h('b', {}, stats.known ? `✓ ${stagesName()}: ${stats.done} done, ${stats.known} known` : `✓ ${stagesName()} complete`),
      h('span', { class: 'muted small' }, COMPLETE
        ? `Today's session keeps the lessons fresh and adds Level ${NEXT_LEVEL} exercises from the Library.`
        : `More stages are on the way. Until then, today's session mixes reviews of these lessons with Level ${NEXT_LEVEL} exercises from the Library.`));
  section.append(head, h('div', { class: 'course-cols' }, next, sessionPanel()));
  return section;
}

function sessionPanel() {
  const wrap = h('div', { class: 'session' });
  const render = () => {
    const minutes = sessionMinutes();
    const items = buildSession(minutes);
    const start = (i) => { setRoutine(items, 'Session'); go(routineHref(items[i], i)); };
    wrap.replaceChildren(
      h('div', { class: 'row session-head' }, h('b', {}, 'Today\'s session'), h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, SESSION_LENGTHS.map((m) => h('button', { class: m === minutes ? 'on' : '', onClick: () => { setSessionMinutes(m); render(); } }, `${m} min`))),
        h('button', { class: 'btn primary', disabled: !items.length, onClick: () => start(0) }, '▶ Start session')),
      h('div', { class: 'routine session-list' }, items.map((it, i) => {
        const t = byId.get(it.id);
        const step = it.lesson?.steps[Number(it.ls.split('.')[1])];
        return h('div', { class: `item${it.demo ? ' demo' : ''}`, onClick: () => start(i) },
          h('div', { class: 'n' }, i + 1),
          h('div', { class: 't' }, h('b', {}, `${it.slot}: `, it.demo ? `▶ Hear it · ${it.lesson.title}` : [h('span', { class: 'ex-num' }, t.num), t.title]),
            h('span', {}, it.demo ? (it.lesson.idea || '') : [it.lesson?.title, presetSummary(t, it.params)].filter(Boolean).join(' · '))),
          step?.goal && !it.demo ? h('span', { class: 'chip', title: `Goal: ${goalText(step)}` }, `🎯 ${step.goal}`) : null);
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
    h('p', { class: 'muted small course-intro' }, 'Work through the lessons in order, or jump to any of them: nothing is locked. A step is done when you play a full loop from the first note at its goal tempo and tick ✓ Clean. Completed lessons come back for short reviews (after 1, 3, 7, 21 and 60 days) in today\'s session on Home.'),
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
    COMPLETE ? null : h('p', { class: 'muted small', style: { marginTop: '18px' } }, `More stages (Level ${NEXT_LEVEL} onward) are on the way. The Library and the Path have every exercise in the meantime.`),
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
  if (!l) { replaceHash('#/course'); return; }
  setLast(l.id);
  const rerender = () => { const y = main.scrollTop; lessonScreen(main, id); main.scrollTop = y; };
  const idx = LESSONS.indexOf(l);
  const prev = LESSONS[idx - 1], nextL = LESSONS[idx + 1];
  const st = status(l);
  const due = isDue(l);
  const rv = reviewStep(l);
  const stepRow = (s, i) => {
    const t = byId.get(s.ex);
    const ss = stepState(l.id, i);
    const clean = stepClean(l, i), passed = stepPassed(l, i);
    const tempo = `Exercise ${t.num} · ${s.goal ? `from ${s.from} → ${goalText(s)}${ss.best ? ` · best ${ss.best}` : ''}` : `one full round${ss.loops ? ' · played' : ''}`}`;
    // a tick can be taken back here (not in the exercise, where a second tap would undo a lesson)
    const untick = clean ? h('button', { class: 'icon-btn untick', title: 'Untick: practise this step again', 'aria-label': 'Untick this step', onClick: (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!confirm('Untick this step? The lesson counts as done again once every step is ticked.')) return;
      setClean(l, i, false);
      rerender();
    } }, '↺') : null;
    return h('a', { class: `step-row${clean ? ' clean' : passed ? ' passed' : ''}${s.music ? ' music' : ''}`, href: stepHref(l, i, due && i === rv ? { rv: 1 } : {}) },
      h('span', { class: 'n' }, clean ? '✓' : i + 1),
      h('span', { class: 't' },
        s.music ? h('small', { class: 'music-tag' }, '🎵 Make music') : null,
        h('b', {}, t.title, due && i === rv ? h('span', { class: 'chip due' }, 'review') : null),
        h('span', { class: 'do' }, s.do || presetSummary(t, s.p)),
        h('span', { class: 'tempo' }, tempo)),
      untick,
      h('span', { class: 'go', html: icon('next') }));
  };
  const canList = (l.can || []).map((text, i) => {
    const box = h('input', { type: 'checkbox', checked: canTicked(l, i) });
    box.addEventListener('change', () => { if (setCan(l, i, box.checked)) toast(`${l.kind === 'lesson' ? 'Lesson' : l.title} complete ✓`); rerender(); });
    return h('label', { class: 'can-row' }, box, h('span', {}, text));
  });
  const demoAt = demoStep(l);
  const footer = isComplete(l)
    ? h('div', { class: 'les-done' }, h('b', {}, '✓ Complete'), h('span', { class: 'muted small' },
      due ? `A review is due: play step ${rv + 1} once more at its goal tempo and tick ✓ Still clean?` : `${reviewWhen(l)}, in that day's session on Home.`))
    : null;
  const intro = l.kind === 'lesson'
    ? (demoAt >= 0
      ? h('div', { class: 'row' }, h('button', { class: 'btn primary', onClick: () => go(stepHref(l, demoAt, { demo: 1 })) }, '▶ Hear it'),
        h('span', { class: 'muted small' }, 'The app plays it once at the goal tempo: watch the neck and listen.'))
      : h('p', { class: 'muted small' }, 'An ear lesson: each round plays before its answer appears, so there is nothing to show first.'))
    : h('p', { class: 'muted' }, l.kind === 'check'
      ? 'Before moving on: play each step at its goal tempo, cleanly, and tick what you can honestly do. Anything shaky? Go back to its lesson; nothing is locked.'
      : 'The whole stage in a few minutes: the steps below at their goal tempos, and the list of what you can now do.');
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
        l.tuner ? h('div', { class: 'row' }, h('button', { class: 'btn', onClick: () => go('#/tuner') }, 'Open the tuner')) : null,
        intro,
        canList.length ? h('div', { class: 'can-list' }, h('h4', {}, 'I can…'), ...canList) : null),
      h('div', { class: 'les-steps' },
        h('h4', {}, 'Practise'),
        h('p', { class: 'muted small' }, l.steps.some((s) => s.goal)
          ? 'Play a full loop from the first note at the goal tempo, then tick ✓ Clean in the exercise when it really was clean.'
          : 'Play one full round, then tick ✓ in the exercise if you named every answer before it appeared.'),
        ...l.steps.map(stepRow),
        footer,
        nextL ? h('button', { class: `btn${isComplete(l) ? ' primary' : ''} les-next`, onClick: () => go(lessonHref(nextL)) }, `Next: ${lessonName(nextL)} ›`) : null),
      l.mistakes?.length ? h('div', { class: 'les-more' }, h('h4', {}, 'Watch out for'), h('ul', { class: 'mistakes' }, l.mistakes.map((m) => h('li', {}, m)))) : null));
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
  ['I play hammer-ons, pull-offs, clean shifts and string skips.', ['u-legato']],
  ['I play 16th-note funk with ghost notes, moving accents and triplet feels.', ['u-funk']],
  ['I know every note in any position and read up to the 9th position.', ['u-positions']],
  ['I play two-octave scales, the three scale fingerings, sequences and every key in one position.', ['u-scales3', 'u-sequences']],
  ['I know the seven modes of the major scale and the note that colours each one.', ['u-modes']],
  ['I play the triads and 7th chords of any key, in three fingerings and in inversions.', ['u-triads3', 'u-sevenths3']],
  ['I play chord-tone lines, approach notes, double stops, world grooves and a basic walking line.', ['u-moving', 'u-jazz-first']],
  ['I stretch one finger per fret low on the neck, play 16ths for minutes and play natural harmonics.', ['u-stamina']],
  ['I play groupings over 4/4, displaced figures and in 5/4, 7/8 and 7/4, and keep time with a sparse click.', ['u-time4']],
  ['I know the 7 major and 5 pentatonic positions in any key and read in every key.', ['u-keys']],
  ['I play harmonic and melodic minor, their chords and minor-key progressions.', ['u-minor']],
  ['I know each mode on its own, choose the right scale for each chord and hear common progressions.', ['u-modes4']],
  ['I play the chords of a key in inversions and in 4ths, voice-lead triads and 7ths, and play guide tones.', ['u-triads4', 'u-voicelead', 'u-sevenths4']],
  ['I play diatonic 10ths and scales in octaves.', ['u-tenths']],
  ['I walk complete lines through a jazz blues and play soul and odd-meter grooves.', ['u-walking4', 'u-grooves4']],
  ['I play finger permutations across the strings, p-i-m arpeggios and polyrhythms such as 3:2 and 5:4.', ['u-hands5']],
  ['I use interval cycles, the diminished and whole-tone scales, side-stepping and world scales.', ['u-outside']],
  ['I play bebop scales, the 6th-diminished scale and chromatic approaches and enclosures.', ['u-bebop']],
  ['I know the modes of melodic and harmonic minor and superimpose pentatonics and melodic minor over chords.', ['u-modes5', 'u-superimpose']],
  ['I play triad permutations and pairs, quartal stacks, upper structures and extended or altered arpeggios.', ['u-triads5', 'u-colours', 'u-arps5']],
  ['I outline secondary dominants, borrowed chords and tritone subs, and keep funk grooves through changes.', ['u-harmony5']],
  ['I walk with enclosures, two chords per bar and in minor keys.', ['u-walking5']],
  ['I play jazz licks in all keys and build solos from bass-line devices and motifs.', ['u-licks', 'u-solo']],
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
    toast(cont ? `Start here: ${lessonName(cont)}` : `You know ${stagesName()}: today's session reviews them and adds Level ${NEXT_LEVEL}`, 3500);
    // back to where the check was opened from (the map or Home), which now shows the starting point
    if (history.state?.depth > 0) history.back(); else replaceHash('#/course');
  });
  render();
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/course') }),
      h('h1', {}, 'Find your level'), h('span', { class: 'muted' }, 'Answer honestly. Units you already know are marked as known and the course starts at the first gap. You can change this any time.')),
    rows,
    h('div', { class: 'row', style: { marginTop: '12px' } }, done));
}
