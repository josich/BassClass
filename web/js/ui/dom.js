// Tiny DOM helpers and inline SVG icons.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const P = {
  // (the tips' heart, in the app's red through `.heart`: user, 2026-10-28, in place of the yellow 💛 emoji)
  heart: '<path d="M12 20.6s-7.6-4.7-7.6-10.4A4.2 4.2 0 0 1 12 7.5a4.2 4.2 0 0 1 7.6 2.7c0 5.7-7.6 10.4-7.6 10.4z" fill="currentColor"/>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
  prev: '<path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  next: '<path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
  restart: '<path d="M6 5v14M18 6l-8 6 8 6z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/>',
  back: '<path d="M14 6l-6 6 6 6M8 12h12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  info: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 11v6M12 7.5v.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
  loop: '<path d="M4 12a6 6 0 0 1 6-6h8M16 3l3 3-3 3M20 12a6 6 0 0 1-6 6H6M8 21l-3-3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  metro: '<path d="M9 3h6l4 18H5zM12 17l5-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  practice: '<path d="M9 3h6l4 18H5zM12 17l5-9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  trainer: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  close: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
  home: '<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  path: '<path d="M5 19c4-1 3-6 7-7s4-6 7-7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="5" cy="19" r="2" fill="currentColor"/><circle cx="19" cy="5" r="2" fill="currentColor"/>',
  library: '<path d="M4 5h4v14H4zM10 5h4v14h-4zM16 6l3.5-1 3 13.5-3.5 1z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
  warmup: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 2 1 3 3 3 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  explorer: '<rect x="3" y="7" width="18" height="10" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 7v10M13 7v10M3 10h18M3 14h18" stroke="currentColor" stroke-width="1.2"/><circle cx="10.5" cy="12" r="1.8" fill="currentColor"/>',
  settings: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="16" cy="7" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="17" r="2.3" fill="none" stroke="currentColor" stroke-width="2"/>',
  tuner: '<path d="M9 3v7a3 3 0 0 0 6 0V3M12 13v8M8.5 21h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
  starO: '<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  grip: '<g fill="currentColor"><circle cx="9" cy="6" r="1.7"/><circle cx="15" cy="6" r="1.7"/><circle cx="9" cy="12" r="1.7"/><circle cx="15" cy="12" r="1.7"/><circle cx="9" cy="18" r="1.7"/><circle cx="15" cy="18" r="1.7"/></g>',
  rotate: '<rect x="7" y="2" width="10" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2" transform="rotate(-90 12 12)"/><path d="M4 4a10 10 0 0 1 8-2" fill="none" stroke="currentColor" stroke-width="2"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  more: '<circle cx="5.5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="18.5" cy="12" r="1.8" fill="currentColor"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="9" r="1.5" fill="currentColor"/><circle cx="15" cy="15" r="1.5" fill="currentColor"/><circle cx="15" cy="9" r="1.5" fill="currentColor"/><circle cx="9" cy="15" r="1.5" fill="currentColor"/>',
  // the player's cycling buttons show their current state: reveal (one note at a time, the whole
  // shape, quiz), dot labels (note, degree, finger, none), tab or staff
  revStep: '<circle cx="5" cy="16" r="2.8" fill="currentColor"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".75"/><circle cx="19" cy="8" r="2.4" fill="none" stroke="currentColor" stroke-width="1.6" opacity=".45"/>',
  revShape: '<g fill="currentColor"><circle cx="5.5" cy="6" r="2.5"/><circle cx="12.5" cy="6" r="2.5"/><circle cx="9" cy="12" r="2.5"/><circle cx="16" cy="12" r="2.5"/><circle cx="12.5" cy="18" r="2.5"/><circle cx="19.5" cy="18" r="2.5"/></g>',
  revQuiz: '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M9.4 9.6a2.7 2.7 0 1 1 3.8 2.5c-.8.4-1.2 1-1.2 1.9v.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.25" fill="currentColor"/>',
  lblNote: '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="16.6" text-anchor="middle" font-size="13" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor">E</text>',
  lblDeg: '<circle cx="12" cy="12" r="9.2" fill="none" stroke="currentColor" stroke-width="1.8"/><text x="12" y="15.9" text-anchor="middle" font-size="10.5" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor">♭3</text>',
  lblFinger: '<path d="M8.4 14V4.7a1.7 1.7 0 0 1 3.4 0v5.5a1.6 1.6 0 0 1 3.2 0v1a1.6 1.6 0 0 1 3.2 0v1a1.5 1.5 0 0 1 3 0V16a6 6 0 0 1-6 6h-2.2a5 5 0 0 1-3.8-1.8l-3.6-4.3a1.6 1.6 0 0 1 2.4-2.1z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  lblNone: '<circle cx="12" cy="12" r="9.2" fill="currentColor" fill-opacity=".22" stroke="currentColor" stroke-width="1.8"/>',
  tab: '<path d="M2.5 5h19M2.5 9.5h19M2.5 14h6M15.5 14h6M2.5 18.5h19" stroke="currentColor" stroke-width="1.3" opacity=".7"/><text x="12" y="17.7" text-anchor="middle" font-size="10.5" font-weight="800" font-family="system-ui, sans-serif" fill="currentColor">5</text>',
  staff: '<path d="M2 4.5h20M2 8h20M2 11.5h20M2 15h20M2 18.5h20" stroke="currentColor" stroke-width="1" opacity=".6"/><ellipse cx="9.3" cy="16.8" rx="3.1" ry="2.2" transform="rotate(-20 9.3 16.8)" fill="currentColor"/><path d="M12.2 16.3V2.6c.5 2.8 4.8 3.6 4.1 8.2" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>',
};

export const icon = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${P[name] || ''}</svg>`;
/** The heart, in the app's red (the tips). */
export const heart = () => h('span', { class: 'heart', html: icon('heart') });

let toastTimer = null;
/**
 * A short confirmation ("Step done ✓") that fades by itself. Instructions and explanations in an
 * exercise are its tip instead (see exercise.js), which belongs to that screen.
 */
export function toast(msg, ms = 1800) {
  let el = document.querySelector('.toast');
  if (!el) { el = h('div', { class: 'toast', role: 'status' }); document.body.append(el); }
  // (a line of text, or a node: a heart drawn in the app's red)
  if (msg instanceof Node) el.replaceChildren(msg); else el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/** Deterministic PRNG (mulberry32) for daily routines. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let closeOpenInfo = null; // the one bubble open at a time

/**
 * A bubble of short lines beside `anchor`: under it, else above it, else as low as fits, always
 * inside the window (`width`: its width at most). One bubble at a time; it closes on any other tap or
 * click (keyboard too), Escape, scrolling (except inside it), a screen change, or a tap on itself.
 * A tap on the anchor is left to the anchor (to toggle it). Returns the function that closes it.
 */
export function showBubble(anchor, text, { width = 340, onClose } = {}) {
  closeOpenInfo?.();
  const pop = h('div', { class: 'info-pop', role: 'note' }, [].concat(text).map((t) => h('p', {}, t)));
  const close = () => {
    if (!pop.isConnected) return;
    pop.remove();
    if (closeOpenInfo === close) closeOpenInfo = null;
    document.removeEventListener('pointerdown', outside, true);
    document.removeEventListener('click', outside, true);
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('scroll', onScroll, true);
    window.removeEventListener('hashchange', close);
    onClose?.();
  };
  const outside = (e) => { if (!pop.contains(e.target) && !anchor.contains(e.target)) close(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  // (scrolling inside a long bubble keeps it open)
  const onScroll = (e) => { if (!pop.contains(e.target)) close(); };
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  const w = Math.min(width, innerWidth - 24);
  pop.style.width = `${w}px`;
  pop.style.left = `${Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2))}px`;
  const ph = pop.offsetHeight;
  const top = r.bottom + 6 + ph <= innerHeight - 8 ? r.bottom + 6 : r.top - ph - 6 >= 8 ? r.top - ph - 6 : Math.max(8, innerHeight - ph - 8);
  pop.style.top = `${top}px`;
  // a tap on the bubble closes it and nothing else (a long one still scrolls)
  pop.addEventListener('click', (e) => { e.stopPropagation(); close(); });
  closeOpenInfo = close;
  document.addEventListener('pointerdown', outside, true);
  document.addEventListener('click', outside, true);
  document.addEventListener('keydown', onKey, true);
  document.addEventListener('scroll', onScroll, true);
  window.addEventListener('hashchange', close);
  return close;
}

/** `el` opens a bubble of `text()` on a tap, and a second tap closes it. */
export function bubbleOnTap(el, text, opts = {}) {
  let close = null;
  el.addEventListener('click', (e) => {
    e.stopPropagation();
    if (close) { close(); return; }
    el.setAttribute('aria-expanded', 'true');
    close = showBubble(el, text(), { ...opts, onClose: () => { close = null; el.setAttribute('aria-expanded', 'false'); } });
  });
  return el;
}

/**
 * A small ⓘ button that explains a screen or a section on request (instead of grey text on the
 * screen): `text` is a line or a list of them, shown in a bubble (`showBubble`).
 */
export function infoBtn(text, label = 'About this') {
  const btn = h('button', { class: 'info-btn', type: 'button', title: label, 'aria-label': label, 'aria-expanded': 'false', html: icon('info') });
  return bubbleOnTap(btn, () => text);
}

/**
 * A row of chips or tabs that scrolls sideways when it does not fit, so it can take any number of them
 * (genres, groups). A mouse wheel scrolls it sideways; an edge fades while items are hidden beyond it;
 * the item marked `.on` is brought fully into view. `from`: the scroll position to start at (a row
 * drawn again keeps its place). Returns the wrapper to place.
 */
export function sideScroll(row, { from = 0 } = {}) {
  row.classList.add('ss-row');
  const wrap = h('div', { class: 'side-scroll' }, row);
  const edges = () => {
    wrap.classList.toggle('more', row.scrollLeft > 2);
    wrap.classList.toggle('after', row.scrollLeft < row.scrollWidth - row.clientWidth - 2);
  };
  row.addEventListener('scroll', edges, { passive: true });
  row.addEventListener('wheel', (e) => {
    if (row.scrollWidth <= row.clientWidth || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    // (at an end the page takes the wheel again, so it never stops scrolling over the row)
    const atEnd = e.deltaY > 0 ? row.scrollLeft >= row.scrollWidth - row.clientWidth - 1 : row.scrollLeft <= 0;
    if (atEnd) return;
    e.preventDefault();
    row.scrollLeft += e.deltaY;
  }, { passive: false });
  /** Scroll as little as needed to show `item` (and `next`, the one after it, when it fits too). */
  const target = (item, next) => {
    const pad = 24, left = item.offsetLeft - pad, right = (next || item).offsetLeft + (next || item).offsetWidth + pad;
    if (left < row.scrollLeft) return left;
    if (right > row.scrollLeft + row.clientWidth) return Math.min(left, right - row.clientWidth);
    return null;
  };
  wrap.show = (item, next) => {
    const to = item && row.clientWidth ? target(item, next) : null;
    if (to != null) row.scrollTo({ left: to, behavior: 'smooth' });
  };
  // once laid out: the place it had, then the chosen item clear of the edges; later, the edges on a resize
  let placed = false;
  const ro = new ResizeObserver(() => {
    if (!row.isConnected) { ro.disconnect(); return; }
    if (!placed && row.clientWidth) {
      placed = true;
      row.scrollLeft = from;
      const on = row.querySelector('.on');
      const to = on ? target(on) : null;
      if (to != null) row.scrollLeft = to;
    }
    edges();
  });
  ro.observe(row);
  return wrap;
}

/**
 * Sliders ignore a touch that is really a scroll: a touch moves a slider only once it goes sideways, so a
 * swipe up or down that starts on one (or a tap that stops a fling) leaves its value alone. Installed once
 * for every slider in the app; the mouse and the keyboard are untouched.
 */
export function guardSliders() {
  const SLOP = 8;   // px before a touch counts as a move
  let g = null;     // the touch on a slider: { el, x, y, v0 (its value before), want (where the slider went), side, dead }
  document.addEventListener('touchstart', (e) => {
    const el = e.target;
    g = el instanceof HTMLInputElement && el.type === 'range' && e.touches.length === 1
      ? { el, x: e.touches[0].clientX, y: e.touches[0].clientY, v0: el.value, want: null, side: false, dead: false }
      : null;
  }, { capture: true, passive: true });
  document.addEventListener('touchmove', (e) => {
    if (!g || g.side || g.dead) return;
    const dx = Math.abs(e.touches[0].clientX - g.x), dy = Math.abs(e.touches[0].clientY - g.y);
    if (dx > SLOP && dx > 1.5 * dy) {
      // sideways: the slider was meant; it takes the place the finger has reached
      g.side = true;
      if (g.want != null && g.want !== g.el.value) { g.el.value = g.want; g.el.dispatchEvent(new Event('input', { bubbles: true })); }
    } else if (dy > SLOP) g.dead = true;   // a scroll: the value stays
  }, { capture: true, passive: true });
  // until then the slider's own moves are held back (and its value kept)
  window.addEventListener('input', (e) => {
    if (!g || e.target !== g.el || g.side) return;
    g.want = g.el.value;
    g.el.value = g.v0;
    e.stopImmediatePropagation();
  }, true);
  window.addEventListener('change', (e) => { if (g && e.target === g.el && !g.side) e.stopImmediatePropagation(); }, true);
  const end = () => { g = null; };
  document.addEventListener('touchend', end, true);
  document.addEventListener('touchcancel', end, true);
}
