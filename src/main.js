import './style.css'
import { scenes } from './scenes.js'

const media = [...document.querySelectorAll('.scene-media')]
const chapters = [...document.querySelectorAll('.chapter')]
const progressFill = document.querySelector('.progress-rail__track i')
const progressCount = document.querySelector('.progress-rail__count')
const menuToggle = document.querySelector('.menu-toggle')
const menuLabel = menuToggle?.querySelector('.sr-only')
const mobileNav = document.querySelector('#mobile-nav')
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const saveData = navigator.connection?.saveData === true

let activeIndex = 0
let scrollRaf = null
let autoplayRaf = null
let autoplayStart = performance.now()
let userHasScrolled = false
let chapterMetrics = []
let maxScroll = 1

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function ensureAdjacentSources(index) {
  media.forEach((video, videoIndex) => {
    if (Math.abs(videoIndex - index) > 1) return
    if (!video.getAttribute('poster')) video.setAttribute('poster', video.dataset.poster)
    if (reducedMotion.matches || saveData) return

    const source = video.querySelector('source')
    if (!source.getAttribute('src')) source.setAttribute('src', source.dataset.src)
    if (video.preload !== 'metadata') video.preload = 'metadata'
    video.load()
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
  progressCount.textContent = `${String(index + 1).padStart(2, '0')} / ${String(scenes.length).padStart(2, '0')}`
  ensureAdjacentSources(index)
}

function setVideoTime(video, progress) {
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return
  const target = clamp(progress, 0, 0.999) * video.duration
  if (Math.abs(video.currentTime - target) > 0.045) video.currentTime = target
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
  const totalProgress = scrollY >= maxScroll - 1 ? 1 : clamp((index + localProgress) / scenes.length, 0, 1)

  showScene(index)
  progressFill.style.transform = `scaleX(${totalProgress})`

  if (!reducedMotion.matches && !saveData) {
    setVideoTime(media[index], localProgress)
    const nextIndex = Math.min(index + 1, scenes.length - 1)
    const seam = clamp((localProgress - 0.92) / 0.08, 0, 1)
    if (nextIndex !== index) {
      media[index].style.opacity = String(1 - seam)
      media[nextIndex].style.opacity = String(seam)
      setVideoTime(media[nextIndex], 0)
    }
    media.forEach((video, videoIndex) => {
      if (videoIndex !== index && videoIndex !== nextIndex) video.style.opacity = ''
    })
  }
}

function requestJourneyUpdate(markInteraction = true) {
  if (markInteraction) {
    userHasScrolled = true
    if (autoplayRaf) cancelAnimationFrame(autoplayRaf)
    autoplayRaf = null
  }
  if (!scrollRaf) scrollRaf = requestAnimationFrame(updateJourney)
}

function openingMotion(now) {
  if (reducedMotion.matches || saveData || userHasScrolled || window.scrollY > 2 || document.hidden) return
  const opening = media[0]
  if (Number.isFinite(opening.duration) && opening.duration > 0) {
    const elapsed = (now - autoplayStart) / 1000
    const cap = Math.min(3.5, opening.duration * 0.42)
    opening.currentTime = Math.min(elapsed, cap)
    if (elapsed >= cap) {
      autoplayRaf = null
      return
    }
  } else if (now - autoplayStart > 5000) {
    autoplayRaf = null
    return
  }
  autoplayRaf = requestAnimationFrame(openingMotion)
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
  video.addEventListener('error', () => video.classList.add('has-error'))
})

chapters[0]?.classList.add('is-current')
document.documentElement.classList.add('is-enhanced')
measureJourney()
ensureAdjacentSources(0)
updateJourney()
autoplayRaf = requestAnimationFrame(openingMotion)
window.addEventListener('scroll', requestJourneyUpdate, { passive: true })
window.addEventListener('resize', () => {
  measureJourney()
  requestJourneyUpdate(false)
})
reducedMotion.addEventListener('change', () => {
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
