// Scrolling tab strip: shows every step as tab numbers with chord symbols and bar lines.
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
    });
    this.cur = -1;
  }

  /**
   * inst: exercise instance; beatsOf(step) => beats; label(note) => string under tab
   */
  render(inst, { strings, beatsOf, label, beatsPerBar = 4, sub = 2 }) {
    this.inst = inst;
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
    const lines = [];
    for (let s = 0; s < strings; s++) {
      const y = top + (strings - 1 - s) * rowH;
      lines.push(`<line x1="6" x2="${width - 6}" y1="${y}" y2="${y}" class="tabline"/>`);
    }
    // bar lines placed by beat position (a long note may contain a bar line)
    const barXs = [];
    let acc = 0, nb = beatsPerBar;
    for (const c of cols) {
      const b = beatsOf(c.st);
      while (nb <= acc + b + 1e-9) {
        barXs.push(c.x + ((nb - acc) / b) * c.w);
        nb += beatsPerBar;
      }
      acc += b;
    }
    for (const bx of barXs) lines.push(`<line x1="${bx}" x2="${bx}" y1="${top - 4}" y2="${top + rowH * (strings - 1) + 4}" class="barline"/>`);
    const cells = cols.map((c) => {
      const out = [`<g data-i="${c.i}" class="tcol">`, `<rect x="${c.x}" y="0" width="${c.w}" height="${h}" class="hit"/>`];
      const cx = c.x + 9;
      if (c.st.chord) out.push(`<text x="${c.x + 2}" y="11" class="tchord">${c.st.chord}</text>`);
      if (c.st.rest) out.push(`<text x="${cx}" y="${top + rowH * (strings - 1) / 2 + 4}" class="trest">𝄽</text>`);
      for (const n of c.st.notes) {
        const y = top + (strings - 1 - n.s) * rowH;
        const t = n.tag === 'x' ? 'x' : String(n.f);
        out.push(`<rect x="${cx - 7}" y="${y - 6}" width="${t.length > 1 ? 16 : 11}" height="12" class="tbg"/>`);
        out.push(`<text x="${cx - 2 + (t.length > 1 ? 3 : 0)}" y="${y + 4}" class="tnum${c.st.accent ? ' acc' : ''}">${t}</text>`);
      }
      const lbl = c.st.notes.map((n) => label(n)).filter(Boolean).join('·');
      if (lbl) out.push(`<text x="${cx - 4}" y="${h - 4}" class="tlbl">${lbl}</text>`);
      out.push('</g>');
      return out.join('');
    });
    this.cols = cols;
    this.inner.innerHTML = `<svg width="${width}" height="${h}" class="tabsvg">
      <rect class="tcur" x="-100" y="0" width="0" height="${h}" rx="4"/>
      ${lines.join('')}${cells.join('')}</svg>`;
    this.curRect = this.inner.querySelector('.tcur');
    this.cur = -1;
  }

  setCurrent(i) {
    this.cur = i;
    if (!this.cols || !this.curRect) return;
    const c = this.cols[i];
    if (!c) { this.curRect.setAttribute('x', -100); return; }
    this.curRect.setAttribute('x', c.x);
    this.curRect.setAttribute('width', Math.max(18, c.w - 2));
    const view = this.el.clientWidth;
    const left = this.el.scrollLeft;
    if (c.x < left + 40 || c.x + c.w > left + view - 60) {
      this.el.scrollTo({ left: Math.max(0, c.x - view * 0.3), behavior: 'smooth' });
    }
  }
}
