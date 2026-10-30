// Tap games (user, 2026-10-29: "gamify the quiz: step by step it sounds the note once and waits for the player's
// answer, clicking on the fretboard… no bass needed, just a game"; and the same for reading: "shows a note… the
// player taps the fretboard at the correct place"). Each game is a Library exercise with a `game`: its `round(p,
// ctx, rand)` makes one question, which ui/game.js asks, judges and scores (ten rounds a set). A round:
//   play:   what sounds, [{ midi, at (seconds from the start), dur }] (heard again with "Hear it again")
//   refs:   what the neck shows before the answer, [{ midi, label, root }] (the root, the open string)
//   staff:  { midi, n } a written note to read (the reading games), shown on a bass-clef staff
//   answer: the pitch to tap (any place on the neck), its name and label for the reveal, `all` to find every place
// `build` writes a sample of the game's notes as an ordinary line (the catalogue and the self-test read it).
import { T, Builder, ex, sel } from './common.js';
import { spellMidi } from '../builder.js';

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
/** The places of a pitch on the neck, frets 0–`hi`, lowest fret first. */
export const placesOf = (midi, ctx, hi = 12) => ctx.tuning.map((o, s) => ({ s, f: midi - o })).filter((q) => q.f >= 0 && q.f <= hi);
/** A place for a note shown on the neck (a root, a reference): frets 1–7 where it can, the lowest string first. */
const showAt = (midi, ctx) => placesOf(midi, ctx, 12).find((q) => q.f >= 1 && q.f <= 7) || placesOf(midi, ctx, 12)[0];
const IV_LABEL = { 0: 'R', 1: '♭2', 2: '2', 3: '♭3', 4: '3', 5: '4', 6: '♭5', 7: '5', 8: '♭6', 9: '6', 10: '♭7', 11: '7', 12: '8' };
const IV_NAME = { 1: 'minor 2nd', 2: 'major 2nd', 3: 'minor 3rd', 4: 'major 3rd', 5: 'perfect 4th', 6: 'tritone', 7: 'perfect 5th', 8: 'minor 6th', 9: 'major 6th', 10: 'minor 7th', 11: 'major 7th', 12: 'octave' };
/** A sample line of a game's rounds (for the catalogue and the self-test): its answers, placed on the neck. */
function sampleLine(game, p, ctx, S) {
  const b = new Builder(ctx, S);
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const items = Array.from({ length: 8 }, () => game.round(p, ctx, rand)).map((r) => ({ midi: r.answer.midi, n: r.answer.n || spellMidi(r.answer.midi), deg: r.answer.label }));
  b.line(items, { place: { open: 'allow', center: 4 } });
  return b.build({ label: 'note' });
}
/**
 * A reading game's set, played in the regular exercise screen (user, 2026-10-30: "keep the regular staff notation
 * score sheet, reveal note by note"): `count` random rounds as quarter notes on the staff, never the same note twice
 * in a row; `tap` says what the screen asks (every place or one).
 */
export function tapSet(game, p, ctx, S, count = 10) {
  const items = [];
  for (let k = 0; items.length < count && k < count * 20; k++) {
    const a = game.round(p, ctx, Math.random).answer;
    if (items.length && items[items.length - 1].midi === a.midi && k < count * 10) continue;
    items.push({ midi: a.midi, n: a.n || spellMidi(a.midi), deg: '' });
  }
  const b = new Builder(ctx, S);
  b.line(items, { place: { open: 'allow', center: 4 } });
  return Object.assign(b.build({ label: 'none' }), { view: 'staff', reveal: 'quiz', noPrompt: true, tap: { all: p.places === 'all' } });
}
const OPEN = (ctx) => ctx.tuning.map((m, s) => ({ m, s, name: ctx.names[s] }));

// ---------------------------------------------------------------- ear games

/** The open string, then a note on it: tap where it is. */
const earNotes = ex({
  id: 'game-ear-notes', module: 'ear', level: 1,
  title: 'Hear it, tap it: notes on a string',
  summary: 'A game, no bass needed: the open string sounds, then a note on it. Tap where it is.',
  about: 'A game for the ear and the neck at once. The app plays an open string, then a note higher up the same string. Tap where that note is on the neck: count up from the open string by ear, a fret for each half step. A right answer grows on the neck; a wrong one shows you where it was and plays it again. Ten rounds a set: start with the first five frets, then go up to the 12th.\n\nNo bass needed: play it anywhere. With your bass in your hands, find each note on the string before you tap it.',
  tips: ['Sing the open string, then slide your voice up to the note: how far did it go?', 'Small steps (1–2 frets) sound close; the 5th fret is the next string\'s note; the 12th is the octave.'],
  source: 'Original game. Finding notes by ear on one string is classic ear and fretboard training.',
  params: {
    string: sel('String', [['any', 'Any string'], ['0', 'The lowest string'], ['1', 'The second string'], ['2', 'The third string'], ['3', 'The fourth string']]),
    frets: sel('Frets', [['5', 'Up to fret 5'], ['7', 'Up to fret 7'], ['12', 'Up to fret 12']]),
  },
  label: 'note',
  game: {
    kind: 'ear',
    round(p, ctx, rand) {
      const strings = OPEN(ctx);
      const st = p.string === 'any' ? pick(rand, strings) : strings[Math.min(strings.length - 1, Number(p.string) || 0)];
      const f = 1 + Math.floor(rand() * Number(p.frets || 5));
      const midi = st.m + f;
      return {
        play: [{ midi: st.m, at: 0, dur: 0.9 }, { midi, at: 1.0, dur: 1.2 }],
        refs: [{ midi: st.m, s: st.s, f: 0, label: st.name }],
        ask: `The open ${st.name} string, then a note on it: where is it?`,
        answer: { midi, n: spellMidi(midi), label: '', say: `fret ${f} of the ${st.name} string` },
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
      // the root low enough for a note above it, high enough for one below, on the lower strings
      const lo = ctx.tuning[0] + (down ? semis : 0), hi = ctx.tuning[1] + 7;
      const root = lo + Math.floor(rand() * Math.max(1, hi - lo));
      const midi = root + (down ? -semis : semis);
      const r = showAt(root, ctx);
      return {
        play: [{ midi: root, at: 0, dur: 0.9 }, { midi, at: 1.0, dur: 1.2 }],
        refs: [{ midi: root, s: r.s, f: r.f, label: 'R', root: true }],
        ask: down ? 'The root, then a note below or above it: where is it?' : 'The root, then a note above it: where is it?',
        answer: { midi, n: spellMidi(midi), label: down ? `↓${IV_LABEL[semis]}` : IV_LABEL[semis], say: `the ${IV_NAME[semis]} ${down ? 'below' : 'above'}` },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

const CHORD_SETS = { triads: ['maj', 'min'], sevenths: ['maj7', 'dom7', 'min7'], all: ['maj', 'min', 'maj7', 'dom7', 'min7', 'm7b5'] };
/** A chord on a shown root, then one of its tones: tap it. */
const earChordTones = ex({
  id: 'game-ear-chordtones', module: 'ear', level: 3,
  title: 'Hear it, tap it: chord tones',
  summary: 'A game, no bass needed: a chord sounds over its root, then one of its notes. Tap it: the 3rd, the 5th, the 7th.',
  about: 'The root lights up and a chord sounds on it, note by note and then together; then one of its notes sounds alone. Tap where it is. A bass line is built from chord tones, so hearing which one sounds (the 3rd that makes the chord major or minor, the 5th, the 7th) is how you follow a band and learn lines by ear.\n\nStart with the 3rd of major and minor chords, then any tone of a triad, then the 7th chords.',
  tips: ['The 3rd decides major or minor: listen for it first.', 'The 5th sounds like the root\'s strong partner; the 7th leans back towards the octave.'],
  source: 'Original game. Hearing chord tones is part of aural training for bassists and of jazz ear training.',
  params: {
    chords: sel('Chords', [['triads', 'Major and minor triads'], ['sevenths', 'maj7, 7 and m7'], ['all', 'Triads and 7th chords']]),
    ask: sel('Ask for', [['third', 'The 3rd'], ['any', 'Any chord tone']]),
  },
  label: 'degree',
  game: {
    kind: 'ear',
    round(p, ctx, rand) {
      const type = pick(rand, CHORD_SETS[p.chords] || CHORD_SETS.triads);
      const ivs = T.CHORDS[type].iv;
      const root = ctx.tuning[0] + 3 + Math.floor(rand() * 7);
      const tones = ivs.filter((iv) => iv !== '1');
      const iv = p.ask === 'third' ? tones.find((x) => x === '3' || x === 'b3') : pick(rand, tones);
      const midi = root + T.semis(iv);
      const r = showAt(root, ctx);
      const rootN = T.bestRoot(T.mod(root, 12), ivs);
      const name = T.noteName(rootN, 'letters') + (type === 'maj' ? ' major' : T.CHORDS[type].sym);
      const arp = ivs.map((x, i) => ({ midi: root + T.semis(x), at: i * 0.32, dur: 0.6 }));
      const chordAt = ivs.length * 0.32 + 0.1;
      return {
        play: [...arp, ...ivs.map((x) => ({ midi: root + T.semis(x), at: chordAt, dur: 1.1 })), { midi, at: chordAt + 1.5, dur: 1.2 }],
        refs: [{ midi: root, s: r.s, f: r.f, label: 'R', root: true }],
        ask: `${name}, then one of its notes: where is it?`,
        answer: { midi, n: T.up(rootN, iv), label: T.fmtDeg(iv), say: `the ${T.fmtDeg(iv)} of ${name}` },
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
