// Home's headline: the practice log. Today's minutes as a ring against the session length (the daily
// goal), the last 7 days' total and the days in a row, and each day as a bar (gold once it met the goal)
// in a strip that scrolls back through the earlier weeks. A tap on a day or the ring shows it beside it.
import { h, infoBtn, bubbleOnTap } from './dom.js';
import { lastDays, streak, setDayGoal, DAY_MIN } from '../practiceLog.js';
import { sessionMinutes } from '../course/progress.js';

const INFO = [
  '⏱ The minutes an exercise or the Practice room plays, counted each day',
  '🎯 The ring: today, against your session length (15–60′ in Today\'s session)',
  '🟨 A gold bar: a day that reached its goal',
  '🔥 Days in a row with some practice (30 seconds or more)',
  '👆 Tap a day for its minutes · swipe the days for earlier weeks',
];
const BAR = 32;      // px: the tallest bar
const SPAN = 90;     // days the strip can go back
const MIN_DAYS = 14; // days it shows at least

/** Minutes as "47′" or "1 h 05′". */
export function fmtMin(m) {
  const r = Math.round(m);
  return r < 60 ? `${r}′` : `${Math.floor(r / 60)} h ${String(r % 60).padStart(2, '0')}′`;
}

/** A bar's minutes, short: "25′", "1h05". */
const short = (m) => {
  const r = Math.round(m);
  return r < 60 ? `${r}′` : `${Math.floor(r / 60)}h${String(r % 60).padStart(2, '0')}`;
};

const dateName = (d) => d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

/** A day met its goal when its minutes, as shown (rounded), reach it. */
const reached = (min, goal) => Math.round(min) >= goal;

/** Today against the goal: a ring that fills (gold once full), the minutes inside. */
function ring(today, goal) {
  const r = 22, c = 2 * Math.PI * r, f = Math.min(1, today / goal), met = reached(today, goal);
  const arc = today < 0.5 ? '' : `<circle cx="28" cy="28" r="${r}" fill="none" stroke="url(#pc-${met ? 'gold' : 'fill'})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/>`;
  const btn = h('button', { class: `pc-ring${met ? ' met' : ''}`, 'aria-label': 'Today' },
    h('span', { class: 'pc-arc', html: `<svg viewBox="0 0 56 56" aria-hidden="true"><defs>
      <linearGradient id="pc-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e80e8"/><stop offset="1" stop-color="#46c9a2"/></linearGradient>
      <linearGradient id="pc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2cf7e"/><stop offset="1" stop-color="#e3876e"/></linearGradient></defs>
      <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(238,240,253,0.09)" stroke-width="6"/>${arc}</svg>` }),
    // (an hour or more in the ring's hole reads short: "1h05")
    h('span', { class: `pc-in${Math.round(today) >= 60 ? ' long' : ''}` }, h('b', {}, short(today)), h('small', {}, met ? '🎯 done' : `of ${goal}′`)));
  return bubbleOnTap(btn, () => ['Today', `⏱ ${fmtMin(today)} of your ${goal}′`, met ? '🎯 Goal reached' : `▶ ${fmtMin(goal - today)} to go`], { width: 200 });
}

/** One day's bar: its minutes over it, its weekday letter under it; a tap names the day (gold: its own goal met). */
function dayBar(d, isToday, goal, top) {
  const met = reached(d.min, goal);
  const btn = h('button', { class: `pc-day${isToday ? ' today' : ''}${met ? ' met' : ''}${d.date.getDay() === 1 ? ' mon' : ''}`, 'aria-label': dateName(d.date) },
    h('em', {}, d.min < DAY_MIN ? '' : short(d.min)),
    h('b', {}, h('i', { style: { height: `${d.min < DAY_MIN ? 0 : Math.max(4, (d.min / top) * BAR).toFixed(1)}px` } })),
    h('span', {}, 'SMTWTFS'[d.date.getDay()]));
  return bubbleOnTap(btn, () => [isToday ? `Today · ${dateName(d.date)}` : dateName(d.date),
    d.min < DAY_MIN ? 'No practice logged' : `⏱ ${fmtMin(d.min)}`, ...(met ? [`🎯 ${goal}′ reached`] : [])], { width: 230 });
}

export function practiceCard() {
  const el = h('section', { class: 'practice-card' });
  let ro = null;
  const render = () => {
    const goal = sessionMinutes();
    // today keeps today's goal; a past day keeps the goal it had (30′ before goals were kept)
    setDayGoal(goal);
    const goalOf = (d, i, list) => (i === list.length - 1 ? goal : d.goal ?? 30);
    // the strip starts at the first day logged (at least two weeks back, at most 90 days)
    const all = lastDays(SPAN);
    const first = all.findIndex((d) => d.min >= DAY_MIN);
    const days = all.slice(Math.min(first < 0 ? SPAN : first, SPAN - MIN_DAYS));
    const week = days.slice(-7);
    const today = week[6].min;
    const total = week.reduce((a, d) => a + d.min, 0);
    const on = week.filter((d) => d.min >= DAY_MIN).length;
    const run = streak();
    const top = Math.max(goal, ...days.map((d) => d.min));
    // (the goal's height over the day letters: 12 px of letter and a 2 px gap)
    const goalAt = `${(14 + (goal / top) * BAR).toFixed(1)}px`;
    const scroller = h('div', { class: 'pc-scroll' },
      h('div', { class: 'pc-track' }, h('i', { class: 'pc-goal', style: { bottom: goalAt } }),
        days.map((d, i, list) => dayBar(d, i === list.length - 1, goalOf(d, i, list), top))));
    // a mouse wheel scrolls the days sideways; an edge fades while days are hidden beyond it
    let atEnd = true;
    const fade = () => {
      atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2;
      scroller.classList.toggle('more', scroller.scrollLeft > 2);
      scroller.classList.toggle('after', !atEnd);
    };
    scroller.addEventListener('scroll', fade, { passive: true });
    scroller.addEventListener('wheel', (e) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      e.preventDefault();
      scroller.scrollLeft += e.deltaY;
    }, { passive: false });
    el.replaceChildren(
      ring(today, goal),
      h('div', { class: 'pc-week' },
        h('span', { class: 'pc-label' }, 'Last 7 days'),
        h('b', { class: 'pc-total' }, fmtMin(total)),
        total < DAY_MIN
          ? h('span', { class: 'pc-sub wrap' }, 'Play an exercise or the Practice room to start')
          : h('span', { class: 'pc-sub' }, `${on} day${on === 1 ? '' : 's'} practised`, run >= 2 ? h('em', { class: 'pc-streak' }, `🔥 ${run}`, h('span', { class: 'wide-only' }, ' in a row')) : null)),
      h('div', { class: 'pc-chart' }, h('span', { class: 'pc-goal-label', style: { bottom: goalAt } }, `🎯 ${goal}′`), scroller),
      infoBtn(INFO, 'About your practice log'));
    // today in view, at the right end; it stays there when the card changes size, unless the player scrolled back
    ro?.disconnect();
    ro = new ResizeObserver(() => { if (atEnd) scroller.scrollLeft = scroller.scrollWidth; fade(); });
    ro.observe(scroller);
    requestAnimationFrame(() => { scroller.scrollLeft = scroller.scrollWidth; fade(); });
  };
  render();
  el.refresh = render;
  return el;
}
