// Backing harmony: what a drone or chord pad should play under each part of an exercise, read
// from the chord badges. Only real harmony counts: a chord symbol ("Cmaj7", "F♯m7♭5", "D/C") or
// a note followed by a scale or mode name ("D Dorian", "C minor", "C♯ Dorian (= D♭)"). Words that
// merely start with a note letter ("Charleston", "First position", "E string", "Mixed") never do.
import * as T from './theory.js';
import { SHORT } from './curriculum/common.js';

const SOLFEGE = { Do: 'C', Re: 'D', Mi: 'E', Fa: 'F', Sol: 'G', La: 'A', Si: 'B' };
const SYM_TO_TYPE = new Map();
for (const [type, c] of Object.entries(T.CHORDS)) if (!SYM_TO_TYPE.has(c.sym)) SYM_TO_TYPE.set(c.sym, type);
// a power chord ("F5", the rock studies): root and 5th, not one of the app's chord types
SYM_TO_TYPE.set('5', 'pow');

// scale and mode names as they appear on badges -> scale key
const SCALE_NAMES = new Map([['ionian', 'ionian'], ['aeolian', 'aeolian'], ['major', 'ionian'], ['minor', 'aeolian'],
  ['natural minor', 'aeolian'], ['augmented scale', 'augmented'], ['major scale', 'ionian'], ['minor scale', 'aeolian'],
  ['pent', 'majorPent'], ['major pentatonic', 'majorPent'], ['minor pentatonic', 'minorPent']]);
for (const [k, v] of Object.entries(T.SCALES)) {
  SCALE_NAMES.set(v.name.toLowerCase(), k);
  SCALE_NAMES.set(v.name.split(' (')[0].toLowerCase(), k);
}
for (const [k, v] of Object.entries(SHORT)) SCALE_NAMES.set(v.toLowerCase(), k);

const ROOT = /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([♭♯]*)(?=$|[\s/(°ø+]|m|maj|sus|add|dim|aug|[0-9])/;
const noteOf = (letter, acc) => T.N((SOLFEGE[letter] || letter) + acc.replace(/♭/g, 'b').replace(/♯/g, '#'));

/** Root, chord type or scale, and slash bass of a badge; null when it names no harmony. */
export function parseBadge(label) {
  if (!label) return null;
  const s = String(label).replace(/\s*\(=[^)]*\)\s*$/, '').trim();
  const m = s.match(ROOT);
  if (!m) return null;
  const root = noteOf(m[1], m[2]);
  const rest = s.slice(m[0].length);
  // "Am pent", "B♭m pent": the minor pentatonic
  if (/^m pent$/i.test(rest)) return { root, scale: 'minorPent' };
  if (rest.startsWith(' ')) {
    const scale = SCALE_NAMES.get(rest.trim().toLowerCase());
    return scale ? { root, scale } : null;
  }
  const [sym, bass] = rest.split('/');
  const type = SYM_TO_TYPE.get(sym);
  if (!type) return null;
  let bassNote = null;
  if (bass != null) {
    const bm = bass.match(/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([♭♯]*)$/);
    if (!bm) return null;
    bassNote = noteOf(bm[1], bm[2]);
  }
  return { root, type, bass: bassNote };
}

/** Semitones above the root for the pad: the chord's own tones, or the scale's triad. */
function padSemis(badge) {
  if (badge.type === 'pow') return [0, 7, 12];
  if (badge.type) return T.CHORDS[badge.type].iv.filter((iv) => !/9|11|13/.test(iv)).slice(0, 4).map((iv) => T.semis(iv));
  const k = badge.scale;
  if (k === 'altered') return [0, 4, 10];                // the altered dominant: R 3 ♭7
  const ivs = T.SCALES[k].iv, labels = T.SCALES[k].labels || ivs;
  const has = (x) => ivs.includes(x) || labels.includes(x);
  const minorName = /minor|dorian|phrygian|aeolian|locrian|blues|min\. pent|minorPent/i.test(k + ' ' + T.SCALES[k].name) && !/major/i.test(T.SCALES[k].name);
  const third = has('3') && has('b3') ? (minorName ? 3 : 4) : has('3') ? 4 : has('b3') ? 3 : null;
  const fifth = has('5') ? 7 : has('b5') ? 6 : has('#5') ? 8 : null;
  // no 3rd and no 5th (some symmetric scales): root and octave only
  return [0, third, fifth].filter((x) => x != null).concat(third == null && fifth == null ? [12] : []);
}

/**
 * For each step that starts a new harmony, the MIDI notes of the pad (null elsewhere).
 * mode: 'drone' (root, 5th and octave) or 'chords' (the chord, or the scale's triad).
 */
/** Modules whose exercises have no backing: hands, time, note-finding, intervals and ear training. */
export const NO_BACKING = ['technique', 'rhythm', 'fretboard', 'intervals', 'ear'];

export function harmonyTrack(inst, mode) {
  const out = new Array(inst.steps.length).fill(null);
  if (mode !== 'drone' && mode !== 'chords') return out;
  let i = 0;
  while (i < inst.steps.length) {
    let j = i + 1;
    while (j < inst.steps.length && !inst.steps[j].chord) j++;
    const st = inst.steps[i];
    const badge = parseBadge(st.chord) || parseBadge(st.text);
    if (badge) {
      const semis = padSemis(badge);
      // the pad sits above the bass: root between A2 and G♯3 (a slash chord adds its bass below)
      const root = 45 + T.mod(T.pc(badge.root) - 45, 12);
      const fifth = semis.includes(7) ? 7 : semis.includes(6) ? 6 : semis.includes(8) ? 8 : null;
      let notes = mode === 'drone' ? [root, ...(fifth != null ? [root + fifth] : []), root + 12] : semis.map((x) => root + x);
      if (badge.bass) {
        const b = 33 + T.mod(T.pc(badge.bass) - 33, 12);
        notes = mode === 'drone' ? [b, b + 7, b + 12] : [b, ...notes];
      }
      out[i] = notes;
    }
    i = j;
  }
  return out;
}

/** The harmony sounding at step i (the last one set at or before it). */
export function harmonyAt(track, i) {
  for (let k = i; k >= 0; k--) if (track[k]) return track[k];
  return null;
}
