// The Practice room (#/practice): a simple metronome as it opens: the tempo, tap tempo, beats per bar
// and a big start button. One row deeper: clicks per beat, the accent, muted bars and the speed
// trainer. Drums and harmony join as layers the player switches on.
import { h, icon, infoBtn } from './dom.js';
import * as A from '../audio.js';
import { Room } from '../practice/engine.js';
import { room, saveRoom, SUBS, GAPS, TRAINER } from '../practice/state.js';

const INFO = [
  '⏱ A metronome on its own: set the tempo and press Start',
  '👆 Tap: tap the beat and the tempo follows',
  '🔇 Muted bars: the click stops for some bars, you keep the time',
  '📈 Speed up: a little faster every 4 bars',
  '⌨ Space starts and stops, + and − change the tempo',
];
const SUB_LABELS = { 1: '♩', 2: '♪♪', 3: '3', 4: '4' };
const SUB_NAMES = { 1: 'Beats', 2: '8ths', 3: 'Triplets', 4: '16ths' };

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

export function practiceScreen(main) {
  const lights = h('div', { class: 'beat-lights' });
  const bpmEl = h('b', { class: 'tempo-num' });
  const nameEl = h('span', { class: 'tempo-name' });
  const slider = h('input', { type: 'range', min: 30, max: 260, step: 1, class: 'tempo-slider', 'aria-label': 'Tempo' });
  const playBtn = h('button', { class: 'btn primary room-play' });
  const opts = h('div', { class: 'room-opts' });
  const queue = [];   // scheduled ticks waiting to be shown when they sound
  let raf = null;

  const engine = new Room(room, {
    onTick: (t) => { queue.push(t); },
  });

  const showTempo = (bpm) => {
    bpmEl.textContent = bpm;
    nameEl.textContent = tempoName(bpm);
    slider.value = bpm;
  };
  const setTempo = (bpm) => {
    bpm = Math.max(30, Math.min(260, Math.round(bpm)));
    saveRoom({ bpm });
    engine.set({ bpm });
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
      showTempo(room.bpm);   // (the speed trainer's climb ends; the tempo set stays)
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

  const seg = (key, values, label) => h('div', { class: 'seg' }, values.map((v) => h('button', {
    class: room[key] === v ? 'on' : '',
    onClick: () => { saveRoom({ [key]: v }); engine.set({ [key]: v }); drawOpts(); drawLights(); },
  }, label(v))));
  const field = (name, control) => h('div', { class: 'room-field' }, h('label', {}, name), control);
  const drawOpts = () => {
    opts.replaceChildren(
      field('Beats per bar', h('div', { class: 'stepper' },
        h('button', { class: 'btn round small', 'aria-label': 'Fewer beats', onClick: () => { if (room.beats > 1) { saveRoom({ beats: room.beats - 1 }); engine.set({ beats: room.beats }); drawOpts(); drawLights(); } } }, '−'),
        h('b', {}, room.beats),
        h('button', { class: 'btn round small', 'aria-label': 'More beats', onClick: () => { if (room.beats < 12) { saveRoom({ beats: room.beats + 1 }); engine.set({ beats: room.beats }); drawOpts(); drawLights(); } } }, '+'))),
      field('Clicks', h('div', { class: 'seg' }, SUBS.map((v) => h('button', {
        class: room.sub === v ? 'on' : '', title: SUB_NAMES[v],
        onClick: () => { saveRoom({ sub: v }); engine.set({ sub: v }); drawOpts(); },
      }, SUB_LABELS[v])))),
      field('Accent on 1', seg('accent', [true, false], (v) => (v ? 'On' : 'Off'))),
      field('Muted bars', seg('gap', GAPS, (v) => (v ? `${v} + ${v}` : 'Off'))),
      field('Speed up', seg('trainer', TRAINER, (v) => (v ? `+${v}` : 'Off'))));
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
    h('div', { class: 'page-head' }, h('h1', {}, 'Practice room'), infoBtn(INFO, 'About the practice room')),
    h('div', { class: 'room' },
      h('section', { class: 'block room-main' },
        h('div', { class: 'tempo-row' },
          holdButton('−', 'Slower', () => setTempo(room.bpm - 1)),
          h('div', { class: 'tempo-show' }, bpmEl, h('span', { class: 'tempo-unit' }, 'BPM'), nameEl),
          holdButton('+', 'Faster', () => setTempo(room.bpm + 1)),
          h('button', { class: 'btn tap-btn', title: 'Tap the beat', onClick: tap }, '👆 Tap')),
        slider,
        lights,
        playBtn),
      h('section', { class: 'block room-side' }, opts)));
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
