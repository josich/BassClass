// Curriculum registry: modules, levels and every exercise template.
import fretboard from './fretboardNotes.js';
import technique from './technique.js';
import rhythm from './rhythm.js';
import intervals from './intervals.js';
import scales from './scales.js';
import pentatonics from './pentatonics.js';
import modes from './modes.js';
import triads from './triads.js';
import arpeggios from './arpeggios.js';
import harmony from './harmony.js';
import grooves from './grooves.js';
import licks from './licks.js';
import reading from './reading.js';
import ear from './ear.js';
import songs from './songs.js';
import { NUMBERS } from './numbers.js';

export const LEVELS = [
  { n: 1, name: 'Foundations', desc: 'Open strings, first notes, steady pulse, first shapes.' },
  { n: 2, name: 'Elementary', desc: 'Core shapes in every key, simple grooves, 8ths and triplets.' },
  { n: 3, name: 'Intermediate', desc: 'Harmony on the neck: diatonic chords, sequences, positions.' },
  { n: 4, name: 'Upper-intermediate', desc: 'Inversions, voice leading, modes, walking, two octaves.' },
  { n: 5, name: 'Advanced', desc: 'Approach notes, triad pairs, melodic minor, odd groupings.' },
  { n: 6, name: 'Mastery', desc: 'All keys, all inversions, Coltrane changes, pro-level stamina.' },
];

export const MODULES = [
  { id: 'fretboard', name: 'Fretboard & Notes', icon: '🧭', desc: 'Know every note on the neck.' },
  { id: 'technique', name: 'Technique & Rudiments', icon: '✋', desc: 'Permutations, spider, shifting, legato, dynamics.' },
  { id: 'rhythm', name: 'Rhythm & Time', icon: '⏱', desc: 'Subdivisions, syncopation, odd groupings, odd metres.' },
  { id: 'reading', name: 'Reading', icon: '📖', desc: 'Bass clef from the first position to every key, with key signatures.' },
  { id: 'intervals', name: 'Intervals', icon: '↕', desc: 'Every interval shape, diatonic intervals, 10ths.' },
  { id: 'ear', name: 'Ear training', icon: '👂', desc: 'Hear and name chord qualities, 7th chords and progressions.' },
  { id: 'scales', name: 'Scales', icon: '🎼', desc: 'Major, minor, pentatonic, the 3 fingerings, sequences, positions, symmetric, world scales, Messiaen.' },
  { id: 'modes', name: 'Modes', icon: '🌗', desc: 'Relative and parallel modes, chord-scales, superimposition; melodic minor, harmonic minor and harmonic major modes.' },
  { id: 'triads', name: 'Triads', icon: '🔺', desc: 'From the first shape to triad pairs, rudiments and upper structures.' },
  { id: 'arpeggios', name: 'Arpeggios & 7ths', icon: '🪜', desc: '7th chords, broken chords, inversions, ii–V–I, extensions, Giant Steps.' },
  { id: 'harmony', name: 'Chords & Harmony', icon: '🎹', desc: 'How chords work, progressions, double stops, shells.' },
  { id: 'grooves', name: 'Grooves & Bass Lines', icon: '🥁', desc: 'Rock, blues, Motown, funk, soul, reggae, Latin, country, afrobeat, pick playing, odd metres.' },
  { id: 'walking', name: 'Walking Bass', icon: '🚶', desc: 'Two-feel to bebop: chord tones, approaches, enclosures.' },
  { id: 'licks', name: 'Jazz Licks', icon: '🎷', desc: 'Advanced vocabulary: ii–V–I, minor, blues, bebop, modern, bass solos, motifs, implied changes.' },
  { id: 'slap', name: 'Slap & Pop', icon: '👍', desc: 'Thumb, pop, hammer, ghost notes, double thumb.' },
  { id: 'music', name: 'Make Music', icon: '🎵', desc: 'Original lines in the style of famous songs, from the first riff to a whole bass solo.' },
];

const ALL = [...fretboard, ...reading, ...technique, ...rhythm, ...intervals, ...ear, ...scales, ...pentatonics, ...modes, ...triads, ...arpeggios, ...harmony, ...grooves, ...licks, ...songs];
{
  const seen = new Set();
  for (const t of ALL) {
    if (seen.has(t.id)) console.warn('duplicate exercise id', t.id);
    seen.add(t.id);
  }
}

export const EXERCISES = ALL;
export const byId = new Map(ALL.map((e) => [e.id, e]));

/** Topic order inside a level: hands and time first, then the neck, then theory and music. */
export const PATH_ORDER = ['technique', 'rhythm', 'fretboard', 'reading', 'intervals', 'ear', 'scales', 'modes', 'triads', 'arpeggios', 'harmony', 'grooves', 'walking', 'licks', 'slap', 'music'];
export const topicRank = (id) => { const i = PATH_ORDER.indexOf(id); return i < 0 ? PATH_ORDER.length : i; };

// The Library's order (t.order): level, then topic (path order), then the order of the module's export list.
[...ALL].map((t, i) => ({ t, i }))
  .sort((a, b) => a.t.level - b.t.level || topicRank(a.t.module) - topicRank(b.t.module) || a.i - b.i)
  .forEach(({ t }, n) => { t.order = n; });
// Exercise numbers (t.num): fixed in numbers.js, the level then two digits (305 = Level 3, exercise 5), kept for
// good (user, 2026-10-28: "hotel numbering"). One not given a number yet gets the next free number of its level
// for now, and the self-test asks for it to be written in. Everything stored uses ids, never numbers.
{
  const taken = new Set(Object.values(NUMBERS));
  for (const t of [...ALL].sort((a, b) => a.order - b.order)) {
    t.num = NUMBERS[t.id] ?? null;
    if (t.num != null) continue;
    let n = t.level * 100 + 1;
    while (taken.has(n)) n++;
    taken.add(n);
    t.num = n;
    t.provisional = true;
  }
}
export const byNumber = new Map(ALL.map((e) => [e.num, e]));
export const byModule = (id) => ALL.filter((e) => e.module === id).sort((a, b) => a.order - b.order);
export const byLevel = (n) => ALL.filter((e) => e.level === n);
export const moduleOf = (id) => MODULES.find((m) => m.id === id);

/** Default param values of a template. */
export function defaultParams(t) {
  const out = {};
  for (const [k, v] of Object.entries(t.params || {})) out[k] = v.default;
  return out;
}
