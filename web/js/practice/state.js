// The Practice room's own settings (localStorage, failure-tolerant like store.js): kept between visits.
const KEY = 'bassclass.practice.v1';

export const SUBS = [1, 2, 3, 4];        // clicks per beat
export const GAPS = [0, 1, 2, 4];        // muted bars: N bars on, then N bars silent (0 = off)
export const TRAINER = [0, 2, 4];        // speed trainer: + BPM every 4 bars (0 = off)

const DEFAULTS = { bpm: 90, beats: 4, sub: 1, accent: true, gap: 0, trainer: 0 };
const RULES = {
  bpm: (v) => Number.isInteger(v) && v >= 30 && v <= 260,
  beats: (v) => Number.isInteger(v) && v >= 1 && v <= 12,
  sub: (v) => SUBS.includes(v),
  accent: (v) => typeof v === 'boolean',
  gap: (v) => GAPS.includes(v),
  trainer: (v) => TRAINER.includes(v),
};

function load() {
  let v;
  try { v = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { v = {}; }
  const out = { ...DEFAULTS };
  if (v && typeof v === 'object') for (const [k, ok] of Object.entries(RULES)) if (ok(v[k])) out[k] = v[k];
  return out;
}

export const room = load();
export function saveRoom(patch) {
  for (const [k, v] of Object.entries(patch)) if (RULES[k]?.(v)) room[k] = v;
  try { localStorage.setItem(KEY, JSON.stringify(room)); } catch { /* storage unavailable */ }
}
