// Dev tool (not used by the app): listening clips of candidate kicks (user, 2026-10-27: the kick sounded
// like a goliath drum: "more dry, more attack, less release"). Each candidate is built from the
// Virtuosity Drums mics staged in web/_raw/drums2/ (kick mic, snare mic, overheads), matched in loudness
// to the kick the app plays now, and heard alone and in a groove with the app's own snare and hats.
// Writes web/_raw/audition/kick-*.wav (tools/serve.py). Run:  (await import('/js/dev/kickaudition.js')).run()
import { aLoudness } from './drumlevels.js';
import { loadKit, voice } from '../drums.js';
import { drumChain } from '../audio.js';

const SR = 48000;
const DIR = '/_raw/drums2/';
// (a candidate from another kit already staged for the kit audition: Karoryfer's Big Rusty Drums, CC0)
const staged = (f, dir = DIR) => dir + f.replace(':', '_').replace(/\//g, '_');
const decode = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`missing ${url}`);
  return new OfflineAudioContext(2, 1, SR).decodeAudioData(await res.arrayBuffer());
};

/**
 * The candidates: which mics (kick, snare, overheads) at what level; the ring cut (`hold` s at full, then
 * `tau` s decay); EQ: a cut in the low mids and a lift for the beater's click (dB).
 */
export const KICKS = {
  b: { name: 'dry (kick mic only, short)', mics: [1, 0, 0], hold: 0.02, tau: 0.05, mud: 0, click: 0 },
  c: { name: 'dry + attack (less boom, more click)', mics: [1, 0, 0], hold: 0.02, tau: 0.05, mud: -5, click: 6 },
  d: { name: 'dry + attack + a touch of room', mics: [1, 0, 0.15], hold: 0.02, tau: 0.06, mud: -5, click: 6 },
  // Big Rusty's 24" kick, its close mic only, shaped as c (its files: [kick mic, overheads])
  e: { name: 'other kit (Big Rusty 24" kick, dry + attack)', kit: 'big-rusty', mics: [1, 0], hold: 0.02, tau: 0.05, mud: -5, click: 6 },
};

/** One kick hit from its mic files, shaped as the candidate says. */
export async function shapeKick(files, k) {
  const bufs = await Promise.all(files.map((f) => decode(staged(f, k.kit ? '/_raw/audition/' : DIR))));
  const n = Math.max(...bufs.map((b) => b.length));
  const mono = new Float32Array(n);
  bufs.forEach((b, m) => {
    const w = k.mics[m] || 0;
    if (!w) return;
    for (let c = 0; c < b.numberOfChannels; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < d.length; i++) mono[i] += (w * d[i]) / b.numberOfChannels;
    }
  });
  // from the onset; then the ring cut: held, then an exponential decay, ending 40 dB down
  let pk = 0;
  for (const v of mono) pk = Math.max(pk, Math.abs(v));
  let a = 0;
  while (a < n && Math.abs(mono[a]) < pk * 0.04) a++;
  a = Math.max(0, a - Math.round(SR * 0.0005));
  const len = Math.min(n - a, Math.round((k.hold + k.tau * 4.6) * SR));
  const y = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    y[i] = mono[a + i] * (t < k.hold ? 1 : Math.exp(-(t - k.hold) / k.tau));
  }
  // EQ (offline biquads): a low-mid cut around 300 Hz, a click lift around 4 kHz, and a high-pass at 35 Hz
  const oc = new OfflineAudioContext(1, len, SR);
  const src = oc.createBufferSource();
  const b = oc.createBuffer(1, len, SR);
  b.getChannelData(0).set(y);
  src.buffer = b;
  const hp = oc.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 35; hp.Q.value = 0.7;
  const mud = oc.createBiquadFilter(); mud.type = 'peaking'; mud.frequency.value = 300; mud.Q.value = 1; mud.gain.value = k.mud;
  const click = oc.createBiquadFilter(); click.type = 'peaking'; click.frequency.value = 4000; click.Q.value = 0.9; click.gain.value = k.click;
  src.connect(hp).connect(mud).connect(click).connect(oc.destination);
  src.start();
  const out = (await oc.startRendering()).getChannelData(0);
  // (the last 5 ms faded, so the cut never clicks)
  const f = Math.round(SR * 0.005);
  for (let i = 0; i < f; i++) out[len - f + i] *= 1 - i / f;
  return out;
}

const toBuffer = (y) => { const b = new AudioBuffer({ length: y.length, sampleRate: SR, numberOfChannels: 1 }); b.getChannelData(0).set(y); return b; };

/** A clip: four kicks alone, then four bars of rock 8ths with the app's snare and hats; `kick(vel)` gives a hit. */
async function clip(kick) {
  const bpm = 110, len = 60 / bpm, secs = 2.6 + 4 * 4 * len + 1;
  const ctx = new OfflineAudioContext(2, Math.ceil(secs * SR), SR);
  const chain = drumChain(ctx);
  chain.output.connect(ctx.destination);
  const play = (buffer, gain, t) => {
    const s = ctx.createBufferSource(); s.buffer = buffer;
    const g = ctx.createGain(); g.gain.value = gain;
    s.connect(g).connect(chain.input); s.start(t);
  };
  [0.95, 0.72, 0.95, 0.45].forEach((v, i) => { const h = kick(v); play(h.buffer, h.gain, 0.1 + i * 0.6); });
  const t0 = 2.6;
  const groove = { hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|....|X.x.|....', snare: '....|X...|....|X..g' };
  const VEL = { '.': 0, g: 0.2, s: 0.45, x: 0.72, X: 0.95 };
  for (let bar = 0; bar < 4; bar++) {
    for (const [piece, str] of Object.entries(groove)) {
      const steps = str.replace(/\|/g, '');
      [...steps].forEach((c, i) => {
        const v = VEL[c];
        if (!v) return;
        const t = t0 + (bar * 4 + i / 4) * len;
        const h = piece === 'kick' ? kick(v) : voice(piece, v);
        if (h) play(h.buffer, h.gain, t);
      });
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

export async function run() {
  await loadKit();
  const spec = await (await fetch(DIR + 'kit2.json')).json();
  const other = await (await fetch('/_raw/audition/kits.json')).json();
  // the kick as the app plays it now: its own layers, as voice() picks them
  const nowTop = voice('kick', 0.95);
  const ref = aLoudness(toBuffer(nowTop.buffer.getChannelData(0)));
  const out = [];
  const write = async (name, chs) => {
    const res = await fetch(`/__write/_raw/audition/${name}.wav`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav(chs) });
    if (!res.ok) throw new Error(`could not write ${name}: ${res.status}`);
    out.push(`${name}.wav`);
  };
  await write('kick-a-now', await clip((v) => voice('kick', v)));
  for (const [key, k] of Object.entries(KICKS)) {
    // every layer and round robin shaped; the hardest matched in loudness to the kick played now
    // (soft to hard, round robins, each the mic files of one hit)
    const layers = k.kit ? other[k.kit].kick : spec.kick;
    const shaped = [];
    for (const layer of layers) shaped.push(await Promise.all(layer.map((files) => shapeKick(files, k))));
    const g = 10 ** ((ref - aLoudness(toBuffer(shaped.at(-1)[0]))) / 20);
    const bufs = shaped.map((row) => row.map((y) => toBuffer(y.map((x) => x * g))));
    let turn = 0;
    // (the layers as voice() picks them: by velocity, ghost to accent; each stroke at the app's own gain for it)
    const kick = (v) => {
      const li = Math.round(Math.max(0, Math.min(1, (v - 0.2) / 0.75)) * (bufs.length - 1));
      return { buffer: bufs[li][turn++ % bufs[li].length], gain: voice('kick', 0.95).gain * (0.7 + 0.3 * v) };
    };
    await write({ b: 'kick-b-dry', c: 'kick-c-dry-attack', d: 'kick-d-dry-attack-room', e: 'kick-e-other-kit' }[key], await clip(kick));
  }
  return out;
}
