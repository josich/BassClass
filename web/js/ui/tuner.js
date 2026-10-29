// Chromatic bass tuner using the device microphone.
import { h, icon, toast, infoBtn } from './dom.js';
import { settings, saveSettings } from '../store.js';
import { TUNINGS } from '../fretboard.js';
import * as A from '../audio.js';
import * as T from '../theory.js';
import { yin, rms, freqToNote, midiFreq } from '../pitch.js';

const SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const DECIM = 4;       // 48 kHz -> 12 kHz analysis rate
const GATE = 0.004;    // RMS below this = silence

// The tunings the tuner offers (user, 2026-10-29: "tune not only on standard, in any key, but also to drops: I play
// drop A on a 5-string or F♯ standard on a 6-string"; then "avoid such a long list: select Standard or Drop, then the
// first key note… then allow changing each string one by one for weirder tunings"): Standard or Drop, the lowest
// string's note (the bass's standard tuning moved from 5 semitones up, A standard, to 6 down; a drop takes its lowest
// string a whole step under the rest), then each string moved on its own (`tunerOffs`, a half step at a time, up to 7
// either way; a new Standard/Drop or key starts clean). The neck and the exercises stay in standard tuning.
export const TUNER_SHIFTS = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
const OFF_MAX = 7;
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/**
 * A tuning on a bass of `strings` strings: { midi, names, name, base, low, custom }. The strings are spelled as its
 * lowest one is named (E♭ standard E♭ A♭ D♭ G♭, C♯ standard C♯ F♯ B E, F standard F B♭ E♭ A♭); `base` names the
 * Standard or Drop it comes from ("Standard", "D standard", "Drop A"), `name` is "Custom" once a string moved on its
 * own (`offs`, semitones per string); `low` is the pattern's lowest note (midi).
 */
export function tunerTuning(strings, shift = 0, drop = false, offs = null) {
  const std = TUNINGS[strings] || TUNINGS[4];
  const low = std.midi[0] + shift - (drop ? 2 : 0);
  const set = NAMES[T.mod(low, 12)].includes('♯') ? SHARPS : FLATS;
  const pattern = std.midi.map((m, i) => m + shift - (drop && i === 0 ? 2 : 0));
  const custom = !!(offs && offs.length === pattern.length && offs.some(Boolean));
  const midi = custom ? pattern.map((m, i) => m + offs[i]) : pattern;
  const lowName = set[T.mod(low, 12)];
  const base = drop ? `Drop ${lowName}` : shift ? `${lowName} standard` : 'Standard';
  // (a string moved on its own is spelled as the app spells a chromatic move: sharps going up, flats going down)
  const names = midi.map((m, i) => (custom && offs[i] ? (offs[i] > 0 ? SHARPS : FLATS) : set)[T.mod(m, 12)]);
  // strings moved into a tuning that has a name (E down to D from Standard: Drop D) take that name
  let name = base;
  if (custom) {
    name = 'Custom';
    for (const sh of TUNER_SHIFTS) for (const dr of [false, true]) {
      const t = tunerTuning(strings, sh, dr);
      if (t.midi.every((m, i) => m === midi[i])) name = t.name;
    }
  }
  return { midi, names, name, base, low, lowName, custom };
}

export function tunerScreen(main) {
  const S = settings;
  const ownOffs = () => (Array.isArray(S.tunerOffs) && S.tunerOffs.length === (TUNINGS[S.strings] || TUNINGS[4]).midi.length ? S.tunerOffs : null);
  let tuning = tunerTuning(S.strings, S.tunerShift, S.tunerDrop, ownOffs());
  let target = null;   // selected string midi, or null for auto
  let mic = null, analyser = null, raf = 0, frame = 0;
  let opening = false, disposed = false; // the mic request can still be pending when the screen is left
  let hist = [], shown = 0, lastSeen = 0;

  const noteEl = h('div', { class: 'tn-note' }, '–');
  const octEl = h('span', { class: 'tn-oct' });
  const hzEl = h('div', { class: 'tn-hz' }, '');
  const statusEl = h('div', { class: 'tn-status' }, 'Tap "Start" and play an open string.');
  const gauge = h('div', { class: 'tn-gauge', html: gaugeSvg() });
  const startBtn = h('button', { class: 'btn primary tn-start', onClick: () => (mic ? stop() : start()) }, '🎤 Start tuner');
  const a4El = h('b', {}, `${S.a4} Hz`);
  const strings = h('div', { class: 'tn-strings' });

  const drawStrings = () => {
    strings.replaceChildren(
      h('button', { class: `tn-str${target == null ? ' on' : ''}`, onClick: () => { target = null; drawStrings(); } }, h('b', {}, 'Auto'), h('small', {}, 'any note')),
      ...tuning.midi.map((m, i) => h('button', {
        class: `tn-str${target === m ? ' on' : ''}`,
        // (the string chosen plays its note on a tap: no tap tick over it)
        ...(target === m ? { 'data-silent': '' } : {}),
        onClick: () => {
          if (target === m) A.playNote(m, A.now() + 0.02, 2.4, 0.9);
          target = m;
          drawStrings();
        },
      }, h('b', {}, nm(m, tuning.names[i])), h('small', {}, `${midiFreq(m, S.a4).toFixed(1)} Hz`))),
    );
  };
  const nm = (m, name = SHARP[T.mod(m, 12)]) => T.noteName(T.N(name), S.notation) + (Math.floor(m / 12) - 1);
  const say = (n) => T.noteName(T.N(n), S.notation);

  // the tuning: Standard | Drop, then the lowest string's note (‹ ›)
  const modeSeg = h('div', { class: 'seg tn-mode', role: 'group', 'aria-label': 'Tuning' });
  const keyName = h('b', {});
  const keyOct = h('small', {});
  const keyDown = h('button', { class: 'lbl-btn', 'aria-label': 'Lowest string a half step lower', onClick: () => setTuning({ shift: S.tunerShift - 1 }) }, '‹');
  const keyUp = h('button', { class: 'lbl-btn', 'aria-label': 'Lowest string a half step higher', onClick: () => setTuning({ shift: S.tunerShift + 1 }) }, '›');
  const keyBox = h('div', { class: 'tn-key', title: 'The lowest string\'s note' }, h('small', { class: 'tn-key-l' }, 'Lowest'), keyDown, h('span', { class: 'tn-key-n' }, keyName, keyOct), keyUp);
  // ✎ each string on its own (a custom tuning)
  const eachBtn = h('button', { class: 'lbl-btn tn-each', title: 'Tune each string on its own', onClick: () => openEach() });
  function drawTuning() {
    modeSeg.replaceChildren(...[[false, 'Standard'], [true, 'Drop']].map(([drop, label]) =>
      h('button', { class: drop === S.tunerDrop ? 'on' : '', 'aria-pressed': String(drop === S.tunerDrop), onClick: () => setTuning({ drop }) }, label)));
    keyName.textContent = say(tuning.lowName);
    keyOct.textContent = String(Math.floor(tuning.low / 12) - 1);
    keyDown.disabled = S.tunerShift <= TUNER_SHIFTS[TUNER_SHIFTS.length - 1];
    keyUp.disabled = S.tunerShift >= TUNER_SHIFTS[0];
    keyBox.setAttribute('aria-label', `Lowest string: ${say(tuning.lowName)} (${tuning.base})`);
    eachBtn.textContent = tuning.custom ? `✎ ${tuning.name}` : '✎ Each string';
    eachBtn.classList.toggle('custom', tuning.custom);
  }
  /** A new Standard/Drop or key: the strings start again from its pattern. */
  function setTuning({ shift = S.tunerShift, drop = S.tunerDrop }) {
    shift = Math.max(TUNER_SHIFTS[TUNER_SHIFTS.length - 1], Math.min(TUNER_SHIFTS[0], shift));
    if (shift === S.tunerShift && drop === S.tunerDrop) return;
    saveSettings({ tunerShift: shift, tunerDrop: drop, tunerOffs: null });
    retune();
    toast(`${tuning.name}: ${tuning.names.map(say).join(' ')}`);
  }
  function retune() {
    tuning = tunerTuning(S.strings, S.tunerShift, S.tunerDrop, ownOffs());
    target = null;
    drawTuning();
    drawStrings();
  }

  // ✎ each string: a half step up or down, heard at once; "↺" back to the Standard or Drop it came from
  const eachEl = h('div', { class: 'tn-each-layer', hidden: true, onClick: (e) => { if (e.target === eachEl) closeEach(); } });
  function openEach() { drawEach(); eachEl.hidden = false; }
  function closeEach() { eachEl.hidden = true; }
  function drawEach() {
    const offs = ownOffs() || tuning.midi.map(() => 0);
    const move = (i, d) => {
      const next = offs.map((o, k) => (k === i ? Math.max(-OFF_MAX, Math.min(OFF_MAX, o + d)) : o));
      if (next[i] === offs[i]) return;
      saveSettings({ tunerOffs: next.some(Boolean) ? next : null });
      tuning = tunerTuning(S.strings, S.tunerShift, S.tunerDrop, ownOffs());
      target = tuning.midi[i];
      A.playNote(target, A.now() + 0.02, 1.6, 0.9);
      drawTuning();
      drawStrings();
      drawEach();
    };
    const cols = tuning.midi.map((m, i) => h('div', { class: 'tn-col' },
      h('button', { class: 'lbl-btn', 'data-silent': '', 'aria-label': `String ${tuning.midi.length - i} a half step higher`, disabled: offs[i] >= OFF_MAX, onClick: () => move(i, 1) }, '▲'),
      h('b', {}, nm(m, tuning.names[i])),
      h('small', {}, offs[i] ? `${offs[i] > 0 ? '+' : '−'}${Math.abs(offs[i])}` : '·'),
      h('button', { class: 'lbl-btn', 'data-silent': '', 'aria-label': `String ${tuning.midi.length - i} a half step lower`, disabled: offs[i] <= -OFF_MAX, onClick: () => move(i, -1) }, '▼')));
    eachEl.replaceChildren(h('div', { class: 'tn-each-card' },
      h('div', { class: 'row tn-each-head' }, h('h3', {}, 'Tune each string'),
        infoBtn([`▲▼ A half step at a time, from ${tuning.base}`, '🔊 Each new note plays, and its string is chosen for tuning', `↺ Back to ${tuning.base} undoes them all`, '🎚 A new Standard / Drop or lowest note starts the strings again'], 'About tuning each string')),
      h('div', { class: 'tn-cols' }, cols),
      h('div', { class: 'row' },
        h('button', { class: 'btn', disabled: !tuning.custom, onClick: () => { saveSettings({ tunerOffs: null }); retune(); drawEach(); } }, `↺ Back to ${tuning.base}`),
        h('div', { class: 'grow' }),
        h('button', { class: 'btn primary', onClick: closeEach }, 'Done'))));
  }

  main.replaceChildren(h('div', { class: 'tuner' },
    h('div', { class: 'page-head' },
      h('h1', {}, 'Tuner'),
      infoBtn(['🎤 Uses the microphone', 'Pluck one string at a time, near the neck, and let it ring', 'Tap a string to tune it even when it is far off; tap it again to hear its note', '🎚 Standard or Drop (the lowest string a whole step down), then ‹ › the lowest string\'s note', '✎ Each string: tune any string on its own for other tunings', 'The lessons and the neck stay in standard tuning'], 'About the tuner'),
      modeSeg, keyBox, eachBtn),
    h('div', { class: 'tn-main' },
      gauge,
      h('div', { class: 'tn-read' },
        h('div', { class: 'row' }, h('div', { class: 'tn-name' }, noteEl, octEl), h('div', { class: 'grow' }), startBtn),
        // (the reference pitch shares the reading's line: the header keeps the tuning alone)
        h('div', { class: 'row tn-hzrow' }, hzEl, h('div', { class: 'grow' }),
          h('div', { class: 'row tn-ref' }, h('span', { class: 'muted small' }, 'A4 ='),
            h('button', { class: 'lbl-btn', 'aria-label': 'A4 one hertz lower', onClick: () => setA4(S.a4 - 1) }, '−'), a4El,
            h('button', { class: 'lbl-btn', 'aria-label': 'A4 one hertz higher', onClick: () => setA4(S.a4 + 1) }, '+'))),
        statusEl,
        strings)),
    eachEl));
  drawTuning();
  drawStrings();

  function setA4(v) {
    saveSettings({ a4: Math.max(425, Math.min(455, v)) });
    a4El.textContent = `${S.a4} Hz`;
    drawStrings();
  }

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      statusEl.textContent = 'The microphone needs a secure page: use the installed app, https, or localhost.';
      return;
    }
    if (opening) return;
    opening = true;
    statusEl.textContent = 'Opening the microphone…';
    let m;
    try {
      m = await A.openMic();
    } catch (e) {
      opening = false;
      if (!disposed) statusEl.textContent = e.name === 'NotAllowedError' ? 'Microphone access was blocked. Allow it in the browser/app settings.' : `Could not open the microphone (${e.name || e.message}).`;
      return;
    }
    opening = false;
    if (disposed) { m.stop(); return; }
    mic = m;
    const lp1 = mic.ctx.createBiquadFilter();
    lp1.type = 'lowpass'; lp1.frequency.value = 1100;
    const lp2 = mic.ctx.createBiquadFilter();
    lp2.type = 'lowpass'; lp2.frequency.value = 1100;
    const hp = mic.ctx.createBiquadFilter();
    hp.type = 'highpass'; hp.frequency.value = 22;
    analyser = mic.ctx.createAnalyser();
    analyser.fftSize = 8192;
    mic.source.connect(hp).connect(lp1).connect(lp2).connect(analyser);
    startBtn.textContent = '■ Stop';
    statusEl.textContent = 'Listening… play a string.';
    loop();
  }

  function stop() {
    cancelAnimationFrame(raf);
    mic?.stop();
    mic = null;
    analyser = null;
    startBtn.textContent = '🎤 Start tuner';
    statusEl.textContent = 'Stopped.';
  }

  const raw = new Float32Array(8192);
  const dec = new Float32Array(8192 / DECIM);

  function loop() {
    raf = requestAnimationFrame(loop);
    if (!analyser) return;
    if (frame++ % 2 === 0) analyse();
    animate();
  }

  function analyse() {
    analyser.getFloatTimeDomainData(raw);
    for (let i = 0; i < dec.length; i++) dec[i] = raw[i * DECIM];
    const level = rms(dec);
    const sr = mic.ctx.sampleRate / DECIM;
    const res = level > GATE ? yin(dec, sr) : null;
    if (!res || res.clarity < 0.75) {
      if (performance.now() - lastSeen > 900) { hist = []; noteEl.classList.add('idle'); }
      return;
    }
    let f = res.freq;
    if (target != null) {
      // tuning a chosen string: fold octave errors onto that string
      const tf = midiFreq(target, S.a4);
      f *= Math.pow(2, Math.round(Math.log2(tf / f)));
    }
    if (hist.length && Math.abs(1200 * Math.log2(f / median(hist))) > 80) hist = [];
    hist.push(f);
    if (hist.length > 7) hist.shift();
    lastSeen = performance.now();
    noteEl.classList.remove('idle');
    show(median(hist));
  }

  let goal = 0;
  function show(f) {
    const ref = target != null ? { midi: target, cents: 1200 * Math.log2(f / midiFreq(target, S.a4)) } : freqToNote(f, S.a4);
    // (a chosen string is named as its tuning spells it: E♭, not D♯)
    const name = T.noteName(T.N(target != null && tuning.midi.includes(ref.midi) ? tuning.names[tuning.midi.indexOf(ref.midi)] : SHARP[T.mod(ref.midi, 12)]), S.notation);
    noteEl.textContent = name;
    octEl.textContent = Math.floor(ref.midi / 12) - 1;
    hzEl.textContent = `${f.toFixed(1)} Hz · ${ref.cents >= 0 ? '+' : ''}${ref.cents.toFixed(0)} cents`;
    goal = Math.max(-50, Math.min(50, ref.cents));
    const a = Math.abs(ref.cents);
    const tone = a < 4 ? 'ok' : a < 15 ? 'near' : 'far';
    gauge.dataset.tone = tone;
    noteEl.dataset.tone = tone;
    statusEl.textContent = a < 4 ? 'In tune ✓' : ref.cents < 0 ? (a > 50 ? 'Much too low: tighten the string' : 'Flat: tighten slightly ↑') : (a > 50 ? 'Much too high: loosen the string' : 'Sharp: loosen slightly ↓');
  }

  function animate() {
    shown += (goal - shown) * 0.25;
    const needle = gauge.querySelector('.tn-needle');
    if (needle) needle.setAttribute('transform', `rotate(${shown * 1.6} 160 150)`);
  }

  function onKey(e) { if (e.key === 'Escape' && !eachEl.hidden) closeEach(); }
  window.addEventListener('keydown', onKey);
  return { dispose: () => { disposed = true; window.removeEventListener('keydown', onKey); stop(); } };
}

function median(a) {
  const s = [...a].sort((x, y) => x - y);
  return s[Math.floor(s.length / 2)];
}

/** Semicircular cents gauge (-50 … +50) drawn in a 320×170 box. */
function gaugeSvg() {
  const cx = 160, cy = 150, r = 120;
  const pt = (deg, rad) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  };
  const ticks = [];
  for (let c = -50; c <= 50; c += 5) {
    const deg = c * 1.6;
    const big = c % 25 === 0;
    const [x1, y1] = pt(deg, r - (big ? 16 : 9));
    const [x2, y2] = pt(deg, r);
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="tk${big ? ' big' : ''}"/>`);
    if (big) {
      const [tx, ty] = pt(deg, r + 14);
      ticks.push(`<text x="${tx}" y="${ty + 4}" class="tl">${c > 0 ? '+' : ''}${c}</text>`);
    }
  }
  const arc = (from, to, rad) => {
    const [x1, y1] = pt(from * 1.6, rad), [x2, y2] = pt(to * 1.6, rad);
    return `M${x1},${y1} A${rad},${rad} 0 0 1 ${x2},${y2}`;
  };
  return `<svg viewBox="0 0 320 172" class="tn-svg">
    <path d="${arc(-50, 50, r - 4)}" class="track"/>
    <path d="${arc(-5, 5, r - 4)}" class="zone"/>
    ${ticks.join('')}
    <text x="40" y="168" class="side">♭</text><text x="280" y="168" class="side">♯</text>
    <g class="tn-needle" transform="rotate(0 ${cx} ${cy})">
      <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - r + 6}" class="nd"/>
      <circle cx="${cx}" cy="${cy - r + 6}" r="5" class="ndtip"/>
    </g>
    <circle cx="${cx}" cy="${cy}" r="9" class="hub"/>
  </svg>`;
}
