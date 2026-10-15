// QA: extended build sweep (paste into the qa server tab). Every exercise x 4/5/6 strings x max fret
// 17/20/21/24 x (defaults, one param varied at a time, N random mixes). Runs in the background;
// result in window.__sweep. Checks: fret above the max without an overFret notice, fret > 24,
// fingers 0-4 (0 only on open strings), spelling vs MIDI, string/fret vs MIDI, two notes on one
// string in a step, double-stop span, bad durations, missing/odd degree labels, double accidentals.
window.__runSweep = async ({ randoms = 12, strings = [4, 5, 6], frets = [17, 20, 21, 24], seed = 11 } = {}) => {
  const T = await import('/js/theory.js');
  const F = await import('/js/fretboard.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  let s0 = seed;
  const rnd = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  const res = { builds: 0, notes: 0, issues: {}, dbl: {}, overFret: {}, silentOver: {}, bars: {}, t0: Date.now(), done: false };
  window.__sweep = res;
  const add = (bucket, key, sample) => { const b = res[bucket]; if (!b[key]) b[key] = { n: 0, sample }; b[key].n++; };
  const combos = (params) => {
    const keys = Object.keys(params);
    const opts = keys.map((k) => {
      const d = params[k];
      if (d.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(d.cycles ? ['cycle4', 'cycle5', 'chromatic'] : [])];
      return d.options.map((o) => o[0]);
    });
    const base = Object.fromEntries(keys.map((k) => [k, params[k].default]));
    const out = [base];
    keys.forEach((k, i) => opts[i].forEach((v) => out.push({ ...base, [k]: v })));
    for (let r = 0; r < randoms; r++) out.push(Object.fromEntries(keys.map((k, i) => [k, opts[i][Math.floor(rnd() * opts[i].length)]])));
    return out;
  };
  let lastYield = performance.now();
  for (const st of strings) for (const maxFret of frets) {
    const S = { strings: st, notation: 'letters', maxFret, label: 'note' };
    const ctx = F.makeCtx(S);
    for (const t of EXERCISES) {
      for (const p of combos(t.params || {})) {
        if (performance.now() - lastYield > 200) { await new Promise((r) => setTimeout(r, 0)); lastYield = performance.now(); }
        let inst;
        const tag = `${t.id} ${st}str max${maxFret} ${JSON.stringify(p)}`;
        try { inst = t.build(p, ctx, S); } catch (e) { add('issues', `${t.id}: threw ${e.message}`, tag); continue; }
        res.builds++;
        if (!inst?.steps?.length) { add('issues', `${t.id}: empty`, tag); continue; }
        let hi = 0, sum = 0;
        inst.steps.forEach((step, i) => {
          if (!(step.dur > 0) || !Number.isFinite(step.dur)) add('issues', `${t.id}: bad dur`, `${tag} step ${i} dur ${step.dur}`);
          sum += step.dur;
          const onStr = new Set();
          const fr = [];
          for (const n of step.notes) {
            res.notes++;
            hi = Math.max(hi, n.f);
            if (n.f > 24) add('issues', `${t.id}: fret ${n.f} > 24`, tag);
            if (ctx.tuning[n.s] + n.f !== n.midi) add('issues', `${t.id}: midi/string mismatch`, `${tag} step ${i}`);
            if (!n.n || T.pc(n.n) !== T.mod(n.play ?? n.midi, 12)) add('issues', `${t.id}: spelling vs midi`, `${tag} step ${i} ${n.n && T.noteName(n.n)} ${n.midi}`);
            if (!(n.finger >= 0 && n.finger <= 4) || (n.f > 0 && n.finger === 0)) add('issues', `${t.id}: finger ${n.finger} on fret ${n.f}`, `${tag} step ${i}`);
            if (onStr.has(n.s)) add('issues', `${t.id}: two notes on one string`, `${tag} step ${i}`);
            onStr.add(n.s);
            if (n.f > 0) fr.push(n.f);
            if (n.n && Math.abs(n.n.a) > 1) add('dbl', `${t.id}`, `${tag} step ${i} ${T.noteName(n.n)}`);
            if (n.deg === undefined || n.deg === null || /NaN|undefined|·/.test(String(n.deg))) add('issues', `${t.id}: odd deg "${n.deg}"`, `${tag} step ${i} ${n.n && T.noteName(n.n)}`);
          }
          if (fr.length > 1 && Math.max(...fr) - Math.min(...fr) > 4) add('issues', `${t.id}: double-stop span ${Math.max(...fr) - Math.min(...fr)}`, `${tag} step ${i}`);
        });
        if (hi > maxFret) {
          if (!inst.overFret) add('silentOver', `${t.id} ${st}str max${maxFret}`, `${tag} hi ${hi}`);
          else add('overFret', `${t.id} ${st}str max${maxFret}`, `hi ${hi}`);
        }
        if (!inst.uniform) {
          const bpb = inst.beatsPerBar || 4;
          if (Math.abs(sum / bpb - Math.round(sum / bpb)) > 1e-6) add('bars', `${t.id}`, `${tag} sum ${sum} bpb ${bpb}`);
        }
      }
    }
  }
  res.done = true;
  res.ms = Date.now() - res.t0;
  return res;
};
