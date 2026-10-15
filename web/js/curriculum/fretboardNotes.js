// Fretboard & notes: learn where every note lives.
import { T, Builder, keysFor, ex, sel, keyP, nm, spellMidi, place, ZONES, zoneP, zoneShape, orderP } from './common.js';

const M = 'fretboard';
const NAT = new Set([0, 2, 4, 5, 7, 9, 11]);
// the third element hides an option on basses with fewer strings
const stringP = (def = 'E') => sel('String', [['E', 'E string'], ['A', 'A string'], ['D', 'D string'], ['G', 'G string'], ['B', 'Low B string', { minStrings: 5 }], ['C', 'High C string', { minStrings: 6 }]], def);
const strIdx = (ctx, name) => { const s = ctx.str(name); return s < 0 ? Math.max(0, ctx.str('E')) : s; };
const sName = (ctx, s) => `${ctx.names[s]} string`;

const openStrings = ex({
  id: 'fb-open-strings', module: M, level: 1,
  title: 'Open strings',
  summary: 'Name and play the open strings: E-A-D-G (B and C on 5/6-string basses).',
  about: 'The first exercise for the plucking hand. Play each open string four times, from the lowest (thickest) to the highest and back, saying its name. Use alternate plucking (index, middle) and let the other strings stay silent.',
  tips: ['Mnemonic for E-A-D-G: "Eat All Day, Good!"', 'Rest your thumb on the pickup or the E string and keep the plucking hand relaxed.'],
  source: 'Hal Leonard Bass Method, RSL Debut, BassBuzz, StudyBass',
  params: { reps: sel('Notes per string', [['4', '4'], ['2', '2'], ['1', '1 (string crossing)']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const n = ctx.tuning.length;
    const order = [...Array(n).keys(), ...[...Array(n).keys()].reverse().slice(1, -1)];
    for (const s of order) {
      b.chord(`${ctx.names[s]}`, sName(ctx, s));
      b.frets(Array.from({ length: Number(p.reps) }, () => ({ s, f: 0 })));
    }
    return b.build({ label: 'note' });
  },
});

const naturals = ex({
  id: 'fb-naturals', module: M, level: 1,
  title: 'Natural notes on one string',
  summary: 'E F G A B C D E: the musical alphabet along a string, fret 0 to 12.',
  about: 'Natural notes are the white keys of the piano: A B C D E F G. Between most of them there are two frets (a whole step), except B–C and E–F, which sit next to each other (a half step). Walk up one string to the 12th fret (the octave, marked with two dots) and back, naming every note.',
  tips: ['Notice the two half steps: B→C and E→F.', 'The 12th fret repeats the open string one octave higher.', 'Do every string, then try "Quiz" mode.'],
  source: 'TalkingBass Beginner Course, StudyBass, LCM Grade 1',
  params: { string: stringP('E'), range: sel('Range', [['0', 'Frets 0–12'], ['12', 'Frets 12–24 (upper octave)']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = strIdx(ctx, p.string);
    const lo = Number(p.range), hi = Math.min(lo + 12, ctx.maxFret);
    const frets = [];
    for (let f = lo; f <= hi; f++) if (NAT.has(T.mod(ctx.tuning[s] + f, 12))) frets.push(f);
    const seq = [...frets, ...frets.slice(0, -1).reverse()];
    b.chord(sName(ctx, s), lo + 12 > ctx.maxFret ? `frets ${lo}–${hi}: stops at your highest fret` : undefined);
    b.frets(seq.map((f) => ({ s, f })));
    return b.build({ label: 'note' });
  },
});

const chromaticString = ex({
  id: 'fb-chromatic-string', module: M, level: 1,
  title: 'All 12 notes on one string',
  summary: 'Sharps going up, flats coming down: every fret has a name.',
  about: 'A sharp (♯) raises a note one fret, a flat (♭) lowers it one fret, so the fret between F and G is both F♯ and G♭. Going up the string we name the in-between notes as sharps; coming down, as flats. That way the name always follows the direction you move.',
  tips: ['Say every name aloud: "F, F sharp, G…".', 'C♯ = D♭, D♯ = E♭, F♯ = G♭, G♯ = A♭, A♯ = B♭.'],
  source: 'StudyBass (chromatic naming), BassBuzz',
  params: { string: stringP('A') },
  bpm: 66, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = strIdx(ctx, p.string);
    b.chord(sName(ctx, s), 'sharps ↑');
    for (let f = 0; f <= 12; f++) b.frets([{ s, f, n: spellMidi(ctx.tuning[s] + f, false) }]);
    b.text('flats ↓');
    for (let f = 11; f >= 1; f--) b.frets([{ s, f, n: spellMidi(ctx.tuning[s] + f, true) }]);
    return b.build({ label: 'note' });
  },
});

const landmarks = ex({
  id: 'fb-landmarks', module: M, level: 1,
  title: 'Landmark frets: 3, 5, 7, 9, 12',
  summary: 'Memorise the notes under the fret markers. Every other note is ±1 fret away.',
  about: 'The dots on the neck are your map. Learn the notes at frets 3, 5, 7, 9 and 12 on every string. E string: G A B C♯ E. A string: C D E F♯ A. D string: F G A B D. G string: B♭ C D E G. Once these are automatic, any other note is just one fret away from a landmark.',
  tips: ['Fret 5 is always the next string\'s open note (that\'s how you tune).', 'Fret 7 gives the open note of the next lower string, one octave up (A string fret 7 = E, D string fret 7 = A).'],
  source: 'TalkingBass "Notes on the Neck"; position-marker landmarks (frets 3, 5, 7, 9, 12)',
  params: { order: sel('Order', [['string', 'String by string'], ['fret', 'Fret by fret (across strings)']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const frets = [3, 5, 7, 9, 12];
    const strings = [...ctx.tuning.keys()];
    const flats = (s, f) => [3, 10].includes(T.mod(ctx.tuning[s] + f, 12));
    if (p.order === 'string') {
      for (const s of strings) { b.chord(sName(ctx, s)); b.frets(frets.map((f) => ({ s, f, n: spellMidi(ctx.tuning[s] + f, flats(s, f)) }))); }
    } else {
      for (const f of frets) { b.chord(`Fret ${f}`); b.frets(strings.map((s) => ({ s, f, n: spellMidi(ctx.tuning[s] + f, flats(s, f)) }))); }
    }
    return b.build({ label: 'note' });
  },
});

const octaves = ex({
  id: 'fb-octaves', module: M, level: 1,
  title: 'The octave shape',
  summary: 'Two strings up, two frets up: the same note, one octave higher.',
  about: 'The octave is the most useful shape on the bass. From any note, go two strings up and two frets up and you have the same note an octave higher. This doubles what you know: learn the E and A strings and you automatically know D and G. Here you walk the natural notes of a string, each followed by its octave.',
  tips: ['Use finger 1 for the low note and finger 3 or 4 for the octave.', 'Mute the string in between with the side of your index finger.'],
  source: 'Hal Leonard Bass Method 2, TalkingBass, BassBuzz',
  params: { pair: sel('Strings', [['0', 'E → D'], ['1', 'A → G']]) },
  bpm: 66, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = Math.min(ctx.tuning.length - 3, Math.max(0, ctx.str('E') + Number(p.pair)));
    for (let f = 1; f <= 10; f++) {
      if (!NAT.has(T.mod(ctx.tuning[s] + f, 12))) continue;
      const n = spellMidi(ctx.tuning[s] + f);
      b.chord(nm(n, S));
      b.frets([{ s, f, n, deg: 'R', finger: 1 }, { s: s + 2, f: f + 2, n, deg: 'R', finger: 3 }]);
    }
    return b.build({ label: 'note' });
  },
});

const unison = ex({
  id: 'fb-unison', module: M, level: 2,
  title: 'Unisons: the same pitch on two strings',
  summary: 'Fret 5 on one string = open (or fret 0) on the next: one note, many places.',
  about: 'The same pitch exists in several places. Go up one string and back five frets and you land on exactly the same note. Knowing unisons lets you choose where to play a line (low frets are punchy, high frets are warm) and is the key to playing in position.',
  tips: ['Listen: both notes should sound identical in pitch, but different in tone.', 'Use your tuner: fret 5 against the next open string.'],
  source: 'Standard fretboard pedagogy (StudyBass, Berklee "Mastering the Fingerboard")',
  params: { string: stringP('E') },
  bpm: 66, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const s = Math.min(strIdx(ctx, p.string), ctx.tuning.length - 2);
    for (let f = 5; f <= 12; f++) {
      if (!NAT.has(T.mod(ctx.tuning[s] + f, 12))) continue;
      const n = spellMidi(ctx.tuning[s] + f);
      b.chord(nm(n, S));
      b.frets([{ s, f, n }, { s: s + 1, f: f - 5, n }, { s, f, n }, { s: s + 1, f: f - 5, n }]);
    }
    return b.build({ label: 'note' });
  },
});

const findNote = ex({
  id: 'fb-find-note', module: M, level: 2,
  title: 'Find every C (or any note)',
  summary: 'Every place a note lives, from the nut to the 12th fret and beyond.',
  about: 'Pick a note and play every occurrence of it on the neck, string by string. Then change note. With "all 12" you sweep the whole chromatic world in cycle-of-4ths order: C, F, B♭, E♭… After a few weeks you will see every note as a pattern of octave and unison shapes.',
  tips: ['Say the note name each time.', 'Look for the octave shape (2 strings, 2 frets) between occurrences.'],
  source: 'Berklee ILBS-244 "Mastering the Fingerboard"; Gary Willis Fingerboard Harmony; SBL Fretboard Accelerator',
  params: { key: keyP(['1'], { def: '0' }), range: sel('Range', [['12', 'Frets 0–12'], ['17', 'Frets 0–17'], ['24', 'Whole neck']]) },
  bpm: 66, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const hi = Math.min(Number(p.range), ctx.maxFret);
    for (const k of keysFor(p.key)) {
      const n = T.bestRoot(k, ['1', '3', '5']);
      b.chord(nm(n, S));
      ctx.tuning.forEach((open, s) => {
        for (let f = 0; f <= hi; f++) if (T.mod(open + f, 12) === k) b.frets([{ s, f, n, deg: 'R' }]);
      });
    }
    return b.build({ label: 'note' });
  },
});

const noteSweep = ex({
  id: 'fb-note-sweep', module: M, level: 2,
  title: 'Note sweep across the strings',
  summary: 'One note on every string, up and back, then the next note in the cycle.',
  about: 'Choose a note and find it on each string, staying in the same area of the neck. Play it from the lowest string to the highest and back, saying its name. Then move to the next note in the cycle of 4ths. This builds the vertical view of the neck that sight-readers and improvisers rely on.',
  tips: ['Stay within a few frets: use unisons and octaves, do not jump to the other end of the neck.', 'Start at 60 BPM with one note per beat.'],
  source: 'Cycle-of-4ths note-finding drills (StudyBass and others)',
  params: { key: keyP(['1'], { def: 'cycle4' }) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let center = 5;
    for (const k of keysFor(p.key)) {
      const n = T.bestRoot(k, ['1', '3', '5']);
      const pos = ctx.tuning.map((open, s) => {
        let best = null;
        for (let f = 1; f <= 14; f++) if (T.mod(open + f, 12) === k && (!best || Math.abs(f - center) < Math.abs(best - center))) best = f;
        return { s, f: best };
      });
      center = Math.round(pos.reduce((a, q) => a + q.f, 0) / pos.length);
      b.chord(nm(n, S));
      const seq = [...pos, ...pos.slice(0, -1).reverse()];
      b.frets(seq.map((q) => ({ s: q.s, f: q.f, n, deg: 'R' })));
    }
    return b.build({ label: 'note' });
  },
});

const cycleZone = ex({
  id: 'fb-cycle-zone', module: M, level: 2,
  title: 'Root notes around the cycle in one zone',
  summary: 'C F B♭ E♭ A♭ D♭ G♭ B E A D G without leaving a 5-fret zone.',
  about: 'Before playing chords around the cycle, find the roots. Play each root once per bar without leaving the zone. Because the strings are tuned in 4ths, moving a 4th is often the same fret on the next string. Spot that pattern and you will see why the cycle of 4ths is the bass player\'s best friend.',
  tips: ['One root per bar at 60 BPM, then two per bar, then one per beat.', 'Say the name before you play it.'],
  source: 'Ed Friedland "Building Walking Bass Lines" (cycle roots); SBL Zones',
  params: { zone: zoneP, order: orderP },
  bpm: 60, sub: 0.25, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.order)) {
      const n = T.bestRoot(k, ['1', '3', '5']);
      const z = zoneShape(k, ['1'], ctx, ZONES[p.zone], prev);
      if (!z) continue;
      b.chord(nm(n, S));
      b.frets([{ s: z.pos[0].s, f: z.pos[0].f, n, deg: 'R' }]);
      prev = z.rootMidi;
    }
    return b.build({ label: 'note', zone: ZONES[p.zone] });
  },
});

const positionNotes = ex({
  id: 'fb-position-notes', module: M, level: 3,
  title: 'Every note in one position',
  summary: 'Every note inside one 4-fret position, string by string (11 of the 12: the 12th is one fret away).',
  about: 'Reading and improvising happen "in position": the hand stays still and every note within reach must be known instantly. Play every fret of the position on each string, sharps up and flats down, and name them.',
  tips: ['Once you can do it slowly, try Quiz mode on the same position.', 'One finger per fret: index on the first fret of the zone.'],
  source: 'MI reading courses (low → middle → upper position); Berklee',
  params: { zone: sel('Position', [['1', 'Frets 1–4'], ['5', 'Frets 5–8'], ['7', 'Frets 7–10'], ['9', 'Frets 9–12'], ['12', 'Frets 12–15']]) },
  bpm: 66, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const lo = Number(p.zone);
    ctx.tuning.forEach((open, s) => {
      b.chord(sName(ctx, s));
      for (let f = lo; f < lo + 4; f++) b.frets([{ s, f, n: spellMidi(open + f, false), finger: f - lo + 1 }]);
    });
    for (let s = ctx.tuning.length - 1; s >= 0; s--) {
      b.chord(sName(ctx, s), 'flats');
      for (let f = lo + 3; f >= lo; f--) b.frets([{ s, f, n: spellMidi(ctx.tuning[s] + f, true), finger: f - lo + 1 }]);
    }
    return b.build({ label: 'note', zone: [lo, lo + 3] });
  },
});

const allOctaves = ex({
  id: 'fb-all-octaves', module: M, level: 3,
  title: 'One note in all its octaves',
  summary: 'Climb the same note from the lowest to the highest octave, through every location.',
  about: 'Play the chosen note in every octave from lowest to highest, using every location where that pitch can be played (unisons), before moving up. You will see how octave and unison shapes link the whole neck.',
  tips: ['Listen for identical pitch at unisons; the tone colour changes.', 'Do this with a different note each day.'],
  source: 'Willis "Fingerboard Harmony for Bass"; Berklee fingerboard mastery',
  params: { key: keyP(['1'], { cycles: false }) },
  bpm: 66, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const k = Number(p.key);
    const n = T.bestRoot(k, ['1', '3', '5']);
    const top = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
    for (let m = ctx.tuning[0]; m <= top; m++) {
      if (T.mod(m, 12) !== k) continue;
      b.chord(`${nm(n, S)}${Math.floor(m / 12) - 1}`);
      ctx.tuning.forEach((open, s) => { const f = m - open; if (f >= 0 && f <= ctx.maxFret) b.frets([{ s, f, n, deg: 'R' }]); });
    }
    return b.build({ label: 'note' });
  },
});

const quiz = ex({
  id: 'fb-quiz', module: M, level: 2,
  title: 'Note-finder quiz',
  summary: 'The next note\'s name appears. Find it before the beat. A new set every time.',
  about: 'Test yourself. The name of the next note is shown in the top-right corner. Find and play it before the beat; the dot appears when the beat arrives so you can check yourself. Change a setting or reopen the exercise to get a fresh random set.',
  tips: ['Start at 50 BPM, half notes. Speed up only when you hit 90% of them.', 'Narrow the range first (frets 0–5), then widen it.'],
  source: 'TalkingBass test sheets; StudyBass note drills',
  params: {
    range: sel('Frets', [['5', '0–5'], ['7', '0–7'], ['12', '0–12'], ['17', '0–17']]),
    strings: sel('Strings', [['EA', 'E & A only'], ['all', 'All strings']]),
    notes: sel('Notes', [['nat', 'Natural notes'], ['all', 'All 12 (♯/♭)']]),
  },
  bpm: 50, sub: 0.5, label: 'note', reveal: 'quiz',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const strs = p.strings === 'EA' ? [ctx.str('E'), ctx.str('A')] : [...ctx.tuning.keys()];
    const hi = Math.min(Number(p.range), ctx.maxFret);
    const pool = [];
    for (const s of strs) for (let f = 0; f <= hi; f++) {
      const pcv = T.mod(ctx.tuning[s] + f, 12);
      if (p.notes === 'nat' && !NAT.has(pcv)) continue;
      pool.push({ s, f });
    }
    let last = null;
    for (let i = 0; i < 24; i++) {
      let q;
      do { q = pool[Math.floor(Math.random() * pool.length)]; } while (last && q.s === last.s && q.f === last.f && pool.length > 1);
      last = q;
      b.frets([{ s: q.s, f: q.f, n: spellMidi(ctx.tuning[q.s] + q.f, Math.random() < 0.5) }]);
    }
    return b.build({ label: 'note', reveal: 'quiz' });
  },
});

const keyBox = ex({
  id: 'fb-key-box', module: M, level: 4,
  title: 'Key centres: every note of a key in one position',
  summary: 'Play all the notes of a key that fall inside one 5-fret box, low to high.',
  about: 'Gary Willis\' fingerboard approach: stop thinking of scales as patterns that start on the root. Instead, see all the notes of the key that lie under your hand in a given position, wherever they start. Play every key in one position by going around the cycle, and the neck turns into a map of keys.',
  tips: ['Begin on the lowest available note, not on the root.', 'Keep the hand still: one finger per fret plus small stretches.'],
  source: 'Gary Willis "Fingerboard Harmony for Bass" (key centres); RSL/LCM scales in multiple positions',
  params: { key: keyP(T.SCALES.ionian.iv, { def: '0' }), zone: sel('Position', [['1', 'Frets 1–5'], ['3', 'Frets 3–7'], ['5', 'Frets 5–9'], ['7', 'Frets 7–11'], ['9', 'Frets 9–13'], ['12', 'Frets 12–16']]) },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const lo = Number(p.zone), hi = lo + 4;
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES.ionian.iv);
      const notes = T.SCALES.ionian.iv.map((iv) => ({ iv, n: T.up(tonic, iv), pc: T.pc(T.up(tonic, iv)) }));
      const pos = [];
      ctx.tuning.forEach((open, s) => {
        for (let f = lo; f <= hi; f++) {
          const hit = notes.find((x) => x.pc === T.mod(open + f, 12));
          if (hit && !pos.some((q) => q.midi === open + f)) pos.push({ s, f, midi: open + f, n: hit.n, deg: T.fmtDeg(hit.iv) });
        }
      });
      pos.sort((a, c) => a.midi - c.midi);
      b.chord(`${nm(tonic, S)} major`);
      b.frets([...pos, ...pos.slice(0, -1).reverse()].map((q) => ({ s: q.s, f: q.f, n: q.n, deg: q.deg })));
    }
    return b.build({ label: 'degree', zone: [lo, hi] });
  },
});

export default [openStrings, naturals, chromaticString, landmarks, octaves, unison, findNote, noteSweep, cycleZone, quiz, positionNotes, allOctaves, keyBox];
