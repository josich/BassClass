// Shared helpers for curriculum modules: params, key handling, zones, progressions,
// and the groove/walking line engines.
import * as T from '../theory.js';
import { shapes, place } from '../fretboard.js';
import {
  Builder, keysFor, rootOn, scaleRun, scaleSeq, chordTones, ARP_SHAPES, SCALE_PATTERNS,
  diatonicChords, nearestVoicing, pitchIn, spellMidi, P, fitShift,
} from '../builder.js';

export {
  fitShift,
  T, Builder, keysFor, rootOn, scaleRun, scaleSeq, chordTones, ARP_SHAPES, SCALE_PATTERNS,
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

/** Select parameter from [[value, label], ...]. */
export const sel = (label, options, def) => ({ kind: 'select', label, options, default: def ?? options[0][0] });

export const nm = (n, S) => T.noteName(n, S.notation);
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
  ['dim7', 'Diminished 7'], ['mMaj7', 'Minor-major 7'], ['maj7s5', 'Maj7♯5'], ['maj6', 'Major 6'], ['min6', 'Minor 6'],
];
export const ZONES = { '1': [1, 5], '2': [5, 9], '3': [8, 12], '4': [12, 16] };
export const zoneP = sel('Zone', [
  ['1', 'Zone 1 · frets 1–5'], ['2', 'Zone 2 · frets 5–9'], ['3', 'Zone 3 · frets 8–12'], ['4', 'Zone 4 · frets 12–16'],
]);
export const rootStrP = (def = 'A') => sel('Root on', [['E', 'E string'], ['A', 'A string'], ['D', 'D string']], def);
export const octP = (def = '1') => sel('Range', [['1', '1 octave'], ['2', '2 octaves']], def);
export const dirP = sel('Direction', [['updown', 'Up & down'], ['up', 'Up'], ['down', 'Down']]);
export const orderP = sel('Key order', [['cycle4', 'Cycle of 4ths'], ['cycle5', 'Cycle of 5ths'], ['chromatic', 'Chromatic']]);

export const SCALE_TYPE_OPTS = (list) => list.map((k) => [k, T.SCALES[k].name]);
export const SHORT = {
  ionian: 'major', aeolian: 'minor', harmonicMinor: 'harm. minor', melodicMinor: 'mel. minor',
  majorPent: 'maj. pent', minorPent: 'min. pent', blues: 'blues', majorBlues: 'maj. blues',
};
export const scaleShort = (type) => SHORT[type] || T.SCALES[type].name.split(' (')[0].toLowerCase();

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
  'I-IV-V-I': { name: 'I – IV – V – I', chords: [['1', 'maj7'], ['4', 'maj7'], ['5', 'dom7'], ['1', 'maj7']] },
  'I-V-vi-IV': { name: 'I – V – vi – IV (pop)', chords: [['1', 'maj7'], ['5', 'dom7'], ['6', 'min7'], ['4', 'maj7']] },
  'I-vi-IV-V': { name: 'I – vi – IV – V (50s)', chords: [['1', 'maj7'], ['6', 'min7'], ['4', 'maj7'], ['5', 'dom7']] },
  'vi-IV-I-V': { name: 'vi – IV – I – V', chords: [['6', 'min7'], ['4', 'maj7'], ['1', 'maj7'], ['5', 'dom7']] },
  'I-bVII-IV-I': { name: 'I – ♭VII – IV – I (rock)', chords: [['1', 'maj7'], ['b7', 'maj7'], ['4', 'maj7'], ['1', 'maj7']] },
  canon: { name: 'Canon (I–V–vi–iii–IV–I–IV–V)', chords: [['1', 'maj7'], ['5', 'dom7'], ['6', 'min7'], ['3', 'min7'], ['4', 'maj7'], ['1', 'maj7'], ['4', 'maj7'], ['5', 'dom7']] },
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
  'i-bVII-bVI-V': { name: 'Andalusian i – ♭VII – ♭VI – V', minor: true, chords: [['1', 'min7'], ['b7', 'dom7'], ['b6', 'maj7'], ['5', 'dom7']] },
  'i-bVI-bIII-bVII': { name: 'i – ♭VI – ♭III – ♭VII (epic minor)', minor: true, chords: [['1', 'min7'], ['b6', 'maj7'], ['b3', 'maj7'], ['b7', 'dom7']] },
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
    name: 'ii–V–I–IV–iiø–V–i (relative minor cycle)', chords: [['2', 'min7'], ['5', 'dom7'], ['1', 'maj7'], ['4', 'maj7'],
      ['7', 'm7b5'], ['3', 'dom7'], ['6', 'min7'], ['6', 'min7']],
  },
  'rhythm-A': {
    name: 'Rhythm changes (A section)', chords: [['1', 'maj7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2],
      ['3', 'min7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2], ['1', 'maj7', 2], ['1', 'dom7', 2], ['4', 'maj7', 2], ['4', 'min7', 2],
      ['3', 'min7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2]],
  },
  'ii-V7alt-I': { name: 'ii – V7alt (♯9) – I', chords: [['2', 'min7'], ['5', 'dom7s9'], ['1', 'maj7', 8]] },
  'ii-V7b9-I': { name: 'ii – V7♭9 – I', chords: [['2', 'min7'], ['5', 'dom7b9'], ['1', 'maj7', 8]] },
  'ii-V7s5-I': { name: 'ii – V7♯5 – I', chords: [['2', 'min7'], ['5', 'dom7s5'], ['1', 'maj7', 8]] },
  'ii-V7b5-I': { name: 'ii – V7♭5 – I', chords: [['2', 'min7'], ['5', 'dom7b5'], ['1', 'maj7', 8]] },
  'vamp-min': { name: 'One-chord minor vamp (4 bars)', minor: true, chords: [['1', 'min7', 16]] },
  'vamp-dom': { name: 'One-chord dominant vamp (4 bars)', chords: [['1', 'dom7', 16]] },
  'i-iv-v-min': { name: 'i – iv – v – i (minor)', minor: true, chords: [['1', 'min7'], ['4', 'min7'], ['5', 'min7'], ['1', 'min7']] },
  'cycle-dom7': {
    name: 'Dominant 7ths around the cycle', chords: [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7].map((o) => [o, 'dom7']),
  },
  'cycle-251': {
    name: 'ii–V–I in all 12 keys', chords: [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7].flatMap((o) => [[o + 2, 'min7', 2], [o + 7, 'dom7', 2], [o, 'maj7']]),
  },
  'giant-steps': {
    name: 'Coltrane changes (Giant Steps)', chords: [
      [0, 'maj7', 2], [3, 'dom7', 2], [8, 'maj7', 2], [11, 'dom7', 2], [4, 'maj7'], [10, 'min7', 2], [3, 'dom7', 2],
      [8, 'maj7', 2], [11, 'dom7', 2], [4, 'maj7', 2], [7, 'dom7', 2], [0, 'maj7'], [6, 'min7', 2], [11, 'dom7', 2],
      [4, 'maj7'], [10, 'min7', 2], [3, 'dom7', 2], [8, 'maj7'], [2, 'min7', 2], [7, 'dom7', 2],
      [0, 'maj7'], [6, 'min7', 2], [11, 'dom7', 2], [4, 'maj7'], [2, 'min7', 2], [7, 'dom7', 2]],
  },
};

export const progP = (keys, def) => sel('Progression', keys.map((k) => [k, PROGS[k].name]), def || keys[0]);

const TRIAD_OF = { maj7: 'maj', dom7: 'maj', min7: 'min', m7b5: 'dim', dim7: 'dim', mMaj7: 'min', maj6: 'maj', min6: 'min', maj7s5: 'aug' };
export const toTriad = (type) => TRIAD_OF[type] || type;

/**
 * Resolve a progression in a key (pc) to chords: { root, type, beats, ivs, sym }.
 * Interval-string chords are spelled from the tonic; semitone chords get best spelling.
 */
export function progChords(progKey, tonicPc, { triads = false, S = {} } = {}) {
  const prog = PROGS[progKey];
  const tonic = T.bestRoot(tonicPc, prog.minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv);
  return prog.chords.map(([where, type0, beats = 4]) => {
    const type = triads ? toTriad(type0) : type0;
    const ivs = T.CHORDS[type].iv;
    const root = typeof where === 'number'
      ? T.bestRoot(T.mod(tonicPc + where, 12), ivs)
      : T.up(tonic, where);
    return { root, type, beats, ivs, sym: chordName(root, type, S) };
  });
}

/** Pick bass-register root midis: each nearest to the previous within [lo, hi]. */
export function chordRootMidis(chords, { lo = 28, hi = 45, firstLo = 28, firstHi = 39 } = {}) {
  let prev = null;
  return chords.map((c) => {
    const pcv = T.pc(c.root);
    let best = null;
    const a = prev == null ? firstLo : lo, z = prev == null ? firstHi : hi;
    for (let m = a; m <= z; m++) {
      if (T.mod(m, 12) !== pcv) continue;
      const d = prev == null ? m : Math.abs(m - prev);
      if (!best || d < best.d) best = { d, m };
    }
    if (!best) best = { m: lo + T.mod(pcv - lo, 12) };
    prev = best.m;
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
export function resolveToken(tok, chord, rootMidi, nextRoot, nextMidi) {
  const ivs = chord.ivs;
  const third = ivs[1] || '3';
  const fifth = ivs[2] || '5';
  const seventh = ivs[3] && /7$/.test(ivs[3]) ? ivs[3] : 'b7';
  let iv = null, below = false;
  switch (tok) {
    case '3': iv = third; break;
    case '5': iv = fifth; break;
    case '7': iv = seventh; break;
    case '10': iv = third === 'b3' ? 'b10' : '10'; break;
    case '5_': iv = fifth; below = true; break;
    case 'b7_': iv = 'b7'; below = true; break;
    case '6_': iv = '6'; below = true; break;
    case '7_': iv = seventh; below = true; break;
    default: iv = TOKEN_IV[tok];
  }
  if (tok === 'A' || tok === 'Ab') {
    const m = nextMidi + (tok === 'A' ? -1 : 1);
    return { midi: m, n: spellMidi(m, tok === 'Ab'), deg: '→' };
  }
  if (tok === 'N') return { midi: nextMidi, n: nextRoot, deg: 'R' };
  if (tok === 'D') {
    const m = nextMidi + 7 > rootMidi + 9 ? nextMidi - 5 : nextMidi + 7;
    return { midi: m, n: T.up(nextRoot, '5'), deg: '5→' };
  }
  if (tok === 'x') return { midi: rootMidi, n: chord.root, deg: 'x', tag: 'x' };
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
export function grooveLine(b, chords, roots, pattern, { tags = true, place: popts = {} } = {}) {
  const pitches = [];
  chords.forEach((c, ci) => {
    const nextC = chords[(ci + 1) % chords.length];
    const nextMidi = roots[(ci + 1) % chords.length];
    let beatsLeft = c.beats;
    let barIdx = 0;
    let first = true;
    while (beatsLeft > 1e-9) {
      const bar = pattern[barIdx % pattern.length];
      for (const [tok, dur, tag] of bar) {
        if (beatsLeft <= 1e-9) break;
        const d = Math.min(dur, beatsLeft);
        beatsLeft -= d;
        if (tok === '-') {
          pitches.push({ rest: true, dur: d, chord: first ? c.sym : undefined });
        } else {
          const p = resolveToken(tok, c, roots[ci], nextC.root, nextMidi);
          pitches.push({ ...p, dur: d, chord: first ? c.sym : undefined, tag: p.tag === 'x' ? 'x' : (tags && tag) || p.tag });
        }
        first = false;
      }
      barIdx++;
    }
  });
  emitMixed(b, pitches, popts);
}

/** Emit a list of pitches/rests (with per-item durations) placed as one melodic line. */
export function emitMixed(b, items, popts = {}) {
  const { fold = true, ...placeOpts } = popts;
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
  const pos = place(midis, b.ctx, { open: 'allow', center: 4, ...placeOpts });
  let k = 0;
  for (const it of items) {
    if (it.chord) b.chord(it.chord);
    if (it.text) b.text(it.text);
    if (it.rest) { b.rest(it.dur); continue; }
    const p = pos[k++];
    b.frets([{ s: p.s, f: p.f, finger: p.finger, n: it.n, deg: it.deg, tag: it.tag, dur: it.dur, accent: it.accent }]);
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

/**
 * Walking bass over chords. formula: key of WALK_FORMULAS. 4-beat chords take
 * a 4-note cell; 2-beat chords take R + approach. Choices rotate deterministically.
 */
export function walkLine(b, chords, roots, formula = 'mixed', { triplets = false } = {}) {
  const cells = WALK_FORMULAS[formula];
  const items = [];
  chords.forEach((c, ci) => {
    const next = chords[(ci + 1) % chords.length];
    const nextMidi = roots[(ci + 1) % chords.length];
    const scaleIv = (tok) => {
      // scale steps for walking: 2 and 6 from the chord's parent mode, 7 follows chord
      if (tok === '2') return c.type === 'm7b5' ? 'b2' : '2';
      if (tok === '6') return c.type === 'm7b5' ? 'b6' : '6';
      return null;
    };
    const res = (tok) => {
      const special = scaleIv(tok);
      if (special) {
        const m = roots[ci] + T.semis(special);
        return { midi: m, n: T.up(c.root, special), deg: T.fmtDeg(special) };
      }
      if (tok === '7' && !c.ivs.find((x) => /7$/.test(x))) tok = 'b7';
      return resolveToken(tok, c, roots[ci], next.root, nextMidi);
    };
    if (formula === 'twofeel') {
      const cell = cells[ci % cells.length];
      const per = c.beats / 2;
      cell.forEach((tok, i) => items.push({ ...res(tok), dur: per, chord: i === 0 ? c.sym : undefined }));
      return;
    }
    if (c.beats <= 2) {
      items.push({ ...res('R'), dur: 1, chord: c.sym });
      items.push({ ...res(ci % 2 ? 'Ab' : 'A'), dur: 1 });
      return;
    }
    let left = c.beats;
    let k = 0;
    while (left > 0) {
      const cell = cells[(ci + k) % cells.length];
      cell.forEach((tok, i) => {
        const isLastCell = left <= 4;
        let t = tok;
        if (!isLastCell && (t === 'A' || t === 'Ab' || t === 'D')) t = '5';
        const p = res(t);
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
  });
  emitMixed(b, items, { center: 4 });
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
export function voiceLedItems(chords, { order, lo = 31, hi = 55, rootOnly = false, start = 40 }) {
  const items = [];
  let prev = null;
  chords.forEach((c, i) => {
    const vs = voicings(c.root, c.ivs, lo, hi, { rootOnly });
    const ord = order(i, c.ivs.length);
    let best = null;
    const n = c.ivs.length;
    for (const v of vs) {
      const first = v.tones[ord[0] % n].midi + Math.floor(ord[0] / n) * 12;
      const d = Math.abs(first - (prev ?? start)) + (rootOnly ? 0 : v.inv * 0.01);
      if (!best || d < best.d) best = { d, v };
    }
    if (!best) return;
    ord.forEach((ti, k) => {
      const t = best.v.tones[ti % best.v.tones.length];
      const up = Math.floor(ti / best.v.tones.length) * 12;
      items.push({ midi: t.midi + up, n: t.n, deg: t.deg, dur: 1, chord: k === 0 ? c.sym : undefined });
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
    const type = T.detectChord(ivs);
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
  ['fourths', 'In 4ths (I-IV-vii°-iii-vi-ii-V-I)'], ['fifths', 'In 5ths (I-V-ii-vi-iii-vii°-IV-I)'],
]);
