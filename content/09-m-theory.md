# 09 · One Map — Five theories, or one?

**Thesis:** The five superstring theories look like rival islands, but dualities connect them, and at strong coupling two of them grow an eleventh dimension. That suggests they are limits of one larger theory, M-theory, whose full formulation nobody knows.

**Overall status:** ◌ `CONJECTURED`. The five theories are ◑ `DERIVED` (consistent within string theory). T-duality links are ◑ `DERIVED` (exact in string perturbation theory). S-dualities, the eleven-dimensional lifts and the existence of M-theory are ◌ `CONJECTURED`: the evidence is strong but there is no proof. The islands-and-continent map is ~ `ANALOGY` throughout. None of it has been tested by experiment.

---

## Storyboard

Scene conventions for the engineer:
- **Camera and units.** Perspective camera, fov 35°. One world unit is about 1/6 of the viewport height at `HANDOFF.camera` (distance 10).
- **Overview camera** (used wherever this pack says "the overview"). It looks at the origin from the south (+Z) at pitch 55°, from distance `D_ov = max(18, 18/aspect)`, where aspect = width/height. Its height is `H_ov = D_ov·sin 55° ≈ 14.7` on desktop. This frames all six islands (radius 4.3, plus residents and labels) with a margin. At distance 11 the Type I island falls below the bottom edge of a 16:9 frame, and on a portrait phone the IIA, IIB, HO and HE islands fall outside the sides.
- **Map plane.** The map lies in the XZ plane, with y pointing up and "north" = −Z (the top of the screen in a top-down view). Sea level is y = 0.35.
- **Colors.** Only strings use `--filament`. The map, contours, bridges, walls and grids use `--field`. Labels are IBM Plex Mono, uppercase, placed as DOM overlays projected from world anchors.
- **Pinned labels.** Every ~ANALOGY chip is a small mono label pinned bottom-left.
- **Bridge line styles.** They encode status. Solid lines are ◑ DERIVED and dashed lines are ◌ CONJECTURED, matching the chip forms.
- **Scale gauge.** It reads `— · a map of theories, not of space` unless a beat says otherwise.

**Map geometry, shared by the story and the Lab.** Six tips lie at angles θⱼ, measured counter-clockwise from +X as seen from above:

| Tip | θ | Island center cⱼ = 4.3·(cos θ, 0, −sin θ) |
|---|---|---|
| 11D supergravity | 90° (north) | (0, 0, −4.30) |
| Type IIA | 30° | (3.72, 0, −2.15) |
| Type IIB | −30° | (3.72, 0, 2.15) |
| Type I | −90° (south) | (0, 0, 4.30) |
| Heterotic SO(32) (HO) | −150° | (−3.72, 0, 2.15) |
| Heterotic E8×E8 (HE) | 150° | (−3.72, 0, −2.15) |

This ring order is deliberate. Every neighbouring pair is joined by a duality, except IIB–I, which are related by an orientifold. The landmass is a six-cusped hypocycloid (see Lab › Model) whose cusps sit at radius 6 beyond each island.

### Opening: *handoff IN*
- **Text:** Chapter 8 found two pictures of one physics. Hold on to that. By 1985, string theory, hoped to be unique, came in five consistent versions, each in ten dimensions, each built differently. An embarrassment. Five theories, or one?
- **Status:** ◑ DERIVED (the five exist as consistent theories)
- **Stage:** The first frame is **H2**: `<HandoffLoop/>` with default props at the origin (radius 1.3, per `HANDOFF.H2`), camera at `HANDOFF.camera`, no view shift. It is one closed Thread loop at the center, facing the camera and gently wobbling.
  - **0.00–0.35.** The wobble gains a five-lobed shape: radial displacement `0.06·sin(5φ − 1.2t)`.
  - **0.35–0.65.** The loop pinches at four points and splits into five small loops of radius 0.3. They drift out to the vertices of a pentagon of radius 1.8. One of them (the future Type I) opens into a short open string with bright endpoints, next to a tiny closed loop.
  - **0.65–1.00.** The camera tilts from facing the loops (pitch 0°) to looking down at 55°, pulling out to the overview (distance `D_ov`). This reveals a dark sea: a Field-blue grid plane at 8% opacity, 40 × 40 units, cell size 1. The five small strings descend to their island centers (table above). As each one lands, its island rises out of the water: the heightfield peak grows from 0 to full over 0.6 s. A sixth mound at the north stays below sea level. Only a dark bump and a faint mono `?` show there.
  - Chapter 08 (now written) ends on this H2 with its cylinder fully faded. It may leave an optional seam hairline at 8% opacity. Dissolve that seam over progress 0.00–0.10.

### Beat 1: Five islands
- **Text:** Ask for supersymmetric strings in ten flat dimensions and only five consistent theories are known: Type I, IIA, IIB, and two [[heterotic string]]s. They differ in whether strings can be open, how waves running each way around a loop compare, and which symmetries come along.
- **Status:** ◑ DERIVED + ~ ANALOGY (islands; the "handedness" cartoons)
- **Stage:** The camera orbits the archipelago slowly (yaw +20° over the beat) and visits each island in turn. For each fifth of progress, the look-at target lerps to that island's center and the camera dollies to distance 5. The island's resident string plays its signature at a scale of about 0.6 units, and a mono caption appears beside it:
  - **Type I (0.0–0.2):** An open Thread (length 0.9, bright endpoints) and a closed loop (r = 0.25). They carry *standing* waves, symmetric, with no travel direction. Caption: `OPEN + CLOSED · NO ARROW (UNORIENTED) · SO(32)`.
  - **Type IIA (0.2–0.4):** A closed loop (r = 0.35) with two pulse trains, one running each way. Each pulse carries a short ribbon tick that twists as it travels: left-handed on the clockwise train and right-handed on the counter-clockwise one. Caption: `CLOSED · MIRROR-IMAGE MOVERS (NON-CHIRAL)`.
  - **Type IIB (0.4–0.6):** The same loop, but both trains twist the *same* way. Caption: `CLOSED · SAME-HANDED MOVERS (CHIRAL)`.
  - **Heterotic SO(32) (0.6–0.8):** A closed loop. Its clockwise train is smooth filament pulses (the superstring side). Its counter-clockwise train is denser, sharper pulses with 16 faint parallel sub-strands (the bosonic side's 16 extra internal directions). Emblem: one ring of 32 dots. Caption: `HYBRID STRING · SYMMETRY SO(32) · 496 FORCE CARRIERS`. (Do not write "496-dimensional": readers take that as 496 spacetime dimensions. 496 is the dimension of the symmetry group, which equals the number of force-carrier fields.)
  - **Heterotic E8×E8 (0.8–1.0):** The same hybrid loop. Emblem: two small rosettes (optional: the 240 E8 roots projected onto the Coxeter plane, 8 concentric rings of 30 dots each; verified numerically). Caption: `HYBRID STRING · SYMMETRY E8×E8 · 496 FORCE CARRIERS`.
  - Pinned label: `~ ANALOGY · "twist" stands for each mover's chirality. Counting supersymmetric theories in flat 10D; non-supersymmetric strings exist too.`
  - At progress 1.0 the camera returns to the overview (pitch 55°, distance `D_ov`).

### Beat 2: Shallow water
- **Text:** Each island marks where its theory is easy to use. There the [[string coupling]] g is small: strings rarely split or join, so approximate sums of simple worldsheets work. Offshore, g grows, the approximation fails, and the map goes blank.
- **Status:** ◑ DERIVED + ~ ANALOGY (sea = where approximations fail)
- **Stage:** The camera descends onto the IIA island (height 2.5, distance 5, pitch 30°) and looks along the horn toward the continent's center. Contour rings on the island are labelled `g = 0.01`, `0.03`, `0.1`, `0.3`. Here g is a function of radial distance ρ from the map center: `g(ρ) = 10^((4.3 − ρ)/1.3 − 1)`.
  - A small Field **probe** (a 0.08-unit diamond with a vertical hairline) walks inward from ρ = 5.6 (g = 0.01) to ρ = 3.0 (g = 1.0) as progress runs 0.1 → 0.9. A readout follows it: `g = …`.
  - Above the probe floats a vertical stack of four worldsheets, as in Chapter 03 but closed: a sphere, a torus, a two-holed torus and a three-holed torus (genus h = 0…3, each about 0.35 units). Each has a horizontal bar beside it whose length is `g^(2h)`, normalized to the sphere's bar. Label: `EACH HANDLE COSTS g²`.
    - At g = 0.01 only the sphere's bar is visible.
    - At g = 0.3 the bars read 1, 0.09, 0.008, 0.0007.
    - As g → 1 all four bars reach full length. The surfaces lose their crisp outlines and dissolve into sea fog (a noise-textured volume, Ink-3 at 30%). Label: `ALL WEIGHTS EQUAL · NO TERM CAN BE DROPPED`. (The bars show only the g-weights. The surfaces' own contributions still differ, so do not say the terms are equal.)
  - The shoreline (the sea-level crossing, at about ρ = 3.5, g ≈ 0.4) gets a thin bright Field line labelled `WHERE EASY CALCULATION ENDS`.
  - Pinned: `~ ANALOGY · the sea marks where approximation fails. Nothing physical happens at the shore.`

### Beat 3: Bridges
- **Text:** Some masses are pinned exactly by supersymmetry, at any coupling. Follow them offshore and bridges appear. Strongly coupled Type I matches weakly coupled heterotic SO(32) in every test made: [[S-duality]]. IIB maps onto itself. T-duality, Chapter 8's circle swap, joins IIA–IIB and heterotic–heterotic.
- **Status:** ◌ CONJECTURED (S-duality) + ◑ DERIVED (T-duality; BPS protection) + ~ ANALOGY (bridges)
- **Stage:** The camera rises to the overview. Bridges are built in sequence:
  1. **T-bridges (0.00–0.30).** Two low **causeways** lie on the water surface (y = 0.36): IIA–IIB and HO–HE. Each is a solid double Field hairline, 0.12 apart. At its midpoint sits a small rotating Field ring, the circle from Chapter 08, with chip ◑. The IIA–IIB label is `NEEDS A CIRCLE · R ↔ α′/R`. The HO–HE label is `NEEDS A CIRCLE + WILSON LINE · R ↔ ~α′/R`: with the Wilson line, the exact radius map differs from α′/R by a convention-dependent factor, so do not print a bare α′/R there. They lie *on* the surface because both ends stay weakly coupled: T-duality never leaves shallow water.
  2. **S-bridge (0.30–0.75).** A **dashed arch** from Type I to HO rises through the fog (apex y = 1.6), with midpoint label `g = 1`. On the Type I island a Field-blue **D-string** (a D1-brane from Chapter 07; drawn in Field, not filament, because it is a brane) lies beside the filament Thread. Two vertical tension bars stand beside them. The D-string then travels up the arch while a readout ticks `g_I: 0.1 → 1 → 10`.
     - Its bar shrinks as `1/g` and the F-string's bar stays fixed.
     - At the apex the two bars are equal.
     - On the way down it recolors from Field to filament and lands on the HO island as HO's resident Thread. Readout: `g_HO = 1/g_I = 0.1`.
     - Three small mono ticks appear along the arch: `LOW-ENERGY FIELDS ✓`, `PROTECTED SPECTRUM ✓`, `D-STRING = HETEROTIC STRING ✓`. Chip ◌.
  3. **IIB self-bridge (0.75–1.00).** A dashed loop arch leaves the IIB island and returns to it (apex y = 1.2), labelled `g ↔ 1/g · F-STRING ↔ D-STRING`, chip ◌. In a small inset, IIB's filament F-string and Field D-string swap colors as a mirrored g-readout passes 1.
  - **Hover note on the IIB–I gap** (no bridge drawn): `Type I = IIB with direction-blind strings plus D9-branes: an orientifold, not a duality.`
  - A pieces counter in the top right reads `SEPARATE PIECES 6 → 5 → 4 → 3` as bridges land. After this beat, 11D, {IIA, IIB} and {I, HO, HE} are still apart.

### Beat 4: The coupling was a size (*the aha*)
- **Text:** Turn up Type IIA's coupling. A ladder of new particles descends, evenly spaced: Chapter 5's signature of a hidden circle. The coupling was a size. An eleventh dimension opens, and the string turns out to be a [[membrane]] wrapped around it.
- **Status:** ◌ CONJECTURED + ~ ANALOGY (the circle is drawn inside 3D)
- **Stage:** This is the chapter's signature moment and runs in four phases.
  1. **Dive (0.00–0.15).** The camera flies to the IIA island. The resident loop grows until one long stretch of it fills the screen horizontally: a straight Thread 6 units long across the center, like H1 but closed off-screen. On the left, a vertical log **coupling gauge** appears (mono, `g` from 0.05 to 20, marker at 0.1). Behind the Thread, Chapter 05's faint lattice returns (7×7×3 nodes, spacing 1.2, 10% opacity) with a tiny ring at every node.
  2. **Turn it up (0.15–0.55).** g runs from 0.1 to 1 on a log scale, `log₁₀g = −1 + (p − 0.15)/0.40`. In phase 3 it continues as `log₁₀g = (p − 0.55)/0.25`, from 1 at p = 0.55 to 10 at p = 0.80, and then holds at 10. The ramp is piecewise so that g = 1, and with it the aha, lands exactly at the phase boundary. Two things change:
     - **The ladder.** A ladder on the right (x = +3.4) is drawn in Ink. Rung n sits at `y = −2.2 + 0.44·n/g`. Only rungs with y < 2.2 are drawn. A dashed Ink-3 line at `y = −1.76` is labelled `STRING SCALE 1/ℓ_s`. At g = 0.1 the first rung (M = 10/ℓ_s) sits exactly at the top edge, so it is not drawn. As g grows, the rungs slide down into view: `n = 1, 2, 3 … · D-PARTICLES BOUND TOGETHER`. The lattice rings grow with radius `0.035·g`.
     - **Two scale bars.** Under the Thread, a bar `R₁₁ = g ℓ_s` has length `0.35·g`. Beside it, a hatched bar `ℓ₁₁ = g^(1/3) ℓ_s`, labelled `11D PLANCK LENGTH`, has length `0.35·g^(1/3)`. This is the scale where eleven-dimensional gravity becomes strongly quantum. Do not call it a "grain" or a smallest length. While R₁₁ < ℓ₁₁ the Thread keeps its normal thickness: the circle is too small for an eleven-dimensional description to be useful, so the ten-dimensional string picture is the good one.
     - **Portrait phones.** Anchor the coupling gauge and the ladder in screen space, at 8% and 88% of the viewport width, instead of at world x = ±3.4, which falls off a narrow screen.
  3. **The aha (0.55–0.80).** g runs from 1 to 10. As `R₁₁/ℓ₁₁ = g^(2/3)` passes 1, the Thread **opens into a tube** of radius `clamp(0.35·g, 0, 2.2)`. Its wall is translucent. Its lengthwise lines stay filament and its rings around are Field. A curved arrow around the tube is labelled `AROUND: THE ELEVENTH DIMENSION`.
     - The ladder rungs crowd together. Once their spacing drops below 0.05 units they fuse into a smooth gradient, labelled `A CONTINUUM: THE CIRCLE IS NOW LARGE`.
     - Big caption, Bodoni italic: **"The coupling was a size."**
     - Readout: `R₁₁ = g·ℓ_s`.
     - A second readout: `membrane tension × 2πR₁₁ = string tension ✓`.
  4. **Landfall (0.80–1.00).** The camera pulls back out of the tube to the map. A new **dashed arch** grows from the IIA island north to the sixth mound. The mound rises above sea level and lights up, labelled `ELEVEN-DIMENSIONAL SUPERGRAVITY · 1978`. Its resident is a small Field membrane sheet, 0.5 × 0.5 units, rippling. The arch's midpoint label reads `R₁₁ ≈ ℓ₁₁`, chip ◌. The pieces counter drops from 3 to 2.
  - Pinned: `~ ANALOGY · the eleventh direction is drawn as a tube in 3D. The rule R₁₁ = g ℓ_s is the real content.`
  - Scale gauge: `R₁₁ = g·ℓ_s · ℓ_s itself unknown`.

### Beat 5: One landmass
- **Text:** Strongly coupled heterotic E8×E8 grows one too: a gap between two walls. Now pull back. Five islands and [[eleven-dimensional supergravity]] become six tips of one landmass. Witten's 1995 proposal: one theory, six limits. It was named [[M-theory]].
- **Status:** ◌ CONJECTURED + ~ ANALOGY (the map)
- **Stage:**
  1. **Walls (0.00–0.30).** A quick visit to the HE island. The resident Thread is shown as a long horizontal segment again. g runs from 0.1 to 10. Two parallel translucent Field **walls** (planes 6 × 3 units, 15% opacity, edges at 60%) appear above and below the Thread, with separation `clamp(0.7·g, 0.02, 4.4)`. Once the physical ratio d/ℓ₁₁ = g^(2/3) exceeds 1 (that is, g > 1; do not compute it from the visual separation), the Thread widens into a **ribbon** stretched from wall to wall: filament edges, translucent interior. Each wall carries a faint rosette and the label `E8`. Caption: `ONE E8 ON EACH WALL · FAR FROM BOTH: PLAIN ELEVEN DIMENSIONS`. Then the camera pulls back, and a dashed arch grows from HE to the 11D mound (midpoint `interval ≈ ℓ₁₁`), chip ◌. The pieces counter drops to `1`.
  2. **Pull back (0.30–1.00).** This is the reveal. The camera climbs on a log path from the overview height `H_ov` to 60, with pitch lerping from 55° to 85° (the same path as the Lab's Pull back). Sea opacity falls from 0.85 to 0.12, revealing the **submerged shelf**: the six-cusped hypocycloid landmass at height 0.12, outlined in Field hairlines. The islands turn out to be its six peaks. Each of the five string cusps is labelled `g → 0` in tiny mono. The 11D cusp is labelled `SIZES ≫ ℓ₁₁` instead: eleven dimensions have no string coupling, and this limit is not a weakly coupled string (Polchinski's Fig. 3 caption makes the same exception).
     - The causeways and arches become ridges on the shelf.
     - The interior stays filled with fog, with no contour lines, labelled `g ≈ 1 · NO WEAKLY COUPLED DESCRIPTION`.
     - At 0.80, a large Bodoni label fades in over the center: **M-theory**, with a ◌ chip.
     - At 0.90 the pinned label fades in: `~ ANALOGY · a 2D cartoon of a many-dimensional space. Tips are limits; real paths can change the hidden shape.`

### Beat 6: The unmapped interior
- **Text:** What is M-theory, exactly? Its full formulation is unknown. We know its limits and some exact features. "M" was left open: magic, mystery, membrane. [[Matrix theory]] (1996) proposes a definition, only in special settings. No experiment has tested any of it.
- **Status:** ◌ CONJECTURED
- **Stage:** The camera stays high and drifts slowly (yaw +8°).
  - The tips keep crisp contour lines, meaning mapped. The interior fog slowly churns (3D noise advected at 0.02 u/s), meaning unmapped.
  - One small survey marker is planted near the 11D tip: a Field flag labelled `MATRIX THEORY (BFSS 1996) · SPECIAL BACKGROUNDS ◌`.
  - The big "M" label shrinks to the top of the frame. Beneath it three italic words cycle, each for 1.2 s with cross-fades: *magic · mystery · membrane*. Then all three show together, with the small attribution `WITTEN'S SUGGESTION, AS REPORTED BY DUFF (1996): "ACCORDING TO TASTE"`.
  - A mono footer fades in: `EXPERIMENTAL TESTS: NONE YET · SEE CHAPTER 10`.

### Lab dock
The map stays where it is. The camera eases back down from the Beat 6 height to the overview over 1 s (Pull back = 0). The Lab panel (below) docks on the right, and the Beat 3–5 bridges reset to *off* so the visitor rebuilds them.

### Exit: *handoff OUT*
- **Stage (no text):**
  - The camera dives back to the IIA tip. The coupling gauge slides to g = 0.1: the tube shrinks back into a thin Thread, and the ladder rungs climb off the top of the screen.
  - The long Thread segment curls up into a loop. The camera pitches up to face it, and the map dissolves to Void.
  - Final frame: **H2**, `<HandoffLoop/>` with default props at the origin, camera at `HANDOFF.camera`, no view shift. One closed Thread loop at the center, facing the camera, gently wobbling.
  - The weak-coupling string we started with is back. It may be one face of something larger.

---

## Lab

**Title: The Duality Atlas.** One instrument panel with two stations (tabs: `MAP · DIAL`) that share the map stage. Choosing an island on the map opens it in DIAL.

**Purpose:** Discover that no single kind of duality connects everything, and watch a coupling turn into a distance.

### Controls

| Station | Control | Type · range | Default | Units |
|---|---|---|---|---|
| MAP | `T-duality` | toggle | off | — |
| MAP | `S-duality` | toggle | off | — |
| MAP | `Strong-coupling lift` | toggle | off | — |
| MAP | `Curl up more dimensions` (secondary, collapsed under "More") | toggle | off | — |
| MAP | `Pull back` | slider 0–1, continuous | 0 | camera height H_ov → 60 world units (log) |
| MAP | Island / bridge | hover (desktop) · tap (touch) | — | — |
| DIAL | `Theory` | segmented `I · IIA · IIB · HO · HE` | IIA | — |
| DIAL | `Coupling g` | log slider 0.05 – 20 | 0.1 | dimensionless |
| DIAL (IIB only) | `Show (p,q)-strings` | toggle | off | — |

### What changes on screen
- **MAP.** Toggling a duality type draws or removes its bridges, with a 0.5 s grow animation. Solid causeways are ◑ and dashed arches are ◌.
  - **Pieces readout.** `SEPARATE PIECES` counts connected components and can go from 6 down to 1. Each merge flashes the merged islands.
  - **Pull back.** The slider raises the camera and makes the sea translucent. The submerged shelf is revealed **only under islands and active bridges**. When the count reaches 1, the whole landmass fills in, the interior fog appears, and the `M-theory ◌` label shows. If the visitor pulls back before connecting everything, the unconnected shelf stays hidden, with the hint "Connect every island to see what lies beneath."
  - **Hover.** Hovering an island shows its one-line character and plays its resident animation from Beat 1. Hovering a bridge shows its dictionary, what it needs, and its status.
- **DIAL.** A close-up of the chosen island's resident with a coupling gauge. A small chart shows the two lightest string-like objects (IIA and HE also get the ladder or walls).
  - **Swap.** When the dial crosses the handover point, the labels swap to the dual description. The island on the minimap pulses, along with the bridge being crossed.
  - **Readouts.** Only formulas protected by supersymmetry are drawn as solid values. Anything unprotected is dashed and marked `estimate`.

### Model (what the engineer implements)

**Shared conventions.** ħ = c = 1. Lengths are in units of the chosen theory's string length `ℓ_s = √α′ = 1`. Factors of 2π follow the common convention `2κ₁₀² = (2π)⁷ g² ℓ_s⁸` and `2κ₁₁² = (2π)⁸ ℓ₁₁⁹`, as used in Polchinski and in Becker–Becker–Schwarz. The resulting dictionary is written out in Gubay & West, arXiv:1204.1403, eqs. (2.1.31)–(2.1.34). That is a separate paper, not BBS. Other textbooks shift the factors of 2π. Coupling slider: `u ∈ [0,1] → g = 10^(−1.301 + 2.602u)`.

**MAP station: faithful graph, cartoon terrain.**
- **Nodes:** `11D, IIA, IIB, I, HO, HE` at the island centers in the Storyboard table.
- **Edges** (type · status · midpoint label · hover text):

  | Type | Edge | Status | Midpoint label | Hover text |
  |---|---|---|---|---|
  | T | IIA–IIB | ◑ | `R = √α′` | "IIA on a circle of radius R = IIB on radius α′/R. Needs one dimension curled up." |
  | T | HO–HE | ◑ | `R ~ √α′` | "Heterotic SO(32) on a circle = E8×E8 on the dual circle, with a symmetry-breaking 'Wilson line'." |
  | S | I–HO | ◌ | `g = 1` | "Type I at coupling g = heterotic SO(32) at 1/g. Type I's D-string is the heterotic string." |
  | S | IIB–IIB (self-loop) | ◌ | — | "IIB at g = IIB at 1/g, fundamental and D-strings exchanged. Part of a larger SL(2,ℤ) symmetry." |
  | Lift | IIA–11D | ◌ | `R₁₁ ≈ ℓ₁₁` | "Strongly coupled IIA = M-theory on a circle of radius R₁₁ = g ℓ_s." |
  | Lift | HE–11D | ◌ | `interval ≈ ℓ₁₁` | "Strongly coupled E8×E8 = M-theory on an interval between two walls (Hořava–Witten)." |
  | Curl up more | IIA–HO and IIA–HE, drawn as one forked chord across the interior | ◌ | — | "Curl up four dimensions: IIA on a K3 surface = heterotic on a four-torus." |

- **Components:** union-find over the six nodes, recomputed on every toggle. Expected counts:

  | Active bridges | Pieces |
  |---|---|
  | none | 6 |
  | T | 4 |
  | S | 5 |
  | Lift | 4 |
  | T+S | 3 |
  | T+Lift | 2 (Type I alone) |
  | S+Lift | 3 |
  | T+S+Lift | **1** |
  | T+S+curl-up | 2 (11D alone) |

  So reaching 1 always needs the strong-coupling lift. This is faithful: in the ten-dimensional web, only the lifts reach eleven dimensions.
- **Landmass:** a six-cusped hypocycloid rotated 30°. `P(t) = Rot₃₀°(5cos t + cos 5t, 5 sin t − sin 5t)`, `t ∈ [0, 2π)`, mapped to `X = P.x, Z = −P.y`. Outer (cusp) radius 6, inner radius 4.
  - Precompute a 512² signed-distance texture `sdf(p)` over the square [−8, 8]² from a 720-point polyline, once on the CPU. Use the sign convention negative inside, positive outside.
  - `inside(p) = smoothstep(−0.15, 0.15, −sdf(p))`.
- **Heightfield** (192 × 192 grid, about 73k triangles). Each island is the whole horn toward its cusp, so the weakest coupling is the driest land.
  - For tip direction ûⱼ (unit vector at θⱼ), compute `alongⱼ = p·ûⱼ` and `latⱼ = |p − alongⱼ ûⱼ|`.
  - `islandⱼ(p) = smoothstep(3.3, 3.9, alongⱼ)·exp(−latⱼ²/0.5)`.
  - `h(p) = inside(p)·[0.12 + 0.9·maxⱼ aⱼ·islandⱼ(p)] − (1 − inside(p))·0.4`.
  - The per-island amplitude `aⱼ ∈ [0, 1]` drives the "rise" animations. The 11D island holds at `a = 0.2` (peak 0.30, a dark bump just below sea level) until Beat 4's landfall, then eases to 1 over 1 s.
  - With sea level 0.35, each shoreline crosses the horn axis at ρ ≈ 3.5, and the landmass outline trims the island's sides.
  - **g-contours:** arcs of constant ρ across each of the **five string islands** at `g = 0.01, 0.03, 0.1, 0.3` (ρ = 5.60, 4.98, 4.30, 3.68), clipped to land and drawn in Field at 25%. Each string cusp at ρ = 6 is labelled `g → 0` instead of a number. The 11D island gets no g-contours, because M-theory in eleven dimensions has no string coupling. Its cusp is labelled `SIZES ≫ ℓ₁₁`.
- **Reveal mask** under the translucent sea: `mask = max(maxⱼ islandⱼ(p) > 0.1, capsules of width 0.6 along active bridges)`. When pieces = 1, lerp the mask to `inside(p)` over 1.2 s.
- **Fog:** a 3D noise volume (height 0 → 0.8) with density `inside(p)·(1 − maxⱼ islandⱼ(p))`. It covers the whole interior and thins to nothing on the islands.
- **Coupling cartoon:** `g(ρ) = 10^((4.3 − ρ)/1.3 − 1)` along each of the five string horns (ρ = distance from the map center). This is ~ANALOGY. In the true moduli space the weak-coupling limit g → 0 lies infinitely far away (the distance grows like |ln g|), so each string cusp is labelled `g → 0` rather than being given a value. The 11D horn has no g.
- **Pull-back camera:**
  - Height `H = H_ov·(60/H_ov)^p`, starting from the overview camera (Storyboard conventions), so that the Lab and Beat 5 share one path.
  - Pitch `lerp(55°, 85°, p)`. The camera distance from the look-at target is `H / sin(pitch)`.
  - Look-at target `lerp(focusedIsland, origin, smoothstep(0, 0.5, p))`.
  - Sea opacity `lerp(0.85, 0.12, smoothstep(0.3, 0.8, p))`.
- **Island hover lines:** see Micro-copy.

**DIAL station: faithful formulas for protected quantities.**
- **IIA** (◌ CONJECTURED identification; the masses are BPS-exact within IIA).
  - `R₁₁ = g`, `ℓ₁₁ = g^(1/3)`, `R₁₁/ℓ₁₁ = g^(2/3)`.
  - D-particle ladder: `M_n = n/g` for `n = 1…200`. This is identical to a Kaluza–Klein tower `n/R₁₁` (Chapter 05's `nħc/R`).
  - Draw the rungs on a linear axis from 0 to 10 (units 1/ℓ_s), with a reference line at 1 labelled `STRING SCALE`.
  - Readout `RUNGS BELOW STRING SCALE = ⌈g⌉ − 1`.
  - Fuse the rungs into a gradient when the on-screen spacing is under 3 px.
  - Tube: radius `r_vis = clamp(0.35·g, 0, 2.2)`. Wall and ring opacity `smoothstep(0.8, 1.2, g^(2/3))`. Below that, draw the plain Thread.
  - Wrap check (constant, shown as a ✓ readout): `2πR₁₁ · T_M2 = 2πg / ((2π)²·g) = 1/(2π) = T_F1`, using `T_M2 = 1/((2π)² ℓ₁₁³)`.
  - The existence of a single bound state for each n is proven for n = 2 (Sethi–Stern). For all n it is supported by index calculations (Moore–Nekrasov–Shatashvili). Tooltip: "bound states: proven for n = 2, strongly supported for all n."
- **HE** (◌).
  - Wall separation grows with the same law as IIA, `R/ℓ₁₁ = g^(2/3)` (Hořava–Witten, eq. 2.8, where it is written R = λ^(2/3)). So `d = g` in string units, up to an order-one convention factor: the interval S¹/ℤ₂ has length πR if R is the covering circle's radius.
  - Visual: `d_vis = clamp(0.7·g, 0.02, 4.4)`.
  - The ribbon appears when `g^(2/3) > 1`. Label the walls `E8 | E8`.
- **Type I** (◌ for the duality; the tensions are BPS-exact).
  - `T_F1 = 1/(2π)`, `T_D1 = 1/(2π g)`, on a log axis from 10⁻³ to 10¹.
  - The bars cross at g = 1. For g > 1: recolor the D-string Field → filament and the F-string filament → Field-dashed. Relabel `NOW: HETEROTIC SO(32) AT g = 1/g_I`.
  - Note: the Type I F-string is not BPS (open strings can break), so its bar is solid only as the reference unit.
- **HO** (◌). The mirror of Type I.
  - `T_het = 1/(2π)` is BPS: it is the Type I D-string.
  - The Type I string's tension in heterotic units is `1/(2π g)`, from the frame relation `G_I = G_H/g_H`, `g_I = 1/g_H`. The referee re-derived it: the Nambu–Goto action gives `T_I ∫√(−det G_I) = T_I·g_I ∫√(−det G_H)`, so T_H = g_I·T_I = 1/(2π g_H). The same step maps the Type I D-string, 1/(2π g_I), to exactly 1/(2π), the heterotic string ✓. Draw the Type I string **dashed, `estimate`**, because it is not protected: it carries no conserved charge and can break.
  - At g > 1, relabel `NOW: TYPE I AT g = 1/g_H`.
- **IIB** (◌ S-duality; the tensions are BPS-exact).
  - Axion set to zero. `T(p,q) = (1/2π)·√(p² + q²/g²)` for coprime (p,q). F-string = (1,0), D-string = (0,1).
  - At g = 1 they are equal. For g > 1 the D-string is lighter; relabel `SAME THEORY AT 1/g · NAMES SWAPPED`.
  - With the toggle on, draw coprime lattice points `|p|,|q| ≤ 6` at `(p, q/g)`. Their distance from the origin is proportional to tension. At g and 1/g the pattern is the same, rotated 90° and rescaled. That is the visible self-duality.
- **Why solid lines can be trusted offshore** (shown as an ⓘ tooltip): these objects are BPS. Supersymmetry fixes their mass or tension from their charge, exactly, at every g.
- **Simplifications to flag:**
  - 10D flat backgrounds only.
  - One theory's string units at a time.
  - 2π conventions as stated.
  - The map is a 2D cartoon. The real space of backgrounds has many dimensions, and the II and heterotic families connect only through backgrounds with different hidden shapes (circle vs interval, or K3 vs T⁴).
- **Reduced motion:** no camera flights (cut with 300 ms cross-fades), a static fog texture, and resident animations frozen at phase 0. The coupling dial still updates instantly.
- **Fallback (no WebGL):** a static SVG of the six-cusp map with the three bridge types as toggleable SVG groups, and the pieces counter kept.

### Micro-copy (≤ 20 words each)
- MAP header: "Six theories, no bridges. Switch on each kind of duality and count the pieces."
- T toggle: "T-duality: curl one dimension into a circle; radius R becomes α′/R. ◑ Derived."
- S toggle: "S-duality: coupling g becomes 1/g. Strong becomes weak. ◌ Conjectured, heavily tested."
- Lift toggle: "Strong-coupling lift: the coupling becomes the size of an eleventh dimension. ◌ Conjectured."
- Curl-up toggle: "Curl up four more dimensions: IIA on K3 matches heterotic on a four-torus. ◌"
- Pieces = 1: "One piece: every island is a limit of one structure. Conjectured, not proven."
- Pieces > 1 on pull-back: "Connect every island to see what lies beneath."
- Map caveat: "~ANALOGY · a 2D cartoon of a many-dimensional space of possible backgrounds."
- Fog: "Here g ≈ 1. No approximation works. Largely unmapped."
- IIB–I gap: "Type I is IIB with direction-blind strings plus D9-branes: close relatives, not duals."
- Hover, Type I: "Open and closed strings, no arrow along them. Symmetry SO(32). 16 supercharges."
- Hover, IIA: "Closed strings; the two movers are mirror images (non-chiral). 32 supercharges."
- Hover, IIB: "Closed strings; both movers share one handedness (chiral). 32 supercharges. Its own S-dual."
- Hover, HO: "Hybrid closed string: super one way, bosonic the other. Symmetry SO(32)."
- Hover, HE: "The same hybrid string with symmetry E8×E8. Early favourite for particle-physics models."
- Hover, 11D: "Not a string theory: supergravity in eleven dimensions, the maximum allowed (1978)."
- DIAL header: "Turn the coupling. Watch what was heavy become light."
- IIA, g < 1: "The eleventh circle is smaller than the 11D Planck length. The ten-dimensional string picture works better."
- IIA, g > 1: "The circle outgrows the 11D Planck length. Space now has ten directions; with time, eleven."
- Ladder: "Spacing 1/(g ℓ_s): Chapter 5's rule for a circle of radius g ℓ_s."
- Wrap check: "Membrane tension × circumference = string tension. At every coupling."
- HE: "Two walls, one E8 on each. Far from both: plain eleven dimensions."
- Type I: "The D-string's tension falls as 1/g. Past g = 1 it is the lightest string."
- Type I, g > 1: "Relabel: this is heterotic SO(32), weakly coupled at 1/g."
- IIB: "Past g = 1 the D-string is lighter. Swap the names: IIB again, at 1/g."
- BPS tooltip: "Why trust this offshore? Supersymmetry fixes these tensions exactly: BPS objects."
- Scale caveat: "~ Not to scale. The string length ℓ_s itself is unknown."

### Audio (optional, muted by default)
- **MAP.** Each connected piece hums one sine tone. At the start there are 6 tones: a pentatonic scale's five notes plus the octave. When two pieces merge, their tones glide over 0.8 s to the lower one. At one piece, a single warm tone with its first five harmonics remains: six notes become one chord.
- **DIAL (IIA).** The ladder sounds as a harmonic series. The harmonic ratios `n·f₁` are exact, since M_n = n·M₁. The pitch is compressed so it stays audible: `f₁ = 220 Hz·(0.1/g)^0.5` (the true rung energy scales as 1/g). Clamp **f₁ only** to 40–220 Hz, then play the first eight rungs at exactly `n·f₁`, reaching at most 1760 Hz. Clamping each harmonic separately would break the exact ratios. As g grows the pitch falls and the harmonics crowd into a low, dense hum: the continuum, heard. This echoes Chapter 05's tower audio.

---

## Go deeper

**The dictionary between Type IIA and eleven dimensions.** Units are ħ = c = 1, in one common convention; textbooks differ by factors of 2π.

$$R_{11} = g_s\,\ell_s, \qquad \ell_{11} = g_s^{1/3}\,\ell_s$$

- **g_s** is the IIA string coupling (the Lab's dial).
- **ℓ_s** is the string length, √α′.
- **R₁₁** is the radius of the eleventh-dimensional circle (the tube).
- **ℓ₁₁** is the eleven-dimensional Planck length: the scale where eleven-dimensional gravity becomes strongly quantum. It is not a proven smallest length.

Their ratio, R₁₁/ℓ₁₁ = g_s^(2/3), is the whole story. At weak coupling the circle is far smaller than ℓ₁₁. No eleven-dimensional description is useful there, and the ten-dimensional string picture takes over. At strong coupling the circle is large, and space gains a tenth direction.

The evidence is a ladder. n D-particles bind into a single state (proven for n = 2, strongly supported beyond) of mass

$$M_n = \frac{n}{g_s\,\ell_s} = \frac{n}{R_{11}}$$

- **n** is the number of D-particles, which is also the number of wavelengths around the circle.
- **M_n** is the rung's mass. Supersymmetry protects it, so it holds at any coupling.

That is Chapter 05's Kaluza–Klein tower for a circle of radius R₁₁. The string fits too:

$$T_{\mathrm{F1}} = 2\pi R_{11}\,T_{\mathrm{M2}}, \qquad T_{\mathrm{M2}} = \frac{1}{(2\pi)^2\,\ell_{11}^{3}}$$

- **T_M2** is the membrane's tension (energy per area).
- **2πR₁₁** is the circle's circumference.
- **T_F1** is the string's tension, 1/(2πℓ_s²).

Substitute the first line and every g_s cancels. A membrane wrapped once around the circle has exactly the IIA string's tension, at any coupling. Heterotic E8×E8 follows the same scaling, with an interval in place of the circle (Hořava–Witten).

---

## Glossary
- `string coupling` — The number g that sets how likely a string is to split or join. Small g: approximations (perturbation theory) work. Near or above 1: they fail.
- `heterotic string` — A closed string whose waves running one way are superstring-like and the other way bosonic-string-like. It has two supersymmetric versions, with symmetry SO(32) or E8×E8.
- `S-duality` — A proposed exact equivalence swapping strong and weak coupling, g ↔ 1/g. It maps Type I to heterotic SO(32), and Type IIB to itself. Conjectured and heavily tested.
- `BPS state` — An object whose mass or tension supersymmetry fixes exactly by its charges, so it can be followed reliably from weak to strong coupling.
- `D-particle` — A D0-brane: Type IIA's pointlike D-brane, with mass 1/(g ℓ_s). Heavy at weak coupling, light at strong coupling.
- `membrane` — A two-dimensional extended object (the M2-brane). In M-theory, a membrane wrapped once around the eleventh-dimensional circle behaves exactly as the Type IIA string.
- `eleven-dimensional supergravity` — The supersymmetric theory of gravity in eleven dimensions, the maximum supersymmetry allows (1978). Believed to be M-theory's low-energy limit.
- `M-theory` — The conjectured single theory whose limits are the five superstring theories and eleven-dimensional supergravity. Its complete formulation is unknown.
- `moduli space` — The space of a theory's adjustable background values, such as its coupling and the sizes and shapes of hidden dimensions. Each point is one possible background.
- `Matrix theory` — The BFSS conjecture (1996): M-theory in certain backgrounds equals the quantum mechanics of N×N matrices as N grows without limit.

Referenced from other chapters, not redefined: `worldsheet` (Ch. 3, the Beat 2 handle stack), `D-brane` (Ch. 7), `T-duality` and `duality` (Ch. 8), `Kaluza–Klein tower` (Ch. 5, the Beat 4 ladder), `supersymmetry` (Ch. 6), `critical dimension` (Ch. 5).

---

## Numbers & facts
- **The five theories and their features.** These are the features used in the Beat 1 captions and the Lab hovers. Sources: Polchinski, *String Theory* vol. 2 (CUP 1998), chs. 10–13; Becker, Becker & Schwarz, *String Theory and M-Theory* (CUP 2007), chs. 4–8; comparison table at https://en.wikipedia.org/wiki/Superstring_theory.
  - **Type I:** open + closed unoriented strings, N = 1 in 10D (16 supercharges), chiral, SO(32).
  - **IIA:** closed oriented strings, N = (1,1) (32 supercharges), non-chiral.
  - **IIB:** closed oriented strings, N = (2,0) (32 supercharges), chiral.
  - **HO and HE:** closed hybrid strings, N = 1 (16 supercharges), chiral, SO(32) and E8×E8 respectively.
  - The gauge group written "SO(32)" is strictly Spin(32)/ℤ₂.
- **Type I and Type II superstrings**: M. B. Green and J. H. Schwarz, 1981–82, e.g. "Supersymmetrical string theories", *Phys. Lett. B* 109, 444 (1982).
- **Anomaly cancellation (1984)** selects SO(32) or E8×E8, both of dimension **496** (32·31/2 = 496; E8 has dimension 248, and 2 × 248 = 496). Green & Schwarz, *Phys. Lett. B* 149, 117 (1984). Two abelian groups, U(1)⁴⁹⁶ and E8×U(1)²⁴⁸, also pass this test but were later shown inconsistent (Adams–DeWolfe–Taylor, below). 496 is the number of force-carrier (gauge) fields.
- **Heterotic string, 1985**: Gross, Harvey, Martinec, Rohm, *Phys. Rev. Lett.* 54, 502 (1985). Left-movers bosonic (26D), right-movers super (10D); the 16 extra dimensions form one of the two even self-dual lattices in 16D. https://en.wikipedia.org/wiki/Heterotic_string_theory
- **E8×E8 used for early particle-physics models**: Candelas, Horowitz, Strominger, Witten, *Nucl. Phys. B* 258, 46 (1985).
- **"Five" means supersymmetric theories in flat 10D.** Non-supersymmetric 10D strings also exist, e.g. the tachyon-free O(16)×O(16) heterotic string: Alvarez-Gaumé, Ginsparg, Moore, Vafa, *Phys. Lett. B* 171, 155 (1986); Dixon & Harvey, *Nucl. Phys. B* 274, 93 (1986). Adams, DeWolfe and Taylor show that the U(1)⁴⁹⁶ and E8×U(1)²⁴⁸ N = 1 supergravities are inconsistent. Their abstract concludes that "in ten dimensions all supersymmetric theories of gravity without known inconsistencies are realized in string theory." Note the "without known inconsistencies"; the result is not stated as a proof of completeness. *PRL* 105, 071601 (2010), arXiv:1006.1352.
- **Ten dimensions** (the critical dimension) is covered in Chapter 05's sources.
- **Eleven is the maximum dimension for supergravity**: W. Nahm, *Nucl. Phys. B* 135, 149 (1978). Polchinski's colloquium, §4.1, adds: "beyond eleven the massless multiplets would contain spins higher than two" (checked against hep-th/9607050). **11D supergravity**: Cremmer, Julia, Scherk, *Phys. Lett. B* 76, 409 (1978).
- **Perturbation theory**: the genus-h closed-string worldsheet is weighted by g^(2h−2), so each handle costs a relative g². Source: Polchinski vol. 1, ch. 3 and ch. 9; Tong, *Lectures on String Theory*, arXiv:0908.0333, ch. 6.
- **"Over most of the space, the string coupling g is of order 1"**, the cusps are weak-coupling limits, and the figure "is actually an oversimplification", with different limits involving different topologies of the compact dimensions. J. Polchinski, "String duality: a colloquium", *Rev. Mod. Phys.* 68, 1245 (1996), hep-th/9607050, Fig. 3 and §3.5 (quotes checked against the arXiv text). The Fig. 3 caption reads: "The cusps are limits in which a weakly coupled string description is possible (except for the M-theory limit)." That is why the 11D cusp is not labelled g → 0.
- **T-duality IIA ↔ IIB**: Dai, Leigh, Polchinski, *Mod. Phys. Lett. A* 4, 2073 (1989); Dine, Huet, Seiberg, *Nucl. Phys. B* 322, 301 (1989).
- **T-duality HO ↔ HE** (on a circle, with a Wilson line): Narain, *Phys. Lett. B* 169, 41 (1986); Narain, Sarmadi, Witten, *Nucl. Phys. B* 279, 369 (1987); Ginsparg, *Phys. Rev. D* 35, 648 (1987). T-duality holds at all orders of string perturbation theory, hence the ◑ chip.
- **Early strong–weak (S-duality) conjecture in string theory**: Font, Ibáñez, Lüst, Quevedo, *Phys. Lett. B* 249, 35 (1990). It is an SL(2,ℤ) acting on the dilaton–axion field S, which is the source of the later name. Who first used the phrase "S-duality" was not checked. Evidence from dyon bound states: A. Sen, *Phys. Lett. B* 329, 217 (1994), hep-th/9402032, in four-dimensional heterotic strings.
- **Hull & Townsend, "Unity of superstring dualities"**, hep-th/9410167, submitted 21 Oct 1994; *Nucl. Phys. B* 438, 109 (1995). Covers U-duality and IIB SL(2,ℤ) self-duality.
- **Townsend, "The eleven-dimensional supermembrane revisited"**, hep-th/9501068, submitted 17 Jan 1995; *Phys. Lett. B* 350, 184 (1995). Argues that IIA is compactified 11D, with IIA's charged extreme black holes as Kaluza–Klein modes. These are the objects later recognized as D0-branes. The term "D-brane" goes back to Dai–Leigh–Polchinski (1989), and their role as RR-charge carriers to Polchinski (Oct 1995).
- **Strings '95** was held at the University of Southern California, Los Angeles, **13–18 March 1995**. The referee checked this against INSPIRE conference record C95-03-13, "STRINGS 95: Future Perspectives in String Theory". Proceedings: eds. I. Bars, P. Bouwknegt, J. Minahan, D. Nemeschansky, K. Pilch, H. Saleur, N. Warner (World Scientific, 1996). Witten's written contribution is "Some comments on string dynamics", hep-th/9507121, p. 501. It opens: "My lecture at Strings '95 focussed on determining the strong coupling behavior of various string theories in various dimensions." The spoken talk's title could not be verified (the USC program page returns HTTP 500), so do not print one.
- **Witten, "String theory dynamics in various dimensions"**, hep-th/9503124, submitted 20 March 1995; *Nucl. Phys. B* 443, 85 (1995). It covers IIA → 11D at strong coupling, Type I ↔ HO (which Witten called "a curious speculation"), and IIA on K3 ↔ heterotic on T⁴. Together with the T-dualities, this gives "a web of connections between the five string theories and eleven-dimensional supergravity". That is the "one theory, six limits" proposal of Beat 5. For ten-dimensional E8×E8, Witten wrote "I have no proposal to make". Its eleventh dimension came in October 1995 from Hořava–Witten.
- **The name "second superstring revolution"** and Witten's USC conjecture: https://en.wikipedia.org/wiki/M-theory
- **IIA on K3 ↔ heterotic on T⁴**: Hull & Townsend (1994); Witten (1995); A. Sen, hep-th/9504027, *Nucl. Phys. B* 450, 103 (1995).
- **D-branes as the carriers of RR charge**: Polchinski, *PRL* 75, 4724 (1995), hep-th/9510017.
- **Type I ↔ HO evidence** ("the Dirichlet one-brane of type I … has the same world-sheet structure as the heterotic string"): Polchinski & Witten, hep-th/9510169, *Nucl. Phys. B* 460, 525 (1996). The map is g_I = 1/g_H, with string-frame metrics related by the coupling: Polchinski vol. 2, ch. 14.
- **IIB (p,q)-strings**: Schwarz, "An SL(2,Z) multiplet of type IIB superstrings", hep-th/9508143, *Phys. Lett. B* 360, 13 (1995). Bound states need coprime (p,q): Witten, hep-th/9510135, *Nucl. Phys. B* 460, 335 (1996). Tension T = (1/2πα′)√(p² + q²/g²) when the axion vanishes (Polchinski vol. 2, chs. 13–14; BBS ch. 8; section and equation numbers not checked).
- **IIB's SL(2,ℤ) equals the modular group of M-theory's two-torus**: Schwarz (1995) above; Aspinwall, hep-th/9508154, *Nucl. Phys. Proc. Suppl.* 46, 30 (1996).
- **Hořava–Witten**:
  - "Heterotic and Type I string dynamics from eleven dimensions", hep-th/9510209, submitted 29 Oct 1995; *Nucl. Phys. B* 460, 506 (1996). It gives the same relation R = λ^(2/3) (in 11D Planck units) for E8×E8 as for IIA. A generic observer far from the walls "sees simply eleven-dimensional supergravity".
  - "Eleven-dimensional supergravity on a manifold with boundary", hep-th/9603142, *Nucl. Phys. B* 475, 94 (1996). Anomaly cancellation puts one E8 on each boundary.
- **The dictionary**: R₁₁ = g_s ℓ_s, ℓ₁₁ = g_s^(1/3) ℓ_s, T_M2 = 1/((2π)² ℓ₁₁³), T_F1 = 1/(2πℓ_s²). Sources: Gubay & West, arXiv:1204.1403, eqs. (2.1.31) and (2.1.34) (checked); BBS ch. 8, "M-theory and string duality" (not ch. 6, which is T-duality and D-branes); Polchinski colloquium §4.1 ("a new, eleventh, dimension with R = g/Ms", checked). Consistency check by the referee: the unwrapped M2 must equal the IIA D2, and T_M2 = 1/((2π)² g ℓ_s³) = τ₂ from Polchinski's τ_p formula ✓.
- **D-particle mass** M_s/g, with n-particle bound states of mass nM_s/g. Source: Polchinski colloquium §4.1. D0 mass 1/(g ℓ_s) is the p = 0 case of the D-brane tension τ_p = 1/(g (2π)^p α′^((p+1)/2)): Polchinski vol. 2, ch. 13.
- **Existence of the D0 bound states**: the two-particle case was proven by Sethi & Stern, hep-th/9705046, *Commun. Math. Phys.* 194, 675 (1998). For general N, Moore, Nekrasov and Shatashvili computed the principal (bulk) contribution to the index, Σ_{d|N} 1/d², which gives 1 once combined with the conjectured boundary term: hep-th/9803265, *Commun. Math. Phys.* 209, 77 (2000). Hence "strongly supported", not "proven", for all n.
- **The IIA string as a wrapped membrane**: Duff, Howe, Inami, Stelle, *Phys. Lett. B* 191, 70 (1987). Supermembrane: Bergshoeff, Sezgin, Townsend, *Phys. Lett. B* 189, 75 (1987). Pictured as Fig. 5 in Polchinski's colloquium.
- **The name "M"**: "we will non-committally call it the M-theory, leaving to the future the relation of M to membranes" (Hořava–Witten 1995, hep-th/9510209, introduction; checked). "Witten has suggested that in the meantime, M should stand for 'Magic', 'Mystery' or 'Membrane', according to taste" (M. J. Duff, *Int. J. Mod. Phys. A* 11, 5623 (1996), hep-th/9608117, §1; checked). Duff's §1 also calls the five theories "an embarrassment of riches", which is the source of the Opening's "An embarrassment". Witten later said: "I thought my colleagues would understand that it really stood for membrane. Unfortunately, it got people confused." (A. Gefter, *Trespassing on Einstein's Lawn*, Random House 2014, p. 345, as quoted at https://en.wikipedia.org/wiki/M-theory; the book itself was not checked, so keep this quote off-screen or attribute it "as quoted by Gefter").
- **Some authors use "M-theory" for the 11D corner only**: Duff (1996), footnote 4 ("For us, M-theory means the whole kit and caboodle"; checked). Polchinski's colloquium Fig. 3 itself labels the eleven-dimensional cusp "M-theory".
- **Matrix theory**: Banks, Fischler, Shenker, Susskind, "M theory as a matrix model: a conjecture", hep-th/9610043, submitted 7 Oct 1996 (checked); *Phys. Rev. D* 55, 5112 (1997). The conjecture is about uncompactified eleven-dimensional M-theory, as the N → ∞ limit of D0-brane matrix quantum mechanics. Hence "special settings".
- **"A complete formulation of M-theory is not known"**: https://en.wikipedia.org/wiki/M-theory. Also Polchinski (1996): "whose short distance physics is not understood".
- **Other partial definitions (context, not on screen)**: AdS/CFT, Maldacena, hep-th/9711200 (1997). M2-branes on AdS₄×S⁷ ↔ the ABJM theory, arXiv:0806.1218 (2008).
- **Weak-coupling limits lie at infinite distance** in moduli space, because the dilaton's kinetic term gives distance ∝ |ln g|. Source: Ooguri & Vafa, "On the geometry of the string landscape and the swampland", hep-th/0605264, *Nucl. Phys. B* 766, 21 (2007). For the IIB dilaton–axion moduli space SL(2,ℤ)\SL(2,ℝ)/SO(2) they note that "a geodesic length toward i∞ is logarithmically divergent", T ∼ log(Im τ), and Im τ = 1/g (checked). The earlier "Polchinski vol. 2, ch. 12" pointer was not a specific source for this and has been replaced.

---

## Pitfalls
1. **"M-theory has been proven" or "string theory became M-theory and was confirmed."** The overall chip is ◌ CONJECTURED. Beat 6 says the formulation is unknown and that no experiment has tested it. The Lab's pieces-equals-1 message says "Conjectured, not proven."
2. **"M-theory is the theory of everything."** That phrase is banned, and the pack never implies that M-theory picks out our universe. It says "one theory, six limits". The map is a space of *possible backgrounds*, and nothing says which one, if any, is ours.
3. **"M-theory is just eleven-dimensional supergravity."** The 11D corner is labelled `ELEVEN-DIMENSIONAL SUPERGRAVITY`, and M-theory is the whole landmass. Numbers & facts notes that some authors use "M-theory" for the corner alone (Duff's footnote), so readers won't be confused by other sources.
4. **"Chapter 05 said ten dimensions, now it's eleven. Which is it?"** Beat 4 answers this. The eleventh dimension's size *is* the IIA coupling. At weak coupling it is smaller than the eleven-dimensional Planck length, where no eleven-dimensional description is useful, so ten is the weak-coupling count. The pack avoids calling ℓ₁₁ a "grain" or a smallest length. Both statements hold in their regimes.
5. **"Physicists had five rival theories and picked a winner."** No island wins: each is the good description near its own tip. The pack also notes that "five" counts supersymmetric theories in flat 10D. Non-supersymmetric strings exist, and many more theories appear once dimensions curl up.
6. **"All five theories turn into M-theory at strong coupling."** Only IIA and E8×E8 grow an eleventh dimension. Type I and heterotic SO(32) swap with each other, and IIB maps to itself. The Lab's DIAL shows each case separately.
7. **"All dualities are equally solid."** Status is encoded in form. T-duality causeways are solid ◑ (exact in perturbation theory). S-duality and lift arches are dashed ◌. The Beat 3 text says Type I and heterotic SO(32) "match in every test made", not that they are proven equal.
8. **"How can anyone know what happens at strong coupling if calculations fail there?"** Beat 3 answers this directly: supersymmetry pins certain masses exactly (BPS states). The DIAL draws only protected quantities as solid and marks the one unprotected tension `estimate`.
9. **"The star diagram is a literal map."** It is flagged ~ANALOGY at every appearance. The Lab caveat says the real space has many dimensions, and that Type II and heterotic families connect only through backgrounds with different hidden shapes. That is also why the lift is needed to reach "1 piece". Polchinski's own "oversimplification" warning is cited.
10. **"M stands for Mother" (or Matrix, or Master).** The pack quotes the sources: "non-committally … leaving to the future the relation of M to membranes", and "magic, mystery or membrane, according to taste". Matrix theory is presented as a separate 1996 proposal. Other expansions are later glosses.
11. **"M-theory is a theory of membranes instead of strings."** The pack says the IIA string *behaves exactly as* a wrapped membrane in the eleven-dimensional picture. It never claims that fundamental membranes are M-theory's building blocks, which Hořava–Witten and Polchinski doubted.
12. **"The IIA string becomes an eleven-dimensional string at strong coupling."** Beat 4 shows the correct picture (Polchinski's Fig. 5c): the string opens into a *tube*, a membrane wrapped around the new circle.
13. **"Witten discovered all the dualities in one talk."** Numbers & facts credits the history:
    - T-dualities: 1986–89.
    - An early S-duality conjecture: Font–Ibáñez–Lüst–Quevedo, 1990.
    - Sen, 1994.
    - Hull–Townsend, 1994.
    - Townsend, January 1995.
    - Duff–Howe–Inami–Stelle, 1987.
    - Polchinski's D-branes, 1995.
    - Hořava–Witten, 1995–96.

    Beat 5 calls Witten's contribution a "proposal" that tied these together. His own paper calls Type I ↔ HO "a curious speculation" and leaves ten-dimensional E8×E8 open.
14. **"Strong coupling means a strong force we could feel."** Beat 2 defines g as how often strings split or join, and Beat 4 reinterprets it as a *size*. Neither is a force.
15. **"Chirality means the string spins left or right."** The twist ticks are flagged ~ANALOGY as standing for each mover's chirality (the handedness of its supersymmetry), not for any literal rotation of the string.

---

## Handoff
**IN:** H2: `<HandoffLoop/>` with default props at the origin (radius 1.3), camera at `HANDOFF.camera`, view shift [0, 0]. This matches Chapter 08's written OUT: H2 with the cylinder fully faded, plus an optional seam hairline at 8%. Chapter 09 dissolves that seam over its first 10% of progress. The loop then gains five lobes and splits into the five island residents.

**OUT:** H2 again, on a Void background: `<HandoffLoop/>` with default props at the origin, camera at `HANDOFF.camera`, view shift [0, 0]. The camera dives back to the IIA tip, the coupling returns to g = 0.1, the tube shrinks back into a thin Thread, and the Thread closes into one loop facing the camera, gently wobbling. Chapter 10's IN starts from H2 (checked against `10-scale-problem.md`): its capsule renderer blurs the loop into the H0 glow during its opening pull-back. Chapter 10 then zooms out to ask why no experiment has seen a string.

---

## Referee notes

Adversarial referee pass, 2026-09-28. I verified the citations against arXiv full texts (hep-th/9607050, 9608117, 9510209, 9510169, 9503124, 9507121, 0605264, 1204.1403) and against INSPIRE records for every journal reference. I recomputed all derived numbers in Python: the map geometry, contours, shoreline, pieces table, E8 projection, tension algebra and camera framing. Each correction below was made in place.

**Physics and epistemics**
1. **11D cusp was labelled `g → 0`.** Eleven-dimensional M-theory has no string coupling. Polchinski's Fig. 3 caption excludes the M-theory cusp from the weak-coupling limits, and Duff notes that "in D = 11 there is neither dilaton nor moduli". Fixed: the 11D cusp now reads `SIZES ≫ ℓ₁₁`, the 11D island has no g-contours, and the coupling cartoon covers the five string horns only.
2. **ℓ₁₁ was called "the grain"** (Beat 4, Go deeper, Pitfall 4). That implies a proven granular minimum length, a banned misconception. Fixed: the bar is labelled `11D PLANCK LENGTH` and described as the scale where 11D gravity becomes strongly quantum. The text now says why R₁₁ < ℓ₁₁ matters: below it no eleven-dimensional description is useful, rather than "the circle is invisible".
3. **`496-DIMENSIONAL` captions** (HO, HE) would read as 496 spacetime dimensions to this audience. They now say `496 FORCE CARRIERS`, which is the dimension of the gauge group, matching Chapter 07's "force carriers".
4. **Beat 1 said "superstrings"** while claiming five theories. Non-supersymmetric strings with worldsheet supersymmetry, such as O(16)×O(16) and Type 0, are also "superstrings". It now says "supersymmetric strings" (still 45 words).
5. **Adams–DeWolfe–Taylor was overstated** as "every consistent 10D SUSY gravity theory has a string realization". Their abstract says "without known inconsistencies". Fixed, and I added that U(1)⁴⁹⁶ and E8×U(1)²⁴⁸ passed Green–Schwarz but fail ADT.
6. **Beat 2 label "ALL TERMS EQUAL"**: only the g-weights become equal, not the amplitudes. It is now `ALL WEIGHTS EQUAL · NO TERM CAN BE DROPPED`.
7. **HO–HE causeway printed `R ↔ α′/R`.** With a Wilson line the radius map carries a convention-dependent factor. The label is now `R ↔ ~α′/R` plus `WILSON LINE`; the IIA–IIB label is unchanged.
8. **Townsend (Jan 1995) described with "D0 charges".** He wrote of charged extreme black holes, before D-branes were identified as RR carriers (Polchinski, Oct 1995). Reworded.
9. **"The term S-duality: FILQ 1990"** has not been verified as a coinage. It is reworded as "an early S-duality conjecture" (SL(2,ℤ) on the S field). Sen 1994 is noted as four-dimensional.
10. **MNS 1998** computed the *bulk* contribution to the D0 index for general N, not a full proof. The wording now says this explicitly; "strongly supported" stays.
11. I checked the HO dial's Type I string tension of 1/(2π g_H) (drafter's flag 3) and confirm it: frame change of the Nambu–Goto action, T_H = g_I·T_I. The same step sends the Type I D-string to exactly 1/(2π). The `estimate` marking is correct because the Type I string has no conserved charge.
12. I checked the dictionary R₁₁ = gℓ_s, ℓ₁₁ = g^(1/3)ℓ_s, T_M2 = 1/((2π)²ℓ₁₁³) and confirm it. The unwrapped M2 reproduces Polchinski's D2 tension, and the wrap check 2πR₁₁·T_M2 = 1/(2πℓ_s²) holds.

**Citations**
13. **arXiv:1204.1403 was presented as Becker–Becker–Schwarz.** It is Gubay & West, "Parameters, limits and higher derivative type II string corrections" (2012). It does contain the dictionary, in eqs. 2.1.31 and 2.1.34, so it stays, correctly attributed.
14. **"BBS ch. 6" for the M-theory dictionary** is the wrong chapter: ch. 6 is T-duality and D-branes. Changed to ch. 8, "M-theory and string duality".
15. **Strings '95 dates confirmed**: 13–18 March 1995, Los Angeles (INSPIRE conference C95-03-13), with the full editor list added. The talk title "Some problems of strong and weak coupling" **could not be verified** and was removed. It is replaced by Witten's verified proceedings paper, "Some comments on string dynamics" (hep-th/9507121, p. 501), and its own summary of the lecture.
16. **Witten hep-th/9503124 is now quoted directly.** It says "web of connections between the five string theories and eleven-dimensional supergravity", which justifies Beat 5's "one theory, six limits". It calls Type I ↔ HO "a curious speculation" and says "I have no proposal to make" for 10D E8×E8, which Hořava–Witten supplied in Oct 1995.
17. **Infinite-distance claim** (drafter's flag 10): the vague "Polchinski vol. 2 ch. 12" is replaced by Ooguri–Vafa, hep-th/0605264, which states a logarithmically divergent geodesic toward g → 0.
18. **Gefter quote**: added p. 345, as cited on Wikipedia. The book itself was not checked, so the quote stays attributed "as quoted".
19. **Verified verbatim against the arXiv PDFs**: Hořava–Witten "non-committally" and R = λ^(2/3) (eq. 2.8); the "generic observer … sees simply eleven-dimensional supergravity"; Duff's "Magic/Mystery/Membrane, according to taste" (§1) and "kit and caboodle" (footnote 4); Polchinski–Witten's "Dirichlet one-brane … same world-sheet structure"; and the Polchinski colloquium quotes ("order 1", "oversimplification", "R = g/Ms", "Ms/g", "nMs/g", "spins higher than two").
20. **Journal references confirmed on INSPIRE** (drafter's flag 7, all correct): GS PLB 109, 444 and PLB 149, 117; GHMR PRL 54, 502; CHSW NPB 258, 46; AGMV PLB 171, 155; Dixon–Harvey NPB 274, 93; Nahm NPB 135, 149; CJS PLB 76, 409; DHIS PLB 191, 70; BST PLB 189, 75; Sen PLB 329, 217 = hep-th/9402032; FILQ PLB 249, 35; Narain; NSW; Ginsparg; DLP; DHS; Sethi–Stern; MNS; Schwarz; Witten NPB 460, 335; Aspinwall; HW NPB 475, 94; Sen NPB 450, 103; Polchinski PRL 75, 4724; PW NPB 460, 525; BFSS (7 Oct 1996); ADT; Duff; Hull–Townsend (21 Oct 1994); Townsend (17 Jan 1995); Witten (20 Mar 1995); HW (29 Oct 1995).
21. **Polchinski vol. 2 is still cited at chapter level only** (flag 2). The (p,q) tension now cites chs. 13–14, with a note that section numbers were not checked.

**Implementation and pedagogy**
22. **Beat 4 coupling ramp bug.** `log₁₀g = −1 + 2(p − 0.15)/0.65` reaches g = 1 at p = 0.475, not at the phase boundary 0.55, where it gives g = 1.70. The aha would have fired early, inside phase 2. It is now piecewise, with g = 1 exactly at p = 0.55 and g = 10 at 0.80.
23. **Overview camera cropped the map.** At height 9 and distance 11, pitch 55°, fov 35°, the Type I island sits 31% beyond the bottom frustum edge on 16:9. On a portrait phone the side islands are 2.8× outside. I added an explicit overview camera, `D_ov = max(18, 18/aspect)`, and used it in the Opening, Beat 1, Beat 5, the Lab dock and the Pull-back slider. The Lab previously started from a different pose (height 8, pitch 35°); the Lab and Beat 5 now share one path. Beat 4's gauge and ladder are anchored in screen space on portrait.
24. **H2 radius was stated as 1.** The canonical `HANDOFF.H2.radius` is 1.3. Both handoff frames now specify `<HandoffLoop/>`, `HANDOFF.camera` and view shift [0, 0], per ARCHITECTURE.md.
25. **Chapter 08 now exists** (drafter's flag 11). Its OUT is H2 with the cylinder fully faded and an optional 8% seam hairline. The IN and Opening now dissolve that seam over the first 10%. Chapter 10's IN prefers H1 but explicitly accepts H2; this is now noted.
26. **Smaller spec gaps closed**: the SDF sign convention and extent; the ladder cutoff (strict `<`, so the g = 0.1 rung, which lands exactly on the edge, is hidden); the HE ribbon threshold, now computed from the physical g^(2/3) rather than the visual separation; HE `d = g` up to an order-one factor (πR interval convention); and the audio, which clamps f₁ only so the harmonic ratios stay exact, plus the "pentatonic 6 tones" inconsistency.
27. **Micro-copy**: the IIA dial lines now say "11D Planck length" (not "Planck length") and "ten directions; with time, eleven", which avoids a 10-vs-11 muddle. All beats are ≤ 45 words (Beat 1 is exactly 45) and all micro-copy is ≤ 20.

**Checked and left unchanged**
- Map geometry: the hypocycloid has cusp radius 6 and inner radius 4. The contour radii are 5.60, 4.98, 4.30 and 3.68. The shoreline is at ρ = 3.50 (g = 0.41). The 11D bump peaks at 0.30. The heightfield is about 73k triangles.
- The union-find pieces table matches every listed case, and 1 piece is reachable only with the lift.
- The E8 Coxeter-plane emblem (flag 6) was computed directly: 240 roots project to 8 rings of 30.
- `⌈g⌉ − 1` rungs below the string scale is correct.
- The (p,q) lattice's 90° self-similarity under g ↔ 1/g is correct.
- All status chips are appropriate. Nothing implies that M-theory is tested, complete or a theory of everything.
- The "five theories" caveat (flag 5) holds, with the wording fixes above.
- The "magic, mystery, membrane" attribution to Duff reporting Witten (flag 9) is correct as written.
- **Choice of aha (flag 12).** Keep Beat 4, "the coupling was a size", as the aha. It has one concrete mechanism, a formula tied to the screen (R₁₁ = gℓ_s), and it pays off Chapter 05's tower. The Beat 5 pull-back works better as the emotional reveal once that mechanism is understood. Reversing them would make the aha a picture rather than an idea.

## Editor notes (cross-chapter pass, 2026-09-28)

1. **Visible copy normalised.** Beat text and micro-copy now say "Chapter 8" and "Chapter 5", matching every other chapter's on-screen style. Engineering notes keep their "Chapter 08" file-style references.
2. **Glossary link.** Beat 5's "eleven-dimensional supergravity" is now a glossary link. It had a glossary entry here but no Term in the text. Word count unchanged.
3. **Handoff OUT re-checked.** Chapter 10 now specifies H2 as its first frame, no longer "prefers H1". The note was updated. Both sides render `<HandoffLoop/>` at `HANDOFF.camera`.
4. **Callbacks this chapter pays off.** Beat 2's handle stack reuses Chapter 3's worldsheet topology (each handle costs g²). Beat 3's causeways are Chapter 8's circle swap. Beat 3's D-string is a Chapter 7 D1-brane. Beat 4's ladder is Chapter 5's Kaluza–Klein tower. These are listed in `00-arc.md`.
