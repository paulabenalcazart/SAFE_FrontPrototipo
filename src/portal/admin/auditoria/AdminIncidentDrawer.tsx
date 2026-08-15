import { useEffect, useRef, useState } from 'react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDrawer } from '@/portal/admin/components/ui/AdminDrawer'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { formatDate } from '@/portal/admin/lib/format'
import type { IncidentRecord } from '@/portal/admin/types'

export function AdminIncidentDrawer({ incident, onClose }: { incident: IncidentRecord | null; onClose: () => void }) {
  const { patchEntity } = useAdminData()
  const [resolving, setResolving] = useState(false)
  const resolvingRef = useRef(false)
  useEffect(() => { resolvingRef.current = false; setResolving(false) }, [incident?.id])
  const resolve = () => { if (!incident || incident.estado === 'RESUELTA' || resolvingRef.current) return; resolvingRef.current = true; setResolving(true); patchEntity('incidents', incident.id, { estado: 'RESUELTA', resolved_at: AHORA_ADMIN, updated_at: AHORA_ADMIN }); onClose() }
  return <AdminDrawer open={Boolean(incident)} title={incident?.codigo ?? 'Incidencia'} subtitle={incident?.titulo} onClose={onClose} footer={incident?.estado !== 'RESUELTA' ? <AdminButton variant="success" onClick={resolve} disabled={resolving}>Marcar como resuelta</AdminButton> : <AdminButton onClick={onClose}>Cerrar</AdminButton>}>{incident ? <><section className="drawer-section"><h3>Información general</h3><dl className="detail-list"><div className="detail-row"><dt>Estado</dt><dd><AdminStatusBadge status={incident.estado} /></dd></div><div className="detail-row"><dt>Prioridad</dt><dd><AdminStatusBadge status={incident.priority} /></dd></div><div className="detail-row"><dt>Módulo</dt><dd>{incident.modulo}</dd></div><div className="detail-row"><dt>Código de error</dt><dd>{incident.codigo_error ?? '—'}</dd></div><div className="detail-row"><dt>Responsable</dt><dd>{incident.assignee}</dd></div><div className="detail-row"><dt>Creada</dt><dd>{formatDate(incident.created_at, true)}</dd></div><div className="detail-row"><dt>Actualizada</dt><dd>{formatDate(incident.updated_at, true)}</dd></div></dl></section><section className="drawer-section"><h3>Descripción</h3><p>{incident.descripcion}</p></section></> : null}</AdminDrawer>
}
