// QA user (1e91dad): helpers pasted into the qauser tab (http://localhost:8890). Top-level await.
// Store the core in localStorage ('qa.u13') and `await eval(localStorage.getItem('qa.u13'))` after reloads.
//   songDump(id, part, strings)   every note of a Make Music part: name+octave(degree)@string+fret, finger, <tag>
//   scanSong(id, part, strings)   repeated notes that change finger; hand jumps of 3+ frets within 0.3 s at the default tempo
//   stretchScan(id, part)         finger 1 on fret x and finger 4 on x+4 within two notes of one chord (five-fret spans)
//   oddLabels()                   labels worth a look ("3" over minor, ♯1, ♭5 spelled ♯, 2/4/6 on a dominant, 9/11/13 off a dominant)
//   usScan()                      upper-structure triads: every key, structure, 4/5/6 strings, highest fret 17/20/21/24 ->
//                                 triad span, 5th above the bass, one finger on two frets, finger order against fret order
//   markCheck()                   technique marks in the tab strip: font, fill, row positions, overlaps
const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
const I = await import('/js/curriculum/index.js'); const D = await import('/js/course/data.js');
const SN = (s, strings = 4) => (strings === 4 ? 'EADG' : strings === 5 ? 'BEADG' : 'BEADGC')[s];
window.SN = SN;
window.Q = {
  T, F, I, D, SN,
  S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
  t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
  b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
  nn(n) { return n ? T.noteName(n) : '?'; },
};
window.MS = I.EXERCISES.filter((x) => x.module === 'music');
window.groups = (inst) => {
  const out = []; let cur = null;
  for (const st of inst.steps) {
    if (st.chord || st.text || !cur) { cur = { h: `${st.chord ?? ''}${st.text ? '{' + st.text + '}' : ''}`, notes: [] }; out.push(cur); }
    for (const n of st.notes) cur.notes.push({ ...n, dur: st.dur });
  }
  return out;
};
window.brief = (id, p, strings = 4, so = {}) => groups(Q.b(id, p, { strings, ...so })).map((g) => `[${g.h}] ` + g.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}${n.deg ? '(' + n.deg + ')' : ''}@${SN(n.s, strings)}${n.f}f${n.finger}${n.tag ? '<' + n.tag + '>' : ''}`).join(' ')).join(' | ');
window.songDump = (id, part = '0', strings = 4) => brief(id, { part }, strings);
window.scanSong = (id, part, strings = 4, bpmOver) => {
  const t = Q.t(id); const inst = Q.b(id, { part }, { strings });
  const bpm = bpmOver || t.bpm; const out = { rep: [], jump: [] };
  const seq = []; let time = 0;
  for (const st of inst.steps) { for (const n of st.notes) seq.push({ ...n, time }); time += st.dur; }
  for (let i = 1; i < seq.length; i++) {
    const a = seq[i - 1], b = seq[i];
    if (a.s === b.s && a.f === b.f && a.f > 0 && a.finger !== b.finger) out.rep.push(`${Q.nn(a.n)}@${SN(a.s)}${a.f} f${a.finger}→f${b.finger}`);
    if (a.f > 0 && b.f > 0 && typeof a.finger === 'number' && typeof b.finger === 'number') {
      const pa = a.f - a.finger + 1, pb = b.f - b.finger + 1; const dt = (b.time - a.time) * 60 / bpm;
      if (Math.abs(pa - pb) >= 3 && dt <= 0.3) out.jump.push(`${Q.nn(a.n)}@${SN(a.s)}${a.f}f${a.finger} → ${Q.nn(b.n)}@${SN(b.s)}${b.f}f${b.finger} (hand ${Math.abs(pa - pb)} frets in ${dt.toFixed(2)}s)`);
    }
  }
  return out;
};
window.stretchScan = (id, part, strings = 4) => {
  const out = [];
  for (const g of groups(Q.b(id, { part }, { strings }))) {
    const fr = g.notes.filter((n) => n.f > 0 && typeof n.finger === 'number');
    for (let i = 0; i < fr.length; i++) for (let j = 0; j < fr.length; j++) {
      const a = fr[i], b = fr[j];
      if (b.f - a.f === 4 && a.finger === 1 && b.finger === 4 && Math.abs(i - j) <= 2) out.push(`[${g.h}] ${Q.nn(a.n)}@${SN(a.s)}${a.f}f1 … ${Q.nn(b.n)}@${SN(b.s)}${b.f}f4`);
    }
  }
  return [...new Set(out)];
};
window.oddLabels = () => {
  const out = [];
  for (const t of MS) for (const p of t.params.part.options.map((o) => o[0]).filter((x) => x !== 'all'))
    for (const g of groups(Q.b(t.id, { part: p }))) {
      const ch = g.h.replace(/\{.*\}/, ''); const isDom = /^[A-G][♯♭]?(7|9|13)/.test(ch);
      for (const n of g.notes) {
        const nm = Q.nn(n.n);
        const odd = (n.deg === '3' && /m/.test(ch) && !/maj/.test(ch)) || /♯1|♭1|♭8/.test(n.deg || '') || (n.deg === '♭5' && nm.includes('♯'))
          || (['2', '4', '6', '♭6', '♯4', '♭2', '♯2'].includes(n.deg) && isDom) || (/9|11|13/.test(n.deg || '') && !isDom);
        if (odd) out.push(`${t.id} p${p} [${ch}] ${nm} = ${n.deg}`);
      }
    }
  return [...new Set(out)];
};
window.usScan = () => {
  const bad = [];
  for (const mf of [17, 20, 21, 24]) for (const strings of [4, 5, 6]) for (const us of ['II/I', 'V/I', 'iii/I', 'II/7', 'VI/7', 'bVI/7', 'bIII/7', 'bV/7', 'bVII/m']) for (let k = 0; k < 12; k++) {
    const g = groups(Q.b('tri-upper-structures', { key: String(k), us }, { strings, maxFret: mf }))[0];
    const bass = g.notes[0]; const up = g.notes.slice(1, 4);
    const lo = Math.min(...up.map((n) => n.midi)) - bass.midi;
    const byF = {}; let odd = false;
    for (const n of up) { if (n.f === 0) continue; if (byF[n.finger] != null && byF[n.finger] !== n.f) odd = true; byF[n.finger] = n.f; }
    const fr = up.filter((n) => n.f > 0); for (const a of fr) for (const b of fr) if (a.f < b.f && a.finger > b.finger) odd = true;
    if (odd || lo < 7) bad.push(`${mf}/${strings} ${us} k${k} ${g.h} lo+${lo} ` + g.notes.slice(0, 4).map((n) => `${Q.nn(n.n)}@${SN(n.s, strings)}${n.f}f${n.finger}`).join(' '));
  }
  return bad;
};
window.markCheck = () => {
  const svg = document.querySelector('.tabsvg'); if (!svg) return 'no tabsvg';
  const sr = svg.getBoundingClientRect();
  const m = svg.querySelector('.tmark'); const l = svg.querySelector('.tlbl');
  return { svgH: sr.height, marks: svg.querySelectorAll('.tmark, .tmarkp').length, font: m && getComputedStyle(m).fontSize, fill: m && getComputedStyle(m).fill,
    markBaseline: m && m.getAttribute('y'), labelBaseline: l && l.getAttribute('y'), labelFont: l && getComputedStyle(l).fontSize };
};
'user13 ready';
