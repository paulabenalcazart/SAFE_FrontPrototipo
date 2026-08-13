import { useId, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { useAdminOverlay } from '@/portal/admin/components/ui/useAdminOverlay'

export function AdminDrawer({ open, title, subtitle, onClose, children, footer }: { open: boolean; title: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  const { dialogRef, titleRef } = useAdminOverlay(open, onClose)
  const titleId = useId()
  if (!open) return null
  return <div className="admin-overlay admin-overlay--drawer" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) onClose() }}><aside ref={dialogRef} className="admin-drawer" role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={(event) => event.stopPropagation()}><header className="admin-drawer__header"><div><h2 ref={titleRef} id={titleId} tabIndex={-1}>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div><AdminButton size="icon" variant="ghost" onClick={onClose} aria-label="Cerrar panel"><X aria-hidden="true" size={20} /></AdminButton></header><div className="admin-drawer__body">{children}</div>{footer ? <footer className="admin-drawer__footer">{footer}</footer> : null}</aside></div>
}
