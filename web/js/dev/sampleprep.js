// Dev tool (not used by the app at runtime): converts the raw Karoryfer
// "Black And Blue Basses" darkblack samples (CC0), staged in web/_raw/{reg,ghost}/<note>.wav,
// into the compact bank in web/audio/bass/. Needs tools/serve.py (localhost write endpoint).
// Run in the console:  (await import('./js/dev/sampleprep.js')).run()
import { yin } from '../pitch.js';

const NOTES = ['b1', 'c2', 'db2', 'd2', 'eb2', 'e2', 'f2', 'gb2', 'g2', 'ab2', 'a2', 'bb2', 'b2', 'c3', 'db3', 'd3', 'eb3', 'e3', 'f3', 'gb3', 'g3',
  'ab3', 'a3', 'bb3', 'b3', 'c4', 'db4', 'd4', 'eb4', 'e4', 'f4', 'gb4', 'g4', 'ab4', 'a4', 'bb4', 'b4', 'c5', 'db5', 'd5', 'eb5', 'e5'];
const OUT_SR = 22050;

async function decode(url) {
  const data = await (await fetch(url)).arrayBuffer();
  return new OfflineAudioContext(1, 1, 44100).decodeAudioData(data);
}

function mono(buf) {
  const out = new Float32Array(buf.length);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) out[i] += d[i] / buf.numberOfChannels;
  }
  return out;
}

/** Resample to outSr; `cents` retunes the sample (declaring a different source rate). */
async function resample(x, sr, outSr, cents = 0) {
  const srcSr = sr * Math.pow(2, cents / 1200);
  const len = Math.ceil((x.length * outSr) / srcSr);
  const oc = new OfflineAudioContext(1, len, outSr);
  const b = oc.createBuffer(1, x.length, srcSr);
  b.copyToChannel(x, 0);
  const s = oc.createBufferSource();
  s.buffer = b;
  s.connect(oc.destination);
  s.start();
  return (await oc.startRendering()).getChannelData(0);
}

function pitchOf(x, sr, from) {
  const D = 4;
  const win = new Float32Array(2048);
  for (let i = 0; i < win.length; i++) {
    let a = 0;
    for (let k = 0; k < D; k++) a += x[from + i * D + k] || 0;
    win[i] = a / D;
  }
  const r = yin(win, sr / D);
  if (!r) return null;
  const m = 69 + 12 * Math.log2(r.freq / 440);
  return { midi: Math.round(m), cents: Math.round((m - Math.round(m)) * 100), freq: r.freq };
}

function wav16(x, sr) {
  const buf = new ArrayBuffer(44 + x.length * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + x.length * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true);
  v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, x.length * 2, true);
  for (let i = 0; i < x.length; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, x[i])) * 32767, true);
  return buf;
}

const put = (path, body) => fetch(`/__write/audio/bass/${path}`, { method: 'PUT', body }).then((r) => r.status);

export async function run({ write = true } = {}) {
  const man = {
    name: 'Karoryfer "darkblack" 5-string bass (fingerstyle)',
    license: 'CC0-1.0',
    source: 'https://github.com/sfzinstruments/karoryfer.black-and-blue-basses',
    reg: {}, ghost: {},
  };
  const report = [];
  for (let i = 0; i < NOTES.length; i++) {
    const n = NOTES[i];
    let midi = null, fix = 0;
    for (const kind of ['reg', 'ghost']) {
      const buf = await decode(`/_raw/${kind}/${n}.wav`);
      const sr = buf.sampleRate;
      const x0 = mono(buf);
      let peak = 0;
      for (const v of x0) peak = Math.max(peak, Math.abs(v));
      let on = x0.findIndex((v) => Math.abs(v) > peak * 0.04);
      on = Math.max(0, on - Math.round(sr * 0.003));
      if (kind === 'reg') {
        const p = pitchOf(x0, sr, on + Math.round(sr * 0.25));
        midi = p ? p.midi : null;
        // retune notes that were recorded noticeably sharp/flat (ghosts are pitch-less thuds)
        fix = p && Math.abs(p.cents) > 3 ? -p.cents : 0;
        report.push(`${n}: ${p ? `midi ${p.midi} ${p.cents >= 0 ? '+' : ''}${p.cents}c (${p.freq.toFixed(1)} Hz)${fix ? ` → retuned ${fix > 0 ? '+' : ''}${fix}c` : ''}` : 'no pitch'}`);
      }
      if (midi == null) midi = 23 + i;
      const dur = kind === 'reg' ? (midi < 40 ? 3.0 : midi < 52 ? 2.6 : 2.2) : 0.4;
      const len = Math.min(x0.length - on, Math.round(dur * sr));
      const x = x0.slice(on, on + len);
      const fadeIn = Math.round(sr * 0.002), fadeOut = Math.round(sr * (kind === 'reg' ? 0.5 : 0.12));
      for (let k = 0; k < fadeIn; k++) x[k] *= k / fadeIn;
      for (let k = 0; k < fadeOut; k++) x[x.length - 1 - k] *= 0.5 - 0.5 * Math.cos((Math.PI * k) / fadeOut);
      const y = await resample(x, sr, OUT_SR, kind === 'reg' ? fix : 0);
      // level-match: equal RMS over the first 0.6 s for notes, equal peak for ghosts
      let pk = 0, ss = 0;
      const rmsN = Math.min(y.length, Math.round(OUT_SR * 0.6));
      for (let k = 0; k < y.length; k++) pk = Math.max(pk, Math.abs(y[k]));
      for (let k = 0; k < rmsN; k++) ss += y[k] * y[k];
      const rms = Math.sqrt(ss / rmsN);
      let gain = kind === 'reg' ? 0.2 / (rms || 1) : 0.8 / (pk || 1);
      gain = Math.min(gain, 0.97 / (pk || 1));
      for (let k = 0; k < y.length; k++) y[k] *= gain;
      man[kind][midi] = `${kind}/${midi}.wav`;
      if (write) await put(`${kind}/${midi}.wav`, wav16(y, OUT_SR));
    }
  }
  if (write) {
    await put('manifest.json', JSON.stringify(man, null, 1));
    await put('LICENSE.txt', 'Bass samples: Karoryfer Samples "Black And Blue Basses" (darkblack), released under CC0 1.0 Universal (public domain dedication).\nSource: https://github.com/sfzinstruments/karoryfer.black-and-blue-basses\nTrimmed, level-matched and resampled to 22.05 kHz mono for BassClass.\n');
  }
  return report.join('\n');
}
