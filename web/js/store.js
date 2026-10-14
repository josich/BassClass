// Persistent settings and practice progress (localStorage, failure-tolerant).
const KEY_SETTINGS = 'bassclass.settings.v1';
const KEY_PROGRESS = 'bassclass.progress.v1';

export const DEFAULT_SETTINGS = {
  strings: 4,
  notation: 'letters',     // 'letters' | 'solfege'
  label: 'note',           // 'note' | 'degree' | 'finger' | 'none'
  reveal: 'gradual',       // 'gradual' | 'full' | 'quiz'
  lefty: false,
  octaveUp: false,         // small-speaker boost (harmonic exciter)
  voice: 'auto',           // 'auto' (recorded samples when installed) | 'synth'
  a4: 440,                 // tuner reference
  countIn: true,
  metro: true,
  clickSubs: false,
  bassVol: 0.9,
  clickVol: 0.6,
  maxFret: 20,
  level: 3,                // preferred level for warm-ups
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}

export const settings = { ...DEFAULT_SETTINGS, ...read(KEY_SETTINGS, {}) };
export function saveSettings(patch) {
  Object.assign(settings, patch);
  write(KEY_SETTINGS, settings);
}

const progress = read(KEY_PROGRESS, {});
/** Per-exercise record: { done, bestBpm, plays, last, params } */
export const getProgress = (id) => progress[id] || null;
export function updateProgress(id, patch) {
  progress[id] = { ...(progress[id] || { plays: 0 }), ...patch, last: Date.now() };
  write(KEY_PROGRESS, progress);
  return progress[id];
}
export const allProgress = () => progress;
export function resetProgress() {
  for (const k of Object.keys(progress)) delete progress[k];
  write(KEY_PROGRESS, progress);
}
