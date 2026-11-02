// Tap games (user, 2026-10-29: "gamify the quiz: step by step it sounds the note once and waits for the player's
// answer, clicking on the fretboard… no bass needed, just a game"; and the same for reading: "shows a note… the
// player taps the fretboard at the correct place"). Each game is a Library exercise with a `game`: its `round(p,
// ctx, rand, S, k)` makes question `k` of a set, which the exercise screen asks, judges and scores (ten rounds a set;
// user, 2026-10-30 and 2026-11-02: the regular screen, the notes revealed one by one on the staff, green or red). The
// tap drills (reading and note-finding exercises with a `tap`) play the same way. A round:
//   play:   what sounds, [{ midi, at (seconds from the start), dur }] (heard again with ▶)
//   refs:   what the neck shows with the question, [{ midi, s, f, label, root }] (the root, the open string)
//   ask:    the question in words (the note to find, for the note-finding drills)
//   answer: what to tap: `midi` (that pitch, any place) or `pc` (that note in any octave), within frets `lo`–`hi`
//           and `strings` when given, never a place in `not` (the note shown); its name `n`, `label` and `say` for
//           the reveal, `all` to find every place, `show` the pitch written on the staff for a `pc` answer
// `build` writes a sample of the game's notes as an ordinary line (the catalogue and the self-test read it).
import { T, Builder, ex, sel } from './common.js';
import { spellMidi } from '../builder.js';

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
/** The places of a pitch on the neck, frets 0–`hi`, lowest fret first. */
export const placesOf = (midi, ctx, hi = 12) => ctx.tuning.map((o, s) => ({ s, f: midi - o })).filter((q) => q.f >= 0 && q.f <= hi);
/** A place for a note shown on the neck (a root, a reference): frets 1–7 where it can, the lowest string first. */
const showAt = (midi, ctx) => placesOf(midi, ctx, 12).find((q) => q.f >= 1 && q.f <= 7) || placesOf(midi, ctx, 12)[0];
const IV_LABEL = { 0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7', 12: '8' };
// each interval's name and its steps of the scale (the second note spelled from the root: QA round 22, a minor 3rd
// above C is E♭, never D♯)
const IV_OF = { 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7', 12: '8' };
const IV_STEPS = { 1: 1, 2: 1, 3: 2, 4: 2, 5: 3, 6: 4, 7: 4, 8: 5, 9: 5, 10: 6, 11: 6, 12: 7 };
/** The note `semis` half steps below `n`, spelled as that interval (a minor 3rd under C is A). */
function downFrom(n, semis) {
  const l = T.mod(n.l - IV_STEPS[semis], 7);
  let a = T.mod(T.pc(n) - semis - T.pc({ l, a: 0 }), 12);
  if (a > 6) a -= 12;
  return { l, a };
}
const IV_NAME = { 1: 'minor 2nd', 2: 'major 2nd', 3: 'minor 3rd', 4: 'major 3rd', 5: 'perfect 4th', 6: 'tritone', 7: 'perfect 5th', 8: 'minor 6th', 9: 'major 6th', 10: 'minor 7th', 11: 'major 7th', 12: 'octave' };
/** A sample line of a game's rounds (for the catalogue and the self-test): its answers, placed on the neck. */
function sampleLine(game, p, ctx, S) {
  const b = new Builder(ctx, S);
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const items = Array.from({ length: 8 }, (_, k) => game.round(p, ctx, rand, S, k)).map((r) => ({ midi: r.answer.midi ?? r.answer.show, n: r.answer.n || spellMidi(r.answer.midi ?? r.answer.show), deg: r.answer.label }));
  b.line(items, { place: { open: 'allow', center: 4 } });
  return b.build({ label: 'note' });
}
/**
 * A tap set, played in the regular exercise screen (user, 2026-10-30: "keep the regular staff notation score sheet,
 * reveal note by note"; 2026-11-02: the ear games and the note-finding drills too): `count` rounds as quarter notes
 * on the staff, never the same note twice in a row; `tap` holds the rounds the screen asks (`asks`: each round and its
 * note's step), its kind ('read': the staff shows the note; 'ear': it sounds; 'find': its name is asked) and the
 * highest fret it asks for.
 */
export function tapSet(game, p, ctx, S, count = 10) {
  const rounds = [];
  for (let k = 0; rounds.length < count && k < count * 20; k++) {
    const r = game.round(p, ctx, Math.random, S, rounds.length);
    const m = r.answer.midi ?? r.answer.show;
    const was = rounds[rounds.length - 1]?.answer;
    if (was && (was.midi ?? was.show) === m && k < count * 10) continue;
    rounds.push(r);
  }
  const items = rounds.map((r) => { const m = r.answer.midi ?? r.answer.show; return { midi: m, n: r.answer.n || spellMidi(m), deg: '' }; });
  const b = new Builder(ctx, S);
  b.line(items, { place: { open: 'allow', center: 4 } });
  const hi = Math.max(12, ...rounds.map((r) => r.answer.hi ?? 12));
  return Object.assign(b.build({ label: 'none' }), { view: 'staff', reveal: 'quiz', noPrompt: true,
    tap: { kind: game.kind || 'read', hi, asks: rounds.map((r, i) => ({ i, ...r })) } });
}
const OPEN = (ctx) => ctx.tuning.map((m, s) => ({ m, s, name: ctx.names[s] }));

// ---------------------------------------------------------------- ear games

/** The open string, then a note on it: tap where it is. */
const earNotes = ex({
  id: 'game-ear-notes', module: 'ear', level: 1,
  title: 'Hear it, tap it: notes on a string',
  // (the header shows what tells the three apart first: QA round 22)
  short: 'Notes on a string, by ear',
  summary: 'A game, no bass needed: the open string sounds, then a note on it. Tap where it is.',
  about: 'A game for the ear and the neck at once. The app plays an open string, then a note higher up the same string. Tap where that note is on the neck: count up from the open string by ear, a fret for each half step. A right answer grows on the neck; a wrong one shows you where it was and plays it again. Ten rounds a set: start with the first five frets, then go up to the 12th.\n\nNo bass needed: play it anywhere. With your bass in your hands, find each note on the string before you tap it.',
  tips: ['Sing the open string, then slide your voice up to the note: how far did it go?', 'Small steps (1–2 frets) sound close; the 5th fret is the next string\'s note; the 12th is the octave.'],
  source: 'Original game. Finding notes by ear on one string is classic ear and fretboard training.',
  // (Frets first: the end card's "Harder" takes the first option's next choice; the strings by name, as bassists say
  // them: QA round 22)
  params: {
    frets: sel('Frets', [['5', 'Up to fret 5'], ['7', 'Up to fret 7'], ['12', 'Up to fret 12']]),
    string: sel('String', [['any', 'Any string'], ['B', 'Low B string', { minStrings: 5 }], ['E', 'E string'], ['A', 'A string'], ['D', 'D string'], ['G', 'G string'], ['C', 'High C string', { minStrings: 6 }]]),
  },
  label: 'note',
  game: {
    kind: 'ear',
    round(p, ctx, rand, S = {}) {
      const strings = OPEN(ctx);
      const st = strings.find((x) => x.name === p.string) || pick(rand, strings);
      const f = 1 + Math.floor(rand() * Number(p.frets || 5));
      const midi = st.m + f;
      const name = T.noteName(T.N(st.name), S.notation);
      return {
        play: [{ midi: st.m, at: 0, dur: 0.9 }, { midi, at: 1.0, dur: 1.2 }],
        refs: [{ midi: st.m, s: st.s, f: 0, label: name }],
        ask: `The open ${name} string, then a note on it`,
        answer: { midi, n: spellMidi(midi), label: '', say: `fret ${f} of the ${name} string` },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

const INTERVAL_SETS = {
  octave5: [7, 12],
  thirds: [3, 4],
  triad: [3, 4, 5, 7, 12],
  all: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
};
/** A root, then a note above (or below) it: tap the second note. */
const earIntervals = ex({
  id: 'game-ear-intervals', module: 'ear', level: 2,
  title: 'Hear it, tap it: intervals',
  short: 'Intervals, by ear',
  summary: 'A game, no bass needed: the root sounds and shows, then a second note. Tap it on the neck.',
  about: 'The root sounds and lights up on the neck; then a second note sounds. Tap where it is. Every interval has a shape on the neck you already know from the interval exercises: the 5th one string up and two frets up, the octave two strings up and two frets up, the major 3rd one string up and one fret down. Hearing the interval and finding its shape is how bassists learn lines by ear.\n\nStart with the octave and the 5th, then the 3rds, then every interval. "Up and down" asks for notes below the root too.',
  tips: ['Sing the root, then the note: is it close (a 2nd or 3rd) or far (a 5th, an octave)?', 'Major 3rd bright, minor 3rd dark; the 5th open and strong; the octave the same note higher.'],
  source: 'Original game. Interval recognition is part of the aural tests in graded exams.',
  params: {
    set: sel('Intervals', [['octave5', 'The octave and the 5th'], ['thirds', 'Major and minor 3rds'], ['triad', '3rds, 4th, 5th and octave'], ['all', 'Every interval to the octave']]),
    dir: sel('Direction', [['up', 'Up from the root'], ['both', 'Up and down']]),
  },
  label: 'degree',
  game: {
    kind: 'ear',
    round(p, ctx, rand) {
      const set = INTERVAL_SETS[p.set] || INTERVAL_SETS.octave5;
      const semis = pick(rand, set);
      const down = p.dir === 'both' && rand() < 0.5;
      // the root from C2 (a phone's speaker loses the low B and E: QA round 22) and both notes under G3 (the 12th
      // fret of the G string), whatever the bass
      const lo = 36 + (down ? semis : 0), hi = 55 - (down ? 0 : semis);
      const root = lo + Math.floor(rand() * Math.max(1, hi - lo + 1));
      const midi = root + (down ? -semis : semis);
      const r = showAt(root, ctx);
      const rootN = T.bestRoot(T.mod(root, 12), ['1', '3', '5']);
      return {
        play: [{ midi: root, at: 0, dur: 0.9 }, { midi, at: 1.0, dur: 1.2 }],
        refs: [{ midi: root, s: r.s, f: r.f, label: 'R', root: true }],
        ask: down ? 'The root, then a note below or above it' : 'The root, then a note above it',
        answer: { midi, n: down ? downFrom(rootN, semis) : T.up(rootN, IV_OF[semis]), label: down ? `↓${IV_LABEL[semis]}` : IV_LABEL[semis], say: `the ${IV_NAME[semis]} ${down ? 'below' : 'above'}` },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

const CHORD_SETS = { triads: ['maj', 'min'], sevenths: ['maj7', 'dom7', 'min7'], all: ['maj', 'min', 'maj7', 'dom7', 'min7', 'm7b5'] };
// the chords and their tones in words, one way for every chord ("the minor 3rd of B minor": QA round 22)
const CHORD_WORDS = { maj: 'major', min: 'minor', maj7: 'major 7th', dom7: 'dominant 7th', min7: 'minor 7th', m7b5: 'half-diminished' };
const TONE_WORDS = { 3: 'major 3rd', b3: 'minor 3rd', 5: '5th', b5: '♭5', 7: 'major 7th', b7: '♭7' };
/** A chord on a shown root, then one of its tones: tap it. */
const earChordTones = ex({
  id: 'game-ear-chordtones', module: 'ear', level: 3,
  title: 'Hear it, tap it: chord tones',
  short: 'Chord tones, by ear',
  summary: 'A game, no bass needed: a chord sounds over its root, then one of its notes. Tap it: the 3rd, the 5th, the 7th.',
  about: 'The root lights up and a chord sounds on it, note by note and then together; then one of its notes sounds alone. Tap where it is. A bass line is built from chord tones, so hearing which one sounds (the 3rd that makes the chord major or minor, the 5th, the 7th) is how you follow a band and learn lines by ear.\n\nStart with the 3rd of major and minor chords, then any tone of a triad, then the 7th chords.',
  tips: ['The 3rd decides major or minor: listen for it first.', 'The 5th sounds like the root\'s strong partner. The major 7th leans up to the octave; the ♭7 sits a whole step under it.'],
  source: 'Original game. Hearing chord tones is part of aural training for bassists and of jazz ear training.',
  params: {
    chords: sel('Chords', [['triads', 'Major and minor triads'], ['sevenths', 'maj7, 7 and m7'], ['all', 'Triads and 7th chords']]),
    ask: sel('Ask for', [['third', 'The 3rd'], ['any', 'Any chord tone']]),
  },
  label: 'degree',
  game: {
    kind: 'ear',
    round(p, ctx, rand, S = {}) {
      const type = pick(rand, CHORD_SETS[p.chords] || CHORD_SETS.triads);
      const ivs = T.CHORDS[type].iv;
      // the root E2–G♯2: a 3rd that low is still clear, and every tone up to the 7th sits under the G string's 12th
      // fret (G1–C♯2 was a rumble: QA round 22)
      const root = 40 + Math.floor(rand() * 5);
      const tones = ivs.filter((iv) => iv !== '1');
      const iv = p.ask === 'third' ? tones.find((x) => x === '3' || x === 'b3') : pick(rand, tones);
      const midi = root + T.semis(iv);
      const r = showAt(root, ctx);
      const rootN = T.bestRoot(T.mod(root, 12), ivs);
      const name = `${T.noteName(rootN, S.notation)} ${CHORD_WORDS[type]}`;
      const arp = ivs.map((x, i) => ({ midi: root + T.semis(x), at: i * 0.32, dur: 0.6 }));
      const chordAt = ivs.length * 0.32 + 0.1;
      return {
        play: [...arp, ...ivs.map((x) => ({ midi: root + T.semis(x), at: chordAt, dur: 1.1 })), { midi, at: chordAt + 1.5, dur: 1.2 }],
        refs: [{ midi: root, s: r.s, f: r.f, label: 'R', root: true }],
        ask: `${name}, then one of its notes`,
        answer: { midi, n: T.up(rootN, iv), label: T.fmtDeg(iv), say: `the ${TONE_WORDS[iv]} of ${name}` },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

// ---------------------------------------------------------------- reading games

const NATURAL = [0, 2, 4, 5, 7, 9, 11];
/** The pools of the reading game, by sounding pitch (bass is written an octave higher). */
const READ_POOLS = {
  // F on the clef's own line, then its neighbours: written D3 to A3
  f: [41, 40, 43, 38, 45],
  // the open strings and the naturals of the first position (frets 0–3)
  first: [28, 29, 31, 33, 35, 36, 38, 40, 41, 43, 45, 47],
  // every note of the first position, sharps and flats too (frets 0–4)
  sharps: Array.from({ length: 20 }, (_, i) => 28 + i),
  // the naturals up to the 12th fret of the G string: ledger lines above the staff
  neck: Array.from({ length: 28 }, (_, i) => 28 + i).filter((m) => NATURAL.includes(m % 12)),
};
/** A note on the bass clef: tap its place (or every place) on the neck. */
const readNotes = ex({
  id: 'game-read-notes', module: 'reading', level: 1,
  title: 'Read it, tap it',
  summary: 'A game, no bass needed: a note on the bass clef. Tap its place on the neck, or every place.',
  about: 'A note appears on the bass clef: tap where it is on the neck. It starts with F, the note on the clef\'s own line (the line between its two dots), and the notes next to it; then the first position, then sharps and flats, then up the neck over ledger lines. Bass is written an octave above the sound, so the F on the clef line is the D string\'s 3rd fret.\n\n"Every place" asks for the note wherever it is on the neck, up to the 12th fret: the same note sits on two or three strings.',
  tips: ['Find F on the clef line first, then count lines and spaces up or down from it.', 'Lines from the bottom: G B D F A. Spaces: A C E G.'],
  source: 'Original game. Note reading in the bass clef is part of graded exams and every method.',
  params: {
    notes: sel('Notes', [['f', 'F and its neighbours'], ['first', 'The first position'], ['sharps', 'With sharps and flats'], ['neck', 'Up the neck (ledger lines)']]),
    places: sel('Places', [['one', 'One place is enough'], ['all', 'Every place, to the 12th fret']]),
  },
  label: 'note',
  game: {
    kind: 'read',
    round(p, ctx, rand) {
      const pool = READ_POOLS[p.notes] || READ_POOLS.f;
      const midi = pick(rand, pool);
      // (a black key written as a sharp or a flat, either)
      const n = spellMidi(midi, !NATURAL.includes(midi % 12) && rand() < 0.5);
      return {
        play: [],
        refs: [],
        staff: { midi, n },
        ask: p.places === 'all' ? 'Tap every place of this note, to the 12th fret' : 'Where is this note? Tap it on the neck',
        answer: { midi, n, label: '', all: p.places === 'all', say: '' },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

export const EAR_GAMES = [earNotes, earIntervals, earChordTones];
export const READ_GAMES = [readNotes];
