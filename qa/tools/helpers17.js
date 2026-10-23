// QA round 17 helpers (classic script, imports the app's modules by absolute URL; see checks17.js for loading).
//   Q.b(id, params, settings)  build an exercise as the app does
//   brief(id, params, max)     chord/text badges with the note names and degrees under each
//   __neck()                   a detached Neck block for spelling checks: own(pc, set, labels), fol(lead)
(() => {
  const M = (p) => import(location.origin + p);
  window.__helpers17 = (async () => {
    const T = await M('/js/theory.js'); const F = await M('/js/fretboard.js'); const I = await M('/js/curriculum/index.js');
    window.Q = {
      T, F, I,
      S(o = {}) { return { strings: 4, notation: 'letters', maxFret: 20, label: 'note', backing: 'chords', ...o }; },
      t(id) { return typeof id === 'number' ? I.EXERCISES.find((x) => x.num === id) : I.byId.get(id); },
      b(id, p = {}, so = {}) { const t = Q.t(id); const S = Q.S(so); const ctx = F.makeCtx(S); return t.build({ ...I.defaultParams(t), ...p }, ctx, S); },
      nn(n) { return n ? T.noteName(n) : '?'; },
    };
    window.brief = (id, p, max = 60, so) => {
      const inst = Q.b(id, p, so); const labs = []; let cur = null;
      for (const st of inst.steps) {
        if (st.chord || st.text) { cur = { h: `${st.chord ?? ''}${st.text ? ' {' + st.text + '}' : ''}`, n: [] }; labs.push(cur); }
        if (!cur) { cur = { h: '', n: [] }; labs.push(cur); }
        cur.n.push(st.rest ? 'r' : st.notes.map((n) => `${Q.nn(n.n)}${n.deg != null ? '(' + n.deg + ')' : ''}`).join('+'));
      }
      return labs.slice(0, max).map((x) => `[${x.h}] ${x.n.join(' ')}`).join(' | ');
    };
    window.__neck = async () => {
      const { neckPanel } = await M('/js/ui/neck.js');
      const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:-3000px;top:0;width:800px;height:300px'; document.body.append(host);
      const N = neckPanel(); host.append(N.el);
      const [rootSel, setSel, labSel] = N.el.querySelectorAll('select');
      const info = () => N.el.querySelector('.muted.small').textContent;
      const lbl = () => [...new Set([...N.el.querySelectorAll('text.lbl')].map((t) => t.textContent))].join(' ');
      N.own = (pc, set, lab = 'degree') => { setSel.value = set; setSel.dispatchEvent(new Event('change')); rootSel.value = String(pc); rootSel.dispatchEvent(new Event('change')); labSel.value = lab; labSel.dispatchEvent(new Event('change')); return `${info()} || ${lbl()}`; };
      N.fol = (x) => { N.follow(x); return `${info()} || ${lbl()}`; };
      N.roots = () => [...rootSel.options].map((o) => o.textContent).join(' ');
      return N;
    };
    return 'helpers17 ready';
  })();
})();
