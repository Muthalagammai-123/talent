export const PROJECTS_UPDATED = 'talentstage:projects-updated'
const BUMP_KEY = 'talentstage-projects-bump'

export function notifyProjectsUpdated() {
  try {
    localStorage.setItem(BUMP_KEY, String(Date.now()))
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(PROJECTS_UPDATED))
}

export function getProjectsBump() {
  try {
    return Number(localStorage.getItem(BUMP_KEY) || 0)
  } catch {
    return 0
  }
}

/** Same-tab + cross-tab (client posts job → freelancer browse updates) */
export function subscribeProjectsUpdated(callback) {
  const onEvent = () => callback()
  const onStorage = (e) => {
    if (e.key === BUMP_KEY) callback()
  }
  window.addEventListener(PROJECTS_UPDATED, onEvent)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(PROJECTS_UPDATED, onEvent)
    window.removeEventListener('storage', onStorage)
  }
}
