// The one portrait predicate. The DOM layout (src/styles/ui.css, "Phones & portrait tablets") switches to
// text-at-the-bottom + lab bottom sheet under it, so scenes and figures that recompose for portrait must use
// the same test, or the DOM and the scene disagree (e.g. an iPad in portrait: 820×1180).

/** CSS media query: width ≤ 720px, or aspect (w/h) ≤ 0.8. */
export const PORTRAIT_QUERY = '(max-width: 720px), (max-aspect-ratio: 4/5)'

/** Same test from a size in CSS px (e.g. R3F `state.size`). Allocation-free; safe in frame loops. */
export const isPortraitLayout = (width: number, height: number) => width <= 720 || width <= 0.8 * height
