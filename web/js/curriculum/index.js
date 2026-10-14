// Curriculum registry: modules, levels and every exercise template.
import fretboard from './fretboardNotes.js';
import technique from './technique.js';
import rhythm from './rhythm.js';
import intervals from './intervals.js';
import scales from './scales.js';
import modes from './modes.js';
import triads from './triads.js';
import arpeggios from './arpeggios.js';
import harmony from './harmony.js';
import grooves from './grooves.js';

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
  { id: 'rhythm', name: 'Rhythm & Time', icon: '⏱', desc: 'Subdivisions, syncopation, odd groupings, odd meters.' },
  { id: 'intervals', name: 'Intervals', icon: '↕', desc: 'Every interval shape, diatonic intervals, 10ths.' },
  { id: 'scales', name: 'Scales', icon: '🎼', desc: 'Major, minor, pentatonic, sequences, positions, symmetric.' },
  { id: 'modes', name: 'Modes', icon: '🌗', desc: 'Relative and parallel modes, melodic & harmonic minor modes.' },
  { id: 'triads', name: 'Triads', icon: '🔺', desc: 'From the first shape to triad pairs and rudiments.' },
  { id: 'arpeggios', name: 'Arpeggios & 7ths', icon: '🪜', desc: '7th chords, inversions, ii–V–I, extensions, Giant Steps.' },
  { id: 'harmony', name: 'Chords & Harmony', icon: '🎹', desc: 'How chords work, progressions, double stops, shells.' },
  { id: 'grooves', name: 'Grooves & Bass Lines', icon: '🥁', desc: 'Rock, blues, Motown, funk, reggae, Latin, odd meters.' },
  { id: 'walking', name: 'Walking Bass', icon: '🚶', desc: 'Two-feel to bebop: chord tones, approaches, enclosures.' },
  { id: 'slap', name: 'Slap & Pop', icon: '👍', desc: 'Thumb, pop, hammer, ghost notes, double thumb.' },
];

const ALL = [...fretboard, ...technique, ...rhythm, ...intervals, ...scales, ...modes, ...triads, ...arpeggios, ...harmony, ...grooves];
{
  const seen = new Set();
  for (const t of ALL) {
    if (seen.has(t.id)) console.warn('duplicate exercise id', t.id);
    seen.add(t.id);
  }
}

export const EXERCISES = ALL;
export const byId = new Map(ALL.map((e) => [e.id, e]));
export const byModule = (id) => ALL.filter((e) => e.module === id).sort((a, b) => a.level - b.level);
export const byLevel = (n) => ALL.filter((e) => e.level === n);
export const moduleOf = (id) => MODULES.find((m) => m.id === id);

/** Default param values of a template. */
export function defaultParams(t) {
  const out = {};
  for (const [k, v] of Object.entries(t.params || {})) out[k] = v.default;
  return out;
}
