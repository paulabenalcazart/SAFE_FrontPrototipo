import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  nombre: string
  correo: string
  iniciales: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'safe.auth.user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = (nextUser: AuthUser) => setUser(nextUser)
  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
