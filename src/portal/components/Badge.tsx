import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeSize = 'xs' | 'sm' | 'md'

const BADGE_SIZE_CLASS: Record<BadgeSize, string> = {
  xs: 'text-[11px]',
  sm: 'text-[11.5px]',
  md: 'text-[12px]',
}

export function Badge({
  size = 'sm',
  className,
  children,
}: {
  size?: BadgeSize
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 font-semibold', BADGE_SIZE_CLASS[size], className)}>
      {children}
    </span>
  )
}
