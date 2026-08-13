import type { LucideIcon } from 'lucide-react'

export type EntityRecord = Record<string, unknown> & { id: string }

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger'

export interface AdminUser {
  id: string
  nombres: string
  apellidos: string
  correo: string
  iniciales: string
  role: string
}

export interface UserRecord extends EntityRecord {
  id: string
  role: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  pais: string
  ciudad: string
  correo_verificado: boolean
  mfa_habilitado: boolean
  estado: string
  ultimo_acceso: string
  created_at: string
  noCompany?: boolean
}

export interface CompanyRecord extends EntityRecord {
  id: string
  usuario_id: string
  actividad_economica_id: string | null
  cluster_id: string | null
  estructura_societaria_id: string | null
  tipo_contribuyente_id: string | null
  ruc: string
  razon_social: string
  nombre_comercial: string
  correo_empresarial: string
  telefono_empresarial: string
  direccion: string
  ciudad: string
  provincia: string
  sitio_web: string
  fecha_constitucion: string
  giro_negocio: string
  tamano_empresa: string
  etapa_negocio: string
  numero_empleados: number
  lleva_contabilidad: boolean
  declara_impuestos: boolean
  objetivo_principal: string
  meta_financiera: string
  estado: string
  plan: string
  subscriptionState: string
  renewal: string
  simulationsUsed: number
  marketplaceContacts: number
  lastFinancialUpload: string
  created_at: string
}

export interface CollaboratorRecord extends EntityRecord {
  id: string
  usuario_id: string
  postulacion_id: string
  area_especializacion: string
  profesion: string
  trabajo_actual: string
  cv_url: string
  numero_licencia: string | null
  entidad_emisora: string | null
  archivo_credencial_url: string | null
  descripcion_profesional: string
  modalidad_atencion: string
  pais_atencion: string
  ciudad_atencion: string
  zona_horaria: string
  tarifa_referencial: number
  anios_experiencia: number
  cv_visible: boolean
  foto_perfil_url: string | null
  estado_disponibilidad: string
  visible_marketplace: boolean
  estado: string
  approved_at: string
  created_at: string
  updated_at: string
  rating: number
  reviews: number
  specialties: string[]
  services: Array<{ name: string; description?: string; duration: number; price: number; modality?: string; active?: boolean }>
  schedules: Array<{ day: number; start: string; end: string; modality: string; active: boolean }>
  reviewItems: Array<{ rating: number; comment: string; company: string; date: string; status: string }>
}

export interface ApplicationRecord extends EntityRecord {
  id: string
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  pais: string
  ciudad: string
  area_especializacion: string
  especialidad_principal: string
  trabajo_actual: string
  cv_url: string
  numero_licencia: string | null
  entidad_emisora: string | null
  archivo_credencial_url: string | null
  como_llego_safe: string | null
  codigo_invitacion: string | null
  descripcion_profesional: string
  modalidad_atencion: string
  tarifa_referencial: number
  dias_disponibles: number[]
  hora_inicio_referencial: string | null
  hora_fin_referencial: string | null
  estado: string
  created_at: string
  reviewed_at: string | null
  motivo_rechazo: string | null
  acepta_terminos: boolean
  acepta_validacion: boolean
}

export interface PlanRecord extends EntityRecord {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  precio_mensual: number
  moneda: string
  dias_prueba: number
  nivel_soporte: string
  renovacion_automatica_default: boolean
  orden_visualizacion: number
  activo: boolean
  updated_at: string
  users: number
  modules: string[]
  limits: Record<string, number>
}

export interface CommunicationRecord extends EntityRecord {
  id: string
  title: string
  type: string
  audience: string
  status: string
  schedule: string
  updated: string
  description: string
  channels: string[]
}

export interface SecurityAlertRecord extends EntityRecord {
  id: string
  tipo: string
  titulo: string
  descripcion: string
  gravedad: string
  estado: string
  cuenta: string
  direccion_ip: string
  ubicacion: string
  created_at: string
}

export interface IncidentRecord extends EntityRecord {
  id: string
  codigo: string
  codigo_error: string | null
  titulo: string
  descripcion: string
  modulo: string
  estado: string
  created_at: string
  updated_at: string
  resolved_at: string | null
  priority: string
  assignee: string
  sourceUser: string
}

export interface LogRecord extends EntityRecord {
  id: string
  usuario_id: string
  correo_usuario: string
  direccion_ip: string
  accion: string
  modulo: string
  created_at: string
  result: string
}

export interface AuditRecord extends EntityRecord {
  id: string
  usuario_id: string
  tabla_afectada: string
  registro_id: string
  accion: string
  valores_anteriores: Record<string, unknown> | null
  valores_nuevos: Record<string, unknown> | null
  created_at: string
}

export interface TutorialRecord extends EntityRecord {
  id: string
  modulo: string
  titulo: string
  descripcion: string
  categoria: string
  audiencia: string
  url_video: string
  url_miniatura: string
  duracion_segundos: number
  estado: string
  orden_visualizacion: number
  views: number
  updated_at: string
  published_at: string | null
}

export interface EmailTemplateRecord extends EntityRecord {
  id: string
  name: string
  event: string
  subject: string
  status: string
  updated: string
  body: string
}

export interface AdminSettings {
  platformName: string
  language: string
  timezone: string
  logoMode: string
  security: {
    strongPasswords: boolean
    twoFactorAdmin: boolean
    sessionMinutes: number
    maxFailedAttempts: number
  }
  notifications: {
    smtpServer: string
    sender: string
    remindersEnabled: boolean
  }
  system: Record<string, string>
}

export interface AdminData {
  meta: { version: number; generatedAt: string }
  admin: AdminUser
  dashboard: {
    metrics: Array<{ id: string; label: string; value: number; delta: string; note: string; icon: string }>
    monthly: Array<{ month: string; registrations: number; subscriptions: number }>
  }
  users: UserRecord[]
  companies: CompanyRecord[]
  collaborators: CollaboratorRecord[]
  applications: ApplicationRecord[]
  plans: PlanRecord[]
  modules: Array<{ codigo: string; nombre: string; descripcion: string }>
  permissions: string[]
  industryClusters: EntityRecord[]
  economicActivities: EntityRecord[]
  corporateStructures: EntityRecord[]
  taxpayerTypes: EntityRecord[]
  professionalSpecialties: EntityRecord[]
  obligations: EntityRecord[]
  obligationRules: EntityRecord[]
  norms: EntityRecord[]
  normativeParams: EntityRecord[]
  financialConcepts: EntityRecord[]
  clusterConcepts: EntityRecord[]
  derivedMagnitudes: EntityRecord[]
  indicators: EntityRecord[]
  clusterIndicators: EntityRecord[]
  benchmarks: EntityRecord[]
  scenarios: EntityRecord[]
  communications: CommunicationRecord[]
  securityAlerts: SecurityAlertRecord[]
  incidents: IncidentRecord[]
  logs: LogRecord[]
  audits: AuditRecord[]
  tutorials: TutorialRecord[]
  emailTemplates: EmailTemplateRecord[]
  settings: AdminSettings
}

export type AdminCollectionKey =
  | 'users'
  | 'companies'
  | 'collaborators'
  | 'applications'
  | 'plans'
  | 'industryClusters'
  | 'economicActivities'
  | 'corporateStructures'
  | 'taxpayerTypes'
  | 'professionalSpecialties'
  | 'obligations'
  | 'obligationRules'
  | 'norms'
  | 'normativeParams'
  | 'financialConcepts'
  | 'clusterConcepts'
  | 'derivedMagnitudes'
  | 'indicators'
  | 'clusterIndicators'
  | 'benchmarks'
  | 'scenarios'
  | 'communications'
  | 'securityAlerts'
  | 'incidents'
  | 'logs'
  | 'audits'
  | 'tutorials'
  | 'emailTemplates'

export interface KpiDefinition {
  title: string
  value: string | number
  note: string
  icon: LucideIcon
  tone?: Tone
}
