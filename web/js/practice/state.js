// The Practice room's own settings (localStorage, failure-tolerant like store.js): kept between visits.
import { STYLES, GENRES } from './styles.js';
import { PROG_KEYS } from './harmony.js';

const KEY = 'bassclass.practice.v1';

export const SUBS = [1, 2, 3, 4];        // clicks per beat without drums: quarters, 8ths, triplets, 16ths

const DEFAULTS = { bpm: 90, beats: 4, sub: 1, accent: true, click: true, play: 2, mute: 0, upBy: 0, upEvery: 4, upTo: 200, drums: false, genre: 'rock', style: 'rock8', drumVol: 80, fab: null,
  harmony: 'off', hKey: 9, hProg: 'blues', hVol: 70, neckFollow: true };
const int = (lo, hi) => (v) => Number.isInteger(v) && v >= lo && v <= hi;
const RULES = {
  bpm: int(1, 660),       // the room's range is PolyOrbit's (ui/practice.js)
  beats: int(1, 12),
  sub: (v) => [1, 2, 3, 4, 6].includes(v),   // (6: 16ths of a compound-metre drum pattern)
  accent: (v) => typeof v === 'boolean',
  click: (v) => typeof v === 'boolean',   // the metronome's sound (off: the drums keep the time alone)
  play: int(1, 8),        // muted bars: `play` bars with the click, then `mute` bars silent (0 = off)
  mute: int(0, 8),
  upBy: int(0, 10),       // speed up: + `upBy` BPM (0 = off) every `upEvery` bars
  upEvery: int(1, 16),
  upTo: int(40, 660),     // ... no faster than this
  drums: (v) => typeof v === 'boolean',
  style: (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(STYLES, v),
  genre: (v) => GENRES.some((g) => g.key === v),
  drumVol: int(0, 100),
  // where the floating Start/Stop was dragged: its centre as a share of the screen's width and height
  harmony: (v) => ['off', 'drone', 'chords'].includes(v),   // the pad: nothing, a drone on the key, or a progression
  hKey: int(0, 11),
  hProg: (v) => PROG_KEYS.includes(v),
  hVol: int(0, 100),
  neckFollow: (v) => typeof v === 'boolean',   // the Neck block shows the harmony sounding
  fab: (v) => v === null || (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && n >= 0 && n <= 1)),
};

function load() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { v = {}; }
  if (!v || typeof v !== 'object') v = {};
  // (the first room kept muted bars as `gap`, N on and N off, and the speed trainer as `trainer`, every 4 bars)
  if (RULES.mute(v.gap) && v.mute == null) { v.play = Math.max(1, v.gap); v.mute = v.gap; }
  if (RULES.upBy(v.trainer) && v.upBy == null) v.upBy = v.trainer;
  const out = { ...DEFAULTS };
  for (const [k, ok] of Object.entries(RULES)) if (ok(v[k])) out[k] = v[k];
  return out;
}

export const room = load();
export function saveRoom(patch) {
  for (const [k, v] of Object.entries(patch)) if (RULES[k]?.(v)) room[k] = v;
  try { localStorage.setItem(KEY, JSON.stringify(room)); } catch { /* storage unavailable */ }
}
