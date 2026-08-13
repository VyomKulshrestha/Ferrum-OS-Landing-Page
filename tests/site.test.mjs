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
  assert.equal((source.match(/\n\s+scroll: /g) ?? []).length, 8)
  assert.equal((html.match(/class="scene-media(?: is-active)?"/g) ?? []).length, 8)
  assert.match(html, /<h1 id="title-forge">An agentic OS, forged from the kernel up\.<\/h1>/)
  assert.match(html, /<noscript><p class="noscript-notice">/)
  assert.doesNotMatch(html, /<footer>/)
  assert.doesNotMatch(html, /progress-rail/)
  assert.doesNotMatch(controller, /progressFill|progressCount/)
  assert.doesNotMatch(html, /id="app"/)
  assert.doesNotMatch(controller, /\.innerHTML\s*=/)
  assert.match(controller, /chapterMetrics\[index\]\.top - activationOffset/)
  assert.doesNotMatch(controller, /scrollY \/ maxScroll/)
  assert.match(controller, /Math\.max\(segmentStart \+ 1, maxScroll\)/)
  assert.match(controller, /opening\.currentTime >= cap/)
  assert.match(controller, /openingBaseline = opening\.currentTime/)
  assert.match(controller, /video === media\[0\] \? openingBaseline : 0/)
  assert.doesNotMatch(controller, /URL\.createObjectURL/)
  assert.match(controller, /video\.dataset\.transport = 'byte-range'/)
  assert.match(controller, /pendingSeeks\.set/)
  assert.match(controller, /smooth\(\(localProgress - 0\.78\) \/ 0\.22\)/)
  assert.match(controller, /updateCopyStage\(index, localProgress\)/)
  assert.match(controller, /classList\.toggle\('is-enhanced', enhancedMotion\(\)\)/)
  assert.match(controller, /if \(!enhancedMotion\(\)\)/)
  assert.match(controller, /coarsePointer\.matches && !widthChanged/)
  assert.match(controller, /querySelector\('source'\)\?\.dataset\.src/)
  assert.match(controller, /video\.dataset\.poster/)
  assert.match(controller, /event\.key !== 'Escape'/)
  assert.match(controller, /Static scene markup is out of sync/)
  assert.match(styles, /(?:^|\n)\.chapter__copy\s*{[^}]*transform:\s*translateY\(0\);[^}]*opacity:\s*1/s)
  assert.match(styles, /\.is-enhanced \.chapter__copy\s*{[^}]*position:\s*fixed;[^}]*opacity:\s*var\(--copy-opacity, 0\)/s)
  assert.match(styles, /@keyframes camera-breathe/)
  assert.match(styles, /overflow-x:\s*clip/)
  assert.match(styles, /@media \(max-width: 900px\)[\s\S]*?\.chapter__copy[\s\S]*?width:\s*auto;[\s\S]*?max-width:\s*none;/)
})

test('the landing page exposes semantic and agent-readable evidence', async () => {
  const [html, proofHtml, researchHtml, llms, llmsFull, proof, capabilities, benchmarks, releases, docsCatalog, apiCatalog, sitemap] = await Promise.all([
    text('index.html'),
    text('proof.html'),
    text('research.html'),
    text('public/llms.txt'),
    text('public/llms-full.txt'),
    text('public/proof.md'),
    text('public/capabilities.json'),
    text('public/benchmarks.json'),
    text('public/releases.json'),
    text('public/.well-known/ferrumos-docs.json'),
    text('public/.well-known/api-catalog.json'),
    text('public/sitemap.xml'),
  ])

  assert.match(html, /SoftwareApplication/)
  assert.match(html, /Skip to the FerrumOS journey/)
  for (const page of [html, proofHtml, researchHtml]) {
    assert.doesNotMatch(page, /fonts\.(?:googleapis|gstatic)\.com/)
    assert.doesNotMatch(page, /href="\/(?:proof|research)\.html"/)
    const jsonLd = [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    assert.ok(jsonLd.length >= 1)
    jsonLd.forEach((match) => assert.doesNotThrow(() => JSON.parse(match[1])))
  }
  assert.match(proofHtml, /"@type": "TechArticle"/)
  assert.match(researchHtml, /"@type": "ScholarlyArticle"/)
  assert.match(proofHtml, /Evidence center \/ current main/)
  assert.match(proofHtml, /Source a8de2d769840adccb03e9a7c4b5ba5929839f9a1/)
  assert.match(proofHtml, /"version": "a8de2d769840adccb03e9a7c4b5ba5929839f9a1"/)
  assert.doesNotMatch(researchHtml, /"sameAs"/)
  assert.match(researchHtml, /"citation": \[\s*"https:\/\/doi\.org\/10\.5281\/zenodo\.21829808",\s*"https:\/\/doi\.org\/10\.5281\/zenodo\.21829193"/)
  assert.match(html, /href="https:\/\/doi\.org\/10\.5281\/zenodo\.21829808">Read the research paper/)
  assert.match(llms, /no live-EEG accuracy or medical claim/i)
  assert.match(llmsFull, /0\.2 percentage-point difference does not establish a material JEPA safety advantage/i)
  assert.match(llmsFull, /Distinguish the v0\.1\.1 tagged release from current main/i)
  assert.match(proof, /simple baseline result/i)
  assert.match(sitemap, /<lastmod>2026-08-13<\/lastmod>/)

  const capabilityData = JSON.parse(capabilities)
  assert.equal(capabilityData.schemaVersion, 2)
  assert.equal(capabilityData.counts.canonicalExecutableOperations, 41)
  assert.equal(capabilityData.counts.kernelSyscalls, 61)
  assert.equal(capabilityData.safety.learnedAllowGrantsAuthority, false)
  assert.equal(capabilityData.actions.length, 41)
  assert.match(capabilityData.source.commit, /^[0-9a-f]{40}$/)
  assert.match(capabilityData.source.sha256, /^[0-9a-f]{64}$/)

  const benchmarkData = JSON.parse(benchmarks)
  assert.equal(benchmarkData.schemaVersion, 2)
  assert.equal(benchmarkData.benchmarks.length, 6)
  assert.equal(benchmarkData.benchmarks[0].value, 0.8140000000000001)
  assert.equal(benchmarkData.benchmarks[0].sampleSize, 500)
  assert.equal(benchmarkData.benchmarks[2].unit, 'microseconds')
  assert.ok(benchmarkData.globalLimitations.length >= 3)

  const releaseData = JSON.parse(releases)
  assert.equal(releaseData.latestTaggedSoftwareRelease, 'v0.1.1')
  assert.equal(releaseData.development.status, 'newer-than-v0.1.1')

  for (const catalog of [JSON.parse(docsCatalog), JSON.parse(apiCatalog)]) {
    assert.equal(catalog.runtimeControl ?? catalog.controlPlane, false)
  }
  assert.equal(JSON.parse(docsCatalog).acceptsCommands, false)
})

test('machine endpoints reference local schemas and do not impersonate a runtime agent', async () => {
  const [capabilities, benchmarks, capabilitySchema, benchmarkSchema, openapiSource, apiCatalogSource, configSource] = await Promise.all([
    text('public/capabilities.json'),
    text('public/benchmarks.json'),
    text('public/schemas/capabilities-v2.schema.json'),
    text('public/schemas/benchmarks-v2.schema.json'),
    text('public/openapi.json'),
    text('public/.well-known/api-catalog.json'),
    text('vercel.json'),
  ])
  const capabilityData = JSON.parse(capabilities)
  const benchmarkData = JSON.parse(benchmarks)
  assert.equal(JSON.parse(capabilitySchema).$id, capabilityData.$schema)
  assert.equal(JSON.parse(benchmarkSchema).$id, benchmarkData.$schema)

  const openapi = JSON.parse(openapiSource)
  const apiCatalog = JSON.parse(apiCatalogSource)
  const config = JSON.parse(configSource)
  assert.equal(openapi.openapi, '3.1.0')
  assert.equal(openapi['x-ferrumos-safety'].runtimeControl, false)
  assert.equal(openapi['x-ferrumos-safety'].acceptsCommands, false)
  assert.equal(apiCatalog.canonicalUrl, 'https://ferrum-os.vercel.app/.well-known/api-catalog')
  assert.equal(apiCatalog.openapi, 'https://ferrum-os.vercel.app/openapi.json')
  assert.deepEqual(apiCatalog.allowedMethods, ['GET'])
  assert.deepEqual(config.rewrites, [{
    source: '/.well-known/api-catalog',
    destination: '/.well-known/api-catalog.json',
  }])
  for (const path of Object.values(openapi.paths)) {
    assert.deepEqual(Object.keys(path), ['get'])
  }
  assert.equal(Object.hasOwn(openapi.paths, '/api/mcp'), false)
  await assert.rejects(stat(new URL('../public/.well-known/agent-card.json', import.meta.url)), /ENOENT/)
  await assert.rejects(stat(new URL('../public/.well-known/mcp.json', import.meta.url)), /ENOENT/)
})

test('deployment metadata negotiates Markdown and enforces browser safety headers', async () => {
  const [html, proofHtml, researchHtml, markdown, proofMarkdown, researchMarkdown, configSource, middlewareSource] = await Promise.all([
    text('index.html'),
    text('proof.html'),
    text('research.html'),
    text('public/index.md'),
    text('public/proof.md'),
    text('public/research.md'),
    text('vercel.json'),
    text('middleware.js'),
  ])
  const config = JSON.parse(configSource)
  const { acceptsMarkdown, config: middlewareConfig, MARKDOWN_ROUTES, default: middleware } = await import('../middleware.js')
  assert.deepEqual(middlewareConfig.matcher, ['/', '/proof', '/research'])
  assert.deepEqual([...MARKDOWN_ROUTES], [
    ['/', '/index.md'],
    ['/proof', '/proof.md'],
    ['/research', '/research.md'],
  ])
  assert.equal(acceptsMarkdown('text/markdown'), true)
  assert.equal(acceptsMarkdown('text/html, text/markdown;q=0.8'), true)
  assert.equal(acceptsMarkdown('text/html, text/markdown;q=0'), false)
  assert.equal(acceptsMarkdown('text/html,application/xhtml+xml'), false)

  for (const [route, destination] of MARKDOWN_ROUTES) {
    const markdownResponse = middleware(new Request(`https://ferrum-os.vercel.app${route}`, { headers: { accept: 'text/markdown' } }))
    const htmlResponse = middleware(new Request(`https://ferrum-os.vercel.app${route}`, { headers: { accept: 'text/html' } }))
    assert.equal(markdownResponse.headers.get('x-middleware-rewrite'), `https://ferrum-os.vercel.app${destination}`)
    assert.equal(htmlResponse.headers.get('x-middleware-next'), '1')
  }
  const unknownResponse = middleware(new Request('https://ferrum-os.vercel.app/not-a-page', { headers: { accept: 'text/markdown' } }))
  assert.equal(unknownResponse.headers.get('x-middleware-next'), '1')
  assert.match(middlewareSource, /url\.pathname = destination/)
  assert.match(html, /rel="alternate" type="text\/markdown" href="\/index\.md"/)
  assert.match(proofHtml, /rel="alternate" type="text\/markdown" href="\/proof\.md"/)
  assert.match(researchHtml, /rel="alternate" type="text\/markdown" href="\/research\.md"/)
  assert.match(markdown, /Current main contains newer research/i)
  assert.match(proofMarkdown, /simple baseline result/i)
  assert.match(researchMarkdown, /learned forecast add caution/i)

  for (const route of ['/', '/proof', '/research']) {
    const routeHeaders = config.headers.find((entry) => entry.source === route).headers
    const routeHeaderMap = Object.fromEntries(routeHeaders.map(({ key, value }) => [key, value]))
    assert.equal(routeHeaderMap.Vary, 'Accept')
    assert.match(routeHeaderMap.Link, /rel="alternate"; type="text\/markdown"/)
  }

  const globalHeaders = config.headers.find((entry) => entry.source === '/(.*)').headers
  const headerMap = Object.fromEntries(globalHeaders.map(({ key, value }) => [key, value]))
  assert.equal(headerMap['X-Frame-Options'], 'DENY')
  assert.match(headerMap['Content-Security-Policy'], /frame-ancestors 'none'/)
  assert.match(headerMap['Content-Security-Policy'], /media-src 'self' blob:/)
  assert.match(headerMap['Permissions-Policy'], /camera=\(\)/)
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

  const socialImage = await stat(new URL('../public/og-ferrumos.jpg', import.meta.url))
  assert.ok(socialImage.size > 50_000 && socialImage.size < 1_000_000)
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
  for (const scene of ['01', '02', '03', '04', '05', '06', '07', '08']) {
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
