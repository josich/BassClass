// Scales: from the first major scale to sequences, positions, symmetric and bebop scales.
import {
  T, Builder, keysFor, ex, variant, sel, keyP, nm, pickRoot, scaleRun, SCALE_PATTERNS, SCALE_TYPE_OPTS,
  rootStrP, dirP, octP, place, scaleShort, ZONES, zoneP, orderP, jazzAltered, plainKeyP,
  oneStringP, keySigFor,
  tonicFor,
} from './common.js';

const M = 'scales';
const patP = (keys, def) => sel('Sequence', keys.map((k) => [k, SCALE_PATTERNS[k].name]), def || keys[0]);
const typeP = (keys, def) => sel('Scale', SCALE_TYPE_OPTS(keys), def || keys[0]);

/** Generic scale exercise: one key or all keys, any pattern, 1–2 octaves. */
export function scaleBuild(p, ctx, S, { type = p.type, pattern = p.pattern || 'straight', octaves = Number(p.oct || 1), dir = p.dir || 'updown', rootStr = p.root || 'A', open = p.open === 'yes', jazz = false, plain = false } = {}) {
  // blues scales: the blue note is written plainly (E♭ blues: A, not B♭♭)
  const bluesType = type === 'blues' || type === 'majorBlues';
  const b = new Builder(ctx, S, { jazz, plain: plain || bluesType });
  const keys = keysFor(p.key);
  const many = keys.length > 1;
  let prev = null, lastTonic = null;
  for (const k of keys) {
    const ivs = T.SCALES[type].iv;
    const tonic = lastTonic = plain ? T.flatRoot(k) : tonicFor(k, type);
    // one key: root on the chosen string; all keys: E or A string, whichever is nearest
    // two octaves always start on the E string (the "Root on" choice applies to one octave)
    const single = octaves > 1 ? 'E' : rootStr;
    // span: keep the top of a 2-octave run (and sequence overshoot) below the highest fret
    const span = 12 * octaves + (pattern === 'straight' ? 0 : 5);
    let r = pickRoot(ctx, k, { strings: many ? ['E', 'A'] : [single], lo: open ? 0 : 1, hi: many ? 8 : 12, prev, prefer: rootStr, span });
    // a root up at frets 10–12 (A on the A string) moves to the string below, if it is lower there
    if (!many && octaves === 1 && r.f > 9 && ctx.str(single) > 0) {
      const below = ctx.names[ctx.str(single) - 1];
      const r2 = pickRoot(ctx, k, { strings: [below], lo: 1, hi: 9, span });
      if (r2.f >= 1 && r2.f <= 9) { b.fixed = { root: `${below} string (on the ${single} string the root is at fret ${r.f})` }; r = r2; }
    }
    // a root at fret 1 would leave the scale no room in one position: the string below (or, from the
    // lowest string, the one above) puts it in the middle of a position
    if (!many && octaves === 1 && !open && r.f === 1) {
      const si = ctx.str(single);
      const alt = si > 0 ? ctx.names[si - 1] : ctx.names[si + 1];
      const r2 = pickRoot(ctx, k, { strings: [alt], lo: 2, hi: 9, span });
      if (r2.f >= 2 && r2.f <= 9) { b.fixed = { root: `${alt} string (on the ${single} string the root is at fret 1)` }; r = r2; }
    }
    b.chord(`${nm(tonic, S)} ${scaleShort(type)}`);
    b.line(jazzAltered(type, tonic, scaleRun(tonic, type, r.midi, { octaves, pattern, dir })), { place: { pin: { [r.midi]: r.s }, open: open ? 'allow' : 'avoid', center: r.f + 1 } });
    prev = r.midi;
  }
  if (octaves > 1) b.fixed = { root: 'E string (2 octaves start low)' };
  // one key: its key signature on the staff (scales spelled plainly or the jazz way keep accidentals)
  if (keys.length === 1 && (!plain || bluesType) && !jazz) b.keySig = keySigFor(lastTonic, type);
  return b;
}

const BASIC = ['ionian', 'aeolian', 'majorPent', 'minorPent'];
const ALL7 = ['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];
const MANY = [...ALL7, 'majorPent', 'minorPent', 'blues', 'majorBlues', 'bebopDom', 'bebopMajor', 'bebopDorian', 'dimHW', 'dimWH', 'wholeTone', 'sixthDim', 'phrygianDom', 'lydianDom', 'altered'];

const oneOctave = ex({
  id: 'sc-one-octave', module: M, level: 1, star: true,
  title: 'Your first scales: major, minor, pentatonic',
  summary: 'One octave in one position, one finger per fret (or two octaves, with a shift). In any key.',
  about: 'A scale is the set of notes a melody or bass line is made from. The major scale (do-re-mi) follows the pattern whole-whole-half-whole-whole-whole-half. Natural minor is the darker version, and the pentatonics are 5-note scales with no "wrong" notes, the basis of rock and blues bass. Each fits in one hand position: learn the shape and then move it to any key.',
  tips: ['Major with root on finger 2: fingers 2-4, 1-2-4, 1-3-4 across three strings.', 'Minor with root on finger 1: 1-3-4, 1-3-4, 1-3.', 'Say the degree numbers (1 2 3…) as you play.'],
  source: 'First graded exams (RSL, LCM)',
  params: { type: typeP(BASIC), key: keyP(T.SCALES.ionian.iv), root: rootStrP('A'), dir: dirP, oct: octP() },
  bpm: 60, sub: 1, label: 'degree',
  build(p, ctx, S) { return scaleBuild(p, ctx, S).build({ label: 'degree' }); },
});

const blues = variant(oneOctave, {
  id: 'sc-blues', level: 2,
  title: 'Blues scales',
  summary: 'Minor pentatonic + ♭5 (the "blue note"), and the major blues scale.',
  about: 'Add the ♭5 to the minor pentatonic and you get the blues scale (1 ♭3 4 ♭5 5 ♭7). The major blues scale (1 2 ♭3 3 5 6) slides from the minor to the major 3rd: the classic country and Motown sound. Both are essential for rock, blues and funk lines and fills.',
  params: { type: typeP(['blues', 'majorBlues']), key: keyP(T.SCALES.blues.iv), root: rootStrP('E'), dir: dirP, oct: octP() },
  tips: ['Slide into the ♭5 or bend it slightly: it is a passing note.', 'Over a 12-bar blues the (minor) blues scale works on all three chords; the major blues scale follows each chord (C major blues over C7, F major blues over F7).'],
  source: 'Graded exams (RSL, LCM)',
});

const openPosition = ex({
  id: 'sc-open-position', module: M, level: 1,
  title: 'Scales in open position',
  summary: 'E, A, G, C, F and D using open strings: the first-position keys.',
  about: 'Open strings ring for free and make low keys sound huge. In first position the open strings replace fretted notes. These are the keys of countless rock, pop and folk songs, and the usual keys of the first graded exams.',
  tips: ['Let open strings ring their full value, then stop them cleanly.', 'Notice which notes are open strings in each key.', 'D major and D minor reach C♯/C and D on the G string (frets 5–7): a small shift at the top.'],
  source: 'Hal Leonard Bass Method (Ed Friedland); first graded exams',
  params: { type: typeP(['ionian', 'aeolian', 'minorPent', 'majorPent']), key: sel('Key', [['4', 'E'], ['9', 'A'], ['7', 'G'], ['0', 'C'], ['5', 'F'], ['2', 'D']]), dir: dirP, oct: octP() },
  bpm: 60, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const tonic = tonicFor(k, p.type);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], lo: 0, hi: 4 });
    b.chord(`${nm(tonic, S)} ${scaleShort(p.type)}`);
    // two octaves start in open position and shift up the neck for the top of the scale
    const octaves = Number(p.oct || 1);
    b.line(scaleRun(tonic, p.type, r.midi, { dir: p.dir, octaves }), { place: octaves > 1 ? { open: 'prefer', center: 2 } : { open: 'prefer', region: [0, 4] } });
    return b.build({ label: 'degree' });
  },
});

const chromatic = ex({
  id: 'sc-chromatic', module: M, level: 2,
  title: 'Chromatic scale',
  summary: 'All 12 notes: in one position across the strings, or along one string.',
  about: 'The chromatic scale uses every fret. In position it is a pure one-finger-per-fret workout; along one string it drills shifting. Chromatic notes are also the "glue" of walking bass and Motown lines.',
  tips: ['Sharps going up, flats coming down.', 'Keep the volume even across string changes.'],
  source: 'Graded exams (LCM)',
  params: { key: keyP(['1'], { cycles: false }), layout: sel('Layout', [['pos', 'In position'], ['string', 'Along one string']]), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']], '2') },
  bpm: 72, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    // a string has room for one octave (12 frets), so along one string the range is fixed
    const oct = p.layout === 'pos' ? Number(p.oct || 2) : 1;
    // along one string the octave must fit below the last fret
    const r = p.layout === 'string'
      ? pickRoot(ctx, k, { strings: ['E', 'A', 'D'], lo: 0, hi: ctx.maxFret - 12, prefer: 'E' })
      : pickRoot(ctx, k, { strings: ['E'], lo: 1, hi: 12 });
    const run = scaleRun(T.bestRoot(k, ['1']), 'chromatic', r.midi, { octaves: oct });
    const half = Math.ceil(run.length / 2);
    run.forEach((x, i) => { x.n = i < half ? x.n : T.N(['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][T.mod(x.midi, 12)]); });
    run.forEach((x, i) => { if (i < half) x.n = T.N(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'][T.mod(x.midi, 12)]); });
    const tonic = T.bestRoot(k, ['1']);
    run.forEach((x) => { if (x.n.a) x.deg = T.fmtDeg(T.ivBetween(tonic, x.n)); });
    b.line(run, { place: p.layout === 'string' ? { string: r.s } : { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    return b.build({ label: 'note', fixed: p.layout === 'string' ? { oct: '1 octave (a string has 12 frets for it)' } : {} });
  },
});

const twoOctaves = ex({
  id: 'sc-two-octaves', module: M, level: 3,
  title: 'Two-octave scales',
  summary: 'Major, minor, harmonic & melodic minor, pentatonics over two octaves with planned shifts.',
  about: 'Two octaves cover most of the useful range of the bass. You need at least one shift. The app chooses fingerings that shift as little as possible and uses the same fingering going up and coming down. Watch where the hand moves and practise those shifts slowly.',
  tips: ['Start with the root on the E string.', 'Shift with the finger that just played, sliding lightly.'],
  source: 'Two-octave scales in advanced graded exams (RSL, LCM)',
  params: { type: typeP(['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor', 'majorPent', 'minorPent', 'blues', 'dorian', 'mixolydian']), key: keyP(T.SCALES.ionian.iv), dir: dirP },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) { return scaleBuild({ ...p, oct: '2' }, ctx, S).build({ label: 'degree' }); },
});

const SEQ = ['g3', 'g4', 'g4rev', 'turn', 'up3down1', 'r1235', 'thirds', 'thirdsAlt', 'fourths', 'triads', 'sevenths', 'g5'];
const sequences = ex({
  id: 'sc-sequences', module: M, level: 3, star: true,
  title: 'Scale sequences',
  summary: 'Groups of 3 and 4, 1-2-3-1 turns, 3rds, diatonic triads and 7ths… through any scale.',
  about: 'Playing a scale straight up and down is only the start. Sequences break it into repeating melodic cells (1-2-3, 2-3-4, 3-4-5…) that sound like music and stop you running scales on autopilot. Every sequence works in every scale and key. Combine them with the subdivision selector: groups of 3 in 16ths shift across the beat.',
  tips: ['Groups of 3 → triplets, groups of 4 → 16ths, then swap them for rhythmic tension.', 'Keep one position; let the sequence decide when you shift.'],
  source: 'Scale sequences: common practice',
  params: { pattern: patP(SEQ, 'g4'), type: typeP(ALL7.concat(['majorPent', 'minorPent'])), key: keyP(T.SCALES.ionian.iv), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: rootStrP('A') },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) { return scaleBuild(p, ctx, S).build({ label: 'degree' }); },
});

const oneString = ex({
  id: 'sc-one-string', module: M, level: 3,
  title: 'Scales on one string (linear)',
  summary: 'The whole scale along a single string: see the whole and half steps.',
  about: 'Played along one string, a scale shows its structure clearly: two frets for a whole step, one for a half step. Gary Willis and Victor Wooten recommend this to understand the neck horizontally and to practise shifting.',
  tips: ['Use fingers 1-2-4 or 1-3-4 per shift, like the double-bass Simandl method.', 'Say the step size: W W H W W W H.'],
  source: 'Scales along one string: linear playing',
  params: { type: typeP(['ionian', 'aeolian', 'dorian', 'mixolydian', 'majorPent', 'minorPent', 'harmonicMinor', 'melodicMinor']), key: keyP(T.SCALES.ionian.iv, { cycles: false }), string: oneStringP('A') },
  bpm: 66, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    let s = Math.max(0, ctx.str(p.string));
    let f0 = T.mod(k - ctx.tuning[s], 12);
    let moved = '';
    if (f0 + 12 > ctx.maxFret) {
      // the octave would run off the neck: use the nearest string where it fits
      const alt = [s - 1, s + 1, s - 2, s + 2].find((x) => x >= 0 && x < ctx.tuning.length && T.mod(k - ctx.tuning[x], 12) + 12 <= ctx.maxFret);
      if (alt != null) { s = alt; f0 = T.mod(k - ctx.tuning[s], 12); moved = `on the ${ctx.names[s]} string`; }
    }
    const tonic = tonicFor(k, p.type);
    b.chord(`${nm(tonic, S)} ${scaleShort(p.type)}`, moved || undefined);
    b.line(scaleRun(tonic, p.type, ctx.tuning[s] + f0), { place: { string: s } });
    b.keySig = keySigFor(tonic, p.type);
    return b.build({ label: 'degree' });
  },
});

const allKeysPosition = ex({
  id: 'sc-keys-one-position', module: M, level: 3, star: true,
  title: 'All 12 keys in one position',
  summary: 'Cycle of 4ths without moving the hand: the root goes where the zone allows.',
  about: 'Stay inside one 5-fret zone and play the scale of every key around the cycle. The root sometimes starts on the E string and sometimes on the A string, and the fingering changes, but the hand stays still. This is how sight-readers and jazz players learn to see every key under their hand.',
  tips: ['Before each key, find its root inside the zone.', 'Fingerings with the root under finger 1, 2 or 4 will all appear.'],
  source: 'Every key in one position; Gary Willis "Fingerboard Harmony for Bass"',
  params: { type: typeP(['ionian', 'aeolian', 'mixolydian', 'dorian', 'majorPent', 'minorPent']), zone: zoneP, order: orderP },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const zone = ZONES[p.zone];
    const region = [zone[0], zone[1]];
    for (const k of keysFor(p.order)) {
      const tonic = tonicFor(k, p.type);
      let best = null;
      for (const sName of ['E', 'A', 'D']) {
        const s = ctx.str(sName);
        if (s < 0) continue;
        for (let f = region[0]; f <= region[1]; f++) {
          if (T.mod(ctx.tuning[s] + f, 12) !== k) continue;
          const run = scaleRun(tonic, p.type, ctx.tuning[s] + f);
          const uniq = [...new Set(run.map((x) => x.midi))].sort((a, c) => a - c);
          const path = place(uniq, ctx, { region, open: 'avoid', pin: { [ctx.tuning[s] + f]: s } });
          const cost = path.cost + (sName === 'D' ? 1 : 0);
          if (!best || cost < best.cost) best = { cost, run, s, midi: ctx.tuning[s] + f };
        }
      }
      if (!best) continue;
      // the zone holds a little more than an octave and a half: when no root has a full octave
      // above it inside the zone, play down from a high root, or (if neither fits) every note of
      // the key inside the zone, from the root up to the top, down to the bottom and back
      const zLo = ctx.tuning[0] + region[0], zHi = ctx.tuning[ctx.tuning.length - 1] + region[1];
      let run = best.run;
      const fits = (xs) => xs.every((x) => x.midi >= zLo && x.midi <= zHi);
      if (!fits(run)) {
        const roots = [];
        for (let m = zLo; m <= zHi; m++) if (T.mod(m, 12) === k) roots.push(m);
        const down = roots.map((m) => scaleRun(tonic, p.type, m - 12, { dir: 'downup' })).find(fits);
        if (down) run = down;
        else {
          const inZone = [];
          for (let i = -14; i <= 14; i++) { const q = T.scalePitch(tonic, p.type, roots[0], i); if (q.midi >= zLo && q.midi <= zHi) inZone.push({ midi: q.midi, n: q.n, deg: q.deg }); }
          const t0 = inZone.findIndex((x) => x.midi === roots[0]);
          run = [...inZone.slice(t0), ...inZone.slice(0, -1).reverse(), ...inZone.slice(1, t0 + 1)];
        }
      }
      b.chord(`${nm(tonic, S)} ${scaleShort(p.type)}`);
      b.line(run, { place: { region, open: 'avoid' } });
    }
    return b.build({ label: 'degree', zone });
  },
});

const threeNps = ex({
  id: 'sc-3nps', module: M, level: 3,
  title: 'Three notes per string',
  summary: 'Diagonal scale shapes that cover the neck: three notes on every string.',
  about: 'With three notes per string the scale climbs diagonally up the neck, covering more range with fewer string crossings. It is the standard fingering for fast scalar runs in fusion and metal, and it links positions together.',
  tips: ['Some strings need a 5-fret stretch: pivot on the thumb.', 'Use legato (hammer-ons) for speed once it is clean.'],
  source: 'Common fusion and guitar-derived fingering',
  params: { type: typeP(ALL7), key: keyP(T.SCALES.ionian.iv, { cycles: false }), oct: sel('Range', [['all', 'Every string (3 notes each)'], ['2', '2 octaves']]) },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const tonic = tonicFor(k, p.type);
    const s0 = 0;
    let f0 = T.mod(k - ctx.tuning[s0], 12);
    if (f0 < 1) f0 += 12;
    if (f0 > 9) f0 -= 12;
    if (f0 < 1) f0 += 12;
    // two octaves on a 4-string: 3 notes on each string, the top string takes the rest
    const n = p.oct === '2' ? T.SCALES[p.type].iv.length * 2 + 1 : ctx.tuning.length * 3;
    if (p.oct === '2' && f0 === 12) f0 = 0; // E: from the open string, so the top stays on the neck
    const items = [];
    for (let i = 0; i < n; i++) {
      const q = T.scalePitch(tonic, p.type, ctx.tuning[s0] + f0, i);
      const s = Math.min(s0 + Math.floor(i / 3), ctx.tuning.length - 1);
      items.push({ s, f: q.midi - ctx.tuning[s], n: q.n, deg: q.deg, cell: Math.floor(i / 3) });
    }
    // each string's three notes are one hand position: 1-2-4 or 1-3-4 (the 5-fret ones stretch
    // 1-2-4), never a shift inside the string
    for (let c = 0; c * 3 < items.length; c++) {
      const cell = items.filter((it) => it.cell === c);
      const lo = Math.min(...cell.map((it) => it.f)), span = Math.max(...cell.map((it) => it.f)) - lo;
      cell.forEach((it) => {
        const r = it.f - lo;
        it.finger = it.f === 0 ? 0 : r === 0 ? 1 : r === span ? 4 : span <= 3 ? (r === 1 ? 2 : 3) : (r >= 3 ? 3 : 2);
      });
    }
    items.forEach((it) => { delete it.cell; });
    b.chord(`${nm(tonic, S)} ${scaleShort(p.type)}`);
    b.frets([...items, ...items.slice(0, -1).reverse()]);
    b.keySig = keySigFor(tonic, p.type);
    return b.build({ label: 'degree' });
  },
});

const positions = ex({
  id: 'sc-positions', module: M, level: 4,
  title: 'The 7 scale positions across the neck (major and minor)',
  summary: 'Box positions that start on each degree on the E string. Link them and own the neck.',
  about: 'Each position starts on a different scale degree on the E string and covers every note of the key within one hand span. They are numbered from the root: Position 1 starts on the root, Position 2 on the next note of the scale, and so on (a position that would start above fret 12 is played an octave lower). Play each box from its lowest note to its highest and back. "All positions" climbs through them from the lowest fret up the neck. Together they connect the whole fretboard in one key.',
  tips: ['The positions overlap: the top of one box is the bottom of the next.', 'Then play the same positions in a minor key (the relative minor uses the same boxes).'],
  source: 'Scales in two or three positions (graded exams)',
  params: { key: keyP(T.SCALES.ionian.iv, { cycles: false }), pos: sel('Position', [['all', 'All positions (up the neck)'], ...[1, 2, 3, 4, 5, 6, 7].map((i) => [String(i), `Position ${i}`])]), type: typeP(['ionian', 'aeolian']) },
  bpm: 76, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const tonic = tonicFor(k, p.type);
    const ivs = T.SCALES[p.type].iv;
    const len = ivs.length;
    const e = Math.max(0, ctx.str('E'));
    // positions numbered from the root: Position n starts on scale degree n on the E string,
    // between frets 1 and 12 (one that would start higher is played an octave lower)
    const rootF = T.mod(k - ctx.tuning[e], 12) || 12;
    const starts = ivs.map((iv, idx) => {
      let f = rootF + T.semis(iv);
      while (f > 12) f -= 12;
      return { f, n: idx + 1 };
    });
    const chosen = p.pos === 'all' ? [...starts].sort((a, c) => a.f - c.f) : [starts[(Number(p.pos) - 1) % len]];
    const notesIn = (lo, hi) => {
      const out = [];
      ctx.tuning.forEach((open, s) => {
        for (let f = lo; f <= hi; f++) {
          const pc = T.mod(open + f, 12);
          const i = T.SCALES[p.type].iv.findIndex((iv) => T.pc(T.up(tonic, iv)) === pc);
          if (i >= 0 && !out.some((q) => q.midi === open + f)) out.push({ s, f, midi: open + f, n: T.up(tonic, T.SCALES[p.type].iv[i]), deg: T.scaleLabel(p.type, i) });
        }
      });
      return out.sort((a, c) => a.midi - c.midi);
    };
    // a box is played without moving the hand: one finger per fret; a 5-fret box joins the two
    // neighbouring frets that never appear on the same string under one finger (a stretch)
    const boxFingers = (box, lo, hi) => {
      const frets = [];
      for (let f = lo; f <= hi; f++) frets.push(f);
      if (frets.length <= 4) return new Map(frets.map((f, j) => [f, j + 1]));
      const byString = new Map();
      for (const q of box) byString.set(q.s, [...(byString.get(q.s) || []), q.f]);
      const clash = (f) => [...byString.values()].some((fs) => fs.includes(f) && fs.includes(f + 1));
      let join = [hi - 1, lo, lo + 1, lo + 2].find((f) => !clash(f));
      if (join == null) join = hi - 1;
      const map = new Map();
      let finger = 0;
      for (const f of frets) { if (f !== join + 1) finger++; map.set(f, Math.min(4, finger)); }
      return map;
    };
    // a pentatonic box is two notes on every string from the E string up, starting on the position's
    // note (the index may reach a fret below it on the higher strings): the five standard boxes
    const pentBox = (st) => {
      const pcs = ivs.map((iv) => T.pc(T.up(tonic, iv)));
      const out = [];
      let m = ctx.tuning[e] + st.f;
      for (let s = e; s < ctx.tuning.length; s++) {
        for (let j = 0; j < 2; j++) {
          while (!pcs.includes(T.mod(m, 12))) m++;
          const i = pcs.indexOf(T.mod(m, 12));
          out.push({ s, f: m - ctx.tuning[s], midi: m, n: T.up(tonic, ivs[i]), deg: T.scaleLabel(p.type, i) });
          m++;
        }
      }
      return out;
    };
    chosen.forEach((st, i) => {
      const box = len === 5 ? pentBox(st) : notesIn(st.f, st.f + 4).filter((q) => !(q.s === e && q.f < st.f));
      const lo = len === 5 ? Math.min(...box.map((q) => q.f)) : st.f;
      const hi = len === 5 ? Math.max(...box.map((q) => q.f)) : st.f + 4;
      const fingerOf = boxFingers(box, lo, hi);
      box.forEach((q) => { q.finger = q.f === 0 ? 0 : fingerOf.get(q.f); });
      b.chord(`Pos ${st.n}`, `${nm(tonic, S)} ${scaleShort(p.type)}`);
      const seq = i % 2 === 0 || p.pos !== 'all' ? [...box, ...box.slice(0, -1).reverse()] : [...box].reverse();
      b.frets(seq.map((q) => ({ s: q.s, f: q.f, n: q.n, deg: q.deg, finger: q.finger })));
    });
    b.keySig = keySigFor(tonic, p.type);
    return b.build({ label: 'degree' });
  },
});

const minorFamily = variant(sequences, {
  id: 'sc-minor-family', level: 4,
  title: 'Harmonic & melodic minor',
  summary: 'The two minor scales of jazz and classical music, straight and in sequences.',
  about: 'Harmonic minor raises the 7th of natural minor, creating the exotic augmented 2nd (♭6 → 7) and a strong pull to the root. Melodic minor (jazz minor) also raises the 6th: it sounds like major with a ♭3 and is the parent of the altered and Lydian dominant scales. Both appear in RSL, LCM and conservatory programmes from the intermediate grades.',
  tips: ['Harmonic minor: feel the augmented 2nd (♭6 → 7) as a three-fret gap.', 'Melodic minor is played the same going up and coming down, the way jazz players use it.'],
  source: 'Harmonic and melodic minor in graded exams and conservatory programmes',
  defaults: { type: 'harmonicMinor', pattern: 'g3' }, only: { type: ['harmonicMinor', 'melodicMinor', 'aeolian'] },
});

const pentPositions = variant(positions, {
  id: 'sc-pent-positions', level: 4,
  title: 'Pentatonic: the 5 positions',
  summary: 'The five pentatonic boxes, linked up the neck in one key.',
  about: 'The pentatonic scale has five shapes that tile the neck. Each one starts on a different note of the scale, numbered from the root: Position 1 is the box with the root under your first finger on the E string. Knowing all five lets you play riffs and fills anywhere on the neck.',
  tips: ['The positions overlap: the top of one box is the bottom of the next.', 'Then switch to the major pentatonic: the relative major (E♭ for C minor) uses the same boxes.'],
  params: { ...positions.params, type: typeP(['minorPent', 'majorPent']), pos: sel('Position', [['all', 'All 5 (up the neck)'], ...[1, 2, 3, 4, 5].map((i) => [String(i), `Position ${i}`])]) },
});

const bebop = ex({
  id: 'sc-bebop', module: M, level: 5,
  title: 'Bebop scales',
  summary: 'An extra chromatic passing note puts the chord tones on the beat.',
  about: 'The bebop dominant scale adds a major 7th to Mixolydian; bebop major adds a ♯5 to major. With eight notes, a descending 8th-note run from the root lands chord tones on the downbeats, which is the secret of bebop lines and great walking bass. Play them descending first, the bebop way.',
  tips: ['Bebop dominant and bebop major: start on the root on a downbeat and descend, and the chord tones fall on 1, 2, 3, 4.', 'Bebop Dorian (David Baker: Dorian plus the major 3rd) works from the 4th: descending from F in C, the beats get F E♭ C A, the IV7 (F7). It plays ii and V as one sound.', 'Use them over a dominant 7th chord (dominant), a major 6th chord (major) or a minor 7th chord (Dorian).'],
  source: 'Barry Harris; David Baker "How to Play Bebop"',
  params: { type: typeP(['bebopDom', 'bebopMajor', 'bebopDorian']), key: keyP(T.SCALES.bebopDom.iv), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]) },
  bpm: 80, sub: 2, label: 'degree',
  build(p, ctx, S) { return scaleBuild({ ...p, root: 'E' }, ctx, S, { dir: 'downup', octaves: Number(p.oct) }).build({ label: 'degree' }); },
});

const symmetric = ex({
  id: 'sc-symmetric', module: M, level: 5,
  title: 'Symmetric scales: diminished & whole tone',
  summary: 'Scales built from repeating cells: the shape repeats every 3 frets (diminished) or 2 frets (whole tone).',
  about: 'The half-whole diminished scale alternates half and whole steps and fits dominant 7♭9 chords. The whole-half version fits diminished chords. The whole-tone scale is all whole steps, the sound of augmented chords and dream sequences. The augmented scale (1 ♭3 3 5 ♯5 7) alternates minor 3rds and half steps: two augmented triads a half step apart, loved by Coltrane and Oliver Nelson. Because they are symmetric, their shapes repeat along the neck.',
  tips: ['Find the repeating 2-string shape and move it along the neck: every 3 frets for the diminished scales, 2 for whole tone, 4 for the augmented scale.', 'Sequences that skip one or two notes sound very modern on these scales.'],
  source: 'Advanced graded exams (RSL, LCM); conservatory programmes',
  params: { type: typeP(['dimHW', 'dimWH', 'wholeTone', 'augmented']), key: plainKeyP(T.SCALES.dimHW.iv), pattern: patP(['straight', 'skip', 'g3', 'g4', 'skip2'], 'straight'), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]) },
  bpm: 72, sub: 4, label: 'degree',
  // symmetric scales do not have one note per letter, so they are spelled plainly (D♭ half-whole: D, not E𝄫)
  build(p, ctx, S) { return scaleBuild({ ...p, root: 'E' }, ctx, S, { plain: true }).build({ label: 'degree' }); },
});

const sixthDim = ex({
  id: 'sc-sixth-diminished', module: M, level: 5,
  title: 'Barry Harris: the 6th-diminished scale',
  summary: 'C6 tones on the beat, Bdim7 tones between: an 8-note scale that "harmonises itself".',
  about: 'Barry Harris taught adding a ♭6 to the major scale (C D E F G A♭ A B). Its notes alternate between a C6 chord (C E G A) and a Bdim7 chord (B D F A♭). Played in 8ths, chord tones land on the beats, and every diminished note resolves to a chord tone a step away. This is the foundation of bebop movement.',
  tips: ['Accent the C6 notes; feel the diminished notes as passing.', 'Then play it as chords (every other note): C6 and B°7 shapes alternate, the way Barry Harris harmonised it.'],
  source: 'Barry Harris\'s teaching; Alan Kingstone "The Barry Harris Approach to Improvised Lines and Harmony"',
  params: { key: keyP(T.SCALES.sixthDim.iv), pattern: patP(['straight', 'skip', 'sixdim', 'g4'], 'straight'), oct: octP() },
  bpm: 76, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = scaleBuild({ ...p, root: p.oct === '2' ? 'E' : 'A', oct: p.oct || '1' }, ctx, S, { type: 'sixthDim', pattern: p.pattern });
    b.steps.forEach((st) => { const d = st.notes[0]?.deg; if (['R', '3', '5', '6'].includes(d)) st.accent = true; });
    return b.build({ label: 'degree' });
  },
});

const sidestep = ex({
  id: 'sc-pent-sidestep', module: M, level: 5,
  title: 'Pentatonic side-stepping',
  summary: 'Play the pentatonic, slip a half step up or down (or a tritone away) for one bar ("outside"), then resolve back.',
  about: 'Side-stepping is a classic way to play "outside": shift the whole pentatonic up a half step for a moment, creating tension, and then resolve back into the key. It works because the shape is strong and the resolution is clear. The backing stays on the home key during the outside bar, so you hear the tension. Fusion and modern jazz players use it constantly.',
  tips: ['Make the outside bar sound intentional: strong rhythm, clear shape.', 'Resolve to a chord tone on beat 1.'],
  source: 'Pentatonic side-stepping in the style of Michael Brecker and Scott Henderson',
  params: { key: keyP(T.SCALES.minorPent.iv, { def: '9', cycles: false }), side: sel('Side-step', [['1', 'Half step up'], ['-1', 'Half step down'], ['6', 'Tritone away']]), oct: octP() },
  bpm: 80, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const octaves = Number(p.oct || 1);
    const r = pickRoot(ctx, k, { strings: ['E'], hi: octaves > 1 ? 7 : 9 });
    const home = T.bestRoot(k, T.SCALES.minorPent.iv);
    const parts = [[k, 'inside'], [T.mod(k + Number(p.side), 12), 'outside'], [k, 'inside']];
    for (const [pcv, label] of parts) {
      const tonic = T.bestRoot(pcv, T.SCALES.minorPent.iv);
      let m = r.midi + (pcv - k);
      if (Number(p.side) === 6 && label === 'outside') m = r.midi + 6;
      // each bar's box sits where its own root is (the tritone side-step moves the hand), an octave
      // lower when two octaves would run off the neck
      if (m + 12 * octaves > ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret && m - 12 >= ctx.tuning[r.s]) m -= 12;
      // whole bars of 8ths: up the box, then back down until the bar is full, so the side-step starts
      // and resolves on beat 1
      const up = scaleRun(tonic, 'minorPent', m, { pattern: 'straight', octaves, dir: 'up' });
      const down = scaleRun(tonic, 'minorPent', m, { pattern: 'straight', octaves, dir: 'down' }).slice(1);
      const notes = [...up, ...down].slice(0, 8 * octaves);
      // the outside bar is text, not a chord: the backing stays on the home key and the tension is heard
      const tag = label === 'inside' ? { chord: `${nm(home, S)}m pent`, text: 'inside' } : { text: `outside: ${nm(tonic, S)}m pent`, implied: `${nm(tonic, S)}m pent` };
      b.line(notes.map((x, i) => ({ ...x, dur: 0.5, ...(i === 0 ? tag : {}) })), { place: { open: 'avoid', pin: { [m]: r.s }, center: m - ctx.tuning[r.s] + 1 } });
    }
    return b.build({ label: 'note', uniform: false });
  },
});

const oddGroups = variant(sequences, {
  id: 'sc-odd-groupings', level: 6,
  title: 'Odd groupings in 16ths, all keys',
  summary: 'Groups of 5 (or 3) in 16ths through all 12 keys: maximum rhythmic tension.',
  about: 'Phrase the scale in groups of 5 while playing 16ths. Each group starts on a different part of the beat, and you go around all 12 keys without stopping. This is a pro-level exercise for time, fretboard knowledge and stamina at once.',
  source: 'Rhythmic displacement drills from jazz-fusion teaching (odd groupings over 16ths)',
  defaults: { pattern: 'g5', key: 'cycle4', oct: '1' }, only: { pattern: ['g3', 'g5'] }, sub: 4, bpm: 60,
});

const intervallic = variant(sequences, {
  id: 'sc-alternating-all-keys', level: 6,
  title: 'Alternating 3rds through all keys',
  summary: '1-3, 4-2, 3-5, 6-4… zig-zag 3rds in every key around the cycle.',
  about: 'Alternating-direction intervals produce wide, melodic lines that are hard to play cleanly. Taking them around all 12 keys without stopping is a mastery-level drill for ears, eyes and hands.',
  tips: ['Name each 3rd as you play it: in major they run M m m M M m m.', 'Keep the hand still and let the zig-zag cross strings; shift only where the key forces you to.'],
  source: 'Classic intervallic scale drills (3rds in alternating directions) from conservatory and jazz teaching',
  defaults: { pattern: 'thirdsAlt', key: 'cycle4' }, only: { pattern: ['thirdsAlt'] }, sub: 2, bpm: 76,
});

const EXOTIC = [
  ['doubleHarmonic', 'Double harmonic major'], ['hungarianMinor', 'Hungarian minor'], ['hungarianMajor', 'Hungarian major'],
  ['dorianS4', 'Ukrainian Dorian (Dorian ♯4)'], ['phrygianDom', 'Phrygian dominant (Spanish)'], ['augmented', 'Augmented scale (1 ♭3 3 5 ♯5 7)'],
];
const exotic = ex({
  id: 'sc-exotic', module: M, level: 5,
  title: 'World scales: double harmonic, Hungarian & more',
  summary: 'Double harmonic major, Hungarian minor and major, Ukrainian Dorian, Phrygian dominant (Spanish), augmented scale.',
  about: 'Scales from beyond the major and minor system, at home in Arabic, Turkish, Balkan, klezmer and flamenco music, and full of augmented 2nds (gaps of three frets). Double harmonic major (1 ♭2 3 4 5 ♭6 7, also called Byzantine or Arabic) has two of them; started from its 4th note it becomes the Hungarian minor (1 2 ♭3 ♯4 5 ♭6 7). The Hungarian major (1 ♯2 3 ♯4 5 6 ♭7) is a dominant 7 sound with a ♯9 and ♯11. Ukrainian Dorian (1 2 ♭3 ♯4 5 6 ♭7) is the 4th mode of harmonic minor, common in klezmer. The augmented scale (1 ♭3 3 5 ♯5 7) is symmetric: two augmented triads a half step apart (C+ and B+), so its shape repeats every 4 frets.',
  tips: ['Find the augmented 2nds first: they give each scale its colour.', 'Play each one over a drone of the root (an open string) to hear its character.'],
  source: 'Franz Liszt (the "gypsy" or Hungarian minor scale); Nicolas Slonimsky "Thesaurus of Scales and Melodic Patterns"; klezmer modes (Ukrainian Dorian)',
  params: { type: sel('Scale', EXOTIC), key: keyP(T.SCALES.doubleHarmonic.iv), pattern: sel('Sequence', [['straight', SCALE_PATTERNS.straight.name], ['thirds', 'Skip one note'], ['g3', SCALE_PATTERNS.g3.name], ['g4', SCALE_PATTERNS.g4.name]], 'straight'), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]) },
  bpm: 72, sub: 2, label: 'degree',
  // the augmented scale has fewer notes than letters, so it is spelled plainly (like the symmetric scales)
  build(p, ctx, S) { return scaleBuild({ ...p, root: 'E' }, ctx, S, { plain: p.type === 'augmented' }).build({ label: 'degree' }); },
});

const MESSIAEN = [1, 2, 3, 4, 5, 6, 7].map((i) => `messiaen${i}`);
const messiaen = ex({
  id: 'sc-messiaen', module: M, level: 6,
  title: 'Messiaen\'s modes of limited transposition',
  summary: 'Seven symmetric scales: whole tone (mode 1), diminished (mode 2) and five more colours, with 6 to 10 notes.',
  about: 'The composer Olivier Messiaen used seven scales built from a cell that repeats inside the octave. Because of that they can be transposed only a few times before the same notes come back: the whole-tone scale (mode 1) has just 2 versions, the diminished scale (mode 2) 3, mode 3 has 4 and modes 4 to 7 have 6. Modes 1 and 2 are the whole-tone and diminished scales of jazz; modes 3 to 7 give the floating, colourful harmony of Messiaen\'s music. Find the repeating cell on the neck and the whole scale follows.',
  tips: ['Mode 3 repeats every 4 frets (1 2 ♭3 | 3 ♯4 5 | ♭6 ♭7 7); modes 4 to 7 repeat every 6 frets.', 'Mode 5 has 6 notes like the whole-tone scale, built from a tiny cell: 1 ♭2 4, then the same cell a tritone higher (♯4 5 7).'],
  source: 'Olivier Messiaen "The Technique of My Musical Language" (1944)',
  params: { type: typeP(MESSIAEN, 'messiaen3'), key: plainKeyP(T.SCALES.messiaen3.iv, { cycles: false }), pattern: patP(['straight', 'skip', 'g3', 'g4'], 'straight'), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]) },
  bpm: 72, sub: 4, label: 'degree',
  // more notes than letters: spelled plainly, like the symmetric scales
  build(p, ctx, S) { return scaleBuild({ ...p, root: 'E' }, ctx, S, { plain: true }).build({ label: 'degree' }); },
});

// the order inside each level is the order of the exercise numbers
export default [oneOctave, openPosition, blues, chromatic, twoOctaves, sequences, oneString, allKeysPosition, threeNps, positions, pentPositions, minorFamily, bebop, symmetric, exotic, sixthDim, sidestep, oddGroups, intervallic, messiaen];
void MANY;
