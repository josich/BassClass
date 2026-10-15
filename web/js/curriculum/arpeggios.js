// Arpeggios & 7th chords: qualities, diatonic 7ths, inversions, ii–V–I, voice leading, extensions.
import {
  T, Builder, keysFor, chordTones, ARP_SHAPES, ex, variant, keyP, sel, nm, chordName, cycleRoot, QUALITY_7THS, QUALITY_TRIADS,
  ZONES, zoneP, orderP, rootStrP, pickRoot, zoneShape, zoneShapeAny, shapeFingers, emitShapeF, SEVENTH_ORDERS, voiceLedItems, emitMixed,
  progChords, progP, diatonicStacks, scaleTone, DEG_SEQ, degSeqP, SCALE_TYPE_OPTS, spellMidi, chordRootMidis,
} from './common.js';
import { arpBuild, diatonicBuild } from './triads.js';

const M = 'arpeggios';
const ivsOf = (q) => T.CHORDS[q].iv;
const shapeP = (keys, def) => sel('Pattern', keys.map((k) => [k, ARP_SHAPES[k].name]), def);
const orderP7 = (keys, def) => sel('Pattern', keys.map((k) => [k, SEVENTH_ORDERS[k].name]), def);
const REG = { low: [28, 52], mid: [33, 57], high: [40, 64] };
const regP = sel('Register', [['mid', 'Middle'], ['low', 'Low'], ['high', 'High']]);

const qualities = ex({
  id: 'arp-7th-qualities', module: M, level: 2,
  title: 'The five 7th chords from one root',
  summary: 'maj7 → 7 → m7 → m7♭5 → °7: lower one note at a time.',
  about: 'Seventh chords add a 4th note to the triad. From one root, each chord lowers a single note of the previous one: maj7 (R 3 5 7) → dominant 7 (♭7) → minor 7 (♭3) → half-diminished (♭5) → diminished 7 (♭♭7). Hearing and seeing that progression is the best way to learn them all.',
  tips: ['Name each chord as it starts.', 'Notice which dot moves one fret each time.'],
  source: 'LCM Grade 3 (all five types); Berklee PULSE; TalkingBass Chord Tone Essentials',
  params: { key: keyP(['1', '3', '5', '7']), root: rootStrP('A') },
  bpm: 70, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const root = T.bestRoot(k, ['1', '3', '5', '7']);
      const r = pickRoot(ctx, k, { strings: [p.root, 'E', 'A'], hi: 9, prev, prefer: p.root });
      const items = [];
      for (const q of ['maj7', 'dom7', 'min7', 'm7b5', 'dim7']) {
        chordTones(root, ivsOf(q), r.midi, [0, 1, 2, 3, 4, 3, 2, 1]).forEach((t, j) => items.push({ ...t, chord: j === 0 ? chordName(root, q, S) : undefined }));
      }
      b.line(items, { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const study = ex({
  id: 'arp-7th', module: M, level: 2,
  title: '7th arpeggio study',
  summary: 'Any 7th or 6th chord, any key or all 12, 1–2 octaves, many patterns.',
  about: 'Drill one chord type at a time: maj7 (R-3-5-7), dominant 7 (R-3-5-♭7), minor 7 (R-♭3-5-♭7), half-diminished (R-♭3-♭5-♭7), diminished 7 (R-♭3-♭5-♭♭7) and more. The "doubled notes" pattern plays every chord tone twice, a warm-up made popular by Janek Gwizdala, which gives the ear time to lock each sound.',
  tips: ['Maj7 with root on finger 2: 3rd (1) and 5th (4) on the next string, 7th one string up with finger 3.', 'Use "All 12 · cycle of 4ths" when one key is solid.'],
  source: 'RSL Grades 3–6, LCM Grades 2–6, Berklee PULSE, Janek Gwizdala (doubled-note arpeggios)',
  params: { quality: sel('Chord', QUALITY_7THS), key: keyP(['1', '3', '5', '7']), shape: shapeP(['updown', 'up', 'down', 'downup', 'doubled', 'broken'], 'updown'), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: rootStrP('A') },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    // two octaves always start on the E string (the "Root on" choice applies to one octave)
    return arpBuild(p, ctx, S, { ivs: ivsOf(p.quality), type: p.quality, shape: p.shape, octaves: Number(p.oct), rootStr: Number(p.oct) > 1 ? 'E' : p.root }).build({ label: 'degree', fixed: Number(p.oct) > 1 ? { root: 'E string (2 octaves start low)' } : {} });
  },
});

const twoOct = variant(study, {
  id: 'arp-two-octaves', level: 4,
  title: 'Two-octave 7th arpeggios',
  summary: 'Spread each 7th chord over two octaves with clean position shifts.',
  about: 'Two-octave arpeggios are the RSL Grade 5–7 and LCM Grade 6 standard. Play the first octave in position, shift at the octave and repeat the shape. Plan the shift and keep it identical on the way down.',
  defaults: { oct: '2', shape: 'updown' },
});

const SCALES7 = ['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor', 'dorian', 'mixolydian', 'lydian', 'phrygian'];
const diatonic7 = ex({
  id: 'arp-diatonic-7ths', module: M, level: 3, star: true,
  title: 'Diatonic 7th arpeggios: Imaj7 ii7 iii7 IVmaj7 V7 vi7 viiø7',
  summary: 'The harmonised scale in 7th chords: the vocabulary of jazz, soul and pop.',
  about: 'Stack four notes in thirds on each degree of the scale. In major you get Imaj7, iim7, iiim7, IVmaj7, V7, vim7 and viiø7. Every jazz standard and most soul and pop songs use these chords. Learn them in one position first, then in inversions and in every key.',
  tips: ['"Up one, down the next" keeps you in position and sounds musical.', 'Inversions: start each chord from its 3rd, 5th or 7th (Berklee level exams).'],
  source: 'Berklee PULSE & "Chord Studies for Electric Bass"; MI; LCM; StudyBass',
  params: {
    key: keyP(['1', '3', '5', '7']), scale: sel('Scale', SCALE_TYPE_OPTS(SCALES7)), order: degSeqP,
    pattern: orderP7(['up', 'alt', 'down', 'updown'], 'up'),
    inversion: sel('Inversion', [['0', 'Root position'], ['1', '1st (from the 3rd)'], ['2', '2nd (from the 5th)'], ['3', '3rd (from the 7th)']]), root: rootStrP('A'),
  },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    return diatonicBuild(p, ctx, S, { offsets: [0, 2, 4, 6], order: SEVENTH_ORDERS[p.pattern].f, inversion: Number(p.inversion) }).build({ label: 'degree' });
  },
});

const diatonic7inv = variant(diatonic7, {
  id: 'arp-diatonic-inversions', level: 4,
  title: 'Diatonic 7ths in inversions',
  summary: 'Every chord of the key starting from its 3rd, 5th or 7th.',
  about: 'Inversions of 7th chords give smooth, scale-like bass lines and are required at LCM Grade 8 and in conservatory programmes. Move through the key with each chord in the same inversion, then mix them.',
  defaults: { inversion: '1', pattern: 'alt' },
});

const zoneCycle7 = ex({
  id: 'arp-zone-cycle', module: M, level: 3,
  title: '7th arpeggios around the cycle in one zone',
  summary: 'All 12 maj7, 7 or m7 arpeggios inside a 5-fret zone.',
  about: 'The zone warm-up with 4-note chords. Stay inside the zone and play the arpeggio of every key around the cycle. You will need every fingering, and you will start to see each key\'s chord wherever your hand is.',
  tips: ['Try each quality on a different day: maj7, 7, m7, m7♭5.', 'Say the chord name out loud first.'],
  source: 'SBL Zones extended to 7th chords; Gary Willis ("don\'t move")',
  params: { quality: sel('Chord', QUALITY_7THS.slice(0, 5)), zone: zoneP, order: orderP, pattern: orderP7(['up', 'alt', 'updown'], 'up') },
  bpm: 76, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const zone = ZONES[p.zone];
    let prev = null;
    keysFor(p.order).forEach((k, i) => {
      const root = cycleRoot(k, ivs);
      // root position in the zone if it fits; otherwise start on another chord tone (inversion),
      // then allow one fret outside the zone. Every key is played.
      let z = zoneShapeAny(k, ivs, ctx, zone, prev, 4);
      let note = '';
      for (let w = 1; !z && w <= 3; w++) {
        z = zoneShapeAny(k, ivs, ctx, [Math.max(1, zone[0] - w), zone[1] + w], prev, 4 + w);
        note = `${w} fret${w > 1 ? 's' : ''} outside the zone`;
      }
      if (!z) return;
      const from = z.inv ? `from the ${['', '3rd', '5th', '7th'][z.inv]}` : '';
      b.chord(chordName(root, p.quality, S), [from, note].filter(Boolean).join(' · ') || undefined);
      const fingers = shapeFingers(z.pos);
      b.frets(SEVENTH_ORDERS[p.pattern].f(i).map((j) => ({
        s: z.pos[j].s, f: z.pos[j].f, finger: fingers[j], n: T.up(root, ivs[z.tones[j]]), deg: T.fmtDeg(ivs[z.tones[j]]),
      })));
      prev = z.rootMidi;
    });
    return b.build({ label: 'degree', zone });
  },
});

const inversions = ex({
  id: 'arp-inversions', module: M, level: 4,
  title: '7th chord inversions climbing',
  summary: 'R-3-5-7, 3-5-7-8, 5-7-8-10, 7-8-10-12: four inversions up the neck and back.',
  about: 'Each inversion starts on the next chord tone. Climb through root position and the three inversions, then come back down. It builds your view of a chord across a two-octave range, which you need for voice leading and chordal playing.',
  tips: ['Keep the degree labels on: know where the root is at all times.', 'Choose a quality per day; maj7 and m7 are the most used.'],
  source: 'LCM Grade 8; Spanish conservatory years 4–5',
  params: { quality: sel('Chord', QUALITY_7THS.slice(0, 5)), key: keyP(['1', '3', '5', '7']) },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const root = T.bestRoot(k, ivs);
      const r = pickRoot(ctx, k, { strings: ['E'], hi: 7, prev });
      const groups = [[0, 1, 2, 3], [1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6], [6, 5, 4, 3], [5, 4, 3, 2], [4, 3, 2, 1], [3, 2, 1, 0]];
      const names = ['Root', '1st inv', '2nd inv', '3rd inv'];
      const items = [];
      groups.forEach((g, gi) => chordTones(root, ivs, r.midi, g).forEach((t, j) => items.push({ ...t, chord: gi === 0 && j === 0 ? chordName(root, p.quality, S) : undefined, text: j === 0 && gi < 4 ? names[gi] : undefined })));
      b.line(items, { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 3 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const iiVI = ex({
  id: 'arp-ii-v-i', module: M, level: 4, star: true,
  title: 'ii–V–I arpeggios in all keys',
  summary: 'Dm7 – G7 – Cmaj7 (and the minor iiø–V–i) voice-led through every key.',
  about: 'The ii–V–I is the most important progression in jazz and very common in pop and soul. Arpeggiate each chord, starting each new chord from the tone nearest the previous note, and go through all 12 keys. The minor version uses iiø7 – V7 – i(maj7).',
  tips: ['Listen for the guide tones (3rds and 7ths): they move by step.', 'Then try it with "Root position only" and hear the difference.'],
  source: 'Berklee Online Jazz Bass L5; Berklee Press; Gwizdala / Banacos-style continuous lines',
  params: { type: sel('Type', [['major', 'Major ii–V–I'], ['minor', 'Minor iiø–V–i']]), key: keyP(['1', '3', '5', '7'], { def: 'cycle4' }), pattern: orderP7(['up', 'alt', 'down'], 'alt'), voicing: sel('Voicing', [['nearest', 'Nearest chord tone'], ['root', 'Root position']]), register: regP },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const chords = [];
    for (const k of keysFor(p.key)) chords.push(...progChords(p.type === 'major' ? 'ii-V-I' : 'minor-ii-V-i', k, { S }).slice(0, 3));
    const [lo, hi] = REG[p.register];
    emitMixed(b, voiceLedItems(chords, { order: SEVENTH_ORDERS[p.pattern].f, lo, hi, rootOnly: p.voicing === 'root', start: lo + 8 }), { center: 5, open: 'avoid' });
    return b.build({ label: 'degree' });
  },
});

const PROGS7 = ['cycle-dom7', 'cycle-251', 'I-vi-ii-V', 'iii-vi-ii-V', 'autumn', 'jazz-blues', 'rhythm-A', 'I-VI7-ii-V', 'I-III7-vi', 'minor-blues', 'giant-steps'];
const voiceLed = ex({
  id: 'arp-voice-led', module: M, level: 4, star: true,
  title: 'Voice-led 7th arpeggios over progressions',
  summary: 'One continuous line through real changes: each chord starts on the nearest chord tone.',
  about: 'This is how great jazz bassists and soloists connect chords. Every chord is arpeggiated, but instead of jumping back to each root, the line continues from the closest chord tone. You get smooth, melodic lines that outline the harmony perfectly, through the cycle, standards progressions, blues and rhythm changes.',
  tips: ['Keep 8th notes even and let the line breathe at phrase ends.', 'Switch the register to work the upper neck.'],
  source: 'Charlie Banacos & Janek Gwizdala (continuous arpeggio lines); Berklee Online Jazz Bass',
  params: { prog: progP(PROGS7), key: keyP(['1', '3', '5', '7']), pattern: orderP7(['alt', 'up', 'down', 'updown'], 'alt'), register: regP },
  bpm: 88, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const keys = PROGS7.slice(0, 2).includes(p.prog) ? [0] : keysFor(p.key);
    const chords = [];
    for (const k of keys) chords.push(...progChords(p.prog, k, { S }));
    const [lo, hi] = REG[p.register];
    emitMixed(b, voiceLedItems(chords, { order: SEVENTH_ORDERS[p.pattern].f, lo, hi, start: lo + 8 }), { center: 5, open: 'avoid' });
    return b.build({ label: 'degree' });
  },
});

const giant = variant(voiceLed, {
  id: 'arp-giant-steps', level: 6,
  title: 'Giant Steps arpeggios',
  summary: 'Coltrane changes: key centres a major 3rd apart, at tempo.',
  about: 'John Coltrane\'s "Giant Steps" moves between three keys a major 3rd apart (B, G, E♭) with V7 chords connecting them, often two chords per bar. Arpeggiating the changes in a continuous, voice-led line is one of the classic mastery tests for bassists and soloists.',
  defaults: { prog: 'giant-steps', key: '11', pattern: 'up' }, bpm: 100,
});

const rhythmChanges = variant(voiceLed, {
  id: 'arp-rhythm-changes', level: 6,
  title: 'Rhythm changes arpeggios (A section)',
  summary: 'I-vi-ii-V turnarounds two chords per bar, in all keys.',
  about: 'The A section of "I Got Rhythm" changes chord every two beats. Outlining it with voice-led arpeggios at tempo is a standard benchmark in jazz programmes. Then move it around the cycle.',
  defaults: { prog: 'rhythm-A', key: '10' }, bpm: 120,
});

const guideTones = ex({
  id: 'arp-guide-tones', module: M, level: 4,
  title: 'Guide-tone lines (3rds and 7ths)',
  summary: 'Only the 3rd and 7th of every chord, voice-led: the skeleton of the harmony.',
  about: 'The 3rd and 7th define a chord\'s quality. In a ii–V–I the 7th of one chord falls a half step to the 3rd of the next, and the 3rd stays to become the 7th. Playing only these "guide tones" teaches you how harmony moves and gives you a powerful melodic line for solos and chord melody.',
  tips: ['Sing the line: it moves by half steps and common tones.', 'Then add the root on beat 1 of each bar.'],
  source: 'Berklee Online Jazz Bass L3; jazz harmony pedagogy (guide-tone lines)',
  params: { prog: progP(['ii-V-I', 'cycle-dom7', 'autumn', 'jazz-blues', 'I-vi-ii-V', 'minor-ii-V-i']), key: keyP(['1', '3', '5', '7']), start: sel('Start on', [['3', 'the 3rd'], ['7', 'the 7th']]) },
  bpm: 80, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const items = [];
    let prev = null;
    for (const k of keysFor(p.key)) {
      for (const c of progChords(p.prog, k, { S })) {
        const third = c.ivs[1], seventh = c.ivs[3] || 'b7';
        const pick = (iv) => {
          const pcv = T.mod(T.pc(c.root) + T.semis(iv), 12);
          let best = null;
          for (let m = 40; m <= 60; m++) if (T.mod(m, 12) === pcv && (best == null || Math.abs(m - (prev ?? 50)) < Math.abs(best - (prev ?? 50)))) best = m;
          return { midi: best, n: T.up(c.root, iv), deg: T.fmtDeg(iv) };
        };
        const firstIv = (items.length === 0 ? (p.start === '3' ? third : seventh) : null);
        let a;
        if (firstIv) a = pick(firstIv);
        else { const t3 = pick(third), t7 = pick(seventh); a = Math.abs(t3.midi - prev) <= Math.abs(t7.midi - prev) ? t3 : t7; }
        prev = a.midi;
        const other = a.deg === T.fmtDeg(third) ? seventh : third;
        const bnote = pick(other);
        prev = bnote.midi;
        const half = c.beats / 2;
        items.push({ ...a, dur: half, chord: c.sym }, { ...bnote, dur: half });
      }
    }
    emitMixed(b, items, { center: 6, open: 'avoid' });
    return b.build({ uniform: false, label: 'degree' });
  },
});

const dimDominants = ex({
  id: 'arp-dim-dominants', module: M, level: 5,
  title: 'Barry Harris: one diminished chord, four dominants',
  summary: 'Lower any note of a dim7 a half step and you get a dominant 7th: four for the price of one.',
  about: 'A diminished 7th chord is symmetric (all minor 3rds). Lower any one of its four notes by a half step and it becomes a dominant 7th chord. From Bdim7 (B D F A♭): lower B and you get B♭7, lower D gives D♭7, lower F gives E7 and lower A♭ gives G7. The exercise plays the dim7, then each derived dominant, so you see four related dominants a minor 3rd apart: the key to bebop harmony and tritone substitution.',
  tips: ['The four dominants are a minor 3rd apart (G7, B♭7, D♭7, E7).', 'Their roots are the notes you lowered, one fret down.'],
  source: 'Barry Harris workshops (diminished concept); "The Barry Harris Approach to Improvised Lines and Harmony"',
  params: { key: keyP(['1', 'b3', 'b5', 'bb7'], { cycles: false, def: '11' }) },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const k = Number(p.key);
    const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 9, prefer: 'A' });
    const dimRoot = T.bestRoot(k, ivsOf('dim7'));
    const dim = chordTones(dimRoot, ivsOf('dim7'), r.midi, [0, 1, 2, 3]);
    b.chord(chordName(dimRoot, 'dim7', S), 'diminished');
    b.line([...dim, ...[...dim].reverse()], { pattern: false, place: { open: 'avoid', center: r.f + 1 } });
    for (let i = 0; i < 4; i++) {
      const loweredMidi = dim[i].midi - 1;
      const domRoot = T.bestRoot(T.mod(loweredMidi, 12), ivsOf('dom7'));
      const tones = dim.map((t, j) => (j === i ? loweredMidi : t.midi)).sort((a, c) => a - c);
      const items = tones.map((m) => {
        const iv = ['1', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'][T.mod(m - loweredMidi, 12)];
        return { midi: m, n: T.up(domRoot, iv), deg: T.fmtDeg(iv) };
      });
      items[0].chord = chordName(domRoot, 'dom7', S);
      items[0].text = `lower ${nm(dim[i].n, S)}`;
      b.line([...items, ...[...items].reverse()], { pattern: false, place: { open: 'avoid', center: r.f + 1 } });
    }
    return b.build({ label: 'degree' });
  },
});

const dimToMinor = ex({
  id: 'arp-dim-to-minor', module: M, level: 5,
  title: 'Diminished to minor (rootless 7♭9 resolution)',
  summary: 'C♯°7 up, Dm down: the leading-tone diminished chord resolving, in every key.',
  about: 'A diminished 7th built on the leading tone is a dominant 7♭9 without its root (C♯°7 = A7♭9). Play it ascending and resolve to the minor triad descending. Through the cycle this gives a classic, dramatic bebop phrase.',
  tips: ['Each diminished note resolves by half step or common tone.', 'Hear A7♭9 → Dm even though the A is never played.'],
  source: 'Janek Gwizdala (dim7 → minor arpeggio drill); bebop vocabulary',
  params: { key: keyP(['1', 'b3', '5'], { def: 'cycle4', suffix: 'm' }) },
  bpm: 80, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const items = [];
    let prev = null;
    for (const k of keysFor(p.key)) {
      const minor = T.bestRoot(k, ivsOf('min'));
      // the leading tone, spelled in the key (F𝄪 in G♯ minor), so every resolution is visible
      const lt = T.up(minor, '7');
      const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 8, prev, prefer: 'A' });
      const ltMidi = r.midi - 1;
      chordTones(lt, ivsOf('dim7'), ltMidi, [0, 1, 2, 3]).forEach((t, j) => items.push({ ...t, chord: j === 0 ? chordName(lt, 'dim7', S) : undefined }));
      chordTones(minor, ivsOf('min'), r.midi, [3, 2, 1, 0]).forEach((t, j) => items.push({ ...t, chord: j === 0 ? chordName(minor, 'min', S) : undefined }));
      prev = r.midi;
    }
    emitMixed(b, items.map((x) => ({ ...x, dur: 1 })), { center: 5, open: 'avoid' });
    return b.build({ label: 'degree' });
  },
});

const EXT = { 9: [0, 2, 4, 6, 8], 11: [0, 2, 4, 6, 8, 10], 13: [0, 2, 4, 6, 8, 10, 12] };
const COMPOUND = { '2': '9', 'b2': '♭9', '#2': '♯9', '4': '11', '#4': '♯11', '6': '13', 'b6': '♭13' };
const extended = ex({
  id: 'arp-extended', module: M, level: 5,
  title: 'Extended arpeggios: 9ths, 11ths, 13ths',
  summary: 'Keep stacking 3rds past the 7th, through the harmonised scale.',
  about: 'Above the 7th the stack continues: 9, 11, 13. Through the harmonised scale this gives maj9, m9, m11, dominant 13 and other colours. These arpeggios cover two octaves and are a great reach and shifting workout, and they reveal the tensions behind jazz and neo-soul chords.',
  tips: ['The 9 is the 2nd an octave up, the 11 is the 4th, the 13 is the 6th.', 'Watch out for the "avoid note" 11 on major chords: hear the clash.'],
  source: 'RSL Grade 7 (9ths), LCM Grade 8 (11ths/13ths); TalkingBass Chord Tone Essentials',
  params: { key: keyP(T.SCALES.ionian.iv), ext: sel('Up to', [['9', '9ths'], ['11', '11ths'], ['13', '13ths']]), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'dorian', 'melodicMinor'])), order: sel('Chords', [['up', 'I → I'], ['fourths', 'In 4ths']]) },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const r = pickRoot(ctx, k, { strings: ['E'], hi: 7, prev });
      const offs = EXT[p.ext];
      const stacks = diatonicStacks(tonic, p.scale, [0, 2, 4, 6], S);
      DEG_SEQ[p.order].forEach((d, i) => {
        const st = stacks[d % 7];
        const base = d % 7;
        const idxs = offs.map((o) => base + o);
        const seq = i % 2 ? [...idxs].reverse() : idxs;
        const items = seq.map((idx, j) => {
          const t = scaleTone(tonic, p.scale, r.midi, idx, st.root);
          const raw = T.ivBetween(st.root, t.n);
          return { ...t, deg: idx - base >= 7 ? (COMPOUND[raw] || T.fmtDeg(raw)) : t.deg, chord: j === 0 ? st.sym : undefined, text: j === 0 ? st.roman : undefined };
        });
        const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
        const top = Math.max(...items.map((x) => x.midi));
        const fold = top > highest ? -12 : 0;
        b.line(items.map((x) => ({ ...x, midi: x.midi + fold })), { pattern: false, place: { open: 'avoid', center: r.f + 3 } });
      });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const upper = ex({
  id: 'arp-upper-structure', module: M, level: 5,
  title: 'Upper-structure arpeggios (3-5-7-9)',
  summary: 'Start each chord on its 3rd: Em7 over Cmaj7 gives Cmaj9. Instant sophistication.',
  about: 'Playing the arpeggio that starts on the 3rd of a chord (3-5-7-9) gives you its upper structure: over Cmaj7 you play Em7 and hear Cmaj9. Through the harmonised scale this is a quick way to sound modern, and it trains you to think of chords as layers.',
  tips: ['Compare: play R-3-5-7, then 3-5-7-9 on the same chord.', 'Works great over a pedal note (open string).'],
  source: 'Jazz superimposition (Mark Levine, Berklee); Gwizdala',
  params: { key: keyP(T.SCALES.ionian.iv), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'dorian'])), pattern: orderP7(['up', 'alt'], 'alt') },
  bpm: 76, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 7, prefer: 'E' });
      const stacks = diatonicStacks(tonic, p.scale, [0, 2, 4, 6], S);
      const items = [];
      DEG_SEQ.up.forEach((d, i) => {
        const st = stacks[d % 7];
        SEVENTH_ORDERS[p.pattern].f(i).map((x) => [2, 4, 6, 8][x] + d).forEach((idx, j) => {
          const t = scaleTone(tonic, p.scale, r.midi, idx, st.root);
          const raw = T.ivBetween(st.root, t.n);
          items.push({ ...t, deg: idx - d >= 7 ? (COMPOUND[raw] || T.fmtDeg(raw)) : t.deg, chord: j === 0 ? st.sym : undefined, text: j === 0 ? `${st.roman} → 3-5-7-9` : undefined });
        });
      });
      b.line(items, { place: { open: 'avoid', center: r.f + 3 } });
    }
    return b.build({ label: 'degree' });
  },
});

const PERM7 = { '0213': '1-5-3-7', '1032': '3-1-7-5', '3210': '7-5-3-1', '2031': '5-1-7-3', '0123': '1-3-5-7', '1230': '3-5-7-1' };
const perms7 = ex({
  id: 'arp-permutations', module: M, level: 5,
  title: '7th chord permutations',
  summary: '1-5-3-7, 3-1-7-5, 7-5-3-1… through the harmonised scale.',
  about: 'Reordering the four chord tones creates new melodic shapes with wider intervals. Run them through the diatonic 7th chords to break out of "always up from the root" and to build the vocabulary that makes lines sound composed.',
  tips: ['"Rotate" changes the permutation on every chord.', 'These cells are great as 16th-note fills.'],
  source: 'Common mastery practice; bebop vocabulary',
  params: { key: keyP(['1', '3', '5', '7']), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor'])), perm: sel('Order', [...Object.entries(PERM7), ['rotate', 'Rotate']]), order: degSeqP },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const keys = Object.keys(PERM7);
    const order = (i) => (p.perm === 'rotate' ? keys[i % keys.length] : p.perm).split('').map(Number);
    return diatonicBuild({ ...p, root: 'A' }, ctx, S, { offsets: [0, 2, 4, 6], order }).build({ label: 'degree' });
  },
});

const approach7 = ex({
  id: 'arp-approach', module: M, level: 5,
  title: 'Arpeggios with approach notes & enclosures',
  summary: 'Every chord tone targeted chromatically, through ii–V–I in all keys.',
  about: 'The bebop way to outline changes: each chord tone is approached from a half step below, from above, or "enclosed" (above, below, target). Every chord tone lands on a beat, and the approach notes lead into the next one: 8th notes with a single approach note, triplets with an enclosure. This is the core of jazz walking lines and solos (Berklee level exams).',
  tips: ['Accent the targets, play approach notes lighter.', 'The enclosure (above-below-target) fills the beat as a triplet: target, above, below, then the next target on the beat.', 'Approach notes are labelled →.'],
  source: 'Berklee level exams (approach notes); TalkingBass Chord Tone Essentials; David Baker',
  params: { key: keyP(['1', '3', '5', '7'], { def: 'cycle4' }), approach: sel('Approach', [['below', 'Half step below'], ['above', 'Half step above'], ['enclosure', 'Enclosure']]), prog: progP(['ii-V-I', 'minor-ii-V-i', 'I-vi-ii-V']) },
  bpm: 84, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const chords = [];
    for (const k of keysFor(p.key)) chords.push(...progChords(p.prog, k, { S }));
    const base = voiceLedItems(chords, { order: SEVENTH_ORDERS.alt.f, lo: 33, hi: 57, start: 40 });
    // target on the beat, then the approach notes into the next target (the last one leads back to the first)
    const apps = (m) => (p.approach === 'below' ? [m - 1] : p.approach === 'above' ? [m + 1] : [m + 1, m - 1]);
    const per = apps(0).length + 1;
    const items = [];
    base.forEach((t, i) => {
      items.push({ ...t, accent: true, dur: 1 / per });
      const nx = base[(i + 1) % base.length];
      let a = apps(nx.midi);
      // never "approach" with the note just played: come from the other side of the target
      if (a[0] === t.midi) a = a.map((m) => 2 * nx.midi - m);
      for (const m of a) items.push({ midi: m, n: spellMidi(m, m > nx.midi), deg: '→', dur: 1 / per });
    });
    emitMixed(b, items, { center: 5, open: 'avoid' });
    return b.build({ label: 'degree', uniform: false, sub: per });
  },
});

const altered = ex({
  id: 'arp-altered-dominants', module: M, level: 5,
  title: 'Altered dominants resolving',
  summary: '7♯5, 7♭5, 7♭9, 7♯9 arpeggios, each resolving to Imaj7.',
  about: 'Altered dominant chords add tension before resolving to the tonic. Each arpeggio is played and then resolved to the I chord a 5th below, so you hear the tension and the release. These colours are required at RSL Grade 8 and LCM Grades 7–8.',
  tips: ['Find the altered note and where it resolves (e.g. ♯5 → 3 of I).', 'Go through all 12 keys with the cycle option.'],
  source: 'RSL Grade 8; LCM Grades 7–8; jazz harmony',
  params: { alt: sel('Dominant', [['dom7s5', '7♯5'], ['dom7b5', '7♭5'], ['dom7b9', '7♭9'], ['dom7s9', '7♯9']]), key: keyP(['1', '3', '5', '7']) },
  bpm: 72, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S, { jazz: true });
    const chords = [];
    for (const k of keysFor(p.key)) {
      const I = T.bestRoot(k, ivsOf('maj7'));
      const V = T.up(I, '5');
      chords.push({ root: V, ivs: ivsOf(p.alt), sym: chordName(V, p.alt, S) }, { root: I, ivs: ivsOf('maj7'), sym: chordName(I, 'maj7', S) });
    }
    emitMixed(b, voiceLedItems(chords, { order: (i, n) => (i % 2 ? [3, 2, 1, 0] : [...Array(n).keys()]), lo: 33, hi: 60, start: 40 }), { center: 5, open: 'avoid' });
    return b.build({ label: 'degree' });
  },
});

const diatonic7AllKeys = variant(diatonic7, {
  id: 'arp-diatonic-all-keys', level: 6,
  title: 'Diatonic 7ths in all 12 keys (up one, down the next)',
  summary: 'The harmonised scale in 7th chords through the whole cycle, alternating directions.',
  about: 'Every diatonic 7th chord of every key, without stopping: Imaj7 up, iim7 down, iiim7 up… then the next key in the cycle. Switch inversions and scales (harmonic and melodic minor) for a complete conservatory-level workout.',
  defaults: { key: 'cycle4', pattern: 'alt' }, bpm: 66,
});

const BROKEN_CHORDS = [
  ...QUALITY_TRIADS.slice(0, 4).map(([k, n]) => [k, `${n} triad`]),
  ...QUALITY_7THS.filter(([k]) => k !== 'maj6' && k !== 'min6'),
];
const broken = ex({
  id: 'arp-broken', module: M, level: 3,
  title: 'Broken chords: every triad and 7th',
  summary: 'The chord climbs through its inversions in small cells: 1-3-5-3, 3-5-8-5… (triads), 1-3-5-3, 3-5-7-5… (7ths).',
  about: 'A broken chord plays the chord tones in small cells instead of straight up and down: 1-3-5-3, then the same cell from the next chord tone (3-5-8-5 on a triad, 3-5-7-5 on a 7th chord), and so on up to the top note, then back down to the root. It is a classic arpeggio study and teaches you to start a chord from any of its notes. Choose any triad or 7th: major, minor, diminished, augmented, major 7, dominant 7, minor 7, half-diminished, diminished 7, minor-major 7, augmented major 7 and augmented 7.',
  tips: ['Say the degree of the first note of each cell: R, 3, 5, 7…', 'Keep the cells even: the turn back (the 4th note) is the one that tends to rush.'],
  source: 'Classical broken-chord studies (ABRSM piano grades); RSL and LCM arpeggio requirements',
  params: { quality: sel('Chord', BROKEN_CHORDS), key: keyP(['1', '3', '5']), shape: shapeP(['broken', 'broken535', 'broken4'], 'broken'), oct: sel('Range', [['1', '1 octave'], ['2', '2 octaves']]), root: rootStrP('A') },
  bpm: 66, sub: 4, label: 'degree',
  build(p, ctx, S) {
    return arpBuild(p, ctx, S, { ivs: ivsOf(p.quality), type: p.quality, shape: p.shape, octaves: Number(p.oct), rootStr: Number(p.oct) > 1 ? 'E' : p.root }).build({ label: 'degree', fixed: Number(p.oct) > 1 ? { root: 'E string (2 octaves start low)' } : {} });
  },
});

// the order inside each level is the order of the exercise numbers
export default [diatonic7AllKeys, qualities, study, broken, zoneCycle7, diatonic7, inversions, twoOct, diatonic7inv, iiVI, voiceLed, guideTones, dimDominants, dimToMinor, extended, upper, perms7, approach7, altered, rhythmChanges, giant];
void chordRootMidis;
