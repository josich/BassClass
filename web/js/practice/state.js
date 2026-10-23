// The Practice room's own settings (localStorage, failure-tolerant like store.js): kept between visits.
import { STYLES, GENRES } from './styles.js';
import { PROG_KEYS, QUALITIES, LENGTHS, MINE_START } from './harmony.js';

const KEY = 'bassclass.practice.v1';

export const SUBS = [1, 2, 3, 4];        // clicks per beat without drums: quarters, 8ths, triplets, 16ths

const DEFAULTS = { bpm: 90, beats: 4, sub: 1, accents: {}, lightsTapped: false, click: true, play: 2, mute: 0, speedUp: false, upBy: 2, upEvery: 4, upTo: 200, drums: false, genre: 'rock', style: 'rock8', drumVol: 80, fab: null,
  harmony: 'off', hKey: 9, hProg: 'blues', hVol: 70, neckShow: 'chord',
  // My progression, to start: I – vi – ii – V, a bar each
  myProg: MINE_START, myMinor: false, hSound: 'pad',
  // the pickers' ★ favourites and recent picks (newest first)
  drumFavs: [], drumRecent: [], progFavs: [], progRecent: [] };
const int = (lo, hi) => (v) => Number.isInteger(v) && v >= lo && v <= hi;
// (a list of a library's keys, each once, at most `max`)
const keysOf = (ok, max) => (v) => Array.isArray(v) && v.length <= max && new Set(v).size === v.length && v.every((k) => typeof k === 'string' && ok(k));
const isStyle = (k) => Object.prototype.hasOwnProperty.call(STYLES, k);
const isProg = (k) => PROG_KEYS.includes(k);
// (`o`: the chord it was before the last Major | Minor switch, which the next switch gives back)
const isChord = (c) => !!c && int(0, 11)(c.d) && QUALITIES.some(([q]) => q === c.q) && LENGTHS.some(([b]) => b === c.b) && (c.k == null || int(0, 11)(c.k))
  && (c.o == null || (!!c.o && int(0, 11)(c.o.d) && QUALITIES.some(([q]) => q === c.o.q)));
// a stored grouping: { beats: [accented beats] }, each beat once and inside the bar
const isGrouping = ([k, list]) => int(1, 12)(Number(k)) && String(Number(k)) === k && Array.isArray(list) && new Set(list).size === list.length && list.every(int(0, Number(k) - 1));
// a stored list keeps what it still knows: an entry no longer known (a pattern renamed, a backup from a newer
// version) is dropped on its own, not with the whole list (QA round 16)
const keep = (ok, max) => (v) => (Array.isArray(v) ? [...new Set(v.filter((k) => typeof k === 'string' && ok(k)))].slice(0, max) : v);
const CLEAN = {
  drumFavs: keep(isStyle, 99), drumRecent: keep(isStyle, 6), progFavs: keep(isProg, 40), progRecent: keep(isProg, 6),
  myProg: (v) => (Array.isArray(v) ? v.filter(isChord).slice(0, 16) : v),
  // (one bad grouping goes on its own, not the player's others: QA round 18)
  accents: (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).filter(isGrouping)) : v),
};
const RULES = {
  bpm: int(1, 660),       // the room's range is PolyOrbit's (ui/practice.js)
  beats: int(1, 12),
  sub: (v) => [1, 2, 3, 4, 6].includes(v),   // (6: 16ths of a compound-metre drum pattern)
  // the player's own accented beats, by the bar's number of beats ({ 7: [0, 3, 5] }); a bar without any
  // takes its usual grouping (practice/accents.js)
  accents: (v) => !!v && typeof v === 'object' && !Array.isArray(v) && Object.entries(v).every(isGrouping),
  lightsTapped: (v) => typeof v === 'boolean',   // the player has tapped a beat light (its hint then goes)
  click: (v) => typeof v === 'boolean',   // the metronome's sound (off: the drums keep the time alone)
  play: int(1, 8),        // muted bars: `play` bars with the click, then `mute` bars silent (0 = off)
  mute: int(0, 8),
  speedUp: (v) => typeof v === 'boolean',   // speed up (off until the player turns it on): + `upBy` BPM every `upEvery` bars
  upBy: int(1, 10),
  upEvery: int(1, 16),
  upTo: int(40, 660),     // ... no faster than this
  drums: (v) => typeof v === 'boolean',
  style: (v) => typeof v === 'string' && Object.prototype.hasOwnProperty.call(STYLES, v),
  genre: (v) => GENRES.some((g) => g.key === v),
  drumVol: int(0, 100),
  harmony: (v) => ['off', 'drone', 'chords'].includes(v),   // the pad: nothing, a drone on the key, or a progression
  hKey: int(0, 11),
  hProg: (v) => PROG_KEYS.includes(v),
  hVol: int(0, 100),
  drumFavs: keysOf(isStyle, 99), drumRecent: keysOf(isStyle, 6), progFavs: keysOf(isProg, 40), progRecent: keysOf(isProg, 6),
  myProg: (v) => Array.isArray(v) && v.length >= 1 && v.length <= 16 && v.every(isChord),
  myMinor: (v) => typeof v === 'boolean',
  hSound: (v) => ['pad', 'epiano', 'organ', 'arp'].includes(v),   // the harmony's sound (audio.js PAD_SOUNDS)
  neckShow: (v) => ['chord', 'scale', 'off'].includes(v),   // the Neck shows the chord sounding, its scale, or the player's own choice
  // where the floating Start/Stop was dragged: its centre as a share of the screen's width and height
  fab: (v) => v === null || (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && n >= 0 && n <= 1)),
};

function load() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { v = {}; }
  if (!v || typeof v !== 'object') v = {};
  // (the first room kept muted bars as `gap`, N on and N off, and the speed trainer as `trainer`, every 4 bars;
  // speed up had no switch, 0 BPM was off: whatever was kept, it now starts off)
  if (RULES.mute(v.gap) && v.mute == null) { v.play = Math.max(1, v.gap); v.mute = v.gap; }
  if (RULES.upBy(v.trainer) && v.upBy == null) v.upBy = v.trainer;
  // (the accent was on 1 or off: off, the bar the player had kept no accent)
  if (v.accent === false && v.accents == null) v.accents = { [RULES.beats(v.beats) ? v.beats : 4]: [] };
  // (the strings gave way to the arpeggio)
  if (v.hSound === 'strings') v.hSound = 'arp';
  // (the Neck's Follow was on or off)
  if (typeof v.neckFollow === 'boolean' && v.neckShow == null) v.neckShow = v.neckFollow ? 'chord' : 'off';
  for (const [k, clean] of Object.entries(CLEAN)) if (k in v) v[k] = clean(v[k]);
  const out = { ...DEFAULTS };
  for (const [k, ok] of Object.entries(RULES)) if (ok(v[k])) out[k] = v[k];
  return out;
}

export const room = load();
export function saveRoom(patch) {
  for (const [k, v] of Object.entries(patch)) if (RULES[k]?.(v)) room[k] = v;
  try { localStorage.setItem(KEY, JSON.stringify(room)); } catch { /* storage unavailable */ }
}
