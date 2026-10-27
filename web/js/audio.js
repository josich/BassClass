// Web Audio engine: recorded bass samples (when installed under web/audio/bass/),
// a physical-model fallback voice, natural harmonics and the metronome click.
import { midiToFreq } from './theory.js';

let ac = null;
let bassBus, bassVolume, clickBus, fullPath, phonePath, padBus, padTone, padRaw, leslieIn, ampIn, drumBus, drumVolume, accompIn;
const PAD_LEVEL = 0.38;   // the pad's level at volume 1 (the Practice room's harmony can set its own)
const ACCOMP_THRESHOLD = -3.0;   // dB: the accompaniment's limiter (see audioCtx)
/** A DynamicsCompressor's own make-up gain (hard knee), as Chrome applies it (Web Audio spec): linear. */
const makeupGain = (threshold, ratio) => 10 ** ((0.6 * -threshold * (1 - 1 / ratio)) / 20);
const synthCache = new Map();
// route: what the Android app reports ('speaker' | 'external'), or null in a browser
const opts = { bassVol: 2, clickVol: 0.75, drumVol: 0.8, padVol: 1, padTone: 1500, route: null };
// The click (user, 2026-10-24: too quiet at 100% with the phone at its loudest): it joins the output past the
// accompaniment's limiter, so at the top of its slider (clickVol 1.5) its bar accent peaks at -2.8 dB, the
// loudest it can be without distortion (measured through this graph: with drums and the room's pad at 100%,
// no sample over the soft clip's knee); the accents stay 3.6 dB over the beat at every volume. Its tail is
// longer (90 ms): the same peak sounds 2.3 dB louder (A-weighted). At 100% it sounds 4.2-4.5 dB louder than
// before.
const CLICK_PEAK = -2.8;   // dB, the bar accent at 100%
const CLICK_TOP = 10 ** (CLICK_PEAK / 20) / (0.9 * 1.5);
// the output's last limiter, for the click and the accompaniment together, under the soft clip's knee (an
// instant attack: its overshoot on a click landing with a drum hit still stays under the knee)
const TOP_THRESHOLD = -2.6;
// the drums' drive into their own limiter and the level after it (tuned by measurement, see drumChain; the trim
// +1.6 dB with kit v4, whose quieter cymbals and percussion left the patterns' median 1.7 dB under v3's)
const DRUM_DRIVE = 4, DRUM_TRIM = 1.2;
// Chrome's DynamicsCompressor delays what passes it by about 6 ms (its look-ahead): the drums pass four
// (their glue and limiter, the accompaniment's, the last one), the pad two, the bass two, the click one. These
// delays bring everything to the drums' 24 ms, so the click, the chords and the bass land with the hits.
const ALIGN = { click: 0.018, pad: 0.012, bass: 0.012 };
const PHONE_BOOST = 15; // dB lifted around 850 Hz on the phone speaker
// the guitar amp's output level (its distortion is set by its own drive): its chugs as loud as the other sounds
// (A-weighted, measured; a chord rung once on the Neck sounds 2.7 dB over them)
const AMP_OUT = 0.118;
// The bass's limiter (user, 2026-10-27: "the bass sounds distorted on the phone speakers, less in headphones";
// measured offline at 100%): its own make-up gain (+2.3 dB, Web Audio spec) is taken back, so it no longer
// drives every peak into the soft clip (2.7% of a low phrase's samples were in the clip, 0.03% now), and it
// lets go slower (0.25 s, not 0.06), so it no longer rides inside each low note's waveform (two low notes'
// intermodulation on the natural path 4 dB lower). The natural path is 1.4 dB softer for it.
const BASS_LIMIT = { threshold: -2.5, attack: 0.001, release: 0.25, takeBack: true };
// the phone-speaker profile cuts below 350 Hz (200 before): a phone speaker cannot play what lies under it, and
// it was 80% of the energy, moving the cone hard for nothing (the speaker's own distortion); now 5 dB less,
// and with that headroom the bass sounds as loud as before the limiter change, 0.4 dB louder (A-weighted)
const PHONE_HP = 350;

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
    // Output: the bass goes into a fast limiter (BASS_LIMIT, its make-up gain taken back) and a gentle soft
    // clip that only a note's first instant can reach, so it stays loud and dense without distortion.
    const mix = ac.createGain();
    mix.gain.value = 1.6;
    const limiter = ac.createDynamicsCompressor();
    limiter.threshold.value = BASS_LIMIT.threshold;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = BASS_LIMIT.attack;
    limiter.release.value = BASS_LIMIT.release;
    const limiterTrim = ac.createGain();
    limiterTrim.gain.value = BASS_LIMIT.takeBack ? 1 / makeupGain(BASS_LIMIT.threshold, 20) : 1;
    const clip = ac.createWaveShaper();
    clip.curve = softClipCurve();
    clip.oversample = '2x';
    mix.connect(limiter).connect(limiterTrim).connect(clip).connect(ac.destination);

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
    const bassAlign = ac.createDelay(0.05);
    bassAlign.delayTime.value = ALIGN.bass;
    glue.connect(bassVolume).connect(bassAlign).connect(mix);
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
    // phone speaker: cut below PHONE_HP (inaudible there, it only eats headroom), lift the string's
    // own overtones around 850 Hz, and trim the treble so the finger noise does not turn harsh
    phonePath = ac.createGain();
    phonePath.gain.value = phone ? 1 : 0;
    top.connect(filter('highpass', PHONE_HP)).connect(filter('highpass', PHONE_HP)).connect(filter('peaking', 850, 0.6, PHONE_BOOST))
      .connect(filter('highshelf', 3000, 0.7, -5)).connect(phonePath).connect(glue);

    // the accompaniment (click, pad, drums) meets in its own limiter, after the bass's, so together at their
    // loudest they stay under the clip's knee and never push the bass down. A compressor adds its own make-up
    // gain (the Web Audio spec: 0.6 × the depth of its curve at 0 dB; QA round 16 measured +3.4 dB), taken back
    // here, so below the threshold it passes the sound unchanged: an exercise's click and Backing sound as
    // they always did
    const accomp = ac.createDynamicsCompressor();
    accomp.threshold.value = ACCOMP_THRESHOLD; accomp.knee.value = 0; accomp.ratio.value = 20; accomp.attack.value = 0.001; accomp.release.value = 0.08;
    const accompTrim = ac.createGain();
    accompTrim.gain.value = 1 / makeupGain(ACCOMP_THRESHOLD, 20);
    // the last limiter: the accompaniment and the click meet there, under the clip's knee (its make-up gain
    // taken back as the accompaniment's is)
    const last = ac.createDynamicsCompressor();
    last.threshold.value = TOP_THRESHOLD; last.knee.value = 0; last.ratio.value = 20; last.attack.value = 0; last.release.value = 0.06;
    const lastTrim = ac.createGain();
    lastTrim.gain.value = 1 / makeupGain(TOP_THRESHOLD, 20);
    accomp.connect(accompTrim).connect(last).connect(lastTrim).connect(clip);
    accompIn = accomp;

    // the metronome joins after the bass's limiter, so a click never pushes the bass down
    clickBus = ac.createGain();
    clickBus.gain.value = opts.clickVol * CLICK_TOP;
    const clickAlign = ac.createDelay(0.05);
    clickAlign.delayTime.value = ALIGN.click;
    clickBus.connect(clickAlign).connect(last);

    // backing pad (drone or chords): soft, warm and after the limiter, so it never ducks the bass
    padBus = ac.createGain();
    // with the bass at full level the sum stays inside the soft clip's knee (no hard clipping)
    padBus.gain.value = PAD_LEVEL * opts.padVol;
    // its tone: soft under an exercise (1.5 kHz), brighter in the Practice room to sound with a real bass
    // (the accompaniment's limiter keeps a loud room pad clean)
    padTone = ac.createBiquadFilter();
    padTone.type = 'lowpass'; padTone.frequency.value = opts.padTone; padTone.Q.value = 0.3;
    const padAlign = ac.createDelay(0.05);
    padAlign.delayTime.value = ALIGN.pad;
    padBus.connect(padTone).connect(padAlign).connect(accomp);
    // (a recorded sound, the piano, keeps its own brightness: past the tone filter)
    padRaw = ac.createGain();
    padRaw.gain.value = PAD_LEVEL * opts.padVol;
    padRaw.connect(padAlign);
    // (the organ plays through its rotating speaker, into the same)
    leslieIn = leslie(ac, padRaw);
    // (the guitar through its amp, into the same)
    ampIn = amp(ac, padRaw);

    // drums (the Practice room): their own chain, after the bass's limiter (a kick never ducks the bass);
    // the drum volume comes after it, so the chain shapes the drums alike at any volume
    const chain = drumChain(ac);
    drumBus = chain.input;
    drumVolume = ac.createGain();
    drumVolume.gain.value = opts.drumVol;
    chain.output.connect(drumVolume).connect(accomp);
    decodeBank();
  }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** bassVol: 0–2 (Settings shows it as 0–100%; above 1 the bass is pushed into the limiter). */
export function setAudioOptions(o) {
  Object.assign(opts, o);
  if (bassVolume) bassVolume.gain.value = opts.bassVol;
  if (clickBus) clickBus.gain.value = opts.clickVol * CLICK_TOP;
  if (drumVolume) drumVolume.gain.value = opts.drumVol;
  if (padBus) padBus.gain.value = PAD_LEVEL * opts.padVol;
  if (padRaw) padRaw.gain.value = PAD_LEVEL * opts.padVol;
  if (padTone) padTone.frequency.value = opts.padTone;
}

/**
 * The drums' chain, on any audio context (the room's, or an offline one: web/js/dev/drumlevels.js renders the
 * patterns through it): a gentle glue compressor that lifts their body, then a fast limiter and a trim.
 * The hits go in at a fixed level (the drum volume follows the chain). Measured offline over all the
 * patterns at 100%: see drumlevels.js chain(). Returns { input, output }.
 */
export function drumChain(ctx) {
  const comp = (threshold, knee, ratio, attack, release) => {
    const c = ctx.createDynamicsCompressor();
    c.threshold.value = threshold; c.knee.value = knee; c.ratio.value = ratio; c.attack.value = attack; c.release.value = release;
    return c;
  };
  const input = ctx.createGain();
  const makeup = ctx.createGain();
  makeup.gain.value = DRUM_DRIVE;
  const trim = ctx.createGain();
  trim.gain.value = DRUM_TRIM;
  input.connect(comp(-20, 10, 2.5, 0.008, 0.2)).connect(makeup).connect(comp(-10, 0, 20, 0, 0.05)).connect(trim);
  return { input, output: trim };
}

/**
 * The tap sound (user, 2026-10-23: subtle, not annoying): a soft, very short wooden tick on a tap of a
 * control, quiet under the music, through the accompaniment's limiter.
 */
export function tapTick() {
  audioCtx();
  const t = ac.currentTime + 0.005;
  const o = ac.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(1650, t);
  o.frequency.exponentialRampToValueAtTime(900, t + 0.025);
  const g = ac.createGain();
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.07, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
  o.connect(g).connect(accompIn);
  o.start(t);
  o.stop(t + 0.05);
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

/** Schedule a metronome click. level: 2 = bar accent, 1.5 = a group's start (odd metres), 1 = beat, 0 = subdivision. */
export function click(when = now(), level = 1) {
  audioCtx();
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = 'sine';
  o.frequency.value = level === 2 ? 1760 : level === 1.5 ? 1480 : level === 1 ? 1175 : 900;
  const v = level === 2 ? 0.9 : level === 1.5 ? 0.75 : level === 1 ? 0.6 : 0.25;
  g.gain.setValueAtTime(0, when);
  g.gain.linearRampToValueAtTime(v, when + 0.001);
  // (the beat's clicks ring 90 ms: louder for the same peak; a subdivision's stay short, under the beat)
  g.gain.exponentialRampToValueAtTime(0.0001, when + (level === 0 ? 0.03 : 0.09));
  o.connect(g).connect(clickBus);
  o.start(when);
  o.stop(when + 0.11);
  return g;   // (disconnected, a click not yet sounded is cancelled)
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
    v.g.gain.setTargetAtTime(0, when, v.release ?? 0.15);
    for (const o of v.osc) o.stop(when + 1.2);
  }
  padVoices = [];
}

/**
 * The harmony's sounds (the Practice room offers them; an exercise's Backing is the pad), all synthesised:
 * each builds one note's voice into `g` (its gain, silent at first) and returns its oscillators. `level`
 * evens their loudness (A-weighted, measured offline), `struck` ones fade and are struck again on each bar.
 */
export const PAD_SOUNDS = {
  // two detuned oscillators, a slow swell: the Backing's pad
  pad: { level: 1, struck: false, voice(x, f, when, g, peak) {
    g.gain.setTargetAtTime(peak, when, 0.12);
    return [['sawtooth', -6], ['triangle', 5]].map(([type, cents]) => osc(x, type, f, cents, when, g));
  } },
  // an electric piano (FM): a sine carrier, a sine at the same pitch bending its tone, bright at the strike,
  // and a short tine; it fades like a struck tine
  epiano: { level: 2.03, struck: true, release: 0.25, voice(x, f, when, g, peak) {
    const carrier = osc(x, 'sine', f, 0, when, g);
    const mod = osc(x, 'sine', f, 0, when, null);
    const depth = x.createGain();
    depth.gain.setValueAtTime(f * 2.2, when);
    depth.gain.setTargetAtTime(f * 0.35, when, 0.25);
    mod.connect(depth).connect(carrier.frequency);
    const tine = osc(x, 'sine', f * 14, 0, when, null);
    const tineDepth = x.createGain();
    tineDepth.gain.setValueAtTime(f * 1.5, when);
    tineDepth.gain.setTargetAtTime(0, when, 0.03);
    tine.connect(tineDepth).connect(carrier.frequency);
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.004);
    g.gain.setTargetAtTime(peak * 0.55, when + 0.004, 0.25);
    g.gain.setTargetAtTime(peak * 0.2, when + 0.6, 1.6);
    return [carrier, mod, tine];
  } },
  // a grand piano (user, 2026-10-27): the recorded Kawai of web/js/piano.js, each note from the nearest of its
  // notes (two or three semitones apart), struck again on each bar, past the tone filter (`raw`); until it has
  // loaded, the e-piano plays in its place
  piano: { level: 8.2, struck: true, raw: true, release: 0.18, voice(x, f, when, g, peak) {
    if (!pianoBank) return PAD_SOUNDS.epiano.voice(x, f, when, g, (peak * PAD_SOUNDS.epiano.level) / PAD_SOUNDS.piano.level);
    const midi = 69 + 12 * Math.log2(f / 440);
    let near = null;
    for (const k of pianoBank.keys()) if (near == null || Math.abs(k - midi) < Math.abs(near - midi)) near = k;
    const s = x.createBufferSource();
    s.buffer = pianoBank.get(near);
    s.playbackRate.value = 2 ** ((midi - near) / 12);
    s.connect(g);
    g.gain.setValueAtTime(peak, when);
    s.start(when);
    return [s];
  } },
  // a tonewheel organ (user, 2026-10-27: "the pad and the organ sound too similar… more stereo"): drawbars
  // 16′ 5⅓′ 8′ 4′ 2⅔′ 2′ in a gospel and rock registration, speaking at once, each wheel a little off the
  // tempered pitch; the percussion (its 2⅔′ struck and fading) and a key click on each new chord; held, through
  // the rotating speaker (`leslie`), whose turning horn and drum swirl it across the stereo field
  organ: { level: 3.3, struck: false, leslie: true, release: 0.06, voice(x, f, when, g, peak) {
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.004);
    const out = [];
    for (const [ratio, amount] of [[0.5, 0.75], [1.5, 0.7], [1, 1], [2, 0.45], [3, 0.25], [4, 0.2]]) {
      const part = x.createGain();
      part.gain.value = amount / 3.35;
      out.push(osc(x, 'sine', f * ratio, (Math.random() - 0.5) * 3, when, part));
      part.connect(g);
    }
    const perc = osc(x, 'sine', f * 3, 0, when, null);
    const pg = x.createGain();
    pg.gain.setValueAtTime(0.28, when);
    pg.gain.setTargetAtTime(0, when, 0.18);
    perc.connect(pg).connect(g);
    const click = x.createBufferSource();
    click.buffer = clickNoise(x);
    const band = x.createBiquadFilter();
    band.type = 'bandpass'; band.frequency.value = 3000; band.Q.value = 0.8;
    const cg = x.createGain();
    cg.gain.value = 0.06;
    click.connect(band).connect(cg).connect(g);
    click.start(when);
    return [...out, perc, click];
  } },
  // a distorted rock and metal rhythm guitar (user, 2026-10-27): power chords (`chord`: root, 5th and octave, an
  // octave under the chord, as a guitar plays them; full chords turn to mud under distortion), double-tracked
  // (two takes a few cents and ms apart, left and right), through the amp (`amp`). Each note a plucked string
  // (`pluck`, user, 2026-10-27: "more realistic, no sample"), open or palm-muted, a little different at every
  // strike. In the room it chugs ("chug the guitar"): palm-muted strikes, one on each subdivision (`chugNote`);
  // a chord tapped on the Neck rings once (`muted` false)
  guitar: { level: 1, struck: true, amp: true, chug: true, release: 0.09, chord: (m) => [m[0] - 12, m[0] - 5, m[0]], voice(x, f, when, g, peak, muted = false) {
    const out = [];
    const midi = Math.round(69 + 12 * Math.log2(f / 440));
    for (const [take, side, late] of [[0, -1, 0], [1, 1, muted ? 0.007 : 0.012]]) {
      const t = when + late + Math.random() * 0.003;
      const s = x.createBufferSource();
      s.buffer = pluck(x, midi, muted, take);
      const lv = x.createGain();
      lv.gain.value = 0.9 + Math.random() * 0.2;
      const p = x.createStereoPanner();
      p.pan.value = side * 0.9;
      s.connect(lv).connect(p).connect(g);
      s.start(t);
      out.push(s);
    }
    g.gain.setValueAtTime(peak, when);
    return out;
  } },
  // an arpeggio (user, 2026-10-23: the strings sounded like the pad): the chord's notes one after another in
  // the room's subdivision, up and down, plucked like a harp; the engine plays it note by note (`arpNote`)
  arp: { level: 1.57, struck: true, arp: true, voice(x, f, when, g, peak) {
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + 0.003);
    g.gain.setTargetAtTime(0, when + 0.003, 0.32);
    const body = x.createGain();
    body.gain.value = 0.35;
    body.connect(g);
    return [osc(x, 'triangle', f, 0, when, g), osc(x, 'sine', f * 2, 3, when, body)];
  } },
};
/**
 * The organ's rotating speaker (a Leslie), on any context, into `to`: the treble (a horn) and the bass (a drum)
 * turn at their own speeds, each moving its sound left and right, louder and softer, its pitch bending a little
 * with the motion (Doppler). Returns its input.
 */
function leslie(x, to) {
  const input = x.createGain();
  const rotor = (type, freq, rate, am, pan, bend) => {
    const split = x.createBiquadFilter();
    split.type = type; split.frequency.value = freq; split.Q.value = 0.6;
    const d = x.createDelay(0.02);
    d.delayTime.value = 0.004;
    const level = x.createGain();
    level.gain.value = 1 - am;
    const p = x.createStereoPanner();
    // (two turning phases a quarter turn apart: the level with one, the place and the pitch with the other)
    const t0 = x.currentTime;
    const a = x.createOscillator(); a.frequency.value = rate; a.start(t0);
    const b = x.createOscillator(); b.frequency.value = rate; b.start(t0 + 0.25 / rate);
    const ag = x.createGain(); ag.gain.value = am; a.connect(ag).connect(level.gain);
    const pg = x.createGain(); pg.gain.value = pan; b.connect(pg).connect(p.pan);
    const bg = x.createGain(); bg.gain.value = bend; b.connect(bg).connect(d.delayTime);
    input.connect(split).connect(d).connect(level).connect(p).connect(to);
  };
  rotor('highpass', 800, 2.6, 0.3, 0.85, 0.0005);
  rotor('lowpass', 800, 2.1, 0.15, 0.45, 0.0002);
  return input;
}
/**
 * A plucked string (an extended Karplus–Strong string), computed in code, once per note, way of playing, take
 * and variant (cached per audio context; three variants played in turn, so repeated strikes differ as a hand's
 * do): its loop is the string's period (whole samples, the loop filter's delay and an all-pass for the fraction),
 * losing its highs and its level at every pass as a string does (open: rings 2–4 s, lower strings longer;
 * palm-muted: damped in 0.15 s, darker); it is set going by a burst of noise shaped by the pick (brighter open)
 * and by where it strikes (a comb, a seventh of the string from the bridge), and heard through a bridge pickup
 * (another comb, a tenth from the bridge).
 */
const plucks = new WeakMap();
const turns = new Map();
function pluck(x, midi, muted, take) {
  let cache = plucks.get(x);
  if (!cache) plucks.set(x, (cache = new Map()));
  const base = `${midi}:${muted ? 1 : 0}:${take}`;
  const v = (turns.get(base) ?? -1) + 1;
  turns.set(base, v);
  const key = `${base}:${v % 3}`;
  if (cache.has(key)) return cache.get(key);
  const sr = x.sampleRate;
  const f = 440 * 2 ** ((midi - 69) / 12) * 2 ** ((take ? 3 : -3) / 1200);
  const P = sr / f;
  // the loop filter: a two-tap average (half a sample), twice when muted (darker, a sample)
  const k = muted ? 2 : 1;
  const N = Math.max(2, Math.floor(P - k / 2 - 0.1));
  const frac = P - N - k / 2;
  const a = (1 - frac) / (1 + frac);
  const t60 = muted ? 0.15 : 3.2 * Math.sqrt(82 / f);
  const rho = 10 ** ((-3 * P) / (sr * t60));
  const n = Math.round((muted ? 0.5 : Math.min(4, t60 + 0.5)) * sr);
  // the pick: noise, brighter when open, and the comb of where it strikes
  const d = new Float32Array(N);
  let lp = 0;
  const bright = muted ? 0.35 : 0.6;
  for (let i = 0; i < N; i++) { lp += bright * (Math.random() * 2 - 1 - lp); d[i] = lp; }
  const at = Math.max(1, Math.round(N / 7));
  for (let i = N - 1; i >= at; i--) d[i] -= d[i - at];
  let mean = 0;
  for (const y of d) mean += y / N;
  for (let i = 0; i < N; i++) d[i] -= mean;
  const out = new Float32Array(n);
  let p = 0, l1 = 0, l2 = 0, ax = 0, ay = 0;
  for (let i = 0; i < n; i++) {
    const cur = d[p];
    out[i] = cur;
    let y = 0.5 * (cur + l1);
    l1 = cur;
    if (muted) { const y2 = 0.5 * (y + l2); l2 = y; y = y2; }
    const ap = a * y + ax - a * ay;
    ax = y; ay = ap;
    d[p] = rho * ap;
    p = p + 1 === N ? 0 : p + 1;
  }
  // the bridge pickup: what it hears is the string's motion less its copy a tenth of a period on
  const pu = Math.max(1, Math.round(P / 10));
  for (let i = n - 1; i >= pu; i--) out[i] -= 0.8 * out[i - pu];
  const fade = Math.round(sr * 0.03);
  for (let i = 0; i < fade; i++) out[n - fade + i] *= 1 - i / fade;
  const b = x.createBuffer(1, n, sr);
  b.getChannelData(0).set(out);
  cache.set(key, b);
  return b;
}

/**
 * The guitar's amp, on any context, into `to`: tightened lows and a pushed middle (an overdrive in front), two
 * gain stages (a soft one, then an uneven one, as a tube's; each side on its own, so the double-tracked takes
 * stay apart) with a treble cut between them, then a 4×12 cabinet: its low resonance, scooped low middle, cone
 * peaks and steep top; and a little room around it. Returns its input.
 */
let stage1 = null, stage2 = null;
function amp(x, to) {
  const f = (type, freq, q, gain = 0) => {
    const b = x.createBiquadFilter();
    b.type = type; b.frequency.value = freq; b.Q.value = q; b.gain.value = gain;
    return b;
  };
  const curve = (k, bias) => {
    const n = 4096, c = new Float32Array(n);
    for (let i = 0; i < n; i++) c[i] = (Math.tanh(k * ((i / (n - 1)) * 2 - 1) + bias) - Math.tanh(bias)) / Math.tanh(k);
    return c;
  };
  stage1 ??= curve(4, 0);
  stage2 ??= curve(3, 0.25);
  const shaper = (c) => { const w = x.createWaveShaper(); w.curve = c; w.oversample = '4x'; return w; };
  const gain = (v) => { const g = x.createGain(); g.gain.value = v; return g; };
  const input = gain(1);
  const out = gain(AMP_OUT);
  input.connect(f('highpass', 130, 0.7)).connect(f('peaking', 750, 0.8, 7)).connect(gain(4)).connect(shaper(stage1))
    .connect(f('lowpass', 7000, 0.6)).connect(f('highpass', 90, 0.6)).connect(gain(3)).connect(shaper(stage2))
    .connect(f('peaking', 110, 1.2, 3)).connect(f('peaking', 450, 1, -6)).connect(f('peaking', 1300, 2, 2))
    .connect(f('peaking', 2600, 1.4, 4)).connect(f('peaking', 3700, 3, 2)).connect(f('lowpass', 5200, 0.8))
    .connect(f('lowpass', 6200, 0.6)).connect(out).connect(to);
  // the room: a short stereo tail of darkened noise
  const room = x.createConvolver();
  const len = Math.round(x.sampleRate * 0.35), ir = x.createBuffer(2, len, x.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) { lp += 0.25 * (Math.random() * 2 - 1 - lp); d[i] = lp * Math.exp(-i / (x.sampleRate * 0.07)); }
  }
  room.buffer = ir;
  out.connect(room).connect(gain(0.35)).connect(to);
  return input;
}
// a key's click (the organ's contacts), made once per audio context
const clicks = new WeakMap();
function clickNoise(x) {
  let b = clicks.get(x);
  if (!b) {
    b = x.createBuffer(1, Math.round(x.sampleRate * 0.006), x.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3;
    clicks.set(x, b);
  }
  return b;
}
// the piano's notes (web/js/piano.js hands them over once loaded): MIDI note → its recording
let pianoBank = null;
export function setPianoBank(bank) { pianoBank = bank; }
export const pianoLoaded = () => !!pianoBank;
function osc(x, type, f, cents, when, to) {
  const o = x.createOscillator();
  o.type = type;
  o.frequency.value = f;
  o.detune.value = cents;
  if (to) o.connect(to);
  o.start(when);
  return o;
}
/**
 * One plucked note of an arpeggio at `when` on the pad's bus (its own decay), `rate` notes a second: the more
 * of them, the softer each, so the arpeggio sounds as loud as the pad at any tempo and subdivision (measured:
 * −3 dB a doubling; QA round 18 found it rising with the tempo when only the subdivision counted). It ends at
 * 1.5 s, 40 dB down (lighter on a phone at fast tempos). Returns its gain node.
 */
export function arpNote(midi, when = now(), rate = 4) {
  audioCtx();
  const kind = PAD_SOUNDS.arp;
  const g = ac.createGain();
  g.gain.value = 0;
  const each = Math.min(2, Math.sqrt(4 / Math.max(0.01, rate)));
  for (const o of kind.voice(ac, midiToFreq(midi), when, g, 0.16 * kind.level * each)) o.stop(when + 1.5);
  g.connect(padBus);
  return g;
}

/**
 * One palm-muted strike of the guitar's power chord at `when` on its amp (user, 2026-10-27: "chug the guitar"):
 * the engine plays one on each subdivision of the beat, in the groove's feel, as the arpeggio; `rate` strikes a
 * second (faster ones a little shorter), `accent` the beat's own (3 dB up). Returns its gain node.
 */
export function chugNote(midis, when = now(), rate = 4, accent = false) {
  audioCtx();
  const kind = PAD_SOUNDS.guitar;
  const notes = kind.chord(midis);
  const g = ac.createGain();
  g.gain.value = 0;
  const len = Math.min(0.3, 0.85 / Math.max(0.5, rate));
  const peak = (0.16 / Math.sqrt(notes.length)) * kind.level * (accent ? 1.41 : 1);
  for (const m of notes) for (const o of kind.voice(ac, midiToFreq(m), when, g, peak, true)) o.stop(when + len + 0.15);
  g.gain.setValueAtTime(peak, when + len);
  g.gain.setTargetAtTime(0, when + len, 0.02);
  g.connect(ampIn);
  return g;
}

/**
 * A chord heard once in a harmony sound (a chord chip tapped while the room is stopped; user, 2026-10-23):
 * a held sound rings a moment and fades, the arpeggio runs up the chord.
 */
export function chordPreview(midis, sound = 'pad') {
  audioCtx();
  const t = now() + 0.02;
  if (PAD_SOUNDS[sound]?.arp) {
    [...midis].sort((a, b) => a - b).forEach((m, i) => arpNote(m, t + i * 0.11, 6));
    return;
  }
  padSet(midis, t, sound);
  padStop(t + 1.2);
}
/** Sound a chord from `when` on the pad, in one of `PAD_SOUNDS` (crossfading from the previous one). */
export function padSet(midis, when = now(), sound = 'pad') {
  audioCtx();
  padStop(when);
  if (!midis?.length) return;
  const kind = PAD_SOUNDS[sound] || PAD_SOUNDS.pad;
  // (the guitar plays its own shape of the chord: a power chord)
  if (kind.chord) midis = kind.chord(midis);
  const peak = (0.16 / Math.sqrt(midis.length)) * kind.level;
  for (const m of midis) {
    const g = ac.createGain();
    // silent from creation: cancelling its fade-in can never leave it at the default gain of 1
    g.gain.value = 0;
    g.gain.setValueAtTime(0, when);
    const oscs = kind.voice(ac, midiToFreq(m), when, g, peak);
    g.connect(kind.leslie ? leslieIn : kind.amp ? ampIn : kind.raw && pianoBank ? padRaw : padBus);
    padVoices.push({ g, osc: oscs, release: kind.release });
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
