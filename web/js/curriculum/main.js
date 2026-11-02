// Each exercise's main option (user, 2026-11-02; the list in docs/MASTERY.md): the one option whose choices are
// really different material (the Scale of #114: major, natural minor, major pentatonic, minor pentatonic), never the
// key, root string, range, direction, feel, register or neck position. Each of its choices is cleared by the player's
// ✓ Cleared after a full loop at the exercise's goal on it; the exercise is mastered once enough are cleared
// (mastery.js). An exercise not listed has no main option: one full loop at the goal, then ✓ Cleared, masters it.
//   'param'                  every choice is needed (core theory however many; variations up to 7)
//   { by, pct: 0.8 }         80% of them, rounded up (variations from 8 choices, very long exercises)
//   { by, all: 'value' }     that choice plays every other one, so clearing it clears them all
//   { by, only: ['value'] }  only that choice counts (it holds the others: "All four strings")
//   { by, game: true }       a game: a mode is cleared on its own at 8 of 10 (no tick), every mode is needed
const ALL = (by, more = {}) => ({ by, all: 'all', ...more });
const P80 = (by, more = {}) => ({ by, pct: 0.8, ...more });
const SONG = ALL('part');

export const MAIN = {
  // Level 1
  'rh-pulse': 'click', 'rh-pyramid': 'max', 'fb-naturals': 'string', 'fb-chromatic-string': 'string',
  'rd-naturals': { by: 'range', only: ['all'] }, 'game-read-notes': { by: 'notes', game: true }, 'game-ear-notes': { by: 'string', game: true },
  'sc-one-octave': 'type', 'sc-open-position': 'type', 'tri-shape': 'quality', 'hm-build-a-chord': 'scale', 'gr-roots': 'style',
  'mm-stomp': SONG, 'mm-pulse': SONG, 'mm-zombie': SONG, 'mm-spirit': SONG,
  // Level 2
  'tech-raking': 'pattern', 'tech-muting': 'pattern', 'tech-permutations': ALL('perm', { pct: 0.8 }), 'tech-spider': 'pattern',
  'tech-finger-pairs': 'pair', 'tech-pick-alt': 'lick', 'fb-unison': 'string', 'rd-accidentals': { by: 'range', only: ['all'] },
  'rd-melodies': 'key', 'iv-shapes': 'iv', 'iv-moving': 'iv', 'iv-ear-quiz': { by: 'set', only: ['all'] }, 'ear-triads': { by: 'set', only: ['all'] },
  'game-ear-intervals': { by: 'set', game: true }, 'sc-blues': 'type', 'sc-chromatic': 'layout', 'tri-qualities': 'quality',
  'tri-zone-cycle': 'quality', 'arp-7th': 'quality', 'hm-chord-qualities': 'scale', 'hm-progression-roots': P80('prog'),
  'hm-12-bar-blues': 'prog', 'gr-pick': 'style', 'gr-octaves': 'style', 'gr-blues': 'style', 'gr-fills': 'lick', 'gr-waltz': 'style',
  'mm-dust': SONG, 'mm-sunshine': SONG, 'mm-standby': SONG, 'mm-calif': SONG, 'mm-feelgood': SONG, 'mm-blitz': SONG,
  // Level 3
  'tech-trills': 'pair', 'tech-string-skip': 'style', 'tech-shifting': 'shift', 'tech-accents': 'group', 'tech-ghost-16ths': 'pattern',
  'tech-pick-gallop': 'lick', 'rd-upper': 'pos', 'iv-diatonic': 'pattern', 'ear-sevenths': { by: 'set', only: ['all'] },
  'game-ear-chordtones': { by: 'chords', game: true }, 'sc-two-octaves': 'type', 'sc-sequences': P80('pattern'), 'sc-one-string': 'type',
  'sc-keys-one-position': 'type', 'sc-3nps': 'type', 'sc-pent-three-boxes': 'lick', 'sc-pent-minor-grooves': 'lick',
  'tri-scale-forms': ALL('form'), 'tri-three-forms': 'quality', 'tri-neck-chain': 'quality', 'tri-inversions': 'quality',
  'tri-diatonic': 'scale', 'arp-broken': 'quality', 'arp-zone-cycle': 'quality', 'arp-diatonic-7ths': 'scale',
  'hm-chord-formulas': 'family', 'hm-chord-tones': P80('prog'), 'hm-double-stops': 'type', 'gr-approach': 'style', 'gr-world': 'style',
  'gr-genres': 'style', 'gr-funk': 'style', 'wk-two-feel': P80('prog'), 'wk-chord-tones': P80('prog'), 'lk-rock-blues': P80('lick'),
  'sl-thumb-pop': 'style', 'gr-metal': 'style', 'gr-reggae': 'style', 'gr-world-grooves': 'style', 'mm-pressure': SONG, 'mm-jean': SONG, 'mm-together': SONG, 'mm-longview': SONG, 'mm-chain': SONG,
  // Level 4
  'tech-harmonics': { by: 'set', only: ['all'] }, 'rh-groupings': 'group', 'rh-displacement': 'step', 'rh-odd-meters': 'meter',
  'rh-sparse-click': 'every', 'rd-keys': 'mode', 'iv-tenths': 'mode', 'iv-scale-octaves': 'scale', 'ear-progressions': 'set',
  'sc-positions': ALL('pos'), 'sc-pent-positions': ALL('pos'), 'sc-minor-family': 'type', 'sc-pent-one-phrase': 'lick',
  'sc-pent-major-chord': { by: 'lick', all: '3' }, 'sc-pent-groove-fill': { by: 'lick', all: '4' }, 'md-study': 'type',
  'md-chord-scale': 'prog', 'tri-diatonic-minor': 'scale', 'tri-diatonic-inversions': 'inversion', 'tri-diatonic-4ths': 'scale',
  'tri-open-spread': 'scale', 'tri-two-octaves': 'quality', 'tri-string-sets': 'quality', 'tri-voice-led-cycle': 'quality',
  'tri-progressions': P80('prog'), 'arp-inversions': 'quality', 'arp-two-octaves': 'quality', 'arp-diatonic-inversions': 'inversion',
  'arp-ii-v-i': 'type', 'arp-voice-led': P80('prog'), 'arp-guide-tones': 'prog', 'hm-minor-keys': 'prog', 'hm-shells': 'prog',
  'gr-soul': 'style', 'gr-odd-meters': 'meter', 'wk-approach': P80('prog'), 'wk-scalar': P80('prog'), 'wk-mixed': P80('prog'),
  'sl-grooves': 'style', 'sl-octaves-16': 'lick', 'gr-latin': 'style', 'gr-electronic': 'style', 'gr-gospel': 'style', 'mm-money': SONG, 'mm-criminal': SONG, 'mm-goodtimes': SONG, 'mm-flyaway': SONG,
  // Level 5
  'tech-permutations-across': ALL('perm', { pct: 0.8 }), 'tech-sweep': 'shape', 'rh-polyrhythm': 'ratio', 'iv-cycles': 'iv',
  'sc-bebop': 'type', 'sc-symmetric': 'type', 'sc-exotic': 'type', 'sc-pent-sidestep': 'side', 'sc-pent-double-stops': 'pattern',
  'md-pitch-axis': 'set', 'md-pentatonic-superimposition': ALL('choice'), 'md-melodic-superimposition': 'set', 'tri-approach': 'approach',
  'tri-permutations': { by: 'perm', all: 'rotate' }, 'tri-rudiments': 'rudiment', 'tri-pairs': 'pair', 'tri-diatonic-modes': 'scale',
  'tri-sus-quartal': 'stack', 'tri-upper-structures': 'us', 'arp-extended': 'ext', 'arp-upper-structure': 'scale',
  'arp-permutations': { by: 'perm', all: 'rotate' }, 'arp-approach': 'approach', 'arp-altered-dominants': 'alt', 'hm-colour-chords': 'prog',
  'gr-funk-changes': 'style', 'wk-enclosures': P80('prog'), 'wk-two-per-bar': P80('prog'), 'wk-minor': 'prog', 'wk-triplet-skips': P80('prog'),
  'lk-ii-v-i': 'lick', 'lk-minor-ii-v-i': 'lick', 'lk-blues': 'lick', 'lk-turnarounds': 'lick', 'lk-bass-solo': 'lick', 'lk-motif': 'lick',
  'lk-implied': 'lick', 'sl-advanced': 'style', 'mm-schism': 'part', 'mm-cantstop': SONG, 'mm-hysteria': SONG, 'mm-duke': SONG,
  'mm-whatsgoingon': SONG,
  // Level 6
  'tech-tapping': 'pattern', 'sc-odd-groupings': 'pattern', 'sc-alternating-all-keys': P80('type'), 'sc-messiaen': 'type',
  'md-altered-chord-scale': 'prog', 'tri-major-thirds': 'quality', 'tri-cycle-all-inversions': 'quality', 'tri-diatonic-all-keys': P80('scale'),
  'tri-rudiments-all-keys': P80('rudiment'), 'arp-diatonic-all-keys': P80('scale'), 'hm-chordal-bass': 'voicing', 'lk-bebop': 'lick',
  'lk-modern': 'lick', 'mm-deantown': SONG, 'mm-yyz': 'part', 'mm-tommy': SONG, 'mm-teentown': SONG, 'mm-thump': SONG, 'mm-solo-piece': SONG,
};
