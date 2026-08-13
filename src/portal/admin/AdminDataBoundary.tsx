import type { ReactNode } from 'react'
import './admin.css'
import { AdminDataProvider } from './data/AdminDataContext'

export function AdminDataBoundary({ children }: { children: ReactNode }) {
  return <AdminDataProvider><div className="admin-surface">{children}</div></AdminDataProvider>
}
