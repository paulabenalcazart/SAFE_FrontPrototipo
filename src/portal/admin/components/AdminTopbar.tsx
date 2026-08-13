import { useState } from 'react'
import { Bell, ChevronDown, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AccountMenu } from '@/portal/components/AccountMenu'
import { MobileMenuButton } from '@/portal/components/MobileNavigationDrawer'

export function AdminTopbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { user } = useAuth()
  const { data } = useAdminData()
  const [openPanel, setOpenPanel] = useState<'alerts' | 'account' | null>(null)
  const openAlerts = data.securityAlerts.filter((item) => item.estado === 'ABIERTA')
  return <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-2 border-b border-line bg-card px-2 sm:px-4">
    <MobileMenuButton onOpen={onOpenMenu} />
    <span className="min-w-0 truncate text-sm font-semibold text-ink-900">Administración SAFE</span>
    <div className="ml-auto flex items-center gap-1.5">
      <div className="relative">
        <button type="button" onClick={() => setOpenPanel((current) => current === 'alerts' ? null : 'alerts')} aria-label="Alertas de seguridad" aria-expanded={openPanel === 'alerts'} className="relative grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface"><Bell className="h-5 w-5" aria-hidden="true" />{openAlerts.length ? <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white">{openAlerts.length}</span> : null}</button>
        {openPanel === 'alerts' && <div className="absolute right-0 top-[calc(100%+8px)] z-30 w-80 rounded-xl border border-line bg-card p-2 shadow-[var(--shadow-float)]"><div className="px-2.5 py-2 text-sm font-semibold text-ink-900">Alertas de seguridad</div>{openAlerts.slice(0, 3).map((alert) => <div className="border-t border-line/70 px-2.5 py-2 text-xs text-ink-700" key={alert.id}><strong className="block text-sm">{alert.titulo}</strong>{alert.cuenta} · {alert.ubicacion}</div>)}<Link to="/app/admin/alertas-seguridad" onClick={() => setOpenPanel(null)} className="flex min-h-11 items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-navy-700 hover:bg-surface"><ShieldAlert className="h-4 w-4" aria-hidden="true" />Ver alertas de seguridad</Link></div>}
      </div>
      <div className="relative">
        <button type="button" onClick={() => setOpenPanel((current) => current === 'account' ? null : 'account')} aria-haspopup="true" aria-expanded={openPanel === 'account'} aria-label={`Menú de cuenta de ${user?.nombres ?? 'usuario'}`} className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface"><span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-xs font-bold text-white">{user?.iniciales}</span><span className="hidden text-sm font-semibold text-ink-900 sm:block">{user?.nombres}</span><ChevronDown className="hidden h-4 w-4 text-ink-500 sm:block" aria-hidden="true" /></button>
        {openPanel === 'account' && <AccountMenu onClose={() => setOpenPanel(null)} />}
      </div>
    </div>
  </header>
}
