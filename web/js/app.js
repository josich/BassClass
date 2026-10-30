// App bootstrap: navigation rail + hash router.
import { watchErrors, logError } from './errors.js';
import { h, icon, toast, guardSliders } from './ui/dom.js';
import { byId, byNumber } from './curriculum/index.js';
import { renderExercise } from './ui/exercise.js';
import { gameScreen } from './ui/game.js';
import { loadBank, setAudioOptions, tapTick } from './audio.js';
import { settings } from './store.js';
import { tunerScreen } from './ui/tuner.js';
import { practiceScreen } from './ui/practice.js';
import {
  homeScreen, libraryScreen, moduleScreen, settingsScreen,
  currentRoutine, routineLabel, routineHref, go,
} from './ui/screens.js';
import { courseScreen, lessonScreen, placementScreen, stepHref } from './ui/course.js';
import { lessonById } from './course/data.js';
import { sessionPlayed } from './course/progress.js';
import { nav, replaceHash, goBack, canGoBack } from './ui/nav.js';
import { hashLock, gatesOn, newsIdOf, exerciseLock } from './pro.js';
import { openPro } from './ui/proSheet.js';
import { maybeAskRating } from './ui/rate.js';
import { syncPro } from './billing.js';
import { aboutScreen } from './ui/about.js';
import { EXERCISES } from './curriculum/index.js';
import { LESSONS } from './course/data.js';
import { STYLES } from './practice/styles.js';
import { PROG_KEYS, MINE } from './practice/harmony.js';
import { PAD_SOUNDS } from './audio.js';
import { DRONE_KEYS } from './practice/drones.js';
import { initNews, markUsed } from './news.js';

// the last error messages, for the Feedback e-mail (errors.js)
watchErrors();

// "New" chips: what this start knows, against the last one's (news.js)
initNews([
  ...EXERCISES.map((t) => `ex:${t.id}`),
  ...LESSONS.filter((l) => l.kind === 'lesson').map((l) => `lesson:${l.id}`),
  ...Object.keys(STYLES).map((k) => `style:${k}`),
  ...PROG_KEYS.filter((k) => k !== MINE).map((k) => `prog:${k}`),
  ...Object.keys(PAD_SOUNDS).map((k) => `sound:${k}`),
  // (the drone's Change, new with its chords; its root and 5th and root and octave were there before)
  'drone:picker', ...DRONE_KEYS.filter((k) => k !== 'open' && k !== 'root').map((k) => `drone:${k}`),
]);

const app = document.getElementById('app');
const NAV = [
  ['home', '#/', 'Home'],
  ['library', '#/library', 'Library'],
  ['practice', '#/practice', 'Practice'],
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
  nav.depth = depth;
  nav.returning = returning;
  return returning;
}

// How far each screen was scrolled, per history entry: Back returns to the same place
// (e.g. Level 3 of the Library after opening an exercise from there).
const scrollMem = new Map();
let scrollKey = null;
let curMain = null;
const back = () => (canGoBack() ? goBack() : go('#/'));

function shell(navKey) {
  const rail = h('nav', { class: 'rail' },
    // the logo opens About: the credits, the licences and the legal texts (user, 2026-10-27)
    h('a', { class: 'logo-link', href: '#/about', title: 'About BassClass: credits, licences, privacy', 'aria-label': 'About BassClass' },
      h('img', { class: 'logo', src: 'icons/icon.svg', alt: '' })),
    NAV.map(([k, href, label]) => h('a', { href, class: k === navKey ? 'on' : '', html: `${icon(k)}<span>${label}</span>` })));
  const main = h('main', { class: 'main' });
  main.addEventListener('scroll', () => { if (scrollKey) scrollMem.set(scrollKey, main.scrollTop); }, { passive: true });
  curMain = main;
  app.replaceChildren(rail, main);
  return main;
}

let lastHash = '#/';
function route() {
  // an exercise or a lesson that is Pro (reached by an old link, Back, or a session made before): the screen
  // before it stays, and the Pro sheet opens (MONETIZATION-PLAN.md)
  const why = hashLock(location.hash);
  if (why) {
    const want = location.hash;
    markUsed(newsIdOf(want));
    const to = hashLock(lastHash) ? '#/' : lastHash;
    const open = () => openPro(why, { then: () => { location.hash = want; } });
    // (the sheet opens once the screen it covers is drawn again, so its history entry sits above that screen's,
    // with the right depth: QA round 19)
    if (location.hash !== to) { addEventListener('hashchange', () => setTimeout(open, 0), { once: true }); replaceHash(to); } else open();
    return;
  }
  const left = lastHash;
  lastHash = location.hash || '#/';
  // the end of something played (an exercise or the Practice room left for another screen): the moment the rate
  // reminder may ask, once the new screen is drawn (ui/rate.js)
  if (/^#\/(ex|practice)\b/.test(left) && !/^#\/(ex|practice)\b/.test(lastHash)) setTimeout(maybeAskRating, 900);
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
        // today's session ticks an item once it has been played through
        played: item.key ? () => sessionPlayed(item.key) : null,
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
      markUsed(`ex:${tpl.id}`);
      // (a lesson's step played from a session row or a link: the lesson is used too; QA round 20)
      if (lesson) markUsed(`lesson:${lesson.lesson.id}`);
      // (a Pro exercise opens for a free player as a preview: user, 2026-10-29)
      // (the ear games have a screen of their own; the reading game plays in the exercise screen: user, 2026-10-30)
      active = tpl.game && tpl.game.kind !== 'read' ? gameScreen(app, tpl, { params, onBack: back }) : renderExercise(app, tpl, { params, routine, lesson, onBack: back, preview: exerciseLock(tpl, ls) });
    } catch (err) {
      console.error(err);
      logError(err);
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
  // the Path and the Neck explorer of earlier versions live on as the Library's Topics view and the
  // Practice room's Neck block
  if (parts[0] === 'path') { replaceHash('#/library?v=topics'); return; }
  if (parts[0] === 'explorer') { replaceHash('#/practice?to=neck'); return; }
  // the daily warm-up and the course live on Home; topics (#/m/...) belong to the Library
  const key = { '': 'home', course: 'home', library: 'library', m: 'library', practice: 'practice', tuner: 'tuner', settings: 'settings', about: 'about' }[parts[0] || ''] || 'home';
  const main = shell(key);
  if (parts[0] === 'course' && parts[1] === 'placement') placementScreen(main);
  // (by its id, or by its number: #/course/3.15)
  else if (parts[0] === 'course' && parts[1]) lessonScreen(main, LESSONS.find((l) => l.kind === 'lesson' && l.num === parts[1])?.id || parts[1]);
  else if (parts[0] === 'course') courseScreen(main);
  else if (parts[0] === 'library') libraryScreen(main, params);
  else if (parts[0] === 'm') moduleScreen(main, parts[1]);
  else if (parts[0] === 'practice') active = practiceScreen(main, params);
  else if (parts[0] === 'tuner') active = tunerScreen(main);
  else if (parts[0] === 'settings') active = settingsScreen(main);
  else if (parts[0] === 'about') aboutScreen(main);
  else homeScreen(main);
  scrollKey = `${depth}|${hash}`;
  const y = returning ? scrollMem.get(scrollKey) : 0;
  // restore at once (the page is already rendered), and again after the first frame in case
  // something still changes the height
  if (y) { main.scrollTop = y; requestAnimationFrame(() => { main.scrollTop = y; }); }
}

window.addEventListener('hashchange', route);
route();

// Pro (pro.js): a link to something that is Pro opens the Pro sheet instead of the screen; Pro bought (or the test
// switches moved) draws the screen again; the purchase is checked with Google Play at start and on each return
document.addEventListener('click', (e) => {
  const a = e.target.closest?.('a[href^="#/"]');
  const why = a && hashLock(a.getAttribute('href'));
  if (!why) return;
  e.preventDefault();
  e.stopPropagation();
  const href = a.getAttribute('href');
  markUsed(newsIdOf(href));
  openPro(why, { then: () => { location.hash = href; } });
}, true);
// (the Practice room redraws in place, so what it was doing goes on; the other screens are drawn again)
window.addEventListener('bassclass-pro', () => { if (active?.proChanged) active.proChanged(); else route(); });
setTimeout(() => { if (gatesOn()) syncPro(); }, 2500);
document.addEventListener('visibilitychange', () => { if (!document.hidden && gatesOn()) syncPro(); });
// a scroll that starts on a slider does not move it
guardSliders();
// a soft tick on every tap of a control (user, 2026-10-23: subtle, not annoying): a real tap only (a
// scroll never clicks), not a slider or a text field, not a control that sounds itself (`data-silent`:
// Start and Play, the beat lights), and not when Settings turns it off
document.addEventListener('click', (e) => {
  if (!e.isTrusted) return;
  const el = e.target.closest?.('button, a[href], [role="button"], select, summary, .chip');
  if (!el || el.disabled || el.closest('[data-silent]')) return;
  // (read once the tap has done its work: Settings' own On sounds, its Off does not; QA round 18)
  setTimeout(() => { if (settings.tapSounds) tapTick(); }, 0);
}, true);
// saved sound settings apply everywhere (Neck, tuner reference notes), not only in exercises
setAudioOptions({ bassVol: settings.bassVol, clickVol: settings.clickVol });
// fetch the recorded bass samples in the background (decoded on first sound)
loadBank();

// The Android app serves files from its own assets, so it needs no offline cache.
const inAndroidApp = location.hostname === 'appassets.androidplatform.net';
if ('serviceWorker' in navigator && location.protocol !== 'file:' && !inAndroidApp) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
