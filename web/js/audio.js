// Web Audio engine: recorded bass samples (when installed under web/audio/bass/),
// a physical-model fallback voice, natural harmonics and the metronome click.
import { midiToFreq } from './theory.js';

let ac = null;
let bassBus, bassVolume, clickBus, fullPath, phonePath, padBus, drumBus;
const synthCache = new Map();
// route: what the Android app reports ('speaker' | 'external'), or null in a browser
const opts = { bassVol: 2, clickVol: 0.6, drumVol: 0.8, route: null };
const PHONE_BOOST = 15; // dB lifted around 850 Hz on the phone speaker

// The Android app tells us when headphones or an external speaker are connected (see MainActivity.kt).
try { if (window.BassClassNative?.audioRoute) opts.route = window.BassClassNative.audioRoute(); } catch { /* not in the app */ }
window.addEventListener('bassclass-route', (e) => { opts.route = e.detail; applyProfile(); });

/**
 * Phone speakers cannot play a bass's notes (they start around 500 Hz, the open E is 41 Hz). The
 * phone-speaker profile uses only the real recording: it cuts the inaudible lows (which only waste
 * headroom), lifts the band where the string's own overtones and the finger's growl live (~850 Hz,
 * by PHONE_BOOST dB) and trims the treble so it stays soft.
 * Measured offline on a low-register phrase at 200% with +12 dB: +9 dB in the 600 Hz–2 kHz band
 * with the treble unchanged. Two earlier versions added synthetic harmonics instead (a waveshaper,
 * then per-note overtone voices): louder, but on a phone they sounded distorted, then harsh/synthetic.
 * The owner tuned it on a real phone and fixed it at +15 dB, the maximum (2026-10-15).
 * Only the Android app uses it: it knows when the phone's own speaker plays and switches when
 * headphones or a speaker take over. A browser cannot see headphones, so there the natural sound
 * always plays (owner's choice, 2026-10-15).
 */
export function phoneProfile() {
  return opts.route === 'speaker';
}

function applyProfile() {
  const phone = phoneProfile();
  if (fullPath) {
    const t = ac.currentTime;
    fullPath.gain.setTargetAtTime(phone ? 0 : 1, t, 0.03);
    phonePath.gain.setTargetAtTime(phone ? 1 : 0, t, 0.03);
  }
}

// ------------------------------------------------------------------ context & routing

/** Soft clip: unity gain up to 0.85, then a smooth knee that never passes 1. */
function softClipCurve(knee = 0.85) {
  const c = new Float32Array(4097);
  for (let i = 0; i < c.length; i++) {
    const x = i / 2048 - 1, ax = Math.abs(x);
    c[i] = Math.sign(x) * (ax <= knee ? ax : knee + (1 - knee) * Math.tanh((ax - knee) / (1 - knee)));
  }
  return c;
}

export function audioCtx() {
  if (!ac) {
    const AC = window.AudioContext || window.webkitAudioContext;
    ac = new AC({ latencyHint: 'interactive' });
    // Output: the bass is driven into a fast limiter and a gentle soft clip, so phone speakers get
    // a loud, dense signal without distortion. Measured offline: RMS -8.6 dB at 100% and -7.4 dB at
    // 200%, and the limiter output never reaches the clip's saturated range (|x| > 1).
    const mix = ac.createGain();
    mix.gain.value = 1.6;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = -4;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.06;
    const clip = ac.createWaveShaper();
    clip.curve = softClipCurve();
    clip.oversample = '2x';
    mix.connect(limiter).connect(clip).connect(ac.destination);

    // bass tone stack: a touch of low end and a gentle top roll-off, like a clean amp,
    // then gentle compression; the volume setting comes after it so it really changes the level
    bassBus = ac.createGain();
    const low = ac.createBiquadFilter();
    low.type = 'lowshelf'; low.frequency.value = 110; low.gain.value = 2.5;
    const mid = ac.createBiquadFilter();
    mid.type = 'peaking'; mid.frequency.value = 420; mid.Q.value = 0.8; mid.gain.value = -1.5;
    const top = ac.createBiquadFilter();
    top.type = 'lowpass'; top.frequency.value = 5200; top.Q.value = 0.4;
    const glue = ac.createDynamicsCompressor();
    glue.threshold.value = -24;
    glue.knee.value = 10;
    glue.ratio.value = 3;
    glue.attack.value = 0.005;
    glue.release.value = 0.15;
    bassVolume = ac.createGain();
    bassVolume.gain.value = opts.bassVol;
    bassBus.connect(low).connect(mid).connect(top);
    glue.connect(bassVolume).connect(mix);
    const filter = (type, freq, q = 0.7, gain = 0) => {
      const f = ac.createBiquadFilter();
      f.type = type; f.frequency.value = freq; f.Q.value = q; f.gain.value = gain;
      return f;
    };
    const phone = phoneProfile();
    // natural sound (headphones, amp, external speaker)
    fullPath = ac.createGain();
    fullPath.gain.value = phone ? 0 : 1;
    top.connect(fullPath).connect(glue);
    // phone speaker: cut below ~200 Hz (inaudible there, it only eats headroom), lift the string's
    // own overtones around 850 Hz, and trim the treble so the finger noise does not turn harsh
    phonePath = ac.createGain();
    phonePath.gain.value = phone ? 1 : 0;
    top.connect(filter('highpass', 200)).connect(filter('highpass', 200)).connect(filter('peaking', 850, 0.6, PHONE_BOOST))
      .connect(filter('highshelf', 3000, 0.7, -5)).connect(phonePath).connect(glue);

    // the metronome joins after the limiter, so a click never pushes the bass down
    clickBus = ac.createGain();
    clickBus.gain.value = opts.clickVol;
    clickBus.connect(clip);

    // backing pad (drone or chords): soft, warm and after the limiter, so it never ducks the bass
    padBus = ac.createGain();
    // with the bass at full level the sum stays inside the soft clip's knee (no hard clipping)
    padBus.gain.value = 0.38;
    const padTone = ac.createBiquadFilter();
    padTone.type = 'lowpass'; padTone.frequency.value = 1500; padTone.Q.value = 0.3;
    padBus.connect(padTone).connect(clip);

    // drums (the Practice room): their own fast limiter, then after the bass's, so a kick never ducks the bass
    drumBus = ac.createGain();
    drumBus.gain.value = opts.drumVol;
    const drumLimit = ac.createDynamicsCompressor();
    drumLimit.threshold.value = -8;
    drumLimit.knee.value = 4;
    drumLimit.ratio.value = 10;
    drumLimit.attack.value = 0.002;
    drumLimit.release.value = 0.12;
    drumBus.connect(drumLimit).connect(clip);
    decodeBank();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** bassVol: 0–2 (Settings shows it as 0–100%; above 1 the bass is pushed into the limiter). */
export function setAudioOptions(o) {
  Object.assign(opts, o);
  if (bassVolume) bassVolume.gain.value = opts.bassVol;
  if (clickBus) clickBus.gain.value = opts.clickVol;
  if (drumBus) drumBus.gain.value = opts.drumVol;
}

/** Where drum hits go (web/js/drums.js). */
export function drumOut() {
  audioCtx();
  return drumBus;
}

export const now = () => (ac ? ac.currentTime : 0);

// ------------------------------------------------------------------ sample bank

const bank = { reg: new Map(), ghost: new Map(), info: null, raw: null, ready: false };

/** Fetch the sample manifest and audio files (decoded once a context exists). */
export async function loadBank(base = 'audio/bass/') {
  if (bank.raw) return bank.raw;
  bank.raw = (async () => {
    try {
      const res = await fetch(`${base}manifest.json`);
      if (!res.ok) return null;
      const man = await res.json();
      bank.info = man;
      const files = [];
      for (const kind of ['reg', 'ghost']) {
        for (const [midi, file] of Object.entries(man[kind] || {})) files.push({ kind, midi: Number(midi), url: base + file });
      }
      const out = [];
      for (let i = 0; i < files.length; i += 8) {
        const chunk = await Promise.all(files.slice(i, i + 8).map(async (f) => {
          const r = await fetch(f.url);
          return r.ok ? { ...f, data: await r.arrayBuffer() } : null;
        }));
        out.push(...chunk.filter(Boolean));
      }
      return out;
    } catch {
      return null;
    }
  })();
  const raw = await bank.raw;
  if (ac) await decodeBank();
  return raw;
}

function decodeBank() {
  if (!bank.decodeP) {
    bank.decodeP = (async () => {
      const raw = await bank.raw;
      if (!raw) { bank.decodeP = null; return; }
      bank.decoding = true;
      await Promise.all(raw.map(async (f) => {
        try {
          const buf = await ac.decodeAudioData(f.data.slice(0));
          bank[f.kind].set(f.midi, buf);
        } catch { /* skip undecodable file */ }
      }));
      bank.ready = bank.reg.size > 0;
      bank.decoding = false;
    })();
  }
  return bank.decodeP;
}

export const samplesReady = () => bank.ready;

/** Resolve once the recorded samples are decoded (or immediately if there are none). */
export async function whenReady(timeoutMs = 2500) {
  if (bank.ready) return;
  audioCtx();
  const t0 = performance.now();
  const raw = await Promise.race([bank.raw, new Promise((r) => setTimeout(r, timeoutMs))]);
  if (!raw) return;
  await decodeBank();
  while (!bank.ready && bank.decoding && performance.now() - t0 < timeoutMs) await new Promise((r) => setTimeout(r, 50));
}
export const sampleInfo = () => bank.info;

// up to an octave of resampling: the top sample is E4 (64), the 6-string neck reaches C5 (72)
function nearest(map, midi, maxShift = 12) {
  let best = null;
  for (const m of map.keys()) {
    const d = Math.abs(m - midi);
    if (d <= maxShift && (!best || d < best.d)) best = { d, m };
  }
  return best ? { midi: best.m, buffer: map.get(best.m) } : null;
}

function useSamples() {
  return bank.ready;
}

// ------------------------------------------------------------------ physical-model fallback

/**
 * Extended Karplus-Strong string: fractional-delay tuning, a finger pluck
 * excitation at 1/6 of the string, frequency-dependent loss and a pickup
 * comb filter, plus a short finger-noise transient.
 */
function synthBuffer(midi) {
  if (synthCache.has(midi)) return synthCache.get(midi);
  const sr = ac.sampleRate;
  const f = midiToFreq(midi);
  const len = Math.floor(sr * 3.2);
  const buf = ac.createBuffer(1, len, sr);
  const d = buf.getChannelData(0);
  const P = sr / f;
  const N = Math.max(4, Math.floor(P - 0.5));
  const frac = P - 0.5 - N;
  const C = (1 - frac) / (1 + frac);
  const ring = new Float32Array(N);
  const pp = Math.max(2, Math.round(N * 0.17));
  for (let i = 0; i < N; i++) ring[i] = (i < pp ? i / pp : (N - i) / (N - pp)) * 0.85 + (Math.random() * 2 - 1) * 0.15;
  for (let pass = 0; pass < 2; pass++) { let lp = ring[0]; for (let i = 0; i < N; i++) { lp += 0.45 * (ring[i] - lp); ring[i] = lp; } }
  let mean = 0;
  for (let i = 0; i < N; i++) mean += ring[i];
  mean /= N;
  for (let i = 0; i < N; i++) ring[i] -= mean;
  const t60 = Math.max(0.9, 3.4 - (midi - 23) * 0.05);
  const rho = Math.pow(0.001, 1 / (f * t60));
  const S = 0.5 - Math.min(0.18, (midi - 23) * 0.004);
  const hist = new Float32Array(len);
  let idx = 0, apX = 0, apY = 0, prev = 0;
  for (let i = 0; i < len; i++) {
    const x = ring[idx];
    hist[i] = x;
    const lpf = rho * ((1 - S) * x + S * prev);
    prev = x;
    const y = C * lpf + apX - C * apY;
    apX = lpf; apY = y;
    ring[idx] = y;
    idx = idx + 1 === N ? 0 : idx + 1;
  }
  const pick = Math.max(1, Math.round(P * 0.22));
  let pk = 0;
  for (let i = 0; i < len; i++) {
    let v = hist[i] - 0.65 * (i >= pick ? hist[i - pick] : 0);
    if (i < sr * 0.012) v += (Math.random() * 2 - 1) * 0.08 * (1 - i / (sr * 0.012));
    d[i] = v;
    pk = Math.max(pk, Math.abs(v));
  }
  for (let i = 0; i < len; i++) d[i] = Math.tanh((d[i] / (pk || 1)) * 1.3) * 0.86;
  synthCache.set(midi, buf);
  return buf;
}

/** Warm caches for a set of midi notes (call before playback). */
export function prepare(midis) {
  if (!ac || useSamples()) return;
  for (const m of new Set(midis)) synthBuffer(m);
}

// ------------------------------------------------------------------ voices

/**
 * Schedule a bass note.
 * vel 0..1; ghost = muted dead note; harmonic = bell-like natural harmonic.
 */
export function playNote(midi, when = now(), dur = 0.5, vel = 1, ghost = false, harmonic = false) {
  audioCtx();
  if (harmonic) return harmonicVoice(midi, when, dur, vel);
  const v = Math.max(0.05, Math.min(1, vel));
  let src = null, rate = 1;
  if (useSamples()) {
    const s = ghost ? (nearest(bank.ghost, midi, 12) || nearest(bank.reg, midi)) : nearest(bank.reg, midi);
    if (s) { src = s.buffer; rate = Math.pow(2, (midi - s.midi) / 12); }
  }
  if (!src) src = synthBuffer(midi);
  const node = ac.createBufferSource();
  node.buffer = src;
  node.playbackRate.value = rate;
  const tone = ac.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = ghost ? 700 : 900 + 5200 * v * v;
  tone.Q.value = 0.3;
  const g = ac.createGain();
  const amp = (ghost ? 0.55 : 1) * Math.pow(v, 1.3);
  const hold = ghost ? Math.min(dur, 0.09) : Math.max(0.06, dur);
  g.gain.setValueAtTime(amp, when);
  g.gain.setValueAtTime(amp, when + hold);
  // fingers stopping the string: fast but not clicky
  g.gain.setTargetAtTime(0, when + hold, ghost ? 0.02 : 0.05);
  node.connect(tone).connect(g).connect(bassBus);
  node.start(when);
  node.stop(when + hold + 0.45);
}

function harmonicVoice(midi, when, dur, vel) {
  const f = midiToFreq(midi);
  const g = ac.createGain();
  const o1 = ac.createOscillator(), o2 = ac.createOscillator();
  o1.frequency.value = f;
  o2.frequency.value = f * 2;
  const g2 = ac.createGain();
  g2.gain.value = 0.12;
  const amp = 0.5 * vel;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(amp, when + 0.004);
  g.gain.setTargetAtTime(0, when + 0.004, Math.max(0.4, dur * 0.9));
  o1.connect(g);
  o2.connect(g2).connect(g);
  g.connect(bassBus);
  const end = when + Math.max(1.5, dur * 3);
  o1.start(when); o2.start(when); o1.stop(end); o2.stop(end);
}

/** Schedule a metronome click. level: 2 = bar accent, 1 = beat, 0 = subdivision. */
export function click(when = now(), level = 1) {
  audioCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = level === 2 ? 1760 : level === 1 ? 1175 : 900;
  const v = level === 2 ? 0.9 : level === 1 ? 0.6 : 0.25;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(v, when + 0.001);
  g.gain.exponentialRampToValueAtTime(0.0001, when + (level === 0 ? 0.03 : 0.05));
  o.connect(g).connect(clickBus);
  o.start(when);
  o.stop(when + 0.07);
}

// ------------------------------------------------------------------ backing pad

let padVoices = [];
/** Release the pad at `when` (fades out over about half a second). */
export function padStop(when = now()) {
  if (!ac) return;
  for (const v of padVoices) {
    // hold the level reached at `when` (a voice not started yet holds 0), then fade out
    if (v.g.gain.cancelAndHoldAtTime) v.g.gain.cancelAndHoldAtTime(when);
    else v.g.gain.cancelScheduledValues(when);
    v.g.gain.setTargetAtTime(0, when, 0.15);
    for (const o of v.osc) o.stop(when + 1.2);
  }
  padVoices = [];
}
/** Sound a pad chord from `when` (crossfading from the previous one). */
export function padSet(midis, when = now()) {
  audioCtx();
  padStop(when);
  if (!midis?.length) return;
  const level = 0.16 / Math.sqrt(midis.length);
  for (const m of midis) {
    const g = ac.createGain();
    // silent from creation: cancelling its fade-in can never leave it at the default gain of 1
    g.gain.value = 0;
    g.gain.setValueAtTime(0, when);
    g.gain.setTargetAtTime(level, when, 0.12);
    const osc = [['sawtooth', -6], ['triangle', 5]].map(([type, cents]) => {
      const o = ac.createOscillator();
      o.type = type;
      o.frequency.value = midiToFreq(m);
      o.detune.value = cents;
      o.connect(g);
      o.start(when);
      return o;
    });
    g.connect(padBus);
    padVoices.push({ g, osc });
  }
}

// ------------------------------------------------------------------ microphone (tuner)

/** Open the microphone and return { ctx, source, stop }. */
export async function openMic() {
  const ctx = audioCtx();
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
  });
  const source = ctx.createMediaStreamSource(stream);
  return { ctx, source, stop: () => { source.disconnect(); stream.getTracks().forEach((t) => t.stop()); } };
}
