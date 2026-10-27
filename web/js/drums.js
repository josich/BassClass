// The drum kit of the Practice room (Ogg Opus in web/audio/drums/, made by web/js/dev/drumprep.js): MuldjordKit
// by Lars Muldjord (CC BY 4.0, credited in Settings and LICENSE.txt: user, 2026-10-27, its kick dry and short
// where the old one boomed) for the kit, Virtuosity Drums (CC0) for the rim, cross-stick, flam, pedal hat and
// the percussion, and Swirly Drums (CC0) for the brushes.
// They load on first use: from this site, or, in the Android app (whose APK leaves them out to stay
// small), online from the repository at the app's own commit, so an app always gets the kit it was built
// with. Once loaded they stay in the browser's cache, so the drums also play offline.
import * as A from './audio.js';
import { COMMIT } from './version.js';
import { STYLES, stepTime } from './practice/styles.js';

const VERSION = 4;   // bump when the kit's files change: they are fetched (and cached) again
const IN_APP = location.hostname === 'appassets.androidplatform.net';
const REPO = 'https://raw.githubusercontent.com/josich/BassClass/';
const BASES = IN_APP ? [...new Set([`${REPO}${COMMIT || 'main'}/web/audio/drums/`, `${REPO}main/web/audio/drums/`])] : ['audio/drums/'];
const CACHE = `bassclass-drums-v${VERSION}`;

// The balance, as the ear hears it on a phone or at a moderate level (user, 2026-10-23: the hi-hat and the
// cumbia's guiro stood out). Each piece has one level: its accent in dB against the snare's accent, A-weighted
// (the ear's weighting at moderate levels: highs count, lows much less, as on a phone's speaker). Every
// stroke follows one curve, level × velocity^1.5: normal ("x") 4 dB under the accent, soft ("s") 10, ghost
// ("g") 21, whichever recorded layer plays it, so no stroke jumps because its layer was recorded louder.
// A time-keeper sits 8–12 dB under the backbeat in a groove (web/js/dev/drumlevels.js measures it); the rides
// (ride, its bell, the brush ride) and the guiro's scrapes are 3 dB under that (user, 2026-10-23: "the ride
// can be a bit quieter", "the scratcher in general a bit quieter"). The brushes' swish sits well under their
// taps, a hush behind them (user, 2026-10-23: it "sounds like metal scratching, much lower").
// The kit's pieces as the user set them by ear in the Drum lab (2026-10-27, web/js/dev/drumlab.html; the
// levels before it plus the lab's volumes and each shaped piece's own change, drumprep.js `levelShift`): the
// snare 10 dB down (Frankensnare, brighter: +1.1), its rim shot, cross-stick and flam with it; the kick
// shorter and darker (-2.7); the hi-hats and the ride 7.5 dB down, the crash 4, the toms 12; the percussion 8.
const LEVEL = {
  kick: -16.2, snare: -8.9, rim: -8.9, xstick: -11.9, flam: -8.9, tomh: -19, toml: -20, crash: -6,
  hhc: -19.5, hhh: -17.5, hho: -14.5, hhp: -21.5, ride: -21.5, bell: -20.5,
  // (the percussion 8 dB down with the kit, keeping its balance against the backbeat and the hats)
  shakd: -20, shaku: -22, cabasa: -21, tamb: -18, guiro: -27, guirol: -25, claves: -12, cowbell: -16, agogoh: -15, agogol: -16,
  conga: -16, congam: -18, tumba: -16, bongoh: -16, bongol: -16, timb: -14, tri: -20, trim: -22,
  bkick: -6.7, bsnare: -4.6, bstir: -34.4, bhhc: -8.4, bhhp: -13.1, bride: -12.8,
};
// the brushes keep their recorded dynamics: their soft strokes are light taps, nearly as one, and only the slap
// is far louder (user, 2026-10-23: on the curve the brushes swing sounded wrong, its taps over the swish).
// Their level is their hardest layer's; the others sound as recorded, shaded a little by velocity.
const NATURAL = new Set(['bkick', 'bsnare', 'bstir', 'bhhc', 'bhhp', 'bride']);
// each recorded layer's own loudness (A-weighted dB over a hit's first 170 ms, the mean of its round robins),
// soft to hard: measured from the kit's files by web/js/dev/drumlevels.js (measure again when the kit changes)
const LAYER_DB = {
  kick: [-47.6, -44.9, -42.5, -40.4], snare: [-39.6, -34.7, -31.3, -27.9], rim: [-34.2, -28.6], xstick: [-52.2, -41.9, -38.2, -37.7],
  flam: [-41.7, -35.3], hhc: [-57.0, -50.2, -42.8, -37.4], hhh: [-30.3], hho: [-33.3, -30.3], hhp: [-55.4], ride: [-37.3, -34.8, -32.9],
  bell: [-26.4], crash: [-34.2, -24.9], tomh: [-36.2, -32.0], toml: [-37.2, -33.8], shakd: [-35.5], shaku: [-44.3], claves: [-45.1],
  cowbell: [-54.7, -26.8], conga: [-54.1, -41.7, -38.5], congam: [-52.0], tumba: [-52.5, -41.8], bongoh: [-50.8, -36.8], bongol: [-48.4],
  tamb: [-40.0], guiro: [-54.8], guirol: [-64.7], cabasa: [-54.8, -42.1], agogoh: [-45.0], agogol: [-43.7], tri: [-42.0], trim: [-55.1],
  timb: [-38.9, -31.0], bkick: [-45.6, -35.5], bsnare: [-47.4, -44.3, -31.4], bstir: [-43.2], bhhc: [-48.0, -37.2], bhhp: [-36.9],
  bride: [-52.2, -43.7],
};
// (the patterns sound as loud as before this balance, by their median: the drum bus and its limiter are set for it)
const REF = -28.5;

/** The pieces of the kit (the self-test checks that every drum pattern uses only these). */
export const PIECES = new Set(Object.keys(LEVEL));

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
    return kit;
  })();
  loading.catch(() => { loading = null; });
  return loading;
}

/** The layer a velocity plays: ghost the softest, accent the hardest, the others spread between. */
function layerOf(n, vel) {
  const f = Math.max(0, Math.min(1, (vel - 0.2) / 0.75));
  return Math.round(f * (n - 1));
}
/** A stroke's loudness as heard (A-weighted dB): the piece's level on the velocity curve (a brush: as recorded). */
export function strokeDb(piece, vel) {
  const level = (LEVEL[piece] ?? -20) + REF, layers = LAYER_DB[piece];
  if (!NATURAL.has(piece) || !layers) return level + 30 * Math.log10(Math.max(0.05, vel));
  return level + layers[layerOf(layers.length, vel)] - layers.at(-1) + 20 * Math.log10(0.7 + 0.3 * vel);
}
/** A pattern's own level for one of its tracks (`mix`, in dB), as a gain. */
export const trackGain = (s, piece) => 10 ** ((s?.mix?.[piece] || 0) / 20);
/** The gain that brings a recorded layer to its stroke's loudness. */
const hitGain = (piece, li, vel) => 10 ** ((strokeDb(piece, vel) - (LAYER_DB[piece]?.[li] ?? REF)) / 20);

// even loudness: each pattern's level (at its own tempo and subdivision) brought near the patterns' median
const gains = new Map();
function loudness(s) {
  let e = 0;
  const per = s.beats * s.grid;
  for (const [piece, steps] of Object.entries(s.tracks)) {
    steps.forEach((v, i) => {
      if (!v || stepTime(s, s.sub, i % s.grid, piece, v) == null) return;
      e += 10 ** (strokeDb(piece, v) / 10) * trackGain(s, piece) ** 2 * (s.bars / (steps.length / per));
    });
  }
  return e / ((s.bars * s.beats * 60) / s.bpm);
}
// Through the drum chain the strokes' model is not the whole story: the limiter takes more from a sparse,
// peaky pattern, and the model hears only a hit's first 170 ms, not a ride's wash or the brushes' long swish
// (QA round 15: brushes swing sat 18 dB over the median). Each pattern more than 1 dB off the median
// loudness through the chain gets a correction, measured by web/js/dev/drumlevels.js chain(): 121 of the 124
// then sit within 1 dB of it (A-weighted, at 100%), the brushes under it. Measure again when patterns or the
// kit change.
// The two brushes patterns are set by their taps instead (`BY_TAPS`; the swish, now low, no longer their
// loudness): the snare 6 dB over where it was, the swish 18 dB under, the pattern 6–8 dB under the median
// (brushes are soft); chain() leaves them as they are.
export const BY_TAPS = { brushswing: -12, brushballad: -9 };
const CHAIN_DB = {
  // (kit v4, 2026-10-27: every pattern measured again with the Drum lab's balance, against the median of all 124)
  rockride: -3.5, punk: -4.5, rockfloor: -2.5, rockballad: 5, six8rock: 4, poppunk: -3.5, dbeat: -3.5, skank: -5.5,
  breakdown: -4.5, blast: -8, doom: -3, dance: -3, disco: -2.5, popballad: 8.5, synthpop: 3.5, poprock: -2,
  stomp: 2.5, baggy: -2, soulballad: 4, trap: -2, rnbballad: 6.5, phillysoul: -2.5, lofi: 2.5, chicagoshuffle: -3,
  slowblues: 5, jumpblues: -3.5, halfshuffle: 2.5, minorblues: -1.5, swing: -7.5, upswing: -8.5, twofeel: -7,
  jazzwaltz: -7, bebop: -8, jazzfive: -8.5, jazzshuffle: -4, bossa: 6, samba: -2.5, baiao: -2.5, chacha: -4,
  rumba: 9, afro68: -4, habanera: 6.5, songo: -2, partidoalto: -2.5, afrobeat: -2.5, onedrop: 6.5, rockers: 6.5,
  steppers: 8, rocksteady: 3.5, soca: -4, train: -3.5, twostep: 3, countryshuffle: 3, bluegrass: -10, folk68: 4,
  jig: 3.5, countryrock: -3, ...BY_TAPS,
};

/** A pattern's gain for even loudness between the patterns (`chain`: with its correction for the drum chain). */
export function styleGain(key, chain = true) {
  if (!STYLES[key]) return 1;
  return modelGain(key) * (chain ? 10 ** ((CHAIN_DB[key] || 0) / 20) : 1);
}
function modelGain(key) {
  if (!gains.size) {
    const all = Object.values(STYLES).map((s) => [s.key, loudness(s)]);
    const sorted = all.map(([, l]) => l).sort((a, b) => a - b);
    const mid = sorted[Math.floor(sorted.length / 2)];
    // (at most 6 dB up or down: a brushes ballad stays softer than a punk beat)
    for (const [k, l] of all) gains.set(k, Math.min(2, Math.max(0.5, Math.sqrt(mid / l))));
  }
  return gains.get(key) ?? 1;
}

/** A stroke: the recorded layer's next round robin that plays it, and its gain (null until the kit has loaded). */
export function voice(piece, vel) {
  const layers = kit?.[piece];
  if (!layers) return null;
  const li = layerOf(layers.length, vel);
  const rrs = layers[li];
  turn[piece] = ((turn[piece] ?? -1) + 1) % rrs.length;
  return { buffer: rrs[turn[piece]], gain: hitGain(piece, li, vel) };
}

/** Plays `piece` at `when`; `vel` 0–1 picks the layer (soft to hard) and shades its level; `gain` scales it. Returns its gain node. */
export function playDrum(piece, when, vel = 0.75, gain = 1) {
  const v = voice(piece, vel);
  if (!v) return;
  const ac = A.audioCtx();
  const src = ac.createBufferSource();
  src.buffer = v.buffer;
  const g = ac.createGain();
  g.gain.value = v.gain * gain;
  src.connect(g).connect(A.drumOut());
  src.start(when);
  // a closed or pedal hi-hat closes the open one
  if ((piece === 'hhc' || piece === 'hhp' || piece === 'hhh') && openHat) {
    openHat.gain.setTargetAtTime(0, when, 0.015);
    openHat = null;
  }
  if (piece === 'hho') openHat = g;
  return g;   // (disconnected, a hit not yet sounded is cancelled)
}
