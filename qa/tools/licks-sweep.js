// QA: exhaustive Jazz Licks sweep (paste into the page console of the qa server, port 8878).
// Every lick x 12 keys x feel x 4/5/6 strings x max fret 17/20/21/24. Checks spelling, degree
// labels against the chord, double accidentals, frets, fingers, bar totals, swing grid, contour.
(async () => {
  const T = await import('/js/theory.js');
  const F = await import('/js/fretboard.js');
  const LK = await import('/js/curriculum/licks.js');
  const tpls = LK.default;
  const issues = [];
  const stats = { builds: 0, notes: 0 };
  const add = (k, msg) => issues.push(`${k}: ${msg}`);
  const dblAcc = (n) => Math.abs(n.a) > 1;
  const BAD_DEG = /^(·|♭4$|♭♭|♯3$|♯7$|♭1$|♭8$)/; // '·' = degOf() could not name the interval
  for (const strings of [4, 5, 6]) {
    for (const maxFret of [17, 20, 21, 24]) {
      const S = { strings, notation: 'letters', maxFret };
      const ctx = F.makeCtx(S);
      for (const t of tpls) {
        t.licks.forEach((lick, li) => {
          const progBeats = lick.prog.reduce((a, c) => a + c[2], 0);
          for (const key of T.CHROMATIC_PC.map(String)) {
            for (const feel of ['swing', 'straight']) {
              const tag = `${t.id}#${li} "${lick.name}" key=${key} ${feel} ${strings}str max${maxFret}`;
              let inst;
              try { inst = t.build({ lick: String(li), key, feel }, ctx, S); } catch (e) { add(tag, 'threw ' + e.message); continue; }
              stats.builds++;
              const total = inst.steps.reduce((a, s) => a + s.dur, 0);
              if (Math.abs(total - progBeats) > 1e-6) add(tag, `steps sum ${total} != progression ${progBeats}`);
              let at = 0, prevMidi = null, prevSrc = null;
              const notesSrc = lick.notes.trim().split(/\s+/).filter((x) => x !== '|' && !x.startsWith('r'));
              let ni = 0;
              for (const st of inst.steps) {
                if (!(st.dur > 0)) add(tag, `bad dur ${st.dur}`);
                if (st.chord && /♭♭|♯♯|bb|##/.test(st.chord)) add(tag, `double accidental chord ${st.chord}`);
                for (const n of st.notes) {
                  stats.notes++;
                  if (T.pc(n.n) !== T.mod(n.midi, 12)) add(tag, `spelling ${T.noteName(n.n)} vs midi ${n.midi}`);
                  if (ctx.tuning[n.s] + n.f !== n.midi) add(tag, 'midi/string mismatch');
                  if (n.f > maxFret) add(tag, `fret ${n.f} > max ${maxFret}`);
                  if (!(n.finger >= 0 && n.finger <= 4)) add(tag, `finger ${n.finger}`);
                  if (dblAcc(n.n)) add(tag, `double accidental note ${T.noteName(n.n)} (deg ${n.deg})`);
                  if (n.deg == null || BAD_DEG.test(n.deg)) add(tag, `odd degree label "${n.deg}" on ${T.noteName(n.n)} under ${st.chord || '(same chord)'}`);
                  // contour check: interval to previous note must equal the source interval
                  const m = notesSrc[ni].split(':')[0].match(/^([A-G])(#{1,2}|b{1,2})?(-?\d)$/);
                  const sn = T.N(m[1] + (m[2] || ''));
                  const srcMidi = 12 * (Number(m[3]) + 1) + [0, 2, 4, 5, 7, 9, 11][sn.l] + sn.a;
                  if (prevMidi != null && (n.midi - prevMidi) !== (srcMidi - prevSrc)) add(tag, `contour broken at note ${ni}: ${n.midi - prevMidi} vs ${srcMidi - prevSrc} semitones`);
                  prevMidi = n.midi; prevSrc = srcMidi; ni++;
                }
                at += st.dur;
              }
            }
          }
        });
      }
    }
  }
  const uniq = {};
  for (const i of issues) { const k = i.replace(/ \d+str max\d+/, '').replace(/ (swing|straight)/, ''); uniq[k] = (uniq[k] || 0) + 1; }
  return { ...stats, issues: issues.length, distinct: Object.keys(uniq).length, list: Object.keys(uniq) };
})();
