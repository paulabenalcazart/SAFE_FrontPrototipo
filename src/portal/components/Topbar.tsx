import { useState } from 'react'
import { Bell, ChevronDown, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { notificaciones, obligaciones } from '@/portal/data/mock-portal-data'
import { AccountMenu } from './AccountMenu'
import { CompanySwitcher } from './CompanySwitcher'
import { NotificationsPanel, type PanelItem } from './NotificationsPanel'

type OpenPanel = 'alerts' | 'notifications' | 'account' | null

const alertItems: PanelItem[] = obligaciones
  .filter((o) => o.tono !== 'positivo')
  .map((o) => ({ id: o.id, titulo: o.nombre, mensaje: `Vence ${o.vence} · ${o.monto}`, fecha: o.estado, tono: o.tono }))

const notificationItems: PanelItem[] = notificaciones.map((n) => ({
  id: n.id,
  titulo: n.titulo,
  mensaje: n.mensaje,
  fecha: n.fecha,
  tono: n.leida ? 'neutro' : 'atencion',
}))

export function Topbar() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const { user } = useAuth()

  const togglePanel = (panel: OpenPanel) => setOpenPanel((current) => (current === panel ? null : panel))

  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-1 border-b border-line bg-card px-2 sm:gap-3 sm:px-4">
      <CompanySwitcher />

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('alerts')}
            aria-label="Alertas prioritarias"
            className="relative grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface"
          >
            <TriangleAlert className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
            {alertItems.length > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-brand px-1 text-[10px] font-bold text-navy-900">
                {alertItems.length}
              </span>
            )}
          </button>
          {openPanel === 'alerts' && (
            <NotificationsPanel
              title="Alertas prioritarias"
              items={alertItems}
              emptyMessage="No tienes alertas pendientes."
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('notifications')}
            aria-label="Notificaciones"
            className="relative grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface"
          >
            <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
            {notificationItems.some((n) => n.tono === 'atencion') && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy-500 px-1 text-[10px] font-bold text-white">
                {notificationItems.filter((n) => n.tono === 'atencion').length}
              </span>
            )}
          </button>
          {openPanel === 'notifications' && (
            <NotificationsPanel
              title="Notificaciones"
              items={notificationItems}
              emptyMessage="Aún no hay notificaciones."
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <span aria-hidden="true" className="mx-1 hidden h-6.5 w-px bg-line sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('account')}
            aria-haspopup="true"
            aria-expanded={openPanel === 'account'}
            aria-label={`Menú de cuenta de ${user?.nombre ?? 'usuario'}`}
            className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[12px] font-bold text-white">
              {user?.iniciales}
            </span>
            <span className="hidden whitespace-nowrap text-[13.5px] font-semibold text-ink-900 sm:block">
              {user?.nombre.split(' ')[0]}
            </span>
            <ChevronDown className="hidden h-[15px] w-[15px] text-ink-500 sm:block" aria-hidden="true" />
          </button>
          {openPanel === 'account' && <AccountMenu onClose={() => setOpenPanel(null)} />}
        </div>
      </div>
    </header>
  )
}
