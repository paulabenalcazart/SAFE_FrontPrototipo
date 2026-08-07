import type { Tono } from './types'

export const TONE_BADGE_CLASSES: Record<Tono, string> = {
  positivo: 'bg-emerald-soft text-emerald-deep',
  atencion: 'bg-amber-soft text-amber-deep',
  critico: 'bg-danger-soft text-destructive',
  neutro: 'bg-surface text-ink-700',
}

export const TONE_DOT_CLASSES: Record<Tono, string> = {
  positivo: 'bg-emerald-brand',
  atencion: 'bg-amber-brand',
  critico: 'bg-destructive',
  neutro: 'bg-ink-500',
}
