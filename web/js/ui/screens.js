// Browsing screens: home (daily warm-up + favorites), learning path (topics), library (every exercise), module list, explorer, settings.
import { h, icon, toast, rng, esc } from './dom.js';
import { settings, saveSettings, getProgress, allProgress, resetProgress, DEFAULT_SETTINGS, getFavorites } from '../store.js';
import { EXERCISES, MODULES, LEVELS, byModule, byLevel, moduleOf, byId, byNumber, defaultParams, topicRank as rank } from '../curriculum/index.js';
import { makeCtx, MAX_FRET } from '../fretboard.js';
import { FretboardView, degKey } from '../views/fretboardView.js';
import * as T from '../theory.js';
import * as A from '../audio.js';
import { paramSummary, paramOptions } from './exercise.js';
import { starButton, dragToReorder } from './favorites.js';

export const go = (hash) => { location.hash = hash; };
export const exHref = (id, params) => {
  const q = params ? new URLSearchParams(params).toString() : '';
  return `#/ex/${id}${q ? `?${q}` : ''}`;
};

function card(t) {
  const pr = getProgress(t.id) || {};
  const mod = moduleOf(t.module);
  return h('div', { class: `card${pr.done ? ' done' : ''}`, onClick: () => go(exHref(t.id)) },
    starButton(t.id),
    h('h3', {}, h('span', { class: 'ex-num' }, t.num), t.title),
    h('p', {}, t.summary || ''),
    h('div', { class: 'meta' },
      h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`),
      h('span', { class: 'chip' }, `${mod?.icon ?? ''} ${mod?.name ?? ''}`),
      t.star ? h('span', { class: 'chip core' }, 'core') : null,
      pr.done ? h('span', { class: 'chip mastered' }, '✓ mastered') : null,
      pr.bestBpm ? h('span', { class: 'chip' }, `${pr.bestBpm} BPM`) : null));
}

function moduleStats(id) {
  const list = byModule(id);
  const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
  return { total: list.length, done };
}

/** In-app back: one step back when we came from inside the app, otherwise to `fallback`. */
const back = (fallback) => (history.state?.depth > 0 ? history.back() : go(fallback));

// ---------------------------------------------------------------- home: daily warm-up + favorites
export function homeScreen(main) {
  const prog = allProgress();
  const last = Object.entries(prog).filter(([id]) => byId.has(id)).sort((a, b) => (b[1].last || 0) - (a[1].last || 0))[0];
  const lastT = last ? byId.get(last[0]) : null;
  const started = Object.values(prog).some((v) => v.plays || v.done);
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'BassClass'), h('div', { class: 'grow' }),
      lastT ? h('button', { class: 'btn continue', title: lastT.title, onClick: () => go(exHref(lastT.id)) }, `▶ Continue: ${lastT.title}`) : null),
    h('div', { class: 'home-cols' }, started ? null : startHere(), warmupBlock(), favoritesBlock()));
}

/** Shown until the first exercise has been played: where a new player begins. */
function startHere() {
  const first = byNumber.get(1);
  return h('section', { class: 'block start-here' },
    h('div', { class: 'block-head' }, h('h2', {}, '👋 New here? Start with Level 1')),
    h('p', { class: 'muted small' }, 'Level 1 builds the basics: plucking and fretting, steady time, the open strings and your first notes, scales and triads. Begin with the first exercise, then let the daily warm-up below (set to Level 1) mix them for you.'),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', onClick: () => go(exHref(first.id)) }, `▶ ${first.title}`),
      h('button', { class: 'btn', onClick: () => go('#/library?l=1') }, 'See all of Level 1')));
}

// ---------------------------------------------------------------- warm-up (daily random routine)
const WARMUP_SLOTS = [
  { label: 'Hands', modules: ['technique', 'slap'] },
  { label: 'Fretboard', modules: ['fretboard', 'intervals'] },
  { label: 'Scales', modules: ['scales', 'modes'] },
  { label: 'Triads', modules: ['triads'] },
  { label: 'Arpeggios', modules: ['arpeggios', 'harmony'] },
  { label: 'Groove', modules: ['grooves', 'walking', 'rhythm', 'licks'] },
];

export let currentRoutine = null;
let shuffled = null; // a shuffle lasts until the app is closed

export function buildRoutine(level, seed) {
  const rand = rng(seed);
  const items = [];
  for (const slot of WARMUP_SLOTS) {
    let pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level && t.level >= Math.max(1, level - 1));
    if (!pool.length) pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level);
    if (!pool.length) continue;
    const t = pool[Math.floor(rand() * pool.length)];
    const params = defaultParams(t);
    for (const [k, def] of Object.entries(t.params || {})) {
      if (def.kind === 'key') params[k] = String(Math.floor(rand() * 12));
      else if (k !== 'key' && rand() < 0.5) {
        const opts = paramOptions(def, settings);
        if (opts.length > 1) params[k] = opts[Math.floor(rand() * opts.length)][0];
      }
    }
    items.push({ slot: slot.label, id: t.id, params });
  }
  return items;
}

function warmupBlock() {
  const today = new Date();
  const daily = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  let level = settings.level || 3;
  const listEl = h('div', { class: 'routine' });
  const lvTabs = h('div', { class: 'tabs' });
  const lvName = h('span', { class: 'lv-name' });
  const render = () => {
    const items = buildRoutine(level, (shuffled ?? daily) + level * 7);
    currentRoutine = items;
    lvTabs.replaceChildren(...LEVELS.map((L) => h('button', { class: L.n === level ? 'on' : '', title: L.name, onClick: () => { level = L.n; saveSettings({ level }); render(); } }, `L${L.n}`)));
    lvName.textContent = `Level ${level} · ${LEVELS[level - 1].name}`;
    listEl.replaceChildren(...items.map((it, i) => {
      const t = byId.get(it.id);
      return h('div', { class: 'item', onClick: () => go(exHref(it.id, { ...it.params, wu: i })) },
        h('div', { class: 'n' }, i + 1),
        h('div', { class: 't' }, h('b', {}, `${it.slot}: `, h('span', { class: 'ex-num' }, t.num), t.title), h('span', {}, paramSummary(t, it.params, settings))),
        h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`));
    }));
  };
  render();
  return h('section', { class: 'block' },
    h('div', { class: 'block-head' }, h('h2', {}, '🔥 Daily warm-up'), h('div', { class: 'grow' }),
      h('button', { class: 'icon-btn shuffle', title: 'Shuffle: a new random routine', 'aria-label': 'Shuffle', html: icon('dice'), onClick: () => { shuffled = Math.floor(Math.random() * 1e9); render(); } }),
      h('button', { class: 'btn primary', onClick: () => { const it = currentRoutine[0]; go(exHref(it.id, { ...it.params, wu: 0 })); } }, '▶ Start')),
    h('p', { class: 'muted small' }, 'A fresh routine every day: hands, fretboard, scales, triads, arpeggios and groove. About 5 minutes each.'),
    h('div', { class: 'row lv-row' }, lvTabs, lvName),
    listEl);
}

// ---------------------------------------------------------------- favorites (starred exercises, drag to reorder)
function favoritesBlock() {
  const listEl = h('div', { class: 'routine favs' });
  const hint = h('span', { class: 'muted small' });
  const section = h('section', { class: 'block favs-block' });
  const render = () => {
    const list = getFavorites().map((id) => byId.get(id)).filter(Boolean);
    hint.textContent = list.length > 1 ? 'Drag ⠿ to reorder' : '';
    section.classList.toggle('has-items', list.length > 0);
    if (!list.length) {
      listEl.replaceChildren(h('div', { class: 'empty' },
        h('b', {}, 'No favourites yet'),
        h('span', {}, 'Tap the ☆ on an exercise card (in the Library, or inside a topic of the Path) or in an exercise\'s header to pin it here.')));
      return;
    }
    listEl.replaceChildren(...list.map((t) => favRow(t, render)));
  };
  render();
  section.append(h('div', { class: 'block-head' }, h('h2', {}, '★ Favourites'), h('div', { class: 'grow' }), hint), listEl);
  return section;
}

function favRow(t, rerender) {
  const pr = getProgress(t.id) || {};
  const mod = moduleOf(t.module);
  const grip = h('button', { class: 'grip', title: 'Drag to reorder (or arrow keys)', 'aria-label': `Move ${t.title} (arrow keys)`, html: icon('grip') });
  const info = [`${mod?.icon ?? ''} ${mod?.name ?? ''}`, pr.done ? '✓ mastered' : '', pr.bestBpm ? `best ${pr.bestBpm} BPM` : ''].filter(Boolean).join(' · ');
  const row = h('div', { class: 'item fav', 'data-id': t.id, onClick: () => go(exHref(t.id)) },
    grip,
    h('div', { class: 't' }, h('b', {}, h('span', { class: 'ex-num' }, t.num), t.title), h('span', {}, info)),
    h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`),
    starButton(t.id, { onChange: () => rerender() }));
  dragToReorder(grip, row);
  return row;
}

// ---------------------------------------------------------------- path: the topics, each from level 1 to 6
// hands and time first, then the neck, then theory and music

function modulesGrid() {
  const mods = MODULES.filter((m) => byModule(m.id).length).sort((a, b) => rank(a.id) - rank(b.id));
  return h('div', { class: 'grid' }, mods.map((m) => {
    const st = moduleStats(m.id);
    return h('div', { class: 'card mod-card', onClick: () => go(`#/m/${m.id}`) },
      h('div', { class: 'ico' }, m.icon), h('h3', {}, m.name), h('p', {}, m.desc),
      h('div', { class: 'meta' }, h('span', { class: 'chip' }, `${st.total} exercises`), st.done ? h('span', { class: 'chip' }, `${st.done} mastered`) : null),
      h('div', { class: 'bar' }, h('i', { style: { width: `${st.total ? (st.done / st.total) * 100 : 0}%` } })));
  }));
}

export function pathScreen(main) {
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Learning path'), h('span', { class: 'muted' }, 'Pick a topic. Each one lists its exercises in order, from its first level to its last; mark them as mastered as you go. The Library shows every exercise by level.')),
    modulesGrid());
}

export function moduleScreen(main, id) {
  const m = moduleOf(id);
  if (!m) { location.replace('#/path'); return; }
  let level = 0;
  const tabs = h('div', { class: 'tabs' });
  const list = h('div');
  const render = () => {
    tabs.replaceChildren(...[0, 1, 2, 3, 4, 5, 6].map((n) => h('button', { class: level === n ? 'on' : '', onClick: () => { level = n; render(); } }, n ? `L${n}` : 'All')));
    const items = byModule(id).filter((t) => !level || t.level === level);
    list.replaceChildren(items.length ? h('div', { class: 'grid' }, items.map(card)) : h('p', { class: 'muted' }, 'No exercises at this level yet.'));
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/path') }), h('h1', {}, `${m.icon} ${m.name}`), h('span', { class: 'muted' }, m.desc), h('div', { class: 'grow' }), tabs),
    list);
  render();
}

// ---------------------------------------------------------------- library: every exercise at one sight, with search
function levelSections() {
  return LEVELS.flatMap((L) => {
    const list = byLevel(L.n).sort((a, b) => a.num - b.num);
    if (!list.length) return [];
    const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
    return [
      h('div', { class: 'section', id: `lv-${L.n}` }, h('span', { class: `chip lv lv${L.n}` }, `Level ${L.n}`), h('h2', {}, L.name), h('span', { class: 'muted small' }, `${L.desc} · ${done}/${list.length} mastered`)),
      h('div', { class: 'grid' }, list.map(card)),
    ];
  });
}

export function libraryScreen(main, params = {}) {
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search: triad, ii-V, 42…', 'aria-label': 'Search exercises' });
  const results = h('div');
  // jump to a level (the page lists every exercise)
  const jump = (n) => main.querySelector(`#lv-${n}`)?.scrollIntoView({ block: 'start' });
  const jumps = h('div', { class: 'tabs lv-jump' }, LEVELS.map((L) => h('button', { title: L.name, onClick: () => jump(L.n) }, `L${L.n}`)));
  // "ii-V" must find "ii–V": every kind of dash counts as a hyphen
  const norm = (x) => x.toLowerCase().replace(/[\u2010-\u2015\u2212]/g, '-');
  const render = () => {
    const q = norm(search.value.trim());
    jumps.hidden = !!q;
    if (!q) { results.replaceChildren(...levelSections()); return; }
    // a number ("42" or "#42") finds that exercise
    const num = q.match(/^#?(\d+)$/);
    const words = q.split(/\s+/);
    const list = num ? [byNumber.get(Number(num[1]))].filter(Boolean) : EXERCISES.filter((t) => {
      const hay = norm(`${t.title} ${t.summary} ${t.about} ${t.module}`);
      return words.every((w) => hay.includes(w));
    }).sort((a, b) => a.num - b.num);
    results.replaceChildren(list.length
      ? h('div', {}, h('p', { class: 'muted small' }, `${list.length} exercise${list.length > 1 ? 's' : ''} found`), h('div', { class: 'grid' }, list.map(card)))
      : h('p', { class: 'muted' }, 'Nothing found.'));
  };
  search.addEventListener('input', render);
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Library'), h('span', { class: 'muted' }, `All ${EXERCISES.length} exercises, from level 1 to 6.`), h('div', { class: 'grow' }), search),
    jumps,
    results);
  render();
  if (params.l) requestAnimationFrame(() => jump(Number(params.l)));
}

// ---------------------------------------------------------------- explorer
const EXPLORE_SETS = [
  ...['ionian', 'aeolian', 'majorPent', 'minorPent', 'blues', 'dorian', 'mixolydian', 'lydian', 'phrygian', 'locrian', 'harmonicMinor', 'melodicMinor', 'harmonicMajor', 'altered', 'lydianDom', 'phrygianDom', 'bebopDom', 'dimHW', 'dimWH', 'wholeTone', 'chromatic']
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
    h('div', { class: 'page-head' }, h('h1', {}, 'Neck explorer'), h('div', { class: 'grow' }), rootSel, setSel, labSel, fretSel),
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
  // `scale`: the stored value is shown as a percentage of it (bass volume: 0–2 is shown as 0–100%)
  const range = (key, min, max, step, scale = 1) => {
    const el = h('input', { type: 'range', min, max, step, value: S[key] });
    const pct = h('b', { class: 'pct' }, `${Math.round((S[key] / scale) * 100)}%`);
    el.addEventListener('input', () => {
      saveSettings({ [key]: Number(el.value) });
      pct.textContent = `${Math.round((S[key] / scale) * 100)}%`;
      A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol });
    });
    return h('div', { class: 'range-row' }, el, pct);
  };
  const field = (label, control, hint) => h('div', { class: 'field' }, h('label', {}, label), control, hint ? h('div', { class: 'hint' }, hint) : null);
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Settings')),
    h('div', { class: 'form' },
      field('Strings', seg('strings', [[4, '4-string'], [5, '5-string (low B)'], [6, '6-string']]), 'Exercises adapt their fingerings to your instrument.'),
      field('Note names', seg('notation', [['letters', 'C D E'], ['solfege', 'Do Re Mi']])),
      field('Handedness', seg('lefty', [[false, 'Right-handed'], [true, 'Left-handed']]), 'Mirrors the fretboard.'),
      field('Highest fret used', seg('maxFret', [[17, '17'], [20, '20'], [21, '21'], [24, '24']])),
      field('Count-in', seg('countIn', [[true, 'One bar'], [false, 'Off']])),
      field('Metronome clicks', seg('clickSubs', [[false, 'Beats only'], [true, 'Beats + subdivisions']])),
      field('Bass volume', range('bassVol', 0, 2, 0.1, 2)),
      field('Metronome volume', range('clickVol', 0, 1.5, 0.05)),
      field('Progress', h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { if (confirm('Reset all progress?')) { resetProgress(); toast('Progress reset'); } } }, 'Reset progress'),
        h('button', { class: 'btn', onClick: () => {
          saveSettings({ ...DEFAULT_SETTINGS });
          A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol });
          settingsScreen(main);
          toast('Settings restored');
        } }, 'Restore defaults')))),
    h('p', { class: 'muted small', style: { marginTop: '18px' } }, `BassClass works offline once loaded. The bass sound uses recorded CC0 samples (Karoryfer "darkblack"), with a built-in synthesizer as a backup.${location.hostname === 'appassets.androidplatform.net' ? '' : ' Install it from your browser menu → "Add to Home screen" for full-screen landscape mode.'}`));
}
