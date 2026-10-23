// The Practice room's own settings (localStorage, failure-tolerant like store.js): kept between visits.
const KEY = 'bassclass.practice.v1';

export const SUBS = [1, 2, 3, 4];        // clicks per beat: quarters, 8ths, triplets, 16ths

const DEFAULTS = { bpm: 90, beats: 4, sub: 1, accent: true, play: 2, mute: 0, upBy: 0, upEvery: 4 };
const int = (lo, hi) => (v) => Number.isInteger(v) && v >= lo && v <= hi;
const RULES = {
  bpm: int(30, 260),
  beats: int(1, 12),
  sub: (v) => SUBS.includes(v),
  accent: (v) => typeof v === 'boolean',
  play: int(1, 8),        // muted bars: `play` bars with the click, then `mute` bars silent (0 = off)
  mute: int(0, 8),
  upBy: int(0, 10),       // speed up: + `upBy` BPM (0 = off) every `upEvery` bars
  upEvery: int(1, 16),
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
