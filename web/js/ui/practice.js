// The Practice room (#/practice). Its first block is the metronome: the tempo, tap tempo, beat lights and
// Start beside its settings (beats per bar, subdivision, accent, muted bars, speed up). Drums and
// harmony join as blocks of their own below it.
import { h, icon, infoBtn } from './dom.js';
import * as A from '../audio.js';
import { Room } from '../practice/engine.js';
import { room, saveRoom, SUBS } from '../practice/state.js';

const INFO = [
  '⏱ Set the tempo and press Start (Space on a keyboard)',
  '👆 Tap: tap the beat and the tempo follows (T)',
  '🎵 Subdivision: a click on every quarter, 8th, triplet or 16th',
  '🔇 Muted bars: the click plays some bars and stops for others, you keep the time',
  '📈 Speed up: a few BPM faster every few bars',
];
const SUB_NAMES = { 1: 'Quarter notes', 2: '8ths', 3: 'Triplets', 4: '16ths' };

// subdivision icons, drawn (phone fonts may lack the note characters): a quarter, two 8ths, a triplet, four 16ths
const head = (x, y, r = 3.2) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${(r * 0.72).toFixed(2)}" transform="rotate(-20 ${x} ${y})"/>`;
const stem = (x, y1, y2) => `<rect x="${x - 0.7}" y="${y2}" width="1.4" height="${y1 - y2}"/>`;
const beam = (x1, x2, y) => `<path d="M${x1 - 0.7} ${y}H${x2 + 0.7}v2.6H${x1 - 0.7}z"/>`;
const notes = (w, body) => `<svg viewBox="0 0 ${w} 24" height="22" aria-hidden="true" fill="currentColor">${body}</svg>`;
const SUB_ICONS = {
  1: notes(14, head(6, 18.5) + stem(8.9, 18, 3.5)),
  2: notes(23, head(5, 18.5) + head(16, 18.5) + stem(7.9, 18, 5) + stem(18.9, 18, 5) + beam(7.9, 18.9, 5)),
  3: notes(31, [4.4, 14, 23.6].map((x) => head(x, 19.2, 2.9) + stem(x + 2.6, 18.7, 8)).join('') + beam(7, 26.2, 8)
    + '<text x="16.6" y="6.2" text-anchor="middle" font-size="7.5" font-weight="800" font-family="system-ui, sans-serif">3</text>'),
  4: notes(31, [3.9, 11.4, 18.9, 26.4].map((x) => head(x, 19.2, 2.7) + stem(x + 2.4, 18.7, 4)).join('') + beam(6.3, 28.8, 4) + beam(6.3, 28.8, 8.2)),
};

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
      if (t.sub === 0) {
        [...lights.children].forEach((el, i) => el.classList.toggle('lit', i === t.beat));
        lights.classList.toggle('muted', t.muted);
      }
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
    opts.replaceChildren(
      field('Beats per bar', h('div', { class: 'stepper' },
        h('button', { class: 'btn round small', 'aria-label': 'Fewer beats', onClick: () => { if (room.beats > 1) { set({ beats: room.beats - 1 }); drawOpts(); drawLights(); } } }, '−'),
        h('b', {}, room.beats),
        h('button', { class: 'btn round small', 'aria-label': 'More beats', onClick: () => { if (room.beats < 12) { set({ beats: room.beats + 1 }); drawOpts(); drawLights(); } } }, '+'))),
      field('Subdivision', h('div', { class: 'seg note-seg' }, SUBS.map((v) => h('button', {
        class: room.sub === v ? 'on' : '', title: SUB_NAMES[v], 'aria-label': SUB_NAMES[v], html: SUB_ICONS[v],
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
            h('div', { class: 'tempo-show' }, bpmEl, h('span', { class: 'tempo-unit' }, 'BPM'), nameEl),
            holdButton('+', 'Faster', () => setTempo(room.bpm + 1)),
            h('button', { class: 'btn tap-btn', title: 'Tap the beat', onClick: tap }, '👆 Tap')),
          slider,
          lights,
          playBtn),
        opts)));
  showTempo(room.bpm);
  drawLights();
  drawPlay();
  drawOpts();

  return {
    dispose: () => {
      engine.stop();
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKey);
    },
  };
}
