// Dev tool (not used by the app; user, 2026-10-27: "find the best sound possible… sliders to adjust volumes
// and fx of each kit", "neutral and pleasant, no long reverbs or metallic echoes", "better CC0"): the Drum
// lab (drumlab.html). Each group of pieces takes its sound from one candidate kit, staged in web/_raw/kits/
// (only the hits needed, kept out of git):
//   - DRSKit (DrumGizmo team + DRSDrums, CC BY 4.0, "from jazz to rock", Paiste 602 cymbals): close mics
//     and overheads, drskit/DrumGizmo/DRSKit/Samples/<piece>/<n>-<piece>-<mic>.flac;
//   - Gogodze Phu Vol II (Karoryfer, CC0, a dry 1970s kick, snare and hi-hat): gogodze/Samples/<mic>/;
//   - Frankensnare (Karoryfer, CC0): the 14×5 and 14×6.5 maple snares, frankensnare/Samples/14d|14p_basic/;
//   - Virtuosity Drums (Versilian + Karoryfer, CC0, the app's kit before 2026-10-27), staged in _raw/drums2/;
//   - the app's kit as it plays now (MuldjordKit, mixed in stereo: no room control).
// A hit's mics play together, the close ones and the overheads on their own buses (Room: the overheads'
// level). Every stroke is brought to the app's loudness for its piece and velocity (drums.js strokeDb), so
// the kits compare on equal terms and the result drops into the app's balance; then the group's Volume,
// Body (low shelf), Tone (high shelf) and Length (the ring and the room's tail cut short), through the app's
// drum chain and the accompaniment's limiter, as in the room. `render()` writes clips of the presets.
import { STYLES, GENRES, beatHits } from '../practice/styles.js';
import { loadKit, voice, styleGain, trackGain, strokeDb } from '../drums.js';
import { drumChain } from '../audio.js';
import { aLoudness } from './drumlevels.js';

const SR = 48000;
const KITS = '/_raw/kits/';
const STORE = 'drumlab.v1';

// the groups of pieces the lab tunes (the others, percussion, rims and brushes, play as the app has them)
const GROUPS = [
  { key: 'kick', name: 'Kick', pieces: ['kick'] },
  { key: 'snare', name: 'Snare', pieces: ['snare'] },
  { key: 'hats', name: 'Hi-hat', pieces: ['hhc', 'hho', 'hhh', 'hhp'] },
  { key: 'ride', name: 'Ride', pieces: ['ride', 'bell'] },
  { key: 'crash', name: 'Crash', pieces: ['crash'] },
  { key: 'toms', name: 'Toms', pieces: ['tomh', 'toml'] },
];
const GROUP_OF = Object.fromEntries(GROUPS.flatMap((g) => g.pieces.map((p) => [p, g.key])));

const SOURCES = {
  now: { name: 'MuldjordKit (now) · CC BY', groups: ['kick', 'snare', 'hats', 'ride', 'crash', 'toms'] },
  drs: { name: 'DRSKit · CC BY', groups: ['kick', 'snare', 'hats', 'ride', 'crash'] },
  gogodze: { name: 'Gogodze Phu II · CC0', groups: ['kick', 'snare', 'hats'] },
  frank14x5: { name: 'Frankensnare 14×5 maple · CC0', groups: ['snare'] },
  frank14x65: { name: 'Frankensnare 14×6.5 maple · CC0', groups: ['snare'] },
  virtuosity: { name: 'Virtuosity (old kit) · CC0', groups: ['kick', 'snare', 'hats', 'ride', 'crash', 'toms'] },
};
const PRESETS = [
  { name: 'Now (MuldjordKit)', src: { kick: 'now', snare: 'now', hats: 'now', ride: 'now', crash: 'now', toms: 'now' } },
  { name: 'DRSKit', src: { kick: 'drs', snare: 'drs', hats: 'drs', ride: 'drs', crash: 'drs', toms: 'virtuosity' } },
  { name: 'CC0: Gogodze + 14×5 maple', src: { kick: 'gogodze', snare: 'frank14x5', hats: 'gogodze', ride: 'virtuosity', crash: 'virtuosity', toms: 'virtuosity' } },
  { name: 'CC0: Gogodze', src: { kick: 'gogodze', snare: 'gogodze', hats: 'gogodze', ride: 'virtuosity', crash: 'virtuosity', toms: 'virtuosity' } },
  { name: 'CC0: Virtuosity', src: { kick: 'virtuosity', snare: 'virtuosity', hats: 'virtuosity', ride: 'virtuosity', crash: 'virtuosity', toms: 'virtuosity' } },
];
// (the cymbals start lower: user, 2026-10-27, "ride, crash, hi-hat sound too loud compared to the other elements")
const DEFAULT_GROUP = { vol: 0, room: -6, tone: 0, body: 0, len: 100 };
const DEFAULT_VOL = { hats: -3, ride: -4, crash: -4 };
const defaults = () => ({
  pattern: 'rock8', bpm: 110, drums: 80,
  groups: Object.fromEntries(GROUPS.map((g) => [g.key, { ...DEFAULT_GROUP, vol: DEFAULT_VOL[g.key] ?? 0, src: PRESETS[0].src[g.key] }])),
});

// ---------------------------------------------------------------- loading
const decoder = new OfflineAudioContext(2, 1, SR);
const decoded = new Map();
function load(url) {
  if (!decoded.has(url)) {
    decoded.set(url, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`missing ${url}`);
      return r.arrayBuffer();
    }).then((b) => decoder.decodeAudioData(b)));
  }
  return decoded.get(url);
}
/** The files in a folder of the dev server (its listing). */
async function listing(dir) {
  const html = await (await fetch(dir)).text();
  return [...html.matchAll(/href="([^"?#]+)"/g)].map((m) => decodeURIComponent(m[1])).filter((f) => !f.endsWith('/'));
}
const enc = (path) => path.split('/').map(encodeURIComponent).join('/');

/**
 * A hit from its mics ([{ url, role: 'close' | 'oh', w, pan }]): its buffers, where it starts (the onset of its
 * close mics), and its loudness as the lab's normalising takes it (A-weighted, its first 170 ms, all mics at
 * their weights and the overheads at the default Room).
 */
async function makeHit(mics, max) {
  const ms = await Promise.all(mics.map(async (m) => ({ ...m, buf: await load(m.url) })));
  const key = ms.some((m) => m.role === 'close') ? ms.filter((m) => m.role === 'close') : ms;
  const n = Math.max(...ms.map((m) => m.buf.length));
  const mono = new Float32Array(n);
  for (const m of key) for (let c = 0; c < m.buf.numberOfChannels; c++) {
    const d = m.buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) mono[i] += (m.w * d[i]) / m.buf.numberOfChannels;
  }
  let pk = 0;
  for (const v of mono) pk = Math.max(pk, Math.abs(v));
  let a = 0;
  while (a < n && Math.abs(mono[a]) < pk * 0.04) a++;
  a = Math.max(0, a - Math.round(SR * 0.0005));
  const W = 8192, room = 10 ** (DEFAULT_GROUP.room / 20);
  const L = new Float32Array(W), R = new Float32Array(W);
  for (const m of ms) {
    const g = m.w * (m.role === 'oh' ? room : 1);
    const l = m.buf.getChannelData(0), r = m.buf.numberOfChannels > 1 ? m.buf.getChannelData(1) : l;
    const pl = Math.min(1, 1 - (m.pan || 0)), pr = Math.min(1, 1 + (m.pan || 0));
    for (let i = 0; i < W && a + i < m.buf.length; i++) { L[i] += g * pl * l[a + i]; R[i] += g * pr * r[a + i]; }
  }
  const b = new AudioBuffer({ length: W, sampleRate: SR, numberOfChannels: 2 });
  b.getChannelData(0).set(L); b.getChannelData(1).set(R);
  return { mics: ms, offset: a / SR, loud: aLoudness(b), peak: pk, max };
}
/** Hits sorted soft to hard (by their close mics' peak), as `n` layers of round robins. */
function layered(hits, n) {
  const s = [...hits].sort((a, b) => a.peak - b.peak);
  const per = Math.max(1, Math.floor(s.length / n));
  const out = [];
  for (let l = 0; l < n; l++) out.push(s.slice(l * per, l === n - 1 ? s.length : (l + 1) * per));
  return out.filter((x) => x.length);
}

// DRSKit: a folder per piece, one mono file per mic of each hit
const DRS = KITS + 'drskit/DrumGizmo/DRSKit/Samples/';
const PAN = { Hihat: -0.35, Ride: 0.35, OHL: -0.85, OHR: 0.85 };
const DRS_PIECES = {
  kick: ['Kdrum_without_contact', { Kdrum_front: 1, Kdrum_back: 1 }], snare: ['Snare', { Snare_top: 1, Snare_bottom: 0.6 }],
  hhc: ['Hihat_closed', { Hihat: 1 }], hho: ['Hihat_open', { Hihat: 1 }], hhh: ['Hihat_open', { Hihat: 1 }, 0.45],
  hhp: ['Hihat_foot', { Hihat: 1 }], ride: ['Ride_tip', { Ride: 1 }], bell: ['Ride_tip_bell', { Ride: 1 }], crash: ['Crash_right_tip', {}],
};
async function drs(piece) {
  const [folder, close, max] = DRS_PIECES[piece];
  const byHit = new Map();
  for (const f of await listing(DRS + folder + '/')) {
    const m = f.match(/^(\d+)-.+-(\w+)\.flac$/);
    if (!m || !(m[2] in close || /^OH[LR]$/.test(m[2]))) continue;
    if (!byHit.has(m[1])) byHit.set(m[1], []);
    // (a piece with no close mic of its own, the crash: its overheads are its close sound)
    const oh = /^OH[LR]$/.test(m[2]) && Object.keys(close).length > 0;
    byHit.get(m[1]).push({ url: DRS + folder + '/' + enc(f), role: oh ? 'oh' : 'close', w: close[m[2]] ?? 1, pan: PAN[m[2]] || 0 });
  }
  const hits = await Promise.all([...byHit.values()].map((mics) => makeHit(mics, max)));
  return layered(hits, Math.min(4, Math.ceil(hits.length / 2)));
}

// Gogodze Phu Vol II: a folder per mic, files <code>_vl<L>_rr<R>.wav
const GOG = KITS + 'gogodze/Samples/';
const GOG_PIECES = {
  kick: ['ks', { kick_mic: 1, snare_mic: 0.5 }], snare: ['sc', { snare_mic: 1, kick_mic: 0.5 }],
  hhc: ['hc', { snare_mic: 0.8 }], hho: ['ho', { snare_mic: 0.8 }], hhh: ['ho', { snare_mic: 0.8 }, 0.45], hhp: ['hf', { snare_mic: 0.8 }],
};
async function gogodze(piece) {
  const [code, close, max] = GOG_PIECES[piece];
  const byHit = new Map();
  for (const mic of [...Object.keys(close), 'oh_mic']) {
    for (const f of await listing(GOG + mic + '/')) {
      const m = f.match(/^(\w+?)_vl(\d+)_rr(\d+)\.wav$/);
      if (!m || m[1] !== code) continue;
      const k = `${m[2]}-${m[3]}`;
      if (!byHit.has(k)) byHit.set(k, { vl: +m[2], mics: [] });
      byHit.get(k).mics.push({ url: GOG + mic + '/' + enc(f), role: mic === 'oh_mic' ? 'oh' : 'close', w: close[mic] ?? 1, pan: 0 });
    }
  }
  const byVl = new Map();
  for (const { vl, mics } of byHit.values()) {
    if (!byVl.has(vl)) byVl.set(vl, []);
    byVl.get(vl).push(await makeHit(mics, max));
  }
  return [...byVl.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

// Frankensnare: <snare>/<top|btm|oh>/sn_vl<L>_rr<R>.flac
async function frank(folder) {
  const W = { top: 1, btm: 0.7, oh: 1 };
  const byHit = new Map();
  for (const mic of ['top', 'btm', 'oh']) {
    const dir = `${KITS}frankensnare/Samples/${folder}/${mic}/`;
    for (const f of await listing(dir)) {
      const m = f.match(/^sn_vl(\d+)_rr(\d+)\.flac$/);
      if (!m) continue;
      const k = `${m[1]}-${m[2]}`;
      if (!byHit.has(k)) byHit.set(k, { vl: +m[1], mics: [] });
      byHit.get(k).mics.push({ url: dir + enc(f), role: mic === 'oh' ? 'oh' : 'close', w: W[mic], pan: 0 });
    }
  }
  const byVl = new Map();
  for (const { vl, mics } of byHit.values()) {
    if (!byVl.has(vl)) byVl.set(vl, []);
    byVl.get(vl).push(await makeHit(mics));
  }
  return [...byVl.entries()].sort((a, b) => a[0] - b[0]).map(([, row]) => row);
}

// Virtuosity: kit2.json (piece → layers → round robins → the mic files of one hit), staged in _raw/drums2/
let virtSpec = null;
const staged = (f) => '/_raw/drums2/' + f.replace(':', '_').replace(/\//g, '_');
async function virtuosity(piece) {
  virtSpec ??= await (await fetch('/_raw/drums2/kit2.json')).json();
  const own = piece === 'kick' ? { kickmic: 1, snaremic: 0.5 } : piece === 'snare' ? { snaremic: 1, kickmic: 0.5 } : { snaremic: 0.6, kickmic: 0.3 };
  const out = [];
  for (const layer of virtSpec[piece]) {
    const row = [];
    for (const files of layer) {
      const mics = files.map((f) => {
        const mic = (f.match(/Samples\/(\w+)\//) || [])[1];
        return { url: staged(f), role: mic === 'oh' ? 'oh' : 'close', w: mic === 'oh' ? 1 : own[mic] ?? 1, pan: 0 };
      });
      row.push(await makeHit(mics));
    }
    out.push(row);
  }
  return out;
}

const LOADERS = {
  drs: (p) => (DRS_PIECES[p] ? drs(p) : null),
  gogodze: (p) => (GOG_PIECES[p] ? gogodze(p) : null),
  frank14x5: (p) => (p === 'snare' ? frank('14d_basic') : null),
  frank14x65: (p) => (p === 'snare' ? frank('14p_basic') : null),
  virtuosity: (p) => virtuosity(p),
};
// source → piece → layers of hits
const BANK = {};
/** What loaded: source → piece → its layers' sizes and loudness (dB), soft to hard. */
export const bankInfo = () => Object.fromEntries(Object.entries(BANK).map(([s, ps]) => [s, Object.fromEntries(Object.entries(ps).map(([p, layers]) => [p, layers.map((row) => `${row.length}×${row[0].loud.toFixed(1)}`).join(' ')]))]));
async function loadAll(onProgress) {
  await loadKit();
  const jobs = [];
  for (const [src, def] of Object.entries(SOURCES)) {
    if (src === 'now') continue;
    BANK[src] = {};
    for (const g of GROUPS) {
      if (!def.groups.includes(g.key)) continue;
      for (const p of g.pieces) {
        const job = LOADERS[src](p);
        if (job) jobs.push(job.then((layers) => { BANK[src][p] = layers; onProgress?.(); }, (e) => console.warn(src, p, e)));
      }
    }
  }
  await Promise.all(jobs);
}

// ---------------------------------------------------------------- playing
const REF = strokeDb('snare', 1);   // the app's snare accent (drums.js: LEVEL 0 + REF)
const makeup = (threshold, ratio) => 10 ** ((0.6 * -threshold * (1 - 1 / ratio)) / 20);
const dB = (x) => 10 ** (x / 20);

/** The lab's sound on an audio context (the room's or an offline one): buses per group, the drum chain, the limiter. */
export function engine(ctx, st) {
  const chain = drumChain(ctx);
  const vol = ctx.createGain();
  const lim = ctx.createDynamicsCompressor();
  lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
  const trim = ctx.createGain(); trim.gain.value = 1 / makeup(-3, 20);
  chain.output.connect(vol).connect(lim).connect(trim).connect(ctx.destination);
  const bus = {};
  for (const key of [...GROUPS.map((g) => g.key), 'other']) {
    const close = ctx.createGain(), oh = ctx.createGain();
    const body = ctx.createBiquadFilter(); body.type = 'lowshelf'; body.frequency.value = 150;
    const tone = ctx.createBiquadFilter(); tone.type = 'highshelf'; tone.frequency.value = 3500;
    const out = ctx.createGain();
    close.connect(body); oh.connect(body);
    body.connect(tone).connect(out).connect(chain.input);
    bus[key] = { close, oh, body, tone, out };
  }
  let open = [];
  const turn = {};
  const E = {
    st,
    apply(s = E.st) {
      E.st = s;
      vol.gain.value = s.drums / 100;
      for (const g of GROUPS) {
        const o = s.groups[g.key], b = bus[g.key];
        b.out.gain.value = dB(o.vol);
        b.oh.gain.value = o.room <= -30 ? 0 : dB(o.room);
        b.body.gain.value = o.body;
        b.tone.gain.value = o.tone;
      }
    },
    /** A stroke of `piece` at `when` (velocity `v`), times `gain` (the pattern's level). */
    strike(piece, v, when, gain = 1) {
      const gk = GROUP_OF[piece];
      const o = gk && E.st.groups[gk];
      const src = o?.src ?? 'now';
      const b = bus[gk || 'other'];
      const len = o ? o.len / 100 : 1;
      // the Length cut: held, then a quick decay (100: as recorded)
      const hold = 0.03 + len * 0.6, tau = 0.02 + len * 0.18;
      const nodes = [];
      const env = (node, G, max) => {
        node.gain.setValueAtTime(G, when);
        const h = Math.min(len < 1 ? hold : Infinity, max ? max - 0.03 : Infinity);
        if (h !== Infinity) { node.gain.setValueAtTime(G, when + h); node.gain.setTargetAtTime(0, when + h, max && h === max - 0.03 ? 0.015 : tau); }
        nodes.push(node);
        return h === Infinity ? null : when + h + (max && h === max - 0.03 ? 0.1 : tau * 7);
      };
      if (/^hh[chp]$/.test(piece)) {
        for (const n of open) { n.gain.cancelScheduledValues(when); n.gain.setTargetAtTime(0, when, 0.015); }
        open = [];
      }
      const layers = src !== 'now' && BANK[src]?.[piece];
      if (!layers) {
        const vc = voice(piece, v);
        if (!vc) return;
        // (the app's own: its level, then the group's sliders through the bus)
        const s = ctx.createBufferSource(); s.buffer = vc.buffer;
        const g = ctx.createGain();
        const stop = env(g, vc.gain * gain, piece === 'hhh' ? null : null);
        s.connect(g).connect(b.close); s.start(when);
        if (stop) s.stop(stop);
      } else {
        const li = Math.round(Math.max(0, Math.min(1, (v - 0.2) / 0.75)) * (layers.length - 1));
        const row = layers[li];
        turn[piece] = ((turn[piece] ?? -1) + 1) % row.length;
        const hit = row[turn[piece]];
        // the stroke's loudness as the app has it (its piece's level on the velocity curve), from this hit's own
        const G = dB(strokeDb(piece, v) - hit.loud) * gain;
        for (const m of hit.mics) {
          const s = ctx.createBufferSource(); s.buffer = m.buf;
          const w = ctx.createGain(); w.gain.value = m.w;
          const g = ctx.createGain();
          const stop = env(g, G, hit.max);
          let node = s.connect(w);
          if (m.pan && m.buf.numberOfChannels === 1) { const p = ctx.createStereoPanner(); p.pan.value = m.pan; node = node.connect(p); }
          node.connect(g).connect(m.role === 'oh' ? b.oh : b.close);
          s.start(when, hit.offset);
          if (stop) s.stop(stop);
        }
      }
      if (piece === 'hho') open = nodes;
    },
  };
  E.apply(st);
  return E;
}

/** Schedules beats of pattern `key` from `t0` (bars × its beats), returns the time after them. */
function schedule(E, key, bpm, t0, bars) {
  const s = STYLES[key], len = 60 / bpm, g = styleGain(key);
  for (let i = 0; i < bars * s.beats; i++) {
    for (const [f, p, v] of beatHits(s, s.sub, Math.floor(i / s.beats), i % s.beats)) E.strike(p, v, t0 + (i + f) * len, g * trackGain(s, p));
  }
  return t0 + bars * s.beats * len;
}

// ---------------------------------------------------------------- clips
function wav(buf) {
  const L = buf.getChannelData(0), R = buf.getChannelData(1), SR = buf.sampleRate;
  const n = L.length, out = new ArrayBuffer(44 + n * 4), v = new DataView(out);
  const str = (o, x) => { for (let i = 0; i < x.length; i++) v.setUint8(o + i, x.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, SR, true);
  v.setUint32(28, SR * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true);
    v.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true);
  }
  return out;
}
// the clip: each piece alone soft to hard, then rock 8ths, 16th funk, a medium swing and a slow blues
// (at 44.1 kHz, so a clip stays under the dev server's 4 MB)
const CLIP = [['rock8', 2], ['funk16', 1], ['swing', 2], ['slowblues', 1]];
/** Clips of the presets (or `which`) with the sliders as they are, as web/_raw/audition/lab-*.wav. */
export async function render(which = PRESETS.map((p) => p.name), base = state) {
  await ready;
  const done = [];
  for (const name of which) {
    const p = PRESETS.find((x) => x.name === name);
    const st = structuredClone(base);
    for (const g of GROUPS) st.groups[g.key].src = p.src[g.key];
    const secs = 3.4 + CLIP.reduce((a, [k, bars]) => a + (bars * STYLES[k].beats * 60) / STYLES[k].bpm + 0.5, 0) + 1;
    const ctx = new OfflineAudioContext(2, Math.ceil(secs * 44100), 44100);
    const E = engine(ctx, st);
    let t = 0.1;
    for (const piece of ['kick', 'snare', 'hhc', 'ride', 'crash']) {
      for (const v of [0.45, 0.95]) { E.strike(piece, v, t, 1); t += 0.32; }
    }
    t += 0.2;
    for (const [k, bars] of CLIP) t = schedule(E, k, STYLES[k].bpm, t, bars) + 0.5;
    const buf = await ctx.startRendering();
    const file = 'lab-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.wav';
    const res = await fetch(`/__write/_raw/audition/${file}`, { method: 'PUT', headers: { 'Content-Type': 'audio/wav' }, body: wav(buf) });
    if (!res.ok) throw new Error(`could not write ${file}: ${res.status}`);
    done.push(`${file} ${(buf.length / buf.sampleRate).toFixed(1)} s`);
  }
  return done;
}

// ---------------------------------------------------------------- the page
let state = (() => {
  try {
    const s = JSON.parse(localStorage.getItem(STORE));
    if (s?.groups) { const d = defaults(); for (const g of GROUPS) d.groups[g.key] = { ...d.groups[g.key], ...s.groups[g.key] }; return { ...d, ...s, groups: d.groups }; }
  } catch { /* none yet */ }
  return defaults();
})();
const save = () => { try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private window */ } };
export const settings = () => structuredClone(state);

let live = null, ctxLive = null, timer = null, next = 0, beatAt = 0;
const $ = (id) => document.getElementById(id);
const el = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  e.append(...kids);
  return e;
};

function ensureLive() {
  if (!ctxLive) { ctxLive = new AudioContext({ sampleRate: SR, latencyHint: 'interactive' }); live = engine(ctxLive, state); }
  if (ctxLive.state === 'suspended') ctxLive.resume();
  return live;
}
function start() {
  const E = ensureLive();
  const s = STYLES[state.pattern];
  next = ctxLive.currentTime + 0.1; beatAt = 0;
  timer = setInterval(() => {
    const len = 60 / state.bpm, g = styleGain(state.pattern);
    while (next < ctxLive.currentTime + 0.15) {
      for (const [f, p, v] of beatHits(s, s.sub, Math.floor(beatAt / s.beats), beatAt % s.beats)) E.strike(p, v, next + f * len, g * trackGain(s, p));
      next += len; beatAt++;
    }
  }, 25);
  $('play').textContent = '■ Stop'; $('play').classList.add('playing');
}
function stop() {
  clearInterval(timer); timer = null;
  $('play').textContent = '▶ Play'; $('play').classList.remove('playing');
}

const SLIDERS = [
  ['vol', -18, 6, 0.5, (v) => `${v > 0 ? '+' : ''}${v} dB`],
  ['room', -30, 6, 1, (v) => (v <= -30 ? 'off' : `${v > 0 ? '+' : ''}${v} dB`)],
  ['tone', -12, 6, 0.5, (v) => `${v > 0 ? '+' : ''}${v} dB`],
  ['body', -8, 6, 0.5, (v) => `${v > 0 ? '+' : ''}${v} dB`],
  ['len', 0, 100, 1, (v) => (v >= 100 ? 'natural' : `${v}%`)],
];
function rows() {
  const tb = $('rows');
  tb.replaceChildren();
  for (const g of GROUPS) {
    const o = state.groups[g.key];
    const sel = el('select', { onchange: (e) => { o.src = e.target.value; changed(); } },
      ...Object.entries(SOURCES).filter(([k, s]) => s.groups.includes(g.key)).map(([k, s]) => el('option', { value: k, selected: o.src === k }, s.name)));
    const cells = SLIDERS.map(([k, min, max, step, fmt]) => {
      const out = el('span', {}, fmt(o[k]));
      const input = el('input', { type: 'range', min, max, step, value: o[k], oninput: (e) => { o[k] = +e.target.value; out.textContent = fmt(o[k]); changed(false); } });
      // (Room means nothing on a kit mixed in stereo)
      const wrap = el('div', { class: 'sl' + (k === 'room' && o.src === 'now' ? ' off' : '') }, input, out);
      return el('td', {}, wrap);
    });
    const hear = el('button', { onclick: () => {
      const E = ensureLive(), t = ctxLive.currentTime + 0.05;
      [0.2, 0.45, 0.72, 0.95].forEach((v, i) => E.strike(g.pieces[0], v, t + i * 0.45, 1));
      if (g.key === 'hats') { E.strike('hho', 0.9, t + 1.9, 1); E.strike('hhp', 0.8, t + 2.5, 1); }
    } }, '▶');
    tb.append(el('tr', {}, el('td', { class: 'name' }, g.name), el('td', {}, sel), ...cells, el('td', {}, hear)));
  }
  $('presets').replaceChildren(...PRESETS.map((p) => el('button', {
    class: GROUPS.every((g) => state.groups[g.key].src === p.src[g.key]) ? 'on' : '',
    onclick: () => { for (const g of GROUPS) state.groups[g.key].src = p.src[g.key]; changed(); },
  }, p.name)));
}
function changed(redraw = true) {
  save();
  live?.apply(state);
  if (redraw) rows();
  if ($('out').style.display === 'block') $('out').value = JSON.stringify(state, null, 1);
}

let ready;
function page() {
  const sel = $('pattern');
  for (const gen of GENRES) {
    const og = el('optgroup', { label: gen.name });
    for (const s of Object.values(STYLES).filter((x) => x.genre === gen.key)) og.append(el('option', { value: s.key, selected: s.key === state.pattern }, `${s.name} (${s.meter}, ${s.bpm})`));
    sel.append(og);
  }
  sel.onchange = () => { state.pattern = sel.value; state.bpm = STYLES[sel.value].bpm; $('bpm').value = state.bpm; save(); if (timer) { stop(); start(); } };
  $('bpm').value = state.bpm;
  $('bpm').onchange = (e) => { state.bpm = Math.max(30, Math.min(300, +e.target.value || 100)); save(); };
  $('drums').value = state.drums; $('drumsV').textContent = state.drums + '%';
  $('drums').oninput = (e) => { state.drums = +e.target.value; $('drumsV').textContent = state.drums + '%'; changed(false); };
  $('play').onclick = () => (timer ? stop() : start());
  $('reset').onclick = () => { const d = defaults(); for (const g of GROUPS) state.groups[g.key] = { ...d.groups[g.key], src: state.groups[g.key].src }; changed(); };
  $('copy').onclick = () => { const o = $('out'); o.style.display = 'block'; o.value = JSON.stringify(state, null, 1); o.select(); };
  rows();
  let n = 0;
  ready = loadAll(() => { $('status').textContent = `Loading the kits… ${++n}`; })
    .then(() => { $('status').textContent = ''; });
  ready.catch((e) => { $('status').textContent = 'Could not load: ' + e.message; });
}
if (typeof document !== 'undefined' && document.getElementById('rows')) page();
