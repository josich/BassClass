// QA monkey runner v13 (1e91dad): monkey11 (paste qa/tools/monkey11.js first, and __fastSrc from
// home11.js when the pane is hidden) plus a watcher for this round's changes:
//  - settings.libOpen / mapOpen stay null or a sorted list of distinct levels 1-6; libAt / mapAt stay
//    null or 1-6;
//  - on the Library (no search) every stored open level is open, and the player's level is open once
//    libAt names it; on the course map likewise with mapAt and the next lesson's stage;
//  - in an exercise on tab: a step whose note has a technique tag (not x / ◊) draws a mark under the tab
//    (.tmark / .tmarkp), and no mark has NaN coordinates;
//  - variant chips / session tags never read "undefined", "null", "NaN" or "any undefined";
//  - lesson pages of optional lessons show the "optional" chip, other lessons never;
//  - the greyed Backing toast never reads "No backing in undefined";
//  - My level: "See my starting point" never disabled.
// Teleports (`extra`) go to the Make Music studies (parts and whole tune), tech-sweep, tech-tapping,
// sl-double-thumb, gr-pick, tri-upper-structures and tri-inversions (every option of `us`, `mode`), the
// sweeps / tapping / double-thumb lessons and the five checkpoints and tests changed in rev 5.
// Usage: window.__runMonkey13(seed, steps, opts) -> window.__monkey (findings include the watcher's).
window.__watch13 = () => {
  if (window.__w13) clearInterval(window.__w13);
  window.__w13f = [];
  const seen = new Set();
  const note = (k, m) => { const key = k + m; if (seen.has(key) || window.__w13f.length > 150) return; seen.add(key); window.__w13f.push({ step: window.__monkey?.steps, k, m, hash: location.hash }); };
  const valid = (v) => v === null || v === undefined || (Array.isArray(v) && v.length <= 6 && v.every((n) => [1, 2, 3, 4, 5, 6].includes(n)) && new Set(v).size === v.length && v.every((n, i) => !i || v[i - 1] < n));
  const lvl = (v) => v === null || v === undefined || [1, 2, 3, 4, 5, 6].includes(v);
  // the toast element is reused: its text is polled
  window.__w13 = setInterval(async () => {
    try {
      const S = JSON.parse(localStorage.getItem('bassclass.settings.v1') || '{}');
      if (!valid(S.libOpen)) note('settings', `libOpen ${JSON.stringify(S.libOpen)}`);
      if (!valid(S.mapOpen)) note('settings', `mapOpen ${JSON.stringify(S.mapOpen)}`);
      if (!lvl(S.libAt)) note('settings', `libAt ${JSON.stringify(S.libAt)}`);
      if (!lvl(S.mapAt)) note('settings', `mapAt ${JSON.stringify(S.mapAt)}`);
      const tt = document.querySelector('.toast')?.textContent || '';
      if (/undefined|null|NaN/.test(tt)) note('toast', `toast "${tt}"`);
      const { settings } = await import('/js/store.js');
      if (location.hash.startsWith('#/library') && !document.querySelector('input.search')?.value) {
        const { playerLevel } = await import('/js/ui/course.js');
        const got = new Set([...document.querySelectorAll('details.lv-fold[open]')].filter((d) => d.id.startsWith('lv-')).map((d) => Number(d.id.slice(3))));
        const want = settings.libOpen ?? [playerLevel()];
        if (document.querySelector('details.lv-fold') && (want.some((n) => !got.has(n)) || [...got].some((n) => !want.includes(n)))) note('fold', `Library open ${[...got]} but stored ${want} (libAt ${settings.libAt}, level ${playerLevel()})`);
        if (settings.libOpen != null && settings.libAt === playerLevel() && !got.has(playerLevel()) && settings.libOpen.includes(playerLevel())) note('fold', 'player level stored open but folded');
      }
      if (location.hash === '#/course') {
        const P = await import('/js/course/progress.js');
        const cont = P.continueLesson();
        const at = cont ? P.STAGES.indexOf(cont.stage) + 1 : P.STAGES.length;
        const want = settings.mapOpen ?? [at];
        const got = new Set([...document.querySelectorAll('details.map-fold[open]')].map((d) => Number(d.id.slice(6))));
        if (document.querySelector('details.map-fold') && (want.some((n) => !got.has(n)) || [...got].some((n) => !want.includes(n)))) note('fold', `map open ${[...got]} but stored ${want} (mapAt ${settings.mapAt}, next stage ${at})`);
      }
      if (location.hash.startsWith('#/ex/')) {
        for (const b of document.querySelectorAll('.lbl-btn')) {
          const al = b.getAttribute('aria-label') || b.textContent;
          if (/NaN|undefined|null/.test(al)) note('menu', `button label "${al}"`);
        }
        const svg = document.querySelector('svg.tabsvg:not(.staff)');
        if (svg) {
          for (const m of svg.querySelectorAll('.tmark, .tmarkp')) { const a = m.getAttribute('x') ?? m.getAttribute('d'); if (/NaN|undefined/.test(a || '')) note('marks', `mark with bad coordinates ${a}`); }
        }
      }
      if (/^#\/course\/[\w-]+$/.test(location.hash) && !/placement/.test(location.hash)) {
        const id = location.hash.slice(9);
        const { lessonById } = await import('/js/course/data.js');
        const l = lessonById.get(id);
        const chip = document.querySelector('.les-title .chip.opt');
        if (l && !!l.optional !== !!chip && document.querySelector('.les-title')) note('optional', `${id}: optional ${!!l.optional}, chip ${!!chip}`);
      }
      for (const tg of document.querySelectorAll('.session-list .tag, .step-row .chip, .les-row .chip')) if (/undefined|null|NaN|any undefined/.test(tg.textContent)) note('chip', `"${tg.textContent}"`);
      if (location.hash.startsWith('#/course/placement')) {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'See my starting point');
        if (btn && btn.disabled) note('placement', 'See my starting point disabled');
      }
    } catch (e) { note('watch', e.message); }
  }, 120);
};
window.__runMonkey13 = async (seed, steps, opts = {}) => {
  const { EXERCISES } = await import('/js/curriculum/index.js');
  const { lessonById } = await import('/js/course/data.js');
  const { stepHref } = await import('/js/ui/course.js');
  const ex = (id, p = {}) => `#/ex/${id}${Object.keys(p).length ? '?' + new URLSearchParams(p) : ''}`;
  const extra = [
    ...EXERCISES.filter((t) => t.module === 'music').flatMap((t) => t.params.part.options.map((o) => ex(t.id, { part: o[0] }))),
    ...['tech-sweep', 'tech-tapping', 'sl-double-thumb', 'gr-pick'].map((id) => ex(id)),
    ...['II/I', 'V/I', 'iii/I', 'II/7', 'VI/7', 'bVI/7', 'bIII/7', 'bV/7', 'bVII/m'].map((us) => ex('tri-upper-structures', { us, key: String(Math.floor(Math.random() * 12)) })),
    ...['position', 'climb'].flatMap((mode) => ['E', 'A', 'D', 'G'].map((root) => ex('tri-inversions', { mode, root }))),
    ...['sweeps', 'tapping', 'double-thumb', 'u-scales-check', 's1-test', 's2-test', 'u-time4-check', 's6-test'].filter((id) => lessonById.has(id)).flatMap((id) => { const l = lessonById.get(id); return [`#/course/${id}`, ...l.steps.map((_, i) => stepHref(l, i, {}))]; }),
    '#/course', '#/library', '#/course/placement',
  ];
  window.__watch13();
  const res = await window.__runMonkey11(seed, steps, { extra, ...opts });
  clearInterval(window.__w13);
  for (const f of window.__w13f) res.findings.push({ step: f.step, kind: `w13-${f.k}`, msg: f.m, hash: f.hash });
  return res;
};
