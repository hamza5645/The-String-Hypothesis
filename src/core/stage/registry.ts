import type * as THREE from 'three'

export interface PortalEntry {
  scene: THREE.Scene
  getCamera: () => THREE.Camera
}

/** Chapter id → its portal scene + live camera getter. Filled once the chapter's lazy Scene has mounted. */
export const portalRegistry = new Map<string, PortalEntry>()
