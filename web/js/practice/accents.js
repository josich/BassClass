// The metronome's accents (user, 2026-10-23): a tap on a beat light accents it, so the player makes their own
// groupings (3 + 2 + 2, 2 + 2 + 3…). Until they do, a bar takes its most common grouping, or the drum
// pattern's own (its `groups`). Beat 1 accented is the strong accent; any other accented beat a group's.
import { groupStarts } from './styles.js';

/** The usual grouping of a bar of 5 to 12 beats (up to 4: beat 1 alone). */
const COMMON = { 5: [3, 2], 6: [3, 3], 7: [2, 2, 3], 8: [3, 3, 2], 9: [3, 3, 3], 10: [3, 3, 2, 2], 11: [2, 2, 3, 2, 2], 12: [3, 3, 3, 3] };

/** The accented beats a bar starts with: the drum pattern's groups, else the usual grouping. */
export function defaultAccents(beats, pattern) {
  if (pattern?.groups && pattern.beats === beats) return [...groupStarts(pattern)].sort((a, b) => a - b);
  const groups = COMMON[beats];
  if (!groups) return [0];
  const out = [];
  groups.reduce((at, g) => { out.push(at); return at + g; }, 0);
  return out;
}

/** The accented beats now: the player's own for this many beats (`room.accents`), else the default. */
export function accentsFor(room, pattern) {
  const own = room.accents?.[room.beats];
  return own ? [...own] : defaultAccents(room.beats, pattern);
}

/** The groups the accents make for the drums, from beat 1 ([3, 2, 2]); null with fewer than two. */
export function groupsOf(beats, list) {
  const at = [...new Set([0, ...list])].sort((a, b) => a - b);
  return at.length < 2 ? null : at.map((b, i) => (at[i + 1] ?? beats) - b);
}

