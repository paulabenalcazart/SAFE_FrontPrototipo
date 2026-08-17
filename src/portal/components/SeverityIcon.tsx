import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Severidad = 'baja' | 'media' | 'alta' | 'critica'

const SEVERIDAD_COLOR: Record<Severidad, string> = {
  baja: 'text-emerald-brand',
  media: 'text-amber-brand',
  alta: 'text-destructive',
  critica: 'text-destructive',
}

export function SeverityIcon({ nivel, className }: { nivel: Severidad; className?: string }) {
  return (
    <AlertTriangle
      aria-hidden="true"
      className={cn('h-4 w-4 shrink-0', SEVERIDAD_COLOR[nivel], className)}
    />
  )
}
