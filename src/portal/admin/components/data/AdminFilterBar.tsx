import type { ReactNode } from 'react'
import { Search } from 'lucide-react'

export function AdminFilterBar({ search, onSearch, searchLabel = 'Buscar', searchPlaceholder = 'Buscar', children, actions }: { search: string; onSearch: (value: string) => void; searchLabel?: string; searchPlaceholder?: string; children?: ReactNode; actions?: ReactNode }) {
  return <div className="admin-filter-bar"><label className="admin-search-control"><span className="sr-only">{searchLabel}</span><Search aria-hidden="true" size={18} /><input value={search} onChange={(event) => onSearch(event.target.value)} placeholder={searchPlaceholder} /></label><div className="admin-filter-bar__fields">{children}</div>{actions ? <div className="admin-filter-bar__actions">{actions}</div> : null}</div>
}
