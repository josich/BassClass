// Home's headline: the practice log. Today's minutes as a ring against the session length (the daily
// goal), the last 7 days' total and the days in a row, and each day as a bar (gold once it met the goal).
import { h, toast, infoBtn } from './dom.js';
import { lastDays, streak } from '../practiceLog.js';
import { sessionMinutes } from '../course/progress.js';

const INFO = [
  '⏱ The minutes an exercise plays, counted each day',
  '🎯 The ring: today, against your session length (15–60′ in Today\'s session)',
  '🟨 A gold bar: a day that reached it',
  '🔥 Days in a row with some practice',
  '👆 Tap a day for its minutes',
];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BAR = 32;   // px: the tallest bar

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

/** Today against the goal: a ring that fills (gold once full), the minutes inside. */
function ring(today, goal) {
  const r = 22, c = 2 * Math.PI * r, f = Math.min(1, today / goal), met = today >= goal;
  const arc = today < 0.5 ? '' : `<circle cx="28" cy="28" r="${r}" fill="none" stroke="url(#pc-${met ? 'gold' : 'fill'})" stroke-width="6" stroke-linecap="round" stroke-dasharray="${(f * c).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 28 28)"/>`;
  return h('button', { class: `pc-ring${met ? ' met' : ''}`, title: 'Today', onClick: () => toast(met ? `Today: ${fmtMin(today)} · 🎯 ${goal}′ reached` : `Today: ${fmtMin(today)} of ${goal}′`) },
    h('span', { class: 'pc-arc', html: `<svg viewBox="0 0 56 56" aria-hidden="true"><defs>
      <linearGradient id="pc-fill" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6e80e8"/><stop offset="1" stop-color="#46c9a2"/></linearGradient>
      <linearGradient id="pc-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f2cf7e"/><stop offset="1" stop-color="#e3876e"/></linearGradient></defs>
      <circle cx="28" cy="28" r="${r}" fill="none" stroke="rgba(238,240,253,0.09)" stroke-width="6"/>${arc}</svg>` }),
    h('span', { class: 'pc-in' }, h('b', {}, fmtMin(today)), h('small', {}, met ? '🎯 done' : `of ${goal}′`)));
}

export function practiceCard() {
  const el = h('section', { class: 'practice-card' });
  const render = () => {
    const goal = sessionMinutes();
    const days = lastDays(7);
    const today = days[6].min;
    const week = days.reduce((a, d) => a + d.min, 0);
    const on = days.filter((d) => d.min >= 1).length;
    const run = streak();
    const top = Math.max(goal, ...days.map((d) => d.min));
    el.replaceChildren(
      ring(today, goal),
      h('div', { class: 'pc-week' },
        h('span', { class: 'pc-label' }, 'Last 7 days'),
        h('b', { class: 'pc-total' }, fmtMin(week)),
        week < 0.5
          ? h('span', { class: 'pc-sub' }, 'Play any exercise to start')
          : h('span', { class: 'pc-sub' }, `${on} day${on === 1 ? '' : 's'} practised`, run >= 2 ? h('em', { class: 'pc-streak' }, `🔥 ${run} in a row`) : null)),
      h('div', { class: 'pc-bars' },
        // (the goal's height over the day letters: 12 px of letter and a 2 px gap)
        h('i', { class: 'pc-goal', style: { bottom: `${(14 + (goal / top) * BAR).toFixed(1)}px` } }, h('span', {}, `🎯 ${goal}′`)),
        days.map((d, i) => h('button', {
          class: `pc-day${i === 6 ? ' today' : ''}${d.min >= goal ? ' met' : ''}`,
          title: DAY_NAMES[d.date.getDay()],
          onClick: () => toast(`${i === 6 ? 'Today' : DAY_NAMES[d.date.getDay()]}: ${fmtMin(d.min)}${d.min >= goal ? ` · 🎯 ${goal}′ reached` : ''}`),
        },
        h('em', {}, d.min < 0.5 ? '' : short(d.min)),
        h('b', {}, h('i', { style: { height: `${d.min < 0.5 ? 0 : Math.max(4, (d.min / top) * BAR).toFixed(1)}px` } })),
        h('span', {}, 'SMTWTFS'[d.date.getDay()])))),
      infoBtn(INFO, 'About your practice log'));
  };
  render();
  el.refresh = render;
  return el;
}
