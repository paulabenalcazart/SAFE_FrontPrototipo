import { SearchX } from 'lucide-react'

export function AdminEmptyState({ title = 'Sin resultados', description = 'Ajusta los filtros para continuar.' }: { title?: string; description?: string }) {
  return <div className="admin-empty-state"><SearchX aria-hidden="true" size={24} /><strong>{title}</strong><span>{description}</span></div>
}
