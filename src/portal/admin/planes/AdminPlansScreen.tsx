import { useDeferredValue, useMemo, useState } from 'react'
import { Boxes, CalendarClock, Download, Edit3, Eye, Plus, RefreshCcw, ShieldCheck, Trash2, UsersRound } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { summarizePlans } from '@/portal/admin/lib/adminMetrics'
import { matchesQuery } from '@/portal/admin/lib/filtering'
import { formatDate, formatMoney, formatNumber } from '@/portal/admin/lib/format'
import { downloadExcel } from '@/portal/admin/lib/exportExcel'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminFilterBar } from '@/portal/admin/components/data/AdminFilterBar'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminKpiCard } from '@/portal/admin/components/ui/AdminKpiCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { AdminTabs } from '@/portal/admin/components/ui/AdminTabs'
import type { PlanRecord } from '@/portal/admin/types'
import { AdminPlanDialog } from './AdminPlanDialog'

type PlanTab = 'plans' | 'usage' | 'permissions'
const rolePermissions = {
  USUARIO_EMPRESA: ['empresa.ver','empresa.crear','empresa.editar','finanzas.registrar','finanzas.ver','obligaciones.ver','simulaciones.ejecutar','marketplace.ver','marketplace.contactar'],
  COLABORADOR: ['colaborador.perfil','colaborador.solicitudes','citas.gestionar'],
  ADMINISTRADOR: ['empresa.ver','empresa.crear','empresa.editar','finanzas.registrar','finanzas.ver','obligaciones.ver','simulaciones.ejecutar','marketplace.ver','marketplace.contactar','colaborador.perfil','colaborador.solicitudes','citas.gestionar','admin.usuarios','admin.postulaciones','admin.planes','admin.normativa','admin.indicadores','admin.tutoriales','admin.incidencias','admin.logs','admin.auditoria'],
}
const roleLabels = { USUARIO_EMPRESA: 'Usuario empresa', COLABORADOR: 'Colaborador', ADMINISTRADOR: 'Administrador' }
const limitLabel = (code: string) => code.replace(/_/g, ' ').toLocaleLowerCase('es')
const limitValue = (value: number) => value >= 999 ? 'Ilimitado' : formatNumber(value)

export function AdminPlansScreen() {
  const { data, upsertEntity, removeEntity } = useAdminData()
  const [tab, setTab] = useState<PlanTab>('plans')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [editing, setEditing] = useState<PlanRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewing, setViewing] = useState<PlanRecord | null>(null)
  const [deleting, setDeleting] = useState<PlanRecord | null>(null)
  const summary = summarizePlans(data.plans)
  const latest = [...data.plans].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]?.updated_at
  const planRows = useMemo(() => data.plans.filter((plan) => matchesQuery(plan, deferredSearch, ['nombre', 'codigo', 'descripcion', 'nivel_soporte'])), [data.plans, deferredSearch])
  const open = (plan: PlanRecord | null) => { setEditing(plan); setDialogOpen(true) }
  const confirmDelete = (plan: PlanRecord) => {
    if (plan.users > 0) return
    removeEntity('plans', plan.id)
    setDeleting(null)
  }
  const planColumns: AdminTableColumn<PlanRecord>[] = [
    { id: 'plan', header: 'Plan', cell: (row) => <div><strong>{row.nombre}</strong><small>{row.codigo} · {row.descripcion}</small></div> },
    { id: 'price', header: 'Precio mensual', cell: (row) => formatMoney(row.precio_mensual, row.moneda) },
    { id: 'companies', header: 'Empresas', cell: (row) => (row.limits.EMPRESAS ?? 0) >= 999 ? 'Ilimitadas' : formatNumber(row.limits.EMPRESAS ?? 0) },
    { id: 'simulations', header: 'Simulaciones', cell: (row) => (row.limits.SIMULACIONES_MENSUALES ?? 0) >= 999 ? 'Ilimitadas' : `${formatNumber(row.limits.SIMULACIONES_MENSUALES ?? 0)} / mes` },
    { id: 'support', header: 'Soporte', cell: (row) => row.nivel_soporte.replace(/_/g, ' ') },
    { id: 'modules', header: 'Módulos', cell: (row) => `${row.modules.length} / ${data.modules.length}` },
    { id: 'state', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> },
  ]
  const usageRows = useMemo(() => data.plans.map((plan) => ({ id: plan.id, plan: plan.nombre, users: plan.users, companies: data.companies.filter((company) => company.plan.toLocaleLowerCase('es').includes(plan.nombre.replace('Plan ', '').toLocaleLowerCase('es'))).length, subscriptions: Math.max(0, plan.users - Math.round(plan.users * .08)), modules: plan.modules.length, updated_at: plan.updated_at })), [data.companies, data.plans])
  const usageColumns: AdminTableColumn<(typeof usageRows)[number]>[] = [
    { id: 'plan', header: 'Plan', cell: (row) => row.plan }, { id: 'users', header: 'Usuarios activos', cell: (row) => formatNumber(row.users) }, { id: 'companies', header: 'Empresas registradas', cell: (row) => formatNumber(row.companies) }, { id: 'subscriptions', header: 'Suscripciones vigentes', cell: (row) => formatNumber(row.subscriptions) }, { id: 'modules', header: 'Módulos habilitados', cell: (row) => `${row.modules} / ${data.modules.length}` }, { id: 'updated', header: 'Actualización', cell: (row) => formatDate(row.updated_at) },
  ]
  const permissionRows = Object.entries(rolePermissions).map(([role, permissions]) => ({ id: role, role: roleLabels[role as keyof typeof roleLabels], permissions }))
  const permissionColumns: AdminTableColumn<(typeof permissionRows)[number]>[] = [{ id: 'role', header: 'Rol', cell: (row) => <div><strong>{row.role}</strong><small>{row.permissions.length} permisos asignados</small></div> }, { id: 'permissions', header: 'Permisos por rol', cell: (row) => <div className="flex flex-wrap gap-2">{row.permissions.map((permission) => <span className="rounded-md border border-line px-2 py-1 text-xs" key={permission}>{permission}</span>)}</div> }]
  const exportPlans = () => downloadExcel('Planes y límites', ['Plan', 'Código', 'Precio', 'Empresas', 'Simulaciones', 'Soporte', 'Módulos', 'Estado'], planRows.map((plan) => [plan.nombre, plan.codigo, plan.precio_mensual, plan.limits.EMPRESAS ?? 0, plan.limits.SIMULACIONES_MENSUALES ?? 0, plan.nivel_soporte.replace(/_/g, ' '), plan.modules.length, plan.activo ? 'ACTIVO' : 'INACTIVO']), 'safe-planes')
  return <><AdminPageHeader title="Planes y permisos" description="Administra planes, límites, módulos y permisos de acceso desde una sola vista." actions={tab === 'plans' ? <AdminButton variant="primary" onClick={() => open(null)}><Plus aria-hidden="true" size={16} />Crear plan</AdminButton> : undefined} /><div className="admin-kpi-grid mt-5"><AdminKpiCard item={{ title: 'Planes activos', value: summary.active, note: `${data.plans.length} configurados`, icon: ShieldCheck }} /><AdminKpiCard item={{ title: 'Usuarios en planes', value: formatNumber(summary.users), note: 'usuarios con plan asignado', icon: UsersRound }} /><AdminKpiCard item={{ title: 'Módulos configurables', value: data.modules.length, note: 'capacidades disponibles', icon: Boxes }} /><AdminKpiCard item={{ title: 'Última actualización', value: latest ? formatDate(latest) : '—', note: 'cambio más reciente', icon: CalendarClock }} /></div><AdminCard className="mt-5 p-1"><AdminTabs ariaLabel="Gestión de planes" value={tab} onChange={(value) => { setTab(value); setSearch('') }} items={[{ value: 'plans', label: 'Planes y límites', count: data.plans.length }, { value: 'usage', label: 'Métricas por plan' }, { value: 'permissions', label: 'Permisos por rol' }]} /></AdminCard>{tab === 'plans' ? <AdminCard className="mt-4"><div className="flex flex-wrap items-start justify-between gap-3 p-4"><div><h2>Planes disponibles</h2><p>Precio, límites y funcionalidades incluidas en cada nivel.</p></div></div><AdminFilterBar search={search} onSearch={setSearch} searchPlaceholder="Buscar plan, código o soporte" actions={<><AdminButton size="sm" variant="ghost" onClick={() => setSearch('')}><RefreshCcw aria-hidden="true" size={15} />Limpiar</AdminButton><AdminButton size="sm" onClick={exportPlans}><Download aria-hidden="true" size={15} />Exportar Excel</AdminButton></>} /><AdminDataTable rows={planRows} columns={planColumns} rowKey={(row) => row.id} caption="Planes y límites configurados" pageSize={6} renderActions={(row) => <><AdminButton size="icon" variant="ghost" onClick={() => setViewing(row)} aria-label={`Ver plan ${row.nombre}`}><Eye aria-hidden="true" size={16} /></AdminButton><AdminButton size="icon" variant="ghost" onClick={() => open(row)} aria-label={`Editar ${row.nombre}`}><Edit3 aria-hidden="true" size={16} /></AdminButton><AdminButton size="icon" variant="ghost" onClick={() => setDeleting(row)} aria-label={`Eliminar plan ${row.nombre}`}><Trash2 aria-hidden="true" size={16} /></AdminButton></>} actionsLabel="Acciones" /></AdminCard> : null}{tab === 'usage' ? <AdminCard className="mt-4"><div className="p-4"><h2>Métricas por plan</h2><p>Uso agregado sin exponer información financiera individual.</p></div><AdminDataTable rows={usageRows} columns={usageColumns} rowKey={(row) => row.id} caption="Métricas agregadas por plan" pageSize={6} /></AdminCard> : null}{tab === 'permissions' ? <AdminCard className="mt-4"><div className="p-4"><h2>Permisos por rol</h2><p>Matriz de acceso de solo lectura.</p></div><AdminDataTable rows={permissionRows} columns={permissionColumns} rowKey={(row) => row.id} caption="Permisos por rol" pageSize={3} /><section className="border-t border-line p-4"><h3>Módulos del sistema</h3><p>Catálogo completo de capacidades configurables.</p><div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{data.modules.map((module) => <AdminCard className="p-3" key={module.codigo}><strong>{module.nombre}</strong><p>{module.descripcion}</p><code>{module.codigo}</code></AdminCard>)}</div></section></AdminCard> : null}<AdminPlanDialog plan={editing} open={dialogOpen} onClose={() => setDialogOpen(false)} data={data} existingPlans={data.plans} onSave={(plan) => upsertEntity('plans', plan)} /><AdminDialog open={Boolean(viewing)} title={viewing?.nombre ?? 'Detalle del plan'} description={viewing?.descripcion} onClose={() => setViewing(null)} wide footer={<AdminButton onClick={() => setViewing(null)}>Cerrar</AdminButton>}>{viewing ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><span>Código</span><strong className="block">{viewing.codigo}</strong></div><div><span>Precio mensual</span><strong className="block">{formatMoney(viewing.precio_mensual, viewing.moneda)}</strong></div><div><span>Días de prueba</span><strong className="block">{viewing.dias_prueba} días</strong></div><div><span>Soporte</span><strong className="block">{viewing.nivel_soporte.replace(/_/g, ' ')}</strong></div><div><span>Renovación automática</span><strong className="block">{viewing.renovacion_automatica_default ? 'Activada' : 'Desactivada'}</strong></div><div><span>Estado</span><AdminStatusBadge status={viewing.activo ? 'ACTIVO' : 'INACTIVO'} /></div><div className="md:col-span-2"><span>Módulos habilitados</span><div className="mt-2 flex flex-wrap gap-2">{viewing.modules.map((code) => <span className="rounded-md border border-line px-2 py-1 text-xs" key={code}>{data.modules.find((module) => module.codigo === code)?.nombre ?? code}</span>)}</div></div><div className="md:col-span-2"><span>Límites</span><div className="mt-2 flex flex-wrap gap-2">{Object.entries(viewing.limits).map(([code, value]) => <span className="rounded-md border border-line px-2 py-1 text-xs" key={code}>{limitLabel(code)}: {limitValue(value)}</span>)}</div></div></div> : null}</AdminDialog><AdminDialog open={Boolean(deleting)} title="Eliminar plan" description="Esta acción quitará el plan del catálogo administrativo." onClose={() => setDeleting(null)} footer={deleting?.users ? <AdminButton onClick={() => setDeleting(null)}>Entendido</AdminButton> : <><AdminButton onClick={() => setDeleting(null)}>Cancelar</AdminButton><AdminButton variant="danger" onClick={() => { if (deleting) confirmDelete(deleting) }}>Eliminar plan</AdminButton></>}>{deleting?.users ? <p>El plan tiene {deleting.users} usuarios o suscripciones activas. Migra o finaliza esas dependencias antes de eliminarlo.</p> : <p>¿Deseas eliminar <strong>{deleting?.nombre}</strong>? Esta acción no se puede deshacer.</p>}</AdminDialog></>
}
