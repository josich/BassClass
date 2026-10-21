// QA (341ccfe): placement and fingering checker for round 10 (chordShape, emitMixed shapes, in-chord
// shift cost, second placement pass, assignFingers stretch, two-octave arpeggios, groove roots,
// walking registers, slap pop starts). Paste into the qa tab, then:
//   window.__pc10({ strings: 4, cap: 120, ids: null }) -> progress in window.__pc (async, yields)
// Every build is read as a line of single-note steps (rests skipped, ghost notes kept); chord
// segments start at each step with a chord badge. Metrics (counts + up to 8 samples each, plus
// per-exercise counts):
//  three/string   : a chord segment plays 3+ distinct pitches on one string
//  twoPlaces      : a pitch at two different string/fret places inside one chord segment
//  inChordShift   : inside a chord segment the index-finger fret (f - finger + 1) moves 2+ frets
//  chordSpan5     : a chord segment's fretted notes span 5+ frets (shape exercises)
//  jump10         : consecutive notes on one string 10+ frets apart
//  leap>8ve       : consecutive notes more than 12 semitones apart
//  finger         : finger outside 0-4, open note with a finger, fretted note with finger 0
//  overMax        : fret above the highest-fret setting while the build does not flag overFret
//  stretchShift   : a stretch note (finger 1 one fret below / 4 one fret above the hand) followed
//                   by a note that leaves both the old hand and the stretch (a shift after all)
//  sameFingerSlide: same finger, same string, consecutive notes 3+ frets apart (a slide)
//  slap:*         : pop below D, pop on the thumb's string, H/PO not on the same string or wrong
//                   direction, thumb starting an H/PO run on D/G (should be a pop), thumb on low B
//                   when E has the note, thumb on D/G (ratio)
//  rootLeap>8ve   : grooves/harmony patterns: chord roots (first note of a segment tagged R) more
//                   than 12 semitones apart
//  walkHigh       : walking: notes above G3 (midi 55)
window.__pc10 = async ({ strings = 4, cap = 120, ids = null, modules = null, maxFret = 20, seed = 7, keys = null } = {}) => {
  const F = await import('/js/fretboard.js');
  const C = await import('/js/curriculum/common.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  const S = { strings, notation: 'letters', maxFret };
  const ctx = F.makeCtx(S);
  const res = { strings, builds: 0, notes: 0, counts: {}, per: {}, samples: {}, at: '', done: false, t0: Date.now(), errs: [] };
  window.__pc = res;
  let rs = seed;
  const rnd = () => { rs |= 0; rs = (rs + 0x6d2b79f5) | 0; let t = Math.imul(rs ^ (rs >>> 15), 1 | rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const add = (k, id, m) => {
    res.counts[k] = (res.counts[k] || 0) + 1;
    res.per[k] = res.per[k] || {}; res.per[k][id] = (res.per[k][id] || 0) + 1;
    res.samples[k] = res.samples[k] || [];
    if (res.samples[k].length < 8 && !res.samples[k].some((x) => x.startsWith(id + ' '))) res.samples[k].push(m);
  };
  const nm = (n) => (n ? 'CDEFGAB'[n.l] + (n.a > 0 ? '#'.repeat(n.a) : 'b'.repeat(-n.a)) : '?');
  const sn = ctx.names || [];
  const at = (n) => `${nm(n.n)}${n.midi}@${sn[n.s] ?? n.s}${n.f}${n.finger != null ? '/' + n.finger : ''}${n.tag ? '[' + n.tag + ']' : ''}`;
  const popLo = Math.max(ctx.str('E') + 1, ctx.str('D'));
  const eStr = Math.max(0, ctx.str('E'));
  const list = EXERCISES.filter((t) => (ids ? ids.includes(t.id) : true) && (modules ? modules.includes(t.module) : true));
  for (const t of list) {
    res.at = t.id;
    const pk = Object.keys(t.params || {});
    const kk = pk.find((k) => t.params[k].kind === 'key');
    const sels = pk.filter((k) => k !== kk);
    const optsOf = (k) => t.params[k].options.filter((o) => !o[2]?.minStrings || strings >= o[2].minStrings).map((o) => o[0]);
    let combos = [{}];
    for (const k of sels) { const nx = []; for (const c of combos) for (const v of optsOf(k)) nx.push({ ...c, [k]: v }); combos = nx; if (combos.length > 20000) break; }
    if (combos.length > cap) {
      const base = Object.fromEntries(sels.map((k) => [k, t.params[k].default]));
      const keep = [base];
      sels.forEach((k) => optsOf(k).forEach((v) => keep.push({ ...base, [k]: v })));
      while (keep.length < cap) keep.push(combos[Math.floor(rnd() * combos.length)]);
      combos = keep.slice(0, Math.max(cap, keep.length));
    }
    const keyVals = kk ? (keys || [...Array(12).keys()].map(String).concat(t.params[kk].cycles ? C.CYCLE_OPTS.map((o) => o[0]) : [])) : [null];
    for (const c0 of combos) for (const kv of keyVals) {
      const p = { ...Object.fromEntries(pk.map((k) => [k, t.params[k].default])), ...c0, ...(kk ? { [kk]: kv } : {}) };
      let inst;
      try { inst = t.build(p, ctx, S); } catch (e) { res.errs.push(`${t.id} ${JSON.stringify(p)} ${e.message}`); continue; }
      res.builds++;
      const tag = `${t.id} ${JSON.stringify(p)}`;
      const seq = []; let ci = -1, chord = '';
      inst.steps.forEach((st, i) => {
        if (st.chord) { ci++; chord = String(st.chord); }
        if (st.rest || !st.notes.length) return;
        for (const n of st.notes) {
          if (n.finger != null && (n.finger < 0 || n.finger > 4 || (n.f === 0 && n.finger !== 0 && !st.notes[0].play) || (n.f > 0 && n.finger === 0))) add('finger', t.id, `${tag} step ${i} ${at(n)}`);
          if (n.f > maxFret && !inst.overFret) add('overMax', t.id, `${tag} step ${i} ${at(n)}`);
        }
        if (st.notes.length === 1) seq.push({ i, n: st.notes[0], ci, chord, ghost: st.notes[0].tag === 'x' });
      });
      res.notes += seq.length;
      // line metrics
      for (let j = 1; j < seq.length; j++) {
        const a = seq[j - 1].n, b = seq[j].n;
        if (a.s === b.s && Math.abs(a.f - b.f) >= 10) add('jump10', t.id, `${tag} step ${seq[j].i} ${at(a)} -> ${at(b)}`);
        if (Math.abs(a.midi - b.midi) > 12) add('leap>8ve', t.id, `${tag} step ${seq[j].i} ${at(a)} -> ${at(b)}`);
        if (a.f > 0 && b.f > 0 && a.s === b.s && a.finger != null && a.finger === b.finger && Math.abs(a.f - b.f) >= 3 && !a.tag && !b.tag) add('sameFingerSlide', t.id, `${tag} step ${seq[j].i} ${at(a)} -> ${at(b)}`);
      }
      // stretches followed by a shift elsewhere
      for (let j = 1; j + 1 < seq.length; j++) {
        const a = seq[j - 1].n, s = seq[j].n, c = seq[j + 1].n;
        if (!(a.f > 0 && s.f > 0 && c.f > 0) || a.finger == null || s.finger == null || c.finger == null) continue;
        const B = a.f - a.finger + 1;
        const isStretch = (s.finger === 1 && s.f === B - 1) || (s.finger === 4 && s.f === B + 4);
        if (!isStretch) continue;
        const Bc = c.f - c.finger + 1, Bs = s.f - s.finger + 1;
        if (Bc !== B && Bc !== Bs) add('stretchShift', t.id, `${tag} step ${seq[j].i} ${at(a)} ${at(s)} ${at(c)}`);
      }
      // per chord segment
      if (inst.steps.some((st) => st.chord)) {
        const segs = new Map();
        for (const x of seq) { if (x.ci < 0) continue; if (!segs.has(x.ci)) segs.set(x.ci, []); segs.get(x.ci).push(x); }
        for (const [, xs] of segs) {
          const ns = xs.filter((x) => !x.ghost).map((x) => x.n);
          if (ns.length < 2) continue;
          const lbl = `${tag} [${xs[0].chord}] step ${xs[0].i}`;
          const byS = new Map();
          for (const n of ns) { if (!byS.has(n.s)) byS.set(n.s, new Set()); byS.get(n.s).add(n.midi); }
          for (const [s, set] of byS) if (set.size >= 3) { add('three/string', t.id, `${lbl}: ${ns.map(at).join(' ')}`); break; }
          const place = new Map();
          let two = false;
          for (const n of ns) { const k = `${n.s}|${n.f}`; if (!place.has(n.midi)) place.set(n.midi, k); else if (place.get(n.midi) !== k) two = true; }
          if (two) add('twoPlaces', t.id, `${lbl}: ${ns.map(at).join(' ')}`);
          const fr = ns.filter((n) => n.f > 0 && n.finger > 0);
          for (let j = 1; j < fr.length; j++) {
            const b0 = fr[j - 1].f - fr[j - 1].finger + 1, b1 = fr[j].f - fr[j].finger + 1;
            if (Math.abs(b1 - b0) >= 2) { add('inChordShift', t.id, `${lbl}: ${ns.map(at).join(' ')}`); break; }
          }
          if (fr.length) { const f = fr.map((n) => n.f); if (Math.max(...f) - Math.min(...f) >= 5) add('chordSpan5', t.id, `${lbl}: ${ns.map(at).join(' ')}`); }
        }
        // chord roots
        if (['grooves', 'harmony'].includes(t.module)) {
          let prevR = null;
          for (const [, xs] of segs) {
            const r = xs.find((x) => x.n.deg === 'R');
            if (!r) continue;
            if (prevR && Math.abs(r.n.midi - prevR.n.midi) > 12) add('rootLeap>8ve', t.id, `${tag} ${prevR.chord}:${at(prevR.n)} -> ${r.chord}:${at(r.n)}`);
            prevR = r;
          }
        }
      }
      if (t.module === 'walking') for (const x of seq) if (x.n.midi > 55) add('walkHigh', t.id, `${tag} step ${x.i} ${at(x.n)}`);
      // slap
      if (seq.some((x) => x.n.tag && x.n.tag.startsWith('T'))) {
        let thumbs = 0;
        for (let j = 0; j < seq.length; j++) {
          const n = seq[j].n, pv = j > 0 ? seq[j - 1].n : null, nx = seq[j + 1]?.n;
          const tg = n.tag || '';
          if (tg.startsWith('T')) {
            thumbs++;
            if (n.s >= popLo) add('slap:thumbOnPopString', t.id, `${tag} step ${seq[j].i} ${pv ? at(pv) : ''} ${at(n)} ${nx ? at(nx) : ''}`);
            if (n.s < eStr && n.midi >= ctx.tuning[eStr] && n.midi - ctx.tuning[eStr] <= maxFret) add('slap:thumbLowB', t.id, `${tag} step ${seq[j].i} ${at(n)}`);
            if (n.s >= popLo && nx && (nx.tag === 'H' || nx.tag === 'PO') && nx.s === n.s && !(pv && (pv.tag?.startsWith('T') || pv.tag === 'x') && pv.s === n.s)) add('slap:thumbStartsRunOnPopString', t.id, `${tag} step ${seq[j].i} ${pv ? at(pv) : ''} ${at(n)} ${at(nx)}`);
          }
          if (tg === 'P') {
            if (n.s < popLo) add('slap:popLow', t.id, `${tag} step ${seq[j].i} ${at(n)}`);
            if (pv && (pv.tag?.startsWith('T') || pv.tag === 'x') && pv.s === n.s) add('slap:popOnThumbString', t.id, `${tag} step ${seq[j].i} ${at(pv)} ${at(n)}`);
          }
          if ((tg === 'H' || tg === 'PO') && pv) {
            if (pv.s !== n.s || (tg === 'H' ? n.midi <= pv.midi : n.midi >= pv.midi)) add('slap:hammerWrong', t.id, `${tag} step ${seq[j].i} ${at(pv)} ${at(n)}`);
          }
        }
        res.counts['slap:thumbs'] = (res.counts['slap:thumbs'] || 0) + thumbs;
      }
      if (res.builds % 40 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }
  res.done = true; res.ms = Date.now() - res.t0;
  return res;
};
