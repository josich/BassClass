// Recording and judging a take (a prototype; user, 2026-10-29: "create a prototype in a simple exercise to test if it
// works"; the study: qa/reports/2026-10-29-study-recording.md, whose tested analysis this ports). Classic signal
// processing on the phone, nothing sent anywhere: the microphone is captured in the app's own audio context
// (recworklet.js), so the click, the notes and the take share one clock; the count-in's clicks heard on the speaker
// measure the delay (on headphones the mic does not hear them, and the delay is estimated). Then, for a single-note
// line: the onsets (spectral flux, 40–2500 Hz), matched to the written notes (a monotonic alignment), each note's
// timing against the click, and its pitch class (yin, checked against the written note's own period and harmonics).
// The user's answers (2026-10-29): headphones or the speaker; one take kept, replaced by the next, never shared; free;
// the app's verdict is kept beside the player's own ✓ Clean.
import * as A from './audio.js';
import { yin } from './pitch.js';

/** The exercises with the prototype's 🎙 Record (single-note lines). */
export const JUDGED = new Set(['fb-open-strings', 'sc-one-octave']);

const AR = 12000;   // the analysis rate (the tuner's)
const midiF = (m) => 440 * 2 ** ((m - 69) / 12);
const median = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); const k = s.length >> 1; return s.length % 2 ? s[k] : (s[k - 1] + s[k]) / 2; };
const mean = (a) => a.reduce((s, v) => s + v, 0) / (a.length || 1);
const sd = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / Math.max(1, a.length - 1)); };

// ------------------------------------------------------------------ capture

let last = null;   // the one take kept: { samples, sr, t0 }, replaced by the next (user, 2026-10-29)
export const lastTake = () => last;
// that take's result, for the exercise it was played on: 🎙 shows it again, greyed, with ▶ Listen (user, 2026-10-29:
// "to be able to check results not only once"): { id, at, bpm, res, notes }
let kept = null;
export function keepResult(r) { kept = r; }
export const resultFor = (id) => (kept?.id === id ? kept : null);

/** Opens the microphone; `begin()` starts the take and `stop()` returns it: { samples, sr, t0 (context time) }. */
export async function startTake() {
  const ac = A.audioCtx();
  await ac.audioWorklet.addModule(new URL('./recworklet.js', import.meta.url));
  const mic = await A.openMic();
  const node = new AudioWorkletNode(ac, 'bc-recorder');
  const chunks = [];
  // (the microphone opens when the player gets ready; the take starts with `begin()`, when they tap ●)
  let on = false;
  node.port.onmessage = (e) => { if (on) chunks.push(e.data); };
  // (a worklet runs only when pulled: through a silent gain to the output)
  const sink = ac.createGain();
  sink.gain.value = 0;
  mic.source.connect(node).connect(sink).connect(ac.destination);
  const settings = mic.source.mediaStream?.getAudioTracks?.()[0]?.getSettings?.() || {};
  return {
    inputLatency: Number.isFinite(settings.latency) ? settings.latency : null,
    begin() { on = true; },
    /** Stops the capture; the take is kept (the one take, replacing the last) unless `keep` is false. */
    stop({ keep = true } = {}) {
      mic.source.disconnect();
      node.disconnect();
      sink.disconnect();
      mic.stop();
      if (!chunks.length || !keep) return null;
      const t0 = chunks[0].frame / ac.sampleRate;
      const n = chunks.reduce((s, c) => s + c.data.length, 0);
      const samples = new Float32Array(n);
      let at = 0;
      for (const c of chunks) { samples.set(c.data, at); at += c.data.length; }
      last = { samples, sr: ac.sampleRate, t0 };
      return last;
    },
  };
}

/** Plays the kept take once (its gain node, to stop it). */
export function playTake(take = last) {
  if (!take) return null;
  const ac = A.audioCtx();
  const buf = ac.createBuffer(1, take.samples.length, take.sr);
  buf.copyToChannel(take.samples, 0);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const g = ac.createGain();
  g.gain.value = 1.4;
  src.connect(g).connect(ac.destination);
  src.start();
  return src;
}

// ------------------------------------------------------------------ signal tools (from the study)

function biquad(x, type, f0, Q, sr) {
  const w = 2 * Math.PI * f0 / sr, cw = Math.cos(w), sw = Math.sin(w), al = sw / (2 * Q);
  let b0, b1, b2;
  const a0 = 1 + al, a1 = -2 * cw, a2 = 1 - al;
  if (type === 'lp') { b0 = (1 - cw) / 2; b1 = 1 - cw; b2 = b0; } else { b0 = (1 + cw) / 2; b1 = -(1 + cw); b2 = b0; }
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { let t = re[i]; re[i] = re[j]; re[j] = t; t = im[i]; im[i] = im[j]; im[j] = t; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang), half = len >> 1;
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < half; k++) {
        const a = i + k, b = a + half;
        const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
function goertzel(x, a, b, f, sr) {
  const n = b - a;
  if (n < 8) return 0;
  const w = 2 * Math.PI * f / sr, c = 2 * Math.cos(w);
  let s1 = 0, s2 = 0;
  for (let i = 0; i < n; i++) { const win = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)); const s = (x[a + i] || 0) * win + c * s1 - s2; s2 = s1; s1 = s; }
  return (s1 * s1 + s2 * s2 - c * s1 * s2) / (n * n);
}
/** The take at 12 kHz: anti-alias low-pass, every 4th sample (48 kHz; other rates resampled the same way), 30 Hz high-pass. */
function prep(x, sr) {
  const step = Math.max(1, Math.round(sr / AR));
  const lp = biquad(biquad(x, 'lp', 0.4 * AR, 0.54, sr), 'lp', 0.4 * AR, 1.31, sr);
  const y = new Float32Array(Math.floor(lp.length / step));
  for (let i = 0; i < y.length; i++) y[i] = lp[i * step];
  return { z: biquad(y, 'hp', 30, 0.707, sr / step), rate: sr / step };
}
const N = 512, HOP = 24, BAND = [40, 2500];
/** The analysis's thresholds (tuned on the study's takes; exported so the QA harness can try others). */
export const TUNING = { delta: 0.05, gateDb: 6, weak: 0.35 };
/** Onset strength: log-magnitude spectral flux over 40–2500 Hz (the recording click, near 5 kHz, is outside it). */
function odf(z, rate) {
  const nf = Math.max(0, Math.floor((z.length - N) / HOP));
  const win = new Float32Array(N);
  for (let i = 0; i < N; i++) win[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / N);
  const kLo = Math.round(BAND[0] * N / rate), kHi = Math.round(BAND[1] * N / rate);
  const re = new Float32Array(N), im = new Float32Array(N);
  const prev = [];
  const LAG = 2;
  const flux = new Float32Array(nf);
  for (let f = 0; f < nf; f++) {
    for (let i = 0; i < N; i++) { re[i] = z[f * HOP + i] * win[i]; im[i] = 0; }
    fft(re, im);
    const L = new Float32Array(N / 2);
    for (let k = 0; k < N / 2; k++) L[k] = Math.log(1 + 1000 * Math.hypot(re[k], im[k]));
    const P = prev[(f - LAG) % (LAG + 1)];
    if (P) {
      let s = 0;
      for (let k = kLo; k <= kHi; k++) { const d = L[k] - Math.max(P[k - 1], P[k], P[k + 1]); if (d > 0) s += d; }
      flux[f] = s;
    }
    prev[f % (LAG + 1)] = L;
  }
  return { flux, nf, t: (f) => (f * HOP + N / 2) / rate };
}
function peaks(o, rate, { minGap = 0.045, delta = 0.12 } = {}) {
  const { flux, nf } = o;
  const s = [...flux].sort((a, b) => a - b);
  const hi = s[Math.floor(0.98 * s.length)] || 1;
  const out = [];
  const pre = Math.round(0.1 * rate / HOP), post = Math.round(0.03 * rate / HOP), w = Math.round(0.03 * rate / HOP);
  for (let f = 1; f < nf - 1; f++) {
    const v = flux[f];
    if (v <= 0) continue;
    let isMax = true;
    for (let j = Math.max(0, f - w); j <= Math.min(nf - 1, f + w); j++) if (flux[j] > v) { isMax = false; break; }
    if (!isMax) continue;
    let m = 0, c = 0;
    for (let j = Math.max(0, f - pre); j <= Math.min(nf - 1, f + post); j++) { m += flux[j]; c++; }
    if (v < m / c + delta * hi) continue;
    // (the peak placed between frames: a parabola)
    const a = flux[f - 1], b = v, cc = flux[f + 1], den = a - 2 * b + cc;
    const t = o.t(f + (den ? Math.max(-1, Math.min(1, 0.5 * (a - cc) / den)) : 0));
    if (out.length && t - out[out.length - 1].t < minGap) { if (v / hi > out[out.length - 1].s) out[out.length - 1] = { t, s: v / hi }; continue; }
    out.push({ t, s: v / hi });
  }
  return out;
}
/** yin's normalised difference at the period of `f` (±50 cents): low = that pitch is there. */
function dipAt(buf, sr, f) {
  const tMax = Math.ceil(sr / (f * 2 ** (-50 / 1200))) + 1, tMin = Math.floor(sr / (f * 2 ** (50 / 1200)));
  const W = buf.length - tMax;
  if (W < tMax * 0.75) return null;
  let run = 0, best = 1;
  for (let tau = 1; tau <= tMax; tau++) {
    let sum = 0;
    for (let j = 0; j < W; j++) { const v = buf[j] - buf[j + tau]; sum += v * v; }
    run += sum;
    const cm = run > 0 ? sum * tau / run : 1;
    if (tau >= tMin && cm < best) best = cm;
  }
  return best;
}
const pcErrCents = (f, m) => { const c = 1200 * Math.log2(f / midiF(m)); return ((c % 1200) + 1800) % 1200 - 600; };
/** The detected onsets matched to the written notes, in order (dynamic programming): a match costs (dt / tol)², a
 * wrong pitch class 0.6 more, a missed note 1, an extra onset 0.35 (0.75 with a clear pitch). */
function align(det, exp) {
  // (a weak onset costs more as a note, and less to leave out even with a clear pitch, as a ringing string's ripples
  // have: a strong pluck a little off the beat beats a faint ripple on it)
  // (a note's typical strength: the median of the strongest onsets, as many as there are notes)
  const top = det.map((d) => d.s).sort((a, b) => b - a).slice(0, Math.max(1, exp.length));
  const sRef = top[Math.floor(top.length / 2)] || 1;
  const n = det.length, m = exp.length, INF = 1e9;
  const D = Array.from({ length: n + 1 }, () => new Float64Array(m + 1).fill(INF));
  const P = Array.from({ length: n + 1 }, () => new Int8Array(m + 1));
  D[0][0] = 0;
  for (let i = 0; i <= n; i++) {
    for (let j = 0; j <= m; j++) {
      const v = D[i][j];
      if (v >= INF) continue;
      if (i < n && j < m) {
        const dt = det[i].t - exp[j].t, tol = exp[j].tol;
        if (Math.abs(dt) < tol) {
          const pc = det[i].f == null ? 0.3 : Math.abs(pcErrCents(det[i].f, exp[j].midi)) <= 50 ? 0 : 0.6;
          const c = v + (dt / tol) ** 2 + pc + (det[i].s < 0.25 * sRef ? 0.5 : 0);
          if (c < D[i + 1][j + 1]) { D[i + 1][j + 1] = c; P[i + 1][j + 1] = 1; }
        }
      }
      if (i < n) { const c = v + 0.35 + (det[i].clar > 0.9 && det[i].s >= 0.5 * sRef ? 0.4 : 0); if (c < D[i + 1][j]) { D[i + 1][j] = c; P[i + 1][j] = 2; } }
      if (j < m) { const c = v + 1; if (c < D[i][j + 1]) { D[i][j + 1] = c; P[i][j + 1] = 3; } }
    }
  }
  const pairs = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    const p = P[i][j];
    if (p === 1) { pairs.push([i - 1, j - 1]); i--; j--; } else if (p === 2) { pairs.push([i - 1, -1]); i--; } else { pairs.push([-1, j - 1]); j--; }
  }
  return pairs.reverse();
}

// ------------------------------------------------------------------ the delay

/**
 * The delay from a scheduled sound to the take: the count-in's clicks heard on the speaker (the recording click near
 * 5 kHz: a 3.5 kHz high-pass, 1 ms energy frames, the first frame past a third of each click's peak). Unheard (on
 * headphones) or unsteady: estimated from what the browser reports. Returns { lag, measured }.
 */
function calibrate(take, clicks, inputLatency) {
  const x = biquad(biquad(take.samples, 'hp', 3500, 0.707, take.sr), 'hp', 3500, 0.707, take.sr);
  const fr = Math.round(take.sr / 1000);
  const lags = [];
  for (const [i, c] of clicks.entries()) {
    const win = Math.min(0.35, 0.9 * ((clicks[i + 1] ?? c + 1) - c));
    const a = Math.round((c - take.t0) * take.sr), b = a + Math.round(win * take.sr);
    if (a < 0 || b > x.length) continue;
    const e = [];
    for (let i = a; i + fr <= b; i += fr) { let s = 0; for (let j = 0; j < fr; j++) s += x[i + j] * x[i + j]; e.push(s); }
    const peak = Math.max(...e), floor = median(e);
    if (!(peak > floor * 40)) continue;   // (16 dB over the window: a click was heard)
    const k = e.findIndex((v) => v > peak / 3);
    lags.push((k * fr) / take.sr);
  }
  if (lags.length >= 2 && sd(lags) < 0.006) return { lag: median(lags), measured: true };
  const ac = A.audioCtx();
  return { lag: A.CLICK_ALIGN + (ac.outputLatency || ac.baseLatency || 0.02) + (inputLatency ?? 0.012), measured: false };
}

// ------------------------------------------------------------------ the judgement

/**
 * Judges a take of a single-note line. `sched`: what the player scheduled during the take, { clicks: [count-in click
 * times], notes: [{ t, midi }] }. Returns { notes: [{ midi, dt (s) or null, inTime, pitch: 'ok' | 'wrong' | 'unclear'
 * | 'missed', heard (midi) }], extra, summary, clean, timing: 'click' (the delay heard on the speaker) | 'estimated'
 * (headphones) | 'even' (judged against the player's own pulse), lag }.
 */
export function judge(take, sched, { inputLatency = null, debug = false } = {}) {
  const { lag, measured } = calibrate(take, sched.clicks, inputLatency);
  const { z, rate } = prep(take.samples, take.sr);
  const zp = biquad(biquad(z, 'lp', 1100, 0.707, rate), 'lp', 1100, 0.707, rate);   // the tuner's pitch band
  const at = (t) => Math.round((t - take.t0) * rate);
  const rmsOf = (a, b) => { a = Math.max(0, a); b = Math.min(zp.length, b); let s = 0; for (let i = a; i < b; i++) s += zp[i] * zp[i]; return Math.sqrt(s / Math.max(1, b - a)); };
  // the room's noise in the count-in, before the first note: an onset must stand 12 dB over it
  // (the quieter third of its 50 ms frames: a player who noodles in the count-in does not raise it)
  const first = sched.notes[0]?.t ?? take.t0 + 1;
  const fr = Math.round(0.05 * rate), frames = [];
  for (let i = at(take.t0 + 0.05); i + fr <= at(first + lag - 0.08); i += fr) frames.push(rmsOf(i, i + fr));
  const floor = frames.length ? [...frames].sort((x, y) => x - y)[Math.floor(frames.length / 3)] : 1e-4;
  const o = odf(z, rate);
  const det = peaks(o, rate, { delta: TUNING.delta }).map((p) => ({ ...p, t: take.t0 + p.t })).filter((p) => {
    const a = at(p.t);
    return rmsOf(a, a + Math.round(0.06 * rate)) > floor * 10 ** (TUNING.gateDb / 20);
  });
  for (const d of det) {
    const a = at(d.t + 0.03), b = at(d.t + 0.13);
    const y = b > a ? yin(zp.subarray(a, b), rate, { fmin: 26, fmax: 520 }) : null;
    d.f = y?.freq ?? null; d.clar = y?.clarity ?? 0;
  }
  const expAt = (L) => sched.notes.map((n, j) => {
    const prevT = j ? sched.notes[j - 1].t : -1e9, nextT = sched.notes[j + 1]?.t ?? 1e9;
    const ioi = Math.min(n.t - prevT, nextT - n.t);
    return { ...n, t: n.t + L, ioi, tol: Math.min(0.11, Math.max(0.04, 0.45 * ioi)) };
  });
  // an estimated delay can be wrong (a phone's output delay, Bluetooth): when another delay matches clearly more
  // notes, that one is taken, and the timing is judged on evenness only (against the player's own pulse)
  const hits = (L) => expAt(L).filter((e) => det.some((d) => Math.abs(d.t - e.t) < 0.04)).length;
  let useLag = lag, timing = measured ? 'click' : 'estimated';
  if (!measured) {
    let best = lag, most = hits(lag);
    for (let L = 0; L <= 0.5; L += 0.005) { const k = hits(L); if (k > most + 1) { most = k; best = L; } }
    if (best !== lag) { useLag = best; timing = 'even'; }
  }
  const exp = expAt(useLag);
  const pairs = align(det, exp);
  const notes = exp.map((e) => ({ midi: e.midi, dt: null, pitch: 'missed', heard: null }));
  const pitchOf = (d, fmin) => {
    // the sustained part: 35 ms after the onset, to the next onset (30 ms before the next written note), 260 ms at most
    const a = at(d.t + 0.035), b = at(Math.min(d.t + 0.26, Math.max(d.until, d.t + 0.1)));
    const seg = zp.subarray(a, Math.max(a, b));
    const y = seg.length > 64 ? yin(seg, rate, { fmin, fmax: 520 }) : null;
    return { a, b, seg, f: y?.freq ?? null, clar: y?.clarity ?? 0 };
  };
  const matched = [];
  for (const [di, ej] of pairs) {
    if (di < 0 || ej < 0) continue;
    const d = det[di], e = exp[ej], r = notes[ej];
    r.dt = d.t - e.t;
    r.s = d.s;
    d.until = exp[ej + 1] ? exp[ej + 1].t - 0.03 : d.t + 1;
    const { a, b, seg, f } = pitchOf(d, Math.max(26, midiF(e.midi) / 2.3));
    r.heard = f != null ? Math.round(69 + 12 * Math.log2(f / 440)) : null;
    if (f != null && Math.abs(pcErrCents(f, e.midi)) <= 50) r.pitch = 'ok';
    else {
      // (no clear pitch, or another one: the written note's period and harmonics against its neighbours')
      const dip = seg.length > 64 ? dipAt(seg, rate, midiF(e.midi)) : null;
      const sal = (m) => { let v = 0; for (let h = 1; h <= 6; h++) { const fh = midiF(m) * h; if (fh < 1000) v += Math.sqrt(goertzel(zp, a, Math.max(a + 64, b), fh, rate)) / Math.sqrt(h); } return v; };
      const se = sal(e.midi), sn = Math.max(sal(e.midi - 1), sal(e.midi + 1), sal(e.midi - 2), sal(e.midi + 2));
      // (no clear pitch: two strings ringing together; the written note's own harmonics standing over its
      // neighbours' say it is there)
      r.pitch = f == null ? ((dip != null && dip < 0.3) || se >= 1.3 * sn ? 'ok' : 'unclear') : se >= sn ? 'ok' : 'wrong';
    }
    matched.push({ d, ej });
  }
  // the study's rules: a weak onset on a note whose pitch was not heard is most likely a note not played; an onset
  // left over is an extra NOTE only when it is about as strong as the notes, with a clear pitch that is not the note
  // already sounding (a low string's sustain swells and makes onsets of its own)
  const medS = median(matched.map(({ d }) => d.s));
  // weak against the notes of its own register (within a major 3rd; user, 2026-10-29: "the B string or lower is not well
  // detected"): a phone's microphone hears a low string far quieter than the others, so its plucks are weak against
  // the take's loudest but not against each other
  const near = (midi) => {
    const s = matched.filter(({ ej }) => Math.abs(exp[ej].midi - midi) <= 4).map(({ d }) => d.s);
    return s.length >= 3 ? Math.min(medS, median(s)) : medS;
  };
  // (and a weak onset that does not raise the level is the note before fading, not a pluck)
  const rises = (t) => rmsOf(at(t + 0.01), at(t + 0.06)) > 1.2 * rmsOf(at(t - 0.06), at(t - 0.01));
  notes.forEach((r, j) => {
    if (r.dt != null && r.s < TUNING.weak * near(r.midi) && (r.pitch !== 'ok' || !rises(exp[j].t + r.dt))) { r.pitch = 'missed'; r.dt = null; }
  });
  let extra = 0;
  for (const [di, ej] of pairs) {
    if (ej >= 0 || di < 0) continue;
    const d = det[di];
    if (!(d.s > TUNING.weak * medS)) continue;
    d.until = det.find((q) => q.t > d.t + 0.03)?.t ?? d.t + 1;
    const { f, clar } = pitchOf(d, 26);
    if (clar <= 0.8 || f == null) continue;
    const prev = matched.filter(({ d: q }) => q.t < d.t).pop();
    if (prev && Math.abs(pcErrCents(f, exp[prev.ej].midi)) <= 50) continue;
    extra++;
  }
  // in time: within 50 ms of the click (less on fast notes: a fifth of the gap, 25 ms at least); with the delay
  // estimated, within that of the player's own steady pulse (the median)
  const timed = notes.map((r, j) => ({ r, j })).filter(({ r }) => r.dt != null);
  const centre = timing === 'click' ? 0 : median(timed.map(({ r }) => r.dt));
  for (const { r, j } of timed) {
    const thr = Math.min(0.05, Math.max(0.025, 0.2 * exp[j].ioi));
    r.inTime = Math.abs(r.dt - centre) <= thr;
  }
  const ms = timed.map(({ r }) => r.dt * 1000);
  const inTime = timed.filter(({ r }) => r.inTime).length;
  const summary = {
    total: notes.length,
    right: notes.filter((r) => r.pitch === 'ok').length,
    wrong: notes.filter((r) => r.pitch === 'wrong').length,
    unclear: notes.filter((r) => r.pitch === 'unclear').length,
    missed: notes.filter((r) => r.pitch === 'missed').length,
    extra,
    bias: ms.length && timing !== 'even' ? Math.round(median(ms)) : null,
    spread: ms.length > 1 ? Math.round(sd(ms)) : null,
    timed: ms.length,
    inTime,
  };
  const clean = summary.missed === 0 && summary.wrong === 0 && extra === 0 && summary.unclear <= Math.floor(notes.length / 10)
    && inTime >= Math.ceil(0.9 * timed.length);
  return { notes, extra, summary, clean, timing, lag: useLag, ...(debug ? { det, exp, medS } : {}) };
}
