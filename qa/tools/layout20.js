// QA round 20 (267b86f): a whole-screen layout check (layout18's rules, any screen). `__lay20(label)` returns
// what is wrong on the screen now: sideways page scroll; interactive elements outside the window horizontally;
// leaf text clipped (scrollWidth > clientWidth + 1 with overflow hidden/clip, or text-overflow ellipsis); two
// interactive elements overlapping by more than 4 px both ways; an interactive element whose centre is covered
// by another element (outside the floating Start and the toast); touch targets under 32 px on both sides (or
// under 24 px on one side). Only elements in the window are checked (a scrolled-away row is not "covered").
(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) return false; return !el.closest('[hidden], details:not([open]) > :not(summary)'); };
  const inWin = (r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const d = (el) => `${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''}"${(el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28)}"`;
  window.__lay20 = (label = location.hash) => {
    const out = [];
    const W = innerWidth;
    if (document.documentElement.scrollWidth > W + 1) out.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${W}`);
    const inter = [...document.querySelectorAll('button, a[href], input, select, summary, [role=button]')].filter(vis);
    for (const el of inter) {
      const r = el.getBoundingClientRect();
      if (!inWin(r)) continue;
      if (r.left < -1 || r.right > W + 1) {
        // inside a sideways scroller (chip rows) is fine
        const sc = el.parentElement?.closest('.ss-row, .side-scroll, .picker-chip-row, [class*=scroll], .tabstrip, .strip');
        if (!sc) out.push(`outside the window: ${d(el)} ${Math.round(r.left)}..${Math.round(r.right)}`);
      }
      const small = (r.width < 32 && r.height < 32) || r.width < 24 || r.height < 24;
      if (small && !el.closest('.rail-dots, .dots')) out.push(`small target ${Math.round(r.width)}x${Math.round(r.height)}: ${d(el)}`);
      const cx = Math.min(W - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(innerHeight - 1, Math.max(0, r.top + r.height / 2));
      if (cy > 0 && cy < innerHeight && cx > 0 && cx < W) {
        const top = document.elementFromPoint(cx, cy);
        if (top && top !== el && !el.contains(top) && !top.contains(el) && !top.closest('.room-fab, .toast, .coach, .info-pop')) {
          const sc = el.closest('.picker-backdrop, .sheet, .pro-sheet, .rate-card');
          if (!sc || sc.contains(top)) out.push(`covered at centre: ${d(el)} under ${d(top)}`);
        }
      }
    }
    for (let i = 0; i < inter.length; i++) for (let j = i + 1; j < inter.length; j++) {
      const a = inter[i], b = inter[j];
      if (a.contains(b) || b.contains(a)) continue;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      if (!inWin(ra) || !inWin(rb)) continue;
      const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
      if (ox > 4 && oy > 4) out.push(`overlap ${Math.round(ox)}x${Math.round(oy)}: ${d(a)} / ${d(b)}`);
    }
    const leaves = [...document.querySelectorAll('body *')].filter((e) => e.children.length === 0 && (e.textContent || '').trim() && vis(e));
    for (const e of leaves) {
      const r = e.getBoundingClientRect();
      if (!inWin(r)) continue;
      const cs = getComputedStyle(e);
      const clips = ['hidden', 'clip'].includes(cs.overflowX) || cs.textOverflow === 'ellipsis';
      if (clips && e.scrollWidth > e.clientWidth + 1) out.push(`clipped text "${e.textContent.trim().slice(0, 40)}" ${e.scrollWidth}>${e.clientWidth}`);
      if (r.right > W + 1 && !e.closest('.ss-row, [class*=scroll], .tabstrip, svg, .strip')) out.push(`text past the window "${e.textContent.trim().slice(0, 30)}" right ${Math.round(r.right)}`);
    }
    return { label, size: `${innerWidth}x${innerHeight}`, n: out.length, out: [...new Set(out)].slice(0, 40) };
  };
})();
