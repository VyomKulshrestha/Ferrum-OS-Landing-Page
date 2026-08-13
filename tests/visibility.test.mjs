import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

import { audit, evaluate } from '../scripts/run-visibility-audit.mjs'
import { buildPayload, extractSitemapUrls } from '../scripts/submit-indexnow.mjs'

const text = async (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8')

test('visibility prompt pack is broad, unique, and explicit about real captures', async () => {
  const pack = JSON.parse(await text('visibility-prompts.json'))
  const ids = pack.prompts.map((prompt) => prompt.id)
  const categories = new Set(pack.prompts.map((prompt) => prompt.category))
  assert.ok(pack.prompts.length >= 25)
  assert.equal(new Set(ids).size, ids.length)
  assert.ok(categories.size >= 10)
  assert.match(pack.instructions, /real responses/i)
  for (const prompt of pack.prompts) {
    assert.ok(prompt.prompt.length >= 12)
    assert.ok(Array.isArray(prompt.expected) && prompt.expected.length)
    assert.ok(Array.isArray(prompt.forbidden))
  }
})

test('source-only visibility audit remains honest without provider captures', async () => {
  const report = await audit([])
  assert.equal(report.promptCount, 26)
  assert.equal(report.sourceReadiness.passed, true)
  assert.equal(report.assistantSampling.status, 'pending-real-responses')
  assert.equal(report.assistantSampling.captureCount, 0)
  assert.deepEqual(report.assistantSampling.assistants, [])
  assert.match(report.interpretation, /not search visibility/i)
})

test('visibility evaluator scores only supplied real response records', () => {
  const prompt = { id: 'identity-01', expected: ['rust', 'ring 3'], forbidden: ['production ready'] }
  const result = evaluate(prompt, {
    assistant: 'Test assistant',
    capturedAt: '2026-08-13T00:00:00Z',
    response: 'FerrumOS is a Rust research OS whose agent runs in Ring 3.',
    citations: ['https://ferrum-os.vercel.app/research'],
  })
  assert.equal(result.expectedTermCoverage, 1)
  assert.equal(result.ferrumCitationCount, 1)
  assert.equal(result.needsHumanReview, false)
  assert.throws(() => evaluate(prompt, { assistant: 'Test assistant', response: '' }), /has no response/)
})

test('IndexNow notification validates sitemap scope and keeps its key external', async () => {
  const urls = extractSitemapUrls(await text('public/sitemap.xml'))
  const workflow = await text('.github/workflows/visibility.yml')
  const key = workflow.match(/INDEXNOW_KEY: ([a-f0-9]{32,128})/)?.[1]
  assert.ok(key)
  assert.equal((await text(`public/${key}.txt`)).trim(), key)
  const payload = buildPayload(urls, key)
  assert.equal(payload.host, 'ferrum-os.vercel.app')
  assert.equal(payload.keyLocation, `https://ferrum-os.vercel.app/${key}.txt`)
  assert.deepEqual(payload.urlList, urls)
  assert.doesNotMatch(workflow, /secrets\./)
  assert.throws(() => extractSitemapUrls('<urlset><url><loc>https://example.com/</loc></url></urlset>'), /outside/)
})
