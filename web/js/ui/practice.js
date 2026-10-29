// The Practice room (#/practice). Its first block is the metronome: the tempo, tap tempo, beat lights and
// Start beside its settings (beats per bar, subdivision, accent, muted bars, speed up). Drums and
// harmony join as blocks of their own below it.
import { h, icon, infoBtn, toast, sideScroll } from './dom.js';
import * as A from '../audio.js';
import { Room } from '../practice/engine.js';
import { room, saveRoom, SUBS } from '../practice/state.js';
import { STYLES, GENRES, levelsOf, regroup, beatHits } from '../practice/styles.js';
import { accentsFor, groupsOf } from '../practice/accents.js';
import { settings, saveSettings } from '../store.js';
import { loadKit, kitReady, playDrum, styleGain, trackGain } from '../drums.js';
import { loadPiano, pianoReady } from '../piano.js';
import { styleLock, progLock, soundLock, fillsLock, droneLock, freeRoom } from '../pro.js';
import { openPro } from './proSheet.js';
import { proChip, newChip } from './screens.js';
import { isNew, markUsed } from '../news.js';
import { neckPanel } from './neck.js';
import { openPicker } from './picker.js';
import { HARMONY_PROGS, progName, progression, keyName, isMinor, MINE, DEGREES, QUALITIES, LENGTHS, usualQuality, roman, mineFrom, scaleFor, droneScale, MINE_START, mineBars } from '../practice/harmony.js';
import { PROGS, toTriad } from '../curriculum/common.js';
import { DRONES, DRONE_GROUPS, DRONE_KEYS, droneName, droneTitle, droneFormula, droneLead, droneRoot, droneMidis } from '../practice/drones.js';
import * as T from '../theory.js';

const INFO = [
  '⏱ Set the tempo, then Start (Space); Tap follows your beat (T)',
  '💡 Tap a beat light to accent it: your groupings (3 + 2 + 2…); ↺ the usual one',
  '🎵 Subdivision: quarters, 8ths, triplets or 16ths (with drums: how much of the pattern plays)',
  '🔇 Muted bars: the click stops for some bars, you keep the time',
  '📈 Speed up: faster every few bars, up to a ceiling; Stop pauses it, Off goes back to where it started',
  '🔈 Click off: the lights and the drums keep the time',
  '✋ Drag Start anywhere on the screen',
];
const DRUM_INFO = [
  '🥁 A drummer to play with: Change opens the patterns (by genre, your ★ favourites and recent ones), then press Start',
  '🎚 A pattern sets its metre, its usual tempo and its subdivision',
  '🎵 Subdivision: fewer or more notes of the pattern (16ths: its fills)',
  '🔢 In odd metres the drums play the grouping you tap on the beat lights ("played 3 + 2 + 2")',
  '💥 Fills: every 4 or 8 bars, four kinds in turn, and a crash on the next downbeat (not on soft grooves)',
  '🔇 Muted bars and Speed up work on the drums too',
  '📴 The drums play offline',
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
// the Neck's scales that name a drone's key as a minor key does (C♯, not D♭)
const HARMONY_INFO = [
  '🎹 Something to play over: a drone or a chord progression, in any key',
  '🎵 Drone: the key\'s root and 5th, or any chord or voicing from Change; stopped, a pick plays once',
  '🎼 Chords: a progression, by style: pop and rock, blues, soul and R&B, jazz, minor, vamps',
  '✎ My progression: your own chords by degree (the Key moves them); ✎ Edit copies a progression into it',
  '🎼 My progression is in a major or a minor key: Minor turns the usual chords into the minor key\'s (I → i, vi → ♭VI)',
  '🎛 Sound: a pad, an electric piano, a recorded grand piano, an organ, a distorted rock guitar (chugging) or an arpeggio (the guitar and the arpeggio move with the Subdivision); another one plays from the next beat',
  '🎸 The chords sit above the Neck in order, each lit while it sounds; Chord or Scale shows it on the neck, with the next change',
  '🎸 Over a drone the Neck shows its chord (Chord) or a scale on its key (Scale): a chord picks a scale that fits it, which you can change on the Neck',
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
function holdButton(label, title, step, cls = '') {
  let wait = null, rep = null, tap = false;
  const stop = () => { clearTimeout(wait); clearInterval(rep); wait = rep = null; tap = false; };
  const btn = h('button', { class: `btn round ${cls}`, title, 'aria-label': title }, label);
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
  const grouping = h('div', { class: 'beat-grouping' });
  const bpmEl = h('b', { class: 'tempo-num' });
  const nameEl = h('span', { class: 'tempo-name' });
  const unitEl = h('span', { class: 'tempo-unit' });
  /** The drum pattern playing, if the drums are on. */
  const pattern = () => (room.drums ? STYLES[room.style] : null);
  // "BPM" with the note the beat is (a dotted quarter in 12/8, an 8th in 7/8)
  const drawUnit = () => unitEl.replaceChildren('BPM', h('span', { class: 'beat-ic', title: 'The beat', html: ICONS[BEAT_ICON[pattern()?.beat || 'q']] }));
  const slider = h('input', { type: 'range', min: 0, max: BPM_STOPS, step: 1, class: 'tempo-slider', 'aria-label': 'Tempo' });
  // one Start/Stop for the whole room, floating at the bottom so it is in reach wherever the page is scrolled
  const playBtn = h('button', { class: 'btn primary room-fab', 'data-silent': '' });
  const opts = h('div', { class: 'metro-opts' });
  // (the beat's own settings sit under the beat lights; the click's, muted bars and speed up beside them)
  const beatOpts = h('div', { class: 'metro-beat' });
  const queue = [];   // scheduled ticks waiting to be shown when they sound
  let shownTick = null;   // the last tick shown (the beat sounding now)
  let raf = null;

  // (a choice that is Pro, made before the gates came on or Pro was taken back, goes back to a free one: pro.js)
  const free = freeRoom(room);
  if (free) saveRoom(free);
  // (saved settings that do not fit the drum pattern, after a change elsewhere, are brought back in line)
  if (room.drums && STYLES[room.style]) {
    const s = STYLES[room.style];
    if (room.beats !== s.beats || !levelsOf(s).includes(room.sub)) saveRoom({ beats: s.beats, ...(levelsOf(s).includes(room.sub) ? {} : { sub: s.sub }) });
  }
  const chordQ = [];   // chord changes waiting to be shown when they sound
  const engine = new Room({ ...room, accents: accentsFor(room, room.drums ? STYLES[room.style] : null), countIn: settings.countIn, notation: settings.notation }, {
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
  // (a tempo the player sets is a new starting point: a paused speed-up climb is forgotten)
  const setTempo = (bpm) => {
    bpm = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(bpm)));
    set({ bpm, ...(room.upFrom != null ? { upFrom: null } : {}) });
    showTempo(bpm);
  };
  // the beat lights: gold where a beat is accented (dashed: a group's), and a tap on one accents it or not
  // (the player's own groupings; user, 2026-10-23), with its sound as it now plays
  const drawLights = () => {
    const acc = accentsFor(room, pattern());
    engine.set({ accents: acc });
    lights.classList.toggle('many', room.beats > 9);
    lights.replaceChildren(...Array.from({ length: room.beats }, (_, i) => h('button', {
      class: acc.includes(i) ? (i ? 'accent group' : 'accent') : '', type: 'button', 'data-silent': '',
      title: 'Tap to accent this beat', 'aria-label': `Beat ${i + 1}${acc.includes(i) ? ', accented' : ''}`,
      onClick: (e) => {
        const next = acc.includes(i) ? acc.filter((b) => b !== i) : [...acc, i].sort((a, b) => a - b);
        saveRoom({ accents: { ...room.accents, [room.beats]: next }, lightsTapped: true });
        // (stopped, the beat sounds as it now plays; playing, the next bar plays it: QA round 18)
        if (!engine.playing) A.click(A.now() + 0.01, next.includes(i) ? (i ? 1.5 : 2) : 1);
        const focused = document.activeElement === e.currentTarget;
        drawLights();
        // (the keys stay on the light: Enter again, or Tab on)
        if (focused) lights.children[i]?.focus({ preventScroll: true });
        if (room.drums) drawDrums();
      },
    })));
    // the grouping they make (beat 1 always starts one, as the drums play it), and ↺ back to the bar's usual
    // one when the player changed it; until the player first taps a light, a hint says they can (QA round 18)
    const groups = groupsOf(room.beats, acc);
    const own = Array.isArray(room.accents?.[room.beats]);
    grouping.replaceChildren(...[
      groups ? h('span', {}, groups.join(' + ')) : null,
      own ? h('button', {
        class: 'grouping-reset', type: 'button', title: 'Back to the usual grouping', 'aria-label': 'Back to the usual grouping',
        onClick: () => { const rest = { ...room.accents }; delete rest[room.beats]; saveRoom({ accents: rest }); drawLights(); if (room.drums) drawDrums(); },
      }, '↺') : null,
      room.lightsTapped ? null : h('span', { class: 'grouping-hint' }, groups ? 'tap a light to change it' : 'Tap a light to accent it'),
    ].filter(Boolean));
  };
  const drawPlay = () => {
    // (a six-dot grip at its left: it can be dragged anywhere; user, 2026-10-23)
    playBtn.replaceChildren(h('span', { class: 'fab-grip', html: icon('grip'), 'aria-hidden': 'true' }), h('span', { html: icon(engine.playing ? 'pause' : 'play') }), engine.playing ? 'Stop' : 'Start');
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
      // (the tempo shown follows the speed-up climb; a beat scheduled before the player's last change of
      // tempo does not put the old number back: user, 2026-10-27, the numbers jumped while changing it)
      if ((t.gen ?? 0) === (engine.tempoGen || 0) && t.bpm !== Number(bpmEl.textContent)) showTempo(t.bpm);
    }
    raf = engine.playing ? requestAnimationFrame(frame) : null;
  };
  const toggle = async () => {
    // (a preview still sounding stops when the room starts or stops)
    stopPreview();
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
      // speed up pauses (user, 2026-10-26): the tempo reached stays and Start goes on from it; switching
      // Speed up off goes back to the tempo the climb started from (`upFrom`)
      if (room.speedUp && reached > room.bpm) {
        set({ bpm: reached });
        toast(`Paused at ${reached} BPM: Start goes on from here`, 2500);
      }
      showTempo(room.bpm);
      drawPlay();
      return;
    }
    // (a chord tapped while stopped is forgotten: the count-in shows the progression's first)
    curIdx = null;
    showChord();
    // (a speed-up climb remembers where it starts, the first time)
    if (room.speedUp && room.upFrom == null) saveRoom({ upFrom: room.bpm });
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

  // tap tempo: the average of the last taps (a pause of 2 seconds starts again); the button wobbles like jelly
  // and its edge flashes on each one, the T key's too (user, 2026-10-23)
  let taps = [];
  const tapBtn = h('button', { class: 'btn tap-btn', type: 'button', title: 'Tap the beat', onClick: () => tap() }, '👆 Tap');
  const tap = () => {
    tapBtn.classList.remove('jelly');
    void tapBtn.offsetWidth;   // (restarts the animation on a quick tap)
    tapBtn.classList.add('jelly');
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
    beatOpts.replaceChildren(
      field('Beats per bar', h('div', { class: `stepper${fixed ? ' fixed' : ''}` },
        h('button', { class: 'btn round small', 'aria-label': 'Fewer beats', onClick: () => { if (fixed) fixed(); else if (room.beats > 1) { set({ beats: room.beats - 1 }); drawOpts(); drawLights(); } } }, '−'),
        h('b', {}, room.beats),
        h('button', { class: 'btn round small', 'aria-label': 'More beats', onClick: () => { if (fixed) fixed(); else if (room.beats < 12) { set({ beats: room.beats + 1 }); drawOpts(); drawLights(); } } }, '+'))),
      field('Subdivision', h('div', { class: 'seg note-seg' }, subChoices(pattern()).map(([v, ic, name]) => h('button', {
        class: (pattern() && !levelsOf(pattern()).includes(room.sub) ? pattern().sub : room.sub) === v ? 'on' : '', title: name, 'aria-label': name, html: ICONS[ic],
        onClick: () => { set({ sub: v }); drawOpts(); },
      })))));
    opts.replaceChildren(...[
      field('Click', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
        class: room.click === v ? 'on' : '',
        onClick: () => { set({ click: v }); drawOpts(); },
      }, v ? 'On' : 'Off')))),
      room.click ? clickVolume() : null,
      h('div', { class: 'room-group' }, h('label', {}, 'Muted bars'),
        rangeLine('play', 1, 8, 'Play', bars, dim),
        rangeLine('mute', 0, 8, 'Mute', (v) => (v ? bars(v) : 'Off'), dim)),
      // speed up is off until turned on; its settings show only then
      h('div', { class: 'room-group' },
        field('Speed up', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
          class: room.speedUp === v ? 'on' : '',
          onClick: () => {
            if (room.speedUp === v) return;
            // (off: back to the tempo the climb started from, playing or not; on while playing: it starts here)
            const back = !v ? room.upFrom : null;
            set({ speedUp: v, ...(v ? ceiling(room.bpm) : {}), upFrom: v && engine.playing ? room.bpm : null });
            if (back != null && back !== room.bpm) { setTempo(back); toast(`Back to ${back} BPM`); }
            drawOpts();
          },
        }, v ? 'On' : 'Off')))),
        ...(room.speedUp ? [
          rangeLine('upBy', 1, 10, 'Add', (v) => `+${v} BPM`),
          rangeLine('upEvery', 1, 16, 'Every', bars),
          rangeLine('upTo', 40, BPM_MAX, 'Up to', (v) => `${v} BPM`),
        ] : [])),
    ].filter(Boolean));
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
        toast('The drums could not load. Try again.', 3500);
      });
  };
  const redraw = () => { drawDrums(); drawOpts(); drawLights(); drawUnit(); drawHarmony(); };
  // the piano loads the first time it is picked (about 1 MB); until then the e-piano plays in its place
  const pianoState = h('span', { class: 'drum-state muted small' });
  const ensurePiano = () => {
    if (room.hSound !== 'piano' || pianoReady()) { pianoState.textContent = ''; return; }
    pianoState.textContent = 'Loading the piano…';
    loadPiano((n, total) => { pianoState.textContent = `Loading the piano… ${Math.round((n / total) * 100)}%`; })
      .then(() => { pianoState.textContent = ''; })
      .catch(() => {
        pianoState.textContent = '';
        toast('The piano could not load: the e-piano plays meanwhile', 3500);
      });
  };
  // ---- a Pro choice tapped by a free player is heard once before the Pro sheet, while the room is stopped (user,
  // 2026-10-29: "sounds in the practice room too: it can play once when tapped, not while the metronome runs")
  let previewNodes = [], previewTimers = [];
  const stopPreview = () => {
    for (const n of previewNodes) { try { n.disconnect(); } catch { /* gone */ } }
    for (const t of previewTimers) clearTimeout(t);
    previewNodes = []; previewTimers = [];
  };
  const canPreview = () => !engine.playing && !engine.starting;
  /** Two bars of a drum pattern at its own tempo. */
  const previewStyle = (key) => {
    if (!canPreview()) return;
    const s = STYLES[key];
    const go = () => {
      stopPreview();
      const t0 = A.now() + 0.08, len = 60 / s.bpm, g = styleGain(key);
      for (let bar = 0; bar < Math.max(2, s.bars); bar++) {
        for (let beat = 0; beat < s.beats; beat++) {
          for (const [f, piece, v] of beatHits(s, s.sub, bar, beat)) {
            const node = playDrum(piece, t0 + (bar * s.beats + beat + f) * len, v, g * trackGain(s, piece));
            if (node) previewNodes.push(node);
          }
        }
      }
    };
    if (kitReady()) go(); else loadKit().then(() => { if (canPreview()) go(); }).catch(() => {});
  };
  /** A progression's first chords, one after another, in the room's sound. */
  const previewProg = (key) => {
    if (!canPreview()) return;
    const ch = progression(key, room.hKey, 4, { notation: settings.notation }).filter((c, i, a) => i === 0 || c.sym !== a[i - 1].sym).slice(0, 4);
    stopPreview();
    ch.forEach((c, i) => previewTimers.push(setTimeout(() => { if (canPreview()) A.chordPreview(c.midis, room.hSound); }, i * 900)));
  };
  /** The chord sounding now (the progression's first, or the drone's) in another sound. */
  const previewSound = (v) => {
    if (!canPreview()) return;
    const midis = room.harmony === 'chords' ? chordsNow()[0].midis : droneMidis(room.hKey, room.hQual);
    if (v === 'piano' && !pianoReady()) { loadPiano().then(() => { if (canPreview()) A.chordPreview(midis, v); }).catch(() => {}); return; }
    A.chordPreview(midis, v);
  };
  // ---- the shared picker for the drum patterns and the progressions
  let closePicker = null;
  /** A library's current choice on one line, and Change. */
  const pickNow = (name, sub, onOpen) => h('button', { class: 'pick-now', type: 'button', onClick: () => onOpen() },
    h('span', { class: 'pick-text' }, h('b', {}, name), h('small', {}, sub)),
    h('span', { class: 'pick-change' }, 'Change', h('span', { html: icon('next') })));
  // (a name that already says its metre, "5/4 (3 + 2)", does not repeat it)
  const styleSub = (s) => `${s.name.includes(s.meter) ? '' : `${s.meter} · `}${s.bpm}\u00a0BPM`;
  /** A pick joins the recent ones (newest first, six of them). */
  const recentWith = (list, k) => [k, ...list.filter((x) => x !== k)].slice(0, 6);
  const favsWith = (list, k, on) => (on ? [...list.filter((x) => x !== k), k] : list.filter((x) => x !== k));
  // (a Pro card tapped counts as seen: its New chip goes; QA round 20)
  const openDrums = (at) => {
    closePicker = openPicker({
      title: 'Drum patterns', host: main,
      groups: GENRES.map((g) => ({ key: g.key, name: `${g.icon} ${g.name}` })),
      items: Object.values(STYLES).map((s) => ({
        key: s.key, name: s.name, group: s.genre, sub: styleSub(s), lock: styleLock(s.key), fresh: isNew(`style:${s.key}`),
      })),
      current: room.style, open: at ?? room.genre,
      favs: room.drumFavs, recent: room.drumRecent,
      // (a Pro pattern: the Pro sheet; bought, it plays; closed, the picker opens again on the group browsed)
      onLocked: (why, k, g) => { markUsed(`style:${k}`); previewStyle(k); openPro(why, { then: () => { set({ drumRecent: recentWith(room.drumRecent, k) }); pickStyle(k); }, cancel: () => openDrums(g) }); },
      onGroup: (g) => set({ genre: g }),
      onFav: (k, on) => set({ drumFavs: favsWith(room.drumFavs, k, on) }),
      onPick: (k) => { set({ drumRecent: recentWith(room.drumRecent, k) }); pickStyle(k); },
    });
  };
  // speed up's "Up to" stays above the tempo it starts from (a pattern may start at 200 BPM or more)
  const ceiling = (bpm) => (room.upTo <= bpm ? { upTo: Math.min(BPM_MAX, Math.ceil((bpm + 40) / 10) * 10) } : {});
  /** A pattern chosen: the drums on, with its metre, its usual subdivision and tempo. */
  const pickStyle = (key) => {
    const s = STYLES[key];
    markUsed(`style:${key}`);
    // (another odd-metre pattern brings its own grouping: the player's accents in that metre give way to it;
    // the pattern already chosen keeps them: QA round 18)
    const accents = { ...room.accents };
    if (s.groups && key !== room.style) delete accents[s.beats];
    saveRoom({ accents });
    set({ style: key, genre: s.genre, drums: true, beats: s.beats, sub: s.sub, ...(room.speedUp ? ceiling(s.bpm) : {}) });
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
  /** " · played 3 + 2 + 2" when the player's accents regroup an odd-metre pattern. */
  const played = (s) => {
    const r = regroup(s, groupsOf(s.beats, accentsFor(room, s)));
    return r !== s && room.beats === s.beats ? ` · played ${r.groups.join(' + ')}` : '';
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
    const s = STYLES[room.style];
    drumBlock.replaceChildren(
      h('div', { class: 'block-head' }, h('h2', {}, '🥁 Drums'), infoBtn(DRUM_INFO, 'About the drums'), drumState, h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
          class: room.drums === v ? 'on' : '',
          onClick: () => drumsOn(v),
        }, v ? 'On' : 'Off')))),
      // the pattern playing; Change opens them all (the shared picker: by genre, ★ favourites, recent)
      // (in the player's own grouping, the line says so)
      pickNow(s.name, `${GENRES.find((g) => g.key === s.genre).name} · ${styleSub(s)}${played(s)}`, openDrums),
      // fills: off by default; a crash at each phrase and a fill at its end (user, 2026-10-27)
      h('div', { class: 'room-field' }, h('label', {}, 'Fills'),
        h('div', { class: 'seg' }, [[0, 'Off'], [4, 'Every 4 bars'], [8, 'Every 8 bars']].map(([v, l]) => h('button', {
          class: room.fills === v ? 'on' : v && fillsLock() ? 'locked' : '', type: 'button',
          onClick: () => { if (v && fillsLock()) { openPro(fillsLock(), { then: () => { set({ fills: v }); drawDrums(); } }); return; } if (room.fills !== v) { set({ fills: v }); drawDrums(); } },
        }, l, v ? proChip(fillsLock()) : null)))),
      h('div', { class: 'range-line' }, h('span', {}, 'Volume'), vol, volVal));
  };
  if (room.drums) ensureKit();
  drawDrums();

  // ---------------------------------------------------------------- harmony
  const harmBlock = h('section', { class: 'block room-block harmony' });
  let curIdx = null;      // the chord sounding: its index, -1 the drone, null silent
  let chips = [];
  let chipRow = null;     // the chips' sideways row (it keeps the chord sounding and the next in view)
  const chordsNow = () => (room.harmony === 'chords' ? progression(room.hProg, room.hKey, room.beats, { notation: settings.notation }, null, room.myProg, room.myMinor) : null);
  const minorNow = () => room.harmony === 'chords' && (room.hProg === MINE ? room.myMinor : isMinor(room.hProg));
  // ---- My progression: its chords as slots, "+" to add one, a tap opens the slot's degree, chord and length
  let mineAt = null;   // the slot open for editing
  // (a tap that changes nothing does nothing: the progression is not started again)
  const setMine = (list) => { if (JSON.stringify(list) !== JSON.stringify(room.myProg)) setHarmony({ myProg: list }); else drawHarmony(); };
  const lengthName = (b) => (b === 2 ? '½ bar' : b === 4 ? '1 bar' : `${b / 4} bars`);
  // Major | Minor (QA round 17, user's choice): a chord that is its degree's usual one (as a 7th or a triad)
  // becomes the other key's usual chord on the matching degree (I → i, iii → ♭III, vi → ♭VI, vii° → ♭VII and
  // back); the chords the player chose stay. Each chord keeps what it was (`o`), so the next switch gives it
  // back exactly (QA round 18: a ♭VII chosen in major came back as vii°); an edit forgets it.
  const MAJOR_TO_MINOR = { 0: 0, 2: 2, 4: 3, 5: 5, 7: 7, 9: 8, 11: 10 };
  const plainChord = ({ o, ...c }) => c;
  const toMode = (list, minor) => {
    const map = minor ? MAJOR_TO_MINOR : Object.fromEntries(Object.entries(MAJOR_TO_MINOR).map(([a, b]) => [b, Number(a)]));
    return list.map((c) => {
      const was = { d: c.d, q: c.q };
      if (c.o) return { ...plainChord(c), d: c.o.d, q: c.o.q, o: was };
      const usual = usualQuality(c.d, !minor);
      if (c.k != null || map[c.d] == null || (c.q !== usual && c.q !== toTriad(usual))) return { ...c, o: was };
      const d = map[c.d], q = usualQuality(d, minor);
      return { ...c, d, q: c.q === usual ? q : toTriad(q), o: was };
    });
  };
  const mineEditor = () => {
    const list = room.myProg;
    const named = progression(MINE, room.hKey, 4, { notation: settings.notation }, null, list, room.myMinor);
    if (mineAt != null && !list[mineAt]) mineAt = null;
    const slots = list.map((c, i) => h('button', {
      class: `mine-slot${mineAt === i ? ' on' : ''}`,
      onClick: () => { mineAt = mineAt === i ? null : i; drawHarmony(); },
    }, h('b', {}, named[i].sym), h('small', {}, `${roman(c.d, c.q)} · ${lengthName(c.b)}`)));
    // its key's quality: My progression in a major or a minor key (spelling, scales, the Key's names)
    const quality = h('div', { class: 'seg mine-key' }, [[false, 'Major'], [true, 'Minor']].map(([v, l]) => h('button', {
      class: room.myMinor === v ? 'on' : '', type: 'button', onClick: () => { if (room.myMinor !== v) setHarmony({ myMinor: v, myProg: toMode(list, v) }); },
    }, l)));
    const { bars, padded } = mineBars(list);
    const total = h('span', { class: 'muted small mine-total' }, `${bars} bar${bars === 1 ? '' : 's'}${padded ? ' (the last chord fills its bar)' : ''}`);
    const add = list.length < 16 ? h('button', {
      class: 'mine-slot add', title: 'Add a chord', 'aria-label': 'Add a chord',
      onClick: () => { mineAt = list.length; setMine([...list, plainChord(list.at(-1))]); },
    }, '+') : null;
    let panel = null;
    if (mineAt != null) {
      const c = list[mineAt];
      const patch = (p) => setMine(list.map((x, i) => (i === mineAt ? { ...plainChord(x), ...p } : x)));
      const line = (label, ...control) => h('div', { class: 'mine-line' }, h('label', {}, label), ...control);
      panel = h('div', { class: 'mine-edit' },
        // (a new degree takes its usual chord in the key: V → V7, ii → m7; the chord can then change)
        line('Degree', sideScroll(h('div', { class: 'seg' }, DEGREES.map((name, d) => h('button', {
          class: c.d === d ? 'on' : '', onClick: () => { if (d !== c.d) patch({ d, q: usualQuality(d, room.myMinor), k: undefined }); },
        }, name))))),
        line('Chord', h('div', { class: 'seg wrap' }, QUALITIES.map(([q, l]) => h('button', { class: c.q === q ? 'on' : '', onClick: () => patch({ q }) }, l)))),
        line('Length', h('div', { class: 'seg' }, LENGTHS.map(([b, l]) => h('button', { class: c.b === b ? 'on' : '', onClick: () => patch({ b }) }, l))), h('span', { class: 'muted small' }, 'bars')),
        h('div', { class: 'mine-line end' },
          h('button', { class: 'btn small', disabled: list.length < 2, onClick: () => { const i = mineAt; mineAt = null; setMine(list.filter((_, k) => k !== i)); } }, 'Remove'),
          h('button', { class: 'btn small primary', onClick: () => { mineAt = null; drawHarmony(); } }, 'Done')));
    }
    return [h('div', { class: 'mine-head' }, quality, total), h('div', { class: 'mine-row' }, slots, add), panel];
  };
  // a progression's line under its name: its style and length (yours: its chords)
  const progGroup = (k) => HARMONY_PROGS.find(([, keys]) => keys.includes(k))?.[0] || '';
  const progSub = (k) => (k === MINE
    ? `Yours · ${room.myProg.length} chord${room.myProg.length === 1 ? '' : 's'}${room.myMinor ? ' · minor' : ''}`
    : progLine(k));
  const progLine = (k) => {
    const name = progName(k), group = progGroup(k);
    const bars = PROGS[k].chords.reduce((a, c) => a + (c[2] ?? 4), 0) / 4;
    // (a name that says its group, even in the singular, "Dorian vamp", or its length, "12-bar blues", is not
    // repeated; QA round 17)
    return [
      name.toLowerCase().includes(group.toLowerCase().replace(/s$/, '')) ? null : group,
      new RegExp(`\\b${bars}[- ]bars?\\b`).test(name) ? null : `${bars} bars`,
      isMinor(k) && !/minor/i.test(`${name} ${group}`) ? 'minor' : null,
      PROGS[k].chords.length === 1 ? '1 chord' : null,
    ].filter(Boolean).join(' · ');
  };
  const openProgs = (at) => {
    closePicker = openPicker({
      title: 'Progressions', host: main,
      groups: HARMONY_PROGS.map(([g]) => ({ key: g, name: g })),
      items: HARMONY_PROGS.flatMap(([g, keys]) => keys.map((k) => ({ key: k, name: progName(k), group: g, sub: progSub(k).split(' · ').filter((w) => w !== g && w !== 'Yours').join(' · '), lock: progLock(k), fresh: isNew(`prog:${k}`) }))),
      current: room.hProg, open: at,
      favs: room.progFavs, recent: room.progRecent,
      onLocked: (why, k, g) => { markUsed(`prog:${k}`); previewProg(k); openPro(why, { then: () => { set({ progRecent: recentWith(room.progRecent, k) }); mineAt = null; setHarmony({ hProg: k }); }, cancel: () => openProgs(g) }); },
      onFav: (k, on) => set({ progFavs: favsWith(room.progFavs, k, on) }),
      onPick: (k) => { markUsed(`prog:${k}`); set({ progRecent: recentWith(room.progRecent, k) }); mineAt = null; setHarmony({ hProg: k }); },
    });
  };
  // ---- the drone's chord (practice/drones.js; user, 2026-10-29): the shared picker, by group; stopped, a pick is heard once
  // (the open drone, root and 5th or the root and octave, has no chord: the Neck shows the player's scale over it)
  const openDrone = () => room.hQual === 'open' || room.hQual === 'root';
  const pickDrone = (k) => {
    markUsed(`drone:${k}`);
    set({ droneRecent: recentWith(room.droneRecent, k) });
    // (a chord picks the Neck's scale that fits it, Cm7 Dorian, C7♭9 half-whole; the player can change it: QA round 21)
    const d = DRONES[k];
    if (d.type || d.like) neck.setOwn(`s:${droneScale(d.type || d.like)}`);
    setHarmony({ hQual: k });
    if (!engine.playing && !engine.starting) A.chordPreview(droneMidis(room.hKey, k), room.hSound);
  };
  const openDrones = (at) => {
    // (Change itself is new for a player who had the room before the drone chords: its chip goes once opened)
    markUsed('drone:picker');
    closePicker = openPicker({
      title: 'Drone chords', host: main,
      groups: DRONE_GROUPS.map(([key, name]) => ({ key, name })),
      items: DRONE_KEYS.map((k) => ({ key: k, name: droneTitle(k), group: DRONES[k].group, sub: `${droneName(room.hKey, k, settings.notation)} · ${droneFormula(k)}`, lock: droneLock(k), fresh: isNew(`drone:${k}`) })),
      current: room.hQual, open: at,
      favs: room.droneFavs, recent: room.droneRecent,
      onLocked: (why, k, g) => { markUsed(`drone:${k}`); if (canPreview()) A.chordPreview(droneMidis(room.hKey, k), room.hSound); openPro(why, { then: () => pickDrone(k), cancel: () => openDrones(g) }); },
      onFav: (k, on) => set({ droneFavs: favsWith(room.droneFavs, k, on) }),
      onPick: pickDrone,
    });
  };
  /** A preset copied into My progression, to change it. */
  const editPreset = () => {
    if (progLock(MINE)) { openPro(progLock(MINE), { then: editPreset }); return; }
    const copy = mineFrom(room.hProg);
    // (yours is not lost without a word)
    const yours = JSON.stringify(room.myProg) !== JSON.stringify(MINE_START);
    if (yours && !confirm(`Replace My progression (${room.myProg.length} chord${room.myProg.length === 1 ? '' : 's'}) with a copy of ${progName(room.hProg)}?`)) return;
    const cut = copy.chords.length < PROGS[room.hProg].chords.length;
    mineAt = null;
    setHarmony({ myProg: copy.chords, myMinor: copy.minor, hProg: MINE });
    toast(cut ? `Copied the first ${copy.chords.length} chords (${mineBars(copy.chords).bars} bars) into My progression` : 'Copied into My progression: tap a chord to change it', 2500);
  };
  // the room's pad: brighter, and up to 4.5 times an exercise Backing's level, to be heard with a real bass
  // (user, 2026-10-23: too quiet under a real instrument; about 17 dB over an exercise's Backing at 100%);
  // the accompaniment's limiter keeps it clean
  const PAD_MAX = 4.5;
  A.setAudioOptions({ padVol: (room.hVol / 100) * PAD_MAX, padTone: 3200 });
  /** The chord sounding lit among the chips, and the Neck following it (the first chord, or the drone's key, at rest). */
  const showChord = () => {
    // (the chords already played stay full until the progression starts again)
    chips.forEach((el, i) => {
      const done = engine.playing && Number.isInteger(curIdx) && i < curIdx;
      el.classList.toggle('on', i === curIdx);
      el.classList.toggle('done', done);
      if (i !== curIdx) el.style.setProperty('--fill', done ? 1 : 0);
    });
    if (Number.isInteger(curIdx) && curIdx >= 0) chipRow?.show(chips[curIdx], chips[curIdx + 1]);
    if (room.neckShow === 'off' || room.harmony === 'off') { neck.follow(null); return; }
    if (room.harmony === 'drone') {
      if (room.neckShow === 'chord' && !openDrone()) { neck.follow(droneLead(room.hKey, room.hQual, settings.notation)); return; }
      neck.follow({ root: T.bestRoot(room.hKey, T.SCALES.ionian.iv), type: null, name: keyName(room.hKey, settings.notation) });
      return;
    }
    const ch = chordsNow();
    // (at rest, or before the first chord sounds: the progression's first chord)
    const i = Number.isInteger(curIdx) && curIdx >= 0 && curIdx < ch.length ? curIdx : 0;
    const c = ch[i];
    // the next change: the next chord that is not this one again
    const next = ch.slice(i + 1).concat(ch.slice(0, i)).find((x) => x.sym !== c.sym);
    // its scale by its function in the key, as the chord-scale exercise teaches (ii Dorian, V Mixolydian…)
    const scale = room.neckShow === 'scale' ? scaleFor(c, next, ch) : null;
    neck.follow({ root: c.root, type: scale ? null : c.type, scale, chord: c.type, name: c.sym, next: next?.sym || null });
  };
  const setHarmony = (patch) => {
    // (stopped, a chord tapped on the old progression is forgotten when it changes: QA round 17)
    if (!engine.playing && ['harmony', 'hProg', 'hKey', 'myProg', 'myMinor'].some((k) => k in patch)) curIdx = null;
    set(patch);
    drawHarmony();
  };
  const drawHarmony = () => {
    const mode = room.harmony;
    harmBlock.classList.toggle('off', mode === 'off');
    const minor = minorNow();
    // (an open drone is named as the Neck's own scale or chord names its root: C♯ under C♯ Dorian or C♯m7, A♭ under
    // A♭ Altered, QA round 17; a drone on a chord as its chord names it: D♭, C♯m)
    const nameOf = (p) => (mode === 'drone' ? T.noteName(openDrone() ? neck.rootName(p) : droneRoot(p, room.hQual), settings.notation) : keyName(p, settings.notation, minor));
    const keySel = h('select', { class: 'mini-sel', 'aria-label': 'Key' }, T.CHROMATIC_PC.map((p) => h('option', { value: p, selected: p === room.hKey }, nameOf(p))));
    keySel.addEventListener('change', () => setHarmony({ hKey: Number(keySel.value) }));
    const progNow = pickNow(progName(room.hProg), progSub(room.hProg), openProgs);
    // the drone's chord beside the key (user, 2026-10-29), "New" until its picker is first opened (QA round 21:
    // the cards keep their own chips, as the patterns' and progressions' do)
    const droneNow = pickNow(droneName(room.hKey, room.hQual, settings.notation), `${droneTitle(room.hQual)} · ${droneFormula(room.hQual)}`, openDrones);
    if (isNew('drone:picker')) droneNow.querySelector('.pick-text b').append(' ', newChip(true));
    const vol = h('input', { type: 'range', min: 0, max: 100, step: 1, value: room.hVol, 'aria-label': 'Harmony volume' });
    const volVal = h('b', { class: 'rl-val' }, `${room.hVol}%`);
    vol.addEventListener('input', () => {
      const v = Number(vol.value);
      set({ hVol: v });
      A.setAudioOptions({ padVol: (v / 100) * PAD_MAX });
      volVal.textContent = `${v}%`;
    });
    const ch = chordsNow();
    // (stopped, a tap on a chord shows it on the neck, to find its notes before playing; user, 2026-10-23)
    chips = ch ? ch.map((c, i) => h('button', {
      class: 'chord-chip', type: 'button', title: 'Show it on the neck and hear it', 'data-silent': '',
      onClick: () => {
        if (engine.playing || engine.starting) { toast('Stop to look at a chord on the neck'); return; }
        curIdx = i;
        showChord();
        // (and heard once, in the harmony's sound: user, 2026-10-23)
        A.chordPreview(c.midis, room.hSound);
      },
    }, h('span', {}, c.sym))) : [];
    chipRow = ch ? sideScroll(h('div', { class: 'chord-row' }, chips)) : null;
    // above the Neck: Follow, then the chords (or the drone's key), so the two fit one screen
    // what the neck shows: the chord sounding, its scale, or the player's own choice (over a drone: the
    // player's scale on its key, or their own choice)
    // (over the open drone, root and 5th, there is no chord to show: Scale | Off, as before)
    const shows = mode === 'chords' || !openDrone() ? [['chord', 'Chord'], ['scale', 'Scale'], ['off', 'Off']] : [['scale', 'Scale'], ['off', 'Off']];
    const lit = mode === 'drone' && openDrone() && room.neckShow === 'chord' ? 'scale' : room.neckShow;
    neck.setBar(mode === 'off' ? null : h('div', { class: 'harm-bar' },
      h('div', { class: 'seg', title: 'What the neck shows' }, shows.map(([v, l]) => h('button', {
        class: lit === v ? 'on' : '',
        onClick: () => setHarmony({ neckShow: v }),
      }, l))),
      chipRow || h('span', { class: 'drone-tag' }, openDrone() ? `Drone on ${nameOf(room.hKey)}` : `Drone: ${droneName(room.hKey, room.hQual, settings.notation)}`)));
    harmBlock.replaceChildren(...[
      h('div', { class: 'block-head' }, h('h2', {}, '🎹 Harmony'), infoBtn(HARMONY_INFO, 'About the harmony'), h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, [['off', 'Off'], ['drone', 'Drone'], ['chords', 'Chords']].map(([v, l]) => h('button', {
          class: mode === v ? 'on' : '',
          onClick: () => { if (room.harmony !== v) { curIdx = null; setHarmony({ harmony: v }); } },
        }, l)))),
      mode === 'off' ? null : h('div', { class: 'harm-row' },
        h('label', {}, 'Key'), keySel,
        mode === 'chords' ? progNow : null,
        mode === 'drone' ? droneNow : null,
        mode === 'chords' && room.hProg !== MINE ? h('button', { class: `btn small${progLock(MINE) ? ' locked' : ''}`, title: 'Copy it into My progression to change it', onClick: editPreset }, '✎ Edit', proChip(progLock(MINE))) : null),
      ...(mode === 'chords' && room.hProg === MINE ? mineEditor() : []),
      // its sound: synthesised, but the piano (recorded, loaded the first time it is picked)
      mode === 'off' ? null : h('div', { class: 'room-field' }, h('label', {}, 'Sound'),
        h('div', { class: 'seg' }, [['pad', 'Pad'], ['epiano', 'E-piano'], ['piano', 'Piano'], ['organ', 'Organ'], ['guitar', 'Guitar'], ['arp', 'Arpeggio']].map(([v, l]) => h('button', {
          class: room.hSound === v ? 'on' : soundLock(v) ? 'locked' : '', type: 'button',
          onClick: () => { if (soundLock(v)) { markUsed(`sound:${v}`); previewSound(v); openPro(soundLock(v), { then: () => { markUsed(`sound:${v}`); setHarmony({ hSound: v }); ensurePiano(); } }); return; } markUsed(`sound:${v}`); if (room.hSound !== v) { setHarmony({ hSound: v }); ensurePiano(); } else redraw(); },
        }, l, newChip(isNew(`sound:${v}`)), proChip(soundLock(v))))), pianoState),
      mode === 'off' ? null : h('div', { class: 'range-line' }, h('span', {}, 'Volume'), vol, volVal),
    ].filter(Boolean));
    showChord();
  };

  // ---------------------------------------------------------------- neck (the former Neck explorer)
  const neck = neckPanel({ onOwn: () => { if (room.harmony === 'drone') drawHarmony(); } });
  drawHarmony();
  if (room.harmony !== 'off') ensurePiano();

  // −5 and +5 beside the tempo, − and + (one at a time) at the slider's ends (user, 2026-10-26)
  const slower = holdButton('−', 'Slower', () => setTempo(room.bpm - 1), 'small');
  const faster = holdButton('+', 'Faster', () => setTempo(room.bpm + 1), 'small');
  const slower5 = holdButton('−5', '5 BPM slower', () => setTempo(room.bpm - 5), 'step5');
  const faster5 = holdButton('+5', '5 BPM faster', () => setTempo(room.bpm + 5), 'step5');

  const onKey = (e) => {
    if (e.target.closest?.('input, select, textarea') || main.querySelector('.picker-backdrop')) return;
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
            slower5,
            h('div', { class: 'tempo-show' }, bpmEl, unitEl, nameEl),
            faster5,
            tapBtn),
          h('div', { class: 'tempo-slide' }, slower, slider, faster),
          lights,
          grouping,
          beatOpts),
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
    // (Pro bought or taken back: the blocks redraw in place, so what was playing goes on)
    proChanged: () => { const free = freeRoom(room); if (free) set(free); redraw(); },
    dispose: () => {
      engine.stop();
      stopPreview();
      for (const b of [slower, faster, slower5, faster5]) b.stopHold();
      neck.dispose();
      closePicker?.('route');
      // (an exercise's Backing has its own level)
      A.setAudioOptions({ padVol: 1, padTone: 1500 });
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
      removeEventListener('resize', placeFab);
    },
  };
}
