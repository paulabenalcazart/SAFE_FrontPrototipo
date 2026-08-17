import type { ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tono = 'critico' | 'atencion' | 'neutro'

const TONO_COLOR: Record<Tono, string> = {
  critico: 'text-destructive',
  atencion: 'text-amber-brand',
  neutro: 'text-ink-500',
}

export function AlertBox({
  icon: Icon,
  tono = 'neutro',
  cornerLabel,
  children,
  className,
}: {
  icon: LucideIcon
  tono?: Tono
  cornerLabel?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative flex items-start gap-3 rounded-lg border border-line bg-card p-3.5', className)}>
      <Icon aria-hidden="true" className={cn('mt-0.5 h-4.5 w-4.5 shrink-0', TONO_COLOR[tono])} />
      <div className={cn('min-w-0 flex-1', cornerLabel && 'pr-16')}>{children}</div>
      {cornerLabel && (
        <span
          className={cn(
            'absolute right-3.5 top-3.5 text-[10px] font-bold uppercase tracking-wide',
            TONO_COLOR[tono],
          )}
        >
          {cornerLabel}
        </span>
      )}
    </div>
  )
}
