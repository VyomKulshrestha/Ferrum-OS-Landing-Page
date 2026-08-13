import { readdir, rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const outputDirectory = resolve(import.meta.dirname, 'dist')

const excludeProductionMasters = () => ({
  name: 'exclude-production-masters',
  apply: 'build',
  async closeBundle() {
    const mediaDirectory = resolve(outputDirectory, 'media')
    const entries = await readdir(mediaDirectory, { withFileTypes: true }).catch(() => [])
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('-source.mp4'))
        .map((entry) => rm(resolve(mediaDirectory, entry.name), { force: true })),
    )
    await rm(resolve(outputDirectory, 'posters'), { recursive: true, force: true })
  },
})

export default defineConfig({
  plugins: [excludeProductionMasters()],
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
