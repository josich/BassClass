// Grooves & bass lines, walking bass and slap: applying everything musically.
import { T, Builder, keysFor, ex, sel, keyP, progChords, progP, PROGS, chordRootMidis, grooveLine, walkLine } from './common.js';

// ---------------------------------------------------------------- grooves
const G = 'grooves';
const e8 = (tok, n = 8) => Array.from({ length: n }, () => [tok, 0.5]);
const swing = (bar) => bar.map(([t, d, tag], i) => [t, d === 0.5 ? (i % 2 ? 1 / 3 : 2 / 3) : d, tag]);

const GROOVES = {
  rock8: { name: 'Rock 8ths', bars: [e8('R')] },
  pop8: { name: 'Pop 8ths with approach', bars: [[...e8('R', 6), ['5', 0.5], ['A', 0.5]]] },
  rootFifth: { name: 'Root–5th two-beat (country)', bars: [[['R', 2], ['5_', 2]]] },
  r585: { name: 'R-5-8-5 quarters', bars: [[['R', 1], ['5', 1], ['8', 1], ['5', 1]]] },
  octaves: { name: 'Disco octaves', bars: [[['R', 0.5], ['8', 0.5], ['R', 0.5], ['8', 0.5], ['R', 0.5], ['8', 0.5], ['R', 0.5], ['8', 0.5]]] },
  r5b7: { name: 'R-5-♭7-8 (blues rock)', bars: [[['R', 1], ['5', 1], ['b7', 1], ['8', 1]]] },
  boogie: { name: 'Boogie-woogie (R-3-5-6-♭7-6-5-3)', bars: [[['R', 0.5], ['3', 0.5], ['5', 0.5], ['6', 0.5], ['b7', 0.5], ['6', 0.5], ['5', 0.5], ['3', 0.5]]] },
  shuffle: { name: 'Shuffle (R-R-5-5-6-6-5-5)', bars: [swing([['R', 0.5], ['R', 0.5], ['5', 0.5], ['5', 0.5], ['6', 0.5], ['6', 0.5], ['5', 0.5], ['5', 0.5]])] },
  boogieSwing: { name: 'Swung boogie', bars: [swing([['R', 0.5], ['3', 0.5], ['5', 0.5], ['6', 0.5], ['b7', 0.5], ['6', 0.5], ['5', 0.5], ['3', 0.5]])] },
  approach: { name: 'Chromatic approach on beat 4', bars: [[['R', 1], ['R', 1], ['5', 1], ['A', 1]]] },
  fifthApproach: { name: '5th (dominant) approach on beat 4', bars: [[['R', 1], ['R', 1], ['8', 1], ['D', 1]]] },
  motown: { name: 'Motown (dotted root, octave, approach)', bars: [[['R', 1.5], ['R', 0.5], ['8', 1], ['A', 1]]] },
  reggae: { name: 'Reggae one-drop (beat 1 empty)', bars: [[['-', 1], ['R', 1], ['-', 0.5], ['5', 0.5], ['8', 0.5], ['5', 0.5]]] },
  bossa: { name: 'Bossa nova (R-5 dotted)', bars: [[['R', 1.5], ['5_', 0.5], ['5_', 1.5], ['R', 0.5]]] },
  tumbao: { name: 'Latin tumbao (anticipated)', bars: [[['-', 1.5], ['5', 1.5], ['N', 1]]] },
  funk16: { name: 'Funk 16ths with ghost notes', bars: [[['R', 0.25], ['x', 0.25], ['x', 0.25], ['R', 0.25], ['-', 0.25], ['x', 0.25], ['b7', 0.25], ['8', 0.25], ['R', 0.25], ['x', 0.25], ['5', 0.25], ['x', 0.25], ['b7', 0.25], ['x', 0.25], ['8', 0.25], ['x', 0.25]]] },
  countryTwo: { name: 'Country two-beat (R–5 half notes, pickup into the next chord)', bars: [[['R', 2], ['5_', 2]], [['R', 2], ['5_', 1], ['A', 1]]] },
  samba: { name: 'Samba (R–5 with the anticipated 16th)', bars: [[['R', 0.75], ['5_', 0.25], ['5_', 0.75], ['R', 0.25], ['R', 0.75], ['5_', 0.25], ['5_', 0.75], ['N', 0.25]]] },
  secondLine: { name: 'New Orleans second line', bars: [[['R', 0.5], ['-', 0.25], ['R', 0.25], ['3', 0.5], ['5', 0.5], ['6', 0.5], ['5', 0.25], ['3', 0.25], ['R', 0.5], ['5_', 0.5]]] },
  afrobeat: { name: 'Afrobeat (syncopated R–♭7–8)', bars: [[['R', 0.75], ['R', 0.25], ['-', 0.5], ['b7', 0.5], ['8', 0.5], ['-', 0.25], ['5', 0.25], ['b7', 0.5], ['R', 0.5]]] },
  neoSoul: { name: 'Neo-soul (laid back, ghost notes)', bars: [[['R', 1], ['x', 0.25], ['5', 0.25], ['-', 0.5], ['7', 0.75], ['8', 0.25], ['-', 0.5], ['5', 0.5]]] },
  soulBallad: { name: 'Soul ballad (long roots, passing tones)', bars: [[['R', 2], ['3', 1], ['A', 1]]] },
  pickDown: { name: 'Pick: down-strokes only (punk 8ths)', bars: [e8('R').map(([t, d]) => [t, d, '↓'])] },
  pickAlt: { name: 'Pick: alternate picking (↓ ↑) with the 5th', bars: [[['R', 0.5, '↓'], ['R', 0.5, '↑'], ['R', 0.5, '↓'], ['R', 0.5, '↑'], ['5', 0.5, '↓'], ['5', 0.5, '↑'], ['8', 0.5, '↓'], ['5', 0.5, '↑']]] },
  gallop: { name: 'Pick: the metal gallop (8th + two 16ths)', bars: [[['R', 0.5, '↓'], ['R', 0.25, '↓'], ['R', 0.25, '↑'], ['R', 0.5, '↓'], ['R', 0.25, '↓'], ['R', 0.25, '↑'], ['R', 0.5, '↓'], ['R', 0.25, '↓'], ['R', 0.25, '↑'], ['5', 0.5, '↓'], ['8', 0.25, '↓'], ['5', 0.25, '↑']]] },
  funkOct: { name: 'Octave funk 16ths', bars: [[['R', 0.25], ['x', 0.25], ['8', 0.25], ['x', 0.25], ['x', 0.25], ['R', 0.25], ['8', 0.25], ['x', 0.25], ['R', 0.25], ['x', 0.25], ['8', 0.25], ['b7', 0.25], ['x', 0.25], ['8', 0.25], ['R', 0.25], ['x', 0.25]]] },
  fill: {
    name: '3 bars groove + pentatonic fill',
    bars: [e8('R'), e8('R'), [['R', 0.5], ['R', 0.5], ['5', 0.5], ['8', 0.5], ['R', 0.5], ['R', 0.5], ['5', 0.5], ['8', 0.5]],
      [['R', 1], ['-', 0.5], ['R', 0.25], ['b3', 0.25], ['4', 0.25], ['5', 0.25], ['b7', 0.25], ['8', 0.25], ['b7', 0.25], ['5', 0.25], ['4', 0.25], ['b3', 0.25]]],
  },
  riff: { name: 'Minor pentatonic riff (transpose it)', bars: [[['R', 0.5], ['R', 0.5], ['b3', 0.5], ['R', 0.5], ['4', 0.5], ['5', 0.5], ['b7', 0.5], ['8', 0.5]]] },
  slowBlues: { name: '12/8 slow blues (triplets)', bars: [[['R', 2 / 3], ['R', 1 / 3], ['3', 2 / 3], ['5', 1 / 3], ['6', 2 / 3], ['5', 1 / 3], ['b7', 2 / 3], ['6', 1 / 3]]] },
};

const STYLE_PROGS = {
  rock8: 'I-V-vi-IV', pop8: 'I-vi-IV-V', rootFifth: 'I-IV-V-I', r585: 'I-vi-IV-V', octaves: 'vi-IV-I-V', r5b7: 'blues', boogie: 'blues', shuffle: 'blues',
  boogieSwing: 'blues-quick', approach: 'I-vi-IV-V', fifthApproach: 'I-vi-ii-V', motown: 'I-vi-IV-V', reggae: 'I-IV-V-I', bossa: 'ii-V-I', tumbao: 'ii-V-I',
  funk16: 'vamp-dom', funkOct: 'vamp-min', fill: 'vamp-min', riff: 'i-iv-v-min', slowBlues: 'blues',
  countryTwo: 'I-IV-V-I', samba: 'ii-V-I', secondLine: 'blues', afrobeat: 'vamp-min', neoSoul: 'I-vi-ii-V', soulBallad: 'I-vi-IV-V',
  pickDown: 'I-V-vi-IV', pickAlt: 'I-IV-V-I', gallop: 'i-bVI-bIII-bVII',
};

function grooveEx(id, level, styleKeys, def, meta) {
  return ex({
    id, module: G, level,
    params: {
      style: sel('Groove', styleKeys.map((k) => [k, GROOVES[k].name]), def),
      prog: sel('Progression', [['auto', 'The style\'s usual progression'], ...[...new Set(Object.values(STYLE_PROGS))].map((k) => [k, PROGS[k].name])], 'auto'),
      key: keyP(['1', '3', '5'], { def: '9' }),
    },
    sub: 1, label: 'degree',
    build(p, ctx, S) {
      const b = new Builder(ctx, S, { jazz: true });
      const progKey = p.prog === 'auto' ? STYLE_PROGS[p.style] : p.prog;
      for (const k of keysFor(p.key)) {
        const chords = progChords(progKey, k, { S });
        grooveLine(b, chords, chordRootMidis(chords), GROOVES[p.style].bars, { place: { open: 'allow' } });
      }
      return b.build({ uniform: false, label: 'degree' });
    },
    ...meta,
  });
}

const roots = grooveEx('gr-roots', 1, ['rock8', 'pop8', 'rootFifth', 'r585'], 'rock8', {
  title: 'Root-note grooves: rock 8ths, root–5th, R-5-8',
  summary: 'The first job of a bass player: lock the roots with the drums.',
  about: 'Most bass lines start with the root of each chord. Play driving 8ths (rock), the country two-beat (root and the 5th below), or the R-5-8-5 pattern through real progressions. Focus on time, tone and note length: this is what makes a band sound good.',
  tips: ['Play every note the same length and volume.', 'Lock with an imaginary kick drum: beats 1 and 3.'],
  source: 'StudyBass common patterns; Hal Leonard; Ed Friedland; RSL Group C', bpm: 100,
});

const blues = grooveEx('gr-blues', 2, ['boogie', 'shuffle', 'boogieSwing', 'r5b7', 'slowBlues'], 'boogie', {
  title: 'Blues lines: boogie-woogie & shuffle',
  summary: 'R-3-5-6-♭7-6-5-3 and R-R-5-5-6-6-5-5 over the 12-bar blues.',
  about: 'Two of the most played bass lines in history. The boogie-woogie walks up and down the dominant 7th chord with the 6th, the shuffle rocks between root, 5th and 6th with a swing feel. Learn them over the 12-bar form in every key and you can join any blues jam.',
  tips: ['Swing the 8ths: long-short.', 'Same shape for I, IV and V: just move it.'],
  source: 'StudyBass (boogie-woogie, 12-bar ladder); RSL Grade 2; Berklee Online Rock Bass L4', bpm: 96,
});

const octaveDisco = grooveEx('gr-octaves', 2, ['octaves', 'r5b7', 'riff'], 'octaves', {
  title: 'Octaves & riffs: disco, rock, riff transposing',
  summary: 'Disco octaves, R-5-♭7-8 and a minor pentatonic riff moved to each chord.',
  about: 'Octave lines drive disco and dance music; R-5-♭7-8 is the classic rock and blues shape; and transposing a riff to each new root (RSL\'s "riff transposer") is how most rock bass lines are built. Keep the muting clean when you jump strings.',
  tips: ['Mute the strings between the root and the octave with your fretting fingers.', 'Accent the octaves lightly for a disco feel.'],
  source: 'RSL Group C (riff transposer); BassBuzz; StudyBass (octaves, R-5-♭7-8)', bpm: 104,
});

const approach = grooveEx('gr-approach', 3, ['approach', 'fifthApproach', 'motown', 'pop8'], 'motown', {
  title: 'Approach notes & Motown lines',
  summary: 'Lead into each new chord: chromatic or 5th approach on the last beat.',
  about: 'The note before a chord change is the most important "passing" note. Approach the next root from a half step below or above (chromatic) or from its 5th (dominant approach). This is the sound of James Jamerson\'s Motown lines and the bridge to walking bass.',
  tips: ['The approach note is short and leads; the target lands on 1.', 'Listen: the approach makes you hear the change before it happens.'],
  source: 'StudyBass (chromatic & 5th approach, note-choice pyramid); TalkingBass approach notes', bpm: 96,
});

const world = grooveEx('gr-world', 3, ['reggae', 'bossa', 'tumbao'], 'bossa', {
  title: 'Reggae, bossa nova & Latin tumbao',
  summary: 'One-drop reggae, bossa R-5 and the anticipated tumbao: feels beyond 4/4 rock.',
  about: 'Reggae leaves beat 1 empty and sits deep in the groove. Bossa nova uses root and 5th in a dotted, swaying rhythm. The Afro-Cuban tumbao anticipates the next chord on beat 4 and skips beat 1. All three teach you how much feel comes from where you do NOT play.',
  tips: ['Tumbao: the last note of each bar is the NEXT chord\'s root.', 'Reggae: play short and fat; use the neck pickup and a palm mute.'],
  source: 'Chuck Sher (Latin appendix); MI Latin courses; Berklee audition; Trinity improvising', bpm: 92,
});

const funk = grooveEx('gr-funk', 3, ['funk16', 'funkOct', 'fill'], 'funk16', {
  title: 'Funk 16ths, ghost notes & fills',
  summary: 'Syncopated 16th grooves with dead notes, and a groove that ends with a fill.',
  about: 'Funk is a 16th-note conversation between real notes and ghost notes (x). Keep both hands moving in 16ths and choose which notes sound. The "fill" groove plays three bars and then a minor-pentatonic fill in the fourth, the way real bass parts are built.',
  tips: ['Ghost notes: fretting hand touches but does not press.', 'Big accent on beat 1; keep it light elsewhere.'],
  source: 'Rocco Prestia / Jaco-style 16ths; TalkingBass Groove Trainer Vol. 2; LCM fills', bpm: 92,
});

const genres = grooveEx('gr-genres', 3, ['countryTwo', 'samba', 'secondLine', 'afrobeat'], 'countryTwo', {
  title: 'Country, samba, second line & afrobeat',
  summary: 'Four more feels: the country two-beat, samba, the New Orleans second line and afrobeat.',
  about: 'Every style has its own bass feel. Country plays root and 5th as half notes on beats 1 and 3 (beats 2 and 4 belong to the snare), with a chromatic pickup into the next chord every other bar. Samba is a two-feel in which the 16th before each beat already plays the next note (R . . 5 | 5 . . R). The New Orleans second line bounces between the root, 3rd, 5th and 6th over a street-parade beat. Afrobeat (Fela Kuti\'s band) repeats a syncopated one-bar figure over a minor vamp.',
  tips: ['Country: keep beats 2 and 4 empty for the snare.', 'Samba: the short 16th is light; the long note carries the beat.', 'Second line: swing it a little and dig into beat 1.'],
  source: 'Ed Friedland "Bass Grooves" and "Building Walking Bass Lines" (styles appendix); Chuck Sher; Berklee styles courses', bpm: 96,
});

const soul = grooveEx('gr-soul', 4, ['neoSoul', 'soulBallad', 'motown'], 'neoSoul', {
  title: 'Soul and neo-soul: space, ghost notes and passing tones',
  summary: 'Laid-back neo-soul with ghost notes, and the long-note soul ballad with passing tones.',
  about: 'Soul bass is about space and feel. The neo-soul line (D\'Angelo, Pino Palladino) sits behind the beat with ghost notes and leans on the chord\'s 7th. The soul ballad holds the root for two beats, then walks through the 3rd and a chromatic approach into the next chord. Play them with the metronome on 2 and 4 in your head.',
  tips: ['Neo-soul: play slightly late, but always land the root on 1.', 'Ballad: let the long notes ring for their full length.'],
  source: 'Pino Palladino and James Jamerson-style lines; Ed Friedland "R&B Bass Masters"; Berklee', bpm: 76,
});

const pick = grooveEx('gr-pick', 2, ['pickDown', 'pickAlt', 'gallop'], 'pickDown', {
  title: 'Playing with a pick: down-strokes, alternate picking & the gallop',
  summary: '↓ = down-stroke, ↑ = up-stroke: punk 8ths, alternate picking and the metal gallop.',
  about: 'Many rock, punk and metal bassists play with a pick for a sharp, even attack. Down-strokes only (↓) give the driving punk sound and need a relaxed wrist; alternate picking (↓ ↑) is faster and smoother; the gallop (8th + two 16ths) is the classic metal rhythm. Mute with the side of the picking hand (palm mute) for a tighter sound.',
  tips: ['Hold the pick between the thumb and the side of the index finger; move from the wrist, not the elbow.', 'Palm mute: rest the edge of the hand lightly on the strings near the bridge.', 'Gallop: ↓ on the 8th, then ↓ ↑ on the two 16ths.'],
  source: 'Pick technique from rock and metal bass teaching (Hal Leonard Bass Method; TalkingBass "Playing Bass with a Pick")', bpm: 100,
});

const funkChanges = grooveEx('gr-funk-changes', 5, ['funk16', 'funkOct'], 'funkOct', {
  title: 'Funk 16ths through chord changes, all keys',
  summary: 'Keep the ghost-note engine running while the chords move, then take it around the cycle.',
  about: 'Holding a 16th-note funk feel over one chord is one skill; keeping it while the harmony moves is another. The same syncopated, ghost-note pattern is applied to every chord of a progression (default: the 12-bar blues), so your hands must find each new root without breaking the groove. Then try "All 12" keys.',
  tips: ['Look ahead one bar: find the next root while you groove on this one.', 'Keep the ghost notes quiet and the downbeats fat.'],
  source: 'Tower of Power / Rocco Prestia-style 16ths; TalkingBass Groove Trainer Vol. 2; RSL Grades 7–8', bpm: 88,
});
funkChanges.params.prog.default = 'blues';

const ODD = {
  54: { name: '5/4 (3+2)', bpb: 5, ts: [5, 4], bar: [['R', 1.5], ['5', 0.5], ['8', 1], ['R', 1], ['b7', 1]] },
  78: { name: '7/8 (2+2+3)', bpb: 7, ts: [7, 8], groups: [2, 2, 3], bar: [['R', 2], ['5', 1], ['8', 1], ['R', 1], ['b7', 1], ['5', 1]] },
  74: { name: '7/4 (4+3)', bpb: 7, ts: [7, 4], bar: [['R', 1], ['R', 1], ['5', 1], ['8', 1], ['R', 1], ['b7', 1], ['5', 1]] },
  68: { name: '6/8 (two groups of 3)', bpb: 6, ts: [6, 8], bar: [['R', 1], ['5', 1], ['8', 1], ['R', 1], ['5', 1], ['b3', 1]] },
};
const oddGroove = ex({
  id: 'gr-odd-meters', module: G, level: 4,
  title: 'Odd and compound meters: 5/4, 7/8, 7/4, 6/8',
  summary: 'Feel the groups, not the count: 3+2, 2+2+3, 4+3, 3+3.',
  about: 'Odd meters (5/4, 7/8, 7/4) are everywhere in prog, fusion, Balkan and film music, and 6/8 is the compound meter of ballads and Afro-Cuban grooves. Each groove places its strongest notes on the start of the beat groups. Loop it until it feels natural rather than counted. In 7/8 and 6/8 the click marks every 8th note.',
  tips: ['Say the groups: "1-2-3 1-2" for 5/4.', 'Record yourself; the last group is where most players rush.'],
  source: 'Trinity Grades 5–8; RSL Grade 8; MI 069E; Berklee Online Rock Bass L10',
  params: { meter: sel('Meter', Object.entries(ODD).map(([k, v]) => [k, v.name])), key: keyP(['1', 'b3', '5'], { def: '4', cycles: false }) },
  bpm: 110, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const o = ODD[p.meter];
    const chords = progChords('vamp-min', Number(p.key), { S }).map((c) => ({ ...c, beats: o.bpb * 4 }));
    grooveLine(b, chords, chordRootMidis(chords), [o.bar], { place: { open: 'allow' } });
    b.steps.forEach((st, i) => { if (i % o.bar.length === 0) st.accent = true; });
    return b.build({ uniform: false, label: 'degree', beatsPerBar: o.bpb, timeSig: o.ts, groups: o.groups || null });
  },
});

// ---------------------------------------------------------------- walking bass
const W = 'walking';
const WALK_PROGS = ['ii-V-I', 'I-vi-ii-V', 'jazz-blues', 'autumn', 'minor-ii-V-i', 'minor-blues', 'rhythm-A', 'cycle-251', 'iii-vi-ii-V'];

function walkEx(id, level, formula, def, meta) {
  return ex({
    id, module: W, level,
    params: { prog: progP(WALK_PROGS, def), key: keyP(['1', '3', '5', '7'], { def: '5' }) },
    bpm: 100, sub: 1, label: 'degree',
    build(p, ctx, S) {
      const b = new Builder(ctx, S, { jazz: true });
      const keys = p.prog === 'cycle-251' ? [0] : keysFor(p.key);
      for (const k of keys) {
        const chords = progChords(p.prog, k, { S });
        // enclosures need a note below every target: no target on the lowest note of the bass
        const lo = formula === 'enclosure' ? ctx.tuning[0] + 2 : 28;
        walkLine(b, chords, chordRootMidis(chords, { lo, hi: 43, firstLo: Math.max(28, lo) }), formula, { triplets: meta.triplets });
      }
      return b.build({ uniform: false, label: 'degree' });
    },
    ...meta,
  });
}

const twoFeel = walkEx('wk-two-feel', 3, 'twofeel', 'ii-V-I', {
  title: 'Two-feel: half notes on roots and 5ths',
  summary: 'The first step to walking: two notes per bar, root on beat 1.',
  about: 'Before walking four to the bar, jazz bassists often play in "two": half notes on beats 1 and 3, usually root and 5th, sometimes a chromatic approach to the next chord. It gives the tune space and teaches you the form and the root movement.',
  tips: ['Let each note ring its full two beats.', 'Learn the form: say the chord names as you play.'],
  source: 'Ed Friedland "Building Walking Bass Lines"; TalkingBass Simple Steps to Walking Bass M1; Berklee', bpm: 96,
});

const chordToneWalk = walkEx('wk-chord-tones', 3, 'ct', 'I-vi-ii-V', {
  title: 'Walking with chord tones',
  summary: 'Four quarter notes per chord: R-3-5-3, R-3-5-8, R-5-8-5.',
  about: 'Your first walking lines use only chord tones: the root on beat 1, then 3rd, 5th and octave. It already sounds like jazz, and it trains you to see each chord shape in time. The patterns rotate so the line does not repeat mechanically.',
  tips: ['Root on beat 1 of every bar, no exceptions (for now).', 'Keep quarter notes long and even ("legato").'],
  source: 'Ed Friedland; Rufus Reid; TalkingBass Simple Steps to Walking Bass M2', bpm: 104,
});

const approachWalk = walkEx('wk-approach', 4, 'ctA', 'jazz-blues', {
  title: 'Walking with chromatic approach notes',
  summary: 'Beat 4 is a half step from the next root: the sound of jazz bass.',
  about: 'Play chord tones on beats 1–3 and on beat 4 approach the next chord\'s root from a half step below (or above). The approach note creates the forward motion that makes walking bass swing.',
  tips: ['Target first: know the next root before you choose the approach.', 'Mix approach from below and from above.'],
  source: 'Ed Friedland; Berklee Online Jazz Bass L3 (R-5-R-half step); TalkingBass M1', bpm: 108,
});

const scalarWalk = walkEx('wk-scalar', 4, 'scalar', 'autumn', {
  title: 'Scalar walking lines',
  summary: 'R-2-3-5, R-2-3-approach, 8-7-6-5: stepwise lines between chord tones.',
  about: 'Scale steps connect chord tones smoothly. Lines like R-2-3-5 or descending 8-7-6-5 are the melodic side of walking, and they balance the jumps of arpeggio lines.',
  tips: ['Use the scale of each chord (Dorian on m7, Mixolydian on 7). A 7 that resolves to a minor chord takes ♭9 and ♭13 instead (Phrygian dominant), and the line follows that.', 'Land chord tones on beats 1 and 3.'],
  source: 'Ed Friedland; Chuck Sher "The Improviser\'s Bass Method"', bpm: 108,
});

const mixedWalk = walkEx('wk-mixed', 4, 'mixed', 'jazz-blues', {
  title: 'Complete walking lines (mixed devices)',
  summary: 'Chord tones, scale steps, chromatic and dominant approaches combined.',
  about: 'Real walking bass mixes all the devices: arpeggios, scale runs, chromatic approaches and dominant (5th) approaches, chosen bar by bar. These lines rotate between them over standard progressions like the jazz blues and the ii–V–I.',
  tips: ['Follow the contour: lines that go up should come back down.', 'Then improvise your own line with the fretboard explorer as a map.'],
  source: 'Ed Friedland; Rufus Reid; Berklee Online Jazz Bass L6–11', bpm: 116, star: true,
});

const enclosureWalk = walkEx('wk-enclosures', 5, 'enclosure', 'ii-V-I', {
  title: 'Walking with enclosures',
  summary: 'Beats 3–4 surround the next root: half step above, half step below, target.',
  about: 'An enclosure frames the target from both sides before landing on it. In walking bass the last two beats of a bar (above, below) lead into the next root on beat 1. It is a signature bebop sound.',
  tips: ['Hear the target before you play the enclosure.', 'Try scale-step above + chromatic below too.'],
  source: 'TalkingBass M1 (enclosures); bebop vocabulary; Ed Friedland', bpm: 112,
});

const twoPerBar = walkEx('wk-two-per-bar', 5, 'mixed', 'rhythm-A', {
  title: 'Two chords per bar',
  summary: 'Rhythm changes and ii–V cycles: root + approach on every chord.',
  about: 'When chords change every two beats there is only room for the root and an approach note. Rhythm changes and the ii–V cycle through all 12 keys are the standard tests of this skill.',
  tips: ['Simplify: root on the chord, approach on the next beat.', 'Start slow: the changes come fast.'],
  source: 'TalkingBass Simple Steps M2 (two chords per bar); Berklee Online Jazz Bass', bpm: 112,
});

const minorWalk = walkEx('wk-minor', 5, 'mixed', 'minor-ii-V-i', {
  title: 'Minor walking: iiø–V–i and minor blues',
  summary: 'Walking in minor keys: the half-diminished ii, the V7♭9 and the minor blues.',
  about: 'Minor keys bring the half-diminished ii chord and a V7♭9 that pulls hard to the minor tonic. Walk through the minor ii–V–i and the minor blues using the same devices, adapted to the darker chord tones.',
  tips: ['On m7♭5 the 5th is flat: watch the dots.', 'The 3rd of V7 is the leading tone of the key.'],
  source: 'TalkingBass M3 (minor ii–V–i backing); Berklee', bpm: 108,
});

const tripletWalk = walkEx('wk-triplet-skips', 5, 'mixed', 'jazz-blues', {
  title: 'Walking with triplet skips',
  summary: 'A swung triplet "skip" on beat 3 of every other bar: the pro walking sound.',
  about: 'Great walking bassists decorate the quarter-note line with triplet skips: a note played on the beat and ghosted on the last triplet. It adds bounce and swing without breaking the line.',
  tips: ['The skip is a ghost: barely audible.', 'Use it sparingly in real playing; here it is drilled every other bar.'],
  source: 'TalkingBass M2 (triplets); Ray Brown / Paul Chambers vocabulary', bpm: 120, triplets: true,
});

const giantWalk = walkEx('wk-giant-steps', 6, 'mixed', 'jazz-blues', {
  title: 'Walking over Coltrane changes',
  summary: 'Giant Steps: key centres a major 3rd apart, two chords per bar.',
  about: 'Walking through "Giant Steps" is a classic mastery test: fast root movement between three key centres. Keep the roots on the beats and use approach notes for every move.',
  tips: ['Know the three tonics: B, G, E♭.', 'Practise at 120, then climb with the speed trainer.'],
  source: 'Taller de Músics/Berklee jazz requirements; John Coltrane "Giant Steps"', bpm: 120,
});
giantWalk.params.prog = progP(['giant-steps'], 'giant-steps');
minorWalk.params.prog = progP(['minor-ii-V-i', 'minor-blues', 'i-iv-V-i'], 'minor-ii-V-i');
minorWalk.params.key = keyP(T.SCALES.aeolian.iv, { def: '2', suffix: 'm' });
giantWalk.params.key = keyP(['1', '3', '5', '7'], { def: '11', cycles: false });

// ---------------------------------------------------------------- slap
const SL = 'slap';
const SLAPS = {
  thumb: { name: 'Thumb on the root (8ths)', bars: [[['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T'], ['R', 0.5, 'T']]] },
  octPop: { name: 'Thumb–pop octaves', bars: [[['R', 0.5, 'T'], ['8', 0.5, 'P'], ['R', 0.5, 'T'], ['8', 0.5, 'P'], ['R', 0.5, 'T'], ['8', 0.5, 'P'], ['R', 0.5, 'T'], ['8', 0.5, 'P']]] },
  tmp: { name: 'Thumb – mute – pop (16ths)', bars: [[['R', 0.25, 'T'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['b7', 0.25, 'P'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['5', 0.25, 'T'], ['x', 0.25, 'T']]] },
  hammer: { name: 'Thumb – hammer – pop – pull-off', bars: [[['R', 0.25, 'T'], ['x', 0.25, 'T'], ['b3', 0.25, 'H'], ['8', 0.25, 'P'], ['b7', 0.25, 'PO'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['5', 0.25, 'T'], ['R', 0.25, 'T'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['b3', 0.25, 'H'], ['4', 0.25, 'H'], ['8', 0.25, 'P'], ['b7', 0.25, 'PO'], ['5', 0.25, 'T']]] },
  triad: { name: 'Slap arpeggio (T R, T 5, P 8, P 10)', bars: [[['R', 0.5, 'T'], ['5', 0.5, 'T'], ['8', 0.5, 'P'], ['10', 0.5, 'P'], ['R', 0.5, 'T'], ['5', 0.5, 'T'], ['8', 0.5, 'P'], ['5', 0.5, 'T']]] },
  ghostFunk: { name: 'Ghost-note funk: thumb ghosts, hammer-ons, pop and pull-off', bars: [[['R', 0.25, 'T'], ['x', 0.25, 'T'], ['b3', 0.25, 'H'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['5', 0.25, 'T'], ['b7', 0.25, 'H'], ['8', 0.25, 'P'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['b3', 0.25, 'H'], ['4', 0.25, 'T'], ['8', 0.25, 'P'], ['b7', 0.25, 'PO'], ['5', 0.25, 'T'], ['x', 0.25, 'T']]] },
  popFill: { name: 'Pop fill down the minor pentatonic (pull-offs)', bars: [[['R', 0.25, 'T'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['x', 0.25, 'T'], ['8', 0.25, 'P'], ['b7', 0.25, 'PO'], ['5', 0.25, 'T'], ['4', 0.25, 'PO'], ['b3', 0.25, 'PO'], ['R', 0.25, 'T'], ['x', 0.25, 'T'], ['R', 0.25, 'T']]] },
  double: { name: 'Double thumb (down ↓ / up ↑) + pop', bars: [[['R', 0.25, 'T↓'], ['R', 0.25, 'T↑'], ['8', 0.25, 'P'], ['x', 0.25, 'T↑'], ['R', 0.25, 'T↓'], ['R', 0.25, 'T↑'], ['8', 0.25, 'P'], ['b7', 0.25, 'P'], ['5', 0.25, 'T↓'], ['5', 0.25, 'T↑'], ['8', 0.25, 'P'], ['x', 0.25, 'T↑'], ['R', 0.25, 'T↓'], ['b3', 0.25, 'T↑'], ['4', 0.25, 'H'], ['8', 0.25, 'P']]] },
};

function slapEx(id, level, styles, def, prog, meta) {
  return ex({
    id, module: SL, level,
    params: { style: sel('Pattern', styles.map((k) => [k, SLAPS[k].name]), def), prog: progP([prog, 'vamp-min', 'vamp-dom', 'i-iv-v-min', 'I-IV-V-I', 'blues'].filter((v, i, a) => a.indexOf(v) === i), prog), key: keyP(['1', '3', '5'], { def: '4' }) },
    sub: 1, label: 'degree',
    build(p, ctx, S) {
      const b = new Builder(ctx, S, { jazz: true });
      for (const k of keysFor(p.key)) {
        const chords = progChords(p.prog, k, { S });
        grooveLine(b, chords, chordRootMidis(chords, { lo: 28, hi: 38, firstLo: 28, firstHi: 36 }), SLAPS[p.style].bars, { place: { open: 'allow', center: 3 } });
      }
      return b.build({ uniform: false, label: 'degree' });
    },
    ...meta,
  });
}

const slapBasics = slapEx('sl-thumb-pop', 3, ['thumb', 'octPop'], 'thumb', 'vamp-min', {
  title: 'Slap basics: thumb and octave pops',
  summary: 'T = thumb strikes the string; P = finger pops the octave.',
  about: 'Slap bass has two basic motions: the thumb (T) bounces off the low string like a drumstick, and the index or middle finger "pops" (P) a higher string by pulling it away from the fretboard so it snaps back. Start with the thumb alone, then thumb–pop octaves, the backbone of funk and disco slap.',
  tips: ['Rotate the forearm (like turning a door handle). Do not swing from the elbow.', 'Strike the string over the end of the fretboard.'],
  source: 'TalkingBass Slap Bass Essentials; Berklee ILBS-251; MI 021; Trinity Grade 5', bpm: 84,
});

const slapGrooves = slapEx('sl-grooves', 4, ['tmp', 'hammer', 'triad'], 'tmp', 'vamp-min', {
  title: 'Slap grooves: ghost thumbs, hammers & pull-offs',
  summary: '16th-note slap patterns with left-hand mutes (x), hammer-ons (H) and pull-offs (PO).',
  about: 'Real slap lines fill the 16th grid with thumb ghosts (x), hammered notes (H), pops (P) and pull-offs (PO). These patterns combine all of them over a funk vamp. Loop slowly and keep the 16ths perfectly even.',
  tips: ['The "x" is a thumb on a muted string: percussive, no pitch.', 'Hammer from the thumb note to the next note with no pluck.'],
  source: 'TalkingBass Slap Bass Essentials (60 grooves); Berklee Online Slap; RSL Grades 6–8', bpm: 80,
});

const slapAdvanced = slapEx('sl-advanced', 5, ['ghostFunk', 'popFill'], 'ghostFunk', 'vamp-min', {
  title: 'Slap: ghost-note funk and pentatonic pop fills',
  summary: 'Busier 16th slap lines: thumb ghosts, hammer-ons, pops, pull-offs and a pentatonic fill.',
  about: 'The step between slap grooves and double thumbing: denser 16th patterns where the thumb ghosts (x) keep the grid, the hammer-on (H) and pull-off (PO) make notes without plucking, and pops (P) accent the off-beats. The second pattern ends each bar with a fill down the minor pentatonic, the kind of lick that ends a funk phrase.',
  tips: ['Keep the thumb bouncing on every ghost: it is your hi-hat.', 'Pull-off (PO): pluck the note by pulling the fretting finger off sideways.', 'Loop one bar slowly before adding the progression.'],
  source: 'TalkingBass Slap Bass Essentials; Louis Johnson and Marcus Miller-style slap vocabulary; Berklee Online Slap', bpm: 76,
});

const doubleThumb = slapEx('sl-double-thumb', 6, ['double'], 'double', 'vamp-min', {
  title: 'Double thumbing',
  summary: 'Thumb down (↓) and up (↑) like a pick: Victor Wooten\'s signature technique.',
  about: 'Double thumbing uses the thumb in both directions: a downstroke that rests on the next string, then an upstroke with the thumbnail side. Combined with pops it allows continuous 16th-note slap lines at high speed.',
  tips: ['Start painfully slow, thumb only: down–up on one string.', 'Keep the wrist loose; the thumb moves like a pick.'],
  source: 'Victor Wooten; TalkingBass Slap (double thumb); SBL Slap Accelerator', bpm: 60,
});

export default [roots, pick, octaveDisco, blues, approach, world, genres, funk, soul, funkChanges, oddGroove, twoFeel, chordToneWalk, approachWalk, scalarWalk, mixedWalk, enclosureWalk, twoPerBar, minorWalk, tripletWalk, giantWalk, slapBasics, slapGrooves, slapAdvanced, doubleThumb];
