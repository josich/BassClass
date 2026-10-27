// The Practice room's piano (user, 2026-10-27): the Kawai grand of the Versilian Community Sample Library
// (Versilian Studios, CC0), a note every two or three semitones from D3 to A5 (Ogg Opus in web/audio/piano/,
// made by web/js/dev/pianoprep.js; the app plays the others by shifting the nearest). Like the drums it loads
// on first use, from this site or, in the Android app (whose APK leaves it out to stay small), online from the
// repository at the app's own commit, and stays in the browser's cache, so it also plays offline.
import * as A from './audio.js';
import { COMMIT } from './version.js';

const VERSION = 1;   // bump when the files change: they are fetched (and cached) again
const IN_APP = location.hostname === 'appassets.androidplatform.net';
const REPO = 'https://raw.githubusercontent.com/josich/BassClass/';
const BASES = IN_APP ? [...new Set([`${REPO}${COMMIT || 'main'}/web/audio/piano/`, `${REPO}main/web/audio/piano/`])] : ['audio/piano/'];
const CACHE = `bassclass-piano-v${VERSION}`;

let loading = null;

async function fetchBytes(url, cache) {
  const hit = cache && await cache.match(url).catch(() => null);
  if (hit) return hit.arrayBuffer();
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (cache) await cache.put(url, res.clone()).catch(() => {});
  return res.arrayBuffer();
}

export const pianoReady = () => A.pianoLoaded();

/** Loads the piano once (`onProgress(done, total)`) and hands it to the audio engine; rejects when offline the first time. */
export function loadPiano(onProgress) {
  if (A.pianoLoaded()) return Promise.resolve();
  if (loading) return loading;
  loading = (async () => {
    const ac = A.audioCtx();
    let cache = null;
    try {
      cache = await caches.open(CACHE);
      for (const k of await caches.keys()) if (k.startsWith('bassclass-piano-') && k !== CACHE) caches.delete(k);
    } catch { /* no Cache Storage: fetched each time */ }
    let base = null, man = null;
    for (const b of BASES) {
      try { man = JSON.parse(new TextDecoder().decode(await fetchBytes(`${b}piano.json?v=${VERSION}`, cache))); base = b; break; } catch (err) { if (b === BASES.at(-1)) throw err; }
    }
    const notes = Object.entries(man.notes);
    const bank = new Map();
    let done = 0;
    await Promise.all(Array.from({ length: 4 }, async () => {
      while (notes.length) {
        const [midi, f] = notes.shift();
        bank.set(Number(midi), await ac.decodeAudioData(await fetchBytes(`${base}${f}?v=${VERSION}`, cache)));
        onProgress?.(++done, Object.keys(man.notes).length);
      }
    }));
    A.setPianoBank(bank);
  })();
  loading.catch(() => { loading = null; });
  return loading;
}
