// QA round 20 (267b86f): checks for the new content, as a classic script (or pasted into the qa tab).
// window.__pent20(): the six Pentatonic colours exercises, every lick x 12 keys x 4/5/6 strings x highest fret
//   17/20/24: chord symbols (double accidentals, C♭ F♭ E♯ B♯), note spellings, each label against the chord under
//   it (semitones and letter), frets, finger range, span inside one beat, over-fret notices, whole bars per key.
// window.__formulas20(): hm-chord-formulas, every family x 12 keys: each chord's notes against its formula (pitch
//   and letter), its symbol, and the line's frets/fingers.
// window.__harm20(): tech-harmonics and tech-harmonic-chords on 4/5/6 strings: sounding pitch (`play`) against the
//   string's harmonic series, spelling from the open string, labels against the chord, `at` within its fret.
(() => {
  const SEMI = { R: 0, '♭9': 1, '9': 2, '2': 2, '♯9': 3, '♭3': 3, '3': 4, '4': 5, '11': 5, '♯11': 6, '♭5': 6, '♯4': 6, '5': 7, '♯5': 8, '♭13': 8, '♭6': 8, '6': 9, '13': 9, '♭♭7': 9, '♭7': 10, '7': 11 };
  const NUM = (d) => { const m = String(d).match(/(\d+)$/); return m ? Number(m[1]) : (d === 'R' ? 1 : null); };
  const LET = 'CDEFGAB';
  const parseRoot = (sym) => { const m = String(sym).match(/^([A-G])([♭♯]*)/); if (!m) return null; const a = [...m[2]].reduce((x, c) => x + (c === '♯' ? 1 : -1), 0); return { l: LET.indexOf(m[1]), a }; };
  const PCL = [0, 2, 4, 5, 7, 9, 11];
  const pcOf = (n) => ((PCL[n.l] + n.a) % 12 + 12) % 12;
  const bad = (s) => /♭♭|♯♯|𝄫|𝄪|C♭|F♭|E♯|B♯/.test(s);
  async function mods() {
    const C = await import(location.origin + '/js/curriculum/index.js');
    const F = await import(location.origin + '/js/fretboard.js');
    const cm = await import(location.origin + '/js/curriculum/common.js');
    return { C, F, cm };
  }
  function labelCheck(probs, where, rootN, n, deg, nm) {
    if (deg == null || deg === '→' || deg === '' || deg === 'x') return;
    const want = SEMI[deg];
    if (want == null) { probs.push(`${where}: unknown label ${deg}`); return; }
    const got = ((pcOf(n) - pcOf(rootN)) % 12 + 12) % 12;
    if (got !== want) probs.push(`${where}: ${nm(n)} labelled ${deg} over root ${nm(rootN)} (${got} semitones)`);
    const d = NUM(deg);
    if (d != null) {
      const wantL = (d - 1) % 7;
      const gotL = ((n.l - rootN.l) % 7 + 7) % 7;
      if (wantL !== gotL) probs.push(`${where}: ${nm(n)} labelled ${deg} over ${nm(rootN)}: letter off by ${gotL - wantL}`);
    }
  }
  window.__pent20 = async function () {
    const { C, F, cm } = await mods();
    const ids = ['sc-pent-three-boxes', 'sc-pent-minor-grooves', 'sc-pent-one-phrase', 'sc-pent-major-chord', 'sc-pent-groove-fill', 'sc-pent-double-stops'];
    const probs = [];
    const stats = { builds: 0, notes: 0, maxFret: 0, overFret: 0 };
    for (const id of ids) {
      const t = C.byId.get(id);
      const lickOpts = t.params.lick ? t.params.lick.options.map((o) => o[0]) : [null];
      const patOpts = t.params.pattern ? t.params.pattern.options.map((o) => o[0]) : [null];
      const rhy = t.params.rhythm ? t.params.rhythm.options.map((o) => o[0]) : [null];
      for (const strings of [4, 5, 6]) for (const maxFret of [17, 20, 24]) for (let k = 0; k < 12; k++) for (const lick of lickOpts) for (const pattern of patOpts) for (const rhythm of rhy) {
        const S = { strings, notation: 'letters', maxFret };
        const nm = (n) => cm.nm(n, S);
        const p = { ...C.defaultParams(t), key: String(k) };
        if (lick != null) p.lick = lick;
        if (pattern != null) p.pattern = pattern;
        if (rhythm != null) p.rhythm = rhythm;
        const where0 = `${id} ${JSON.stringify(p)} ${strings}str max${maxFret}`;
        let inst;
        try { inst = t.build(p, F.makeCtx(S), S); } catch (e) { probs.push(`${where0}: threw ${e.message}`); continue; }
        stats.builds++;
        if (inst.overFret) stats.overFret++;
        let root = null, beat = 0;
        const bpb = inst.beatsPerBar || 4;
        inst.steps.forEach((st, i) => {
          if (st.chord) {
            if (bad(st.chord)) probs.push(`${where0}: chord ${st.chord}`);
            root = parseRoot(st.chord);
            if (Math.abs(beat / bpb - Math.round(beat / bpb)) > 1e-6 && id !== 'sc-pent-double-stops') probs.push(`${where0}: chord ${st.chord} starts at beat ${beat}`);
          }
          for (const n of st.notes) {
            stats.notes++;
            const name = nm(n.n);
            if (bad(name) && !/♯11|♭13|♭9|♯9/.test(n.deg)) probs.push(`${where0} step ${i}: note ${name} (${n.deg})`);
            if (n.f > maxFret && !inst.overFret) probs.push(`${where0} step ${i}: fret ${n.f} over ${maxFret} without notice`);
            stats.maxFret = Math.max(stats.maxFret, n.f);
            if (n.finger != null && !(n.finger >= 0 && n.finger <= 4)) probs.push(`${where0} step ${i}: finger ${n.finger}`);
            if (n.midi !== F.makeCtx(S).tuning[n.s] + n.f) probs.push(`${where0} step ${i}: midi ${n.midi} != string+fret`);
            if (pcOf(n.n) !== ((n.midi % 12) + 12) % 12) probs.push(`${where0} step ${i}: ${name} is not midi ${n.midi}`);
            if (root) labelCheck(probs, `${where0} step ${i}`, root, n.n, n.deg, nm);
          }
          // a double stop: two notes, one string each, frets within 4
          if (st.notes.length > 1) {
            const ss = new Set(st.notes.map((n) => n.s));
            if (ss.size < st.notes.length) probs.push(`${where0} step ${i}: two notes on one string`);
            const fr = st.notes.filter((n) => n.f > 0).map((n) => n.f);
            if (fr.length && Math.max(...fr) - Math.min(...fr) > 4) probs.push(`${where0} step ${i}: span ${Math.max(...fr) - Math.min(...fr)}`);
          }
          beat += inst.uniform ? st.dur : st.dur;
        });
        if (Math.abs(beat / bpb - Math.round(beat / bpb)) > 1e-6) probs.push(`${where0}: ${beat} beats, not whole bars`);
      }
    }
    const uniq = [...new Set(probs.map((p) => p.replace(/\{[^}]*\}/, '{…}').replace(/\d+str max\d+/, '')))];
    return { stats, problems: probs.length, kinds: uniq.slice(0, 80) };
  };

  window.__formulas20 = async function () {
    const { C, F, cm } = await mods();
    const T = await import(location.origin + '/js/theory.js');
    const t = C.byId.get('hm-chord-formulas');
    const probs = [];
    const syms = new Map();
    for (const strings of [4, 5, 6]) for (const fam of t.params.family.options.map((o) => o[0])) for (let k = 0; k < 12; k++) for (const root of t.params.root.options.map((o) => o[0])) {
      const S = { strings, notation: 'letters', maxFret: 20 };
      const nm = (n) => cm.nm(n, S);
      const p = { ...C.defaultParams(t), family: fam, key: String(k), root };
      const where = `formulas ${fam} key ${k} root ${root} ${strings}str`;
      let inst;
      try { inst = t.build(p, F.makeCtx(S), S); } catch (e) { probs.push(`${where}: threw ${e.message}`); continue; }
      let rootN = null, sym = null, notes = [];
      const flush = () => {
        if (!sym) return;
        const r = parseRoot(sym);
        const pcs = [...new Set(notes.map((n) => pcOf(n.n)))].sort((a, b) => a - b);
        const names = notes.map((n) => nm(n.n));
        if (!syms.has(sym)) syms.set(sym, names.slice(0, Math.ceil(names.length / 2) + 0).join(' '));
        if (pcOf(notes[0].n) !== pcOf(r)) probs.push(`${where}: ${sym} starts on ${names[0]}`);
        void pcs;
      };
      inst.steps.forEach((st) => {
        if (st.chord) { flush(); sym = st.chord; notes = []; rootN = parseRoot(st.chord); }
        for (const n of st.notes) {
          notes.push(n);
          if (rootN) labelCheck(probs, `${where} ${sym}`, rootN, n.n, n.deg, nm);
          if (n.finger != null && !(n.finger >= 0 && n.finger <= 4)) probs.push(`${where}: finger ${n.finger}`);
        }
      });
      flush();
      // consecutive notes: a leap of more than 5 frets on one string, or two strings apart with 5+ frets
      inst.steps.forEach((st, i) => {
        const a = inst.steps[i - 1]?.notes[0], b = st.notes[0];
        if (a && b && a.f > 0 && b.f > 0 && Math.abs(a.f - b.f) > 5) probs.push(`${where}: jump ${a.s}:${a.f} → ${b.s}:${b.f}`);
      });
      void T;
    }
    return { problems: probs.length, list: [...new Set(probs.map((p) => p.replace(/\d+str/, '')))].slice(0, 60), symbols: Object.fromEntries([...syms].slice(0, 400)) };
  };

  window.__harm20 = async function () {
    const { C, F, cm } = await mods();
    const probs = [];
    const SERIES = { 12: 12, 7: 19, 5: 24, 4: 28, 9: 28, 3: 31, 2.7: 34, 2.3: 36 };
    for (const strings of [4, 5, 6]) for (const maxFret of [17, 20, 24]) {
      const S = { strings, notation: 'letters', maxFret };
      const ctx = F.makeCtx(S);
      const nm = (n) => cm.nm(n, S);
      for (const set of ['main', 'all']) for (const order of ['fret', 'string']) {
        const t = C.byId.get('tech-harmonics');
        const inst = t.build({ ...C.defaultParams(t), set, order }, ctx, S);
        for (const st of inst.steps) for (const n of st.notes) {
          const up = n.play - ctx.tuning[n.s];
          const exp = Object.entries(SERIES).find(([, u]) => u === up);
          if (!exp) probs.push(`harmonics ${set}/${order} ${strings}: string ${n.s} sounds +${up}`);
          if (pcOf(n.n) !== n.play % 12) probs.push(`harmonics ${strings}: ${nm(n.n)} is not the sounding ${n.play}`);
          if (bad(nm(n.n))) probs.push(`harmonics ${strings}: spelled ${nm(n.n)}`);
          if (Math.abs(n.at - n.f) > 0.5) probs.push(`harmonics: at ${n.at} vs f ${n.f}`);
          if (n.finger !== 0) probs.push(`harmonics: finger ${n.finger}`);
        }
      }
      for (const style of ['roll', 'together']) {
        const t = C.byId.get('tech-harmonic-chords');
        const inst = t.build({ ...C.defaultParams(t), style }, ctx, S);
        let root = null, beat = 0;
        for (const st of inst.steps) {
          if (st.chord) { root = parseRoot(st.chord); if (beat % 4) probs.push(`harmonic chords ${style}: ${st.chord} starts at beat ${beat}`); }
          for (const n of st.notes) {
            labelCheck(probs, `harmonic chords ${style} ${strings}`, root, n.n, n.deg.replace('R', 'R'), nm);
            const sounding = n.play ?? n.midi;
            if (pcOf(n.n) !== sounding % 12) probs.push(`harmonic chords: ${nm(n.n)} vs sounding ${sounding}`);
          }
          beat += st.dur;
        }
      }
    }
    return { problems: probs.length, list: [...new Set(probs)].slice(0, 40) };
  };
})();
