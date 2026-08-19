import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  as?: 'div' | 'section' | 'article'
  padding?: 'default' | 'lg'
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLElement>

export function Card({ as: Tag = 'div', padding = 'default', className, children, ...props }: CardProps) {
  return (
    <Tag
      className={cn('rounded-xl border border-line bg-card', padding === 'lg' ? 'p-4.5' : 'p-4', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
