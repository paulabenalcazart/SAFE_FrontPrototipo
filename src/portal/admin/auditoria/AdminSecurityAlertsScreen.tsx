import { useDeferredValue, useMemo, useState } from 'react'
import { Download, Eye, RefreshCcw, ShieldAlert } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { filterSecurity } from '@/portal/admin/lib/adminMetrics'
import { downloadExcel } from '@/portal/admin/lib/exportExcel'
import { matchesQuery, uniqueValues } from '@/portal/admin/lib/filtering'
import { formatDate } from '@/portal/admin/lib/format'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminFilterBar } from '@/portal/admin/components/data/AdminFilterBar'
import { AdminSelectFilter } from '@/portal/admin/components/data/AdminSelectFilter'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminKpiCard } from '@/portal/admin/components/ui/AdminKpiCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import type { SecurityAlertRecord } from '@/portal/admin/types'
import { AdminSecurityAlertDrawer } from './AdminSecurityAlertDrawer'

export function AdminSecurityAlertsScreen() {
  const { data } = useAdminData(); const [search, setSearch] = useState(''); const deferred = useDeferredValue(search); const [severity, setSeverity] = useState('Todos'); const [status, setStatus] = useState('Todos'); const [type, setType] = useState('Todos'); const [selected, setSelected] = useState<SecurityAlertRecord | null>(null)
  const rows = useMemo(() => filterSecurity(data.securityAlerts, severity, status).filter((row) => matchesQuery(row, deferred, ['titulo', 'descripcion', 'cuenta', 'direccion_ip', 'ubicacion']) && (type === 'Todos' || row.tipo === type)), [data.securityAlerts, deferred, severity, status, type])
  const reset = () => { setSearch(''); setSeverity('Todos'); setStatus('Todos'); setType('Todos') }
  const columns: AdminTableColumn<SecurityAlertRecord>[] = [{ id: 'alert', header: 'Alerta', cell: (row) => <div><strong>{row.titulo}</strong><small>{row.tipo} · {row.cuenta}</small></div> }, { id: 'severity', header: 'Gravedad', cell: (row) => <AdminStatusBadge status={row.gravedad} /> }, { id: 'status', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> }, { id: 'ip', header: 'Dirección IP', cell: (row) => row.direccion_ip }, { id: 'location', header: 'Ubicación', cell: (row) => row.ubicacion }, { id: 'date', header: 'Fecha', cell: (row) => formatDate(row.created_at, true) }]
  return <><AdminPageHeader title="Alertas de seguridad" description="Consulta eventos de autenticación, sesiones, cuentas y permisos." actions={<Link className="admin-button admin-button--secondary admin-button--md" to="/app/admin/incidencias-auditoria">Volver a auditoría</Link>} /><div className="admin-kpi-grid mt-5"><AdminKpiCard item={{ title: 'Alertas abiertas', value: data.securityAlerts.filter((row) => row.estado === 'ABIERTA').length, note: 'requieren revisión', icon: ShieldAlert }} /><AdminKpiCard item={{ title: 'Alta gravedad', value: data.securityAlerts.filter((row) => row.gravedad === 'ALTA').length, note: 'eventos registrados', icon: ShieldAlert }} /><AdminKpiCard item={{ title: 'Resueltas', value: data.securityAlerts.filter((row) => row.estado === 'RESUELTA').length, note: 'histórico conservado', icon: ShieldAlert }} /></div><AdminCard className="mt-5"><AdminFilterBar search={search} onSearch={setSearch} searchPlaceholder="Alerta, cuenta, IP o ubicación" actions={<><AdminButton size="sm" variant="ghost" onClick={reset}><RefreshCcw aria-hidden="true" size={15} />Limpiar</AdminButton><AdminButton size="sm" onClick={() => downloadExcel('Alertas de seguridad', ['Alerta', 'Tipo', 'Gravedad', 'Estado', 'Cuenta', 'IP', 'Ubicación', 'Fecha'], rows.map((row) => [row.titulo, row.tipo, row.gravedad, row.estado, row.cuenta, row.direccion_ip, row.ubicacion, row.created_at]), 'safe-alertas-seguridad')}><Download aria-hidden="true" size={15} />Exportar Excel</AdminButton></>}><AdminSelectFilter label="Gravedad" value={severity} options={['Todos', ...uniqueValues(data.securityAlerts, 'gravedad')]} onChange={setSeverity} /><AdminSelectFilter label="Estado" value={status} options={['Todos', ...uniqueValues(data.securityAlerts, 'estado')]} onChange={setStatus} /><AdminSelectFilter label="Tipo" value={type} options={['Todos', ...uniqueValues(data.securityAlerts, 'tipo')]} onChange={setType} /></AdminFilterBar><AdminDataTable rows={rows} columns={columns} rowKey={(row) => row.id} caption="Alertas de seguridad" pageSize={7} actionsLabel="Acciones de alerta" renderActions={(row) => <AdminButton size="icon" variant="ghost" onClick={() => setSelected(row)} aria-label={`Ver alerta ${row.titulo}`}><Eye aria-hidden="true" size={16} /></AdminButton>} /></AdminCard><AdminSecurityAlertDrawer alert={selected} onClose={() => setSelected(null)} /></>
}
