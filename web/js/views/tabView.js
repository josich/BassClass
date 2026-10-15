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
  render(inst, { strings, beatsOf, label, beatsPerBar = 4, sub = 2, mode = 'tab' }) {
    this.inst = inst;
    if (mode === 'staff') return this.renderStaff(inst, { beatsOf, label, beatsPerBar, sub });
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
      if (c.st.hide) {
        out.push(`<text x="${cx - 3}" y="${top + rowH * (strings - 1) / 2 + 4}" class="tnum">?</text>`, '</g>');
        return out.join('');
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
      return out.join('');
    });
    this.cols = cols;
    this.inner.innerHTML = `<svg width="${width}" height="${h}" class="tabsvg">
      <rect class="tcur" x="-100" y="0" width="0" height="${h}" rx="4"/>
      ${lines.join('')}${cells.join('')}</svg>`;
    this.curRect = this.inner.querySelector('.tcur');
    this.cur = -1;
  }

  /**
   * The same strip as standard notation on a bass-clef staff. Bass guitar is written an octave
   * above its sound (open E on the first ledger line below the staff); notes above E4 (written)
   * are drawn an octave lower under an "8va" mark.
   */
  renderStaff(inst, { beatsOf, label, beatsPerBar, sub }) {
    const pxBeat = Math.max(64, (inst.uniform ? sub : 2) * 28);
    const gap = 7;            // space between staff lines
    const half = gap / 2;
    const LPC = [0, 2, 4, 5, 7, 9, 11];
    const stepOf = (n) => {
      const w = n.midi + 12;
      const oct = Math.round((w - n.n.a - LPC[n.n.l]) / 12) - 1;
      return oct * 7 + n.n.l;
    };
    const BOTTOM = 18; // G2, the bottom line
    const placed = inst.steps.map((st) => st.notes.map((n) => {
      let step = stepOf(n), va = false;
      if (step > 30) { step -= 7; va = true; }
      return { n, step, va };
    }));
    const all = placed.flat().map((q) => q.step);
    const hiStep = Math.max(26, ...all) + 3, loStep = Math.min(18, ...all) - 3;
    const top = 16;
    const yOf = (step) => top + (hiStep - step) * half;
    const h = yOf(loStep) + 16;
    // key signature (sharps F C G D A E B, flats B E A D G C F, at their bass-clef places)
    const ks = Math.max(-7, Math.min(7, inst.keySig || 0));
    const SIG = ks > 0 ? [[24, 3], [21, 0], [25, 4], [22, 1], [19, 5], [23, 2], [20, 6]] : [[20, 6], [23, 2], [19, 5], [22, 1], [18, 4], [21, 0], [17, 3]];
    const keyAcc = {};
    SIG.slice(0, Math.abs(ks)).forEach(([, l]) => { keyAcc[l] = Math.sign(ks); });
    let x = 40 + Math.abs(ks) * 8;
    const cols = [];
    inst.steps.forEach((st, i) => {
      const w = Math.max(24, beatsOf(st) * pxBeat);
      cols.push({ i, x, w, st, notes: placed[i] });
      x += w;
    });
    const width = Math.max(x + 20, this.el.clientWidth);
    const lines = [];
    for (let k = 0; k < 5; k++) {
      const y = yOf(BOTTOM + 2 * k);
      lines.push(`<line x1="6" x2="${width - 6}" y1="${y}" y2="${y}" class="tabline"/>`);
    }
    // bass clef: the curl starts on the F line, with the two dots either side of it
    const yF = yOf(24);
    lines.push(`<path d="M10 ${yF} c0 -${gap * 1.1} ${gap * 2.2} -${gap * 1.4} ${gap * 2.4} 0 c0.3 ${gap * 2.2} -${gap * 1.6} ${gap * 3.6} -${gap * 3} ${gap * 4.3}" class="clef"/>`,
      `<circle cx="11.5" cy="${yF}" r="2.6" class="clefdot"/>`,
      `<circle cx="${10 + gap * 3.1}" cy="${yF - half}" r="1.4" class="clefdot"/>`,
      `<circle cx="${10 + gap * 3.1}" cy="${yF + half}" r="1.4" class="clefdot"/>`);
    SIG.slice(0, Math.abs(ks)).forEach(([step], k) => {
      lines.push(`<text x="${38 + k * 8}" y="${yOf(step) + 4}" class="sacc">${ks > 0 ? '♯' : '♭'}</text>`);
    });
    const barXs = [];
    let acc = 0, nb = beatsPerBar;
    for (const c of cols) {
      const bt = beatsOf(c.st);
      while (nb <= acc + bt + 1e-9) {
        barXs.push(c.x + ((nb - acc) / bt) * c.w);
        nb += beatsPerBar;
      }
      acc += bt;
    }
    for (const bx of barXs) lines.push(`<line x1="${bx}" x2="${bx}" y1="${yOf(26)}" y2="${yOf(18)}" class="barline"/>`);
    const ACC = { '-2': '♭♭', '-1': '♭', 0: '♮', 1: '♯', 2: '♯♯' };
    const cells = cols.map((c) => {
      const out = [`<g data-i="${c.i}" class="tcol">`, `<rect x="${c.x}" y="0" width="${c.w}" height="${h}" class="hit"/>`];
      const cx = c.x + 14;
      if (c.st.chord) out.push(`<text x="${c.x + 2}" y="11" class="tchord">${c.st.chord}</text>`);
      if (c.st.hide) {
        out.push(`<text x="${cx - 3}" y="${yOf(22) + 4}" class="tnum">?</text>`, '</g>');
        return out.join('');
      }
      if (c.st.rest || !c.notes.length) {
        out.push(`<rect x="${cx - 4}" y="${yOf(22) - 1}" width="8" height="3" class="srest"/>`, '</g>');
        return out.join('');
      }
      const beats = beatsOf(c.st);
      const open = beats >= 2 - 1e-9;
      const dotted = [0.75, 1.5, 3].some((d) => Math.abs(beats - d) < 1e-6);
      const flags = beats <= 0.25 + 1e-9 ? 2 : beats <= 0.5 + 1e-9 ? 1 : 0;
      const steps = c.notes.map((q) => q.step);
      for (const q of c.notes) {
        const y = yOf(q.step);
        // ledger lines below and above the staff
        for (let l = BOTTOM - 2; l >= q.step; l -= 2) out.push(`<line x1="${cx - 7}" x2="${cx + 7}" y1="${yOf(l)}" y2="${yOf(l)}" class="tabline"/>`);
        for (let l = BOTTOM + 10; l <= q.step; l += 2) out.push(`<line x1="${cx - 7}" x2="${cx + 7}" y1="${yOf(l)}" y2="${yOf(l)}" class="tabline"/>`);
        if (q.n.tag === 'x') out.push(`<text x="${cx - 3.5}" y="${y + 3.5}" class="shead x">×</text>`);
        else out.push(`<ellipse cx="${cx}" cy="${y}" rx="4.3" ry="3.1" transform="rotate(-20 ${cx} ${y})" class="shead${open ? ' open' : ''}${c.st.accent ? ' acc' : ''}"/>`);
        // an accidental only where the note differs from the key signature (♮ cancels it)
        if (q.n.n.a !== (keyAcc[q.n.n.l] || 0)) out.push(`<text x="${cx - 9 - (Math.abs(q.n.n.a) > 1 ? 5 : 0)}" y="${y + 3.5}" class="sacc">${ACC[q.n.n.a]}</text>`);
        if (dotted) out.push(`<circle cx="${cx + 7}" cy="${y - (q.step % 2 === 0 ? half / 2 : 0)}" r="1.2" class="clefdot"/>`);
        if (q.va) out.push(`<text x="${cx - 7}" y="${yOf(Math.max(...steps)) - 9}" class="s8va">8va</text>`);
      }
      if (beats < 4 - 1e-9) {
        // one stem for the step: up from the lowest note below the middle line, else down
        const lo = Math.min(...steps), hi = Math.max(...steps);
        const up = (lo + hi) / 2 < BOTTOM + 4;
        const sx = up ? cx + 4 : cx - 4;
        const y1 = up ? yOf(lo) : yOf(hi), y2 = up ? yOf(hi) - 21 : yOf(lo) + 21;
        out.push(`<line x1="${sx}" x2="${sx}" y1="${y1}" y2="${y2}" class="sstem"/>`);
        for (let f = 0; f < flags; f++) {
          const fy = y2 + (up ? 1 : -1) * f * 5;
          out.push(`<path d="M${sx} ${fy} q5 ${up ? 4 : -4} 6 ${up ? 10 : -10}" class="sflag"/>`);
        }
      }
      const lbl = c.st.notes.map((n) => label(n)).filter(Boolean).join('·');
      if (lbl) out.push(`<text x="${cx - 4}" y="${h - 4}" class="tlbl">${lbl}</text>`);
      out.push('</g>');
      return out.join('');
    });
    this.cols = cols;
    this.inner.innerHTML = `<svg width="${width}" height="${h}" class="tabsvg staff">
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
