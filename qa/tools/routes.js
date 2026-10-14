// QA: visit every screen via the hash router and collect console errors, uncaught errors
// and suspicious text (NaN / undefined / null / Infinity) plus horizontal page scroll.
window.__errs = window.__errs || [];
if (!window.__errHooked) {
  window.__errHooked = true;
  window.addEventListener('error', (e) => window.__errs.push(`error: ${e.message} @${location.hash}`));
  window.addEventListener('unhandledrejection', (e) => window.__errs.push(`rejection: ${e.reason?.message || e.reason} @${location.hash}`));
  const ce = console.error.bind(console);
  console.error = (...a) => { window.__errs.push(`console.error: ${a.map((x) => x?.message || String(x)).join(' ')} @${location.hash}`); ce(...a); };
}
window.__visit = async (routes, wait = 250) => {
  const out = [];
  for (const r of routes) {
    location.hash = r;
    await new Promise((res) => setTimeout(res, wait));
    const txt = document.body.innerText;
    const bad = (txt.match(/[^\n]{0,30}\b(NaN|undefined|null|Infinity)\b[^\n]{0,30}/g) || []).slice(0, 5);
    const hscroll = document.documentElement.scrollWidth > document.documentElement.clientWidth;
    out.push({ r, bad, hscroll, h1: document.querySelector('h1, .exv-title b')?.textContent });
  }
  return { out, errs: window.__errs.slice() };
};
