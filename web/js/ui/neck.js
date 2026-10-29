// The Neck block of the Practice room (it was the Neck explorer screen): a scale, chord or the plain
// notes on the whole neck, by degree or name; a tap on any fret plays it. With the room's harmony on, its
// bar (Follow and the chord chips) sits above the board, so the chords and the neck fit one phone screen;
// following, the board shows the chord sounding (or, over a drone, the chosen scale on the drone's key).
import { h, infoBtn } from './dom.js';
import { settings } from '../store.js';
import { makeCtx } from '../fretboard.js';
import { FretboardView, degKey } from '../views/fretboardView.js';
import * as T from '../theory.js';
import * as A from '../audio.js';

const EXPLORE_SETS = [
  ...['ionian', 'aeolian', 'majorPent', 'minorPent', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'harmonicMinor', 'melodicMinor', 'harmonicMajor', 'altered', 'lydianDom', 'phrygianDom', 'mixolydianB6', 'lydianAug', 'locrianN2', 'bebopDom', 'dimHW', 'dimWH', 'wholeTone', 'chromatic']
    .map((k) => [`s:${k}`, `Scale · ${T.SCALES[k].name}`]),
  ...['maj', 'min', 'dim', 'aug', 'sus4', 'maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'maj6', 'min6', 'dom9', 'maj9', 'min9']
    .map((k) => [`c:${k}`, `Chord · ${T.CHORDS[k].name}`]),
  ['n:none', 'Just the notes (all names)'],
];
// scales without one note per letter are spelled plainly (no double accidentals, no C♭ F♭ E♯ B♯)
const PLAIN = new Set(['dimHW', 'dimWH', 'wholeTone', 'augmented', 'chromatic', 'messiaen1', 'messiaen2', 'messiaen3', 'messiaen4', 'messiaen5', 'messiaen6', 'messiaen7']);
// the altered scale as jazz players write it over its dominant: R ♭9 ♯9 3 ♭5 ♭13 ♭7 (by semitones: its spelling, its label)
const ALTERED = { 0: ['1', '1'], 1: ['b2', 'b9'], 3: ['b3', '#9'], 4: ['3', '3'], 6: ['b5', 'b5'], 8: ['b6', 'b13'], 10: ['b7', 'b7'] };
// a dominant's alterations and a °7's 7th are written plainly in jazz (A♭7♭9: A, C°7: C E♭ G♭ A); its chord tones stay
const ALTERATIONS = new Set(['b5', '#5', 'b9', '#9', '#11', 'b13', 'bb7']);
const INFO = [
  '🎸 A scale or chord on the whole neck, in any key',
  '🏷 Degrees, note names or plain dots',
  '👆 Tap any fret to hear it',
  '🎹 With the Harmony on, its chords sit above the neck',
  '🎼 Chord or Scale: the chord sounding or its scale, and the next change',
  '✋ Off: your own scale or chord',
  '👆 Stopped, a tap on a chord shows it on the neck, to find its notes before you play',
];

// the altered scale's root is named as its dominant's, flats on the black keys (A♭ Altered, its 3rd C); the
// blues as its minor pentatonic, the key's lead-sheet name (E♭ blues, as the Library writes it)
const nameIvs = (shown, ivs) => (shown === 's:altered' ? T.CHORDS.dom7.iv : shown === 's:blues' ? T.SCALES.minorPent.iv : ivs);

/** The Neck block: { el, follow, setBar, own, setOwn, rootName, dispose }. */
export function neckPanel({ onOwn } = {}) {
  const S = settings;
  const ctx = makeCtx(S);
  let rootPc = 0, set = 's:ionian', label = 'degree', upTo = 12;
  let lead = null;   // the harmony followed: { root, type (its chord), ivs (a drone's chord by its intervals) or scale (its scale), name, next }; none of them: the player's own scale on the root
  const boardWrap = h('div', { class: 'board neck-board' });
  const rootSel = h('select', { class: 'mini-sel', 'aria-label': 'Key' });
  const setSel = h('select', { class: 'mini-sel', 'aria-label': 'Scale or chord' }, EXPLORE_SETS.map(([v, l]) => h('option', { value: v }, l)));
  const labSel = h('select', { class: 'mini-sel', 'aria-label': 'Labels' }, [['degree', 'Degrees'], ['note', 'Note names'], ['none', 'No labels']].map(([v, l]) => h('option', { value: v }, l)));
  const fretSel = h('select', { class: 'mini-sel', 'aria-label': 'Frets' }, [[12, 'Frets 0–12'], [17, 'Frets 0–17'], [24, 'Frets 0–24']].map(([v, l]) => h('option', { value: v }, l)));
  const info = h('div', { class: 'muted small' });
  const bar = h('div', { class: 'neck-bar' });
  const el = h('section', { class: 'block room-block neck' },
    h('div', { class: 'block-head' }, h('h2', {}, '🎸 Neck'), infoBtn(INFO, 'About the neck'), h('div', { class: 'grow' }),
      h('div', { class: 'neck-sels' }, rootSel, setSel, labSel, fretSel)),
    bar, boardWrap, info);
  const host = h('div', { class: 'fb-host', style: { inset: '6px' } });
  boardWrap.append(host);
  const fb = new FretboardView(host, {
    onTap: (s, f) => { A.playNote(ctx.tuning[s] + f, A.now() + 0.01, 1); fb.pluck(s, 'none'); },
  });
  const shown = () => (lead?.type ? `c:${lead.type}` : lead?.ivs ? 'c:*' : lead?.scale ? `s:${lead.scale}` : set);
  const ownRoot = () => lead?.type || lead?.ivs || lead?.scale;
  const ivsOf = () => {
    if (lead?.ivs) return lead.ivs;
    const [kind, k] = shown().split(':');
    if (kind === 's') return T.SCALES[k].iv;
    if (kind === 'c') return T.CHORDS[k].iv;
    return null;
  };
  const render = () => {
    const ivs = ivsOf() || ['1', '3', '5'];
    const pc = lead ? T.pc(lead.root) : rootPc;
    rootSel.replaceChildren(...T.CHROMATIC_PC.map((p) => h('option', { value: p, selected: p === pc }, T.noteName(T.bestRoot(p, nameIvs(shown(), ivs)), S.notation))));
    // (following the harmony, the key and the chord are the harmony's: their pickers step aside)
    rootSel.style.display = lead ? 'none' : '';
    setSel.style.display = ownRoot() ? 'none' : '';
    el.classList.toggle('following', !!lead);
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lo: 0, hi: upTo, lefty: S.lefty, zone: null });
    const root = ownRoot() ? lead.root : T.bestRoot(pc, nameIvs(shown(), ivs));
    const dots = [];
    const ivsList = ivsOf();
    // each note's spelling and label: the altered scale and the symmetric ones as jazz players write them;
    // following the harmony (a jazz context), a dominant's alterations and the scales' double accidentals plainly
    const [kind, key] = shown().split(':');
    // following a chord's scale, one spelling per note (QA round 17, user's choice): the chord's own tones as
    // the Chord view writes them (G♯m(maj7)'s 7th F𝄪, D♭7alt's ♭7 C♭), and over a dominant the scale's other
    // alterations (♭9, ♯9, ♯11, ♭13) plainly too, as the course's chord-scale exercise does
    const domChord = !!lead?.chord?.startsWith('dom');
    const chordNote = (iv) => { const n = T.up(root, iv); return (domChord && ALTERATIONS.has(iv)) || iv === 'bb7' ? T.readable(n) : n; };
    const asChord = kind === 's' && lead?.scale && lead.chord ? new Map(T.CHORDS[lead.chord].iv.map((iv) => [T.mod(T.semis(iv), 12), chordNote(iv)])) : null;
    const spell = (iv) => {
      const semi = T.mod(T.semis(iv), 12);
      if (kind === 's' && key === 'altered') {
        const sp = ALTERED[semi];
        // (its root, 3rd and ♭7 are a dominant's chord tones, kept; its ♭9 ♯9 ♭5 ♭13 plainly)
        if (sp) return { iv: sp[1], n: asChord?.get(semi) || (['1', '3', 'b7'].includes(sp[1]) ? T.up(root, sp[0]) : T.readable(T.up(root, sp[0]))) };
      }
      const n = T.up(root, iv);
      if (asChord?.has(semi)) return { iv, n: asChord.get(semi) };
      if (asChord && domChord && [1, 3, 6, 8].includes(semi)) return { iv, n: T.readable(n) };
      if (kind === 's' && PLAIN.has(key)) return { iv, n: T.readable(n) };
      if (kind === 'c' && lead) return { iv, n: (key.startsWith('dom') && ALTERATIONS.has(iv)) || iv === 'bb7' ? T.readable(n) : n };
      return { iv, n: lead ? T.plain(n) : n };
    };
    const notes = ivsList ? ivsList.map((iv) => { const x = spell(iv); return { ...x, pc: T.pc(x.n) }; }) : null;
    ctx.tuning.forEach((open, s) => {
      for (let f = 0; f <= upTo; f++) {
        const pcv = T.mod(open + f, 12);
        if (notes) {
          const hit = notes.find((x) => x.pc === pcv);
          if (!hit) continue;
          // (in a scale its 9th, 11th and 13th are its 2nd, 4th and 6th; a chord names its tensions 9, 11, 13)
          const deg = T.fmtDeg(kind === 's' ? hit.iv.replace(/^9$/, '2').replace(/^11$/, '4').replace(/^13$/, '6') : hit.iv);
          dots.push({ s, f, label: label === 'degree' ? deg : label === 'note' ? T.noteName(hit.n, S.notation) : '', color: degKey(deg), state: 'static' });
        } else {
          const n = T.N(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][pcv]);
          const natural = n.a === 0;
          dots.push({ s, f, label: label === 'none' ? '' : T.noteName(n, S.notation), color: natural ? 'none' : 'ghost', state: natural ? 'static' : 'ghost' });
        }
      }
    });
    fb.setDots(dots);
    // (following: the chord, or its scale, its notes, then the next change: "🎹 D7 · Mixolydian: D – E – … · next G7")
    const what = () => (ownRoot()
      ? `🎹 ${lead.name}${lead.scale ? ` · ${T.SCALES[lead.scale].name}` : ''}`
      : `${T.noteName(root, S.notation)} ${kind === 's' ? T.SCALES[key].name : T.CHORDS[key].name}`);
    const after = ownRoot() ? (lead.next ? `next ${lead.next}` : '') : 'tap any fret to hear it';
    info.textContent = notes ? `${what()}: ${notes.map((x) => T.noteName(x.n, S.notation)).join(' – ')}${after ? `   ·   ${after}` : ''}` : 'Natural notes are bright, sharps/flats are dim. Tap any fret to hear it.';
  };
  rootSel.addEventListener('change', () => { rootPc = Number(rootSel.value); render(); });
  setSel.addEventListener('change', () => { set = setSel.value; render(); onOwn?.(); });
  labSel.addEventListener('change', () => { label = labSel.value; render(); });
  fretSel.addEventListener('change', () => { upTo = Number(fretSel.value); render(); });
  render();
  /** Follow the harmony: { root, type, ivs or scale, name, next } (none of them: the player's own scale on the root), or null to stop. */
  const follow = (x) => {
    if (JSON.stringify(x) === JSON.stringify(lead)) return;
    lead = x;
    render();
  };
  /** The harmony's bar above the board (Follow and the chords), or null for none. */
  const setBar = (node) => bar.replaceChildren(...(node ? [node] : []));
  /** The player's own choice: 's:dorian', 'c:min7', 'n:none'. */
  const own = () => set;
  /** Their choice set for them (a drone's chord picks a scale that fits it; QA round 21): they can change it. */
  const setOwn = (v) => {
    if (v === set || !EXPLORE_SETS.some(([k]) => k === v)) return;
    set = v;
    setSel.value = v;
    render();
  };
  /** A root as the player's own choice names it (C♯ Dorian, D♭ major, A♭ Altered): the drone takes its name. */
  const rootName = (pc) => {
    const [kind, k] = set.split(':');
    return T.bestRoot(pc, nameIvs(set, kind === 's' ? T.SCALES[k].iv : kind === 'c' ? T.CHORDS[k].iv : T.SCALES.ionian.iv));
  };
  return { el, follow, setBar, own, setOwn, rootName, dispose: () => fb.destroy() };
}
