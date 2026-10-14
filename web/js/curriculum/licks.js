// Jazz licks: original phrases written in authentic jazz vocabulary (bebop
// enclosures, guide tones, altered dominants, tritone subs, Coltrane cells,
// walking-solo devices). Licks are notated in C (or C minor) and transposed to
// any key; every note is labelled against the chord sounding under it.
import { T, Builder, keysFor, ex, sel, keyP, emitMixed, chordName } from './common.js';

const M = 'licks';

/** Note values: w h dq q de e qt (quarter triplet) t (8th triplet) s (16th). */
const DUR = { w: 4, h: 2, dq: 1.5, q: 1, de: 0.75, e: 0.5, qt: 2 / 3, t: 1 / 3, s: 0.25 };
const LETTER_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const C = T.N('C');

/**
 * Parse "D2 F2:q r:e Ab3:t:x | ..." -> notes with start time (beats), duration and optional tag.
 * Octaves are scientific pitch (C2 = MIDI 36). '|' marks bar lines (readability only).
 */
function parseLick(src) {
  const out = [];
  let t = 0;
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [name, d = 'e', tag] = tok.split(':');
    const dur = DUR[d];
    if (!dur) throw new Error(`bad duration in "${tok}"`);
    if (name === 'r') { out.push({ rest: true, t, dur }); t += dur; continue; }
    const m = name.match(/^([A-G])(#{1,2}|b{1,2})?(-?\d)$/);
    if (!m) throw new Error(`bad note "${tok}"`);
    const n = T.N(m[1] + (m[2] || ''));
    const midi = 12 * (Number(m[3]) + 1) + LETTER_SEMIS[n.l] + n.a;
    out.push({ n, midi, t, dur, tag });
    t += dur;
  }
  return { notes: out, total: t };
}

const TENSION = { '2': '9', 'b2': '♭9', '#2': '♯9', '4': '11', '#4': '♯11', '6': '13', 'b6': '♭13' };
/** Degree of a note against a chord: chord tones as 3, ♭7…, the rest as tensions (9, ♭9, 13…). */
function degOf(chord, n) {
  const iv = T.ivBetween(chord.root, n);
  if (iv === '?') return '·';
  if (chord.ivs.includes(iv)) return T.fmtDeg(iv);
  return TENSION[iv] || T.fmtDeg(iv);
}

/** Build one lick in key pc `k` into builder `b`. */
function lickItems(lick, k, S, ctx, swing) {
  const tonic = T.bestRoot(k, lick.minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv);
  const { notes } = parseLick(lick.notes);
  // transpose from C by the smallest move (-6..+5 semitones), then keep it on the neck
  let d = T.mod(k, 12);
  if (d > 5) d -= 12;
  const lowest = ctx.tuning[0], highest = ctx.tuning[ctx.tuning.length - 1] + ctx.maxFret;
  const mids = notes.filter((x) => !x.rest).map((x) => x.midi + d);
  let shift = 0;
  while (Math.min(...mids) + shift < lowest) shift += 12;
  while (Math.max(...mids) + shift > highest && Math.min(...mids) + shift - 12 >= lowest) shift -= 12;
  // chords and their start times
  let at = 0;
  const chords = lick.prog.map(([where, type, beats]) => {
    const ivs = T.CHORDS[type].iv;
    const root = typeof where === 'number' ? T.bestRoot(T.mod(k + where, 12), ivs) : T.up(tonic, where);
    const c = { root, ivs, type, start: at, end: at + beats, sym: chordName(root, type, S) };
    at += beats;
    return c;
  });
  const chordAt = (t) => chords.find((c) => t >= c.start - 1e-9 && t < c.end - 1e-9) || chords[chords.length - 1];
  // swing: an 8th that starts on the "&" is played on the last triplet of the beat
  const sw = (t) => {
    const f = t - Math.floor(t);
    return swing && Math.abs(f - 0.5) < 1e-6 ? Math.floor(t) + 2 / 3 : t;
  };
  const labelled = new Set();
  return notes.map((x, i) => {
    const start = sw(x.t);
    const end = i + 1 < notes.length ? sw(notes[i + 1].t) : x.t + x.dur;
    const c = chordAt(x.t);
    const chord = labelled.has(c) ? undefined : c.sym;
    labelled.add(c);
    const item = { dur: end - start, chord, text: i === 0 ? lick.name : undefined };
    if (x.rest) return { ...item, rest: true };
    const iv = T.ivBetween(C, x.n);
    const n = iv === '?' ? x.n : T.up(tonic, iv);
    return { ...item, midi: x.midi + d + shift, n, deg: degOf(c, n), tag: x.tag };
  });
}

const feelP = sel('Feel', [['swing', 'Swing 8ths'], ['straight', 'Straight 8ths']]);

function lickTemplate(def) {
  const { licks, minor = false, ...meta } = def;
  return ex({
    ...meta,
    module: M,
    label: 'degree',
    params: {
      lick: sel('Lick', licks.map((l, i) => [String(i), l.name])),
      key: keyP(minor ? T.SCALES.aeolian.iv : T.SCALES.ionian.iv),
      feel: feelP,
    },
    licks,
    build(p, ctx, S) {
      const b = new Builder(ctx, S);
      const lick = licks[Number(p.lick)] || licks[0];
      const swing = p.feel === 'swing' && lick.feel !== 'straight';
      const items = [];
      for (const k of keysFor(p.key)) items.push(...lickItems({ ...lick, minor }, k, S, ctx, swing));
      emitMixed(b, items, { center: 6, open: 'avoid' });
      return b.build({ uniform: false, label: 'degree' });
    },
  });
}

const II_V_I = [['2', 'min7', 4], ['5', 'dom7', 4], ['1', 'maj7', 8]];
const MINOR_II_V_I = [['2', 'm7b5', 4], ['5', 'dom7', 4], ['1', 'min6', 8]];
const V_I = [['5', 'dom7', 4], ['1', 'maj7', 4]];
const TURN = [['1', 'maj7', 2], ['6', 'dom7', 2], ['2', 'min7', 2], ['5', 'dom7', 2]];

const majorIIVI = lickTemplate({
  id: 'lk-ii-v-i', level: 5, star: true,
  title: 'Jazz licks: major ii–V–I',
  summary: 'Six phrases over Dm7 – G7 – Cmaj7: arpeggios, enclosures, guide tones, ♭9s and tritone subs.',
  about: 'The ii–V–I is the sentence jazz is written in. These licks show the main ways to say it: run up the ii chord and resolve through the V\'s ♭9, enclose the target 3rd, follow the guide tones (the ♭7 of one chord falling a half step to the 3rd of the next), play Coltrane\'s 1-2-3-5 cells, descend the bebop scale so chord tones land on the beats, and alternate triads for a modern, altered colour.\n\nLearn one lick slowly in C, sing it, then move it through all 12 keys. Finally, slip it into your walking lines and solos.',
  tips: ['Labels show each note against the chord under it: watch where the ♭9 and the 3rd fall.', 'Swing the 8ths lightly and accent the off-beats.', 'Use "All 12 · cycle of 4ths" to play the lick in every key without stopping.'],
  source: 'Original licks in standard bebop and post-bop vocabulary (Charlie Parker, Barry Harris, John Coltrane, Ray Brown).',
  bpm: 112,
  licks: [
    { name: 'Arpeggio up, ♭9 down', prog: II_V_I, notes: 'D2 F2 A2 C3 E3 D3 C3 A2 | B2 D3 F3 Ab3 G3 F3 D3 B2 | C3:q E3 D3 B2 G2 A2:q | E2:h r:h' },
    { name: 'Enclosure into the 3rd', prog: II_V_I, notes: 'A2 G2 F2 E2 D2 F2 A2 C3 | B2 D3 F3 A3 Ab3 G3 F3 D#3 | E3:q C3 G2 A2 B2 C3:q | B1:h r:h' },
    { name: 'Guide tones with triplets', prog: II_V_I, notes: 'F2:q E2:t F2:t G2:t A2:h | B2:q A2:t B2:t C3:t D3:q F3:q | E3:h D3 C3 B2 G2 | A2:q B2:q C3:h' },
    { name: '1-2-3-5 cells + tritone sub', prog: II_V_I, notes: 'D2 E2 F2 A2 F2 G2 A2 C3 | G2 A2 B2 D3 Db3 Eb3 F3 Ab3 | G3:q E3 D3 C3 B2 G2:q | C2:h r:h' },
    { name: 'Bebop scale descent', prog: II_V_I, notes: 'F3 E3 D3 C3 B2 A2 G#2 A2 | G3 F#3 F3 E3 D3 C3 B2 A2 | G2:q E2 G2 B2 D3 C3:q | B2:h r:h' },
    { name: 'Triad pairs, then altered triads', prog: II_V_I, notes: 'F2:t A2:t C3:t G2:t B2:t D3:t A2:t C3:t F3:t B2:t D3:t G3:t | Ab3:t F3:t Db3:t G3:t Eb3:t Bb2:t F3:t Db3:t Ab2:t Eb3:t Bb2:t G2:t | E2:q B2 D3 G3:q E3:q | C3:h r:h' },
  ],
});

const minorIIVI = lickTemplate({
  id: 'lk-minor-ii-v-i', level: 5, minor: true,
  title: 'Jazz licks: minor ii–V–i',
  summary: 'Dm7♭5 – G7♭9 – Cm6: Locrian ♮2, harmonic minor, diminished and altered lines.',
  about: 'Minor ii–V–i progressions are darker and more chromatic. The ii is half-diminished, the V carries a ♭9 (and often an altered sound), and the i is a minor chord with a major 6th or major 7th. These licks use Locrian ♮2 on the ii, harmonic minor and the diminished arpeggio (Barry Harris\' "dominant from a diminished") on the V, the altered scale, and melodic minor on the resolution.',
  tips: ['The ♭9 (A♭ over G7) falling to the 5th (G) of Cm is the signature move.', 'Notice the natural B (the 3rd of G7) against the minor key.'],
  source: 'Original licks in standard minor-key bebop vocabulary (Barry Harris diminished concept, melodic and harmonic minor).',
  bpm: 108,
  licks: [
    { name: 'Locrian ♮2 to melodic minor', prog: MINOR_II_V_I, notes: 'D2 F2 Ab2 C3 E3 C3 Ab2 F2 | Ab2 G2 F2 D2 B1 D2 F2 Ab2 | G2:q Eb2 F2 G2 A2 B2 C3 | Eb3:h r:h' },
    { name: 'Harmonic minor descent', prog: MINOR_II_V_I, notes: 'Ab2 G2 F2 Eb2 D2 F2 Ab2 C3 | B2 Ab2 G2 F2 Eb2 D2 C2 B1 | C2:q Eb2 G2 A2 C3 Eb3 G3 | Eb3:q D3:q C3:h' },
    { name: 'Diminished arpeggios (Barry Harris)', prog: MINOR_II_V_I, notes: 'F2 Ab2 B2 D3 C3 Ab2 F2 D2 | B1 D2 F2 Ab2 B2 Ab2 F2 D2 | Eb2:q G2 C3 Eb3 D3 C3 A2 | B2 C3:dq r:h' },
    { name: 'Altered scale into the 5th', prog: MINOR_II_V_I, notes: 'D2 E2 F2 G2 Ab2 C3 Bb2 Ab2 | G2 F2 Eb2 Db2 B1 Db2 F2 Ab2 | G2:q A2 B2 C3 D3 Eb3 F3 | G3:q Eb3:q C3:h' },
  ],
});

const blues = lickTemplate({
  id: 'lk-blues', level: 5,
  title: 'Jazz licks: blues',
  summary: 'Blues-scale riffs, the ♭3→3 "blue" slide, chromatic approaches and a walking-solo fill.',
  about: 'The blues runs through all jazz. Over a dominant 7th chord you can mix the major 3rd with the "blue" ♭3, use the blues scale, and approach chord tones chromatically. Most licks here move from the I7 to the IV7, the most important change in a blues.',
  tips: ['Slide or hammer from the ♭3 to the 3: the blue note bends into the major sound.', 'Lay back on the beat: blues phrases should sit slightly behind the click.'],
  source: 'Original licks in standard jazz-blues vocabulary (Ray Brown, Paul Chambers, blues tradition).',
  bpm: 104,
  licks: [
    { name: 'Blues-scale riff to the IV', prog: [['1', 'dom7', 4], ['4', 'dom7', 4]], notes: 'C3 Eb3 E3 G3 A3 G3 Eb3 C3 | A2:q C3 Eb3 F3:q Eb3 C3' },
    { name: 'Blue-note triplet fill', prog: [['1', 'dom7', 4], ['4', 'dom7', 4]], notes: 'G2:t Bb2:t B2:t C3:q Bb2 G2 E2:q | F2 A2 C3 Eb3 D3 C3 A2 F2' },
    { name: 'Chromatic double approach', prog: [['1', 'dom7', 4], ['4', 'dom7', 4]], notes: 'Bb2 A2 Ab2 G2 E2 F2 F#2 G2 | A2:q C3 Eb3 D3 C3 A2:q' },
    { name: 'Blue third (♭3 → 3)', prog: [['1', 'dom7', 8]], notes: 'Eb2 E2:e:H G2 Bb2 C3 Bb2 G2 E2 | Eb2 E2:e:H C2:q r:h' },
  ],
});

const turnarounds = lickTemplate({
  id: 'lk-turnarounds', level: 5,
  title: 'Jazz licks: turnarounds',
  summary: 'I–VI7–ii–V and the tritone-sub turnaround in two bars, looping back to the top.',
  about: 'A turnaround is the two-bar link at the end of a chorus that leads back to the start: Imaj7 – VI7 – iim7 – V7, often with the VI7 and V7 replaced by their tritone substitutes. Each lick loops, so you practise the circular motion it creates.',
  tips: ['The VI7 is a secondary dominant: its 3rd (C♯ in C) is the note that "pulls".', 'Two beats per chord: keep each arpeggio tidy and land the next chord on the beat.'],
  source: 'Original turnaround licks in standard jazz vocabulary (secondary dominants, tritone substitution).',
  bpm: 112,
  licks: [
    { name: 'Arpeggios with ♭9s', prog: TURN, notes: 'C3 E3 G3 E3 | C#3 E3 G3 Bb3 | A3 F3 D3 C3 | B2 D3 F3 Ab3' },
    { name: 'Chromatic guide tones', prog: TURN, notes: 'E2 G2 B2 C3 | C#3 Bb2 A2 G2 | F2 A2 C3 E3 | D3 B2 Ab2 F2' },
    { name: 'Triplet turnaround', prog: TURN, notes: 'G2:t A2:t B2:t C3:q | C#3:t E3:t G3:t Bb3:q | A3:t F3:t D3:t C3:q | B2:t D3:t F3:t E3:q' },
    { name: 'Tritone-sub turnaround', prog: [['1', 'maj7', 2], [3, 'dom7', 2], ['2', 'min7', 2], [1, 'dom7', 2]], notes: 'E2 G2 B2 D3 | Db3 Bb2 G2 Eb2 | F2 A2 C3 E3 | F3 Db3 Ab2 F2' },
  ],
});

const bebop = lickTemplate({
  id: 'lk-bebop', level: 6, star: true,
  title: 'Jazz licks: bebop vocabulary',
  summary: '"The Lick", enclosure chains, the bebop dominant scale, upper structures and tritone-sub lines.',
  about: 'Bebop players built a shared vocabulary: enclosures (surround the target note from above and below), the bebop dominant scale (an added major 7th so chord tones fall on the beats), upper-structure arpeggios and the ♭9 resolution. "The Lick" is the most famous (and most joked-about) cliché in jazz. Every player knows it, so it is worth knowing too.',
  tips: ['In the bebop scale lick, check that the chord tones (G, F, D, B) land on beats 1-2-3-4.', 'Enclosures: above, below, target. The target always falls on the beat.'],
  source: 'Original phrases in classic bebop vocabulary (Charlie Parker, Barry Harris, David Baker\'s bebop studies); "The Lick" is a traditional jazz cliché.',
  bpm: 120,
  licks: [
    { name: 'The Lick', prog: [['2', 'min7', 4], ['5', 'dom7', 4]], notes: 'D3 E3 F3 G3 E3:q C3 D3 | r:q B2 D3 F3 Ab3 G3:q' },
    { name: 'Enclosure chain on G7', prog: V_I, notes: 'A2:t F#2:t G2:t C3:t A#2:t B2:t Eb3:t C#3:t D3:t Gb3:t E3:t F3:t | E3:q C3 G2 A2 B2 C3:q' },
    { name: 'Bebop dominant scale from the 3rd', prog: V_I, notes: 'B2 A2 G2 F#2 F2 E2 D2 Db2 | C2:q E2 G2 B2 D3 C3:q' },
    { name: 'Upper structure to altered', prog: V_I, notes: 'F2 A2 C3 E3 Eb3 Db3 B2 Ab2 | G2:q E2 G2 C3 E3 D3:q' },
    { name: 'Chromatic approach to every chord tone', prog: [['1', 'maj7', 8]], notes: 'B1 C2 D#2 E2 F#2 G2 A#2 B2 | C3:q B2 G2 E2 C2 r:q' },
    { name: 'Tritone-sub line (D♭7 over G7)', prog: V_I, notes: 'Ab2 Db3 F3 Ab3 G3 F3 Db3 B2 | C3:q E3 G3 B2 A2 G2:q' },
  ],
});

const modern = lickTemplate({
  id: 'lk-modern', level: 6,
  title: 'Jazz licks: modern sounds',
  summary: 'Pentatonic superimposition, triad pairs, the altered scale, Coltrane changes, side-slipping, 16th-note runs.',
  about: 'Post-bop and fusion players stretch the harmony. They superimpose pentatonic scales a step apart over one chord (Coltrane, McCoy Tyner), alternate two triads (triad pairs), play the altered scale over dominants, move through Coltrane\'s major-3rd key centres, "side-slip" a half step outside and back, and run fast 16th-note arpeggios across the neck in the style of Jaco Pastorius.',
  tips: ['Side-slipping only works if you come back in clearly: land the resolution on a strong beat.', 'The 16th-note licks are played straight (no swing).'],
  source: 'Original licks inspired by John Coltrane, McCoy Tyner, triad-pair studies (Gary Campbell) and Jaco Pastorius\' 16th-note style.',
  bpm: 96,
  licks: [
    { name: 'Pentatonic superimposition (Dm7)', prog: [['2', 'min7', 8]], feel: 'straight', notes: 'D2:s F2:s G2:s A2:s C3:s A2:s G2:s F2:s E2:s G2:s A2:s B2:s D3:s B2:s A2:s G2:s | A2:s C3:s D3:s E3:s G3:s E3:s D3:s C3:s D3:h' },
    { name: 'Triad pairs C & D (Lydian)', prog: [['1', 'maj7', 8]], notes: 'C2:t E2:t G2:t D2:t F#2:t A2:t E2:t G2:t C3:t F#2:t A2:t D3:t | G2:t C3:t E3:t A2:t D3:t F#3:t E3:t C3:t G2:t D3:t A2:t F#2:t' },
    { name: 'Altered scale run', prog: V_I, notes: 'Ab2 Bb2 B2 Db3 Eb3 F3 G3 Ab3 | G3:q E3 C3 B2 G2 E2:q' },
    { name: '16th-note arpeggio run (Jaco-inspired)', prog: [['1', 'dom7', 8]], feel: 'straight', notes: 'C2:s E2:s G2:s Bb2:s C3:s E3:s G3:s Bb3:s A3:s G3:s E3:s C3:s Bb2:s G2:s E2:s C2:s | Db2:s D2:s Eb2:s E2:s G2:s A2:s Bb2:s C3:s Bb2 G2 C2:q' },
    { name: 'Coltrane major-3rd cycle', prog: [['1', 'maj7', 2], [3, 'dom7', 2], [8, 'maj7', 4]], notes: 'C3 D3 E3 G3 | Eb3 F3 G3 Bb3 | Ab2 Bb2 C3 Eb3 G3:q Eb3:q' },
    { name: 'Side-slipping (out and back in)', prog: [['2', 'min7', 8]], notes: 'D2 F2 A2 C3 Db3 Bb2 Gb2 Eb2 | D2 E2 F2 A2 C3:h' },
  ],
});

const soloDevices = lickTemplate({
  id: 'lk-bass-solo', level: 5,
  title: 'Jazz licks: bass solo devices',
  summary: 'Two-feel pickups, walking lines with triplet skips and pedal-point fills: how bassists solo.',
  about: 'Bass solos often grow out of the bass line itself: a two-feel that breaks into a walking pickup, a walking line decorated with triplet "skips", or a low pedal note alternating with high chord tones so the harmony stays clear. These devices make a solo sound like a bassist rather than a horn player.',
  tips: ['Keep the time feel of a walking line even when soloing.', 'The pedal-point fill needs string skipping: mute the strings in between.'],
  source: 'Original phrases inspired by the walking-solo language of Ray Brown and Paul Chambers.',
  bpm: 116,
  licks: [
    { name: 'Two-feel to walking pickup', prog: [['1', 'maj7', 8]], notes: 'C2:h G1:q A1 B1 | C2:t E2:t G2:t A2:t G2:t E2:t D2:q Db2:q' },
    { name: 'Walking line with triplet skips', prog: [['2', 'min7', 4], ['5', 'dom7', 4]], notes: 'D2:q E2:q F2:t F2:t:x G2:t A2:q | G2:q B2:q D3:t C3:t B2:t A2:q' },
    { name: 'Pedal-point fill', prog: [['1', 'maj7', 8]], notes: 'C2 E3 C2 G3 C2 B3 C2 G3 | C2 E3 C2 D3 C2 B2 A2 B2' },
  ],
});

/** Dev check: every lick parses and fills its progression exactly. */
export function checkLicks(list = ALL_LICK_TEMPLATES) {
  const out = [];
  for (const t of list) {
    t.licks.forEach((l, i) => {
      const total = l.prog.reduce((a, c) => a + c[2], 0);
      const got = parseLick(l.notes).total;
      if (Math.abs(total - got) > 1e-6) out.push(`${t.id} #${i} "${l.name}": ${got} beats, progression ${total}`);
    });
  }
  return out;
}

const ALL_LICK_TEMPLATES = [majorIIVI, minorIIVI, blues, turnarounds, soloDevices, bebop, modern];
export default ALL_LICK_TEMPLATES;
