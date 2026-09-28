// Must be the FIRST import in main.tsx: disables three's color management before any module
// creates a THREE.Color at import time (otherwise hex values get linearized, e.g. #05070B → #000101).
// "What you write is what you see": hex colors pass straight through; no tone mapping; display-space blending.
import * as THREE from 'three'

THREE.ColorManagement.enabled = false
