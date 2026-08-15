import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
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
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const togglingRef = useRef(new Set<string>())
  const pendingToggleRef = useRef(new Map<string, string>())
  const deletingRef = useRef(false)
  const pendingDeleteRef = useRef<string | null>(null)
  const rows = useMemo(() => data.tutorials.filter((item) => matchesQuery(item, deferredSearch, ['titulo', 'categoria', 'modulo', 'descripcion']) && (audience === 'Todos' || item.audiencia === audience) && (category === 'Todos' || item.categoria === category) && (status === 'Todos' || item.estado === status)), [audience, category, data.tutorials, deferredSearch, status])
  const open = (tutorial: TutorialRecord | null) => { setEditing(tutorial); setDialogOpen(true) }
  const releaseSettledMutations = () => {
    for (const id of Array.from(togglingRef.current)) {
      const expectedState = pendingToggleRef.current.get(id)
      if (expectedState && data.tutorials.some((item) => item.id === id && item.estado === expectedState)) {
        togglingRef.current.delete(id)
        pendingToggleRef.current.delete(id)
      }
    }
    if (!togglingRef.current.size) setBusyAction(null)
    const pendingDeleteId = pendingDeleteRef.current
    if (pendingDeleteId && !data.tutorials.some((item) => item.id === pendingDeleteId)) {
      pendingDeleteRef.current = null
      deletingRef.current = false
      setDeleting(null)
      setDeletingBusy(false)
    }
  }
  useEffect(() => { releaseSettledMutations() }, [data.tutorials, deleting])
  const toggle = (tutorial: TutorialRecord) => {
    if (!['PUBLICADO', 'OCULTO'].includes(tutorial.estado) || togglingRef.current.has(tutorial.id)) return
    togglingRef.current.add(tutorial.id)
    pendingToggleRef.current.set(tutorial.id, tutorial.estado === 'OCULTO' ? 'PUBLICADO' : 'OCULTO')
    setBusyAction(tutorial.id)
    patchEntity('tutorials', tutorial.id, { estado: tutorial.estado === 'OCULTO' ? 'PUBLICADO' : 'OCULTO', updated_at: AHORA_ADMIN, published_at: tutorial.estado === 'OCULTO' ? (tutorial.published_at ?? AHORA_ADMIN) : tutorial.published_at })
  }
  const confirmDelete = () => {
    if (!deleting || deletingRef.current) return
    deletingRef.current = true
    pendingDeleteRef.current = deleting.id
    setDeletingBusy(true)
    removeEntity('tutorials', deleting.id)
  }
  const columns: AdminTableColumn<TutorialRecord>[] = [
    {
      id: 'thumbnail',
      header: 'Miniatura',
      cell: (row) =>
        row.url_miniatura ? (
          <img src={row.url_miniatura} alt="" className="h-10 w-16 rounded-md object-cover" />
        ) : (
          <span className="grid h-10 w-16 place-items-center rounded-md bg-surface text-ink-500">
            <Video aria-hidden="true" size={17} />
          </span>
        ),
    },
    { id: 'title', header: 'Título', cell: (row) => <div><strong>{row.titulo}</strong><small>{row.descripcion}</small></div> },
    { id: 'category', header: 'Categoría', cell: (row) => <div>{row.categoria}<small>{row.audiencia}</small></div> },
    { id: 'duration', header: 'Duración', cell: (row) => formatDuration(row.duracion_segundos) },
    { id: 'views', header: 'Visualizaciones', cell: (row) => formatNumber(row.views) },
    { id: 'status', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.estado} /> },
  ]
  const exportRows = rows.map((row) => [row.titulo, row.descripcion, row.modulo, row.categoria, row.audiencia, formatDuration(row.duracion_segundos), row.views, row.estado, row.updated_at])
  return <><AdminPageHeader title="Video tutoriales" description="Administra el contenido audiovisual disponible para cada audiencia de SAFE." actions={<AdminButton variant="primary" onClick={() => open(null)}><Plus aria-hidden="true" size={16} />Subir tutorial</AdminButton>} /><div className="admin-kpi-grid mt-5"><AdminKpiCard item={{ title: 'Tutoriales publicados', value: data.tutorials.filter((item) => item.estado === 'PUBLICADO').length, note: `${data.tutorials.length} en biblioteca`, icon: Video }} /><AdminKpiCard item={{ title: 'Visualizaciones', value: formatNumber(data.tutorials.reduce((sum, item) => sum + item.views, 0)), note: 'acumuladas', icon: Eye }} /><AdminKpiCard item={{ title: 'Audiencias', value: new Set(data.tutorials.map((item) => item.audiencia)).size, note: 'segmentos de contenido', icon: Video }} /></div><AdminCard className="mt-5"><div className="p-4"><h2>Biblioteca de tutoriales</h2><p>Consulta, publica, oculta o actualiza los videos disponibles en SAFE.</p></div><AdminFilterBar search={search} onSearch={setSearch} searchPlaceholder="Título, categoría, módulo o descripción" actions={<AdminButton size="sm" onClick={() => downloadExcel('Tutoriales', ['Título', 'Descripción', 'Módulo', 'Categoría', 'Audiencia', 'Duración', 'Visualizaciones', 'Estado', 'Actualización'], exportRows, 'safe-tutoriales')}><Download aria-hidden="true" size={15} />Exportar Excel</AdminButton>}><AdminSelectFilter label="Audiencia" value={audience} options={['Todos', ...uniqueValues(data.tutorials, 'audiencia')]} onChange={setAudience} /><AdminSelectFilter label="Categoría" value={category} options={['Todos', ...uniqueValues(data.tutorials, 'categoria')]} onChange={setCategory} /><AdminSelectFilter label="Estado" value={status} options={['Todos', ...uniqueValues(data.tutorials, 'estado')]} onChange={setStatus} /></AdminFilterBar><AdminDataTable rows={rows} columns={columns} rowKey={(row) => row.id} caption="Biblioteca de tutoriales: Miniatura, Título, Categoría, Duración, Visualizaciones, Estado y Acciones" pageSize={7} actionsLabel="Acciones" renderActions={(row) => <><AdminButton size="icon" variant="ghost" onClick={() => open(row)} aria-label={`Editar tutorial ${row.titulo}`} disabled={busyAction === row.id || deletingBusy}><Edit3 aria-hidden="true" size={16} /></AdminButton>{row.estado !== 'BORRADOR' ? <AdminButton size="icon" variant="ghost" onClick={() => toggle(row)} disabled={busyAction === row.id || deletingBusy} aria-label={row.estado === 'OCULTO' ? `Publicar tutorial ${row.titulo}` : `Ocultar tutorial ${row.titulo}`}>{row.estado === 'OCULTO' ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}</AdminButton> : null}<AdminButton size="icon" variant="ghost" onClick={() => setDeleting(row)} disabled={busyAction === row.id || deletingBusy} aria-label={`Eliminar tutorial ${row.titulo}`}><Trash2 aria-hidden="true" size={16} /></AdminButton></>} /></AdminCard><AdminTutorialDialog tutorial={editing} open={dialogOpen} onClose={() => setDialogOpen(false)} data={data} onSave={(tutorial) => upsertEntity('tutorials', tutorial)} /><AdminDialog open={Boolean(deleting)} title="Confirmar eliminación" description="Esta acción eliminará el tutorial de la biblioteca." onClose={() => { if (!deletingBusy) setDeleting(null) }} footer={<><AdminButton onClick={() => setDeleting(null)} disabled={deletingBusy}>Cancelar</AdminButton><AdminButton variant="danger" onClick={confirmDelete} disabled={deletingBusy}>{deletingBusy ? 'Eliminando…' : 'Eliminar tutorial'}</AdminButton></>}><p>¿Deseas eliminar <strong>{deleting?.titulo}</strong>? Esta acción no se puede deshacer.</p></AdminDialog></>
}
