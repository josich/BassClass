// Triads: from the first shape to triad pairs, rudiments and upper structures.
import {
  T, Builder, keysFor, chordTones, ARP_SHAPES, ex, variant, keyP, sel, nm, chordName, cycleRoot, QUALITY_TRIADS,
  ZONES, zoneP, rootStrP, orderP, pickRoot, zoneShape, emitShapeF, TRIAD_ORDERS, shapes, voiceLedItems,
  emitMixed, progChords, progP, diatonicStacks, scaleTone, DEG_SEQ, degSeqP, SCALE_TYPE_OPTS, spellMidi,
  shapeFingers,
} from './common.js';

const M = 'triads';
const ivsOf = (q) => T.CHORDS[q].iv;
const triadOrderP = (keys, def) => sel('Pattern', keys.map((k) => [k, TRIAD_ORDERS[k].name]), def);
const arpShapeP = (keys, def) => sel('Pattern', keys.map((k) => [k, ARP_SHAPES[k].name]), def);

/** Shared arpeggio builder (also used by the 7th-chord module). */
export function arpBuild(p, ctx, S, { ivs, type, shape = 'updown', octaves = 1, inversion = 0, rootStr = 'A' }) {
  const b = new Builder(ctx, S);
  const keys = keysFor(p.key);
  let prev = null;
  for (const k of keys) {
    const root = T.bestRoot(k, ivs);
    const many = keys.length > 1;
    const r = pickRoot(ctx, k, { strings: many ? ['E', 'A'] : [rootStr], hi: many ? 8 : 12, prev, prefer: rootStr });
    const idxs = ARP_SHAPES[shape].f(ivs.length, octaves);
    b.chord(chordName(root, type, S));
    b.line(chordTones(root, ivs, r.midi, idxs, inversion), { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f } });
    prev = r.midi;
  }
  return b;
}

const SCALES_DIATONIC = ['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor', 'dorian', 'phrygian', 'lydian', 'mixolydian', 'locrian'];
const SCALES_ALL7 = [...SCALES_DIATONIC, 'dorianB2', 'lydianAug', 'lydianDom', 'mixolydianB6', 'locrianN2', 'altered', 'phrygianDom', 'dorianS4', 'ionianAug', 'locrianN6', 'lydianS2', 'harmonicMajor'];
const STACKS = {
  thirds: { name: 'Triads (1-3-5)', off: [0, 2, 4] },
  sus4: { name: 'Sus4 stacks (1-4-5)', off: [0, 3, 4] },
  sus2: { name: 'Sus2 stacks (1-2-5)', off: [0, 1, 4] },
  quartal: { name: 'Quartal (1-4-7)', off: [0, 3, 6] },
  spread: { name: 'Shell 1-5-3 (spread)', off: [0, 4, 9] },
};

/** Diatonic chord-stack exercise (triads, sus, quartal...) in one key or all keys. */
export function diatonicBuild(p, ctx, S, { offsets, order, inversion = 0, sizeLabel }) {
  const b = new Builder(ctx, S);
  const keys = keysFor(p.key);
  let prev = null;
  for (const k of keys) {
    const ivs = T.SCALES[p.scale].iv;
    const tonic = T.bestRoot(k, ivs);
    const many = keys.length > 1;
    const r = pickRoot(ctx, k, { strings: many ? ['E', 'A'] : [p.root || 'A'], hi: many ? 7 : 10, prev, prefer: p.root || 'A' });
    const stacks = diatonicStacks(tonic, p.scale, offsets, S, { inversion });
    const items = [];
    const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
    (DEG_SEQ[p.order] || DEG_SEQ.up).forEach((d, i) => {
      const st = stacks[d % 7];
      const oct = Math.floor(d / 7) * 7;
      const group = order(i, offsets.length).map((ti, j) => {
        const idx = st.idxs[ti % st.idxs.length] + oct + Math.floor(ti / st.idxs.length) * 7;
        return {
          ...scaleTone(tonic, p.scale, r.midi, idx, st.root),
          chord: j === 0 ? st.sym : undefined, text: j === 0 ? st.roman : undefined,
        };
      });
      // fold a chord down an octave when it would run off the top of the neck
      const top = Math.max(...group.map((g) => g.midi));
      const low = Math.min(...group.map((g) => g.midi));
      let fold = 0;
      while (top + fold > highest && low + fold - 12 >= ctx.tuning[0]) fold -= 12;
      items.push(...group.map((g) => ({ ...g, midi: g.midi + fold })));
    });
    if (many) items[0].text = `${nm(tonic, S)} ${T.SCALES[p.scale].name}`;
    // fingered in played order so every chord stays a compact shape
    b.line(items, { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 1 } });
    prev = r.midi;
  }
  return b;
}

// ---------------------------------------------------------------- shapes & basics

const triadQualities = ex({
  id: 'tri-qualities', module: M, level: 2,
  title: 'Triad qualities: major, minor, dim, aug, sus',
  summary: 'Every triad type as a movable shape, in any key or all 12.',
  about: 'A triad stacks two thirds: root (R), 3rd and 5th. Major = R-3-5, minor = R-♭3-5, diminished = R-♭3-♭5, augmented = R-3-♯5. Sus chords replace the 3rd with a 2nd or 4th. Each quality has its own shape on the neck; learn the shape and the sound together and say the degrees aloud.',
  tips: ['Major with root on finger 2: 3rd one string up and one fret back (finger 1), 5th one string up and two frets forward (finger 4).',
    'Minor with root on finger 1: ♭3 three frets up on the same string (finger 4), 5th one string up two frets forward (finger 3).',
    'Use "All 12 · cycle of 4ths" once a shape is comfortable. That is how every academy drills it.'],
  source: 'RSL Grade 1–3, LCM, StudyBass Fundamentals, TalkingBass Chord Tone Essentials',
  params: { quality: sel('Triad', QUALITY_TRIADS), key: keyP(), root: rootStrP('A'), shape: arpShapeP(['updown', 'octave', 'up', 'turn', 'r535', 'down']) },
  bpm: 70, sub: 2, label: 'degree',
  build(p, ctx, S) {
    return arpBuild(p, ctx, S, { ivs: ivsOf(p.quality), type: p.quality, shape: p.shape, rootStr: p.root }).build({ label: 'degree' });
  },
});

const triadShape = variant(triadQualities, {
  id: 'tri-shape', level: 1,
  title: 'Your first triads: major & minor',
  summary: 'Root, 3rd and 5th: the building block of every bass line.',
  about: 'A triad stacks two thirds: root (R), 3rd and 5th. Major = R-3-5, minor = R-♭3-5. The two shapes differ by one note, the 3rd, which is what makes a chord sound happy or sad. Learn each shape and its sound together, and say the degrees out loud.',
  defaults: { shape: 'updown' }, only: { quality: ['maj', 'min'] }, bpm: 60, sub: 1,
});

const fourTypes = ex({
  id: 'tri-four-types', module: M, level: 2,
  title: 'Four triad types from one root',
  summary: 'Major → minor → diminished → augmented on the same root: hear each colour change.',
  about: 'Keep the root fixed and change only the 3rd and 5th. Major to minor lowers the 3rd; minor to diminished lowers the 5th; augmented raises the 5th of the major triad. Each one is played twice, so you feel the shape before moving on.',
  tips: ['Sing the 3rd before you play it.', 'Notice which finger moves when the quality changes: major → minor and minor → diminished move one note each; diminished → augmented moves both the 3rd and the 5th.'],
  source: 'TalkingBass free lesson "The four triad types"; RSL/LCM grades 3–5',
  // one root for all four chords, named to keep their spelling simplest
  params: { key: keyP(['1', '3', 'b3', '5', 'b5', '#5']), root: rootStrP('A') },
  bpm: 70, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const r = pickRoot(ctx, k, { strings: [p.root, 'A', 'E'], hi: 10, prev, prefer: p.root });
      const items = [];
      for (const q of ['maj', 'min', 'dim', 'aug']) {
        const ivs = ivsOf(q);
        const root = T.bestRoot(k, ['1', '3', 'b3', '5', 'b5', '#5']);
        for (let rep = 0; rep < 2; rep++) {
          chordTones(root, ivs, r.midi, [0, 1, 2, 3, 2, 1]).forEach((t, j) =>
            items.push({ ...t, chord: j === 0 && rep === 0 ? chordName(root, q, S) : undefined }));
        }
      }
      b.line(items, { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const majVsMin = ex({
  id: 'tri-maj-min', module: M, level: 1,
  title: 'Major vs minor: hear the 3rd',
  summary: 'Alternate C and Cm. Only one note changes.',
  about: 'The 3rd is the note that makes a chord sound happy (major) or sad (minor). Play the major triad, then move only the 3rd down one fret for the minor. Listen for the colour change.',
  tips: ['Watch the blue dot: it is the only one that moves.', 'Try it with your eyes closed after a few rounds.'],
  source: 'Common to all methods (StudyBass, BassBuzz, Hal Leonard)',
  // one root for both chords, named so neither needs a double flat (F♯ and F♯m, not G♭m)
  params: { key: keyP(['1', '3', 'b3', '5']), root: rootStrP('A') },
  bpm: 66, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const r = pickRoot(ctx, k, { strings: [p.root], hi: 10, prev, prefer: p.root });
      const root = T.bestRoot(k, ['1', '3', 'b3', '5']);
      const items = [];
      for (const q of ['maj', 'min']) {
        chordTones(root, ivsOf(q), r.midi, [0, 1, 2, 1]).forEach((t, j) => items.push({ ...t, chord: j === 0 ? chordName(root, q, S) : undefined }));
      }
      b.line(items, { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

// ---------------------------------------------------------------- zones (SBL warm-ups)

const zoneCycle = ex({
  id: 'tri-zone-cycle', module: M, level: 2, star: true,
  title: 'Triads around the cycle in one zone',
  summary: 'All 12 triads without leaving a 5-fret zone. The zone decides the shape.',
  about: 'This is the "Circle of 5ths + Zones" warm-up. The neck is split into zones (frets 1–5, 5–9, 8–12). Play the triad of every key around the cycle of 4ths (C F B♭ E♭ A♭ D♭ G♭ B E A D G) and never leave the zone. A minor or diminished chord whose cycle name would need a double flat takes its simpler name (F♯m, not G♭m; D♯°, not E♭°). To stay inside the zone you have to use different fingerings, so you learn where every chord lives in that area of the neck. Spend a couple of weeks on Zone 1 before moving to Zone 2, then Zone 3.',
  tips: ['No open strings: every shape must be movable.', 'Say the chord name before you play it, then find the root inside the zone first.',
    'Then switch to minor, diminished and augmented in the same zone.', 'Gary Willis\' advice: the notes are already under your fingers, so do not move the hand.'],
  source: 'Scott Devine (Scott\'s Bass Lessons), "The Circle of 5ths + ZONES" and "3 Rule Fretboard Formula"',
  params: { quality: sel('Triad', QUALITY_TRIADS.slice(0, 5)), zone: zoneP, order: orderP, pattern: triadOrderP(['turn', 'up', 'down', 'alt', 'updown', 'r535'], 'turn') },
  bpm: 80, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const zone = ZONES[p.zone];
    let prev = null;
    keysFor(p.order).forEach((k, i) => {
      const root = cycleRoot(k, ivs);
      const z = zoneShape(k, ivs, ctx, zone, prev);
      if (!z) return;
      b.chord(chordName(root, p.quality, S));
      emitShapeF(b, root, ivs, z.pos, TRIAD_ORDERS[p.pattern].f(i));
      prev = z.rootMidi;
    });
    return b.build({ label: 'degree', zone });
  },
});

/** All compact shapes of a triad across the neck, sorted by position. */
function neckShapes(k, ivs, ctx, maxFret = 15) {
  const out = [];
  const seen = new Set();
  for (let rm = ctx.tuning[0] + 1; rm <= ctx.tuning[ctx.tuning.length - 1] + maxFret; rm++) {
    if (T.mod(rm, 12) !== k) continue;
    const midis = ivs.map((iv) => rm + T.semis(iv));
    for (const sh of shapes(midis, ctx, { lo: 1, hi: maxFret, maxSpan: 4 })) {
      const key = sh.pos.map((q) => `${q.s}.${q.f}`).join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const fr = sh.pos.map((q) => q.f);
      const lo = Math.min(...fr);
      const fingers = shapeFingers(sh.pos);
      out.push({ pos: sh.pos, lo, rootFinger: fingers[0], rootS: sh.pos[0].s, rm, cost: sh.cost });
    }
  }
  return out.sort((a, b) => a.lo - b.lo || a.rootS - b.rootS);
}

const threeForms = ex({
  id: 'tri-three-forms', module: M, level: 3, star: true,
  title: 'The 3 triad fingerings (root under finger 1, 2 or 4)',
  summary: 'Every triad can be fingered three ways. Learn all three and the neck connects.',
  about: 'A triad shape is defined by which finger plays the root. With the root under finger 2, the 3rd and 5th are on the next string. With the root under finger 1, the 3rd is on the same string and the 5th is on the next string. With the root under finger 4, the shape crosses three strings going back toward the nut. Knowing all three means there are no "dead areas" on the neck: wherever your hand is, one of the shapes fits.',
  tips: ['Name the form out loud: "two", "one", "four".', 'The finger-1 form needs a small stretch or pivot for the 3rd.', 'Repeat with minor triads: the forms change but the rule is the same.'],
  source: 'SBL "3 Rule Fretboard Formula"; TalkingBass "3 fingerings per arpeggio"; LCM multi-position arpeggios',
  params: { key: keyP(['1', '3', '5'], { cycles: false }), quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), pattern: triadOrderP(['turn', 'up', 'updown'], 'turn') },
  bpm: 70, sub: 1, label: 'finger',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const k = Number(p.key);
    const root = T.bestRoot(k, ivs);
    const all = neckShapes(k, ivs, ctx, 14);
    const picked = [];
    for (const fgr of [2, 1, 4, 3]) {
      const s = all.find((x) => x.rootFinger === fgr);
      if (s) picked.push(s);
    }
    picked.sort((a, b2) => a.lo - b2.lo);
    for (const s of picked) {
      b.chord(chordName(root, p.quality, S), `Root on finger ${s.rootFinger}`);
      emitShapeF(b, root, ivs, s.pos, TRIAD_ORDERS[p.pattern].f(0));
    }
    return b.build({ label: 'finger' });
  },
});

const neckChain = ex({
  id: 'tri-neck-chain', module: M, level: 3,
  title: 'One triad, every shape up the neck',
  summary: 'Chain every fingering of one triad from the nut to fret 15 and back.',
  about: 'Take one chord and play every compact shape of it, moving up the neck. You will alternate between the three fingerings and between octaves. When you can do this in any key, you can find any chord anywhere.',
  tips: ['Look ahead: find the next shape while you play the current one.', 'Try it with eyes closed on the way back down.'],
  source: 'SBL "3 Rule Fretboard Formula" (Exercise 4); TalkingBass whole-neck coverage',
  params: { key: keyP(['1', '3', '5'], { cycles: false }), quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), dir: sel('Direction', [['updown', 'Up the neck & back'], ['up', 'Up the neck']]), pattern: triadOrderP(['up', 'turn'], 'up') },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const k = Number(p.key);
    const root = T.bestRoot(k, ivs);
    const all = neckShapes(k, ivs, ctx, 15);
    const seq = p.dir === 'updown' ? [...all, ...all.slice(0, -1).reverse()] : all;
    seq.forEach((s, i) => {
      if (i === 0 || i === all.length) b.chord(chordName(root, p.quality, S));
      const ord = p.dir === 'updown' && i >= all.length ? [...TRIAD_ORDERS[p.pattern].f(0)].reverse() : TRIAD_ORDERS[p.pattern].f(0);
      emitShapeF(b, root, ivs, s.pos, ord);
    });
    return b.build({ label: 'degree' });
  },
});

// ---------------------------------------------------------------- inversions

const inversions = ex({
  id: 'tri-inversions', module: M, level: 3,
  title: 'Triad inversions: root, 1st, 2nd',
  summary: 'R-3-5, 3-5-R, 5-R-3: same chord, different bottom note.',
  about: 'An inversion starts a chord on a note other than the root. 1st inversion starts on the 3rd (3-5-R), 2nd inversion starts on the 5th (5-R-3). "Climbing" stacks the inversions up the neck. "In position" keeps all three around the root, the way you use them in real bass lines to move smoothly between chords.',
  tips: ['Keep the degree labels on: always know which note is the root.', 'In position: the 2nd inversion borrows the 5th from below the root.'],
  source: 'LCM Grade 6, Spanish conservatory access tests, TalkingBass Chord Tone Essentials',
  params: { key: keyP(), quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), mode: sel('Layout', [['climb', 'Climbing the neck'], ['position', 'In one position']]), root: rootStrP('E') },
  bpm: 70, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const root = T.bestRoot(k, ivs);
      const r = pickRoot(ctx, k, { strings: [p.root, 'E', 'A'], hi: p.mode === 'climb' ? 7 : 10, prev, prefer: p.root });
      const groups = p.mode === 'climb'
        ? [[0, 1, 2], [1, 2, 3], [2, 3, 4], [3, 4, 5], [5, 4, 3], [4, 3, 2], [3, 2, 1], [2, 1, 0]]
        : [[0, 1, 2], [1, 2, 3], [-1, 0, 1], [1, 0, -1], [3, 2, 1], [2, 1, 0]];
      const names = p.mode === 'climb' ? ['Root', '1st inv', '2nd inv', 'Root (8va)'] : ['Root', '1st inv', '2nd inv'];
      const items = [];
      groups.forEach((g, gi) => {
        chordTones(root, ivs, r.midi, g).forEach((t, j) => items.push({
          ...t, chord: gi === 0 && j === 0 ? chordName(root, p.quality, S) : undefined,
          text: j === 0 && gi < names.length ? names[gi] : undefined,
        }));
      });
      b.line(items, { place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 2 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const twoOctave = ex({
  id: 'tri-two-octaves', module: M, level: 4,
  title: 'Two-octave triads',
  summary: 'R-3-5-8-10-12-15 and back, with one clean shift.',
  about: 'Spread a triad over two octaves. Play the first octave in position, shift at the octave and repeat the shape higher. Plan where the shift happens, and use the same shift on the way down.',
  tips: ['Shift on a slide of the finger that just played. Do not jump.', 'Start the root on the E string so there is room above.'],
  source: 'RSL Grade 5–7, LCM Grade 6, TalkingBass two-octave arpeggios',
  params: { key: keyP(), quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), root: rootStrP('E') },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    return arpBuild(p, ctx, S, { ivs: ivsOf(p.quality), type: p.quality, shape: 'updown', octaves: 2, rootStr: p.root }).build({ label: 'degree' });
  },
});

const stringSets = ex({
  id: 'tri-string-sets', module: M, level: 4,
  title: 'Triads on every string set',
  summary: 'One note per string: root, 1st and 2nd inversion on E-A-D and A-D-G.',
  about: 'Here each note of the triad sits on its own string, across three adjacent strings. On each string set you play root position, 1st inversion and 2nd inversion, moving up the neck. These "spread" shapes are the ones chordal bassists and soloists use.',
  tips: ['Use one finger per note and let the notes ring as a chord at the end.', 'On a 5-string you also get the B-E-A set.'],
  source: 'Common chord-study practice (Berklee Chord Studies for Electric Bass, MI)',
  params: { key: keyP(['1', '3', '5'], { cycles: false }), quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)) },
  bpm: 70, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const k = Number(p.key);
    const root = T.bestRoot(k, ivs);
    for (let s0 = 0; s0 + 2 < ctx.tuning.length; s0++) {
      const names = ctx.names.slice(s0, s0 + 3).join('-');
      for (let inv = 0; inv < 3; inv++) {
        // choose an octave so frets lie between 1 and 15 with a playable span
        let best = null;
        for (let rm = 12; rm < 90; rm++) {
          if (T.mod(rm, 12) !== k) continue;
          const tones = chordTones(root, ivs, rm, [0, 1, 2], inv);
          const pos = tones.map((t, i) => ({ s: s0 + i, f: t.midi - ctx.tuning[s0 + i] }));
          const fr = pos.map((q) => q.f);
          if (Math.min(...fr) < 1 || Math.max(...fr) > 15 || Math.max(...fr) - Math.min(...fr) > 4) continue;
          const score = Math.min(...fr) + inv * 0;
          if (!best || score < best.score) best = { score, tones, pos };
        }
        if (!best) continue;
        b.chord(inv === 0 ? chordName(root, p.quality, S) : null, `${names} · ${['root', '1st inv', '2nd inv'][inv]}`);
        const fingers = shapeFingers(best.pos);
        b.frets([0, 1, 2, 1].map((i) => ({ s: best.pos[i].s, f: best.pos[i].f, finger: fingers[i], n: best.tones[i].n, deg: best.tones[i].deg })));
      }
    }
    return b.build({ label: 'degree' });
  },
});

// ---------------------------------------------------------------- diatonic

const diatonic = ex({
  id: 'tri-diatonic', module: M, level: 3, star: true,
  title: 'Harmonized triads: I ii iii IV V vi vii°',
  summary: 'Build a triad on every note of the scale. The core of harmony on the bass.',
  about: 'Stack a 3rd and a 5th on every degree of a scale, using only notes from that scale. In major you get I (major), ii (minor), iii (minor), IV (major), V (major), vi (minor) and vii° (diminished). Play them in one position and hear how each chord sounds inside the key. Change the scale to harmonize natural minor, harmonic minor, melodic minor or any mode.',
  tips: ['Say the Roman numeral of each chord as you play it.', 'The "up one, down the next" pattern keeps the hand in one place. Try it.',
    'Then turn on 1st or 2nd inversion: same chords, new shapes.'],
  source: 'Berklee PULSE, Berklee Online Bass 101, StudyBass Fundamentals 3, Ariane Cap Music Theory for the Bass Player',
  params: {
    key: keyP(['1', '3', '5']), scale: sel('Scale', SCALE_TYPE_OPTS(SCALES_DIATONIC)), order: degSeqP,
    pattern: triadOrderP(['up', 'turn', 'alt', 'down', 'updown', 'r535'], 'up'),
    inversion: sel('Inversion', [['0', 'Root position'], ['1', '1st inversion'], ['2', '2nd inversion']]),
    stack: sel('Stack', Object.entries(STACKS).map(([k, v]) => [k, v.name])), root: rootStrP('A'),
  },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    return diatonicBuild(p, ctx, S, { offsets: STACKS[p.stack].off, order: TRIAD_ORDERS[p.pattern].f, inversion: Number(p.inversion) }).build({ label: 'degree' });
  },
});

const diatonicMinor = variant(diatonic, {
  id: 'tri-diatonic-minor', level: 4,
  title: 'Harmonized triads in minor scales',
  summary: 'Natural, harmonic and melodic minor: where the V chord becomes major and the augmented triad appears.',
  about: 'Harmonize the three minor scales. Natural minor gives i ii° III iv v VI VII. Harmonic minor raises the 7th, so V becomes major and III becomes augmented. Melodic minor also raises the 6th, giving i ii III+ IV V vi° vii°. These chords are behind most minor-key music and jazz.',
  defaults: { scale: 'harmonicMinor' }, only: { scale: ['aeolian', 'harmonicMinor', 'melodicMinor'] },
});

const diatonicInv = variant(diatonic, {
  id: 'tri-diatonic-inversions', level: 4,
  title: 'Harmonized triads in inversions',
  summary: 'The same diatonic chords starting from the 3rd or the 5th.',
  about: 'Play every diatonic triad in 1st inversion (3-5-R) or 2nd inversion (5-R-3). You get new shapes and new lines, and these are the inversions that make bass lines move smoothly.',
  defaults: { inversion: '1', pattern: 'turn' },
});

const diatonic4ths = variant(diatonic, {
  id: 'tri-diatonic-4ths', level: 4,
  title: 'Diatonic triads in 4ths (I-IV-vii°-iii-vi-ii-V-I)',
  summary: 'Move the chords in 4ths, the strongest root motion in music.',
  about: 'Root movement by 4ths (or 5ths down) is the backbone of real progressions: vi-ii-V-I, iii-vi-ii-V. This drills the diatonic cycle inside one key, so the progressions you meet later already feel familiar.',
  defaults: { order: 'fourths', pattern: 'alt' },
});

const diatonicModes = variant(diatonic, {
  id: 'tri-diatonic-modes', level: 5,
  title: 'Harmonized triads in all scales & modes',
  summary: 'Melodic and harmonic minor modes, Phrygian dominant, Lydian dominant, altered…',
  about: 'Any 7-note scale can be harmonized. Exotic scales produce exotic chord sets: Lydian dominant contains a major II, the altered scale is full of diminished and augmented triads, and Phrygian dominant has a major I with a major ♭II above it. Use this to hear and own the chords behind modern jazz and film-music colours.',
  params: { ...diatonic.params, scale: sel('Scale', SCALE_TYPE_OPTS(SCALES_ALL7), 'lydianDom') },
});

const susQuartal = variant(diatonic, {
  id: 'tri-sus-quartal', level: 5,
  title: 'Sus and quartal stacks through the scale',
  summary: 'Replace the 3rds with 4ths: modern, open sounds (McCoy Tyner, modal jazz, fusion).',
  about: 'Stack 4ths instead of 3rds and you get sus4 (1-4-5) or quartal (1-4-7) chords. They have no major/minor colour, which makes them ideal for modal music and fusion. On bass they lie flat across the strings (the same fret on neighbouring strings).',
  source: 'McCoy Tyner and modal-jazz quartal voicings; Mark Levine "The Jazz Theory Book" (sus and fourth chords); fusion bass practice',
  defaults: { stack: 'quartal', pattern: 'up' },
});

const openTriads = variant(diatonic, {
  id: 'tri-open-spread', level: 4,
  title: 'Open (spread) triads R-5-10',
  summary: 'Root, 5th and 10th: the big, open sound of piano left hands and chordal bass.',
  about: 'Move the 3rd up an octave and you get the open voicing R-5-10. It spans a wide interval and crosses strings, so your hand learns to leap. Play it through the harmonized scale for a full, orchestral sound.',
  defaults: { stack: 'spread', pattern: 'up', root: 'E' },
});

// ---------------------------------------------------------------- voice leading & progressions

const REGISTERS = { low: [28, 50], mid: [33, 57], high: [40, 64] };
const registerP = sel('Register', [['mid', 'Middle'], ['low', 'Low'], ['high', 'High']]);

const voiceLedCycle = ex({
  id: 'tri-voice-led-cycle', module: M, level: 4, star: true,
  title: 'Voice-led triads through all 12 keys',
  summary: 'Each chord starts on the nearest chord tone. Musical inversions, no jumping.',
  about: 'Instead of always starting on the root, start each new triad on the chord tone closest to where you are. This automatically picks the right inversion. It is how bass players, pianists and arrangers connect chords, and the cycle of 4ths becomes one continuous melodic line.',
  tips: ['Use "Up one, down the next" for a wave-like line.', 'Use "Root only" to compare with the old way: hear how much the hand jumps.'],
  source: 'Berklee Online Bass 101 (L8); Gwizdala / Banacos-style continuous lines',
  params: {
    order: sel('Key order', [['cycle4', 'Cycle of 4ths'], ['cycle5', 'Cycle of 5ths'], ['chromatic', 'Chromatic'], ['m3', 'Minor 3rds'], ['M3', 'Major 3rds'], ['wholetone', 'Whole tones']]),
    quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), pattern: triadOrderP(['alt', 'up', 'down', 'turn'], 'alt'),
    voicing: sel('Voicing', [['nearest', 'Nearest inversion'], ['root', 'Root position only']]), register: registerP,
  },
  bpm: 76, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const orders = { m3: [0, 3, 6, 9], M3: [0, 4, 8], wholetone: [0, 2, 4, 6, 8, 10] };
    const pcs = orders[p.order] ? [...orders[p.order], ...orders[p.order], 0] : keysFor(p.order);
    const chords = pcs.map((k) => { const root = cycleRoot(k, ivs); return { root, ivs, sym: chordName(root, p.quality, S) }; });
    const [lo, hi] = REGISTERS[p.register];
    emitMixed(b, voiceLedItems(chords, { order: TRIAD_ORDERS[p.pattern].f, lo, hi, rootOnly: p.voicing === 'root', start: lo + 8 }), { center: 5 });
    return b.build({ label: 'degree' });
  },
});

const PROG_KEYS_TRIAD = ['I-V-vi-IV', 'I-vi-IV-V', 'I-IV-V-I', 'vi-IV-I-V', 'canon', 'I-bVII-IV-I', 'ii-V-I', 'I-vi-ii-V', 'i-bVII-bVI-V', 'i-iv-V-i', 'i-bVI-bIII-bVII', 'I-bVI-bVII-I', 'blues'];

const progressions = ex({
  id: 'tri-progressions', module: M, level: 4,
  title: 'Triads over real progressions',
  summary: 'Pop, rock, jazz and minor progressions, each played as voice-led triads.',
  about: 'Put triads to work. Each chord of the progression is outlined with its triad, picking the inversion closest to the previous chord. Every song you will play is built from progressions like these.',
  tips: ['Name each chord\'s function (I, IV, V…) as you play it.', 'Then play only the roots, and hear how much smoother the voice-led version is.'],
  source: 'StudyBass Fundamentals 3, BassBuzz, Berklee Online Bass 101',
  params: { prog: progP(PROG_KEYS_TRIAD), key: keyP(['1', '3', '5']), pattern: triadOrderP(['turn', 'up', 'alt', 'r535', 'down'], 'turn'), voicing: sel('Voicing', [['nearest', 'Nearest inversion'], ['root', 'Root position']]), register: registerP },
  bpm: 84, sub: 1, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const chords = [];
    for (const k of keysFor(p.key)) chords.push(...progChords(p.prog, k, { triads: true, S }));
    const [lo, hi] = REGISTERS[p.register];
    emitMixed(b, voiceLedItems(chords, { order: TRIAD_ORDERS[p.pattern].f, lo, hi, rootOnly: p.voicing === 'root', start: lo + 8 }), { center: 5 });
    return b.build({ label: 'degree' });
  },
});

const allInversionsCycle = ex({
  id: 'tri-cycle-all-inversions', module: M, level: 6,
  title: 'Every inversion, every key (wave through the cycle)',
  summary: 'Climb three inversions of one key, then descend through the next. All 12 keys, no stopping.',
  about: 'This is a stamina and fluency drill. Play root position, 1st and 2nd inversion climbing in one key, then descend through the inversions of the next key in the cycle, starting from the nearest note. Your eyes and ears have to stay one chord ahead.',
  tips: ['Start at 60 BPM in triplets; the speed trainer adds 4 BPM per loop.', 'Keep the degree labels on until the shapes are automatic, then switch to "none".'],
  source: 'Synthesis of the LCM and Spanish conservatory all-inversions requirements and continuous-line practice (Banacos, Gwizdala)',
  params: { quality: sel('Triad', QUALITY_TRIADS.slice(0, 4)), order: orderP },
  bpm: 60, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const chords = keysFor(p.order).map((k) => { const root = cycleRoot(k, ivs); return { root, ivs, sym: chordName(root, p.quality, S) }; });
    const order = (i) => (i % 2 === 0 ? [0, 1, 2, 1, 2, 3, 2, 3, 4] : [4, 3, 2, 3, 2, 1, 2, 1, 0]);
    emitMixed(b, voiceLedItems(chords, { order, lo: 28, hi: 50, start: 36 }), { center: 6 });
    return b.build({ label: 'degree' });
  },
});

// ---------------------------------------------------------------- mastery: approach, permutations, rudiments, pairs

const APPROACH = {
  below: { name: 'Half step below', f: (m) => [m - 1] },
  above: { name: 'Half step above', f: (m) => [m + 1] },
  enclosure: { name: 'Enclosure (above, below, target)', f: (m) => [m + 1, m - 1] },
  double: { name: 'Double chromatic from below', f: (m) => [m - 2, m - 1] },
  scale: { name: 'Scale step from above', f: null },
};

const approachTriads = ex({
  id: 'tri-approach', module: M, level: 5,
  title: 'Triads with chromatic approach notes',
  summary: 'Target every chord tone from a half step away: the bebop way to outline chords.',
  about: 'Precede every chord tone with a chromatic neighbour. The approach notes create tension and the chord tones resolve it. This is how bebop players and walking bassists make lines sound "inside" while using all 12 notes.\n\nEvery chord tone lands on a beat, and the approach notes fill the rest of the beat, leading into the next one: 8th notes with a single approach note, triplets with an enclosure or a double approach. Each chord fills one bar of 3/4 (three chord tones, three beats). Approach notes are labelled →; when the usual side would repeat the note you just played, the approach comes from the other side.',
  tips: ['Accent the chord tones, ghost the approach notes.', 'Try the enclosure: it frames each target from both sides.'],
  source: 'TalkingBass Chord Tone Essentials (approach notes & enclosures); Berklee level exams; jazz pedagogy',
  params: { key: keyP(['1', '3', '5']), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'harmonicMinor'])), approach: sel('Approach', Object.entries(APPROACH).filter(([k]) => k !== 'scale').map(([k, v]) => [k, v.name])), order: sel('Chords', [['up', 'I → I'], ['updown', 'Up & back']]) },
  bpm: 80, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    // chord tones first, then each one is followed by the approach notes into the next target,
    // so every target falls on a beat (the last target leads back to the first)
    const segs = [];
    let prev = null;
    for (const k of keysFor(p.key)) {
      const tonic = T.bestRoot(k, T.SCALES[p.scale].iv);
      const r = pickRoot(ctx, k, { strings: ['A', 'E'], hi: 8, prev, prefer: 'A' });
      const stacks = diatonicStacks(tonic, p.scale, [0, 2, 4], S);
      const targets = [];
      DEG_SEQ[p.order].forEach((d, i) => {
        const st = stacks[d % 7];
        const ord = i % 2 ? [2, 1, 0] : [0, 1, 2];
        ord.forEach((ti, j) => targets.push({
          ...scaleTone(tonic, p.scale, r.midi, st.idxs[ti] + Math.floor(d / 7) * 7, st.root),
          chord: j === 0 ? st.sym : undefined, text: j === 0 ? st.roman : undefined,
        }));
      });
      segs.push({ targets, center: r.f + 1 });
      prev = r.midi;
    }
    const all = segs.flatMap((sg) => sg.targets);
    const per = APPROACH[p.approach].f(0).length + 1;
    let gi = 0;
    for (const sg of segs) {
      const items = [];
      for (const t of sg.targets) {
        items.push({ ...t, accent: true, dur: 1 / per });
        const nx = all[++gi % all.length];
        let apps = APPROACH[p.approach].f(nx.midi);
        // never "approach" with the note just played: come from the other side of the target
        if (apps[0] === t.midi || (p.approach === 'double' && apps.includes(t.midi))) apps = apps.map((m) => 2 * nx.midi - m);
        for (const m of apps) items.push({ midi: m, n: spellMidi(m, m > nx.midi), deg: '→', dur: 1 / per });
      }
      b.line(items, { pattern: false, place: { open: 'avoid', center: sg.center } });
    }
    // three chord tones per chord, one per beat: a bar of 3/4 per chord, so loops never end on silence
    return b.build({ label: 'degree', uniform: false, sub: per, beatsPerBar: 3 });
  },
});

const PERMS = { '012': '1-3-5', '021': '1-5-3', '102': '3-1-5', '120': '3-5-1', '201': '5-1-3', '210': '5-3-1' };
const permutations = ex({
  id: 'tri-permutations', module: M, level: 5,
  title: 'Triad permutations (all 6 orders)',
  summary: '1-3-5, 1-5-3, 3-1-5, 3-5-1, 5-1-3, 5-3-1 through the harmonized scale.',
  about: 'Three notes can be played in six orders. Each order is a different melodic shape and a different fingering challenge. Running them through the diatonic chords breaks the habit of always going up from the root, and gives you a stock of melodic cells for fills and solos.',
  tips: ['"Rotate" uses a new permutation on every chord: hard and very musical.', 'Group the 3-note cells in 16ths to get a built-in rhythmic displacement.'],
  source: 'Common mastery practice (Bass Fitness / Nitti permutation approach applied to triads)',
  params: { key: keyP(['1', '3', '5']), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'harmonicMinor', 'melodicMinor'])), perm: sel('Order', [...Object.entries(PERMS).map(([k, v]) => [k, v]), ['rotate', 'Rotate through all 6']]), order: degSeqP },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const keys = Object.keys(PERMS);
    const order = (i) => (p.perm === 'rotate' ? keys[i % 6] : p.perm).split('').map(Number);
    return diatonicBuild({ ...p, root: 'A' }, ctx, S, { offsets: [0, 2, 4], order }).build({ label: 'degree' });
  },
});

// Drum rudiments mapped onto triads: R = moving chord tone, L = root pedal (unless noted)
const RUDIMENTS = {
  single: { name: 'Single strokes (R L R L) · pedal root', seq: 'RLRLRLRL' },
  double: { name: 'Double strokes (R R L L)', seq: 'RRLLRRLL' },
  paradiddle: { name: 'Paradiddle (R L R R L R L L)', seq: 'RLRRLRLL' },
  paradiddlediddle: { name: 'Paradiddle-diddle (R L R R L L)', seq: 'RLRRLL' },
  fivestroke: { name: 'Five-stroke roll (R R L L R) · groups of 5', seq: 'RRLLR' },
  doubled: { name: 'Doubled chord tones (1 1 3 3 5 5 8 8)', ladder: true },
};

const rudiments = ex({
  id: 'tri-rudiments', module: M, level: 5, star: true,
  title: 'Triad rudiments (drum stickings on chords)',
  summary: 'Paradiddles, double strokes and rolls applied to triads: technique and harmony at once.',
  about: 'Drummers build their vocabulary from rudiments. Here every rudiment is mapped onto a chord: an "R" stroke plays the next chord tone going up (3rd, 5th, octave…) and an "L" stroke plays the root as a pedal. The result is a set of melodic, rhythmic patterns that outline each chord of the key. They are great for warm-ups and turn straight into grooves and fills.',
  tips: ['Accent the first note of each sticking group.', 'Odd-length rudiments (five-stroke, paradiddle-diddle) shift across the beat in 16ths. Count out loud.',
    'Try the right hand "rake" on the pedal notes to save motion.'],
  source: 'Drum rudiments (PAS) adapted to bass. Doubled-notes idea after Janek Gwizdala\'s arpeggio warm-ups',
  params: { key: keyP(['1', '3', '5']), scale: sel('Scale', SCALE_TYPE_OPTS(['ionian', 'aeolian', 'harmonicMinor', 'mixolydian', 'dorian'])), rudiment: sel('Rudiment', Object.entries(RUDIMENTS).map(([k, v]) => [k, v.name]), 'paradiddle'), order: sel('Chords', [['up', 'I → I'], ['updown', 'Up & back'], ['fourths', 'In 4ths']]) },
  bpm: 70, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const rd = RUDIMENTS[p.rudiment];
    const order = () => {
      if (rd.ladder) return [0, 0, 1, 1, 2, 2, 3, 3];
      const out = [];
      let up = 1;
      for (let rep = 0; rep < (rd.seq.length < 8 ? 2 : 1); rep++) {
        for (const ch of rd.seq) {
          if (ch === 'L') out.push(0);
          else { out.push(up); up = up >= 3 ? 1 : up + 1; }
        }
      }
      return out;
    };
    const b = diatonicBuild({ ...p, root: 'A', pattern: 'up' }, ctx, S, { offsets: [0, 2, 4], order });
    // accent the start of every sticking group
    const glen = rd.ladder ? 8 : rd.seq.length;
    b.steps.forEach((st, i) => { if (i % glen === 0) st.accent = true; });
    return b.build({ label: 'degree' });
  },
});

const PAIRS = {
  'IV-V': { name: 'IV & V major (F & G over C): Ionian', a: [5, 'maj'], b: [7, 'maj'] },
  'I-II': { name: 'I & II major (C & D over C): Lydian', a: [0, 'maj'], b: [2, 'maj'] },
  'bVI-bVII': { name: '♭VI & ♭VII major (A♭ & B♭ over C minor): Aeolian', a: [8, 'maj'], b: [10, 'maj'] },
  'ii-iii': { name: 'ii & iii minor (Dm & Em over C): Ionian', a: [2, 'min'], b: [4, 'min'] },
  'I-ii': { name: 'Major & minor a whole step apart (C & Dm)', a: [0, 'maj'], b: [2, 'min'] },
  'aug': { name: 'Augmented a half step apart (C+ & D♭+)', a: [0, 'aug'], b: [1, 'aug'] },
  'bII-I': { name: '♭II & I major (D♭ & C over C): Phrygian dominant', a: [1, 'maj'], b: [0, 'maj'] },
};

const triadPairs = ex({
  id: 'tri-pairs', module: M, level: 5, star: true,
  title: 'Triad pairs',
  summary: 'Two triads that share no notes, alternated through inversions: a modern, hexatonic sound.',
  about: 'A triad pair is two triads with no common notes, for example F and G over C. Together they make a 6-note scale. Alternating them, in climbing inversions, creates angular modern lines heard in players from Coltrane to modern fusion. Each pair suggests a mode over the root of the key: F and G over C sound Ionian (major), C and D sound Lydian, A♭ and B♭ over C minor sound Aeolian, D♭ and C sound Phrygian dominant.',
  tips: ['Play it over a C drone (or the root of the key) to hear the mode.', 'Then mix the groupings: 2+2+2 or 4+2.'],
  source: 'Gary Campbell "Triad Pairs for Jazz"; Walt Weiskopf "Intervallic Improvisation"; fusion/jazz bass practice',
  params: { key: keyP(['1', '3', '5'], { def: '0' }), pair: sel('Pair', Object.entries(PAIRS).map(([k, v]) => [k, v.name])), dir: sel('Direction', [['updown', 'Up & down'], ['up', 'Up']]) },
  bpm: 66, sub: 3, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    for (const k of keysFor(p.key)) {
      const pr = PAIRS[p.pair];
      const A = { root: T.bestRoot(T.mod(k + pr.a[0], 12), ivsOf(pr.a[1])), ivs: ivsOf(pr.a[1]), type: pr.a[1] };
      const B = { root: T.bestRoot(T.mod(k + pr.b[0], 12), ivsOf(pr.b[1])), ivs: ivsOf(pr.b[1]), type: pr.b[1] };
      const base = pickRoot(ctx, T.pc(A.root), { strings: ['E', 'A'], hi: 7 }).midi;
      let bBase = base + T.mod(T.pc(B.root) - T.pc(A.root), 12);
      if (bBase - base > 6) bBase -= 12;
      const items = [];
      for (let inv = 0; inv < 4; inv++) {
        for (const [X, xm] of [[A, base], [B, bBase]]) {
          chordTones(X.root, X.ivs, xm, [inv, inv + 1, inv + 2]).forEach((t, j) => items.push({ ...t, chord: j === 0 ? chordName(X.root, X.type, S) : undefined }));
        }
      }
      if (p.dir === 'updown') {
        const down = items.slice(0, -3).reverse().map((it) => ({ ...it, chord: undefined }));
        items.push(...down);
      }
      b.line(items, { pattern: true, place: { open: 'avoid', center: ctx.str ? 5 : 5 } });
    }
    return b.build({ label: 'note' });
  },
});

const US = {
  'II/I': { name: 'D/C → Cmaj7♯11 (Lydian)', over: 'maj7', off: 2, q: 'maj' },
  'V/I': { name: 'G/C → Cmaj9', over: 'maj7', off: 7, q: 'maj' },
  'iii/I': { name: 'Em/C → Cmaj7', over: 'maj7', off: 4, q: 'min' },
  'II/7': { name: 'D/C7 → C13♯11', over: 'dom7', off: 2, q: 'maj' },
  'VI/7': { name: 'A/C7 → C13♭9', over: 'dom7', off: 9, q: 'maj' },
  'bVI/7': { name: 'A♭/C7 → C7♯5♯9', over: 'dom7', off: 8, q: 'maj' },
  'bIII/7': { name: 'E♭/C7 → C7♯9', over: 'dom7', off: 3, q: 'maj' },
  'bV/7': { name: 'G♭/C7 → C7♭9♯11', over: 'dom7', off: 6, q: 'maj' },
  'bVII/m': { name: 'B♭/Cm → Cm11', over: 'min7', off: 10, q: 'maj' },
};

const upperStructures = ex({
  id: 'tri-upper-structures', module: M, level: 5,
  title: 'Upper-structure triads over a pedal',
  summary: 'Play a triad from a different root over the bass note: instant Lydian, 13♯11 or altered colours.',
  about: 'Pianists and arrangers get rich chords by putting a simple triad on top of a bass note. D major over a C bass gives C Lydian (maj7♯11); A major over C7 gives 13♭9. Here you play the pedal root and then the upper triad, so you hear and see the whole colour. Use it for soloing, chordal bass and to understand the tensions in jazz charts.',
  tips: ['Let the low root ring while you play the triad above (thumb mute off).', 'Name the tensions: D/C = 9, ♯11, 13.'],
  source: 'Charlie Banacos (chord-on-chord), Mark Levine "The Jazz Theory Book", Berklee harmony',
  params: { key: keyP(['1', '3', '5', '7'], { cycles: true }), us: sel('Structure', Object.entries(US).map(([k, v]) => [k, v.name])) },
  bpm: 66, sub: 2, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    let prev = null;
    for (const k of keysFor(p.key)) {
      const u = US[p.us];
      const bass = T.bestRoot(k, T.CHORDS[u.over].iv);
      const r = pickRoot(ctx, k, { strings: ['E', 'A'], hi: 8, prev, prefer: 'E' });
      const upRoot = T.bestRoot(T.mod(k + u.off, 12), ivsOf(u.q));
      let um = r.midi + 12 + T.mod(u.off, 12);
      if (um - r.midi > 22) um -= 12;
      const highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
      if (um + 7 > highest) um -= 12;
      const items = [{ midi: r.midi, n: bass, deg: 'R', chord: `${chordName(upRoot, u.q, S)}/${nm(bass, S)}` }];
      chordTones(upRoot, ivsOf(u.q), um, [0, 1, 2, 1, 0]).forEach((t) => {
        const iv = T.ivBetween(bass, t.n);
        const ext = { '2': '9', 'b2': '♭9', '#2': '♯9', '4': '11', '#4': '♯11', '6': '13', 'b6': '♭13', 'b5': '♭5', '#5': '♯5' }[iv];
        items.push({ ...t, deg: ext || T.fmtDeg(iv) });
      });
      items.push({ midi: r.midi, n: bass, deg: 'R' });
      b.line(items, { pattern: false, place: { pin: { [r.midi]: r.s }, open: 'avoid', center: r.f + 3 } });
      prev = r.midi;
    }
    return b.build({ label: 'degree' });
  },
});

const coltrane = ex({
  id: 'tri-major-thirds', module: M, level: 6,
  title: 'Major-3rd cycle triads (Coltrane axis)',
  summary: 'B → G → E♭ and back: the symmetric key centres of Giant Steps.',
  about: 'Dividing the octave into three major 3rds gives three keys that are equally far apart (B, G, E♭). Coltrane built "Giant Steps" on them. Play their triads voice-led, ascending and descending, until the movement feels natural. Then try the same with minor triads.',
  tips: ['Each move is a major 3rd down. Hear the bright, "floating" modulation.', 'Speed trainer: start slow, target 160 bpm in triplets.'],
  source: 'John Coltrane "Giant Steps" harmonic axis; Gwizdala Giant Steps practice',
  params: { key: keyP(['1', '3', '5'], { cycles: false, def: '11' }), quality: sel('Triad', QUALITY_TRIADS.slice(0, 2)), dir: sel('Motion', [['down', 'Down in major 3rds'], ['up', 'Up in major 3rds']]) },
  bpm: 72, sub: 3, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const ivs = ivsOf(p.quality);
    const k = Number(p.key);
    const step = p.dir === 'down' ? -4 : 4;
    const chords = [0, 1, 2, 3, 4, 5, 6].map((i) => { const root = T.bestRoot(T.mod(k + step * i, 12), ivs); return { root, ivs, sym: chordName(root, p.quality, S) }; });
    emitMixed(b, voiceLedItems(chords, { order: TRIAD_ORDERS.alt.f, lo: 31, hi: 55, start: 40 }), { center: 5 });
    return b.build({ label: 'degree' });
  },
});

const diatonicAllKeys = variant(diatonic, {
  id: 'tri-diatonic-all-keys', level: 6,
  title: 'Harmonized triads in all 12 keys, in inversions',
  summary: 'Diatonic triads, alternating directions, in 1st inversion, around the cycle without stopping.',
  about: 'The full diatonic-triad drill as a mastery test: every key around the cycle of 4ths, chords alternating up and down, in inversion. Change the inversion and scale to multiply it: 3 inversions × 9 scales × 12 keys. When this flows at 100 BPM in 8th-note triplets, you know triads on the bass.',
  defaults: { key: 'cycle4', pattern: 'alt', inversion: '1' }, bpm: 66,
});

const rudimentsAllKeys = variant(rudiments, {
  id: 'tri-rudiments-all-keys', level: 6,
  title: 'Triad rudiments in all 12 keys',
  summary: 'Paradiddles, doubles and rolls on the harmonized scale of every key.',
  about: 'Take the triad rudiments around the cycle of 4ths. Technique, rhythm and harmony are all stressed at once and you cannot coast on muscle memory. Use the speed trainer and aim for 16ths at 90 BPM.',
  defaults: { key: 'cycle4', rudiment: 'paradiddle' }, bpm: 60,
});

export default [
  triadShape, majVsMin, triadQualities, fourTypes, zoneCycle, threeForms, neckChain, inversions,
  diatonic, diatonicMinor, diatonicInv, diatonic4ths, openTriads, twoOctave, stringSets,
  voiceLedCycle, progressions, approachTriads, permutations, rudiments, triadPairs, diatonicModes,
  susQuartal, upperStructures, coltrane, allInversionsCycle, diatonicAllKeys, rudimentsAllKeys,
];
