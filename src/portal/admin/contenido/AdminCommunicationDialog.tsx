import { useEffect, useId, useRef, useState } from 'react'
import { CalendarClock, CalendarDays, Send } from 'lucide-react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { formatDate } from '@/portal/admin/lib/format'
import type { CommunicationRecord } from '@/portal/admin/types'

const communicationTypes = ['AVISO', 'CAMBIO_NORMATIVO', 'NOTICIA', 'TUTORIAL', 'BANNER', 'CORREO_MASIVO']
const audiences = ['TODOS', 'EMPRESA', 'COLABORADOR', 'ADMINISTRADOR']
const channels = ['PORTAL', 'CORREO']

function blankCommunication(): CommunicationRecord {
  return { id: crypto.randomUUID(), title: '', type: 'AVISO', audience: 'TODOS', status: 'BORRADOR', schedule: 'Sin programar', updated: AHORA_ADMIN, description: '', channels: ['PORTAL'] }
}

function pad(value: number) { return String(value).padStart(2, '0') }
const today = AHORA_ADMIN.slice(0, 10)
function quickOption(hour: number, label: string) {
  return { label, preview: `${formatDate(today)}, ${pad(hour)}:00`, value: `${today}T${pad(hour)}:00` }
}

export function AdminCommunicationDialog({ item, open, onClose }: { item: CommunicationRecord | null; open: boolean; onClose: () => void }) {
  const { upsertEntity } = useAdminData()
  const [form, setForm] = useState<CommunicationRecord>(blankCommunication)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [schedulePicker, setSchedulePicker] = useState<'closed' | 'quick' | 'custom'>('closed')
  const [customDate, setCustomDate] = useState('')
  const [customTime, setCustomTime] = useState('10:30')
  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  useEffect(() => { if (open) { setForm(item ? { ...item, channels: [...item.channels] } : blankCommunication()); setError(''); savingRef.current = false; setSaving(false); setSchedulePicker('closed') } }, [item, open])
  const set = <K extends keyof CommunicationRecord>(key: K, value: CommunicationRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const toggleChannel = (channel: string) => set('channels', form.channels.includes(channel) ? form.channels.filter((item) => item !== channel) : [...form.channels, channel])
  const validate = () => {
    if (!form.title.trim() || !form.description.trim()) { setError('Completa el título y la descripción requeridos.'); titleRef.current?.focus(); return false }
    if (!form.channels.length) { setError('Selecciona al menos un canal de distribución.'); return false }
    if (!formRef.current?.checkValidity()) { formRef.current?.reportValidity(); return false }
    setError('')
    return true
  }
  const persist = (status: 'BORRADOR' | 'PROGRAMADA' | 'ACTIVA', scheduleValue?: string) => {
    if (savingRef.current || saving) return
    if (!validate()) return
    if (status === 'PROGRAMADA' && (!scheduleValue || scheduleValue <= AHORA_ADMIN.slice(0, 16))) { setError('La programación debe ser una fecha futura válida.'); return }
    savingRef.current = true
    setSaving(true)
    upsertEntity('communications', { ...form, title: form.title.trim(), description: form.description.trim(), status, schedule: status === 'BORRADOR' ? 'Sin programar' : status === 'ACTIVA' ? 'Publicada' : scheduleValue!, updated: AHORA_ADMIN })
    setSchedulePicker('closed')
    onClose()
  }
  const openSchedulePicker = () => {
    if (!validate()) return
    setCustomDate(today)
    setSchedulePicker('quick')
  }
  const quickOptions = [quickOption(8, 'Esta mañana'), quickOption(13, 'Esta tarde'), quickOption(19, 'Esta noche')]
  const inputId = (name: string) => `${baseId}-${name}`
  return <>
    <AdminDialog open={open} title={item ? 'Editar comunicación' : 'Crear comunicación'} description="Define mensaje, audiencia, canales y publicación." onClose={() => { savingRef.current = false; onClose() }} wide footer={<><AdminButton onClick={() => { savingRef.current = false; onClose() }} disabled={saving}>Cancelar</AdminButton><AdminButton type="button" onClick={() => persist('BORRADOR')} disabled={saving}>Guardar borrador</AdminButton><AdminButton type="button" variant="secondary" onClick={openSchedulePicker} disabled={saving}><CalendarClock aria-hidden="true" size={16} />Programar</AdminButton><AdminButton type="button" variant="primary" onClick={() => persist('ACTIVA')} disabled={saving}><Send aria-hidden="true" size={16} />Publicar</AdminButton></>}>
      <form ref={formRef} id={`${baseId}-form`} onSubmit={(event) => event.preventDefault()}><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field md:col-span-2"><label htmlFor={inputId('title')}>Título</label><input ref={titleRef} id={inputId('title')} required value={form.title} onChange={(event) => set('title', event.target.value)} /></div><div className="form-field"><label htmlFor={inputId('type')}>Tipo</label><select id={inputId('type')} value={form.type} onChange={(event) => set('type', event.target.value)}>{communicationTypes.map((value) => <option key={value}>{value}</option>)}</select></div><div className="form-field"><label htmlFor={inputId('audience')}>Destinatarios</label><select id={inputId('audience')} value={form.audience} onChange={(event) => set('audience', event.target.value)}>{audiences.map((value) => <option key={value}>{value}</option>)}</select></div><div className="form-field md:col-span-2"><label htmlFor={inputId('description')}>Descripción</label><textarea id={inputId('description')} required value={form.description} onChange={(event) => set('description', event.target.value)} /></div><fieldset className="form-field md:col-span-2"><legend>Canales de distribución</legend>{channels.map((channel) => <label className="flex min-h-11 items-center gap-2" htmlFor={inputId(channel)} key={channel}><input id={inputId(channel)} type="checkbox" checked={form.channels.includes(channel)} onChange={() => toggleChannel(channel)} />{channel}</label>)}</fieldset></div>{error ? <p role="alert" className="mt-4">{error}</p> : null}</form>
    </AdminDialog>
    <AdminDialog open={schedulePicker === 'quick'} title="Programar envío" description="Hora de Ecuador." onClose={() => setSchedulePicker('closed')}>
      <div className="flex flex-col gap-1">
        {quickOptions.map((option) => <AdminButton key={option.label} variant="ghost" className="justify-between" onClick={() => persist('PROGRAMADA', option.value)}><span>{option.label}</span><span className="text-ink-600">{option.preview}</span></AdminButton>)}
        <AdminButton variant="ghost" className="justify-start" onClick={() => setSchedulePicker('custom')}><CalendarDays aria-hidden="true" size={16} />Elegir fecha y hora</AdminButton>
      </div>
    </AdminDialog>
    <AdminDialog open={schedulePicker === 'custom'} title="Elegir fecha y hora" onClose={() => setSchedulePicker('closed')} footer={<><AdminButton onClick={() => setSchedulePicker('quick')}>Cancelar</AdminButton><AdminButton variant="primary" onClick={() => persist('PROGRAMADA', `${customDate}T${customTime}`)}>Programar envío</AdminButton></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="form-field"><label htmlFor={inputId('custom-date')}>Fecha</label><input id={inputId('custom-date')} type="date" value={customDate} onChange={(event) => setCustomDate(event.target.value)} /></div>
        <div className="form-field"><label htmlFor={inputId('custom-time')}>Hora</label><input id={inputId('custom-time')} type="time" value={customTime} onChange={(event) => setCustomTime(event.target.value)} /></div>
      </div>
    </AdminDialog>
  </>
}
