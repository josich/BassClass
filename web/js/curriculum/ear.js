// Ear training: hear a chord or a progression, name it, then see the answer. The chord is played
// with its notes hidden on the neck and in the strip; the answer step (silent) shows the shape and
// the name.
import { T, Builder, ex, sel, nm, chordName, progChords, PROGS, shapes } from './common.js';
import { showAt } from './games.js';

const M = 'ear';
const pick = (xs) => xs[Math.floor(Math.random() * xs.length)];

/** A playable chord shape: one note per string, strings ascending, or null. */
function shapeFor(ctx, tones, spans = [4, 5, 6]) {
  // the smallest stretch that works
  for (const maxSpan of spans) {
    const sh = shapes(tones.map((t) => t.midi), ctx, { lo: 1, hi: 15, maxSpan })
      .find((c) => c.pos.every((q, j) => j === 0 || q.s > c.pos[j - 1].s));
    if (sh) return tones.map((t, j) => ({ ...t, s: sh.pos[j].s, f: sh.pos[j].f }));
  }
  return null;
}

/** One round: arpeggio (hidden), block chord (hidden), then the answer (silent, shown). */
function chordRound(b, ctx, S, type, i) {
  const ivs = T.CHORDS[type].iv;
  // triads close, as high as they fit (close chords low on the bass are muddy); four-note chords
  // the way bassists voice them: root, 5th, 7th and the 3rd on top (R-5-7-10), in one hand position
  const spread = ivs.length === 4;
  const order = spread ? [0, 2, 3, 1] : ivs.map((_, j) => j);
  const tonesAt = (rm) => order.map((j, k) => {
    const iv = ivs[j], top = spread && k === 3;
    const deg = top ? ({ 3: '10', b3: 'b10' }[iv] || iv) : iv;
    return { midi: rm + T.semis(iv) + (top ? 12 : 0), n: T.up(root, iv), deg: T.fmtDeg(deg) };
  });
  let pcv, root, placed = null;
  for (let tries = 0; tries < 24 && !placed; tries++) {
    pcv = Math.floor(Math.random() * 12);
    root = T.bestRoot(pcv, ivs);
    const base = 33 + T.mod(pcv - 33, 12), low = 28 + T.mod(pcv - 28, 12);
    for (const rm of spread ? [low, low + 12] : [base + 12, base]) {
      if (placed) break;
      placed = shapeFor(ctx, tonesAt(rm), spread ? [3, 4] : [4, 5, 6]);
    }
  }
  if (!placed) return;
  const arp = placed.length === 3 ? [...placed, placed[1]] : placed;
  b.chord(`Round ${i + 1}`, 'Listen: what chord is it?');
  b.frets(arp.map((t) => ({ ...t, dur: 0.5, hide: true })));
  b.stack(placed, { dur: 2, hide: true });
  b.text(`${chordName(root, type, S)} · ${T.CHORDS[type].name}`);
  b.stack(placed, { dur: 4, silent: true });
}

// ---------------------------------------------------------------- tap mode
// (user, 2026-11-03: every exercise that asks for a note uses the tap system of #112, wherever tapping the neck can
// answer what is asked, and none shows the answer ahead; these open in it, 👆 goes back to the play-along rounds)

/**
 * The chord sounds, broken then together, over its root shown on the neck: tap its other notes, in any octave (the
 * 3rd and the 5th tell a triad's quality, the 7th a 7th chord's). Triads close, 7th chords R-5-7-10 as bassists play
 * them, the root from E2.
 */
const TONE_WORDS = { 3: '3rd', 5: '5th', 6: '6th', 7: '7th' };
const andList = (l) => (l.length < 2 ? l.join('') : `${l.slice(0, -1).join(', ')} and ${l[l.length - 1]}`);
function chordAsk(types, ctx, rand, S) {
  const type = types[Math.floor(rand() * types.length)];
  const ivs = T.CHORDS[type].iv;
  const pcv = Math.floor(rand() * 12);
  // (named as a lead sheet names it, by its triad: G♯m6, never A♭m6; QA round 24)
  const root = T.bestRoot(pcv, ivs.slice(0, 3));
  const rm = 40 + T.mod(pcv - 40, 12);
  const spread = ivs.length === 4;
  const midis = (spread ? [0, 2, 3, 1] : ivs.map((_, j) => j)).map((j, k) => rm + T.semis(ivs[j]) + (spread && k === 3 ? 12 : 0));
  const gap = 0.42, at = midis.length * gap + 0.2;
  // the root shown on the E or A string, frets 1–7, where the shapes start (the chord sounds where it sounds; any
  // octave answers: QA round 24, the root was on the G string for half the roots)
  const r = [ctx.str('E'), ctx.str('A')].filter((s) => s >= 0).map((s) => ({ s, f: T.mod(pcv - ctx.tuning[s], 12) })).find((q) => q.f >= 1 && q.f <= 7) || showAt(rm, ctx);
  const tones = ivs.slice(1).map((iv) => ({ pc: T.mod(pcv + T.semis(iv), 12), n: T.up(root, iv), deg: T.fmtDeg(iv) }));
  // (each tone by its own number: a 6th chord's is the 6th, not a 7th; QA round 24)
  const words = ivs.slice(1).map((iv) => TONE_WORDS[Number(iv.replace(/[^0-9]/g, ''))] || T.fmtDeg(iv));
  return {
    play: [...midis.map((m, k) => ({ midi: m, at: k * gap, dur: 0.5 })), ...midis.map((m) => ({ midi: m, at, dur: 1.7 }))],
    refs: [{ midi: ctx.tuning[r.s] + r.f, s: r.s, f: r.f, label: 'R', root: true }],
    ask: `The chord over its root: tap its ${andList(words)}`,
    answer: { pc: tones[0].pc, n: tones[0].n, show: rm + T.semis(ivs[1]), multi: tones, title: chordName(root, type, S), say: `${T.CHORDS[type].name}: R ${tones.map((t) => t.deg).join(' ')}` },
  };
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** A degree of the key as a numeral, by its chord: IV, vi, ♭VII, vii°. */
function numeral(where, ivs) {
  const flat = where.startsWith('b') ? '♭' : where.startsWith('#') ? '♯' : '';
  const base = ROMAN[Number(where.replace(/[b#]/, '')) - 1] || '?';
  const minor = ivs.includes('b3') && !ivs.includes('3');
  return `${flat}${minor ? base.toLowerCase() : base}${ivs.includes('b5') && minor ? '°' : ''}`;
}
/**
 * Hear the bass of a progression: the key's I chord (its root shown), then a chord of one of the set's progressions;
 * tap its root, in any octave.
 */
function progAsk(set, ctx, rand, S) {
  for (let tries = 0; tries < 40; tries++) {
    const key = PROG_SETS[set][Math.floor(rand() * PROG_SETS[set].length)];
    const prog = PROGS[key];
    const k = Math.floor(rand() * 12);
    const chords = progChords(key, k, { S });
    const js = chords.map((_, j) => j).filter((j) => typeof prog.chords[j][0] === 'string' && T.mod(T.pc(chords[j].root) - k, 12) !== 0);
    if (!js.length) continue;
    const j = js[Math.floor(rand() * js.length)], c = chords[j];
    const tm = 40 + T.mod(k - 40, 12), cm = 40 + T.mod(T.pc(c.root) - 40, 12);
    const third = prog.minor ? 3 : 4;
    const r = showAt(tm, ctx);
    const triad = (m, ivs) => [m, m + 12 + T.semis(ivs[1]), m + 12 + T.semis(ivs[2])];
    const tonicChord = triad(tm, ['1', third === 3 ? 'b3' : '3', '5']);
    const num = numeral(prog.chords[j][0], c.ivs);
    return {
      play: [...tonicChord.map((m) => ({ midi: m, at: 0, dur: 1.2 })), ...triad(cm, c.ivs).map((m) => ({ midi: m, at: 1.5, dur: 1.4 }))],
      refs: [{ midi: tm, s: r.s, f: r.f, label: prog.minor ? 'i' : 'I', root: true }],
      ask: `The key's ${prog.minor ? 'i' : 'I'}, then a chord of ${prog.name}: tap its root`,
      answer: { pc: T.pc(c.root), n: c.root, show: cm, label: num, say: `${num}: ${c.sym}` },
    };
  }
  return null;
}

const TRIADS = { mm: ['maj', 'min'], all: ['maj', 'min', 'dim', 'aug'] };
const triads = ex({
  id: 'ear-triads', module: M, level: 2,
  title: 'Hear the chord: major, minor, diminished, augmented',
  short: 'Chords, by ear',
  summary: 'A triad sounds over its root: tap its 3rd and 5th (👆: or name its quality as the rounds play).',
  about: 'Each round plays a triad on a random root, first broken (R-3-5-3) and then all together, with the notes hidden. Name it before the answer appears, right after the chord. Major sounds bright and stable, minor darker, diminished tense and narrow, augmented open and unresolved. Start with major and minor only.',
  tips: ['Sing the 3rd: a major 3rd is two whole steps above the root, a minor 3rd a step and a half.', 'Diminished = two minor 3rds stacked; augmented = two major 3rds.', 'A new random set comes every time you open the exercise or change an option.'],
  source: 'Aural tests in graded exams (chord quality); ear-training practice',
  params: { set: sel('Chords', [['mm', 'Major and minor'], ['all', 'Major, minor, diminished, augmented']]) },
  bpm: 72, sub: 1, label: 'degree',
  tap: { kind: 'ear', def: true, round: (p, ctx, rand, S) => chordAsk(TRIADS[p.set] || TRIADS.mm, ctx, rand, S) },
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
  short: '7th chords, by ear',
  summary: 'The five main 7th chords over their root: tap the 3rd, 5th and 7th (👆: or name the quality as the rounds play).',
  about: 'Seventh chords add a fourth colour on top of the triad. Major 7 is soft and dreamy, dominant 7 wants to move, minor 7 is mellow, half-diminished is dark and searching, diminished 7 is tense and symmetrical. Each round plays one on a random root, notes hidden, and shows the answer right after the chord. The chords are voiced the way bassists play them: root, 5th, 7th and the 3rd on top (R-5-7-10), in one hand position.',
  tips: ['First decide the triad (major or minor or diminished), then the 7th (major 7th, a half step under the octave, or minor 7th, a whole step under it).', 'Dominant 7 = major triad + minor 7th: the "unfinished" sound.'],
  source: 'Aural tests in graded exams; jazz ear-training practice',
  params: { set: sel('Chords', [['basic', 'maj7, 7, m7'], ['five', 'maj7, 7, m7, m7♭5, °7'], ['all', '…plus m(maj7), 6 and m6']], 'five') },
  bpm: 72, sub: 1, label: 'degree',
  tap: { kind: 'ear', def: true, round: (p, ctx, rand, S) => chordAsk(SEVENTHS[p.set] || SEVENTHS.five, ctx, rand, S) },
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
  title: 'Hear the progression: the chords by their roots',
  short: 'Progressions, by ear',
  summary: 'The key\'s I, then a chord of a progression: tap its root (👆: or name the progression in numerals as it plays).',
  about: 'Hearing progressions is hearing the bass: each chord plays as its root, then the chord above it, with the notes hidden. Follow the root movement (up a 4th, down a step…) and the quality of each chord, and name the progression in Roman numerals before the answer appears. Every round picks a new progression and a new key.',
  tips: ['Sing the roots back first: the bass line is the progression.', 'Listen for the V chord: it pulls back to I.', 'In minor keys, ♭VI and ♭VII are major chords a whole step apart.'],
  source: 'Harmonic dictation; aural tests in graded exams (cadences)',
  params: { set: sel('Progressions', [['pop', 'Pop and rock (I IV V vi ♭VII)'], ['jazz', 'Jazz (ii–V–I, turnarounds)'], ['minor', 'Minor keys']]) },
  bpm: 80, sub: 1, label: 'degree',
  tap: { kind: 'ear', def: true, round: (p, ctx, rand, S) => progAsk(p.set, ctx, rand, S) },
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (let r = 0; r < 4; r++) {
      const key = pick(PROG_SETS[p.set]);
      const k = Math.floor(Math.random() * 12);
      const chords = progChords(key, k, { S });
      chords.forEach((c, j) => {
        const rm = 28 + T.mod(T.pc(c.root) - 28, 12);
        if (j === 0) b.chord(`Round ${r + 1}`, 'Listen: which progression?');
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
