// Dev tool (not used by the app): renders the same grooves (Rock, Funk, Swing from practice/styles.js) on
// candidate drum kits, at the same loudness, into WAV clips in web/_raw/audition/ to compare by ear.
// Kit 1 is the app's own kit (web/audio/drums/); the others are mixes of each library's mics, staged in
// web/_raw/audition/ with kits.json (piece → layers soft to hard → round robins → the mic files of one hit).
// Needs tools/serve.py. Run:  (await import('./js/dev/drumaudition.js')).run()
import { STYLES } from '../practice/styles.js';

const SR = 48000;
const GROOVES = [['rock', 100], ['funk', 96], ['swing', 140]];   // two bars each
// each piece's loudest layer at this level (dB RMS of its first 50 ms), so the kits are heard on equal terms
const TARGET = { kick: -15, snare: -14, hhc: -24, hho: -22, ride: -23, hhp: -28 };

async function decode(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`missing ${url}`);
  return new OfflineAudioContext(2, 1, SR).decodeAudioData(await res.arrayBuffer());
}

/** One hit: its mic files summed (mono ones to both sides), cut from just before the onset. */
async function hit(files, dir) {
  const bufs = await Promise.all(files.map((f) => decode(dir + f)));
  const n = Math.max(...bufs.map((b) => b.length));
  const L = new Float32Array(n), R = new Float32Array(n);
  for (const b of bufs) {
    const l = b.getChannelData(0), r = b.numberOfChannels > 1 ? b.getChannelData(1) : l;
    for (let i = 0; i < b.length; i++) { L[i] += l[i]; R[i] += r[i]; }
  }
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i]));
  let a = 0;
  while (a < n && Math.abs(L[a]) < pk * 0.04 && Math.abs(R[a]) < pk * 0.04) a++;
  a = Math.max(0, a - 24);
  return [L.slice(a), R.slice(a)];
}

const rmsDb = ([L, R]) => {
  let s = 0;
  const w = Math.min(L.length, SR * 0.05);
  for (let i = 0; i < w; i++) s += (L[i] * L[i] + R[i] * R[i]) / 2;
  return 10 * Math.log10(s / w);
};

/** A kit: { piece: [[ [L, R] per round robin ] per layer] }, each piece scaled to its target level. */
async function loadKit(spec, dir) {
  const kit = {};
  for (const [piece, layers] of Object.entries(spec)) {
    if (!TARGET[piece]) continue;
    kit[piece] = [];
    for (const layer of layers) kit[piece].push(await Promise.all(layer.map((files) => hit(files, dir))));
    const g = 10 ** ((TARGET[piece] - rmsDb(kit[piece].at(-1)[0])) / 20);
    for (const layer of kit[piece]) for (const [L, R] of layer) for (let i = 0; i < L.length; i++) { L[i] *= g; R[i] *= g; }
  }
  return kit;
}

/** The grooves on one kit, two bars each with a short pause between them, at -16 dB RMS. */
async function render(kit) {
  const gap = 0.7;
  const total = GROOVES.reduce((a, [k, bpm]) => a + (STYLES[k].beats * 2 * 60) / bpm + gap, 0) + 2;
  const oc = new OfflineAudioContext(2, Math.ceil(total * SR), SR);
  const limit = oc.createDynamicsCompressor();
  limit.threshold.value = -6; limit.knee.value = 3; limit.ratio.value = 12; limit.attack.value = 0.002; limit.release.value = 0.1;
  limit.connect(oc.destination);
  const turn = {};
  let t = 0.2;
  for (const [key, bpm] of GROOVES) {
    const s = STYLES[key], step = 60 / bpm / s.unit, steps = s.beats * s.unit * 2;
    let open = null;
    for (let i = 0; i < steps; i++) {
      const when = t + i * step;
      for (const [piece, track] of Object.entries(s.tracks)) {
        const v = track[i % track.length];
        if (!v || !kit[piece]) continue;
        const layers = kit[piece];
        const rrs = layers[Math.min(layers.length - 1, Math.floor(v * layers.length))];
        turn[piece] = ((turn[piece] ?? -1) + 1) % rrs.length;
        const [L, R] = rrs[turn[piece]];
        const b = oc.createBuffer(2, L.length, SR);
        b.copyToChannel(L, 0); b.copyToChannel(R, 1);
        const src = oc.createBufferSource();
        src.buffer = b;
        const g = oc.createGain();
        g.gain.value = 0.7 + 0.3 * v;
        src.connect(g).connect(limit);
        src.start(when);
        if (open && (piece === 'hhc' || piece === 'hhp')) { open.gain.setTargetAtTime(0, when, 0.015); open = null; }
        if (piece === 'hho') open = g;
      }
    }
    t += steps * step + gap;
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
  const kits = [];
  // 1: the app's kit as shipped (mono Opus files)
  const man = await (await fetch('/audio/drums/kit.json')).json();
  kits.push(['1-virtuosity-room-mic-current', Object.fromEntries(Object.entries(man.pieces).map(([p, layers]) => [p, layers.map((l) => l.map((f) => [f]))])), '/audio/drums/']);
  const spec = await (await fetch('/_raw/audition/kits.json')).json();
  const names = { 'virtuosity-close': '2-virtuosity-close-mics', 'big-rusty': '3-big-rusty-drums', 'swirly-brushes': '4-swirly-drums-brushes' };
  for (const [k, pieces] of Object.entries(spec)) {
    // (kits.json names a file "repo:Samples/a/b.flac"; it is staged as "repo_Samples_a_b.flac")
    kits.push([names[k], Object.fromEntries(Object.entries(pieces).map(([p, layers]) => [p, layers.map((l) => l.map((files) => files.map((f) => f.replace(':', '_').replace(/\//g, '_'))))])), '/_raw/audition/']);
  }
  const done = [];
  for (const [name, spec1, dir] of kits) {
    const clip = await render(await loadKit(spec1, dir));
    const res = await fetch(`/__write/_raw/audition/${name}.wav`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav(clip) });
    if (!res.ok) throw new Error(`could not write ${name}: ${res.status}`);
    done.push(`${name}.wav ${(clip[0].length / SR).toFixed(1)} s`);
  }
  return done;
}
