import { next, rewrite } from '@vercel/functions'

export const MARKDOWN_ROUTES = new Map([
  ['/', '/index.md'],
  ['/proof', '/proof.md'],
  ['/research', '/research.md'],
])

export const config = {
  matcher: ['/', '/proof', '/research'],
}

export function acceptsMarkdown(header = '') {
  return header.split(',').some((entry) => {
    const [mediaType, ...parameters] = entry.split(';').map((part) => part.trim().toLowerCase())
    if (mediaType !== 'text/markdown') return false
    const quality = parameters.find((parameter) => parameter.startsWith('q='))
    return quality ? Number.parseFloat(quality.slice(2)) > 0 : true
  })
}

export default function middleware(request) {
  const url = new URL(request.url)
  const destination = MARKDOWN_ROUTES.get(url.pathname)

  if (!destination || !acceptsMarkdown(request.headers.get('accept') ?? '')) return next()

  url.pathname = destination
  return rewrite(url)
}
