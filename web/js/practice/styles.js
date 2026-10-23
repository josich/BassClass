// Drum patterns for the Practice room, written for BassClass from the standard grooves of each genre, by
// genre. A pattern has its metre: `beats` per bar and the `beat` (q quarter, e 8th, dq dotted quarter),
// `grid` steps per beat (2 = 8ths, 3 = triplets, 4 = 16ths), its tempo and its usual subdivision `sub`,
// and one or two bars per piece. A step is "." (rest), "g" (ghost), "s" (soft), "x" (normal) or "X"
// (accent); "|" and spaces only help the eye.
//
// Each pattern is written at its fullest: the Subdivision buttons choose how much of it plays. A note
// that falls between the subdivision's notes is a fill: it plays only at a finer subdivision when it is
// a ghost ("g") or a stroke of the time-keeping hand (hi-hat, ride, shaker…); the defining notes (kick,
// backbeat, clave, bell…) always play. On a straight 16th pattern "triplets" swings it; on a triplet
// pattern "8ths" is the shuffle (the beat and the last triplet).
const VEL = { '.': 0, g: 0.2, s: 0.45, x: 0.72, X: 0.95 };
/** Pieces that keep time: their strokes between the subdivision's notes are fills. */
export const TIMEKEEP = new Set(['hhc', 'hhh', 'ride', 'bride', 'bhhc', 'shakd', 'shaku', 'cabasa', 'tamb', 'trim']);

// prettier-ignore
const RAW = [
  { key: 'rock', name: 'Rock', icon: '🎸', patterns: [
    { key: 'rock8', name: 'Straight 8ths', bpm: 110, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|....|X.x.|....', snare: '....|X...|....|X..g' },
    { key: 'rockride', name: 'Ride 8ths', bpm: 124, sub: 2,
      ride: 'Xgxg|xgxg|Xgxg|xgxg', hhp: '....|x...|....|x...', kick: 'X...|..x.|X...|..x.', snare: '....|X...|....|X...' },
    { key: 'rockhalf', name: 'Half-time', bpm: 140, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|....|....|..x.', snare: '....|...g|X...|....' },
    { key: 'punk', name: 'Punk (fast)', bpm: 180, sub: 2,
      hhc: 'X.x.|X.x.|X.x.|X.x.', kick: 'X...|X...|X...|X...', snare: '..X.|..X.|..X.|..X.' },
    { key: 'rockfloor', name: 'Four on the floor', bpm: 122, sub: 2,
      hhc: 'xg.g|xg.g|xg.g|xg.g', hho: '..x.|..x.|..x.|..x.', kick: 'X...|X...|X...|X...', snare: '....|X...|....|X...' },
    { key: 'rock16', name: 'Driving 16ths', bpm: 100, sub: 4,
      hhc: 'Xsxs|Xsxs|Xsxs|Xsxs', kick: 'X..x|..x.|X...|.x..', snare: '....|X...|....|X...' },
    { key: 'rocksync', name: 'Syncopated kick', bpm: 104, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X..x|..x.|..x.|....', snare: '....|X...|....|X..g' },
    { key: 'rocktoms', name: 'Floor-tom groove', bpm: 96, sub: 2,
      toml: 'X.xg|x.xg|X.xg|x.xg', kick: 'X...|..x.|....|x...', snare: '....|X...|....|X...' },
    { key: 'rockballad', name: 'Rock ballad', bpm: 68, sub: 2,
      hhc: 'xgsg|sgsg|xgsg|sgsg', kick: 'X...|....|X.x.|....', snare: '....|X...|....|X...' },
    { key: 'rockshuffle', name: 'Rock shuffle', grid: 3, bpm: 120, sub: 2,
      hhc: 'Xgx|xgx|Xgx|xgx', kick: 'X..|...|X.x|...', snare: '...|X..|...|X.g' },
  ] },
  { key: 'pop', name: 'Pop', icon: '🎤', patterns: [
    { key: 'pop8', name: 'Pop 8ths', bpm: 100, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|..x.|X.x.|....', snare: '....|X...|....|X...' },
    { key: 'pop16', name: 'Pop 16ths', bpm: 96, sub: 4,
      hhc: 'Xsxs|xsxs|Xsxs|xsxs', kick: 'X..x|..x.|X...|....', snare: '....|X...|....|X..g' },
    { key: 'dance', name: 'Dance (four on the floor)', bpm: 124, sub: 2,
      kick: 'X...|X...|X...|X...', snare: '....|X...|....|X...', hho: '..x.|..x.|..x.|..x.', shakd: 's.s.|s.s.|s.s.|s.s.', shaku: '.g.g|.g.g|.g.g|.g.g' },
    { key: 'disco', name: 'Disco', bpm: 116, sub: 2,
      hhc: 'xg.g|xg.g|xg.g|xg.g', hho: '..x.|..x.|..x.|..x.', kick: 'X...|X...|X...|X...', snare: '....|X...|....|X..g' },
    { key: 'pophalf', name: 'Half-time pop', bpm: 150, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|...x|..x.|....', snare: '....|....|X...|....' },
    { key: 'popballad', name: 'Ballad (cross-stick)', bpm: 72, sub: 2,
      hhc: 'xgsg|sgsg|xgsg|sgsg', kick: 'X...|....|X.x.|....', xstick: '....|x...|....|x...' },
    { key: 'indie', name: 'Indie (floor-tom 8ths)', bpm: 128, sub: 2,
      toml: 'x.x.|x.x.|x.x.|x.x.', kick: 'X...|..x.|X...|..x.', snare: '....|X...|....|X...' },
    { key: 'synthpop', name: 'Synth-pop (pulsing kick)', bpm: 118, sub: 4,
      hhc: '.gxg|.gxg|.gxg|.gxg', kick: 'X.x.|X.x.|X.x.|X.x.', snare: '....|X...|....|X...' },
    { key: 'poprock', name: 'Pop rock (ride bell)', bpm: 132, sub: 2,
      bell: 'x.x.|x.x.|x.x.|x.x.', kick: 'X...|..x.|X...|....', snare: '....|X...|....|X...' },
    { key: 'stomp', name: 'Stomp and clap', bpm: 96, sub: 2,
      kick: 'X.x.|....|X.x.|....', snare: '....|X...|....|X...', tamb: 'x.g.|x.g.|x.g.|x.g.' },
  ] },
  { key: 'funk', name: 'Funk', icon: '🕺', patterns: [
    { key: 'funk16', name: '16th funk', bpm: 96, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X..x|....|..X.|.x..', snare: '....|X..g|.g..|X...' },
    { key: 'funkopen', name: 'Open-hat funk', bpm: 100, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xg.g', hho: '....|....|....|..x.', kick: 'X...|..x.|X.x.|....', snare: '....|X.g.|...g|X...' },
    { key: 'funkghost', name: 'Ghost-note groove', bpm: 92, sub: 4,
      hhc: 'x.x.|x.x.|x.x.|x.x.', kick: 'X..x|...x|..x.|....', snare: '..g.|X.gg|.g.g|X..g' },
    { key: 'funkhalfshuffle', name: 'Half-time shuffle', grid: 3, bpm: 80, sub: 3,
      hhc: 'x.x|x.x|x.x|x.x', kick: 'X..|..x|...|..x', snare: '.g.|.g.|X..|.g.' },
    { key: 'funklinear', name: 'Linear funk', bpm: 94, sub: 4,
      hhc: '.gx.|.g.g|x.x.|.g.g', kick: 'X..x|..x.|.x.x|....', snare: '....|X...|....|X.g.' },
    { key: 'funkslow', name: 'Slow funk', bpm: 80, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|...x|..x.|....', snare: '....|X..g|..g.|X.g.' },
    { key: 'funkrock', name: 'Funk rock', bpm: 108, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X..x|..x.|X.x.|...x', snare: '....|X...|....|X...' },
    { key: 'funkdisco', name: 'Disco funk', bpm: 112, sub: 4,
      hhc: 'xg.g|xg.g|xg.g|xg.g', hho: '..x.|..x.|..x.|..x.', kick: 'X...|X...|X...|X...', snare: '....|X..g|....|X...' },
    { key: 'funkdisplaced', name: 'Displaced backbeat', bpm: 96, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X..x|....|X...|..x.', snare: '....|X...|.g..|.X..' },
    { key: 'funkbreak', name: 'Funk break (2 bars)', bpm: 98, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg|xgxg|xgxg|xgxg|xg.g', hho: '....|....|....|....|....|....|....|..x.',
      kick: 'X.x.|....|..X.|....|X.x.|....|..X.|.x..', snare: '....|X..g|.g..|X..g|....|X..g|.g..|X...' },
  ] },
  { key: 'soul', name: 'Soul & R&B', icon: '🎙', patterns: [
    { key: 'motown', name: 'Motown (four snares)', bpm: 112, sub: 2,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|..x.|X...|..x.', snare: 'X...|X...|X...|X...', tamb: '....|x...|....|x...' },
    { key: 'stax', name: 'Memphis soul', bpm: 100, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|..x.|X..x|....', snare: '....|X...|....|X...' },
    { key: 'soulballad', name: '12/8 soul ballad', meter: '12/8', beat: 'dq', grid: 3, bpm: 60, sub: 3,
      hhc: 'xss|xss|xss|xss', kick: 'X..|..x|X..|...', snare: '...|X..|...|X..' },
    { key: 'gospelshuffle', name: 'Gospel shuffle', grid: 3, bpm: 104, sub: 3,
      hhc: 'xgx|xgx|xgx|xgx', kick: 'X..|..x|X..|..x', snare: '.g.|Xg.|.g.|Xg.' },
    { key: 'boombap', name: 'Hip-hop (boom bap)', bpm: 90, sub: 2,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X..x|..x.|..X.|....', snare: '....|X...|....|X...' },
    { key: 'trap', name: 'Trap (half-time)', bpm: 140, sub: 4,
      hhc: 'xsxs|xsxs|xsxs|xsxs', kick: 'X...|...x|....|.x..', snare: '....|....|X...|....' },
    { key: 'rnbballad', name: 'R&B ballad', bpm: 66, sub: 4,
      hhc: 'xgsg|xgsg|xgsg|xgsg', kick: 'X...|...x|..x.|....', xstick: '....|X...|....|X...' },
    { key: 'phillysoul', name: 'Philly soul', bpm: 108, sub: 2,
      hhc: 'xg.g|xg.g|xg.g|xg.g', hho: '..x.|..x.|..x.|..x.', kick: 'X...|X...|X...|X...', snare: '....|X...|....|X...', tamb: 'g.g.|x.g.|g.g.|x.g.' },
    { key: 'neosoul', name: 'Neo-soul (laid back)', grid: 3, bpm: 84, sub: 3,
      hhc: 'xgx|xgx|xgx|xgx', kick: 'X..|.x.|..x|...', snare: '...|X..|...|X.g' },
    { key: 'uptownsoul', name: 'Soul (16th tambourine)', bpm: 104, sub: 4,
      tamb: 'xgsg|xgsg|xgsg|xgsg', kick: 'X..x|..x.|X..x|....', snare: '....|X...|....|X...' },
  ] },
  { key: 'blues', name: 'Blues', icon: '🎷', patterns: [
    { key: 'texasshuffle', name: 'Texas shuffle', grid: 3, bpm: 120, sub: 2,
      hhc: 'Xgx|xgx|Xgx|xgx', kick: 'x..|x..|x..|x..', snare: '...|X..|...|X.g' },
    { key: 'chicagoshuffle', name: 'Chicago shuffle (ride)', grid: 3, bpm: 110, sub: 2,
      ride: 'Xgx|xgx|Xgx|xgx', hhp: '...|x..|...|x..', kick: 'X..|...|X..|...', snare: '...|X..|...|X..' },
    { key: 'slowblues', name: '12/8 slow blues', meter: '12/8', beat: 'dq', grid: 3, bpm: 58, sub: 3,
      hhc: 'xss|xss|xss|xss', kick: 'X..|...|X.x|...', snare: '...|X..|...|X..' },
    { key: 'doubleshuffle', name: 'Double shuffle', grid: 3, bpm: 126, sub: 2,
      hhc: 'X.x|x.x|X.x|x.x', kick: 'X..|...|X..|...', snare: '..g|X.g|..g|X.g' },
    { key: 'boogie', name: 'Boogie (straight 8ths)', bpm: 132, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|X...|X...|X...', snare: '....|X...|....|X...' },
    { key: 'jumpblues', name: 'Jump blues', grid: 3, bpm: 160, sub: 2,
      ride: 'x..|x.x|x..|x.x', hhp: '...|x..|...|x..', kick: 's..|s..|s..|s..', snare: '...|X..|...|X..' },
    { key: 'bluesrock', name: 'Blues rock', bpm: 112, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg', kick: 'X...|..x.|X.x.|..x.', snare: '....|X...|....|X...' },
    { key: 'halfshuffle', name: 'Half-time blues shuffle', grid: 3, bpm: 76, sub: 3,
      hhc: 'xgx|xgx|xgx|xgx', kick: 'X..|...|..x|...', snare: '...|.g.|X..|.g.' },
    { key: 'hambone', name: 'Hambone (Bo Diddley beat)', bpm: 112, sub: 4,
      toml: 'X..x|..x.|..x.|x...', kick: 'X...|....|X...|....', shakd: 's.s.|s.s.|s.s.|s.s.', shaku: '.g.g|.g.g|.g.g|.g.g' },
    { key: 'minorblues', name: '12/8 minor blues (ride)', meter: '12/8', beat: 'dq', grid: 3, bpm: 52, sub: 3,
      ride: 'xss|xss|xss|xss', kick: 'X..|...|X..|..s', xstick: '...|x..|...|x..' },
  ] },
  { key: 'jazz', name: 'Jazz', icon: '🎺', patterns: [
    { key: 'swing', name: 'Medium swing', grid: 3, bpm: 140, sub: 3,
      ride: 'x..|X.x|x..|X.x', hhp: '...|x..|...|x..', kick: 'g..|g..|g..|g..', snare: '...|...|..g|...' },
    { key: 'brushswing', name: 'Brushes swing', grid: 3, bpm: 120, sub: 3,
      bstir: 'x..|...|x..|...', bsnare: '...|x..|...|x.g', bhhp: '...|x..|...|x..', bkick: 'g..|...|g..|...' },
    { key: 'upswing', name: 'Up-tempo swing', grid: 3, bpm: 240, sub: 2,
      ride: 'x..|x.x|x..|x.x', hhp: '...|x..|...|x..', kick: 'g..|...|g..|...' },
    { key: 'twofeel', name: 'Two-feel', grid: 3, bpm: 120, sub: 3,
      ride: 'x..|X.x|x..|X.x', hhp: '...|x..|...|x..', kick: 'x..|...|x..|...' },
    { key: 'jazzwaltz', name: 'Jazz waltz', meter: '3/4', beats: 3, grid: 3, bpm: 150, sub: 3,
      ride: 'x..|x.x|x.x', hhp: '...|x..|...', kick: 'x..|...|...', snare: '...|...|..g' },
    { key: 'brushballad', name: 'Brushes ballad', grid: 3, bpm: 60, sub: 3,
      bstir: 'x..|...|x..|...', bsnare: '...|s..|...|s..', bhhp: '...|x..|...|x..' },
    { key: 'bebop', name: 'Bebop (dropping bombs, 2 bars)', grid: 3, bpm: 200, sub: 2,
      ride: 'x..|x.x|x..|x.x|x..|x.x|x..|x.x', hhp: '...|x..|...|x..|...|x..|...|x..',
      snare: '...|..g|...|...|..g|...|...|g..', kick: '...|...|..x|...|...|...|...|...' },
    { key: 'jazzfunk', name: 'Jazz funk', bpm: 104, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X..x|..x.|..x.|....', snare: '....|X.g.|..g.|X...' },
    { key: 'jazzfive', name: '5/4 swing (3 + 2)', meter: '5/4', beats: 5, grid: 3, bpm: 170, sub: 3,
      ride: 'X..|x.x|x.x|X..|x.x', hhp: '...|x..|...|...|x..', kick: 'x..|...|...|x..|...', snare: '...|...|..g|...|..g' },
    { key: 'jazzshuffle', name: 'Jazz shuffle', grid: 3, bpm: 132, sub: 3,
      ride: 'Xgx|xgx|Xgx|xgx', hhp: '...|x..|...|x..', kick: 'x..|...|x..|...', snare: '...|X..|...|X..' },
  ] },
  { key: 'latin', name: 'Latin', icon: '🪇', patterns: [
    { key: 'bossa', name: 'Bossa nova (2 bars)', bpm: 120, sub: 2,
      hhc: 'sgsg|sgsg|sgsg|sgsg|sgsg|sgsg|sgsg|sgsg', kick: 'X...|..x.|X...|..x.|X...|..x.|X...|..x.',
      xstick: 'X...|..X.|....|X...|....|X...|..X.|....' },
    { key: 'samba', name: 'Samba', bpm: 100, sub: 4,
      kick: 'x..s|X..s|x..s|X..s', hhp: '..x.|..x.|..x.|..x.', shakd: 'x.x.|x.x.|x.x.|x.x.', shaku: '.g.g|.g.g|.g.g|.g.g' },
    { key: 'baiao', name: 'Baião', bpm: 100, sub: 4,
      kick: 'X..x|..x.|X..x|..x.', trim: 'xg.g|xg.g|xg.g|xg.g', tri: '..x.|..x.|..x.|..x.' },
    { key: 'chacha', name: 'Cha-cha-chá', bpm: 116, sub: 2,
      guirol: 'X...|....|X...|....', guiro: '....|x.x.|....|x.x.', cowbell: 'X...|x...|X...|x...',
      congam: 'x...|x...|x...|....', conga: '....|....|....|x.x.' },
    { key: 'mambo', name: 'Mambo (2-3 son clave, 2 bars)', bpm: 190, sub: 2,
      claves: '....|x...|x...|....|x...|..x.|....|x...', cowbell: 'X...|x.x.|X...|x.x.|X...|x.x.|X...|x.x.',
      congam: 'x.g.|X.g.|x.g.|....|x.g.|X.g.|x.g.|....', conga: '....|....|....|x.x.|....|....|....|x.x.', kick: '....|....|....|x...|....|....|....|x...' },
    { key: 'cumbia', name: 'Cumbia', bpm: 92, sub: 2,
      guiro: 'x.xx|x.xx|x.xx|x.xx', kick: 'X...|....|X...|....', conga: '..x.|..x.|..x.|..x.', xstick: '....|x...|....|x...' },
    { key: 'rumba', name: 'Rumba (3-2 rumba clave, 2 bars)', bpm: 104, sub: 2,
      claves: 'x...|..x.|....|..x.|....|x...|x...|....', congam: 'x.g.|X.g.|x.g.|....|x.g.|X.g.|x.g.|....',
      conga: '....|....|....|x.x.|....|....|....|x.x.', tumba: '....|....|....|....|....|....|....|..x.', kick: '....|....|....|s...|....|....|....|s...' },
    { key: 'afro68', name: 'Afro-Cuban 6/8 (bembé)', meter: '12/8', beat: 'dq', grid: 3, bpm: 100, sub: 3,
      cowbell: 'x.x|.xx|.x.|x.x', shakd: 'x.s|x.s|x.s|x.s', conga: '...|...|...|xx.', tumba: '...|...|x..|...', kick: 'x..|...|x..|...' },
    { key: 'habanera', name: 'Habanera (tango)', bpm: 80, sub: 2,
      toml: 'X..x|x.x.|X..x|x.x.', kick: 'X...|....|X...|....', xstick: '....|x...|....|x...' },
    { key: 'latinrock', name: 'Latin rock', bpm: 112, sub: 2,
      cowbell: 'x.x.|X.x.|x.x.|X.x.', kick: 'X..x|..x.|X..x|..x.', snare: '....|X...|....|X...', conga: '..x.|..x.|..x.|..x.' },
  ] },
  { key: 'reggae', name: 'Reggae & Caribbean', icon: '🌴', patterns: [
    { key: 'onedrop', name: 'One drop', grid: 3, bpm: 76, sub: 2,
      hhc: 'sgx|sgx|sgx|sgx', kick: '...|...|X..|...', xstick: '...|...|X..|...' },
    { key: 'rockers', name: 'Rockers', bpm: 80, sub: 2,
      hhc: 'sgxg|sgxg|sgxg|sgxg', kick: 'X...|....|X...|....', xstick: '....|....|X...|....' },
    { key: 'steppers', name: 'Steppers', bpm: 80, sub: 2,
      hhc: 'sgxg|sgxg|sgxg|sgxg', kick: 'X...|X...|X...|X...', xstick: '....|....|X...|....' },
    { key: 'rocksteady', name: 'Rocksteady', bpm: 76, sub: 2,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: '....|....|X...|....', snare: '....|....|X...|....' },
    { key: 'ska', name: 'Ska', bpm: 160, sub: 2,
      hhc: '..x.|..x.|..x.|..x.', hhp: 'x...|x...|x...|x...', kick: 'X...|....|X...|....', snare: '....|X...|....|X...' },
    { key: 'dancehall', name: 'Dancehall', bpm: 96, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X..x|..x.|X..x|..x.', snare: '....|X...|....|X...' },
    { key: 'reggaeton', name: 'Reggaeton (dembow)', bpm: 94, sub: 4,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|X...|X...|X...', snare: '...x|..x.|...x|..x.' },
    { key: 'calypso', name: 'Calypso', bpm: 112, sub: 2,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|..X.|X...|..X.', snare: '....|X..x|....|X...', cowbell: 'x...|x...|x...|x...' },
    { key: 'soca', name: 'Soca', bpm: 128, sub: 2,
      hho: '..x.|..x.|..x.|..x.', kick: 'X...|X...|X...|X...', snare: '....|..X.|....|..X.', cowbell: 'x...|x...|x...|x...' },
  ] },
  { key: 'country', name: 'Country & Folk', icon: '🤠', patterns: [
    { key: 'train', name: 'Train beat', bpm: 120, sub: 4,
      snare: 'sgsg|Xgsg|sgsg|Xgsg', kick: 'X...|....|X...|....' },
    { key: 'twostep', name: 'Two-step', bpm: 112, sub: 2,
      hhc: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|....|X...|....', xstick: '....|x...|....|x...' },
    { key: 'countryshuffle', name: 'Country shuffle', grid: 3, bpm: 118, sub: 2,
      hhc: 'xgx|xgx|xgx|xgx', kick: 'X..|...|X..|...', xstick: '...|x..|...|x..' },
    { key: 'bluegrass', name: 'Bluegrass (brushes)', bpm: 150, sub: 2,
      bkick: 'X...|....|X...|....', bsnare: '....|x...|....|x...', bhhc: 'x.x.|x.x.|x.x.|x.x.' },
    { key: 'waltz', name: 'Waltz', meter: '3/4', beats: 3, bpm: 120, sub: 2,
      hhc: 'xgxg|xgxg|xgxg', kick: 'X...|....|....', snare: '....|x...|x...' },
    { key: 'folk68', name: 'Folk 6/8', meter: '6/8', beats: 2, beat: 'dq', grid: 3, bpm: 70, sub: 3,
      hhc: 'xss|xss', kick: 'X..|...', snare: '...|X..' },
    { key: 'jig', name: 'Jig (6/8 frame drum)', meter: '6/8', beats: 2, beat: 'dq', grid: 3, bpm: 116, sub: 3,
      toml: 'Xss|xss', tomh: '..g|..g' },
    { key: 'polka', name: 'Polka', meter: '2/4', beats: 2, bpm: 120, sub: 2,
      kick: 'X...|X...', snare: '..x.|..x.' },
    { key: 'folkrock', name: 'Folk rock (tambourine)', bpm: 104, sub: 2,
      tamb: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|..x.|X...|....', snare: '....|X...|....|X...' },
    { key: 'countryrock', name: 'Country rock (ride)', bpm: 128, sub: 2,
      ride: 'xgxg|xgxg|xgxg|xgxg', kick: 'X...|..x.|X.x.|....', snare: '....|X...|....|X...' },
  ] },
  { key: 'odd', name: 'Odd metres', icon: '🔢', patterns: [
    { key: 'five32', name: '5/4 (3 + 2)', meter: '5/4', beats: 5, bpm: 120, sub: 2,
      hhc: 'Xgxg|xgxg|xgxg|Xgxg|xgxg', kick: 'X...|....|..x.|X...|....', snare: '....|....|X...|....|X...' },
    { key: 'five23', name: '5/4 (2 + 3)', meter: '5/4', beats: 5, bpm: 120, sub: 2,
      hhc: 'Xgxg|xgxg|Xgxg|xgxg|xgxg', kick: 'X...|....|X...|..x.|....', snare: '....|X...|....|....|X...' },
    { key: 'five8', name: '5/8 (3 + 2)', meter: '5/8', beats: 5, beat: 'e', grid: 2, bpm: 220, sub: 1,
      hhc: 'Xg|xg|xg|Xg|xg', kick: 'X.|..|..|..|..', snare: '..|..|..|X.|..' },
    { key: 'seven223', name: '7/8 (2 + 2 + 3)', meter: '7/8', beats: 7, beat: 'e', grid: 2, bpm: 220, sub: 1,
      hhc: 'Xg|xg|Xg|xg|Xg|xg|xg', kick: 'X.|..|..|..|X.|..|..', snare: '..|..|X.|..|..|X.|..' },
    { key: 'seven322', name: '7/8 (3 + 2 + 2)', meter: '7/8', beats: 7, beat: 'e', grid: 2, bpm: 220, sub: 1,
      hhc: 'Xg|xg|xg|Xg|xg|Xg|xg', kick: 'X.|..|..|..|..|x.|..', snare: '..|..|..|X.|..|..|X.' },
    { key: 'sevenfour', name: '7/4 (4 + 3)', meter: '7/4', beats: 7, bpm: 110, sub: 2,
      hhc: 'Xgxg|xgxg|xgxg|xgxg|Xgxg|xgxg|xgxg', kick: 'X...|....|X.x.|....|X...|....|..x.', snare: '....|X...|....|X...|....|X...|....' },
    { key: 'nine8', name: '9/8 (2 + 2 + 2 + 3)', meter: '9/8', beats: 9, beat: 'e', grid: 2, bpm: 260, sub: 1,
      hhc: 'Xg|xg|Xg|xg|Xg|xg|Xg|xg|xg', kick: 'X.|..|..|..|X.|..|..|..|..', snare: '..|..|X.|..|..|..|X.|..|..' },
    { key: 'eleven8', name: '11/8 (2 + 2 + 3 + 2 + 2)', meter: '11/8', beats: 11, beat: 'e', grid: 2, bpm: 240, sub: 1,
      hhc: 'Xg|xg|Xg|xg|Xg|xg|xg|Xg|xg|Xg|xg', kick: 'X.|..|..|..|X.|..|..|..|..|..|..', snare: '..|..|X.|..|..|..|..|X.|..|X.|..' },
    { key: 'six8rock', name: '6/8 rock', meter: '6/8', beats: 2, beat: 'dq', grid: 3, bpm: 72, sub: 3,
      hhc: 'xss|xss', kick: 'X..|..x', snare: '...|X..' },
    { key: 'threefour', name: '3/4 rock', meter: '3/4', beats: 3, bpm: 120, sub: 2,
      hhc: 'Xgxg|xgxg|xgxg', kick: 'X...|..x.|....', snare: '....|....|X...' },
  ] },
];

const META = new Set(['key', 'name', 'meter', 'beats', 'beat', 'grid', 'bpm', 'sub']);

/** The subdivisions a pattern offers: notes per beat; 3 on a 16th pattern swings it, 2 on a triplet one is the shuffle. */
export function levelsOf(s) {
  if (s.beat === 'e') return [1, 2];
  if (s.beat === 'dq') return s.grid === 6 ? [1, 3, 6] : [1, 3];
  return s.grid === 3 ? [1, 2, 3] : [1, 2, 3, 4];
}

/** Where in its beat (0–1) step `j` of `piece` plays at subdivision `L`, or null when it is a fill left out. */
export function stepTime(s, L, j, piece, v) {
  const fill = TIMEKEEP.has(piece) || v <= VEL.g;
  if (s.grid === 4 && L === 3) return [0, 1 / 3, 2 / 3, fill ? null : 2 / 3][j];   // swung: 16ths on the triplet grid
  const on = s.grid === 3 && L === 2 ? j !== 1 : (j * L) % s.grid === 0;
  return on || !fill ? j / s.grid : null;
}

/** The metronome's clicks in a beat (0–1) at subdivision `L` (`s`: the drum pattern, or none). */
export function clickTimes(s, L) {
  if (s?.grid === 4 && L === 3) return [0, 1 / 3, 2 / 3];
  if (s?.grid === 3 && L === 2) return [0, 2 / 3];
  return Array.from({ length: L }, (_, k) => k / L);
}

export const GENRES = RAW.map((g) => ({ key: g.key, name: g.name, icon: g.icon, styles: [] }));
/** Every pattern by key, with its tracks as velocity arrays; a track that is not whole bars throws. */
export const STYLES = {};
RAW.forEach((g, gi) => g.patterns.forEach((p) => {
  const s = { genre: g.key, meter: '4/4', beats: 4, beat: 'q', grid: 4, ...Object.fromEntries(Object.entries(p).filter(([k]) => META.has(k))) };
  const per = s.beats * s.grid;
  s.tracks = {};
  s.bars = 1;
  for (const [piece, str] of Object.entries(p)) {
    if (META.has(piece)) continue;
    const steps = str.replace(/[|\s]/g, '');
    if (!steps.length || steps.length % per || /[^.gsxX]/.test(steps)) throw new Error(`drum pattern ${p.key}: ${piece} is not whole bars of ${per} steps`);
    s.tracks[piece] = [...steps].map((c) => VEL[c]);
    s.bars = Math.max(s.bars, steps.length / per);
  }
  for (const t of Object.values(s.tracks)) if (s.bars % (t.length / per)) throw new Error(`drum pattern ${p.key}: tracks of 1 and ${s.bars} bars only`);
  if (!levelsOf(s).includes(s.sub)) throw new Error(`drum pattern ${p.key}: subdivision ${s.sub} is not offered`);
  if (STYLES[s.key]) throw new Error(`drum pattern ${p.key} twice`);
  STYLES[s.key] = s;
  GENRES[gi].styles.push(s);
}));
