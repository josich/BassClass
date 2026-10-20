// QA (ea7705f): independent checker for the new staff engraving (web/js/views/staff.js).
// Paste into the qa tab (http://127.0.0.1:8878). window.__engrave(inst, {sub, compact}) calls
// engraveStaff() with no window (every bar), parses the SVG and reads back, from the glyphs alone:
//  - every written value: hollow/filled head, stem, flags or beam levels, augmentation dots,
//    tuplet number (beamed or bracketed), rests (whole-bar, whole/half blocks, quarter, 8th/16th/32nd);
//  - per step: the sum of its written pieces (ticks) against its real length (swing: a swung "&"
//    written on the "&", a real triplet kept as a triplet);
//  - no piece crosses a bar line; every glyph sits between its bar lines;
//  - note heads on the line/space of the written pitch (sound + 1 octave), 8va above written C5 and
//    every 8va note under a bracket and no plain note under one; ledger lines exactly as needed;
//  - accidentals by the standard rule (key signature, held to the bar line, naturals), none on ghosts;
//  - beams never cross a beat group (7/8 2+2+3, 6/8 dotted quarters) or a bar line;
//  - key signature glyphs and positions, time signature text.
// Returns { problems: [...], stats }.
window.__engrave = async (inst, { sub = 2, compact = false, beatsOf = null, maxProblems = 40 } = {}) => {
  const { engraveStaff } = await import('/js/views/staff.js');
  const bo = beatsOf || ((st) => (inst.uniform ? st.dur / sub : st.dur));
  const bpb = inst.beatsPerBar || 4;
  const r = engraveStaff(inst, { beatsOf: bo, label: () => '', beatsPerBar: bpb, compact, window: null });
  const problems = [];
  const P = (m) => { if (problems.length < maxProblems) problems.push(m); };
  const doc = new DOMParser().parseFromString(`<svg xmlns="http://www.w3.org/2000/svg">${r.svg.replace(/&(?![a-z#0-9]+;)/g, '&amp;')}</svg>`, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.querySelector('parsererror')) return { problems: ['svg parse error'] };
  const s = compact ? 7 : 8, u = s / 8;
  const q = (sel) => [...root.querySelectorAll(sel)];
  const A = (el, a) => Number(el.getAttribute(a));
  const nums = (el) => (el.getAttribute('d').match(/-?\d+(?:\.\d+)?/g) || []).map(Number);
  const lines = q('line.sln').map((l) => A(l, 'y1')).sort((a, b) => a - b);
  if (lines.length !== 5) return { problems: [`${lines.length} staff lines`] };
  const yBottom = lines[4];
  const half = (lines[4] - lines[0]) / 8;
  const stepAt = (y) => 18 + (yBottom - y) / half;
  const yOf = (st) => yBottom - (st - 18) * half;
  const mid = yOf(22);

  // ---- expected positions (ticks), independently: swing writes a swung "&" on the "&", a real triplet stays
  const [num, den] = inst.timeSig || [bpb, 4];
  const beatT = Math.round(480 * 4 / den), barT = beatT * num;
  const groupT = inst.groups ? inst.groups.map((g) => g * beatT) : den === 8 && num % 3 === 0 ? Array(num / 3).fill(beatT * 3) : Array(num).fill(beatT);
  const groupOf = (tk) => { let at = tk % barT, g = 0; for (const len of groupT) { if (at < len) break; at -= len; g++; } return Math.floor(tk / barT) * 100 + g; };
  const steps = inst.steps;
  const starts = []; let acc = 0;
  for (const st of steps) { starts.push(acc); acc += bo(st); }
  const total = acc;
  const thirds = new Set(starts.filter((b) => Math.abs(b - Math.floor(b + 1e-9) - 1 / 3) < 1e-6).map((b) => Math.floor(b + 1e-9)));
  const wpos = starts.map((b) => {
    const fl = Math.floor(b + 1e-9), fr = b - fl;
    if (inst.swing && Math.abs(fr - 2 / 3) < 1e-6 && !thirds.has(fl)) return Math.round((fl + 0.5) * beatT);
    return Math.round(b * beatT);
  });
  const wend = (i) => (i + 1 < steps.length ? wpos[i + 1] : Math.round(total * beatT));
  if (Math.abs(total / bpb - Math.round(total / bpb)) > 1e-6) P(`total ${total} beats is not whole bars of ${bpb}`);
  const xs = steps.map((_, i) => r.xAt(i));

  // ---- frame: time signature, key signature
  const ts = q('text.sts').map((t) => t.textContent);
  if (ts.join('/') !== `${num}/${den}`) P(`time signature ${ts.join('/')} expected ${num}/${den}`);
  const tsx = Math.min(...q('text.sts').map((t) => A(t, 'x')));

  // ---- accidentals
  const accs = [];
  for (const g of q('g.sac')) {
    const n = nums(g.querySelector('path'));
    if (n.length === 3) accs.push({ a: -1, x: n[0] + 2.4 * u, y: n[1] + 13 * u });
    else if (Math.abs(n[3] - n[0] - 3.2 * u) < 0.25) accs.push({ a: 1, x: n[0] + 1.6 * u, y: n[1] + 9 * u });
    else accs.push({ a: 0, x: n[0] + 2 * u, y: n[1] + 10 * u });
  }
  for (const p of q('path.sac')) { const n = nums(p); accs.push({ a: 2, x: n[0] + 2.6 * u, y: n[1] + 2.6 * u }); }
  // two flats 6u apart on one line or space are a double flat
  accs.sort((a, b) => a.x - b.x);
  const accList = [];
  for (const a of accs) {
    const prev = accList[accList.length - 1];
    if (prev && prev.a === -1 && a.a === -1 && Math.abs(a.y - prev.y) < 0.6 && Math.abs(a.x - prev.x - 6 * u) < 0.4) { prev.a = -2; prev.x += 3 * u; continue; }
    accList.push({ ...a });
  }
  const sig = accList.filter((a) => a.x < tsx);
  const noteAccs = accList.filter((a) => a.x >= tsx);
  const ks = Math.max(-7, Math.min(7, inst.keySig || 0));
  const SHARP = [24, 21, 25, 22, 19, 23, 20], FLAT = [20, 23, 19, 22, 18, 21, 17];
  if (sig.length !== Math.abs(ks)) P(`key signature: ${sig.length} glyphs for keySig ${ks}`);
  sig.forEach((a, j) => {
    const exp = (ks > 0 ? SHARP : FLAT)[j];
    if (Math.abs(stepAt(a.y) - exp) > 0.2) P(`key signature glyph ${j + 1} on step ${stepAt(a.y).toFixed(1)}, expected ${exp}`);
    if (a.a !== Math.sign(ks)) P(`key signature glyph ${j + 1} is ${a.a}`);
  });
  const LET_SHARP = [3, 0, 4, 1, 5, 2, 6], LET_FLAT = [6, 2, 5, 1, 4, 0, 3];
  const keyAcc = {};
  (ks > 0 ? LET_SHARP : LET_FLAT).slice(0, Math.abs(ks)).forEach((l) => { keyAcc[l] = Math.sign(ks); });

  // ---- heads
  const heads = [];
  for (const e of q('ellipse.shf, ellipse.sho')) heads.push({ x: A(e, 'cx'), y: A(e, 'cy'), hollow: e.classList.contains('sho'), kind: '' });
  for (const p of q('path.sx')) { const n = nums(p); heads.push({ x: (n[0] + n[2]) / 2, y: (n[1] + n[3]) / 2, hollow: false, kind: 'x' }); }
  for (const p of q('path.sdia')) { const n = nums(p); heads.push({ x: n[2], y: n[1], hollow: true, kind: 'diamond' }); }
  heads.sort((a, b) => a.x - b.x);
  // events: heads within 1.3 s of the first head of a cluster (a second's upper head sits 1.2 s aside)
  const events = [];
  for (const h of heads) {
    const ev = events.find((e) => Math.abs(h.x - e.x0) <= 1.3 * s && e.kind === 'note');
    if (ev) ev.heads.push(h); else events.push({ kind: 'note', x0: h.x, heads: [h] });
  }
  // stems, flags, beams
  const stems = q('line.sst').map((l) => ({ x: A(l, 'x1'), y1: A(l, 'y1'), y2: A(l, 'y2') }));
  const flags = q('path.sfl').map((p) => { const n = nums(p); return { x: n[0], y: n[1], n: (p.getAttribute('d').match(/M/g) || []).length }; });
  const beams = q('path.sbm').map((p) => { const n = nums(p); return { xa: n[0], ya: n[1], xb: n[2], yb: n[3], yAt: (x) => n[1] + ((n[3] - n[1]) * (x - n[0])) / Math.max(1e-6, n[2] - n[0]) }; });
  const dotsAug = q('circle.srf').filter((c) => Math.abs(A(c, 'r') - Math.round(0.2 * s * 10) / 10) < 0.05);
  for (const ev of events) {
    // the event's anchor: the lowest head (only the upper head of a second moves aside)
    ev.x = ev.heads.reduce((m, h) => (h.y > m.y ? h : m)).x;
    const st = stems.find((l) => [ev.x + 0.58 * s, ev.x - 0.58 * s].some((sx) => Math.abs(l.x - sx) < 0.3) && Math.min(l.y1, l.y2) - 0.5 <= Math.max(...ev.heads.map((h) => h.y)) && Math.max(l.y1, l.y2) + 0.5 >= Math.min(...ev.heads.map((h) => h.y)));
    ev.stem = st || null;
    ev.up = st ? st.x > ev.x : null;
    const fl = st && flags.find((f) => Math.abs(f.x - st.x) < 0.3);
    let levels = fl ? fl.n : 0;
    if (st) {
      const end = ev.up ? Math.min(st.y1, st.y2) : Math.max(st.y1, st.y2);
      const cover = beams.filter((b) => st.x >= Math.min(b.xa, b.xb) - 0.3 && st.x <= Math.max(b.xa, b.xb) + 0.3);
      const prim = cover.find((b) => Math.abs(b.yAt(st.x) - end) < 0.6);
      if (prim) {
        ev.beam = prim;
        const lv = new Set(cover.map((b) => 1 + Math.round(Math.abs(b.yAt(st.x) - prim.yAt(st.x)) / (0.8 * s))));
        levels = Math.max(levels, lv.size);
        ev.beamLevels = lv.size;
      }
    }
    const hollow = ev.heads.some((h) => h.hollow && h.kind !== 'diamond');
    const dia = ev.heads.some((h) => h.kind === 'diamond');
    // a diamond is open: read its value from stem/flags only (whole/half are not distinguishable from filled)
    let base = hollow ? (st ? 960 : 1920) : !st ? (dia ? 1920 : NaN) : [480, 240, 120, 60][levels] ?? NaN;
    if (dia && st && levels === 0) base = 480; // diamonds with a stem: quarter or half (ambiguous), assume quarter
    const nd = dotsAug.filter((c) => A(c, 'cx') > ev.x + 0.9 * s && A(c, 'cx') < ev.x + 2.9 * s && ev.heads.some((h) => Math.abs(A(c, 'cy') - h.y) <= half + 0.3)).map((c) => A(c, 'cx'));
    ev.dots = new Set(nd.map((x) => Math.round(x))).size;
    ev.ticks = base * (ev.dots === 1 ? 1.5 : ev.dots === 2 ? 1.75 : 1);
  }
  // rests
  const blobs = q('circle.srf').filter((c) => Math.abs(A(c, 'r') - Math.round(1.9 * u * 10) / 10) < 0.05);
  const rdots = q('circle.srf').filter((c) => Math.abs(A(c, 'r') - Math.round(1.5 * u * 10) / 10) < 0.05);
  const restEvents = [];
  for (const rc of q('rect.srf')) {
    const w = A(rc, 'width');
    if (Math.abs(w - 1.2 * s) > 0.2) continue; // the final bar line block
    const x = A(rc, 'x') + 0.6 * s, y = A(rc, 'y');
    restEvents.push({ kind: 'rest', x, ticks: Math.abs(y - (mid - s)) < 0.3 ? 1920 : 960, block: true, whole: Math.abs(y - (mid - s)) < 0.3 });
  }
  for (const p of q('path.sq')) {
    const n = nums(p), sw = parseFloat(p.getAttribute('style').match(/stroke-width:([\d.]+)/)[1]);
    if (Math.abs(sw - Math.round(2.2 * u * 10) / 10) < 0.05) restEvents.push({ kind: 'rest', x: n[0] + 2 * u, ticks: 480 });
    else {
      const x = n[0] + 1.5 * u;
      const k = blobs.filter((c) => A(c, 'cx') <= x + 0.2 && A(c, 'cx') > x - 6 * u).length;
      restEvents.push({ kind: 'rest', x, ticks: [0, 240, 120, 60][k] ?? NaN });
    }
  }
  for (const re of restEvents) {
    const d = rdots.filter((c) => A(c, 'cx') > re.x + 6 * u && A(c, 'cx') < re.x + 14 * u).length;
    re.dots = d; re.ticks *= d === 1 ? 1.5 : d === 2 ? 1.75 : 1;
  }
  const qmarks = q('text.tnum').filter((t) => t.textContent === '?').map((t) => ({ kind: 'q', x: A(t, 'x') + 3 }));
  // tuplets
  const tupNums = q('text.stn').map((t) => ({ x: A(t, 'x'), n: Number(t.textContent) }));
  const brackets = q('path.stb').map((p) => { const n = nums(p); return { xa: n[0], xb: n[6] }; });
  const overlapTup = new Set(); const RATIO = { 3: 2 / 3, 5: 4 / 5, 6: 4 / 6, 7: 4 / 7 };
  for (const t of tupNums) {
    const br = brackets.find((b) => t.x > b.xa && t.x < b.xb && Math.abs((b.xa + b.xb) / 2 - t.x) < 1);
    let members;
    if (br) members = [...events, ...restEvents].filter((e) => e.x >= br.xa && e.x <= br.xb);
    else {
      const bm = beams.filter((b) => t.x > Math.min(b.xa, b.xb) && t.x < Math.max(b.xa, b.xb)).sort((a, b) => Math.abs(b.xb - b.xa) - Math.abs(a.xb - a.xa))[0];
      members = bm ? events.filter((e) => e.beam === bm) : [];
    }
    if (!members.length) P(`tuplet ${t.n} at x ${t.x} with no notes`);
    for (const m of members) { if (m.tup) { overlapTup.add(Math.round(m.x)); continue; } m.tup = t.n; m.ticks *= RATIO[t.n] ?? NaN; }
  }

  // ---- bar lines and the x -> step map
  const bars = q('line.sbl').map((l) => A(l, 'x1')).sort((a, b) => a - b);
  const nBars = Math.round(total / bpb);
  if (bars.length !== nBars) P(`${bars.length} bar lines (incl. final) for ${nBars} bars`);
  const barOfX = (x) => { let b = 0; while (b < bars.length && x > bars[b]) b++; return b; };
  const stepOfX = (x) => { let i = 0; while (i + 1 < steps.length && x >= xs[i + 1] - 0.5) i++; return i; };
  const all = [...events, ...restEvents, ...qmarks];
  const per = steps.map(() => []);
  for (const e of all) {
    if (e.whole && restEvents.includes(e)) {
      // a whole-bar rest sits in the middle of its bar: it belongs to the step that starts the bar
      const i = stepOfX(e.x); per[i].push(e); continue;
    }
    per[stepOfX(e.x)].push(e);
  }
  // the bar a step starts in, by ticks, against the bar lines around its glyphs
  const LPC = [0, 2, 4, 5, 7, 9, 11];
  const stepOf = (n, midi) => { const w = midi + 12; const oct = Math.round((w - n.a - LPC[n.l]) / 12) - 1; return oct * 7 + n.l; };
  const brk8 = q('path.s8l').map((p) => { const n = nums(p); return { xa: n[0] - 2.3 * s, xb: n[2] - 0.9 * s }; });
  const accState = new Map();
  const stats = { steps: steps.length, heads: heads.length, rests: restEvents.length, accs: noteAccs.length, tuplets: tupNums.length, beams: beams.length, durMismatch: 0 };
  const usedAcc = new Set();
  steps.forEach((st, i) => {
    const dur = wend(i) - wpos[i];
    if (dur <= 0) return;
    const gl = per[i];
    const hidden = st.hide || (st.silent && st.notes.length);
    if (hidden) { if (!gl.some((g) => g.kind === 'q')) P(`step ${i}: hidden step without "?"`); if (gl.some((g) => g.kind === 'note')) P(`step ${i}: hidden step shows a note head`); return; }
    const isRest = st.rest || !st.notes.length;
    const kinds = new Set(gl.map((g) => g.kind));
    if (isRest && kinds.has('note')) P(`step ${i}: rest step has a note head`);
    if (!isRest && kinds.has('rest')) P(`step ${i}: note step has a rest glyph`);
    const sum = gl.reduce((a, g) => a + (g.ticks || 0), 0);
    if (gl.some((g) => !Number.isFinite(g.ticks))) P(`step ${i}: unreadable value ${JSON.stringify(gl.map((g) => [g.kind, g.ticks]))}`);
    else if (Math.abs(sum - dur) > 2) { stats.durMismatch++; P(`step ${i} (${(+bo(st).toFixed(4))} beats at ${(starts[i]).toFixed(3)}): written ${Math.round(sum)} ticks, expected ${dur} [${gl.map((g) => `${g.kind}${Math.round(g.ticks)}${g.dots ? '.' : ''}${g.tup ? '/' + g.tup : ''}`).join(' ')}]`); }
    // pieces never cross a bar line (glyphs of one step can be in two bars only when the step crosses one)
    const b0 = Math.floor(wpos[i] / barT), b1 = Math.floor((wend(i) - 1) / barT);
    const gb = new Set(gl.map((g) => barOfX(g.x)));
    if (gb.size > b1 - b0 + 1) P(`step ${i}: glyphs in ${gb.size} bars for a step spanning ${b1 - b0 + 1}`);
    if (isRest) return;
    // pitches
    const first = gl.filter((g) => g.kind === 'note').sort((a, b) => a.x - b.x)[0];
    if (!first) { P(`step ${i}: no head`); return; }
    if (Math.abs(first.x - xs[i]) > 0.6) P(`step ${i}: first head at x ${first.x.toFixed(1)}, step at ${xs[i].toFixed(1)}`);
    const bar = Math.floor(wpos[i] / barT);
    if (!accState.has(bar)) accState.set(bar, new Map());
    const state = accState.get(bar);
    const exp = st.notes.map((n) => { let w = stepOf(n.n, n.play ?? n.midi); const va = w > 35; if (va) w -= 7; return { n, w, va }; });
    const got = first.heads.map((h) => stepAt(h.y));
    const e1 = exp.map((e) => e.w).sort((a, b) => a - b).join(','), g1 = got.map((g) => Math.round(g * 10) / 10).sort((a, b) => a - b).join(',');
    if (e1 !== g1) P(`step ${i}: heads on steps [${g1}], expected [${e1}] (${st.notes.map((n) => n.midi).join(',')})`);
    for (const e of exp) {
      const h = first.heads.find((hh) => Math.abs(stepAt(hh.y) - e.w) < 0.2);
      if (!h) continue;
      const kindExp = e.n.tag === 'x' ? 'x' : e.n.tag === '◊' ? 'diamond' : '';
      if (h.kind !== kindExp) P(`step ${i}: head kind "${h.kind}" expected "${kindExp}"`);
      // ledger lines at this event
      const need = [];
      for (let l = 16; l >= e.w; l -= 2) need.push(l);
      for (let l = 28; l <= e.w; l += 2) need.push(l);
      const have = q('line.sld').filter((l) => Math.abs((A(l, 'x1') + A(l, 'x2')) / 2 - first.x) < 0.5).map((l) => stepAt(A(l, 'y1')));
      for (const l of need) if (!have.some((y) => Math.abs(y - l) < 0.2)) P(`step ${i}: missing ledger line on step ${l}`);
      // 8va
      const under = brk8.some((b) => first.x >= b.xa - 0.5 && first.x <= b.xb + 0.5);
      if (e.va && !under) P(`step ${i}: written above C5 but no 8va bracket over it`);
      if (!e.va && under && exp.every((x) => !x.va)) P(`step ${i}: plain note under an 8va bracket (read an octave too high)`);
      // accidental by the standard rule
      let want = null;
      if (kindExp !== 'x') {
        const cur = state.has(e.w) ? state.get(e.w) : (keyAcc[e.n.n.l] || 0);
        if (e.n.n.a !== cur) want = e.n.n.a;
        state.set(e.w, e.n.n.a);
      }
      const a = noteAccs.find((ac) => !usedAcc.has(ac) && Math.abs(ac.y - h.y) < 0.6 && first.x - ac.x > 0.5 * s && first.x - ac.x < 3 * s);
      if (a) usedAcc.add(a);
      if (want == null && a) P(`step ${i}: accidental ${a.a} drawn, none expected (${JSON.stringify(e.n.n)})`);
      if (want != null && (!a || a.a !== want)) P(`step ${i}: accidental ${a ? a.a : 'none'} drawn, ${want} expected (${JSON.stringify(e.n.n)})`);
    }
  });
  const stray = noteAccs.filter((a) => !usedAcc.has(a));
  if (stray.length) P(`${stray.length} accidentals not next to a head they belong to`);
  // beams stay inside one group and one bar: the stems of a primary beam map to one group
  const tickOfX = (x) => { const i = stepOfX(x); const k = (xs[1] - xs[0]) / Math.max(1, wpos[1] - wpos[0]); let t = wpos[i] + (x - xs[i]) / (k || 1); if (Math.floor(t / barT) > Math.floor(wpos[i] / barT)) t = wpos[i] + (x - xs[i] - 1.8 * s) / (k || 1); return t; };
  void tickOfX;
  const beamGroups = new Map();
  for (const e of events) if (e.beam) { if (!beamGroups.has(e.beam)) beamGroups.set(e.beam, []); beamGroups.get(e.beam).push(e); }
  for (const [bm, evs] of beamGroups) {
    const barsSet = new Set(evs.map((e) => barOfX(e.x)));
    if (barsSet.size > 1) P(`a beam crosses a bar line at x ${bm.xa.toFixed(0)}`);
    // group by the step each stem belongs to (step starts are exact ticks)
    const grp = new Set(evs.map((e) => { const i = stepOfX(e.x); return Math.abs(e.x - xs[i]) < 0.6 ? groupOf(wpos[i]) : null; }).filter((g) => g != null));
    if (grp.size > 1) P(`a beam spans ${grp.size} beat groups at x ${bm.xa.toFixed(0)}`);
    const dirs = new Set(evs.map((e) => e.up));
    if (dirs.size > 1) P(`a beamed group with stems both ways at x ${bm.xa.toFixed(0)}`);
  }
  stats.events = events.length;
  if (overlapTup.size) P(`${overlapTup.size} notes under two tuplet numbers (a bracket over a beamed tuplet)`);
  return { problems, stats, width: r.width, height: r.height };
};

// sweep helper: every exercise x a few options; returns counts per exercise and samples
window.__engraveSweep = async ({ only = null, perEx = 24, strings = 4, subs = [2], seed = 3, maxFret = 20 } = {}) => {
  const T = await import('/js/theory.js');
  const F = await import('/js/fretboard.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  const { Player } = await import('/js/player.js');
  let s0 = seed; const rnd = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  const S = { strings, notation: 'letters', maxFret };
  const ctx = F.makeCtx(S);
  const res = { builds: 0, problems: 0, by: {}, t0: Date.now(), done: false, at: '' };
  window.__es = res;
  for (const t of EXERCISES.filter((e) => !only || only.includes(e.id))) {
    res.at = t.id;
    const keys = Object.keys(t.params || {});
    const optsOf = (k) => { const d = t.params[k]; return d.kind === 'key' ? [...T.CHROMATIC_PC.map(String), ...(d.cycles ? ['cycle4'] : [])] : d.options.filter((o) => !o[2]?.minStrings || strings >= o[2].minStrings).map((o) => o[0]); };
    const list = [Object.fromEntries(keys.map((k) => [k, t.params[k].default]))];
    keys.forEach((k) => { if (t.params[k].kind !== 'key') for (const v of optsOf(k)) list.push({ ...list[0], [k]: v }); });
    while (list.length < perEx) list.push(Object.fromEntries(keys.map((k) => { const o = optsOf(k).filter((v) => !String(v).startsWith('cycle')); return [k, o[Math.floor(rnd() * o.length)]]; })));
    for (const p of list.slice(0, Math.max(perEx, list.length))) {
      let inst; try { inst = t.build(p, ctx, S); } catch (e) { (res.by[t.id] = res.by[t.id] || []).push(`threw ${e.message}`); continue; }
      for (const sub of inst.uniform ? subs : [null]) {
        // the player's own beatsOf (fill notes held to the bar line)
        const pl = new Player({}); pl.inst = inst; pl.sub = sub ?? inst.sub ?? 2; pl._layout();
        const beatsOf = (st) => pl.beatsOf(st);
        let out;
        try { out = await window.__engrave(inst, { sub: pl.sub, beatsOf, maxProblems: 6 }); } catch (e) { out = { problems: ['checker threw ' + e.message] }; }
        res.builds++;
        if (out.problems.length) { res.problems += out.problems.length; const arr = (res.by[t.id] = res.by[t.id] || []); if (arr.length < 8) arr.push(`${JSON.stringify(p)} sub ${pl.sub}: ${out.problems.slice(0, 3).join(' | ')}`); }
      }
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  res.done = true; res.ms = Date.now() - res.t0;
  return res;
};
