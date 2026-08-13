import { useEffect, useId, useState, type FormEvent } from 'react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import type { AdminData, TutorialRecord } from '@/portal/admin/types'

type Errors = Record<string, string>

function blankTutorial(data: AdminData): TutorialRecord {
  return { id: crypto.randomUUID(), modulo: 'ADMINISTRACION', titulo: '', descripcion: '', categoria: 'Primeros pasos', audiencia: 'EMPRESA', url_video: '', url_miniatura: '', duracion_segundos: 300, estado: 'BORRADOR', orden_visualizacion: data.tutorials.length + 1, views: 0, updated_at: AHORA_ADMIN, published_at: null }
}

function safeUrl(value: string): boolean {
  const normalized = value.trim()
  if (!normalized || /^(javascript:|data:)/i.test(normalized)) return false
  return /^(https?:\/\/|\/|\.\/|\.\.\/|[a-z0-9][a-z0-9/_\-.]*)$/i.test(normalized)
}

export function AdminTutorialDialog({ tutorial, open, onClose, data, onSave }: { tutorial: TutorialRecord | null; open: boolean; onClose: () => void; data: AdminData; onSave: (tutorial: TutorialRecord) => void }) {
  const [form, setForm] = useState<TutorialRecord>(() => blankTutorial(data))
  const [autoThumbnail, setAutoThumbnail] = useState(true)
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const baseId = useId().replace(/:/g, '')
  const formId = `${baseId}-form`
  const idFor = (field: string) => `${baseId}-${field}`
  useEffect(() => { if (open) { setForm(tutorial ? JSON.parse(JSON.stringify(tutorial)) as TutorialRecord : blankTutorial(data)); setAutoThumbnail(!tutorial?.url_miniatura); setNotifyUsers(false); setErrors({}) } }, [data, open, tutorial])
  const set = <K extends keyof TutorialRecord>(key: K, value: TutorialRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const error = (field: string) => errors[field] ? <p id={`${idFor(field)}-error`} role="alert">{errors[field]}</p> : null
  const validate = () => {
    const next: Errors = {}
    if (!form.titulo.trim()) next.titulo = 'El título es obligatorio.'
    if (!data.modules.some((module) => module.codigo === form.modulo)) next.modulo = 'Selecciona un módulo existente.'
    if (!['EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'TODOS'].includes(form.audiencia)) next.audiencia = 'Selecciona una audiencia válida.'
    if (!safeUrl(form.url_video)) next.url_video = 'Ingresa una URL http/https o una ruta relativa segura.'
    if (!autoThumbnail && !safeUrl(form.url_miniatura)) next.url_miniatura = 'Ingresa una URL http/https o una ruta relativa segura.'
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
    if (!validate()) return
    const published = form.estado === 'PUBLICADO' ? (form.published_at ?? AHORA_ADMIN) : form.published_at
    onSave({ ...form, titulo: form.titulo.trim(), descripcion: form.descripcion.trim(), categoria: form.categoria.trim(), url_video: form.url_video.trim(), url_miniatura: autoThumbnail ? '' : form.url_miniatura.trim(), duracion_segundos: Number(form.duracion_segundos), orden_visualizacion: Number(form.orden_visualizacion), updated_at: AHORA_ADMIN, published_at: published, views: tutorial?.views ?? 0 })
    onClose()
  }
  return <AdminDialog open={open} title={tutorial ? `Editar ${tutorial.titulo}` : 'Subir tutorial'} description="Define el contenido, la audiencia y la visibilidad del video." onClose={onClose} wide footer={<><AdminButton onClick={onClose}>Cancelar</AdminButton><AdminButton variant="primary" type="submit" form={formId}>Guardar tutorial</AdminButton></>}><form id={formId} onSubmit={save}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field md:col-span-2"><label htmlFor={idFor('titulo')}>Título</label><input id={idFor('titulo')} value={form.titulo} onChange={(event) => set('titulo', event.target.value)} aria-describedby={errors.titulo ? `${idFor('titulo')}-error` : undefined} />{error('titulo')}</div><div className="form-field md:col-span-2"><label htmlFor={idFor('descripcion')}>Descripción</label><textarea id={idFor('descripcion')} value={form.descripcion} onChange={(event) => set('descripcion', event.target.value)} /></div><div className="form-field"><label htmlFor={idFor('modulo')}>Módulo</label><select id={idFor('modulo')} value={form.modulo} onChange={(event) => set('modulo', event.target.value)}>{data.modules.map((module) => <option key={module.codigo} value={module.codigo}>{module.nombre}</option>)}</select>{error('modulo')}</div><div className="form-field"><label htmlFor={idFor('categoria')}>Categoría</label><input id={idFor('categoria')} value={form.categoria} onChange={(event) => set('categoria', event.target.value)} /></div><div className="form-field"><label htmlFor={idFor('audiencia')}>Audiencia</label><select id={idFor('audiencia')} value={form.audiencia} onChange={(event) => set('audiencia', event.target.value)}>{['EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'TODOS'].map((item) => <option key={item}>{item}</option>)}</select>{error('audiencia')}</div><div className="form-field"><label htmlFor={idFor('estado')}>Estado</label><select id={idFor('estado')} value={form.estado} onChange={(event) => set('estado', event.target.value)}>{['BORRADOR', 'PUBLICADO', 'OCULTO'].map((item) => <option key={item}>{item}</option>)}</select></div><div className="form-field"><label htmlFor={idFor('duracion_segundos')}>Duración estimada (segundos)</label><input id={idFor('duracion_segundos')} type="number" min="1" value={form.duracion_segundos} onChange={(event) => set('duracion_segundos', event.target.value as unknown as number)} />{error('duracion_segundos')}</div><div className="form-field"><label htmlFor={idFor('orden_visualizacion')}>Orden de visualización</label><input id={idFor('orden_visualizacion')} type="number" min="0" value={form.orden_visualizacion} onChange={(event) => set('orden_visualizacion', event.target.value as unknown as number)} />{error('orden_visualizacion')}</div><div className="form-field md:col-span-2"><label htmlFor={idFor('url_video')}>URL del vídeo</label><input id={idFor('url_video')} value={form.url_video} placeholder="https://… o /media/video.mp4" onChange={(event) => set('url_video', event.target.value)} />{error('url_video')}</div><div className="form-field md:col-span-2"><label htmlFor={idFor('url_miniatura')}>Miniatura</label><input id={idFor('url_miniatura')} value={form.url_miniatura} placeholder={autoThumbnail ? 'Se generará una miniatura segura' : 'https://… o /assets/miniatura.webp'} disabled={autoThumbnail} onChange={(event) => set('url_miniatura', event.target.value)} />{error('url_miniatura')}</div><label className="flex min-h-11 items-center gap-2 md:col-span-2"><input type="checkbox" checked={autoThumbnail} onChange={(event) => setAutoThumbnail(event.target.checked)} />Generar miniatura automáticamente</label><label className="flex min-h-11 items-center gap-2 md:col-span-2"><input type="checkbox" checked={notifyUsers} onChange={(event) => setNotifyUsers(event.target.checked)} />Notificar a la audiencia al publicar</label></div></form></AdminDialog>
}
