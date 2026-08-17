import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/auth/AuthContext'
import safeLogoDark from '@/assets/safe-logo-dark.png'

const NAV_LINKS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'como', label: '¿Cómo funciona?' },
  { key: 'planes', label: 'Planes' },
  { key: 'acerca', label: 'Acerca de' },
  { key: 'trabaja', label: 'Trabaja con SAFE' },
  { key: 'contacto', label: 'Contacto' },
] as const

export function Navbar({
  activePage,
  onNavigate,
}: {
  activePage?: string
  onNavigate?: (key: string) => void
}) {
  const [active, setActive] = useState<string>('inicio')
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const current = activePage ?? active
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const irADashboard = () => {
    setIsAccountOpen(false)
    setIsMenuOpen(false)
    navigate('/app/dashboard')
  }

  const cerrarSesion = () => {
    setIsAccountOpen(false)
    setIsMenuOpen(false)
    logout()
  }

  const handleNavClick = (key: string) => {
    setActive(key)
    setIsMenuOpen(false)
    onNavigate?.(key)
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-line/60 bg-white/85 px-6 py-4 backdrop-blur-md sm:px-8 lg:px-16">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <img
            src={safeLogoDark}
            alt="SAFE"
            onClick={() => handleNavClick('inicio')}
            className="h-8 w-auto cursor-pointer"
          />
          <div className="hidden gap-5 lg:flex">
            {NAV_LINKS.map((link) => (
              <span
                key={link.key}
                onClick={() => handleNavClick(link.key)}
                className={
                  'cursor-pointer text-sm transition-colors ' +
                  (current === link.key ? 'font-semibold text-navy-900' : 'font-medium text-ink-700')
                }
              >
                {link.label}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-3 sm:flex">
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAccountOpen((open) => !open)}
                aria-haspopup="true"
                aria-expanded={isAccountOpen}
                aria-label={`Menú de cuenta de ${user.nombres} ${user.apellidos}`}
                className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-navy-100"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[12px] font-bold text-white">
                  {user.iniciales}
                </span>
                <span className="whitespace-nowrap text-[13.5px] font-semibold text-ink-900">
                  {user.nombres.split(' ')[0]}
                </span>
                <ChevronDown className="h-[15px] w-[15px] text-ink-500" aria-hidden="true" />
              </button>
              {isAccountOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-[calc(100%+8px)] z-30 w-56 rounded-xl border border-line bg-card p-1.5 shadow-[var(--shadow-float)]"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={irADashboard}
                    className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-ink-900 hover:bg-surface"
                  >
                    Ir a dashboard
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={cerrarSesion}
                    className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-destructive hover:bg-surface"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Button
                variant="ghost"
                className="text-navy-500 hover:scale-[1.02] hover:text-navy-600"
                onClick={() => handleNavClick('login')}
              >
                Iniciar sesión
              </Button>
              <Button className="hover:scale-[1.02]" onClick={() => handleNavClick('signup')}>
                Crear cuenta
              </Button>
            </>
          )}
        </div>
        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-lg text-navy-700 transition-colors hover:bg-navy-100 lg:hidden"
          aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((open) => !open)}
        >
          {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {isMenuOpen && (
        <div className="absolute inset-x-0 top-full border-b border-line bg-white px-6 py-4 shadow-[var(--shadow-float)] sm:px-8 lg:hidden">
          <div className="mx-auto flex max-w-lg flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => handleNavClick(link.key)}
                className={
                  'rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-navy-100 ' +
                  (current === link.key ? 'font-semibold text-navy-900' : 'font-medium text-ink-700')
                }
              >
                {link.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-line pt-3 sm:hidden">
              {user ? (
                <>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[12px] font-bold text-white">
                      {user.iniciales}
                    </span>
                    <span className="truncate text-[13.5px] font-semibold text-ink-900">
                      {user.nombres} {user.apellidos}
                    </span>
                  </div>
                  <Button variant="ghost" className="flex-1 text-navy-500" onClick={irADashboard}>
                    Ir a dashboard
                  </Button>
                  <Button variant="ghost" className="flex-1 text-destructive" onClick={cerrarSesion}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <div className="flex gap-3">
                  <Button variant="ghost" className="flex-1 text-navy-500" onClick={() => handleNavClick('login')}>
                    Iniciar sesión
                  </Button>
                  <Button className="flex-1" onClick={() => handleNavClick('signup')}>
                    Crear cuenta
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
