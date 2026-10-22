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
