import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { useAdminOverlay } from '@/portal/admin/components/ui/useAdminOverlay'

export function AdminDialog({ open, title, description, onClose, children, footer, wide = false }: { open: boolean; title: string; description?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  const { dialogRef, titleRef } = useAdminOverlay(open, onClose)
  const titleId = 'admin-dialog-title'
  if (!open) return null
  return <div className="admin-overlay" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><section ref={dialogRef} className={wide ? 'admin-dialog admin-dialog--wide' : 'admin-dialog'} role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}><header className="admin-dialog__header"><div><h2 ref={titleRef} id={titleId} tabIndex={-1}>{title}</h2>{description ? <p>{description}</p> : null}</div><AdminButton size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar diálogo"><X aria-hidden="true" size={20} /></AdminButton></header><div className="admin-dialog__body">{children}</div>{footer ? <footer className="admin-dialog__footer">{footer}</footer> : null}</section></div>
}
