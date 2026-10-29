// Pentatonic colours (user, 2026-10-28: "pentatonic studies… take inspiration from them, not copies"): the
// one minor-pentatonic shape every bassist knows, used for colour. The same box moved to three places over one
// chord, the same phrase kept while the chords move under it, minor pentatonics over a major chord, a groove bar
// answered by a fill bar, grooves where the tonic's pentatonic covers every chord, and double stops from the box.
// Every line is original, written in C (or C minor) and transposed; each note is labelled against the chord
// under it, so the player sees one note change its name (G is the 5th of Cm7, the 7th of A♭maj7, the ♯11 of
// D♭maj7). The ideas are common practice in modern bass teaching.
import { T, Builder, ex, sel, keyP, keysFor, pickRoot, nm } from './common.js';
import { lickTemplate } from './licks.js';

const M = 'scales';
const STRAIGHT = 'straight';

// ---------------------------------------------------------------- Level 3

/** Three minor pentatonics over one minor chord: on the root, a whole step up (its 6th) and on the 5th (its 9th). */
const threeBoxes = lickTemplate({
  pick: 'Study', id: 'sc-pent-three-boxes', module: M, level: 3, minor: true, defKey: '4',
  title: 'Three minor pentatonics on one minor chord',
  summary: 'One box, three places over Em7: on the root, a whole step up (the 6th) and on the 5th (the 9th).',
  about: 'Over a minor chord the minor pentatonic on its root is the safe choice, and it can start to sound like one box going up and down. The same shape fits in two more places over the same chord. A whole step up (F♯ minor pentatonic over Em7) it brings the 6th (C♯): the Dorian sound of funk and soul. On the 5th (B minor pentatonic over Em7) it brings the 9th (F♯): bright and singing, the sound of many pop and fusion lines. No new shape to learn: only a new place for the one you know.\n\nFirst cycle the box through the three places over the chord, then play grooves that live in the home box and borrow one colour note at a time. The labels name every note against the chord: watch the 13 (the 6th) and the 9 appear.',
  tips: ['Same fingering in all three places: only the hand moves.', 'Aim at one colour note per session: the 6th today, the 9th tomorrow.', 'Use the colour notes sparingly: the home box carries the groove.'],
  source: 'Original lines. Minor pentatonics on the root, the 2nd and the 5th of a minor chord are a common device in modern bass, funk and fusion playing.',
  bpm: 76,
  licks: [
    { name: 'Cycle the box: root, a whole step up, the 5th', feel: STRAIGHT, prog: [['1', 'min7', 32]], boxes: [[0, 8], [8, 16], [16, 24], [24, 32]], notes: 'C2 Eb2 F2 G2 Bb2 C3 Bb2 G2 | F2 Eb2 C2:q r:h | D2 F2 G2 A2 C3 D3 C3 A2 | G2 F2 D2:q r:h | G2 Bb2 C3 D3 F3 G3 F3 D3 | C3 Bb2 G2:q r:h | C2 Eb2 F2 G2 Bb2 C3 Bb2 G2 | F2 Eb2 C2:h r:q' },
    { name: 'Colour note: the 6th (the box a whole step up)', feel: STRAIGHT, prog: [['1', 'min7', 16]], boxes: [[0, 16]], notes: 'C2:q C3 Bb2 G2:q F2 Eb2 | C2:q r:e G2 A2:q G2 F2 | C2:q C3 Bb2 G2:q A2 C3 | D3 C3 A2 G2 F2:q D2:q' },
    { name: 'Colour note: the 9th (the box on the 5th)', feel: STRAIGHT, prog: [['1', 'min7', 16]], boxes: [[0, 16]], notes: 'C2:q G2 Bb2 C3:q D3 C3 | Bb2 G2 F2 G2:q r:q C2 | C2:q G2 Bb2 D3:q F3 D3 | C3:q Bb2 G2 F2:q Eb2:q' },
    { name: 'Both colours in one groove', feel: STRAIGHT, prog: [['1', 'min7', 16]], boxes: [[0, 16]], notes: 'C2:q r:e C2 Eb2 F2 G2 Bb2 | A2:q G2 F2 D2:q C2:q | C2:q r:e G2 Bb2 C3 D3 F3 | D3:q C3 A2 G2:q F2 Eb2' },
  ],
});

const FALL = [['1', 'min7', 4], ['b7', 'maj', 4], ['b6', 'maj7', 8]];
/** Grooves over i – ♭VII – ♭VI where the tonic's minor pentatonic covers all three chords, with a fill to close. */
const minorGrooves = lickTemplate({
  pick: 'Study', id: 'sc-pent-minor-grooves', module: M, level: 3, minor: true, defKey: '4',
  title: 'One pentatonic, three chords: grooves over i – ♭VII – ♭VI',
  summary: 'Em7 – D – Cmaj7: the roots fall, the E minor pentatonic fits all three, and a fill closes each phrase.',
  about: 'Over i – ♭VII – ♭VI (Em7 – D – Cmaj7) the roots fall a step at a time, and the minor pentatonic of the key fits every chord: over D its notes become the 9th, 11th, 5th and 13th, over Cmaj7 the 3rd, 5th, 13th, 7th and 9th. So a bass line can stay in one familiar box while the harmony moves under it. Each groove plays the roots on the beat, decorates them from the pentatonic, and ends the phrase with a fill that leads back to the top.\n\nOnce a groove is under your fingers, leave it: keep the chords and the form and play anything from the box. Play too much at first, then take notes away until only the best ones are left.',
  tips: ['Roots on beat 1 of each chord: the fill is the only bar that wanders.', 'Leave the rests empty: space is part of the groove.', 'Then make your own line: busy first, then strip it back.'],
  source: 'Original grooves. The tonic pentatonic over i – ♭VII – ♭VI is common in rock, soul and pop bass playing.',
  bpm: 84,
  licks: [
    { name: 'Falling roots, a fill to close', feel: STRAIGHT, prog: FALL, notes: 'C2:q r:e C2 Eb2:q G2 Bb1 | Bb1:q r:e Bb1 F2:q G2 G1 | Ab1:q r:e Ab1 C2:q Eb2 G2 | r:e Eb3 C3 Bb2 C3:q G2 Bb2' },
    { name: '16ths from the box', feel: STRAIGHT, prog: FALL, notes: 'C2 C2:s C3:s Bb2 G2 F2 G2:s Bb2:s C3 C2 | Bb1 Bb1:s Bb2:s G2 F2 Eb2 F2:s G2:s Bb2 Bb1 | Ab1 Ab1:s Ab2:s G2 Eb2 C2 Eb2:s F2:s G2 Ab1 | C3:s Bb2:s G2 F2:s Eb2:s C2 Eb2 F2 G2:q' },
    { name: 'Half-time, with space', feel: STRAIGHT, prog: [['1', 'min7', 8], ['b7', 'maj', 4], ['b6', 'maj7', 4]], notes: 'C2:q r:q r:e G2 Bb2 C3 | Eb3:q C3:q Bb2 G2 F2:q | Bb1:q r:e Bb1 F2:q G2:q | Ab1:q r:e Eb2 F2 G2 Bb2 C3' },
  ],
});

// ---------------------------------------------------------------- Level 4

const MOTIF_A = 'G2 Bb2 C3:q Bb2 G2 F2:q';
const MOTIF_B = 'C3:de Bb2:s G2 F2 Eb2:q F2:q';
const rep = (m, n) => Array(n).fill(m).join(' | ');
/** One minor-pentatonic phrase kept while the chord under it changes: the same notes, new names. */
const onePhrase = lickTemplate({
  pick: 'Study', id: 'sc-pent-one-phrase', module: M, level: 4, minor: true,
  title: 'One pentatonic phrase, many chords',
  summary: 'A C minor pentatonic phrase over Cm7, A♭maj7, F7sus4, D♭maj7, B♭7sus4, E♭maj7 and Fm7: the notes stay, their names change.',
  about: 'Keep one short C minor pentatonic phrase and let the chord move under it. It is at home over Cm7, sweet over A♭maj7 (its notes become the 3rd, 5th, 13th, 7th and 9th), open over F7sus4 and B♭7sus4, and bright over D♭maj7, where its G is the Lydian ♯11. One shape, many colours: the labels show each note against the chord under it.\n\nPlay first, think later. Loop a version, listen to how each chord changes the feeling of the same notes, and only then read the labels to see why. Then improvise your own phrases from the box over the same chords: they will fit too.',
  tips: ['Do not change the phrase when the chord changes: let the chord do the work.', 'Turn the Backing to Chords: the colour comes from the chord under the notes.', 'Then make up phrases of your own from the same box over the same chords.'],
  source: 'Original phrases. One pentatonic over several chord qualities (pentatonic superimposition) is standard practice in jazz, fusion and modern bass teaching.',
  bpm: 88,
  licks: [
    { name: 'Two chords: Cm7, then A♭maj7', feel: STRAIGHT, prog: [['1', 'min7', 8], ['b6', 'maj7', 8]], notes: rep(MOTIF_A, 4) },
    { name: 'Four colours: Cm7, A♭maj7, F7sus4, D♭maj7', feel: STRAIGHT, prog: [['1', 'min7', 4], ['b6', 'maj7', 4], ['4', 'dom7sus4', 4], ['b2', 'maj7', 4]], notes: rep(MOTIF_A, 4) },
    { name: 'Four more: B♭7sus4, E♭maj7, Fm7, Cm7', feel: STRAIGHT, prog: [['b7', 'dom7sus4', 4], ['b3', 'maj7', 4], ['4', 'min7', 4], ['1', 'min7', 4]], notes: rep(MOTIF_B, 4) },
    { name: 'The whole tour: eight chords, two phrases', feel: STRAIGHT, prog: [['1', 'min7', 4], ['b6', 'maj7', 4], ['4', 'dom7sus4', 4], ['b2', 'maj7', 4], ['b7', 'dom7sus4', 4], ['b3', 'maj7', 4], ['4', 'min7', 4], ['1', 'min7', 4]], notes: `${rep(MOTIF_A, 4)} | ${rep(MOTIF_B, 4)}` },
  ],
});

const ROOTS = 'C2:q G2 C3 r:e G2 C2:q';
const ROOTS2 = 'C2:q r:e C2 E2:q G2 C3';
const E_FILL = 'r:e E3 D3 B2 A2 G2 E2:q';
const A_FILL = 'A2 C3 D3 E3 G3 E3 D3 C3';
const B_FILL = 'B2 D3 E3 F#3 A3 F#3 E3 D3';
/** Minor pentatonics on the 3rd, the 6th and the 7th of a major chord, as fills over a plain groove. */
const majorChord = lickTemplate({
  pick: 'Study', id: 'sc-pent-major-chord', module: M, level: 4, minor: false,
  title: 'Minor pentatonics on a major chord',
  summary: 'Over C: E minor pentatonic (on the 3rd), A minor (on the 6th) and B minor (on the 7th: the Lydian ♯4), as fills.',
  about: 'Three minor pentatonics add colour to a major chord without leaving it. Over C, the one on the 3rd (E minor) gives the 3rd, 5th, 13th, 7th and 9th: bright and lifting. The one on the 6th (A minor, the relative minor) gives the 6th (13), root, 9th, 3rd and 5th: open and sweet. The one on the 7th (B minor) brings the F♯, a ♯11: the floating Lydian sound, the most colourful of the three, still major.\n\nThe groove stays plain (chord tones only) for three bars, and the colour comes in the fill at the end of the phrase. The plainer the groove, the more the fill stands out: use it at the end of a phrase, not all the time.',
  tips: ['Play the fill as the scale, in time, and land back on the root.', 'One colour per phrase: let the groove come back before the next.', 'The B minor fill is the boldest: save it for the end of a section.'],
  source: 'Original lines. Minor pentatonics on the 3rd, 6th and 7th of a major chord are a familiar colour device in jazz, fusion and modern bass playing.',
  bpm: 88,
  licks: [
    { name: 'E minor pentatonic (on the 3rd)', feel: STRAIGHT, prog: [['1', 'maj', 16]], notes: `${ROOTS} | ${ROOTS2} | ${ROOTS} | ${E_FILL}` },
    { name: 'A minor pentatonic (on the 6th)', feel: STRAIGHT, prog: [['1', 'maj', 16]], notes: `${ROOTS} | ${ROOTS2} | ${ROOTS} | ${A_FILL}` },
    { name: 'B minor pentatonic (on the 7th: Lydian ♯4)', feel: STRAIGHT, keys: 'lydian', prog: [['1', 'maj', 16]], notes: `${ROOTS} | ${ROOTS2} | ${ROOTS} | ${B_FILL}` },
    { name: 'All three, one after another', feel: STRAIGHT, keys: 'lydian', prog: [['1', 'maj', 32]], notes: `${ROOTS} | ${E_FILL} | ${ROOTS2} | ${A_FILL} | ${ROOTS} | ${B_FILL} | ${ROOTS2} | C2:q E2 G2 C3:q E3:q` },
  ],
});

const GROOVE = 'C2:q r:e C2 Eb2 F2 G2:q';
const FILLS = {
  min: 'G3 F3 Eb3 C3 Bb2 C3 Eb3:q',
  lyd: 'F3 Eb3 C3 Eb3 F3:q G3:q',
  sus: 'C3 Eb3 F3 G3 F3 Eb3 C3:q',
  maj: 'Eb3:q C3 Bb2 G2 Bb2 C3:q',
};
const CM = ['1', 'min7', 4];
/** A two-bar phrase: a groove low, then a fill high in the tonic's minor pentatonic over a chord that changes. */
const grooveFill = lickTemplate({
  pick: 'Study', id: 'sc-pent-groove-fill', module: M, level: 4, minor: true,
  title: 'Groove bar, fill bar',
  summary: 'A bar of groove in the low register, a bar of C minor pentatonic fill up high, over Cm7, D♭maj7, B♭7sus4 or A♭maj7.',
  about: 'A classic bass phrase is two bars long: a groove that holds the band down, then a fill up the neck that answers it. Here the groove stays on Cm7, and the chord under the fill changes from phrase to phrase: Cm7 again, D♭maj7 (Lydian colours), B♭7sus4 or A♭maj7. The fill never leaves the C minor pentatonic, yet each chord gives it a new colour.\n\nThe move between registers is part of the exercise: land the fill in time and get back down for the groove without losing beat 1. When the written fills are easy, keep the groove and make up your own fill each time.',
  tips: ['Shift up during the last beat of the groove, not on the first note of the fill.', 'Land back on the low root exactly on beat 1.', 'Then improvise the fill bar, still inside the box.'],
  source: 'Original grooves and fills. The groove-and-fill phrase is the bread and butter of bass playing; one pentatonic over changing chords is common practice in modern bass teaching.',
  bpm: 84,
  licks: [
    { name: 'Fill over Cm7', feel: STRAIGHT, prog: [CM, CM], notes: `${GROOVE} | ${FILLS.min}` },
    { name: 'Fill over D♭maj7 (Lydian colours)', feel: STRAIGHT, prog: [CM, ['b2', 'maj7', 4]], notes: `${GROOVE} | ${FILLS.lyd}` },
    { name: 'Fill over B♭7sus4', feel: STRAIGHT, prog: [CM, ['b7', 'dom7sus4', 4]], notes: `${GROOVE} | ${FILLS.sus}` },
    { name: 'Fill over A♭maj7', feel: STRAIGHT, prog: [CM, ['b6', 'maj7', 4]], notes: `${GROOVE} | ${FILLS.maj}` },
    { name: 'All four in a row', feel: STRAIGHT, prog: [CM, CM, CM, ['b2', 'maj7', 4], CM, ['b7', 'dom7sus4', 4], CM, ['b6', 'maj7', 4]], notes: `${GROOVE} | ${FILLS.min} | ${GROOVE} | ${FILLS.lyd} | ${GROOVE} | ${FILLS.sus} | ${GROOVE} | ${FILLS.maj}` },
  ],
});

// ---------------------------------------------------------------- Level 5

// the box over an octave and a 3rd: 1 ♭3 4 5 ♭7 8 ♭10
const BOX = [['1', 0], ['b3', 3], ['4', 5], ['5', 7], ['b7', 10], ['1', 12], ['b3', 15]];
const PAIRS = {
  // every other note of the box: 4ths, and one major 3rd (♭3 + 5)
  skip: [[0, 2], [1, 3], [2, 4], [3, 5], [4, 6]],
  // the 4ths only: R + 4, 4 + ♭7, 5 + R, ♭7 + ♭3
  fourths: [[0, 2], [2, 4], [3, 5], [4, 6]],
};
/** Two notes of the box at once on neighbouring strings, near the box's own position (`base`: its root's fret). */
function pairPosition(ctx, lo, hi, base, rootString) {
  let best = null;
  for (let s = 0; s + 1 < ctx.tuning.length; s++) {
    const f1 = lo - ctx.tuning[s], f2 = hi - ctx.tuning[s + 1];
    if (f1 < 0 || f2 < 0 || f1 > ctx.maxFret || f2 > ctx.maxFret) continue;
    const score = Math.abs(f1 - base - 1.5) + Math.abs(f2 - base - 1.5) + (s < rootString ? 4 : 0) + (f1 === 0 || f2 === 0 ? 2 : 0);
    if (!best || score < best.score) best = { score, s, f1, f2 };
  }
  return best;
}
const doubleStops = ex({
  id: 'sc-pent-double-stops', module: M, level: 5,
  title: 'Pentatonic double stops',
  summary: 'Two notes of the minor pentatonic at once, mostly 4ths, up and down the box: for fills and solos.',
  about: 'Played two notes at a time, the minor pentatonic becomes a source of chords for fills and solos. Take every other note of the box and play the pairs together: they are 4ths (root and 4th, 4th and ♭7, 5th and root, ♭7 and ♭3) with one major 3rd (♭3 and 5th) among them. 4ths sit on neighbouring strings at the same fret, so one finger can barre them; the 3rd is a fret apart.\n\nThe open, modern sound of 4ths is everywhere in funk, soul and fusion: in fills, at the end of a solo phrase, or slid into from a fret below. Start with the 4ths only, then the full set.',
  tips: ['Barre a 4th with one finger, rolling it slightly so both strings sound and nothing else rings.', 'Pluck with two fingers together, or with the thumb and a finger.', 'In a solo, slide into a pair from a fret below, or hammer on its top note.'],
  source: 'Original exercise. Double stops in 4ths from the pentatonic are common in funk, soul and fusion bass playing.',
  params: {
    pattern: sel('Double stops', [['fourths', '4ths only'], ['skip', 'Every other note: 4ths and one 3rd']]),
    key: keyP(T.SCALES.minorPent.iv, { def: '9', suffix: 'm' }),
    rhythm: sel('Rhythm', [['1', 'Quarter notes'], ['0.5', '8th notes']]),
  },
  bpm: 72, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const pairs = PAIRS[p.pattern] || PAIRS.fourths;
    // up the box and back down, the top pair played once
    const seq = [...pairs, ...pairs.slice(0, -1).reverse()];
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES.minorPent.iv);
      const r = pickRoot(ctx, k, { strings: ['E', 'A'], lo: 2, hi: 9, span: 15 });
      b.chord(`${nm(tonic, S)}m7`);
      // (the last pair is held to the bar line, so each key and the loop start on beat 1: QA round 20)
      seq.forEach(([i, j], at) => {
        const [ivLo, sLo] = BOX[i], [ivHi, sHi] = BOX[j];
        const pos = pairPosition(ctx, r.midi + sLo, r.midi + sHi, r.f, r.s);
        if (!pos) return;
        b.stack([
          { s: pos.s, f: pos.f1, n: T.up(tonic, ivLo), deg: T.fmtDeg(ivLo) },
          { s: pos.s + 1, f: pos.f2, n: T.up(tonic, ivHi), deg: T.fmtDeg(ivHi) },
        ], { dur: Number(p.rhythm) || 1, fill: at === seq.length - 1 });
      });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

export const PENTATONIC_LICKS = [threeBoxes, minorGrooves, onePhrase, majorChord, grooveFill];
// the order inside each level is the order of the exercise numbers
export default [threeBoxes, minorGrooves, onePhrase, majorChord, grooveFill, doubleStops];
