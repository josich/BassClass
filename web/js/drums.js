// The drum kit of the Practice room: CC0 Virtuosity Drums (its close mics and overheads, stereo) with
// percussion, and Swirly Drums brushes (Ogg Opus in web/audio/drums/, made by web/js/dev/drumprep.js).
// They load on first use: from this site, or, in the Android app (whose APK leaves them out to stay
// small), online from the repository. Once loaded they stay in the
// browser's cache, so the drums also play offline.
import * as A from './audio.js';

const VERSION = 2;   // bump when the kit's files change: they are fetched (and cached) again
const IN_APP = location.hostname === 'appassets.androidplatform.net';
const BASE = IN_APP ? 'https://raw.githubusercontent.com/josich/BassClass/main/web/audio/drums/' : 'audio/drums/';
const CACHE = `bassclass-drums-v${VERSION}`;

// each piece's level in dB over its family as recorded (kit, percussion, brushes), so a groove sits as a
// drummer would play it: measured from the files' first 50 ms (peaks for the scraped guiro)
const MIX = {
  kick: -2, snare: 3, rim: 2, xstick: 8, flam: 8, hhc: 10, hhh: 10, hho: 7, hhp: 14, ride: 14, bell: 14, crash: 10, tomh: 1, toml: 2,
  shakd: 5, shaku: 8, claves: 12, cowbell: -9, conga: -4, congam: 9, tumba: -1, bongoh: 1, bongol: 12, tamb: 6, guiro: 10, guirol: 14,
  cabasa: 4, agogoh: 14, agogol: 10, tri: 5, trim: 9, timb: -7, bkick: -1, bsnare: -3, bstir: 3, bhhc: -1, bhhp: -6, bride: 4,
};

/** The pieces of the kit (the self-test checks that every drum pattern uses only these). */
export const PIECES = new Set(Object.keys(MIX));

let kit = null;       // { name: [[AudioBuffer, …] per layer, soft to hard] }
let loading = null;
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
    const man = JSON.parse(new TextDecoder().decode(await fetchBytes(`${BASE}kit.json?v=${VERSION}`, cache)));
    const files = Object.values(man.pieces).flat(2);
    const buffers = new Map();
    let done = 0;
    // a few at a time
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        buffers.set(f, await ac.decodeAudioData(await fetchBytes(`${BASE}${f}?v=${VERSION}`, cache)));
        onProgress?.(++done, files.length);
      }
    };
    await Promise.all(Array.from({ length: 6 }, worker));
    kit = Object.fromEntries(Object.entries(man.pieces).map(([p, layers]) => [p, layers.map((l) => l.map((f) => buffers.get(f)))]));
    return kit;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

/** Plays `piece` at `when`; `vel` 0–1 picks the layer (soft to hard) and shades its level. */
export function playDrum(piece, when, vel = 0.75) {
  const layers = kit?.[piece];
  if (!layers) return;
  const ac = A.audioCtx();
  const rrs = layers[Math.min(layers.length - 1, Math.floor(vel * layers.length))];
  turn[piece] = ((turn[piece] ?? -1) + 1) % rrs.length;
  const src = ac.createBufferSource();
  src.buffer = rrs[turn[piece]];
  const g = ac.createGain();
  g.gain.value = 10 ** ((MIX[piece] || 0) / 20) * (0.7 + 0.3 * vel);
  src.connect(g).connect(A.drumOut());
  src.start(when);
  // a closed or pedal hi-hat closes the open one
  if ((piece === 'hhc' || piece === 'hhp' || piece === 'hhh') && openHat) {
    openHat.gain.setTargetAtTime(0, when, 0.015);
    openHat = null;
  }
  if (piece === 'hho') openHat = g;
}
