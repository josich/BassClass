// The drone's chord (user, 2026-10-29: "a button beside the key note that opens a picker with all the qualities
// and some voicing variations; advanced ones Pro"): the drone is the key's root and 5th, held (the default, as
// before), or a chord on that root, to hear a scale's colour against it. One card of the shared picker
// (ui/picker.js) per item, by group. `type`: a chord of theory.js, voiced as the progressions' chords are (its
// root between E3 and D♯4, five notes at most); or a voicing of its own: `iv` (its tones as intervals, for the
// Neck), `at` (each note's semitones above the root, in the order it is stacked), `deg` (how its card writes it)
// and `like` (the chord it is named as). `free: true`: free; the others are Pro (pro.js droneLock). A card added
// here shows in the picker, marked new, with nothing else to change (the self-test checks every one, and that
// every tone its name calls for sounds).
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
  ['root', { group: 'open', name: 'Root and octave', sym: ' (root)', iv: ['1'], at: [0, 12], deg: ['R', '8'], free: true }],
  ...chords('triads', ['maj', 'min', 'dim', 'aug', 'sus2', 'sus4'], true),
  ...chords('sevenths', ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'], true),
  ...chords('sevenths', ['mMaj7', 'maj7s5', 'dom7sus4', 'maj7sus4']),
  ...chords('added', ['maj6', 'min6', 'add9', 'maj69', 'min69']),
  ...chords('extended', ['maj9', 'dom9', 'min9']),
  // (the dominant 11th held as jazz players voice it, without its 3rd, which would clash a minor 9th under the
  // 11th: C B♭ D F, the 9sus4 sound; QA round 21)
  ['dom11', { group: 'extended', name: 'Dominant 11th', like: 'dom11', sym: '11', iv: ['1', 'b7', '9', '11'], at: [0, 10, 14, 17], deg: ['R', '♭7', '9', '11'] }],
  ...chords('extended', ['min11', 'dom13', 'min13']),
  ...chords('altered', ['dom7b9', 'dom7s9', 'dom7s11', 'dom7b13', 'dom7b5', 'dom7s5', 'dom7susb9', 'dom7alt']),
  // voicings: the same chords spread over the strings as a bass player or a pianist plays them; a card writes
  // its notes as they stack up from the root (R 5 10). The spread and shell voicings of the free chords are free
  // too (QA round 21, user's choice)
  ['spread', { group: 'voicings', name: 'Major, spread', like: 'maj', sym: ' (spread)', iv: ['1', '5', '3'], at: [0, 7, 16], deg: ['R', '5', '10'], free: true }],
  ['spreadMin', { group: 'voicings', name: 'Minor, spread', like: 'min', sym: 'm (spread)', iv: ['1', '5', 'b3'], at: [0, 7, 15], deg: ['R', '5', '♭10'], free: true }],
  ['shellMaj7', { group: 'voicings', name: 'Major 7th, shell', like: 'maj7', sym: 'maj7 (shell)', iv: ['1', '7', '3'], at: [0, 11, 16], deg: ['R', '7', '10'], free: true }],
  ['shell7', { group: 'voicings', name: 'Dominant 7th, shell', like: 'dom7', sym: '7 (shell)', iv: ['1', 'b7', '3'], at: [0, 10, 16], deg: ['R', '♭7', '10'], free: true }],
  ['shellMin7', { group: 'voicings', name: 'Minor 7th, shell', like: 'min7', sym: 'm7 (shell)', iv: ['1', 'b7', 'b3'], at: [0, 10, 15], deg: ['R', '♭7', '♭10'], free: true }],
  ['quartal', { group: 'voicings', name: 'In 4ths', like: 'min7', sym: 'm11 (4ths)', iv: ['1', '4', 'b7', 'b3'], at: [0, 5, 10, 15], deg: ['R', '4', '♭7', '♭10'] }],
  ['quartal3', { group: 'voicings', name: '4ths and a 3rd', like: 'min7', sym: 'm11 (4ths + 3rd)', iv: ['1', '4', 'b7', 'b3', '5'], at: [0, 5, 10, 15, 19], deg: ['R', '4', '♭7', '♭10', '12'] }],
]);
export const DRONE_KEYS = Object.keys(DRONES);

/** A drone on a minor-type chord (minor, half-diminished, diminished): its root is named as a minor key's. */
const minorType = (d) => (T.CHORDS[d.type || d.like]?.iv || []).includes('b3');
/**
 * The drone's root on a key, as a lead sheet names a chord chosen on its own (QA round 21): flats on the black
 * keys, a minor-type chord's as its minor key's (D♭7♭9, A♭7alt, C♯m7, B♭°7); never from its alterations, so one
 * key names every card alike.
 */
export const droneRoot = (keyPc, key) => T.bestRoot(keyPc, (minorType(DRONES[key] || DRONES.open) ? T.SCALES.aeolian : T.SCALES.ionian).iv);
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
/** What the Neck follows over it: a chord card as its chord (a dominant's alterations written plainly, as in
 * Chords mode: E7♯9's G, not F𝄪), a voicing by its tones. */
export function droneLead(keyPc, key, notation) {
  const d = DRONES[key] || DRONES.open;
  return { root: droneRoot(keyPc, key), ...(d.type ? { type: d.type } : { ivs: d.iv }), name: droneName(keyPc, key, notation) };
}
/** The tones its name calls for, which must sound (the self-test): a chord's, but the 5th its tensions take the
 * place of, and a 13th chord's 11th; a voicing's own. */
export function droneNeeds(key) {
  const d = DRONES[key];
  if (!d.type) return d.iv;
  const ivs = T.CHORDS[d.type].iv;
  return ivs.length > 4 ? ivs.filter((iv) => iv !== '5' && !(iv === '11' && ivs.includes('13'))) : ivs;
}

/** The drone's notes on a key: its root between E3 and D♯4, the chord or the voicing above it. */
export function droneMidis(keyPc, key = 'open') {
  const d = DRONES[key] || DRONES.open;
  if (d.type) return chordMidis(droneRoot(keyPc, key), d.type);
  const r = LOW + T.mod(keyPc - LOW, 12);
  return d.at.map((s) => r + s);
}
