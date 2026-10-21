// QA user (626f29c): helpers pasted into the qauser tab (http://127.0.0.1:8890). Re-paste after a reload.
// Same Q as user8.js, plus:
//   cd(filter, max, strings)  dump every step of the lessons that match `filter` (notes, string:fret, finger, degree, tags)
//   brief2(filter, max)       the same, grouped by chord badge / text, note names and degrees only
//   lk(id, params)            one lick with its durations
//   span(lessonId, step)      lowest/highest fret of a step and the biggest fret jump between consecutive notes
//   dupes()                   course steps (any lesson) that play exactly the same notes, strings, frets and durations
//   formBeats(id, params)     each chord badge with the beats it lasts (checks forms: blues, Giant Steps…)
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
window.cd = (filter, max = 24, strings = 4) => D.LESSONS.filter(filter).flatMap((l) => l.steps.map((s, i) => {
  const t = Q.t(s.ex); const inst = Q.b(s.ex, s.p, { strings });
  return `## ${l.num} ${l.id}.${i} #${t.num} ${s.ex} ${JSON.stringify(s.p)} sub${s.sub ?? '-'} ${s.from}->${s.goal ?? '-'}\n   ${Q.dump(inst, { max })}`;
})).join('\n');
window.brief2 = (filter, max, strings = 4) => D.LESSONS.filter(filter).flatMap((l) => l.steps.map((s, i) => {
  const inst = Q.b(s.ex, s.p, { strings }); const labs = []; let cur = null;
  for (const st of inst.steps) {
    if (st.chord || st.text) { cur = { h: `${st.chord ?? ''}${st.text ? ' {' + st.text + '}' : ''}`, n: [] }; labs.push(cur); }
    if (!cur) { cur = { h: '', n: [] }; labs.push(cur); }
    cur.n.push(st.rest ? 'r' : st.notes.map((n) => `${Q.nn(n.n)}${n.deg != null ? '(' + n.deg + ')' : ''}`).join('+'));
  }
  return `## ${l.num} ${l.id}.${i} ${s.ex} ${JSON.stringify(s.p)}\n   ${labs.slice(0, max).map((x) => `[${x.h}] ${x.n.join(' ')}`).join(' | ')}`;
})).join('\n');
window.lk = (id, p) => {
  const inst = Q.b(id, p); const labs = []; let cur = null;
  for (const st of inst.steps) {
    if (st.chord || st.text) { cur = { h: `${st.chord ?? ''}${st.text ? ' {' + st.text + '}' : ''}`, n: [] }; labs.push(cur); }
    if (!cur) { cur = { h: '', n: [] }; labs.push(cur); }
    cur.n.push(st.rest ? `r${+(+st.dur).toFixed(2)}` : st.notes.map((n) => `${Q.nn(n.n)}(${n.deg ?? ''})${+(+st.dur).toFixed(2)}`).join('+'));
  }
  return `${id} ${JSON.stringify(p)}\n   ${labs.map((x) => `[${x.h}] ${x.n.join(' ')}`).join(' | ')}`;
};
window.span = (lid, i) => {
  const l = D.lessonById.get(lid); const s = l.steps[i]; const inst = Q.b(s.ex, s.p);
  const fr = inst.steps.flatMap((st) => st.notes.map((n) => n.f)).filter((f) => f > 0);
  let maxJump = 0; let at = ''; let prev = null;
  for (const st of inst.steps) for (const n of st.notes) {
    if (n.f > 0 && prev && Math.abs(n.f - prev.f) > maxJump) { maxJump = Math.abs(n.f - prev.f); at = `${Q.nn(prev.n)}@${'EADG'[prev.s]}${prev.f}→${Q.nn(n.n)}@${'EADG'[n.s]}${n.f}`; }
    if (n.f > 0) prev = n;
  }
  return `${l.num} ${lid}.${i}: frets ${Math.min(...fr)}–${Math.max(...fr)}, biggest jump ${maxJump} (${at})`;
};
window.dupes = () => {
  const sig = new Map();
  for (const l of D.LESSONS) l.steps.forEach((s, i) => {
    const k = Q.b(s.ex, s.p).steps.map((st) => st.notes.map((n) => `${n.midi}.${n.s}.${n.f}.${n.tag ?? ''}`).join('+') + ':' + (+st.dur).toFixed(3)).join('|');
    if (!sig.has(k)) sig.set(k, []);
    sig.get(k).push(`${l.num} ${l.id}.${i} #${Q.t(s.ex).num}`);
  });
  return [...sig.values()].filter((v) => v.length > 1).map((v) => v.join(' == '));
};
window.formBeats = (id, p) => {
  const t = Q.t(id); const inst = Q.b(id, p); const ch = []; let cur = null; let beats = 0;
  for (const st of inst.steps) {
    const d = inst.uniform ? st.dur / (t.sub || 2) : +st.dur;
    if (st.chord) { cur = { c: st.chord, b: 0 }; ch.push(cur); }
    if (cur) cur.b += d;
    beats += d;
  }
  return `${id} ${JSON.stringify(p)} beats=${beats}: ${ch.map((c) => `${c.c}(${+c.b.toFixed(2)})`).join(' ')}`;
};
