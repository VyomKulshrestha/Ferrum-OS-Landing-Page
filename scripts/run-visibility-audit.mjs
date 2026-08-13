import { parseArgs } from 'node:util'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const AUTHORITATIVE = [
  'public/llms.txt',
  'public/llms-full.txt',
  'public/proof.md',
  'public/research.md',
  'public/capabilities.json',
  'public/benchmarks.json',
  'public/releases.json',
  'public/openapi.json',
]

const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export async function loadCaptures(path) {
  if (!path) return []
  return (await readFile(path, 'utf8'))
    .split(/\r?\n/)
    .filter((line) => line.trim())
    .map((line) => JSON.parse(line))
}

export function evaluate(prompt, capture) {
  const status = capture.status ?? 'completed'
  if (status !== 'completed') {
    return {
      assistant: capture.assistant,
      promptId: prompt.id,
      capturedAt: capture.capturedAt,
      status,
      error: capture.error,
      needsHumanReview: true,
    }
  }

  if (!capture.response) throw new Error(`Completed capture ${prompt.id} has no response`)
  const response = normalize(capture.response)
  const expectedTermsFound = prompt.expected.filter((term) => response.includes(normalize(term)))
  const forbiddenTermsFound = prompt.forbidden.filter((term) => response.includes(normalize(term)))
  const citations = Array.isArray(capture.citations) ? capture.citations.map(String) : []
  const ferrumCitations = citations.filter((citation) => {
    try {
      const url = new URL(citation)
      return url.hostname === 'ferrum-os.vercel.app' ||
        (url.hostname === 'github.com' && url.pathname.startsWith('/VyomKulshrestha/Ferrum-OS')) ||
        (url.hostname === 'doi.org' && ['10.5281/zenodo.21829808', '10.5281/zenodo.21829193'].some((doi) => url.pathname.includes(doi)))
    } catch {
      return false
    }
  })

  return {
    assistant: capture.assistant,
    promptId: prompt.id,
    capturedAt: capture.capturedAt,
    status: 'completed',
    expectedTermCoverage: Number((expectedTermsFound.length / Math.max(prompt.expected.length, 1)).toFixed(3)),
    expectedTermsFound,
    forbiddenTermsFound,
    citationCount: citations.length,
    ferrumCitationCount: ferrumCitations.length,
    competitorsShown: capture.competitorsShown ?? [],
    needsHumanReview: forbiddenTermsFound.length > 0 || expectedTermsFound.length < prompt.expected.length,
  }
}

export async function audit(captures = []) {
  const pack = JSON.parse(await readFile(resolve(ROOT, 'visibility-prompts.json'), 'utf8'))
  const prompts = new Map(pack.prompts.map((prompt) => [prompt.id, prompt]))
  const sourceChecks = await Promise.all(AUTHORITATIVE.map(async (path) => {
    const file = await stat(resolve(ROOT, path)).catch(() => null)
    return { path, exists: Boolean(file?.isFile()), bytes: file?.size ?? 0 }
  }))
  const evaluations = captures.map((capture) => {
    if (!capture.assistant || !capture.promptId || !prompts.has(capture.promptId)) {
      throw new Error(`Invalid visibility capture: ${JSON.stringify(capture)}`)
    }
    return evaluate(prompts.get(capture.promptId), capture)
  })
  const assistants = [...new Set(evaluations.map((item) => item.assistant))].sort()
  const completed = evaluations.filter((item) => item.status === 'completed')

  return {
    schemaVersion: 1,
    auditDate: new Date().toISOString().slice(0, 10),
    promptCount: prompts.size,
    sourceReadiness: {
      passed: sourceChecks.every((item) => item.exists && item.bytes > 0),
      checks: sourceChecks,
    },
    assistantSampling: {
      status: evaluations.length ? 'evaluated-real-captures' : 'pending-real-responses',
      assistants,
      captureCount: evaluations.length,
      completedCount: completed.length,
      incompleteCount: evaluations.length - completed.length,
      evaluations,
    },
    interpretation: 'Source readiness is not search visibility. Assistant scores use only explicitly supplied real captures and require human review.',
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      responses: { type: 'string' },
      output: { type: 'string', default: 'visibility-report.json' },
    },
  })
  const report = await audit(await loadCaptures(values.responses ? resolve(values.responses) : undefined))
  await writeFile(resolve(values.output), `${JSON.stringify(report, null, 2)}\n`, 'utf8')
  console.log(`Audited ${report.promptCount} prompts; real response captures: ${report.assistantSampling.captureCount}`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'))) {
  await main()
}
