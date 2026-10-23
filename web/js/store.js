// Persistent settings and practice progress (localStorage, failure-tolerant).
// Everything read back is validated: corrupt or old values fall back to defaults.
const KEY_SETTINGS = 'bassclass.settings.v1';
const KEY_PROGRESS = 'bassclass.progress.v1';
const KEY_FAVORITES = 'bassclass.favorites.v1';

export const DEFAULT_SETTINGS = {
  strings: 4,
  notation: 'letters',     // 'letters' | 'solfege'
  label: 'note',           // 'note' | 'degree' | 'finger' | 'none'
  reveal: 'gradual',       // 'gradual' | 'full' | 'quiz'
  lefty: false,
  a4: 440,                 // tuner reference
  countIn: true,
  metro: true,
  clickSubs: false,
  bassVol: 2,              // 0..2, shown as 0-100%; above 1 the output is pushed into the limiter
  clickVol: 0.6,
  tapSounds: true,   // a soft tick on every tap of a control (user, 2026-10-23)
  maxFret: 20,
  level: 1,                // preferred level for warm-ups (new players start at Level 1)
  backing: 'off',          // 'off' | 'drone' | 'chords': a pad under the exercise
  score: 'tab',            // 'tab' | 'staff': the strip under the neck
  libOpen: null,           // the Library levels left open (null: only the player's own level)
  libView: 'levels',       // the Library's view: 'levels' (every exercise by level) | 'topics' (one card per topic)
  mapOpen: null,           // the course map stages left open (null: only the next lesson's stage)
  libAt: null,             // the player's level when libOpen was last saved
  mapAt: null,             // the next lesson's stage when mapOpen was last saved
  v: 2,                    // settings format (see migrate)
};

const oneOf = (list) => (v) => list.includes(v);
const isBool = (v) => typeof v === 'boolean';
const numIn = (lo, hi) => (v) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
const SETTING_RULES = {
  strings: oneOf([4, 5, 6]),
  notation: oneOf(['letters', 'solfege']),
  label: oneOf(['note', 'degree', 'finger', 'none']),
  reveal: oneOf(['gradual', 'full', 'quiz']),
  lefty: isBool, countIn: isBool, metro: isBool, clickSubs: isBool, tapSounds: isBool,
  a4: numIn(425, 455),
  bassVol: numIn(0, 2), clickVol: numIn(0, 1.5),
  maxFret: oneOf([17, 20, 21, 24]),
  level: oneOf([1, 2, 3, 4, 5, 6]),
  backing: oneOf(['off', 'drone', 'chords']),
  score: oneOf(['tab', 'staff']),
  libView: oneOf(['levels', 'topics']),
  libOpen: (v) => v === null || (Array.isArray(v) && v.length <= 6 && v.every((n) => [1, 2, 3, 4, 5, 6].includes(n))),
  mapOpen: (v) => v === null || (Array.isArray(v) && v.length <= 6 && v.every((n) => [1, 2, 3, 4, 5, 6].includes(n))),
  libAt: (v) => v === null || [1, 2, 3, 4, 5, 6].includes(v),
  mapAt: (v) => v === null || [1, 2, 3, 4, 5, 6].includes(v),
  v: numIn(1, 99),
};
export const SUB_VALUES = [0.25, 0.5, 1, 2, 3, 4, 5, 6];
export const LABEL_VALUES = ['note', 'degree', 'finger', 'none'];

function read(key) {
  try {
    const raw = localStorage.getItem(key);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

function cleanSettings(raw) {
  const out = { ...DEFAULT_SETTINGS };
  for (const [k, ok] of Object.entries(SETTING_RULES)) if (ok(raw[k])) out[k] = raw[k];
  return out;
}

/** Keep only well-formed fields of a progress record. */
function cleanEntry(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const out = {};
  if (numIn(0, 1e7)(e.plays)) out.plays = Math.floor(e.plays);
  if (numIn(30, 260)(e.bestBpm)) out.bestBpm = e.bestBpm;
  if (numIn(30, 260)(e.lastBpm)) out.lastBpm = e.lastBpm;
  if (isBool(e.done)) out.done = e.done;
  if (SUB_VALUES.includes(e.sub)) out.sub = e.sub;
  if (LABEL_VALUES.includes(e.label)) out.label = e.label;
  if (numIn(0, 1e15)(e.last)) out.last = e.last;
  if (e.params && typeof e.params === 'object' && !Array.isArray(e.params)) {
    out.params = Object.fromEntries(Object.entries(e.params).filter(([, v]) => typeof v === 'string'));
  }
  return out;
}

// v2 (2026-10-15): the bass volume scale doubled (0-2 shown as 0-100%, default the maximum).
// Settings saved before stored the old default, 1, which would now read 50%.
function migrate(raw) {
  if (!(raw.v >= 2)) {
    if (raw.bassVol === 1) raw.bassVol = DEFAULT_SETTINGS.bassVol;
    raw.v = 2;
  }
  return raw;
}
export const settings = cleanSettings(migrate(read(KEY_SETTINGS)));
export function saveSettings(patch) {
  for (const [k, v] of Object.entries(patch)) if (!SETTING_RULES[k] || SETTING_RULES[k](v)) settings[k] = v;
  write(KEY_SETTINGS, settings);
}

const progress = {};
for (const [id, e] of Object.entries(read(KEY_PROGRESS))) {
  const c = cleanEntry(e);
  if (c) progress[id] = c;
}

/** Per-exercise record: { done, bestBpm, plays, last, params, lastBpm, sub, label } */
export const getProgress = (id) => progress[id] || null;
export function updateProgress(id, patch) {
  progress[id] = cleanEntry({ ...(progress[id] || { plays: 0 }), ...patch, last: Date.now() }) || {};
  write(KEY_PROGRESS, progress);
  return progress[id];
}
export const allProgress = () => progress;

// ---------------------------------------------------------------- favorites (ordered exercise ids)
function readList(key) {
  try {
    const v = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && x.length < 80))] : [];
  } catch {
    return [];
  }
}
let favorites = readList(KEY_FAVORITES);
export const getFavorites = () => [...favorites];
export const isFavorite = (id) => favorites.includes(id);
/** Star or unstar an exercise; new favorites go to the end. Returns the new state. */
export function toggleFavorite(id) {
  favorites = isFavorite(id) ? favorites.filter((x) => x !== id) : [...favorites, id];
  write(KEY_FAVORITES, favorites);
  return isFavorite(id);
}
/** Save a new order (from drag and drop); ids not in the list are ignored. */
export function setFavoritesOrder(ids) {
  favorites = [...new Set(ids.filter((x) => favorites.includes(x))), ...favorites.filter((x) => !ids.includes(x))];
  write(KEY_FAVORITES, favorites);
}
export function resetProgress() {
  for (const k of Object.keys(progress)) delete progress[k];
  write(KEY_PROGRESS, progress);
}
