// Fretboard model: tunings and a fingering engine that maps pitches to string/fret/finger.

export const TUNINGS = {
  4: { midi: [28, 33, 38, 43], names: ['E', 'A', 'D', 'G'] },
  5: { midi: [23, 28, 33, 38, 43], names: ['B', 'E', 'A', 'D', 'G'] },
  6: { midi: [23, 28, 33, 38, 43, 48], names: ['B', 'E', 'A', 'D', 'G', 'C'] },
};

export const MAX_FRET = 24;
export const INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
export const DOUBLE_INLAYS = [12, 24];

/** Build a fretboard context from settings. */
export function makeCtx(settings) {
  const t = TUNINGS[settings.strings] || TUNINGS[4];
  return {
    tuning: t.midi,
    names: t.names,
    maxFret: settings.maxFret || 20,
    str: (name) => t.names.indexOf(name),
  };
}

/** Candidate (string, fret) positions for a midi pitch. */
export function candidates(midi, ctx, { maxFret = ctx.maxFret, strings = null, open = 'allow' } = {}) {
  const out = [];
  ctx.tuning.forEach((openMidi, s) => {
    if (strings && !strings.includes(s)) return;
    const f = midi - openMidi;
    if (f < 0 || f > maxFret) return;
    if (f === 0 && open === 'avoid') return;
    out.push({ s, f });
  });
  return out;
}

/**
 * Place a sequence of midi pitches on the neck.
 *
 * The search models the fretting hand: every fretted note is played by a
 * finger (1-4) from a hand position (index-finger fret). Shifting the hand
 * costs much more than crossing strings, so results stay "in position" and
 * shift only when the line requires it - the way teachers finger exercises.
 *
 * opts:
 *   region: [lo, hi]   strongly prefer frets inside this window
 *   center: fret        softly prefer hand positions near this fret
 *   open: 'allow' | 'avoid' | 'prefer'
 *   strings: [indices]  allowed strings
 *   pin: { midi: stringIndex }  force a pitch onto a string
 *   regions: [{lo, hi, s?, open?}|null]  per note: like region (s pins that note's string, open allows an open string)
 *   string: index       put every note on one string (linear playing)
 * Returns [{s, f, finger}]
 */
export function place(midis, ctx, opts = {}) {
  if (!midis.length) return [];
  if (opts.string != null) {
    const out = midis.map((m) => ({ s: opts.string, f: m - ctx.tuning[opts.string] }));
    return assignFingers(out);
  }
  return handSearch(midis, ctx, opts);
}

const STRETCH = 0.9;

function handSearch(midis, ctx, opts) {
  const open = opts.open || 'allow';
  const layers = [];
  for (let i = 0; i < midis.length; i++) {
    const m = midis[i];
    const nr = opts.regions?.[i];
    let cands = candidates(m, ctx, { open: nr?.open ? 'allow' : open, strings: opts.strings, maxFret: opts.maxFret ?? ctx.maxFret });
    if (opts.pin && opts.pin[m] != null) {
      const pinned = cands.filter((c) => c.s === opts.pin[m]);
      if (pinned.length) cands = pinned;
    }
    if (nr?.s != null) {
      const pinned = cands.filter((c) => c.s === nr.s);
      if (pinned.length) cands = pinned;
    }
    const nopts = nr ? { ...opts, region: [nr.lo, nr.hi] } : opts;
    if (!cands.length) cands = candidates(m, ctx, { maxFret: MAX_FRET });
    if (!cands.length) cands = [{ s: 0, f: Math.max(0, m - ctx.tuning[0]) }];
    const states = [];
    for (const c of cands) {
      if (c.f === 0) {
        // open string: the hand stays where it was
        const prevHps = i === 0 ? [null] : [...new Set(layers[i - 1].map((st) => st.hp))];
        for (const hp of prevHps) states.push({ s: c.s, f: 0, hp, finger: 0, cost: openCost(open, opts) });
        continue;
      }
      for (let finger = 0; finger <= 5; finger++) {
        const hp = c.f - finger + 1;
        if (hp < 1) continue;
        let cost = nodeCost(c.f, hp, nopts, c.s);
        if (finger === 0 || finger === 5) cost += STRETCH;
        states.push({ s: c.s, f: c.f, hp, finger: Math.min(4, Math.max(1, finger)), cost });
      }
    }
    layers.push(states);
  }
  // Viterbi
  let prev = layers[0].map((st) => ({ cost: st.cost, back: -1 }));
  const backs = [prev];
  for (let i = 1; i < layers.length; i++) {
    const cur = layers[i].map((st) => {
      let best = Infinity, bj = 0;
      const pl = layers[i - 1];
      for (let j = 0; j < pl.length; j++) {
        const v = prev[j].cost + trans(pl[j], st);
        if (v < best) { best = v; bj = j; }
      }
      return { cost: best + st.cost, back: bj };
    });
    backs.push(cur);
    prev = cur;
  }
  let j = 0;
  for (let k = 1; k < prev.length; k++) if (prev[k].cost < prev[j].cost) j = k;
  const path = new Array(layers.length);
  path.cost = prev[j].cost;
  for (let i = layers.length - 1; i >= 0; i--) {
    const st = layers[i][j];
    path[i] = { s: st.s, f: st.f, finger: st.finger };
    j = backs[i][j].back;
  }
  return path;
}

function openCost(open, opts) {
  if (opts.region && opts.region[0] > 2) return 3;
  if (open === 'prefer') return -0.4;
  return 0.25;
}

function nodeCost(f, hp, opts, s = 1) {
  // players avoid the muddy, hard-to-reach upper frets of the two lowest strings
  let cost = f * 0.006 + (s <= 1 && f > 12 ? 0.4 : 0);
  if (opts.region) {
    const [lo, hi] = opts.region;
    if (f < lo) cost += (lo - f) * 3;
    else if (f > hi) cost += (f - hi) * 3;
  }
  if (opts.center != null) cost += Math.abs(hp - opts.center) * 0.02;
  return cost;
}

function trans(a, b) {
  let cost = 0;
  const ds = Math.abs(b.s - a.s);
  cost += ds * 0.15 + (ds >= 2 ? 0.25 : 0);
  if (a.hp != null && b.hp != null && a.hp !== b.hp) {
    cost += 1 + Math.abs(a.hp - b.hp) * 0.06;
    // shifting along the same string (guide-finger shift) is the cleanest way to move
    if (a.s === b.s && a.f > 0 && b.f > 0) cost -= 0.3;
  }
  return cost;
}

/**
 * Assign left-hand fingers (one finger per fret) to notes that lack one.
 * When a note leaves the current 4-fret window the hand shifts to the window
 * that fits the most upcoming notes.
 */
export function assignFingers(notes) {
  let pos = null;
  for (let i = 0; i < notes.length; i++) {
    const n = notes[i];
    if (n.f === 0) { if (n.finger == null) n.finger = 0; continue; }
    if (n.finger != null) { pos = n.f - n.finger + 1; continue; }
    if (pos === null || n.f < pos || n.f > pos + 3) {
      let lo = n.f, hi = n.f;
      for (let j = i + 1; j < notes.length && j < i + 12; j++) {
        const f = notes[j].f;
        if (f === 0) continue;
        const nlo = Math.min(lo, f), nhi = Math.max(hi, f);
        if (nhi - nlo > 3) break;
        lo = nlo; hi = nhi;
      }
      pos = lo;
    }
    n.finger = n.f - pos + 1;
  }
  return notes;
}

/**
 * Enumerate every way to play an ascending group of pitches (a chord shape)
 * inside a fret window: strings never go backwards, total span <= maxSpan.
 * Returns [{pos: [{s,f}], cost}] best first.
 */
export function shapes(midis, ctx, { lo = 1, hi = 12, maxSpan = 4, open = false } = {}) {
  const cands = midis.map((m) =>
    candidates(m, ctx, { maxFret: hi, open: open ? 'allow' : 'avoid' }).filter((c) => c.f === 0 || c.f >= lo));
  const out = [];
  const acc = [];
  const rec = (i) => {
    if (i === midis.length) {
      const fr = acc.filter((a) => a.f > 0).map((a) => a.f);
      const span = fr.length ? Math.max(...fr) - Math.min(...fr) : 0;
      if (span <= maxSpan) out.push({ pos: acc.map((a) => ({ ...a })), cost: shapeCost(acc, span) });
      return;
    }
    for (const c of cands[i]) {
      if (i > 0 && c.s < acc[i - 1].s) continue;
      acc.push(c);
      rec(i + 1);
      acc.pop();
    }
  };
  rec(0);
  return out.sort((a, b) => a.cost - b.cost);
}

function shapeCost(pos, span) {
  let c = span >= 4 ? 0.6 : 0;
  for (let i = 1; i < pos.length; i++) {
    const ds = pos[i].s - pos[i - 1].s;
    c += ds * 0.2 + (ds >= 2 ? 0.3 : 0);
  }
  return c;
}
