// Bass-clef staff for the strip under the neck, engraved in the style of the Polyrhythm app's
// notation (rotated oval heads, stems on the right going up and on the left going down, solid
// beams per beat, filled flags, real rest glyphs, italic tuplet numbers, bold time signature).
//
// Conventions (academic, bass guitar): written an octave above the sound (open E on the first
// ledger line below the staff); key signature after the clef; an accidental lasts to the bar line
// (a later note on the same line or space shows ♮ or its own sign); notes above written C5 under
// an 8va bracket; dotted values where they exist, ties where they do not; triplets, quintuplets,
// sextuplets and septuplets with their number; swing written as straight 8ths under "Swing".

const TPQ = 3360;                      // ticks per quarter note (divisible by 3, 5, 6, 7 and 8)
const LPC = [0, 2, 4, 5, 7, 9, 11];    // pitch class of each letter C..B
const BOTTOM = 18;                     // the bottom line is written G2 (step = octave * 7 + letter)
const MIDDLE = 22;                     // D3
// note values (ticks, written): name, flags, hollow head, stem
const VALUES = [
  { t: TPQ * 4, flags: 0, hollow: true, stem: false },
  { t: TPQ * 2, flags: 0, hollow: true, stem: true },
  { t: TPQ, flags: 0, hollow: false, stem: true },
  { t: TPQ / 2, flags: 1, hollow: false, stem: true },
  { t: TPQ / 4, flags: 2, hollow: false, stem: true },
  { t: TPQ / 8, flags: 3, hollow: false, stem: true },
];
// a duration as one written value: plain, dotted or double-dotted
function asValue(t) {
  for (const v of VALUES) {
    if (t === v.t) return { ...v, dots: 0 };
    if (t === v.t * 1.5) return { ...v, dots: 1 };
    if (t === v.t * 1.75) return { ...v, dots: 2 };
  }
  return null;
}
// tuplets: n notes in the time of p, named by how many fill a beat (six 16ths = "6", not "3")
const TUPLET_P = { 3: 2, 5: 4, 6: 4, 7: 4 };

/** Split a duration (ticks, from a position in the bar) into tied written values. */
function splitTies(pos, dur, barT, beatT) {
  const out = [];
  let p = pos, r = dur;
  for (let guard = 0; r > 0 && guard < 16; guard++) {
    const toBar = barT - (p % barT);
    const lim = Math.min(r, toBar);
    // a note that starts off the beat and runs past the next beat shows that beat (tie into it)
    const off = p % beatT;
    const toBeat = off ? beatT - off : Infinity;
    let take = null;
    if (off && lim > toBeat && asValue(toBeat)) take = toBeat;
    if (take == null && asValue(lim)) take = lim;
    if (take == null) {
      // the largest written value that fits
      for (const v of VALUES) for (const m of [1.75, 1.5, 1]) { if (take == null && v.t * m <= lim && Number.isInteger(v.t * m)) take = v.t * m; }
      if (take == null) take = lim;
    }
    out.push(take);
    p += take; r -= take;
  }
  return out;
}

/** Written staff step of a note (bass guitar: an octave above the sound). */
function stepOf(note, midi) {
  const w = midi + 12;
  const oct = Math.round((w - note.a - LPC[note.l]) / 12) - 1;
  return oct * 7 + note.l;
}

// ---------------------------------------------------------------- glyphs (s = staff space)
const f2 = (v) => (Math.round(v * 10) / 10).toString();
function head(x, y, s, { hollow = false, kind = '' } = {}) {
  if (kind === 'x') {
    const r = 0.42 * s;
    const cross = `<path d="M${f2(x - r)} ${f2(y - r)}L${f2(x + r)} ${f2(y + r)}M${f2(x + r)} ${f2(y - r)}L${f2(x - r)} ${f2(y + r)}" class="sx"/>`;
    // a half or whole ghost note: the cross in a circle
    return hollow ? `${cross}<circle cx="${f2(x)}" cy="${f2(y)}" r="${f2(0.68 * s)}" class="sx"/>` : cross;
  }
  if (kind === 'diamond') {
    // harmonics: an open diamond for half and whole notes, a filled one for shorter values
    const r = 0.55 * s;
    return `<path d="M${f2(x - r)} ${f2(y)}L${f2(x)} ${f2(y - r)}L${f2(x + r)} ${f2(y)}L${f2(x)} ${f2(y + r)}Z" class="${hollow ? 'sdia' : 'sdiaf'}"/>`;
  }
  return hollow
    ? `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(0.62 * s)}" ry="${f2(0.43 * s)}" transform="rotate(-22 ${f2(x)} ${f2(y)})" class="sho" style="stroke-width:${f2(0.24 * s)}"/>`
    : `<ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(0.66 * s)}" ry="${f2(0.47 * s)}" transform="rotate(-22 ${f2(x)} ${f2(y)})" class="shf"/>`;
}
function flagPath(x, y, s, up, n) {
  const k = s / 8;
  let d = '';
  for (let i = 0; i < n; i++) {
    const yy = y + (up ? 1 : -1) * i * 0.8 * s;
    d += up
      ? `M${f2(x)} ${f2(yy)}c${f2(1 * k)} ${f2(5 * k)} ${f2(8 * k)} ${f2(7 * k)} ${f2(6 * k)} ${f2(15 * k)}c${f2(-0.6 * k)} ${f2(-5 * k)} ${f2(-3 * k)} ${f2(-7 * k)} ${f2(-6 * k)} ${f2(-8 * k)}z`
      : `M${f2(x)} ${f2(yy)}c${f2(1 * k)} ${f2(-5 * k)} ${f2(8 * k)} ${f2(-7 * k)} ${f2(6 * k)} ${f2(-15 * k)}c${f2(-0.6 * k)} ${f2(5 * k)} ${f2(-3 * k)} ${f2(7 * k)} ${f2(-6 * k)} ${f2(8 * k)}z`;
  }
  return `<path d="${d}" class="sfl"/>`;
}
/** Accidental glyph centred on (x, y): 1 sharp, -1 flat, 0 natural, ±2 double. */
function accidental(x, y, s, a) {
  const u = s / 8;
  if (a === 1) {
    return `<g class="sac"><path d="M${f2(x - 1.6 * u)} ${f2(y - 9 * u)}V${f2(y + 10 * u)}M${f2(x + 1.6 * u)} ${f2(y - 10 * u)}V${f2(y + 9 * u)}" style="stroke-width:${f2(1.1 * u)}"/>`
      + `<path d="M${f2(x - 4 * u)} ${f2(y - 2 * u)}L${f2(x + 4 * u)} ${f2(y - 4.6 * u)}L${f2(x + 4 * u)} ${f2(y - 2.2 * u)}L${f2(x - 4 * u)} ${f2(y + 0.4 * u)}ZM${f2(x - 4 * u)} ${f2(y + 4 * u)}L${f2(x + 4 * u)} ${f2(y + 1.4 * u)}L${f2(x + 4 * u)} ${f2(y + 3.8 * u)}L${f2(x - 4 * u)} ${f2(y + 6.4 * u)}Z" class="sacf"/></g>`;
  }
  if (a === -1) {
    return `<g class="sac"><path d="M${f2(x - 2.4 * u)} ${f2(y - 13 * u)}V${f2(y + 4 * u)}" style="stroke-width:${f2(1.2 * u)}"/>`
      + `<path d="M${f2(x - 2.4 * u)} ${f2(y + 4 * u)}C${f2(x + 1 * u)} ${f2(y + 1 * u)} ${f2(x + 5.5 * u)} ${f2(y - 1 * u)} ${f2(x + 3.6 * u)} ${f2(y - 3.6 * u)}C${f2(x + 2 * u)} ${f2(y - 5.6 * u)} ${f2(x - 1 * u)} ${f2(y - 3.6 * u)} ${f2(x - 2.4 * u)} ${f2(y - 1.6 * u)}L${f2(x - 2.4 * u)} ${f2(y)}C${f2(x - 0.6 * u)} ${f2(y - 2 * u)} ${f2(x + 2 * u)} ${f2(y - 3 * u)} ${f2(x + 2.2 * u)} ${f2(y - 1.6 * u)}C${f2(x + 2.4 * u)} ${f2(y - 0.2 * u)} ${f2(x)} ${f2(y + 2 * u)} ${f2(x - 2.4 * u)} ${f2(y + 4 * u)}Z" class="sacf"/></g>`;
  }
  if (a === 0) {
    return `<g class="sac"><path d="M${f2(x - 2 * u)} ${f2(y - 10 * u)}V${f2(y + 4 * u)}M${f2(x + 2 * u)} ${f2(y - 4 * u)}V${f2(y + 10 * u)}" style="stroke-width:${f2(1.1 * u)}"/>`
      + `<path d="M${f2(x - 2 * u)} ${f2(y - 2 * u)}L${f2(x + 2 * u)} ${f2(y - 3.6 * u)}L${f2(x + 2 * u)} ${f2(y - 1.4 * u)}L${f2(x - 2 * u)} ${f2(y + 0.2 * u)}ZM${f2(x - 2 * u)} ${f2(y + 2.4 * u)}L${f2(x + 2 * u)} ${f2(y + 0.8 * u)}L${f2(x + 2 * u)} ${f2(y + 3 * u)}L${f2(x - 2 * u)} ${f2(y + 4.6 * u)}Z" class="sacf"/></g>`;
  }
  if (a === 2) {
    const r = 2.6 * u;
    return `<path d="M${f2(x - r)} ${f2(y - r)}L${f2(x + r)} ${f2(y + r)}M${f2(x + r)} ${f2(y - r)}L${f2(x - r)} ${f2(y + r)}" class="sac" style="stroke-width:${f2(1.6 * u)}"/>`;
  }
  if (a === -2) return accidental(x - 3 * u, y, s, -1) + accidental(x + 3 * u, y, s, -1);
  return '';
}
function accWidth(a, s) { return (a === -2 ? 1.9 : 1.1) * s; }
function rest(x, mid, s, t, dots) {
  const u = s / 8;
  let g = '';
  if (t >= TPQ * 4) g = `<rect x="${f2(x - 0.6 * s)}" y="${f2(mid - s)}" width="${f2(1.2 * s)}" height="${f2(0.5 * s)}" class="srf"/>`;     // hangs from the 4th line
  else if (t >= TPQ * 2) g = `<rect x="${f2(x - 0.6 * s)}" y="${f2(mid - 0.5 * s)}" width="${f2(1.2 * s)}" height="${f2(0.5 * s)}" class="srf"/>`; // sits on the middle line
  else if (t >= TPQ) g = `<path d="M${f2(x - 2 * u)} ${f2(mid - 12 * u)}l${f2(5 * u)} ${f2(6 * u)}l${f2(-4.6 * u)} ${f2(5.4 * u)}l${f2(4.6 * u)} ${f2(6 * u)}c${f2(-3.6 * u)} ${f2(-1.8 * u)} ${f2(-6.4 * u)} 0 ${f2(-2.8 * u)} ${f2(6.4 * u)}" class="sq" style="stroke-width:${f2(2.2 * u)}"/>`;
  else {
    const n = t >= TPQ / 2 ? 1 : t >= TPQ / 4 ? 2 : 3;
    for (let i = 0; i < n; i++) g += `<circle cx="${f2(x - (1 + 1.4 * i) * u)}" cy="${f2(mid - 5 * u + i * 5 * u)}" r="${f2(1.9 * u)}" class="srf"/>`;
    g += `<path d="M${f2(x - 1.5 * u)} ${f2(mid - 3.6 * u)}q${f2(3 * u)} ${f2(1.6 * u)} ${f2(5.4 * u)} ${f2(-2.4 * u)}L${f2(x - (1 + 1.4 * n) * u)} ${f2(mid + (6 + 5 * (n - 1)) * u)}" class="sq" style="stroke-width:${f2(1.4 * u)}"/>`;
  }
  for (let d = 0; d < dots; d++) g += `<circle cx="${f2(x + (8 + 4 * d) * u)}" cy="${f2(mid - 4 * u)}" r="${f2(1.5 * u)}" class="srf"/>`;
  return g;
}
function bassClef(x, yF, s) {
  const u = s;
  const P = (dx, dy) => `${f2(x + dx * u)} ${f2(yF + dy * u)}`;
  return `<path d="M${P(-0.05, -0.1)}C${P(0.05, -1.05)} ${P(1.1, -1.4)} ${P(1.7, -0.98)}C${P(2.45, -0.5)} ${P(2.4, 0.6)} ${P(1.9, 1.25)}C${P(1.35, 2.0)} ${P(0.55, 2.5)} ${P(-0.3, 2.85)}C${P(0.45, 2.35)} ${P(1.2, 1.75)} ${P(1.5, 1.05)}C${P(1.8, 0.35)} ${P(1.72, -0.55)} ${P(1.25, -0.82)}C${P(0.8, -1.05)} ${P(0.3, -0.85)} ${P(0.2, -0.35)}Z" class="sclf"/>`
    + `<circle cx="${f2(x + 0.18 * u)}" cy="${f2(yF)}" r="${f2(0.4 * u)}" class="sclf"/>`
    + `<circle cx="${f2(x + 2.75 * u)}" cy="${f2(yF - 0.5 * u)}" r="${f2(0.19 * u)}" class="sclf"/><circle cx="${f2(x + 2.75 * u)}" cy="${f2(yF + 0.5 * u)}" r="${f2(0.19 * u)}" class="sclf"/>`;
}

/**
 * Lay out and engrave the staff. Returns { svg, cols: [{i, x, w}], width, height }.
 * opts: beatsOf(step), label(note), beatsPerBar, compact (smaller staff for short screens)
 */
export function engraveStaff(inst, { beatsOf, label, beatsPerBar = 4, compact = false, size = 0, window: win = null }) {
  const s = size || (compact ? 7 : 8);
  const half = s / 2;
  const [num, den] = inst.timeSig || [beatsPerBar, 4];
  // compound time counted in dotted quarters (12/8 slow blues: four beats of three 8ths)
  const compound = !!inst.compound && den === 8 && num % 3 === 0;
  const beatT = compound ? TPQ * 1.5 : Math.round(TPQ * (4 / den));
  const barT = compound ? beatT * (num / 3) : beatT * num;
  // beam groups in ticks: the given groups (7/8 as 2+2+3), compound time in dotted quarters, else per beat
  const groupT = inst.groups ? inst.groups.map((g) => g * beatT)
    : compound ? Array(num / 3).fill(beatT)
      : den === 8 && num % 3 === 0 ? Array(num / 3).fill(beatT * 3) : Array(num).fill(beatT);
  const groupOf = (tk) => {
    let at = tk % barT, g = 0;
    for (const len of groupT) { if (at < len) return Math.floor(tk / barT) * 100 + g; at -= len; g++; }
    return Math.floor(tk / barT) * 100 + g;
  };

  // positions in ticks (swing: an 8th on the last triplet of the beat is written on the "&")
  const steps = inst.steps;
  const starts = [];
  let acc = 0;
  for (const st of steps) { starts.push(acc); acc += beatsOf(st); }
  const total = acc;
  // beats holding a note on their middle triplet are real triplets: swing leaves them alone
  const tripletBeats = new Set(starts.filter((b) => Math.abs(b - Math.floor(b + 1e-9) - 1 / 3) < 1e-6).map((b) => Math.floor(b + 1e-9)));
  const wpos = starts.map((b) => {
    if (inst.swing) {
      const fl = Math.floor(b + 1e-9), fr = b - fl;
      if (Math.abs(fr - 2 / 3) < 1e-6 && !tripletBeats.has(fl)) return Math.round((fl + 0.5) * beatT);
    }
    return Math.round(b * beatT);
  });
  const endT = Math.round(total * beatT);
  const wend = (i) => (i + 1 < steps.length ? wpos[i + 1] : endT);
  // the loop plays whole bars: a short last bar is completed with rests
  const padEnd = Math.ceil(endT / barT - 1e-9) * barT;
  const FILL = { rest: true, notes: [] };
  const stepOfEvent = (e) => (e.i >= 0 ? steps[e.i] : FILL);

  // a duration written as a tuplet value: n notes fill a whole number of beats (3 for triplets,
  // 5, 6 for sextuplets, 7); null when it is not one
  const tupletOf = (dur) => {
    for (const n of [3, 5, 6, 7]) {
      if ((dur * n) % beatT !== 0) continue;
      const w = (dur * n) / TUPLET_P[n];
      if (Number.isInteger(w) && asValue(w)) return { n, w };
    }
    return null;
  };
  // events: every step becomes one or more written pieces (ties), or a tuplet note
  const events = [];
  const pushTied = (i, pos, dur, first) => {
    const pieces = splitTies(pos, dur, barT, beatT);
    let p = pos;
    pieces.forEach((t, j) => {
      events.push({ i, pos: p, dur: t, val: asValue(t) || asValue(TPQ), first: first && j === 0, last: j === pieces.length - 1 });
      p += t;
    });
  };
  steps.forEach((st, i) => {
    const pos = wpos[i], dur = wend(i) - pos;
    if (dur <= 0) return;
    // a long note that starts inside a tuplet beat: a tuplet value up to the beat, tied to plain values
    const off = pos % beatT;
    if (off && dur > beatT - off && !asValue(beatT - off)) {
      const tp = tupletOf(beatT - off);
      if (tp) {
        events.push({ i, pos, dur: beatT - off, val: asValue(tp.w), tup: tp.n, first: true, last: false });
        pushTied(i, pos + beatT - off, dur - (beatT - off), false);
        return;
      }
    }
    const tp = !asValue(dur) && splitTies(pos, dur, barT, beatT).some((t) => !asValue(t)) ? tupletOf(dur) : null;
    if (tp) { events.push({ i, pos, dur, val: asValue(tp.w), tup: tp.n, first: true, last: true }); return; }
    pushTied(i, pos, dur, true);
  });
  if (padEnd > endT) {
    // the rests that complete the loop: first the rest of an unfinished tuplet beat (inside its
    // "3", "5" or "6"), then plain rests to the bar line
    let p = endT;
    const off = p % beatT;
    if (off && !asValue(beatT - off)) {
      const tp = tupletOf(beatT - off);
      if (tp) { events.push({ i: -1, pos: p, dur: beatT - off, val: asValue(tp.w), tup: tp.n, first: true, last: true }); p += beatT - off; }
    }
    for (const t of splitTies(p, padEnd - p, barT, beatT)) { events.push({ i: -1, pos: p, dur: t, val: asValue(t) || asValue(TPQ), first: true, last: true }); p += t; }
  }

  // pitches: written steps, 8va above written C5, accidentals against the key and the bar
  const ks = Math.max(-7, Math.min(7, inst.keySig || 0));
  const SIG = ks > 0 ? [[24, 3], [21, 0], [25, 4], [22, 1], [19, 5], [23, 2], [20, 6]] : [[20, 6], [23, 2], [19, 5], [22, 1], [18, 4], [21, 0], [17, 3]];
  const keyAcc = {};
  SIG.slice(0, Math.abs(ks)).forEach(([, l]) => { keyAcc[l] = Math.sign(ks); });
  const placed = steps.map((st) => st.notes.map((n) => {
    const kind = n.tag === 'x' ? 'x' : n.tag === '◊' ? 'diamond' : '';
    let step = stepOf(n.n, n.play ?? n.midi), va = false;
    if (step > 35) { step -= 7; va = true; }
    return { n, step, va, kind };
  }));
  const allSteps = placed.flat().map((q) => q.step);
  const hiStep = Math.max(26, ...allSteps) + (compact ? 2 : 3), loStep = Math.min(18, ...allSteps) - (compact ? 2 : 3);
  const top = 16;
  const yOf = (st) => top + (hiStep - st) * half;
  const mid = yOf(MIDDLE);
  // below the staff: the dynamics (when there are any), then the label row; a chord's labels
  // stack when they would not fit side by side
  const hasDyn = steps.some((st) => st.dyn);
  const dynY = yOf(loStep) + 12;
  const labelY = dynY + (hasDyn ? 14 : 0);

  // horizontal spacing: proportional to time, roomy enough for the shortest written value
  const minT = Math.min(...events.map((e) => e.dur), TPQ);
  const pxQ = Math.min(170, Math.max(46, (2.6 * s * TPQ) / minT));
  const head0 = 40 + Math.abs(ks) * 1.1 * s + 2.4 * s;    // clef, key signature, time signature
  // each bar line gets room after it, so a first note's accidental never touches the line
  const barGap = 1.8 * s;
  const X = (tk) => head0 + (tk / TPQ) * pxQ + 1.4 * s + Math.floor(tk / barT + 1e-9) * barGap;
  const width = Math.max(X(padEnd) + 24, 0);
  const cols = steps.map((st, i) => ({ i, x: X(wpos[i]) - 1.4 * s, w: Math.max(14, X(wend(i)) - X(wpos[i])) }));
  const labelsOf = steps.map((st) => (st.hide || st.silent ? [] : st.notes.map((n) => label(n)).filter(Boolean)));
  const stacked = labelsOf.map((l, i) => l.length > 1 && l.join('·').length * 6.2 > cols[i].w);
  const stackLines = Math.max(1, ...labelsOf.map((l, i) => (stacked[i] ? l.length : 1)));
  const height = labelY + 4 + (stackLines - 1) * 9;
  // only the bars inside the window are engraved (long all-key exercises: a few bars, not hundreds)
  const inWin = (tk) => {
    if (!win) return true;
    const b = Math.floor(tk / barT);
    return !(X((b + 1) * barT) < win[0] || X(b * barT) > win[1]);
  };

  // stems: up below the middle line, down on or above it (a beam group decides together)
  const stepsOfEvent = (e) => placed[e.i].map((q) => q.step);
  const beamable = (e) => { const st = stepOfEvent(e); return !st.rest && st.notes.length && e.val.flags > 0 && !st.hide && !st.silent; };
  const groups = [];
  let g = null;
  events.forEach((e, k) => {
    if (beamable(e) && g && g.key === groupOf(e.pos) && g.last === k - 1 && (e.tup || 0) === g.tup) { g.ix.push(k); g.last = k; }
    else { g = beamable(e) ? { key: groupOf(e.pos), ix: [k], last: k, tup: e.tup || 0 } : null; if (g) groups.push(g); }
  });
  const groupOfEvent = new Map();
  for (const gr of groups) if (gr.ix.length > 1) for (const k of gr.ix) groupOfEvent.set(k, gr);
  const dirOf = (sts) => (sts.reduce((a, b) => a + b, 0) / sts.length >= MIDDLE ? 'down' : 'up');
  for (const gr of groups) if (gr.ix.length > 1) gr.dir = dirOf(gr.ix.flatMap((k) => stepsOfEvent(events[k])));

  // engrave, bar by bar (only the bars inside the window when one is given)
  const bars = new Map();
  const out = (tk, str) => { const b = Math.floor(tk / barT); bars.set(b, (bars.get(b) || '') + str); };
  const accState = new Map(); // bar -> Map(step -> accidental)
  const stemX = (x, up) => x + (up ? 0.58 : -0.58) * s;
  const stemLen = 3.5 * s;
  events.forEach((e, k) => {
    if (!inWin(e.pos)) return;
    const st = stepOfEvent(e);
    const x = X(e.pos);
    if (st.hide || (st.silent && st.notes.length)) {
      if (e.first) out(e.pos, `<text x="${f2(x - 3)}" y="${f2(mid + 4)}" class="tnum">?</text>`);
      return;
    }
    if (st.rest || !st.notes.length) {
      // rests: one glyph per written value, a whole-bar rest centred in its bar
      const whole = e.dur === barT && e.pos % barT === 0;
      const rx = whole ? X(e.pos + barT / 2) : x;
      out(e.pos, rest(rx, mid, s, whole ? TPQ * 4 : e.val.t, whole ? 0 : e.val.dots));
      return;
    }
    const q = placed[e.i];
    const sts = q.map((p) => p.step);
    const gr = groupOfEvent.get(k);
    const up = (gr ? gr.dir : dirOf(sts)) === 'up';
    const bar = Math.floor(e.pos / barT);
    if (!accState.has(bar)) accState.set(bar, new Map());
    const state = accState.get(bar);
    let svg = '';
    // ledger lines
    const lo = Math.min(...sts), hi = Math.max(...sts);
    for (let l = BOTTOM - 2; l >= lo; l -= 2) svg += `<line x1="${f2(x - 1.05 * s)}" x2="${f2(x + 1.05 * s)}" y1="${f2(yOf(l))}" y2="${f2(yOf(l))}" class="sld"/>`;
    for (let l = BOTTOM + 10; l <= hi; l += 2) svg += `<line x1="${f2(x - 1.05 * s)}" x2="${f2(x + 1.05 * s)}" y1="${f2(yOf(l))}" y2="${f2(yOf(l))}" class="sld"/>`;
    // seconds in a chord: the upper note of a second is on the right. Stem up, the upper head moves
    // right of the stem; stem down, the lower head moves left; in a cluster the sides alternate
    const shifted = new Set();
    const order = [...new Set(sts)].sort((a, b) => (up ? a - b : b - a));
    for (const v of order) {
      const nb = up ? v - 1 : v + 1;
      if (order.includes(nb) && !shifted.has(nb)) shifted.add(v);
    }
    const accX = x - 1.25 * s - (!up && shifted.size ? 1.2 * s : 0);
    q.forEach((p) => {
      const y = yOf(p.step);
      const hx = shifted.has(p.step) ? x + (up ? 1.2 : -1.2) * s : x;
      svg += head(hx, y, s, { hollow: e.val.hollow, kind: p.kind });
      if (e.first && p.kind !== 'x') {
        const want = state.has(p.step) ? state.get(p.step) : (keyAcc[p.n.n.l] || 0);
        if (p.n.n.a !== want) svg += accidental(accX - (accWidth(p.n.n.a, s) - 1.1 * s) / 2, y, s, p.n.n.a);
        state.set(p.step, p.n.n.a);
      }
      for (let d = 0; d < e.val.dots; d++) svg += `<circle cx="${f2(x + (1.25 + 0.55 * d) * s)}" cy="${f2(p.step % 2 === 0 ? y - half : y)}" r="${f2(0.2 * s)}" class="srf"/>`;
    });
    if (e.val.stem && !gr) {
      const sx = stemX(x, up);
      const y1 = up ? yOf(lo) : yOf(hi), y2 = up ? yOf(hi) - stemLen : yOf(lo) + stemLen;
      svg += `<line x1="${f2(sx)}" x2="${f2(sx)}" y1="${f2(y1)}" y2="${f2(y2)}" class="sst" style="stroke-width:${f2(0.17 * s)}"/>`;
      if (e.val.flags) svg += flagPath(sx, y2, s, up, e.val.flags);
      e.stemEnd = y2;
    }
    // a tie to the next piece of the same note: an arc on the side away from the stem
    if (!e.last) {
      const nx = X(events[k + 1].pos);
      q.forEach((p) => {
        const y = yOf(p.step) + (up ? 0.9 : -0.9) * s;
        svg += `<path d="M${f2(x + 0.7 * s)} ${f2(y)}Q${f2((x + nx) / 2)} ${f2(y + (up ? 0.9 : -0.9) * s)} ${f2(nx - 0.7 * s)} ${f2(y)}" class="stie"/>`;
      });
    }
    out(e.pos, svg);
  });

  // beams: slanted with the contour (at most a quarter of a space per head), every stem at least 2.5 spaces
  for (const gr of groups) {
    if (gr.ix.length < 2) continue;
    const up = gr.dir === 'up';
    const evs = gr.ix.map((k) => events[k]);
    if (!inWin(evs[0].pos)) continue;
    const xs = evs.map((e) => stemX(X(e.pos), up));
    const ext = evs.map((e) => { const sts = stepsOfEvent(e); return up ? yOf(Math.max(...sts)) : yOf(Math.min(...sts)); });
    const far = evs.map((e) => { const sts = stepsOfEvent(e); return up ? yOf(Math.min(...sts)) : yOf(Math.max(...sts)); });
    let slope = (ext[ext.length - 1] - ext[0]) / Math.max(1, xs[xs.length - 1] - xs[0]);
    slope = Math.max(-0.25 * s / 16, Math.min(0.25 * s / 16, slope));
    // the beam line: above (up) or below (down) every head by at least 2.5 spaces at the inner note, 3.5 at the ends
    let c = up ? Infinity : -Infinity;
    xs.forEach((bx, j) => {
      const need = up ? ext[j] - (j === 0 || j === xs.length - 1 ? stemLen : 2.5 * s) : ext[j] + (j === 0 || j === xs.length - 1 ? stemLen : 2.5 * s);
      const cc = need - slope * (bx - xs[0]);
      c = up ? Math.min(c, cc) : Math.max(c, cc);
    });
    const by = (bx) => c + slope * (bx - xs[0]);
    const th = 0.5 * s;
    let svg = '';
    evs.forEach((e, j) => {
      svg += `<line x1="${f2(xs[j])}" x2="${f2(xs[j])}" y1="${f2(far[j])}" y2="${f2(by(xs[j]))}" class="sst" style="stroke-width:${f2(0.17 * s)}"/>`;
    });
    const beam = (xa, xb, off) => {
      const ya = by(xa) + (up ? off : -off), yb = by(xb) + (up ? off : -off);
      const d = up ? th : -th;
      return `<path d="M${f2(xa)} ${f2(ya)}L${f2(xb)} ${f2(yb)}L${f2(xb)} ${f2(yb + d)}L${f2(xa)} ${f2(ya + d)}Z" class="sbm"/>`;
    };
    svg += beam(xs[0] - 0.08 * s, xs[xs.length - 1] + 0.08 * s, 0);
    for (let lvl = 2; lvl <= 3; lvl++) {
      evs.forEach((e, j) => {
        if (e.val.flags < lvl) return;
        const off = (lvl - 1) * 0.8 * s;
        if (j + 1 < evs.length && evs[j + 1].val.flags >= lvl) svg += beam(xs[j], xs[j + 1], off);
        else if (!(j > 0 && evs[j - 1].val.flags >= lvl)) {
          // a lone short note: a stub pointing into the group
          const stub = 0.95 * s;
          svg += j === evs.length - 1 ? beam(xs[j] - stub, xs[j], off) : beam(xs[j], xs[j] + stub, off);
        }
      });
    }
    out(evs[0].pos, svg);
    // tuplet number over (or under) a beamed tuplet group
    if (gr.tup && evs.reduce((a, e) => a + e.dur, 0) % beatT === 0) {
      const xm = (xs[0] + xs[xs.length - 1]) / 2;
      const topHead = Math.min(...evs.map((e) => yOf(Math.max(...stepsOfEvent(e)))));
      const ym = up ? by(xm) - 0.8 * s : Math.min(topHead, yOf(26)) - 0.9 * s;
      out(evs[0].pos, `<text x="${f2(xm)}" y="${f2(ym)}" class="stn">${gr.tup}</text>`);
    }
  }
  // tuplets that are not beamed: a bracket with the number in a gap, over each span back on the beat grid
  {
    let span = null;
    const flush = () => {
      if (!span) return;
      if (!span.beamed && inWin(span.a.pos)) {
        const xa = X(span.a.pos) - 0.6 * s, xb = X(span.b.pos) + 0.9 * s, xm = (xa + xb) / 2, yb = yOf(Math.max(26, hiStep - 2)) - 0.6 * s;
        out(span.a.pos, `<path d="M${f2(xa)} ${f2(yb + 0.5 * s)}V${f2(yb)}H${f2(xm - 0.8 * s)}M${f2(xm + 0.8 * s)} ${f2(yb)}H${f2(xb)}V${f2(yb + 0.5 * s)}" class="stb"/><text x="${f2(xm)}" y="${f2(yb + 0.45 * s)}" class="stn">${span.n}</text>`);
      }
      span = null;
    };
    events.forEach((e, k) => {
      if (!e.tup) { flush(); return; }
      if (!span || span.n !== e.tup) { flush(); span = { n: e.tup, a: e, b: e, sum: 0, beamed: !!groupOfEvent.get(k), groups: new Set() }; }
      span.b = e; span.sum += e.dur;
      const gr = groupOfEvent.get(k);
      if (!gr) span.beamed = false;
      // a span whose beam group is not the whole tuplet (notes then a rest) needs its bracket
      else if (gr.ix.reduce((a, j) => a + events[j].dur, 0) % beatT !== 0) span.beamed = false;
      if (span.sum % beatT === 0) flush();
    });
    flush();
  }
  // 8va brackets over each run of notes written an octave lower
  {
    let run = null;
    const flush = () => {
      if (!run) return;
      const y = top + 3;
      out(run.a, `<text x="${f2(X(run.a) - 0.4 * s)}" y="${f2(y + 6)}" class="s8">8va</text><path d="M${f2(X(run.a) + 1.9 * s)} ${f2(y + 3)}H${f2(X(run.b) + 0.9 * s)}v${f2(0.6 * s)}" class="s8l"/>`);
      run = null;
    };
    events.forEach((e) => {
      const va = e.i >= 0 && placed[e.i].some((p) => p.va) && !steps[e.i].hide;
      if (va) { if (!run) run = { a: e.pos, b: e.pos }; run.b = e.pos; } else flush();
    });
    flush();
  }
  // chord symbols and the label row
  steps.forEach((st, i) => {
    if (!inWin(wpos[i])) return;
    if (st.chord && st.dyn) out(wpos[i], `<text x="${f2(X(wpos[i]) - 4)}" y="${f2(dynY)}" class="sdyn">${st.chord}</text>`);
    else if (st.chord) out(wpos[i], `<text x="${f2(cols[i].x + 2)}" y="11" class="tchord">${st.chord}</text>`);
    // implied chords (over a vamp) in parentheses, in italics
    if (st.implied) out(wpos[i], `<text x="${f2(cols[i].x + 2)}" y="11" class="timpl">(${st.implied})</text>`);
    if (st.hide || st.silent) return;
    const ls = labelsOf[i];
    if (stacked[i]) {
      // top note's label first, so the column reads like the chord
      [...ls].reverse().forEach((t, j) => out(wpos[i], `<text x="${f2(X(wpos[i]) - 4)}" y="${f2(labelY + j * 9)}" class="tlbl">${t}</text>`));
    } else if (ls.length) out(wpos[i], `<text x="${f2(X(wpos[i]) - 4)}" y="${f2(labelY)}" class="tlbl">${ls.join('·')}</text>`);
  });

  // the frame: staff lines, clef, key and time signature, bar lines
  let frame = '';
  for (let l = 0; l < 5; l++) frame += `<line x1="6" x2="${f2(width - 6)}" y1="${f2(yOf(BOTTOM + 2 * l))}" y2="${f2(yOf(BOTTOM + 2 * l))}" class="sln"/>`;
  frame += bassClef(9, yOf(24), s);
  SIG.slice(0, Math.abs(ks)).forEach(([st], j) => { frame += accidental(38 + j * 1.1 * s, yOf(st), s, Math.sign(ks)); });
  const tsx = 40 + Math.abs(ks) * 1.1 * s + 0.9 * s;
  frame += `<text x="${f2(tsx)}" y="${f2(yOf(22) - 0.05 * s)}" class="sts" style="font-size:${f2(2.45 * s)}px">${num}</text><text x="${f2(tsx)}" y="${f2(yOf(18) - 0.05 * s)}" class="sts" style="font-size:${f2(2.45 * s)}px">${den}</text>`;
  for (let b = barT; b < padEnd; b += barT) frame += `<line x1="${f2(X(b) - 2.3 * s)}" x2="${f2(X(b) - 2.3 * s)}" y1="${f2(yOf(26))}" y2="${f2(yOf(18))}" class="sbl"/>`;
  frame += `<line x1="${f2(width - 14)}" x2="${f2(width - 14)}" y1="${f2(yOf(26))}" y2="${f2(yOf(18))}" class="sbl"/><rect x="${f2(width - 11)}" y="${f2(yOf(26))}" width="${f2(0.45 * s)}" height="${f2(4 * s)}" class="srf"/>`;
  if (inst.swing) frame += `<text x="6" y="11" class="sswing">Swing</text>`;

  // only the bars inside the window (long all-key exercises draw a few hundred bars, not thousands)
  let body = '';
  for (const [b, str] of bars) {
    if (win) {
      const bx0 = X(b * barT), bx1 = X((b + 1) * barT);
      if (bx1 < win[0] || bx0 > win[1]) continue;
    }
    body += str;
  }
  return { svg: frame + body, cols, width, height, xAt: (i) => X(wpos[i]) };
}
