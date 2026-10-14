// QA: memory / long-use sampler (paste into the qa server tab). window.__memCycle(name, n, fn, every)
// runs `fn(i)` n times and samples heap, DOM nodes, running animations and localStorage size.
window.__sample = () => ({
  heapMB: +(performance.memory.usedJSHeapSize / 1048576).toFixed(2),
  nodes: document.getElementsByTagName('*').length,
  anims: document.getAnimations().length,
  lsKB: +(Object.keys(localStorage).reduce((a, k) => a + k.length + (localStorage.getItem(k) || '').length, 0) / 1024).toFixed(1),
});
window.__memCycle = async (name, n, fn, every = 10) => {
  const rows = [{ i: 0, ...window.__sample() }];
  for (let i = 1; i <= n; i++) {
    await fn(i);
    if (i % every === 0) rows.push({ i, ...window.__sample() });
  }
  (window.__mem = window.__mem || {})[name] = rows;
  return rows;
};
