// The Practice room's harmony: a drone on a key, or a chord progression to play over, as a soft pad (the
// same pad as an exercise's Backing). The progressions are the course's own (curriculum/common.js PROGS),
// spelled in the chosen key; each 4/4 bar of them becomes one bar of the room's metre, its chords sharing
// it out where they start (a half bar: 2 + 1 in 3/4, 3 + 2 in 5/4, on the metre's group nearest the half).
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
/** A progression in a minor key (its key is named as a minor key). */
export const isMinor = (key) => !!PROGS[key]?.minor;

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

/** The key's name, as a lead sheet writes it: flats on the black keys, a minor key as its chords spell it (C♯m). */
export const keyName = (pc, notation, minor = false) => (minor
  ? `${T.noteName(T.bestRoot(pc, T.SCALES.aeolian.iv), notation)}m`
  : T.noteName(T.bestRoot(pc, T.SCALES.ionian.iv), notation));

/**
 * A progression in a key: [{ sym, root, type, beats, midis, key, minorKey, vamp }], each 4/4 bar becoming
 * a bar of `beatsPerBar`: a chord starts at its place in the bar scaled to the metre, on the nearest of the
 * metre's `groups` starts when it has groups (7/8 2 + 2 + 3: 4 + 3), so every bar keeps its length. A
 * 1-beat "bar" is a pulse: there each 4/4 beat is one beat.
 */
export function progression(key, keyPc, beatsPerBar = 4, S = {}, groups = null) {
  const bpb = beatsPerBar < 2 ? 4 : beatsPerBar;
  const cuts = groups ? groups.reduce((a, g) => [...a, a.at(-1) + g], [0]) : null;
  const at = (pos) => {
    const bar = Math.floor(pos / 4), exact = ((pos - bar * 4) * bpb) / 4;
    const beat = cuts ? cuts.reduce((b, c) => (Math.abs(c - exact) < Math.abs(b - exact) ? c : b), 0) : Math.round(exact);
    return bar * bpb + beat;
  };
  let pos = 0;
  return progChords(key, keyPc, { S }).map((c) => {
    const from = at(pos);
    pos += c.beats;
    return {
      sym: c.sym, root: c.root, type: c.type, key: c.key, minorKey: c.minorKey, vamp: c.vamp,
      beats: Math.max(1, at(pos) - from),
      midis: chordMidis(c.root, c.type),
    };
  });
}
