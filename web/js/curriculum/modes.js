// Modes: relative and parallel views, mode study, chord-scale playing, melodic/harmonic minor modes.
import {
  T, Builder, keysFor, ex, variant, sel, keyP, nm, pickRoot, scaleRun, SCALE_PATTERNS, SCALE_TYPE_OPTS,
  progChords, progP, chordRootMidis, emitMixed,
} from './common.js';
import { scaleBuild } from './scales.js';

const M = 'modes';
const MODE_NAMES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

/** Relative modes of a 7-note parent scale: each degree's scale, one octave, in one area. */
function relativeBuild(p, ctx, S, family) {
  const b = new Builder(ctx, S);
  let prev = null;
  for (const k of keysFor(p.key)) {
    const parent = family[0];
    const tonic = T.bestRoot(k, T.SCALES[parent].iv);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 7, prev, prefer: 'E' });
    const items = [];
    family.forEach((mode, d) => {
      // the mode is the parent scale starting on degree d
      const seq = scaleRun(tonic, parent, r.midi, { dir: p.dir || 'up', startDeg: d });
      const modeRoot = T.up(tonic, T.SCALES[parent].iv[d]);
      seq.forEach((x, i) => items.push({ ...x, deg: T.fmtDeg(T.ivBetween(modeRoot, x.n)), chord: i === 0 ? `${nm(modeRoot, S)} ${T.SCALES[mode].name.split(' (')[0]}` : undefined }));
    });
    b.line(items, { place: { open: 'avoid', center: r.f + 2 } });
    prev = r.midi;
  }
  return b;
}

const relative = ex({
  id: 'md-relative', module: M, level: 3, star: true,
  title: 'Modes of the major scale (relative)',
  summary: 'C major from C, D, E, F, G, A, B: the seven modes share the same notes.',
  about: 'A mode is a scale started from a different note. Play C major from C (Ionian), from D (Dorian), from E (Phrygian) and so on: same notes, different home. The degree labels are recalculated for each mode so you see what makes it unique: Dorian has a ♭3 and a natural 6, Lydian a ♯4, Mixolydian a ♭7.',
  tips: ['Each mode fits the chord built on its degree: D Dorian over Dm7, G Mixolydian over G7.', 'Listen for the "characteristic note" of each mode.'],
  source: 'Berklee PULSE (relative modes); SBL Fretboard Crash Course; Ariane Cap',
  params: { key: keyP(T.SCALES.ionian.iv), dir: sel('Direction', [['up', 'Each mode ascending'], ['updown', 'Up & down']]) },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.MAJOR_MODES).build({ label: 'degree' }); },
});

const BRIGHT = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];
const parallel = ex({
  id: 'md-parallel', module: M, level: 3, star: true,
  title: 'Parallel modes: brightest to darkest',
  summary: 'Same root, one note darker each time: Lydian → Ionian → Mixolydian → … → Locrian.',
  about: 'Keep the root and change the mode. Ordered from brightest to darkest, each mode lowers exactly one note: Lydian (♯4) → Ionian (4) → Mixolydian (♭7) → Dorian (♭3) → Aeolian (♭6) → Phrygian (♭2) → Locrian (♭5). This is the clearest way to hear the colour of each mode.',
  tips: ['Find the one note that changes between neighbouring modes.', 'Play it over a drone of the root (e.g. the open A string).'],
  source: 'Berklee PULSE (parallel modes); RSL Grades 6–7; LCM',
  params: { key: keyP(T.SCALES.ionian.iv, { def: '9', cycles: false }), dir: sel('Order', [['bright', 'Brightest → darkest'], ['dark', 'Darkest → brightest']]) },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 9, prefer: 'E' });
    const order = p.dir === 'bright' ? BRIGHT : [...BRIGHT].reverse();
    for (const mode of order) {
      const tonic = T.bestRoot(k, T.SCALES[mode].iv);
      b.chord(`${nm(tonic, S)} ${T.SCALES[mode].name.split(' (')[0]}`);
      b.line(scaleRun(tonic, mode, r.midi, { dir: 'updown' }), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const ALL_MODES = [...T.MAJOR_MODES, ...T.MELODIC_MODES, ...T.HARMONIC_MODES];
const study = ex({
  id: 'md-study', module: M, level: 4,
  title: 'Mode study: any mode, any key, any sequence',
  summary: 'Every mode of major, melodic minor and harmonic minor with sequences and two octaves.',
  about: 'Choose a mode and drill it like a scale: straight, in sequences, over one or two octaves, in one key or all 12. Use this to learn each mode on its own terms, not as "C major starting on D".',
  tips: ['Know the formula: Dorian = 1 2 ♭3 4 5 6 ♭7.', 'Pair it with its chord: Dorian ↔ m7, Lydian ↔ maj7♯11, Mixolydian ↔ 7.'],
  source: 'RSL Grades 6–8; LCM; Tony Grey Bass Academy (fingerboard study of the modes)',
  params: { type: sel('Mode', SCALE_TYPE_OPTS(ALL_MODES), 'dorian'), key: keyP(T.SCALES.dorian.iv), pattern: sel('Sequence', ['straight', 'g3', 'g4', 'thirds', 'triads', 'sevenths', 'turn'].map((k) => [k, SCALE_PATTERNS[k].name])), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: sel('Root on', [['E', 'E string'], ['A', 'A string']]) },
  bpm: 76, sub: 2, label: 'degree',
  build(p, ctx, S) { return scaleBuild(p, ctx, S).build({ label: 'degree' }); },
});

const MODE_FOR = {
  maj7: 'ionian', dom7: 'mixolydian', min7: 'dorian', m7b5: 'locrianN2', dim7: 'dimWH', mMaj7: 'melodicMinor', maj6: 'ionian', min6: 'melodicMinor',
  dom7s9: 'altered', dom7b9: 'dimHW', dom7s5: 'wholeTone', dom7b5: 'wholeTone', maj7s5: 'lydianAug',
};
const MINOR_TYPES = ['min7', 'min6', 'mMaj7', 'm7b5', 'min'];
/** Scale for a chord; a dominant resolving down a 5th to a minor chord takes Phrygian dominant (♭9, ♭13). */
function modeFor(c, next) {
  const toMinor = next && MINOR_TYPES.includes(next.type) && T.mod(T.pc(next.root) - T.pc(c.root), 12) === 5;
  if (toMinor && (c.type === 'dom7' || c.type === 'dom7b9')) return 'phrygianDom';
  return MODE_FOR[c.type] || 'ionian';
}
/**
 * Dominant scales are spelled and labelled the jazz way, by semitones above the root:
 * G altered = G A♭ B♭ B D♭ E♭ F (R ♭9 ♯9 3 ♭5 ♭13 ♭7), not C♭ "♭4". 7♭5 keeps the ♭5 of its symbol.
 */
const DOM_SPELL = {
  altered: { 0: ['1', '1'], 1: ['b2', 'b9'], 3: ['b3', '#9'], 4: ['3', '3'], 6: ['b5', 'b5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] },
  dimHW: { 0: ['1', '1'], 1: ['b2', 'b9'], 3: ['b3', '#9'], 4: ['3', '3'], 6: ['#4', '#11'], 7: ['5', '5'], 9: ['6', '13'], 10: ['b7', 'b7'] },
  wholeTone: { 0: ['1', '1'], 2: ['2', '9'], 4: ['3', '3'], 6: ['#4', '#11'], 8: ['#5', '#5'], 10: ['b7', 'b7'] },
  wholeToneB5: { 0: ['1', '1'], 2: ['2', '9'], 4: ['3', '3'], 6: ['b5', 'b5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] },
  lydianDom: { 0: ['1', '1'], 2: ['2', '9'], 4: ['3', '3'], 6: ['#4', '#11'], 7: ['5', '5'], 9: ['6', '13'], 10: ['b7', 'b7'] },
  phrygianDom: { 0: ['1', '1'], 1: ['b2', 'b9'], 4: ['3', '3'], 5: ['4', '11'], 7: ['5', '5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] },
};
/** Mode names for the chord-scale badge ("Ionian", not "Major"). */
const modeName = (m) => ({ ionian: 'Ionian', aeolian: 'Aeolian' })[m] || T.SCALES[m].name.split(' (')[0];

const chordScale = ex({
  id: 'md-chord-scale', module: M, level: 4, star: true,
  title: 'Chord-scale: the right mode on every chord',
  summary: 'ii–V–I and real progressions with each chord\'s mode: Dorian, Mixolydian, Ionian…',
  about: 'Each chord in a progression implies a scale: m7 → Dorian, 7 → Mixolydian (Phrygian dominant when it resolves to a minor chord), maj7 → Ionian, m7♭5 → Locrian ♮2, mMaj7 → melodic minor. Each chord gets its scale in 8th notes, starting on its root in the octave nearest the last note and alternating up and down, so the line flows. This is the foundation of improvising and of scalar walking lines.',
  tips: ['Notice how few notes change between neighbouring chords.', 'Then try only chord tones on the beats (1-3-5-7) and scale notes in between.'],
  source: 'Berklee chord-scale theory; Tony Grey Bass Academy; Mark Levine "The Jazz Theory Book"',
  params: { prog: progP(['ii-V-I', 'I-vi-ii-V', 'autumn', 'minor-ii-V-i', 'jazz-blues', 'cycle-251']), key: keyP(T.SCALES.ionian.iv) },
  bpm: 92, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const items = [];
    let prev = null;
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { S });
      const roots = chordRootMidis(chords, { lo: 28, hi: 45 });
      const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
      let pass = 0;
      chords.forEach((c, ci) => {
        const mode = modeFor(c, chords[(ci + 1) % chords.length]);
        const spell = DOM_SPELL[c.type === 'dom7b5' ? 'wholeToneB5' : mode];
        const total = Math.max(4, c.beats * 2);
        const run = [];
        while (run.length < total) {
          // alternate direction; start on the octave of the root nearest the last note
          const up = pass++ % 2 === 0;
          const ref = run.length ? run[run.length - 1].midi : prev ?? roots[ci];
          const cands = [-12, 0, 12, 24].map((o) => roots[ci] + o)
            .filter((m) => (up ? m >= ctx.tuning[0] && m + 12 <= highest : m - 12 >= ctx.tuning[0] && m <= highest));
          const start = cands.sort((a, z) => Math.abs(a - ref) - Math.abs(z - ref))[0] ?? roots[ci];
          const seg = up ? scaleRun(c.root, mode, start, { dir: 'up' }) : scaleRun(c.root, mode, start - 12, { dir: 'down' });
          run.push(...seg.slice(0, Math.min(8, total - run.length)));
        }
        run.forEach((x, i) => {
          const sp = spell?.[T.mod(x.midi - T.pc(c.root), 12)];
          const n = sp ? T.up(c.root, sp[0]) : x.n;
          const deg = T.fmtDeg(sp ? sp[1] : T.ivBetween(c.root, x.n));
          items.push({ ...x, n, deg, dur: 1, chord: i === 0 ? c.sym : undefined, text: i === 0 ? modeName(mode) : undefined });
        });
        prev = items[items.length - 1].midi;
      });
    }
    emitMixed(b, items, { center: 5, open: 'avoid' });
    return b.build({ label: 'degree' });
  },
});

const melodicModes = ex({
  id: 'md-melodic-modes', module: M, level: 5,
  title: 'Modes of melodic minor',
  summary: 'Dorian ♭2, Lydian augmented, Lydian dominant, Mixolydian ♭6, Locrian ♮2, altered.',
  about: 'Melodic minor produces the most important scales of modern jazz: Lydian dominant (4th mode) over 7♯11 chords, Locrian ♮2 (6th mode) over m7♭5, and the altered scale (7th mode) over altered dominants. Play all seven from the same parent and hear how one set of notes creates seven colours.',
  tips: ['Altered scale = melodic minor a half step above the root (G altered = A♭ melodic minor).', 'Lydian dominant = melodic minor from the 5th (G7♯11 = D melodic minor).'],
  source: 'RSL Grade 8; Spanish conservatory year 6; Tony Grey (melodic minor modes); Mark Levine',
  params: { key: keyP(T.SCALES.melodicMinor.iv), dir: sel('Direction', [['up', 'Each mode ascending'], ['updown', 'Up & down']]) },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.MELODIC_MODES).build({ label: 'degree' }); },
});

const harmonicModes = variant(melodicModes, {
  id: 'md-harmonic-modes', level: 5,
  title: 'Modes of harmonic minor',
  summary: 'Locrian ♮6, Ionian ♯5, Dorian ♯4, Phrygian dominant, Lydian ♯2, ultralocrian.',
  about: 'Harmonic minor\'s modes give Spanish, Middle-Eastern and neo-classical colours. The 5th mode, Phrygian dominant, is the sound of the V7♭9 chord in minor keys and of flamenco. Play all seven from the same parent.',
  tips: ['Phrygian dominant = harmonic minor from its 5th (C Phrygian dominant = F harmonic minor).', 'Listen for the augmented 2nd (three frets): it moves to a different place in every mode.'],
  source: 'RSL Grade 8; Spanish conservatory programmes; flamenco and neo-classical practice (Phrygian dominant); Mark Levine',
  params: { key: keyP(T.SCALES.harmonicMinor.iv), dir: melodicModes.params.dir },
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.HARMONIC_MODES).build({ label: 'degree' }); },
});

const pitchAxis = ex({
  id: 'md-pitch-axis', module: M, level: 5,
  title: 'Pitch axis: one root, changing modes',
  summary: 'Keep the same root and switch modes every bar: hear and feel each colour over a pedal.',
  about: 'The "pitch axis" idea keeps one bass note while the mode above it changes. Each bar is a different mode on the same root, so your ear has to follow the colour changes while your hand reorganises around a fixed root. It is a powerful exercise for modal fluency.',
  tips: ['Choose the order: major modes, melodic minor modes, or a dramatic mix.', 'Accent the characteristic note of each mode.'],
  source: 'Pitch-axis theory (Joe Satriani); modal improvisation pedagogy',
  params: { key: keyP(T.SCALES.ionian.iv, { def: '4', cycles: false }), set: sel('Modes', [['major', 'Major modes (bright → dark)'], ['melodic', 'Melodic minor modes'], ['mix', 'Lydian · Mixolydian · Dorian · Phrygian dominant · Altered']]) },
  bpm: 88, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 9, prefer: 'E' });
    const sets = { major: BRIGHT, melodic: T.MELODIC_MODES, mix: ['lydian', 'mixolydian', 'dorian', 'phrygianDom', 'altered'] };
    for (const mode of sets[p.set]) {
      const tonic = T.bestRoot(k, T.SCALES[mode].iv);
      b.chord(`${nm(tonic, S)} ${T.SCALES[mode].name.split(' (')[0]}`);
      b.line(scaleRun(tonic, mode, r.midi, { dir: 'up' }), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const alteredChordScale = variant(chordScale, {
  id: 'md-altered-chord-scale', level: 6,
  title: 'Chord-scale with altered dominants',
  summary: 'ii – V7alt – I: altered, half-whole diminished and whole-tone scales over the V.',
  about: 'Modern jazz colours the dominant chord with altered scales: the altered scale over 7♯9, half-whole diminished over 7♭9, and the whole-tone scale over 7♯5 and 7♭5. Each progression puts a different altered dominant between ii and I so you hear the tension and the resolution. The notes over the V are named as tensions (♭9, ♯9, ♯11, ♭13), the way jazz players say them.',
  params: { ...chordScale.params, prog: progP(['ii-V7alt-I', 'ii-V7b9-I', 'ii-V7s5-I', 'ii-V7b5-I'], 'ii-V7alt-I') },
});

export default [relative, parallel, study, chordScale, pitchAxis, melodicModes, harmonicModes, alteredChordScale];
void MODE_NAMES;
