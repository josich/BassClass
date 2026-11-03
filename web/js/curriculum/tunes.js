// Classic tunes (user, 2026-11-03: "public domain tunes with no copyright yes, add them"; the composers named):
// melodies everyone knows, from folk songs and a spiritual to Beethoven, Bach and Joplin, played as written. Only works
// free of copyright everywhere: traditional tunes, and composers who died long ago, from their own published notes.
// Every line was converted from a public-domain score, not written from memory: Beethoven's cello and double-bass
// statement and Pachelbel's first lines from the music examples on Wikipedia, Amazing Grace from its hymn setting
// there, the Saints and Greensleeves from the ABC on the German and French Wikipedias, Bach, Petzold and Joplin from the
// Bach-Gesellschaft and first editions typeset by the Mutopia Project. An octave or two lower where the tune sits above
// the bass, the composer's notes otherwise unchanged; the chords under them are a plain harmony for the Backing and the
// note labels. Written like the song studies (`parseLine` in songs.js: `E1:q`, `C3:dq+s` a tie).
import { T, Builder, ex, sel, emitMixed, keySigFor } from './common.js';
import { partNotes, labelled } from './songs.js';

const M = 'tunes';
const s16 = (list) => list.trim().split(/\s+/).map((x) => (x === '|' || x.includes(':') ? x : `${x}:s`)).join(' ');

/**
 * A tune: its parts (name, chords, notes; `hide`: only in the whole tune, never on its own), the whole tune's order of
 * parts (`form`), its key and mode (the key signature, and which notes are outside the key), its metre (`ts`, `bpb`
 * beats to the bar, `compound`, `unit` 2 where the beat is the 8th note) and who wrote it (`by`, `who` for the header,
 * `year`). A note under the low E string goes up an octave with the notes of its beat, so an octave stays an octave
 * (the Air's continuo, where the double basses go lower). The dots name the notes (a melody's 2nds and 7ths against
 * each chord meant little at Level 1; degrees are one tap away) and the line keeps its own fingering (QA round 24).
 */
function tune(def) {
  const { parts, form, key, mode, ts, bpb, compound, by, who, year, center = 3, ...meta } = def;
  const shown = parts.map((p, i) => [String(i), p.name, p]).filter((x) => !x[2].hide);
  const whole = !!form;
  const params = shown.length > 1 || whole
    ? { part: sel('Part', [...shown.map(([v, n]) => [v, n]), ...(whole ? [['all', 'Whole tune']] : [])], '0') }
    : {};
  return ex({
    ...meta,
    module: M,
    label: 'note',
    params,
    tune: { by, who, year },
    build(p, ctx, S) {
      const b = new Builder(ctx, S);
      // (a part it does not have, from a hand-made address, opens the first: QA round 24)
      const pick = Number(p.part);
      const order = p.part === 'all' && whole ? form : [parts[pick] && !parts[pick].hide ? pick : 0];
      const items = labelled(def, order.flatMap((pi) => partNotes(def, parts[pi], S)));
      const e = ctx.tuning[Math.max(0, ctx.str('E'))];
      let t = 0;
      const beatOf = items.map((it) => { const at = Math.floor(t + 1e-9); t += it.dur; return at; });
      const low = new Set(items.map((it, j) => (!it.rest && it.midi < e ? beatOf[j] : null)).filter((x) => x != null));
      items.forEach((it, j) => { if (!it.rest && low.has(beatOf[j])) it.midi += 12; });
      for (const it of items) if (!it.rest) while (it.midi < e) it.midi += 12;
      const part = parts[order[0]];
      const c = part.center ?? center;
      const region = [Math.max(0, c - 2), c + 3];
      // (the low B of a 5- or 6-string is left out, as in the song studies: the tunes sit on the E string and above)
      const strings = ctx.tuning.map((_, s) => s).filter((s) => s >= Math.max(0, ctx.str('E')));
      emitMixed(b, items, { center: c, open: 'allow', fold: false, region, strings, lineFingers: true });
      const meter = ts ? { timeSig: ts, beatsPerBar: bpb ?? ts[0], ...(compound ? { compound: true } : {}) } : {};
      const ks = keySigFor(T.N(key), mode);
      return b.build({ uniform: false, label: 'note', ...meter, ...(ks != null ? { keySig: ks } : {}) });
    },
  });
}

// ---------------------------------------------------------------- Level 1
const saints = tune({
  id: 'tn-saints', level: 1, title: 'When the Saints Go Marching In', short: 'When the Saints',
  by: 'Traditional', who: 'Traditional', key: 'C', mode: 'ionian', ts: [2, 4], bpm: 96, center: 3,
  summary: 'The spiritual every brass band plays: four notes up from C, then the famous long G.',
  about: 'An African-American spiritual, sung at funerals in New Orleans on the way back from the cemetery, when the band breaks into a march. The tune climbs C – E – F to a long G, three times, then comes down. On the bass it sits in one position, frets 2 to 5: C on the A string, E, F and G on the D string.',
  source: 'Traditional (an African-American spiritual), public domain. The tune as it is usually sung, two octaves lower; the chords are the usual ones.',
  tips: ['Most phrases start after an 8th-note rest: count "1 &", come in on the "&" (the last one after a quarter rest).', 'In "that number", the F comes on the "&" of 1 and holds to the end of the bar.'],
  parts: [
    {
      name: 'Tune',
      chords: 'C:14 G7:2 C:2 C7:2 F:4 C:4 G7:2 C:2',
      notes: 'r C2 E2 F2 | G2:h | r C2 E2 F2 | G2:h | r C2 E2 F2 | G2:q E2:q | C2:q E2:q | D2:h | r E2 E2 D2 | C2:h | E2:q G2:q | G2 F2:dq | r:q E2 F2 | G2:q E2:q | C2:q D2:q | C2:h',
    },
  ],
});

const ode = tune({
  id: 'tn-ode', level: 1, title: 'Ode to Joy', short: 'Ode to Joy',
  by: 'Ludwig van Beethoven', who: 'Beethoven', year: 1824, key: 'D', mode: 'ionian', bpm: 84, center: 3,
  summary: 'Beethoven\'s theme as the cellos and double basses first play it, alone, in the Ninth Symphony.',
  about: 'In the last movement of his Ninth Symphony, Beethoven lets the low strings play the great theme first, alone and quietly, before the rest of the orchestra joins in. This is that moment, note for note, at the double basses\' pitch: a step-by-step melody in D, in one position, frets 2 to 5 with the open D and A. Notice the one note that comes early: the F♯ on beat 4 of bar 12, tied over the bar line, as the theme returns.',
  source: 'Public domain: Ludwig van Beethoven (1770–1827), Symphony No. 9 (1824), last movement, bars 92–107, the theme as the cellos and double basses play it, as written, at the double basses\' pitch. The chords are a plain harmony of our own.',
  tips: ['Bars 4, 8 and 16: the dotted quarter is "1 & 2", the 8th the "&" after it.', 'Bar 12: the F♯ comes on beat 4 and holds over the bar line.', 'Let every half note ring its full two beats.'],
  parts: [
    {
      name: 'Theme',
      chords: 'D:4 A7:2 D:7 A:3 D:4 A7:2 D:6 A:1 D:3 A:2 D:2 A7:2 D:2 A7:2 D:1 A:1 D:1 E7:1 A:1 D:5 A7:2 D:6 A:1 D:3',
      notes: 'F#2:h G2:q A2:q | A2:q G2:q F#2:q E2:q | D2:h E2:q F#2:q | F#2:dq E2 E2:h | F#2:h G2:q A2:q | A2:q G2:q F#2:q E2:q | D2:h E2:q F#2:q | E2:dq D2 D2:h | E2:h F#2:q D2:q | E2:q F#2 G2 F#2:q D2:q | E2:q F#2 G2 F#2:q E2:q | D2:q E2:q A1:q F#2:h | F#2:q G2:q A2:q | A2:q G2:q F#2:q E2:q | D2:h E2:q F#2:q | E2:dq D2 D2:h',
    },
  ],
});

// ---------------------------------------------------------------- Level 2
const grace = tune({
  id: 'tn-grace', level: 2, title: 'Amazing Grace', short: 'Amazing Grace',
  by: 'Traditional', who: 'Traditional', year: 1829, key: 'G', mode: 'ionian', ts: [3, 4], bpm: 80, center: 4,
  summary: 'The hymn in 3/4: long notes on beat 1, a two-note turn, and the climb to the high D.',
  about: 'The tune "New Britain", first printed in 1829 and sung to John Newton\'s words ever since. It is in 3/4: almost every bar is a half note and a quarter, with a pair of 8ths ("a-ma-zing") and two dotted quarters in the second half. Count "1 2 3" and lean on the 1.',
  source: 'Traditional: the hymn tune "New Britain" (USA, 1829), words by John Newton (1779); public domain. The tune as it is sung, two octaves lower, with the hymn\'s usual chords.',
  tips: ['The first bar is two beats of rest: the tune starts on beat 3 ("A-").', 'Bars 9 and 11: the dotted quarter takes "1 & 2", the 8th the "&" after it.', 'The high D sits on the G string at the 7th fret.'],
  parts: [
    {
      name: 'Hymn',
      chords: 'G:6 G/D:2 D7:1 Em:2 C:1 G:6 G/D:2 D7/C:1 G/B:2 G:4 G/B:3 C:3 G:3 Em:2 G/D:3 D7:1 G:3',
      notes: 'r:q r:q D2:q | G2:h B2 G2 | B2:h A2:q | G2:h E2:q | D2:h D2:q | G2:h B2 G2 | B2:h A2:q | D3:h B2:q | D3:dq B2 D3 B2 | G2:h D2:q | E2:dq G2 G2 E2 | D2:h D2:q | G2:h B2 G2 | B2:h A2:q | G2:dh',
    },
  ],
});

const greensleeves = tune({
  id: 'tn-greensleeves', level: 2, title: 'Greensleeves', short: 'Greensleeves',
  by: 'Traditional', who: 'Traditional', key: 'G', mode: 'aeolian', ts: [6, 8], bpb: 2, compound: true, bpm: 52, center: 5,
  summary: 'The English ballad in 6/8 and G minor, with its lilting dotted rhythm.',
  about: 'An English tune from the late 16th century. It moves in 6/8, two dotted-quarter beats to the bar, with a long-short lilt (a quarter and an 8th) and a dotted figure at the end of each line. It mixes F and F♯, E♭ and E: the minor mode of its time, written here with G minor\'s two flats.',
  source: 'Traditional (England, late 16th century), public domain. The tune as it is usually sung, two octaves lower; the chords are the usual ones.',
  tips: ['Count two beats to the bar, each split in three: "1 2 3, 2 2 3".', 'The tune starts on the last 8th of an empty bar.', 'The F♯ leads up to G; the F natural moves on up to G, or down through E natural to D.'],
  parts: [
    {
      name: 'Song',
      chords: 'Gm:4 F:2 Eb:2 D:2 Gm:2 F:2 Gm:1 D:1 Gm:2 Bb:2 F:2 Gm:2 D:2 Bb:2 F:2 Gm:1 D:1 Gm:2',
      notes: 'r:q r:qt G2:t | Bb2:qt C3:t D3:e Eb3:st D3:t | C3:qt A2:t F2:e G2:st A2:t | Bb2:qt G2:t G2:e F#2:st G2:t | A2:qt F#2:t D2:qt G2:t | Bb2:qt C3:t D3:e Eb3:st D3:t | C3:qt A2:t F2:e G2:st A2:t | Bb2:e A2:st G2:t F#2:e E2:st F#2:t | G2:qt G2:t G2:q | F3:q F3:e E3:st D3:t | C3:qt A2:t F2:e G2:st A2:t | Bb2:qt G2:t G2:e F#2:st G2:t | A2:qt F#2:t D2:q | F3:q F3:e E3:st D3:t | C3:qt A2:t F2:e G2:st A2:t | Bb2:qt G2:t F#2:e E2:st F#2:t | G2:q G2:q',
    },
  ],
});

// ---------------------------------------------------------------- Level 3
const CANON = 'D:1 A:1 Bm:1 F#m:1 G:1 D:1 G:1 A:1';
const canon = tune({
  id: 'tn-canon', level: 3, title: 'Canon in D', short: 'Canon in D',
  by: 'Johann Pachelbel', who: 'Pachelbel', key: 'D', mode: 'ionian', bpm: 66,
  summary: 'The ground bass that never stops, then the first violin\'s lines over it, in quarters and 8ths.',
  about: 'The whole Canon is built on a bass line of eight notes, the ground, played 28 times while three violins enter one after the other with the same melody. Its chords (D A Bm F♯m G D G A) became one of the most borrowed progressions in pop. First the ground, as the continuo plays it; then the first violin\'s opening lines, two octaves lower: quarter notes down the scale, then 8ths.',
  source: 'Public domain: Johann Pachelbel (1653–1706), Canon in D for three violins and continuo. Bars 1–2 the ground bass as written; bars 3–10 the first violin, two octaves lower.',
  tips: ['The ground: every note one beat, as even as a clock.', 'In the violin\'s lines each beat lands on a note of the chord under it.'],
  parts: [
    { name: 'Ground bass', center: 5, chords: CANON, notes: 'D3:q A2:q B2:q F#2:q | G2:q D2:q G2:q A2:q' },
    { name: 'Violin, bars 3–6', center: 8, chords: `${CANON} ${CANON}`, notes: 'F#3:q E3:q D3:q C#3:q | B2:q A2:q B2:q C#3:q | D3:q C#3:q B2:q A2:q | G2:q F#2:q G2:q E2:q' },
    { name: 'Violin, bars 7–10', center: 7, chords: `${CANON} ${CANON}`, notes: 'D2 F#2 A2 G2 F#2 D2 F#2 E2 | D2 B1 D2 A2 G2 B2 A2 G2 | F#2 D2 E2 C#3 D3 F#3 A3 A2 | B2 G2 A2 F#2 D2 D3 D3:de C#3:s' },
  ],
  form: [0, 1, 2],
});

const minuet = tune({
  id: 'tn-minuet', level: 3, title: 'Minuet in G', short: 'Minuet in G',
  by: 'Christian Petzold', who: 'Petzold', year: 1725, key: 'G', mode: 'ionian', ts: [3, 4], bpm: 104,
  summary: 'The minuet from Anna Magdalena Bach\'s notebook: a dance in 3/4, up the G major scale and back.',
  about: 'For two centuries this was "Bach\'s Minuet in G"; it is by Christian Petzold, copied into the notebook Bach gave his wife Anna Magdalena in 1725. A dance in three: a quarter note, then four 8ths, bar after bar. The first half stays in G; the second visits D major (C♯) and climbs to the high B.',
  source: 'Public domain: Christian Petzold (1677–1733), Minuet in G, BWV Anh. 114, from the Notebook for Anna Magdalena Bach (1725). The melody as written, two octaves lower.',
  tips: ['Feel one strong beat per bar: "ONE two three".', 'Keep the 8ths even and light; the quarter notes a little longer.', 'Second half: the C♯ belongs to D major, where the tune goes for a moment.'],
  parts: [
    {
      name: 'First half', center: 4,
      chords: 'G:6 C:3 G:3 Am:3 G:3 D:1 G:2 D7:3 G:6 C:3 G:3 D7:3 G:3 C:1 D7:2 G:3',
      notes: 'D3:q G2 A2 B2 C3 | D3:q G2:q G2:q | E3:q C3 D3 E3 F#3 | G3:q G2:q G2:q | C3:q D3 C3 B2 A2 | B2:q C3 B2 A2 G2 | F#2:q G2 A2 B2 G2 | A2:dh | D3:q G2 A2 B2 C3 | D3:q G2:q G2:q | E3:q C3 D3 E3 F#3 | G3:q G2:q G2:q | C3:q D3 C3 B2 A2 | B2:q C3 B2 A2 G2 | A2:q B2 A2 G2 F#2 | G2:dh',
    },
    {
      name: 'Second half', center: 8,
      chords: 'G:3 D:3 Em:3 A:6 Em/B:1 D:1 A/C#:1 D:2 A:1 D7:3 G:3 C:3 G/B:1 Am:1 G:1 D:6 C/E:1 G:1 D/F#:1 G:2 D:1 G:3',
      notes: 'B3:q G3 A3 B3 G3 | A3:q D3 E3 F#3 D3 | G3:q E3 F#3 G3 D3 | C#3:q B2 C#3 A2:q | A2 B2 C#3 D3 E3 F#3 | G3:q F#3:q E3:q | F#3:q A2:q C#3:q | D3:dh | D3:q G2 F#2 G2:q | E3:q G2 F#2 G2:q | D3:q C3:q B2:q | A2 G2 F#2 G2 A2:q | D2 E2 F#2 G2 A2 B2 | C3:q B2:q A2:q | B2 D3 G2:q F#2:q | G2:dh',
    },
  ],
  form: [0, 0, 1, 1],
});

const musette = tune({
  id: 'tn-musette', level: 3, title: 'Musette in D', short: 'Musette in D',
  by: 'Anonymous', who: 'Anonymous', year: 1725, key: 'D', mode: 'ionian', ts: [2, 4], bpm: 92,
  summary: 'The left hand of the Musette: octaves over a drone, as a bagpipe plays it.',
  about: 'A musette is a small French bagpipe, and this piece copies its drone: the left hand jumps between D and the D an octave up, bar after bar, then does the same on A and on E, before the opening comes back. Copied into Anna Magdalena Bach\'s notebook in 1725; who wrote it is not known. The octaves are a bassist\'s shape: the root, then two strings up and two frets up.',
  source: 'Public domain: anonymous, Musette in D, BWV Anh. 126, from the Notebook for Anna Magdalena Bach (1725). The left hand as written; in the whole tune the first half comes back after the second, to its fermata, the da capo that ends the piece in D.',
  tips: ['Octaves: the low note with the 1st finger, the high one two strings up with the 3rd or 4th.', 'Mute the string between the two notes with the side of the fretting finger.', 'Bars 3 and 7: two 16ths, then 8ths, in step with the right hand.'],
  parts: [
    {
      name: 'First half', center: 7,
      chords: 'D:6 A:1 D:7 A:1 D:1',
      notes: 'D2 D3 D2 D3 | D2 D3 D2 D3 | F#3:s G3:s A3 G3 F#3 | E3 A3 F#3 D3 | D2 D3 D2 D3 | D2 D3 D2 D3 | F#3:s G3:s A3 G3 F#3 | E3 A3 D3:q',
    },
    {
      name: 'Second half', center: 9,
      chords: 'A:7 E:1 E7:11 A/C#:0.5 E7/D:0.5 A/E:1 A:0.5 D:0.5 A:2',
      notes: 'A2 A3 A2 A3 | A2 A3 A2 A3 | A2 A3 A2 A3 | A2 A3 E2 E3 | E2 E3 E2 E3 | E2 E3 E2 E3 | E2 E3 E2 E3 | E2 E3 E2 E3 | E2 E3 E2 E3 | E2 D3 C#3 D3 | E3:q A2 D3 | C#3:s D3:s E3 A2:q',
    },
  ],
  form: [0, 0, 1, 1, 0],
});

// ---------------------------------------------------------------- Level 4
const AIR_A = 'D2 D3 C#3 C#2 B1 B2 A2 A1 | G1 G2 G#2 G#1 A1 A2 G2 G1 | F#1 F#2 E2 E1 D#1 D#2 B1 B2 | E1 E2 D2 D1 C#1 C#2 A1 A2 | D2 D3 C#3 C#2 B1 B2 G#2 E2';
const AIR_A_CHORDS = 'D:1 Dmaj7/C#:1 Bm:1 Bm7/A:1 Gmaj7:1 E7/G#:1 A:1 A7/G:1 F#m7b5:1 Am/E:1 B7/D#:1 B7:1 Em:1 Em7/D:1 A7/C#:1 A7:1 D:1 A/C#:1 E7/B:1 E7/G#:1';
const air = tune({
  id: 'tn-air', level: 4, title: 'Air (Orchestral Suite No. 3)', short: 'Air',
  by: 'Johann Sebastian Bach', who: 'Bach', key: 'D', mode: 'ionian', bpm: 56, center: 3,
  summary: 'The walking bass of Bach\'s Air: 8th notes stepping down the scale, every other one an octave apart.',
  about: 'Under the long violin melody of the Air, the continuo walks: 8th notes in octaves, low – high, high – low, stepping down the scale and round the harmony, one chord to a beat. A bass that moves in steady notes like this is a walking bass, centuries before jazz (andante, the Italian for walking, names the pace), and it does what every walking line does: it moves by step, it outlines every chord, and it never stops.',
  source: 'Public domain: Johann Sebastian Bach (1685–1750), Air from the Orchestral Suite No. 3 in D, BWV 1068. The continuo as written, an octave under the cellos, as the double basses play it; the few beats that go under the low E string (D♯, D, C♯) go up an octave, both notes, so the octave stays. The chords follow Bach\'s harmony.',
  tips: ['The octaves: the 1st finger on the low note, the 3rd or 4th two strings up.', 'Each beat is one chord: its root, or the bass note of the chord, twice.', 'Slow and smooth: let each 8th ring into the next.'],
  parts: [
    {
      name: 'First half',
      chords: `${AIR_A_CHORDS} D:1 E7:1 A:1 A7:1`,
      notes: `${AIR_A} | A2 D2 E2 E1 ${s16('A1 B1 C#2 D2 E2 G2 F#2 E2')}`,
    },
    {
      name: 'Second half',
      chords: 'A:1 A7/G:1 F#m7b5:1 F#m7b5/E:1 B7/D#:1 B:1 Em:1 Em7/D:1 C#m7b5:1 C#m7b5/B:1 F#7/A#:1 F#7/C#:1 Em/B:1 C#m7b5/E:0.5 F#7:0.5 Bm:1 Bm7/A:1 E/G#:1 D/F#:1 E7:1 E7/D:1 A/C#:1 D:0.5 E7:0.5 A:1 A7/G:1 F#m:1 G:1 E7/G#:1 A:1 F#7/A#:1 B:1 Em:1 Em7/D:1 A7/C#:1 A7:1 D:1 C:1 G/B:1 D/A:1 G:1 D/F#:1 Em:1 G/D:1 A7/C#:1 G/D:1 A7:2 D:2',
      notes: 'A1 A2 G2 G1 F#1 F#2 E2 E1 | D#1 D#2 F#2 B1 E2 E3 D3 D2 | C#2 C#3 B2 B1 A#1 B1 C#2 A#1 | B1 G2 E2 F#2 B1 B2 A2 A1 | G#1 G#2 F#2 F#1 E1 E2 D2 D1 | C#1 C#2 D2 E2 A1 A2 G2 G1 | F#1 F#2 G2 G1 G#1 G#2 A2 A1 | A#1 A#2 B2 B1 E2 E3 D3 D2 | C#2 C#3 A2 C#3 D3 D2 C2 C3 | B2 B1 A1 A2 G2 G1 F#1 F#2 | E2 E1 D1 D2 C#2 A1 D2 G2 | A2 G2 A2 A1 D1:h',
    },
    // (the first half's second time: its last bar ends on A, into the second half)
    { name: 'First half, second ending', hide: true, chords: `${AIR_A_CHORDS} D:1 E7:1 A:2`, notes: `${AIR_A} | A2 D2 E2 E1 A1:h` },
  ],
  form: [0, 2, 1, 1],
});

const BOURREE_A = 'Em:2 B7:2 Em/G:1 B7/F#:1 Em:1 D7/F#:1 G:1 Am7:1 B7:1 Am:1 G:1 Em/B:1 Em:4 B7:2 Em/G:1 B7/F#:1 Em:1 D7/F#:1 G:1 C:1 D:1 D7:1 G:4';
/** The second half's chords, bar by bar; where one voice holds, the chord the other moves through is left to that one. */
const bourreeB = (voice) => [
  'D/F#:1 D7:1 G:1 G/B:1', 'C:1 E7/G#:1 Am:1 Bm7/D:1', 'E:1 Am:1 Am/E:1 E7:1',
  voice === 'melody' ? 'Am:3 D7:1' : 'Am:2 D/F#:1 D7:1',
  'G:1 G/B:1 C:1 E7/G#:1', 'Am:1 A/C#:1 D:1 F#7/A#:1', 'Bm:1 Em:1 F#:1 F#7:1',
  voice === 'melody' ? 'B:4' : 'B:2 B7/D#:1 B:1',
  'E:1 E7/D:1 A/C#:1 A7:1', 'D:1 D7/C:1 G/B:1 G7:1', 'C:2 F#m7b5/A:1 F#m7b5:1', 'B7:3 E/G#:1',
  voice === 'melody' ? 'Am:1 D/F#:1 G:1 C/E:1' : 'Am:1 D/F#:1 G:0.5 B7/D#:0.5 C/E:1',
  'F#m:1 B7/D#:1 Em:1 Am:1',
  voice === 'melody' ? 'B:1 Am:1 Em/B:1 B7:1' : 'B:1 Am:1 B7:2',
  'Em:4',
].join(' ');
const bourree = tune({
  id: 'tn-bourree', level: 4, title: 'Bourrée in E minor', short: 'Bourrée in E minor',
  by: 'Johann Sebastian Bach', who: 'Bach', key: 'E', mode: 'aeolian', bpm: 88,
  summary: 'Bach\'s two-voice dance for lute: the tune on top, a walking line beneath, both for the bass.',
  about: 'A bourrée is a quick French dance that starts on the last beat of the bar. Bach wrote this one for the lute in two voices that answer each other: a melody that runs in 8ths and a bass that walks in quarter notes. Learn both: the melody (an octave lower) and the bass voice (as written), then play one against a friend playing the other.',
  source: 'Public domain: Johann Sebastian Bach (1685–1750), Bourrée from the Suite in E minor for lute, BWV 996. The upper voice an octave lower, the lower voice as written.',
  tips: ['The two 8ths at the end of each half are the upbeat into its repeat: a bourrée steps off on the last beat.', 'Melody: the quarter-8th-8th figure is the dance\'s step; keep it light.', 'Bass voice: mostly one note a beat, with runs of 8ths into the cadences.'],
  parts: [
    {
      name: 'Melody, first half', center: 7,
      chords: BOURREE_A,
      notes: 'G3:q F#3 E3 D#3:q E3 F#3 | B2:q C#3 D#3 E3:q D3 C3 | B2:q A2 G2 F#2:q G2 A2 | B2 A2 G2 F#2 E2:q E3 F#3 | G3:q F#3 E3 D#3:q E3 F#3 | B2:q C#3 D#3 E3:q D3 C3 | B2:q A2 G2 F#2:dq G2 | G2:dh E3 F#3',
    },
    {
      name: 'Melody, second half', center: 8,
      chords: bourreeB('melody'),
      notes: 'D3:q A2 C3 B2:q G3 D3 | E3:q B2 D3 C3:q B2 A2 | G#2:q A2 B2 C3:q B2 A2 | A2:dh D3 A2 | B2:q G3 D3 E3:q B2 D3 | C3:q A3 E3 F#3:q C#3 E3 | D3:q C#3 B2 A#2:dq B2 | B2:dh B3 F#3 | G#3:q F#3 E3 A3:q E3 G3 | F#3:q E3 D3 G3:q D3 F3 | E3:q A3 E3 F#3:q C#3 E3 | D#3:q B2:h E3 B2 | C3:q D3 A2 B2:q C3 G2 | A2:q B2 F#2 G2:q F#2 E2 | D#2:q E2 F#2 G2:q F#2 E2 | E2:dh B2 G2',
    },
    {
      name: 'Bass, first half', center: 3,
      chords: BOURREE_A,
      notes: 'E2:q A2:q B2:q A2:q | G2:q F#2:q E2:q F#2:q | G2:q A2:q B2:q A2:q | G2:q B2:q E2 F#2 G2 F#2 | E2:q A2:q B2:q A2:q | G2:q F#2:q E2:q F#2:q | G2:q C3:q D3:q D2:q | G2:dh G2 F#2',
    },
    {
      name: 'Bass, second half', center: 4,
      chords: bourreeB('bass'),
      notes: 'F#2:q D2:q G2:q B2:q | C3:q G#2:q A2:q D3:q | E3:q A2:q E3:q E2:q | A2 B2 A2 G2 F#2:q D2:q | G2:q B2:q C3:q G#2:q | A2:q C#3:q D3:q A#2:q | B2:q E3:q F#3:q F#2:q | B2 A#2 B2 C#3 D#3:q B2:q | E3:q D3:q C#3:q A2:q | D3:q C3:q B2:q G2:q | C3:q B2:q A2:q F#2:q | B2:dq C3 B2 A2 G#2:q | A2 E3 F#3:q G2 D#3 E3:q | F#2 C#3 D#3:q E2:q A2:q | B2:q A2:q B2:h | E2:dh G2:q',
    },
  ],
});

const entertainer = tune({
  id: 'tn-entertainer', level: 4, title: 'The Entertainer', short: 'The Entertainer',
  by: 'Scott Joplin', who: 'Joplin', year: 1902, key: 'C', mode: 'ionian', ts: [2, 4], bpm: 66, center: 5,
  summary: 'Joplin\'s rag, its first strain: the syncopated 16ths and the climb D – D♯ – E.',
  about: 'Ragtime is "ragged time": the right hand plays across the beat while the left hand keeps a steady oom-pah. The first strain of The Entertainer is the most famous rag melody of all: a chromatic pickup, D – D♯ – E, wide leaps up to C, and notes tied over the beat so they land between the counts.',
  source: 'Public domain: Scott Joplin (1868–1917), The Entertainer (1902), the first strain with its first ending. The melody as written (the lower note of the right hand\'s octaves), two octaves lower.',
  tips: ['Count 16ths: "1 e & a 2 e & a". The tied notes start on an "a" or an "&" and carry over the beat.', 'Joplin marked it "Not fast": a steady, easy tempo, never rushed.', 'The D – D♯ before each phrase is a pickup into the E.'],
  parts: [
    {
      name: 'First strain',
      chords: 'C:1 C7:0.75 F:1.25 C/E:1 C/G:1 G7:1 C:3 C7:0.75 F:1.25 C/E:1 D7:2 G7:2 C:1 C7:0.75 F:1.25 C/E:1 C/G:1 G7:1 C:3 C7/Bb:1 F/A:1 Fm/Ab:1 C/G:1 G7:1 C:2',
      notes: 'E2:s C3 E2:s C3 E2:s C3:dq | C3:s D3:s D#3:s | E3:s C3:s D3:s E3 B2:s D3 | C3:dq D2:s D#2:s | E2:s C3 E2:s C3 E2:s C3:dq+s | A2:s G2:s | F#2:s A2:s C3:s E3 D3:s C3:s A2:s | D3:dq D2:s D#2:s | E2:s C3 E2:s C3 E2:s C3:dq | C3:s D3:s D#3:s | E3:s C3:s D3:s E3 B2:s D3 | C3:dq C3:s D3:s | E3:s C3:s D3:s E3 C3:s D3:s C3:s | E3:s C3:s D3:s E3 C3:s D3:s C3:s | E3:s C3:s D3:s E3 B2:s D3 | C3:dq D2:s D#2:s',
    },
  ],
});

// ---------------------------------------------------------------- Level 5
const prelude = tune({
  id: 'tn-prelude', level: 5, title: 'Cello Suite No. 1: Prélude', short: 'Prélude',
  by: 'Johann Sebastian Bach', who: 'Bach', key: 'G', mode: 'ionian', bpm: 56, center: 3,
  summary: 'The opening of Bach\'s first cello suite: broken chords in 16ths over the open G.',
  about: 'Bach\'s six suites for solo cello are pieces every bassist wants to play sooner or later, and this Prélude is their most famous page. Most bars are one chord broken into 16th notes, often the same shape twice: the low G pedal, then the chord tones above it, the harmony moving one note at a time. It sits low on the bass, an octave under the cello, around the first five frets.',
  source: 'Public domain: Johann Sebastian Bach (1685–1750), Suite No. 1 in G for solo cello, BWV 1007, Prélude, bars 1–10. As written, an octave under the cello.',
  tips: ['Each half bar is one shape: hold the chord under the fingers and let the notes ring.', 'Even 16ths first; Bach\'s rubato, the stretching of time, later.', 'Bars 1–4: the low G stays while the notes above it change.'],
  parts: [
    {
      name: 'Bars 1–4', center: 3,
      chords: 'G:4 C/G:4 D7/G:4 G:4',
      notes: s16('G1 D2 B2 A2 B2 D2 B2 D2 G1 D2 B2 A2 B2 D2 B2 D2 | G1 E2 C3 B2 C3 E2 C3 E2 G1 E2 C3 B2 C3 E2 C3 E2 | G1 F#2 C3 B2 C3 F#2 C3 F#2 G1 F#2 C3 B2 C3 F#2 C3 F#2 | G1 G2 B2 A2 B2 G2 B2 G2 G1 G2 B2 A2 B2 G2 B2 F#2'),
    },
    {
      name: 'Bars 5–10', center: 3,
      chords: 'Em:4 A7/C#:4 D/F#:4 Em:4 A7/E:2 A7:2 D:4',
      notes: s16('G1 E2 B2 A2 B2 G2 F#2 G2 E2 G2 F#2 G2 B1 D2 C#2 B1 | C#2 G2 A2 G2 A2 G2 A2 G2 C#2 G2 A2 G2 A2 G2 A2 G2 | F#2 A2 D3 C#3 D3 A2 G2 A2 F#2 A2 G2 A2 D2 F#2 E2 D2 | E1 B1 G2 F#2 G2 B1 G2 B1 E1 B1 G2 F#2 G2 B1 G2 B1 | E1 C#2 D2 E2 D2 C#2 B1 A1 G2 F#2 E2 D3 C#3 B2 A2 G2 | F#2 E2 D2 D3 A2 D3 F#2 A2 D2 E2 F#2 A2 G2 F#2 E2 D2'),
    },
  ],
  form: [0, 1],
});

const invention = tune({
  id: 'tn-invention', level: 5, title: 'Invention No. 4 in D minor', short: 'Invention No. 4',
  by: 'Johann Sebastian Bach', who: 'Bach', year: 1723, key: 'D', mode: 'aeolian', ts: [3, 8], bpb: 3, unit: 2, bpm: 104, center: 3,
  summary: 'The lower voice of Bach\'s D minor Invention: the subject in 16ths, then a sequence down the key.',
  about: 'Bach wrote his fifteen Inventions to teach keyboard players to make two voices sing at once. In the fourth, in 3/8, the lower voice enters in bar 3 with the subject: up the D minor scale to B♭, a leap down to C♯, and back down. Then 8th notes answer the other hand, and a sequence of 16ths walks down the key to F major. On the bass it lies an octave lower, around the open D.',
  source: 'Public domain: Johann Sebastian Bach (1685–1750), Invention No. 4 in D minor, BWV 775 (1723), the lower voice of bars 3–16, an octave lower.',
  tips: ['Count three 8ths to the bar, each split in two: "1 & 2 & 3 &".', 'The C♯ is the leading note of D minor: it pulls up to D.', 'Bars 11–16: one two-bar shape three times (up from a 3rd below, then down from a leap), the second a step under the first: feel the shape, not the single notes.'],
  parts: [
    {
      name: 'Bars 3–10', unit: 2,
      chords: 'Dm:3 A7:3 Dm:3 A7:3 Dm:3 Gm:3 C:3 F:3',
      notes: 'D2:s E2:s F2:s G2:s A2:s Bb2:s | C#2:s Bb2:s A2:s G2:s F2:s E2:s | F2 A2 D3 | E2 G2 C#3 | D2 D3 F2 | G2 A2 Bb2 | C2 C3 E2 | F2 G2 A2',
    },
    {
      name: 'Bars 11–16', unit: 2,
      chords: 'Bb:3 C7/E:3 F/A:3 Bb/D:3 C7/E:3 F/A:3',
      notes: s16('Bb2 G2 A2 Bb2 C3 D3 | E2 D3 C3 Bb2 A2 G2 | A2 F2 G2 A2 Bb2 C3 | D2 C3 Bb2 A2 G2 F2 | E2 C2 D2 E2 F2 G2 | A1 G2 F2 E2 D2 C2'),
    },
  ],
  form: [0, 1],
});

export default [
  saints, ode,
  grace, greensleeves,
  canon, minuet, musette,
  air, bourree, entertainer,
  prelude, invention,
];
