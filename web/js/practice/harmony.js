// The Practice room's harmony: a drone on a key, or a chord progression to play over, as a soft pad (the
// same pad as an exercise's Backing). The progressions are the course's own (curriculum/common.js PROGS),
// spelled in the chosen key; each 4/4 bar of them becomes one bar of the room's metre, its chords sharing
// it out where they start (a half bar: 2 + 1 in 3/4, 3 + 2 in 5/4, on the metre's group nearest the half).
import * as T from '../theory.js';
import { PROGS, progChords, toTriad, modeFor } from '../curriculum/common.js';

// My progression (user, 2026-10-23: "keep it simple"): the player's own, one of it, up to 16 chords, each a
// degree of the key (so the Key transposes it), one of a few common qualities and a length in bars.
export const MINE = 'mine';
const DEG_IV = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
/** The degrees by semitones above the key. */
export const DEGREES = ['I', '♭II', 'II', '♭III', 'III', 'IV', '♯IV', 'V', '♭VI', 'VI', '♭VII', 'VII'];
/** The qualities offered, as lead sheets write them: triads, 7ths, 6ths, 9ths and 13ths, altered dominants. */
export const QUALITIES = [
  ['maj', 'maj'], ['min', 'm'], ['dim', '°'], ['aug', '+'], ['sus2', 'sus2'], ['sus4', 'sus4'],
  ['dom7', '7'], ['maj7', 'maj7'], ['min7', 'm7'], ['m7b5', 'm7♭5'], ['dim7', '°7'], ['mMaj7', 'm(maj7)'], ['dom7sus4', '7sus4'],
  ['maj6', '6'], ['min6', 'm6'], ['dom9', '9'], ['maj9', 'maj9'], ['min9', 'm9'], ['dom13', '13'],
  ['dom7b9', '7♭9'], ['dom7s9', '7♯9'], ['dom7s11', '7♯11'], ['dom7alt', '7alt'],
];
/** The lengths offered: [beats of 4/4, label in bars]. */
export const LENGTHS = [[2, '½'], [4, '1'], [8, '2'], [16, '4']];
// a degree's usual chord in a major key, and in a minor one (a chromatic one: its usual borrowing or dominant)
const USUAL = ['maj7', 'dom7', 'min7', 'maj7', 'min7', 'maj7', 'm7b5', 'dom7', 'maj7', 'min7', 'dom7', 'm7b5'];
const USUAL_MINOR = ['min7', 'dom7', 'm7b5', 'maj7', 'dom7', 'min7', 'm7b5', 'dom7', 'maj7', 'm7b5', 'dom7', 'dim7'];
export const usualQuality = (d, minor = false) => (minor ? USUAL_MINOR : USUAL)[d];
/** My progression to start with: I – vi – ii – V, a bar each (major). */
export const MINE_START = [{ d: 0, q: 'maj7', b: 4 }, { d: 9, q: 'min7', b: 4 }, { d: 2, q: 'min7', b: 4 }, { d: 7, q: 'dom7', b: 4 }];
const MINORISH = ['min', 'min7', 'min6', 'min9', 'mMaj7', 'm7b5', 'dim', 'dim7'];
const SUFFIX = {
  dim: '°', aug: '+', sus2: 'sus2', sus4: 'sus4', dom7: '7', maj7: 'maj7', min7: '7', m7b5: 'ø7', dim7: '°7', mMaj7: '(maj7)',
  dom7sus4: '7sus4', maj6: '6', min6: '6', dom9: '9', maj9: 'maj9', min9: '9', dom13: '13', dom7b9: '7♭9', dom7s9: '7♯9', dom7s11: '7♯11', dom7alt: '7alt',
};
/** A chord's numeral: ii, V7, ♭VII7, viiø, Isus2. */
export function roman(d, q) {
  return (MINORISH.includes(q) ? DEGREES[d].toLowerCase() : DEGREES[d]) + (SUFFIX[q] || '');
}
// ---- the Neck's Scale: a chord's scale in the room (the course's chord-scale rules, `modeFor`, plus the
// room's own for the chords the course does not have; QA round 16, user's choices)
const PLAIN_DOM = ['dom7', 'dom9', 'dom13', 'dom7sus4', 'sus4'];
const FAMILY = {
  dom: ['mixolydian', 'lydianDom', 'mixolydianB6', 'phrygianDom', 'dimHW', 'altered', 'wholeTone'],
  min: ['dorian', 'aeolian', 'phrygian', 'melodicMinor', 'harmonicMinor'],
  maj: ['ionian', 'lydian', 'lydianAug'],
  hdim: ['locrian', 'locrianN2'],
  dim7: ['dimWH'],
};
const familyOf = (t) => (t === 'dim7' ? 'dim7' : ['m7b5', 'dim'].includes(t) ? 'hdim' : MINORISH.includes(t) ? 'min'
  : t.startsWith('dom') || t.startsWith('sus') || t === 'aug' ? 'dom' : 'maj');
const holds = (mode, type) => {
  const scale = new Set(T.SCALES[mode].iv.map((iv) => T.mod(T.semis(iv), 12)));
  return T.CHORDS[type].iv.every((iv) => scale.has(T.mod(T.semis(iv), 12)));
};
/**
 * A chord's scale by its function in the key (`c` from `progression`, `next` the next chord that differs):
 * - a major chord borrowed from the parallel minor (♭II ♭III ♭VI ♭VII of a major key): Lydian;
 * - a major triad (6th, sus2) other than the key's own I and IV (minor: ♭III, ♭VI) acts as the dominant it
 *   is (A before Dm: Phrygian dominant, as A7); 9ths and 13ths take their 7th's scale, ° Locrian;
 * - a plain dominant that does not resolve down a 5th, off the key's I, IV, V (minor: IV, V, ♭VII), and not a
 *   one-chord vamp: Lydian ♭7 (Berklee: the tritone sub, the backdoor ♭VII7, the minor blues' ♭VI7);
 * - the scale holds every tone the chord names (Em9: Dorian, A9: Mixolydian, 7♯9: half-whole), else the
 *   next of its family that does (of the chord it acts as: A6 before Dm, Mixolydian);
 * - a modal tonic takes its mode (`all`, the progression's chords, tells it): i before a major IV Dorian,
 *   i before a major ♭II Phrygian, I before a ♭VII Mixolydian (its IV then Ionian: the tonic's notes), I
 *   before a major II Lydian (that II then Mixolydian) (QA round 17, user's choice).
 */
const PLAIN_MAJOR = ['maj', 'sus2', 'maj6'];
export function scaleFor(c, next, all = null) {
  const degOf = (x) => T.mod(T.pc(x.root) - c.key, 12);
  const deg = degOf(c);
  const majorish = ['maj', 'maj6', 'sus2', 'maj7', 'maj9'].includes(c.type);
  let mode, acts = c.type;
  const nextDeg = next ? degOf(next) : null;
  const nextMajor = next && !MINORISH.includes(next.type);
  // (a progression whose major I moves straight to a major chord on `d`: I – ♭VII Mixolydian, I – II Lydian)
  const twoChords = !!all && new Set(all.map((x) => x.sym)).size === 2;
  const tonicTo = (d, types) => (all || []).some((x, i) => {
    const y = all[(i + 1) % all.length];
    return x !== y && degOf(x) === 0 && !MINORISH.includes(x.type) && degOf(y) === d && types.includes(y.type);
  });
  if (deg === 0 && c.minorKey && familyOf(c.type) === 'min' && nextDeg === 5 && nextMajor) mode = 'dorian';
  else if (deg === 0 && familyOf(c.type) === 'min' && nextDeg === 1 && nextMajor) mode = 'phrygian';
  else if (deg === 0 && !c.minorKey && majorish && nextDeg === 10 && nextMajor) mode = 'mixolydian';
  // (the Lydian I – II only as a two-chord vamp: in I – II – IV – I the II is a passing dominant; QA round 18)
  else if (deg === 0 && !c.minorKey && majorish && nextDeg === 2 && PLAIN_MAJOR.includes(next.type) && twoChords) mode = 'lydian';
  else if (deg === 5 && !c.minorKey && majorish && tonicTo(10, ['maj', 'maj6', 'sus2', 'maj7', 'maj9', 'dom7'])) mode = 'ionian';
  else if (deg === 2 && !c.minorKey && PLAIN_MAJOR.includes(c.type) && twoChords && tonicTo(2, PLAIN_MAJOR)) mode = 'mixolydian';
  // (a major chord borrowed from the parallel minor, or a minor key's ♭II: Lydian)
  else if ((c.minorKey ? [1] : [1, 3, 8, 10]).includes(deg) && majorish) mode = 'lydian';
  else {
    const own = c.minorKey ? [3, 8].includes(deg) : [0, 5].includes(deg);
    const as = {
      dom9: 'dom7', dom13: 'dom7', min9: 'min7', maj9: 'maj7', sus4: 'dom7', dom7sus4: 'dom7', dim: 'm7b5', aug: 'dom7s5', min: 'min7',
      maj: own ? 'maj7' : 'dom7', sus2: own ? 'maj7' : 'dom7', maj6: own ? 'maj6' : 'dom7',
    }[c.type] || c.type;
    acts = as;
    mode = modeFor({ ...c, type: as }, next);
    const plainDom = PLAIN_DOM.includes(c.type) || (as === 'dom7' && !c.type.startsWith('dom7'));
    const resolves = next && T.mod(T.pc(next.root) - T.pc(c.root), 12) === 5;
    // (the key's own dominants: I, IV, V of a major key; V, ♭VII and Dorian's IV of a minor one)
    const ownDom = c.minorKey ? [5, 7, 10].includes(deg) : [0, 5, 7].includes(deg);
    if (plainDom && mode === 'mixolydian' && !resolves && !ownDom && !c.vamp) mode = 'lydianDom';
  }
  if (holds(mode, c.type)) return mode;
  return FAMILY[familyOf(acts)].find((m) => holds(m, c.type)) || FAMILY[familyOf(c.type)].find((m) => holds(m, c.type)) || mode;
}

/**
 * A preset copied into My progression: { minor, chords }, its chords by degree, quality and length (pop ones as
 * triads), a cycle's chords with their local key (`k`), the first 16 cut at a whole bar.
 */
export function mineFrom(key) {
  const prog = PROGS[key];
  const chords = prog.chords.slice(0, 16).map(([where, type, beats = 4, keyOff]) => {
    const t = prog.pop ? toTriad(type) : type;
    return {
      d: T.mod(typeof where === 'number' ? where : T.semis(where), 12),
      q: QUALITIES.some(([k]) => k === t) ? t : t.startsWith('dom') ? 'dom7' : MINORISH.includes(t) ? 'min7' : 'maj7',
      b: LENGTHS.reduce((best, [l]) => (Math.abs(l - beats) < Math.abs(best - beats) ? l : best), 4),
      ...(keyOff != null ? { k: T.mod(keyOff, 12) } : {}),
    };
  });
  // (cut at a whole bar: the copy of a long cycle does not end on half a ii – V)
  while (chords.length > 1 && chords.reduce((a, c) => a + c.b, 0) % 4) chords.pop();
  return { minor: !!prog.minor, chords };
}
/** My progression's length in bars, the last chord filling its bar: { bars, padded }. */
export function mineBars(list) {
  const beats = list.reduce((a, c) => a + c.b, 0);
  return { bars: Math.ceil(beats / 4), padded: beats % 4 !== 0 };
}

/** The progressions offered, by style. */
export const HARMONY_PROGS = [
  ['Mine', [MINE]],
  ['Pop & rock', ['I-V-vi-IV', 'I-vi-IV-V', 'vi-IV-I-V', 'I-IV-V-I', 'I-bVII-IV-I', 'canon']],
  ['Blues', ['blues', 'blues-quick', 'blues-8', 'minor-blues', 'jazz-blues']],
  ['Jazz', ['ii-V-I', 'minor-ii-V-i', 'I-vi-ii-V', 'iii-vi-ii-V', 'autumn', 'rhythm-A', 'rhythm-B', 'cycle-251', 'cycle-dom7', 'giant-steps']],
  ['Minor', ['i-bVII-bVI-V', 'i-iv-v-min', 'i-bVI-bIII-bVII']],
  ['Vamps', ['vamp-min', 'vamp-dom', 'vamp-dorian', 'vamp-mixo', 'vamp-iiV']],
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
export function progression(key, keyPc, beatsPerBar = 4, S = {}, groups = null, mine = null, mineMinor = false) {
  const bpb = beatsPerBar < 2 ? 4 : beatsPerBar;
  const cuts = groups ? groups.reduce((a, g) => [...a, a.at(-1) + g], [0]) : null;
  const at = (pos) => {
    const bar = Math.floor(pos / 4), exact = ((pos - bar * 4) * bpb) / 4;
    const beat = cuts ? cuts.reduce((b, c) => (Math.abs(c - exact) < Math.abs(b - exact) ? c : b), 0) : Math.round(exact);
    return bar * bpb + beat;
  };
  let pos = 0;
  // (My progression: its key major or minor, a chord with a local key spelled from it, and the last chord
  // filling its bar, so the loop keeps the bar lines)
  let prog = key;
  if (key === MINE) {
    const list = mine || [];
    const pad = (4 - (list.reduce((a, c) => a + c.b, 0) % 4)) % 4;
    prog = { minor: mineMinor, chords: list.map((c, i) => [c.k != null ? c.d : DEG_IV[c.d], c.q, c.b + (i === list.length - 1 ? pad : 0), c.k]) };
  }
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
