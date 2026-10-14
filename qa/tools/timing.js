// QA: scheduler timing harness (paste into the page console of the qa server after one real
// click on Play, so the AudioContext is running). Builds a Player, logs every queued event
// ({type, time, idx}) and compares step times with the expected beat grid.
window.__timing = async function runTiming(inst, { bpm = 120, sub = 2, countIn = true, loop = true, trainer = null, seconds = 3, sound = false } = {}) {
  const { Player } = await import('/js/player.js');
  const p = new Player({});
  const log = [];
  const oq = p._q.bind(p);
  p._q = (e) => { log.push({ ...e }); oq(e); };
  p.load(inst);
  p.bpm = bpm; p.sub = sub; p._layout();
  p.countIn = countIn; p.loop = loop; p.sound = sound; p.metro = true;
  if (trainer) Object.assign(p.trainer, trainer);
  await p.play();
  await new Promise((r) => setTimeout(r, seconds * 1000));
  p.stop(true);
  const beats = log.filter((e) => e.type === 'beat');
  const steps = log.filter((e) => e.type === 'step');
  const loops = log.filter((e) => e.type === 'loop');
  const t0 = beats[0]?.time ?? steps[0]?.time;
  const pre = countIn ? (inst.beatsPerBar || 4) : 0;
  const countInBeats = beats.filter((b) => b.time < steps[0].time - 1e-6).length;
  // expected step times (constant tempo only)
  let maxErr = 0, k = 0, loopIdx = 0, prevIdx = -1;
  if (!trainer) {
    for (const s of steps) {
      if (s.idx <= prevIdx) loopIdx++;
      prevIdx = s.idx;
      const exp = t0 + (pre + loopIdx * p.total + p.starts[s.idx]) * 60 / bpm;
      maxErr = Math.max(maxErr, Math.abs(exp - s.time));
      k++;
    }
  }
  return { steps: steps.length, beats: beats.length, countInBeats, loops: loops.map((l) => l.bpm), maxErrMs: +(maxErr * 1000).toFixed(4), total: p.total, queueLeft: p.queue.length, firstSteps: steps.slice(0, 6).map((s) => +(s.time - t0).toFixed(4)), log };
};
