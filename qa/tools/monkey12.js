// QA monkey runner v12 (4c593d9): monkey11 (paste qa/tools/monkey11.js first, and __fastSrc from
// home11.js when the pane is hidden) plus a watcher for this round's changes:
//  - settings.libOpen / settings.mapOpen stay null or a sorted list of distinct levels 1-6;
//  - on the Library (no search) the open levels are the stored ones (or the player's level);
//    on the course map the open stages are the stored ones (or the next lesson's stage);
//  - in an exercise the ⋯ items keep their state icons (aria-label "Reveal: …", "Dot labels: …",
//    "Under the neck: …"), a greyed Backing reads "Off", no NaN/undefined in aria-labels;
//  - the My level button "See my starting point" is never disabled;
//  - teleports (`extra`) also go to the Make Music exercises, tech-sweep, tech-tapping and the
//    sweeps/tapping lessons and their steps.
// Usage: window.__runMonkey12(seed, steps, opts) -> window.__monkey (findings include the watcher's).
// The monkey11 copy pasted for this round had three tweaks: '.more-pop' and '.lbl-btn' join the
// course-biased targets (the ⋯ menu gets half the taps there), the listener check also counts document
// capture 'click' (the ⓘ bubble's new listener), and the searches add 'sweep', 'tapping', 'make music',
// 'schism', '5/8'.
window.__watch12 = () => {
  if (window.__w12) clearInterval(window.__w12);
  window.__w12f = [];
  const seen = new Set();
  const note = (k, m) => { const key = k + m; if (seen.has(key) || window.__w12f.length > 150) return; seen.add(key); window.__w12f.push({ step: window.__monkey?.steps, k, m, hash: location.hash }); };
  const valid = (v) => v === null || v === undefined || (Array.isArray(v) && v.length <= 6 && v.every((n) => [1, 2, 3, 4, 5, 6].includes(n)) && new Set(v).size === v.length && v.every((n, i) => !i || v[i - 1] < n));
  window.__w12 = setInterval(async () => {
    try {
      const S = JSON.parse(localStorage.getItem('bassclass.settings.v1') || '{}');
      if (!valid(S.libOpen)) note('settings', `libOpen ${JSON.stringify(S.libOpen)}`);
      if (!valid(S.mapOpen)) note('settings', `mapOpen ${JSON.stringify(S.mapOpen)}`);
      const { settings } = await import('/js/store.js');
      if (location.hash.startsWith('#/library') && !document.querySelector('input.search')?.value) {
        const { playerLevel } = await import('/js/ui/course.js');
        const want = (settings.libOpen ?? [playerLevel()]).join(',');
        const got = [...document.querySelectorAll('details.lv-fold[open]')].filter((d) => d.id.startsWith('lv-')).map((d) => Number(d.id.slice(3))).join(',');
        if (document.querySelector('details.lv-fold') && want !== got) note('fold', `Library open ${got} but stored ${want}`);
      }
      if (location.hash === '#/course') {
        const P = await import('/js/course/progress.js');
        const cont = P.continueLesson();
        const want = (settings.mapOpen ?? [cont ? P.STAGES.indexOf(cont.stage) + 1 : 1]).join(',');
        const got = [...document.querySelectorAll('details.map-fold[open]')].map((d) => Number(d.id.slice(6))).join(',');
        if (document.querySelector('details.map-fold') && want !== got) note('fold', `map open ${got} but stored ${want}`);
      }
      if (location.hash.startsWith('#/ex/')) {
        for (const b of document.querySelectorAll('.lbl-btn')) {
          const al = b.getAttribute('aria-label') || b.textContent;
          if (/NaN|undefined|null/.test(al)) note('menu', `button label "${al}"`);
          if (b.classList.contains('ico') && !b.querySelector('svg path, svg circle, svg text, svg g')) note('menu', `icon button without an icon (${al})`);
        }
        const bk = [...document.querySelectorAll('.lbl-btn')].find((b) => /^Backing/.test(b.getAttribute('aria-label') || ''));
        if (bk && bk.classList.contains('na') && bk.textContent !== 'Off') note('menu', `greyed Backing reads "${bk.textContent}"`);
      }
      if (location.hash.startsWith('#/course/placement')) {
        const btn = [...document.querySelectorAll('button')].find((b) => b.textContent === 'See my starting point');
        if (btn && btn.disabled) note('placement', 'See my starting point disabled');
      }
    } catch (e) { note('watch', e.message); }
  }, 120);
};
window.__runMonkey12 = async (seed, steps, opts = {}) => {
  const { EXERCISES } = await import('/js/curriculum/index.js');
  const { lessonById } = await import('/js/course/data.js');
  const { stepHref } = await import('/js/ui/course.js');
  const extra = [
    ...EXERCISES.filter((t) => t.module === 'music' || t.id === 'tech-sweep' || t.id === 'tech-tapping').map((t) => `#/ex/${t.id}`),
    ...['sweeps', 'tapping', 'u-hands5-check', 's6-test', 's1-test'].flatMap((id) => { const l = lessonById.get(id); return [`#/course/${id}`, ...l.steps.map((_, i) => stepHref(l, i, {}))]; }),
    '#/course', '#/library', '#/course/placement',
  ];
  window.__watch12();
  const res = await window.__runMonkey11(seed, steps, { extra, ...opts });
  clearInterval(window.__w12);
  for (const f of window.__w12f) res.findings.push({ step: f.step, kind: `w12-${f.k}`, msg: f.m, hash: f.hash });
  return res;
};
