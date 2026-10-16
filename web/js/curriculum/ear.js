// Ear training: hear a chord or a progression, name it, then see the answer. The chord is played
// with its notes hidden on the neck and in the strip; the answer step (silent) shows the shape and
// the name.
import { T, Builder, ex, sel, nm, chordName, progChords, PROGS, shapes } from './common.js';

const M = 'ear';
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

/** A playable chord shape: one note per string, strings ascending, or null. */
function shapeFor(ctx, tones) {
  // the smallest stretch that works: 4 frets, then 5 or 6 (four-note chords span more on a 4-string)
  for (const maxSpan of [4, 5, 6]) {
    const sh = shapes(tones.map((t) => t.midi), ctx, { lo: 1, hi: 15, maxSpan })
      .find((c) => c.pos.every((q, j) => j === 0 || q.s > c.pos[j - 1].s));
    if (sh) return tones.map((t, j) => ({ ...t, s: sh.pos[j].s, f: sh.pos[j].f }));
  }
  return null;
}

/** One round: arpeggio (hidden), block chord (hidden), then the answer (silent, shown). */
function chordRound(b, ctx, S, type, i) {
  const ivs = T.CHORDS[type].iv;
  let pcv, root, placed = null;
  // a random root whose chord has a playable one-note-per-string shape, as high as it fits
  // (close chords low on the bass are muddy and harder to hear)
  for (let tries = 0; tries < 24 && !placed; tries++) {
    pcv = Math.floor(Math.random() * 12);
    root = T.bestRoot(pcv, ivs);
    const base = 33 + T.mod(pcv - 33, 12);
    for (const rm of [base + 12, base]) {
      if (placed) break;
      placed = shapeFor(ctx, ivs.map((iv) => ({ midi: rm + T.semis(iv), n: T.up(root, iv), deg: T.fmtDeg(iv) })));
    }
  }
  if (!placed) return;
  const arp = placed.length === 3 ? [...placed, placed[1]] : placed;
  b.chord(`#${i + 1}`, 'Listen: what chord is it?');
  b.frets(arp.map((t) => ({ ...t, dur: 0.5, hide: true })));
  b.stack(placed, { dur: 2, hide: true });
  b.text(`${chordName(root, type, S)} · ${T.CHORDS[type].name}`);
  b.stack(placed, { dur: 4, silent: true });
}

const TRIADS = { mm: ['maj', 'min'], all: ['maj', 'min', 'dim', 'aug'] };
const triads = ex({
  id: 'ear-triads', module: M, level: 2, star: true,
  title: 'Hear the chord: major, minor, diminished, augmented',
  summary: 'A triad plays (broken, then together): name its quality before the answer appears.',
  about: 'Each round plays a triad on a random root, first broken (R-3-5-3) and then all together, with the notes hidden. Name it before the answer appears, right after the chord. Major sounds bright and stable, minor darker, diminished tense and narrow, augmented open and unresolved. Start with major and minor only.',
  tips: ['Sing the 3rd: a major 3rd is two whole steps above the root, a minor 3rd a step and a half.', 'Diminished = two minor 3rds stacked; augmented = two major 3rds.', 'A new random set comes every time you open the exercise or change an option.'],
  source: 'RSL, LCM and ABRSM aural tests (chord quality); Berklee ear training',
  params: { set: sel('Chords', [['mm', 'Major and minor'], ['all', 'Major, minor, diminished, augmented']]) },
  bpm: 72, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (let i = 0; i < 8; i++) chordRound(b, ctx, S, pick(TRIADS[p.set]), i);
    return b.build({ uniform: false, label: 'degree' });
  },
});

const SEVENTHS = { basic: ['maj7', 'dom7', 'min7'], five: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7'], all: ['maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'maj6', 'min6'] };
const sevenths = ex({
  id: 'ear-sevenths', module: M, level: 3,
  title: 'Hear the 7th chord: maj7, 7, m7, m7♭5, °7',
  summary: 'The five main 7th chords, broken and then together: name the quality.',
  about: 'Seventh chords add a fourth colour on top of the triad. Major 7 is soft and dreamy, dominant 7 wants to move, minor 7 is mellow, half-diminished is dark and searching, diminished 7 is tense and symmetrical. Each round plays one on a random root, notes hidden, and shows the answer right after the chord.',
  tips: ['First decide the triad (major or minor or diminished), then the 7th (major 7th, a half step under the octave, or minor 7th, a whole step under it).', 'Dominant 7 = major triad + minor 7th: the "unfinished" sound.'],
  source: 'RSL and LCM aural tests; Berklee ear training; jazz ear-training practice',
  params: { set: sel('Chords', [['basic', 'maj7, 7, m7'], ['five', 'maj7, 7, m7, m7♭5, °7'], ['all', '…plus m(maj7), 6 and m6']], 'five') },
  bpm: 72, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (let i = 0; i < 8; i++) chordRound(b, ctx, S, pick(SEVENTHS[p.set]), i);
    return b.build({ uniform: false, label: 'degree' });
  },
});

const PROG_SETS = {
  pop: ['I-IV-V-I', 'I-V-vi-IV', 'I-vi-IV-V', 'vi-IV-I-V', 'I-bVII-IV-I'],
  jazz: ['ii-V-I', 'I-vi-ii-V', 'iii-vi-ii-V', 'I-VI7-ii-V'],
  minor: ['i-iv-v-min', 'i-bVII-bVI-V', 'i-bVI-bIII-bVII', 'minor-ii-V-i'],
};
const progressions = ex({
  id: 'ear-progressions', module: M, level: 4,
  title: 'Hear the progression: name the chords by number',
  summary: 'A progression plays (root, then the chord): name it in Roman numerals before the answer.',
  about: 'Hearing progressions is hearing the bass: each chord plays as its root, then the chord above it, with the notes hidden. Follow the root movement (up a 4th, down a step…) and the quality of each chord, and name the progression in Roman numerals before the answer appears. Every round picks a new progression and a new key.',
  tips: ['Sing the roots back first: the bass line is the progression.', 'Listen for the V chord: it pulls back to I.', 'In minor keys, ♭VI and ♭VII are major chords a whole step apart.'],
  source: 'Berklee ear training (harmonic dictation); RSL and LCM aural tests (cadences)',
  params: { set: sel('Progressions', [['pop', 'Pop and rock (I IV V vi ♭VII)'], ['jazz', 'Jazz (ii–V–I, turnarounds)'], ['minor', 'Minor keys']]) },
  bpm: 80, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (let r = 0; r < 4; r++) {
      const key = pick(PROG_SETS[p.set]);
      const k = Math.floor(Math.random() * 12);
      const chords = progChords(key, k, { S });
      chords.forEach((c, j) => {
        const rm = 28 + T.mod(T.pc(c.root) - 28, 12);
        if (j === 0) b.chord(`#${r + 1}`, 'Listen: which progression?');
        b.line([{ midi: rm, n: c.root, deg: 'R', dur: 1, hide: true }], { place: { open: 'avoid', center: 4 } });
        const upper = shapeFor(ctx, c.ivs.slice(1, 4).map((iv) => ({ midi: rm + 12 + T.semis(iv), n: T.up(c.root, iv), deg: T.fmtDeg(iv) })))
          || shapeFor(ctx, c.ivs.slice(1, 4).map((iv) => ({ midi: rm + T.semis(iv), n: T.up(c.root, iv), deg: T.fmtDeg(iv) })))
          || shapeFor(ctx, c.ivs.slice(1, 3).map((iv) => ({ midi: rm + 12 + T.semis(iv), n: T.up(c.root, iv), deg: T.fmtDeg(iv) })));
        if (upper) b.stack(upper, { dur: 1, hide: true });
        else b.rest(1);
      });
      const used = chords.length * 2;
      const name = PROGS[key].name;
      b.text(`${name} · in ${nm(T.bestRoot(k, PROGS[key].minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv), S)}${PROGS[key].minor ? ' minor' : ''}`);
      const last = chords[chords.length - 1];
      const rm = 28 + T.mod(T.pc(last.root) - 28, 12);
      b.line([{ midi: rm, n: last.root, deg: 'R', dur: 4 + ((4 - (used % 4)) % 4), silent: true }], { place: { open: 'avoid', center: 4 } });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

export default [triads, sevenths, progressions];
