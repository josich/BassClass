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
  ...['ionian', 'aeolian', 'majorPent', 'minorPent', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'harmonicMinor', 'melodicMinor', 'harmonicMajor', 'altered', 'lydianDom', 'phrygianDom', 'bebopDom', 'dimHW', 'dimWH', 'wholeTone', 'chromatic']
    .map((k) => [`s:${k}`, `Scale · ${T.SCALES[k].name}`]),
  ...['maj', 'min', 'dim', 'aug', 'sus4', 'maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'maj6', 'min6', 'dom9', 'maj9', 'min9']
    .map((k) => [`c:${k}`, `Chord · ${T.CHORDS[k].name}`]),
  ['n:none', 'Just the notes (all names)'],
];
const INFO = [
  '🎸 A scale or chord on the whole neck, in any key',
  '🏷 Degrees, note names or plain dots',
  '👆 Tap any fret to hear it',
  '🎹 With the Harmony on: its chords above the neck; 🎹 Follow shows the chord sounding',
];

/** The Neck block: { el, follow, setBar, dispose }. */
export function neckPanel() {
  const S = settings;
  const ctx = makeCtx(S);
  let rootPc = 0, set = 's:ionian', label = 'degree', upTo = 12;
  let lead = null;   // the harmony followed: { root, type (null over a drone), name }
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
  const shown = () => (lead?.type ? `c:${lead.type}` : set);
  const ivsOf = () => {
    const [kind, k] = shown().split(':');
    if (kind === 's') return T.SCALES[k].iv;
    if (kind === 'c') return T.CHORDS[k].iv;
    return null;
  };
  const render = () => {
    const ivs = ivsOf() || ['1', '3', '5'];
    const pc = lead ? T.pc(lead.root) : rootPc;
    rootSel.replaceChildren(...T.CHROMATIC_PC.map((p) => h('option', { value: p, selected: p === pc }, T.noteName(T.bestRoot(p, ivs), S.notation))));
    // (following the harmony, the key and the chord are the harmony's: their pickers step aside)
    rootSel.style.display = lead ? 'none' : '';
    setSel.style.display = lead?.type ? 'none' : '';
    el.classList.toggle('following', !!lead);
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lo: 0, hi: upTo, lefty: S.lefty, zone: null });
    const root = lead?.type ? lead.root : T.bestRoot(pc, ivs);
    const dots = [];
    const ivsList = ivsOf();
    const notes = ivsList ? ivsList.map((iv) => ({ iv, n: T.up(root, iv), pc: T.pc(T.up(root, iv)) })) : null;
    ctx.tuning.forEach((open, s) => {
      for (let f = 0; f <= upTo; f++) {
        const pcv = T.mod(open + f, 12);
        if (notes) {
          const hit = notes.find((x) => x.pc === pcv);
          if (!hit) continue;
          const deg = T.fmtDeg(hit.iv.replace(/^9$/, '2').replace(/^11$/, '4').replace(/^13$/, '6'));
          dots.push({ s, f, label: label === 'degree' ? deg : label === 'note' ? T.noteName(hit.n, S.notation) : '', color: degKey(deg), state: 'static' });
        } else {
          const n = T.N(['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][pcv]);
          const natural = n.a === 0;
          dots.push({ s, f, label: label === 'none' ? '' : T.noteName(n, S.notation), color: natural ? 'none' : 'ghost', state: natural ? 'static' : 'ghost' });
        }
      }
    });
    fb.setDots(dots);
    const what = lead?.type ? `🎹 ${lead.name}` : `${T.noteName(root, S.notation)} ${shown().startsWith('s') ? T.SCALES[shown().slice(2)].name : T.CHORDS[shown().slice(2)].name}`;
    info.textContent = notes ? `${what}: ${notes.map((x) => T.noteName(x.n, S.notation)).join(' – ')}   ·   tap any fret to hear it` : 'Natural notes are bright, sharps/flats are dim. Tap any fret to hear it.';
  };
  rootSel.addEventListener('change', () => { rootPc = Number(rootSel.value); render(); });
  setSel.addEventListener('change', () => { set = setSel.value; render(); });
  labSel.addEventListener('change', () => { label = labSel.value; render(); });
  fretSel.addEventListener('change', () => { upTo = Number(fretSel.value); render(); });
  render();
  /** Follow the harmony: { root, type, name } (type null over a drone: the chosen scale on its key), or null to stop. */
  const follow = (x) => {
    if (JSON.stringify(x) === JSON.stringify(lead)) return;
    lead = x;
    render();
  };
  /** The harmony's bar above the board (Follow and the chords), or null for none. */
  const setBar = (node) => bar.replaceChildren(...(node ? [node] : []));
  return { el, follow, setBar, dispose: () => fb.destroy() };
}
