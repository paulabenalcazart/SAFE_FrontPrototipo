import type { EstadoObligacion } from '@/portal/types'

export const ESTADO_OBLIGACION_LABEL: Record<EstadoObligacion, string> = {
  PENDIENTE: 'Pendiente',
  PROXIMA: 'Próxima',
  VENCIDA: 'Vencida',
  CUMPLIDA: 'Cumplida',
  NO_APLICA: 'No aplica',
}

// Colores propios de este módulo (no reusar Tono/TONE_BADGE_CLASSES): el mockup pinta
// "Cumplida" en navy, no emerald — ver leyenda del calendario en el spec de Fase 5.
export const ESTADO_OBLIGACION_BADGE: Record<EstadoObligacion, string> = {
  CUMPLIDA: 'bg-navy-100 text-navy-700',
  PROXIMA: 'bg-amber-soft text-amber-deep',
  VENCIDA: 'bg-danger-soft text-destructive',
  PENDIENTE: 'bg-surface text-ink-700',
  NO_APLICA: 'bg-surface text-ink-500',
}

export const ESTADO_OBLIGACION_SWATCH: Record<EstadoObligacion, string> = {
  CUMPLIDA: 'bg-navy-100 border-navy-600',
  PROXIMA: 'bg-amber-soft border-amber-brand',
  VENCIDA: 'bg-danger-soft border-destructive',
  PENDIENTE: 'bg-surface border-line',
  NO_APLICA: 'bg-surface border-line',
}
