const MEDIA_PREFIX = 'talentstage-media-'
const MEDIA_KEY = 'talentstage-post-media'

function loadLegacyMap() {
  try {
    return JSON.parse(localStorage.getItem(MEDIA_KEY) || sessionStorage.getItem(MEDIA_KEY) || '{}')
  } catch {
    return {}
  }
}

/** Per-file storage avoids one huge JSON blob hitting quota */
export function savePostMedia(mediaId, dataUrl) {
  if (!mediaId || !dataUrl) return
  try {
    localStorage.setItem(`${MEDIA_PREFIX}${mediaId}`, dataUrl)
    sessionStorage.setItem(`${MEDIA_PREFIX}${mediaId}`, dataUrl)
  } catch (e) {
    console.warn('Post media storage full', e)
    throw new Error('Storage full — use a smaller image or video.')
  }
}

export function getPostMedia(mediaId) {
  if (!mediaId) return null
  try {
    const direct =
      localStorage.getItem(`${MEDIA_PREFIX}${mediaId}`) ||
      sessionStorage.getItem(`${MEDIA_PREFIX}${mediaId}`)
    if (direct) return direct
  } catch {
    /* ignore */
  }
  return loadLegacyMap()[mediaId] || null
}

export function deletePostMedia(mediaIds = []) {
  const legacy = loadLegacyMap()
  let legacyChanged = false
  mediaIds.forEach((id) => {
    localStorage.removeItem(`${MEDIA_PREFIX}${id}`)
    sessionStorage.removeItem(`${MEDIA_PREFIX}${id}`)
    if (legacy[id]) {
      delete legacy[id]
      legacyChanged = true
    }
  })
  if (legacyChanged) {
    try {
      localStorage.setItem(MEDIA_KEY, JSON.stringify(legacy))
    } catch {
      /* ignore */
    }
  }
}

/** Resolve playable URL for a media item */
export function resolveMediaSrc(item) {
  if (!item) return null
  return item.dataUrl || item.src || getPostMedia(item.id) || null
}

export function hydratePostMedia(posts = []) {
  return posts.map((post) => ({
    ...post,
    media: (post.media || []).map((m) => {
      const dataUrl = resolveMediaSrc(m)
      return dataUrl ? { ...m, dataUrl } : m
    }),
  }))
}

/** Keep media with dataUrl for localStorage (full version), strip only for API */
export function stripPostMediaBlobs(posts = []) {
  return (posts || []).map((post) => ({
    ...post,
    media: (post.media || []).map(({ id, type, name, dataUrl }) => ({ id, type, name, dataUrl })),
  }))
}

/** Strip for API submission (remove large dataUrls) */
export function stripPostMediaForAPI(posts = []) {
  return (posts || []).map((post) => ({
    ...post,
    media: (post.media || []).map(({ id, type, name }) => ({ id, type, name })),
  }))
}

export function mergePosts(apiPosts = [], localPosts = []) {
  const byId = new Map()
  const add = (list) => {
    for (const post of list || []) {
      const prev = byId.get(post.id)
      if (!prev) {
        byId.set(post.id, post)
        continue
      }
      const mediaById = new Map()
      for (const m of [...(prev.media || []), ...(post.media || [])]) {
        if (m?.id) mediaById.set(m.id, { ...mediaById.get(m.id), ...m })
      }
      byId.set(post.id, {
        ...prev,
        ...post,
        media: mediaById.size ? [...mediaById.values()] : post.media || prev.media,
      })
    }
  }
  add(localPosts)
  add(apiPosts)
  return hydratePostMedia([...byId.values()].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  ))
}

export async function resizeImage(file, maxWidth = 1200, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const ratio = Math.min(1, maxWidth / img.width)
      const w = Math.round(img.width * ratio)
      const h = Math.round(img.height * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.onerror = reject
    img.src = url
  })
}

export async function fileToDataUrl(file) {
  if (file.type.startsWith('image/')) {
    if (file.size > 8 * 1024 * 1024) throw new Error('Image must be under 8MB')
    return resizeImage(file)
  }
  if (file.type.startsWith('video/')) {
    if (file.size > 15 * 1024 * 1024) throw new Error('Video must be under 15MB')
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  throw new Error('Only images and videos are supported')
}
