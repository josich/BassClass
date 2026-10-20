// QA (d25bf3c): walking / groove / slap / harmony-pattern line checker (e848c26 keyLines, stepSpell,
// two-feel, 5th approach, 2-beat chord-tone bars). Paste into the qa tab; run
// window.__walk({ strings, ids, keys }) -> { builds, counts, samples }.
// Every build is read as a melodic line (single-note steps, rests skipped, ghost notes kept) and
// checked against known rules:
//  - approach ("→"): resolves by a half or whole step into the next note (enclosure: the note after
//    the pair), across key changes and the loop; never the pitch class just played;
//  - approach spelling: the letter next to its target's letter (F♯ above E, not G♭), unless that
//    spelling would need a double accidental or C♭/F♭/E♯/B♯ (then plain is fine), or the note is
//    spelled as a chord tone of the current chord;
//  - walking lines: no leap over an octave (consecutive notes, also at the key change and the loop);
//  - two-feel: a chord holding one note plays its root;
//  - 2-beat chord-tone bars: R then the 5th (above or below);
//  - 5th approach grooves: the approach note is not the current chord's root.
window.__walk = async ({ strings = 4, ids = null, keys = null, maxFret = 20, progs = null } = {}) => {
  const T = await import('/js/theory.js'); const F = await import('/js/fretboard.js');
  const { EXERCISES } = await import('/js/curriculum/index.js');
  const S = { strings, notation: 'letters', maxFret }; const ctx = F.makeCtx(S);
  const res = { builds: 0, notes: 0, counts: {}, samples: {}, done: false, at: '', t0: Date.now() };
  window.__wk = res;
  const add = (k, m) => { res.counts[k] = (res.counts[k] || 0) + 1; (res.samples[k] = res.samples[k] || []); if (res.samples[k].length < 6) res.samples[k].push(m); };
  const nm = (n) => n ? 'CDEFGAB'[n.l] + (n.a > 0 ? '#'.repeat(n.a) : 'b'.repeat(-n.a)) : '?';
  const awk = (n) => Math.abs(n.a) > 1 || (n.a === 1 && (n.l === 2 || n.l === 6)) || (n.a === -1 && (n.l === 0 || n.l === 3));
  const LPC = [0, 2, 4, 5, 7, 9, 11];
  const pcOf = (n) => ((LPC[n.l] + n.a) % 12 + 12) % 12;
  const list = EXERCISES.filter((t) => ids ? ids.includes(t.id) : (['walking', 'grooves', 'slap'].includes(t.module) || ['hm-chord-tones', 'hm-minor-keys', 'hm-colour-chords', 'hm-12-bar-blues', 'arp-approach'].includes(t.id) || /^(gr|wk|sl)-/.test(t.id)));
  for (const t of list) {
    res.at = t.id;
    const pk = Object.keys(t.params || {});
    const optsOf = (k) => { const d = t.params[k]; if (d.kind === 'key') return keys || ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', ...(d.cycles ? ['cycle4', 'cycle5', 'chromatic'] : [])]; return d.options.filter((o) => !o[2]?.minStrings || strings >= o[2].minStrings).map((o) => o[0]); };
    // all combinations of the select params (they are few), times every key
    let combos = [{}];
    for (const k of pk) { const vals = (k === 'prog' && progs) ? progs.filter((v) => optsOf(k).includes(v)) : optsOf(k); const nx = []; for (const c of combos) for (const v of vals) nx.push({ ...c, [k]: v }); combos = nx; if (combos.length > 4000) break; }
    for (const p of combos) {
      let inst; try { inst = t.build(p, ctx, S); } catch (e) { add('threw', `${t.id} ${JSON.stringify(p)} ${e.message}`); continue; }
      res.builds++;
      const tag = `${t.id} ${JSON.stringify(p)}`;
      // the line: single-note steps; chord badges carried
      const seq = []; let chord = null, chordIdx = -1, beat = 0;
      inst.steps.forEach((st, i) => {
        if (st.chord) { chord = st.chord; chordIdx++; }
        if (!st.rest && st.notes.length === 1) seq.push({ i, n: st.notes[0], chord, ci: chordIdx, beat, newChord: !!st.chord, dur: st.dur });
        else if (!st.rest && st.notes.length > 1) seq.push({ i, multi: true, chord, ci: chordIdx, beat });
        beat += st.dur;
      });
      const ns = seq.filter((x) => !x.multi);
      res.notes += ns.length;
      const walking = t.module === 'walking' || /^wk-/.test(t.id);
      for (let j = 0; j < ns.length; j++) {
        const a = ns[j], b = ns[(j + 1) % ns.length], c = ns[(j + 2) % ns.length], prev = ns[(j - 1 + ns.length) % ns.length];
        const loop = j + 1 >= ns.length ? ' (loop)' : '';
        if (a.n.deg === '→') {
          const target = b.n.deg === '→' && Math.abs(c.n.midi - b.n.midi) <= 2 && Math.abs(c.n.midi - a.n.midi) <= 2 ? c : b;
          const d = target.n.midi - a.n.midi;
          if (Math.abs(d) > 2 || d === 0) add('approachNotResolving', `${tag} step ${a.i} [${a.chord}] ${nm(a.n.n)}${a.n.midi} -> ${nm(target.n.n)}${target.n.midi} [${target.chord}]${loop}`);
          if (prev && prev !== a && prev.n.tag !== 'x' && ((prev.n.midi - a.n.midi) % 12 + 12) % 12 === 0) add('approachRepeats', `${tag} step ${a.i} ${nm(a.n.n)}${a.n.midi} after ${nm(prev.n.n)}${prev.n.midi}`);
          // spelling as a step from the target
          if (Math.abs(d) <= 2 && d !== 0) {
            const dl = ((a.n.n.l - target.n.n.l) % 7 + 7) % 7;
            const want = d < 0 ? 1 : 6; // approach above the target: the letter above
            if (dl !== want) {
              // the step spelling and whether it is awkward
              const l = (target.n.n.l + (d < 0 ? 1 : 6)) % 7;
              let acc = ((a.n.midi - LPC[l]) % 12 + 12) % 12; if (acc > 6) acc -= 12;
              const stepN = { l, a: acc };
              const stepOk = Math.abs(acc) <= 1 && !awk(stepN);
              if (stepOk) add(`approachSpelling${Math.abs(d) === 1 ? 'Half' : 'Whole'}`, `${tag} step ${a.i} [${a.chord}] ${nm(a.n.n)} -> ${nm(target.n.n)} (as a step: ${nm(stepN)})${loop}`);
            }
          }
        }
        if (walking && j + 1 < ns.length + 1) {
          const d = Math.abs(b.n.midi - a.n.midi);
          if (d > 12) add('walkLeapOverOctave', `${tag} step ${a.i} ${nm(a.n.n)}${a.n.midi}(${a.n.deg}) -> ${nm(b.n.n)}${b.n.midi}(${b.n.deg})${loop}`);
          else if (d > 9) add('walkLeap10to12', `${tag} step ${a.i} ${nm(a.n.n)}${a.n.midi} -> ${nm(b.n.n)}${b.n.midi}${loop}`);
        }
      }
      // per chord checks
      const byChord = new Map();
      for (const x of seq) { if (!byChord.has(x.ci)) byChord.set(x.ci, []); byChord.get(x.ci).push(x); }
      for (const [ci, xs] of byChord) {
        const notes = xs.filter((x) => !x.multi);
        if (!notes.length) continue;
        if (t.id === 'wk-two-feel' && notes.length === 1 && notes[0].n.deg !== 'R') add('twoFeelSingleNotRoot', `${tag} [${notes[0].chord}] ${nm(notes[0].n.n)}(${notes[0].n.deg})`);
        if (notes[0].newChord && notes[0].n.deg === '→') add('approachOnDownbeat', `${tag} [${notes[0].chord}] ${nm(notes[0].n.n)}${notes[0].n.midi}`);
        if (t.id === 'wk-chord-tones' && notes.length === 2) {
          const [r, f] = notes;
          if (r.n.deg !== 'R' || f.n.deg !== '5') add('ctTwoBeat', `${tag} [${r.chord}] ${nm(r.n.n)}(${r.n.deg}) ${nm(f.n.n)}(${f.n.deg})`);
        }
      }
      if (/fifthApproach/.test(JSON.stringify(p))) {
        for (const [ci, xs] of byChord) { const nsx = xs.filter((x) => !x.multi); const root = nsx[0]; for (const x of nsx.slice(1)) if (x.n.deg === '→' && ((x.n.midi - root.n.midi) % 12 + 12) % 12 === 0) add('fifthApproachIsRoot', `${tag} [${root.chord}] ${nm(x.n.n)}`); }
      }
      if (res.builds % 50 === 0) await new Promise((r) => setTimeout(r, 0));
    }
  }
  res.done = true; res.ms = Date.now() - res.t0; return res;
};
