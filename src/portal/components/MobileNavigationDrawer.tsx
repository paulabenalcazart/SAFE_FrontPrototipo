import { useEffect, useId, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import safeLogoLight from '@/assets/safe-logo-light.png'
import { useAuth } from '@/auth/AuthContext'
import { navItemsParaRol } from '@/portal/navigation'
import { acquireBodyScrollLock, acquireDialogLayer } from '@/portal/colaborador/solicitudes/dialogScrollLock'

export function MobileNavigationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const releaseLock = acquireBodyScrollLock()
    const layer = acquireDialogLayer()
    const frame = requestAnimationFrame(() => dialogRef.current?.querySelector<HTMLElement>('[data-drawer-title]')?.focus())
    const keydown = (event: KeyboardEvent) => {
      if (!layer.esTope()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])')
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', keydown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', keydown)
      layer.release()
      releaseLock()
      if (previousFocus.current?.isConnected) previousFocus.current.focus()
    }
  }, [onClose, open])

  if (!open || !user) return null
  const navItems = navItemsParaRol(user.role)
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-navy-900/45" aria-hidden="true" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} />
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className="relative flex h-full w-[min(20rem,calc(100vw-2rem))] flex-col overflow-hidden bg-navy-900 text-white shadow-2xl">
        <div className="flex min-h-14 items-center justify-between border-b border-white/10 px-4">
          <h2 id={titleId} data-drawer-title tabIndex={-1} className="flex items-center gap-2 outline-none"><img src={safeLogoLight} alt="SAFE" className="h-7 w-auto" /><span className="sr-only">Navegación principal</span></h2>
          <button type="button" onClick={onClose} aria-label="Cerrar menú" className="grid h-11 w-11 place-items-center rounded-lg hover:bg-white/10"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>
        <nav aria-label="Navegación principal móvil" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-3">
          {navItems.map((item) => <NavLink key={item.key} to={item.path} onClick={onClose} className={({ isActive }) => `flex min-h-11 items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-white/10 text-white' : 'text-white/75 hover:bg-white/5 hover:text-white'}`}><item.icon className="h-5 w-5 shrink-0" aria-hidden="true" /><span>{item.label}</span></NavLink>)}
        </nav>
      </div>
    </div>
  )
}

export function MobileMenuButton({ onOpen }: { onOpen: () => void }) {
  return <button type="button" onClick={onOpen} aria-label="Abrir menú" className="grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface lg:hidden"><Menu className="h-5 w-5" aria-hidden="true" /></button>
}
