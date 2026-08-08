import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  const current = activePage ?? active

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
            <div className="mt-2 flex gap-3 border-t border-line pt-3 sm:hidden">
              <Button variant="ghost" className="flex-1 text-navy-500" onClick={() => handleNavClick('login')}>
                Iniciar sesión
              </Button>
              <Button className="flex-1" onClick={() => handleNavClick('signup')}>
                Crear cuenta
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
