// Canonical handoff poses. Adjacent chapters that start/end on the same pose render
// the *same* object in the same place at the same phase (both animate from clock.t),
// so the compositor's dissolve reads as one continuous object.
//
// Use the ready-made components in src/gl/handoff.tsx rather than re-creating these.

export const HANDOFF = {
  /** Default camera for every chapter portal (and for all handoff frames). */
  camera: {
    fov: 35,
    position: [0, 0, 10] as [number, number, number],
    target: [0, 0, 0] as [number, number, number],
    near: 0.01,
    far: 4000,
  },
  /** H0 — a single point particle glowing at the origin. */
  H0: { size: 0.34, minPixels: 2.5, intensity: 1.2 },
  /** H1 — one horizontal open string centred at the origin, fundamental mode. */
  H1: { length: 4.2, amplitude: 0.16, omega: 2.2, width: 0.085, count: 220 },
  /** H2 — one closed loop centred at the origin, facing the camera, gently wobbling (modes 2+3). */
  H2: { radius: 1.3, wobble: 0.07, omega: 1.6, width: 0.085, count: 260 },
} as const
