// App bootstrap: navigation rail + hash router.
import { h, icon, toast } from './ui/dom.js';
import { byId, byNumber } from './curriculum/index.js';
import { renderExercise } from './ui/exercise.js';
import { loadBank, setAudioOptions } from './audio.js';
import { settings } from './store.js';
import { tunerScreen } from './ui/tuner.js';
import {
  homeScreen, pathScreen, libraryScreen, moduleScreen, explorerScreen, settingsScreen,
  currentRoutine, exHref, go,
} from './ui/screens.js';

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
let replacing = false;
/** Returns true when we came back to an existing history entry (Back/Forward). */
function trackDepth() {
  const st = history.state;
  const returning = !!(st && typeof st.depth === 'number');
  if (returning) depth = st.depth;
  else {
    depth = replacing ? Math.max(depth, 0) : depth + 1;
    try { history.replaceState({ ...(st || {}), depth }, ''); } catch { /* ignore */ }
  }
  replacing = false;
  return returning;
}

// How far each screen was scrolled, per history entry: Back returns to the same place
// (e.g. Level 3 of the Library after opening an exercise from there).
const scrollMem = new Map();
let scrollKey = null;
const back = () => (depth > 0 ? history.back() : go('#/'));

function shell(navKey) {
  const rail = h('nav', { class: 'rail' },
    h('img', { class: 'logo', src: 'icons/icon.svg', alt: '' }),
    NAV.map(([k, href, label]) => h('a', { href, class: k === navKey ? 'on' : '', html: `${icon(k)}<span>${label}</span>` })));
  const main = h('main', { class: 'main' });
  main.addEventListener('scroll', () => { if (scrollKey) scrollMem.set(scrollKey, main.scrollTop); }, { passive: true });
  app.replaceChildren(rail, main);
  return main;
}

function route() {
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
    delete params.wu;
    let routine = null;
    if (wu != null && currentRoutine && currentRoutine[wu]) {
      routine = {
        index: wu,
        total: currentRoutine.length,
        next: () => {
          const nx = currentRoutine[wu + 1];
          // the routine replaces one exercise with the next; Finish steps back to where it started
          if (!nx) { back(); return; }
          replacing = true;
          location.replace(exHref(nx.id, { ...nx.params, wu: wu + 1 }));
        },
      };
    }
    try {
      active = renderExercise(app, tpl, { params, routine, onBack: back });
    } catch (err) {
      console.error(err);
      document.body.classList.remove('in-ex');
      toast('Sorry, this exercise could not be opened');
      replacing = true;
      location.replace('#/');
    }
    return;
  }
  // the daily warm-up lives on Home; topics (#/m/...) belong to the Path
  const key = { '': 'home', path: 'path', library: 'library', m: 'path', explorer: 'explorer', tuner: 'tuner', settings: 'settings' }[parts[0] || ''] || 'home';
  const main = shell(key);
  if (parts[0] === 'path') pathScreen(main);
  else if (parts[0] === 'library') libraryScreen(main, params);
  else if (parts[0] === 'm') moduleScreen(main, parts[1]);
  else if (parts[0] === 'explorer') active = explorerScreen(main);
  else if (parts[0] === 'tuner') active = tunerScreen(main);
  else if (parts[0] === 'settings') active = settingsScreen(main);
  else homeScreen(main);
  scrollKey = `${depth}|${hash}`;
  const y = returning ? scrollMem.get(scrollKey) : 0;
  if (y) requestAnimationFrame(() => { main.scrollTop = y; });
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
