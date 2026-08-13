import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        proof: resolve(import.meta.dirname, 'proof.html'),
        research: resolve(import.meta.dirname, 'research.html'),
      },
    },
  },
})

