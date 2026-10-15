// Backing harmony: what a drone or chord pad should play under each part of an exercise,
// read from the chord badges ("Cmaj7", "D Dorian", "F♯m7♭5", "C♯ Dorian (= D♭)") and, for
// scale and mode badges, from the degrees the notes are labelled with.
import * as T from './theory.js';

const SOLFEGE = { Do: 'C', Re: 'D', Mi: 'E', Fa: 'F', Sol: 'G', La: 'A', Si: 'B' };
const SYM_TO_TYPE = new Map();
for (const [type, c] of Object.entries(T.CHORDS)) if (!SYM_TO_TYPE.has(c.sym)) SYM_TO_TYPE.set(c.sym, type);

/** Root and chord type (or "scale") of a badge, or null when it names no note ("Pos 3", "#4"). */
export function parseBadge(label) {
  if (!label) return null;
  const s = String(label).replace(/\s*\(=[^)]*\)\s*$/, '').trim();
  const m = s.match(/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])([♭♯]*)(.*)$/);
  if (!m) return null;
  const root = T.N((SOLFEGE[m[1]] || m[1]) + m[2].replace(/♭/g, 'b').replace(/♯/g, '#'));
  const rest = m[3];
  if (rest.startsWith(' ')) return { root, scale: rest.trim() };
  const type = SYM_TO_TYPE.get(rest.split('/')[0]);
  return type ? { root, type } : { root, scale: rest };
}

/** Triad (or the chord's own tones) for a segment, as intervals from the root. */
function segmentIvs(badge, degs) {
  if (badge.type) return T.CHORDS[badge.type].iv.filter((iv) => !/9|11|13/.test(iv)).slice(0, 4);
  // a scale or mode: its 3rd and 5th, read from the note labels of the segment
  const has = (d) => degs.has(d);
  const third = has('♭3') && !has('3') ? 'b3' : '3';
  const fifth = has('5') ? '5' : has('♭5') ? 'b5' : has('♯5') ? '#5' : '5';
  return ['1', third, fifth];
}

/**
 * For each step that starts a new harmony, the MIDI notes of the pad (null elsewhere).
 * mode: 'drone' (root, 5th and octave) or 'chords' (the chord or the mode's triad).
 */
export function harmonyTrack(inst, mode) {
  const out = new Array(inst.steps.length).fill(null);
  if (mode !== 'drone' && mode !== 'chords') return out;
  let i = 0;
  while (i < inst.steps.length) {
    // a segment runs from one badge to the next
    let j = i + 1;
    while (j < inst.steps.length && !inst.steps[j].chord) j++;
    const st = inst.steps[i];
    const badge = parseBadge(st.chord) || parseBadge(st.text);
    if (badge) {
      const degs = new Set();
      for (let k = i; k < j; k++) for (const n of inst.steps[k].notes) if (n.deg) degs.add(n.deg);
      const ivs = segmentIvs(badge, degs);
      // the pad sits above the bass: root between A2 and G♯3
      const root = 45 + T.mod(T.pc(badge.root) - 45, 12);
      out[i] = mode === 'drone'
        ? [root, root + (ivs.includes('b5') ? 6 : ivs.includes('#5') ? 8 : 7), root + 12]
        : ivs.map((iv) => root + T.semis(iv));
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
