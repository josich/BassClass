// Browsing screens: home (course, daily warm-up, favorites), learning path (topics), library (every exercise), module list, explorer, settings.
import { VERSION, COMMIT } from '../version.js';
import { h, icon, toast, rng, esc, infoBtn } from './dom.js';
import { settings, saveSettings, getProgress, resetProgress, DEFAULT_SETTINGS, getFavorites, isFavorite } from '../store.js';
import { EXERCISES, MODULES, LEVELS, byModule, byLevel, moduleOf, byId, byNumber, defaultParams, topicRank as rank } from '../curriculum/index.js';
import * as A from '../audio.js';
import { paramOptions } from './exercise.js';
import { starButton, dragToReorder } from './favorites.js';
import { courseBlock, sessionBlock, playerLevel } from './course.js';
import { practiceCard } from './practiceCard.js';
import { goalOf, goalText, LEVEL_PASS } from '../mastery.js';
import { resetCourse, placed, anyProgress } from '../course/progress.js';
import { replaceHash, goBack, canGoBack } from './nav.js';
import { saveBackup, parseBackup, restoreBackup } from '../backup.js';
import { resetLog } from '../practiceLog.js';
import { hashLock, exerciseLock, lessonLock, levelLocked, gatesOn, newsIdOf, isProContent } from '../pro.js';
import { LESSONS } from '../course/data.js';
import { openPro } from './proSheet.js';
import { isNew, newCount, markUsed } from '../news.js';
import { proFields, devTaps, devPanel } from './proDebug.js';
import { sendFeedback, CONTACT } from '../feedback.js';

/** Goes to an address in the app; one that is Pro (an exercise, a lesson) opens the Pro sheet instead. */
export const go = (hash) => {
  const why = hashLock(hash);
  // (bought there and then, "Let's play" opens it)
  if (why) { markUsed(newsIdOf(hash)); openPro(why, { then: () => { location.hash = hash; } }); return; }
  location.hash = hash;
};
/** The small "Pro" chip of something a free player cannot open (`why`: its reason, or null). */
export const proChip = (why) => (why ? h('span', { class: 'chip pro', title: why }, 'Pro') : null);
/** "New": added by an update and not used yet (news.js); `n`, a count for a level or a stage ("3 new"). */
export const newChip = (on, n = 0) => (on ? h('span', { class: 'chip new', title: 'New since the last update' }, n > 1 ? `${n} new` : 'New') : null);
export const exHref = (id, params) => {
  const q = params ? new URLSearchParams(params).toString() : '';
  return `#/ex/${id}${q ? `?${q}` : ''}`;
};

/** An exercise card; `level`/`topic` false leave out a chip the section already shows. */
function card(t, { level = true, topic = true } = {}) {
  const pr = getProgress(t.id) || {};
  const mod = moduleOf(t.module);
  const lock = exerciseLock(t);
  return h('div', { class: `card${pr.done ? ' done' : ''}${lock ? ' locked' : ''}`, onClick: () => go(exHref(t.id)) },
    starButton(t.id),
    h('h3', {}, h('span', { class: 'ex-num' }, t.num), t.title),
    // (a song study says on its card that the line is ours, not the record's: user, 2026-10-29, "make them honest")
    t.song ? h('div', { class: 'card-note' }, 'Our own line in this style, not the record\'s part') : null,
    // the title says what it is; the description opens on request
    h('div', { class: 'meta' },
      newChip(isNew(`ex:${t.id}`)),
      proChip(lock),
      level ? h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`) : null,
      topic ? h('span', { class: 'chip' }, `${mod?.icon ?? ''} ${mod?.name ?? ''}`) : null,
      t.star ? h('span', { class: 'chip core' }, '★ core') : null,
      pr.done ? h('span', { class: 'chip mastered' }, '✓ mastered') : null,
      pr.bestBpm ? h('span', { class: 'chip' }, `${pr.bestBpm} BPM`) : null,
      // (the goal that masters it, until it is mastered)
      !pr.done && goalOf(t.id) ? h('span', { class: 'chip goal', title: `To master it: ${goalText(t.id)}, then ✓ Mastered` }, `🎯 ${goalOf(t.id).bpm}`) : null,
      t.summary ? infoBtn(t.summary, `About ${t.title}`) : null));
}

function moduleStats(id) {
  const list = byModule(id);
  const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
  return { total: list.length, done };
}

/** In-app back: one step back when we came from inside the app, otherwise to `fallback`. */
const back = (fallback) => (canGoBack() ? goBack() : go(fallback));

// ---------------------------------------------------------------- home: my level, course, today's session, favourites
export function homeScreen(main) {
  // "My level" (the placement survey) lives here only: it sets where the course starts and what
  // today's session holds
  const known = placed() || anyProgress();
  // the headline is the practice log; its daily goal is the session's length
  const card = practiceCard();
  main.replaceChildren(
    h('div', { class: 'page-head home-head' }, card,
      h('button', { class: 'btn level-btn', title: 'My level: a short survey that sets where the course starts and what today\'s session holds', onClick: () => go('#/course/placement') },
        // (a new player's tile holds a "?" where the level will be)
        'My level', h('span', { class: known ? `chip lv lv${playerLevel()}` : 'chip lv lv-new' }, known ? `L${playerLevel()}` : '?'))),
    h('div', { class: 'home-cols' }, courseBlock(), sessionBlock({ onLength: () => card.refresh() }), favoritesBlock()));
}

// ---------------------------------------------------------------- routines (session fill-ins)
const WARMUP_SLOTS = [
  { label: 'Hands', modules: ['technique', 'slap'] },
  { label: 'Fretboard', modules: ['fretboard', 'intervals'] },
  { label: 'Scales', modules: ['scales', 'modes'] },
  { label: 'Triads', modules: ['triads'] },
  { label: 'Arpeggios', modules: ['arpeggios', 'harmony'] },
  { label: 'Groove', modules: ['grooves', 'walking', 'rhythm', 'licks'] },
];

// the steps of the warm-up or session being played (exercise screens step through them with Next)
export let currentRoutine = null;
export let routineLabel = 'Warm-up';
export function setRoutine(items, label = 'Warm-up') { currentRoutine = items; routineLabel = label; }
/** Opens item `i` of a routine (its preset options, and for course items the lesson step, demo or review). */
export const routineHref = (it, i) => exHref(it.id, { ...it.params, ...(it.ls ? { ls: it.ls } : {}), ...(it.demo ? { demo: 1 } : {}), ...(it.rv ? { rv: 1 } : {}), wu: i });
/** Options for an exercise picked at `level`: a random key and a few other options. */
export function routineParams(t, level, rand) {
  const params = defaultParams(t);
  for (const [k, def] of Object.entries(t.params || {})) {
    // Levels 1–2 stay in the first grades' keys (C G F D A E); later any key
    if (def.kind === 'key') params[k] = String(level <= 2 ? [0, 7, 5, 2, 9, 4][Math.floor(rand() * 6)] : Math.floor(rand() * 12));
    // Levels 1–2: keep the range, position and string at their defaults (no surprise 2-octave run)
    else if (level <= 2 && ['oct', 'range', 'pos', 'zone', 'root', 'string', 'layout'].includes(k)) continue;
    else if (rand() < 0.5) {
      const opts = paramOptions(def, settings);
      if (opts.length > 1) params[k] = opts[Math.floor(rand() * opts.length)][0];
    }
  }
  return params;
}

/** One exercise of each kind (hands, fretboard, scales, triads, arpeggios, groove) at `level`. */
export function buildRoutine(level, seed) {
  const rand = rng(seed);
  const items = [];
  for (const slot of WARMUP_SLOTS) {
    let pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level && t.level >= Math.max(1, level - 1));
    if (!pool.length) pool = EXERCISES.filter((t) => slot.modules.includes(t.module) && t.level <= level);
    if (!pool.length) continue;
    const t = pool[Math.floor(rand() * pool.length)];
    items.push({ slot: slot.label, id: t.id, params: routineParams(t, level, rand) });
  }
  return items;
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
        h('span', {}, 'Tap ☆ on any exercise to pin it here.')));
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
  const row = h('div', { class: `item fav${exerciseLock(t) ? ' locked' : ''}`, 'data-id': t.id, onClick: () => go(exHref(t.id)) },
    grip,
    h('div', { class: 't' }, h('b', {}, h('span', { class: 'ex-num' }, t.num), t.title), h('span', {}, info)),
    proChip(exerciseLock(t)),
    h('span', { class: `chip lv lv${t.level}` }, `L${t.level}`),
    starButton(t.id, { onChange: () => rerender() }));
  dragToReorder(grip, row);
  return row;
}

// ---------------------------------------------------------------- topics (the Library's "Topics" view)
// each topic from level 1 to 6: hands and time first, then the neck, then theory and music

function modulesGrid() {
  const mods = MODULES.filter((m) => byModule(m.id).length).sort((a, b) => rank(a.id) - rank(b.id));
  return h('div', { class: 'grid' }, mods.map((m) => {
    const st = moduleStats(m.id);
    return h('div', { class: 'card mod-card', onClick: () => go(`#/m/${m.id}`) },
      h('div', { class: 'ico' }, m.icon), h('h3', {}, m.name),
      h('div', { class: 'meta' }, h('span', { class: 'chip' }, `${st.total} exercises`), st.done ? h('span', { class: 'chip' }, `${st.done} mastered`) : null, infoBtn(m.desc, `About ${m.name}`)),
      h('div', { class: 'bar' }, h('i', { style: { width: `${st.total ? (st.done / st.total) * 100 : 0}%` } })));
  }));
}

export function moduleScreen(main, id) {
  const m = moduleOf(id);
  if (!m) { replaceHash('#/library'); return; }
  let level = 0;
  const tabs = h('div', { class: 'tabs' });
  const list = h('div');
  const render = () => {
    tabs.replaceChildren(...[0, 1, 2, 3, 4, 5, 6].map((n) => h('button', { class: level === n ? 'on' : '', onClick: () => { level = n; render(); } }, n ? `L${n}` : 'All')));
    const items = byModule(id).filter((t) => !level || t.level === level);
    list.replaceChildren(items.length ? h('div', { class: 'grid' }, items.map((t) => card(t, { topic: false }))) : h('p', { class: 'muted' }, 'No exercises at this level yet.'));
  };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('button', { class: 'icon-btn', 'aria-label': 'Back', html: icon('back'), onClick: () => back('#/library') }), h('h1', {}, `${m.icon} ${m.name}`), h('div', { class: 'grow' }), tabs),
    list);
  render();
}

// ---------------------------------------------------------------- library: every exercise at one sight, with search
// each level folds (a long page otherwise): the levels left open are remembered, and until the player
// opens or folds one, only their own level is open. When the player reaches a new level, its section
// opens once (the folds they chose stay as they were).
function libOpen() {
  const lv = playerLevel();
  if (settings.libOpen == null) return new Set([lv]);
  const s = new Set(settings.libOpen);
  if (settings.libAt !== lv) { s.add(lv); saveSettings({ libOpen: [...s].sort(), libAt: lv }); }
  return s;
}
function setLibOpen(n, open) {
  const s = libOpen();
  if (open) s.add(n); else s.delete(n);
  saveSettings({ libOpen: [...s].sort(), libAt: playerLevel() });
}
function levelSections() {
  const open = libOpen();
  return LEVELS.flatMap((L) => {
    // inside a level: the path's topic order (hands and time first), then by number
    const list = byLevel(L.n).sort((a, b) => a.order - b.order);
    if (!list.length) return [];
    const done = list.filter((t) => (getProgress(t.id) || {}).done).length;
    const fold = h('details', { class: 'lv-fold', id: `lv-${L.n}`, open: open.has(L.n) },
      h('summary', { class: 'section' }, h('span', { class: `chip lv lv${L.n}` }, `Level ${L.n}`), h('h2', {}, L.name), proChip(levelLocked(L.n) ? `Level ${L.n} is part of BassClass Pro` : null), newChip(newCount(list.map((t) => `ex:${t.id}`)) > 0, newCount(list.map((t) => `ex:${t.id}`))), infoBtn(L.desc, `About Level ${L.n}`), h('span', { class: 'muted small' }, `${done}/${list.length} mastered`)),
      h('div', { class: 'grid' }, list.map((t) => card(t, { level: false }))));
    // (the toggle event also fires when the page is drawn: only a change is saved)
    fold.addEventListener('toggle', () => { if (libOpen().has(L.n) !== fold.open) setLibOpen(L.n, fold.open); });
    return [fold];
  });
}

// everyday words the texts do not use, and what they mean here: a teacher or a student searches by the problem
// ("rushing", "posture", "plectrum") or by another name ("sixteenth", "circle of fifths")
const SYNONYMS = {
  rushing: ['pulse', 'gap', 'subdivi', 'in time'], dragging: ['pulse', 'gap', 'subdivi', 'in time'], timing: ['pulse', 'gap', 'subdivi', 'in time'],
  time: ['pulse', 'tempo'], groove: ['feel'], posture: ['holding', 'sitting', 'strap'], hold: ['holding'],
  plectrum: ['pick'], pick: ['plectrum'], sixteenth: ['16th'], sixteenths: ['16ths'], eighth: ['8th'], eighths: ['8ths'],
  triplet: ['triplet'], quaver: ['8th'], semiquaver: ['16th'], crotchet: ['quarter'], circle: ['cycle'], fifths: ['5ths', 'cycle'],
  mute: ['muting'], muting: ['mute'], ringing: ['muting', 'mute'], sight: ['reading'], 'sight-reading': ['reading'], notation: ['staff', 'reading'],
  sheet: ['staff', 'reading'], speed: ['tempo', 'speed trainer', 'endurance'], fast: ['speed', 'endurance', '16th'], stamina: ['endurance'],
  warmup: ['warm-up', 'technique'], 'warm-up': ['technique'], ear: ['hear', 'listen'], listening: ['ear', 'hear'], neck: ['fretboard'],
  fretboard: ['neck'], notes: ['note names'], thumb: ['slap', 'thumb'], popping: ['pop'], chords: ['chord', 'triad', 'arpeggio'],
  jazz: ['walking', 'ii-v', 'bebop'], solo: ['lick', 'soloing'], improvise: ['lick', 'solo', 'your own'], improvisation: ['lick', 'solo', 'your own'],
};
// status words filter the exercises instead of matching their texts, and mix with any other words ("scales not
// mastered", "level 3 mastered"; user, 2026-10-29: "typing mastered would show all mastered exercises"): the phrases,
// what the results say, and the test
const played = (pr) => !!(pr.plays || pr.bestBpm || pr.done);
const STATUS = [
  [['not mastered', 'unmastered', 'not done', 'to master', 'to do', 'todo'], 'not mastered', (t, pr) => !pr.done],
  [['goal reached', 'goal met'], '🎯 goal reached, not ticked yet', (t, pr) => !!pr.met && !pr.done],
  [['mastered', 'cleared', 'done'], '✓ mastered', (t, pr) => !!pr.done],
  [['not played', 'never played', 'not started', 'unplayed'], 'not played yet', (t, pr) => !played(pr)],
  [['played', 'started'], 'played', (t, pr) => played(pr)],
  [['favourites', 'favourite', 'favorites', 'favorite', 'starred', 'favs', 'fav'], '★ favourites', (t) => isFavorite(t.id)],
  [['new'], 'new', (t) => isNew(`ex:${t.id}`)],
  [['core'], '★ core', (t) => !!t.star],
  [['pro'], 'Pro', (t) => isProContent(t)],
  [['free'], 'free', (t) => !isProContent(t)],
];
// (the longest phrase first: "not mastered" before "mastered")
const STATUS_PHRASES = STATUS.flatMap((s, i) => s[0].map((p) => [p, i])).sort((a, b) => b[0].length - a[0].length);
/** The status words and a level ("level 3", "L3") taken out of a search: { filters, level, rest }. */
function statusOf(q) {
  const filters = new Set();
  let level = null;
  let rest = ` ${q} `;
  for (const [p, i] of STATUS_PHRASES) {
    const at = rest.indexOf(` ${p} `);
    if (at < 0) continue;
    filters.add(i);
    rest = `${rest.slice(0, at)} ${rest.slice(at + p.length + 2)}`;
  }
  rest = rest.replace(/ (?:level|lvl|l) ?([1-6])(?= )/, (_, n) => { level = Number(n); return ' '; });
  return { filters: [...filters].sort((a, b) => a - b), level, rest: rest.trim().replace(/\s+/g, ' ') };
}

export function libraryScreen(main, params = {}) {
  // the search text belongs to this history entry, so Back from an exercise finds it again
  const search = h('input', { class: 'search', type: 'search', placeholder: 'Search: triad, ii-V, 305, mastered…', 'aria-label': 'Search exercises', value: history.state?.q || '' });
  const results = h('div');
  // jump to a level (opening it if it is folded)
  const jump = (n) => {
    const fold = main.querySelector(`#lv-${n}`);
    if (!fold) return;
    if (!fold.open) { fold.open = true; setLibOpen(n, true); }
    fold.scrollIntoView({ block: 'start' });
  };
  const jumps = h('div', { class: 'tabs lv-jump' }, LEVELS.map((L) => h('button', { title: L.name, onClick: () => jump(L.n) }, `L${L.n}`)));
  // two views: every exercise by level, or one card per topic (the former Path); the choice is kept
  // (a link may ask for one, "#/library?v=topics": it is kept, and the address loses the request so a
  // later Back does not choose it again)
  if (params.v === 'topics' || params.v === 'levels') {
    saveSettings({ libView: params.v });
    try { history.replaceState(history.state, '', '#/library'); } catch { /* ignore */ }
  }
  const views = h('div', { class: 'seg lib-views' });
  const drawViews = () => views.replaceChildren(...[['levels', 'Levels'], ['topics', 'Topics']].map(([v, l]) => h('button', {
    class: settings.libView === v ? 'on' : '',
    onClick: () => { if (settings.libView !== v) { saveSettings({ libView: v }); drawViews(); render(); main.scrollTop = 0; } },
  }, l)));
  drawViews();
  // "ii-V" must find "ii–V" (every kind of dash counts as a hyphen), "7#5" and "dorian b5" find
  // 7♯5 and Dorian ♭5 (phone keyboards have no ♯ or ♭), "harmonized" finds "harmonised"
  const norm = (x) => x.toLowerCase().replace(/[\u2010-\u2015\u2212]/g, '-').replace(/♯/g, '#').replace(/♭/g, 'b').replace(/iz(e|ed|es|ing)\b/g, 'is$1').replace(/meter/g, 'metre')
    .replace(/colou?r/g, 'colour').replace(/practi[cs]e/g, 'practise');
  // option names count too ("spanish" finds the world scales, "augmented 7" the arpeggio study)
  const optionText = (t) => Object.values(t.params || {}).flatMap((d) => (d.kind === 'select' ? d.options.map((o) => o[1]) : [])).join(' ');
  // a word also finds its everyday names: a teacher searches by the student's problem (QA round 21, user's choice)
  const alts = (w) => [w, ...(SYNONYMS[w] || [])];
  const lessonText = (l) => norm(`${l.title} ${l.idea || ''} ${[].concat(l.concept || []).join(' ')} ${[].concat(l.mistakes || []).join(' ')} ${(l.steps || []).map((s) => s.do || '').join(' ')} ${l.unit?.title || ''}`);
  const render = () => {
    const q = norm(search.value.trim());
    const topics = settings.libView === 'topics';
    jumps.hidden = !!q || topics;
    if (!q) { results.replaceChildren(...(topics ? [modulesGrid()] : levelSections())); return; }
    // a number ("305" or "#305") finds that exercise; a lesson's number ("3.15", "lesson 3.15") that lesson
    const num = q.match(/^#?(\d+)$/);
    const lnum = q.match(/^(?:lesson\s*)?#?(\d\.\d{1,2})$/);
    // status words and a level filter; the other words match the texts
    const st = num || lnum ? { filters: [], level: null, rest: q } : statusOf(q);
    const words = st.rest ? st.rest.split(' ') : [];
    const found = (hay) => words.every((w) => alts(w).some((a) => hay.includes(a)));
    const keep = (t) => (!st.level || t.level === st.level) && st.filters.every((i) => STATUS[i][2](t, getProgress(t.id) || {}));
    // (a number with no exercise of its own, a year such as 1991, is searched as text)
    const list = lnum ? [] : num && byNumber.has(Number(num[1])) ? [byNumber.get(Number(num[1]))] : EXERCISES.filter((t) => {
      if (!keep(t)) return false;
      const song = t.song ? `${t.song.name} ${t.song.artist} ${t.song.year}` : '';
      return found(norm(`${t.title} ${t.summary} ${t.about} ${t.module} ${moduleOf(t.module)?.name || ''} ${song} ${optionText(t)}`));
    }).sort((a, b) => a.order - b.order);
    // the course's lessons too, by number or by their words (QA round 21: "do lesson 3.15" is how teachers say it);
    // a status word is about exercises, so it lists none, and a level keeps its stage's
    const lessons = lnum ? LESSONS.filter((l) => l.num === lnum[1]) : num || st.filters.length || !words.length ? []
      : LESSONS.filter((l) => l.kind === 'lesson' && (!st.level || l.stage.level === st.level) && found(lessonText(l))).slice(0, 12);
    // what the status words and the level asked for, said with the results ("✓ mastered · Level 3")
    const asked = [...st.filters.map((i) => STATUS[i][1]), ...(st.level ? [`Level ${st.level}`] : [])].join(' · ');
    const lessonCard = (l) => h('div', { class: `card${lessonLock(l) ? ' locked' : ''}`, onClick: () => go(`#/course/${l.id}`) },
      h('h3', {}, h('span', { class: 'ex-num' }, l.num), l.title),
      h('div', { class: 'meta' }, proChip(lessonLock(l)), h('span', { class: `chip lv lv${l.stage.level}` }, `Stage ${l.stage.level}`), l.unit ? h('span', { class: 'chip' }, l.unit.title) : null));
    const parts = [];
    if (lessons.length) parts.push(h('p', { class: 'muted small' }, `${lessons.length} lesson${lessons.length > 1 ? 's' : ''}`), h('div', { class: 'grid' }, lessons.map(lessonCard)));
    if (list.length) parts.push(h('p', { class: 'muted small' }, `${list.length} exercise${list.length > 1 ? 's' : ''}${asked ? `: ${asked}` : ' found'}`), h('div', { class: 'grid' }, list.map((t) => card(t))));
    results.replaceChildren(parts.length ? h('div', {}, ...parts) : h('p', { class: 'muted' }, asked ? `No exercises: ${asked}${words.length ? `, "${st.rest}"` : ''}.` : 'Nothing found.'));
  };
  search.addEventListener('input', () => {
    try { history.replaceState({ ...(history.state || {}), q: search.value }, ''); } catch { /* ignore */ }
    render();
  });
  // (a level the player has just reached opens: the page scrolls to it once, when it is not the first)
  const reached = settings.libOpen != null && settings.libAt !== playerLevel() && !params.l ? playerLevel() : null;
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Library'), infoBtn([`📚 All ${EXERCISES.length} exercises, Level 1 to 6`, '▸ Levels: tap a level to open or fold it', '🗂 Topics: one card per topic, its exercises Level 1 to 6', '🔎 Search by name, topic, song, artist or number (#305); lessons by name or number (3.15)', '🏷 Status words: mastered, not mastered, goal reached, played, not played, favourites, new, core, pro, free, level 3; mix them with any words ("scales not mastered")','🔢 An exercise\'s number is its level, then its own: 305 is Level 3', '★ core: a key exercise of its level', `🎯 Master an exercise: a full loop at its goal, then ✓ Mastered; it counts in the course too`, `📈 ${Math.round(LEVEL_PASS * 100)}% of a level mastered moves your level on`, 'ⓘ on a card: what it is'], 'About the Library'), views, h('div', { class: 'grow' }), search),
    jumps,
    results);
  render();
  if (settings.libView === 'topics') return;
  if (params.l) requestAnimationFrame(() => jump(Number(params.l)));
  else if (reached && !search.value) requestAnimationFrame(() => jump(reached));
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
  const field = (label, control, hint) => h('div', { class: 'field' }, h('div', { class: 'field-head' }, h('label', {}, label), hint ? infoBtn(hint, `About ${label.charAt(0).toLowerCase()}${label.slice(1)}`) : null), control);
  // backup: one file with everything stored; loading one replaces this device's records, then reloads
  // (one save at a time: a second tap while Android's "Save to" picker is open does nothing)
  let saving = false;
  const save = () => {
    if (saving) return;
    if (saveBackup() === 'download') { toast('Backup saved to your downloads', 2500); return; }
    saving = true;
    const done = (e) => {
      saving = false;
      clearTimeout(giveUp);
      toast({ ok: 'Backup saved', cancel: 'Backup not saved', error: 'The backup could not be saved' }[e?.detail] || 'Backup not saved', 2500);
    };
    const giveUp = setTimeout(() => { removeEventListener('bassclass-saved', done); saving = false; }, 120000);
    addEventListener('bassclass-saved', done, { once: true });
  };
  const fileIn = h('input', { type: 'file', accept: '.json,application/json', class: 'hidden-file', onChange: async () => {
    const file = fileIn.files[0];
    fileIn.value = '';
    if (!file) return;
    // (a backup is a few hundred KB: a big file is something else, and is not read)
    if (file.size > 5e6) { toast('This file is not a BassClass backup.', 3000); return; }
    try {
      const { saved, data } = parseBackup(await file.text());
      const when = saved ? saved.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : 'an unknown date';
      if (!confirm(`Load the backup from ${when}? It replaces the progress, course, sessions, favourites, practice log and settings on this device.`)) return;
      restoreBackup(data);
      toast('Backup loaded');
      setTimeout(() => location.reload(), 700);
    } catch (err) {
      toast(err.message || 'This file could not be read', 3000);
    }
  } });
  const rerender = () => { const y = main.scrollTop; settingsScreen(main); main.scrollTop = y; };
  main.replaceChildren(
    h('div', { class: 'page-head' }, h('h1', {}, 'Settings')),
    ...[devPanel(rerender)].filter(Boolean),
    h('div', { class: 'form' },
      field('Strings', seg('strings', [[4, '4-string'], [5, '5-string (low B)'], [6, '6-string (low B, high C)']]), 'Exercises adapt their fingerings to your instrument.'),
      field('Note names', seg('notation', [['letters', 'C D E'], ['solfege', 'Do Re Mi']])),
      field('Handedness', seg('lefty', [[false, 'Right-handed'], [true, 'Left-handed']]), 'Mirrors the fretboard.'),
      field('Highest fret used', seg('maxFret', [[17, '17'], [20, '20'], [21, '21'], [24, '24']])),
      field('Count-in', seg('countIn', [[true, 'One bar'], [false, 'Off']])),
      field('Metronome clicks', seg('clickSubs', [[false, 'Beats only'], [true, 'Beats + subdivisions']])),
      field('Bass volume', range('bassVol', 0, 2, 0.1, 2)),
      field('Metronome volume', range('clickVol', 0, 1.5, 0.075, 1.5)),
      field('Tap sounds', seg('tapSounds', [[true, 'On'], [false, 'Off']])),
      field('Backup', h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: save }, '💾 Save a backup'),
        h('button', { class: 'btn', onClick: () => fileIn.click() }, '📂 Load a backup'), fileIn),
      ['💾 One file: progress, course, sessions, favourites, practice log and settings', '📂 Load it on a new phone, or to go back to it: it replaces what is on this device', '☁ Keep the file somewhere safe: Drive, email, a computer']),
      field('Progress', h('div', { class: 'row' },
        h('button', { class: 'btn', onClick: () => { if (confirm('Reset all progress, the course and the practice log included?')) { resetProgress(); resetCourse(); resetLog(); toast('Progress reset'); } } }, 'Reset progress'),
        h('button', { class: 'btn', onClick: () => {
          saveSettings({ ...DEFAULT_SETTINGS });
          A.setAudioOptions({ bassVol: S.bassVol, clickVol: S.clickVol });
          settingsScreen(main);
          toast('Settings restored');
        } }, 'Restore defaults'))),
      // a message to us, from the player's own email app (user, 2026-10-27)
      field('Feedback', h('div', { class: 'row' }, h('button', { class: 'btn', onClick: sendFeedback }, '✉ Send feedback')),
        ['✉ Your email app opens with a message to us: write, then press Send', '🐞 It names the app\'s version, your phone and its last error messages, to find a problem faster: you see it all before you send it', `📮 ${CONTACT}`]),
      // Pro and Support after the bass's own settings: the offer is one tap away on every Pro item (QA round 19)
      ...proFields(field)),
    // the credits, the licences and the legal texts: About (also the rail's logo)
    h('div', { class: 'row about-row' }, h('button', { class: 'btn', onClick: () => go('#/about') }, 'About BassClass: credits, licences, privacy')),
    // the release number (written by the build) and the commit it was built from (seven taps: the Pro debug panel,
    // test builds only)
    devTaps(h('p', { class: 'muted small version' }, infoBtn(['📴 Works offline once loaded', ...(location.hostname === 'appassets.androidplatform.net' ? [] : ['📲 Browser menu → Add to Home screen: full screen, landscape'])], 'About BassClass'), ' ', VERSION ? `BassClass ${VERSION}${COMMIT ? ` · build ${COMMIT}` : ''}` : `BassClass · development version${COMMIT ? ` · build ${COMMIT}` : ''}`), rerender));
}
