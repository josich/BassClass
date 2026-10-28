// Rhythm & time: subdivisions, rests, syncopation, odd groupings, polyrhythms, odd metres.
import { T, Builder, ex, sel, spellMidi } from './common.js';

const M = 'rhythm';
const noteP = sel('Note', [['A0', 'Open A'], ['E0', 'Open E'], ['A3', 'C (A string, fret 3)'], ['E5', 'A (E string, fret 5)'], ['D0', 'Open D']]);

/** Resolve the chosen note into a fret item. */
function pitch(ctx, v) {
  const s = Math.max(0, ctx.str(v[0]));
  const f = Number(v.slice(1));
  return { s, f, n: spellMidi(ctx.tuning[s] + f), finger: f ? 1 : 0, deg: 'R' };
}

/** Emit a list of [dur, play?, accent?] events on one pitch (non-uniform rhythm). */
function events(b, base, list) {
  for (const ev of list) {
    const [dur, on = true, acc = false, label] = ev;
    if (label) b.chord(label);
    if (on) b.frets([{ ...base, dur, accent: acc || undefined }]);
    else b.rest(dur);
  }
}

const pulse = ex({
  id: 'rh-pulse', module: M, level: 1,
  title: 'Steady pulse & the inner clock',
  summary: 'Quarter notes with the click on every beat, then only on 2 & 4, then only on beat 1.',
  about: 'Groove starts with a rock-solid pulse. Play quarter notes against the metronome until your note "buries" the click. Then move the click to beats 2 and 4 (the backbeat, where the snare plays), then to beat 1 only, then once every two bars. You become the clock.',
  tips: ['If you can hear the click clearly, you are not exactly with it.', 'Tap your foot on every beat.'],
  source: 'Pulse and metronome practice',
  params: { note: noteP, click: sel('Click', [['all', 'Every beat'], ['24', 'Beats 2 & 4'], ['1', 'Beat 1 only'], ['2bars', 'Once every 2 bars']]) },
  bpm: 72, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    events(b, base, Array.from({ length: 16 }, (_, i) => [1, true, i % 4 === 0]));
    const meta = { uniform: false, label: 'note' };
    if (p.click === '24') meta.clickBeats = [1, 3];
    if (p.click === '1') meta.clickBeats = [0];
    if (p.click === '2bars') { meta.clickBeats = [0]; meta.clickEvery = 2; }
    return b.build(meta);
  },
});

const pyramid = ex({
  id: 'rh-pyramid', module: M, level: 1,
  title: 'Subdivision pyramid',
  summary: '1, 2, 3, 4… notes per beat and back down: hear every subdivision.',
  about: 'Each bar divides the beat further: quarters (1), 8ths (2), triplets (3), 16ths (4), then quintuplets and sextuplets for advanced players, then back down. Count out loud: "1, 1-&, 1-trip-let, 1-e-&-a". Moving smoothly between subdivisions is the basis of every rhythm.',
  tips: ['Keep the beat (the first note of each group) exactly on the click.', 'Accented first note: feel where the beat is.'],
  source: 'Subdivision practice',
  params: { note: noteP, max: sel('Up to', [['4', '16ths (4)'], ['6', 'Sextuplets (6)'], ['8', '32nds (8)']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const names = { 1: 'Quarters', 2: '8ths', 3: 'Triplets', 4: '16ths', 5: 'Quintuplets', 6: 'Sextuplets', 7: 'Septuplets', 8: '32nds' };
    const max = Number(p.max);
    const seq = [...Array(max).keys()].map((i) => i + 1);
    for (const n of [...seq, ...seq.slice(0, -1).reverse()]) {
      const ev = [];
      for (let beat = 0; beat < 4; beat++) for (let k = 0; k < n; k++) ev.push([1 / n, true, k === 0, beat === 0 && k === 0 ? names[n] : null]);
      events(b, base, ev);
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const restsEx = ex({
  id: 'rh-rests', module: M, level: 1,
  title: 'Notes and rests',
  summary: 'Silence is rhythm too: play some beats, rest on others.',
  about: 'Bass lines live in the space between notes. Each 2-bar pattern combines played beats and rests (stop the note with your hands on the rest). Muting precisely on the rest is as important as playing on the beat.',
  tips: ['On a rest, stop the string with both hands: lift the fretting finger, touch with the plucking finger.', 'Count all four beats aloud, including the silent ones.'],
  source: 'Hal Leonard Bass Method (Ed Friedland)',
  params: { note: noteP },
  bpm: 72, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const pats = [[1, 0, 1, 0, 'Beats 1 & 3'], [0, 1, 0, 1, 'Beats 2 & 4'], [1, 1, 1, 0, '1 2 3 (rest)'], [1, 0, 0, 1, '1 … 4'], [0, 1, 1, 1, '(rest) 2 3 4'], [1, 0, 1, 1, '1 3 4']];
    for (const pat of pats) {
      for (let bar = 0; bar < 2; bar++) events(b, base, pat.slice(0, 4).map((on, i) => [1, !!on, i === 0, bar === 0 && i === 0 ? pat[4] : null]));
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const offbeats = ex({
  id: 'rh-offbeats', module: M, level: 2,
  title: 'Off-beats: playing on the "&"',
  summary: 'Rest on the beat, play exactly between the clicks.',
  about: 'The "&" is halfway between beats. Playing only off-beats is the heart of reggae, ska and many dance grooves, and it trains a strong internal subdivision. The patterns alternate on-beat bars and off-beat bars, then mix them.',
  tips: ['Feel the 8th notes in your body; tap the beat with your foot.', 'Say "1 & 2 & 3 & 4 &" and play only on "&".'],
  source: 'Syncopation in the first graded exams',
  params: { note: noteP },
  bpm: 76, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const bars = [
      ['On the beat', [1, 0, 1, 0, 1, 0, 1, 0]], ['On the &', [0, 1, 0, 1, 0, 1, 0, 1]],
      ['On the beat', [1, 0, 1, 0, 1, 0, 1, 0]], ['On the &', [0, 1, 0, 1, 0, 1, 0, 1]],
      ['Mixed', [1, 0, 0, 1, 0, 1, 1, 0]], ['Mixed', [0, 1, 1, 0, 0, 1, 0, 1]],
    ];
    for (const [name, pat] of bars) events(b, base, pat.map((on, i) => [0.5, !!on, false, i === 0 ? name : null]));
    return b.build({ uniform: false, label: 'note' });
  },
});

const grid16 = ex({
  id: 'rh-16th-grid', module: M, level: 3,
  title: 'The 16th-note grid: all 15 cells',
  summary: 'Every combination of "1 e & a" within a beat.',
  about: 'A beat of 16ths has four spots: 1, e, &, a. There are 15 ways to use them. Most funk, R&B and hip-hop rhythms are made from these cells. Each cell is repeated for a full bar so you can lock it in.',
  tips: ['Keep your plucking hand moving in 16ths even on silent spots ("ghost" the motion).', 'Count every spot aloud: "1 e & a 2 e & a".'],
  source: 'The 16th-note grid; graded exams',
  params: { note: noteP },
  bpm: 66, sub: 4, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const spots = ['1', 'e', '&', 'a'];
    const cells = [];
    for (let m = 1; m < 16; m++) cells.push([0, 1, 2, 3].map((i) => !!(m & (8 >> i))));
    cells.sort((a, c) => a.filter(Boolean).length - c.filter(Boolean).length);
    for (const cell of cells) {
      const name = cell.map((on, i) => (on ? spots[i] : '·')).join(' ');
      for (let beat = 0; beat < 4; beat++) {
        // merge each silent spot into the previous note's length
        const ev = [];
        cell.forEach((on, i) => {
          if (on || !ev.length) ev.push([0.25, on, false, beat === 0 && i === 0 ? name : null]);
          else ev[ev.length - 1][0] += 0.25;
        });
        events(b, base, ev);
      }
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const dotted = ex({
  id: 'rh-dotted', module: M, level: 2,
  title: 'Dotted rhythms & the Charleston',
  summary: 'Dotted quarter + 8th, dotted 8th + 16th: the long-short feels.',
  about: 'A dot adds half the value to a note. The dotted-quarter + 8th (the "Charleston" figure) is everywhere in pop, Latin and jazz, and the dotted 8th + 16th gives a skipping, galloping feel. Hear them against the steady click.',
  tips: ['Subdivide: a dotted quarter is three 8ths long.', 'The short note leads into the next beat; feel its pull.'],
  source: 'Groove and rhythm practice; Hal Leonard Bass Method (Ed Friedland)',
  params: { note: noteP },
  bpm: 72, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const bars = [
      ['Charleston', [[1.5], [0.5], [2, false]]], ['Charleston', [[1.5], [0.5], [2, false]]],
      ['Dotted ♩ ♪', [[1.5], [0.5], [1.5], [0.5]]], ['Dotted ♩ ♪', [[1.5], [0.5], [1.5], [0.5]]],
      ['Dotted 8th + 16th', [[0.75], [0.25], [0.75], [0.25], [0.75], [0.25], [0.75], [0.25]]],
      ['Dotted 8th + 16th', [[0.75], [0.25], [0.75], [0.25], [0.75], [0.25], [0.75], [0.25]]],
      ['3+3+2', [[1.5], [1.5], [1]]], ['3+3+2', [[1.5], [1.5], [1]]],
    ];
    for (const [name, evs] of bars) events(b, base, evs.map(([d, on = true], i) => [d, on, i === 0, i === 0 ? name : null]));
    return b.build({ uniform: false, label: 'note' });
  },
});

const syncopation = ex({
  id: 'rh-syncopation', module: M, level: 2,
  title: 'Syncopation & anticipations',
  summary: 'Accents between the beats and notes that arrive early, across the bar line.',
  about: 'Syncopation moves the emphasis off the strong beats. An anticipation plays the next bar\'s first note half a beat (or a 16th) early and holds it over the bar line. Bass players use this all the time to push a groove forward.',
  tips: ['Count the beat you are NOT playing on.', 'An anticipated note is held: don\'t replay it on beat 1.'],
  source: 'Syncopation and anticipation; first graded exams',
  params: { note: noteP },
  bpm: 76, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const bars = [
      ['♪ ♩ ♪', [[0.5], [1], [0.5], [1], [1]]], ['♪ ♩ ♪', [[0.5], [1], [0.5], [1], [1]]],
      ['Anticipate beat 3', [[1], [0.5], [2.5]]], ['Anticipate beat 3', [[1], [0.5], [2.5]]],
      ['Push into the bar', [[1], [1], [1], [0.5], [0.5]]], ['(held over)', [[3.5, false], [0.5]]],
      ['16th anticipation', [[1], [1], [1.75], [0.25]]], ['(held over)', [[3.75, false], [0.25]]],
    ];
    for (const [name, evs] of bars) events(b, base, evs.map(([d, on = true], i) => [d, on, i === 0, i === 0 ? name : null]));
    return b.build({ uniform: false, label: 'note' });
  },
});

const triplets = ex({
  id: 'rh-triplets', module: M, level: 3,
  title: 'Triplet feel: 8th-note vs quarter-note triplets',
  summary: 'Three notes in one beat, then three notes across two beats.',
  about: 'Eighth-note triplets put three even notes in one beat. Quarter-note triplets stretch three notes across two beats, a lazy, floating feel used in hip-hop, gospel and jazz. Alternate them with straight 8ths to feel the difference.',
  tips: ['For quarter-note triplets, think "triplets, but play every other one".', 'Keep the foot on the beat; the triplets float above it.'],
  source: 'Groove and rhythm practice; graded exams',
  params: { note: noteP },
  bpm: 66, sub: 3, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const bar = (name, d, n) => events(b, base, Array.from({ length: n }, (_, i) => [d, true, i === 0, i === 0 ? name : null]));
    for (let r = 0; r < 2; r++) {
      bar('Straight 8ths', 0.5, 8); bar('8th triplets', 1 / 3, 12); bar('Quarter triplets', 2 / 3, 6); bar('Quarters', 1, 4);
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const shuffle = ex({
  id: 'rh-shuffle', module: M, level: 2,
  title: 'Swing & shuffle feel',
  summary: 'Long-short 8ths: the first and third notes of a triplet.',
  about: 'In swing and shuffle, 8th notes are not even: the first is long (two triplets) and the second short (one triplet). Switch between straight and swung bars to learn to control both feels at will.',
  tips: ['Say "doo-ba doo-ba" (long-short).', 'Shuffle = the swing feel played hard and even, like a blues.'],
  source: 'Shuffle and swing feels; first graded exams',
  params: { note: noteP },
  bpm: 84, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    for (let r = 0; r < 2; r++) {
      events(b, base, Array.from({ length: 8 }, (_, i) => [0.5, true, i % 2 === 0, i === 0 ? 'Straight' : null]));
      events(b, base, Array.from({ length: 8 }, (_, i) => [i % 2 ? 1 / 3 : 2 / 3, true, i % 2 === 0, i === 0 ? 'Swing' : null]));
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const groupings = ex({
  id: 'rh-groupings', module: M, level: 4,
  title: 'Odd groupings over 4/4 (3s, 5s, 7s)',
  summary: 'Phrase 16ths in groups of 3, 5 or 7 against the beat: rhythmic tension.',
  about: 'Playing a 3-note shape (R-5-8) in continuous 16ths makes the shape start on a different 16th each time: "3 over 4". It takes 3 bars to come back to beat 1. Groups of 5 and 7 take 5 and 7 bars. Fusion players and drummers use this to build tension without leaving the time.',
  tips: ['Accent the start of each group and keep counting 1 e & a.', 'Try it on scales and arpeggios once the rhythm is solid.'],
  source: 'Three against four in jazz-school entrance tests; fusion practice',
  params: { group: sel('Group of', [['3', '3 (R-5-8)'], ['5', '5 (R-5-8-5-R)'], ['7', '7 (R-3-5-8-5-3-R)']]) },
  bpm: 66, sub: 4, label: 'degree',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const a = Math.max(0, ctx.str('A'));
    const d = a + 1, g = Math.min(a + 2, ctx.tuning.length - 1);
    const C = T.N('C');
    const notes = { R: { s: a, f: 3, n: C, deg: 'R', finger: 2 }, 3: { s: d, f: 2, n: T.N('E'), deg: '3', finger: 1 }, 5: { s: d, f: 5, n: T.N('G'), deg: '5', finger: 4 }, 8: { s: g, f: 5, n: C, deg: 'R', finger: 4 } };
    const shapes = { 3: ['R', '5', '8'], 5: ['R', '5', '8', '5', 'R'], 7: ['R', '3', '5', '8', '5', '3', 'R'] };
    const shape = shapes[p.group];
    const total = shape.length * 16;
    const items = [];
    for (let i = 0; i < total; i++) {
      const k = i % shape.length;
      items.push({ ...notes[shape[k]], accent: k === 0, vel: k === 0 ? 1 : 0.62 });
    }
    b.frets(items);
    return b.build({ label: 'degree' });
  },
});

const displacement = ex({
  id: 'rh-displacement', module: M, level: 4,
  title: 'Rhythmic displacement',
  summary: 'The same 3-note figure, shifted one 16th later every bar.',
  about: 'Take a short figure and start it one 16th later in each bar. The notes stay the same, but each placement grooves completely differently. This is a classic way to get variations out of one idea, and it sharpens your sense of where every 16th is.',
  tips: ['Count "1 e & a" out loud; the figure moves, your counting does not.', 'Then try displacing by an 8th.'],
  source: 'Common rhythmic-development technique (drum pedagogy)',
  params: { note: noteP, step: sel('Shift by', [['0.25', 'a 16th'], ['0.5', 'an 8th']]) },
  bpm: 70, sub: 4, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const step = Number(p.step);
    const bars = Math.round(1 / step) * 2;
    for (let i = 0; i < bars; i++) {
      const off = i * step;
      const ev = [];
      if (off > 0) ev.push([off, false, false, `+${i}`]);
      ev.push([0.5, true, true, off === 0 ? 'start' : null], [0.25], [0.75]);
      ev.push([4 - off - 1.5, false]);
      events(b, base, ev);
    }
    return b.build({ uniform: false, label: 'note' });
  },
});

const poly = ex({
  id: 'rh-polyrhythm', module: M, level: 5,
  title: 'Polyrhythms (3:2, 3:4, 4:3, 5:4, 7:4)',
  summary: 'Even notes across a different number of beats.',
  about: 'A polyrhythm spreads N even notes over M beats. 3:2 is three notes across two beats (the "hemiola"), 4:3 is four over three, 5:4 is five notes per bar of four and 7:4 is seven. The click keeps the beat while you play the other layer. This is advanced time feel, heard in Afro-Cuban, prog and modern jazz.',
  tips: ['Clap the click and say the polyrhythm before playing it.', 'Find the common subdivision: 3:2 lives on a 6-grid.'],
  source: 'Polyrhythm pedagogy (Afro-Cuban rhythm studies)',
  params: { note: noteP, ratio: sel('Ratio', [['3:2', '3 over 2 beats'], ['3:4', '3 over 4 beats'], ['4:3', '4 over 3 beats'], ['5:4', '5 over 4 beats'], ['7:4', '7 over 4 beats']]) },
  bpm: 60, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const [n, m] = p.ratio.split(':').map(Number);
    const groups = Math.round(12 / m);
    for (let g = 0; g < groups; g++) events(b, base, Array.from({ length: n }, (_, i) => [m / n, true, i === 0, g === 0 && i === 0 ? p.ratio : null]));
    return b.build({ uniform: false, label: 'note', beatsPerBar: m === 3 ? 3 : 4 });
  },
});

const oddMeter = ex({
  id: 'rh-odd-meters', module: M, level: 4,
  title: 'Odd metres: 5/4, 7/8, 7/4',
  summary: 'Count in 3+2, 2+2+3 and 4+3 and lock the accents.',
  about: 'Odd metres group beats unevenly. 5/4 is usually felt as 3+2, 7/8 as 2+2+3 (or 3+2+2), and 7/4 as 4+3. The accented notes mark the groups. In 7/8 the metronome clicks every 8th note, so set a fast tempo. Learn to feel the "limp" of each metre until it sounds natural.',
  tips: ['Count the groups out loud: "1-2-3-1-2" for 5/4.', 'Think of "Take Five" (5/4) or "Money" (7/4).'],
  source: 'Odd metres in advanced graded exams',
  params: { note: noteP, meter: sel('Metre', [['5', '5/4 (3+2)'], ['78', '7/8 (2+2+3)'], ['78b', '7/8 (3+2+2)'], ['74', '7/4 (4+3)']]) },
  bpm: 100, sub: 1, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    const groups = { 5: [3, 2], 78: [2, 2, 3], '78b': [3, 2, 2], 74: [4, 3] }[p.meter];
    const bpb = groups.reduce((a, c) => a + c, 0);
    for (let bar = 0; bar < 4; bar++) {
      groups.forEach((g, gi) => {
        for (let i = 0; i < g; i++) events(b, base, [[1, true, i === 0, bar === 0 && gi === 0 && i === 0 ? groups.join('+') : null]]);
      });
    }
    // 7/8 counts in 8th notes, beamed by its groups; 5/4 and 7/4 in quarters
    const timeSig = { 5: [5, 4], 78: [7, 8], '78b': [7, 8], 74: [7, 4] }[p.meter];
    return b.build({ uniform: false, label: 'note', beatsPerBar: bpb, timeSig, groups: timeSig[1] === 8 ? groups : null });
  },
});

const sparse = ex({
  id: 'rh-sparse-click', module: M, level: 4,
  title: 'Gap click: keep time when the metronome disappears',
  summary: 'The click plays one bar, then goes silent for one or more bars. Land back on it.',
  about: 'Real time-keeping means playing steadily with no reference. Here the metronome clicks only on beat 1 every few bars. Keep playing 8ths through the silence and check whether you land exactly on the next click. When you can do it at "every 4 bars", your time is solid.',
  tips: ['Record yourself: are you rushing in the gaps?', 'Victor Wooten\'s "disappearing drummer" game works the same way.'],
  source: 'Keeping time through gaps in the click',
  params: { note: noteP, every: sel('Click', [['2', 'Beat 1, every 2 bars'], ['4', 'Beat 1, every 4 bars']]) },
  bpm: 80, sub: 2, label: 'note',
  build(p, ctx, S) {
    const b = new Builder(ctx, S);
    const base = pitch(ctx, p.note);
    events(b, base, Array.from({ length: 64 }, (_, i) => [0.5, true, i % 8 === 0]));
    return b.build({ uniform: false, label: 'note', clickBeats: [0], clickEvery: Number(p.every) });
  },
});

export default [pulse, pyramid, restsEx, offbeats, shuffle, dotted, syncopation, triplets, grid16, groupings, displacement, oddMeter, sparse, poly];
