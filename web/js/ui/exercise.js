// Exercise player screen: fretboard with step-by-step dots, tab strip and transport.
import { h, icon, toast, esc, infoBtn } from './dom.js';
import { starButton } from './favorites.js';
import { settings, saveSettings, getProgress, updateProgress } from '../store.js';
import { makeCtx } from '../fretboard.js';
import { FretboardView, degKey, PALETTE } from '../views/fretboardView.js';
import { TabView } from '../views/tabView.js';
import { Player, MAX_BPM, MIN_BPM } from '../player.js';
import * as A from '../audio.js';
import * as T from '../theory.js';
import { moduleOf, LEVELS, defaultParams } from '../curriculum/index.js';
import { CYCLE_OPTS, PROGS, tonicFor } from '../curriculum/common.js';
import { harmonyTrack, harmonyAt, NO_BACKING } from '../harmony.js';
import { recordLoop, rememberTempo, stepState, stepPassed, stepClean, stepCovered, setClean, untickStep, isDue, isComplete, reviewed } from '../course/progress.js';
import { goalOf, goalText as masteryGoal, meetsGoal, setMastered, isMastered, SUB_NAMES } from '../mastery.js';
import { openPro } from './proSheet.js';
import { JUDGED, startTake, judge, playTake, keepResult, resultFor } from '../judge.js';
import { tapSet, placesOf } from '../curriculum/games.js';
import { spellMidi } from '../builder.js';
import { logPlaying } from '../practiceLog.js';

// a Pro exercise opened by a free player plays its first bars once, a preview (user, 2026-10-29)
const PREVIEW_BEATS = 16;

// what a lesson step's goal tempo counts in ("goal 96 BPM in 8ths"; the list lives in mastery.js)
export { SUB_NAMES };
const SUBS = [['0.25', 'Whole'], ['0.5', 'Half'], ['1', '♩ 1/beat'], ['2', '♪ 2/beat'], ['3', '3 triplets'], ['4', '4 16ths'], ['5', '5 quint.'], ['6', '6 sext.']];
// the modules whose drills have no backing (see harmony.js), named for the greyed Backing's toast
const NO_BACKING_NAME = { technique: 'technique drills', rhythm: 'rhythm drills', fretboard: 'note-finding drills', intervals: 'interval drills', ear: 'ear training' };
// the cycling buttons: each state's name (said in a toast when it is picked) and its icon (Backing
// keeps its words: clearer than any icon)
const REVEALS = [['gradual', 'Step by step', 'revStep'], ['full', 'Whole shape', 'revShape'], ['quiz', 'Quiz', 'revQuiz']];
const LABELS = [['note', 'Note names', 'lblNote'], ['degree', 'Degrees', 'lblDeg'], ['finger', 'Fingers', 'lblFinger'], ['none', 'No labels', 'lblNone']];
const BACKINGS = { off: 'Off', drone: 'Drone', chords: 'Chords' };
const SCORES = { tab: ['Tab', 'tab'], staff: ['Staff', 'staff'] };
const RANK = { ghost: 0, future: 1, past: 2, next: 3, current: 4 };
const TRAIL = 16;

export function noteLabel(n, mode, notation) {
  if (mode === 'note') return T.noteName(n.n, notation);
  if (mode === 'degree') return n.deg ?? '';
  if (mode === 'finger') return n.finger === 0 ? 'o' : (n.finger ?? '');
  return '';
}

/**
 * How the key chips are spelled: for the chosen scale, chord or minor progression when the
 * exercise has one, so the chip matches what plays (a minor key shows "C♯m", not "D♭").
 */
function keySpelling(def, p) {
  if (PROGS[p.prog]?.minor || p.type === 'minor' || p.mode === 'minor' || def.minorWhen?.(p)) return { ivs: T.SCALES.aeolian.iv, suffix: def.suffix || 'm' };
  if (PROGS[p.prog]) return { ivs: T.SCALES.ionian.iv, suffix: def.suffix || '' };
  const sc = T.SCALES[p.scale] || T.SCALES[p.type];
  return { ivs: sc?.iv || T.CHORDS[p.quality]?.iv || def.ivs, suffix: def.suffix || '', type: T.SCALES[p.scale] ? p.scale : T.SCALES[p.type] ? p.type : null };
}

/** Options for a param (key params are spelled for the current notation and the selected scale/chord). */
export function paramOptions(def, S, p = {}) {
  if (def.kind === 'key') {
    const { ivs, suffix, type } = keySpelling(def, p);
    const opts = T.CHROMATIC_PC.map((pcv) => [String(pcv), T.noteName(def.plain ? T.flatRoot(pcv) : type ? tonicFor(pcv, type) : T.bestRoot(pcv, ivs), S.notation) + suffix]);
    return def.cycles ? [...opts, ...CYCLE_OPTS] : opts;
  }
  // options marked { minStrings } only exist on basses with that many strings
  return def.options.filter((o) => !o[2]?.minStrings || (S.strings || 4) >= o[2].minStrings);
}

/** "Label: value" when the value alone does not say what it is (short or numeric values). */
const optText = (def, label) => ((label.length <= 3 || /^\d/.test(label) || label.includes('→')) && !label.toLowerCase().includes(def.label.toLowerCase()) ? `${def.label}: ${label}` : label);

/** One-line summary of an exercise's options (header button, warm-up list). */
export function paramSummary(tpl, p, S, fixed = {}) {
  return Object.entries(tpl.params || {}).map(([k, def]) => {
    if (fixed[k]) return `${def.label}: ${fixed[k]}`;
    const o = paramOptions(def, S, p).find((x) => x[0] === p[k]);
    return optText(def, o ? o[1] : String(p[k] ?? ''));
  }).join(' · ');
}

export function renderExercise(root, tpl, { params = {}, onBack, routine = null, lesson = null, preview = null }) {
  const S = settings;
  const prog = getProgress(tpl.id) || {};
  // `preview`: a Pro exercise opened by a free player (the reason it is Pro): every option can be seen and tried, its
  // first bars play once, no loop, and nothing is recorded (user, 2026-10-29: "allow free users to check what is in
  // Pro exercises, even to see the options")
  const offerPro = () => openPro(preview);
  // a warm-up or a lesson opens exercises with preset options: they must not replace the player's own choices
  const keep = () => (routine || lesson ? {} : { params: p });
  // a course lesson step: L = the lesson, LI = the step's index, LS = the step
  const L = lesson?.lesson, LI = lesson?.index, LS = lesson?.step;
  const demo = !!lesson?.demo;
  // a completed lesson due for review (or opened as a review from today's session): the goal has to be
  // played again in this visit
  let reviewing = !!(lesson && !demo && isComplete(L) && (isDue(L) || lesson.review));
  // a step without a tempo goal is an ear or note-finding round: one full round, then "got them all?"
  const earStep = !!(LS && !LS.goal);
  // the reading game, played here (see "read it, tap it" below)
  const TAP = tpl.game?.kind === 'read';
  let visitPassed = false, passShown = false;
  let alive = true;
  // "Continue" on Home reopens the last exercise opened
  if (!preview) updateProgress(tpl.id, {});
  const p = { ...defaultParams(tpl), ...(prog.params || {}), ...params };
  for (const [k, def] of Object.entries(tpl.params || {})) {
    if (!paramOptions(def, S, p).some((o) => o[0] === p[k])) p[k] = def.default;
  }
  // a lesson step that leaves the key free stays as long as the lesson meant it: a saved
  // "All 12 keys" would multiply a one-key step by 12, and an all-keys step keeps its cycle
  if (lesson) {
    const cycle = (v) => CYCLE_OPTS.some((o) => o[0] === v);
    for (const [k, def] of Object.entries(tpl.params || {})) {
      if (def.kind !== 'key' || k in (lesson.step.p || {})) continue;
      if (cycle(def.default) !== cycle(p[k])) p[k] = def.default;
    }
  }
  let ctx = makeCtx(S);
  let inst = null;
  // a lesson step plays in its own subdivision (part of the lesson's options, never saved to the exercise)
  let userSub = lesson ? (LS.sub ?? null) : (prog.sub ?? null);
  let labelMode = prog.label || null;
  let reveal = S.reveal;
  let score = null; // 'tab' | 'staff' (reading exercises open on the staff)
  let segStart = [], segEnd = [], chordAt = [], textAt = [];
  let cur = -1;
  let warnedFret = 0;
  // (a lesson's own tip replaces the fret notice when the step opens, so it repeats it)
  const fretNote = () => (warnedFret ? ` This variation reaches fret ${warnedFret}, above your highest fret.` : '');

  document.body.classList.add('in-ex');
  const mod = moduleOf(tpl.module);
  const lvl = LEVELS[tpl.level - 1];

  // ------------------------------------------------------------ layout
  const btn = (name, title, onClick, cls = '') => h('button', { class: `icon-btn ${cls}`, title, 'aria-label': title, html: icon(name), onClick });
  // (a control that sounds itself gives no tap tick: Play, and ‹ › which play the note)
  const silent = (el) => { el.dataset.silent = ''; return el; };
  const playBtn = silent(btn('play', 'Play / pause (space)', () => playPress(), 'big'));
  // (Play is the red ● of a take that is ready, and its ■ while it runs)
  const playPress = () => (TAP ? tapStart() : rec?.phase === 'armed' ? startRec() : rec ? cancelTake() : player.toggle());
  // all exercise options live behind one clear button (a strip of selects gets cut off on phones)
  const optsSum = h('span', { class: 'opts-sum' });
  const hasParams = Object.keys(tpl.params || {}).length > 0;
  const optsBtn = hasParams ? h('button', { class: 'opts-btn', title: 'Change scale, key, pattern…', onClick: () => (sheet.classList.contains('open') ? closeOptions() : openOptions()) },
    h('span', { class: 'opts-ico', html: icon('sliders') }),
    h('span', { class: 'opts-txt' }, h('small', {}, 'Options · tap to change'), optsSum)) : h('div', { class: 'grow' });
  const sheet = h('div', { class: 'sheet', onClick: (e) => { if (e.target === sheet) closeOptions(); } });
  const lessonName = L ? (L.kind === 'lesson' ? `Lesson ${L.num}` : L.kind === 'check' ? L.title : 'Stage test') : '';
  const goalText = () => (LS?.goal ? `goal ${LS.goal} BPM${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}` : 'one full round');
  const subtitle = L
    ? `${lessonName} · ${demo ? 'demo: listen and watch' : `step ${LI + 1}/${L.steps.length} · ${goalText()}`}`
    : `${mod?.name ?? ''}${tpl.song ? ' · our own line in its style, not the record\'s' : ''} · Level ${tpl.level} ${lvl ? lvl.name : ''}${preview ? ' · Pro preview' : ''}`;
  // a tap on the title shows the exercise in the Library, at its level, its card highlighted (user, 2026-10-29)
  const toLibrary = () => { location.hash = `#/library?f=${encodeURIComponent(tpl.id)}`; };
  const titleEl = h('div', { class: 'exv-title to-lib', role: 'link', tabindex: 0, 'aria-label': `${tpl.title}: show it in the Library`, onClick: toLibrary, onKeydown: (e) => { if (e.key === 'Enter') toLibrary(); } },
    h('b', { title: `${tpl.title} · show it in the Library` }, h('span', { class: 'ex-num' }, tpl.num), tpl.short || tpl.title), h('span', { title: subtitle }, subtitle));
  let nextBtn = null;
  if (routine) {
    const last = routine.index + 1 >= routine.total;
    nextBtn = h('button', { class: 'btn primary routine-next', title: `${routine.label || 'Warm-up'}: exercise ${routine.index + 1} of ${routine.total}`, onClick: () => routine.next() },
      h('small', {}, `${routine.index + 1}/${routine.total}`), last ? 'Finish ✓' : 'Next ›');
  } else if (lesson) {
    const last = LI + 1 >= L.steps.length;
    nextBtn = demo
      ? h('button', { class: 'btn primary routine-next', title: 'Practise the first step', onClick: () => lesson.next() }, 'Practise ›')
      : h('button', { class: `btn routine-next${stepClean(L, LI) ? ' primary' : ''}`, title: last ? 'Back to the lesson' : 'Next step of the lesson', onClick: () => (lessonDone ? close() : lesson.next()) },
        h('small', {}, `${LI + 1}/${L.steps.length}`), last ? 'Done ›' : 'Next ›');
  }
  // the step's pass mark: its goal tempo (recorded by the app), then the player's own "clean" tick
  const goalBtn = lesson && !demo && !preview ? h('button', { class: 'btn goal-btn', onClick: () => onGoal() }) : null;
  // (in a preview, the Pro offer in its place)
  const previewBtn = preview ? h('button', { class: 'btn small locked pro-try', title: preview, onClick: offerPro }, '⭐ Preview', h('span', { class: 'chip pro' }, 'Pro')) : null;
  let lessonDone = false; // the lesson was completed in this visit: Next goes back to its page
  // 🎙 a recorded take, judged by the app (a prototype on a few single-note exercises: judge.js)
  const recBtn = JUDGED.has(tpl.id) && !preview && !demo ? btn('mic', 'Record a take: the app listens and judges it', () => openRec()) : null;
  const top = h('header', { class: `exv-top${lesson ? ' lesson' : ''}` },
    btn('back', 'Back', () => close()), titleEl, optsBtn, goalBtn, previewBtn, nextBtn, recBtn,
    starButton(tpl.id, { cls: 'icon-btn' }),
    btn('tuner', 'Tuner', () => { location.hash = '#/tuner'; }), btn('info', 'About this exercise', () => openDrawer()));

  const boardEl = h('div', { class: 'exv-board' });
  const nowEl = h('div', { class: 'exv-now' });
  const promptEl = h('div', { class: 'exv-prompt' });
  const beatsEl = h('div', { class: 'beat-dots' });
  const fbHost = h('div', { class: 'fb-host' });
  // a tip to read (the lesson step's instruction, a hint, an explanation): it belongs to this screen,
  // stays until it is closed, and closes as soon as anything else in the exercise is pressed
  const tipEl = h('div', { class: 'coach', role: 'status', hidden: true });
  boardEl.append(fbHost, nowEl, promptEl, beatsEl);
  const tabEl = h('div', { class: 'exv-tab' });
  // a take: its card (before and after) over the stage, and while it runs a badge that leaves the neck in view
  const recLayer = h('div', { class: 'rec-layer', hidden: true, onClick: (e) => { if (e.target === recLayer) closeRec(); } });
  const recBadge = h('div', { class: 'rec-badge', role: 'status', hidden: true }, h('i'), h('span', {}, 'Recording: play from the first note'),
    h('button', { class: 'btn small', onClick: () => cancelTake() }, 'Stop'));
  // (the tip sits low, over the strip, so it never hides the first notes on the neck)
  // (the reading game's end card)
  const tapEndEl = h('div', { class: 'game-end', hidden: true, onClick: (e) => { if (e.target === tapEndEl) tapEndEl.hidden = true; } });
  const stage = h('div', { class: 'exv-stage' }, boardEl, tabEl, tipEl, recLayer, recBadge, tapEndEl);

  const bpmVal = h('div', { class: 'bpm' });
  const bpmRange = h('input', { type: 'range', min: MIN_BPM, max: MAX_BPM, step: 1, 'aria-label': 'Tempo' });
  bpmRange.addEventListener('input', () => setBpm(Number(bpmRange.value)));
  const tempo = h('div', { class: 'tempo' },
    h('button', { class: 'lbl-btn', 'aria-label': 'Slower', onClick: () => setBpm(player.bpm - 2) }, '−'), bpmRange,
    h('button', { class: 'lbl-btn', 'aria-label': 'Faster', onClick: () => setBpm(player.bpm + 2) }, '+'), bpmVal);
  const subSel = h('select', { class: 'mini-sel', title: 'Notes per beat' }, SUBS.map(([v, l]) => h('option', { value: v }, l)));
  subSel.addEventListener('change', () => {
    userSub = Number(subSel.value);
    player.setSub(userSub);
    if (!lesson && !preview) updateProgress(tpl.id, { sub: userSub });
    renderTab();
    syncGoal();
  });
  // shown instead of the subdivision select when the rhythm is part of the exercise (licks, grooves…)
  const rhythmBtn = h('button', { class: 'lbl-btn written', title: 'Why can\'t I change the subdivision?',
    onClick: () => tip('The rhythm is written into this exercise, so the subdivision is fixed. Change the tempo instead.') }, '♪ Written rhythm');
  const loopBtn = btn('loop', 'Loop', () => { if (preview) { offerPro(); return; } player.loop = !player.loop; syncToggles(); });
  const metroBtn = btn('metro', 'Metronome', () => { player.metro = !player.metro; saveSettings({ metro: player.metro }); syncToggles(); });
  const soundBtn = btn('sound', 'Bass sound on/off', () => { player.sound = !player.sound; syncToggles(); });
  const trainerBtn = btn('trainer', 'Speed trainer (+4 BPM each loop)', () => (preview ? offerPro() : toggleTrainer()));
  const doneBtn = btn('check', 'Mark as mastered', () => (preview ? offerPro() : toggleDone()));
  const revealBtn = h('button', { class: 'lbl-btn ico', title: 'Reveal mode: step by step / whole shape / quiz', onClick: () => cycleReveal() });
  const backingBtn = h('button', { class: 'lbl-btn', title: 'Backing: off / a drone on the root / the chords', onClick: () => cycleBacking() });
  const scoreBtn = h('button', { class: 'lbl-btn ico', title: 'Under the neck: tab or bass-clef staff', onClick: () => cycleScore() });
  const labelBtn = h('button', { class: 'lbl-btn ico', title: 'Dot labels: note / degree / finger / none', onClick: () => cycleLabel() });
  // secondary controls: inline on wide screens, in a "⋯" popover on phones (see .more-pop in app.css)
  const item = (el, text) => h('div', { class: 'mi' }, el, h('span', { class: 'mi-l', onClick: () => el.click() }, text));
  const morePop = h('div', { class: 'more-pop' },
    h('div', { class: 'sep' }), item(metroBtn, 'Metronome'), item(soundBtn, 'Bass sound'), item(trainerBtn, 'Speed trainer'),
    item(backingBtn, 'Backing'),
    h('div', { class: 'sep' }), item(revealBtn, 'Reveal'), item(labelBtn, 'Dot labels'), item(scoreBtn, 'Tab / staff'), h('div', { class: 'grow' }), item(doneBtn, 'Mastered'));
  const moreBtn = btn('more', 'More controls', () => toggleMore(), 'more-btn');
  const ctrl = h('footer', { class: 'exv-ctrl' },
    btn('restart', 'Back to start', () => restart()), silent(btn('prev', 'Previous note (←)', () => manual(-1))), playBtn,
    silent(btn('next', 'Next note (→)', () => manual(1))), h('div', { class: 'sep' }), tempo, subSel, rhythmBtn, h('div', { class: 'sep' }),
    loopBtn, morePop, moreBtn);

  const drawer = h('aside', { class: 'drawer' });
  const view = h('div', { class: 'exv' }, top, stage, ctrl);
  root.replaceChildren(view, drawer, sheet);

  const fb = new FretboardView(fbHost, { onTap: (s, f) => tapNote(s, f) });
  const tab = new TabView(tabEl, { onSeek: (i) => { if (TAP) { tapSeek(i); return; } if (player.playing) player.pause(); player.stepTo(i); } });
  // the reading game needs no tempo, beats, loop or playback toggles: only ✓ Mastered stays under ⋯
  if (TAP) {
    for (const el of [tempo, subSel, rhythmBtn, loopBtn, beatsEl, ...ctrl.querySelectorAll(':scope > .sep')]) el.hidden = true;
    for (const el of morePop.children) if (!el.contains(doneBtn)) el.hidden = true;
  }

  const player = new Player({
    onStep: (i) => {
      // (a preview stops after its first bars, and says what Pro opens)
      if (preview && i > 0 && (player.starts?.[i] ?? 0) >= PREVIEW_BEATS) { player.pause(); previewEnd(); return; }
      showStep(i);
    },
    onBeat: (level, beat) => flashBeat(beat),
    onState: (playing) => {
      syncPlayBtn();
      // (a take stopped before its end, by any control, is dropped; its end comes right after this, with onEnd)
      if (!playing && rec?.phase === 'running') setTimeout(() => { if (rec?.phase === 'running' && !player.playing) cancelTake(); });
    },
    onSched: (e) => onSched(e),
    onLoop: (n, bpm, done) => {
      syncBpm();
      // `done`: the slowest tempo of the loop just played, or null when it did not start on the first
      // note (not a full loop). A lesson step leaves the exercise's own progress alone.
      const played = done;
      if (preview) return;
      if (played != null && !demo) routine?.played?.();
      if (!lesson) {
        const pr = getProgress(tpl.id) || {};
        // (a full loop at the goal: ✓ Mastered can be ticked, here or anywhere; user, 2026-10-26)
        const met = played != null && !pr.met && !demo && meetsGoal(tpl.id, played, inst?.uniform ? player.sub : null);
        updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, ...(played != null ? { bestBpm: Math.max(pr.bestBpm || 0, played) } : {}), ...keep(), lastBpm: player.bpm, ...(met ? { met: true } : {}) });
        if (met && !pr.done) tip(`🎯 Goal reached (${masteryGoal(tpl.id)}): when it is clean, tick ✓ Mastered under ⋯`);
      }
      // a lesson step counts only with the lesson's options (another key is fine where the lesson leaves it free)
      if (lesson && !demo && played != null && presetOk()) {
        const first = recordLoop(L, LI, played);
        rememberTempo(L, LI, player.bpm);
        if (!LS.goal || played >= LS.goal) visitPassed = true;
        if (first || (reviewing && visitPassed && !passShown)) {
          passShown = true;
          tip(earStep ? (reviewing ? 'Round played: if you still got them all, tick ✓ Still got them?' : 'Round played: if you named them all before the answers, tick ✓ Got them all?')
            : reviewing ? 'Goal reached: if it is still clean, tick ✓ Still clean?' : 'Goal reached! If it felt clean, tick ✓ Clean?');
        }
        syncGoal();
      }
    },
    onEnd: (full) => {
      showStep(-1);
      if (rec?.phase === 'running') { endTake(); return; }
      if (preview) { previewEnd(); return; }
      // played through without the loop: today's session ticks it too
      if (demo || full) routine?.played?.();
      if (demo) tip(`Your turn: tap ${routine ? 'Next' : 'Practise'} › to play it yourself.`, { title: 'Demo finished' });
    },
  });
  // a lesson step starts where it was last practised (or at its starting tempo), a demo at the goal
  const clampBpm = (v) => (Number.isFinite(v) && v > 0 ? Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v))) : null);
  player.bpm = (lesson
    ? (demo ? clampBpm(LS.goal || LS.from) : (clampBpm(stepState(L.id, LI).last) || clampBpm(LS.from)))
    : clampBpm(prog.lastBpm)) || tpl.bpm || 70;
  // the demo plays once, with the sound on; a preview plays once
  if (demo) { player.loop = false; player.sound = true; }
  if (preview) player.loop = false;
  function previewEnd() {
    tip(h('span', {}, 'That was a preview. BassClass Pro opens the whole exercise, every option, the loop and the speed trainer. ', h('button', { class: 'btn small locked', onClick: offerPro }, '⭐ Get Pro')), { title: 'Pro preview' });
  }
  player.metro = S.metro;
  player.countIn = S.countIn;
  player.clickSubs = S.clickSubs;
  A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol });

  // ------------------------------------------------------------ params
  /** Summary of the current options on the header button. */
  function renderParams() {
    optsSum.textContent = paramSummary(tpl, p, S, inst?.fixed);
  }

  /** Options panel (right side, so the board stays visible and changes can be seen at once). */
  function renderOptions() {
    const old = sheet.querySelector('.panel');
    const scroll = old ? old.scrollTop : 0;
    const fixed = inst?.fixed || {};
    const groups = Object.entries(tpl.params || {}).map(([k, def]) => {
      const chips = h('div', { class: 'chips' });
      for (const [v, l] of paramOptions(def, S, p)) {
        chips.append(h('button', { class: `chip-btn${v === p[k] ? ' on' : ''}`, disabled: !!fixed[k], onClick: () => {
          if (p[k] === v) return;
          p[k] = v;
          rebuild();
          renderParams();
          renderOptions();
          if (!preview) updateProgress(tpl.id, keep());
        } }, l));
      }
      return h('div', { class: `opt-group${fixed[k] ? ' fixed' : ''}` }, h('h4', {}, def.label),
        fixed[k] ? h('p', { class: 'opt-note' }, `Fixed for this choice: ${fixed[k]}.`) : null, chips);
    });
    const panel = h('div', { class: 'panel' },
      h('header', {}, h('div', {}, h('h2', {}, 'Options')),
        h('button', { class: 'btn primary', onClick: () => closeOptions() }, 'Done')),
      ...groups);
    sheet.replaceChildren(panel);
    panel.scrollTop = scroll;
  }

  function openOptions() {
    closeMore();
    renderOptions();
    // slide in only when opening, not each time a chip re-renders the panel
    sheet.classList.add('open', 'opening');
    setTimeout(() => sheet.classList.remove('opening'), 260);
  }

  function closeOptions() { sheet.classList.remove('open'); }

  function toggleMore() {
    if (morePop.classList.toggle('open')) {
      moreBtn.classList.add('on');
      setTimeout(() => document.addEventListener('pointerdown', outsideMore, true));
    } else closeMore();
  }
  function closeMore() {
    morePop.classList.remove('open');
    moreBtn.classList.remove('on');
    document.removeEventListener('pointerdown', outsideMore, true);
  }
  function outsideMore(e) { if (!morePop.contains(e.target) && !moreBtn.contains(e.target)) closeMore(); }

  let bpmHint;
  function rebuild() {
    const wasPlaying = player.playing;
    ctx = makeCtx(S);
    let next;
    try {
      next = TAP ? tapSet(tpl.game, p, ctx, S) : tpl.build(p, ctx, S);
    } catch (e) {
      console.error(e);
      toast('Could not build this variation');
      return;
    }
    if (!next?.steps?.length) { toast('No notes for this variation'); return; }
    inst = next;
    // a variation with its own natural tempo (the 12/8 slow blues) starts there when it is chosen, or when
    // it opens with no tempo of its own yet; choosing another variation then returns to the usual tempo
    const hint = inst.bpm || null;
    if (bpmHint === undefined) { if (hint && !lesson && !prog.lastBpm) player.setBpm(hint); }
    else if (hint && hint !== bpmHint) setBpm(hint);
    else if (!hint && bpmHint) setBpm(tpl.bpm || 70);
    bpmHint = hint;
    // ear training: the notes of a hidden step show no dot until the answer
    for (const st of inst.steps) if (st.hide) for (const n of st.notes) n.hidden = true;
    // segments: a chord label starts a new segment (used for the dot trail)
    segStart = []; segEnd = []; chordAt = []; textAt = [];
    let s0 = 0, ch = null, tx = null;
    inst.steps.forEach((st, i) => {
      if (st.chord && i > 0) s0 = i;
      if (st.chord) { ch = st.chord; tx = null; }
      if (st.text) tx = st.text;
      segStart[i] = s0; chordAt[i] = ch; textAt[i] = tx;
    });
    let e = inst.steps.length - 1;
    for (let i = inst.steps.length - 1; i >= 0; i--) { segEnd[i] = e; if (segStart[i] === i) e = i - 1; }
    player.sub = (inst.uniform ? userSub : null) ?? inst.sub ?? tpl.sub ?? 2;
    subSel.value = String(player.sub);
    subSel.hidden = !inst.uniform || TAP;
    rhythmBtn.hidden = !!inst.uniform || TAP;
    // (the reading game: quarter notes, a set not started)
    if (TAP) { player.sub = 1; tapReset(); }
    if (!labelMode) labelMode = inst.label || tpl.label || S.label;
    if (inst.reveal) reveal = inst.reveal;
    if (!score) score = inst.view || S.score;
    player.load(inst);
    applyBacking();
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lefty: S.lefty, zone: inst.zone || null });
    if (TAP) fb.fit(0, TAP_HI, 12); else fb.fit(inst.range[0], inst.range[1], 9);
    beatsEl.replaceChildren(...Array.from({ length: inst.beatsPerBar || 4 }, () => h('i')));
    renderTab();
    showStep(-1);
    syncToggles();
    if (inst.overFret && inst.overFret !== warnedFret) {
      warnedFret = inst.overFret;
      tip(`This variation reaches fret ${inst.overFret}, above your highest fret (${ctx.maxFret}).`);
    }
    if (wasPlaying) player.play();
  }

  function renderTab() {
    // Quiz mode: the strip gives no answers away (tab: "?" until a note is played; staff: no names)
    const quiz = reveal === 'quiz';
    tab.render(inst, {
      strings: ctx.tuning.length, beatsOf: (st) => player.beatsOf(st), beatsPerBar: inst.beatsPerBar || 4, sub: player.sub, mode: score, quiz,
      label: (n) => (labelMode === 'none' || (quiz && score === 'staff') ? '' : noteLabel(n, labelMode === 'finger' ? 'note' : labelMode, S.notation)),
      decorate: TAP ? (el) => decorateStaff(el) : null,
    });
    tab.setCurrent(cur);
  }

  // ------------------------------------------------------------ dots
  function mkDot(n, state) {
    const label = reveal === 'quiz' && state === 'current' ? T.noteName(n.n, S.notation) : noteLabel(n, labelMode, S.notation);
    const color = n.tag === 'x' ? 'ghost' : degKey(n.deg);
    return { s: n.s, f: n.f, at: n.at, label: n.tag === 'x' ? 'x' : label, color, state, tag: n.tag && n.tag !== 'x' ? n.tag : null };
  }

  function showStep(i) {
    if (TAP) { tapShow(i); return; }
    cur = i;
    const steps = inst.steps;
    const map = new Map();
    const put = (n, state) => {
      if (n.hidden) return;
      const k = `${n.s}.${n.f}`;
      const was = map.get(k);
      if (!was || RANK[state] >= RANK[was.state]) map.set(k, mkDot(n, state));
    };
    if (i < 0) {
      if (reveal === 'full') for (let j = 0; j <= (segEnd[0] ?? 0); j++) if (!steps[j].silent) for (const n of steps[j].notes) put(n, 'future');
      if (reveal !== 'quiz') for (const n of steps[0].notes) put(n, 'next');
      nowEl.innerHTML = chordAt[0] ? `<span class="chord">${esc(chordAt[0])}</span>${textAt[0] ? `<span class="txt">${esc(textAt[0])}</span>` : ''}<span class="cnt">ready · ${steps.length} notes</span>` : `<span class="cnt">ready · ${steps.length} notes</span>`;
      promptEl.innerHTML = reveal === 'quiz' ? promptHtml(0) : '';
      fb.setDots([...map.values()]);
      tab.setCurrent(-1);
      return;
    }
    const s0 = segStart[i], s1 = segEnd[i];
    // (an ear-training answer is never part of the shown shape before its turn)
    if (reveal === 'full') for (let j = s0; j <= s1; j++) if (!steps[j].silent || j === i) for (const n of steps[j].notes) put(n, 'future');
    if (reveal !== 'quiz') for (let j = Math.max(s0, i - TRAIL); j < i; j++) for (const n of steps[j].notes) put(n, 'past');
    const nx = i + 1 < steps.length ? i + 1 : (player.loop ? 0 : -1);
    // (never preview an ear-training answer)
    if (nx >= 0 && reveal !== 'quiz' && !steps[nx].silent) for (const n of steps[nx].notes) put(n, 'next');
    for (const n of steps[i].notes) put(n, 'current');
    fb.setDots([...map.values()]);
    if (!steps[i].hide && !steps[i].silent) for (const n of steps[i].notes) fb.pluck(n.s, n.tag === 'x' ? 'ghost' : degKey(n.deg));
    tab.setCurrent(i);
    nowEl.innerHTML = `${chordAt[i] ? `<span class="chord">${esc(chordAt[i])}</span>` : ''}${textAt[i] ? `<span class="txt">${esc(textAt[i])}</span>` : ''}<span class="cnt">${i + 1}/${steps.length}</span>`;
    promptEl.innerHTML = reveal === 'quiz' && nx >= 0 ? promptHtml(nx) : '';
  }

  function promptHtml(j) {
    const st = inst.steps[j];
    // (Reading: the staff is the only clue; ear training: never the answer)
    if (!st || !st.notes.length || st.hide || st.silent || inst.noPrompt) return '';
    return `next <b>${st.notes.map((n) => esc(T.noteName(n.n, S.notation))).join(' + ')}</b>`;
  }

  let beatTimer = null;
  function flashBeat(beat) {
    const dots = beatsEl.children;
    for (let k = 0; k < dots.length; k++) dots[k].className = k === beat ? (beat === 0 ? 'on one' : 'on') : '';
    clearTimeout(beatTimer);
    beatTimer = setTimeout(() => { for (const d of dots) d.className = ''; }, 120);
  }

  // ------------------------------------------------------------ lesson step
  /** The lesson's options are in place: its preset and, where the rhythm is not written in, its subdivision. */
  function presetOk() {
    return Object.entries(LS?.p || {}).every(([k, v]) => p[k] === v) && (!inst?.uniform || LS?.sub == null || player.sub === LS.sub);
  }
  function syncGoal() {
    if (!goalBtn) return;
    const st = stepState(L.id, LI);
    const passed = reviewing ? visitPassed : stepPassed(L, LI);
    const clean = !reviewing && stepClean(L, LI);
    const ok = presetOk();
    goalBtn.className = `btn goal-btn${!ok ? ' off' : clean ? ' clean' : passed ? ' ready' : ''}`;
    const tick = earStep ? 'Got them all' : 'Clean';
    goalBtn.textContent = !ok ? '↺ Options'
      : clean ? `✓ ${earStep ? 'Got them' : 'Clean'}`
        : passed ? (reviewing ? `✓ Still ${earStep ? 'got them' : 'clean'}?` : `✓ ${tick}?`)
          : LS.goal ? `🎯 ${reviewing ? 'review' : st.best || '–'}/${LS.goal}` : '🎯 1 round';
    goalBtn.title = !ok ? 'You changed an option the lesson sets (or its notes per beat): tap to go back to the lesson\'s options. Only those count for the lesson.'
      : LS.goal ? `Goal: a full loop from the first note at ${LS.goal} BPM or faster${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}, then tick ✓ Clean (best so far: ${st.best || '–'} BPM)`
        : 'Goal: one full round from the first note, then tick ✓ if you named them all before the answers';
  }
  function onGoal() {
    if (!presetOk()) {
      Object.assign(p, LS.p);
      if (LS.sub != null) { userSub = LS.sub; player.setSub(LS.sub); }
      rebuild();
      renderParams();
      if (sheet.classList.contains('open')) renderOptions();
      toast('Back to the lesson\'s options');
      syncGoal();
      return;
    }
    const passed = reviewing ? visitPassed : stepPassed(L, LI);
    if (!passed) {
      tip(LS.goal ? `Play a full loop from the first note at ${LS.goal} BPM or faster, then tick ✓ Clean.` : 'Play one full round from the first note, then tick ✓ if you named them all before the answers.');
      return;
    }
    if (reviewing) {
      const days = reviewed(L);
      reviewing = false;
      toast(`Reviewed ✓ Next review in ${days} days`, 3000);
    } else if (stepClean(L, LI)) {
      // a ticked step can be unticked here too, after a question (user, 2026-10-29: "checked exercises have to be
      // able to be unchecked"); one its exercise's mastery ticks takes the mastery back with it
      const byMastery = stepCovered(L, LI);
      if (!confirm(byMastery ? 'This step is ticked because you mastered this exercise. Untick it? ✓ Mastered is taken back too, in the Library and the course.' : `Untick ✓ ${earStep ? 'Got them all' : 'Clean'}? Practise the step again, and tick it when it is clean.`)) return;
      untickStep(L, LI);
      lessonDone = false;
      if (nextBtn && !routine) nextBtn.classList.remove('primary');
      toast('Unticked');
    } else {
      const ex = L.steps[LI].ex, was = isMastered(ex);
      const complete = setClean(L, LI, true);
      // (a step at least as hard as the exercise's goal masters it everywhere: say so, QA round 19)
      const mastered = !was && isMastered(ex) ? ' · the exercise is ✓ mastered in the Library too' : '';
      toast(`${complete ? `${lessonName} complete ✓` : 'Step done ✓'}${mastered}`, complete || mastered ? 3000 : 1800);
      if (nextBtn && !routine) {
        nextBtn.classList.add('primary');
        if (complete) { lessonDone = true; nextBtn.replaceChildren('Done ›'); nextBtn.title = 'Back to the lesson'; }
      }
    }
    syncGoal();
  }

  // ------------------------------------------------------------ actions
  function setBpm(v) {
    player.setBpm(v);
    syncBpm();
    if (preview) return;
    if (lesson && !demo) rememberTempo(L, LI, player.bpm);
    else if (!lesson) updateProgress(tpl.id, { lastBpm: player.bpm });
  }
  function syncBpm() {
    bpmRange.value = player.bpm;
    bpmVal.innerHTML = `${player.bpm}<small>BPM</small>`;
  }
  function manual(d) {
    if (TAP) { tapNav(d); return; }
    if (player.playing) player.pause();
    player.stepTo(cur < 0 ? (d > 0 ? 0 : inst.steps.length - 1) : cur + d);
  }
  function restart() { if (TAP) { tapStart(); return; } player.stop(true); player.cur = 0; showStep(-1); }
  function tapNote(s, f) {
    if (TAP) { tapAnswer(s, f); return; }
    const midi = ctx.tuning[s] + f;
    A.playNote(midi, A.now() + 0.01, 0.9);
    fb.pluck(s);
  }
  // options an exercise does not use are greyed: a tap says why (see syncToggles)
  function cycleReveal() {
    if (inst.reveal) { toast('This exercise is a quiz: the reveal is fixed'); return; }
    const i = REVEALS.findIndex((r) => r[0] === reveal);
    reveal = REVEALS[(i + 1) % REVEALS.length][0];
    saveSettings({ reveal });
    toast(`Reveal: ${REVEALS[(i + 1) % REVEALS.length][1].toLowerCase()}`);
    syncToggles();
    renderTab();
    showStep(cur);
  }
  // a lesson step can bring its own backing (not saved: the player's setting stays as it was)
  let backingOverride = LS?.backing || null;
  const backing = () => backingOverride || S.backing;
  function cycleBacking() {
    if (!canBack) { toast(BACKS ? 'No chords in this exercise: no backing' : `No backing in ${NO_BACKING_NAME[tpl.module]}`); return; }
    const order = ['off', 'drone', 'chords'];
    const was = backing();
    backingOverride = null;
    saveSettings({ backing: order[(order.indexOf(was) + 1) % order.length] });
    applyBacking();
    toast(`Backing: ${BACKINGS[S.backing].toLowerCase()}`);
    syncToggles();
  }
  /** Backing pad: the harmony of each part of the exercise (see harmony.js). */
  // backing belongs to music with harmony: not to hand, time, note-finding, interval or ear drills
  const BACKS = !NO_BACKING.includes(tpl.module);
  let canBack = false; // this variation has chords or scales to back
  function applyBacking() {
    canBack = BACKS && harmonyTrack(inst, 'chords').some(Boolean);
    player.harmony = backing() === 'off' || !canBack ? null : harmonyTrack(inst, backing());
    if (!player.playing) return;
    const hm = player.harmony && harmonyAt(player.harmony, Math.max(0, cur));
    if (hm) A.padSet(hm, A.now() + 0.02); else A.padStop();
  }
  function cycleScore() {
    if (inst.view) { toast('A reading drill: the staff is fixed'); return; }
    score = score === 'staff' ? 'tab' : 'staff';
    saveSettings({ score });
    toast(score === 'staff' ? 'Staff' : 'Tab');
    syncToggles();
    renderTab();
  }
  function cycleLabel() {
    const i = LABELS.findIndex((r) => r[0] === labelMode);
    labelMode = LABELS[(i + 1) % LABELS.length][0];
    updateProgress(tpl.id, { label: labelMode });
    toast(`Dot labels: ${LABELS[(i + 1) % LABELS.length][1].toLowerCase()}`);
    syncToggles();
    renderTab();
    showStep(cur);
  }
  function toggleTrainer() {
    if (!player.trainer.on && player.bpm >= MAX_BPM) { toast(`Already at the top tempo (${MAX_BPM} BPM)`); return; }
    player.trainer.on = !player.trainer.on;
    if (player.trainer.on) {
      player.trainer.target = Math.min(MAX_BPM, player.bpm + 40);
      player.loop = true;
      tip(`Speed trainer: +${player.trainer.inc} BPM every loop, up to ${player.trainer.target}.`);
    }
    syncToggles();
  }
  // ✓ Mastered: once a full loop reached the exercise's goal (here, in the Library or the session, or in a
  // lesson step), and then it counts everywhere: the Library, the session and the course's steps on it
  // (mastery.js; user, 2026-10-26)
  function toggleDone() {
    const pr = getProgress(tpl.id) || {};
    const done = !pr.done;
    if (done) {
      const g = goalOf(tpl.id);
      const inLesson = lesson && !demo && g && stepState(L.id, LI).best >= g.bpm && (g.sub == null || (LS.sub ?? g.sub) >= g.sub);
      const anyLoop = !g && (pr.plays > 0 || (lesson && stepState(L.id, LI).loops > 0));
      if (!pr.met && !inLesson && !anyLoop) {
        closeMore(); // (the tip sits where the menu was: QA round 19)
        tip(`🎯 To master it: ${g ? `a full loop at ${masteryGoal(tpl.id)}` : 'one full loop'}, then ✓ Mastered`);
        return;
      }
    }
    setMastered(tpl.id, done);
    toast(done ? 'Mastered ✓: it counts in the Library and the course' : 'Unmarked');
    syncToggles();
  }
  function syncToggles() {
    loopBtn.classList.toggle('on', player.loop);
    metroBtn.classList.toggle('on', player.metro);
    soundBtn.classList.toggle('on', player.sound);
    soundBtn.innerHTML = icon(player.sound ? 'sound' : 'mute');
    trainerBtn.classList.toggle('on', player.trainer.on);
    doneBtn.classList.toggle('on', !!(getProgress(tpl.id) || {}).done);
    const state = (el, what, name, ico) => { el.innerHTML = icon(ico); el.setAttribute('aria-label', `${what}: ${name}`); };
    const rv = REVEALS.find((r) => r[0] === reveal) || REVEALS[0];
    state(revealBtn, 'Reveal', rv[1], rv[2]);
    backingBtn.textContent = (canBack && BACKINGS[backing()]) || BACKINGS.off;
    backingBtn.setAttribute('aria-label', `Backing: ${backingBtn.textContent}`);
    backingBtn.classList.toggle('on', canBack && backing() !== 'off');
    state(scoreBtn, 'Under the neck', ...(SCORES[score] || SCORES.tab));
    // greyed: what this exercise has no use for (no chords to back) or sets itself (quiz, staff)
    const na = (el, off) => {
      el.classList.toggle('na', off);
      el.parentElement?.classList.toggle('na', off);
      el.setAttribute('aria-disabled', String(off));
    };
    na(backingBtn, !canBack);
    na(revealBtn, !!inst.reveal);
    na(scoreBtn, !!inst.view);
    const lb = LABELS.find((r) => r[0] === labelMode) || LABELS[0];
    state(labelBtn, 'Dot labels', lb[1], lb[2]);
    syncBpm();
    syncGoal();
  }

  // ------------------------------------------------------------ info drawer
  /** In a lesson the drawer starts with the step, then the lesson's idea, explanation and pitfalls. */
  function lessonBox() {
    const step = demo
      ? `<p>Demo: the app plays it once at the goal tempo. Watch the neck and listen, then tap ${routine ? 'Next' : 'Practise'}.</p>`
      : `<p>Step ${LI + 1} of ${L.steps.length}${LS.do ? `: ${esc(LS.do)}` : ''}</p><p class="muted small">${LS.goal
        ? `Goal: a full loop from the first note at ${LS.goal} BPM or faster${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}. Then tick ✓ Clean if it really was clean: every note in time, even and clear.`
        : 'Goal: one full round from the first note. Then tick ✓ if you named (or sang) every answer before it appeared.'}</p>`;
    return `<div class="les-step-box"><b>${esc(lessonName)} · ${esc(L.title)}</b>${step}</div>
      ${L.idea ? `<p class="les-idea">${esc(L.idea)}</p>` : ''}
      ${(L.concept || []).map((para) => `<p>${esc(para)}</p>`).join('')}
      ${L.mistakes?.length ? `<h4>Watch out for</h4><ul>${L.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
      <h4>This exercise</h4>`;
  }
  function openDrawer() {
    closeMore();
    const pr = getProgress(tpl.id) || {};
    const legend = [['root', 'Root (square)'], ['third', '3rd'], ['fifth', '5th'], ['seventh', '7th'], ['sixth', '6th'], ['other', 'Other / passing']].map(([k, n]) => [k, n, PALETTE[k]]);
    const varyTip = inst?.uniform
      ? 'Change the subdivision (♩ → 8ths → triplets → 16ths), switch the Reveal button to "Quiz" to test yourself (under ⋯ on phones), and finish with labels off.'
      : 'The rhythm is written into this exercise, so keep the subdivision and work the tempo. Switch to "Quiz" to test yourself, and finish with labels off.';
    drawer.innerHTML = `
      <header><h2>${tpl.num} · ${esc(tpl.title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></header>
      <div class="body">
        ${L ? lessonBox() : ''}
        <div class="row" style="margin-bottom:10px"><span class="chip lv lv${tpl.level}">Level ${tpl.level} · ${esc(lvl?.name ?? '')}</span><span class="chip">${esc(mod?.name ?? '')}</span></div>
        ${(tpl.about || '').split('\n\n').map((para) => `<p>${esc(para)}</p>`).join('')}
        ${tpl.tips?.length ? `<h4>Focus points</h4><ul>${tpl.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <h4>How to practise it</h4>
        <ul>
          <li>Step through it first with ◀ ▶ and say each note or degree out loud.</li>
          <li>Loop it at a tempo where it is effortless (about 60–70% of your limit). Raise 4 BPM after 3 clean loops, or switch on the speed trainer.</li>
          <li>${esc(varyTip)}</li>
        </ul>
        <h4>Colours</h4>
        <div class="legend">${legend.map(([k, n, c]) => `<span><i style="background:${c}${k === 'root' ? ';border-radius:3px' : ''}"></i>${n}</span>`).join('')}</div>
        <p class="muted small" style="margin-top:8px">A dot labelled → is an approach note: a passing note that leads into the next chord tone.</p>
        ${tpl.source ? `<h4>Related</h4><p class="muted small">${esc(tpl.source)}</p>` : ''}
        <h4>Your progress</h4>
        <p class="muted">${pr.plays ? `${pr.plays} loops played · best ${pr.bestBpm || '–'} BPM` : 'Not played yet.'}${pr.done ? ' · <b style="color:var(--good)">mastered</b>' : ` · 🎯 to master it: ${esc(masteryGoal(tpl.id))}, then ✓ Mastered`}</p>
        ${pr.judged ? `<p class="muted small">🎙 Your last take, as the app heard it: ${pr.judged.clean ? 'clean' : 'not clean yet'} at ${pr.judged.bpm} BPM (${pr.judged.right} of ${pr.judged.total} notes right, ${pr.judged.inTime} in time).</p>` : ''}
      </div>`;
    drawer.querySelector('[data-close]').addEventListener('click', () => drawer.classList.remove('open'));
    drawer.classList.add('open');
  }

  // ------------------------------------------------------------ 🎙 a take (user, 2026-10-29: a prototype)
  // One pass from the first note with the player's real bass: the app's bass and backing stay silent and the click
  // turns into a high tick the analysis does not hear as a note (audio.js `recClick`), then judge.js listens back.
  // 🎙 → Get ready opens the microphone and Play turns into a red ● (user, 2026-10-29: "when the microphone is
  // ready make the play button a record button, red with a white dot"); a tap on it records, and it is a red ■
  // while the take runs. Only the latest take is kept, in memory, until the next one (user's choice); nothing is
  // sent. 🎙 shows its result again, greyed, with ▶ Listen while the recording is still the latest (user: "to be
  // able to check results not only once"). The verdict is kept beside the player's own ✓ Clean and ✓ Mastered.
  // `rec.phase`: 'opening' (the microphone asked for: a second tap does nothing, QA round 22), 'armed', 'running',
  // 'ending' (listening back).
  let rec = null;        // { phase, take, sched, saved, bpm }
  let listening = null;  // the take playing back
  function recCard(...children) {
    recLayer.replaceChildren(h('div', { class: 'rec-card' }, ...children));
    recLayer.hidden = false;
  }
  function closeRec() {
    listening?.stop();
    listening = null;
    recLayer.hidden = true;
    if (rec?.phase === 'opening') rec = null;   // (closed while the microphone opens: it closes again when it answers)
  }
  const recBtns = (...b) => h('div', { class: 'rec-btns' }, ...b, h('button', { class: 'btn', onClick: closeRec }, 'Close'));
  const readyBtn = (label) => h('button', { class: 'btn primary', onClick: () => armRec() }, label);
  /** Play is the take's own button while one is ready or running. */
  function syncPlayBtn() {
    const armed = rec?.phase === 'armed', running = rec?.phase === 'running' || rec?.phase === 'ending';
    playBtn.classList.toggle('rec-arm', armed);
    playBtn.classList.toggle('rec-run', running);
    playBtn.innerHTML = icon(armed ? 'recDot' : running ? 'stopSq' : player.playing ? 'pause' : 'play');
    playBtn.setAttribute('aria-label', armed ? 'Record the take' : running ? 'Stop the take' : TAP ? 'Start a new set (space)' : 'Play / pause (space)');
  }
  function recBadgeShow(text, button) {
    recBadge.querySelector('span').textContent = text;
    recBadge.querySelector('button').textContent = button;
    recBadge.hidden = false;
  }
  /** 🎙: the last result on this exercise when there is one, else what a take is and Get ready. */
  function openRec() {
    closeMore();
    hideTip();
    if (rec) { cancelTake(); return; }
    if (player.playing) player.pause();
    const kept = resultFor(tpl.id);
    if (kept) { showTake(kept, { previous: true }); return; }
    const j = (getProgress(tpl.id) || {}).judged;
    if (j) { showStored(j); return; }
    recCard(
      h('div', { class: 'row rec-head' }, h('h3', {}, '🎙 Record a take'),
        infoBtn(['🎙 Get ready opens the microphone, and the play button turns into a red ●',
          '● Tap it with your hands on the bass: a bar of clicks, then play it once from the first note',
          '🔊 On the speaker the app hears its click and times you against it; with headphones it judges how even you are',
          '🔇 The app\'s bass and backing stay silent, so the microphone hears only you',
          '📱 Only your latest take is kept, on this phone, until the next one. Nothing is sent',
          '🎙 again shows your last result'], 'About recording a take')),
      recBtns(readyBtn('🎙 Get ready')));
  }
  /** Get ready: the microphone opens and Play becomes the red ●. */
  async function armRec() {
    if (rec) return;
    listening?.stop();
    listening = null;
    const mine = { phase: 'opening' };
    rec = mine;
    recCard(h('p', {}, 'Opening the microphone…'));
    let take;
    try { take = await startTake(); } catch (e) {
      console.warn(e);
      if (rec === mine) rec = null;
      if (!alive) return;
      recCard(h('h3', {}, 'No microphone'),
        h('p', { class: 'muted' }, window.isSecureContext ? 'The microphone could not be opened. Allow BassClass to use it, then try again.' : 'Browsers open the microphone only on secure (https) pages.'),
        recBtns());
      return;
    }
    // (left, or closed while it opened: the microphone closes at once)
    if (!alive || rec !== mine) { take.stop({ keep: false }); return; }
    player.stop();
    rec = { phase: 'armed', take };
    recLayer.hidden = true;
    recBadgeShow('🎙 Ready: tap the red ● to record', 'Cancel');
    recBtn?.classList.add('rec-on');
    syncPlayBtn();
  }
  /** The red ●: the take begins, a bar of clicks first. */
  function startRec() {
    if (rec?.phase !== 'armed') return;
    hideTip();
    rec = { phase: 'running', take: rec.take, sched: { clicks: [], notes: [] }, bpm: player.bpm,
      saved: { loop: player.loop, sound: player.sound, metro: player.metro, countIn: player.countIn, trainer: player.trainer.on } };
    Object.assign(player, { loop: false, sound: false, metro: true, countIn: true, harmony: null });
    player.trainer.on = false;
    A.padStop();
    A.setAudioOptions({ recClick: true, clickVol: Math.max(S.clickVol, 0.75) });
    rec.take.begin();
    recBadgeShow('Recording: play from the first note', 'Stop');
    syncPlayBtn();
    player.play();
  }
  /** What the player scheduled during the take: the count-in's clicks and each note, with their times. */
  function onSched(e) {
    if (rec?.phase !== 'running') return;
    if (e.type === 'click') { if (e.counting) rec.sched.clicks.push(e.time); return; }
    const st = e.step;
    if (st.rest || st.silent || !st.notes?.length) return;
    const n = st.notes[0];
    rec.sched.notes.push({ t: e.time, midi: n.play ?? n.midi, name: n.n ? T.noteName(n.n, S.notation) : '', idx: e.idx });
  }
  function restoreRec(r) {
    Object.assign(player, { loop: r.saved.loop, sound: r.saved.sound, metro: r.saved.metro, countIn: r.saved.countIn });
    player.trainer.on = r.saved.trainer;
    A.setAudioOptions({ recClick: false, clickVol: S.clickVol });
    applyBacking();
    syncToggles();
  }
  function recDone() {
    recBadge.hidden = true;
    recBtn?.classList.remove('rec-on');
    syncPlayBtn();
  }
  /** Stop, Cancel, 🎙 or the red ■: the take (or the waiting microphone) is dropped, the last result stays. */
  function cancelTake() {
    if (!rec) return;
    const r = rec;
    rec = null;
    if (r.phase === 'running') { player.stop(); restoreRec(r); }
    r.take?.stop({ keep: false });
    if (r.phase === 'opening') closeRec();
    recDone();
    toast(r.phase === 'running' ? 'Take stopped' : 'Microphone closed');
  }
  function endTake() {
    const r = rec;
    r.phase = 'ending';
    recBadgeShow('Listening back…', 'Stop');
    // (the last note rings on a little)
    setTimeout(() => {
      if (rec !== r) return;
      rec = null;
      const take = r.take.stop();
      restoreRec(r);
      recDone();
      recCard(h('p', {}, 'Listening back…'));
      setTimeout(() => {
        if (!alive) return;
        let res = null;
        try { res = take && judge(take, r.sched, { inputLatency: r.take.inputLatency }); } catch (e) { console.error(e); }
        const kept = { id: tpl.id, at: Date.now(), bpm: r.bpm, res, notes: r.sched.notes };
        keepResult(kept);
        const s = res?.summary;
        if (s && s.missed < s.total) updateProgress(tpl.id, { judged: { at: kept.at, clean: res.clean, bpm: r.bpm, right: s.right, total: s.total, inTime: s.inTime, timing: res.timing } });
        showTake(kept);
      }, 30);
    }, 700);
  }
  /** "Previous take · 5 min ago". */
  function ago(at) {
    const m = Math.round((Date.now() - at) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m} min ago`;
    const d = new Date(at);
    return d.toDateString() === new Date().toDateString() ? `today ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  }
  const prevTag = (at) => h('span', { class: 'rec-prev' }, `Previous take · ${ago(at)}`);
  function listenBtn() {
    const b = h('button', { class: 'btn', onClick: () => {
      if (listening) { listening.stop(); listening = null; b.textContent = '▶ Listen'; return; }
      listening = playTake();
      if (!listening) return;
      b.textContent = '■ Stop';
      const me = listening;
      me.onended = () => { if (listening === me) { listening = null; b.textContent = '▶ Listen'; } };
    } }, '▶ Listen');
    return b;
  }
  /** A take's result: fresh, or again from 🎙 (`previous`: greyed, said to be the last one). */
  function showTake(kept, { previous = false } = {}) {
    const { res, notes: sched } = kept;
    const again = readyBtn(previous ? '🎙 New take' : '🎙 Again');
    const s = res?.summary;
    if (!s || s.missed === s.total) {
      recCard(previous ? prevTag(kept.at) : null,
        h('div', { class: 'rec-result' }, h('h3', { class: 'no' }, 'Nothing heard'),
          h('p', { class: 'muted' }, 'The microphone heard no notes. Hold the phone near the bass or the amp, and play a little louder.')),
        recBtns(listenBtn(), again));
      recLayer.firstChild.classList.toggle('prev', previous);
      return;
    }
    const parts = [`${s.right} of ${s.total} right`];
    if (s.wrong) parts.push(`${s.wrong} wrong`);
    if (s.missed) parts.push(`${s.missed} not heard`);
    if (s.unclear) parts.push(`${s.unclear} unclear`);
    if (s.extra) parts.push(`${s.extra} extra`);
    const bias = s.bias == null ? '' : Math.abs(s.bias) < 10 ? ' · right on the click' : ` · on average ${Math.abs(s.bias)} ms ${s.bias > 0 ? 'late' : 'early'}`;
    const timing = res.timing === 'click'
      ? `${s.inTime} of ${s.timed} in time with the click${bias}${s.spread != null ? ` · spread ${s.spread} ms` : ''}`
      : `${s.inTime} of ${s.timed} even with your own pulse${s.spread != null ? ` · spread ${s.spread} ms` : ''}`;
    const how = res.timing === 'click' ? '⏱ In time: within 50 ms of the click (closer on fast notes)'
      : res.timing === 'estimated' ? '⏱ The click was not heard (headphones?), so the app judged how even you are, not how close to the click'
        : '⏱ The click\'s delay could not be measured (Bluetooth?), so the app judged how even you are';
    const cells = res.notes.map((n, j) => {
      const sn = sched[j];
      const off = n.dt != null && !n.inTime;
      const cls = n.pitch === 'missed' ? 'missed' : n.pitch === 'wrong' ? 'wrong' : off ? 'off' : n.pitch === 'ok' ? 'ok' : 'unclear';
      const ms = n.dt == null ? '–' : `${n.dt > 0 ? '+' : ''}${Math.round(n.dt * 1000)}`;
      const what = n.pitch === 'missed' ? 'not heard' : n.pitch === 'wrong' ? `heard ${n.heard != null ? T.noteName(T.bestRoot(((n.heard % 12) + 12) % 12), S.notation) : 'another note'}`
        : n.pitch === 'unclear' ? 'pitch unclear' : 'right note';
      return h('button', { class: cls, title: `${sn.name}: ${what}${n.dt != null ? `, ${ms} ms` : ''}`, onClick: () => { if (!player.playing) player.stepTo(sn.idx, false); } },
        sn.name, h('small', {}, n.pitch === 'wrong' ? '✗' : ms));
    });
    recCard(
      previous ? prevTag(kept.at) : null,
      h('div', { class: 'rec-result' },
        h('div', { class: 'row rec-head' }, h('h3', { class: res.clean ? 'ok' : 'no' }, res.clean ? '✓ A clean take' : 'Not clean yet'),
          infoBtn(['🎵 Notes: the pitch the microphone heard on each one', how,
            '🟢 Each note: green edge right and in time, gold early or late (ms), red ✗ a wrong note, dashed not heard or unclear; tap one to see it on the neck',
            `✓ The app's ear is kept beside your own ✓${lesson && !demo ? ' Clean' : ' Mastered'}: tick that one yourself when it felt clean`,
            '📱 Only your latest take is kept, until the next one. Nothing is sent',
            '🎙 shows this result again, greyed, until your next take'], 'About this result')),
        h('p', { class: 'rec-line' }, `🎵 Notes: ${parts.join(' · ')}${previous ? ` · ${kept.bpm} BPM` : ''}`),
        h('p', { class: 'rec-line' }, `⏱ Timing: ${timing}`),
        h('div', { class: 'rec-notes' }, cells)),
      recBtns(listenBtn(), again));
    recLayer.firstChild.classList.toggle('prev', previous);
  }
  /** A verdict from an earlier take whose recording is gone (a newer take elsewhere, or the app closed). */
  function showStored(j) {
    recCard(prevTag(j.at),
      h('div', { class: 'rec-result' },
        h('div', { class: 'row rec-head' }, h('h3', { class: j.clean ? 'ok' : 'no' }, j.clean ? '✓ A clean take' : 'Not clean yet'),
          infoBtn(['📼 Its recording is gone: a newer take, on another exercise, replaced it, or the app was closed', '🎙 New take records this one again'], 'About this result')),
        h('p', { class: 'rec-line' }, `🎵 Notes: ${j.right} of ${j.total} right · ${j.bpm} BPM`),
        h('p', { class: 'rec-line' }, `⏱ Timing: ${j.inTime} in time`)),
      recBtns(readyBtn('🎙 New take')));
    recLayer.firstChild.classList.add('prev');
  }

  // ------------------------------------------------------------ read it, tap it (the reading game)
  // In the regular exercise screen (user, 2026-10-30: "keep the regular staff notation score sheet, reveal note by
  // note, green success, red failed match… start with the regular play button and navigate step by step… to go
  // backwards, what will reveal the positions of previous notes; BPMs, beats… hidden"): ▶ draws a new random set
  // (curriculum/games.js `tapSet`), its notes appear on the staff one at a time, a tap on the neck answers (the exact
  // pitch; every place when the game asks it), the note turns green or red and the next one comes by itself; ‹ ›
  // go back over the notes answered, showing where each one is on the neck. The end card is the games'.
  const TAP_HI = 12;      // the neck asked: frets 0–12
  let tapAt = -1;         // the note asked (-1 before ▶; the set's length once all are answered)
  let tapRes = [];        // per note answered: { ok, wrong: { s, f, midi } | null }
  let tapHits = new Set();// the places of the note asked found so far ("s:f"), when every place is asked
  let tapBusy = false;    // an answer's feedback is showing
  let tapTimer = null;
  const tapNote0 = (j) => inst.steps[j].notes[0];
  const tapPlaces = (j) => placesOf(tapNote0(j).midi, ctx, TAP_HI);
  const tapName = (n) => T.noteName(n, S.notation);
  const tapScore = () => tapRes.filter((r) => r?.ok).length;
  function tapReset() {
    clearTimeout(tapTimer);
    tapAt = -1;
    tapRes = [];
    tapHits = new Set();
    tapBusy = false;
    tapEndEl.hidden = true;
  }
  /** ▶: a new random set, its first note asked. */
  function tapStart() {
    rebuild();
    A.audioCtx();
    logPlaying(true, { idleMin: 5 });
    tapAt = 0;
    showStep(0);
  }
  /** The staff: the notes not asked yet hidden, the ones answered green or red. */
  function decorateStaff(root = tabEl) {
    for (const g of root.querySelectorAll('.sn[data-i]')) {
      const i = Number(g.dataset.i), r = tapRes[i];
      g.classList.toggle('tap-hidden', i > tapAt);
      g.classList.toggle('tap-ok', !!r?.ok);
      g.classList.toggle('tap-no', !!r && !r.ok);
    }
  }
  const foundDots = (name, fx = null) => [...tapHits].map((k) => {
    const [s, f] = k.split(':').map(Number);
    return { s, f, label: name, color: 'none', state: 'current', ...(fx ? { fx } : {}) };
  });
  /** Note i in view: the one asked (only the places found), or one answered (its places, and a wrong tap). */
  function tapShow(i) {
    cur = i;
    tab.setCurrent(i);
    const n = inst.steps.length;
    if (i < 0) {
      fb.setDots([]);
      nowEl.innerHTML = `<span class="cnt">ready · ${n} notes · ▶ to start</span>`;
      promptEl.innerHTML = '';
      decorateStaff();
      return;
    }
    const note = tapNote0(i), r = tapRes[i], name = tapName(note.n);
    if (!r) {
      fb.setDots(foundDots(name));
      nowEl.innerHTML = `<span class="cnt">${i + 1}/${n} · ✓ ${tapScore()}</span>`;
      promptEl.innerHTML = inst.tap.all ? 'tap <b>every place</b>, to the 12th fret' : 'tap it on the neck';
    } else {
      fb.setDots([
        ...(r.wrong ? [{ s: r.wrong.s, f: r.wrong.f, label: tapName(spellMidi(r.wrong.midi)), color: 'sixth', state: 'static' }] : []),
        ...tapPlaces(i).map((q) => ({ s: q.s, f: q.f, label: name, color: 'none', state: 'current' })),
      ]);
      nowEl.innerHTML = `<span class="cnt">${i + 1}/${n} · ${r.ok ? '✓' : '✗'} ${esc(name)}</span>`;
      promptEl.innerHTML = r.ok ? `<b class="tap-ok">✓ ${esc(name)}</b>` : `<b class="tap-no">✗ ${esc(name)}</b>${r.wrong ? `, not ${esc(tapName(spellMidi(r.wrong.midi)))}` : ''}`;
    }
    decorateStaff();
  }
  /** A tap on the neck: the note sounds; on the note asked, it answers. */
  function tapAnswer(s, f) {
    const midi = ctx.tuning[s] + f;
    A.playNote(midi, A.now() + 0.01, 0.7, 0.7);
    fb.pluck(s, 'none');
    if (tapAt < 0 || tapAt >= inst.steps.length || tapBusy || cur !== tapAt) return;
    const note = tapNote0(tapAt), name = tapName(note.n), places = tapPlaces(tapAt);
    if (midi === note.midi) {
      tapHits.add(`${s}:${f}`);
      if (inst.tap.all && tapHits.size < places.length) {
        fb.setDots(foundDots(name));
        promptEl.innerHTML = `✓ ${tapHits.size} of ${places.length}: find the other${places.length - tapHits.size > 1 ? 's' : ''}`;
        return;
      }
      tapRes[tapAt] = { ok: true, wrong: null };
      fb.setDots(foundDots(name, 'win'));
      promptEl.innerHTML = `<b class="tap-ok">✓ ${esc(name)}</b>`;
      tapNext(900);
    } else {
      tapRes[tapAt] = { ok: false, wrong: { s, f, midi } };
      fb.setDots([
        { s, f, label: tapName(spellMidi(midi)), color: 'sixth', state: 'static', fx: 'miss' },
        ...places.map((q) => ({ s: q.s, f: q.f, label: name, color: 'none', state: 'current' })),
      ]);
      promptEl.innerHTML = `<b class="tap-no">✗ ${esc(name)}</b>, not ${esc(tapName(spellMidi(midi)))}${places.length > 1 ? `: here on ${places.length} strings` : ''}`;
      A.playNote(note.midi, A.now() + 0.45, 1.1, 0.85);
      tapNext(2400);
    }
    nowEl.innerHTML = `<span class="cnt">${tapAt + 1}/${inst.steps.length} · ✓ ${tapScore()}</span>`;
    decorateStaff();
  }
  function tapNext(ms) {
    tapBusy = true;
    tapTimer = setTimeout(() => {
      tapBusy = false;
      tapHits = new Set();
      tapAt++;
      if (tapAt >= inst.steps.length) { decorateStaff(); tapEnd(); return; }
      showStep(tapAt);
    }, ms);
  }
  /** ‹ ›: back over the notes answered, and forward to the one asked. */
  function tapNav(d) {
    if (tapAt < 0) return;
    const last = Math.min(tapAt, inst.steps.length - 1);
    const j = Math.max(0, Math.min(last, (cur < 0 ? 0 : cur) + d));
    if (j !== cur) showStep(j);
  }
  function tapSeek(i) { if (tapAt >= 0 && i <= Math.min(tapAt, inst.steps.length - 1)) showStep(i); }
  /** The set's end: the games' card (stars, Again, Harder, ✓ Mastered from 9 of 10). */
  function tapEnd() {
    logPlaying(false);
    const total = inst.steps.length, score = tapScore();
    const pr = getProgress(tpl.id) || {};
    const record = pr.best == null || score > pr.best;
    updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, best: Math.max(pr.best ?? 0, score), ...keep(), ...(score >= total - 1 ? { met: true } : {}) });
    const stars = score >= total ? '★★★' : score >= total - 2 ? '★★☆' : score >= total / 2 ? '★☆☆' : '☆☆☆';
    // (the next choice of the first option: a harder set, when there is one)
    const [k0, def0] = Object.entries(tpl.params || {})[0] || [];
    const opts0 = def0 ? paramOptions(def0, S, p) : [];
    const harder = opts0[opts0.findIndex((o) => o[0] === p[k0]) + 1];
    const masterBtn = score >= total - 1 && !isMastered(tpl.id)
      ? h('button', { class: 'btn', onClick: () => { setMastered(tpl.id, true); toast('Mastered ✓: it counts in the Library and the course'); masterBtn.remove(); syncToggles(); } }, '✓ Mastered')
      : null;
    tapEndEl.replaceChildren(h('div', { class: 'game-card' },
      h('div', { class: 'game-stars' }, stars),
      h('h2', {}, `${score} of ${total}`),
      pr.best != null ? h('p', { class: 'muted' }, record ? 'A new best score' : `Best ${pr.best} of ${total}`) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onClick: () => tapStart() }, '↻ Again'),
        harder && score >= total - 2 ? h('button', { class: 'btn', onClick: () => { p[k0] = harder[0]; renderParams(); if (!lesson && !preview) updateProgress(tpl.id, keep()); tapStart(); } }, `Harder: ${harder[1]}`) : null,
        masterBtn,
        h('button', { class: 'btn', onClick: () => { tapEndEl.hidden = true; showStep(total - 1); } }, '‹ Look back'))));
    tapEndEl.hidden = false;
  }

  // ------------------------------------------------------------ tip
  function tip(msg, { title = null } = {}) {
    tipEl.replaceChildren(
      h('span', { class: 'coach-ico', html: icon('info') }),
      h('div', { class: 'coach-txt' }, title ? h('b', {}, title) : null, h('span', {}, msg)),
      h('button', { class: 'coach-x', title: 'Close', 'aria-label': 'Close tip', onClick: () => hideTip() }, '×'));
    tipEl.hidden = false;
  }
  function hideTip() { tipEl.hidden = true; }
  // any press outside the tip closes it (and still does what it was for: play, options, goal…);
  // a press that shows a new tip replaces it, because the click comes after this
  function pressAnywhere(e) { if (!tipEl.hidden && !tipEl.contains(e.target)) hideTip(); }
  document.addEventListener('pointerdown', pressAnywhere, true);

  // ------------------------------------------------------------ keyboard & lifecycle
  function onKey(e) {
    if (!tipEl.hidden) hideTip();
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); playPress(); }
    else if (e.code === 'ArrowRight') manual(1);
    else if (e.code === 'ArrowLeft') manual(-1);
    else if (e.key === '+' || e.key === '=') setBpm(player.bpm + 2);
    else if (e.key === '-') setBpm(player.bpm - 2);
    else if (e.key === 'Escape') { drawer.classList.remove('open'); closeOptions(); closeMore(); if (!rec) closeRec(); }
  }
  window.addEventListener('keydown', onKey);

  function close() { onBack?.(); }

  function dispose() {
    alive = false;
    if (TAP) { clearTimeout(tapTimer); logPlaying(false); }
    if (rec) { const r = rec; rec = null; r.take?.stop({ keep: false }); A.setAudioOptions({ recClick: false, clickVol: S.clickVol }); }
    listening?.stop();
    document.removeEventListener('pointerdown', pressAnywhere, true);
    hideTip();
    player.stop(true);
    fb.destroy();
    closeMore();
    window.removeEventListener('keydown', onKey);
    document.body.classList.remove('in-ex');
  }

  // if the first build fails the screen is unusable: clean up and let the router recover
  try {
    rebuild();
    if (!inst) throw new Error(`No notes for ${tpl.id}`);
    renderParams();
  } catch (err) {
    dispose();
    throw err;
  }
  if (demo) {
    tip(`The app plays it once at the goal tempo: listen and watch the neck.${fretNote()}`, { title: `${lessonName} · demo` });
    setTimeout(() => { if (alive && !player.playing) player.play(); }, 500);
  } else if (LS?.do) tip(`${LS.do}${fretNote()}`, { title: `${lessonName} · step ${LI + 1} of ${L.steps.length}` });
  return { dispose, player };
}
