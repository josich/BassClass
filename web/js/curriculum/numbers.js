// Exercise numbers (user, 2026-10-28: "hotel numbering"): the level, then two digits. 305 is Level 3, exercise 5.
// A number is given once and kept for good: adding, moving or removing exercises never changes another one's
// number. A new exercise takes the next free number of its level (the self-test names it); the Library still
// orders exercises by level, topic and its module's list, so numbers need not be consecutive on the shelf. A
// removed exercise's number goes to RETIRED and is never given again. Everything stored uses ids, never numbers.
// Renumbered on 2026-11-02 in the Library's order (user: "renumber"), so the shelf reads in order again; checked
// once more just before the launch, then frozen (LAUNCH-TODO.md).
export const NUMBERS = {
  // Level 1
  'tech-alt-pluck': 101, 'tech-1234': 102, 'rh-pulse': 103, 'rh-pyramid': 104, 'rh-rests': 105,
  'fb-open-strings': 106, 'fb-naturals': 107, 'fb-chromatic-string': 108, 'fb-landmarks': 109, 'fb-octaves': 110,
  'rd-naturals': 111, 'game-read-notes': 112, 'game-ear-notes': 113, 'sc-one-octave': 114, 'sc-open-position': 115,
  'tri-shape': 116, 'tri-maj-min': 117, 'hm-build-a-chord': 118, 'gr-roots': 119, 'mm-stomp': 120,
  'mm-pulse': 121, 'mm-zombie': 122, 'mm-spirit': 123,
  // Level 2
  'tech-raking': 201, 'tech-muting': 202, 'tech-1234-climb': 203, 'tech-permutations': 204, 'tech-spider': 205,
  'tech-diagonal': 206, 'tech-finger-pairs': 207, 'tech-octaves': 208, 'tech-dynamics': 209, 'tech-pick-alt': 210,
  'rh-offbeats': 211, 'rh-shuffle': 212, 'rh-dotted': 213, 'rh-syncopation': 214, 'fb-unison': 215,
  'fb-find-note': 216, 'fb-note-sweep': 217, 'fb-cycle-zone': 218, 'fb-quiz': 219, 'rd-accidentals': 220,
  'rd-melodies': 221, 'iv-shapes': 222, 'iv-all-from-root': 223, 'iv-moving': 224, 'iv-ear-quiz': 225,
  'ear-triads': 226, 'game-ear-intervals': 227, 'sc-blues': 228, 'sc-chromatic': 229, 'tri-qualities': 230,
  'tri-four-types': 231, 'tri-zone-cycle': 232, 'arp-7th-qualities': 233, 'arp-7th': 234, 'hm-chord-qualities': 235,
  'hm-progression-roots': 236, 'hm-12-bar-blues': 237, 'gr-pick': 238, 'gr-octaves': 239, 'gr-blues': 240,
  'gr-fills': 241, 'mm-dust': 242, 'mm-sunshine': 243, 'mm-standby': 244, 'mm-calif': 245,
  'mm-feelgood': 246, 'mm-blitz': 247,
  // Level 3
  'tech-trills': 301, 'tech-legato': 302, 'tech-string-skip': 303, 'tech-shifting': 304, 'tech-simandl': 305,
  'tech-accents': 306, 'tech-ghost-16ths': 307, 'tech-pick-gallop': 308, 'rh-triplets': 309, 'rh-16th-grid': 310,
  'fb-position-notes': 311, 'fb-all-octaves': 312, 'rd-upper': 313, 'iv-diatonic': 314, 'ear-sevenths': 315,
  'game-ear-chordtones': 316, 'sc-two-octaves': 317, 'sc-sequences': 318, 'sc-one-string': 319, 'sc-keys-one-position': 320,
  'sc-3nps': 321, 'sc-pent-three-boxes': 322, 'sc-pent-minor-grooves': 323, 'tri-scale-forms': 324, 'md-relative': 325,
  'md-parallel': 326, 'tri-three-forms': 327, 'tri-neck-chain': 328, 'tri-inversions': 329, 'tri-diatonic': 330,
  'arp-broken': 331, 'arp-zone-cycle': 332, 'arp-diatonic-7ths': 333, 'hm-chord-formulas': 334, 'hm-chord-tones': 335,
  'hm-double-stops': 336, 'gr-approach': 337, 'gr-world': 338, 'gr-genres': 339, 'gr-funk': 340,
  'wk-two-feel': 341, 'wk-chord-tones': 342, 'lk-rock-blues': 343, 'sl-thumb-pop': 344, 'mm-pressure': 345,
  'mm-jean': 346, 'mm-together': 347, 'mm-longview': 348, 'mm-chain': 349,
  // Level 4
  'tech-stretch': 401, 'tech-harmonics': 402, 'tech-endurance': 403, 'rh-groupings': 404, 'rh-displacement': 405,
  'rh-odd-meters': 406, 'rh-sparse-click': 407, 'fb-key-box': 408, 'rd-keys': 409, 'iv-tenths': 410,
  'iv-scale-octaves': 411, 'ear-progressions': 412, 'sc-positions': 413, 'sc-pent-positions': 414, 'sc-minor-family': 415,
  'sc-pent-one-phrase': 416, 'sc-pent-major-chord': 417, 'sc-pent-groove-fill': 418, 'md-study': 419, 'md-chord-scale': 420,
  'tri-diatonic-minor': 421, 'tri-diatonic-inversions': 422, 'tri-diatonic-4ths': 423, 'tri-open-spread': 424, 'tri-two-octaves': 425,
  'tri-string-sets': 426, 'tri-voice-led-cycle': 427, 'tri-progressions': 428, 'arp-inversions': 429, 'arp-two-octaves': 430,
  'arp-diatonic-inversions': 431, 'arp-ii-v-i': 432, 'arp-voice-led': 433, 'arp-guide-tones': 434, 'hm-minor-keys': 435,
  'hm-shells': 436, 'gr-soul': 437, 'gr-odd-meters': 438, 'wk-approach': 439, 'wk-scalar': 440,
  'wk-mixed': 441, 'sl-grooves': 442, 'sl-octaves-16': 443, 'mm-money': 444, 'mm-criminal': 445,
  'mm-goodtimes': 446, 'mm-flyaway': 447,
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
