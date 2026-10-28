// QA round 20 (267b86f): stored records of this round's features read back by a fresh app (load state19.js first:
// it defines __ifr19). `__state20()` runs:
//   bassclass.new.v1  garbage, wrong shapes, an empty `known` with other records present, ids that no longer exist;
//   bassclass.rate.v1 garbage and out-of-range `asked`, `rated` not a boolean;
//   bassclass.course.v1 `placed` garbage / in the future / negative, with the placement's units known;
//   bassclass.log.v1  huge and negative values (the rate reminder's hours).
// Each case reports what the fresh app drew (Home, Library, map, room), its errors, the number of "New" chips
// in the Library and the map, the rate reminder's state and the course's next lesson.
(() => {
  const read = async (w) => {
    const N = await w.eval(`import('${w.location.origin}/js/news.js')`);
    const R = await w.eval(`import('${w.location.origin}/js/ui/rate.js')`);
    const P = await w.eval(`import('${w.location.origin}/js/course/progress.js')`);
    const gap = P.firstGap();
    w.location.hash = '#/library'; await new Promise((r) => setTimeout(r, 500));
    const lib = w.document.querySelectorAll('.chip.new').length;
    w.location.hash = '#/course'; await new Promise((r) => setTimeout(r, 500));
    const map = w.document.querySelectorAll('.chip.new').length;
    let stored = null;
    try { const v = JSON.parse(w.localStorage.getItem('bassclass.new.v1')); stored = { known: v.known.length, fresh: v.fresh.length }; } catch (e) { stored = `unreadable ${e.message}`; }
    return { libChips: lib, mapChips: map, stored, rate: R.rateState(), next: gap ? `${gap.id} (${gap.kind}, stage ${gap.stage.level})` : null, isNew320: N.isNew('ex:sc-pent-three-boxes') };
  };
  window.__state20 = async () => {
    const out = {};
    const other = { 'bassclass.settings.v1': JSON.stringify({ v: 4 }) };
    const cases = {
      'new: garbage': { ...other, 'bassclass.new.v1': '{' },
      'new: array': { ...other, 'bassclass.new.v1': '[]' },
      'new: known a string': { ...other, 'bassclass.new.v1': { known: 'x', fresh: [] } },
      'new: known empty': { ...other, 'bassclass.new.v1': { known: [], fresh: [] } },
      'new: junk ids': { ...other, 'bassclass.new.v1': { known: [1, null, 'ex:zzz'], fresh: [3, 'ex:zzz', 'ex:tech-1234', null] } },
      'new: removed, first start (no other record)': { 'bassclass.settings.v1': undefined, 'bassclass.new.v1': undefined, 'bassclass.course.v1': undefined, 'bassclass.session.v1': undefined, 'bassclass.loggoal.v1': undefined, 'bassclass.log.v1': undefined, 'bassclass.progress.v1': undefined, 'bassclass.rate.v1': undefined, 'bassclass.practice.v1': undefined, 'bassclass.favorites.v1': undefined },
      'rate: garbage': { 'bassclass.rate.v1': '{', 'bassclass.log.v1': { '2026-10-20': 36060 } },
      'rate: asked 99': { 'bassclass.rate.v1': { asked: 99, rated: false } },
      'rate: asked -3, rated "yes"': { 'bassclass.rate.v1': { asked: -3, rated: 'yes' } },
      'rate: asked 1.5': { 'bassclass.rate.v1': { asked: 1.5 } },
      'log: huge and negative': { 'bassclass.log.v1': { '2026-10-20': 1e12, '2026-10-21': -50, 'zz': 5, '2026-10-22': 'x' } },
      'course: placed "x"': { 'bassclass.course.v1': { rev: 6, steps: {}, lessons: {}, can: {}, known: { 'u-hands': true }, placed: 'x', minutes: 30, last: '' } },
      'course: placed in the future': { 'bassclass.course.v1': { rev: 6, steps: {}, lessons: {}, can: {}, known: { 'u-hands': true }, placed: 9e15, minutes: 30, last: '' } },
      'course: placed -5': { 'bassclass.course.v1': { rev: 6, steps: {}, lessons: {}, can: {}, known: { 'u-hands': true }, placed: -5, minutes: 30, last: '' } },
    };
    for (const [name, rec] of Object.entries(cases)) {
      try { out[name] = await window.__ifr19(rec, ['#/', '#/library', '#/course', '#/practice', '#/settings'], read); } catch (e) { out[name] = `harness ${e.message}`; }
    }
    return out;
  };
})();
