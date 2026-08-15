import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AccountMenu } from '@/portal/components/AccountMenu'
import { NotificationsPanel, type PanelItem } from '@/portal/components/NotificationsPanel'
import { MobileMenuButton } from '@/portal/components/MobileNavigationDrawer'
import { formatDate } from '@/portal/admin/lib/format'

const GRAVEDAD_TONO: Record<string, PanelItem['tono']> = {
  ALTA: 'critico',
  MEDIA: 'atencion',
  BAJA: 'neutro',
}

export function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data } = useAdminData()
  const [openPanel, setOpenPanel] = useState<'alerts' | 'account' | null>(null)

  const alertItems: PanelItem[] = data.securityAlerts
    .filter((item) => item.estado === 'ABIERTA')
    .map((item) => ({
      id: item.id,
      titulo: item.titulo,
      mensaje: `${item.cuenta} · ${item.ubicacion}`,
      fecha: formatDate(item.created_at),
      tono: GRAVEDAD_TONO[item.gravedad] ?? 'atencion',
    }))

  const togglePanel = (panel: 'alerts' | 'account') =>
    setOpenPanel((current) => (current === panel ? null : panel))

  const irAAlertasSeguridad = () => {
    setOpenPanel(null)
    navigate('/app/admin/alertas-seguridad')
  }

  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-1 border-b border-line bg-card px-2 sm:gap-3 sm:px-4">
      <MobileMenuButton onOpen={onOpenMenu} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-900 sm:flex-none">
        Administración SAFE
      </span>

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('alerts')}
            aria-label="Alertas de seguridad"
            aria-expanded={openPanel === 'alerts'}
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
              title="Alertas de seguridad"
              items={alertItems}
              emptyMessage="No hay alertas de seguridad abiertas."
              onClose={() => setOpenPanel(null)}
              onNavigate={irAAlertasSeguridad}
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
            aria-label={`Menú de cuenta de ${user?.nombres ?? 'usuario'}`}
            className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[12px] font-bold text-white">
              {user?.iniciales}
            </span>
            <span className="hidden whitespace-nowrap text-[13.5px] font-semibold text-ink-900 sm:block">
              {user?.nombres.split(' ')[0]}
            </span>
            <ChevronDown className="hidden h-[15px] w-[15px] text-ink-500 sm:block" aria-hidden="true" />
          </button>
          {openPanel === 'account' && <AccountMenu onClose={() => setOpenPanel(null)} />}
        </div>
      </div>
    </header>
  )
}
