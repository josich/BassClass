// Modes: relative and parallel views, mode study, chord-scale playing, melodic/harmonic minor and harmonic major modes.
import {
  T, Builder, keysFor, ex, variant, sel, keyP, nm, pickRoot, scaleRun, SCALE_PATTERNS, SCALE_TYPE_OPTS, octP, jazzAltered,
  progChords, progP, chordRootMidis, emitMixed, modeFor,
  rootStrLowP, chordName, keySigFor,
} from './common.js';
import { scaleBuild } from './scales.js';

const M = 'modes';
const MODE_NAMES = ['Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian'];

/** Relative modes of a 7-note parent scale: each degree's scale, one octave in one area (or two octaves). */
function relativeBuild(p, ctx, S, family) {
  const b = new Builder(ctx, S);
  const octaves = Number(p.oct || 1);
  let prev = null;
  for (const k of keysFor(p.key)) {
    const parent = family[0];
    const tonic = T.bestRoot(k, T.SCALES[parent].iv);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: octaves > 1 ? 5 : 7, prev, prefer: 'E' });
    let modePrev = null;
    const modes = family.map((mode, d) => {
      // the mode is the parent scale starting on degree d; two octaves start from the mode's own
      // root on the E or A string, placed like any two-octave scale (no leaps inside the run)
      const modeRoot = T.up(tonic, T.SCALES[parent].iv[d]);
      const offset = T.semis(T.SCALES[parent].iv[d]);
      const rr = octaves > 1 ? pickRoot(ctx, T.pc(modeRoot), { strings: ['E', 'A'], lo: 1, hi: 8, prev: modePrev, prefer: 'E', span: 24 }) : null;
      if (rr) modePrev = rr.midi;
      const seq = scaleRun(tonic, parent, rr ? rr.midi - offset : r.midi, { dir: p.dir || 'up', startDeg: d, octaves });
      const items = seq.map((x, i) => ({ ...x, deg: T.fmtDeg(T.ivBetween(modeRoot, x.n)), chord: i === 0 ? `${nm(modeRoot, S)} ${modeName(mode)}` : undefined }));
      return { items, rr };
    });
    if (octaves > 1) modes.forEach(({ items, rr }) => b.line(items, { place: { pin: { [rr.midi]: rr.s }, open: 'avoid', center: rr.f + 1 } }));
    else b.line(modes.flatMap((m) => m.items), { place: { open: 'avoid', center: r.f + 2 } });
    prev = r.midi;
    // one key: the parent scale's key signature (C major's modes: none)
    if (keysFor(p.key).length === 1) b.keySig = keySigFor(tonic, parent);
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
  params: { key: keyP(T.SCALES.ionian.iv), dir: sel('Direction', [['up', 'Each mode ascending'], ['updown', 'Up & down']]), oct: octP() },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.MAJOR_MODES).build({ label: 'degree' }); },
});

const BRIGHT = ['lydian', 'ionian', 'mixolydian', 'dorian', 'aeolian', 'phrygian', 'locrian'];
/**
 * One root, several modes: each mode takes its most readable name (C♯ Dorian, not D♭ Dorian with
 * F♭ and C♭), and when that differs from the key chosen, the badge says it is the same note.
 */
const sameRoot = (k, tonic, S) => {
  const key = T.bestRoot(k, T.SCALES.ionian.iv);
  return T.noteName(key) === T.noteName(tonic) ? '' : ` (= ${nm(key, S)})`;
};
const parallel = ex({
  id: 'md-parallel', module: M, level: 3, star: true,
  title: 'Parallel modes: brightest to darkest',
  summary: 'Same root, one note darker each time: Lydian → Ionian → Mixolydian → … → Locrian.',
  about: 'Keep the root and change the mode. Ordered from brightest to darkest, each mode lowers exactly one note: Lydian (♯4) → Ionian (4) → Mixolydian (♭7) → Dorian (♭3) → Aeolian (♭6) → Phrygian (♭2) → Locrian (♭5). This is the clearest way to hear the colour of each mode.',
  tips: ['Find the one note that changes between neighbouring modes.', 'Play it over a drone of the root (e.g. the open A string).'],
  source: 'Berklee PULSE (parallel modes); RSL Grades 6–7; LCM',
  params: { key: keyP(T.SCALES.ionian.iv, { def: '9', cycles: false }), dir: sel('Order', [['bright', 'Brightest → darkest'], ['dark', 'Darkest → brightest']]), oct: octP() },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const octaves = Number(p.oct || 1);
    const r = pickRoot(ctx, k, { strings: octaves > 1 ? ['E'] : ['E', 'A'], hi: 9, prefer: 'E' });
    const order = p.dir === 'bright' ? BRIGHT : [...BRIGHT].reverse();
    for (const mode of order) {
      const tonic = T.bestRoot(k, T.SCALES[mode].iv);
      b.chord(`${nm(tonic, S)} ${modeName(mode)}${sameRoot(k, tonic, S)}`);
      b.line(scaleRun(tonic, mode, r.midi, { dir: 'updown', octaves }), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const ALL_MODES = [...T.MAJOR_MODES, ...T.MELODIC_MODES, ...T.HARMONIC_MODES, ...T.HARMONIC_MAJOR_MODES];
const study = ex({
  id: 'md-study', module: M, level: 4,
  title: 'Mode study: any mode, any key, any sequence',
  summary: 'Every mode of major, melodic minor, harmonic minor and harmonic major, with sequences and two octaves.',
  about: 'Choose a mode and drill it like a scale: straight, in sequences, over one or two octaves, in one key or all 12. Use this to learn each mode on its own terms, not as "C major starting on D".',
  tips: ['Know the formula: Dorian = 1 2 ♭3 4 5 6 ♭7.', 'Pair it with its chord: Dorian ↔ m7, Lydian ↔ maj7♯11, Mixolydian ↔ 7.'],
  source: 'RSL Grades 6–8; LCM; Tony Grey Bass Academy (fingerboard study of the modes)',
  params: { type: sel('Mode', SCALE_TYPE_OPTS(ALL_MODES), 'dorian'), key: keyP(T.SCALES.dorian.iv), pattern: sel('Sequence', ['straight', 'g3', 'g4', 'thirds', 'triads', 'sevenths', 'turn'].map((k) => [k, SCALE_PATTERNS[k].name])), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: rootStrLowP() },
  bpm: 76, sub: 2, label: 'degree',
  build(p, ctx, S) { return scaleBuild(p, ctx, S).build({ label: 'degree' }); },
});

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
  // on every dominant the tensions are named 9, 11, 13 (not 2, 4, 6)
  mixolydian: { 0: ['1', '1'], 2: ['2', '9'], 4: ['3', '3'], 5: ['4', '11'], 7: ['5', '5'], 9: ['6', '13'], 10: ['b7', 'b7'] },
  mixolydianB6: { 0: ['1', '1'], 2: ['2', '9'], 4: ['3', '3'], 5: ['4', '11'], 7: ['5', '5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] },
  // 7sus♭9 has no 3rd, so its minor 3rd is named ♭3
  dorianB2: { 0: ['1', '1'], 1: ['b2', 'b9'], 3: ['b3', 'b3'], 5: ['4', '11'], 7: ['5', '5'], 9: ['6', '13'], 10: ['b7', 'b7'] },
};
/** Mode names for the chord-scale badge ("Ionian", not "Major"). */
const modeName = (m) => ({ ionian: 'Ionian', aeolian: 'Aeolian' })[m] || T.SCALES[m].name.split(' (')[0];

const chordScale = ex({
  id: 'md-chord-scale', module: M, level: 4, star: true,
  title: 'Chord-scale: the right mode on every chord',
  summary: 'ii–V–I and real progressions with each chord\'s mode: Dorian, Mixolydian, Ionian…',
  about: 'Each chord in a progression implies a scale, chosen by its function in the key (Berklee chord-scale theory): I Ionian, ii Dorian, iii Phrygian, IV Lydian, V Mixolydian, vi Aeolian, viiø Locrian; in a minor key i Aeolian, iiø Locrian, iv Dorian, and a V7 that resolves to a minor chord Phrygian dominant (♭9, ♭13). Chords from outside the key take the scale of their quality: a secondary dominant Mixolydian, m(maj7) melodic minor, °7 whole-half diminished. On dominants the tensions are named 9, 11 and 13. Each chord gets its scale in 8th notes, starting on its root in the octave nearest the last note and alternating up and down, so the line flows. This is the foundation of improvising and of scalar walking lines.',
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
          items.push({ ...x, n, deg, dur: 0.5, chord: i === 0 ? c.sym : undefined, text: i === 0 ? modeName(mode) : undefined });
        });
        prev = items[items.length - 1].midi;
      });
    }
    emitMixed(b, items, { center: 5, open: 'avoid' });
    // written 8ths: the subdivision never moves a chord off its bar line
    return b.build({ label: 'degree', uniform: false });
  },
});

const melodicModes = ex({
  id: 'md-melodic-modes', module: M, level: 5,
  title: 'Modes of melodic minor',
  summary: 'Dorian ♭2, Lydian augmented, Lydian dominant, Mixolydian ♭6, Locrian ♮2, altered.',
  about: 'Melodic minor produces the most important scales of modern jazz: Lydian dominant (4th mode) over 7♯11 chords, Locrian ♮2 (6th mode) over m7♭5, and the altered scale (7th mode) over altered dominants. Play all seven from the same parent and hear how one set of notes creates seven colours.',
  tips: ['Altered scale = melodic minor a half step above the root (G altered = A♭ melodic minor).', 'Lydian dominant = melodic minor from the 5th (G7♯11 = D melodic minor).'],
  source: 'RSL Grade 8; Spanish conservatory year 6; Tony Grey (melodic minor modes); Mark Levine',
  params: { key: keyP(T.SCALES.melodicMinor.iv), dir: sel('Direction', [['up', 'Each mode ascending'], ['updown', 'Up & down']]), oct: octP() },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.MELODIC_MODES).build({ label: 'degree' }); },
});

const harmonicModes = variant(melodicModes, {
  id: 'md-harmonic-modes', level: 5,
  title: 'Modes of harmonic minor',
  summary: 'Locrian ♮6, Ionian ♯5, Ukrainian Dorian (Dorian ♯4), Phrygian dominant, Lydian ♯2, ultralocrian.',
  about: 'Harmonic minor\'s modes give Spanish, Middle-Eastern and neo-classical colours. The 5th mode, Phrygian dominant, is the sound of the V7♭9 chord in minor keys and of flamenco. Play all seven from the same parent.',
  tips: ['Phrygian dominant = harmonic minor from its 5th (C Phrygian dominant = F harmonic minor).', 'Listen for the augmented 2nd (three frets): it moves to a different place in every mode.'],
  source: 'RSL Grade 8; Spanish conservatory programmes; flamenco and neo-classical practice (Phrygian dominant); Mark Levine',
  params: { key: keyP(T.SCALES.harmonicMinor.iv), dir: melodicModes.params.dir, oct: octP() },
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.HARMONIC_MODES).build({ label: 'degree' }); },
});

const pitchAxis = ex({
  id: 'md-pitch-axis', module: M, level: 5,
  title: 'Pitch axis: one root, changing modes',
  summary: 'Keep the same root and switch modes every bar: hear and feel each colour over a pedal.',
  about: 'The "pitch axis" idea keeps one bass note while the mode above it changes. Each bar is a different mode on the same root, so your ear has to follow the colour changes while your hand reorganises around a fixed root. It is a powerful exercise for modal fluency.',
  tips: ['Choose the order: major modes, melodic minor modes, or a dramatic mix.', 'Accent the characteristic note of each mode.'],
  source: 'Pitch-axis theory (Joe Satriani); modal improvisation pedagogy',
  params: { key: keyP(T.SCALES.ionian.iv, { def: '4', cycles: false }), set: sel('Modes', [['major', 'Major modes (bright → dark)'], ['melodic', 'Melodic minor modes'], ['mix', 'Lydian · Mixolydian · Dorian · Phrygian dominant · Altered']]), oct: octP() },
  bpm: 88, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const octaves = Number(p.oct || 1);
    const r = pickRoot(ctx, k, { strings: octaves > 1 ? ['E'] : ['E', 'A'], hi: 9, prefer: 'E' });
    const sets = { major: BRIGHT, melodic: T.MELODIC_MODES, mix: ['lydian', 'mixolydian', 'dorian', 'phrygianDom', 'altered'] };
    for (const mode of sets[p.set]) {
      const tonic = T.bestRoot(k, T.SCALES[mode].iv);
      b.chord(`${nm(tonic, S)} ${modeName(mode)}${sameRoot(k, tonic, S)}`);
      // the altered scale named the jazz way (R ♭9 ♯9 3 ♭5 ♭13 ♭7), like the chord-scale exercises
      b.line(jazzAltered(mode, tonic, scaleRun(tonic, mode, r.midi, { dir: 'up', octaves })), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const alteredChordScale = variant(chordScale, {
  id: 'md-altered-chord-scale', level: 6,
  title: 'Chord-scale with altered dominants',
  summary: 'ii – V7alt – I: altered, half-whole diminished and whole-tone scales over the V.',
  about: 'Modern jazz colours the dominant chord with altered scales: the altered scale over 7alt (♭9 ♯9 ♭5 ♭13), half-whole diminished over 7♭9, and the whole-tone scale over 7♯5 and 7♭5. Each progression puts a different altered dominant between ii and I so you hear the tension and the resolution. The notes over the V are named as tensions (♭9, ♯9, ♯11 or ♭5, ♭13), the way jazz players say them.',
  params: { ...chordScale.params, prog: progP(['ii-V7alt-I', 'ii-V7b9-I', 'ii-V7s5-I', 'ii-V7b5-I'], 'ii-V7alt-I') },
});

const harmonicMajorModes = variant(melodicModes, {
  id: 'md-harmonic-major-modes', level: 6,
  title: 'Modes of harmonic major',
  summary: 'Dorian ♭5, Phrygian ♭4, Lydian ♭3, Mixolydian ♭2, Lydian augmented ♯2, Locrian ♭♭7.',
  about: 'Harmonic major is the major scale with a ♭6 (C D E F G A♭ B). Harmonic minor lowers the 3rd and the 6th, melodic minor only the 3rd, harmonic major only the 6th: together with the major scale these are the four parent scales that jazz and modern harmony draw on (Dmitri Tymoczko\'s four scale families). It keeps the major I chord but borrows the minor iv (Fm) and the °7 on the 7th degree, so it sounds major with a dark edge. Play all seven modes from the same parent.',
  tips: ['Mixolydian ♭2 (5th mode) fits a V7♭9 that resolves to a major chord: G7♭9 → C.', 'Phrygian ♭4 (3rd mode) sounds like the altered scale with a natural 5th: read its ♭4 (A♭) as G♯, the 3rd of E, and E F G G♯ B C D = R ♭9 ♯9 3 5 ♭13 ♭7.', 'Add a natural 6 and you get Barry Harris\'s major 6th diminished scale.'],
  source: 'Rimsky-Korsakov "Practical Manual of Harmony" (harmonic major); Dmitri Tymoczko "A Geometry of Music" (the four scale families); Barry Harris',
  params: { key: keyP(T.SCALES.harmonicMajor.iv), dir: melodicModes.params.dir, oct: octP() },
  build(p, ctx, S) { return relativeBuild(p, ctx, S, T.HARMONIC_MAJOR_MODES).build({ label: 'degree' }); },
});

// ---------------------------------------------------------------- superimposition

const PENT = ['1', '2', '3', '5', '6'];
// a note's name against a chord by semitones above its root (9, 11, 13 on 7th chords)
const TENSION = {
  dom: ['R', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'],
  min: ['R', '♭9', '9', '♭3', '3', '11', '♯11', '5', '♭13', '13', '♭7', '7'],
  hdim: ['R', '♭9', '9', '♭3', '3', '11', '♭5', '5', '♭13', '13', '♭7', '7'],
  maj: ['R', '♭9', '9', '♯9', '3', '11', '♯11', '5', '♯5', '13', '♭7', '7'],
};
const famOf = (type) => (type.startsWith('dom') ? 'dom' : type === 'm7b5' ? 'hdim' : /^min|^mMaj/.test(type) ? 'min' : 'maj');
/** A note's label against its chord; dominants use their scale's jazz names (G7alt: ♭5, not ♯11). */
const labelOn = (type, mode, semis) => {
  const sp = DOM_SPELL[mode]?.[T.mod(semis, 12)];
  return sp ? T.fmtDeg(sp[1]) : TENSION[famOf(type)][T.mod(semis, 12)];
};

/**
 * The major pentatonics that lie inside a chord's scale, best first: the ones holding its 3rd and
 * 7th, then the root and 5th; the 4th over a major or dominant chord (an avoid note) counts against.
 */
function pentatonicsFor(c, mode) {
  const inScale = new Map(T.SCALES[mode].iv.map((iv) => [T.mod(T.semis(iv), 12), iv]));
  const tones = new Map(c.ivs.map((iv) => [T.mod(T.semis(iv), 12), iv]));
  const fam = famOf(c.type);
  const out = [];
  for (let r = 0; r < 12; r++) {
    const semis = PENT.map((iv) => T.mod(r + T.semis(iv), 12));
    if (!inScale.has(r) || !semis.every((x) => inScale.has(x))) continue;
    let score = 0;
    for (const x of semis) {
      const iv = tones.get(x);
      if (iv === '3' || iv === 'b3' || iv === '7' || iv === 'b7' || iv === '6') score += 2;
      else if (iv === '1') score += 1;
      else if (iv === '5' || iv === 'b5' || iv === '#5') score += 0.5;
      if (x === 5 && (fam === 'maj' || fam === 'dom') && !tones.has(5)) score -= 2;
    }
    out.push({ r, iv: inScale.get(r), score });
  }
  return out.sort((a, z) => z.score - a.score || a.r - z.r);
}

/**
 * 8th-note runs over one chord, alternately up and down a scale whose start note is `from` (a midi),
 * each run starting in the octave nearest the last note. seg(start, up) returns a run's notes.
 */
function runsOver(total, from, ref, ctx, pass, seg) {
  const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
  const run = [];
  while (run.length < total) {
    const up = pass.n++ % 2 === 0;
    const last = run.length ? run[run.length - 1].midi : ref ?? from;
    const cands = [-24, -12, 0, 12, 24].map((x) => from + x)
      .filter((m) => (up ? m >= ctx.tuning[0] && m + 12 <= highest : m - 12 >= ctx.tuning[0] && m <= highest));
    const start = cands.sort((a, z) => Math.abs(a - last) - Math.abs(z - last))[0] ?? from;
    const notes = seg(start, up);
    if (run.length && notes[0].midi === run[run.length - 1].midi) notes.shift();
    run.push(...notes.slice(0, total - run.length));
  }
  return run;
}

const pentSuper = ex({
  id: 'md-pentatonic-superimposition', module: M, level: 5,
  title: 'Pentatonic superimposition: three pentatonics on every chord',
  summary: 'Over each chord, the major pentatonics inside its scale: F, C or G over Dm7, G, F or C over G7, D♭ over G7alt.',
  about: 'A pentatonic has five notes and no half steps, so it rarely clashes. Every mode of the major scale holds three major pentatonics, and each one brings out different notes of the chord. Over Dm7 (Dorian) F major pentatonic has the ♭3 and ♭7, C major pentatonic the 9 and 11, G major pentatonic the 13. Over G7 (Mixolydian) G has the 3rd; F and C leave it out and sound suspended. Over an altered dominant only one fits: the major pentatonic a tritone above the root (D♭ over G7alt: ♭5 ♭13 ♭7 ♭9 ♯9, four alterations and the ♭7, no 3rd). Some choices hold an avoid note, like the 11 over a major or dominant chord: pass through it, do not land on it. Each chord takes its scale by function, as in the chord-scale exercise (a one-chord minor vamp is Dorian), and the labels show every note against the chord. F major pentatonic and D minor pentatonic are the same five notes.',
  tips: ['Start with the 1st choice until the sound is in your ear, then play "All three in turn".', 'Find the pentatonic\'s root on the neck before the chord arrives.', 'Over Cmaj7 the F major pentatonic holds the 11 (F), over G7 the C major pentatonic holds the 11 (C): passing notes.'],
  source: 'Pentatonics in a key (Gary Willis on Scott\'s Bass Lessons); Ramon Ricker "Pentatonic Scales for Jazz Improvisation"; Jerry Bergonzi "Inside Improvisation Vol. 2: Pentatonics"; chord-scales by function (Berklee)',
  params: {
    prog: progP(['ii-V-I', 'I-vi-ii-V', 'ii-V7alt-I', 'vamp-min', 'vamp-dom']), key: keyP(T.SCALES.ionian.iv),
    choice: sel('Pentatonic', [['all', 'All three in turn'], ['0', '1st: the most chord tones'], ['1', '2nd choice'], ['2', '3rd choice']]),
  },
  bpm: 92, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const items = [];
    const pass = { n: 0 };
    const choices = p.choice === 'all' ? [0, 1, 2] : [Number(p.choice)];
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { S });
      const roots = chordRootMidis(chords, { lo: 28, hi: 45 });
      for (const choice of choices) {
        chords.forEach((c, ci) => {
          const mode = modeFor(c, chords[(ci + 1) % chords.length]);
          const opts = pentatonicsFor(c, mode);
          const o = opts[Math.min(choice, opts.length - 1)];
          // the notes are spelled against the chord (C♭ is the ♭3 of A♭m7); the pentatonic is named
          // plainly, with its spelled name when that differs ("B major pentatonic (= C♭)")
          const pr = T.up(c.root, o.iv);
          const prName = T.awkward(pr) ? `${nm(T.readable(pr), S)} major pentatonic${Math.abs(pr.a) === 1 ? ` (= ${nm(pr, S)})` : ''}` : `${nm(pr, S)} major pentatonic`;
          const ivOf = new Map(T.SCALES[mode].iv.map((iv) => [T.mod(T.semis(iv), 12), iv]));
          const spell = (midi) => {
            const s0 = T.mod(midi - roots[ci], 12);
            const sp = DOM_SPELL[mode]?.[s0];
            return sp ? T.up(c.root, sp[0]) : T.up(c.root, ivOf.get(s0));
          };
          // over an altered dominant some notes take the chord's letters (C♭, the ♭7 of D♭7alt): say so
          const own = PENT.map((iv) => T.up(pr, iv).l);
          const vs = PENT.map((iv) => spell(roots[ci] + o.r + T.semis(iv)).l);
          const name = own.some((l, j) => l !== vs[j]) ? `${prName} (spelled from the chord)` : prName;
          const prev = items.length ? items[items.length - 1].midi : null;
          const run = runsOver(Math.max(4, c.beats * 2), roots[ci] + o.r, prev, ctx, pass,
            (start, up) => (up ? scaleRun(pr, 'majorPent', start, { dir: 'up' }) : scaleRun(pr, 'majorPent', start - 12, { dir: 'down' })));
          run.forEach((x, i) => items.push({
            ...x, n: spell(x.midi), deg: labelOn(c.type, mode, x.midi - roots[ci]), dur: 0.5,
            chord: i === 0 ? c.sym : undefined, text: i === 0 ? name : undefined,
          }));
        });
      }
    }
    emitMixed(b, items, { center: 5, open: 'avoid' });
    // written 8ths: the subdivision never moves a chord off its bar line
    return b.build({ label: 'degree', uniform: false });
  },
});

// each chord's parent melodic minor: its interval above the chord root, and the chord's mode of it
const MEL_PARENT = {
  mMaj7: ['1', 'melodicMinor'], dom7susb9: ['b7', 'dorianB2'], maj7s5: ['6', 'lydianAug'], dom7s11: ['5', 'lydianDom'],
  dom7b13: ['4', 'mixolydianB6'], m7b5: ['b3', 'locrianN2'], dom7alt: ['b2', 'altered'],
};
const MEL_SETS = {
  minor251: { name: 'Minor ii–V–i (iiø, V7alt, i m(maj7))', minor: true, chords: [['2', 'm7b5', 4], ['5', 'dom7alt', 4], ['1', 'mMaj7', 8]] },
  dominants: { name: 'Four dominant colours on one root', chords: [['1', 'dom7s11', 8], ['1', 'dom7alt', 8], ['1', 'dom7b13', 8], ['1', 'dom7susb9', 8]] },
  all: { name: 'All seven chords on one root', chords: [['1', 'mMaj7', 8], ['1', 'dom7susb9', 8], ['1', 'maj7s5', 8], ['1', 'dom7s11', 8], ['1', 'dom7b13', 8], ['1', 'm7b5', 8], ['1', 'dom7alt', 8]] },
};
const melKey = keyP(T.SCALES.ionian.iv);
melKey.minorWhen = (p) => !!MEL_SETS[p.set]?.minor;

const melodicSuper = ex({
  id: 'md-melodic-superimposition', module: M, level: 5,
  title: 'Melodic-minor superimposition: one shape, seven chords',
  summary: 'Play a melodic minor from its own root over the chord it colours: A♭ over G7alt, D over G7♯11, F over Dm7♭5…',
  about: 'Melodic minor (1 2 ♭3 4 5 6 7) is the parent of the most-used modern chord-scales. Instead of seven modes, learn one shape and where to put it: on the root over m(maj7); on the ♭7 over 7sus♭9; on the 6th over maj7♯5; on the 5th over 7♯11; on the 4th over 7♭13; on the ♭3 over m7♭5; a half step above the root over 7alt. Each chord here gets its parent melodic minor, played from the parent\'s own root and labelled against the chord, so you hear the colour and see the shortcut. Over the dominants the notes are written the jazz way (G7alt: A♭ B♭ B D♭ E♭ F G).',
  tips: ['Say the parent before you play: "G7alt, A♭ melodic minor".', 'A minor ii–V–i uses three melodic minors: on the ♭3 of the ii, a half step above the V and on the i.', 'Compare with Modes of melodic minor: the same notes, seen from the chord\'s root.'],
  source: 'Melodic-minor harmony and superimposition (Mark Levine "The Jazz Theory Book"; Berklee chord-scale theory)',
  params: { set: sel('Chords', Object.entries(MEL_SETS).map(([k, v]) => [k, v.name])), key: melKey },
  bpm: 88, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const set = MEL_SETS[p.set] || MEL_SETS.minor251;
    const items = [];
    const pass = { n: 0 };
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, set.minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv);
      const chords = set.chords.map(([where, type, beats]) => {
        const [piv, mode] = MEL_PARENT[type];
        const off = T.semis(piv) % 12;
        // a progression is spelled from its key; a chord on its own takes its lead-sheet name (flats on
        // the black keys, sharps for minor-type chords: D♭7alt, C♯m(maj7))
        let root = set.minor ? T.up(tonic, where) : T.bestRoot(k, type === 'mMaj7' || type === 'm7b5' ? T.CHORDS[type].iv : T.SCALES.ionian.iv);
        if (T.awkward(root)) root = T.bestRoot(T.pc(root), T.CHORDS[type].iv);
        return { root, type, beats, off, piv, mode, sym: chordName(root, type, S) };
      });
      const roots = chordRootMidis(chords, { lo: 28, hi: 45 });
      chords.forEach((c, ci) => {
        const ivs = T.SCALES[c.mode].iv;
        const pIdx = ivs.findIndex((iv) => T.mod(T.semis(iv), 12) === c.off);
        // the parent named by its interval from the chord root (A♭ over G7alt), plainly if that is awkward
        const spelled = T.up(c.root, c.piv);
        const parent = T.awkward(spelled) ? T.readable(spelled) : spelled;
        const also = parent !== spelled && Math.abs(spelled.a) === 1 ? ` (= ${nm(spelled, S)})` : '';
        // a note of the chord's mode (index from its root), spelled and named against the chord
        const note = (idx, base) => {
          const q = T.scalePitch(c.root, c.mode, base, idx);
          const sp = DOM_SPELL[c.mode]?.[T.mod(q.midi - base, 12)];
          return { midi: q.midi, n: sp ? T.up(c.root, sp[0]) : q.n, deg: labelOn(c.type, c.mode, q.midi - base) };
        };
        const prev = items.length ? items[items.length - 1].midi : null;
        // one octave of the parent from its own root: up from `start`, or down to it from an octave above
        const run = runsOver(Math.max(4, c.beats * 2), roots[ci] + c.off, prev, ctx, pass, (start, up) => {
          const base = start - c.off - (up ? 0 : 12);
          const idxs = Array.from({ length: 8 }, (_, i) => pIdx + i);
          return (up ? idxs : idxs.reverse()).map((i) => note(i, base));
        });
        run.forEach((x, i) => items.push({ ...x, dur: 0.5, chord: i === 0 ? c.sym : undefined, text: i === 0 ? `${nm(parent, S)} melodic minor${also}` : undefined }));
      });
    }
    emitMixed(b, items, { center: 5, open: 'avoid' });
    // written 8ths: the subdivision never moves a chord off its bar line
    return b.build({ label: 'degree', uniform: false });
  },
});

// the order inside each level is the order of the exercise numbers
export default [relative, parallel, study, chordScale, pitchAxis, pentSuper, melodicModes, melodicSuper, harmonicModes, harmonicMajorModes, alteredChordScale];
void MODE_NAMES;
