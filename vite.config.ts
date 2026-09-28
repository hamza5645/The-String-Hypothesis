import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// base './' so the build works from any sub-path (Artifact hosting, Cloudflare Pages, file previews).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: { host: '127.0.0.1' },
  // Pre-bundle everything chapters may import so concurrent edits never trigger a dep re-optimization reload.
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      'zustand',
      'lenis',
      'katex',
      'three/addons/geometries/ParametricGeometry.js',
      'three/addons/math/ImprovedNoise.js',
      'three/addons/math/SimplexNoise.js',
      'three/addons/utils/BufferGeometryUtils.js',
      'three/addons/lines/Line2.js',
      'three/addons/lines/LineMaterial.js',
      'three/addons/lines/LineGeometry.js',
      'three/addons/lines/LineSegments2.js',
      'three/addons/lines/LineSegmentsGeometry.js',
    ],
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1200,
    assetsInlineLimit: 0,
  },
})
