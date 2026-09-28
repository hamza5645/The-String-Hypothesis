# 07 · Branes — Where do open strings end?

**Thesis:** In string theory, open strings end on D-branes, dynamical objects that confine open-string forces to themselves while closed strings (gravitons among them) roam the bulk, and the distance between branes becomes mass, giving the Higgs mechanism a geometric picture.

**Overall status:** ◑ `DERIVED`. D-branes, what lives on them, stretched-string masses and U(N) symmetry all follow from string theory's equations, and none has been observed. The idea that *our* universe is a brane is ○ `SPECULATIVE`. The searches for it are null results (● `OBSERVED`). Every drawing of a brane is ~ `ANALOGY`, because a brane with three or more space dimensions inside nine is drawn as a 2D sheet in 3D.

---

## Storyboard

Scene conventions for the engineer: 1 world unit ≈ 1/6 of the viewport height at the default camera (perspective, fov 35°, camera at distance 8 from the origin). In this chapter **1 world unit = 1 string length ℓ_s = √α′**, and the pinned label says this is not to scale. Only strings use `--filament`. Branes are `--field` sheets: a 10 × 10 unit square, a hairline grid every 0.5 units at 14% opacity, edges at 40% with a soft fresnel rim, and the transverse ("across the brane") axis is **y**. The bulk is shown by sparse instanced dust (1,500 Field points, 1 px, 6% opacity; none on the low tier) so parallax reads as depth. Where a string end touches a brane there is a bright endpoint bead (filament core, 5 px) plus a small Field **contact ring** on the sheet (radius 0.12). Closed strings are filament loops of radius 0.35 with a gentle spin-2 wobble, `r(θ) = r₀·(1 + 0.08·cos(2θ − 3t))`, a callback to Chapter 04. Point masses and field lines from ordinary charges use `--ink`. Every ~ANALOGY chip on the stage is a small mono label pinned at the bottom left.

### Opening: *handoff IN*
- **Text:** Chapter 3 met two kinds of string. Closed loops have no ends. Open strings have two, and so far those ends wandered anywhere. String theory's equations also allow ends that are held, and what holds them turns out to be objects in their own right.
- **Status:** ◑ DERIVED
- **Stage:** The first frame is **H2**: one closed Thread loop centered, facing the camera, gently wobbling. Over progress 0 → 0.35 the loop drifts to the upper right (x 0 → 2.6, y 0 → 1.3, z 0 → −2), shrinks to scale 0.45 and fades to 50% opacity. It keeps wobbling, because it returns later as the closed string that roams the bulk. At the same time **H1** fades in at center, a horizontal open string 2 units long vibrating in its fundamental mode (amplitude 0.12). From 0.35 to 0.70 the two endpoints brighten and each gets a mono tag `END`. Each end runs a smooth 3D random walk (Perlin, amplitude 0.6 units, period ≈ 3 s) and leaves a 1.5 s fading trace that heads off in x, y and z alike. A Field axis triad (x, y, z, 1.5 units each, mono labels) fades in at the lower left. From 0.70 to 1.00 the y-component of both walks damps to zero (ease-out), so the traces flatten into a horizontal plane: the viewer should feel something taking hold of the ends. The camera holds at distance 8, and pitch eases 0° → 10°. Scale gauge: `ℓ_s = √α′ · size unknown`.

### Beat 1: A rule at each end
- **Text:** A string's equations need a rule at each end. Along some directions an end slides freely; along others it stays pinned. The places where pinned ends can sit form a surface: a [[D-brane]], "D" for Dirichlet, the name of the pinning rule.
- **Status:** ◑ DERIVED + ~ ANALOGY (the sheet drawing)
- **Stage:**
  - **0.00–0.25:** Three hairline callouts attach to the left endpoint: `x · slides (Neumann)`, `z · slides (Neumann)`, `y · pinned (Dirichlet) · y = 0`. A clamp glyph appears on the y-axis at each endpoint, two short Field ticks just above and below the bead. The **interior** of the string keeps wiggling up and down in y (fundamental mode, `Δy = 0.25·sin(πs)·sin(ωt)` with s ∈ [0,1] along the string). Only the ends are held.
  - **0.25–0.70:** The ends wander in x and z (Perlin, amplitude 3 units) and leave Field trails that persist and fade over 6 s. The brane sheet at y = 0 is "painted in" by where the ends have been. Drive each grid cell's opacity from a trail-density render target (256², additive, with a slow global decay), saturating at 14%, so the surface visibly grows out of the endpoint paths. The camera pitch eases 10° → 28° to look down onto the forming sheet.
  - **0.70–1.00:** The sheet completes to its full 10 × 10 square, the edges brighten, and a label reads `D-BRANE · where the ends can be`. A mini-row of icons fades in at the top right: `D0 · a point`, `D1 · a line`, `D2 · a sheet`, `D3 · three space dimensions (can't draw)`, `… up to D9`. Pinned label: `~ ANALOGY · drawn as a 2D sheet in 3D. A Dp-brane has p space dimensions.` A footnote card with a ◑ chip reads: `1989 · Dai, Leigh & Polchinski, and independently Hořava. Found through the duality of Chapter 08.`
  - Scale gauge: `ℓ_s · unknown`.

### Beat 2: Not a rule, a thing
- **Text:** A pinned end can push and pull, so the brane must be able to recoil. It is an object: it has mass, moves and ripples, and its ripples are open strings. In 1995 Polchinski showed D-branes also carry [[Ramond–Ramond charge]], exactly what string dualities required.
- **Status:** ◑ DERIVED + ~ ANALOGY (the recoil is exaggerated)
- **Stage:**
  - **0.00–0.30:** One open string lies on the brane with both ends on it (end-to-end 1.6 units, arching 0.4 units above the sheet). It is **plucked**: over 0.6 s its midpoint is pulled up to y = 1.2, then released into a decaying fundamental-mode oscillation. At the two contact points the brane dents toward the pull, a Gaussian bump of height `0.12·(pull/1.2)` and σ = 0.35 that relaxes with the string. The brane must be a 96 × 96 vertex grid, displaced in the vertex shader. Pinned label: `~ recoil exaggerated · branes are very heavy when strings interact weakly (tension ∝ 1/g_s)`.
  - **0.30–0.65:** The whole brane ripples as the sum of three plane waves, `h(x,z,t) = 0.08·Σₖ sin(kₖ·r − ωₖt)`, with |k| ≈ 1.2–2 and ω ≈ 1.5–2.2. Ten tiny open strings (0.4 units, both ends on the sheet) ride the crests and flash briefly as a crest passes under them. Label: `a ripple of the brane = open strings with both ends on it`.
  - **0.65–1.00:** The ripples calm. The brane now acts as a charged plate: a lattice of 12 × 12 short Field hairlines with small arrowheads rises perpendicular to the sheet on both sides, fading with distance (length 1.5 units, opacity ∝ 1 − y/1.5). Label: `RR CHARGE · the brane is a source of a closed-string field`. At 0.85 a footnote card with a ◑ chip appears: `1996 · counting D-brane bound states reproduced the entropy of certain black holes (Strominger & Vafa).`
  - Scale gauge: `ℓ_s · unknown`.

### Beat 3: On the brane, off the brane
- **Text:** Open strings with both ends on a brane slide along it; while open, they cannot leave. Their lightest vibration acts like a photon confined to the brane. Closed strings have no ends to hold. Among them is the graviton, free to roam the whole [[bulk]].
- **Status:** ◑ DERIVED + ~ ANALOGY (2D brane in a 3D bulk; the slice view)
- **Stage:** The camera flies from on the brane to outside it. This is the lab's signature move.
  - **0.00–0.30 · On-brane view.** The camera is top-down (pitch −90°, distance 15), and the brane fills the frame. A **slab clip** shows only geometry within `|y| < 0.06` of the brane at full opacity, and everything else fades out. Eight short open strings (both ends on the brane, bowing at most 0.06 out of plane so they stay inside the slab) slide around on smoothed random walks. Six closed loops drift through the bulk on random 3D paths. The viewer sees them only where they **cross** the brane: a pair of Ink dots appears, separates, re-merges and vanishes (see Lab model for the intersection math). Label: `ON-BRANE VIEW · you see only what touches the brane`. Pinned: `~ ANALOGY · a geometric slice. Brane-dwellers would notice a passing closed string only through its gravity.`
  - **0.30–0.70 · Fly-off.** The camera pitch eases −90° → −16°, yaw 0° → 28°, distance 15 → 11, on a smoothstep. The slab half-thickness grows with the cube of the fly-off fraction u = (progress − 0.30)/0.40: `h = 0.06 + 12u³`. The bulk fades in: the six closed loops appear whole, and the dots from before turn out to have been loops passing through. Callouts pin to one of each: `open string · ends on the brane · e.g. photon-like` and `closed string · no ends · e.g. graviton`.
  - **0.70–1.00 · A loop leaves.** Two open strings slide toward each other along the brane (from x = ±3) and meet at the origin with a small Field ring flash. Out come **one open string**, sliding off along the brane, and **one closed loop**, which lifts off the sheet and drifts into the bulk along a dashed Field arrow `into the bulk`. Their momenta along the brane are equal and opposite. Label: `two open strings in → one open string + one closed loop out`. The H2 loop from the Opening glides past in the background.
  - Pinned: `~ ANALOGY · a 2D brane in a 3D bulk. In string theory, e.g., a 3D brane in 9D space.` Scale gauge: `ℓ_s · unknown`.

### Beat 4: Distance becomes mass
- **Text:** Each brane carries its own photon-like field: a [[gauge symmetry]] called U(1). Add a second brane, and an open string can run between them. Its tension is fixed, so its energy is tension × length. At rest, energy is mass: farther apart, heavier string.
- **Status:** ◑ DERIVED
- **Stage:**
  - **0.00–0.20:** The camera settles to an oblique side view (yaw 20°, pitch 12°, distance 10). One brane at y = 0 carries three short open strings sliding on it. One of them is tagged `1–1 · lightest mode massless · a U(1) field on the brane's worldvolume`.
  - **0.20–0.45:** A second, identical sheet peels up off the first: `y₂ = 0 → 2.5` (ease-in-out), tagged `brane 2`. An open string stretches vertically from brane 1 to brane 2 with an endpoint bead and contact ring on each sheet. A Field hairline ruler runs beside it, reading `d = 2.50 ℓ_s`. On the right is a vertical **MASS** gauge (Field frame, Ink fill, linear 0 → 0.8 M_s) reading `m = T·d = d/2π · M_s`, live. Below it sits a mini plot of m against d: a straight Ink line through the origin with a cursor dot. A small label on the plot reads `not a rubber band: tension stays fixed, so the line is straight`.
  - **0.45–0.80:** Brane 2 rises to y = 4.5 and settles back to 2.5. The mass bar and the cursor track the separation exactly, and the ratio readout `m ÷ d = T` never changes. The stretched string's two ends slide in step along their branes. If one end lags, tension pulls the string back to perpendicular, because free-sliding ends let it take the shortest path.
  - **0.80–1.00:** A circular inset opens at the top left (radius ≈ 1/5 of the viewport height), showing the **on-brane view from brane 1** with the slab clip from Beat 3. The stretched string appears there only as a single bright bead with a halo whose radius scales with m, labelled `m = 0.40 M_s`. Caption in the inset: `From the brane: a heavy particle. Its mass measures a distance you can't see.`
  - Scale gauge: `d = 2.5 ℓ_s`.

### Beat 5: Touching branes (*the aha*)
- **Text:** Now push the branes together. The stretched strings shrink to zero length and turn massless: two separate photon-like fields become four linked ones, the larger symmetry U(2). Pull them apart and the extra carriers gain mass. That is the [[Higgs mechanism]], drawn as geometry.
- **Status:** ◑ DERIVED (the brane picture). The Higgs mechanism itself is ● OBSERVED in nature, in the W and Z masses and the 2012 Higgs boson, but the brane version is untested.
- **Stage:** This is the chapter's signature moment.
  1. **Set the matrix (0.00–0.15).** The branes sit at y = 0 and y = 2.5. There are four open strings: `1–1` and `2–2`, each lying on its own brane, and two stretched ones, `1→2` and `2→1`. The stretched ones are **oriented**, shown by a small chevron at the midpoint pointing in opposite directions. A **2 × 2 string matrix** appears at the right: a Field hairline grid with 44 px cells, row = the brane where the string starts, column = the brane where it ends. The diagonal cells are filled (`0`, massless). The off-diagonal cells are outlined and show the live mass `0.40 M_s`. Header: `SYMMETRY U(1) × U(1) · MASSLESS CARRIERS 2`.
  2. **Push together (0.15–0.50).** Brane 2 descends, `y₂ 2.5 → 0`, on an ease-in curve that slows near contact. The stretched strings shorten and the off-diagonal masses tick down live. At contact (0.48–0.50) brane 2 snaps onto brane 1. A soft Field flash runs across the merged sheet (Field, not filament). The two stretched strings fold down into small arcs lying in the brane, identical in form to the 1–1 and 2–2 strings.
  3. **The aha (0.50–0.60).** All four matrix cells fill, and a single block outline surrounds the 2 × 2. The header morphs: `U(1) × U(1) → U(2)` and `MASSLESS CARRIERS 2 → 4`. Hold for a beat. Large caption: **"Four massless carriers, not two. The symmetry grew because the branes touched."**
  4. **Pull apart (0.60–0.78).** Brane 2 lifts to y = 1.5. The off-diagonal cells empty back to outlines with their mass values, the block outline splits into two 1 × 1 blocks, and the header reads `U(2) → U(1) × U(1)`. A hairline bracket links the ruler `d` to the matrix diagonal, labelled `brane positions = the Higgs field's value`. Pinned caveat: `This "Higgs field" is the branes' position, not the Standard Model Higgs.`
  5. **Three branes (0.78–1.00).** A third brane slides in from below and the matrix grows to 3 × 3. All three coincide (9 filled cells, `U(3)`); then brane 3 moves off to y = −1.5, leaving a block-diagonal pattern, a filled 2 × 2 block and a filled 1 × 1 block, with header `U(2) × U(1)`. Label: `N branes together → N² kinds of string → U(N)`. A footnote card with a ○ chip reads: `Some speculative models use a stack of three branes for the strong force's SU(3).`
  - Final caption: **"Here, the value of a Higgs field is a distance."** Pinned: `~ ANALOGY · branes drawn 2D. Masses exact in string units.` Scale gauge: live `d`.

### Beat 6: Are we on a brane?
- **Text:** A speculative [[braneworld]]: everything we're made of could be open strings on a 3D brane, with only gravitons, closed strings, roaming the bulk. Spread thin there, gravity would seem weak. So far: inverse-square gravity holds down to 52 µm; the LHC sees no escaping gravitons.
- **Status:** ○ SPECULATIVE (the scenario) + ● OBSERVED (the null results)
- **Stage:**
  - **0.00–0.40 · Dilution picture (ADD, 1998).** The branes merge back into a single sheet, relabelled `OUR 3D SPACE? · drawn as 2D · ○ SPECULATIVE`. Its open strings are relabelled generically `matter and light: open strings`. A small Ink sphere (a mass) sits on the sheet. Two sets of field lines grow from it:
    - 16 Ink-2 lines stay flat in the sheet, labelled `forces confined to the brane`.
    - 48 Field lines spread in 3D into the bulk, labelled `gravity spreads into the bulk`.
    - The bulk is a slab of thickness L = 2 units. Its top and bottom faces carry matching tick arrows labelled `top ≡ bottom: the extra direction closes on itself`.
    - The gravity lines are integrated from a mass plus its periodic images (see Lab model). Near the mass they spread in all directions; beyond a distance of about L they bend until they run **parallel to the brane**. Far away, gravity then spreads only along the brane, like the confined forces but diluted. For a real 3D brane that means ordinary 1/r² gravity, only weaker.
    - Label: `Arkani-Hamed, Dimopoulos & Dvali, 1998: large extra dimensions dilute gravity`.
    - Small card with a ● chip: `Between two protons, gravity is ~10³⁶ times weaker than their electric repulsion.`
  - **0.40–0.55 · Warping (RS, 1999).** A small hairline inset shows two parallel branes with bulk grid spacing that shrinks exponentially from one to the other (spacing ∝ e^(−y)). Label: `Randall & Sundrum, 1999: a warped extra dimension; weakness from warping, not volume`.
  - **0.55–0.85 · How we'd notice.** Beat 3's collision replays on the sheet. An on-brane inset shows only the outgoing open string. A dashed Ink arrow points the opposite way, labelled `missing momentum`, where the escaping loop went. Three result cards stack beside it, each with a ● chip:
    - `Torsion balance, 2020: 1/r² holds to 52 µm`
    - `ATLAS, 2021: no excess of missing momentum; gravity's true scale > 11.2 TeV if 2 extra dimensions`
    - `CMS, 2021: no warped-graviton resonance below 4.8 TeV (benchmark coupling)`
  - **0.85–1.00:** The "our space?" label fades back to `D-brane`. Pinned: `○ SPECULATIVE · string theory doesn't require that we live on a brane.` Scale gauge: `52 µm`.

### Exit: *handoff OUT*
- **Stage (no text):** The camera pulls back. The closed loop that escaped in Beat 6 drifts to the center, turns to face the camera and grows to canonical size, while the brane sheet dims to 10% behind it. The final frame is **H2**: one closed Thread loop centered, facing the camera, gently wobbling, with a faint brane grid behind it. A footnote card with a ◑ chip fades in and out: `D-branes were found through T-duality, which swaps "slides" and "pinned" ends. Next chapter.` Chapter 08 can dissolve the grid and keep the loop.

---

## Lab

**Title: Brane Bench.** One WebGL stage and one docked instrument panel. It has four panel sections: `VIEW · BRANES · STRINGS · READOUTS`. The last two include the string matrix and the mass ladder.

**Purpose:** Pin string ends to branes and move the branes, to see separation become mass and coincidence become a larger symmetry.

### Controls

| Section | Control | Type · range | Default | Units |
|---|---|---|---|---|
| VIEW | `Viewpoint` | slider 0 (`on the brane`) → 1 (`outside, in the bulk`) | 1 | — |
| VIEW | `Reference brane` | tap a brane (or keyboard select) | brane 1 | — |
| BRANES | `Number of branes` | stepper 1 · 2 · 3 · 4 | 2 | count |
| BRANES | `Brane position` | drag handle at each brane's right edge (keyboard: ↑/↓ by 0.1, Shift by 1.0), y ∈ [−5, 5], snaps to another brane within 0.2 | N=1: 0 · N=2: 0, 3 · N=3: 0, 2, 3.5 · N=4: 0, 1.5, 3, −2 | ℓ_s |
| BRANES | `Separation d` (shortcut, N = 2 only) | slider 0 – 10, step 0.01, snaps to 0 below 0.2 | 3.00 | ℓ_s |
| STRINGS | `Draw an open string` | press on a brane, drag, release on a brane (same or other) | — | — |
| STRINGS | `Release a closed string` | button | — | — |
| STRINGS | `Collide on the brane` | button (plays about 3 s) | — | — |
| STRINGS | `Clear strings` | button | — | — |
| READOUTS | `Energy scale (unknown)` | segmented: `string units` / `if M_s c² = 10¹⁷ GeV ○` / `if M_s c² = 10 TeV ○` | string units | — |
| READOUTS | `Braneworld labels ○` | toggle | off | — |

On load the bench is populated: two branes (y = 0 and 3), one 1–1 string, one 2–2 string, the pair `1→2` and `2→1`, and three closed loops drifting.

### What changes on screen
- **Viewpoint:** The camera flies continuously between the on-brane slice (top-down, only what touches the reference brane) and the oblique outside view (the whole bulk). In the slice, closed loops appear as pairs of dots that come and go. Stretched strings appear as a single heavy bead, whose halo radius grows with its mass, and other branes are invisible.
- **Brane positions:** The sheets move rigidly. Stretched strings lengthen or shorten, their mass readouts update, and the mass gauge and the m-vs-d plot track them. When two branes snap together, a Field flash marks the merge. Stretched strings between them fold into the sheet, the matrix block fills, and the symmetry label changes (e.g. `U(1) × U(1) → U(2)`).
- **Draw:** A filament rubber-band follows the pointer from the first endpoint. Release on a brane and the string is created: straight and perpendicular between two different branes, or a small arc for the same brane. Release in empty bulk and the loose end springs back to the nearest brane (0.4 s), with a caption.
- **Release a closed string:** A wobbling loop appears near the reference brane and drifts off on a straight 3D path. It passes through sheets without sticking and leaves the frame.
- **Collide:** Two open strings slide in and meet. Out come one open string and one closed loop, which leaves the brane. In the on-brane view a dashed `missing momentum` arrow appears opposite the visible string.
- **String matrix (READOUTS):** An N × N Field grid, row = start brane, column = end brane. Massless cells are filled, massive cells are outlined and show their mass, and block outlines mark each coincident stack.
- **Mass ladder (READOUTS):** Two columns of rungs for n = 0…5. The left is `ends on the same brane`, at `√n`. The right is `stretched 1→2`, at `√((d/2π)² + n)`, for the selected pair. When d → 0 the two ladders become identical.
- **Energy scale:** Adds physical-unit readouts under a stated assumption, e.g. `≈ 4.8×10¹⁶ GeV` or `≈ 4.8 TeV`, and `d ≈ 5.9×10⁻³³ m`.
- **Braneworld labels:** Relabels the reference brane `our 3D space? ○`, open strings `matter and light`, closed strings `gravitons`, and shows the three ● result cards from Beat 6.

### Model (what the engineer implements)

**Units and constants: faithful.**
- Lengths are in string lengths `ℓ_s ≡ √α′`, and masses in `M_s ≡ ħ/(c·ℓ_s)`, so `M_s c² = ħc/ℓ_s`. String tension is `T = ħc/(2πα′) = M_s c²/(2π·ℓ_s)`. In code set ħ = c = α′ = 1, so `T = 1/(2π)`.
- Visual scale: 1 world unit = 1 ℓ_s (~ANALOGY: not to scale).
- Physical conversion (only under the selected assumption): `ħc = 1.973 27 × 10⁻¹⁶ GeV·m`.
  - `M_s c² = 10¹⁷ GeV` gives `ℓ_s = 1.97 × 10⁻³³ m`.
  - `M_s c² = 10 TeV` gives `ℓ_s = 1.97 × 10⁻²⁰ m`.
  - Readouts are `m_phys = (m/M_s) × M_s c²` and `d_phys = (d/ℓ_s) × ℓ_s`. Show `○ ASSUMED · the string scale is unknown` whenever a physical option is active.

**Stretched-string mass: faithful (type II superstring, parallel identical Dp-branes, flat space).**
- Lowest state of a string from brane i to brane j: `m_ij = T·|y_i − y_j| = |y_i − y_j| / (2π)` in M_s. The range d ∈ [0, 10] gives m ∈ [0, 1.59] M_s. Worked values: d = 2.5 → 0.398; d = 3 → 0.477; d = 2π ≈ 6.28 → 1.000.
- Full ladder (NS sector after the GSO projection; the R sector gives the fermion partners at the same masses): `m_ij,n = √((|y_i − y_j|/2π)² + n)`, n = 0, 1, 2, …. For i = j this is `√n`, and n = 0 is massless: the photon-like vector together with its scalar and fermion partners.
- Each ordered pair (i, j) with i ≠ j is a distinct string: i→j and j→i are distinct, oppositely charged states, like W⁺ and W⁻. Total string types: N².
- The lowest rung at n = 0 is a whole multiplet: for a Dp-brane, a vector, 9 − p scalars and fermions, 8 + 8 physical states. At d > 0 the vector becomes massive by absorbing the scalar that describes wiggles along the separation direction. The lab only labels this in the ladder tooltip.

**Symmetry bookkeeping: faithful (oriented strings, no orientifolds).**
- Cluster branes whose positions are equal (after snapping, `|Δy| < 10⁻³`) into stacks of sizes n₁, n₂, ….
- `MASSLESS CARRIERS = Σ n_k²` and `HEAVY CARRIERS = N² − Σ n_k²`. The symmetry label is the product of `U(n_k)` in descending order (e.g. `U(2) × U(1)`).
- Row and column indices are the strings' Chan–Paton labels. Matrix cell (i, j): filled if i and j are in the same stack, otherwise outlined with `m_ij`. Draw a block outline around each stack. Sort matrix rows by brane position so each stack is a contiguous block.
- Simplification to flag in the tooltip: orientifold planes would give SO(N) or Sp(N) instead. This is not modelled.

**Branes don't move by themselves: faithful.**
- Identical parallel static D-branes feel **zero net force**: attraction from graviton and dilaton exchange cancels the Ramond–Ramond repulsion exactly (they are BPS objects).
- Infinite branes are also infinitely heavy, so the pull of a few stretched strings cannot move them. Branes therefore move only when dragged. No inertia and no mutual attraction.

**Open strings: cartoon kinematics that obey the real rules.**
- Endpoints always lie on a brane. Each string stores `(i, xₐ, zₐ)` and `(j, x_b, z_b)`.
- **i = j:** Draw a quadratic Bézier from end a to end b. The apex is lifted `0.25·|a − b|` out of plane (alternate sign per string), plus a fundamental-mode wiggle of amplitude 0.04. Endpoints follow a smoothed random walk (Perlin velocity, 0.3–0.8 ℓ_s/s), keeping `|a − b| ∈ [0.5, 1.5]`.
- **i ≠ j:** The string is a straight segment plus a transverse wiggle `0.05·sin(πs)·sin(ωt)`. The two ends share (x, z): the far end follows the near end through a critically damped spring (ω = 6 s⁻¹). The string therefore relaxes to perpendicular, the shortest length, because Neumann ends slide freely while tension pulls. The pair drifts together on one random walk.
- Keep all endpoints inside `|x|, |z| < 4.8` with a soft bounce. Caps: 24 open strings and 12 closed strings.
- **Draw gesture:**
  - Raycast the pointer against the brane planes and take the first hit within the 10 × 10 extent as end a.
  - While dragging, project the pointer onto the vertical plane through a that faces the camera, and draw a filament from a to that point.
  - On release over a brane, end b goes there and the string is created.
  - On release over empty space, animate end b to the nearest brane at the same (x, z) (spring, 0.4 s), then create the string.
- In type II string theory an open string's end must sit on a D-brane (a space-filling brane would let it be anywhere). The snap-back teaches exactly this.

**Closed strings: cartoon kinematics.**
- Spawn at `(x, z)` uniform in `[−3, 3]²`, with `y = y_ref ± U(0, 0.5)`.
- Velocity `0.8 ℓ_s/s × û`, with û uniform on the sphere, re-drawn until `|û_y| ≥ 0.4`.
- Shape: 64 points, `r(θ) = 0.35·(1 + 0.1·cos(2θ − 3t))`, in a randomly oriented plane that tumbles at 0.4 rad/s. Remove the loop when `|position| > 14`.
- Loops pass through branes untouched. Simplification: in reality a brane can absorb or scatter a closed string, with a probability controlled by the string coupling g_s. It is ignored here.

**On-brane view (slice): faithful geometry, ~ANALOGY meaning.**
- `s = smoothstep(0, 1, Viewpoint)`.
- Camera: pitch = −90° + 74°·s, yaw = 28°·s, distance = 15 − 4·s, looking at the reference brane's center.
- Slab half-thickness `h = 0.06 + 12·Viewpoint³`. Object opacity is `1 − smoothstep(h, h + 0.3, |y − y_ref|)`, applied per vertex in the shader.
- Closed-loop crossings: for each loop's 64-point polyline, find the segments where `(y − y_ref)` changes sign and linearly interpolate the crossing point. Draw each crossing as an Ink dot (4 px) with a 0.1 s fade in and out, only while `Viewpoint < 0.35`. There are usually 0 or 2 crossings per loop.
- Strings with both ends on the reference brane are exempt from the clip, because they are on the brane by definition. Their apex lift is multiplied by `max(s, 0.1)` so they lie nearly flat in the slice.
- Stretched strings: in the slice show only the end on the reference brane, as a bead with a halo of radius `6 px + 18 px·min(m/M_s, 1)` and a mass tag.

**Collide on the brane: faithful conservation, cartoon timing.**
- Spawn two i–i strings on the reference brane at x = ±3 (z = 0), moving toward the origin at 1.5 ℓ_s/s.
- On contact (≈ 2 s) show a Field ring flash, then remove both strings.
- Spawn one i–i open string moving along the brane in a random direction û at 1.0 ℓ_s/s.
- Spawn one closed loop with velocity along the brane `−û × 1.0` and across it `±1.2` (random sign).
- Momentum **along** the brane is conserved: visible plus invisible sums to zero. Momentum **across** the brane is not conserved by the strings alone, because the brane absorbs it. That is correct, since the brane breaks translation symmetry in y.
- In the on-brane view draw a dashed Ink arrow from the collision point along −û (the direction the unseen loop went), labelled `missing momentum`. This is the signature that collider "monojet" searches look for (● OBSERVED: no excess found).

**Mass-vs-distance plot:** the axes are d ∈ [0, 10] ℓ_s and m ∈ [0, 1.6] M_s, with the line `m = d/2π` and a cursor at the current d. Dashed gridline at `m = 1 M_s` (d = 2π), with the label `now heavier than an unstretched string's first vibration`.

**Braneworld gravity lines (for Beat 6, reused by the Braneworld toggle): faithful Gauss-law picture in reduced dimensions.**
- The field of a unit mass at the origin in a slab bulk of period L (the extra direction y is a circle) is the sum over images at `(0, kL, 0)` for k = −K…K (K = 12), `g(r) = −Σₖ (r − r_k)/|r − r_k|³`.
- Integrate 48 field lines outward along −g with RK4, step 0.05, 240 steps. Start them on a small sphere (radius 0.1) using Fibonacci directions, and precompute at load.
- The lines spread in 3D near the mass and run parallel to the brane for r ≳ L. Far away, gravity spreads only along the brane, diluted by the extra volume. For a real 3D brane that is ordinary 1/r² gravity, only weaker; in this 2D drawing the far falloff is 1/r.
- ~ANALOGY: one extra dimension drawn, where ADD needs at least 2. A single extra dimension this large is long excluded.

**Reduced motion:** freeze all random walks and wobbles. Collisions show before and after frames with a cross-fade. The Viewpoint slider jumps between 0 and 1 with a 0.3 s fade instead of flying.

### Micro-copy (≤ 20 words each)
- Panel header: "Pin the ends, move the branes. Watch distance turn into mass."
- Draw hint: "Drag from one brane to another to stretch an open string between them."
- Released in the bulk: "An open string's end must sit on a brane. It snapped back."
- Viewpoint = 0: "On the brane: you see only what touches it."
- Viewpoint = 1: "Outside: the bulk, where closed strings roam freely."
- Closed-loop crossing: "A closed string passing through: two points appear, then vanish. ~ a geometric slice."
- Stretched end in the slice: "From here, a stretched string looks like a heavy particle."
- Mass readout: "Mass = tension × distance. Double the gap, double the mass."
- Straight-line note: "Not a rubber band: tension stays fixed, so energy grows in a straight line."
- Branes coincide: "Touching: the stretched strings are massless too. The symmetry grows."
- Branes separate: "Apart: the extra carriers gain mass. The Higgs mechanism, drawn as geometry."
- Higgs caveat: "This Higgs field is the branes' position, not the Standard Model Higgs."
- Matrix legend: "Row: where the string starts. Column: where it ends. N branes, N² strings."
- Symmetry note: "U(N) contains SU(N), the kind of symmetry behind the strong (SU(3)) and weak (SU(2)) forces."
- No-force tooltip: "Identical parallel branes feel no net pull: gravity-like attraction and RR repulsion cancel exactly."
- Heavy branes: "Infinite branes are infinitely heavy. They stay where you leave them."
- Ladder crossover (d > 2π): "Stretched this far, the lightest stretched string outweighs an unstretched string's first vibration."
- Collide: "Two open strings in. One open string and a closed loop out."
- Missing momentum: "The loop left the brane. What's left doesn't balance: missing momentum."
- Braneworld toggle: "○ Speculative: our 3D space as a brane. Only gravity reaches the bulk."
- LHC card: "● Searched for at the LHC. No excess of missing momentum found."
- Energy scale: "The formula is exact. The string scale is unknown."
- Scale caveat: "~ Branes drawn as 2D sheets in 3D. Not to scale. Masses exact in string units."

### Audio (optional, muted by default)
Each stretched string hums at a pitch that rises linearly with its mass, a cartoon of E = hf (an offset linear map, not a strict proportion): `f_ij = 110 Hz × (1 + 3·m_ij/M_s)`, clamped to 110–660 Hz. Strings with both ends on the same brane share a quiet 110 Hz drone. As branes approach, their stretched strings glide down to 110 Hz and land in **unison** at contact. Equal masses sound as one note, so the enlarged symmetry is audible. A soft low "thump" marks each snap-merge. The collide event gets a short click, with a faint descending whoosh as the loop leaves.

---

## Go deeper

**The two rules at an end, and where the mass comes from** (units with ħ = c = 1).

Each coordinate X of an open string obeys one of two rules at its ends:

$$\partial_\sigma X^{a}\big|_{\text{ends}} = 0 \qquad\qquad X^{i}\big|_{\text{ends}} = y^{i}$$

- **∂σXᵃ = 0 (Neumann)** applies along the brane. No momentum leaks out of the end in direction a, so the end slides freely. *Highlight: the brane's grid axes.*
- **Xⁱ = yⁱ (Dirichlet)** applies across the brane. The end sits at the brane's position yⁱ. *Highlight: the brane's height handle.* Momentum the string cannot keep in direction i flows into the brane, so the brane must be dynamical.

For a superstring stretched between parallel branes i and j, the masses are

$$M_{ij}^2 = \left(\frac{|y_i - y_j|}{2\pi\alpha'}\right)^2 + \frac{n}{\alpha'}, \qquad n = 0, 1, 2, \dots$$

- **1/(2πα′) = T** is the string tension, fixed however long the string is. *Highlight: the mass gauge's slope.*
- **|yᵢ − yⱼ|** is the stretched length. *Highlight: the ruler d.*
- **n/α′** is the vibration energy. *Highlight: the lit rung.* For i = j and n = 0, M = 0: the photon-like field.

With N coincident branes the massless fields are N × N matrices: entry (i, j) comes from strings running from brane i to brane j. Transverse positions become a matrix Φ of fields. Separating the branes gives it a value:

$$\langle\Phi\rangle = \frac{1}{2\pi\alpha'}\,\mathrm{diag}(y_1,\dots,y_N) \;\Rightarrow\; M_{ij} = \big|\langle\Phi\rangle_{ii} - \langle\Phi\rangle_{jj}\big|$$

- **⟨Φ⟩** is the Higgs field's value. Its diagonal holds the brane positions. *Highlight: the matrix diagonal.*
- **M_ij** is the mass of carrier (i, j), exactly the n = 0 stretched string. *Highlight: off-diagonal cells.*

This is the Higgs mechanism with a matrix-valued ("adjoint") scalar, not the Standard Model's Higgs. The branes themselves have tension ∝ 1/g_s, so they are heavy while strings interact weakly.

---

## Glossary
- `D-brane` — An object on which open strings can end ("D" for Dirichlet). A Dp-brane has p space dimensions. It has mass, carries charge, and can move.
- `Dirichlet boundary condition` — The rule that pins a string's endpoint at a fixed position in some direction. Its partner, the Neumann condition, lets the end slide freely.
- `bulk` — The full higher-dimensional space surrounding the branes. Closed strings, including gravitons, can travel anywhere in it.
- `worldvolume` — The region of spacetime a brane sweeps out: its own space dimensions plus time. Fields from open strings on the brane live there.
- `Ramond–Ramond charge` — A kind of charge carried by D-branes (not by fundamental strings) under fields that come from closed-string vibrations. Polchinski identified D-branes as its sources (1995).
- `Chan–Paton label` — The tag recording which brane each end of an open string sits on. With N branes there are N² kinds of oriented open string.
- `gauge symmetry` — The symmetry behind a force. The group fixes how many force carriers there are: U(1) has one, like the photon; U(N) has N².
- `Higgs mechanism` — How force carriers gain mass when a field takes a nonzero value everywhere. For branes, that value is their separation.
- `braneworld` — A speculative scenario in which the particles we know are confined to a 3D brane, while gravity also spreads through extra dimensions of the bulk.

---

## Numbers & facts
- **D-branes introduced, 1989**: J. Dai, R. G. Leigh, J. Polchinski, "New connections between string theories", *Mod. Phys. Lett. A* 4, 2073–2083 (1989). The paper coins "D-brane". Found independently by P. Hořava, "Background duality of open-string models", *Phys. Lett. B* 231, 251–257 (1989). D-branes arose from applying T-duality to open strings, which exchanges Neumann and Dirichlet conditions. Sources: https://en.wikipedia.org/wiki/D-brane ; Polchinski, "TASI Lectures on D-branes", arXiv:hep-th/9611050, §2.4; Tong, *Lectures on String Theory*, arXiv:0908.0333, §3.3 and §8.3.2.
- **"D" = Dirichlet**, after the mathematician P. G. L. Dirichlet (1805–1859); the free-end condition is named after C. Neumann (1832–1925). Definitions: ∂σXᵃ = 0 (Neumann), Xᴵ = cᴵ (Dirichlet). A Dp-brane has p spatial dimensions: D0 is a particle, D1 a string, D2 a membrane; p runs up to 9 (space-filling), and a D(−1) "instanton" also exists. Source: Tong, arXiv:0908.0333, §3 (eq. 3.3).
- **Which branes exist**: type IIA has stable Dp-branes with p even, type IIB with p odd. Heterotic string theories have no Ramond–Ramond fields and hence no D-branes. Source: Tong §7.7.1; Polchinski, *String Theory* vol. 2 (CUP 1998), chs. 12–13.
- **Polchinski 1995**: "Dirichlet-branes and Ramond-Ramond charges", *Phys. Rev. Lett.* 75, 4724–4727 (1995), arXiv:hep-th/9510017. D-branes carry RR charge, break half the supersymmetries, and are the charged objects that string duality requires. https://arxiv.org/abs/hep-th/9510017
- **Branes as dynamical objects; ripples = open strings**: massless open-string states with both ends on one brane include a U(1) gauge field on the brane plus scalars describing its transverse fluctuations. Source: Polchinski TASI, hep-th/9611050, §2.4–2.5; Tong §3.3 and §7.
- **D-brane tension ∝ 1/g_s**: τ_p = 1 / (g_s (2π)^p α′^((p+1)/2)) (ħ = c = 1). Source: Polchinski vol. 2 ch. 13; TASI eq. (92); Tong §7.6.1 ("Tp ∼ 1/gs").
- **No force between identical parallel D-branes (BPS)**: NS-NS (graviton and dilaton) attraction cancels R-R repulsion exactly. Source: Polchinski 1995; TASI eq. (90)–(91).
- **Open-string loop = closed-string exchange**: the same cylinder diagram describes an open-string loop between branes and a closed string exchanged between them, which is why open strings come with closed strings. Source: Polchinski TASI §2.6 (fig. 7).
- **Fundamental string tension** T = 1/(2πα′) (ħ = c = 1), i.e. T = ħc/(2πα′). Source: Tong §7.7.
- **Stretched-string mass** M = T·|y₂ − y₁| = |y₂ − y₁|/(2πα′). For the superstring, α′M² = α′(d/2πα′)² + N − ½ in the NS sector, with the GSO projection keeping N = ½, 3⁄2, … (so n = N − ½ = 0, 1, 2, …). Sources: Tong §7.7 (eq. for M_W) and §3.3; C. V. Johnson, "D-Brane Primer", arXiv:hep-th/0007170; Polchinski vol. 2 §13.
- **Worked lab values**: d = 2.5 ℓ_s → 0.398 M_s; d = 3 ℓ_s → 0.477 M_s; d = 2π ℓ_s → 1.000 M_s (the first excited level of an unstretched string, √(1/α′) = M_s). d = 10 ℓ_s → 1.59 M_s. Arithmetic from the formula above.
- **N coincident branes → U(N)**; separated → U(1)^N; W-boson mass equals stretched-string mass; "a natural geometric interpretation of the Higgs mechanism using adjoint scalars". Brane positions are eigenvalues of the matrix Φ: X = 2πα′φ. Source: Tong §7.7 (eqs. 7.41–7.43). Coincident-brane U(N) and matrix positions: E. Witten, "Bound states of strings and p-branes", *Nucl. Phys. B* 460, 335 (1996), arXiv:hep-th/9510135.
- **Chan–Paton factors, 1969**: J. E. Paton and H.-M. Chan, "Generalized Veneziano model with isospin", *Nucl. Phys. B* 10, 516–520 (1969). https://inspirehep.net/literature/56619
- **Orientifolds give SO(N)/Sp(N)** instead of U(N) (not modelled). Source: Polchinski TASI §2.7; Dai–Leigh–Polchinski 1989 (which also coins "orientifold").
- **Strominger & Vafa 1996**: "Microscopic origin of the Bekenstein-Hawking entropy", *Phys. Lett. B* 379, 99–104 (1996), arXiv:hep-th/9601029. They counted D-brane bound states to reproduce the entropy of five-dimensional extremal (supersymmetric) black holes.
- **Maldacena 1997 (AdS/CFT)**, referenced in Pitfalls: "The large N limit of superconformal field theories and supergravity", *Adv. Theor. Math. Phys.* 2, 231 (1998), arXiv:hep-th/9711200. Status: ◌ CONJECTURED.
- **Higgs mechanism observed**: W and Z masses; Higgs boson discovered 2012. ATLAS, *Phys. Lett. B* 716, 1 (2012); CMS, *Phys. Lett. B* 716, 30 (2012).
- **Braneworld precursor, 1983**: V. A. Rubakov and M. E. Shaposhnikov, "Do we live inside a domain wall?", *Phys. Lett. B* 125, 136 (1983). They already noted processes that look like "e⁺e⁻ → nothing". https://ui.adsabs.harvard.edu/abs/1983PhLB..125..136R/abstract
- **ADD, 1998**: N. Arkani-Hamed, S. Dimopoulos, G. Dvali, "The hierarchy problem and new dimensions at a millimeter", *Phys. Lett. B* 429, 263 (1998), arXiv:hep-ph/9803315. The paper proposes n ≥ 2 large extra dimensions, a fundamental gravity scale near a TeV, and M_Pl² ~ M_D^(2+n) R^n. String embedding with matter on D3-branes: Antoniadis, Arkani-Hamed, Dimopoulos, Dvali, *Phys. Lett. B* 436, 257 (1998), arXiv:hep-ph/9804398.
- **Randall–Sundrum, 1999**: RS1 "A large mass hierarchy from a small extra dimension", *Phys. Rev. Lett.* 83, 3370 (1999), arXiv:hep-ph/9905221: a warped AdS₅ slice between two 3-branes. RS2 "An alternative to compactification", *Phys. Rev. Lett.* 83, 4690 (1999), arXiv:hep-th/9906064: one brane, with 4D gravity reproduced without compact extra dimensions.
- **Torsion balance, 52 µm**: J. G. Lee, E. G. Adelberger, T. S. Cook, S. M. Fleischer, B. R. Heckel, *Phys. Rev. Lett.* 124, 101101 (2020), arXiv:2002.11761. PDG 2026 lists, for two equal extra dimensions (δ = 2), R < 37 µm (Kapner et al. 2007; Tan et al. 2020), and for δ = 1 R ≤ 30 µm (Lee 2020). https://pdg.lbl.gov/2026/listings/rpp2026-list-extra-dimensions.pdf
- **ATLAS monojet, 2021**: *Phys. Rev. D* 103, 112006 (2021), arXiv:2102.10874, with 139 fb⁻¹ at 13 TeV. Excludes the ADD fundamental scale M_D below 11.2 TeV (n = 2) and 5.9 TeV (n = 6). PDG derives R < 3.8 µm for δ = 2. The earlier CMS result (arXiv:2107.13021) gives M_D > 10.7 TeV for n = 2.
- **Astrophysical bound**: for δ = 2, neutron-star heating gives R < 0.00016 µm (Hannestad & Raffelt 2003, as listed by PDG 2026). The simplest two-dimension, TeV-gravity ADD model is excluded.
- **Warped (RS) graviton, 2021**: CMS dilepton search, first KK graviton excluded below 4.78 TeV for k/M̄_Pl = 0.1 (Sirunyan et al. 2021, JHEP 07 (2021) 208, arXiv:2103.02708). CMS diphoton 2024 gives > 4.8 TeV; ATLAS diphoton 2021 gives > 4.5 TeV (*Phys. Lett. B* 822, 136651). Source: PDG 2026 extra-dimensions listing, "Limits on Kaluza-Klein gravitons in warped extra dimensions".
- **Low string scale bound (for the "10 TeV" lab option)**: CMS dijet search excludes string resonances below 7.9 TeV, *JHEP* 05 (2020) 033, arXiv:1911.03947 (model-specific). So 10 TeV is a not-yet-excluded, speculative choice.
- **ħc = 1.973 27 × 10⁻¹⁶ GeV·m** (= 197.327 MeV·fm, exact in the 2019 SI). PDG physical constants. This gives ℓ_s = 1.97 × 10⁻³³ m for M_s c² = 10¹⁷ GeV and 1.97 × 10⁻²⁰ m for 10 TeV. Worked readout: d = 3 ℓ_s → m = 0.477 M_s ≈ 4.8 × 10¹⁶ GeV or ≈ 4.8 TeV, and d ≈ 5.9 × 10⁻³³ m under the 10¹⁷ GeV assumption.
- **Gravity is weak**: between two protons the electric repulsion is ≈ 1.24 × 10³⁶ times the gravitational attraction, e²/(4πε₀Gm_p²) with CODATA values. This is the hierarchy that braneworlds try to explain. (Beat 6 stage card.)
- **Colours / conventions**: the brane `--field`, strings `--filament`, and the status chips follow docs/VISION.md.

---

## Pitfalls
1. **"A brane is a membrane, a 2D sheet."** Beat 1 shows the D0 / D1 / D2 / D3 … D9 icon row and says a Dp-brane has p space dimensions. Every sheet carries `~ ANALOGY · drawn as a 2D sheet in 3D`.
2. **"Branes are just boundary conditions" or "branes are rigid walls."** Beat 2 makes the brane an object: a pinned end pulls on it (dimple), its ripples are open strings, and it has tension and RR charge (Polchinski 1995). The dimple is labelled exaggerated, because branes are heavy at weak coupling (tension ∝ 1/g_s).
3. **"A brane is the edge of the universe."** The bulk is drawn on **both** sides of every sheet, and closed strings pass straight through.
4. **"Open strings are photons, closed strings are gravitons."** The pack always says *lightest vibration* and *photon-like*. The ladder shows massive rungs too, and the ladder tooltip notes that each massless rung includes scalars and fermions. Which brane field, if any, would be *our* photon is model-dependent, and the pack labels any such identification ○ SPECULATIVE.
5. **"A stretched string is like a rubber band."** The m-vs-d plot is a straight line with the note "tension stays fixed". A string's energy grows linearly with length, not quadratically as a Hooke's-law band's would.
6. **"N branes give N (or N(N+1)/2) force carriers."** Strings are oriented. The matrix shows i→j and j→i as separate cells, so the count is N², the size of U(N). Orientifold variants (SO/Sp) are mentioned as not modelled.
7. **"The brane Higgs is the Higgs boson."** Beat 5 and the micro-copy say the brane-picture Higgs field is the branes' *position*, a matrix-valued (adjoint) field, not the Standard Model's Higgs. The Higgs *mechanism* is ● OBSERVED in nature, and the brane version is ◑ DERIVED only.
8. **"The Higgs link is just an analogy."** Also avoided: the pack does not label it ~ANALOGY. In the branes' low-energy gauge theory it *is* the Higgs mechanism, with M_W = T·d exactly (Tong §7.7).
9. **"String theory says we live on a brane."** Beat 6 is chipped ○ SPECULATIVE and ends with "string theory doesn't require that we live on a brane". Numbers & facts notes that heterotic string models have no D-branes at all.
10. **"Gravity leaks out of our universe."** The pack says gravity *spreads* into the bulk and is *diluted*. The Beat 6 field lines show gravity far from a mass running along the brane again: for a real 3D brane, an ordinary 1/r² force, just weaker. Nothing drains away, and in Randall–Sundrum's warped versions gravity even stays concentrated near a brane.
11. **"Braneworlds explain why gravity is weak."** They *re-express* the puzzle: why is the bulk so large, or the warping so strong? Beat 6's result cards show that the simplest TeV-gravity versions are excluded by torsion balances, the LHC and astrophysics, and nothing positive has been seen.
12. **"The LHC ruled out extra dimensions."** The cards are specific: they bound particular models (M_D > 11.2 TeV for two large dimensions; RS graviton > 4.8 TeV at a benchmark coupling). Extra dimensions near the string or Planck length are untouched by these searches.
13. **"D-branes were invented ad hoc."** Beat 1's footnote and the Exit card say D-branes were *forced* by T-duality of open strings (1989). Polchinski's 1995 result showed they carry exactly the charges dualities required.
14. **"An open string's end can float anywhere."** The Lab's draw gesture snaps a loose end back to a brane. The Model notes that "anywhere" means a space-filling brane.
15. **"Closed strings ignore branes."** The Lab notes that loops passing through untouched is a simplification: branes can absorb and emit closed strings (that is how their charge and mass act on the bulk). Beat 3's collision shows open strings producing a closed loop.
16. **"From the brane we could see the bulk."** The on-brane slice is labelled a geometric ~ANALOGY. Brane-dwellers would notice closed strings only through gravity, and escaping ones only as missing momentum.
17. **"Branes prove string theory" and AdS/CFT-as-fact.** Nothing in the pack says D-branes are observed. The Strominger–Vafa black-hole counting is ◑ DERIVED and restricted to special supersymmetric black holes. The related AdS/CFT correspondence (Maldacena 1997), which grew from two descriptions of brane stacks, is ◌ CONJECTURED if mentioned elsewhere.

---

## Handoff
**IN:** **H2**, one closed Thread loop centered, facing the camera, gently wobbling. This matches the convention that Chapter 06 ends on H2. If 06 instead ends on its Calabi–Yau cross-section, cross-dissolve it into this chapter's faint bulk dust while H2 fades in. The loop drifts aside (it returns as the bulk-roaming closed string) as **H1**, the open string whose ends the chapter follows, fades in at center.

**OUT:** **H2**, one closed Thread loop centered, facing the camera, gently wobbling. It is the loop that escaped the brane in Beat 6, in front of a brane grid dimmed to 10%. The card "D-branes were found through T-duality, which swaps 'slides' and 'pinned' ends" hands the story to Chapter 08. Chapter 08 can dissolve the grid and keep the loop, or wrap it around its circle of radius R.
