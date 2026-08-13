import { Building2, CreditCard, ShieldCheck, UsersRound } from 'lucide-react'
import { AdminKpiCard } from '@/portal/admin/components/ui/AdminKpiCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { formatNumber } from '@/portal/admin/lib/format'
import { AdminPlatformChart } from './AdminPlatformChart'
import { AdminRecentActivity } from './AdminRecentActivity'

const icons = [UsersRound, Building2, CreditCard, ShieldCheck]

export function AdminDashboardScreen() {
  const { data } = useAdminData()
  const kpis = data.dashboard.metrics.map((metric, index) => ({ title: metric.label, value: formatNumber(metric.value), note: `${metric.delta} ${metric.note}`, icon: icons[index] ?? UsersRound }))
  return <><AdminPageHeader title="Dashboard" description="Supervisa la operación general de SAFE desde una vista consolidada." /><div className="admin-kpi-grid">{kpis.map((item) => <AdminKpiCard key={item.title} item={item} />)}</div><AdminPlatformChart /><AdminRecentActivity /></>
}
