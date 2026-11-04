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
import { recordLoop, rememberTempo, stepState, stepPassed, stepClean, stepCoveredBy, setClean, untickStep, isDue, isComplete, reviewed } from '../course/progress.js';
import { goalOf, goalText as masteryGoal, meetsGoal, setMastered, isMastered, SUB_NAMES, mainOf, choicesOf, choiceOf, choiceName, isCleared, goalMet,
  recordGoal, setCleared, clearedCount, recordGame } from '../mastery.js';
import { openPro } from './proSheet.js';
import { JUDGED, startTake, judge, playTake, keepResult, resultFor } from '../judge.js';
import { tapSet, placesOf } from '../curriculum/games.js';
import { spellMidi } from '../builder.js';
import { logPlaying } from '../practiceLog.js';
import { isBandExercise, bandStyle, matchedStyle, bandKey, bandSound, styleSound, meterOf, patternUnit, fits, BAND_SOUNDS, soundName } from '../band.js';
import { STYLES, GENRES } from '../practice/styles.js';
import { styleGain, loadKit, kitReady } from '../drums.js';
import { loadPiano, pianoReady } from '../piano.js';
import { room, saveRoom } from '../practice/state.js';
import { openPicker } from './picker.js';
import { isPro, styleLock, soundLock } from '../pro.js';
import { isNew, markUsed } from '../news.js';

// a Pro exercise opened by a free player is a preview (user, 2026-10-29): since 2026-11-02 its first bar only ("much
// more strict… reproduce the first bar only and opacity fade the rest of the bars, no auto scroll"): the player, the
// neck and ‹ › stop there, and the strip shows the next bars fading out to the screen's right edge, not scrolling

// what a lesson step's goal tempo counts in ("goal 96 BPM in 8ths"; the list lives in mastery.js)
export { SUB_NAMES };
const SUBS = [['0.25', 'Whole'], ['0.5', 'Half'], ['1', '♩ 1/beat'], ['2', '♪ 2/beat'], ['3', '3 triplets'], ['4', '4 16ths'], ['5', '5 quint.'], ['6', '6 sext.']];
// the modules whose drills have no backing (see harmony.js), named for the greyed Backing's toast
const NO_BACKING_NAME = { technique: 'technique drills', rhythm: 'rhythm drills', fretboard: 'note-finding drills', intervals: 'interval drills', ear: 'ear training' };
// the cycling buttons: each state's name (said in a toast when it is picked) and its icon (Backing
// keeps its words: clearer than any icon)
const REVEALS = [['gradual', 'Step by step', 'revStep'], ['full', 'Whole shape', 'revShape'], ['quiz', 'Quiz', 'revQuiz']];
// ("No dots": the neck shows nothing, only the sound and the strip; user, 2026-11-03)
const LABELS = [['note', 'Note names', 'lblNote'], ['degree', 'Degrees', 'lblDeg'], ['finger', 'Fingers', 'lblFinger'], ['none', 'No labels', 'lblNone'], ['hide', 'No dots', 'lblHide']];
const BACKINGS = { off: 'Off', drone: 'Drone', chords: 'Chords' };
const SCORES = { tab: ['Tab', 'tab'], staff: ['Staff', 'staff'] };
const RANK = { ghost: 0, future: 1, past: 2, next: 3, current: 4 };
const BAND_INFO = [
  '🥁 The band: the Practice room\'s drums and the chords play with you, in place of the click',
  '🎯 Each exercise starts with a pattern that fits its style; Change picks another, kept for this exercise',
  '🎹 Chords: the sound of the chords, as in the room; each style starts with its own (rock and metal the guitar, gospel the organ, jazz the piano), your choice kept for this exercise',
  '🔊 Volume: the drums and the chords together',
  '🔇 Off, or a tap on the beat lights (🥁 at their left): the click again, in every style exercise',
  '⭐ Free: three patterns of each genre, Pad, E-piano and Arpeggio; Pro: all of them',
];
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
  // (a lick exercise whose chosen lick is major: major keys, whatever the template's)
  if (def.minorWhen) return { ivs: T.SCALES.ionian.iv, suffix: '' };
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
  // tap mode (see "tap mode" below): every game, and a tap drill (a reading or note-finding exercise with a `tap`)
  // when the player turned it on there (user, 2026-11-02)
  const TAP_DRILL = !tpl.game && tpl.tap ? tpl.tap : null;
  // (tap drills open in tap mode where they say so, `def`, until the player picks play mode: user, 2026-11-03, every
  // note-guessing exercise uses the tap system; in a lesson the ear drills are scored by it, the reading drills are read
  // at the step's tempo)
  let TAP = !!tpl.game || (!!TAP_DRILL && !demo && (lesson ? TAP_DRILL.kind === 'ear' : (prog.tapOn ?? !!TAP_DRILL.def)));
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
  let stripInst = null;   // the whole line the strip draws (a preview plays and shows only its first bar: `inst`)
  // a lesson step plays in its own subdivision (part of the lesson's options, never saved to the exercise)
  let userSub = lesson ? (LS.sub ?? null) : (prog.sub ?? null);
  // (a step of a test with no dots, by ear and memory: the neck stays empty and the strip asks "?"; user, 2026-11-03)
  const noDots = LS?.dots === 'hide';
  let labelMode = noDots ? 'hide' : prog.label || null;
  let reveal = noDots ? 'quiz' : S.reveal;
  // (a no-dots step shows the tab in Quiz mode: "?" until each note has sounded, so only the sound leads)
  let score = noDots ? 'tab' : null; // 'tab' | 'staff' (reading exercises open on the staff)
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
  const playPress = () => (TAP ? tapPlay() : rec?.phase === 'armed' ? startRec() : rec ? cancelTake() : (bandHint(), player.toggle()));
  // (the first time the band plays, a tip says what it is and how to get the click back: QA round 23)
  function bandHint() {
    if (!player.band || player.playing || S.bandHint || preview) return;
    saveSettings({ bandHint: true });
    tip('🥁 The band plays with you, in place of the click: tap the beat lights for the click, ⋯ → Band for its drums, chords and volume');
  }
  // all exercise options live behind one clear button (a strip of selects gets cut off on phones)
  const optsSum = h('span', { class: 'opts-sum' });
  const hasParams = Object.keys(tpl.params || {}).length > 0;
  const optsBtn = hasParams ? h('button', { class: 'opts-btn', title: 'Change scale, key, pattern…', onClick: () => (sheet.classList.contains('open') ? closeOptions() : openOptions()) },
    h('span', { class: 'opts-ico', html: icon('sliders') }),
    h('span', { class: 'opts-txt' }, h('small', {}, 'Options · tap to change'), optsSum)) : h('div', { class: 'grow' });
  const sheet = h('div', { class: 'sheet', onClick: (e) => { if (e.target === sheet) closeOptions(); } });
  const lessonName = L ? (L.kind === 'lesson' ? `Lesson ${L.num}` : L.kind === 'check' ? L.title : 'Stage test') : '';
  const goalText = () => (LS?.goal ? `goal ${LS.goal} BPM${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}` : TAP ? '8 of 10 passes' : 'one full round');
  const subtitle = L
    ? `${lessonName} · ${demo ? 'demo: listen and watch' : `step ${LI + 1}/${L.steps.length} · ${goalText()}`}`
    : `${mod?.name ?? ''}${tpl.song ? ' · our own line in its style, not the record\'s' : ''}${tpl.tune ? ` · ${tpl.tune.who}` : ''} · Level ${tpl.level} ${lvl ? lvl.name : ''}${preview ? ' · Pro preview' : ''}`;
  // a tap on the title shows where the exercise lives: a lesson's step its lesson on the course map (user,
  // 2026-11-02), anything else its card in the Library, at its level (user, 2026-10-29); either highlighted a moment
  const where = L ? 'the course map' : 'the Library';
  const toLibrary = () => { location.hash = L ? `#/course?f=${encodeURIComponent(L.id)}` : `#/library?f=${encodeURIComponent(tpl.id)}`; };
  const titleEl = h('div', { class: 'exv-title to-lib', role: 'link', tabindex: 0, 'aria-label': `${tpl.title}: show it in ${where}`, onClick: toLibrary, onKeydown: (e) => { if (e.key === 'Enter') toLibrary(); } },
    h('b', { title: `${tpl.title} · show it in ${where}` }, h('span', { class: 'ex-num' }, tpl.num), tpl.short || tpl.title), h('span', { title: subtitle }, subtitle));
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
  // (the Pro offer itself, in the Pro button's gold: "⭐ Preview" read like an action, QA round 22)
  const previewBtn = preview ? h('button', { class: 'btn small pro-go pro-try', title: preview, onClick: offerPro }, '⭐ Get Pro') : null;
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
  // the band (band.js; user, 2026-11-02): in the exercises played in a style over chords, the room's drums and a chord
  // sound play in place of the click; 🥁 beside the beat lights says so, and a tap on the lights switches between the
  // band and the click (user, 2026-11-02: "clicking on the metronome dots the user has to be able to switch it"); in
  // the other exercises it turns the click on or off
  const BANDS = isBandExercise(tpl) && !TAP;
  // (the quiz prompt clear of the beat lights and 🥁, QA round 23)
  if (BANDS) promptEl.classList.add('with-band');
  const bandIco = h('span', { class: 'band-ico', hidden: !BANDS, html: icon('band') });
  const fbHost = h('div', { class: 'fb-host' });
  // a tip to read (the lesson step's instruction, a hint, an explanation): it belongs to this screen,
  // stays until it is closed, and closes as soon as anything else in the exercise is pressed
  const tipEl = h('div', { class: 'coach', role: 'status', hidden: true });
  const beatRow = h('button', { class: 'beat-row', type: 'button', onClick: () => tapBeats() }, bandIco, beatsEl);
  boardEl.append(fbHost, nowEl, promptEl, beatRow);
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
    if (preview) { rebuild(); return; }
    player.setSub(userSub);
    if (!lesson && !preview) updateProgress(tpl.id, { sub: userSub });
    renderTab();
    syncGoal();
  });
  // shown instead of the subdivision select when the rhythm is part of the exercise (licks, grooves…)
  const rhythmBtn = h('button', { class: 'lbl-btn written', title: 'Why can\'t I change the subdivision?',
    onClick: () => tip('The rhythm is written into this exercise, so the subdivision is fixed. Change the tempo instead.') }, '♪ Written rhythm');
  const loopBtn = btn('loop', 'Loop', () => { if (preview) { offerPro(); return; } player.loop = !player.loop; syncToggles(); });
  const metroBtn = btn('metro', 'Metronome', () => {
    if (player.band) { toast('The band keeps the time: tap the beat lights for the click'); return; }
    player.metro = !player.metro;
    saveSettings({ metro: player.metro });
    syncToggles();
  });
  const soundBtn = btn('sound', 'Bass sound on/off', () => { player.sound = !player.sound; syncToggles(); });
  const trainerBtn = btn('trainer', 'Speed trainer (+4 BPM each loop)', () => (preview ? offerPro() : toggleTrainer()));
  // ✓ Cleared: the choice playing (its main option's value) is clean at the goal; 🏅 once enough are (mastery.js)
  const doneBtn = btn('check', 'Cleared: this choice played clean at the goal', () => (preview ? offerPro() : toggleCleared()));
  const masteredBtn = h('button', { class: 'lbl-btn medal', title: 'Mastered: tap to take it back', 'aria-label': 'Mastered', onClick: () => unmasterAsk() }, '🏅');
  const revealBtn = h('button', { class: 'lbl-btn ico', title: 'Reveal mode: step by step / whole shape / quiz', onClick: () => cycleReveal() });
  const backingBtn = h('button', { class: 'lbl-btn', title: 'Backing: off / a drone on the root / the chords', onClick: () => cycleBacking() });
  const bandBtn = h('button', { class: 'lbl-btn ico', title: 'The band: drums and chords in place of the click', 'aria-label': 'The band', onClick: () => openBand(), html: icon('band') });
  const scoreBtn = h('button', { class: 'lbl-btn ico', title: 'Under the neck: tab or bass-clef staff', onClick: () => cycleScore() });
  const labelBtn = h('button', { class: 'lbl-btn ico', title: 'Dot labels: note / degree / finger / none', onClick: () => cycleLabel() });
  // secondary controls: inline on wide screens, in a "⋯" popover on phones (see .more-pop in app.css)
  const item = (el, text) => h('div', { class: 'mi' }, el, h('span', { class: 'mi-l', onClick: () => el.click() }, text));
  const morePop = h('div', { class: 'more-pop' },
    h('div', { class: 'sep' }), item(metroBtn, 'Metronome'), item(soundBtn, 'Bass sound'), item(trainerBtn, 'Speed trainer'),
    item(backingBtn, 'Backing'), BANDS ? item(bandBtn, 'Band') : null,
    h('div', { class: 'sep' }), item(revealBtn, 'Reveal'), item(labelBtn, 'Dot labels'), item(scoreBtn, 'Tab / staff'), h('div', { class: 'grow' }), item(doneBtn, 'Cleared'), item(masteredBtn, 'Mastered'));
  const moreBtn = btn('more', 'More controls', () => toggleMore(), 'more-btn');
  // 👆 a tap drill's tap mode on or off (it stays in view in both)
  const tapBtn = btn('lblFinger', 'Tap mode', () => setTap(!TAP));
  const ctrl = h('footer', { class: 'exv-ctrl' },
    btn('restart', 'Back to start', () => restart()), silent(btn('prev', 'Previous note (←)', () => manual(-1))), playBtn,
    silent(btn('next', 'Next note (→)', () => manual(1))), tapBtn, h('div', { class: 'sep' }), tempo, subSel, rhythmBtn, h('div', { class: 'sep' }),
    loopBtn, morePop, moreBtn);

  const drawer = h('aside', { class: 'drawer' });
  const view = h('div', { class: 'exv' }, top, stage, ctrl);
  root.replaceChildren(view, drawer, sheet);

  const fb = new FretboardView(fbHost, { onTap: (s, f) => tapNote(s, f) });
  const tab = new TabView(tabEl, { onSeek: (i) => {
    if (TAP) { tapSeek(i); return; }
    if (preview && i >= inst.steps.length) return;   // (a preview's faded bars are not to play)
    if (player.playing) player.pause();
    player.stepTo(i);
  } });
  // tap mode needs no tempo, beats, loop or playback toggles: only ✓ Cleared and 🏅 stay under ⋯
  applyTapUi();

  const player = new Player({
    onStep: (i) => {
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
        // (a full loop at the goal on the choice playing: ✓ Cleared can be ticked on it, here or anywhere; user,
        // 2026-11-02)
        const v = choiceOf(tpl.id, p);
        const met = played != null && !demo && !goalMet(tpl.id, v) && meetsGoal(tpl.id, played, inst?.uniform ? player.sub : null, v);
        updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, ...(played != null ? { bestBpm: Math.max(pr.bestBpm || 0, played) } : {}), ...keep(), lastBpm: player.bpm });
        if (met) {
          recordGoal(tpl.id, v);
          if (!isCleared(tpl.id, v) && countsHere()) {
            const name = choiceName(tpl.id, v);
            // (the app cannot hear the bass: it says what it knows, its own loop; user, 2026-11-03)
            tip(h('span', {}, `🎯 The app played a full loop${name ? ` of ${name}` : ''} at ${played} BPM (the goal: ${masteryGoal(tpl.id, v)}). If you played along cleanly: `,
              h('button', { class: 'btn small primary', onClick: () => { hideTip(); toggleCleared(); } }, '✓ Cleared')));
          }
        }
      }
      // a lesson step counts only with the lesson's options (another key is fine where the lesson leaves it free)
      if (lesson && !demo && played != null && presetOk()) {
        const first = recordLoop(L, LI, played);
        rememberTempo(L, LI, player.bpm);
        if (!LS.goal || played >= LS.goal) visitPassed = true;
        if (first || (reviewing && visitPassed && !passShown)) {
          passShown = true;
          tip(earStep ? (reviewing ? 'Round played: if you still got them all, tick ✓ Still got them?' : 'Round played: if you named them all before the answers, tick ✓ Got them all?')
            : reviewing ? `The app played a full loop at ${played} BPM. If you still played along cleanly, tick ✓ Still clean?`
              : `The app played a full loop at ${played} BPM${LS.goal ? (played === LS.goal ? ', the step\'s goal' : ` (the goal is ${LS.goal})`) : ''}. If you played along cleanly, tick ✓ Cleared?`);
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
    tip(h('span', {}, 'That was a preview: its first bar, once. BassClass Pro opens the whole exercise, the loop, the speed trainer and your progress. ', h('button', { class: 'btn small pro-go', onClick: offerPro }, '⭐ Get Pro')), { title: 'Pro preview' });
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
    const main = mainOf(tpl.id);
    const groups = Object.entries(tpl.params || {}).map(([k, def]) => {
      const chips = h('div', { class: 'chips' });
      const isMain = main?.by === k;
      for (const [v, l] of paramOptions(def, S, p)) {
        // (the main option: a cleared choice has a green edge and a tick; user, 2026-11-02)
        const done = isMain && isCleared(tpl.id, String(v));
        chips.append(h('button', { class: `chip-btn${v === p[k] ? ' on' : ''}${done ? ' cleared' : ''}`, title: done ? `${l}: cleared` : null, disabled: !!fixed[k], onClick: () => {
          if (p[k] === v) return;
          p[k] = v;
          rebuild();
          renderParams();
          renderOptions();
          if (!preview) updateProgress(tpl.id, keep());
        } }, l));
      }
      const c = isMain && !preview ? clearedCount(tpl.id) : null;
      const status = c && (isMastered(tpl.id) ? '🏅 mastered' : `✓ ${c.done} cleared · ${c.need < c.of ? `${c.need} of ${c.of}` : `all ${c.of}`} needed for 🏅`);
      return h('div', { class: `opt-group${fixed[k] ? ' fixed' : ''}` }, h('h4', {}, def.label, status ? h('span', { class: 'opt-mastery' }, status) : null),
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
      next = TAP ? tapBuild() : tpl.build(p, ctx, S);
    } catch (e) {
      console.error(e);
      toast('Could not build this variation');
      return;
    }
    if (!next?.steps?.length) { toast('No notes for this variation'); return; }
    // (a preview plays, shows and steps through its first bar only; the strip draws the whole line, fading)
    stripInst = next;
    if (preview && !TAP) {
      const end = firstBarEnd(next);
      if (end < next.steps.length) next = { ...next, steps: next.steps.slice(0, end) };
    }
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
    if (!labelMode && !TAP) labelMode = inst.label || tpl.label || S.label;
    if (inst.reveal) reveal = inst.reveal;
    if (!score && !TAP) score = inst.view || S.score;
    player.load(inst);
    applyBacking();
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lefty: S.lefty, zone: inst.zone || null });
    if (TAP) fb.fit(0, inst.tap?.hi ?? TAP_HI, 12); else fb.fit(inst.range[0], inst.range[1], 9);
    fb.setOutside(TAP ? null : playArea());
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

  /** The first step after the first bar (the line's length when it is one bar or less). */
  function firstBarEnd(x) {
    const bpb = x.beatsPerBar || 4, sub = (x.uniform ? userSub : null) ?? x.sub ?? tpl.sub ?? 2;
    let b = 0;
    for (let i = 0; i < x.steps.length; i++) {
      if (i > 0 && b >= bpb - 1e-9) return i;
      b += x.uniform ? x.steps[i].dur / sub : x.steps[i].dur;
    }
    return x.steps.length;
  }
  /** A preview's strip: the first bar clear, the bars after it fading out to the right edge; it does not scroll. */
  function previewStrip() {
    const cut = preview && !TAP && stripInst && inst.steps.length < stripInst.steps.length ? tab.cols?.[inst.steps.length]?.x : null;
    tabEl.classList.toggle('preview-strip', cut != null);
    const mask = cut != null ? `linear-gradient(to right, #000 0, #000 ${Math.max(0, cut - 6)}px, transparent 100%)` : '';
    tabEl.style.maskImage = mask;
    tabEl.style.webkitMaskImage = mask;
    if (cut != null) tabEl.scrollLeft = 0;
  }
  function renderTab() {
    // Quiz mode: the strip gives no answers away (tab: "?" until a note is played; staff: no names)
    const quiz = reveal === 'quiz';
    // (a false harmonic's fretted finger, `held`, is on the neck only: the strip writes the harmonic)
    const shown = preview && !TAP && stripInst ? stripInst : inst;
    tab.render(shown.steps.some((st) => st.notes.some((n) => n.held)) ? { ...shown, steps: shown.steps.map((st) => (st.notes.some((n) => n.held) ? { ...st, notes: st.notes.filter((n) => !n.held) } : st)) } : shown, {
      strings: ctx.tuning.length, beatsOf: (st) => player.beatsOf(st), beatsPerBar: inst.beatsPerBar || 4, sub: player.sub, mode: TAP ? 'staff' : score, quiz,
      label: (n) => (labelMode === 'none' || labelMode === 'hide' || (quiz && score === 'staff') ? '' : noteLabel(n, labelMode === 'finger' ? 'note' : labelMode, S.notation)),
      decorate: TAP ? (el) => decorateStaff(el) : null,
      // (an exercise whose quiz is fixed and is not a reading drill hides the staff's notes until they sound, as the tab
      // does; a reading drill keeps them, the staff being its clue)
      hideAhead: quiz && !TAP && tpl.module !== 'reading' && (tpl.reveal === 'quiz' || inst.reveal === 'quiz'),
    });
    tab.setCurrent(cur);
    previewStrip();
  }

  // ------------------------------------------------------------ dots
  function mkDot(n, state) {
    // (Quiz mode too follows Dot labels: it always named the note, so the menu changed nothing there; 2026-11-03)
    const label = noteLabel(n, labelMode, S.notation);
    const color = n.tag === 'x' ? 'ghost' : degKey(n.deg);
    return { s: n.s, f: n.f, at: n.at, label: n.tag === 'x' ? 'x' : label, color, state, tag: n.tag && n.tag !== 'x' ? n.tag : null };
  }

  // the exercise's whole count of notes (a preview plays its first bar, but says how long the exercise is)
  const total = () => (stripInst || inst).steps.length;
  const noteCount = () => (stripInst || inst).steps.filter((s) => !s.rest && s.notes?.length).length;
  function showStep(i) {
    if (TAP) { tapShow(i < 0 ? -1 : askOf(i)); return; }
    cur = i;
    const steps = inst.steps;
    // No dots: the neck shows nothing (no dot, no string moving, no "next C"), only the count and the strip
    if (labelMode === 'hide') {
      fb.setDots([]);
      tab.setCurrent(i);
      const k = Math.max(0, i);
      nowEl.innerHTML = `${chordAt[k] ? `<span class="chord">${esc(chordAt[k])}</span>` : ''}${textAt[k] ? `<span class="txt">${esc(textAt[k])}</span>` : ''}<span class="cnt">${i < 0 ? `ready · ${noteCount()} notes` : `${i + 1}/${total()}`}</span>`;
      promptEl.innerHTML = '';
      return;
    }
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
      nowEl.innerHTML = chordAt[0] ? `<span class="chord">${esc(chordAt[0])}</span>${textAt[0] ? `<span class="txt">${esc(textAt[0])}</span>` : ''}<span class="cnt">ready · ${noteCount()} notes</span>` : `<span class="cnt">ready · ${noteCount()} notes</span>`;
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
    nowEl.innerHTML = `${chordAt[i] ? `<span class="chord">${esc(chordAt[i])}</span>` : ''}${textAt[i] ? `<span class="txt">${esc(textAt[i])}</span>` : ''}<span class="cnt">${i + 1}/${total()}</span>`;
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
    const tick = earStep ? 'Got them all' : 'Cleared';
    goalBtn.textContent = !ok ? '↺ Options'
      : clean ? `✓ ${earStep && !TAP ? 'Got them' : 'Cleared'}`
        : passed ? (reviewing ? `✓ Still ${earStep ? 'got them' : 'clean'}?` : `✓ ${tick}?`)
          : LS.goal ? `🎯 ${reviewing ? 'review' : st.best || '–'}/${LS.goal}` : TAP ? '🎯 8 of 10' : '🎯 1 round';
    goalBtn.title = !ok ? 'You changed an option the lesson sets (or its notes per beat): tap to go back to the lesson\'s options. Only those count for the lesson.'
      : LS.goal ? `Goal: a full loop from the first note at ${LS.goal} BPM or faster${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}, then tick ✓ Cleared (best so far: ${st.best || '–'} BPM)`
        : TAP ? 'Goal: a set of 10 with 8 or more right' : 'Goal: one full round from the first note, then tick ✓ if you named them all before the answers';
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
      // (the goal's tempo set in the player: user, 2026-11-02, "if the goal is 100 BPM then set 100 BPM")
      if (TAP) { tip('▶ starts a set of 10: 8 or more right passes this step.'); return; }
      if (LS.goal && player.bpm !== LS.goal) setBpm(LS.goal);
      tip(LS.goal ? `Tempo set to the goal, ${LS.goal} BPM: play a full loop from the first note, then tick ✓ Cleared.` : 'Play one full round from the first note, then tick ✓ if you named them all before the answers.');
      return;
    }
    if (reviewing) {
      const days = reviewed(L);
      reviewing = false;
      toast(`Reviewed ✓ Next review in ${days} days`, 3000);
    } else if (stepClean(L, LI)) {
      // a ticked step can be unticked here too, after a question (user, 2026-10-29: "checked exercises have to be
      // able to be unchecked"); one its exercise's mastery ticks takes the mastery back with it
      const by = stepCoveredBy(L, LI), name = by && choiceName(L.steps[LI].ex, choiceOf(L.steps[LI].ex, LS.p));
      if (!confirm(by ? `This step is ticked because you ${by === 'mastered' ? 'mastered this exercise' : `cleared ${name || 'it'}`} in the Library. Untick it? ✓ Cleared${name ? ` on ${name}` : ''} is taken back there too${by === 'mastered' ? ', and 🏅 Mastered with it' : ''}.` : `Untick ✓ ${earStep ? 'Got them all' : 'Cleared'}? Practise the step again, and tick it when it is clean.`)) return;
      untickStep(L, LI);
      lessonDone = false;
      if (nextBtn && !routine) nextBtn.classList.remove('primary');
      toast('Unticked');
    } else {
      const ex = L.steps[LI].ex, was = isMastered(ex), ch = choiceOf(ex, LS.p), wasC = isCleared(ex, ch);
      const complete = setClean(L, LI, true);
      // (a step at least as hard as the exercise's goal clears its choice in the Library: say so, QA round 19)
      const mastered = !was && isMastered(ex) ? ' · 🏅 the exercise is mastered in the Library too'
        : !wasC && isCleared(ex, ch) ? ` · ✓ ${choiceName(ex, ch) || 'cleared'} in the Library too` : '';
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
  // ⏮ (user, 2026-11-02): the score back to its start; while playing, the playing goes on from the first note
  function restart() {
    if (TAP) { tapStart(); return; }
    tab.toStart();
    if (player.playing) { player.restart(); return; }
    player.stop(true);
    player.cur = 0;
    showStep(-1);
  }
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
    if (player.band) { toast('The band plays the chords: tap the beat lights for the click, then choose a backing'); return; }
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
    applyBand();
    if (!player.playing) return;
    const hm = player.harmony && harmonyAt(player.harmony, Math.max(0, cur));
    // (the arpeggio and the guitar play on the beats: the player starts them on the next one)
    player.arpSig = null;
    if (hm && !player._perBeat()) A.padSet(hm, A.now() + 0.02, player.band?.sound || 'pad'); else A.padStop();
    player.padSig = hm ? hm.join() : null;
  }

  // ------------------------------------------------------------ the band
  // (on or off is the player's choice for every style exercise, `band` in the settings; a take never has it)
  let bandOn = BANDS && S.band;
  /** The pattern this exercise plays with these options (the player's choice or the matched one), or null. */
  const bandNow = () => (BANDS && inst ? bandStyle(tpl, p, inst, { pro: isPro(), chosen: S.bandStyles }) : null);
  /** The band in the player: the pattern, its beat against the exercise's, the chords in its sound. */
  function applyBand() {
    const key = bandOn && rec?.phase !== 'running' ? bandNow() : null;
    if (!key) { if (player.band) A.setAudioOptions({ padVol: 1 }); player.band = null; return; }
    const s = STYLES[key];
    const sound = bandSound(tpl, key, S.bandSounds, isPro());
    player.band = { key, s, gain: styleGain(key), unit: meterOf(inst).unit, pUnit: patternUnit(s), sound };
    // (the band plays the exercise's chords, whatever the Backing)
    if (canBack) player.harmony = harmonyTrack(inst, 'chords');
    // (the kit and the piano load on first use, from the app's own files; until then the click keeps the time)
    if (!kitReady()) loadKit().catch(() => {});
    if (sound === 'piano' && !pianoReady()) loadPiano().catch(() => {});
    // (the band's own volume, in its panel: QA round 23; 80% is the drums at the room's default, the chords at the Backing's)
    A.setAudioOptions({ drumVol: S.bandVol / 100, padVol: S.bandVol / 80 });
  }
  const meterName = () => { const ts = inst.timeSig || [4, 4]; return `${ts[0]}/${ts[1]}`; };
  /** A tap on the beat lights: the band or the click (style exercises), else the click on or off. */
  function tapBeats() {
    if (BANDS) { toggleBand(); return; }
    if (rec) { toast('A take keeps the click'); return; }
    player.metro = !player.metro;
    saveSettings({ metro: player.metro });
    syncToggles();
    toast(player.metro ? 'Click on' : 'Click off: the beat lights keep the time');
  }
  /** 🥁: the band on or off (for every style exercise). */
  function toggleBand() {
    if (!BANDS) return;
    if (rec) { toast('A take keeps the click: no band while recording'); return; }
    // (no pattern here: nothing to switch, and the band stays as it is in the other exercises: QA round 23)
    if (!bandNow()) { toast(`No free drum pattern in ${meterName()}: the click keeps the time`); return; }
    bandOn = !bandOn;
    saveSettings({ band: bandOn });
    applyBacking();
    syncToggles();
    if (sheet.querySelector('.band-panel')) renderBand();
    toast(bandOn ? `🥁 Band: ${STYLES[player.band.key].name}, ${soundName(player.band.sound)}` : 'Band off: the click keeps the time');
  }
  let closePicker = null;
  /** ⋯ → Band: on or off, the drum pattern (Change: the room's patterns that fit this metre) and the chords' sound. */
  function openBand() {
    closeMore();
    renderBand();
    sheet.classList.add('open', 'opening');
    setTimeout(() => sheet.classList.remove('opening'), 260);
  }
  function renderBand() {
    const key = bandNow();
    const pro = isPro();
    const matched = BANDS ? matchedStyle(tpl, p, inst, pro) : null;
    const s = key && STYLES[key];
    const genre = s && GENRES.find((g) => g.key === s.genre);
    const onOff = h('div', { class: 'chips' }, [[true, 'On'], [false, 'Off']].map(([v, l]) => h('button', {
      class: `chip-btn${bandOn === v ? ' on' : ''}`, onClick: () => { if (bandOn !== v) toggleBand(); } }, l)));
    const drums = s
      ? h('button', { class: 'pick-now', type: 'button', onClick: () => openDrums() },
        h('span', { class: 'pick-text' }, h('b', {}, s.name), h('small', {}, `${genre ? `${genre.icon} ${genre.name}` : ''}${key === matched ? ' · matched to this exercise' : ' · your choice'}`)),
        h('span', { class: 'pick-change' }, 'Change', h('span', { html: icon('next') })))
      : h('p', { class: 'opt-note' }, `No free drum pattern in ${meterName()}: the click keeps the time.`);
    const back = s && key !== matched && STYLES[matched]
      ? h('div', { class: 'chips' }, h('button', { class: 'chip-btn', onClick: () => pickBandStyle(matched) }, `↺ Back to ${STYLES[matched].name}`)) : null;
    const sounds = h('div', { class: 'chips' }, BAND_SOUNDS.map(([v, l]) => {
      const lock = soundLock(v);
      return h('button', { class: `chip-btn${bandSound(tpl, key, S.bandSounds, pro) === v ? ' on' : ''}${lock ? ' locked' : ''}`, onClick: () => {
        if (lock) { openPro(lock, { then: () => setBandSound(v), cancel: () => openBand() }); return; }
        setBandSound(v);
      } }, l, lock ? h('span', { class: 'chip pro' }, 'Pro') : null);
    }));
    const volOut = h('output', {}, `${S.bandVol}%`);
    const vol = h('div', { class: 'band-vol' }, h('input', { type: 'range', min: 0, max: 100, step: 5, value: S.bandVol, 'aria-label': 'Band volume', onInput: (e) => {
      saveSettings({ bandVol: Number(e.target.value) });
      volOut.textContent = `${S.bandVol}%`;
      if (player.band) A.setAudioOptions({ drumVol: S.bandVol / 100, padVol: S.bandVol / 80 });
    } }), volOut);
    const panel = h('div', { class: 'panel band-panel' },
      h('header', {}, h('div', { class: 'band-head' }, h('h2', {}, '🥁 Band'), infoBtn(BAND_INFO, 'About the band')),
        h('button', { class: 'btn primary', onClick: () => closeOptions() }, 'Done')),
      h('div', { class: 'opt-group' }, h('h4', {}, 'Band'), onOff),
      h('div', { class: 'opt-group' }, h('h4', {}, 'Drums'), drums, back),
      h('div', { class: 'opt-group' }, h('h4', {}, 'Chords'), sounds),
      h('div', { class: 'opt-group' }, h('h4', {}, 'Volume'), vol));
    sheet.replaceChildren(panel);
  }
  /** The room's drum patterns that fit this exercise's metre, in the shared picker (Pro ones gold for free players). */
  function openDrums(at) {
    const m = meterOf(inst);
    const fit = Object.values(STYLES).filter((x) => fits(x, m));
    const key = bandNow();
    closePicker = openPicker({
      title: `Drum patterns in ${meterName()}`, host: root,
      groups: GENRES.filter((g) => fit.some((x) => x.genre === g.key)).map((g) => ({ key: g.key, name: `${g.icon} ${g.name}` })),
      // (no tempo on the cards: the pattern plays at the exercise's)
      items: fit.map((x) => ({ key: x.key, name: x.name, group: x.genre, sub: '', lock: styleLock(x.key), fresh: isNew(`style:${x.key}`) })),
      current: key, open: at ?? STYLES[key]?.genre,
      favs: room.drumFavs, recent: room.drumRecent,
      onLocked: (why, k, g) => { markUsed(`style:${k}`); openPro(why, { then: () => pickBandStyle(k), cancel: () => openDrums(g) }); },
      onFav: (k, on) => saveRoom({ drumFavs: on ? [...room.drumFavs.filter((x) => x !== k), k] : room.drumFavs.filter((x) => x !== k) }),
      onPick: (k) => pickBandStyle(k),
    });
  }
  /** A pattern chosen for this exercise and style (the matched one again forgets the choice). */
  function pickBandStyle(k) {
    markUsed(`style:${k}`);
    saveRoom({ drumRecent: [k, ...room.drumRecent.filter((x) => x !== k)].slice(0, 6) });
    const chosen = { ...S.bandStyles };
    const at = bandKey(tpl, p);
    if (k === matchedStyle(tpl, p, inst, isPro())) delete chosen[at]; else chosen[at] = k;
    saveSettings({ bandStyles: chosen, ...(bandOn ? {} : { band: true }) });
    bandOn = true;
    applyBacking();
    syncToggles();
    if (sheet.classList.contains('open')) renderBand(); else openBand();
    toast(`🥁 ${STYLES[k].name}`);
  }
  function setBandSound(v) {
    // (kept for this exercise; its style's own sound again forgets the choice)
    const chosen = { ...S.bandSounds };
    if (v === styleSound(tpl, bandNow(), isPro())) delete chosen[tpl.id]; else chosen[tpl.id] = v;
    saveSettings({ bandSounds: chosen });
    applyBacking();
    if (sheet.classList.contains('open')) renderBand(); else openBand();
    toast(`Chords: ${soundName(v)}`);
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
    if (!preview) updateProgress(tpl.id, { label: labelMode });
    toast(labelMode === 'hide' ? 'No dots: only the sound and the strip' : `Dot labels: ${LABELS[(i + 1) % LABELS.length][1].toLowerCase()}`);
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
  // ✓ Cleared: the choice playing (the value of the exercise's main option: Major pentatonic, or the exercise itself
  // when it has none) once a full loop on it reached the goal, here, in the Library or the session, or in a lesson
  // step; 🏅 the app masters the exercise once enough choices are cleared, and it counts everywhere (mastery.js;
  // user, 2026-11-02: "user manually say that an exercise is cleared, mastered set automatic")
  /** Does the choice playing count for the mastery (not one an "only" choice holds, as E and A strings)? */
  const countsHere = () => { const v = choiceOf(tpl.id, p); return choicesOf(tpl.id).includes(v) || mainOf(tpl.id)?.all === v; };
  // (no ✓ Cleared under ⋯ where it cannot be earned or another tick does its job, QA round 23: in a lesson step its
  // own ✓ Cleared clears the choice; a drill's tap mode plays no loop, so its play mode clears it)
  function noCleared() { return (!!lesson && !demo) || (TAP && !!TAP_DRILL); }
  function toggleCleared() {
    const m = mainOf(tpl.id);
    const v = choiceOf(tpl.id, p), name = choiceName(tpl.id, v);
    const what = name || 'this exercise';
    if (m?.game) { closeMore(); tip(`🎯 ${what}: 8 of 10 or more clears it on its own. Every ${(tpl.params?.[m.by]?.label || 'mode').toLowerCase()} cleared: 🏅 mastered.`); return; }
    if (!countsHere()) {
      const need = choicesOf(tpl.id).map((x) => choiceName(tpl.id, x)).filter(Boolean).join(', ');
      closeMore();
      tip(`${what} is a step on the way: ${need} clears this exercise.`);
      return;
    }
    const was = isMastered(tpl.id);
    if (isCleared(tpl.id, v)) {
      setCleared(tpl.id, v, false);
      toast(`${what}: not cleared${was && !isMastered(tpl.id) ? ' · 🏅 taken back' : ''}`);
      syncToggles();
      return;
    }
    const g = goalOf(tpl.id, v);
    const inLesson = lesson && !demo && (g ? stepState(L.id, LI).best >= g.bpm && (g.sub == null || (LS.sub ?? g.sub) >= g.sub) : stepState(L.id, LI).loops > 0);
    if (!goalMet(tpl.id, v) && !inLesson) {
      closeMore(); // (the tip sits where the menu was: QA round 19)
      tip(`🎯 To clear ${what}: ${g ? `a full loop at ${masteryGoal(tpl.id, v)}` : 'one full loop'}, then ✓ Cleared`);
      return;
    }
    setCleared(tpl.id, v, true);
    const c = clearedCount(tpl.id);
    toast(!was && isMastered(tpl.id) ? `🏅 Mastered: it counts in the Library and the course` : `✓ ${what} cleared${c.of > 1 ? ` · ${c.done} of ${c.need} for 🏅` : ''}`, 2600);
    syncToggles();
  }
  /** 🏅 under ⋯: the mastery taken back, with its ✓ Cleared ticks (user, 2026-11-02). */
  function unmasterAsk() {
    if (!isMastered(tpl.id)) return;
    if (!confirm('Take back 🏅 Mastered? Its ✓ Cleared ticks go too, in the Library and the course.')) return;
    setMastered(tpl.id, false);
    toast('🏅 taken back');
    syncToggles();
  }
  function syncToggles() {
    loopBtn.classList.toggle('on', player.loop);
    metroBtn.classList.toggle('on', player.metro);
    soundBtn.classList.toggle('on', player.sound);
    soundBtn.innerHTML = icon(player.sound ? 'sound' : 'mute');
    trainerBtn.classList.toggle('on', player.trainer.on);
    doneBtn.classList.toggle('on', isCleared(tpl.id, choiceOf(tpl.id, p)));
    doneBtn.closest('.mi').hidden = noCleared();
    masteredBtn.closest('.mi').hidden = !isMastered(tpl.id);
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
    na(backingBtn, !canBack || !!player.band);
    na(metroBtn, !!player.band);
    if (player.band) { backingBtn.textContent = 'Band'; backingBtn.classList.add('on'); }
    bandIco.classList.toggle('on', !!player.band);
    beatRow.title = BANDS
      ? (player.band ? `Band: ${STYLES[player.band.key].name}, ${soundName(player.band.sound)} (tap: the click instead)` : 'The click (tap: the band, drums and chords)')
      : (player.metro ? 'Click on (tap: off)' : 'Click off (tap: on)');
    beatRow.setAttribute('aria-label', beatRow.title);
    beatRow.classList.toggle('quiet', !BANDS && !player.metro);
    bandBtn.classList.toggle('on', !!player.band);
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
        ? `Goal: a full loop from the first note at ${LS.goal} BPM or faster${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}. Then tick ✓ Cleared if it really was clean: every note in time, even and clear.`
        : TAP ? 'Goal: a set of 10 with 8 or more right. The step ticks itself.' : 'Goal: one full round from the first note. Then tick ✓ if you named (or sang) every answer before it appeared.'}</p>`;
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
        ${TAP ? `<h4>How it works</h4>
        <ul>
          <li>▶ starts a set of 10 questions: tap each answer on the neck, in any octave unless the question names a place.</li>
          <li>‹ › look back over the answers given; a wrong one shows where the note was.</li>
          <li>${tpl.game || TAP_DRILL?.kind === 'ear' ? '8 right clears the choice you are playing' : 'The score is yours to beat; the exercise is cleared in play mode'}${TAP_DRILL && !lesson ? ' · 👆 beside › switches to play mode, the rounds played along' : ''}.</li>
        </ul>` : `<h4>How to practise it</h4>
        <ul>
          <li>Step through it first with ◀ ▶ and say each note or degree out loud.</li>
          <li>Loop it at a tempo where it is effortless (about 60–70% of your limit). Raise 4 BPM after 3 clean loops, or switch on the speed trainer.</li>
          <li>${esc(varyTip)}</li>
        </ul>
        <h4>Colours</h4>
        <div class="legend">${legend.map(([k, n, c]) => `<span><i style="background:${c}${k === 'root' ? ';border-radius:3px' : ''}"></i>${n}</span>`).join('')}</div>
        <p class="muted small" style="margin-top:8px">A dot labelled → is an approach note: a passing note that leads into the next chord tone.</p>`}
        ${tpl.source ? `<h4>Related</h4><p class="muted small">${esc(tpl.source)}</p>` : ''}
        <h4>Your progress</h4>
        <p class="muted">${pr.plays ? `${pr.plays} loops played · best ${pr.bestBpm || '–'} BPM` : 'Not played yet.'}${masteryLine()}</p>
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
    playBtn.setAttribute('aria-label', armed ? 'Record the take' : running ? 'Stop the take' : TAP ? (inst?.tap?.kind === 'ear' && tapAt >= 0 && tapAt < asks().length ? 'Hear it again (space)' : 'Start a new set (space)') : 'Play / pause (space)');
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
    Object.assign(player, { loop: false, sound: false, metro: true, countIn: true, harmony: null, band: null });
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
            '✓ The app\'s ear is kept beside your own ✓ Cleared: tick that one yourself when it felt clean',
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

  // ------------------------------------------------------------ tap mode (the games and the tap drills)
  // In the regular exercise screen (user, 2026-10-30, the reading game: "keep the regular staff notation score sheet,
  // reveal note by note, green success, red failed match… start with the regular play button and navigate step by
  // step… to go backwards, what will reveal the positions of previous notes; BPMs, beats… hidden"; 2026-11-02: "make
  // it extensive to other similar exercises", the ear games, the reading drills and the note-finding drills). ▶ starts
  // a set: a game's or a note-finding drill's rounds (curriculum/games.js `tapSet`), a reading drill's own line (`tapBuild`).
  // Each question in turn: 'read' shows its note on the staff, 'ear' plays it (▶ again: hear it again) with its root or
  // open string on the neck, 'find' names it. A tap on the neck answers (the pitch, or the note in any octave for a
  // name, within its frets and strings; every place when asked), the note on the staff shows green or red and the next
  // comes by itself; ‹ › go back over the questions answered, showing where each one is. The end card is the games'.
  const TAP_HI = 12;      // the neck shown: frets 0–12 (a drill asking higher shows more)
  let tapAt = -1;         // the question asked (in inst.tap.asks; -1 before ▶, their number once all are answered)
  let tapView = -1;       // the question in view (‹ › go back over the ones answered)
  let tapRes = [];        // per question answered: { ok, wrong: { s, f, midi } | null }
  let tapHits = new Map();// the places found so far ("s:f" → its label), when every place or several notes are asked
  let tapBusy = false;    // an answer's feedback is showing
  let tapTimer = null;
  let tapSounds = [];     // the question's notes still to sound (a new question, a new set or leaving stops them)
  let tapListening = false;
  const asks = () => inst?.tap?.asks || [];
  const askOf = (step) => asks().findIndex((a) => a.i === step);
  const tapName = (n) => T.noteName(n, S.notation);
  const tapScore = () => tapRes.filter((r) => r?.ok).length;
  /** A tap set: a game's rounds, a note-finding drill's, or a reading drill's own line (its notes asked one by one). */
  function tapBuild() {
    if (tpl.game) return tapSet(tpl.game, p, ctx, S);
    if (TAP_DRILL.round) return tapSet(TAP_DRILL, p, ctx, S);
    const b = tpl.build(p, ctx, S);
    const list = [];
    // (a drill in a position or on a string is answered there: its area, the same note elsewhere a hint)
    const ar = areaFor(b);
    const lim = ar ? { lo: ar.lo, ...(ar.hi < 99 ? { hi: ar.hi } : {}), ...(ar.strings ? { strings: ar.strings } : {}) } : {};
    b.steps.forEach((st, i) => {
      const n = st.notes?.[0];
      if (n && !st.rest && !st.silent) list.push({ i, answer: { midi: n.play ?? n.midi, n: n.n, label: '', say: '', ...lim } });
    });
    const hi = Math.max(TAP_HI, ...b.steps.flatMap((st) => (st.notes || []).map((n) => n.f ?? 0)));
    return Object.assign(b, { view: 'staff', reveal: 'quiz', noPrompt: true, tap: { kind: 'read', hi, asks: list } });
  }
  /** The places that answer question j: its pitch (or its note in any octave) within its frets and strings. */
  function tapPlaces(j) {
    const a = asks()[j]?.answer;
    if (!a) return [];
    const hi = a.hi ?? inst.tap.hi ?? TAP_HI, lo = a.lo ?? 0;
    // (several notes asked, `multi`: each in any octave)
    const pcs = a.multi ? a.multi.map((x) => x.pc) : [a.pc];
    let pl = a.midi != null && !a.multi ? placesOf(a.midi, ctx, hi)
      : ctx.tuning.flatMap((o, s) => Array.from({ length: hi + 1 }, (_, f) => ({ s, f })).filter((q) => pcs.some((pc) => T.mod(o + q.f - pc, 12) === 0)));
    pl = pl.filter((q) => q.f >= lo);
    if (a.strings) pl = pl.filter((q) => a.strings.includes(q.s));
    if (a.not) pl = pl.filter((q) => !a.not.some((x) => x.s === q.s && x.f === q.f));
    return pl;
  }
  function tapHush() {
    for (const t of tapSounds) clearTimeout(t);
    tapSounds = [];
    tapListening = false;
  }
  function tapReset() {
    clearTimeout(tapTimer);
    tapHush();
    tapAt = -1;
    tapView = -1;
    tapRes = [];
    tapHits = new Map();
    tapBusy = false;
    tapEndEl.hidden = true;
  }
  /** ▶: a new set, its first question asked; in an ear set under way, the question in view heard again. */
  function tapPlay() {
    if (inst.tap?.kind === 'ear' && tapAt >= 0 && tapAt < asks().length) { tapListen(tapView >= 0 ? tapView : tapAt); return; }
    tapStart();
  }
  /**
   * The part of the neck an exercise uses (user, 2026-11-04: "for all those exercises that use just an area of the
   * fretboard"): its zone or its frets and strings (`area` from its build), widened to every note it plays, so nothing
   * it plays is ever greyed; none for an exercise that uses the whole neck.
   */
  function playArea() { return areaFor(inst); }
  /**
   * A line's area (user, 2026-11-04: "all exercises that need to grey out areas"): its own `area` or zone; else one
   * string when the exercise is played on the string chosen (a String option: the other strings greyed); else the
   * frets of its position (a Position option, not "All"); none for the rest. Widened to every note the line plays.
   */
  function areaFor(line) {
    const ns = line.steps.flatMap((st) => (st.rest ? [] : (st.notes || []).filter((n) => !n.held)));
    if (!ns.length) return null;
    const fr = ns.map((n) => n.f), used = [...new Set(ns.map((n) => n.s))];
    const z = line.area || (line.zone ? { lo: line.zone[0] <= 1 ? 0 : line.zone[0], hi: line.zone[1] } : null)
      || (tpl.params?.string ? { lo: 0, hi: 99, strings: used }
        : tpl.params?.pos && p.pos !== 'all' ? { lo: Math.min(...fr) <= 1 ? 0 : Math.min(...fr), hi: Math.max(...fr) } : null);
    if (!z) return null;
    return { lo: Math.min(z.lo ?? 0, ...fr), hi: Math.max(z.hi ?? 24, ...fr), strings: z.strings ? [...new Set([...z.strings, ...used])] : null };
  }
  /** A tap question's own area: the frets and strings its answer may be tapped in. */
  function tapArea(a) {
    if (!a || (a.hi == null && !a.lo && !a.strings)) return null;
    return { lo: a.lo ?? 0, hi: a.hi ?? inst.tap?.hi ?? TAP_HI, strings: a.strings || null };
  }
  function tapStart() {
    rebuild();
    A.audioCtx();
    logPlaying(true, { idleMin: 5 });
    tapAsk(0);
  }
  function tapAsk(j) {
    tapAt = j;
    tapHits = new Map();
    tapShow(j);
    syncPlayBtn();
    if (inst.tap.kind === 'ear') tapListen(j);
  }
  /** An ear question sounds (its notes one after another), then asks for the tap. */
  function tapListen(j) {
    tapHush();
    const ask = asks()[j];
    if (!ask?.play?.length) return;
    tapListening = true;
    if (j === tapAt && !tapRes[j]) promptEl.innerHTML = '🎧 Listen…';
    let last = 0;
    for (const n of ask.play) {
      tapSounds.push(setTimeout(() => A.playNote(n.midi, A.now() + 0.01, n.dur, 0.85), n.at * 1000));
      last = Math.max(last, n.at);
    }
    tapSounds.push(setTimeout(() => {
      tapListening = false;
      if (tapAt === j && tapView === j && !tapRes[j]) promptEl.innerHTML = tapAskText(ask);
    }, last * 1000 + 250));
  }
  /** What the screen asks: tap the note read, heard or named (its name, big, for a note-finding drill). */
  function tapAskText(ask) {
    const kind = inst.tap.kind, all = ask.answer.all;
    // (a theory round asks in words, "the 3rd of E♭7": content QA G17, 2026-11-03)
    if (ask.q) return `tap ${ask.q}`;
    if (kind === 'ear') return tapListening ? '🎧 Listen…' : `👆 tap ${ask.answer.multi ? 'its notes' : 'it'} <small>· ▶ hear it again</small>`;
    if (kind === 'find') return `find <b>${esc(tapName(ask.answer.n))}</b>${all ? ' · every place' : ''}`;
    return all ? 'tap <b>every place</b>, to the 12th fret' : 'tap it on the neck';
  }
  /** The staff: the notes not asked yet hidden (the one asked too, when it is heard or named), the ones answered green or red. */
  function decorateStaff(root = tabEl) {
    const list = asks(), kind = inst?.tap?.kind;
    // (a note-finding drill writes its answers on the staff: no empty staff before the first, QA round 23)
    tabEl.classList.toggle('tap-empty', kind !== 'read' && !tapRes.some(Boolean));
    const at = tapAt < 0 ? -1 : tapAt >= list.length ? Infinity : list[tapAt].i;
    const index = new Map(list.map((a, j) => [a.i, j]));
    for (const g of root.querySelectorAll('.sn[data-i]')) {
      const i = Number(g.dataset.i), j = index.get(i), r = j != null ? tapRes[j] : null;
      g.classList.toggle('tap-hidden', tapAt < 0 || i > at || (kind !== 'read' && j === tapAt && !r));
      g.classList.toggle('tap-ok', !!r?.ok);
      g.classList.toggle('tap-no', !!r && !r.ok);
    }
  }
  const foundDots = (name, fx = null) => [...tapHits].map(([k, label]) => {
    const [s, f] = k.split(':').map(Number);
    return { s, f, label: label ?? name, color: 'none', state: 'current', ...(fx ? { fx } : {}) };
  });
  /** One place for each note of a several-notes answer, near the reference (the root shown): where to show them. */
  function multiPlaces(ask) {
    const ref = ask.refs?.[0];
    return ask.answer.multi.map((x) => {
      const pl = ctx.tuning.flatMap((o, s) => Array.from({ length: 13 }, (_, f) => ({ s, f })).filter((q) => T.mod(o + q.f - x.pc, 12) === 0));
      const near = pl.sort((a, b) => (ref ? Math.abs(a.f - ref.f) + Math.abs(a.s - ref.s) * 1.5 - (Math.abs(b.f - ref.f) + Math.abs(b.s - ref.s) * 1.5) : a.f - b.f))[0];
      return near ? { ...near, label: x.deg } : null;
    }).filter(Boolean);
  }
  /** What the neck shows with a question: its root, its open string, the note given (a unison's). */
  const refDots = (ask) => (ask.refs || []).map((x) => ({ s: x.s, f: x.f, label: x.label, color: x.root ? 'root' : 'none', state: 'static' }));
  const tapCount = (j) => `${j + 1}/${asks().length} · ✓ ${tapScore()}`;
  /** Question j in view: the one asked (its references and the places found), or one answered (its places, and a wrong tap). */
  function tapShow(j) {
    tapView = j;
    const list = asks();
    cur = j < 0 ? -1 : list[j].i;
    tab.setCurrent(cur);
    // (before ▶ the first question's area: the options set it)
    fb.setOutside(tapArea(list[Math.max(0, j)]?.answer));
    if (j < 0) {
      fb.setDots([]);
      nowEl.innerHTML = `<span class="cnt">ready · ${list.length} ${inst.tap?.kind === 'read' ? 'notes' : 'questions'} · ▶ to start</span>`;
      promptEl.innerHTML = '';
      decorateStaff();
      return;
    }
    const ask = list[j], r = tapRes[j], name = ask.answer.title ?? tapName(ask.answer.n);
    const what = ask.ask ? ` · ${esc(ask.ask)}` : '';
    if (!r) {
      fb.setDots([...refDots(ask), ...foundDots(name)]);
      nowEl.innerHTML = `<span class="cnt">${tapCount(j)}${what}</span>`;
      promptEl.innerHTML = tapAskText(ask);
    } else {
      fb.setDots([
        ...refDots(ask),
        ...(r.wrong ? [{ s: r.wrong.s, f: r.wrong.f, label: tapName(spellMidi(r.wrong.midi)), color: 'sixth', state: 'static' }] : []),
        ...(ask.answer.multi ? multiPlaces(ask).map((q) => ({ s: q.s, f: q.f, label: q.label, color: 'none', state: 'current' }))
          : tapPlaces(j).map((q) => ({ s: q.s, f: q.f, label: name, color: 'none', state: 'current' }))),
      ]);
      nowEl.innerHTML = `<span class="cnt">${j + 1}/${list.length} · ${r.ok ? '✓' : '✗'} ${esc(name)}${what}</span>`;
      promptEl.innerHTML = tapVerdict(ask, r);
    }
    decorateStaff();
  }
  function tapVerdict(ask, r) {
    const name = ask.answer.title ?? tapName(ask.answer.n), say = ask.answer.say ? ` · ${esc(ask.answer.say)}` : '';
    if (r.ok) return `<b class="tap-ok">✓ ${esc(name)}</b>${say}`;
    // (the right note in another octave says so, not "✗ C, not C": QA round 23)
    const d = r.wrong && ask.answer.midi != null ? r.wrong.midi - ask.answer.midi : null;
    const oct = d && d % 12 === 0 ? d / 12 : 0;
    const why = oct ? `: that ${esc(name)} is ${Math.abs(oct) > 1 ? `${Math.abs(oct)} octaves` : 'an octave'} too ${oct > 0 ? 'high' : 'low'}`
      : r.wrong ? `, not ${esc(tapName(spellMidi(r.wrong.midi)))}` : '';
    return `<b class="tap-no">✗ ${esc(name)}</b>${why}${say}`;
  }
  /** A tap on the neck: the note sounds; on the question asked, it answers. */
  function tapAnswer(s, f) {
    const midi = ctx.tuning[s] + f;
    A.playNote(midi, A.now() + 0.01, 0.7, 0.7);
    fb.pluck(s, 'none');
    const list = asks();
    if (tapAt < 0 || tapAt >= list.length || tapBusy || tapView !== tapAt || tapListening) return;
    const ask = list[tapAt], a = ask.answer, name = a.title ?? tapName(a.n), places = tapPlaces(tapAt);
    if (a.not?.some((x) => x.s === s && x.f === f)) { promptEl.innerHTML = 'That is the note shown: tap it on another string'; return; }
    // several notes asked (a chord's 3rd, 5th and 7th): each counts once, in any octave; a note that is none of them
    // is wrong (and the root shown, or one found already, does nothing)
    if (a.multi) {
      const k = a.multi.findIndex((x) => T.mod(midi - x.pc, 12) === 0);
      const refHit = ask.refs?.some((x) => T.mod(midi - x.midi, 12) === 0);
      if (k >= 0 && ![...tapHits.values()].includes(a.multi[k].deg)) {
        tapHits.set(`${s}:${f}`, a.multi[k].deg);
        if (tapHits.size < a.multi.length) {
          fb.setDots([...refDots(ask), ...foundDots(name)]);
          promptEl.innerHTML = `✓ ${tapHits.size} of ${a.multi.length}: tap the other${a.multi.length - tapHits.size > 1 ? 's' : ''}`;
          return;
        }
        tapRes[tapAt] = { ok: true, wrong: null };
        fb.setDots([...refDots(ask), ...foundDots(name, 'win')]);
        promptEl.innerHTML = tapVerdict(ask, tapRes[tapAt]);
        tapNext(1500);
      } else if (k >= 0 || refHit) {
        promptEl.innerHTML = refHit ? 'That is the root: tap the chord\'s other notes' : 'Found already: tap the others';
        return;
      } else {
        tapRes[tapAt] = { ok: false, wrong: { s, f, midi } };
        fb.setDots([
          ...refDots(ask),
          { s, f, label: tapName(spellMidi(midi)), color: 'sixth', state: 'static', fx: 'miss' },
          ...multiPlaces(ask).map((q) => ({ s: q.s, f: q.f, label: q.label, color: 'none', state: 'current' })),
        ]);
        promptEl.innerHTML = tapVerdict(ask, tapRes[tapAt]);
        // (the chord sounds again, so the ear hears what it was)
        (ask.play || []).forEach((x) => tapSounds.push(setTimeout(() => A.playNote(x.midi, A.now() + 0.01, x.dur, 0.8), 450 + x.at * 1000)));
        tapNext(3200);
      }
      nowEl.innerHTML = `<span class="cnt">${tapCount(tapAt)}${ask.ask ? ` · ${esc(ask.ask)}` : ''}</span>`;
      decorateStaff();
      return;
    }
    // the right note outside the strings or frets asked is not wrong: it says where to tap, nothing counted (user,
    // 2026-11-04: the E at the A string's 7th fret, frets 0–5 asked, read "✗ E, not E")
    const rightNote = a.midi != null ? midi === a.midi : a.pc != null && T.mod(midi - a.pc, 12) === 0;
    const hasArea = a.midi == null || !!a.strings || a.hi != null || !!a.lo;
    if (rightNote && hasArea && !places.some((q) => q.s === s && q.f === f)) {
      // (the note tapped shows where it was, in black and white: right, but not where asked; user, 2026-11-04)
      fb.setDots([...refDots(ask), ...foundDots(name), { s, f, label: name, color: 'mono', state: 'static', fx: 'mono' }]);
      const str = (k) => T.noteName(T.N(ctx.names[k]), S.notation);
      promptEl.innerHTML = a.strings && !a.strings.includes(s)
        ? `That ${esc(name)} is on the ${esc(str(s))} string: tap it on the ${esc(a.strings.map(str).join(' or '))} string`
        : `That ${esc(name)} is at fret ${f}: tap one in frets ${a.lo ?? 0}–${a.hi ?? inst.tap.hi ?? TAP_HI}`;
      return;
    }
    // (the pitch asked anywhere on the neck counts, a fret higher than the ones shown too)
    const ok = places.some((q) => q.s === s && q.f === f) || (a.midi != null && midi === a.midi && !a.strings && !a.all);
    if (ok) {
      tapHits.set(`${s}:${f}`, name);
      if (a.all && tapHits.size < places.length) {
        fb.setDots([...refDots(ask), ...foundDots(name)]);
        promptEl.innerHTML = `✓ ${tapHits.size} of ${places.length}: find the other${places.length - tapHits.size > 1 ? 's' : ''}`;
        return;
      }
      tapRes[tapAt] = { ok: true, wrong: null };
      fb.setDots([...refDots(ask), ...foundDots(name, 'win')]);
      promptEl.innerHTML = tapVerdict(ask, tapRes[tapAt]);
      tapNext(inst.tap.kind === 'ear' ? 1300 : 900);
    } else {
      tapRes[tapAt] = { ok: false, wrong: { s, f, midi } };
      fb.setDots([
        ...refDots(ask),
        { s, f, label: tapName(spellMidi(midi)), color: 'sixth', state: 'static', fx: 'miss' },
        ...places.map((q) => ({ s: q.s, f: q.f, label: name, color: 'none', state: 'current' })),
      ]);
      promptEl.innerHTML = `${tapVerdict(ask, tapRes[tapAt])}${places.length > 1 && !a.all ? ` · here in ${places.length} places` : ''}`;
      // (the right note sounds: a name's lowest place)
      const right = a.midi ?? (places[0] ? ctx.tuning[places[0].s] + places[0].f : a.show);
      tapSounds.push(setTimeout(() => A.playNote(right, A.now() + 0.01, 1.1, 0.85), 450));
      tapNext(2400);
    }
    nowEl.innerHTML = `<span class="cnt">${tapCount(tapAt)}${ask.ask ? ` · ${esc(ask.ask)}` : ''}</span>`;
    decorateStaff();
  }
  function tapNext(ms) {
    tapBusy = true;
    tapTimer = setTimeout(() => {
      tapBusy = false;
      const j = tapAt + 1;
      // (a preview: its first question only, then what Pro opens; nothing more answers until ▶)
      if (preview) { tapBusy = true; tapHush(); logPlaying(false); previewEnd(); return; }
      if (j >= asks().length) { tapAt = j; tapHush(); decorateStaff(); tapEnd(); return; }
      tapAsk(j);
    }, ms);
  }
  /** ‹ ›: back over the questions answered, and forward to the one asked. */
  function tapNav(d) {
    if (tapAt < 0) return;
    const last = Math.min(tapAt, asks().length - 1);
    const j = Math.max(0, Math.min(last, (tapView < 0 ? 0 : tapView) + d));
    if (j !== tapView) tapShow(j);
  }
  function tapSeek(step) {
    const j = askOf(step);
    if (tapAt >= 0 && j >= 0 && j <= Math.min(tapAt, asks().length - 1)) tapShow(j);
  }
  /** The set's end: the games' card (stars, Again, Harder; a game's 8 of 10 clears the mode, every mode masters it). */
  function tapEnd() {
    logPlaying(false);
    const total = asks().length, score = tapScore();
    const pr = getProgress(tpl.id) || {};
    const game = !!tpl.game;
    // (an ear drill in tap mode scores as a game does: 8 of 10 clears the choice played; QA round 24)
    const scored = game || TAP_DRILL?.kind === 'ear';
    const record = game && (pr.best == null || score > pr.best);
    if (!preview) updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, ...(game ? { best: Math.max(pr.best ?? 0, score) } : {}), ...keep() });
    const v = choiceOf(tpl.id, p), was = isCleared(tpl.id, v), wasM = isMastered(tpl.id);
    if (scored && !lesson && !preview) recordGame(tpl.id, v, score, total);
    // (a set played through counts for today's session, a Library row too: QA round 24)
    if (!demo && !preview && (!lesson || presetOk())) routine?.played?.();
    // a lesson step played in tap mode (a game, an ear drill): 8 of 10 passes it and ticks it, the score being the
    // proof (user, 2026-11-03); a set played through counts for today's session
    let stepNews = null;
    if (lesson && !demo && !preview && presetOk()) {
      if (score / total >= 0.8) {
        const was = stepClean(L, LI);
        recordLoop(L, LI, 0);
        visitPassed = true;
        const complete = !reviewing && !was && setClean(L, LI, true);
        stepNews = reviewing ? `✓ ${score} of ${total}: tap ✓ Still got them? to finish the review` : complete ? `✓ Step passed · ${lessonName} complete` : '✓ Step passed';
        if (complete && nextBtn && !routine) { lessonDone = true; nextBtn.classList.add('primary'); nextBtn.replaceChildren('Done ›'); nextBtn.title = 'Back to the lesson'; }
        else if (nextBtn && !routine) nextBtn.classList.add('primary');
      } else stepNews = '8 of 10 passes this step';
      syncGoal();
    }
    const c = clearedCount(tpl.id);
    // (a choice that does not count for 🏅, a drill's easier set, says which does)
    const counts = choicesOf(tpl.id).includes(String(v));
    const news = stepNews ?? (!scored ? null : !wasM && isMastered(tpl.id) ? `🏅 Mastered${game ? ': every mode cleared' : ''}`
      : !counts ? `🏅 asks for 8 of 10 on ${choicesOf(tpl.id).map((x) => choiceName(tpl.id, x)).join(', ')}`
        : !was && isCleared(tpl.id, v) ? `✓ ${choiceName(tpl.id, v) || 'Cleared'}${c.need > 1 ? ` cleared · ${c.done} of ${c.need}` : ''}`
          : isCleared(tpl.id, v) ? null : `8 of 10 clears ${choiceName(tpl.id, v) || 'it'}`);
    const stars = score >= total ? '★★★' : score >= total - 2 ? '★★☆' : score >= total / 2 ? '★☆☆' : '☆☆☆';
    // (a game: the next choice of the first option, a harder set, when there is one)
    const [k0, def0] = Object.entries(tpl.params || {})[0] || [];
    const opts0 = game && def0 ? paramOptions(def0, S, p) : [];
    const harder = opts0[opts0.findIndex((o) => o[0] === p[k0]) + 1];
    syncToggles();
    tapEndEl.replaceChildren(h('div', { class: 'game-card' },
      h('div', { class: 'game-stars' }, stars),
      h('h2', {}, `${score} of ${total}`),
      game && pr.best != null ? h('p', { class: 'muted' }, record ? 'A new best score' : `Best ${pr.best} of ${total}`) : null,
      news ? h('p', { class: 'game-news' }, news) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn primary', onClick: () => tapStart() }, '↻ Again'),
        harder && !lesson && score >= total - 2 ? h('button', { class: 'btn', onClick: () => { p[k0] = harder[0]; renderParams(); if (!lesson && !preview) updateProgress(tpl.id, keep()); tapStart(); } }, `Harder: ${harder[1]}`) : null,
        h('button', { class: 'btn', onClick: () => { tapEndEl.hidden = true; tapShow(total - 1); } }, '‹ Look back'))));
    tapEndEl.hidden = false;
  }
  /** 👆 on a tap drill: tap mode on or off (kept per exercise; never in a lesson or a demo). */
  function setTap(on) {
    if (!TAP_DRILL || lesson || demo || on === TAP) return;
    player.stop(true);
    tapReset();
    TAP = on;
    if (!preview) updateProgress(tpl.id, { tapOn: on });
    // (play mode gets the player's own reveal back; the drill's own, if it has one, comes with its line)
    if (!on) reveal = S.reveal;
    applyTapUi();
    rebuild();
    renderParams();
    syncToggles();
    toast(on ? '👆 Tap mode: ▶ asks the notes one by one, tap each on the neck' : '▶ Play mode: play along on your bass');
  }
  /** The controls tap mode has no use for (tempo, beats, loop, the ⋯ items but ✓ Cleared and 🏅) hide in it. */
  function applyTapUi() {
    for (const el of [tempo, loopBtn, beatRow, ...ctrl.querySelectorAll(':scope > .sep')]) el.hidden = TAP;
    for (const el of morePop.children) if (!el.contains(doneBtn) && !el.contains(masteredBtn)) el.hidden = TAP;
    doneBtn.closest('.mi').hidden = noCleared();
    if (!TAP) tabEl.classList.remove('tap-empty');
    tapBtn.hidden = !TAP_DRILL || !!lesson || demo;
    tapBtn.classList.toggle('on', TAP);
    tapBtn.title = TAP ? '▶ Play mode: play along on your bass' : '👆 Tap mode: the notes one by one, tap them on the neck';
    tapBtn.setAttribute('aria-label', tapBtn.title);
  }

  /** The drawer's mastery: 🏅, or how many choices are cleared and what clears one. */
  function masteryLine() {
    if (isMastered(tpl.id)) return ' · <b style="color:var(--good)">🏅 mastered</b>';
    const c = clearedCount(tpl.id), m = mainOf(tpl.id);
    if (m?.game) return ` · 🎯 to master it: 8 of 10 in each mode (${c.done} of ${c.need} cleared)`;
    const v = choiceOf(tpl.id, p), how = `${goalOf(tpl.id, v) ? `a full loop at ${esc(masteryGoal(tpl.id, v))}` : 'one full loop'}, then ✓ Cleared`;
    // (each choice has its own goal: the line names the one playing, QA round 23)
    if (c.of < 2) return ` · 🎯 to master it: ${how}`;
    return ` · 🎯 to clear ${esc(choiceName(tpl.id, v) || 'this choice')}: ${how} (each choice has its own 🎯; ${c.done} of ${c.need} cleared for 🏅)`;
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
    // (the keys sleep behind a picker, as in the room; Escape still closes the sheet: QA round 23)
    if (history.state?.picker) return;
    if (sheet.classList.contains('open') && e.key !== 'Escape') return;
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
    clearTimeout(tapTimer);
    tapHush();
    if (TAP) logPlaying(false);
    if (rec) { const r = rec; rec = null; r.take?.stop({ keep: false }); A.setAudioOptions({ recClick: false, clickVol: S.clickVol }); }
    listening?.stop();
    closePicker?.();
    // (the Backing's own level again, after the band's)
    if (player.band) A.setAudioOptions({ padVol: 1 });
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
