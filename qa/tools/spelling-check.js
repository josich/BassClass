// QA (ec02a2d): spelling checks. Paste into the qa server tab.
// window.__scaleCheck(id, typeKey, types, extras, strings): builds an exercise for every scale type x 12 keys
//   (+cycle4) and checks every note: pitch class in the scale, degree label = the formula label,
//   key chip = badge root. Used for sc-exotic, sc-messiaen, md-study (harmonic major modes).
// window.__chordToneSweep(): every exercise x defaults / one option at a time / every prog x 12 keys;
//   flags notes whose degree label is a chord interval of the current chord badge (b3, b10, 3, 5, b7,
//   7, 6, b5, #5, bb7) but whose spelling differs from that interval above the badge root (e.g. the
//   b3 of Abm7 written B). Result in window.__b3.
window.__scaleCheck = async (id, typeKey, types, extras = [{}], strs = [4]) => {
  const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
  const C = await import('/js/curriculum/index.js'); const X = await import('/js/ui/exercise.js');
  const out = []; const t = C.byId.get(id); const keyDef = t.params.key;
  for (const st of strs) {
    const S = { strings: st, notation: 'letters', maxFret: 20, label: 'note' }; const ctx = F.makeCtx(S);
    for (const extra of extras) for (const ty of types) for (const kv of [...Array(12).keys()].map(String).concat(keyDef.cycles ? ['cycle4'] : [])) {
      const p = { ...Object.fromEntries(Object.entries(t.params).map(([a, d]) => [a, d.default])), ...extra, [typeKey]: ty, key: kv };
      const inst = t.build(p, ctx, S); const ivs = T.SCALES[ty].iv; const issues = [];
      let curRoot = kv === 'cycle4' ? null : Number(kv);
      inst.steps.forEach((s, i) => {
        if (s.chord && kv === 'cycle4') curRoot = T.pc(T.N(s.chord.split(' ')[0].replace('♭', 'b').replace('♯', '#')));
        s.notes.forEach((n) => {
          if (T.pc(n.n) !== T.mod(n.midi, 12)) issues.push(`step ${i} name != midi`);
          const off = T.mod(n.midi - curRoot, 12); const k = ivs.findIndex((iv) => T.mod(T.semis(iv), 12) === off);
          if (k < 0) issues.push(`step ${i} not in scale`); else if (n.deg !== T.scaleLabel(ty, k)) issues.push(`step ${i} deg ${n.deg} want ${T.scaleLabel(ty, k)}`);
        });
      });
      if (kv !== 'cycle4') { const label = X.paramOptions(keyDef, S, p).find((o) => o[0] === kv)[1]; const badge = inst.steps.find((s) => s.chord)?.chord.split(' ')[0]; if (label !== badge) issues.push(`label ${label} badge ${badge}`); }
      if (issues.length) out.push(`${id} ${st}str ${JSON.stringify(extra)} ${ty} ${kv}: ${[...new Set(issues)].slice(0, 3).join('; ')}`);
    }
  }
  return out;
};
window.__chordToneSweep = async () => {
  const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js'); const C = await import('/js/curriculum/index.js');
  const S = { strings: 4, notation: 'letters', maxFret: 20, label: 'note' }; const ctx = F.makeCtx(S);
  const DEGIV = { '♭3': 'b3', '♭10': 'b3', '3': '3', '10': '3', '5': '5', '♭7': 'b7', '7': '7', '6': '6', '♭5': 'b5', '♯5': '#5', '♭♭7': 'bb7' };
  const res = {}; let builds = 0;
  for (const t of C.EXERCISES) {
    const keys = Object.keys(t.params || {});
    const combos = [Object.fromEntries(keys.map((k) => [k, t.params[k].default]))];
    for (const k of keys) { const d = t.params[k]; const opts = d.kind === 'key' ? [...Array(12).keys()].map(String) : d.options.map((o) => o[0]); for (const v of opts) combos.push({ ...combos[0], [k]: v }); }
    if (t.params?.prog && t.params?.key) for (const pr of t.params.prog.options.map((o) => o[0])) for (let k = 0; k < 12; k++) combos.push({ ...combos[0], prog: pr, key: String(k) });
    for (const p of combos) {
      let inst; try { inst = t.build(p, ctx, S); } catch { continue; }
      builds++; let root = null;
      inst.steps.forEach((s, i) => {
        if (s.chord) { const m = s.chord.match(/^([A-G])([♭♯]*)/); root = m ? T.N(m[1] + m[2]) : null; }
        if (!root) return;
        for (const n of s.notes) {
          const iv = DEGIV[n.deg]; if (!iv || !n.n) continue;
          const want = T.up(root, iv); if (T.pc(want) !== T.mod(n.midi, 12)) continue;
          if (!T.same(want, n.n)) { const key = `${t.id} deg ${n.deg}`; if (!res[key]) res[key] = { n: 0, ex: `${s.chord || ''} ${JSON.stringify(p)} step ${i}: ${T.noteName(n.n)} should be ${T.noteName(want)}` }; res[key].n++; }
        }
      });
    }
  }
  window.__b3 = { builds, res };
  return window.__b3;
};
