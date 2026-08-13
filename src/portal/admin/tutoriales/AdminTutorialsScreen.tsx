import { useDeferredValue, useMemo, useState } from 'react'
import { Download, Edit3, Eye, EyeOff, Plus, Trash2, Video } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminFilterBar } from '@/portal/admin/components/data/AdminFilterBar'
import { AdminSelectFilter } from '@/portal/admin/components/data/AdminSelectFilter'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminKpiCard } from '@/portal/admin/components/ui/AdminKpiCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { downloadExcel } from '@/portal/admin/lib/exportExcel'
import { matchesQuery, uniqueValues } from '@/portal/admin/lib/filtering'
import { formatDuration, formatNumber } from '@/portal/admin/lib/format'
import type { TutorialRecord } from '@/portal/admin/types'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminTutorialDialog } from './AdminTutorialDialog'

export function AdminTutorialsScreen() {
  const { data, upsertEntity, patchEntity, removeEntity } = useAdminData()
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [audience, setAudience] = useState('Todos')
  const [category, setCategory] = useState('Todos')
  const [status, setStatus] = useState('Todos')
  const [editing, setEditing] = useState<TutorialRecord | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<TutorialRecord | null>(null)
  const rows = useMemo(() => data.tutorials.filter((item) => matchesQuery(item, deferredSearch, ['titulo', 'categoria', 'modulo', 'descripcion']) && (audience === 'Todos' || item.audiencia === audience) && (category === 'Todos' || item.categoria === category) && (status === 'Todos' || item.estado === status)), [audience, category, data.tutorials, deferredSearch, status])
  const open = (tutorial: TutorialRecord | null) => { setEditing(tutorial); setDialogOpen(true) }
  const toggle = (tutorial: TutorialRecord) => patchEntity('tutorials', tutorial.id, { estado: tutorial.estado === 'OCULTO' ? 'PUBLICADO' : 'OCULTO', updated_at: AHORA_ADMIN, published_at: tutorial.estado === 'OCULTO' ? (tutorial.published_at ?? AHORA_ADMIN) : tutorial.published_at })
  const columns: AdminTableColumn<TutorialRecord>[] = [
    { id: 'thumbnail', header: 'Miniatura', cell: (row) => <div className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-md bg-slate-100 text-xs font-bold text-slate-700"><Video aria-hidden="true" size={15} /></span><span>{row.url_miniatura ? 'URL' : row.modulo.slice(0, 3)}</span></div> },
    { id: 'title', header: 'Título', cell: (row) => <div><strong>{row.titulo}</strong><small>{row.descripcion}</small></div> },
    { id: 'category', header: 'Categoría', cell: (row) => <div>{row.categoria}<small>{row.audiencia}</small></div> },
    { id: 'duration', header: 'Duración', cell: (row) => formatDuration(row.duracion_segundos) },
    { id: 'views', header: 'Visualizaciones', cell: (row) => formatNumber(row.views) },
    { id: 'status', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> },
  ]
  const exportRows = rows.map((row) => [row.titulo, row.descripcion, row.modulo, row.categoria, row.audiencia, formatDuration(row.duracion_segundos), row.views, row.estado, row.updated_at])
  return <><AdminPageHeader title="Video tutoriales" description="Administra el contenido audiovisual disponible para cada audiencia de SAFE." actions={<AdminButton variant="primary" onClick={() => open(null)}><Plus aria-hidden="true" size={16} />Subir tutorial</AdminButton>} /><div className="admin-kpi-grid mt-5"><AdminKpiCard item={{ title: 'Tutoriales publicados', value: data.tutorials.filter((item) => item.estado === 'PUBLICADO').length, note: `${data.tutorials.length} en biblioteca`, icon: Video }} /><AdminKpiCard item={{ title: 'Visualizaciones', value: formatNumber(data.tutorials.reduce((sum, item) => sum + item.views, 0)), note: 'acumuladas', icon: Eye }} /><AdminKpiCard item={{ title: 'Audiencias', value: new Set(data.tutorials.map((item) => item.audiencia)).size, note: 'segmentos de contenido', icon: Video }} /></div><AdminCard className="mt-5"><div className="p-4"><h2>Biblioteca de tutoriales</h2><p>Consulta, publica, oculta o actualiza los videos disponibles en SAFE.</p></div><AdminFilterBar search={search} onSearch={setSearch} searchPlaceholder="Título, categoría, módulo o descripción" actions={<AdminButton size="sm" onClick={() => downloadExcel('Tutoriales', ['Título', 'Descripción', 'Módulo', 'Categoría', 'Audiencia', 'Duración', 'Visualizaciones', 'Estado', 'Actualización'], exportRows, 'safe-tutoriales')}><Download aria-hidden="true" size={15} />Exportar Excel</AdminButton>}><AdminSelectFilter label="Audiencia" value={audience} options={['Todos', ...uniqueValues(data.tutorials, 'audiencia')]} onChange={setAudience} /><AdminSelectFilter label="Categoría" value={category} options={['Todos', ...uniqueValues(data.tutorials, 'categoria')]} onChange={setCategory} /><AdminSelectFilter label="Estado" value={status} options={['Todos', ...uniqueValues(data.tutorials, 'estado')]} onChange={setStatus} /></AdminFilterBar><AdminDataTable rows={rows} columns={columns} rowKey={(row) => row.id} caption="Biblioteca de tutoriales: Miniatura, Título, Categoría, Duración, Visualizaciones, Estado y Acciones" pageSize={7} actionsLabel="Acciones" renderActions={(row) => <><AdminButton size="icon" variant="ghost" onClick={() => open(row)} aria-label={`Editar tutorial ${row.titulo}`}><Edit3 aria-hidden="true" size={16} /></AdminButton><AdminButton size="icon" variant="ghost" onClick={() => toggle(row)} aria-label={row.estado === 'OCULTO' ? `Publicar tutorial ${row.titulo}` : `Ocultar tutorial ${row.titulo}`}>{row.estado === 'OCULTO' ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}</AdminButton><AdminButton size="icon" variant="ghost" onClick={() => setDeleting(row)} aria-label={`Eliminar tutorial ${row.titulo}`}><Trash2 aria-hidden="true" size={16} /></AdminButton></>} /></AdminCard><AdminTutorialDialog tutorial={editing} open={dialogOpen} onClose={() => setDialogOpen(false)} data={data} onSave={(tutorial) => upsertEntity('tutorials', tutorial)} /><AdminDialog open={Boolean(deleting)} title="Confirmar eliminación" description="Esta acción eliminará el tutorial de la biblioteca." onClose={() => setDeleting(null)} footer={<><AdminButton onClick={() => setDeleting(null)}>Cancelar</AdminButton><AdminButton variant="danger" onClick={() => { if (deleting) { removeEntity('tutorials', deleting.id); setDeleting(null) } }}>Eliminar tutorial</AdminButton></>}><p>¿Deseas eliminar <strong>{deleting?.titulo}</strong>? Esta acción no se puede deshacer.</p></AdminDialog></>
}
