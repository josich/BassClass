// QA user (4c593d9): helpers pasted into the qauser tab (http://localhost:8890). Re-paste after a reload.
// Same core as user11 (Q, groups, brief, shpInst, fingBad, rcheck) plus:
//   songDump(id, part, strings)  every note of a Make Music part: name+octave, degree, string+fret, finger, tag, value
//   songAll(strings)             all 30 studies: per part, the label list and flags (labels "3" over minor chords,
//                                "♭5" spelled ♯4, "♯1", thumb up-up runs, open/fret jumps, span per chord)
//   tagRuns(inst)                consecutive thumb strokes with the same direction (T↑ T↑, T↓ T↓) between pops
//   jumps(inst, n)               moves of n frets or more between consecutive notes
const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
const I = await import('/js/curriculum/index.js'); const D = await import('/js/course/data.js');
const SN = (s, strings = 4) => (strings === 4 ? 'EADG' : strings === 5 ? 'BEADG' : 'BEADGC')[s];
window.Q = {
  T, F, I, D, SN,
  S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
  t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
  b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
  nn(n) { return n ? T.noteName(n) : '?'; },
};
window.groups = (inst) => {
  const out = []; let cur = null;
  for (const st of inst.steps) {
    if (st.chord || st.text || !cur) { cur = { h: `${st.chord ?? ''}${st.text ? '{' + st.text + '}' : ''}`, notes: [] }; out.push(cur); }
    for (const n of st.notes) cur.notes.push({ ...n, dur: st.dur });
  }
  return out;
};
window.brief = (id, p, strings = 4) => groups(Q.b(id, p, { strings })).map((g) => `[${g.h}] ` + g.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}${n.deg ? '(' + n.deg + ')' : ''}@${SN(n.s, strings)}${n.f}f${n.finger}${n.tag ? '<' + n.tag + '>' : ''}`).join(' ')).join(' | ');
window.songDump = (id, part = 'all', strings = 4) => brief(id, { part }, strings);
window.tagRuns = (inst) => {
  const out = []; let last = null; let i = 0;
  for (const st of inst.steps) for (const n of st.notes) {
    i++;
    if (n.tag === 'T↓' || n.tag === 'T↑') { if (last && last.tag === n.tag) out.push(`#${last.i}→#${i} ${n.tag} ${Q.nn(last.n)}@${SN(last.s)}${last.f} then ${Q.nn(n.n)}@${SN(n.s)}${n.f}`); last = { tag: n.tag, i, n: n.n, s: n.s, f: n.f }; }
  }
  return out;
};
window.jumps = (inst, k = 7) => {
  const out = []; let prev = null;
  for (const st of inst.steps) for (const n of st.notes) {
    if (prev && n.f > 0 && prev.f > 0 && Math.abs(n.f - prev.f) >= k) out.push(`${Q.nn(prev.n)}@${SN(prev.s)}${prev.f} → ${Q.nn(n.n)}@${SN(n.s)}${n.f}`);
    if (n.f > 0) prev = n;
  }
  return out;
};
'user12 ready';
// ---- added during the run (paste after the block above)
// jumpsT(inst, k): moves of k frets or more between consecutive fretted notes, with the value of the note before
window.jumpsT = (inst, k = 7) => {
  const out = []; let prev = null;
  for (const st of inst.steps) { for (const n of st.notes) {
    if (prev && n.f > 0 && prev.n0.f > 0 && Math.abs(n.f - prev.n0.f) >= k) out.push(`${Q.nn(prev.n0.n)}@${SN(prev.n0.s)}${prev.n0.f}→${Q.nn(n.n)}@${SN(n.s)}${n.f} (${Math.abs(n.f - prev.n0.f)} frets after a ${+prev.dur.toFixed(3)}-beat note)`);
  } if (st.notes.length) prev = { n0: st.notes[0], dur: st.dur }; }
  return out;
};
// isolated(inst): a note at fret 7+ whose neighbours are open strings or 6+ frets away (e.g. E1 open, E2 at E12, E1 open)
window.isolated = (inst) => { const all = inst.steps.flatMap((s) => s.notes); const out = [];
  all.forEach((n, i) => { if (n.f < 7) return; const a = all[i - 1], b = all[i + 1]; const far = (m) => !m || m.f === 0 || Math.abs(m.f - n.f) >= 6;
    if (far(a) && far(b)) out.push(`${a ? Q.nn(a.n) + '@' + SN(a.s) + a.f : ''} [${Q.nn(n.n)}@${SN(n.s)}${n.f}] ${b ? Q.nn(b.n) + '@' + SN(b.s) + b.f : ''}`); });
  return [...new Set(out)]; };
// oddLabels(): Make Music labels worth a look ("3" over a minor chord, "♯1", "♭5" spelled with ♯, 2/4/6 on a dominant)
window.oddLabels = () => { const out = [];
  for (const t of Q.I.EXERCISES.filter((x) => x.module === 'music')) for (const p of t.params.part.options.map((o) => o[0]).filter((x) => x !== 'all'))
    for (const g of groups(Q.b(t.id, { part: p }))) { const ch = g.h.replace(/\{.*\}/, ''); for (const n of g.notes) { const nm = Q.nn(n.n);
      const odd = (n.deg === '3' && /m/.test(ch) && !/maj/.test(ch)) || n.deg === '♯1' || (n.deg === '♭5' && nm.includes('♯')) || (['2', '4', '6'].includes(n.deg) && /7/.test(ch) && !/m|maj/.test(ch));
      if (odd) out.push(`${t.id} p${p} [${ch}] ${nm} = ${n.deg}`); } }
  return [...new Set(out)]; };
// session pools (writes bassclass.session.v1 / course storage in the qauser tab only):
//   P.setKnown(P.UNITS.map((u) => u.id)) makes a graduate; then plan 40 x 30-min sessions with
//   P.clearSession(); P.setSessionMinutes(30); C.sessionBlock(); P.sessionStore().cur.lists[30].filter((x) => x.warm)
