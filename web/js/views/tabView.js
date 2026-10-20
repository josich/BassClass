// Scrolling strip under the neck: tab numbers, or standard notation on a bass-clef staff
// (see staff.js), with chord symbols and bar lines. Long exercises draw only the bars around
// the playhead and redraw as it moves, so an all-keys exercise stays responsive.
import { engraveStaff } from './staff.js';

const WIN_BACK = 1600, WIN_AHEAD = 4200; // px drawn behind and ahead of the playhead

export class TabView {
  constructor(el, { onSeek } = {}) {
    this.el = el;
    this.onSeek = onSeek;
    this.el.classList.add('tabview');
    this.inner = document.createElement('div');
    this.inner.className = 'tab-inner';
    el.appendChild(this.inner);
    this.inner.addEventListener('click', (e) => {
      const col = e.target.closest('[data-i]');
      if (col && this.onSeek) this.onSeek(Number(col.dataset.i));
      else if (this.cols && this.onSeek) {
        // the staff has no per-column hit boxes: seek to the column under the click
        const r = this.inner.getBoundingClientRect();
        const x = e.clientX - r.left;
        const c = this.cols.find((cc) => x >= cc.x && x < cc.x + cc.w);
        if (c) this.onSeek(c.i);
      }
    });
    this.cur = -1;
    // scrolling by hand: draw the bars that come into view
    el.addEventListener('scroll', () => {
      if (this.scrollTimer) return;
      this.scrollTimer = setTimeout(() => { this.scrollTimer = null; this.onScroll(); }, 60);
    }, { passive: true });
  }

  onScroll() {
    if (!this.cols || !this.win) return;
    const mid = this.el.scrollLeft + this.el.clientWidth / 2;
    if (mid > this.win[0] + 600 && mid < this.win[1] - 900) return;
    let i = this.cols.findIndex((c) => c.x + c.w >= mid);
    if (i < 0) i = this.cols.length - 1;
    this.paint(i, { keepScroll: true });
  }

  /**
   * inst: exercise instance; beatsOf(step) => beats; label(note) => string under the note
   * mode: 'tab' | 'staff'
   */
  render(inst, opts) {
    this.inst = inst;
    this.opts = opts;
    this.mode = opts.mode === 'staff' ? 'staff' : 'tab';
    this.win = null;
    this.cols = null;
    this.staffSize = null; // chosen once per exercise, not on every redraw
    this.paint(this.cur >= 0 ? this.cur : 0);
  }

  /** Draw the window around step i (everything when the exercise is short). */
  paint(i, { keepScroll = false } = {}) {
    const inst = this.inst, o = this.opts;
    const anchor = this.cols?.[i]?.x ?? 0;
    const win = [anchor - WIN_BACK, anchor + WIN_AHEAD];
    let svgBody, width, h, cols;
    if (this.mode === 'staff') {
      const compact = (typeof window !== 'undefined' && window.innerHeight < 340);
      // a wide-range staff (many ledger lines) gets smaller so the neck keeps its room
      // (never below a readable size: 6)
      const maxH = typeof window !== 'undefined' ? Math.max(72, Math.round(window.innerHeight * 0.3)) : 999;
      let size = this.staffSize ?? (compact ? 7 : 8);
      let r = engraveStaff(inst, { beatsOf: o.beatsOf, label: o.label, beatsPerBar: o.beatsPerBar, compact, size, window: win });
      while (this.staffSize == null && r.height > maxH && size > 6) {
        size -= 1;
        r = engraveStaff(inst, { beatsOf: o.beatsOf, label: o.label, beatsPerBar: o.beatsPerBar, compact, size, window: win });
      }
      this.staffSize = size;
      ({ width, cols } = r);
      h = r.height;
      svgBody = r.svg;
      // the window is only known once the columns are: lay out again around the anchor if needed
      if (this.cols == null || this.cols.length !== cols.length) {
        this.cols = cols;
        const a2 = cols[i]?.x ?? 0;
        const r2 = engraveStaff(inst, { beatsOf: o.beatsOf, label: o.label, beatsPerBar: o.beatsPerBar, compact, size, window: [a2 - WIN_BACK, a2 + WIN_AHEAD] });
        svgBody = r2.svg;
        win[0] = a2 - WIN_BACK; win[1] = a2 + WIN_AHEAD;
      }
    } else {
      ({ svgBody, width, h, cols } = this.tabSvg(win, i));
    }
    this.cols = cols;
    this.win = win;
    this.inner.innerHTML = `<svg width="${Math.max(width, this.el.clientWidth)}" height="${h}" class="tabsvg${this.mode === 'staff' ? ' staff' : ''}">
      <rect class="tcur" x="-100" y="0" width="0" height="${h}" rx="4"/>${svgBody}</svg>`;
    this.curRect = this.inner.querySelector('.tcur');
    if (this.cur >= 0) this.placeCursor(this.cur, !keepScroll);
  }

  tabSvg(win0, i0) {
    const inst = this.inst, { strings, beatsOf, label, beatsPerBar = 4, sub = 2 } = this.opts;
    const pxBeat = Math.max(60, (inst.uniform ? sub : 2) * 26);
    const rowH = 11;
    const top = 16;
    const h = top + rowH * (strings - 1) + 17;
    let x = 14;
    const cols = [];
    inst.steps.forEach((st, i) => {
      const w = Math.max(20, beatsOf(st) * pxBeat);
      cols.push({ i, x, w, st });
      x += w;
    });
    const width = Math.max(x + 20, this.el.clientWidth);
    const anchor = cols[i0]?.x ?? 0;
    const win = [anchor - WIN_BACK, anchor + WIN_AHEAD];
    win0[0] = win[0]; win0[1] = win[1];
    const lines = [];
    for (let s = 0; s < strings; s++) {
      const y = top + (strings - 1 - s) * rowH;
      lines.push(`<line x1="6" x2="${width - 6}" y1="${y}" y2="${y}" class="tabline"/>`);
    }
    // bar lines placed by beat position (a long note may contain a bar line)
    let acc = 0, nb = beatsPerBar;
    for (const c of cols) {
      const b = beatsOf(c.st);
      while (nb <= acc + b + 1e-9) {
        const bx = c.x + ((nb - acc) / b) * c.w;
        if (bx >= win[0] && bx <= win[1]) lines.push(`<line x1="${bx}" x2="${bx}" y1="${top - 4}" y2="${top + rowH * (strings - 1) + 4}" class="barline"/>`);
        nb += beatsPerBar;
      }
      acc += b;
    }
    const cells = [];
    for (const c of cols) {
      if (c.x + c.w < win[0] || c.x > win[1]) continue;
      const out = [`<g data-i="${c.i}" class="tcol">`, `<rect x="${c.x}" y="0" width="${c.w}" height="${h}" class="hit"/>`];
      const cx = c.x + 9;
      if (c.st.chord) out.push(`<text x="${c.x + 2}" y="11" class="${c.st.dyn ? 'tdyn' : 'tchord'}">${c.st.chord}</text>`);
      if (c.st.implied) out.push(`<text x="${c.x + 2}" y="11" class="timpl">(${c.st.implied})</text>`);
      if (c.st.rest) out.push(`<text x="${cx}" y="${top + rowH * (strings - 1) / 2 + 4}" class="trest">𝄽</text>`);
      // ear training: the chord and its answer stay hidden in the strip
      if (c.st.hide || c.st.silent) {
        out.push(`<text x="${cx - 3}" y="${top + rowH * (strings - 1) / 2 + 4}" class="tnum">?</text>`, '</g>');
        cells.push(out.join(''));
        continue;
      }
      for (const n of c.st.notes) {
        const y = top + (strings - 1 - n.s) * rowH;
        const t = n.tag === 'x' ? 'x' : String(n.f);
        out.push(`<rect x="${cx - 7}" y="${y - 6}" width="${t.length > 1 ? 16 : 11}" height="12" class="tbg"/>`);
        out.push(`<text x="${cx - 2 + (t.length > 1 ? 3 : 0)}" y="${y + 4}" class="tnum${c.st.accent ? ' acc' : ''}">${t}</text>`);
      }
      const lbl = c.st.notes.map((n) => label(n)).filter(Boolean).join('·');
      if (lbl) out.push(`<text x="${cx - 4}" y="${h - 4}" class="tlbl">${lbl}</text>`);
      out.push('</g>');
      cells.push(out.join(''));
    }
    return { svgBody: lines.join('') + cells.join(''), width, h, cols };
  }

  placeCursor(i, scroll = true) {
    const c = this.cols?.[i];
    if (!c || !this.curRect) { this.curRect?.setAttribute('x', -100); return; }
    this.curRect.setAttribute('x', c.x);
    this.curRect.setAttribute('width', Math.max(18, c.w - 2));
    if (!scroll) return;
    const view = this.el.clientWidth;
    const left = this.el.scrollLeft;
    if (c.x < left + 40 || c.x + c.w > left + view - 60) {
      this.el.scrollTo({ left: Math.max(0, c.x - view * 0.3), behavior: 'smooth' });
    }
  }

  setCurrent(i) {
    this.cur = i;
    if (!this.cols) return;
    const c = this.cols[i];
    // redraw when the playhead leaves the drawn window
    if (c && this.win && (c.x < this.win[0] + 200 || c.x + c.w > this.win[1] - 600)) this.paint(i);
    this.placeCursor(i);
  }
}
