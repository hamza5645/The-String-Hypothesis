# 10 · Out of Reach — Why haven't we seen a string?

**Thesis:** If strings are as small as traditional estimates suggest (near the Planck length), they lie some fifteen powers of ten below the smallest distance any experiment has resolved. Seeing them directly would take up to ~10¹⁵ times the LHC's collision energy: a ring thousands of light-years around, which still could not work. The string scale itself is unknown, and speculative low-scale versions have been searched for and not found. So for now every test of string theory is indirect.

**Overall status:** `OBSERVED ●`. The scales, the energy gap and the collider arithmetic are measured numbers, or established physics applied to them. Three things carry their own marks: the Thread (`SPECULATIVE ○ ~ ANALOGY`), the black-hole "resolution floor" (`CONJECTURED ◌`) and the possible string lengths (`SPECULATIVE ○`, with one `DERIVED ◑` band).

---

## Storyboard

**Global stage conventions (all beats).**
- **Coordinates and colors:** scene units; default camera = `HANDOFF.camera` from `src/core/handoff.ts` (position `(0, 0, 10)`, fov 35°), so the H0/H1/H2 handoff frames match the neighbouring chapters. The view is 6.31 units high at the origin. As in chapter 1, s = log₁₀ of the viewport height in meters.
- **The Thread** is a filament tube with a `#FFF6E8` core, an `#FFC98A` halo and additive bloom.
  - It is drawn with chapter 1's **capsule renderer** (resolution blur δ = L/50; warmth r = smoothstep(1.0, 3.0, ℓ/δ), the corrected chapter 1 rule, so warmth starts only once ℓ > δ). A string smaller than the current resolution is therefore a round Ink-white glow, identical to H0.
  - **Warm light appears only when a string is resolved.** In this chapter that happens only in the opening frame and inside the Beat 4 magnifier.
- **Diagram linework** is 1 px Field `#86A8D8` hairlines. Measured objects are Ink `#ECE6D9`.
- **Labels** are DOM overlays in IBM Plex Mono, uppercase, tabular digits, with real units.
- **Engine:** every beat is driven by `progress` / `presence` in uniforms, with no per-frame React work.
- **Precision (same rule as chapter 1):** scales here run from 10⁻³⁶ m to 10²⁷ m. Do all positioning on the CPU in float64 (JS numbers) as ratios size/L and offset/L, and send only the ratios to the GPU. Cull objects whose ratio falls outside [10⁻³, 10³]. Point sprites are exempt, because they have a fixed pixel size.
- **Scale gauge** (left edge on desktop, top strip on phones): shows the current scene's characteristic length. Uses SI prefixes up to Q (10³⁰) and down to q (10⁻³⁰), and scientific notation beyond.

**The Ruler** is this chapter's recurring instrument, used in Beats 1–3 and 6 and in the Lab.
- **Scale:** a 62-decade logarithmic axis from s_max = log₁₀(8.8 × 10²⁶) = 26.94 (left) to s_min = log₁₀(1.616 × 10⁻³⁵) = −34.79 (right). Left is big and right is small, so moving right is moving "down" in scale, and it is also the direction in which energy grows.
- **No wall at ℓ_P:** past the Planck tick, the baseline continues as an unlabeled dotted stub (Field, 25% alpha) to s = −36 (same mapping, about 2% of W further right). The Planck length is a scale, not a proven smallest length, and the axis must not look as if it ends there.
- **Desktop:** horizontal, from x = 6% to 94% of viewport width, at y = 55%. It is a 1 px Ink-3 baseline with a decade tick at every integer s: 4 px minor ticks and 10 px major ticks every 5 decades, labeled `10²⁵ m`, `10²⁰ m` and so on.
- **Mapping:** screen x(s) = x₀ + (s_max − s)/(s_max − s_min) · W.
- **Phones:** vertical, from 12% to 88% of viewport height at x = 24%, with the universe at the top. Landmark labels go to the right and energy labels (Beat 3) to the left.
- **Landmark glyphs:** 14 px hairline icons with mono labels, alternating above and below the axis to avoid collisions. Set:
  - `OBSERVABLE UNIVERSE 8.8 × 10²⁶ m`
  - `ANDROMEDA (DISTANCE) 2.4 × 10²² m`
  - `MILKY WAY 8.3 × 10²⁰ m`
  - `NEAREST STAR (DISTANCE) 4.0 × 10¹⁶ m`
  - `SOLAR SYSTEM (NEPTUNE'S ORBIT) 9.0 × 10¹² m`
  - `EARTH 1.27 × 10⁷ m`
  - `TALL TREE ~100 m`
  - `YOU 1.7 m`
  - `PAPER 1 × 10⁻⁴ m`
  - `CELL 1 × 10⁻⁵ m`
  - `ATOM 1 × 10⁻¹⁰ m`
  - `NUCLEUS 1 × 10⁻¹⁴ m`
  - `PROTON 1.7 × 10⁻¹⁵ m ACROSS`
  - `EDGE OF DIRECT MEASUREMENT ~10⁻¹⁹ m`
  - `PLANCK LENGTH 1.6 × 10⁻³⁵ m`

**Scroll map** (chapter `progress`):

| Section | Progress |
|---|---|
| Opening | 0.00–0.06 |
| B1 | 0.06–0.20 |
| B2 | 0.20–0.34 |
| B3 | 0.34–0.48 |
| **B4 (aha)** | **0.48–0.66** |
| B5 | 0.66–0.78 |
| B6 | 0.78–0.88 |
| Lab | 0.88–0.97 |
| Outro/handoff | 0.97–1.00 |

"Local p" means progress re-mapped to 0–1 within a beat. Total scroll length is about 1300 vh, plus a 100 vh pinned lab.

### Opening: Out of Reach (p 0.00–0.06)

- **Text:** So far we have built a picture: vibrating strings, hidden dimensions, branes, dualities. None of it has been seen directly. So ask the plain question: if strings exist, why has no one ever seen one?
- **Status:** `OBSERVED ●`: no string has been detected. The Thread wears `SPECULATIVE ○ ~ ANALOGY`.
- **Stage:**
  - **First frame = H2**, chapter 9's final frame: one closed Thread loop at center, facing the camera and gently wobbling, in warm Filament light. Use the registry pose (`HANDOFF.H2`: radius 1.3, wobble 0.07, ω = 1.6 rad/s) via `src/gl/handoff.tsx`; do not re-create it. If chapter 9 is ever changed to end on H1, use `HANDOFF.H1` (length 4.2, ω = 2.2 rad/s) instead. Everything below works identically for either.
  - The Thread's length is ℓ_s = 10⁻³⁴ m (for H2, its circumference, 8.17 units). So the first frame has s₀ = log₁₀(10⁻³⁴ m × 6.31/8.17) = −34.11 for H2, or −33.82 for H1 (4.2 units, matching chapter 1's end frame).
  - The gauge reads `~1 × 10⁻³⁴ m · HYPOTHETICAL`, with hollow-ring tick marks (the SPECULATIVE form).
  - The title *Out of Reach* fades in (Bodoni Moda), with the italic question beneath.
  - **Local p 0.35 → 1.0:** the camera dollies straight back, so s goes from s₀ to −31.5 (δ grows ~400× from H2, ~210× from H1). The capsule renderer does the rest with no special effects:
    - The vibration's wiggle drops below the blur first.
    - Then the length does: ℓ/δ = 50ℓ/L passes 3 → 1 (s ≈ −32.8 → −32.3), so the warmth drains to Ink and the string rounds into a glow.
    - By local p = 1 (ℓ/δ ≈ 0.16) the frame is **H0**, a single Ink-white point at center.
  - Caption (mono, under the glow, `DERIVED ◑ ~ ANALOGY`; the point-like particles are `OBSERVED ●`): "Step back, and a string blurs into a point. Every elementary particle measured so far looks like a point."
  - Reduced motion: crossfade H2 → H0 over 0.6 s.
  - Fallback SVG: the H2 loop beside the H0 glow, with an arrow labeled "farther away".

### Beat 1: Sixty-two powers of ten (p 0.06–0.20)

- **Text:** From the Planck length to the width of the observable universe: about 62 powers of ten. On a [[logarithmic scale]], each factor of ten gets equal room. You are not in the middle. The middle is a tenth of a millimeter, the thickness of paper.
- **Status:** `OBSERVED ● ~ ANALOGY` (the sizes are measured; the glyphs are drawings).
- **Stage:**
  - **The zoom out (local p 0 → 0.7).** This is chapter 1's zoom in reverse: s runs from −31.5 to +26.94, which is 58 decades in 14% of scroll.
    - **Speed:** fast (about 1 decade per 0.08% of progress) through the unexplored stretch, where the decade rings are *dashed* and shrink inward toward the H0 point. It slows to about 1 decade per 0.19% through familiar scales, so 12.5 + 46 decades fit in 9.8% of progress.
    - **Measurement edge:** at s = −19 the rings turn solid, and a soft gradient band `EDGE OF DIRECT MEASUREMENT` sweeps past on the gauge.
    - **Ghost layers:** each lightweight layer is visible for about 0.8 decades and crossfades out. At most two are live at once, and each is at most 20k instanced points plus hairlines:
      - proton fog (Field, s ≈ −14.8)
      - carbon electron haze (Ink 25%, s ≈ −10)
      - a Voronoi cell mosaic (s ≈ −4.8)
      - a standing human point figure (s ≈ +0.2)
      - Earth as a hairline limb with a terminator (s ≈ +7.1)
      - the Sun and planetary orbit ellipses (s ≈ +12.9)
      - the Milky Way as a two-armed log-spiral point cloud (s ≈ +20.9)
      - cosmic-web filaments as points along curl-noise lines (s ≈ +25)
      - the observable universe as one hairline circle with a faint mottled fill (s ≈ +26.9)
    - Where chapter 1's layer modules are importable (a shared chunk), reuse them. Otherwise use these glyph-level versions.
    - The gauge counts up through km, Mm, Gm … Ym, Rm.
    - Gauge micro-caption at s ≈ +26: "Upward, the SI prefixes reach 10³⁰: enough for the universe. Downward they stop short of the Planck length."
  - **Lay the journey flat (local p 0.7 → 1.0).**
    - The universe circle shrinks and slides to the Ruler's left end, becoming its end glyph.
    - The Ruler draws itself left to right in 0.8 s (scroll-scrubbed).
    - Each ghost layer's icon flies to its landmark tick.
    - The H0 point glides to the Ruler's right end and sits on the Planck tick as a 6 px Ink glow.
  - **Two callouts pop, 0.3 s apart:**
    - `YOU · 1.7 m` at 43% of the Ruler's length, with side brackets `27 POWERS OF TEN ↔` to the left and `↔ 35 POWERS OF TEN` to the right.
    - `MIDPOINT · 1.2 × 10⁻⁴ m · ABOUT A SHEET OF PAPER` at exactly 50%, drawn as a hairline paper-edge glyph (a thin rectangle seen edge-on).
  - Gauge: `8.8 × 10²⁶ m → 1.6 × 10⁻³⁵ m · 61.7 DECADES`.
  - Reduced motion: no zoom. Stills of five layers crossfade (1 s each), then the Ruler appears whole.
  - Fallback SVG: the Ruler with landmarks and both callouts.

### Beat 2: The unexplored quarter (p 0.20–0.34)

- **Text:** Measurements reach every scale from the universe's width down to about 10⁻¹⁹ m. The last sixteen powers of ten, a quarter of the ruler, remain unexplored. Enlarge an atom to the size of the observable universe: the Planck length becomes a tall tree.
- **Status:** `OBSERVED ● ~ ANALOGY` (the magnification is arithmetic; the tree is a comparison).
- **Stage:**
  - **Local p 0 → 0.35: paint what we know.** The Ruler's segment from s = 26.94 to −18 fills as a 3 px **solid Ink** bar, left to right. From −18 to −20 it becomes chapter 1's gradient band, labeled `EDGE OF DIRECT MEASUREMENT`. From −20 to −34.79 it becomes a **dashed Field** bar at 40% alpha (and the dotted stub continues past ℓ_P). Brackets draw beneath:
    - `PROBED · ~46 POWERS OF TEN` (solid).
    - `UNPROBED · ~16 · ABOUT A QUARTER` (dashed).

    The H0 point at the right end sits alone in the dashed region.
  - **Local p 0.35 → 0.9: the slide (the chapter's first surprise).**
    - A second row of four **tokens** appears 18 px beneath the Ruler, each directly under its real position: `ATOM`, `PROTON`, `LHC REACH`, `PLANCK LENGTH`. Tokens are Ink capsules with mono labels.
    - A mono label appears: `ENLARGE EVERYTHING × 8.8 × 10³⁶ (ATOM → UNIVERSE)`.
    - The whole token row then **translates left by exactly 36.94 decades** (log₁₀ 8.8 × 10³⁶), ease-in-out, scrubbed by scroll. The landmark row above stays fixed, because it holds real-world sizes.
    - On a log scale, multiplying everything is just a slide. The visitor watches that happen.
    - As each token settles, it prints its new size:
      - `ATOM → 8.8 × 10²⁶ m`, exactly under `OBSERVABLE UNIVERSE`.
      - `PROTON → ~1.6 MILLION ly`, between `MILKY WAY` and `ANDROMEDA`.
      - `LHC REACH → ~90 ly`, left of `NEAREST STAR`.
      - `PLANCK LENGTH → ~140 m`, beside a hairline tree glyph at the `TALL TREE` tick.
  - **Local p 0.9 → 1.0:** the tree glyph brightens slightly. Caption (`~ ANALOGY`, mono): "In an atom blown up to the universe, our sharpest view resolves ~90-light-year detail. A Planck-scale string would be tree-sized."
  - Small print under the tree: `~40–140 m, DEPENDING ON WHERE AN ATOM'S EDGE IS DRAWN`.
  - Reduced motion: the tokens jump to their final positions with a 0.4 s fade.
  - Fallback SVG: the two-row Ruler after the slide.

### Beat 3: Smaller means harder (p 0.34–0.48)

- **Text:** Recall Chapter 1: seeing smaller takes more energy, roughly ħc divided by the distance. Ten times smaller, ten times the energy. The LHC reached 13.6 TeV (trillion [[electronvolt]]s), resolving about 10⁻¹⁹ m. The Planck length needs about 10¹⁹ GeV: a million billion times more.
- **Status:** `OBSERVED ●`
- **Stage:**
  - **The energy axis unrolls.** It is a second hairline axis, 40 px below the Ruler (on phones, to its left), mirror-mapped with log₁₀(E/GeV) = −15.705 − s. Because every length tick gets its partner energy, **energy grows to the right**. Tick labels every 5 decades, from `10⁻⁴⁰ GeV` near the universe end (which sits at 10⁻⁴²·⁶ GeV) to `10¹⁵ GeV`; the Planck end reads 1.2 × 10¹⁹ GeV. The tokens from Beat 2 fade out.
  - **Energy landmarks** fade in left to right, each joined to its length by a vertical hairline:
    - `VISIBLE LIGHT ~2 eV ↔ ~10⁻⁷ m`
    - `X-RAYS ~keV ↔ ATOMS`
    - `~0.2 GeV ↔ 1 fm · NUCLEI`
    - `LHC 13.6 TeV ↔ 1.5 × 10⁻²⁰ m`
    - `PLANCK 1.22 × 10¹⁹ GeV ↔ 1.6 × 10⁻³⁵ m`
  - **Collision caption** at the LHC mark: "Protons are bags of quarks and gluons. Each collision uses only part of the 13.6 TeV, so ~10⁻¹⁹ m in practice."
  - **Two brackets on the energy axis:**
    - Solid Ink, from 1.22 MeV to 6.8 TeV: `1932 → 2022 · BEAM ENERGY PER PROTON · ~7 POWERS OF TEN IN 90 YEARS`.
    - Dashed Field, from 13.6 TeV to 1.22 × 10¹⁹ GeV: `~15 MORE TO THE PLANCK ENERGY`.

    A cursor bead slides along the dashed bracket while a readout multiplies: `× 10 … × 10⁵ … × 10¹⁰ … × 9 × 10¹⁴`.
  - **The concentration inset** (local p 0.7 → 1.0) is a small glass card, top-right. It shows two pictograms:
    - Left: a haze of 20k tiny Ink points (one LHC beam) labeled `ONE LHC BEAM (DESIGN) · ~360 MJ · SPREAD OVER 3 × 10¹⁴ PROTONS`.
    - Right: a single pair of points, labeled `PLANCK ENERGY · ~2 × 10⁹ J ≈ 60 L OF PETROL · IN ONE COLLISION`.

    Caption: "The total isn't the problem. Concentrating it is."
  - Gauge tracks the bead: λ = ħc/E, from 1.5 × 10⁻²⁰ to 1.6 × 10⁻³⁵ m.
  - Reduced motion: the bead is replaced by a static bracket, and the readout shows only the final value.
  - Fallback SVG: the Ruler plus the energy axis, the brackets and the inset.

### Beat 4: Build it bigger? (p 0.48–0.66) · **the chapter's aha**

- **Text:** Could we just build bigger? A ring's size grows in step with its energy. With the LHC's magnets, a Planck-energy ring would be about 2,500 light-years around. Light would need 2,500 years for one lap. The smallest target demands the largest machine.
- **Status:** `OBSERVED ● ~ ANALOGY`.
  - Chip tooltip override: "Arithmetic from established accelerator physics. No such machine exists or is planned. Assumes LHC magnets and all energy in one collision."
- **Stage:**
  - **Local p 0 → 0.12: the real machine.**
    - The Ruler folds away. The camera tilts to look straight down (pitch −82°, ±2° parallax) at a hairline map of the Geneva basin: a simplified Lake Geneva outline and the Jura ridge line in Ink-3, plus the France–Switzerland border as a dotted line. Use Natural Earth, public domain.
    - The **ring** is a Field circle (1.5 px plus a soft cool glow; *never warm*), circumference 26.7 km, drawn circular (`~ ANALOGY: real LHC is eight arcs and eight straights`).
    - One Ink **bead** (a proton bunch) laps it every 3 s of display time.
    - Labels: `LHC · 26.7 km · 13.6 TeV` and `LAP: 89 µs`.
    - A hairline **magnifier** circle (top-right, 120 px) shows the H0 glow tagged `TARGET · 1.5 × 10⁻²⁰ m`. A leader line runs from the magnifier to the ring's bottom point, the collision point, placed at CERN.
  - **Local p 0.12 → 0.85: the ring grows** (the aha, scroll-scrubbed).
    - **Energy and size:** the mono readout `COLLISION ENERGY` spins up logarithmically from 1.36 × 10⁴ to 1.22 × 10¹⁹ GeV. The ring's physical circumference follows the Lab Model: C = 26.659 km × (E/14 TeV) at 8.33 T. At 13.6 TeV that gives 25.9 km, 3% under the real ring drawn at p < 0.12; blend from 26.659 km to the Model value over the first decade of E (the difference is invisible at this framing).
    - **The framing rule:** the ring **stays the same size on screen** (diameter = 60% of the shorter viewport side), always touching CERN at its bottom point. The camera's field of view grows with it, so *the world shrinks away underneath*. This is chapter 1's zoom, turned into a machine.
    - **Landmarks:** fixed-physical-size Field hairline circles, each drawn when its on-screen diameter lies between 2% and 300% of the viewport. They are nested at the ring's contact point:
      - Earth disc (12,742 km)
      - Moon's orbit (768,800 km across, centered on Earth)
      - Sun
      - Earth's orbit (2 AU)
      - Neptune's orbit (60 AU)
      - a nearby-star field: 30k instanced Ink points, 1–2 px, density fading in as the field of view passes 10¹⁶ m, with `PROXIMA CENTAURI · 4.2 ly` labeled
    - **Overtake tags:** a mono tag pops (0.8 s, then settles at 50% alpha) as the ring's diameter passes each landmark:
      - `RING > EARTH · 2 × 10⁴ TeV`
      - `RING > MOON'S ORBIT · 1.3 × 10⁶ TeV`
      - `RING > EARTH'S ORBIT · 5 × 10⁸ TeV`
      - `RING > SOLAR SYSTEM · 1.5 × 10¹⁰ TeV`
      - `RING RADIUS > DISTANCE TO NEAREST STAR · 1.3 × 10¹⁴ TeV`
    - **The bead** keeps a 3 s display lap. Under it: `REAL LAP: 89 µs → … → 2,460 YEARS`.
    - **The magnifier never changes size.** Its target label counts down in step: `TARGET · 1.5 × 10⁻²⁰ m → … → 1.6 × 10⁻³⁵ m`.
  - **Local p 0.85 → 0.93: the landing (the frame that must land).**
    - The readouts lock: `PLANCK-ENERGY RING · ~2,500 ly AROUND · ~780 ly ACROSS`.
    - The camera eases in 8%. The leader line from the magnifier brightens, and a mono line runs along it: `MACHINE ÷ TARGET ≈ 10⁵⁴`.
    - Inside the magnifier, and only there, the H0 glow **resolves into a tiny warm Thread** (the capsule renderer at a magnified scale) for 1.5 s, then blurs back to a point. This is the thing the machine would be built to see.
    - Assumption line under the readouts: `ASSUMES LHC 8.33 T MAGNETS · ALL ENERGY IN ONE COLLISION (GENEROUS)`.
  - **Local p 0.93 → 1.0: honest proportion.**
    - The camera pulls back 2 more decades. The **Milky Way** appears: a two-armed log-spiral of 60k Ink points, 87,400 ly across, with the Sun marked 26,700 ly from the center.
    - The ring becomes a small circle there (< 1% of the galaxy's width). Tag: `NOT GALAXY-SIZED: A SMALL CIRCLE ON THE GALAXY'S MAP`.
  - Gauge: the map's field of view, from 5 × 10⁴ m to 10²¹ m.
  - Reduced motion: five stills (LHC, Earth, Earth's orbit, nearest star, Planck ring), each 1 s with its tag.
  - Fallback SVG: a 5-panel strip of the same stills, then the galaxy inset.

### Beat 5: A floor, not just a distance (p 0.66–0.78)

- **Text:** Size is not the only problem. Protons that energetic, steered by magnets, would radiate their energy away long before one lap. And beyond the Planck energy, a collision is expected to form a tiny [[black hole]], hiding the very detail it should reveal.
- **Status:** `CONJECTURED ◌`: the black-hole floor is a heuristic that combines quantum theory and general relativity. The synchrotron element carries its own `OBSERVED ●` tag.
- **Stage:**
  - **Local p 0 → 0.25: the radiation.**
    - The camera returns from the galaxy to the Planck ring's contact point: a 10 km window around CERN, where the ring looks like a straight Field line.
    - The bead enters and immediately sheds a spray of Ink photon sparks, forward-beamed along its path, as instanced streaks. Its brightness decays to nothing within 15% of the screen width.
    - Tag (`OBSERVED ●`): `AT THIS ENERGY, IN LHC MAGNETS: ENERGY LOST TO RADIATION LONG BEFORE ONE LAP`.
    - Secondary mono line: `LHC AT 6.8 TeV: ~6 keV PER LAP · ONE PART IN 10⁹`.
  - **Local p 0.25 → 1.0: the resolution floor.** The line becomes the x-axis of a hairline log–log chart:
    - **Axes:** x = collision energy E, from 10³ to 10²³ GeV, ticks every 2 decades. y = smallest resolvable size Δx, from 10⁻¹⁵ m (top) to 10⁻³⁶ m (bottom); smaller is lower.
    - **Curve 1** (Field, solid): `QUANTUM BLUR ħc/E`, falling.
    - **Curve 2** (Field, dashed): `BLACK-HOLE SIZE 2GE/c⁴`, rising. It is visible only where it exceeds 10⁻³⁶ m.
    - **Curve 3** (Ink, 2 px): their sum. It is U-shaped, with its minimum marked `~3 ℓP` at E ≈ 9 × 10¹⁸ GeV.
    - **Markers:** vertical hairlines at `LHC` and `PLANCK`.
    - **The bead:** a cursor bead rides Curve 3 from the LHC mark to 10²² GeV with local p, with the live readout `E = … GeV · Δx ≈ … m`. A small **probe glyph** at the bead (a bundle of 5 converging hairlines) narrows as Δx falls.
    - **Past the minimum,** the glyph turns into a black disc with a Field horizon ring whose radius grows with E. Tag: `MORE ENERGY → BIGGER BLACK HOLE → BLURRIER VIEW`. The bead and readout visibly climb again.
    - **String curve** (local p 0.8 → 1.0): a faint dotted Field curve `STRING SCATTERING` with the same U-shape. Draw Δx_s(E) = ħc/E + ℓs²·E/ħc (the string uncertainty relation Δx ≳ ħ/Δp + α′Δp/ħ, with α′ = ℓs²), for an *assumed* ℓs = 10⁻³⁴ m: its minimum, 2ℓs, sits at E = ħc/ℓs ≈ 2 × 10¹⁸ GeV, before the black-hole floor bites. Tag it `DERIVED ◑`: "String calculations: hit a string hard enough, and it spreads out."
    - Chip tooltip: "A heuristic, not a theorem. Widely expected; untested."
  - Gauge tracks the bead's Δx.
  - Reduced motion: the bead is replaced by three static markers (LHC, minimum, 10²² GeV).
  - Fallback SVG: the chart with all three curves.

### Beat 6: Where strings might be, and how to look sideways (p 0.78–0.88)

- **Text:** The [[string scale]] is unknown. Traditional estimates put strings somewhat longer than the Planck length. Speculative models allow strings big enough for the LHC to see; none has appeared. So physicists look sideways: signs in the early universe and short-range gravity, plus theoretical checks.
- **Status:** `SPECULATIVE ○` (where the string length lies). Each route card carries its own chip.
- **Stage:**
  - **Local p 0 → 0.4: the band.**
    - The chart collapses back into the Ruler, and the camera frames only its right end (s from −16 to −36), stretched to full width.
    - Three shaded zones appear above the axis:
      - **Excluded in those models** (s > log₁₀ 2.5 × 10⁻²⁰): Ink-3 cross-hatch ✕, labeled `STRINGS THIS LONG EXCLUDED IN TESTED LOW-SCALE MODELS · LHC`.
      - **Possible, model-dependent** (2.5 × 10⁻²⁰ → 10⁻³³ m): a sparse hollow-ring pattern in SPECULATIVE `#7D8190`, labeled `LOW OR INTERMEDIATE STRING SCALE · SPECULATIVE ○`.
      - **Traditional estimates** (10⁻³³ → 1.6 × 10⁻³⁵ m): a denser half-dot pattern in DERIVED `#86A8D8`, labeled `WEAKLY COUPLED STRINGS · DERIVED IN THOSE MODELS ◑`.
    - A small bracket at the Planck tick: `ℓs ≳ ℓP WHEN STRINGS INTERACT WEAKLY`.
    - The H0 point sits at 10⁻³⁴ m with `~ ANALOGY`.
  - **Local p 0.4 → 1.0: the routes.** Six hairline nodes fan out above the band, each a small glass card (≤ 20 words, below) with its chip. The Ruler compresses smoothly back to full width so that the long leaders fit. A curved leader runs from each experimental card to the scale it actually tests on the Ruler:
    - **CMB:** a two-ended leader, from the Ruler's far left (the sky, where it is measured) to ħc/10¹⁶ GeV ≈ 2 × 10⁻³² m (the energy it would reveal). Expansion links the largest and smallest scales; that is the lesson of this card.
    - **Cosmic superstrings:** from the far left to the string band.
    - **Gravity:** to 52 µm. **Colliders:** to the TeV edge (~10⁻¹⁹ m).
    - **Black holes and consistency** get no leader. Each carries a mono tag `THEORY CHECK · NOT A MEASUREMENT`.

    Cards appear 0.12 s apart:
    1. `EARLY UNIVERSE · CMB` (OBSERVED bound ● / link SPECULATIVE ○): "Primordial gravitational waves would reveal physics near 10¹⁶ GeV. Not yet seen: r < 0.036."
    2. `COSMIC SUPERSTRINGS` (SPECULATIVE ○): "Strings stretched to astronomical length by expansion. None found; gravitational-wave data limit their tension."
    3. `COLLIDERS` (OBSERVED ● null): "No superpartners, extra dimensions or string resonances so far. String theory doesn't fix superpartner masses."
    4. `GRAVITY AT SHORT RANGE` (OBSERVED ●): "Newton's inverse-square law holds down to 52 µm. Large extra dimensions must hide below that."
    5. `BLACK HOLES · THEORY` (DERIVED ◑): "For special black holes, string theory counts the microstates and matches the Bekenstein–Hawking entropy (1996)."
    6. `CONSISTENCY` (DERIVED ◑ / CONJECTURED ◌): "String consistency is restrictive: anomalies cancel only for special choices. Proposed 'swampland' rules may limit possible physics."
  - Hover/tap on a card highlights its leader and its target zone on the Ruler.
  - Reduced motion: the cards appear together.
  - Fallback SVG: band plus the six cards.

### Lab dock (0.88–0.97) and Outro (0.97–1.00)

The Lab ("How big a machine?", below) docks as a glass instrument panel and switches the stage to the Beat 4 map, driven by the panel.

On scroll past, the Lab undocks and the map fades out. The Ruler returns, tiny, and the camera closes on its right end. Everything fades except the H0 glow at center.

Closing caption (`DERIVED ◑ ~ ANALOGY`: how a string would look is a string-theory result, not an observation): *"From where we stand, a string would look just like a point."* Gauge: `~10⁻³⁴ m · HYPOTHETICAL · UNRESOLVED`.

---

## Lab

### How big a machine?

**Purpose:** Drag toward smaller distances and watch the energy, and the machine you would need, explode. Better technology barely dents a gap of 10¹⁵.

**Layout:**
- **Desktop:** the stage shows the machine map (Beat 4 renderer). The panel (right, 360 px) holds the Ruler strip, the controls, the readouts and the warnings.
- **Phones:** the map occupies the top 55%, and the panel becomes a bottom sheet. The Ruler strip is horizontal at the top of the sheet, with 44 px touch targets.

### Controls

| Control | Type | Range | Default | Units | Notes |
|---|---|---|---|---|---|
| `d` probe distance | draggable cursor on the Ruler strip (log); arrows = 0.1 decade, PgUp/PgDn = 1 decade | 8.8 × 10²⁶ … 1 × 10⁻³⁶ | **1.45 × 10⁻²⁰** (= ħc / 13.6 TeV) | m | the one quantity everything follows from |
| `machine` | segmented | `LHC MAGNETS 8.33 T` · `FCC-hh MAGNETS 14 T` · `HTS MAGNETS 20 T` · `LINEAR 100 MV/m` · `PLASMA 50 GV/m` | **LHC MAGNETS** | T or V/m | the first three are rings; the last two are straight machines |
| presets | jump chips (animate d over 1.2 s) | `LHC 13.6 TeV` · `FCC-hh? 85 TeV` · `LOW STRING SCALE? ~8 TeV ○` · `HETEROTIC STRING SCALE ~4 × 10¹⁷ GeV ◑` · `PLANCK 1.22 × 10¹⁹ GeV` · `BEYOND 10²⁰ GeV` | — | — | set d = ħc/E |
| `map` | auto-frame / manual (pinch, wheel after tap-to-engage) | — | auto | — | manual zoom range 10³–10²² m |

### What changes on screen

- **Dragging `d` left, toward larger scales** (d > 10⁻¹⁶ m): the map dims. The panel names the instrument that does the job:
  - `LIGHT: EYES, MICROSCOPES, TELESCOPES` for d ≥ 10⁻⁷ m
  - `X-RAYS, ELECTRON MICROSCOPES` for 10⁻⁷ > d ≥ 10⁻¹¹ m
  - `SMALL ACCELERATORS` for 10⁻¹¹ > d ≥ 10⁻¹⁶ m

  The energy readout still works, and it shows how small the energies are: a 1 m detail needs only ~2 × 10⁻⁷ eV (radio).
- **Dragging `d` right** (d < 10⁻¹⁶ m): the machine appears on the map, auto-framed so its size fills 60% of the view. The landmarks slide and shrink beneath it as in Beat 4, and overtake tags fire.
  - Each decade of drag multiplies the machine by 10.
  - The Ruler strip shows the explored/unexplored shading and the string band from Beat 6. The cursor carries a live `E` label.
- **Switching `machine`:**
  - **Ring to ring:** the ring shrinks only by 8.33/B (at most 2.4×). A ghost of the LHC-magnet ring stays dashed for comparison.
  - **Linear:** the ring morphs into two straight arms meeting at CERN.
  - **Plasma:** the arms become 500× shorter than at 100 MV/m, but a reality-check warning pins on.
- **Readouts** (mono, tabular):
  - `PROBE d = 1.6 × 10⁻³⁵ m`
  - `ENERGY ≈ ħc/d = 1.2 × 10¹⁹ GeV` (auto SI: eV … GeV)
  - `= 9.0 × 10¹⁴ × LHC`
  - `IN JOULES: 2.0 × 10⁹ J ≈ 57 L OF PETROL`, or `≈ 14 FLYING MOSQUITOES` at LHC energy
  - `MACHINE: 2.3 × 10¹⁹ m AROUND ≈ 2,460 ly`
  - `ACROSS ≈ 780 ly`
  - `LIGHT NEEDS 2,460 YEARS PER LAP`
  - `≈ 180 × THE DISTANCE TO THE NEAREST STAR` (the machine's width against the largest landmark smaller than it)
- **Warnings** (pinned chips that appear under the readouts):
  - **Synchrotron** (rings only), `OBSERVED ●`: shows the % lost per lap, or ✕ "radiates away its energy before one lap".
  - **Black-hole floor**, `CONJECTURED ◌`: the chip appears from E > 10¹⁸ GeV; its numbers follow Model 7.
  - **Plasma reality check:** "50 GV/m demonstrated over ~1 m, not light-years."
  - **Proton share** (ring modes only, small): "Real proton collisions share energy among quarks and gluons: several times bigger in practice." Linear modes are electron–positron machines (CLIC-class; plasma wakefields accelerate electrons), which use the full collision energy, so the chip is replaced by a small `e⁺e⁻ LINEAR COLLIDER` tag.

### Model (implement exactly)

**Constants** (float64):
- ħc = 1.973269804 × 10⁻¹⁶ GeV·m
- ℓ_P = 1.616255 × 10⁻³⁵ m; E_P = 1.220890 × 10¹⁹ GeV
- c = 299 792 458 m/s
- 1 ly = 9.4607304725808 × 10¹⁵ m; 1 AU = 1.495978707 × 10¹¹ m
- 1 GeV = 1.602176634 × 10⁻¹⁰ J

**1. Energy from distance** (faithful to an order of magnitude):
- E = ħc / d [GeV].
- Display "≈". The prefactor is conventional (using h instead of ħ changes it by 2π), and parton collisions carry only part of E.
- LHC ratio = E / 13 600.

**2. Beam energy:** E_beam = E / 2.
- This assumes a symmetric head-on collider that puts all of its energy into one collision. That is generous: real proton collisions deliver a fraction of it per parton collision.

**3. Ring size** (faithful, standard magnetic rigidity):
- ρ = E_beam / (0.299792458 · B) [m] (E_beam in GeV, B in T).
- C = 2πρ / f, with dipole fill factor **f = 0.6606**, which reproduces the LHC's C = 26 659 m at 7 TeV and 8.33 T.
- B = 8.33 (LHC), 14 (FCC-hh baseline) or 20 (HTS R&D goal).
- Checks:
  - 13.6 TeV at 8.33 T gives C = 25.9 km. Label the real LHC's 26.7 km ring separately, dashed; it runs below its 14 TeV design.
  - 85 TeV at 14 T gives 96 km (the real FCC design is 90.7 km, with a higher fill factor).
  - E_P at 8.33 T gives C = 2.325 × 10¹⁹ m = 2 457 ly, D = C/π = 782 ly.
  - E_P at 14 T gives 1 462 ly; at 20 T, 1 023 ly.

**4. Linear size** (faithful to active length only):
- L_total = 2 · E_beam / G, with G = 0.1 GeV/m (CLIC-class) or 50 GeV/m (plasma).
- Real machines are 2–3× longer, for focusing and beam delivery.
- The linear modes model electron–positron machines (both CLIC and the plasma record use electrons), so the proton-share chip is hidden for them.
- At E_P: 1.29 × 10⁴ ly for 100 MV/m, and 25.8 ly for 50 GV/m.

**5. Travel times:**
- t_lap = C / c (rings); t = (L_total/2) / c (one arm, linear).
- Format in s, µs, days or years.
- LHC check: 88.9 µs.

**6. Synchrotron loss per lap** (faithful classical formula, used only where it is valid):
- u = U₀ / E_beam = C_γ,p · E_beam³ / ρ = C_γ,p · 0.299792458 · B · E_beam², with C_γ,p = 7.783 × 10⁻¹⁸ m·GeV⁻³ (the electron value 8.846 × 10⁻⁵ scaled by (m_e/m_p)⁴).
  - LHC check: U₀ = 6.7 keV per lap, u ≈ 10⁻⁹.
- Quantum parameter χ = (E_beam/0.93827) · B / 1.488 × 10¹⁶ T.
- Display:
  - u < 10⁻⁴: "negligible"
  - 10⁻⁴ ≤ u < 0.1: "u% of beam energy lost per lap; must be replaced every lap"
  - u ≥ 0.1 **or** χ > 0.1: ✕ "Radiates away its energy before completing a lap". Show no number, because the classical formula overestimates losses once χ ≳ 1.
- At 8.33 T, the ✕ state begins near E_beam ≈ 7 × 10⁷ GeV. At E_P, u_classical ≈ 7 × 10²⁰ and χ ≈ 3.6 × 10³.

**7. Black-hole floor** (heuristic, `CONJECTURED`):
- Δx(E) = ħc/E + k·E, with k = 2G/c⁴ in m/GeV = 2.6477 × 10⁻⁵⁴.
- Minimum at E* = √(ħc/k) = 8.63 × 10¹⁸ GeV, with Δx_min = 2√(ħc·k) = 4.57 × 10⁻³⁵ m ≈ 2.8 ℓ_P.
- With E = ħc/d, the Lab's Δx(E) = d + ħc·k/d.
- The chip appears from E > 10¹⁸ GeV. Once Δx > 1.1·d (d < 7.2 × 10⁻³⁵ m, E > 2.7 × 10¹⁸ GeV), it shows two numbers: `AT THIS ENERGY Δx ≈ Δx(E)` and `BEST POSSIBLE ≈ 4.6 × 10⁻³⁵ m` (Δx_min, a constant). Below that threshold it shows only `FLOOR NOT YET REACHED`.
- The string-scattering variant (Go deeper) is not used numerically in the Lab.

**8. Joules and comparisons:**
- E_J = E · 1.602176634 × 10⁻¹⁰.
- If E_J < 1 J, "≈ N flying mosquitoes" with N = E_J / 1.6 × 10⁻⁷ (CERN: 1 TeV ≈ a flying mosquito).
- If E_J ≥ 3.4 × 10⁶ J, "≈ N L of petrol" with N = E_J / 3.42 × 10⁷.
- Otherwise show joules only.

**9. Map landmarks.** Physical diameters D: fixed hairline circles, drawn when 0.02 ≤ D/L_view ≤ 3.

| Landmark | D |
|---|---|
| LHC ring (dashed, real) | 8.49 km |
| Lake Geneva outline | ~73 km long |
| Earth | 1.2742 × 10⁷ m |
| Moon's orbit | 7.688 × 10⁸ m |
| Sun | 1.3927 × 10⁹ m |
| Earth's orbit | 2 AU |
| Neptune's orbit ("SOLAR SYSTEM") | 60.14 AU |
| Proxima Centauri | a labeled point at 4.2465 ly |
| Milky Way | 87 400 ly disc; Sun 26 670 ly from center |

- Comparison string: compare the machine's width (D = C/π for rings, L_total for linear machines) with the largest landmark whose D is at most that width. Format it as "≈ X × NAME". For this comparison only, Proxima counts as D = 4.2465 ly (its distance). Check: the Planck ring is 782 ly across, so "≈ 180 × THE DISTANCE TO THE NEAREST STAR".
- **Placement:** the ring is tangent to CERN at its bottom point (center 1 ρ_ring = C/2π above it on screen). Earth-centered landmarks sit at that contact point. Heliocentric ones are centered on the Sun, which sits 1 AU below CERN in screen space and is shown only once L_view > 10¹⁰ m.

**10. Framing:**
- L_view = 1.667 · D_machine (the machine fills 60%), eased in log space over 0.8 s. Clamp at L_view ≥ 5 × 10⁴ m.
- In manual mode, pinch changes log₁₀ L_view directly.

**11. Revolution tone** (audio, below): f_rev = c / C.

**Faithful vs cartoon**

| Element | Verdict |
|---|---|
| E ≈ ħc/d | **Faithful to an order of magnitude** (conventional prefactor) |
| Ring and linear sizes from ρ = E/(ecB), L = E/G | **Faithful** given the stated assumptions; **generous** (full energy per collision, active length only) |
| Synchrotron warning | **Faithful** (classical formula, gated by χ) |
| Black-hole floor | **Heuristic** (`CONJECTURED`), order of magnitude only |
| Ring drawn as a perfect circle tangent at CERN; star field | **Cartoon** (`ANALOGY`); star positions are random at the local density |
| Bead lap (3 s display) | **Retimed**: ~3 × 10⁴× slower than the LHC's real 89 µs lap, ~3 × 10¹⁰× faster than the Planck ring's 2,460-year lap; labeled `SHOWN / REAL` |
| Thread in the magnifier | **Cartoon** (`SPECULATIVE ~ ANALOGY`), drawn at an assumed ℓs |

**Performance:**
- Map hairlines: fewer than 30 draw calls.
- Star field: 30k instanced points. Galaxy: 60k.
- Ring: a 512-segment line.
- All ratios are computed in float64 on input change, never per frame. The bead angle is a uniform.

### Micro-copy (each ≤ 20 words)

- Panel title: **HOW BIG A MACHINE?**
- Cursor label: "PROBE DISTANCE · drag toward the small end"
- Energy note: "Seeing a distance d takes energy of about ħc/d. Ten times smaller, ten times more."
- Instrument (large d): "No collider needed. Light resolves details this size."
- LHC preset: "The LHC reached 13.6 TeV: the most powerful collider yet built."
- FCC-hh preset: "Proposed 90.7 km successor ring, 85 TeV. Not approved; possibly the 2070s."
- Low-scale preset: "If strings were this big, the LHC could excite them. Searches found none below ~7.9 TeV."
- Heterotic preset: "A traditional estimate: ~30 times below the Planck energy, in weakly coupled heterotic models."
- Planck preset: "About 2,500 light-years around with LHC magnets. Light would need 2,500 years per lap."
- Beyond preset: "More energy past here is expected to make black holes, not sharper views."
- Magnet switch: "Stronger magnets shrink the ring only in proportion. The gap is a factor of 10¹⁵."
- Linear switch: "No bending arcs, so no ring synchrotron loss. But length still grows with energy."
- Plasma warning: "50 GV/m has been shown over about a meter. Nobody knows how to sustain it for light-years."
- Synchrotron ✕: "Protons this energetic would radiate away their energy long before one lap."
- Black-hole floor: "Heuristic: near the Planck energy, more energy makes a bigger black hole and a blurrier view."
- Proton share: "Real proton collisions share energy among quarks and gluons. A real machine would be several times bigger."
- Joules note: "The total energy is ordinary. Packing it into one collision is not."
- ANALOGY chip: "Ring drawn as a perfect circle; stars placed at random. Sizes are to scale."

### Audio (optional, muted by default)

**Revolution tone:** play the machine's real lap frequency, f_rev = c/C.
- **LHC:** 11,245 Hz, a thin high whine. Offer a `PITCH ÷ 8` switch for comfort.
- **Growing ring:** the pitch falls one octave per doubling of C. It drops below hearing (20 Hz) at C ≈ 15,000 km, around 8 × 10³ TeV.
- **Below 20 Hz:** the tone becomes soft clicks, one per real lap, down to 0.2 Hz.
- **Below 0.2 Hz:** silence, with the live caption "Next lap completes in {t_lap}" (for example, 2,460 years at the Planck preset).

**Linear machines:** one click per beam pulse (cartoon). **Black-hole floor:** a low thud when the bead passes the minimum (Beat 5 only).

---

## Go deeper

**Three limits in three formulas**

*The ring.* A magnetic field bends a proton into a circle of radius

$$\rho = \frac{E_{\text{beam}}}{e\,c\,B}$$

**ρ** is the **bending radius** (the ring on the map). **E_beam** is the **beam energy**, half the collision energy readout. **B** is the **magnet strength** (the machine selector). Doubling B halves the ring. Against a factor of 10¹⁵, magnet technology barely matters.

*The floor.* To probe a region of size Δx, you must pack energy E into it. Two sizes compete:

$$\Delta x \gtrsim \frac{\hbar c}{E} + \frac{2GE}{c^{4}}$$

The first term is the **quantum blur**: it shrinks as energy grows (the falling curve). The second is the **black-hole radius** of that energy: it grows (the rising curve). Their sum bottoms out at a few Planck lengths. This is a heuristic, not a theorem. High-energy string scattering shows the same shape with the string length in place of the Planck length: hit a string harder and it spreads.

*The string scale.* In string theory, gravity's measured strength fixes a combination of the string scale and the hidden dimensions (with ħ = c = 1 and numerical factors dropped):

$$M_P^{2} \sim \frac{M_s^{8}\,V_6}{g_s^{2}}$$

- **M_P** is the **Planck mass**, known from G.
- **M_s = 1/ℓ_s** is the **string mass scale** (the band on the ruler).
- **V₆** is the **volume of the hidden dimensions**.
- **g_s** is the **string coupling**.

With weak coupling (g_s < 1) and V₆ no smaller than ℓ_s⁶ (roughly: a smaller volume is equivalent, by T-duality, to a larger one), M_s comes out below M_P, so strings are longer than ℓ_P. A huge V₆ could drag M_s far lower: the speculative low-string-scale idea, unseen so far.

---

## Glossary

- `logarithmic scale`: A scale where each equal step multiplies by the same factor, here ten. Atoms and galaxies get equal room. Enlarging everything simply slides the picture.
- `collision energy`: The total energy available when two particles meet head-on. It sets the smallest distance, and the heaviest new particle, a collision can reach.
- `synchrotron radiation`: Light given off by charged particles on curved paths. It grows steeply with energy and limits how powerful a ring collider can be.
- `black hole`: A region where gravity traps even light. Energy E packed inside its horizon radius, 2GE/c⁴, would form one. For everyday energies this radius is absurdly tiny.
- `indirect test`: Checking a theory through consequences at accessible scales (the early universe, short-range gravity), not by seeing its basic objects. Theoretical checks, like black-hole counting, test consistency, not nature.
- `cosmic superstring`: A hypothetical fundamental string or D-string stretched to astronomical length by cosmic expansion. Not observed; searches use gravitational waves and the cosmic microwave background.
- `swampland`: The set of low-energy theories that seem consistent but cannot be completed into quantum gravity. Its proposed criteria are conjectures, actively debated.

Referenced from other chapters, not redefined: `electronvolt`, `Planck length`, `resolution` (Ch. 1; the electronvolt entry moved there because Chapter 1's lab shows GeV and TeV first), `string scale` (Ch. 2; its merged definition now carries this chapter's "ten to thirty times below the Planck energy"), `Planck energy` (Ch. 4), `braneworld` (Ch. 5), `supersymmetry` (Ch. 6; merged with this chapter's caveat that string theory does not fix the partners' masses), `string coupling` (Ch. 9).

---

## Numbers & facts

**Scales on the Ruler**
- **Observable universe diameter ≈ 8.8 × 10²⁶ m** (93 billion ly; comoving radius 46.5 Gly = 4.40 × 10²⁶ m). This is a present-day comoving distance. Source: https://en.wikipedia.org/wiki/Observable_universe
- **Planck length ℓ_P = 1.616255(18) × 10⁻³⁵ m; Planck energy E_P = 1.220890(14) × 10¹⁹ GeV = 1.956 × 10⁹ J.** Note ℓ_P·E_P = ħc exactly. Source: CODATA via NIST, https://physics.nist.gov/cgi-bin/cuu/Value?plkl
- **ħc = 197.3269804 MeV·fm = 1.973269804 × 10⁻¹⁶ GeV·m** (exact in the 2019 SI). Source: CODATA.
- **Span:** log₁₀(8.8 × 10²⁶ / 1.616 × 10⁻³⁵) = 61.7, so "about 62 powers of ten". Computed.
- **You (1.7 m):** 26.7 decades below the universe and 35.0 above ℓ_P. Computed; the adult-height source is in the chapter 1 pack (NCD-RisC, eLife 2016).
- **Midpoint:** √(8.8 × 10²⁶ × 1.616 × 10⁻³⁵ m²) = 1.19 × 10⁻⁴ m. Computed. Paper "may be between 0.07 and 0.18 millimetres thick" (https://en.wikipedia.org/wiki/Paper); ordinary office paper is about 0.1 mm. Order-of-magnitude comparison.
- **Other landmarks:**
  - Andromeda is 2.5 Mly away (2.54 ± 0.11 Mly; https://en.wikipedia.org/wiki/Andromeda_Galaxy).
  - The Milky Way's stellar disk is 87,400 ± 3,600 ly (26.8 kpc) across, and the Sun is 26,670 ly (8.178 kpc, GRAVITY 2019) from the Galactic Center (https://en.wikipedia.org/wiki/Milky_Way).
  - Proxima Centauri is 4.2465 ly away (https://en.wikipedia.org/wiki/Proxima_Centauri).
  - Neptune's semi-major axis is 30.07 AU.
  - 1 AU = 149,597,870,700 m (exact, IAU 2012); 1 ly = 9.4607304725808 × 10¹⁵ m (exact, IAU).
  - Earth's mean diameter is 12,742 km and its equatorial circumference 40,075 km. The Moon's semi-major axis is 384,400 km. The Sun's diameter is 1.3927 × 10⁶ km.
  - Standard values: NASA planetary fact sheets, https://nssdc.gsfc.nasa.gov/planetary/factsheet/
- **Atom ~10⁻¹⁰ m, nucleus ~10⁻¹⁴ m, proton charge radius 0.84075(64) fm (diameter ~1.7 fm), cell ~10⁻⁵ m:** see the chapter 1 pack (CODATA 2022; Angeli & Marinova 2013; BioNumbers).
- **SI prefixes ronna (10²⁷), quetta (10³⁰), ronto (10⁻²⁷) and quecto (10⁻³⁰):** adopted by the 27th CGPM in 2022. Source: https://www.bipm.org/en/-/2022-12-19-si-prefixes

**The unexplored quarter**
- **Edge of direct measurement ~10⁻¹⁹ m (a band of 10⁻¹⁸–10⁻²⁰ m):**
  - Electron size < 2.8 × 10⁻¹⁹ m (Bourilkov, PRD 62, 076005 (2000)).
  - Quark size < 4.3 × 10⁻¹⁹ m (ZEUS, PLB 757, 468 (2016)).
  - Same band as chapter 1.
- **Unprobed:** log₁₀(10⁻¹⁹/1.616 × 10⁻³⁵) = 15.8 decades, which is 25.6% of the Ruler ("about a quarter"). With the edge at 10⁻²⁰ m it is 14.8 decades (24%). Computed.
- **Atom → universe factor:** 8.8 × 10²⁶ / 10⁻¹⁰ = 8.8 × 10³⁶ (36.94 decades). Computed. Under it:
  - ℓ_P → 142 m (for a 1 Å atom). For a carbon atom's van der Waals diameter of 3.4 Å it becomes 42 m, so the range is "~40–140 m".
  - Proton (1.68 fm across) → 1.56 Mly.
  - 10⁻¹⁹ m → 93 ly.
- **Tallest known tree:** Hyperion, a coast redwood, 116.07 m in 2019, and 116.22 m in 2026 (Wikipedia infobox, citing a Sugar Pine Foundation field update; checked in this review). Source: https://en.wikipedia.org/wiki/Hyperion_(tree). A "tall tree" (tens of meters to about 116 m) falls inside the 40–140 m range.
- **The comparison's origin:** usually attributed to Brian Greene, *The Elegant Universe* (1999): an atom magnified to the size of the known universe gives a Planck length about "the height of an average tree". The wording comes from secondary quotations; chapter and page were not checked, and the Wikipedia article on the book does not contain it, so it is not a source. Nothing on screen attributes the comparison, which stands on its own arithmetic. The pack says "tall tree" because the computation gives 40–140 m.
- **Rejected variant:** "atom magnified to the solar system → string the size of a tree" (PBS NOVA, https://www.pbs.org/wgbh/nova/physics/sense-of-scale-string-theory.html). Checked: 9 × 10¹² m / 10⁻¹⁰ m × 10⁻³⁵ m ≈ 10⁻¹² m, which is about 14 powers of ten short of a tree. Not used.

**Energy**
- **LHC collision energy 13.6 TeV** (6.8 TeV per beam) from 5 July 2022. Source: https://home.cern/news/news/physics/lhc-run-3-physics-record-energy-starts-tomorrow
- **Run 3 is over.** The final proton–proton collisions were on 16 May 2026 and the final lead–lead collisions on 14 June 2026. The last beams circulated on 27 June 2026, after which the machine entered Long Shutdown 3; CERN announced it on 29 June 2026. High-Luminosity LHC operation is planned for 2030. Hence the past tense "reached". Sources: https://cerncourier.com/the-lhc-completes-its-third-run/; https://home.cern/cern-bids-farewell-to-the-lhc-and-enters-long-shutdown-3/
- **E_P / 13.6 TeV = 8.98 × 10¹⁴ (≈ 10¹⁵, "a million billion").** Computed.
- **ħc / 13.6 TeV = 1.45 × 10⁻²⁰ m; ħc / 2 TeV ≈ 1 × 10⁻¹⁹ m.** Computed. "~10⁻¹⁹ m in practice" reflects parton collisions of a few TeV.
- **Energy-axis landmarks:** visible light ~2 eV (1.65–3.1 eV), X-rays ~keV, and ħc/1 fm ≈ 0.2 GeV. Standard; computed with ħc.
- **1932 cyclotron: 1.22 MeV protons** (Lawrence & Livingston's 11-inch cyclotron). Source: https://www2.lbl.gov/Science-Articles/Research-Review/Magazine/1981/81fchp2.html
  - 1.22 MeV → 6.8 TeV per proton is a factor of 5.6 × 10⁶ ("~7 powers of ten in 90 years"). Computed.
- **1 TeV ≈ the kinetic energy of a flying mosquito** (1 TeV = 1.6 × 10⁻⁷ J), so 13.6 TeV ≈ 2.2 × 10⁻⁶ J ≈ 14 "mosquitoes". Source: CERN LHC glossary, https://lhc-machine-outreach.web.cern.ch/lhc_glossary.htm
- **LHC stored energy per beam: 362 MJ** at design (2808 bunches × 1.15 × 10¹¹ protons × 7 TeV), which is about 18% of E_P ("about a fifth"). There are 3.2 × 10¹⁴ protons per beam. Source: https://lhc-machine-outreach.web.cern.ch/beam.htm
- **Planck energy ≈ 57 L of petrol:** 1.956 × 10⁹ J / 34.2 MJ/L. Petrol's energy density is 32–35 MJ/L depending on blend, so the pack says "about 60 L". Source: https://en.wikipedia.org/wiki/Energy_density

**Collider arithmetic**
- **LHC:** circumference 26,659 m; dipole field 8.33 T at 7 TeV (NbTi, 1.9 K); dipole bending radius 2,803.95 m; revolution frequency 11.245 kHz (lap 88.9 µs); synchrotron loss 6.7 keV per turn at 7 TeV. Sources: LHC Design Report Vol. 1 (CERN-2004-003); https://www.lhc-closer.es/taking_a_closer_look_at_lhc/0.magnetic_dipoles
  - At the 6.8 TeV actually run, the same formula gives 5.9 keV per turn (u = 8.7 × 10⁻¹⁰); the Beat 5 line quotes this. Computed.
- **Magnetic rigidity:** p [GeV/c] = 0.299792458 · B [T] · ρ [m]. Source: PDG, *Review of Particle Physics*, accelerator physics section (Navas et al., PRD 110, 030001 (2024)).
- **Fill factor** f = 2π · 2,803.06 m / 26,659 m = 0.6606. Computed. It is calibrated to 7 TeV at 8.33 T, where ρ = 7000/(0.299792458 × 8.33) = 2,803.06 m; the design report's 2,803.95 m would give 0.6609, a negligible difference.
- **Planck-energy ring with LHC magnets:** C = 2.325 × 10¹⁹ m = 2,457 ly around, 782 ly across (radius 391 ly), lap time 2,457 years. Computed.
  - With 14 T: 1,462 ly. With 20 T: 1,023 ly.
  - It spans 0.9% of the Milky Way's disk diameter.
  - Machine/target ratio: 2.3 × 10¹⁹ m / 1.6 × 10⁻³⁵ m = 1.4 × 10⁵⁴.
- **Overtake energies** (E_cm at which an 8.33 T ring's circumference equals the landmark's):
  - Earth's circumference: 2.1 × 10⁷ GeV
  - Moon's orbit: 1.3 × 10⁹ GeV
  - Earth's orbit: 4.9 × 10¹¹ GeV
  - Neptune's orbit: 1.5 × 10¹³ GeV
  - Ring radius = distance to Proxima: 1.3 × 10¹⁷ GeV

  Computed. On screen, tags fire when the ring's *diameter* passes the landmark's diameter. For circles that is the same ratio as circumferences, so the same energies apply.
- **Audible revolution tone:** f_rev = c/C falls below 20 Hz at C = 15,000 km (E_cm ≈ 7.9 × 10³ TeV). Computed.
- **FCC:** 90.7 km ring. FCC-hh would reach ~85 TeV with 14 T Nb₃Sn dipoles, possibly from the 2070s. HTS dipoles of 14–20 T are under study (feasibility study, 31 March 2025).
  - The 2026 European Strategy update (CERN Council, 22 May 2026) recommends FCC-ee as "the preferred option for the next flagship project at CERN", with a descoped FCC-ee as the fallback. Other options, FCC-hh included, "were not ranked". FCC-hh is not approved. A Council decision on FCC was foreseen for around 2028 (CERN Courier, 2025); the Strategy page itself gives no date.
  - Sources: https://home.cern/cern-releases-report-feasibility-possible-future-circular-collider/; https://cerncourier.com/fcc-feasibility-study-complete/; https://europeanstrategy.cern/european-strategy-for-particle-physics/
- **Linear gradients:** CLIC design 100 MV/m at 3 TeV (CLIC Conceptual Design Report, CERN-2012-007). The 72 MV/m of the 380 GeV first stage comes from the later staging baseline (*Updated baseline for a staged Compact Linear Collider*, CERN-2016-004), not from the 2012 CDR.
  - Plasma wakefield: 42 GeV gained in 85 cm, a field of ~52 GV/m, for a small fraction of electrons. Source: Blumenfeld et al., *Nature* 445, 741 (2007).
  - Planck-energy lengths (active only): 12,900 ly at 100 MV/m; 25.8 ly at 50 GV/m. Computed.
- **Synchrotron radiation:** U₀ = C_γ E⁴/ρ, with C_γ(e) = 8.846 × 10⁻⁵ m GeV⁻³ and C_γ(p) = C_γ(e)·(m_e/m_p)⁴ = 7.78 × 10⁻¹⁸ m GeV⁻³. Sources: M. Sands, SLAC-121 (1970); H. Wiedemann, *Particle Accelerator Physics*.
  - At E_beam = 6.1 × 10¹⁸ GeV and 8.33 T, classical U₀/E ≈ 7 × 10²⁰ per lap. Computed.
  - Quantum parameter χ = γB/B_c,p ≈ 3.6 × 10³ (B_c,p = (m_p/m_e)² × 4.414 × 10⁹ T = 1.49 × 10¹⁶ T), so the classical formula overestimates. Computed.
  - The ultra-quantum (χ ≫ 1) asymptotic for the radiated power of a point charge is P ≈ [32Γ(2/3)/243]·(3χ)^{2/3}·α m²c⁴/ħ = 0.371·α m²c⁴ χ^{2/3}/ħ (Ritus; Baier–Katkov). The earlier "0.28–0.37" range had no source for its lower end and is dropped. For the proton at E_P/2 in 8.33 T this gives P ≈ 1.4 × 10¹⁴ W. The first e-fold of energy is lost in ~7 µs (~2 km). Because P ∝ E^{2/3}, losing nearly all of it takes ~20 µs (~6 km). Compare a 2,457-year lap. Computed, order of magnitude. (It treats the proton as a point charge; at χ ~ 10³ its rest-frame field would in any case far exceed QCD scales.)
  - The pack claims only "long before one lap".
  - **No achievable magnet strength rescues a ring.**
    - Weaker field: keeping the classical loss per lap below the beam energy at 6.1 × 10¹⁸ GeV needs ρ > C_γ(p)·E³ ≈ 1.8 × 10³⁹ m, about 4 × 10¹² times the observable universe's radius. χ ≪ 1 there, so the classical formula is valid.
    - Stronger field: in the quantum regime the loss per lap scales as ΔE/E ∝ E^{2/3}B^{−1/3}. At 8.33 T it is ~7 × 10¹⁵, so B would need to be ~10⁴⁸ times larger.
    - Computed. This backs "steered by magnets" in Beat 5.

**The resolution floor**
- **Heuristic Δx ≳ ħc/E + 2GE/c⁴:** the minimum is ≈ 2.8 ℓ_P at E_P/√2 = 8.6 × 10¹⁸ GeV. Computed. The idea has a long history:
  - C. A. Mead, *Phys. Rev.* 135, B849 (1964)
  - L. J. Garay, *Int. J. Mod. Phys. A* 10, 145 (1995), arXiv:gr-qc/9403008
  - R. J. Adler & D. I. Santiago, *Mod. Phys. Lett. A* 14, 1371 (1999), arXiv:gr-qc/9904026
- **Black-hole formation in trans-Planckian collisions (CONJECTURED):**
  - G. 't Hooft, *Phys. Lett. B* 198, 61 (1987)
  - T. Banks & W. Fischler, arXiv:hep-th/9906038 (1999)
  - S. B. Giddings & S. Thomas, *PRD* 65, 056010 (2002), arXiv:hep-ph/0106219
- **String version:**
  - G. Veneziano, *Europhys. Lett.* 2, 199 (1986)
  - D. Gross & P. Mende, *Phys. Lett. B* 197, 129 (1987) and *Nucl. Phys. B* 303, 407 (1988)
  - D. Amati, M. Ciafaloni & G. Veneziano, *Phys. Lett. B* 197, 81 (1987) and *Phys. Lett. B* 216, 41 (1989)
  - K. Konishi, G. Paffuti & P. Provero, *Phys. Lett. B* 234, 276 (1990)

**String scale**
- **Weakly coupled heterotic string: M_string ≈ g × 5.27 × 10¹⁷ GeV**, giving ≈ 3.7–5.3 × 10¹⁷ GeV for g ≈ 0.7–1. That is ħc/M_string ≈ 3.7–5.3 × 10⁻³⁴ m, about 23–33 ℓ_P.
  - This is Kaplunovsky's one-loop *string unification scale*, M_string = e^{(1−γ)/2}3^{−3/4} g M_P/(4π) in the DR-bar scheme; its tree-level form is M_string ∼ g M_P ∼ 1/√α′.
  - How 1/√α′ itself is normalized shifts the number by factors of a few, so ℓ_s ≈ 1–5 × 10⁻³⁴ m. That is still inside the "traditional" band.
  - Sources: V. Kaplunovsky, *Nucl. Phys. B* 307, 145 (1988); erratum B382, 436 (1992); arXiv:hep-th/9205070. The formula as quoted (eq. 2.10) is in K. Dienes, *Phys. Rep.* 287, 447 (1997), arXiv:hep-th/9602045, checked in this review.
  - Heterotic-preset copy: "~30 times below the Planck energy".
- **Traditional band 10⁻³⁵–10⁻³³ m:** matches the chapter 1 pack and Zwiebach, *A First Course in String Theory*, 2nd ed. (2009), ch. 1.
- **M_P² ∼ M_s⁸ V₆ / g_s²** (closed-string gravity compactified on six dimensions; 2π factors dropped).
  - It follows from 1/(16πG) = V₆/(2κ₁₀²) with 2κ₁₀² = (2π)⁷ g_s² α′⁴, which is standard (J. Polchinski, *String Theory* Vol. 2 (1998); L. Ibáñez & A. Uranga, *String Theory and Particle Physics* (2012)). The exact section and chapter numbers the draft cited were not verified and have been removed.
  - Equivalently M_P ∼ M_s/g₄, with g₄² = g_s²/(V₆M_s⁶). With V₆ ≳ ℓ_s⁶ (a T-duality heuristic, exact for tori), this gives M_s ≲ g_s M_P. Taking V₆ very large instead gives the low-string-scale idea below.
- **Low string scale (SPECULATIVE):**
  - J. Lykken, *PRD* 54, R3693 (1996), arXiv:hep-th/9603133
  - N. Arkani-Hamed, S. Dimopoulos & G. Dvali, *PLB* 429, 263 (1998), arXiv:hep-ph/9803315
  - I. Antoniadis, N. Arkani-Hamed, S. Dimopoulos & G. Dvali, *PLB* 436, 257 (1998), arXiv:hep-ph/9804398
- **String resonances excluded below 7.9 TeV (95% CL; expected 8.1 TeV):** CMS dijets, 137 fb⁻¹ at 13 TeV, *JHEP* 05 (2020) 033, arXiv:1911.03947, Table 1 (re-checked in this review). This supersedes the 7.7 TeV of arXiv:1806.00843 (36 fb⁻¹). Chapter 1's pack has since been updated to 7.9 TeV, so the two chapters now agree. It applies to specific low-string-scale models and converts to ℓ_s ≲ ħc/7.9 TeV ≈ 2.5 × 10⁻²⁰ m.

**Indirect routes**
- **CMB B-modes:**
  - r < 0.036 (95%): BICEP/Keck, *PRL* 127, 151301 (2021), arXiv:2110.00483.
  - r < 0.032 with Planck PR4: Tristram et al., *PRD* 105, 083524 (2022), arXiv:2112.07961.
  - Inflation's energy scale V^{1/4} = 1.04 × 10¹⁶ GeV (r/0.01)^{1/4}, for single-field slow-roll inflation at the pivot k* = 0.05 Mpc⁻¹. This is eq. (2.14) of the CMB-S4 Science Book (arXiv:1610.02743), checked in this review; recomputed from A_s ≈ 2.1–2.2 × 10⁻⁹ it gives 1.02–1.04 × 10¹⁶ GeV. So r < 0.036 ⇒ V^{1/4} < 1.4 × 10¹⁶ GeV. Computed. The card's "near 10¹⁶ GeV" refers to what a detection at r ≳ 10⁻³ would reveal.
- **Cosmic strings:**
  - Planck: Gμ/c² < 1.5 × 10⁻⁷ (Nambu–Goto, 95%). Source: Planck 2013 XXV, *A&A* 571, A25 (2014), arXiv:1303.5085.
  - LIGO–Virgo–KAGRA O3: Gμ ≲ 4 × 10⁻¹⁵ in one loop model (model-dependent). Source: *PRL* 126, 241102 (2021), arXiv:2101.12248.
- **Cosmic superstrings (F- and D-strings):** Copeland, Myers & Polchinski, *JHEP* 06 (2004) 013, arXiv:hep-th/0312067.
- **NANOGrav 15-yr:** evidence for a nanohertz gravitational-wave background (*ApJL* 951, L8 (2023)).
  - In the new-physics analysis (*ApJL* 951, L11 (2023), arXiv:2306.16219), several cosmological models, including metastable and superstring networks, can fit.
  - The authors state their results "should not be regarded as evidence for new physics". Supermassive black hole binaries remain the conventional explanation.
  - Also: Ellis, Lewicki, Lin & Vaskonen, *PRD* 108, 103511 (2023), arXiv:2306.17147.
- **SUSY null results:** ATLAS, 139 fb⁻¹, *JHEP* 02 (2021) 143, arXiv:2010.14293. Gluino > 2.30 TeV and squarks (first two generations, degenerate) > 1.85 TeV in simplified models with a massless neutralino.
- **String theory does not require superpartners at LHC energies.** Non-supersymmetric string vacua exist: e.g. the tachyon-free O(16)×O(16) heterotic string (Alvarez-Gaumé, Ginsparg, Moore & Vafa, *PLB* 171, 155 (1986); Dixon & Harvey, *NPB* 274, 93 (1986)). These vacua have their own problems (for example a one-loop dilaton tadpole), so they are cited only as existence proofs. The main point is that in supersymmetric string models the SUSY-breaking scale is not fixed by the theory and can lie far above LHC energies. Source (overview): M. Dine, *Supersymmetry and String Theory* (CUP 2007); page numbers not checked.
- **Short-range gravity:** data at separations from 52 µm to 3.0 mm fit Newtonian gravity, and gravitational-strength Yukawa interactions with ranges > 38.6 µm are excluded (95%). Abstract re-checked in this review. Source: J. G. Lee et al. (Eöt-Wash), *PRL* 124, 101101 (2020), arXiv:2002.11761.
- **LHC micro black holes: none seen.** For example, ATLAS lepton+jet at √s = 13.6 TeV (164 fb⁻¹, Run 3) excludes quantum black holes with threshold mass below 9.4 TeV (electron channel; 9.0 TeV muon) for ADD n = 6, below 8.6–9.1 TeV for ADD n = 2–4, and below 7.2 TeV for RS n = 1. Source: arXiv:2604.19495, *Phys. Lett. B* 881 (2026) 140849; the abstract and Table 2 were checked in this review. It backs "extra dimensions … so far" on the collider card but is not quoted on screen.
- **Black hole entropy counting:** A. Strominger & C. Vafa, *PLB* 379, 99 (1996), arXiv:hep-th/9601029. It covers five-dimensional extremal (BPS) black holes.
- **Anomaly cancellation:** M. Green & J. Schwarz, *PLB* 149, 117 (1984).
- **Swampland:**
  - C. Vafa, arXiv:hep-th/0509212 (2005)
  - Weak gravity conjecture: N. Arkani-Hamed, L. Motl, A. Nicolis & C. Vafa, *JHEP* 06 (2007) 060, arXiv:hep-th/0601001

**Design parameters (not physical facts)**
- the 3 s display lap
- the 60% framing
- the 0.02–3 landmark visibility window
- the δ = L/50 blur
- 30k star points and 60k galaxy points
- random star positions
- the 120 px magnifier
- the zoom speeds

---

## Pitfalls

1. **"Strings are exactly the Planck length."**
   - *Avoided by:* Beat 6's text says the string scale "is unknown". The Ruler band shows traditional estimates *longer* than ℓ_P, a speculative low-scale zone, and an LHC-excluded zone.
   - Go deeper shows why weak coupling makes ℓ_s ≳ ℓ_P.
2. **"We just need a bigger collider; it's an engineering problem."**
   - *Avoided by:* Beat 5 shows two physics obstacles beyond size. Synchrotron loss kills magnet rings long before the Planck energy. And the black-hole floor means more energy stops buying resolution.
   - The floor is labeled a heuristic (`CONJECTURED`), not a theorem.
3. **"A galaxy-sized collider."**
   - *Avoided by:* the pack computes the ring from stated assumptions (LHC magnets, full energy per collision): about 2,500 ly around, 780 ly across, under 1% of the Milky Way's width.
   - Beat 4 ends on the galaxy view to show that proportion honestly. The "several times bigger in practice" note keeps the generous assumption visible.
4. **"The Planck energy is an unimaginable amount of energy."**
   - *Avoided by:* the Beat 3 inset shows it is about 2 GJ (about 60 L of petrol). An LHC beam already stores about a fifth of it. The obstacle is concentration into one collision.
5. **"The Planck length is the pixel size of space" or "the smallest possible length."**
   - *Avoided by:* the Ruler's dotted stub, Beat 6's frame and the Lab cursor all continue past ℓ_P (to 10⁻³⁶ m). (The draft claimed this for the Ruler, but its axis stopped at ℓ_P; the stub now makes it true.)
   - The resolution floor is presented as an expectation about *measurement* from a heuristic, with `CONJECTURED` status. Nothing claims space is discrete.
6. **"If we can't see strings, string theory is untestable, full stop."** (The opposite overclaim is "string theory is tested".)
   - *Avoided by:* Beat 6 lists indirect clues with honest chips. Most are null results or bounds (OBSERVED). Some are theoretical successes (DERIVED, Strominger–Vafa). Links to string theory specifically are marked SPECULATIVE.
   - No card claims confirmation.
7. **"The LHC found no supersymmetry, so string theory is falsified."**
   - *Avoided by:* the collider card and the glossary say string theory does not fix superpartner masses. Numbers & facts cite non-supersymmetric string vacua.
   - Null results constrain specific models, not the framework.
8. **"NANOGrav detected cosmic strings."**
   - *Avoided by:* the cosmic-superstrings card says "None found".
   - Numbers & facts quote NANOGrav's own caution and note that supermassive black-hole binaries are the conventional explanation.
9. **"Humans sit in the middle of the scales of the universe."**
   - *Avoided by:* Beat 1: "You are not in the middle." The midpoint is 0.1 mm, and you are 27 decades from the universe's edge but 35 from ℓ_P.
10. **Log scales make the gap feel small.**
    - *Avoided by:* the unprobed quarter is a quarter of the whole Ruler. The atom-to-universe slide turns that quarter into "90 light-years down to a tree". The energy bracket shows the 90-year history crossing only 7 decades, against 15 remaining.
11. **Misquoted scale analogies.**
    - *Avoided by:* the tree comparison is computed (40–140 m, depending on the atom's edge) and printed on screen.
    - The popular "atom → solar system" variant was checked and rejected: it is about 14 powers of ten off.
12. **"E = ħc/d is exact" and "the LHC resolves 1.45 × 10⁻²⁰ m".**
    - *Avoided by:* "≈" everywhere. The Beat 3 caption explains parton sharing ("~10⁻¹⁹ m in practice"), and the Model notes the 2π convention.
13. **"Strings would look like tiny glowing threads if we could zoom in."**
    - *Avoided by:* warm light appears only in the opening handoff frame (H2) and inside the Beat 4 magnifier, always chipped `SPECULATIVE ~ ANALOGY`. The outro returns to an unresolved point.
16. **"If strings exist, they are Planck-sized" in the chapter's own framing.**
    - *Avoided by:* the thesis is now conditional ("if strings are as small as traditional estimates suggest"). The opening no longer says all of the picture "lies far below anything ever measured", which would have implied that extra dimensions must be tiny.
14. **Present tense about the LHC.**
    - *Avoided by:* it has been in Long Shutdown 3 since June 2026, so the text says the LHC "reached" 13.6 TeV.
15. **Hype.**
    - *Avoided by:* no banned words. "The smallest target demands the largest machine" is a plain statement backed by a computed 10⁵⁴ ratio.

---

## Handoff

**IN (from `m-theory`):**
- **H2**: chapter 9 ends on H2 (its Handoff OUT), so this chapter starts from it. It is one closed Thread loop at the center, facing the camera and gently wobbling, in warm Filament light, using the registry pose `HANDOFF.H2` (radius 1.3, wobble 0.07, ω = 1.6 rad/s) under `HANDOFF.camera` (`src/core/handoff.ts`, `src/gl/handoff.tsx`).
- Scale gauge: `~10⁻³⁴ m · HYPOTHETICAL`. This deliberately mirrors chapter 1's final frame, since chapter 10 runs chapter 1's zoom backwards.
- **If chapter 9 is changed to end on H1** (open string), start from `HANDOFF.H1` (length 4.2, amplitude 0.16, ω = 2.2 rad/s) instead, with s₀ = −33.82. The capsule renderer blurs either into the identical H0 glow during the opening pull-back, so no other change is needed. (The draft's H1 formula, 0.06ℓ at 0.55 Hz spanning 50% of the width, did not match the registry and has been removed.)

**OUT (to `knowledge`):**
- **H0**: a single Ink-white glowing point at screen center. It is the string seen from where experiments actually stand: unresolved, with no warm light.
- Closing caption: *"From where we stand, a string would look just like a point."*
- The scale gauge holds `~10⁻³⁴ m · HYPOTHETICAL · UNRESOLVED`, then fades.
- Chapter 11 can build its three zones around this point and, in its epilogue, resolve the Thread from it one last time.
- Bridge line under the point as chapter 11 dissolves in (≤ 20 words): "Then what, exactly, do we know, and what are we still guessing?"

---

## Referee notes

Every derived number in the pack was recomputed in float64. That covers the Ruler span and midpoint, the "you" position, the unprobed quarter, the atom→universe slide (142 m, 42 m, 1.56 Mly, 93 ly), the energy-axis offset −15.705, the fill factor, ring sizes at 8.33, 14 and 20 T, the overtake energies, the lap times, the audio threshold, the linear lengths, U₀ and u, χ, the black-hole floor minimum (E* = 8.63 × 10¹⁸ GeV, 2.83 ℓ_P), the joule, petrol and mosquito conversions, the LHC stored energy, the inflation scale and the heterotic numbers. All of them agree with the pack to the quoted precision, except where listed below. Beat text (≤ 45 words) and Lab micro-copy (≤ 20 words) were re-counted after the edits, and all are within limits.

**Physics and epistemics**
1. **Thesis stated the string scale as fact** ("If strings exist, their scale lies about sixteen powers of ten below…"). That is the "string length = Planck length" misconception. It is now conditional on traditional estimates, and it notes that the string scale is unknown and that low-scale versions were searched for. A new Pitfall 16 records this.
2. **Opening text implied extra dimensions and branes must be tiny** ("All of it lies far below anything ever measured"). It now reads "None of it has been seen directly."
3. **Opening caption:** "Points are all any experiment has ever seen" was false, since protons and nuclei are seen as extended. It now says "Every elementary particle measured so far looks like a point." Its chip is now split: `DERIVED ◑ ~ ANALOGY` for the string, `OBSERVED ●` for the particles.
4. **Closing caption** was chipped `OBSERVED ●` and said "exactly like a point". How a string would look is a string-theory result, not an observation, and at finite energy the string corrections are suppressed, not zero. It is now `DERIVED ◑ ~ ANALOGY` and says "just like a point". The Handoff was updated to match, and it still agrees with chapter 11's "would look like a point".
5. **The Ruler ended at ℓ_P, yet Pitfall 5 claimed it continued past.** A dotted stub to 10⁻³⁶ m was added so that the axis does not suggest a proven minimum length, and Pitfall 5 was corrected.
6. **"Indirect clues … black holes, mathematical consistency" and the glossary's "indirect test … such as black holes"** blurred theoretical consistency checks with tests in nature; Bekenstein–Hawking entropy has never been measured. The Beat 6 text now separates "signs" from "theoretical checks". Cards 5 and 6 get a `THEORY CHECK · NOT A MEASUREMENT` tag and no Ruler leader, and the glossary entry was rewritten.
7. **Glossary "string scale … just below the Planck energy"** was changed to "roughly ten to thirty times below", matching the heterotic numbers.
8. **Proton-share warning was shown "always",** including for the linear modes, which model e⁺e⁻ machines (CLIC; the plasma record used electrons). It is now shown for ring modes only. The Linear micro-copy now says "no ring synchrotron loss", because linear colliders still radiate in focusing and beamstrahlung.
9. **Low-scale preset "the LHC could make them"** now reads "could excite them": string excitations, not strings, would be produced.
10. **Non-SUSY string vacua** are now cited only as existence proofs, with their dilaton-tadpole caveat. The load-bearing point is that the SUSY-breaking scale is not fixed.
11. **Glossary "cosmic superstring"** said "fundamental string" only. D-strings were added (Copeland–Myers–Polchinski).

**Numbers and sources**
12. **Beat 4 overtake tag** `RING > MOON'S ORBIT · 1 × 10⁶ TeV` was changed to 1.3 × 10⁶ TeV. The computed value is 1.27 × 10⁹ GeV, and Numbers already said 1.3 × 10⁹ GeV.
13. **Beat 5 "LHC AT 7 TeV: ~7 keV PER LAP":** the LHC never ran at 7 TeV, and the text uses the past tense "reached 13.6 TeV". The line is now 6.8 TeV and ~6 keV (computed 5.9 keV, u = 8.7 × 10⁻¹⁰). The design 6.7 keV check stays in the Model.
14. **Quantum synchrotron coefficient (flagged):** the "0.28–0.37" range had no source for its lower end. It was replaced by the Ritus/Baier–Katkov asymptotic 32Γ(2/3)(3χ)^{2/3}/243 = 0.371·χ^{2/3}. Recomputed: P ≈ 1.4 × 10¹⁴ W, ~7 µs per e-fold, ~20 µs (~6 km) for nearly total loss. The on-screen claim "long before one lap" is robust. The quantum branch was added to "no magnet strength rescues a ring" (loss per lap ∝ B^{−1/3}, which would need B × 10⁴⁸), and "no" became "no achievable".
15. **CMS 7.9 TeV (flagged):** verified in arXiv:1911.03947 Table 1 (observed 7.9, expected 8.1 TeV). The 2018 value of 7.7 TeV was also verified. Chapter 1 has since been updated to 7.9 TeV, so there is no longer any discrepancy; the stale remark was corrected.
16. **ATLAS quantum black holes (flagged):** verified in arXiv:2604.19495 (PLB 881 (2026) 140849; 13.6 TeV, 164 fb⁻¹). ADD n = 6 gives 9.4 TeV (e) and 9.0 TeV (µ); ADD n = 2–4 gives 8.6–9.1 TeV; RS n = 1 gives 7.2 TeV. The pack said it was "cited only in Pitfalls", but it was not in Pitfalls. That line was fixed.
17. **Heterotic string scale (flagged area):** 5.27 × 10¹⁷ g GeV is Kaplunovsky's one-loop DR-bar *unification* scale, not 1/√α′ itself. This is now stated, the formula is sourced to Dienes (Phys. Rep. 287, 447, eq. 2.10; checked), and the convention spread ℓ_s ≈ 1–5 × 10⁻³⁴ m is noted. The preset copy ("~30 times below") is unchanged.
18. **M_P² ∼ M_s⁸V₆/g_s² (flagged):** the scaling was re-derived from 2κ₁₀² = (2π)⁷g_s²α′⁴ and is correct. The unverified section numbers (Polchinski §§12–13; Ibáñez–Uranga ch. 10) were removed. The T-duality argument for V₆ ≳ ℓ_s⁶ is now labeled a heuristic (exact for tori), and a one-clause gloss was added in Go deeper.
19. **Greene "average tree" (flagged):** the cited source, Wikipedia's article on the book, does not contain the quote. It was removed as a source, and the attribution is now marked "usually attributed; chapter and page not checked". Nothing on screen depends on it. PBS NOVA's "solar system → tree" wording was verified, and its rejection stands.
20. **FCC fill-factor mismatch (flagged):** confirmed. 85 TeV at 14 T with f = 0.6606 gives 96.3 km, and 90.7 km implies f ≈ 0.70. It is correctly presented as a check. FCC facts (90.7 km, 85 TeV, 14 T Nb₃Sn, early 2070s, HTS 14–20 T, decision ~2028) were verified against CERN Courier (2025).
21. **2026 European Strategy (flagged):** 22 May 2026 and "FCC-ee preferred" were verified on europeanstrategy.cern. The Strategy page does not give "decision targeted for 2028"; that date is from the 2025 feasibility-study coverage and is now attributed that way. Also added: a descoped FCC-ee is the fallback, and other options "were not ranked".
22. **Run 3 / LS3 dates (flagged):** last beams on 27 June 2026 were verified (CERN Courier), as were the final pp run on 16 May and the final Pb–Pb run on 14 June. "LS3 began 29 June" was only the date of CERN's announcement article, and it is now worded that way. The past tense "reached" is correct.
23. **Paper thickness (flagged):** Wikipedia gives 0.07–0.18 mm, not specifically "80 g/m² ≈ 0.1 mm". The quote was corrected. The ~0.1 mm midpoint comparison stands (the computed midpoint is 0.119 mm).
24. **Inflation scale (flagged):** verified as CMB-S4 Science Book eq. (2.14), and independently recomputed as 1.02–1.04 × 10¹⁶ GeV from A_s. Added: it assumes single-field slow roll. r < 0.036 was verified (BICEP/Keck, PRL 127, 151301), giving V^{1/4} < 1.43 × 10¹⁶ GeV.
25. **CLIC 72 MV/m** was misattributed to the 2012 CDR, which predates the 380 GeV staging. It is now sourced to the 2016 staging baseline (CERN-2016-004).
26. **Hyperion 116.22 m (2026)** was verified on Wikipedia. The LVK O3 limit Gμ ≲ 4 × 10⁻¹⁵ was verified in arXiv:2101.12248. The Eöt-Wash wording was aligned with the abstract (52 µm–3.0 mm; λ > 38.6 µm excluded). The Lawrence–Livingston 1.22 MeV figure was verified (LBL). The Bourilkov electron-size limit of 2.8 × 10⁻¹⁹ m was verified (hep-ph/0002172).
27. **Fill factor** used ρ = 2,803.06 m, while Numbers listed the design value of 2,803.95 m. The calibration is now explained (the difference is 0.03%).

**Implementation and consistency**
28. **Handoff mismatch with the pose registry:** chapter 9's Handoff OUT is **H2**, not H1. The draft's H1 formula (0.06ℓ, 0.55 Hz, 50% of the width) and its camera `(0, 0, 6)` contradicted `src/core/handoff.ts` (camera `(0, 0, 10)`, fov 35°; H1 length 4.2 at ω = 2.2; H2 radius 1.3 at ω = 1.6). The Opening now starts from H2 via the registry, with an H1 fallback. The start scale s₀ was recomputed (−34.11 for H2, −33.82 for H1), along with the dolly factor.
29. **Warmth rule** was smoothstep(0.5, 3). Chapter 1 has since corrected this to smoothstep(1, 3), so that warm light means resolved. It was updated here, together with the opening's "ℓ/δ passes 3 → 1".
30. **Beat 2 bar segments overlapped** (solid to −19, band from −18). The solid bar now ends at −18.
31. **Beat 4 ring growth** started at the Model's 25.9 km against the real 26.7 km ring. A blend rule was added.
32. **Beat 5 string-scattering curve** had no formula. Δx_s = ħc/E + ℓ_s²E/ħc was added, with its minimum 2ℓ_s at ≈ 2 × 10¹⁸ GeV.
33. **Black-hole-floor Lab display** had two inconsistent thresholds (10¹⁸ GeV and Δx > 1.1d), and it was unclear what "best possible" meant. Model 7 now defines the chip threshold, the number threshold (d < 7.2 × 10⁻³⁵ m) and both numbers (Δx at this E, and the constant minimum of 4.6 × 10⁻³⁵ m).
34. **Beat 6 leaders** were specified for only 3 of the 6 cards. All six are now defined. The CMB card has a two-ended leader, from the sky to ~2 × 10⁻³² m, which teaches why cosmology is the one window that reaches near those scales.
35. Minor fixes: the audio caption is now live (`{t_lap}`); the concentration inset's 360 MJ is labeled DESIGN; the energy-axis end tick was clarified; Beat 1 and 2 say "width" rather than "edge" of the observable universe, since the Ruler uses the diameter.

**Checked and left unchanged:** the chip assignments for Beats 1–4 (OBSERVED for measured numbers and arithmetic from established physics, with the ANALOGY flags), Beat 5 (CONJECTURED floor, OBSERVED synchrotron) and the route cards. None implies string theory is confirmed, that SUSY was expected at the LHC, or that NANOGrav saw strings, and the resolution floor is consistently a heuristic.

## Editor notes (cross-chapter pass, 2026-09-28)

1. **Callback, not a second explanation.** "Seeing smaller takes more energy: roughly ħc divided by the distance" is Chapter 1's lab lesson, in its micro-copy, readouts and Go deeper. Chapter 5's ZOOM station reuses it. Beat 3 now opens "Recall Chapter 1:" so the idea is explained once and recalled here, where it becomes the chapter's engine. 44 words.
2. **Glossary deduplication.**
   - `string scale` is introduced in Chapter 2 (Beat 5).
   - `supersymmetry` is introduced in Chapter 6 (Beat 1).
   - `electronvolt` is used from Chapter 1's lab onward.

   Their merged definitions keep this chapter's refereed wording: "ten to thirty times below the Planck energy", and "string theory does not fix the partners' masses". The Beat 3 and Beat 6 links now resolve to those entries.
3. **Site-wide fiducial confirmed.** This chapter's `~10⁻³⁴ m · HYPOTHETICAL` gauge, its ℓs = 10⁻³⁴ m string-scattering curve and its traditional band (10⁻³⁵–10⁻³³ m) now agree with Chapter 2's assumed M_s = 10¹⁸ GeV (ℓs ≈ 2 × 10⁻³⁴ m) and Chapter 7's lab option. Chapter 2 had used 10¹⁷ GeV ≈ 2 × 10⁻³³ m, just outside this band.
4. **Glossary length.** `indirect test` (was 33) and `cosmic superstring` (was 33) trimmed to the 30-word limit (ARCHITECTURE §3) without changing its claims.
