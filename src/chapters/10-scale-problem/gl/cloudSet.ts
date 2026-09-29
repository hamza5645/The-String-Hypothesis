/*
 * Every point cloud the stage draws (≈ 140k points at high quality), as one set. Built off the main
 * thread (clouds.worker.ts), so mounting the Scene never stalls a scroll frame; the counts scale with
 * the quality tier. Pure: no three.js, no DOM.
 */
import { cosmicWeb, electronHaze, galaxy, humanFigure, protonFog, starField, universeMottle, type Cloud } from './clouds'

export interface CloudSet {
  // Beat 1 zoom layers
  proton: Cloud
  atom: Cloud
  you: Cloud
  stars: Cloud
  web: Cloud
  universe: Cloud
  // Beat 1 and the machine map
  galaxy: Cloud
  // the machine map's star fields (soft-edged: the near field fades out over its outer 40%; the far
  // field reaches 8,000 ly so it merges into the galaxy as the camera pulls back)
  near: Cloud
  far: Cloud
}
export type CloudKey = keyof CloudSet

/** One builder per cloud, so a fallback on the main thread can build them one task at a time. */
export const CLOUD_BUILDERS: Record<CloudKey, (ps: number) => Cloud> = {
  proton: (ps) => protonFog(Math.round(6000 * ps)),
  atom: (ps) => electronHaze(Math.round(7000 * ps)),
  you: (ps) => humanFigure(Math.round(2600 * ps)),
  // nearest stars: uniform at roughly the local density inside a 120-ly sphere (positions random)
  stars: (ps) => starField(Math.round(2400 * ps), 0.5, 41),
  web: (ps) => cosmicWeb(Math.round(14000 * ps)),
  universe: (ps) => universeMottle(Math.round(5000 * ps)),
  galaxy: (ps) => galaxy(Math.round(60000 * ps)),
  near: (ps) => starField(Math.round(18000 * ps), 180, 31, 1, 0.4),
  far: (ps) => starField(Math.round(22000 * ps), 8000, 37, 0.35, 0.4),
}
export const CLOUD_KEYS = Object.keys(CLOUD_BUILDERS) as CloudKey[]
