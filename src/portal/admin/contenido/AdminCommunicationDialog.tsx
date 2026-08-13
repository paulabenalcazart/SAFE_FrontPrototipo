import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CalendarClock, Send } from 'lucide-react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import type { CommunicationRecord } from '@/portal/admin/types'

const communicationTypes = ['AVISO', 'CAMBIO_NORMATIVO', 'NOTICIA', 'TUTORIAL', 'BANNER', 'CORREO_MASIVO']
const audiences = ['TODOS', 'EMPRESA', 'COLABORADOR', 'ADMINISTRADOR']
const channels = ['PORTAL', 'CORREO']

function blankCommunication(): CommunicationRecord {
  return { id: crypto.randomUUID(), title: '', type: 'AVISO', audience: 'TODOS', status: 'BORRADOR', schedule: 'Sin programar', updated: AHORA_ADMIN, description: '', channels: ['PORTAL'] }
}

export function AdminCommunicationDialog({ item, open, onClose }: { item: CommunicationRecord | null; open: boolean; onClose: () => void }) {
  const { upsertEntity } = useAdminData()
  const [form, setForm] = useState<CommunicationRecord>(blankCommunication)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [action, setAction] = useState<'BORRADOR' | 'PROGRAMADA' | 'ACTIVA'>('BORRADOR')
  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  useEffect(() => { if (open) { setForm(item ? { ...item, channels: [...item.channels] } : blankCommunication()); setError(''); savingRef.current = false; setSaving(false); setAction('BORRADOR') } }, [item, open])
  const set = <K extends keyof CommunicationRecord>(key: K, value: CommunicationRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleChannel = (channel: string) => set('channels', form.channels.includes(channel) ? form.channels.filter((item) => item !== channel) : [...form.channels, channel])
  const save = (status: 'BORRADOR' | 'PROGRAMADA' | 'ACTIVA') => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current || saving) return
    if (!form.title.trim() || !form.description.trim()) { setError('Completa el título y la descripción requeridos.'); titleRef.current?.focus(); return }
    if (!form.channels.length) { setError('Selecciona al menos un canal de distribución.'); return }
    if (status === 'PROGRAMADA' && (!form.schedule || form.schedule === 'Sin programar' || form.schedule <= AHORA_ADMIN.slice(0, 16))) { setError('La programación debe ser una fecha futura válida.'); return }
    if (!formRef.current?.checkValidity()) return
    savingRef.current = true
    setSaving(true)
    upsertEntity('communications', { ...form, title: form.title.trim(), description: form.description.trim(), status, schedule: status === 'BORRADOR' ? 'Sin programar' : status === 'ACTIVA' ? 'Publicada' : form.schedule, updated: AHORA_ADMIN })
    onClose()
  }
  const inputId = (name: string) => `${baseId}-${name}`
  return <AdminDialog open={open} title={item ? 'Editar comunicación' : 'Crear comunicación'} description="Define mensaje, audiencia, canales y publicación." onClose={() => { savingRef.current = false; onClose() }} wide footer={<><AdminButton onClick={() => { savingRef.current = false; onClose() }} disabled={saving}>Cancelar</AdminButton><AdminButton form={`${baseId}-form`} type="submit" onClick={() => setAction('BORRADOR')} disabled={saving}>Guardar borrador</AdminButton><AdminButton form={`${baseId}-form`} type="submit" variant="secondary" onClick={() => setAction('PROGRAMADA')} disabled={saving}><CalendarClock aria-hidden="true" size={16} />Programar</AdminButton><AdminButton form={`${baseId}-form`} type="submit" variant="primary" onClick={() => setAction('ACTIVA')} disabled={saving}><Send aria-hidden="true" size={16} />Publicar</AdminButton></>}><form ref={formRef} id={`${baseId}-form`} onSubmit={save(action)}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field md:col-span-2"><label htmlFor={inputId('title')}>Título</label><input ref={titleRef} id={inputId('title')} required value={form.title} onChange={(event) => set('title', event.target.value)} /></div><div className="form-field"><label htmlFor={inputId('type')}>Tipo</label><select id={inputId('type')} value={form.type} onChange={(event) => set('type', event.target.value)}>{communicationTypes.map((value) => <option key={value}>{value}</option>)}</select></div><div className="form-field"><label htmlFor={inputId('audience')}>Destinatarios</label><select id={inputId('audience')} value={form.audience} onChange={(event) => set('audience', event.target.value)}>{audiences.map((value) => <option key={value}>{value}</option>)}</select></div><div className="form-field md:col-span-2"><label htmlFor={inputId('description')}>Descripción</label><textarea id={inputId('description')} required value={form.description} onChange={(event) => set('description', event.target.value)} /></div><div className="form-field"><label htmlFor={inputId('schedule')}>Fecha y hora de programación</label><input id={inputId('schedule')} type="datetime-local" value={form.schedule === 'Sin programar' || form.schedule === 'Publicada' ? '' : form.schedule} onChange={(event) => set('schedule', event.target.value || 'Sin programar')} /><small>Necesaria únicamente para programar.</small></div><fieldset className="form-field"><legend>Canales de distribución</legend>{channels.map((channel) => <label className="flex min-h-11 items-center gap-2" htmlFor={inputId(channel)} key={channel}><input id={inputId(channel)} type="checkbox" checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)} />{channel}</label>)}</fieldset></div>{error ? <p role="alert" className="mt-4">{error}</p> : null}</form></AdminDialog>
}
