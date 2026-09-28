# 05 · Hidden Dimensions — Where would extra dimensions hide?

**Thesis:** An extra direction of space could hide in plain sight, present at every point but curled so small that any motion around it costs more energy than we can supply, and string theory needs six such directions, none of which has been observed.

**Overall status:** ◑ `DERIVED`. That superstrings need 10 spacetime dimensions follows from the theory's own equations. Whether nature has extra dimensions is untested. Every search so far is a null result (● `OBSERVED`), and all the pictures in this chapter are ~ `ANALOGY`.

---

## Storyboard

Scene conventions for the engineer: 1 world unit ≈ 1/6 of the viewport height at the default camera (perspective, fov 35°, camera at `z = 8` looking at the origin). Only strings use `--filament`. Spatial geometry (axes, lattice, cable, hidden circles) uses `--field`. Point particles and quantum waves use `--ink`. Every ~ANALOGY chip on the stage is a small mono label pinned bottom-left of the frame.

### Opening: *handoff IN*
- **Text:** The closed string from the last chapter comes with a condition. Quantized in its standard form, string theory is consistent only if space has more directions than the three we move through. If those extra directions exist, where could they hide?
- **Status:** ◑ DERIVED
- **Stage:** The first frame is **H2**, matching Chapter 04's last frame: one closed Thread loop at the center, facing the camera and gently wobbling (a small spin-2 ellipse wobble carried over from 04). A faint Field-blue axis triad fades in behind it over progress 0 → 0.5: x, y and z, each 3 units long with mono labels `x`, `y`, `z`. At progress 0.5 a fourth dashed axis stub `?` starts from the origin. It keeps trying orientations, snapping every 0.6 s to a direction that lies on top of one of the three axes. Each time it lands on an existing axis it dims, and it never finds a new direction. At progress 0.8 → 1.0 the Thread loop shrinks toward the origin (radius lerp 1 → 0, glow brightening) and collapses into **H0**, a single point of light. The camera stays still. Scale gauge shows `—` (the gauge is dimensionless here).

### Beat 1: Counting directions
- **Text:** A [[dimension]] is an independent direction to move. Sweep a point: a line, home to Lineland. Sweep the line: a plane, Abbott's Flatland (1884). Sweep again: our space. Sweep once more, into a fourth direction, and we can only draw a shadow.
- **Status:** ● OBSERVED (space has three large directions) + ~ ANALOGY (Lineland, Flatland, 4D shadow)
- **Stage:** A "dimensional sweep" plays out, driven by progress:
  - **0.00–0.20:** The point of light (H0) is dragged along +x and leaves a Field-blue hairline segment 2 units long with tick marks every 0.25. Two Lineland creatures (short 0.15-unit bright Ink segments) slide back and forth along it and can never pass each other. A mono counter in the corner reads `DIRECTIONS 1`.
  - **0.20–0.45:** The segment sweeps along +y and fills a translucent square (Field grid at 10% opacity). A Flatlander (a small Ink triangle outline) wanders inside it. Counter reads `2`.
  - **0.45–0.70:** The square sweeps along +z into a wireframe cube. The camera orbits slowly (yaw 0° → 35°, pitch 0° → 15°) so the depth reads clearly. Counter reads `3`.
  - **0.70–1.00:** The cube "sweeps" into a tesseract drawn as its perspective projection: 16 vertices and 32 edges, an inner cube joined to an outer cube. Rotate it in the x–w plane (angle `φ = π·subprogress`) and project with `x' = x·d/(d − w)` (d = 3) and the same for y and z. The shadow turns itself inside out. Counter reads `4?`. Label: `~ ANALOGY · a 3D shadow of a 4D cube, not the cube`.
  - Scale gauge: `—`.

### Beat 2: Hiding a direction by making it small
- **Text:** Hide a direction by making it small. From across a street, a cable looks like a line: one number says where you are. An ant on it finds a second direction: around. Finite, looping, invisible from afar. That is [[compactification]].
- **Status:** ~ ANALOGY
- **Stage:** The tesseract shrinks away. A horizontal cable runs across the full screen width, drawn as a Field-blue wireframe cylinder (16 longitudinal lines plus a ring every 0.5 units), with a visual radius of 1 unit. The camera starts **far away** (distance 2,000 units), so the cable renders as a sub-pixel line. Keep it at least 1 px wide and brighten it so it stays visible. An "ant" (a 3 px Ink dot with a 2 s fading trail; not an insect model) walks a helix: `s(t) = 0.3t` along the cable and `θ(t) = 1.2t` around it. From far away only the along-motion is visible. Over progress the camera dollies in on a log path (distance 2,000 → 3). The line thickens into a tube, the rings resolve, and the ant's trail visibly wraps around. The mono readout `LOOKS LIKE: 1 DIMENSION` cross-fades to `2 DIMENSIONS` once the projected diameter passes 6 px. At the closest point a hairline arc labels the circumference `around: finite · 2πr`. A pinned label reads: `~ ANALOGY · a real cable has an inside. A hidden dimension doesn't: only the surface counts as space.` Scale gauge: `10 m` → `1 mm`.

### Beat 3: A tiny circle at every point
- **Text:** Kaluza (1921) added a fourth direction of space, a fifth dimension counting time. Klein (1926) curled it into a tiny circle at every point. [[Kaluza–Klein theory]]: Einstein's gravity in five dimensions yields, in four, gravity, Maxwell's electromagnetism, and one extra field.
- **Status:** ◑ DERIVED (the 5D → 4D mathematics) + ~ ANALOGY (the lattice drawing)
- **Stage:** The camera pulls back along the cable. The cylinder dissolves, but its cross-section ring stays behind. The cable's axis becomes the x-axis of a 7×7×7 Field-blue lattice (node spacing 1 unit, hairline edges at 12% opacity). A tiny ring appears at **every node**: 343 instanced line-loops, radius 0.12 units, 48 segments each. All the rings are billboarded to face the camera, because the hidden circle points along none of our three axes. Pinned label: `~ ANALOGY · the circle isn't attached to points like a hoop; each point simply has one more direction.` The camera pulls back from 4 to 30 units. Each ring's opacity is multiplied by `smoothstep(1px, 4px, projectedDiameter)`, so the rings fade out as they drop below pixel size and space looks plainly 3D. Scale gauge: `≈ 10⁻³² m (Klein's estimate) · not to scale`.
  - When the text reaches "electromagnetism" (subprogress 0.6), each ring shows a small marker dot. The marker's angle varies smoothly across the lattice, `θ_marker = 0.8·sin(0.7x + 0.4y + t·0.3)`, a slow "twist" wave. Label: `~ The circles' twist from point to point acts as the electromagnetic potential.`
  - At "one extra field" (subprogress 0.85), the ring radii breathe gently: `r = 0.12·(1 + 0.25 sin(0.5z − 0.6t))`. Label: `…and the circle's size itself can vary: a new field.`
  - A footnote card fades in at the end with a ◑ DERIVED chip: `Klein's version failed for the electron: its charged copies came out >10²⁰ times too heavy. The mechanism outlived the model.`

### Beat 4: The wave must fit (*the aha*)
- **Text:** A wave around the hidden circle must fit: 0, 1, 2… whole wavelengths. We can't see that motion, only its energy, weighed as mass. Shrink the circle and the [[Kaluza–Klein tower]] climbs. A dimension hides by being too costly to excite.
- **Status:** ◑ DERIVED
- **Stage:** This is the chapter's signature moment and runs in four phases.
  1. **Dive (0.00–0.15).** The camera flies into the center node. Its ring grows to fill about 55% of the screen height (radius 1.4 units, Field-blue, 1.5 px). Every other node fades.
  2. **Fit (0.15–0.55).** An Ink-white wave runs around the ring as a radial displacement, `r(θ) = 1.4·[1 + 0.08·cos(kθ − Ωt)]`. The wave number `k` is scrubbed continuously from 0 to 3. At non-integer `k`, eight faint "echo laps" are drawn at 12% opacity (see Lab model), and the bright wave's amplitude drops to `A(k)`. The mismatch shows as a small bright gap at θ = 0 where the wave fails to meet its own tail. At `k` = 1, 2 and 3 the echoes snap into one and the wave locks bright. A vertical ladder appears on the right (Field hairlines, x = +3.2): rung `n` lights at height `y = n·s`, labelled `n = 1 · E = ħc/R`, and so on. Rung 0 is labelled `n = 0 · the ordinary particle`.
  3. **Zoom out (0.55–0.75).** The camera pulls back fast. The ring shrinks to a point of light (Ink, H0-like) whose glow brightness scales with the lit rung. The ladder stays, its axis relabeled `MASS WE WOULD MEASURE`. Label: `We can't see the circling. We can weigh it.`
  4. **The aha (0.75–1.00).** A small inset reopens the circle at the top left, and its radius shrinks (visual R: 1.4 → 0.35, labelled `R ↓`). The ladder spacing grows as `s = s₀·(1.4 / R_vis)`. A horizontal dashed Ink-3 line crosses the ladder, labelled `ROUGH REACH OF THE LHC · 13.6 TeV`. As R shrinks, the rungs slide upward past the dashed line and fade out of frame. Only rung 0 stays below. Final caption: **"Smaller circle, heavier echoes. Out of reach means out of sight."** Pinned label: `~ ANALOGY · not to scale. The rule "spacing ∝ 1/R" is exact.` Scale gauge: shows the live inset R.

### Beat 5: String theory's count
- **Text:** String theory turns the count into a requirement. Quantum superstrings keep their symmetries only at a [[critical dimension]] of ten: nine of space, one of time. If string theory describes our world, six directions of space must be hidden.
- **Status:** ◑ DERIVED
- **Stage:** Back to the lattice (camera distance 12). A small Thread (H2 loop at scale 0.3, filament) drifts through it, reminding us what needs the room. Top center shows a **balance** in hairline style:
  - The left pan is fixed and labelled `GHOSTS −15`. These are the bookkeeping fields created by fixing the worldsheet's symmetries.
  - Ten "dimension chips" drop onto the right pan one at a time as progress advances. Each adds `+1.5`, and its label splits as `1 (position) + ½ (fermion partner)`.
  - The beam tilts by `angle = 0.04·(15 − 1.5·D)` rad, clamped, and levels exactly when the tenth chip lands. It then glows briefly (Field, not filament).
  - The chips then sort into a row: `1 time` (Ink), `3 large space` (Field solid), `6 hidden` (Field dashed, each curled into a tiny loop).
  - The lattice rings morph into a small tangled 6-lobed glyph. Label: `~ ANALOGY · a stand-in. The real hidden shape is the next chapter.`
  - Two side annotations appear with their own chips: `26 · bosonic string · ◑ DERIVED (has a tachyon, no fermions: a stepping stone)` and `11 · M-theory · ◌ CONJECTURED (Witten 1995)`.
  - Pinned: `~ ANALOGY · a bookkeeping cartoon of the worldsheet "central charge" count (see Go deeper).`
  - Scale gauge: `unknown`.

### Beat 6: How small, and how we'd know
- **Text:** How small? Unknown. If known particles could circle a hidden dimension wider than ~10⁻¹⁹ m, colliders would have made their heavy copies. None seen. If only gravity could, as speculative [[braneworld]] models allow, torsion balances would catch anything above ~30 µm. Nothing yet.
- **Status:** ● OBSERVED (null results; the braneworld clause is flagged ○ SPECULATIVE on stage)
- **Stage:** The lattice recedes. A horizontal **log ruler of R** spans the screen from `1.6×10⁻³⁵ m` (left) to `1 mm` (right), with Field hairline ticks every decade. A second, mirrored ruler below it shows `ħc/R` in eV, running right to left: the two scales are one slide rule. Shaded zones on the upper ruler:
  - hatched Ink-3 zone `R ≳ 10⁻¹⁹ m · EXCLUDED IF ALL PARTICLES FEEL IT` (from colliders), shown with a ● chip;
  - separate hatched zone `R > 30 µm · EXCLUDED EVEN IF ONLY GRAVITY FEELS IT` (from torsion balances), with a ● chip and the sub-label `○ gravity-only = speculative braneworld`;
  - markers for `Planck length 1.6×10⁻³⁵ m`, `Klein 1926 ≈ 10⁻³² m`, `proton radius 0.84×10⁻¹⁵ m`, and `52 µm · closest gap tested`;
  - a soft unshaded band at the far left labelled `many string models: somewhere down here · ○ SPECULATIVE`.

  An inset shows a torsion-balance schematic: a disk with a ring of holes hanging on a fiber above a rotating attractor disk, with the gap labelled `52 µm`. Next to it a log–log plot of gravity's strength against distance shows the `1/r²` line in Ink. A dashed curve labelled `if a gravity-only circle had R = 100 µm (hypothetical)` bends upward at distances below a few hundred µm, steepening toward `1/r³`. The tested band `r ≥ 52 µm` is shaded, and the dashed curve visibly leaves the 1/r² line inside the tested band. Label: `ILLUSTRATIVE curve, not the measured data`. Scale gauge: `52 µm`.

### Exit: *handoff OUT*
- **Stage (no text):** The camera flies back from the ruler into the lattice, whose nodes now carry the hidden-shape glyphs at 15% opacity. The small Thread from Beat 5 drifts to the center and grows to canonical size. The final frame is **H2**: one closed Thread loop centered, facing the camera, gently wobbling, with the faint lattice behind it. Chapter 06 can either keep the lattice and dive into one node's glyph or dissolve it.

---

## Lab

**Title: The Hidden Circle.** One instrument panel with three linked stations (tabs: `COUNT · ZOOM · FIT`). They share one WebGL stage.

**Purpose:** Discover why a large extra direction would change gravity, why a small one vanishes from view, and how a hidden circle's size sets a ladder of masses.

### Controls

| Station | Control | Type · range | Default | Units |
|---|---|---|---|---|
| COUNT | `Large directions of space` | stepper 0 · 1 · 2 · 3 · 4 | 3 | count |
| COUNT | `Distance from the mass` | log slider 0.5 – 8 | 1 | arbitrary length units |
| COUNT | `Send a visitor from one dimension up` | button (plays 6 s) | — | — |
| COUNT | `Orbit a planet` | toggle | off | — |
| ZOOM | `Zoom toward the cable` | log slider, camera distance 3 – 10⁴ | 10³ | multiples of the cable radius |
| FIT | `Wavelengths around the circle (k)` | continuous slider 0 – 6, step 0.01 | 1.00 | wavelengths per lap |
| FIT | `Radius of the hidden circle (R)` | log slider 1.6×10⁻³⁵ – 1×10⁻³ | 1×10⁻²⁰ | m |
| FIT | `Who can move around the circle?` | segmented: `All particles` / `Only gravity ○` | All particles | — |

### What changes on screen
- **COUNT:** The central mass emits field lines. At D = 1 there are 2 arrows; at D = 2, 16 lines in the plane; at D = 3, 64 lines on a Fibonacci sphere; at D = 4 the lines fade out, replaced by the label "can't draw this". A probe ring (D = 2) or probe sphere (D = 3) at the chosen distance shows that the same lines spread over a bigger boundary. A small log–log plot shows force against distance with slope −(D − 1), with the measured slope −2 marked. The **visitor** button runs a slice animation: at D = 2 a sphere passes through Flatland, and at D = 3 a 4D ball passes through our space. The **orbit** toggle launches a planet with a 3% kick. It traces an ellipse at D = 3 and a precessing rosette at D = 2. At D = 4 it spirals in or escapes within a few turns. At D = 0 and D = 1 the orbit option is disabled ("no room to orbit").
- **ZOOM:** The Beat 2 cable scene. As you zoom, the cable goes from line to tube and the ant's helix appears. The readouts are `LOOKS LIKE: 1 / 2 DIMENSIONS` and `YOUR SHARPEST DETAIL: n × cable radius`.
- **FIT:** On the left is the hidden circle, not to scale, carrying its wave and faint echo laps. In the center is a linear ladder of rungs `n = 0…8` with physical energy labels. On the right is the mirrored log slide rule (R above, ħc/R below) with the exclusion zones, markers, and a cursor on the current R. The readouts are `R`, `FIRST RUNG ħc/R`, `RUNGS BELOW 13.6 TeV`, `R × first rung = 197.327 MeV·fm`, and a size comparison. In `Only gravity` mode a small plot of gravity's strength against distance appears, with the tested band shaded.

### Model (what the engineer implements)

**COUNT station: faithful physics (Gauss's law; Ehrenfest 1917).**
- Field of a point mass in D large spatial dimensions: flux through a (D−1)-sphere of area ∝ r^(D−1) is conserved, so `F(r) = K / r^(D−1)`. Show the relative force `F(r)/F(1) = r^−(D−1)`. D = 1 gives constant force; D = 2 gives 1/r; D = 3 gives 1/r², as measured; D = 4 gives 1/r³.
- Orbit: planar integration with velocity Verlet, `a = −r̂ / r^(D−1)` (GM = 1), `dt = 0.004`, 4 substeps per frame. Start at `r₀ = 1` with `v₀ = 1.03·√(1/r₀^(D−2))`, the circular speed plus a 3% kick. Stop and reset after 1.5 s if `r < 0.1` ("fell in") or `r > 6` ("escaped"). This is faithful: circular orbits under `F ∝ r^−p` are stable only for p < 3, so D = 4 (p = 3) is unstable.
- Visitor slice: a ball of radius 1 moves along the unseen axis at `v = 0.4 /s`, and the cross-section radius is `ρ(t) = √(1 − z(t)²)` for `|z| < 1`. At D = 2 the flat cross-section is drawn as a circle. At D = 3 the same formula drives a sphere that inflates from a point and deflates. This slice geometry is exact. The 4D ball itself cannot be drawn: `~ANALOGY`.

**ZOOM station: cartoon, labelled ~ANALOGY.**
- Cable radius `R_c = 1`. Camera distance `d` on a log slider. Projected diameter in px: `D_px = 2R_c · (viewportH/2) / (d · tan(fov/2))`. The label reads "1 DIMENSION" when `D_px < 1.5`, "2 DIMENSIONS" when `D_px > 6`, and cross-fades in between. The rings' opacity is `smoothstep(1.5, 6, D_px)`.
- Ant: `s(t) = 0.3t`, `θ(t) = 1.2t` (helix).
- Physics bridge, shown as text only: to resolve a structure of size R you need a probe whose wavelength is smaller than about R, which means energy ≳ ħc/R. For a hidden dimension, zooming in means colliding at that energy.

**FIT station: faithful formulas, cartoon drawing.**
- Constant: `ħc = 1.973 269 804 × 10⁻⁷ eV·m` (= 197.327 MeV·fm, exact in the 2019 SI).
- Fitting rule: a single-valued wave on a circle of circumference `2πR` needs `k ∈ ℤ` whole wavelengths. Then `λ_n = 2πR/n` and the momentum around the circle is `p_n = h/λ_n = nħ/R`.
- Echo-lap visual (a faithful ring-resonator picture): draw `N = 8` copies `r_j(θ) = R_vis·[1 + a·cos(kθ + 2πkj − Ωt)]` for `j = 0…7` at 12% opacity. The bright "survivor" wave has amplitude `A(k) = |sin(Nπk) / (N·sin(πk))|`, with A = 1 at integers. Use `R_vis = 1.4`, `a = 0.08`, `Ω = 1.5 rad/s`. At `k = 0` draw a uniform glow instead of a wave: no motion around the circle, the ordinary particle. Draw the seam gap at θ = 0 with size ∝ `|k − round(k)|`. Optional: snap to the nearest integer on release when within 0.08.
- Tower (for a massless 5D particle, e.g. the graviton): `E_n = n·ħc/R` and `m_n = E_n/c²`. Optionally, for a particle with 5D rest energy `m₀c²`, use `E_n = √((m₀c²)² + (nħc/R)²)`. The engineer can use m₀ = 0 throughout.
- Readouts: `E₁ = ħc/R`, auto-ranged across meV, eV, keV, MeV, GeV and TeV (above 10³ TeV, write it as `x × 10^y GeV`). `RUNGS BELOW 13.6 TeV = floor(1.36×10¹³ eV / E₁)`; when this exceeds 10⁶, show it in scientific notation plus "≈ a continuum". The invariant readout is `R × E₁ = 197.327 MeV·fm`. The size comparison picks the nearest of: Planck length `1.616×10⁻³⁵ m`, proton radius `8.41×10⁻¹⁶ m`, Bohr radius `5.29×10⁻¹¹ m`, and the torsion gap `52 µm`, and reports the ratio.
- Reference energies on the lower ruler: electron `5.11×10⁵ eV`, proton `9.38×10⁸ eV`, LHC collisions `1.36×10¹³ eV`, Planck energy `1.22×10²⁸ eV` (note that `ħc/ℓ_P = E_P` exactly, so the first rung sits at the Planck energy when R equals the Planck length).
- Log mapping: `u ∈ [0,1] → R = 10^(−34.79 + 31.79u)`. The default `R = 10⁻²⁰ m` (u ≈ 0.465) gives `E₁ ≈ 19.7 TeV`: zero rungs below 13.6 TeV. The visitor starts with a circle that is hidden, and enlarging it brings it into reach.
- Exclusion shading (● OBSERVED, from published bounds; the lab does not re-derive the statistics):
  - `All particles`: collider limits on the compactification scale 1/R run from ~1.4 to ~4 TeV depending on the model. Shade a gradient starting at `R = ħc/4 TeV ≈ 4.9×10⁻²⁰ m` and reaching full strength at `R = ħc/1.4 TeV ≈ 1.4×10⁻¹⁹ m`. Label: "model-dependent".
  - `Only gravity` (○ SPECULATIVE scenario): excluded for `R > 30 µm`. This is the bound for one extra dimension from Lee et al. 2020 as listed by the PDG. Gravity plot: `V(r)/V_Newton = 1 + (4/3)·[coth(r/2R) − 1]`, for r from 1 µm to 10 mm on a log axis, with y clamped to [1, 100] on a log axis. This is the exact sum over graviton rungs `n = ±1, ±2, …`, each coupling 4/3 as strongly as the massless graviton to static masses. For r ≫ R it tends to the Yukawa form `1 + (8/3)e^(−r/R)`, which matches PDG's α = 8δ/3 with δ = 1. For r ≪ R it steepens to a 1/r² potential, i.e. a 1/r³ force. Shade the tested band `r ≥ 52 µm`.
- Charge tag, shown only as a label: in Kaluza–Klein theory rung n carries charge `q_n = n·q₁` under the field that comes from the 5D metric.
- Simplifications to flag: the circle is drawn at a constant screen size (not to scale). Only one hidden circle is shown, where string theory needs six hidden dimensions. Winding strings are ignored here (they belong to Chapter 08). The rungs are drawn for a free particle.
- Reduced motion: stop the wave phase at `Ωt = 0`, show the echo laps as a static fan, and disable the orbit animation (show the precomputed path).

### Micro-copy (≤ 20 words each)
- COUNT header: "How many directions can you move in? Change the count and watch gravity spread."
- D labels: `0 · Pointland` · `1 · Lineland` · `2 · Flatland` · `3 · Spaceland (ours)` · `4 · shadow only`
- Force caption: "Gravity here weakens as 1/r^(D−1). We measure 1/r²: three large directions."
- D = 4 orbit: "Four large directions: gravity falls as 1/r³ and orbits spiral away. (Ehrenfest, 1917)"
- Visitor, D = 2: "A sphere crossing Flatland: they see a circle appear, grow, shrink, vanish."
- Visitor, D = 3: "A 4D ball crossing our space would look like a sphere inflating from nothing. ~ANALOGY"
- ZOOM header: "Far away, 'around' is smaller than your sharpest detail. It's still there."
- ZOOM bridge: "For a hidden dimension, zooming in means colliding at energy ≳ ħc/R."
- ZOOM caveat: "~ANALOGY · a cable has an inside. A hidden dimension has only its surface."
- FIT, non-integer k: "Doesn't close on itself. Each lap cancels the last."
- FIT, integer k: "Fits: n whole wavelengths. Allowed."
- FIT, k = 0: "No motion around the circle: the ordinary, lightest particle."
- R slider: "Shrink the circle. Watch the whole ladder climb."
- Invariant: "Radius × first-rung energy = ħc ≈ 197 MeV·fm. Always."
- Zero rungs in reach: "Every rung above n = 0 lies beyond the LHC's collision energy. Out of direct reach."
- Excluded zone: "Ruled out: we would already have seen these copies."
- Gravity-only toggle: "○ Speculative braneworld: only gravity feels the circle."
- Continuum: "Rungs this close blur together. Escaping gravitons would look like missing energy."
- Charge tag: "In Kaluza–Klein theory, n also acts like an electric charge."
- Scale caveat: "~ Circle not to scale. Numbers are."

### Audio (optional, muted by default)
The rungs form an exact harmonic series (`E_n = n·E₁`), so they sound as harmonics. Map `f₁ = 220 Hz · 2^(−(log₁₀R + 20)/6)`, clamped to 40–2000 Hz: the pitch rises as the circle shrinks, faithful to E = hν. Rung n plays `n·f₁`. At non-integer k, play `k·f₁` and `round(k)·f₁` together. The slow beating fades to a pure tone as k locks onto an integer. This echoes Chapter 02's string harmonics.

---

## Go deeper

**Why a circle makes mass.** A wave on a circle of radius R must be single-valued: after one lap (a distance of 2πR) it has to return to its starting value. So a whole number n of wavelengths must fit around the circle, and by de Broglie's rule the momentum around the circle comes in steps. Einstein's energy relation, written in five dimensions, then reads

$$E^2 = (pc)^2 + \left(\frac{n\hbar c}{R}\right)^2 + (m_0c^2)^2$$

- **E** is the total energy.
- **p** is the momentum along our three large directions.
- **nħc/R** is the hidden circling, the lit rung in the lab.
- **m₀** is the particle's own five-dimensional mass, zero for a graviton.

An observer who can't see the circle compares this with E² = (pc)² + (mc²)² and concludes that the particle has a mass

$$m_n c^2 = \sqrt{(m_0c^2)^2 + \left(\frac{n\hbar c}{R}\right)^2}$$

The rungs are spaced by **ħc/R ≈ 197 MeV·fm ÷ R**. For R = 10⁻¹⁹ m that spacing is about 2 TeV. In Kaluza–Klein theory, n also sets the particle's charge under the photon-like field that comes from the geometry.

**Why ten?** Quantizing a string's worldsheet produces an anomaly (a classical symmetry broken by quantum effects) unless a quantity called the central charge adds up to zero:

$$D\,\Big(1+\tfrac12\Big) - 15 = 0 \;\Rightarrow\; D = 10$$

- **D** is the number of spacetime dimensions.
- **1** is each dimension's position field X.
- **½** is X's fermionic partner ψ.
- **−15** is the gauge-fixing ghosts' contribution: −26 + 11.

For the bosonic string, D·1 − 26 = 0 gives D = 26. What is really required is the total: 4 flat dimensions contribute 6, so the remaining 9 must come from a hidden "internal" theory, such as a six-dimensional Calabi–Yau space (next chapter).

---

## Glossary
- `dimension` — An independent direction to move or vary. Equivalently, how many numbers you need to say where something is.
- `compactification` — Curling extra dimensions into a small, closed shape, so that at long distances and low energies space looks lower-dimensional.
- `Kaluza–Klein theory` — The 1920s idea that 5D gravity with one circular dimension looks, in 4D, like gravity plus electromagnetism plus one extra field.
- `Kaluza–Klein tower` — The ladder of heavier copies of a particle, spaced ħ/(Rc) in mass, produced by quantized motion around a hidden circle of radius R.
- `critical dimension` — The spacetime dimension at which a string theory's quantum version keeps its essential symmetries: 26 (bosonic string) or 10 (superstring).
- `anomaly` — A symmetry of the classical equations that quantum effects destroy. String consistency requires the worldsheet's scale anomaly to cancel.
- `braneworld` — A speculative scenario in which our particles are confined to a 3D membrane while gravity alone extends into extra dimensions.
- `inverse-square law` — Gravity's strength falls as 1/r², the signature of exactly three large space dimensions. It has been tested down to 52 µm.
- `modulus` — A field that sets the size or shape of hidden dimensions. A realistic model must fix ("stabilize") it.

---

## Numbers & facts
- **Flatland**: *Flatland: A Romance of Many Dimensions* by Edwin A. Abbott ("A Square"), 1884. It includes Lineland, Pointland, Spaceland, and the Sphere's visit, where the Sphere appears as a growing and shrinking circle. Sources: https://en.wikipedia.org/wiki/Flatland and https://www.gutenberg.org/ebooks/201
- **Ehrenfest 1917**: stable planetary orbits and atoms exist only in three space dimensions. P. Ehrenfest, "In what way does it become manifest in the fundamental laws of physics that space has three dimensions?", *Proc. Roy. Acad. Amsterdam* 20, 200–209 (1917). Discussed in Tegmark, *Class. Quantum Grav.* 14, L69 (1997), gr-qc/9702052.
- **Orbit stability**: circular orbits under a central force F ∝ r^−p are stable only for p < 3. Standard result: Goldstein, Poole & Safko, *Classical Mechanics*, 3rd ed., ch. 3 (central-force orbits and stability).
- **Gauss's law in D dimensions**: F ∝ 1/r^(D−1). Standard; see Zwiebach, *A First Course in String Theory*, 2nd ed., ch. 3 (compact dimensions: ch. 2).
- **Garden-hose and ant analogy**: popularized by B. Greene, *The Elegant Universe* (1999), ch. 8. https://en.wikipedia.org/wiki/The_Elegant_Universe
- **Kaluza, 1921**: Th. Kaluza, "Zum Unitätsproblem der Physik", *Sitzungsber. Preuss. Akad. Wiss. Berlin (Math. Phys.)* 1921, 966–972. Sent to Einstein in 1919. https://en.wikipedia.org/wiki/Kaluza%E2%80%93Klein_theory
- **Klein, 1926**: O. Klein, *Z. Phys.* 37, 895 (1926), and "The Atomicity of Electricity as a Quantum Theory Law", *Nature* 118, 516 (1926), https://www.nature.com/articles/118516a0. Klein proposed a compact fifth dimension with charge quantized through p₅. His period estimate was L = (hc/e)√(16πG) ≈ 0.8×10⁻³⁰ cm ≈ 10⁻³² m. Source: F. Ravndal, "Oskar Klein and the fifth dimension", arXiv:1309.4113.
- **KK reduction content**: 5D gravity on a circle gives 4D gravity + a U(1) gauge field + a scalar (the radion or dilaton). Charged KK modes with the electron's charge would sit near the Planck scale, more than 10²⁰ × m_e. Sources: arXiv:1309.4113; Zwiebach chs. 2–3; Polchinski vol. 1 ch. 8. (Arithmetic: R ~ 10⁻³⁴–10⁻³³ m gives ħc/R ~ 10¹⁷ GeV, against m_e c² = 5.11×10⁻⁴ GeV.)
- **ħc = 197.3269804 MeV·fm = 1.973269804×10⁻⁷ eV·m**, exact in the 2019 SI. PDG physical constants: https://pdg.lbl.gov/2024/reviews/rpp2024-rev-phys-constants.pdf
- **Planck length 1.616255×10⁻³⁵ m** (CODATA 2018, https://physics.nist.gov/cgi-bin/cuu/Value?plkl). **Planck energy ≈ 1.22×10¹⁹ GeV** (PDG constants), and ħc/ℓ_P = E_P exactly.
- **Proton charge radius 0.8409 fm** (PDG 2024). **Bohr radius 5.29177×10⁻¹¹ m** (CODATA). **m_e c² = 0.511 MeV** and **m_p c² = 938.272 MeV** (PDG).
- **LHC Run 3 collision energy 13.6 TeV** (from July 2022): https://home.cern/news/news/physics/lhc-run-3-physics-record-energy-starts-tomorrow
- **Worked tower numbers** (from ħc/R): R = 10⁻²⁰ m → 19.7 TeV; R = 10⁻¹⁹ m → 1.97 TeV; R = 30 µm → 6.6 meV; R = 52 µm → 3.8 meV; R = 1 mm → 0.20 meV.
- **Bosonic critical dimension 26**: first seen by C. Lovelace, *Phys. Lett. B* 34, 500 (1971). Light-cone quantization requires D = 26 for Lorentz invariance: Goddard, Goldstone, Rebbi, Thorn, *Nucl. Phys. B* 56, 109 (1973). Covariant (Weyl-anomaly) derivation: Polyakov, *Phys. Lett. B* 103, 207 (1981). Textbooks: Tong, *Lectures on String Theory*, arXiv:0908.0333, ch. 2 (light-cone, D = 26) and chs. 4–5 (Weyl anomaly, ghosts); Polchinski vol. 1 chs. 1–4.
- **Superstring critical dimension 10** (NSR superstring, Ramond 1971 and Neveu–Schwarz 1971). The central-charge count is X: c = 1, ψ: c = ½, bc ghosts c = −26, βγ ghosts c = +11, so (3/2)D = 15 and D = 10. Source: Polchinski vol. 2 ch. 10; Zwiebach ch. 14.
- **Internal CFT with c = 9** (e.g. a Calabi–Yau threefold, 6 real dimensions) replaces 6 flat dimensions. Source: Polchinski vol. 2 ch. 17, and Candelas–Horowitz–Strominger–Witten, *Nucl. Phys. B* 258, 46 (1985).
- **Non-critical strings exist** (Liouville field; Polyakov 1981), so "10" is the *critical*, flat-background statement.
- **Green–Schwarz anomaly cancellation** (a *spacetime* gauge/gravitational anomaly that fixes SO(32) or E₈×E₈, not the dimension): *Phys. Lett. B* 149, 117 (1984).
- **Bosonic string has a tachyon and no spacetime fermions**: Tong ch. 2; Polchinski vol. 1 ch. 1.
- **M-theory, 11 dimensions**: E. Witten, "String theory dynamics in various dimensions", *Nucl. Phys. B* 443, 85 (1995), hep-th/9503124. **11D supergravity**: Cremmer, Julia, Scherk, *Phys. Lett. B* 76, 409 (1978). **11 is the maximum dimension for supergravity**: W. Nahm, *Nucl. Phys. B* 135, 149 (1978).
- **Torsion balance, 2020**: J. G. Lee, E. G. Adelberger, T. S. Cook, S. M. Fleischer, B. R. Heckel, *PRL* 124, 101101 (2020), arXiv:2002.11761. Separations from 52 µm to 3.0 mm; gravitational-strength (|α| = 1) Yukawa ranges below 38.6 µm (95% CL); single extra dimension bound R ≤ 30 µm. That bound is from the PDG 2026 listing, which uses α = 8δ/3: https://pdg.lbl.gov/2026/listings/rpp2026-list-extra-dimensions.pdf
- **Earlier torsion result**: Kapner et al., *PRL* 98, 021101 (2007), down to 55 µm, R ≤ 44 µm for one extra dimension.
- **Collider KK copies of known particles**: lower limits on the compactification scale 1/R range from ~1.4 TeV to >4 TeV depending on the model (e.g. ATLAS dilepton >4.16 TeV with gauge bosons in the bulk; two-UED ~1.45–1.8 TeV). This gives R ≲ 1.4×10⁻¹⁹ m. Source: PDG 2026 extra-dimensions listing, "Limits on 1/R = M_c".
- **Collider graviton searches (ADD)**: CMS full Run 2 monojet excludes M_D up to 10.7 TeV for 2 extra dimensions (arXiv:2107.13021). The ATLAS 139 fb⁻¹ monojet gives R < 3.8 µm for δ = 2 (PDG 2026 listing).
- **Braneworlds**: Arkani-Hamed, Dimopoulos, Dvali, *Phys. Lett. B* 429, 263 (1998), hep-ph/9803315. Randall–Sundrum, *PRL* 83, 3370 and 4690 (1999), hep-ph/9905221 and hep-th/9906064.

---

## Pitfalls
1. **"Extra dimensions are a parallel place somewhere else."** The pack shows the hidden circle at *every* point (Beat 3). It labels the lattice drawing ~ANALOGY and says the circle is "one more direction at each point", not an object attached to it.
2. **"The fourth dimension is time."** Every count is labelled explicitly. Kaluza's "fifth dimension" is glossed in the text as "a fourth direction of space, a fifth dimension counting time", and superstrings' 10 is "nine of space, one of time".
3. **"A tesseract is what 4D looks like."** It is labelled a *3D shadow of a 4D cube*. The slice picture (a sphere inflating from nothing) is labelled ~ANALOGY.
4. **"String theory has shown that space has 10 dimensions."** Beat 5 says string theory *requires* them "if it describes our world". Nothing is observed, and Beat 6 is a list of null results.
5. **"String theory must have exactly 10 dimensions, full stop."** The count is called the *critical* dimension, and Go deeper explains that the real requirement is a total central charge of 15. That total can come from 4 flat dimensions plus a non-geometric or Calabi–Yau internal theory; non-critical strings also exist. M-theory's 11 is chipped ◌ CONJECTURED.
6. **"The 10 comes from Green–Schwarz anomaly cancellation."** The pack traces 10 (and 26) to the *worldsheet* scale (Weyl) anomaly, the same requirement as Lorentz invariance in light-cone quantization. Green–Schwarz (1984) is a separate, spacetime anomaly condition that selects gauge groups. It is listed in Numbers & facts only to disambiguate.
7. **"They're invisible because they're too small to see."** The pack makes the reason physical. Seeing a size R means resolving it, or exciting motion around it, which costs energy ≳ ħc/R (Beat 4 aha, ZOOM bridge line, `R × E₁ = ħc` readout).
8. **"The ant's hose is a solid tube."** The label notes that a cable has an inside and a hidden dimension doesn't: only the circle itself is space.
9. **"Kaluza–Klein unified gravity and electromagnetism, done."** The mathematics is flagged ◑ DERIVED. The footnote card says Klein's model failed for the electron (charged copies >10²⁰ × too heavy) and that it also predicts an extra scalar field. The mechanism is an ancestor idea, not a working theory of our world.
10. **"Extra dimensions are Planck-sized" or "extra dimensions are large", stated as fact.** The size is "Unknown" (Beat 6). The ruler shows only what's excluded. String-model expectations are tagged ○ SPECULATIVE, and the gravity-only (braneworld) branch is tagged ○ SPECULATIVE wherever it appears.
11. **"The torsion balance ruled out extra dimensions down to 52 µm."** The pack separates the two numbers: 52 µm is the closest separation tested, while ~30 µm is the inferred bound on one gravity-only circle. It also says a circle felt by all particles is constrained far more tightly by colliders (~10⁻¹⁹ m).
12. **"Hidden dimensions must be circles."** Beat 5 swaps the circle for a stand-in glyph labelled "the real hidden shape is the next chapter". The Lab notes that only one circle is modelled where string theory needs six dimensions.
13. **"The bosonic string's 26 dimensions is a rival theory of our world."** It is tagged as a stepping stone with a tachyon and no fermions.
14. **"Waves on the circle are strings."** Colors keep them apart: only strings glow filament-warm. The KK wave is an Ink quantum wave that any particle, not only strings, would have. Winding strings are deferred to Chapter 08.

---

## Handoff
**IN:** H2, matching Chapter 04's final frame: one closed Thread loop centered, facing the camera, gently wobbling. The chapter then collapses it to H0, the point that the dimensional sweep starts from.

**OUT:** H2: one closed Thread loop centered, facing the camera, gently wobbling, in front of a faint (15%) Field-blue lattice whose nodes carry small hidden-shape glyphs. Chapter 06 can keep the lattice and dive into one node's glyph to reveal a Calabi–Yau cross-section, or cross-dissolve the lattice away and keep only the H2 loop.
