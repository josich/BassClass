// Drum loops for the Practice room, written for BassClass. Each style has its beats per bar, the steps
// each beat is cut into (`unit`: 2 = 8ths, 3 = triplets, 4 = 16ths) and one or two bars of each piece.
// A step is "." (rest), "g" (ghost), "s" (soft), "x" (normal) or "X" (accent). Swing and shuffle
// feels are written on the triplet grid. Pieces: see web/js/drums.js.
const VEL = { '.': 0, g: 0.2, s: 0.45, x: 0.72, X: 0.95 };

const RAW = {
  rock: {
    name: 'Rock', meter: '4/4', beats: 4, unit: 2,
    hhc: 'XxXxXxXx',
    kick: 'X...Xx..',
    snare: '..X...X.',
  },
  pop: {
    name: 'Pop', meter: '4/4', beats: 4, unit: 4,
    hhc: 'XsxsXsxsXsxsXsxs',
    kick: 'X.....x.X.......',
    snare: '....X.......X...',
  },
  funk: {
    name: 'Funk', meter: '4/4', beats: 4, unit: 4,
    hhc: 'xsxsxsxsxsxsxs.s',
    hho: '..............x.',
    kick: 'X..x......X..x..',
    snare: '....X..g.g..X..g',
  },
  disco: {
    name: 'Disco', meter: '4/4', beats: 4, unit: 2,
    hhc: 'x.x.x.x.',
    hho: '.x.x.x.x',
    kick: 'X.X.X.X.',
    snare: '..X...X.',
  },
  shuffle: {
    name: 'Shuffle', meter: '4/4', beats: 4, unit: 3,
    hhc: 'X.xX.xX.xX.x',
    kick: 'X.....X.....',
    snare: '...X.....X..',
  },
  swing: {
    name: 'Swing', meter: '4/4', beats: 4, unit: 3,
    ride: 'x..X.xx..X.x',
    hhp: '...x.....x..',
    kick: 'g..g..g..g..',
    snare: '.......g....',
  },
  bossa: {
    name: 'Bossa nova', meter: '4/4', beats: 4, unit: 4,
    xstick: 'x..x..x...x..x..',
    kick: 'X..sX..sX..sX..s',
    hhc: 's.x.s.x.s.x.s.x.',
    shakd: 'x...x...x...x...',
    shaku: '..s...s...s...s.',
  },
  reggae: {
    name: 'Reggae one-drop', meter: '4/4', beats: 4, unit: 3,
    hhc: 'x.sx.sx.sx.s',
    xstick: '......X.....',
    kick: '......X.....',
  },
  blues128: {
    name: '12/8 blues', meter: '12/8', beats: 4, unit: 3,
    ride: 'XssXssXssXss',
    kick: 'X.....X.....',
    snare: '...X.....X..',
  },
  odd5: {
    name: '5/4 (3 + 2)', meter: '5/4', beats: 5, unit: 2,
    hhc: 'XxXxXxXxXx',
    kick: 'X.....X...',
    snare: '....X...X.',
  },
  odd7: {
    name: '7/8 (2 + 2 + 3)', meter: '7/8', beats: 7, unit: 1,
    hhc: 'XxXxXxx',
    kick: 'X...x..',
    snare: '..X..X.',
  },
};

/** Styles with their tracks as velocity arrays; a track's length must be whole bars (else it throws). */
export const STYLES = Object.fromEntries(Object.entries(RAW).map(([key, s]) => {
  const per = s.beats * s.unit;
  const tracks = {};
  let bars = 1;
  for (const [piece, str] of Object.entries(s)) {
    if (['name', 'meter', 'beats', 'unit'].includes(piece)) continue;
    if (str.length % per) throw new Error(`drum style ${key}: ${piece} is not whole bars`);
    tracks[piece] = [...str].map((c) => VEL[c]);
    bars = Math.max(bars, str.length / per);
  }
  return [key, { key, name: s.name, meter: s.meter, beats: s.beats, unit: s.unit, bars, tracks }];
}));
