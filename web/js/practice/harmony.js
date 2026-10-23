// The Practice room's harmony: a drone on a key, or a chord progression to play over, as a soft pad (the
// same pad as an exercise's Backing). The progressions are the course's own (curriculum/common.js PROGS),
// spelled in the chosen key; each chord keeps its length, a 4/4 bar of it becoming one bar of the room's metre.
import * as T from '../theory.js';
import { PROGS, progChords } from '../curriculum/common.js';

/** The progressions offered, by style. */
export const HARMONY_PROGS = [
  ['Pop & rock', ['I-V-vi-IV', 'I-vi-IV-V', 'vi-IV-I-V', 'I-IV-V-I', 'I-bVII-IV-I', 'canon']],
  ['Blues', ['blues', 'blues-quick', 'minor-blues', 'jazz-blues']],
  ['Jazz', ['ii-V-I', 'minor-ii-V-i', 'I-vi-ii-V', 'iii-vi-ii-V', 'autumn', 'rhythm-A']],
  ['Minor', ['i-bVII-bVI-V', 'i-iv-v-min', 'i-bVI-bIII-bVII']],
  ['Vamps', ['vamp-min', 'vamp-dom']],
];
export const PROG_KEYS = HARMONY_PROGS.flatMap(([, keys]) => keys);
export const progName = (key) => PROGS[key]?.name || key;

/** The pad's notes for a chord: its root between A2 and G♯3, its tones up to the 7th above. */
function chordMidis(root, type) {
  const r = 45 + T.mod(T.pc(root) - 45, 12);
  return T.CHORDS[type].iv.filter((iv) => !/9|11|13/.test(iv)).slice(0, 4).map((iv) => r + T.semis(iv));
}

/** The drone on a key: root, 5th and octave. */
export function droneMidis(keyPc) {
  const r = 45 + T.mod(keyPc - 45, 12);
  return [r, r + 7, r + 12];
}

/** The key's name, as a lead sheet writes it (flats on the black keys). */
export const keyName = (pc, notation) => T.noteName(T.bestRoot(pc, T.SCALES.ionian.iv), notation);

/**
 * A progression in a key: [{ sym, root, type, beats, midis }], each chord's beats scaled from 4/4 to a
 * bar of `beatsPerBar` (a whole beat at least).
 */
export function progression(key, keyPc, beatsPerBar = 4, S = {}) {
  return progChords(key, keyPc, { S }).map((c) => ({
    sym: c.sym, root: c.root, type: c.type,
    beats: Math.max(1, Math.round((c.beats * beatsPerBar) / 4)),
    midis: chordMidis(c.root, c.type),
  }));
}
