// Groove and rock beyond jazz (user, 2026-10-29: "fills, rock and blues licks, pick, slap in the core path, more
// styles… let's do it"; the expert reviews of 2026-10-29: a rock or funk player found little in their style before
// Level 5). Original phrases on the licks engine, written in C (or C minor) and transposed, opening in E: fills into
// the next bar, rock and blues licks, the pick (down-strokes, alternate picking, gallops, string skips) and 16th-note
// slap. Pick strokes are ⊓ and V, slap T (thumb), P (pop), H (hammer-on), x a ghost note.
import { lickTemplate } from './licks.js';

const STRAIGHT = 'straight';
const rep = (cell, n) => Array.from({ length: n }, () => cell).join(' ');

// ---------------------------------------------------------------- fills (Level 2)

const fills = lickTemplate({
  id: 'gr-fills', module: 'grooves', level: 2, minor: true, keys: 'blues', defKey: '4', pick: 'Fill',
  title: 'Fills into the next bar: rock and blues',
  summary: 'A bar of groove, then a short fill that leads back to beat 1: down the box, up to the octave, triplets, a walk-up, octaves, the blues scale.',
  about: 'A fill is a short phrase at the end of a bar (or a phrase) that leads the band into the next one. It lives in the last beat or two, and it always lands: the next beat 1 comes back on the root, on time. These fills use the minor pentatonic box and the blues scale over a rock groove of 8ths, and one walks up chromatically into the IV chord of a blues.\n\nPlay the groove bar plain, then the fill, and come back to the root on beat 1 without a gap. Fills sound best when they are rare: one every 4 or 8 bars in a song.',
  tips: ['Count the groove bar out loud; start the fill exactly on its beat.', 'The note after the fill matters most: land the root on beat 1.', 'In a song, one fill every 4 or 8 bars. More and it stops being a fill.'],
  source: 'Original fills. Fills into the next bar are part of graded rock and blues bass exams and of every band player\'s vocabulary.',
  bpm: 84,
  licks: [
    { name: 'Down the box', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: `${rep('C2', 8)} | C2 C2 C2 C2 C3 Bb2 G2 F2` },
    { name: 'Up to the octave', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: `${rep('C2', 8)} | C2 C2 C2 C2 Eb2 F2 G2 Bb2` },
    { name: 'A triplet run', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: `${rep('C2', 8)} | C2:q C2:q Eb2:t F2:t G2:t Bb2:t G2:t F2:t` },
    { name: 'Octaves into beat 1', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: `${rep('C2', 8)} | C2 C2 C2 C2 C3:s C3:s Bb2 G2:s G2:s F2` },
    { name: 'The blues scale', prog: [['1', 'min7', 8]], notes: 'C2 C2 Eb2 C2 F2 C2 Eb2 C2 | C2:q C2:q Eb2 F2 Gb2 G2' },
    { name: 'Walk up to the IV (blues)', minor: false, prog: [['1', 'dom7', 4], ['4', 'dom7', 4]], notes: 'C2 C2 C2 C2 D2:q Eb2 E2 | F2 F2 F2 F2 E2:q Eb2 Db2' },
  ],
});

// ---------------------------------------------------------------- rock and blues licks (Level 3)

const rockBlues = lickTemplate({
  id: 'lk-rock-blues', module: 'licks', level: 3, minor: true, keys: 'blues', defKey: '4', pick: 'Lick',
  title: 'Rock and blues licks',
  summary: 'Eight phrases for rock and blues: the minor pentatonic, the blue note into the 3rd, the major pentatonic, Mixolydian riffs, hammer-ons, triplets and a turnaround.',
  about: 'The rock and blues bassist\'s vocabulary: short phrases built on the minor pentatonic (the box you know), the blues scale\'s ♭5, the major pentatonic of country and soul, and the Mixolydian riffs of a blues in 7th chords. They work as fills, as answers to the singer, or as a bass solo of a chorus or two.\n\nLearn one at a time in E, then move it to A and D, the other two chords of an E blues. The labels name each note against the chord: watch the ♭3 slide into the 3rd over a 7th chord.',
  tips: ['Slide or hammer from the ♭3 into the 3rd over a 7th chord: that is the blues sound.', 'Shuffle the blues licks (Feel: swing), keep the rock ones straight.', 'Play a lick, then leave space: a phrase needs a breath after it.'],
  source: 'Original licks in standard rock and blues vocabulary (minor and major pentatonics, the blues scale, Mixolydian riffs).',
  bpm: 80,
  licks: [
    { name: 'Minor pentatonic, down and up', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: 'C3 Bb2 G2 F2 Eb2 C2 Eb2:q | F2 G2 Bb2:q G2:q C2:q' },
    { name: 'Root, 5th, octave riff', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: 'C2 C2 G2 C3 Bb2 G2 F2 G2 | C2 C2 G2 C3 Eb3 C3 Bb2 G2' },
    { name: 'Hammer-ons up the box', feel: STRAIGHT, prog: [['1', 'min7', 8]], notes: 'C2 Eb2:e:H F2 G2:e:H Bb2 C3:e:H Bb2 G2 | F2 G2:e:H F2 Eb2 C2:h' },
    { name: 'The blue note into the 3rd', minor: false, prog: [['1', 'dom7', 8]], notes: 'C2 Eb2 E2 G2 Bb2 G2 Gb2 F2 | Eb2:q C2:q C2:h' },
    { name: 'Major pentatonic (country)', minor: false, keys: 'major', feel: STRAIGHT, prog: [['1', 'maj', 8]], notes: 'C2 D2 E2 G2 A2 G2 E2 D2 | C2:q G1:q C2:h' },
    { name: 'Mixolydian riff', minor: false, prog: [['1', 'dom7', 8]], notes: 'C2:q C2 E2 G2 A2 Bb2 A2 | G2 E2 F2 F#2 G2:q C2:q' },
    { name: 'A triplet blues lick', minor: false, prog: [['1', 'dom7', 8]], notes: 'G2:t Bb2:t C3:t Bb2:t G2:t Eb2:t E2:q C2:q | Bb1:q C2:q r:h' },
    { name: 'Turnaround: I – V', minor: false, prog: [['1', 'dom7', 4], ['5', 'dom7', 4]], notes: 'C2 E2 G2 A2 Bb2 A2 G2 E2 | G1 B1 D2 F2 G2 F2 D2 Db2' },
  ],
});

// ---------------------------------------------------------------- the pick (Levels 2 and 3)

const pickAlt = lickTemplate({
  id: 'tech-pick-alt', module: 'technique', level: 2, minor: true, keys: 'minor', defKey: '4', pick: 'Pattern',
  title: 'Pick: down-strokes and alternate picking',
  summary: 'Steady down-strokes, then down and up: 8ths, 16ths, the octave and a root–5th–♭7 riff, palm muted.',
  about: 'Rock, punk and metal bass is often played with a pick: an even attack and a punchy, bright sound. Down-strokes only (⊓) give the heaviest, most even 8ths; alternate picking (⊓ V, down and up) is what makes 16ths and fast lines possible. Rest the side of the picking hand lightly on the strings by the bridge (palm muting) for a short, chunky sound, or lift it for notes that ring.\n\nKeep the stroke small: the pick moves only just past the string. Start slowly, every stroke the same loudness, then speed up with the speed trainer.',
  tips: ['Hold the pick between the thumb and the side of the index, only its tip showing.', 'Palm mute: the edge of the hand on the strings just by the bridge, light enough for the note to sound.', 'Down-strokes: the hand comes back up without touching the string.'],
  source: 'Original patterns. Pick technique is part of graded rock bass exams.',
  bpm: 90,
  licks: [
    { name: 'Down-strokes, steady 8ths', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓', 16) },
    { name: 'Alternate picking, 8ths', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓ C2:e:V', 8) },
    { name: 'Alternate picking, 16ths', feel: STRAIGHT, prog: [['1', 'min', 4]], notes: rep('C2:s:⊓ C2:s:V', 8) },
    { name: 'Root and octave across the strings', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓ C3:e:V', 8) },
    { name: 'Root, 5th and ♭7 riff', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓ C2:e:V G2:e:⊓ C2:e:V Bb2:e:⊓ C2:e:V G2:e:⊓ C2:e:V', 2) },
  ],
});

const pickGallop = lickTemplate({
  id: 'tech-pick-gallop', module: 'technique', level: 3, minor: true, keys: 'minor', defKey: '4', pick: 'Pattern',
  title: 'Pick: gallops and string skips',
  summary: 'The gallop of metal and rock (an 8th and two 16ths), its reverse, a moving gallop riff and string skips with the pick.',
  about: 'The gallop is an 8th note and two 16ths, again and again: the rhythm of a horse running, and of much heavy metal. Pick it down, down-up (⊓ ⊓V) so the down-stroke always falls on the beat; the reverse gallop (two 16ths and an 8th) is down-up, down. Then move the gallop around a riff, and skip strings with the pick: root, 5th and octave with no string in between left ringing.\n\nPalm mute lightly for the classic chug, and keep the 16ths even: the second 16th is the one that rushes.',
  tips: ['Gallop: ⊓ on the 8th, ⊓ V on the two 16ths, so every beat starts with a down-stroke.', 'Count "1 – 2-and" in your head: the 16ths sit on "2-and".', 'Mute the strings you skip with the picking hand\'s palm and the fretting hand\'s spare fingers.'],
  source: 'Original patterns. Gallops and string skipping with a pick are part of graded rock and metal bass playing.',
  bpm: 84,
  licks: [
    { name: 'The gallop', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓ C2:s:⊓ C2:s:V', 8) },
    { name: 'The reverse gallop', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:s:⊓ C2:s:V C2:e:⊓', 8) },
    { name: 'A moving gallop riff', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: ['C2', 'C2', 'Eb2', 'F2', 'C2', 'C2', 'Bb1', 'C2'].map((n) => `${n}:e:⊓ ${n}:s:⊓ ${n}:s:V`).join(' ') },
    { name: 'String skips: root, 5th, octave', feel: STRAIGHT, prog: [['1', 'min', 8]], notes: rep('C2:e:⊓ G2:e:V C3:e:⊓ G2:e:V', 4) },
  ],
});

// ---------------------------------------------------------------- 16th-note slap (Level 4)

const slap16 = lickTemplate({
  id: 'sl-octaves-16', module: 'slap', level: 4, minor: true, keys: 'minor', defKey: '4', pick: 'Pattern',
  title: 'Slap: 16th-note octaves, ghosts and hammer-ons',
  summary: 'Funk slap in 16ths: octaves, thumb–ghost–pop cells, thumb–pop–hammer triplets and a moving octave line.',
  about: 'Past the basic thumb and pop, funk slap lives in 16th notes: the thumb (T) on the low root, the pop (P) on its octave two strings up, and ghost notes (x) in between, dead notes slapped with the thumb or tapped by the fretting hand, which keep the 16ths going without a pitch. A hammer-on (H) after a pop adds a note without a new attack: thumb, pop, hammer is the classic triplet figure.\n\nKeep the thumb loose and bouncing off the string, the popping finger hooked just under it. Start at half speed: the ghosts must be as even as the notes.',
  tips: ['The thumb bounces off the string like a drumstick; it does not push through it.', 'Ghost notes: fretting-hand fingers resting on the strings, slapped like any note.', 'The octave pop is two strings up and two frets up from the root.'],
  source: 'Original patterns in the style of funk slap bass (in the style of Larry Graham, Louis Johnson, Marcus Miller).',
  bpm: 72,
  licks: [
    { name: '16th-note octaves', feel: STRAIGHT, prog: [['1', 'min7', 4]], notes: rep('C2:s:T C3:s:P', 8) },
    { name: 'Thumb, ghost, pop, ghost', feel: STRAIGHT, prog: [['1', 'min7', 4]], notes: rep('C2:s:T C2:s:x C3:s:P C2:s:x', 4) },
    { name: 'Thumb, pop, hammer: triplets', feel: STRAIGHT, prog: [['1', 'min7', 4]], notes: rep('C2:t:T C3:t:P D3:t:H', 4) },
    { name: 'A moving octave line', feel: STRAIGHT, prog: [['1', 'min7', 4]], notes: 'C2:s:T C3:s:P C2:s:T C3:s:P Bb1:s:T Bb2:s:P Bb1:s:T Bb2:s:P G1:s:T G2:s:P G1:s:T G2:s:P Bb1:s:T Bb2:s:P Bb1:s:T Bb2:s:P' },
  ],
});

export const ROCK_LICKS = [fills, rockBlues, pickAlt, pickGallop, slap16];
export default ROCK_LICKS;
