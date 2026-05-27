import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  savePostMedia,
  deletePostMedia,
  hydratePostMedia,
  stripPostMediaBlobs,
  stripPostMediaForAPI,
  mergePosts,
} from '@/lib/postMedia'
import { api, getToken } from '@/lib/api'
import { portfolioKey, photoKey, clearLegacyPortfolioStorage } from '@/lib/portfolioStorage'
import { useAuth } from '@/contexts/AuthContext'

export const emptyProject = () => ({
  id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  description: '',
  link: '',
  live: '',
  image: 'gradient-1',
})

export const emptyPortfolioState = (name = '') => ({
  name,
  title: '',
  bio: '',
  description: '',
  skills: [],
  education: [],
  experience: [],
  projects: [],
  posts: [],
  certifications: [],
  interests: [],
  completion: 0,
  aiScore: null,
  profilePhoto: null,
})

function calcCompletion(data) {
  let filled = 0
  const total = 10
  if (data.profilePhoto) filled++
  if (data.name?.trim()) filled++
  if (data.bio?.trim()) filled++
  if (data.description?.trim()) filled++
  if (data.skills?.length) filled++
  if (data.interests?.length) filled++
  if (data.education?.length) filled++
  if (data.certifications?.length) filled++
  if (data.projects?.length) filled++
  if (data.posts?.length) filled++
  return Math.round((filled / total) * 100)
}

function loadPhoto(userId) {
  try {
    const key = photoKey(userId)
    return localStorage.getItem(key) || sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function savePhoto(userId, profilePhoto) {
  const key = photoKey(userId)
  try {
    if (profilePhoto) {
      localStorage.setItem(key, profilePhoto)
      sessionStorage.setItem(key, profilePhoto)
    } else {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    }
    return true
  } catch {
    try {
      if (profilePhoto) sessionStorage.setItem(key, profilePhoto)
      else sessionStorage.removeItem(key)
      return true
    } catch {
      return false
    }
  }
}

function loadLocalPortfolio(userId, userName) {
  clearLegacyPortfolioStorage()
  const base = emptyPortfolioState(userName)
  try {
    const saved = localStorage.getItem(portfolioKey(userId))
    const photo = loadPhoto(userId)
    if (saved) {
      const parsed = JSON.parse(saved)
      return {
        ...base,
        ...parsed,
        profilePhoto: photo || null,
        projects: (parsed.projects || []).map((p, i) => ({
          ...p,
          id: p.id || `proj-${i}`,
        })),
        posts: hydratePostMedia(parsed.posts || []),
      }
    }
    if (photo) return { ...base, profilePhoto: photo }
  } catch {
    /* ignore */
  }
  return base
}

function persistPortfolio(userId, data) {
  const completion = calcCompletion(data)
  const next = { ...data, completion }
  const { profilePhoto, ...rest } = next

  if (profilePhoto && !savePhoto(userId, profilePhoto)) {
    return { error: 'Photo too large — try a smaller image (under 1MB).' }
  }
  if (!profilePhoto) savePhoto(userId, null)

  try {
    const toStore = { ...rest, posts: stripPostMediaBlobs(rest.posts) }
    if (userId) localStorage.setItem(portfolioKey(userId), JSON.stringify(toStore))
  } catch (e) {
    console.error('Failed to save portfolio', e)
    return { error: 'Save failed — storage full. Try a smaller photo.' }
  }
  return { data: next, error: null }
}

function stripPhotoForApi(data) {
  const { profilePhoto, ...rest } = data
  return { ...rest, posts: stripPostMediaForAPI(rest.posts) }
}

const PortfolioContext = createContext(null)

export function PortfolioProvider({ children }) {
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id
  const [portfolio, setPortfolio] = useState(() => emptyPortfolioState(user?.name))
  const [saveError, setSaveError] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  const [loading, setLoading] = useState(false)
  const syncTimer = useRef(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setPortfolio(emptyPortfolioState())
      return
    }

    setLoading(true)
    const local = loadLocalPortfolio(userId, user.name)

    if (!getToken()) {
      setPortfolio(local)
      setLoading(false)
      return
    }

    api
      .getPortfolio()
      .then(({ portfolio: p }) => {
        const photo = loadPhoto(userId)
        setPortfolio({
          ...local,
          ...emptyPortfolioState(user.name),
          ...p,
          name: p?.name || user.name,
          profilePhoto: photo || null,
          posts: mergePosts(p?.posts, local.posts),
        })
      })
      .catch(() => {
        setPortfolio({ ...local, name: local.name || user.name })
      })
      .finally(() => setLoading(false))
  }, [userId, user?.name, isAuthenticated])

  const syncToApi = useCallback(
    (data) => {
      if (!getToken() || !userId) return
      clearTimeout(syncTimer.current)
      syncTimer.current = setTimeout(() => {
        api.savePortfolio(stripPhotoForApi(data), data.aiScore).catch((err) => {
          console.warn('Portfolio sync:', err.message)
        })
      }, 800)
    },
    [userId]
  )

  const applySave = useCallback(
    (updater) => {
      if (!userId) return
      setPortfolio((prev) => {
        const draft = typeof updater === 'function' ? updater(prev) : updater
        const result = persistPortfolio(userId, draft)
        if (result.error) {
          setSaveError(result.error)
          return prev
        }
        setSaveError(null)
        setLastSaved(Date.now())
        syncToApi(result.data)
        return result.data
      })
    },
    [syncToApi, userId]
  )

  const updatePortfolio = useCallback(
    (updates) => {
      applySave((prev) => ({ ...prev, ...updates }))
    },
    [applySave]
  )

  const setProfilePhoto = useCallback(
    (profilePhoto) => {
      applySave((prev) => ({ ...prev, profilePhoto }))
    },
    [applySave]
  )

  const addProject = useCallback(() => {
    applySave((prev) => ({
      ...prev,
      projects: [...(prev.projects || []), emptyProject()],
    }))
  }, [applySave])

  const updateProject = useCallback(
    (id, field, value) => {
      applySave((prev) => ({
        ...prev,
        projects: (prev.projects || []).map((p) => (p.id === id ? { ...p, [field]: value } : p)),
      }))
    },
    [applySave]
  )

  const removeProject = useCallback(
    (id) => {
      applySave((prev) => ({
        ...prev,
        projects: (prev.projects || []).filter((p) => p.id !== id),
      }))
    },
    [applySave]
  )

  const addEducation = useCallback(() => {
    applySave((prev) => ({
      ...prev,
      education: [...(prev.education || []), { school: '', degree: '', year: '' }],
    }))
  }, [applySave])

  const updateEducation = useCallback(
    (index, field, value) => {
      applySave((prev) => {
        const education = [...(prev.education || [])]
        education[index] = { ...education[index], [field]: value }
        return { ...prev, education }
      })
    },
    [applySave]
  )

  const removeEducation = useCallback(
    (index) => {
      applySave((prev) => ({
        ...prev,
        education: (prev.education || []).filter((_, i) => i !== index),
      }))
    },
    [applySave]
  )

  const addCertification = useCallback(() => {
    applySave((prev) => ({
      ...prev,
      certifications: [
        ...(prev.certifications || []),
        { id: `c-${Date.now()}`, name: '', issuer: '', year: '' },
      ],
    }))
  }, [applySave])

  const updateCertification = useCallback(
    (index, field, value) => {
      applySave((prev) => {
        const certifications = [...(prev.certifications || [])]
        certifications[index] = { ...certifications[index], [field]: value }
        return { ...prev, certifications }
      })
    },
    [applySave]
  )

  const removeCertification = useCallback(
    (index) => {
      applySave((prev) => ({
        ...prev,
        certifications: (prev.certifications || []).filter((_, i) => i !== index),
      }))
    },
    [applySave]
  )

  const addPost = useCallback(
    ({ content = '', attachments = [] }) => {
      if (!attachments.length && !content.trim()) return
      const refs = []
      try {
        for (const { id, type, name, dataUrl } of attachments) {
          if (!dataUrl) {
            setSaveError('Upload failed — try again.')
            return
          }
          savePostMedia(id, dataUrl)
          refs.push({ id, type, name, dataUrl })
        }
      } catch (e) {
        setSaveError(e.message || 'Could not save media.')
        return
      }
      applySave((prev) => {
        const post = {
          id: `post-${Date.now()}`,
          content,
          media: refs,
          createdAt: new Date().toISOString(),
        }
        return { ...prev, posts: [post, ...(prev.posts || [])] }
      })
    },
    [applySave]
  )

  const deletePost = useCallback(
    (postId) => {
      applySave((prev) => {
        const post = (prev.posts || []).find((p) => p.id === postId)
        if (post?.media?.length) deletePostMedia(post.media.map((m) => m.id))
        return { ...prev, posts: (prev.posts || []).filter((p) => p.id !== postId) }
      })
    },
    [applySave]
  )

  const resetPortfolio = useCallback(() => {
    if (userId) {
      localStorage.removeItem(portfolioKey(userId))
      savePhoto(userId, null)
    }
    setPortfolio(emptyPortfolioState(user?.name))
    setSaveError(null)
  }, [userId, user?.name])

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        saveError,
        lastSaved,
        loading,
        updatePortfolio,
        setProfilePhoto,
        addProject,
        updateProject,
        removeProject,
        addEducation,
        updateEducation,
        removeEducation,
        addCertification,
        updateCertification,
        removeCertification,
        addPost,
        deletePost,
        resetPortfolio,
      }}
    >
      {children}
    </PortfolioContext.Provider>
  )
}

export function usePortfolio() {
  const ctx = useContext(PortfolioContext)
  if (!ctx) throw new Error('usePortfolio must be used within PortfolioProvider')
  return ctx
}
