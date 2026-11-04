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
import { T, Builder, ex, sel, nm, chordName } from './common.js';
import { spellMidi } from '../builder.js';

const pick = (rand, list) => list[Math.floor(rand() * list.length)];
/** The places of a pitch on the neck, frets 0–`hi`, lowest fret first. */
export const placesOf = (midi, ctx, hi = 12) => ctx.tuning.map((o, s) => ({ s, f: midi - o })).filter((q) => q.f >= 0 && q.f <= hi);
/** A place for a note shown on the neck (a root, a reference): frets 1–7 where it can, the lowest string first. */
export const showAt = (midi, ctx) => placesOf(midi, ctx, 12).find((q) => q.f >= 1 && q.f <= 7) || placesOf(midi, ctx, 12)[0];
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
  title: 'One string, by ear',
  // (one name, the header's too, what tells the three apart first: QA rounds 22 and 25)
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
        answer: { midi, n: spellMidi(midi), label: '', say: `fret ${f} of the ${name} string`, strings: [st.s], hi: Number(p.frets || 5) },
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
/**
 * One interval round: the root (midi) sounds and shows, then the note `semis` above it (below, `down`); tap the second
 * note. The intervals game's round, and the interval quiz's (#225) in tap mode.
 */
export function intervalAsk(root, semis, down, ctx) {
  const midi = root + (down ? -semis : semis);
  const r = showAt(root, ctx);
  // the root's other name when the answer would need a double accidental or C♭ F♭ E♯ B♯ (QA round 23, user's
  // choice: G♭'s minor 3rd is B♭♭, so the root is F♯ and the answer A)
  const spell = (rn) => (down ? downFrom(rn, semis) : T.up(rn, IV_OF[semis]));
  const odd = (n) => Math.abs(n.a) > 1 || (n.a === -1 && (n.l === 0 || n.l === 3)) || (n.a === 1 && (n.l === 2 || n.l === 6));
  let rootN = T.bestRoot(T.mod(root, 12), ['1', '3', '5']);
  if (odd(spell(rootN))) {
    const other = [spellMidi(root, false), spellMidi(root, true)].find((x) => x.l !== rootN.l);
    if (other && !odd(spell(other))) rootN = other;
  }
  return {
    play: [{ midi: root, at: 0, dur: 0.9 }, { midi, at: 1.0, dur: 1.2 }],
    refs: [{ midi: root, s: r.s, f: r.f, label: 'R', root: true }],
    ask: down ? 'The root, then a note below or above it' : 'The root, then a note above it',
    // (the tritone over F, C♭ as its ♭5, is written as the ♯4, B)
    answer: { midi, ...(odd(spell(rootN)) && semis === 6 && !down ? { n: T.up(rootN, '#4'), label: '♯4' } : { n: spell(rootN), label: down ? `↓${IV_LABEL[semis]}` : IV_LABEL[semis] }), say: `the ${IV_NAME[semis]} ${down ? 'below' : 'above'}` },
  };
}

/** A root, then a note above (or below) it: tap the second note. */
const earIntervals = ex({
  id: 'game-ear-intervals', module: 'ear', level: 2,
  title: 'Intervals, by ear',
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
      return intervalAsk(lo + Math.floor(rand() * Math.max(1, hi - lo + 1)), semis, down, ctx);
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
  title: 'Chord tones, by ear',
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
        // (every place asked: to the 12th fret, the 13th shown greyed, QA round 25)
        answer: { midi, n, label: '', all: p.places === 'all', ...(p.places === 'all' ? { hi: 12 } : {}), say: '' },
      };
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

// ---------------------------------------------------------------- theory games
// (content QA G17, 2026-11-03: theory checked on the neck, "tap the 3rd of E♭7"): the question names a chord tone,
// a note of a key, a key by its signature or a chord by its numeral; tap that note anywhere, in any octave. Nothing
// sounds and nothing is shown before the answer (the 'theory' kind: the screen shows the question, `q`).

const ORD = ['', '1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th'];
const WORD = ['no', 'one', 'two', 'three', 'four', 'five', 'six'];
/** A note needing a double accidental or C♭ F♭ E♯ B♯: a quiz at these levels leaves it out, or writes it plainly. */
const odd = (n) => Math.abs(n.a) > 1 || (n.a === -1 && (n.l === 0 || n.l === 3)) || (n.a === 1 && (n.l === 2 || n.l === 6));
/** The lowest place of a note on the neck: where the staff writes a pitch-class answer. */
const lowest = (pcv, ctx) => Math.min(...ctx.tuning.map((o) => o + T.mod(pcv - o, 12)));
/** A theory round: the question (`q`, with its key word in bold), the note asked (spelled), its label and the verdict's words. */
function theoryAsk(q, n, label, say, ask, ctx) {
  const pcv = T.pc(n);
  return { play: [], refs: [], q, ask, answer: { pc: pcv, n, show: lowest(pcv, ctx), label, say } };
}
/** Up to 40 tries for a round whose answer reads plainly (one the generator gives up on is kept as it is). */
function plainly(make) {
  let r;
  for (let k = 0; k < 40; k++) { r = make(); if (!odd(r.answer.n)) return r; }
  return r;
}
const TONE_WORD = (iv) => ORD[Number(String(iv).replace(/[#b]/g, '')) || 1];

const theoryChords = ex({
  id: 'game-theory', module: 'harmony', level: 2,
  title: 'Theory on the neck: chords and keys',
  short: 'Theory, tap it',
  summary: 'A quiz, no bass needed: the app names a chord tone or a note of a key ("the 3rd of E♭7"); tap it on the neck.',
  about: 'Theory you can use on the bandstand is theory you can find on the neck at once. The app asks for one note: the 3rd or the 5th of a triad, the 3rd, 5th or 7th of a 7th chord, or a note of a major key ("the 6th note of A♭ major"). Work it out, then tap that note anywhere on the neck, in any octave. Ten questions a set; 8 right clears the mode.\n\nNo bass needed. With your bass in your hands, play the note before you tap it.',
  tips: ['Count up the letters first (E♭ F G: the 3rd is a G), then fix the sharp or flat from the chord\'s quality.', 'A 7th chord\'s 7th: a whole step under the root an octave up (♭7), or a half step (maj7).', 'Any octave counts: tap the place nearest your hand.'],
  source: 'Original game. Naming chord tones and the notes of a key is the core of every harmony syllabus.',
  params: {
    ask: sel('Ask', [['degrees', 'Major keys: the 2nd to the 7th note'], ['triads', 'Triads: the 3rd or the 5th'], ['sevenths', '7th chords: the 3rd, 5th or 7th']]),
  },
  label: 'note',
  game: {
    kind: 'theory',
    round(p, ctx, rand, S = {}) {
      if (p.ask === 'degrees') {
        return plainly(() => {
          const root = T.bestRoot(Math.floor(rand() * 12));
          const d = 2 + Math.floor(rand() * 6);
          const n = T.up(root, String(d));
          const key = `${nm(root, S)} major`;
          return theoryAsk(`the <b>${ORD[d]}</b> note of <b>${key}</b>`, n, String(d), `the ${ORD[d]} note of ${key}`, 'A note of a major key', ctx);
        });
      }
      const types = p.ask === 'sevenths' ? ['maj7', 'dom7', 'min7', 'm7b5'] : ['maj', 'maj', 'maj', 'min', 'min', 'min', 'dim', 'aug'];
      return plainly(() => {
        const type = pick(rand, types);
        const ivs = T.CHORDS[type].iv;
        const root = T.bestRoot(Math.floor(rand() * 12), ivs.slice(0, 3));
        const iv = pick(rand, ivs.slice(1));
        const n = T.up(root, iv), name = chordName(root, type, S);
        return theoryAsk(`the <b>${TONE_WORD(iv)}</b> of <b>${name}</b>`, n, T.fmtDeg(iv), `the ${TONE_WORD(iv)} of ${name}`, p.ask === 'sevenths' ? 'A tone of a 7th chord' : 'A tone of a triad', ctx);
      });
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

// the keys by their signature, as a lead sheet names them (six flats G♭, six sharps F♯)
const SHARP_KEYS = { major: ['C', 'G', 'D', 'A', 'E', 'B', 'F#'], minor: ['A', 'E', 'B', 'F#', 'C#', 'G#', 'D#'] };
const FLAT_KEYS = { major: ['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb'], minor: ['A', 'D', 'G', 'C', 'F', 'Bb', 'Eb'] };
// the chords of a key by their numerals: major, and minor (natural, with the major V of harmonic minor)
const NUMERALS = {
  major: [['ii', '2'], ['iii', '3'], ['IV', '4'], ['V', '5'], ['vi', '6'], ['vii°', '7']],
  minor: [['ii°', '2'], ['♭III', 'b3'], ['iv', '4'], ['V', '5'], ['♭VI', 'b6'], ['♭VII', 'b7']],
};
const EXTENDED = [['dom9', '9'], ['maj9', '9'], ['min9', '9'], ['min11', '11'], ['dom13', '13'], ['min13', '13']];
const ALTERED = [['♭9', 'b9'], ['♯9', '#9'], ['♯11', '#11'], ['♭13', 'b13']];

const theoryHarmony = ex({
  id: 'game-harmony', module: 'harmony', level: 4,
  title: 'Theory on the neck: keys and harmony',
  short: 'Harmony, tap it',
  summary: 'A quiz, no bass needed: a key by its signature, a chord by its numeral, a 9th, 11th or 13th, an altered tone; tap it.',
  about: 'The harmony a working bassist reads every night, asked one note at a time: the major or minor key with three flats, the root of the ♭VI in C minor, the 9th of Dm9, the ♭13 of G7. Work it out and tap that note anywhere on the neck, in any octave. Ten questions a set; 8 right clears the mode.\n\nAltered tones are written the jazz way, plainly: the ♭9 of A♭7 is A, never B♭♭.',
  tips: ['Flat keys: the last flat is the 4th of the key (four flats: D♭ is the 4th of A♭). Sharp keys: the last sharp is the 7th.', 'A minor key sits a minor 3rd under the major key with the same signature.', 'The 9th is the 2nd, the 11th the 4th, the 13th the 6th, an octave up.'],
  source: 'Original game. Key signatures, Roman numerals, extensions and altered tones as harmony syllabi teach them.',
  params: {
    ask: sel('Ask', [['keys', 'Keys: by their signature'], ['numerals', 'Numerals: the root of a chord of the key'], ['extensions', 'Extensions: 9ths, 11ths, 13ths'], ['altered', 'Altered dominants: ♭9 ♯9 ♯11 ♭13']]),
  },
  label: 'note',
  game: {
    kind: 'theory',
    round(p, ctx, rand, S = {}) {
      if (p.ask === 'keys') {
        const mode = rand() < 0.6 ? 'major' : 'minor';
        const flats = rand() < 0.5, k = Math.floor(rand() * 7);
        const n = T.N((flats ? FLAT_KEYS : SHARP_KEYS)[mode][k]);
        const sig = k === 0 ? 'no sharps or flats' : `${WORD[k]} ${flats ? 'flat' : 'sharp'}${k > 1 ? 's' : ''}`;
        return theoryAsk(`the tonic of the <b>${mode}</b> key with <b>${sig}</b>`, n, '', `${nm(n, S)} ${mode}: ${sig}`, 'A key by its signature', ctx);
      }
      if (p.ask === 'numerals') {
        return plainly(() => {
          const mode = rand() < 0.5 ? 'major' : 'minor';
          const tonic = T.bestRoot(Math.floor(rand() * 12), mode === 'minor' ? ['1', 'b3', '5'] : ['1', '3', '5']);
          const [num, iv] = pick(rand, NUMERALS[mode]);
          const n = T.up(tonic, iv), key = `${nm(tonic, S)} ${mode}`;
          return theoryAsk(`the root of <b>${num}</b> in <b>${key}</b>`, n, num, `${num} in ${key}`, 'A chord of the key by its numeral', ctx);
        });
      }
      if (p.ask === 'extensions') {
        return plainly(() => {
          const [type, iv] = pick(rand, EXTENDED);
          // (named by the chord's triad, as a lead sheet names it: G♯m13, never A♭m13; QA round 24)
          const root = T.bestRoot(Math.floor(rand() * 12), T.CHORDS[type].iv.slice(0, 3));
          const n = T.up(root, iv), name = chordName(root, type, S);
          return theoryAsk(`the <b>${iv}th</b> of <b>${name}</b>`, n, iv, `the ${iv}th of ${name}`, 'An extension', ctx);
        });
      }
      // an altered tone of a dominant, written plainly (the jazz rule: A♭7's ♭9 is A)
      const root = T.bestRoot(Math.floor(rand() * 12), T.CHORDS.dom7.iv);
      const [word, iv] = pick(rand, ALTERED);
      let n = T.up(root, iv);
      // (the ♯9 as the licks write it: whichever of ♯2 and ♭3 reads more easily, B♭ over G7, B over A♭7; QA round 24)
      if (iv === '#9') { const b3 = T.up(root, 'b3'); if (Math.abs(b3.a) <= Math.abs(n.a) && !odd(b3)) n = b3; }
      if (odd(n)) n = spellMidi(T.pc(n), iv.startsWith('b'));
      const name = chordName(root, 'dom7', S);
      return theoryAsk(`the <b>${word}</b> of <b>${name}</b>`, n, word, `the ${word} of ${name}`, 'An altered tone of a dominant', ctx);
    },
  },
  build(p, ctx, S) { return sampleLine(this.game, p, ctx, S); },
});

export const EAR_GAMES = [earNotes, earIntervals, earChordTones];
export const READ_GAMES = [readNotes];
export const THEORY_GAMES = [theoryChords, theoryHarmony];
