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

function ffmpegBuffer(args) {
  const result = spawnSync(ffmpegPath, args, { encoding: null, maxBuffer: 16 * 1024 * 1024 })
  if (result.status !== 0) {
    throw new Error(result.stderr?.toString('utf8') || `ffmpeg failed with status ${result.status}`)
  }
  return result.stdout
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

const markPolygons = [
  [[35, 5], [44, 22], [64, 35], [45, 46], [35, 66], [25, 47], [5, 35], [25, 23]],
]

function insidePolygon(x, y, polygon) {
  let inside = false
  for (let current = 0, previous = polygon.length - 1; current < polygon.length; previous = current, current += 1) {
    const [currentX, currentY] = polygon[current]
    const [previousX, previousY] = polygon[previous]
    if ((currentY > y) !== (previousY > y) && x < ((previousX - currentX) * (y - currentY)) / (previousY - currentY) + currentX) {
      inside = !inside
    }
  }
  return inside
}

function buildMarkSamples(polygon) {
  const mark = []
  for (let y = 0; y < 120; y += 1) {
    for (let x = 0; x < 130; x += 1) {
      if (insidePolygon(x + 0.5, y + 0.5, polygon)) mark.push(y * 130 + x)
    }
  }

  const markSet = new Set(mark)
  const ring = []
  for (let y = 0; y < 120; y += 1) {
    for (let x = 0; x < 130; x += 1) {
      const index = y * 130 + x
      if (markSet.has(index)) continue
      let nearMark = false
      for (let offsetY = -6; offsetY <= 6 && !nearMark; offsetY += 1) {
        for (let offsetX = -6; offsetX <= 6; offsetX += 1) {
          const sampleX = x + offsetX
          const sampleY = y + offsetY
          if (sampleX < 0 || sampleX >= 130 || sampleY < 0 || sampleY >= 120) continue
          if (markSet.has(sampleY * 130 + sampleX)) {
            nearMark = true
            break
          }
        }
      }
      if (nearMark) ring.push(index)
    }
  }
  return { mark, ring }
}

const markSamples = markPolygons.map(buildMarkSamples)

function assertNoGeneratorMark(video, scene) {
  const width = 130
  const height = 120
  const frameSize = width * height
  const frames = ffmpegBuffer([
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    video,
    '-vf',
    `crop=${width}:${height}:1125:565,format=gray`,
    '-f',
    'rawvideo',
    '-',
  ])
  assert.equal(frames.length % frameSize, 0, `Generator-mark frames are malformed for scene ${scene}`)

  let maximumContrast = Number.NEGATIVE_INFINITY
  for (let offset = 0; offset < frames.length; offset += frameSize) {
    for (const { mark, ring } of markSamples) {
      const markMean = mark.reduce((sum, index) => sum + frames[offset + index], 0) / mark.length
      const ringMean = ring.reduce((sum, index) => sum + frames[offset + index], 0) / ring.length
      maximumContrast = Math.max(maximumContrast, markMean - ringMean)
    }
  }
  assert.ok(maximumContrast < 25, `Generator mark detected in scene ${scene} (contrast ${maximumContrast.toFixed(1)})`)
}

function assertNoSocialGeneratorMark(image) {
  const frames = ffmpegBuffer([
    '-hide_banner',
    '-loglevel',
    'error',
    '-i',
    image,
    '-vf',
    'crop=180:130:1020:500,format=gray',
    '-frames:v',
    '1',
    '-f',
    'rawvideo',
    '-',
  ])
  const brightPixels = [...frames].filter((value) => value >= 238).length
  assert.ok(brightPixels < 20, 'Generator mark detected in the social preview image')
}

try {
  const hashes = new Set()

  for (const scene of scenes) {
    const video = resolve(mediaDirectory, `scene-${scene}.mp4`)
    const output = ffmpeg(['-hide_banner', '-i', video, '-f', 'null', '-'])
    assert.match(output, /Video: h264/)
    assert.match(output, /1280x720/)
    assert.doesNotMatch(output, /Audio:/)
    assertNoGeneratorMark(video, scene)
    hashes.add(await sha256(video))
  }

  for (let index = 1; index < scenes.length; index += 1) {
    const current = scenes[index - 1]
    const next = scenes[index]
    const lastFrame = resolve(workDirectory, `scene-${current}-last.png`)
    const firstFrame = resolve(workDirectory, `scene-${next}-first.png`)
    ffmpeg(['-y', '-hide_banner', '-loglevel', 'error', '-sseof', '-0.05', '-i', resolve(mediaDirectory, `scene-${current}.mp4`), '-frames:v', '1', lastFrame])
    ffmpeg(['-y', '-hide_banner', '-loglevel', 'error', '-i', resolve(mediaDirectory, `scene-${next}.mp4`), '-frames:v', '1', firstFrame])
    const comparison = ffmpeg(['-hide_banner', '-i', lastFrame, '-i', firstFrame, '-lavfi', 'psnr', '-f', 'null', '-'])
    const match = comparison.match(/average:([\d.]+|inf)/)
    assert.ok(match, `Handoff comparison missing for scenes ${current} and ${next}`)
    assert.ok(match[1] === 'inf' || Number(match[1]) >= 30, `Scenes ${current} and ${next} must preserve the cinematic handoff`)
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

  assertNoSocialGeneratorMark(resolve(root, 'public', 'og-ferrumos.jpg'))

  console.log('Verified eight silent, unique, composition-locked cinematic scenes')
} finally {
  await rm(workDirectory, { recursive: true, force: true })
}
