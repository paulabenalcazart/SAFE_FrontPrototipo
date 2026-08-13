import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'

export function AdminPlatformChart() {
  const { data } = useAdminData()
  const max = Math.max(0, ...data.dashboard.monthly.flatMap((item) => [item.registrations, item.subscriptions]))
  return <AdminCard className="mt-5 p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-ink-900">Resumen de la plataforma</h2><p className="mt-1 text-sm text-ink-600">Evolución mensual de registros y suscripciones.</p></div><div className="flex gap-3 text-xs text-ink-600"><span>Registros</span><span>Suscripciones</span></div></div><div className="mt-4 flex h-48 min-w-0 items-end gap-2 overflow-x-auto pb-6" aria-label="Registros y suscripciones por mes">{data.dashboard.monthly.map((item) => <div className="flex min-w-9 flex-1 flex-col items-center gap-2" key={item.month}><div className="flex h-40 items-end gap-1"><span title={`${item.registrations} registros`} className="w-2 rounded-t bg-navy-600" style={{ height: `${max === 0 ? 0 : (item.registrations / max) * 100}%` }} /><span title={`${item.subscriptions} suscripciones`} className="w-2 rounded-t bg-blue-300" style={{ height: `${max === 0 ? 0 : (item.subscriptions / max) * 100}%` }} /></div><span className="text-xs text-ink-600">{item.month}</span></div>)}</div></AdminCard>
}
