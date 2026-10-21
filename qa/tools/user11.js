// QA user (bdc08e7): helpers pasted into the qauser tab (http://127.0.0.1:8890). Re-paste after a reload.
// user10 helpers (Q, groups, shpInst/shp, hands, fingOdd2, needless, brief, checks, span) plus:
//   infoAll()            every ⓘ on the current screen: its label and text (opened with a real click event)
//   texts()              the info texts that come from data: exercise summaries, module and level
//                        descriptions, stage descriptions, unit goals (with lengths)
//   sameTitleSteps()     lessons whose step rows show the same exercise title twice or more
//   sessRows()           the rows of Today's session on Home (title, tag, ticked)
//   fingBad(inst)        finger numbers that contradict the frets inside one chord/label group
//                        (a higher fret on a lower finger, or a finger gap larger than the fret gap)
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
    for (const n of st.notes) cur.notes.push(n);
  }
  return out;
};
window.brief = (id, p, strings = 4) => groups(Q.b(id, p, { strings })).map((g) => `[${g.h}] ` + g.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}${n.deg ? '(' + n.deg + ')' : ''}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')).join(' | ');
window.shpInst = (inst, strings = 4, { all = false } = {}) => groups(inst).map((g) => {
  const fr = g.notes.filter((n) => n.f > 0).map((n) => n.f);
  const per = {}; const seenP = new Set(); for (const n of g.notes) { const k = `${n.s}|${n.f}`; if (seenP.has(k)) continue; seenP.add(k); per[n.s] = (per[n.s] || 0) + 1; }
  const pl = new Map(); for (const n of g.notes) { const k = n.midi; if (!pl.has(k)) pl.set(k, new Set()); pl.get(k).add(`${SN(n.s, strings)}${n.f}`); }
  const dup = [...pl.entries()].filter(([, v]) => v.size > 1).map(([m, v]) => `${m}:${[...v].join('/')}`);
  const hp = [...new Set(g.notes.filter((n) => n.f > 0 && n.finger > 0).map((n) => n.f - n.finger + 1))];
  const hpR = hp.length ? Math.max(...hp) - Math.min(...hp) : 0;
  const spanF = fr.length ? Math.max(...fr) - Math.min(...fr) : 0;
  const flag = (spanF > 4 ? 'SPAN ' : '') + (Math.max(...Object.values(per), 0) > 2 ? '3/STR ' : '') + (dup.length ? 'DUP ' : '') + (hpR > 1 ? 'SHIFT ' : '');
  if (!all && !flag) return null;
  const uniqN = []; const s2 = new Set(); for (const n of g.notes) { const k = `${n.s}|${n.f}`; if (s2.has(k)) continue; s2.add(k); uniqN.push(n); }
  return `${flag}[${g.h}] ${uniqN.map((n) => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')} span${spanF}`;
}).filter(Boolean);
window.shp = (id, p = {}, strings = 4, o) => shpInst(Q.b(id, p, { strings }), strings, o);
window.hands = (inst, strings = 4) => {
  let prev = null; let n = 0; let big = 0; let at = '';
  for (const st of inst.steps) for (const x of st.notes) {
    if (!(x.f > 0 && x.finger > 0)) continue;
    const hp = x.f - x.finger + 1;
    if (prev && hp !== prev.hp) { n++; const d = Math.abs(hp - prev.hp); if (d > big) { big = d; at = `${Q.nn(prev.x.n)}@${SN(prev.x.s, strings)}${prev.x.f}f${prev.x.finger}→${Q.nn(x.n)}@${SN(x.s, strings)}${x.f}f${x.finger}`; } }
    prev = { hp, x };
  }
  return `shifts ${n}, biggest ${big} (${at})`;
};
window.fingBad = (inst, strings = 4) => {
  const bad = [];
  for (const g of groups(inst)) {
    const ns = []; const seen = new Set();
    for (const n of g.notes) { if (!(n.f > 0 && n.finger > 0)) continue; const k = `${n.s}|${n.f}|${n.finger}`; if (seen.has(k)) continue; seen.add(k); ns.push(n); }
    for (const a of ns) for (const b of ns) {
      if (b.f <= a.f) continue;
      const fg = b.finger - a.finger, gap = b.f - a.f;
      if (fg < 0 || fg > gap) bad.push(`[${g.h}] ${Q.nn(a.n)}@${SN(a.s, strings)}${a.f}f${a.finger} vs ${Q.nn(b.n)}@${SN(b.s, strings)}${b.f}f${b.finger}`);
    }
  }
  return bad;
};
window.needless = (inst, strings = 4) => groups(inst).filter((g) => { const ns = g.notes.filter((n) => n.f > 0 && n.finger > 0); if (ns.length < 2) return false; const fr = ns.map((n) => n.f); const sp = Math.max(...fr) - Math.min(...fr); const hp = new Set(ns.map((n) => n.f - n.finger + 1)); return sp <= 3 && hp.size > 1; }).map((g) => `[${g.h}] ${g.notes.map((n) => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')}`);
window.infoAll = () => [...document.querySelectorAll('.info-btn')].map((b) => {
  b.click(); const p = document.querySelector('.info-pop'); const r = p?.getBoundingClientRect();
  const out = { label: b.getAttribute('aria-label'), text: p?.innerText.replace(/\n\n/g, ' / '), box: r ? [Math.round(r.top), Math.round(r.bottom), Math.round(r.left), Math.round(r.right)] : null };
  b.click(); return out;
});
window.texts = () => ({
  summaries: I.EXERCISES.map((t) => ({ num: t.num, id: t.id, len: (t.summary || '').length, s: t.summary })),
  modules: I.MODULES.map((m) => ({ id: m.id, len: (m.desc || '').length, s: m.desc })),
  levels: I.LEVELS.map((L) => ({ n: L.n, len: (L.desc || '').length, s: L.desc })),
  stages: D.STAGES.map((s, i) => ({ n: i + 1, len: (s.desc || '').length, s: s.desc })),
  units: D.UNITS.map((u) => ({ n: u.n, id: u.id, len: (u.goal || '').length, s: u.goal })),
});
window.sameTitleSteps = () => D.LESSONS.map((l) => {
  const ts = l.steps.map((s) => Q.t(s.ex).title); const c = {}; ts.forEach((t) => { c[t] = (c[t] || 0) + 1; });
  const rep = Object.entries(c).filter(([, n]) => n > 1);
  return rep.length ? { lesson: `${l.num ?? ''} ${l.id}`, kind: l.kind, steps: l.steps.length, rep: rep.map(([t, n]) => `${t} ×${n}`).join('; '), goals: l.steps.map((s) => `${Q.t(s.ex).num}:${s.goal ?? '-'}${s.sub ? '/' + s.sub : ''}`).join(' ') } : null;
}).filter(Boolean);
window.sessRows = () => [...document.querySelectorAll('.session-block .item')].map((it) => `${it.querySelector('.n').textContent}. ${it.querySelector('.t b').textContent}${it.querySelector('.tag') ? ' [' + it.querySelector('.tag').textContent + ']' : ''}`);
'user11 ready';
// ---- added during the run
// rcheck(inst): chord groups (badge with a note name, ≤ 5 pitches) whose fretted notes span ≤ 3 frets and
// whose finger numbers put one finger on two frets, reverse the fret order, or (span 3) differ from 1-2-3-4
window.rcheck = (inst, strings = 4) => { const bad = []; for (const g of groups(inst)) { if (!g.h || !/[A-G]/.test(g.h)) continue; const ns = []; const seen = new Set(); for (const n of g.notes) { if (!(n.f > 0 && n.finger > 0)) continue; const k2 = `${n.s}|${n.f}|${n.finger}`; if (seen.has(k2)) continue; seen.add(k2); ns.push(n); } if (ns.length < 2 || new Set(ns.map(n => n.midi)).size > 5) continue; const fr = ns.map(n => n.f); const lo = Math.min(...fr); const sp = Math.max(...fr) - lo; if (sp > 3) continue; const same = ns.some(a => ns.some(b => b.f !== a.f && b.finger === a.finger)); const order = ns.some(a => ns.some(b => b.f > a.f && b.finger < a.finger)); const exact = sp === 3 && ns.some(n => n.finger !== n.f - lo + 1); if (same || order || exact) bad.push(`[${g.h}] ${ns.map(n => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' ')}`); } return bad; };
// simSessions / simCross: plan N sessions per length with the app's own sessionBlock() (writes bassclass.session.v1!)
window.simCross = async (N = 30, minutes = [30, 45, 60]) => { const P = await import('/js/course/progress.js'); const C = await import('/js/ui/course.js'); const cat = (x) => x.warm ? 'warm' : x.slot === 'Review' ? 'review' : /^(Lesson|Checkpoint|Stage test)/.test(x.slot) ? 'course' : /^Library/.test(x.slot) ? 'library' : 'focus'; const out = { sessions: 0, cross: 0, ex: {} }; for (let k = 0; k < N; k++) { P.clearSession(); for (const m of minutes) { P.setSessionMinutes(m); C.sessionBlock(); const list = P.sessionStore().cur.lists[m]; out.sessions++; const by = {}; list.forEach(x => { (by[x.id] = by[x.id] || new Set()).add(cat(x)); }); const c = Object.entries(by).filter(([, s]) => s.size > 1); if (c.length) { out.cross++; for (const [id, s] of c) { const key = `${Q.t(id).title} (${[...s].join('+')})`; out.ex[key] = (out.ex[key] || 0) + 1; } } } } return out; };
window.simSessions = async (N = 30, minutes = [30, 45, 60]) => { const P = await import('/js/course/progress.js'); const C = await import('/js/ui/course.js'); const out = { sessions: 0, warm: 0, warmTicked: 0, focus: 0, focusTicked: 0 }; for (let k = 0; k < N; k++) { P.clearSession(); for (const m of minutes) { P.setSessionMinutes(m); const el = C.sessionBlock(); const list = P.sessionStore().cur.lists[m]; out.sessions++; [...el.querySelectorAll('.item')].forEach((r, i) => { const it = list[i]; if (!it) return; const t = r.querySelector('.n').textContent === '✓'; if (it.warm) { out.warm++; if (t) out.warmTicked++; } if (/^(Scales|Chords|Lines and grooves|Ear and reading)$/.test(it.slot)) { out.focus++; if (t) out.focusTicked++; } }); } } return out; };
