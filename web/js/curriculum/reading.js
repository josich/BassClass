// Reading: bass clef from the first position to every key. The strip under the neck shows the
// staff (bass guitar is written an octave above its sound), and Quiz mode hides each dot until
// it sounds, so the eyes read the staff, not the neck.
import { T, Builder, ex, sel, keyP, nm, spellMidi } from './common.js';

const M = 'reading';
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];
const NAT = ['C', null, 'D', null, 'E', 'F', null, 'G', null, 'A', null, 'B'];
const STRINGS4 = ['E', 'A', 'D', 'G'];

/** Every pitch on the E–G strings between two frets, named by `name(midi)` (null = skip). */
function pool(ctx, lo, hi, name) {
  const out = new Map();
  for (const sName of STRINGS4) {
    const s = ctx.str(sName);
    if (s < 0) continue;
    for (let f = lo; f <= hi; f++) {
      const m = ctx.tuning[s] + f;
      const n = name(m);
      if (n && !out.has(m)) out.set(m, { midi: m, n });
    }
  }
  return [...out.values()].sort((a, b) => a.midi - b.midi);
}

/** Random notes from the pool, never the same note twice in a row. */
function randomNotes(notes, count) {
  const out = [];
  while (out.length < count) {
    const q = pick(notes);
    if (out.length && (q.midi === out[out.length - 1].midi || T.mod(q.midi - out[out.length - 1].midi, 12) === 6)) continue;
    out.push(q);
  }
  return out;
}

const CELLS = [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [0.5, 0.5, 1, 1, 1], [1, 0.5, 0.5, 2], [2, 2], [1.5, 0.5, 1, 1], [1, 1, 0.5, 0.5, 1]];
const ENDS = [[2, 2], [1, 1, 2], [4]];

/** A singable line: mostly steps, some 3rds and 4ths, ending on the tonic, in 4 bars of 4/4. */
function melody(notes, tonicPc, bars = 4) {
  const rhythm = [];
  for (let b = 0; b < bars - 1; b++) rhythm.push(...pick(CELLS));
  rhythm.push(...pick(ENDS));
  const tonics = notes.map((q, i) => (T.mod(q.midi, 12) === tonicPc ? i : -1)).filter((i) => i >= 0);
  let i = pick(tonics.length ? tonics : [Math.floor(notes.length / 2)]);
  const line = [];
  rhythm.forEach((dur, k) => {
    if (k === rhythm.length - 1 && tonics.length) {
      // land on the nearest tonic
      i = tonics.reduce((best, t) => (Math.abs(t - i) < Math.abs(best - i) ? t : best), tonics[0]);
    } else if (k > 0) {
      // a step, 3rd, 4th or 5th; never a tritone (F–B in C), which early sight-reading avoids
      let next = i;
      for (let tries = 0; tries < 12; tries++) {
        const r = Math.random();
        const move = r < 0.6 ? 1 : r < 0.85 ? 2 : r < 0.95 ? 3 : 4;
        let dir = Math.random() < 0.5 ? -1 : 1;
        if (i + dir * move < 0 || i + dir * move >= notes.length) dir = -dir;
        next = Math.max(0, Math.min(notes.length - 1, i + dir * move));
        if (next !== i && T.mod(notes[next].midi - notes[i].midi, 12) !== 6) break;
      }
      i = next;
    }
    line.push({ ...notes[i], dur });
  });
  return line;
}

/** Sharps (+) or flats (−) in the key signature of a major key (or of a minor key's relative major). */
export function keySignature(tonic, minor = false) {
  const major = minor ? T.up(tonic, 'b3') : tonic;
  const notes = T.SCALES.ionian.iv.map((iv) => T.up(major, iv));
  return notes.reduce((s, n) => s + Math.sign(n.a), 0);
}

// no note names on screen: the staff is the only clue (the dot shows its name once it sounds)
const common = {
  module: M, reveal: 'quiz', view: 'staff', label: 'none', sub: 1,
};

const naturals = ex({
  ...common,
  id: 'rd-naturals', level: 1, star: true,
  title: 'Reading bass clef: the natural notes in first position',
  summary: 'One note at a time on the staff: find it on the neck before its dot appears.',
  about: 'Bass is written in the bass clef, an octave above the sound: the open E string sits on the first ledger line below the staff, the open A on the bottom space, the open D on the middle line and the open G on the top space. This drill shows natural notes from the first position (frets 0–3) on the staff. In Quiz mode the dot only appears when the note sounds: read the staff, find the note, play it on time.',
  tips: ['Lines of the bass clef from the bottom: G B D F A ("Good Boys Do Fine Always"); spaces: A C E G ("All Cows Eat Grass").', 'Say the note name out loud as you play it.', 'A new random set comes every time you open the exercise or change an option.'],
  source: 'Standard bass-guitar notation (bass clef, sounding an octave lower); Hal Leonard Bass Method; Berklee reading method',
  params: { range: sel('Notes', [['ea', 'E and A strings'], ['all', 'All four strings']], 'ea') },
  bpm: 50,
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const lo = ctx.tuning[ctx.str('E')], hi = ctx.tuning[ctx.str(p.range === 'ea' ? 'A' : 'G')] + 3;
    const notes = pool(ctx, 0, 3, (m) => (m >= lo && m <= hi && NAT[T.mod(m, 12)] ? T.N(NAT[T.mod(m, 12)]) : null));
    b.chord('First position');
    b.line(randomNotes(notes, 16).map((q) => ({ midi: q.midi, n: q.n, deg: '' })), { place: { region: [0, 3], open: 'allow' } });
    return b.build({ uniform: false, label: 'none', reveal: 'quiz', view: 'staff', noPrompt: true });
  },
});

const accidentals = ex({
  ...common,
  id: 'rd-accidentals', level: 2,
  title: 'Reading sharps and flats in first position',
  summary: 'Every note of the first position, written with sharps and with flats.',
  about: 'A sharp raises a note by one fret, a flat lowers it by one fret, and the same fret can be written both ways (F♯ = G♭). This drill mixes every note of frets 0–4 and spells the black-key notes either way at random, so you learn to read both. Find each note before its dot appears.',
  tips: ['F♯ and G♭ are the same fret: read the letter first, then the accidental.', 'Use one finger per fret: frets 1–4 under fingers 1–4.'],
  source: 'Standard bass-guitar notation; Hal Leonard Bass Method; Berklee reading method',
  params: { range: sel('Notes', [['all', 'All four strings'], ['ea', 'E and A strings']]) },
  bpm: 50,
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const lo = ctx.tuning[ctx.str('E')], hi = ctx.tuning[ctx.str(p.range === 'ea' ? 'A' : 'G')] + 4;
    const notes = pool(ctx, 0, 4, (m) => (m >= lo && m <= hi ? (NAT[T.mod(m, 12)] ? T.N(NAT[T.mod(m, 12)]) : spellMidi(m, Math.random() < 0.5)) : null));
    b.chord('First position');
    b.line(randomNotes(notes, 16).map((q) => ({ midi: q.midi, n: q.n, deg: '' })), { place: { region: [0, 4], open: 'allow' } });
    return b.build({ uniform: false, label: 'none', reveal: 'quiz', view: 'staff', noPrompt: true });
  },
});

/** A melody in a major or minor key inside a fret window, with the key signature on the staff. */
function keyMelody(ctx, S, tonicPc, lo, hi, { minor = false } = {}) {
  const b = new Builder(ctx, S);
  const type = minor ? 'harmonicMinor' : 'ionian';
  const ivs = T.SCALES[type].iv;
  const tonic = T.bestRoot(tonicPc, minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv);
  const spelled = new Map(ivs.map((iv) => { const n = T.up(tonic, iv); return [T.pc(n), n]; }));
  const notes = pool(ctx, lo, hi, (m) => spelled.get(T.mod(m, 12)) || null);
  const line = melody(notes, tonicPc).map((q) => ({ midi: q.midi, n: q.n, deg: T.fmtDeg(T.ivBetween(tonic, q.n)), dur: q.dur }));
  b.chord(`${nm(tonic, S)} ${minor ? 'minor' : 'major'}`);
  b.line(line, { place: { region: [lo, hi], open: lo === 0 ? 'allow' : 'avoid' } });
  return b.build({ uniform: false, label: 'none', reveal: 'quiz', view: 'staff', noPrompt: true, keySig: keySignature(tonic, minor) });
}

const melodies = ex({
  ...common,
  id: 'rd-melodies', level: 2, star: true,
  title: 'Reading melodies in C, G, F, D and B♭',
  summary: 'Four-bar lines with a key signature: steps, small leaps, quarters, halves and 8ths.',
  about: 'Real reading means lines, not single notes. Each melody is four bars long, moves mostly by step with a few leaps, uses quarters, halves, dotted quarters and 8ths, and ends on the tonic. The key signature at the start of the staff tells you which notes are sharp or flat all the way through. Read ahead: your eyes should be one beat in front of your hands.',
  tips: ['Check the key signature before you start: in G every F is F♯, in F every B is B♭.', 'Count the rhythm aloud first, then play it.', 'Keep going after a wrong note: in real reading the band does not stop.'],
  source: 'Standard bass-guitar notation; RSL and Trinity sight-reading tests (first grades); Hal Leonard Bass Method',
  params: { key: sel('Key', [['0', 'C major'], ['7', 'G major'], ['5', 'F major'], ['2', 'D major'], ['10', 'B♭ major']]) },
  bpm: 60,
  build(p, ctx, S) { return keyMelody(ctx, S, Number(p.key), 0, 4); },
});

const upper = ex({
  ...common,
  id: 'rd-upper', level: 3,
  title: 'Reading up the neck: ledger lines and higher positions',
  summary: 'Melodies in the 5th, 7th and 9th positions, with ledger lines above the staff.',
  about: 'Higher up the neck the notes climb above the staff onto ledger lines (C on the first ledger line above is the A string, 15th fret, or the G string, 5th fret). Each melody stays inside one position: read it there, without sliding back to the first position.',
  tips: ['Ledger lines above the staff: C, E, G (lines); B, D, F (spaces between).', 'Find the position first: in 5th position, index finger on fret 5.'],
  source: 'Standard bass-guitar notation; Berklee position reading; MI reading courses (low → middle → upper position)',
  params: { pos: sel('Position', [['5', '5th position (frets 5–8)'], ['7', '7th position (frets 7–10)'], ['9', '9th position (frets 9–12)']]), key: sel('Key', [['0', 'C major'], ['7', 'G major'], ['5', 'F major'], ['9', 'A minor']]) },
  bpm: 60,
  build(p, ctx, S) {
    const lo = Number(p.pos);
    return p.key === '9' ? keyMelody(ctx, S, 9, lo, lo + 3, { minor: true }) : keyMelody(ctx, S, Number(p.key), lo, lo + 3);
  },
});

const allKeys = ex({
  ...common,
  id: 'rd-keys', level: 4,
  title: 'Reading in every key',
  summary: 'Melodies in all 12 major and minor keys across the neck, with key signatures.',
  about: 'Professional reading means any key. Each melody comes with its key signature (up to six sharps or flats) and moves across a wide range of the neck, from frets 1 to 9. Minor keys use the harmonic minor, so the raised 7th appears as an accidental, as in real music.',
  tips: ['Say the key signature before you play: "three flats: B♭, E♭, A♭".', 'Sharps in order: F C G D A E B. Flats: B E A D G C F.'],
  source: 'Standard bass-guitar notation; RSL, LCM and Trinity sight-reading (higher grades)',
  params: { key: keyP(T.SCALES.ionian.iv, { cycles: false }), mode: sel('Mode', [['major', 'Major'], ['minor', 'Minor (harmonic)']]) },
  bpm: 66,
  build(p, ctx, S) { return keyMelody(ctx, S, Number(p.key), 1, 9, { minor: p.mode === 'minor' }); },
});

export default [naturals, accidentals, melodies, upper, allKeys];
