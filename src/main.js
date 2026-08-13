import './style.css'
import { scenes } from './scenes.js'

const media = [...document.querySelectorAll('.scene-media')]
const chapters = [...document.querySelectorAll('.chapter')]
const menuToggle = document.querySelector('.menu-toggle')
const menuLabel = menuToggle?.querySelector('.sr-only')
const mobileNav = document.querySelector('#mobile-nav')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const coarsePointer = window.matchMedia('(pointer: coarse)')
const saveData = navigator.connection?.saveData === true

let activeIndex = 0
let scrollRaf = null
let autoplayRaf = null
let mediaRaf = null
let lastMediaTick = 0
let userHasScrolled = false
let chapterMetrics = []
let maxScroll = 1
let lastViewportWidth = window.innerWidth
let mediaPrimed = false
let openingBaseline = 0

const pendingSeeks = new WeakMap()
const sceneTargets = new WeakMap()
const sceneCurrents = new WeakMap()
const enhancedMotion = () => !reducedMotion.matches && !saveData

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const smooth = (value) => {
  const normalized = clamp(value, 0, 1)
  return normalized * normalized * (3 - 2 * normalized)
}

function loadSceneSource(index) {
  const video = media[index]
  if (!video || reducedMotion.matches || saveData || video.dataset.loaded === 'true') return
  const url = video.querySelector('source')?.dataset.src
  if (!url) return

  // Vercel serves byte ranges for the delivery MP4s. Assigning the URL to the
  // video itself lets the browser stream and seek natively; wrapping the full
  // response in a Blob delayed decoding and failed on some Chromium builds.
  video.src = url
  video.dataset.loaded = 'true'
  video.dataset.transport = 'byte-range'
  video.preload = index === activeIndex ? 'auto' : 'metadata'
  video.load()
}

function ensureAdjacentSources(index) {
  media.forEach((video, videoIndex) => {
    if (Math.abs(videoIndex - index) > 1) return
    if (!video.getAttribute('poster')) video.setAttribute('poster', video.dataset.poster)
    if (reducedMotion.matches || saveData) return
    void loadSceneSource(videoIndex)
  })
}

function measureJourney() {
  chapterMetrics = chapters.map((chapter) => ({
    top: chapter.offsetTop,
    height: chapter.offsetHeight,
  }))
  maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight)
}

function showScene(index) {
  if (index === activeIndex) return
  media[activeIndex]?.classList.remove('is-active')
  chapters[activeIndex]?.classList.remove('is-current')
  activeIndex = index
  media[activeIndex]?.classList.add('is-active')
  chapters[activeIndex]?.classList.add('is-current')
  ensureAdjacentSources(index)
}

function copyOpacity(index, progress) {
  if (index === 0) return 1 - smooth((progress - 0.6) / 0.18)
  if (index === scenes.length - 1) return smooth((progress - 0.1) / 0.2)
  const fadeIn = smooth((progress - 0.08) / 0.18)
  const fadeOut = 1 - smooth((progress - 0.68) / 0.16)
  return Math.min(fadeIn, fadeOut)
}

function updateCopyStage(index, progress) {
  chapters.forEach((chapter, chapterIndex) => {
    const copy = chapter.querySelector('.chapter__copy')
    if (!enhancedMotion()) {
      copy.style.removeProperty('--copy-opacity')
      copy.style.removeProperty('--copy-shift')
      copy.style.removeProperty('--copy-scale')
      copy.style.removeProperty('visibility')
      copy.style.removeProperty('pointer-events')
      copy.removeAttribute('aria-hidden')
      return
    }
    const opacity = chapterIndex === index ? copyOpacity(index, progress) : 0
    const shift = (0.5 - progress) * 42
    const scale = 0.985 + opacity * 0.015

    copy.style.setProperty('--copy-opacity', opacity.toFixed(3))
    copy.style.setProperty('--copy-shift', `${shift.toFixed(2)}px`)
    copy.style.setProperty('--copy-scale', scale.toFixed(4))
    copy.style.visibility = opacity > 0.002 ? 'visible' : 'hidden'
    copy.style.pointerEvents = opacity > 0.55 ? 'auto' : 'none'
    copy.setAttribute('aria-hidden', opacity > 0.12 ? 'false' : 'true')
  })
}

function setVideoTime(video, progress) {
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
  const baseline = video === media[0] ? openingBaseline : 0
  const target = baseline + clamp(progress, 0, 0.999) * Math.max(0, video.duration - baseline)
  if (video.seeking) {
    pendingSeeks.set(video, target)
    return
  }
  if (Math.abs(video.currentTime - target) > 0.045) video.currentTime = target
}

function animateMedia(now) {
  if (!reducedMotion.matches && !saveData && !document.hidden && now - lastMediaTick >= 1000 / 24) {
    lastMediaTick = now
    media.forEach((video) => {
      const target = sceneTargets.get(video)
      if (!Number.isFinite(target) || (video === media[0] && !userHasScrolled && !video.paused)) return

      let current = sceneCurrents.get(video)
      if (!Number.isFinite(current)) current = target
      current += (target - current) * 0.48
      if (Math.abs(target - current) < 0.0015) current = target
      sceneCurrents.set(video, current)
      setVideoTime(video, current)
    })
  }
  mediaRaf = requestAnimationFrame(animateMedia)
}

function updateJourney() {
  scrollRaf = null
  const scrollY = window.scrollY
  const activationOffset = window.innerHeight * 0.28
  let index = 0

  chapterMetrics.forEach((chapter, chapterIndex) => {
    if (scrollY >= chapter.top - activationOffset) index = chapterIndex
  })

  const segmentStart = index === 0 ? 0 : Math.max(0, chapterMetrics[index].top - activationOffset)
  const segmentEnd =
    index < chapters.length - 1
      ? chapterMetrics[index + 1].top - activationOffset
      : Math.max(segmentStart + 1, maxScroll)
  const localProgress = clamp((scrollY - segmentStart) / Math.max(1, segmentEnd - segmentStart), 0, 1)
  showScene(index)
  updateCopyStage(index, localProgress)

  if (!reducedMotion.matches && !saveData) {
    sceneTargets.set(media[index], localProgress)
    const nextIndex = Math.min(index + 1, scenes.length - 1)
    const seam = smooth((localProgress - 0.78) / 0.22)
    if (nextIndex !== index) {
      media[index].style.opacity = String(1 - seam)
      media[nextIndex].style.opacity = String(seam)
      sceneTargets.set(media[nextIndex], 0)
    }
    media.forEach((video, videoIndex) => {
      if (videoIndex !== index && videoIndex !== nextIndex) video.style.opacity = ''
    })
  }
}

function requestJourneyUpdate(markInteraction = true) {
  if (markInteraction) {
    if (!userHasScrolled) media[0]?.pause()
    userHasScrolled = true
    if (autoplayRaf) cancelAnimationFrame(autoplayRaf)
    autoplayRaf = null
  }
  if (!scrollRaf) scrollRaf = requestAnimationFrame(updateJourney)
}

async function startOpeningMotion() {
  if (reducedMotion.matches || saveData || userHasScrolled || window.scrollY > 2 || document.hidden) return
  const opening = media[0]
  loadSceneSource(0)
  try {
    await opening.play()
  } catch {
    return
  }

  const monitorOpening = () => {
    const cap = Number.isFinite(opening.duration) ? Math.min(3.5, opening.duration * 0.42) : 3.5
    if (userHasScrolled || window.scrollY > 2 || document.hidden || opening.currentTime >= cap) {
      if (Number.isFinite(opening.currentTime)) openingBaseline = Math.max(openingBaseline, opening.currentTime)
      sceneTargets.set(opening, 0)
      sceneCurrents.set(opening, 0)
      opening.pause()
      autoplayRaf = null
      return
    }
    autoplayRaf = requestAnimationFrame(monitorOpening)
  }

  autoplayRaf = requestAnimationFrame(monitorOpening)
}

async function primeLoadedMedia() {
  if (mediaPrimed || reducedMotion.matches || saveData) return
  mediaPrimed = true

  for (const video of media) {
    if (video.dataset.loaded !== 'true') continue
    const restoreTime = video.currentTime
    try {
      await video.play()
      video.pause()
      video.currentTime = restoreTime
    } catch {
      // Priming is an optional compatibility path; scroll-seeking remains available.
    }
  }
}

function closeNavigation({ restoreFocus = false } = {}) {
  if (!mobileNav || !menuToggle) return
  mobileNav.hidden = true
  menuToggle.setAttribute('aria-expanded', 'false')
  if (menuLabel) menuLabel.textContent = 'Open navigation'
  if (restoreFocus) menuToggle.focus()
}

if (media.length !== scenes.length || chapters.length !== scenes.length) {
  throw new Error('Static scene markup is out of sync with the scene registry')
}

media.forEach((video) => {
  video.addEventListener('loadedmetadata', () => {
    if (video === media[activeIndex]) updateJourney()
  })
  video.addEventListener('seeked', () => {
    const target = pendingSeeks.get(video)
    if (!Number.isFinite(target)) return
    pendingSeeks.delete(video)
    if (Math.abs(video.currentTime - target) > 0.045) video.currentTime = target
  })
  video.addEventListener('error', () => {
    video.classList.add('has-error')
    const source = video.querySelector('source')
    source.removeAttribute('src')
    video.removeAttribute('src')
    video.dataset.loaded = 'error'
    video.load()
  })
})

chapters[0]?.classList.add('is-current')
chapters.forEach((chapter, index) => {
  chapter.style.setProperty('--scene-height', `${Math.round((scenes[index].scroll ?? 1.8) * 100)}svh`)
})
document.documentElement.classList.toggle('is-enhanced', enhancedMotion())
measureJourney()
ensureAdjacentSources(0)
updateJourney()
void startOpeningMotion()
mediaRaf = requestAnimationFrame(animateMedia)
window.addEventListener('scroll', requestJourneyUpdate, { passive: true })
window.addEventListener('resize', () => {
  const widthChanged = Math.abs(window.innerWidth - lastViewportWidth) > 1
  if (coarsePointer.matches && !widthChanged) return
  lastViewportWidth = window.innerWidth
  measureJourney()
  requestJourneyUpdate(false)
})
window.addEventListener('pointerdown', primeLoadedMedia, { once: true, passive: true })
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !userHasScrolled && !autoplayRaf) void startOpeningMotion()
})
window.addEventListener('pagehide', () => {
  if (mediaRaf) cancelAnimationFrame(mediaRaf)
  mediaRaf = null
})
reducedMotion.addEventListener('change', () => {
  document.documentElement.classList.toggle('is-enhanced', enhancedMotion())
  media.forEach((video) => {
    video.style.opacity = ''
  })
  ensureAdjacentSources(activeIndex)
  requestJourneyUpdate(false)
})

menuToggle?.addEventListener('click', () => {
  const expanded = menuToggle.getAttribute('aria-expanded') === 'true'
  menuToggle.setAttribute('aria-expanded', String(!expanded))
  mobileNav.hidden = expanded
  if (menuLabel) menuLabel.textContent = expanded ? 'Open navigation' : 'Close navigation'
})

mobileNav?.addEventListener('click', (event) => {
  if (event.target.closest('a')) closeNavigation()
})

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || mobileNav?.hidden !== false) return
  closeNavigation({ restoreFocus: true })
})
