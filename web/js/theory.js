// Music theory core: correctly spelled notes, intervals, scales, chords, keys.
// A spelled note is { l: letter index 0..6 (C..B), a: accidental -2..2 }.
// A pitch is { n: spelled note, midi, deg: degree label relative to some root }.

export const mod = (n, m) => ((n % m) + m) % m;

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SOLFEGE = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
const LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
const ACC = { '-2': '♭♭', '-1': '♭', '0': '', '1': '♯', '2': '♯♯' };

/** Parse 'C', 'Bb', 'F#', 'Ebb', 'G##' into a spelled note. */
export function N(str) {
  const l = LETTERS.indexOf(str[0].toUpperCase());
  let a = 0;
  for (const ch of str.slice(1)) {
    if (ch === '#' || ch === '♯') a++;
    else if (ch === 'b' || ch === '♭') a--;
  }
  return { l, a };
}

export const pc = (n) => mod(LETTER_PC[n.l] + n.a, 12);
export const same = (x, y) => x.l === y.l && x.a === y.a;

export function noteName(n, notation = 'letters') {
  const base = notation === 'solfege' ? SOLFEGE[n.l] : LETTERS[n.l];
  return base + ACC[n.a];
}

// ---------------------------------------------------------------- intervals
// name -> [diatonic steps, semitones]
export const IV = {
  '1': [0, 0], '#1': [0, 1], 'b2': [1, 1], '2': [1, 2], '#2': [1, 3],
  'bb3': [2, 2], 'b3': [2, 3], '3': [2, 4], '#3': [2, 5],
  'b4': [3, 4], '4': [3, 5], '#4': [3, 6],
  'bb5': [4, 5], 'b5': [4, 6], '5': [4, 7], '#5': [4, 8],
  'b6': [5, 8], '6': [5, 9], '#6': [5, 10],
  'bb7': [6, 9], 'b7': [6, 10], '7': [6, 11],
  '8': [7, 12], 'b9': [8, 13], '9': [8, 14], '#9': [8, 15],
  'b10': [9, 15], '10': [9, 16], '11': [10, 17], '#11': [10, 18],
  '12': [11, 19], 'b13': [12, 20], '13': [12, 21],
};
export const semis = (iv) => IV[iv][1];

export const IV_NAMES = {
  '1': 'Unison', 'b2': 'Minor 2nd', '2': 'Major 2nd', 'b3': 'Minor 3rd', '3': 'Major 3rd',
  '4': 'Perfect 4th', '#4': 'Augmented 4th', 'b5': 'Diminished 5th (tritone)', '5': 'Perfect 5th',
  '#5': 'Augmented 5th', 'b6': 'Minor 6th', '6': 'Major 6th', 'b7': 'Minor 7th', '7': 'Major 7th',
  '8': 'Octave', 'b9': 'Minor 9th', '9': 'Major 9th', 'b10': 'Minor 10th', '10': 'Major 10th',
  '11': 'Perfect 11th', '12': 'Perfect 12th', 'b13': 'Minor 13th', '13': 'Major 13th',
};

/** Transpose a spelled note up by an interval name, keeping correct spelling. */
export function up(n, iv) {
  const [d, s] = IV[iv];
  const l = (n.l + d) % 7;
  let a = mod(pc(n) + s - LETTER_PC[l], 12);
  if (a > 6) a -= 12;
  return { l, a };
}

/** Simple (within-octave) interval name from root to note, e.g. 'R', 'b3', '#4'. */
export function ivBetween(root, n) {
  const d = mod(n.l - root.l, 7);
  const s = mod(pc(n) - pc(root), 12);
  for (const [k, [dd, ss]] of Object.entries(IV)) {
    if (dd === d && ss === s) return k;
  }
  return '?';
}

/** Display form of a degree label: '1' -> 'R', 'b3' -> '♭3'. */
export function fmtDeg(iv) {
  if (iv === '1' || iv === 'R' || iv === '8') return 'R';
  return iv.replace(/bb/g, '♭♭').replace(/b/g, '♭').replace(/#/g, '♯');
}

// ---------------------------------------------------------------- scales
export const SCALES = {
  ionian:       { name: 'Major (Ionian)', iv: ['1', '2', '3', '4', '5', '6', '7'] },
  dorian:       { name: 'Dorian', iv: ['1', '2', 'b3', '4', '5', '6', 'b7'] },
  phrygian:     { name: 'Phrygian', iv: ['1', 'b2', 'b3', '4', '5', 'b6', 'b7'] },
  lydian:       { name: 'Lydian', iv: ['1', '2', '3', '#4', '5', '6', '7'] },
  mixolydian:   { name: 'Mixolydian', iv: ['1', '2', '3', '4', '5', '6', 'b7'] },
  aeolian:      { name: 'Natural minor (Aeolian)', iv: ['1', '2', 'b3', '4', '5', 'b6', 'b7'] },
  locrian:      { name: 'Locrian', iv: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'b7'] },

  harmonicMinor:{ name: 'Harmonic minor', iv: ['1', '2', 'b3', '4', '5', 'b6', '7'] },
  locrianN6:    { name: 'Locrian ♮6', iv: ['1', 'b2', 'b3', '4', 'b5', '6', 'b7'] },
  ionianAug:    { name: 'Ionian ♯5', iv: ['1', '2', '3', '4', '#5', '6', '7'] },
  dorianS4:     { name: 'Ukrainian Dorian (Dorian ♯4)', iv: ['1', '2', 'b3', '#4', '5', '6', 'b7'] },
  phrygianDom:  { name: 'Phrygian dominant', iv: ['1', 'b2', '3', '4', '5', 'b6', 'b7'] },
  lydianS2:     { name: 'Lydian ♯2', iv: ['1', '#2', '3', '#4', '5', '6', '7'] },
  ultraLocrian: { name: 'Ultralocrian', iv: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'bb7'] },

  harmonicMajor:{ name: 'Harmonic major', iv: ['1', '2', '3', '4', '5', 'b6', '7'] },
  dorianB5:     { name: 'Dorian ♭5', iv: ['1', '2', 'b3', '4', 'b5', '6', 'b7'] },
  phrygianB4:   { name: 'Phrygian ♭4', iv: ['1', 'b2', 'b3', 'b4', '5', 'b6', 'b7'] },
  lydianB3:     { name: 'Lydian ♭3', iv: ['1', '2', 'b3', '#4', '5', '6', '7'] },
  mixolydianB2: { name: 'Mixolydian ♭2', iv: ['1', 'b2', '3', '4', '5', '6', 'b7'] },
  lydianAugS2:  { name: 'Lydian augmented ♯2', iv: ['1', '#2', '3', '#4', '#5', '6', '7'] },
  locrianBB7:   { name: 'Locrian ♭♭7', iv: ['1', 'b2', 'b3', '4', 'b5', 'b6', 'bb7'] },

  doubleHarmonic: { name: 'Double harmonic major', iv: ['1', 'b2', '3', '4', '5', 'b6', '7'] },
  hungarianMinor: { name: 'Hungarian minor', iv: ['1', '2', 'b3', '#4', '5', 'b6', '7'] },
  hungarianMajor: { name: 'Hungarian major', iv: ['1', '#2', '3', '#4', '5', '6', 'b7'] },
  augmented:    { name: 'Augmented', iv: ['1', 'b3', '3', '5', '#5', '7'] },

  melodicMinor: { name: 'Melodic minor (jazz)', iv: ['1', '2', 'b3', '4', '5', '6', '7'] },
  dorianB2:     { name: 'Dorian ♭2', iv: ['1', 'b2', 'b3', '4', '5', '6', 'b7'] },
  lydianAug:    { name: 'Lydian augmented', iv: ['1', '2', '3', '#4', '#5', '6', '7'] },
  lydianDom:    { name: 'Lydian dominant', iv: ['1', '2', '3', '#4', '5', '6', 'b7'] },
  mixolydianB6: { name: 'Mixolydian ♭6', iv: ['1', '2', '3', '4', '5', 'b6', 'b7'] },
  locrianN2:    { name: 'Locrian ♮2 (half-diminished)', iv: ['1', '2', 'b3', '4', 'b5', 'b6', 'b7'] },
  altered:      { name: 'Altered (super Locrian)', iv: ['1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7'],
                  labels: ['1', 'b9', '#9', '3', 'b5', '#5', 'b7'] },

  majorPent:    { name: 'Major pentatonic', iv: ['1', '2', '3', '5', '6'] },
  minorPent:    { name: 'Minor pentatonic', iv: ['1', 'b3', '4', '5', 'b7'] },
  blues:        { name: 'Blues', iv: ['1', 'b3', '4', 'b5', '5', 'b7'] },
  majorBlues:   { name: 'Major blues', iv: ['1', '2', 'b3', '3', '5', '6'] },
  bebopDom:     { name: 'Bebop dominant', iv: ['1', '2', '3', '4', '5', '6', 'b7', '7'] },
  bebopMajor:   { name: 'Bebop major', iv: ['1', '2', '3', '4', '5', '#5', '6', '7'] },
  bebopDorian:  { name: 'Bebop Dorian', iv: ['1', '2', 'b3', '3', '4', '5', '6', 'b7'] },
  sixthDim:     { name: 'Major 6th diminished (Barry Harris)', iv: ['1', '2', '3', '4', '5', 'b6', '6', '7'] },
  dimHW:        { name: 'Diminished half-whole', iv: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'] },
  dimWH:        { name: 'Diminished whole-half', iv: ['1', '2', 'b3', '4', 'b5', 'b6', '6', '7'] },
  wholeTone:    { name: 'Whole tone', iv: ['1', '2', '3', '#4', '#5', 'b7'] },
  // Olivier Messiaen's modes of limited transposition (1 = whole tone, 2 = half-whole diminished)
  messiaen1:    { name: 'Messiaen mode 1 (whole tone)', iv: ['1', '2', '3', '#4', '#5', 'b7'] },
  messiaen2:    { name: 'Messiaen mode 2 (diminished)', iv: ['1', 'b2', '#2', '3', '#4', '5', '6', 'b7'] },
  messiaen3:    { name: 'Messiaen mode 3 (9 notes)', iv: ['1', '2', 'b3', '3', '#4', '5', 'b6', 'b7', '7'] },
  messiaen4:    { name: 'Messiaen mode 4 (8 notes)', iv: ['1', 'b2', '2', '4', '#4', '5', 'b6', '7'] },
  messiaen5:    { name: 'Messiaen mode 5 (6 notes)', iv: ['1', 'b2', '4', '#4', '5', '7'] },
  messiaen6:    { name: 'Messiaen mode 6 (8 notes)', iv: ['1', '2', '3', '4', '#4', '#5', 'b7', '7'] },
  messiaen7:    { name: 'Messiaen mode 7 (10 notes)', iv: ['1', 'b2', '2', 'b3', '4', '#4', '5', 'b6', '6', '7'] },
  chromatic:    { name: 'Chromatic', iv: ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'] },
};

export const MAJOR_MODES = ['ionian', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian', 'locrian'];
export const MELODIC_MODES = ['melodicMinor', 'dorianB2', 'lydianAug', 'lydianDom', 'mixolydianB6', 'locrianN2', 'altered'];
export const HARMONIC_MODES = ['harmonicMinor', 'locrianN6', 'ionianAug', 'dorianS4', 'phrygianDom', 'lydianS2', 'ultraLocrian'];
export const HARMONIC_MAJOR_MODES = ['harmonicMajor', 'dorianB5', 'phrygianB4', 'lydianB3', 'mixolydianB2', 'lydianAugS2', 'locrianBB7'];

/** Degree label for the k-th note of a scale (uses the scale's display labels when given). */
export const scaleLabel = (type, k) => fmtDeg((SCALES[type].labels || SCALES[type].iv)[k]);

// ---------------------------------------------------------------- chords
export const CHORDS = {
  maj:    { iv: ['1', '3', '5'], sym: '', name: 'Major' },
  min:    { iv: ['1', 'b3', '5'], sym: 'm', name: 'Minor' },
  dim:    { iv: ['1', 'b3', 'b5'], sym: '°', name: 'Diminished' },
  aug:    { iv: ['1', '3', '#5'], sym: '+', name: 'Augmented' },
  sus2:   { iv: ['1', '2', '5'], sym: 'sus2', name: 'Suspended 2nd' },
  sus4:   { iv: ['1', '4', '5'], sym: 'sus4', name: 'Suspended 4th' },
  maj7:   { iv: ['1', '3', '5', '7'], sym: 'maj7', name: 'Major 7th' },
  dom7:   { iv: ['1', '3', '5', 'b7'], sym: '7', name: 'Dominant 7th' },
  min7:   { iv: ['1', 'b3', '5', 'b7'], sym: 'm7', name: 'Minor 7th' },
  m7b5:   { iv: ['1', 'b3', 'b5', 'b7'], sym: 'm7♭5', name: 'Half-diminished (m7♭5)' },
  dim7:   { iv: ['1', 'b3', 'b5', 'bb7'], sym: '°7', name: 'Diminished 7th' },
  mMaj7:  { iv: ['1', 'b3', '5', '7'], sym: 'm(maj7)', name: 'Minor-major 7th' },
  maj7s5: { iv: ['1', '3', '#5', '7'], sym: 'maj7♯5', name: 'Augmented major 7th' },
  dom7s5: { iv: ['1', '3', '#5', 'b7'], sym: '7♯5', name: 'Augmented 7th' },
  dom7sus4: { iv: ['1', '4', '5', 'b7'], sym: '7sus4', name: 'Dominant 7sus4' },
  maj6:   { iv: ['1', '3', '5', '6'], sym: '6', name: 'Major 6th' },
  min6:   { iv: ['1', 'b3', '5', '6'], sym: 'm6', name: 'Minor 6th' },
  maj9:   { iv: ['1', '3', '5', '7', '9'], sym: 'maj9', name: 'Major 9th' },
  dom9:   { iv: ['1', '3', '5', 'b7', '9'], sym: '9', name: 'Dominant 9th' },
  min9:   { iv: ['1', 'b3', '5', 'b7', '9'], sym: 'm9', name: 'Minor 9th' },
  dom7b9: { iv: ['1', '3', '5', 'b7', 'b9'], sym: '7♭9', name: 'Dominant 7♭9' },
  dom7s9: { iv: ['1', '3', '5', 'b7', '#9'], sym: '7♯9', name: 'Dominant 7♯9' },
  dom7b5: { iv: ['1', '3', 'b5', 'b7'], sym: '7♭5', name: 'Dominant 7♭5' },
  dom13: { iv: ['1', '3', '5', 'b7', '9', '13'], sym: '13', name: 'Dominant 13' },
};
export const TRIAD_TYPES = ['maj', 'min', 'dim', 'aug'];
export const SEVENTH_TYPES = ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'maj7s5'];

/** Identify a chord type from its simple interval names (relative to root). */
export function detectChord(ivs) {
  const key = ivs.map((x) => (x === 'R' ? '1' : x)).join(',');
  for (const [type, c] of Object.entries(CHORDS)) {
    if (c.iv.join(',') === key) return type;
  }
  return null;
}

export const chordSymbol = (root, type, notation) => noteName(root, notation) + (CHORDS[type]?.sym ?? '');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const ROMAN_SUFFIX = {
  maj: '', min: '', dim: '°', aug: '+', maj7: 'maj7', dom7: '7', min7: '7', m7b5: 'ø7',
  dim7: '°7', mMaj7: '(maj7)', maj7s5: '+maj7', dom7s5: '+7', sus2: 'sus2', sus4: 'sus4',
};
const LOWER = new Set(['min', 'dim', 'min7', 'm7b5', 'dim7', 'mMaj7', 'min6', 'min9']);

/** Roman numeral of chord type `type` on scale degree k (0-based), relative to a major-scale reference. */
export function roman(tonic, chordRoot, k, type) {
  const ref = pc(up(tonic, SCALES.ionian.iv[k]));
  let diff = mod(pc(chordRoot) - ref, 12);
  if (diff > 6) diff -= 12;
  const acc = diff < 0 ? '♭'.repeat(-diff) : '♯'.repeat(diff);
  let num = ROMAN[k];
  if (LOWER.has(type)) num = num.toLowerCase();
  return acc + num + (ROMAN_SUFFIX[type] ?? '');
}

/**
 * Harmonize a 7-note scale by stacking thirds.
 * Returns per degree: { k, root, ivs (chord intervals), type, roman }.
 */
export function harmonize(tonic, scaleType, size = 3) {
  const s = SCALES[scaleType].iv;
  const notes = s.map((iv) => up(tonic, iv));
  return notes.map((root, k) => {
    const ivs = [];
    for (let j = 0; j < size; j++) {
      const t = notes[(k + 2 * j) % s.length];
      let iv = ivBetween(root, t);
      if (j === 4) iv = { '2': '9', 'b2': 'b9', '#2': '#9' }[iv] || iv;
      if (j === 5) iv = { '4': '11', '#4': '#11', 'b4': '11' }[iv] || iv;
      if (j === 6) iv = { '6': '13', 'b6': 'b13' }[iv] || iv;
      ivs.push(iv);
    }
    const type = detectChord(ivs.slice(0, Math.min(size, 4)));
    return { k, root, ivs, type, roman: roman(tonic, root, k, type) };
  });
}

// ---------------------------------------------------------------- keys
export const CYCLE4_PC = [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7];
export const CYCLE5_PC = [0, 7, 2, 9, 4, 11, 6, 1, 8, 3, 10, 5];
export const CHROMATIC_PC = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];


/** Best spelling of a root pitch class for a given set of intervals (fewest accidentals). */
/** Roots no lead sheet uses: B♯, E♯, C♭, F♭ (and any double accidental). */
export const awkward = (n) => Math.abs(n.a) > 1 || (n.a === 1 && (n.l === 2 || n.l === 6)) || (n.a === -1 && (n.l === 0 || n.l === 3));

/** Plain enharmonic of a double-flat/sharp note (B♭♭ -> A, F𝄪 -> G); other notes are returned as they are. */
export function plain(n) {
  if (Math.abs(n.a) < 2) return n;
  const pcv = pc(n);
  let best = null;
  for (let l = 0; l < 7; l++) {
    let a = mod(pcv - LETTER_PC[l], 12);
    if (a > 6) a -= 12;
    if (Math.abs(a) > 1) continue;
    const score = Math.abs(a) * 2 + (a !== 0 && Math.sign(a) !== Math.sign(n.a) ? 1 : 0);
    if (!best || score < best.score) best = { score, n: { l, a } };
  }
  return best.n;
}

/** The easiest-to-read spelling of an awkward note (F♭ -> E, C♭ -> B, B𝄫 -> A); others unchanged. */
export function readable(n) {
  if (!awkward(n)) return n;
  const pcv = pc(n);
  let best = null;
  for (let l = 0; l < 7; l++) {
    let a = mod(pcv - LETTER_PC[l], 12);
    if (a > 6) a -= 12;
    if (Math.abs(a) > 1 || awkward({ l, a })) continue;
    const score = Math.abs(a) * 2 + (a !== 0 && Math.sign(a) !== Math.sign(n.a) ? 1 : 0);
    if (!best || score < best.score) best = { score, n: { l, a } };
  }
  return best ? best.n : plain(n);
}

/** Interval names by semitones above a root (how a chromatic chord is spelled from its key). */
export const IV_OF_SEMIS = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];

/**
 * Lead-sheet root for pitch class `pcv`: the spelling that keeps `ivs` simplest, never B♯, E♯,
 * C♭ or F♭ (C°, not B♯°; B Lydian, not C♭ Lydian). On black keys flats win (D♭7, B♭°, G♭maj7)
 * unless the sharp spelling is clearly simpler or the chord/scale is minor (C♯m, G♯m, F♯m).
 */
export function bestRoot(pcv, ivs = ['1', '3', '5']) {
  // a minor scale or chord with a raised 6th/7th is named after its key signature (natural minor):
  // G♯ harmonic minor (with F𝄪), not A♭ harmonic minor
  // (the augmented scale, with both 3rds, and Messiaen's 9- and 10-note modes are not minor scales;
  // bebop Dorian, with its passing 3 and a ♭7, is)
  const both3 = ivs.includes('3') && ivs.includes('b3');
  const minor = ivs.includes('b3') && ivs.includes('5') && ivs.length <= 8 && (!both3 || (ivs.includes('b7') && !ivs.includes('7')));
  if (minor && ivs.includes('7')) ivs = ivs.map((iv) => (iv === '7' ? 'b7' : iv === '6' ? 'b6' : iv));
  let best = null;
  for (let l = 0; l < 7; l++) {
    let a = mod(pcv - LETTER_PC[l], 12);
    if (a > 6) a -= 12;
    if (Math.abs(a) > 1) continue;
    const root = { l, a };
    if (awkward(root)) continue;
    let score = 0;
    for (const iv of ivs) {
      const t = up(root, iv);
      score += Math.abs(t.a) + (Math.abs(t.a) > 1 ? 4 : 0);
    }
    if (root.a === 1) score += minor ? 0.1 : 2;
    if (!best || score < best.score - 1e-9 || (Math.abs(score - best.score) < 1e-9 && root.a < best.root.a)) best = { root, score };
  }
  return best.root;
}

/** Root names for scales spelled plainly (symmetric, Messiaen): flats on the black keys. */
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const flatRoot = (pcv) => N(FLAT_NAMES[mod(pcv, 12)]);

export const KEY_OPTIONS = (ivs) =>
  CHROMATIC_PC.map((p) => ({ value: String(p), label: noteName(bestRoot(p, ivs)) }));

export const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

/** Lowest midi >= minMidi with pitch class of n. */
export function midiAtOrAbove(n, minMidi) {
  return minMidi + mod(pc(n) - minMidi, 12);
}

// ---------------------------------------------------------------- pitch helpers

/** k-th scale tone (k may exceed scale length / be negative) as a pitch. */
export function scalePitch(tonic, type, tonicMidi, k) {
  const s = SCALES[type];
  const len = s.iv.length;
  const o = Math.floor(k / len);
  const i = mod(k, len);
  const iv = s.iv[i];
  return { n: up(tonic, iv), midi: tonicMidi + semis(iv) + 12 * o, deg: scaleLabel(type, i), k: i };
}

/** Chord tones as pitches across registers: index 0 = root at rootMidi, then 3rd, 5th... wrapping up octaves. */
export function chordPitch(root, ivs, rootMidi, idx) {
  const len = ivs.length;
  const o = Math.floor(idx / len);
  const i = mod(idx, len);
  const iv = ivs[i];
  const s = semis(iv);
  // compound intervals (9, 11, 13) already sit above the octave; keep them there
  return { n: up(root, iv), midi: rootMidi + s + 12 * o, deg: fmtDeg(iv), ci: i };
}
