// Exercise player screen: fretboard with step-by-step dots, tab strip and transport.
import { h, icon, toast, esc } from './dom.js';
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
import { recordLoop, rememberTempo, stepState, stepPassed, stepClean, setClean, isDue, isComplete, reviewed } from '../course/progress.js';

// what a lesson step's goal tempo counts in ("goal 96 BPM in 8ths")
export const SUB_NAMES = { 0.25: 'whole notes', 0.5: 'half notes', 1: 'quarter notes', 2: '8ths', 3: 'triplets', 4: '16ths', 5: 'quintuplets', 6: 'sextuplets' };
const SUBS = [['0.25', 'Whole'], ['0.5', 'Half'], ['1', '♩ 1/beat'], ['2', '♪ 2/beat'], ['3', '3 triplets'], ['4', '4 16ths'], ['5', '5 quint.'], ['6', '6 sext.']];
const REVEALS = [['gradual', 'Step'], ['full', 'Shape'], ['quiz', 'Quiz']];
const LABELS = [['note', 'Note'], ['degree', 'Deg'], ['finger', 'Fing'], ['none', '—']];
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

export function renderExercise(root, tpl, { params = {}, onBack, routine = null, lesson = null }) {
  const S = settings;
  const prog = getProgress(tpl.id) || {};
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
  let visitPassed = false, passShown = false;
  let alive = true;
  // "Continue" on Home reopens the last exercise opened
  updateProgress(tpl.id, {});
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
  const playBtn = btn('play', 'Play / pause (space)', () => { player.toggle(); }, 'big');
  // all exercise options live behind one clear button (a strip of selects gets cut off on phones)
  const optsSum = h('span', { class: 'opts-sum' });
  const hasParams = Object.keys(tpl.params || {}).length > 0;
  const optsBtn = hasParams ? h('button', { class: 'opts-btn', title: 'Change scale, key, pattern…', onClick: () => (sheet.classList.contains('open') ? closeOptions() : openOptions()) },
    h('span', { class: 'opts-ico', html: icon('sliders') }),
    h('span', { class: 'opts-txt' }, h('small', {}, 'Options · tap to change'), optsSum)) : h('div', { class: 'grow' });
  const sheet = h('div', { class: 'sheet', onClick: (e) => { if (e.target === sheet) closeOptions(); } });
  const lessonName = L ? (L.kind === 'lesson' ? `Lesson ${L.num}` : L.kind === 'check' ? `Checkpoint ${L.num}` : 'Stage test') : '';
  const goalText = () => (LS?.goal ? `goal ${LS.goal} BPM${LS.sub ? ` in ${SUB_NAMES[LS.sub]}` : ''}` : 'one full round');
  const subtitle = L
    ? `${lessonName} · ${demo ? 'demo: listen and watch' : `step ${LI + 1}/${L.steps.length} · ${goalText()}`}`
    : `${mod?.name ?? ''} · Level ${tpl.level} ${lvl ? lvl.name : ''}`;
  const titleEl = h('div', { class: 'exv-title' }, h('b', {}, h('span', { class: 'ex-num' }, tpl.num), tpl.title), h('span', { title: subtitle }, subtitle));
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
  const goalBtn = lesson && !demo ? h('button', { class: 'btn goal-btn', onClick: () => onGoal() }) : null;
  let lessonDone = false; // the lesson was completed in this visit: Next goes back to its page
  const top = h('header', { class: `exv-top${lesson ? ' lesson' : ''}` },
    btn('back', 'Back', () => close()), titleEl, optsBtn, goalBtn, nextBtn,
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
  // (the tip sits low, over the strip, so it never hides the first notes on the neck)
  const stage = h('div', { class: 'exv-stage' }, boardEl, tabEl, tipEl);

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
    if (!lesson) updateProgress(tpl.id, { sub: userSub });
    renderTab();
    syncGoal();
  });
  // shown instead of the subdivision select when the rhythm is part of the exercise (licks, grooves…)
  const rhythmBtn = h('button', { class: 'lbl-btn written', title: 'Why can\'t I change the subdivision?',
    onClick: () => tip('The rhythm is written into this exercise, so the subdivision is fixed. Change the tempo instead.') }, '♪ Written rhythm');
  const loopBtn = btn('loop', 'Loop', () => { player.loop = !player.loop; syncToggles(); });
  const metroBtn = btn('metro', 'Metronome', () => { player.metro = !player.metro; saveSettings({ metro: player.metro }); syncToggles(); });
  const soundBtn = btn('sound', 'Bass sound on/off', () => { player.sound = !player.sound; syncToggles(); });
  const trainerBtn = btn('trainer', 'Speed trainer (+4 BPM each loop)', () => toggleTrainer());
  const doneBtn = btn('check', 'Mark as mastered', () => toggleDone());
  const revealBtn = h('button', { class: 'lbl-btn', title: 'Reveal mode: step by step / whole shape / quiz', onClick: () => cycleReveal() });
  const backingBtn = h('button', { class: 'lbl-btn', title: 'Backing: off / a drone on the root / the chords', onClick: () => cycleBacking() });
  const scoreBtn = h('button', { class: 'lbl-btn', title: 'Under the neck: tab or bass-clef staff', onClick: () => cycleScore() });
  const labelBtn = h('button', { class: 'lbl-btn', title: 'Dot labels: note / degree / finger / none', onClick: () => cycleLabel() });
  // secondary controls: inline on wide screens, in a "⋯" popover on phones (see .more-pop in app.css)
  const item = (el, text) => h('div', { class: 'mi' }, el, h('span', { class: 'mi-l', onClick: () => el.click() }, text));
  const morePop = h('div', { class: 'more-pop' },
    h('div', { class: 'sep' }), item(metroBtn, 'Metronome'), item(soundBtn, 'Bass sound'), item(trainerBtn, 'Speed trainer'),
    item(backingBtn, 'Backing'),
    h('div', { class: 'sep' }), item(revealBtn, 'Reveal'), item(labelBtn, 'Dot labels'), item(scoreBtn, 'Tab / staff'), h('div', { class: 'grow' }), item(doneBtn, 'Mastered'));
  const moreBtn = btn('more', 'More controls', () => toggleMore(), 'more-btn');
  const ctrl = h('footer', { class: 'exv-ctrl' },
    btn('restart', 'Back to start', () => restart()), btn('prev', 'Previous note (←)', () => manual(-1)), playBtn,
    btn('next', 'Next note (→)', () => manual(1)), h('div', { class: 'sep' }), tempo, subSel, rhythmBtn, h('div', { class: 'sep' }),
    loopBtn, morePop, moreBtn);

  const drawer = h('aside', { class: 'drawer' });
  const view = h('div', { class: 'exv' }, top, stage, ctrl);
  root.replaceChildren(view, drawer, sheet);

  const fb = new FretboardView(fbHost, { onTap: (s, f) => tapNote(s, f) });
  const tab = new TabView(tabEl, { onSeek: (i) => { if (player.playing) player.pause(); player.stepTo(i); } });

  const player = new Player({
    onStep: (i) => showStep(i),
    onBeat: (level, beat) => flashBeat(beat),
    onState: (playing) => { playBtn.innerHTML = icon(playing ? 'pause' : 'play'); },
    onLoop: (n, bpm, done) => {
      syncBpm();
      // `done`: the slowest tempo of the loop just played, or null when it did not start on the first
      // note (not a full loop). A lesson step leaves the exercise's own progress alone.
      const played = done;
      if (played != null && !demo) routine?.played?.();
      if (!lesson) {
        const pr = getProgress(tpl.id) || {};
        updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, ...(played != null ? { bestBpm: Math.max(pr.bestBpm || 0, played) } : {}), ...keep(), lastBpm: player.bpm });
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
  // the demo plays once, with the sound on
  if (demo) { player.loop = false; player.sound = true; }
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
          updateProgress(tpl.id, keep());
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
      next = tpl.build(p, ctx, S);
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
    subSel.hidden = !inst.uniform;
    rhythmBtn.hidden = !!inst.uniform;
    if (!labelMode) labelMode = inst.label || tpl.label || S.label;
    if (inst.reveal) reveal = inst.reveal;
    if (!score) score = inst.view || S.score;
    player.load(inst);
    applyBacking();
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lefty: S.lefty, zone: inst.zone || null });
    fb.fit(inst.range[0], inst.range[1], 9);
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
    });
    tab.setCurrent(cur);
  }

  // ------------------------------------------------------------ dots
  function mkDot(n, state) {
    const label = reveal === 'quiz' && state === 'current' ? T.noteName(n.n, S.notation) : noteLabel(n, labelMode, S.notation);
    const color = n.tag === 'x' ? 'ghost' : degKey(n.deg);
    return { s: n.s, f: n.f, label: n.tag === 'x' ? 'x' : label, color, state, tag: n.tag && n.tag !== 'x' ? n.tag : null };
  }

  function showStep(i) {
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
      // a ticked step stays ticked here (a second tap must not undo a lesson): untick it on the lesson page
      tip('Already ticked ✓. To practise this step again from scratch, untick it on the lesson page.');
    } else {
      const complete = setClean(L, LI, true);
      toast(complete ? `${lessonName} complete ✓` : 'Step done ✓', complete ? 3000 : 1800);
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
    if (lesson && !demo) rememberTempo(L, LI, player.bpm);
    else if (!lesson) updateProgress(tpl.id, { lastBpm: player.bpm });
  }
  function syncBpm() {
    bpmRange.value = player.bpm;
    bpmVal.innerHTML = `${player.bpm}<small>BPM</small>`;
  }
  function manual(d) {
    if (player.playing) player.pause();
    player.stepTo(cur < 0 ? (d > 0 ? 0 : inst.steps.length - 1) : cur + d);
  }
  function restart() { player.stop(true); player.cur = 0; showStep(-1); }
  function tapNote(s, f) {
    const midi = ctx.tuning[s] + f;
    A.playNote(midi, A.now() + 0.01, 0.9);
    fb.pluck(s);
  }
  function cycleReveal() {
    const i = REVEALS.findIndex((r) => r[0] === reveal);
    reveal = REVEALS[(i + 1) % REVEALS.length][0];
    if (!inst.reveal) saveSettings({ reveal });
    syncToggles();
    renderTab();
    showStep(cur);
  }
  // a lesson step can bring its own backing (not saved: the player's setting stays as it was)
  let backingOverride = LS?.backing || null;
  const backing = () => backingOverride || S.backing;
  function cycleBacking() {
    const order = ['off', 'drone', 'chords'];
    const was = backing();
    backingOverride = null;
    saveSettings({ backing: order[(order.indexOf(was) + 1) % order.length] });
    applyBacking();
    syncToggles();
    if (S.backing !== 'off' && !player.harmony?.some(Boolean)) tip('This exercise has no chords or scales to back: the backing plays where there are.');
  }
  /** Backing pad: the harmony of each part of the exercise (see harmony.js). */
  // backing belongs to music with harmony: not to hand, time, note-finding, interval or ear drills
  const BACKS = !NO_BACKING.includes(tpl.module);
  function applyBacking() {
    player.harmony = backing() === 'off' || !BACKS ? null : harmonyTrack(inst, backing());
    if (!player.playing) return;
    const hm = player.harmony && harmonyAt(player.harmony, Math.max(0, cur));
    if (hm) A.padSet(hm, A.now() + 0.02); else A.padStop();
  }
  function cycleScore() {
    score = score === 'staff' ? 'tab' : 'staff';
    if (!inst.view) saveSettings({ score });
    syncToggles();
    renderTab();
  }
  function cycleLabel() {
    const i = LABELS.findIndex((r) => r[0] === labelMode);
    labelMode = LABELS[(i + 1) % LABELS.length][0];
    updateProgress(tpl.id, { label: labelMode });
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
  function toggleDone() {
    const pr = getProgress(tpl.id) || {};
    const done = !pr.done;
    updateProgress(tpl.id, done ? { done, bestBpm: Math.max(pr.bestBpm || 0, player.bpm) } : { done });
    toast(done ? `Mastered at ${player.bpm} BPM ✓` : 'Unmarked');
    syncToggles();
  }
  function syncToggles() {
    loopBtn.classList.toggle('on', player.loop);
    metroBtn.classList.toggle('on', player.metro);
    soundBtn.classList.toggle('on', player.sound);
    soundBtn.innerHTML = icon(player.sound ? 'sound' : 'mute');
    trainerBtn.classList.toggle('on', player.trainer.on);
    doneBtn.classList.toggle('on', !!(getProgress(tpl.id) || {}).done);
    revealBtn.textContent = (REVEALS.find((r) => r[0] === reveal) || REVEALS[0])[1];
    backingBtn.textContent = { off: 'Off', drone: 'Drone', chords: 'Chords' }[backing()] || 'Off';
    backingBtn.classList.toggle('on', backing() !== 'off');
    scoreBtn.textContent = score === 'staff' ? 'Staff' : 'Tab';
    labelBtn.textContent = (LABELS.find((r) => r[0] === labelMode) || LABELS[0])[1];
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
        ${tpl.source ? `<h4>Based on</h4><p class="muted small">${esc(tpl.source)}</p>` : ''}
        <h4>Your progress</h4>
        <p class="muted">${pr.plays ? `${pr.plays} loops played · best ${pr.bestBpm || '–'} BPM` : 'Not played yet.'}${pr.done ? ' · <b style="color:var(--good)">mastered</b>' : ''}</p>
      </div>`;
    drawer.querySelector('[data-close]').addEventListener('click', () => drawer.classList.remove('open'));
    drawer.classList.add('open');
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
    if (e.code === 'Space') { e.preventDefault(); player.toggle(); }
    else if (e.code === 'ArrowRight') manual(1);
    else if (e.code === 'ArrowLeft') manual(-1);
    else if (e.key === '+' || e.key === '=') setBpm(player.bpm + 2);
    else if (e.key === '-') setBpm(player.bpm - 2);
    else if (e.key === 'Escape') { drawer.classList.remove('open'); closeOptions(); closeMore(); }
  }
  window.addEventListener('keydown', onKey);

  function close() { onBack?.(); }

  function dispose() {
    alive = false;
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
