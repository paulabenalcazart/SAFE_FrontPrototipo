import { useState } from 'react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { summarizePlans } from '@/portal/admin/lib/adminMetrics'
import { formatMoney } from '@/portal/admin/lib/format'
import { AdminDataTable } from '@/portal/admin/components/data/AdminDataTable'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { AdminTabs } from '@/portal/admin/components/ui/AdminTabs'
import type { PlanRecord } from '@/portal/admin/types'
import { AdminPlanDialog } from './AdminPlanDialog'

export function AdminPlansScreen() {
  const { data, upsertEntity, removeEntity } = useAdminData()
  const [tab, setTab] = useState<'plans' | 'usage' | 'permissions'>('plans')
  const [editing, setEditing] = useState<PlanRecord | null | undefined>()
  const [removing, setRemoving] = useState<PlanRecord | null>(null)
  const stats = summarizePlans(data.plans)
  return <><AdminPageHeader title="Planes y permisos" description={`${stats.active} planes activos y ${stats.users} usuarios configurados.`} actions={tab === 'plans' ? <AdminButton onClick={() => setEditing(null)}>Crear plan</AdminButton> : undefined}/><AdminCard><AdminTabs ariaLabel="Planes y permisos" value={tab} onChange={setTab} items={[{ value: 'plans', label: 'Planes' }, { value: 'usage', label: 'Uso' }, { value: 'permissions', label: 'Permisos' }]}><div className="p-4">{tab === 'plans' ? <AdminDataTable rows={data.plans} rowKey={(row) => row.id} caption="Planes configurados" columns={[{ id: 'nombre', header: 'Plan', cell: (row) => <><strong>{row.nombre}</strong><small>{row.codigo}</small></> }, { id: 'precio', header: 'Precio', cell: (row) => formatMoney(row.precio_mensual, row.moneda) }, { id: 'modulos', header: 'Módulos', cell: (row) => `${row.modules.length}/${data.modules.length}` }, { id: 'estado', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.activo ? 'ACTIVO' : 'INACTIVO'} /> }]} renderActions={(row) => <><AdminButton size="sm" variant="ghost" onClick={() => setEditing(row)}>Editar</AdminButton><AdminButton size="sm" variant="ghost" onClick={() => setRemoving(row)}>Eliminar</AdminButton></>} /> : null}{tab === 'usage' ? <div>{data.plans.map((plan) => <p key={plan.id}>{plan.nombre}: {plan.users} usuarios · {Math.max(0, plan.users - Math.round(plan.users * .08))} suscripciones</p>)}</div> : null}{tab === 'permissions' ? <div><h2>Permisos por rol</h2><p>USUARIO_EMPRESA: empresa.ver, empresa.crear, empresa.editar, finanzas.registrar, finanzas.ver, obligaciones.ver, simulaciones.ejecutar, marketplace.ver, marketplace.contactar.</p><p>COLABORADOR: colaborador.perfil, colaborador.solicitudes, citas.gestionar.</p><p>ADMINISTRADOR: {data.permissions.join(', ')}.</p></div> : null}</div></AdminTabs></AdminCard><AdminPlanDialog open={editing !== undefined} onClose={() => setEditing(undefined)} plan={editing ?? null} onSave={(plan) => { if (!data.plans.some((item) => item.codigo === plan.codigo && item.id !== plan.id)) upsertEntity('plans', plan) }} />{removing ? <AdminDialog open onClose={() => setRemoving(null)} title="Eliminar plan" footer={removing.users > 0 ? <AdminButton onClick={() => setRemoving(null)}>Entendido</AdminButton> : <AdminButton onClick={() => { removeEntity('plans', removing.id); setRemoving(null) }}>Confirmar eliminación</AdminButton>}>{removing.users > 0 ? <p>Existen usuarios o suscripciones activas; el plan no puede eliminarse.</p> : <p>Esta acción no se puede deshacer.</p>}</AdminDialog> : null}</>
}
