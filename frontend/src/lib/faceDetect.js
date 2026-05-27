/**
 * Browser face detection for liveness (Chrome/Edge FaceDetector + fallback).
 */

let faceDetector = null

export function isFaceDetectionSupported() {
  return typeof window !== 'undefined' && 'FaceDetector' in window
}

async function getDetector() {
  if (!isFaceDetectionSupported()) return null
  if (!faceDetector) {
    faceDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 })
  }
  return faceDetector
}

function sampleCenterFaceScore(video) {
  if (!video?.videoWidth) return { count: 0, score: 0, fallback: true }
  const canvas = document.createElement('canvas')
  const w = Math.min(160, video.videoWidth)
  const h = Math.min(120, video.videoHeight)
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, w, h)
  const cx = Math.floor(w * 0.25)
  const cy = Math.floor(h * 0.2)
  const cw = Math.floor(w * 0.5)
  const ch = Math.floor(h * 0.55)
  const data = ctx.getImageData(cx, cy, cw, ch).data
  let sum = 0
  let sumSq = 0
  let skin = 0
  const n = data.length / 4
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    sum += lum
    sumSq += lum * lum
    if (r > 60 && g > 40 && b > 20 && r > g && r > b && lum > 40 && lum < 220) skin++
  }
  const mean = sum / n
  const variance = sumSq / n - mean * mean
  const skinRatio = skin / n
  const hasFace = variance > 380 && skinRatio > 0.12 && skinRatio < 0.72
  return {
    count: hasFace ? 1 : 0,
    score: hasFace ? Math.min(0.85, 0.5 + variance / 2000 + skinRatio) : 0.2,
    fallback: true,
  }
}

export async function detectFacesInVideo(video) {
  const detector = await getDetector()
  if (!detector) return sampleCenterFaceScore(video)

  try {
    const faces = await detector.detect(video)
    const count = faces.length
    const score = count === 1 ? 0.92 : count === 0 ? 0.15 : 0.35
    return { count, faces, score, fallback: false }
  } catch {
    return sampleCenterFaceScore(video)
  }
}

export function captureVideoFrame(video) {
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth || 640
  canvas.height = video.videoHeight || 480
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.85)
}

export function faceBoxMovement(prev, next) {
  if (!prev?.length || !next?.length) return false
  const a = prev[0].boundingBox
  const b = next[0].boundingBox
  const dx = Math.abs(a.x - b.x)
  const dy = Math.abs(a.y - b.y)
  return dx + dy > 12
}

export async function startCamera(videoEl, facingMode = 'user') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
    audio: false,
  })
  videoEl.srcObject = stream
  await videoEl.play()
  return stream
}

export function stopCamera(stream) {
  stream?.getTracks?.().forEach((t) => t.stop())
}
