# 08 · Duality — Can two different worlds be the same?

**Thesis:** A string on a circle of radius R and a string on a circle of radius α′/R give identical physics, because the string's two ways of carrying energy around the circle, moving and wrapping, trade places exactly; string theory is full of such dualities, where one physics has two descriptions that look nothing alike.

**Overall status:** ◑ `DERIVED`. T-duality follows from string theory's equations: it holds at every order of string perturbation theory and is believed exact. It has never been tested in nature, because no extra dimension or string has been observed. The other dualities previewed at the end (S-duality, gauge/gravity) are ◌ `CONJECTURED` with strong evidence. Mirror symmetry is established for many constructed pairs, and several of its mathematical predictions have been proved. The ● `OBSERVED` facts on stage are the isospectral drums of the opening analogy and Beat 6's Maxwell footnote; neither is a test of string theory. Every picture of a hidden circle is ~ `ANALOGY`.

---

## Storyboard

**Global stage conventions (all beats).**
- **Camera.** The default camera is `HANDOFF.camera`: fov 35° at (0, 0, 10) looking at the origin. The visible height is ≈ 6.3 units.
- **Handoff frames.** Progress 0 and progress 1 render `<HandoffLoop/>` (H2, radius 1.3) with default props at the origin, with no view shift.
- **Desktop composition.** Beat text occupies the left ~40%. Use `useViewShift` to center each composition in the right 60%, easing the shift in after progress 0 and back out before progress 1. All x-positions below are relative to that composition center.
- **Phone (portrait) composition.** Compose in the upper 60%. During beats 1–6, dolly the camera to distance ≈ 17 so the split-screen fits, and return to 10 for the outro.
- **The Thread** (strings only) is `<Filament>`. **Hidden-circle cylinders** use `useIsoGridMaterial` (grid of 24 longitudinal lines × rings every 0.5 units, fresnel rim, Field color).
- **Point particles** are `<GlowPoint>` in `COLORS.ink`.
- **Labels** are sparse `<SceneLabel>`s. Every ~ANALOGY chip is a small mono label pinned bottom-left.

**Chapter color code.** Use it everywhere, in beats, lab and Go deeper:
- momentum energy: Field blue `#86A8D8`, because it is motion *through* the geometry;
- winding energy: Filament amber `#FFC98A`, because only strings can wind;
- vibration energy: Ink-2 grey `#9AA0AE`.

Winding segments in ladders and charts are **flat, unlit swatches** (80% opacity, no additive blending, no bloom). They are diagram keys that match the Thread, not light sources. If design review rules that this breaks "only strings glow warm", fall back to Ink `#ECE6D9` for winding.

The momentum wave rings are Field. This departs from Chapter 05's Ink wave, so that "momentum" has one color throughout the chapter.

**Units.** Radii are in **string lengths** ℓ_s = √α′, and masses in string units 1/ℓ_s (ħ = c = 1). The value of ℓ_s in meters is unknown. So `scale(h)` returns `null` for the whole chapter, and a pinned mono label reads `ℓ_s · SIZE UNKNOWN`, plus the live R where noted.

**Scroll map** (chapter `progress`): Opening 0.00–0.08 · B1 0.08–0.22 · B2 0.22–0.34 · B3 0.34–0.48 · **B4 (aha) 0.48–0.66** · B5 0.66–0.78 · B6 0.78–0.88 · Lab 0.88–0.97 · Outro/handoff 0.97–1.00. "Local p" below means progress re-mapped to 0–1 within a beat.

### Opening: *handoff IN*
- **Text:** Two descriptions of a world can look nothing alike, and still predict exactly the same result for every possible experiment. Physicists call such a pair a [[duality]]. String theory is full of them.
- **Status:** ◑ DERIVED
- **Stage:** **First frame = H2**, matching Chapter 07's last frame: `<HandoffLoop/>` at the origin. Chapter 07's 10% brane grid behind it dissolves over local p 0 → 0.15.
  - **0.15 → 0.4:** a vertical Field hairline, the **seam**, draws itself from the top of the frame to the bottom through x = 0, behind the loop (1 px, 40% opacity).
  - **0.4 → 0.75:** the loop splits into two identical copies. Each scales to 0.6 (radius 0.78) and slides apart to x = ±1.9 (ease-in-out). They keep wobbling **in phase**, identical to the last detail. Mono labels fade in above them: `WORLD A` and `WORLD B`.
  - **0.75 → 1.0:** the two worlds are made to look different. Behind A, a large dashed Field circle (radius 1.6, 25% opacity) fades in. Behind B, a tiny one (radius 0.2). A mono glyph appears on the seam: `= ?`
  - Camera still.

### Beat 1: Can you hear the shape of a drum?
- **Text:** In 1966 Mark Kac asked: can one hear the shape of a drum? In 1992 three mathematicians answered no. Two differently shaped drums can ring with exactly the same set of tones: the same [[spectrum]]. For a string, the "tones" are particle masses.
- **Status:** ~ ANALOGY (drums stand in for string worlds) + ● OBSERVED (isospectral drums are a theorem, and microwave-cavity experiments confirmed it in 1994)
- **Stage:**
  - **Local p 0 → 0.2 (unfold):** each loop unfolds into a drum outline. Resample the loop to 256 arc-length points and lerp them onto the polygon perimeter. Use the Gordon–Webb–Wolpert pair:
    - Drum A vertices: `(0,0) (0,1) (2,3) (2,2) (3,2) (2,1) (1,1) (1,0)`.
    - Drum B vertices: `(1,0) (0,1) (0,2) (2,2) (2,3) (3,2) (2,1) (1,1)`.
    - Center each on its centroid at x = ±1.9, y = +0.5, scaled to 0.6 world units per coordinate unit.
    - Drumheads: Field fill at 8% with a 1.5 px Field outline. The drums are not strings, so no filament.
  - **0.2 → 0.35 (same pieces):** inside each drum the 6 internal edges flash as hairlines (40% opacity, then fade), revealing its 7 congruent right-isosceles triangles. Label: `SAME 7 TRIANGLES · REARRANGED · SAME AREA · SAME PERIMETER`.
  - **0.35 → 0.9 (the tones):** under each drum (y = −1.2 baseline), a row of 8 vertical bars grows, **one pair at a time**. Bar height ∝ frequency ∝ √λₖ, using the ratios `1.000, 1.200, 1.428, 1.605, 1.690, 1.905, 2.043, 2.132` (see Numbers & facts). Tallest bar 1.0 unit.
    - As pair k lights, a level Ink hairline joins the two bars across the seam (equal heights).
    - Both drumheads "breathe" for 1.5 s. The displacement is `0.06·d(p)/d_max`, where d is the distance to the boundary, computed once per vertex, with exponential decay.
    - This is a cartoon, labelled `~ cartoon motion`. Optional upgrade: compute the true first 8 Dirichlet modes offline and embed them as a quantized `Uint8Array` in a TS module (8 modes × 2 drums × 32×32 = 16 KB; no network assets).
  - Readout: `8 / 8 TONES MATCH · SHAPES DIFFER`.
  - **0.9 → 1.0:** pinned labels appear: `~ ANALOGY · drums share only their tones. Dual string worlds share every measurable quantity.` and `● proved 1992 · measured in microwave cavities 1994`.
  - Audio (muted by default): pair k plays `f = 220·√(λₖ/λ₁)` Hz, panned left and right. The two sides are identical in pitch.

### Beat 2: Moving around the circle
- **Text:** Curl one direction into a circle of radius R, as in Chapter 5. A closed string can travel around it, but its quantum wave must fit: n whole wavelengths. This [[momentum mode]] costs energy proportional to n/R: cheap when the circle is big.
- **Status:** ◑ DERIVED (+ ~ ANALOGY for the cylinder picture)
- **Stage:**
  - **Transition:** the drums fade. The seam slides to the right edge and dims to 10%.
  - **The cylinder:** a horizontal cylinder appears (iso-grid material), 4.4 units long along x.
    - Visual radius `ρ = 0.9·√(R/ℓ_s)`, starting at R = 1 (ρ = 0.9).
    - Camera orbit: yaw 28°, pitch 14°.
    - Labels: `x · A LARGE DIRECTION` along the axis, and `AROUND · HIDDEN CIRCLE · RADIUS R` on an arc of the end ring.
    - Pinned: `~ ANALOGY · the surface is the space; "around" is one hidden direction. Not to scale.`
  - **The string:** the Thread is a small closed loop (radius 0.16) lying on the surface at x = 0. It circulates around the circle at 0.6·n rad/s.
  - **The wave:** a Field wave ring encircles the cylinder at x = −0.8, with `r(θ) = ρ·[1 + 0.06·cos(nθ − 1.2t)]`. Its n steps through 1 → 2 → 3 at local p 0.15, 0.35 and 0.55, with a brief lock flash each time, echoing Chapter 05's fit.
  - **The ladder:** a vertical ladder stands at x = +2.9, labelled `MOMENTUM ENERGY · n/R`. Its Field rungs (0.5 units wide) sit at `y = −2 + 0.8·n/R` for n = 1…6, clipped at y = +2.
  - **Local p 0.6 → 1.0:** R grows 1 → 3 (ρ 0.9 → 1.56) as the camera dollies back to keep the framing. The rungs compress toward the base. Readout: `R ↑ · MOMENTUM RUNGS ↓ · CHEAP ON BIG CIRCLES`.
  - Live label: `R = 1.00 → 3.00 ℓ_s`.

### Beat 3: Wrapping around the circle
- **Text:** Only a string can also wrap around the circle, like a rubber band on a pole. Its [[winding number]] w counts the wraps. Stretching costs energy, tension times length, so winding energy grows with R: cheap on small circles. A point particle cannot wind.
- **Status:** ◑ DERIVED (+ ~ ANALOGY: rubber band, cylinder)
- **Stage:**
  - **0 → 0.3 (wrapping):** same cylinder, R = 3. The small loop stretches and wraps once around the circumference, a ring hugging the surface at x = 0. Filament intensity rises ∝ its length, because tension × length is energy.
  - **At 0.3, a second wrap:** the ring becomes a w = 2 coil, drawn as a closed curve `σ ∈ [0, 2π)`, `θ = 2σ`, `x = 0.22·sin σ`, so the laps don't overlap.
  - **Second ladder:** a new ladder rises at x = +3.5, with amber rungs at `y = −2 + 0.8·w·R` (w = 1…4, clipped at +2), labelled `WINDING ENERGY · wR/α′`. At R = 3 only w = 1 (y = +0.4) is in frame: expensive.
  - **0.3 → 0.45 (the point can't):** an Ink point particle sits on the surface and slides once around the circle, leaving a short Ink trail. When it gets back to its start the trail fades. Nothing stays wrapped. Label: `A POINT CAN CIRCLE, NOT STAY WRAPPED · NO WINDING ENERGY`.
  - **0.5 → 1.0 (shrink):** R shrinks 3 → 1/3 (ρ 1.56 → 0.52), on a log path, while the camera dollies in.
    - The winding rungs fall and crowd together (spacing ∝ R).
    - The momentum rungs spread upward out of frame (spacing ∝ 1/R).
    - The coil stays wrapped and dims as it shortens.
    - Readout: `R ↓ · WINDING RUNGS ↓ · CHEAP ON SMALL CIRCLES`.
  - Pinned: `~ ANALOGY · a real string has no thickness, and no pole is inside.`
  - Live label: `R = 3.00 → 0.33 ℓ_s`.

### Beat 4: Two worlds, one spectrum (*the aha*)
- **Text:** Compare two worlds: one with circle R, one with circle α′/R ([[α′]], string theory's one scale). Each momentum rung in one sits exactly on a winding rung in the other. Every mass matches; so does every interaction. Two descriptions, one physics: [[T-duality]].
- **Status:** ◑ DERIVED (holds at every order of string perturbation theory; believed exact) + ~ ANALOGY (drawings)
- **Stage:** This is the chapter's signature moment. The layout is `WORLD A | seam ladder | WORLD B`.
  - **Worlds.** Both cylinders are 2.2 units long, centered at x = ±2.2 and y = +1.0, with `ρ = 0.9·√(R/ℓ_s)`.
  - **Seam ladder.** It straddles the seam and holds the **lowest 8 state families** from the Lab model (same function, same sort), at heights `y = −2.6 + 1.1·M` (M in string units).
    - Each family is a rung 1.4 units wide split at the seam. The **left half** (x ∈ [−0.7, 0]) is colored by WORLD A's momentum/winding/vibration shares of M². The **right half** is colored by WORLD B's.
    - Stacking along each half, from the seam outward: vibration, then the smaller of momentum and winding, then the larger. This is the Lab rule, which makes the dual geometry identical.
    - When k families share a height, split each half into k equal dashes with 0.04-unit gaps.
  1. **Recognition (local p 0.00–0.20).** The small cylinder from Beat 3 (R = 1/3) slides right of the re-brightened seam and becomes **WORLD B**. On the left, a big cylinder (R = 3, ρ = 1.56) fades in as **WORLD A**. The seam ladder builds rung by rung from the bottom. Its left halves are mostly blue, its right halves mostly amber. Tag: `WAIT: THESE HEIGHTS AGAIN?`
  2. **The match (0.20–0.35).** Every rung is one **unbroken** line across the seam: the heights agree exactly. Counter: `MATCH 8 / 8`.
     - The selected rung cycles through the lowest four every 1.5 s. WORLD A draws its reading (a wavelengths, b windings); WORLD B draws the swapped reading (b wavelengths, a windings), using the Lab picture model.
     - Lowest rung: A shows a one-wavelength Field wave on the big cylinder, and B shows a string **wound once** around the small one.
  3. **The morph (0.35–0.80).** `R_A` travels 3 → 1/3 on a log path, and `R_B = α′/R_A` always.
     - The cylinders change size in opposite directions. At local p 0.575 they pass through the same size, the self-dual radius. There both worlds look identical and the seam flashes once.
     - The rungs slide up and down as R changes, but **no rung ever breaks at the seam**: the two halves are locked together.
     - Left halves drain from blue to amber; right halves from amber to blue.
     - Readouts: `R_A × R_B = α′ · ALWAYS` and `MATCH 8 / 8`, never dropping.
     - By the end, each world looks exactly as the other did at the start.
  4. **Landing (0.80–1.00).** The seam hairline fades. Each rung reads as a single two-tone bar: one spectrum, two readings.
     - Large caption (Bodoni Moda, italic): **"Two pictures. One spectrum."**
     - Beneath it, in mono: `R ⟷ α′/R · n ⟷ w`.
     - Pinned: `~ ANALOGY · circles drawn ∝ √R, not to scale.`
  - Live label: `R_A 3.00 → 0.33 · R_B 0.33 → 3.00 ℓ_s`.
  - Reduced motion: skip the morph. Cross-fade the start and end states, with the rungs unbroken in both.

### Beat 5: The smallest circle
- **Text:** Shrink the circle below √α′, the string length, and nothing new appears. Past this [[self-dual radius]], the physics retraces that of ever-larger circles, with momentum and winding trading roles. For strings, a circle smaller than the string length is a larger circle, described differently.
- **Status:** ◑ DERIVED (a statement about circles probed by strings; see Pitfalls on "minimum length")
- **Stage:**
  - **Setup:** the two worlds shrink into the top corners (scale 0.35). At center a 2D plot is drawn in Field hairline, 5.6 × 3.4 units:
    - x-axis: log R from 0.1 to 10 ℓ_s, with decade ticks labelled `0.1`, `1 = √α′`, `10`.
    - y-axis: `MASS²`, 0–10 string units.
    - Curves: every family curve from the Lab's spectrum map (see Model). Momentum-type curves fall from left to right (blue). Winding-type curves rise (amber swatch lines). Pure vibration curves are flat (grey).
    - A vertical dashed line at x = 0 is labelled `SELF-DUAL · R = √α′`.
  - **0.15 → 0.6 (the fold):** the left half of the plot (R < √α′) is a separate mesh. It rotates 180° about the dashed line like a turning page, scrubbed by scroll.
    - Curves stay flat (no additive blending or bloom), per the swatch rule, so amber never glows.
    - When the fold lands, **every left-half curve lands exactly on a right-half curve**. Each landed pair flashes Ink together for 0.6 s, so the whole plot brightens uniformly. A blue curve lands on an amber one: the swap, seen.
    - Label: `FOLDED AT √α′ · EVERY CURVE LANDS ON A CURVE`.
  - **0.6 → 1.0 (the bounce):** a small cylinder near the bottom shrinks continuously, R = 3 → 0.1. Two mono readouts sit side by side:
    - `RADIUS YOU SET: 3.00 → 0.10`
    - `EQUIVALENT LARGE CIRCLE: max(R, α′/R) = 3.00 → 1.00 → 10.0`
    - The second readout bottoms out at 1.00 as R passes √α′ and **climbs again**. Its needle bounces off the dashed line.
  - Pinned: `◑ with strings as probes. D-branes can resolve shorter distances (Go deeper).` and `~ plot schematic · families grouped · |n|, |w| ≤ 6 shown`.

### Beat 6: A web of dualities
- **Text:** T-duality is the simplest of many. It even turns one superstring theory (IIA) into another (IIB). S-duality swaps strong and weak [[string coupling]]. Mirror symmetry pairs different Calabi–Yau shapes. [[gauge/gravity duality]] equates a theory with gravity to one without it. Several remain conjectures, strongly supported.
- **Status:** ◑ DERIVED (T-duality rows) · ◌ CONJECTURED (S-duality, gauge/gravity) · mirror symmetry: ◑ for constructed pairs, ◌ in general
- **Stage:**
  - **The dictionary:** the plot folds away and a two-column **dictionary** builds in depth. Each row is a thin glass strip, 5.2 × 0.42 units, with a 1 px Field border; rows are 0.16 apart, tilted 8° toward the camera. Columns are headed `DESCRIPTION A` and `DESCRIPTION B`, with a `=` on the seam. Each row carries its own status chip at the right edge. Rows arrive one per 1/7 of local p:

    | # | Description A | Description B | Chip |
    |---|---|---|---|
    | 1 | `circle of radius R` | `circle of radius α′/R` | ◑ |
    | 2 | `momentum n` | `winding w` | ◑ |
    | 3 | `open-string ends free to slide` | `ends pinned on a D-brane` | ◑ (pays off Chapter 07's card) |
    | 4 | `type IIA on a circle` | `type IIB on the dual circle` | ◑ |
    | 5 | `coupling g (strong)` | `coupling 1/g (weak)` | ◌ S-duality |
    | 6 | `type IIA on Calabi–Yau X` | `type IIB on its mirror X̃` | ◑/◌ |
    | 7 | `strings + gravity in 5D anti-de Sitter space (× a 5-sphere)` | `a gauge theory without gravity on its 4D boundary` | ◌ Maldacena 1997 |

  - **Row glyphs:**
    - Row 5 (S-duality): two small dials, one turning up from `g = 0.1` while its mirror turns down from `10`. Footnote: `● a cousin: Maxwell's equations in empty space are unchanged by E → B, B → −E`.
    - Row 6 (mirror symmetry): two tangled glyphs from Chapter 06 swap a pair of numbers: `(1, 101) ⟷ (101, 1)`, the quintic's Hodge numbers.
    - Row 7 (gauge/gravity): a translucent iso-grid cylinder whose curved **surface** glows faintly. The interior stands for gravity, the boundary for the gauge theory. Label: `~ schematic`.
  - Pinned: `~ ANALOGY · a dictionary, not a map of where things are.`

### Lab dock (0.88–0.97) and Outro (0.97–1.00): *handoff OUT*
- **Lab dock:** the dictionary slides away. The two worlds return at R_A = 2 and R_B = 0.5 (the lab default), center-left, clear of the panel. The instrument panel docks bottom-right.
- **Outro (no text; calm, at the OUT pose for the final viewport):**
  - Both worlds glide to the seam at the self-dual radius, where they are identical, and merge into one cylinder.
  - The wound Thread slips off the end of the cylinder and unwinds into a free closed loop. It drifts to the origin at canonical size (radius 1.3) while the cylinder fades and the view shift returns to [0, 0].
  - **Final frame = H2:** `<HandoffLoop/>` with default props at the origin, camera at `HANDOFF.camera`. The seam hairline may remain at 8% opacity for Chapter 09 to turn into its first "bridge", or be dissolved.

---

## Lab

**Title: The Circle Swap.**

**Layout.**
- **Stage** (center-left): `WORLD A · RADIUS R` | seam | `WORLD B · RADIUS α′/R`, drawing the selected state, with an `=` or `≠` glyph on the seam.
- **Panel** (DOM, ≈360 px, bottom-right), top to bottom:
  1. the mass formula with live term highlights;
  2. a paired bar chart (SVG) of the lightest 16 state families;
  3. a spectrum-map strip sitting on top of the log radius slider;
  4. the buttons and readouts.

**Purpose:** Discover that a string's list of masses at radius R is identical to the list at α′/R, because momentum and winding trade places, and that a point particle has no such symmetry.

### Controls

| Control | Type · range | Default | Units |
|---|---|---|---|
| `Circle radius R` | log slider, 0.10 – 10.0, soft detent at 1.00 (±0.02 in log₁₀) | **2.00** | string lengths ℓ_s = √α′ |
| `Jump to the dual world` | button (0.9 s transition) | — | — |
| `Pick a state` | tap a bar pair (or ←/→ with the chart focused) | pair 1 | — |
| `What lives on the circle?` | segmented: `String` / `Point particle` | String | — |

Keyboard: slider arrows step log₁₀R by 0.01, and Shift steps by 0.1. A ghost thumb (hollow, dashed) always marks the mirror position α′/R on the same track.

### What changes on screen
- **Worlds (stage).** WORLD A draws a cylinder of radius R and WORLD B one of radius α′/R, both not to scale. Each shows the **selected family** (a, b, S) in its own reading:
  - A shows **a** momentum wavelengths and **b** windings.
  - B shows **b** wavelengths and **a** windings.
  - Dragging R through 1 morphs A into what B showed, and vice versa. At R = 1 the two are identical.
  - Point-particle mode: both worlds show an Ink point with its wave, and no coil.
- **Formula.** `M² = (n/R)² + (wR/α′)² + (2/α′)(N + Ñ)`, with `N − Ñ = nw` beneath. Use `<Eq>` with `\htmlClass{mom}`, `\htmlClass{wind}` and `\htmlClass{vib}`. Each term is tinted in its chapter color and highlighted by its share for the selected pair, and the dominant term is underlined. Live values appear under each term.
- **Paired bar chart.** 16 pairs sorted by mass², with a fixed y-axis of 0–10.5, ticks at 0, 2, …, 10 (`MASS² · STRING UNITS`). The 16th bar reaches exactly 10 at r = √(3/2) and √(2/3), so the headroom keeps it off the frame.
  - Each pair has two 7 px columns: **left = WORLD A's reading, right = WORLD B's reading**. Under each pair, mono labels read `n·w`, e.g. `1·0`.
  - **String:** every pair has two columns of **identical height** with mirrored colors (blue ↔ amber).
  - **Point particle:** B's columns are a²r² instead of a²/r², so the pairs visibly disagree, clipped with `↑` above 10.5.
  - As R grows, the blue columns sink and crowd together, and the tag `A NEW LARGE DIRECTION OPENING` appears when pair 16 falls below 3 (this happens for r > 9.24). As R shrinks, amber does the same and the tag reads `THE DUAL DIRECTION OPENING` (r < 0.108).
  - Grey (pure vibration) pairs never move.
- **Jump to the dual world.** R ← α′/R. The worlds swap sides with a crossing slide. **No bar moves by a single pixel**: in each pair the two columns exchange colors, and the `n·w` labels flip.
- **Spectrum map** (80 px strip on the slider track). The family curves over log R, with a live cursor at R and a dashed ghost cursor at α′/R. The strip is visibly mirror-symmetric about the `√α′` tick.
- **Readouts:** `R = 2.00 ℓ_s · α′/R = 0.50 ℓ_s` · `SELECTED: n = 1 · w = 0 · N+Ñ = 0` · `M = 0.500 string units` · `DUAL READING: n = 0 · w = 1` · `MATCH 16 / 16`.

### Model (what the engineer implements)

**Physics chosen.** The closed **type II superstring** with one direction on a circle, at weak coupling (tree-level spectrum). It has no tachyon, and it is the 10-dimensional superstring of Chapter 05.

The formula is from Schwarz 1996, eqs. (41)–(42), and agrees with Tong §8 for the momentum and winding terms:

`M² = (n/R)² + (wR/α′)² + (2/α′)(N + Ñ)`, with `N − Ñ = nw` (sign conventions differ between textbooks; only |N − Ñ| = |nw| matters here).

- n, w ∈ ℤ are the momentum and winding numbers. N, Ñ ∈ {0, 1, 2, …} are the right- and left-moving vibration levels (Tong's labelling; books differ), counted from the massless ground state after the GSO projection. On a plain circle (no Scherk–Schwarz twist) the GSO projection acts only on the oscillators, independent of n and w, and every level N ≥ 0 is occupied (16 states at N = 0).
- The bosonic-string version has (N + Ñ − 2) instead. It is not used because it has tachyons (M² < 0), which a bar chart can't show honestly. The duality works identically in both.
- **Faithful:** every bar is an exact tree-level mass². States with N = 0 or Ñ = 0 are BPS, and their masses are exact at any coupling. For these, `M = |n|/R + |w|R/α′`.

**Units and slider.** Set ħ = c = 1 and ℓ_s = √α′ = 1. Then `r = R/ℓ_s`, and the plotted quantity is `y = α′M²`, which is dimensionless.
- Slider `u ∈ [0, 1]`: `r = 10^(2u − 1)`. The default is r = 2 **exactly**, at `u = (1 + log₁₀2)/2 ≈ 0.650515`. Initialize r itself, not a rounded u: u = 0.6505 gives r = 1.99986, which reorders pairs 5 and 6 relative to the test vector.
- Detent: if `|log₁₀ r| < 0.02`, snap to r = 1.

**String families.** A bar is a **family** `(a, b, S)` with `a = |n|`, `b = |w|` and `S = N + Ñ`. The signs of n and w, and all spin, polarization and fermion states, are grouped into one bar; the tooltip says so.
- Allowed: `a, b, S ≥ 0`, `S ≥ a·b`, `S ≡ a·b (mod 2)`, and not `(0, 0, 0)`. The excluded state is the massless floor, drawn as a baseline labelled `MASSLESS · GRAVITON & PARTNERS`.
- Segments: `mom = a²/r²`, `wind = b²·r²`, `vib = 2S`, and height `y = mom + wind + vib`.
- Enumerate `a, b ∈ [0, 60]` with `a·b ≤ 12` and `S ∈ [a·b, 12]`. That is about 10³ candidates, recomputed only on slider input.
- Sort by `y`, with ties broken by `(S, max(a,b), min(a,b), −a)`. Treat heights within 1e−9 as tied before applying the tie-break, so floating-point noise at r and 1/r cannot reorder a pair. Keep the lowest 16.
- These bounds are sufficient over the whole slider range: the 16th level never exceeds y = 10. It reaches exactly 10 at r = √(3/2) (where (0,2,2) and (3,0,2) tie) and at the mirror radius √(2/3). Hence the fixed y-axis of 0–10.5.
- **World B's column** for pair i is the same family read at `1/r`, i.e. `(b, a, S)`. Its segments are `mom_B = b²r²` (= wind_A) and `wind_B = a²/r²` (= mom_A), and its height is identical.
- **Stacking rule, so a jump changes colors only:** stack vibration at the bottom, then the **smaller** of (mom, wind), then the larger. The geometry of A's column and B's column is then identical, and only the colors differ.
- **Duality check (unit test):** for any r ≠ 1, bar i at r is `(a, b, S)` if and only if bar i at 1/r is `(b, a, S)`, and the heights agree to 1e−9. Verified numerically at 400 radii. At r = 1 exactly, tied pairs `(a, b, S)` and `(b, a, S)` may swap order, which is invisible.

**Point-particle mode.** Families `a = 1, 2, …`: WORLD A has `y_A = a²/r²` and WORLD B has `y_B = a²·r²`. There is no winding and no vibration: a point has neither. Keep the lowest 16 by y_A. Clip anything above 10.5 with a small `↑`. `MATCH` counts the pairs with `|y_A − y_B| < 1e−9`; it is 16 only at r = 1. The seam glyph shows `≠` whenever MATCH < 16.

**Test vector (String, r = 2, lowest 16):**

| # | (\|n\|, \|w\|, N+Ñ) | α′M² | mom / wind / vib |
|---|---|---|---|
| 1 | (1,0,0) | 0.25 | 0.25 / 0 / 0 |
| 2 | (2,0,0) | 1.00 | 1 / 0 / 0 |
| 3 | (3,0,0) | 2.25 | 2.25 / 0 / 0 |
| 4 | (0,1,0) | 4.00 | 0 / 4 / 0 |
| 5 | (4,0,0) | 4.00 | 4 / 0 / 0 |
| 6 | (0,0,2) | 4.00 | 0 / 0 / 4 |
| 7 | (1,0,2) | 4.25 | 0.25 / 0 / 4 |
| 8 | (2,0,2) | 5.00 | 1 / 0 / 4 |
| 9 | (5,0,0) | 6.25 | 6.25 / 0 / 0 |
| 10 | (1,1,1) | 6.25 | 0.25 / 4 / 2 |
| 11 | (3,0,2) | 6.25 | 2.25 / 0 / 4 |
| 12 | (0,1,2) | 8.00 | 0 / 4 / 4 |
| 13 | (4,0,2) | 8.00 | 4 / 0 / 4 |
| 14 | (0,0,4) | 8.00 | 0 / 0 / 8 |
| 15 | (1,0,4) | 8.25 | 0.25 / 0 / 8 |
| 16 | (6,0,0) | 9.00 | 9 / 0 / 0 |

At r = 0.5 the heights are identical, with n and w swapped in every row. At r = 10 the bars are `(k, 0, 0)` with y = k²/100 for k = 1…16: a near-continuum. At r = 1 the lowest are `(1,0,0)` and `(0,1,0)` at y = 1. There are no extra massless states at r = 1 in type II; that enhancement happens only for bosonic and heterotic strings (Numbers & facts).

**Formula highlighting.** For the selected pair, `share_k = term_k / y`, and `highlight = { mom: share, wind: share, vib: share }`. The largest share gets an underline in its color. Live values are shown to 3 significant figures.

**Picture model (cartoon, labelled ~ANALOGY):**
- **Cylinder.** Axis along x, length 2.2 units, visual radius `ρ(r) = 0.9·√r`, clamped to [0.28, 2.0]. Iso-grid material. Fixed orbit: yaw 25°, pitch 12°.
- **Winding coil** (b ≥ 1). A closed curve with `σ ∈ [0, 2π)`: `θ = b·σ + φ(t)`, `x = h·sin σ` where `h = 0.10 + 0.06·b`, and radius `ρ + 0.02`. `φ(t) = 0.6·a·t` is a slow rigid spin standing in for momentum (cartoon). `<Filament closed>`.
- **Unwound string** (b = 0). A loop of radius 0.16 tangent to the surface at `θ₀ = 0.6·a·t`. It circulates if a > 0 and sits still if a = 0.
- **Momentum wave ring** (a ≥ 1). At `x = −0.7`: `r(θ) = ρ·[1 + 0.06·cos(aθ − 1.2t)]`, Field, 1.5 px. When a = 0, draw a plain ring at 25%.
- **Vibration** (S > 0). Add a normal displacement to the Thread curve, `0.03·√S·sin(kσ − 2t)` with `k = 2 + (S mod 4)`. Label: `~ vibration drawn schematically`.
- **Point mode.** An Ink `<GlowPoint>` at `θ₀ = 0.6·a·t`, plus its wave ring.
- The spinning coil and circulating loop are cartoons. A state with definite n has no definite position around the circle; the wave ring is the honest part. Label: `~ ANALOGY · the wave is the honest part: n whole wavelengths.`

**Spectrum map (slider strip, SVG).**
- x = log₁₀ r ∈ [−1, 1], y ∈ [0, 10].
- Draw every family with `a, b ≤ 6` and `S ∈ {ab, ab + 2, ab + 4}` as a polyline of 200 samples. Clip at y = 10.
- Color each segment by its locally dominant term: blue if `a²/r² > b²r²`, amber if the reverse, grey for `a = b = 0`.
- Cursor: solid Ink at log₁₀ r. Ghost: dashed at −log₁₀ r. A tick at 0 is labelled `√α′`.
- The strip is exactly mirror-symmetric about x = 0 (as a set of curves). Beat 5 folds this same figure.
- The strip is a truncation: near r = 10 (or 0.1) the chart holds momentum (or winding) bars up to 16, but the strip draws only |n|, |w| ≤ 6. That is acceptable for an 80 px schematic; do not claim one curve per bar.

**Simplifications to flag in the UI footnote:**
- Only one circle is compact; the other 8 space directions are flat and large.
- There is no B-field or Wilson line on the circle.
- Families group signs, spins and fermions.
- Tree-level masses only, except BPS states, which are exact.
- The coupling shift (g → g√α′/R) needed for interactions to match is not visualized (Go deeper).
- Circles are drawn ∝ √R.
- ℓ_s in meters is unknown and never shown.
- For type II, WORLD B is strictly the partner theory (IIA ↔ IIB). Masses are unaffected.

**Reduced motion.** Freeze φ(t), the wave phase and the vibration at t = 0 (use `ambient()`). The jump becomes a 150 ms cross-fade. All controls still work.

### Micro-copy (≤ 20 words each)
- Panel intro: "Set the circle's size. Compare the sixteen lightest string states in both worlds."
- R slider: "Circle radius R, in string lengths. Drag it through √α′."
- Ghost thumb: "α′/R: the dual circle. Same spectrum, other description."
- Detent at 1: "R = √α′: both descriptions have the same size. The self-dual point."
- Jump button: "Jump to the dual world"
- After a jump: "Relabelled, not changed. Every bar kept its height; momentum and winding swapped colors."
- Chart key: "Each pair: World A left, World B right. Equal height means equal mass."
- Match (string): "All sixteen pairs match. No experiment could tell these worlds apart."
- Point mode: "A point can't wind. Its two worlds disagree: it can tell big from small."
- Formula caption: "Momentum (blue) + winding (amber) + vibration (grey). The swap trades the first two."
- Level matching: "N − Ñ = nw: a string that both moves and wraps must also vibrate."
- Large R: "Blue bars crowd together: a new large direction opening up."
- Small R: "Amber bars crowd together: the dual large direction opening up."
- Grey bars: "Pure vibration: indifferent to the circle's size."
- Superstring note: "For superstrings the dual world is the partner theory, IIA ↔ IIB. Masses match exactly."
- Bar tooltip: "n = 1 · w = 0 · N+Ñ = 0 · M = 0.50 · signs and spins grouped"
- Scale caveat: "~ Circles drawn ∝ √R. The string length in meters is unknown."

### Audio (optional, muted by default)
The spectrum plays as a chord. Each of the lowest 6 bars sounds `f = 220 Hz × M` (M in string units), faithful to E = hν up to scale. Drop any tone outside 55–1760 Hz. At r = 2 this gives 110, 220, 330, 440, … Hz. **On "Jump to the dual world" the chord does not change by a single cent.** You cannot hear the difference, which echoes Beat 1's drums. In point mode, WORLD B's chord sounds against A's and clashes.

---

## Go deeper

**The mass formula.** Curl one direction into a circle of radius R. With ħ = c = 1, a closed superstring then has

$$M^2 = \underbrace{\left(\frac{n}{R}\right)^2}_{\text{momentum}} + \underbrace{\left(\frac{wR}{\alpha'}\right)^2}_{\text{winding}} + \underbrace{\frac{2}{\alpha'}\left(N+\tilde N\right)}_{\text{vibration}}, \qquad N-\tilde N = nw$$

- **Momentum (blue):** n whole wavelengths fit around the circle, so the momentum is n/R.
- **Winding (amber):** a string wrapped w times has length 2πwR and tension T = 1/(2πα′), so it costs wR/α′.
- **Vibration (grey):** N and Ñ count the ripples running each way around the loop (Chapter 2).
- **Level matching (Chapter 4)** gains a twist: the imbalance N − Ñ must equal nw. A string that both moves and wraps must also vibrate. For the lightest state of each (n, w), M = |n|/R + |w|R/α′.

**The swap.**

$$R \;\to\; \frac{\alpha'}{R}, \qquad n \leftrightarrow w, \qquad g_s \;\to\; g_s\,\frac{\sqrt{\alpha'}}{R}$$

The first two terms trade places and the third doesn't care. Momentum and winding are each conserved, and each is the charge of its own photon-like field; the swap exchanges those fields too. The coupling shift keeps interactions identical. Because the string's worldsheet theories at R and α′/R are equivalent, the match holds at every order of string perturbation theory.

For superstrings the dual world is the partner theory: type IIA on radius R equals type IIB on α′/R. The bosonic string's formula carries (N + Ñ − 2); it swaps the same way. Applied to open strings, T-duality turns free ends into ends fixed on a surface, which is how D-branes were found in 1989.

**Other dualities.** S-duality (◌) maps coupling g to 1/g. Mirror symmetry pairs different Calabi–Yau shapes; it predicted 317,206,375 twisted cubic curves on the quintic, a count later proved. Gauge/gravity duality (Maldacena 1997, ◌) equates string theory in anti-de Sitter space, gravity included, with a gauge theory on its boundary.

---

## Glossary
- `duality` — Two descriptions that look different but predict identical results for every possible measurement, linked by a precise dictionary that translates each quantity of one into the other.
- `spectrum` — The complete list of allowed frequencies (for a drum) or particle masses (for a string world). Matching spectra are necessary for a duality but not sufficient.
- `isospectral` — Having exactly the same spectrum. Isospectral drums have different shapes yet ring with identical tones. Proved possible in 1992 and confirmed with microwave cavities in 1994.
- `momentum mode` — A string state circling a compact dimension, its quantum wave fitting n whole wavelengths. Its energy scales as n/R, cheap on large circles: Chapter 5's Kaluza–Klein rungs.
- `winding number` — How many times a closed string wraps a compact circle. Wrapping costs tension × length, energy wR/α′: cheap on small circles. Point particles cannot wind.
- `T-duality` — The equivalence of string physics on a circle of radius R and one of radius α′/R, with momentum and winding exchanged. Holds at every order of string perturbation theory.
- `self-dual radius` — R = √α′, the string length, where a circle and its T-dual partner are the same size. Every smaller radius is equivalent to a larger one.
- `mirror symmetry` — Pairs of different Calabi–Yau shapes giving identical string physics (type IIA on one equals type IIB on the other); their Hodge numbers swap. Not a reflection of space.
- `gauge/gravity duality` (alias `AdS/CFT correspondence`) — Also called AdS/CFT (Maldacena 1997): a conjectured equivalence between string theory (which includes quantum gravity) in a curved anti-de Sitter space and a gravity-free quantum theory on its boundary.

Terms used here but defined in other chapters (referenced by id, not redefined): `string length` and `α′ (alpha-prime)` (01), `Kaluza–Klein tower` (05), `level matching` (04), `Hodge numbers` (06), `D-brane` (07), `string coupling` and `S-duality` (09; Beat 6 links forward to them). Chapter 11 references `mirror symmetry` and `gauge/gravity duality` from here.

---

## Numbers & facts
- **Closed bosonic string on a circle**:
  - `M² = n²/R² + m²R²/α′² + (2/α′)(N + Ñ − 2)` with level matching `N − Ñ = nm` (m = winding). Source: D. Tong, *Lectures on String Theory*, arXiv:0908.0333, §8.2, eqs. (8.5)–(8.6).
  - Invariance under `R ↔ α′/R` with `m ↔ n`: Tong §8.3, eqs. (8.7)–(8.8).
  - Also Polchinski, *String Theory* vol. 1, ch. 8 ("Toroidal compactification and T-duality"), and Zwiebach, *A First Course in String Theory*, 2nd ed. (2009), ch. 17 ("T-duality of closed strings") and ch. 18 ("T-duality of open strings").
  - Level-matching sign conventions, and which of N, Ñ counts left-movers, differ between these books; only |N − Ñ| = |nw| matters. Tong's N counts right-movers (α_n), so his N − Ñ = nm is the same convention as Schwarz's N_R − N_L = mn.
- **Type II superstring on a circle** (the lab's formula):
  - `M² = (m/R)² + (2πRnT)² + 4πT(N_L + N_R)` with `N_R − N_L = mn` and `T = 1/(2πα′)`. **Schwarz's letters are swapped relative to this pack:** his m is the Kaluza–Klein (momentum) number and his n the winding number. Renaming m → n, n → w gives `(n/R)² + (wR/α′)² + (2/α′)(N + Ñ)`. Schwarz writes it for IIB and any (q₁, q₂) string; for the fundamental string T_(1,0) = T, and the same formula holds for IIA.
  - BPS states have N_L = 0 or N_R = 0, and their masses are exact at any coupling.
  - Source: J. H. Schwarz, "Lectures on superstring and M theory dualities", hep-th/9607201, §2.5, eqs. (41)–(42).
- **String tension** `T = 1/(2πα′)`, and **string length** `ℓ_s = √α′`: Tong eqs. (1.17)–(1.18). The value of T or ℓ_s in nature is unknown (Tong §1.2, p. 17: "we don't really know what value T should take").
- **Momentum quantization** `p = n/R` (single-valued wavefunction) and **winding** `X(σ + 2π) = X(σ) + 2πwR`: Tong §8.2.
- **Dilaton shift** under T-duality, `g_s → √α′·g_s/R`: Tong eq. (8.10). Buscher rules: T. Buscher, *Phys. Lett. B* 194, 59 (1987) and *Phys. Lett. B* 201, 466 (1988).
- **Equivalence extends to the full worldsheet CFT, hence to interactions**: Tong §8.3. "T duality, unlike S duality, holds order by order in string perturbation theory": Schwarz hep-th/9607201, §1.1. Review: A. Giveon, M. Porrati, E. Rabinovici, "Target space duality in string theory", *Phys. Rept.* 244, 77 (1994), hep-th/9401139.
- **First observations of R ↔ 1/R duality**: K. Kikkawa and M. Yamasaki, *Phys. Lett. B* 149, 357 (1984); N. Sakai and I. Senda, *Prog. Theor. Phys.* 75, 692 (1986). Both cited as the originals in Giveon–Porrati–Rabinovici. Wikipedia instead credits B. Sathiapalan (1987), https://en.wikipedia.org/wiki/T-duality. The pack names no discoverer on stage.
- **T-duality as a gauge symmetry; SU(2)×SU(2) at the self-dual point**: M. Dine, P. Huet, N. Seiberg, *Nucl. Phys. B* 322, 301 (1989).
- **Enhanced gauge symmetry U(1)×U(1) → SU(2)×SU(2) at R = √α′** in the bosonic string relies on the tachyon, so it doesn't happen in type II. It does occur in the heterotic string. Source: Tong §8.2.3.
- **Two U(1) charges**: momentum is charged under the photon from the metric, winding under the photon from the B-field. Source: Tong §8.2.2.
- **IIA on R = IIB on α′/R; heterotic SO(32) ↔ E₈×E₈** (with Wilson lines): Tong §8.3.3; P. Ginsparg, *Phys. Rev. D* 35, 648 (1987); Dai–Leigh–Polchinski (1989), below.
- **T-duality exchanges Neumann ↔ Dirichlet boundary conditions; this is how D-branes were found**: Tong §8.3.2. J. Dai, R. G. Leigh, J. Polchinski, "New connections between string theories", *Mod. Phys. Lett. A* 4, 2073 (1989). P. Hořava, "Background duality of open-string models", *Phys. Lett. B* 231, 251 (1989). Chapter 07's pack cites the same.
- **"Minimum length" is subtle**:
  - Tong §6.2.3 (p. 138) says it is "roughly true in string theory, although not in any crude simple manner … D-branes are much better probes of sub-stringy physics."
  - M. R. Douglas, D. Kabat, P. Pouliot, S. H. Shenker, "D-branes and short distances in string theory", *Nucl. Phys. B* 485, 85 (1997), hep-th/9608024. D0-branes probe structure down to ~g_s^{1/3} ℓ_s, the 11D Planck length.
  - High-energy string scattering: D. Amati, M. Ciafaloni, G. Veneziano, "Can spacetime be probed below the string size?", *Phys. Lett. B* 216, 41 (1989); D. Gross and P. Mende, *Phys. Lett. B* 197, 129 (1987).
- **Kac 1966**: M. Kac, "Can one hear the shape of a drum?", *Amer. Math. Monthly* 73 (1966) 1–23. The phrase is attributed to Lipman Bers. Source: https://en.wikipedia.org/wiki/Hearing_the_shape_of_a_drum
- **Milnor 1964**: isospectral flat tori in 16 dimensions (same page).
- **Gordon, Webb, Wolpert 1992**: "One cannot hear the shape of a drum", *Bull. Amer. Math. Soc.* 27, 134–138 (1992), and *Invent. Math.* 110, 1–22 (1992). The drums are two polygons made of 7 congruent triangles; they share area and perimeter.
- **Drum vertex coordinates** (unit legs): from C. Moler, "Can one hear the shape of a drum? Part 1", MathWorks blog (2012), https://blogs.mathworks.com/cleve/2012/08/06/can-one-hear-the-shape-of-a-drum-part-1-eigenvalues/. Checked here: both polygons have area 3.5 and perimeter 6 + 3√2 ≈ 10.243.
- **Drum eigenvalues** (for the domain scaled ×2, i.e. legs of 2), first 8 Dirichlet eigenvalues: 2.53794, 3.65551, 5.17556, 6.53756, 7.24808, 9.20929, 10.59699, 11.54140.
  - Source: T. A. Driscoll, "Eigenmodes of isospectral drums", *SIAM Rev.* 39, 1–17 (1997), and P. Amore et al., arXiv:1509.02795, Table 5 (E₁ = 2.53794399979862).
  - Frequency ratios `√(λₖ/λ₁)`: 1.000, 1.200, 1.428, 1.605, 1.690, 1.905, 2.043, 2.132 (√(11.54140/2.53794) = 2.13250, which rounds to 2.132).
  - Scale check: Moler's finite-difference λ₁ for the unit-leg drums (h = 1/32) is 10.166 ≈ 4 × 2.538, which confirms that Driscoll/Amore use legs of 2. Ratios are scale-free either way.
- **Microwave-cavity confirmation**: S. Sridhar and A. Kudrolli, "Experiments on not 'hearing the shape' of drums", *Phys. Rev. Lett.* 72, 2175 (1994). At least 54 low-lying eigenvalues agree to a few parts in 10⁴ (confirmed against the APS abstract page). https://doi.org/10.1103/PhysRevLett.72.2175
- **S-duality**:
  - C. Montonen and D. Olive, "Magnetic monopoles as gauge particles?", *Phys. Lett. B* 72, 117 (1977).
  - A. Sen, *Phys. Lett. B* 329, 217 (1994), hep-th/9402032 (dyon bound states required by SL(2,ℤ)).
  - Type IIB S-duality: C. Hull and P. Townsend, "Unity of superstring dualities", *Nucl. Phys. B* 438, 109 (1995).
  - E. Witten, "String theory dynamics in various dimensions", *Nucl. Phys. B* 443, 85 (1995).
  - Overview: Schwarz hep-th/9607201. Detailed treatment: Chapter 09's pack.
- **Vacuum Maxwell duality** `E → cB, B → −E/c` leaves the source-free Maxwell equations unchanged: standard (J. D. Jackson, *Classical Electrodynamics*, 3rd ed., §6.11).
- **Mirror symmetry**:
  - Dixon; Lerche–Vafa–Warner (late 1980s). B. Greene and R. Plesser, *Nucl. Phys. B* 338, 15 (1990).
  - P. Candelas, X. de la Ossa, P. Green, L. Parkes, *Nucl. Phys. B* 359, 21 (1991).
  - Curve counts on the quintic: 2,875 lines (Schubert, 19th c.), 609,250 conics (Katz 1986), and 317,206,375 twisted cubics (predicted by Candelas et al. 1991). Ellingsrud–Strømme confirmed the cubic count after finding an error in their code.
  - Mirror formula proved by Givental (1996) and Lian–Liu–Yau (1997). Homological mirror symmetry: Kontsevich (ICM 1994). SYZ "Mirror symmetry is T-duality": Strominger, Yau, Zaslow, *Nucl. Phys. B* 479, 243 (1996), hep-th/9606040.
  - Source: https://en.wikipedia.org/wiki/Mirror_symmetry_(string_theory). Tong §8.3.4.
- **Quintic Hodge numbers** h^{1,1} = 1, h^{2,1} = 101 (mirror: 101, 1), Euler characteristic −200: Candelas et al. (1991); standard.
- **Gauge/gravity (AdS/CFT)**:
  - J. Maldacena, "The large N limit of superconformal field theories and supergravity", submitted 27 Nov 1997, hep-th/9711200, *Adv. Theor. Math. Phys.* 2, 231 (1998).
  - Review: O. Aharony, S. Gubser, J. Maldacena, H. Ooguri, Y. Oz, *Phys. Rept.* 323, 183 (2000), hep-th/9905111.
  - The original example: type IIB strings on AdS₅ × S⁵ ↔ 𝒩 = 4 SU(N) super-Yang–Mills in 4D.
- **Our universe is not anti-de Sitter**: its expansion is accelerating (positive dark energy). A. Riess et al., *Astron. J.* 116, 1009 (1998); S. Perlmutter et al., *Astrophys. J.* 517, 565 (1999). ● OBSERVED.
- **Lab numbers** (computed from the formula above; re-derivable with the lab model):
  - At r = 2 the lowest 16 families are listed in the Lab test vector.
  - The 16th level stays ≤ 10 for all r ∈ [0.1, 10]. It equals exactly 10 at r = √(3/2) ≈ 1.2247 and r = √(2/3) ≈ 0.8165 (a 400,001-point scan found no higher value).
  - Index-wise (a, b, S) ↔ (b, a, S) holds at 400 sampled radii (re-checked by the referee on a 401-point u grid, with no mismatches).
  - The test vector matches a brute-force enumeration over all (n, w, N, Ñ) with N − Ñ = nw.
  - Slider default r = 2 exactly (u ≈ 0.650515).
  - Pair 16 falls below 3 only for r > 9.24 (and, mirrored, r < 0.108).

---

## Pitfalls
1. **"A duality means two parallel universes."** The pack says "two descriptions, one physics" (Beat 4). WORLD A and WORLD B are two *readings* of the same bars, which never move when you jump between them (Lab). Beat 6's dictionary is labelled "a dictionary, not a map of where things are."
2. **"T-duality proves space has a minimum length."** Beat 5 makes a narrower claim: a *circle* smaller than √α′ is equivalent to a larger one, *for strings as probes*. The pinned label and Numbers & facts point out that D-branes can resolve shorter distances (Douglas–Kabat–Pouliot–Shenker 1996), and that T-duality says nothing about non-compact directions. The pack never says "nothing can be smaller than the string length."
3. **"It's just a coincidence of masses."** Beat 4 says every interaction matches too. Go deeper gives the coupling shift g → g√α′/R that makes this true and says the equivalence holds for the full worldsheet theory. The drums in Beat 1 carry a label saying that drums share *only* their tones, unlike dual string worlds.
4. **"The drum analogy is how duality works."** It is chipped ~ANALOGY. The drums are distinguishable by looking at them, while dual string worlds are not distinguishable by any measurement. The ● chip covers only the drum theorem and its microwave test.
5. **"A small circle and a big circle are the same, so size is meaningless."** The spectrum does change with R: bars move as you drag. Only the pair R and α′/R agree. At the self-dual radius R = √α′ the two readings have the same size (the self-dual point; unrelated to mirror symmetry).
6. **"T-duality maps every theory to itself."** For the bosonic string it does. For type II superstrings it swaps IIA ↔ IIB. For heterotic strings with a suitable Wilson line on the circle it swaps SO(32) ↔ E₈×E₈. This is stated in Beat 6, the Lab footnote and Go deeper, and it sets up Chapter 09.
7. **"Dualities have been tested experimentally."** No string duality has. The overall status is ◑ DERIVED. S-duality and gauge/gravity wear ◌ CONJECTURED. The only ● in the chapter is the drum fact inside an analogy (plus the Maxwell footnote, which is ordinary electromagnetism).
8. **"All dualities are equally certain."** Each dictionary row in Beat 6 carries its own chip. Mirror symmetry is split: ◑ for constructed pairs and proven mathematical predictions, ◌ in general.
9. **"AdS/CFT shows our universe is a hologram."** The row says "5D anti-de Sitter space" and is chipped ◌. Numbers & facts notes that our universe's accelerating expansion means it is not anti-de Sitter.
10. **"Mirror symmetry is a reflection of space."** The glossary says the name comes from reflected Hodge numbers, (1, 101) ⟷ (101, 1) in Beat 6, not a spatial mirror.
11. **"String theory predicts the string length (e.g. the Planck length)."** No meters are ever shown. `scale()` is null, and the pinned label reads `ℓ_s · SIZE UNKNOWN`.
12. **"Winding is just another kind of motion."** Beat 3 shows that a point can circle but cannot stay wrapped. The lab's point-particle mode shows the duality failing, so the extended string is essential.
13. **The bosonic formula's −2 and its tachyon.** The lab uses the tachyon-free type II formula. Go deeper and the Model say the bosonic version differs only in the vibration term and obeys the same swap. The pack does not borrow the bosonic self-dual SU(2)×SU(2) story for type II, where it doesn't occur.
14. **"The pictures show where the string is."** The spinning coil and circulating loop are labelled cartoons. The wave ring, n whole wavelengths, is marked as the honest part.
15. **"Level matching means equal left and right vibration."** That is true without a circle (Chapter 04). Go deeper and the lab note that on a circle the imbalance must equal n·w.

---

## Handoff
**IN:** H2, matching Chapter 07's final frame: `<HandoffLoop/>` at the origin, camera `HANDOFF.camera`, no view shift. Chapter 07 leaves a brane grid at 10% behind the loop; this chapter dissolves it over its first 15% of opening progress. It then draws the seam and splits the loop into WORLD A and WORLD B. Beat 6's dictionary row 3 pays off Chapter 07's closing card ("D-branes were found through T-duality").

**OUT:** H2: `<HandoffLoop/>` with default props at the origin, camera `HANDOFF.camera`, view shift [0, 0]. The loop is the wound string that slipped off the merged self-dual cylinder, and the cylinder has fully faded by progress 1. An optional faint seam hairline (8%) stays behind, which Chapter 09 can turn into its first duality "bridge" or dissolve. This matches Chapter 09's IN, which expects H2 and would fade any leftover cylinder in its first 10%.

---

## Referee notes

Checked against Tong arXiv:0908.0333 (full text: §§1.2, 6.2.3, 8.2–8.3.4, eqs. 1.17–1.18, 8.4–8.10), Schwarz hep-th/9607201 (§1.1; §2.5, eqs. 41–42), Amore et al. arXiv:1509.02795 (Table 5), Moler's MathWorks post (vertices and unit-leg eigenvalues), the APS abstract of Sridhar–Kudrolli, Wikipedia's T-duality page, the reference list of Giveon–Porrati–Rabinovici, and INSPIRE records for every journal citation in the physics sections. All lab numbers were recomputed from the stated formula, and the family rule was cross-checked by brute force over (n, w, N, Ñ).

**Corrections made**
1. **Lab y-range (major, implementation).** The claim "16th level never exceeds 9.95" was false. The supremum is exactly 10, reached at r = √(3/2), where (0,2,2) and (3,0,2) tie, and at √(2/3). The fixed 0–10 axis would have let the 16th bar touch the frame. The chart axis is now 0–10.5 (ticks to 10), the point-mode clip is at 10.5, and the Model and Numbers & facts have been updated.
2. **Overall status overclaim.** "Its [mirror symmetry's] mathematical predictions have been proved" now reads "several of its mathematical predictions". Genus-0 counts are proved (Givental, Lian–Liu–Yau), but not every prediction. The line "the only ● fact is the drums" ignored the ● Maxwell footnote in Beat 6, so it now names both and says that neither is a test of string theory.
3. **Drum frequency ratio.** √(11.54140/2.53794) = 2.13250 rounds to **2.132**, not 2.133. Fixed in Beat 1 and in Numbers & facts.
4. **Slider default.** u = 0.6505 gives r = 1.99986. At that radius (0,0,2) sorts before (4,0,0), so the screen would not match the r = 2 test vector. The spec now says to initialize r = 2 exactly (u ≈ 0.650515).
5. **Tie robustness.** The spec now says to treat heights within 1e−9 as tied before the (S, max, min, −a) tie-break, so rounding at r versus 1/r cannot swap pairs on "Jump". The tie-break keys are symmetric under a ↔ b apart from −a, and exact ties with equal (S, max, min) occur only at r = 1, so the index-wise duality holds (re-verified on a 401-point grid).
6. **Left/right labels.** The pack called N the left-moving level. In Tong, N counts right-movers (α_n). Tong's N − Ñ = nm and Schwarz's N_R − N_L = mn are therefore the *same* convention. Both are relabelled, and the sign-independence caveat is kept.
7. **Schwarz's letters.** In eqs. (41)–(42), Schwarz's m is momentum and his n is winding, the reverse of this pack. This is now stated so the "this equals" line cannot be misread.
8. **Beat 5 blending conflict.** Additive blending of the curves contradicted the chapter's own rule that amber winding swatches are flat and unlit, and with it VISION's "only strings glow warm". Curves are now flat, and coincidence is shown by a 0.6 s Ink flash of each landed pair.
9. **Mirror symmetry precision.** The dictionary row and glossary now say *type IIA on X = type IIB on X̃* (Tong §8.3.4 frames it in type II). The drawn pair alone implied the same theory on both shapes.
10. **Gauge/gravity wording.** Beat 6 ("equates gravity with a theory without gravity"), Go deeper and the glossary now say that *string theory, which includes (quantum) gravity,* in AdS is equated with a gravity-free boundary theory. Beat 6 is still 44 words.
11. **Heterotic T-duality (Pitfall 6).** SO(32) ↔ E₈×E₈ requires a Wilson line on the circle; without one each heterotic theory is self-dual. Wilson lines were already noted in Numbers & facts but missing from the pitfall.
12. **"Mirror point" → "self-dual point"** in the detent micro-copy and Pitfall 5, to avoid confusion with mirror symmetry in Beat 6.
13. **Pitfall 7 wording.** "None has" is now "No string duality has". Non-string dualities (for example Kramers–Wannier) do have lab realizations.
14. **Citation locations.** Tong's "we don't really know what value T should take" is in §1.2 (p. 17), not §1.1. The "minimum length … D-branes are much better probes" quote is in §6.2.3 (p. 138). Schwarz's "T duality, unlike S duality, holds order by order in string perturbation theory" (§1.1) is added as direct support for the ◑ "every order of perturbation theory" chip.
15. **Spectrum-map truncation.** At r → 10 the chart shows up to 16 momentum bars, but the strip draws only |n|, |w| ≤ 6. The truncation is now flagged in the Model and on Beat 5's pinned label.
16. **Tag window documented.** `A NEW LARGE DIRECTION OPENING` appears only for r > 9.24 (mirror: r < 0.108). This is a narrow reward at the slider's end. The window is recorded so that design can lower the threshold on purpose if wanted.

**Drafter's uncertain claims: verdicts**
- **Type II formula and GSO-shifted levels:** confirmed. Schwarz (41)–(42) is M² = (m/R)² + (2πRnT)² + 4πT(N_L + N_R), N_R − N_L = mn, with no intercept, for levels counted from the massless ground state (light-cone GS counting; in RNS language the NS −½ is absorbed after GSO). The BPS rule (N_L = 0 or N_R = 0, exact at any coupling) is also confirmed.
- **Family rule S ≥ |nw|, S ≡ nw (mod 2):** confirmed. On a plain circle the lattice Γ^{1,1} factorizes from the oscillator/fermion sector, so the GSO projection does not depend on n and w, and every level N ≥ 0 has nonzero degeneracy (16 at N = 0). A brute-force enumeration reproduces the r = 2 test vector exactly.
- **Level-matching sign:** harmless (see correction 6).
- **"Every order of perturbation theory; believed exact" (◑):** correct and now doubly sourced (Tong §8.3, Schwarz §1.1).
- **Attribution:** GPR cites Kikkawa–Yamasaki PLB 149, 357 (1984) and Sakai–Senda PTP 75, 692 (1986) as its refs [194, 247] for R → 1/R. Wikipedia credits Sathiapalan, PRL 58, 1597 (1987). Naming no discoverer on stage is the right call.
- **Drum eigenvalues:** confirmed against Amore Table 5 to all digits quoted. The ×2 leg scaling is confirmed by Moler's unit-leg FD λ₁ = 10.166 and by a Faber–Krahn bound. The vertices match Moler, and the area 3.5 and perimeter 6 + 3√2 were recomputed.
- **Sridhar–Kudrolli "at least 54 eigenvalues, a few parts in 10⁴":** confirmed via the APS abstract.
- **Mirror-symmetry chip split (◑ constructed pairs / ◌ in general):** endorsed. In general it cannot be a theorem as stated, since rigid Calabi–Yaus have no Kähler mirror. The 317,206,375 history (Candelas et al. 1991; Ellingsrud–Strømme's corrected computation; Givental 1996 and Lian–Liu–Yau 1997) is correct.
- **Quintic Hodge numbers (1, 101), χ = −200:** correct (χ = 2(h^{1,1} − h^{2,1})).
- **ACV PLB 216, 41 (1989), Gross–Mende PLB 197, 129 (1987), DKPS NPB 485, 85 (1997) and ℓ₁₁ = g_s^{1/3} ℓ_s:** all confirmed on INSPIRE.
- **Amber winding swatches:** acceptable, because winding is a string-only property and the swatches are flat. Beat 5's additive blending was the one place that broke the rule (correction 8). Keep the Ink fallback.
- **Lab numbers from the drafter's script:** the r = 2 test vector, the r = 0.5 swap, the r = 10 and r = 1 statements, the audio chord (110, 220, 330, 440 ×3 Hz) and the ~10³ candidate count (953) are all confirmed. The 9.95 bound and the u default were wrong (corrections 1 and 4).

**Also verified, no change needed:** Tong eqs. (8.5)–(8.10) and §§8.2.2, 8.2.3, 8.3.2 and 8.3.3 as cited. Buscher PLB 194, 59 and 201, 466; Dine–Huet–Seiberg NPB 322, 301; Ginsparg PRD 35, 648; Dai–Leigh–Polchinski MPLA 4, 2073; Hořava PLB 231, 251; Montonen–Olive PLB 72, 117; Sen PLB 329, 217; Hull–Townsend NPB 438, 109; Witten NPB 443, 85; SYZ NPB 479, 243; Greene–Plesser NPB 338, 15; Candelas et al. NPB 359, 21; Maldacena ATMP 2, 231 (hep-th/9711200, Nov 1997); AGMOO Phys. Rept. 323, 183; GPR Phys. Rept. 244, 77. Winding energy (2πwR·T = wR/α′), the dilaton shift g_s → g_s√α′/R, the BPS mass |n|/R + |w|R/α′, the absence of SU(2)² enhancement in type II, and the Maxwell vacuum duality E → B, B → −E (c = 1). All beat texts are ≤ 45 words (max 44) and all micro-copy is ≤ 20 words. No misconception from the referee checklist is present: the pack never claims confirmation, never gives ℓ_s in meters, treats minimum length and AdS carefully, and chips every cartoon.

## Editor notes (cross-chapter pass, 2026-09-28)

1. **α′ is not re-explained.** Beat 4's "(α′ fixes the string's tension)" is now "([[α′]], string theory's one scale)". It points to the single definition in Chapter 1, which sets both the tension and the string length √α′. Beat 5's "√α′, the string length" is then a consistent reminder, not a second definition. Same word count.
2. **Jargon before introduction.** Beat 6's "strong and weak coupling" came a chapter before `string coupling` is defined. It is now a forward glossary link, "strong and weak [[string coupling]]" (45 words).
3. **Terminology bridge.** `momentum mode` is Chapter 5's Kaluza–Klein rung seen as a string state. The glossary now says so, and Beat 2 already says "as in Chapter 5".
4. **Glossary homes.** `mirror symmetry` and `gauge/gravity duality` (alias AdS/CFT) are defined here, where they first appear in a beat. Chapter 11 references them instead of redefining them. `mirror symmetry` was trimmed to 28 words; the old version had 37.
5. **Glossary length.** `momentum mode` trimmed to the 30-word limit (ARCHITECTURE §3) without changing its claims.
