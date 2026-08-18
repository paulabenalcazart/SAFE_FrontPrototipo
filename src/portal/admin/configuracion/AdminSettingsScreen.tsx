import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { CheckCircle2, Info, KeyRound, Mail, Pencil, Save, ScrollText, User, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { DOCUMENTOS_LEGALES } from '@/portal/configuracion/catalogo'
import type { AdminSettings } from '@/portal/admin/types'

type Errors = Record<string, string>
const cloneSettings = (settings: AdminSettings) => JSON.parse(JSON.stringify(settings)) as AdminSettings

function SwitchRow({ title, description, value, onChange }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-3 last:border-0"><div><strong>{title}</strong><p>{description}</p></div><Switch checked={value} onCheckedChange={() => onChange(!value)} label={title} /></div>
}

export function AdminSettingsScreen() {
  const navigate = useNavigate()
  const { data } = useAdminData()
  const { updateSettings } = useAdminData()
  const [form, setForm] = useState<AdminSettings>(() => cloneSettings(data.settings))
  const [errors, setErrors] = useState<Errors>({})
  const [saved, setSaved] = useState(false)
  const [documentoAbierto, setDocumentoAbierto] = useState<string | null>(null)
  const savingRef = useRef(false)
  const baseId = useId().replace(/:/g, '')
  const idFor = (field: string) => `${baseId}-${field}`
  const resetSaved = () => setSaved(false)
  useEffect(() => { setForm(cloneSettings(data.settings)); setErrors({}); savingRef.current = false }, [data.settings])
  const set = (next: AdminSettings) => { setForm(next); resetSaved() }
  const [editingSystem, setEditingSystem] = useState(false)
  const validate = () => {
    const next: Errors = {}
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
    updateSettings({ ...form, security: { ...form.security, sessionMinutes: Number(form.security.sessionMinutes), maxFailedAttempts: Number(form.security.maxFailedAttempts) } })
    setEditingSystem(false)
    setSaved(true)
  }
  const fieldError = (key: string) => errors[key] ? <p id={`${idFor(key)}-error`} role="alert">{errors[key]}</p> : null
  const setSystem = (key: string, value: string) => set({ ...form, system: { ...form.system, [key]: value } })

  return (
    <>
      <AdminPageHeader
        title="Configuración"
        description="Administra tu cuenta, la seguridad y las notificaciones del sistema."
        actions={<AdminButton variant="primary" type="submit" form={`${baseId}-form`}><Save aria-hidden="true" size={16} />Guardar cambios</AdminButton>}
      />
      {saved ? (
        <div role="status" aria-live="polite" className="mt-4 flex items-center justify-between gap-3 rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-950">
          <span className="flex items-center gap-2"><CheckCircle2 aria-hidden="true" size={17} />Configuración guardada correctamente.</span>
          <AdminButton size="icon" variant="ghost" onClick={() => setSaved(false)} aria-label="Cerrar confirmación"><X aria-hidden="true" size={16} /></AdminButton>
        </div>
      ) : null}

      <AdminCard className="mt-5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <User aria-hidden="true" size={19} />
            <div>
              <h2>Cuenta</h2>
              <p>Tus datos de acceso como administrador.</p>
            </div>
          </div>
          <AdminButton variant="secondary" onClick={() => navigate('/app/configuracion/cuenta')}>Editar cuenta</AdminButton>
        </div>
        <dl className="detail-list mt-4">
          <div className="detail-row"><dt>Nombres</dt><dd>{data.admin.nombres}</dd></div>
          <div className="detail-row"><dt>Apellidos</dt><dd>{data.admin.apellidos}</dd></div>
          <div className="detail-row"><dt>Correo electrónico</dt><dd>{data.admin.correo}</dd></div>
        </dl>
      </AdminCard>

      <form id={`${baseId}-form`} className="mt-5 space-y-5" onSubmit={save}>
        <AdminCard className="p-4">
          <div className="flex items-start gap-3"><KeyRound aria-hidden="true" size={19} /><div><h2>Seguridad</h2><p>Políticas globales para autenticación y sesiones.</p></div></div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <SwitchRow title="Política de contraseñas fuertes" description="Exige una contraseña con mayor complejidad." value={form.security.strongPasswords} onChange={(value) => set({ ...form, security: { ...form.security, strongPasswords: value } })} />
              <SwitchRow title="MFA para administradores" description="Solicita segundo factor para accesos administrativos." value={form.security.twoFactorAdmin} onChange={(value) => set({ ...form, security: { ...form.security, twoFactorAdmin: value } })} />
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="form-field"><label htmlFor={idFor('sessionMinutes')}>Tiempo de sesión activa (min)</label><input id={idFor('sessionMinutes')} type="number" min="5" value={form.security.sessionMinutes} onChange={(event) => set({ ...form, security: { ...form.security, sessionMinutes: event.target.value as unknown as number } })} />{fieldError('sessionMinutes')}</div>
              <div className="form-field"><label htmlFor={idFor('maxFailedAttempts')}>Intentos fallidos antes de bloqueo</label><input id={idFor('maxFailedAttempts')} type="number" min="1" value={form.security.maxFailedAttempts} onChange={(event) => set({ ...form, security: { ...form.security, maxFailedAttempts: event.target.value as unknown as number } })} />{fieldError('maxFailedAttempts')}</div>
            </div>
          </div>
        </AdminCard>

        <AdminCard className="p-4">
          <div className="flex items-start gap-3"><Mail aria-hidden="true" size={19} /><div><h2>Notificaciones</h2><p>Configura el servicio de correo y los recordatorios automáticos.</p></div></div>
          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <dl className="detail-list">
              <div className="detail-row"><dt>Servidor SMTP</dt><dd>{form.notifications.smtpServer}</dd></div>
              <div className="detail-row"><dt>Correo remitente</dt><dd>{form.notifications.sender}</dd></div>
            </dl>
            <div>
              <SwitchRow title="Recordatorios automáticos" description="Envía recordatorios asociados a vencimientos y eventos configurados." value={form.notifications.remindersEnabled} onChange={(value) => set({ ...form, notifications: { ...form.notifications, remindersEnabled: value } })} />
              <div className="flex flex-wrap items-center justify-between gap-3 py-3"><strong>Plantillas de correo</strong><Link to="/app/admin/alertas-contenido?tab=templates" className="admin-button admin-button--secondary admin-button--sm min-h-11">Gestionar plantillas</Link></div>
            </div>
          </div>
        </AdminCard>
      </form>

      <AdminCard className="mt-5 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3"><Info aria-hidden="true" size={19} /><div><h2>Información del sistema</h2><p>Versión y estado operativo de la plataforma.</p></div></div>
          <AdminButton size="icon" variant="ghost" onClick={() => setEditingSystem((current) => !current)} aria-label={editingSystem ? 'Cerrar edición de información del sistema' : 'Editar información del sistema'}><Pencil aria-hidden="true" size={16} /></AdminButton>
        </div>
        {editingSystem ? (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-field"><label htmlFor={idFor('system-version')}>Versión</label><input id={idFor('system-version')} value={form.system.version ?? ''} onChange={(event) => setSystem('version', event.target.value)} /></div>
            <div className="form-field"><label htmlFor={idFor('system-license')}>Licencia</label><input id={idFor('system-license')} value={form.system.license ?? ''} onChange={(event) => setSystem('license', event.target.value)} /></div>
            <div className="md:col-span-2"><AdminButton variant="primary" onClick={() => { updateSettings(form); setEditingSystem(false); setSaved(true) }}><Save aria-hidden="true" size={16} />Guardar información del sistema</AdminButton></div>
          </div>
        ) : (
          <dl className="detail-list mt-4">
            <div className="detail-row"><dt>Versión</dt><dd>SAFE {form.system.version ?? '—'}</dd></div>
            <div className="detail-row"><dt>Última actualización</dt><dd>{form.system.lastUpdate ?? '—'}</dd></div>
            <div className="detail-row"><dt>Licencia</dt><dd>{form.system.license ?? '—'}</dd></div>
            <div className="detail-row"><dt>Estado de servicios</dt><dd>{[form.system.api, form.system.database, form.system.mail].every((value) => value === 'Operativo' || value === 'Operativa') ? 'Todos los servicios operativos' : 'Revisar servicios con incidencias'}</dd></div>
          </dl>
        )}
      </AdminCard>

      <AdminCard className="mt-5 overflow-hidden p-0">
        <div className="flex items-start gap-3 p-4"><ScrollText aria-hidden="true" size={19} /><div><h2>Privacidad y legal</h2><p>Documentos legales que rigen el uso de SAFE.</p></div></div>
        <Accordion type="single" collapsible className="px-4 pb-2" value={documentoAbierto ?? undefined} onValueChange={(v) => setDocumentoAbierto(v || null)}>
          {DOCUMENTOS_LEGALES.map((doc) => (
            <AccordionItem key={doc.id} value={doc.id}>
              <AccordionTrigger className="text-left text-sm font-medium">{doc.titulo}</AccordionTrigger>
              <AccordionContent className="text-sm">
                <p>{doc.descripcion}</p>
                {doc.href && (
                  <a href={doc.href} target="_blank" rel="noreferrer" className="mt-2 inline-block font-semibold text-navy-600 hover:underline">
                    Ver documento completo →
                  </a>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </AdminCard>
    </>
  )
}
