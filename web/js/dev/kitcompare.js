// Dev tool (not used by the app): listening clips of candidate drum kits (user, 2026-10-27: the kick sounded
// like a goliath drum; "maybe find a different drum set"). Each kit plays four kicks, four snares, four bars
// of rock 8ths and two of 16th funk (practice/styles.js), every piece at the same level on every kit, so the
// kits are heard on equal terms. Kits are read from web/_raw/kits/ (not committed):
//   - MuldjordKit (Lars Muldjord, FreePats stereo build, CC BY 4.0): SFZ + stereo FLAC per hit;
//   - ShittyKit (Sardonicus, DrumGizmo, CC BY 4.0): one 8-channel WAV per hit (kick, snare, tom, floor,
//     overheads, room), mixed here from the close mics and the overheads (no room: dry);
//   - the app's own kit as it plays now.
// Writes web/_raw/audition/kit-*.wav (tools/serve.py). Run:  (await import('/js/dev/kitcompare.js')).run()
import { STYLES } from '../practice/styles.js';
import { loadKit, voice } from '../drums.js';

const SR = 48000;
const MUL = '/_raw/kits/muldjord/MuldjordKit SFZ+FLAC-20201018/samples/';
const SHIT = '/_raw/kits/shittykit/ShittyKit/Instruments/';
// each piece's loudest layer at this level (dB RMS of its first 50 ms), on every kit
const TARGET = { kick: -15, snare: -14, hhc: -24, hho: -22 };

const decode = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`missing ${url}`);
  return new OfflineAudioContext(2, 1, SR).decodeAudioData(await res.arrayBuffer());
};
/** A stereo hit cut from just before its onset. */
function cut([L, R]) {
  let pk = 0;
  for (let i = 0; i < L.length; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  let a = 0;
  while (a < L.length && Math.abs(L[a]) < pk * 0.04 && Math.abs(R[a]) < pk * 0.04) a++;
  a = Math.max(0, a - 24);
  return [L.slice(a), R.slice(a)];
}
const peak = ([L, R]) => { let p = 0; for (let i = 0; i < L.length; i++) p = Math.max(p, Math.abs(L[i]), Math.abs(R[i])); return p; };
const rmsDb = ([L, R]) => { let s = 0; const w = Math.min(L.length, SR * 0.05); for (let i = 0; i < w; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2; return 10 * Math.log10(s / w); };

/** Hits sorted soft to hard (by peak), grouped into `n` layers of round robins. */
function layered(hits, n = 4) {
  const sorted = [...hits].sort((a, b) => peak(a) - peak(b));
  const layers = [];
  for (let l = 0; l < n; l++) {
    const from = Math.floor((l * sorted.length) / n), to = Math.floor(((l + 1) * sorted.length) / n);
    layers.push(sorted.slice(from, Math.max(to, from + 1)).slice(-3));
  }
  return layers;
}

// ---- MuldjordKit: a folder of stereo FLAC hits per piece (the dev server lists folders as HTML)
async function muldjordPiece(folder) {
  const html = await (await fetch(MUL + encodeURIComponent(folder) + '/')).text();
  const files = [...html.matchAll(/href="([^"]+\.flac)"/g)].map((m) => decodeURIComponent(m[1]));
  const hits = await Promise.all(files.map(async (f) => { const b = await decode(MUL + encodeURIComponent(folder) + '/' + encodeURIComponent(f)); return cut([b.getChannelData(0), b.getChannelData(b.numberOfChannels > 1 ? 1 : 0)].map((c) => c.slice())); }));
  return layered(hits);
}

// ---- ShittyKit: an instrument file names its hits; each hit is one 8-channel WAV, mixed here
const SHIT_MIX = { kick: [1, 0, 0, 0], snare: [0, 1, 0, 0], Tom: [0, 0, 1, 0], Floor: [0, 0, 0, 1] };
async function shittyPiece(file, close, oh = 0.5) {
  const xml = new DOMParser().parseFromString(await (await fetch(SHIT + file)).text(), 'application/xml');
  const hits = [];
  for (const s of xml.querySelectorAll('sample')) {
    const a = s.querySelector('audiofile');
    const b = await decode(SHIT + a.getAttribute('file'));
    const n = b.length, L = new Float32Array(n), R = new Float32Array(n);
    const ch = (i) => (i < b.numberOfChannels ? b.getChannelData(i) : null);
    // close mic(s) in the centre, overheads (5, 6) left and right; the room (7, 8) left out: dry
    for (const [name, i] of [['kick', 0], ['snare', 1], ['Tom', 2], ['Floor', 3]]) {
      const g = close === name ? 1 : 0;
      const d = ch(i);
      if (!g || !d) continue;
      for (let k = 0; k < n; k++) { L[k] += g * d[k]; R[k] += g * d[k]; }
    }
    const l = ch(4), r = ch(5);
    if (l && r) for (let k = 0; k < n; k++) { L[k] += oh * l[k]; R[k] += oh * r[k]; }
    hits.push(cut([L, R]));
  }
  return layered(hits);
}

/** Scales each piece so its loudest layer meets its target. */
function level(kit) {
  for (const [piece, layers] of Object.entries(kit)) {
    const g = 10 ** ((TARGET[piece] - rmsDb(layers.at(-1)[0])) / 20);
    for (const layer of layers) for (const [L, R] of layer) for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
  }
  return kit;
}

/** The clip: four kicks, four snares, four bars of rock 8ths, two of 16th funk; at -16 dB RMS. */
async function render(kit) {
  const parts = [['rock8', 4], ['funk16', 2]];
  const total = 5 + parts.reduce((a, [k, bars]) => a + (bars * STYLES[k].beats * 60) / STYLES[k].bpm + 0.7, 0);
  const oc = new OfflineAudioContext(2, Math.ceil(total * SR), SR);
  const limit = oc.createDynamicsCompressor();
  limit.threshold.value = -6; limit.knee.value = 3; limit.ratio.value = 12; limit.attack.value = 0.002; limit.release.value = 0.1;
  limit.connect(oc.destination);
  const turn = {};
  let open = null;
  const play = (piece, v, when) => {
    const layers = kit[piece];
    if (!layers) return;
    const rrs = layers[Math.min(layers.length - 1, Math.floor(v * layers.length))];
    turn[piece] = ((turn[piece] ?? -1) + 1) % rrs.length;
    const [L, R] = rrs[turn[piece]];
    const b = oc.createBuffer(2, L.length, SR);
    b.copyToChannel(L, 0); b.copyToChannel(R, 1);
    const src = oc.createBufferSource(); src.buffer = b;
    const g = oc.createGain(); g.gain.value = 0.7 + 0.3 * v;
    src.connect(g).connect(limit); src.start(when);
    if (open && piece === 'hhc') { open.gain.setTargetAtTime(0, when, 0.015); open = null; }
    if (piece === 'hho') open = g;
  };
  [0.95, 0.72, 0.95, 0.45].forEach((v, i) => play('kick', v, 0.2 + i * 0.55));
  [0.95, 0.72, 0.95, 0.45].forEach((v, i) => play('snare', v, 2.6 + i * 0.55));
  let t = 5;
  for (const [key, bars] of parts) {
    const s = STYLES[key], step = 60 / s.bpm / s.grid, steps = bars * s.beats * s.grid;
    for (let i = 0; i < steps; i++) {
      for (const [piece, track] of Object.entries(s.tracks)) {
        const v = track[i % track.length];
        if (v) play(piece, v, t + i * step);
      }
    }
    t += steps * step + 0.7;
  }
  const out = await oc.startRendering();
  const L = out.getChannelData(0), R = out.getChannelData(1);
  let s = 0, pk = 0;
  for (let i = 0; i < L.length; i++) { s += (L[i] * L[i] + R[i] * R[i]) / 2; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
  const g = Math.min(10 ** ((-16 - 10 * Math.log10(s / L.length)) / 20), 0.89 / pk);
  return [L.map((x) => x * g), R.map((x) => x * g)];
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

export async function run() {
  await loadKit();
  // the app's kit now: its own layers, as voice() picks them, soft to hard
  const now = {};
  for (const piece of Object.keys(TARGET)) {
    now[piece] = [0.2, 0.45, 0.72, 0.95].map((v) => [0, 1].map(() => { const b = voice(piece, v).buffer; const L = b.getChannelData(0); return cut([L.slice(), (b.numberOfChannels > 1 ? b.getChannelData(1) : L).slice()]); }));
  }
  const kits = [
    ['kit-1-now', now],
    ['kit-2-muldjord', { kick: await muldjordPiece('KdrumL'), snare: await muldjordPiece('Snare1'), hhc: await muldjordPiece('HihatClosed'), hho: await muldjordPiece('HihatOpen') }],
    ['kit-3-shittykit-dry', { kick: await shittyPiece('kick.xml', 'kick'), snare: await shittyPiece('snare-Dyn-RH.xml', 'snare'), hhc: await shittyPiece('HH-closed.xml', null, 1), hho: await shittyPiece('HH-open.xml', null, 1) }],
  ];
  const done = [];
  for (const [name, kit] of kits) {
    const clip = await render(level(kit));
    const res = await fetch(`/__write/_raw/audition/${name}.wav`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav(clip) });
    if (!res.ok) throw new Error(`could not write ${name}: ${res.status}`);
    done.push(`${name}.wav ${(clip[0].length / SR).toFixed(1)} s`);
  }
  return done;
}
