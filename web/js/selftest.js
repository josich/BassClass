// Dev self-test: builds every exercise across its parameter space on 4/5/6-string
// basses and checks that every note is playable and correctly spelled.
// Run in the browser console:  (await import('./js/selftest.js')).run()
import { EXERCISES } from './curriculum/index.js';
import { makeCtx } from './fretboard.js';
import * as T from './theory.js';

function combos(params, limit = 60) {
  const keys = Object.keys(params);
  const opts = keys.map((k) => {
    const def = params[k];
    if (def.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(def.cycles ? ['cycle4'] : [])];
    return def.options.map((o) => o[0]);
  });
  const out = [];
  // defaults, then vary one param at a time, then a few random mixes
  const base = Object.fromEntries(keys.map((k) => [k, params[k].default]));
  out.push(base);
  keys.forEach((k, i) => opts[i].forEach((v) => out.push({ ...base, [k]: v })));
  for (let r = 0; r < 12; r++) out.push(Object.fromEntries(keys.map((k, i) => [k, opts[i][Math.floor(Math.random() * opts[i].length)]])));
  return out.slice(0, limit);
}

export function run({ strings = [4, 5, 6], verbose = false } = {}) {
  const problems = [];
  let builds = 0, notes = 0;
  for (const st of strings) {
    const S = { strings: st, notation: 'letters', maxFret: 20 };
    const ctx = makeCtx(S);
    for (const t of EXERCISES) {
      for (const p of combos(t.params || {})) {
        let inst;
        try {
          inst = t.build(p, ctx, S);
          builds++;
        } catch (e) {
          problems.push(`${t.id} [${st}str] ${JSON.stringify(p)} threw ${e.message}`);
          continue;
        }
        if (!inst.steps?.length) { problems.push(`${t.id} [${st}str] ${JSON.stringify(p)} empty`); continue; }
        inst.steps.forEach((step, i) => {
          if (!(step.dur > 0)) problems.push(`${t.id} step ${i} bad dur ${step.dur}`);
          for (const n of step.notes) {
            notes++;
            const where = `${t.id} [${st}str] ${JSON.stringify(p)} step ${i}`;
            if (n.s < 0 || n.s >= ctx.tuning.length) problems.push(`${where}: bad string ${n.s}`);
            else if (n.f < 0 || n.f > 24) problems.push(`${where}: fret ${n.f} out of range`);
            else if (ctx.tuning[n.s] + n.f !== n.midi) problems.push(`${where}: midi mismatch`);
            if (!n.n || T.pc(n.n) !== T.mod(n.play ?? n.midi, 12)) problems.push(`${where}: spelling ${n.n && T.noteName(n.n)} vs midi ${n.midi}`);
            if (n.f > ctx.maxFret) problems.push(`${where}: fret ${n.f} above max ${ctx.maxFret}`);
          }
        });
      }
    }
  }
  const uniq = [...new Set(problems.map((x) => x.replace(/step \d+.*/, '')))];
  const summary = { exercises: EXERCISES.length, builds, notes, problems: problems.length, sample: uniq.slice(0, verbose ? 200 : 25) };
  console.log(summary);
  return summary;
}

/** Markdown catalogue of every exercise (docs/CATALOGUE.md). */
export async function catalogue() {
  const C = await import('./curriculum/index.js');
  const cell = (s) => String(s || '').replace(/\|/g, '/');
  const lines = [
    '# BassClass exercise catalogue', '',
    `${C.EXERCISES.length} exercise families. Each runs in any key (or all 12 keys in a row) and has its own variations (patterns, inversions, scales, positions, rhythms), so the number of distinct drills runs into the thousands.`, '',
    'Generated from `web/js/curriculum/` (run `saveCatalogue()` from `js/selftest.js` to refresh). ★ = core exercise.', '',
    '## By level', '',
  ];
  for (const L of C.LEVELS) {
    const order = (e) => C.MODULES.findIndex((m) => m.id === e.module);
    const list = C.EXERCISES.filter((e) => e.level === L.n).sort((a, b) => order(a) - order(b));
    lines.push(`### Level ${L.n}: ${L.name}`, '', `_${L.desc}_`, '', '| Exercise | Module | What it trains | Based on |', '|---|---|---|---|');
    for (const e of list) lines.push(`| ${e.star ? '★ ' : ''}${cell(e.title)} | ${C.moduleOf(e.module).name} | ${cell(e.summary)} | ${cell(e.source)} |`);
    lines.push('');
  }
  lines.push('## Variation options per exercise', '');
  for (const m of C.MODULES) {
    const list = C.byModule(m.id);
    if (!list.length) continue;
    lines.push(`### ${m.name}`, '');
    for (const e of list) {
      const ps = Object.values(e.params || {}).map((d) => (d.kind === 'key' ? `${d.label}: 12 keys${d.cycles ? ' + all-keys cycles' : ''}` : `${d.label}: ${d.options.map((o) => o[1]).join(' / ')}`)).join(' · ');
      lines.push(`- **${e.title}** (L${e.level}, \`${e.id}\`): ${ps || 'no options'}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** Write the catalogue through the dev server (tools/serve.py, localhost only). */
export async function saveCatalogue() {
  const md = await catalogue();
  const res = await fetch('/__docs/CATALOGUE.md', { method: 'PUT', body: md });
  return `${res.status} · ${md.length} chars`;
}
