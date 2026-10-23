// The drum kit of the Practice room: CC0 Virtuosity Drums samples (mono Ogg Opus in web/audio/drums/,
// made by web/js/dev/drumprep.js). They load on first use: from this site, or, in the Android app (whose
// APK leaves them out to stay small), online from the repository. Once loaded they stay in the
// browser's cache, so the drums also play offline.
import * as A from './audio.js';

const VERSION = 1;   // bump when the kit's files change: they are fetched (and cached) again
const IN_APP = location.hostname === 'appassets.androidplatform.net';
const BASE = IN_APP ? 'https://raw.githubusercontent.com/josich/BassClass/main/web/audio/drums/' : 'audio/drums/';
const CACHE = `bassclass-drums-v${VERSION}`;

// each piece's level in dB over the kit as recorded (one room mic hears the ride and hi-hat far quieter
// than a groove wants them), measured from the files' first 50 ms
const MIX = {
  kick: 5, snare: 0, rim: 0, xstick: 8, hhc: 8, hhh: 8, hho: 2, hhp: 10, ride: 16, bell: 14, crash: 8, tomh: -2, toml: -2,
  shakd: 2, shaku: 10, claves: 2, cowbell: -8, bongoh: -2, bongol: -2, tamb: -4, conga: -6, congas: 0,
};

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
