// Intervals: every distance between two notes, as a shape and a sound.
import { T, Builder, keysFor, ex, sel, keyP, nm, pickRoot, scaleRun, SCALE_PATTERNS, SCALE_TYPE_OPTS, spellMidi, rootStrP } from './common.js';

const M = 'intervals';
const IVS = ['b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7', '8', 'b9', '9', 'b10', '10'];
const ivName = (iv) => T.IV_NAMES[iv] || iv;
const ivP = (def = '5') => sel('Interval', IVS.map((iv) => [iv, `${iv === '8' ? '8' : T.fmtDeg(iv)} · ${ivName(iv)}`]), def);

const shapes = ex({
  id: 'iv-shapes', module: M, level: 2,
  title: 'Interval shapes from any root',
  summary: 'See and hear one interval: root, interval, root, interval, in any key.',
  about: 'Because all strings are tuned in 4ths, every interval has the same shape anywhere on the neck. A perfect 5th is always one string up and two frets up; a major 3rd is one string up and one fret back. Learn each shape, sing it, then play it in all keys.',
  tips: ['Sing the interval before playing it: ear and hands together.', 'Famous reference songs help: a perfect 4th starts "Here Comes the Bride".'],
  source: 'MI 011, Chuck Sher "The Improviser\'s Bass Method", Ariane Cap',
  params: { iv: ivP('5'), key: keyP(['1'], { def: '0' }), dir: sel('Direction', [['up', 'Ascending'], ['down', 'Descending'], ['both', 'Up then down']]) },
  bpm: 66, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const root = T.bestRoot(k, ['1', p.iv]);
      const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 8, prev, prefer: 'E' });
      const s = T.semis(p.iv);
      const R = { midi: r.midi, n: root, deg: 'R' };
      const I = { midi: r.midi + s, n: T.up(root, p.iv), deg: T.fmtDeg(p.iv) };
      const Id = { midi: r.midi + s - 12, n: T.up(root, p.iv), deg: T.fmtDeg(p.iv) };
      const seq = p.dir === 'up' ? [R, I, R, I] : p.dir === 'down' ? [{ ...R, midi: R.midi + 12 }, { ...Id, midi: Id.midi + 12 }, { ...R, midi: R.midi + 12 }, { ...Id, midi: Id.midi + 12 }] : [R, I, R, { ...Id }];
      b.chord(nm(root, S), ivName(p.iv));
      b.line(seq, { pattern: false, place: { open: 'avoid', center: r.f + 1 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const allFromRoot = ex({
  id: 'iv-all-from-root', module: M, level: 2,
  title: 'Every interval from one root',
  summary: 'R-♭2, R-2, R-♭3 … R-8: the whole interval family in one position.',
  about: 'Play the root, then each interval above it in turn, from the minor 2nd up to the octave. You will see the 12 shapes sitting inside one hand position and hear the character of each: tense (♭2, 7), open (4, 5), sweet (3, 6), dark (♭3, ♭6).',
  tips: ['Name each interval aloud as you play it.', 'Then switch the labels to "Note" to see the actual note names.'],
  source: 'Standard interval training (MI, Berklee, StudyBass)',
  params: { key: keyP(['1'], { def: '0', cycles: false }), root: rootStrP('E') },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const root = T.bestRoot(k, ['1', '3', '5']);
    const r = pickRoot(ctx, k, { strings: [p.root], hi: 10 });
    const items = [];
    for (const iv of ['b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7', '8']) {
      items.push({ midi: r.midi, n: root, deg: 'R', chord: T.fmtDeg(iv), text: ivName(iv) });
      items.push({ midi: r.midi + T.semis(iv), n: T.up(root, iv === '8' ? '1' : iv), deg: T.fmtDeg(iv) });
    }
    b.line(items, { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    return b.build({ label: 'degree' });
  },
});

const DIA = {
  thirds: 'In 3rds (1-3, 2-4…)', fourths: 'In 4ths', fifths: 'In 5ths', sixths: 'In 6ths', sevenths7: 'In 7ths',
  thirdsAlt: '3rds alternating', fourthsAlt: '4ths alternating', sixthsAlt: '6ths alternating',
};
const diatonic = ex({
  id: 'iv-diatonic', module: M, level: 3, star: true,
  title: 'Diatonic intervals through the scale',
  summary: 'The scale in 3rds, 4ths, 5ths, 6ths and 7ths: classic melodic sequences.',
  about: 'Move through the scale in pairs of notes a fixed number of scale steps apart: 1-3, 2-4, 3-5… (3rds), or 1-4, 2-5… (4ths), and so on. The alternating versions flip the direction of every second pair (1-3, 4-2, 3-5, 6-4), which is more melodic and great for fills. These sequences are a standard part of conservatory scale work.',
  tips: ['Name the interval quality as you go: in major the 3rds run M m m M M m m.', 'In 6ths you will skip strings. Mute carefully.'],
  source: 'Chuck Sher; Spanish conservatory access tests; Berklee levels; TalkingBass Creative Bassist',
  params: { pattern: sel('Interval', Object.entries(DIA)), key: keyP(T.SCALES.ionian.iv), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor', 'dorian', 'mixolydian'])), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: rootStrP('A') },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const many = keysFor(p.key).length > 1;
      const r = pickRoot(ctx, k, { strings: many ? ['E', 'A'] : [p.oct === '2' ? 'E' : p.root], hi: many ? 8 : 10, prev, prefer: p.root });
      if (many) b.chord(`${nm(tonic, S)}`);
      b.line(scaleRun(tonic, p.scale, r.midi, { octaves: Number(p.oct), pattern: p.pattern }), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const moving = ex({
  id: 'iv-moving', module: M, level: 2,
  title: 'One interval, moved chromatically',
  summary: 'Keep the shape, slide it up a fret at a time: hear the same distance from every root.',
  about: 'Hold an interval shape and move it up the neck one fret at a time, then back down. The sound of the interval stays the same while the notes change, which trains your ear to recognise intervals by sound and your hand to remember the shape.',
  tips: ['Sing the top note before you play it.', 'Do all intervals from ♭2 to the octave over a week.'],
  source: 'Common interval drill',
  params: { iv: ivP('3'), string: sel('Root on', [['E', 'E string'], ['A', 'A string']]) },
  bpm: 76, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = Math.max(0, ctx.str(p.string));
    const frets = [1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2];
    for (const f of frets) {
      const m = ctx.tuning[s] + f;
      const root = spellMidi(m, true);
      b.chord(nm(root, S));
      b.line([{ midi: m, n: root, deg: 'R' }, { midi: m + T.semis(p.iv), n: T.up(root, p.iv), deg: T.fmtDeg(p.iv) }], { pattern: false, place: { pin: { [m]: s }, open: 'avoid', center: f } });
    }
    return b.build({ label: 'degree' });
  },
});

const tenths = ex({
  id: 'iv-tenths', module: M, level: 4,
  title: 'Diatonic 10ths (Jaco style)',
  summary: 'Root on the E string, 10th on the G string, up the scale: big, piano-like harmony.',
  about: 'A 10th is a 3rd plus an octave. Play the scale on the E string and add the diatonic 10th on the G string: one fret higher for a major 10th, the same fret for a minor 10th. Played broken or as double stops, this is the sound of Jaco Pastorius\' ballads and Motown-era chordal bass.',
  tips: ['Pluck the E string with the thumb and the G string with a finger.', 'Mute the A and D strings with the fretting hand.'],
  source: 'LCM Grade 7; Berklee Online Bass 101 L4; Jaco Pastorius',
  params: { key: keyP(T.SCALES.ionian.iv, { cycles: false }), mode: sel('Style', [['broken', 'Broken (R then 10th)'], ['stop', 'Double stops']]), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'mixolydian', 'dorian'])) },
  bpm: 66, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const e = Math.max(0, ctx.str('E'));
    const g = e + 3;
    const k = Number(p.key);
    const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
    const ivs = T.SCALES[p.scale].iv;
    const notes = [];
    const base = ctx.tuning[e] + T.mod(k - ctx.tuning[e], 12) - 12;
    for (let i = 0; i < 21; i++) {
      const q = T.scalePitch(tonic, p.scale, base, i);
      const f = q.midi - ctx.tuning[e];
      if (f >= 1 && f <= 14) notes.push({ q, f, i });
    }
    // start on the tonic: up to the top of the window, down to its bottom, back to the tonic
    const t0 = notes.findIndex((x) => T.mod(x.i, ivs.length) === 0);
    const seq = t0 <= 0 ? [...notes, ...notes.slice(0, -1).reverse()]
      : [...notes.slice(t0), ...notes.slice(0, -1).reverse(), ...notes.slice(1, t0 + 1)];
    for (const { q, i } of seq) {
      const up = T.scalePitch(tonic, p.scale, base, i + 2 + 7);
      const fifth = T.scalePitch(tonic, p.scale, base, i + 4);
      const third = T.ivBetween(q.n, up.n);
      const quality = T.ivBetween(q.n, fifth.n);
      const lo = { s: e, f: q.midi - ctx.tuning[e], n: q.n, deg: 'R' };
      const hi = { s: g, f: up.midi - ctx.tuning[g], n: up.n, deg: third === 'b3' ? '♭10' : '10' };
      // the chord of the degree: B° in C major (not "Bm"), C+ in harmonic minor
      b.chord(nm(q.n, S) + (third === 'b3' ? (quality === 'b5' ? '°' : 'm') : quality === '#5' ? '+' : ''));
      if (p.mode === 'stop') b.stack([lo, hi], { dur: 2 });
      else b.frets([lo, hi]);
    }
    return b.build({ label: 'degree' });
  },
});

const octavesScale = ex({
  id: 'iv-scale-octaves', module: M, level: 4,
  title: 'Scale in octaves (double stops)',
  summary: 'Every scale note with its octave at once: two strings, two frets.',
  about: 'Play each note of the scale together with its octave as a double stop. It is a strong, unison-like sound used in rock riffs and solo bass, and it drills the octave shape until it is automatic. Pluck the two strings together with two fingers (or thumb and finger).',
  tips: ['Mute the string in between with the index finger.', 'Both notes must sound at the same volume.'],
  source: 'LCM Grades 6/8 (scales in octaves)',
  params: { key: keyP(T.SCALES.ionian.iv, { cycles: false }), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'minorPent', 'majorPent', 'blues'])), root: sel('Root on', [['E', 'E string'], ['A', 'A string']]) },
  bpm: 66, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
    // the octave sits 2 frets above and the scale climbs 12 more: use the string pair where it
    // fits under the highest fret (the chosen string first), or overshoots least
    const want = Math.max(0, ctx.str(p.root));
    let best = null;
    for (let x = 0; x + 2 < ctx.tuning.length; x++) {
      const f = T.mod(k - ctx.tuning[x], 12);
      const cost = Math.max(0, f + 14 - ctx.maxFret) * 10 + (x === want ? 0 : 1 + Math.abs(x - want));
      if (!best || cost < best.cost) best = { cost, x, f };
    }
    const s = best.x, f0 = best.f;
    const len = T.SCALES[p.scale].iv.length;
    const seq = [...Array(len + 1).keys(), ...[...Array(len).keys()].reverse()];
    for (const i of seq) {
      const q = T.scalePitch(tonic, p.scale, ctx.tuning[s] + f0, i);
      const f = q.midi - ctx.tuning[s];
      b.stack([{ s, f, n: q.n, deg: q.deg }, { s: s + 2, f: f + 2, n: q.n, deg: q.deg }]);
    }
    return b.build({ label: 'degree' });
  },
});

const CYC = { '4': ['4', 'Perfect 4ths'], '5': ['5', 'Perfect 5ths'], 'b3': ['b3', 'Minor 3rds (diminished)'], '3': ['3', 'Major 3rds (augmented)'], '2': ['2', 'Whole tones'], 'b5': ['b5', 'Tritones'] };
const cycles = ex({
  id: 'iv-cycles', module: M, level: 5,
  title: 'Interval cycles (Slonimsky-style)',
  summary: 'Chains of the same interval: 4ths, minor 3rds, major 3rds, whole tones… across the neck.',
  about: 'Stack the same interval again and again: 4ths give C F B♭ E♭…, minor 3rds give the diminished cycle C E♭ G♭ A, major 3rds give the augmented C E G♯. These symmetrical chains appear throughout modern jazz (Coltrane, Brecker) and are perfect for hand-to-ear coordination. The line climbs for two octaves and comes back.',
  tips: ['Find the repeating hand shape; the cycles are geometric on the bass.', 'Groups of 3 or 4 notes in 16ths sound very modern.'],
  source: 'Nicolas Slonimsky "Thesaurus of Scales and Melodic Patterns"; Coltrane/Brecker practice',
  params: { iv: sel('Interval', Object.entries(CYC).map(([k, v]) => [k, v[1]])), key: keyP(['1'], { cycles: false }) },
  bpm: 72, sub: 4, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const r = pickRoot(ctx, k, { strings: ['E'], hi: 7 });
    const root = T.bestRoot(k, ['1', '3', '5']);
    let n = root;
    const step = T.semis(CYC[p.iv][0]);
    const items = [];
    let m = r.midi;
    const top = r.midi + 24;
    while (m <= top) {
      // every return to the starting note is spelled and labelled as the root (C, not B♯)
      const isRoot = T.mod(m - r.midi, 12) === 0;
      if (isRoot) n = root;
      items.push({ midi: m, n, deg: isRoot ? 'R' : '·' });
      m += step;
      n = T.up(n, CYC[p.iv][0]);
      if (Math.abs(n.a) > 1) n = spellMidi(m, step === 5 || step === 10 || step === 3);
    }
    const down = items.slice(0, -1).reverse();
    b.chord(CYC[p.iv][1]);
    b.line([...items, ...down], { pattern: false, place: { open: 'avoid', center: r.f + 3 } });
    return b.build({ label: 'note' });
  },
});

const earQuiz = ex({
  id: 'iv-ear-quiz', module: M, level: 2,
  title: 'Interval quiz: hear it, name it, find it',
  summary: 'Random intervals from a root. Sing and find the second note before it appears.',
  about: 'The root plays, then the interval note. In Quiz mode the next note\'s name shows in the corner and its dot only appears when it sounds. Try to sing it, name the interval and play it before it appears. A new random set is generated every time you open the exercise or change a setting.',
  tips: ['Sing or name the second note before it sounds, then check yourself with the dots.', 'Start with only 3rds, 4ths and 5ths in mind, then add the rest.'],
  source: 'RSL ear tests; Charlie Banacos-style ear training',
  params: { key: keyP(['1'], { cycles: false }), set: sel('Intervals', [['basic', '3rds, 4ths, 5ths, octave'], ['all', 'All within an octave']]) },
  bpm: 60, sub: 1, label: 'degree', reveal: 'quiz',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const root = T.bestRoot(k, ['1', '3', '5']);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 7, prefer: 'E' });
    const pool = p.set === 'basic' ? ['b3', '3', '4', '5', '8'] : ['b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7', '8'];
    for (let i = 0; i < 12; i++) {
      const iv = pool[Math.floor(Math.random() * pool.length)];
      b.line([{ midi: r.midi, n: root, deg: 'R', chord: `#${i + 1}` }, { midi: r.midi + T.semis(iv), n: T.up(root, iv === '8' ? '1' : iv), deg: T.fmtDeg(iv), text: ivName(iv) }], { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree', reveal: 'quiz' });
  },
});

export default [shapes, allFromRoot, moving, earQuiz, diatonic, tenths, octavesScale, cycles];
void SCALE_PATTERNS;
