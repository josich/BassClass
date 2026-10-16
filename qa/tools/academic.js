// QA (53a1753): academic sweep. Paste into the qa tab (http://127.0.0.1:8878). Runs in the background;
// progress and results in window.__acad. For every exercise x 4/5/6 strings x max fret 17/20/24 it builds
// the full option product when it is small (<= CAP), otherwise every key with every value of each other
// option plus random mixes up to CAP. Checks every note:
//  - spelling pitch class = sounding pitch class; string/fret = MIDI; finger 0-4; fret 0-24; over-max notice
//  - two notes on one string, double-stop span, durations > 0, written-rhythm bars sum to whole bars
//  - degree label vs the interval from the segment's badge root (semitones; then letter distance)
//  - chord badge vs the chord-tone degrees under it (a "3" under a minor-chord badge, etc.)
//  - backing pad (harmony.js): badges parsed from words, pad notes not in the segment / chord
window.__academic = async ({ CAP = 160, strings = [4, 5, 6], frets = [17, 20, 24], only = null, seed = 7 } = {}) => {
  const T = await import('/js/theory.js');
  const F = await import('/js/fretboard.js');
  const H = await import('/js/harmony.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  let s0 = seed;
  const rnd = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  const SEMI = { R: 0, '♭2': 1, '2': 2, '♯2': 3, '♭♭3': 2, '♭3': 3, '3': 4, '♯3': 5, '♭4': 4, '4': 5, '♯4': 6, '♭♭5': 5, '♭5': 6, '5': 7, '♯5': 8, '♭6': 8, '6': 9, '♯6': 10, '♭♭7': 9, '♭7': 10, '7': 11, '8': 0, '♭9': 1, '9': 2, '♯9': 3, '♭10': 3, '10': 4, '11': 5, '♯11': 6, '12': 7, '♭13': 8, '13': 9 };
  const steps = (d) => { if (d === 'R' || d === '8') return 0; const m = d.match(/(\d+)$/); return m ? (Number(m[1]) - 1) % 7 : null; };
  const CT = new Set(['♭3', '3', '5', '♭5', '♯5', '♭7', '7', '♭♭7']);
  const res = { builds: 0, notes: 0, t0: Date.now(), done: false, at: '', b: {} };
  window.__acad = res;
  const add = (bucket, key, sample) => {
    const b = (res.b[bucket] = res.b[bucket] || {});
    if (!b[key]) b[key] = { n: 0, s: [] };
    b[key].n++;
    if (b[key].s.length < 3) b[key].s.push(sample);
  };
  const combos = (params) => {
    const keys = Object.keys(params);
    const opts = keys.map((k) => {
      const d = params[k];
      if (d.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(d.cycles ? ['cycle4', 'cycle5', 'chromatic'] : [])];
      return d.options.map((o) => o[0]);
    });
    const total = opts.reduce((a, o) => a * o.length, 1);
    const out = [];
    if (total <= CAP) {
      const rec = (i, cur) => { if (i === keys.length) { out.push({ ...cur }); return; } for (const v of opts[i]) { cur[keys[i]] = v; rec(i + 1, cur); } };
      rec(0, {});
      return out;
    }
    const base = Object.fromEntries(keys.map((k) => [k, params[k].default]));
    out.push(base);
    const ki = keys.findIndex((k) => params[k].kind === 'key');
    keys.forEach((k, i) => {
      for (const v of opts[i]) {
        if (ki >= 0 && i !== ki) for (const kv of opts[ki].slice(0, 12)) out.push({ ...base, [k]: v, [keys[ki]]: kv });
        else out.push({ ...base, [k]: v });
      }
    });
    while (out.length < CAP) out.push(Object.fromEntries(keys.map((k, i) => [k, opts[i][Math.floor(rnd() * opts[i].length)]])));
    // keep it bounded: a deterministic thinning when the key x option list is long
    if (out.length > CAP * 3) { const step = out.length / (CAP * 3); return Array.from({ length: CAP * 3 }, (_, j) => out[Math.floor(j * step)]); }
    return out;
  };
  let lastYield = performance.now();
  const list = EXERCISES.filter((t) => !only || only.includes(t.id));
  for (const st of strings) for (const maxFret of frets) {
    const S = { strings: st, notation: 'letters', maxFret, label: 'note', backing: 'chords' };
    const ctx = F.makeCtx(S);
    for (const t of list) {
      res.at = `${st}/${maxFret} ${t.id}`;
      for (const p of combos(t.params || {})) {
        if (performance.now() - lastYield > 150) { await new Promise((r) => setTimeout(r, 0)); lastYield = performance.now(); }
        const tag = `${t.id} ${st}str/${maxFret} ${JSON.stringify(p)}`;
        let inst;
        try { inst = t.build(p, ctx, S); } catch (e) { add('error', `${t.id}: threw ${e.message}`, tag); continue; }
        res.builds++;
        if (!inst?.steps?.length) { add('error', `${t.id}: empty`, tag); continue; }
        let hi = 0, sum = 0, root = null, badge = null, chordType = null;
        inst.steps.forEach((step, i) => {
          if (step.chord || i === 0) {
            const pb = H.parseBadge(step.chord) || H.parseBadge(step.text);
            badge = step.chord || step.text || null;
            root = pb ? pb.root : null;
            chordType = pb?.type || null;
            // a badge read as a note although it is a word ("First position" = F)
            const word = String(step.chord || '').replace(/\s*\(=[^)]*\)\s*$/, '');
            if (pb && step.chord && /^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])[♭♯]*[a-z]{3,}/.test(word) && !/^[A-G][♭♯]*(maj|min|dim|aug|sus|add)/.test(word)) add('padWord', `${t.id}: "${step.chord}" read as ${T.noteName(pb.root)}`, tag);
          }
          if (!(step.dur > 0) || !Number.isFinite(step.dur)) add('error', `${t.id}: bad dur ${step.dur}`, `${tag} step ${i}`);
          sum += step.dur;
          const onStr = new Set();
          const fr = [];
          for (const n of step.notes) {
            res.notes++;
            hi = Math.max(hi, n.f);
            if (n.f > 24 || n.f < 0) add('error', `${t.id}: fret ${n.f}`, tag);
            if (ctx.tuning[n.s] + n.f !== n.midi) add('error', `${t.id}: string/fret vs midi`, `${tag} step ${i}`);
            if (!n.n || T.pc(n.n) !== T.mod(n.play ?? n.midi, 12)) add('error', `${t.id}: spelling vs pitch`, `${tag} step ${i} ${n.n && T.noteName(n.n)} ${n.midi}`);
            if (!(n.finger >= 0 && n.finger <= 4) || (n.f > 0 && n.finger === 0) || (n.f === 0 && n.finger > 0)) add('error', `${t.id}: finger ${n.finger} on fret ${n.f}`, `${tag} step ${i}`);
            if (onStr.has(n.s)) add('error', `${t.id}: two notes on one string`, `${tag} step ${i}`);
            onStr.add(n.s);
            if (n.f > 0) fr.push(n.f);
            // degree label vs the interval from the badge root
            if (root && n.n && n.deg in SEMI && n.tag !== 'x') {
              const semi = T.mod(T.pc(n.n) - T.pc(root), 12);
              if (semi !== SEMI[n.deg]) add('degSemi', `${t.id}: ${n.deg}`, `${tag} step ${i} [${badge}] ${T.noteName(n.n)}(${n.deg})`);
              else if (T.mod(n.n.l - root.l, 7) !== steps(n.deg)) add('degLetter', `${t.id}: ${n.deg}`, `[${badge}] ${T.noteName(n.n)}(${n.deg}) ${tag} step ${i}`);
              // a chord-tone degree that the chord badge does not have
              if (chordType && CT.has(n.deg)) {
                const set = new Set(T.CHORDS[chordType].iv.map((iv) => T.mod(T.semis(iv), 12)));
                if (!set.has(SEMI[n.deg])) add('badgeQuality', `${t.id}: ${n.deg} under ${T.CHORDS[chordType].sym || 'maj'}`, `[${badge}] ${T.noteName(n.n)}(${n.deg}) ${tag} step ${i}`);
              }
            }
          }
          if (fr.length > 1 && Math.max(...fr) - Math.min(...fr) > 4) add('error', `${t.id}: double-stop span ${Math.max(...fr) - Math.min(...fr)}`, `${tag} step ${i}`);
        });
        if (hi > maxFret && !inst.overFret) add('error', `${t.id}: fret ${hi} over max ${maxFret} without notice`, tag);
        if (!inst.uniform) {
          const bpb = inst.beatsPerBar || 4;
          if (Math.abs(sum / bpb - Math.round(sum / bpb)) > 1e-6) add('bars', `${t.id}`, `${tag} sum ${sum} bpb ${bpb}`);
        }
        // backing pad: chord pad notes must be chord tones / tones of the segment
        const track = H.harmonyTrack(inst, 'chords');
        for (let i = 0; i < track.length; i++) {
          if (!track[i]) continue;
          let j = i + 1;
          while (j < inst.steps.length && !inst.steps[j].chord) j++;
          const pcs = new Set();
          for (let k = i; k < j; k++) for (const n of inst.steps[k].notes) pcs.add(T.mod(n.play ?? n.midi, 12));
          const pad = track[i].map((m) => T.mod(m, 12));
          const missing = pad.filter((x) => !pcs.has(x));
          if (missing.length) add('padNotInSegment', `${t.id}`, `${tag} step ${i} [${inst.steps[i].chord || inst.steps[i].text}] pad ${track[i].join(',')} segment pcs ${[...pcs].join(',')}`);
        }
      }
    }
  }
  res.done = true;
  res.ms = Date.now() - res.t0;
  return res;
};
