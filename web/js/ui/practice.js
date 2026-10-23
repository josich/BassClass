// The Practice room (#/practice). Its first block is the metronome: the tempo, tap tempo, beat lights and
// Start beside its settings (beats per bar, subdivision, accent, muted bars, speed up). Drums and
// harmony join as blocks of their own below it.
import { h, icon, infoBtn, toast } from './dom.js';
import * as A from '../audio.js';
import { Room } from '../practice/engine.js';
import { room, saveRoom, SUBS } from '../practice/state.js';
import { STYLES, GENRES, levelsOf } from '../practice/styles.js';
import { loadKit, kitReady } from '../drums.js';
import { neckPanel } from './neck.js';

const INFO = [
  '⏱ Set the tempo and press Start (Space on a keyboard)',
  '👆 Tap: tap the beat and the tempo follows (T)',
  '🎵 Subdivision: a click on every quarter, 8th, triplet or 16th; with the drums, how much of the pattern plays (16ths add its ghost-note fills, triplets swing a straight groove)',
  '🔇 Muted bars: the click plays some bars and stops for others, you keep the time',
  '📈 Speed up: a few BPM faster every few bars',
  '🔈 Click off: the beat lights and the drums keep the time',
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

/** The tempo's Italian name, as on a metronome. */
function tempoName(bpm) {
  return bpm < 60 ? 'Largo' : bpm < 66 ? 'Larghetto' : bpm < 76 ? 'Adagio' : bpm < 108 ? 'Andante'
    : bpm < 120 ? 'Moderato' : bpm < 168 ? 'Allegro' : bpm < 200 ? 'Presto' : 'Prestissimo';
}

/** A button that repeats while held (− and + on the tempo). */
function holdButton(label, title, step) {
  let wait = null, rep = null;
  const stop = () => { clearTimeout(wait); clearInterval(rep); wait = rep = null; };
  const btn = h('button', { class: 'btn round', title, 'aria-label': title }, label);
  btn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    step();
    wait = setTimeout(() => { rep = setInterval(step, 70); }, 380);
  });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) btn.addEventListener(ev, stop);
  // (keyboard: Enter or Space on the focused button)
  btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); step(); } });
  return btn;
}

const bars = (n) => `${n} bar${n === 1 ? '' : 's'}`;

export function practiceScreen(main) {
  const lights = h('div', { class: 'beat-lights' });
  const bpmEl = h('b', { class: 'tempo-num' });
  const nameEl = h('span', { class: 'tempo-name' });
  const unitEl = h('span', { class: 'tempo-unit' });
  /** The drum pattern playing, if the drums are on. */
  const pattern = () => (room.drums ? STYLES[room.style] : null);
  // "BPM" with the note the beat is (a dotted quarter in 12/8, an 8th in 7/8)
  const drawUnit = () => unitEl.replaceChildren('BPM', h('span', { class: 'beat-ic', title: 'The beat', html: ICONS[BEAT_ICON[pattern()?.beat || 'q']] }));
  const slider = h('input', { type: 'range', min: 30, max: 260, step: 1, class: 'tempo-slider', 'aria-label': 'Tempo' });
  const playBtn = h('button', { class: 'btn primary room-play' });
  const opts = h('div', { class: 'metro-opts' });
  const queue = [];   // scheduled ticks waiting to be shown when they sound
  let raf = null;

  const engine = new Room(room, {
    onTick: (t) => { queue.push(t); },
  });
  const set = (patch) => { saveRoom(patch); engine.set(patch); };

  const showTempo = (bpm) => {
    bpmEl.textContent = bpm;
    nameEl.textContent = tempoName(bpm);
    slider.value = bpm;
  };
  const setTempo = (bpm) => {
    bpm = Math.max(30, Math.min(260, Math.round(bpm)));
    set({ bpm });
    showTempo(bpm);
  };
  const drawLights = () => {
    lights.replaceChildren(...Array.from({ length: room.beats }, (_, i) => h('i', { class: i === 0 && room.accent ? 'accent' : '' })));
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
    if (t) {
      [...lights.children].forEach((el, i) => el.classList.toggle('lit', i === t.beat));
      lights.classList.toggle('muted', t.muted);
      if (t.bpm !== Number(bpmEl.textContent)) showTempo(t.bpm);
    }
    raf = engine.playing ? requestAnimationFrame(frame) : null;
  };
  const toggle = async () => {
    queue.length = 0;
    if (engine.playing || engine.starting) {
      engine.stop();
      [...lights.children].forEach((el) => el.classList.remove('lit'));
      lights.classList.remove('muted');
      showTempo(room.bpm);   // (the speed-up climb ends; the tempo set stays)
      drawPlay();
      return;
    }
    await engine.start();
    if (engine.playing && !raf) raf = requestAnimationFrame(frame);
    drawPlay();
  };
  playBtn.addEventListener('click', toggle);
  slider.addEventListener('input', () => setTempo(Number(slider.value)));

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
  const drawOpts = () => {
    // (a line that does nothing with the other one at 0 is greyed: "Play" with no muted bars, "Every" with no speed-up)
    const dim = () => {
      opts.querySelector('[data-key="play"]')?.classList.toggle('off', !room.mute);
      opts.querySelector('[data-key="upEvery"]')?.classList.toggle('off', !room.upBy);
    };
    // (with the drums on, their style sets the beats per bar)
    const fixed = room.drums ? () => toast(`The drum style sets the beats: ${STYLES[room.style].meter}`) : null;
    opts.replaceChildren(
      field('Click', h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
        class: room.click === v ? 'on' : '',
        onClick: () => { set({ click: v }); drawOpts(); },
      }, v ? 'On' : 'Off')))),
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
      h('div', { class: 'room-group' }, h('label', {}, 'Speed up'),
        rangeLine('upBy', 0, 10, 'Add', (v) => (v ? `+${v} BPM` : 'Off'), dim),
        rangeLine('upEvery', 1, 16, 'Every', bars, dim)));
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
  const redraw = () => { drawDrums(); drawOpts(); drawLights(); drawUnit(); };
  /** A pattern chosen: the drums on, with its metre, its usual subdivision and tempo. */
  const pickStyle = (key) => {
    const s = STYLES[key];
    set({ style: key, genre: s.genre, drums: true, beats: s.beats, sub: s.sub });
    setTempo(s.bpm);
    ensureKit();
    redraw();
    toast(`${s.name} · ${s.meter} · ${s.bpm} BPM`);
  };
  /** Drums on (the pattern's metre, keeping the tempo) or off (the plain metronome). */
  const drumsOn = (on) => {
    const s = STYLES[room.style];
    if (on) set({ drums: true, beats: s.beats, ...(levelsOf(s).includes(room.sub) ? {} : { sub: s.sub }) });
    else set({ drums: false, ...(SUBS.includes(room.sub) ? {} : { sub: 2 }) });
    if (on) ensureKit();
    redraw();
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
    drumBlock.replaceChildren(
      h('div', { class: 'block-head' }, h('h2', {}, '🥁 Drums'), infoBtn(DRUM_INFO, 'About the drums'), drumState, h('div', { class: 'grow' }),
        h('div', { class: 'seg' }, [true, false].map((v) => h('button', {
          class: room.drums === v ? 'on' : '',
          onClick: () => drumsOn(v),
        }, v ? 'On' : 'Off')))),
      // a genre, then its patterns
      h('div', { class: 'genre-tabs' }, GENRES.map((g) => h('button', {
        class: `${room.genre === g.key ? 'on' : ''}${STYLES[room.style].genre === g.key ? ' playing' : ''}`,
        onClick: () => { set({ genre: g.key }); drawDrums(); },
      }, `${g.icon} ${g.name}`))),
      h('div', { class: 'style-grid' }, GENRES.find((g) => g.key === room.genre).styles.map((st) => h('button', {
        class: `style-chip${room.style === st.key ? ' on' : ''}`,
        onClick: () => pickStyle(st.key),
      }, h('b', {}, st.name), h('span', {}, `${st.meter} · ${st.bpm} BPM`)))),
      h('div', { class: 'range-line' }, h('span', {}, 'Volume'), vol, volVal));
  };
  if (room.drums) ensureKit();
  drawDrums();

  // ---------------------------------------------------------------- neck (the former Neck explorer)
  const neck = neckPanel();

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
            holdButton('−', 'Slower', () => setTempo(room.bpm - 1)),
            h('div', { class: 'tempo-show' }, bpmEl, unitEl, nameEl),
            holdButton('+', 'Faster', () => setTempo(room.bpm + 1)),
            h('button', { class: 'btn tap-btn', title: 'Tap the beat', onClick: tap }, '👆 Tap')),
          slider,
          lights,
          playBtn),
        opts)),
    drumBlock,
    neck.el);
  showTempo(room.bpm);
  drawLights();
  drawPlay();
  drawOpts();
  drawUnit();

  return {
    dispose: () => {
      engine.stop();
      neck.dispose();
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    },
  };
}
