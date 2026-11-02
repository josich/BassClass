// The band (user, 2026-11-02: "listen the rest of the band … instead of metronome tick"): in the exercises played in
// a style over chords (grooves, walking, licks, slap, the pentatonic and rock studies, the song studies), the Practice
// room's drums and a chord sound play in place of the click. Each exercise starts with a pattern that fits its style
// (BAND below: by the option that sets the style, a list of patterns, the first that fits the metre and that the
// player has); the player may choose another (kept per exercise and style, `bandStyles` in the settings), free patterns
// and sounds for free players, Pro ones for Pro, as in the room (pro.js). An exercise whose metre no pattern fits keeps
// the click.
import { STYLES, beatHits, clickTimes } from './practice/styles.js';
import { FREE_STYLE, FREE_SOUNDS } from './pro.js';

/** The modules played in a style over chords, and the exercises of other modules that are. */
const MODULES = new Set(['grooves', 'walking', 'licks', 'slap', 'music']);
const ALSO = new Set(['sc-pent-three-boxes', 'sc-pent-minor-grooves', 'sc-pent-one-phrase', 'sc-pent-major-chord', 'sc-pent-groove-fill', 'tech-pick-alt', 'tech-pick-gallop']);

/** The chord sounds, as the room names them. */
export const BAND_SOUNDS = [['pad', 'Pad'], ['epiano', 'E-piano'], ['piano', 'Piano'], ['organ', 'Organ'], ['guitar', 'Guitar'], ['arp', 'Arpeggio']];
export const soundName = (v) => BAND_SOUNDS.find(([k]) => k === v)?.[1] || v;

const swingOr = (swing, straight) => ({ by: 'feel', swing, straight });
const PENT = swingOr(['neosoul', 'lofi'], ['funkghost', 'funkslow']);
const JAZZ = swingOr(['swing'], ['bossa']);
/**
 * Each exercise's patterns: a list (the first that fits and is open to the player wins), or `by` the option that
 * sets the style and a list for each of its values. Exercises of the modules above not listed take their module's.
 */
const BAND = {
  // grooves
  'gr-roots': { by: 'style', rock8: ['rock8'], pop8: ['pop8'], rootFifth: ['twostep'], r585: ['rock8'] },
  'gr-pick': { by: 'style', pickDown: ['punk', 'rock8'], pickAlt: ['rock8'], gallop: ['gallop'] },
  'gr-octaves': { by: 'style', octaves: ['disco', 'dance'], r5b7: ['bluesrock', 'boogie'], riff: ['rock8'] },
  'gr-blues': { by: 'style', boogie: ['boogie'], shuffle: ['texasshuffle'], boogieSwing: ['jumpblues', 'texasshuffle'], r5b7: ['bluesrock', 'boogie'], slowBlues: ['slowblues'] },
  'gr-approach': { by: 'style', approach: ['pop8'], fifthApproach: ['rock8'], motown: ['motown'], pop8: ['pop8'] },
  'gr-world': { by: 'style', reggae: ['onedrop'], bossa: ['bossa'], tumbao: ['mambo', 'chacha'] },
  'gr-genres': { by: 'style', countryTwo: ['twostep'], samba: ['samba'], secondLine: ['secondline'], afrobeat: ['afrobeat'] },
  'gr-funk': { by: 'style', funk16: ['funk16'], funkOct: ['funkdisco', 'funkopen'], fill: ['funkopen'] },
  'gr-soul': { by: 'style', neoSoul: ['neosoul', 'lofi'], soulBallad: ['rnbballad', 'popballad'], motown: ['motown'] },
  'gr-funk-changes': { by: 'style', funk16: ['funk16'], funkOct: ['funkdisco', 'funkopen'] },
  'gr-odd-meters': { by: 'meter', 54: ['five32'], 68: ['six8rock', 'folk68'], 74: ['sevenfour'], 78: ['seven223'] },
  'gr-fills': swingOr(['texasshuffle'], ['rock8']),
  'gr-waltz': { by: 'style', countryWaltz: ['waltz'], jazzWaltz: ['jazzwaltz'], waltzBallad: ['waltz', 'threefour'], ballad68: ['folk68', 'six8rock'], afro128: ['afro68', 'soulballad'], gospel128: ['soulballad'] },
  'gr-metal': { by: 'style', metalChug: ['skank', 'metaldk'], doubleKick: ['metaldk'], breakdown: ['breakdown'], djent: ['djent', 'metaldk'], doom: ['doom', 'breakdown'] },
  'gr-reggae': { by: 'style', rockers: ['rockers', 'onedrop'], steppers: ['steppers', 'rocksteady'], rocksteady: ['rocksteady'], skaWalk: ['ska'] },
  'gr-world-grooves': { by: 'style', highlife: ['highlife'], cumbia: ['cumbia', 'chacha'], soca: ['soca', 'ska'], maqsum: ['maqsum', 'afrobeat'] },
  'gr-latin': { by: 'style', songo: ['songo', 'chacha'], partidoAlto: ['partidoalto', 'samba'], baiao: ['baiao', 'samba'], chacha: ['chacha'] },
  'gr-electronic': { by: 'style', boomBap: ['boombap'], ukGarage: ['garage', 'breakbeat'], dnb: ['dnb', 'breakbeat'], tripHop: ['triphop', 'lofi'] },
  'gr-gospel': { by: 'style', gospelWalk: ['stax', 'motown'], gospelShuffle: ['gospelshuffle', 'texasshuffle'], rnb: ['rnbballad', 'boombap'] },
  // walking
  'wk-two-feel': ['twofeel'],
  'wk-giant-steps': ['upswing', 'swing'],
  // licks
  'lk-rock-blues': swingOr(['texasshuffle'], ['rock8']),
  'lk-blues': swingOr(['jazzshuffle', 'swing'], ['bluesrock', 'boogie']),
  'lk-bebop': swingOr(['bebop', 'swing'], ['bossa']),
  'lk-modern': swingOr(['swing'], ['jazzfunk', 'funkslow']),
  // slap
  'sl-thumb-pop': { by: 'style', thumb: ['funk16'], octPop: ['funkdisco', 'funkopen'] },
  'sl-grooves': { by: 'style', tmp: ['funk16'], hammer: ['funkghost', 'funkopen'], triad: ['funkslow'] },
  'sl-advanced': { by: 'style', ghostFunk: ['funkghost', 'funk16'], popFill: ['funklinear', 'funkopen'] },
  'sl-double-thumb': ['funkrock', 'funk16'],
  'sl-octaves-16': swingOr(['funkhalfshuffle', 'lofi'], ['funk16']),
  // the pentatonic and rock studies
  'sc-pent-three-boxes': PENT, 'sc-pent-minor-grooves': PENT, 'sc-pent-one-phrase': PENT, 'sc-pent-major-chord': PENT, 'sc-pent-groove-fill': PENT,
  'tech-pick-alt': swingOr(['rockshuffle'], ['rock8']),
  'tech-pick-gallop': swingOr(['rockshuffle'], ['gallop']),
  // the song studies: their song's style (our own patterns, as in the room)
  'mm-stomp': ['rockfloor', 'rock8'], 'mm-pulse': ['rockballad', 'popballad'], 'mm-zombie': ['rock8'], 'mm-spirit': ['rock8'],
  'mm-dust': ['disco', 'dance'], 'mm-sunshine': ['rocktoms', 'rock8'], 'mm-standby': ['stax', 'motown'], 'mm-calif': ['rockride', 'rock8'],
  'mm-feelgood': ['boombap'], 'mm-blitz': ['punk', 'rock8'], 'mm-pressure': ['pop8'], 'mm-jean': ['pop8'],
  'mm-together': ['rocktoms', 'rockhalf'], 'mm-longview': ['poppunk', 'rock8'], 'mm-chain': ['rock8'], 'mm-money': ['sevenfour'],
  'mm-criminal': ['synthpop', 'dance'], 'mm-goodtimes': ['disco', 'dance'], 'mm-flyaway': ['rock8'],
  'mm-schism': ['five8', 'seven223', 'seven322'], 'mm-cantstop': ['funkrock', 'funk16'], 'mm-hysteria': ['rock16', 'rock8'],
  'mm-duke': ['phillysoul', 'motown'], 'mm-whatsgoingon': ['uptownsoul', 'motown'], 'mm-deantown': ['funkghost', 'funk16'],
  'mm-yyz': ['five32', 'rock8'], 'mm-tommy': ['funkrock', 'funk16'], 'mm-teentown': ['jazzfunk', 'funk16'], 'mm-thump': ['funk16'],
  'mm-solo-piece': ['rockballad', 'rock8'],
};
/** The exercises listed above (the self-test checks each is real). */
export const BAND_IDS = Object.keys(BAND);
const BY_MODULE = { walking: ['swing'], licks: JAZZ, grooves: ['rock8'], slap: ['funk16'], music: ['rock8'] };

/** True for the exercises the band plays with. */
export const isBandExercise = (tpl) => !tpl.game && (MODULES.has(tpl.module) || ALSO.has(tpl.id));

/** The entry of an exercise: its own, else its module's. */
const entryOf = (tpl) => BAND[tpl.id] || BY_MODULE[tpl.module] || null;
/** The option that sets the exercise's style, if any ('style', 'feel', 'meter'). */
export const bandBy = (tpl) => entryOf(tpl)?.by || null;
/** Where the player's choice is kept: the exercise, and the value of the option that sets its style. */
export const bandKey = (tpl, p) => { const by = bandBy(tpl); return by ? `${tpl.id}:${p[by]}` : tpl.id; };
/** The patterns the app tries for these options, in order. */
export function bandCandidates(tpl, p) {
  const e = entryOf(tpl);
  if (!e) return [];
  return Array.isArray(e) ? e : (e[p[e.by]] || e[Object.keys(e).find((k) => k !== 'by')] || []);
}

const UNIT = { q: 1, e: 0.5, dq: 1.5 };
/** A pattern's beat in quarter notes. */
export const patternUnit = (s) => UNIT[s.beat];
/** The exercise's bar: its length in quarter notes, its beat in quarters, its groups (7/8 2 + 2 + 3). */
export function meterOf(inst) {
  const ts = inst.timeSig || [4, 4];
  const bpb = inst.beatsPerBar || 4;
  const barQ = (ts[0] * 4) / ts[1];
  return { barQ, unit: barQ / bpb, bpb, eighths: ts[1] === 8, groups: inst.groups || null };
}
/** A pattern fits a bar of the same length, counted the same way (an x/8 bar in 8ths or dotted quarters, x/4 in quarters). */
export function fits(s, m) {
  if (!s || Math.abs(s.beats * UNIT[s.beat] - m.barQ) > 1e-6) return false;
  if (m.eighths !== (s.beat !== 'q')) return false;
  // (an odd bar's groups: the pattern's own, where it counts the same beats)
  if (m.groups && s.groups && s.beats === m.bpb && s.groups.join() !== m.groups.join()) return false;
  return true;
}
const open = (key, pro) => pro || FREE_STYLE.has(key);

/**
 * The pattern the app chooses: the first of the exercise's that fits its metre and that the player has; else, for a
 * free player, the free pattern that fits and is closest (the same grid, triplets or 16ths; then the same genre as
 * the one meant); else null (the click stays).
 */
export function matchedStyle(tpl, p, inst, pro) {
  const m = meterOf(inst);
  const cands = bandCandidates(tpl, p).filter((k) => fits(STYLES[k], m));
  const own = cands.find((k) => open(k, pro));
  if (own) return own;
  const meant = STYLES[cands[0]];
  let best = null, score = -1;
  for (const s of Object.values(STYLES)) {
    if (!open(s.key, pro) || !fits(s, m)) continue;
    const sc = (meant && s.grid === meant.grid ? 2 : 0) + (meant && s.genre === meant.genre ? 1 : 0);
    if (sc > score) { best = s.key; score = sc; }
  }
  return best;
}

/** The pattern that plays: the player's own choice (while it fits and is open to them), else the matched one. */
export function bandStyle(tpl, p, inst, { pro, chosen }) {
  const own = chosen?.[bandKey(tpl, p)];
  if (own && STYLES[own] && open(own, pro) && fits(STYLES[own], meterOf(inst))) return own;
  return matchedStyle(tpl, p, inst, pro);
}

/**
 * One beat of the exercise (beat `k` of bar `bar`, `unit` quarter notes long) in a drum pattern whose beats are `pUnit`
 * quarters (6/8 counted in 8ths over a pattern in dotted quarters, or the same beat): the pattern's hits that fall in
 * it, as [where in the exercise's beat (0–1), piece, velocity].
 */
export function bandHits(s, unit, pUnit, k, bar) {
  const q0 = k * unit, q1 = q0 + unit, out = [];
  for (let j = Math.floor(q0 / pUnit + 1e-9); j * pUnit < q1 - 1e-9; j++) {
    for (const [f, piece, v] of beatHits(s, s.sub, bar, j % s.beats)) {
      const q = (j + f) * pUnit;
      if (q >= q0 - 1e-9 && q < q1 - 1e-9) out.push([(q - q0) / unit, piece, v]);
    }
  }
  return out;
}
/** The pattern's subdivisions in that beat (where the arpeggio and the guitar's chugs play): [where (0–1), on the pattern's beat]. */
export function bandTicks(s, unit, pUnit, k) {
  const q0 = k * unit, q1 = q0 + unit, out = [];
  const ticks = clickTimes(s, s.sub);
  for (let j = Math.floor(q0 / pUnit + 1e-9); j * pUnit < q1 - 1e-9; j++) {
    ticks.forEach((f, i) => {
      const q = (j + f) * pUnit;
      if (q >= q0 - 1e-9 && q < q1 - 1e-9) out.push([(q - q0) / unit, i === 0]);
    });
  }
  return out;
}

/** The chord sound that plays: the player's, while it is open to them (free players: Pad, E-piano, Arpeggio). */
export const bandSound = (v, pro) => (BAND_SOUNDS.some(([k]) => k === v) && (pro || FREE_SOUNDS.has(v)) ? v : 'epiano');
