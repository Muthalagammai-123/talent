const PREFIX = 'talentstage-portfolio'
const PHOTO_PREFIX = 'talentstage-profile-photo'

export function portfolioKey(userId) {
  return userId ? `${PREFIX}-${userId}` : PREFIX
}

export function photoKey(userId) {
  return userId ? `${PHOTO_PREFIX}-${userId}` : PHOTO_PREFIX
}

export function clearLegacyPortfolioStorage() {
  try {
    localStorage.removeItem('talentstage-portfolio')
    localStorage.removeItem('talentstage-profile-photo')
    sessionStorage.removeItem('talentstage-profile-photo')
  } catch {
    /* ignore */
  }
}
