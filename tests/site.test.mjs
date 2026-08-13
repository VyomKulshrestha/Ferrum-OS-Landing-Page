import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import { test } from 'node:test'

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('the cinematic has eight complete, unique, statically rendered chapters', async () => {
  const [html, source, controller, styles] = await Promise.all([
    text('index.html'),
    text('src/scenes.js'),
    text('src/main.js'),
    text('src/style.css'),
  ])
  const ids = [...source.matchAll(/\n\s+id: '([^']+)'/g)].map((match) => match[1])
  const renderedIds = [...html.matchAll(/<section class="chapter [^"]+" id="([^"]+)"/g)].map((match) => match[1])
  assert.deepEqual(ids, ['forge', 'boundary', 'userland', 'authority', 'world-model', 'evidence', 'inputs', 'horizon'])
  assert.deepEqual(renderedIds, ids)
  assert.equal(new Set(ids).size, 8)
  assert.equal((source.match(/\n\s+video: '/g) ?? []).length, 8)
  assert.equal((source.match(/\n\s+poster: '/g) ?? []).length, 8)
  assert.equal((html.match(/class="scene-media(?: is-active)?"/g) ?? []).length, 8)
  assert.match(html, /<h1 id="title-forge">An agentic OS, forged from the kernel up\.<\/h1>/)
  assert.match(html, /<noscript><p class="noscript-notice">/)
  assert.doesNotMatch(html, /id="app"/)
  assert.doesNotMatch(controller, /\.innerHTML\s*=/)
  assert.match(controller, /chapterMetrics\[index\]\.top - activationOffset/)
  assert.doesNotMatch(controller, /scrollY \/ maxScroll/)
  assert.match(controller, /Math\.max\(segmentStart \+ 1, maxScroll\)/)
  assert.match(controller, /if \(elapsed >= cap\)/)
  assert.match(controller, /source\.dataset\.src/)
  assert.match(controller, /video\.dataset\.poster/)
  assert.match(controller, /event\.key !== 'Escape'/)
  assert.match(controller, /Static scene markup is out of sync/)
  assert.match(styles, /(?:^|\n)\.chapter__copy\s*{[^}]*transform:\s*translateY\(0\);[^}]*opacity:\s*1/s)
  assert.match(styles, /\.is-enhanced \.chapter:not\(\.is-current\) \.chapter__copy\s*{[^}]*opacity:\s*0\.7/s)
})

test('the landing page exposes semantic and agent-readable evidence', async () => {
  const [html, proofHtml, researchHtml, llms, proof, capabilities, benchmarks] = await Promise.all([
    text('index.html'),
    text('proof.html'),
    text('research.html'),
    text('public/llms.txt'),
    text('public/proof.md'),
    text('public/capabilities.json'),
    text('public/benchmarks.json'),
  ])

  assert.match(html, /SoftwareApplication/)
  assert.match(html, /Skip to the FerrumOS journey/)
  for (const page of [html, proofHtml, researchHtml]) {
    assert.doesNotMatch(page, /fonts\.(?:googleapis|gstatic)\.com/)
  }
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

test('the type system is self-hosted with its license notices', async () => {
  const assets = [
    'public/fonts/ibm-plex-mono-400-latin.woff2',
    'public/fonts/ibm-plex-mono-500-latin.woff2',
    'public/fonts/ibm-plex-mono-600-latin.woff2',
    'public/fonts/manrope-latin.woff2',
    'public/fonts/space-grotesk-latin.woff2',
  ]
  const licenses = [
    'public/fonts/licenses/IBM-Plex-LICENSE.txt',
    'public/fonts/licenses/Manrope-OFL.txt',
    'public/fonts/licenses/Space-Grotesk-OFL.txt',
  ]

  for (const asset of assets) {
    const file = await stat(new URL(`../${asset}`, import.meta.url))
    assert.ok(file.size > 10_000)
  }
  for (const license of licenses) {
    assert.match(await text(license), /SIL OPEN FONT LICENSE Version 1\.1/)
  }
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

test('generated scenes ship as playable, bounded media with lossless handoffs', async () => {
  for (const scene of ['01', '02', '03', '04', '05', '06', '07']) {
    const media = await stat(new URL(`../public/media/scene-${scene}.mp4`, import.meta.url))
    assert.ok(media.size > 500_000 && media.size < 10_000_000)
  }

  for (const poster of [
    'scene-01-opening.png',
    'scene-02.png',
    'scene-03.png',
    'scene-04.png',
    'scene-05.png',
    'scene-06.png',
    'scene-07.png',
    'scene-08.png',
  ]) {
    const image = await stat(new URL(`../public/posters/${poster}`, import.meta.url))
    assert.ok(image.size > 500_000)
  }

  for (const poster of [
    'scene-01-opening.webp',
    'scene-02.webp',
    'scene-03.webp',
    'scene-04.webp',
    'scene-05.webp',
    'scene-06.webp',
    'scene-07.webp',
    'scene-08.webp',
  ]) {
    const image = await stat(new URL(`../public/posters-webp/${poster}`, import.meta.url))
    assert.ok(image.size > 50_000 && image.size < 1_000_000)
  }
})
