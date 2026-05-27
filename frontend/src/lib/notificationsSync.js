export const NOTIFICATIONS_UPDATED = 'talentstage:notifications-updated'

export function notifyFreelancer(payload = {}) {
  window.dispatchEvent(new CustomEvent(NOTIFICATIONS_UPDATED, { detail: payload }))
}
