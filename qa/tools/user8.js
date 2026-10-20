// QA user (91ad82b): helpers pasted into the qauser tab (http://127.0.0.1:8890). Re-paste after a reload.
// Q.b(id|num, params, settings) builds an exercise like the app; Q.dump(inst) prints notes, strings, frets,
// fingers, degrees and tags. courseDump() builds every course step (4-string, the step's preset over the
// exercise defaults) and returns one line per step; courseTempos() lists the subdivision the step opens
// with, the fastest notes per second at the goal tempo and the loop length.
const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
const I = await import('/js/curriculum/index.js'); const D = await import('/js/course/data.js');
window.Q = {
  T, F, I, D,
  S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
  t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
  b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
  nn(n) { return n ? T.noteName(n) : '?'; },
  dump(inst, { max = 400, fing = true } = {}) {
    return inst.steps.slice(0, max).map((st) => {
      let s = '';
      if (st.chord) s += `[${st.chord}] `;
      if (st.text) s += `{${st.text}} `;
      if (st.rest) s += 'r';
      s += st.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}@${n.s}:${n.f}${fing ? 'f' + n.finger : ''}${n.deg != null ? '=' + n.deg : ''}${n.tag ? '<' + n.tag + '>' : ''}`).join('+');
      return `${s} d${+(+st.dur).toFixed(3)}`;
    }).join(' | ');
  },
};
window.courseDump = (strings = 4) => D.LESSONS.flatMap((l) => l.steps.map((s, i) => {
  const t = Q.t(s.ex);
  return `## ${l.num} ${l.id}.${i} #${t.num} ${s.ex} ${JSON.stringify(s.p)} ${s.from}->${s.goal}\n   ${Q.dump(Q.b(s.ex, s.p, { strings }), { max: 48 })}`;
})).join('\n');
window.courseTempos = () => D.LESSONS.flatMap((l) => l.steps.map((s, i) => {
  if (!s.goal) return null;
  const t = Q.t(s.ex); const inst = Q.b(s.ex, s.p);
  const sub = inst.uniform ? (inst.sub ?? t.sub ?? 2) : null;
  const len = (st) => (inst.uniform ? st.dur / sub : +st.dur);
  const beats = inst.steps.reduce((a, st) => a + len(st), 0);
  const fastest = Math.min(...inst.steps.filter((st) => st.notes.length).map(len));
  return `${l.num} ${l.id}.${i} #${t.num} sub=${sub ?? 'written'} goal ${s.goal} fastest ${((s.goal / 60) / fastest).toFixed(1)} n/s loop ${(beats * 60 / s.goal).toFixed(0)}s`;
}).filter(Boolean)).join('\n');
