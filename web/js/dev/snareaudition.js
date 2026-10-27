// Dev tool (not used by the app): listening clips of candidate snares (user, 2026-10-27: the strong snare
// "sounds too metallic and reverberant", and in jazz and blues "too strident"). MuldjordKit's stereo build has
// one snare (two hands, Snare1 and Snare2) with its room in it, so the candidates are shaped from it: its
// tail cut short (the room goes), its ring dipped, a softer hit as the accent, highs softened for jazz; and,
// for jazz and blues, the Virtuosity snare the app played before (CC0, its mics staged in web/_raw/drums2/).
// Each candidate's layers are matched in loudness to the app's own, layer by layer, so the strokes keep their
// balance; every clip plays the app's other pieces through its drum chain.
// Writes web/_raw/audition/snare-*.wav (tools/serve.py). Run:  (await import('/js/dev/snareaudition.js')).run()
import { aLoudness } from './drumlevels.js';
import { loadKit, voice, styleGain, trackGain } from '../drums.js';
import { STYLES, beatHits } from '../practice/styles.js';
import { drumChain } from '../audio.js';

const SR = 48000;
const MUL = '/_raw/kits/muldjord/MuldjordKit SFZ+FLAC-20201018/samples/';
const DIR = '/_raw/drums2/';
const staged = (f) => DIR + f.replace(':', '_').replace(/\//g, '_');
const decode = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`missing ${url}`);
  return new OfflineAudioContext(2, 1, SR).decodeAudioData(await res.arrayBuffer());
};
const peakOf = (chs) => chs.reduce((a, c) => c.reduce((m, v) => Math.max(m, Math.abs(v)), a), 0);

/** A hit from just before its onset, at most `max` s. */
function cut(chs, max = 1) {
  const pk = peakOf(chs), n = chs[0].length;
  let a = 0;
  while (a < n && chs.every((c) => Math.abs(c[a]) < pk * 0.04)) a++;
  a = Math.max(0, a - Math.round(SR * 0.0005));
  const b = Math.min(n, a + Math.round(max * SR));
  return chs.map((c) => c.slice(a, b));
}

/** MuldjordKit's hits of one folder, soft to hard (by peak). */
async function muldjordHits(folder) {
  const html = await (await fetch(MUL + encodeURIComponent(folder) + '/')).text();
  const files = [...html.matchAll(/href="([^"]+\.flac)"/g)].map((m) => decodeURIComponent(m[1]));
  const hits = [];
  for (const f of files) {
    const b = await decode(MUL + encodeURIComponent(folder) + '/' + encodeURIComponent(f));
    hits.push(cut([0, 1].map((c) => b.getChannelData(Math.min(c, b.numberOfChannels - 1)).slice())));
  }
  return hits.sort((a, b) => peakOf(a) - peakOf(b));
}
/** Four layers of two round robins, as drumprep.js takes them (`top`: where the accent sits, 1 = the hardest). */
function layersOf(hits, top = 1) {
  const out = [];
  for (let l = 0; l < 4; l++) {
    const at = Math.round(((l + 1) / 4) * top * (hits.length - 1));
    out.push([hits[Math.max(0, at - 1)], hits[at]]);
  }
  return out;
}

// ---- a little spectrum (radix-2 FFT), to find the ring
function spectrum(y, from, len) {
  const n = 1 << Math.ceil(Math.log2(len));
  const re = new Float64Array(n), im = new Float64Array(n);
  for (let i = 0; i < len && from + i < y.length; i++) re[i] = y[from + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / len));
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const ang = (-2 * Math.PI) / size;
    for (let i = 0; i < n; i += size) {
      for (let k = 0; k < size / 2; k++) {
        const wr = Math.cos(ang * k), wi = Math.sin(ang * k);
        const a = i + k, b = a + size / 2;
        const tr = re[b] * wr - im[b] * wi, ti = re[b] * wi + im[b] * wr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
      }
    }
  }
  const mag = new Float64Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return { mag, hz: SR / n };
}
/** The ring: the strongest peaks of a hit's tail (60–300 ms), in Hz. */
export function ringOf(chs) {
  const y = chs[0];
  const { mag, hz } = spectrum(y, Math.round(0.06 * SR), Math.round(0.24 * SR));
  const peaks = [];
  for (let i = Math.round(120 / hz); i < Math.round(9000 / hz); i++) {
    if (mag[i] > mag[i - 1] && mag[i] >= mag[i + 1]) peaks.push([i * hz, mag[i]]);
  }
  peaks.sort((a, b) => b[1] - a[1]);
  const top = peaks[0][1];
  return peaks.slice(0, 6).map(([f, m]) => [Math.round(f), +(20 * Math.log10(m / top)).toFixed(1)]);
}
/** How long a hit rings: ms until it stays 30 dB under its peak (a 5 ms window). */
export function ringMs(chs) {
  const y = chs[0], w = Math.round(0.005 * SR), pk = peakOf(chs);
  let last = 0;
  for (let i = 0; i + w < y.length; i += w) {
    let m = 0;
    for (let k = i; k < i + w; k++) m = Math.max(m, Math.abs(y[k]));
    if (m > pk * 0.0316) last = i;
  }
  return Math.round((last / SR) * 1000);
}

/**
 * A hit shaped: the tail cut (`hold` s at full, then a `tau` s decay), EQ (a dip at `dipHz` of `dip` dB, a high
 * shelf at `shelfHz` of `shelf` dB, a low shelf at 220 Hz of `body` dB for warmth).
 */
async function shape(chs, { hold = 1, tau = 1, dipHz = 0, dip = 0, shelfHz = 4000, shelf = 0, body = 0 }) {
  const len = Math.min(chs[0].length, Math.round((hold + tau * 4.6) * SR));
  const oc = new OfflineAudioContext(chs.length, len, SR);
  const b = oc.createBuffer(chs.length, len, SR);
  chs.forEach((c, i) => {
    const y = c.slice(0, len);
    for (let k = 0; k < len; k++) { const t = k / SR; if (t > hold) y[k] *= Math.exp(-(t - hold) / tau); }
    b.getChannelData(i).set(y);
  });
  const src = oc.createBufferSource(); src.buffer = b;
  const d = oc.createBiquadFilter(); d.type = 'peaking'; d.frequency.value = dipHz || 1000; d.Q.value = 4; d.gain.value = dipHz ? dip : 0;
  const s = oc.createBiquadFilter(); s.type = 'highshelf'; s.frequency.value = shelfHz; s.gain.value = shelf;
  const w = oc.createBiquadFilter(); w.type = 'lowshelf'; w.frequency.value = 220; w.gain.value = body;
  src.connect(d).connect(s).connect(w).connect(oc.destination);
  src.start();
  const out = await oc.startRendering();
  const res = [...Array(out.numberOfChannels)].map((_, i) => out.getChannelData(i).slice());
  // (the last 5 ms faded, so the cut never clicks)
  const f = Math.round(SR * 0.005);
  for (const y of res) for (let i = 0; i < f; i++) y[y.length - f + i] *= 1 - i / f;
  return res;
}

const toBuffer = (chs) => {
  const b = new AudioBuffer({ length: chs[0].length, sampleRate: SR, numberOfChannels: chs.length });
  chs.forEach((c, i) => b.getChannelData(i).set(c));
  return b;
};

/** A candidate's buffers, each layer matched in loudness to the app's own snare layer of the same place. */
function matched(layers, appLayers) {
  return layers.map((row, l) => {
    const g = 10 ** ((aLoudness(appLayers[l]) - aLoudness(toBuffer(row.at(-1)))) / 20);
    return row.map((chs) => toBuffer(chs.map((c) => c.map((x) => x * g))));
  });
}

// (user, 2026-10-27: "ride, crash, hi-hat sound too loud compared to the other elements": through the louder
// chain the limiter takes more from the kick and snare than from the cymbals' long rings) the cymbals lowered, dB
export const CYMBALS = { hhc: -4, hhh: -4, hho: -4, hhp: -3, ride: -5, bell: -5, crash: -5 };

/**
 * A clip: four snare hits soft to hard, then `bars` of a pattern; `snare(v)` gives the snare's { buffer, gain };
 * `cym`: the cymbals lowered by CYMBALS.
 */
async function clip(key, bars, snare, cym = false, intro = true) {
  const s = STYLES[key], len = 60 / s.bpm, lead = intro ? 3 : 0.1;
  const secs = lead + bars * s.beats * len + 1.2;
  const ctx = new OfflineAudioContext(2, Math.ceil(secs * SR), SR);
  const chain = drumChain(ctx);
  // (all clips 2 dB down alike: the chain alone has no limiter after it, as the app has)
  const out = ctx.createGain(); out.gain.value = 0.8;
  chain.output.connect(out).connect(ctx.destination);
  let open = null;
  const play = (h, gain, t, piece) => {
    const src = ctx.createBufferSource(); src.buffer = h.buffer;
    const g = ctx.createGain(); g.gain.value = h.gain * gain;
    src.connect(g).connect(chain.input); src.start(t);
    if (/^hh[chp]$/.test(piece) && open) { open.gain.setTargetAtTime(0, t, 0.015); open = null; }
    if (piece === 'hho') open = g;
  };
  const sg = styleGain(key);
  if (intro) [0.45, 0.72, 0.95, 0.95].forEach((v, i) => play(snare(v), sg * trackGain(s, 'snare'), 0.1 + i * 0.7, 'snare'));
  for (let bar = 0; bar < bars; bar++) {
    for (let beat = 0; beat < s.beats; beat++) {
      const t0 = lead + (bar * s.beats + beat) * len;
      for (const [f, piece, v] of beatHits(s, s.sub, bar, beat)) {
        const h = piece === 'snare' ? snare(v) : voice(piece, v);
        const down = cym && CYMBALS[piece] ? 10 ** (CYMBALS[piece] / 20) : 1;
        if (h) play(h, sg * trackGain(s, piece) * down, t0 + f * len, piece);
      }
    }
  }
  const buf = await ctx.startRendering();
  return [buf.getChannelData(0), buf.getChannelData(1)];
}

function wav([L, R]) {
  const n = L.length, buf = new ArrayBuffer(44 + n * 4), v = new DataView(buf);
  const str = (o, x) => { for (let i = 0; i < x.length; i++) v.setUint8(o + i, x.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, SR, true);
  v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  return buf;
}

/** What the snares are like: each one's ring (ms to 30 dB down) and the strongest peaks of its tail. */
export async function study() {
  const s1 = await muldjordHits('Snare1'), s2 = await muldjordHits('Snare2');
  const spec = await (await fetch(DIR + 'kit2.json')).json();
  const virt = [];
  for (const files of spec.snare.at(-1)) {
    const bufs = await Promise.all(files.map((f) => decode(staged(f))));
    const n = Math.max(...bufs.map((b) => b.length)), y = new Float32Array(n);
    for (const b of bufs) { const d = b.getChannelData(0); for (let i = 0; i < d.length; i++) y[i] += d[i]; }
    virt.push(cut([y]));
  }
  const row = (name, h) => ({ name, ms: ringMs(h), ring: ringOf(h) });
  return [row('Snare1 hardest', s1.at(-1)), row('Snare1 at 85%', s1[Math.round(0.85 * (s1.length - 1))]),
    row('Snare2 hardest', s2.at(-1)), row('Virtuosity hardest', virt.at(-1))];
}

export async function run() {
  await loadKit();
  const appLayers = [0.2, 0.45, 0.72, 0.95].map((v) => voice('snare', v).buffer);
  const s1 = await muldjordHits('Snare1');
  // the ring to dip: the strongest peak of the hardest hit's tail
  const [[ringHz]] = ringOf(s1.at(-1));
  const DRY = { hold: 0.06, tau: 0.045, dipHz: ringHz, dip: -6 };
  const shapeAll = async (layers, how) => Promise.all(layers.map((row) => Promise.all(row.map((h) => shape(h, how)))));
  // the Virtuosity snare (as the app played it before: kick mic, snare mic and overheads summed)
  const spec = await (await fetch(DIR + 'kit2.json')).json();
  const virt = [];
  for (const layer of spec.snare) {
    const row = [];
    for (const files of layer) {
      const bufs = await Promise.all(files.map((f) => decode(staged(f))));
      const n = Math.max(...bufs.map((b) => b.length));
      const L = new Float32Array(n), R = new Float32Array(n);
      for (const b of bufs) {
        const l = b.getChannelData(0), r = b.numberOfChannels > 1 ? b.getChannelData(1) : l;
        for (let i = 0; i < b.length; i++) { L[i] += l[i]; R[i] += r[i]; }
      }
      row.push(cut([L, R]));
    }
    virt.push(row);
  }
  const candidates = {
    'snare-rock-a-now': null,
    'snare-rock-b-dry': matched(await shapeAll(layersOf(s1), DRY), appLayers),
    'snare-rock-c-dry-softer-accent-less-metal': matched(await shapeAll(layersOf(s1, 0.85), { ...DRY, shelfHz: 5000, shelf: -4 }), appLayers),
    'snare-jazz-a-now': null,
    'snare-jazz-b-dry-warm': matched(await shapeAll(layersOf(s1, 0.85), { ...DRY, shelfHz: 3500, shelf: -8, body: 2 }), appLayers),
    'snare-jazz-c-old-virtuosity': matched(virt, appLayers),
  };
  const out = [`ring dipped: ${ringHz} Hz`];
  for (const [name, bufs] of Object.entries(candidates)) {
    let turn = 0;
    const snare = bufs
      ? (v) => {
        const li = Math.round(Math.max(0, Math.min(1, (v - 0.2) / 0.75)) * 3);
        return { buffer: bufs[li][turn++ % bufs[li].length], gain: voice('snare', v).gain };
      }
      : (v) => voice('snare', v);
    const jazz = name.includes('jazz');
    // rock: four bars of rock 8ths, two of 16th funk; jazz: four bars of swing, one of a slow blues
    const parts = jazz ? [['swing', 4], ['slowblues', 1]] : [['rock8', 4], ['funk16', 2]];
    const clips = [];
    for (const [i, [key, bars]] of parts.entries()) clips.push(await clip(key, bars, snare, !name.endsWith('-now'), i === 0));
    const L = new Float32Array(clips.reduce((a, c) => a + c[0].length, 0)), R = new Float32Array(L.length);
    let at = 0;
    for (const [l, r] of clips) { L.set(l, at); R.set(r, at); at += l.length; }
    const res = await fetch(`/__write/_raw/audition/${name}.wav`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav([L, R]) });
    if (!res.ok) throw new Error(`could not write ${name}: ${res.status}`);
    out.push(`${name}.wav ${(L.length / SR).toFixed(1)} s`);
  }
  return out;
}
