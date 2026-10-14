// QA: layout checker (paste into the qa server tab; disable CSS transitions first, the hidden pane
// never advances them). window.__layout(label) returns clipped text, off-viewport or covered
// interactive controls, overlapping controls, small touch targets and horizontal page scroll.
window.__layout = (label) => {
  const W = innerWidth, H = innerHeight;
  const out = { label, size: `${W}x${H}`, hscroll: document.documentElement.scrollWidth > W + 1, clipped: [], ellipsis: [], offscreen: [], covered: [], overlap: [], small: [] };
  const d = (el) => `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}[${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30)}]`;
  const shown = (el) => { const cs = getComputedStyle(el); return cs.display !== 'none' && cs.visibility !== 'hidden' && el.getClientRects().length; };
  // scroll containers: a control inside one may legitimately sit outside the viewport
  const inScroller = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY) && (p.scrollWidth > p.clientWidth + 1 || p.scrollHeight > p.clientHeight + 1)) return p; } return null; };
  for (const el of document.querySelectorAll('body *')) {
    if (!shown(el) || el.closest('svg') || !el.childNodes.length) continue;
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!hasText) continue;
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      const cs = getComputedStyle(el);
      if (cs.overflowX === 'visible') continue;
      (cs.textOverflow === 'ellipsis' ? out.ellipsis : out.clipped).push(`${d(el)} ${el.scrollWidth}>${el.clientWidth}`);
    }
  }
  const ctl = [...document.querySelectorAll('button, a[href], select, input, .card, .item, .chip-btn')].filter(shown).filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
  for (const el of ctl) {
    const r = el.getBoundingClientRect();
    const sc = inScroller(el);
    const outside = r.left < -1 || r.top < -1 || r.right > W + 1 || r.bottom > H + 1;
    if (outside && !sc) out.offscreen.push(`${d(el)} @${Math.round(r.left)},${Math.round(r.top)} ${Math.round(r.width)}x${Math.round(r.height)}`);
    if (!outside) {
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (hit && !(el === hit || el.contains(hit) || hit.contains(el))) out.covered.push(`${d(el)} under ${d(hit)}`);
    }
    if ((r.width < 32 || r.height < 32) && !el.matches('input[type=range]')) out.small.push(`${d(el)} ${Math.round(r.width)}x${Math.round(r.height)}`);
  }
  for (let i = 0; i < ctl.length; i++) for (let j = i + 1; j < ctl.length; j++) {
    const a = ctl[i], b = ctl[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ix = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), iy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ix > 2 && iy > 2) out.overlap.push(`${d(a)} x ${d(b)} (${Math.round(ix)}x${Math.round(iy)})`);
  }
  for (const k of ['clipped', 'ellipsis', 'offscreen', 'covered', 'overlap', 'small']) out[k] = [...new Set(out[k])];
  return out;
};
