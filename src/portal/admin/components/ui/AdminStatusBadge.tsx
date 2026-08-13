import { cn } from '@/lib/utils'
import type { Tone } from '@/portal/admin/types'

function getAdminStatusTone(status: string): Tone {
  const normalized = status.toUpperCase()
  if (['ACTIVO', 'ACTIVA', 'PUBLICADO', 'APROBADA', 'APROBADO', 'RESUELTA', 'EXITO', 'VALIDADA', 'VIGENTE', 'DISPONIBLE'].some((value) => normalized.includes(value))) return 'success'
  if (['PENDIENTE', 'PROGRAMADA', 'EN_REVISION', 'REVISADA', 'BORRADOR', 'MEDIA'].some((value) => normalized.includes(value))) return 'warning'
  if (['SUSPENDIDO', 'SUSPENDIDA', 'BLOQUEADO', 'INACTIVO', 'INACTIVA', 'RECHAZADA', 'CRITICA', 'ALTA', 'FALLIDO', 'DEROGADA'].some((value) => normalized.includes(value))) return 'danger'
  if (['ABIERTA', 'OCULTO', 'OCULTA'].some((value) => normalized.includes(value))) return 'info'
  return 'neutral'
}

export function AdminStatusBadge({ status, tone }: { status: string; tone?: Tone }) {
  return <span className={cn('admin-status-badge', `admin-status-badge--${tone ?? getAdminStatusTone(status)}`)}>{status.replace(/_/g, ' ')}</span>
}
