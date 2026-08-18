import { useEffect, useId, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type ReactNode } from 'react'
import { FileVideo2, Image as ImageIcon, UploadCloud, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { esUrlAdminPermitida } from '@/portal/admin/lib/documentos'
import { formatDuration } from '@/portal/admin/lib/format'
import type { AdminData, TutorialRecord } from '@/portal/admin/types'

type Errors = Record<string, string>

function blankTutorial(data: AdminData): TutorialRecord {
  return { id: crypto.randomUUID(), modulo: 'ADMINISTRACION', titulo: '', descripcion: '', categoria: 'Primeros pasos', audiencia: 'EMPRESA', url_video: '', url_miniatura: '', duracion_segundos: 300, estado: 'BORRADOR', orden_visualizacion: data.tutorials.length + 1, views: 0, updated_at: AHORA_ADMIN, published_at: null }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function FileDropzone({ id, accept, title, hint, icon, fileName, fileSize, disabled, error, onSelect, onClear }: {
  id: string
  accept: string
  title: string
  hint: string
  icon: ReactNode
  fileName: string
  fileSize: string
  disabled?: boolean
  error?: ReactNode
  onSelect: (file: File) => void
  onClear: () => void
}) {
  const [dragOver, setDragOver] = useState(false)
  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setDragOver(false)
    if (disabled) return
    const file = event.dataTransfer.files?.[0]
    if (file) onSelect(file)
  }
  if (fileName) {
    return <div className="admin-dropzone-file"><span className="admin-dropzone-file__icon" aria-hidden="true">{icon}</span><div className="min-w-0 flex-1"><strong>{fileName}</strong><small>{fileSize}</small></div><AdminButton size="icon" variant="ghost" onClick={onClear} disabled={disabled} aria-label={`Quitar ${title.toLowerCase()}`}><X aria-hidden="true" size={16} /></AdminButton>{error}</div>
  }
  return <div>
    <label htmlFor={id} className={cn('admin-dropzone', dragOver && 'is-dragover', disabled && 'is-disabled')} onDragOver={(event) => { event.preventDefault(); if (!disabled) setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      <span className="admin-dropzone__icon" aria-hidden="true"><UploadCloud size={20} /></span>
      <strong>{title}</strong>
      <p>{hint}</p>
      <input id={id} type="file" accept={accept} className="sr-only" disabled={disabled} onChange={(event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) onSelect(file) }} aria-describedby={error ? `${id}-error` : undefined} />
    </label>
    {error}
  </div>
}

export function AdminTutorialDialog({ tutorial, open, onClose, data, onSave }: { tutorial: TutorialRecord | null; open: boolean; onClose: () => void; data: AdminData; onSave: (tutorial: TutorialRecord) => void }) {
  const [form, setForm] = useState<TutorialRecord>(() => blankTutorial(data))
  const [autoThumbnail, setAutoThumbnail] = useState(true)
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [videoFileName, setVideoFileName] = useState('')
  const [videoFileSize, setVideoFileSize] = useState('')
  const [thumbnailFileName, setThumbnailFileName] = useState('')
  const [thumbnailFileSize, setThumbnailFileSize] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  const formId = `${baseId}-form`
  const idFor = (field: string) => `${baseId}-${field}`
  useEffect(() => { if (open) { savingRef.current = false; setSaving(false); setForm(tutorial ? JSON.parse(JSON.stringify(tutorial)) as TutorialRecord : blankTutorial(data)); setAutoThumbnail(!tutorial?.url_miniatura); setNotifyUsers(false); setVideoFileName(''); setVideoFileSize(''); setThumbnailFileName(''); setThumbnailFileSize(''); setErrors({}) } }, [data, open, tutorial])
  const set = <K extends keyof TutorialRecord>(key: K, value: TutorialRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const selectVideo = (file: File) => {
    setVideoFileName(file.name)
    setVideoFileSize(formatBytes(file.size))
    set('url_video', URL.createObjectURL(file))
  }
  const clearVideo = () => { setVideoFileName(''); setVideoFileSize(''); set('url_video', '') }
  const selectThumbnail = (file: File) => {
    setThumbnailFileName(file.name)
    setThumbnailFileSize(formatBytes(file.size))
    set('url_miniatura', URL.createObjectURL(file))
  }
  const clearThumbnail = () => { setThumbnailFileName(''); setThumbnailFileSize(''); set('url_miniatura', '') }
  const error = (field: string) => errors[field] ? <p id={`${idFor(field)}-error`} role="alert">{errors[field]}</p> : null
  const validate = () => {
    const next: Errors = {}
    if (!form.titulo.trim()) next.titulo = 'El título es obligatorio.'
    if (!data.modules.some((module) => module.codigo === form.modulo)) next.modulo = 'Selecciona un módulo existente.'
    if (!['EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'TODOS'].includes(form.audiencia)) next.audiencia = 'Selecciona una audiencia válida.'
    if (!esUrlAdminPermitida(form.url_video)) next.url_video = 'Sube un archivo de video válido.'
    if (!autoThumbnail && !esUrlAdminPermitida(form.url_miniatura)) next.url_miniatura = 'Sube una imagen de miniatura válida.'
    const duration = Number(form.duracion_segundos)
    if (!Number.isFinite(duration) || duration < 1) next.duracion_segundos = 'La duración debe ser un número finito de al menos 1 segundo.'
    const order = Number(form.orden_visualizacion)
    if (!Number.isFinite(order) || order < 0) next.orden_visualizacion = 'El orden debe ser un número finito mayor o igual a cero.'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) requestAnimationFrame(() => document.getElementById(idFor(first))?.focus())
    return Object.keys(next).length === 0
  }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current || saving || !validate()) return
    savingRef.current = true
    setSaving(true)
    const published = form.estado === 'PUBLICADO' ? (form.published_at ?? AHORA_ADMIN) : form.published_at
    onSave({ ...form, titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), categoria: form.categoria.trim(), url_video: form.url_video.trim(), url_miniatura: autoThumbnail ? '' : form.url_miniatura.trim(), duracion_segundos: Number(form.duracion_segundos), orden_visualizacion: Number(form.orden_visualizacion), updated_at: AHORA_ADMIN, published_at: published, views: tutorial?.views ?? 0 })
    onClose()
  }
  const requestClose = () => { if (!saving) onClose() }
  return <AdminDialog open={open} title={tutorial ? `Editar ${tutorial.titulo}` : 'Subir tutorial'} description="Define el contenido, la audiencia y la visibilidad del video." onClose={requestClose} wide footer={<><AdminButton onClick={requestClose} disabled={saving}>Cancelar</AdminButton><AdminButton variant="primary" type="submit" form={formId} disabled={saving}>{saving ? 'Guardando…' : 'Guardar tutorial'}</AdminButton></>}><form id={formId} onSubmit={save}><fieldset disabled={saving}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field md:col-span-2"><label htmlFor={idFor('titulo')}>Título</label><input id={idFor('titulo')} value={form.titulo} onChange={(event) => set('titulo', event.target.value)} aria-describedby={errors.titulo ? `${idFor('titulo')}-error` : undefined} />{error('titulo')}</div><div className="form-field md:col-span-2"><label htmlFor={idFor('descripcion')}>Descripción</label><textarea id={idFor('descripcion')} value={form.descripcion} onChange={(event) => set('descripcion', event.target.value)} /></div><div className="form-field"><label htmlFor={idFor('modulo')}>Módulo</label><select id={idFor('modulo')} value={form.modulo} onChange={(event) => set('modulo', event.target.value)}>{data.modules.map((module) => <option key={module.codigo} value={module.codigo}>{module.nombre}</option>)}</select>{error('modulo')}</div><div className="form-field"><label htmlFor={idFor('categoria')}>Categoría</label><input id={idFor('categoria')} value={form.categoria} onChange={(event) => set('categoria', event.target.value)} /></div><div className="form-field"><label htmlFor={idFor('audiencia')}>Audiencia</label><select id={idFor('audiencia')} value={form.audiencia} onChange={(event) => set('audiencia', event.target.value)}>{['EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'TODOS'].map((item) => <option key={item}>{item}</option>)}</select>{error('audiencia')}</div><div className="form-field"><label htmlFor={idFor('estado')}>Estado</label><select id={idFor('estado')} value={form.estado} onChange={(event) => set('estado', event.target.value)}>{['BORRADOR', 'PUBLICADO', 'OCULTO'].map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-field"><label htmlFor={idFor('duracion_segundos')}>Duración estimada (segundos)</label><input id={idFor('duracion_segundos')} type="number" min="1" value={form.duracion_segundos} onChange={(event) => set('duracion_segundos', event.target.value as unknown as number)} />{error('duracion_segundos')}</div><div className="form-field"><label htmlFor={idFor('orden_visualizacion')}>Orden de visualización</label><input id={idFor('orden_visualizacion')} type="number" min="0" value={form.orden_visualizacion} onChange={(event) => set('orden_visualizacion', event.target.value as unknown as number)} />{error('orden_visualizacion')}</div><div className="form-field md:col-span-2"><label>Archivo de video</label><FileDropzone id={idFor('url_video')} accept="video/*" title="Arrastra tu video aquí" hint="Para mejores resultados, sube un video en MP4 de al menos 1080p (1920 × 1080 px)." icon={<FileVideo2 aria-hidden="true" size={20} />} fileName={videoFileName} fileSize={videoFileSize} error={error('url_video')} onSelect={selectVideo} onClear={clearVideo} /></div><div className="form-field md:col-span-2"><label>Miniatura</label><FileDropzone id={idFor('url_miniatura')} accept="image/*" title="Arrastra tu miniatura aquí" hint="Imagen JPG o PNG en formato horizontal." icon={<ImageIcon aria-hidden="true" size={20} />} fileName={thumbnailFileName} fileSize={thumbnailFileSize} disabled={autoThumbnail} error={error('url_miniatura')} onSelect={selectThumbnail} onClear={clearThumbnail} /></div><label className="flex min-h-11 items-center gap-2 md:col-span-2"><input type="checkbox" checked={autoThumbnail} onChange={(event) => setAutoThumbnail(event.target.checked)} />Generar miniatura automáticamente</label><label className="flex min-h-11 items-center gap-2 md:col-span-2"><input type="checkbox" checked={notifyUsers} onChange={(event) => setNotifyUsers(event.target.checked)} />Notificar a la audiencia al publicar</label></div></fieldset></form><section className="drawer-section" aria-label="Vista previa del tutorial"><h3>Vista previa</h3><div className="flex flex-wrap items-start gap-3.5"><span className="grid h-20 w-32 shrink-0 place-items-center overflow-hidden rounded-md bg-surface text-ink-500">{!autoThumbnail && form.url_miniatura ? <img src={form.url_miniatura} alt="" className="h-full w-full object-cover" /> : <FileVideo2 aria-hidden="true" size={22} />}</span><div className="min-w-0"><strong>{form.titulo || 'Título del tutorial'}</strong><p>{form.descripcion || 'La descripción aparecerá aquí.'}</p><small>{formatDuration(Number(form.duracion_segundos) || 0)} · {form.categoria || 'Sin categoría'}</small></div></div></section></AdminDialog>
}
