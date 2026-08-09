import type { NivelRiesgo } from '@/portal/types'

export const NIVEL_RIESGO_LABEL: Record<NivelRiesgo, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

// nivel_riesgo_enum tiene 4 valores (dump SAFE_dump.sql) — Tono de tone.ts solo cubre 4 casos genéricos
// que no mapean 1:1 a esta escala de severidad, por eso este módulo define su propio mapa de color.
export const NIVEL_RIESGO_BADGE: Record<NivelRiesgo, string> = {
  BAJO: 'bg-emerald-soft text-emerald-deep',
  MEDIO: 'bg-amber-soft text-amber-deep',
  ALTO: 'bg-danger-soft text-destructive',
  CRITICO: 'bg-destructive text-destructive-foreground',
}
