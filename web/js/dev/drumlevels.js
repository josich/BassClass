// Dev tool (not used by the app): the drum kit's balance as the ear hears it.
//   measure()  each recorded layer's loudness, A-weighted dB over a hit's first 170 ms (the mean of its round
//              robins), printed as the LAYER_DB table of web/js/drums.js: run it again when the kit changes.
//   balance()  every pattern's tracks at its own tempo and subdivision, in dB against its backbeat (snare,
//              rim, cross-stick; else its loudest track), from drums.js's levels; a time-keeper louder than
//              6 dB under the backbeat is flagged.
// Run in the page:  (await import('./js/dev/drumlevels.js')).balance()
import { STYLES, stepTime, TIMEKEEP } from '../practice/styles.js';
import { strokeDb, trackGain } from '../drums.js';

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
