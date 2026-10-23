// Dev tool (not used by the app): the drum kit's balance as the ear hears it.
//   measure()  each recorded layer's loudness, A-weighted dB over a hit's first 170 ms (the mean of its round
//              robins), printed as the LAYER_DB table of web/js/drums.js: run it again when the kit changes.
//   balance()  every pattern's tracks at its own tempo and subdivision, in dB against its backbeat (snare,
//              rim, cross-stick; else its loudest track), from drums.js's levels; a time-keeper louder than
//              6 dB under the backbeat is flagged.
//   chain()    every pattern rendered through the room's drum chain (audio.js drumChain, at 100%): its
//              A-weighted loudness and its peak, and the CHAIN_DB table of drums.js that brings the
//              patterns the limiter pulls away from the median back to it (run again when patterns change).
// Run in the page:  (await import('./js/dev/drumlevels.js')).balance()
import { STYLES, stepTime, TIMEKEEP, beatHits } from '../practice/styles.js';
import { strokeDb, trackGain, styleGain, voice, loadKit } from '../drums.js';
import { drumChain } from '../audio.js';

const N = 8192;   // samples measured: 170 ms at 48 kHz

function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2;
        const vr = re[b] * cr - im[b] * ci, vi = re[b] * ci + im[b] * cr;
        re[b] = re[a] - vr; im[b] = im[a] - vi; re[a] += vr; im[a] += vi;
        [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
      }
    }
  }
}

/** The A-weighting curve as a power factor (IEC 61672, +2 dB at 1 kHz). */
function aWeight(f) {
  const f2 = f * f;
  const ra = (12194 ** 2 * f2 * f2) / ((f2 + 20.6 ** 2) * Math.sqrt((f2 + 107.7 ** 2) * (f2 + 737.9 ** 2)) * (f2 + 12194 ** 2));
  return ra * ra * 10 ** 0.2;
}

function aEnergy(buf) {
  let e = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    const re = new Float64Array(N), im = new Float64Array(N);
    re.set(d.subarray(0, N));
    fft(re, im);
    for (let k = 1; k < N / 2; k++) e += 2 * (re[k] ** 2 + im[k] ** 2) * aWeight((k * buf.sampleRate) / N);
  }
  return e / N / buf.numberOfChannels / buf.sampleRate;
}

export async function measure() {
  const man = await (await fetch('audio/drums/kit.json')).json();
  const ac = new AudioContext();
  const rows = [];
  for (const [piece, layers] of Object.entries(man.pieces)) {
    const dbs = [];
    for (const files of layers) {
      let e = 0;
      for (const f of files) e += aEnergy(await ac.decodeAudioData(await (await fetch(`audio/drums/${f}`)).arrayBuffer()));
      dbs.push((10 * Math.log10(e / files.length)).toFixed(1));
    }
    rows.push(`${piece}: [${dbs.join(', ')}]`);
  }
  ac.close();
  const text = `const LAYER_DB = {\n  ${rows.join(', ')},\n};`;
  console.log(text);
  return text;
}

/** A-weighted loudness of a whole buffer (dB), frame by frame. */
export function aLoudness(buf) {
  const F = 4096;
  let e = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let at = 0; at + F <= d.length; at += F) {
      const re = new Float64Array(F), im = new Float64Array(F);
      re.set(d.subarray(at, at + F));
      fft(re, im);
      for (let k = 1; k < F / 2; k++) e += (2 * (re[k] ** 2 + im[k] ** 2) * aWeight((k * buf.sampleRate) / F)) / F;
    }
  }
  return 10 * Math.log10(e / buf.numberOfChannels / buf.length);
}

/** A pattern's 8 bars at its tempo and subdivision, rendered through the drum chain: { db, peak }. */
async function render(s, gain = 1, bars = 8) {
  const SR = 48000, len = 60 / s.bpm;
  const ctx = new OfflineAudioContext(2, Math.ceil((bars * s.beats * len + 1) * SR), SR);
  const chain = drumChain(ctx);
  chain.output.connect(ctx.destination);
  let openHat = null;
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < s.beats; beat++) {
      const t0 = 0.05 + (bar * s.beats + beat) * len;
      for (const [f, piece, v] of beatHits(s, s.sub, bar, beat)) {
        const vc = voice(piece, v);
        if (!vc) continue;
        const t = t0 + f * len;
        const src = ctx.createBufferSource();
        src.buffer = vc.buffer;
        const g = ctx.createGain();
        g.gain.value = vc.gain * styleGain(s.key, false) * trackGain(s, piece) * gain;
        src.connect(g).connect(chain.input);
        src.start(t);
        if (/^hh[chp]$/.test(piece) && openHat) { openHat.gain.setTargetAtTime(0, t, 0.015); openHat = null; }
        if (piece === 'hho') openHat = g;
      }
    }
  }
  const buf = await ctx.startRendering();
  let peak = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) for (const x of buf.getChannelData(c)) peak = Math.max(peak, Math.abs(x));
  return { db: aLoudness(buf), peak: 20 * Math.log10(peak) };
}

export async function chain() {
  await loadKit();
  const styles = Object.values(STYLES);
  const first = [];
  for (const s of styles) first.push(await render(s));
  const sorted = first.map((r) => r.db).sort((a, b) => a - b);
  const mid = sorted[Math.floor(sorted.length / 2)];
  // a pattern more than 1 dB off the median gets a correction, checked again through the chain (it is not linear)
  const fix = {};
  for (const [i, s] of styles.entries()) {
    let c = mid - first[i].db;
    if (Math.abs(c) <= 1) continue;
    for (let round = 0; round < 3; round++) c += mid - (await render(s, 10 ** (c / 20))).db;
    fix[s.key] = Math.max(-18, Math.min(18, Math.round(c * 2) / 2));
  }
  const after = [];
  for (const s of styles) after.push(await render(s, 10 ** ((fix[s.key] || 0) / 20)));
  const off = after.map((r) => Math.abs(r.db - mid));
  const report = {
    median: mid.toFixed(1),
    spreadBefore: `${(Math.min(...sorted) - mid).toFixed(1)} … +${(Math.max(...sorted) - mid).toFixed(1)} dB`,
    within1dBAfter: `${off.filter((d) => d <= 1).length} of ${styles.length}`,
    worstAfter: `${Math.max(...off).toFixed(1)} dB`,
    maxPeak: `${Math.max(...after.map((r) => r.peak)).toFixed(2)} dB (${styles[after.findIndex((r) => r.peak === Math.max(...after.map((x) => x.peak)))].key})`,
    table: `// (measured by web/js/dev/drumlevels.js chain(): each pattern's correction after the drum chain, dB)
const CHAIN_DB = { ${Object.entries(fix).map(([k, v]) => `${k}: ${v}`).join(', ')} };`,
  };
  console.log(report.table);
  return report;
}

const BACKBEAT = new Set(['snare', 'rim', 'xstick', 'flam', 'bsnare']);

export function balance() {
  const out = [];
  for (const s of Object.values(STYLES)) {
    const per = s.beats * s.grid;
    const tracks = {};
    for (const [piece, steps] of Object.entries(s.tracks)) {
      let e = 0;
      steps.forEach((v, i) => {
        if (v && stepTime(s, s.sub, i % s.grid, piece, v) != null) e += 10 ** (strokeDb(piece, v) / 10) * trackGain(s, piece) ** 2 * (s.bars / (steps.length / per));
      });
      if (e) tracks[piece] = 10 * Math.log10(e / ((s.bars * s.beats * 60) / s.bpm));
    }
    const back = Object.entries(tracks).filter(([p]) => BACKBEAT.has(p)).map(([, d]) => d);
    const ref = back.length ? Math.max(...back) : Math.max(...Object.values(tracks));
    const rel = Object.fromEntries(Object.entries(tracks).map(([p, d]) => [p, Math.round((d - ref) * 10) / 10]));
    const loud = back.length ? Object.entries(rel).filter(([p, d]) => (TIMEKEEP.has(p) || /^hh|guiro|tamb|cowbell|tri|agogo/.test(p)) && d > -6) : [];
    out.push({ pattern: s.key, ...rel, flag: loud.map(([p]) => p).join(' ') });
  }
  console.table(out);
  return out;
}
