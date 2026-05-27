import { createContext, useContext, useState, useEffect } from 'react'
import { api, getToken, setToken, isApiEnabled } from '@/lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('talentstage-user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(!!getToken())

  const persist = (u, token) => {
    setUser(u)
    if (u) localStorage.setItem('talentstage-user', JSON.stringify(u))
    else localStorage.removeItem('talentstage-user')
    if (token !== undefined) setToken(token)
  }

  useEffect(() => {
    if (!getToken() || !isApiEnabled()) {
      setBootstrapping(false)
      return
    }
    api
      .me()
      .then(({ user: u }) => persist({ ...u, isAdmin: u.isAdmin, verification: u.verification }))
      .catch(() => {
        setToken(null)
        persist(null)
      })
      .finally(() => setBootstrapping(false))
  }, [])

  const login = async (credentials) => {
    setLoading(true)
    try {
      const { user: u, token } = await api.login(credentials)
      persist(u, token)
      return u
    } finally {
      setLoading(false)
    }
  }

  const signup = async (data) => {
    setLoading(true)
    try {
      const { user: u, token } = await api.signup(data)
      persist(u, token)
      return u
    } finally {
      setLoading(false)
    }
  }

  const setRole = async (role) => {
    if (getToken() && isApiEnabled()) {
      const { user: u, token } = await api.setRole(role)
      persist(u, token)
      return u
    }
    const updated = { ...user, role }
    persist(updated)
    return updated
  }

  const logout = () => persist(null, null)

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        bootstrapping,
        login,
        signup,
        setRole,
        logout,
        isAuthenticated: !!user,
        isFreelancer: user?.role === 'freelancer',
        isClient: user?.role === 'client',
        isAdmin:
          user?.isAdmin === true ||
          user?.email === 'admin@talentstage.com' ||
          user?.role === 'admin',
        verification: user?.verification,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
