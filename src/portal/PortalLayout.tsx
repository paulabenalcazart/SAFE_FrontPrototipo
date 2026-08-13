import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { PORTAL_SHELL_ID, useTemaPreferencia } from './configuracion/useTemaPreferencia'
import { MobileNavigationDrawer } from './components/MobileNavigationDrawer'

export function PortalLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  // Aplica el tema guardado apenas se monta el portal, sin depender de que el usuario
  // visite Configuración primero.
  useTemaPreferencia()

  return (
    <div id={PORTAL_SHELL_ID} className="flex min-h-screen bg-background text-ink-900" style={{ fontSize: 14 }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
      <MobileNavigationDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </div>
  )
}
