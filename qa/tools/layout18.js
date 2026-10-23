// QA round 18 (f15a4eb): the Practice room's layout at one window size (call after resize_window).
//   __layout18({ scope = 'main', min = 32 })  -> sideways scroll, controls outside the window, clipped text,
//     overlapping controls, controls covered at their centre (the floating Start excepted: it floats on
//     purpose, so it is reported apart), touch targets under `min` px.
(() => {
  window.__layout18 = ({ scope = 'main', min = 32, ignore = '.room-fab, .fab-grip' } = {}) => {
    const root = document.querySelector(scope) || document.body;
    const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
    const name = (el) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).join('.') : ''}"${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 22)}"`;
    const ctrls = [...root.querySelectorAll('button, a[href], input, select, summary, [role="button"]')].filter(vis).filter((el) => !el.closest(ignore));
    const out = { size: `${innerWidth}x${innerHeight}`, sideways: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : 0, outside: [], clipped: [], overlap: [], covered: [], coveredByStart: [], small: [] };
    for (const el of ctrls) {
      const r = el.getBoundingClientRect();
      if (r.left < -1 || r.right > innerWidth + 1) out.outside.push(`${name(el)} ${Math.round(r.left)}..${Math.round(r.right)}`);
      // the tap target, with a ::after that widens it (the beat lights)
      const after = getComputedStyle(el, '::after'); const ins = after.content !== 'none' && after.position === 'absolute' ? -parseFloat(after.left || 0) || 0 : 0;
      if (Math.min(r.width + 2 * ins, r.height + 2 * ins) < min && !(el.tagName === 'INPUT' && el.type === 'range')) out.small.push(`${name(el)} ${Math.round(r.width)}x${Math.round(r.height)}${ins ? ` (+${ins} each side)` : ''}`);
      if (r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth) {
        const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        if (t && !el.contains(t) && !t.contains(el)) {
          if (t.closest('.room-fab')) out.coveredByStart.push(name(el)); else out.covered.push(`${name(el)} under ${name(t)}`);
        }
      }
    }
    for (let i = 0; i < ctrls.length; i++) for (let j = i + 1; j < ctrls.length; j++) {
      const a = ctrls[i], b = ctrls[j]; if (a.contains(b) || b.contains(a)) continue;
      const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
      const w = Math.min(p.right, q.right) - Math.max(p.left, q.left), h = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
      if (w > 1 && h > 1) out.overlap.push(`${name(a)} x ${name(b)} (${Math.round(w)}x${Math.round(h)})`);
    }
    for (const el of root.querySelectorAll('b, span, small, label, h1, h2, h3, p, .tempo-name, .beat-grouping, .chord-chip, button')) {
      if (!vis(el) || el.children.length > 2) continue;
      const cs = getComputedStyle(el);
      if (cs.overflow === 'visible' && cs.textOverflow !== 'ellipsis' && el.tagName !== 'BUTTON') continue;
      if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 && !el.classList.contains('ss-row')) out.clipped.push(`${name(el)} ${el.scrollWidth}>${el.clientWidth}`);
    }
    for (const k of ['outside', 'clipped', 'overlap', 'covered', 'coveredByStart', 'small']) out[k] = [...new Set(out[k])].slice(0, 25);
    return out;
  };
  window.__layout18ready = true;
})();
