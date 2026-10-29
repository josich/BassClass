// BassClass Pro (MONETIZATION-PLAN.md; the user's decisions of 2026-10-27): a free app with one payment, once, that
// opens the rest for good. Free, everywhere: Levels 1–3 (the Library's exercises and song studies, the Course's
// Stages 1–3, and two lessons of each later stage, to try it: user, 2026-10-28), the tuner, the whole
// metronome, the Neck, the drone, the log and backup, and the Practice room's
// starter set (three drum patterns of each genre, the Pop & rock and Blues progressions, My progression and its
// ✎ Edit, the Pad, E-piano and Arpeggio sounds, the drone open, on the triads and on the five 7th chords). Pro: Levels
// 4–6, every drum pattern and the fills, every other progression, the Piano, Organ and Guitar sounds, the drone's
// other chords and voicings, and whatever comes next.
//
// Built to grow: what is Pro is worked out from the data, so new content takes its side on its own. An exercise,
// a lesson (or its unit or stage), a drum pattern or a progression marked `pro: true` is Pro whatever its level;
// `free: true` makes it free. Anything above FREE_LEVELS is Pro.
//
// The gates are on only in the Play Store build (`window.BASS_STORE === 'play'`, set by that build) or, for
// testing, with the debug switch (Settings: seven taps on the version line). Everywhere else (the web version, the
// GitHub APK) nothing is locked and nothing changes. The purchase itself: web/js/billing.js.
import { byId, byNumber } from './curriculum/index.js';
import { lessonById } from './course/data.js';
import { STYLES, GENRES } from './practice/styles.js';
import { HARMONY_PROGS } from './practice/harmony.js';
import { DRONES, droneTitle } from './practice/drones.js';

export const PRO_ID = 'bassclass_pro';
// (the tips' labels and PRICE are the test builds' figures: the Play build shows only Google Play's own prices)
export const TIPS = [['bassclass_tip_2', '€2'], ['bassclass_tip_4', '€4']];
export const PRICE = '€7.99';
/**
 * A price to show before Google Play gives its own: the test builds' figure; nothing in the Play build (launch legal
 * review, 2026-10-28: a written price is wrong during the launch price and in every other currency).
 */
export const placeholder = (price) => (PLAY ? '' : price);
/** The line under "Get BassClass Pro": the price, once there is one to show. */
export const proSub = (price) => `${price ? `${price} · ` : ''}one payment, yours for good`;
export const FREE_LEVELS = 3;
export const FREE_DRUMS = 3;   // patterns of each genre
// lessons of each Pro stage free to try (user, 2026-10-28: "this way it can be checked a bit"; representative ones,
// "something more theoretic": scales, modes, two-octave arpeggios): marked `free: true` in the stage's file; their steps play inside the lesson, the exercises stay
// Pro in the Library (the self-test counts them)
export const FREE_TASTE = 2;
// (My progression is free too, with ✎ Edit: user, 2026-10-28, "make the app useful in any plan, even free")
const FREE_PROG_GROUPS = new Set(['Mine', 'Pop & rock', 'Blues']);
export const FREE_SOUNDS = new Set(['pad', 'epiano', 'arp']);
/** Each Pro sound's line in Settings' Pro details (a new Pro sound adds its own: the self-test checks it). */
export const PRO_SOUND_NOTES = {
  piano: 'Piano: a recorded Kawai grand',
  organ: 'Organ: tonewheels through a rotating speaker',
  guitar: 'Guitar: rock and metal power chords, chugging in time',
};

export const STORE = (typeof window !== 'undefined' && window.BASS_STORE) || '';
export const PLAY = STORE === 'play';

// ---------------------------------------------------------------- what the player owns
// `bassclass.pro.v1` (a backup carries it; the Play build trusts only what Google Play told it: `src` 'play'):
// { owned, src: 'play' | 'test', miss: when Play first stopped reporting it (a refund), or null }
const KEY = 'bassclass.pro.v1';
// the debug switches (never in a backup: not a "bassclass." key): { on: the panel shown, gates, next: the next
// simulated purchase's answer, sim: the products the simulated Google Play reports as owned }
const DEV = 'bassclass-dev.pro';
const read = (k, d) => { try { return { ...d, ...JSON.parse(localStorage.getItem(k) || 'null') }; } catch { return { ...d }; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private window */ } };

export const proRecord = () => read(KEY, { owned: false, src: null, miss: null });
export const dev = () => (PLAY ? { on: false, gates: false, next: 'ok', sim: [] } : read(DEV, { on: false, gates: false, next: 'ok', sim: [] }));
export function setDev(patch) {
  if (PLAY) return;   // (the Play build has no test switches: seven taps must never hand out Pro)
  write(DEV, { ...dev(), ...patch });
  changed();
}

/** The gates are on: the Play build, or the debug switch elsewhere. */
export const gatesOn = () => PLAY || dev().gates;
/** Pro is owned (the Play build: as Google Play said; elsewhere: the simulated purchase). */
export function owned() {
  const r = proRecord();
  return !!r.owned && (PLAY ? r.src === 'play' : r.src === 'test');
}
/** Everything is open: the gates are off, or Pro is owned. */
export const isPro = () => !gatesOn() || owned();

export function setOwned(on, { miss = null } = {}) {
  write(KEY, { owned: !!on, src: PLAY ? 'play' : 'test', miss });
  changed();
}
export function setMiss(at) { write(KEY, { ...proRecord(), miss: at }); }

/** Something changed: the screens draw themselves again. */
function changed() {
  try { window.dispatchEvent(new Event('bassclass-pro')); } catch { /* not in a page */ }
}

// ---------------------------------------------------------------- what is Pro
const marked = (...xs) => {
  for (const x of xs) {
    if (x?.free === true) return 'free';
    if (x?.pro === true) return 'pro';
  }
  return null;
};
const levelWhy = (n) => `Level ${n} is part of BassClass Pro`;

/** Why an exercise is closed (a reason to show), or null. Inside a free lesson its steps always play. */
export function exerciseLock(t, ls = '') {
  if (isPro() || !t) return null;
  // (only when that step of that lesson really is this exercise: QA round 19, any free lesson's `ls` opened them all)
  if (ls) {
    const [lid, n] = String(ls).split('.');
    const L = lessonById.get(lid);
    if (L && L.steps[Number(n)]?.ex === t.id) return lessonLock(L);
  }
  const m = marked(t);
  const why = m ? (m === 'pro' ? `${t.title} is part of BassClass Pro` : null) : t.level > FREE_LEVELS ? levelWhy(t.level) : null;
  // (one a free lesson plays says where: QA round 21, a locked exercise just played inside that lesson looked a bug)
  const L = why && freeLessonOf(t);
  return L ? `${why}: play this one free in Lesson ${L.num}` : why;
}
/** Whether an exercise is Pro in the store's build, whatever the gates now (the Library search's "pro" and "free"). */
export function isProContent(t) {
  const m = marked(t);
  return m ? m === 'pro' : t.level > FREE_LEVELS;
}
/** The first lesson open to a free player that plays this exercise. */
const freeLessonOf = (t) => [...lessonById.values()].find((L) => L.kind === 'lesson' && L.steps.some((s) => s.ex === t.id) && !lessonLock(L)) || null;
/** Why a lesson (checkpoint, test) is closed, or null. */
export function lessonLock(L) {
  if (isPro() || !L) return null;
  const m = marked(L, L.unit, L.stage);
  if (m) return m === 'pro' ? `${L.title || 'This lesson'} is part of BassClass Pro` : null;
  return L.stage?.level > FREE_LEVELS ? `Stage ${L.stage.level} is part of BassClass Pro` : null;
}
/** A course stage (or a Library level) beyond the free ones. */
export const levelLocked = (n) => !isPro() && n > FREE_LEVELS;

export const FREE_STYLE = (() => {
  const free = new Set();
  // (the three of each genre chosen by hand, `free: true` in styles.js, QA round 19; a genre without any: its first three)
  for (const g of GENRES) {
    const list = Object.values(STYLES).filter((s) => s.genre === g.key && !s.pro);
    const chosen = list.filter((s) => s.free === true);
    for (const s of chosen.length ? chosen : list.slice(0, FREE_DRUMS)) free.add(s.key);
  }
  return free;
})();
export function styleLock(key) {
  if (isPro() || !STYLES[key] || FREE_STYLE.has(key)) return null;
  return `${STYLES[key].name} is part of BassClass Pro: three patterns of each genre are free`;
}
/** The first free pattern of a genre (where a pattern that is now Pro falls back to). */
export const freeStyleOf = (genre) => Object.values(STYLES).find((s) => s.genre === genre && FREE_STYLE.has(s.key))?.key || 'rock8';

export function progLock(key) {
  if (isPro()) return null;
  const group = HARMONY_PROGS.find(([, keys]) => keys.includes(key))?.[0];
  return group && !FREE_PROG_GROUPS.has(group) ? `The ${group} progressions are part of BassClass Pro` : null;
}
// (a preset to fall back to, never My progression, which may be empty)
export const freeProg = () => HARMONY_PROGS.find(([g]) => g !== 'Mine' && FREE_PROG_GROUPS.has(g))[1][0];

export function soundLock(v) {
  if (isPro() || FREE_SOUNDS.has(v)) return null;
  return `The ${{ piano: 'Piano', organ: 'Organ', guitar: 'Guitar' }[v] || v} sound is part of BassClass Pro`;
}
export const fillsLock = () => (isPro() ? null : 'Fills are part of BassClass Pro');
/** The drone's chords (practice/drones.js): its root and 5th or octave, the triads, the five 7th chords and their
 * spread and shell voicings free, `free: true`. */
export function droneLock(key) {
  if (isPro() || !DRONES[key] || DRONES[key].free) return null;
  return `The ${droneTitle(key)} drone is part of BassClass Pro: its root and 5th or octave, the triads, the five basic 7th chords and their spread and shell voicings are free`;
}

/** What an address in the app opens: { t, ls } an exercise (by its id, or by its number, as the router opens it:
 * QA round 19), { lesson } a lesson, or null. */
function target(hash) {
  const [path, query] = String(hash || '').replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'ex') {
    const t = byId.get(parts[1]) || (/^\d+$/.test(parts[1] || '') ? byNumber.get(Number(parts[1])) : null);
    return t ? { t, ls: new URLSearchParams(query || '').get('ls') || '' } : null;
  }
  const lesson = parts[0] === 'course' && parts[1] && parts[1] !== 'placement' ? lessonById.get(parts[1]) || [...lessonById.values()].find((l) => l.kind === 'lesson' && l.num === parts[1]) : null;
  return lesson ? { lesson } : null;
}
/** Why an address in the app is closed, or null. Exercises and lessons open for a free player as previews (user,
 * 2026-10-29: "allow free users to check what is in Pro exercises, even to see the options"): the exercise screen
 * and the lesson page take `exerciseLock` / `lessonLock` as their preview's reason, so no address is closed now. */
export function hashLock(hash) {
  void hash;
  return null;
}
/** The "New" id of what an address opens: a Pro item tapped counts as seen, its chip goes (QA round 20). */
export const newsIdOf = (hash) => { const x = target(hash); return x?.t ? `ex:${x.t.id}` : x?.lesson ? `lesson:${x.lesson.id}` : null; };

/** The room's stored choices a free player cannot use any more go back to free ones (the gates came on). */
export function freeRoom(room) {
  if (isPro()) return null;
  const patch = {};
  if (styleLock(room.style)) patch.style = freeStyleOf(STYLES[room.style]?.genre || room.genre);
  if (room.fills) patch.fills = 0;
  if (progLock(room.hProg)) patch.hProg = freeProg();
  if (soundLock(room.hSound)) patch.hSound = 'pad';
  if (droneLock(room.hQual)) patch.hQual = 'open';
  return Object.keys(patch).length ? patch : null;
}

/** What Pro opens in the room, whoever owns it (Settings' Pro details): its drum patterns, progression groups and drone chords. */
export function proRoomItems() {
  return {
    styles: Object.keys(STYLES).filter((k) => !FREE_STYLE.has(k)),
    progGroups: HARMONY_PROGS.filter(([g]) => g !== 'Mine' && !FREE_PROG_GROUPS.has(g)),
    drones: Object.keys(DRONES).filter((k) => !DRONES[k].free),
  };
}

/** What Pro opens, counted from the data (for the Pro sheet). */
export function proContents(EXERCISES, LESSONS) {
  const ex = EXERCISES.filter((t) => !t.free && (t.pro || t.level > FREE_LEVELS));
  // (lessons as the map counts them, the optional ones apart: QA round 19)
  const les = LESSONS.filter((l) => l.kind === 'lesson' && !l.free && (l.pro || l.stage?.level > FREE_LEVELS));
  return { ex: ex.length, songs: ex.filter((t) => t.module === 'music').length, les: les.filter((l) => !l.optional).length, optional: les.filter((l) => l.optional).length, styles: Object.keys(STYLES).length };
}
