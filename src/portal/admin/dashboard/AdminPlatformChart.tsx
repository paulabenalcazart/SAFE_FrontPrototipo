import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'

export function AdminPlatformChart() {
  const { data } = useAdminData()
  const max = Math.max(0, ...data.dashboard.monthly.flatMap((item) => [item.registrations, item.subscriptions]))

  return (
    <>
      <div className="mt-5">
        <h2 className="text-base font-semibold text-ink-900">Resumen de la plataforma</h2>
        <p className="mt-1 text-sm text-ink-600">Evolución mensual de registros y suscripciones.</p>
      </div>
      <AdminCard className="mt-3 p-4">
        <div className="flex h-48 min-w-0 items-end gap-3 overflow-x-auto pb-6" aria-label="Registros y suscripciones por mes">
          {data.dashboard.monthly.map((item) => (
            <div className="flex min-w-9 flex-1 flex-col items-center gap-2" key={item.month}>
              <div className="flex h-40 items-end gap-1.5">
                <span
                  title={`${item.registrations} registros`}
                  className="w-4 rounded-t bg-navy-500"
                  style={{ height: `${max === 0 ? 0 : (item.registrations / max) * 100}%` }}
                />
                <span
                  title={`${item.subscriptions} suscripciones`}
                  className="w-4 rounded-t bg-emerald-brand"
                  style={{ height: `${max === 0 ? 0 : (item.subscriptions / max) * 100}%` }}
                />
              </div>
              <span className="text-xs text-ink-600">{item.month}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-center gap-4 text-xs text-ink-600">
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
            Registros
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
            Suscripciones
          </span>
        </div>
      </AdminCard>
    </>
  )
}
