// QA (53a1753): staff view checker. Paste into the qa tab. window.__staffCheck(inst, ctx) renders an
// exercise with TabView.renderStaff into an off-screen element and checks, independently of the app:
//  - each note head sits on the line/space of its WRITTEN pitch (sound + 1 octave), drawn an octave
//    lower with "8va" above written E4;
//  - the accidental shown against the key signature (none when the note matches it, ♮ when it cancels);
//  - ledger lines; the key signature glyphs (count and line/space) against the standard bass-clef table;
//  - the rhythm: open/filled head, flags and dot against the step's length in beats.
// Returns { problems: [...], durs: {beats: drawnAs} }.
window.__staffCheck = async (inst, { beatsOf = (st) => (inst.uniform ? st.dur / 2 : st.dur) } = {}) => {
  const { TabView } = await import('/js/views/tabView.js');
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-5000px;top:0;width:800px;height:200px;overflow:auto';
  document.body.append(host);
  const tv = new TabView(host, {});
  tv.render(inst, { strings: 4, beatsOf, label: () => '', beatsPerBar: inst.beatsPerBar || 4, sub: 2, mode: 'staff' });
  const svg = host.querySelector('svg.staff');
  const problems = [];
  const durs = {};
  const LPC = [0, 2, 4, 5, 7, 9, 11];
  const ACC = { '-2': '♭♭', '-1': '♭', 0: '♮', 1: '♯', 2: '♯♯' };
  // staff lines: the first five <line class="tabline"> spanning the strip
  const staffLines = [...svg.querySelectorAll(':scope > line.tabline')].slice(0, 5).map((l) => Number(l.getAttribute('y1')));
  const yBottom = Math.max(...staffLines);
  const half = (yBottom - Math.min(...staffLines)) / 8;
  const yOf = (step) => yBottom - (step - 18) * half;
  // key signature: standard bass-clef places (sharps F C G D A E B, flats B E A D G C F)
  const ks = inst.keySig || 0;
  const SHARP = [24, 21, 25, 22, 19, 23, 20], FLAT = [20, 23, 19, 22, 18, 21, 17];
  const LET_SHARP = [3, 0, 4, 1, 5, 2, 6], LET_FLAT = [6, 2, 5, 1, 4, 0, 3];
  const sigEls = [...svg.querySelectorAll(':scope > text.sacc')];
  if (sigEls.length !== Math.abs(ks)) problems.push(`key signature: ${sigEls.length} glyphs for keySig ${ks}`);
  sigEls.forEach((el, k) => {
    const exp = (ks > 0 ? SHARP : FLAT)[k];
    const y = Number(el.getAttribute('y')) - 4;
    if (Math.abs(y - yOf(exp)) > 0.6) problems.push(`key signature glyph ${k + 1} at step ${((yBottom - y) / half + 18).toFixed(1)}, expected ${exp}`);
    if (el.textContent !== (ks > 0 ? '♯' : '♭')) problems.push(`key signature glyph ${el.textContent}`);
  });
  const keyAcc = {};
  (ks > 0 ? LET_SHARP : LET_FLAT).slice(0, Math.abs(ks)).forEach((l) => { keyAcc[l] = Math.sign(ks); });
  inst.steps.forEach((st, i) => {
    const g = svg.querySelector(`g[data-i="${i}"]`);
    if (!g) { problems.push(`step ${i}: no column`); return; }
    if (st.hide) { if (g.querySelector('ellipse, .sacc')) problems.push(`step ${i}: hidden step shows notes`); return; }
    const heads = [...g.querySelectorAll('ellipse.shead, text.shead')];
    const notes = st.notes;
    if (st.rest || !notes.length) return;
    if (heads.length !== notes.length) { problems.push(`step ${i}: ${heads.length} heads for ${notes.length} notes`); return; }
    const accEls = [...g.querySelectorAll('text.sacc')].map((e) => ({ t: e.textContent, y: Number(e.getAttribute('y')) - 3.5 }));
    const expAcc = [];
    notes.forEach((n, j) => {
      const w = n.midi + 12;
      const oct = (w - n.n.a - LPC[n.n.l]) / 12 - 1;
      if (!Number.isInteger(oct)) problems.push(`step ${i}: spelling ${n.n.l}/${n.n.a} does not fit midi ${n.midi}`);
      let step = oct * 7 + n.n.l;
      const va = step > 30;
      if (va) step -= 7;
      const h = heads[j];
      const y = h.tagName === 'ellipse' ? Number(h.getAttribute('cy')) : Number(h.getAttribute('y')) - 3.5;
      if (Math.abs(y - yOf(step)) > 0.6) problems.push(`step ${i}: note ${n.midi} drawn at step ${((yBottom - y) / half + 18).toFixed(1)}, expected ${step}`);
      if (n.tag !== 'x' && n.n.a !== (keyAcc[n.n.l] || 0)) expAcc.push({ t: ACC[n.n.a], y: yOf(step) });
      // ledger lines
      const need = [];
      for (let l = 16; l >= step; l -= 2) need.push(l);
      for (let l = 28; l <= step; l += 2) need.push(l);
      for (const l of need) if (![...g.querySelectorAll('line.tabline')].some((x) => Math.abs(Number(x.getAttribute('y1')) - yOf(l)) < 0.6)) problems.push(`step ${i}: missing ledger line at step ${l}`);
      if (va && !g.querySelector('.s8va')) problems.push(`step ${i}: 8va missing`);
    });
    const a1 = expAcc.map((a) => `${a.t}@${a.y.toFixed(1)}`).sort().join(' ');
    const a2 = accEls.map((a) => `${a.t}@${a.y.toFixed(1)}`).sort().join(' ');
    if (a1 !== a2) problems.push(`step ${i}: accidentals drawn [${a2}] expected [${a1}]`);
    // rhythm
    const beats = beatsOf(st);
    const open = heads.some((h) => h.classList.contains('open'));
    const flags = g.querySelectorAll('.sflag').length;
    const stem = !!g.querySelector('.sstem');
    const dot = g.querySelectorAll('circle.clefdot').length > 0;
    const drawn = `${open ? 'open' : 'filled'}${stem ? '' : ' nostem'}${flags ? ` ${flags}flag` : ''}${dot ? ' dot' : ''}`;
    const key = String(+beats.toFixed(4));
    durs[key] = durs[key] || {};
    durs[key][drawn] = (durs[key][drawn] || 0) + 1;
  });
  host.remove();
  return { problems, durs };
};
