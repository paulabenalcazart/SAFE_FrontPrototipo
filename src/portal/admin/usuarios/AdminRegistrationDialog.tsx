import { useEffect, useId, useState, type FormEvent } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Stepper } from '@/components/Stepper'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import type { CollaboratorRecord, CompanyRecord, UserRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { hasDuplicateEmail, hasDuplicateRuc, isValidAdminEmail, normalizeAdminEmail } from './userLogic'

export type AdminRegistrationKind = 'company' | 'collaborator'
type FormState = Record<string, string>

const companyDefaults: FormState = {
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  ruc: '',
  razon_social: '',
  nombre_comercial: '',
  correo_empresarial: '',
  telefono_empresarial: '',
  ciudad: 'Guayaquil',
  provincia: 'Guayas',
  direccion: '',
  giro_negocio: '',
  actividad_economica_id: 'act-001',
  cluster_id: 'clu-serv',
  estructura_societaria_id: 'str-sas',
  tipo_contribuyente_id: 'tax-001',
  tamano_empresa: 'MICRO',
  etapa_negocio: 'INICIAL',
  numero_empleados: '1',
  lleva_contabilidad: 'false',
  declara_impuestos: 'true',
}

const collaboratorDefaults: FormState = {
  nombres: '',
  apellidos: '',
  correo: '',
  telefono: '',
  pais: 'Ecuador',
  ciudad: 'Guayaquil',
  area_especializacion: '',
  profesion: '',
  especialidad: '',
  trabajo_actual: '',
  modalidad_atencion: 'VIRTUAL',
  tarifa_referencial: '0',
  anios_experiencia: '0',
  numero_licencia: '',
  entidad_emisora: '',
  descripcion_profesional: '',
}

const requiredCompanyRelations = ['actividad_economica_id', 'cluster_id', 'estructura_societaria_id', 'tipo_contribuyente_id'] as const

const companyAccountFields = new Set(['nombres', 'apellidos', 'correo', 'telefono'])
const collaboratorAccountFields = new Set(['nombres', 'apellidos', 'correo', 'telefono', 'pais', 'ciudad'])
const companySteps = ['Cuenta', 'Empresa']
const collaboratorSteps = ['Cuenta', 'Perfil profesional']

function stepFor(kind: AdminRegistrationKind, field: string): number {
  const accountFields = kind === 'company' ? companyAccountFields : collaboratorAccountFields
  return accountFields.has(field) ? 0 : 1
}

function nonNegative(value: string) {
  return Number(value) >= 0
}

export function AdminRegistrationDialog({
  kind,
  open,
  onClose,
}: {
  kind: AdminRegistrationKind | null
  open: boolean
  onClose: () => void
}) {
  const { data, upsertEntity } = useAdminData()
  const [form, setForm] = useState<FormState>(companyDefaults)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)
  const baseId = useId().replace(/:/g, '')
  const formId = `${baseId}-form`

  useEffect(() => {
    if (open && kind) {
      setForm({ ...(kind === 'company' ? companyDefaults : collaboratorDefaults) })
      setErrors({})
      setSaving(false)
      setStep(0)
    }
  }, [kind, open])

  if (!kind) return null

  const steps = kind === 'company' ? companySteps : collaboratorSteps
  const isLastStep = step === steps.length - 1
  const set = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const idFor = (field: string) => `${baseId}-${field}`

  const requiredFields =
    kind === 'company'
      ? ['nombres', 'apellidos', 'correo', 'ruc', 'razon_social', 'nombre_comercial', ...requiredCompanyRelations]
      : ['nombres', 'apellidos', 'correo', 'area_especializacion', 'profesion']

  const validate = () => {
    const next: Record<string, string> = {}
    for (const field of kind === 'company'
      ? ['nombres', 'apellidos', 'correo', 'ruc', 'razon_social', 'nombre_comercial']
      : ['nombres', 'apellidos', 'correo', 'area_especializacion', 'profesion']) {
      if (!form[field]?.trim()) next[field] = 'Este campo es obligatorio.'
    }
    if (!isValidAdminEmail(form.correo)) next.correo = 'Ingresa un correo válido.'
    if (hasDuplicateEmail(data.users, form.correo)) next.correo = 'Ya existe una cuenta con este correo.'
    if (kind === 'company' && hasDuplicateRuc(data.companies, form.ruc)) next.ruc = 'Ya existe una empresa con este RUC.'
    if (kind === 'company') {
      for (const field of requiredCompanyRelations) if (!form[field]) next[field] = 'Selecciona una relación válida.'
    }
    if (kind === 'company' && Number(form.numero_empleados) < 1) next.numero_empleados = 'Debe registrar al menos un empleado.'
    if (kind === 'collaborator' && !nonNegative(form.tarifa_referencial)) next.tarifa_referencial = 'La tarifa no puede ser negativa.'
    if (kind === 'collaborator' && !nonNegative(form.anios_experiencia)) next.anios_experiencia = 'La experiencia no puede ser negativa.'
    setErrors(next)
    const firstField = Object.keys(next)[0]
    if (firstField) setStep(stepFor(kind, firstField))
    return Object.keys(next).length === 0
  }

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (saving || !validate()) return
    setSaving(true)
    const userId = crypto.randomUUID()
    const user: UserRecord = {
      id: userId,
      role: kind === 'company' ? 'USUARIO_EMPRESA' : 'COLABORADOR',
      nombres: form.nombres.trim(),
      apellidos: form.apellidos.trim(),
      correo: normalizeAdminEmail(form.correo),
      telefono: form.telefono.trim() || null,
      pais: form.pais?.trim() || 'Ecuador',
      ciudad: form.ciudad?.trim() || 'Guayaquil',
      correo_verificado: true,
      mfa_habilitado: false,
      estado: 'ACTIVO',
      ultimo_acceso: AHORA_ADMIN,
      created_at: AHORA_ADMIN,
    }
    upsertEntity('users', user)
    if (kind === 'company') {
      const company: CompanyRecord = {
        id: crypto.randomUUID(),
        usuario_id: userId,
        actividad_economica_id: form.actividad_economica_id || null,
        cluster_id: form.cluster_id || null,
        estructura_societaria_id: form.estructura_societaria_id || null,
        tipo_contribuyente_id: form.tipo_contribuyente_id || null,
        ruc: form.ruc.trim(),
        razon_social: form.razon_social.trim(),
        nombre_comercial: form.nombre_comercial.trim(),
        correo_empresarial: normalizeAdminEmail(form.correo_empresarial || form.correo),
        telefono_empresarial: form.telefono_empresarial.trim() || form.telefono.trim(),
        direccion: form.direccion.trim(),
        ciudad: form.ciudad.trim(),
        provincia: form.provincia.trim(),
        sitio_web: '',
        fecha_constitucion: '',
        giro_negocio: form.giro_negocio.trim(),
        tamano_empresa: form.tamano_empresa,
        etapa_negocio: form.etapa_negocio,
        numero_empleados: Number(form.numero_empleados),
        lleva_contabilidad: form.lleva_contabilidad === 'true',
        declara_impuestos: form.declara_impuestos === 'true',
        objetivo_principal: '',
        meta_financiera: '',
        estado: 'ACTIVA',
        plan: 'Sin plan',
        subscriptionState: 'SIN_SUSCRIPCION',
        renewal: '',
        simulationsUsed: 0,
        marketplaceContacts: 0,
        lastFinancialUpload: '',
        created_at: AHORA_ADMIN,
      }
      upsertEntity('companies', company)
    } else {
      const collaborator: CollaboratorRecord = {
        id: crypto.randomUUID(),
        usuario_id: userId,
        postulacion_id: crypto.randomUUID(),
        area_especializacion: form.area_especializacion.trim(),
        profesion: form.profesion.trim(),
        trabajo_actual: form.trabajo_actual.trim(),
        cv_url: '',
        numero_licencia: form.numero_licencia.trim() || null,
        entidad_emisora: form.entidad_emisora.trim() || null,
        archivo_credencial_url: null,
        descripcion_profesional: form.descripcion_profesional.trim(),
        modalidad_atencion: form.modalidad_atencion,
        pais_atencion: form.pais.trim(),
        ciudad_atencion: form.ciudad.trim(),
        zona_horaria: 'America/Guayaquil',
        tarifa_referencial: Number(form.tarifa_referencial),
        anios_experiencia: Number(form.anios_experiencia),
        cv_visible: false,
        foto_perfil_url: null,
        estado_disponibilidad: 'DISPONIBLE',
        visible_marketplace: true,
        estado: 'ACTIVO',
        approved_at: AHORA_ADMIN,
        created_at: AHORA_ADMIN,
        updated_at: AHORA_ADMIN,
        rating: 0,
        reviews: 0,
        specialties: form.especialidad.trim() ? [form.especialidad.trim()] : [],
        services: [],
        schedules: [],
        reviewItems: [],
      }
      upsertEntity('collaborators', collaborator)
    }
    onClose()
  }

  const catalogOptions = (rows: Array<{ id: string; nombre?: unknown }>) =>
    rows.map((item) => ({ value: String(item.id), label: String(item.nombre) }))

  function TextField({
    field,
    label,
    type = 'text',
    min,
  }: {
    field: string
    label: string
    type?: string
    min?: string
  }) {
    const error = errors[field]
    return (
      <div>
        <Label htmlFor={idFor(field)}>{label}</Label>
        <Input
          id={idFor(field)}
          type={type}
          min={min}
          required={requiredFields.includes(field)}
          value={form[field] ?? ''}
          onChange={(event) => set(field, event.target.value)}
          aria-describedby={error ? `${idFor(field)}-error` : undefined}
          className="mt-1.5"
        />
        {error && (
          <p id={`${idFor(field)}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }

  function SelectField({
    field,
    label,
    options,
  }: {
    field: string
    label: string
    options: Array<string | { value: string; label: string }>
  }) {
    const error = errors[field]
    return (
      <div>
        <Label htmlFor={idFor(field)}>{label}</Label>
        <Select value={form[field] ?? ''} onValueChange={(v) => set(field, v)}>
          <SelectTrigger id={idFor(field)} className="mt-1.5">
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => {
              const value = typeof option === 'string' ? option : option.value
              const text = typeof option === 'string' ? option : option.label
              return (
                <SelectItem key={value} value={value}>
                  {text}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
        {error && (
          <p id={`${idFor(field)}-error`} role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
            {error}
          </p>
        )}
      </div>
    )
  }

  function ToggleField({ field, label }: { field: string; label: string }) {
    return (
      <div>
        <span className="mb-1.5 block text-sm font-medium text-ink-900">{label}</span>
        <div className="flex gap-2">
          {['true', 'false'].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => set(field, value)}
              aria-pressed={form[field] === value}
              className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                form[field] === value ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-card text-ink-700'
              }`}
            >
              {value === 'true' ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <AdminDialog
      open={open}
      title={kind === 'company' ? 'Registrar empresa' : 'Registrar colaborador'}
      description={
        kind === 'company'
          ? 'Crea una cuenta propietaria y registra los datos principales de la empresa.'
          : 'Crea directamente una cuenta profesional validada por administración.'
      }
      onClose={onClose}
      wide
      footer={
        <>
          <AdminButton disabled={saving} onClick={onClose}>
            Cancelar
          </AdminButton>
          {step > 0 && (
            <AdminButton type="button" disabled={saving} onClick={() => setStep((current) => current - 1)}>
              Anterior
            </AdminButton>
          )}
          {isLastStep ? (
            <AdminButton variant="primary" type="submit" form={formId} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar registro'}
            </AdminButton>
          ) : (
            <AdminButton variant="primary" type="button" disabled={saving} onClick={() => setStep((current) => current + 1)}>
              Siguiente
            </AdminButton>
          )}
        </>
      }
    >
      <Stepper steps={steps} current={step} />
      <form id={formId} className="mt-6 flex flex-col gap-5" onSubmit={save}>
        {step === 0 && (
          <div>
            <h3 className="text-sm font-semibold text-navy-700">Cuenta</h3>
            <div className="mt-3 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <TextField field="nombres" label="Nombres" />
              <TextField field="apellidos" label="Apellidos" />
              <TextField field="correo" label="Correo" type="email" />
              <TextField field="telefono" label="Teléfono" />
              {kind === 'collaborator' && (
                <>
                  <TextField field="pais" label="País" />
                  <TextField field="ciudad" label="Ciudad" />
                </>
              )}
            </div>
          </div>
        )}

        {step === 1 && kind === 'company' ? (
          <div>
            <h3 className="text-sm font-semibold text-navy-700">Empresa</h3>
            <div className="mt-3 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <TextField field="ruc" label="RUC" />
              <TextField field="razon_social" label="Razón social" />
              <TextField field="nombre_comercial" label="Nombre comercial" />
              <TextField field="correo_empresarial" label="Correo empresarial" type="email" />
              <TextField field="telefono_empresarial" label="Teléfono empresarial" />
              <TextField field="ciudad" label="Ciudad" />
              <TextField field="provincia" label="Provincia" />
              <TextField field="direccion" label="Dirección" />
              <TextField field="giro_negocio" label="Giro de negocio" />
              <SelectField field="actividad_economica_id" label="Actividad económica" options={catalogOptions(data.economicActivities)} />
              <SelectField field="cluster_id" label="Cluster" options={catalogOptions(data.industryClusters)} />
              <SelectField
                field="estructura_societaria_id"
                label="Estructura societaria"
                options={catalogOptions(data.corporateStructures)}
              />
              <SelectField field="tipo_contribuyente_id" label="Tipo de contribuyente" options={catalogOptions(data.taxpayerTypes)} />
              <SelectField field="tamano_empresa" label="Tamaño" options={['MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE']} />
              <SelectField field="etapa_negocio" label="Etapa" options={['INICIAL', 'CRECIMIENTO', 'MADURA']} />
              <TextField field="numero_empleados" label="Empleados" type="number" min="1" />
              <ToggleField field="lleva_contabilidad" label="Lleva contabilidad" />
              <ToggleField field="declara_impuestos" label="Declara impuestos" />
            </div>
          </div>
        ) : null}
        {step === 1 && kind === 'collaborator' ? (
          <div>
            <h3 className="text-sm font-semibold text-navy-700">Perfil profesional</h3>
            <div className="mt-3 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <TextField field="area_especializacion" label="Área de especialización" />
              <TextField field="profesion" label="Profesión" />
              <TextField field="especialidad" label="Especialidad principal" />
              <TextField field="trabajo_actual" label="Trabajo actual" />
              <SelectField field="modalidad_atencion" label="Modalidad" options={['VIRTUAL', 'PRESENCIAL', 'AMBAS']} />
              <TextField field="tarifa_referencial" label="Tarifa referencial" type="number" min="0" />
              <TextField field="anios_experiencia" label="Años de experiencia" type="number" min="0" />
              <TextField field="numero_licencia" label="Licencia profesional" />
              <TextField field="entidad_emisora" label="Entidad emisora" />
              <div className="sm:col-span-2">
                <Label htmlFor={idFor('descripcion_profesional')}>Descripción profesional</Label>
                <Textarea
                  id={idFor('descripcion_profesional')}
                  value={form.descripcion_profesional}
                  onChange={(event) => set('descripcion_profesional', event.target.value)}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
            </div>
          </div>
        ) : null}
      </form>
    </AdminDialog>
  )
}
