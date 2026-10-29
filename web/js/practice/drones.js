// The drone's chord (user, 2026-10-29: "a button beside the key note that opens a picker with all the qualities
// and some voicing variations; advanced ones Pro"): the drone is the key's root and 5th, held (the default, as
// before), or a chord on that root, to hear a scale's colour against it. One card of the shared picker
// (ui/picker.js) per item, by group. `type`: a chord of theory.js, voiced as the progressions' chords are (its
// root between E3 and D♯4, five notes at most); or a voicing of its own: `iv` (its tones as intervals, for the
// Neck), `at` (each note's semitones above the root, in the order it is stacked), `deg` (how its card writes it)
// and `like` (the chord it is named as). `free: true`: free; the others are Pro (pro.js droneLock). A card added
// here shows in the picker, marked new, with nothing else to change (the self-test checks every one).
import * as T from '../theory.js';
import { chordMidis, LOW } from './harmony.js';

export const DRONE_GROUPS = [
  ['open', 'Root and 5th'], ['triads', 'Triads'], ['sevenths', '7th chords'], ['added', '6ths and added notes'],
  ['extended', '9ths, 11ths, 13ths'], ['altered', 'Altered dominants'], ['voicings', 'Voicings'],
];

const chords = (group, types, free = false) => types.map((type) => [type, { group, type, ...(free ? { free: true } : {}) }]);

export const DRONES = Object.fromEntries([
  // the drone as it always was: root, 5th and octave (no 3rd, so every scale on the root fits it); or the root alone
  ['open', { group: 'open', name: 'Root and 5th', sym: '5', iv: ['1', '5'], at: [0, 7, 12], deg: ['R', '5', '8'], free: true }],
  ['root', { group: 'open', name: 'Root alone', sym: ' (root)', iv: ['1'], at: [0, 12], deg: ['R', '8'], free: true }],
  ...chords('triads', ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'], true),
  ...chords('sevenths', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'], true),
  ...chords('sevenths', ['mMaj7', 'maj7s5', 'dom7sus4', 'maj7sus4']),
  ...chords('added', ['maj6', 'min6', 'add9', 'maj69', 'min69']),
  ...chords('extended', ['maj9', 'dom9', 'min9', 'dom11', 'min11', 'dom13', 'min13']),
  ...chords('altered', ['dom7b9', 'dom7s9', 'dom7s11', 'dom7b13', 'dom7b5', 'dom7s5', 'dom7susb9', 'dom7alt']),
  // voicings: the same chords spread over the strings as a bass player or a pianist plays them
  ['spread', { group: 'voicings', name: 'Major, spread', like: 'maj', sym: ' (R 5 10)', iv: ['1', '5', '3'], at: [0, 7, 16], deg: ['R', '5', '10'] }],
  ['spreadMin', { group: 'voicings', name: 'Minor, spread', like: 'min', sym: 'm (R 5 ♭10)', iv: ['1', '5', 'b3'], at: [0, 7, 15], deg: ['R', '5', '♭10'] }],
  ['shellMaj7', { group: 'voicings', name: 'maj7 shell', like: 'maj7', sym: 'maj7 (shell)', iv: ['1', '7', '3'], at: [0, 11, 16], deg: ['R', '7', '10'] }],
  ['shell7', { group: 'voicings', name: '7 shell', like: 'dom7', sym: '7 (shell)', iv: ['1', 'b7', '3'], at: [0, 10, 16], deg: ['R', '♭7', '10'] }],
  ['shellMin7', { group: 'voicings', name: 'm7 shell', like: 'min7', sym: 'm7 (shell)', iv: ['1', 'b7', 'b3'], at: [0, 10, 15], deg: ['R', '♭7', '♭10'] }],
  ['quartal', { group: 'voicings', name: 'In 4ths', like: 'min7', sym: 'm11 (4ths)', iv: ['1', '11', 'b7', 'b3'], at: [0, 5, 10, 15], deg: ['R', '4', '♭7', '♭10'] }],
  ['quartal3', { group: 'voicings', name: '4ths and a 3rd', like: 'min7', sym: 'm11 (4ths + 3rd)', iv: ['1', '11', 'b7', 'b3', '5'], at: [0, 5, 10, 15, 19], deg: ['R', '4', '♭7', '♭10', '5'] }],
]);
export const DRONE_KEYS = Object.keys(DRONES);

/** The intervals a drone's root is named by: its chord's (a minor chord's root takes sharps: C♯m). */
const namingIvs = (d) => T.CHORDS[d.type || d.like]?.iv || T.SCALES.ionian.iv;
/** The drone's root on a key, spelled as its chord names it (D♭, C♯m). */
export const droneRoot = (keyPc, key) => T.bestRoot(keyPc, namingIvs(DRONES[key] || DRONES.open));
/** The drone as a lead sheet names it: "A5", "C♯m7", "D♭7♭9", "A (root)". */
export function droneName(keyPc, key, notation) {
  const d = DRONES[key] || DRONES.open;
  return T.noteName(droneRoot(keyPc, key), notation) + (d.type ? T.CHORDS[d.type].sym : d.sym);
}
/** A card's name: the chord's ("Minor 7th") or the voicing's. */
export const droneTitle = (key) => { const d = DRONES[key]; return d.type ? T.CHORDS[d.type].name : d.name; };
/** Its tones as its card writes them: "R ♭3 5 ♭7", "R 5 10". */
export const droneFormula = (key) => { const d = DRONES[key]; return (d.deg || T.CHORDS[d.type].iv.map(T.fmtDeg)).join(' '); };
/** Its tones as intervals, for the Neck's Chord view. */
export const droneIvs = (key) => { const d = DRONES[key] || DRONES.open; return d.type ? T.CHORDS[d.type].iv : d.iv; };

/** The drone's notes on a key: its root between E3 and D♯4, the chord or the voicing above it. */
export function droneMidis(keyPc, key = 'open') {
  const d = DRONES[key] || DRONES.open;
  if (d.type) return chordMidis(droneRoot(keyPc, key), d.type);
  const r = LOW + T.mod(keyPc - LOW, 12);
  return d.at.map((s) => r + s);
}
