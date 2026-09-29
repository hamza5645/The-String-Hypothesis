# Glossary (merged)

The single, deduplicated glossary for all twelve steps of the journey. Every `<Term id>` on the site uses an id from this file.

**How to read an entry.** Each entry gives the term, its definition (30 words or fewer), the chapter that introduces it, and its id. Where a term is shown earlier as a forward link, or recalled later, the chapter field says so in brackets.

**Where each entry lives.** The introducing chapter's `glossary.ts` owns the entry. Every other chapter references it by id and does not redefine it (ARCHITECTURE §3). The introducing chapter is the first to use the term in its own glossary list: in beat text, on stage, in lab copy, or in a Go deeper drawer.

**Merged entries.** Duplicates were merged in the cross-chapter editing pass (2026-09-28). The merged definitions keep every referee correction:

| Term | Defined in | Merged from | Notes |
|---|---|---|---|
| `spin`, `polarization` | Ch. 2 | Ch. 4 | Adds Ch. 4's symmetry framing |
| `compactification` | Ch. 5 | Ch. 6 | Uses Ch. 5's refereed wording, which does not assume the shape is small |
| `braneworld` | Ch. 5 | Ch. 7 | Uses Ch. 7's refereed "gravity also spreads" |
| `moduli` | Ch. 6 | Ch. 5's `modulus` | |
| `supersymmetry` | Ch. 6 | Ch. 10 | Adds Ch. 10's caveat that string theory does not fix the partners' masses |
| `string scale` | Ch. 2 | Ch. 10 | Adds Ch. 10's "ten to thirty times below the Planck energy" |
| `mirror symmetry`, `gauge/gravity duality` (alias AdS/CFT) | Ch. 8 | Ch. 11 | |
| `α′` | Ch. 1 | Ch. 2 | |
| `electronvolt` | Ch. 1 | Ch. 10 | |

The entry `superstring` is new. Chapters 3, 5, 6, 8 and 11 used the word in beat text, but no chapter defined it.

- **AdS/CFT correspondence** — see **gauge/gravity duality**.
- **α′ (alpha-prime)** — String theory's single adjustable scale, with units of length squared. It sets the tension, T = 1/(2πα′), the string length ℓs = √α′, and the rung spacing M² = N/α′. — Ch. 1 (first on stage as M² = N/α′ in Ch. 2; first in beat text in Ch. 8) · id `alpha-prime`
- **anomaly** — A symmetry of the classical equations that quantum effects destroy. String consistency requires the worldsheet's scale anomaly to cancel. — Ch. 5 · id `anomaly`
- **anti-de Sitter space** — A spacetime of constant negative curvature, like a box whose walls light can reach in finite time. Our expanding universe is not of this type. — Ch. 11 · id `anti-de-sitter-space`
- **Bekenstein–Hawking entropy** — A black hole's entropy: one quarter of its horizon area in Planck units. It is derived from general relativity plus quantum fields and has never been measured. — Ch. 11 · id `bekenstein-hawking-entropy`
- **black hole** — A region where gravity traps even light. Energy E packed inside its horizon radius, 2GE/c⁴, would form one. For everyday energies this radius is absurdly tiny. — Ch. 10 · id `black-hole`
- **BPS state** — An object whose mass or tension supersymmetry fixes exactly by its charges, so it can be followed reliably from weak to strong coupling. — Ch. 9 · id `bps-state`
- **braneworld** — A speculative scenario in which the particles we know are confined to a 3D membrane, a "brane" (Ch. 7), while gravity also spreads into extra dimensions. — Ch. 5 (paid off in Ch. 7 Beat 6) · id `braneworld`
- **bulk** — The full higher-dimensional space surrounding the branes. Closed strings, including gravitons, can travel anywhere in it. — Ch. 7 · id `bulk`
- **Calabi–Yau manifold** — A compact complex shape that admits a Ricci-flat Kähler metric (Yau's theorem). Six-dimensional ones with SU(3) holonomy keep some supersymmetry in 4D. — Ch. 6 · id `calabi-yau-manifold`
- **Chan–Paton label** — The tag recording which brane each end of an open string sits on. With N branes there are N² kinds of oriented open string. — Ch. 7 · id `chan-paton-label`
- **closed string** — A string that forms a loop with no ends. Its worldsheet is a tube. Any theory with open strings contains closed strings too. — Ch. 3 · id `closed-string`
- **collision energy** — The total energy available when two particles meet head-on. It sets the smallest distance, and the heaviest new particle, a collision can reach. — Ch. 10 · id `collision-energy`
- **compactification** — Curling extra dimensions into a finite, closed shape. If that shape is small, space looks lower-dimensional at long distances and low energies. — Ch. 5 (recalled, not redefined, in Ch. 6) · id `compactification`
- **consistency condition** — A requirement a theory must meet just to make sense, such as probabilities adding to one. In string theory these conditions fix the dimension and the allowed symmetries. — Ch. 11 · id `consistency-condition`
- **cosmic superstring** — A hypothetical fundamental string or D-string stretched to astronomical length by cosmic expansion. Not observed; searches use gravitational waves and the cosmic microwave background. — Ch. 10 · id `cosmic-superstring`
- **critical dimension** — The spacetime dimension at which a string theory's quantum version, in flat space, keeps its essential symmetries: 26 (bosonic string) or 10 (superstring). — Ch. 5 (teased by Ch. 4's closing caption) · id `critical-dimension`
- **D-brane** — An object on which open strings can end ("D" for Dirichlet). A Dp-brane has p space dimensions. It has mass, carries charge, and can move. — Ch. 7 · id `d-brane`
- **D-particle** — A D0-brane: Type IIA's pointlike D-brane, with mass 1/(g ℓ_s). Heavy at weak coupling, light at strong coupling. — Ch. 9 · id `d-particle`
- **D0-brane** — see **D-particle**.
- **dark matter** — Unseen matter inferred from its gravity on galaxies, clusters and the cosmic microwave background. It is about 84% of all matter, and its nature is unknown. — Ch. 11 · id `dark-matter`
- **dimension** — An independent direction to move or vary. Equivalently, how many numbers you need to say where something is. — Ch. 5 · id `dimension`
- **Dirichlet boundary condition** — The rule that pins a string's endpoint at a fixed position in some direction. Its partner, the Neumann condition, lets the end slide freely. — Ch. 7 · id `dirichlet-boundary-condition`
- **duality** — Two descriptions that look different but predict identical results for every possible measurement, linked by a precise dictionary that translates each quantity of one into the other. — Ch. 8 (forward-linked from Ch. 7 Beat 2) · id `duality`
- **effective field theory** — A theory used only below some energy, which openly ignores what happens above it. Gravity treated this way gives calculable quantum corrections, far too tiny to have been measured. — Ch. 4 · id `effective-field-theory`
- **electronvolt** — The energy an electron gains crossing one volt: 1.6 × 10⁻¹⁹ J. A GeV is 10⁹ eV; a TeV is 10¹² eV. — Ch. 1 (first in beat text in Ch. 10 Beat 3) · id `electronvolt`
- **eleven-dimensional supergravity** — The supersymmetric theory of gravity in eleven dimensions, the maximum supersymmetry allows (1978). Believed to be M-theory's low-energy limit. — Ch. 9 · id `eleven-dimensional-supergravity`
- **Euler characteristic (χ)** — A single integer summarizing a shape's holes. For a 2D closed surface χ = 2 − 2g. For the quintic threefold χ = −200. — Ch. 6 · id `euler-characteristic`
- **falsifiable** — Able, in principle, to be shown wrong by some observation. It is a standard test for scientific theories, and critics ask whether string theory currently meets it. — Ch. 11 · id `falsifiable`
- **gauge/gravity duality** — Also called AdS/CFT (Maldacena 1997): a conjectured equivalence between string theory (which includes quantum gravity) in a curved anti-de Sitter space and a gravity-free quantum theory on its boundary. — Ch. 8 (paid off in Ch. 11 Beat 4) · id `gauge-gravity-duality`
- **gauge symmetry** — The symmetry behind a force. The group fixes how many force carriers there are: U(1) has one, like the photon; U(N) has N². — Ch. 7 · id `gauge-symmetry`
- **general relativity** — Einstein's 1915 theory in which gravity is the curvature of spacetime by mass and energy. It is classical: it has no quanta. — Ch. 4 · id `general-relativity`
- **generation** — One copy of the matter family: two quarks, a charged lepton and its neutrino. Nature has three, with the same charges but different masses. — Ch. 6 · id `generation`
- **gluon** — The carrier of the strong force that binds quarks. Most of the proton's mass comes from the energy of its quarks and gluon field, not the quarks' rest masses. — Ch. 1 · id `gluon`
- **gravitational wave** — A ripple in spacetime's geometry, moving at light speed, that stretches and squeezes distances across its path. First detected directly on 14 September 2015. — Ch. 4 · id `gravitational-wave`
- **graviton** — The hypothetical quantum of gravity, massless with spin 2. It has never been observed. A gravitational wave would be a vast, coherent crowd of them. — Ch. 4 (forward-linked from Ch. 3 Beat 6; named in Ch. 2's particle drawer) · id `graviton`
- **harmonic** — One of the standing-wave patterns a string can hold steadily. Harmonic n vibrates at n times the lowest frequency. — Ch. 2 · id `harmonic`
- **heterotic string** — A closed string whose waves running one way are superstring-like and the other way bosonic-string-like. It has two supersymmetric versions, with symmetry SO(32) or E8×E8. — Ch. 9 · id `heterotic-string`
- **hidden dimensions** — Extra directions of space superstring theory needs for consistency: six beyond our three. Often pictured tiny and curled up, but other options exist. Motion or wrapping there could set charges. — Ch. 2 · id `hidden-dimensions`
- **Higgs mechanism** — How force carriers gain mass when a field takes a nonzero value everywhere. For branes, that value is their separation. — Ch. 7 · id `higgs-mechanism`
- **Hodge numbers** — The refined hole counts of a complex shape. For a Calabi–Yau threefold, h¹¹ counts size dials and 2D holes; h²¹ counts shape dials. — Ch. 6 · id `hodge-numbers`
- **indirect test** — Checking a theory through consequences at accessible scales (the early universe, short-range gravity), not by seeing its basic objects. Theoretical checks, like black-hole counting, test consistency, not nature. — Ch. 10 · id `indirect-test`
- **inverse-square law** — Gravity's strength falls as 1/r², the signature of three large space dimensions. Torsion balances have tested it at separations down to 52 µm. — Ch. 5 · id `inverse-square-law`
- **isospectral** — Having exactly the same spectrum. Isospectral drums have different shapes yet ring with identical tones. Proved possible in 1992 and confirmed with microwave cavities in 1994. — Ch. 8 · id `isospectral`
- **Kaluza–Klein mode** — see **momentum mode**.
- **Kaluza–Klein theory** — The 1920s idea that 5D gravity with one circular dimension looks, in 4D, like gravity plus electromagnetism plus one extra field. — Ch. 5 · id `kaluza-klein-theory`
- **Kaluza–Klein tower** — The ladder of heavier copies of a particle, from quantized motion around a hidden circle of radius R. For a particle massless in 5D, rungs are spaced ħ/(Rc) in mass. — Ch. 5 (reused as Ch. 8's momentum modes and Ch. 9's D-particle ladder) · id `kaluza-klein-tower`
- **level** — The string's rung number N: add n for every packet in harmonic n. In string theory, mass-squared is proportional to N. — Ch. 2 · id `level`
- **level matching** — The closed-string rule that clockwise and counterclockwise ripples carry equal excitation, because no point on a loop is special. — Ch. 4 · id `level-matching`
- **logarithmic scale** — A scale where each equal step multiplies by the same factor, here ten. Atoms and galaxies get equal room. Enlarging everything simply slides the picture. — Ch. 10 · id `logarithmic-scale`
- **M-theory** — The conjectured single theory whose limits are the five superstring theories and eleven-dimensional supergravity. Its complete formulation is unknown. — Ch. 9 · id `m-theory`
- **M2-brane** — see **membrane**.
- **Matrix theory** — The BFSS conjecture (1996): M-theory in certain backgrounds equals the quantum mechanics of N×N matrices as N grows without limit. — Ch. 9 · id `matrix-theory`
- **membrane** — A two-dimensional extended object (the M2-brane). In M-theory, a membrane wrapped once around the eleventh-dimensional circle behaves exactly as the Type IIA string. — Ch. 9 · id `membrane`
- **microstate** — One exact microscopic arrangement of a system. Entropy counts them: S = k_B ln Ω, where Ω is the number of microstates that look the same from outside. — Ch. 11 · id `microstate`
- **mirror symmetry** — Pairs of different Calabi–Yau shapes giving identical string physics (type IIA on one equals type IIB on the other); their Hodge numbers swap. Not a reflection of space. — Ch. 8 (previewed on Ch. 6's Hodge plot) · id `mirror-symmetry`
- **moduli** — The continuous "dials" of a hidden shape (its sizes and shape-twists). Their values would set particle masses and couplings, and something must fix ("stabilize") them. — Ch. 6 (first example: Ch. 5's breathing circle, the radion; absorbs Ch. 5's old `modulus`) · id `moduli`
- **moduli space** — The space of a theory's adjustable background values, such as its coupling and the sizes and shapes of hidden dimensions. Each point is one possible background. — Ch. 9 · id `moduli-space`
- **modulus** — see **moduli**.
- **momentum mode** — A string state circling a compact dimension, its quantum wave fitting n whole wavelengths. Its energy scales as n/R, cheap on large circles: Chapter 5's Kaluza–Klein rungs. — Ch. 8 · id `momentum-mode`
- **Nambu–Goto action** — String theory's starting rule: a history's action is minus the string tension times the worldsheet's area, measured by relativity's rules. — Ch. 3 · id `nambu-goto-action`
- **Neumann boundary condition** — see **Dirichlet boundary condition**.
- **node** — A point on a vibrating string that stays still. Pinned harmonic n has n − 1 inside the string; a free-ended harmonic n has n. — Ch. 2 · id `node`
- **non-renormalizable** — A quantum field theory whose infinities can only be removed by infinitely many measured inputs. Usable at low energies; it loses predictive power at high energies. — Ch. 4 · id `non-renormalizable`
- **open string** — A string with two free ends; classically they move at light speed. Later chapters show the ends can stick to objects called D-branes. — Ch. 3 · id `open-string`
- **order of magnitude** — A factor of ten. Each tick on the scale gauge is one; 10⁻³ m is three orders of magnitude smaller than one meter. — Ch. 1 · id `order-of-magnitude`
- **pair of pants** — The worldsheet of one closed string splitting into two, or two joining into one. It is smooth everywhere, with no corner. — Ch. 3 · id `pair-of-pants`
- **Planck energy** — About 1.22 × 10¹⁹ GeV, built from ħ, c and G. Near it, quantum effects of gravity can no longer be neglected. — Ch. 4 · id `planck-energy`
- **Planck length** — About 1.6 × 10⁻³⁵ m, built from the constants of quantum mechanics, gravity and relativity. Quantum-gravity effects are expected near it. It is not a proven smallest length. — Ch. 1 (recalled in Ch. 4, 5, 10, 11) · id `planck-length`
- **point particle** — A particle with no size and no internal parts. Experiments can never prove zero size; they can only push the upper limit lower. — Ch. 1 · id `point-particle`
- **polarization** — The direction or pattern of a wave's vibration. It tells otherwise identical states apart: light has two; gravity's two, + and ×, sit 45° apart. — Ch. 2 (gravity's + and × in Ch. 4) · id `polarization`
- **probability cloud** — Quantum theory's description of where an electron is likely to be found. It is not a smeared-out electron: each detection finds it in one place. — Ch. 1 · id `probability-cloud`
- **projection** — Drawing a higher-dimensional object as its lower-dimensional shadow. Overlaps and crossings in the shadow may not exist in the object itself. — Ch. 6 · id `projection`
- **proper time** — The time a clock carried along a worldline actually ticks. Between two events, the straight, unaccelerated worldline ticks the most. — Ch. 3 · id `proper-time`
- **quanta** — Whole packets of vibration energy. Quantum physics forbids half a packet, so each harmonic of a quantum string holds 0, 1, 2… of them. — Ch. 2 · id `quanta`
- **quantum field theory** — A framework in which each particle is a quantized ripple of a field filling space. Forces come from exchanging those quanta. The Standard Model is one. — Ch. 4 · id `quantum-field-theory`
- **quantum gravity** — A theory joining quantum mechanics and gravity that works at all energies. Candidates include string theory, loop quantum gravity and asymptotic safety. None is experimentally confirmed. — Ch. 11 · id `quantum-gravity`
- **quark** — An elementary particle of the Standard Model. Protons and neutrons each contain three valence quarks. Quarks are never observed alone; the strong force confines them. — Ch. 1 · id `quark`
- **Ramond–Ramond charge** — A kind of charge carried by D-branes (not by fundamental strings) under fields that come from closed-string vibrations. Polchinski identified D-branes as its sources (1995). — Ch. 7 · id `ramond-ramond-charge`
- **resolution** — The smallest detail a measurement can distinguish. Finer resolution needs a more energetic probe: roughly ħc divided by the distance. — Ch. 1 · id `resolution`
- **Ricci-flat** — For every direction, the bending of space in the planes containing that direction adds up to zero. Such a shape solves Einstein's equations with nothing inside it. — Ch. 6 · id `ricci-flat`
- **S-duality** — A proposed exact equivalence swapping strong and weak coupling, g ↔ 1/g. It maps Type I to heterotic SO(32), and Type IIB to itself. Conjectured; passed many theoretical checks, none experimental. — Ch. 9 · id `s-duality`
- **self-dual radius** — R = √α′, the string length, where a circle and its T-dual partner are the same size. Every smaller radius is equivalent to a larger one. — Ch. 8 · id `self-dual-radius`
- **simultaneity** — Which events count as happening "now". Observers moving relative to each other slice spacetime into "nows" at different tilts (a well-tested consequence of special relativity). — Ch. 3 · id `simultaneity`
- **spectrum** — The complete list of allowed frequencies (for a drum) or particle masses (for a string world). Matching spectra are necessary for a duality but not sufficient. — Ch. 8 · id `spectrum`
- **spin** — A particle's built-in angular momentum, in units of ħ. Measured: 0 (Higgs), ½ (electrons, quarks), 1 (photon, gluons, W, Z). A massless spin-s wave's pattern repeats after turning 360°/s. — Ch. 2 (reframed as rotational symmetry in Ch. 4) · id `spin`
- **Standard Model** — The experimentally tested theory of known particles and three forces (not gravity). It treats particles as point-like excitations of quantum fields. — Ch. 1 · id `standard-model`
- **state** — One complete, definite way the string can be: which harmonics hold how many packets, pointing which way. From far away, each state looks like a particle. — Ch. 2 · id `state`
- **string** — In string theory, a one-dimensional object with length but no thickness, whose vibrations would appear as particles. Strings can be open (two ends) or closed (loops). — Ch. 1 · id `string`
- **string coupling** — The number g that sets how likely a string is to split or join. Small g: approximations (perturbation theory) work. Near or above 1: they fail. — Ch. 9 (forward-linked from Ch. 8 Beat 6; first met in Ch. 3's Go deeper) · id `string-coupling`
- **string landscape** — The vast set of possible vacua (stable or long-lived solutions) of string theory, each with different low-energy physics. The often-quoted ~10⁵⁰⁰ is a rough estimate. — Ch. 11 · id `string-landscape`
- **string length** — ℓs = √α′, string theory's single adjustable length. Unknown: experiments require it below about 10⁻¹⁹ m; traditional estimates: roughly 10⁻³⁵–10⁻³³ m, just above the Planck length. — Ch. 1 · id `string-length`
- **string scale** — The mass of the first massive rung, M_s = 1/√α′. Unknown: traditional estimates put it ten to thirty times below the Planck energy (~10¹⁸ GeV); speculative models, much lower. — Ch. 2 (recalled in Ch. 10 Beat 6) · id `string-scale`
- **superstring** — String theory with fermions (spin-½ states, like electrons) in its spectrum as well as bosons, paired rung by rung. In flat space it needs ten spacetime dimensions (Ch. 5). — Ch. 2 (first in beat text in Ch. 3 Beat 5) · id `superstring`
- **supersymmetry** — A proposed symmetry pairing every boson with a fermion. It appears in many string models, but string theory does not fix the partners' masses. No superpartner has been observed. — Ch. 6 (Ch. 5's balance shows the fermion partners without naming it) · id `supersymmetry`
- **swampland** — The set of low-energy theories that seem consistent but cannot be completed into quantum gravity. Its proposed criteria are conjectures, actively debated. — Ch. 10 · id `swampland`
- **synchrotron radiation** — Light given off by charged particles on curved paths. It grows steeply with energy and limits how powerful a ring collider can be. — Ch. 10 · id `synchrotron-radiation`
- **T-duality** — The equivalence of string physics on a circle of radius R and one of radius α′/R, with momentum and winding exchanged. Holds at every order of string perturbation theory. — Ch. 8 · id `t-duality`
- **topology** — The properties of a shape that survive smooth stretching and bending, such as its number of holes or handles. Tearing or gluing can change them. — Ch. 6 · id `topology`
- **UV divergence** — An infinity in a quantum calculation that comes from extremely short distances (very high energies), for example interaction points squeezed together. — Ch. 3 · id `uv-divergence`
- **vertex** — In a particle (Feynman) diagram, the sharp point where worldlines meet. Particle theories attach a separate rule and strength to each kind of vertex. — Ch. 3 · id `vertex`
- **winding number** — How many times a closed string wraps a compact circle. Wrapping costs tension × length, energy wR/α′: cheap on small circles. Point particles cannot wind. — Ch. 8 · id `winding-number`
- **worldline** — The line a point particle traces through spacetime: every place it has been, at every moment, drawn as one line. — Ch. 3 · id `worldline`
- **worldsheet** — The surface a string traces through spacetime. An open string's is a ribbon; a closed string's is a tube. — Ch. 3 · id `worldsheet`
- **worldvolume** — The region of spacetime a brane sweeps out: its own space dimensions plus time. Fields from open strings on the brane live there. — Ch. 7 · id `worldvolume`

---

99 entries and 6 cross-references.
