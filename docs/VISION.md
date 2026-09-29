# The String Hypothesis — Vision

An explorable, scroll-driven journey that teaches string theory **visually and honestly** to someone with high-school physics.
The site should feel like an interactive science-museum exhibit crossed with a space documentary and an Apple product page. It should not feel like an article with animations added.

The visitor should leave thinking *"I finally understand why string theory is such an interesting idea."* They should **not** leave thinking it has been experimentally confirmed.

---

## 1. The protagonist: the Thread

One recurring object carries the story: **the Thread**, a single luminous string. It's a warm-white filament of light with a soft amber halo.
It is born from a point particle, vibrates, sweeps out worldsheets, closes into a loop, becomes the graviton, winds around hidden dimensions, attaches to branes, and returns in the epilogue.
Every chapter is a new camera on the same idea.

Recurring visual metaphors:
- **Point of light**: a point particle, the thing the Thread is born from and can collapse back into.
- **The Thread**: strings. Warm filament light (`--filament`). Only strings glow warm.
- **Hairline diagram language**: thin cool-blue lines, tick marks, arrows and small mono annotations with real units, like figures in a physics paper drawn in light (`--field`).
- **The spacetime grid**: faint blue grids that curve, become worldsheets, become branes, and become lattices with a tiny curled circle at every point.
- **Epistemic marks** (below): every claim wears its status.

## 2. Voice

- Calm documentary narrator. Short sentences. Concrete images. Never hype: the words "revolutionary", "mind-blowing", "proves" and "theory of everything" (as a fact) are banned.
- Headlines are **questions**, and each chapter answers about one question.
- Beat text is **≤ 45 words**. Lab micro-copy is **≤ 20 words**. Depth goes into optional **Go deeper** drawers.
- Equations only when they add understanding. Tie them to the screen (terms highlight as the visualization changes).
- Say "string theory proposes / suggests / in string theory…", never "the universe is made of strings".

## 3. Epistemic status system (used everywhere)

Each beat, lab and claim carries a small status chip. The chip encodes status in form as well as color.

| Chip | Meaning | Form |
|---|---|---|
| `OBSERVED` | Experimentally established physics (QM, GR, Standard Model, measured numbers) | solid dot ● |
| `DERIVED` | Mathematically established from theory (usually *within string theory*; occasionally semi-classical GR+QFT results such as Bekenstein–Hawking entropy): follows from the equations, but untested in nature | half dot ◑ |
| `CONJECTURED` | Strong theoretical evidence, not proven (e.g. AdS/CFT, M-theory's existence, S-duality in general) | dashed ring ◌ |
| `SPECULATIVE` | A possible scenario or interpretation (braneworlds, landscape/multiverse, low string scale) | hollow ring ○ |
| `ANALOGY` | The visual is a metaphor or cartoon, not literal. Always flag cartoons (e.g. "not to scale", "a 3D shadow of a 6D shape") | tilde ~ |

## 4. Chapters (IDs fixed)

| # | id | Question | Core idea | Signature interaction |
|---|---|---|---|---|
| 0 | `prologue` | (hero) | The Thread trembles in the dark; title "The String Hypothesis". Show the page at rest immediately | Hover or drag near the Thread to pluck it |
| 1 | `scale-down` | What is everything made of? | A continuous logarithmic zoom: human → cell → molecule → atom → nucleus → proton → quarks → points. "What if they aren't points?" A point unfolds into a string: the reveal | Scroll-scrubbed zoom with a live scale readout (10⁰ m → 10⁻³⁵ m); toggle point ↔ string |
| 2 | `vibration` | How can one kind of thing look like many particles? | Vibration modes → properties (mass, spin, charge). From far away a vibrating string looks like a point particle with properties | Pluck/drag the string, pick modes, hear harmonics (muted by default), mass ladder, zoom-out-to-point view |
| 3 | `worldsheet` | What does a string do as it moves through time? | Open vs closed strings; worldline vs worldsheet; interactions as smooth surfaces (pants diagram) with no single point where they happen | 3D rotatable spacetime diagram with a time scrubber; tilt the "now" slicing plane to see the split point move |
| 4 | `gravity` | Why did physicists take strings seriously? | Four forces; QFT describes three superbly; gravity resists quantization at Planck energies. Closed strings *necessarily* contain a massless spin-2 state, which behaves as the graviton | Force explorer; ring of test particles stretched and squeezed (+/× polarizations) alongside the closed-string spin-2 mode |
| 5 | `dimensions` | Where would extra dimensions hide? | Lineland → Flatland → 3D; the ant on a cable; a tiny circle at every point; superstrings need 9+1 dimensions for consistency | Dimensionality slider; zoom from "cable looks 1D" to "cable is a cylinder"; Kaluza–Klein wave that must fit around the circle |
| 6 | `calabi-yau` | What shape could the hidden dimensions have? | Calabi–Yau shapes; geometry and topology affect which vibrations exist, and so the physics we'd see. There are an enormous number of candidates, and none is known to be ours | Rotatable Hanson-style quintic cross-section: change degree n, rotate through the hidden 4th direction, trace loops/cycles |
| 7 | `branes` | Where do open strings end? | D-branes: open-string endpoints stick to branes, while closed strings (including gravitons) roam the bulk. Braneworld pictures are speculative | Fly the camera off the brane; drag branes apart and watch stretched strings get heavier |
| 8 | `duality` | Can two different worlds be the same? | T-duality: a string on a circle of radius R is indistinguishable from one on radius α′/R. Momentum ↔ winding swap. Two descriptions, one physics | Radius slider on a log scale with a live mass spectrum and a highlighted mass formula; the two pictures morph into each other |
| 9 | `m-theory` | Five theories, or one? | Type I, IIA, IIB, heterotic SO(32), heterotic E8×E8, each an island; dualities bridge them; pull back to reveal limits of one larger structure (M-theory, plus 11D supergravity). Not fully understood | Toggle dualities as bridges; camera pull-back reveal |
| 10 | `scale-problem` | Why haven't we seen a string? | Planck length is ~10⁻³⁵ m; the energy needed to probe it is ~10¹⁵× beyond the LHC. Why direct observation is so hard, and what indirect tests exist | Logarithmic universe-scale explorer (observable universe → Planck length) with an energy axis and collider-size estimate |
| 11 | `knowledge` | What do we actually know? | Three zones: Established physics / Strong theoretical results / Open questions. Epilogue: the Thread returns | Hover/tap claims; a final pluck |

## 5. Visual language (tokens)

Single, deliberate dark world (deep space + mathematical light). No light theme.

- **Void** `#05070B`: the ground (blue-biased near-black)
- **Abyss** `#0B0F17`: raised panels (used translucent)
- **Ink** `#ECE6D9`: primary text (warm paper-white)
- **Ink-2** `#9AA0AE`: secondary text; **Ink-3** `#707B92`: small labels, units, mono text (≥ 4.5:1 on Void); **Ink-4** `#5C6270`: hairlines, ticks and marks only (not text)
- **Filament** `#FFC98A` (core `#FFF6E8`): strings only
- **Field** `#86A8D8`: diagram lines, grids, geometry, spacetime
- Status colors: OBSERVED `#ECE6D9`, DERIVED `#86A8D8`, CONJECTURED `#A99BD6`, SPECULATIVE `#7D8190`

Type:
- **Display**: *Bodoni Moda*, large, high-contrast hairline serifs that echo thin strings and the modern-style faces of physics papers (Computer Modern lineage). Italics for the big questions.
- **Body/UI**: *Hanken Grotesk*.
- **Data/labels**: *IBM Plex Mono*, uppercase with tracking, tabular digits, real units (10⁻³⁵ m, GeV, α′).
- **Math**: KaTeX.

Layout: a fixed full-bleed WebGL stage. Narrative beats are a narrow column (~34ch) with generous negative space. A right-edge chapter rail shows progress through the journey. A left-edge **scale gauge** (desktop) reads the characteristic length scale of the current scene in meters. Labs dock hairline "instrument panels" (glass, 1px borders, mono labels). Go-deeper opens a side drawer.

Motion: slow, weighted, physical. Scroll scrubs the narrative, labs invite play. No scroll-jacking. Respect `prefers-reduced-motion`.

Avoid: generic SaaS cards, neon overload, sci-fi HUD clichés, stock imagery, walls of text, planetary atom orbits, glowing-everything.

## 6. Stage architecture (summary; see ARCHITECTURE.md for contracts)

- One WebGL canvas. Each chapter owns a **scene in its own portal with its own camera**. A compositor renders the active chapter directly and cross-dissolves two chapters during transitions (render targets only during transitions).
- Chapters read `progress` (0–1 through the chapter's scroll section) and `presence` (0–1 visibility) every frame, without React re-renders.
- **Handoff frames**: canonical poses (point of light, open string, closed loop) that adjacent chapters share, so dissolves read as one continuous object.
- Each chapter = `Scene` (3D) + `Overlay` (DOM beats, lab panel, go-deeper) + `Fallback` (static SVG for no-WebGL).
- Only the active chapter ±1 is mounted, and chapters are code-split.

## 7. Performance budget

60 fps on an M1 laptop and a mid-range phone at the medium tier. Per scene: ≤ 150k triangles, ≈ ≤ 60 draw calls, no per-frame allocations, and instancing for particles. The GPU does the heavy lifting in shaders. DPR tiers are 2 / 1.5 / 1. The low tier gets no transitions or particles.
