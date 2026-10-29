// "New" chips (user, 2026-10-28: "each time we add something new we need a chip on top, like the Pro one, telling
// 'new', that will disappear after being used once"). Nothing to date by hand: the app keeps the ids of the content
// it already knew (exercises, lessons, drum patterns, progressions, sounds), and whatever an update adds is new for
// this player until it is used once (opened, picked, played). A first start knows everything, so a new player sees
// no chips. Stored in `bassclass.new.v1` ({ known, fresh }), so a backup carries it.
const KEY = 'bassclass.new.v1';
// (an install from before the chips: these additions of 2026-10-27/28 count as new once, so the feature shows)
const SEED = [
  'ex:sc-pent-three-boxes', 'ex:sc-pent-minor-grooves', 'ex:sc-pent-one-phrase', 'ex:sc-pent-major-chord', 'ex:sc-pent-groove-fill',
  'ex:sc-pent-double-stops', 'ex:hm-chord-formulas', 'ex:tech-harmonic-chords',
  'lesson:pent-three-boxes', 'lesson:pent-minor-grooves', 'lesson:pent-one-phrase', 'lesson:pent-major-chord', 'lesson:pent-groove-fill',
  'lesson:pent-double-stops', 'lesson:chord-formulas', 'lesson:harmonic-chords',
  'prog:I-IV-V-IV', 'prog:I-bVI-bVII-I', 'prog:I-VI7-ii-V', 'prog:neo-soul', 'prog:I-iv-I', 'prog:ii-bII7-I', 'prog:ii-V7alt-I',
  'prog:minor-bossa', 'prog:modal-form', 'prog:i-iv-V-i', 'prog:vamp-phrygian', 'prog:vamp-lydian', 'prog:vamp-i-iv', 'prog:vamp-i-bVII',
  'sound:piano', 'sound:organ', 'sound:guitar',
];

let fresh = new Set();
let known = [];   // the ids this start knew (kept here: a record that cannot be read later never loses them)
let ready = false;

function read() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || 'null');
    return v && Array.isArray(v.known) && Array.isArray(v.fresh) ? v : null;
  } catch { return null; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ known, fresh: [...fresh] })); } catch { /* storage unavailable */ }
}

/** At start: every content id the app has now. What the last start did not know becomes new. */
export function initNews(ids) {
  const all = new Set(ids);
  const st = read();
  if (st) {
    const before = new Set(st.known);
    fresh = new Set([...st.fresh.filter((id) => all.has(id)), ...ids.filter((id) => !before.has(id))]);
  } else {
    // a first start: nothing is new, except the latest additions for a player who had the app before the chips
    const before = Object.keys(localStorage).some((k) => k.startsWith('bassclass.') && k !== KEY);
    fresh = new Set(before ? SEED.filter((id) => all.has(id)) : []);
  }
  known = [...ids];
  ready = true;
  save();
}

/** Is this item new for the player (added by an update, not used yet)? */
export const isNew = (id) => ready && fresh.has(id);
/** How many of these ids are new (a Library level, a stage of the map). */
export const newCount = (ids) => ids.filter(isNew).length;
/** The item was used: its chip goes. */
export function markUsed(id) {
  if (fresh.delete(id)) save();
}
/** Testing (Settings' debug panel): the latest additions count as new again. */
export function resetNews() {
  for (const id of SEED) fresh.add(id);
  save();
}
