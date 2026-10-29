// SVG fretboard renderer: navy board, real-gauge round-wound strings,
// semi-realistic fret spacing and glossy note markers with motion cues.
import { INLAYS, DOUBLE_INLAYS } from '../fretboard.js';

const SVGNS = 'http://www.w3.org/2000/svg';

/** Marker colours (navy/teal scheme). Keys are referenced by degKey(). */
export const PALETTE = {
  root: '#3fc19c',
  third: '#6e80e8',
  fifth: '#dba85a',
  seventh: '#a982e8',
  sixth: '#e3876e',
  other: '#8a93c2',
  none: '#4fb4dc',
  ghost: '#5d6386',
};

/** Colour key for a degree label. */
export function degKey(deg) {
  if (deg == null || deg === '') return 'none';
  if (deg === 'x') return 'ghost';
  if (deg === 'R') return 'root';
  const d = String(deg).replace(/[♭♯b#]/g, '');
  if (d === '3' || d === '10') return 'third';
  if (d === '5') return 'fifth';
  if (d === '7') return 'seventh';
  if (d === '6' || d === '13') return 'sixth';
  return 'other';
}
// kept for callers that colour by degree
export const degColor = degKey;

// string gauges (inches) of a standard long-scale set, by open-string pitch
const GAUGE = { 23: 0.130, 28: 0.105, 33: 0.085, 38: 0.065, 43: 0.045, 48: 0.030 };
const SPACING_CURVE = 0.55; // 1 = true fret spacing, 0 = equal cells

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const t = amt < 0 ? 0 : 255, p = Math.abs(amt);
  r = Math.round((t - r) * p + r); g = Math.round((t - g) * p + g); b = Math.round((t - b) * p + b);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export class FretboardView {
  constructor(el, { onTap } = {}) {
    this.el = el;
    this.onTap = onTap;
    this.strings = 4;
    this.names = ['E', 'A', 'D', 'G'];
    this.tuning = [28, 33, 38, 43];
    this.lo = 0;
    this.hi = 12;
    this.lefty = false;
    this.zone = null;
    this.dots = [];
    this.uid = Math.random().toString(36).slice(2, 7);
    this.svg = document.createElementNS(SVGNS, 'svg');
    this.svg.classList.add('fb');
    el.appendChild(this.svg);
    this.svg.addEventListener('pointerdown', (e) => this._tap(e));
    this._ro = new ResizeObserver(() => this.layout());
    this._ro.observe(el);
  }

  destroy() { this._ro.disconnect(); }

  configure({ strings, names, tuning, lo, hi, lefty, zone }) {
    if (zone !== undefined) this.zone = zone;
    if (strings != null) this.strings = strings;
    if (names) this.names = names;
    if (tuning) this.tuning = tuning;
    if (lo != null) this.lo = lo;
    if (hi != null) this.hi = hi;
    if (lefty != null) this.lefty = lefty;
    this.layout();
  }

  /** Fit a fret range, keeping a minimum visible span. */
  fit(minF, maxF, minSpan = 9) {
    let lo = Math.max(0, minF - 1);
    let hi = Math.max(maxF + 1, lo + minSpan);
    if (lo <= 2) lo = 0;
    hi = Math.min(24, hi);
    this.configure({ lo, hi });
  }

  layout() {
    const w = this.el.clientWidth || 800;
    const h = this.el.clientHeight || 200;
    this.W = w; this.H = h;
    this.svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    this.svg.setAttribute('width', w);
    this.svg.setAttribute('height', h);
    const padL = 30, padR = 12, padT = 8, padB = 20;
    this.showOpen = this.lo === 0;
    this.first = Math.max(1, this.lo);
    // semi-realistic fret spacing: cells shrink gently up the neck
    const cells = [];
    for (let f = this.first; f <= this.hi; f++) cells.push(Math.pow(2, (-f / 12) * SPACING_CURVE));
    const sum = cells.reduce((a, c) => a + c, 0);
    const avail = w - padL - padR;
    const openW = this.showOpen ? Math.max(26, Math.min(48, (avail / (cells.length + 1)) * 0.75)) : 0;
    const scale = (avail - openW) / sum;
    this.wires = [padL + openW];
    for (const c of cells) this.wires.push(this.wires[this.wires.length - 1] + c * scale);
    this.minCell = cells[cells.length - 1] * scale;
    this.padL = padL;
    this.openW = openW;
    this.nutX = padL + openW;
    // on tall screens (tablets) the strings stop spreading apart and the board is centred
    const fullGap = (h - padT - padB) / this.strings;
    this.gap = Math.min(fullGap, 58);
    this.boardTop = padT + ((fullGap - this.gap) * this.strings) / 2;
    this.boardBot = this.boardTop + this.gap * this.strings;
    this.drawBoard();
    this.drawDots();
  }

  _x(x) { return this.lefty ? this.W - x : x; }
  /** x of the wire after fret f (wire 0 = nut). */
  wireX(f) { return this._x(this.wires[Math.max(0, Math.min(this.wires.length - 1, f - this.first + 1))]); }
  /** Center x of a fret cell (fret 0 = open column). */
  fretX(f) {
    if (f === 0) return this._x(this.padL + this.openW / 2);
    const i = f - this.first;
    return this._x((this.wires[i] + this.wires[i + 1]) / 2);
  }
  /**
   * x of a harmonic's node (user, 2026-10-28: "not always in the middle of the fret"): `q` in frets along the
   * string, 12 = right over the 12th fret wire, 3.86 = just before the 4th, 3.16 = just after the 3rd.
   */
  nodeX(q) {
    const fl = Math.floor(q), frac = q - fl;
    return this.wireX(fl) + frac * (this.wireX(fl + 1) - this.wireX(fl));
  }
  stringY(s) { return this.boardTop + this.gap * (this.strings - 1 - s + 0.5); }
  dotR() { return Math.max(9, Math.min(this.minCell * 0.42, this.gap * 0.46)); }

  gaugePx(s) {
    const g = GAUGE[this.tuning[s]] ?? 0.08;
    const k = Math.max(2.4, Math.min(5.4, this.gap * 0.12)) / 0.105;
    return Math.max(1.1, g * k);
  }

  drawBoard() {
    const { H, uid } = this;
    const p = [];
    const xa = this._x(this.nutX), xb = this._x(this.wires[this.wires.length - 1] + 6);
    const bx = Math.min(xa, xb), bw = Math.abs(xb - xa);
    const top = this.boardTop, bot = this.boardBot;
    p.push(`<defs>
      <linearGradient id="board${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#2b305c"/><stop offset="0.5" stop-color="#21254a"/><stop offset="1" stop-color="#292e58"/>
      </linearGradient>
      <filter id="grain${uid}" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.9" numOctaves="2" seed="7"/>
        <feColorMatrix values="0 0 0 0 0.62  0 0 0 0 0.66  0 0 0 0 0.95  0 0 0 0.07 0"/>
      </filter>
      <linearGradient id="fret${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#5d6386"/><stop offset="0.5" stop-color="#e4e7f6"/><stop offset="1" stop-color="#6c7296"/>
      </linearGradient>
      <linearGradient id="nut${uid}" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#d9d3c2"/><stop offset="0.5" stop-color="#f6f2e6"/><stop offset="1" stop-color="#bdb6a3"/>
      </linearGradient>
      <linearGradient id="str${uid}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#55596b"/><stop offset="0.38" stop-color="#f4f5fb"/><stop offset="0.62" stop-color="#c7cad8"/><stop offset="1" stop-color="#454857"/>
      </linearGradient>
      <pattern id="wind${uid}" width="2.6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(28)">
        <rect width="1" height="6" fill="rgba(20,22,40,0.35)"/>
      </pattern>
      <radialGradient id="inlay${uid}" cx="40%" cy="35%" r="70%">
        <stop offset="0" stop-color="#5c63a3"/><stop offset="1" stop-color="#30355f"/>
      </radialGradient>
      <filter id="soft${uid}" x="-10%" y="-200%" width="120%" height="500%"><feGaussianBlur stdDeviation="1.4"/></filter>
      ${Object.entries(PALETTE).map(([k, c]) => `
      <radialGradient id="dg-${k}${uid}" cx="36%" cy="30%" r="78%">
        <stop offset="0" stop-color="${shade(c, 0.38)}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${shade(c, -0.28)}"/>
      </radialGradient>
      <radialGradient id="gl-${k}${uid}"><stop offset="0.35" stop-color="${c}" stop-opacity="0.55"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`).join('')}
    </defs>`);
    // board with subtle grain and binding
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="${bot - top}" rx="4" fill="url(#board${uid})"/>`);
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="${bot - top}" rx="4" filter="url(#grain${uid})"/>`);
    p.push(`<line x1="${bx}" x2="${bx + bw}" y1="${top + 0.5}" y2="${top + 0.5}" stroke="#3d4378" stroke-width="1"/>`);
    p.push(`<line x1="${bx}" x2="${bx + bw}" y1="${bot - 0.5}" y2="${bot - 0.5}" stroke="#11132a" stroke-width="1.5"/>`);
    if (this.zone) {
      const za = this.wireX(Math.max(this.first - 1, this.zone[0] - 1)), zb = this.wireX(Math.min(this.hi, this.zone[1]));
      p.push(`<rect x="${Math.min(za, zb)}" y="${top - 4}" width="${Math.abs(zb - za)}" height="${bot - top + 8}" rx="8" fill="rgba(63,193,156,0.08)" stroke="rgba(63,193,156,0.55)" stroke-dasharray="6 5"/>`);
    }
    // inlays
    // single dots sit between the two middle strings; doubles one string-gap either side
    const midY = (top + bot) / 2 - (this.strings % 2 ? this.gap / 2 : 0);
    const ir = Math.max(3, Math.min(6, this.minCell * 0.1));
    for (let f = this.first; f <= this.hi; f++) {
      const cx = this.fretX(f);
      if (INLAYS.includes(f)) p.push(`<circle cx="${cx}" cy="${midY}" r="${ir}" fill="url(#inlay${uid})"/>`);
      if (DOUBLE_INLAYS.includes(f)) {
        const dy = this.gap;
        p.push(`<circle cx="${cx}" cy="${midY - dy}" r="${ir}" fill="url(#inlay${uid})"/><circle cx="${cx}" cy="${midY + dy}" r="${ir}" fill="url(#inlay${uid})"/>`);
      }
    }
    // fret wires and nut
    const fw = Math.max(2, Math.min(3.6, this.minCell * 0.05));
    for (let f = this.first - 1; f <= this.hi; f++) {
      const x = this.wireX(f);
      if (f === 0) p.push(`<rect x="${x - 4}" y="${top - 1}" width="8" height="${bot - top + 2}" rx="2" fill="url(#nut${uid})"/>`);
      else p.push(`<rect x="${x - fw / 2}" y="${top}" width="${fw}" height="${bot - top}" fill="url(#fret${uid})" opacity="0.92"/>`);
    }
    // fret numbers
    for (let f = this.first; f <= this.hi; f++) {
      const strong = INLAYS.includes(f) || DOUBLE_INLAYS.includes(f);
      // right under the neck (on tall tablets the board is centred and shorter than the view)
      p.push(`<text x="${this.fretX(f)}" y="${Math.min(H - 5, bot + 15)}" class="fretnum${strong ? ' strong' : ''}" data-f="${f}">${f}</text>`);
    }
    // strings: shadow, cylinder, winding
    // from the open-string column (when shown) to the end of the board, on either side for left-handers
    const x0 = this.showOpen ? this._x(this.padL + 4) : xa;
    const left = Math.min(x0, xa, xb), right = Math.max(x0, xa, xb);
    for (let s = 0; s < this.strings; s++) {
      const y = this.stringY(s);
      const th = this.gaugePx(s);
      p.push(`<rect x="${left}" y="${y + th * 0.6}" width="${right - left}" height="${th}" fill="#05060f" opacity="0.55" filter="url(#soft${uid})"/>`);
      p.push(`<g class="string" data-s="${s}"><rect x="${left}" y="${y - th / 2}" width="${right - left}" height="${th}" rx="${th / 2}" fill="url(#str${uid})"/>`);
      if (th >= 1.8) p.push(`<rect x="${left}" y="${y - th / 2}" width="${right - left}" height="${th}" fill="url(#wind${uid})"/>`);
      p.push('</g>');
      p.push(`<text x="${this._x(13)}" y="${y + 4}" class="strname">${this.names[s] || ''}</text>`);
    }
    p.push('<g class="plucks"></g><g class="dots"></g>');
    this.svg.innerHTML = p.join('');
    this.dotLayer = this.svg.querySelector('.dots');
    this.pluckLayer = this.svg.querySelector('.plucks');
  }

  /**
   * dots: [{s, f, label, color (palette key), state: 'current'|'past'|'future'|'next'|'ghost'|'static', tag, fx}]
   */
  setDots(dots) {
    this.dots = dots;
    this.drawDots();
  }

  drawDots() {
    if (!this.dotLayer) return;
    const R = this.dotR();
    const uid = this.uid;
    const out = [];
    const order = { ghost: 0, future: 1, past: 2, static: 3, next: 4, current: 5 };
    const vis = this.dots.filter((d) => d.f >= this.lo && d.f <= this.hi && d.s < this.strings);
    const sorted = [...vis].sort((a, b) => order[a.state] - order[b.state]);
    // motion arc from the current note to the next one
    const cur = vis.find((d) => d.state === 'current');
    const nxt = vis.find((d) => d.state === 'next');
    if (cur && nxt && (cur.s !== nxt.s || cur.f !== nxt.f)) {
      const x1 = this.fretX(cur.f), y1 = this.stringY(cur.s), x2 = this.fretX(nxt.f), y2 = this.stringY(nxt.s);
      const len = Math.hypot(x2 - x1, y2 - y1) || 1;
      const ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      const ax = x1 + ux * R * 1.15, ay = y1 + uy * R * 1.15, bx = x2 - ux * R * 1.2, by = y2 - uy * R * 1.2;
      // bend towards the middle of the board, so an arc along the top string stays on the board
      const bend = Math.min(36, len * 0.25);
      const midX = (ax + bx) / 2, midY = (ay + by) / 2;
      const toward = (this.boardTop + this.boardBot) / 2 - midY || -1;
      let nx = -uy, ny = ux;
      if (ny * toward < 0) { nx = -nx; ny = -ny; }
      const mx = midX + nx * bend, my = midY + ny * bend;
      const col = PALETTE[nxt.color] || PALETTE.none;
      out.push(`<path class="arc" d="M${ax},${ay} Q${mx},${my} ${bx},${by}" stroke="${col}"/>`);
    }
    for (const d of sorted) {
      // a harmonic is a triangle on its node, not a dot in the middle of the fret (user, 2026-10-28)
      const harm = d.tag === '◊';
      const cx = harm ? this.nodeX(d.at ?? d.f) : this.fretX(d.f), cy = this.stringY(d.s);
      const key = PALETTE[d.color] ? d.color : 'none';
      const col = PALETTE[key];
      const st = d.state;
      const r = st === 'current' ? R * 1.1 : st === 'past' ? R * 0.88 : st === 'future' || st === 'ghost' ? R * 0.86 : R;
      const isRoot = key === 'root';
      const tri = (k) => `M0,${-k * 1.12} L${k * 1.08},${k * 0.78} L${-k * 1.08},${k * 0.78} Z`;
      const body = (attrs) => (harm ? `<path d="${tri(r)}" stroke-linejoin="round" ${attrs}/>`
        : isRoot
          ? `<rect x="${-r}" y="${-r}" width="${2 * r}" height="${2 * r}" rx="${r * 0.42}" ${attrs}/>`
          : `<circle r="${r}" ${attrs}/>`);
      const label = d.label !== '' && d.label != null ? String(d.label) : '';
      // (a triangle's label sits lower, in its widest part, and a little smaller)
      const fs = Math.max(9, r * (label.length > 2 ? 0.66 : label.length > 1 ? 0.8 : 0.92) * (harm ? 0.86 : 1));
      // (`fx`: an extra class for an effect, the tap games' "win" growth and "miss" shake)
      out.push(`<g class="dot ${st}${d.fx ? ` ${d.fx}` : ''}" transform="translate(${cx},${cy})"><g class="in">`);
      if (st === 'current') {
        out.push(`<circle class="glow" r="${r * 2.1}" fill="url(#gl-${key}${uid})"/>`);
        out.push(harm ? `<path class="ripple" d="${tri(r)}" fill="none" stroke="${col}" stroke-width="2"/>` : `<circle class="ripple" r="${r}" fill="none" stroke="${col}" stroke-width="2"/>`);
        out.push(body(`class="body" fill="url(#dg-${key}${uid})" stroke="#ffffff" stroke-width="2.2"`));
      } else if (st === 'next') {
        out.push(body(`class="ghostfill" fill="${col}" fill-opacity="0.16"`));
        out.push(body(`class="ring" fill="none" stroke="${col}" stroke-width="2.4" stroke-dasharray="4.5 3.5"`));
      } else if (st === 'future' || st === 'ghost') {
        out.push(body(`class="body" fill="${col}" fill-opacity="0.16" stroke="${col}" stroke-opacity="0.65" stroke-width="1.4"`));
      } else {
        out.push(body(`class="body" fill="url(#dg-${key}${uid})" stroke="rgba(255,255,255,0.3)" stroke-width="1.2"`));
      }
      if (label) {
        const outline = st === 'next' || st === 'future' || st === 'ghost';
        out.push(`<text class="lbl${outline ? ' soft' : ''}" y="${fs * 0.35 + (harm ? r * 0.18 : 0)}" font-size="${fs}"${outline ? ` fill="${shade(col, 0.35)}"` : ''}>${label}</text>`);
      }
      // (the triangle already says "harmonic": no ◊ chip above it)
      if (d.tag && !harm) {
        const tw = Math.max(16, String(d.tag).length * 7 + 8);
        // (the pick's down-stroke mark ⊓ is drawn, not written: some phone fonts lack the character)
        const mark = d.tag === '⊓' ? '<path d="M-3.2 3.6V-3.4H3.2V3.6" class="tagp"/>'
          : d.tag === 'T⊓' ? '<text x="-3.2" y="3.5">T</text><path d="M1.6 3.6V-3.4H7.6V3.6" class="tagp"/>'
            : `<text y="3.5">${d.tag}</text>`;
        out.push(`<g class="tag" transform="translate(0,${-r - 9})"><rect x="${-tw / 2}" y="-8" width="${tw}" height="15" rx="7.5"/>${mark}</g>`);
      }
      out.push('</g></g>');
    }
    // highlight the fret number under the current note
    this.svg.querySelectorAll('.fretnum.hot').forEach((t) => t.classList.remove('hot'));
    if (cur && cur.f > 0) this.svg.querySelector(`.fretnum[data-f="${cur.f}"]`)?.classList.add('hot');
    this.dotLayer.innerHTML = out.join('');
  }

  /** Light up and shake a string briefly (pluck feedback). */
  pluck(s, colorKey) {
    const el = this.svg.querySelector(`.string[data-s="${s}"]`);
    if (!el || !this.pluckLayer) return;
    el.classList.remove('vib');
    void el.getBBox();
    el.classList.add('vib');
    const y = this.stringY(s);
    const col = PALETTE[colorKey] || PALETTE.none;
    const x0 = Math.min(this.wireX(this.first - 1), this.wireX(this.hi)), x1 = Math.max(this.wireX(this.first - 1), this.wireX(this.hi));
    const line = document.createElementNS(SVGNS, 'rect');
    line.setAttribute('x', x0);
    line.setAttribute('width', x1 - x0);
    line.setAttribute('y', y - 2.5);
    line.setAttribute('height', 5);
    line.setAttribute('rx', 2.5);
    line.setAttribute('fill', col);
    line.setAttribute('class', 'pluckline');
    this.pluckLayer.appendChild(line);
    setTimeout(() => line.remove(), 700);
  }

  _tap(e) {
    if (!this.onTap) return;
    const pt = this.svg.getBoundingClientRect();
    let x = e.clientX - pt.left;
    const y = e.clientY - pt.top;
    if (this.lefty) x = this.W - x;
    const s = Math.round(this.strings - 1 - ((y - this.boardTop) / this.gap - 0.5));
    if (s < 0 || s >= this.strings) return;
    let f;
    if (x < this.nutX) f = this.showOpen ? 0 : this.first;
    else {
      f = this.hi + 1;
      for (let i = 1; i < this.wires.length; i++) if (x < this.wires[i]) { f = this.first + i - 1; break; }
    }
    if (f > this.hi) return;
    this.onTap(s, f);
  }
}
