// Pitch detection for the tuner: YIN (de Cheveigné & Kawahara, 2002) on a
// decimated, low-passed signal so low bass notes (B0 = 30.9 Hz) stay cheap to track.

/**
 * Estimate the fundamental frequency of `buf` (sampled at `sr`).
 * Returns { freq, clarity } or null when no clear pitch is present.
 */
export function yin(buf, sr, { fmin = 26, fmax = 520, threshold = 0.13 } = {}) {
  const tauMin = Math.max(2, Math.floor(sr / fmax));
  const tauMax = Math.min(Math.floor(sr / fmin), Math.floor(buf.length / 2));
  const W = buf.length - tauMax;
  if (W < tauMax) return null;
  const d = new Float32Array(tauMax + 2);
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    let sum = 0;
    for (let j = 0; j < W; j++) {
      const v = buf[j] - buf[j + tau];
      sum += v * v;
    }
    d[tau] = sum;
  }
  // cumulative mean normalized difference
  const cm = new Float32Array(tauMax + 2);
  cm[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax + 1; tau++) {
    running += d[tau];
    cm[tau] = running > 0 ? (d[tau] * tau) / running : 1;
  }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (cm[t] < threshold) {
      while (t + 1 <= tauMax && cm[t + 1] < cm[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) {
    // no dip under the threshold: accept the global minimum only if it is reasonably clear
    let best = tauMin;
    for (let t = tauMin; t <= tauMax; t++) if (cm[t] < cm[best]) best = t;
    if (cm[best] > 0.3) return null;
    tau = best;
  }
  // parabolic interpolation around the minimum
  const a = cm[tau - 1], b = cm[tau], c = cm[tau + 1];
  const den = a - 2 * b + c;
  const shift = den !== 0 ? (a - c) / (2 * den) : 0;
  const t = tau + Math.max(-1, Math.min(1, shift));
  return { freq: sr / t, clarity: 1 - b };
}

export const rms = (buf) => {
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i] * buf[i];
  return Math.sqrt(s / buf.length);
};

/** Note info for a frequency: nearest midi, cents offset. */
export function freqToNote(freq, a4 = 440) {
  const midi = 69 + 12 * Math.log2(freq / a4);
  const n = Math.round(midi);
  return { midi: n, cents: (midi - n) * 100 };
}

export const midiFreq = (midi, a4 = 440) => a4 * Math.pow(2, (midi - 69) / 12);
