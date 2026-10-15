// Exercise builder + reusable musical pattern generators used by the curriculum.
import * as T from './theory.js';
import { place, assignFingers } from './fretboard.js';

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Spell a raw midi pitch chromatically. */
export const spellMidi = (midi, flats = false) => T.N((flats ? FLAT_NAMES : SHARP_NAMES)[T.mod(midi, 12)]);

/** Pitch object from midi with optional degree label. */
export const P = (midi, n, deg) => ({ midi, n: n || spellMidi(midi), deg });

/** Pitch spelled relative to a root (degree computed). */
export function pitchIn(root, rootMidi, midi, flats = false) {
  const off = T.mod(midi - rootMidi, 12);
  const ivs = ['1', 'b2', '2', 'b3', '3', '4', flats ? 'b5' : '#4', '5', flats ? 'b6' : '#5', '6', 'b7', '7'];
  const iv = ivs[off];
  return { midi, n: T.up(root, iv), deg: T.fmtDeg(iv) };
}

/** Midi of a pitch class on a given string within a fret range. */
export function rootOn(ctx, pcv, string = 'E', { minFret = 1, maxFret = 13 } = {}) {
  let s = ctx.str(string);
  if (s < 0) s = 0;
  const open = ctx.tuning[s];
  let f = T.mod(pcv - open, 12);
  while (f < minFret) f += 12;
  if (f > maxFret && f - 12 >= 0) f -= 12;
  return open + f;
}

/** Fret of a midi on a named string. */
export const fretOn = (ctx, midi, string) => midi - ctx.tuning[ctx.str(string)];

// chord tones and natural tensions keep their academic spelling even in jazz exercises
const CORE_DEGREES = new Set(['R', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13']);
// a ♭3 (♭10) is a chord tone only on a minor-type chord (over a major or dominant chord it is a
// blue note), the ♭5 only on half-diminished and diminished chords (on a dominant it is an
// alteration), and the ♭7 on anything but a major chord (over Cmaj7 or C it is a blue note)
const MINOR_CHORD = /^[A-G][♭♯]*(?:m(?!aj)|°|ø|min)/;
const DIM_CHORD = /°|ø|m7?♭5/;
const MAJOR_CHORD = /^[A-G][♭♯]*(?:maj7?|maj9|maj13|6|add9)?(?:$|\s|\/|\()/;
function chordTone(deg, sym) {
  if (CORE_DEGREES.has(deg)) return true;
  if (deg === '♭3' || deg === '♭10') return MINOR_CHORD.test(sym);
  if (deg === '♭5') return DIM_CHORD.test(sym);
  if (deg === '♭7') return !MAJOR_CHORD.test(sym);
  return false;
}

export class Builder {
  /**
   * Notes keep their academic spelling (G♯ harmonic minor has F𝄪, the 3rd of D♯7 is F𝄪).
   * jazz: in chord-progression exercises, a double sharp/flat on an altered note (♭9, ♯9, ♭5, ♯5,
   * ♭13, ♯11), on a diminished 7th, a blue note or a passing note is written as its plain
   * enharmonic, the way jazz players write it (A♭7♭9: A, not B𝄫; C°7: C E♭ G♭ A; E♭7's ♭13: B, not C♭).
   * plain: scales with more or fewer notes than letters (symmetric, Messiaen, augmented): every
   * double accidental and C♭ F♭ E♯ B♯ is written plainly (D♭ whole tone: D♭ E♭ F G A B).
   */
  constructor(ctx, settings = {}, { jazz = false, plain = false } = {}) {
    this.ctx = ctx;
    this.settings = settings;
    this.jazz = jazz;
    this.plain = plain;
    this.curChord = '';
    this.steps = [];
    this.pendingChord = null;
    this.pendingText = null;
  }

  chord(sym, text) { this.pendingChord = sym; if (text) this.pendingText = text; return this; }
  text(t) { this.pendingText = t; return this; }

  _push(step) {
    if (this.pendingChord) { step.chord = this.pendingChord; this.pendingChord = null; this.curChord = String(step.chord); }
    if (this.plain) {
      for (const n of step.notes) if (n.n && T.awkward(n.n)) n.n = T.readable(n.n);
    } else if (this.jazz) {
      for (const n of step.notes) if (n.n && !chordTone(n.deg, this.curChord) && T.awkward(n.n)) n.n = T.readable(n.n);
    }
    if (this.pendingText) { step.text = this.pendingText; this.pendingText = null; }
    this.steps.push(step);
  }

  /**
   * Add pitches as consecutive single-note steps.
   * opts.place: placement options (see fretboard.place)
   * opts.pattern: true => every distinct pitch gets one fixed position (box/pattern fingering)
   * opts.dur: duration in units (subdivisions for uniform exercises, beats otherwise)
   */
  line(pitches, opts = {}) {
    const { dur = 1, pattern = true } = opts;
    const popts = { ...(opts.place || {}) };
    const shift = fitShift(pitches.map((p) => p.midi), this.ctx);
    if (shift) {
      pitches = pitches.map((p) => ({ ...p, midi: p.midi + shift }));
      if (popts.pin) popts.pin = Object.fromEntries(Object.entries(popts.pin).map(([m, s]) => [Number(m) + shift, s]));
    }
    let positions;
    if (pattern && popts.string == null) {
      const uniq = [...new Set(pitches.map((p) => p.midi))].sort((a, b) => a - b);
      const placed = place(uniq, this.ctx, popts);
      const map = new Map(uniq.map((m, i) => [m, placed[i]]));
      positions = pitches.map((p) => map.get(p.midi));
    } else {
      positions = place(pitches.map((p) => p.midi), this.ctx, popts);
    }
    pitches.forEach((p, i) => {
      const pos = positions[i];
      const note = { midi: p.midi, n: p.n, deg: p.deg, s: pos.s, f: pos.f, finger: p.finger ?? pos.finger };
      if (p.tag) note.tag = p.tag;
      if (p.play != null) note.play = p.play;
      const step = { notes: [note], dur: p.dur ?? dur };
      if (p.accent) step.accent = true;
      if (p.fill) step.fill = true;
      if (p.vel != null) step.vel = p.vel;
      if (p.chord) this.pendingChord = p.chord;
      if (p.text) this.pendingText = p.text;
      this._push(step);
    });
    return this;
  }

  /** Add explicit string/fret positions: items {s, f, deg?, n?, tag?, finger?, dur?}. */
  frets(items, opts = {}) {
    const { dur = 1, flats = false } = opts;
    for (const it of items) {
      const midi = this.ctx.tuning[it.s] + it.f;
      const note = { midi, n: it.n || spellMidi(midi, flats), deg: it.deg, s: it.s, f: it.f };
      if (it.tag) note.tag = it.tag;
      if (it.finger != null) note.finger = it.finger;
      if (it.play != null) note.play = it.play;
      const step = { notes: [note], dur: it.dur ?? dur };
      if (it.accent) step.accent = true;
      if (it.vel != null) step.vel = it.vel;
      if (it.chord) this.pendingChord = it.chord;
      if (it.text) this.pendingText = it.text;
      this._push(step);
    }
    return this;
  }

  /** One step with several simultaneous notes (double stops). */
  stack(pitches, opts = {}) {
    const { dur = 1 } = opts;
    if (pitches.every((p) => p.s != null)) {
      const notes = pitches.map((p) => ({ midi: this.ctx.tuning[p.s] + p.f, n: p.n || spellMidi(this.ctx.tuning[p.s] + p.f), deg: p.deg, s: p.s, f: p.f, tag: p.tag }));
      const step = { notes, dur: opts.dur ?? dur };
      if (opts.accent) step.accent = true;
      this._push(step);
      return this;
    }
    const positions = place(pitches.map((p) => p.midi), this.ctx, { open: 'avoid', ...(opts.place || {}) });
    // two notes cannot share a string: nudge if the search did so
    const used = new Set();
    const notes = pitches.map((p, i) => {
      let pos = positions[i];
      if (used.has(pos.s)) {
        const alt = this.ctx.tuning.map((o, s) => ({ s, f: p.midi - o })).filter((c) => c.f >= 0 && !used.has(c.s));
        if (alt.length) pos = alt.sort((a, b) => Math.abs(a.f - positions[0].f) - Math.abs(b.f - positions[0].f))[0];
      }
      used.add(pos.s);
      return { midi: p.midi, n: p.n, deg: p.deg, s: pos.s, f: pos.f, tag: p.tag };
    });
    this._push({ notes, dur });
    return this;
  }

  rest(dur = 1) { this._push({ notes: [], dur, rest: true }); return this; }

  /** Finalize into a playable exercise instance. */
  build(meta = {}) {
    const flat = [];
    for (const st of this.steps) {
      if (st.notes.length === 1) flat.push(st.notes[0]);
    }
    assignFingers(flat);
    for (const st of this.steps) {
      if (st.notes.length > 1) {
        const fr = st.notes.filter((n) => n.f > 0).map((n) => n.f);
        const lo = fr.length ? Math.min(...fr) : 0;
        for (const n of st.notes) n.finger = n.f === 0 ? 0 : Math.min(4, n.f - lo + 1);
      }
    }
    let lo = 99, hi = 0;
    for (const st of this.steps) for (const n of st.notes) { lo = Math.min(lo, n.f); hi = Math.max(hi, n.f); }
    if (lo === 99) { lo = 0; hi = 12; }
    // no default `sub` here: the template's own starting rhythm must win unless a build sets one
    return {
      uniform: true,
      beatsPerBar: 4,
      ...meta,
      // options a build had to override (shown as "fixed" in the Options sheet)
      ...(this.fixed ? { fixed: { ...this.fixed, ...(meta.fixed || {}) } } : {}),
      steps: this.steps,
      range: [lo, hi],
      // some keys simply do not fit under a low "Highest fret used" setting: say so on screen
      overFret: hi > this.ctx.maxFret ? hi : 0,
    };
  }
}

/** Octave shift (multiple of 12) that brings a group of pitches inside the playable range. */
export function fitShift(midis, ctx) {
  if (!midis.length) return 0;
  const lowest = Math.min(...ctx.tuning);
  const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
  const lo = Math.min(...midis), hi = Math.max(...midis);
  let shift = 0;
  while (lo + shift < lowest) shift += 12;
  while (hi + shift > highest && lo + shift - 12 >= lowest) shift -= 12;
  return shift;
}

// ------------------------------------------------------------------ sequences

export const SCALE_PATTERNS = {
  straight: { name: 'Straight', off: [0] },
  g3: { name: 'Groups of 3', off: [0, 1, 2] },
  g4: { name: 'Groups of 4', off: [0, 1, 2, 3] },
  g4rev: { name: 'Groups of 4 reversed (4-3-2-1)', off: [3, 2, 1, 0] },
  g5: { name: 'Groups of 5', off: [0, 1, 2, 3, 4] },
  thirds: { name: 'In 3rds', off: [0, 2] },
  fourths: { name: 'In 4ths', off: [0, 3] },
  fifths: { name: 'In 5ths', off: [0, 4] },
  sixths: { name: 'In 6ths', off: [0, 5] },
  sevenths7: { name: 'In 7ths', off: [0, 6] },
  fourthsAlt: { name: '4ths alternating (1-4, 5-2…)', alt: true, off: [0, 3] },
  sixthsAlt: { name: '6ths alternating', alt: true, off: [0, 5] },
  g6: { name: 'Groups of 6', off: [0, 1, 2, 3, 4, 5] },
  g7: { name: 'Groups of 7', off: [0, 1, 2, 3, 4, 5, 6] },
  r1235: { name: '1-2-3-5 cells (Coltrane)', off: [0, 1, 2, 4] },
  quartal: { name: 'Stacked 4ths (1-4-7)', off: [0, 3, 6] },
  triads: { name: 'Diatonic triads (1-3-5)', off: [0, 2, 4] },
  sevenths: { name: 'Diatonic 7ths (1-3-5-7)', off: [0, 2, 4, 6] },
  turn: { name: '1-2-3-1 turns', off: [0, 1, 2, 0] },
  up3down1: { name: 'Up 3, down 1 (1-2-3-2)', off: [0, 1, 2, 1] },
  thirdsAlt: { name: '3rds alternating (1-3, 4-2…)', alt: true, off: [0, 2] },
  skip: { name: 'Skip one note', off: [0, 2] }, // "in 3rds" only on 7-note scales
};

/** Index sequence over a scale spanning `top` steps (len * octaves). */
export function scaleSeq(top, patternKey = 'straight', dir = 'updown') {
  const pat = typeof patternKey === 'object' ? patternKey : SCALE_PATTERNS[patternKey] || SCALE_PATTERNS.straight;
  const off = pat.off;
  const maxOff = Math.max(...off), minOff = Math.min(...off);
  const upSeq = [], downSeq = [];
  let g = 0;
  for (let i = -minOff; i + maxOff <= top; i++, g++) {
    const o = pat.alt && g % 2 ? [...off].reverse() : off;
    for (const x of o) upSeq.push(i + x);
  }
  g = 0;
  for (let i = top + minOff; i - maxOff >= 0; i--, g++) {
    const o = pat.alt && g % 2 ? [...off].reverse() : off;
    for (const x of o) downSeq.push(i - x);
  }
  if (off.length === 1) {
    if (dir === 'up') return upSeq;
    if (dir === 'down') return downSeq;
    if (dir === 'downup') return [...downSeq, ...upSeq.slice(1)];
    return [...upSeq, ...downSeq.slice(1)];
  }
  if (dir === 'up') return [...upSeq, top];
  if (dir === 'down') return downSeq;
  if (dir === 'downup') return [...downSeq, ...upSeq];
  return [...upSeq, ...downSeq];
}

/** Pitches of a scale run. */
export function scaleRun(tonic, type, tonicMidi, { octaves = 1, pattern = 'straight', dir = 'updown', startDeg = 0 } = {}) {
  const len = T.SCALES[type].iv.length;
  // wide sequences (e.g. 7ths on a 5-note scale) need more than one octave of room
  const maxOff = Math.max(...(SCALE_PATTERNS[pattern] || SCALE_PATTERNS.straight).off);
  while (maxOff > len * octaves) octaves++;
  const seq = scaleSeq(len * octaves, pattern, dir);
  return seq.map((k) => T.scalePitch(tonic, type, tonicMidi, k + startDeg));
}

/** Arpeggio shapes over chord tones, indices into the chord-tone ladder. */
export const ARP_SHAPES = {
  up: { name: 'Up (1-3-5-8)', f: (n, oct) => range(0, n * oct) },
  updown: { name: 'Up & down', f: (n, oct) => [...range(0, n * oct), ...range(n * oct - 1, 0, -1)] },
  down: { name: 'Down (8-5-3-1)', f: (n, oct) => range(n * oct, 0, -1) },
  downup: { name: 'Down & up', f: (n, oct) => [...range(n * oct, 0, -1), ...range(1, n * oct)] },
  turn: { name: '1-3-5-3', f: (n) => [0, 1, 2, 1] },
  r535: { name: '1-5-3-5', f: (n) => [0, 2, 1, 2] },
  octave: { name: '1-3-5-8-5-3', f: (n) => [...range(0, n), ...range(n - 1, 1, -1)] },
  doubled: { name: 'Doubled notes (1-1-3-3-5-5…)', f: (n, oct) => [...range(0, n * oct), ...range(n * oct - 1, 1, -1)].flatMap((i) => [i, i]) },
  // broken chords: one small cell started from every chord tone up to the top and back, ending on the root
  broken: { name: 'Broken: 1-3-5-3, then from each chord tone', f: (n, oct) => brokenSeq(n * oct, [0, 1, 2, 1]) },
  broken535: { name: 'Broken: 1-5-3-5, then from each chord tone', f: (n, oct) => brokenSeq(n * oct, [0, 2, 1, 2]) },
  // groups of 4 need room for a second cell: a one-octave chord climbs to the 10th
  broken4: { name: 'Broken: groups of 4 chord tones, from each one', f: (n, oct) => brokenSeq(Math.max(n * oct, n + 1), [0, 1, 2, 3]) },
};
/** Shapes whose closing root is held to the bar line (see Player: step.fill). */
export const BROKEN_SHAPES = new Set(['broken', 'broken535', 'broken4']);

function brokenSeq(top, off) {
  const seq = scaleSeq(top, { off });
  return seq[seq.length - 1] === 0 ? seq : [...seq, 0];
}

function range(a, b, step = 1) {
  const out = [];
  if (step > 0) for (let i = a; i <= b; i += step) out.push(i);
  else for (let i = a; i >= b; i += step) out.push(i);
  return out;
}

/**
 * Chord tones as pitches. `inversion` rotates the start tone; the ladder climbs
 * across octaves. Returns pitches for given ladder indices.
 */
export function chordTones(root, ivs, rootMidi, idxs, inversion = 0) {
  return idxs.map((i) => T.chordPitch(root, ivs, rootMidi, i + inversion));
}

/** Diatonic chords of a scale as {root, ivs, type, roman, rootMidi}. */
export function diatonicChords(tonic, scaleType, tonicMidi, size = 3) {
  const h = T.harmonize(tonic, scaleType, size);
  return h.map((c) => ({ ...c, rootMidi: tonicMidi + T.semis(T.SCALES[scaleType].iv[c.k]) }));
}

/** Key list for a param value: a single pc, or a cycle of all 12. */
export function keysFor(value) {
  if (value === 'cycle4') return T.CYCLE4_PC;
  if (value === 'cycle5') return T.CYCLE5_PC;
  if (value === 'chromatic') return T.CHROMATIC_PC;
  return [Number(value)];
}

/**
 * Voice-leading helper: choose the register of a chord so its first played tone
 * lies closest to `prevMidi`, within [lo, hi]. Returns {rootMidi, inversion}.
 */
export function nearestVoicing(rootPc, ivs, prevMidi, lo, hi, { fixedInversion = null } = {}) {
  let best = null;
  for (let rootMidi = lo - 24; rootMidi <= hi; rootMidi++) {
    if (T.mod(rootMidi, 12) !== rootPc) continue;
    for (let inv = 0; inv < ivs.length; inv++) {
      if (fixedInversion != null && inv !== fixedInversion) continue;
      const first = rootMidi + T.semis(ivs[inv]);
      const top = first + 12;
      if (first < lo || top > hi + 2) continue;
      const d = Math.abs(first - prevMidi);
      if (!best || d < best.d) best = { d, rootMidi, inversion: inv };
    }
  }
  return best || { rootMidi: lo + T.mod(rootPc - lo, 12), inversion: 0 };
}
