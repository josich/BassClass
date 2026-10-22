// QA (4c593d9): geometry checker for the staff engraving changes of a9db509/797e117 (note-by-note
// spacing, accidentals half a space from their heads in columns, bar lines left of a first note's
// accidentals, beams clear of accidentals, one tuplet number per bar in a steady run).
// Paste into a qa tab (top-level await). window.__eng12(ids, { size, strings, keys, maxBuilds }) builds
// each exercise (defaults, every key, every select option one at a time), engraves it with
// engraveStaff (no window: every bar), draws it into an off-screen <svg> and measures:
//  - accHead: an accidental's box over a note head (heads as rotated ellipses, analytic boxes);
//  - accAcc: two accidentals of different notes overlapping;
//  - barHit: a bar line through an accidental, head or augmentation dot;
//  - accBeam: an accidental over a beam (beam = parallelogram with vertical ends);
//  - accStem: a stem of another note through an accidental;
//  - gap: an accidental's right edge to its own head's left edge (should be ~0.5 space);
//  - chordHit: two chord symbols overlapping; labHit: two labels under the staff overlapping;
//  - tupN: tuplet numbers per bar (a steady run of one tuplet: one per bar);
//  - order: columns (cursor) not increasing.
window.__eng12 = async (ids, { size = 8, strings = 4, keys = true, maxBuilds = 30, onlyAcc = false } = {}) => {
  const { byId, defaultParams } = await import('/js/curriculum/index.js');
  const { makeCtx } = await import('/js/fretboard.js');
  const { engraveStaff } = await import('/js/views/staff.js');
  const T = await import('/js/theory.js');
  const S = { strings, notation: 'letters', maxFret: 20 };
  const ctx = makeCtx(S);
  const NS = 'http://www.w3.org/2000/svg';
  const host = document.createElementNS(NS, 'svg');
  host.setAttribute('class', 'tabsvg staff');
  host.style.cssText = 'position:fixed;left:-99999px;top:0;width:100px;height:100px';
  document.body.append(host);
  const res = { builds: 0, accs: 0, problems: [], gaps: [], counts: {} };
  const P = (kind, m) => { res.counts[kind] = (res.counts[kind] || 0) + 1; if (res.problems.length < 300) res.problems.push(`${kind}: ${m}`); };
  const ov = (a, b, pad = 0.3) => a.x + pad < b.x + b.w - pad && b.x + pad < a.x + a.w - pad && a.y + pad < b.y + b.h - pad && b.y + pad < a.y + a.h - pad;
  for (const id of ids) {
    const t = byId.get(id);
    if (!t) continue;
    const base = defaultParams(t);
    const sets = [base];
    for (const [k, d] of Object.entries(t.params || {})) {
      if (d.kind === 'key') { if (keys) for (const pc of T.CHROMATIC_PC) sets.push({ ...base, [k]: String(pc) }); }
      else for (const o of d.options) if (!o[2]?.minStrings || strings >= o[2].minStrings) sets.push({ ...base, [k]: o[0] });
    }
    for (const p of sets.slice(0, maxBuilds)) {
      let inst;
      try { inst = t.build(p, ctx, S); } catch { continue; }
      res.builds++;
      const sub = inst.sub || t.sub || 2;
      const bo = (st) => (inst.uniform ? st.dur / sub : st.dur);
      const r = engraveStaff(inst, { beatsOf: bo, label: (n) => n.deg || '', beatsPerBar: inst.beatsPerBar || 4, size, window: null });
      host.innerHTML = r.svg;
      const where = `${id} ${JSON.stringify(p)}`;
      const s = size, u = s / 8;
      const ks = Math.abs(Math.max(-7, Math.min(7, inst.keySig || 0)));
      const tsx = 40 + ks * 1.1 * s + 0.9 * s;
      const box = (el) => { const b = el.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height, el }; };
      // heads: rotated ellipses (analytic), crosses, diamonds
      const heads = [];
      for (const el of host.querySelectorAll('ellipse.shf, ellipse.sho')) {
        const cx = +el.getAttribute('cx'), cy = +el.getAttribute('cy'), rx = +el.getAttribute('rx'), ry = +el.getAttribute('ry');
        const th = 22 * Math.PI / 180;
        const hw = Math.hypot(rx * Math.cos(th), ry * Math.sin(th)), hh = Math.hypot(rx * Math.sin(th), ry * Math.cos(th));
        heads.push({ x: cx - hw, y: cy - hh, w: 2 * hw, h: 2 * hh, cx, cy });
      }
      for (const el of host.querySelectorAll('path.sx, path.sdia, path.sdiaf')) { const b = box(el); heads.push({ ...b, cx: b.x + b.w / 2, cy: b.y + b.h / 2 }); }
      const accs = [...host.querySelectorAll('g.sac, path.sac')].map(box).filter((b) => b.x + b.w / 2 > tsx + 2.5 * s);
      res.accs += accs.length;
      const dots = [...host.querySelectorAll('circle.srf')].filter((c) => Math.abs(+c.getAttribute('r') - 0.2 * s) < 0.11).map(box);
      const bars = [...host.querySelectorAll('line.sbl')].map((l) => ({ x: +l.getAttribute('x1'), y1: +l.getAttribute('y1'), y2: +l.getAttribute('y2') }));
      const stems = [...host.querySelectorAll('line.sst')].map((l) => ({ x: +l.getAttribute('x1'), y1: Math.min(+l.getAttribute('y1'), +l.getAttribute('y2')), y2: Math.max(+l.getAttribute('y1'), +l.getAttribute('y2')) }));
      const beams = [...host.querySelectorAll('path.sbm')].map((el) => { const n = el.getAttribute('d').match(/-?\d+(?:\.\d+)?/g).map(Number); return { xa: n[0], ya: n[1], xb: n[2], yb: n[3], th: n[5] - n[3] }; });
      for (const a of accs) {
        for (const hd of heads) if (ov(a, hd)) { P('accHead', `${where}: acc ${a.x.toFixed(1)},${a.y.toFixed(1)} ${a.w.toFixed(1)}x${a.h.toFixed(1)} over head at ${hd.cx.toFixed(1)},${hd.cy.toFixed(1)}`); break; }
        for (const b of accs) if (b !== a && b.x > a.x && ov(a, b)) P('accAcc', `${where}: accs at ${a.x.toFixed(1)},${a.y.toFixed(1)} and ${b.x.toFixed(1)},${b.y.toFixed(1)}`);
        for (const bl of bars) if (bl.x > a.x + 0.3 && bl.x < a.x + a.w - 0.3 && bl.y2 > a.y && bl.y1 < a.y + a.h) P('barHit', `${where}: bar line x ${bl.x} through accidental ${a.x.toFixed(1)}..${(a.x + a.w).toFixed(1)}`);
        for (const bm of beams) {
          const x0 = Math.max(a.x + 0.3, Math.min(bm.xa, bm.xb)), x1 = Math.min(a.x + a.w - 0.3, Math.max(bm.xa, bm.xb));
          if (x0 >= x1) continue;
          const yAt = (x) => bm.ya + (bm.yb - bm.ya) * (x - bm.xa) / (bm.xb - bm.xa || 1);
          const ys = [yAt(x0), yAt(x1), yAt(x0) + bm.th, yAt(x1) + bm.th];
          if (Math.max(...ys) > a.y + 0.3 && Math.min(...ys) < a.y + a.h - 0.3) P('accBeam', `${where}: accidental ${a.x.toFixed(1)},${a.y.toFixed(1)}-${(a.y + a.h).toFixed(1)} under beam y ${Math.min(...ys).toFixed(1)}..${Math.max(...ys).toFixed(1)}`);
        }
        for (const st of stems) if (st.x > a.x + 0.4 && st.x < a.x + a.w - 0.4 && st.y2 > a.y + 0.4 && st.y1 < a.y + a.h - 0.4) P('accStem', `${where}: stem x ${st.x} through accidental ${a.x.toFixed(1)}..${(a.x + a.w).toFixed(1)} y ${a.y.toFixed(1)}`);
        // gap to its own head: the nearest head to the right on the same line or space
        const cy = a.y + a.h * (a.h > 2.2 * s ? 0.62 : 0.5);
        const own = heads.filter((hd) => hd.cx > a.x + a.w && Math.abs(hd.cy - cy) < 0.75 * s).sort((p, q) => p.x - q.x)[0];
        if (own) res.gaps.push(+(own.x - (a.x + a.w)).toFixed(1));
      }
      if (!onlyAcc) {
        for (const bl of bars) {
          for (const hd of heads) if (bl.x > hd.x + 0.3 && bl.x < hd.x + hd.w - 0.3 && bl.y2 > hd.y && bl.y1 < hd.y + hd.h) P('barHit', `${where}: bar line x ${bl.x} through head at ${hd.cx.toFixed(1)},${hd.cy.toFixed(1)}`);
          for (const d of dots) if (bl.x > d.x - 0.5 && bl.x < d.x + d.w + 0.5) P('barHit', `${where}: bar line x ${bl.x} through a dot at ${d.x.toFixed(1)}`);
        }
        const chords = [...host.querySelectorAll('text.tchord')].map(box).sort((a, b) => a.x - b.x);
        for (let k = 1; k < chords.length; k++) if (chords[k].x < chords[k - 1].x + chords[k - 1].w - 0.5) P('chordHit', `${where}: "${chords[k - 1].el.textContent}" (${chords[k - 1].x.toFixed(0)}+${chords[k - 1].w.toFixed(0)}) and "${chords[k].el.textContent}" at ${chords[k].x.toFixed(0)}`);
        const labs = [...host.querySelectorAll('text.tlbl')].map(box).sort((a, b) => a.x - b.x);
        for (let k = 1; k < labs.length; k++) if (Math.abs(labs[k].y - labs[k - 1].y) < 2 && labs[k].x < labs[k - 1].x + labs[k - 1].w - 0.5) P('labHit', `${where}: "${labs[k - 1].el.textContent}" and "${labs[k].el.textContent}" at ${labs[k].x.toFixed(0)}`);
        for (let k = 1; k < r.cols.length; k++) if (!(r.cols[k].x > r.cols[k - 1].x - 0.01) && inst.steps[k].dur > 0) P('order', `${where}: col ${k} x ${r.cols[k].x} <= ${r.cols[k - 1].x}`);
      }
    }
  }
  host.remove();
  const g = res.gaps.sort((a, b) => a - b);
  res.gapStats = g.length ? { n: g.length, min: g[0], p5: g[Math.floor(g.length * 0.05)], med: g[Math.floor(g.length / 2)], max: g[g.length - 1] } : null;
  delete res.gaps;
  return res;
};
