import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('the cinematic has eight complete, unique chapters', async () => {
  const source = await text('src/scenes.js')
  const ids = [...source.matchAll(/\n\s+id: '([^']+)'/g)].map((match) => match[1])
  assert.deepEqual(ids, ['forge', 'boundary', 'userland', 'authority', 'world-model', 'evidence', 'inputs', 'horizon'])
  assert.equal(new Set(ids).size, 8)
  assert.equal((source.match(/\n\s+video: '/g) ?? []).length, 8)
  assert.equal((source.match(/\n\s+poster: '/g) ?? []).length, 8)
})

test('the landing page exposes semantic and agent-readable evidence', async () => {
  const [html, llms, proof, capabilities, benchmarks] = await Promise.all([
    text('index.html'),
    text('public/llms.txt'),
    text('public/proof.md'),
    text('public/capabilities.json'),
    text('public/benchmarks.json'),
  ])

  assert.match(html, /SoftwareApplication/)
  assert.match(html, /Skip to the FerrumOS journey/)
  assert.match(llms, /no live-EEG accuracy or medical claim/i)
  assert.match(proof, /simple baseline result/i)

  const capabilityData = JSON.parse(capabilities)
  assert.equal(capabilityData.counts.canonicalExecutableOperations, 41)
  assert.equal(capabilityData.counts.kernelSyscalls, 61)
  assert.equal(capabilityData.safety.learnedAllowGrantsAuthority, false)

  const benchmarkData = JSON.parse(benchmarks)
  assert.equal(benchmarkData.benchmarks.length, 6)
  assert.equal(benchmarkData.benchmarks[0].balancedAccuracy, 0.814)
})

test('evidence pages retain required scientific boundaries and sources', async () => {
  const [proof, research] = await Promise.all([text('proof.html'), text('research.html')])
  for (const page of [proof, research]) {
    assert.match(page, /doi\.org\/10\.5281\/zenodo\./)
    assert.match(page, /Claim boundary/i)
    assert.match(page, /FerrumOS/)
  }
  assert.match(proof, /81\.4%/)
  assert.match(proof, /81\.2%/)
  assert.match(research, /No live participant or live-EEG accuracy has been measured/i)
})

test('scene 1 ships as a playable, bounded media asset', async () => {
  const media = await stat(new URL('../public/media/scene-01.mp4', import.meta.url))
  const opening = await stat(new URL('../public/posters/scene-01-opening.png', import.meta.url))
  const handoff = await stat(new URL('../public/posters/scene-02.png', import.meta.url))
  assert.ok(media.size > 500_000 && media.size < 10_000_000)
  assert.ok(opening.size > 500_000)
  assert.ok(handoff.size > 500_000)
})

