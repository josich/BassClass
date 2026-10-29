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

// The tunings the tuner offers (user, 2026-10-29: "tune not only on standard, in any key selectable from a list, but
// also to drops: I play drop A on a 5-string or F♯ standard on a 6-string"): the bass's standard tuning moved to any
// key, from 5 semitones up (A standard: a 4-string's A D G C, the tenor bass) to 6 down, each also with its lowest
// string dropped a whole step. The neck and the exercises stay in standard tuning.
export const TUNER_SHIFTS = [5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5, -6];
const NAMES = ['C', 'C♯', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const SHARPS = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FLATS = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
/**
 * A tuning on a bass of `strings` strings: { midi, names, name }. The strings are spelled as its lowest one is named
 * (E♭ standard E♭ A♭ D♭ G♭, C♯ standard C♯ F♯ B E, F standard F B♭ E♭ A♭); its name is "Standard", "D standard",
 * "Drop A".
 */
export function tunerTuning(strings, shift = 0, drop = false) {
  const base = TUNINGS[strings] || TUNINGS[4];
  const midi = base.midi.map((m) => m + shift);
  if (drop) midi[0] -= 2;
  const low = NAMES[T.mod(midi[0], 12)];
  const set = low.includes('♯') ? SHARPS : FLATS;
  const names = midi.map((m) => set[T.mod(m, 12)]);
  return { midi, names, name: drop ? `Drop ${names[0]}` : shift ? `${names[0]} standard` : 'Standard' };
}

export function tunerScreen(main) {
  const S = settings;
  let tuning = tunerTuning(S.strings, S.tunerShift, S.tunerDrop);
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
  // the tuning: standard in any key, or a drop, from a list (the bass's own number of strings)
  const say = (n) => T.noteName(T.N(n), S.notation);
  const tuningSel = h('select', { class: 'mini-sel tn-tuning', 'aria-label': 'Tuning' },
    [[false, 'Standard'], [true, 'Drop']].map(([drop, group]) => h('optgroup', { label: group }, TUNER_SHIFTS.map((shift) => {
      const t = tunerTuning(S.strings, shift, drop);
      const label = drop ? `Drop ${say(t.names[0])}` : shift ? `${say(t.names[0])} standard` : 'Standard';
      return h('option', { value: `${shift}:${drop ? 1 : 0}`, selected: shift === S.tunerShift && drop === S.tunerDrop }, `${label} · ${t.names.map(say).join(' ')}`);
    }))));
  tuningSel.addEventListener('change', () => {
    const [shift, drop] = tuningSel.value.split(':').map(Number);
    saveSettings({ tunerShift: shift, tunerDrop: drop === 1 });
    tuning = tunerTuning(S.strings, shift, drop === 1);
    target = null;
    drawStrings();
  });

  main.replaceChildren(h('div', { class: 'tuner' },
    h('div', { class: 'page-head' },
      h('h1', {}, 'Tuner'),
      infoBtn(['🎤 Uses the microphone', 'Pluck one string at a time, near the neck, and let it ring', 'Tap a string to tune it even when it is far off; tap it again to hear its note', '🎚 Tuning: standard in any key, or a drop (the lowest string a whole step down); the lessons and the neck stay in standard tuning'], 'About the tuner'),
      tuningSel,
      h('div', { class: 'grow' }),
      h('div', { class: 'row tn-ref' }, h('span', { class: 'muted small' }, 'A4 ='),
        h('button', { class: 'lbl-btn', onClick: () => setA4(S.a4 - 1) }, '−'), a4El,
        h('button', { class: 'lbl-btn', onClick: () => setA4(S.a4 + 1) }, '+'))),
    h('div', { class: 'tn-main' },
      gauge,
      h('div', { class: 'tn-read' },
        h('div', { class: 'row' }, h('div', { class: 'tn-name' }, noteEl, octEl), h('div', { class: 'grow' }), startBtn),
        hzEl, statusEl,
        strings))));
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

  return { dispose: () => { disposed = true; stop(); } };
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
