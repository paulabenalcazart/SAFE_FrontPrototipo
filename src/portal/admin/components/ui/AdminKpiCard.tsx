import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import type { KpiDefinition } from '@/portal/admin/types'

export function AdminKpiCard({ item }: { item: KpiDefinition }) {
  const Icon = item.icon
  return (
    <AdminCard className="admin-kpi-card">
      <div className="admin-kpi-card__head"><span className="admin-kpi-card__icon"><Icon aria-hidden="true" size={18} strokeWidth={1.7} /></span><span>{item.title}</span></div>
      <strong className="admin-kpi-card__value">{item.value}</strong>
      <span className="admin-kpi-card__note">{item.note}</span>
    </AdminCard>
  )
}
