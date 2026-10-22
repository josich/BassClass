// Make Music: original bass lines in the style of well-known songs. Each study takes a song's key,
// tempo, feel and technique (a stomping riff, root 8ths, disco octaves, odd metres, slap, a solo
// piece) and puts them in a line of its own: never the song's notes. No transcriptions here.
import { T, Builder, ex, sel, emitMixed, chordName, nm, keySigFor } from './common.js';

const M = 'music';

/** Note values: w dh (dotted half) h dq q de e qt t s st (16th triplet). */
const DUR = { w: 4, dh: 3, h: 2, dq: 1.5, q: 1, de: 0.75, e: 0.5, qt: 2 / 3, t: 1 / 3, s: 0.25, st: 1 / 6 };
const LETTER_SEMIS = [0, 2, 4, 5, 7, 9, 11];
const TECH = new Set(['x', 'T', 'P', 'H', 'PO', 'T⊓', 'TV', '⊓', 'V']);

/**
 * "E1:dq A1:e:x C2:s:T,>" -> notes with start, duration and technique. The default value is an 8th;
 * modifiers: x ghost, T thumb (T⊓ / TV double-thumb down / up), P pop, H hammer-on, PO pull-off,
 * ⊓ V pick down / up, > accent, @A on that string. Octaves are scientific pitch (E1 = the open E
 * string). '|' marks bar lines (for reading only). `unit` scales the values (2 in 5/8 and 7/8, where
 * the beat is the 8th note).
 */
function parseLine(src, unit = 1) {
  const out = [];
  let t = 0;
  for (const tok of src.trim().split(/\s+/)) {
    if (tok === '|') continue;
    const [name, d = 'e', mods = ''] = tok.split(':');
    if (!DUR[d]) throw new Error(`bad value in "${tok}"`);
    const dur = DUR[d] * unit;
    if (name === 'r') { out.push({ rest: true, t, dur }); t += dur; continue; }
    const m = name.match(/^([A-G])(#{1,2}|b{1,2})?(-?\d)$/);
    if (!m) throw new Error(`bad note "${tok}"`);
    const n = T.N(m[1] + (m[2] || ''));
    const midi = 12 * (Number(m[3]) + 1) + LETTER_SEMIS[n.l] + n.a;
    const tags = mods ? mods.split(',') : [];
    out.push({ n, midi, t, dur, tag: tags.find((x) => TECH.has(x)), accent: tags.includes('>'), string: tags.find((x) => x.startsWith('@'))?.slice(1) });
    t += dur;
  }
  return { notes: out, total: t };
}

const QUALITY = { '': 'maj', m: 'min', 5: 'pow', 7: 'dom7', m7: 'min7', maj7: 'maj7', m7b5: 'm7b5', sus4: 'sus4', 6: 'maj6', m6: 'min6', 9: 'dom9', m9: 'min9', dim: 'dim' };
// a power chord (F5: root and 5th) is a rock chord of these studies only, not one of the app's chord types
const chordIvs = (type) => (type === 'pow' ? ['1', '5'] : T.CHORDS[type].iv);
/** "Em:4 D/F#:4 Bm7:8" -> chords with their start and end (in the line's own beats). */
function parseChords(src, S) {
  let at = 0;
  return src.trim().split(/\s+/).map((tok) => {
    const [sym, beats] = tok.split(':');
    const m = sym.match(/^([A-G][#b]?)([^/]*)(?:\/([A-G][#b]?))?$/);
    const type = m && QUALITY[m[2]];
    if (!type) throw new Error(`bad chord "${tok}"`);
    const root = T.N(m[1]);
    const bass = m[3] ? T.N(m[3]) : null;
    const name = type === 'pow' ? `${nm(root, S)}5` : chordName(root, type, S);
    const c = { root, type, bass, start: at, end: at + Number(beats), sym: name + (bass ? `/${nm(bass, S)}` : '') };
    at = c.end;
    return c;
  });
}

// the notes of a key (for approach notes: a note outside it, a half step from the next chord tone)
const KEY_PCS = {
  ionian: [0, 2, 4, 5, 7, 9, 11], aeolian: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], phrygian: [0, 1, 3, 5, 7, 8, 10],
  blues: [0, 2, 3, 4, 5, 6, 7, 9, 10], // the minor and major blues together: both 3rds, the ♭5 and the ♭7
};
// on a dominant 7th the other notes take their jazz names (9, 11, 13 and their alterations)
const DOM_NAMES = { 2: '9', b2: '♭9', '#2': '♯9', 4: '11', '#4': '♯11', 6: '13', b6: '♭13' };

/** One part of a study: its notes, each with the chord under it (the first note of a chord shows its badge). */
function partNotes(song, part, S) {
  const { notes, total } = parseLine(part.notes, part.unit || 1);
  const chords = parseChords(part.chords, S);
  const len = chords[chords.length - 1].end;
  if (Math.abs(total - len) > 1e-6) throw new Error(`${song.id} "${part.name}": ${total} beats of notes, ${len} of chords`);
  const chordAt = (t) => chords.find((c) => t >= c.start - 1e-9 && t < c.end - 1e-9) || chords[chords.length - 1];
  const seen = new Set();
  return notes.map((x, i) => {
    const c = chordAt(x.t);
    const first = !seen.has(c);
    seen.add(c);
    return { ...x, c, first, text: i === 0 ? part.name : undefined };
  });
}

/**
 * Labels against the chord under each note, looking ahead across the parts and round the loop: chord
 * tones by their interval; a note a half step from the next chord tone is an approach note (→) when
 * it lies outside the key or leads into the next chord; a dominant's other notes take their jazz names,
 * and the blue ♭5 keeps its name in a blues.
 */
function labelled(song, seq) {
  const keyPcs = KEY_PCS[song.mode].map((x) => T.mod(T.pc(T.N(song.key)) + x, 12));
  const above = (x) => T.mod(x.midi - T.pc(x.c.root), 12);
  const tone = (x) => chordIvs(x.c.type).some((iv) => T.semis(iv) % 12 === above(x));
  const sounding = seq.filter((x) => !x.rest);
  return seq.map((x) => {
    const item = { dur: x.dur, chord: x.first ? x.c.sym : undefined, text: x.text };
    if (x.rest) return { ...item, rest: true };
    const k = sounding.indexOf(x);
    const next = sounding[(k + 1) % sounding.length];
    let iv = T.ivBetween(x.c.root, x.n);
    if (iv === '?') iv = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'][above(x)];
    const dom = x.c.type.startsWith('dom');
    let deg;
    if (tone(x)) deg = T.fmtDeg(chordIvs(x.c.type).find((v) => T.semis(v) % 12 === above(x)));
    else if (dom && (iv === 'b2' || iv === '#2')) deg = DOM_NAMES[iv];
    else if (song.mode === 'blues' && iv === 'b5') deg = '♭5';
    else if (next !== x && tone(next) && (Math.abs(next.midi - x.midi) === 1 || (next.c !== x.c && [1, 11].includes(T.mod(next.midi - x.midi, 12))))
      && (!keyPcs.includes(T.mod(x.midi, 12)) || next.c !== x.c || iv === '#1')) deg = '→';
    else deg = (dom && DOM_NAMES[iv]) || T.fmtDeg(iv);
    return { ...item, midi: x.midi, n: x.n, deg, tag: x.tag, accent: x.accent || undefined, string: x.string };
  });
}

function song(def) {
  const { parts, form, song: name, artist, year, style, key, mode, ts, groups, center = 3, open = 'allow', adapted, ...meta } = def;
  // the whole tune strings the parts together when they share a metre; the first part opens (the
  // studies are learnt part by part), and the course's steps play the whole tune
  const whole = form && parts.every((p) => !p.ts);
  const partP = sel('Part', [...parts.map((p, i) => [String(i), p.name]), ...(whole ? [['all', 'Whole tune']] : [])], '0');
  return ex({
    ...meta,
    module: M,
    title: `${name} style`,
    // (the exercise header shows the song's name alone: it is narrow on a phone)
    short: name,
    source: `Original line in the style of “${name}” (${artist}, ${year}): its ${adapted ? `feel and technique (${adapted})` : 'key, feel and technique'}, at a practice tempo, not its notes.`,
    label: 'degree',
    params: { part: partP },
    song: { name, artist, year },
    build(p, ctx, S) {
      const b = new Builder(ctx, S);
      const order = p.part === 'all' && whole ? form : [Number(p.part) || 0];
      const items = labelled(def, order.flatMap((pi) => partNotes(def, parts[pi], S)));
      // the line keeps its shape on the neck: placed as a whole, inside the hand position it is written
      // for (a note marked @A stays on that string)
      const region = parts[order[0]].region || def.region || [Math.max(0, center - 2), center + 3];
      for (const it of items) if (it.string && ctx.str(it.string) >= 0) it.region = { lo: region[0], hi: region[1], s: ctx.str(it.string) };
      // the low B of a 5- or 6-string bass is never used: the studies sit on the E string and above,
      // as on a 4-string (the open E stays open)
      const strings = ctx.tuning.map((_, s) => s).filter((s) => s >= Math.max(0, ctx.str('E')));
      emitMixed(b, items, { center, open, fold: false, region, strings });
      const part = parts[order[0]];
      const sig = part.ts || ts;
      const meter = sig ? { timeSig: sig, beatsPerBar: sig[0], groups: part.groups || groups || null } : {};
      const ks = keySigFor(T.N(key), mode === 'blues' ? 'blues' : mode);
      return b.build({ uniform: false, label: 'degree', ...meter, ...(ks != null ? { keySig: ks } : {}) });
    },
  });
}

const e8 = (note, n, mods = '') => Array.from({ length: n }, () => `${note}:e${mods ? `:${mods}` : ''}`).join(' ');
const s16 = (list) => list.trim().split(/\s+/).map((x) => (x === '|' || x.includes(':') ? x : `${x}:s`)).join(' ');

// ---------------------------------------------------------------- Level 1
const stomp = song({
  id: 'mm-stomp', level: 1, song: 'Seven Nation Army', artist: 'The White Stripes', year: 2003,
  style: 'the stomping riff', key: 'E', mode: 'aeolian', bpm: 100, center: 2,
  summary: 'A slow, heavy riff in E minor: long notes, then a driving 8th-note section.',
  about: 'Some of the biggest riffs are just a few notes, played heavy and slow so a whole stadium can sing them. This one walks the E minor pentatonic in half and quarter notes, moves to C and D, then drives the same chords in 8ths. Every note is full length; the drama comes from the weight, not the speed.',
  tips: ['Let each long note ring until the next one: no gaps.', 'Drive section: same volume on every 8th, like a drummer on the floor tom.'],
  parts: [
    { name: 'Riff', chords: 'Em:8 C:4 D:4', notes: 'E1:q E1:q G1:q A1:q | B1:h A1:q G1:q | C2:h B1:q G1:q | D2:h A1:q B1:q' },
    { name: 'Drive', chords: 'Em:4 C:4 D:4 Em:4', notes: `${e8('E1', 6)} G1 A1 | ${e8('C2', 6)} B1 A1 | ${e8('D2', 6)} C2 B1 | E1 E1 G1 B1 D2:q B1:q` },
  ],
  form: [0, 0, 1, 0],
});

const pulse = song({
  id: 'mm-pulse', level: 1, song: 'With or Without You', artist: 'U2', year: 1987,
  style: 'the endless 8th-note pulse', key: 'D', mode: 'ionian', bpm: 96, center: 3,
  summary: 'Steady root 8ths through D – A – Bm – G, then a lift through each chord\'s triad.',
  about: 'A bass line can carry a whole song with nothing but even 8th notes on the roots: the band builds on top while the bass never changes its pulse. Here the four chords (I – V – vi – IV in D) go round with root 8ths, then the line lifts through each chord\'s 3rd and 5th to raise the energy without speeding up.',
  tips: ['Count "1 & 2 & 3 & 4 &": every note exactly on it.', 'Keep the volume level: the build comes from the notes, not from playing harder.'],
  parts: [
    { name: 'Pulse', chords: 'D:4 A:4 Bm:4 G:4', notes: `${e8('D2', 8)} | ${e8('A1', 8)} | ${e8('B1', 8)} | ${e8('G1', 6)} A1 C#2` },
    { name: 'Lift', chords: 'D:4 A:4 Bm:4 G:4', notes: 'D2 D2 D2 D2 F#2 F#2 A2 F#2 | A1 A1 A1 A1 C#2 C#2 E2 C#2 | B1 B1 B1 B1 D2 D2 F#2 D2 | G1 G1 G1 G1 B1 B1 D2 C#2' },
  ],
  form: [0, 0, 1, 1, 0],
});

const zombie = song({
  id: 'mm-zombie', level: 1, song: 'Zombie', artist: 'The Cranberries', year: 1994,
  style: 'the heavy four-chord groove', key: 'E', mode: 'aeolian', bpm: 76, center: 2,
  summary: 'Em – C – G – D: a heavy verse groove with a walk down, then pumping octaves in the chorus.',
  about: 'A slow, heavy rock groove over four chords that sound huge when the band plays them loud. The verse sits on each root with a little walk at the end of the bar, and the last bar walks down the scale into E. The chorus pumps octaves, with the D chord over F♯ in the bass (D/F♯) so the line steps down to E.',
  tips: ['Dig into the first note of each bar.', 'Octaves: fret the low note with the index finger and the high one with the ring or little finger; mute the string in between.'],
  parts: [
    { name: 'Verse', chords: 'Em:4 C:4 G:4 D:4', notes: 'E1:q E1 E1 E1 G1 B1 G1 | C2:q C2 C2 C2 G1 A1 G1 | G1:q G1 G1 G1 B1 D2 B1 | D2:q D2 D2 C2 B1 A1 F#1' },
    { name: 'Chorus', chords: 'Em:4 C:4 G:4 D/F#:4', notes: 'E1 E1 E2 E1 E1 E1 E2 E1 | C2 C2 C3 C2 C2 C2 C3 C2 | G1 G1 G2 G1 G1 G1 G2 G1 | F#1 F#1 F#2 F#1 F#1 F#1 G1 F#1' },
  ],
  form: [0, 0, 1, 1],
});

const spirit = song({
  id: 'mm-spirit', level: 1, song: 'Smells Like Teen Spirit', artist: 'Nirvana', year: 1991,
  style: 'quiet verse, loud chorus', key: 'F', mode: 'aeolian', bpm: 100, center: 2,
  summary: 'F5 – B♭5 – A♭5 – D♭5: long, quiet notes in the verse, then loud root 8ths in the chorus.',
  about: 'Grunge made a style of the jump from quiet to loud. Over power chords (root and 5th, no 3rd), the verse holds each root for two beats and answers with the 5th, softly, leaving space; the chorus hits the same four chords with hard 8ths, an accent on every bar. The skill is control: the same notes, two completely different energies.',
  tips: ['Verse: play near the neck, lightly. Chorus: near the bridge, with power.', 'The accents (>) land on beat 1 of each chorus bar.'],
  parts: [
    { name: 'Verse (quiet)', chords: 'F5:4 Bb5:4 Ab5:4 Db5:4', notes: 'F1:h F1:q C2:q | Bb1:h Bb1:q F1:q | Ab1:h Ab1:q Eb2:q | Db2:h Db2:q Ab1:q' },
    { name: 'Chorus (loud)', chords: 'F5:4 Bb5:4 Ab5:4 Db5:4', notes: `F1:e:> ${e8('F1', 7)} | Bb1:e:> ${e8('Bb1', 7)} | Ab1:e:> ${e8('Ab1', 7)} | Db2:e:> Db2 Db2 Db2 Db2 Db2 Eb2 Eb2` },
  ],
  form: [0, 1, 0, 1],
});

// ---------------------------------------------------------------- Level 2
const dust = song({
  id: 'mm-dust', level: 2, song: 'Another One Bites the Dust', artist: 'Queen', year: 1980,
  style: 'the riff with holes', key: 'E', mode: 'aeolian', bpm: 96, center: 2,
  summary: 'A syncopated E minor riff where the rests are as loud as the notes, then a stop-time breakdown.',
  about: 'Funk-rock riffs live on silence: short notes, exact rests, and a pair of 16ths that kicks the groove forward. This riff answers itself between Em and Am, turns on B7, and the breakdown leaves whole beats empty for the drums. Mute every rest with both hands so the holes stay clean.',
  tips: ['Stop each note on the rest: lift the fretting finger and touch the string with the plucking finger.', 'The two 16ths are quick and even: "1 e &".'],
  parts: [
    { name: 'Riff', chords: 'Em:8 Am:4 B7:4', notes: 'E1 r E1 E1:s E1:s r B1 A1 G1 | E1 r r:q B1:s A1:s G1 F#1 G1 | A1 r A1 A1:s A1:s r E2 D2 C2 | B1 r D#2 B1 A1 F#1 G1 F#1' },
    { name: 'Breakdown', chords: 'Em:8', notes: 'E1:q r:q E1:q r D2 | E1:q r:q E1 G1 A1 B1' },
  ],
  form: [0, 0, 1, 0],
});

const sunshine = song({
  id: 'mm-sunshine', level: 2, song: 'Sunshine of Your Love', artist: 'Cream', year: 1967,
  style: 'the blues-rock riff', key: 'D', mode: 'blues', bpm: 100, center: 5,
  summary: 'A D blues riff that climbs through the blue note, moved as one shape to G and A.',
  about: 'Blues-rock bands built songs from one riff moved to each chord. This riff climbs the D blues scale through the blue note (A♭ to A), falls back down, and moves as one shape to G7 and A7: same fingers, new root. Learn the shape once and the turnaround plays itself.',
  tips: ['Same fingering for every chord: only the hand position moves.', 'The blue note (♭5) is a passing note: give it less weight than the 5th it leads to.'],
  parts: [
    { name: 'Riff', chords: 'D7:8 G7:4 D7:4', notes: 'D2 D2 F2 D2 G2 Ab2 A2:q | C3 A2 G2 F2 D2:q r:q | G1 G1 Bb1 G1 C2 Db2 D2:q | F2 D2 C2 A1 D2:q r:q' },
    { name: 'Turnaround', chords: 'A7:4 G7:4 D7:8', notes: 'A1 A1 C2 A1 D2 Eb2 E2:q | G1 G1 Bb1 G1 C2 Db2 D2:q | D2 D2 F2 D2 G2 Ab2 A2:q | C3 A2 G2 F2 D2:h' },
  ],
  form: [0, 0, 1, 0],
});

const standby = song({
  id: 'mm-standby', level: 2, song: 'Stand by Me', artist: 'Ben E. King', year: 1961,
  style: 'chord tones that sing', key: 'A', mode: 'ionian', bpm: 104, center: 4,
  summary: 'A – F♯m – D – E, two bars each: a two-feel, then a singing quarter-note line through the chord tones.',
  about: 'The doo-wop progression (I – vi – IV – V) has carried hundreds of songs, and the bass often sings its own melody over it. Start in two (half notes, root and 5th), then walk quarter notes up each chord (root, 3rd, 5th and the next note of the key) and back down, so the line leads into every change.',
  tips: ['Two-feel: let each half note ring its full two beats.', 'Walking part: watch how the last note of each chord leads to the next root.'],
  parts: [
    { name: 'Two-feel', chords: 'A:8 F#m:8 D:8 E:8', notes: 'A1:h E1:h | A1:h C#2:q B1:q | F#1:h C#2:h | F#1:h A1:q G#1:q | D2:h A1:h | D2:h F#2:q E2:q | E1:h B1:h | E1:h G#1:q B1:q' },
    { name: 'Chord tones', chords: 'A:8 F#m:8 D:8 E:8', notes: 'A1:q C#2:q E2:q F#2:q | E2:q C#2:q A1:q G#1:q | F#1:q A1:q C#2:q D2:q | C#2:q B1:q A1:q C#2:q | D2:q F#2:q A2:q B2:q | A2:q F#2:q E2:q D2:q | E1:q G#1:q B1:q C#2:q | B1:q G#1:q E1:q G#1:q' },
  ],
  form: [0, 1, 1, 0],
});

const calif = song({
  id: 'mm-calif', level: 2, song: 'Californication', artist: 'Red Hot Chili Peppers', year: 1999,
  style: 'the melodic verse line', key: 'A', mode: 'aeolian', bpm: 84, center: 5,
  summary: 'Am – F verse arpeggios that climb to the octave, then a dotted chorus line over C – G – Dm – Am.',
  about: 'A melodic bass line plays the chord and a small tune at the same time. The verse climbs each chord to its octave and falls back through the 7th or 6th; the chorus holds a dotted root and answers with the chord\'s triad. Play it smoothly, like a singer.',
  tips: ['Verse: one hand position around the 5th fret covers both chords.', 'Chorus: the dotted quarter is long; the 8th after it is light.'],
  parts: [
    { name: 'Verse', chords: 'Am:4 F:4 Am:4 F:4', notes: 'A1:q C2 E2 A2:q G2 E2 | F2:q A1 C2 F2:q E2 C2 | A1:q C2 E2 A2 G2 E2 D2 | F2:q F2 A1 C2 D2 E2:q' },
    { name: 'Chorus', chords: 'C:4 G:4 Dm:4 Am:4', notes: 'C2:dq C2 E2 G2 E2:q | G1:dq G1 B1:e:@A D2:e:@A B1:q:@A | D2:dq D2 F2 A2 F2:q | A1:dq A1 C2 E2 C2:q' },
  ],
  form: [0, 0, 1, 0],
});

const feelgood = song({
  id: 'mm-feelgood', level: 2, song: 'Feel Good Inc.', artist: 'Gorillaz', year: 2005,
  style: 'octave hops with space', key: 'E', mode: 'aeolian', bpm: 120, center: 4,
  summary: 'A laid-back minor riff that hops octaves and leaves holes, then a chorus that bounces off the root.',
  about: 'Alternative and hip-hop bass lines often mix a low root, its octave and silence. This riff hops from the root to the octave, rests, and slides down the chord; the chorus bounces between the root and its octave with a short run at the end of each bar. Keep it relaxed and a little behind the beat.',
  tips: ['Octave shape: the octave is two strings up and two frets higher (over an open string, at the 2nd fret).', 'Rests are short silences, not gaps: keep counting through them.'],
  parts: [
    { name: 'Riff', chords: 'Em:4 Am:4 Em:4 C:4', notes: 'E1 E2:e:@D r E1 D2 r B1 G1 | A1:e:@A A2:e:@G r A1:e:@A G2 r E2 D2 | E1 E2:e:@D r E1 D2 r B1 D2 | C2 C3:e:@G r C2 B1 r A1 B1' },
    { name: 'Chorus', chords: 'G:4 D:4 Am:4 C:4', notes: 'G1:q G1 G2:e:@D r G1 D2 F#2 | D2:q D2 D3:e:@G r D2 F#2 A2 | A1:q:@A A1:e:@A A2:e:@G r A1:e:@A C2 E2 | C2:q C2 C3:e:@G r B1 A1 B1' },
  ],
  form: [0, 0, 1, 0],
});

const blitz = song({
  id: 'mm-blitz', level: 2, song: 'Blitzkrieg Bop', artist: 'Ramones', year: 1976,
  style: 'punk down-strokes', key: 'A', mode: 'ionian', bpm: 120, center: 3,
  summary: 'Fast root 8ths through A, D and E, every note a down-stroke (Π) with a pick or one finger.',
  about: 'Punk bass is a wall of 8th notes on the roots, played with down-strokes only for a hard, even attack. It is a stamina test: start at a tempo you can hold for a whole song, keep the wrist loose, and push the speed only when every note sounds the same. In the verse a short scale step leads into each new chord.',
  tips: ['Π = down-stroke with a pick (or the same finger every time).', 'Relax the shoulder and wrist: tension is what slows you down.'],
  parts: [
    { name: 'Verse', chords: 'A:8 D:4 E:4', notes: `${e8('A1', 8, '⊓,@A')} | ${e8('A1', 6, '⊓,@A')} B1:e:⊓ C#2:e:⊓ | ${e8('D2', 8, '⊓,@D')} | ${e8('E1', 6, '⊓')} F#1:e:⊓ G#1:e:⊓` },
    { name: 'Bridge', chords: 'D:8 A:8 D:8 E:8', notes: `${e8('D2', 8, '⊓,@D')} | ${e8('D2', 4, '⊓,@D')} ${e8('C#2', 2, '⊓')} ${e8('B1', 2, '⊓')} | ${e8('A1', 8, '⊓,@A')} | ${e8('A1', 8, '⊓,@A')} | ${e8('D2', 8, '⊓,@D')} | ${e8('D2', 8, '⊓,@D')} | ${e8('E1', 8, '⊓')} | ${e8('E1', 4, '⊓')} ${e8('F#1', 2, '⊓')} ${e8('G#1', 2, '⊓')}` },
  ],
  form: [0, 0, 1, 0],
});

// ---------------------------------------------------------------- Level 3
const pressure = song({
  id: 'mm-pressure', level: 3, song: 'Under Pressure', artist: 'Queen & David Bowie', year: 1981,
  style: 'the pedal riff with a 16th kick', key: 'D', mode: 'ionian', bpm: 100, center: 5, open: 'avoid',
  summary: 'A D pedal riff with a 16th-note kick in beat 2, then an octave pedal in steady 16ths.',
  about: 'A pedal riff repeats one low note while the harmony moves above it. Here the D keeps coming back, a 16th-note pickup pushes beat 2, and the end of each bar climbs a little before the next. The second part keeps a 16th-note pedal on D and its octave, with a top note that changes each beat.',
  tips: ['The rest and the 16th in beat 2 ("2 e &") are the hook: keep them exact.', 'Octave pedal: fret D on the A string (5th fret) and its octave on the G string (7th fret), skipping the D string.'],
  parts: [
    { name: 'Pedal riff', chords: 'D:4 G/D:4 D:4 A:4', notes: 'D2 D2 r:s D2:s D2 D2 E2 F#2 E2 | D2 D2 r:s D2:s D2 D2 G2 F#2 D2 | D2 D2 r:s D2:s D2 D2 E2 F#2 E2 | A1 A1 r:s A1:s A1 A1 C#2 E2 C#2' },
    { name: 'Octave pedal', chords: 'D:4 G/D:4 D:4 A:4', notes: s16('D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 C3 D2 D2 D2 A2 D2 | D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 B2 D2 D2 D2 G2 D2 | D2 D2 D3 D2 D2 D2 D3 D2 D2 D2 C3 D2 D2 D2 A2 D2 | A1 A1 A2 A1 A1 A1 A2 A1 A1 A1 G2 A1 C#2 E2 G2 E2') },
  ],
  form: [0, 0, 1, 0],
});

const jean = song({
  id: 'mm-jean', level: 3, song: 'Billie Jean', artist: 'Michael Jackson', year: 1982,
  style: 'the 8th-note ostinato', key: 'F#', mode: 'aeolian', bpm: 104, center: 3,
  summary: 'A never-ending 8th-note arpeggio in F♯ minor, then a dotted chorus line over D, F♯m and C♯m7.',
  about: 'An ostinato is a figure that repeats all song long, hypnotic and exact. This one runs up the F♯ minor triad to the 7th, back down, and turns on a passing note, then moves the same shape to Bm and C♯m7. The chorus switches to a dotted root and a run up each chord. Every 8th the same length: this groove is made for dancing.',
  tips: ['Keep the notes short and even, with the same accent every time.', 'One hand position for each chord: the shape moves, the fingers stay.'],
  parts: [
    { name: 'Ostinato', chords: 'F#m:8 Bm:4 C#m7:4', notes: 'F#1 A1 C#2 E2 C#2 A1 G#1 A1 | F#1 A1 C#2 E2 F#2 E2 C#2 A1 | B1 D2 F#2 A2 F#2 D2 C#2 D2 | C#2:e:@A E2:e:@A G#2:e:@D B2:e:@G G#2:e:@D E2:e:@A D#2:e:@A E2:e:@A' },
    { name: 'Chorus', chords: 'D:4 F#m:4 D:4 C#m7:4', notes: 'D2:dq A1 D2 F#2 A2 F#2 | F#1:dq C#2 F#2 A2 G#2 F#2 | D2:dq A1 D2 F#2 A2 B2 | C#2:dq G#1 C#2 E2 G#2 E2' },
  ],
  form: [0, 0, 1, 0],
});

const together = song({
  id: 'mm-together', level: 3, song: 'Come Together', artist: 'The Beatles', year: 1969,
  style: 'the swampy hammer-on riff', key: 'D', mode: 'blues', bpm: 76, center: 3,
  summary: 'A slow D blues riff with hammer-ons and a lazy feel, then a chorus that climbs Bm – G – A.',
  about: 'Laid-back blues riffs sound "swampy" when the notes slide and hammer into each other instead of being plucked one by one. This riff hammers from the ♭3 to the 3 (F to F♯) on the D string and falls back to the root; the second bar answers lower down, hammering C to D on the A string. The chorus climbs each chord to its octave and creeps chromatically back to D.',
  tips: ['H = hammer-on: pluck the first note, then hammer the next with the fretting finger.', 'Play behind the beat: lazy, never late.'],
  parts: [
    { name: 'Riff', chords: 'D7:16', notes: 'D2:q F2 F#2:e:H A2:q D2 C2 | A1:q r A1 C2 D2:e:H F2 D2 | D2:q F2 F#2:e:H A2:q B2 A2 | F#2:q D2 B1 C2 D2:q r' },
    { name: 'Chorus', chords: 'Bm:4 G:4 A:8', notes: 'B1:q D2 F#2 B2:q A2 F#2 | G1:q B1 D2 G2:q F#2 D2 | A1:q C#2 E2 A2:q G2 E2 | A1 A1 r A1 C2 C#2 D2:q' },
  ],
  form: [0, 0, 1, 0],
});

const longview = song({
  id: 'mm-longview', level: 3, song: 'Longview', artist: 'Green Day', year: 1994,
  style: 'the busy punk verse', key: 'E', mode: 'ionian', bpm: 120, center: 4,
  summary: 'A busy 8th-note verse that runs up and down each chord, then a driving root chorus.',
  about: 'Punk-pop bassists often play a melody under the verse: non-stop 8ths that climb each chord and fall back through the scale, while the guitars hold back. Then the chorus slams into root 8ths. Keep the left hand ahead of the line: every bar crosses three strings.',
  tips: ['Verse: alternate two fingers strictly; the line never stops.', 'Look one chord ahead so the shift is ready before the bar line.'],
  parts: [
    { name: 'Verse', chords: 'E:8 B:4 A:4', notes: 'E1 G#1 B1 C#2 B1 G#1 E1 F#1 | G#1 B1 E2 D#2 C#2 B1 G#1 F#1 | B1 D#2 F#2 G#2 F#2 D#2 B1 C#2 | A1 C#2 E2 C#2 B1 A1 G#1 F#1' },
    { name: 'Chorus', chords: 'A:4 E:4 B:4 E:4', notes: `${e8('A1', 6)} G#1 F#1 | ${e8('E1', 6)} F#1 G#1 | ${e8('B1', 6)} C#2 D#2 | E1 E1 E1 E1 B1 A1 G#1 F#1` },
  ],
  form: [0, 0, 1, 1, 0],
});

const chain = song({
  id: 'mm-chain', level: 3, song: 'The Chain', artist: 'Fleetwood Mac', year: 1977,
  style: 'the bass break', key: 'E', mode: 'aeolian', bpm: 120, center: 4,
  summary: 'A low E pedal that builds tension, then a solo bass break up the E minor pentatonic.',
  about: 'A bass break is the moment the band drops out and the bass takes the spotlight. First a long pedal on low E, with small climbs that keep the tension rising; then a phrase up the E minor pentatonic to the high E, a turn through D, and a fall home. Play the pedal quietly so the break can explode.',
  tips: ['Pedal: palm-mute lightly for a dark, steady tone.', 'Break: play it with full, singing notes, and let the last E ring.'],
  parts: [
    { name: 'Pedal', chords: 'Em:16', notes: `${e8('E1', 8)} | ${e8('E1', 4)} G1 G1 A1 A1 | ${e8('E1', 8)} | ${e8('E1', 4)} B1 B1 D2 D2` },
    { name: 'Break', chords: 'Em:8 D:4 Em:4', notes: 'E1 G1 A1 B1 D2 E2 G2 E2 | F#2:q E2 D2 E2:h | D2 F#2 A2 F#2 E2 D2 B1 A1 | B1:q A1 G1 E1:h' },
  ],
  form: [0, 1, 0, 1],
});

// ---------------------------------------------------------------- Level 4
const money = song({
  id: 'mm-money', level: 4, song: 'Money', artist: 'Pink Floyd', year: 1973,
  style: 'the riff in 7/4', key: 'B', mode: 'aeolian', bpm: 112, center: 4, ts: [7, 4],
  summary: 'A B minor riff in 7/4, felt as 4 + 3, then a middle section through Em7 and F♯m7.',
  about: 'Seven beats in a bar sound strange until you feel them as two groups: 4 + 3. This riff fills the first four beats with a climb to the 5th and answers in the last three with a quick turn back to the root. The middle section moves the same idea to Em7 and F♯m7.',
  tips: ['Count "1 2 3 4 1 2 3" and accent both "1"s.', 'Loop one bar until the 3-beat group stops feeling short.'],
  parts: [
    { name: 'Riff', chords: 'Bm7:14', notes: 'B1:q B1 D2 E2:q F#2:q A2 F#2 E2:q D2 B1 | B1:q B1 D2 E2:q D2:q B1 A1 F#1:q A1:q' },
    { name: 'Middle', chords: 'Em7:7 F#m7:7', notes: 'E1:q E1 G1 A1:q B1:q D2 B1 A1:q G1 F#1 | F#1:q F#1 A1 B1:q C#2:q E2 C#2 B1:q A1 C#2' },
  ],
  form: [0, 0, 1, 0],
});

const criminal = song({
  id: 'mm-criminal', level: 4, song: 'Smooth Criminal', artist: 'Michael Jackson', year: 1987,
  style: 'the 16th-note engine', key: 'A', mode: 'aeolian', bpm: 100, center: 2,
  summary: 'A driving 16th-note octave pedal through Am – F – G – E7, then a half-time groove with ghost notes.',
  about: 'Some grooves are machines: 16th notes that never stop, the low root ticking under a little melody on top. Each bar pedals the root and its octave and ends with a run down the chord, landing on the next root. The half-time part breathes, with a ghost note (x) after each root.',
  tips: ['Alternate fingers strictly: the 16ths must sound like one machine.', 'Ghost note (x): touch the string with the fretting hand without pressing, then pluck.'],
  parts: [
    { name: '16th engine', chords: 'Am:4 F:4 G:4 E7:4', notes: s16('A1:s:@A A1:s:@A A2 A1:s:@A G2 A1:s:@A E2 A1:s:@A A1:s:@A A1:s:@A A2 A1:s:@A C3 B2 G2 E2 | F1 F1 F2 F1 E2 F1 C2 F1 F1 F1 F2 F1 A2 G2 E2 C2 | G1 G1 G2 G1 F2 G1 D2 G1 G1 G1 G2 G1 B2 A2 F2 D2 | E1 E1 E2 E1 D2 E1 B1 E1 E1 E1 E2 E1 G#2 E2 D2 B1') },
    { name: 'Half-time', chords: 'Am:4 F:4 G:4 E7:4', notes: 'A1:q:@A A1:e:x,@A A1:e:@A C2:q E2 D2 | F1:q F1:e:x F1 A1:q:@A C2 A1:e:@A | G1:q G1:e:x G1 B1:q D2 C2 | E1:q E1:e:x E1 G#1:q B1 D2' },
  ],
  form: [0, 0, 1, 0],
});

const goodtimes = song({
  id: 'mm-goodtimes', level: 4, song: 'Good Times', artist: 'Chic', year: 1979,
  style: 'the disco 16ths', key: 'E', mode: 'dorian', bpm: 100, center: 2,
  summary: 'Em7 – A7: a syncopated 16th-note disco line with octave flicks and ghost notes, then an octave break.',
  about: 'Disco bass is a dance between the beat and the 16ths around it: a root on 1, an octave flick, a rest, then a run that lands on the next chord. Two chords (Em7 and A7, the Dorian i – IV) are enough for a whole song when the line keeps moving. The break bounces octaves with rests in between.',
  tips: ['Count "1 e & a" for every beat and place each note on its syllable.', 'Octave flick: pluck the octave short and light.'],
  parts: [
    { name: 'Groove', chords: 'Em7:4 A7:4 Em7:4 A7:4', notes: 'E1 E2:s E1:s r:s E1:s G1:s A1:s B1 D2:s E2:s r:s D2:s B1:s A1:s | A1 A2:s A1:s r:s A1:s C#2:s D2:s E2 G2:s E2:s r:s D2:s C#2:s B1:s | E1 E2:s E1:s E1:s:x E1:s G1:s A1:s B1 B1:s:x D2:s E2:s D2:s B1:s G1:s | A1 A2:s A1:s A1:s:x A1:s C#2:s E2:s G2 F#2:s E2:s D2:s C#2:s B1:s A1:s' },
    { name: 'Octave break', chords: 'Em7:4 A7:4', notes: s16('E1 E2 r E1 E2 r E1 E2 r E1 E2 E1 D2 B1 A1 B1 | A1 A2 r A1 A2 r A1 A2 r A1 A2 A1 G2 E2 C#2 B1') },
  ],
  form: [0, 0, 1, 0],
});

const flyaway = song({
  id: 'mm-flyaway', level: 4, song: 'Fly Away', artist: 'Lenny Kravitz', year: 1998,
  style: 'the bluesy rock riff', key: 'A', mode: 'blues', bpm: 100, center: 4,
  summary: 'A – C – G – D: an octave-kicking rock riff with a ghost-note push, then a driving chorus.',
  about: 'Rock riffs borrow from the blues: the C and G chords in the key of A come from the ♭3 and ♭7. Each bar kicks the octave, ghosts a 16th to push into beat 4 and walks into the next chord. The chorus drives root 8ths with a step into each change.',
  tips: ['The ghost note (x) is felt more than heard: it gives the push.', 'Keep the 8ths straight and solid, like a drummer\'s hi-hat.'],
  parts: [
    { name: 'Riff', chords: 'A:4 C:4 G:4 D:4', notes: 'A1:e:@A A1:e:@A A2:e:@G A1:e:@A A1:e:@A A1:s:x,@A A1:s:@A G1 B1 | C2 C2 C3 C2 C2 C2:s:x C2:s B1 A1 | G1 G1 G2 G1 G1 G1:s:x G1:s A1 C#2 | D2 D2 D3 D2 D2 D2:s:x D2:s C2 B1' },
    { name: 'Chorus', chords: 'A:8 C:4 D:4', notes: `${e8('A1', 8)} | ${e8('A1', 6)} B1 B1 | ${e8('C2', 6)} B1 C#2 | ${e8('D2', 6)} C2 B1` },
  ],
  form: [0, 0, 1, 0],
});

// ---------------------------------------------------------------- Level 5
const schism = song({
  id: 'mm-schism', level: 5, song: 'Schism', artist: 'Tool', year: 2001,
  style: 'riffs in 5/8 and 7/8', key: 'E', mode: 'phrygian', bpm: 140, center: 2,
  adapted: 'in E for a standard-tuned bass; the song is in drop-D tuning',
  summary: 'An E Phrygian pedal riff in 5/8 (3 + 2) and another in 7/8 (2 + 2 + 3). The click is every 8th.',
  about: 'Progressive rock moves through odd metres as if they were normal. Both riffs return to the low E on every bar and change only the notes after it, with the dark ♭2 (F) of the Phrygian mode. In 5/8 feel 3 + 2, in 7/8 feel 2 + 2 + 3. Learn each part on its own, then switch between them.',
  tips: ['Say the groups out loud: "1-2-3 1-2" and "1-2 1-2 1-2-3".', 'The tempo counts 8th notes: start around 140 and add speed slowly.'],
  parts: [
    { name: 'Riff in 5/8', ts: [5, 8], groups: [3, 2], unit: 2, chords: 'Em:20', notes: 'E1 E1 F1 E1 G1 | E1 E1 F1 A1 G1 | E1 E1 B1 A1 F1 | E1 E1 D2 C2 B1' },
    { name: 'Riff in 7/8', ts: [7, 8], groups: [2, 2, 3], unit: 2, chords: 'Em:28', notes: 'E1 E1 G1 E1 A1:e:@A G1 F1 | E1 E1 G1 E1 B1:e:@A A1:e:@A G1 | E1 E1 G1 E1 C2:e:@A B1:e:@A A1:e:@A | E1 E1 D2 C2 B1:e:@A A1:e:@A F1' },
  ],
});

const cantstop = song({
  id: 'mm-cantstop', level: 5, song: 'Can\'t Stop', artist: 'Red Hot Chili Peppers', year: 2002,
  style: 'funk-rock 16ths with ghosts', key: 'E', mode: 'aeolian', bpm: 84, center: 2,
  summary: 'An E minor funk-rock groove of 16ths and ghost notes, then a chorus that snaps the octave on each chord.',
  about: 'Funk-rock bass keeps both hands moving in 16ths and chooses which ones sound: real notes, ghost notes (x) and rests. The verse rocks between the root, the octave and the minor pentatonic; the chorus hits each root, snaps its octave and climbs into the next chord.',
  tips: ['Keep the plucking hand alternating through the ghosts and the rests.', 'The ghosts (x) are quiet: the real notes must stand out above them.'],
  parts: [
    { name: 'Verse', chords: 'Em7:8 Cmaj7:4 D:4', notes: s16('E1 E1:s:x E2 E1 r E1:s:x G1 A1 B1 B1:s:x D2 E2 D2 B1:s:x A1 G1 | E1 E1:s:x E2 E1 r E1:s:x G1 A1 B1 A1 G1 E1:s:x D2:e B1:e | C2 C2:s:x C3 C2 r C2:s:x E2 G2 B2 G2 E2 C2:s:x B1:e A1:e | D2 D2:s:x D3 D2 r D2:s:x F#2 A2 C3 A2 F#2 D2:s:x C2:e B1:e') },
    { name: 'Chorus', chords: 'G:4 D:4 Em7:4 C:4', notes: 'G1 G1:s G2:s r:s G1:s B1:s D2:s G2 D2:s B1:s r:s G1:s A1:s B1:s | D2 D2:s D3:s r:s D2:s F#2:s A2:s D3 A2:s F#2:s r:s D2:s E2:s F#2:s | E1 E1:s E2:s r:s E1:s G1:s B1:s E2 B1:s G1:s r:s E1:s F#1:s G1:s | C2 C2:s C3:s r:s C2:s E2:s G2:s C3 G2:s E2:s r:s D2:s E2:s F#2:s' },
  ],
  form: [0, 0, 1, 0],
});

const hysteria = song({
  id: 'mm-hysteria', level: 5, song: 'Hysteria', artist: 'Muse', year: 2003,
  style: 'the relentless 16th arpeggios', key: 'A', mode: 'aeolian', bpm: 80, center: 3,
  summary: 'Non-stop 16th-note arpeggios through Am – G – F – E, then an octave chorus in 8ths.',
  about: 'A stamina study in the style of the hard-rock 16th-note line: each chord runs up to its octave, turns, and climbs again, with a different four-note turn at the end of the bar (the E chord takes the G♯ of harmonic minor). Every note even, every string crossing clean, for as long as the song lasts.',
  tips: ['Use the speed trainer: start at 70 and let it climb.', 'Mute behind you: a finger of each hand stops the string you have just left.'],
  parts: [
    { name: 'Arpeggios', chords: 'Am:4 G:4 F:4 E:4', notes: s16('A1 C2 E2 A2 G2 E2 C2 E2 A1 C2 E2 A2 B2 A2 G2 E2 | G1 B1 D2 G2 F#2 D2 B1 D2 G1 B1 D2 G2 A2 G2 F#2 D2 | F1 A1 C2 F2 E2 C2 A1 C2 F1 A1 C2 F2 G2 F2 E2 C2 | E1 G#1 B1 E2 D2 B1 G#1 B1 E1 G#1 B1 E2 F2 E2 D2 B1') },
    { name: 'Chorus', chords: 'F:4 C:4 G:4 Am:4', notes: 'F1 F2 F1 F2 F1 F2 E2 C2 | C2 C3 C2 C3 C2 C3 B2 G2 | G1 G2 G1 G2 G1 G2 F2 D2 | A1 A2 A1 A2 A1 A2 G2 E2' },
  ],
  form: [0, 0, 1, 0],
});

const duke = song({
  id: 'mm-duke', level: 5, song: 'Sir Duke', artist: 'Stevie Wonder', year: 1976,
  style: 'the unison horn line', key: 'B', mode: 'ionian', bpm: 96, center: 6,
  summary: 'A fast 8th-note line in B major with chromatic passing notes, played like a horn section, plus a groove part.',
  about: 'In soul and funk the bass often doubles the horns on a big unison line: a melody that runs through the chords with chromatic passing notes and lands on a chord tone at each change. This line climbs and turns through Bmaj7 – G♯m7 – C♯m7 – F♯7 and ends on the ♭9 of F♯7, which pulls back to the start. The groove part sits on each root with a syncopated answer.',
  tips: ['Play it like a horn player: every note full, no gaps.', 'Five sharps: say the note names first, then play.'],
  parts: [
    { name: 'Groove', chords: 'Bmaj7:4 G#m7:4 C#m7:4 F#7:4', notes: 'B1:q r B1 D#2 F#2 B1 A#1 | G#1:q r G#1 B1 D#2 F#2 G#2 | C#2:q r C#2 E2 G#2 C#2 B1 | F#1:q r F#1 A#1 C#2 E2 A#1' },
    { name: 'Horn line', chords: 'Bmaj7:4 G#m7:4 C#m7:4 F#7:4', notes: 'F#2 G2 G#2 A#2 B2 A#2 G#2 F#2 | D#2 E2 F#2 G#2 B2:q G#2 F#2 | E2 F#2 G#2 B2 C#3 B2 G#2 E2 | F#2 A#2 C#3 E3 D#3 C#3 A#2 G2' },
  ],
  form: [0, 1, 1, 0],
});

const whatsgoingon = song({
  id: 'mm-whatsgoingon', level: 5, song: 'What\'s Going On', artist: 'Marvin Gaye', year: 1971,
  style: 'the Motown melodic line', key: 'E', mode: 'ionian', bpm: 92, center: 4,
  summary: 'A syncopated, chromatic line through Emaj7 – C♯m7 – F♯m7 – B7, then the same chords with ghosted triplets.',
  about: 'The great Motown bassists played melodies under the singer: syncopated rhythms, chromatic approach notes (→) into the chord tones, and ghosted triplets that make the groove bounce. Each bar starts on its root with a dotted rhythm and climbs the chord, with a chromatic step into a chord tone along the way.',
  tips: ['The dotted 8th + 16th on beat 1 is the signature: long, short.', 'Ghosted triplets (x x note): barely touch the first two.'],
  parts: [
    { name: 'Melodic line', chords: 'Emaj7:4 C#m7:4 F#m7:4 B7:4', notes: 'E1:de E1:s r G#1 B1 C#2 D2 D#2 | C#2:de C#2:s r E2 G#2 B1 C2 C#2 | F#1:de F#1:s r A1 C#2 E2 A1 A#1 | B1:de B1:s r D#2 F#2 A2 G#2 F#2' },
    { name: 'Ghost triplets', chords: 'Emaj7:4 C#m7:4 F#m7:4 B7:4', notes: 'E1:q E1:t:x E1:t:x E1:t B1:q G#1 B1 | C#2:q C#2:t:x C#2:t:x C#2:t G#1:q E2 G#1 | F#1:q F#1:t:x F#1:t:x F#1:t C#2:q A1 A#1 | B1:q:@A B1:t:x,@A B1:t:x,@A B1:t:@A F#1:q G1 F1' },
  ],
  form: [0, 0, 1, 0],
});

// ---------------------------------------------------------------- Level 6
const deantown = song({
  id: 'mm-deantown', level: 6, song: 'Dean Town', artist: 'Vulfpeck', year: 2016,
  style: 'the virtuoso 16th line', key: 'D', mode: 'aeolian', bpm: 84, center: 5,
  summary: 'A staccato 16th-note line with rests, octave leaps and chromatic turns through Dm7 – B♭maj7 – C7, then a breakdown.',
  about: 'Modern funk bass takes the lead: a high, staccato 16th-note line full of rests, leaps and chromatic approaches (→), played so cleanly that the silences groove as hard as the notes. Each bar drives up its chord and runs back down into the next. The breakdown is all space: short 8ths, octaves and a quick 16th fill.',
  tips: ['Staccato: release every note at once; the rests are part of the line.', 'Learn it one beat at a time at 60, then join the beats.'],
  parts: [
    { name: 'Line', chords: 'Dm7:4 Bbmaj7:4 C7:4 Dm7:4', notes: s16('D2 r D2 F2 r F2 G2 G#2 A2 r C3 A2 G2 F2 D2 C2 | Bb1 r Bb1 D2 r F2 A2 Bb2 A2 r F2 D2 C2 Bb1 A1 G1 | C2 r C2 E2 r G2 Bb2 B2 C3 r Bb2 G2 E2 C2 Bb1 C#2 | D2 D3 r D2 C3 r A2 G2 F2 r E2 F2 D2 r A1 C2') },
    { name: 'Breakdown', chords: 'Dm7:8', notes: 'D2 r D3 r C3:s A2:s r:s G2:s F2 D2 | D2 r D3 r F3:s E3:s r:s C3:s A2 C3' },
  ],
  form: [0, 0, 1, 0],
});

const yyz = song({
  id: 'mm-yyz', level: 6, song: 'YYZ', artist: 'Rush', year: 1981,
  style: 'the odd-metre intro and the drive', key: 'E', mode: 'aeolian', bpm: 104, center: 3,
  summary: 'A 5/4 riff (3 + 2) that leaps the octave, then fast 16th-note runs through the chords in 4/4.',
  about: 'Progressive rock trios give the bass the riffs and the fast runs. The intro is in 5/4, felt as 3 + 2, with an octave leap and a turn down the scale in every bar. The drive section runs 16ths up and down each chord in a shape that crosses all four strings: stamina, accuracy and clean shifts.',
  tips: ['5/4: count "1-2-3 1-2" and lean on both "1"s.', 'Drive: use the speed trainer from 80 and keep every 16th even.'],
  parts: [
    { name: 'Intro in 5/4', ts: [5, 4], groups: null, chords: 'Em:10 C:5 D:5', notes: 'E1 E1 E2:q:@D B1:e:@A A1:e:@A G1:q A1:q:@A | E1 E1 E2:q:@D D2 B1:e:@A A1:e:@A G1 F#1:q | C2 C2 C3:q G2 E2 D2:q E2:q | D2 D2 D3:q A2 F#2 E2 D2 B1:q' },
    { name: 'Drive', chords: 'Em:8 C:4 D:4', notes: s16('E1 E1 G1 A1 B1 B1 D2 E2 G2 E2 D2 B1 A1 G1 E1 G1 | A1 A1 B1 D2 E2 E2 G2 A2 B2 A2 G2 E2 D2 B1 A1 B1 | C2 C2 E2 G2 C3 G2 E2 C2 B1 C2 E2 G2 B2 G2 E2 D2 | D2 D2 F#2 A2 D3 A2 F#2 D2 C2 D2 F#2 A2 C3 B2 A2 F#2') },
  ],
});

const tommy = song({
  id: 'mm-tommy', level: 6, song: 'Tommy the Cat', artist: 'Primus', year: 1991,
  style: 'the snapping slap riff', key: 'E', mode: 'blues', bpm: 84, center: 3,
  summary: 'A 16th-note slap riff with thumb ghosts, hammer-ons, pops and pull-offs over E7, G7 and A7.',
  about: 'Alternative slap players turned the technique into something percussive and strange: thumb notes, muted thumb ghosts (x), pops on the high strings, and hammer-ons and pull-offs that sound without a pluck. This riff keeps the thumb bouncing on the open string while pops and hammers answer it, then moves the idea to G7 and A7.',
  tips: ['T thumb · x thumb on a muted string · P pop · H hammer-on · PO pull-off.', 'Start at 60: the thumb must keep exact time between the pops.'],
  parts: [
    { name: 'Slap riff', chords: 'E7:8 G7:4 A7:4', notes: s16('E1:s:T E1:s:x E2:s:P E1:s:T G1:s:H E1:s:T E1:s:x D2:s:P E1:s:T G1:s:T G#1:s:H E1:s:T E2:s:P D2:s:P B1:s:T A1:s:T | E1:s:T E1:s:x E2:s:P E1:s:T G1:s:H E1:s:T E1:s:x D2:s:P E1:s:T E1:s:x G2:s:P F#2:s:PO E2:s:PO D2:s:P B1:s:T G1:s:T | G1:s:T G1:s:x G2:s:P G1:s:T Bb1:s:H G1:s:T G1:s:x F2:s:P G1:s:T G1:s:x G2:s:P F2:s:P D2:s:P B1:s:T C2:s:H C#2:s:H | A1:s:T A1:s:x A2:s:P A1:s:T C2:s:H A1:s:T A1:s:x G2:s:P A1:s:T A1:s:x A2:s:P G2:s:P E2:s:P C#2:s:T D2:s:H D#2:s:H') },
    { name: 'Breakdown', chords: 'E7:8', notes: 'E1:q:T r E2:e:P D2:e:P B1:e:T A1:e:T G1:e:T | E1:q:T r E2:e:P G2:e:P F#2:e:PO E2:e:PO D2:e:P' },
  ],
  form: [0, 0, 1, 0],
});

const teentown = song({
  id: 'mm-teentown', level: 6, song: 'Teen Town', artist: 'Weather Report', year: 1977,
  style: 'the fusion 16th run', key: 'F', mode: 'ionian', bpm: 88, center: 3,
  summary: 'Fast 16th-note arpeggio lines through Gm7 – C7 – Fmaj7 – A7 with ♭9s, then a chromatic line with ghost notes.',
  about: 'Fusion bass in the style of Jaco Pastorius: long 16th-note lines that run each chord up to its octave, turn on a chromatic or ♭9 note and climb again, as fluid as a saxophone. The second part runs chromatic lines into each chord with ghost notes in between. It needs a light touch and a relaxed hand at speed.',
  tips: ['Pluck close to the bridge with a light touch: the notes speak faster.', 'Practise each bar alone, slowly, before linking them.'],
  parts: [
    { name: 'Run', chords: 'Gm7:4 C7:4 Fmaj7:4 A7:4', notes: s16('G1 Bb1 D2 F2 G2 F2 D2 Bb1 A1 Bb1 D2 F2 A2 G2 F2 D2 | C2 E2 G2 Bb2 C3 Bb2 G2 E2 Db2 E2 G2 Bb2 Db3 C3 Bb2 G2 | F1 A1 C2 E2 F2 E2 C2 A1 G1 A1 C2 E2 G2 F2 E2 C2 | A1 C#2 E2 G2 A2 G2 E2 C#2 Bb1 C#2 E2 G2 Bb2 A2 G2 E2') },
    { name: 'Chromatic line', chords: 'Gm7:4 C7:4 Fmaj7:4 A7:4', notes: 'G2:s Gb2:s F2:s E2:s Eb2:s D2:s C#2:s D2:s Bb1 G1 r G1:s:x G1:s | C2:s B1:s Bb1:s A1:s Ab1:s G1:s F#1:s G1:s E1 C2 r C2:s:x C2:s | F2:s E2:s Eb2:s D2:s Db2:s C2:s B1:s C2:s A1 F1 r F1:s:x F1:s | A1:s Bb1:s B1:s C2:s C#2:s D2:s D#2:s E2:s G2 E2 C#2 A1' },
  ],
  form: [0, 0, 1, 0],
});

const thump = song({
  id: 'mm-thump', level: 6, song: 'Classical Thump', artist: 'Victor Wooten', year: 1996,
  style: 'double thumbing', key: 'E', mode: 'mixolydian', bpm: 66, center: 3,
  summary: 'Double thumbing through E7, A7 and B7: thumb down, thumb up and pops, from 8ths to continuous 16ths.',
  about: 'Double thumbing turns the thumb into a pick. The down-stroke (TΠ) goes through the string and comes to rest on the next one; the up-stroke (TV) comes back through the same string with the thumbnail. The first part sets the motion up in 8ths: thumb down, pop, thumb up, pop, ending each half-bar with a hammer-on; the second runs continuous 16ths: thumb down, thumb up and two pops on every beat. Slow and even beats fast and messy.',
  tips: ['TΠ thumb down-stroke (it rests on the next string) · TV thumb up-stroke, back through the same string · P pop · H hammer-on.', 'Thumb alone first: down–up on one string with the metronome at 60.'],
  parts: [
    { name: 'Motion in 8ths', chords: 'E7:4 A7:2 B7:2', notes: 'E1:e:T⊓ E2:e:P B1:e:TV,@E D2:e:P E1:e:T⊓ E2:e:P G1:e:TV,@E G#1:e:H | A1:e:T⊓ A2:e:P E2:e:TV,@A G2:e:P B1:e:T⊓,@A B2:e:P D#2:e:TV,@A E2:e:H' },
    { name: 'Double thumb 16ths', chords: 'E7:8 A7:4 B7:4', notes: s16('E1:s:T⊓ E1:s:TV E2:s:P D2:s:P E1:s:T⊓ G1:s:TV,@E D2:s:P E2:s:P E1:s:T⊓ E1:s:TV G2:s:P E2:s:P B1:s:T⊓,@A B1:s:TV,@A D2:s:P E2:s:P | E1:s:T⊓ E1:s:TV E2:s:P G2:s:P E1:s:T⊓ G#1:s:TV,@E D2:s:P E2:s:P E1:s:T⊓ E1:s:TV B2:s:P G#2:s:P B1:s:T⊓,@A B1:s:TV,@A A2:s:P E2:s:P | A1:s:T⊓ A1:s:TV A2:s:P G2:s:P A1:s:T⊓ C#2:s:TV,@A G2:s:P A2:s:P A1:s:T⊓ A1:s:TV E2:s:P A2:s:P E2:s:T⊓,@A E2:s:TV,@A G2:s:P A2:s:P | B1:s:T⊓,@A B1:s:TV,@A B2:s:P A2:s:P B1:s:T⊓,@A D#2:s:TV,@A A2:s:P B2:s:P B1:s:T⊓,@A B1:s:TV,@A F#2:s:P B2:s:P F#1:s:T⊓,@E F#1:s:TV,@E D#2:s:P E2:s:P') },
  ],
  form: [0, 1, 1, 0],
});

const anesthesia = song({
  id: 'mm-solo-piece', level: 6, song: 'Anesthesia (Pulling Teeth)', artist: 'Metallica', year: 1983,
  style: 'a complete bass solo', key: 'E', mode: 'aeolian', bpm: 76, center: 7,
  summary: 'A whole solo piece in four parts: triplet arpeggios, a singing theme, a 16th-note tremolo build and a finale.',
  about: 'Heavy-metal bassists made the bass solo a showpiece of its own. This complete original piece in E minor has four parts: wide triplet arpeggios across the neck (the B7 brings the D♯ of harmonic minor), a singing theme in the upper register, a tremolo build (each note four times in 16ths), and a finale that sweeps every chord and lands on a long low E. Play the parts on their own, then the whole piece.',
  tips: ['Arpeggios: let the notes ring into each other like a chord.', 'Tremolo: alternate two fingers as fast and as evenly as the tempo allows.'],
  parts: [
    { name: 'Arpeggios', region: [0, 9], chords: 'Em:4 C:4 Am:4 B7:4', notes: 'E1:t B1:t E2:t G2:t B2:t G2:t E2:t B1:t G1:t B1:t E2:t G2:t | C2:t G2:t C3:t E3:t C3:t G2:t E2:t C2:t G1:t C2:t E2:t G2:t | A1:t E2:t A2:t C3:t E3:t C3:t A2:t E2:t C2:t E2:t A2:t C3:t | B1:t F#2:t B2:t D#3:t B2:t A2:t F#2:t D#2:t B1:t D#2:t F#2:t A2:t' },
    { name: 'Theme', chords: 'Em:4 Am:4 D:4 G:4 C:4 F#m7b5:4 B7:8', notes: 'B2:q G2 A2 B2:q E3:q | C3:dq B2 A2:q E2:q | F#2:q A2 D3 C3:q A2:q | B2:dq A2 G2:q D2:q | E2:q G2 C3 E3:q C3:q | A2:dq G2 F#2:q C3:q | B2:dq A2 G2 F#2 E2 D#2 | F#2:h B1:h' },
    { name: 'Tremolo build', chords: 'Em:4 C:4 D:4 B7:4', notes: s16('E2 E2 E2 E2 G2 G2 G2 G2 B2 B2 B2 B2 E3 E3 E3 E3 | E3 E3 E3 E3 C3 C3 C3 C3 G2 G2 G2 G2 E2 E2 E2 E2 | F#2 F#2 F#2 F#2 A2 A2 A2 A2 D3 D3 D3 D3 F#3 F#3 F#3 F#3 | D#3 D#3 D#3 D#3 B2 B2 B2 B2 A2 A2 A2 A2 F#2 F#2 F#2 F#2') },
    { name: 'Finale', region: [0, 9], chords: 'Em:4 C:4 Am:4 B7:4 Em:4', notes: 'E1:s G1:s B1:s E2:s G2:s B2:s E3:s B2:s G2:s E2:s B1:s G1:s E1:q | C2:s E2:s G2:s C3:s E3:s C3:s G2:s E2:s C2:s E2:s G2:s E2:s C2:q | A1:s C2:s E2:s A2:s C3:s E3:s C3:s A2:s E2:s C2:s A1:s C2:s A1:q | B1:s D#2:s F#2:s A2:s B2:s D#3:s B2:s A2:s F#2:s D#2:s B1:s A1:s B1:q | E1:w:>' },
  ],
  form: [0, 1, 2, 3],
});

export default [
  stomp, pulse, zombie, spirit,
  dust, sunshine, standby, calif, feelgood, blitz,
  pressure, jean, together, longview, chain,
  money, criminal, goodtimes, flyaway,
  schism, cantstop, hysteria, duke, whatsgoingon,
  deantown, yyz, tommy, teentown, thump, anesthesia,
];
