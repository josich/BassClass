# Design review · App icon "clef under glass" (final touches) · 2026-10-22

Brief: craft-only review of the user's chosen icon (uncommitted, on top of ae53c38):
`web/icons/icon.svg` (teal, +20% saturation) and, briefly, `web/icons/icon-dark.svg` (navy). The concept
(classic tapered bass clef with a round head), the colours, the glass treatment and the position (nudged
2 right / 3 down) are the user's FIXED choices and are not re-argued here. Checked in
`/js/dev/icons.html` (masks, sizes 16–192, wallpapers, grey, colour-blind, squint, themed, maskable, rail,
splash), in the app at 800×380 (30 px rail logo), and in my own tab with in-memory renders made through
`iconprep.js` `variant()`/`render()` (108-unit full bleed, maskable crop, 10–30 px/unit close-ups,
pixel-exact 16/24/30/32 px, pixel sampling for contrast, geometry on a 20 px/unit raster). Every fix below
was prototyped the same way, in memory, and measured.
Not checked: real launchers (Pixel themed icons, One UI), DPR > 1 rendering of the rail logo, the PNGs
(not rendered yet). **The browser pane's screenshots desaturate colour** (a `#22be8f` swatch showed as
about `#74be93`), so colour was judged from measured pixel values, never from screenshots.

Proposal files (my fixes 1–5 applied, nothing else changed): `design/concepts/clef-final-touches/icon.svg`
and `design/concepts/clef-final-touches/icon-dark.svg`. `git diff --no-index` against `web/icons/` shows
only the lines listed under Recommendation.

Verdict: icon.svg — **REFINE**. The icon is sound and reads at every size and on every wallpaper. Five
measurable craft defects remain, all in the glass layer and the tail tip, each with an exact fix below. With
them it is ready to ship.

## Scores

| Principle | icon.svg now | icon.svg with fixes 1–5 | icon-dark.svg now |
|---|---|---|---|
| 1 Concept | 4: the clef says "bass" without text (the user's choice, accepted). | 4: unchanged. | 4: same. |
| 2 Recognition | 5: the F-clef silhouette reads in a 1-second glance, in grey, blurred and in monochrome. | 5 | 5 |
| 3 Simplicity | 4: one glyph. The glass adds four effects (band, glow, rim, shadow), which is the limit. | 4 | 4 |
| 4 Scalability | 4: clear at 24–192 px and in the 30/40 px rail logo. At 16 px the thin tail fades and the lower dot touches the curl (gap 0.5 px). | 4: fix 7 (optional) and fix 8 (optional) raise this to 5. | 4 |
| 5 Colour | 4: clef 6.0–6.4:1 on the field (4.4:1 under the band); tile 7.0:1 on the rail. The tile's top is 1.17:1 on white. | 4: top edge of the rounded tile on white 2.8 → 3.3:1. | 3: mint clef 10–12.7:1, but the navy field is 1.07:1 on the rail and 1.2:1 on black, and the right side has no lit edge. |
| 6 Composition | 4: the nudge works (see F-facts). The band edge nearly touches the head, the upper dot and the counter. | 5: band clears every shape by at least 2.2 units. | 4 |
| 7 Platform fit | 3: tail tip at r 33.18 (0.18 outside the safe circle); band kinks and a white glow hotspot sit in the bleed (maskable crop, parallax). Full-bleed background and mono layer OK. | 5 | 3 |
| 8 Distinctiveness | 3: the clef is shared with category icons (user's choice, accepted). The navy-on-teal glass tile is what sets it apart, so the glass must be clean. | 3 | 3 |
| 9 Craft | 3: tangencies, two kinks, a grey-keyline rim, the light coming from two directions. | 4–5: 5 with the optional shadow fix 6. | 3 |
| 10 Brand / modernity | 4: the clef ink is the app's navy and the tile is the accent teal. The rim reads 2010s. | 5: light from above with a thin tinted edge, matching current glass icons. | 4 |

## What the references say

- Android adaptive icons — https://developer.android.com/develop/ui/views/launch/icon_design_adaptive —
  the inner 66 dp are never clipped by an OEM mask. The outer 18 dp are reserved for masking and for
  parallax and pulse effects, so the bleed is sometimes seen and must look finished. This bears on F2, F3
  and F5. No shadows may sit around the icon's outline; the glyph's own shadow is fine.
- Apple Icon Composer — https://developer.apple.com/icon-composer/ — glass icons use "a new, vertical light
  angle", with light from above and crisp specular highlights at the edges. The clef's shadow already falls
  straight down and the glow rises from the bottom centre. Only the rim light is diagonal (F4).
- W3C / web.dev maskable icons — https://web.dev/articles/maskable-icon — key content goes inside the
  centred circle of radius 40%; some platforms show more of the image. `icon-maskable-512.png` exposes
  x 12..96, where the band's kinks and the glow's white core are visible today (F2, F5).
- Dribbble "liquid glass app icon" search — https://dribbble.com/search/liquid-glass-app-icon (Pinterest not
  used this round; round 1 found it behind a sign-in wall). The best-executed thumbnails come from
  Alexander Käßner. None uses a grey keyline: the tile edge is a thin light line, brightest at the top.
- NotePlan — https://dribbble.com/shots/26703329-NotePlan-Liquid-Glass-App-Icon — a pale glass tile holds
  its edge with a thin, slightly darker tinted rim and a light inner line, not a neutral grey ring. This is
  the model for F4 on the pale-topped teal tile.
- Direct Mail — https://dribbble.com/shots/27347296-Direct-Mail-Liquid-Glass-App-Icon — a gradient field
  lighter at the top, with every highlight obeying one light direction. That is the consistency F4 restores.
- Blender (glass) — https://dribbble.com/shots/27347313-Blender-Liquid-Glass-App-Icon — a dark tile on a dark
  page keeps its silhouette through a continuous light rim on all sides, which is the fix for the navy
  variant (N2).
- Category scan, round 1 (`design/reports/2026-10-22-app-icon.md`, Play searches): clefs are used by Bass
  Trainer and Perfect Ear. Nothing in the bass and tuner categories uses a teal glass tile with a navy glyph.
  Distinctiveness therefore rests on the treatment, so its execution matters more than usual.

## Findings

Geometry (icon units on the 108 canvas; centre (54, 54); the clef group is `translate(26.3 28.1) scale(0.55)`):
clef bbox x 34.55–78.00, y 31.95–81.95; head centre (41.15, 47.90) r 6.6; dots (74.15, 40.75) and
(74.15, 55.05) r 3.85; counter about 10 units wide; ink centroid (55.94, 49.39), bbox centre (56.27, 56.95).

### icon.svg (teal)

**F1 · The reflection edge nearly touches three shapes.** Principles: craft and Gestalt (edges that almost
coincide read as mistakes; a decisive crossing or a clear gap reads as intended). Evidence, measured from the
band curve: it passes **0.46** units above the upper dot, **1.16** above the head, and dips **0.84** units into
the top of the counter, leaving a lit sliver inside the hole. At 144 px these are 0.9 px, 2.3 px and 1.7 px
slivers; at 512 px (Play listing) they are plainly visible. Fix: raise the curve 3 units. Keep the shine's
falloff matched (`shine` y2 49 → 46). New clearances: dot 3.45, head 4.04, counter 2.16. The band still
crosses the curl's top decisively: it covers 3 of the stroke's 5.2 units, entering at (37.9, 37.9) on the
left and crossing the right shoulder at about 30°.

**F2 · The band's ends are kinked.** Principle: craft (G1 continuity), platform fit (the bleed is shown).
Evidence: the edge runs `L90 39` then `V36.5` at x=108, so at x=90 it turns about 30° upward into a V notch.
At x=18 the line to (0, 55) bends away from the curve's tangent. Both kinks sit 6 units inside the edges of
the maskable crop (x 12..96), and the launcher's parallax or pulse can show them. Fix: continue the curve's
end tangents (slopes 6/22 on the right, 12/22 on the left). Together with F1:
`<path d="M0 0 H108 V40.9 L90 36 C68 30 40 34 18 46 L0 55.8 Z" fill="url(#shine)" opacity="0.5"/>`

**F3 · Tail tip: your 33.2 is confirmed.** Geometric tip (36.20, 82.00), r = **33.18**. Rendered ink
(alpha ≥ 50%) reaches 33.05; the area outside the 66-unit circle is 0.003 unit², a needle point. No real mask
cuts it (the circle mask, r 36, leaves 2.8 units), but it breaks the spec and leaves no margin for pulse
scaling. Fix, keeping your position: end the tail at (19, 97.3) instead of (18, 98) in the 100-unit clef box,
`C77 61 57 81 18 98 C46 80` → `C77 61 57 81 19 97.3 C46 80`. The tip moves to (36.75, 81.62), r = **32.56**
(rendered 32.39). The tail is 0.7 icon units shorter and both end tangents turn by less than 0.5°, so the
taper is unchanged. Clef, shadow and mono all follow, since they share `#clef`. (If you'd rather not touch
the drawing: move all three clef groups by (+0.3, −0.3), i.e. `translate(26.6 27.8)`, with the shadow at
`translate(26.6 29.6)`. That gives r = 32.77 but undoes part of the nudge.)

**F4 · The rim reads as a grey frame, lit from a different direction.** Principles: craft (one light
direction), modernity (glass edges are a crisp light line, not a keyline), colour (black over pale mint
desaturates to grey). Evidence: black at 0.35 over the top field gives `#7ca296`, a neutral grey. At 192 px it
is a 2.7 px grey ring plus 2.9 px of white; at 512 px, 7 px plus 8 px. The rim light runs diagonally (0.95 at
top-left to 0.6 at bottom-right), while the shadow and the glow say the light comes from above. Fix:
- `<linearGradient id="rimLight" x1="0" y1="18" x2="0" y2="90" gradientUnits="userSpaceOnUse">` with stops
  `0: 0.9`, `0.35: 0.12`, `0.75: 0.06`, `1: 0.5` (white).
- light ring `<rect x="19.375" y="19.375" width="69.25" height="69.25" rx="14.625" … stroke-width="1.25"/>`
  (covers 18.75–20.0)
- edge `<rect x="18.375" y="18.375" width="71.25" height="71.25" rx="15.625" fill="none" stroke="#03382a" stroke-opacity="0.5" stroke-width="0.75"/>`
  (covers 18.0–18.75, concentric with the rx 16 tile)

Measured result: the rounded tile's top edge on white goes from 2.8 to 3.3:1 and is teal, not grey; the
sides stay at 5.2:1; on the rail the top is 16:1.

**F5 · The glow has a white hotspot in the bleed.** Principle: platform fit (the bleed is seen in the
maskable crop and during parallax). Evidence: the radial core is pure white at y = 98, outside the tile. The
maskable image's bottom edge (y 96) is about 0.93 white, brighter than anything in the visible tile (0.72 at
y 90). Fix: give the gradient a plateau so nothing beyond the tile is brighter than its bottom edge:
`<stop offset="0" stop-color="#e6fff8" stop-opacity="0.72"/><stop offset="0.25" stop-color="#e6fff8" stop-opacity="0.72"/><stop offset="0.4" stop-color="#d6fff3" stop-opacity="0.55"/><stop offset="1" stop-color="#d6fff3" stop-opacity="0"/>`.
Inside the 72-unit square the result is pixel-identical (every visible point has r ≥ 0.25).

**F6 (optional, taste) · The shadow reads as an offset drop shadow.** Principle: modern glass depth is
ambient; the clef should sit *in* the glass, not float above it. Evidence: at 192–512 px each dot gets a hard
dark crescent below it (blur 0.72 icon units against an offset of 1.8). Fix: `feGaussianBlur stdDeviation`
1.3 → **2.2**, shadow group `translate(26.3 29.9)` → `translate(26.3 29.5)`, opacity 0.5 → **0.45**. I
compared both at 12 px/unit: the softer one reads as depth, with no crescents. It is not in the proposal file.

**F7 (optional) · The lower dot crowds the curl at small sizes.** Principle: scalability. Evidence: the
dot-to-curl gaps are 3.12 (upper) and **2.28** (lower) units, which is 1.3 and 0.95 px in the 30 px rail logo
and 0.5 px at 16 px, where the lower dot fuses. Fix: both dots `cx 87 → 87.8` (+0.44 icon units), giving
gaps of 3.5 and 2.7. The dots still straddle the head's line, as engraving wants, and the upper dot's outer
edge stays at r 28.3. This is not in the proposal file.

**F8 (optional) · A small rendition for the favicon.** Principle: scalability (hinting by simplification at
16–32 px). Evidence: at 16 px the band washes out the curl's top pixels and the rim pixels turn grey.
Prototype checked at 16 px ×9: flat tile (base gradient only), no band, glow, rim light or shadow, the 0.75
tinted edge, and the clef at `translate(23 25) scale(0.616)` (12% larger; the tail tip stays inside the
tile's corner arc). Head, curl and both dots come out separate and solid. This needs a second
`<link rel="icon">` and an `icon-small.svg`, which is the user's call.

**Facts, no change proposed:**
- Position: ink centroid 1.9 right and 4.6 up from the centre, bbox centre 2.3 right and 3.0 down. Your
  nudge balances the top-heavy ink, and the icon reads as centred, slightly right because of the dots.
- Contrast: clef on field 6.0–6.4:1, under the band 4.4:1, tail tip on the glow 6.2:1. Grey, protanopia,
  deuteranopia and tritanopia all keep a dark clef on a mid field. Themed light and dark both read.
- The tile's top (`#bef9e7`) is 1.17:1 on white. On a white launcher wallpaper, where the launcher draws no
  edge, the top arc of the circle dissolves while the sides hold at 2.4:1. This comes with the light-topped
  glass gradient you chose; the clef (6:1) carries recognition, so I am not proposing a colour change.
- Rail logo (30 px at 800×380): clear clef, dots separate (see F7 for the lower one), at 7:1 against the rail.
  The navy ink matches the app's navy and the tile matches the accent teal of "Start" and the chips.

### icon-dark.svg (navy), briefly

- **N1 · F1–F5 apply unchanged** (same geometry). They are in the proposal file.
- **N2 · The tile disappears on dark surfaces, which is its intended use.** Evidence: field `#0e1348` is
  1.07:1 on the rail `#1a1d38` and 1.2:1 on black. The diagonal rim lights the left side (3.5:1) but the
  right side is at opacity 0.05, so the silhouette is lopsided. Fix: the vertical rim from F4 with stronger
  sides, stops `0: 0.9`, `0.35: 0.4`, `0.75: 0.32`, `1: 0.6`, and edge stroke `#02031a`, opacity 0.5, width
  0.75. Measured: both sides at least 3.1:1 on the rail, top 14:1.
- **N3 · Glow plateau colour** for F5: `#5edab9` at 0.72 for stops 0 and 0.25, then `#46c9a2` 0.55 → 0, as now.
- **N4 · Contrast:** mint clef 10.4–12.7:1, 5.4–5.7:1 under the band. The lowest is the tail tip on the teal
  glow at 3.5:1, which still passes 3:1.
- **N5 (fact):** in a launcher mask (no rim) the navy circle vanishes on black except its top and its glow.
  That doesn't matter while it is not a launcher icon; if it ever becomes one, the edge would have to be in
  the background layer.

## Recommendation

Take icon.svg forward with these changes, in order (fixes 1–5 are already in
`design/concepts/clef-final-touches/icon.svg` and `icon-dark.svg`, ready to copy over `web/icons/`):

1. **Band (F1 + F2):** `<path d="M0 0 H108 V40.9 L90 36 C68 30 40 34 18 46 L0 55.8 Z" …/>` and `shine` `y2="46"`.
2. **Tail tip (F3):** in `#clef`, `… C77 61 57 81 19 97.3 C46 80 …` (r 33.18 → 32.56).
3. **Rim (F4):** vertical `rimLight` (`x1="0" y1="18" x2="0" y2="90"`, stops 0.9 / 0.12 / 0.06 / 0.5);
   light rect `19.375 / 69.25 / rx 14.625 / width 1.25`; edge rect `18.375 / 71.25 / rx 15.625`,
   `stroke="#03382a" stroke-opacity="0.5" stroke-width="0.75"`. Navy: stops 0.9 / 0.4 / 0.32 / 0.6 and
   edge `#02031a`.
4. **Glow (F5):** plateau stops (teal `#e6fff8`, navy `#5edab9`, 0.72 up to offset 0.25).
5. Render the PNGs (`iconprep.js run()`) and look at `icon-maskable-512.png` and the 512 icon once.
6. Optional: softer shadow (F6), dots +0.8 (F7), favicon small rendition (F8).

Questions for the user: do you want the optional softer shadow (F6) and the dot spacing (F7)? Both are
small, visible only at 192 px and up (F6) or at 30 px and below (F7). Should the favicon get its own
simplified rendition (F8)?
