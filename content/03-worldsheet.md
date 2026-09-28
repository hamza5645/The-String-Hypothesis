# 03 · Worldsheets — What does a string do as it moves through time?

**Thesis.** In string theory, a string's history through time is a surface: a ribbon for an open string, a tube for a closed one. Its area sets the action, and interactions are smooth surfaces with no special point where they happen.
**Chapter chip:** `DERIVED` ◑ (visuals flagged `ANALOGY` ~ throughout: one space dimension hidden, not to scale, time drawn as a direction)

---

## Storyboard

### Stage conventions (apply to every beat)

- **Axes.** three.js `+Y` = time, drawn as `ct`. World `X` and `Z` are the two space directions we keep (physics `x`, `y`). One of the three space dimensions is hidden. **1 world unit = 1 ℓ** (a string-scale unit, *not to scale*). Time and space share units, so anything moving at light speed draws a line at exactly **45°**.
- **Materials.** Only the string *at the current moment* glows warm: a `--filament` line (#FFC98A, core #FFF6E8). A worldsheet is history, which is geometry, so it uses `--field` (#86A8D8). It is a translucent film (opacity 0.10–0.18, fresnel rim 0.35) with hairline iso-lines: constant-time rings every 0.5 units and along-string lines every 1/16 of the string. This follows VISION: the grid *becomes* the worldsheet. Worldlines are 1px Field hairlines. Point particles are the point-of-light sprite (#FFF6E8). Markers are Field hairline crosshair-rings with IBM Plex Mono labels.
- **Floor.** Field grid, 10×10 units, 1-unit cells, opacity 0.12, radial fade. **Time axis:** a hairline arrow at world (−5, 0→10, −5) with ticks every unit and the mono label `ct [ℓ] ↑`.
- **Light-cone glyph.** A hairline double cone with a 45° half-angle, 1.2 units tall, labelled `LIGHT · 45°`. It is reused in several beats.
- **Scale gauge (left edge).** Reads `≈ ℓs · STRING LENGTH (UNKNOWN)`, with a secondary line `~10⁻³⁵ m if near the Planck length` and a SPECULATIVE ○ chip.
- **Budget.** The pants mesh is ≤ 60k triangles and the helicoid ≤ 32k. The loupes in Beat 3 are **scissored second viewports**, not render targets (VISION §6 allows render targets only during transitions). Total draw calls ≈ 30.
- **Reduced motion.** Every auto-animation below becomes a 3-step cross-fade between key states. Nothing loops on its own.
- **Mobile.** Where a beat shows two histories side by side, show one at a time with a two-state toggle `PARTICLES | STRINGS` pinned under the beat text.

Suggested scroll lengths: Opening 100vh · B1 150vh · B2 120vh · B3 150vh · **B4 250vh** · B5 150vh · B6 130vh.

---

### Opening — "Stack the moments"

- **Text:** Draw time pointing up and hide one direction of space. A point particle moving through time then traces a line, its [[worldline]]. No worldline can lean past 45°, the tilt of light. So what does a string trace?
- **Status:** `OBSERVED` ● · `ANALOGY` ~ *(tooltip: "Worldlines are standard relativity. One space dimension is hidden so that time can be drawn upward.")*
- **Stage:**
  - **First frame = H1.** The Thread lies horizontal at screen center, gently vibrating in its fundamental mode against the void. The side-on camera matches Chapter 2's last frame. *Fallback:* if Chapter 2 ends on H0, spend progress 0–0.1 unfolding the point into H1.
  - **0 → 0.4.** The camera dollies back 2× and pitches down 20°. A Field floor grid fades in beneath the Thread, which settles onto the floor: it now lies *in space*. The vertical time axis draws itself upward from the back-left corner, ticks appearing one by one.
  - **0.4 → 0.75.** A point of light (the H0 echo) appears at world X = −3.5 and drifts toward +X at 0.3c. As it moves, 12 translucent "film-frame" copies of it stack upward at equal time steps. They then fuse into one continuous Field hairline: its worldline, slanted about 17° from vertical (arctan 0.3). A second point at rest beside it draws a vertical line.
  - **0.75 → 1.** The light-cone glyph fades in at the moving particle's current event. Its worldline sits visibly inside the cone. Throughout, the Thread keeps vibrating at right, dimmed to 60%, and has not yet moved in time.

### Beat 1 — "A line sweeps a surface"

- **Text:** A string is a tiny line, so its history is a surface: its [[worldsheet]]. An open string, with two free ends, sweeps a ribbon; here it spins, and its ends move at exactly light speed. A closed loop has no ends. It sweeps a tube.
- **Status:** `DERIVED` ◑ · `ANALOGY` ~ *(tooltip: "The spinning ribbon is an exact solution of the string's equations. The loop's gentle wobble is a cartoon.")*
- **Stage:**
  - The Thread's vibration eases to zero over the first 15% of progress while it begins to rotate in the floor plane about its midpoint. The ramp-up is a cartoon, hidden by the camera move. After it the motion is the exact rigidly rotating open string: world position `P(s, t) = (s·cos(t/r₀), t, s·sin(t/r₀))` with `s ∈ [−r₀, r₀]` and `r₀ = 1`. The endpoints circle at radius 1, turning 1 rad per unit of ct, so their speed is exactly c.
  - As the "present" climbs from ct = 0 to ct = 8, the string leaves a **helicoid ribbon** (64 × 256 grid) in Field film. Its two edges, the endpoint worldlines, are brighter Field hairlines. They are helices that lean at exactly 45° everywhere.
  - The light-cone glyph from the Opening snaps onto one endpoint and rides up with it: the edge slides along the cone's surface. A mono tag reads `ENDPOINT · v = c`.
  - At progress 0.55 a closed loop (radius 1) appears at world X = +3.5 and rises, sweeping a **tube**. Its radius breathes by ±5%, as `r(t) = 1 + 0.05·sin(2.1 t)` (cartoon).
  - Pills appear at the tops: `OPEN · RIBBON` and `CLOSED · TUBE`. The camera orbits slowly in 3/4 view, from −20° to +15° of yaw, with the target at (0, 4, 0).

### Beat 2 — "Nature's rule: area"

- **Text:** What picks the real history? For a free particle, the action tracks proper time, and the straight worldline, which has the most, wins. String theory's founding rule, the [[Nambu–Goto action]], trades length for area: S = −T·A, tension times worldsheet area.
- **Status:** `DERIVED` ◑ *(tooltip: "The particle rule is tested relativity. The area rule is string theory's starting assumption; everything else in this chapter follows from it.")*
- **Stage:**
  - **Left (particle).** Two events A = (−3.5, 0, 0) and B = (−3.5, 8, 0) are marked with Field rings. The straight worldline between them carries proper-time ticks every 0.8 units: **10 ticks**, with readout `τ = 8.0`. A ghost detour then fades in: out at 0.6c for 4 units of ct, then back at 0.6c. It carries only **8 ticks**, readout `τ = 6.4` (γ = 1.25). Then the ghost fades out.
  - **Right (string).** The helicoid from Beat 1. A KaTeX card `S = −T · A` docks top-right.
    - Term `T` pulses in sync with a brief brightening of the ribbon's edges ("tension").
    - Term `A` highlights while a slightly brighter Field fill sweeps up the ribbon from bottom to top, as if measuring its area.
  - **Nudge.** A ghost copy of the ribbon wobbles slightly off the real one, bulging with amplitude ε. A mono caption reads `NUDGE IT: AREA CHANGES ONLY AT ORDER ε²`, which is what *stationary* means. We never say "minimal" (see Pitfalls).
  - The camera is static, framing both.

### Beat 3 — "The pants have no corner" *(setup for the aha)*

- **Text:** Strings interact by splitting and joining. One loop becomes two, and the history is a [[pair of pants]]. Particle worldlines meet at a sharp point, a vertex. Zoom into the pants: no corner, no seam. Every patch looks like a string simply moving.
- **Status:** `DERIVED` ◑ · `ANALOGY` ~ *(tooltip: "Smooth, with no special point: true of the surfaces string calculations use. The exact shape drawn is a cartoon, since the theory sums over all such shapes.")*
- **Stage:**
  - The scene resets. **Left, at world X = −5.5:** a particle "Y". One worldline at rest splits at the vertex event (0, 5.33) into two that move apart at ±0.45c. Points of light travel along the lines.
  - **Right, at world X = +3:** the **pants**, the implicit surface defined in Lab › Model: a waist tube (radius 1.44) at the bottom splitting into two legs (radius ≈ 1.18) at the top, with the legs separating along X. The Field film shows constant-time rings every 0.5, so the viewer can *see* the rings go from one loop to a figure-eight to two.
  - **The loupes (0.3 → 1).** Two circular loupes (hairline rings, radius 110px desktop / 80px mobile) open over the Y's vertex and the pants' crotch. Each renders the scene again in a scissored viewport, with camera distance divided by a zoom `z = 10^(3·p)` (×1 → ×1000). A mono zoom counter sits on each rim.
    - In the Y loupe, the corner stays a corner at every zoom: three straight hairlines meeting at fixed angles.
    - In the pants loupe, the crotch flattens into a smooth, featureless patch.
    - For zoom > 20×, render the loupe from the local analytic patch `ct = 5.327 + 1.522·x² − 0.482·y²` so that no mesh facets show.
  - At ×1000 a third loupe opens over an ordinary patch of the waist. A hairline bracket joins it to the crotch loupe, labelled `SAME`.

### Beat 4 — ★ "No single moment of splitting" *(the chapter's biggest aha)*

- **Text:** So where did it split? Slice the pants with a flat "now": one loop, then two. Tilt the slice, as motion tilts [[simultaneity]], and the pinch slides elsewhere. No point on the surface is special: the split is spread out.
- **Status:** `ANALOGY` ~ · `DERIVED` ◑ *(tooltip: "Drawn with time treated like space, as in string calculations. There, tilting the slicing moves the pinch exactly. For real observers it is a heuristic (see Go deeper).")*
- **Stage:**
  - **p 0 → 0.3, flat NOW.** Each history gets its own translucent **NOW plane**: a 7×4-unit rectangle in its own local coordinates, with a hairline border, a faint 0.5-unit grid, opacity 0.08 and the mono label `NOW`. Both planes rise together from ct = 3.5 to ct = 7.
    - Where each plane cuts a history, the string glows warm: the pants slice goes from one loop to a peanut, then a figure-eight at ct = 5.33, then two loops. The Y slice goes from one dot to two dots.
    - At the transition a crosshair-ring flashes at the pants' pinch point and at the Y's vertex, both labelled `SPLIT`.
  - **p 0.3 → 0.45, tilt.** Both planes tilt to θ = 30° about their centers, sloping upward toward +X (direction φ = 0). They sweep again.
    - The pants' pinch now appears at **(x, y, ct) = (+0.19, 0.00, 5.38)**, visibly off-center on the inner wall of one leg.
    - The Y's split is still at the vertex event (0, 0, 5.33).
    - A mono readout under each history reads `SPLIT SEEN AT x · y · ct`.
  - **p 0.45 → 1, every direction.** φ rotates from 0° to 360° while each plane runs quick mini-sweeps (t₀ oscillating ±0.4 around that slicing's split value). Each split leaves a small Field dot.
    - On the pants, the dots trace a **closed curve** around the crotch, roughly an oval with half-widths ≈ 0.19 ℓ in x and ≈ 0.57 ℓ in y (at θ = 30°). A faint Field wash fills it in: the "smear".
    - On the Y, every dot lands on the same point.
  - The camera slowly dollies in on the pants' smear and ends 3/4 above it.
  - Closing caption (mono, small): `SAME SURFACE FOR EVERYONE. DIFFERENT "SPLIT" POINTS.`
  - **The Lab (The Now-Slicer) unlocks at the end of this beat** and stays docked for the rest of the chapter.

### Beat 5 — "Why it matters"

- **Text:** Why it matters: particle calculations blow up where interaction points crowd together, the [[UV divergence]]s that defeat the standard approach to quantum gravity. String loops can't be squeezed to a point. Explicit calculations, through two loops, come out finite; arguments extend this to every order.
- **Status:** `DERIVED` ◑ *(tooltip: "Finite at one and two loops by explicit calculation. The all-order case is argued strongly, most recently via string field theory, but is not a complete theorem. It holds order by order; the full series doesn't converge.")*
- **Stage:**
  - **Left, a particle loop.** A worldline splits at event x and rejoins at event y, forming a lens-shaped "bubble" of two arcs. Scroll squeezes the bubble: x and y slide together until the loop collapses to a point. A hairline readout climbs `LOOP SIZE → 0 · CONTRIBUTION → ∞` (schematic, with an ANALOGY chip).
  - **Right, a string loop.** A tube splits and rejoins, leaving a hole (a "handle"). It uses the Lab's implicit Φ with `c(t) = 1.7·exp(−((t−5)/w)²)`, which opens a hole because 1.7 > 1.442. The squeeze drives `w` from 2.4 down to 1.5, where it **stops**: hairline clamp brackets press but the tubes keep their thickness (the hole stays ≈ 1.2 ℓ tall), and a mono tag reads `TUBES KEEP A STRING'S WIDTH`. With w ≥ 1.5 the legs separate at ≤ 0.97c, so nothing visibly outruns the light-cone glyph.
  - The scroll then drives `w` from 1.5 → 4.0: the loop stretches *long* instead. Caption: `THE ONLY WAY OUT: LONG TUBES, WHICH MEANS LONG-DISTANCE PHYSICS, WHICH IS WELL UNDERSTOOD.` This is a cartoon of the precise result, in which every degeneration of a string surface is a long tube (Sen & Zwiebach 2024, §9.7).

### Beat 6 — "Open strings can close" *(handoff out)*

- **Text:** Open strings can also close. If an open string's two ends meet, they can fuse into a loop. So any theory with open strings also contains [[closed string]]s. That matters: one vibration of a closed loop behaves like the graviton.
- **Status:** `DERIVED` ◑ · `ANALOGY` ~ *(tooltip: "Open implies closed, but not always the reverse: heterotic theories seem to have no open strings. The joining shape drawn is a cartoon.")*
- **Stage:**
  - A single history at center. An open string, a C-shaped arc of radius 1.2, rises. Its angular gap narrows as `g(t) = 2.4·√max(0, 1 − t/5)` rad, and the arc spans angles `[g/2, 2π − g/2]`.
  - Its two edge hairlines (the endpoint worldlines) curve toward each other and meet smoothly at ct = 5, like a zipper closing. Above that, the surface continues as a plain tube up to ct = 9. This is a cartoon: just before the join the drawn ends lean flatter than 45°, the same caveat as the pants' crotch (see Lab › Model 6). Real free ends move at exactly c. The warm current slice goes from a "C" arc to a closed ring. A mono tag at the meeting point reads `ENDS JOIN`.
  - **OUT (p 0.6 → 1).** The camera cranes up the tube and pitches until it looks straight down the time axis. The ring, which lies in the space plane, now faces the camera. Presence ramps fade the floor grid, the time axis and the worldsheet film to 0, leaving only the warm loop at screen center, gently wobbling. **Last frame = H2.**

---

## Lab

### The Now-Slicer

**Purpose.** Slice the same history with differently tilted "nows". Particles always split at one agreed event; a string's split point moves with the slicing.

**Placement.** The lab docks as a hairline instrument panel (glass, 1px borders, mono labels) at the end of Beat 4 and stays available through Beat 6. On desktop it sits bottom-right (360px wide). On mobile it is a bottom sheet (collapsed to its title bar by default).

#### Controls

| Control | Type | Range | Default | Units / notes |
|---|---|---|---|---|
| **History** | segmented | `PARTICLES` · `STRINGS` · `BOTH` | `BOTH` (≥1024px), `STRINGS` (mobile) | `BOTH` shows the Y at left and the pants at right, each with its own plane in local coordinates |
| **Now** (`t₀`) | slider + ▶ play | 1.0 – 9.0 | 3.0 | ct in ℓ. Play sweeps 1→9 in 8 s and loops until paused. Arrow keys step 0.05 |
| **Tilt of "now"** (`θ`) | slider | 0° – 35° | 0° | degrees. Readouts `v/c = tan θ` (0.00–0.70) and `like an observer moving at 0.00c` |
| **Direction of motion** (`φ`) | circular dial | 0° – 360° | 0° | degrees, measured from +x toward +y |
| **Mark splits** | toggle + `CLEAR` | on/off | on | leaves a dot at each distinct split point (dedupe radius 0.02 ℓ) |
| **Try every direction** | button | — | — | sets θ = 30° if θ < 5°, then animates φ through 0→360° in 6 s with mini-sweeps of t₀ around each split. Paints the smear |
| **Camera** | drag / pinch | yaw 360°, pitch 5°–80°, zoom 0.6×–2× | 3/4 view | presets `3/4`, `SIDE`, `TOP` |

#### What changes on screen

- **The NOW plane** rises with `t₀` and tilts with `θ, φ`. It is a translucent Field rectangle with a hairline grid, clipped to ct ∈ [0.3, 9.7].
- **The slice** is where the plane cuts the history, glowing warm (the string *now*):
  - on the pants: 1 loop → figure-eight → 2 loops;
  - on the Y: 1 dot → 2 dots.
- **The split marker** is a Field crosshair-ring at *this slicing's* split point. It shows faintly at all times and brightens (and pulses once) when `|t₀ − t₀*| < 0.03`.
  - Pants: the marker **moves** as θ or φ changes.
  - Y: it **never moves**.
- **Readouts** (mono, tabular digits):
  - `THIS "NOW" SEES: 1 LOOP | PINCHING | 2 LOOPS` (for particles: `1 PARTICLE | 2 PARTICLES`);
  - `SPLIT SEEN AT x = +0.23 · y = 0.00 · ct = 5.41`;
  - `v/c = tan θ = 0.70`.
- **Inset "This observer's movie"** (160×160px, top-left of the panel): a top-down view of the slice curve(s), animating as `t₀` plays. It shows what this observer would call "the string at this moment".
- **Trail**: dots accumulate. After *Try every direction*, the pants show a closed smear curve, and the Y shows a single dot.
- **Limit hint**: when θ hits 35°, a hint appears: `Tilts stop below 45°: no observer outruns light.`

#### Model (what drives the visualization)

**Units and dimensions.** All lengths are in ℓ (a string-scale unit; *not to scale*). Time is drawn as `ct` in the same unit, so light is at 45°. The diagram is 2+1-dimensional: one space dimension is hidden (ANALOGY).

**1. The pants surface (implicit).**

$$\Phi(x,y,t)=e^{-[(x-c(t))^2+y^2]}+e^{-[(x+c(t))^2+y^2]},\qquad \text{surface: }\Phi = L = 0.25,\ \text{inside: }\Phi>L$$
$$c(t)=1.2\,\big[1+\tanh\big((t-5)/1.6\big)\big],\qquad t\in[0,10]$$

- **Derived numbers** (checked numerically for this pack):

  | Quantity | Value |
  |---|---|
  | Waist radius (c → 0) | √ln 8 = **1.442** |
  | Late leg radius | ≈ √ln 4 = **1.18** |
  | Leg-center separation speed | ≤ **0.75c** |
  | Leg centers at t = 10 | ±2.395 |
  | Untilted pinch | exactly at **(0, 0, t\* = 5.327)**, where c(t\*) = √ln 8 |
  | c′(t\*) | 0.7195 |

- **Smoothness.** At the pinch, ∇Φ ≠ 0 (∂Φ/∂t = −2c·c′·L ≠ 0). The surface is therefore perfectly smooth there, with a horizontal tangent plane: a saddle.
- **Local shape near the crotch:** `ct ≈ 5.327 + 1.522·x² − 0.482·y²`. Equivalently, T_xx = 3.045 and T_yy = −0.964.
- **Mesh.** Run marching cubes on x ∈ [−4, 4], y ∈ [−1.8, 1.8], t ∈ [0, 10] with a cell size of 0.08 (101×46×126 samples). About 27k cells are crossed, giving ≈ 54k triangles. A cell size of 0.0625 would give ≈ 88k, over the per-surface target. Bake it at build time to a binary buffer (preferred) or run it in a worker at load. Take normals analytically from ∇Φ, using `dc/dt = (1.2/1.6)·sech²((t−5)/1.6)`. Fade alpha to 0 over t ∈ [0, 0.6] and [9.4, 10], so the tubes read as continuing.

**2. The slicing plane ("now").**

$$h(x,y,t)=t-t_0-\tan\theta\,(x\cos\varphi+y\sin\varphi)$$

The slice is the set of surface points where h = 0.
- **Shader glow:** `I = exp(−(h/0.025)²)`, mixed toward Filament.
- **CPU:** run marching triangles on the mesh when a control changes (not per frame). This gives the polylines for the inset and the loop count (the number of connected components).
- **Physics tie-in:** in a real spacetime diagram, a moving observer's line of simultaneity has slope `v/c`. Hence the readout `v/c = tan θ`, capped at 35° → 0.70c, safely below 45°.

**3. The split point for a given slicing (the key computation).** Topology changes only where the plane is tangent to the surface: a critical point of h restricted to the surface (Morse theory). Near the crotch the surface is a graph `t = T(x, y)`. Obtain T by bisection of Φ(x, y, T) = L on T ∈ [3, 8] (40 iterations); Φ decreases monotonically in t there. The tangency condition is then:

$$\partial_x T = \tan\theta\cos\varphi,\qquad \partial_y T=\tan\theta\sin\varphi$$

- **Solve.** Use 2D Newton with central differences (h = 10⁻³), starting at (0, 0). 8 iterations converge for θ ≤ 35°.
- **Precompute.** Build a lookup table for θ ∈ {0°, 0.5°, …, 35°} × φ ∈ {0°, 5°, …, 355°} at load and interpolate bilinearly.
- **Outputs.** The split event is `(x*, y*, T(x*, y*))`. The plane offset at which it happens is `t₀* = T(x*, y*) − tanθ·(x* cosφ + y* sinφ)`.
- **Small-tilt closed form** (≤ 8% error at 35°): `x* ≈ tanθ·cosφ / 3.045`, `y* ≈ −tanθ·sinφ / 0.964`.
- **Verified values:**

  | θ | φ | split event (x, y, ct) | t₀* |
  |---|---|---|---|
  | 0° | — | (0, 0, 5.327) | 5.327 |
  | 30° | 0° | (+0.190, 0, 5.382) | 5.272 |
  | 30° | 90° | (0, −0.568, 5.168) | 5.496 |
  | 35° | 0° | (+0.232, 0, 5.409) | 5.246 |
  | 35° | 90° | (0, −0.668, 5.104) | 5.572 |
  | 35° | 45° | (+0.183, −0.473, 5.263) | 5.407 |

- **Uniqueness.** Away from the crotch, the leg walls are never flatter than slope 1/0.75 = 1.33. So for tan θ ≤ 0.70 the crotch is the *only* place the plane can be tangent, and each slicing sees exactly one split. A numerical scan of t₀ ∈ [1.5, 8.5] confirmed a single 1→2 change for every tilt tested.

**4. The particle "Y".** The incoming worldline is (0, 0, t) for t ≤ t_v = 5.327. The outgoing worldlines are (±0.45·(t − t_v), 0, t) for t ≥ t_v. For each plane, intersect each segment analytically. The split occurs exactly when the plane passes through the vertex event, which is **the same event for every θ, φ**. The readout is frozen at `SPLIT SEEN AT x = 0.00 · y = 0.00 · ct = 5.33`. Its t₀* is 5.327 for every tilt, because the vertex sits at the plane's pivot.

**5. The inset.** It shows a top-down (x, y) projection of the slice polylines. This is a simplification: it ignores length contraction, consistent with the Euclidean-style drawing (below).

**6. Faithful vs cartoon.**

| Element | Status |
|---|---|
| A slice changes topology (1 loop → 2) only at a tangency; where that tangency sits depends on the slicing | **Faithful** mathematics (Morse theory) for any smooth surface |
| A smooth pants surface with a smooth saddle, sliced at any tilt | **Faithful for the worldsheets string amplitudes are computed on**, in "imaginary time", where tilting a slice is just a rotation |
| Reading the tilt as "a moving observer" | **Heuristic / ANALOGY.** In strictly real-time classical geometry, a splitting worldsheet cannot be smooth and timelike everywhere. It must have one degenerate "crotch" point (Louko & Sorkin 1997), and a real observer's slices would all find it. Our drawn crotch is flatter than 45° within about ±0.34 ℓ in x and ±0.86 ℓ in y, which is the tell. The robust lesson ("no point on the surface is special; the interaction is not put in at a point") does not depend on this |
| The specific shape Φ | **Cartoon.** It is not a solution of any equation. The quantum amplitude sums over all smooth surfaces of this topology |
| 2+1 dimensions, ℓ-scale units | **Cartoon** (hidden dimension; not to scale) |

#### Micro-copy (each ≤ 20 words)

- Panel title: `THE NOW-SLICER`
- Intro: "Slide 'now' upward to watch one loop become two. Then tilt 'now' and find the split again."
- Now slider hint: "Where this observer's present cuts through the whole history."
- Tilt hint: "Motion tilts an observer's 'now'. In a spacetime diagram, the slope is v/c."
- Direction hint: "Which way this observer moves."
- Loop readouts: `1 LOOP` · `PINCHING` · `2 LOOPS` / `1 PARTICLE` · `2 PARTICLES`
- Particle caption: "Every tilt agrees: the particles split at one event, the vertex."
- String caption: "Each tilt finds a different split point. The surface itself never changes."
- After *Try every direction*: "No single point. The split is smeared across this patch."
- Limit hint: "Tilts stop below 45°: no observer outruns light."
- Inset title: `THIS OBSERVER'S MOVIE`
- ANALOGY chip text: "Time drawn like space, as in string calculations. One dimension hidden; not to scale."
- Screen-reader live region: "This 'now' sees one loop." / "…two loops." / "Split point moved to x 0.23, y 0.00."

#### Optional audio (muted by default)

A soft sustained tone for the single loop. At the pinch it divides into two tones that detune apart in proportion to the legs' separation, so you hear one voice become two. In particle mode, the vertex gives a short dry tick instead: a point event has no "gradual" sound. Reuse Chapter 2's harmonic timbre so the Thread sounds like itself.

#### Fallback (no WebGL)

A static SVG with the Y and the pants side by side, each crossed by three hairline slice lines (0° and ±30°). The Y's three split marks coincide; the pants' three marks sit visibly apart.

---

## Go deeper

**Why area, and where do interactions come from?**

A relativistic particle's action is its proper time, scaled by its rest energy:

$$S_{\text{particle}} = -\,m c^{2}\!\int d\tau$$

Here `m` is the mass and `dτ` is the time ticked by a clock riding along each bit of the worldline. The straight worldline has the most proper time, so it gives the smallest action of any worldline between the same two events.

Nambu (1970) and Goto (1971) lifted this rule one dimension:

$$S_{\text{NG}} = -\frac{T}{c}\int dA \;=\; -\frac{T}{c}\int d\tau\,d\sigma\,\sqrt{(\dot X\!\cdot\! X')^{2}-\dot X^{2}\,X'^{2}}$$

- `T` is the tension, an energy per unit length. In units where ħ = c = 1 it is written 1/2πα′.
- `X(τ, σ)` places each point of the worldsheet in spacetime: `σ` runs along the string and `τ` runs forward in time.
- `Ẋ` and `X′` are the two edges of a tiny patch, and the square root is that patch's area, measured by relativity's rules.

The real history makes S *stationary*: nudge it slightly and S changes only at second order. The area doesn't depend on how you label or slice the sheet into moments, so no slicing of the pants is preferred.

Interactions need no new ingredient. Each history is weighted by its shape class:

$$\text{weight}\;\propto\; g_s^{-\chi},\qquad \chi = 2-2h-b$$

- `χ` is the Euler number of the surface.
- For closed strings, `b` counts the openings where strings enter or leave, and `h` counts handles (loops).
- A tube has χ = 0: free travel.
- The pants have χ = −1: one factor of the string coupling `g_s`.
- Each extra handle costs another factor of g_s².

And g_s is not a free dial: its value is set by a field of the theory itself, the dilaton.

*(Highlight sync: `dτ` ↔ the tick marks from Beat 2; `T` ↔ the ribbon's glowing edges; `dA` ↔ the area fill; `b` and `h` ↔ counters beside the tube, the pants and Beat 5's handle.)*

---

## Glossary

- `worldline` — The line a point particle traces through spacetime: every place it has been, at every moment, drawn as one line.
- `worldsheet` — The surface a string traces through spacetime. An open string's is a ribbon; a closed string's is a tube.
- `open string` — A string with two free ends. Free ends move at light speed. Later chapters show they can attach to membranes called branes.
- `closed string` — A string that forms a loop with no ends. Its worldsheet is a tube. Any theory with open strings contains closed strings too.
- `proper time` — The time a clock carried along a worldline actually ticks. Between two events, the straight, unaccelerated worldline ticks the most.
- `Nambu–Goto action` — String theory's starting rule: a history's action is minus the string tension times the worldsheet's area, measured by relativity's rules.
- `pair of pants` — The worldsheet of one closed string splitting into two, or two joining into one. It is smooth everywhere, with no corner.
- `vertex` — In a particle (Feynman) diagram, the sharp point where worldlines meet. Particle theories attach a separate rule and strength to each kind of vertex.
- `simultaneity` — Which events count as happening "now". Observers moving relative to each other slice spacetime into "nows" at different tilts (an observed effect of relativity).
- `UV divergence` — An infinity in a quantum calculation that comes from extremely short distances (very high energies), for example interaction points squeezed together.

---

## Numbers & facts

**Relativity (OBSERVED physics)**
- **Light at 45°; simultaneity slope v/c.** With `ct` and `x` in the same units, light worldlines are at 45°. A moving observer's line of simultaneity satisfies `ct = (v/c)·x + const`, so tan θ = v/c. θ = 35° → v = 0.70c; θ = 30° → 0.577c. Source: Taylor & Wheeler, *Spacetime Physics*, 2nd ed. (1992); any special-relativity text.
- **Maximal proper time.** A straight (free) worldline between two events has the greatest proper time. At 0.6c, γ = 1.25, so the detour path in Beat 2 has τ = 8/1.25 = 6.4 against 8.0 (10 vs 8 ticks at 0.8 per tick). Source: Taylor & Wheeler, "principle of maximal aging".
- **Opening particle drift.** 0.3c draws a worldline tilted arctan 0.3 ≈ 17° from vertical. Computed.
- **Particle action** `S = −mc²∫dτ`. Source: Landau & Lifshitz, *Classical Theory of Fields*, §8; Tong, *Lectures on String Theory*, eq. (1.2) — https://www.damtp.cam.ac.uk/user/tong/string/string.pdf

**The string action**
- **Nambu–Goto action.** Nambu, lecture notes for the Copenhagen Summer Symposium (1970, unpublished); T. Goto, *Prog. Theor. Phys.* **46**, 1560 (1971), https://doi.org/10.1143/PTP.46.1560; overview at https://en.wikipedia.org/wiki/Nambu%E2%80%93Goto_action
- **Form of the action.** `S = −(T₀/c)∫dA` (Zwiebach's convention) or `S = −T∫d²σ√(−det γ)`, with T = 1/(2πα′) when ħ = c = 1. Source: Zwiebach, *A First Course in String Theory*, 2nd ed. (CUP 2009), ch. 6; Tong §1.2.
- **"Action proportional to worldline length → worldsheet area" as the generalization.** Source: Tong §1.2.

**Open strings**
- **Free open-string endpoints move at the speed of light** (Neumann boundary conditions). Source: Tong §3, discussion after eq. (3.1); Zwiebach ch. 6–7.
- **Rigidly rotating open string** (Beat 1's helicoid) is an exact classical solution. In energy-parametrized static gauge it reads `x(σ,t) = (L/π)·cos(πσ/L)·(cos(πct/L), sin(πct/L))`, with endpoints at speed c. This pack checked the constraints and the wave equation directly. Source: Zwiebach, 2nd ed. (rotating open string, ch. 7–8).
- **"Theories of open strings necessarily contain closed strings"** (the ends can join). Heterotic theories appear to have no open strings or D-branes. Source: Tong §3 (before §3.1.1).
- **History.** Closed strings first surfaced uninvited, as extra singularities (the "Pomeron") in *nonplanar* open-string loop amplitudes. Lovelace noticed that they behave properly in 26 dimensions. Source: C. Lovelace, *Phys. Lett. B* **34**, 500 (1971), https://doi.org/10.1016/0370-2693(71)90665-4

**Interactions**
- **"The worldsheet is smooth… Here there are no such points. Locally, every part of the diagram looks like a free propagating string. Only globally do we see that the diagram describes interactions."** Source: Tong, opening of §6.
- **Topology weighting.** Weight ∝ g_s^{−χ} with χ = 2 − 2h − b. Sphere: χ = 2; torus: χ = 0; genus g weighted by (g_s²)^{g−1}. Source: Tong §6.1.1, eqs. (6.3)–(6.5), and χ = 2 − 2h − b in §6.3 (open-string scattering).
- **Tube and pants.** Tube χ = 0; pants χ = −1 → one factor of g_s. This follows from the formula above.
- **g_s = e^{Φ₀}**, the asymptotic value of the dilaton. Source: Tong eq. (7.14).
- **No invariant interaction point.** Witten: "There is no longer an invariant notion of when and where interactions occur." He also notes that for particles, "Everyone can agree… that x, y, z and w were the spacetime events at which interactions occurred." Source: E. Witten, "Reflections on the Fate of Spacetime", *Physics Today* **49**(4), 24–30 (April 1996), https://doi.org/10.1063/1.881493 (scan: https://www.sns.ias.edu/~witten/papers/Reflections.pdf).
- **Where particle infinities come from.** Same article: potential infinities come from the integration region "where the spacetime events x, y, z and w all nearly coincide", and "for gravity, renormalization theory fails".
- **Popular "tilted slices" version:** B. Greene, *The Elegant Universe* (1999), ch. 6. https://en.wikipedia.org/wiki/The_Elegant_Universe
- **Lorentzian caveat.** A 2D Lorentzian "trousers" must have a degenerate *crotch* point; Louko & Sorkin note that this is "also the fundamental vertex of string theory, if one makes that interpretation". Sources: J. Louko & R. Sorkin, *Class. Quantum Grav.* **14**, 179 (1997), https://arxiv.org/abs/gr-qc/9511023; A. Anderson & B. DeWitt, *Found. Phys.* **16**, 91 (1986), https://doi.org/10.1007/BF01889374
- **String amplitudes use asymptotic states** (the S-matrix), not finite-time "movies". Source: Tong §6.1.

**Ultraviolet behaviour**
- **Gravity as an ordinary quantum field theory is non-renormalizable.** With matter it fails at one loop ('t Hooft & Veltman, *Ann. Inst. H. Poincaré A* **20**, 69 (1974), https://www.numdam.org/item/AIHPA_1974__20_1_69_0/). Pure gravity fails at two loops (Goroff & Sagnotti, *Nucl. Phys. B* **266**, 709 (1986), https://doi.org/10.1016/0550-3213(86)90193-8).
- **One loop: UV finite** (the region of "thin" tori is excluded by modular invariance). Source: Tong §6.4.
- **Two loops.** D'Hoker & Phong constructed the two-loop superstring measure and established its good behaviour: *Phys. Lett. B* **529**, 241 (2002), https://arxiv.org/abs/hep-th/0110247; *Nucl. Phys. B* **715**, 3 (2005), https://arxiv.org/abs/hep-th/0501197. Tong §6.4.4 also says that UV finiteness "continues to hold at the two-loops".
- **Higher loops.** Tong §6.4.4: "The honest answer is that we don't know… no general statement of finiteness has been proven"; with pure-spinor methods, "certain objects remain finite up to five-loops".
- **All orders.** "String field theory puts the claim of perturbative ultraviolet finiteness of string theory in a solid footing." In that picture, surfaces are built from tubes of fixed finite circumference, and every degeneration is an infinitely long tube, i.e. infrared. Source: A. Sen & B. Zwiebach, "String Field Theory: A Review" (2024), §9.7, https://arxiv.org/abs/2405.19421. See also E. Witten, "Superstring Perturbation Theory Revisited" (2012), https://arxiv.org/abs/1209.5461
- **The perturbation series itself is asymptotic** (it does not converge). Source: Tong §6.4.5. For the bosonic string: D. Gross & V. Periwal, *PRL* **60**, 2105 (1988), https://doi.org/10.1103/PhysRevLett.60.2105
- **High-energy softness.** At high energy and fixed angle, string amplitudes fall off exponentially, where field theory gives power laws. Sources: D. Gross & P. Mende, *Phys. Lett. B* **197**, 129 (1987), https://doi.org/10.1016/0370-2693(87)90355-8; Tong eq. (6.14).

**Scale**
- **Planck length** = 1.616255 × 10⁻³⁵ m (CODATA 2018), https://physics.nist.gov/cgi-bin/cuu/Value?plkl. The string length is unknown; tying it to "~10⁻³⁵ m" is SPECULATIVE.

**Lab-model numbers** (this pack's own construction, verified with a numpy script)
- **Constants:** L = 0.25, C = 2.4, t_m = 5, w = 1.6.
- **Radii:** waist 1.442; legs ≈ 1.18; leg-separation speed ≤ 0.75c.
- **Pinch:** t\* = 5.327, c′(t\*) = 0.7195.
- **Local curvatures:** T_xx = 3.045, T_yy = −0.964.
- **Split positions and one-change check:** see the table in Lab › Model 3. A t₀ scan confirmed a single topology change per tilt.
- **Flat patch:** |∇T| < 1 within about ±0.34 in x and ±0.86 in y.
- **Particle Y:** branches move apart at ±0.45c.
- **Beat 1 helicoid:** r₀ = 1, endpoint speed = c.
- **Beat 5 handle:** c_max = 1.7. Its hole is 1.22 ℓ tall at w = 1.5 and 1.95 ℓ at w = 2.4. Leg speed ≤ 0.97c at w = 1.5.
- **Beat 6 gap law:** g₀ = 2.4 rad, joining at ct = 5.
- **Mesh estimate:** ≈ 54k triangles at a cell size of 0.08.

---

## Pitfalls

1. **"A string's worldsheet is a membrane or sheet floating in space."**
   A worldsheet is a *history*: the whole life of a string, drawn at once. The string at any moment is a slice through it. **Avoided by:** the flipbook-to-surface build in the Opening and Beat 1, the Field (geometry) colour for sheets, and warm light only on the *current* slice.

2. **"Strings, like soap films, minimize their area."**
   The classical worldsheet makes the area *stationary*, not minimal. In spacetime, some nudges increase the proper area and others decrease it (for a straight free *particle*, proper time is truly maximal). The soap-film picture is exact only in imaginary time. **Avoided by:** Beat 2's wording ("picks", "stationary"), the `ORDER ε²` nudge caption, and the Go deeper text.

3. **"Different observers literally disagree about the event where a string split."**
   This is the popular form (Greene 1999; Witten 1996 phrases it as "no longer an invariant notion of when and where interactions occur"). Its lesson is right: no point on a smooth worldsheet is special, and the interaction is not inserted at a point. The literal observer story needs care. It is exact for the smooth "imaginary-time" worldsheets on which amplitudes are computed. A strictly real-time classical splitting surface must, for topological reasons, contain one degenerate crotch point that every observer's slicing would find (Louko & Sorkin 1997). **Avoided by:**
   - the ANALOGY · DERIVED chip on Beat 4;
   - the tooltip ("for real observers it is a heuristic");
   - the Model's faithful-vs-cartoon table;
   - the tilt capped below 45°;
   - framing the takeaway as "no point on the surface is special" rather than "physics is observer-dependent".

4. **"String theory has been proven finite" / "string theory has no infinities."**
   Perturbative UV finiteness is explicit at one and two loops. All-order arguments exist (string field theory, Sen & Zwiebach 2024), but Tong's widely used notes still say no general proof exists. The perturbation series itself is asymptotic, and the full non-perturbative theory isn't known. Finiteness is a theoretical virtue, not experimental evidence. **Avoided by:** Beat 5's "through two loops … arguments extend this", the tooltip, and the Numbers list. We never use "proves".

5. **"Strings interact by bumping into each other; the interaction happens where they touch."**
   Nothing extra happens at a contact point. The interaction *is* the surface's shape (its topology). Its strength g_s is fixed by the dilaton's value, not chosen per vertex. **Avoided by:** Beat 3's loupe showing a crotch patch identical to a free patch, and Go deeper's "interactions need no new ingredient".

6. **"The pants diagram is a movie of what actually happens."**
   A quantum amplitude sums over *all* surfaces of a given shape class. String theory computes scattering between far-apart incoming and outgoing strings (the S-matrix), not finite-time movies (Tong §6.1). **Avoided by:** the "cartoon shape" note in the Beat 3 tooltip and the Model table.

7. **"Open and closed strings are different theories" or "closed strings are optional."**
   Open-string ends can join, so open strings imply closed ones. The reverse is not universal: heterotic theories appear to have no open strings. **Avoided by:** Beat 6's text and tooltip. We don't claim "every theory has both".

8. **"Feynman diagrams are photographs of particle paths."**
   They are pictures of terms in a calculation. Their worldline reading is itself a heuristic. **Avoided by:** calling them "particle diagrams" and using the ANALOGY chip on the Y and bubble visuals; the "CONTRIBUTION → ∞" readout is marked schematic.

9. **"The pictures show real sizes and real dimensions."**
   String length is unknown, and the diagrams hide one space dimension (superstrings need 9 space dimensions; Chapter 5). **Avoided by:** the "not to scale" and "one dimension hidden" notes in the conventions, chips and lab copy, and the SPECULATIVE scale gauge.

10. **"Tilting 'now' means an observer can see the split before it happens" or "faster-than-light slicing."**
    Tilts are capped at 35° (v ≤ 0.70c), with the explicit hint "no observer outruns light".

11. **"Smooth interactions prove string theory is right."**
    Smoothness explains why physicists found strings *promising* (Chapter 4). It is not evidence that nature uses them. **Avoided by:** status chips (DERIVED, never OBSERVED, for string claims) and the documentary voice ("string theory proposes").

---

## Handoff

**IN:** **H1**, one horizontal open string centered and gently vibrating in its fundamental mode, seen side-on in the void, matching Chapter 2's last frame. During the Opening, the camera pulls back and pitches down so that this same Thread comes to lie on the space floor of a spacetime diagram, and time is drawn upward. If Chapter 2 ends on H0 instead, the point unfolds into H1 in the first 10% of the Opening.

**OUT:** **H2**, one closed string loop centered, facing the camera and gently wobbling. In Beat 6, an open string's ends join into a loop. The camera cranes up the resulting tube and pitches to look straight down the time axis, so the loop faces the viewer, and the diagram (grid, axis, worldsheet film) fades out, leaving only the warm loop. This hands Chapter 4 (`gravity`) a closed string, the object whose massless spin-2 vibration it will show behaves like the graviton.
