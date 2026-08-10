import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  nombres: string
  apellidos: string
  correo: string
  iniciales: string
  mfaHabilitado: boolean
}

type AuthContextValue = {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
  updateUser: (patch: Partial<Pick<AuthUser, 'nombres' | 'apellidos' | 'correo'>>) => void
  toggleMfa: () => void
}

function calcularIniciales(nombres: string, apellidos: string): string {
  const inicial = (valor: string) => valor.trim().charAt(0).toUpperCase()
  return `${inicial(nombres)}${inicial(apellidos)}`
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

  const updateUser = (patch: Partial<Pick<AuthUser, 'nombres' | 'apellidos' | 'correo'>>) => {
    setUser((current) => {
      if (!current) return current
      const nombres = patch.nombres ?? current.nombres
      const apellidos = patch.apellidos ?? current.apellidos
      return { ...current, ...patch, iniciales: calcularIniciales(nombres, apellidos) }
    })
  }

  const toggleMfa = () => {
    setUser((current) => (current ? { ...current, mfaHabilitado: !current.mfaHabilitado } : current))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, toggleMfa }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
