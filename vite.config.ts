/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    // Worker-only dependencies; pre-bundling them up front avoids a full page
    // reload the first time a TypeScript or JavaScript run starts in dev.
    include: ['typescript', '@typescript/vfs', 'acorn'],
  },
  worker: {
    // Module workers so the Python worker can lazily import Pyodide from the CDN.
    format: 'es',
  },
  build: {
    target: 'es2022',
    // The TypeScript compiler lives in its own lazily loaded worker chunk.
    chunkSizeWarningLimit: 12000,
  },
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
  },
})
