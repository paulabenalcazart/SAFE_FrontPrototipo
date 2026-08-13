import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type AdminButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
export type AdminButtonSize = 'sm' | 'md' | 'icon'

export interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: AdminButtonVariant
  size?: AdminButtonSize
}

export const AdminButton = forwardRef<HTMLButtonElement, AdminButtonProps>(function AdminButton(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref,
) {
  return <button ref={ref} type={type} className={cn('admin-button', `admin-button--${variant}`, `admin-button--${size}`, className)} {...props} />
})
