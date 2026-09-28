## Prologue

**Chapter 0 · `prologue`** · overall status: `SPECULATIVE` (the hypothesis itself) + `ANALOGY` (the Thread is a picture of an idea, not an image of an object).

**Must work at rest.** Everything below is visible on first paint, with no scrolling and no interaction needed.

### At rest (above the fold)

- **Title** (Bodoni Moda, display size, roman): **The String Hypothesis**
- **Subtitle** (Hanken Grotesk, Ink-2, one line): *An explorable guide to an elegant, untested idea about what everything is made of.*
- **Opening beat P1** (narrow column, lower left) · Status `SPECULATIVE`
  > String theory proposes that the particles of our world are tiny vibrating strings, too small for any experiment so far to resolve. Developed for more than fifty years, it is mathematically rich and still untested by experiment.
- **Opening beat P2** (below P1, smaller) · Status `ANALOGY ~` (the beat is UI guidance; its one object, the Thread, is a picture, so it wears the same chip as the Thread)
  > Every claim here wears a mark showing how sure we are. Touch the thread. Then scroll: we begin with you.
- **Status key** (one mono row along the bottom edge, Ink-3, each chip in its own status color and form):
  `● OBSERVED measured` · `◑ DERIVED follows from string theory's math` · `◌ CONJECTURED strong evidence, unproven` · `○ SPECULATIVE one possible scenario` · `~ ANALOGY a picture, not literal`
- **Chip beside the Thread** (`~ ANALOGY`, micro-copy): "A picture of an idea. No one has ever seen a string."
- **Scroll cue** (mono, bottom center, slow 2 s fade pulse): `SCROLL · WE START WITH YOU`

### Stage (prologue scene)

- **Ground:** Void `#05070B`, with a very faint radial lift (Abyss at 30% alpha) behind the Thread. No stars and no grid. The darkness should feel deliberate.
- **The Thread:** one horizontal open string centered at 52% of viewport height, spanning 56% of viewport width (on portrait phones, 80%). Rendered as a ribbon of 256 segments with a Filament core `#FFF6E8` (1.5 px) and an amber halo `#FFC98A` (Gaussian falloff about 10 px, additive). The ends taper to nothing over the last 3% of the length. It uses H1's free-end mode shapes and colors, framed larger and with the prologue's own idle motion (below), so it reads as the same kind of object the visitor will meet again at the end of chapter 1. (It is not the H1 registry pose itself; the prologue exits through H0, not H1.)
- **Idle tremble:** the displacement is a sum of free-end modes (Model below), driven by smooth band-limited noise. Its rms amplitude is 0.4% of the length for n = 1 and falls as 1/n². The Thread is never perfectly still. This is a quiet hint that a quantum string always jitters (`ANALOGY`: a real string's zero-point jitter falls only as 1/√n per mode; the steeper fall-off keeps the picture calm).
- **Hover:** within 48 px of the Thread, the pointer pushes it away with a soft Gaussian nudge (at most 6 px) that springs back. The Thread looks touchable.
- **Pluck (drag and release):** the visitor grabs the Thread, pulls (capped at 12% of the length) and releases. It rings in several modes, and the ringing decays over about 3 s. With audio enabled (muted by default), each mode sounds a harmonic of 110 Hz with the same decay. The sound is a sonification (`ANALOGY`): strings are not sound waves and vibrate in no medium.
- **Camera:** `HANDOFF.camera` (fov 35°, at (0, 0, 10)) with ±3° pointer parallax, which eases back to zero during the transition so the last frame (H0) is rendered exactly at `HANDOFF.camera`.

**Model (prologue Thread).** Position along the string is σ ∈ [0, 1], with x = (σ − ½)·L_px and
y(σ, t) = Σₙ₌₁⁸ aₙ(t) cos(nπσ).
- Free-end (Neumann) modes cos(nπσ): these are the faithful mode shapes for an open string whose ends are not pinned. Pinned "guitar" modes appear only once branes arrive in chapter 7.
- Pluck: the initial shape is y₀(σ) = h·exp(−(σ−σ₀)²/(2·0.06²)), where σ₀ is the grab point and h is the drag height. The amplitudes are aₙ(0) = 2∫₀¹ y₀ cos(nπσ) dσ for n ≥ 1. The n = 0 term, a rigid sideways shift, is dropped.
- Evolution: aₙ(t) = aₙ(0)·cos(2π·n·f₁·t)·e^(−γₙt), with f₁ = 0.9 Hz and γₙ = 0.6 + 0.15n s⁻¹. The evenly spaced frequencies n·f₁ match the classical relativistic open string (faithful). **The damping is fictional** (`ANALOGY`), added so the Thread settles: a free string does not lose energy this way.
- `prefers-reduced-motion`: no idle tremble. A pluck plays one slow decay at f₁ = 0.3 Hz.
- No WebGL: a static SVG Thread (a hairline curve with a blurred amber duplicate), with pluck disabled.

### Transition out (scroll-scrubbed, prologue progress 0.55 → 1.0)

- The title, subtitle, beats and key fade and drift upward. The camera dollies straight back, and the Thread's on-screen length shrinks exponentially.
- The Thread is always drawn *convolved with the resolution blur* (the same capsule renderer as the chapter 1 lab, below). When its length drops below the blur width, it becomes a round glow that cannot be told apart from a point. Its warm color crossfades to Ink `#ECE6D9` as it becomes unresolved. **Design rule for the whole site: warm Filament light is shown only when a string is *resolved*.**
- Transition caption (mono, centered under the glow) · `DERIVED ~ ANALOGY`: "Step back far enough, and a string would look just like a point. Hold that thought."
- **Last frame = H0:** a single glowing point, Ink-white, at screen center.

---

# 01 · Down to a Point — What is everything made of?

**Thesis:** Zoom from your fingertip down through cells, molecules, atoms, nuclei and protons, and you reach particles with no measurable size. String theory's central proposal (it began, around 1968–70, as a model of the strong force) is that, far below anything we can resolve, those points might be tiny vibrating strings.

**Overall status:** `OBSERVED` for the entire zoom down to about 10⁻¹⁹ m (every stage drawn as `ANALOGY`), then `SPECULATIVE ~ ANALOGY` for the reveal. The chapter should make the line between the two impossible to miss.

## Storyboard

**Engine brief (applies to every beat).**
- **One quantity drives everything:** s = log₁₀(L), where L is the vertical field of view in meters. Scroll maps to s through the keyframes below. The scale gauge (left edge on desktop; a top strip on phones) reads L live, with an SI prefix: m, mm, µm, nm, pm, fm, am, zm, ym, rm (ronto, 10⁻²⁷), qm (quecto, 10⁻³⁰). Below 10⁻³⁰ m it switches to scientific notation.
- **Precision:** float32 cannot span 10⁻³⁶ … 10⁰. Keep every layer in its own local units. On the CPU, in float64 (a JS number), compute each object's ratio (size / L) and offset ((x − anchor) / L), and send only those ratios to the GPU. Cull any object whose ratio falls outside [10⁻³, 10³]. Point-like sprites are exempt, because they have a fixed pixel size.
- **Layers:** each layer has a visible window [s_lo, s_hi] and a 0.5-decade crossfade. At most two layers are live at once. Every layer is instanced points (`THREE.Points`, with custom shaders) plus hairlines, which keeps the scene under 150k triangles and 60 draw calls. Medium tier: at most 80k points per layer. Phones: 40k. Low tier: no particles, and each beat shows a static SVG still (the gauge still works, because it is DOM).
- **Zoom axis:** the zoom always closes on a Field-blue reticle at screen center. The camera translates only at two marked anchor shifts, and rotates only in the Beat 1 cutaway tilt.
- **Flicker haze** (the site's way to draw anything quantum): each point in a buffer has a seed and a lifetime τ (0.4–1.2 s). Its position is resampled in the vertex shader from a hash of (seed, floor(t/τ + phase)). Its alpha rises and falls in a sin² envelope over its life. The CPU does no per-frame work.
- **Decade rings:** hairline Field-blue circles of physical radius 10ᵏ m, drawn at radius (10ᵏ/L)·H_px, where H_px is the viewport height in pixels. They are visible while that radius lies between 0.03·H and 0.8·H, and each is labeled in mono (`10⁻¹⁷ m`). As you zoom, they fly outward from the center. They keep the motion readable when nothing else on screen changes.
- **Scroll length:** about 1400 vh for the chapter, plus a 100 vh pinned lab section at the end.
- **Scroll map (chapter progress p → s):** linear interpolation between keyframes; a repeated value means a hold. 0.00 → +0.4 (H0; gauge hidden until 0.05) · 0.08 → +0.4 · 0.12 → −1.0 · 0.17 → −3.0 · 0.22 → −4.6 · 0.28 → −6.0 · 0.34 → −8.3 · 0.40 → −9.3 · 0.44 → −9.6 · 0.48 → −9.6 · 0.52 → −13.8 · 0.55 → −14.1 · 0.57 → −14.1 · 0.60 → −14.6 · 0.62 → −14.6 · 0.64 → −15.3 · 0.74 → −19.0 · 0.86 → −32.0 · 0.96 → s_end · 1.00 → s_end (H1). Here s_end = log₁₀(ℓ_s / 0.666) ≈ −33.82 for ℓ_s = 10⁻³⁴ m, chosen so the string's on-screen length equals the registry's H1 length (see Handoff). These keyframes land exactly on the beat boundaries below.
- **Reduced motion:** the continuous zoom becomes crossfades between one still per beat. The gauge jumps between values. The reveal becomes three stills (point, elongated, string) with no vibration.

### Opening: Handoff IN (p 0.00–0.08)

- **Text:** Start with something familiar: you, about 1.7 meters tall. What are you made of? Keep your eye on the fingertip. We will zoom toward it, ten times closer at every step, until our instruments run out.
- **Status:** `OBSERVED ~ ANALOGY`
- **Stage:**
  - **First frame = H0.** This is the prologue's point of light, at screen center.
  - Over p 0–0.05, the point's glow dims into a Field-blue hairline reticle: four 6 px ticks around a 24 px gap. This reticle is the zoom target for the rest of the chapter.
  - At the same time, about 80k Ink points (60% alpha, 1–2 px, each with a gentle hash-based shimmer) swirl in from a loose sphere. They settle into a standing human figure: sampled from a neutral, low-poly CC0 mesh (bundled with the site or generated procedurally; no network fetch, per the CSP), placed lower-left, right arm raised, with the index fingertip exactly on the reticle. The figure reaches toward the point.
  - The scale gauge fades in at 2.5 m (s = +0.4), with a landmark tick `YOU · ~1.7 m`. The figure yaws ±6° with pointer parallax.
  - `~ ANALOGY` caption (mono, small): "This figure: 80,000 drawn points. You: roughly 30 trillion cells."

### Beat 1: Into the living scale (p 0.08–0.34 · s +0.4 → −8.3)

- **Text:** Each tick on the gauge is one [[order of magnitude]], a factor of ten. Skin gives way to living cells, each some ten to twenty micrometers across. Inside, DNA coils: a molecule two nanometers wide, far narrower than a wavelength of visible light.
- **Status:** `OBSERVED ~ ANALOGY`
- **Stage:**
  - **Hand and fingertip (s −0.5 → −3):** a denser hand-only point cloud (60k points) crossfades in. At s ≈ −2, the fingertip surface turns into flowing fingerprint-ridge hairlines (Ink-3).
  - **Cutaway (s −3 → −4.3):** a cutaway plane slices the skin, and the camera tilts 15° down to look into it. On top are flattened, dead outer cells with no nuclei. Below them are living cells: a Voronoi mosaic of hairline membranes (Ink-2), each with a darker nucleus with a faint Field-blue rim. `~ ANALOGY` tag: "Cutaway."
  - **One cell (s ≈ −4.6):** one living cell is centered, about 15 µm across. The zoom enters its nucleus.
  - **Chromatin (s −5.5 → −7):** tangled chromatin appears as hairline loops (instanced line strips). One fiber resolves into DNA wound around protein spools. Do not label these as strings.
  - **Light-wavelength marker (s ≈ −6.5):** the gauge shows a band `VISIBLE LIGHT 380–750 nm`. Caption (mono): "Light microscopes blur detail finer than about 200 nm. Smaller things are measured with electrons, X-rays or collisions; these are drawings."
  - **DNA (s −8 → −8.3):** a B-DNA double helix fills the frame. The two backbones are Ink hairline helices (about 4k points each), the base pairs are Ink-3 rungs, and the helix rotates at 0.05 rev/s. A hairline dimension arrow reads `2 nm`.

### Beat 2: The atom is a haze, not a solar system (p 0.34–0.48 · s −8.3 → −9.6)

- **Text:** One of DNA's carbon atoms, about 10⁻¹⁰ m across. No planets, no orbits. Its electrons form a [[probability cloud]] that shows where each is likely to be found. Detect one, and it turns up in a single spot.
- **Status:** `OBSERVED ~ ANALOGY`
- **Stage:**
  - Along a backbone, atoms appear as overlapping haze balls. The haze is shared where atoms bond (`ANALOGY`). The reticle locks onto one carbon atom of a sugar ring (mono tag `C`). By s = −9.6, that atom fills 70% of the frame height.
  - **Carbon haze:** 30k flicker points, sampled from the Slater model in the Lab Model (section 3), in additive Ink at 25% alpha. It reads as a bright compact core (1s) inside a broad soft shell (n = 2). There are no rings, no orbit tracks and no electron balls.
  - **Detection event** (every 3 s): one flicker point flashes to a PSF-size bright dot and holds for 0.6 s with the tag `e⁻ detected here`, then fades back into the haze. This beat's teaching point is that the cloud is probability, and each detection finds the electron in one place.
  - At the center, a tiny Field-blue reticle is labeled `NUCLEUS HERE · far smaller than one pixel at this zoom`.

### Beat 3: Nucleus, then proton, a seething field and not three marbles (p 0.48–0.62 · s −9.6 → −14.6)

- **Text:** Tens of thousands of times smaller: the nucleus, six protons and six neutrons. A proton, radius about 0.84 × 10⁻¹⁵ m, is not three marbles. Three quarks churn in a seething [[gluon]] field, with quark–antiquark pairs flickering in and out.
- **Status:** `OBSERVED ~ ANALOGY`
- **Stage:**
  - **The long dark stretch (s −9.6 → −13.5, fast):** the carbon haze fades over s −10.3 → −11.5. Decade rings fly outward. Caption: "Four powers of ten with nothing to draw. Not empty: the electron cloud reaches in here too."
  - **Nucleus (s −13.8 → −14.1, then hold):** 12 soft blobs form a cluster whose charge has an rms radius of about 2.5 fm (blob centers placed with rms radius 2.3 fm; see Lab Model 4). Protons are Ink with a Field-blue tint and tag `p`; neutrons are Ink-3 with tag `n`. Each blob is a flicker haze with an exponential profile (a = 0.24 fm), not a hard sphere. The whole cluster jiggles (Ornstein–Uhlenbeck noise, σ = 0.15 fm, τ = 1.5 s). Gauge landmark: `C-12 NUCLEUS · r_rms ≈ 2.5 fm`. `~ ANALOGY` caption: "Blobs, not billiard balls: nucleons have fuzzy edges and never sit still."
  - **Anchor shift 1 (s −14.1 → −14.6):** the camera glides from the nucleus center onto one proton, which grows to fill 70% of the frame (FOV 2.5 fm).
  - **Proton interior:**
    - **Gluon field:** 24k Field-blue points (12% alpha, additive), advected by 3D curl noise and respawned from an exponential radial profile. It should read as turbulent cool fog. It must never form tubes, springs or anything warm, because that would read as a string.
    - **Three valence quarks:** PSF-size Ink points, not spheres. Each follows an Ornstein–Uhlenbeck walk (σ = 0.35 fm per axis, τ = 0.5 s) and carries a mono tag `u`, `u` or `d`.
    - **Sea pairs:** about 8 per second. Two dim points spawn together, separate by up to 0.3 fm and re-merge within 0.4 s. Every fifth pair is tagged `q q̄`.
  - Caption: "The three quarks' rest masses add up to only about 1% of the proton's mass."
  - `~ ANALOGY` chip: "A cartoon of quantum fluctuations. A quark's 'color' charge is a name, not a color."

### Beat 4: Points, which never grow (p 0.62–0.74 · s −14.6 → −19)

- **Text:** Keep zooming onto one quark. Notice: it never grows. The [[Standard Model]] treats quarks and electrons as point particles, with no size and no parts. Experiments agree so far: any size is below a few times 10⁻¹⁹ m.
- **Status:** `OBSERVED`
- **Stage:**
  - **Snapshot:** at beat start, all motion in the proton freezes. One `u` quark is ringed by the reticle, with a `~ ANALOGY` caption: "A high-energy collision catches a quark at one place, like a snapshot."
  - **Anchor shift 2:** the camera glides onto that quark. The zoom then resumes, and the frozen fog scales out of frame by s ≈ −16. Only the void remains.
  - **The quark is drawn as a fixed-size PSF glow**, identical to H0: the same pixels, the same brightness, at every s. Decade rings of 10⁻¹⁶, 10⁻¹⁷ and 10⁻¹⁸ m fly outward past it. The contrast between rings rushing out and a point that never grows is the visual definition of a point particle.
  - **Size limits:** at s ≈ −17, a hairline-circled inset appears top-right. It shows an identical glow tagged `ELECTRON · no size found · < 3 × 10⁻¹⁹ m`. The main point is tagged `QUARK · no size found · < 4.3 × 10⁻¹⁹ m`.
  - **Measurement edge:** from s −18 to −20, the gauge draws a soft gradient band, `EDGE OF DIRECT MEASUREMENT`. It is a band rather than a line because the bound depends on the method. Past the band, the gauge's ticks change from solid to dashed.

### Beat 5: The unexplored gap (p 0.74–0.86 · s −19 → −32)

- **Text:** What if they aren't points? Past this edge, no experiment resolves anything directly. The unexplored stretch down to the [[Planck length]], 1.6 × 10⁻³⁵ m, spans about sixteen powers of ten, about as many as the whole journey from you to a proton.
- **Status:** `OBSERVED` (these are measured limits and arithmetic; nothing here claims what lies beyond).
- **Stage:**
  - **The question:** the pivotal line *What if they aren't points?* appears large (Bodoni Moda italic), centered above the point, then settles into the text column.
  - **The zoom accelerates** to about one decade per 1% of scroll. The point stays unchanged. The rings are now dashed, because this region is unexplored.
  - **Gauge readouts:** the SI prefixes tick past (zm, ym, rm, qm). At s < −30, the gauge's readout switches to scientific notation, with the micro-caption "Past 10⁻³⁰ m, even the SI prefixes run out."
  - **The gap brackets:** two brackets are drawn side by side on the gauge. One is solid, from 1.7 m to 0.84 fm: `YOU → PROTON · ~15 POWERS OF TEN`. The other is dashed, from the measurement edge to 1.6 × 10⁻³⁵ m: `UNEXPLORED · ~16 POWERS OF TEN`. A hairline marker reads `ℓP · 1.6 × 10⁻³⁵ m`. On phones, the brackets become two horizontal bars under the text.

### Beat 6: The reveal (p 0.86–1.00 · s −32 → s_end ≈ −33.82) · **the chapter's aha**

- **Text:** String theory proposes an answer. Look closely enough, it says, and each point particle would be a tiny vibrating [[string]]. From afar, a string would look just like a point. Its length is unknown; we draw it near 10⁻³⁴ m, one traditional estimate.
- **Status:** `SPECULATIVE ~ ANALOGY`
- **Stage (the aha):** for some seventeen decades (since the quark at s ≈ −15) the point has refused to grow. Now, with no cut and no zoom trick, the same glow *resolves*. One continuous renderer runs the whole beat: the capsule from the Lab Model, with ℓ_s = 10⁻³⁴ m and the resolution blur δ = L/50. The s values below follow from ℓ_s/δ = 50·ℓ_s/L.
  1. **s ≈ −31.8, hush.** The last dashed ring leaves the frame, and the point's breathing pauses for 0.5 s.
  2. **s ≈ −32.3.** The glow begins to stretch horizontally as ℓ_s/δ passes 1. It is still white.
  3. **s ≈ −32.3 → −32.8.** As the stretch grows from one to three blur widths, warm Filament light bleeds outward from the center (Model 7). This is the first warm light since the prologue: the color rule says a string has been resolved.
  4. **s ≈ −33.2.** The transverse wiggle (peak to peak) becomes larger than the blur, so the vibration becomes visible. It is a mix of modes 1–4, drawn with cos(nπσ) free-end shapes.
  5. **s = s_end ≈ −33.82.** The string's length is 0.666 of the viewport height, the registry's H1 length at `HANDOFF.camera` (about 37% of the width at 16:9). Over 1.5 s the shape eases into the registry's H1 motion (Model 6), then the renderer hands over to `<HandoffOpenString/>`: this is **H1**.
  - The gauge's live reading shows the field of view (`1.5 × 10⁻³⁴ m`). A landmark tick at the string's length reads `STRING · ~10⁻³⁴ m · HYPOTHETICAL`, and the gauge's marks become hollow rings (the SPECULATIVE form).
  - Chips pinned to the string: `○ SPECULATIVE` and `~ ANALOGY · thickness, glow and speed not to scale`.
  - Micro-caption: "Not a string inside the quark. In this picture, the quark itself would be a string."
  - With audio enabled: silence throughout Beats 4 and 5, then a single soft tone as the vibration resolves. A point has nothing to vibrate; a string does. (Sonification only, `ANALOGY`: strings make no sound.)
  - The lab panel docks here, with the same scene and camera.

## Lab

**Name:** *Point or string?* · Status: `OBSERVED` (the measurement edge and the energy readout) + `SPECULATIVE ~ ANALOGY` (the string mode)

**Purpose:** Teach that a string smaller than your resolution looks just like a point, so the two can be told apart only by resolving detail finer than the string's length. If strings exist, no experiment has yet reached that fine.

**Controls**

| Control | Type | Range | Default | Units |
|---|---|---|---|---|
| **Scale** (field of view L) | log slider (+/− buttons; arrows = 0.1 decade; PgUp/PgDn = 1 decade; pinch on stage after tap-to-engage) | 10^0.5 … 10⁻³⁶ | 10⁻¹⁸ | m |
| **Point ↔ String** | two-state toggle | Point (Standard Model) / String (hypothesis) | Point | — |
| **String length ℓ_s** | log slider, enabled only in String mode (shows "ℓ = 0" in Point mode) | 10⁻³⁵ … 10⁻¹⁷ | 10⁻³⁴ | m |
| **Landmarks** | jump chips (animate s over 1.2 s) | You · Cell · DNA · Atom · Proton · Edge · Planck | — | — |

**What changes on screen**

- **Scale** runs the same layer stack as the scroll zoom, so the visitor can revisit anything from human to string. The gauge, the decade rings and the readouts all update live.
- **Toggle, far above ℓ_s:** whenever ℓ_s is less than about 1/20 of the finest detail drawn (δ = L/50, so L ≳ 10³·ℓ_s), flipping the toggle changes **nothing** visible on screen. That is the lesson, and the caption says so.
- **Toggle, near ℓ_s:** for L between about 10³·ℓ_s and 50·ℓ_s, String mode shows a glow that stretches progressively (up to 2:1 at L = 50·ℓ_s) but stays white (the near-edge caption).
- **Toggle, below ℓ_s:** in String mode once ℓ_s exceeds δ (L < 50·ℓ_s), the glow unfolds into the warm, vibrating filament. In Point mode, the glow stays the same forever.
- **ℓ_s slider:** moves the zoom depth at which the string reveals itself. The slider's track is shaded in three zones:
  - above 10⁻¹⁹ m: hatched, **excluded**;
  - 10⁻¹⁹ … 10⁻²⁰ m: gradient, **probed in some scenarios**;
  - below 10⁻²⁰ m: open, **unexplored**.
  If ℓ_s is set in the excluded zone, the string resolves at scales experiments have already probed, and a warning caption appears.
- **Readouts** (mono, tabular):
  - `SCALE 1.0 × 10⁻¹⁸ m · 1 am` (the field of view L, same as the gauge)
  - `FINEST DETAIL 2 × 10⁻²⁰ m` (δ = L/50, the blur width)
  - `PROBE ENERGY ≈ 10 TeV` (ħc/δ: the energy needed to see detail that fine)
  - `≈ 0.7 × LHC`, or `≈ 10ⁿ × LHC` once the ratio passes 10
  - `SHOWN ~10ⁿ× SLOWER` (String mode only)

**Model** (for the engineer)

1. **Scale and projection** (faithful):
   - L = 10ˢ. The vertical field of view is L meters across H_px pixels.
   - An object of physical size D is drawn D/L·H_px pixels across. Compute in float64 and pass the ratio to the GPU.
   - Readout prefix: exponent 3·⌊s/3⌋, clamped to [−30, 0]; below −30, use scientific notation.
2. **Probe energy** (faithful to an order of magnitude): E = ħc / δ, with δ = L/50 the finest detail drawn (Model 5) and ħc = 1.9733 × 10⁻¹⁶ GeV·m. The energy is tied to δ, not to L, because δ is what decides whether the string shows; this keeps the readout honest at the moment of the reveal.
   - At L = 10⁻¹⁸ m: δ = 2 × 10⁻²⁰ m, E ≈ 9.9 TeV ≈ 0.7 × LHC.
   - At L = 10⁻¹⁹ m: δ = 2 × 10⁻²¹ m, E ≈ 99 TeV ≈ 7 × LHC.
   - When δ = ℓ_P = 1.616 × 10⁻³⁵ m (L ≈ 8 × 10⁻³⁴ m): E ≈ 1.2 × 10¹⁹ GeV.
   - Show the ratio E / 13 600 GeV. When δ = ℓ_P it is about 9 × 10¹⁴.
   - A string of length ℓ_s first shows when E passes about ħc/ℓ_s (for ℓ_s = 10⁻³⁴ m, about 2 × 10¹⁸ GeV).
   - Say "≈": the prefactor depends on the process, and parton collisions carry only part of the LHC's 13.6 TeV.
3. **Carbon electron haze** (approximately faithful in radial shape; the angular structure, chemical bonding and the small inner radial node of the true 2s orbital are simplified away): each haze point is one position sample of one of carbon's 6 electrons, so choose the shell with probability 2/6 for 1s and 4/6 for n = 2.
   - 1s: radial density P(r) ∝ r²·e^(−2Z₁r/a₀), with Z₁ = 5.70. Sample it as a Gamma(3, a₀/(2Z₁)) distribution: r = −(a₀/2Z₁)·ln(u₁u₂u₃). Mean radius ≈ 0.14 Å.
   - n = 2: P(r) ∝ r⁴·e^(−Z₂r/a₀), with Z₂ = 3.25. Sample it as Gamma(5, a₀/Z₂) (the sum of 5 exponentials). Mean radius ≈ 0.81 Å; 90% of samples fall within ≈ 1.3 Å.
   - Directions are isotropic. a₀ = 5.29 × 10⁻¹¹ m. Slater's effective charges agree with Hartree–Fock-fitted values (Clementi–Raimondi: 1s 5.67, 2s 3.22, 2p 3.14) to within about 4%.
4. **Proton and nucleons** (semi-faithful):
   - Charge density ρ ∝ e^(−r/a), with a = r_p/√12 = 0.243 fm, which reproduces r_rms = 0.84 fm. This is close to the classic dipole fit (Λ² = 0.71 GeV² gives a ≈ 0.234 fm, r_rms ≈ 0.81 fm). Sample it as Gamma(3, a).
   - C-12 cluster: place the 12 blob centers with rms radius √(2.470² − 0.841²) ≈ 2.3 fm (for example Gaussian, σ ≈ 1.34 fm per axis), so that blobs of rms radius 0.84 fm add up to the measured 2.47 fm charge radius. Real nucleons overlap heavily; the separated blobs are a cartoon.
   - Valence quarks: Ornstein–Uhlenbeck walks (cartoon). Sea pairs and the gluon fog: cartoon.
5. **The object, one renderer for both modes** (the key rule):
   - The object is a polyline string of physical length ℓ, where ℓ = 0 in Point mode and ℓ = ℓ_s in String mode.
   - It is drawn with a *resolution blur* (a distance-to-polyline glow, which stands in for a true convolution): intensity I(p) = I₀·exp(−d²/2σ²) + I_h·exp(−d/4σ). Here d is the pixel distance to the polyline, and σ = 0.0085·H_px, so the full width at half maximum equals δ = L/50, the instrument's resolution.
   - With ℓ = 0, d reduces to the distance from the center, so **in the renderer, Point mode is simply a string of zero length**. When ℓ/L·H_px ≪ σ, the two modes are pixel-identical: the largest pixel difference is about 0.3·(ℓ_px/σ)·I₀ from the core, plus at most 0.125·(ℓ_px/σ)·I_h from the halo. Test this: for L ≥ 2 × 10⁴·ℓ_s the framebuffers should differ by at most 1/255; at L = 10³·ℓ_s the difference is about 4–5% of peak, below what the eye notices in a toggle.
   - Use these same thresholds for the captions: "unresolved" when ℓ/δ < 0.05, "near edge" for 0.05–1, "resolved" above 1.
   - Peak brightness I₀ is the same in both modes. A cartoon choice: integrated brightness is not conserved.
6. **String shape** (free ends; the mode shapes are faithful, the amplitudes and speed are cartoon):
   - For σ ∈ [0, 1]: x = (σ − ½)·ℓ and y = ℓ·Σₙ₌₁⁴ Aₙ·cos(nπσ)·cos(2π·n·f₁·t + φₙ).
   - A = [0.07, 0.025, 0.012, 0.006], f₁ = `HANDOFF.H1.omega`/2π ≈ 0.35 Hz (so the reveal and H1 share one clock and frequency), and the φₙ are random.
   - Add a z-wiggle with the same modes, phase-shifted by 90°, for parallax.
   - The H1 settle eases (over 1.5 s) into exactly the registry's `openStringFn` motion, scaled to ℓ: y = ℓ·[0.0305·cos(πσ)·cos(ωt) + 0.0171·cos(2πσ)·cos(2ωt + 0.6)] and z = 0.0133·ℓ·cos(πσ)·sin(ωt), with ω = 2.2 rad/s on the shared stage clock. (These are `HANDOFF.H1` amplitude 0.16 × {0.8, 0.45, 0.35} divided by length 4.2.) If the registry changes, the registry wins.
7. **Warmth (color rule):** r = smoothstep(1.0, 3.0, ℓ/δ). Color = mix(Ink `#ECE6D9`, Filament `#FFC98A`, r). Warmth starts only once ℓ exceeds δ, which enforces the site rule: warm light means *resolved*.
8. **Slowdown readout:** N = round(log₁₀((c/ℓ_s)/f₁)). For ℓ_s = 10⁻³⁴ m and f₁ = 0.35 Hz, log₁₀(8.6 × 10⁴²) = 42.9, so N = 43. This is order-of-magnitude only: a quantum string has no single classical frequency, and c/ℓ_s is uncertain by factors of order π.
9. **Exclusion zones:**
   - Size bounds: electron < 2.8 × 10⁻¹⁹ m (LEP); quark < 4.3 × 10⁻¹⁹ m (HERA).
   - LHC dijet searches exclude string resonances below 7.9 TeV (CMS, full 13 TeV Run 2 data), which in those low-string-scale models means ℓ_s ≲ ħc/7.9 TeV ≈ 2.5 × 10⁻²⁰ m.
   - These are rounded to the 10⁻¹⁹ and 10⁻²⁰ m zone edges.
10. **Honest simplifications, stated in the UI's ANALOGY chip:**
    - Real strings have zero thickness and no definite classical shape.
    - The string's size is fuzzy in quantum theory.
    - The resolution blur stands in for scattering experiments.
    - The zone edges are model-dependent.
    - The visible wiggle is a cartoon. Which particle a string would be depends on its quantum state (chapter 2), not on a shape you could see.
    - Any sound is a sonification: strings are not sound waves.

**Micro-copy** (each ≤ 20 words)

- Panel title: "Point or string?"
- Scale label: "FIELD OF VIEW"
- Toggle: "POINT · Standard Model" / "STRING · hypothesis"
- ℓ_s label: "STRING LENGTH ℓs · unknown"
- Unresolved (either mode): "At this zoom, no experiment could tell a point from a string."
- String mode, near edge (ℓ/δ between 0.05 and 1): "At the edge of resolution: the glow starts to stretch."
- Point mode, deep zoom: "A true point never resolves. Zoom forever: still a point."
- String mode, resolved: "You've zoomed past the string's length. Now its shape shows."
- ℓ_s in the excluded zone: "Ruled out: strings this long would already have shown up in collisions."
- ℓ_s in the probed-in-some-scenarios zone: "Partly tested: collider searches exclude this in some models, not all."
- Energy note: "Seeing smaller takes more energy: about ħc divided by the distance."
- Measurement edge band: "EDGE OF DIRECT MEASUREMENT"
- Planck marker: "PLANCK LENGTH · 1.6 × 10⁻³⁵ m"
- ANALOGY chip: "Thickness, glow and speed drawn for visibility. Real strings have no thickness."

**Audio (optional, muted by default; a sonification, `ANALOGY`: strings would make no sound):**
- Each decade crossed gives a soft detent click, and dashed-zone clicks are hollower.
- In Point mode, silence: a point has nothing to vibrate.
- When the string resolves, a tone on 110 Hz. Each harmonic n fades in as its mode's wiggle exceeds the blur. This hints at chapter 2.

## Go deeper

**How do you measure the size of something you can't see?**

Physicists measure the size of the very small by collision: fire a probe at a target and watch how it scatters. At high enough energy, an extended object scatters less than a point of the same charge would (its "form factor" falls off); a true point never shows that shortfall. The finest detail a probe can resolve is set by its energy:

$$\Delta x \approx \frac{\hbar c}{E}$$

**Δx** is the smallest resolvable distance: the lab's **finest-detail readout** (one fiftieth of the **scale gauge**'s field of view). **E** is the probe's energy: the lab's **energy readout**. **ħc** ≈ 197 MeV·fm converts between them. Collisions are how quarks were found: from 1968, electrons fired at protons at SLAC scattered as if from tiny point-like constituents inside.

Where would new structure be expected? Combine the constants of quantum theory, gravity and relativity, and one natural length appears:

$$\ell_P = \sqrt{\frac{\hbar G}{c^3}} \approx 1.6\times10^{-35}\ \text{m}$$

**ħ** carries quantum mechanics, **G** gravity and **c** relativity. Near **ℓ_P** (the **Planck marker** on the gauge), gravity's quantum effects are expected to become strong. Put ℓ_P into the first formula and E comes out near 10¹⁹ GeV, about 10¹⁵ times the LHC's collision energy.

String theory has exactly one adjustable length of its own, the string length (Newton's G is then no longer independent: it follows from ℓ_s, the string coupling and the size of any hidden dimensions):

$$\ell_s = \sqrt{\alpha'} \qquad (\hbar = c = 1;\ \text{some authors include factors such as } 2\pi)$$

**α′** ("alpha-prime") sets the string's tension, T = 1/(2πα′), and its size, and **ℓ_s** is the lab's **string-length slider**. The theory does not fix its value. Experiments require ℓ_s to be below roughly 10⁻¹⁹ m, and traditional estimates put it within a few powers of ten of ℓ_P. For probes with Δx much larger than ℓ_s, string theory's predictions reduce to those of point particles, with corrections too small to see. That is why the reveal can happen only past the edge of what we can measure.

## Glossary

- `order of magnitude`: A factor of ten. Each tick on the scale gauge is one; 10⁻³ m is three orders of magnitude smaller than one meter.
- `probability cloud`: Quantum theory's description of where an electron is likely to be found. It is not a smeared-out electron: each detection finds it in one place.
- `quark`: An elementary particle of the Standard Model. Protons and neutrons each contain three valence quarks. Quarks are never observed alone; the strong force confines them.
- `gluon`: The carrier of the strong force that binds quarks. Most of the proton's mass comes from the energy of its quarks and gluon field, not the quarks' rest masses.
- `Standard Model`: The experimentally tested theory of known particles and three forces (not gravity). It treats particles as point-like excitations of quantum fields.
- `point particle`: A particle with no size and no internal parts. Experiments can never prove zero size; they can only push the upper limit lower.
- `resolution`: The smallest detail a measurement can distinguish. Finer resolution needs a more energetic probe: roughly ħc divided by the distance.
- `Planck length`: About 1.6 × 10⁻³⁵ m, built from the constants of quantum mechanics, gravity and relativity. Quantum-gravity effects are expected near it. It is not a proven smallest length.
- `string`: In string theory, a one-dimensional object with length but no thickness, whose vibrations would appear as particles. Strings can be open (two ends) or closed (loops).
- `string length`: ℓs = √α′, string theory's single adjustable length. Unknown: experiments require it below about 10⁻¹⁹ m; traditional estimates: roughly 10⁻³⁵–10⁻³³ m, just above the Planck length.
- `α′ (alpha-prime)`: String theory's single adjustable scale, with units of length squared. It sets the tension, T = 1/(2πα′), the string length ℓs = √α′, and the rung spacing M² = N/α′.
- `electronvolt`: The energy an electron gains crossing one volt: 1.6 × 10⁻¹⁹ J. A GeV is 10⁹ eV; a TeV is 10¹² eV.

(Editor: `α′` and `electronvolt` now live here, their first appearance: α′ in this chapter's Go deeper, GeV and TeV in this chapter's lab readouts. Chapters 2 and 10 reference them by id. The merged list is `content/glossary.md`.)

## Numbers & facts

**Scales along the zoom**
- **"About 1.7 m" typical adult:** global mean adult height for the 1996 birth cohort is about 171 cm for men and 159 cm for women, so "about 1.7 m" is the men's mean and slightly above the all-adult mean (~1.65 m). Source: NCD Risk Factor Collaboration, "A century of trends in adult human height", *eLife* 5:e13410 (2016), figures as summarized by Our World in Data, https://ourworldindata.org/human-height
- **"Roughly 30 trillion cells":** 3.0 × 10¹³ human cells for a 70 kg reference man (Sender, Fuchs & Milo, *PLoS Biol.* 14:e1002533, 2016); about 36 trillion (male), 28 trillion (female) and 17 trillion (10-year-old child) in Hatton et al., *PNAS* 120:e2303077120 (2023). The older, widely quoted 3.72 × 10¹³ (Bianconi et al., *Ann. Hum. Biol.* 40:463, 2013) is consistent with "tens of trillions". Most of the count is red blood cells.
- **"Cells some 10–20 µm across":** BioNumbers gives cultured human cell-line volumes of about 2000 µm³ (range 500–4000 µm³), which is about 10–20 µm across if spherical (16 µm at 2000 µm³). HeLa cells compacted at confluence are about 20 µm across; red blood cells are 7–8 µm. Source: Milo & Phillips, *Cell Biology by the Numbers*, https://book.bionumbers.org/how-big-is-a-human-cell/ (computed diameters are ours).
- **Visible light 380–750 nm:** conventional limits, which vary by source (roughly 380–400 to 700–780 nm). Source: standard optics references, e.g. https://en.wikipedia.org/wiki/Visible_spectrum
- **B-DNA "two nanometers wide":** diameter about 2.0 nm ("20 Å"). Watson & Crick, *Nature* 171:737 (1953), state that "the distance of a phosphorus atom from the fibre axis is 10 Å", which implies a backbone-to-backbone diameter of about 20 Å; the 2 nm figure is the standard textbook value (https://en.wikipedia.org/wiki/Nucleic_acid_double_helix).
- **Carbon atom "about 10⁻¹⁰ m":** atomic size depends on the definition. Covalent radius is 0.76 Å (Cordero et al., *Dalton Trans.* 2008:2832); van der Waals radius is 1.70 Å (Bondi, *J. Phys. Chem.* 68:441, 1964). That gives a diameter of about 1.5–3.4 × 10⁻¹⁰ m.
- **Bohr radius:** a₀ = 5.29177210544(82) × 10⁻¹¹ m. Source: CODATA 2022, https://physics.nist.gov/cuu/Constants/
- **Slater effective charges for carbon:** Z(1s) = 6 − 0.30 = 5.70; Z(2s, 2p) = 6 − (3 × 0.35 + 2 × 0.85) = 3.25. Source: J. C. Slater, *Phys. Rev.* 36:57 (1930). Cross-check: Clementi & Raimondi, *J. Chem. Phys.* 38:2686 (1963), give 5.6727 (1s), 3.2166 (2s) and 3.1358 (2p).
- **Carbon-12 nucleus:** 6 protons and 6 neutrons. The rms charge radius is 2.4702(22) fm. Source: Angeli & Marinova, *At. Data Nucl. Data Tables* 99:69 (2013). The "r_rms ≈ 2.5 fm" landmark is this value, rounded. Point-nucleon rms radius for the blob centers: √(2.4702² − 0.8408²) ≈ 2.32 fm (computed; neutron and relativistic corrections, below 1%, ignored).
- **"Tens of thousands of times smaller" (atom vs nucleus):** an atom of about 1.5–3.4 × 10⁻¹⁰ m against a nucleus of about 5 × 10⁻¹⁵ m in diameter gives a ratio of roughly 30,000–70,000. Computed from the two entries above.
- **"Four powers of ten with nothing to draw":** log₁₀(10⁻¹⁰ / 5 × 10⁻¹⁵) ≈ 4.3. Computed.
- **Proton rms charge radius:** 0.84075(64) fm. This is a radius, not a diameter. Source: CODATA 2022, Mohr et al., arXiv:2409.03787.
- **Exponential profile:** a = r_p/√12 = 0.243 fm, because an e^(−r/a) density has ⟨r²⟩ = 12a². Computed.
- **Proton mass:** 938.272 MeV/c². Source: CODATA 2022.
- **Quark masses:** m_u = 2.16 ± 0.07 MeV and m_d = 4.70 ± 0.07 MeV (MS-bar scheme at 2 GeV). Source: PDG 2024, Navas et al., *Phys. Rev. D* 110:030001; https://pdg.lbl.gov/2024/tables/rpp2024-sum-quarks.pdf
- **"About 1%":** uud gives 2 × 2.16 + 4.70 = 9.0 MeV, and 9.0 / 938.3 ≈ 0.96%. Computed. The total "quark-mass" contribution to the proton mass, which includes the sea quarks (the sigma terms), is larger: about 9(2)% in lattice QCD (Y.-B. Yang et al., χQCD, *Phys. Rev. Lett.* 121:212001 (2018), arXiv:1710.09011, which also finds quark energy ~31%, gluon field energy ~37% and the trace anomaly ~23%). The on-screen caption claims only the valence arithmetic.
- **SLAC–MIT deep inelastic scattering (1968 onward):** revealed point-like constituents inside protons. Friedman, Kendall and Taylor received the 1990 Nobel Prize in Physics for it. Source: https://www.nobelprize.org/prizes/physics/1990/summary/

**Size limits and the measurement edge**
- **Electron size < 2.8 × 10⁻¹⁹ m (95% CL):** from LEP2 Bhabha scattering (ALEPH, L3 and OPAL data). Source: D. Bourilkov, *Phys. Rev. D* 62:076005 (2000), arXiv:hep-ph/0002172. Beat 4's inset rounds this to "< 3 × 10⁻¹⁹ m".
- **Effective quark radius < 0.43 × 10⁻¹⁶ cm = 4.3 × 10⁻¹⁹ m (95% CL):** the electron is assumed point-like in this analysis. Source: ZEUS, *Phys. Lett. B* 757:468 (2016), arXiv:1604.01280. Shown as "< 4.3 × 10⁻¹⁹ m" (an upper limit must not be rounded down).
- **Commonly quoted "~10⁻¹⁸ m":** this older, conservative round figure for all quarks and leptons agrees with the limits above.
- **Model-dependent bounds not used here:** smaller figures such as 10⁻²² m (Penning trap) or 10⁻²³ m (from g−2) depend on the model and are deliberately not used.
- **String resonances excluded below 7.9 TeV:** from the CMS dijet search at 13 TeV with the full Run 2 data set (137 fb⁻¹). Source: CMS, *JHEP* 05 (2020) 033, arXiv:1911.03947 (the conclusions list "7.9 TeV for string resonances"). The earlier 36 fb⁻¹ result was 7.7 TeV (*JHEP* 08 (2018) 130, arXiv:1806.00843). No higher dijet string-resonance limit from Run 3 was found as of September 2026. This applies to specific low-string-scale models (`SPECULATIVE`), which define M_s = 1/√α′. It converts to ℓ_s ≲ ħc / 7.9 TeV ≈ 2.5 × 10⁻²⁰ m.
- **Measurement-edge band 10⁻¹⁸ to 10⁻²⁰ m:** a design summary of the three entries above, not a single measured number.
- **LHC collision energy:** 13.6 TeV (6.8 TeV per beam) since 5 July 2022. Source: https://home.cern/news/news/physics/lhc-run-3-physics-record-energy-starts-tomorrow

**Constants and ratios**
- **ħc:** 197.3269804 MeV·fm = 1.973269804 × 10⁻¹⁶ GeV·m, exact under the 2019 SI. Source: CODATA.
- **Probe energy check:** ħc / 10⁻¹⁸ m ≈ 197 GeV and ħc / 10⁻¹⁹ m ≈ 2.0 TeV. The lab's readout uses δ = L/50, so at L = 10⁻¹⁸ m it shows ħc / (2 × 10⁻²⁰ m) ≈ 9.9 TeV ≈ 0.73 × 13.6 TeV. Computed.
- **Planck length:** ℓ_P = 1.616255(18) × 10⁻³⁵ m. Source: NIST CODATA, https://physics.nist.gov/cgi-bin/cuu/Value?plkl
- **Planck energy:** 1.220890(14) × 10¹⁹ GeV. Its ratio to 13.6 TeV is about 9 × 10¹⁴, or about 10¹⁵. Sources: CODATA; ratio computed.
- **Decade counts:**
  - Human (1.7 m) to proton radius (0.84 fm): log₁₀(1.7 / 0.84 × 10⁻¹⁵) ≈ 15.3, so "~15 powers of ten".
  - 10⁻¹⁹ m to ℓ_P: ≈ 15.8.
  - 3 × 10⁻¹⁹ m to ℓ_P: ≈ 16.3, so "~16". "About as many as" is used because the measurement edge is fuzzy.
  - Computed.
- **SI prefixes ronto (r, 10⁻²⁷) and quecto (q, 10⁻³⁰):** adopted by the 27th CGPM on 18 November 2022. No SI prefix exists below 10⁻³⁰. Source: https://www.bipm.org/en/-/2022-12-19-si-prefixes

**String scale and history**
- **"We draw it near 10⁻³⁴ m, one traditional estimate":**
  - Weakly coupled heterotic string unification gives M_string ≈ g × 5.27 × 10¹⁷ GeV, with g ≈ 0.7 the unified gauge coupling (Kaplunovsky, *Nucl. Phys. B* 307:145, 1988; erratum *Nucl. Phys. B* 382:436, 1992, arXiv:hep-th/9205068; revised full text arXiv:hep-th/9205070; reviewed in K. R. Dienes, *Phys. Rept.* 287:447, 1997, arXiv:hep-th/9602045). That makes ℓ_s ~ ħc/M_string ≈ 3.7–5.3 × 10⁻³⁴ m for g = 1–0.7. Computed; the exact figure depends on O(1) and 2π conventions relating M_string to α′.
  - Other traditional guesses sit closer to ℓ_P, so "roughly 10⁻³⁵–10⁻³³ m" is this pack's summary of the traditional range, not a single cited number.
  - Background: Zwiebach, *A First Course in String Theory*, 2nd ed. (2009), ch. 1; Polchinski, *String Theory* vol. 1 (1998), ch. 1 (chapter-level citations; section numbers not checked).
- **ℓ_s = √α′, T = 1/(2πα′), and α′ is string theory's only dimensionful parameter:** Polchinski vol. 1, ch. 1, and Tong, *Lectures on String Theory*, arXiv:0908.0333, ch. 1 ("The Classical String"). Chapter-level citations.
- **Classical open-string modes have evenly spaced frequencies (ωₙ = n·ω₁), with cos(nπσ) shapes for free (Neumann) ends:** the light-cone open-string solution in Zwiebach, 2nd ed., ch. 9 ("Light-cone relativistic strings"), and the open-string mode expansion in Tong, arXiv:0908.0333, ch. 3 ("Open Strings and D-Branes"), X ∝ Σ (αₙ/n) e^(−inτ) cos(nσ) for σ ∈ [0, π]. Used for the mode spacing in the prologue and the lab.
- **Slowdown "~10⁴³":** c / 10⁻³⁴ m ≈ 3.0 × 10⁴² Hz, against f₁ ≈ 0.35 Hz on screen: a ratio of 8.6 × 10⁴², so log₁₀ = 42.9 and N = 43. (With the old 0.55 Hz it was 42.7, which also rounds to 43, not 42.) Order of magnitude, computed.
- **"More than fifty years":** Veneziano's amplitude (1968) began the subject; Nambu, Nielsen and Susskind gave the string interpretation (1969–70); Scherk & Schwarz and Yoneya proposed strings as a theory including gravity (1974). Sources: https://en.wikipedia.org/wiki/History_of_string_theory and Zwiebach ch. 1.
- **A quantum string has no definite shape, and its measured size depends on resolution:** zero-point jitter in every mode gives a mean-square size ⟨X²⟩ ~ α′·Σ 1/n, which diverges logarithmically; a measurement with time resolution ε sees ⟨X²⟩ ~ α′·log(1/ε), so the string appears to grow slowly as you look more finely. Source: Karliner, Klebanov & Susskind, "Size and shape of strings", *Int. J. Mod. Phys. A* 3:1981 (1988); see also L. Susskind, *Phys. Rev. Lett.* 71:2367 (1993), arXiv:hep-th/9307168. (Summary checked against papers that cite KKS; the original was not read in full.)

**Design parameters (not physical facts)**
- 80,000 drawn points; the δ = L/50 blur; f₁ = 0.35 Hz (chapter 1 string, = `HANDOFF.H1.omega`/2π) and 0.9 Hz (prologue); the mode amplitudes; the 2.5 m opening field of view; the 70% frame fills; the flicker lifetimes; the Ornstein–Uhlenbeck parameters; the sea-pair rate.

## Pitfalls

1. **The planetary atom.**
   - *Misconception:* electrons circle the nucleus like planets.
   - *Avoided by:* a flicker haze sampled from real radial densities, with no rings or tracks, a caption saying "No planets, no orbits", and detection events that land at single spots.
2. **"The electron cloud is the electron smeared out."**
   - *Avoided by:* the glossary definition and the Beat 2 detection flash. The cloud is where you might find the electron; each detection finds it in one place.
3. **"Atoms are 99.9999% empty space."**
   - *Why it misleads:* the probability cloud fills the atom.
   - *Avoided by:* the dark stretch is captioned "Not empty: the electron cloud reaches in here too", never "empty". (It does not say the cloud is "faint" there: for 1s electrons the density is actually highest at the nucleus. What is small is the chance of finding an electron in so tiny a volume.)
4. **The three-marble proton, and "quarks make the proton's mass".**
   - *Avoided by:* the valence quarks are drawn as wandering points inside a turbulent gluon fog with sea pairs. The 1% rest-mass caption appears on screen.
   - *Nuance kept out of the beat text:* lattice QCD attributes about 9% of the proton mass to quark-mass effects once sea quarks (including strange) are included (Yang et al. 2018; see Numbers), so the pack claims only that the *rest masses of the three valence quarks add up to* about 1%. Do not say "only 1% of the proton's mass comes from the Higgs"; that overstates the case.
5. **Confusing the strong force's "flux tubes" with the strings of string theory.**
   - *History:* string theory was born around 1968–70 as a model of the strong force, which QCD later replaced.
   - *Avoided by:* the gluon field is never drawn as tubes, springs or warm lines, and warm light is reserved for fundamental strings.
6. **Quark "colors" as real colors.**
   - *Avoided by:* the quarks are not tinted red, green or blue, and the ANALOGY chip says "a name, not a color".
7. **"Zooming in" as looking through a microscope.**
   - *Avoided by:* the caption at the light-wavelength marker ("light microscopes blur detail finer than about 200 nm… these are drawings"), the `~ ANALOGY` chips on every stage, and the Go deeper section, which explains that size is measured by scattering.
8. **Point particles as tiny balls, or "zero size is proven".**
   - *Avoided by:* the point is a fixed-size blur glow with no edge, and it never grows.
   - The text says "any size is below…" and the Standard Model "treats" particles as points. The glossary adds that experiments only push the limit lower.
   - Only the conservative, directly measured bounds are quoted.
9. **"Strings have been observed" or "string theory is confirmed".**
   - *Avoided by:* the reveal is `SPECULATIVE ~ ANALOGY`; the gauge reads "HYPOTHETICAL" with hollow marks; the text says "String theory proposes" and "would be"; and a measurement-edge band shows roughly where observation stops (a band, because the limit depends on method).
10. **"The universe is made of strings."**
    - *Avoided by:* this phrasing is used nowhere. The prologue and beats use "proposes", "would", "in this picture".
11. **"Strings are exactly Planck-sized".**
    - *Avoided by:* the text says "Its length is unknown", and the lab makes ℓ_s a slider with experimental exclusion zones. The traditional estimate is labeled as one estimate.
12. **"The Planck length is the smallest possible length" or "the pixel size of space".**
    - *Avoided by:* the glossary says it is where quantum-gravity effects are expected, not a proven minimum. The gauge treats it as a marker, not a wall; the lab's zoom continues past it to 10⁻³⁶ m.
13. **"Strings are inside quarks" or "strings are made of something".**
    - *Avoided by:* the point *itself* unfolds, with no container. The caption reads: "In this picture, the quark itself would be a string."
14. **Strings as tiny rigid rods with a definite shape and size.**
    - *Avoided by:* the ANALOGY chip notes no thickness and no definite classical shape, and the idle jitter hints at quantum fluctuation.
    - The KKS result (a string's measured size grows logarithmically as the resolution sharpens) is cited but kept out of beat text to avoid overload.
    - The drawn wiggle is not what makes a string one particle or another; the ANALOGY chip says so, and chapter 2 handles it.
15. **"Every particle is an open string."**
    - *Avoided by:* the text says "a tiny vibrating string" without committing. The handoff notes that open or closed depends on the version of the theory; chapter 3 introduces both.
16. **A log zoom makes the unexplored gap feel short.**
    - *Avoided by:* the gap brackets compare it directly with the you-to-proton journey, and the dashed rings mark unexplored territory.
17. **"The LHC could just be built bigger to see strings."**
    - *Avoided by:* the energy readout shows a factor of about 10¹⁵. Chapter 10 handles collider-size estimates and indirect tests. The text says "no experiment resolves anything directly", not "nobody has looked", because indirect Planck-scale tests exist.
18. **Hype.**
    - *Avoided by:* none of the banned words appear; "elegant" in the subtitle is the strongest adjective used.

## Handoff

**IN (from `prologue`):**
- **H0**, a single Ink-white glowing point at screen center. It is the prologue's Thread seen from so far away that it can no longer be resolved.
- Chapter 1's first frame is this identical point. It dims into the Field-blue zoom reticle as the human figure assembles around it, with the fingertip reaching the point.
- The chapter later returns to this exact glow at the quark, so the story comes back to where it began.

**OUT (to `vibration`):**
- **H1** is the shared registry pose: render `<HandoffOpenString/>` with default props, at the origin, camera at `HANDOFF.camera` (fov 35°, at (0, 0, 10)), no view shift, at p = 1.00. As of this review, `src/core/handoff.ts` and `src/gl/handoff.tsx` define it as:
  - one horizontal open string of length 4.2 world units (0.666 of the viewport height), centered, in Filament warm light;
  - for σ ∈ [0, 1]: x = (σ − ½)·4.2, y = 0.16·[0.8·cos(πσ)·cos(ωt) + 0.45·cos(2πσ)·cos(2ωt + 0.6)], z = 0.16·0.35·cos(πσ)·sin(ωt), with ω = 2.2 rad/s on the shared stage clock;
  - free-end (Neumann) mode shapes, a blend of the two lowest modes.
  - The registry is the source of truth. If it changes, match it; do not use the numbers above.
- The scale gauge holds its live reading (`1.5 × 10⁻³⁴ m`) and the `STRING · ~10⁻³⁴ m · HYPOTHETICAL` landmark, then fades during the dissolve. (Chapter 2's pack now continues this exact reading, `~10⁻³⁴ m · HYPOTHETICAL`; see Editor notes.)
- Bridge line under the string as chapter 2 dissolves in (≤ 20 words): "One kind of string. So why does the world contain so many different particles?"
- Whether a given particle would be an open or a closed string depends on the version of string theory. Chapter 1 starts with the simplest picture.

## Referee notes

Refereed 2026-09-28. Every number, date and attribution was re-checked against a primary or authoritative source (arXiv abstracts or full text, NIST CODATA, PDG 2024, CERN, BIPM, BioNumbers), and every derived number was recomputed. Corrections made in place:

1. **Slowdown readout was wrong by its own formula.** log₁₀((c/10⁻³⁴ m)/0.55 Hz) = 42.7, which rounds to 43, not 42. With f₁ now 0.35 Hz it is 42.9, so N = 43. (Model 8, Numbers.)
2. **Lab energy readout contradicted the renderer by a factor of 50.** The string shows once ℓ_s > δ = L/50, but the readout used ħc/L, so at the moment of the reveal it showed an energy 50× too low to resolve the string. The readout is now ħc/δ, with a new `FINEST DETAIL` readout. The anchors were recomputed (L = 10⁻¹⁸ m gives 9.9 TeV, about 0.7 × LHC), and the Go-deeper mapping of Δx was updated to match. (Lab readouts, Model 2, Go deeper, Numbers.)
3. **The toggle lesson's threshold was wrong.** At L = 50·ℓ_s the string is one full blur width long, so the capsule glow's half-maximum length is δ + ℓ = 2δ against a width of δ: plainly elongated, not "nothing changes". The corrected thresholds are: no visible change for L ≳ 10³·ℓ_s; framebuffers within 1/255 for L ≥ 2 × 10⁴·ℓ_s (maximum pixel difference ≈ 0.3·ℓ_px/σ from the core, plus at most 0.125·ℓ_px/σ from the halo). A near-edge state and caption were added. (Lab "What changes", Model 5, Micro-copy.)
4. **Warmth started before the string was resolved.** smoothstep(0.5, 3) warms the glow at ℓ = δ/2, which breaks the site rule that warm light means resolved. It is now smoothstep(1, 3). The Beat 6 step values were recomputed from ℓ_s/δ = 50ℓ_s/L. (Model 7, Beat 6.)
5. **H1 did not match the shared pose registry.** The pack had a 0.06ℓ single mode at 0.55 Hz spanning 50% of the width. `src/core/handoff.ts` and `src/gl/handoff.tsx` define H1 as length 4.2 world units (0.666 of the viewport height at `HANDOFF.camera`), a blend of modes 1 and 2 (0.0305ℓ and 0.0171ℓ, plus a 0.0133ℓ z-wiggle), and ω = 2.2 rad/s (0.35 Hz). The Handoff, Model 6, the Beat 6 final step and the scroll-map end value (s_end = log₁₀(ℓ_s/0.666) ≈ −33.82) now follow the registry. The prologue camera is now `HANDOFF.camera` (fov 35°, not 30°) so that its H0 frame matches. The prologue Thread is no longer called "the H1 geometry".
6. **The scroll map disagreed with the beat ranges** by about 0.02 in p, and "hold" was undefined. There are now explicit hold keyframes that land on every beat boundary.
7. **CMS string-resonance limit updated:** 7.7 TeV (36 fb⁻¹) → **7.9 TeV** (137 fb⁻¹, *JHEP* 05 (2020) 033, arXiv:1911.03947; verified in the paper's conclusions). This gives ℓ_s ≲ 2.5 × 10⁻²⁰ m. No Run-3 dijet string limit was found.
8. **An upper limit was rounded down.** The quark radius limit < 4.3 × 10⁻¹⁹ m was shown as "< 4 × 10⁻¹⁹ m", which claims a tighter bound than the measurement gives. It now reads "< 4.3 × 10⁻¹⁹ m".
9. **Cell count:** "about 37 trillion" (Bianconi 2013; 3.72 × 10¹³) → "roughly 30 trillion", per Sender, Fuchs & Milo 2016 (3.0 × 10¹³) and Hatton et al. 2023 (≈36 T male, 28 T female).
10. **Cell size source misquoted.** BioNumbers does not give "10³–10⁴ µm³". It gives cell-line volumes of 500–4000 µm³ (rule of thumb 2000), which still supports 10–20 µm if spherical (16 µm at 2000 µm³). The source line now reports what the page says.
11. **Height** verified: NCD-RisC 1996 cohort, 171 cm (men) and 159 cm (women), per Our World in Data. "About 1.7 m" is the men's mean and is kept as "about".
12. **Microscope caption overclaimed.** "Below a wavelength of light, images become reconstructions" was replaced. The optical (Abbe) limit is about half a wavelength (~200 nm), and electron microscopes do form real images. New caption: light blurs detail below about 200 nm; smaller things are measured with electrons, X-rays or collisions; these are drawings.
13. **"Electron cloud… too faint to show" was misleading** near a nucleus, where the 1s density is actually at its maximum. The caption now says "Not empty: the electron cloud reaches in here too." Pitfall 3 was updated to match.
14. **Carbon model:** "faithful in radial shape" → "approximately faithful". Slater orbitals omit the 2s radial node. The vague "good to 10–20%" was replaced by a verified Clementi–Raimondi cross-check (5.67 / 3.22 / 3.14 vs Slater's 5.70 / 3.25, within about 4%). The ambiguous "draw 6 electron samples" wording was clarified. Mean radii were added (1s ≈ 0.14 Å, n = 2 ≈ 0.81 Å).
15. **C-12 cluster placement specified:** blob centers go at rms radius √(2.470² − 0.841²) ≈ 2.3 fm, so that the convolved charge radius is the measured 2.47 fm. The landmark is relabeled `r_rms`.
16. **Proton-mass nuance (Pitfall 4):** "somewhat more than 1%" → about 9(2)% for all quark-mass effects. Source: Yang et al., χQCD, *PRL* 121:212001 (2018), which also gives quark energy ~31%, gluon field energy ~37% and trace anomaly ~23%. The on-screen 1% caption (valence arithmetic, 9.0/938.3 = 0.96%, PDG 2024 masses verified) is unchanged.
17. **"Exactly like a point" → "just like a point"** in the prologue caption and the lab purpose. The low-energy reduction to point particles is DERIVED but approximate: corrections scale as powers of ℓ_s/Δx.
18. **Prologue P1:** "far smaller than anything we can measure" → "too small for any experiment so far to resolve". The string scale is unknown, and in low-scale scenarios it could lie just beyond current reach.
19. **Thesis:** "String theory's founding proposal" was historically wrong: the theory was founded (1968–70) as a model of the strong force. It is now "central proposal", with the history noted.
20. **Beat 6:** "for about 30 decades the point has refused to grow" → about seventeen (the quark appears near s ≈ −15). The text now says "each point particle would be" and "would look". The micro-caption now says "the quark itself *would be* a string" (SPECULATIVE voice).
21. **Go deeper:** "String theory adds one new constant" was misleading, because in string theory G is not independent. It now reads "one adjustable length of its own", with a note on G. Other fixes: a convention caveat on ℓ_s = √α′; T = 1/(2πα′) added; the scattering sentence recast in terms of form factors (point-particle cross sections also fall with energy); "with corrections too small to see" added to the low-energy statement.
22. **KKS citation:** "smooth shapes but a divergent average size" was inaccurate. Quantum strings have no smooth definite shape; the mean-square size is α′·Σ1/n, which is log-divergent, and grows as α′·log(1/ε) with the time resolution ε. Susskind, *PRL* 71:2367 (1993), was added as a secondary source.
23. **Textbook citations fixed:** Tong's open-string mode expansion is in ch. 3 ("Open Strings and D-Branes"), not ch. 1. Zwiebach's light-cone open-string solution is in ch. 9. Chapter-level citations are marked as such. The Kaplunovsky erratum is arXiv:hep-th/9205068 (hep-th/9205070 is the revised full text). The Kaplunovsky number is now given precisely (g × 5.27 × 10¹⁷ GeV; reviewed by Dienes 1997), and the ℓ_s range recomputed as 3.7–5.3 × 10⁻³⁴ m.
24. **Watson & Crick attribution:** the paper states only the 10 Å phosphorus-to-axis distance (quoted verbatim). The 20 Å diameter is labeled as inferred.
25. **Sonification flagged as ANALOGY** everywhere audio appears: strings are not sound waves in a medium. The prologue idle tremble's 1/n² fall-off is flagged: real zero-point jitter falls as 1/√n per mode. An ANALOGY bullet was added saying the drawn wiggle is not what determines particle identity.
26. **CSP note:** the human-figure mesh must be bundled or generated procedurally, with no network fetch.

**Verified and left unchanged:**
- CODATA 2022 values: r_p = 0.84075(64) fm, ℓ_P = 1.616255(18) × 10⁻³⁵ m, a₀ = 5.29177210544(82) × 10⁻¹¹ m, and E_P = 1.220890(14) × 10¹⁹ GeV.
- ħc (exact) and every probe-energy and decade-count computation.
- PDG 2024 quark masses: 2.16 ± 0.07 and 4.70 ± 0.07 MeV.
- Bourilkov 2000 electron size < 2.8 × 10⁻¹⁹ m (95% CL), from the abstract.
- ZEUS quark radius < 0.43 × 10⁻¹⁶ cm, from the abstract.
- C-12 radius 2.4702(22) fm (Angeli & Marinova 2013).
- Covalent radius 0.76 Å (Cordero 2008) and van der Waals radius 1.70 Å (Bondi 1964).
- Slater Z_eff, the Gamma-sampling formulas, and a = r_p/√12.
- LHC Run 3 at 13.6 TeV from 5 July 2022 (CERN).
- Ronto and quecto adopted 18 November 2022 (27th CGPM, BIPM).
- SLAC–MIT and the 1990 Nobel Prize, and the string-history dates.
- Free-end cos(nπσ) modes with ωₙ = n·ω₁.

**Status chips:** all checked; no chip changes were needed. The zoom is OBSERVED with ANALOGY stages. Beat 5 is OBSERVED (limits and arithmetic). The reveal and the String mode are SPECULATIVE ~ ANALOGY. The point-like low-energy limit is DERIVED ~ ANALOGY.

**Pedagogy:** all beats are ≤ 45 words (maximum 43) and all lab micro-copy is ≤ 20 words (maximum 12). Every beat has a concrete Stage. None of the banned words appear.

**Open items for other packs:**
- (a) Chapter 2 (`02-vibration.md`, Handoff IN) expects the gauge to read `~10⁻³³ m (assumed)` and H1 "about 55% of viewport width, amplitude ~4%". Neither matches the registry or this pack (10⁻³⁴ m; 0.666 of the viewport height ≈ 37% of the width at 16:9; 3% + 1.7% amplitudes). Chapter 2 should be aligned.
- (b) The registry's H1 length (0.666 × viewport height) overflows the width on portrait phones (about 145% of the width at 9:19.5). That is a registry issue, not this pack's, but it will clip this chapter's final frame on phones.

## Editor notes (cross-chapter pass, 2026-09-28)

Narrative-editor pass across all twelve packs. Referee corrections above are untouched; these edits only align this pack with its neighbours.

1. **Open item (a) resolved.** Chapter 2 now opens on the registry H1 at `HANDOFF.camera` and continues this chapter's gauge reading, `~10⁻³⁴ m · HYPOTHETICAL`. Its GeV readouts now assume M_s = 10¹⁸ GeV (ħc/M_s ≈ 2 × 10⁻³⁴ m), so the drawn length and the assumed energy agree to within the stated convention spread. Site-wide fiducial: strings drawn near 10⁻³⁴ m; traditional estimates ten to thirty times below the Planck energy; the true value unknown.
2. **Open item (b) still open.** H1's length overflows portrait phones. This needs a registry fix (`handoffFit`), not a content fix.
3. **Prologue P2** now carries a status chip (`ANALOGY ~`). VISION requires one on every beat.
4. **Glossary homes.** `α′` (first explained in this chapter's Go deeper) and `electronvolt` (first shown in this chapter's lab readouts) now live here. Chapters 2 and 10 reference them.
5. **`string length` glossary** now states the traditional range numerically ("roughly 10⁻³⁵–10⁻³³ m, just above the Planck length"), using this pack's own Numbers summary. Chapter 10's Ruler band uses the same range.
