import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, resolve } from 'node:path'
import ffmpegPath from 'ffmpeg-static'

const root = resolve(import.meta.dirname, '..')
const mediaDirectory = resolve(root, 'public', 'media')
const postersDirectory = resolve(root, 'public', 'posters')
const workDirectory = await mkdtemp(resolve(tmpdir(), 'ferrum-media-'))
const scenes = Array.from({ length: 8 }, (_, index) => String(index + 1).padStart(2, '0'))

function ffmpeg(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: 'utf8' })
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`
  if (result.status !== 0) {
    throw new Error(output || `ffmpeg failed with status ${result.status}`)
  }
  return output
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

try {
  const hashes = new Set()

  for (const scene of scenes) {
    const video = resolve(mediaDirectory, `scene-${scene}.mp4`)
    const output = ffmpeg(['-hide_banner', '-i', video, '-f', 'null', '-'])
    assert.match(output, /Video: h264/)
    assert.match(output, /1280x720/)
    assert.doesNotMatch(output, /Audio:/)
    hashes.add(await sha256(video))
  }

  assert.equal(hashes.size, scenes.length, 'Every delivery scene must be unique')

  for (let index = 1; index <= scenes.length; index += 1) {
    const scene = scenes[index - 1]
    const video = resolve(mediaDirectory, `scene-${scene}.mp4`)
    const posterName = index === 1 ? 'scene-01-opening.png' : `scene-${scene}.png`
    const poster = resolve(postersDirectory, posterName)
    const firstFrame = resolve(workDirectory, `scene-${scene}-first.png`)

    ffmpeg(['-y', '-hide_banner', '-loglevel', 'error', '-i', video, '-frames:v', '1', firstFrame])
    const comparison = ffmpeg([
      '-hide_banner',
      '-i',
      poster,
      '-i',
      firstFrame,
      '-lavfi',
      '[0:v]scale=1280:720[master];[master][1:v]psnr',
      '-f',
      'null',
      '-',
    ])
    const match = comparison.match(/average:([\d.]+|inf)/)
    assert.ok(match, `PSNR comparison missing for ${basename(video)}`)
    assert.ok(match[1] === 'inf' || Number(match[1]) >= 30, `${basename(video)} must begin from its declared handoff`)
  }

  console.log('Verified eight silent, unique, composition-locked cinematic scenes')
} finally {
  await rm(workDirectory, { recursive: true, force: true })
}
