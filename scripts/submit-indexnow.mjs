import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const HOST = 'ferrum-os.vercel.app'
const ORIGIN = `https://${HOST}`
const ENDPOINT = 'https://api.indexnow.org/indexnow'

export function extractSitemapUrls(xml) {
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim())
  if (!urls.length || urls.length > 10_000) throw new Error('Sitemap must contain between 1 and 10,000 URLs')
  if (urls.length !== new Set(urls).size) throw new Error('Sitemap contains duplicate URLs')
  if (urls.some((url) => !url.startsWith(`${ORIGIN}/`))) throw new Error(`Sitemap contains a URL outside ${ORIGIN}`)
  return urls
}

export function buildPayload(urls, key) {
  if (!/^[a-f0-9]{32,128}$/i.test(key)) throw new Error('Invalid IndexNow key format')
  return {
    host: HOST,
    key,
    keyLocation: `${ORIGIN}/${key}.txt`,
    urlList: urls,
  }
}

async function main() {
  const { values } = parseArgs({
    options: {
      key: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  })
  if (!values.key) throw new Error('Pass --key with the public INDEXNOW validation key')
  const urls = extractSitemapUrls(await readFile(resolve(ROOT, 'public/sitemap.xml'), 'utf8'))
  const payload = buildPayload(urls, values.key)
  if (values['dry-run']) {
    console.log(JSON.stringify({ ...payload, key: '[redacted]' }, null, 2))
    return
  }

  const keyResponse = await fetch(payload.keyLocation)
  if (!keyResponse.ok || (await keyResponse.text()).trim() !== values.key) {
    throw new Error(`IndexNow key is not publicly verifiable at ${payload.keyLocation}`)
  }
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  })
  if (![200, 202].includes(response.status)) throw new Error(`IndexNow rejected the URL batch with HTTP ${response.status}`)
  console.log(`IndexNow accepted ${urls.length} canonical URLs with HTTP ${response.status}.`)
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname.replace(/^\/(.:\/)/, '$1'))) {
  await main()
}
