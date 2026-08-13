import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { CheckCircle2, Edit3, KeyRound, Mail, Save, Settings2, ShieldCheck, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import safeLogoDark from '@/assets/safe-logo-dark.png'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { formatDate } from '@/portal/admin/lib/format'
import type { AdminSettings, EmailTemplateRecord } from '@/portal/admin/types'

type Errors = Record<string, string>
const cloneSettings = (settings: AdminSettings) => JSON.parse(JSON.stringify(settings)) as AdminSettings

function SwitchRow({ title, description, value, onChange }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"><div><strong>{title}</strong><p>{description}</p></div><AdminButton className="min-h-11 min-w-11" variant={value ? 'primary' : 'ghost'} aria-pressed={value} onClick={() => onChange(!value)}>{value ? 'Activado' : 'Desactivado'}<span className="sr-only">: {title}</span></AdminButton></div>
}

export function AdminSettingsScreen() {
  const { data, updateSettings } = useAdminData()
  const [form, setForm] = useState<AdminSettings>(() => cloneSettings(data.settings))
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  const idFor = (field: string) => `${baseId}-${field}`
  const resetSaved = () => setSaved(false)
  useEffect(() => { setForm(cloneSettings(data.settings)); setErrors({}); savingRef.current = false }, [data.settings])
  useEffect(() => () => { if (logoPreview) URL.revokeObjectURL(logoPreview) }, [logoPreview])
  const set = (next: AdminSettings) => { setForm(next); resetSaved() }
  const selectLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = event.currentTarget.files?.[0]
    if (!selected) return
    setLogoPreview((current) => { if (current) URL.revokeObjectURL(current); return URL.createObjectURL(selected) })
    resetSaved()
    event.currentTarget.value = ''
  }
  const clearLogoPreview = () => setLogoPreview((current) => { if (current) URL.revokeObjectURL(current); return null })
  const validate = () => {
    const next: Errors = {}
    if (!form.platformName.trim()) next.platformName = 'El nombre de la plataforma es obligatorio.'
    if (!form.notifications.smtpServer.trim()) next.smtpServer = 'El servidor SMTP es obligatorio.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.notifications.sender.trim())) next.sender = 'Ingresa un correo remitente válido.'
    if (!Number.isFinite(Number(form.security.sessionMinutes)) || Number(form.security.sessionMinutes) < 5) next.sessionMinutes = 'La sesión debe durar al menos 5 minutos.'
    if (!Number.isFinite(Number(form.security.maxFailedAttempts)) || Number(form.security.maxFailedAttempts) < 1) next.maxFailedAttempts = 'Ingresa al menos 1 intento fallido.'
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) requestAnimationFrame(() => document.getElementById(idFor(first))?.focus())
    return Object.keys(next).length === 0
  }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (savingRef.current || !validate()) return
    savingRef.current = true
    updateSettings({ ...form, platformName: form.platformName.trim(), notifications: { ...form.notifications, smtpServer: form.notifications.smtpServer.trim(), sender: form.notifications.sender.trim() }, security: { ...form.security, sessionMinutes: Number(form.security.sessionMinutes), maxFailedAttempts: Number(form.security.maxFailedAttempts) } })
    setSaved(true)
  }
  const fieldError = (key: string) => errors[key] ? <p id={`${idFor(key)}-error`} role="alert">{errors[key]}</p> : null
  const templates: AdminTableColumn<EmailTemplateRecord>[] = [
    { id: 'name', header: 'Plantilla', cell: (row) => <div><strong>{row.name}</strong><small>{row.event}</small></div> },
    { id: 'subject', header: 'Asunto', cell: (row) => row.subject },
    { id: 'updated', header: 'Última actualización', cell: (row) => formatDate(row.updated) },
    { id: 'status', header: 'Estado', cell: (row) => <AdminStatusBadge status={row.status} /> },
  ]
  const labels: Record<string, string> = { version: 'Versión', license: 'Licencia', api: 'API', database: 'Base de datos', mail: 'Servicio de correo', lastUpdate: 'Última actualización' }
  return <><AdminPageHeader title="Configuración" description="Administra la identidad del sistema, las políticas de seguridad y los servicios generales." actions={<AdminButton variant="primary" type="submit" form={`${baseId}-form`}><Save aria-hidden="true" size={16} />Guardar cambios</AdminButton>} />{saved ? <div role="status" aria-live="polite" className="mt-4 flex items-center justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950"><span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={17} />Configuración guardada correctamente.</span><AdminButton size="icon" variant="ghost" onClick={() => setSaved(false)} aria-label="Cerrar confirmación"><X aria-hidden="true" size={16} /></AdminButton></div> : null}<form id={`${baseId}-form`} className="mt-5 space-y-5" onSubmit={save}><AdminCard className="p-4"><div className="flex items-start gap-3"><Settings2 aria-hidden="true" size={19} /><div><h2>Identidad y localización</h2><p>Define la información general visible en SAFE.</p></div></div><div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="flex flex-wrap items-center gap-3 rounded-md border border-line p-3"><img src={logoPreview ?? safeLogoDark} alt="Logotipo SAFE" className="h-10 w-auto" /><div><strong>Logotipo actual</strong><p>La vista previa se mantiene sólo durante esta sesión.</p></div><label className="admin-button admin-button--secondary admin-button--sm min-h-11">Actualizar logotipo<input className="sr-only" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={selectLogo} /></label>{logoPreview ? <AdminButton size="sm" variant="ghost" onClick={clearLogoPreview}>Quitar vista previa</AdminButton> : null}</div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field"><label htmlFor={idFor('platformName')}>Nombre de la plataforma</label><input id={idFor('platformName')} value={form.platformName} onChange={(event) => set({ ...form, platformName: event.target.value })} aria-describedby={errors.platformName ? `${idFor('platformName')}-error` : undefined} />{fieldError('platformName')}</div><div className="form-field"><label htmlFor={idFor('language')}>Idioma</label><select id={idFor('language')} value={form.language} onChange={(event) => set({ ...form, language: event.target.value })}><option>Español</option><option>English</option></select></div><div className="form-field md:col-span-2"><label htmlFor={idFor('timezone')}>Zona horaria</label><select id={idFor('timezone')} value={form.timezone} onChange={(event) => set({ ...form, timezone: event.target.value })}><option>America/Guayaquil</option><option>America/Bogota</option><option>America/Lima</option></select></div></div></div></AdminCard><AdminCard className="p-4"><div className="flex items-start gap-3"><KeyRound aria-hidden="true" size={19} /><div><h2>Seguridad</h2><p>Políticas globales para autenticación y sesiones.</p></div></div><div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2"><div><SwitchRow title="Política de contraseñas fuertes" description="Exige una contraseña con mayor complejidad." value={form.security.strongPasswords} onChange={(value) => set({ ...form, security: { ...form.security, strongPasswords: value } })} /><SwitchRow title="MFA para administradores" description="Solicita segundo factor para accesos administrativos." value={form.security.twoFactorAdmin} onChange={(value) => set({ ...form, security: { ...form.security, twoFactorAdmin: value } })} /></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div className="form-field"><label htmlFor={idFor('sessionMinutes')}>Tiempo de sesión activa (min)</label><input id={idFor('sessionMinutes')} type="number" min="5" value={form.security.sessionMinutes} onChange={(event) => set({ ...form, security: { ...form.security, sessionMinutes: event.target.value as unknown as number } })} />{fieldError('sessionMinutes')}</div><div className="form-field"><label htmlFor={idFor('maxFailedAttempts')}>Intentos fallidos antes de bloqueo</label><input id={idFor('maxFailedAttempts')} type="number" min="1" value={form.security.maxFailedAttempts} onChange={(event) => set({ ...form, security: { ...form.security, maxFailedAttempts: event.target.value as unknown as number } })} />{fieldError('maxFailedAttempts')}</div></div></div></AdminCard><AdminCard className="p-4"><div className="flex items-start gap-3"><Mail aria-hidden="true" size={19} /><div><h2>Notificaciones</h2><p>Configura el servicio de correo y los recordatorios automáticos.</p></div></div><div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2"><div className="grid grid-cols-1 gap-4"><div className="form-field"><label htmlFor={idFor('smtpServer')}>Servidor SMTP</label><input id={idFor('smtpServer')} value={form.notifications.smtpServer} onChange={(event) => set({ ...form, notifications: { ...form.notifications, smtpServer: event.target.value } })} />{fieldError('smtpServer')}</div><div className="form-field"><label htmlFor={idFor('sender')}>Correo remitente</label><input id={idFor('sender')} type="email" value={form.notifications.sender} onChange={(event) => set({ ...form, notifications: { ...form.notifications, sender: event.target.value } })} />{fieldError('sender')}</div></div><div><SwitchRow title="Recordatorios automáticos" description="Envía recordatorios asociados a vencimientos y eventos configurados." value={form.notifications.remindersEnabled} onChange={(value) => set({ ...form, notifications: { ...form.notifications, remindersEnabled: value } })} /><Link to="/app/admin/alertas-contenido" className="admin-button admin-button--secondary admin-button--sm min-h-11">Ir a comunicaciones</Link></div></div></AdminCard><AdminCard className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><Mail aria-hidden="true" size={19} /><div><h2>Plantillas de correo</h2><p>Mensajes reutilizables asociados a eventos del sistema.</p></div></div><Link to="/app/admin/alertas-contenido?tab=templates" className="admin-button admin-button--secondary admin-button--sm min-h-11">Gestionar plantillas</Link></div><div className="mt-4"><AdminDataTable rows={data.emailTemplates} columns={templates} rowKey={(row) => row.id} caption="Plantillas de correo" pageSize={5} renderActions={() => <Link to="/app/admin/alertas-contenido?tab=templates" className="admin-button admin-button--ghost admin-button--icon" aria-label="Editar plantilla"><Edit3 aria-hidden="true" size={16} /></Link>} /></div></AdminCard><AdminCard className="p-4"><div className="flex items-start gap-3"><ShieldCheck aria-hidden="true" size={19} /><div><h2>Información del sistema</h2><p>Versión instalada y estado de los servicios principales.</p></div></div><div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">{Object.entries(form.system).map(([key, value]) => <div className="rounded-md border border-line p-3" key={key}><span>{labels[key] ?? key.replace(/_/g, ' ')}</span><div className="mt-1 flex flex-wrap items-center gap-2"><strong>{value}</strong>{['api', 'database', 'mail'].includes(key) ? <AdminStatusBadge status="OPERATIVO" /> : null}</div></div>)}</div></AdminCard></form></>
}
