// Dev tool (not used by the app at runtime): builds the Practice room's piano (user, 2026-10-27, chosen by ear
// from a clip: "yes add the piano") in web/audio/piano/: one Ogg Opus file a note (<midi>.ogg) and piano.json.
// The notes are the Kawai grand of the Versilian Community Sample Library (VCSL, Versilian Studios, CC0), its
// sustained mezzo-forte layer (v3) from D3 to A5, a note every two or three semitones (the app plays the others
// by shifting the nearest), staged in web/_raw/kits/vcsl/ (not committed). Each note from its onset, at most
// KEEP s, faded over its last FADE s (a chord is struck again on each bar), all at one gain (their recorded
// balance kept), stereo at 96 kb/s: about 1.2 MB. The app fetches them on first use (web/js/piano.js), as
// the drums.
// Needs tools/serve.py (localhost write endpoint). Run:  (await import('./js/dev/pianoprep.js')).run()
import { encodeOpus } from './drumprep.js';

const SR = 48000;
const DIR = '/_raw/kits/vcsl/Chordophones/Zithers/Grand%20Piano,%20Kawai/Sustains/';
const NOTES = ['D3', 'E3', 'F#3', 'G#3', 'A#3', 'C4', 'D4', 'E4', 'F#4', 'G#4', 'A#4', 'C5', 'D#5', 'F#5', 'A5'];
const KEEP = 6.5, FADE = 1.5;
const PC = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
const midiOf = (n) => { const m = n.match(/^([A-G]#?)(-?\d)$/); return 12 * (Number(m[2]) + 1) + PC[m[1]]; };

async function put(path, body, type) {
  const res = await fetch(`/__write/audio/piano/${path}`, { method: 'PUT', headers: { 'Content-Type': type }, body });
  if (!res.ok) throw new Error(`could not write ${path}: ${res.status}`);
}

export async function run() {
  const dec = new OfflineAudioContext(2, 1, SR);
  const notes = [];
  for (const n of NOTES) {
    const res = await fetch(DIR + 'GPiano_sus_' + encodeURIComponent(n) + '_v3_rr1_Player.wav');
    if (!res.ok) throw new Error(`missing ${n}`);
    const b = await dec.decodeAudioData(await res.arrayBuffer());
    const chs = [0, 1].map((c) => b.getChannelData(Math.min(c, b.numberOfChannels - 1)));
    // from just before its onset
    let pk = 0;
    for (const c of chs) for (let i = 0; i < Math.min(c.length, SR); i++) pk = Math.max(pk, Math.abs(c[i]));
    let a = 0;
    while (a < chs[0].length && chs.every((c) => Math.abs(c[a]) < pk * 0.03)) a++;
    a = Math.max(0, a - Math.round(SR * 0.001));
    const len = Math.min(chs[0].length - a, Math.round(KEEP * SR)), f = Math.round(FADE * SR);
    const out = chs.map((c) => {
      const y = c.slice(a, a + len);
      for (let i = 0; i < f && i < len; i++) y[len - f + i] *= 0.5 + 0.5 * Math.cos((Math.PI * i) / f);
      return y;
    });
    notes.push({ midi: midiOf(n), chs: out });
  }
  let peak = 0;
  for (const { chs } of notes) for (const c of chs) for (const v of c) peak = Math.max(peak, Math.abs(v));
  const gain = 0.89 / peak;
  let bytes = 0;
  const files = {};
  for (const { midi, chs } of notes) {
    const ogg = await encodeOpus(chs.map((c) => c.map((v) => v * gain)), 96000);
    await put(`${midi}.ogg`, ogg, 'audio/ogg');
    files[midi] = `${midi}.ogg`;
    bytes += ogg.length;
  }
  await put('piano.json', JSON.stringify({
    name: 'Grand Piano, Kawai: Versilian Community Sample Library (VCSL), Versilian Studios',
    license: 'CC0-1.0',
    source: 'https://github.com/sgossner/VCSL (Chordophones/Zithers/Grand Piano, Kawai/Sustains, v3)',
    v: 1,
    notes: files,
  }, null, 1), 'application/json');
  await put('LICENSE.txt', [
    'Piano: the Kawai grand piano of the Versilian Community Sample Library (VCSL) by Versilian Studios,',
    'released under CC0 1.0 Universal (public domain): https://creativecommons.org/publicdomain/zero/1.0/',
    'Source: https://github.com/sgossner/VCSL (its sustained mezzo-forte notes from D3 to A5), trimmed, faded',
    'and encoded as Opus for BassClass by web/js/dev/pianoprep.js.',
    '',
  ].join('\n'), 'text/plain');
  return { files: notes.length, kb: Math.round(bytes / 1024) };
}
