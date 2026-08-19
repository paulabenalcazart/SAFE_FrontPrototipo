import { useAuth } from '@/auth/AuthContext'
import { notificaciones, obligaciones } from '@/portal/data/semilla-portal'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatFecha } from '@/portal/obligaciones/formato'
import type { PanelItem } from './NotificationsPanel'

export function useAlertItems(): PanelItem[] {
  return obligaciones
    .filter((o) => o.tono !== 'positivo')
    .map((o) => ({ id: o.id, titulo: o.nombre, mensaje: `Vence ${o.vence} · ${o.monto}`, fecha: o.estado, tono: o.tono }))
}

export function useNotificationItems(): PanelItem[] {
  const { user } = useAuth()
  const esColaborador = user?.role === 'COLABORADOR'
  const { notificacionesColaborador } = usePortalData()

  return esColaborador
    ? notificacionesColaborador.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fecha: formatFecha(n.createdAt.slice(0, 10)),
        tono: n.leida ? 'neutro' : 'atencion',
      }))
    : notificaciones.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fecha: n.fecha,
        tono: n.leida ? 'neutro' : 'atencion',
      }))
}
