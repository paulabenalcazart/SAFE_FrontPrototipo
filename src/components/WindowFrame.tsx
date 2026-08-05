import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function WindowFrame({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('surface-card overflow-hidden text-left', className)}>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#f4645c]/70" />
        <span className="h-3 w-3 rounded-full bg-[#fdbc40]/70" />
        <span className="h-3 w-3 rounded-full bg-[#34c749]/70" />
        <span className="flex-1 text-center text-xs font-medium text-ink-500">{title}</span>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </div>
  )
}
