# 11 · What We Know — What do we actually know?

**Thesis:** Sort every claim by how directly it has been measured and a clear picture appears: measured ground with visible cracks (quantum mechanics, relativity, the Standard Model); above it, string theory's structure of derived and conjectured results, some of which have changed black-hole physics and mathematics; above that, open fog. Not one string-specific claim rests on a measurement.

**Overall status:** `OBSERVED ●` for the chapter's verdict, which is a statement about the evidence as of 2026: *no experiment has confirmed string theory*. The chapter deliberately shows all five chips. The ground is `OBSERVED ●`, the scaffold is `DERIVED ◑` and `CONJECTURED ◌`, and the fog is `SPECULATIVE ○`. The three-zone map is itself `ANALOGY ~`: **height on the map = distance from direct experimental evidence**. Height does not mean importance, beauty or likelihood of being true.

---

## Storyboard

### Global stage conventions (all beats)

- **World.** Scene units, y up. The ground is a disc of radius 7 at y = 0 drawn with `useIsoGridMaterial` (grid 0.5, Field lines at 16%, Abyss fill at 35%, no fresnel). `<Backdrop />` stays on. `scale()` returns `null` for the whole chapter, because the map has no physical length scale.
- **The map's single rule: four tiers by status.** These are the only heights used. They are disjoint, which is what makes the evidence ceiling (B6, Lab) exact.

  | Tier | Status | Height band (y) | Guide ring (y, radius 4.6) | Guide label (mono, left end) |
  |---|---|---|---|---|
  | 0 | `● OBSERVED` | 0.00–0.30 | (the ground grid) | `● MEASURED` |
  | 1 | `◑ DERIVED` | 1.30–2.50 | 1.90 | `◑ DERIVED · FOLLOWS FROM THE MATH` |
  | 2 | `◌ CONJECTURED` | 2.90–3.80 | 3.35 | `◌ CONJECTURED · STRONG EVIDENCE, UNPROVEN` |
  | 3 | `○ SPECULATIVE` | 4.30–6.20 | 5.25 | `○ SPECULATIVE · POSSIBLE, UNTESTED` |

  Guide rings are Ink-3 hairlines at 18%. A vertical axis hairline at (x = −5.2, z = 0) runs from y = 0 to 6.4 with an arrowhead and the label `DISTANCE FROM EXPERIMENT ↑`, plus a persistent tag bottom-left: `~ ANALOGY · HEIGHT = DISTANCE FROM EXPERIMENT · NOT IMPORTANCE, NOT TRUTH`.
- **Claim nodes (34).** Each is a billboarded glyph (0.26 world units; min 14 px, max 28 px) whose *shape is its chip*: ● filled (Ink `#ECE6D9`), ◑ ring with right half filled (Field `#86A8D8`), ◌ dashed ring (Conjectured `#A99BD6`), ○ hollow ring (Speculative `#7D8190`). Nodes are never warm. Hovering scales a node ×1.25 and brightens its label. Hover (desktop) or tap (touch/keyboard) opens its **claim card**: the one-line summary plus the 2–3 sentence detail from the Claim atlas below. Every node is focusable, and ←/→ cycle nodes within the current tier. Full data, positions and shader are in the Lab **Model**.
- **Labels.** `<SceneLabel>` mono uppercase with a hairline leader. Only the tier in focus shows labels, so the map never becomes a wall of text.
- **The Thread.** `<Filament>`, the only warm light in the chapter. It follows a centripetal Catmull–Rom spline through T0 (0.00, 1.20, 1.90) → D1 → D2 → D3 → D4 → D5 → D7 → D8 → C1 → C2 → C3 → S1 → T_end (−0.30, 6.25, −0.60), with 320 points, width 0.035 and minPixels 1.6. A `growth` value g ∈ [0, 1] sets how much of its arc length is drawn, and its tip carries a slightly brighter bead while growing. A slow travelling ripple (normal offset `0.02 · sin(12σ − 1.4t) · ambient()`) keeps it alive (`ANALOGY`). **The Thread starts in tier 1, never on the ground.** Two Field hairline **anchors** run from the ground nodes QUANTUM MECHANICS and SPECIAL RELATIVITY up to T0. String theory is *built on* tested principles, but no part of it sits on measured ground.
- **Struts.** Field hairlines at 22% form a light lattice between neighbouring tier-1 and tier-2 nodes, plus meaningful links: D6–D7 (`MATCH`), D5–D7 and D5–C1 (`D-BRANES MADE THESE POSSIBLE`), D4–C2, C2–C3, D8–S2, and a **dashed** G7 ⇢ D7 link carrying a small `≠` glyph (real black holes vs idealized ones).
- **Fog (tier 3).** Seven horizontal noise quads (10 × 10) at y = 4.3…6.2, Speculative grey at 5% alpha each, drifting at 0.01 units/s × `ambient()`, plus `GlowPoints` dust (1,200 × `particleScale()`, Ink-3, tiny).
- **Composition.** Desktop: `useViewShift` moves the subject right by 0.18 of the viewport width while beats are on screen, and returns [0, 0] at progress 0 and 1. Portrait phones: the subject sits in the upper 60% and labels are limited to three per tier.
- **Camera poses** (`<OrbitRig>`: azimuth, polar angle from +y, distance, target; fov 35°):

  | Pose | Azimuth | Polar | Distance | Target |
  |---|---|---|---|---|
  | H (handoff) | 0° | 90° | 10 | (0, 0, 0) |
  | P_ground | −12° | 70° | 11.5 | (0, 0.3, 0) |
  | P_scaffold | +10° | 74° | 12.5 | (0, 1.6, 0) |
  | P_count | 0° | 84° | 6.5 | (0, 2.0, 3.6) |
  | P_holo | 0° | 82° | 6.5 | (0, 3.3, 3.6) |
  | P_fog | −8° | 72° | 13 | (0, 4.6, 0) |
  | P_demand start → end | 0° | 80° → 86° | 17 → 10 | (0, 3.1, 0) → (0, 0.4, 0) |
  | P_lab | +15° | 76° | 15 | (0, 2.6, 0), interactive |

**Scroll map** (step id · length in viewports · approximate chapter progress): `title` 1.1 · 0.00–0.07 → `ground` 1.2 · 0.07–0.15 → `scaffold` 1.2 · 0.15–0.22 → `count` 1.5 · 0.22–0.32 → `hologram` 1.3 · 0.32–0.40 → `fog` 1.2 · 0.40–0.48 → **`demand` (aha) 1.5 · 0.48–0.57** → `lab` 2.4 · 0.57–0.73 → Epilogue `unseen` 1.0 · 0.73–0.79 → `verdict` 1.0 · 0.79–0.85 → `pluck` 1.3 · 0.85–0.94 → `rest` 1.0 · 0.94–1.00. Total ≈ 15.7 viewports; this is the finale, so it runs longer than a typical chapter. "Local p" below means `h.step(id)`.

---

### Opening: The honest ledger (`title`)

- **Text:** Ten chapters, one idea. Now an honest ledger. Every claim you met wore a mark: measured, derived, conjectured or speculative. Sort the claims by how far each stands from an experiment, and see what rests on solid ground.
- **Status:** `ANALOGY ~` (the map). Chip tooltip: *"Height on this map means distance from direct experimental evidence. It does not mean importance or truth."*
- **Stage:** **First frame = H0**: one Ink-white glowing point at screen center, HANDOFF camera, no view shift. This matches Chapter 10's closing thought that, from where we stand, a string would look like a point.
  - **Local p 0.00–0.30.** The point holds. The ground grid reveals radially from beneath it (`uReveal` 0 → 1) with a bright Field leading-edge ring. The camera cranes from H to P_ground (easeInOutCubic), and the point is revealed to be *standing on* a plane.
  - **0.25–0.35.** The point's GlowPoint cross-fades into the ● glyph of **G4 STANDARD MODEL** at the origin. The unresolved point becomes the first measured claim.
  - **0.30–0.75.** The other 13 ground glyphs pop in, staggered by radius (inner ring first), each with a one-frame Ink ring flash. Then the three empty tier guide rings draw on from bottom to top (dash-reveal), with their chip labels, and the vertical axis arrow draws up the left side. The ANALOGY tag fades in bottom-left.
  - **0.75–1.00.** Hold. The upper floors are empty rings, waiting.

  The title card sits lower-left: *What do we actually know?* Reduced motion: cross-fade from H0 straight to the composed ground view. Fallback SVG: a strata diagram with ground dots, three empty tier lines and the axis.

### Beat 1: Solid ground (`ground`)

- **Text:** Solid ground first. Quantum mechanics, relativity and the Standard Model have matched experiment for decades: the Higgs boson in 2012, gravitational waves in 2015. Even solid ground has cracks: [[dark matter]], dark energy, neutrino masses, and no tested quantum theory of gravity.
- **Status:** `OBSERVED ●`
- **Stage:** Camera at P_ground, orbiting slowly (azimuth −12° → +8° over the beat). Ground labels appear (Claim atlas, zone I):
  - `STANDARD MODEL · 1970s`
  - `QUANTUM MECHANICS · 1925–`
  - `SPECIAL RELATIVITY · 1905`
  - `GENERAL RELATIVITY · 1915`
  - `HIGGS BOSON · 2012`
  - `GRAVITATIONAL WAVES · 2015`
  - `BLACK HOLES · OBSERVED`

  Three **null-result** nodes carry a small extra tag `NULL RESULT`: `NO SUPERPARTNERS · LHC`, `NO DEVIATION FROM 1/r² · ≥ 52 µm` and `NO DIRECT SIGN OF STRINGS`. A null result is still a measurement, and it belongs on the ground.

  **Local p 0.50–0.90: the cracks.** Four jagged Field fractures draw outward from the four crack nodes (lengths 1.2–1.8, midpoint-displacement polylines). They are 1.5 px with a faint cool glow that breathes at 0.15 Hz. Labels:
  - `DARK MATTER · ≈ 84% OF MATTER`
  - `DARK ENERGY · ≈ 68% OF ENERGY`
  - `NEUTRINO MASS · < 0.45 eV`
  - `QUANTUM GRAVITY · NO TESTED THEORY`

  There is **no warm light anywhere** in this beat. A UI hint fades in once: *"Tap any point to read the claim."* Reduced motion: no orbit; the cracks appear drawn. Fallback SVG: ground dots with labels plus four crack lines.

### Beat 2: A structure built from mathematics (`scaffold`)

- **Text:** Above the ground stands a structure of mathematics, built on quantum mechanics and relativity. Its [[consistency condition]]s decide a lot: superstrings need ten dimensions; quantum anomalies cancel only for special symmetries (Green and Schwarz, 1984); every closed-string theory contains a graviton. All derived. None tested.
- **Status:** `DERIVED ◑`
- **Stage:**
  - **Local p 0.00–0.25.** The two anchor hairlines rise from QUANTUM MECHANICS and SPECIAL RELATIVITY and meet at T0 (y = 1.2). Label at T0: `BUILT ON TESTED PRINCIPLES · QUANTUM MECHANICS + RELATIVITY`.
  - **0.20–0.85.** The **Thread is born at T0**, the chapter's first warm light, and grows along its spline (g: 0 → g(D8)). As its bright tip passes each tier-1 node, the ◑ glyph pops with a small Field ring pulse and its label appears:
    - `10 DIMENSIONS · (26 FOR THE BOSONIC STRING)`
    - `ANOMALIES CANCEL · 1984`, with the sub-label `SO(32) · E₈×E₈ · BOTH OF DIMENSION 496`
    - `GRAVITON · MASSLESS SPIN 2`
    - `T-DUALITY · R ↔ α′/R`
    - `D-BRANES · 1995`
    - `MICROSTATES COUNTED · 1996`
    - `MIRROR SYMMETRY`, with the sub-label `317 206 375 CURVES · PREDICTED 1991`

    **D6 `BLACK-HOLE ENTROPY · S = A/4G`** appears *off* the Thread. It has a dashed Field link to D7 and a tag `GR + QUANTUM FIELDS · NOT STRING THEORY`. Struts fade in behind. The camera cranes from P_ground to P_scaffold.
  - **0.85–1.00.** The Thread's tip waits at D8, its free end trembling.

  Chip bar at the bottom: `◑ DERIVED · FOLLOWS FROM THE EQUATIONS · UNTESTED IN NATURE`. Reduced motion: the Thread fades in fully drawn. Fallback SVG: strata with ◑ nodes and a warm curve through them.

### Beat 3: Counting a black hole (`count`)

- **Text:** Bekenstein and Hawking concluded that a black hole carries entropy: one quarter of its horizon's area, in Planck units. Entropy counts hidden [[microstate]]s. In 1996 Strominger and Vafa counted them for idealized black holes built from strings and branes. For large charges, the count matched.
- **Status:** `DERIVED ◑` + `ANALOGY ~` (the diorama). Chip tooltip: *"The entropy formula comes from general relativity plus quantum fields; the count comes from string theory. Neither has been measured."*
- **Stage:** The atlas dims to 15% (Thread 30%). A hairline leader runs from D7 to a staging point (0, 2.0, 3.6), where a **diorama** grows (scale 0 → 1 over local p 0–0.10), facing the camera. Camera to P_count. Everything drawn here is schematic except the numbers, which come from the real leading-order formula (Lab **Model §7**).
  - **Phase A, weak coupling: count (local p 0.10–0.45).**
    - A Field hairline circle (radius 0.9, tilted 20° toward camera): `HIDDEN CIRCLE`.
    - **Q₅ = 5** translucent Field bands (thin torus sections nested at radius 0.9 ± 0.02k, iso-grid 12% fill): `Q₅ = 5 D5-BRANES · DRAWN AS BANDS`.
    - **Q₁ = 4** brighter Field rings: `Q₁ = 4 D1-BRANES`.
    - Short **warm arcs** (open strings, length 0.12) stretch between rings and bands and **all circulate the same way** at 0.6 rad/s. Their number grows `N = round(30 · smoothstep(0.12, 0.40, p))`. Caption: `ALL MOMENTUM FLOWS ONE WAY · THE SUPERSYMMETRIC (EXTREMAL) CASE`.
    - Left readout, large tabular digits: `ln Ω ≈ 2π√(Q₁Q₅N) = 2π√(4·5·N)`, live, with the small tag `LEADING ORDER`. At N = 30: `ln Ω ≈ 153.9 · Ω ~ 10⁶⁷ STATES`.
  - **Phase B, turn up the coupling (0.45–0.72).** A mono dial appears, `STRING COUPLING g_s · WEAK → STRONG`, scrubbed on a log scale, with the sub-label `HORIZON SMALLER THAN A STRING → LARGER`. A Void-filled sphere with a Field fresnel rim grows from the ring's center and swallows the rings, bands and arcs. A small local Field grid under the diorama bows toward it (cartoon). **The Ω readout does not change.** It gains the caption `UNCHANGED · SUPERSYMMETRY PROTECTS THIS COUNT`.
  - **Phase C, compare (0.72–1.00).** A right readout appears: `HORIZON AREA ÷ 4G₅ ≈ 153.9`. A Field `=` pulses between the two readouts. The Go-deeper equation shows with terms highlighted in sync (`Q1`, `Q5`, `N` during Phase A; `A5`, `G5` during Phase C). The sphere's on-screen area is drawn proportional to S. Caption: `SAME LEADING FORMULA, ¼ INCLUDED · LARGE CHARGES · EXTREMAL 5D BLACK HOLES ONLY`.
  - The dashed `≠` link from G7 on the ground brightens: `BLACK HOLES IN OUR SKY · MICROSTATES NOT COUNTED`.

  Tag: `~ ANALOGY · BRANES AND HIDDEN DIRECTIONS DRAWN SCHEMATICALLY · NUMBERS FROM THE REAL FORMULA, LEADING ORDER`. Reduced motion: three static phase frames cross-fade. Fallback SVG: ring, bands and arcs with `ln Ω ≈ 153.9` on the left, a sphere with `A/4G ≈ 153.9` on the right, `=` between them, and the tag `LEADING ORDER`.

### Beat 4: A world inside a box (`hologram`)

- **Text:** Chapter 8 previewed Maldacena's 1997 conjecture: string theory inside a curved, box-like [[anti-de Sitter space]] exactly equals a quantum theory without gravity on its boundary. Unproven, it has passed many demanding mathematical checks and helps model hot nuclear matter. Our universe is not this shape.
- **Status:** `CONJECTURED ◌` + `ANALOGY ~` (the can)
- **Stage:**
  - **Local p 0.00–0.20.** The diorama folds back into D7. The Thread grows on from D8 up into tier 2 (g → g(C3)), and the ◌ glyphs pop: `AdS/CFT · 1997`, `S-DUALITY · DUALITY WEB`, `M-THEORY · 1995`.
  - **0.20–0.90.** A second diorama grows at (0, 3.3, 3.6) and the camera moves to P_holo. The **can** is a Field wireframe cylinder (radius 1.0, height 1.8) with time running up. Its wall is iso-grid (10% fill, 25% lines). Three horizontal slices (bottom, middle, top) are **Poincaré disks**. The middle one carries 14 hyperbolic geodesics: circle arcs meeting the rim at right angles, which is faithful hyperbolic geometry. Labels: `INSIDE · STRING THEORY ON AdS₅ × S⁵ (GRAVITY)`, `BOUNDARY · 4D QUANTUM FIELD THEORY · NO GRAVITY`, `TIME ↑`.
    - Inside the middle slice, a tiny **warm closed loop** (radius 0.07) sinks from radius r = 0.85 to r = 0.10 as p runs 0.20 → 0.80.
    - On the wall at the same height, an **arc of 24 Ink points** is centered on the loop's direction. Its angular half-width is `θ(r) = π/2 − 2·arctan(r)`, and the Field geodesic joining the arc's ends passes exactly through the loop.
    - As the loop sinks deeper, its boundary pattern widens. Caption: `DEEPER INSIDE ↔ LARGER PATTERN ON THE BOUNDARY`.
  - **0.60–1.00: side annotations.**
    - `QUARK–GLUON PLASMA · OBSERVED ● · INFERRED η/s ≈ 0.06–0.11 · MODEL-DEPENDENT` beside `HOLOGRAPHIC VALUE 1/4π ≈ 0.080`, with the small caption `SIMILAR, NOT A TEST OF STRINGS`.
    - `OUR UNIVERSE · Λ > 0 · NOT ANTI-DE SITTER`.
  - **0.90–1.00.** The can folds back into C1.

  Tag: `~ ANALOGY · 2 SPACE DIRECTIONS + TIME DRAWN (AdS₅ HAS 4 + 1) · S⁵ OMITTED`. Reduced motion: the loop is shown at three depths as static ghosts, each with its boundary arc. Fallback SVG: cylinder, disk slice, one loop, arc and geodesic.

### Beat 5: Fog (`fog`)

- **Text:** Above the scaffold, fog. Does string theory describe our universe at all? Its equations seem to allow a vast [[string landscape]] of solutions (one rough estimate: 10⁵⁰⁰), each with different physics. Critics ask whether it is testable. Rival approaches exist. None, strings included, is confirmed.
- **Status:** `SPECULATIVE ○` (+ `ANALOGY ~` on the terrain)
- **Stage:** Camera to P_fog. The fog layers and dust fade in.
  - **The Thread continues** from C3 through S1 toward T_end. Over its last 15% it **frays** into three thinner strands (lateral offset ±0.04 s², where s ∈ [0, 1] along the frayed segment) that fade to nothing in the haze: the idea runs into the unknown.
  - The nine ○ nodes pop in and drift gently (Brownian, amplitude 0.05, × `ambient()`): `OUR UNIVERSE?`, `WHICH HIDDEN SHAPE?`, `SUPERSYMMETRY WITHIN REACH?`, `LANDSCAPE · ~10⁵⁰⁰`, `MULTIVERSE?`, `DE SITTER VACUA?`, `M-THEORY, FULLY?`, `OTHER ROUTES`, `HOW TO TEST IT?`.
  - **Landscape terrain.** A floating hairline height-field (5 × 5 units, tilted 15° toward the camera) centered at S4, with about 160 dips. Tags: `~ ANALOGY · A 2D STAND-IN FOR A SPACE OF HUNDREDS OF DIMENSIONS · EACH DIP ≈ ONE VACUUM` and `OFTEN QUOTED: ~10⁵⁰⁰ · A ROUGH ESTIMATE`.
  - **Rival routes.** Near S8, four small Field sketches (not warm, since they are not strings) sit in a 2 × 2 cluster, each tagged `UNTESTED`:
    - `LOOP QUANTUM GRAVITY`: a spin-network graph.
    - `ASYMPTOTIC SAFETY`: flow lines converging on a fixed point toward high energy.
    - `CAUSAL SETS`: sprinkled dots with causal links.
    - `CAUSAL DYNAMICAL TRIANGULATIONS`: a strip of triangles.
  - Near S9: `IS IT TESTABLE? · A LIVE DEBATE`.

  Reduced motion: no drift and no fraying animation (the frayed end is drawn static). Fallback SVG: fog band with hollow rings and the frayed thread end.

### Beat 6: The aha. Demand a measurement (`demand`)

- **Text:** Now demand a measurement. The fog clears. The scaffold fades. What remains is superb, unfinished physics, with no superpartner, no extra dimension and not one string. The Thread you have followed for ten chapters has never been observed.
- **Status:** `OBSERVED ●` (a statement about the evidence, 2026)
- **Stage (the chapter's biggest moment):**
  1. **Local p 0.00–0.10: see it all.** The camera pulls out to P_demand start and the whole structure is visible: ground, scaffold, warm Thread, fog. The **evidence ceiling** materializes above the fog at y = 6.8. It is a disc of radius 7.5 with a faint iso-grid (3% fill, 8% lines) and a crisp Field rim ring (1.5 px, 80%, with a soft 12 px cool glow). Rim label: `EVIDENCE REQUIRED · ○ ANY SCENARIO`.
  2. **0.10–0.85: the ceiling descends one tier at a time**, pausing at each detent (Model §3), and the rim label updates (`◌ + CONJECTURED`, `◑ + DERIVED`, `● MEASURED ONLY`). Everything above the ceiling fades to a **ghost**: a dashed Ink-3 outline at 7%. It is faded, not deleted. The camera descends with the ceiling so that the rim stays in the upper third of the frame.
     - **○ passes:** the fog thins and clears, and the frayed end of the Thread goes out.
     - **◌ passes:** the conjectures ghost, and the Thread dissolves **from the top down**, vertex by vertex.
     - **◑ passes (local p ≈ 0.65–0.80; the Thread's last vertex goes dark at ≈ 0.75):** the last warm segment near T0 shrinks to a single glint and **goes out**. If audio is on, the ambient hum fades to silence at this instant. No sound replaces it.
  3. **0.85–1.00: THE FRAME.** The camera reaches P_demand end, low over the ground, looking across the ● nodes and the four glowing cracks. Every light on screen is ink-white or cool blue: **the site's only warm light is gone.** Readouts fade in, centered under the ground:

     `DETECTED SO FAR · STRINGS 0 · SUPERPARTNERS 0 · EXTRA DIMENSIONS 0`

     `CLAIMS SHOWN 14 / 34 · STRING-THEORY CLAIMS SHOWN 0 / 17`

     A caption fades in beneath them: *"Only strings glow warm on this site. Measured ground has none."* The ghosts above are just visible as faint dashed rings: ideas that remain worth testing.

  Reduced motion: four static cross-faded states, one per detent. Fallback SVG: the strata diagram with everything above a dashed line labelled `EVIDENCE CEILING: MEASURED ONLY` greyed out, and the thread drawn only as a dashed grey ghost.

---

### Claim atlas (hover and tap cards)

Every node carries a one-line **summary** (shown first) and a **detail** of 2–3 sentences (shown on expand). `ST` = string-theory claim (it counts toward the `STRING-THEORY CLAIMS SHOWN` readout). A term in `[[ ]]` links to the glossary.

**Zone I: Established physics, tier 0, `● OBSERVED`** (14 nodes; none is a string-theory claim)

- **G4 · ● · `STANDARD MODEL · 1970s`**. *The quantum theory of all known particles and three of the four forces.* Assembled in the 1960s–70s, it predicted the W and Z bosons (found 1983), the top quark (1995) and the Higgs boson (2012). Its prediction of the electron's magnetism matches measurement to about one part in a trillion. It leaves out gravity, dark matter and, in its original form, neutrino masses.
- **G1 · ● · `QUANTUM MECHANICS · 1925–`**. *At small scales nature comes in discrete amounts, described by probabilities.* Formulated in 1925–26 by Heisenberg, Schrödinger and others, it underlies chemistry, lasers and every transistor. Tests of entanglement, its strangest feature, won the 2022 Nobel Prize. String theory is built on it.
- **G2 · ● · `SPECIAL RELATIVITY · 1905`**. *Space and time mix, and nothing outruns light.* Einstein, 1905. It is confirmed daily in particle accelerators. String theory is built to respect it: its [[consistency condition]]s come from demanding quantum mechanics and relativity at once.
- **G3 · ● · `GENERAL RELATIVITY · 1915`**. *Gravity is the curvature of spacetime.* It explains Mercury's orbit, bends starlight, corrects GPS clocks, and predicted black holes and gravitational waves. It is classical: combined with quantum theory in the usual way, it stops making predictions near the Planck energy.
- **G5 · ● · `HIGGS BOSON · 2012`**. *The last particle the Standard Model predicted, found at CERN.* The ATLAS and CMS experiments announced it on 4 July 2012, at about 125 GeV. Its field gives the W, Z, quarks and charged leptons their masses. No particle beyond the Standard Model has turned up at the LHC so far.
- **G6 · ● · `GRAVITATIONAL WAVES · 2015`**. *Ripples in spacetime, detected directly.* LIGO caught the first on 14 September 2015, from two merging black holes, and many more have followed. Their stretch-and-squeeze pattern is general relativity's spin-2 pattern (Chapter 4). No individual graviton has been detected.
- **G7 · ● · `BLACK HOLES · OBSERVED`**. *Black holes are real: we see their mergers, their shadows and stars orbiting them.* The evidence includes gravitational waves, Event Horizon Telescope images (M87* in 2019, Sagittarius A* in 2022) and decades of stellar orbits at our galaxy's center. In 2025 the merger GW250114 confirmed, with high confidence, Hawking's classical rule that total horizon area never shrinks. Their entropy has never been measured.
- **G8 · ● · `NO SUPERPARTNERS · LHC` · NULL RESULT**. *No supersymmetric partner particle has been seen.* In simplified models, ATLAS and CMS exclude gluinos (the gluon's partners) lighter than about 2.1–2.4 TeV and light-flavour squarks lighter than about 1.75 TeV. This rules out many, not all, models with light superpartners. Many string constructions are supersymmetric at very high energies, but string theory does not fix the energy at which superpartners would appear.
- **G9 · ● · `NO DEVIATION FROM 1/r² · ≥ 52 µm` · NULL RESULT**. *Gravity still follows Newton's inverse-square law down to 52 micrometres.* Torsion-balance experiments see no deviation, and collider searches find no sign of large extra dimensions. Hidden dimensions far smaller than this, as string theory usually assumes, remain untested.
- **G10 · ● · `NO DIRECT SIGN OF STRINGS` · NULL RESULT**. *No experiment has detected a string or confirmed a string-specific prediction.* If strings are near the Planck length, probing them directly needs about 10¹⁵ times the LHC's energy (Chapter 10). Proposed indirect signs, such as cosmic superstrings, have been searched for and not found. Not seeing strings is expected if they are that small, so this is not a refutation either.
- **K1 · ● · `DARK MATTER · ≈ 84% OF MATTER`** (crack). *Most matter is invisible and is not any known particle.* Galaxy rotation, gravitational lensing and the cosmic microwave background all point to it, and Planck data give it about 84% of all matter. What it is remains unknown; string constructions offer candidates, such as axion-like particles, but no unique prediction.
- **K2 · ● · `DARK ENERGY · ≈ 68% OF ENERGY`** (crack). *The universe's expansion is speeding up.* It was discovered with distant supernovae in 1998 (Nobel Prize 2011) and makes up about 68% of the universe's energy. The simplest description, a cosmological constant, has a small value that no theory explains. Recent DESI survey data hint that it may change over time; this is not yet conclusive.
- **K3 · ● · `NEUTRINO MASS · < 0.45 eV`** (crack). *Neutrinos have mass, which the original Standard Model did not allow.* Neutrino oscillations, established from 1998 (Nobel Prize 2015), require at least two neutrinos to have mass. KATRIN caps the electron neutrino's effective mass at 0.45 eV, under a millionth of the electron's. How neutrinos get their mass is unknown.
- **K4 · ● · `QUANTUM GRAVITY · NO TESTED THEORY`** (crack). *No tested quantum theory of gravity exists.* General relativity plus quantum field theory works at everyday energies but loses predictive power near 10¹⁹ GeV, inside black holes and at the Big Bang (Chapter 4). There are several candidate theories, string theory among them, and none has experimental support.

**Zone II: Strong theoretical results, tier 1, `◑ DERIVED`** (8 nodes)

- **D1 · ◑ · ST · `10 DIMENSIONS`**. *Superstrings in their standard form are consistent only in ten spacetime dimensions (the purely bosonic string needs 26).* A classical string can move in any number of dimensions, but demanding quantum mechanics and relativity together singles out one number. In any other dimension, quantum effects either break a symmetry the theory needs or produce negative probabilities. This is a derived requirement, not a measured fact about our universe (Chapter 5).
- **D2 · ◑ · ST · `ANOMALIES CANCEL · 1984`**. *A threatened quantum inconsistency cancels, but only for special symmetry groups.* In 1984 Green and Schwarz showed that the quantum [[anomaly]] threatening ten-dimensional supersymmetric theories with gravity cancels if the force-symmetry group is SO(32) or E₈ × E₈. Both groups have dimension 496. The SO(32) case fits type I superstrings; the heterotic string (1985) realized both groups, giving the first string theory with E₈ × E₈. The result revived the field.
- **D3 · ◑ · ST · `GRAVITON · MASSLESS SPIN 2`**. *Every closed-string theory contains a massless spin-2 particle that behaves as the graviton.* Nobody put it in; consistency forces it (Yoneya; Scherk and Schwarz, 1974). At low energies it interacts the way general relativity requires. Gravitons themselves have never been detected (Chapter 4).
- **D4 · ◑ · ST · `T-DUALITY · R ↔ α′/R`**. *A string on a circle of radius R has the same physics as on radius α′/R.* Momentum and winding trade places, so two different geometries describe one physics (Chapter 8). The equivalence holds at every order of string perturbation theory and is believed to hold completely.
- **D5 · ◑ · ST · `D-BRANES · 1995`**. *The surfaces where open strings end are real, dynamical objects in the theory.* Introduced in 1989, they came to the fore in 1995, when Polchinski showed that D-branes carry the charges string dualities require. They made black-hole counting and AdS/CFT possible. Braneworld scenarios built on them are speculative (Chapter 7).
- **D6 · ◑\* · `BLACK-HOLE ENTROPY · S = A/4G`**. *A black hole's entropy is one quarter of its horizon area, in Planck units.* Bekenstein argued that black holes carry entropy (1972–73), and Hawking's radiation calculation (1974–75) fixed the ¼. The result comes from general relativity plus quantum fields, not string theory, and it has never been measured. A solar-mass black hole would hold about 10⁷⁷ units. **Chip tooltip override:** *"Derived in ordinary GR + quantum field theory, not in string theory. Not measured."* (not ST)
- **D7 · ◑ · ST · `MICROSTATES COUNTED · 1996`**. *For special black holes, string theory counts the states behind S = A/4G.* Strominger and Vafa counted bound states of strings and branes for extremal, supersymmetric black holes in five dimensions. For large charges the count matched Bekenstein–Hawking, ¼ included, and later work extended it to near-extremal cases and even to Hawking radiation rates. Ordinary astrophysical black holes are not covered.
- **D8 · ◑ · ST · `MIRROR SYMMETRY · 317 206 375`**. *Physics predicted answers to old geometry problems, and mathematicians later established them.* Pairs of different Calabi–Yau shapes give identical string physics. In 1991 Candelas and colleagues used this to predict 317,206,375 degree-three curves on the quintic threefold. A mathematical computation first disagreed until an error was found in its computer code, and mirror formulas became theorems in 1996–2000. This confirmed mathematics, not nature.

**Zone II: Strong theoretical results, tier 2, `◌ CONJECTURED`** (3 nodes)

- **C1 · ◌ · ST · `AdS/CFT · 1997`**. *String theory in anti-de Sitter space equals a quantum field theory without gravity on its boundary.* Maldacena's 1997 conjecture, in one of the most-cited papers in high-energy physics, has passed many demanding mathematical checks but is not proven in general. If it holds, it defines a quantum theory of gravity, though in a universe shaped unlike ours. It already supplies approximate tools for strongly interacting matter such as quark–gluon plasma.
- **C2 · ◌ · ST · `S-DUALITY · DUALITY WEB`**. *Strong coupling in one string theory matches weak coupling in another, or in the same theory.* The strongest evidence comes from supersymmetry-protected states whose counts match on both sides (Sen 1994; Witten 1995). T-duality is exact in perturbation theory, while the S-dualities remain conjectures, though heavily supported (Chapters 8–9).
- **C3 · ◌ · ST · `M-THEORY · 1995`**. *The five superstring theories look like limits of one larger theory, which in yet another limit is eleven-dimensional.* Witten proposed it in 1995 from the web of dualities, and at low energies it becomes 11-dimensional supergravity. Its existence is strongly supported, but its complete formulation is unknown (Chapter 9).

**Zone III: Open questions, tier 3, `○ SPECULATIVE`** (9 nodes)

- **S1 · ○ · ST · `OUR UNIVERSE?`**. *Does string theory describe our universe? Unknown.* String theory contains gravity and forces like ours, but containing them is not the same as predicting their details. Whether nature uses it is the open question this whole site circles.
- **S2 · ○ · ST · `WHICH HIDDEN SHAPE?`**. *If string theory is right, which compactification is ours? Unknown.* Some constructions reproduce the Standard Model's list of particles (plus superpartners), for example heterotic models from 2005. None has been shown to reproduce all its measured masses and strengths (Chapter 6).
- **S3 · ○ · `SUPERSYMMETRY WITHIN REACH?`**. *Superpartners at accessible energies were hoped for, and none has been found.* Many physicists expected superpartners near the TeV scale, partly to explain why the Higgs boson is so light, but LHC searches have found none (see the ground). String theory remains consistent with much heavier superpartners.
- **S4 · ○ · ST · `LANDSCAPE · ~10⁵⁰⁰`**. *The equations appear to allow an enormous number of possible vacua, each with different low-energy physics.* The often-quoted ~10⁵⁰⁰ is a rough 2003–04 estimate of flux vacua (Douglas; Ashok and Douglas), and a 2015 estimate for a single geometry gave ~10²⁷²⁰⁰⁰. These count possible solutions, not universes that exist. If so many are allowed, unique predictions become hard, and critics call this a loss of predictive power.
- **S5 · ○ · ST · `MULTIVERSE?`**. *Perhaps many vacua are realized in different regions of an inflating cosmos.* Some use this idea to explain why dark energy is small: we could only live where it is. Weinberg made a related estimate in 1987, before dark energy's 1998 discovery. Others see this anthropic reasoning as giving up on explanation, and no observation tests it yet.
- **S6 · ○ · ST · `DE SITTER VACUA?`**. *Can string theory produce a universe with positive dark energy, like ours? Debated.* The KKLT construction (2003) proposed how, while swampland conjectures (2018) question whether such vacua exist at all. The dispute is technical and live, and evidence that dark energy changes over time would reshape it.
- **S7 · ○ · ST · `M-THEORY, FULLY?`**. *Its complete formulation is unknown.* M-theory is known through its limits: the five string theories, 11-dimensional supergravity, and matrix models (1996) for some backgrounds. What its fundamental ingredients are in general is not known.
- **S8 · ○ · `OTHER ROUTES`**. *String theory is not the only candidate for [[quantum gravity]].* Loop quantum gravity (from 1986), asymptotic safety (proposed 1979), causal sets (1987) and causal dynamical triangulations (1998) take different routes. Each has results of its own and open problems, and none has experimental confirmation.
- **S9 · ○ · ST · `HOW TO TEST IT?`**. *No agreed decisive test exists yet.* Possible clues include cosmic superstrings, signs of extra dimensions or superpartners, and patterns in the early universe, but none is unique to strings. Critics such as Smolin, Woit, and Ellis and Silk warn against accepting untested theories. Some defenders argue that consistency and explanatory success count as evidence (Dawid), a view that is itself contested.

Count check: ST = D1–D5, D7, D8 (7) + C1–C3 (3) + S1, S2, S4, S5, S6, S7, S9 (7) = **17**. Nodes = 14 + 8 + 3 + 9 = **34**.

---

## Lab

### Referee's Bench

**Purpose:** Telling *measured* from *derived* from *conjectured* from *possible* is a skill. Set how much evidence you demand, then judge claims yourself and watch each one settle at its true height.

**Layout:** The full map from the Storyboard is on stage at P_lab (drag to orbit). The **evidence ceiling** is visible. The glass panel docks bottom-right (desktop, ≈360 px) or as a bottom sheet (phones, with the map composed in the upper 60%). The panel has two sections: **Evidence required** (the ceiling) and **Referee** (one claim at a time). Tapping any node anywhere opens its claim card.

### Controls

| Control | Type | Range | Default | Units | Notes |
|---|---|---|---|---|---|
| `ceiling` (Evidence required) | slider with 4 labelled detents | 0–3 (0 = `● MEASURED ONLY`, 1 = `◑ + DERIVED`, 2 = `◌ + CONJECTURED`, 3 = `○ + SPECULATIVE`) | **0** (continues from B6) | tier index L | Continuous while dragging (step 0.01); snaps to the nearest detent on release (250 ms easeInOutCubic). Keyboard ←/→ moves one detent. The value text shows the chip glyph and name. |
| `claim` (Referee) | card with 4 chip buttons (● ◑ ◌ ○) + `Next claim` | 9 claims, fixed order | claim 1 | — | Buttons are keyboard focusable and carry accessible names ("Observed", "Derived", "Conjectured", "Speculative"). |
| `labels` | toggle | on / off | **on** | — | Node labels for all tiers (overrides the focus-tier rule). |
| `reset` | button | — | — | — | Sets L = 0, clears referee answers. |
| node tap/hover | in-scene | 34 nodes | — | — | Opens the claim card (atlas). |

**Referee claims** (fixed order; the true tier and target node are shown after answering):

| # | Claim shown | True | Node | Reason (≤ 20 words) |
|---|---|---|---|---|
| 1 | Neutrinos have mass. | ● | K3 | Oscillation experiments since 1998 require it. The original Standard Model had massless neutrinos. |
| 2 | No superpartner has turned up at the LHC. | ● | G8 | A null result is a measurement too. It rules out many, not all, supersymmetric models. |
| 3 | Superstrings are consistent only in ten spacetime dimensions. | ◑ | D1 | It follows from the theory's equations. Whether our universe has extra dimensions is unknown. |
| 4 | Every closed-string theory contains a graviton. | ◑ | D3 | Forced by consistency and checked many ways. No graviton has ever been detected. |
| 5 | String theory counts the microstates behind the entropy of certain black holes. | ◑ | D7 | A calculation for idealized 5D supersymmetric black holes. Black holes in our sky are not covered. |
| 6 | Gravity in anti-de Sitter space equals a quantum theory on its boundary. | ◌ | C1 | Passed many demanding checks, still unproven. Our universe is not anti-de Sitter. |
| 7 | The five superstring theories are limits of one M-theory. | ◌ | C3 | Dualities strongly support it. Nobody has M-theory's complete formulation. |
| 8 | Our universe has six tiny hidden dimensions. | ○ | S2 | Needed only if superstring theory describes our world. None has been detected. |
| 9 | We live in one of ~10⁵⁰⁰ universes. | ○ | S5 | 10⁵⁰⁰ roughly counts possible solutions, not existing universes. That many are realized is untested. |

### What changes on screen

- **Moving the ceiling.** The luminous ceiling disc glides to the height for L (Model §3). Everything above it fades to a dashed Ink-3 ghost, and everything below returns to full form.
  - At **L = 0** the map is ink-white and cool blue only: ground, null results and cracks, with no warm light.
  - At **L = 1** the anchors and the lower Thread reappear, **warm again**, strung through the ◑ nodes, and the Thread is cut cleanly where it crosses the ceiling.
  - At **L = 2** the Thread climbs through the conjectures.
  - At **L = 3** the fog rolls back in and the Thread's frayed end returns.
- **Readouts** (mono, under the slider):
  - `ADMITTED ● ◑ …` (the glyphs of every tier ≤ L)
  - `CLAIMS SHOWN n / 34`
  - `STRING-THEORY CLAIMS SHOWN k / 17`
  - `THREAD HIDDEN | PARTLY SHOWN | SHOWN`
  - `WARM LIGHT OFF | ON`

  Each readout is announced politely (`aria-live`) when it changes.
- **Judging a claim.**
  1. The visitor picks a chip. A small **token** with the chosen glyph flies from the panel edge into the scene and hovers *at the height of the chosen tier*, directly above or below the true node.
  2. After 0.4 s it **slides vertically to the true node's height** (easeInOutCubic, 0.8 s), trailing a Field hairline that shows the distance travelled, labelled `Δ = 1 TIER` or `Δ = 2 TIERS`.
  3. On arrival it merges into the node, which pulses. The token's direction teaches: *sliding down* means the visitor was too cautious; *sliding up* means too sure.
  4. The card shows the verdict line and the reason.
  5. If the true tier is above the current ceiling, the token lands as a ghost with the note *"Hidden above your evidence ceiling. Admit more to see it."*

  The camera eases (damped, not snapped) to frame the node.
- **Score readout** after each answer: `YOU AND THE REFEREE AGREE ON k OF n`. After claim 9: the closing line (Micro-copy).

### Model (implement exactly)

**§1 Data.** One static array of 34 records: `{ id, tier: 0|1|2|3, chip, st: boolean, onThread: boolean, pos: [x, y, z], label, summary, detail, links: id[] }`. The text is from the Claim atlas. Positions are fixed (tiers by y), with rings and helix pre-computed:

| id | pos (x, y, z) | id | pos (x, y, z) | id | pos (x, y, z) |
|---|---|---|---|---|---|
| G4 | (0.00, 0.06, 0.00) | K1 | (+3.59, 0.06, +0.31) | D6 | (−3.25, 1.95, −1.31) |
| G1 | (−1.15, 0.06, +1.64) | K2 | (+2.76, 0.06, −2.31) | C1 | (−0.96, 2.95, +1.98) |
| G2 | (+1.15, 0.06, +1.64) | K3 | (−3.12, 0.06, −1.80) | C2 | (+1.07, 3.35, +1.92) |
| G3 | (−1.88, 0.06, −0.68) | K4 | (−1.23, 0.06, −3.38) | C3 | (+2.19, 3.75, +0.23) |
| G5 | (+1.88, 0.06, −0.68) | D1 | (−1.30, 1.35, +2.25) | S1 | (+1.23, 4.50, −1.03) |
| G6 | (−0.52, 0.06, −1.93) | D2 | (+0.97, 1.53, +2.41) | S2 | (+1.09, 4.70, +3.01) |
| G7 | (+0.52, 0.06, −1.93) | D3 | (+2.50, 1.72, +0.72) | S3 | (−3.12, 4.60, +1.80) |
| G8 | (−3.95, 0.06, +1.44) | D4 | (+2.10, 1.90, −1.53) | S4 | (+2.42, 5.20, −1.40) |
| G9 | (−1.09, 0.06, +4.06) | D5 | (+0.09, 2.08, −2.60) | S5 | (+0.59, 5.70, −3.35) |
| G10 | (+2.70, 0.06, +3.22) | D7 | (−1.99, 2.27, −1.67) | S6 | (−1.54, 5.40, −1.84) |
| | | D8 | (−2.54, 2.45, +0.54) | S7 | (+1.04, 5.90, +0.60) |
| | | | | S8 | (−4.33, 5.00, −0.76) |
| | | | | S9 | (−0.52, 5.80, +2.95) |

T0 = (0.00, 1.20, 1.90) and T_end = (−0.30, 6.25, −0.60). The ○ nodes' Brownian drift is an offset of at most 0.05 around these positions.

**§2 Glyph shader** (instanced billboard quads, one draw call). With `uv ∈ [−1, 1]²`, `d = length(uv)`, `aa = fwidth(d)` and `ring(w) = 1 − smoothstep(w − aa, w + aa, |d − 0.78|)`:

| Chip | Coverage |
|---|---|
| ● | `fill = 1 − smoothstep(0.78 − aa, 0.78 + aa, d)` |
| ◑ | `max(ring(0.07), fill · step(0, uv.x))`, with `fill` the ● coverage above, i.e. the right half filled like the glyph |
| ◌ | `ring(0.06) · step(fract(atan(uv.y, uv.x) / TAU · 12), 0.55)` (12 dashes) |
| ○ | `ring(0.06)` |
| ghost | `ring(0.05) · step(fract(atan(uv.y, uv.x) / TAU · 16), 0.5)` in Ink-3, drawn at 7% × presence |

The node color is its status color, never Filament.

**§3 Evidence ceiling.** `L ∈ [0, 3]`. Its height is piecewise-linear through the detents, placed in the gaps between tier bands:

`y_c(L) = interp(L; [0, 1, 2, 3] → [0.80, 2.70, 4.05, 6.80])`

The displayed `y_c` follows the target with `damp(λ = 4 s⁻¹)`.

Visibility of any object with reference height `y_ref`:

`a(y_ref) = 1 − smoothstep(y_c − 0.12, y_c + 0.12, y_ref)`

- Nodes: `y_ref` = node y. They render the full glyph at alpha `a`, cross-fading to the ghost glyph at `max(0.07, …)` as `a → 0`.
- Thread: **per vertex**, `y_ref` = vertex y, with **no ghost floor** (alpha → 0). Because the Thread's lowest vertex (y = 1.2) lies above `y_c(0) + 0.12 = 0.92`, the Thread is fully hidden at L = 0.
- Anchors and struts: `y_ref` = the **higher** endpoint, so the anchors vanish whole at L = 0 and leave no warm-adjacent stubs on the ground.
- Fog layers and dust: `y_ref` = layer y.
- Cracks and the ground: always visible.

**Scroll-driven descent in B6.** With `q = clamp((p − 0.10) / 0.75, 0, 1)`, `k = min(floor(3q), 2)` and `f = easeInOutCubic(clamp((3q − k − 0.2) / 0.6, 0, 1))`:

`L = 3 − (k + f)`

This gives a plateau at each detent for the first and last 20% of each third. The camera target y and distance lerp with `(3 − L)/3` from P_demand start to P_demand end. Check values: the ◑ third runs over p ≈ 0.65–0.80, and the Thread's lowest vertex (y = 1.20) reaches alpha 0 when the target `y_c ≤ 1.08`, i.e. L ≤ 0.147, at p ≈ 0.75 (slightly later on screen because of the damping).

**§4 Readouts.**
- `CLAIMS SHOWN = Σ [a_i ≥ 0.5]` over the 34 nodes.
- `STRING-THEORY CLAIMS SHOWN = Σ [a_i ≥ 0.5 ∧ st_i]`.
- `THREAD`: `HIDDEN` if max vertex alpha < 0.05, `SHOWN` if min alpha over drawn vertices > 0.95, otherwise `PARTLY SHOWN`.
- `WARM LIGHT` = `ON` iff the Thread is not hidden.

Update the DOM only when a value changes.

**§5 Referee logic.** Tier indices: ● 0, ◑ 1, ◌ 2, ○ 3. With chosen `c` and true `t`:
- `c = t` → "Agreed."
- `c < t` → "Too sure." (the visitor claimed more certainty than exists)
- `c > t` → "Firmer than that."

Append the claim's reason in each case. The token starts at `y = y_tier(c)` (the middle of that tier's band, directly above or below the target node's x, z) and slides to the node's y. `Δ = |c − t|` tiers is labelled on the trail. Score = the count of `c = t`. There is no penalty and no timer; answers can be changed, and the latest answer counts.

**§6 Thread geometry.** Centripetal Catmull–Rom (α = 0.5) through the control points listed in the Storyboard conventions, resampled to 320 points of equal arc length. The growth mask sets vertex alpha 0 beyond arc fraction `g`. The end fray starts at arc fraction 0.85: three strands, strand j offset along the local normal/binormal by `0.04 · s² · (j − 1)` with s ∈ [0, 1] over the frayed part, and alpha × (1 − s). The fray is decorative (`ANALOGY`).

**§7 Beat 3 numbers (Strominger–Vafa, D1–D5–P system), faithful.** With Q₁ = 4, Q₅ = 5 and integer N ∈ [0, 30]:

- `S(N) = 2π √(Q₁ Q₅ N)` (the leading-order value of ln Ω)
- `log₁₀ Ω ≈ S / ln 10`

At N = 30: S = 2π√600 = 153.906 and S / ln 10 = 66.84, so the leading formula gives Ω ≈ 6.9 × 10⁶⁶. **Display Ω only as `~ 10^k` with k = round(S / ln 10), live while N scrubs (`~ 10⁶⁷` at N = 30), never as a two-significant-figure Ω**, and keep the `LEADING ORDER` tag on both readouts. The right readout shows the same S, labelled `A₅/4G₅` (two-derivative supergravity gives exactly this formula). Exact counts differ at these modest charges: the exact supersymmetric index for the Strominger–Vafa system on K3 × S¹ (DMVV product formula, level Q₁Q₅ + 1 = 21, N = 30, J = 0; computed for this review) is ≈ 5.8 × 10⁶⁷, so ln Ω ≈ 156.0 against 153.9 from the leading formula (157.7 if the level shift is kept). ln Ω agrees to about 1–2%, while Ω itself differs by about a factor of 8. The agreement improves as the charges grow. The caption says "leading formula, large charges".

The coupling dial is **cartoon**: it displays g_s on an unlabelled log axis from `WEAK` to `STRONG`. At weak coupling the would-be horizon is smaller than the string scale, so the flat-space brane picture applies. At strong coupling the horizon is larger than the string scale and the black-hole picture applies (Horowitz, gr-qc/9604051). The horizon sphere's radius is `R_vis = 0.55 · √(S / 153.906)`, so its drawn area ∝ S (cartoon mapping). It is a 2-sphere standing in for a 3-dimensional horizon.

**§8 Beat 4 geometry (Poincaré disk), faithful geometry and cartoon physics.**
- A geodesic with endpoints at boundary angles `φ ± θ` is the circle centered at distance `sec θ` from the origin in direction φ, with radius `tan θ`. Its closest approach to the center is `r_min = sec θ − tan θ = tan(π/4 − θ/2)`. Inverting gives the footprint rule `θ(r) = π/2 − 2 arctan(r)`, used for the 24-point arc (points at angles `φ + θ·(2i/23 − 1)` on the wall).
- The 14 decorative geodesics use random `(φ, θ)` with θ ∈ [0.25, 1.3] rad (seeded).
- The *interpretation*, bulk depth ↔ boundary scale, is the UV/IR relation of AdS/CFT (`CONJECTURED ◌` along with the whole duality). The loop is a cartoon.

**§9 Beat 5 landscape terrain (cartoon).** A 96 × 96 grid over [−2.5, 2.5]² with height

`z(u, v) = −Σₖ₌₁¹⁶⁰ aₖ exp(−|x − cₖ|² / 2σₖ²) + 0.12 · fbm(x)`

where `x = (u, v)` is the grid point (not the scroll progress p), using seeded `cₖ`, `aₖ ∈ [0.05, 0.18]` and `σₖ ∈ [0.08, 0.22]`. Hairlines are drawn every 4 cells. The displayed number `~10⁵⁰⁰` is a quoted estimate, **not** the number of dips drawn. The caption says so.

**§10 Epilogue pluck.** This is the prologue Thread model, reused so that the last pluck rings like the first:

`y(σ, t) = Σₙ₌₁⁸ aₙ(t) cos(nπσ)`

- Free-end modes, faithful for an open string.
- Pluck shape `y₀ = h · exp(−(σ − σ₀)² / (2 · 0.06²))`, with the drag capped at 12% of the length.
- `aₙ(0) = 2∫₀¹ y₀ cos(nπσ) dσ` for n ≥ 1.
- `aₙ(t) = aₙ(0) cos(2π n f₁ t) e^{−γₙ t}`, with f₁ = 0.9 Hz and γₙ = 0.6 + 0.15n s⁻¹. The damping is fictional and marked ANALOGY.
- After the modes decay, blend over 1.2 s into `<HandoffOpenString/>`'s canonical fundamental-mode motion.
- Reduced motion: a single slow decay at f₁ = 0.3 Hz.

**What is faithful and what is cartoon**

| Element | Verdict |
|---|---|
| The status of every claim, the atlas text and the referee answers | **Faithful** (see Numbers & facts) |
| Height = status tier; the ceiling cut | **Faithful to the data model**. The *map metaphor* (ground, scaffold, fog) is **ANALOGY**. |
| The Thread strung through derived and conjectured nodes | **ANALOGY**: a picture of "string theory's results", not a physical object |
| B3 numbers `2π√(Q₁Q₅N)` and the match with `A₅/4G₅` | **Faithful** as the leading-order formula for large charges. At the drawn charges the exact count differs by a few percent in ln Ω (Model §7), so Ω is shown only as `~ 10⁶⁷`. |
| B3 bands, rings, arcs, sphere and coupling dial | **Cartoon**. Branes wrap hidden dimensions that cannot be drawn. The horizon is 3-dimensional in 5D spacetime. |
| "All momentum flows one way" | **Faithful** to the extremal (BPS) configuration |
| B4 Poincaré-disk geodesics and footprint rule θ(r) | **Faithful hyperbolic geometry**. The loop-to-boundary mapping is a **cartoon** of a conjectured duality. |
| B4 η/s values | **Faithful** numbers (holographic 1/4π ≈ 0.080; QGP minimum inferred as 0.085, 90% range 0.06–0.11, in one Bayesian analysis; model-dependent) |
| B5 terrain and dip count | **Cartoon** (ANALOGY), labelled |
| Rival-approach sketches | **Cartoon** icons of each program's basic object |
| Epilogue pluck | Mode shapes and frequencies **faithful** to a classical free-ended string; damping **fictional** |

**Performance.** 34 glyphs in one instanced draw; Thread = 1 Filament (320 points, with 3 fray strands); anchors, struts and links in one LineSegments; cracks in one; tier rings in one; fog 7 instanced quads + 1 GlowPoints; ceiling disc + rim = 2. The B3 diorama is ≈ 8 draws; B4 ≈ 7; B5 terrain ≈ 18k triangles in 1 draw; rival sketches 1. In total there are fewer than 45 draw calls and fewer than 70k triangles. Dioramas mount only while their step is within ±1 viewport. There is no per-frame allocation: visibility runs in shaders from one `uCeilingY` uniform.

### Micro-copy (each ≤ 20 words)

- Panel title: **REFEREE'S BENCH**
- Intro: *Choose how much evidence you demand. Then judge nine claims yourself.*
- Slider label: *Evidence required*
- Detent 0: *Measured only. Superb physics, visible cracks, and no strings anywhere.*
- Detent 1: *Add what follows from the math. The Thread returns: derived, but untested.*
- Detent 2: *Add strong conjectures: AdS/CFT, S-duality, M-theory. Heavily checked, not proven.*
- Detent 3: *Admit possible scenarios too: the landscape, a multiverse, which shape is ours.*
- Referee prompt: *How sure are we? Pick a mark.*
- Verdicts: *Agreed.* · *Too sure.* · *Firmer than that.* (each followed by the claim's reason)
- Hidden token: *Hidden above your evidence ceiling. Admit more to see it.*
- Score: *You and the referee agree on {k} of {n}.*
- Closing line (after claim 9): *Ask of any claim: measured, derived, conjectured, or only possible?*
- Tap hint: *Tap any point in the map to read its claim.*
- Ghost caption: *Faded, not deleted: ideas still worth testing.*
- Map tag: *Height means distance from experiment, not importance or truth.*

### Audio (optional, muted by default)

- **Referee:** a soft `tick` when a token lands. On a correct answer, a single low settle tone; on a miss, a gentle two-note glide whose direction follows the token (down or up). Nothing sounds like an error buzzer.
- **Ceiling:** a faint filtered hum whose brightness tracks the amount of warm light on screen. It falls silent at L = 0, the same silence as the aha.
- Captions are not needed; the audio only doubles what is on screen.

---

## Go deeper

**Counting a black hole**

General relativity plus quantum fields give a black hole an entropy fixed by its horizon:

$$S_{\text{BH}} = \frac{k_B\,c^{3}}{4\,G\,\hbar}\,A \;=\; k_B\,\frac{A}{4\,\ell_P^{2}}$$

- `A`: the **horizon area** (the sphere in the diorama).
- `ℓ_P² = Għ/c³`: the **Planck area**, Chapter 1's Planck length squared, about 2.6 × 10⁻⁷⁰ m².
- `¼`: **Hawking's factor**, fixed by his 1974 calculation of black-hole radiation.
- `k_B`: **Boltzmann's constant**, the unit of entropy.

Boltzmann taught that entropy counts arrangements: S = k_B ln Ω. A solar-mass black hole has S ≈ 10⁷⁷ k_B. So what are its Ω arrangements? For one family of black holes, string theory answers:

$$\ln \Omega \;\simeq\; 2\pi\sqrt{Q_1\,Q_5\,N} \;=\; \frac{A_5}{4\,G_5}$$

- `Q₁`, `Q₅`: how many **D1-branes** and **D5-branes** are wrapped on the hidden dimensions (the rings and bands).
- `N`: units of **momentum** carried around the hidden circle by open strings (the warm arcs), all moving the same way.
- `Ω`: the **number of quantum states** with these charges, counted at weak coupling, where there is no black hole. (Strictly, a supersymmetry-protected signed count.)
- `≃`: equal **at leading order** for large charges; the exact count has small corrections.
- `A₅`, `G₅`: the **horizon area** and **Newton's constant** of the five-dimensional black hole with the same charges (units with ħ = c = k_B = 1).

The left side is counted with the string coupling turned down. The right side is computed with it turned up. Supersymmetry keeps the count from changing in between, and for large charges the two agree, factor ¼ included. With Q₁ = 4, Q₅ = 5 and N = 30, the leading formula gives ln Ω ≈ 153.9, so Ω ~ 10⁶⁷; the exact count at such small charges differs by a few percent in ln Ω. No one has achieved the same match for ordinary, non-supersymmetric black holes like those in our sky.

Highlight keys for `<Eq>`: `A`, `lp`, `quarter`, `kB`, `Omega`, `Q1`, `Q5`, `N`, `A5`, `G5` (the `≃` carries no key). Beat 3 drives `Q1`, `Q5` and `N` in Phase A and `A5` and `G5` in Phase C.

---

## Glossary

- `consistency condition`: A requirement a theory must meet just to make sense, such as probabilities adding to one. In string theory these conditions fix the dimension and the allowed symmetries.
- `dark matter`: Unseen matter inferred from its gravity on galaxies, clusters and the cosmic microwave background. It is about 84% of all matter, and its nature is unknown.
- `microstate`: One exact microscopic arrangement of a system. Entropy counts them: S = k_B ln Ω, where Ω is the number of microstates that look the same from outside.
- `Bekenstein–Hawking entropy`: A black hole's entropy: one quarter of its horizon area in Planck units. It is derived from general relativity plus quantum fields and has never been measured.
- `anti-de Sitter space`: A spacetime of constant negative curvature, like a box whose walls light can reach in finite time. Our expanding universe is not of this type.
- `string landscape`: The vast set of possible vacua (stable or long-lived solutions) of string theory, each with different low-energy physics. The often-quoted ~10⁵⁰⁰ is a rough estimate.
- `quantum gravity`: A theory joining quantum mechanics and gravity that works at all energies. Candidates include string theory, loop quantum gravity and asymptotic safety. None is experimentally confirmed.
- `falsifiable`: Able, in principle, to be shown wrong by some observation. It is a standard test for scientific theories, and critics ask whether string theory currently meets it.

(Referenced from other chapters, not redefined: `anomaly` and `critical dimension` (Ch. 5), `graviton` (Ch. 4), `supersymmetry` and `Calabi–Yau manifold` (Ch. 6), `Standard Model` and `Planck length` (Ch. 1), `mirror symmetry` and `gauge/gravity duality` (alias `AdS/CFT correspondence`; Ch. 8), `S-duality` and `M-theory` (Ch. 9), `black hole` and `swampland` (Ch. 10).)

---

## Numbers & facts

**Established physics (zone I)**

- **Quantum mechanics formulated 1925–26** (Heisenberg 1925; Schrödinger 1926). Standard history.
- **Nobel Prize in Physics 2022** for experiments with entangled photons and Bell-inequality violations (Aspect, Clauser, Zeilinger). [nobelprize.org/prizes/physics/2022](https://www.nobelprize.org/prizes/physics/2022/summary/)
- **Special relativity 1905; general relativity 1915** (Einstein). Tests of general relativity: C. M. Will, "The Confrontation between General Relativity and Experiment", Living Rev. Relativ. 17, 4 (2014), [arXiv:1403.7377](https://arxiv.org/abs/1403.7377). (The earlier citation arXiv:0806.1731 is a different review, by S. Turyshev.)
- **W and Z discovered 1983** (CERN UA1/UA2); **top quark 1995** (Fermilab CDF/D0). Particle Data Group, [pdg.lbl.gov](https://pdg.lbl.gov).
- **Higgs boson announced 4 July 2012, mass ≈ 125 GeV.** ATLAS, Phys. Lett. B 716, 1 (2012); CMS, Phys. Lett. B 716, 30 (2012); PDG 2024 (m_H ≈ 125.2 GeV).
- **Electron magnetic moment agrees with the Standard Model to ~1 part in 10¹²**, with g/2 measured to 0.13 ppt. Fan, Myers, Sukra & Gabrielse, PRL 130, 071801 (2023), [arXiv:2209.13084](https://arxiv.org/abs/2209.13084).
- **First gravitational-wave detection 14 September 2015** (GW150914). Abbott et al., PRL 116, 061102 (2016); [GWOSC](https://gwosc.org/events/GW150914/).
- **Black-hole images:** M87* (EHT, released 10 April 2019) and Sagittarius A* (EHT, 12 May 2022). [eventhorizontelescope.org](https://eventhorizontelescope.org). Nobel Prize 2020 (Penrose; Genzel & Ghez). [nobelprize.org/prizes/physics/2020](https://www.nobelprize.org/prizes/physics/2020/summary/)
- **Hawking area theorem (1971)**, Hawking, PRL 26, 1344 (1971). First tested with GW150914: Isi, Farr, Giesler, Scheel & Teukolsky, "Testing the black-hole area law with GW150914", PRL 127, 011103 (2021), [arXiv:2012.04486](https://arxiv.org/abs/2012.04486) (about 97% probability). Tested with high credibility using **GW250114** (signal 14 Jan 2025; LVK, "GW250114: Testing Hawking's Area Law and the Kerr Nature of Black Holes", PRL 135, 111403, published 10 Sept 2025), [doi:10.1103/kw5g-d732](https://link.aps.org/doi/10.1103/kw5g-d732); [Caltech/LIGO news](https://www.ligo.caltech.edu/news/ligo20250910). This is a classical result: it does not measure entropy.
- **LHC null results for supersymmetry:** gluino limits ≈ 2.1–2.4 TeV (up to 2.44 TeV for a massless neutralino, depending on the decay chain) and ≈ 1.75 TeV for eight degenerate first- and second-generation squarks (≈ 1.3 TeV for a single light squark), all in simplified R-parity-conserving models with a light LSP. PDG 2026, "Supersymmetry, Part II (Experiment)" (revised Aug 2025), [pdg.lbl.gov/2026/reviews/rpp2026-rev-susy-2-experiment.pdf](https://pdg.lbl.gov/2026/reviews/rpp2026-rev-susy-2-experiment.pdf). The same review states that TeV-scale SUSY "is, however, not a necessary consequence" of SUSY, which supports G8's last sentence.
- **Inverse-square law tested to 52 µm.** J. G. Lee, E. G. Adelberger et al., PRL 124, 101101 (2020).
- **Energy to probe the Planck length ~10¹⁵ × LHC:** E_P = 1.22 × 10¹⁹ GeV vs 13.6 TeV → ≈ 9 × 10¹⁴. Computed (CODATA; CERN). Also in Chapter 4's pack.
- **Dark matter ≈ 84% of matter; dark energy ≈ 68% of energy.** Planck 2018: Ω_Λ = 0.6847 ± 0.0073, Ω_m = 0.3153 ± 0.0073, Ω_c h² = 0.120, Ω_b h² = 0.0224, so Ω_c h²/(Ω_c h² + Ω_b h²) ≈ 0.84 (popular sources often round to 85%). Planck Collaboration, A&A 641, A6 (2020), [arXiv:1807.06209](https://arxiv.org/abs/1807.06209).
- **Accelerating expansion discovered 1998:** Riess et al., AJ 116, 1009 (1998); Perlmutter et al., ApJ 517, 565 (1999). Nobel Prize 2011.
- **DESI DR2 (March 2025):** preference for time-varying dark energy of 2.8σ–4.2σ depending on the supernova sample, below the 5σ discovery threshold. DESI Collaboration, Phys. Rev. D 112, 083515 (2025), [arXiv:2503.14738](https://arxiv.org/abs/2503.14738); [LBNL news](https://newscenter.lbl.gov/2025/03/19/new-desi-results-strengthen-hints-that-dark-energy-may-evolve/).
- **Neutrino oscillations established 1998** (Super-Kamiokande, Fukuda et al., PRL 81, 1562 (1998)); Nobel Prize 2015 (Kajita, McDonald).
- **Neutrino mass < 0.45 eV (90% CL)**, the effective electron-antineutrino mass from tritium beta decay. KATRIN, "Direct neutrino-mass measurement based on 259 days of KATRIN data", Science 388, adq9592 (2025), [doi:10.1126/science.adq9592](https://www.science.org/doi/10.1126/science.adq9592). 0.45 eV / 511 keV ≈ 9 × 10⁻⁷ ("under a millionth of the electron's mass"). Computed.
- **Planck energy 1.22 × 10¹⁹ GeV; Planck length 1.616 × 10⁻³⁵ m; Planck area ℓ_P² ≈ 2.61 × 10⁻⁷⁰ m².** CODATA 2018 via [NIST](https://physics.nist.gov/cuu/Constants/); area computed.
- **Quantum gravity as an effective theory:** it works at low energies and loses predictivity near E_P. D. Tong, *Lectures on String Theory*, [arXiv:0908.0333](https://arxiv.org/abs/0908.0333), Introduction; Donoghue, PRL 72, 2996 (1994). See also Chapter 4's pack.

**String-theory results (zone II)**

- **Critical dimension: D = 10 (superstring), 26 (bosonic).** D = 26: Tong, arXiv:0908.0333, §2 and §5 (Tong treats only the bosonic string). D = 10: Polchinski, *String Theory* Vol. 2 (CUP 1998); Green, Schwarz & Witten, *Superstring Theory* Vol. 1 (CUP 1987). "In their standard form" means critical strings in flat spacetime; non-critical strings with a linear dilaton exist in other dimensions.
- **Green–Schwarz anomaly cancellation (1984):** "Anomaly cancellations in supersymmetric D = 10 gauge theory and superstring theory", Phys. Lett. B 149, 117 (1984). The abstract itself names both groups: the remaining anomalies "cancel if the gauge group is SO(32) or E₈ × E₈", the cancellations are built into the SO(32) type I superstring, and "a superstring theory for E₈ × E₈ has not yet been constructed" (checked on INSPIRE-HEP). Gauge-group dimension 496. [Wikipedia: Green–Schwarz mechanism](https://en.wikipedia.org/wiki/Green%E2%80%93Schwarz_mechanism). The other 496-dimensional candidates, U(1)⁴⁹⁶ and E₈ × U(1)²⁴⁸, were shown inconsistent in Adams, DeWolfe & Taylor, PRL 105, 071601 (2010), [arXiv:1006.1352](https://arxiv.org/abs/1006.1352). This is why the pack says "special symmetry groups" and names only SO(32) and E₈ × E₈.
- **Heterotic string 1985:** Gross, Harvey, Martinec & Rohm, PRL 54, 502 (1985).
- **Graviton in the closed-string spectrum:** Yoneya, Prog. Theor. Phys. 51, 1907 (1974); Scherk & Schwarz, Nucl. Phys. B 81, 118 (1974). See Chapter 4's pack.
- **T-duality exact in string perturbation theory:** Giveon, Porrati & Rabinovici, "Target space duality in string theory", Phys. Rept. 244, 77 (1994), [hep-th/9401139](https://arxiv.org/abs/hep-th/9401139); Tong §8.
- **D-branes (1995):** Polchinski, "Dirichlet-Branes and Ramond-Ramond Charges", PRL 75, 4724 (1995), [hep-th/9510017](https://arxiv.org/abs/hep-th/9510017). Introduced earlier: Dai, Leigh & Polchinski, "New connections between string theories", Mod. Phys. Lett. A 4, 2073 (1989).
- **Bekenstein–Hawking entropy:** Bekenstein, "Black holes and entropy", Phys. Rev. D 7, 2333 (1973); Hawking, "Black hole explosions?", Nature 248, 30 (1974), and Commun. Math. Phys. 43, 199 (1975). The coefficient ¼ was fixed by Hawking's temperature.
- **Solar-mass black-hole entropy ≈ 1.0 × 10⁷⁷ k_B:** S/k_B = 4πGM²/(ħc) with M = 1.989 × 10³⁰ kg. Computed.
- **Strominger–Vafa (1996):** "Microscopic Origin of the Bekenstein-Hawking Entropy", Phys. Lett. B 379, 99 (1996), [hep-th/9601029](https://arxiv.org/abs/hep-th/9601029) (submitted 9 Jan 1996). Five-dimensional extremal (BPS) black holes, reproducing S = A/4.
- **Near-extremal extension and radiation rates:** Callan & Maldacena, Nucl. Phys. B 472, 591 (1996), [hep-th/9602043](https://arxiv.org/abs/hep-th/9602043); Das & Mathur, Nucl. Phys. B 478, 561 (1996), [hep-th/9606185](https://arxiv.org/abs/hep-th/9606185).
- **S = 2π√(Q₁Q₅N) (D1–D5–P, large charges); independent of string coupling and compact-space size; D1–D5 CFT central charge c = 6Q₁Q₅ with Cardy's formula.** G. Horowitz, "The origin of black hole entropy in string theory", [gr-qc/9604051](https://arxiv.org/abs/gr-qc/9604051); Skenderis & Taylor, "The fuzzball proposal for black holes", Phys. Rept. 467, 117 (2008), [arXiv:0804.0552](https://arxiv.org/abs/0804.0552).
- **Worked numbers:** Q₁ = 4, Q₅ = 5, N = 30 → 2π√600 = 153.906; leading-order log₁₀Ω = 66.84; Ω ≈ 6.9 × 10⁶⁶ at leading order. Computed. **Exact cross-check (referee):** the supersymmetric index from the DMVV formula for Sym^M(K3) at N = 30, J = 0 is 5.77 × 10⁶⁷ for M = Q₁Q₅ + 1 = 21 (ln = 156.03; leading formula with M = 21: 157.71) and 1.23 × 10⁶⁶ for M = 20 (ln = 152.17). So the leading formula is good to 1–2% in ln Ω here, not in Ω itself; hence the display `Ω ~ 10⁶⁷`.
- **Weak coupling: horizon smaller than the string scale, so count in flat space; strong coupling: horizon larger, so black hole. BPS states with momentum excite only the right-moving modes (one direction).** Horowitz, gr-qc/9604051, §2–3.
- **Mirror symmetry:** Candelas, de la Ossa, Green & Parkes, "A pair of Calabi–Yau manifolds as an exactly soluble superconformal theory", Nucl. Phys. B 359, 21 (1991). The counts on the quintic are 2,875 lines (Schubert, 19th c.), 609,250 conics (Katz 1986) and **317,206,375** twisted cubics (predicted 1991). Ellingsrud–Strømme's initially different computation was traced to a computer-code error. The mirror formula was established mathematically by Givental (1996) and Lian–Liu–Yau (1997–2000); Kontsevich proposed homological mirror symmetry in 1994. [Wikipedia: Mirror symmetry (string theory)](https://en.wikipedia.org/wiki/Mirror_symmetry_(string_theory)).
- **AdS/CFT (1997):** Maldacena, "The Large N Limit of Superconformal Field Theories and Supergravity", Adv. Theor. Math. Phys. 2, 231 (1998), [hep-th/9711200](https://arxiv.org/abs/hep-th/9711200) (submitted 27 Nov 1997). The flagship example is type IIB strings on AdS₅ × S⁵ ↔ 𝒩 = 4 SU(N) super-Yang–Mills in 4D. Citations: it was the top-cited HEP paper in 2011 ([INSPIRE-HEP blog](https://blog.inspirehep.net/2011/07/topcited-hep-paper-of-all-time/)); as of September 2026 INSPIRE lists ≈ 22,600 citations, third overall behind the Planck 2018 parameters paper and the GEANT4 software paper, which makes it INSPIRE's most-cited theoretical paper. "One of the most-cited" is therefore the right wording.
- **η/s = 1/4π ≈ 0.0796** for plasmas with simple gravity duals: Kovtun, Son & Starinets, PRL 94, 111601 (2005). **QGP inferred (η/s)_min = 0.085 (+0.026/−0.025), posterior median and 90% interval (≈ 0.06–0.11)**: Bernhard, Moreland & Bass, Nature Phys. 15, 1113 (2019), [doi:10.1038/s41567-019-0611-8](https://www.nature.com/articles/s41567-019-0611-8); the same numbers are verbatim in J. E. Bernhard's thesis abstract, [arXiv:1804.06469](https://arxiv.org/abs/1804.06469). Later analyses with model averaging (JETSCAPE, PRL 126, 242301 (2021), [arXiv:2010.03928](https://arxiv.org/abs/2010.03928)) give temperature-dependent constraints with broader bands, so the stage shows a range tagged `MODEL-DEPENDENT` rather than a single number that sits suspiciously close to 1/4π. QCD is not 𝒩 = 4 SYM, so this is a suggestive similarity, not a test of string theory.
- **Poincaré-disk geodesics** (circles orthogonal to the unit circle; for endpoints at ±θ, center at sec θ, radius tan θ, closest approach sec θ − tan θ). Standard hyperbolic geometry, e.g. J. W. Anderson, *Hyperbolic Geometry*, 2nd ed. (Springer, 2005), chapter on planar models (the Poincaré disc); chapter number not re-verified. Footprint rule derived here and re-derived in review: the circle centred at distance sec θ with radius tan θ meets the unit circle orthogonally at angles ±θ, since (sec θ − cos θ)² + sin² θ = tan² θ; sec θ − tan θ = tan(π/4 − θ/2), which inverts to θ(r) = π/2 − 2 arctan r (θ(0.85) = 0.162 rad, θ(0.10) = 1.371 rad).
- **S-duality evidence:** A. Sen, Phys. Lett. B 329, 217 (1994), [hep-th/9402032](https://arxiv.org/abs/hep-th/9402032). **M-theory:** E. Witten, "String theory dynamics in various dimensions", Nucl. Phys. B 443, 85 (1995), [hep-th/9503124](https://arxiv.org/abs/hep-th/9503124). **Matrix models (1996):** Banks, Fischler, Shenker & Susskind, PRD 55, 5112 (1997), [hep-th/9610043](https://arxiv.org/abs/hep-th/9610043).

**Open questions (zone III)**

- **Standard-Model-like spectra from strings** (these reproduce the MSSM spectrum, i.e. the Standard Model's particles plus superpartners): Braun, He, Ovrut & Pantev, "A heterotic standard model", Phys. Lett. B 618, 252 (2005), [hep-th/0501070](https://arxiv.org/abs/hep-th/0501070); "The exact MSSM spectrum from string theory", JHEP 05 (2006) 043, [hep-th/0512177](https://arxiv.org/abs/hep-th/0512177).
- **~10⁵⁰⁰ vacua:** M. R. Douglas, "The statistics of string/M theory vacua", JHEP 05 (2003) 046, [hep-th/0303194](https://arxiv.org/abs/hep-th/0303194); Ashok & Douglas, "Counting flux vacua", JHEP 01 (2004) 060, [hep-th/0307049](https://arxiv.org/abs/hep-th/0307049). **~10²⁷²⁰⁰⁰:** Taylor & Wang, "The F-theory geometry with most flux vacua", JHEP 12 (2015) 164, [arXiv:1511.03209](https://arxiv.org/abs/1511.03209) (an estimate, not an enumeration). Overview: [Wikipedia: String theory landscape](https://en.wikipedia.org/wiki/String_theory_landscape).
- **Flux discretuum:** Bousso & Polchinski, JHEP 06 (2000) 006, [hep-th/0004134](https://arxiv.org/abs/hep-th/0004134). **Anthropic landscape:** Susskind, [hep-th/0302219](https://arxiv.org/abs/hep-th/0302219) (2003).
- **Weinberg's anthropic bound on Λ (1987):** S. Weinberg, "Anthropic bound on the cosmological constant", PRL 59, 2607 (1987).
- **KKLT (2003):** Kachru, Kallosh, Linde & Trivedi, "de Sitter vacua in string theory", PRD 68, 046005 (2003), [hep-th/0301240](https://arxiv.org/abs/hep-th/0301240).
- **Swampland:** C. Vafa, [hep-th/0509212](https://arxiv.org/abs/hep-th/0509212) (2005); **de Sitter swampland conjecture:** Obied, Ooguri, Spodyneiko & Vafa, [arXiv:1806.08362](https://arxiv.org/abs/1806.08362) (2018). Review: Palti, [arXiv:1903.06239](https://arxiv.org/abs/1903.06239).
- **Cosmic superstrings:** Copeland, Myers & Polchinski, "Cosmic F- and D-strings", JHEP 06 (2004) 013, [hep-th/0312067](https://arxiv.org/abs/hep-th/0312067).
- **Alternatives:**
  - Loop quantum gravity: Ashtekar, PRL 57, 2244 (1986); Rovelli & Smolin, Nucl. Phys. B 442, 593 (1995).
  - Asymptotic safety: Weinberg (1979), in *General Relativity: An Einstein Centenary Survey* (CUP); Reuter, PRD 57, 971 (1998).
  - Causal sets: Bombelli, Lee, Meyer & Sorkin, PRL 59, 521 (1987).
  - Causal dynamical triangulations: Ambjørn & Loll, Nucl. Phys. B 536, 407 (1998).
- **Criticism and philosophy:**
  - L. Smolin, *The Trouble with Physics* (Houghton Mifflin, 2006).
  - P. Woit, *Not Even Wrong* (Jonathan Cape / Basic Books, 2006).
  - S. Hossenfelder, *Lost in Math* (Basic Books, 2018).
  - G. Ellis & J. Silk, "Scientific method: Defend the integrity of physics", Nature 516, 321 (2014), [doi:10.1038/516321a](https://www.nature.com/articles/516321a).
  - R. Dawid, *String Theory and the Scientific Method* (CUP, 2013).
- **"No experimental confirmation of string theory to date":** Tong, arXiv:0908.0333, Introduction; PDG reviews; the null results above. The statement is dated 2026.

---

## Pitfalls

| Misconception | How this pack avoids it |
|---|---|
| "String theory has been confirmed." | The aha (B6) removes everything unmeasured and leaves **zero** string claims on the ground. G10 states the null result directly, and every string claim wears ◑, ◌ or ○. |
| "The LHC disproved string theory." | G8 and S3 say the null results exclude many *low-energy supersymmetry* models, not string theory. G10: not seeing strings is expected if they are tiny, "so this is not a refutation either". E1: "Unobserved is not the same as wrong." |
| "String theory makes no predictions at all." | B2 and the atlas show sharp derived consequences (10 dimensions, the graviton, two anomaly-free groups, black-hole counts). D8 shows predictions later confirmed *in mathematics*. What is missing, stated precisely, is a string-specific prediction testable at reachable energies. |
| "Mathematical success is evidence about nature." | D8 ends "This confirmed mathematics, not nature." The ◑ chip means "follows from the math, untested". S9 flags the contested "non-empirical confirmation" view as contested. |
| "String theory explained black holes / solved the information paradox." | B3 and D7 limit the match to *extremal, supersymmetric, five-dimensional* black holes. A dashed `≠` link separates them from the real black holes on the ground. Go deeper ends by saying ordinary black holes are not covered. The information paradox is never claimed. |
| "Black-hole entropy or Hawking radiation has been measured." | D6 says "never measured" and G7 "Their entropy has never been measured". The 2025 area-law test is labelled classical. |
| "AdS/CFT shows our universe is a hologram." | B4: "Our universe is not this shape." Stage tag `OUR UNIVERSE · Λ > 0 · NOT ANTI-DE SITTER`. The duality wears ◌. |
| "Quark–gluon plasma experiments confirmed string theory." | The η/s annotation is captioned `SIMILAR, NOT A TEST OF STRINGS`. Numbers & facts note that QCD is not 𝒩 = 4 SYM. |
| "There are exactly 10⁵⁰⁰ universes, and string theory predicts a multiverse." | S4: "a rough 2003–04 estimate", with a far larger estimate also cited, and "These count possible solutions, not universes that exist." S5 is an *interpretation*, ○, with critics noted. Referee claim 9's reason repeats the distinction. The terrain carries `~ ANALOGY` and says the drawn dips are not the number. |
| "String theory's black-hole count is exact, number for number." | Beat 3 and D7 say the count matches *for large charges*; the readouts carry `LEADING ORDER` and show Ω only as `~ 10⁶⁷` (Model §7 gives the exact cross-check). |
| "Every closed string has a graviton on it." | Beat 2, D3 and referee claim 4 say every closed-string *theory* contains a graviton: the graviton is one vibration state of a closed string. |
| "Extra dimensions have been ruled out" / "…have been found." | G9 gives the actual constraint (no deviation down to 52 µm). Far smaller dimensions remain untested. Referee claim 8 is ○. |
| "The Standard Model is wrong" / "…is complete." | B1: it has matched experiment for decades *and* has cracks (dark matter, dark energy, neutrino masses, quantum gravity). |
| "String theory is the only approach to quantum gravity." | B5 and S8 name loop quantum gravity, asymptotic safety, causal sets and CDT, each marked untested. |
| "Quantum mechanics and gravity are totally incompatible." | K4: together they work at everyday energies and lose predictive power near 10¹⁹ GeV. |
| "Height on the map means how important or how likely." | The persistent `~ ANALOGY` tag and the Opening chip tooltip state that height = distance from experiment only. |
| "The debate is settled (either way)." | S9 gives critics and defenders one sentence each. The further reading pairs insiders (Greene, Susskind, Conlon) with critics (Smolin, Woit, Hossenfelder, Ellis & Silk) and a philosopher (Dawid). |
| "String theory was built on nothing observed." | The anchors show it is built on tested principles (quantum mechanics and relativity), while the Thread itself never touches measured ground. |

---

## Handoff

**IN:** **H0**: a single Ink-white glowing point at screen center, HANDOFF camera, no view shift. This matches Chapter 10 (`scale-problem`), whose pack now exists and specifies **OUT = H0**, with the closing caption *"From where we stand, a string would look just like a point."* and the bridge line *"Then what, exactly, do we know, and what are we still guessing?"* shown under the point as this chapter dissolves in. Chapter 10's scale gauge fades before the dissolve, consistent with `scale()` = `null` here. In the first 30% of the `title` step the camera cranes up to reveal the point standing on the measured ground, where it becomes the STANDARD MODEL node. **Fallback, kept in case Chapter 10 is revised to end on H1**: the first 5% of this chapter shrinks that open string into the point using the prologue's resolution-blur rule: Filament warm cross-fades to Ink as it becomes unresolved, before the crane.

**OUT:** **H1**: the Thread as one horizontal open string, centered, gently vibrating in its fundamental mode (`<HandoffOpenString/>`, default props, HANDOFF camera, no view shift), after the epilogue's final pluck has decayed. This is the last chapter, so there is no next scene. The site's footer (credits, further reading) scrolls up over this pose. It is deliberately the prologue's opening object, so the journey closes where it began. `scale()` stays `null`.

---

## Epilogue

The epilogue belongs to this chapter's scroll (steps `unseen`, `verdict`, `pluck`, `rest`). The Lab undocks, and the map sinks away.

### E1: Not seen is not wrong (`unseen`)

- **Text:** Unobserved is not the same as wrong. If strings are near the Planck length, no foreseeable experiment could see them directly. Meanwhile their mathematics has already changed how physicists think about black holes, quantum fields and geometry. Whether nature uses it remains open.
- **Status:** `OBSERVED ●` (the history of influence; the absence of evidence) + `SPECULATIVE ○` ("if strings are near the Planck length")
- **Stage:** The ceiling eases back to L = 3 in one smooth motion, so the whole structure glows once more, warm Thread included. Then the camera cranes up and back (distance 15 → 60, `logLerp`) while the map dims to 10% and sinks below frame. The structure shrinks until it is smaller than the render's resolution blur (the prologue's rule: unresolved things turn ink-white). **It becomes a single Ink point at screen center, the H0 pose again.** A mono caption under it: `FROM HERE, EVERY CLAIM ABOVE IS ONE POINT OF LIGHT`. It is tagged ANALOGY. Reduced motion: cross-fade from the map to the point. Fallback SVG: the point.

### E2: What would change the verdict (`verdict`)

- **Text:** What would change the verdict? Clues might come from superpartners, hidden dimensions, or cosmic strings stretched across the sky. None has appeared, and none alone would settle it. Decisive evidence needs a prediction only strings make, then a measurement that confirms it.
- **Status:** `SPECULATIVE ○` (possible signals) + `OBSERVED ●` ("none has appeared")
- **Stage:** The point holds. Four Field hairline arrows slide in from the four screen edges toward it, each tipped with a small instrument glyph and a mono label: `COLLIDERS · 13.6 TeV`, `GRAVITATIONAL-WAVE DETECTORS`, `THE EARLY UNIVERSE'S LIGHT`, `TABLETOP PRECISION`. **Each stops short of the point.** The gap on the collider arrow is labelled `~10¹⁵× IN ENERGY, IF THE STRING SCALE IS NEAR THE PLANCK SCALE` (callback to Chapter 10). The arrows stay cool blue; nothing warms. Reduced motion: the arrows appear in place. Fallback SVG: the point with four arrows stopping short.

### E3: The final pluck (`pluck`)

- **Text:** The title called it a hypothesis. It still is one: elegant, consistent wherever anyone has checked, and unconfirmed. The Thread was always a picture of an idea, not of a thing. Pluck it once more.
- **Status:** `ANALOGY ~`
- **Stage:**
  1. **Local p 0.00–0.35: the reveal, replayed.** The arrows fade. The Ink point **unfolds into the Thread**, the same unfolding as Chapter 1's reveal. It stretches into the H1 geometry, and its color cross-fades from Ink to Filament as it becomes resolved. The warm light returns for the last time.
  2. **0.35 onward.** The Thread becomes pluckable (`claimPointer()` on pointer-down). Hover within 48 px nudges it (at most 6 px), as in the prologue. Drag and release plucks it using the Lab **Model §10**: several modes ring and decay over ~3 s. Keyboard: `Enter` or `Space` on the focused Thread plucks at σ₀ = 0.3 with a medium height.
  3. **With audio enabled** (muted by default), each mode sounds a harmonic of 110 Hz, exactly as in the prologue, so the last sound of the site is the first.
  4. **Grace note (optional, medium or high tier only):** on the pluck, one faint Field ring expands from the Thread across the screen. As it passes, four ghost glyphs ● ◑ ◌ ○ blink once in their status colors below the Thread and fade: every claim wears its mark.
  5. **After the ringing decays**, a caption fades in beneath the Thread (Ink-2, Hanken Grotesk italic): *"Still waiting for nature's answer."* The Thread settles into the canonical H1 fundamental-mode motion.

  Reduced motion: no idle tremble; a pluck plays one slow decay at 0.3 Hz. No WebGL: a static SVG Thread (hairline curve plus blurred amber duplicate) with the caption.

### `rest` (final viewport)

The Thread holds at **H1**, centered, gently vibrating. The footer rises: credits, the status legend one last time, and the reading list below. Nothing else moves.

### Further reading

*Start here (accessible)*
- Brian Greene, *The Elegant Universe* (W. W. Norton, 1999). The classic enthusiastic tour by an insider.
- Juan Maldacena, "The Illusion of Gravity", *Scientific American* 293(5), 56–63 (November 2005). AdS/CFT explained by its author.
- Joseph Conlon, *Why String Theory?* (CRC Press, 2016). An insider's candid account of why people work on an untested theory.
- Lisa Randall, *Warped Passages* (Ecco, 2005). Extra dimensions and branes, with care about what is speculative.

*The critics*
- Lee Smolin, *The Trouble with Physics* (Houghton Mifflin, 2006).
- Peter Woit, *Not Even Wrong* (Jonathan Cape / Basic Books, 2006).
- Sabine Hossenfelder, *Lost in Math: How Beauty Leads Physics Astray* (Basic Books, 2018).
- George Ellis & Joe Silk, "Scientific method: Defend the integrity of physics", *Nature* 516, 321–323 (2014).

*The big debates*
- Leonard Susskind, *The Cosmic Landscape* (Little, Brown, 2005). The landscape and multiverse, argued by a proponent.
- Richard Dawid, *String Theory and the Scientific Method* (Cambridge University Press, 2013). A philosopher on assessing theories without experiments.
- Carlo Rovelli, *Reality Is Not What It Seems* (English edition 2016). Quantum gravity from the loop-quantum-gravity side.

*Going technical (free or textbook)*
- Barton Zwiebach, *A First Course in String Theory*, 2nd ed. (Cambridge University Press, 2009). Undergraduate level.
- David Tong, *Lectures on String Theory* (2009), [arXiv:0908.0333](https://arxiv.org/abs/0908.0333). Free, graduate level, very clear.
- Joseph Polchinski, *String Theory*, Vols. 1–2 (Cambridge University Press, 1998).
- Katrin Becker, Melanie Becker & John H. Schwarz, *String Theory and M-Theory: A Modern Introduction* (Cambridge University Press, 2007).

---

## Referee notes

Referee pass, 28 September 2026. Journal references were checked against INSPIRE-HEP and arXiv records, LHC limits against the PDG 2026 review, and every derived number was recomputed. Corrections, most serious first:

1. **"Every closed string carries a graviton"** (Beat 2 text, referee claim 4) suggested that each string has a graviton on it. The graviton *is* one vibration state of a closed string. Now: "every closed-string theory contains a graviton". A Pitfalls row was added.
2. **Black-hole count presented as exact** (Beat 3 text "The count matched exactly", readout `Ω ≈ 7 × 10⁶⁶`, caption `EXACT MATCH`, D7 "exactly", referee claim 5, Go deeper `=`). 2π√(Q₁Q₅N) is the leading large-charge formula. I computed the exact supersymmetric index for the Strominger–Vafa system (Sym^M(K3), DMVV formula, N = 30, J = 0): 5.77 × 10⁶⁷ (ln 156.03) at M = Q₁Q₅ + 1 = 21, and 1.23 × 10⁶⁶ (ln 152.17) at M = 20. The leading formula gives 6.9 × 10⁶⁶ (ln 153.91). So ln Ω agrees to 1–2%, but Ω is off by up to a factor of about 8. The text now says "for large charges"; the readouts carry `LEADING ORDER`, Ω is shown as `~ 10⁶⁷`, the Go-deeper equation uses `≃`, and Model §7 records the check.
3. **G8 overgeneralization and numbers.** "None [of the string constructions] requires superpartners within the LHC's reach" was not defensible, because some string-motivated models did predict LHC-accessible superpartners. It now reads "string theory does not fix the energy at which superpartners would appear", which the PDG 2026 review supports ("not a necessary consequence"). "Gluino partners" was wrong: gluinos *are* the partners. The limits were updated to PDG 2026: gluinos ≈ 2.1–2.4 TeV, eight degenerate squarks ≈ 1.75 TeV (not 1.8).
4. **Referee claim 9 reason** did not address the listed misconception (landscape count = number of universes). It now says 10⁵⁰⁰ roughly counts possible solutions, not existing universes. S4 gains the same sentence, and "a 2015 count … found" became "a 2015 estimate … gave".
5. **D1 "26 without supersymmetry" was wrong.** Non-supersymmetric 10D strings exist (e.g. the SO(16) × SO(16) heterotic string). 26 is the purely *bosonic* string's number. The label, summary and Beat 2 sub-label were fixed, "allow only one" was clarified, and "in their standard form" was added (non-critical strings exist). Tong treats only the bosonic string, so D = 10 is now cited to Polchinski Vol. 2 and Green–Schwarz–Witten.
6. **Wrong citation.** arXiv:0806.1731 is Turyshev's review, not Will's. Replaced with Will, Living Rev. Relativ. 17, 4 (2014), arXiv:1403.7377.
7. **Green–Schwarz (flagged).** The 1984 abstract itself names both SO(32) and E₈ × E₈, notes that SO(32) is realized in type I, and says no E₈ × E₈ superstring had been built yet. D2 was rewritten: both groups are named in the paper, and the heterotic string (1985) realized E₈ × E₈.
8. **Hawking area law (flagged).** Added Isi et al., PRL 127, 011103 (2021), which found about 97% probability with GW150914, and the full GW250114 reference, PRL 135, 111403 (2025). G7 now calls the rule "classical".
9. **Maldacena citations (flagged).** As of September 2026 INSPIRE lists ≈ 22,600 citations, third overall behind Planck 2018 and GEANT4. "The top-cited HEP paper" in Numbers & facts was corrected. The atlas wording "one of the most-cited" is right and was kept.
10. **η/s false precision (flagged).** Putting 0.085 beside 0.080 invites a "near-perfect match" reading. The stage now shows the 90% range 0.06–0.11 tagged `MODEL-DEPENDENT` (Bernhard et al.; verbatim in arXiv:1804.06469), and JETSCAPE 2021 is cited.
11. **C1** "It gives a working quantum theory of gravity" asserted a conjecture's consequence as fact. Now: "If it holds, it defines…".
12. **C3** "one eleven-dimensional theory" became "one larger theory, which in yet another limit is eleven-dimensional". M-theory is 11-dimensional only in one limit.
13. **C2** S-duality can map a theory to itself (type IIB), so "or in the same theory" was added.
14. **Beat 6 readout** `EXTRA DIMENSIONS 0` could be read as "there are no extra dimensions". It is now `DETECTED SO FAR · STRINGS 0 · SUPERPARTNERS 0 · EXTRA DIMENSIONS 0`.
15. **E1** "no experiment could see them directly" was too absolute. Now "no foreseeable experiment".
16. **Beat 5 / S4.** "Its equations allow" became "seem / appear to allow", because S6 says de Sitter vacua are debated. "Critics ask whether it is testable" was shortened to stay within 45 words.
17. **S3.** SUSY was expected "to explain why the Higgs boson is so light" (naturalness), not "to explain the Higgs mass". **S2**: the 2005 heterotic models give the MSSM spectrum, so "(plus superpartners)" was added.
18. **Dark matter 85% → 84%.** The pack's own Planck computation gives 0.843. The label, detail and glossary are now consistent.
19. **KATRIN** bounds the effective electron-(anti)neutrino mass, not "the mass". The Science 388 reference was added.
20. **G5.** "Nothing beyond it has turned up" became "No particle beyond the Standard Model". The LHC has found many new composite hadrons.
21. **D5.** D-branes were introduced in 1989 (Dai, Leigh & Polchinski, MPLA 4, 2073); 1995 is when their RR charge was shown. The detail and Numbers now say so.
22. **B6 timing.** "◑ passes (≈ 0.70)" was recomputed from the Model §3 formulas: the ◑ third spans p ≈ 0.65–0.80, and the Thread's last vertex goes dark at p ≈ 0.75. The Stage and Model were updated.
23. **Model §2.** `fill` was used for ◑ but never defined. It is now defined as the ● coverage. **Model §9**: the terrain variable `p` clashed with scroll progress and is renamed `x`.
24. **Micro-copy.** Detent 1 "rigorous" overstated physics-level derivations; it now reads "derived, but untested". The closing line offered only two marks ("measured, or derived?"), although the lab teaches four; it now names all four.
25. **Go deeper.** "Thermodynamics gives…" became "General relativity plus quantum fields give…". A note was added that Ω is strictly a protected signed count.
26. **Handoff IN (flagged).** Chapter 10's pack now exists and ends on H0. Its caption and bridge line are referenced, and the H1 fallback is kept only as a contingency.
27. **Minor.** The asymptotic-safety sketch now flows toward the fixed point *at high energy*. The Woit publisher was added (Jonathan Cape / Basic Books). The Anderson chapter number is marked unverified, and the Poincaré-disk footprint rule was re-derived (verified). Three Pitfalls rows were added or extended.

**Verified, no change needed:** all derived numbers (2π√600 = 153.906; log₁₀ = 66.84; S_⊙ = 1.05 × 10⁷⁷ k_B; ℓ_P² = 2.61 × 10⁻⁷⁰ m²; E_P / 13.6 TeV ≈ 9.0 × 10¹⁴; 0.45 eV / m_e ≈ 8.8 × 10⁻⁷; θ(r) values). Also verified: dates and journal references for GW150914, EHT, Higgs (PLB 716), electron g (PRL 130, 071801), 52 µm (PRL 124, 101101), Planck 2018, DESI DR2 (now PRD 112, 083515), Super-K, Bekenstein, Hawking (1971, 1974, 1975), Yoneya, Scherk–Schwarz, GHMR, Strominger–Vafa, Callan–Maldacena, Das–Mathur, Horowitz (gr-qc/9604051), Skenderis–Taylor, Giveon–Porrati–Rabinovici, Polchinski 1995, Candelas et al. (317,206,375), Maldacena, KSS, Sen, Witten, BFSS, Adams–DeWolfe–Taylor, Braun–He–Ovrut–Pantev, Douglas, Ashok–Douglas, Taylor–Wang, Bousso–Polchinski, Susskind, Weinberg 1987, KKLT, Vafa, Obied et al., Palti, Copeland–Myers–Polchinski, Ashtekar, Rovelli–Smolin, Reuter, Bombelli et al., Ambjørn–Loll, Ellis–Silk. Book details verified: Greene (Norton 1999), Randall (Ecco 2005), Susskind (Little, Brown 2005), Rovelli (English 2016), Woit (2006). Also checked: status chips on every node (D6's ◑* override is appropriate), ceiling detents against tier bands, 34 nodes / 17 ST, all beat texts ≤ 45 words, and all micro-copy and referee reasons ≤ 20 words.

**Not re-verified** (web-search budget exhausted): whether DESI published results after DR2 by September 2026 (the text is hedged, "not yet conclusive"); the Weinberg 1979 book chapter; the mirror-symmetry mathematics history (Givental, Lian–Liu–Yau, Katz, Ellingsrud–Strømme), which is standard; and the Zwiebach, Becker–Becker–Schwarz and Polchinski edition years, which are standard.

## Editor notes (cross-chapter pass, 2026-09-28)

1. **Handoff IN quote fixed.** Chapter 10's refereed closing caption says "just like a point", not "exactly like a point". The quote now matches.
2. **Beat 4 is a payoff.** Chapter 8's Beat 6 already previewed gauge/gravity duality. The beat now opens "Chapter 8 previewed Maldacena's 1997 conjecture:" rather than introducing it cold, and "conjecture" stays in the text. Still 45 words.
3. **Glossary deduplication.** `mirror symmetry` and `AdS/CFT correspondence` are defined once, in Chapter 8, where they first appear in a beat. This chapter references them. The Go deeper's Planck-area line now points to Chapter 1's Planck length instead of re-explaining ħ, G and c.
4. **Ledger check against the site.** Every recap in Beat 2 and the atlas matches the chip its source chapter used. Examples: 10 dimensions ◑ (Ch. 5), graviton ◑ (Ch. 4), T-duality ◑ (Ch. 8), D-branes ◑ (Ch. 7), S-duality and M-theory ◌ (Ch. 9), the landscape ○ (Ch. 6's flux-vacua caveat). D6's ◑\* override raises the same VISION-legend question as Chapter 4's Beat 3.
