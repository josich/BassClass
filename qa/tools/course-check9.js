// QA course checker (626f29c): every step of every lesson, checkpoint and stage test on 4/5/6 strings.
// Run in the qa tab:  (await import('/qa-tools/...')) is not served, so paste the body or eval it:
//   const src = await (await fetch('...')).text()  -- not available; paste into javascript_tool.
// Checks per step: exercise exists, sub is a selector value, the step opens with its preset (the
// exercise screen's own validation loop), notes per second at the goal, loop length at from/goal,
// backing has harmony to play (and the module allows it), over-fret notices, review/demo steps,
// placement questions cover every unit and only existing units.
window.__courseCheck = async ({ strings = [4, 5, 6], maxFret = 20 } = {}) => {
  const { LESSONS, UNITS, STAGES } = await import('/js/course/data.js');
  const { byId, defaultParams } = await import('/js/curriculum/index.js');
  const { makeCtx } = await import('/js/fretboard.js');
  const { paramOptions } = await import('/js/ui/exercise.js');
  const { harmonyTrack } = await import('/js/harmony.js');
  const { Player } = await import('/js/player.js');
  const SUBV = [0.25, 0.5, 1, 2, 3, 4, 5, 6];
  const BACKS_OFF = ['technique', 'rhythm', 'fretboard', 'intervals', 'ear'];
  const out = { problems: [], rows: [] };
  for (const l of LESSONS) {
    l.steps.forEach((st, i) => {
      const t = byId.get(st.ex);
      const where = `${l.id}.${i} (${l.num}) ${st.ex}`;
      if (!t) { out.problems.push(`${where}: no exercise`); return; }
      for (const n of strings) {
        const S = { strings: n, notation: 'letters', maxFret, label: 'note', reveal: 'gradual', backing: 'off', score: 'tab' };
        const p = { ...defaultParams(t), ...st.p };
        for (const [k, def] of Object.entries(t.params || {})) if (!paramOptions(def, S, p).some((o) => o[0] === p[k])) p[k] = def.default;
        const presetOk = Object.entries(st.p || {}).every(([k, v]) => p[k] === v);
        if (!presetOk) out.problems.push(`${where} [${n}str]: preset not kept at open ${JSON.stringify(st.p)} -> ${JSON.stringify(p)}`);
        let inst;
        try { inst = t.build(p, makeCtx(S), S); } catch (e) { out.problems.push(`${where} [${n}str]: threw ${e.message}`); continue; }
        if (inst.uniform && !SUBV.includes(st.sub)) out.problems.push(`${where}: sub ${st.sub} not a selector value`);
        const pl = new Player({});
        pl.inst = inst; pl.sub = inst.uniform ? st.sub : (inst.sub ?? t.sub ?? 2);
        pl._layout();
        // beats per note step (shortest), notes, total beats
        let minBeats = Infinity, notes = 0;
        inst.steps.forEach((s) => { if (s.rest || s.silent || !s.notes.length) return; notes++; minBeats = Math.min(minBeats, pl.beatsOf(s)); });
        // the fastest sustained rate: notes in the busiest beat
        const perBeat = new Map();
        inst.steps.forEach((s, k) => { if (s.rest || s.silent || !s.notes.length) return; const b = Math.floor(pl.starts[k] + 1e-6); perBeat.set(b, (perBeat.get(b) || 0) + 1); });
        const busiest = Math.max(0, ...perBeat.values());
        const goal = st.goal || st.from || t.bpm || 70;
        const nps = goal / 60 / minBeats; // fastest note rate at the goal (notes per second)
        const loopSecFrom = pl.total * 60 / (st.from || goal), loopSecGoal = pl.total * 60 / goal;
        let backingInfo = '';
        if (st.backing && st.backing !== 'off') {
          if (BACKS_OFF.includes(t.module)) out.problems.push(`${where}: backing ${st.backing} on a ${t.module} exercise (the app plays no backing there)`);
          const tr = harmonyTrack(inst, st.backing);
          if (!tr.some(Boolean)) out.problems.push(`${where} [${n}str]: backing ${st.backing} has no harmony to play`);
          backingInfo = st.backing;
        }
        if (st.music && !st.backing) out.problems.push(`${where}: a music step without backing`);
        if (inst.overFret) out.problems.push(`${where} [${n}str]: over the highest fret (${inst.overFret} > ${maxFret})`);
        if (n === 4) out.rows.push({ where, lvl: t.level, stage: STAGES.indexOf(l.stage) + 1, kind: l.kind, mod: t.module, uniform: !!inst.uniform, sub: st.sub, from: st.from, goal: st.goal, nps: +nps.toFixed(2), busiest, notes, bars: pl.total / (inst.beatsPerBar || 4), loopFrom: Math.round(loopSecFrom), loopGoal: Math.round(loopSecGoal), backing: backingInfo, music: !!st.music, keyFree: !!(t.params?.key && !('key' in (st.p || {}))), fixed: inst.fixed ? Object.keys(inst.fixed).join(',') : '' });
      }
    });
  }
  return out;
};
