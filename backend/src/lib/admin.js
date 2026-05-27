export function isAdminUser(user) {
  if (!user) return false
  return user.email === 'admin@talentstage.com' || user.role === 'admin'
}
