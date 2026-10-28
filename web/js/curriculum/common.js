// Shared helpers for curriculum modules: params, key handling, zones, progressions,
// and the groove/walking line engines.
import * as T from '../theory.js';
import { shapes, place, candidates, handFingers, chordFingers } from '../fretboard.js';
import {
  Builder, keysFor, rootOn, scaleRun, scaleSeq, chordTones, ARP_SHAPES, BROKEN_SHAPES, SCALE_PATTERNS,
  diatonicChords, nearestVoicing, pitchIn, spellMidi, P, fitShift,
} from '../builder.js';

export {
  fitShift,
  T, Builder, keysFor, rootOn, scaleRun, scaleSeq, chordTones, ARP_SHAPES, BROKEN_SHAPES, SCALE_PATTERNS,
  diatonicChords, nearestVoicing, pitchIn, spellMidi, P, shapes, place,
};

// ------------------------------------------------------------------ params

export const CYCLE_OPTS = [
  ['cycle4', 'All 12 · cycle of 4ths'],
  ['cycle5', 'All 12 · cycle of 5ths'],
  ['chromatic', 'All 12 · chromatic'],
];

/** Key parameter: 12 roots spelled for `ivs` (+ optional all-keys cycles). */
export const keyP = (ivs = ['1', '3', '5'], { cycles = true, def = '0', label = 'Key', suffix = '' } = {}) =>
  ({ kind: 'key', label, ivs, cycles, default: def, suffix });
/** Key of a plain-spelled scale (symmetric, Messiaen): flats on the black keys. */
export const plainKeyP = (ivs, opts) => ({ ...keyP(ivs, opts), plain: true });

/** Select parameter from [[value, label], ...]. */
export const sel = (label, options, def) => ({ kind: 'select', label, options, default: def ?? options[0][0] });

export const nm = (n, S) => T.noteName(n, S.notation);

/** Roots of drills that travel round the cycle: the names the cycle is taught with (C F B♭ E♭ A♭ D♭ G♭ B E A D G). */
const CYCLE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export function cycleRoot(pcv, ivs = ['1', '3', '5']) {
  const r = T.N(CYCLE_NAMES[T.mod(pcv, 12)]);
  return ivs.some((iv) => Math.abs(T.up(r, iv).a) > 1) ? T.bestRoot(pcv, ivs) : r;
}
export const chordName = (root, type, S) => nm(root, S) + (T.CHORDS[type]?.sym ?? '');

export function keyLabel(v, ivs, S) {
  const c = CYCLE_OPTS.find((o) => o[0] === v);
  return c ? c[1] : nm(T.bestRoot(Number(v), ivs), S);
}

/** Template factory with defaults. */
export function ex(def) {
  return { bpm: 70, sub: 2, tips: [], params: {}, ...def };
}

/**
 * Variant of a template: new id/level/title, its own params (`params` replaces
 * or adds parameters), different defaults (`defaults`) or fewer options (`only`).
 */
export function variant(base, over) {
  const { defaults, only, params: extra, ...rest } = over;
  const src = { ...base.params, ...(extra || {}) };
  const params = {};
  for (const [k, v] of Object.entries(src)) {
    params[k] = { ...v };
    if (defaults && defaults[k] != null) params[k].default = defaults[k];
    if (only && only[k]) params[k].options = v.options.filter((o) => only[k].includes(o[0]));
  }
  return { ...base, star: false, ...rest, params };
}

export const QUALITY_TRIADS = [
  ['maj', 'Major'], ['min', 'Minor'], ['dim', 'Diminished'], ['aug', 'Augmented'], ['sus2', 'Sus2'], ['sus4', 'Sus4'],
];
export const QUALITY_7THS = [
  ['maj7', 'Major 7'], ['dom7', 'Dominant 7'], ['min7', 'Minor 7'], ['m7b5', 'Half-dim m7♭5'],
  ['dim7', 'Diminished 7'], ['mMaj7', 'Minor-major 7'], ['maj7s5', 'Augmented major 7 (maj7♯5)'], ['dom7s5', 'Augmented 7 (7♯5)'],
  ['maj6', 'Major 6'], ['min6', 'Minor 6'],
];
export const ZONES = { '1': [1, 5], '2': [5, 9], '3': [8, 12], '4': [12, 16] };
export const zoneP = sel('Zone', [
  ['1', 'Zone 1 · frets 1–5'], ['2', 'Zone 2 · frets 5–9'], ['3', 'Zone 3 · frets 8–12'], ['4', 'Zone 4 · frets 12–16'],
]);
// every string with room for the shape above it: the low B on a 5-string, also the G on a 6-string
export const rootStrP = (def = 'A') => sel('Root on', [['B', 'Low B string', { minStrings: 5 }], ['E', 'E string'], ['A', 'A string'], ['D', 'D string'], ['G', 'G string', { minStrings: 6 }]], def);
/** Root string for shapes that need two strings above the root (octaves, wide intervals, two octaves). */
export const rootStrLowP = (def = 'E') => sel('Root on', [['B', 'Low B string', { minStrings: 5 }], ['E', 'E string'], ['A', 'A string'], ['D', 'D string', { minStrings: 6 }]], def);
/** Any single string, for exercises along one string. */
export const oneStringP = (def = 'A') => sel('String', [['B', 'Low B string', { minStrings: 5 }], ['E', 'E string'], ['A', 'A string'], ['D', 'D string'], ['G', 'G string'], ['C', 'High C string', { minStrings: 6 }]], def);
export const octP = (def = '1') => sel('Range', [['1', '1 octave'], ['2', '2 octaves']], def);
export const dirP = sel('Direction', [['updown', 'Up & down'], ['up', 'Up'], ['down', 'Down']]);
export const orderP = sel('Key order', [['cycle4', 'Cycle of 4ths'], ['cycle5', 'Cycle of 5ths'], ['chromatic', 'Chromatic']]);

export const SCALE_TYPE_OPTS = (list) => list.map((k) => [k, T.SCALES[k].name]);

/**
 * The altered scale as jazz players write it over its dominant: G A♭ B♭ B D♭ E♭ F =
 * R ♭9 ♯9 3 ♭5 ♭13 ♭7 (the academic spelling would call B a "C♭" and label it a 4th).
 */
const ALTERED_JAZZ = { 0: ['1', '1'], 1: ['b2', 'b9'], 3: ['b3', '#9'], 4: ['3', '3'], 6: ['b5', 'b5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] };
export function jazzAltered(type, tonic, items) {
  if (type !== 'altered') return items;
  return items.map((x) => {
    const sp = ALTERED_JAZZ[T.mod(x.midi - T.pc(tonic), 12)];
    return sp ? { ...x, n: T.up(tonic, sp[0]), deg: T.fmtDeg(sp[1]) } : x;
  });
}
// scale names on badges: common nouns in lower case ("C major", "C whole tone"), names of modes
// and of peoples/places capitalised ("C Dorian", "C Phrygian dominant", "C Hungarian minor")
export const SHORT = {
  ionian: 'major', aeolian: 'minor', harmonicMinor: 'harm. minor', melodicMinor: 'mel. minor', harmonicMajor: 'harm. major',
  majorPent: 'maj. pent', minorPent: 'min. pent', blues: 'blues', majorBlues: 'maj. blues',
  bebopDom: 'bebop dominant', bebopMajor: 'bebop major', bebopDorian: 'bebop Dorian', sixthDim: '6th diminished',
  dimHW: 'diminished half-whole', dimWH: 'diminished whole-half', wholeTone: 'whole tone', chromatic: 'chromatic',
  altered: 'altered', augmented: 'augmented scale', doubleHarmonic: 'double harmonic major',
  ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map((i) => [`messiaen${i}`, `Messiaen mode ${i}`])),
};
export const scaleShort = (type) => SHORT[type] || T.SCALES[type].name.split(' (')[0];

// ------------------------------------------------------------------ roots & zones

/**
 * Pick a root midi for pc on one of `strings` within [lo,hi], near prev (or lowest).
 * `span` = semitones the exercise climbs above the root: roots that would push it
 * past the "Highest fret used" setting are only chosen when nothing else fits.
 */
export function pickRoot(ctx, pcv, { strings = ['E', 'A'], lo = 1, hi = 12, prev = null, prefer = null, span = 0 } = {}) {
  let best = null;
  const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
  for (const name of strings) {
    const s = ctx.str(name);
    if (s < 0) continue;
    for (let f = lo; f <= hi; f++) {
      const midi = ctx.tuning[s] + f;
      if (T.mod(midi, 12) !== pcv) continue;
      const score = (span && midi + span > highest ? 1000 : 0) + (prev == null
        ? (prefer && name !== prefer ? 50 : 0) + f
        : Math.abs(midi - prev) * 2 + f * 0.05 + (prefer && name !== prefer ? 1 : 0));
      if (!best || score < best.score) best = { score, s, f, midi, name };
    }
  }
  if (!best) {
    const midi = rootOn(ctx, pcv, strings[0]);
    return { s: Math.max(0, ctx.str(strings[0])), f: midi - ctx.tuning[Math.max(0, ctx.str(strings[0]))], midi };
  }
  return best;
}

/**
 * Best way to play chord tones (ascending, from rootMidi) inside a fret zone,
 * choosing the octave nearest to `prev`. Returns { rootMidi, pos }.
 */
export function zoneShape(rootPc, ivs, ctx, zone, prev = null, maxSpan = 4) {
  let best = null;
  const top = ctx.tuning[ctx.tuning.length - 1] + zone[1];
  for (let rm = ctx.tuning[0] + 1; rm <= top; rm++) {
    if (T.mod(rm, 12) !== rootPc) continue;
    const midis = ivs.map((iv) => rm + T.semis(iv));
    const sh = shapes(midis, ctx, { lo: zone[0], hi: zone[1], maxSpan });
    if (!sh.length) continue;
    const score = sh[0].cost + (prev == null ? rm * 0.05 : Math.abs(rm - prev) * 0.12);
    if (!best || score < best.score) best = { score, rootMidi: rm, pos: sh[0].pos };
  }
  return best;
}

/**
 * Like zoneShape, but a chord that does not fit in root position may start on another chord
 * tone (an inversion). Returns { rootMidi, pos, tones, inv }: pos[j] plays chord tone tones[j],
 * lowest first. Root position is preferred.
 */
export function zoneShapeAny(rootPc, ivs, ctx, zone, prev = null, maxSpan = 4) {
  let best = null;
  const top = ctx.tuning[ctx.tuning.length - 1] + zone[1];
  for (let inv = 0; inv < ivs.length; inv++) {
    const tones = ivs.map((_, j) => (j + inv) % ivs.length);
    for (let rm = ctx.tuning[0] - 12; rm <= top; rm++) {
      if (T.mod(rm, 12) !== rootPc) continue;
      const midis = tones.map((t) => rm + T.semis(ivs[t]) + (t < inv ? 12 : 0));
      if (midis[0] < ctx.tuning[0]) continue;
      const sh = shapes(midis, ctx, { lo: zone[0], hi: zone[1], maxSpan });
      if (!sh.length) continue;
      const score = sh[0].cost + inv * 1.5 + (prev == null ? midis[0] * 0.05 : Math.abs(midis[0] - prev) * 0.12);
      if (!best || score < best.score) best = { score, rootMidi: midis[0], pos: sh[0].pos, tones, inv };
    }
  }
  return best;
}

/** Emit chord tones at explicit positions in a given order of tone indices. */
export function emitShape(b, root, ivs, pos, order, extra = {}) {
  b.frets(order.map((i) => ({
    s: pos[i].s, f: pos[i].f, n: T.up(root, ivs[i]), deg: T.fmtDeg(ivs[i]),
  })), extra);
}

export const TRIAD_ORDERS = {
  up: { name: 'R-3-5 (up)', f: () => [0, 1, 2] },
  turn: { name: 'R-3-5-3', f: () => [0, 1, 2, 1] },
  down: { name: '5-3-R (down)', f: () => [2, 1, 0] },
  updown: { name: 'R-3-5-3-R', f: () => [0, 1, 2, 1, 0] },
  r535: { name: 'R-5-3-5', f: () => [0, 2, 1, 2] },
  alt: { name: 'Up one, down the next', f: (i) => (i % 2 ? [2, 1, 0] : [0, 1, 2]) },
};
export const SEVENTH_ORDERS = {
  up: { name: 'R-3-5-7 (up)', f: () => [0, 1, 2, 3] },
  down: { name: '7-5-3-R (down)', f: () => [3, 2, 1, 0] },
  updown: { name: 'R-3-5-7-5-3', f: () => [0, 1, 2, 3, 2, 1] },
  alt: { name: 'Up one, down the next', f: (i) => (i % 2 ? [3, 2, 1, 0] : [0, 1, 2, 3]) },
};

// ------------------------------------------------------------------ progressions

/** Chords as [interval-from-tonic | semitone offset, chord type, beats]. */
export const PROGS = {
  'I-IV-V-I': { name: 'I – IV – V – I', pop: true, chords: [['1', 'maj7'], ['4', 'maj7'], ['5', 'dom7'], ['1', 'maj7']] },
  'I-V-vi-IV': { name: 'I – V – vi – IV (pop)', pop: true, chords: [['1', 'maj7'], ['5', 'dom7'], ['6', 'min7'], ['4', 'maj7']] },
  'I-vi-IV-V': { name: 'I – vi – IV – V (50s)', pop: true, chords: [['1', 'maj7'], ['6', 'min7'], ['4', 'maj7'], ['5', 'dom7']] },
  'vi-IV-I-V': { name: 'vi – IV – I – V', pop: true, chords: [['6', 'min7'], ['4', 'maj7'], ['1', 'maj7'], ['5', 'dom7']] },
  'I-bVII-IV-I': { name: 'I – ♭VII – IV – I (rock)', pop: true, chords: [['1', 'maj7'], ['b7', 'maj7'], ['4', 'maj7'], ['1', 'maj7']] },
  canon: { name: 'Canon (I – V – vi – iii – IV – I – IV – V)', pop: true, chords: [['1', 'maj7'], ['5', 'dom7'], ['6', 'min7'], ['3', 'min7'], ['4', 'maj7'], ['1', 'maj7'], ['4', 'maj7'], ['5', 'dom7']] },
  'ii-V-I': { name: 'ii – V – I', chords: [['2', 'min7'], ['5', 'dom7'], ['1', 'maj7', 8]] },
  'I-vi-ii-V': { name: 'I – vi – ii – V (turnaround)', chords: [['1', 'maj7'], ['6', 'min7'], ['2', 'min7'], ['5', 'dom7']] },
  'iii-vi-ii-V': { name: 'iii – vi – ii – V – I', chords: [['3', 'min7'], ['6', 'min7'], ['2', 'min7'], ['5', 'dom7'], ['1', 'maj7']] },
  'I-VI7-ii-V': { name: 'I – VI7 – ii – V (secondary dominant)', chords: [['1', 'maj7'], ['6', 'dom7'], ['2', 'min7'], ['5', 'dom7']] },
  'I-III7-vi': { name: 'I – III7 – vi – II7 – V7 – I', chords: [['1', 'maj7'], ['3', 'dom7'], ['6', 'min7'], ['2', 'dom7'], ['5', 'dom7'], ['1', 'maj7']] },
  'ii-bII7-I': { name: 'ii – ♭II7 – I (tritone sub)', chords: [['2', 'min7'], ['b2', 'dom7'], ['1', 'maj7', 8]] },
  'I-bVI-bVII-I': { name: 'I – ♭VI – ♭VII – I (borrowed)', chords: [['1', 'maj7'], ['b6', 'maj7'], ['b7', 'dom7'], ['1', 'maj7']] },
  'I-iv-I': { name: 'I – IV – iv – I (minor plagal)', chords: [['1', 'maj7'], ['4', 'maj7'], ['4', 'min6'], ['1', 'maj7']] },
  'minor-ii-V-i': { name: 'Minor ii – V – i', minor: true, chords: [['2', 'm7b5'], ['5', 'dom7b9'], ['1', 'mMaj7', 8]] },
  'i-iv-V-i': { name: 'i – iv – V – i (harmonic minor)', minor: true, chords: [['1', 'min7'], ['4', 'min7'], ['5', 'dom7'], ['1', 'min7']] },
  'i-bVII-bVI-V': { name: 'Andalusian i – ♭VII – ♭VI – V', minor: true, pop: true, chords: [['1', 'min7'], ['b7', 'dom7'], ['b6', 'maj7'], ['5', 'dom7']] },
  'i-bVI-bIII-bVII': { name: 'i – ♭VI – ♭III – ♭VII (epic minor)', minor: true, pop: true, chords: [['1', 'min7'], ['b6', 'maj7'], ['b3', 'maj7'], ['b7', 'dom7']] },
  blues: {
    name: '12-bar blues', chords: [['1', 'dom7'], ['1', 'dom7'], ['1', 'dom7'], ['1', 'dom7'], ['4', 'dom7'], ['4', 'dom7'],
      ['1', 'dom7'], ['1', 'dom7'], ['5', 'dom7'], ['4', 'dom7'], ['1', 'dom7'], ['5', 'dom7']],
  },
  'blues-quick': {
    name: '12-bar blues (quick change)', chords: [['1', 'dom7'], ['4', 'dom7'], ['1', 'dom7'], ['1', 'dom7'], ['4', 'dom7'], ['4', 'dom7'],
      ['1', 'dom7'], ['1', 'dom7'], ['5', 'dom7'], ['4', 'dom7'], ['1', 'dom7'], ['5', 'dom7']],
  },
  'minor-blues': {
    name: 'Minor blues', minor: true, chords: [['1', 'min7'], ['4', 'min7'], ['1', 'min7'], ['1', 'min7'], ['4', 'min7'], ['4', 'min7'],
      ['1', 'min7'], ['1', 'min7'], ['b6', 'dom7'], ['5', 'dom7'], ['1', 'min7'], ['5', 'dom7']],
  },
  'jazz-blues': {
    name: 'Jazz blues', chords: [['1', 'dom7'], ['4', 'dom7'], ['1', 'dom7'], ['5', 'min7', 2], ['1', 'dom7', 2], ['4', 'dom7'], ['#4', 'dim7'],
      ['1', 'dom7'], ['6', 'dom7'], ['2', 'min7'], ['5', 'dom7'], ['1', 'dom7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2]],
  },
  autumn: {
    name: 'ii – V – I – IV – iiø – V – i (relative minor cycle)', chords: [['2', 'min7'], ['5', 'dom7'], ['1', 'maj7'], ['4', 'maj7'],
      ['7', 'm7b5'], ['3', 'dom7'], ['6', 'min7'], ['6', 'min7']],
  },
  'rhythm-A': {
    name: 'Rhythm changes (A section)', chords: [['1', 'maj7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2],
      ['3', 'min7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2], ['1', 'maj7', 2], ['1', 'dom7', 2], ['4', 'maj7', 2], ['4', 'min7', 2],
      ['3', 'min7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2]],
  },
  'ii-V7alt-I': { name: 'ii – V7alt – I', chords: [['2', 'min7'], ['5', 'dom7alt'], ['1', 'maj7', 8]] },
  'ii-V7b9-I': { name: 'ii – V7♭9 – I', chords: [['2', 'min7'], ['5', 'dom7b9'], ['1', 'maj7', 8]] },
  'ii-V7s5-I': { name: 'ii – V7♯5 – I', chords: [['2', 'min7'], ['5', 'dom7s5'], ['1', 'maj7', 8]] },
  'ii-V7b5-I': { name: 'ii – V7♭5 – I', chords: [['2', 'min7'], ['5', 'dom7b5'], ['1', 'maj7', 8]] },
  'vamp-min': { name: 'One-chord minor vamp (4 bars)', minor: true, chords: [['1', 'min7', 16]] },
  'vamp-dom': { name: 'One-chord dominant vamp (4 bars)', chords: [['1', 'dom7', 16]] },
  'i-iv-v-min': { name: 'i – iv – v – i (minor)', minor: true, pop: true, chords: [['1', 'min7'], ['4', 'min7'], ['5', 'min7'], ['1', 'min7']] },
  // (the Practice room's everyday additions, user 2026-10-23: the bridge, the 8-bar blues, the modal vamps)
  'rhythm-B': { name: 'Rhythm changes (bridge)', chords: [['3', 'dom7', 8], ['6', 'dom7', 8], ['2', 'dom7', 8], ['5', 'dom7', 8]] },
  'blues-8': {
    name: '8-bar blues', chords: [['1', 'dom7'], ['5', 'dom7'], ['4', 'dom7'], ['4', 'dom7'], ['1', 'dom7'], ['5', 'dom7'], ['1', 'dom7'], ['5', 'dom7']],
  },
  'vamp-dorian': { name: 'Dorian vamp (i7 – IV7)', minor: true, chords: [['1', 'min7'], ['4', 'dom7']] },
  'vamp-mixo': { name: 'Mixolydian vamp (I – ♭VII)', pop: true, chords: [['1', 'maj7'], ['b7', 'maj7']] },
  'vamp-iiV': { name: 'ii – V vamp', chords: [['2', 'min7'], ['5', 'dom7']] },
  // (more for the Practice room, user 2026-10-28: "All" of the common ones still missing)
  'I-IV-V-IV': { name: 'I – IV – V – IV (rock\'n\'roll, montuno)', pop: true, chords: [['1', 'maj7'], ['4', 'maj7'], ['5', 'dom7'], ['4', 'maj7']] },
  'neo-soul': { name: 'Neo-soul (IVmaj7 – III7 – vi7 – v7 – I7)', chords: [['4', 'maj7'], ['3', 'dom7'], ['6', 'min7'], ['5', 'min7', 2], ['1', 'dom7', 2]] },
  'minor-bossa': {
    name: 'Minor bossa (16 bars)', minor: true, chords: [['1', 'min7', 8], ['4', 'min7', 8], ['2', 'm7b5'], ['5', 'dom7b9'], ['1', 'min7', 8],
      ['b3', 'min7'], ['b6', 'dom7'], ['b2', 'maj7', 8], ['2', 'm7b5'], ['5', 'dom7b9'], ['1', 'min7'], ['2', 'm7b5', 2], ['5', 'dom7b9', 2]],
  },
  // (32 bars: kept out of the Library's progression drills, as the vamps are; `modal`: its chords are vamps, Dorian)
  'modal-form': { name: 'Modal form (Dorian 16 bars, up a half step 8, back 8)', minor: true, modal: true, chords: [['1', 'min7', 64], ['b2', 'min7', 32], ['1', 'min7', 32]] },
  'vamp-phrygian': { name: 'Phrygian vamp (i – ♭II)', minor: true, pop: true, chords: [['1', 'min7'], ['b2', 'maj7']] },
  'vamp-lydian': { name: 'Lydian vamp (I – II)', pop: true, chords: [['1', 'maj7'], ['2', 'maj7']] },
  'vamp-i-iv': { name: 'Minor vamp (i – iv)', minor: true, chords: [['1', 'min7'], ['4', 'min7']] },
  'vamp-i-bVII': { name: 'Minor vamp (i – ♭VII)', minor: true, pop: true, chords: [['1', 'min7'], ['b7', 'maj7']] },
  'cycle-dom7': {
    name: 'Dominant 7ths around the cycle', chords: [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7].map((o) => [o, 'dom7']),
  },
  'cycle-251': {
    name: 'ii – V – I in all 12 keys', chords: [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7].flatMap((o) => [[o + 2, 'min7', 2, o], [o + 7, 'dom7', 2, o], [o, 'maj7', 4, o]]),
  },
  // each chord is spelled from the key it leads to (4th element): F♯7 – B, not G♭7 – B
  'giant-steps': {
    name: 'Coltrane changes (Giant Steps)', chords: [
      [0, 'maj7', 2, 0], [3, 'dom7', 2, 8], [8, 'maj7', 2, 8], [11, 'dom7', 2, 4], [4, 'maj7', 4, 4], [10, 'min7', 2, 8], [3, 'dom7', 2, 8],
      [8, 'maj7', 2, 8], [11, 'dom7', 2, 4], [4, 'maj7', 2, 4], [7, 'dom7', 2, 0], [0, 'maj7', 4, 0], [6, 'min7', 2, 4], [11, 'dom7', 2, 4],
      [4, 'maj7', 4, 4], [10, 'min7', 2, 8], [3, 'dom7', 2, 8], [8, 'maj7', 4, 8], [2, 'min7', 2, 0], [7, 'dom7', 2, 0],
      [0, 'maj7', 4, 0], [6, 'min7', 2, 4], [11, 'dom7', 2, 4], [4, 'maj7', 4, 4], [2, 'min7', 2, 0], [7, 'dom7', 2, 0]],
  },
};

export const progP = (keys, def) => sel('Progression', keys.map((k) => [k, PROGS[k].name]), def || keys[0]);

const TRIAD_OF = {
  maj7: 'maj', dom7: 'maj', min7: 'min', m7b5: 'dim', dim7: 'dim', mMaj7: 'min', maj6: 'maj', min6: 'min', maj7s5: 'aug',
  dom7b9: 'maj', dom7s9: 'maj', dom9: 'maj', dom13: 'maj', maj9: 'maj', min9: 'min', dom7s5: 'aug', dom7sus4: 'sus4',
};
export const toTriad = (type) => TRIAD_OF[type] || type;

/**
 * Resolve a progression in a key (pc) to chords: { root, type, beats, ivs, sym, key, minorKey }.
 * Interval-string chords are spelled from the tonic; semitone chords get best spelling.
 * triads: true / false forces triads or 7th chords; left out, pop, rock, folk and reggae
 * progressions (pop: true) are triads (A E F♯m D) and jazz, soul and blues ones keep their 7ths.
 * `key` is the pc of the key the chord belongs to (a local key for ii–V–I cycles, Giant Steps).
 */
export function progChords(progKey, tonicPc, { triads, S = {} } = {}) {
  // (a key of PROGS, or a progression of the same shape: the Practice room's own)
  const prog = typeof progKey === 'string' ? PROGS[progKey] : progKey;
  const tonic = T.bestRoot(tonicPc, prog.minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv);
  const asTriads = triads ?? !!prog.pop;
  // each chord's root pitch class, to know where it leads
  const pcs = prog.chords.map(([where]) => (typeof where === 'number' ? T.mod(tonicPc + where, 12) : T.pc(T.up(tonic, where))));
  return prog.chords.map(([where, type0, beats = 4, keyOff], i) => {
    const type = asTriads ? toTriad(type0) : type0;
    const ivs = T.CHORDS[type].iv;
    let root;
    if (typeof where !== 'number') root = T.up(tonic, where);
    else if (keyOff != null) {
      // a chord of a local key (e.g. each ii–V–I of the cycle) is spelled from that key: A♭m7 in G♭
      const local = T.bestRoot(T.mod(tonicPc + keyOff, 12), T.SCALES.ionian.iv);
      root = T.up(local, T.IV_OF_SEMIS[T.mod(where - keyOff, 12)]);
    } else root = T.bestRoot(T.mod(tonicPc + where, 12), ivs);
    // a chord of the key keeps the key's spelling (C♭ is the IV of G♭ major); a chord that would need
    // a double accidental takes its lead-sheet name (C♭7 → B7), and so does any chromatic chord
    const chromatic = typeof where === 'number' || !(prog.minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv).includes(where);
    // (QA round 16, user's choice: also when only a chord tone needs it, G♭m7 → F♯m7 in D♭; a tension, a
    // dominant's ♭5 or ♯5 or a °7's 7th does not count, being written plainly: A♭7♭9 and A♭7♭5 keep their
    // names, their ♭9 is A and their ♭5 D; QA round 17)
    const dom = ivs.includes('3') && ivs.includes('b7');
    const core = ivs.filter((iv) => !/9|11|13/.test(iv) && iv !== 'bb7' && !(dom && (iv === 'b5' || iv === '#5')));
    // (a major chord a 5th above the next keeps the key's spelling: its 3rd is the next chord's leading tone,
    // D♯7 → G♯m in G♯ minor with F𝄪, as the key writes it; QA round 17, user's choice)
    const leads = ivs.includes('3') && prog.chords.length > 1 && T.mod(T.pc(root) - pcs[(i + 1) % pcs.length], 12) === 7;
    if ((T.awkward(root) && chromatic) || (!leads && core.some((iv) => Math.abs(T.up(root, iv).a) > 1))) root = T.bestRoot(T.pc(root), ivs);
    const key = keyOff != null ? T.mod(tonicPc + keyOff, 12) : tonicPc;
    return { root, type, beats, ivs, sym: chordName(root, type, S), key, minorKey: !!prog.minor && keyOff == null, vamp: prog.chords.length === 1 || !!prog.modal };
  });
}

/** Pick bass-register root midis: each nearest to the previous within [lo, hi]. */
export function chordRootMidis(chords, { lo = 28, hi = 45, firstLo = 28, firstHi = 39, near = null } = {}) {
  let prev = near, first = null;
  return chords.map((c, i) => {
    const pcv = T.pc(c.root);
    // the first chord coming back keeps its octave, so the loop closes where it started (I–IV–V–I
    // falls a 5th to the I, not up a 4th to an octave above bar 1)
    if (i > 0 && pcv === T.mod(first, 12)) { prev = first; return first; }
    let best = null;
    const a = prev == null ? firstLo : lo, z = prev == null ? firstHi : hi;
    for (let m = a; m <= z; m++) {
      if (T.mod(m, 12) !== pcv) continue;
      const d = prev == null ? m : Math.abs(m - prev);
      if (!best || d < best.d) best = { d, m };
    }
    if (!best) best = { m: lo + T.mod(pcv - lo, 12) };
    prev = best.m;
    if (i === 0) first = best.m;
    return best.m;
  });
}

// ------------------------------------------------------------------ groove engine

const TOKEN_IV = {
  R: '1', '2': '2', '9': '9', b3: 'b3', '4': '4', b5: 'b5', '6': '6', b6: 'b6', b7: 'b7', '8': '8', '10': '10',
};

/**
 * Resolve a groove token against a chord.
 * Tokens: R 2 b3 3 4 5 6 b7 7 8 9 10 (3/5/7 follow the chord quality),
 *         5_ b7_ 6_ (below the root), A / Ab (chromatic approach from below/above to next root),
 *         N (next root), D (dominant approach: 5th of next chord), x (ghost note), - (rest)
 */
const LPC = [0, 2, 4, 5, 7, 9, 11];
/**
 * An approach note spelled as a step from the note it leads to: the letter above for a note above
 * (F or F♯ over E), the letter below for a note below (D♯ or D under E); plainly when that would
 * need a double accidental or C♭/F♭/E♯/B♯.
 */
export function stepSpell(m, target, targetMidi) {
  const up = m > targetMidi;
  const l = (target.l + (up ? 1 : 6)) % 7;
  let a = T.mod(m - LPC[l], 12);
  if (a > 6) a -= 12;
  const n = { l, a };
  return Math.abs(a) <= 1 && !T.awkward(n) ? n : spellMidi(m, up);
}

/** The octaves of a note between two limits. */
export const octavesOf = (m, lo, hi) => { const out = []; for (let x = lo + T.mod(m - lo, 12); x <= hi; x += 12) out.push(x); return out; };

/**
 * A one-octave drill's root moved off awkward frets: at frets 10–12 to the string below, at fret 1 to
 * the neighbouring string (below, or above from the lowest string). Returns { r, note } (note for
 * the "fixed" line, or null).
 */
export function placeRoot(ctx, k, strName, r, { span = 0 } = {}) {
  const si = ctx.str(strName);
  if (r.f > 9 && si > 0) {
    const below = ctx.names[si - 1];
    const r2 = pickRoot(ctx, k, { strings: [below], lo: 1, hi: 9, span });
    if (r2.f >= 1 && r2.f <= 9) return { r: r2, note: `${below} string (on the ${strName} string the root is at fret ${r.f})` };
  }
  if (r.f === 1) {
    const alt = si > 0 ? ctx.names[si - 1] : ctx.names[si + 1];
    const r2 = pickRoot(ctx, k, { strings: [alt], lo: 2, hi: 9, span });
    if (r2.f >= 2 && r2.f <= 9) return { r: r2, note: `${alt} string (on the ${strName} string the root is at fret 1)` };
  }
  return { r, note: null };
}

/** One line per key; in a cycle each key's last chord leads into the next key's first chord. */
export function keyLines(keys, chordsOf, rootsOf = (c, near) => chordRootMidis(c, { near })) {
  // each key's roots start near where the key before ended, so a key change never leaps
  let near = null;
  const lines = keys.map((k) => {
    const chords = chordsOf(k);
    const roots = rootsOf(chords, near);
    near = roots[roots.length - 1];
    return { chords, roots };
  });
  return lines.map((L, i) => {
    const N = lines[(i + 1) % lines.length];
    return { ...L, next: lines.length > 1 ? { chord: N.chords[0], midi: N.roots[0] } : null };
  });
}

export function resolveToken(tok, chord, rootMidi, nextRoot, nextMidi) {
  const ivs = chord.ivs;
  const third = ivs[1] || '3';
  const fifth = ivs[2] || '5';
  // the "7" slot: the chord's own 4th note (the 6 of a 6th chord), or the octave on a triad
  const seventh = ivs[3] || '8';
  let iv = null, below = false;
  switch (tok) {
    case '3': iv = third; break;
    case '5': iv = fifth; break;
    case '7': iv = seventh; break;
    case '10': iv = third === 'b3' ? 'b10' : '10'; break;
    case '5_': iv = fifth; below = true; break;
    case '8_': iv = '1'; below = true; break;
    case '3_': iv = third; below = true; break;
    case 'b7_': iv = 'b7'; below = true; break;
    case '6_': iv = '6'; below = true; break;
    case '7_': iv = seventh; below = true; break;
    default: iv = TOKEN_IV[tok];
  }
  if (tok === 'A' || tok === 'Ab') {
    const m = nextMidi + (tok === 'A' ? -1 : 1);
    return { midi: m, n: stepSpell(m, nextRoot, nextMidi), deg: '→' };
  }
  if (tok === 'N') return { midi: nextMidi, n: nextRoot, deg: 'R' };
  if (tok === 'D') {
    const m = nextMidi + 7 > rootMidi + 9 ? nextMidi - 5 : nextMidi + 7;
    return { midi: m, n: T.up(nextRoot, '5'), deg: '→' };
  }
  if (tok === 'x') return { midi: rootMidi, n: chord.root, deg: 'x', tag: 'x' };
  if (tok === 'b7' && ivs.includes('7')) iv = '7';
  if (!iv) return null;
  const s = T.semis(iv);
  const midi = below ? rootMidi + s - 12 : rootMidi + s;
  const simple = iv === '10' ? '3' : iv === 'b10' ? 'b3' : iv;
  return { midi, n: T.up(chord.root, simple === '8' ? '1' : simple), deg: T.fmtDeg(simple) };
}

/**
 * Render a groove pattern over chords. pattern: list of bars, each [[token, beats, tag?], ...]
 * (bar 0 pattern is reused if the chord lasts longer). Durations in beats (non-uniform).
 */
/**
 * Where each chord's root sits when a line is a hand shape (R-5-8, octaves, boogie, chord tones):
 * a fretted note on a string with two strings above it (the 5th and the octave go up from there),
 * near the previous root, not on the low B when the E string has the note; the open string when
 * only an open string has it (the low E). A root that would sit above fret 9 drops an octave, so a
 * shape line stays in the lower positions, and the lower frets win where the same pitch has two
 * places. `below`: the pattern also plays notes under the root (the low 5th of a two-feel), so the
 * root takes a string with one below it (the 5th then sits at the same fret, a string lower).
 * Returns the roots (moved) and their places.
 */
function shapeRoots(roots, ctx, { below = false } = {}) {
  const eStr = Math.max(0, ctx.str('E'));
  const top = ctx.tuning.length - 3;
  let prev = 5;
  const fretted = (m) => candidates(m, ctx, { open: 'avoid', maxFret: 12 }).filter((x) => x.s >= eStr || m < ctx.tuning[eStr]);
  const pos = [];
  const midis = roots.map((m) => {
    const low = fretted(m).filter((x) => x.s <= top && x.f <= 9);
    if (!low.length && m - 12 >= ctx.tuning[0] && (fretted(m - 12).length || ctx.tuning.includes(m - 12))) m -= 12;
    const c = fretted(m);
    if (!c.length) {
      const so = ctx.tuning.indexOf(m);
      pos.push(so >= 0 ? { s: so, f: 0 } : null);
      return m;
    }
    const pool = below && c.some((x) => x.s > 0) ? c.filter((x) => x.s > 0) : c;
    pool.sort((a, b) => (a.s > top) - (b.s > top) || (a.f > 9) - (b.f > 9) || Math.abs(a.f - prev) - Math.abs(b.f - prev) || a.s - b.s);
    prev = pool[0].f;
    pos.push(pool[0]);
    return m;
  });
  return { midis, pos };
}

export function grooveLine(b, chords, roots, pattern, { tags = true, place: popts = {}, next = null, shape = false } = {}) {
  const pitches = [];
  // a shape line keeps each chord's notes around its root: fret window from one below to four above
  let rootAt = null;
  if (shape) ({ midis: roots, pos: rootAt } = shapeRoots(roots, b.ctx, { below: pattern.some((bar) => bar.some(([tok]) => /_$/.test(tok))) }));
  const regionOf = (ci, isRoot) => {
    if (!rootAt) return undefined;
    const r = rootAt[ci];
    if (!r) return { lo: 0, hi: 4, g: ci };
    if (r.f === 0) return { lo: 1, hi: 4, g: ci, ...(isRoot ? { s: r.s, open: true } : {}) };
    return { lo: Math.max(1, r.f - 1), hi: r.f + 4, g: ci, ...(isRoot ? { s: r.s } : {}) };
  };
  let at = 0; // beats from the start of the line: a two-bar pattern alternates bar by bar across chords
  chords.forEach((c, ci) => {
    const lastOfKey = ci === chords.length - 1 && next;
    const nextC = lastOfKey ? next.chord : chords[(ci + 1) % chords.length];
    const nextMidi = lastOfKey ? next.midi : roots[(ci + 1) % chords.length];
    let beatsLeft = c.beats;
    let barIdx = Math.floor(at / 4 + 1e-9);
    at += c.beats;
    let first = true;
    while (beatsLeft > 1e-9) {
      const bar = pattern[barIdx % pattern.length];
      // approaches and pickups lead to the next chord only from its last bar; inside a long
      // chord they lead back to its own root
      const last = beatsLeft <= 4 + 1e-9;
      const tgtRoot = last ? nextC.root : c.root, tgtMidi = last ? nextMidi : roots[ci];
      for (const [tok, dur, tag] of bar) {
        if (beatsLeft <= 1e-9) break;
        const d = Math.min(dur, beatsLeft);
        beatsLeft -= d;
        if (tok === '-') {
          pitches.push({ rest: true, dur: d, chord: first ? c.sym : undefined });
        } else {
          let lowTok = tok === 'A' && tgtMidi - 1 < Math.min(...b.ctx.tuning) ? 'Ab' : tok;
          let p = resolveToken(lowTok, c, roots[ci], tgtRoot, tgtMidi);
          // an approach is never the note just played (in any octave): take the other side
          const before = pitches.length ? pitches[pitches.length - 1] : null;
          if ((lowTok === 'A' || lowTok === 'Ab') && before && !before.rest && T.mod(p.midi - before.midi, 12) === 0) {
            lowTok = lowTok === 'A' ? 'Ab' : 'A';
            p = resolveToken(lowTok, c, roots[ci], tgtRoot, tgtMidi);
          }
          // the 5th of the next chord can be the root just played (a move by a 4th): approach chromatically
          if (lowTok === 'D' && (T.mod(p.midi - roots[ci], 12) === 0 || (before && !before.rest && T.mod(p.midi - before.midi, 12) === 0))) {
            lowTok = 'A';
            p = resolveToken('A', c, roots[ci], tgtRoot, tgtMidi);
            if (before && !before.rest && T.mod(p.midi - before.midi, 12) === 0) p = resolveToken('Ab', c, roots[ci], tgtRoot, tgtMidi);
          }
          // an approach under the lowest string (into the open E), or one moved an octave away from its
          // target to stay on the neck: the half step above, or the whole step above when that would
          // repeat the note just played
          if ((lowTok === 'A' || lowTok === 'Ab') && (p.midi < Math.min(...b.ctx.tuning) || Math.abs(p.midi - tgtMidi) > 2)) {
            const m = [tgtMidi + 1, tgtMidi + 2].find((x) => !(before && !before.rest && T.mod(x - before.midi, 12) === 0));
            if (m != null) p = { midi: m, n: stepSpell(m, tgtRoot, tgtMidi), deg: '→' };
          }
          pitches.push({ ...p, dur: d, chord: first ? c.sym : undefined, tag: p.tag === 'x' ? 'x' : (tags && tag) || p.tag, region: regionOf(ci, lowTok === 'R' && p.midi === roots[ci]) });
        }
        first = false;
      }
      barIdx++;
    }
  });
  emitMixed(b, pitches, popts);
}

/**
 * Key signature (sharps +, flats −) of a scale on a tonic, or null when none applies. Modes of the
 * major scale take their parent's signature (D Dorian: none, E♭ Lydian: two flats); harmonic and
 * melodic minor, the minor pentatonic and the blues scale take the tonic's minor key; the major
 * pentatonic, major blues and harmonic major its major key. Other scales are written with accidentals.
 */
export function keySigFor(tonic, type) {
  const sum = (mode) => T.SCALES[mode].iv.map((iv) => T.up(tonic, iv)).reduce((a, n) => a + Math.sign(n.a), 0);
  let ks = null;
  if (T.MAJOR_MODES.includes(type)) ks = sum(type);
  else if (['harmonicMinor', 'melodicMinor', 'minorPent', 'blues'].includes(type)) ks = sum('aeolian');
  else if (['majorPent', 'majorBlues', 'harmonicMajor'].includes(type)) ks = sum('ionian');
  return ks != null && Math.abs(ks) <= 7 ? ks : null;
}

/**
 * The tonic's name for a scale chosen on its own. Usually its plain name; on a black key, when that
 * name's key signature needs six or seven accidentals, the enharmonic name with fewer (F♯ Mixolydian,
 * parent B, not G♭ Mixolydian, parent C♭). Blues scales take their key's lead-sheet name (E♭ blues).
 */
export function tonicFor(k, type) {
  if (type === 'blues') return T.bestRoot(k, T.SCALES.aeolian.iv);
  if (type === 'majorBlues') return T.bestRoot(k, T.SCALES.ionian.iv);
  const base = T.bestRoot(k, T.SCALES[type].iv);
  const ks = keySigFor(base, type);
  if (ks == null || Math.abs(ks) <= 5) return base;
  const other = [spellMidi(60 + k, false), spellMidi(60 + k, true)].find((n) => n.l !== base.l);
  const ko = other ? keySigFor(other, type) : null;
  return ko != null && Math.abs(ko) < Math.abs(ks) ? other : base;
}

/** Emit a list of pitches/rests (with per-item durations) placed as one melodic line. */
/**
 * One hand shape for a chord's notes: four frets at most (five, or an open bass note, only when
 * nothing smaller exists), never three notes on one string, near `home` (where the exercise
 * started) and `center` (the chord before); `string` asks for the lowest note on that string;
 * `fit(pos)` (pos low to high) asks for a shape of its own (R-5-10: the 5th on the string above the
 * root) when one exists. Fingers by fret (handFingers: 1-2-4 on frets lo, lo+1, lo+4).
 * Returns { at: Map(midi -> {s, f, finger}), mid } or null.
 */
export function chordShape(midis, ctx, { home, center = home, string = null, fit = null }) {
  const uniq = [...new Set(midis)].sort((a, c) => a - c);
  const perString = (c) => Math.max(...[...new Set(c.pos.map((q) => q.s))].map((sv) => c.pos.filter((q) => q.s === sv).length));
  const find = (o) => {
    const all = shapes(uniq, ctx, { lo: 1, hi: ctx.maxFret, ...o }).filter((c) => perString(c) <= 2);
    const own = fit ? all.filter((c) => fit(c.pos)) : all;
    return own.length ? own : all;
  };
  let cands = find({ maxSpan: 4 });
  // a chord too wide for four frets (high on a short neck) may stretch a fret, never three notes on a string
  if (!cands.length) cands = find({ maxSpan: 5 });
  // a bass note on the open string (low E in F or G major, 2nd inversion): the open string
  if (!cands.length) cands = find({ maxSpan: 4, open: true });
  if (!cands.length) return null;
  const mid = (c) => c.pos.reduce((a, q) => a + q.f, 0) / c.pos.length;
  const spanOf = (c) => { const fr = c.pos.map((q) => q.f); return Math.max(...fr) - Math.min(...fr); };
  // a compact shape beats a four-fret stretch; the hand stays near where it started
  const score = (c) => c.cost + Math.abs(mid(c) - home) * 0.8 + Math.abs(mid(c) - center) * 0.4
    + (spanOf(c) >= 4 ? 1.5 : 0) + (perString(c) > 1 ? 0.3 : 0) + (string != null && c.pos[0].s !== string ? 4 : 0);
  const best = cands.reduce((A, c) => (score(c) < score(A) ? c : A));
  // (a six-fret stretch, the last resort high on a short neck: fingers spread over the frets in order)
  const fretted = best.pos.map((q) => q.f).filter((f) => f > 0);
  const frs = [...new Set(fretted)].sort((a, c) => a - c);
  const finger = handFingers(fretted) || ((f) => (f === 0 ? 0 : frs.length === 1 ? 1 : 1 + Math.round((frs.indexOf(f) * 3) / (frs.length - 1))));
  return { at: new Map(uniq.map((m, j) => [m, { s: best.pos[j].s, f: best.pos[j].f, finger: finger(best.pos[j].f) }])), mid: mid(best) };
}

export function emitMixed(b, items, popts = {}) {
  const { fold = true, shapes: byShape = false, ...placeOpts } = popts;
  const notes = items.filter((x) => !x.rest);
  // fold single notes that fall off either end of the neck by an octave
  // (phrases that must keep their shape pass fold:false and are shifted as a whole)
  const lowest = Math.min(...b.ctx.tuning);
  const highest = b.ctx.tuning[b.ctx.tuning.length - 1] + b.ctx.maxFret;
  const midis = notes.map((n) => {
    let m = n.midi;
    if (!fold) return m;
    while (m < lowest) m += 12;
    while (m > highest) m -= 12;
    return m;
  });
  const chordOf = [];
  items.reduce((ci, it) => { const c = ci + (it.chord ? 1 : 0); if (!it.rest) chordOf.push(c); return c; }, 0);
  let regions = notes.some((n) => n.region) ? notes.map((n) => n.region || null) : undefined;
  let pos;
  if (byShape) {
    // a voice-led line: every chord is one hand shape (chordShape) and the hand moves only as far
    // as the next chord needs; a chord with no shape is placed as a line
    pos = new Array(midis.length);
    const home = placeOpts.center ?? 5;
    let center = home;
    const groups = new Map();
    midis.forEach((m, j) => { if (!groups.has(chordOf[j])) groups.set(chordOf[j], []); groups.get(chordOf[j]).push(j); });
    for (const js of groups.values()) {
      const sh = chordShape(js.map((j) => midis[j]), b.ctx, { home, center });
      const q = sh ? js.map((j) => sh.at.get(midis[j])) : place(js.map((j) => midis[j]), b.ctx, { open: 'avoid', center: Math.round(center) });
      js.forEach((j, k) => { pos[j] = { ...q[k] }; });
      if (sh) center = sh.mid;
    }
  } else pos = place(midis, b.ctx, { open: 'allow', center: 4, ...placeOpts, ...(regions ? { regions } : {}) }).map((q) => ({ ...q }));
  // a pitch played twice inside one chord sits in one place, the one it takes most often (a root is
  // not played at the 5th fret and then on the open string in the same bar)
  const moved = regions ? [...regions] : notes.map(() => null);
  let again = false;
  const seen = new Map();
  if (!byShape) midis.forEach((m, j) => { const k = `${chordOf[j]}|${m}`; if (!seen.has(k)) seen.set(k, []); seen.get(k).push(j); });
  // (every repeated pitch is held where it is, so placing the others again cannot split it)
  for (const js of seen.values()) {
    if (js.length < 2) continue;
    if (js.some((j) => pos[j].s !== pos[js[0]].s || pos[j].f !== pos[js[0]].f)) again = true;
    const count = new Map();
    for (const j of js) { const k = `${pos[j].s}|${pos[j].f}`; count.set(k, (count.get(k) || 0) + 1); }
    const [s, f] = [...count.entries()].reduce((a, c) => (c[1] > a[1] ? c : a))[0].split('|').map(Number);
    for (const j of js) moved[j] = { lo: 0, hi: 99, ...(moved[j] || {}), s, ...(f === 0 ? { open: true } : {}) };
  }
  if (again) {
    regions = moved;
    pos = place(midis, b.ctx, { open: 'allow', center: 4, ...placeOpts, regions }).map((q) => ({ ...q }));
  }
  // slap: a hammer-on (H) goes up on the same string as the note before, a pull-off (PO) down on
  // it; a pop (P) leaves the thumb's string (the octave pop is two strings up, not fret 12)
  const tags = notes.map((n) => n.tag);
  const T0 = b.ctx.tuning;
  // slap: the thumb plays the low strings (an open string when one has the note, the E string rather
  // than the low B), the pops the top strings (D and G; also C on a 6-string)
  const thumbed = tags.some((t) => t && t.startsWith('T'));
  if (thumbed) {
    const popLo = Math.max(0, b.ctx.str('D'));
    const eStr = Math.max(0, b.ctx.str('E'));
    for (let j = 0; j < notes.length; j++) {
      const tag = tags[j];
      if (tag && (tag.startsWith('T') || tag === 'x')) {
        const so = T0.findIndex((o) => o === midis[j]);
        if (so >= 0 && so < popLo) pos[j] = { s: so, f: 0 };
        else if (pos[j].s < eStr && midis[j] >= T0[eStr] && midis[j] - T0[eStr] <= 12) pos[j] = { s: eStr, f: midis[j] - T0[eStr] };
      } else if (tag === 'P' && pos[j].s < popLo) {
        let best = null;
        const ref = j > 0 ? pos[j - 1].f : 5;
        for (let s2 = popLo; s2 < T0.length; s2++) {
          const f = midis[j] - T0[s2];
          if (f >= 0 && f <= b.ctx.maxFret && (!best || Math.abs(f - ref) < Math.abs(best.f - ref))) best = { s: s2, f };
        }
        // a note too low for the pop strings is thumbed instead
        if (best) pos[j] = best;
        else tags[j] = 'T';
      }
    }
  }
  let run = 0; // first note of the current hammer/pull-off run
  for (let j = 1; j < notes.length; j++) {
    const tag = tags[j], prev = pos[j - 1];
    if (tag === 'H' || tag === 'PO') {
      const f = midis[j] - T0[prev.s];
      const fr = [...pos.slice(run, j).map((q) => q.f), f].filter((x) => x > 0);
      // one hand position: the whole run fits in four frets
      const ok = (tag === 'H' ? f > prev.f : f < prev.f && f >= 0) && Math.max(...fr) - Math.min(...fr) <= 3;
      if (ok) { pos[j] = { s: prev.s, f }; continue; }
      // not playable as written: popped on the top strings, thumbed below them
      tags[j] = pos[j].s >= Math.max(0, b.ctx.str('D')) ? 'P' : 'T';
    }
    run = j;
    if (tags[j] === 'P' && (tags[j - 1] === 'T' || tags[j - 1] === 'x') && pos[j].s === prev.s) {
      let moved = false;
      for (const ds of [2, 1]) {
        const s2 = prev.s + ds, f = midis[j] - (T0[s2] ?? Infinity);
        if (s2 < T0.length && f >= 0 && f <= b.ctx.maxFret) { pos[j] = { s: s2, f }; moved = true; break; }
      }
      // no string above: the thumb note moves down a string instead
      for (const ds of moved ? [] : [1, 2]) {
        const s2 = prev.s - ds, f = s2 >= 0 ? midis[j - 1] - T0[s2] : -1;
        if (f >= 0 && f <= b.ctx.maxFret) { pos[j - 1] = { s: s2, f }; break; }
      }
    }
  }
  // a pitch a hammer-on or pull-off plays sits where the run put it for the whole chord (plain notes
  // only: slap thumb and pop notes keep their strings)
  const runAt = new Map();
  tags.forEach((t, j) => { if (t === 'H' || t === 'PO') runAt.set(`${chordOf[j]}|${midis[j]}`, pos[j]); });
  if (runAt.size) notes.forEach((n, j) => { const q = runAt.get(`${chordOf[j]}|${midis[j]}`); if (q && !tags[j] && (q.s !== pos[j].s || q.f !== pos[j].f)) pos[j] = { s: q.s, f: q.f }; });
  // every thumbed note ends on the low strings: off the low B onto the E string, and off the pop
  // strings (D, G) onto E or A when one of them has the note within 12 frets (an unplayable
  // hammer-on or pull-off thumbed after all, or a thumb note placed up there for the hand position)
  if (thumbed) {
    const eStr = Math.max(0, b.ctx.str('E'));
    const popLo = Math.max(eStr + 1, b.ctx.str('D'));
    for (let j = 0; j < notes.length; j++) {
      const tag = tags[j];
      if (!(tag && (tag.startsWith('T') || tag === 'x')) || (pos[j].s >= eStr && pos[j].s < popLo) || midis[j] < T0[eStr]) continue;
      // a thumbed note that starts a hammer/pull-off run moves with its whole run (same string)
      let e = j;
      while (e + 1 < notes.length && (tags[e + 1] === 'H' || tags[e + 1] === 'PO') && pos[e + 1].s === pos[j].s) e++;
      const ref = j > 0 ? pos[j - 1].f : pos[j].f;
      // the same pitch thumbed on a low string elsewhere in this chord: that string again
      const sib = pos.findIndex((q, i) => i !== j && chordOf[i] === chordOf[j] && midis[i] === midis[j] && q.s >= eStr && q.s < popLo);
      let best = null;
      for (let s2 = eStr; s2 < popLo; s2++) {
        const run = pos.slice(j, e + 1).map((_, i) => midis[j + i] - T0[s2]);
        if (!run.every((f) => f >= 0 && f <= 12)) continue;
        if (sib >= 0 && s2 === pos[sib].s) { best = { s: s2, run }; break; }
        if (!best || Math.abs(run[0] - ref) < Math.abs(best.run[0] - ref)) best = { s: s2, run };
      }
      if (best) for (let i = j; i <= e; i++) pos[i] = { s: best.s, f: best.run[i - j] };
      j = e;
    }
    // a hammer-on or pull-off run left on a pop string starts with a pop (pop, then hammer), unless
    // the thumb has just played that string; a single note there with no low-string place within
    // reach stays thumbed (the thumb on the D string)
    for (let j = 0; j + 1 < notes.length; j++) {
      if (!(tags[j] && tags[j].startsWith('T')) || pos[j].s < popLo) continue;
      if (!(tags[j + 1] === 'H' || tags[j + 1] === 'PO') || pos[j + 1].s !== pos[j].s) continue;
      const pr = j > 0 ? tags[j - 1] : null;
      if (pr && (pr.startsWith('T') || pr === 'x') && pos[j - 1].s === pos[j].s) continue;
      tags[j] = 'P';
    }
  }
  // double thumbing: the thumb's up-stroke (TV) comes back through the string of its down-stroke (T⊓),
  // and a hammer-on or pull-off after it stays on that string
  for (let j = 1; j < notes.length; j++) {
    if (tags[j] !== 'TV' || tags[j - 1] !== 'T⊓' || pos[j].s === pos[j - 1].s) continue;
    const s = pos[j - 1].s, f = midis[j] - T0[s];
    if (f < 0 || f > b.ctx.maxFret) continue;
    pos[j] = { s, f };
    for (let k = j + 1; k < notes.length && (tags[k] === 'H' || tags[k] === 'PO'); k++) {
      const f2 = midis[k] - T0[s];
      if (f2 >= 0 && f2 <= b.ctx.maxFret) pos[k] = { s, f: f2 };
    }
  }
  // a run of hammer-ons and pull-offs is one hand position: one finger per fret from the lowest
  // fret (index), the highest under the little finger when the run spans more than four frets
  for (let a = 0; a < notes.length; a++) {
    let e = a;
    while (e + 1 < notes.length && (tags[e + 1] === 'H' || tags[e + 1] === 'PO')) e++;
    if (e === a) continue;
    const fr = pos.slice(a, e + 1).map((q) => q.f).filter((f) => f > 0);
    const lo = Math.min(...fr), span = Math.max(...fr) - lo;
    for (let j = a; j <= e; j++) {
      const f = pos[j].f;
      pos[j].finger = f === 0 ? 0 : span <= 3 ? 1 + f - lo : 1 + Math.round(((f - lo) * 3) / span);
    }
    a = e;
  }
  // a chord (or a named part of one) whose notes fit one hand position is fingered from it (no shift
  // shown inside it)
  const partOf = [];
  items.reduce((pi, it) => { const c = pi + (it.chord || it.text ? 1 : 0); if (!it.rest) partOf.push(c); return c; }, 0);
  const byPart = new Map();
  pos.forEach((q, j) => { if (!byPart.has(partOf[j])) byPart.set(partOf[j], []); byPart.get(partOf[j]).push(q); });
  for (const ps of byPart.values()) chordFingers(ps);
  let k = 0;
  for (const it of items) {
    if (it.chord) b.chord(it.chord);
    if (it.text) b.text(it.text);
    if (it.rest) { b.rest(it.dur); continue; }
    const p = pos[k];
    const tag = it.tag ? tags[k] : it.tag;
    k++;
    b.frets([{ s: p.s, f: p.f, finger: p.finger, n: it.n, deg: it.deg, tag, dur: it.dur, accent: it.accent, implied: it.implied }]);
  }
}

// ------------------------------------------------------------------ walking engine

const WALK_FORMULAS = {
  ct: [['R', '3', '5', '3'], ['R', '3', '5', '8'], ['R', '5', '8', '5']],
  ctA: [['R', '3', '5', 'A'], ['R', '5', '3', 'A'], ['R', '8', '5', 'A']],
  scalar: [['R', '2', '3', '5'], ['R', '2', '3', 'A'], ['8', '7', '6', '5']],
  mixed: [['R', '3', '5', 'A'], ['R', '2', '3', '5'], ['R', '8', '7', '5'], ['R', '5', '3', 'Ab'], ['R', '2', '3', 'A'], ['R', '3', '5', 'D']],
  enclosure: [['R', '3', 'Ab', 'A'], ['R', '5', 'Ab', 'A'], ['R', '2', 'Ab', 'A']],
  twofeel: [['R', '5'], ['R', 'A'], ['R', '5_']],
};

const MODE_FOR = {
  maj7: 'ionian', dom7: 'mixolydian', min7: 'dorian', m7b5: 'locrianN2', dim7: 'dimWH', mMaj7: 'melodicMinor', maj6: 'ionian', min6: 'melodicMinor',
  dom7s9: 'altered', dom7b9: 'dimHW', dom7s5: 'wholeTone', dom7b5: 'wholeTone', maj7s5: 'lydianAug',
  dom7alt: 'altered', dom7s11: 'lydianDom', dom7b13: 'mixolydianB6', dom7susb9: 'dorianB2',
};
const MINOR_TYPES = ['min7', 'min6', 'mMaj7', 'm7b5', 'min'];
const FAMILY = { maj7: 'maj', maj6: 'maj', maj: 'maj', min7: 'min', min: 'min', dom7: 'dom', m7b5: 'hdim' };
/** Chord-scale theory (Berklee): a diatonic chord takes the mode of its degree in the key. */
const BY_DEGREE = {
  major: { '0:maj': 'ionian', '2:min': 'dorian', '4:min': 'phrygian', '5:maj': 'lydian', '7:dom': 'mixolydian', '9:min': 'aeolian', '11:hdim': 'locrian' },
  minor: { '0:min': 'aeolian', '2:hdim': 'locrian', '3:maj': 'ionian', '5:min': 'dorian', '7:min': 'phrygian', '8:maj': 'lydian', '10:dom': 'mixolydian' },
};
/**
 * Scale for a chord by its function: diatonic chords by degree (IV Lydian, vi Aeolian, a minor key's
 * iiø Locrian), a dominant resolving down a 5th to a minor chord Phrygian dominant (♭9, ♭13), and any
 * other chord by its quality (secondary dominants Mixolydian, m(maj7) melodic minor, °7 whole-half).
 */
export function modeFor(c, next) {
  const toMinor = next && MINOR_TYPES.includes(next.type) && T.mod(T.pc(next.root) - T.pc(c.root), 12) === 5;
  if (toMinor && (c.type === 'dom7' || c.type === 'dom7b9')) return 'phrygianDom';
  const fam = FAMILY[c.type];
  // a one-chord minor vamp is Dorian (So What, funk vamps); i of a minor progression stays Aeolian
  if (c.vamp && fam === 'min') return 'dorian';
  if (fam && c.key != null) {
    const deg = T.mod(T.pc(c.root) - c.key, 12);
    const mode = BY_DEGREE[c.minorKey ? 'minor' : 'major'][`${deg}:${fam}`];
    if (mode) return mode;
  }
  // the iiø of a minor ii–V–i in a major-key progression (Autumn's relative minor) is Locrian too
  if (c.type === 'm7b5') return 'locrian';
  return MODE_FOR[c.type] || 'ionian';
}
// semitones above the root for each walking token (approach notes go with the next root)
const WALK_OFF = { R: 0, 2: 2, 3: 4, 5: 7, 6: 9, 7: 11, 8: 12, '8_': -12, '5_': -5, 'b7_': -2, '6_': -3, '7_': -2, '3_': -8 };

/**
 * A cell walked down from the root instead of up: the same chord tones or scale steps below it
 * (R 3 5 8 → R 7 5 3, R 2 3 5 → R 7 6 5, R 3 5 A → R 7 5 A); a leap to the octave drops to the
 * octave below (R 8 5 A → R 8_ 5_ A) or steps down (R 8 7 5 → R 7 6 5). Cells that open on the
 * octave already come down; null when the cell has no downward form.
 */
function mirrorCell(cell) {
  if (cell[0] !== 'R') return null;
  if (cell[1] === '8') return { 'R,8,5,A': ['R', '8_', '5_', 'A'], 'R,8,7,5': ['R', '7_', '6_', '5_'] }[cell.join()] ?? null;
  const map = cell.includes('2') || cell.includes('6') ? { 2: '7_', 3: '6_', 5: '5_' } : { 3: '7_', 5: '5_', 8: '3_' };
  const out = cell.map((t) => map[t] ?? t);
  return out.join() === cell.join() ? null : out;
}

/**
 * The octave of every root in a walking line and whether each chord walks up or down from it,
 * chosen for the whole line at once (dynamic programming): each bar runs into the next by step
 * or small leap, the line stays between the lowest string and C4, and the loop closes.
 */
function walkRegisters(ctx, chords, roots, cells, formula, { firstFixed = false, next = null } = {}) {
  const n = chords.length;
  if (n < 2 && !next) return { roots: [...roots], dirs: roots.map(() => 'up') };
  // enclosures need a note below every target
  const lowest = ctx.tuning[0] + (formula === 'enclosure' ? 2 : 0);
  const top = Math.min(60, Math.max(...ctx.tuning) + ctx.maxFret);
  const cellsOf = (c, ci) => (formula === 'twofeel' ? [c.beats <= 2 ? ['R'] : cells[ci % cells.length]]
    : c.beats <= 2 ? [['R', formula === 'ct' ? '5' : 'A']]
      : Array.from({ length: Math.ceil(c.beats / 4) }, (_, k) => cells[(ci + k) % cells.length]));
  const shapeOf = (c, cs) => {
    const offs = cs.flat().map((t) => WALK_OFF[t]).filter((o) => o != null);
    const lastTone = [...cs[cs.length - 1]].reverse().find((t) => WALK_OFF[t] != null) ?? 'R';
    const first = formula !== 'twofeel' && c.beats > 2 && cs[0][0] === '8' ? 12 : 0;
    return { first, last: WALK_OFF[lastTone], lo: Math.min(0, ...offs), hi: Math.max(0, ...offs) };
  };
  // states per chord: (root octave, direction)
  const states = chords.map((c, ci) => {
    const cs = cellsOf(c, ci);
    const dirs = [['up', cs]];
    const down = cs.map(mirrorCell);
    if (down.length && down.every(Boolean)) dirs.push(['down', down]);
    const out = [];
    for (const [dir, dcs] of dirs) {
      const sh = shapeOf(c, dcs);
      for (let m = lowest - sh.lo; m + sh.hi <= top; m++) if (T.mod(m - roots[ci], 12) === 0) out.push({ m, dir, sh });
    }
    // in a cycle of keys each key starts where the key before was told it would
    if (ci === 0 && firstFixed) {
      const fixed = out.filter((x) => x.m === roots[0] && x.dir === 'up');
      return fixed.length ? fixed.slice(0, 1) : [{ m: roots[0], dir: 'up', sh: shapeOf(c, cs) }];
    }
    return out.length ? out : [{ m: roots[ci], dir: 'up', sh: shapeOf(c, cs) }];
  });
  // leaving bar i on its last chord tone, entering bar j on its first note: a 5th or less is free
  // of penalty, anything wider costs more and more; a bar above G3 (the 12th fret of the G string)
  // costs more for each semitone, and a chord walks down only when that reads better
  const cost = (a, b2) => {
    const d = Math.abs(a.m + a.sh.last - (b2.m + b2.sh.first));
    return d + 3 * Math.max(0, d - 7) + 0.5 * Math.max(0, b2.m + b2.sh.hi - 55) + (b2.dir === 'down' ? 0.5 : 0);
  };
  let fin = null;
  for (const s0 of states[0]) {
    // the loop starts on the given root if nothing is gained by moving it
    let dp = [{ st: s0, c: (s0.m === roots[0] ? 0 : 3) + (s0.dir === 'down' ? 0.5 : 0), path: [s0] }];
    for (let j = 1; j < n; j++) {
      dp = states[j].map((st) => {
        let best = null;
        for (const v of dp) {
          const c = v.c + cost(v.st, st);
          if (!best || c < best.c) best = { st, c, path: [...v.path, st] };
        }
        return best;
      });
    }
    // the line closes on its own first chord, or leads into the next key's first chord (in the
    // octave that suits it best)
    const closes = next ? (next.cands || [next.midi]).map((m) => ({ m, dir: 'up', sh: s0.sh })) : [s0];
    for (const v of dp) {
      for (const close of closes) {
        const c = v.c + cost(v.st, close) - (close.dir === 'down' ? 0.5 : 0);
        if (!fin || c < fin.c) fin = { c, path: v.path, close: close.m };
      }
    }
  }
  return { roots: fin.path.map((x) => x.m), dirs: fin.path.map((x) => x.dir), nextMidi: fin.close };
}

/**
 * Walking bass over chords. formula: key of WALK_FORMULAS. 4-beat chords take
 * a 4-note cell; 2-beat chords take R + approach. Choices rotate deterministically.
 */
export function walkLine(b, chords, roots, formula = 'mixed', { triplets = false, next: nextKey = null, firstFixed = false } = {}) {
  const cells = WALK_FORMULAS[formula];
  const items = [];
  const lowest = b.ctx.tuning[0];
  const reg = walkRegisters(b.ctx, chords, roots, cells, formula, { firstFixed, next: nextKey });
  roots = reg.roots;
  const nextKeyMidi = nextKey ? reg.nextMidi ?? nextKey.midi : null;
  // the cell a chord plays, walked up or down from its root
  const cellAt = (ci, idx) => (reg.dirs[ci] === 'down' ? mirrorCell(cells[idx % cells.length]) || cells[idx % cells.length] : cells[idx % cells.length]);
  chords.forEach((c, ci) => {
    // after a key's last chord comes its first chord again, or in a cycle the next key's first chord
    const intoNextKey = ci === chords.length - 1 && nextKey;
    const next = intoNextKey ? nextKey.chord : chords[(ci + 1) % chords.length];
    // approach the note the next bar really starts on: the upper root when its cell opens on '8'
    // (after the last chord the line starts again with the first cell)
    const ni = (ci + 1) % chords.length;
    const nextCell = cells[ni % cells.length];
    const up8 = formula !== 'twofeel' && next.beats > 2 && nextCell[0] === '8' ? 12 : 0;
    const nextMidi = (intoNextKey ? nextKeyMidi : roots[ni]) + up8;
    const start = items.length;
    // a dominant with ♭9, or one resolving down a 5th to a minor chord, walks with ♭9 and ♭13
    const toMinor = ['min7', 'min6', 'mMaj7', 'm7b5', 'min'].includes(next.type) && T.mod(T.pc(next.root) - T.pc(c.root), 12) === 5;
    const flatTensions = c.type === 'm7b5' || c.ivs.includes('b9') || (c.type.startsWith('dom') && toMinor);
    // scale steps for walking: the 2 and 6 of the chord's mode by function (iii Phrygian, vi and a
    // minor key's i Aeolian, iiø Locrian, V of a minor chord Phrygian dominant); the 7 follows the chord
    const mode = T.SCALES[modeFor(c, next)];
    const seven = mode && mode.iv.length === 7 && !flatTensions;
    const scaleIv = (tok) => {
      if (tok === '2') return seven ? mode.iv[1] : flatTensions ? 'b2' : '2';
      if (tok === '6') return seven ? mode.iv[5] : flatTensions ? 'b6' : '6';
      return null;
    };
    const res = (tok, tg = null) => {
      // the note an approach leads to: the next chord, or (inside a long chord) its own next bar
      const tRoot = tg ? tg.root : next.root, tMidi = tg ? tg.midi : nextMidi;
      // scale steps below the root (a cell walked down): the 6 of the chord's mode, an octave lower
      const lower = tok === '6_';
      const special = scaleIv(lower ? '6' : tok);
      if (special) {
        const m = roots[ci] + T.semis(special) - (lower ? 12 : 0);
        // on a dominant the altered steps are named as tensions (♭9, ♭13)
        const deg = c.type.startsWith('dom') && (special === 'b2' || special === 'b6') ? (special === 'b2' ? '♭9' : '♭13') : T.fmtDeg(special);
        return { midi: m, n: T.up(c.root, special), deg };
      }
      if (tok === '7' && !c.ivs.find((x) => /7$/.test(x))) tok = 'b7';
      if (tok === '7_' && !c.ivs[3]) tok = 'b7_';
      let r = resolveToken(tok, c, roots[ci], tRoot, tMidi);
      const prevMidi = items.length ? items[items.length - 1].midi : null;
      // the dominant approach (the next chord's 5th) cannot be the chord just stated (E7 → Am: E)
      if (r && tok === 'D' && T.mod(r.midi - roots[ci], 12) === 0) r = resolveToken('A', c, roots[ci], tRoot, tMidi);
      if (r && (tok === 'A' || tok === 'Ab' || r.deg === '→')) {
        // an approach is never the note just played (in any octave), never the current chord's
        // root (the bar has stated it), never below the lowest string and never more than an octave
        // from the note before it (into a new key a register lower: from above instead)
        const bad = (m) => m < lowest || (prevMidi != null && (T.mod(m - prevMidi, 12) === 0 || Math.abs(m - prevMidi) > 12)) || T.mod(m - roots[ci], 12) === 0;
        if (bad(r.midi)) {
          // from above (the first note of an enclosure): a whole step above, so the enclosure still
          // closes in from both sides; from below: the whole step below after a note from above
          // (the end of an enclosure), else the half step above
          const fromAbove = prevMidi != null && prevMidi > tMidi;
          // enclosures keep their shape (a whole step above); other lines prefer the half step below
          // (outside enclosures a half step always comes first)
          const offs = tok === 'Ab' ? (formula === 'enclosure' ? [2, -1, -2] : [-1, 2, -2])
            : formula === 'enclosure' && fromAbove ? [-2, 1, 2] : [1, -2, 2];
          const m = offs.map((o) => tMidi + o).find((x) => !bad(x));
          // spelled as a step from the target (F♯ a whole step above E, not G♭)
          if (m != null) r = { midi: m, n: stepSpell(m, tRoot, tMidi), deg: '→' };
        }
        // an approach note that is also a chord tone is spelled as that chord tone (B♭ under B♭7),
        // unless that needs a double sharp/flat (then the plain name reads better)
        const ct = c.ivs.find((iv) => T.mod(T.semis(iv), 12) === T.mod(r.midi - roots[ci], 12));
        const asCt = ct && T.up(c.root, ct === '8' ? '1' : ct);
        if (asCt && Math.abs(asCt.a) < 2) r = { ...r, n: asCt };
      }
      return r;
    };
    if (formula === 'twofeel') {
      const cell = cellAt(ci, ci);
      const halves = Math.max(1, Math.round(c.beats / 2));
      for (let hh = 0; hh < halves; hh++) {
        const tok = hh === 0 ? cell[0] : hh === halves - 1 ? cell[1] : (hh % 2 ? (reg.dirs[ci] === 'down' ? '5_' : '5') : 'R');
        items.push({ ...res(tok), dur: c.beats / halves, chord: hh === 0 ? c.sym : undefined });
      }
      fixLast();
      return;
    }
    if (c.beats <= 2) {
      items.push({ ...res('R'), dur: 1, chord: c.sym });
      // chord tones only: R and 5 (or 3); the other lines approach the next root
      // (the 5th below when the line is walking down: R–5 then down a 5th would leap a 9th)
      items.push({ ...res(formula === 'ct' ? (reg.dirs[ci] === 'down' ? '5_' : '5') : ci % 2 ? 'Ab' : 'A'), dur: 1 });
      fixLast();
      return;
    }
    let left = c.beats;
    let k = 0;
    while (left > 0) {
      const cell = cellAt(ci, ci + k);
      cell.forEach((tok, i) => {
        const isLastCell = left <= 4;
        let t = tok;
        // in the first bar of a long chord an approach leads to its own root in the next bar
        let tg = null;
        if (!isLastCell && (t === 'A' || t === 'Ab')) tg = { root: c.root, midi: roots[ci] + (cellAt(ci, ci + k + 1)[0] === '8' ? 12 : 0) };
        else if (!isLastCell && t === 'D') t = reg.dirs[ci] === 'down' ? '5_' : '5';
        const p = res(t, tg);
        if (triplets && i === 2 && ci % 2 === 1) {
          // triplet "skip": the beat is split into a note and a ghosted repeat
          items.push({ ...p, dur: 2 / 3 });
          items.push({ ...p, dur: 1 / 3, tag: 'x' });
        } else {
          items.push({ ...p, dur: 1, chord: i === 0 && k === 0 ? c.sym : undefined });
        }
      });
      left -= 4;
      k++;
    }
    fixLast();
    // the last note of the chord never repeats the pitch the next chord starts on: chord-tone
    // lines take another chord tone, the others approach it
    function fixLast() {
      const last = items[items.length - 1];
      if (items.length <= start || !last || last.rest || last.deg === '→') return;
      if (items.length - start === 1) return;
      if (T.mod(last.midi - nextMidi, 12) !== 0) return;
      // the chord tone nearest both neighbours, above or below the root
      const before = items.length > start + 1 ? items[items.length - 2].midi : roots[ci];
      const near = (x) => Math.abs(x.midi - before) + Math.abs(x.midi - nextMidi);
      const alt = formula === 'ct'
        ? ['3', '5', '3_', '5_'].map((t) => res(t)).filter((x) => x && x.midi >= lowest && T.mod(x.midi - nextMidi, 12) !== 0 && T.mod(x.midi - before, 12) !== 0).sort((x, y) => near(x) - near(y))[0]
        : res('A');
      if (alt) items[items.length - 1] = { ...last, ...alt, tag: undefined };
    }
  });
  emitMixed(b, items, { center: 4 });
  return nextKeyMidi;
}

// ------------------------------------------------------------------ chord sequence engines

/** Fingers for a compact chord shape: index on the lowest fret, pinky stretches. */
export function shapeFingers(pos) {
  const fr = pos.filter((p) => p.f > 0).map((p) => p.f);
  const lo = fr.length ? Math.min(...fr) : 0;
  return pos.map((p) => (p.f === 0 ? 0 : Math.min(4, p.f - lo + 1)));
}

/** Emit chord tones at explicit positions, fingers from the shape. */
export function emitShapeF(b, root, ivs, pos, order, extra = {}) {
  const fingers = shapeFingers(pos);
  b.frets(order.map((i) => ({
    s: pos[i].s, f: pos[i].f, finger: fingers[i], n: T.up(root, ivs[i] === '8' ? '1' : ivs[i]), deg: T.fmtDeg(ivs[i]),
  })), extra);
}

/** All voicings (inversion x octave) of a chord whose tones fit in [lo, hi]. */
export function voicings(root, ivs, lo, hi, { rootOnly = false } = {}) {
  const pcv = T.pc(root);
  const out = [];
  for (let rm = lo - 24; rm <= hi; rm++) {
    if (T.mod(rm, 12) !== pcv) continue;
    for (let inv = 0; inv < (rootOnly ? 1 : ivs.length); inv++) {
      const tones = chordTones(root, ivs, rm, ivs.map((_, i) => i), inv);
      if (tones[0].midi < lo || tones[tones.length - 1].midi > hi) continue;
      out.push({ rootMidi: rm, inv, tones });
    }
  }
  return out;
}

/**
 * Voice-led chord sequence. chords: [{root, ivs, sym}]. Each chord's first
 * played tone (per `order`) lands as close as possible to the previous note.
 * order(i, n) -> tone indices. Returns pitch items for emitMixed.
 */
/**
 * The tone indices for one chord: its order, continued for `m` notes by walking back and forth
 * (an arpeggio that starts upwards reaches the octave, then turns: R-3-5-7-8-7-5-3).
 */
function fillOrder(ord, m, extend = true) {
  if (m <= ord.length) return ord.slice(0, m);
  const lo = Math.min(...ord);
  const hi = Math.max(...ord) + (extend && ord[1] > ord[0] ? 1 : 0);
  const seq = [...ord];
  let dir = Math.sign(seq[seq.length - 1] - seq[seq.length - 2]) || 1;
  while (seq.length < m) {
    let next = seq[seq.length - 1] + dir;
    if (next > hi || next < lo) { dir = -dir; next = seq[seq.length - 1] + dir; }
    seq.push(next);
  }
  return seq;
}

/**
 * A voice-led line: each chord starts on the voicing whose first note is nearest the last note.
 * `per`: notes per beat, so each chord fills its own length (written 8ths: per 2); without it,
 * one pass of the order per chord, one step each.
 */
export function voiceLedItems(chords, { order, lo = 31, hi = 55, rootOnly = false, start = 40, per = 0 }) {
  const items = [];
  let prev = null;
  chords.forEach((c, i) => {
    const ivs = c.ivs.length > 4 ? c.ivs.filter((iv) => iv !== '5') : c.ivs;
    const vs = voicings(c.root, ivs, lo, hi, { rootOnly });
    const ord = order(i, ivs.length);
    let best = null;
    const n = ivs.length;
    for (const v of vs) {
      const first = v.tones[ord[0] % n].midi + Math.floor(ord[0] / n) * 12;
      const d = Math.abs(first - (prev ?? start)) + (rootOnly ? 0 : v.inv * 0.01);
      if (!best || d < best.d) best = { d, v };
    }
    if (!best) return;
    // (filling a long chord climbs one chord tone past the voicing, unless that leaves the register)
    const nt = best.v.tones.length, ext = Math.max(...ord) + 1;
    const extMidi = best.v.tones[ext % nt].midi + Math.floor(ext / nt) * 12;
    (per ? fillOrder(ord, Math.max(1, Math.round(c.beats * per)), extMidi <= hi) : ord).forEach((ti, k) => {
      const t = best.v.tones[ti % best.v.tones.length];
      const up = Math.floor(ti / best.v.tones.length) * 12;
      items.push({ midi: t.midi + up, n: t.n, deg: t.deg, dur: per ? 1 / per : 1, chord: k === 0 ? c.sym : undefined });
    });
    prev = items[items.length - 1].midi;
  });
  return items;
}

/**
 * Diatonic stacks: chords built on each degree of a 7-note scale from scale
 * offsets (e.g. [0,2,4] triads, [0,3,4] sus4, [0,3,6] quartal).
 * Returns [{k, idxs (scale indices), root, ivs, sym, roman}].
 */
export function diatonicStacks(tonic, scaleType, offsets, S, { inversion = 0 } = {}) {
  const len = T.SCALES[scaleType].iv.length;
  const res = [];
  const h = T.harmonize(tonic, scaleType, Math.max(3, offsets.length));
  for (let k = 0; k < len; k++) {
    // inversions stay close to the root: 1st inversion climbs above it,
    // 2nd/3rd inversions take the 5th/7th from below
    let idxs = offsets.map((o) => k + o);
    if (inversion === 1) idxs = [...idxs.slice(1), idxs[0] + len];
    else if (inversion >= 2 && inversion < idxs.length) {
      idxs = [...idxs.slice(inversion).map((x) => x - len), ...idxs.slice(0, inversion)];
    }
    const root = T.up(tonic, T.SCALES[scaleType].iv[k]);
    const ivs = offsets.map((o) => T.ivBetween(root, T.up(tonic, T.SCALES[scaleType].iv[(k + o) % len])));
    const type = T.detectChord(ivs) || T.detectChord([...new Set(ivs)].sort((a, c) => T.semis(a) - T.semis(c)));
    const sym = type ? chordName(root, type, S) : `${nm(root, S)}(${ivs.slice(1).map(T.fmtDeg).join(' ')})`;
    const roman = type ? T.roman(tonic, root, k, type) : h[k].roman.replace(/[°+]|maj7|ø7|7/g, '');
    res.push({ k, idxs, root, ivs, type, sym, roman });
  }
  return res;
}

/** Pitch of scale index `idx` labelled relative to a chord root. */
export function scaleTone(tonic, scaleType, tonicMidi, idx, chordRoot) {
  const p = T.scalePitch(tonic, scaleType, tonicMidi, idx);
  const iv = T.ivBetween(chordRoot, p.n);
  return { midi: p.midi, n: p.n, deg: T.fmtDeg(iv) };
}

/** Degree sequence for diatonic exercises (0 = I ... 7 = I up an octave). */
export const DEG_SEQ = {
  up: [0, 1, 2, 3, 4, 5, 6, 7],
  down: [7, 6, 5, 4, 3, 2, 1, 0],
  updown: [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0],
  fourths: [0, 3, 6, 2, 5, 1, 4, 7],
  fifths: [0, 4, 1, 5, 2, 6, 3, 7],
};
export const degSeqP = sel('Chord order', [
  ['up', 'I → I (ascending)'], ['down', 'I → I (descending)'], ['updown', 'Up & back'],
  ['fourths', 'In 4ths (degrees 1-4-7-3-6-2-5-1)'], ['fifths', 'In 5ths (degrees 1-5-2-6-3-7-4-1)'],
]);
