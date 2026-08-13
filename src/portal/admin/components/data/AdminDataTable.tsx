import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Pagination } from '@/portal/components/Pagination'
import { AdminEmptyState } from '@/portal/admin/components/ui/AdminEmptyState'

export interface AdminTableColumn<T> {
  id: string
  header: string
  cell: (row: T) => ReactNode
  className?: string
}

export function AdminDataTable<T>({ rows, columns, pageSize = 6, rowKey, emptyTitle, emptyDescription, caption = 'Resultados administrativos', renderActions, actionsLabel = 'Acciones' }: { rows: T[]; columns: AdminTableColumn<T>[]; pageSize?: number; rowKey: (row: T) => string; emptyTitle?: string; emptyDescription?: string; caption?: string; renderActions?: (row: T) => ReactNode; actionsLabel?: string }) {
  const [page, setPage] = useState(1)
  const rowIdentity = rows.map(rowKey).join('|')
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  useEffect(() => { setPage(1) }, [rowIdentity])
  useEffect(() => { if (page > pageCount) setPage(pageCount) }, [page, pageCount])
  const visibleRows = useMemo(() => rows.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, rows])

  if (!rows.length) return <AdminEmptyState title={emptyTitle} description={emptyDescription} />

  return <div className="admin-table-shell"><div className="admin-table-scroll"><table className="admin-data-table"><caption className="sr-only">{caption}</caption><thead><tr>{columns.map((column) => <th key={column.id} scope="col" className={column.className}>{column.header}</th>)}{renderActions ? <th scope="col" className="admin-table-actions-heading">{actionsLabel}</th> : null}</tr></thead><tbody>{visibleRows.map((row) => <tr key={rowKey(row)}>{columns.map((column) => <td key={column.id} className={column.className}>{column.cell(row)}</td>)}{renderActions ? <td className="admin-table-actions">{renderActions(row)}</td> : null}</tr>)}</tbody></table></div><div className="admin-table-pagination"><Pagination paginaActual={page} totalPaginas={pageCount} onChange={setPage} ariaLabel="Paginación de resultados administrativos" /></div></div>
}
