// QA: corrupt-storage matrix. Each case writes one bad value to localStorage, loads the app in a
// same-origin iframe at a route, and reports uncaught errors and the key readouts.
window.__corrupt = async (cases, route = '#/ex/lk-ii-v-i', wait = 900) => {
  const out = [];
  for (const c of cases) {
    localStorage.clear();
    if (c.settings) localStorage.setItem('bassclass.settings.v1', JSON.stringify(c.settings));
    if (c.progress) localStorage.setItem('bassclass.progress.v1', JSON.stringify(c.progress));
    if (c.raw) for (const [k, v] of Object.entries(c.raw)) localStorage.setItem(k, v);
    const f = document.createElement('iframe');
    f.style.cssText = 'position:fixed;left:0;top:0;width:844px;height:390px;opacity:0.01;pointer-events:none';
    const errs = [];
    document.body.append(f);
    f.contentWindow.addEventListener('error', (e) => errs.push(e.message));
    f.src = `/?qa=corrupt${Math.random()}${c.route || route}`;
    await new Promise((r) => { f.onload = r; });
    f.contentWindow.addEventListener('error', (e) => errs.push(e.message));
    f.contentWindow.addEventListener('unhandledrejection', (e) => errs.push('rej ' + (e.reason?.message || e.reason)));
    await new Promise((r) => setTimeout(r, wait));
    const d = f.contentDocument;
    const txt = d.body.innerText;
    out.push({
      name: c.name,
      errs,
      bpm: d.querySelector('.bpm')?.textContent,
      now: d.querySelector('.exv-now')?.textContent,
      dots: d.querySelectorAll('.fb .dot').length,
      tab: d.querySelectorAll('.tcol').length,
      opts: d.querySelector('.opts-sum')?.textContent,
      bad: (txt.match(/[^\n]{0,25}\b(NaN|undefined|Infinity)\b[^\n]{0,25}/g) || []).slice(0, 3),
      h1: d.querySelector('h1, .exv-title b')?.textContent,
    });
    f.remove();
  }
  localStorage.clear();
  return out;
};
