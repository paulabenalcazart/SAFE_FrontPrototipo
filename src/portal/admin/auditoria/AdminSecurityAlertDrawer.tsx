import { useEffect, useRef, useState } from 'react'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDrawer } from '@/portal/admin/components/ui/AdminDrawer'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { formatDate } from '@/portal/admin/lib/format'
import type { SecurityAlertRecord } from '@/portal/admin/types'

export function AdminSecurityAlertDrawer({ alert, onClose }: { alert: SecurityAlertRecord | null; onClose: () => void }) {
  const { patchEntity } = useAdminData()
  const [resolving, setResolving] = useState(false)
  const resolvingRef = useRef(false)
  useEffect(() => { resolvingRef.current = false; setResolving(false) }, [alert?.id])
  const resolve = () => { if (!alert || alert.estado === 'RESUELTA' || resolvingRef.current) return; resolvingRef.current = true; setResolving(true); patchEntity('securityAlerts', alert.id, { estado: 'RESUELTA' }); onClose() }
  return <AdminDrawer open={Boolean(alert)} title={alert?.titulo ?? 'Alerta de seguridad'} subtitle={alert?.tipo} onClose={onClose} footer={alert?.estado !== 'RESUELTA' ? <AdminButton variant="success" onClick={resolve} disabled={resolving}>Resolver alerta</AdminButton> : <AdminButton onClick={onClose}>Cerrar</AdminButton>}>{alert ? <><section className="drawer-section"><h3>Información general</h3><dl className="detail-list"><div className="detail-row"><dt>Estado</dt><dd><AdminStatusBadge status={alert.estado} /></dd></div><div className="detail-row"><dt>Gravedad</dt><dd><AdminStatusBadge status={alert.gravedad} /></dd></div><div className="detail-row"><dt>Cuenta</dt><dd>{alert.cuenta}</dd></div><div className="detail-row"><dt>Dirección IP</dt><dd>{alert.direccion_ip}</dd></div><div className="detail-row"><dt>Ubicación</dt><dd>{alert.ubicacion}</dd></div><div className="detail-row"><dt>Fecha</dt><dd>{formatDate(alert.created_at, true)}</dd></div></dl></section><section className="drawer-section"><h3>Descripción</h3><p>{alert.descripcion}</p></section></> : null}</AdminDrawer>
}
