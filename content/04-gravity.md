# 04 · Gravity, Uninvited — Why did physicists take strings seriously?

**Thesis:** Quantum field theory describes three of the four forces with extraordinary precision but loses its predictive power for gravity near the Planck energy, while closed strings, purely for reasons of consistency, always contain a massless spin-2 vibration that interacts the way the graviton must, so string theory did not add gravity: it could not avoid it.

**Overall status:** `DERIVED ◑`. The graviton-from-strings result is a mathematical consequence of string theory and has not been tested. It rests on `OBSERVED ●` foundations: the four forces, general relativity and gravitational waves. Gravitons themselves have **not** been observed.

---

## Storyboard

**Global stage conventions (all beats).** Scene units. The default camera sits at `(0, 0, 6)`, looks at the origin with fov 35°, and has +z pointing toward the viewer. **The Thread** (strings only) is a filament tube with core `#FFF6E8`, halo `#FFC98A` and additive bloom. **Test particles** are unlit Ink `#ECE6D9` spheres and never glow warm. **Diagram linework** is Field `#86A8D8`, 1 px hairlines. **Labels** are DOM overlays anchored to 3D points (IBM Plex Mono, uppercase, tracked, tabular digits). Everything is driven by `progress` / `presence` in uniforms, with no per-frame React work.

**Scroll map** (chapter `progress`): Opening 0.00–0.07 · B1 0.07–0.20 · B2 0.20–0.33 · B3 0.33–0.48 · B4 0.48–0.62 · **B5 (aha) 0.62–0.78** · B6 0.78–0.88 · Lab 0.88–0.97 · Outro/handoff 0.97–1.00. Below, "local p" means progress re-mapped to 0–1 within a beat.

### Opening: Gravity, Uninvited

- **Text:** String theory's mathematics began in 1968, as an attempt to describe the strong nuclear force. By the mid-1970s a better theory of that force, QCD, had taken over. Strings survived because of one feature nobody had asked for.
- **Status:** `OBSERVED ●` (history)
- **Stage:** **First frame = H2.** The Thread is one closed loop (radius 1.0), centered and facing the camera, with the canonical gentle wobble, identical to Chapter 3's last frame. The chapter title fades in (Bodoni Moda) with the question in italics beneath. Over local p 0→0.6 the wobble amplitude eases to 50%. A faint Field hairline circle (radius 1.35, 15% opacity) blooms concentric with the loop and fades out. It foreshadows the ring of test particles in B4. Over local p 0.6→1.0 the loop glides to a **parking spot** (x = +2.3, y = +1.3, scale 0.3, opacity 0.45), still wobbling. It stays parked and dim through B1–B4, so the protagonist never leaves the frame. Scale gauge: identical to Chapter 3's, `≈ ℓs · STRING LENGTH (UNKNOWN)` with the secondary line `~10⁻³⁴ m if traditional estimates hold` and hollow-ring (SPECULATIVE ○) marks. Reduced motion: no glide; the loop cross-fades to the parking spot. Fallback SVG: loop plus title.

### Beat 1: Four forces

- **Text:** All known forces reduce to four fundamental interactions. Photons carry electromagnetism; W and Z bosons, the weak force; gluons, the strong force. One [[quantum field theory]], the Standard Model, describes these three, in places to a part in a trillion. The fourth is gravity.
- **Status:** `OBSERVED ●` (the graviton station wears a hollow `NOT OBSERVED` tag)
- **Stage:** Four **force stations** stand in a row at y = +0.4 and x = −2.4, −0.8, +0.8, +2.4. Each station is a 1.1 × 1.1 hairline "exchange sketch": two short horizontal Ink-3 particle lines (top and bottom) joined by a vertical carrier line in standard Feynman-diagram notation.
  - Photon: sinusoidal wavy line.
  - W/Z: wavy line with a small mass tick.
  - Gluon: coiled line.
  - Graviton: a **double** wavy line drawn **dashed** (hypothetical).

  Phase flows along each carrier line at 0.5 Hz. The labels are `ELECTROMAGNETISM · PHOTON · SPIN 1`, `WEAK · W⁺ W⁻ Z · SPIN 1`, `STRONG · 8 GLUONS · SPIN 1` and `GRAVITY · GRAVITON? · SPIN 2`. A hairline bracket under the first three reads `STANDARD MODEL · QUANTUM FIELD THEORY ●`. After a 0.4-unit gap and a vertical divider, gravity's bracket reads `GENERAL RELATIVITY · CLASSICAL ●`.

  **Inline force explorer** (hover or tap a station) opens a glass card:

  | Station | Card contents |
  |---|---|
  | EM | mass 0 (measured bound < 10⁻¹⁸ eV); range unlimited, 1/r²; α ≈ 1/137 |
  | Weak | 80.4 / 91.2 GeV; range ≈ 2.5 × 10⁻¹⁸ m; "feeble at low energy because W and Z are heavy" |
  | Strong | massless, confined inside hadrons (~10⁻¹⁵ m); α_s ≈ 0.12 at 91 GeV |
  | Gravity | "if it exists: massless (GW data: < 2 × 10⁻²³ eV), range unlimited" |

  Under the row, a **log ruler** (Field, 38 decade ticks from 10⁰ to 10⁻³⁷) appears. As local p goes 0.4→1.0, a bead slides from `ELECTRIC REPULSION, TWO PROTONS = 1` to `GRAVITY, SAME TWO PROTONS ≈ 8 × 10⁻³⁷`. A small caption reads: `BOTH FALL AS 1/r², SO THE RATIO HOLDS AT ANY DISTANCE`. The Thread stays parked. Scale gauge: `10⁻¹⁵ m` (nucleus). Fallback SVG: four sketches plus the ruler.

### Beat 2: Gravity has its own theory, and it is classical

- **Text:** Gravity has its own theory: Einstein's [[general relativity]]. Mass and energy curve spacetime; curved spacetime steers everything that moves. It has passed every test so far: Mercury's orbit, GPS clocks, ripples in spacetime detected in 2015. But it is classical. It knows nothing of quanta.
- **Status:** `OBSERVED ●` + `ANALOGY ~` (the bent grid is a cartoon of curvature)
- **Stage:** The three Standard Model stations dim to 10% and drift left off-frame. The gravity station's dashed double line unravels into the recurring **spacetime grid**, a 3D Field lattice of 9 × 9 × 3 lines. The camera tilts to 25° above the grid plane and dollies to z = 7. A neutral Ink sphere (radius 0.25, not warm) sits at the origin, and the grid lines bow toward it with a displacement that is a cartoon: `d = −k r̂ / (r + 0.6)`, k = 0.35.

  Three annotations pop with hairline leaders at local p = 0.25, 0.45 and 0.65: `MERCURY · PERIHELION +43″ / CENTURY`, `GPS · SATELLITE CLOCKS +38 μs / DAY` and `GW150914 · 14 SEP 2015`.

  At local p 0.7 the sphere splits into two smaller spheres that orbit each other with a rising angular speed ω ∝ (t_c − t)^(−3/8) and merge at local p 0.92. The merger sends expanding ripples through the grid as a two-armed spiral, with displacement ∝ cos(2θ − 2Ω(t − r/v)). This is the m = 2 quadrupole shape GR predicts, rendered as a cartoon. The last ripple flattens into one horizontal hairline for B3. Tag, bottom-left: `~ ANALOGY: GRID SKETCHES CURVATURE · NOT TO SCALE`. Scale gauge: `~10⁷ m` (GPS orbit, 2.66 × 10⁷ m). Reduced motion: ripples replaced by three static concentric rings. Fallback SVG: bent grid, three annotations.

### Beat 3: Where the quantum version breaks

- **Text:** Treat gravity as a quantum field. At everyday energies this works: its quantum effects are calculable and tiny. But gravity strengthens with energy. Near the [[Planck energy]], infinitely many unknown inputs all matter, and prediction fails. Black-hole cores and the Big Bang reach that regime.
- **Status:** `DERIVED ◑` + `ANALOGY ~`. **Chip tooltip override:** "Mathematics of ordinary quantum field theory plus general relativity, not string theory. Untested: no experiment reaches these energies, and gravity's quantum corrections are far too small to measure." The fraying fan is a cartoon. (Convention note: the half-dot is used here in its generic sense, "follows from the equations, untested in nature". VISION's `DERIVED` row says "within string theory"; the site's chip legend should say this beat is the one sanctioned exception, or VISION should broaden the definition.)
- **Stage:** The flattened ripple becomes the x-axis of a log–log chart with a hairline frame. The x-axis is energy from 10⁰ to 10²⁰ GeV, ticks every 2 decades. The y-axis is dimensionless interaction strength from 10⁻⁴⁰ to 10⁰. Lines:
  1. **Electromagnetism** (Ink-2): nearly flat near 10⁻²·¹, labeled `α ≈ 1/137 → 1/128 AT 91 GeV`.
  2. **Strong** (Ink-2): drawn from 2 GeV with the one-loop formula `α_s(E) = 0.118 / [1 + 0.118 · (23/12π) · ln(E²/M_Z²)]` (n_f = 5 throughout, schematic), so `α_s(91 GeV) = 0.118`, ≈ 0.26 at 2 GeV and ≈ 0.088 at 10³ GeV.
  3. **Weak, effective** (Ink-2): rises as `α_W (E/M_W)²` up to M_W ≈ 80 GeV, then flattens at α_W ≈ 1/30. Annotation: `FERMI'S THEORY (1933–34): SAME E² GROWTH · CURED BY NEW PARTICLES, W AND Z`. (Schematic normalization: the Fermi-theory strength G_F E² is (π/√2) ≈ 2.2 times this curve below M_W. The factor is invisible on a 40-decade axis, but do not label the curve "G_F E²".)
  4. **Gravity** (Field, thin): the straight line `(E/E_P)²`, from 6.7 × 10⁻³⁹ at 1 GeV to 1 at 1.22 × 10¹⁹ GeV, labeled `DIMENSIONAL ESTIMATE`. (Using the reduced Planck energy, 2.4 × 10¹⁸ GeV, would raise the line by 8π ≈ 25. That is within the schematic tolerance.)

  The Standard Model lines are solid up to 10³ GeV and dashed beyond (`EXTRAPOLATED`). Vertical hairlines mark `LHC 1.36 × 10⁴ GeV` and `PLANCK 1.22 × 10¹⁹ GeV`. A Field **cursor bead** rides the gravity line with local p, with a live readout `E = … GeV · GRAVITY ≈ (E/E_P)² = …`. The **scale gauge tracks λ = ħc/E**, from 2 × 10⁻¹⁶ m down to 1.6 × 10⁻³⁵ m.

  Past ~10¹⁷ GeV the gravity line **frays**. Thin branch lines fan out, tagged `c₁, c₂, c₃ …` (the unknown coefficients of ever-higher curvature terms) and appearing at an accelerating rate. At E_P the fan fills a wedge labeled `INFINITELY MANY UNKNOWN INPUTS → NO PREDICTION`. Two tiny glyphs sit above the Planck line: a hairline horizon circle `BLACK-HOLE INTERIOR` and a converging cone `BIG BANG · t → 0`. Tag: `~ SCHEMATIC COUPLINGS · FAN IS A CARTOON`. Reduced motion: the fan is drawn statically. Fallback SVG: the full chart.

### Beat 4: What spin 2 looks like

- **Text:** If gravity is quantum, a gravitational wave is a crowd of [[graviton]]s, as light is of photons. It stretches a ring of free particles one way, squeezes it the other, then swaps. Two patterns, + and ×, 45° apart: the fingerprint of spin 2.
- **Status:** `OBSERVED ●` (gravitational waves; the + / × tensor pattern is GR's prediction and is strongly favored by LIGO–Virgo data over pure scalar or vector patterns) + `ANALOGY ~` (amplitude exaggerated ~10²⁰×). A secondary hollow tag reads `GRAVITONS: NOT OBSERVED`.
- **Stage:** The chart dissolves. The camera swings to look along −z, so the wave travels **toward the viewer**. The **ring**:
  - 24 Ink test particles (instanced spheres, r = 0.035) at radius R = 1.2, centered.
  - A 1 px Field reference circle marks the undeformed ring.
  - Behind the ring, a 13 × 13 grid of faint tidal arrows (25% opacity) shows the quadrupole force pattern.

  Three translucent Field **wavefront discs** (radius 3, 6% opacity) sweep along z through the ring plane, each crossing at a phase peak. The camera starts 20° oblique so the discs read, then eases face-on by local p 0.3.
  - Local p 0.2–0.55: the ring deforms in the **+ pattern** (ψ = 0°). The wave phase φ advances with *time* at 0.35 Hz (not with scroll), so a typical ~8 s dwell shows about 3 cycles. Scroll controls only ψ and the beat's entrances.
  - Local p 0.55–0.85: ψ scrubs 0° → 45°, so the stretch axes rotate and + becomes **×**.
  - Local p 0.85–1.0: hold ×.

  A corner glyph morphs `+` → `×` with a readout `ψ = 0° … 45°`. Mono readouts: `STRAIN SHOWN 0.2 · REAL ≈ 10⁻²¹ · EXAGGERATED ~10²⁰×` and `LIGO 4 km ARMS · EACH MOVED ≈ 2 × 10⁻¹⁸ m (½hL)`. Model: same equations as the Lab (spin 2, linear), with ring radius R = 1.2. Scale gauge: `4 × 10³ m` (LIGO arm). Reduced motion: three ghosted static snapshots (phase 0, ¼, ½) overlaid. Fallback SVG: ring at + and × (two small multiples).

### Beat 5: The aha. The loop already knows this pattern

- **Text:** Now the string. An open string's first vibration carries one arrow: [[spin]] 1, like a photon. A closed loop has ripples circling both ways, always excited equally. So its first vibration carries two arrows. One combination is spin 2 and exactly massless: a graviton.
- **Status:** `DERIVED ◑` + `ANALOGY ~`. Fixed caption: *"Cartoon. The graviton is a quantum state; this loop shares its symmetry, not its shape."*
- **Stage (the chapter's biggest moment):** The camera pulls back to z = 7.5 to frame two halves. The **ring** moves to x = −1.7 and keeps its + oscillation at 60% amplitude. On mobile, the ring moves to the top half and the string to the bottom half.
  1. **Local p 0.00–0.15: one arrow.** The parked Thread flies in to x = +1.7 and unfurls into **H1**, a horizontal open string of length 1.6 in its fundamental mode. This is the free-end (cos) see-saw from Chapter 2: the ends swing and the midpoint is a node. One small Field double-headed **arrow** at its right end, where the swing is largest, shows the wiggle direction. Label: `OPEN STRING · FIRST VIBRATION · 1 ARROW · SPIN 1 · MASSLESS`.
  2. **Local p 0.15–0.30: close the loop.** The endpoints curl and meet (a callback to Chapter 3) and become a closed loop (radius 0.8). The single arrow fades.
  3. **Local p 0.30–0.50: two ripples.** Two bright **glints** (Gaussian brightness bumps, ~8% of the circumference) circle the loop in opposite directions at equal speed. Hairline tags follow them: `↺ RIGHT-MOVING` on the counterclockwise glint (+φ in the Model, the α modes) and `↻ LEFT-MOVING` on the clockwise glint (−φ, the α̃ modes). "Right-moving" means moving toward increasing σ, and σ runs counterclockwise here. Each glint carries a small Field arrow that slowly sweeps between x and y, showing it can wiggle along either direction. Caption: `NO POINT ON A LOOP IS SPECIAL → BOTH DIRECTIONS EXCITED EQUALLY`.
  4. **Local p 0.50–0.65: two arrows make a pattern.** The two arrows lift off their glints and fly to the midline (x = 0, y = +1.0). They dock as the row and column headers of a **2 × 2 tile**: rows = the right-mover's arrow *i* (x, y), columns = the left-mover's arrow *j* (x, y), matching `εᵢⱼ α^i₋₁ α̃^j₋₁` in Go deeper. The entries light up `xx = +1, yy = −1, xy = yx = 0` (KaTeX, Field). Sub-label: `SYMMETRIC, TRACELESS PART → SPIN 2 · (THE REST: B-FIELD, DILATON)`. A faint corner note reads `2 × 2 CORNER OF A 24 × 24 TILE (8 × 8 FOR SUPERSTRINGS)`, because the full string has more transverse directions (see Go deeper).
  5. **Local p 0.65–0.80: THE LOCK.** The tile fires two hairlines at once, one to the ring and one to the loop. On contact, **the loop begins to deform with exactly the same 2 × 2 map as the ring, in the same phase**. Ring and loop now breathe in perfect lockstep. A hairline `=` pulses between them, a `+` glyph sits above each, and a readout shows `MASS 0 · SPIN 2 · SAME PATTERN`. The camera eases in 10% and the bloom on the Thread rises briefly (+30%). This is the aha frame: the string's pattern matrix is the gravitational wave's.
  6. **Local p 0.80–1.00: rotate together.** ψ scrubs 0° → 45°. The tile's entries morph (`xx, yy → 0`; `xy, yx → 1`), and ring and loop switch from + to × **together**.

  Scale gauge: two gauge tags. The loop gets `≈ ℓs · STRING LENGTH (UNKNOWN)` (SPECULATIVE ○ marks), and the ring keeps `4 × 10³ m` beside it. Reduced motion: steps 3 and 6 become static frames and the lockstep is shown as matched snapshot pairs. Fallback SVG: ring | tile | loop triptych with the + pattern.

### Beat 6: Forced, not inserted

- **Text:** In a strong-force model, this massless spin-2 state was a nuisance. In 1973–74 Yoneya, and independently Scherk and Schwarz, showed it interacts at low energies like general relativity's graviton. String theory did not add gravity; it could not avoid it. Whether nature agrees is untested.
- **Status:** `DERIVED ◑` (history on the timeline: `OBSERVED ●`)
- **Stage:** The ring fades and the camera pulls back. The loop stays right of center with its spin-2 wobble. A hairline **timeline** draws across the bottom third with Field ticks and mono labels:
  - `1968 · VENEZIANO AMPLITUDE (STRONG FORCE)`
  - `1970 · READ AS STRINGS: NAMBU, NIELSEN, SUSSKIND`
  - `1973–74 · QCD ARRIVES; STRINGS FALL OUT OF FAVOR`
  - `1973–74 · MASSLESS SPIN 2 = GRAVITON: YONEYA; SCHERK & SCHWARZ`
  - `1985 · EINSTEIN'S EQUATIONS FROM STRING CONSISTENCY (CALLAN–FRIEDAN–MARTINEC–PERRY)`

  As the 1974 tick lights, the loop gets the tag `HADRON-SIZED STRING ~10⁻¹⁵ m`. The **scale gauge sweeps from 10⁻¹⁵ m to ~10⁻³⁵ m** while the loop's on-screen size stays fixed. Scherk and Schwarz's proposal shrank strings by about 20 orders of magnitude. Tag: `PROPOSED 1974 · NOT MEASURED`. At the end of the sweep the gauge returns to the chapter's standard `≈ ℓs · STRING LENGTH (UNKNOWN)` reading. As the 1985 tick lights, a hairline KaTeX line fades in beside the loop: `consistency ⇒ R_μν = 0 (empty space, + small corrections)`, chipped `DERIVED ◑`. A second small annotation reads `STRING GRAVITON SCATTERING SOFTENS AT HIGH ENERGY (TREE LEVEL) · DERIVED`. Fallback SVG: timeline plus loop.

### Lab dock (0.88–0.97) and Outro (0.97–1.00)

The Lab (below) docks as a glass instrument panel and the stage switches to lab-driven mode. When the visitor scrolls past it, the Lab undocks, the ring fades, and the loop **re-centers** to (0, 0) at radius 1.0 facing the camera. Its spin-2 wobble decays over 1.5 s into the canonical gentle **H2** wobble. Closing caption (`DERIVED ◑`): *"In flat spacetime, the bookkeeping that keeps the graviton massless balances only in 10 dimensions (26 for the simpler bosonic string)."* Scale gauge: `≈ ℓs · STRING LENGTH (UNKNOWN)`.

---

## Lab

### Spin Lab: Ring & Loop

**Purpose:** For a massless wave, spin s tells you how far you must turn its pattern before it repeats: 360°/s. Gravity's stretch-and-squeeze is spin 2, and a closed string's two-arrow vibration carries exactly that pattern.

**Layout:** The stage splits in two. On the left is the **ring** of 24 free test particles, with a tidal-arrow field and a dashed "ghost" of the unrotated pattern. On the right is the **string** (closed loop, or an open string for spin 1). Between them sits the **pattern tile**, the 2 × 2 matrix εᵢⱼ that drives both sides. On mobile the halves stack (ring on top, tile in the middle, string at the bottom) and the panel becomes a bottom sheet.

### Controls

| Control | Type | Range | Default | Units | Notes |
|---|---|---|---|---|---|
| `spin` | segmented | 0 · 1 · 2 | **2** | — | 0 = breathing (hypothetical scalar), 1 = light shaking charges, 2 = gravity |
| `psi` (Rotate pattern) | dial | 0–360 | **0** | degrees | step 1°, soft detents every 45° |
| `pol` | toggle | Linear / Circular | **Linear** | — | Circular is disabled for spin 0 |
| `amp` | slider | 0–0.40 | **0.20** | dimensionless display strain A | real waves are ~10⁻²¹ |
| `speed` | slider + pause | 0–1.2 | **0.35** | wave cycles per second (display) | reduced motion: default 0, with a Phase scrubber (0–360°) |
| `view` | segmented | Ring · Both · String | **Both** | — | |
| `forces` | toggle | on / off | **on** | — | tidal-arrow field |
| `chirp` | button | — | — | — | audio, muted until pressed |

### What changes on screen

- **Spin 2, linear:** The ring stretches along one axis while it squeezes along the perpendicular one, then swaps. Turning `psi` rotates the whole pattern. At 45° it is the × polarization; at 90° it is the + pattern half a cycle later; at 180° it is **identical**. The loop deforms with the same map (cartoon), and two glints circle it in opposite directions. The tile shows ε = [[cos 2ψ, sin 2ψ], [sin 2ψ, −cos 2ψ]].
- **Spin 2, circular:** Each particle traces a small circle, and the stretch axis turns **180° per wave cycle**.
- **Spin 1:** The ring does not deform. It is shaken side to side as a whole, as a light wave shakes a ring of charged beads. It repeats only after 360°. The string side becomes an open string with **one** arrow (free-end see-saw mode), and the tile collapses to a 2-vector.
- **Spin 1, circular:** The whole ring is carried around a small circle, and the shake direction turns **360° per wave cycle**.
- **Spin 0:** The ring uniformly breathes in and out and looks the same at any rotation. The string side is the loop breathing (the dilaton), and the tile shows the identity matrix.
- **Match meter** (under the dial) compares the current pattern with the ghost of the unrotated one. It reports "Same pattern", "Same shape, half a cycle later" or "The other polarization". A persistent readout shows `REPEATS EVERY 360°/s = …` (180° for s = 2, 360° for s = 1, `ANY ANGLE` for s = 0).
- **Readouts:** `SPIN s · INDEPENDENT PATTERNS: 2 (s ≥ 1) / 1 (s = 0) · MASS 0`, `DISPLAY STRAIN A · REAL ≈ 10⁻²¹`, `LIGO: EACH ARM ½hL ≈ 2 × 10⁻¹⁸ m · DIFFERENCE hL ≈ 4 × 10⁻¹⁸ m`.

### Model (implement exactly)

**Coordinates.** Transverse plane (x, y) with the wave moving along +z (toward the camera). Ring rest positions are `x_k = R (cos θ_k, sin θ_k)`, with θ_k = 2πk/24 and R = 1.0. The wave phase `φ(t) = 2π ∫ speed dt` is accumulated each frame, so speed changes never jump. Rotation matrix: `Rot(ψ) = [[cos ψ, −sin ψ],[sin ψ, cos ψ]]`.

**Displacement of particle k (all spins):**

`x_k(t) = x_k + ½ H(t) x_k + v(t)`

| Case | H(t) | v(t) |
|---|---|---|
| Spin 2, linear | `Rot(ψ) · A cos φ · diag(1, −1) · Rot(ψ)ᵀ` | 0 |
| Spin 2, circular | `Rot(ψ) · A [[cos φ, sin φ],[sin φ, −cos φ]] · Rot(ψ)ᵀ` | 0 |
| Spin 1, linear | 0 | `½ A R · Rot(ψ) (cos φ, 0)` |
| Spin 1, circular | 0 | `½ A R · Rot(ψ) (cos φ, sin φ)` |
| Spin 0 | `A cos φ · I` | 0 |

For spin 2, linear, this is the general-relativity **transverse-traceless (TT) gauge** result with polarization amplitudes `h₊ = A cos φ cos 2ψ` and `h× = A cos φ sin 2ψ`:

`δx = ½(h₊ x + h× y)`, `δy = ½(h× x − h₊ y)`

This is faithful to first order in h, for free-falling particles, with the ring much smaller than the wavelength.

**Rotation symmetry and the match meter.** Rotating a helicity-s wave by ψ multiplies its circular (helicity) amplitude by e^{isψ}, so the two linear patterns mix as (cos sψ, sin sψ). The match between the rotated linear pattern and the unrotated ghost, taken at equal phase, is the overlap of the polarization patterns, `½ tr(ε(ψ) ε(0))` for spin 2 or `e(ψ)·e(0)` for spin 1. It is independent of φ, so it has no 0/0 at the nodes of cos φ:

`M(ψ) = cos(s ψ)` (and `M = 1` for s = 0)

- `M ≥ 0.995` → "Same pattern."
- `M ≤ −0.995` → "Same shape, half a cycle later."
- `|M| ≤ 0.05` → "The other polarization." For spin 2 this happens at 45°/135°, for spin 1 at 90°/270°.

In circular mode the meter is hidden and the readout shows `PATTERN TURNS 360°/s PER WAVE CYCLE` (180° for spin 2, where it is the stretch axis; 360° for spin 1, where it is the shake direction). The identities used are `H_circ = A[cos φ · ε(ψ) + sin φ · ε(ψ + 45°)]` and `v_circ = ½AR[cos φ · e(ψ) + sin φ · e(ψ + 90°)]`.

**Ghost.** A dashed Ink-3 outline shows the ψ = 0 pattern at the same φ: a 128-segment closed line using `H₀` (or `v₀`) without the rotation. It is shown only in linear mode.

**Tidal arrows** (`forces` on). This is a 13 × 13 grid of points **r** over [−1.8, 1.8]². For a sinusoid, the relative acceleration is `a(r) = −(2π·speed)² (½ H r + v)`. Draw each arrow along `−(½ H r + v)`, normalized by `½ A · 1.8`, with length clamped to 0.14. For spin 2 this gives the quadrupole pattern, for spin 1 a uniform field, and for spin 0 a radial field. If speed = 0, use the φ-scrubber value.

**String side (CARTOON, flagged ANALOGY).** Center `c = (+1.7, 0)` on desktop, `(0, −1.4)` on mobile.

- **Spin 2 (closed loop):** `P(σ) = c + R_s (cos σ, sin σ)`, with R_s = 0.8 and 256 segments. Deformed: `P'(σ) = c + (I + ½ H(t)) (P(σ) − c)`. This is the same H as the ring, so the two move in lockstep. The glints have brightness `g(σ) = exp(−d(σ, +φ)²/2w²) + exp(−d(σ, −φ)²/2w²)`, where w = 0.12 rad and d is the wrapped angular distance. That is one lap per wave cycle, in opposite directions. The +φ (counterclockwise) glint is the right-mover (α modes) and the −φ glint is the left-mover (α̃ modes). Each glint carries an arrow whose angle sweeps `ψ + 45° ± 45° · sin(0.3 φ)`, which is decorative.
- **Spin 1 (open string):** A segment of length L = 1.6 through c, oriented along `n = Rot(ψ)(0, 1)`. The displacement at arc position s ∈ [0, L] is `u(s) = ½ A L cos(π s / L) cos φ · e`, with `e = Rot(ψ)(1, 0)`, perpendicular to the string. This is the free-end (Neumann) first mode, a see-saw with a node at the midpoint, matching Chapter 2's `basis = 1`. The pinned sin(πs/L) arch would contradict Chapter 2, which teaches that open-string ends are free. One arrow along e sits at the end s = L. In circular mode the string side stays linear and captions itself.
- **Spin 0 (closed loop, dilaton):** `P' = c + (1 + ½ A cos φ)(P − c)`.

**Pattern tile** (DOM + KaTeX). It updates only when `spin` or `psi` changes, never per frame.

- Spin 2: `ε = [[cos 2ψ, sin 2ψ],[sin 2ψ, −cos 2ψ]]` (2 decimals)
- Spin 1: `e = (cos ψ, sin ψ)`
- Spin 0: `δ = [[1, 0],[0, 1]]`

The time dependence (cos φ) is shown only on the stage. In circular mode the tile shows two static matrices, `ε(ψ)` tagged `× cos φ` and `ε(ψ + 45°)` tagged `× sin φ` (for spin 1: `e(ψ)` and `e(ψ + 90°)`).

**What is faithful and what is cartoon**

| Element | Verdict |
|---|---|
| Ring deformation pattern, + / × at 45°, 180° repeat, circular-mode axis turning 180° per cycle | **Faithful** (linearized GR, TT gauge) |
| Tidal-arrow pattern | **Faithful** (geodesic deviation, long-wavelength limit) |
| `M(ψ) = cos(sψ)`, two polarizations for any massless s ≥ 1 | **Faithful** (helicity ±s) |
| Spin 1 ring as charged beads in a uniform oscillating E-field | **Faithful for electromagnetism**; not gravity |
| Spin 0 breathing | **Faithful to a hypothetical scalar wave**; absent in general relativity and disfavored by LIGO–Virgo polarization tests |
| Amplitude A ≤ 0.4 | **Exaggerated ~10²⁰×** (real ~10⁻²¹) |
| Display speed ≤ 1.2 Hz | **Slowed ~10²–10³×** (default 0.35 Hz vs GW150914's 35 → 250 Hz is 100–700×; LIGO band ~10 Hz–kHz) |
| Pattern tile ε | **Faithful**: the same tensor is the graviton's polarization in general relativity and in the string state `εᵢⱼ α^i₋₁ α̃^j₋₁ |0;p⟩`. A coherent state of these string states *is* a metric perturbation `h_μν = ε_μν e^{ip·X}` (Tong ch. 7 intro, eq. 7.2). The 2 × 2 tile is the block along our two transverse space directions; the full string tile is 24 × 24 (bosonic) or 8 × 8 (superstring) |
| Loop deforming like the ring | **Cartoon (ANALOGY)**: the graviton is a quantum superposition; no classical loop shape is massless |
| Circling glints | **Cartoon** of the left- and right-moving lowest-harmonic excitations |

**Performance:** 24 sphere instances, 169 arrow instances, a 256-segment loop ribbon (~6k tris), a 128-segment ghost and 3 disc quads. That is under 15 draw calls and under 20k triangles. All H / v math runs in uniforms (a mat2 plus a vec2), with no per-frame allocation.

### Micro-copy (each ≤ 20 words)

- Panel title: **SPIN LAB · RING & LOOP**
- Spin 2 caption: *Gravity's pattern: stretch one way, squeeze the other. Seen in gravitational waves.*
- Spin 1 caption: *Light's pattern: a ring of charges shaken side to side. Repeats only every 360°.*
- Spin 0 caption: *A breathing pattern. General relativity has none; LIGO–Virgo data disfavor purely scalar waves.*
- Dial hint: *Turn the pattern. How far until it looks exactly the same?*
- Match states: *Same pattern.* · *Same shape, half a cycle later.* · *The other polarization.*
- Amplitude note: *Exaggerated about 10²⁰ times. GW150914 moved LIGO's 4 km arms by about a thousandth of a proton's width.*
- Circular note: *The stretch axis turns 180° per wave cycle: the signature of spin 2.*
- String caption, spin 2: *Cartoon. The graviton is a quantum state; this loop shares its symmetry, not its shape.*
- String caption, spin 1: *An open string's first vibration: one arrow, spin 1, massless. Photon-like.*
- String caption, spin 0: *The dilaton, the loop's spin-0 partner. Unseen, so if real it must be heavy or feebly coupled.*
- Tile caption: *The same numbers drive both sides: the pattern εᵢⱼ.*
- Chirp button: *Hear a synthesized GW150914 chirp: 35 → 250 Hz in about 0.2 s.*

### Audio (optional, muted by default)

The **chirp** button synthesizes the leading-order (Newtonian) inspiral. The frequency is `f(τ) = f₀ (1 − τ/τ_c)^(−3/8)`, with f₀ = 35 Hz and τ_c = 0.201 s, stopping at 250 Hz (τ ≈ 0.2 s). The amplitude goes as `f^(2/3)`, and the phase is `2π ∫ f dτ`. It ends with a 30 ms exponential fade. This is an audio convenience to avoid a click; the real GW150914 ring-down damped in about 4 ms at ~250 Hz. Keep the caption below, which disclaims fidelity.

- Offer a `PITCH ×4` switch (labeled), because 35 Hz is inaudible on laptop speakers.
- While the chirp plays, the ring briefly animates at the real (slowed) frequency sweep.
- Caption: *Synthesized from the inspiral formula; not the recorded data.*

---

## Go deeper

**Two arrows make a graviton**

In the light-cone description of the simplest (bosonic) closed string, every state is built by adding ripple quanta to a bare string. The lightest state that has ripples is:

$$\lvert \text{graviton} \rangle = \varepsilon_{ij}\,\alpha^{i}_{-1}\,\tilde{\alpha}^{j}_{-1}\,\lvert 0;p\rangle, \qquad M^{2} = \frac{4}{\alpha'}\,(N-1) = \frac{4}{\alpha'}\,(\tilde N-1)$$

- `α^i₋₁` adds one quantum of the lowest **right-moving ripple**, wiggling along transverse direction *i*.
- `α̃^j₋₁` does the same for the **left-moving ripple**, along *j*.
- `|0;p⟩` is the **ripple-free string** with momentum *p*.
- `α′` is string theory's single scale from Chapter 1: it sets the **string's size** (it has units of length²).
- `N` and `Ñ` count the **ripple levels** on each side. **Level matching**, N = Ñ, holds because no point on a loop is special.
- The `−1` is quantum **zero-point energy**.

With N = Ñ = 1, the mass is exactly zero. Lorentz symmetry *requires* this. These states have only transverse arrows, and only a massless particle can get by with so few. In flat spacetime, that requirement fixes spacetime at 26 dimensions. Superstrings have an analogous state and reach the same conclusion in 10 dimensions.

The **pattern** `εᵢⱼ` splits into three parts: a symmetric, traceless piece (the graviton), an antisymmetric piece (the B-field) and a trace (the dilaton). In the full theory i and j run over 24 transverse directions (8 for superstrings), so ε is really a 24 × 24 grid. Restrict both arrows to the directions of our three space dimensions: for a wave crossing them, the transverse plane is 2D, so this block of the graviton's ε has just two independent choices, **+** and **×**. (The other rows and columns, which point into extra dimensions, describe other particles.) It is exactly the matrix that moves the ring:

$$\delta x^{i} = \tfrac{1}{2}\,h_{ij}\,x^{j}, \qquad h_{ij} = \begin{pmatrix} h_{+} & h_{\times} \\ h_{\times} & -h_{+} \end{pmatrix}$$

Here `x^j` is a particle's **rest position** and `δx^i` its **displacement**.

Finally, a string can move consistently through curved spacetime only if:

$$\beta_{\mu\nu} = \alpha' R_{\mu\nu} + \mathcal{O}(\alpha'^{2}) = 0$$

`R_μν` is spacetime's **Ricci curvature**. The equation says that, to leading order, **Einstein's vacuum equations** must hold. The B-field and dilaton add further terms.

---

## Glossary

- `quantum field theory`: A framework in which each particle is a quantized ripple of a field filling space. Forces come from exchanging those quanta. The Standard Model is one.
- `general relativity`: Einstein's 1915 theory in which gravity is the curvature of spacetime by mass and energy. It is classical: it has no quanta.
- `Planck energy`: About 1.22 × 10¹⁹ GeV, built from ħ, c and G. Near it, quantum effects of gravity can no longer be neglected.
- `graviton`: The hypothetical quantum of gravity, massless with spin 2. It has never been observed. A gravitational wave would be a vast, coherent crowd of them.
- `gravitational wave`: A ripple in spacetime's geometry, moving at light speed, that stretches and squeezes distances across its path. First detected directly on 14 September 2015.
- `non-renormalizable`: A quantum field theory whose infinities can only be removed by infinitely many measured inputs. Usable at low energies; it loses predictive power at high energies.
- `effective field theory`: A theory used only below some energy, which openly ignores what happens above it. Gravity treated this way gives calculable quantum corrections, far too tiny to have been measured.
- `level matching`: The closed-string rule that clockwise and counterclockwise ripples carry equal excitation, because no point on a loop is special.

Referenced from other chapters, not redefined: `spin` and `polarization` (Ch. 2; their merged definitions in `content/glossary.md` now include this chapter's "massless spin-s pattern repeats after 360°/s" and "+ and ×, 45° apart"), `α′ (alpha-prime)` and `Planck length` (Ch. 1), `quanta` (Ch. 2), `closed string` (Ch. 3).

---

## Numbers & facts

**History**

- **1968:** Veneziano's amplitude for the strong interaction; Nuovo Cim. A57, 190. Source: J. H. Schwarz, "From Hadrons to Gravitons via Strings", [arXiv:2412.16885](https://arxiv.org/abs/2412.16885).
- **1970:** Nambu, Nielsen and Susskind independently interpret the formulas as strings (open strings for Veneziano; closed strings for Virasoro 1969 and Shapiro 1970). Source: Schwarz, arXiv:2412.16885.
- **1973–74:** QCD is formulated in 1973 (Schwarz §1: "The correct theory of hadrons, quantum chromodynamics (QCD), was formulated in 1973"). In 1973–74 string theory falls out of favor as a hadron theory (§3: "In 1973–74 there were many good reasons to stop working on string theory"). The unrealistic spectrum included tachyons and massless particles. QCD's broad acceptance continued through the mid-1970s, so the Opening says "by the mid-1970s" rather than "by 1974". Source: Schwarz, arXiv:2412.16885.
- **Yoneya:** "Quantum gravity and the zero slope limit of the generalized Virasoro model", Lett. Nuovo Cim. 8, 951 (1973); "Connection of Dual Models to Electrodynamics and Gravidynamics", Prog. Theor. Phys. 51, 1907 (1974; received Oct 1973) — [doi:10.1143/PTP.51.1907](https://academic.oup.com/ptp/article/51/6/1907/1864759); reference list in Yoneya, [arXiv:0901.0079](https://arxiv.org/abs/0901.0079).
- **Scherk & Schwarz:** "Dual models for non-hadrons", Nucl. Phys. B81, 118–144 (1974), [ADS](https://ui.adsabs.harvard.edu/abs/1974NuPhB..81..118S/abstract). They showed the zero-slope limit gives Einstein gravity plus a massless scalar (abstract), and proposed that the string scale is roughly the Planck scale (~10⁻³³ cm, not ~10⁻¹³ cm), about 20 orders of magnitude smaller. Schwarz states they worked "unaware of Yoneya's prior work" (arXiv:2412.16885, §4, verified). Yoneya's PTP paper was received 13 Oct 1973 and published June 1974.
- **1985:** Einstein's equations as the condition for worldsheet conformal/Weyl invariance, `β_μν = α′R_μν + … = 0`. Callan, Friedan, Martinec, Perry, Nucl. Phys. B262, 593 (1985); first found in Friedan's 1980 thesis (Tong, ch. 7 footnote at the start of §7.3). Source: D. Tong, *Lectures on String Theory*, [arXiv:0908.0333](https://arxiv.org/abs/0908.0333), §7.1.1, eq. (7.6).

**String-theory results**

- **Closed-string massless level** = (D−2)² states `α̃^i₋₁ α^j₋₁|0;p⟩` → graviton + B-field + dilaton. Masslessness is required by Lorentz invariance, which gives D = 26 (bosonic). Source: Tong, arXiv:0908.0333, §2.3.2. The superstring critical dimension is D = 10 (Tong; Polchinski, *String Theory* Vol. 2).
- **Level matching** L₀ = L̃₀, and the mass formula `M² = (4/α′)(N−1) = (4/α′)(Ñ−1)`. Source: Tong §1.4.1 (classical, eq. 1.41) and §2.2.2 (quantum, eq. 2.25, with a = 1 fixed in §2.2.2–2.3.2).
- **Open strings imply closed strings:** "a theory of interacting open strings necessary [sic] includes closed strings". Source: Tong, arXiv:0908.0333, §6.4.5 "Beyond Perturbation Theory?" (pp. 153–154); see also Polchinski Vol. 1.
- **Graviton scattering in strings:** "all tree-level amplitudes have this soft fall-off at high-energies. Most notably, this includes graviton scattering". At energies ≪ 1/√α′ they "coincide with the amplitudes derived from the Einstein–Hilbert action in D = 26 dimensions". Source: Tong §6.2.3 "Lessons to Learn", paragraph "Graviton Scattering" (p. 139). Loop-level finiteness is not claimed here.
- **Weinberg–Feynman argument:** any theory of interacting massless spin-2 particles is equivalent to general relativity at low energies (assuming Lorentz invariance). Tong's wording is "Einstein gravity, perhaps supplemented by higher derivative terms". Sources: S. Weinberg, Phys. Rev. 135, B1049 (1964); Feynman, *Lectures on Gravitation*; Tong §2.3.2 "The First Excited States", subsection "Why Massless Spin 2 = General Relativity".

**Precision and constants**

- **Electron g/2 = 1.001 159 652 180 59(13)** [0.13 ppt]; it tests the Standard Model prediction to about 1 part in 10¹². Source: Fan, Myers, Sukra, Gabrielse, PRL 130, 071801 (2023), [arXiv:2209.13084](https://arxiv.org/abs/2209.13084).
- **Gravity/electric force between two protons** `= G m_p²/(k_e e²) ≈ 8.1 × 10⁻³⁷` (~10⁻³⁶), independent of distance. For two electrons it is ≈ 2.4 × 10⁻⁴³. Computed from CODATA 2018 constants ([NIST](https://physics.nist.gov/cuu/Constants/)).
- **α_G(proton)** `= G m_p²/(ħc) ≈ 5.9 × 10⁻³⁹`. Computed (CODATA 2018).
- **α ≈ 1/137.036** at low energy and ≈ 1/128 at M_Z; **α_s(M_Z) = 0.1180(9)**; **M_W = 80.3625(77) GeV**; **M_Z = 91.1879(20) GeV**. Source: Particle Data Group, F. Takahashi et al., Int. J. Mod. Phys. A 41, 2630011 (2026), [pdg.lbl.gov](https://pdg.lbl.gov) (W and Z listings, QCD review §9.4.8). This updates the PDG 2024 values (M_W = 80.3692(133), M_Z = 91.1880(20)), and the displayed 80.4 / 91.2 GeV are unchanged.
- **α_W = α/sin²θ_W ≈ (1/128)/0.231 ≈ 1/30.** Computed from PDG values.
- **Weak range** `ħc/(M_W c²) ≈ 2.5 × 10⁻¹⁸ m`. Computed.
- **Photon mass < 1 × 10⁻¹⁸ eV.** Source: PDG 2026, photon listing (Ryutov 07).
- **Gluons: 8. Carrier spins: 1 (γ, W, Z, g); 2 (graviton).** Standard; PDG 2024.
- **Strong-force confinement scale ~10⁻¹⁵ m** (hadron size): proton charge radius 0.841 fm, so the diameter is ~1.7 fm. Source: PDG 2024.
- **Fermi's theory of beta decay (1933–34)** is non-renormalizable. Tong writes that it "accurately predicts physics up to an energy scale of 1/√G_F ∼ 100 GeV": that is an order-of-magnitude statement, since numerically 1/√G_F = 293 GeV. In practice, W exchange departs from it as E approaches M_W ≈ 80 GeV, which is where the chart bends. It was completed by the W and Z, discovered at CERN in 1983. Sources: Tong, arXiv:0908.0333, Introduction; [Wikipedia: W and Z bosons](https://en.wikipedia.org/wiki/W_and_Z_bosons); [Wikipedia: Fermi's interaction](https://en.wikipedia.org/wiki/Fermi%27s_interaction).

**Quantum gravity as a field theory**

- **Planck energy** `E_P = √(ħc⁵/G) = 1.220890 × 10¹⁹ GeV` (1.96 × 10⁹ J); **Planck length** `1.616255 × 10⁻³⁵ m`. Source: CODATA 2018 via [Wikipedia: Planck units](https://en.wikipedia.org/wiki/Planck_units) and [NIST](https://physics.nist.gov/cgi-bin/cuu/Value?plkl).
- **Gravity's dimensionless strength ≈ (E/E_P)²:** ≈ 6.7 × 10⁻³⁹ at 1 GeV and ≈ 1.2 × 10⁻³⁰ at 13.6 TeV. Computed. "Einstein's theory works to an accuracy of (E/M_pl)²" (Tong, Introduction §0.1, verified). Tong also notes that far above M_pl, collisions simply form black holes (classical GR), so the loss of prediction is "troublesome only within a window of energies around the Planck scale".
- **Reduced wavelength λ = ħc/E:** ħc = 0.19733 GeV·fm, so λ = 1.97 × 10⁻¹⁶ m at 1 GeV and λ = ℓ_P = 1.6 × 10⁻³⁵ m at E_P. Source: CODATA 2018; computed.
- **LHC collision energy 13.6 TeV** (Run 3). E_P / 13.6 TeV ≈ 9 × 10¹⁴ (~10¹⁵). Source: CERN; computed.
- **Non-renormalizability.** Pure GR is one-loop finite on shell but diverges once coupled to matter ('t Hooft & Veltman, Ann. Inst. H. Poincaré A20, 69 (1974)). Pure GR diverges at two loops (Goroff & Sagnotti, Phys. Lett. B160, 81 (1985); Nucl. Phys. B266, 709 (1986); confirmed by van de Ven, Nucl. Phys. B378, 309 (1992)). Source: Tong, Introduction §0.1 ("the one-loop S-matrix is finite. The first divergence occurs at two-loops"; with matter, "the first divergence now appearing at one-loop"). The earlier pointer to arXiv:1409.7977 (B. Schulz, an unrefereed 100-page review) was replaced by J. F. Donoghue, "Introduction to the effective field theory description of gravity", [arXiv:gr-qc/9512024](https://arxiv.org/abs/gr-qc/9512024).
- **Gravity as an effective field theory.** The leading quantum correction to Newton's potential is `U = −GMm/r [1 + 3G(M+m)/(rc²) + (41/10π) Għ/(r²c³)]`. Sources: Donoghue, PRL 72, 2996 (1994); Bjerrum-Bohr, Donoghue, Holstein, PRD 67, 084033 (2003).
- **Singularities.** GR's singularity theorems predict breakdown at the Big Bang and inside black holes (Penrose 1965; Hawking & Penrose 1970). Source: Tong, Introduction, "Singularities".

**Tests of general relativity**

- **Mercury:** anomalous perihelion advance ≈ 43″ per century, explained by GR in 1915. Source: C. M. Will, "The Confrontation between General Relativity and Experiment", Living Rev. Relativ. 17, 4 (2014), [arXiv:1403.7377](https://arxiv.org/abs/1403.7377); also S. G. Turyshev, "Experimental Tests of General Relativity", Ann. Rev. Nucl. Part. Sci. 58, 207 (2008), [arXiv:0806.1731](https://arxiv.org/abs/0806.1731). The earlier text wrongly credited Will with 0806.1731.
- **GPS orbit radius** ≈ 2.66 × 10⁷ m (altitude ≈ 20,200 km plus Earth radius 6,371 km). Source: Ashby 2003; computed.
- **GPS:** satellite clocks gain +45 μs/day (gravitational) − 7 μs/day (velocity) ≈ +38 μs/day. Source: N. Ashby, "Relativity in the Global Positioning System", Living Rev. Relativ. 6, 1 (2003).
- **GW150914:** detected 14 Sep 2015, 09:50:45 UTC, and announced 11 Feb 2016 (PRL 116, 061102: "Received 21 January 2016; published 11 February 2016". The printed issue is dated 12 February 2016, which explains the stray "12 Feb"). Peak strain 1.0 × 10⁻²¹, swept 35 → 250 Hz. The black holes were 36 and 29 M☉, 3.0 M☉c² was radiated, and the source lies ~410 Mpc away. Source: [GWOSC GW150914](https://gwosc.org/events/GW150914/); Abbott et al. 2016.
- **GW150914 in-band duration:** "Over 0.2 s, the signal increases in frequency and amplitude in about 8 cycles from 35 to 150 Hz". Source: Abbott et al., PRL 116, 061102 (2016). The Lab's τ_c = 0.201 s is chosen so a pure `(1 − τ/τ_c)^(−3/8)` sweep goes from 35 to 250 Hz in 0.2 s. A Newtonian estimate for a ~30 M☉ chirp mass gives ~0.17 s from 35 Hz, which is consistent.
- **LIGO sensitive band** ≈ 10 Hz to a few kHz. The Lab's default 0.35 Hz is slowed 100–700× relative to GW150914's 35–250 Hz, and its 1.2 Hz maximum is slowed 30–200×. Summary: ~10²–10³×. Source: [LIGO Caltech](https://www.ligo.caltech.edu/page/ligo-detectors); computed.
- **LIGO arms 4 km:** the strain is defined by the arm-length *difference*, `ΔL = L_x − L_y = hL ≈ 1.0 × 10⁻²¹ × 4000 m = 4 × 10⁻¹⁸ m`. Consistent with the Lab's `δx = ½ h x`, each arm changes by `½hL ≈ 2 × 10⁻¹⁸ m`, about 1/840 of a proton's 1.68 fm diameter. That matches LIGO's popular "a thousandth of the width of a proton" (the difference, hL, is ≈ 1/420). Computed. Source: PRL 116, 061102 (peak h); [LIGO GW150914 press release](https://www.ligo.caltech.edu/page/press-release-gw150914).
- **GW170814**, the first three-detector event: pure tensor polarization is favored over pure vector and pure scalar with Bayes factors >200 and >1000. Source: Abbott et al., PRL 119, 141101 (2017), [arXiv:1709.09660](https://arxiv.org/abs/1709.09660).
- **Graviton mass bound:** m_g ≤ 1.92 × 10⁻²³ eV/c² (90%, GWTC-4.0). Source: LVK, "GWTC-4.0: Tests of General Relativity. II. Parameterized Tests", [arXiv:2603.19020](https://arxiv.org/abs/2603.19020) (abstract and §3.1: "a factor of 1.16 improvement compared to the GWTC-3.0 bound 2.23 × 10⁻²³ eV/c²"). The older 1.27 × 10⁻²³ figure is superseded: the GWTC-3 paper's v3 "fixed graviton mass bound in abstract" to m_g ≤ 2.42 × 10⁻²³ eV/c² ([arXiv:2112.06861v3](https://arxiv.org/abs/2112.06861); PRD 112, 084080 (2025)). That resolves the apparent "improvement" paradox. Planetary ephemerides give 1.01 × 10⁻²⁴ eV/c² (99.7%, Mariani et al. 2023, as quoted in 2603.19020), which constrains a different (static, Yukawa) phenomenology.

**Graviton detectability**

- Dyson, Int. J. Mod. Phys. A 28, 1330041 (2013).
- Rothman & Boughn, Found. Phys. 36, 1801 (2006).
- Carney, Domcke & Rodd, PRD 109, 044009 (2024): a single-graviton-like signal could also be explained by classical waves.
- Tobar et al., Nat. Commun. 15, 7229 (2024), [arXiv:2308.15440](https://arxiv.org/abs/2308.15440): proposes detecting single-graviton exchanges and calls it a "clue", not proof.

**Wave physics used in the Lab**

- **Spin and polarization:** a helicity-h wave is invariant under rotation by 360°/|h|, so GW polarizations sit 45° apart and EM polarizations 90° apart. Sources: Misner, Thorne & Wheeler, *Gravitation* (1973) §35.6; M. Maggiore, *Gravitational Waves* Vol. 1 (2008) §1.3 and §2.
- **Ring displacement (TT gauge):** `δxⁱ = ½ hᵢⱼ xʲ`. Sources: Maggiore Vol. 1 §1.3.3; S. Carroll, *Spacetime and Geometry* (2004) §7.4.
- **Newtonian chirp:** `f ∝ (t_c − t)^(−3/8)`, amplitude ∝ f^(2/3). Sources: Maggiore Vol. 1 §4.1; LVK, "The basic physics of the binary black hole merger GW150914", [arXiv:1608.01940](https://arxiv.org/abs/1608.01940).
- **If string theory is right, the dilaton must be heavy or nearly decoupled**, since no extra long-range, equivalence-principle-violating force is seen. This is a standard phenomenological argument, not a theorem. The "heavy" branch is T. R. Taylor & G. Veneziano, "Dilaton couplings at large distances", Phys. Lett. B 213, 450 (1988): string loops make dilaton couplings non-universal, "a serious problem … unless a non-zero dilaton mass is generated". The "nearly decoupled" branch is T. Damour & A. M. Polyakov, "The string dilaton and a least coupling principle", Nucl. Phys. B423, 532 (1994), [hep-th/9401069](https://arxiv.org/abs/hep-th/9401069): cosmological evolution can drive a massless dilaton toward decoupling. Tong §7.2.2 covers only the dilaton's role in setting g_s = e^Φ₀, so it is not cited for this claim.

---

## Pitfalls

| Misconception | How this pack avoids it |
|---|---|
| "String theory predicts gravity, so it's confirmed." | The graviton result wears `DERIVED ◑` everywhere. Beat 6 ends with "Whether nature agrees is untested." The closing chip says the same. |
| "Quantum mechanics and gravity are totally incompatible." | Beat 3 says quantum gravity "works" at everyday energies (as an effective field theory). Numbers & facts cite Donoghue's finite, calculable quantum correction. The failure is loss of *prediction* near the Planck energy, not nonsense at all energies. |
| "Non-renormalizable = infinite answers = wrong theory." | Beat 3 frames it as "infinitely many unknown inputs all matter" near the Planck energy, and says its quantum effects are "calculable" below it. The chart shows Fermi's weak theory with the same E² disease, cured by new particles. Non-renormalizable theories are useful below their scale. |
| "Gravity is 10⁻³⁹ (or 10⁻⁴⁰…) times weaker, full stop." | The pack uses one explicit comparison (two protons, gravity vs electric, ≈ 8 × 10⁻³⁷, distance-independent). It shows that the number depends on the particles (electrons give 10⁻⁴³) and that gravity's strength grows as (E/E_P)². |
| "The weak force is weak because its coupling is tiny." | The force explorer and chart show α_W ≈ 1/30 (larger than α ≈ 1/137). It is feeble at low energy because W and Z are heavy. |
| "LIGO detected gravitons." | Beat 4 opens "If gravity is quantum…" and wears a hollow `GRAVITONS: NOT OBSERVED` tag. Numbers & facts note that single-graviton detection may never be possible, and that even a clean signal might not prove quantization. |
| "Spin means the particle is spinning like a top." | The Lab teaches spin as rotational symmetry of a pattern (360°/s). Nothing in the visuals rotates like a ball. In circular mode, particles trace small circles while the *pattern* turns. |
| "The graviton is a little loop wobbling into an ellipse." | Every loop deformation is labeled ANALOGY: "shares its symmetry, not its shape". The Model table says no classical loop shape is massless and the graviton is a quantum superposition. The only literal element on the string side is the tensor εᵢⱼ. |
| "String theory was invented as a theory of everything / to unify gravity." | The Opening and Beat 6 tell the real history: a failed strong-force model whose unwanted massless spin-2 state was reinterpreted in 1973–74. "Theory of everything" is never used. |
| "Physicists added the graviton by hand." | Beat 5 shows why it is unavoidable. Closed loops must carry both ripple directions equally, and open strings imply closed strings (Tong). The masslessness is fixed by Lorentz symmetry. |
| "Any spin-2 particle automatically is general relativity." | Go deeper and Numbers & facts state the conditions: massless, interacting, Lorentz-invariant, at low energies (Weinberg–Feynman argument). |
| "String theory has solved quantum gravity; it's the only option." | Only tree-level softening and low-energy agreement are claimed (`DERIVED`). Nothing is said about a complete solution. Alternatives exist (loop quantum gravity, asymptotic safety, among others), and none is experimentally confirmed; Chapter 11 can collect these. |
| "The rubber-sheet grid shows how gravity really works." | The Beat 2 grid is tagged `ANALOGY · NOT TO SCALE`. It is used only as a recurring motif, not as an explanation. The GPS effect is mostly time curvature, which a spatial grid cannot show. |
| "Gravitational waves visibly squash things." | Every ring shows `STRAIN SHOWN 0.2 · REAL ≈ 10⁻²¹ · EXAGGERATED ~10²⁰×` and the LIGO readout (each arm ≈ 2 × 10⁻¹⁸ m, about a thousandth of a proton's width). |
| "The Planck energy is a wall where physics or the universe ends." | It is presented as the point where *this approach* stops predicting. The chart dashes the extrapolations. The 1974 string scale is tagged `PROPOSED 1974 · NOT MEASURED`, since the true string scale is unknown. Far above the Planck energy, collisions simply make black holes (Numbers & facts, Tong). |
| "The string length is the Planck length." | The chapter's resting gauge reads `≈ ℓs · STRING LENGTH (UNKNOWN)` with SPECULATIVE marks, as in Chapter 3. A number appears only as `~10⁻³⁴ m if traditional estimates hold` (the site-wide fiducial, SPECULATIVE) and as Scherk and Schwarz's 1974 ~10⁻³⁵ m *proposal*. |
| "Closed strings give just the graviton." | Beat 5's tile names the B-field and dilaton. The Lab's spin-0 mode shows the dilaton and states that, if real, it must be heavy or feebly coupled (a phenomenological argument: Taylor–Veneziano 1988, Damour–Polyakov 1994). |

---

## Handoff

**IN:** **H2.** One closed-string loop, centered and facing the camera, with the canonical gentle wobble. This matches Chapter 3's Handoff OUT (checked against `03-worldsheet.md`: Beat 6's open string closes into this loop, which the camera then looks down on). The loop then parks top-right, dim but present, until it returns as the graviton in Beat 5.

**OUT:** **H2.** After the Lab, the loop re-centers at radius 1.0 facing the camera, and its spin-2 cartoon wobble decays over 1.5 s into the canonical gentle wobble. The last caption (`DERIVED ◑`) reads: *"In flat spacetime, the bookkeeping that keeps the graviton massless balances only in 10 dimensions (26 for the simpler bosonic string)."* This is the natural bridge into Chapter 5 (`dimensions`), which can shrink this same loop into the "tiny circle at every point". The scale gauge rests at `≈ ℓs · STRING LENGTH (UNKNOWN)` (Chapter 3's wording, SPECULATIVE ○ marks). Chapter 5 blanks its gauge across the dissolve, so it is unaffected.

---

## Referee notes

Refereed 2026-09-28. **Sources read directly:**
- Tong, *Lectures on String Theory* (arXiv:0908.0333v3), full text: §0.1, §1.4.1, §2.2.2, §2.3.2, §6.2.3, §6.4.5, the ch. 7 intro, §7.1.1 and §7.2.2.
- Schwarz, arXiv:2412.16885, full text.
- The GW150914 PRL (full text), the GW170814 PRL (full text), the GWTC-3 TGR abstract (v3) and GWTC-4.0 TGR II (full text).
- arXiv abstracts: Fan et al. 2023, Damour–Polyakov 1994, Carney–Domcke–Rodd 2024 and Tobar et al. 2024.
- The PDG 2026 W, Z and photon listings and the QCD review.
- The OUP record for Yoneya's PTP paper.

Every derived number was recomputed in a script with CODATA 2018 constants: force ratios, E_P, ℓ_P, α_G, (E/E_P)², ħc/E, the W range, α_W, 1/√G_F, one-loop α_s, the chirp τ_c and Newtonian τ, hL and ½hL against the proton diameter, the slowdown factors and the GW150914 ring-down time.

**Physics and number corrections**
1. **Graviton mass bound was a superseded value.** The GWTC-3 abstract was revised (v3, "fixed graviton mass bound in abstract") from 1.27 to **2.42 × 10⁻²³ eV/c²**. GWTC-4.0 (arXiv:2603.19020) gives **1.92 × 10⁻²³ eV/c²**, "a factor of 1.16 improvement" over the reanalysed GWTC-3.0 value of 2.23 × 10⁻²³. The drafter's "inconsistent improvement" is therefore resolved, and 1.27 was the wrong number. The Beat 1 card now reads "< 2 × 10⁻²³ eV". Numbers & facts gives the full trail and adds the planetary-ephemeris bound (a different phenomenology).
2. **LIGO arm change: the pack contradicted its own model.** The Lab uses `δx = ½ h x`, so each 4 km arm moves by ½hL ≈ 2 × 10⁻¹⁸ m. The strain is defined by the *difference* L_x − L_y = hL ≈ 4 × 10⁻¹⁸ m. The per-arm figure is ≈ 1/840 of a proton diameter, which matches LIGO's "a thousandth of the width of a proton", so the flagged discrepancy disappears. Changes:
   - The Beat 4 readout now shows the per-arm change.
   - The Lab readout shows both the per-arm change and the difference.
   - The amplitude micro-copy now uses LIGO's proton comparison (18 words).
   - Numbers & facts and Pitfalls are updated to match.
3. **Open string drawn with pinned ends.** `u(s) ∝ sin(πs/L)` with the arrow at the midpoint is the Dirichlet (guitar) mode. Chapter 2 explicitly teaches that open-string ends are free (Neumann, cos modes, see-saw with a central node). Model and Beat 5 now use `cos(πs/L)`, and the arrow sits at the end, where the swing is largest.
4. **Glint direction tags were reversed relative to the Model.** With σ counterclockwise, right-movers (functions of τ − σ, the α modes) travel toward +σ, which is counterclockwise. The tags are now `↺ RIGHT-MOVING` (+φ glint) and `↻ LEFT-MOVING` (−φ glint), and the Model states the mapping.
5. **String length = Planck length (misconception).** The resting gauge `~10⁻³⁵ m · ASSUMED STRING SCALE` presented the Planck length as *the* string scale. It also clashed with Chapter 3 (`≈ ℓs · STRING LENGTH (UNKNOWN)`, SPECULATIVE) and Chapters 1, 2 and 10 (10⁻³⁴–10⁻³³ m). The Opening, Beat 5, Outro and Handoff now use Chapter 3's wording, so the H2 dissolve also matches. The Beat 6 sweep to ~10⁻³⁵ m is kept as the 1974 Scherk–Schwarz *proposal* and tagged `PROPOSED 1974 · NOT MEASURED`. A new Pitfalls row covers the misconception.
6. **Beat 3 physics wording.** "Near the Planck energy … calculations need infinitely many unmeasured inputs" was imprecise. The effective theory always carries infinitely many coefficients; what changes near E_P is that they stop being suppressed, so they *all matter*. "At everyday energies this works" could be read as "tested", so it now says the quantum effects are "calculable and tiny". Text is 45 words.
7. **Beat 3 chip convention (drafter's flag 1).** `DERIVED ◑` is kept with the tooltip override, which now also says "untested". No other chip fits: `OBSERVED` would overclaim and `CONJECTURED` would understate a textbook calculation. VISION's `DERIVED` row says "within string theory", so either the chip legend names this beat as a sanctioned exception or VISION broadens the row to "follows from the equations of a theory; untested in nature". This is an action for the site owner.
8. **QCD dating (drafter's flag 9).** Schwarz (verified) says QCD "was formulated in 1973" and that "in 1973–74 there were many good reasons to stop working on string theory". Broad acceptance of QCD firmed up after the November 1974 charmonium discoveries. The Opening now reads "By the mid-1970s", and the timeline tick reads `1973–74 · QCD ARRIVES; STRINGS FALL OUT OF FAVOR`, which is Schwarz's framing.
9. **PDG values updated to the 2026 edition.** M_W = 80.3625(77) GeV (was PDG 2024's 80.3692(133)) and M_Z = 91.1879(20) GeV. α_s(M_Z) = 0.1180(9) and the photon bound < 1 × 10⁻¹⁸ eV are unchanged. The displayed 80.4 / 91.2 GeV and the 2.5 × 10⁻¹⁸ m weak range are unchanged.
10. **Fermi scale (drafter's flag 5).** Tong's actual words are "1/√G_F ∼ 100 GeV", an order-of-magnitude statement for a quantity that is 293 GeV numerically. The pack now says this and notes that the chart bends at M_W, where W exchange departs from Fermi theory.
11. **Schematic chart made implementable (drafter's flag 4).**
    - The explicit one-loop α_s formula was added (n_f = 5; ≈ 0.26 at 2 GeV, 0.088 at 1 TeV).
    - The weak curve's normalization is stated: G_F E² = (π/√2) × α_W(E/M_W)², a factor of ≈ 2.2. Do not label the curve "G_F E²".
    - The reduced-Planck factor of 8π is noted as within the schematic tolerance.
    - The existing `SCHEMATIC COUPLINGS` tag and the `EXTRAPOLATED` dashing above 10³ GeV cover the rest.
12. **Display slowdown.** The display rate was described as "slowed ~100×", but the default 0.35 Hz against 35–250 Hz is 100–700×. It now says ~10²–10³×.
13. **Audio ring-down.** The 30 ms fade is labelled an audio convenience. The real GW150914 ring-down damped in ≈ 4 ms at ≈ 250 Hz (computed from the 62 M☉, χ ≈ 0.67 quasi-normal mode).
14. **Spin definitions.** Lab Purpose said "Spin *is* how far you must turn…", which is literally wrong: spin 2 repeats at 180°, not 2°. It now reads "for a massless wave, spin s … repeats: 360°/s". The glossary `spin` entry gained the same "massless" qualifier.
15. **Match meter and circular mode.** "Rotation multiplies its polarization by e^{isψ}" is true of helicity (circular) amplitudes. The linear mixing (cos sψ, sin sψ) is now stated. The following were also changed:
    - M is now defined from the ε / e overlaps, which avoids a 0/0 at the zeros of cos φ.
    - The circular readout said "STRETCH AXIS" even for spin 1; it now says `PATTERN TURNS 360°/s PER WAVE CYCLE`.
    - A spin-1 circular description was added.
    - The circular-mode tile spec was added: `H = A[cos φ ε(ψ) + sin φ ε(ψ+45°)]` (identity checked).
    - s = 0 now shows `ANY ANGLE`.
16. **The 2 × 2 tile is a block of a bigger tile.** In the string, i and j run over 24 (bosonic) or 8 (superstring) transverse directions. A faint stage note was added, and Go deeper and the faithful/cartoon table now explain that the 2 × 2 block is the part along our space directions. Without this, the "faithful" verdict for the tile overclaimed.
17. **Critical dimension scoped to flat spacetime.** This applies to the closing caption, the Handoff OUT and Go deeper, for consistency with Chapter 5's refereed wording.
18. **Dilaton (drafter's flag 6).** The micro-copy is now hedged: "Unseen, so if real it must be heavy or feebly coupled" (17 words). Tong §7.2.2 does not discuss dilaton mass or fifth forces, so it was removed as a source. The "heavy" branch now cites Taylor & Veneziano, PLB 213, 450 (1988), and Damour–Polyakov (abstract verified) is kept for the "nearly decoupled" branch. Numbers & facts labels the whole claim as a phenomenological argument, not a theorem.
19. **Beat 4 chip nuance.** `OBSERVED` for the tensor pattern now says it is "strongly favored" by the data. GW170814 gives Bayes factors of >200 against pure vector and >1000 against pure scalar, verified in the PRL text; mixed polarizations are only weakly constrained.

**Engineering precision (Model)**
20. The Beat 4 wave phase is now explicitly time-driven at 0.35 Hz. The earlier "about 3 cycles" was ambiguous between time and scroll. The ring radius R = 1.2 is also stated.
21. The tidal-arrow formula used `y` for the position vector, which clashes with the y-axis. It is renamed **r**.
22. The Beat 6 formula tag now reads `R_μν = 0 (empty space, + small corrections)`, since with B-field or dilaton gradients the equation has more terms.

**Citation corrections**
23. arXiv:0806.1731 is **Turyshev** (Ann. Rev. Nucl. Part. Sci. 58, 207 (2008)), not C. Will. It is replaced by Will, Living Rev. Relativ. 17, 4 (2014), arXiv:1403.7377, with Turyshev kept and correctly credited.
24. arXiv:1409.7977 is an unrefereed 100-page review by B. Schulz. It is replaced by Tong §0.1 (quote verified: one-loop finite pure GR, two-loop divergence, one-loop divergence with matter) plus Donoghue gr-qc/9512024.
25. Tong section pointers fixed:
    - Level matching is in §1.4.1 (eq. 1.41) and §2.2.2 (eq. 2.25), not "§1.3" / "§2.3".
    - The open-implies-closed quote is in §6.4.5 (pp. 153–154), not §6.4.4. The original reads "necessary", so "[sic]" was added.
    - The coherent-graviton / h_μν = ζ_μν e^{ipX} statement is in the ch. 7 intro (eq. 7.2), not §7.1.
    - The Friedan-1980 footnote was located.
    - The graviton-scattering quote now includes Tong's "in D = 26 dimensions".
26. GW150914 date (drafter's flag 10): 11 Feb 2016 is correct ("Received 21 January 2016; published 11 February 2016"). The "12 Feb" comes from the printed issue date, and this is now noted.

**Drafter's flags, resolved**
- Flag 1 (Beat 3 chip): kept, see 7.
- Flag 2 (LIGO): see 2.
- Flag 3 (g-factor): verified. Fan et al.'s abstract says the SM prediction is tested "to 1 part in 10¹²" and that the test is limited by "discrepant measurements of the fine structure constant". "In places to a part in a trillion" stands.
- Flag 4 (chart): see 11.
- Flag 5 (Fermi): see 10.
- Flag 6 (dilaton): see 18.
- Flag 7 (tree-level softening): verified verbatim in Tong §6.2.3. Loop finiteness is still not claimed. Tong's §0.1 point, that far above the Planck scale collisions form black holes classically, was added to Numbers & facts and Pitfalls.
- Flag 8 (graviton mass): see 1.
- Flag 9 (QCD): see 8.
- Flag 10 (date): see 26.
- Flag 11 (tile faithful): confirmed by Tong ch. 7 intro and §2.3.2, with the dimensional caveat added (see 16). The glint arrows and loop deformation remain labelled cartoons.

**Verified as correct, no change needed**
- **History:**
  - Veneziano, Nuovo Cim. A57, 190 (1968).
  - Virasoro 1969 and Shapiro 1970.
  - Nambu, Nielsen and Susskind 1970 (Schwarz §2).
  - Yoneya: Lett. Nuovo Cim. 8, 951 (1973) and PTP 51, 1907 (received 13 Oct 1973).
  - Scherk–Schwarz, NPB 81, 118 (1974): the abstract says "Einstein theory … accompanied by a massless scalar". Schwarz's "unaware of Yoneya's prior work" and "10⁻³³ cm rather than … 10⁻¹³ cm … 20 orders of magnitude" are verified.
  - Callan–Friedan–Martinec–Perry, NPB 262, 593, and β_μν = α′R_μν (Tong eq. 7.6).
  - Fermi 1933–34; W and Z discovered in 1983.
- **Tong:**
  - The (D−2)² massless states and their decomposition, with D = 26 from Lorentz invariance (§2.3.2).
  - The Feynman–Weinberg argument.
  - M² = (4/α′)(N−1).
  - "Einstein's theory works to an accuracy of (E/M_pl)²".
  - Singularities at the Big Bang and in black holes.
- **Electron g/2:** 1.001 159 652 180 59(13).
- **Recomputed:**
  - Gravity/electric force ratio: 8.09 × 10⁻³⁷ for protons, 2.40 × 10⁻⁴³ for electrons.
  - α_G = 5.91 × 10⁻³⁹.
  - E_P = 1.2209 × 10¹⁹ GeV = 1.956 × 10⁹ J.
  - ℓ_P = 1.6163 × 10⁻³⁵ m.
  - (E/E_P)² = 6.71 × 10⁻³⁹ at 1 GeV and 1.24 × 10⁻³⁰ at 13.6 TeV.
  - E_P / 13.6 TeV = 8.98 × 10¹⁴.
  - ħc/(1 GeV) = 1.97 × 10⁻¹⁶ m.
  - ħc/M_W = 2.46 × 10⁻¹⁸ m.
  - α_W = 1/29.6.
- **Lab model:**
  - The TT-gauge algebra Rot(ψ)diag(1,−1)Rot(ψ)ᵀ = ε(ψ) = [[cos 2ψ, sin 2ψ],[sin 2ψ, −cos 2ψ]].
  - The circular-mode particle circles of radius ½AR.
  - M(ψ) = cos sψ, with the detent states.
- **GW150914:** the 09:50:45 UTC detection; 35 → 250 Hz; peak strain 1.0 × 10⁻²¹; 36 + 29 M☉; 3.0 M☉c² radiated; 410 Mpc; "Over 0.2 s … about 8 cycles from 35 to 150 Hz"; chirp mass ≃ 30 M☉.
- **Chirp checks:** τ_c = 0.201 s gives 35 → 250 Hz in 0.1999 s. The Newtonian estimate gives 0.170 s.
- **Other measured values:** GPS +45 − 7 ≈ +38 μs/day at r = 2.66 × 10⁷ m; Mercury 43″/century.
- **Graviton detection:** Carney–Domcke–Rodd PRD 109, 044009 (arXiv:2308.12988) and Tobar et al., Nat. Commun. 15, 7229 ("first experimental clue", verified).

**Not independently re-read (low risk; standard references):**
- MTW §35.6, Maggiore Vol. 1 §§1.3.3, 2 and 4.1, and Carroll §7.4.
- Ashby 2003 (the values are the standard ones).
- Donoghue 1994 and Bjerrum-Bohr–Donoghue–Holstein 2003 (the 41/10π coefficient is the standard result).
- 't Hooft–Veltman 1974, Goroff–Sagnotti 1985/86 and van de Ven 1992 (the physics statements match Tong §0.1).
- Weinberg 1964, Dyson 2013 and Rothman–Boughn 2006.
- Mariani et al. 2023, which is quoted only via arXiv:2603.19020.
- The Taylor–Veneziano abstract, which was read as indexed (ScienceDirect and OSTI were unreachable).

## Editor notes (cross-chapter pass, 2026-09-28)

1. **Handoff IN confirmed.** Chapter 3 ends on H2. The speculative "if Chapter 3 ends on H1" branch was removed.
2. **Gauge fiducial.** The secondary line now reads `~10⁻³⁴ m if traditional estimates hold`, matching Chapters 1, 2, 3 and 10. It replaces `~10⁻³⁵ m if near the Planck length`. The Beat 6 sweep to ~10⁻³⁵ m stays: it is Scherk and Schwarz's 1974 proposal, tagged as such. The Pitfalls row was updated to match.
3. **Glossary deduplication.** `spin` and `polarization` were also defined in Chapter 2, which introduces them first. They now live there, with merged definitions that keep this chapter's symmetry framing. Beat 5's `[[spin]]` links to that entry.
4. **Open for the site owner (unchanged).** Referee item 7: Beat 3's `DERIVED ◑` is used in its generic sense (GR plus QFT, not string theory). Either the chip legend names it as the one sanctioned exception, or VISION §3's `DERIVED` row is broadened to "follows from a theory's equations; untested in nature". Chapter 11's D6 node needs the same decision.
