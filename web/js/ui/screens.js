// Browsing screens: home, learning path, library, module list, warm-up, explorer, settings.
import { h, icon, toast, rng, esc } from './dom.js';
import { settings, saveSettings, getProgress, allProgress, resetProgress, DEFAULT_SETTINGS } from '../store.js';
import { EXERCISES, MODULES, LEVELS, byModule, byLevel, moduleOf, byId, defaultParams } from '../curriculum/index.js';
import { makeCtx, MAX_FRET } from '../fretboard.js';
import { FretboardView, degKey } from '../views/fretboardView.js';
import * as T from '../theory.js';
import * as A from '../audio.js';

export const go = (hash) => { location.hash = hash; };
export const exHref = (id, params) => {
  const q = params ? new URLSearchParams(params).toString() : '';
  return `#/ex/${id}${q ? `?${q}` : ''}`;
};

function card(t) {
  const pr = getProgress(t.id) || {};
  const mod = moduleOf(t.module);
  return h('div', { class: `card${pr.done ? ' done' : ''}`, onClick: () => go(exHref(t.id)) },
    pr.done ? h('span', { class: 'check', html: icon('check'), style: { width: '20px' } }) : null,
    h('h3', {}, t.title),
    h('p', {}, t.summary || ''),
    h('div', { class: 'meta' },
      h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`),
      h('span', { class: 'chip' }, `${mod?.icon ?? ''} ${mod?.name ?? ''}`),
      t.star ? h('span', { class: 'chip star' }, '★ core') : null,
      pr.bestBpm ? h('span', { class: 'chip' }, `${pr.bestBpm} BPM`) : null));
}

function moduleStats(id) {
  const list = byModule(id);
  const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
  return { total: list.length, done };
}

// ---------------------------------------------------------------- home
export function homeScreen(main) {
  const prog = allProgress();
  const played = Object.entries(prog).filter(([, v]) => v.plays || v.done);
  const last = Object.entries(prog).filter(([id]) => byId.has(id)).sort((a, b) => (b[1].last || 0) - (a[1].last || 0))[0];
  const mastered = played.filter(([, v]) => v.done).length;
  const lastT = last ? byId.get(last[0]) : null;
  main.replaceChildren(
    h('div', { class: 'hero' },
      h('div', { class: 'big' },
        h('h1', {}, 'BassClass'),
        h('p', { class: 'muted' }, 'Everything you practise, in one place: from your first notes to triad pairs, Giant Steps and beyond. Every exercise is shown note by note on the fretboard, with sound, in all 12 keys.'),
        h('div', { class: 'row' },
          lastT ? h('button', { class: 'btn primary', onClick: () => go(exHref(lastT.id)) }, `▶ Continue: ${lastT.title}`) : h('button', { class: 'btn primary', onClick: () => go('#/path') }, '▶ Start the learning path'),
          h('button', { class: 'btn', onClick: () => go('#/warmup') }, '🔥 Today\'s warm-up'))),
      h('div', { class: 'stats' },
        h('div', { class: 'stat' }, h('b', {}, EXERCISES.length), h('span', {}, 'exercise families')),
        h('div', { class: 'stat' }, h('b', {}, played.length), h('span', {}, 'practised')),
        h('div', { class: 'stat' }, h('b', {}, mastered), h('span', {}, 'mastered')))),
    h('div', { class: 'section' }, h('h2', {}, 'Core exercises'), h('span', { class: 'muted small' }, 'the backbone of the method')),
    h('div', { class: 'grid' }, EXERCISES.filter((t) => t.star).sort((a, b) => a.level - b.level).map(card)),
    h('div', { class: 'section' }, h('h2', {}, 'Library')),
    modulesGrid());
}

function modulesGrid() {
  return h('div', { class: 'grid' }, MODULES.filter((m) => byModule(m.id).length).map((m) => {
    const st = moduleStats(m.id);
    return h('div', { class: 'card mod-card', onClick: () => go(`#/m/${m.id}`) },
      h('div', { class: 'ico' }, m.icon), h('h3', {}, m.name), h('p', {}, m.desc),
      h('div', { class: 'meta' }, h('span', { class: 'chip' }, `${st.total} exercises`), st.done ? h('span', { class: 'chip' }, `${st.done} mastered`) : null),
      h('div', { class: 'bar' }, h('i', { style: { width: `${st.total ? (st.done / st.total) * 100 : 0}%` } })));
  }));
}

// ---------------------------------------------------------------- path
export function pathScreen(main) {
  const order = MODULES.map((m) => m.id);
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Learning path'), h('span', { class: 'muted' }, 'Six levels, from absolute beginner to mastery. Work top to bottom; mark exercises as mastered when they feel easy at tempo.')),
    ...LEVELS.flatMap((L) => {
      const list = byLevel(L.n).sort((a, b) => order.indexOf(a.module) - order.indexOf(b.module));
      if (!list.length) return [];
      const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
      return [
        h('div', { class: 'section' }, h('span', { class: `chip lv lv${L.n}` }, `Level ${L.n}`), h('h2', {}, L.name), h('span', { class: 'muted small' }, `${L.desc} · ${done}/${list.length} mastered`)),
        h('div', { class: 'grid' }, list.map(card)),
      ];
    }));
}

// ---------------------------------------------------------------- library
export function libraryScreen(main) {
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search exercises… (e.g. "triad", "ii-V", "slap")' });
  const results = h('div');
  const render = () => {
    const q = search.value.trim().toLowerCase();
    if (!q) { results.replaceChildren(modulesGrid()); return; }
    const words = q.split(/\s+/);
    const list = EXERCISES.filter((t) => {
      const hay = `${t.title} ${t.summary} ${t.about} ${t.module}`.toLowerCase();
      return words.every((w) => hay.includes(w));
    }).sort((a, b) => a.level - b.level);
    results.replaceChildren(list.length ? h('div', { class: 'grid' }, list.map(card)) : h('p', { class: 'muted' }, 'Nothing found.'));
  };
  search.addEventListener('input', render);
  main.replaceChildren(h('div', { class: 'page-head' }, h('h1', {}, 'Library'), h('div', { class: 'grow' }), search), results);
  render();
}

export function moduleScreen(main, id) {
  const m = moduleOf(id);
  if (!m) { go('#/library'); return; }
  let level = 0;
  const tabs = h('div', { class: 'tabs' });
  const list = h('div');
  const render = () => {
    tabs.replaceChildren(...[0, 1, 2, 3, 4, 5, 6].map((n) => h('button', { class: level === n ? 'on' : '', onClick: () => { level = n; render(); } }, n ? `L${n}` : 'All')));
    const items = byModule(id).filter((t) => !level || t.level === level);
    list.replaceChildren(items.length ? h('div', { class: 'grid' }, items.map(card)) : h('p', { class: 'muted' }, 'No exercises at this level yet.'));
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', html: icon('back'), onClick: () => history.back() }), h('h1', {}, `${m.icon} ${m.name}`), h('span', { class: 'muted' }, m.desc), h('div', { class: 'grow' }), tabs),
    list);
  render();
}

// ---------------------------------------------------------------- warm-up
const WARMUP_SLOTS = [
  { label: 'Hands', modules: ['technique', 'slap'] },
  { label: 'Fretboard', modules: ['fretboard', 'intervals'] },
  { label: 'Scales', modules: ['scales', 'modes'] },
  { label: 'Triads', modules: ['triads'] },
  { label: 'Arpeggios', modules: ['arpeggios', 'harmony'] },
  { label: 'Groove', modules: ['grooves', 'walking', 'rhythm', 'licks'] },
];

export let currentRoutine = null;

export function buildRoutine(level, seed) {
  const rand = rng(seed);
  const items = [];
  for (const slot of WARMUP_SLOTS) {
    let pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level && t.level >= Math.max(1, level - 2));
    if (!pool.length) pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level);
    if (!pool.length) continue;
    const t = pool[Math.floor(rand() * pool.length)];
    const params = defaultParams(t);
    for (const [k, def] of Object.entries(t.params || {})) {
      if (def.kind === 'key') params[k] = String(Math.floor(rand() * 12));
      else if (k !== 'key' && rand() < 0.5 && def.options.length > 1) params[k] = def.options[Math.floor(rand() * def.options.length)][0];
    }
    items.push({ slot: slot.label, id: t.id, params });
  }
  return items;
}

export function warmupScreen(main) {
  const today = new Date();
  let seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let level = settings.level || 3;
  const listEl = h('div', { class: 'routine' });
  const lvTabs = h('div', { class: 'tabs' });
  const render = () => {
    const items = buildRoutine(level, seed + level * 7);
    currentRoutine = items;
    lvTabs.replaceChildren(...LEVELS.map((L) => h('button', { class: L.n === level ? 'on' : '', onClick: () => { level = L.n; saveSettings({ level }); render(); } }, `L${L.n}`)));
    listEl.replaceChildren(...items.map((it, i) => {
      const t = byId.get(it.id);
      const desc = Object.entries(t.params || {}).map(([k, def]) => {
        const v = it.params[k];
        if (def.kind === 'key') return T.noteName(T.bestRoot(Number(v), def.ivs), settings.notation);
        return (def.options.find((o) => o[0] === v) || [, v])[1];
      }).join(' · ');
      return h('div', { class: 'item', onClick: () => go(exHref(it.id, { ...it.params, wu: i })) },
        h('div', { class: 'n' }, i + 1),
        h('div', { class: 't' }, h('b', {}, `${it.slot}: ${t.title}`), h('span', {}, desc)),
        h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`));
    }));
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, '🔥 Daily warm-up'), h('span', { class: 'muted' }, 'A fresh routine every day: hands, fretboard, scales, triads, arpeggios and groove. About 5 minutes each.'),
      h('div', { class: 'grow' }), lvTabs,
      h('button', { class: 'btn', html: `${icon('dice')} Shuffle`, onClick: () => { seed = Math.floor(Math.random() * 1e9); render(); } }),
      h('button', { class: 'btn primary', onClick: () => { const it = currentRoutine[0]; go(exHref(it.id, { ...it.params, wu: 0 })); } }, '▶ Start')),
    listEl);
  render();
}

// ---------------------------------------------------------------- explorer
const EXPLORE_SETS = [
  ...['ionian', 'aeolian', 'majorPent', 'minorPent', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'harmonicMinor', 'melodicMinor', 'altered', 'lydianDom', 'phrygianDom', 'bebopDom', 'dimHW', 'dimWH', 'wholeTone', 'chromatic']
    .map((k) => [`s:${k}`, `Scale · ${T.SCALES[k].name}`]),
  ...['maj', 'min', 'dim', 'aug', 'sus4', 'maj7', 'dom7', 'min7', 'm7b5', 'dim7', 'mMaj7', 'maj6', 'min6', 'dom9', 'maj9', 'min9']
    .map((k) => [`c:${k}`, `Chord · ${T.CHORDS[k].name}`]),
  ['n:none', 'Just the notes (all names)'],
];

export function explorerScreen(main) {
  const S = settings;
  const ctx = makeCtx(S);
  let rootPc = 0, set = 's:ionian', label = 'degree', upTo = 12;
  const boardWrap = h('div', { class: 'board' });
  const rootSel = h('select', { class: 'mini-sel' });
  const setSel = h('select', { class: 'mini-sel' }, EXPLORE_SETS.map(([v, l]) => h('option', { value: v }, l)));
  const labSel = h('select', { class: 'mini-sel' }, [['degree', 'Degrees'], ['note', 'Note names'], ['none', 'No labels']].map(([v, l]) => h('option', { value: v }, l)));
  const fretSel = h('select', { class: 'mini-sel' }, [[12, 'Frets 0–12'], [17, 'Frets 0–17'], [24, 'Frets 0–24']].map(([v, l]) => h('option', { value: v }, l)));
  const info = h('div', { class: 'muted small' });
  main.replaceChildren(h('div', { class: 'explorer' },
    h('div', { class: 'page-head' }, h('h1', {}, 'Fretboard explorer'), h('div', { class: 'grow' }), rootSel, setSel, labSel, fretSel),
    boardWrap, info));
  const host = h('div', { class: 'fb-host', style: { inset: '6px' } });
  boardWrap.append(host);
  const fb = new FretboardView(host, {
    onTap: (s, f) => { A.playNote(ctx.tuning[s] + f, A.now() + 0.01, 1); fb.pluck(s, 'none'); },
  });
  const ivsOf = () => {
    const [kind, k] = set.split(':');
    if (kind === 's') return T.SCALES[k].iv;
    if (kind === 'c') return T.CHORDS[k].iv;
    return null;
  };
  const render = () => {
    const ivs = ivsOf() || ['1', '3', '5'];
    rootSel.replaceChildren(...T.CHROMATIC_PC.map((p) => h('option', { value: p, selected: p === rootPc }, T.noteName(T.bestRoot(p, ivs), S.notation))));
    fb.configure({ strings: ctx.tuning.length, names: ctx.names, tuning: ctx.tuning, lo: 0, hi: upTo, lefty: S.lefty, zone: null });
    const root = T.bestRoot(rootPc, ivs);
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
    info.textContent = notes ? `${T.noteName(root, S.notation)} ${set.startsWith('s') ? T.SCALES[set.slice(2)].name : T.CHORDS[set.slice(2)].name}: ${notes.map((x) => T.noteName(x.n, S.notation)).join(' – ')}   ·   tap any fret to hear it` : 'Natural notes are bright, sharps/flats are dim. Tap any fret to hear it.';
  };
  rootSel.addEventListener('change', () => { rootPc = Number(rootSel.value); render(); });
  setSel.addEventListener('change', () => { set = setSel.value; render(); });
  labSel.addEventListener('change', () => { label = labSel.value; render(); });
  fretSel.addEventListener('change', () => { upTo = Number(fretSel.value); render(); });
  render();
  return { dispose: () => fb.destroy() };
}

// ---------------------------------------------------------------- settings
export function settingsScreen(main) {
  const S = settings;
  const seg = (key, opts, after) => {
    const el = h('div', { class: 'seg' });
    const draw = () => el.replaceChildren(...opts.map(([v, l]) => h('button', { class: S[key] === v ? 'on' : '', onClick: () => { saveSettings({ [key]: v }); draw(); after?.(); } }, l)));
    draw();
    return el;
  };
  const range = (key, min, max, step) => {
    const el = h('input', { type: 'range', min, max, step, value: S[key] });
    el.addEventListener('input', () => { saveSettings({ [key]: Number(el.value) }); A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol }); });
    return el;
  };
  const field = (label, control, hint) => h('div', { class: 'field' }, h('label', {}, label), control, hint ? h('div', { class: 'hint' }, hint) : null);
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Settings')),
    h('div', { class: 'form' },
      field('Strings', seg('strings', [[4, '4-string'], [5, '5-string (low B)'], [6, '6-string']]), 'Exercises adapt their fingerings to your instrument.'),
      field('Note names', seg('notation', [['letters', 'C D E'], ['solfege', 'Do Re Mi']])),
      field('Handedness', seg('lefty', [[false, 'Right-handed'], [true, 'Left-handed']]), 'Mirrors the fretboard.'),
      field('Highest fret used', seg('maxFret', [[17, '17'], [20, '20'], [21, '21'], [24, '24']])),
      field('Bass sound', seg('voice', [['auto', 'Recorded bass'], ['synth', 'Synth']], () => A.setAudioOptions({ voice: S.voice })), A.samplesReady() ? `Recorded: ${A.sampleInfo()?.name || 'sampled bass'}.` : 'Recorded samples load in the background; the synth plays until they are ready.'),
      field('Small speaker boost', seg('octaveUp', [[false, 'Off'], [true, 'On']], () => A.setAudioOptions({ octaveUp: S.octaveUp })), 'Phone speakers barely reproduce a low E (41 Hz). The boost adds harmonics so you hear the real pitch clearly without changing octave.'),
      field('Count-in', seg('countIn', [[true, 'One bar'], [false, 'Off']])),
      field('Metronome clicks', seg('clickSubs', [[false, 'Beats only'], [true, 'Beats + subdivisions']])),
      field('Bass volume', range('bassVol', 0, 1.5, 0.05)),
      field('Metronome volume', range('clickVol', 0, 1.5, 0.05)),
      field('Progress', h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { if (confirm('Reset all progress?')) { resetProgress(); toast('Progress reset'); } } }, 'Reset progress'),
        h('button', { class: 'btn', onClick: () => { saveSettings({ ...DEFAULT_SETTINGS }); settingsScreen(main); toast('Settings restored'); } }, 'Restore defaults')))),
    h('p', { class: 'muted small', style: { marginTop: '18px' } }, 'BassClass works offline once loaded. Sound is synthesized in the app (no samples). Install it from your browser menu → "Add to Home screen" for full-screen landscape mode.'));
}
