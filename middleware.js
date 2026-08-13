import { next, rewrite } from '@vercel/functions'

export const config = {
  matcher: '/',
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
  if (!acceptsMarkdown(request.headers.get('accept') ?? '')) return next()
  return rewrite(new URL('/index.md', request.url))
}
