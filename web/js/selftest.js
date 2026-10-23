// Dev self-test: builds every exercise across its parameter space on 4/5/6-string
// basses and checks that every note is playable and correctly spelled, and that every step of
// the guided course opens an exercise with options it has.
// Run in the browser console:  (await import('./js/selftest.js')).run()
import { EXERCISES, byNumber, byId, defaultParams } from './curriculum/index.js';
import { LESSONS, lessonById } from './course/data.js';
import { CHANGED_STEPS } from './course/progress.js';
import { CYCLE_OPTS } from './curriculum/common.js';
import { NO_BACKING } from './harmony.js';
import { makeCtx } from './fretboard.js';
import { STYLES, levelsOf, regroup } from './practice/styles.js';
import { PIECES } from './drums.js';
import * as T from './theory.js';

function combos(params, limit = 400, strings = 4) {
  const keys = Object.keys(params);
  const opts = keys.map((k) => {
    const def = params[k];
    if (def.kind === 'key') return [...T.CHROMATIC_PC.map(String), ...(def.cycles ? ['cycle4'] : [])];
    // options that need a 5- or 6-string bass are only tried on one
    return def.options.filter((o) => !o[2]?.minStrings || strings >= o[2].minStrings).map((o) => o[0]);
  });
  const out = [];
  // defaults, then vary one param at a time, then every key with every value of the options that
  // move the line on the neck (range, root string, position), then a few random mixes
  const base = Object.fromEntries(keys.map((k) => [k, params[k].default]));
  out.push(base);
  keys.forEach((k, i) => opts[i].forEach((v) => out.push({ ...base, [k]: v })));
  const ki = keys.findIndex((k) => params[k].kind === 'key');
  if (ki >= 0) {
    keys.forEach((k, i) => {
      if (!['oct', 'root', 'pos', 'string', 'range', 'zone'].includes(k)) return;
      for (const v of opts[i]) for (const kv of opts[ki]) out.push({ ...base, [k]: v, [keys[ki]]: kv });
    });
  }
  for (let r = 0; r < 12; r++) out.push(Object.fromEntries(keys.map((k, i) => [k, opts[i][Math.floor(Math.random() * opts[i].length)]])));
  return out.slice(0, limit);
}

/** The course: unique lesson ids, real exercises and options (on any bass), sane tempos, every step builds. */
/** The Practice room's drum patterns (their bars and steps are checked when they load): pieces, tempo, subdivision. */
function checkDrums(problems) {
  for (const s of Object.values(STYLES)) {
    for (const p of Object.keys(s.tracks)) if (!PIECES.has(p)) problems.push(`drums ${s.key}: no piece "${p}" in the kit`);
    if (!(s.bpm >= 30 && s.bpm <= 260)) problems.push(`drums ${s.key}: tempo ${s.bpm}`);
    if (!levelsOf(s).includes(s.sub)) problems.push(`drums ${s.key}: subdivision ${s.sub}`);
    if (!(s.beats >= 1 && s.beats <= 12)) problems.push(`drums ${s.key}: ${s.beats} beats`);
    // an odd metre in every grouping the player can tap (groups of 1 to 4): whole bars, its downbeat kept,
    // and each group starting on one of the pattern's own group heads
    if (!s.groups) continue;
    const per = s.beats * s.grid;
    const heads = new Set();
    s.groups.reduce((at, g) => { for (const [p, t] of Object.entries(s.tracks)) heads.add(`${p}:${t.slice(at * s.grid, (at + 1) * s.grid)}`); return at + g; }, 0);
    const parts = (n) => (n === 0 ? [[]] : [1, 2, 3, 4].filter((g) => g <= n).flatMap((g) => parts(n - g).map((r) => [g, ...r])));
    for (const groups of parts(s.beats).filter((g) => g.length > 1)) {
      const r = regroup(s, groups);
      const name = `drums ${s.key} as ${groups.join('+')}`;
      if (groups.join() === s.groups.join() ? r !== s : r.groups.join() !== groups.join()) { problems.push(`${name}: not regrouped`); continue; }
      for (const [p, t] of Object.entries(r.tracks)) {
        if (t.length !== s.bars * per) problems.push(`${name}: ${p} has ${t.length} steps`);
        if (t.slice(0, s.grid).join() !== s.tracks[p].slice(0, s.grid).join()) problems.push(`${name}: ${p} loses its downbeat`);
        groups.reduce((at, g) => { if (!heads.has(`${p}:${t.slice(at * s.grid, (at + 1) * s.grid)}`)) problems.push(`${name}: ${p} group at ${at} has no head`); return at + g; }, 0);
      }
    }
  }
}

function checkCourse(problems, strings) {
  // a changed step must exist (its stored records are dropped once)
  CHANGED_STEPS.forEach((c, i) => {
    if (c.rev !== i + 1) problems.push(`course: CHANGED_STEPS[${i}] needs rev ${i + 1}`);
    for (const k of c.steps) { const [lid, n] = k.split('.'); if (!lessonById.get(lid)?.steps[+n]) problems.push(`course: changed step ${k} does not exist`); }
  });
  const ids = new Set();
  for (const l of LESSONS) {
    if (ids.has(l.id)) problems.push(`course: duplicate lesson id ${l.id}`);
    ids.add(l.id);
    if (!l.steps?.length) problems.push(`course ${l.id}: no steps`);
    if (l.kind === 'lesson' && (!l.idea || !l.concept?.length || !l.mistakes?.length)) problems.push(`course ${l.id}: idea, concept or mistakes missing`);
    if (l.kind !== 'lesson' && !l.can?.length) problems.push(`course ${l.id}: a checkpoint needs its "I can" list`);
    (l.steps || []).forEach((st, i) => {
      const where = `course ${l.id} step ${i}`;
      const t = byId.get(st.ex);
      if (!t) { problems.push(`${where}: no exercise ${st.ex}`); return; }
      for (const [k, v] of Object.entries(st.p || {})) {
        const def = t.params?.[k];
        if (!def) { problems.push(`${where}: ${st.ex} has no option ${k}`); continue; }
        // (an option that needs a 5- or 6-string bass would not open on a 4-string)
        const ok = typeof v === 'string' && (def.kind === 'key' ? /^(\d|1[01])$/.test(v) || (!!def.cycles && CYCLE_OPTS.some((o) => o[0] === v)) : def.options.some((o) => o[0] === v && !o[2]?.minStrings));
        if (!ok) problems.push(`${where}: ${k}=${v} is not an option of ${st.ex}`);
      }
      if (st.goal != null && !(st.from >= 30 && st.goal <= 260 && st.from <= st.goal)) problems.push(`${where}: tempo ${st.from} → ${st.goal}`);
      if (st.backing && !['off', 'drone', 'chords'].includes(st.backing)) problems.push(`${where}: backing ${st.backing}`);
      // (hands, time, note-finding, interval and ear drills have no backing to turn on)
      if (st.backing && NO_BACKING.includes(t.module)) problems.push(`${where}: ${st.ex} has no backing`);
      for (const n of strings) {
        const S = { strings: n, notation: 'letters', maxFret: 20 };
        try {
          const inst = t.build({ ...defaultParams(t), ...st.p }, makeCtx(S), S);
          if (!inst?.steps?.length) problems.push(`${where} [${n}str]: empty`);
          // the notes per beat belong to the step where the player can choose them (and only there)
          else if (inst.uniform ? !(st.sub > 0) : st.sub != null) problems.push(`${where}: ${inst.uniform ? 'needs its sub (notes per beat)' : 'has a sub but the rhythm is written'}`);
        } catch (e) { problems.push(`${where} [${n}str]: threw ${e.message}`); }
      }
    });
  }
}

export function run({ strings = [4, 5, 6], verbose = false } = {}) {
  const problems = [];
  let builds = 0, notes = 0;
  checkCourse(problems, strings);
  checkDrums(problems);
  // every exercise has its own number (its place in the Library: level, topic, module order)
  for (const t of EXERCISES) if (!(t.num > 0) || byNumber.get(t.num) !== t) problems.push(`${t.id}: missing or duplicate number ${t.num}`);
  for (const st of strings) {
    const S = { strings: st, notation: 'letters', maxFret: 20 };
    const ctx = makeCtx(S);
    for (const t of EXERCISES) {
      for (const p of combos(t.params || {}, 400, st)) {
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
          // a chord can only be played with one note per string
          if (step.notes.length > 1 && new Set(step.notes.map((n) => n.s)).size < step.notes.length) problems.push(`${t.id} [${st}str] ${JSON.stringify(p)} step ${i}: two notes on one string`);
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
  const summary = { exercises: EXERCISES.length, lessons: LESSONS.length, drumPatterns: Object.keys(STYLES).length, builds, notes, problems: problems.length, sample: uniq.slice(0, verbose ? 200 : 25) };
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
    'Generated from `web/js/curriculum/` (run `saveCatalogue()` from `js/selftest.js` to refresh). # = the exercise number shown in the app (its place in the Library: level, then topic, then the order of its module). ★ = core exercise.', '',
    '## By level', '',
  ];
  for (const L of C.LEVELS) {
    const list = C.EXERCISES.filter((e) => e.level === L.n).sort((a, b) => a.num - b.num);
    lines.push(`### Level ${L.n}: ${L.name}`, '', `_${L.desc}_`, '', '| # | Exercise | Module | What it trains | Based on |', '|---|---|---|---|---|');
    for (const e of list) lines.push(`| ${e.num} | ${e.star ? '★ ' : ''}${cell(e.title)} | ${C.moduleOf(e.module).name} | ${cell(e.summary)} | ${cell(e.source)} |`);
    lines.push('');
  }
  lines.push('## Variation options per exercise', '');
  for (const m of C.MODULES) {
    const list = C.byModule(m.id);
    if (!list.length) continue;
    lines.push(`### ${m.name}`, '');
    for (const e of list) {
      const ps = Object.values(e.params || {}).map((d) => (d.kind === 'key' ? `${d.label}: 12 keys${d.cycles ? ' + all-keys cycles' : ''}` : `${d.label}: ${d.options.map((o) => o[1] + (o[2]?.minStrings ? ` (${o[2].minStrings}-string)` : '')).join(' / ')}`)).join(' · ');
      lines.push(`- **${e.num} · ${e.title}** (L${e.level}, \`${e.id}\`): ${ps || 'no options'}`);
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
