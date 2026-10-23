// The Practice room's harmony: a drone on a key, or a chord progression to play over, as a soft pad (the
// same pad as an exercise's Backing). The progressions are the course's own (curriculum/common.js PROGS),
// spelled in the chosen key; each 4/4 bar of them becomes one bar of the room's metre, its chords sharing
// it out where they start (a half bar: 2 + 1 in 3/4, 3 + 2 in 5/4, on the metre's group nearest the half).
import * as T from '../theory.js';
import { PROGS, progChords, toTriad } from '../curriculum/common.js';

// My progression (user, 2026-10-23: "keep it simple"): the player's own, one of it, up to 16 chords, each a
// degree of the key (so the Key transposes it), one of a few common qualities and a length in bars.
export const MINE = 'mine';
const DEG_IV = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
/** The degrees by semitones above the key. */
export const DEGREES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
/** The qualities offered, as lead sheets write them: triads, 7ths, 6ths, 9ths and 13ths, altered dominants. */
export const QUALITIES = [
  ['maj', 'maj'], ['min', 'm'], ['dim', '°'], ['aug', '+'], ['sus2', 'sus2'], ['sus4', 'sus4'],
  ['dom7', '7'], ['maj7', 'maj7'], ['min7', 'm7'], ['m7b5', 'ø7'], ['dim7', '°7'], ['mMaj7', 'm(maj7)'], ['dom7sus4', '7sus4'],
  ['maj6', '6'], ['min6', 'm6'], ['dom9', '9'], ['maj9', 'maj9'], ['min9', 'm9'], ['dom13', '13'],
  ['dom7b9', '7♭9'], ['dom7s9', '7♯9'], ['dom7s11', '7♯11'], ['dom7alt', '7alt'],
];
/** The lengths offered: [beats of 4/4, label in bars]. */
export const LENGTHS = [[2, '½'], [4, '1'], [8, '2'], [16, '4']];
// a degree's usual chord in a major key (a chromatic one: its usual borrowing or secondary dominant)
const USUAL = ['maj7', 'dom7', 'min7', 'maj7', 'min7', 'maj7', 'm7b5', 'dom7', 'maj7', 'min7', 'dom7', 'm7b5'];
export const usualQuality = (d) => USUAL[d];
const MINORISH = ['min', 'min7', 'min6', 'min9', 'mMaj7', 'm7b5', 'dim', 'dim7'];
const SUFFIX = {
  dim: '°', aug: '+', sus2: 'sus2', sus4: 'sus4', dom7: '7', maj7: 'maj7', min7: '7', m7b5: 'ø', dim7: '°7', mMaj7: '(maj7)',
  dom7sus4: '7sus4', maj6: '6', min6: '6', dom9: '9', maj9: 'maj9', min9: '9', dom13: '13', dom7b9: '7♭9', dom7s9: '7♯9', dom7s11: '7♯11', dom7alt: '7alt',
};
/** A chord's numeral: ii, V7, ♭VII7, viiø, Isus2. */
export function roman(d, q) {
  return (MINORISH.includes(q) ? DEGREES[d].toLowerCase() : DEGREES[d]) + (SUFFIX[q] || '');
}
/** A preset copied into My progression: its chords by degree, quality and length (the first 16; pop ones as triads). */
export function mineFrom(key) {
  const prog = PROGS[key];
  return prog.chords.slice(0, 16).map(([where, type, beats = 4]) => {
    const t = prog.pop ? toTriad(type) : type;
    return {
      d: T.mod(typeof where === 'number' ? where : T.semis(where), 12),
      q: QUALITIES.some(([k]) => k === t) ? t : t.startsWith('dom') ? 'dom7' : MINORISH.includes(t) ? 'min7' : 'maj7',
      b: LENGTHS.reduce((best, [l]) => (Math.abs(l - beats) < Math.abs(best - beats) ? l : best), 4),
    };
  });
}

/** The progressions offered, by style. */
export const HARMONY_PROGS = [
  ['Mine', [MINE]],
  ['Pop & rock', ['I-V-vi-IV', 'I-vi-IV-V', 'vi-IV-I-V', 'I-IV-V-I', 'I-bVII-IV-I', 'canon']],
  ['Blues', ['blues', 'blues-quick', 'minor-blues', 'jazz-blues']],
  ['Jazz', ['ii-V-I', 'minor-ii-V-i', 'I-vi-ii-V', 'iii-vi-ii-V', 'autumn', 'rhythm-A', 'cycle-251', 'cycle-dom7']],
  ['Minor', ['i-bVII-bVI-V', 'i-iv-v-min', 'i-bVI-bIII-bVII']],
  ['Vamps', ['vamp-min', 'vamp-dom']],
];
export const PROG_KEYS = HARMONY_PROGS.flatMap(([, keys]) => keys);
export const progName = (key) => (key === MINE ? 'My progression' : PROGS[key]?.name || key);
/** A progression in a minor key (its key is named as a minor key). */
export const isMinor = (key) => !!PROGS[key]?.minor;

// The room's pad sits above the bass, in a guitar's or keys' register, where a phone's speaker sounds and the
// player's own bass stays clear (user, 2026-10-23: the chords were too quiet under a real bass): its root
// between E3 and D♯4.
const LOW = 52;
/** The pad's notes for a chord: its root between E3 and D♯4, its tones above it; with a 9th, 11th or 13th the
 * plain 5th makes room for them (R 3 ♭7 9), five notes at most. */
function chordMidis(root, type) {
  const r = LOW + T.mod(T.pc(root) - LOW, 12);
  let ivs = T.CHORDS[type].iv;
  if (ivs.length > 4) ivs = ivs.filter((iv) => iv !== '5');
  return ivs.slice(0, 5).map((iv) => r + T.semis(iv));
}

/** The drone on a key: root (E3 to D♯4), 5th and octave. */
export function droneMidis(keyPc) {
  const r = LOW + T.mod(keyPc - LOW, 12);
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
export function progression(key, keyPc, beatsPerBar = 4, S = {}, groups = null, mine = null) {
  const bpb = beatsPerBar < 2 ? 4 : beatsPerBar;
  const cuts = groups ? groups.reduce((a, g) => [...a, a.at(-1) + g], [0]) : null;
  const at = (pos) => {
    const bar = Math.floor(pos / 4), exact = ((pos - bar * 4) * bpb) / 4;
    const beat = cuts ? cuts.reduce((b, c) => (Math.abs(c - exact) < Math.abs(b - exact) ? c : b), 0) : Math.round(exact);
    return bar * bpb + beat;
  };
  let pos = 0;
  const prog = key === MINE ? { chords: (mine || []).map((c) => [DEG_IV[c.d], c.q, c.b]) } : key;
  return progChords(prog, keyPc, { S }).map((c) => {
    const from = at(pos);
    pos += c.beats;
    return {
      sym: c.sym, root: c.root, type: c.type, key: c.key, minorKey: c.minorKey, vamp: c.vamp,
      beats: Math.max(1, at(pos) - from),
      midis: chordMidis(c.root, c.type),
    };
  });
}
