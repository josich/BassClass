// Exercise numbers (user, 2026-10-28: "hotel numbering"): the level, then two digits. 305 is Level 3, exercise 5.
// A number is given once and kept for good: adding, moving or removing exercises never changes another one's
// number. A new exercise takes the next free number of its level (the self-test names it); the Library still
// orders exercises by level, topic and its module's list, so numbers need not be consecutive on the shelf. A
// removed exercise's number goes to RETIRED and is never given again. Everything stored uses ids, never numbers.
// (Renumbered once in course order before the launch, then frozen: LAUNCH-TODO.md.)
export const NUMBERS = {
  // Level 1
  'tech-alt-pluck': 101, 'tech-1234': 102, 'rh-pulse': 103, 'rh-pyramid': 104, 'rh-rests': 105,
  'fb-open-strings': 106, 'fb-naturals': 107, 'fb-chromatic-string': 108, 'fb-landmarks': 109, 'fb-octaves': 110,
  'rd-naturals': 111, 'sc-one-octave': 112, 'sc-open-position': 113, 'tri-shape': 114, 'tri-maj-min': 115,
  'hm-build-a-chord': 116, 'gr-roots': 117, 'mm-stomp': 118, 'mm-pulse': 119, 'mm-zombie': 120,
  'mm-spirit': 121, 'game-ear-notes': 122, 'game-read-notes': 123,
  // Level 2
  'tech-raking': 201, 'tech-muting': 202, 'tech-1234-climb': 203, 'tech-permutations': 204, 'tech-spider': 205,
  'tech-diagonal': 206, 'tech-finger-pairs': 207, 'tech-octaves': 208, 'tech-dynamics': 209, 'rh-offbeats': 210,
  'rh-shuffle': 211, 'rh-dotted': 212, 'rh-syncopation': 213, 'fb-unison': 214, 'fb-find-note': 215,
  'fb-note-sweep': 216, 'fb-cycle-zone': 217, 'fb-quiz': 218, 'rd-accidentals': 219, 'rd-melodies': 220,
  'iv-shapes': 221, 'iv-all-from-root': 222, 'iv-moving': 223, 'iv-ear-quiz': 224, 'ear-triads': 225,
  'sc-blues': 226, 'sc-chromatic': 227, 'tri-qualities': 228, 'tri-four-types': 229, 'tri-zone-cycle': 230, 'game-ear-intervals': 245, 'gr-fills': 246, 'tech-pick-alt': 247,
  'arp-7th-qualities': 231, 'arp-7th': 232, 'hm-chord-qualities': 233, 'hm-progression-roots': 234, 'hm-12-bar-blues': 235,
  'gr-pick': 236, 'gr-octaves': 237, 'gr-blues': 238, 'mm-dust': 239, 'mm-sunshine': 240,
  'mm-standby': 241, 'mm-calif': 242, 'mm-feelgood': 243, 'mm-blitz': 244,
  // Level 3
  'tech-trills': 301, 'tech-legato': 302, 'tech-string-skip': 303, 'tech-shifting': 304, 'tech-simandl': 305,
  'tech-accents': 306, 'tech-ghost-16ths': 307, 'rh-triplets': 308, 'rh-16th-grid': 309, 'fb-position-notes': 310,
  'fb-all-octaves': 311, 'rd-upper': 312, 'iv-diatonic': 313, 'ear-sevenths': 314, 'sc-two-octaves': 315,
  'sc-sequences': 316, 'sc-one-string': 317, 'sc-keys-one-position': 318, 'sc-3nps': 319, 'sc-pent-three-boxes': 320,
  'sc-pent-minor-grooves': 321, 'tri-scale-forms': 322, 'md-relative': 323, 'md-parallel': 324, 'tri-three-forms': 325,
  'tri-neck-chain': 326, 'tri-inversions': 327, 'tri-diatonic': 328, 'arp-broken': 329, 'arp-zone-cycle': 330,
  'arp-diatonic-7ths': 331, 'hm-chord-formulas': 332, 'hm-chord-tones': 333, 'hm-double-stops': 334, 'gr-approach': 335,
  'gr-world': 336, 'gr-genres': 337, 'gr-funk': 338, 'wk-two-feel': 339, 'wk-chord-tones': 340,
  'sl-thumb-pop': 341, 'mm-pressure': 342, 'mm-jean': 343, 'mm-together': 344, 'mm-longview': 345,
  'mm-chain': 346, 'game-ear-chordtones': 347, 'lk-rock-blues': 348, 'tech-pick-gallop': 349,
  // Level 4
  'tech-stretch': 401, 'tech-harmonics': 402, 'tech-endurance': 403, 'rh-groupings': 404, 'rh-displacement': 405,
  'rh-odd-meters': 406, 'rh-sparse-click': 407, 'fb-key-box': 408, 'rd-keys': 409, 'iv-tenths': 410,
  'iv-scale-octaves': 411, 'ear-progressions': 412, 'sc-positions': 413, 'sc-pent-positions': 414, 'sc-minor-family': 415,
  'sc-pent-one-phrase': 416, 'sc-pent-major-chord': 417, 'sc-pent-groove-fill': 418, 'md-study': 419, 'md-chord-scale': 420,
  'tri-diatonic-minor': 421, 'tri-diatonic-inversions': 422, 'tri-diatonic-4ths': 423, 'tri-open-spread': 424, 'tri-two-octaves': 425,
  'tri-string-sets': 426, 'tri-voice-led-cycle': 427, 'tri-progressions': 428, 'arp-inversions': 429, 'arp-two-octaves': 430,
  'arp-diatonic-inversions': 431, 'arp-ii-v-i': 432, 'arp-voice-led': 433, 'arp-guide-tones': 434, 'hm-minor-keys': 435,
  'hm-shells': 436, 'gr-soul': 437, 'gr-odd-meters': 438, 'wk-approach': 439, 'wk-scalar': 440,
  'wk-mixed': 441, 'sl-grooves': 442, 'mm-money': 443, 'mm-criminal': 444, 'mm-goodtimes': 445,
  'mm-flyaway': 446, 'sl-octaves-16': 447,
  // Level 5
  'tech-permutations-across': 501, 'tech-pim': 502, 'tech-sweep': 503, 'tech-harmonic-chords': 504, 'rh-polyrhythm': 505,
  'iv-cycles': 506, 'sc-bebop': 507, 'sc-symmetric': 508, 'sc-exotic': 509, 'sc-sixth-diminished': 510,
  'sc-pent-sidestep': 511, 'sc-pent-double-stops': 512, 'md-pitch-axis': 513, 'md-pentatonic-superimposition': 514, 'md-melodic-modes': 515,
  'md-melodic-superimposition': 516, 'md-harmonic-modes': 517, 'tri-approach': 518, 'tri-permutations': 519, 'tri-rudiments': 520,
  'tri-pairs': 521, 'tri-diatonic-modes': 522, 'tri-sus-quartal': 523, 'tri-upper-structures': 524, 'arp-dim-dominants': 525,
  'arp-dim-to-minor': 526, 'arp-extended': 527, 'arp-upper-structure': 528, 'arp-permutations': 529, 'arp-approach': 530,
  'arp-altered-dominants': 531, 'hm-colour-chords': 532, 'gr-funk-changes': 533, 'wk-enclosures': 534, 'wk-two-per-bar': 535,
  'wk-minor': 536, 'wk-triplet-skips': 537, 'lk-ii-v-i': 538, 'lk-minor-ii-v-i': 539, 'lk-blues': 540,
  'lk-turnarounds': 541, 'lk-bass-solo': 542, 'lk-motif': 543, 'lk-implied': 544, 'sl-advanced': 545,
  'mm-schism': 546, 'mm-cantstop': 547, 'mm-hysteria': 548, 'mm-duke': 549, 'mm-whatsgoingon': 550,
  // Level 6
  'tech-tapping': 601, 'sc-odd-groupings': 602, 'sc-alternating-all-keys': 603, 'sc-messiaen': 604, 'md-harmonic-major-modes': 605,
  'md-altered-chord-scale': 606, 'tri-major-thirds': 607, 'tri-cycle-all-inversions': 608, 'tri-diatonic-all-keys': 609, 'tri-rudiments-all-keys': 610,
  'arp-diatonic-all-keys': 611, 'arp-rhythm-changes': 612, 'arp-giant-steps': 613, 'hm-chordal-bass': 614, 'wk-giant-steps': 615,
  'lk-bebop': 616, 'lk-modern': 617, 'sl-double-thumb': 618, 'mm-deantown': 619, 'mm-yyz': 620,
  'mm-tommy': 621, 'mm-teentown': 622, 'mm-thump': 623, 'mm-solo-piece': 624,
};

/** Numbers of exercises that were removed: never given again. */
export const RETIRED = [];
