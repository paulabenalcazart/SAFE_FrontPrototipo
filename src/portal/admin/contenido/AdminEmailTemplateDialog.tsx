import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Eye, Plus, Send } from 'lucide-react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import type { EmailTemplateRecord } from '@/portal/admin/types'

const events = ['USUARIO_CREADO', 'OBLIGACION_PROXIMA', 'POSTULACION_APROBADA', 'POSTULACION_RECHAZADA', 'MANTENIMIENTO', 'PAGO_CONFIRMADO']
const channels = ['EMAIL', 'SISTEMA', 'WEB']
const types = ['CORREO', 'RECORDATORIO', 'BANNER', 'EMERGENTE']
const tokens = ['{{nombre}}', '{{empresa}}', '{{fecha}}', '{{obligacion}}']
function blankTemplate(): EmailTemplateRecord { return { id: crypto.randomUUID(), name: '', type: 'CORREO', channel: 'EMAIL', event: 'USUARIO_CREADO', subject: '', status: 'BORRADOR', updated: AHORA_ADMIN, body: '' } }
function preview(text: string) { return text.replace(/\{\{nombre\}\}/g, 'Juan Pérez').replace(/\{\{empresa\}\}/g, 'SAFE Consulting').replace(/\{\{fecha\}\}/g, '15 de mayo de 2026').replace(/\{\{obligacion\}\}/g, 'Declaración de IVA') }

export function AdminEmailTemplateDialog({ item, open, onClose }: { item: EmailTemplateRecord | null; open: boolean; onClose: () => void }) {
  const { upsertEntity } = useAdminData()
  const [form, setForm] = useState<EmailTemplateRecord>(blankTemplate)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  useEffect(() => { if (open) { setForm(item ? { ...item } : blankTemplate()); setError(''); savingRef.current = false; setSaving(false); setPreviewOpen(false) } }, [item, open])
  const rendered = useMemo(() => ({ subject: preview(form.subject || 'Asunto del correo'), body: preview(form.body || 'El contenido aparecerá aquí.') }), [form.body, form.subject])
  const set = <K extends keyof EmailTemplateRecord>(key: K, value: EmailTemplateRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const persist = (status: 'BORRADOR' | 'ACTIVA') => {
    if (savingRef.current || saving) return
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) { setError('Completa nombre, asunto y cuerpo de la plantilla.'); nameRef.current?.focus(); return }
    if (!formRef.current?.checkValidity()) { formRef.current?.reportValidity(); return }
    savingRef.current = true
    setSaving(true)
    upsertEntity('emailTemplates', { ...form, name: form.name.trim(), subject: form.subject.trim(), body: form.body.trim(), status, updated: AHORA_ADMIN })
    onClose()
  }
  const id = (field: string) => `${baseId}-${field}`
  return <>
    <AdminDialog open={open} title={item ? 'Editar plantilla' : 'Crear plantilla'} description="Diseña un correo reutilizable con variables dinámicas." onClose={() => { savingRef.current = false; onClose() }} wide footer={<><AdminButton onClick={() => { savingRef.current = false; onClose() }} disabled={saving}>Cancelar</AdminButton><AdminButton onClick={() => persist('BORRADOR')} disabled={saving}>Guardar borrador</AdminButton><AdminButton variant="primary" onClick={() => persist('ACTIVA')} disabled={saving}><Send aria-hidden="true" size={16} />Publicar</AdminButton></>}>
      <form ref={formRef} id={`${baseId}-form`} onSubmit={(event) => event.preventDefault()}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="form-field"><label htmlFor={id('name')}>Nombre</label><input ref={nameRef} id={id('name')} required value={form.name} onChange={(event) => set('name', event.target.value)} /></div>
          <div className="form-field"><label htmlFor={id('channel')}>Canal</label><select id={id('channel')} value={form.channel} onChange={(event) => set('channel', event.target.value)}>{channels.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="form-field"><label htmlFor={id('type')}>Tipo</label><select id={id('type')} value={form.type} onChange={(event) => set('type', event.target.value)}>{types.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="form-field"><label htmlFor={id('event')}>Evento asociado</label><select id={id('event')} value={form.event} onChange={(event) => set('event', event.target.value)}>{events.map((value) => <option key={value}>{value}</option>)}</select></div>
          <div className="form-field md:col-span-2"><div className="flex items-center justify-between gap-3"><label htmlFor={id('subject')}>Asunto del correo</label><AdminButton size="sm" type="button" onClick={() => setPreviewOpen(true)}><Eye aria-hidden="true" size={15} />Vista previa</AdminButton></div><input id={id('subject')} required value={form.subject} onChange={(event) => set('subject', event.target.value)} /></div>
          <fieldset className="form-field md:col-span-2"><legend>Variables disponibles</legend><div className="flex flex-wrap gap-2">{tokens.map((token) => <AdminButton className="min-h-11" key={token} type="button" onClick={() => set('body', `${form.body}${form.body ? ' ' : ''}${token}`)}><Plus aria-hidden="true" size={15} />{token}</AdminButton>)}</div></fieldset>
          <div className="form-field md:col-span-2"><label htmlFor={id('body')}>Cuerpo del mensaje</label><textarea id={id('body')} required rows={7} value={form.body} onChange={(event) => set('body', event.target.value)} /></div>
        </div>
        {error ? <p role="alert" className="mt-4">{error}</p> : null}
      </form>
    </AdminDialog>
    <AdminDialog open={previewOpen} title="Vista previa" onClose={() => setPreviewOpen(false)}>
      <div className="overflow-hidden rounded-lg border border-line">
        <div className="border-b border-line px-4 py-3"><strong className="text-ink-900">SAFE</strong></div>
        <div className="space-y-3 px-4 py-4">
          <strong className="block text-ink-900">{rendered.subject}</strong>
          <p className="whitespace-pre-line text-sm text-ink-700">{rendered.body}</p>
        </div>
        <div className="border-t border-line px-4 py-3 text-center text-xs text-ink-500">© SAFE 2026 - Todos los derechos reservados</div>
      </div>
    </AdminDialog>
  </>
}
