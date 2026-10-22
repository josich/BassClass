// QA (1e91dad): checkers pasted into the qa tab (http://localhost:8878). Top-level await; re-paste after
// a reload.
//
// window.__loadOld(name, gzipBase64): loads an older copy of a curriculum module as a blob module (its
//   relative imports rewritten to http://localhost:8878/js/...), into window.__old[name]. Make the payload
//   with:  git show 92ce1df:web/js/curriculum/songs.js | sed -e "s#from '\./#from 'http://localhost:8878/js/curriculum/#g"
//          -e "s#from '\.\./#from 'http://localhost:8878/js/#g" | gzip -9 | base64 -w0
//   Used to compare every course step on mm-* / tech-sweep / tech-tapping between 92ce1df and HEAD
//   (`__stepDiff()`: '=' same notes and places, 'pos' same pitches and rhythm but other places, 'NOTES').
// window.__songs13(): every Make Music part on 4/5/6 strings at highest fret 17/20/24: same-string jumps of
//   10+ frets, hand moves of 5+ frets within a beat (hand = fret - finger + 1), H/PO direction and string,
//   T⊓/TV (TV on the string of the stroke before, strokes alternate), label against spelled interval
//   (9 = 2, 11 = 4, ♯11 = #4, 13 = 6, ♭5 = b5...), approach notes a half step from the next sounding note,
//   frets <= highest, fingers 0-4.
// window.__repeatFinger(): segments (chord to chord) whose first note repeats the last note of the segment
//   before and keeps its finger (builder.js "a note played again at once keeps its finger") although the
//   rest of the segment is fingered in another hand position that the note fits (the round-10 rule: a
//   chord that fits one hand position is never labelled with a shift inside it).
// window.__upper13(): tri-upper-structures over every structure, key, 4/5/6 strings, highest fret
//   17/20/21/24: header root = interval above the bass (plain only for double accidentals), chord tones of
//   the lower chord spelled from it, lowest triad note >= a 5th above the bass, headers with C♭/F♭/E♯/B♯.
// window.__dthumb(): sl-double-thumb over every key, progression, bass and highest fret: TV on the string of
//   the T⊓ before it.
const I = await import('/js/curriculum/index.js'); const F = await import('/js/fretboard.js');
const T = await import('/js/theory.js'); const H = await import('/js/harmony.js'); const D = await import('/js/course/data.js');
window.__old = window.__old || {};
window.__loadOld = async (name, b64) => {
  const bin = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const text = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  window.__old[name] = await import(URL.createObjectURL(new Blob([text], { type: 'text/javascript' })));
  return text.length;
};
const ctxOf = (strings = 4, maxFret = 20) => { const S = { strings, notation: 'letters', maxFret }; return [F.makeCtx(S), S]; };
window.__stepDiff = () => {
  const oldById = new Map(Object.values(window.__old).flatMap((m) => m.default).map((t) => [t.id, t]));
  const dp = (t) => Object.fromEntries(Object.entries(t.params || {}).map(([k, d]) => [k, d.default]));
  const sig = (inst) => inst.steps.map((s) => `${+s.dur.toFixed(4)}:${s.notes.map((n) => n.midi).join('+')}`).join(' ');
  const pos = (inst) => inst.steps.map((s) => s.notes.map((n) => `${n.s}/${n.f}`).join('+')).join(' ');
  const out = [];
  for (const l of D.LESSONS) l.steps.forEach((st, i) => {
    const o = oldById.get(st.ex); if (!o) return; const t = I.byId.get(st.ex);
    const res = [4, 5, 6].map((n) => { const [ctx, S] = ctxOf(n); const a = o.build({ ...dp(o), ...st.p }, ctx, S), b = t.build({ ...I.defaultParams(t), ...st.p }, ctx, S); return sig(a) === sig(b) ? (pos(a) === pos(b) ? '=' : 'pos') : 'NOTES'; });
    out.push(`${l.id}.${i} ${st.ex} ${res.join(',')}`);
  });
  return out;
};
const flat = (inst) => { const out = []; let t = 0, chord = null; inst.steps.forEach((s) => { if (s.chord) chord = s.chord; for (const n of s.notes) out.push({ ...n, t, chord }); t += s.dur; }); return out; };
const NUM = { '♭9': 'b2', 9: '2', '♯9': '#2', 11: '4', '♯11': '#4', '♭13': 'b6', 13: '6', '♭5': 'b5' };
window.__songs13 = ({ strings = [4, 5, 6], frets = [17, 20, 24] } = {}) => {
  const res = { builds: 0, notes: 0, jumps10: [], hand5: [], tv: [], hpo: [], labelSpell: [], approach: [], fret: [], finger: [] };
  for (const t of I.EXERCISES.filter((x) => x.module === 'music')) for (const n of strings) for (const mf of frets) for (const part of t.params.part.options.map((o) => o[0])) {
    const [ctx, S] = ctxOf(n, mf); const inst = t.build({ ...I.defaultParams(t), part }, ctx, S); res.builds++;
    const ns = flat(inst); res.notes += ns.length; const tag = `${t.id} p${part} ${n}str/${mf}`;
    ns.forEach((x, k) => {
      if (x.f > mf) res.fret.push(`${tag} f${x.f}`);
      if (!(x.finger === 0 || [1, 2, 3, 4].includes(x.finger))) res.finger.push(`${tag} #${k} finger ${x.finger}`);
      const y = ns[k + 1]; if (!y) return;
      if (x.s === y.s && Math.abs(x.f - y.f) >= 10) res.jumps10.push(`${tag} #${k} ${x.s}/${x.f}→${y.s}/${y.f}`);
      if (x.f > 0 && y.f > 0 && x.finger > 0 && y.finger > 0 && y.t - x.t < 1 - 1e-9 && Math.abs((x.f - x.finger) - (y.f - y.finger)) >= 5) res.hand5.push(`${tag} #${k}`);
      if ((y.tag === 'H' || y.tag === 'PO') && (y.s !== x.s || (y.tag === 'H' ? y.f <= x.f : y.f >= x.f))) res.hpo.push(`${tag} #${k + 1}`);
    });
    let lastT = null;
    ns.forEach((x, k) => { if (x.tag === 'T⊓' || x.tag === 'TV') { if (x.tag === 'TV' && lastT && lastT.s !== x.s) res.tv.push(`${tag} #${k}`); if (lastT && lastT.tag === x.tag) res.tv.push(`${tag} #${k} twice`); lastT = x; } });
    ns.forEach((x, k) => { if (!x.deg || x.deg === '→') return; const b = H.parseBadge(x.chord); if (!b) return; const iv = T.ivBetween(b.root, x.n); const want = NUM[x.deg] || x.deg.replace('♭', 'b').replace('♯', '#'); if (!(iv === want || (x.deg === 'R' && iv === '1'))) res.labelSpell.push(`${tag} #${k} [${x.chord}] ${T.noteName(x.n)}=${x.deg} (${iv})`); });
    ns.forEach((x, k) => { if (x.deg !== '→') return; const y = ns[(k + 1) % ns.length]; if (Math.abs(y.midi - x.midi) !== 1) res.approach.push(`${tag} #${k}`); });
  }
  return res;
};
window.__repeatFinger = () => {
  const scan = (inst) => {
    const hits = []; let seg = [], prevNote = null, before = null; const segs = [];
    for (const st of inst.steps) { if (st.chord || st.text) { if (seg.length) segs.push({ seg, before }); before = prevNote; seg = []; } if (st.notes.length === 1) { seg.push(st.notes[0]); prevNote = st.notes[0]; } else if (st.notes.length) prevNote = null; }
    if (seg.length) segs.push({ seg, before });
    for (const { seg: sg, before: b } of segs) {
      const first = sg[0]; if (!b || b.s !== first.s || b.f !== first.f || first.f === 0) continue;
      const num = sg.filter((n) => n.f > 0 && typeof n.finger === 'number' && n.finger > 0); const fs = num.map((n) => n.f);
      if (num.length < 2 || Math.max(...fs) - Math.min(...fs) > 3) continue;
      const hp = (n) => n.f - n.finger + 1; const rest = new Set(num.slice(1).map(hp));
      if (!rest.has(hp(first)) && rest.size === 1) hits.push(sg.slice(0, 5).map((n) => `${T.noteName(n.n)}@${n.s}/${n.f}f${n.finger}`).join(' '));
    }
    return hits;
  };
  const [ctx, S] = ctxOf(4); const byEx = {};
  for (const t of I.EXERCISES) {
    const opts = [I.defaultParams(t)]; for (const [k, d] of Object.entries(t.params || {})) if (d.options) for (const o of d.options) opts.push({ ...I.defaultParams(t), [k]: o[0] });
    let hit = 0, ex = null; for (const p of opts) { let inst; try { inst = t.build(p, ctx, S); } catch { continue; } const h = scan(inst); if (h.length) { hit++; ex = ex || `${JSON.stringify(p)}: ${h[0]}`; } }
    if (hit) byEx[t.id] = `${hit}/${opts.length}; ${ex}`;
  }
  return byEx;
};
window.__upper13 = () => {
  const t = I.byId.get('tri-upper-structures'); const IV = { 'II/I': '2', 'V/I': '5', 'iii/I': '3', 'II/7': '2', 'VI/7': '6', 'bVI/7': 'b6', 'bIII/7': 'b3', 'bV/7': 'b5', 'bVII/m': 'b7' };
  const out = { builds: 0, header: [], low: [], odd: [] };
  for (const n of [4, 5, 6]) for (const mf of [17, 20, 21, 24]) for (const us of Object.keys(IV)) for (let k = 0; k < 12; k++) {
    const [ctx, S] = ctxOf(n, mf); const inst = t.build({ ...I.defaultParams(t), us, key: String(k) }, ctx, S); out.builds++;
    const notes = inst.steps.flatMap((s) => s.notes); const bass = notes[0]; const up = notes.slice(1, -1); const hdr = inst.steps[0].text;
    const want = T.up(bass.n, IV[us]); if (Math.abs(want.a) <= 1 && !hdr.startsWith(T.noteName(want))) out.header.push(`${us} k${k}: ${hdr}`);
    if (Math.min(...up.map((x) => x.midi)) - bass.midi < 7) out.low.push(`${us} k${k} ${n}/${mf}`);
    if (/^(C♭|F♭|E♯|B♯)/.test(hdr) && n === 4 && mf === 20) out.odd.push(`${us} k${k} ${inst.steps[0].chord} ${hdr}: ${notes.slice(1, 4).map((x) => `${T.noteName(x.n)}(${x.deg})`).join(' ')}`);
  }
  return out;
};
window.__dthumb = () => {
  const t = I.byId.get('sl-double-thumb'); const bad = []; let builds = 0;
  for (const n of [4, 5, 6]) for (const mf of [17, 20, 24]) for (let k = 0; k < 12; k++) for (const prog of t.params.prog.options.map((o) => o[0])) {
    const [ctx, S] = ctxOf(n, mf); const inst = t.build({ ...I.defaultParams(t), key: String(k), prog }, ctx, S); builds++;
    let lastT = null; for (const x of inst.steps.flatMap((s) => s.notes)) if (x.tag === 'T⊓' || x.tag === 'TV') { if (x.tag === 'TV' && lastT && lastT.s !== x.s) bad.push(`${n}/${mf} k${k} ${prog}: T⊓ ${lastT.s}/${lastT.f} → TV ${x.s}/${x.f}`); lastT = x; }
  }
  return { builds, bad };
};
'checks13 ready';
