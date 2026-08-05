import { useState } from 'react'
import { Button } from '@/components/ui/button'

const NAV_LINKS = [
  { key: 'inicio', label: 'Inicio' },
  { key: 'como', label: '¿Cómo funciona?' },
  { key: 'planes', label: 'Planes' },
  { key: 'acerca', label: 'Acerca de' },
  { key: 'trabaja', label: 'Trabaja con SAFE' },
] as const

export function Navbar({
  activePage,
  onNavigate,
}: {
  activePage?: string
  onNavigate?: (key: string) => void
}) {
  const [active, setActive] = useState<string>('inicio')
  const current = activePage ?? active

  const handleNavClick = (key: string) => {
    setActive(key)
    onNavigate?.(key)
  }

  return (
    <div className="flex items-center justify-between px-6 py-5 sm:px-8 lg:px-16">
      <div className="flex items-center gap-8">
        <span
          onClick={() => handleNavClick('inicio')}
          className="cursor-pointer font-display text-xl font-extrabold tracking-tight text-navy-900"
        >
          SAFE
        </span>
        <div className="flex gap-5">
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
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="text-navy-500 hover:scale-[1.02] hover:text-navy-600">
          Iniciar sesión
        </Button>
        <Button className="hover:scale-[1.02]">Crear cuenta</Button>
      </div>
    </div>
  )
}
