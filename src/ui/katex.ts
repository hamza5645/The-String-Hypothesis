// Loaded on demand by <Eq> so KaTeX (JS + CSS + fonts) stays out of the initial bundle.
import katex from 'katex'
import 'katex/dist/katex.min.css'

/** Render author-written TeX into an element (KaTeX builds the DOM itself). */
export function renderTexInto(el: HTMLElement, tex: string, display: boolean) {
  katex.render(tex, el, {
    displayMode: display,
    throwOnError: false,
    strict: 'ignore',
    trust: (ctx) => ctx.command === '\\htmlClass' || ctx.command === '\\htmlData',
    output: 'html',
  })
}
