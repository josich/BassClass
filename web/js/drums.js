// The drum kit of the Practice room: CC0 Virtuosity Drums (its close mics and overheads, stereo) with
// percussion, and Swirly Drums brushes (Ogg Opus in web/audio/drums/, made by web/js/dev/drumprep.js).
// They load on first use: from this site, or, in the Android app (whose APK leaves them out to stay
// small), online from the repository at the app's own commit, so an app always gets the kit it was built
// with. Once loaded they stay in the browser's cache, so the drums also play offline.
import * as A from './audio.js';
import { COMMIT } from './version.js';
import { STYLES, stepTime } from './practice/styles.js';

const VERSION = 2;   // bump when the kit's files change: they are fetched (and cached) again
const IN_APP = location.hostname === 'appassets.androidplatform.net';
const REPO = 'https://raw.githubusercontent.com/josich/BassClass/';
const BASES = IN_APP ? [...new Set([`${REPO}${COMMIT || 'main'}/web/audio/drums/`, `${REPO}main/web/audio/drums/`])] : ['audio/drums/'];
const CACHE = `bassclass-drums-v${VERSION}`;

// each piece's level in dB over its family as recorded (kit, percussion, brushes), so a groove sits as a
// drummer would play it: measured from the files' first 50 ms (peaks for the scraped guiro)
const MIX = {
  kick: -2, snare: 3, rim: 2, xstick: 8, flam: 8, hhc: 10, hhh: 10, hho: 7, hhp: 14, ride: 14, bell: 14, crash: 10, tomh: 1, toml: 2,
  shakd: 5, shaku: 8, claves: 12, cowbell: -9, conga: -4, congam: 9, tumba: -1, bongoh: 1, bongol: 12, tamb: 6, guiro: 10, guirol: 14,
  cabasa: 4, agogoh: 14, agogol: 10, tri: 5, trim: 9, timb: -7, bkick: -1, bsnare: -3, bstir: 3, bhhc: -1, bhhp: -6, bride: 4,
};
// the hi-hat's and ride's soft layers were recorded far softer than a drummer's light strokes: lifted (dB)
const LAYER_GAIN = { hhc: [8, 6, 4, 0], ride: [10, 3, 0] };

/** The pieces of the kit (the self-test checks that every drum pattern uses only these). */
export const PIECES = new Set(Object.keys(MIX));

let kit = null;       // { name: [[AudioBuffer, …] per layer, soft to hard] }
let loading = null;
let energy = null;    // { name: [mean energy per layer] }, for even loudness between the patterns
const turn = {};      // round robin per piece
let openHat = null;   // the open hi-hat still ringing (a closed or pedal hat chokes it)

async function fetchBytes(url, cache) {
  const hit = cache && await cache.match(url).catch(() => null);
  if (hit) return hit.arrayBuffer();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (cache) await cache.put(url, res.clone()).catch(() => {});
  return res.arrayBuffer();
}

export const kitReady = () => !!kit;

/** Loads the kit once (`onProgress(done, total)`); rejects when it cannot be fetched (offline the first time). */
export function loadKit(onProgress) {
  if (kit) return Promise.resolve(kit);
  if (loading) return loading;
  loading = (async () => {
    const ac = A.audioCtx();
    let cache = null;
    try {
      cache = await caches.open(CACHE);
      // (earlier versions of the kit are dropped)
      for (const k of await caches.keys()) if (k.startsWith('bassclass-drums-') && k !== CACHE) caches.delete(k);
    } catch { /* no Cache Storage: fetched each time */ }
    // the kit of this app's own commit, else the newest one
    let base = null, man = null;
    for (const b of BASES) {
      try { man = JSON.parse(new TextDecoder().decode(await fetchBytes(`${b}kit.json?v=${VERSION}`, cache))); base = b; break; } catch (err) { if (b === BASES.at(-1)) throw err; }
    }
    const files = Object.values(man.pieces).flat(2);
    const buffers = new Map();
    let done = 0, failed = false;
    // a few at a time; one failure stops them all (and their progress reports)
    const queue = [...files];
    const worker = async () => {
      while (queue.length && !failed) {
        const f = queue.shift();
        try {
          buffers.set(f, await ac.decodeAudioData(await fetchBytes(`${base}${f}?v=${VERSION}`, cache)));
        } catch (err) {
          failed = true;
          throw err;
        }
        if (!failed) onProgress?.(++done, files.length);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    kit = Object.fromEntries(Object.entries(man.pieces).map(([p, layers]) => [p, layers.map((l) => l.map((f) => buffers.get(f)))]));
    energy = Object.fromEntries(Object.entries(kit).map(([p, layers]) => [p, layers.map((l) => l.reduce((a, b) => a + bufferEnergy(b), 0) / l.length)]));
    gains.clear();
    return kit;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

function bufferEnergy(b) {
  let e = 0;
  for (let c = 0; c < b.numberOfChannels; c++) { const d = b.getChannelData(c); for (let i = 0; i < d.length; i++) e += d[i] * d[i]; }
  return e / b.numberOfChannels / b.sampleRate;
}

/** The layer a velocity plays: ghost the softest, accent the hardest, the others spread between. */
function layerOf(n, vel) {
  const f = Math.max(0, Math.min(1, (vel - 0.2) / 0.75));
  return Math.round(f * (n - 1));
}
const hitGain = (piece, li, vel) => 10 ** (((MIX[piece] || 0) + (LAYER_GAIN[piece]?.[li] || 0)) / 20) * (0.7 + 0.3 * vel);

// even loudness: each pattern's level (at its own tempo and subdivision) brought near the patterns' median
const gains = new Map();
function loudness(s) {
  let e = 0;
  const per = s.beats * s.grid;
  for (const [piece, steps] of Object.entries(s.tracks)) {
    steps.forEach((v, i) => {
      if (!v || stepTime(s, s.sub, i % s.grid, piece, v) == null) return;
      const layers = energy[piece];
      if (!layers) return;
      const li = layerOf(layers.length, v);
      e += layers[li] * hitGain(piece, li, v) ** 2 * (s.bars / (steps.length / per));
    });
  }
  return e / ((s.bars * s.beats * 60) / s.bpm);
}
/** A pattern's gain for even loudness between the patterns (1 until the kit has loaded). */
export function styleGain(key) {
  if (!energy || !STYLES[key]) return 1;
  if (!gains.size) {
    const all = Object.values(STYLES).map((s) => [s.key, loudness(s)]);
    const sorted = all.map(([, l]) => l).sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    // (at most 6 dB up or down: a brushes ballad stays softer than a punk beat)
    for (const [k, l] of all) gains.set(k, Math.min(2, Math.max(0.5, Math.sqrt(mid / l))));
  }
  return gains.get(key) ?? 1;
}

/** Plays `piece` at `when`; `vel` 0–1 picks the layer (soft to hard) and shades its level; `gain` scales it. */
export function playDrum(piece, when, vel = 0.75, gain = 1) {
  const layers = kit?.[piece];
  if (!layers) return;
  const ac = A.audioCtx();
  const li = layerOf(layers.length, vel);
  const rrs = layers[li];
  turn[piece] = ((turn[piece] ?? -1) + 1) % rrs.length;
  const src = ac.createBufferSource();
  src.buffer = rrs[turn[piece]];
  const g = ac.createGain();
  g.gain.value = hitGain(piece, li, vel) * gain;
  src.connect(g).connect(A.drumOut());
  src.start(when);
  // a closed or pedal hi-hat closes the open one
  if ((piece === 'hhc' || piece === 'hhp' || piece === 'hhh') && openHat) {
    openHat.gain.setTargetAtTime(0, when, 0.015);
    openHat = null;
  }
  if (piece === 'hho') openHat = g;
}
