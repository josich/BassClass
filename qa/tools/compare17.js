// QA round 17: every exercise with a progression option, every progression x every key, built by the
// 70c3e4e modules (served with CORS by cors_serve.py on :8883) and by the page's own (f600870), compared
// badge by badge and note by note. Spelling only changed in 2487b4a (progChords), so every difference is
// that change at work. Classic script; run `await __compare17()`.
(() => {
  window.__compare17 = async ({ oldBase = 'http://127.0.0.1:8883', strings = 4 } = {}) => {
    const NEW = (p) => import(location.origin + p); const OLD = (p) => import(oldBase + p);
    const [In, Io, Fn, Fo, Tn] = await Promise.all([NEW('/js/curriculum/index.js'), OLD('/js/curriculum/index.js'), NEW('/js/fretboard.js'), OLD('/js/fretboard.js'), NEW('/js/theory.js')]);
    const S = { strings, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords' };
    const sig = (inst) => inst.steps.map((st) => `${st.chord ? '[' + st.chord + ']' : ''}${st.rest ? 'r' : st.notes.map((n) => Tn.noteName(n.n) + (n.deg ?? '')).join('+')}`);
    const diffs = []; let builds = 0;
    for (const tn of In.EXERCISES) {
      const to = Io.byId.get(tn.id); if (!to) continue;
      const progP = tn.params?.prog; if (!progP?.options) continue;
      const keyP = Object.entries(tn.params).find(([, d]) => d.kind === 'key');
      const keys = keyP ? Tn.CHROMATIC_PC.map(String) : [null];
      for (const [prog] of progP.options) for (const k of keys) {
        const p = { ...In.defaultParams(tn), prog, ...(keyP ? { [keyP[0]]: k } : {}) };
        let a, b;
        try { a = sig(tn.build(p, Fn.makeCtx(S), S)); b = sig(to.build(p, Fo.makeCtx(S), S)); } catch (e) { diffs.push({ id: tn.id, prog, k, err: e.message }); continue; }
        builds++;
        const i = a.findIndex((x, j) => x !== b[j]);
        if (i >= 0 || a.length !== b.length) {
          const badge = (arr, j) => { for (let q = j; q >= 0; q--) if (arr[q]?.startsWith('[')) return arr[q].match(/^\[[^\]]*\]/)[0]; return ''; };
          diffs.push({ id: tn.id, prog, k, at: i, old: `${badge(b, i)} ${b.slice(i, i + 6).join(' ')}`, now: `${badge(a, i)} ${a.slice(i, i + 6).join(' ')}` });
        }
      }
    }
    return { builds, n: diffs.length, diffs };
  };
})();
