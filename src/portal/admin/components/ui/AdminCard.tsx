import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export function AdminCard({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('admin-card', className)} {...props} />
}
