// Chords & harmony: how chords are built, progressions, double stops, shells, chordal bass.
import {
  T, Builder, keysFor, chordTones, ex, sel, keyP, nm, chordName, pickRoot, scaleRun, progChords, progP, PROGS,
  chordRootMidis, emitMixed, grooveLine, diatonicStacks, scaleTone, rootStrP,
  keyLines,
} from './common.js';

const M = 'harmony';
const ALL_PROGS = Object.keys(PROGS).filter((k) => !k.startsWith('vamp') && !k.startsWith('cycle') && k !== 'giant-steps');

const buildChord = ex({
  id: 'hm-build-a-chord', module: M, level: 1,
  title: 'How a chord is built',
  summary: 'Play the scale, then pick notes 1-3-5 (triad) and 1-3-5-7 (7th chord).',
  about: 'Chords come from scales. Play the major scale, then take every other note: 1, 3, 5 is the triad; add 7 for the 7th chord. Seeing the chord inside the scale shape is the key to understanding everything that follows.',
  tips: ['"Skip a note, play a note": 1 (2) 3 (4) 5 (6) 7.', 'Do it in the minor scale too: 1-♭3-5-♭7.'],
  source: 'StudyBass, TalkingBass Groove Trainer, Ariane Cap',
  params: { key: keyP(T.SCALES.ionian.iv), scale: sel('Scale', [['ionian', 'Major'], ['aeolian', 'Natural minor']]), root: rootStrP('A') },
  bpm: 66, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const r = pickRoot(ctx, k, { strings: [p.root, 'A', 'E'], hi: 9, prefer: p.root });
      const minor = p.scale === 'aeolian';
      const items = [];
      scaleRun(tonic, p.scale, r.midi, { dir: 'up' }).forEach((x, i) => items.push({ ...x, chord: i === 0 ? `${nm(tonic, S)} ${minor ? 'minor' : 'major'} scale` : undefined }));
      [0, 2, 4, 7, 4, 2, 0].forEach((i, j) => items.push({ ...T.scalePitch(tonic, p.scale, r.midi, i), chord: j === 0 ? chordName(tonic, minor ? 'min' : 'maj', S) : undefined, text: j === 0 ? 'triad: 1-3-5' : undefined }));
      [0, 2, 4, 6, 7, 6, 4, 2].forEach((i, j) => items.push({ ...T.scalePitch(tonic, p.scale, r.midi, i), chord: j === 0 ? chordName(tonic, minor ? 'min7' : 'maj7', S) : undefined, text: j === 0 ? '7th chord: 1-3-5-7' : undefined }));
      b.line(items, { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const thirdQuality = ex({
  id: 'hm-chord-qualities', module: M, level: 2,
  title: 'Chord qualities of the key: hear the 3rd',
  summary: 'Root and 3rd on every degree: major, minor, minor, major, major, minor, diminished.',
  about: 'Why is ii minor and IV major? Play the root and the diatonic 3rd above each degree. A major 3rd (4 frets) makes a major chord, a minor 3rd (3 frets) a minor one. You will hear and see the pattern M m m M M m m (diminished), the DNA of every major key.',
  tips: ['Say "major" or "minor" before each chord.', 'Then switch the scale to minor and hear the pattern change.'],
  source: 'TalkingBass Chordal Mastery (thirds through a scale); StudyBass Fundamentals 3',
  params: { key: keyP(T.SCALES.ionian.iv), scale: sel('Scale', [['ionian', 'Major'], ['aeolian', 'Natural minor'], ['harmonicMinor', 'Harmonic minor']]) },
  bpm: 72, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const r = pickRoot(ctx, k, { strings: ['A', 'E'], hi: 8, prefer: 'A' });
      const stacks = diatonicStacks(tonic, p.scale, [0, 2, 4], S);
      const items = [];
      for (let d = 0; d < 8; d++) {
        const st = stacks[d % 7];
        const o = Math.floor(d / 7) * 7;
        const R = scaleTone(tonic, p.scale, r.midi, d, st.root);
        const third = scaleTone(tonic, p.scale, r.midi, d + 2, st.root);
        const q = third.deg === '3' ? 'major 3rd' : 'minor 3rd';
        items.push({ ...R, chord: st.sym, text: `${st.roman} · ${q}` }, third, R, third);
        void o;
      }
      b.line(items, { place: { open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const progRoots = ex({
  id: 'hm-progression-roots', module: M, level: 2,
  title: 'Common progressions: root notes',
  summary: 'I–IV–V, I–V–vi–IV, ii–V–I, 12-bar blues, Andalusian… play the roots and learn the sound.',
  about: 'Most songs use a handful of progressions. Play only the roots, in whole notes, halves, quarters or 8ths, and learn to recognise each progression by ear and by shape. The Roman numerals tell you the function: I is home, V is tension, IV is the "going away" chord.',
  tips: ['Name the numeral of each chord as you play it.', 'Transpose to all 12 keys; the shapes stay the same.'],
  source: 'StudyBass, BassBuzz (Nashville numbers), RSL harmonic recall',
  params: { prog: progP(ALL_PROGS, 'I-V-vi-IV'), key: keyP(T.SCALES.ionian.iv), rhythm: sel('Rhythm', [['4', 'Whole notes'], ['2', 'Half notes'], ['1', 'Quarter notes'], ['0.5', '8th notes']], '1') },
  bpm: 84, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { S });
      const roots = chordRootMidis(chords);
      const d = Number(p.rhythm);
      const items = [];
      chords.forEach((c, i) => {
        const n = Math.max(1, Math.round(c.beats / d));
        for (let j = 0; j < n; j++) items.push({ midi: roots[i], n: c.root, deg: 'R', dur: c.beats / n, chord: j === 0 ? c.sym : undefined });
      });
      emitMixed(b, items, { center: 4 });
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const PATTERNS = {
  r5: { name: 'Root–5th (half notes)', bars: [[['R', 2], ['5', 2]]] },
  r5low: { name: 'Root–low 5th (two-feel)', bars: [[['R', 2], ['5_', 2]]] },
  r585: { name: 'R-5-8-5 (quarters)', bars: [[['R', 1], ['5', 1], ['8', 1], ['5', 1]]] },
  r353: { name: 'R-3-5-3 (chord tones)', bars: [[['R', 1], ['3', 1], ['5', 1], ['3', 1]]] },
  r358: { name: 'R-3-5-8', bars: [[['R', 1], ['3', 1], ['5', 1], ['8', 1]]] },
  r357: { name: 'R-3-5-7 (7th chords)', bars: [[['R', 1], ['3', 1], ['5', 1], ['7', 1]]] },
  r3575: { name: 'R-3-5-7-8-7-5-3 (8ths)', bars: [[['R', 0.5], ['3', 0.5], ['5', 0.5], ['7', 0.5], ['8', 0.5], ['7', 0.5], ['5', 0.5], ['3', 0.5]]] },
};

const chordTonesProg = ex({
  id: 'hm-chord-tones', module: M, level: 3, star: true,
  title: 'Chord tones over progressions',
  summary: 'Outline every chord of real progressions: R-5, R-3-5-3, R-3-5-7…',
  about: 'Chord tones are the backbone of bass lines: every academy builds lines as chord tones first, then scale tones, then chromatic notes. Pick a progression and an outline pattern and play it through, in one key or all 12. The chord symbol appears above the fretboard: say its numeral (I, IV, V…) as you play it.',
  tips: ['Choose the octave of each root that keeps the hand in one area.', 'This is RSL\'s "transpose a riff" skill: same pattern, new chord.'],
  source: 'StudyBass (chord tones are primary); RSL Group C; Ed Friedland',
  params: { prog: progP(ALL_PROGS, 'I-vi-IV-V'), key: keyP(T.SCALES.ionian.iv), pattern: sel('Pattern', Object.entries(PATTERNS).map(([k, v]) => [k, v.name]), 'r353') },
  bpm: 88, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const L of keyLines(keysFor(p.key), (k) => progChords(p.prog, k, { S, triads: !['r357', 'r3575'].includes(p.pattern) }))) {
      grooveLine(b, L.chords, L.roots, PATTERNS[p.pattern].bars, { place: { open: 'avoid' }, shape: true, next: L.next });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const DS = {
  power: { name: 'Power chord (R + 5)', iv: '5' },
  octave: { name: 'Octave (R + 8)', iv: '8' },
  third: { name: 'R + 3rd (adjacent strings)', iv: '3' },
  tenth: { name: 'R + 10th (E & G strings)', iv: '10' },
  seventh: { name: 'R + 7th (shell)', iv: '7' },
};
const doubleStops = ex({
  id: 'hm-double-stops', module: M, level: 3,
  title: 'Double stops over progressions',
  summary: 'Two notes at once: power chords, octaves, 3rds, 10ths and shells.',
  about: 'Bass players add harmony with double stops: root + 5th (rock), root + octave (unison riffs), root + 3rd or 10th (sweet, chordal), root + 7th (jazz shells). Each chord of the progression is struck twice as a double stop with the right 3rd or 7th for its quality.',
  tips: ['Pluck both strings together with two fingers, or thumb + finger.', 'Mute every other string with the fretting hand.', 'Close 3rds blur in the low register: they are played an octave up here, and 10ths sound even clearer.'],
  source: 'Trinity Grades 5–7 (power chords, 10ths); TalkingBass/BassBuzz double stops; RSL',
  params: { type: sel('Interval', Object.entries(DS).map(([k, v]) => [k, v.name]), 'tenth'), prog: progP(['I-V-vi-IV', 'I-vi-IV-V', 'I-IV-V-I', 'ii-V-I', 'I-vi-ii-V', 'i-bVII-bVI-V']), key: keyP(T.SCALES.ionian.iv) },
  bpm: 76, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const e = Math.max(0, ctx.str('E'));
    for (const k of keysFor(p.key)) {
      // the shell (R + 7th) needs 7th chords; the other double stops follow the style (pop = triads)
      const chords = progChords(p.prog, k, { S, triads: p.type === 'seventh' ? false : undefined });
      const roots = chordRootMidis(chords, { lo: 29, hi: 40, firstLo: 29, firstHi: 40 });
      chords.forEach((c, i) => {
        let iv = DS[p.type].iv;
        if (iv === '3' || iv === '10') iv = c.ivs[1] === 'b3' ? (iv === '3' ? 'b3' : 'b10') : iv;
        if (iv === '7') iv = c.ivs[3] || 'b7';
        const gap = p.type === 'tenth' ? 3 : p.type === 'third' || p.type === 'power' ? 1 : 2;
        // find a root position (E string first, then higher) where both notes are on the neck
        let pos = null;
        // close 3rds sound muddy in the lowest register: play them an octave up
        for (const rm of p.type === 'third' ? [roots[i] + 12, roots[i]] : [roots[i], roots[i] + 12]) {
          for (let s0 = e; s0 + gap < ctx.tuning.length && !pos; s0++) {
            const f0 = rm - ctx.tuning[s0], f2 = rm + T.semis(iv) - ctx.tuning[s0 + gap];
            if (f0 >= 1 && f0 <= 12 && f2 >= 0 && f2 <= ctx.maxFret) pos = { s0, f0, f2 };
          }
          if (pos) break;
        }
        if (!pos) return;
        const lbl = { b10: '♭10', '10': '10' }[iv] || T.fmtDeg(iv);
        const simple = iv.replace('10', '3');
        const pair = [{ s: pos.s0, f: pos.f0, n: c.root, deg: 'R' }, { s: pos.s0 + gap, f: pos.f2, n: T.up(c.root, simple === '8' ? '1' : simple), deg: lbl }];
        b.chord(c.sym);
        b.stack(pair, { dur: c.beats / 2 });
        b.stack(pair, { dur: c.beats / 2 });
      });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const shells = ex({
  id: 'hm-shells', module: M, level: 4,
  title: 'Shell voicings: R-7-10 chords on bass',
  summary: 'Root, 7th and 3rd (as a 10th): full jazz chords with three fingers.',
  about: 'A shell voicing keeps only the essential notes: root, 7th and 3rd. On bass the root goes on the E string, the 7th two strings up (on the D string) and the 3rd, as a 10th, on the G string. These voicings let you comp chords, play chord melody and understand guide tones. Each chord is played as an arpeggio, then strummed together.',
  tips: ['maj7: 7th = two strings up, one fret up. Dom7/m7: same fret.', 'The 3rd sits one fret up (major) or on the same fret (minor) as the root, on the G string.'],
  source: 'RSL Grades 6–8 (chord shapes); MI 151E; Berklee Online Bass 101 L10',
  params: { prog: progP(['ii-V-I', 'I-vi-ii-V', 'autumn', 'jazz-blues', 'minor-ii-V-i']), key: keyP(['1', '3', '5', '7']) },
  bpm: 70, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const e = Math.max(0, ctx.str('E'));
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { S });
      const roots = chordRootMidis(chords, { lo: 29, hi: 41, firstLo: 29, firstHi: 38 });
      chords.forEach((c, i) => {
        const s0 = e;
        if (s0 + 3 >= ctx.tuning.length) return;
        const f0 = roots[i] - ctx.tuning[s0];
        const third = c.ivs[1], seventh = c.ivs[3] || 'b7';
        const notes = [
          { s: s0, f: f0, n: c.root, deg: 'R' },
          { s: s0 + 2, f: roots[i] + T.semis(seventh) - ctx.tuning[s0 + 2], n: T.up(c.root, seventh), deg: T.fmtDeg(seventh) },
          { s: s0 + 3, f: roots[i] + 12 + T.semis(third) - ctx.tuning[s0 + 3], n: T.up(c.root, third), deg: third === 'b3' ? '♭10' : '10' },
        ];
        b.chord(c.sym);
        const per = c.beats / 4;
        b.frets(notes.map((x) => ({ ...x, dur: per })));
        b.stack(notes, { dur: c.beats - 3 * per });
      });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const minorHarmony = ex({
  id: 'hm-minor-keys', module: M, level: 4,
  title: 'Minor-key harmony',
  summary: 'i–iv–V–i, the Andalusian cadence, minor ii–V–i: where harmonic minor\'s V7 comes from.',
  about: 'In a minor key the V chord is usually made major (V7) by raising the 7th: that is harmonic minor. Play the chord tones of the most common minor progressions and hear the leading tone pull back to the root. The Andalusian cadence (i–♭VII–♭VI–V) is the sound of flamenco and countless rock songs.',
  tips: ['Find the raised 7th (the 3rd of V7) and feel it resolve up to the root.', 'Compare with the natural-minor v (minor).'],
  source: 'StudyBass Fundamentals 3 (minor diatonic harmony); TalkingBass Ultimate Music Theory',
  params: { prog: progP(['i-iv-V-i', 'i-bVII-bVI-V', 'minor-ii-V-i', 'i-bVI-bIII-bVII', 'minor-blues', 'i-iv-v-min']), key: keyP(T.SCALES.aeolian.iv, { def: '9' }), pattern: sel('Pattern', [['r357', 'R-3-5-7'], ['r353', 'R-3-5-3'], ['r3575', 'R-3-5-7-8-7-5-3 (8ths)']]) },
  bpm: 84, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const L of keyLines(keysFor(p.key), (k) => progChords(p.prog, k, { S, triads: p.pattern === 'r353' }))) {
      grooveLine(b, L.chords, L.roots, PATTERNS[p.pattern].bars, { place: { open: 'avoid' }, shape: true, next: L.next });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const colour = ex({
  id: 'hm-colour-chords', module: M, level: 5,
  title: 'Secondary dominants, borrowed chords, tritone subs',
  summary: 'The "spice" chords: VI7, III7, ♭VI, ♭VII, iv, ♭II7, each outlined in context.',
  about: 'Real songs leave the key for a moment. A secondary dominant (VI7, III7) points strongly to the next chord; a borrowed chord (♭VI, ♭VII, iv) takes a colour from the parallel minor; a tritone substitution (♭II7) replaces V7 with a chord a tritone away that shares its guide tones. Outline each progression and listen for the chord that is "not in the key".',
  tips: ['Spot the non-diatonic note in each colour chord (e.g. the C♯ in A7 in the key of C).', 'Tritone sub: compare G7 and D♭7. They share B and F.'],
  source: 'StudyBass Fundamentals 3 (secondary dominants, borrowed chords); TalkingBass Ultimate Music Theory Vol. 2',
  params: { prog: progP(['I-VI7-ii-V', 'I-III7-vi', 'I-bVI-bVII-I', 'I-iv-I', 'ii-bII7-I']), key: keyP(T.SCALES.ionian.iv), pattern: sel('Pattern', [['r357', 'R-3-5-7'], ['r3575', 'R-3-5-7-8-7-5-3 (8ths)']]) },
  bpm: 84, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const L of keyLines(keysFor(p.key), (k) => progChords(p.prog, k, { S }))) {
      grooveLine(b, L.chords, L.roots, PATTERNS[p.pattern].bars, { place: { open: 'avoid' }, shape: true, next: L.next });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const blues = ex({
  id: 'hm-12-bar-blues', module: M, level: 2,
  title: '12-bar blues: dominant 7th chord tones',
  summary: 'I7–IV7–V7 over the 12-bar form, outlined R-3-5-♭7.',
  about: 'The 12-bar blues is the most played form in popular music. All three chords are dominant 7ths. Outline each with its chord tones and learn the form by heart: 4 bars of I, 2 of IV, 2 of I, then V, IV, I, V (the turnaround).',
  tips: ['Count the bars out loud the first few times.', 'Try the quick change (IV in bar 2) and all 12 keys.'],
  source: 'StudyBass Fundamentals 2 (12-bar blues); RSL; BassBuzz',
  params: { prog: progP(['blues', 'blues-quick', 'minor-blues', 'jazz-blues']), key: keyP(['1', '3', '5', 'b7'], { def: '9' }), pattern: sel('Pattern', [['r357', 'R-3-5-♭7'], ['r585', 'R-5-8-5'], ['r3575', 'R-3-5-7-8-7-5-3 (8ths)']]) },
  bpm: 92, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const L of keyLines(keysFor(p.key), (k) => progChords(p.prog, k, { S }))) {
      grooveLine(b, L.chords, L.roots, PATTERNS[p.pattern].bars, { place: { open: 'avoid' }, shape: true, next: L.next });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

const chordal10ths = ex({
  id: 'hm-chordal-bass', module: M, level: 6,
  title: 'Chordal bass: R-5-10 and R-7-10 through changes',
  summary: 'Three-note chords across four strings: accompany yourself like a pianist.',
  about: 'Solo and chordal bassists (Jaco, Victor Wooten, Steve Lawson) voice chords across the strings: root on E or A, 5th or 7th in the middle, 3rd as a 10th on top. The exercise strums each voicing, then arpeggiates it, through jazz and pop progressions.',
  tips: ['Use thumb for the root, index and middle for the upper notes (p-i-m).', 'Aim for even volume: let the 10th sing a little louder.'],
  source: 'Jaco Pastorius / Victor Wooten chordal approach; RSL Grade 8; MI',
  params: { voicing: sel('Voicing', [['5', 'R-5-10'], ['7', 'R-7-10']]), prog: progP(['I-vi-IV-V', 'I-V-vi-IV', 'ii-V-I', 'I-vi-ii-V', 'autumn']), key: keyP(['1', '3', '5', '7']) },
  bpm: 70, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const e = Math.max(0, ctx.str('E'));
    for (const k of keysFor(p.key)) {
      const chords = progChords(p.prog, k, { S, triads: p.voicing === '7' ? false : undefined });
      const roots = chordRootMidis(chords, { lo: 29, hi: 41, firstLo: 29, firstHi: 38 });
      chords.forEach((c, i) => {
        const s0 = e;
        if (s0 + 3 >= ctx.tuning.length) return;
        const f0 = roots[i] - ctx.tuning[s0];
        const mid = p.voicing === '5' ? (c.ivs[2] || '5') : (c.ivs[3] || 'b7');
        const third = c.ivs[1];
        const notes = [
          { s: s0, f: f0, n: c.root, deg: 'R', tag: 'p' },
          { s: s0 + (p.voicing === '5' ? 1 : 2), f: roots[i] + T.semis(mid) - ctx.tuning[s0 + (p.voicing === '5' ? 1 : 2)], n: T.up(c.root, mid), deg: T.fmtDeg(mid), tag: 'i' },
          { s: s0 + 3, f: roots[i] + 12 + T.semis(third) - ctx.tuning[s0 + 3], n: T.up(c.root, third), deg: third === 'b3' ? '♭10' : '10', tag: 'm' },
        ];
        // one hand shape for the strum and the arpeggio: fingers by fret from the lowest
        const lo = Math.min(...notes.filter((x) => x.f > 0).map((x) => x.f));
        notes.forEach((x) => { x.finger = x.f === 0 ? 0 : Math.min(4, x.f - lo + 1); });
        b.chord(c.sym);
        b.stack(notes, { dur: c.beats / 2 });
        b.frets([notes[0], notes[1], notes[2], notes[1]].map((x) => ({ ...x, dur: c.beats / 8 })));
      });
    }
    return b.build({ uniform: false, label: 'degree' });
  },
});

export default [buildChord, thirdQuality, progRoots, blues, chordTonesProg, doubleStops, minorHarmony, shells, colour, chordal10ths];
void chordTones;
