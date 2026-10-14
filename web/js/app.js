// App bootstrap: navigation rail + hash router.
import { h, icon, toast } from './ui/dom.js';
import { byId } from './curriculum/index.js';
import { renderExercise } from './ui/exercise.js';
import { loadBank } from './audio.js';
import { tunerScreen } from './ui/tuner.js';
import {
  homeScreen, pathScreen, libraryScreen, moduleScreen, warmupScreen, explorerScreen, settingsScreen,
  currentRoutine, exHref, go,
} from './ui/screens.js';

const app = document.getElementById('app');
const NAV = [
  ['home', '#/', 'Home'],
  ['path', '#/path', 'Path'],
  ['library', '#/library', 'Library'],
  ['warmup', '#/warmup', 'Warm-up'],
  ['explorer', '#/explorer', 'Neck'],
  ['tuner', '#/tuner', 'Tuner'],
  ['settings', '#/settings', 'Settings'],
];

let active = null; // { dispose }

// How many in-app screens deep we are, kept in history.state so Back never leaves the app
// (history.length also counts pages from before the app was opened).
let depth = -1;
let replacing = false;
function trackDepth() {
  const st = history.state;
  if (st && typeof st.depth === 'number') depth = st.depth;
  else {
    depth = replacing ? Math.max(depth, 0) : depth + 1;
    try { history.replaceState({ ...(st || {}), depth }, ''); } catch { /* ignore */ }
  }
  replacing = false;
}
const back = () => (depth > 0 ? history.back() : go('#/'));

function shell(navKey) {
  const rail = h('nav', { class: 'rail' },
    h('img', { class: 'logo', src: 'icons/icon.svg', alt: '' }),
    NAV.map(([k, href, label]) => h('a', { href, class: k === navKey ? 'on' : '', html: `${icon(k)}<span>${label}</span>` })));
  const main = h('main', { class: 'main' });
  app.replaceChildren(rail, main);
  return main;
}

function route() {
  trackDepth();
  active?.dispose?.();
  active = null;
  const hash = location.hash || '#/';
  const [path, query] = hash.slice(1).split('?');
  const parts = path.split('/').filter(Boolean);
  const params = Object.fromEntries(new URLSearchParams(query || ''));

  if (parts[0] === 'ex' && byId.has(parts[1])) {
    const tpl = byId.get(parts[1]);
    const wu = params.wu != null ? Number(params.wu) : null;
    delete params.wu;
    let routine = null;
    if (wu != null && currentRoutine && currentRoutine[wu]) {
      routine = {
        index: wu,
        total: currentRoutine.length,
        next: () => {
          const nx = currentRoutine[wu + 1];
          replacing = true;
          location.replace(nx ? exHref(nx.id, { ...nx.params, wu: wu + 1 }) : '#/warmup');
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
  const key = { '': 'home', path: 'path', library: 'library', m: 'library', warmup: 'warmup', explorer: 'explorer', tuner: 'tuner', settings: 'settings' }[parts[0] || ''] || 'home';
  const main = shell(key);
  if (parts[0] === 'path') pathScreen(main);
  else if (parts[0] === 'library') libraryScreen(main);
  else if (parts[0] === 'm') moduleScreen(main, parts[1]);
  else if (parts[0] === 'warmup') warmupScreen(main);
  else if (parts[0] === 'explorer') active = explorerScreen(main);
  else if (parts[0] === 'tuner') active = tunerScreen(main);
  else if (parts[0] === 'settings') settingsScreen(main);
  else homeScreen(main);
}

window.addEventListener('hashchange', route);
route();
// fetch the recorded bass samples in the background (decoded on first sound)
loadBank();

// The Android app serves files from its own assets, so it needs no offline cache.
const inAndroidApp = location.hostname === 'appassets.androidplatform.net';
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !inAndroidApp) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
