// Exercise player screen: fretboard with step-by-step dots, tab strip and transport.
import { h, icon, toast, esc } from './dom.js';
import { settings, saveSettings, getProgress, updateProgress } from '../store.js';
import { makeCtx } from '../fretboard.js';
import { FretboardView, degKey, PALETTE } from '../views/fretboardView.js';
import { TabView } from '../views/tabView.js';
import { Player } from '../player.js';
import * as A from '../audio.js';
import * as T from '../theory.js';
import { moduleOf, LEVELS, defaultParams } from '../curriculum/index.js';
import { CYCLE_OPTS } from '../curriculum/common.js';

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

/** Options for a param (key params are spelled for the current notation). */
export function paramOptions(def, S) {
  if (def.kind === 'key') {
    const opts = T.CHROMATIC_PC.map((pcv) => [String(pcv), T.noteName(T.bestRoot(pcv, def.ivs), S.notation)]);
    return def.cycles ? [...opts, ...CYCLE_OPTS] : opts;
  }
  return def.options;
}

export function renderExercise(root, tpl, { params = {}, onBack, routine = null }) {
  const S = settings;
  const prog = getProgress(tpl.id) || {};
  const p = { ...defaultParams(tpl), ...(prog.params || {}), ...params };
  for (const [k, def] of Object.entries(tpl.params || {})) {
    const valid = paramOptions(def, S).some((o) => o[0] === p[k]);
    if (!valid) p[k] = def.default;
  }
  let ctx = makeCtx(S);
  let inst = null;
  let userSub = prog.sub ?? null;
  let labelMode = prog.label || null;
  let reveal = S.reveal;
  let segStart = [], segEnd = [], chordAt = [], textAt = [];
  let cur = -1;

  document.body.classList.add('in-ex');
  const mod = moduleOf(tpl.module);
  const lvl = LEVELS[tpl.level - 1];

  // ------------------------------------------------------------ layout
  const btn = (name, title, onClick, cls = '') => h('button', { class: `icon-btn ${cls}`, title, 'aria-label': title, html: icon(name), onClick });
  const playBtn = btn('play', 'Play / pause (space)', () => { player.toggle(); }, 'big');
  const paramsEl = h('div', { class: 'exv-params' });
  const titleEl = h('div', { class: 'exv-title' }, h('b', {}, tpl.title), h('span', {}, `${mod?.name ?? ''} · Level ${tpl.level} ${lvl ? lvl.name : ''}`));
  const nextBtn = routine ? h('button', { class: 'btn primary', onClick: () => routine.next() }, 'Next ›') : null;
  const top = h('header', { class: 'exv-top' },
    btn('back', 'Back', () => close()), titleEl, paramsEl, nextBtn,
    btn('tuner', 'Tuner', () => { location.hash = '#/tuner'; }), btn('info', 'About this exercise', () => openDrawer()));

  const boardEl = h('div', { class: 'exv-board' });
  const nowEl = h('div', { class: 'exv-now' });
  const promptEl = h('div', { class: 'exv-prompt' });
  const beatsEl = h('div', { class: 'beat-dots' });
  const fbHost = h('div', { class: 'fb-host' });
  boardEl.append(fbHost, nowEl, promptEl, beatsEl);
  const tabEl = h('div', { class: 'exv-tab' });
  const stage = h('div', { class: 'exv-stage' }, boardEl, tabEl);

  const bpmVal = h('div', { class: 'bpm' });
  const bpmRange = h('input', { type: 'range', min: 30, max: 260, step: 1 });
  bpmRange.addEventListener('input', () => setBpm(Number(bpmRange.value)));
  const tempo = h('div', { class: 'tempo' },
    h('button', { class: 'lbl-btn', onClick: () => setBpm(player.bpm - 2) }, '−'), bpmRange,
    h('button', { class: 'lbl-btn', onClick: () => setBpm(player.bpm + 2) }, '+'), bpmVal);
  const subSel = h('select', { class: 'mini-sel', title: 'Notes per beat' }, SUBS.map(([v, l]) => h('option', { value: v }, l)));
  subSel.addEventListener('change', () => { userSub = Number(subSel.value); player.setSub(userSub); updateProgress(tpl.id, { sub: userSub }); renderTab(); });
  const loopBtn = btn('loop', 'Loop', () => { player.loop = !player.loop; syncToggles(); });
  const metroBtn = btn('metro', 'Metronome', () => { player.metro = !player.metro; saveSettings({ metro: player.metro }); syncToggles(); });
  const soundBtn = btn('sound', 'Bass sound on/off', () => { player.sound = !player.sound; syncToggles(); });
  const trainerBtn = btn('trainer', 'Speed trainer (+4 bpm each loop)', () => toggleTrainer());
  const doneBtn = btn('check', 'Mark as mastered', () => toggleDone());
  const revealBtn = h('button', { class: 'lbl-btn', title: 'Reveal mode: step by step / whole shape / quiz', onClick: () => cycleReveal() });
  const labelBtn = h('button', { class: 'lbl-btn', title: 'Dot labels: note / degree / finger / none', onClick: () => cycleLabel() });
  const ctrl = h('footer', { class: 'exv-ctrl' },
    btn('restart', 'Back to start', () => restart()), btn('prev', 'Previous note (←)', () => manual(-1)), playBtn,
    btn('next', 'Next note (→)', () => manual(1)), h('div', { class: 'sep' }), tempo, subSel, h('div', { class: 'sep' }),
    loopBtn, metroBtn, soundBtn, trainerBtn, h('div', { class: 'sep' }), revealBtn, labelBtn, h('div', { class: 'grow' }), doneBtn);

  const drawer = h('aside', { class: 'drawer' });
  const view = h('div', { class: 'exv' }, top, stage, ctrl);
  root.replaceChildren(view, drawer);

  const fb = new FretboardView(fbHost, { onTap: (s, f) => tapNote(s, f) });
  const tab = new TabView(tabEl, { onSeek: (i) => { if (player.playing) player.pause(); player.stepTo(i); } });

  const player = new Player({
    onStep: (i) => showStep(i),
    onBeat: (level, beat) => flashBeat(beat),
    onState: (playing) => { playBtn.innerHTML = icon(playing ? 'pause' : 'play'); },
    onLoop: (n, bpm) => {
      syncBpm();
      const pr = getProgress(tpl.id) || {};
      updateProgress(tpl.id, { plays: (pr.plays || 0) + 1, bestBpm: Math.max(pr.bestBpm || 0, bpm), params: p, lastBpm: player.bpm });
    },
    onEnd: () => showStep(-1),
  });
  player.bpm = prog.lastBpm || tpl.bpm || 70;
  player.metro = S.metro;
  player.countIn = S.countIn;
  player.clickSubs = S.clickSubs;
  A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol, octaveUp: S.octaveUp, voice: S.voice });

  // ------------------------------------------------------------ params
  function renderParams() {
    paramsEl.replaceChildren();
    for (const [k, def] of Object.entries(tpl.params || {})) {
      const sel = h('select', {}, paramOptions(def, S).map(([v, l]) => h('option', { value: v, selected: v === p[k] }, l)));
      sel.addEventListener('change', () => { p[k] = sel.value; rebuild(); updateProgress(tpl.id, { params: p }); });
      paramsEl.append(h('label', { class: 'psel' }, h('small', {}, def.label), sel));
    }
  }

  function rebuild() {
    const wasPlaying = player.playing;
    ctx = makeCtx(S);
    try {
      inst = tpl.build(p, ctx, S);
    } catch (e) {
      console.error(e);
      toast('Could not build this variation');
      return;
    }
    if (!inst.steps.length) { toast('No notes for this variation'); return; }
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
    player.sub = userSub ?? inst.sub ?? tpl.sub ?? 2;
    subSel.value = String(player.sub);
    subSel.disabled = !inst.uniform;
    if (!labelMode) labelMode = inst.label || tpl.label || S.label;
    if (inst.reveal) reveal = inst.reveal;
    player.load(inst);
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lefty: S.lefty, zone: inst.zone || null });
    fb.fit(inst.range[0], inst.range[1], 9);
    beatsEl.replaceChildren(...Array.from({ length: inst.beatsPerBar || 4 }, () => h('i')));
    renderTab();
    showStep(-1);
    syncToggles();
    if (wasPlaying) player.play();
  }

  function renderTab() {
    tab.render(inst, {
      strings: ctx.tuning.length, beatsOf: (st) => player.beatsOf(st), beatsPerBar: inst.beatsPerBar || 4, sub: player.sub,
      label: (n) => (labelMode === 'none' ? '' : noteLabel(n, labelMode === 'finger' ? 'note' : labelMode, S.notation)),
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
      const k = `${n.s}.${n.f}`;
      const was = map.get(k);
      if (!was || RANK[state] >= RANK[was.state]) map.set(k, mkDot(n, state));
    };
    if (i < 0) {
      if (reveal === 'full') for (let j = 0; j <= (segEnd[0] ?? 0); j++) for (const n of steps[j].notes) put(n, 'future');
      if (reveal !== 'quiz') for (const n of steps[0].notes) put(n, 'next');
      nowEl.innerHTML = chordAt[0] ? `<span class="chord">${esc(chordAt[0])}</span>${textAt[0] ? `<span class="txt">${esc(textAt[0])}</span>` : ''}<span class="cnt">ready · ${steps.length} notes</span>` : `<span class="cnt">ready · ${steps.length} notes</span>`;
      promptEl.innerHTML = reveal === 'quiz' ? promptHtml(0) : '';
      fb.setDots([...map.values()]);
      tab.setCurrent(-1);
      return;
    }
    const s0 = segStart[i], s1 = segEnd[i];
    if (reveal === 'full') for (let j = s0; j <= s1; j++) for (const n of steps[j].notes) put(n, 'future');
    if (reveal !== 'quiz') for (let j = Math.max(s0, i - TRAIL); j < i; j++) for (const n of steps[j].notes) put(n, 'past');
    const nx = i + 1 < steps.length ? i + 1 : (player.loop ? 0 : -1);
    if (nx >= 0 && reveal !== 'quiz') for (const n of steps[nx].notes) put(n, 'next');
    for (const n of steps[i].notes) put(n, 'current');
    fb.setDots([...map.values()]);
    for (const n of steps[i].notes) fb.pluck(n.s, n.tag === 'x' ? 'ghost' : degKey(n.deg));
    tab.setCurrent(i);
    nowEl.innerHTML = `${chordAt[i] ? `<span class="chord">${esc(chordAt[i])}</span>` : ''}${textAt[i] ? `<span class="txt">${esc(textAt[i])}</span>` : ''}<span class="cnt">${i + 1}/${steps.length}</span>`;
    promptEl.innerHTML = reveal === 'quiz' && nx >= 0 ? promptHtml(nx) : '';
  }

  function promptHtml(j) {
    const st = inst.steps[j];
    if (!st || !st.notes.length) return '';
    return `next <b>${st.notes.map((n) => esc(T.noteName(n.n, S.notation))).join(' + ')}</b>`;
  }

  let beatTimer = null;
  function flashBeat(beat) {
    const dots = beatsEl.children;
    for (let k = 0; k < dots.length; k++) dots[k].className = k === beat ? (beat === 0 ? 'on one' : 'on') : '';
    clearTimeout(beatTimer);
    beatTimer = setTimeout(() => { for (const d of dots) d.className = ''; }, 120);
  }

  // ------------------------------------------------------------ actions
  function setBpm(v) { player.setBpm(v); syncBpm(); updateProgress(tpl.id, { lastBpm: player.bpm }); }
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
    showStep(cur);
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
    player.trainer.on = !player.trainer.on;
    if (player.trainer.on) {
      player.trainer.target = Math.min(260, player.bpm + 40);
      player.loop = true;
      toast(`Speed trainer: +${player.trainer.inc} BPM every loop, up to ${player.trainer.target}`);
    }
    syncToggles();
  }
  function toggleDone() {
    const pr = getProgress(tpl.id) || {};
    const done = !pr.done;
    updateProgress(tpl.id, { done, bestBpm: Math.max(pr.bestBpm || 0, player.bpm) });
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
    revealBtn.textContent = REVEALS.find((r) => r[0] === reveal)[1];
    labelBtn.textContent = LABELS.find((r) => r[0] === labelMode)[1];
    syncBpm();
  }

  // ------------------------------------------------------------ info drawer
  function openDrawer() {
    const pr = getProgress(tpl.id) || {};
    const legend = [['root', 'Root (square)'], ['third', '3rd'], ['fifth', '5th'], ['seventh', '7th'], ['sixth', '6th'], ['other', 'Other / passing']].map(([k, n]) => [k, n, PALETTE[k]]);
    drawer.innerHTML = `
      <header><h2>${esc(tpl.title)}</h2><button class="icon-btn" data-close aria-label="Close">${icon('close')}</button></header>
      <div class="body">
        <div class="row" style="margin-bottom:10px"><span class="chip lv lv${tpl.level}">Level ${tpl.level} · ${esc(lvl?.name ?? '')}</span><span class="chip">${esc(mod?.name ?? '')}</span></div>
        ${(tpl.about || '').split('\n\n').map((para) => `<p>${esc(para)}</p>`).join('')}
        ${tpl.tips?.length ? `<h4>Focus points</h4><ul>${tpl.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
        <h4>How to practise it</h4>
        <ul>
          <li>Step through it first with ◀ ▶ and say each note or degree out loud.</li>
          <li>Loop it at a tempo where it is effortless (about 60–70% of your limit). Raise 4 BPM after 3 clean loops, or switch on the speed trainer.</li>
          <li>Change the subdivision (♩ → 8ths → triplets → 16ths), switch to "Quiz" to test yourself, and finish with labels off.</li>
        </ul>
        <h4>Colours</h4>
        <div class="legend">${legend.map(([k, n, c]) => `<span><i style="background:${c}${k === 'root' ? ';border-radius:3px' : ''}"></i>${n}</span>`).join('')}</div>
        ${tpl.source ? `<h4>Based on</h4><p class="muted small">${esc(tpl.source)}</p>` : ''}
        <h4>Your progress</h4>
        <p class="muted">${pr.plays ? `${pr.plays} loops played · best ${pr.bestBpm || '–'} BPM` : 'Not played yet.'}${pr.done ? ' · <b style="color:var(--good)">mastered</b>' : ''}</p>
      </div>`;
    drawer.querySelector('[data-close]').addEventListener('click', () => drawer.classList.remove('open'));
    drawer.classList.add('open');
  }

  // ------------------------------------------------------------ keyboard & lifecycle
  function onKey(e) {
    if (e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT') return;
    if (e.code === 'Space') { e.preventDefault(); player.toggle(); }
    else if (e.code === 'ArrowRight') manual(1);
    else if (e.code === 'ArrowLeft') manual(-1);
    else if (e.key === '+' || e.key === '=') setBpm(player.bpm + 2);
    else if (e.key === '-') setBpm(player.bpm - 2);
    else if (e.key === 'Escape') drawer.classList.remove('open');
  }
  window.addEventListener('keydown', onKey);

  function close() { onBack?.(); }

  function dispose() {
    player.stop(true);
    fb.destroy();
    window.removeEventListener('keydown', onKey);
    document.body.classList.remove('in-ex');
  }

  renderParams();
  rebuild();
  return { dispose, player };
}
