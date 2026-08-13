import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import type { EmailTemplateRecord } from '@/portal/admin/types'

const events = ['USUARIO_CREADO', 'OBLIGACION_PROXIMA', 'POSTULACION_APROBADA', 'POSTULACION_RECHAZADA', 'MANTENIMIENTO', 'PAGO_CONFIRMADO']
const tokens = ['{{nombre}}', '{{empresa}}', '{{fecha}}', '{{obligacion}}']
function blankTemplate(): EmailTemplateRecord { return { id: crypto.randomUUID(), name: '', event: 'USUARIO_CREADO', subject: '', status: 'BORRADOR', updated: AHORA_ADMIN, body: '' } }
function preview(text: string) { return text.replace(/\{\{nombre\}\}/g, 'Juan Pérez').replace(/\{\{empresa\}\}/g, 'Comercial Andina S.A.').replace(/\{\{fecha\}\}/g, '15 de agosto de 2026').replace(/\{\{obligacion\}\}/g, 'Declaración de IVA') }

export function AdminEmailTemplateDialog({ item, open, onClose }: { item: EmailTemplateRecord | null; open: boolean; onClose: () => void }) {
  const { upsertEntity } = useAdminData()
  const [form, setForm] = useState<EmailTemplateRecord>(blankTemplate)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const baseId = useId().replace(/:/g, '')
  useEffect(() => { if (open) { setForm(item ? { ...item } : blankTemplate()); setError(''); setSaving(false) } }, [item, open])
  const rendered = useMemo(() => ({ subject: preview(form.subject || 'Asunto del correo'), body: preview(form.body || 'El contenido aparecerá aquí.') }), [form.body, form.subject])
  const set = <K extends keyof EmailTemplateRecord>(key: K, value: EmailTemplateRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const save = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (saving) return; if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) { setError('Completa nombre, asunto y cuerpo de la plantilla.'); nameRef.current?.focus(); return } if (!formRef.current?.checkValidity()) return; setSaving(true); upsertEntity('emailTemplates', { ...form, name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim(), updated: AHORA_ADMIN }); onClose() }
  const id = (field: string) => `${baseId}-${field}`
  return <AdminDialog open={open} title={item ? 'Editar plantilla' : 'Crear plantilla'} description="Diseña un correo reutilizable con variables dinámicas." onClose={onClose} wide footer={<><AdminButton onClick={onClose} disabled={saving}>Cancelar</AdminButton><AdminButton variant="primary" type="submit" form={`${baseId}-form`} disabled={saving}>Guardar plantilla</AdminButton></>}><form ref={formRef} id={`${baseId}-form`} onSubmit={save}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field"><label htmlFor={id('name')}>Nombre</label><input ref={nameRef} id={id('name')} required value={form.name} onChange={(event) => set('name', event.target.value)} /></div><div className="form-field"><label htmlFor={id('event')}>Evento</label><select id={id('event')} value={form.event} onChange={(event) => set('event', event.target.value)}>{events.map((value) => <option key={value}>{value}</option>)}</select></div><div className="form-field"><label htmlFor={id('status')}>Estado</label><select id={id('status')} value={form.status} onChange={(event) => set('status', event.target.value)}><option>ACTIVA</option><option>BORRADOR</option></select></div><div className="form-field md:col-span-2"><label htmlFor={id('subject')}>Asunto</label><input id={id('subject')} required value={form.subject} onChange={(event) => set('subject', event.target.value)} /></div><div className="form-field md:col-span-2"><label htmlFor={id('body')}>Cuerpo</label><textarea id={id('body')} required value={form.body} onChange={(event) => set('body', event.target.value)} /></div><fieldset className="form-field md:col-span-2"><legend>Variables disponibles</legend><div className="flex flex-wrap gap-2">{tokens.map((token) => <AdminButton className="min-h-11" key={token} onClick={() => set('body', `${form.body}${form.body ? ' ' : ''}${token}`)}><Plus aria-hidden="true" size={15} />{token}</AdminButton>)}</div></fieldset><section className="form-field md:col-span-2" aria-label="Vista previa segura"><h3>Vista previa</h3><strong>{rendered.subject}</strong><p className="whitespace-pre-line">{rendered.body}</p></section></div>{error ? <p role="alert" className="mt-4">{error}</p> : null}</form></AdminDialog>
}
