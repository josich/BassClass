// QA (4c593d9): checker for the exercises added in this round (Make Music `mm-*`, `tech-sweep`,
// `tech-tapping`). Paste into a qa tab (top-level await), then `await window.__new12()`.
// For every option combination (every key, every part) on 4/5/6 strings and every "Highest fret used"
// (17/20/21/24) it builds the exercise and checks:
//  - the build does not throw; every note: string, fret 0..maxFret (or overFret set), tuning+fret = midi,
//    spelling = sounding pitch class, a label (deg) on every sounding note;
//  - fingers: 0-4, or i/m/a on right-hand taps (RH) only;
//  - written rhythm: the total is whole bars of the exercise's metre; chords start on a step;
//  - tech-sweep: every chord a one-note-per-string shape on adjacent strings, ↓ going up and ↑ coming
//    down with a pick; the shape's notes inside one 4-fret hand;
//  - tech-tapping: the triplet cell on one string (RH above PO above...), PO lands lower and H higher on
//    the same string as the note before; RH taps above every LH note of the cell on the same string.
window.__new12 = async ({ strings = [4, 5, 6], frets = [17, 20, 21, 24] } = {}) => {
  const { EXERCISES, defaultParams } = await import('/js/curriculum/index.js');
  const { makeCtx } = await import('/js/fretboard.js');
  const T = await import('/js/theory.js');
  const list = EXERCISES.filter((t) => t.module === 'music' || t.id === 'tech-sweep' || t.id === 'tech-tapping');
  const res = { builds: 0, notes: 0, problems: [], over: [], perEx: {} };
  const bad = (m) => { if (res.problems.length < 400) res.problems.push(m); };
  const combos = (t, n) => {
    const keys = Object.keys(t.params || {});
    const opts = keys.map((k) => {
      const d = t.params[k];
      if (d.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(d.cycles ? ['cycle4'] : [])];
      return d.options.filter((o) => !o[2]?.minStrings || n >= o[2].minStrings).map((o) => o[0]);
    });
    let out = [{}];
    keys.forEach((k, i) => { out = out.flatMap((o) => opts[i].map((v) => ({ ...o, [k]: v }))); });
    return out;
  };
  for (const t of list) {
    res.perEx[t.id] = { builds: 0, over: 0, maxF: 0 };
    for (const n of strings) for (const mf of frets) {
      const S = { strings: n, notation: 'letters', maxFret: mf };
      const ctx = makeCtx(S);
      for (const p0 of combos(t, n)) {
        const p = { ...defaultParams(t), ...p0 };
        const where = `${t.id} [${n}str f${mf}] ${JSON.stringify(p0)}`;
        let inst;
        try { inst = t.build(p, ctx, S); } catch (e) { bad(`${where}: threw ${e.message}`); continue; }
        res.builds++; res.perEx[t.id].builds++;
        if (inst.overFret) { res.perEx[t.id].over++; if (res.over.length < 60) res.over.push(`${where}: overFret ${inst.overFret}`); }
        let total = 0, top = 0;
        inst.steps.forEach((st, i) => {
          total += st.dur;
          if (st.notes.length > 1 && new Set(st.notes.map((x) => x.s)).size < st.notes.length) bad(`${where} step ${i}: two notes on one string`);
          for (const x of st.notes) {
            res.notes++;
            top = Math.max(top, x.f);
            if (x.s < 0 || x.s >= ctx.tuning.length) bad(`${where} step ${i}: string ${x.s}`);
            if (!(x.f >= 0 && x.f <= 24)) bad(`${where} step ${i}: fret ${x.f}`);
            if (x.f > mf && !inst.overFret) bad(`${where} step ${i}: fret ${x.f} above ${mf} without notice`);
            if (ctx.tuning[x.s] + x.f !== x.midi) bad(`${where} step ${i}: midi ${x.midi} vs ${ctx.tuning[x.s]}+${x.f}`);
            if (!x.n || T.pc(x.n) !== T.mod(x.play ?? x.midi, 12)) bad(`${where} step ${i}: spelling ${x.n && T.noteName(x.n)} vs ${x.midi}`);
            if (!st.rest && !st.silent && (x.deg == null || x.deg === '')) bad(`${where} step ${i}: no label`);
            const fg = x.finger;
            if (typeof fg === 'string') { if (!['i', 'm', 'a'].includes(fg) || x.tag !== 'RH') bad(`${where} step ${i}: finger ${fg} tag ${x.tag}`); }
            else if (!(Number.isInteger(fg) && fg >= 0 && fg <= 4)) bad(`${where} step ${i}: finger ${fg}`);
            else if (fg === 0 && x.f > 0) bad(`${where} step ${i}: finger 0 on fret ${x.f}`);
            else if (fg > 0 && x.f === 0) bad(`${where} step ${i}: finger ${fg} on an open string`);
          }
        });
        res.perEx[t.id].maxF = Math.max(res.perEx[t.id].maxF, top);
        if (!inst.uniform) {
          const bpb = inst.beatsPerBar || 4;
          if (Math.abs(total / bpb - Math.round(total / bpb)) > 1e-6) bad(`${where}: ${total} beats is not whole bars of ${bpb}`);
        }
        if (!inst.steps[0].chord && t.module === 'music') bad(`${where}: no chord on the first step`);
        // tech-sweep shape checks
        if (t.id === 'tech-sweep') {
          let grp = [];
          const flush = () => {
            if (!grp.length) return;
            const ns = grp.map((s) => s.notes[0]);
            const strs = [...new Set(ns.map((x) => x.s))].sort((a, b) => a - b);
            for (let k = 1; k < strs.length; k++) if (strs[k] !== strs[k - 1] + 1) bad(`${where} chord ${grp[0].chord}: strings not adjacent ${strs}`);
            const bySt = new Map();
            for (const x of ns) { if (bySt.has(x.s) && bySt.get(x.s) !== x.f) bad(`${where} chord ${grp[0].chord}: two frets on string ${x.s}`); bySt.set(x.s, x.f); }
            const fr = ns.filter((x) => x.f > 0).map((x) => x.f);
            if (fr.length && Math.max(...fr) - Math.min(...fr) > 4) bad(`${where} chord ${grp[0].chord}: span ${Math.min(...fr)}-${Math.max(...fr)}`);
            if (p.hand === 'pick') ns.forEach((x, j) => { if (j === 0) return; const want = x.s > ns[j - 1].s ? '↓' : '↑'; if (x.tag !== want) bad(`${where} chord ${grp[0].chord} note ${j}: ${x.tag} (string ${ns[j - 1].s}→${x.s})`); });
            const beats = grp.reduce((a, s) => a + s.dur, 0);
            if (Math.abs(beats - Math.round(beats)) > 1e-6) bad(`${where} chord ${grp[0].chord}: ${beats} beats`);
            grp = [];
          };
          for (const st of inst.steps) { if (st.chord) flush(); grp.push(st); }
          flush();
        }
        if (t.id === 'tech-tapping') {
          const ns = inst.steps.map((s) => s.notes[0]);
          ns.forEach((x, j) => {
            if (j === 0) return;
            const pr = ns[j - 1];
            if (x.tag === 'PO' && !(x.s === pr.s && x.f < pr.f)) bad(`${where} note ${j}: PO from ${pr.s}/${pr.f} to ${x.s}/${x.f}`);
            if (x.tag === 'H' && !(x.s === pr.s && x.f > pr.f)) bad(`${where} note ${j}: H from ${pr.s}/${pr.f} to ${x.s}/${x.f}`);
          });
          // a right-hand tap above the left hand's notes on the same string (within one chord)
          let grp = [];
          const flush = () => {
            const lh = grp.filter((x) => x.tag !== 'RH'), rh = grp.filter((x) => x.tag === 'RH');
            for (const r of rh) for (const l of lh) if (l.s === r.s && l.f >= r.f) bad(`${where}: RH tap ${r.s}/${r.f} at or below LH ${l.s}/${l.f}`);
            // the left hand's notes in one 4-fret position
            const lf = lh.filter((x) => x.f > 0).map((x) => x.f);
            if (lf.length && Math.max(...lf) - Math.min(...lf) > 4) bad(`${where}: LH span ${Math.min(...lf)}-${Math.max(...lf)}`);
            grp = [];
          };
          inst.steps.forEach((s) => { if (s.chord) flush(); grp.push(s.notes[0]); });
          flush();
        }
      }
    }
  }
  return res;
};
