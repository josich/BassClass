// Lesson numbers (user, 2026-10-28): the stage, then the lesson's own number in that stage. "3.15" is Stage 3,
// lesson 15. Given once and kept for good, like the exercises' numbers (curriculum/numbers.js): a new lesson takes
// the next free number of its stage wherever it sits in the map, and the numbers of removed lessons go to RETIRED.
// Units have names only; checkpoints and stage tests are named, not numbered. Lessons are stored by id, never by
// number. (Renumbered once in course order before the launch, then frozen: LAUNCH-TODO.md.)
export const LESSON_NUMBERS = {
  // Stage 1
  'hold': 1, 'pluck': 2, 'open-strings': 3, 'one-finger': 4, 'pulse': 5, 'subdivisions': 6, 'rests': 7, 'alphabet': 8,
  'sharps-flats': 9, 'landmarks': 10, 'octaves': 11, 'roots': 12, 'root-fifth': 13, 'lead-in': 14, 'major-scale': 15, 'open-position': 16,
  'pentatonics': 17, 'build-chord': 18, 'triad-shapes': 19, 'major-minor': 20, 'clef': 21, 'first-position': 22,
  // Stage 2
  'raking': 1, 'muting': 2, 'climb': 3, 'independence': 4, 'chromatic': 5, 'offbeats': 6, 'swing': 7, 'dotted': 8,
  'syncopation': 9, 'unisons': 10, 'find-every': 11, 'zone-roots': 12, 'note-quiz': 13, 'interval-shapes': 14, 'interval-family': 15, 'interval-ear': 16,
  'triad-types': 17, 'four-types': 18, 'triad-cycle': 19, 'five-sevenths': 20, 'seventh-shapes': 21, 'key-chords': 22, 'progressions': 23, 'twelve-bar': 24,
  'blues-scale': 25, 'blues-lines': 26, 'octave-grooves': 27, 'riffs': 28, 'dynamics': 29, 'pick': 30, 'accidentals': 31, 'key-signatures': 32,
  // Stage 3
  'trills': 1, 'legato': 2, 'shifts': 3, 'string-skip': 4, 'triplet-feel': 5, 'sixteenths': 6, 'accents': 7, 'ghost-notes': 8,
  'position-notes': 9, 'all-octaves': 10, 'reading-up': 11, 'two-octaves': 12, 'scale-forms': 13, 'keys-in-position': 14, 'pent-three-boxes': 15, 'pent-minor-grooves': 16,
  'one-string': 17, 'three-per-string': 18, 'sequences': 19, 'diatonic-intervals': 20, 'relative-modes': 21, 'parallel-modes': 22, 'triad-forms': 23, 'inversions': 24,
  'neck-chain': 25, 'harmonised-triads': 26, 'diatonic-7ths': 27, 'broken-chords': 28, 'zone-7ths': 29, 'hear-7ths': 30, 'chord-formulas': 31, 'chord-tones': 32,
  'approach-notes': 33, 'double-stops': 34, 'world-grooves': 35, 'two-feel': 36, 'walking-chord-tones': 37, 'styles': 38, 'slap-basics': 39,
  // Stage 4
  'stretch': 1, 'endurance': 2, 'harmonics': 3, 'groupings': 4, 'displacement': 5, 'odd-meters': 6, 'gap-click': 7, 'key-box': 8,
  'major-positions': 9, 'pent-positions': 10, 'reading-keys': 11, 'pent-one-phrase': 12, 'pent-major-chord': 13, 'pent-groove-fill': 14, 'harmonic-melodic': 15, 'minor-triads': 16,
  'minor-harmony': 17, 'mode-study': 18, 'chord-scale': 19, 'hear-progressions': 20, 'key-inversions': 21, 'key-fourths': 22, 'open-triads': 23, 'string-sets': 24,
  'voice-led-triads': 25, 'ii-v-i-lines': 26, 'guide-tones': 27, 'seventh-inversions': 28, 'two-octave-7ths': 29, 'key-7th-inversions': 30, 'tenths': 31, 'scale-octaves': 32,
  'walk-approach': 33, 'walk-scalar': 34, 'walk-mixed': 35, 'soul': 36, 'odd-grooves': 37, 'slap-grooves': 38,
  // Stage 5
  'perm-across': 1, 'pim': 2, 'polyrhythms': 3, 'sweeps': 4, 'interval-cycles': 5, 'symmetric': 6, 'side-stepping': 7, 'world-scales': 8,
  'bebop-scales': 9, 'sixth-diminished': 10, 'dim-dominants': 11, 'approach-arps': 12, 'pitch-axis': 13, 'melodic-modes': 14, 'harmonic-modes': 15, 'pent-super': 16,
  'melodic-super': 17, 'triad-perms': 18, 'triad-rudiments': 19, 'triad-pairs': 20, 'modal-triads': 21, 'quartal': 22, 'upper-structures': 23, 'extended': 24,
  'upper-arps': 25, 'arp-perms': 26, 'altered-dominants': 27, 'colour-chords': 28, 'funk-changes': 29, 'walk-enclosures': 30, 'walk-two-per-bar': 31, 'walk-minor': 32,
  'walk-skips': 33, 'licks-251': 34, 'licks-minor': 35, 'licks-blues': 36, 'solo-devices': 37, 'motif': 38, 'implied': 39, 'slap-advanced': 40,
  'pent-double-stops': 41, 'harmonic-chords': 42,
  // Stage 6
  'odd-groupings': 1, 'alternating-3rds': 2, 'cycle-inversions': 3, 'triads-all-keys': 4, 'rudiments-all-keys': 5, 'sevenths-all-keys': 6, 'messiaen': 7, 'harmonic-major': 8,
  'altered-chord-scale': 9, 'major-thirds': 10, 'giant-steps-arps': 11, 'giant-steps-walk': 12, 'rhythm-changes-arps': 13, 'chordal': 14, 'double-thumb': 15, 'tapping': 16,
  'bebop-vocab': 17, 'modern-vocab': 18,
};

/** Lesson numbers ("3.15") of lessons that were removed: never given again. */
export const RETIRED_LESSONS = [];
