// The Practice room (#/practice). Its first block is the metronome: the tempo, tap tempo, beat lights and
// Start beside its settings (beats per bar, subdivision, accent, muted bars, speed up). Drums and
// harmony join as blocks of their own below it.
import { h, icon, infoBtn, toast, sideScroll } from './dom.js';
import * as A from '../audio.js';
import { Room } from '../practice/engine.js';
import { room, saveRoom, SUBS } from '../practice/state.js';
import { STYLES, GENRES, levelsOf, groupStarts } from '../practice/styles.js';
import { settings, saveSettings } from '../store.js';
import { modeFor } from '../curriculum/common.js';
import { loadKit, kitReady } from '../drums.js';
import { neckPanel } from './neck.js';
import { HARMONY_PROGS, progName, progression, keyName, isMinor, MINE, DEGREES, QUALITIES, LENGTHS, usualQuality, roman, mineFrom } from '../practice/harmony.js';
import { PROGS } from '../curriculum/common.js';
import * as T from '../theory.js';

const INFO = [
  '⏱ Set the tempo and press Start (Space on a keyboard)',
  '👆 Tap: tap the beat and the tempo follows (T)',
  '🎵 Subdivision: a click on every quarter, 8th, triplet or 16th; with the drums, how much of the pattern plays (16ths add its ghost-note fills, triplets swing a straight groove)',
  '🔇 Muted bars: the click plays some bars and stops for others, you keep the time',
  '📈 Speed up: a few BPM faster every few bars, up to a ceiling',
  '🔈 Click off: the beat lights and the drums keep the time',
  '✋ Drag the Start button anywhere on the screen',
];
const DRUM_INFO = [
  '🥁 A drummer to play with: pick a genre, then a pattern, and press Start',
  '🎚 A pattern sets its metre, its usual tempo and its subdivision',
  '🎵 Subdivision: fewer or more notes of the pattern (16ths: its fills)',
  '🔇 Muted bars and Speed up work on the drums too',
  '📶 The drums load once (about 2 MB) and then play offline',
];

// subdivision icons, drawn (phone fonts may lack the note characters): a quarter, two 8ths, a triplet, four 16ths
const head = (x, y, r = 3.2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 0.72).toFixed(2)}" transform="rotate(-20 ${x} ${y})"/>`;
const stem = (x, y1, y2) => `<rect x="${x - 0.7}" y="${y2}" width="1.4" height="${y1 - y2}"/>`;
const beam = (x1, x2, y) => `<path d="M${x1 - 0.7} ${y}H${x2 + 0.7}v2.6H${x1 - 0.7}z"/>`;
const notes = (w, body) => `<svg viewBox="0 0 ${w} 24" height="22" aria-hidden="true" fill="currentColor">${body}</svg>`;
const flag = (x, y) => `<path d="M${x - 0.7} ${y}c0.5 3 6 4.6 4.5 10.6c1-4.6-2.4-6.2-4.5-6.8z"/>`;
const three = (x) => `<text x="${x}" y="6.2" text-anchor="middle" font-size="7.5" font-weight="800" font-family="system-ui, sans-serif">3</text>`;
const run = (xs, r, top) => xs.map((x) => head(x, 19.2, r) + stem(x + r - 0.3, 18.7, top)).join('');
const ICONS = {
  q1: notes(14, head(6, 18.5) + stem(8.9, 18, 3.5)),
  q2: notes(23, head(5, 18.5) + head(16, 18.5) + stem(7.9, 18, 5) + stem(18.9, 18, 5) + beam(7.9, 18.9, 5)),
  q3: notes(31, run([4.4, 14, 23.6], 2.9, 8) + beam(7, 26.2, 8) + three(16.6)),
  q4: notes(31, run([3.9, 11.4, 18.9, 26.4], 2.7, 4) + beam(6.3, 28.8, 4) + beam(6.3, 28.8, 8.2)),
  // the shuffle: a quarter and an 8th under a triplet's 3
  sh: notes(26, head(5, 19.2, 2.9) + stem(7.6, 18.7, 8) + head(17, 19.2, 2.9) + stem(19.6, 18.7, 8) + flag(19.6, 8) + three(12.5)),
  dq: notes(18, head(6, 18.5) + stem(8.9, 18, 3.5) + '<circle cx="13.6" cy="18" r="1.7"/>'),
  e1: notes(16, head(6, 18.5) + stem(8.9, 18, 3.5) + flag(8.9, 3.5)),
  e3: notes(31, run([4.4, 14, 23.6], 2.9, 5) + beam(7, 26.2, 5)),
  s2: notes(23, head(5, 18.5) + head(16, 18.5) + stem(7.9, 18, 4) + stem(18.9, 18, 4) + beam(7.9, 18.9, 4) + beam(7.9, 18.9, 8.2)),
  s6: notes(40, run([3.4, 9.6, 15.8, 22, 28.2, 34.4], 2.4, 4) + beam(5.5, 36.5, 4) + beam(5.5, 36.5, 8.2)),
};
/** The subdivision buttons: [level, icon, name], for the drum pattern playing (or the plain metronome). */
function subChoices(s) {
  if (!s) return [[1, 'q1', 'Quarter notes'], [2, 'q2', '8ths'], [3, 'q3', 'Triplets'], [4, 'q4', '16ths']];
  if (s.beat === 'e') return [[1, 'e1', '8th notes: the beat'], [2, 's2', '16ths: the fills']];
  if (s.beat === 'dq') return [[1, 'dq', 'Dotted quarters: the beat'], [3, 'e3', '8ths'], [6, 's6', '16ths: the fills']].filter(([L]) => levelsOf(s).includes(L));
  if (s.grid === 3) return [[1, 'q1', 'Quarter notes'], [2, 'sh', 'Shuffle'], [3, 'q3', 'Triplets: the fills']];
  return [[1, 'q1', 'Quarter notes'], [2, 'q2', '8ths'], [3, 'q3', 'Swing: the groove in triplets'], [4, 'q4', '16ths: the fills']];
}
const BEAT_ICON = { q: 'q1', e: 'e1', dq: 'dq' };
const HARMONY_INFO = [
  '🎹 Something to play over: a drone (the key\'s root and 5th, held) for scales and modes, or a chord progression',
  '🎼 Pick a key and a progression: pop and rock, blues, jazz, minor, vamps',
  '✎ My progression: your own chords by degree (the Key moves them); ✎ Edit copies a progression into it',
  '🎸 The chords sit above the Neck in order, each lit while it sounds; Chord or Scale shows it on the neck, with the next change (over a drone, your scale on its key)',
  '🔇 Muted bars silence the harmony too, while the chords go on',
  '⏱ It follows the metronome and the drums: start it with the floating button',
];

// The tempo range and slider of the user's PolyOrbit metronome. Nearly all practice sits between 60 and
// 160, which an even 1–660 bar would squeeze into a fifth of it: so the left half of the bar carries
// 1–120 evenly and the right half stretches 120–660, each further beat costing less travel
//   left   bpm = 1 + LOW·2p          right   bpm = 120 + LOW·t + (HIGH − LOW)·t²,  t = 2p − 1
// Both halves meet at the same gradient, so the thumb does not change pace at the middle; the right side
// is a square so it inverts exactly (a tempo tapped or typed puts the thumb back in one step).
const BPM_MIN = 1, BPM_MAX = 660, BPM_MID = 120;
const BPM_STOPS = 2000;               // slider positions: every tempo in the range is reachable by drag
const BPM_LOW = BPM_MID - BPM_MIN, BPM_HIGH = BPM_MAX - BPM_MID;
function posToBpm(pos) {
  const p = Math.max(0, Math.min(1, (pos || 0) / BPM_STOPS));
  if (p <= 0.5) return Math.round(BPM_MIN + BPM_LOW * 2 * p);
  const t = 2 * p - 1;
  return Math.round(BPM_MID + BPM_LOW * t + (BPM_HIGH - BPM_LOW) * t * t);
}
function bpmToPos(bpm) {
  let p;
  if (bpm <= BPM_MID) p = (bpm - BPM_MIN) / BPM_LOW / 2;
  else {
    const a = BPM_HIGH - BPM_LOW, b = BPM_LOW, c = BPM_MID - bpm;
    const t = a > 0 ? (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a) : -c / b;
    p = (t + 1) / 2;
  }
  return Math.round(Math.max(0, Math.min(1, p)) * BPM_STOPS);
}

/** The tempo's Italian name, as on a metronome. */
function tempoName(bpm) {
  return bpm < 24 ? 'Larghissimo' : bpm < 60 ? 'Largo' : bpm < 66 ? 'Larghetto' : bpm < 76 ? 'Adagio' : bpm < 108 ? 'Andante'
    : bpm < 120 ? 'Moderato' : bpm < 168 ? 'Allegro' : bpm < 200 ? 'Presto' : 'Prestissimo';
}

/** A button that repeats while held (− and + on the tempo); `btn.stopHold()` ends a hold (leaving the room). */
function holdButton(label, title, step) {
  let wait = null, rep = null, tap = false;
  const stop = () => { clearTimeout(wait); clearInterval(rep); wait = rep = null; tap = false; };
  const btn = h('button', { class: 'btn round', title, 'aria-label': title }, label);
  btn.stopHold = stop;
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    stop();
    // (a touch may be the start of a scroll: it steps on release, or once held; a scroll cancels it)
    tap = e.pointerType === 'touch';
    if (!tap) step();
    wait = setTimeout(() => { if (tap) { tap = false; step(); } rep = setInterval(step, 70); }, 380);
  });
  btn.addEventListener('pointerup', () => { if (tap) step(); stop(); });
  for (const ev of ['pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
  // (keyboard: Enter or Space on the focused button)
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); step(); } });
  return btn;
}

const bars = (n) => `${n} bar${n === 1 ? '' : 's'}`;

export function practiceScreen(main, params = {}) {
  const lights = h('div', { class: 'beat-lights' });
  const bpmEl = h('b', { class: 'tempo-num' });
  const nameEl = h('span', { class: 'tempo-name' });
  const unitEl = h('span', { class: 'tempo-unit' });
  /** The drum pattern playing, if the drums are on. */
  const pattern = () => (room.drums ? STYLES[room.style] : null);
  // "BPM" with the note the beat is (a dotted quarter in 12/8, an 8th in 7/8)
  const drawUnit = () => unitEl.replaceChildren('BPM', h('span', { class: 'beat-ic', title: 'The beat', html: ICONS[BEAT_ICON[pattern()?.beat || 'q']] }));
  const slider = h('input', { type: 'range', min: 0, max: BPM_STOPS, step: 1, class: 'tempo-slider', 'aria-label': 'Tempo' });
  // one Start/Stop for the whole room, floating at the bottom so it is in reach wherever the page is scrolled
  const playBtn = h('button', { class: 'btn primary room-fab' });
  const opts = h('div', { class: 'metro-opts' });
  const queue = [];   // scheduled ticks waiting to be shown when they sound
  let shownTick = null;   // the last tick shown (the beat sounding now)
  let raf = null;

  // (saved settings that do not fit the drum pattern, after a change elsewhere, are brought back in line)
  if (room.drums && STYLES[room.style]) {
    const s = STYLES[room.style];
    if (room.beats !== s.beats || !levelsOf(s).includes(room.sub)) saveRoom({ beats: s.beats, ...(levelsOf(s).includes(room.sub) ? {} : { sub: s.sub }) });
  }
  const chordQ = [];   // chord changes waiting to be shown when they sound
  const engine = new Room({ ...room, countIn: settings.countIn, notation: settings.notation }, {
    onTick: (t) => { queue.push(t); },
    onChord: (c) => { chordQ.push(c); },
  });
  const set = (patch) => { saveRoom(patch); engine.set(patch); };

  const showTempo = (bpm) => {
    bpmEl.textContent = bpm;
    // (an x/8 pattern counts 8ths: its tempo is named from the quarter it feels like)
    nameEl.textContent = tempoName(room.drums && STYLES[room.style]?.beat === 'e' ? bpm / 2 : bpm);
    if (posToBpm(Number(slider.value)) !== bpm) slider.value = bpmToPos(bpm);
    slider.setAttribute('aria-valuetext', `${bpm} BPM`);
  };
  const setTempo = (bpm) => {
    bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(bpm)));
    set({ bpm });
    showTempo(bpm);
  };
  // (gold: the accent on 1, and in an odd metre each group's start)
  const drawLights = () => {
    const starts = groupStarts(room.drums ? STYLES[room.style] : null);
    lights.replaceChildren(...Array.from({ length: room.beats }, (_, i) => h('i', { class: room.accent && starts.has(i) ? (i ? 'accent group' : 'accent') : '' })));
  };
  const drawPlay = () => {
    playBtn.replaceChildren(h('span', { html: icon(engine.playing ? 'pause' : 'play') }), engine.playing ? 'Stop' : 'Start');
    playBtn.classList.toggle('on', engine.playing);
  };
  // the beat lights follow the sound: each tick lights when its time comes
  const frame = () => {
    const now = A.now();
    let t = null;
    while (queue.length && queue[0].time <= now) t = queue.shift();
    let c = null;
    while (chordQ.length && chordQ[0].time <= now) c = chordQ.shift();
    if (c) { curIdx = c.idx; showChord(); }
    if (t) {
      shownTick = t;
      chipRow?.classList.toggle('muted', !!t.muted);
    }
    // the chord sounding fills its chip with the pulse: full on its last beat's end, when the next one comes
    const p = shownTick?.chord;
    if (p && chips[curIdx]) {
      const into = Math.min(1, Math.max(0, ((now - shownTick.time) * shownTick.bpm) / 60));
      chips[curIdx].style.setProperty('--fill', Math.min(1, (p.at + into) / p.of).toFixed(4));
    }
    if (t) {
      [...lights.children].forEach((el, i) => el.classList.toggle('lit', i === t.beat));
      lights.classList.toggle('muted', t.muted);
      lights.classList.toggle('count', !!t.count);
      if (t.bpm !== Number(bpmEl.textContent)) showTempo(t.bpm);
    }
    raf = engine.playing ? requestAnimationFrame(frame) : null;
  };
  const toggle = async () => {
    queue.length = 0;
    shownTick = null;
    if (engine.playing || engine.starting) {
      const reached = engine.bpm;
      engine.stop();
      chordQ.length = 0;
      curIdx = null;
      chipRow?.classList.remove('muted');
      showChord();
      [...lights.children].forEach((el) => el.classList.remove('lit'));
      lights.classList.remove('muted', 'count');
      // (the speed-up climb ends and the tempo set stays: the tempo reached is named)
      if (reached > room.bpm) toast(`Reached ${reached} BPM`, 2500);
      showTempo(room.bpm);
      drawPlay();
      return;
    }
    engine.set({ countIn: settings.countIn });
    await engine.start();
    if (engine.playing && !raf) raf = requestAnimationFrame(frame);
    drawPlay();
  };
  playBtn.addEventListener('click', () => { if (!dragged) toggle(); });
  // the button can be dragged anywhere (its place is kept); a press that moves is a drag, not a tap
  let drag = null, dragged = false;
  // (never over the rail: it stays right of it)
  const leftEdge = () => (document.querySelector('.rail')?.getBoundingClientRect().right || 0) + 8;
  const placeFab = () => {
    if (!room.fab) { playBtn.style.left = playBtn.style.top = playBtn.style.right = playBtn.style.bottom = ''; return; }
    const w = playBtn.offsetWidth, hgt = playBtn.offsetHeight;
    const x = Math.max(leftEdge(), Math.min(innerWidth - w - 8, room.fab[0] * innerWidth - w / 2));
    const y = Math.max(8, Math.min(innerHeight - hgt - 8, room.fab[1] * innerHeight - hgt / 2));
    Object.assign(playBtn.style, { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' });
  };
  playBtn.addEventListener('pointerdown', (e) => {
    const r = playBtn.getBoundingClientRect();
    drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moving: false };
    dragged = false;
    // (captured at once: a quick mouse drag leaves the button on its first move)
    try { playBtn.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  });
  playBtn.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moving && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
    if (!drag.moving) {
      drag.moving = true;
      playBtn.classList.add('dragging');
    }
    const w = playBtn.offsetWidth, hgt = playBtn.offsetHeight;
    const x = Math.max(leftEdge(), Math.min(innerWidth - w - 8, e.clientX - drag.dx));
    const y = Math.max(8, Math.min(innerHeight - hgt - 8, e.clientY - drag.dy));
    Object.assign(playBtn.style, { left: `${x}px`, top: `${y}px`, right: 'auto', bottom: 'auto' });
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    if (drag.moving) {
      dragged = true;
      const r = playBtn.getBoundingClientRect();
      saveRoom({ fab: [(r.left + r.width / 2) / innerWidth, (r.top + r.height / 2) / innerHeight] });
      playBtn.classList.remove('dragging');
      setTimeout(() => { dragged = false; }, 0);
    }
    drag = null;
  };
  playBtn.addEventListener('pointerup', endDrag);
  playBtn.addEventListener('pointercancel', endDrag);
  addEventListener('resize', placeFab);
  slider.addEventListener('input', () => setTempo(posToBpm(Number(slider.value))));
  // (one slider step is a sliver of the curve: on the slider the keys move whole beats)
  slider.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 }[e.key];
    if (e.key === 'Home' || e.key === 'End') { e.preventDefault(); setTempo(e.key === 'Home' ? BPM_MIN : BPM_MAX); return; }
    if (!d) return;
    e.preventDefault();
    setTempo(room.bpm + d);
  });

  // tap tempo: the average of the last taps (a pause of 2 seconds starts again)
  let taps = [];
  const tap = () => {
    const t = performance.now();
    taps = taps.filter((x) => t - x < 2000).concat(t).slice(-6);
    if (taps.length < 2) return;
    const gaps = taps.slice(1).map((x, i) => x - taps[i]);
    setTempo(60000 / (gaps.reduce((a, b) => a + b, 0) / gaps.length));
  };

  /** A setting as a slider with its value beside it; `off(v)` greys the line (e.g. muted bars at 0). */
  const rangeLine = (key, min, max, label, fmt, after) => {
    const val = h('b', { class: 'rl-val' }, fmt(room[key]));
    const input = h('input', { type: 'range', min, max, step: 1, value: room[key], 'aria-label': label });
    input.addEventListener('input', () => {
      const v = Number(input.value);
      set({ [key]: v });
      val.textContent = fmt(v);
      after?.();
    });
    return h('div', { class: 'range-line', 'data-key': key }, h('span', {}, label), input, val);
  };
  const field = (name, ...control) => h('div', { class: 'room-field' }, h('label', {}, name), ...control);
  /** The click's volume: Settings' metronome volume (0–1.5, shown as 0–100%), here beside the click. */
  const clickVolume = () => {
    const pct = () => `${Math.round((settings.clickVol / 1.5) * 100)}%`;
    const input = h('input', { type: 'range', min: 0, max: 100, step: 1, value: Math.round((settings.clickVol / 1.5) * 100), 'aria-label': 'Click volume' });
    const val = h('b', { class: 'rl-val' }, pct());
    input.addEventListener('input', () => {
      saveSettings({ clickVol: (Number(input.value) / 100) * 1.5 });
      A.setAudioOptions({ clickVol: settings.clickVol });
      val.textContent = pct();
    });
    return h('div', { class: 'range-line', 'data-key': 'clickVol' }, h('span', {}, 'Volume'), input, val);
  };
  const drawOpts = () => {
    // (a line that does nothing with the other one at 0 is greyed: "Play" with no muted bars)
    const dim = () => {
      opts.querySelector('[data-key="play"]')?.classList.toggle('off', !room.mute);
    };
    // (with the drums on, their style sets the beats per bar)
    const fixed = room.drums ? () => toast(`The drum style sets the beats: ${STYLES[room.style].meter}`) : null;
    opts.replaceChildren(
      field('Click', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
        class: room.click === v ? 'on' : '',
        onClick: () => { set({ click: v }); drawOpts(); },
      }, v ? 'On' : 'Off')))),
      room.click ? clickVolume() : null,
      field('Beats per bar', h('div', { class: `stepper${fixed ? ' fixed' : ''}` },
        h('button', { class: 'btn round small', 'aria-label': 'Fewer beats', onClick: () => { if (fixed) fixed(); else if (room.beats > 1) { set({ beats: room.beats - 1 }); drawOpts(); drawLights(); } } }, '−'),
        h('b', {}, room.beats),
        h('button', { class: 'btn round small', 'aria-label': 'More beats', onClick: () => { if (fixed) fixed(); else if (room.beats < 12) { set({ beats: room.beats + 1 }); drawOpts(); drawLights(); } } }, '+'))),
      field('Subdivision', h('div', { class: 'seg note-seg' }, subChoices(pattern()).map(([v, ic, name]) => h('button', {
        class: (pattern() && !levelsOf(pattern()).includes(room.sub) ? pattern().sub : room.sub) === v ? 'on' : '', title: name, 'aria-label': name, html: ICONS[ic],
        onClick: () => { set({ sub: v }); drawOpts(); },
      })))),
      field('Accent on 1', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
        class: room.accent === v ? 'on' : '',
        onClick: () => { set({ accent: v }); drawOpts(); drawLights(); },
      }, v ? 'On' : 'Off')))),
      h('div', { class: 'room-group' }, h('label', {}, 'Muted bars'),
        rangeLine('play', 1, 8, 'Play', bars, dim),
        rangeLine('mute', 0, 8, 'Mute', (v) => (v ? bars(v) : 'Off'), dim)),
      // speed up is off until turned on; its settings show only then
      h('div', { class: 'room-group' },
        field('Speed up', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
          class: room.speedUp === v ? 'on' : '',
          onClick: () => { set({ speedUp: v }); drawOpts(); },
        }, v ? 'On' : 'Off')))),
        ...(room.speedUp ? [
          rangeLine('upBy', 1, 10, 'Add', (v) => `+${v} BPM`),
          rangeLine('upEvery', 1, 16, 'Every', bars),
          rangeLine('upTo', 40, BPM_MAX, 'Up to', (v) => `${v} BPM`),
        ] : [])));
    dim();
  };

  // ---------------------------------------------------------------- drums
  const drumBlock = h('section', { class: 'block room-block drums' });
  const drumState = h('span', { class: 'drum-state muted small' });
  A.setAudioOptions({ drumVol: room.drumVol / 100 });
  /** The kit loads on first use; until then the drums wait (the clock plays on). */
  const ensureKit = () => {
    if (kitReady()) { drumState.textContent = ''; return; }
    drumState.textContent = 'Loading the drums…';
    loadKit((n, total) => { drumState.textContent = `Loading the drums… ${Math.round((n / total) * 100)}%`; })
      .then(() => { drumState.textContent = ''; })
      .catch(() => {
        drumState.textContent = '';
        set({ drums: false });
        drawDrums(); drawOpts();
        toast('The drums need an internet connection the first time', 3500);
      });
  };
  const redraw = () => { drawDrums(); drawOpts(); drawLights(); drawUnit(); drawHarmony(); };
  /** A pattern chosen: the drums on, with its metre, its usual subdivision and tempo. */
  const pickStyle = (key) => {
    const s = STYLES[key];
    set({ style: key, genre: s.genre, drums: true, beats: s.beats, sub: s.sub });
    setTempo(s.bpm);
    ensureKit();
    redraw();
    // (a name that already says its metre does not repeat it, as on the cards)
    toast(`${s.name}${s.name.includes(s.meter) ? '' : ` · ${s.meter}`} · ${s.bpm} BPM`);
  };
  /** Drums on (the pattern's metre, keeping the tempo) or off (the plain metronome). */
  const drumsOn = (on) => {
    const s = STYLES[room.style];
    if (on) set({ drums: true, beats: s.beats, ...(levelsOf(s).includes(room.sub) ? {} : { sub: s.sub }) });
    else set({ drums: false, ...(SUBS.includes(room.sub) ? {} : { sub: 2 }) });
    if (on) ensureKit();
    redraw();
    showTempo(room.bpm);
  };
  const drawDrums = () => {
    const vol = h('input', { type: 'range', min: 0, max: 100, step: 1, value: room.drumVol, 'aria-label': 'Drums volume' });
    const volVal = h('b', { class: 'rl-val' }, `${room.drumVol}%`);
    vol.addEventListener('input', () => {
      const v = Number(vol.value);
      set({ drumVol: v });
      A.setAudioOptions({ drumVol: v / 100 });
      volVal.textContent = `${v}%`;
    });
    drumBlock.classList.toggle('off', !room.drums);
    const tabsAt = drumBlock.querySelector('.genre-tabs')?.scrollLeft || 0;
    drumBlock.replaceChildren(
      h('div', { class: 'block-head' }, h('h2', {}, '🥁 Drums'), infoBtn(DRUM_INFO, 'About the drums'), drumState, h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
          class: room.drums === v ? 'on' : '',
          onClick: () => drumsOn(v),
        }, v ? 'On' : 'Off')))),
      // a genre (the row scrolls sideways, whatever their number), then its patterns
      sideScroll(h('div', { class: 'genre-tabs' }, GENRES.map((g) => h('button', {
        class: `${room.genre === g.key ? 'on' : ''}${STYLES[room.style].genre === g.key ? ' playing' : ''}`,
        onClick: () => { set({ genre: g.key }); drawDrums(); },
      }, `${g.icon} ${g.name}`))), { from: tabsAt }),
      h('div', { class: 'style-grid' }, GENRES.find((g) => g.key === room.genre).styles.map((st) => h('button', {
        class: `style-chip${room.style === st.key ? ' on' : ''}`,
        onClick: () => pickStyle(st.key),
      // (a name that already says its metre, "5/4 (3 + 2)", does not repeat it)
      }, h('b', {}, st.name), h('span', {}, st.name.includes(st.meter) ? `${st.bpm} BPM` : `${st.meter} · ${st.bpm} BPM`)))),
      h('div', { class: 'range-line' }, h('span', {}, 'Volume'), vol, volVal));
  };
  if (room.drums) ensureKit();
  drawDrums();

  // ---------------------------------------------------------------- harmony
  const harmBlock = h('section', { class: 'block room-block harmony' });
  let curIdx = null;      // the chord sounding: its index, -1 the drone, null silent
  let chips = [];
  let chipRow = null;     // the chips' sideways row (it keeps the chord sounding and the next in view)
  const chordsNow = () => (room.harmony === 'chords' ? progression(room.hProg, room.hKey, room.beats, { notation: settings.notation }, null, room.myProg) : null);
  // ---- My progression: its chords as slots, "+" to add one, a tap opens the slot's degree, chord and length
  let mineAt = null;   // the slot open for editing
  const setMine = (list) => setHarmony({ myProg: list });
  const lengthName = (b) => (b === 2 ? '½ bar' : b === 4 ? '1 bar' : `${b / 4} bars`);
  const mineEditor = () => {
    const list = room.myProg;
    const named = progression(MINE, room.hKey, 4, { notation: settings.notation }, null, list);
    if (mineAt != null && !list[mineAt]) mineAt = null;
    const slots = list.map((c, i) => h('button', {
      class: `mine-slot${mineAt === i ? ' on' : ''}`,
      onClick: () => { mineAt = mineAt === i ? null : i; drawHarmony(); },
    }, h('b', {}, named[i].sym), h('small', {}, `${roman(c.d, c.q)} · ${lengthName(c.b)}`)));
    const add = list.length < 16 ? h('button', {
      class: 'mine-slot add', title: 'Add a chord', 'aria-label': 'Add a chord',
      onClick: () => { mineAt = list.length; setMine([...list, { ...list.at(-1) }]); },
    }, '+') : null;
    let panel = null;
    if (mineAt != null) {
      const c = list[mineAt];
      const patch = (p) => setMine(list.map((x, i) => (i === mineAt ? { ...x, ...p } : x)));
      const line = (label, ...control) => h('div', { class: 'mine-line' }, h('label', {}, label), ...control);
      panel = h('div', { class: 'mine-edit' },
        // (a new degree takes its usual chord in the key: V → V7, ii → m7; the chord can then change)
        line('Degree', sideScroll(h('div', { class: 'seg' }, DEGREES.map((name, d) => h('button', {
          class: c.d === d ? 'on' : '', onClick: () => patch({ d, q: usualQuality(d) }),
        }, name))))),
        line('Chord', h('div', { class: 'seg' }, QUALITIES.map(([q, l]) => h('button', { class: c.q === q ? 'on' : '', onClick: () => patch({ q }) }, l)))),
        line('Length', h('div', { class: 'seg' }, LENGTHS.map(([b, l]) => h('button', { class: c.b === b ? 'on' : '', onClick: () => patch({ b }) }, l))), h('span', { class: 'muted small' }, 'bars')),
        h('div', { class: 'mine-line end' },
          h('button', { class: 'btn small', disabled: list.length < 2, onClick: () => { const i = mineAt; mineAt = null; setMine(list.filter((_, k) => k !== i)); } }, 'Remove'),
          h('button', { class: 'btn small primary', onClick: () => { mineAt = null; drawHarmony(); } }, 'Done')));
    }
    return [h('div', { class: 'mine-row' }, slots, add), panel];
  };
  /** A preset copied into My progression, to change it. */
  const editPreset = () => {
    const n = PROGS[room.hProg].chords.length;
    mineAt = null;
    setHarmony({ myProg: mineFrom(room.hProg), hProg: MINE });
    toast(n > 16 ? 'Copied the first 16 chords into My progression' : 'Copied into My progression: tap a chord to change it', 2500);
  };
  // the room's pad: brighter, and up to 2.5 times an exercise Backing's level, to be heard with a real bass
  // (user, 2026-10-23: too quiet under a real instrument); the accompaniment's limiter keeps it clean
  const PAD_MAX = 2.5;
  A.setAudioOptions({ padVol: (room.hVol / 100) * PAD_MAX, padTone: 3200 });
  /** The chord sounding lit among the chips, and the Neck following it (the first chord, or the drone's key, at rest). */
  const showChord = () => {
    // (the chords already played stay full until the progression starts again)
    chips.forEach((el, i) => {
      const done = Number.isInteger(curIdx) && i < curIdx;
      el.classList.toggle('on', i === curIdx);
      el.classList.toggle('done', done);
      if (i !== curIdx) el.style.setProperty('--fill', done ? 1 : 0);
    });
    if (Number.isInteger(curIdx) && curIdx >= 0) chipRow?.show(chips[curIdx], chips[curIdx + 1]);
    if (room.neckShow === 'off' || room.harmony === 'off') { neck.follow(null); return; }
    if (room.harmony === 'drone') { neck.follow({ root: T.bestRoot(room.hKey, T.SCALES.ionian.iv), type: null, name: keyName(room.hKey, settings.notation) }); return; }
    const ch = chordsNow();
    // (at rest, or before the first chord sounds: the progression's first chord)
    const i = Number.isInteger(curIdx) && curIdx >= 0 && curIdx < ch.length ? curIdx : 0;
    const c = ch[i];
    // the next change: the next chord that is not this one again
    const next = ch.slice(i + 1).concat(ch.slice(0, i)).find((x) => x.sym !== c.sym);
    // its scale by its function in the key, as the chord-scale exercise teaches (ii Dorian, V Mixolydian…)
    const scale = room.neckShow === 'scale' ? modeFor(c, ch[(i + 1) % ch.length]) : null;
    neck.follow({ root: c.root, type: scale ? null : c.type, scale, name: c.sym, next: next?.sym || null });
  };
  const setHarmony = (patch) => { set(patch); drawHarmony(); };
  const drawHarmony = () => {
    const mode = room.harmony;
    harmBlock.classList.toggle('off', mode === 'off');
    const minor = mode === 'chords' && isMinor(room.hProg);
    const keySel = h('select', { class: 'mini-sel', 'aria-label': 'Key' }, T.CHROMATIC_PC.map((p) => h('option', { value: p, selected: p === room.hKey }, keyName(p, settings.notation, minor))));
    keySel.addEventListener('change', () => setHarmony({ hKey: Number(keySel.value) }));
    const progSel = h('select', { class: 'mini-sel prog-sel', 'aria-label': 'Progression' }, HARMONY_PROGS.map(([g, keys]) => h('optgroup', { label: g },
      keys.map((k) => h('option', { value: k, selected: room.hProg === k }, progName(k))))));
    progSel.addEventListener('change', () => setHarmony({ hProg: progSel.value }));
    const vol = h('input', { type: 'range', min: 0, max: 100, step: 1, value: room.hVol, 'aria-label': 'Harmony volume' });
    const volVal = h('b', { class: 'rl-val' }, `${room.hVol}%`);
    vol.addEventListener('input', () => {
      const v = Number(vol.value);
      set({ hVol: v });
      A.setAudioOptions({ padVol: (v / 100) * PAD_MAX });
      volVal.textContent = `${v}%`;
    });
    const ch = chordsNow();
    chips = ch ? ch.map((c) => h('span', { class: 'chord-chip' }, h('span', {}, c.sym))) : [];
    chipRow = ch ? sideScroll(h('div', { class: 'chord-row' }, chips)) : null;
    // above the Neck: Follow, then the chords (or the drone's key), so the two fit one screen
    // what the neck shows: the chord sounding, its scale, or the player's own choice (over a drone: the
    // player's scale on its key, or their own choice)
    const shows = mode === 'chords' ? [['chord', 'Chord'], ['scale', 'Scale'], ['off', 'Off']] : [['scale', 'Scale'], ['off', 'Off']];
    const lit = mode === 'drone' && room.neckShow === 'chord' ? 'scale' : room.neckShow;
    neck.setBar(mode === 'off' ? null : h('div', { class: 'harm-bar' },
      h('div', { class: 'seg', title: 'What the neck shows' }, shows.map(([v, l]) => h('button', {
        class: lit === v ? 'on' : '',
        onClick: () => setHarmony({ neckShow: v }),
      }, l))),
      chipRow || h('span', { class: 'drone-tag' }, `Drone on ${keyName(room.hKey, settings.notation)}`)));
    harmBlock.replaceChildren(...[
      h('div', { class: 'block-head' }, h('h2', {}, '🎹 Harmony'), infoBtn(HARMONY_INFO, 'About the harmony'), h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, [['off', 'Off'], ['drone', 'Drone'], ['chords', 'Chords']].map(([v, l]) => h('button', {
          class: mode === v ? 'on' : '',
          onClick: () => { if (room.harmony !== v) { curIdx = null; setHarmony({ harmony: v }); } },
        }, l)))),
      mode === 'off' ? null : h('div', { class: 'harm-row' },
        h('label', {}, 'Key'), keySel,
        mode === 'chords' ? h('label', {}, 'Progression') : null, mode === 'chords' ? progSel : null,
        mode === 'chords' && room.hProg !== MINE ? h('button', { class: 'btn small', title: 'Copy it into My progression to change it', onClick: editPreset }, '✎ Edit') : null),
      ...(mode === 'chords' && room.hProg === MINE ? mineEditor() : []),
      mode === 'off' ? null : h('div', { class: 'range-line' }, h('span', {}, 'Volume'), vol, volVal),
    ].filter(Boolean));
    showChord();
  };

  // ---------------------------------------------------------------- neck (the former Neck explorer)
  const neck = neckPanel();
  drawHarmony();

  const slower = holdButton('−', 'Slower', () => setTempo(room.bpm - 1));
  const faster = holdButton('+', 'Faster', () => setTempo(room.bpm + 1));

  const onKey = (e) => {
    if (e.target.closest?.('input, select, textarea')) return;
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    else if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') { e.preventDefault(); setTempo(room.bpm + 1); }
    else if (e.key === '-' || e.key === 'ArrowDown') { e.preventDefault(); setTempo(room.bpm - 1); }
    else if (e.key === 't' || e.key === 'T') tap();
  };
  document.addEventListener('keydown', onKey);

  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Practice room')),
    h('section', { class: 'block room-block metro' },
      h('div', { class: 'block-head' }, h('h2', {}, '⏱ Metronome'), infoBtn(INFO, 'About the metronome')),
      h('div', { class: 'metro-body' },
        h('div', { class: 'metro-main' },
          h('div', { class: 'tempo-row' },
            slower,
            h('div', { class: 'tempo-show' }, bpmEl, unitEl, nameEl),
            faster,
            h('button', { class: 'btn tap-btn', title: 'Tap the beat', onClick: tap }, '👆 Tap')),
          slider,
          lights),
        opts)),
    drumBlock,
    harmBlock,
    neck.el,
    // (room under the last block for the floating button)
    h('div', { class: 'room-fab-space' }),
    playBtn);
  showTempo(room.bpm);
  drawLights();
  drawPlay();
  drawOpts();
  drawUnit();
  requestAnimationFrame(placeFab);
  // (#/practice?to=neck, the old Neck explorer's address: the Neck block in view)
  if (params.to === 'neck') requestAnimationFrame(() => neck.el.scrollIntoView({ block: 'start' }));

  return {
    dispose: () => {
      engine.stop();
      slower.stopHold();
      faster.stopHold();
      neck.dispose();
      // (an exercise's Backing has its own level)
      A.setAudioOptions({ padVol: 1, padTone: 1500 });
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', placeFab);
    },
  };
}
