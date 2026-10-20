// Technique & rudiments: the daily gym for both hands.
import { T, Builder, ex, sel, spellMidi, keyP, keysFor, progChords, chordRootMidis, nm, progP, oneStringP } from './common.js';

const M = 'technique';
// start fret, kept low enough that the widest drill (start + 7 frets) stays under the highest fret
const startFret = (p, ctx) => Math.max(1, Math.min(Number(p.pos), ctx.maxFret - 7));
const posP = (def = '1', label = 'Start fret') => sel(label, [['1', 'Fret 1'], ['3', 'Fret 3'], ['5', 'Fret 5'], ['7', 'Fret 7'], ['9', 'Fret 9'], ['12', 'Fret 12']], def);
const strings = (ctx) => [...ctx.tuning.keys()];
const F = (ctx, s, f, finger, extra = {}) => ({ s, f, finger, n: spellMidi(ctx.tuning[s] + f), ...extra });

/** Right-hand fingering with raking: alternate, but reuse the finger when moving to a lower string. */
function rhTags(items, start = 'i') {
  let cur = start;
  items.forEach((it, k) => {
    if (k > 0) {
      const prev = items[k - 1];
      if (!(it.s < prev.s)) cur = cur === 'i' ? 'm' : 'i';
    }
    it.tag = cur;
  });
  return items;
}

const altPluck = ex({
  id: 'tech-alt-pluck', module: M, level: 1,
  title: 'Alternate plucking (index–middle)',
  summary: 'i-m-i-m on every open string: even volume, even timing.',
  about: 'Pluck with the index (i) and middle (m) fingers alternately, never twice with the same finger. Pull the string across (towards the next string), don\'t lift it away. Even volume and timing between the two fingers is the first goal of every bass player.',
  tips: ['Rest stroke: after plucking, the finger comes to rest on the next string.', 'Then start with the middle finger. Both orders must feel equal.', 'Keep your plucking-hand thumb anchored: pickup or the E string.'],
  source: 'Hal Leonard Bass Method, MI 011, BassBuzz (moveable anchor)',
  params: { start: sel('Start with', [['i', 'Index (i)'], ['m', 'Middle (m)']]), reps: sel('Notes per string', [['8', '8'], ['4', '4']]) },
  bpm: 70, sub: 2, label: 'none',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const items = [];
    for (const s of strings(ctx)) for (let r = 0; r < Number(p.reps); r++) items.push(F(ctx, s, 0, 0, r === 0 ? { chord: ctx.names[s] } : {}));
    let cur = p.start;
    items.forEach((it) => { it.tag = cur; cur = cur === 'i' ? 'm' : 'i'; });
    b.frets(items);
    return b.build({ label: 'none' });
  },
});

const raking = ex({
  id: 'tech-raking', module: M, level: 2,
  title: 'String crossing & raking',
  summary: 'Cross strings efficiently: alternate going up, rake with the same finger coming down.',
  about: 'When you move to a lower-pitched string, "rake": let the same finger fall onto it instead of reaching with the other finger. Moving up, keep alternating. This economy of motion is what makes fast arpeggios possible. The i/m tags above the dots show which finger plucks.',
  tips: ['Accent nothing: all notes the same volume.', 'Slow is smooth, smooth is fast. Use the speed trainer.'],
  source: 'Gary Willis-style raking; MI Online; Bass Aerobics',
  params: { fret: sel('Fret', [['0', 'Open strings'], ['5', 'Fret 5'], ['7', 'Fret 7']]), pattern: sel('Pattern', [['wave', 'E-A-D-G-D-A'], ['skip', 'Skips: E-D-A-G'], ['arp', 'E-A-D-A-D-G-D-A']]) },
  bpm: 70, sub: 2, label: 'none',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const f = Number(p.fret);
    const e = ctx.str('E') < 0 ? 0 : ctx.str('E');
    const pat = { wave: [0, 1, 2, 3, 2, 1], skip: [0, 2, 1, 3, 1, 2], arp: [0, 1, 2, 1, 2, 3, 2, 1] }[p.pattern];
    const items = [];
    for (let r = 0; r < 4; r++) pat.forEach((d) => items.push(F(ctx, Math.min(e + d, ctx.tuning.length - 1), f, f ? 1 : 0)));
    b.frets(rhTags(items));
    return b.build({ label: 'none' });
  },
});

function chromaticBox(ctx, pos, order = [1, 2, 3, 4], strs = strings(ctx), opts = {}) {
  const items = [];
  for (const s of strs) for (const fg of order) items.push(F(ctx, s, pos + fg - 1, fg, opts));
  return items;
}

const c1234 = ex({
  id: 'tech-1234', module: M, level: 1,
  title: 'Chromatic 1-2-3-4',
  summary: 'One finger per fret on every string: the universal warm-up.',
  about: 'Place one finger per fret (index on the first fret of the position, pinky on the fourth). Play 1-2-3-4 on each string going up, then 4-3-2-1 coming back down. Keep fingers close to the frets and leave each finger down until you need it.',
  tips: ['Press just behind the fret with the minimum pressure that stops the buzz.', 'Fingers hover, they do not fly away from the strings.'],
  source: 'Bass Fitness (Josquin des Prés); Berklee Online Bass 101 L1; universal',
  // fret 5: frets are closer than at fret 1, so the one-finger-per-fret stretch is comfortable to start
  params: { pos: posP('5', 'Position') },
  bpm: 70, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    b.chord(`Pos ${pos}`);
    b.frets(chromaticBox(ctx, pos));
    b.frets(chromaticBox(ctx, pos, [4, 3, 2, 1], strings(ctx).reverse()));
    return b.build({ label: 'finger' });
  },
});

const climb = ex({
  id: 'tech-1234-climb', module: M, level: 2,
  title: '1-2-3-4 climbing the neck (classic warm-up)',
  summary: 'Up the strings, shift one fret, back down the strings, shift… to the top and back.',
  about: 'The classic chromatic warm-up. Play 1-2-3-4 across all strings, shift up one fret, play 4-3-2-1 back across the strings, shift again, and continue up the neck before coming back down. The frets get closer as you climb, so your stretch changes all the time.',
  tips: ['The shift is part of the exercise: keep it in time.', 'Alternate i-m strictly, or rake when you move to a lower string (see String crossing & raking).', 'Starting high and moving towards the nut is a great stretch exercise.'],
  source: 'Universal (Bass Fitness, Bass Aerobics, SBL)',
  params: { top: sel('Climb to', [['5', 'Fret 5'], ['9', 'Fret 9'], ['12', 'Fret 12']]), dir: sel('Direction', [['up', 'Up then down'], ['down', 'Start high (stretch)']]) },
  bpm: 80, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const top = Number(p.top);
    const upward = [...Array(top).keys()].map((i) => i + 1);
    const seq = p.dir === 'down'
      ? [...upward.slice().reverse(), ...upward.slice(1)]
      : [...upward, ...upward.slice(0, -1).reverse()];
    seq.forEach((pos, i) => {
      b.chord(`Pos ${pos}`);
      const up = i % 2 === 0;
      b.frets(up ? chromaticBox(ctx, pos) : chromaticBox(ctx, pos, [4, 3, 2, 1], strings(ctx).reverse()));
    });
    return b.build({ label: 'finger' });
  },
});

const PERMS = (() => {
  const out = [];
  const rec = (a, rest) => { if (!rest.length) out.push(a.join('')); rest.forEach((x, i) => rec([...a, x], rest.filter((_, j) => j !== i))); };
  rec([], [1, 2, 3, 4]);
  return out;
})();

const perms = ex({
  id: 'tech-permutations', module: M, level: 2, star: true,
  title: 'Finger permutations (all 24)',
  summary: '1234, 1243, 1324 … 4321: every finger order for complete independence.',
  about: 'There are 24 ways to order four fingers. Each one trains a different finger combination, especially the weak 3-4 pair. Choose one permutation and play it on every string up and down, or chain all 24. This is the most famous independence drill for bass.',
  tips: ['Do 2–3 permutations a day rather than all 24 at once.', 'Keep unused fingers hovering close to the string.', 'Combine with a string-crossing variation: one note per string.'],
  source: 'Josquin des Prés "Bass Fitness"; Adam Nitti (24 permutations); TalkingBass finger permutations',
  params: { perm: sel('Permutation', [...PERMS.map((x) => [x, x.split('').join('-')]), ['all', 'All 24 in a row']]), pos: posP('5', 'Position') },
  bpm: 70, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    const list = p.perm === 'all' ? PERMS : [p.perm];
    list.forEach((perm, i) => {
      const order = perm.split('').map(Number);
      const strs = i % 2 === 0 ? strings(ctx) : strings(ctx).reverse();
      b.chord(perm.split('').join('-'));
      b.frets(chromaticBox(ctx, pos, order, strs));
      if (list.length === 1) b.frets(chromaticBox(ctx, pos, order, strings(ctx).reverse()));
    });
    return b.build({ label: 'finger' });
  },
});

const SPIDERS = {
  a: { name: '1-3 / 2-4', pat: [[0, 1], [1, 3], [0, 2], [1, 4]] },
  b: { name: '1-4 / 2-3', pat: [[0, 1], [1, 4], [0, 2], [1, 3]] },
  c: { name: '1-2 / 3-4 (zig-zag)', pat: [[0, 1], [1, 2], [0, 3], [1, 4]] },
};

const spider = ex({
  id: 'tech-spider', module: M, level: 2,
  title: 'Spider walk',
  summary: 'Two fingers on one string, two on the next: crawl across the neck like a spider.',
  about: 'The spider alternates between two strings so that every finger has to land while another lifts. Play the pattern on each pair of strings going up, then back down, then shift one fret and repeat. It builds independence and accurate string crossing for the fretting hand.',
  tips: ['Only one finger down at a time: lift each finger as the next lands.', 'Watch the dots: they cross strings on every note.'],
  source: 'Classic guitar/bass "spider" (Bass Fitness, SBL)',
  params: { pattern: sel('Pattern', Object.entries(SPIDERS).map(([k, v]) => [k, v.name])), pos: posP('1', 'Start fret') },
  bpm: 70, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pat = SPIDERS[p.pattern].pat;
    const n = ctx.tuning.length;
    for (let k = 0; k < 4; k++) {
      const pos = startFret(p, ctx) + k;
      b.chord(`Pos ${pos}`);
      const pairs = [...Array(n - 1).keys()];
      for (const s0 of (k % 2 ? pairs.reverse() : pairs)) b.frets(pat.map(([ds, fg]) => F(ctx, s0 + ds, pos + fg - 1, fg)));
    }
    return b.build({ label: 'finger' });
  },
});

const diagonal = ex({
  id: 'tech-diagonal', module: M, level: 2,
  title: 'Diagonal "X" pattern',
  summary: 'E1 A2 D3 G4, then G1 D2 A3 E4: one finger per string in a diagonal.',
  about: 'Each finger plays on a different string, moving diagonally across the neck and back in the opposite direction, which draws an X. Shift one fret after each X. It trains string crossing for the fretting hand and is a great coordination exercise for both hands.',
  tips: ['Let each note ring only for its duration: lift the previous finger.', 'Raking helps when the line moves to a lower string.'],
  source: 'Common technique drill (Bass Fitness)',
  params: { pos: posP('1', 'Start fret') },
  bpm: 70, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const n = ctx.tuning.length;
    const e = Math.max(0, ctx.str('E'));
    const strs = [e, e + 1, e + 2, e + 3].filter((s) => s < n);
    for (let k = 0; k < 6; k++) {
      const pos = startFret(p, ctx) + (k < 3 ? k : 5 - k);
      b.chord(`Pos ${pos}`);
      b.frets(strs.map((s, i) => F(ctx, s, pos + i, i + 1)));
      b.frets([...strs].reverse().map((s, i) => F(ctx, s, pos + i, i + 1)));
    }
    return b.build({ label: 'finger' });
  },
});

const PAIRS = ['12', '13', '14', '23', '24', '34'];
const fingerPairs = ex({
  id: 'tech-finger-pairs', module: M, level: 2,
  title: 'Finger pairs (1-2, 1-3, 1-4, 2-3, 2-4, 3-4)',
  summary: 'Isolate two fingers at a time across all strings.',
  about: 'Work two fingers at a time: alternate them four times on each string, cross to the next string, then shift one fret and come back. Spend extra time on 3-4, the weakest pair.',
  tips: ['Keep the other fingers relaxed but close to the strings.', 'Use the hammer-on version (Trills) once this is even.'],
  source: 'TalkingBass "Ultimate finger exercise"',
  params: { pair: sel('Pair', PAIRS.map((x) => [x, `${x[0]}-${x[1]}`])), pos: posP('5', 'Position') },
  bpm: 70, sub: 4, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const [a, c] = p.pair.split('').map(Number);
    for (let k = 0; k < 4; k++) {
      const pos = startFret(p, ctx) + k;
      b.chord(`Pos ${pos}`);
      const strs = k % 2 ? strings(ctx).reverse() : strings(ctx);
      for (const s of strs) b.frets([a, c, a, c].map((fg) => F(ctx, s, pos + fg - 1, fg)));
    }
    return b.build({ label: 'finger' });
  },
});

const trills = ex({
  id: 'tech-trills', module: M, level: 3,
  title: 'Hammer-on & pull-off trills',
  summary: 'Pluck once, then hammer (H) and pull off (PO): left-hand strength and evenness.',
  about: 'Pluck the lower note, hammer the upper finger onto the string, then pull it off sideways to sound the lower note again. Only the first note of each group is plucked. Hammer-ons and pull-offs should be as loud and even as plucked notes.',
  tips: ['Hammer from close: precision beats force.', 'Pull off slightly downwards (towards the floor) to "pluck" with the fretting finger.'],
  source: 'Trinity Grade 3/7 (trills); MI; Bass Fitness',
  params: { pair: sel('Fingers', PAIRS.map((x) => [x, `${x[0]}-${x[1]}`])), pos: posP('5', 'Position') },
  bpm: 66, sub: 4, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const [a, c] = p.pair.split('').map(Number);
    const pos = startFret(p, ctx);
    for (const s of strings(ctx)) {
      b.chord(ctx.names[s]);
      const fa = pos + a - 1, fc = pos + c - 1;
      b.frets([F(ctx, s, fa, a), F(ctx, s, fc, c, { tag: 'H' }), F(ctx, s, fa, a, { tag: 'PO' }), F(ctx, s, fc, c, { tag: 'H' }),
        F(ctx, s, fa, a, { tag: 'PO' }), F(ctx, s, fc, c, { tag: 'H' }), F(ctx, s, fa, a, { tag: 'PO' }), F(ctx, s, fc, c, { tag: 'H' })]);
    }
    return b.build({ label: 'finger' });
  },
});

const legato = ex({
  id: 'tech-legato', module: M, level: 3,
  title: 'Legato chromatic (one pluck per string)',
  summary: 'Pluck once, hammer the next three notes; descending, pull off.',
  about: 'Pluck only the first note on each string and hammer on the other three going up; going down, pluck the top note and pull off three times. It builds a strong fretting hand and the smooth legato phrasing heard in fusion and solo bass.',
  tips: ['The hammered notes must match the plucked one in volume.', 'Then try it as sextuplets (6 per beat).'],
  source: 'Common legato technique drill (Bass Fitness, fusion pedagogy)',
  params: { pos: posP('5', 'Position') },
  bpm: 60, sub: 4, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    for (const s of strings(ctx)) b.frets([1, 2, 3, 4].map((fg, i) => F(ctx, s, pos + fg - 1, fg, i ? { tag: 'H' } : {})));
    for (const s of strings(ctx).reverse()) b.frets([4, 3, 2, 1].map((fg, i) => F(ctx, s, pos + fg - 1, fg, i ? { tag: 'PO' } : {})));
    return b.build({ label: 'finger' });
  },
});

const stringSkip = ex({
  id: 'tech-string-skip', module: M, level: 3,
  title: 'String skipping',
  summary: '1-2-3-4 jumping over a string: E→D, A→G and back.',
  about: 'Skipping a string is common in real lines (octaves, 10ths, wide arpeggios) and hard for both hands. The plucking hand must find the right string without looking, and the muting has to stay clean. Choose block mode (four notes per string) or zig-zag (every note changes string).',
  tips: ['Mute the skipped string with the fretting-hand fingers.', 'Zig-zag mode is much harder. Halve the tempo.'],
  source: 'Bass Fitness; Trinity Grade 7 (string-skipping); common',
  params: { style: sel('Style', [['block', 'Blocks (4 per string)'], ['zig', 'Zig-zag (alternate strings)']]), pos: posP('5', 'Position') },
  bpm: 66, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    const n = ctx.tuning.length;
    const pairs = [];
    for (let s = 0; s + 2 < n; s++) pairs.push([s, s + 2]);
    for (const [lo, hi] of pairs) {
      b.chord(`${ctx.names[lo]}–${ctx.names[hi]}`);
      if (p.style === 'block') b.frets([...chromaticBox(ctx, pos, [1, 2, 3, 4], [lo]), ...chromaticBox(ctx, pos, [1, 2, 3, 4], [hi])]);
      else b.frets([1, 2, 3, 4].flatMap((fg) => [F(ctx, lo, pos + fg - 1, fg), F(ctx, hi, pos + fg - 1, fg)]));
    }
    for (const [lo, hi] of pairs.reverse()) {
      b.chord(`${ctx.names[hi]}–${ctx.names[lo]}`);
      if (p.style === 'block') b.frets([...chromaticBox(ctx, pos, [4, 3, 2, 1], [hi]), ...chromaticBox(ctx, pos, [4, 3, 2, 1], [lo])]);
      else b.frets([4, 3, 2, 1].flatMap((fg) => [F(ctx, hi, pos + fg - 1, fg), F(ctx, lo, pos + fg - 1, fg)]));
    }
    return b.build({ label: 'finger' });
  },
});

const shifting = ex({
  id: 'tech-shifting', module: M, level: 3,
  title: 'Shifting along one string',
  summary: 'Groups of four notes, then shift: index lands where the pinky was (or further).',
  about: 'Clean shifts are what separate smooth bass lines from choppy ones. Play 1-2-3-4, then shift the hand so the index lands on the next fret of the group, and keep going up the string and back. The shift distance sets the difficulty: 1 fret is a crawl, 4 frets is a real jump.',
  tips: ['Shift on the last note: slide the whole hand, thumb included, keeping light contact.', 'Look at the target fret before you move.'],
  source: 'Willis linear approach; MI shifting drills; Simandl guide-finger shifts',
  params: { string: oneStringP('A'), shift: sel('Shift', [['1', '1 fret'], ['2', '2 frets'], ['3', '3 frets (index → pinky\'s fret)'], ['4', '4 frets (new position)']], '3') },
  bpm: 72, sub: 4, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = Math.max(0, ctx.str(p.string));
    const step = Number(p.shift);
    const starts = [];
    for (let pos = 1; pos + 3 <= 15; pos += step) starts.push(pos);
    starts.forEach((pos) => { b.chord(`Pos ${pos}`); b.frets([1, 2, 3, 4].map((fg) => F(ctx, s, pos + fg - 1, fg))); });
    [...starts].reverse().forEach((pos) => { b.chord(`Pos ${pos}`); b.frets([4, 3, 2, 1].map((fg) => F(ctx, s, pos + fg - 1, fg))); });
    return b.build({ label: 'finger' });
  },
});

const octaveRun = ex({
  id: 'tech-octaves', module: M, level: 2,
  title: 'Octave jumps (disco octaves)',
  summary: 'Root–octave 8ths moving chromatically up the neck: string skipping and muting.',
  about: 'Root on the E string (finger 1), octave two strings up and two frets higher (finger 3 or 4). Alternate them in 8ths and move up one fret every two beats. Mute the string in between with the underside of the index finger. This is the engine of disco and funk bass.',
  tips: ['Pluck the octave with the middle finger, the root with the index (or rake).', 'The A and D strings in between must stay silent.'],
  source: 'Disco/funk octave technique; BassBuzz; StudyBass',
  params: { pair: sel('Strings', [['B', 'B → A', { minStrings: 5 }], ['E', 'E → D'], ['A', 'A → G'], ['D', 'D → C', { minStrings: 6 }]], 'E') },
  bpm: 96, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = Math.max(0, ctx.str(p.pair));
    const frets = [1, 2, 3, 4, 5, 6, 7, 8, 7, 6, 5, 4, 3, 2];
    for (const f of frets) {
      const n = spellMidi(ctx.tuning[s] + f);
      b.chord(nm(n, S));
      b.frets([F(ctx, s, f, 1, { deg: 'R', tag: 'i' }), F(ctx, s + 2, f + 2, 3, { deg: 'R', tag: 'm' }), F(ctx, s, f, 1, { deg: 'R', tag: 'i' }), F(ctx, s + 2, f + 2, 3, { deg: 'R', tag: 'm' })]);
    }
    return b.build({ label: 'note' });
  },
});

const simandl = ex({
  id: 'tech-simandl', module: M, level: 3,
  title: 'Simandl 1-2-4 fingering',
  summary: 'The double-bass system: three fingers cover three frets in low positions.',
  about: 'In low positions the frets are wide, so the double-bass method (Franz Simandl) uses fingers 1, 2 and 4, with 3 and 4 working together, across a 3-fret span. Many players (Carol Kaye, upright doublers) use it in the first positions and one finger per fret higher up. Learn both and choose per passage.',
  tips: ['The ring finger supports the pinky; press with both.', 'Compare with "Chromatic 1-2-3-4" at fret 1: which is less tiring for you?'],
  source: 'Franz Simandl "New Method for the Double Bass"; Rufus Reid "The Evolving Bassist"; Carol Kaye',
  params: { pos: sel('Start position', [['1', 'Half position (fret 1)'], ['2', 'First position (fret 2)'], ['3', 'Second position (fret 3)']]) },
  bpm: 66, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (let k = 0; k < 4; k++) {
      const pos = startFret(p, ctx) + k;
      b.chord(`Pos ${pos}`);
      const strs = k % 2 ? strings(ctx).reverse() : strings(ctx);
      for (const s of strs) b.frets((k % 2 ? [[2, 4], [1, 2], [0, 1]] : [[0, 1], [1, 2], [2, 4]]).map(([d, fg]) => F(ctx, s, pos + d, fg)));
    }
    return b.build({ label: 'finger' });
  },
});

const stretch = ex({
  id: 'tech-stretch', module: M, level: 4,
  title: 'Stretch builder: one finger per fret towards the nut',
  summary: 'Start high, then move down one fret at a time while the stretch grows.',
  about: 'Starting at fret 9, play 1-2-3-4 across all strings and move down one fret per pass. As you approach the nut the frets get wider and the stretch grows. Stop as soon as you feel tension. Over weeks you will reach the first position comfortably.',
  tips: ['Pivot from the thumb behind the neck; keep the wrist straight.', 'Warm up first. Never force a stretch.'],
  source: 'Classic stretch routine (Patitucci/Wooten workshops; Bass Fitness)',
  params: { from: sel('Start at', [['9', 'Fret 9'], ['7', 'Fret 7'], ['12', 'Fret 12']]), to: sel('Down to', [['1', 'Fret 1'], ['3', 'Fret 3'], ['5', 'Fret 5']]) },
  bpm: 66, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let k = 0;
    for (let pos = Number(p.from); pos >= Number(p.to); pos--, k++) {
      b.chord(`Pos ${pos}`);
      b.frets(k % 2 ? chromaticBox(ctx, pos, [4, 3, 2, 1], strings(ctx).reverse()) : chromaticBox(ctx, pos));
    }
    return b.build({ label: 'finger' });
  },
});

const DYN = [['pp', 0.22], ['p', 0.38], ['mp', 0.55], ['mf', 0.72], ['f', 0.88], ['ff', 1.0]];
const dynamics = ex({
  id: 'tech-dynamics', module: M, level: 2,
  title: 'Dynamics ladder (pp → ff → pp)',
  summary: 'The same phrase at six volumes: control comes from the plucking hand.',
  about: 'Volume is part of technique. Play the same four-note group at each dynamic level from very soft (pp) to very loud (ff) and back. Keep the tone and timing identical; only the attack changes. The app plays the reference volume of each level.',
  tips: ['Soft notes still need a firm fretting hand, or they will buzz.', 'Loud does not mean faster: listen for rushing.'],
  source: 'Victor Wooten (dynamics as a musical element); Trinity Grades 1–2',
  params: { pos: posP('5', 'Position') },
  bpm: 72, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    const a = Math.max(0, ctx.str('A'));
    const seq = [...DYN, ...DYN.slice(0, -1).reverse()];
    for (const [mark, vel] of seq) {
      b.chord(mark);
      b.frets([1, 2, 3, 4, 4, 3, 2, 1].map((fg) => F(ctx, a, pos + fg - 1, fg, { vel })));
    }
    const inst = b.build({ label: 'finger' });
    // the marks are dynamics, not chords: the staff writes them below, in bold italic
    for (const st of inst.steps) if (st.chord) st.dyn = true;
    return inst;
  },
});

const accents = ex({
  id: 'tech-accents', module: M, level: 3,
  title: 'Accent shifting: groups of 3, 5 and 7 over 4/4',
  summary: '16th notes with an accent every N notes: the accent wanders across the beat.',
  about: 'Play steady 16ths on the chromatic 1-2-3-4 pattern and accent every 3rd (or 5th, or 7th) note. The accent falls on a different part of the beat each time, which builds plucking-hand control and the rhythmic independence used in funk and fusion.',
  tips: ['Accent = louder, not longer.', 'Count "1 e & a" out loud while the accents drift.'],
  source: 'Common rhythmic-control drill; Taller de Músics entrance (3 against 4)',
  params: { group: sel('Accent every', [['3', '3 notes'], ['5', '5 notes'], ['7', '7 notes'], ['332', '3+3+2']]), pos: posP('5', 'Position') },
  bpm: 66, sub: 4, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    const total = p.group === '332' ? 32 : Number(p.group) * 16;
    const accentAt = (i) => (p.group === '332' ? [0, 3, 6].includes(i % 8) : i % Number(p.group) === 0);
    const box = [...chromaticBox(ctx, pos), ...chromaticBox(ctx, pos, [4, 3, 2, 1], strings(ctx).reverse())];
    const items = [];
    for (let i = 0; i < total; i++) {
      const it = { ...box[i % box.length] };
      if (accentAt(i)) { it.accent = true; it.tag = '>'; it.vel = 1; } else it.vel = 0.6;
      items.push(it);
    }
    b.frets(items);
    return b.build({ label: 'finger' });
  },
});

const harmonics = ex({
  id: 'tech-harmonics', module: M, level: 4,
  title: 'Natural harmonics map (12, 7, 5, 4)',
  summary: 'Touch the string lightly over the fret wire: bell-like overtones.',
  about: 'A natural harmonic sounds when you touch the string lightly, exactly above the fret wire, without pressing, and pluck near the bridge. The 12th fret gives the octave, the 7th the octave plus a 5th, the 5th two octaves and the 4th two octaves plus a major 3rd. Harmonics are used for tuning, melodies (Jaco\'s "Portrait of Tracy") and chords.',
  tips: ['Touch directly over the metal fret, not between frets.', 'Pluck close to the bridge for a clearer harmonic.'],
  source: 'RSL Grade 7, Trinity Grade 8, Berklee Online Bass 101 L9',
  params: { order: sel('Order', [['fret', 'Fret by fret'], ['string', 'String by string']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const H = [[12, 12], [7, 19], [5, 24], [4, 28]];
    const add = (s, f, up) => b.frets([{ s, f, finger: 0, tag: '◊', play: ctx.tuning[s] + up, n: spellMidi(ctx.tuning[s] + up) }]);
    if (p.order === 'fret') for (const [f, up] of H) { b.chord(`Fret ${f}`); for (const s of strings(ctx)) add(s, f, up); }
    else for (const s of strings(ctx)) { b.chord(ctx.names[s]); for (const [f, up] of H) add(s, f, up); }
    return b.build({ label: 'note' });
  },
});

const ghost16 = ex({
  id: 'tech-ghost-16ths', module: M, level: 3,
  title: 'Ghost-note 16ths',
  summary: 'Real notes and muted "x" notes in a continuous 16th stream.',
  about: 'Ghost notes are muted, percussive notes: the fretting hand touches the string without pressing it down. Keeping a constant 16th-note motion and choosing which notes sound is the secret of Rocco Prestia, Jaco and modern funk. The x dots are ghost notes.',
  tips: ['Both hands keep moving all the time; only the fretting pressure changes.', 'Accents on beats 2 and 4 make it groove.'],
  source: 'RSL Grade 4, Trinity Grade 5; Rocco Prestia-style 16ths',
  params: { pattern: sel('Pattern', [['a', 'Note on every beat'], ['b', 'Notes on 1 and the "a"'], ['c', 'Octave funk']]) },
  bpm: 80, sub: 4, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const a = Math.max(0, ctx.str('A'));
    const d = Math.min(a + 1, ctx.tuning.length - 1);
    const pats = {
      a: ['R', 'x', 'x', 'x'],
      b: ['R', 'x', 'x', 'R', 'x', 'x', 'R', 'x', 'R', 'x', 'x', 'R', 'x', 'R', 'x', 'x'],
      c: ['R', 'x', '8', 'x', 'x', 'R', '8', 'x', 'R', 'x', '8', 'x', 'x', '8', 'R', 'x'],
    };
    for (let bar = 0; bar < 2; bar++) {
      const pat = pats[p.pattern];
      for (let r = 0; r < 16 / pat.length; r++) {
        b.frets(pat.map((t) => (t === 'x' ? F(ctx, a, 5, 1, { tag: 'x', deg: 'x' }) : t === '8' ? F(ctx, d, 7, 3, { deg: 'R' }) : F(ctx, a, 5, 1, { deg: 'R', accent: true }))));
      }
    }
    return b.build({ label: 'note' });
  },
});

const endurance = ex({
  id: 'tech-endurance', module: M, level: 4,
  title: 'Endurance 16ths on the roots',
  summary: 'Continuous root 16ths over I–IV–V: stamina for the plucking hand.',
  about: 'Rock, metal and dance music often need minutes of continuous 16th notes. Play the root of each chord in 16ths and keep the volume and spacing even. Switch on the speed trainer and push the tempo a little each day.',
  tips: ['Breathe and relax the shoulder: tension kills endurance.', 'Alternate strictly; at high tempos try three fingers (ring-middle-index, a-m-i).'],
  source: 'Trinity Grade 7; Jon Liebman "Bass Aerobics"; MI',
  params: { key: keyP(['1', '3', '5'], { def: '4' }), prog: progP(['I-IV-V-I', 'I-V-vi-IV', 'i-iv-v-min']) },
  bpm: 90, sub: 4, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { triads: true, S });
      const roots = chordRootMidis(chords);
      chords.forEach((c, i) => {
        b.chord(c.sym);
        b.line(Array.from({ length: 16 }, () => ({ midi: roots[i], n: c.root, deg: 'R' })), { place: { open: 'allow' } });
      });
    }
    return b.build({ label: 'note' });
  },
});

const pim = ex({
  id: 'tech-pim', module: M, level: 5,
  title: 'Thumb-index-middle (p-i-m) arpeggios',
  summary: 'Classical-guitar right hand on bass: thumb on the low string, fingers on the high strings.',
  about: 'Chordal and solo bassists use the thumb (p) for bass notes and the index and middle fingers (i, m) for the upper strings, like a classical guitarist. This lets you play wide arpeggios at speed with one plucking finger per string. The pattern spreads each chord as root (p), 5th (i), 10th (m), 5th (i).',
  tips: ['Keep the thumb slightly ahead of the fingers so the hand doesn\'t collapse.', 'Let the notes ring: this is chordal playing.'],
  source: 'Dominique Di Piazza / Matthew Garrison right-hand approach; classical guitar technique',
  params: { key: keyP(['1', '3', '5']), prog: progP(['I-vi-IV-V', 'I-V-vi-IV', 'ii-V-I', 'canon']) },
  bpm: 66, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const e = Math.max(0, ctx.str('E'));
    for (const k of keysFor(p.key)) {
      progChords(p.prog, k, { triads: true, S }).forEach((c) => {
        // root on the E string (frets 1-10) or else the A string
        let s = e, f = null;
        for (const cand of [e, e + 1]) {
          for (let ff = 1; ff <= 10 && f == null; ff++) if (T.mod(ctx.tuning[cand] + ff, 12) === T.pc(c.root)) { s = cand; f = ff; }
          if (f != null) break;
        }
        const third = c.ivs[1];
        const top = s === e
          ? { s: s + 3, f: f + T.semis(third) - 3, n: T.up(c.root, third), deg: T.fmtDeg(third) }
          : { s: s + 2, f: f + 2, n: c.root, deg: 'R' };
        const items = [
          { s, f, n: c.root, deg: 'R', tag: 'p' },
          { s: s + 1, f: f + 2, n: T.up(c.root, '5'), deg: '5', tag: 'i' },
          { ...top, tag: 'm' },
          { s: s + 1, f: f + 2, n: T.up(c.root, '5'), deg: '5', tag: 'i' },
        ];
        b.chord(c.sym);
        b.frets([...items, ...items]);
      });
    }
    return b.build({ label: 'degree' });
  },
});

const permStrings = ex({
  id: 'tech-permutations-across', module: M, level: 5,
  title: 'Permutations across strings (one finger per string)',
  summary: 'Each finger of the permutation lands on the next string: independence + string crossing.',
  about: 'A harder take on the 24 permutations: the four fingers stay in their frets (one finger per fret), but every note moves to the next string. Permutation 1-3-2-4 becomes E (finger 1), A (finger 3), D (finger 2), G (finger 4). Both hands must cross strings on every note, so this is one of the most demanding coordination drills there is.',
  tips: ['Rake on the way back down (G → E).', 'Choose the hardest permutations for you and repeat them, not all 24.'],
  source: 'Extension of Bass Fitness permutations (Josquin des Prés); Adam Nitti string-crossing permutations',
  params: { perm: sel('Permutation', [...PERMS.map((x) => [x, x.split('').join('-')]), ['all', 'All 24 in a row']], '1324'), pos: posP('5', 'Position') },
  bpm: 60, sub: 2, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pos = startFret(p, ctx);
    const e = Math.max(0, ctx.str('E'));
    const strs = [e, e + 1, e + 2, e + 3].filter((s) => s < ctx.tuning.length);
    const list = p.perm === 'all' ? PERMS : [p.perm];
    for (const perm of list) {
      const fingers = perm.split('').map(Number);
      b.chord(fingers.join('-'));
      const up = strs.map((s, i) => F(ctx, s, pos + fingers[i] - 1, fingers[i]));
      b.frets([...up, ...[...up].reverse()]);
      if (list.length === 1) for (let k = 1; k < 4; k++) {
        b.chord(`Pos ${pos + k}`);
        const u = strs.map((s, i) => F(ctx, s, pos + k + fingers[i] - 1, fingers[i]));
        b.frets([...u, ...[...u].reverse()]);
      }
    }
    return b.build({ label: 'finger' });
  },
});

const MUTE_PATTERNS = {
  open: { name: 'Open strings: play, then stop', notes: [[0, 0], [1, 0], [2, 0], [3, 0], [2, 0], [1, 0]] },
  skip: { name: 'Skip a string (the one between must stay silent)', notes: [[0, 0], [2, 2], [1, 0], [3, 2], [2, 0], [0, 3]] },
  fretted: { name: 'Fretted notes: release to stop', notes: [[0, 3], [1, 2], [1, 5], [2, 2], [2, 5], [1, 3]] },
};
const muting = ex({
  id: 'tech-muting', module: M, level: 2,
  title: 'Muting: stop every note, silence every string',
  summary: 'Play short notes and real rests: nothing may ring through the silence.',
  about: 'Clean bass playing is as much about the notes you stop as the ones you play. Each note here is followed by a rest that must be silent. Open strings are stopped by the plucking-hand thumb or fingers (the "floating thumb" rests on the strings below the one you play) and fretted notes by lifting the fretting finger just off the fret while it still touches the string. Listen for any ringing string, especially after string skips.',
  tips: ['Floating thumb: let the plucking thumb lie on the lower strings and move with your hand.', 'Fretted notes: relax the finger, do not lift it off the string.', 'Record yourself: ringing strings are easier to hear afterwards.'],
  source: 'Floating-thumb muting (Todd Johnson, Gary Willis); common technique teaching',
  params: { pattern: sel('Pattern', Object.entries(MUTE_PATTERNS).map(([k, v]) => [k, v.name])), length: sel('Note length', [['half', 'Half a beat, half a beat of rest'], ['quarter', 'A quarter beat, then rest']]) },
  bpm: 72, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = ctx.str('E');
    const on = p.length === 'half' ? 0.5 : 0.25;
    for (let round = 0; round < 2; round++) {
      MUTE_PATTERNS[p.pattern].notes.forEach(([ds, f], i) => {
        const s = base + ds;
        if (s >= ctx.tuning.length) return;
        // second position (index on fret 2): frets 2, 3 and 5 under fingers 1, 2 and 4
        b.frets([{ s, f, n: spellMidi(ctx.tuning[s] + f), deg: '', dur: on, finger: f === 0 ? 0 : Math.max(1, Math.min(4, f - 1)), chord: i === 0 && round === 0 ? 'Stop each note' : undefined }]);
        b.rest(1 - on);
      });
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

export default [permStrings, altPluck, c1234, raking, muting, climb, perms, spider, diagonal, fingerPairs, octaveRun, dynamics, trills, legato, stringSkip, shifting, simandl, accents, ghost16, stretch, harmonics, endurance, pim];
