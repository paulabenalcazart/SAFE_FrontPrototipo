import type { ReactNode } from 'react'

export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return <header className="admin-page-header"><div className="admin-page-header__copy"><h1>{title}</h1>{description ? <p>{description}</p> : null}</div>{actions ? <div className="admin-page-header__actions">{actions}</div> : null}</header>
}
