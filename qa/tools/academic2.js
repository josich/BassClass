// QA (ea7705f): academic sweep v2. Paste into the qa tab (http://127.0.0.1:8878). Runs in the background;
// progress and results in window.__acad. Like academic.js (every exercise x 4/5/6 strings x max fret
// 17/20/24, option product up to CAP, else every key x every value), plus:
//  - options marked { minStrings } are only tried on basses that have them (as the app does);
//  - labels under "implies X" text (lk-implied) are checked against the implied chord;
//  - slap: H goes up on the string of the note before, PO goes down on it, a run of H/PO fits 4 frets,
//    a pop never on the string the thumb just played; counts pops on the two lowest strings;
//  - approach notes ("→"): never the note just played, and they resolve by a half or whole step;
//  - harmonised triads/7ths (diatonicBuild): per chord, fretted span <= 4 and <= 2 notes on a string;
//  - tri-scale-forms: root under the named finger, fingers 1-4, shifts per form, strings never go back;
//  - ear training: the hidden chord and the answer one note per string; the answer names what played;
//  - reading: no labels/prompt, no tritone leaps;
//  - backing: chord-looking badges the pad cannot read (no backing there);
//  - walking: leaps > 7 semitones inside the line and at the loop point, range under C4, two-feel half notes;
//  - superimposition: notes inside the named pentatonic / parent melodic minor.
window.__academic2 = async ({ CAP = 120, strings = [4, 5, 6], frets = [17, 20, 24], only = null, seed = 11 } = {}) => {
  const T = await import('/js/theory.js');
  const F = await import('/js/fretboard.js');
  const H = await import('/js/harmony.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  let s0 = seed;
  const rnd = () => { s0 = (s0 * 16807) % 2147483647; return s0 / 2147483647; };
  const SEMI = { R: 0, '♭2': 1, '2': 2, '♯2': 3, '♭3': 3, '3': 4, '♯3': 5, '♭4': 4, '4': 5, '♯4': 6, '♭5': 6, '5': 7, '♯5': 8, '♭6': 8, '6': 9, '♯6': 10, '♭♭7': 9, '♭7': 10, '7': 11, '8': 0, '♭9': 1, '9': 2, '♯9': 3, '♭10': 3, '10': 4, '11': 5, '♯11': 6, '12': 7, '♭13': 8, '13': 9 };
  const res = { builds: 0, notes: 0, t0: Date.now(), done: false, at: '', b: {}, info: {} };
  window.__acad = res;
  const add = (bucket, key, sample) => {
    const b = (res.b[bucket] = res.b[bucket] || {});
    if (!b[key]) b[key] = { n: 0, s: [] };
    b[key].n++;
    if (b[key].s.length < 3) b[key].s.push(sample);
  };
  const info = (k, v = 1) => { res.info[k] = (res.info[k] || 0) + v; };
  const combos = (params, st) => {
    const keys = Object.keys(params);
    const opts = keys.map((k) => {
      const d = params[k];
      if (d.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(d.cycles ? ['cycle4'] : [])];
      return d.options.filter((o) => !o[2]?.minStrings || st >= o[2].minStrings).map((o) => o[0]);
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
    if (out.length > CAP * 3) { const step = out.length / (CAP * 3); return Array.from({ length: CAP * 3 }, (_, j) => out[Math.floor(j * step)]); }
    return out;
  };
  const MAJ_PENT = [0, 2, 4, 7, 9], MEL_MIN = [0, 2, 3, 5, 7, 9, 11];
  const QUAL = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], aug: [0, 4, 8] };
  const DIATONIC = /diatonic|sus-quartal/;
  let lastYield = performance.now();
  const list = EXERCISES.filter((t) => !only || only.includes(t.id));
  for (const st of strings) for (const maxFret of frets) {
    const S = { strings: st, notation: 'letters', maxFret, label: 'note', backing: 'chords' };
    const ctx = F.makeCtx(S);
    for (const t of list) {
      res.at = `${st}/${maxFret} ${t.id}`;
      for (const p of combos(t.params || {}, st)) {
        if (performance.now() - lastYield > 150) { await new Promise((r) => setTimeout(r, 0)); lastYield = performance.now(); }
        const tag = `${t.id} ${st}str/${maxFret} ${JSON.stringify(p)}`;
        let inst;
        try { inst = t.build(p, ctx, S); } catch (e) { add('error', `${t.id}: threw ${e.message}`, tag); continue; }
        res.builds++;
        if (!inst?.steps?.length) { add('error', `${t.id}: empty`, tag); continue; }
        const steps = inst.steps;
        let hi = 0, sum = 0, root = null, badge = null;
        const seq = []; // single-note steps in order (for slap / approach / walking checks)
        steps.forEach((step, i) => {
          if (step.chord || i === 0) {
            const pb = H.parseBadge(step.chord) || H.parseBadge(step.text);
            badge = step.chord || step.text || null;
            root = pb ? pb.root : null;
            // a chord-looking badge the pad cannot read
            if (step.chord && !pb && /^[A-G][♭♯]*(m|maj|7|9|6|°|ø|\+|sus|add|dim|aug|$)/.test(step.chord) && !/^(#|Pos|Fret|First|E string)/.test(step.chord)) add('padUnread', `${t.id}: "${step.chord}"`, tag);
          }
          const im = /^implies (.+)$/.exec(step.text || '');
          if (im) { const pb = H.parseBadge(im[1]); badge = `implied ${im[1]}`; root = pb ? pb.root : null; if (!pb) add('error', `${t.id}: implied chord "${im[1]}" unreadable`, tag); }
          if (!(step.dur > 0) || !Number.isFinite(step.dur)) add('error', `${t.id}: bad dur ${step.dur}`, `${tag} step ${i}`);
          sum += step.dur;
          const onStr = new Map();
          const fr = [];
          for (const n of step.notes) {
            res.notes++;
            hi = Math.max(hi, n.f);
            if (n.f > 24 || n.f < 0) add('error', `${t.id}: fret ${n.f}`, tag);
            if (ctx.tuning[n.s] + n.f !== n.midi) add('error', `${t.id}: string/fret vs midi`, `${tag} step ${i}`);
            if (!n.n || T.pc(n.n) !== T.mod(n.play ?? n.midi, 12)) add('error', `${t.id}: spelling vs pitch`, `${tag} step ${i} ${n.n && T.noteName(n.n)} ${n.midi}`);
            if (!(n.finger >= 0 && n.finger <= 4) || (n.f > 0 && n.finger === 0) || (n.f === 0 && n.finger > 0)) add('error', `${t.id}: finger ${n.finger} on fret ${n.f}`, `${tag} step ${i}`);
            onStr.set(n.s, (onStr.get(n.s) || 0) + 1);
            if (n.f > 0) fr.push(n.f);
            if (root && n.n && n.deg in SEMI && n.tag !== 'x' && n.deg !== '→') {
              const semi = T.mod(T.pc(n.n) - T.pc(root), 12);
              if (semi !== SEMI[n.deg]) add('degSemi', `${t.id}: ${n.deg}`, `${tag} step ${i} [${badge}] ${T.noteName(n.n)}(${n.deg})`);
            }
          }
          if ([...onStr.values()].some((c) => c > 1)) add('error', `${t.id}: two notes on one string`, `${tag} step ${i}`);
          if (fr.length > 1 && Math.max(...fr) - Math.min(...fr) > 4) add('error', `${t.id}: double-stop span ${Math.max(...fr) - Math.min(...fr)}`, `${tag} step ${i}`);
          if (step.notes.length === 1 && !step.rest) seq.push({ i, n: step.notes[0], step, badge });
          else if (step.rest || !step.notes.length) seq.push({ i, rest: true, step });
          else seq.push({ i, chord: true, step });
        });
        if (hi > maxFret && !inst.overFret) add('error', `${t.id}: fret ${hi} over max ${maxFret} without notice`, tag);
        if (!inst.uniform) {
          const bpb = inst.beatsPerBar || 4;
          if (Math.abs(sum / bpb - Math.round(sum / bpb)) > 1e-6) add('bars', `${t.id}`, `${tag} sum ${sum} bpb ${bpb}`);
        }
        // ---- slap rules
        if (t.module === 'slap' || /^sl-/.test(t.id)) {
          let run = null;
          for (let j = 1; j < seq.length; j++) {
            const a = seq[j - 1], b = seq[j];
            if (b.rest || b.chord || a.rest || a.chord) { run = null; continue; }
            const tg = b.n.tag;
            if (tg === 'H' || tg === 'PO') {
              info('slap H/PO');
              if (b.n.s !== a.n.s) add('slap', `${t.id}: ${tg} from another string`, `${tag} step ${b.i}`);
              else if (tg === 'H' && !(b.n.f > a.n.f)) add('slap', `${t.id}: H not going up`, `${tag} step ${b.i} ${a.n.f}->${b.n.f}`);
              else if (tg === 'PO' && !(b.n.f < a.n.f)) add('slap', `${t.id}: PO not going down`, `${tag} step ${b.i} ${a.n.f}->${b.n.f}`);
              run = run || [a.n.f];
              run.push(b.n.f);
              const frs = run.filter((x) => x > 0);
              if (frs.length && Math.max(...frs) - Math.min(...frs) > 3) add('slapSpan', `${t.id}: H/PO run spans ${Math.max(...frs) - Math.min(...frs)} frets`, `${tag} step ${b.i} frets ${run.join(',')}`);
            } else run = null;
            if (tg === 'P') {
              info('slap P');
              if ((a.n.tag === 'T' || a.n.tag === 'x' || /^T/.test(a.n.tag || '')) && a.n.s === b.n.s) add('slap', `${t.id}: pop on the thumb's string`, `${tag} step ${b.i}`);
              info(`slap pop on string index ${b.n.s} of ${st}`);
            }
          }
        }
        // ---- approach notes
        if (['grooves', 'walking', 'slap'].includes(t.module) || /^(gr|wk|sl)-/.test(t.id)) {
          for (let j = 1; j < seq.length; j++) {
            const a = seq[j - 1], b = seq[j];
            if (!b.n || b.n.deg !== '→') continue;
            info(`${t.module} approaches`);
            if (a.n && T.mod(a.n.midi - b.n.midi, 12) === 0) add('approach', `${t.id}: approach repeats the note before`, `${tag} step ${b.i} ${T.noteName(b.n.n)}`);
            const c = seq[(j + 1) % seq.length];
            if (c && c.n && Math.abs(c.n.midi - b.n.midi) > 2) add('approachRes', `${t.id}: approach resolves by ${c.n.midi - b.n.midi} semitones`, `${tag} step ${b.i} ${T.noteName(b.n.n)}${b.n.midi} -> ${T.noteName(c.n.n)}${c.n.midi}${j + 1 >= seq.length ? ' (loop)' : ''}`);
          }
        }
        // ---- walking: leaps, range, two-feel
        if (t.module === 'walking') {
          const ns = seq.filter((x) => x.n && x.n.tag !== 'x');
          for (let j = 0; j < ns.length; j++) {
            const a = ns[j], b = ns[(j + 1) % ns.length];
            const d = Math.abs(b.n.midi - a.n.midi);
            info('walk steps');
            if (d > 7) add('walkLeap', `${t.id}: leap ${d}${j + 1 === ns.length ? ' (loop)' : ''}`, `${tag} step ${a.i} ${T.noteName(a.n.n)}${a.n.midi}(${a.n.deg}) -> ${T.noteName(b.n.n)}${b.n.midi}(${b.n.deg})`);
            if (a.n.midi > 60) add('walkHigh', `${t.id}: above C4`, `${tag} step ${a.i} ${a.n.midi}`);
          }
          if (t.id === 'wk-two-feel') for (const x of ns) if (Math.abs(x.step.dur - 2) > 1e-6) add('twoFeel', `${t.id}: note of ${x.step.dur} beats`, `${tag} step ${x.i}`);
        }
        // ---- harmonised chords: one hand shape per chord
        if (DIATONIC.test(t.id)) {
          let g = [];
          const flush = () => {
            if (!g.length) return;
            const frs = g.filter((n) => n.f > 0).map((n) => n.f);
            const span = frs.length ? Math.max(...frs) - Math.min(...frs) : 0;
            const per = {}; for (const n of g) per[n.s] = (per[n.s] || 0) + 1;
            info('harm chords');
            if (span > 4) add('harmShape', `${t.id}: chord spans ${span} frets`, `${tag} ${g.map((n) => `${n.s}/${n.f}`).join(' ')}`);
            if (Object.values(per).some((c) => c > 2)) add('harmShape', `${t.id}: three notes on one string`, tag);
            g = [];
          };
          for (const step of steps) { if (step.chord) flush(); for (const n of step.notes) g.push(n); }
          flush();
        }
        // ---- the 3 scale fingerings
        if (t.id === 'tri-scale-forms') {
          const segs = [];
          steps.forEach((step) => { if (step.text && /Root under finger/.test(step.text)) segs.push({ fg: Number(step.text.match(/finger (\d)/)[1]), notes: [] }); if (segs.length) for (const n of step.notes) segs[segs.length - 1].notes.push(n); });
          for (const sg of segs) {
            const up = p.dir === 'down' ? [...sg.notes].reverse() : sg.notes.slice(0, 8);
            if (up.length !== 8) { add('forms', `${t.id}: ${up.length} notes in a form`, tag); continue; }
            if (up[0].finger !== sg.fg) add('forms', `${t.id}: root under finger ${up[0].finger}, text says ${sg.fg}`, tag);
            let shifts = 0, back = 0;
            for (let j = 1; j < up.length; j++) {
              const p0 = up[j - 1].f - up[j - 1].finger + 1, p1 = up[j].f - up[j].finger + 1;
              if (p0 !== p1) shifts++;
              if (up[j].s < up[j - 1].s) back++;
            }
            if (back) add('forms', `${t.id}: strings go back while ascending`, tag);
            if (up.some((n) => !(n.finger >= 1 && n.finger <= 4))) add('forms', `${t.id}: finger outside 1-4`, tag);
            const scale = T.SCALES[p.type].iv.map((iv) => T.semis(iv));
            const got = up.map((n) => T.mod(n.midi - up[0].midi, 12));
            if (got.slice(0, 7).join() !== scale.join() || up[7].midi - up[0].midi !== 12) add('forms', `${t.id}: not the scale`, `${tag} ${got.join(',')}`);
            info(`forms ${p.type} f${sg.fg} root-str${up[0].s} ${st}str shifts=${shifts}`);
          }
          if (p.dir === 'updown') for (const sg of segs) { const n = sg.notes; const a = n.slice(0, 8), d = n.slice(7).reverse(); if (a.map((x) => `${x.s}/${x.f}/${x.finger}`).join() !== d.map((x) => `${x.s}/${x.f}/${x.finger}`).join()) add('forms', `${t.id}: descent fingered differently`, tag); }
        }
        // ---- ear training
        if (t.module === 'ear') {
          steps.forEach((step, i) => {
            if ((step.hide || step.silent) && step.notes.length > 1) {
              const ss = step.notes.map((n) => n.s);
              if (new Set(ss).size < ss.length) add('ear', `${t.id}: two notes on one string`, `${tag} step ${i}`);
              if (ss.some((s, j) => j && s < ss[j - 1])) add('ear', `${t.id}: strings not ascending`, `${tag} step ${i}`);
            }
            if (step.silent && step.text && t.id !== 'ear-progressions') {
              // the answer: "G♯° · Diminished" against the notes of the hidden block chord before it
              const blk = [...steps.slice(0, i)].reverse().find((x) => x.hide && x.notes.length > 1);
              if (!blk) return;
              const r0 = Math.min(...blk.notes.map((n) => n.midi));
              const ivs = [...new Set(blk.notes.map((n) => T.mod(n.midi - r0, 12)))].sort((a, b) => a - b).join(',');
              const ty = Object.entries(T.CHORDS).find(([, c]) => c.name === step.text.split(' · ')[1]);
              const want = ty ? [...new Set(ty[1].iv.map((iv) => T.mod(T.semis(iv), 12)))].sort((a, b) => a - b).join(',') : '?';
              if (ivs !== want) add('ear', `${t.id}: answer "${step.text}" vs intervals ${ivs}`, `${tag} step ${i}`);
              const pb = H.parseBadge(step.text.split(' · ')[0]);
              if (!pb || T.pc(pb.root) !== T.mod(r0, 12)) add('ear', `${t.id}: answer root`, `${tag} step ${i} ${step.text}`);
              info('ear answers');
            }
          });
        }
        // ---- reading
        if (t.module === 'reading') {
          if (inst.label !== 'none' || !inst.noPrompt) add('reading', `${t.id}: label ${inst.label} noPrompt ${inst.noPrompt}`, tag);
          const ns = steps.filter((x) => x.notes.length === 1).map((x) => x.notes[0].midi);
          for (let j = 1; j < ns.length; j++) { info('reading moves'); if (Math.abs(ns[j] - ns[j - 1]) % 12 === 6) add('readingTritone', `${t.id}: tritone leap`, `${tag} ${ns[j - 1]}->${ns[j]}`); }
        }
        // ---- superimposition
        if (t.id === 'md-pentatonic-superimposition' || t.id === 'md-melodic-superimposition') {
          let set = null, cr = null, label = '';
          steps.forEach((step, i) => {
            if (step.chord) { const pb = H.parseBadge(step.chord); cr = pb?.root; }
            if (step.text) {
              const m = /^(\S+) (major pentatonic|melodic minor)$/.exec(step.text);
              const pb = m && H.parseBadge(m[1]);
              if (!pb) { add('super', `${t.id}: text "${step.text}"`, tag); set = null; return; }
              const iv = m[2] === 'melodic minor' ? MEL_MIN : MAJ_PENT;
              set = new Set(iv.map((x) => T.mod(T.pc(pb.root) + x, 12)));
              label = step.text;
            }
            for (const n of step.notes) { info(`${t.id} notes`); if (set && !set.has(T.mod(n.midi, 12))) add('super', `${t.id}: note outside "${label}"`, `${tag} step ${i} [${step.chord || ''}] ${T.noteName(n.n)}`); }
          });
        }
      }
    }
  }
  res.done = true;
  res.ms = Date.now() - res.t0;
  return res;
};
