import { Component, type ReactNode } from 'react'

/**
 * Error boundary for 3D content. Around a chapter portal: a crashing chapter renders nothing
 * (it unregisters, so the compositor dips to the void) instead of blanking the whole site.
 * Around the whole Stage: a fatal WebGL failure switches the site to the SVG fallbacks.
 */
export class StageBoundary extends Component<{ label: string; onError?: (e: unknown) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(e: unknown) {
    console.error(`[stage] ${this.props.label} crashed`, e)
    this.props.onError?.(e)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}
