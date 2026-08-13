import { readdir, readFile, stat } from 'node:fs/promises'
import { resolve, relative } from 'node:path'

const root = resolve('dist')
const required = [
  'index.html',
  'proof.html',
  'research.html',
  'llms.txt',
  'llms-full.txt',
  'proof.md',
  'research.md',
  'capabilities.json',
  'benchmarks.json',
  'releases.json',
  'changelog.md',
  'openapi.json',
  '.well-known/ferrumos-docs.json',
  '.well-known/api-catalog.json',
  'og-ferrumos.jpg',
]

const files = []
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) await walk(path)
    else files.push(path)
  }
}

await walk(root)

for (const path of required) {
  const file = await stat(resolve(root, path))
  if (!file.isFile() || file.size === 0) throw new Error(`Missing production artifact: ${path}`)
}

const relativeFiles = files.map((file) => relative(root, file).replaceAll('\\', '/'))
const forbidden = relativeFiles.filter((file) => file.endsWith('-source.mp4') || file.startsWith('posters/'))
if (forbidden.length) throw new Error(`Production contains source masters: ${forbidden.join(', ')}`)

const totalBytes = (
  await Promise.all(files.map(async (file) => (await stat(file)).size))
).reduce((sum, size) => sum + size, 0)
const budgetBytes = 28 * 1024 * 1024
if (totalBytes > budgetBytes) {
  throw new Error(`Production payload ${totalBytes} bytes exceeds ${budgetBytes}-byte budget`)
}

const html = await readFile(resolve(root, 'index.html'), 'utf8')
if ((html.match(/class="chapter /g) ?? []).length !== 8) throw new Error('Production homepage is missing static chapters')
if (html.includes('id="app"')) throw new Error('Production homepage regressed to a JavaScript content shell')

console.log(`Verified ${relativeFiles.length} production files (${(totalBytes / 1024 / 1024).toFixed(2)} MiB)`)
