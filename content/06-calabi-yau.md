# 06 · The Hidden Shape — What shape could the hidden dimensions have?

**Thesis:** If string theory's six extra dimensions exist, their shape (in the simplest, best-studied case a Calabi–Yau shape) would help decide which massless particles we see. In the simplest recipe, counting the shape's holes counts particle families. There are an enormous number of candidate shapes, and nobody knows which one, if any, is ours.
**Overall status:** `DERIVED` ◑. The maths and the shape → particle link are established within string theory. Whether nature has hidden dimensions at all is untested. Calabi–Yau shapes are the simplest consistent option, not the only one.

---

## Storyboard

Chapter progress map (scroll `progress` 0 → 1). Opening 0.00–0.08 · B1 0.08–0.18 · B2 0.18–0.32 · B3 0.32–0.46 · **B4 (aha) 0.46–0.62** · B5 0.62–0.70 · B6 0.70–0.80 · Lab 0.80–0.94 · exit ramp 0.94–1.00.
Global rules for this scene: geometry is **Field** blue (`#86A8D8`), translucent, with hairline iso-lines. Only the Thread glows warm (`--filament`). Scale: the real size is unknown for the entire chapter. The shared left gauge only accepts meters or `null` (src/ui is off-limits), so `scale()` returns **`null`** throughout (marker hidden, no number), and the chapter pins its own mono caption **"SIZE: UNKNOWN · DRAWN MAGNIFIED"** (`ANALOGY ~`) near the gauge edge of the stage for the whole chapter. Scene units: the Calabi–Yau slice is drawn at scale S = 0.8, which puts it inside a sphere of radius ≤ 1.4.

### Opening · "A circle was the easy case" (0.00–0.08)
- **Text:** Chapter 5 hid one dimension in a circle. Superstring theory needs nine of space; if it describes our world, six must hide. Six can curl up in vastly more ways than one. The hidden shape isn't decoration: it would help decide what strings can do.
- **Status:** `DERIVED` ◑ (the nine space dimensions are a consistency requirement *within* superstring theory; extra dimensions are unobserved)
- **Stage:** First frame = **H2** exactly: `<HandoffLoop/>` with default props (radius r₀ = 1.3) at the origin, facing the camera, gently wobbling, camera at `HANDOFF.camera` (FOV 35°, position (0, 0, 10)), view shift [0, 0]. Optionally Ch. 05's faint 15% lattice is drawn behind it at progress 0 and fades out over 0.00–0.03. Over the Opening the camera eases from distance 10 to 5 on the +Z axis. 0.00–0.03: a Field-blue hairline circle fades in exactly under the loop, and the loop now reads as a string wound once around a curled-up dimension (a callback to Ch. 05). Mono label: `1 HIDDEN DIMENSION · CIRCLE`. 0.03–0.06: the circle thickens into a torus. The tube radius grows from 0 to 0.35·r₀ while the Thread rides the outer equator. Label: `2 HIDDEN DIMENSIONS · TORUS`. 0.06–0.08: from one point on the torus, six hairline axis-ticks unfurl in a star. Two are solid, and four fade to dashes (directions we cannot draw). Label: `6 HIDDEN DIMENSIONS · ?`. The camera completes its dolly-in, reaching distance 5 at 0.08.

### Beat 1 · "Which shapes are allowed?" (0.08–0.18)
- **Text:** Not any shape will do. If the hidden space is otherwise empty and some [[supersymmetry]] survives, string theory's equations demand a [[Calabi–Yau manifold]]: curved, yet solving Einstein's equations for empty space. Calabi conjectured such geometries exist (1954–57); Yau proved it (1977–78).
- **Status:** `DERIVED` ◑. Inline chip on "supersymmetry": `OBSERVED ●: no superpartner found so far`, which makes clear that the CY requirement rests on an unconfirmed assumption.
- **Stage:** The torus unrolls into a flat square with a hairline grid. Its opposite edges glow in matched pairs and zip back together into a **flat torus**. Label: `SIMPLEST CALABI–YAU · 2 REAL DIMENSIONS · FLAT`. The Thread lies across the square as a straight segment that exits one edge and re-enters from the opposite one, which reads as a closed string on the torus. Then a **"Ricci rosette"** appears in a separate circular inset labelled `ONE POINT OF A CURVED 6D CALABI–YAU` (not on the flat torus: there every petal would be zero, and in 2 or 3 dimensions Ricci-flat forces flat, so curved Ricci-flat shapes need ≥ 4). The rosette is a small star of 5 hairline petals, one for each of the 5 planes spanned by a chosen direction v and the 5 directions perpendicular to it (6 − 1 = 5). Petals bulge outward (Field blue, positive bending) or pinch inward (Ink-2 dashed, negative bending). A mono readout under the rosette reads `Σ BENDING THROUGH THIS DIRECTION = 0`. The rosette slowly rotates to new directions, and the sum stays 0. Rosette chip: `ANALOGY ~`. Caption: `RICCI-FLAT: BENDING CANCELS IN EVERY DIRECTION`. A hairline timeline slides along the bottom: `1954–57 CALABI CONJECTURES · 1977–78 YAU'S PROOF · 1985 PHYSICS ADOPTS`.

### Beat 2 · "The famous picture is a shadow" (0.18–0.32)
- **Text:** You may have seen this picture. It is a shadow of a slice. Cut a six-dimensional Calabi–Yau, the quintic, and a two-dimensional surface remains. That surface still needs four dimensions, so we draw its 3D [[projection]]. Turn through the fourth direction and the shadow changes.
- **Status:** `ANALOGY ~` + `DERIVED ◑` (the surface z₁⁵ + z₂⁵ = 1 is exact; what you see is its projection)
- **Stage:** The square fades. The **base piece** (patch k₁ = k₂ = 0 of the n = 5 surface, see Lab › Model) appears alone at center, slightly brighter. 0.20–0.26: the other 24 pieces sweep into place. Each is the base piece with z₁ rotated by phase 2πk₁t/5 and z₂ by 2πk₂t/5 as t runs 0 → 1, staggered by k₁ + k₂. The in-between positions are not on the surface, so keep each sweep short: each spans 0.02 of chapter progress, starting at 0.20 + 0.005·(k₁ + k₂) (the last, k₁ + k₂ = 8, ends at 0.26). Label: `25 COPIES OF ONE PIECE`. The complete Hanson-style surface is visible at hidden angle α = 45° from Hanson's viewpoint (Lab › Model › camera). 0.26–0.32: α sweeps 45° → 135° while the camera orbits +40° in azimuth, and the shadow visibly re-folds. Three hairline callouts in the margin: `z₁⁵ + z₂⁵ = 1 · 4D → 3D SHADOW`; `APPARENT CROSSINGS = SHADOW OVERLAP, NOT REAL`; and, pinned to a dashed rim, `CUT OFF HERE · SURFACE CONTINUES OUTWARD`. The Thread, shrunk to a small H2 loop, orbits the shape at radius 2.0 as a "probe".

### Beat 3 · "The shape sets the notes" (0.32–0.46)
- **Text:** A drum's shape sets its notes. Hidden dimensions do the same for strings: wave patterns must fit the shape. Patterns with zero wiggle cost no energy, so they'd look like massless particles. How many exist depends on the shape's [[topology]], its holes, not its size.
- **Status:** `DERIVED ◑` + `ANALOGY ~` (drum)
- **Stage:** 0.32–0.36: an inset callback to Ch. 05 shows a Field-blue ring carrying Ink standing waves with 0, 1 and 2 wavelengths around it, drawn as Ch. 05 draws them: a Kaluza–Klein wave is a quantum wave any particle would have, not a string, so it is not warm (Ch. 05 Pitfall 14; only the Thread glows warm). The 0-wavelength (uniform) mode is tagged `ZERO WIGGLE → MASSLESS`, and the others `WIGGLIER → HEAVIER`. A hairline **mass ladder** at the right edge shows rungs at 0, 1/R and 2/R. 0.36–0.41: the inset closes. The Thread probe touches the quintic slice, and a low-intensity warm pattern spreads over the surface (it is the string's wave pattern, so it gets filament color at ≤ 30% intensity). Pattern: stripes of f = Re((z₁·e^{iΩt})³), which is harmonic (∇²f = 0: its bending in the two surface directions cancels) and flows continuously across all 25 pieces. Do not label the stripes "zero wiggle": the viewer has just seen that tag on the uniform ring mode. A striped harmonic pattern exists only because the drawn slice is open (cut off at its rims); on a closed shape the only harmonic *function* is a constant, and the massless patterns that count holes are harmonic *forms*. Chip: `ANALOGY ~: a harmonic pattern on the open slice; real zero-modes are harmonic forms on the full 6D shape`. 0.41–0.46 **(aha, part 1)**: the surface is squashed and twisted (Lab's deformation D_s, s: 0 → 1 → 0.3). Readout `HANDLES (THIS SLICE): 6 · UNCHANGED` stays frozen. On the ladder, the zero rung stays pinned while the upper rungs slide as the size changes (spacing ∝ 1/size, illustrative).

### Beat 4 · ★ AHA · "Count the holes, count the families" (0.46–0.62)
- **Text:** In 1985, Candelas, Horowitz, Strominger and Witten found that in the simplest recipe, particle [[generation]]s number half the shape's Euler characteristic, ignoring sign. The quintic's is −200: one hundred generations. We observe three. Shapes giving three exist; in this recipe, the quintic can't be ours.
- **Status:** `DERIVED ◑`. Inline chip on "We observe three": `OBSERVED ●`.
- **Stage (the aha must land here):** The slice slides to the left third and keeps rotating slowly. The right two-thirds becomes a hairline **ledger** titled `THE FULL 6D QUINTIC · HOLE COUNTS (CANNOT BE DRAWN)`.
  - 0.46–0.50: `h¹¹ = 1` draws one ring glyph. `h²¹ = 101` draws 101 tick glyphs in a 10 × 10 grid plus 1. Equation badge: `χ = 2(h¹¹ − h²¹) = 2(1 − 101) = −200`.
  - 0.50–0.53: **Pair-off.** The ring and one tick fly together and both fade. Caption: `FAMILY + ANTI-FAMILY PAIR UP · CAN BECOME HEAVY`. 100 ticks remain.
  - 0.53–0.57: each remaining tick turns into a **family glyph** (a 2 × 2 quad of small dots: two quarks, a charged lepton, a neutrino, matching the glossary; not a triad, which would blur "one family" with "three families" and echo the three-quark proton cartoon). The glyphs cascade into one tall column, and a mono counter runs `0 → 100`. Label: `SIMPLEST RECIPE: 100 GENERATIONS · |χ|/2`. Sub-label: `(families of an E₆ grand-unified model)`.
  - 0.57–0.60: next to the tall column, a short column of **3** solid-dot family quads rises with an `OBSERVED ●` chip. Label: `OBSERVED: 3`. Footnote: `Z-boson decays: 2.996 ± 0.007 light neutrino types`. The frame holds with both columns in view: 100 against 3. This is the landing image.
  - 0.60–0.62: a small third column slides in: `TIAN–YAU ÷ ℤ₃: χ = −6 → 3` (`DERIVED ◑`), with the note `THREE IS NECESSARY, NOT SUFFICIENT`.
  - Camera: static, with a 6% push-in on the columns during 0.57–0.60. Reduced motion: show the final ledger state with no cascade.

### Beat 5 · "Even the right shape has dials" (0.62–0.70)
- **Text:** A shape with the right holes still has dials: sizes and shape-twists called [[moduli]]. The quintic has one size dial and 101 shape dials. Their settings would set masses and force strengths. Left loose, they'd add long-range forces never seen. How they're fixed is debated.
- **Status:** `DERIVED ◑`. Inline chip on "never seen": `OBSERVED ●: fifth-force searches find none`. Inline chip on "How they're fixed is debated": `SPECULATIVE ○`.
- **Stage:** The ledger glyphs morph into **102 hairline dials**: one large dial labeled `SIZE ×1` and 101 small dials in an arc labeled `SHAPE ×101`. The dials drift lazily, and the slice breathes in step (deformation D_s with s oscillating between 0 and 0.4; `ANALOGY ~`: we bend the picture, not a real Calabi–Yau). Readout: `MASSES, COUPLINGS: WOULD SHIFT · NOT COMPUTED HERE`. At 0.67 all dials click to fixed angles and a small lock glyph appears, tagged `HOW: STILL DEBATED` (`SPECULATIVE ○`).

### Beat 6 · "How many shapes?" (0.70–0.80)
- **Text:** How many Calabi–Yau shapes are there? One catalogue alone, built from 473,800,776 four-dimensional polytopes, yields 30,108 distinct pairs of [[Hodge numbers]], often shared by many shapes. Whether the full count is finite is unknown. Which shape, if any, describes our universe: nobody knows.
- **Status:** `DERIVED ◑` (the enumeration is mathematics; which shape is ours is an open question)
- **Stage:** The quintic shrinks to a single bright point and flies to its place in a hairline scatter plot: x = χ ∈ [−960, 960], y = h¹¹ + h²¹ ∈ [0, 502]. **30,108 instanced points** (one per Kreuzer–Skarke Hodge pair; data in Lab › Model) sweep in bottom-up, Field blue at 1.5 px. Annotations: the quintic at (−200, 102) is labeled `QUINTIC`. A dashed vertical band at χ = ±6 reads `SIMPLEST RULE GIVES 3 HERE`. The χ = 0 axis reads `MIRROR SYMMETRY: h¹¹ ↔ h²¹` (`DERIVED ◑` for the pairing; Ch. 08 explores dualities). The title reads `ONE CATALOGUE · 473,800,776 POLYTOPES · 30,108 HODGE PAIRS`. The camera pulls back, and the plot's left-right mirror symmetry becomes obvious. The Thread probe drifts in front of the plot.

### Exit ramp (0.94–1.00, after the Lab)
Lab geometry and plot fade to Void. If the Thread is wrapped on a loop, it unwraps (its points interpolate back to a circle). It then glides to screen center, grows to the canonical radius, turns to face the camera and resumes the gentle wobble: **H2** (`<HandoffLoop/>`, default props). By progress 1 the camera is back at `HANDOFF.camera` (0, 0, 10) and the view shift is [0, 0].

---

## Lab

**Title:** Lab · Turn the shadow
**Purpose:** Handle a genuine slice of a Calabi–Yau: see it as a 4D → 3D shadow, count its handles, and test which loops can truly trap a string.
**Lab status:** `DERIVED ◑` (the surface, its topology and the loop truth table are exact mathematics) + `ANALOGY ~` (the squash slider, the wrapped-string animation and the escape path are cartoons).

### Controls
| Control | Type | Range | Default | Units / notes |
|---|---|---|---|---|
| Orbit & zoom | drag / pinch / wheel | camera distance 2.4–9; polar angle 10°–170° | Hanson view (see Model), distance 5 | world units. Idle auto-orbit 0.06 rad/s, off under reduced motion |
| Degree **n** | segmented | {3, 4, 5, 6} | **5** | integer |
| Hidden rotation **α** | slider + play | 0°–360°, step 1°, wraps | **45°** | degrees. Play = 15°/s |
| Squash & twist **s** | slider | 0–1 | 0 | unitless (`ANALOGY ~`) |
| Show pieces | toggle | on/off | on | tints the n² patches by (k₁, k₂) |
| Wrap a string | toggle | on/off | off | reveals the two buttons below |
| Shrink on the slice | button | — | — | runs the "snag" animation |
| Shrink in the full shape | button | — | — | n = 3: snag. n ≥ 4: escape |
| Reset loop | button | — | — | appears after an escape |

Keyboard: ←/→ changes α by 5°, [ and ] step n, W toggles wrap.

### What changes on screen
- **n** rebuilds the surface from n² pieces, updates the n branch-point dots of each kind (2n in total) and the n dashed rims, and updates the readout panel (table below). The change is a 0.8 s cross-dissolve with a slight bloom. **Never tween geometry between different n**, because the in-between shapes are not solutions.
- **α** changes only the projection. The mesh is fixed; a shader uniform re-projects it, so the shadow re-folds while every readout stays the same.
- **s** smoothly bends the 3D picture. The genus, χ and generation readouts stay frozen, which is the point of the control.
- **Show pieces** switches between Hanson-style per-patch tints (blue→violet ramp keyed to k₁·n + k₂, base patch brightest) and a uniform Field blue.
- **Wrap a string:** non-loop patches fade to 12% opacity. The Thread flies from its probe orbit onto loop **a** (1.2 s, each of 256 points interpolated from circle to loop), and four branch points light up with labels A₀, B₀, A₁ and B₁.
- **Shrink on the slice:** the loop tightens toward its centroid by up to 18% in 0.8 s, then springs back (damped, ζ = 0.3, about 2 oscillations). A taut shimmer runs along the Thread, and the snag caption appears.
- **Shrink in the full shape:** for **n = 3**, the same snag plays with the "stuck for real" caption. For **n ≥ 4**, over 2.0 s the loop shrinks to its centroid while its color drains from filament to a dashed Ink-3 ghost and it drifts 0.3 units along the screen-perpendicular direction, a cartoon of leaving the slice. Then the "free" caption appears. Reduced motion: crossfade to the end state.

### Model (what drives the visualization)

**1 · The surface (faithful: Hanson 1994, exact).** For each integer n ∈ {3,4,5,6} draw the complex curve

z₁ⁿ + z₂ⁿ = 1 in ℂ² (real dimension 2, sitting in ℝ⁴).

It is covered by n² patches indexed by k₁, k₂ ∈ {0, …, n−1}. Patch coordinates are x ∈ [−X, X] with X = 1.0 (Hanson's `xiMax = 1`) and y ∈ [0, π/2]. With θ = x + iy:

```
u = cosh θ   = cosh x·cos y + i·sinh x·sin y
v = −i sinh θ = cosh x·sin y − i·sinh x·cos y        (u² + v² = 1)
ω = e^{2πi/n}
z1 = ω^{k1} · u^{2/n}
z2 = ω^{k2} · v^{2/n}        ⇒  z1ⁿ + z2ⁿ = u² + v² = 1  (exactly)
```

- `w^{2/n}` is the principal power: |w|^{2/n}·e^{i(2/n)·atan2(Im w, Re w)}, and 0 when |w| = 0. On this domain Re u ≥ 0 and Re v ≥ 0, so the power never crosses its branch cut and each patch is continuous, and smooth away from its two branch points on x = 0.
- **Precision trap (verified):** compute on the CPU in float64 (JS `Number`). Use exact endpoint values: at y = 0 set (cos y, sin y) = (1, 0), and at y = π/2 set (0, 1). Floating-point cos(π/2) = 6×10⁻¹⁷ becomes ~4×10⁻⁶ after the 2/n power at n = 6 (3×10⁻⁷ at n = 5; float32 is far worse), which opens visible cracks at the branch points.
- Grid: NX must be **odd** so that x = 0 is a grid line (the loop and the branch points lie on it; Hanson flags the same point). Tiers: high 49×25, medium 41×21, low 25×13 samples per patch. Triangles = n²·2·(NX−1)(NY−1). At the medium tier that is 40,000 for n = 5 and 57,600 for n = 6.
- **Instancing:** build one base patch (k₁ = k₂ = 0) and draw n² instances with an instance attribute (k₁, k₂). In the vertex shader, rotate (Re z₁, Im z₁) by angle 2πk₁/n and (Re z₂, Im z₂) by 2πk₂/n. This is one draw call. The B2 assembly animation uses the same rotation with angle 2πk·t/n.
- Store per vertex `p4 = (Re z1, Im z1, Re z2, Im z2)`, plus the tangents `tx = ∂p4/∂x` and `ty = ∂p4/∂y` from central differences (h = 1e-4, one-sided at the domain edges), plus `uv = (x, y)` for iso-lines. In the shader, apply the same per-instance (k₁, k₂) rotation to `tx` and `ty` as to `p4`. At the branch points (x = 0, y ∈ {0, π/2}) the parametrization is singular (|∂p4| grows like |w|^{2/n − 1}) although the surface itself is smooth; the finite differences stay finite and give the right tangent plane.
- **Glued structure (for labels):** the x = 0 line of patch (k₁, k₂) runs from A_{k₁} = (ω^{k₁}, 0) at y = 0 to B_{k₂} = (0, ω^{k₂}) at y = π/2. These 2n branch points are where n pieces meet. The y = 0 edge at x > 0 of patch (k₁, k₂) is glued to the y = 0 edge at x < 0 of (k₁, k₂−1). The y = π/2 edge at x > 0 of (k₁, k₂) is glued to the x < 0 half of (k₁+1, k₂). The rims x = ±X are where the drawing is cut off: they form **n boundary circles** heading to infinity. Draw them as dashed hairlines.

**2 · Projection (faithful: linear projection ℝ⁴ → ℝ³, Hanson's convention).**

```
P_α(p4) = ( Re z1 ,  Re z2 ,  cos α · Im z1 + sin α · Im z2 )      // Hanson: (x, y, z), z up
three.js (Y-up):  world = S · ( P.x ,  P.z ,  −P.y ),   S = 0.8
normal = normalize( cross( P_α(tx), P_α(ty) ) )  // same linear map; fall back to dFdx/dFdy if |cross| < 1e-6
```

α (the hidden-rotation slider) is a uniform, so changing it costs nothing. When the squash s > 0 (§5, a non-linear map), transform the normal by D_s's Jacobian or simply use the dFdx/dFdy fallback for every fragment. Render double-sided and flip the normal on back faces; the projection creates folds and overlaps. **Default camera** follows Hanson's `ViewPoint {2.9, 1.0, 1.4}` mapped to Y-up as direction (2.9, 1.4, −1.0), normalized to distance 5, looking at the origin, FOV 35°. The projected shape stays inside radius 1.75·S ≈ 1.4 for every n and α (checked numerically).

**3 · Topology readouts (faithful).**

| n | parent Calabi–Yau (Fermat degree-n in ℂℙⁿ⁻¹) | complex / real dims | complex coords held fixed to make the slice | parent χ | slice genus g = (n−1)(n−2)/2 | pieces n² | parent simply connected? | generations readout |
|---|---|---|---|---|---|---|---|---|
| 3 | elliptic curve (torus) | 1 / 2 | 0 (the slice *is* the whole thing) | 0 | 1 | 9 | no (a torus has trapping loops) | "rule is for 6D shapes" |
| 4 | K3 surface | 2 / 4 | 1 | 24 | 3 | 16 | yes | "rule is for 6D shapes" |
| **5** | **quintic threefold** (h¹¹ = 1, h²¹ = 101) | **3 / 6** | 2 | **−200** | **6** | **25** | **yes** | **100 (net, standard embedding) · observed 3** |
| 6 | sextic fourfold | 4 / 8 | 3 | 2610 | 10 | 36 | yes | "rule is for 6D shapes" |

The slice is obtained by setting the extra homogeneous coordinates to 0 and the last one to e^{iπ/n} (so that its nth power is −1). The compact slice is the full, untruncated curve (x ∈ ℝ) plus n points at infinity; topologically, it is the drawn surface with each of its n rims capped by a disk (χ = 3n − n² = 2 − 2g, Hanson's eq. 9). The drawn, truncated surface has Euler characteristic 2n − n² and n boundary circles.

**4 · The loop "a" (faithful topology).** A closed path along x = 0 through four patches, A₀ → B₀ → A₁ → B₁ → A₀:

```
seg 0: patch (0,0), y: 0 → π/2      seg 1: patch (1,0), y: π/2 → 0
seg 2: patch (1,1), y: 0 → π/2      seg 3: patch (0,1), y: π/2 → 0
on x = 0:  z1 = ω^{k1}·(cos y)^{2/n},   z2 = ω^{k2}·(sin y)^{2/n}      (64 samples per segment)
```

This loop was checked by simplicial homology on the glued mesh, with the n rims capped. For every n = 3…6 it is a cycle that is **not** a boundary, so it cannot be shrunk on the compact slice. The same check reproduces b₁ = 2g. (Referee: independently reproduced with a separate mesh-and-cap script mod 1,000,003, and by a cell argument. The x = 0 arcs form the bipartite graph K_{n,n} (A's to B's). Its n faces, one per point at infinity, are labelled by k₁ − k₂ mod n, and every face boundary gives all edges of equal k₁ − k₂ the same coefficient. Loop a gives e₀₀ and e₁₁ coefficient +1 but e₂₂ coefficient 0, so for n ≥ 3 it is not a sum of face boundaries. For n = 2 it is, which is consistent with g = 0.) The loop has kinks at the 4 branch points; Catmull-Rom smoothing is optional and visual only. Render it as a tube (radius 0.012) offset +0.01 along the surface normal, in two passes: depth-tested at full intensity, then occluded (depthFunc GREATER) at 35% opacity so it reads through the surface.
- **Truth table for the two buttons:** *on the slice:* stuck for all n. *In the full parent:* n = 3 stuck, because the torus is the entire Calabi–Yau. For n ≥ 4 the loop is free, because every Fermat hypersurface of dimension ≥ 2 is simply connected (Lefschetz hyperplane theorem). A string wound on it can unwind, so no winding number is conserved.
- The escape path is a **cartoon**. The real contraction runs through directions the slice omits.

**5 · Squash & twist (cartoon of moduli).** This is applied after projection, in world space:
`D_s(W) = R_Y(κ·s·W.y) · diag(1 + 0.45s, 1 − 0.30s, 1 + 0.15s) · W`, with κ = 0.9 rad per unit, where W is the world-space (Y-up) position from §2, not Hanson's P.
It is a smooth invertible map of ℝ³, so it cannot change topology. That part is faithful. It is **not** a real Calabi–Yau modulus: real moduli change the Ricci-flat metric, which no one can write in closed form. Label it `ANALOGY ~`.

**6 · Thread decoration (cartoon).** Transverse wobble r(σ,t) = r₀(σ) + A·N(σ)·sin(2π·6σ − 3t), with A = 0.01.

**7 · Beat-only assets.**
- B3 pattern: stripes of f = Re((z₁·e^{iΩt})³) with Ω = 0.6 rad/s (named Ω to avoid a clash with the root of unity ω = e^{2πi/n}). f is harmonic on the surface, being the real part of a holomorphic function (verified numerically: discrete Laplacian ≈ 0). Stripe intensity = 0.5 + 0.5·cos(6f).
- B6 data: the Kreuzer–Skarke Hodge list `alltoric.spec.gz` (30,108 rows of `h11 h21 χ`, 108,883 bytes gzipped, served over https; the first line is a header `#spec=30108`, so skip lines not starting with a digit). Preprocess it offline to a `Uint16Array` of (h11, h21) pairs (≈ 120 kB raw) and ship it inside the chapter folder; the strict CSP forbids fetching it from the TU Wien server at runtime. Lazy-load the bundled chunk when B5 mounts. Draw it with one `THREE.Points` draw call. It has 208 pairs with |χ| = 6 (104 each at χ = ±6), χ spanning −960 to 960, h¹¹ + h²¹ from 22 to 502, and it is exactly mirror-symmetric (every (a, b) has its (b, a)). All re-verified by the referee from the downloaded file.

**Performance:** there is one instanced surface draw, rims, dots, and 2 loop passes, so ≤ 8 draw calls. That is ≤ 83k triangles at high tier with n = 6. Regenerate the base patch only when n changes (≤ 1,225 vertices, < 2 ms). Reuse the tube buffers, with no per-frame allocation.
**No-WebGL fallback:** three static SVGs: the n = 5 surface at α = 45° with loop a, the 100-vs-3 ledger, and the Hodge scatter plot.

### Micro-copy (each ≤ 20 words)
- Lab intro: "A genuine slice of a Calabi–Yau. Rotate it, count its handles, and try to trap a string."
- n = 3: "Parent: a torus, the Calabi–Yau with two real dimensions. Here the slice is the whole thing."
- n = 4: "Parent: a K3 surface, four real dimensions. You're seeing a slice."
- n = 5: "Parent: the quintic threefold, six real dimensions, as many as superstrings hide. You're seeing a slice."
- n = 6: "Parent: a Calabi–Yau fourfold, eight real dimensions, more than superstrings hide."
- α: "Turn through the fourth direction. The surface doesn't change; only its shadow does."
- Overlaps: "Apparent crossings are shadows overlapping. The real surface never passes through itself."
- Rim: "Cut off here. The surface keeps going outward."
- Pieces: "Built from n² copies of one piece, each turned by a complex phase."
- Squash: "Squash it all you like: the holes, and the massless count, stay put."
- Squash chip: "Cartoon: we bend the picture, not a real Calabi–Yau."
- Wrap: "A closed string, wound once around a handle of the slice."
- Snag: "Snagged. On the slice this loop circles a handle, so it can't shrink."
- Escape (n ≥ 4): "Free. In the full shape it slips out through directions this slice leaves out."
- Stuck (n = 3): "Stuck for real. At n = 3 the slice is the entire Calabi–Yau: a torus."
- Generations (n = 5): "Simplest recipe: 100 generations. Observed: 3. So, in this recipe, the quintic isn't our world."
- Generations (other n): "The generation rule applies to six-dimensional shapes, n = 5."
- Metric note: "The bends you see aren't the true Ricci-flat geometry. Beyond the torus, nobody knows it in closed form."
- Scale note: "Not to scale. Real size: unknown."

### Optional audio (muted by default)
A soft pad whose filter cutoff follows α, so the shadow turning is heard as a slow timbral sweep. **Snag:** a taut, low pluck with a short tremolo. **Escape:** a quiet downward glissando that fades to nothing. **Stuck at n = 3:** the pluck rings on. Changing n sounds a single chime; the harmonic content carries no physics.

---

## Go deeper

**Why holes count particles.** Split a massless ten-dimensional field into a 4D wave times a pattern ψ spread over the hidden shape Y. The wave equation then becomes an eigenvalue problem on Y:

$$ m^2\,\psi \;=\; -\nabla_Y^{2}\,\psi $$

`m2`: the mass-squared a 4D observer would measure. `lap`: the Laplacian on Y, which measures how sharply ψ wiggles across the hidden shape. `psi`: the pattern itself. Wigglier patterns are heavier (on a circle m ∝ 1/R, as in Chapter 5). Zero-wiggle patterns (∇²ψ = 0) are massless. For a plain number-valued ψ on a closed shape, that forces ψ to be constant: one pattern, whatever the shape. For fields that carry directions (forms), Hodge's theorem says the number of zero-wiggle patterns equals the number of independent holes of each dimension. That count is topological, blind to stretching. For quarks and leptons an index theorem does the same job and fixes the net number of families.

For a Calabi–Yau threefold the relevant holes are packaged in two Hodge numbers:

$$ \chi \;=\; 2\,\big(h^{1,1}-h^{2,1}\big), \qquad N_{\text{gen}} \;=\; \tfrac12\,|\chi| $$

`h11`: independent 2D holes, which is also the number of size dials. `h21`: the number of shape dials, tied to the 3D holes. `chi`: the Euler characteristic. `ngen`: net generations in the 1985 "standard embedding", where families and anti-families pair off and only the difference survives. (There, the number of E₆ **27**s is h²¹ and of **27̄**s is h¹¹, so the quintic gives 101 and 1: net 100.) The quintic

$$ z_1^5+z_2^5+z_3^5+z_4^5+z_5^5=0 \quad\text{in } \mathbb{CP}^4 $$

has h¹¹ = 1 and h²¹ = 101, so χ = −200 and N_gen = 100. `quintic`: set z₃ = z₄ = 0 and z₅ = −1. What is left is `slice`: z₁⁵ + z₂⁵ = 1, the surface on screen.

*Highlight keys:* `m2`, `lap` and `psi` light the B3 ladder and pattern. `h11`, `h21`, `chi` and `ngen` light the B4 ledger. `quintic` and `slice` light the Lab surface.

---

## Glossary
- `Calabi–Yau manifold`: A compact complex shape that admits a Ricci-flat Kähler metric (Yau's theorem). Six-dimensional ones with SU(3) holonomy keep some supersymmetry in 4D.
- `Ricci-flat`: For every direction, the bending of space in the planes containing that direction adds up to zero. Such a shape solves Einstein's equations with nothing inside it.
- `supersymmetry`: A proposed symmetry pairing every boson with a fermion. It appears in many string models, but string theory does not fix the partners' masses. No superpartner has been observed.
- `topology`: The properties of a shape that survive smooth stretching and bending, such as its number of holes or handles. Tearing or gluing can change them.
- `Euler characteristic (χ)`: A single integer summarizing a shape's holes. For a 2D closed surface χ = 2 − 2g. For the quintic threefold χ = −200.
- `generation`: One copy of the matter family: two quarks, a charged lepton and its neutrino. Nature has three, with the same charges but different masses.
- `moduli`: The continuous "dials" of a hidden shape (its sizes and shape-twists). Their values would set particle masses and couplings, and something must fix ("stabilize") them.
- `Hodge numbers`: The refined hole counts of a complex shape. For a Calabi–Yau threefold, h¹¹ counts size dials and 2D holes; h²¹ counts shape dials.
- `projection`: Drawing a higher-dimensional object as its lower-dimensional shadow. Overlaps and crossings in the shadow may not exist in the object itself.

Referenced from other chapters, not redefined: `compactification` (Ch. 5, where it is introduced; its refereed wording there does not assume the shape is small), `superstring` (Ch. 2), `mirror symmetry` (Ch. 8, previewed on the Beat 6 plot).

---

## Numbers & facts
- **Calabi's conjecture, 1954 and 1957.** E. Calabi, "The space of Kähler metrics," *Proc. ICM 1954* vol. II, pp. 206–207; "On Kähler manifolds with vanishing canonical class," in *Algebraic Geometry and Topology: A Symposium in Honor of S. Lefschetz* (R. H. Fox, D. C. Spencer, A. W. Tucker, eds.), Princeton UP (1957), pp. 78–89, doi:10.1515/9781400879915-006 (Crossref-verified).
- **Yau's proof, 1977 (announcement) and 1978 (full).** S.-T. Yau, *PNAS* 74 (1977) 1798–1799, <https://www.pnas.org/doi/10.1073/pnas.74.5.1798>; "On the Ricci curvature of a compact Kähler manifold and the complex Monge–Ampère equation, I," *Comm. Pure Appl. Math.* 31 (1978) 339–411, doi:10.1002/cpa.3160310304.
- **Name "Calabi–Yau" coined by Candelas et al. (1985); SU(3) holonomy keeps one quarter of the supersymmetry.** <https://en.wikipedia.org/wiki/Calabi%E2%80%93Yau_manifold>
- **CHSW, 1985.** P. Candelas, G. Horowitz, A. Strominger, E. Witten, "Vacuum configurations for superstrings," *Nucl. Phys. B* 258 (1985) 46–74, doi:10.1016/0550-3213(85)90602-9. Covers the demand for N = 1 supersymmetry in 4D, which leads to SU(3) holonomy, the E₆ gauge group, and the rule that generations = half the Euler characteristic (net, in magnitude). <https://ui.adsabs.harvard.edu/abs/1985NuPhB.258...46C>
- **Superstrings need 10 spacetime dimensions (9 of space), so 6 are hidden if 4 are visible.** Polchinski, *String Theory* vol. 2 (1998); Zwiebach, *A First Course in String Theory*, 2nd ed. (2009), superstrings chapter; Tong, *Lectures on String Theory* (arXiv:0908.0333).
- **Quintic: h¹¹ = 1, h²¹ = 101, χ = −200, so 100 net generations.** <https://en.wikipedia.org/wiki/Quintic_threefold>. Also row `1 101 -200` of the Kreuzer–Skarke Hodge list (below).
- **Euler characteristics 0 (torus), 24 (K3), −200 (quintic), 2610 (sextic fourfold).** Computed from c(X) = (1+H)ⁿ/(1+nH) for the degree-n Fermat hypersurface in ℂℙⁿ⁻¹. Standard; see T. Hübsch, *Calabi–Yau Manifolds: A Bestiary for Physicists*, World Scientific (1992), doi:10.1142/1410. Recomputed symbolically for this pack and again by the referee: the coefficients of H^{n−2} are 1, 6, −40, 435, times n. Cross-check for the sextic by an independent route: h¹¹ = 1 and h²¹ = 0 (Lefschetz); h³¹ = C(11,5) − 36 = 426 (sextic monomials minus GL(6)); the CY4 identity h²² = 44 + 4h¹¹ − 2h²¹ + 4h³¹ gives 1752. Then χ = 4 + 2h¹¹ − 4h²¹ + 2h³¹ + h²² = 2610.
- **Fermat hypersurfaces of dimension ≥ 2 (K3, quintic, sextic fourfold) are simply connected.** Lefschetz hyperplane theorem. <https://en.wikipedia.org/wiki/Lefschetz_hyperplane_theorem>
- **Hanson construction:** z₁ = e^{2πik₁/n} cosh(ξ+iθ)^{2/n}, z₂ = e^{2πik₂/n} (−i sinh(ξ+iθ))^{2/n}, 0 ≤ θ ≤ π/2, |ξ| ≤ ξmax (sample code uses ξmax = 1). Projection (Re z₁, Re z₂, cos a·Im z₁ + sin a·Im z₂) with a = π/4. n² patches; genus g = (n−1)(n−2)/2; odd sample count needed to hit the fixed points. A. J. Hanson, "A construction for computer visualization of certain complex curves," *Notices AMS* 41(9) (1994) 1156–1163. <https://homes.luddy.indiana.edu/hansona/papers/CP2-94.pdf> (The pack's x, y are Hanson's ξ, θ.) Referee re-read the PDF's Table 1: `cCos = cosh(ξ+iθ)`, `cSin = −i·sinh(ξ+iθ)`, `xiMax = 1`, `angle = Pi/4`, projection `{Re z1, Re z2, cosA·Im z1 + sinA·Im z2}`, `ViewPoint->{2.9, 1.0, 1.4}`, "xiSteps must be odd", and eq. (9) χ = 3n − n² for the compact curve.
- **"The famous picture."** Hanson's quintic cross-section renderings are the widely reproduced images used to represent string theory's hidden dimensions. <https://en.wikipedia.org/wiki/Andrew_J._Hanson>
- **Mesh checks for n = 3–6, run while preparing this pack:** |z₁ⁿ + z₂ⁿ − 1| ≤ 1.2×10⁻¹⁴; glued mesh χ = 2n − n²; n boundary circles; b₁ of the capped surface = 2g; loop a is non-trivial in homology. Script: simplicial homology mod a large prime. The referee reproduced all four results for n = 3–6 with an independent script, plus the projection bound (max radius 1.746 before scaling, at n = 3).
- **We observe three generations.** Light (m < m_Z/2) neutrino species from the Z line shape: **N_ν = 2.996 ± 0.007** (PDG 2024, "Number of neutrino types", <https://pdg.lbl.gov/2024/listings/rpp2024-list-number-neutrino-types.pdf>). This includes the corrected LEP luminosity of P. Janot, S. Jadach, *Phys. Lett. B* 803 (2020) 135319, arXiv:1912.02067, which gives 2.9963 ± 0.0074. The older LEP value 2.9840 ± 0.0082 (ALEPH, DELPHI, L3, OPAL, SLD et al., *Phys. Rept.* 427 (2006) 257, arXiv:hep-ex/0509008) is superseded.
- **No superpartners observed so far.** PDG reviews "Supersymmetry: theory / experiment," <https://pdg.lbl.gov>
- **Three-generation shapes.** The Tian–Yau manifold has χ = −18; its free ℤ₃ quotient has χ = −6, giving 3 generations. G. Tian, S.-T. Yau, "Three-dimensional algebraic manifolds with C₁ = 0 and χ = −6," in *Mathematical Aspects of String Theory* (San Diego 1986; World Scientific 1987) 543–559 (pages confirmed in INSPIRE). Hodge numbers (14, 23) → (6, 9) after the quotient. B. Greene, K. Kirklin, P. Miron, G. Ross, *Nucl. Phys. B* 278 (1986) 667.
- **A spectrum matching the (supersymmetric) Standard Model particle list.** V. Braun, Y.-H. He, B. Ovrut, T. Pantev, "The exact MSSM spectrum from string theory," *JHEP* 0605 (2006) 043, arXiv:hep-th/0512177: three families (each with a right-handed neutrino), one Higgs pair and no exotics, plus an extra U(1)_{B−L}. Their earlier "A heterotic standard model," *Phys. Lett. B* 618 (2005) 252, arXiv:hep-th/0501070, still had **two** Higgs pairs. Neither is a confirmed description of nature.
- **473,800,776 reflexive 4D polytopes; 30,108 distinct Hodge pairs.** M. Kreuzer, H. Skarke, *Adv. Theor. Math. Phys.* 4 (2000) 1209–1230, arXiv:hep-th/0002240. Data: <https://hep.itp.tuwien.ac.at/~kreuzer/CY/CYcy.html>, file <https://hep.itp.tuwien.ac.at/~kreuzer/pub/misc/alltoric.spec.gz>. In that file, 30,108 rows, χ from −960 to 960, max h¹¹ = h²¹ = 491 (the extremes are (491, 11) and (11, 491)), 208 pairs with |χ| = 6. The drafter counted these for this pack; the referee re-downloaded the file (108,883 bytes, 30,108 data rows plus one header) and reproduced every number. The arXiv abstract confirms 473,800,776 and 30,108.
- **Upper bound of 10⁴²⁸ topologically distinct CY hypersurfaces from that list.** M. Demirtas, L. McAllister, A. Rios-Tascon, *Fortsch. Phys.* 68 (2020) 2000086, arXiv:2008.01730.
- **Whether there are finitely many CY threefold types is open.** Yau suspects finitely many families; Reid conjectured infinitely many topological types. <https://en.wikipedia.org/wiki/Calabi%E2%80%93Yau_manifold>
- **"10⁵⁰⁰" counts flux vacua, not Calabi–Yau shapes.** S. Ashok, M. Douglas, *JHEP* 0401:060 (2004), arXiv:hep-th/0307049; M. Douglas, *C. R. Physique* 5 (2004), arXiv:hep-th/0409207.
- **No closed-form Ricci-flat metric is known for the quintic; it is approximated numerically.** M. Douglas, R. Karp, S. Lukic, R. Reinbacher, "Numerical Calabi–Yau metrics," *J. Math. Phys.* 49 (2008) 032302, arXiv:hep-th/0612075.
- **Unfixed (massless) moduli would mediate new long-range forces; none are seen.** Torsion-balance tests show that any extra force of gravitational strength must have a range below 56 μm (95% CL). A massless modulus would give an infinite-range force. D. J. Kapner et al., *Phys. Rev. Lett.* 98 (2007) 021101, arXiv:hep-ph/0611184.
- **Moduli counts for the quintic: 1 Kähler (size), 101 complex-structure (shape).** These are the same h¹¹ and h²¹ as above. Candelas, de la Ossa, Green, Parkes, "A pair of Calabi–Yau manifolds as an exactly soluble superconformal theory," *Nucl. Phys. B* 359 (1991) 21–74, doi:10.1016/0550-3213(91)90292-6.
- **Standard embedding: #27 = h²¹, #27̄ = h¹¹.** So the quintic gives 101 **27**s and 1 **27̄**, net 100. Y.-H. He, "An algorithmic approach to heterotic string phenomenology," *Mod. Phys. Lett. A* 25 (2010) 79–90, arXiv:1001.2419 (eq. for n₂₇, n₂₇̄).
- **Mirror symmetry of the Hodge plot** (h¹¹ ↔ h²¹ via polar-dual polytopes). V. Batyrev, "Dual polyhedra and mirror symmetry for Calabi–Yau hypersurfaces in toric varieties," *J. Alg. Geom.* 3 (1994) 493–545, arXiv:alg-geom/9310003.

---

## Pitfalls
1. **"That picture is a Calabi–Yau."** It is the 3D shadow of a 2D slice of a 6D shape, cut off at its rim. *Avoided:* B2 says "a shadow of a slice". The Lab labels the rim ("surface keeps going"), explains that overlaps are shadow artifacts, and lets α re-fold the shadow while nothing else changes.
2. **"The picture shows the true geometry."** The bends come from sitting in ℂ², not from the Ricci-flat metric, which nobody has in closed form for n ≥ 4. (For the n = 3 torus the Ricci-flat metric is simply the flat one.) *Avoided:* the Lab metric-note micro-copy, and the Numbers entry on numerical metrics.
3. **"String theory says the extra dimensions *are* Calabi–Yau."** CY shapes follow from specific assumptions: 4D supersymmetry, no background fluxes, and a heterotic or type II starting point. Other options include G₂ manifolds in M-theory, flux compactifications and orbifolds. *Avoided:* the thesis says "simplest, best-studied case"; B1 states the assumptions and flags supersymmetry as unobserved.
4. **"Particles are strings wrapped around the holes."** In this mechanism, massless families are zero-wiggle wave patterns counted by topology. Wound strings are heavy, and on the quintic they cannot even stay wound. *Avoided:* B3 uses the Ch. 05 wave-fitting picture. The Lab's winding experiment is framed only as a test of which loops trap.
5. **"The holes you see in the image are the holes that count families."** The quintic has *no* non-shrinkable loops at all (it is simply connected), and its family count uses 6D hole counts that can't be drawn. *Avoided:* the B4 ledger is titled "cannot be drawn". The Lab's "shrink in the full shape" button shows the slice loop escaping for n ≥ 4.
6. **"String theory predicts three generations" / "the quintic predicts 100."** The theory predicts neither number uniquely. The rule |χ|/2 holds in the simplest heterotic recipe (standard embedding). There the choice of shape sets the count; in other recipes the choice of gauge bundle matters too. So "the quintic is not ours" holds only within this recipe. *Avoided:* B4 says "in the simplest recipe" and "in this recipe, the quintic can't be ours", shows 100 vs observed 3, and adds "three is necessary, not sufficient".
7. **"There are 10⁵⁰⁰ Calabi–Yau shapes."** 10⁵⁰⁰ is an estimate of flux vacua. The Kreuzer–Skarke catalogue gives 473,800,776 polytopes and 30,108 Hodge pairs, with at most about 10⁴²⁸ hypersurfaces from it. Whether the total is finite is unknown. *Avoided:* B6 quotes only the catalogue numbers and the open finiteness question; 10⁵⁰⁰ is corrected here.
8. **"Ricci-flat means flat."** In 4 or more dimensions, Ricci-flat shapes can be curved; the bending cancels direction by direction. (In 2 or 3 dimensions, Ricci-flat does force flat.) *Avoided:* B1's rosette, drawn in a separate inset for a point of a 6D shape rather than on the flat torus, shows mixed positive and negative petals summing to zero, flagged as ANALOGY.
9. **"The extra dimensions are known to be Planck-sized."** Their size is model-dependent and unknown. *Avoided:* the gauge marker is hidden (`scale()` returns null) and a chapter caption reads "SIZE: UNKNOWN · DRAWN MAGNIFIED" throughout.
10. **"Calabi–Yau spaces were invented by string theorists."** The mathematics dates from 1954–78; physics adopted it in 1985. *Avoided:* the B1 timeline.
11. **"Supersymmetry/extra dimensions are established."** Neither is observed. *Avoided:* the Opening and B1 chips, plus the inline OBSERVED chip "no superpartner found so far".
12. **"Stretching the shape changes the particle list."** Smooth changes (moduli) shift masses and couplings, but not the Hodge numbers or the net family count. (Extra vector-like massless pairs can appear at special points.) *Avoided:* the B3 squash with the frozen readout, the Lab squash slider, and B5 on dials.

---

## Handoff
**IN:** Canonical **H2**: `<HandoffLoop/>` with default props at the origin, camera at `HANDOFF.camera` (FOV 35°, (0, 0, 10)), view shift [0, 0]. During 0.00–0.03 a Field-blue hairline circle fades in under the loop, so the Thread reads as wound around a curled-up dimension. Checked against `05-dimensions.md` Handoff OUT: Ch. 05 ends on H2 in front of a faint (15%) Field-blue lattice whose nodes carry hidden-shape glyphs, and it offers to keep or dissolve that lattice. This chapter may redraw the same 15% lattice at progress 0 and fade it out over 0.00–0.03, or simply let it dissolve away with Ch. 05's scene. The loop itself needs no repositioning.
**OUT:** Canonical **H2**. After the Lab, the geometry and Hodge plot fade to Void. The Thread unwraps from any loop, glides to center, grows to the canonical radius, turns to face the camera and wobbles gently. The camera returns to `HANDOFF.camera` with view shift [0, 0]. Checked against `07-branes.md` Handoff IN, which opens on H2 ("matches the convention that Chapter 06 ends on H2"), so no H1 fallback is needed.

---

## Referee notes
Refereed adversarially: every number, date, attribution and formula was checked against a primary source or recomputed. Scripts, the downloaded Kreuzer–Skarke file and Hanson's PDF were used for verification only; none ship with the site.

**Corrections made**
1. **Handoff camera was wrong.** The Opening put the first-frame camera at distance 5. `docs/ARCHITECTURE.md` and `src/core/handoff.ts` fix every handoff frame at `HANDOFF.camera` = FOV 35° at (0, 0, 10), with view shift [0, 0], so the dissolve from Ch. 05 would have jumped. The Opening now starts at (0, 0, 10) and eases to distance 5 by 0.08. The exit ramp returns to `HANDOFF.camera`.
2. **The scale gauge spec could not be built.** The shared gauge (`src/ui/Chrome.tsx`) accepts only meters or `null`, and chapters may not edit `src/ui`, so a dashed "?" needle is impossible. `scale()` now returns `null`, and the chapter pins its own `SIZE: UNKNOWN · DRAWN MAGNIFIED` caption.
3. **The Ricci rosette sat on a flat torus.** Every sectional curvature of a flat torus is zero, and in 2 or 3 dimensions Ricci-flat forces flat, so mixed bulging and pinching petals there would teach a falsehood. The rosette now sits in a separate inset for one point of a curved 6D Calabi–Yau. Its 5 petals are justified as the 5 planes through v in 6 real dimensions, since Ric(v,v) = Σᵢ K(v, eᵢ) over the 5 perpendicular directions. Pitfall 8 now states the dimension caveat.
4. **B3 showed stripes right after saying "zero wiggle".** The harmonic f = Re(z₁³) has stripes and exists only because the drawn slice is open. On a closed shape the only harmonic function is a constant, and the massless patterns that count holes are harmonic *forms*. The stage note now says so, the chip is reworded, and Go deeper adds that scalar zero modes are constants whatever the shape.
5. **Ledger arithmetic:** "101 ticks in an 11 × 10 grid plus 1" is 111. Now a 10 × 10 grid plus 1.
6. **"The quintic is not ours" overclaimed.** It follows only in the simplest recipe (standard embedding); other gauge bundles change the count. The B4 text now reads "in this recipe, the quintic can't be ours" (45 words), and the n = 5 micro-copy and Pitfall 6 match.
7. **Family glyph:** the triad of three dots invited confusion between "one family" and "three families" and echoed the proton = three marbles cartoon. It is now a 2 × 2 quad (two quarks, a charged lepton, a neutrino), matching the glossary.
8. **N_ν was out of date.** 2.984 ± 0.008 (LEP 2006) carried a 2σ tension that a corrected Bhabha luminosity removed (Janot and Jadach 2020: 2.9963 ± 0.0074). The footnote now uses the PDG 2024 value, 2.996 ± 0.007, and Numbers cites both.
9. **A heterotic Standard Model was mis-described.** Braun–He–Ovrut–Pantev, hep-th/0501070 (verified abstract), has **two** Higgs pairs and so does not match the MSSM list. The exact MSSM spectrum (plus U(1)_{B−L} and right-handed neutrinos) is their JHEP 0605 (2006) 043, hep-th/0512177. Numbers now cites both and adds "neither is a confirmed description of nature".
10. **B5 "Unfixed, they'd act as unseen new particles" was ambiguous.** It read as though harmless invisible particles were fine. It now says "Left loose, they'd add long-range forces never seen", with an `OBSERVED ●` chip sourced to Kapner et al., PRL 98 (2007) 021101 (verified abstract: gravitational-strength forces excluded beyond 56 μm).
11. **B6 invited "30,108 shapes".** Hodge pairs are not shapes. Added "often shared by many shapes" (43 words). The 10⁴²⁸ bound stays in Numbers and the Pitfalls.
12. **The thesis was unhedged.** "Would decide…" and "counting holes counts families" became "would help decide…" and "in the simplest recipe…".
13. **Micro-copy fixes.** n = 3 said "one-dimensional Calabi–Yau" while the other n use real dimensions; it now says "two real dimensions". n = 5 said "exactly what superstrings must hide", which implies the quintic *is* the hidden shape; it now says "as many as superstrings hide". "A real slice" became "a genuine slice", since "real slice" means something else in maths.
14. **The metric note was false at n = 3.** The Ricci-flat metric on the torus is the flat one and is known exactly. It now reads "Beyond the torus, nobody knows it in closed form", and Pitfall 2 matches.
15. **The Lab had no status chip,** which VISION §3 and ARCHITECTURE §3 require. Added `DERIVED ◑` + `ANALOGY ~`, with the split spelled out.
16. **Banned word:** the timeline label "YAU PROVES" became "YAU'S PROOF". The beat's "Yau proved it" is a literal mathematical proof and is kept.
17. **Implementability fixes.** B2's piece sweeps were timed in seconds inside a scroll-scrubbed beat; they are now in progress units (0.02 each, stagger 0.005, ending at 0.26). ω was used both for e^{2πi/n} and for an angular speed; the speed is now Ω. The squash map's "P" clashed with Hanson's projection and is now W (world space); normals under the non-linear D_s now use its Jacobian or dFdx/dFdy. Instanced tangents must take the same (k₁, k₂) rotation. The branch-point singularity of the parametrization is noted. The "~4×10⁻⁶" precision figure is now tied to n = 6 (3×10⁻⁷ at n = 5). The compact slice is defined precisely: the untruncated curve plus n points at infinity, with χ = 3n − n².
18. **Kreuzer–Skarke data handling.** The file starts with a header line `#spec=30108`, the server now redirects http to https, and the strict CSP forbids runtime fetches. So the data are preprocessed offline and bundled in the chapter folder, and the URLs now use https.
19. **Handoffs were checked against the neighbours.** `05-dimensions.md` OUT is H2 in front of a 15% lattice, and IN now says how to treat the lattice. `07-branes.md` IN is H2 and explicitly expects 06 to end on H2, so the speculative H1 fallback was removed.
20. **Citation hygiene.**
    - Calabi 1957: the unverifiable JSTOR link was replaced by Crossref DOI 10.1515/9781400879915-006, and the editors were added.
    - Yau 1978: title and DOI added; CPAM 31, 339–411 confirmed.
    - Batyrev: pages 493–545 (INSPIRE). CDGP: pages 21–74 and DOI (INSPIRE). Tian–Yau: title added; pages 543–559 confirmed in INSPIRE.
    - Hübsch: World Scientific 1992, doi:10.1142/1410 confirmed.
    - Hanson: the Notices 41(9) 1156–1163 citation was confirmed, and Table 1 was re-read (xiMax = 1, angle π/4, ViewPoint {2.9, 1.0, 1.4}, odd xiSteps, eq. 9).
    - Added the standard-embedding convention #27 = h²¹, #27̄ = h¹¹ (He, MPLA 25 (2010) 79, arXiv:1001.2419). The ledger's implicit assignment (the leftover h²¹ ticks become families) is therefore correct.
    - Added a source for "the famous picture" (Wikipedia, Andrew J. Hanson).
21. **Precision tweaks.**
    - Pitfall 12: moduli leave the Hodge numbers and the net family count fixed; vector-like pairs can appear at special points.
    - Glossary: a Calabi–Yau admits a Ricci-flat *Kähler* metric, and Ricci-flat bending "adds up to zero".
    - Go deeper: states the 27/27̄ split for the quintic, 101 and 1.

**Checked and confirmed without change**
- Loop a is non-trivial in H₁ for n = 3–6. Reproduced by an independent mesh-glue-cap homology script, and proved by a cell argument on the K_{n,n} dessin (see Model §4).
- The gluing rules in Model §1 were re-derived by hand. The same script gives χ(open) = 2n − n², n rims and b₁ = 2g.
- Euler characteristics 0, 24, −200 and 2610 were recomputed. The sextic value was also cross-checked through its Hodge numbers, with h³¹ = C(11,5) − 36 = 426.
- Genus values 1, 3, 6, 10. Triangle counts 40,000, 57,600 and 82,944. Projection radius ≤ 1.746·S ≈ 1.40. cos(π/2) ≈ 6.1×10⁻¹⁷.
- Kreuzer–Skarke (arXiv abstract, plus the file re-downloaded and parsed): 473,800,776 polytopes; 30,108 pairs; χ from −960 to 960; max 491; 208 pairs with |χ| = 6; exact mirror symmetry; 108,883 bytes.
- Demirtas–McAllister–Rios-Tascon: 10⁴²⁸, Fortsch. Phys. 68 (2020) 2000086.
- CHSW: NPB 258 (1985) 46–74 and its DOI. Greene–Kirklin–Miron–Ross: NPB 278 (1986) 667.
- Douglas–Karp–Lukic–Reinbacher: JMP 49 (2008) 032302. Ashok–Douglas: JHEP 0401:060. Douglas: C. R. Physique 5 (2004) 965.
- Wikipedia's Calabi–Yau article confirms: the name was coined by Candelas et al. (1985); SU(3) holonomy keeps a quarter of the supersymmetry; "Yau suspects… finite"; "conjectured by Miles Reid… infinite".
- Tian–Yau χ = −18 → −6 under ℤ₃ (Hodge numbers (14, 23) → (6, 9)).
- Beat word counts after the edits: 45, 41, 43, 45, 45, 45, 43. All micro-copy is ≤ 20 words. All glossary entries are ≤ 30 words.

**Status-chip audit:** no beat implies that string theory is tested, that Calabi–Yau shapes are observed, or that the extra dimensions have a known size. Supersymmetry is flagged as unobserved, and moduli stabilization is `SPECULATIVE`. All cartoons (drum, rosette, squash, escape, stripes) carry `ANALOGY ~`.

## Editor notes (cross-chapter pass, 2026-09-28)

1. **Repeated explanation removed.** The Opening redefined compactification ("Curling up is called compactification"), which Chapter 5's Beat 2 already introduces. The Opening now calls back to it instead: "Chapter 5 hid one dimension in a circle." The recovered words restore Chapter 5's hedge, "if it describes our world, six must hide". The earlier "so six must hide" read as fact. Still 45 words. The glossary entry is now only in Chapter 5. This pack's version also said "small", which Chapter 5's referee had deliberately removed.
2. **Jargon before introduction.**
   - Beat 1's "supersymmetry" is now a glossary link. This is its first use in any beat.
   - Beat 2's "the quintic" appeared before it was named. It is now "a six-dimensional Calabi–Yau, the quintic" (45 words).
3. **Glossary merges.**
   - `supersymmetry` (also defined in Chapter 10) takes Chapter 10's refereed caveat: string theory does not fix the partners' masses.
   - `moduli` absorbs Chapter 5's `modulus` ("stabilize").
4. **Visible copy.** The Go deeper drawer now reads "Chapter 5", not "Chapter 05".
