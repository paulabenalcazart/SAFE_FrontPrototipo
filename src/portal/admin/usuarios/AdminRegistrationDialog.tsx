import { useEffect, useId, useState } from 'react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import type { CollaboratorRecord, CompanyRecord, UserRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { hasDuplicateEmail, hasDuplicateRuc, normalizeAdminEmail } from './userLogic'

export type AdminRegistrationKind = 'company' | 'collaborator'
type FormState = Record<string, string>
const companyDefaults: FormState = { nombres: '', apellidos: '', correo: '', telefono: '', ruc: '', razon_social: '', nombre_comercial: '', correo_empresarial: '', telefono_empresarial: '', ciudad: 'Guayaquil', provincia: 'Guayas', direccion: '', giro_negocio: '', actividad_economica_id: '', cluster_id: '', estructura_societaria_id: '', tipo_contribuyente_id: '', tamano_empresa: 'MICRO', etapa_negocio: 'INICIAL', numero_empleados: '1', lleva_contabilidad: 'false', declara_impuestos: 'true' }
const collaboratorDefaults: FormState = { nombres: '', apellidos: '', correo: '', telefono: '', pais: 'Ecuador', ciudad: 'Guayaquil', area_especializacion: '', profesion: '', especialidad: '', trabajo_actual: '', modalidad_atencion: 'VIRTUAL', tarifa_referencial: '0', anios_experiencia: '0', numero_licencia: '', entidad_emisora: '', descripcion_profesional: '' }

function nonNegative(value: string) { return Number(value) >= 0 }

export function AdminRegistrationDialog({ kind, open, onClose }: { kind: AdminRegistrationKind | null; open: boolean; onClose: () => void }) {
  const { data, upsertEntity } = useAdminData()
  const [form, setForm] = useState<FormState>(companyDefaults)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const baseId = useId().replace(/:/g, '')
  useEffect(() => { if (open && kind) { setForm({ ...(kind === 'company' ? companyDefaults : collaboratorDefaults) }); setErrors({}); setSaving(false) } }, [kind, open])
  if (!kind) return null
  const set = (field: string, value: string) => setForm((current) => ({ ...current, [field]: value }))
  const idFor = (field: string) => `${baseId}-${field}`
  const errorFor = (field: string) => errors[field] ? <p id={`${idFor(field)}-error`} role="alert">{errors[field]}</p> : null
  const validate = () => {
    const next: Record<string, string> = {}
    for (const field of kind === 'company' ? ['nombres', 'apellidos', 'correo', 'ruc', 'razon_social', 'nombre_comercial'] : ['nombres', 'apellidos', 'correo', 'area_especializacion', 'profesion']) if (!form[field]?.trim()) next[field] = 'Este campo es obligatorio.'
    if (hasDuplicateEmail(data.users, form.correo)) next.correo = 'Ya existe una cuenta con este correo.'
    if (kind === 'company' && hasDuplicateRuc(data.companies, form.ruc)) next.ruc = 'Ya existe una empresa con este RUC.'
    if (kind === 'company' && Number(form.numero_empleados) < 1) next.numero_empleados = 'Debe registrar al menos un empleado.'
    if (kind === 'collaborator' && !nonNegative(form.tarifa_referencial)) next.tarifa_referencial = 'La tarifa no puede ser negativa.'
    if (kind === 'collaborator' && !nonNegative(form.anios_experiencia)) next.anios_experiencia = 'La experiencia no puede ser negativa.'
    setErrors(next)
    return Object.keys(next).length === 0
  }
  const save = () => {
    if (saving || !validate()) return
    setSaving(true)
    const userId = crypto.randomUUID()
    const user: UserRecord = { id: userId, role: kind === 'company' ? 'USUARIO_EMPRESA' : 'COLABORADOR', nombres: form.nombres.trim(), apellidos: form.apellidos.trim(), correo: normalizeAdminEmail(form.correo), telefono: form.telefono.trim() || null, pais: form.pais?.trim() || 'Ecuador', ciudad: form.ciudad?.trim() || 'Guayaquil', correo_verificado: true, mfa_habilitado: false, estado: 'ACTIVO', ultimo_acceso: AHORA_ADMIN, created_at: AHORA_ADMIN }
    upsertEntity('users', user)
    if (kind === 'company') {
      const company: CompanyRecord = { id: crypto.randomUUID(), usuario_id: userId, actividad_economica_id: form.actividad_economica_id || null, cluster_id: form.cluster_id || null, estructura_societaria_id: form.estructura_societaria_id || null, tipo_contribuyente_id: form.tipo_contribuyente_id || null, ruc: form.ruc.trim(), razon_social: form.razon_social.trim(), nombre_comercial: form.nombre_comercial.trim(), correo_empresarial: normalizeAdminEmail(form.correo_empresarial || form.correo), telefono_empresarial: form.telefono_empresarial.trim() || form.telefono.trim(), direccion: form.direccion.trim(), ciudad: form.ciudad.trim(), provincia: form.provincia.trim(), sitio_web: '', fecha_constitucion: '', giro_negocio: form.giro_negocio.trim(), tamano_empresa: form.tamano_empresa, etapa_negocio: form.etapa_negocio, numero_empleados: Number(form.numero_empleados), lleva_contabilidad: form.lleva_contabilidad === 'true', declara_impuestos: form.declara_impuestos === 'true', objetivo_principal: '', meta_financiera: '', estado: 'ACTIVA', plan: 'Sin plan', subscriptionState: 'SIN_SUSCRIPCION', renewal: '', simulationsUsed: 0, marketplaceContacts: 0, lastFinancialUpload: '', created_at: AHORA_ADMIN }
      upsertEntity('companies', company)
    } else {
      const collaborator: CollaboratorRecord = { id: crypto.randomUUID(), usuario_id: userId, postulacion_id: crypto.randomUUID(), area_especializacion: form.area_especializacion.trim(), profesion: form.profesion.trim(), trabajo_actual: form.trabajo_actual.trim(), cv_url: '', numero_licencia: form.numero_licencia.trim() || null, entidad_emisora: form.entidad_emisora.trim() || null, archivo_credencial_url: null, descripcion_profesional: form.descripcion_profesional.trim(), modalidad_atencion: form.modalidad_atencion, pais_atencion: form.pais.trim(), ciudad_atencion: form.ciudad.trim(), zona_horaria: 'America/Guayaquil', tarifa_referencial: Number(form.tarifa_referencial), anios_experiencia: Number(form.anios_experiencia), cv_visible: false, foto_perfil_url: null, estado_disponibilidad: 'DISPONIBLE', visible_marketplace: true, estado: 'ACTIVO', approved_at: AHORA_ADMIN, created_at: AHORA_ADMIN, updated_at: AHORA_ADMIN, rating: 0, reviews: 0, specialties: form.especialidad.trim() ? [form.especialidad.trim()] : [], services: [], schedules: [], reviewItems: [] }
      upsertEntity('collaborators', collaborator)
    }
    onClose()
  }
  const Field = ({ field, label, type = 'text', min }: { field: string; label: string; type?: string; min?: string }) => <div className="form-field"><label htmlFor={idFor(field)}>{label}</label><input id={idFor(field)} type={type} min={min} value={form[field] ?? ''} onChange={(event) => set(field, event.target.value)} aria-describedby={errors[field] ? `${idFor(field)}-error` : undefined} />{errorFor(field)}</div>
  const Select = ({ field, label, options }: { field: string; label: string; options: string[] }) => <div className="form-field"><label htmlFor={idFor(field)}>{label}</label><select id={idFor(field)} value={form[field] ?? ''} onChange={(event) => set(field, event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>{errorFor(field)}</div>
  return <AdminDialog open={open} title={kind === 'company' ? 'Registrar empresa' : 'Registrar colaborador'} description={kind === 'company' ? 'Crea una cuenta propietaria y registra los datos principales de la empresa.' : 'Crea directamente una cuenta profesional validada por administración.'} onClose={onClose} wide footer={<><AdminButton disabled={saving} onClick={onClose}>Cancelar</AdminButton><AdminButton variant="primary" disabled={saving} onClick={save}>{saving ? 'Guardando…' : 'Guardar registro'}</AdminButton></>}>
    <div className="form-section"><h3>Cuenta</h3><div className="form-grid"><Field field="nombres" label="Nombres" /><Field field="apellidos" label="Apellidos" /><Field field="correo" label="Correo" type="email" /><Field field="telefono" label="Teléfono" />{kind === 'collaborator' ? <><Field field="pais" label="País" /><Field field="ciudad" label="Ciudad" /></> : null}</div></div>
    {kind === 'company' ? <div className="form-section"><h3>Empresa</h3><div className="form-grid"><Field field="ruc" label="RUC" /><Field field="razon_social" label="Razón social" /><Field field="nombre_comercial" label="Nombre comercial" /><Field field="correo_empresarial" label="Correo empresarial" type="email" /><Field field="telefono_empresarial" label="Teléfono empresarial" /><Field field="ciudad" label="Ciudad" /><Field field="provincia" label="Provincia" /><Field field="direccion" label="Dirección" /><Field field="giro_negocio" label="Giro de negocio" /><Select field="actividad_economica_id" label="Actividad económica" options={['', ...data.economicActivities.map((item) => String(item.id))]} /><Select field="cluster_id" label="Cluster" options={['', ...data.industryClusters.map((item) => String(item.id))]} /><Select field="estructura_societaria_id" label="Estructura societaria" options={['', ...data.corporateStructures.map((item) => String(item.id))]} /><Select field="tipo_contribuyente_id" label="Tipo de contribuyente" options={['', ...data.taxpayerTypes.map((item) => String(item.id))]} /><Select field="tamano_empresa" label="Tamaño" options={['MICRO', 'PEQUENA', 'MEDIANA', 'GRANDE']} /><Select field="etapa_negocio" label="Etapa" options={['INICIAL', 'CRECIMIENTO', 'MADURA']} /><Field field="numero_empleados" label="Empleados" type="number" min="1" /><Select field="lleva_contabilidad" label="Lleva contabilidad" options={['false', 'true']} /><Select field="declara_impuestos" label="Declara impuestos" options={['false', 'true']} /></div></div> : <div className="form-section"><h3>Perfil profesional</h3><div className="form-grid"><Field field="area_especializacion" label="Área de especialización" /><Field field="profesion" label="Profesión" /><Field field="especialidad" label="Especialidad principal" /><Field field="trabajo_actual" label="Trabajo actual" /><Select field="modalidad_atencion" label="Modalidad" options={['VIRTUAL', 'PRESENCIAL', 'AMBAS']} /><Field field="tarifa_referencial" label="Tarifa referencial" type="number" min="0" /><Field field="anios_experiencia" label="Años de experiencia" type="number" min="0" /><Field field="numero_licencia" label="Licencia profesional" /><Field field="entidad_emisora" label="Entidad emisora" /><div className="form-field"><label htmlFor={idFor('descripcion_profesional')}>Descripción profesional</label><textarea id={idFor('descripcion_profesional')} value={form.descripcion_profesional} onChange={(event) => set('descripcion_profesional', event.target.value)} /></div></div></div>}
  </AdminDialog>
}
