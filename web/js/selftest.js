// Dev self-test: builds every exercise across its parameter space on 4/5/6-string
// basses and checks that every note is playable and correctly spelled, and that every step of
// the guided course opens an exercise with options it has.
// Run in the browser console:  (await import('./js/selftest.js')).run()
import { EXERCISES, byNumber, byId, defaultParams } from './curriculum/index.js';
import { LESSONS, STAGES, UNITS, lessonById } from './course/data.js';
import { PLACEMENT } from './course/placement.js';
import { CHANGED_STEPS } from './course/progress.js';
import { CYCLE_OPTS } from './curriculum/common.js';
import { NO_BACKING } from './harmony.js';
import { makeCtx } from './fretboard.js';
import { STYLES, levelsOf, regroup, phraseHits } from './practice/styles.js';
import { PIECES } from './drums.js';
import { checkLicks, default as LICK_TEMPLATES } from './curriculum/licks.js';
import { PENTATONIC_LICKS } from './curriculum/pentatonics.js';
import { NUMBERS, RETIRED } from './curriculum/numbers.js';
import { LESSON_NUMBERS, RETIRED_LESSONS } from './course/numbers.js';
import * as T from './theory.js';
import { GENRES } from './practice/styles.js';
import { HARMONY_PROGS, PROG_KEYS } from './practice/harmony.js';
import { PAD_SOUNDS } from './audio.js';
import { FREE_SOUNDS, FREE_LEVELS, FREE_TASTE, FREE_DRUMS, FREE_STYLE, PRO_SOUND_NOTES, isPro, gatesOn, exerciseLock, lessonLock, styleLock, progLock } from './pro.js';

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
    // its phrases with fills: every piece in the kit, every stroke inside its beat, at its usual tempo and fast
    // (and each of the four fills that take turns)
    for (const bpm of [s.bpm, 200]) for (const every of [4, 8]) for (let bar = 0; bar < every * 4; bar++) for (let beat = 0; beat < s.beats; beat++) {
      for (const [f, p, v] of phraseHits(s, s.sub, bar, beat, every, bpm)) {
        if (!PIECES.has(p) || !(f >= 0 && f < 1) || !(v > 0 && v <= 1)) problems.push(`drums ${s.key}: fill bar ${bar} beat ${beat} ${p} ${f} ${v}`);
      }
    }
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

/**
 * Pro (pro.js, MONETIZATION-PLAN.md): the free starter set exists in every genre and every free group, the room's
 * defaults are free, and with the gates off nothing at all is locked. (The locks themselves are checked with the
 * gates on in Settings' Pro debug panel.)
 */
function checkPro(problems) {
  for (const g of GENRES) {
    const list = Object.values(STYLES).filter((s) => s.genre === g.key);
    if (list.length < 3) problems.push(`pro: genre ${g.key} has fewer than 3 patterns (3 are free)`);
    // (the free three are chosen by hand, `free: true` in styles.js: QA round 19)
    const free = list.filter((s) => FREE_STYLE.has(s.key)).length;
    if (free !== FREE_DRUMS) problems.push(`pro: genre ${g.key} has ${free} free patterns, not ${FREE_DRUMS}`);
  }
  for (const v of FREE_SOUNDS) if (!PAD_SOUNDS[v]) problems.push(`pro: free sound ${v} does not exist`);
  // (Settings' Pro details name every Pro sound: a new one needs its line)
  for (const v of Object.keys(PAD_SOUNDS)) if (!FREE_SOUNDS.has(v) && !PRO_SOUND_NOTES[v]) problems.push(`pro: Pro sound ${v} has no line in PRO_SOUND_NOTES`);
  if (!HARMONY_PROGS.some(([g]) => g === 'Pop & rock') || !HARMONY_PROGS.some(([g]) => g === 'Blues')) problems.push('pro: the free progression groups are missing');
  if (FREE_LEVELS < 1 || FREE_LEVELS > 6) problems.push(`pro: FREE_LEVELS ${FREE_LEVELS}`);
  // (each Pro stage has its lessons free to try, plain lessons, not optional; nothing else in it is marked free)
  for (const stage of STAGES.filter((s) => s.level > FREE_LEVELS)) {
    const free = stage.lessons.filter((l) => l.free);
    if (free.length !== FREE_TASTE || free.some((l) => l.kind !== 'lesson' || l.optional)) problems.push(`pro: Stage ${stage.level} has ${free.length} lessons free to try (want ${FREE_TASTE} plain lessons)`);
  }
  if (!gatesOn()) {
    if (!isPro()) problems.push('pro: the gates are off but something is closed');
    const shut = [...EXERCISES.filter((t) => exerciseLock(t)), ...LESSONS.filter((l) => lessonLock(l)), ...Object.keys(STYLES).filter((k) => styleLock(k)), ...PROG_KEYS.filter((k) => progLock(k))];
    if (shut.length) problems.push(`pro: ${shut.length} items closed with the gates off`);
  }
}

/**
 * Numbers kept for good (user, 2026-10-28): every exercise has one in curriculum/numbers.js, unique, its level's
 * hundreds (305 = Level 3), never a retired one; every lesson one in course/numbers.js, unique in its stage.
 */
/**
 * My level (course/placement.js): every unit has a statement, so a player who answers "yes" to everything has nothing
 * left to do (launch review, 2026-10-28); every statement names units that exist, all in one stage.
 */
function checkPlacement(problems) {
  const said = new Set(PLACEMENT.flatMap(([, units]) => units));
  for (const u of UNITS) if (!said.has(u.id)) problems.push(`placement: unit ${u.id} (${u.title}) has no My level statement`);
  for (const [text, units] of PLACEMENT) {
    const found = units.map((id) => UNITS.find((u) => u.id === id));
    if (found.some((u) => !u)) problems.push(`placement: "${text.slice(0, 40)}…" names a unit that does not exist`);
    else if (new Set(found.map((u) => u.stage)).size > 1) problems.push(`placement: "${text.slice(0, 40)}…" spans two stages`);
  }
}

function checkNumbers(problems) {
  const seen = new Map();
  for (const t of EXERCISES) {
    if (t.provisional) problems.push(`numbers: ${t.id} has no number: write ${t.num} (the next free in Level ${t.level}) in curriculum/numbers.js`);
    else if (Math.floor(t.num / 100) !== t.level || t.num % 100 === 0) problems.push(`numbers: ${t.id} is ${t.num}, outside Level ${t.level}'s ${t.level}01–${t.level}99`);
    if (seen.has(t.num)) problems.push(`numbers: ${t.num} is given to ${seen.get(t.num)} and ${t.id}`);
    seen.set(t.num, t.id);
    if (RETIRED.includes(t.num)) problems.push(`numbers: ${t.id} has the retired number ${t.num}`);
  }
  for (const id of Object.keys(NUMBERS)) if (!byId.has(id)) problems.push(`numbers: ${id} (${NUMBERS[id]}) is not an exercise: move its number to RETIRED`);
  const perStage = new Map();
  for (const l of LESSONS.filter((x) => x.kind === 'lesson')) {
    const n = LESSON_NUMBERS[l.id];
    if (n == null) { problems.push(`numbers: lesson ${l.id} has no number: write ${l.num.split('.')[1]} (the next free in Stage ${l.stage.level}) in course/numbers.js`); continue; }
    const key = `${l.stage.level}.${n}`;
    if (!perStage.has(l.stage.level)) perStage.set(l.stage.level, new Map());
    const m = perStage.get(l.stage.level);
    if (m.has(n)) problems.push(`numbers: lesson ${key} is given to ${m.get(n)} and ${l.id}`);
    m.set(n, l.id);
    if (RETIRED_LESSONS.includes(key)) problems.push(`numbers: lesson ${l.id} has the retired number ${key}`);
  }
  for (const id of Object.keys(LESSON_NUMBERS)) if (!lessonById.get(id) || lessonById.get(id).kind !== 'lesson') problems.push(`numbers: ${id} (${LESSON_NUMBERS[id]}) is not a lesson: move its number to RETIRED_LESSONS`);
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
  // every written phrase (licks, pentatonic studies) fills its chords exactly
  problems.push(...checkLicks([...LICK_TEMPLATES, ...PENTATONIC_LICKS]));
  checkDrums(problems);
  checkPro(problems);
  checkNumbers(problems);
  checkPlacement(problems);
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
    'Generated from `web/js/curriculum/` (run `saveCatalogue()` from `js/selftest.js` to refresh). # = the exercise number shown in the app: its level, then two digits (305 = Level 3), kept for good (`curriculum/numbers.js`). ★ = core exercise.', '',
    '## By level', '',
  ];
  for (const L of C.LEVELS) {
    const list = C.EXERCISES.filter((e) => e.level === L.n).sort((a, b) => a.num - b.num);
    lines.push(`### Level ${L.n}: ${L.name}`, '', `_${L.desc}_`, '', '| # | Exercise | Module | What it trains | Related |', '|---|---|---|---|---|');
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
