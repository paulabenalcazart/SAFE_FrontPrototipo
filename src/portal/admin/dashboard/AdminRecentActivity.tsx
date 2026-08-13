import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { formatDate } from '@/portal/admin/lib/format'

export function AdminRecentActivity() {
  const { data } = useAdminData()
  const recentCompanies = [...data.companies].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4)
  const recentApplications = [...data.applications].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 4)
  return <section className="mt-5"><div><h2 className="text-lg font-semibold text-ink-900">Actividad reciente</h2><p className="mt-1 text-sm text-ink-600">Movimientos que requieren mayor seguimiento.</p></div><div className="mt-3 grid gap-4 lg:grid-cols-2"><AdminCard className="p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-ink-900">Empresas recientes</h3><Link className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-navy-700" to="/app/admin/usuarios?tab=companies">Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="mt-2 divide-y divide-line">{recentCompanies.map((company) => <div className="flex items-center justify-between gap-3 py-3" key={company.id}><div className="min-w-0"><strong className="block truncate text-sm text-ink-900">{company.nombre_comercial}</strong><span className="text-xs text-ink-600">{company.ciudad} · {company.plan}</span></div><AdminStatusBadge status={company.subscriptionState} /></div>)}</div></AdminCard><AdminCard className="p-4"><div className="flex items-center justify-between gap-2"><h3 className="font-semibold text-ink-900">Solicitudes recientes</h3><Link className="inline-flex min-h-11 items-center gap-1 text-sm font-medium text-navy-700" to="/app/admin/usuarios?tab=applications">Ver todos <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div><div className="mt-2 divide-y divide-line">{recentApplications.map((application) => <div className="flex items-center justify-between gap-3 py-3" key={application.id}><div className="min-w-0"><strong className="block truncate text-sm text-ink-900">{application.nombres} {application.apellidos}</strong><span className="text-xs text-ink-600">{application.area_especializacion} · {formatDate(application.created_at)}</span></div><AdminStatusBadge status={application.estado} /></div>)}</div></AdminCard></div></section>
}
