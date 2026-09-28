import * as THREE from 'three'
import { smoothstep } from '@/core/math'

/**
 * Per-frame zoom state, computed once per frame by the Scene (priority −2) and read by every
 * layer (priority −1). Plain mutable object: no allocations, no React.
 *
 * Precision rule (pack, Engine brief): nothing ever holds an absolute position in meters.
 * Every layer lives in its own local unit; the CPU (float64) computes only the ratio
 * `unit / L` and the offset of the layer's origin from the zoom focus, and hands those to the GPU.
 */
export const rt = {
  /** log10 field of view (m) */
  s: 0.4,
  /** world units per meter at the z = 0 plane (HW / L) */
  k: 1,
  /** CSS px per world unit at the z = 0 plane */
  px: 140,
  /** viewport CSS size */
  W: 1440,
  H: 900,
  aspect: 1.6,
  mobile: false,
  t: 0,
  dt: 0,
  /** clock for idle motion (hazes, shimmer, detections): stands still under reduced motion */
  ta: 2.5,
  z: 0.5,
  labW: 0,
  dip: 0,
  /** smoothed string fraction (0 point, 1 string) and the drawn string length (m) */
  m: 1,
  ell: 1e-34,
  /** assembly of the human figure (Z-driven) */
  assemble: 0,
  /** Beat 1 cutaway: cut sweep and 75° tilt (0..1) */
  cut: 0,
  tilt: 0,
  /** Beat 2 helix lock (0..1) and helix angle (rad) */
  lock: 0,
  helixAngle: 0,
  /** Beat 3/4: proton snapshot freeze, anchor shifts 1 and 2 */
  freeze: 0,
  k1: 0,
  k2: 0,
  /** proton-frame clock (stops at the snapshot) */
  tP: 0,
  /** target proton centre in the nucleus frame (fm) and target u quark in the proton frame (fm) */
  P: new THREE.Vector3(),
  Q: new THREE.Vector3(),
  /** view shift (fractions of the viewport) */
  shiftX: 0,
  shiftY: 0,
  /** reticle scale and alpha, rings alpha */
  ret: 1,
  retA: 0,
  ringsA: 0,
  /** strength of the text-side mask on full-frame layers (0 in the lab and at the handoff) */
  maskK: 1,
  /** audio bookkeeping */
  lastDecade: 0,
}

/** Window of s with a crossfade: visible while lo ≤ s ≤ hi (s decreases as we zoom in). */
export const win = (s: number, hi: number, lo: number, f = 0.5) => smoothstep(hi, hi - f, s) * smoothstep(lo, lo + f, s)
