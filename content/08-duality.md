# 08 · Duality — Can two different worlds be the same?

**Thesis:** A string on a circle of radius R and a string on a circle of radius α′/R give identical physics, because the string's two ways of carrying energy around the circle, moving and wrapping, trade places exactly; string theory is full of such dualities, where one physics has two descriptions that look nothing alike.

**Overall status:** ◑ `DERIVED`. T-duality follows from string theory's equations: it holds at every order of string perturbation theory and is believed exact. It has never been tested in nature, because no extra dimension or string has been observed. The other dualities previewed at the end (S-duality, gauge/gravity) are ◌ `CONJECTURED` with strong evidence. Mirror symmetry is established for many constructed pairs, and its mathematical predictions have been proved. The only ● `OBSERVED` fact in the chapter belongs to the opening analogy (isospectral drums). Every picture of a hidden circle is ~ `ANALOGY`.

---

## Storyboard

**Global stage conventions (all beats).** 1 world unit ≈ 1/6 of the viewport height at the default camera (perspective, fov 35°, camera at `z = 8` looking at the origin). **The Thread** (strings only) is a filament tube with core `#FFF6E8`, halo `#FFC98A` and additive bloom. **Hidden-circle geometry** (cylinders, rings, axes, plots) is Field `#86A8D8` hairline. **Point particles** are Ink `#ECE6D9`.

**Chapter color code.** Use it everywhere, in beats, lab and Go deeper:
- momentum energy: Field blue `#86A8D8`, because it is motion *through* the geometry;
- winding energy: Filament amber `#FFC98A` at 80% opacity, flat fill with no bloom, because only strings can wind;
- vibration energy: Ink-2 grey `#9AA0AE`.

This departs from Chapter 05, which drew its Kaluza–Klein wave in Ink. Here the wave must be Field so that "momentum" has one color throughout the chapter.

**Units shown on stage.** Radii are in **string lengths** ℓ_s = √α′, and masses are in string units 1/ℓ_s (with ħ = c = 1). The real value of ℓ_s is unknown, so no meters are ever shown. The left-edge scale gauge reads `ℓ_s · VALUE IN METERS UNKNOWN` for the whole chapter, plus the live R where noted. Every ~ANALOGY chip is a small mono label pinned bottom-left of the frame.

**Scroll map** (chapter `progress`): Opening 0.00–0.08 · B1 0.08–0.22 · B2 0.22–0.34 · B3 0.34–0.48 · **B4 (aha) 0.48–0.66** · B5 0.66–0.78 · B6 0.78–0.88 · Lab 0.88–0.97 · Outro/handoff 0.97–1.00. "Local p" below means progress re-mapped to 0–1 within a beat.

### Opening: *handoff IN*
- **Text:** Two descriptions of a world can look nothing alike, and still predict exactly the same result for every possible experiment. Physicists call such a pair a [[duality]]. String theory is full of them.
- **Status:** ◑ DERIVED
- **Stage:** **First frame = H2**, matching Chapter 07's closing closed string: one closed Thread loop (radius 1.0), centered, facing the camera, gently wobbling.
  - **Local p 0 → 0.35:** a vertical Field hairline, the **seam**, draws itself from the top of the frame to the bottom through x = 0, behind the loop (1 px, 40% opacity).
  - **0.35 → 0.7:** the loop splits into two identical copies that slide apart to x = −2.4 and x = +2.4 (ease-in-out). They keep wobbling **in phase**, identical to the last detail. Mono labels fade in above them: `WORLD A` and `WORLD B`.
  - **0.7 → 1.0:** the two worlds are made to look different. Behind A, a large dashed Field circle (radius 2.0, 25% opacity) fades in. Behind B, a tiny one (radius 0.25). On the seam, between them, a mono glyph appears: `= ?`
  - Camera still. Scale gauge: `—`.

### Beat 1: Can you hear the shape of a drum?
- **Text:** In 1966 Mark Kac asked: can one hear the shape of a drum? In 1992 three mathematicians answered no. Two differently shaped drums can ring with exactly the same set of tones: the same [[spectrum]]. For a string, the "tones" are particle masses.
- **Status:** ~ ANALOGY (drums stand in for string worlds) + ● OBSERVED (isospectral drums are a theorem, and microwave-cavity experiments confirmed it in 1994)
- **Stage:**
  - **Local p 0 → 0.2 (unfold):** each loop unfolds into a drum outline. Resample the loop to 256 arc-length points and lerp them onto the polygon perimeter. Use the Gordon–Webb–Wolpert pair:
    - Drum A vertices: `(0,0) (0,1) (2,3) (2,2) (3,2) (2,1) (1,1) (1,0)`.
    - Drum B vertices: `(1,0) (0,1) (0,2) (2,2) (2,3) (3,2) (2,1) (1,1)`.
    - Center each drum on its centroid and scale it to 0.9 world units per coordinate unit. Drum A sits left of the seam, Drum B right.
    - Draw the drumheads as a Field fill at 8% with a 1.5 px Field outline. The drums are not strings, so no filament.
  - **0.2 → 0.35 (same pieces):** inside each drum the seven internal triangle edges flash as hairlines (40% opacity, then fade). Label: `SAME 7 TRIANGLES · REARRANGED · SAME AREA · SAME PERIMETER`.
  - **0.35 → 0.9 (the tones):** under each drum, a row of 8 vertical bars grows, **one pair at a time**. Bar height ∝ frequency ∝ √λₖ, using the ratios `1.000, 1.200, 1.428, 1.605, 1.690, 1.905, 2.043, 2.133` (see Numbers & facts). Tallest bar 1.2 units.
    - As pair k lights, a horizontal Ink hairline joins the two bars across the seam. It is perfectly level, because the heights are equal.
    - At the same moment both drums ripple in mode k for 1.5 s: amplitude 0.08 units, exponential decay. The displacement comes from **precomputed eigenmode heightfields**: the first 8 Dirichlet modes of each polygon, solved offline (e.g. FEM) and shipped as 64×64 R16F textures, about 64 KB total.
    - Fallback when the textures are absent: a radial ripple from the centroid, labelled `~ cartoon ripple`.
  - Readout: `8 / 8 TONES MATCH · SHAPES DIFFER`.
  - **0.9 → 1.0:** pinned labels appear: `~ ANALOGY · drums share only their tones. Dual string worlds share every measurable quantity.` and `● proved 1992 · measured in microwave cavities 1994`.
  - Scale gauge: `—`.
  - Audio (muted by default): pair k plays `f = 220·√(λₖ/λ₁)` Hz, panned left and right. The two sides are identical in pitch.

### Beat 2: Moving around the circle
- **Text:** Curl one direction into a circle of radius R, as in Chapter 5. A closed string can travel around it, but its quantum wave must fit: n whole wavelengths. This [[momentum mode]] costs energy n/R: cheap when the circle is big.
- **Status:** ◑ DERIVED (+ ~ ANALOGY for the cylinder picture)
- **Stage:**
  - **Transition:** the drums fade. The seam slides to the right edge and dims to 10%.
  - **The cylinder:** a horizontal cylinder appears, 5 units long along x.
    - Visual radius `ρ = 0.9·√(R/ℓ_s)`, starting at R = 1 ℓ_s (ρ = 0.9).
    - Field wireframe: 24 longitudinal hairlines at 20% and rings every 0.5 units at 15%.
    - Camera: yaw 28°, pitch 14°, distance 8.
    - Labels: `x · A LARGE DIRECTION` along the axis. An arc on the end ring reads `AROUND · HIDDEN CIRCLE · RADIUS R`.
    - Pinned: `~ ANALOGY · the surface is the space; "around" is one hidden direction. Not to scale.`
  - **The string:** the Thread appears as a small closed loop (radius 0.16) lying on the surface at x = 0. It circulates around the circle at angular speed 0.6·n rad/s.
  - **The wave:** a Field wave ring encircles the cylinder at x = −0.8, with `r(θ) = ρ·[1 + 0.06·cos(nθ − 1.2t)]`. Its n steps through 1 → 2 → 3 at local p 0.15, 0.35 and 0.55, with a brief lock flash each time, echoing Chapter 05's fit.
  - **The ladder:** a vertical ladder stands at screen-right (x = +3.4), labelled `MOMENTUM ENERGY · n/R`. Its Field rungs sit at `y = 0.8·n/R` world units for n = 1…6, clipped at 4 units.
  - **Local p 0.6 → 1.0:** R grows 1 → 3 ℓ_s (ρ 0.9 → 1.56) while the camera dollies back to keep the framing. The rungs compress toward the base. Readout: `R ↑ · MOMENTUM RUNGS ↓ · CHEAP ON BIG CIRCLES`.
  - Scale gauge: `R = 1.00 → 3.00 ℓ_s`.

### Beat 3: Wrapping around the circle
- **Text:** Only a string can also wrap around the circle, like a rubber band on a pole. Its [[winding number]] w counts the wraps. Stretching costs energy, tension times length, so winding energy grows with R: cheap on small circles. A point particle cannot wind.
- **Status:** ◑ DERIVED (+ ~ ANALOGY: rubber band, cylinder)
- **Stage:**
  - **0 → 0.3 (wrapping):** we are on the same cylinder, R = 3. The small loop stretches and wraps once around the circumference, a ring hugging the surface at x = 0. Filament brightness rises ∝ its length, because tension × length is energy.
  - **At 0.3, a second wrap:** the ring becomes a w = 2 coil, drawn as a closed curve `σ ∈ [0, 2π)`, `θ = 2σ`, `x = 0.22·sin σ`, so the two laps don't overlap.
  - **Second ladder:** a new ladder rises beside the first, with filament-amber rungs at `y = 0.8·w·R` (w = 1…4, clipped at 4 units), labelled `WINDING ENERGY · wR/α′`. At R = 3 only the first rung (y = 2.4) is in frame: expensive.
  - **0.3 → 0.45 (the point can't):** an Ink point particle sits on the surface and slides once around the circle, leaving a short Ink trail. When it gets back to its start the trail fades. Nothing stays wrapped. Label: `A POINT CAN CIRCLE, NOT STAY WRAPPED · NO WINDING ENERGY`.
  - **0.5 → 1.0 (shrink):** R shrinks 3 → 1/3 ℓ_s (ρ 1.56 → 0.52), on a log path in R, while the camera dollies in.
    - The winding rungs fall and crowd together (spacing ∝ R).
    - The momentum rungs spread upward and out of frame (spacing ∝ 1/R).
    - The coil stays wrapped and dims as it shortens.
    - Readout: `R ↓ · WINDING RUNGS ↓ · CHEAP ON SMALL CIRCLES`.
  - Pinned: `~ ANALOGY · a real string has no thickness, and no pole is inside.`
  - Scale gauge: `R = 3.00 → 0.33 ℓ_s`.

### Beat 4: Two worlds, one spectrum (*the aha*)
- **Text:** Compare two worlds: one with circle R, one with circle α′/R (α′ fixes the string's tension). Each momentum rung in one sits exactly on a winding rung in the other. Every mass matches; so does every interaction. Two descriptions, one physics: [[T-duality]].
- **Status:** ◑ DERIVED (holds at every order of string perturbation theory; believed exact) + ~ ANALOGY (drawings)
- **Stage:** This is the chapter's signature moment. It runs in four phases.
  1. **Recognition (local p 0.00–0.20).** The small cylinder from Beat 3 (R = 1/3) slides right of the re-brightened seam and becomes **WORLD B**. On the left, a big cylinder (R = 3, ρ = 1.56) fades in as **WORLD A**.
     - Both cylinders use `ρ = 0.9·√(R/ℓ_s)` and a 3.2-unit length.
     - Each world has its own ladder on its outer edge. The ladders show the **lowest 8 state families** from the Lab model (same function, same sort), with rungs at `y = 0.8·M` world units.
     - Each rung is a 0.9-unit bar split left to right into three colored lengths, proportional to the momentum, winding and vibration shares of M².
     - WORLD A's rungs are mostly blue. WORLD B's are mostly amber.
     - A tag appears: `WAIT: THESE HEIGHTS AGAIN?`
  2. **The match (0.20–0.35).** Eight Ink hairlines draw across the seam, rung to rung, all **perfectly level**. Counter: `MATCH 8 / 8`.
     - The selected rung cycles through the lowest four every 1.5 s. WORLD A shows it as its reading (a wavelengths, b windings). WORLD B shows the swapped reading (b wavelengths, a windings), using the Lab picture model.
     - For the lowest rung: A shows a one-wavelength Field wave on the big cylinder, and B shows a string **wound once** around the small one.
  3. **The morph (0.35–0.80).** `R_A` travels 3 → 1/3 on a log path, and `R_B = α′/R_A` always, so R_B travels 1/3 → 3.
     - The cylinders change size in opposite directions. At local p 0.575 they pass through the same size, the self-dual radius. There both worlds look identical and the seam flashes once.
     - The rungs move as R changes, but **the eight connecting hairlines stay level the whole way**: the two ladders are locked together.
     - In A the rung colors drain from blue to amber; in B from amber to blue.
     - Readouts: `R_A × R_B = α′ · ALWAYS` and `MATCH 8 / 8`, never dropping.
     - By the end, each world looks exactly as the other did at the start.
  4. **Landing (0.80–1.00).** Both ladders slide to the center and overlay into **one ladder**, with no doubled edge anywhere: the rung geometries coincide exactly (see the Lab stacking rule). Each merged rung is half blue, half amber, split down the middle.
     - Large caption (Bodoni Moda, italic): **"Two pictures. One spectrum."**
     - Beneath it, in mono: `R ⟷ α′/R · n ⟷ w`.
     - Pinned: `~ ANALOGY · circles drawn ∝ √R, not to scale.`
  - Scale gauge: `R_A 3.00 → 0.33 · R_B 0.33 → 3.00 ℓ_s`.
  - Reduced motion: skip the morph. Cross-fade the start and end states and keep the hairlines on screen.

### Beat 5: The smallest circle
- **Text:** Shrink the circle below √α′, the [[string length]], and nothing new appears. The physics retraces that of ever-larger circles, with winding and momentum trading roles. For strings, a circle smaller than the string length is just a larger circle, described differently.
- **Status:** ◑ DERIVED (a statement about circles probed by strings; see Pitfalls on "minimum length")
- **Stage:**
  - **Setup:** the two worlds shrink into the top corners (scale 0.35). At center a 2D plot is drawn in Field hairline, 6 × 3.5 units:
    - x-axis: log R from 0.1 to 10 ℓ_s, with decade ticks labelled `0.1`, `1 = √α′`, `10`.
    - y-axis: `MASS²` from 0 to 10 string units.
    - Curves: every family curve from the Lab's "spectrum map" (see Model). Momentum-type curves fall from left to right (Field). Winding-type curves rise (amber). Pure vibration curves are flat (grey).
    - A vertical dashed line at x = 0 is labelled `SELF-DUAL · R = √α′`.
  - **0.15 → 0.6 (the fold):** the left half of the plot (R < √α′) is a separate mesh. It rotates 180° about the dashed line like a turning page, over the scroll range.
    - Draw the curves with additive blending, so coincident curves glow brighter.
    - When the fold lands, **every left-half curve lands exactly on a right-half curve**, and the whole plot brightens uniformly.
    - Label: `FOLDED AT √α′ · EVERY CURVE LANDS ON A CURVE`.
  - **0.6 → 1.0 (the bounce):** a small cylinder at the bottom of the frame shrinks continuously, R = 3 → 0.1 ℓ_s. Two mono readouts sit side by side:
    - `RADIUS YOU SET: 3.00 → 0.10`
    - `EQUIVALENT LARGE CIRCLE: max(R, α′/R) = 3.00 → 1.00 → 10.0`
    - The second readout bottoms out at 1.00 as R passes √α′ and **climbs again**. Its needle visibly bounces off the dashed line.
  - Pinned labels: `◑ with strings as probes. D-branes can resolve shorter distances (Go deeper).` and `~ plot schematic; families grouped.`
  - Scale gauge: `ℓ_s = √α′ · VALUE IN METERS UNKNOWN`.

### Beat 6: A web of dualities
- **Text:** T-duality is the simplest of many. It even turns one superstring theory (IIA) into another (IIB). [[S-duality]] swaps strong and weak coupling. Mirror symmetry pairs different Calabi–Yau shapes. Gauge/gravity duality equates gravity with a theory without gravity. Several remain conjectures, strongly supported.
- **Status:** ◑ DERIVED (T-duality, IIA ↔ IIB) · ◌ CONJECTURED (S-duality, gauge/gravity) · mirror symmetry: ◑ for constructed pairs, ◌ in general
- **Stage:**
  - **The dictionary:** the plot folds away and a two-column **dictionary** builds in depth. Each row is a thin glass strip, 5.2 × 0.5 units, 1 px Field border; rows are 0.2 units apart, tilted 8° toward the camera. The columns are headed `DESCRIPTION A` and `DESCRIPTION B`, with a `=` on the seam. Each row carries its own status chip at the right edge. Rows arrive one per ~1/6 of local p:

    | # | Description A | Description B | Chip |
    |---|---|---|---|
    | 1 | `circle of radius R` | `circle of radius α′/R` | ◑ |
    | 2 | `momentum n` | `winding w` | ◑ |
    | 3 | `type IIA on a circle` | `type IIB on the dual circle` | ◑ |
    | 4 | `coupling g (strong)` | `coupling 1/g (weak)` | ◌ S-duality |
    | 5 | `Calabi–Yau X` | `its mirror X̃` | ◑/◌ |
    | 6 | `strings + gravity in 5D anti-de Sitter space (× a 5-sphere)` | `a gauge theory without gravity on its 4D boundary` | ◌ Maldacena 1997 |

  - **Row glyphs:**
    - Row 4 (S-duality): two small dials, one turning up from `g = 0.1` while its mirror turns down from `10`. Footnote: `● a cousin: Maxwell's equations in empty space are unchanged by E → B, B → −E`.
    - Row 5 (mirror symmetry): two tangled glyphs from Chapter 06 swap a pair of numbers: `(1, 101) ⟷ (101, 1)`, the quintic's Hodge numbers.
    - Row 6 (gauge/gravity): a translucent Field cylinder whose curved **surface** glows faintly. The interior stands for gravity, the boundary for the gauge theory. Label: `~ schematic`.
  - Pinned: `~ ANALOGY · a dictionary, not a map of where things are.`
  - Scale gauge: `—`.

### Lab dock (0.88–0.97) and Outro (0.97–1.00): *handoff OUT*
- **Lab dock:** the dictionary slides away. The two worlds return from the corners at R_A = 2, R_B = 0.5 (the lab default), and the instrument panel docks.
- **Outro (no text):**
  - Both worlds glide to the seam, set to the self-dual radius, where they are identical. They merge into a single cylinder.
  - The wound Thread slips off the end of the cylinder, unwinding into a free closed loop that drifts to the center at canonical size. The cylinder fades.
  - **Final frame = H2:** one closed Thread loop centered, facing the camera, gently wobbling. The seam hairline may remain at 8% opacity, for Chapter 09 to turn into its first "bridge" between theories, or be dissolved.

---

## Lab

**Title: The Circle Swap.** One instrument panel sits over the stage.
- **Top:** two picture windows, `WORLD A · RADIUS R` and `WORLD B · RADIUS α′/R`.
- **Middle:** the mass formula with live term highlighting, above a stacked bar chart of the lightest 16 state families.
- **Bottom:** a log radius slider whose track shows the "spectrum map".

**Purpose:** Discover that a string's list of masses at radius R is identical to the list at α′/R, because momentum and winding trade places, and that a point particle has no such symmetry.

### Controls

| Control | Type · range | Default | Units |
|---|---|---|---|
| `Circle radius R` | log slider, 0.10 – 10.0, soft detent at 1.00 (±0.02 in log₁₀) | **2.00** | string lengths ℓ_s = √α′ |
| `Jump to the dual world` | button (0.9 s transition) | — | — |
| `Pick a state` | tap a bar (or ←/→ keys when the chart has focus) | bar 1 | — |
| `Overlay the dual spectrum` | toggle | off | — |
| `What lives on the circle?` | segmented: `String` / `Point particle` | String | — |

Keyboard: slider arrows step log₁₀R by 0.01, and Shift steps by 0.1. A ghost thumb (hollow, dashed) always sits at the mirror position `α′/R` on the same track.

### What changes on screen
- **Picture windows.** WORLD A draws a cylinder of radius R and WORLD B one of radius α′/R, both not to scale. Each shows the **selected family** (a, b, S) in its own reading:
  - A shows **a** momentum wavelengths and **b** windings.
  - B shows **b** wavelengths and **a** windings.
  - Dragging R through 1 morphs A into what B showed and vice versa; at R = 1 the windows are identical.
  - Point-particle mode: both windows show an Ink point on its circle with its wave. There is no coil, because points can't wind.
- **Formula.** `M² = (n/R)² + (wR/α′)² + (2/α′)(N + Ñ)` with `N − Ñ = nw` beneath. Each of the three terms is tinted in its chapter color. The **dominant term** for the selected bar is underlined and at full opacity. Live values appear under each term.
- **Bar chart.** 16 bars sorted by mass², with a fixed y-axis of 0–10 string units.
  - Segments: blue for momentum, amber for winding, grey for vibration.
  - Under each bar, mono labels read `n·w`, e.g. `1·0`.
  - As R grows, the blue bars sink and crowd together. The mono tag `A NEW LARGE DIRECTION OPENING` appears when bar 16 falls below 3.
  - As R shrinks, the amber bars do the same and the tag reads `THE DUAL DIRECTION OPENING`.
  - Grey (pure vibration) bars never move.
- **Jump to the dual world.** R ← α′/R. The two picture windows swap contents with a crossing slide. **Bars do not move by a single pixel**: only their blue and amber segments exchange colors, and their `n·w` labels flip to `w·n`.
- **Overlay.** Hollow Ink outlines show the spectrum at α′/R. For strings they coincide exactly with the bars, and the readout says `MATCH 16 / 16`. In point mode they don't, and the readout usually shows `MATCH 0 / 16`.
- **Spectrum map** (strip above the slider, 80 px tall). The family curves over log R, with a live cursor at R and a dashed ghost cursor at α′/R. The strip is visibly mirror-symmetric about the `√α′` tick.
- **Readouts:** `R = 2.00 ℓ_s · α′/R = 0.50 ℓ_s` · `SELECTED: n = 1 · w = 0 · N+Ñ = 0` · `M = 0.500 string units` · `DUAL READING: n = 0 · w = 1` · `MATCH 16 / 16` (only while the overlay is on).

### Model (what the engineer implements)

**Physics chosen.** The closed **type II superstring** with one direction on a circle, at weak coupling (tree-level spectrum). This choice has no tachyon and fits the 10-dimensional superstring of Chapter 05.

The formula is from Schwarz 1996, eq. (41)–(42), and matches Tong §8 for the momentum and winding terms:

`M² = (n/R)² + (wR/α′)² + (2/α′)(N + Ñ)`, with `N − Ñ = nw` (sign conventions differ between textbooks; only |N − Ñ| = |nw| matters here).

- n, w ∈ ℤ are the momentum and winding numbers. N, Ñ ∈ {0, 1, 2, …} are the left- and right-moving vibration levels, counted from the massless ground state after the GSO projection.
- The bosonic-string version replaces (N + Ñ) with (N + Ñ − 2). It is not used because it has tachyons (M² < 0), which a bar chart can't show honestly. The duality works identically in both.
- **Faithful:** every bar height is an exact tree-level mass². States with N = 0 or Ñ = 0 are BPS, and their masses are exact at any coupling. For these, `M = |n|/R + |w|R/α′`.

**Units and slider.** Set ħ = c = 1 and ℓ_s = √α′ = 1. Then `r = R/ℓ_s`, and the plotted quantity is `y = α′M²`, which is dimensionless.
- Slider `u ∈ [0, 1]`: `r = 10^(2u − 1)`. The default r = 2 is at `u = 0.6505`.
- Detent: if `|log₁₀ r| < 0.02`, snap to r = 1.

**String families.** A bar is a **family** `(a, b, S)` with `a = |n|`, `b = |w|` and `S = N + Ñ`. The signs of n and w, and all spin and polarization states, are grouped into one bar; say so in the tooltip.
- Allowed: `a, b, S ≥ 0`, `S ≥ a·b`, `S ≡ a·b (mod 2)`, and not `(0, 0, 0)`. The excluded state is the massless floor (graviton and partners), drawn as the baseline and labelled `MASSLESS · GRAVITON & PARTNERS`.
- Segments: `mom = a²/r²`, `wind = b²·r²`, `vib = 2S`, and height `y = mom + wind + vib`.
- Enumerate `a, b ∈ [0, 60]` with `a·b ≤ 12` and `S ∈ [a·b, 12]`. That is about 10⁴ candidates, recomputed only on slider input.
- Sort by `y`, with ties broken by `(S, max(a,b), min(a,b), −a)`. Keep the lowest 16.
- These bounds are sufficient over the whole slider range: the 16th level never exceeds y = 9.95, checked numerically. Hence the fixed y-axis of 0–10.
- **Stacking rule, so a jump changes colors only:** stack vibration at the bottom, then the **smaller** of (mom, wind), then the larger. Under r → 1/r, mom and wind exchange values, so the geometry is identical and only the colors swap.
- **Duality check (unit test):** for any r ≠ 1, bar i at r is `(a, b, S)` if and only if bar i at 1/r is `(b, a, S)`, and the heights agree to 1e−9. Verified numerically at 400 radii. At r = 1 exactly, tied pairs `(a, b, S)` and `(b, a, S)` may swap order, which is invisible.

**Point-particle mode.** Families `a = 1, 2, …` with `y = a²/r²`. There is no winding and no vibration: a point has neither. Keep the lowest 16. The dual overlay uses `a²·r²`. Bars above 10 are clipped with a small `↑` and the tag `OFF SCALE: TOO HEAVY`. Match readout: count the i with `|y_i(r) − y_i(1/r)| < 1e−9`. It is 16 only at r = 1.

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

At r = 0.5 the heights are identical, with n and w swapped in every row. At r = 10 the bars are `(k, 0, 0)` with y = k²/100 for k = 1…16: a near-continuum. At r = 1 the lowest are `(1,0,0)` and `(0,1,0)` at y = 1. There are no extra massless states at r = 1 in type II; that enhancement happens for bosonic and heterotic strings only (Go deeper).

**Formula highlighting.** For the selected bar, `share_k = term_k / y`. Term opacity is `0.35 + 0.65·share_k`, and the largest share gets an underline in its color. Live values are shown to 3 significant figures.

**Picture model (cartoon, labelled ~ANALOGY):**
- **Cylinder.** Axis along x, length 3.2 units, visual radius `ρ(r) = 0.8·√r`, clamped to [0.25, 2.53]. Field wireframe as in Beat 2. Each window has a fixed camera: yaw 25°, pitch 12°, framing ±3 units.
- **Winding coil** (b ≥ 1). A closed curve with `σ ∈ [0, 2π)`: `θ = b·σ + φ(t)`, `x = h·sin σ` where `h = 0.10 + 0.06·b`, and radius `ρ + 0.02`. `φ(t) = 0.6·a·t` is a slow rigid spin standing in for momentum (cartoon). Filament, 2 px, bloom.
- **Unwound string** (b = 0). A loop of radius 0.16 tangent to the surface at angle `θ₀ = 0.6·a·t`. It circulates if a > 0 and sits still if a = 0.
- **Momentum wave ring** (a ≥ 1). At `x = −0.9`: `r(θ) = ρ·[1 + 0.06·cos(aθ − 1.2t)]`, Field, 1.5 px. When a = 0, draw a plain ring at 25%.
- **Vibration** (S > 0). Add a normal displacement to the Thread curve, `0.03·√S·sin(kσ − 2t)` with `k = 2 + (S mod 4)`. Label: `~ vibration drawn schematically`.
- **Point mode.** An Ink point (6 px, soft glow) at `θ₀ = 0.6·a·t`, plus its wave ring.
- The spinning coil and circulating loop are cartoons. A state with definite n has no definite position around the circle; the wave ring is the honest part. Label: `~ ANALOGY · the wave is the honest part: n whole wavelengths.`

**Spectrum map (slider track).**
- x = log₁₀ r ∈ [−1, 1], y ∈ [0, 10].
- Draw every family with `a, b ≤ 6` and `S ∈ {ab, ab + 2, ab + 4}` as a polyline of 200 samples. Clip at y = 10.
- Color each segment by its locally dominant term: blue if `a²/r² > b²r²`, amber if the reverse, grey for `a = b = 0`.
- Cursor: solid Ink at log₁₀ r. Ghost: dashed at −log₁₀ r. A tick at 0 is labelled `√α′`.
- The strip is exactly mirror-symmetric about x = 0 (as a set of curves). This is the same figure Beat 5 folds.

**Simplifications to flag in the UI footnote:**
- Only one circle is compact; the other 8 space directions are flat and large.
- There is no B-field or Wilson line on the circle.
- Families group signs, spins and fermions.
- Tree-level masses only, except BPS states, which are exact.
- The dilaton shift (g → g√α′/R) needed for interactions to match is not visualized (Go deeper).
- Circles are drawn ∝ √R.
- ℓ_s in meters is unknown and never shown.
- For type II, WORLD B is strictly the partner theory (IIA ↔ IIB). Masses are unaffected.

**Reduced motion.** Freeze φ(t), the wave phase and the vibration at t = 0. Jump transitions become 150 ms cross-fades.

### Micro-copy (≤ 20 words each)
- Panel header: "Set the circle's size. The chart shows the sixteen lightest string states."
- R slider: "Circle radius R, in string lengths. Drag it through √α′."
- Ghost thumb: "α′/R: the dual circle. Same spectrum, other description."
- Detent at 1: "R = √α′: both descriptions have the same size. The mirror point."
- Jump button: "Jump to the dual world"
- After a jump: "Relabelled, not changed. Every bar kept its height; momentum and winding swapped colors."
- Overlay on (string): "Dual spectrum overlaid: all sixteen bars coincide."
- Point mode: "A point can't wind. Its spectra at R and α′/R disagree: it can tell big from small."
- Formula caption: "Momentum (blue) + winding (amber) + vibration (grey). The swap trades the first two."
- Level matching: "N − Ñ = nw: a string that both moves and wraps must also vibrate."
- Large R: "Blue bars crowd together: a new large direction opening up."
- Small R: "Amber bars crowd together: the dual large direction opening up."
- Grey bars: "Pure vibration: indifferent to the circle's size."
- Superstring note: "For superstrings the dual world is the partner theory, IIA ↔ IIB. Masses match exactly."
- Bar tooltip: "n = 1 · w = 0 · N+Ñ = 0 · M = 0.50 · signs and spins grouped"
- Scale caveat: "~ Circles drawn ∝ √R. The string length in meters is unknown."
- Axis: "MASS² · STRING UNITS"

### Audio (optional, muted by default)
The spectrum plays as a chord. Each of the lowest 6 bars sounds `f = 220 Hz × M` (M in string units), faithful to E = hν up to scale. Drop any tone outside 55–1760 Hz. At r = 2 this gives 110, 220, 330, 440, … Hz. **On "Jump to the dual world" the chord does not change by a single cent.** You cannot hear the difference, which echoes Beat 1's drums. In point mode the jump audibly changes the chord.

---

## Go deeper

**The mass formula.** Curl one direction into a circle of radius R. With ħ = c = 1, a closed superstring then has

$$M^2 = \underbrace{\left(\frac{n}{R}\right)^2}_{\text{momentum}} + \underbrace{\left(\frac{wR}{\alpha'}\right)^2}_{\text{winding}} + \underbrace{\frac{2}{\alpha'}\left(N+\tilde N\right)}_{\text{vibration}}, \qquad N-\tilde N = nw$$

- **Momentum (blue):** n whole wavelengths fit around the circle, so the momentum is n/R.
- **Winding (amber):** a string wrapped w times has length 2πwR and tension T = 1/(2πα′), so it costs wR/α′.
- **Vibration (grey):** N and Ñ count the left- and right-moving waves on the string (Chapter 2).
- **Level matching**, N − Ñ = nw: a string that both moves and wraps must also vibrate. For the lightest state of each (n, w), M = |n|/R + |w|R/α′.

**The swap.**

$$R \;\to\; \frac{\alpha'}{R}, \qquad n \leftrightarrow w, \qquad g_s \;\to\; g_s\,\frac{\sqrt{\alpha'}}{R}$$

The first two terms trade places and the third doesn't care. Momentum and winding are each conserved charges, carried by two different force fields, and the swap exchanges those too. The coupling shift keeps interactions identical. Because the string's worldsheet theories at R and α′/R are equivalent, the match holds at every order of string perturbation theory.

For superstrings the dual world is the partner theory: type IIA on radius R equals type IIB on α′/R. The bosonic string's formula carries (N + Ñ − 2); it swaps the same way. Applied to open strings, T-duality turns free ends into ends fixed on a surface, which is how D-branes were found in 1989.

**Other dualities.** S-duality (◌) maps coupling g to 1/g. Mirror symmetry pairs different Calabi–Yau shapes; it predicted 317,206,375 twisted cubic curves on the quintic, a count later proved. Gauge/gravity duality (Maldacena 1997, ◌) equates gravity in anti-de Sitter space with a gauge theory on its boundary.

---

## Glossary
- `duality` — Two descriptions that look different but predict identical results for every possible measurement, linked by a precise dictionary that translates each quantity of one into the other.
- `spectrum` — The complete list of allowed frequencies (for a drum) or particle masses (for a string world). Matching spectra are necessary for a duality but not sufficient.
- `momentum mode` — A string state moving around a compact circle. Its quantum wave fits n whole wavelengths, adding energy n/R: cheap on large circles.
- `winding number` — How many times a closed string wraps a compact circle. Wrapping costs tension × length, energy wR/α′: cheap on small circles. Point particles cannot wind.
- `T-duality` — The equivalence of string physics on a circle of radius R and one of radius α′/R, with momentum and winding exchanged. Holds at every order of string perturbation theory.
- `string length` — ℓ_s = √α′, the length scale set by the string tension T = 1/(2πα′). Its real-world value, if strings exist, is unknown.
- `self-dual radius` — R = √α′, where a circle and its T-dual partner are the same size. Every smaller radius is equivalent to a larger one.
- `S-duality` — A conjectured equivalence between a theory at strong coupling and another (or the same) at weak coupling, g ↔ 1/g, turning hard calculations into easy ones.
- `mirror symmetry` — Pairs of topologically different Calabi–Yau shapes that give identical string physics. Their "Hodge numbers" appear reflected, hence the name. It is not a mirror reflection of space.
- `gauge/gravity duality` — Also called AdS/CFT (Maldacena 1997): a conjectured equivalence between gravity in a curved anti-de Sitter space and a gravity-free quantum theory on its boundary.

---

## Numbers & facts
- **Closed bosonic string on a circle**:
  - `M² = n²/R² + m²R²/α′² + (2/α′)(N + Ñ − 2)` with level matching `N − Ñ = nm` (m = winding). Source: D. Tong, *Lectures on String Theory*, arXiv:0908.0333, §8.2, eqs. (8.5)–(8.6).
  - Invariance under `R ↔ α′/R` with `m ↔ n`: Tong §8.3, eqs. (8.7)–(8.8).
  - Also Polchinski, *String Theory* vol. 1, ch. 8 ("Toroidal compactification and T-duality"), and Zwiebach, *A First Course in String Theory*, 2nd ed. (2009), ch. 17 ("T-duality of closed strings") and ch. 18 ("T-duality of open strings").
  - Level-matching sign conventions differ between these books; only |N − Ñ| = |nw| matters.
- **Type II superstring on a circle** (the lab's formula):
  - `M² = (m/R)² + (2πRnT)² + 4πT(N_L + N_R)` with `N_R − N_L = mn` and `T = 1/(2πα′)`. This equals `(n/R)² + (wR/α′)² + (2/α′)(N + Ñ)`.
  - BPS states have N_L = 0 or N_R = 0, and their masses are exact at any coupling.
  - Source: J. H. Schwarz, "Lectures on superstring and M theory dualities", hep-th/9607201, eqs. (41)–(42), §2.5.
- **String tension** `T = 1/(2πα′)`, and **string length** `ℓ_s = √α′`: Tong eqs. (1.17)–(1.18). The value of T or ℓ_s in nature is unknown (Tong §1.1: "we don't really know what value T should take").
- **Momentum quantization** `p = n/R` (single-valued wavefunction) and **winding** `X(σ + 2π) = X(σ) + 2πwR`: Tong §8.2.
- **Dilaton shift** under T-duality, `g_s → √α′·g_s/R`: Tong eq. (8.10). Buscher rules: T. Buscher, *Phys. Lett. B* 194, 59 (1987) and *Phys. Lett. B* 201, 466 (1988).
- **Equivalence extends to the full worldsheet CFT, hence to interactions**: Tong §8.3. Review: A. Giveon, M. Porrati, E. Rabinovici, "Target space duality in string theory", *Phys. Rept.* 244, 77 (1994), hep-th/9401139.
- **First observations of R ↔ 1/R duality**: K. Kikkawa and M. Yamasaki, *Phys. Lett. B* 149, 357 (1984); N. Sakai and I. Senda, *Prog. Theor. Phys.* 75, 692 (1986). Both cited as the original references in Giveon–Porrati–Rabinovici. Wikipedia instead credits B. Sathiapalan (1987), https://en.wikipedia.org/wiki/T-duality. The pack names no discoverer on stage.
- **T-duality as a gauge symmetry; SU(2)×SU(2) at the self-dual point**: M. Dine, P. Huet, N. Seiberg, *Nucl. Phys. B* 322, 301 (1989).
- **Enhanced gauge symmetry U(1)×U(1) → SU(2)×SU(2) at R = √α′** in the bosonic string relies on the tachyon, so it doesn't happen in type II. It does occur in the heterotic string. Source: Tong §8.2.3.
- **Two U(1) charges**: momentum is charged under the photon from the metric, winding under the photon from the B-field. Source: Tong §8.2.2.
- **IIA on R = IIB on α′/R; heterotic SO(32) ↔ E₈×E₈**: Tong §8.3.3. P. Ginsparg, *Phys. Rev. D* 35, 648 (1987) (heterotic, with Wilson lines). Dai, Leigh, Polchinski (1989), below.
- **T-duality exchanges Neumann ↔ Dirichlet boundary conditions; this is how D-branes were found**: Tong §8.3.2. J. Dai, R. G. Leigh, J. Polchinski, "New connections between string theories", *Mod. Phys. Lett. A* 4, 2073 (1989). P. Hořava, "Background duality of open-string models", *Phys. Lett. B* 231, 251 (1989).
- **"Minimum length" is subtle**:
  - Tong §6: "roughly true in string theory, although not in any crude simple manner … D-branes are much better probes of sub-stringy physics."
  - M. R. Douglas, D. Kabat, P. Pouliot, S. H. Shenker, "D-branes and short distances in string theory", *Nucl. Phys. B* 485, 85 (1997), hep-th/9608024. D0-branes probe scales down to ~g_s^{1/3} ℓ_s.
  - High-energy string scattering: D. Amati, M. Ciafaloni, G. Veneziano, "Can spacetime be probed below the string size?", *Phys. Lett. B* 216, 41 (1989); D. Gross and P. Mende, *Phys. Lett. B* 197, 129 (1987).
- **Kac 1966**: M. Kac, "Can one hear the shape of a drum?", *Amer. Math. Monthly* 73 (1966) 1–23. The phrase is attributed to Lipman Bers. Source: https://en.wikipedia.org/wiki/Hearing_the_shape_of_a_drum
- **Milnor 1964**: isospectral flat tori in 16 dimensions (same Wikipedia page).
- **Gordon, Webb, Wolpert 1992**: "One cannot hear the shape of a drum", *Bull. Amer. Math. Soc.* 27, 134–138 (1992), and *Invent. Math.* 110, 1–22 (1992). The drums are two polygons made of 7 congruent triangles; they share area and perimeter.
- **Drum vertex coordinates** (unit legs): from C. Moler, "Can one hear the shape of a drum? Part 1", MathWorks blog (2012), https://blogs.mathworks.com/cleve/2012/08/06/can-one-hear-the-shape-of-a-drum-part-1-eigenvalues/. Checked here: both polygons have area 3.5 and perimeter 6 + 3√2 ≈ 10.243.
- **Drum eigenvalues** (for the domain scaled ×2, i.e. legs of 2), first 8 Dirichlet eigenvalues: 2.53794, 3.65551, 5.17556, 6.53756, 7.24808, 9.20929, 10.59699, 11.54140.
  - Source: T. A. Driscoll, "Eigenmodes of isospectral drums", *SIAM Rev.* 39, 1–17 (1997), and P. Amore et al., arXiv:1509.02795, Table 5 (Richardson-extrapolated; E₁ = 2.53794399979862).
  - Frequency ratios `√(λₖ/λ₁)`: 1.000, 1.200, 1.428, 1.605, 1.690, 1.905, 2.043, 2.133.
- **Microwave-cavity confirmation**: S. Sridhar and A. Kudrolli, "Experiments on not 'hearing the shape' of drums", *Phys. Rev. Lett.* 72, 2175 (1994). At least 54 low-lying eigenvalues agree to a few parts in 10⁴. https://doi.org/10.1103/PhysRevLett.72.2175
- **S-duality**:
  - C. Montonen and D. Olive, "Magnetic monopoles as gauge particles?", *Phys. Lett. B* 72, 117 (1977).
  - Evidence: A. Sen, *Phys. Lett. B* 329, 217 (1994), hep-th/9402032 (dyon bound states required by SL(2,ℤ)).
  - Type IIB S-duality: C. Hull and P. Townsend, "Unity of superstring dualities", *Nucl. Phys. B* 438, 109 (1995).
  - E. Witten, "String theory dynamics in various dimensions", *Nucl. Phys. B* 443, 85 (1995).
  - Overview: Schwarz hep-th/9607201.
- **Vacuum Maxwell duality** `E → cB, B → −E/c` leaves the source-free Maxwell equations unchanged: standard (J. D. Jackson, *Classical Electrodynamics*, 3rd ed., §6.11).
- **Mirror symmetry**:
  - Dixon; Lerche–Vafa–Warner (late 1980s). B. Greene and R. Plesser, *Nucl. Phys. B* 338, 15 (1990).
  - P. Candelas, X. de la Ossa, P. Green, L. Parkes, *Nucl. Phys. B* 359, 21 (1991).
  - Curve counts on the quintic: 2,875 lines (Schubert, 19th c.), 609,250 conics (Katz 1986), and 317,206,375 twisted cubics (predicted by Candelas et al. 1991). Ellingsrud–Strømme confirmed the cubic count after finding an error in their code.
  - Mirror formula proved by Givental (1996) and Lian–Liu–Yau (1997). Homological mirror symmetry: Kontsevich (ICM 1994). SYZ "Mirror symmetry is T-duality": Strominger, Yau, Zaslow, *Nucl. Phys. B* 479, 243 (1996), hep-th/9606040.
  - Source: https://en.wikipedia.org/wiki/Mirror_symmetry_(string_theory). Tong §8.3.4.
- **Quintic Hodge numbers** h^{1,1} = 1, h^{2,1} = 101 (mirror: 101, 1), Euler characteristic −200. Source: Candelas et al. (1991); standard.
- **Gauge/gravity (AdS/CFT)**:
  - J. Maldacena, "The large N limit of superconformal field theories and supergravity", submitted 27 Nov 1997, hep-th/9711200, *Adv. Theor. Math. Phys.* 2, 231 (1998).
  - Review: O. Aharony, S. Gubser, J. Maldacena, H. Ooguri, Y. Oz, *Phys. Rept.* 323, 183 (2000), hep-th/9905111.
  - The original example: type IIB strings on AdS₅ × S⁵ ↔ 𝒩 = 4 SU(N) super-Yang–Mills in 4D.
- **Our universe is not anti-de Sitter**: its expansion is accelerating (positive dark energy). A. Riess et al., *Astron. J.* 116, 1009 (1998); S. Perlmutter et al., *Astrophys. J.* 517, 565 (1999). ● OBSERVED.
- **Lab numbers** (computed from the formula above; re-derivable with the lab model):
  - At r = 2 the lowest 16 families are listed in the Lab test vector.
  - The 16th level stays ≤ 9.95 for all r ∈ [0.1, 10].
  - Index-wise (a, b, S) ↔ (b, a, S) holds at 400 sampled radii.
  - Slider default u = 0.6505.

---

## Pitfalls
1. **"A duality means two parallel universes."** The pack says "two descriptions, one physics" (Beat 4). WORLD A and WORLD B are two *readings* of the same bars, which never move when you jump between them (Lab). Beat 6's dictionary is labelled "a dictionary, not a map of where things are."
2. **"T-duality proves space has a minimum length."** Beat 5 makes a narrower claim: a *circle* smaller than √α′ is equivalent to a larger one, *for strings as probes*. The pinned label and Numbers & facts point out that D-branes can resolve shorter distances (Douglas–Kabat–Pouliot–Shenker 1996), and that T-duality says nothing about non-compact directions. The pack never says "nothing can be smaller than the string length."
3. **"It's just a coincidence of masses."** Beat 4 says every interaction matches too. Go deeper gives the coupling shift g → g√α′/R that makes this true and says the equivalence holds for the full worldsheet theory. The drums in Beat 1 carry a label saying that drums share *only* their tones, unlike dual string worlds.
4. **"The drum analogy is how duality works."** It is chipped ~ANALOGY. The drums are distinguishable by looking at them, while dual string worlds are not distinguishable by any measurement. The ● chip covers only the drum theorem and its microwave test.
5. **"A small circle and a big circle are the same, so size is meaningless."** The spectrum does change with R: bars move as you drag. Only the pair R and α′/R agree. At the self-dual radius R = √α′ the two readings have the same size (the mirror point).
6. **"T-duality maps every theory to itself."** For the bosonic string it does. For superstrings it swaps IIA ↔ IIB, and for heterotic strings SO(32) ↔ E₈×E₈. This is stated in Beat 6, the Lab footnote and Go deeper, and it sets up Chapter 09.
7. **"Dualities have been tested experimentally."** None has. The overall status is ◑ DERIVED. S-duality and gauge/gravity wear ◌ CONJECTURED. The only ● in the chapter is the drum fact inside an analogy.
8. **"All dualities are equally certain."** Each dictionary row in Beat 6 carries its own chip. Mirror symmetry is split: ◑ for constructed pairs and proven mathematical predictions, ◌ in general.
9. **"AdS/CFT shows our universe is a hologram."** The row says "5D anti-de Sitter space" and is chipped ◌. Numbers & facts notes that our universe's accelerating expansion means it is not anti-de Sitter.
10. **"Mirror symmetry is a reflection of space."** The glossary says the name comes from reflected Hodge numbers, (1, 101) ⟷ (101, 1) in Beat 6, not a spatial mirror.
11. **"String theory predicts the string length (e.g. the Planck length)."** No meters are ever shown. The scale gauge reads `VALUE IN METERS UNKNOWN`, and the glossary says the value is unknown.
12. **"Winding is just another kind of motion."** Beat 3 shows that a point can circle but cannot stay wrapped. The lab's point-particle mode shows the duality failing, so the extended string is essential.
13. **The bosonic formula's −2 and its tachyon.** The lab uses the tachyon-free type II formula. Go deeper and the Model say the bosonic version differs only in the vibration term and obeys the same swap. The pack does not borrow the bosonic self-dual SU(2)×SU(2) story for type II, where it doesn't occur.
14. **"The pictures show where the string is."** The spinning coil and circulating loop are labelled cartoons. The wave ring, n whole wavelengths, is marked as the honest part.

---

## Handoff
**IN:** H2, matching Chapter 07's final closed string: one closed Thread loop centered, facing the camera, gently wobbling. The chapter first draws the seam behind it, then splits it into WORLD A and WORLD B. If Chapter 07 instead ends on H1 (an open string), use its first 0.15 of local progress to join the endpoints into the H2 loop before the seam draws.

**OUT:** H2: one closed Thread loop centered, facing the camera, gently wobbling. It is the wound string that slipped off the merged self-dual cylinder. An optional faint seam hairline (8%) stays behind so that Chapter 09 can turn it into the first duality "bridge" between superstring theories, or it can be dissolved.
