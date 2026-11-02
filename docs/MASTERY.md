# Mastery by main options (agreed and built 2026-11-02)

The mastery rules and each exercise's main option, as the user decided on 2026-11-02, built the same day: the data in
`web/js/curriculum/main.js`, the rules in `web/js/mastery.js`. The numbers are the ones given on 2026-11-02, when the
exercises were renumbered in the Library's order (`curriculum/numbers.js`).

## The rules

- **Three marks, one per part of the app.**
  - ✓ The course: a lesson done, a step clean.
  - 🏅 The Library: an exercise mastered. Its card also gets a green edge, so mastered cards stand out from the rest.
  - ● Today's session: a row played today.
- **Main option.** Each exercise names at most one option whose choices are really different material (the Scale of #114: major, natural minor, major pentatonic, minor pentatonic). Key, root string, range, direction, feel, register, neck position and similar options never count. A string counts only where the string is the exercise's topic (#107, #108, #215).
- **Cleared.** A main choice is cleared when the player ticks ✓ Cleared after a full loop at the goal on it, as ✓ Clean in a lesson. Each choice takes its own goal from the course's steps on it, where there are some (a 12/8 gospel ballad does not share a jazz waltz's tempo); else the exercise's. The Options sheet shows a cleared choice with a green edge and a tick.
- **Mastered.** Set by the app once enough choices are cleared. The ⋯ menu can take it back by hand.
- **How many are needed.**
  - Core theory (scales, modes, chords, triads, intervals, upper structures): all of them, however many, except on the very long all-keys drills (#603, #609, #611): 80%.
  - Variations of a known concept (sequences, permutations, progressions, licks, patterns, studies, rudiments): all of them up to 7; 80% from 8 or on very long exercises.
  - A choice that plays the others ("All 24 in a row", "All 5", "All three", "Rotate", "Whole tune", "All four strings") counts as every choice it plays.
- **No main option (—).** One full loop at the goal masters the exercise, as today.
- **Games.** 8 of 10 in a mode of the main setting clears that mode on its own, with no tick, since the score is the proof. Every mode is needed.
- **Course and Library.** A lesson step passed and ticked ✓ Clean at the goal clears its choice in the Library. A mastered exercise still passes the steps on it.
- **No migration.** Mastery records from earlier builds need no care: there are no users yet (user, 2026-11-02).

In all, 203 exercises have a main option and 45 have none (the eight exercises added on 2026-11-02 included).

## Level 1

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 101 | Alternate plucking | — | one loop |
| 102 | Chromatic 1-2-3-4 | — | one loop |
| 103 | Steady pulse | Click: every beat, 2 & 4, beat 1, every 2 bars | all 4 |
| 104 | Subdivision pyramid | Up to: 16ths, sextuplets, 32nds | all 3 |
| 105 | Notes and rests | — | one loop |
| 106 | Open strings | — | one loop |
| 107 | Natural notes on one string | String | every string of the bass |
| 108 | All 12 notes on one string | String | every string of the bass |
| 109 | Landmark frets | — | one loop |
| 110 | The octave shape | — | one loop |
| 111 | Reading: natural notes | Notes: E and A, all four strings | All four strings (holds both) |
| 112 | Read it, tap it | Notes (4 modes) | 8/10 in each |
| 113 | Hear it, tap it: notes | String (5 modes) | 8/10 in each |
| 114 | Your first scales | Scale: major, natural minor, major pentatonic, minor pentatonic | all 4 |
| 115 | Scales in open position | Scale: the same four | all 4 |
| 116 | Your first triads | Triad: major, minor | both |
| 117 | Major vs minor | — | one loop |
| 118 | How a chord is built | Scale: major, natural minor | both |
| 119 | Root-note grooves | Groove (4) | all 4 |
| 120–123 | Song studies | Part | Whole tune (holds the parts) |

## Level 2

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 201 | String crossing & raking | Pattern (3) | all 3 |
| 202 | Muting | Pattern (3) | all 3 |
| 203 | 1-2-3-4 climbing the neck | — | one loop |
| 204 | Finger permutations | Permutation (24, and all 24 in a row) | 20 of 24 (or all 24 in a row) |
| 205 | Spider walk | Pattern (3) | all 3 |
| 206 | Diagonal "X" | — | one loop |
| 207 | Finger pairs | Pair (6) | all 6 |
| 208 | Octave jumps | — | one loop |
| 209 | Dynamics ladder | — | one loop |
| 210 | Pick: alternate 16ths | Pattern (5) | all 5 |
| 211–214 | Off-beats, shuffle, dotted, syncopation | — | one loop |
| 215 | Unisons | String | every string |
| 216 | Find every C | — | one loop |
| 217 | Note sweep | — | one loop |
| 218 | Roots round the cycle in one zone | — (the zone is a position) | one loop |
| 219 | Note-finder quiz | — | one loop |
| 220 | Reading sharps and flats | Notes: all four strings, E and A | All four strings (holds both) |
| 221 | Reading melodies | Key: C, G, F, D, B♭ (the title's topic) | all 5 |
| 222 | Interval shapes | Interval (16) | all 16 |
| 223 | Every interval from one root | — | one loop |
| 224 | One interval, moved | Interval (16) | all 16 |
| 225 | Interval quiz | Intervals: 3rds 4ths 5ths 8ve, all | "All within an octave" (holds both) |
| 226 | Hear the chord | Chords: major and minor, all four | The four (holds both) |
| 227 | Hear it, tap it: intervals | Intervals (4 modes) | 8/10 in each |
| 228 | Blues scales | Scale: blues, major blues | both |
| 229 | Chromatic scale | Layout: in position, along one string | both |
| 230 | Triad qualities | Triad (6) | all 6 |
| 231 | Four triad types | — | one loop |
| 232 | Triads round the cycle | Triad (5) | all 5 |
| 233 | The five 7th chords | — | one loop |
| 234 | 7th arpeggio study | Chord (10) | all 10 |
| 235 | Chord qualities of the key | Scale (3) | all 3 |
| 236 | Progression roots | Progression (26) | 21 of 26 |
| 237 | 12-bar blues | Progression: 12-bar, quick change, minor, jazz | all 4 |
| 238 | Playing with a pick | Groove (3) | all 3 |
| 239 | Octaves & riffs | Groove (3) | all 3 |
| 240 | Blues lines | Groove (5) | all 5 |
| 241 | Fills into the next bar | Fill (6) | all 6 |
| 242–247 | Song studies | Part | Whole tune |
| 248 | Waltzes, 6/8 and 12/8 | Groove (6) | all 6 |

## Level 3

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 301 | Trills | Fingers (6) | all 6 |
| 302 | Legato chromatic | — | one loop |
| 303 | String skipping | Style: blocks, zig-zag | both |
| 304 | Shifting along one string | Shift: 1, 2, 3, 4 frets | all 4 |
| 305 | Simandl 1-2-4 | — | one loop |
| 306 | Accent shifting | Accent every: 3, 5, 7, 3+3+2 | all 4 |
| 307 | Ghost-note 16ths | Pattern (3) | all 3 |
| 308 | Pick: gallops and string skips | Pattern (4) | all 4 |
| 309–310 | Triplet feel, 16th grid | — | one loop |
| 311 | Every note in one position | — (the position is a place, not a topic) | one loop |
| 312 | One note in all octaves | — | one loop |
| 313 | Reading up the neck | Position: 5th, 7th, 9th | all 3 |
| 314 | Diatonic intervals | Interval (8) | all 8 |
| 315 | Hear the 7th chord | Chords (3 sets, each holding the last) | the widest (holds all) |
| 316 | Hear it, tap it: chord tones | Chords (3 modes) | 8/10 in each |
| 317 | Two-octave scales | Scale (9) | all 9 |
| 318 | Scale sequences | Sequence (12) | 10 of 12 |
| 319 | Scales on one string | Scale (8) | all 8 |
| 320 | All 12 keys in one position | Scale (6) | all 6 |
| 321 | Three notes per string | Scale (9) | all 9 |
| 322 | Three minor pentatonics | Study (4) | all 4 |
| 323 | One pentatonic, three chords | Study (3) | all 3 |
| 324 | The 3 scale fingerings | Root finger: 1, 2, 4 (and all three) | all 3 (or all three) |
| 325–326 | Relative and parallel modes | — (every mode in one loop) | one loop |
| 327 | The 3 triad fingerings | Triad (4) | all 4 |
| 328 | One triad up the neck | Triad (4) | all 4 |
| 329 | Triad inversions | Triad (4) | all 4 |
| 330 | Harmonised triads | Scale (9) | all 9 |
| 331 | Broken chords | Chord (12) | all 12 |
| 332 | 7th arpeggios round the cycle | Chord (5) | all 5 |
| 333 | Diatonic 7th arpeggios | Scale (8) | all 8 |
| 334 | Chord formulas | Chords (4 families) | all 4 |
| 335 | Chord tones over progressions | Progression (34) | 28 of 34 |
| 336 | Double stops | Interval (5) | all 5 |
| 337 | Approach notes & Motown | Groove (4) | all 4 |
| 338 | Reggae, bossa & tumbao | Groove (3) | all 3 |
| 339 | Country, samba, second line, afrobeat | Groove (4) | all 4 |
| 340 | Funk 16ths | Groove (3) | all 3 |
| 341 | Two-feel | Progression (9) | 8 of 9 |
| 342 | Walking with chord tones | Progression (9) | 8 of 9 |
| 343 | Rock and blues licks | Lick (8) | 7 of 8 |
| 344 | Slap basics | Pattern (2) | both |
| 345–349 | Song studies | Part | Whole tune |
| 350 | Metal grooves | Groove (5) | all 5 |
| 351 | Reggae and ska | Groove (4) | all 4 |
| 352 | World grooves | Groove (4) | all 4 |

## Level 4

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 401 | Stretch builder | — | one loop |
| 402 | Natural harmonics map | Harmonics: the main four, all up to the 12th | All up to the 12th (holds both) |
| 403 | Endurance 16ths | — | one loop |
| 404 | Odd groupings | Group of 3, 5, 7 | all 3 |
| 405 | Rhythmic displacement | Shift by: a 16th, an 8th | both |
| 406 | Odd metres | Metre (4) | all 4 |
| 407 | Gap click | Click: every 2 bars, every 4 | both |
| 408 | Key centres in one position | — (the position is a place, not a topic) | one loop |
| 409 | Reading in every key | Mode: major, harmonic minor | both |
| 410 | Diatonic 10ths | Style: broken, double stops | both |
| 411 | Scale in octaves | Scale (5) | all 5 |
| 412 | Hear the progression | Progressions (3 sets) | all 3 |
| 413 | The 7 scale positions | Position (7, and all) | all 7 (or all) |
| 414 | Pentatonic: the 5 positions | Position (5, and all) | all 5 (or all) |
| 415 | Harmonic & melodic minor | Scale (3) | all 3 |
| 416 | One pentatonic phrase, many chords | Study (4) | all 4 |
| 417 | Minor pentatonics on a major chord | Study (3, and all three) | all 3 (or all three) |
| 418 | Groove bar, fill bar | Study (4, and all four) | all 4 (or all four) |
| 419 | Mode study | Mode (28) | all 28 |
| 420 | Chord-scale | Progression (6) | all 6 |
| 421 | Harmonised triads in minor | Scale (3) | all 3 |
| 422 | Harmonised triads in inversions | Inversion: 1st, 2nd | both |
| 423 | Diatonic triads in 4ths | Scale (9) | all 9 |
| 424 | Open spread triads | Scale (9) | all 9 |
| 425 | Two-octave triads | Triad (4) | all 4 |
| 426 | Triads on every string set | Triad (4) | all 4 |
| 427 | Voice-led triads, 12 keys | Triad (4) | all 4 |
| 428 | Triads over progressions | Progression (13) | 11 of 13 |
| 429 | 7th chord inversions | Chord (5) | all 5 |
| 430 | Two-octave 7th arpeggios | Chord (10) | all 10 |
| 431 | Diatonic 7ths in inversions | Inversion (3) | all 3 |
| 432 | ii–V–I arpeggios | Type: major, minor | both |
| 433 | Voice-led 7th arpeggios | Progression (11) | 9 of 11 |
| 434 | Guide-tone lines | Progression (6) | all 6 |
| 435 | Minor-key harmony | Progression (6) | all 6 |
| 436 | Shell voicings | Progression (5) | all 5 |
| 437 | Soul and neo-soul | Groove (3) | all 3 |
| 438 | Odd and compound metres | Metre (4) | all 4 |
| 439–441 | Walking: approach, scalar, mixed | Progression (9) | 8 of 9 |
| 442 | Slap grooves | Pattern (3) | all 3 |
| 443 | Slap: 16th-note octaves | Pattern (4) | all 4 |
| 444–447 | Song studies | Part | Whole tune |
| 448 | Latin grooves | Groove (4) | all 4 |
| 449 | Hip-hop and electronic | Groove (4) | all 4 |
| 450 | Gospel and R&B | Groove (3) | all 3 |

## Level 5

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 501 | Permutations across strings | Permutation (24, and all 24) | 20 of 24 (or all 24 in a row) |
| 502 | p-i-m arpeggios | — | one loop |
| 503 | Sweep picking | Shape (3; 4 on a 5- or 6-string) | all |
| 504 | Harmonic chords | — | one loop |
| 505 | Polyrhythms | Ratio (5) | all 5 |
| 506 | Interval cycles | Interval (6) | all 6 |
| 507 | Bebop scales | Scale (3) | all 3 |
| 508 | Symmetric scales | Scale (4) | all 4 |
| 509 | World scales | Scale (6) | all 6 |
| 510 | Barry Harris 6th-diminished | — | one loop |
| 511 | Pentatonic side-stepping | Side-step (3) | all 3 |
| 512 | Pentatonic double stops | Double stops (2) | both |
| 513 | Pitch axis | Modes (3 sets) | all 3 |
| 514 | Pentatonic superimposition | Pentatonic: 1st, 2nd, 3rd (and all three) | all 3 (or all three) |
| 515 | Modes of melodic minor | — (every mode in one loop) | one loop |
| 516 | Melodic-minor superimposition | Chords (3) | all 3 |
| 517 | Modes of harmonic minor | — (every mode in one loop) | one loop |
| 518 | Triads with approach notes | Approach (4) | all 4 |
| 519 | Triad permutations | Order (6, and rotate) | all 6 (or rotate) |
| 520 | Triad rudiments | Rudiment (6) | all 6 |
| 521 | Triad pairs | Pair (7) | all 7 |
| 522 | Harmonised triads, all scales & modes | Scale (21) | all 21 |
| 523 | Sus and quartal stacks | Stack (3) | all 3 |
| 524 | Upper-structure triads | Structure (9) | all 9 |
| 525–526 | Barry Harris diminished | — | one loop |
| 527 | Extended arpeggios | Up to: 9ths, 11ths, 13ths | all 3 |
| 528 | Upper-structure arpeggios | Scale (3) | all 3 |
| 529 | 7th chord permutations | Order (6, and rotate) | all 6 (or rotate) |
| 530 | Arpeggios with approach notes | Approach (3) | all 3 |
| 531 | Altered dominants | Dominant (4) | all 4 |
| 532 | Colour chords | Progression (5) | all 5 |
| 533 | Funk through changes | Groove (2) | both |
| 534, 535, 537 | Walking: enclosures, two per bar, triplet skips | Progression (9) | 8 of 9 |
| 536 | Minor walking | Progression (3) | all 3 |
| 538–544 | Jazz licks | Lick (3 to 7) | all |
| 545 | Advanced slap | Pattern (2) | both |
| 546 | Schism study | Part: 5/8, 7/8 | both |
| 547–550 | Song studies | Part | Whole tune |
| 551 | False harmonics | Line: major scale, major pentatonic, major 7th arpeggio | all 3 |

## Level 6

| # | Exercise | Main option | Needed |
|---|---|---|---|
| 601 | Two-hand tapping | Pattern (3) | all 3 |
| 602 | Odd groupings, all keys | Sequence: 3s, 5s | both |
| 603 | Alternating 3rds, all keys | Scale (11) | 9 of 11 (long) |
| 604 | Messiaen's modes | Mode (7) | all 7 |
| 605 | Modes of harmonic major | — (every mode in one loop) | one loop |
| 606 | Altered chord-scale | Progression (4) | all 4 |
| 607 | Major-3rd cycle triads | Triad: major, minor | both |
| 608 | Every inversion, every key | Triad (4) | all 4 |
| 609 | Harmonised triads, all keys | Scale (9) | 8 of 9 (long) |
| 610 | Triad rudiments, all keys | Rudiment (6) | 5 of 6 (long) |
| 611 | Diatonic 7ths, all keys | Scale (8) | 7 of 8 (long) |
| 612–613 | Rhythm changes, Giant Steps arpeggios | — | one loop |
| 614 | Chordal bass | Voicing: R-5-10, R-7-10 | both |
| 615 | Walking over Coltrane changes | — | one loop |
| 616–617 | Bebop and modern licks | Lick (6) | all 6 |
| 618 | Double thumbing | — | one loop |
| 619, 621–623 | Song studies | Part | Whole tune |
| 620 | YYZ study | Part: 5/4 intro, drive | both |
| 624 | Solo piece | Part (4, and whole tune) | Whole tune (or all 4 parts) |
