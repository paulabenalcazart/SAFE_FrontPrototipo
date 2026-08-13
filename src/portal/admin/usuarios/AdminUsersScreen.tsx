import { useDeferredValue, useMemo, useState } from 'react'
import { Building2, Download, Eye, Plus, RefreshCcw, UserCheck, UsersRound } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { downloadExcel } from '@/portal/admin/lib/exportExcel'
import { matchesQuery, uniqueValues } from '@/portal/admin/lib/filtering'
import { formatDate } from '@/portal/admin/lib/format'
import type { ApplicationRecord, CollaboratorRecord, CompanyRecord, UserRecord } from '@/portal/admin/types'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminFilterBar } from '@/portal/admin/components/data/AdminFilterBar'
import { AdminSelectFilter } from '@/portal/admin/components/data/AdminSelectFilter'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminKpiCard } from '@/portal/admin/components/ui/AdminKpiCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { AdminTabs } from '@/portal/admin/components/ui/AdminTabs'
import { AdminApplicationReviewDialog } from './AdminApplicationReviewDialog'
import { AdminRegistrationDialog, type AdminRegistrationKind } from './AdminRegistrationDialog'
import { AdminUserDetailDrawer, type AdminUserDetailTarget } from './AdminUserDetailDrawer'
import { deriveUserCounts } from './userLogic'

type UserTab = 'companies' | 'collaborators' | 'applications' | 'tour'
const userTabs: UserTab[] = ['companies', 'collaborators', 'applications', 'tour']
const tabIsValid = (value: string | null): value is UserTab => value !== null && userTabs.includes(value as UserTab)

export function AdminUsersScreen() {
  const { data } = useAdminData()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab')
  const [tab, setTab] = useState<UserTab>(tabIsValid(initialTab) ? initialTab : 'companies')
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [status, setStatus] = useState('Todos')
  const [secondary, setSecondary] = useState('Todos')
  const [detail, setDetail] = useState<AdminUserDetailTarget>(null)
  const [application, setApplication] = useState<ApplicationRecord | null>(null)
  const [registration, setRegistration] = useState<AdminRegistrationKind | null>(null)
  const counts = deriveUserCounts(data.users)
  const resetFilters = () => { setSearch(''); setStatus('Todos'); setSecondary('Todos') }
  const selectTab = (tab: UserTab) => { setTab(tab); setSearchParams({ tab }, { replace: true }); resetFilters() }
  const companyRows = useMemo(() => data.companies.filter((row) => matchesQuery(row, deferredSearch, ['nombre_comercial', 'razon_social', 'ruc', 'correo_empresarial']) && (status === 'Todos' || row.estado === status) && (secondary === 'Todos' || row.plan === secondary)), [data.companies, deferredSearch, secondary, status])
  const collaboratorRows = useMemo(() => data.collaborators.filter((row) => {
    const user = data.users.find((item) => item.id === row.usuario_id)
    return matchesQuery({ searchText: `${user?.nombres ?? ''} ${user?.apellidos ?? ''} ${user?.correo ?? ''} ${row.profesion} ${row.area_especializacion}` }, deferredSearch, ['searchText']) && (status === 'Todos' || row.estado === status) && (secondary === 'Todos' || row.specialties.includes(secondary))
  }), [data.collaborators, data.users, deferredSearch, secondary, status])
  const applicationRows = useMemo(() => data.applications.filter((row) => matchesQuery(row, deferredSearch, ['nombres', 'apellidos', 'correo', 'area_especializacion']) && (status === 'Todos' || row.estado === status) && (secondary === 'Todos' || row.especialidad_principal === secondary)), [data.applications, deferredSearch, secondary, status])
  const tourRows = useMemo(() => data.users.filter((row) => row.noCompany).filter((row) => matchesQuery(row, deferredSearch, ['nombres', 'apellidos', 'correo', 'ciudad']) && (status === 'Todos' || row.estado === status) && (secondary === 'Todos' || row.ciudad === secondary)), [data.users, deferredSearch, secondary, status])
  const companyColumns: AdminTableColumn<CompanyRecord>[] = [
    { id: 'company', header: 'Empresa', cell: (row) => <div><strong>{row.nombre_comercial}</strong><small>{row.ruc}</small></div> },
    { id: 'owner', header: 'Responsable', cell: (row) => { const user = data.users.find((item) => item.id === row.usuario_id); return <div><span>{user ? `${user.nombres} ${user.apellidos}` : '—'}</span><small>{user?.correo ?? row.correo_empresarial}</small></div> } },
    { id: 'plan', header: 'Plan', cell: (row) => row.plan }, { id: 'subscription', header: 'Suscripción', cell: (row) => <AdminStatusBadge status={row.subscriptionState} /> }, { id: 'created', header: 'Registro', cell: (row) => formatDate(row.created_at) },
  ]
  const collaboratorColumns: AdminTableColumn<CollaboratorRecord>[] = [
    { id: 'professional', header: 'Profesional', cell: (row) => { const user = data.users.find((item) => item.id === row.usuario_id); return <div><strong>{user ? `${user.nombres} ${user.apellidos}` : '—'}</strong><small>{row.profesion}</small></div> } },
    { id: 'specialty', header: 'Especialidad', cell: (row) => <div><span>{row.specialties[0] ?? row.area_especializacion}</span><small>{row.area_especializacion}</small></div> }, { id: 'rating', header: 'Calificación', cell: (row) => `${row.rating.toFixed(1)} · ${row.reviews} reseñas` }, { id: 'state', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> }, { id: 'created', header: 'Registro', cell: (row) => formatDate(row.created_at) },
  ]
  const applicationColumns: AdminTableColumn<ApplicationRecord>[] = [
    { id: 'professional', header: 'Profesional', cell: (row) => <div><strong>{row.nombres} {row.apellidos}</strong><small>{row.correo}</small></div> }, { id: 'specialty', header: 'Especialidad', cell: (row) => <div><span>{row.especialidad_principal}</span><small>{row.area_especializacion}</small></div> }, { id: 'state', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> }, { id: 'created', header: 'Fecha de solicitud', cell: (row) => formatDate(row.created_at) },
  ]
  const tourColumns: AdminTableColumn<UserRecord>[] = [
    { id: 'user', header: 'Usuario', cell: (row) => <div><strong>{row.nombres} {row.apellidos}</strong><small>{row.ciudad}, {row.pais}</small></div> }, { id: 'email', header: 'Correo', cell: (row) => row.correo }, { id: 'state', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> }, { id: 'created', header: 'Registro', cell: (row) => formatDate(row.created_at) }, { id: 'access', header: 'Último acceso', cell: (row) => formatDate(row.ultimo_acceso, true) },
  ]
  const kpis = [{ title: 'Empresas activas', value: data.companies.filter((item) => item.estado === 'ACTIVA').length, note: `${data.companies.length} total registradas`, icon: Building2 }, { title: 'Colaboradores activos', value: data.collaborators.filter((item) => item.estado === 'ACTIVO').length, note: `${data.collaborators.length} total registrados`, icon: UsersRound }, { title: 'Solicitudes pendientes', value: data.applications.filter((item) => ['PENDIENTE', 'EN_REVISION'].includes(item.estado)).length, note: 'requieren revisión', icon: UserCheck }]
  const filterBar = (secondaryLabel: string, statuses: string[], options: string[], title: string, headers: string[], values: Array<Array<string | number>>) => <AdminFilterBar search={search} onSearch={setSearch} searchLabel={`Buscar ${title}`} searchPlaceholder="Buscar por texto" actions={<><AdminButton size="sm" variant="ghost" onClick={resetFilters}><RefreshCcw aria-hidden="true" size={16} />Limpiar filtros</AdminButton><AdminButton size="sm" onClick={() => downloadExcel(title, headers, values, `safe-${tab}`)}><Download aria-hidden="true" size={16} />Exportar Excel</AdminButton></>}><AdminSelectFilter label="Estado" value={status} options={statuses} onChange={setStatus} /><AdminSelectFilter label={secondaryLabel} value={secondary} options={options} onChange={setSecondary} /></AdminFilterBar>
  return <><AdminPageHeader title="Usuarios" description="Gestiona empresas, colaboradores, postulaciones y cuentas desde un solo lugar." /><div className="grid grid-cols-1 gap-4 md:grid-cols-3">{kpis.map((item) => <AdminKpiCard key={item.title} item={item} />)}</div><AdminCard className="mt-5"><AdminTabs ariaLabel="Tipos de usuario" value={tab} onChange={selectTab} items={[{ value: 'companies', label: 'Empresas', count: data.companies.length }, { value: 'collaborators', label: 'Colaboradores', count: data.collaborators.length }, { value: 'applications', label: 'Solicitudes', count: data.applications.length }, { value: 'tour', label: 'Usuarios sin empresa', count: counts.noCompany }]}>
    <div className="p-4">{tab === 'companies' ? <><div className="flex flex-wrap items-center justify-between gap-3"><div><h2>Empresas</h2><p>{counts.company} usuarios con empresa</p></div><AdminButton variant="primary" onClick={() => setRegistration('company')}><Plus aria-hidden="true" size={16} />Registrar empresa</AdminButton></div>{filterBar('Plan', ['Todos', ...uniqueValues(data.companies, 'estado')], ['Todos', ...uniqueValues(data.companies, 'plan')], 'Empresas', ['Empresa', 'RUC', 'Ciudad', 'Plan', 'Suscripción', 'Registro'], companyRows.map((row) => [row.nombre_comercial, row.ruc, row.ciudad, row.plan, row.subscriptionState, row.created_at]))}<AdminDataTable rows={companyRows} columns={companyColumns} rowKey={(row) => row.id} caption="Empresas administradas" renderActions={(row) => <AdminButton size="icon" variant="ghost" aria-label="Ver empresa" onClick={() => setDetail({ kind: 'company', record: row })}><Eye aria-hidden="true" size={16} /></AdminButton>} /></> : null}
    {tab === 'collaborators' ? <><div className="flex flex-wrap items-center justify-between gap-3"><div><h2>Colaboradores</h2><p>{counts.collaborators} cuentas profesionales</p></div><AdminButton variant="primary" onClick={() => setRegistration('collaborator')}><Plus aria-hidden="true" size={16} />Registrar colaborador</AdminButton></div>{filterBar('Especialidad', ['Todos', ...uniqueValues(data.collaborators, 'estado')], ['Todos', ...Array.from(new Set(data.collaborators.flatMap((item) => item.specialties))).sort((a, b) => a.localeCompare(b, 'es'))], 'Colaboradores', ['Profesión', 'Área', 'Modalidad', 'Tarifa', 'Disponibilidad', 'Estado'], collaboratorRows.map((row) => [row.profesion, row.area_especializacion, row.modalidad_atencion, row.tarifa_referencial, row.estado_disponibilidad, row.estado]))}<AdminDataTable rows={collaboratorRows} columns={collaboratorColumns} rowKey={(row) => row.id} caption="Colaboradores administrados" renderActions={(row) => <AdminButton size="icon" variant="ghost" aria-label="Ver colaborador" onClick={() => setDetail({ kind: 'collaborator', record: row })}><Eye aria-hidden="true" size={16} /></AdminButton>} /></> : null}
    {tab === 'applications' ? <><div><h2>Solicitudes profesionales</h2><p>{data.applications.length} postulaciones registradas</p></div>{filterBar('Especialidad', ['Todos', ...uniqueValues(data.applications, 'estado')], ['Todos', ...uniqueValues(data.applications, 'especialidad_principal')], 'Solicitudes', ['Profesional', 'Correo', 'Área', 'Modalidad', 'Estado', 'Solicitud'], applicationRows.map((row) => [`${row.nombres} ${row.apellidos}`, row.correo, row.area_especializacion, row.modalidad_atencion, row.estado, row.created_at]))}<AdminDataTable rows={applicationRows} columns={applicationColumns} rowKey={(row) => row.id} caption="Solicitudes profesionales" renderActions={(row) => <AdminButton size="icon" variant="ghost" aria-label="Revisar solicitud" onClick={() => setApplication(row)}><Eye aria-hidden="true" size={16} /></AdminButton>} /></> : null}
    {tab === 'tour' ? <><div><h2>Usuarios sin empresa</h2><p>{counts.noCompany} cuentas aún sin empresa</p></div>{filterBar('Ciudad', ['Todos', ...uniqueValues(tourRows, 'estado')], ['Todos', ...uniqueValues(tourRows, 'ciudad')], 'Usuarios sin empresa', ['Usuario', 'Correo', 'Ciudad', 'Correo verificado', 'Estado'], tourRows.map((row) => [`${row.nombres} ${row.apellidos}`, row.correo, row.ciudad, row.correo_verificado ? 'Verificado' : 'Pendiente', row.estado]))}<AdminDataTable rows={tourRows} columns={tourColumns} rowKey={(row) => row.id} caption="Usuarios sin empresa" renderActions={(row) => <AdminButton size="icon" variant="ghost" aria-label="Ver usuario" onClick={() => setDetail({ kind: 'user', record: row })}><Eye aria-hidden="true" size={16} /></AdminButton>} /></> : null}</div>
  </AdminTabs></AdminCard><AdminUserDetailDrawer target={detail} onClose={() => setDetail(null)} /><AdminApplicationReviewDialog application={application} onClose={() => setApplication(null)} /><AdminRegistrationDialog kind={registration} open={Boolean(registration)} onClose={() => setRegistration(null)} /></>
}
