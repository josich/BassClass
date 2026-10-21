// QA user (341ccfe): helpers pasted into the qauser tab (http://127.0.0.1:8890). Re-paste after a reload.
// user9.js helpers (Q, cd, brief2, lk, span, dupes, formBeats) plus:
//   shp(id, p, strings)       per chord badge: notes with string+fret+finger, fret span, most notes on one
//                             string, same pitch in two places, hand positions (fret - finger + 1)
//   shpStep(lessonId, i)      the same for one course step
//   hands(inst)               hand-position changes across a whole line (count, biggest, where)
//   checks(stageNum)          each checkpoint / stage test: its "I can" lines and its steps (title, preset)
//   stepTitle(lessonId, i)    the board title / subtitle the exercise would show for a step
const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
const I = await import('/js/curriculum/index.js'); const D = await import('/js/course/data.js');
const SN = (s, strings = 4) => (strings === 4 ? 'EADG' : strings === 5 ? 'BEADG' : 'BEADGC')[s];
window.Q = {
  T, F, I, D, SN,
  S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
  t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
  b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
  nn(n) { return n ? T.noteName(n) : '?'; },
  dump(inst, { max = 400, fing = true, strings = 4 } = {}) {
    return inst.steps.slice(0, max).map((st) => {
      let s = '';
      if (st.chord) s += `[${st.chord}] `;
      if (st.text) s += `{${st.text}} `;
      if (st.rest) s += 'r';
      s += st.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}@${SN(n.s, strings)}${n.f}${fing ? 'f' + n.finger : ''}${n.deg != null ? '=' + n.deg : ''}${n.tag ? '<' + n.tag + '>' : ''}`).join('+');
      return `${s} d${+(+st.dur).toFixed(3)}`;
    }).join(' | ');
  },
};
window.cd = (filter, max = 24, strings = 4) => D.LESSONS.filter(filter).flatMap((l) => l.steps.map((s, i) => {
  const t = Q.t(s.ex); const inst = Q.b(s.ex, s.p, { strings });
  return `## ${l.num} ${l.id}.${i} #${t.num} ${s.ex} ${JSON.stringify(s.p)} sub${s.sub ?? '-'} ${s.from}->${s.goal ?? '-'}\n   ${Q.dump(inst, { max, strings })}`;
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
    if (n.f > 0 && prev && Math.abs(n.f - prev.f) > maxJump) { maxJump = Math.abs(n.f - prev.f); at = `${Q.nn(prev.n)}@${SN(prev.s)}${prev.f}→${Q.nn(n.n)}@${SN(n.s)}${n.f}`; }
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
    const d = inst.uniform ? st.dur / (inst.sub || t.sub || 2) : +st.dur;
    if (st.chord) { cur = { c: st.chord, b: 0 }; ch.push(cur); }
    if (cur) cur.b += d;
    beats += d;
  }
  return `${id} ${JSON.stringify(p)} beats=${beats}: ${ch.map((c) => `${c.c}(${+c.b.toFixed(2)})`).join(' ')}`;
};
// ---- new in user10
window.groups = (inst) => {
  const out = []; let cur = null;
  for (const st of inst.steps) {
    if (st.chord || st.text || !cur) { cur = { h: `${st.chord ?? ''}${st.text ? '{' + st.text + '}' : ''}`, notes: [] }; out.push(cur); }
    for (const n of st.notes) cur.notes.push(n);
  }
  return out;
};
window.shpInst = (inst, strings = 4, { all = false } = {}) => groups(inst).map((g) => {
  const fr = g.notes.filter((n) => n.f > 0).map((n) => n.f);
  const per = {}; for (const n of g.notes) per[n.s] = (per[n.s] || 0) + 1;
  const pl = new Map(); for (const n of g.notes) { const k = n.midi; if (!pl.has(k)) pl.set(k, new Set()); pl.get(k).add(`${SN(n.s, strings)}${n.f}`); }
  const dup = [...pl.entries()].filter(([, v]) => v.size > 1).map(([m, v]) => `${m}:${[...v].join('/')}`);
  const hp = [...new Set(g.notes.filter((n) => n.f > 0 && n.finger > 0).map((n) => n.f - n.finger + 1))];
  const spanF = fr.length ? Math.max(...fr) - Math.min(...fr) : 0;
  const flag = (spanF > 4 ? 'SPAN ' : '') + (Math.max(...Object.values(per), 0) > 2 ? '3/STR ' : '') + (dup.length ? 'DUP ' : '') + (hp.length > 1 ? 'SHIFT ' : '');
  if (!all && !flag) return null;
  return `${flag}[${g.h}] ${g.notes.map((n) => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')} span${spanF} hp${hp.join('/')}${dup.length ? ' dup ' + dup.join(',') : ''}`;
}).filter(Boolean);
window.shp = (id, p = {}, strings = 4, o) => shpInst(Q.b(id, p, { strings }), strings, o);
window.shpStep = (lid, i, strings = 4, o) => { const s = D.lessonById.get(lid).steps[i]; return shp(s.ex, s.p, strings, o); };
window.hands = (inst, strings = 4) => {
  let prev = null; let n = 0; let big = 0; let at = ''; const list = [];
  for (const st of inst.steps) for (const x of st.notes) {
    if (!(x.f > 0 && x.finger > 0)) continue;
    const hp = x.f - x.finger + 1;
    if (prev && hp !== prev.hp) { n++; const d = Math.abs(hp - prev.hp); list.push(d); if (d > big) { big = d; at = `${Q.nn(prev.x.n)}@${SN(prev.x.s, strings)}${prev.x.f}f${prev.x.finger}→${Q.nn(x.n)}@${SN(x.s, strings)}${x.f}f${x.finger}`; } }
    prev = { hp, x };
  }
  return `shifts ${n}, biggest ${big} (${at})`;
};
window.checks = (stageNum) => D.LESSONS.filter((l) => (l.kind === 'check' || l.kind === 'test') && (stageNum == null || D.STAGES.indexOf(l.stage) + 1 === stageNum)).map((l) => {
  const lines = (l.can || []).map((c) => `   - ${c}`).join('\n');
  const st = l.steps.map((s, i) => { const t = Q.t(s.ex); const inst = Q.b(s.ex, s.p); return `   ${i + 1}. #${t.num} ${t.title} ${JSON.stringify(s.p)} sub${s.sub ?? '-'} ${s.from}->${s.goal ?? '-'}${s.backing ? ' bk:' + s.backing : ''} :: ${inst.title ?? ''}${inst.subtitle ? ' / ' + inst.subtitle : ''}`; }).join('\n');
  return `## ${l.num} ${l.title}\n${lines}\n${st}`;
}).join('\n');
window.stepTitle = (lid, i) => { const s = D.lessonById.get(lid).steps[i]; const inst = Q.b(s.ex, s.p); return `${inst.title ?? ''} | ${inst.subtitle ?? ''}`; };
'user10 ready';
// ---- added during the run
window.fingOdd2 = (inst, strings = 4) => { const bad = []; for (const g of groups(inst)) { const ns = []; const seen = new Set(); for (const n of g.notes) { if (!(n.f > 0 && n.finger > 0)) continue; const k = `${n.s}|${n.f}|${n.finger}`; if (seen.has(k)) continue; seen.add(k); ns.push(n); } for (let i = 0; i < ns.length; i++) for (let j = 0; j < ns.length; j++) { const a = ns[i], b = ns[j]; if (b.f <= a.f) continue; const fg = b.finger - a.finger, gap = b.f - a.f; if (fg < 0 || fg > gap) bad.push(`[${g.h}] ${Q.nn(a.n)}@${SN(a.s,strings)}${a.f}f${a.finger} vs ${Q.nn(b.n)}@${SN(b.s,strings)}${b.f}f${b.finger}`); } } return bad; };
window.needless = (inst, strings = 4) => groups(inst).filter(g => { const ns = g.notes.filter(n => n.f > 0 && n.finger > 0); if (ns.length < 2) return false; const fr = ns.map(n => n.f); const span = Math.max(...fr) - Math.min(...fr); const hp = new Set(ns.map(n => n.f - n.finger + 1)); return span <= 3 && hp.size > 1; }).map(g => `[${g.h}] ${g.notes.map(n => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')}`);
window.brief = (id, p) => { const inst = Q.b(id, p); return groups(inst).map(g => `[${g.h}] ` + g.notes.map(n => `${Q.nn(n.n)}${Math.floor(n.midi/12)-1}${n.deg ? '(' + n.deg + ')' : ''}@${SN(n.s)}${n.f}`).join(' ')).join(' | '); };
'user10 ready';
window.shpInst = (inst, strings = 4, { all = false } = {}) => groups(inst).map((g) => {
  const fr = g.notes.filter((n) => n.f > 0).map((n) => n.f);
  const per = {}; const seenP = new Set(); for (const n of g.notes) { const k = `${n.s}|${n.f}`; if (seenP.has(k)) continue; seenP.add(k); per[n.s] = (per[n.s] || 0) + 1; }
  const pl = new Map(); for (const n of g.notes) { const k = n.midi; if (!pl.has(k)) pl.set(k, new Set()); pl.get(k).add(`${SN(n.s, strings)}${n.f}`); }
  const dup = [...pl.entries()].filter(([, v]) => v.size > 1).map(([m, v]) => `${m}:${[...v].join('/')}`);
  const hp = [...new Set(g.notes.filter((n) => n.f > 0 && n.finger > 0).map((n) => n.f - n.finger + 1))];
  const hpR = hp.length ? Math.max(...hp) - Math.min(...hp) : 0;
  const spanF = fr.length ? Math.max(...fr) - Math.min(...fr) : 0;
  const flag = (spanF > 4 ? 'SPAN ' : '') + (Math.max(...Object.values(per), 0) > 2 ? '3/STR ' : '') + (dup.length ? 'DUP ' : '') + (hpR > 1 ? 'SHIFT ' : '') + (spanF === 4 ? 'st4 ' : '');
  if (!all && !/SPAN|3\/STR|DUP|SHIFT/.test(flag)) return null;
  const uniqN = []; const s2 = new Set(); for (const n of g.notes) { const k = `${n.s}|${n.f}`; if (s2.has(k)) continue; s2.add(k); uniqN.push(n); }
  return `${flag}[${g.h}] ${uniqN.map((n) => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')} span${spanF} hp${hp.join('/')}${dup.length ? ' dup ' + dup.join(',') : ''}`;
}).filter(Boolean);
