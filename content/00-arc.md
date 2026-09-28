# 00 · The Arc: one Thread, twelve cameras

The source of truth for how the twelve steps (prologue + 11 chapters) connect. Chapter packs (`01`–`11`) hold each chapter's refereed copy. This file holds what runs *between* them: the arc, the handoffs, the motifs and the callbacks. Glossary homes live in `glossary.md`.

---

## The arc in one paragraph

A single luminous Thread trembles in the dark, flagged at once as a picture of an idea, and stepping back shrinks it to a point. Chapter 1 follows that point down from a fingertip through cells, atoms and protons to the edge of measurement, where particles have refused to grow for seventeen decades. There the point resolves into a vibrating string: the site's first warm light and string theory's central proposal. Chapters 2–4 ask what such a string would *do*:
- its vibration states, seen from afar, would look like many particles (2);
- its history is a smooth surface with no single moment of interaction (3);
- a closed loop cannot avoid containing a graviton, which is why physicists took the idea seriously (4).

That gift has a price, extra dimensions, and Chapters 5–7 explore the room strings would need: where dimensions could hide (5), what shape they might take (6), and the branes where open strings end (7). Chapters 8–9 then show that very different pictures can be one physics, until five rival theories look like the limits of a single conjectured M-theory. Having climbed from measured ground to conjecture, the story turns to reckoning. Chapter 10 measures the gap between us and the Planck length: a collider some 2,500 light-years around. Chapter 11 sorts every claim by its distance from experiment, demands a measurement, and watches the Thread go out. Then it is plucked one last time, *still waiting for nature's answer*.

**The escalation.** The six movements, in order:
1. **Scale** (0–1)
2. **Behaviour** (2–3)
3. **Motivation** (4)
4. **Room** (5–7)
5. **Unity** (8–9)
6. **Reckoning** (10–11)

The dominant chip climbs as the story goes. Chapter 1's zoom is `● OBSERVED`. Chapters 2–8 are `◑ DERIVED`, with Chapters 5 and 7's braneworld asides `○ SPECULATIVE`. Chapter 9 is `◌ CONJECTURED`. Chapters 10–11 then drop back to `● OBSERVED` verdicts about the evidence. The visitor feels the ladder of certainty rise and then deliberately fall.

---

## Chapter map

Handoff poses (ARCHITECTURE §4, `src/core/handoff.ts`):
- **H0**: point of light (`<HandoffPoint/>`)
- **H1**: free-ended open string (`<HandoffOpenString/>`)
- **H2**: closed loop (`<HandoffLoop/>`)

All handoff frames use `HANDOFF.camera` with no view shift. Every OUT below matches the next chapter's IN (checked pack to pack in this pass).

| # · id | Question | The aha (one per chapter, all distinct) | IN → OUT | Signature interaction |
|---|---|---|---|---|
| 0 · `prologue` | *(hero: "The String Hypothesis")* | No aha yet. A trembling Thread, then the setup line "Step back far enough, and a string would look just like a point. Hold that thought." | at rest → **H0** | Hover to nudge, drag and release to pluck the Thread (harmonics of 110 Hz, muted by default) |
| 1 · `scale-down` | What is everything made of? | The quark-sized point that never grew for ~17 decades resolves, with no cut, into a vibrating string: "the quark itself would be a string" (`○ ~`) | **H0** → **H1** | Scroll-scrubbed log zoom (1.7 m → 10⁻³⁴ m) with live gauge. Lab *Point or string?*: zoom slider, point ↔ string toggle, string-length slider with exclusion zones |
| 2 · `vibration` | How can one kind of thing look like many particles? | Step back: each vibration state blurs into a point carrying only mass, spin and charge. One kind of string, many "particles". The twist: every known particle would sit on the massless bottom rung | **H1** → **H0** | *The Vibration Bench*: pluck (snaps to whole packets), harmonic chips, mass ladder, viewing-distance slider to far view, particle drawer |
| 3 · `worldsheet` | What does a string do as it moves through time? | No single moment of splitting: tilt "now" and the pants' pinch slides, while a particle vertex never moves. Interactions are smooth surfaces | **H0** → **H2** | *The Now-Slicer*: scrub "now", tilt and rotate the slicing plane, paint the smear of split points |
| 4 · `gravity` | Why did physicists take strings seriously? | A closed loop's first vibration carries two arrows whose pattern locks in step with a gravitational wave's + and ×: massless spin 2. Gravity was forced, not inserted | **H2** → **H2** | *Spin Lab · Ring & Loop*: spin 0/1/2 selector, rotate the pattern ψ, ring and loop driven by one tile ε |
| 5 · `dimensions` | Where would extra dimensions hide? | A wave around a hidden circle must fit whole wavelengths. Shrink the circle and the tower of heavy copies climbs out of reach: a small dimension hides by being too costly to excite | **H2** → **H2** (+15% lattice) | *The Hidden Circle*: COUNT (dimension stepper, force law, orbit), ZOOM (cable → cylinder), FIT (wavelength k, radius R with exclusion zones) |
| 6 · `calabi-yau` | What shape could the hidden dimensions have? | Count the holes, count the families: in the simplest recipe the quintic gives 100 generations against the 3 we observe | **H2** → **H2** | *Turn the shadow*: degree n, hidden rotation α, squash (topology frozen), wrap a string and try to shrink it |
| 7 · `branes` | Where do open strings end? | Push two branes together and the stretched strings turn massless: U(1)×U(1) → U(2). The Higgs mechanism drawn as geometry, where a distance becomes a mass | **H2** → **H2** (+10% brane grid) | *Brane Bench*: fly from on-brane to bulk view, drag branes, draw strings; live mass gauge and N×N string matrix |
| 8 · `duality` | Can two different worlds be the same? | Circles of radius R and α′/R give identical spectra, with momentum and winding trading places: "Two pictures. One spectrum." | **H2** → **H2** (+optional 8% seam) | *The Circle Swap*: log radius slider, "Jump to the dual world" (no bar moves a pixel), point-particle mode fails |
| 9 · `m-theory` | Five theories, or one? | Turn up Type IIA's coupling and a Kaluza–Klein ladder descends: the coupling was the size of an eleventh dimension (`◌`). Pull back: six tips of one landmass | **H2** → **H2** | *The Duality Atlas*: toggle T / S / lift bridges and count the pieces, pull back to reveal the shelf, coupling dial per island |
| 10 · `scale-problem` | Why haven't we seen a string? | Build it bigger? A Planck-energy ring with LHC magnets would be ~2,500 light-years around. The smallest target demands the largest machine, and synchrotron loss and a black-hole floor stand behind it | **H2** → **H0** | 62-decade Ruler (Chapter 1's zoom, reversed). Lab *How big a machine?*: drag probe distance, switch magnets / linear / plasma, watch the machine outgrow the solar system |
| 11 · `knowledge` | What do we actually know? | Demand a measurement: the evidence ceiling descends and the Thread, the site's only warm light, goes out. Not one string-specific claim rests on measured ground | **H0** → **H1** (final rest) | *Referee's Bench*: evidence-ceiling slider, judge nine claims (tokens slide to their true tier), the final pluck |

**Bridge lines** (≤ 20 words, under the handoff object during the dissolve):
- 1 → 2: "One kind of string. So why does the world contain so many different particles?"
- 10 → 11: "Then what, exactly, do we know, and what are we still guessing?"

Every other chapter's first beat names the previous chapter explicitly:
- 2: "Chapter 1 ended on a proposal"
- 5: "The closed string from the last chapter"
- 6: "Chapter 5 hid one dimension"
- 7: "Chapter 3 met two kinds of string"
- 9: "Chapter 8 found two pictures"
- 10: "So far we have built a picture"
- 11: "Ten chapters, one idea"

Chapters 3 and 4 open on the handed-off object itself: the point, and the loop.

---

## Site-wide constants fixed in this pass

Every pack now agrees on these. Use them, not older values quoted in a referee note.

| Quantity | Site value | Where it shows |
|---|---|---|
| Drawn string length | **~10⁻³⁴ m**, labelled `HYPOTHETICAL` / SPECULATIVE | Ch. 1 reveal and gauge, Ch. 2 gauge, Ch. 3–4 gauge secondary line (`~10⁻³⁴ m if traditional estimates hold`), Ch. 10 gauge and string curve |
| Assumed string scale for GeV readouts | **M_s = 10¹⁸ GeV** (ℓ_s = ħc/M_s ≈ 2 × 10⁻³⁴ m), always tagged "assumed · unknown" | Ch. 2 bench and particle table, Ch. 7 lab energy option |
| Traditional estimate, in words | "ten to thirty times below the Planck energy" (Kaplunovsky ≈ 4–5 × 10¹⁷ GeV; ~10¹⁸ GeV to order of magnitude); traditional band 10⁻³⁵–10⁻³³ m | Ch. 2 chip, Ch. 10 Ruler band and heterotic preset, glossary `string scale` / `string length` |
| Planck length / energy | 1.6 × 10⁻³⁵ m / 1.22 × 10¹⁹ GeV | Ch. 1, 4, 5, 10, 11 |
| LHC | 13.6 TeV (Run 3, ended June 2026); resolution ~10⁻¹⁹ m in practice | Ch. 1, 2, 4, 5, 10, 11 |
| Planck ÷ LHC | ~10¹⁵ (8.98 × 10¹⁴) | Ch. 1 Go deeper, Ch. 4, 10, 11 E2 |
| String-resonance limit | > 7.9 TeV (CMS, specific low-scale models) | Ch. 1, 2, 7, 10 |
| Short-range gravity | 1/r² holds to 52 µm; one gravity-only circle < 30 µm | Ch. 5, 7 (stage card), 10, 11 |
| Critical dimension | 10 (superstring, flat space); 26 (bosonic) | Ch. 4 outro, 5, 9, 11 |
| Gravity ÷ electric (two protons) | ≈ 8 × 10⁻³⁷ (≈ 1/10³⁶) | Ch. 4 Beat 1, Ch. 7 Beat 6 card |

The on-screen chapter style is "Chapter 5" in text and "Ch. 5" in chips, never "Chapter 05".

---

## Recurring motifs

1. **The Thread, and "only resolved strings glow warm".** The one warm light on the site. Wherever it appears, it means a string that has been *resolved*:
   - Prologue: the Thread.
   - Ch. 1: the reveal's warmth, which starts only past ℓ/δ = 1.
   - Ch. 2: the bench string.
   - Ch. 3: only the *current* slice of a worldsheet glows.
   - Ch. 4: the parked loop becomes the graviton.
   - Ch. 5: the small Thread "reminding us what needs the room".
   - Ch. 6: the probe, then a string wrapped on the slice.
   - Ch. 7: strings on branes. The branes themselves are Field blue.
   - Ch. 8: the wound coil. Winding swatches are flat amber, never glowing.
   - Ch. 9: island residents, and the Thread opening into the M2 tube.
   - Ch. 10: warm *only* in the opening frame and inside the Beat 4 magnifier.
   - Ch. 11: strung through the ◑ and ◌ tiers, frays in the fog, goes out at the aha, returns for the final pluck.
2. **The point of light (H0), and "step back and a string is a point".**
   - Prologue: the transition caption.
   - Ch. 1: the quark that never grows.
   - Ch. 2: the Beat 4 aha, and the exit pull-back.
   - Ch. 3: the opening point, the "H0 echo" particle.
   - Ch. 5: the loop collapses to a point, then "we can't see the circling, we can weigh it".
   - Ch. 7: a stretched string seen from the brane is a single heavy bead.
   - Ch. 10: the opening pull-back and the outro "From where we stand, a string would look just like a point".
   - Ch. 11: the point becomes the Standard Model node; E1 shrinks the whole map to one point; E3 unfolds it again.
3. **Resolution costs energy (Δx ≈ ħc/E).**
   - Ch. 1: the lab's `FINEST DETAIL` and `PROBE ENERGY` readouts.
   - Ch. 2: the far-view LHC tick.
   - Ch. 5: the ZOOM bridge, "zooming in means colliding at ħc/R".
   - Ch. 8: circles smaller than √α′ are not "seen" by strings.
   - Ch. 10: the chapter's engine, from the Beat 3 "Recall Chapter 1" onward.
4. **The ladder of rungs, where energy becomes mass.**
   - Ch. 2: rungs equally spaced in M² = N/α′.
   - Ch. 5: the Kaluza–Klein tower, n/R.
   - Ch. 6: the zero rung stays pinned while upper rungs slide.
   - Ch. 7: the stretched-string ladder √((d/2π)² + n).
   - Ch. 8: momentum and winding ladders, then the seam ladder that never breaks.
   - Ch. 9: the D-particle ladder n/g fusing into a continuum.
   - Audio doubles the motif as harmonic series in Ch. 2, 5 and 9.
5. **The wave that must fit (whole wavelengths).**
   - Ch. 2: harmonics.
   - Ch. 5: the echo-lap fit, the chapter aha.
   - Ch. 6: the drum inset and zero-wiggle patterns.
   - Ch. 8: momentum modes, "echoing Chapter 5's fit".
   - Ch. 9: rung n = wavelengths around the eleventh circle.
6. **The spacetime grid.** The hairline grid changes role as the story goes:
   - Ch. 3: floor, worldsheets drawn as iso-grid film.
   - Ch. 4: a bent grid, then ripples.
   - Ch. 5: a lattice with a tiny circle at every node.
   - Ch. 6: the flat torus square.
   - Ch. 7: brane sheets.
   - Ch. 8: hidden-circle cylinders.
   - Ch. 9: the sea grid over the moduli map.
   - Ch. 11: measured ground.
7. **A tiny circle at every point.**
   - Ch. 2 Beat 6 preview: a wrapped loop, `CH. 5, 8`.
   - Ch. 5 Beats 3–4.
   - Ch. 6 opening: circle → torus → six axes.
   - Ch. 8 cylinders.
   - Ch. 9: the lattice returns and the eleventh dimension opens as a tube.
8. **The logarithmic gauge and decade rings.**
   - Ch. 1: the zoom in.
   - Ch. 2: far view to "LHC RESOLUTION".
   - Ch. 4: the gauge sweeps 10⁻¹⁵ → 10⁻³⁵ m for the 1974 proposal.
   - Ch. 10: the Ruler, Chapter 1's zoom reversed, and the ring that stays fixed while the world shrinks.
   - The gauge reads `null` or `—` where no length applies: Ch. 5 (partly), 6, 8, 9, 11.
9. **Open ↔ closed.**
   - Ch. 1: "open or closed depends on the version".
   - Ch. 3: open strings imply closed ones.
   - Ch. 4: one arrow (open) vs two arrows (closed).
   - Ch. 7: two open strings in, one open plus one closed loop out.
   - Ch. 9: Type I has both; heterotic has only closed.
10. **Two descriptions, one thing.**
    - Ch. 4: ring and loop in lockstep, `SAME PATTERN`.
    - Ch. 8: the seam between WORLD A and WORLD B, and the dictionary.
    - Ch. 9: bridges between islands.
    - Ch. 11: the dashed `≠` link between real black holes and idealized ones, the one place where two things are *not* the same.
11. **Geometry becomes mass.**
    - Ch. 5: smaller circle, heavier echoes.
    - Ch. 7: distance × tension = mass.
    - Ch. 8: winding energy grows with R.
    - Ch. 9: coupling = size.
12. **The epistemic chips as scenery.** Every beat wears ● ◑ ◌ ○ ~, starting with the prologue status key and P2's "Every claim here wears a mark".
    - Ch. 1: the gauge's marks turn hollow (○) at the reveal.
    - Ch. 9: bridge line styles encode status, solid causeways (◑) vs dashed arches (◌).
    - Ch. 11: the chips *become* the map (height = distance from experiment), then the grace note ● ◑ ◌ ○ on the final pluck.
13. **The pluck and 110 Hz** (sonification, muted by default, always flagged `ANALOGY`).
    - Prologue: the first sound.
    - Ch. 1: a single tone when the string resolves.
    - Ch. 2: the bench harmonics.
    - Ch. 3: reuses Ch. 2's timbre.
    - Ch. 5 and 9: tower chords.
    - Ch. 11: the final pluck uses the prologue model, so "the last sound of the site is the first".
14. **"Hypothesis" and "elegant, untested".**
    - Prologue subtitle: "an elegant, untested idea".
    - Ch. 11 E3: "The title called it a hypothesis. It still is one: elegant, consistent wherever anyone has checked, and unconfirmed."

---

## Cross-chapter callbacks (setup → payoff)

1. **Prologue**, "Step back… a string would look just like a point. Hold that thought." → **Ch. 1** Beat 6 reveals the point as a string, and **Ch. 2** Beat 4 steps back again as the aha.
2. **Ch. 1**'s never-growing point (same pixels as H0):
   - → **Ch. 10** opening pull-back, and its outro "a string would look just like a point";
   - → **Ch. 11** opening, where the point becomes the Standard Model node;
   - → **Ch. 11** E3, "the same unfolding as Chapter 1's reveal".
3. **Ch. 1** lab's probe energy ħc/δ, and "~10¹⁵ × LHC" in its Go deeper:
   - → **Ch. 5** ZOOM bridge;
   - → **Ch. 10** Beat 3 "Recall Chapter 1" and the Beat 4 machine;
   - → **Ch. 11** E2's collider arrow, `~10¹⁵× IN ENERGY`.
4. **Ch. 1**'s zoom (decade rings, SI prefixes running out) → **Ch. 10** Beat 1 runs it in reverse. Beat 4 is "Chapter 1's zoom, turned into a machine".
5. **Ch. 1** thesis (the theory began, 1968–70, as a strong-force model):
   - → **Ch. 2** Go deeper (hadron Regge slope, flux tubes);
   - → **Ch. 4** Opening and Beat 6: the strong-force model's unwanted spin-2 "nuisance".
6. **Ch. 1** model note, "Pinned 'guitar' modes appear only once branes arrive in chapter 7":
   - → **Ch. 2** Beats 1–2 (pegs, then unpinning to free cos modes);
   - → **Ch. 4** Beat 5's free-end see-saw;
   - → **Ch. 7** Beat 1, Dirichlet ends on D-branes.
7. **Ch. 2** Beat 3, packets carry "arrows" that line up into spin → **Ch. 4** Beat 5: one arrow (open) = spin 1, two arrows (closed) = spin 2.
8. **Ch. 2** particle drawer's ghost graviton cell, `CLOSED STRING · CH. 4` → **Ch. 3** Beat 6, then **Ch. 4** Beat 5.
9. **Ch. 2** Beat 6, charge from wrapping a hidden circle (`CH. 5, 8`) or from where ends attach (`CH. 7`):
   - → **Ch. 5** Beat 3 (Kaluza–Klein charge);
   - → **Ch. 7** Beat 4 (a photon-like field on each brane);
   - → **Ch. 8** Beat 3 (winding).
10. **Ch. 2** card F, "Why three families? … topology (Ch. 6)" → **Ch. 6** Beat 4, count the holes, count the families.
11. **Ch. 2** Beat 5's rung-0 tag, "branes + hidden dimensions multiply this" → **Ch. 6** (shapes set the massless list) and **Ch. 7** (Chan–Paton labels, U(N)).
12. **Ch. 3** Beat 6, "open strings imply closed strings; one vibration of a closed loop behaves like the graviton":
    - → **Ch. 4** Beat 5, the graviton, where "the endpoints curl and meet (a callback to Chapter 3)";
    - → **Ch. 7** Beats 3 and 6: open strings stay on branes, closed strings (gravitons among them) roam the bulk.
13. **Ch. 3** Beat 5, "for gravity, these UV divergences can't be tamed" → **Ch. 4** Beat 3 explains why gravity's quantum version stops predicting near the Planck energy.
14. **Ch. 3** Go deeper, "each extra handle costs g_s²" → **Ch. 9** Beat 2's handle stack, `EACH HANDLE COSTS g²`, which defines the string coupling.
15. **Ch. 4** closing caption, "balances only in 10 dimensions" → **Ch. 5** Opening ("comes with a condition") and Beat 5 (the critical dimension).
16. **Ch. 4** level matching ("no point on a loop is special") → **Ch. 8** Go deeper and lab: on a circle, N − Ñ = nw.
17. **Ch. 4** Beat 1, gravity ≈ 8 × 10⁻³⁷ of the electric force → **Ch. 7** Beat 6's card, gravity ~10³⁶ times weaker, the puzzle braneworlds re-express.
18. **Ch. 4** Beat 4's + / × ring → **Ch. 11** node G6: gravitational waves show GR's spin-2 pattern, "Chapter 4".
19. **Ch. 5** Beat 4, the wave must fit and the tower climbs:
    - → **Ch. 6** Beat 3's ring inset (zero rung massless);
    - → **Ch. 8** Beat 2, "as in Chapter 5" (momentum modes);
    - → **Ch. 9** Beat 4, "Chapter 5's signature of a hidden circle".
20. **Ch. 5** Beat 6's speculative gravity-only scenario and the 52 µm / 30 µm bounds:
    - → **Ch. 7** Beat 6, "Chapter 5's gravity-only scenario now gets a mechanism";
    - → **Ch. 10** gravity card;
    - → **Ch. 11** node G9.
21. **Ch. 5** Beat 5 annotation, `11 · M-theory · ◌ CONJECTURED` → **Ch. 9**'s eleventh dimension.
22. **Ch. 5** exit lattice with hidden-shape glyphs → **Ch. 6** Opening: circle → torus → six axes, "a callback to Ch. 5".
23. **Ch. 6** Beat 6, the Hodge plot's mirror axis (`Ch. 8 explores dualities`):
    - → **Ch. 8** Beat 6, dictionary row 6, (1, 101) ⟷ (101, 1);
    - → **Ch. 11** node D8, 317,206,375 curves confirmed in mathematics.
24. **Ch. 6** Beat 1, the supersymmetry assumption ("no superpartner found so far"):
    - → **Ch. 9** Beat 3, BPS protection;
    - → **Ch. 10** colliders card;
    - → **Ch. 11** nodes G8 and S3.
25. **Ch. 6** Beat 4, 100 families vs 3 → **Ch. 11** node S2, "Which hidden shape?".
26. **Ch. 7** Beat 1 footnote and exit card, "D-branes were found through T-duality, which swaps slides and pinned" → **Ch. 8** Beat 6, dictionary row 3.
27. **Ch. 7** Beat 2 card (Strominger–Vafa, 1996):
    - → **Ch. 10** card 5 (`THEORY CHECK`);
    - → **Ch. 11** Beat 3, counting a black hole, with the `≠` link to real black holes.
28. **Ch. 7**'s D1-brane → **Ch. 9** Beat 3: Type I's D-string climbs the S-bridge and lands as the heterotic string.
29. **Ch. 7** collision ("missing momentum") → **Ch. 10** colliders card and **Ch. 11** node G9, "no sign of large extra dimensions".
30. **Ch. 8**, "Two pictures. One spectrum." → **Ch. 9** Opening, "Chapter 8 found two pictures of one physics. Hold on to that."
31. **Ch. 8** Beat 6 previews:
    - IIA → IIB, then **Ch. 9** Beat 3's causeway;
    - S-duality (with a forward link to `string coupling`), then **Ch. 9** Beat 3;
    - gauge/gravity, then **Ch. 11** Beat 4, "Chapter 8 previewed Maldacena's 1997 conjecture".
32. **Ch. 8** Beat 5, a circle smaller than √α′ is a larger circle, *not* a minimum length:
    - → **Ch. 9**'s ℓ₁₁, "not a grain";
    - → **Ch. 10**'s Ruler, which continues past ℓ_P, and its Go deeper V₆ ≳ ℓ_s⁶ heuristic.
33. **Ch. 9** Beat 6 footer, `EXPERIMENTAL TESTS: NONE YET · SEE CHAPTER 10` → **Ch. 10**.
34. **Ch. 10** bridge line, "what do we know, and what are we still guessing?" → **Ch. 11** Opening, the honest ledger.
35. **Prologue** P2, "Every claim here wears a mark" → **Ch. 11** Opening, "Every claim you met wore a mark", and E3's grace note ● ◑ ◌ ○.
36. **Prologue** Thread and 110 Hz pluck → **Ch. 11** E3's final pluck, same mode model and same harmonics. The site ends on **H1**, the prologue's own object.

---

## Remaining watch-points for builders

- **H1 on portrait phones.** H1 (0.666 × viewport height) overflows the width on portrait phones, where it is about 145% of the width. This affects the ends of Chapter 1 and Chapter 11 and the start of Chapter 2. It needs a registry-level `handoffFit` check; flagged by Chapter 1's referee.
- **`DERIVED` in its generic sense.** Chapter 4 Beat 3 and Chapter 11 node D6 use `DERIVED ◑` to mean "follows from GR + QFT", not "follows from string theory". VISION §3's legend should either name these as the sanctioned exceptions or broaden the row.
- **Scroll length.** Chapter 1 (~1400 vh) and Chapter 11 (~15.7 viewports) are deliberately long. The rest run 8–13 viewports.
