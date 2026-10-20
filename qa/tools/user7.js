// QA user (d25bf3c): helpers pasted into the qauser tab (http://127.0.0.1:8890). Re-paste after a reload.
// Q.b(id|num, params, settings) builds an exercise like the app; Q.dump(inst) prints notes, strings, frets,
// fingers, degrees and tags; Q.show([...insts], {sub, size, x0, w}) engraves the staff into a white overlay
// for screenshots (Q.hide() removes it); Q.overlaps(inst) lists text glyphs of the engraved staff that touch.
// The staff value checker is engrave-check7.js (window.__engrave7 / __engraveSweep7).
const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js'); const H = await import('/js/harmony.js');
const I = await import('/js/curriculum/index.js'); const ST = await import('/js/views/staff.js');
window.Q = {
  T, F, H, I, ST,
  S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
  t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
  b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
  nn(n) { return n ? T.noteName(n) : '?'; },
  dump(inst, { max = 400, fing = true } = {}) {
    return inst.steps.slice(0, max).map((st) => {
      let s = '';
      if (st.chord) s += `[${st.chord}] `;
      if (st.text) s += `{${st.text}} `;
      if (st.implied) s += `(${st.implied}) `;
      if (st.rest) s += 'r';
      // the octave number is midi-based (C♭ shows one octave low)
      s += st.notes.map((n) => `${Q.nn(n.n)}${Math.floor(n.midi / 12) - 1}@${n.s}:${n.f}${fing ? 'f' + n.finger : ''}${n.deg != null ? '=' + n.deg : ''}${n.tag ? '<' + n.tag + '>' : ''}`).join('+');
      return `${s} d${+(+st.dur).toFixed(3)}${st.hide ? ' H' : ''}${st.silent ? ' S' : ''}`;
    }).join(' | ');
  },
};
// beats per step as the player lays them out (a closing "fill" note is held to the bar line)
Q.beatsFn = (inst, sub = 2) => {
  const bpb = inst.beatsPerBar || 4; const fill = new Map(); let b = 0;
  const base = (s) => (inst.uniform ? s.dur / sub : s.dur);
  for (const s of inst.steps) { let len = base(s); if (s.fill) { const toBar = Math.ceil(b / bpb - 1e-9) * bpb - b; len = Math.max(len, toBar > 1e-9 ? toBar : bpb); fill.set(s, len); } b += len; }
  return (s) => (fill.has(s) ? fill.get(s) : base(s));
};
Q.eng = (inst, { sub = 2, size = 8, label = (n) => n.deg ?? '' } = {}) => Q.ST.engraveStaff(inst, { beatsOf: Q.beatsFn(inst, sub), label, beatsPerBar: inst.beatsPerBar || 4, size, window: null });
Q.show = (insts, { sub = 2, size = 8, x0 = 0, w = 1400, label } = {}) => {
  let ov = document.getElementById('qa-ov'); if (!ov) { ov = document.createElement('div'); ov.id = 'qa-ov'; document.body.append(ov); }
  ov.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#fff;overflow:auto;color:#000;--text:#000;--muted:#555';
  ov.innerHTML = '';
  for (const inst of [].concat(insts)) {
    const r = Q.eng(inst, { sub, size, label });
    ov.insertAdjacentHTML('beforeend', `<svg class="tabsvg staff" viewBox="${x0} 0 ${Math.min(w, r.width - x0)} ${r.height}" style="width:100%;height:auto;display:block;border-bottom:1px solid #ccc">${r.svg}</svg>`);
  }
  return 'ok';
};
Q.hide = () => { document.getElementById('qa-ov')?.remove(); return 'hidden'; };
// text glyphs that touch in the engraved staff (tuplet numbers, chord row, labels, dynamics)
Q.overlaps = (inst, { sub = 2, size = 8 } = {}) => {
  let host = document.getElementById('qa-host');
  if (!host) { host = document.createElement('div'); host.id = 'qa-host'; host.style.cssText = 'position:absolute;left:-30000px;top:0;visibility:hidden'; document.body.append(host); }
  const r = Q.eng(inst, { sub, size });
  host.innerHTML = `<svg class="tabsvg staff" width="${r.width}" height="${r.height}">${r.svg}</svg>`;
  const svg = host.firstElementChild;
  const bb = (el) => { const b = el.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height, t: el.textContent, c: el.getAttribute('class') }; };
  const texts = [...svg.querySelectorAll('text')].map(bb).filter((b) => b.w > 0 && b.c !== 'sts');
  const hit = (a, b) => a.x < b.x + b.w - 0.5 && b.x < a.x + a.w - 0.5 && a.y < b.y + b.h - 0.5 && b.y < a.y + a.h - 0.5;
  const out = [];
  for (let i = 0; i < texts.length; i++) for (let j = i + 1; j < texts.length; j++) if (hit(texts[i], texts[j])) out.push(`${texts[i].c}:"${texts[i].t}" x ${texts[j].c}:"${texts[j].t}" @${texts[i].x.toFixed(0)}`);
  return { n: out.length, out: out.slice(0, 12) };
};

// sweeps used for the report (each returns a summary object)
const LPC = [0, 2, 4, 5, 7, 9, 11];
const stepSp = (m, target, tm) => { const up = m > tm; const l = (target.l + (up ? 1 : 6)) % 7; let a = ((m - LPC[l]) % 12 + 12) % 12; if (a > 6) a -= 12; return { l, a }; };
// walking: leaps over an octave, whole-step approaches, approach spelled not as a step (single keys and cycles)
Q.walkSweep = (strings = [4, 5]) => {
  const res = {};
  for (const st of strings) for (const t of I.EXERCISES.filter((x) => x.module === 'walking')) {
    const progs = t.params.prog ? t.params.prog.options.map((o) => o[0]) : [null];
    const keys = [...Array(12).keys()].map(String).concat(t.params.key?.cycles ? ['cycle4', 'cycle5', 'chromatic'] : []);
    for (const prog of progs) for (const key of keys) {
      const inst = Q.b(t.id, prog ? { prog, key } : { key }, { strings: st });
      const seq = inst.steps.filter((s) => s.notes.length === 1).map((s) => s.notes[0]);
      for (let j = 0; j + 1 < seq.length; j++) {
        const a = seq[j], b = seq[j + 1], k = `${t.num} ${key.startsWith('c') ? key : 'single'}`;
        res[k] = res[k] || { leap8: 0, wholeAppr: 0, spell: 0 };
        if (Math.abs(b.midi - a.midi) > 12) res[k].leap8++;
        if (a.deg === '→' && b.deg !== '→' && Math.abs(b.midi - a.midi) === 2 && !/enclos/.test(t.id)) res[k].wholeAppr++;
        if (a.deg === '→' && b.deg !== '→' && Math.abs(b.midi - a.midi) === 1) { const sp = stepSp(a.midi, b.n, b.midi); if (!T.awkward(sp) && (sp.l !== a.n.l || sp.a !== a.n.a)) res[k].spell++; }
      }
    }
  }
  return res;
};
// slap: where the pops and thumbs land (string names), default params
Q.slapStrings = () => {
  const names = { 4: ['E', 'A', 'D', 'G'], 5: ['B', 'E', 'A', 'D', 'G'], 6: ['B', 'E', 'A', 'D', 'G', 'C'] };
  const out = [];
  for (const st of [4, 5, 6]) for (const n of [93, 132, 174, 191]) {
    const inst = Q.b(n, {}, { strings: st }); const pops = {}; const thumbs = {};
    inst.steps.forEach((s) => s.notes.forEach((x) => { const k = `${Q.nn(x.n)}@${names[st][x.s]}${x.f}`; if (x.tag === 'P') pops[k] = (pops[k] || 0) + 1; if (x.tag && x.tag[0] === 'T') thumbs[k] = (thumbs[k] || 0) + 1; }));
    out.push(`${st}s #${n} pops ${JSON.stringify(pops)} thumbs ${JSON.stringify(thumbs)}`);
  }
  return out.join('\n');
};
'Q ready';
