// App bootstrap: navigation rail + hash router.
import { h, icon, toast } from './ui/dom.js';
import { byId, byNumber } from './curriculum/index.js';
import { renderExercise } from './ui/exercise.js';
import { loadBank, setAudioOptions } from './audio.js';
import { settings } from './store.js';
import { tunerScreen } from './ui/tuner.js';
import {
  homeScreen, pathScreen, libraryScreen, moduleScreen, explorerScreen, settingsScreen,
  currentRoutine, routineLabel, routineHref, go,
} from './ui/screens.js';
import { courseScreen, lessonScreen, placementScreen, stepHref } from './ui/course.js';
import { lessonById } from './course/data.js';
import { nav, replaceHash } from './ui/nav.js';

const app = document.getElementById('app');
const NAV = [
  ['home', '#/', 'Home'],
  ['path', '#/path', 'Path'],
  ['library', '#/library', 'Library'],
  ['explorer', '#/explorer', 'Neck'],
  ['tuner', '#/tuner', 'Tuner'],
  ['settings', '#/settings', 'Settings'],
];

let active = null; // { dispose }

// How many in-app screens deep we are, kept in history.state so Back never leaves the app
// (history.length also counts pages from before the app was opened).
let depth = -1;
/** Returns true when we came back to an existing history entry (Back/Forward). */
function trackDepth() {
  const st = history.state;
  const returning = !!(st && typeof st.depth === 'number');
  if (returning) depth = st.depth;
  else {
    depth = nav.replacing ? Math.max(depth, 0) : depth + 1;
    try { history.replaceState({ ...(st || {}), depth }, ''); } catch { /* ignore */ }
  }
  nav.replacing = false;
  return returning;
}

// How far each screen was scrolled, per history entry: Back returns to the same place
// (e.g. Level 3 of the Library after opening an exercise from there).
const scrollMem = new Map();
let scrollKey = null;
let curMain = null;
const back = () => (depth > 0 ? history.back() : go('#/'));

function shell(navKey) {
  const rail = h('nav', { class: 'rail' },
    h('img', { class: 'logo', src: 'icons/icon.svg', alt: '' }),
    NAV.map(([k, href, label]) => h('a', { href, class: k === navKey ? 'on' : '', html: `${icon(k)}<span>${label}</span>` })));
  const main = h('main', { class: 'main' });
  main.addEventListener('scroll', () => { if (scrollKey) scrollMem.set(scrollKey, main.scrollTop); }, { passive: true });
  curMain = main;
  app.replaceChildren(rail, main);
  return main;
}

function route() {
  // remember where the screen being left was scrolled (scroll events can lag behind)
  if (scrollKey && curMain?.isConnected) scrollMem.set(scrollKey, curMain.scrollTop);
  const returning = trackDepth();
  scrollKey = null;
  active?.dispose?.();
  active = null;
  const hash = location.hash || '#/';
  const [path, query] = hash.slice(1).split('?');
  const parts = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query || ''));

  // #/ex/<id>, or #/ex/<number> ("open exercise 42")
  const exTpl = parts[0] === 'ex' ? (byId.get(parts[1]) || (/^\d+$/.test(parts[1] || '') ? byNumber.get(Number(parts[1])) : null)) : null;
  if (exTpl) {
    const tpl = exTpl;
    const wu = params.wu != null ? Number(params.wu) : null;
    const ls = params.ls || '';
    const demo = params.demo === '1';
    const review = params.rv === '1';
    delete params.wu; delete params.ls; delete params.demo; delete params.rv;
    let routine = null;
    // (only while the routine in memory is the one this entry belongs to: Back/Forward into an old
    // session after Home has built another routine opens the plain exercise)
    const item = wu != null ? currentRoutine?.[wu] : null;
    if (item && item.id === tpl.id && (item.ls || '') === ls && !!item.demo === demo) {
      const list = currentRoutine;
      routine = {
        index: wu,
        total: list.length,
        label: routineLabel,
        next: () => {
          const nx = list[wu + 1];
          // the routine replaces one exercise with the next; Finish steps back to where it started
          if (!nx) { back(); return; }
          replaceHash(routineHref(nx, wu + 1));
        },
      };
    }
    // a course lesson step ("ls=<lesson>.<step>"): its goal, its clean tick, Next to the following step
    let lesson = null;
    const [lid, si] = ls.split('.');
    const L = lessonById.get(lid);
    const index = Number(si);
    if (L && L.steps[index]?.ex === tpl.id) {
      lesson = {
        lesson: L, index, step: L.steps[index], demo, review,
        // the demo leads into the first step; the last step goes back to the lesson page
        next: () => {
          const j = demo ? 0 : index + 1;
          if (!L.steps[j]) { back(); return; }
          replaceHash(stepHref(L, j));
        },
      };
    }
    try {
      active = renderExercise(app, tpl, { params, routine, lesson, onBack: back });
    } catch (err) {
      console.error(err);
      document.body.classList.remove('in-ex');
      toast('Sorry, this exercise could not be opened');
      replaceHash('#/');
    }
    return;
  }
  // an exercise number this version does not have (e.g. a link from a newer version)
  if (parts[0] === 'ex') {
    const n = /^\d{1,4}$/.test(parts[1] || '') ? Number(parts[1]) : 0;
    toast(n >= 1 ? `Exercise ${n} is not in this version of BassClass` : 'This exercise does not exist', 3500);
    replaceHash('#/');
    return;
  }
  // the daily warm-up and the course live on Home; topics (#/m/...) belong to the Path
  const key = { '': 'home', course: 'home', path: 'path', library: 'library', m: 'path', explorer: 'explorer', tuner: 'tuner', settings: 'settings' }[parts[0] || ''] || 'home';
  const main = shell(key);
  if (parts[0] === 'course' && parts[1] === 'placement') placementScreen(main);
  else if (parts[0] === 'course' && parts[1]) lessonScreen(main, parts[1]);
  else if (parts[0] === 'course') courseScreen(main);
  else if (parts[0] === 'path') pathScreen(main);
  else if (parts[0] === 'library') libraryScreen(main, params);
  else if (parts[0] === 'm') moduleScreen(main, parts[1]);
  else if (parts[0] === 'explorer') active = explorerScreen(main);
  else if (parts[0] === 'tuner') active = tunerScreen(main);
  else if (parts[0] === 'settings') active = settingsScreen(main);
  else homeScreen(main);
  scrollKey = `${depth}|${hash}`;
  const y = returning ? scrollMem.get(scrollKey) : 0;
  // restore at once (the page is already rendered), and again after the first frame in case
  // something still changes the height
  if (y) { main.scrollTop = y; requestAnimationFrame(() => { main.scrollTop = y; }); }
}

window.addEventListener('hashchange', route);
route();
// saved sound settings apply everywhere (Neck, tuner reference notes), not only in exercises
setAudioOptions({ bassVol: settings.bassVol, clickVol: settings.clickVol });
// fetch the recorded bass samples in the background (decoded on first sound)
loadBank();

// The Android app serves files from its own assets, so it needs no offline cache.
const inAndroidApp = location.hostname === 'appassets.androidplatform.net';
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !inAndroidApp) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
