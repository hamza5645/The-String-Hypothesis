# 02 · One Thread, Many States — How can one kind of thing look like many particles?

**Thesis.** In string theory, one kind of string can look like many different particles, because each quantum vibration state, seen from far away, looks like a point with its own mass and spin, although every particle we know would come from the lowest, massless rung.

**Overall status:** ◑ `DERIVED`: the spectrum follows from string theory's equations and is untested in nature. The guitar physics is ● `OBSERVED`. Every string picture is ~ `ANALOGY`.

---

## Storyboard

### Stage conventions (apply to every beat)

- **World frame.** The Thread is a ribbon/tube mesh with 256 segments along its length parameter σ ∈ [0, 1]. It maps to x ∈ [−3, +3] world units. Its displacement is computed in the vertex shader from uniforms `A[6]` (mode amplitudes), `theta[6]` (phases), `basis` (0 = pinned/sin, 1 = free/cos, blendable), `pol` (polarization mode) and `time`. Only the Thread uses filament colours (`#FFF6E8` core, `#FFC98A` halo). Every diagram element is a `--field` `#86A8D8` hairline with IBM Plex Mono labels.
- **Default camera.** Perspective, FOV 32°, position (0, 0.35, 10), target (0, 0, 0). **Handoff frames are the exception:** progress 0 uses `HANDOFF.camera` (FOV 35° at (0, 0, 10), no view shift) with the registry H1, and progress 1 uses it with H0 (ARCHITECTURE §4). Ease between `HANDOFF.camera` and this default over the Opening's first 0.2 of beat progress, and back during the exit.
- **Graph view (ANALOGY, shown once in the Lab and in the Opening caption).** The horizontal axis is *position along the string* (σ). The up/down and in/out displacements are real transverse directions. This is how string physicists plot a mode expansion; a free quantum string has no fixed straight length.
- **Scale gauge.** It reads `~10⁻³⁴ m · HYPOTHETICAL` (hollow-ring marks) while we are close to the string, continuing Chapter 1's final reading. This is the string length ℓ_s = ħc/M_s ≈ 2 × 10⁻³⁴ m for the chapter's assumed M_s = 10¹⁸ GeV; the true value is unknown.
- **Reduced motion.** Any oscillation is replaced by a frozen frame plus a faint min/max envelope. Scroll-scrubbed transitions become cross-fades.

---

### Opening — "One thread, seventeen particles?"

- **Text:** Chapter 1 ended on a proposal: the smallest things might be tiny strings, not points. A harder question follows. The Standard Model lists seventeen fundamental particles. How could one kind of string be all of them?
- **Status:** ● OBSERVED (the particle list) · ~ ANALOGY (the Thread)
- **Stage:** The first frame is exactly **H1**, Chapter 1's last frame: `<HandoffOpenString/>` with default props at the origin, camera at `HANDOFF.camera`, no view shift. Per the registry (`src/core/handoff.ts`, which wins if it changes): one horizontal open string of length 4.2 world units (0.666 of the viewport height, ≈ 37% of the width at 16:9), free-end (cos) modes 1 and 2 blended (amplitudes ≈ 3% and 1.7% of its length), ω = 2.2 rad/s. Over beat progress 0–0.2 the camera eases to the chapter default and the string lengthens to the bench's 6 units. From beat progress 0.2 to 0.7, seventeen small hairline rings fade in to 30% opacity in a loose ellipse around the string. Each carries a mono symbol (e μ τ νₑ ν_μ ν_τ u d s c b t γ g W Z H). They drift slowly, as if orbiting a question. At 0.7–1.0 the rings dim to 12% and hold. They return in Beat 5. The camera holds at the default.

### Beat 1 — "Only certain patterns"

- **Text:** Pin a string at both ends and pluck it. Its steady vibrations come in only certain patterns: one arch, two, three, and so on. Each is a [[harmonic]], at a whole-number multiple of the lowest frequency. Any pluck is a blend of them.
- **Status:** ● OBSERVED
- **Stage:**
  - **0–0.15:** Two small vertical pegs (hairline, `--ink-3`, 0.4 units tall) slide in to the string's ends, like a guitar's nut and bridge. H1 uses free-end (cos) modes, so morph `basis` 1→0 over this span so the ends settle to zero.
  - **0.15–0.70:** The string steps through modes n = 1, 2, 3, 4, holding each for about 0.13 progress and cross-fading amplitudes over 0.03. Nodes are marked with short hairline ticks: n − 1 interior ticks plus the two pinned ends. A mono label follows each mode: `n = 3 · 3 ARCHES · 330 Hz`. To the right, a small hairline frequency axis (0–500 Hz, ticks every 110 Hz) grows a vertical spike at n × 110 Hz for each mode. The spikes remain afterwards at 40% opacity.
  - **0.70–1.0:** A hairline fingertip cursor pulls the string at σ = 0.2 into a tent, then releases it. The moving shape splits into four ghost strings (modes 1–4, weighted by the triangle-pluck Fourier coefficients). They drop into a vertical stack 0.6 units apart, like a spectrum, then glide back up and sum into the real shape. The spikes rescale to those weights.
  - **Camera:** a slow push from z = 10 to z = 9.2.

### Beat 2 — "Packets, and mass"

- **Text:** String theory's strings aren't pinned to a guitar, yet the whole-number rule survives. Quantum physics adds another: vibration comes in whole packets, [[quanta]]. And by E = mc², vibration energy is mass. So more vibration means a heavier particle, with mass-squared rising in equal steps.
- **Status:** ◑ DERIVED (E = mc² itself is ● OBSERVED) · ~ ANALOGY (graph view; packet beads)
- **Stage:**
  - **0–0.20 (unpinning):** The pegs dissolve into at most 200 instanced `--field` dust motes. `basis` morphs 0→1, from sin to cos modes. The ends start to swing. Mode 1 becomes a see-saw: the ends move in opposite directions around one central node. A mono note sits at the right end: `FREE END · CLASSICALLY IT MOVES AT LIGHT SPEED`.
  - **0.20–0.35:** Free modes 1, 2 and 3 flash briefly. With free ends, harmonic n has exactly n node ticks.
  - **0.35–0.65 (quanta):** The string settles to the **bottom-rung shimmer**, a faint quantum jitter (see Lab › Model). Filament beads (6 px glowing dots) fall from above one at a time. Each landing makes a mode's amplitude **jump** in a 150 ms step, never a smooth ramp. Bead 1 → harmonic 1 (k₁ = 1). Bead 2 → harmonic 1 (k₁ = 2; the amplitude grows by √2). Bead 3 → harmonic 2 (k₂ = 1). A top-left readout fills in: `k₁ = 2 · k₂ = 1 → LEVEL N = 1·2 + 2·1 = 4`.
  - **0.65–1.0 (the ladder):** The string slides left (x −1.8, scale 0.7). On the right a vertical ladder draws itself: hairline rungs N = 0…6, equally spaced 0.45 units apart. Left labels read `N`. Right labels read `M = √N · M_s`, with values 0, 1, 1.41, 1.73, 2, 2.24, 2.45. Rung 0 is brighter and labelled `0 · MASSLESS`. The beads replay quickly (N: 0→1→2→4), and a filament marker climbs one rung per packet-weight, so the harmonic-2 bead lifts it two rungs, passing through rung 3 without stopping. The Thread's glow intensity scales with √N. The KaTeX equation `M² = N / α′` fades in top-centre, with **N** pulsing each time a bead lands. A brief mono aside, `VIBRATION ENERGY = REST ENERGY = M c²`, appears at 0.7 and fades by 0.85.

### Beat 3 — "Which way it wiggles"

- **Text:** Vibrations have a direction, too. Up-down and in-out wiggles are different states, like light's polarizations. A swirling wiggle carries angular momentum around its axis: [[spin]]. More packets of vibration can line up to carry more spin.
- **Status:** ◑ DERIVED · ~ ANALOGY (swirl picture)
- **Stage:**
  - **0–0.25:** The camera orbits to yaw 35° and pitch 12° to reveal depth. A hairline **polarization compass** appears at the string's right end: a disc of radius 0.5 in the y–z plane with small `UP` and `IN` axis labels. The state is k₁ = 1 (N = 1).
  - **0.25–0.40:** The oscillation plane rotates from vertical to depth, and the compass arrow turns 90° with it.
  - **0.40–0.60:** **Swirl.** y = A φ₁(σ) cos ωt and z = A φ₁(σ) sin ωt, so every point circles in the y–z plane and the whole curve turns rigidly about the horizontal axis, like a skipping rope. It is not a corkscrew: a single harmonic has no twist along its length. The compass shows a circular arrow. Readout: `SPIN ALONG AXIS: +2 ħ` (one packet plus the bottom-rung base). A small hairline inset (lower right, 120 px square, labelled `REAL SPACE · y–z ONLY`) plots the same state without the σ axis. There it is a straight rod spinning about its centre, the classic rotating string of Go deeper.
  - **0.60–0.90:** A second bead lands in harmonic 1 and aligns (k₁ = 2, N = 2). The readout ticks to `+3 ħ`. The ladder (ghosted at 25%) gains small spin tags on every rung: `J ≤ N+1`.
  - **0.90–1.0:** A footnote chip fades in at the bottom: `SPIN-½ STATES (ELECTRONS, QUARKS) COME FROM THE STRING'S FERMIONIC SIDE: NO WIGGLE PICTURE.`

### Beat 4 — "Step back" ★ the chapter's aha

- **Text:** Now step back. Seen from far beyond its own size, the string blurs into a point. Only what it carries survives: a mass, a spin, charges. Change the vibration and a different 'particle' appears. One kind of object, many [[states]].
- **Status:** ◑ DERIVED (at distances far larger than the string, string states behave as point particles) · ~ ANALOGY (catalogue layout, loupes)
- **Stage:**
  - **0–0.30 (pull-back):** The camera returns to front view and the ladder fades to 10%. The string (k₁ = 2, swirl) sits centred. The zoom is faked by scaling the object, not by moving the camera, to keep float precision: string scale s = 10^(−15u) for u ∈ [0, 1]. The scale gauge counts from `~10⁻³⁴ m` to `~10⁻¹⁹ m`, where a tick reads `LHC RESOLUTION`. Once the string's on-screen length drops below 40 px, draw only its time-averaged glow envelope. Between 10 px and 4 px, cross-fade to a **point sprite** (3 px core plus halo). Model §9 holds the exact thresholds. A mono label card appears beside it: `MASS 1.41 M_s · SPIN ≤ 3ħ · CHARGE —`.
  - **0.30–0.50 (the catalogue):** Four more points glide in from off-screen to form a row of five, 1.6 units apart. Each has its own card, halo radius (4 px + 3 px·√N) and pulse rhythm:
    - A: `MASS 0 · SPIN 1ħ`
    - B: `MASS 1 M_s · SPIN ≤ 2ħ`
    - C: `MASS 1.41 M_s · SPIN ≤ 3ħ`
    - D: `MASS 1.41 M_s · SPIN ≤ 2ħ`
    - E: `MASS 2 M_s · SPIN ≤ 3ħ`

    It reads like a catalogue of different particles. A tiny `~ CATALOGUE LAYOUT, NOT POSITIONS` note sits under the row.
  - **0.50–0.85 (the reveal):** Circular **loupes** (1 px `--field` ring, glass fill, radius 90 px desktop / 60 px mobile) open one after another, left to right, 0.07 progress apart. Each grows out of its point. Inside each one the *same* Thread vibrates in that point's state:
    - A: bottom-rung shimmer
    - B: k₁ = 1
    - C: k₁ = 2
    - D: k₂ = 1
    - E: k₁ = 1, k₃ = 1

    Mono tags sit under the loupes. One continuous filament hairline runs across the tops of all five loupes, labelled `SAME STRING`. C and D share a mass but differ in maximum spin, which previews "many states per rung".
  - **0.85–1.0:** Hold. The loupes stay open and the cards stay lit. This is the frame the thesis lands on.
  - **Performance:** each loupe is one mini string mesh in a scissored viewport, five extra draw calls in total.

### Beat 5 — "The bottom rung"

- **Text:** The twist: every elementary particle ever measured would sit on the bottom rung, massless by string standards. Their small masses would switch on at far lower energies, through effects like the Higgs field. The next rung, the [[string scale]], is probably far beyond any collider.
- **Status:** ◑ DERIVED (where known particles sit) · ● OBSERVED (their masses) · ○ SPECULATIVE (the string scale in GeV is unknown)
- **Stage:**
  - **0–0.30:** The row of five swings into a column and each point settles on its ladder rung (A→0, B→1, C and D side by side on 2, E→4). Hairline tags show how crowded each rung is: rung 0 `+15 MORE STATES`, rung 1 `+255 MORE`, rung 2 `+2,302 MORE`, rung 4 `+84,223 MORE`. These are 10-dimensional open-superstring counts.
  - **0.30–0.55:** The seventeen hairline rings from the Opening rain onto rung 0 and pile up exactly on it, jittering sideways so they don't overlap. Caption: `EVERY ELEMENTARY PARTICLE EVER MEASURED`. As they land, the rung-0 tag rewrites itself from `+15 MORE STATES` to `16 = ONE OPEN STRING IN FLAT 10D · BRANES + HIDDEN DIMENSIONS MULTIPLY THIS`. Otherwise 17 particles appear to fit into 16 states. (Counting colours, antiparticles and spin states, the Standard Model has well over 100.)
  - **0.55–0.85 (the gap):** A hairline zoom box grows out of rung 0 into a horizontal **log strip** of `m / M_s` from 10⁻²⁸ to 10⁻¹⁵. It assumes M_s = 10¹⁸ GeV, and a note in the corner says so: `ASSUMES M_s = 10¹⁸ GeV · UNKNOWN`. The glyphs land at their positions (see the Lab's particle table). γ and g sit on a separate `0` tick behind a break mark. The three neutrinos are left-pointing arrows at `< 4.5×10⁻²⁸`. A `//` break at the right edge points to rung 1: `RUNG 1 ≈ 6×10¹⁵ × TOP-QUARK MASS`.
  - **0.85–1.0:** An energy axis runs along the ladder's right edge. `LHC 1.36×10⁴ GeV` is squeezed against rung 0 inside a magnified bracket. Rung 1 carries a hollow-ring chip: `IN GeV: UNKNOWN · TRADITIONAL ESTIMATES ~10¹⁸ · LHC: > 7.9 TeV IN SIMPLEST LOW-SCALE MODELS`.

### Beat 6 — "Where charge comes from"

- **Text:** And charge? In string theory it would come from how the string moves or wraps in [[hidden dimensions]], or where its ends attach. Some constructions reproduce the Standard Model's forces and particle families. None yet predicts the measured masses or force strengths.
- **Status:** ◑ DERIVED (the mechanisms and the explicit constructions) · ○ SPECULATIVE (whether any construction describes our universe is an open question)
- **Stage:**
  - **0–0.35:** The camera pushes into rung 0, where the massless Thread shimmers. A faint `--field` grid fades in beside it with a tiny circle at every vertex, previewing Chapter 5. Copy 1 of the Thread closes into a loop and wraps once around one tiny circle (winding needs a closed string), with the chip `CHARGE ← MOTION / WRAPPING AROUND A HIDDEN CIRCLE (CH. 5, 8)`. Copy 2 is an open string whose two ends stick to two faint hairline sheets, with the chip `CHARGE ← WHERE THE ENDS ATTACH (CH. 7)`.
  - **0.35–0.70:** The camera pulls back. The seventeen glyphs arrange into a hairline Standard-Model grid: three family columns of quarks and leptons, a force-carrier column and the Higgs. Every cell holds the *identical* tiny Thread icon plus a small distinct internal glyph (a wrap mark or an attachment mark). Header: `SOME CONSTRUCTIONS REPRODUCE THIS PATTERN` with a ◑ DERIVED chip. Sub-tags: `>200 HETEROTIC MODELS (2011) · ~10¹⁵ F-THEORY MODELS (2019)`.
  - **0.70–1.0:** Two columns slide in beside the grid:
    - `MEASURED MASS`: solid dots with PDG values.
    - `STRING-THEORY PREDICTION`: every cell a dash `—` with a hollow ring, the dashes cascading top to bottom.

    Then everything fades except one Thread at centre, which becomes the Lab's bench string.

### After the Lab — exit to H0

Once the visitor scrolls past the Lab, the bench state eases out over 1.2 s: amplitudes go to 0 (bottom-rung shimmer), the wiggle direction returns to up-down and the camera returns to default. The Beat-4 pull-back animation then replays and the string shrinks into a single glowing point at screen centre. This is **H0**, and the scale gauge reads `FAR AWAY`.

---

## Lab

**The Vibration Bench** · Status: ◑ DERIVED (mass formula, spin limits, state counts) · ● OBSERVED (`PINNED (GUITAR)` mode, measured particle data) · ~ ANALOGY (graph view, jitter, pluck-to-packet mapping, sound, far-view sprite)

**Purpose:** Build string states by hand and find that each one, seen from far away, looks like a different particle with its own mass and spin.

**Layout.**

- **Desktop:** the bench string sits centre stage. Left panel `HARMONICS`: chips, ends, wiggle direction, pluck sliders. Right panel `LADDER`. Bottom strip of readouts. Top right: viewing distance. Bottom drawer: `PARTICLES`.
- **Mobile (< 700 px):** the string fills the top 45% of the viewport. Below it, a bottom sheet with tabs `HARMONICS | LADDER | FAR VIEW | PARTICLES`, 16 px gutters and no horizontal scroll.

### Controls

| Control | Type | Range | Default | Units / notes |
|---|---|---|---|---|
| Pluck (drag the string) | direct manipulation | grab point σ_p ∈ [0.03, 0.97]; pull h ∈ [−0.35, +0.35] | — | L = drawn string length. Releasing plucks. |
| Pluck position | slider (keyboard/touch alternative) | 0.05–0.95 | 0.20 | L |
| Pluck strength | slider | 0–0.35 | 0.25 | L |
| `PLUCK` | button | — | — | Uses the two sliders. |
| Harmonic chips 1–6 | tap cycles packets 0→1→2→3→0; long-press or right-click clears | k_n ∈ {0,1,2,3} | k₁ = 1, others 0 | packets (quanta) |
| Ends | segmented | `FREE` · `PINNED (GUITAR)` | `FREE` | `PINNED` switches the bench to classical guitar physics |
| Wiggle direction | segmented | `UP-DOWN` · `IN-OUT` · `SWIRL ↻` · `SWIRL ↺` | `UP-DOWN` | polarization |
| Viewing distance | log slider | 10⁰ – 10¹⁶ | 10⁰ | multiples of the string's length |
| Ladder axis | toggle | `M²` · `M` | `M²` | |
| Units | toggle | `M_s` · `GeV` | `M_s` | GeV assumes M_s = 10¹⁸ GeV |
| `ZOOM INTO RUNG 0` | button | open/close | closed | log strip of known masses |
| Particles drawer | hover or tap cells | 17 cells + 1 ghost cell (graviton) | closed | |
| Sound | toggle + volume | off/on; 0–1 | off; 0.4 | Muted by default; starts only on a user gesture |
| `RESET` | button | — | — | returns to the defaults |

### What changes on screen

- **Dragging** bends the string live. What you see is the six-harmonic reconstruction of your pull, so what you shape is exactly what gets played. On release in `FREE`, amplitudes **snap** to whole packets (150 ms step): the chips fill with dots, and the ladder marker jumps to the new rung. In `FREE`, the string's average sideways offset drifts back to centre over 0.6 s.
- **Chips** change the vibration directly. The marker moves rung by rung, the Thread's glow scales with √N, and the readouts update.
- **Ends → `PINNED (GUITAR)`**:
  - Pegs appear and the modes become arches.
  - Amplitudes become continuous with no snapping, and they decay like a real pluck.
  - Chips show bars instead of dots, and the readouts switch to Hz.
  - The ladder dims to 20% behind the guitar caption.
  - Viewing distance is disabled, with the caption "Switch to FREE".
- **Wiggle direction** rotates the oscillation plane or turns on the corkscrew swirl. The compass and the spin-along-axis readout follow.
- **Viewing distance:**
  - The string shrinks. Below 40 px it becomes a glow envelope, and between 10 px and 4 px it cross-fades to a point with a label card: MASS · SPIN · CHARGE —.
  - A spin ring with (K+1) ticks circles the point. It rotates only in swirl modes.
  - Slider ticks: `10²: ALREADY A POINT` and `10¹⁵: LHC RESOLUTION`.
- **Ladder axis `M`** moves the rungs to y ∝ √N, so they crowd together towards the top.
- **`ZOOM INTO RUNG 0`** opens the Beat-5 log strip inside the ladder panel.
- **Particles drawer:** hovering a cell highlights its marker on the log strip, flashes rung 0 and shows the particle's card. Except for the graviton, it also sets the bench to the bottom rung (all k_n = 0):
  - γ, g, W, Z: the *same* bottom-rung vector state, left in whatever wiggle direction is selected. Do **not** give different spin-1 particles different wiggles: they differ in charges (hidden dimensions or brane attachment, not modelled), not in vibration pattern. The W/Z mass would switch on at low energy, through the Higgs mechanism.
  - spin-½ cells: the Thread is drawn dotted, with the fermionic-side footnote
  - Higgs: the compass arrow points "into" a tiny hidden-circle glyph, with an `IN SOME MODELS` tag
  - graviton (ghost cell): the bench does **not** change, because the graviton is a closed-string state and the bench is an open string. A small closed-loop glyph appears beside the bench with `CLOSED STRING · CH. 4`.

### Readouts (bottom strip, mono)

- `LEVEL N = Σ n·kₙ`, with the live sum written out, e.g. `1·2 + 2·1 = 4`
- `PACKETS K = Σ kₙ`
- `MASS M = √N · M_s` (GeV mode: `√N × 10¹⁸ GeV`, formatted `1.41 × 10¹⁸ GeV`)
- `SPIN ≤ (K+1) ħ` for this state · `RUNG MAX (N+1) ħ`
- `SPIN ALONG AXIS`:
  - swirl modes: `±(K+1) ħ`
  - straight wiggles: `MIXED (A STRAIGHT WIGGLE BLENDS BOTH SWIRLS)`
- `STATES ON THIS RUNG: D(N)`, with the caption "the bench shows one"

### Model

All masses use units where ħ = c = 1. L = 1 is the drawn length (6 world units).

1. **Mode basis.**
   - `FREE`: φₙ(σ) = cos(nπσ).
   - `PINNED`: φₙ(σ) = sin(nπσ).
   - n = 1…6 and σ ∈ [0, 1].
   - *Faithful:* free (Neumann) ends give cos modes; pinned (Dirichlet) ends give sin modes. Both have frequencies ωₙ = n·ω₁. Harmonic n has n nodes with free ends and n − 1 interior nodes with pinned ends.

2. **Displacement.** θₙ are fixed random phases per state, seeded by the state vector.
   - `UP-DOWN`: y(σ,t) = Σₙ Aₙ φₙ(σ) cos(ωₙ t + θₙ), z = 0.
   - `IN-OUT`: the same expression with y and z swapped.
   - `SWIRL ↻/↺`: y = Σ Aₙ φₙ cos(ωₙ t + θₙ), z = ±Σ Aₙ φₙ sin(ωₙ t + θₙ).
   - **Visual time:** ω₁ = 2π × 0.45 rad/s. Reduced motion: freeze and show the envelope.

3. **Packets ↔ amplitude (`FREE` only).** Aₙ = A_q·√(kₙ / n), with A_q = 0.12 L.
   - *Faithful in form:* the open-string (Neumann) mode expansion is Xⁱ = xⁱ + 2α′pⁱτ + i√(2α′) Σ_{n≠0} (αₙⁱ/n) e^(−inτ) cos nσ, with σ ∈ [0, π] (our σ ∈ [0, 1] is rescaled by π) and [α_m, α_n] = m δ_{m+n,0}. A state with kₙ quanta in mode n has a typical amplitude ∝ √(2α′·kₙ/n), up to an O(1) factor. So A_q stands in for √(2α′).
   - *Cartoon:* the drawing scale.

4. **Bottom-rung jitter (always on, ANALOGY).** Add Σₙ (0.015 L/√n)·φₙ(σ)·noiseₙ(t) to both y and z. noiseₙ is smooth value noise in [−1, 1] with a correlation time of 0.5/√n s.
   - *Honest note:* the true zero-point jitter is about half a packet per mode (⟨Xₙ²⟩ ∝ (2kₙ+1)/n). Summed over modes, the string's mean-square size grows logarithmically with the number of modes resolved, so it diverges if all are included. We draw it 5–10× smaller so it stays readable.

5. **Pluck → packets.**
   - **Target shape:** s(σ) = h·exp(−(σ − σ_p)²/(2w²)), w = 0.15.
   - **`FREE`:** subtract the mean, s̃ = s − ∫s dσ. This removes the zero mode: moving the whole string is motion, not vibration.
   - **Project:** cₙ = 2∫₀¹ s̃ φₙ dσ, using a 65-sample trapezoid.
   - **While dragging:** render Σ cₙ φₙ, plus the mean offset in `FREE`.
   - **On release (`FREE`):** kₙ = min(3, round(n·cₙ² / A_q²)). This follows from classical mode energy Eₙ ∝ n²cₙ² divided by the packet energy ∝ n. If every kₙ = 0, show the "too gentle" caption.
   - **Test vectors** (FREE, w = 0.15, A_q = 0.12):

     | σ_p | h | k | N |
     |---|---|---|---|
     | 0.20 | 0.25 | [1,0,0,0,0,0] | 1 |
     | 0.12 | 0.35 | [2,1,0,0,0,0] | 4 |
     | 0.35 | 0.30 | [1,1,1,0,0,0] | 6 |
     | 0.50 | 0.35 | [0,3,0,1,0,0] | 10 |
     | 0.50 | 0.10 | all 0 | 0 |

     A centre pluck on a free string has no odd harmonics, because they are antisymmetric about the middle.
     Two entries sit close to the rounding threshold: the raw n·cₙ²/A_q² is 0.556 for row 3, n = 1, and 0.546 for row 4, n = 4. Both are stable (±0.001) from 65 up to 2001 samples, so a correct implementation reproduces the table exactly. Row 4's n = 2 raw value is 3.97, which the cap clips to 3.
   - **`PINNED` (classical):** Aₙ(t) = cₙ·exp(−t/τₙ), with τₙ = 3.0 s/√n. There is no quantization.

6. **Level and mass.** N = Σₙ n·kₙ, and M² = N/α′, so M = √N·M_s with M_s ≡ 1/√α′.
   - *Faithful:* this is the open superstring (NS sector, GSO-projected). Its bottom rung ψⁱ₋₁/₂|0⟩ is massless, and each α₋ₙ packet adds n to α′M². At N = 0, rung 0 is the massless level.
   - The closed superstring would use M² = 4N/α′ with left/right level matching (not shown).
   - `GeV` mode multiplies by an assumed 10¹⁸ GeV.
   - Maximum N with the chip caps is 63.

7. **Spin.** J_max(state) = K + 1 with K = Σ kₙ. J_max(rung) = N + 1, reached with all packets in harmonic 1: the leading Regge trajectory J = α′M² + 1.
   - `SWIRL ↻/↺` → spin along the axis = ±(K + 1)ħ.
   - `UP-DOWN` / `IN-OUT` → "mixed".
   - *Faithful:* each αⁱ₋ₙ oscillator and the base ψⁱ₋₁/₂ each carry one vector index. Circular combinations α^y ± iα^z carry J^{yz} = ±1 each, so for the bench's states ∏ₙ(α₋ₙ)^{kₙ} ψ₋₁/₂|0⟩, J_max = K + 1 is exact. Other states on the same rung (built with ψ₋₃/₂, three ψ₋₁/₂'s and so on) are not on the bench, and none of them exceeds N + 1.
   - *Bottom rung (K = 0):* the base ψ₋₁/₂ has no bosonic wiggle to draw, so its polarization (and its ±1ħ in swirl) is shown only by the compass arrow, over the jitter.
   - *Real-space check:* the swirling k₁ = 1 state, y = A cos πσ cos ωt and z = A cos πσ sin ωt, traces a straight rod through the origin that rotates in the y–z plane. This is the classical rotating open string (Go deeper), and it is what the Beat-3 inset draws.
   - *Simplifications:*
     - the fermionic oscillators ψ₋ᵣ and the Ramond (spin-½) sector are not drawn;
     - only 2 of the 8 transverse directions are shown;
     - "spin" means the largest angular-momentum component.

8. **States per rung.** D(N) is the 10D open-superstring count (bosons + fermions, one endpoint label). It comes from the GSO-projected NS partition function, doubled by supersymmetry. Precomputed for N = 0…63:

   ```js
   const D = [16, 256, 2304, 15360, 84224, 400896, 1.71e6, 6.69e6, 2.43e7, 8.32e7, 2.7e8,
     8.36e8, 2.49e9, 7.12e9, 1.98e10, 5.32e10, 1.39e11, 3.56e11, 8.88e11, 2.17e12, 5.2e12,
     1.22e13, 2.82e13, 6.42e13, 1.44e14, 3.17e14, 6.89e14, 1.48e15, 3.14e15, 6.59e15,
     1.37e16, 2.8e16, 5.69e16, 1.14e17, 2.28e17, 4.5e17, 8.81e17, 1.71e18, 3.29e18,
     6.29e18, 1.19e19, 2.25e19, 4.2e19, 7.81e19, 1.44e20, 2.64e20, 4.82e20, 8.73e20,
     1.57e21, 2.82e21, 5.03e21, 8.91e21, 1.57e22, 2.76e22, 4.82e22, 8.38e22, 1.45e23,
     2.5e23, 4.29e23, 7.33e23, 1.25e24, 2.11e24, 3.56e24, 5.99e24];
   ```

   Display values below 10⁶ exactly with thin-space thousands; display larger values as `≈ 1.7 × 10⁶`.

9. **Far view.** Apparent length ℓ_px = ℓ₀_px / D_view.
   - Below 40 px: draw the glow envelope only.
   - Between 10 px and 4 px: cross-fade to the point sprite. This is the single source of truth for the threshold; Beat 4 and the Lab copy refer to it.
   - Halo radius: 4 px + 3 px·√N, capped at 22 px.
   - Spin ring: radius = halo + 6 px, with (K+1) ticks, rotating at 0.2 rev/s in swirl modes.
   - Gauge: view width ≈ D_view × 2×10⁻³⁴ m (assumed ℓ_s).
   - *Cartoon:* the threshold is arbitrary. *Faithful in spirit:* far below the string scale, string states act as point particles.

10. **Ladder.**
    - `M²` axis: y_N = N·28 px.
    - `M` axis: y_N = 28 px·√(8N), so rung 8 sits at the same height (224 px) in both modes.
    - Show rungs 0…max(8, N+2), with a `//` break when N > 20.
    - Rung labels: N, M, D(N) and `J ≤ N+1`.

11. **Rung-0 log strip.** Plot x = log₁₀(m/M_s) over the range [−28, −15], assuming M_s = 10¹⁸ GeV. Use the values in the particle table below. γ and g go on a separate `0` tick; neutrinos are upper-limit arrows.

12. **Not modelled:** charge (the card shows "—" and says hidden dimensions are needed), fermions, closed strings and interactions.

### Particle drawer data (PDG 2026 unless noted; m/M_s assumes M_s = 10¹⁸ GeV)

| Cell | Mass | Spin | Charge (e) | m/M_s | Card |
|---|---|---|---|---|---|
| e electron | 0.511 MeV | ½ | −1 | 5.1×10⁻²² | F |
| μ muon | 105.66 MeV | ½ | −1 | 1.1×10⁻¹⁹ | F |
| τ tau | 1.777 GeV | ½ | −1 | 1.8×10⁻¹⁸ | F |
| νₑ ν_μ ν_τ | < 0.45 eV† (KATRIN 2025) | ½ | 0 | < 4.5×10⁻²⁸ | N |
| u up | 2.16 MeV* | ½ | +⅔ | 2.2×10⁻²¹ | F |
| d down | 4.70 MeV* | ½ | −⅓ | 4.7×10⁻²¹ | F |
| s strange | 92.9 MeV* | ½ | −⅓ | 9.3×10⁻²⁰ | F |
| c charm | 1.273 GeV* | ½ | +⅔ | 1.3×10⁻¹⁸ | F |
| b bottom | 4.186 GeV* | ½ | −⅓ | 4.2×10⁻¹⁸ | F |
| t top | 172.60 GeV | ½ | +⅔ | 1.7×10⁻¹⁶ | F |
| γ photon | 0 (< 10⁻¹⁸ eV) | 1 | 0 | 0 | V |
| g gluon | 0 (theory) | 1 | 0 (carries colour) | 0 | G |
| W | 80.36 GeV | 1 | ±1 | 8.0×10⁻¹⁷ | W |
| Z | 91.19 GeV | 1 | 0 | 9.1×10⁻¹⁷ | W |
| H Higgs | 125.13 GeV | 0 | 0 | 1.3×10⁻¹⁶ | H |
| G graviton (ghost cell, dashed) | 0 (expected; bound < 1.76×10⁻²³ eV) | 2 | 0 | — | Grav |

\*Quark masses are scheme-dependent (MS-bar) because quarks are never seen alone.
†KATRIN bounds the effective electron-antineutrino mass. Flavour states have no single mass, but because the mass splittings are tiny, every mass state is below 0.453 eV. Oscillations show neutrinos *do* have mass (at least one ≥ 0.05 eV), so the card must not say "only an upper limit is known".

Every card footer reads: `MEASURED ● · STRING-THEORY PREDICTION OF THIS MASS: —`.

### Micro-copy (each ≤ 20 words)

**Bench**

- Title: "The Vibration Bench"
- Intro: "Pluck the string or tap the harmonics. Then step back and see what a distant observer would call it."
- Drag hint: "Drag anywhere on the string, then let go."
- Snap: "Snapped to whole packets. A quantum string can't vibrate by half a packet."
- Too gentle: "Too gentle for even one packet. Still on the bottom rung."
- Zero mode: "Sliding the whole string isn't vibration. It doesn't change the mass."
- Chip tooltip: "Harmonic n. Each packet here adds n to the level."
- `FREE`: "Free ends, like an open string in string theory. Quantum: whole packets only."
- `PINNED (GUITAR)`: "Guitar: pinned ends. A pluck holds ~10²⁸ packets, so it looks smooth. Adds only ~10⁻²⁰ kg."
- Graph view (ANALOGY): "Across: position along the string. Up/down and in/out: real directions it moves."
- Jitter (ANALOGY): "Quantum jitter, drawn small. Even the bottom rung is never perfectly still."

**Ladder**

- Rung 0: "Rung 0 · massless. Every elementary particle we've measured would live here."
- Axis note: "Rungs equally spaced in mass-squared. Switch to mass and they crowd together."
- GeV toggle: "Assumes M_s = 10¹⁸ GeV. The real value is unknown."
- States readout: "States on this rung: 2,304. The bench shows one." (the number is live)

**Spin**

- Spin hint: "Put packets in low harmonics to carry more spin."
- Up-down / in-out: "Wiggle direction is polarization, like light's."
- Swirl: "A swirl carries spin around the axis: K+1 units, the most this state allows."
- Spin-½ footnote: "Spin-½ states come from the string's fermionic side. No wiggle picture exists."

**Far view**

- Distance slider: "Step back. Seen from far beyond its own size, a string looks like a point."
- LHC tick: "Our sharpest view, the LHC, resolves about 10⁻¹⁹ m. A string might be about 10⁻³⁴ m."
- Charge label: "Charge needs hidden dimensions. Not modelled here."

**Particles drawer**

- Header: "In string theory, all of these would be bottom-rung states of one kind of string."
- Footer: "Some constructions reproduce this list. None yet predicts the measured masses."
- Card F: "Spin ½: from the string's fermionic side. Why three families? In some models, the hidden shape's topology (Ch. 6)."
- Card N: "Spin ½, lightest known matter. Oscillations prove it has mass; only an upper limit on how much."
- Card V: "Spin 1, massless: a bottom-rung state whose polarization is the wiggle direction, as on this bench."
- Card G: "Spin 1. In brane models, a string with both ends on a stack of three branes (Ch. 7)."
- Card W: "Spin 1, bottom rung. Its 80–91 GeV mass would switch on at low energy, through the Higgs mechanism."
- Card H: "Spin 0: in some models, a wiggle pointing into hidden dimensions. Why it's so light is unsolved."
- Card Grav: "Not in the Standard Model; never detected as a particle. Closed strings always include a massless spin-2 state (Ch. 4)."

**Sound**

- Sound on: "Harmonics of 110 Hz. You hear the vibration pattern, not the mass."
- Real pitch: "At E = hf, a 10¹⁸ GeV rung would be about 10⁴¹ Hz. Transposed about 131 octaves down."

### Optional audio (muted by default)

- **Voices:** six sine oscillators (WebAudio), one per harmonic, at fₙ = n × 110 Hz (A2 and its harmonics; harmonic 4 is concert A, 440 Hz). Each goes through its own GainNode into a master gain that starts at 0. Nothing starts until the visitor enables sound.
- **`FREE`:** a steady tone. Target gain gₙ = 0.18·Aₙ/A_q, renormalized so Σgₙ ≤ 0.6, smoothed with `setTargetAtTime(τ = 0.08 s)`. The bottom rung is silent. Changing packets changes the *timbre*, so visitors hear the pattern. Stress in the caption that the pitch does not track the mass.
- **`PINNED`:** each pluck triggers the gains to follow Aₙ(t), including its decay, which gives a recognisable plucked-string sound. A centre pluck audibly loses its even harmonics.
- **Optional:** a soft 20 ms tick when packets snap in.

---

## Go deeper

**The ladder, term by term**

A guitar string's harmonics obey

$$f_n=\frac{n}{2L}\sqrt{\frac{T}{\mu}}$$

The **harmonic number** $n$ counts the arches. **Length** $L$, **tension** $T$ and **mass per length** $\mu$ belong to the instrument. The **frequency** $f_n$ climbs in equal steps: 110, 220, 330 Hz.

A quantum open superstring (in units where $\hbar=c=1$) obeys

$$M^2=\frac{N}{\alpha'},\qquad N=\sum_{n\ge 1} n\,k_n$$

Here $k_n$ is the **packet count** in harmonic $n$ (the dots on each chip), and $N$ is the **level** (the rung). $\alpha'$ is the theory's single scale, met in Chapter 1 (the string length is $\sqrt{\alpha'}$), and $M_s = 1/\sqrt{\alpha'}$ is the **string scale**. $M$ is the **mass** reported by the distant point. The massless bottom rung is not a still string: a quantum effect of its jitter exactly offsets the energy of its lowest excitation. Closed strings follow the same logic, with $M^2 = 4N/\alpha'$ and equal left- and right-moving levels.

Why mass-squared? Here is a heuristic. A heavier string is longer, and a longer string vibrates more slowly. Each new packet brings energy in proportion to its frequency, so each adds less mass than the one before, and $M^2$, not $M$, climbs evenly.

$$J_{\max}=\alpha' M^2+1$$

Every packet carries a direction, like a small arrow, and so does the bottom-rung state. Line them all up and their spins add, so the **maximum spin** $J_{\max}$ on rung $N$ is $N+1$ units of $\hbar$. Spin rising with mass-squared was first seen in real hadrons, with a slope of about 0.9 GeV⁻². That pattern was one of the clues that led to string theory in 1968–70. In hadrons the "string" is a flux tube between quarks. A fundamental string's $\alpha'$ would be roughly $10^{36}$ times smaller, if $M_s \approx 10^{18}$ GeV.

*Highlight map (for the engineer, not displayed):*

| Term | Highlights |
|---|---|
| $n$ | the active chip and the node ticks |
| $L, T, \mu$ | the pegs (PINNED only) |
| $f_n$ | the frequency spikes |
| $k_n$ | the chip dots |
| $N$ | the level readout and the ladder marker |
| $\alpha'$ | the rung spacing |
| $M$ | the far-view MASS label and the halo |
| $J_{\max}$ | the spin-ring ticks and the `RUNG MAX` readout |

---

## Glossary

- `harmonic`: One of the standing-wave patterns a string can hold steadily. Harmonic n vibrates at n times the lowest frequency.
- `node`: A point on a vibrating string that stays still. Pinned harmonic n has n − 1 inside the string; a free-ended harmonic n has n.
- `quanta`: Whole packets of vibration energy. Quantum physics forbids half a packet, so each harmonic of a quantum string holds 0, 1, 2… of them.
- `level`: The string's rung number N: add n for every packet in harmonic n. In string theory, mass-squared is proportional to N.
- `superstring`: String theory with fermions (spin-½ states, like electrons) in its spectrum as well as bosons, paired rung by rung. In flat space it needs ten spacetime dimensions (Ch. 5).
- `string scale`: The mass of the first massive rung, M_s = 1/√α′. Unknown: traditional estimates put it ten to thirty times below the Planck energy (~10¹⁸ GeV); speculative models, much lower.
- `polarization`: The direction or pattern of a wave's vibration. It tells otherwise identical states apart: light has two; gravity's two, + and ×, sit 45° apart.
- `spin`: A particle's built-in angular momentum, in units of ħ. Measured: 0 (Higgs), ½ (electrons, quarks), 1 (photon, gluons, W, Z). A massless spin-s wave's pattern repeats after turning 360°/s.
- `state`: One complete, definite way the string can be: which harmonics hold how many packets, pointing which way. From far away, each state looks like a particle.
- `hidden dimensions`: Extra directions of space superstring theory needs for consistency: six beyond our three. Often pictured tiny and curled up, but other options exist. Motion or wrapping there could set charges.

Referenced from other chapters, not redefined: `α′ (alpha-prime)` (Ch. 1, merged definition in `content/glossary.md`), `Standard Model`, `quark`, `gluon` (Ch. 1), `graviton` (Ch. 4, the drawer's ghost cell).

---

## Numbers & facts

**Musical strings and E = mc²**

- **fₙ = n f₁ and f₁ = (1/2L)√(T/μ)** (Mersenne's laws). Free–free ends have the same frequency ratios with cos mode shapes. Source: standard wave physics, https://en.wikipedia.org/wiki/String_vibration
- **Guitar A string = A2 = 110 Hz.** Its harmonics are 220, 330 and 440 Hz, and so on. Source: https://en.wikipedia.org/wiki/Standard_tuning
- **Concert A = 440 Hz** (ISO 16). Source: https://en.wikipedia.org/wiki/A440_(pitch_standard)
- **Guitar mass-gain estimate (own calculation from standard formulas):**
  - Inputs: scale length 0.648 m (25.5 in), A-string tension about 70 N, so μ = T/(2Lf)² ≈ 3.4×10⁻³ kg/m. Amplitude 2 mm.
  - Energy: E = ¼μLω²A² ≈ 1.1×10⁻³ J.
  - Mass gain: Δm = E/c² ≈ 1.2×10⁻²⁰ kg, quoted as "≈10⁻²⁰ kg".
  - Packets: E/(ħω) = 1.1×10⁻³ J ÷ (1.055×10⁻³⁴ J·s × 2π × 110 s⁻¹ = 7.3×10⁻³² J) ≈ 1.5×10²⁸, quoted as "~10²⁸". A guitar string is quantized too; its packets are just far too small to notice.
  - Scale length source: https://en.wikipedia.org/wiki/Scale_length_(string_instruments)
- **E = mc²:** Einstein, Annalen der Physik 18, 639 (1905). https://en.wikipedia.org/wiki/Mass%E2%80%93energy_equivalence

**The string spectrum**

- **17 fundamental particles in the Standard Model** (6 quarks, 6 leptons, 4 gauge bosons, 1 Higgs). Source: https://en.wikipedia.org/wiki/Standard_Model
- **Open superstring spectrum α′M² = 0, 1, 2, …** after the GSO projection. The massless level is 8 bosonic + 8 fermionic states: a 10D vector plus a Majorana–Weyl spinor. Sources: Polchinski, *String Theory* Vol. II, Ch. 10; Zwiebach, *A First Course in String Theory* (2nd ed.), superstring chapter.
- **First massive level: m² = 1/α′, with 44 + 84 bosonic and 128 fermionic states (256 total)**: a massive spin-2 supermultiplet of SO(9), with a symmetric traceless tensor (44), a 3-form (84) and a spin-3/2 field (128). Source: Berkovits & Chandia, JHEP 08 (2002) 040, https://arxiv.org/abs/hep-th/0204121 ("128 bosonic and 128 fermionic degrees of freedom"). It is also reproduced by the D(N) computation below.
- **State counts D(N) = 16, 256, 2,304, 15,360, 84,224, …** Own computation from the GSO-projected NS partition function ½q^(−1/2)[∏(1+q^(n−½))⁸ − ∏(1−q^(n−½))⁸]/∏(1−qⁿ)⁸, doubled for supersymmetry. It reproduces the known 8, 128, 1152, 7680 bosonic counts. *Referee check:* recomputed independently for all N = 0…63, and every entry of the `D` array matches to its 3 significant figures. The Ramond count 8∏[(1+qⁿ)/(1−qⁿ)]⁸ equals the NS count level by level, so doubling is exact.
- **Closed superstring M² = 4N/α′ with level matching.** Bosonic open string M² = (N−1)/α′ (for comparison). Sources: Polchinski Vol. II, Ch. 10 (superstring); Tong, *Lectures on String Theory*, https://arxiv.org/abs/0908.0333, §2.2–2.3 and §3.1 (bosonic closed and open formulas only; Tong does not derive the superstring mass formula).
- **Tension T = 1/(2πα′).** Source: Tong, arXiv:0908.0333; Zwiebach.
- **Leading Regge trajectory J = α′M² + 1 (open string).** A rotating classical open string has E = (π/2)T₀ℓ ∝ length, ω = 2c/ℓ and J = α′E² (ħ = c = 1; re-derived numerically by the referee). Source: Zwiebach, *A First Course in String Theory*: the rotating open-string solution is in Ch. 7 ("String parameterization and classical motion"), and J = α′E² is in Ch. 8, §8.6 "The slope parameter α′". Numbering follows the MIT OCW 8.251 reading list: https://ocw.mit.edu/courses/8-251-string-theory-for-undergraduates-spring-2007/pages/readings
- **Free (Neumann) open-string endpoints move at the speed of light (classical result).** Source: Zwiebach, Ch. 6, §6.9 "Motion of open string endpoints" (per the same OCW list); Zwiebach CERN lectures (2007), slide "The endpoints of a free relativistic open string move with the speed of light", https://indico.cern.ch/event/431029/attachments/932432/1320771/cern_07_01.pdf
- **Open-string mode expansion Xⁱ = xⁱ + 2α′pⁱτ + i√(2α′) Σ_{n≠0} (αₙⁱ/n) e^(−inτ) cos nσ, σ ∈ [0, π],** hence amplitude ∝ √(k/n). Source: Tong, arXiv:0908.0333, §3, eq. (3.4) with Neumann condition αₙ = α̃ₙ (closed-string light-cone quantization is §2.2).
- **Hadron Regge slope α′ ≈ 0.9 GeV⁻²** (ρ trajectory 0.87 ± 0.06 GeV⁻²). Sources: https://arxiv.org/abs/1403.2790; https://en.wikipedia.org/wiki/Regge_theory
- **History:** Veneziano amplitude 1968 (Nuovo Cim. A57, 190). String interpretation by Nambu, Nielsen and Susskind (1969–70). Sources: https://en.wikipedia.org/wiki/Dual_resonance_model; https://arxiv.org/abs/0802.3249

**The string scale and experiment**

- **Weakly coupled heterotic string: Λ_H ≈ 0.216 g M_Pl ≈ g × 5.27×10¹⁷ GeV** (Kaplunovsky's string unification scale). For g ≈ 0.7–1 this is ≈ 3.7–5.3 × 10¹⁷ GeV, 23–33 times below the Planck energy: the basis for "traditional estimates ~10¹⁸ GeV" (order of magnitude; conventions shift it by factors of a few, as Chapter 10's pack details). Λ_H is not literally 1/√α′, and normalization conventions differ by O(1) factors. Sources: Kaplunovsky, Nucl. Phys. B307, 145 (1988); Erratum B382, 436 (1992), https://arxiv.org/abs/hep-th/9205068; review: Dienes, https://arxiv.org/abs/hep-th/9602045
- **Assumed M_s = 10¹⁸ GeV** for every GeV readout (editor's change from 10¹⁷ GeV so the site uses one fiducial; see Editor notes), and the resulting unit conversions (own calculations):
  - ℓ_s = ħc/M_s ≈ 2×10⁻³⁴ m, using ħc = 197.327 MeV·fm. This matches Chapter 1's drawn length ("near 10⁻³⁴ m") and lies inside Chapter 10's traditional band (10⁻³⁵–10⁻³³ m). Source: CODATA, https://physics.nist.gov/cgi-bin/cuu/Value?hbcmevf
  - f = E/h = 10²⁷ eV / 4.1357×10⁻¹⁵ eV·s ≈ 2.4×10⁴¹ Hz, which is log₂(2.4×10⁴¹/110) ≈ 130.7, so about 131 octaves above 110 Hz.
  - Hadronic slope / fundamental slope: 0.9 GeV⁻² ÷ 10⁻³⁶ GeV⁻² ≈ 10³⁶.
- **LHC collision energy 13.6 TeV** (Run 3, July 2022 – 27 June 2026). The LHC has been in Long Shutdown 3 since 29 June 2026; High-Luminosity LHC beams are expected around 2030. Sources: https://home.cern/science/accelerators/large-hadron-collider; https://home.cern/cern-bids-farewell-to-the-lhc-and-enters-long-shutdown-3/
- **LHC resolution ~ ħc/(1 TeV) ≈ 2×10⁻¹⁹ m** (own estimate). Its ratio to ℓ_s is about 10¹⁵.
- **M_s / 13.6 TeV ≈ 7×10¹³** and **M_s / m_top ≈ 6×10¹⁵** (own calculation, assumed M_s).
- **CMS: string resonances excluded below 7.9 TeV** (95% CL, 137 fb⁻¹; relevant only to low-string-scale models). The exact wording in the paper's summary is "7.9 TeV for string resonances". Source: CMS, JHEP 05 (2020) 033, https://arxiv.org/abs/1911.03947. *Referee check (Sept 2026):* no newer published string-resonance limit was found. Recheck for a full-Run-3 inclusive dijet paper before launch.

**Measured particle masses**

- **PDG 2026** (F. Takahashi et al., Int. J. Mod. Phys. A 41, 2630011 (2026)), summary tables https://pdg.lbl.gov/2026/tables/contents_tables.html. These supersede the PDG 2024 values used in the draft:

  | Particle | Mass |
  |---|---|
  | electron | 0.51099895 MeV |
  | muon | 105.6583755 MeV |
  | tau | 1776.93 MeV |
  | up | 2.16 MeV |
  | down | 4.70 MeV |
  | strange | 92.9 MeV |
  | charm | 1.2729 GeV |
  | bottom | 4.186 GeV |
  | top | 172.60 GeV (direct measurements) |
  | W | 80.3625 GeV (excludes CDF 2022) |
  | Z | 91.1879 GeV |
  | Higgs | 125.13 GeV |
  | photon | < 1×10⁻¹⁸ eV |
  | gluon | 0 (theoretical) |
  | graviton | < 1.76×10⁻²³ eV |

- **Neutrino mass < 0.45 eV** (90% CL, direct, on the effective electron-antineutrino mass), KATRIN, Science 388, 180 (2025), https://doi.org/10.1126/science.adq9592 (arXiv:2406.13516). PDG 2026 lists this value. Each mass state is < √(0.45² + 2.5×10⁻³) eV ≈ 0.453 eV. Oscillations require at least one mass ≥ √Δm²_atm ≈ 0.05 eV.
- **The m/M_s column** of the particle table is own arithmetic: PDG mass ÷ 10¹⁸ GeV.

**Constructions and design constants**

- **Semi-realistic constructions:**
  - Braun–He–Ovrut–Pantev: exact MSSM spectrum from a heterotic string, JHEP 05 (2006) 043, https://arxiv.org/abs/hep-th/0512177
  - Anderson–Gray–Lukas–Palti: over 200 heterotic standard models, Phys. Rev. D 84, 106005 (2011), https://arxiv.org/abs/1106.4804
  - Cvetič–Halverson–Lin–Liu–Tian: O(10¹⁵) F-theory compactifications with the exact chiral spectrum of the Standard Model, PRL 123, 101601 (2019), https://arxiv.org/abs/1903.00009
- **Families ↔ topology** (number of generations = |χ|/2 in the simplest heterotic Calabi–Yau compactifications): Candelas, Horowitz, Strominger & Witten, Nucl. Phys. B258, 46 (1985).
- **Design constants, not facts:** A_q = 0.12 L, w = 0.15, the ω₁ used for visual time, the jitter amplitude, the 10→4 px point cross-fade and 110 Hz as the audio fundamental.

---

## Pitfalls

1. **"Each particle is a different note of the string (the electron is one harmonic, a quark another)."**
   - *Reality:* every known elementary particle would sit on the massless bottom rung. A single packet in any harmonic lifts the string to rung 1 or higher, at or above the string scale: roughly 10¹⁶ times heavier than the top quark (about 6 × 10¹⁵ at rung 1) if M_s ≈ 10¹⁸ GeV.
   - *How the pack avoids it:* no harmonic is ever labelled with a Standard Model particle. Beat 5 piles all seventeen onto rung 0. The particle drawer puts everything at N = 0. The sound caption says "the pattern, not the mass".
2. **"Mass is like pitch: double the frequency, double the mass."**
   - *Reality:* mass-squared, not mass, rises in equal steps (M² = N/α′).
   - *How the pack avoids it:* the ladder's default M² axis, the `M` toggle where rungs crowd, and the heuristic in Go deeper.
3. **"String-theory strings are tiny guitar strings pinned at both ends."**
   - *Reality:* free open-string ends are not pinned; classically, they move at light speed. Closed strings have no ends. Pinned directions exist only where strings end on branes (Chapter 7).
   - *How the pack avoids it:* Beat 2 removes the pegs and switches to cos modes. The bench defaults to `FREE`, and `PINNED` is explicitly labelled *guitar, classical*.
4. **"The drawing shows the string's real shape and length."**
   - *Reality:* the drawing is a graph of displacement against position along the string. A quantum string's size is set by its own fluctuations.
   - *How the pack avoids it:* the graph-view ANALOGY caption, and the honest jitter note in the Model.
5. **"The lowest state is a string sitting perfectly still."**
   - *Reality:* the bottom rung still has quantum jitter. It is massless because of an exact balance, not because nothing happens.
   - *How the pack avoids it:* the shimmer at N = 0, its ANALOGY caption, and the explanation in Go deeper.
6. **"Each rung is one particle."**
   - *Reality:* rungs hold huge numbers of states: 16, 256, 2,304, … (10D counts).
   - *How the pack avoids it:* the "+N more states" tags in Beat 5, and the `STATES ON THIS RUNG` readout ("the bench shows one").
7. **"Spin is just the string rotating like a top."**
   - *Reality:* only partly. Integer spin comes from how vector-like vibration packets line up. Spin-½ (electrons, quarks) comes from the string's fermionic side and has no classical picture.
   - *How the pack avoids it:* swirl ↔ spin is flagged ANALOGY, the spin-½ footnote appears in Beat 3 and on card F, and the spin readout follows K + 1.
8. **"Charge comes from the vibration pattern you can see."**
   - *Reality:* charges come from motion or wrapping in hidden dimensions, from where open-string ends attach, or from internal degrees of freedom.
   - *How the pack avoids it:* the bench shows `CHARGE —` with "needs hidden dimensions", and Beat 6 explains the mechanisms with chapter pointers.
9. **"String theory explains or predicts the Standard Model's masses."**
   - *Reality:* explicit constructions reproduce the Standard Model's forces and three families (from about 200 heterotic models to about 10¹⁵ F-theory models). None yet predicts the measured masses or couplings, and nothing currently selects one construction.
   - *How the pack avoids it:* Beat 6 text, the `STRING-THEORY PREDICTION: —` column and the card footers.
10. **"Known particles are exactly massless in string theory."**
    - *Reality:* they are massless *on the string scale*. Their measured masses would arise at much lower energies, for example through the Higgs mechanism. Why the Higgs is so light is an open problem.
    - *How the pack avoids it:* Beat 5 text and cards W and H.
11. **"The universe is a symphony; strings make sound."**
    - *Reality:* there is no medium and no audible pitch. By E = hf, rung 1 would correspond to about 10⁴¹ Hz if M_s ≈ 10¹⁸ GeV.
    - *How the pack avoids it:* sound is muted by default, the transposition caption is shown, and the "pattern, not mass" line stays with the audio.
12. **"We've seen strings" or "the string scale is known."**
    - *Reality:* neither is true. The string scale is unknown; traditional estimates put it near 10¹⁸ GeV. LHC searches only exclude the simplest low-scale models below 7.9 TeV.
    - *How the pack avoids it:* SPECULATIVE chips on every GeV value, and an "assumes / unknown" note wherever 10¹⁸ GeV appears.
13. **"The superstring's bottom rung is just the particles we know."**
    - *Reality:* in 10D the open-string bottom rung is only a spin-1 state and its spin-½ superpartner (8 + 8 states). The variety we see (spins 1, ½, 0; charges; families) would come from squeezing these into four visible dimensions, multiplied by brane labels (Chan–Paton factors) or, in heterotic strings, internal degrees of freedom. That is how 16 states become the Standard Model's 100-plus. Superstring rungs also pair bosons with fermions, and no superpartners have been observed, so that symmetry would have to be broken.
    - *How the pack avoids it:* the Higgs card ("a wiggle pointing into hidden dimensions"), the families card, and the rung-0 tag in Beat 5 that rewrites itself to `16 = ONE OPEN STRING IN FLAT 10D · BRANES + HIDDEN DIMENSIONS MULTIPLY THIS`. Supersymmetry breaking is left to later chapters; superpartners are neither found nor guaranteed at any collider.

---

## Handoff

**IN (from 01 `scale-down`), canonical pose H1:**

- *First frame:* the registry H1, `<HandoffOpenString/>` with default props at the origin, camera at `HANDOFF.camera`, no view shift: one horizontal open string of length 4.2 world units (0.666 of the viewport height), a blend of free-end modes 1 and 2 (≈ 3% and 1.7% of its length), ω = 2.2 rad/s. This is exactly Chapter 1's last frame (checked against `01-scale-down.md` Handoff OUT). The scale gauge continues Chapter 1's reading, `~10⁻³⁴ m · HYPOTHETICAL`.
- *Mode shape:* H1 uses free (cos) ends, so Beat 1 morphs it to the pinned arch while the pegs arrive.
- *Continuity:* the seventeen particle rings fade in only after the dissolve completes, so the cross-dissolve reads as one continuous object.

**OUT (to 03 `worldsheet`), canonical pose H0:**

- *Exit sequence:* after the Lab, the bench string relaxes to its bottom-rung shimmer (1.2 s ease) and returns to up-down polarization and the default camera. The Beat-4 pull-back replays and the string shrinks to a sub-pixel glow, then cross-fades to the point sprite.
- *Last frame:* **H0**, `<HandoffPoint/>` with default props at the origin, camera at `HANDOFF.camera`, no view shift: a single Ink-white point of light at screen centre with no label card. The scale gauge reads `FAR AWAY`.
- *Why H0:* the chapter's aha (a string seen from far away is a point) is its last image. Chapter 3 now opens on this H0 and unfolds it back into H1 before drawing worldlines and worldsheets (checked against `03-worldsheet.md` Handoff IN).

---

## Referee notes

Refereed 2026-09-28. Every number, formula and reference was rechecked against primary sources or recomputed. The physics core holds up: the mass formula, level counting, Regge intercept, mode shapes, node counts, the full `D` array, all five pluck test vectors, the guitar estimate, the unit conversions and the m/M_s column all check out. The corrections were:

**Physics and misconceptions**

1. **Beat 5: 17 particles on a 16-state rung.** The rung-0 tag read `+15 MORE STATES` while seventeen glyphs piled onto it, which invites "17 > 16?". The tag now rewrites to explain that 16 counts one open string in flat 10D, and that branes and hidden dimensions multiply it. Pitfall 13 now covers Chan–Paton and heterotic internal degrees of freedom.
2. **Particles drawer gave spin-1 particles different wiggles** (photon = SWIRL, W/Z = UP-DOWN). That quietly teaches "a different vibration pattern = a different particle", the chapter's main pitfall. All spin-1 cells now share the same bottom-rung state; they differ in charges, which are not modelled.
3. **The graviton hover was unspecified.** It would have put the *open* bench string on "the graviton". Hovering it now leaves the bench unchanged and shows a closed-loop glyph (`CLOSED STRING · CH. 4`).
4. **Card N: "Only an upper limit is measured"** was false, because oscillations prove neutrinos have mass (at least one ≥ 0.05 eV). The card is rewritten, and a † footnote explains that KATRIN bounds the effective νₑ mass. The limit applies to every mass state to within 0.003 eV; the drafter's "~0.05 eV" overstated the slack.
5. **Beat 3 "corkscrew"** was wrong for a single harmonic, which turns rigidly like a skipping rope with no twist. Added a real-space (y–z) inset and a Model note: the swirling k₁ = 1 state *is* the classical rotating rod behind J = α′E². This makes the spin–Regge link concrete.
6. **Free endpoints at light speed** is a classical Nambu–Goto result. The Beat 2 note and Pitfall 3 now say "classically".
7. **Glossary `hidden dimensions`** implied they must be tiny. It now says "often pictured curled up… other options exist (Ch. 5, 7)" and "needs for consistency". **`string scale`** no longer states "far beyond any collider" as fact.
8. **Beat 6 status** had no chip for "whether any construction is our universe". Added ○ SPECULATIVE. Copy 1 of the Thread now closes into a loop before wrapping, because winding needs a closed string.
9. **Thesis:** "is a point" became "looks like a point".

**Formulas and conventions**

10. **Model §3 mode expansion** was missing the factor i, the n ≠ 0 range and σ ∈ [0, π]. It now matches Tong eq. (3.4) with αₙ = α̃ₙ.
11. **Model §7:** J_max(state) = K + 1 is *exact* for the bench's states ∏(α₋ₙ)^{kₙ}ψ₋₁/₂|0⟩, not a rough simplification (flagged item 4). J_max(rung) = N + 1 was checked against states with extra ψ's. Also added how the N = 0 polarization is drawn (compass only).
12. **Go deeper:** closed strings now say "equal left/right levels"; "the clue that started string theory" became "one of the clues".
13. **Swirl micro-copy** said "up to K+1", but the Model gives exactly ±(K+1) along the axis. Fixed.

**Numbers, dates and sources**

14. **PDG 2024 → PDG 2026** (IJMPA 41, 2630011): s 92.9 MeV, c 1.2729 GeV, b 4.186 GeV, t 172.60 GeV, W 80.3625 GeV, Z 91.1879 GeV, H 125.13 GeV, graviton < 1.76×10⁻²³ eV. m/M_s for s is now 9.3×10⁻¹⁹; the others are unchanged at 2 significant figures.
15. **First-massive-level source:** arXiv:2211.13689 does not state the 10D 44 + 84 + 128 count; it works in 4D. Replaced with Berkovits & Chandia, hep-th/0204121, which does.
16. **Tong citations:** the open-string expansion is in §3, not §2. Tong gives no superstring mass formula, so the closed-superstring claim now cites Polchinski Vol. II, Ch. 10.
17. **Zwiebach citations (flagged item 1):** the rotating open string is Ch. 7 and J = α′E² is §8.6, so "Chs. 6 and 8" left out Ch. 7. Endpoints at c is §6.9. Numbering was checked against MIT OCW 8.251 (1st-ed. numbering) and the CERN 2007 slides.
18. **Kaplunovsky:** the prefactor is 5.27 (Λ_H ≈ 0.216 g M_Pl). Added the erratum volume and Dienes' review, and noted that Λ_H is not literally 1/√α′.
19. **LHC:** Run 3 ended 27 June 2026, and Long Shutdown 3 runs to about 2030. **CMS 7.9 TeV** was confirmed in the text of arXiv:1911.03947, and no newer string-resonance limit was found as of September 2026; recheck before launch.
20. **Guitar:** added the packet count, about 1.5×10²⁸ per pluck, and put it in the `PINNED` micro-copy. "Classical, any amplitude" had implied that guitar strings are not quantized.
21. **Far-view threshold:** "below 6 px" (Beat 4, Lab) disagreed with the Model's 10→4 px cross-fade. Harmonized.
22. **Model §5:** documented the two near-threshold test-vector values (0.556, 0.546), both stable across integration resolutions.

**Checked and left as is:** the flagged M² heuristic (sound, and labelled); the Higgs "in some models" card; the gluon/U(3) deferral; the LHC ~10⁻¹⁹ m resolution; the 5–10× jitter reduction; AGLP "over 200" (the abstract's wording); Cvetič et al. O(10¹⁵); α′_ρ = 0.87 ± 0.06 GeV⁻² (in arXiv:1403.2790); KATRIN Science 388, 180. Beat text is ≤ 45 words (two beats at exactly 45) and all micro-copy is ≤ 20 words.

## Editor notes (cross-chapter pass, 2026-09-28)

These edits align this pack with Chapters 1, 3, 7 and 10. The referee corrections above are untouched. Where a referee note quotes an old number (10¹⁷ GeV, 10⁻³³ m, 127 octaves), the body text now supersedes it.

1. **Handoff IN matched to the registry.** The H1 description ("55% of the width, 4% amplitude, fundamental only") contradicted `src/core/handoff.ts` and Chapter 1's final frame. Progress 0 is now `<HandoffOpenString/>` at `HANDOFF.camera`, easing to this chapter's own camera and 6-unit bench. The "if Chapter 1 uses sin" branch is gone: H1 is free-ended, so Beat 1 always morphs `basis` 1 → 0. This closes Chapter 1's referee open item (a).
2. **One string-scale fiducial for the whole site.** Chapter 1 draws the string near 10⁻³⁴ m, and Chapter 10's traditional band and glossary put the string scale ten to thirty times below the Planck energy. This pack's old M_s = 10¹⁷ GeV (ℓ_s ≈ 2 × 10⁻³³ m) sat outside both, and the gauge jumped by a factor of ten at the Chapter 1 → 2 dissolve. The assumption is now **M_s = 10¹⁸ GeV** (ℓ_s ≈ 2 × 10⁻³⁴ m), still Kaplunovsky's 3.7–5.3 × 10¹⁷ GeV to order of magnitude. Every dependent number was recomputed:
   - the m/M_s column (÷ 10), and the log strip, now 10⁻²⁸ … 10⁻¹⁵;
   - the neutrino arrow, now < 4.5 × 10⁻²⁸;
   - rung 1 ≈ 6 × 10¹⁵ × m_top, and M_s / 13.6 TeV ≈ 7 × 10¹³;
   - the LHC-resolution ratio and slider tick, now 10¹⁵, with the slider range 10⁰–10¹⁶;
   - the Beat 4 zoom, now 10^(−15u) from ~10⁻³⁴ m;
   - pitch: 10²⁷ eV / h ≈ 2.4 × 10⁴¹ Hz, which is 130.7, so about 131 octaves above 110 Hz;
   - hadronic / fundamental α′ ≈ 0.9 GeV⁻² ÷ 10⁻³⁶ GeV⁻² ≈ 10³⁶.

   "Often estimated ~10¹⁷ GeV" is now "traditional estimates ~10¹⁸ GeV". Chapter 7's lab option was changed to match.
3. **Handoff OUT is explicitly H0**, and Chapter 3's IN now opens on H0. This fixes a broken handoff: Chapter 3 had expected H1.
4. **Opening text** now says Chapter 1 ended on a *proposal*, not a question. Chapter 1's last beat is the reveal. Still 36 words.
5. **Glossary.** `α′` moved to Chapter 1, where it is first explained; here it is referenced. `superstring` was added, because Chapters 3 and 5 use it in beat text and it had no definition. `spin` and `polarization` now carry the merged definitions (Chapter 4 references them). `string scale` was harmonised with Chapter 10.
6. **Glossary length.** `hidden dimensions` (was 42 words) trimmed to the 30-word limit (ARCHITECTURE §3) without changing its claims.
