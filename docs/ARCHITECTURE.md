# Architecture & chapter-build contract

Read `docs/VISION.md` first (voice, status chips, visual language). This file covers how the engine works and the rules every chapter build must follow.

Stack: Vite 8 + React 19 + TypeScript (strict) + three r186 + @react-three/fiber 9 + drei 10 + zustand + Lenis + KaTeX (lazy). Import alias `@/` → `src/`.

---

## 1. How the stage works

```
<Stage>  one fixed full-screen <Canvas> (flat, linear, legacy: hex colors pass through unmanaged, no tone mapping)
 ├─ ChapterPortal × (active ±1)   each chapter's Scene lives in its OWN THREE.Scene with its OWN camera (R3F createPortal)
 └─ Compositor                    renders the visible chapter straight to screen; at a boundary renders both to
                                  render targets and zoom-dissolves between them (low tier: dip to black)
<main>   one <section> per chapter; its Overlay's <Step>s set its scroll length
```

- **Scroll → state, no React renders.** `src/core/journey.ts` measures sections and steps. On every scroll it computes, for each chapter, `progress` (0–1 through its section) and `presence` (0–1 visibility), and for each `<Step>` a local progress. Read them inside frame loops through the chapter handle.
- **Boundaries.** A chapter's `progress` reaches 1 when its section's bottom hits the viewport bottom. During the next viewport of scroll, the next chapter's `presence` rises 0→1 while this one's falls 1→0. **The first frame of a chapter (progress 0) and the last (progress 1) are handoff frames.**
- **Mounting.** Only active ±1 chapters are mounted. Scenes are `React.lazy` chunks, prefetched in idle time and shader-precompiled when mounted.
- **Events.** R3F pointer events work normally inside your scene (only the active chapter receives them; events that start on UI such as panels, controls or chrome never reach 3D objects; there is no wheel raycasting). Drags that begin on empty stage go to `explore` (for `<OrbitRig>`). In an object's `onPointerDown`, call `claimPointer()` to keep the drag for yourself (e.g. plucking a string). On touch screens this also stops the page from panning during that drag.
  - `visible = false` does **not** stop raycasts. Gate handlers with a ref, or swap `mesh.raycast = () => {}`.
  - Give heavy interactive meshes a cheap invisible proxy hit mesh. Never raycast a 100k-triangle surface.
  - Hover-reactive effects must gate on `explore.hovering`. It is false after a finger lifts or the mouse leaves; `explore.seen` stays true forever.
- **Clock.** Animate from `f.t` / `f.dt` in `useChapterFrame` (the stage clock). Never use `state.clock`, because the stage clock can be frozen for screenshots and keeps handoff copies in phase.

## 2. A chapter = one folder you own

```
src/chapters/NN-id/
  index.ts      meta (id, index, title, question, lazy Scene, Overlay, lazy Fallback, scale fn) — keep id/index/title
  Overlay.tsx   DOM: <ChapterTitle>, beat <Step>s, <Lab>, <GoDeeper>  (eager — defines the scroll length)
  Scene.tsx     default export: the 3D scene (lazy)
  Fallback.tsx  default export: a static SVG diagram for no-WebGL (make it genuinely informative; its root <svg role="img" aria-label> is read to screen readers)
  glossary.ts   default export: GlossaryEntries for terms this chapter introduces
  store.ts      (optional) zustand store shared by Scene + Overlay (lab state)
  styles.css    (optional) chapter CSS; import it from Overlay.tsx; prefix every class with a chapter prefix
  *.ts(x)       any helpers/sub-components you need
```

**You may only create or edit files inside your own chapter folder.** Never edit `src/core`, `src/gl`, `src/ui`, `src/styles`, other chapters, configs, or package.json. Other agents are building other chapters at the same time. If you need a primitive that doesn't exist, build it inside your folder. If you find a bug in shared code, work around it locally and report it in your final summary.

**Bundle rule:** `index.ts` and `Overlay.tsx` (and anything they import, such as `store.ts` or `styles.css`) are in the first-paint bundle. They must **not** import `three`, `@react-three/*`, or `@/gl`. Only `Scene.tsx` and its sub-modules may. This keeps three.js out of the first paint. It also matters for correctness: colour management is disabled when the stage chunk loads, so a `THREE.Color` created earlier would come out wrong.

`scale(h)` in index.ts returns the characteristic length (meters) of what's on screen for the left scale gauge, or `null`. It is evaluated every frame, so keep it pure and cheap. The gauge flags a hypothetical reading with a hollow ring and `HYPOTHETICAL`: by default any reading below ~10⁻³² m (the unknown string scale), plus the line "ℓs unknown · ~10⁻³⁴ m if traditional estimates hold" at the ~10⁻³⁴ m fiducial. Override it with optional `scaleStatus(h, scale)` returning `'speculative'` or `null` (same rules: pure, no allocation).

## 3. Overlay API (`@/ui`)

```tsx
import { ChapterTitle, Step, Beat, Caption, Lab, LabRow, Slider, Segmented, Toggle, Readout, Button,
         GoDeeper, Deeper, Eq, Term, Status, StatusLegend } from '@/ui'

<ChapterTitle sub="optional one-liner" status="derived">What does a string do as it moves <em>through time</em>?</ChapterTitle>
<Step id="worldline" length={1.4} align="left">            // left | right | center | wide ; valign center|top|lower|bottom
  <Beat status={['derived', 'analogy']}>A point particle traces a <Term id="worldline">worldline</Term>…</Beat>
  <Caption>Time runs upward · not to scale</Caption>
</Step>
<Lab title="Worldsheet lab" status="derived" hint="Drag to rotate · scrub time" length={2.4}
     intro={<p>One line on what to try.</p>}
     footer={<GoDeeper title="The Nambu–Goto action">…<Eq display tex="S=-T\int dA" />…</GoDeeper>}>
  <Slider label="Time" value={t} min={0} max={1} onChange={setT} format={(v) => `τ = ${v.toFixed(2)}`} />
  <Segmented label="String" value={kind} options={[{value:'open',label:'Open'},{value:'closed',label:'Closed'}]} onChange={setKind} />
  <Readout label="Area" value={a.toFixed(2)} unit="ℓs²" />
</Lab>
```

- **Steps** are `length × 100svh` of scroll. Their content is sticky and fades in and out. A scene reads `h.step('worldline')` (0 when the viewport's center line reaches the step's top, 1 when it passes the bottom). `h.inStep('lab')` is true while the lab is on screen.
- **Off-screen steps skip rendering.** A step more than one viewport from the screen gets `content-visibility: auto` (the engine marks nearer steps `data-near` and leaves them uncontained). Content may paint outside its step box (held, pinned) only while the step is near; portal `position: fixed` layers to `<body>`; don't read layout inside far steps every frame.
- **`exit`** sets how a step's content leaves once its sticky hold ends (its last viewport): `'late'` (default) scrolls up with the page and fades late; `'early'` fades as it starts to rise; `'hold'` stays at its resting place and fades there (~0.4 viewport). `<ChapterTitle>` uses `'hold'`.
- Typical chapter: title (≈1.15) + 3–6 beat steps (1–1.6 each) + lab (2–2.6) + optional closing step. That is roughly 8–12 viewports. **The final viewport is the dissolve into the next chapter, so keep it calm and at the OUT pose:** give the closing `<Step>` `exit="hold"` so its text never slides across the centred handoff object (unless the step pins its own content).
- `<Beat>` text ≤ 45 words. Labs ≤ 20 words per caption. Put depth in `<GoDeeper>` (drawer) and optional `<Deeper>` blocks (only shown when the global "Deeper physics" toggle is on).
- `<Term id>` needs an entry in your `glossary.ts` (`{ 'worldline': { term: 'Worldline', def: '≤30 words', chapter: 'worldsheet' } }`). Use ids from `content/glossary.md`. A term introduced by another chapter may be referenced by id without redefining it.
- `<Eq tex highlight>`: wrap terms in `\htmlClass{term-key}{…}` and pass `highlight={{ key: 0..1 }}` driven by the same state as the scene, so equations light up in sync with the visuals.
- Status chips: `observed | derived | conjectured | speculative | analogy` (see VISION §3). **Every beat gets a status. Every cartoon gets `analogy`.**
- **Step ids must be unique per chapter.** `'title'` (ChapterTitle) and `'lab'` (Lab default) are already taken. **Everything the Overlay renders must be inside a `<Step>`**, and `<GoDeeper>` goes inside a Step or in the Lab `footer`. Content outside a Step is not interactive and breaks the scroll math. A dev warning fires if you break either rule.
- Lab state: keep it in your `store.ts` (zustand) so Scene and Overlay share it. In the Scene, read with `useStore.getState()` inside frame loops (no re-renders), or with selectors for structural changes.

## 4. Scene API (`@/gl`)

```tsx
import { useChapter } from '@/core/chapter'
import { Filament, GlowPoint, GlowPoints, useIsoGridMaterial, createIsoGridMaterial, Backdrop, SceneLabel,
         OrbitRig, useViewShift, useChapterFrame, HandoffPoint, HandoffOpenString, HandoffLoop,
         openStringFn, loopFn, COLORS } from '@/gl'
import { claimPointer, setStageCursor, explore } from '@/core/explore'
import { pluck, hum, tick } from '@/core/audio'
import { clamp, lerp, smoothstep, range, window01, damp, easeInOutCubic, logLerp, rng, TAU, sci } from '@/core/math'
import { ambient, prefersReducedMotion } from '@/core/time'
import { particleScale, useSettings } from '@/core/settings'
import { HANDOFF } from '@/core/handoff'
```

- **Frame loops:** always use `useChapterFrame` (default priority −1), never raw `useFrame`. It runs before library frame work (label projection, Filament evaluation), so camera moves are seen by labels in the same frame. It skips while your chapter is invisible, and it catches exceptions so your bug can't freeze the compositor (it logs once, and shot.mjs reports it).
- **Sizes are world-space and follow parent transforms, like any 3D object.** That applies to Filament `width`, GlowPoint `size` and GlowPoints sizes. Each has a `minPixels` floor. To keep a filament's on-screen width while shrinking its group, set `api.material.uniforms.uWidth.value = width / scale`.
- **`useThree(s => s.viewport)` is the root camera's, not yours.** Inside a frame loop, use `f.state.viewport.getCurrentViewport(f.state.camera, target)`, or compute from your camera's fov/aspect.
- **Portrait phones:** H1/H2 are scaled by `handoffFit(aspect)` (`useHandoffFit()` in `@/gl`). If you morph from or to H1/H2 yourself, scale length and radius by the same factor.
- **Textures:** colour management is off, so leave `texture.colorSpace` at its default. `SRGBColorSpace` renders dark and triggers a dev warning. Scene renders use three's default `autoClear`, so offscreen passes behave normally.
- **`<Filament>`**, the Thread: a screen-space ribbon with a crisp core and soft halo, additive. `fn(u, t, out, i)` sets each point every frame, or pass `points` and call `api.update()`. Props: `count, closed, width (world), minPixels, color, coreColor, intensity, opacity, coreFraction, shimmer, beads`. **Only strings glow warm (filament).** Use `COLORS.field` for diagram lines.
- **`<GlowPoint>`** is a single particle. **`<GlowPoints positions sizes colors alphas>`** is thousands of soft points in one draw call. Mutate the attributes and set `needsUpdate` to animate.
- **`useIsoGridMaterial({grid, lineWidth, fill, fresnel, reveal, revealAxis, edge, color, lineColor})`** is the "diagram in light" surface material. It draws uv-grid lines, a fresnel rim, and an optional reveal clip with a bright leading edge (`uniforms.uReveal`). Use it for worldsheets, branes, cylinders and Calabi–Yau patches.
- **`<OrbitRig pose={(f)=>({azimuth, polar, distance, target, fov})} interactive={(h)=>h.inStep('lab')} />`** drives your camera. It combines the choreographed pose with user drags (inertia, relaxes back when not interactive). Horizontal drags rotate on touch. Don't use drei `OrbitControls` (it breaks page scrolling on touch).
- **`useViewShift((f) => [x, y])`** slides the rendered image by viewport fractions (off-axis frustum) so the subject sits beside the text column. **Return [0, 0] at progress 0 and 1** (handoff frames are centered).
- **`<SceneLabel position tone align leader size opacity>`** adds crisp mono annotations pinned in 3D, faded with presence automatically. Use them sparingly: they are figure labels, not paragraphs. Every portal's drei `<Html>` renders into the fixed `#scene-labels` layer, which is `pointer-events:none`. Interactive Html content must set `pointer-events:auto` itself; prefer DOM controls in the Overlay instead.
- **`<Backdrop />`** is the shared deep-space dust. Include it unless your scene has its own atmosphere.
- **Handoffs:** `HANDOFF.camera` = fov 35 at (0,0,10) looking at the origin. H0 `<HandoffPoint/>`, H1 `<HandoffOpenString/>` (free-ended open string), H2 `<HandoffLoop/>`. If your content pack says your chapter begins or ends on one of these, render exactly that component (default props, at the origin, camera at HANDOFF.camera, no view shift) at progress 0 / progress 1. The neighbour renders the same object in phase, so the dissolve is seamless.
- **Composition:** on desktop, beat text sits in the left ~40% of the screen, so shift or offset the subject right. Title cards sit in the lower-left, so keep the center free. On phones and portrait tablets, text sits at the bottom and the lab is a bottom sheet, so compose the subject in the upper 60%. The DOM switches with `PORTRAIT_QUERY` / `isPortraitLayout(w, h)` from `@/core/layout` (width ≤ 720px or aspect ≤ 0.8): use the same test in scenes, figures and chapter CSS (`@media (max-width: 720px), (max-aspect-ratio: 4/5)`) so the DOM and the scene never disagree. Read `state.size` for the aspect ratio. The lab panel docks bottom-right on desktop (≈360 px wide), so keep the lab subject center or center-left and unobstructed.

## 5. Rules

**Accuracy (non-negotiable).** Your copy comes from `content/NN-id.md` (refereed) and `content/00-arc.md`. You may tighten the wording, but you must not add facts that aren't there unless you verify them, and you must not weaken caveats. Visual models must follow the pack's **Model** section: when the physics has a formula, animate the formula. Every visual metaphor carries an `analogy` chip or a "not to scale" caption.

**Performance.** One scene should cost ≤ ~150k triangles and ≈ ≤ 60 draw calls. No allocations inside frame loops: preallocate vectors, colors and typed arrays. Use instancing or `GlowPoints` for many objects. Scale particle counts by `particleScale()`. Do heavy work in shaders or once in `useMemo`. Dispose what you create manually. Skip work when invisible (`useChapterFrame` already does). Honor `ambient()` (0 under reduced motion) for idle animations. Interactions must still work under reduced motion.

**Platform constraints.** The site ships as a static bundle under a strict CSP:
- no network assets (no CDN fonts in WebGL, no drei `<Text>`/`useFont`/`Environment` presets, no remote textures or HDRIs);
- build every texture procedurally (canvas → `CanvasTexture`, or in shaders);
- no `@react-three/postprocessing`;
- no `alert/confirm/prompt`;
- no new npm dependencies.

**Look & feel.** Deep space, thin light, precise type. The only warm light is strings, and only when a string is *resolved*: anything unresolved or point-like (a particle, a string seen from too far away) glows ink-white (`COLORS.ink`). Use field-blue hairlines for diagrams. Keep things quiet: glow is earned, not sprayed. Avoid neon overload, HUD clichés, cards everywhere and walls of text. Motion is slow and weighted. Every interaction teaches something. The first frame of every step should already look composed.

**Accessibility.** Every control has a label and works by keyboard. Readouts describe the state changes that visuals show. Scenes are `aria-hidden` (the stage is), so the Overlay text must carry the meaning on its own.

## 6. Verify your chapter (required before you finish)

The dev server runs at http://127.0.0.1:5173 (already started, and HMR picks up your edits).

```bash
npx tsc -b --pretty false                                        # must pass (whole project)
node scripts/shot.mjs --chapter <id> --p 0,0.15,0.35,0.55,0.75,1 --out shots/<id>
node scripts/shot.mjs --chapter <id> --step lab --sp 0.3,0.7 --out shots/<id>
node scripts/shot.mjs --chapter <id> --p 0.3 --mobile --out shots/<id>
node scripts/shot.mjs --chapter <id> --step lab --sp 0.5 --deeper --out shots/<id> --label deeper
```

`shot.mjs` renders the chapter solo on the real GPU, saves PNGs and prints console errors. **Open the PNGs with the Read tool and look at them critically.** Iterate until every frame is composed and beautiful and the text is legible and not overlapping the subject. Progress 0 and progress 1 must show the handoff poses. Mobile must work. The console must be clean. Other `?` params: `&freeze=<t>` for the clock time, `&quality=low`.
