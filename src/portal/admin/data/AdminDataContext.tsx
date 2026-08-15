import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import seedJson from './semilla.json'
import { AHORA_ADMIN } from '../catalogo'
import type {
  AdminCollectionKey,
  AdminData,
  AdminSettings,
  AdminUser,
  ApplicationRecord,
  AuditRecord,
  CollaboratorRecord,
  EntityRecord,
  UserRecord,
} from '../types'

const seed = seedJson as unknown as AdminData

export type AdminDataContextValue = {
  data: AdminData
  replaceCollection: (key: AdminCollectionKey, rows: EntityRecord[]) => void
  upsertEntity: (key: AdminCollectionKey, record: EntityRecord) => void
  removeEntity: (key: AdminCollectionKey, id: string) => void
  patchEntity: (key: AdminCollectionKey, id: string, patch: Record<string, unknown>) => void
  updateSettings: (settings: AdminSettings) => void
  updateAdminProfile: (profile: Pick<AdminUser, 'nombres' | 'apellidos' | 'correo'>) => void
  reviewApplication: (id: string, status: 'APROBADA' | 'RECHAZADA', reason?: string) => void
  setManagedUserState: (userId: string, state: 'ACTIVO' | 'SUSPENDIDO') => void
  removeManagedCompany: (companyId: string) => void
  removeManagedCollaborator: (collaboratorId: string) => void
  resetData: () => void
}

const AdminDataContext = createContext<AdminDataContextValue | null>(null)

function cloneSeed(): AdminData {
  return JSON.parse(JSON.stringify(seed)) as AdminData
}

function rowsFor(data: AdminData, key: AdminCollectionKey): EntityRecord[] {
  return data[key] as unknown as EntityRecord[]
}

// Traduce las claves de colección (camelCase, usadas en el estado de React) a los
// nombres reales de tabla del dump SQL de SAFE, para que auditoria_cambio.tabla_afectada
// quede alineado con el modelo de datos en vez de exponer nombres de variables internas.
export const COLLECTION_TABLE_NAME: Partial<Record<AdminCollectionKey | 'settings' | 'applications', string>> = {
  users: 'usuario',
  companies: 'empresa',
  collaborators: 'colaborador',
  applications: 'postulacion_profesional',
  plans: 'plan',
  industryClusters: 'cluster_industria',
  economicActivities: 'actividad_economica',
  corporateStructures: 'estructura_societaria',
  taxpayerTypes: 'tipo_contribuyente',
  professionalSpecialties: 'especialidad_profesional',
  obligations: 'obligacion',
  obligationRules: 'regla_obligacion',
  norms: 'norma_legal',
  normativeParams: 'parametro_normativo',
  financialConcepts: 'concepto_financiero',
  clusterConcepts: 'cluster_concepto_financiero',
  derivedMagnitudes: 'magnitud_derivada',
  indicators: 'indicador',
  clusterIndicators: 'cluster_indicador',
  benchmarks: 'benchmark_indicador',
  scenarios: 'escenario_simulacion',
  incidents: 'incidencia',
  tutorials: 'video_tutorial',
}

function createAudit(key: string, id: string, action: string, previous: Record<string, unknown> | null, next: Record<string, unknown> | null): AuditRecord {
  return {
    id: `aud-${crypto.randomUUID()}`,
    usuario_id: seed.admin.id,
    tabla_afectada: COLLECTION_TABLE_NAME[key as AdminCollectionKey | 'settings' | 'applications'] ?? key,
    registro_id: id,
    accion: action,
    valores_anteriores: previous,
    valores_nuevos: next,
    created_at: AHORA_ADMIN,
  }
}

function appendAudit(data: AdminData, key: AdminCollectionKey | 'settings' | 'applications', id: string, action: string, previous: Record<string, unknown> | null, next: Record<string, unknown> | null): AdminData {
  if (key === 'audits') return data
  return { ...data, audits: [createAudit(key, id, action, previous, next), ...data.audits] }
}

function applicationUser(application: ApplicationRecord): UserRecord {
  return {
    id: crypto.randomUUID(),
    role: 'COLABORADOR',
    nombres: application.nombres,
    apellidos: application.apellidos,
    correo: application.correo,
    telefono: application.telefono,
    pais: application.pais,
    ciudad: application.ciudad,
    correo_verificado: true,
    mfa_habilitado: false,
    estado: 'ACTIVO',
    ultimo_acceso: AHORA_ADMIN,
    created_at: AHORA_ADMIN,
  }
}

function applicationCollaborator(application: ApplicationRecord, userId: string): CollaboratorRecord {
  return {
    id: crypto.randomUUID(),
    usuario_id: userId,
    postulacion_id: application.id,
    area_especializacion: application.area_especializacion,
    profesion: application.especialidad_principal,
    trabajo_actual: application.trabajo_actual,
    cv_url: application.cv_url,
    numero_licencia: application.numero_licencia,
    entidad_emisora: application.entidad_emisora,
    archivo_credencial_url: application.archivo_credencial_url,
    descripcion_profesional: application.descripcion_profesional,
    modalidad_atencion: application.modalidad_atencion,
    pais_atencion: application.pais,
    ciudad_atencion: application.ciudad,
    zona_horaria: 'America/Guayaquil',
    tarifa_referencial: application.tarifa_referencial,
    anios_experiencia: 0,
    cv_visible: true,
    foto_perfil_url: null,
    estado_disponibilidad: 'DISPONIBLE',
    visible_marketplace: true,
    estado: 'ACTIVO',
    approved_at: AHORA_ADMIN,
    created_at: AHORA_ADMIN,
    updated_at: AHORA_ADMIN,
    rating: 0,
    reviews: 0,
    specialties: [application.especialidad_principal],
    services: [],
    schedules: [],
    reviewItems: [],
  }
}

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AdminData>(cloneSeed)

  const commit = (updater: (current: AdminData) => AdminData) => setData(updater)

  const value = useMemo<AdminDataContextValue>(() => ({
    data,
    replaceCollection(key, rows) {
      commit((current) => ({ ...current, [key]: rows } as AdminData))
    },
    upsertEntity(key, record) {
      commit((current) => {
        const rows = rowsFor(current, key)
        const previous = rows.find((row) => row.id === record.id) ?? null
        const next = { ...current, [key]: previous ? rows.map((row) => (row.id === record.id ? record : row)) : [record, ...rows] } as AdminData
        return appendAudit(next, key, record.id, previous ? 'UPDATE' : 'INSERT', previous, record)
      })
    },
    removeEntity(key, id) {
      commit((current) => {
        const rows = rowsFor(current, key)
        const previous = rows.find((row) => row.id === id) ?? null
        if (!previous) return current
        const next = { ...current, [key]: rows.filter((row) => row.id !== id) } as AdminData
        return appendAudit(next, key, id, 'DELETE', previous, null)
      })
    },
    patchEntity(key, id, patch) {
      commit((current) => {
        const rows = rowsFor(current, key)
        const previous = rows.find((row) => row.id === id) ?? null
        if (!previous) return current
        const updated = { ...previous, ...patch }
        const next = { ...current, [key]: rows.map((row) => (row.id === id ? updated : row)) } as AdminData
        return appendAudit(next, key, id, 'UPDATE', previous, updated)
      })
    },
    updateSettings(settings) {
      commit((current) => appendAudit(
        { ...current, settings },
        'settings',
        'settings',
        'UPDATE',
        current.settings as unknown as Record<string, unknown>,
        settings as unknown as Record<string, unknown>,
      ))
    },
    updateAdminProfile(profile) {
      commit((current) => {
        const iniciales = `${profile.nombres[0] ?? ''}${profile.apellidos[0] ?? ''}`.toLocaleUpperCase('es') || current.admin.iniciales
        const admin: AdminUser = { ...current.admin, ...profile, iniciales }
        return appendAudit(
          { ...current, admin },
          'users',
          admin.id,
          'UPDATE',
          current.admin as unknown as Record<string, unknown>,
          admin as unknown as Record<string, unknown>,
        )
      })
    },
    reviewApplication(id, status, reason) {
      commit((current) => {
        const application = current.applications.find((item) => item.id === id)
        if (!application) return current
        const reviewed = { ...application, estado: status, reviewed_at: AHORA_ADMIN, motivo_rechazo: status === 'RECHAZADA' ? (reason?.trim() || null) : null }
        let next: AdminData = { ...current, applications: current.applications.map((item) => (item.id === id ? reviewed : item)) }
        if (status === 'APROBADA' && !current.users.some((user) => user.correo.trim().toLocaleLowerCase('es') === application.correo.trim().toLocaleLowerCase('es'))) {
          const user = applicationUser(application)
          const collaborator = applicationCollaborator(application, user.id)
          next = { ...next, users: [user, ...next.users], collaborators: [collaborator, ...next.collaborators] }
        }
        return appendAudit(next, 'applications', id, 'UPDATE', application, reviewed)
      })
    },
    setManagedUserState(userId, state) {
      commit((current) => {
        const user = current.users.find((item) => item.id === userId)
        if (!user) return current
        const updated = { ...user, estado: state }
        const next = { ...current, users: current.users.map((item) => (item.id === userId ? updated : item)) }
        return appendAudit(next, 'users', userId, 'UPDATE', user, updated)
      })
    },
    removeManagedCompany(companyId) {
      commit((current) => {
        const company = current.companies.find((item) => item.id === companyId)
        if (!company) return current
        const next = {
          ...current,
          companies: current.companies.filter((item) => item.id !== companyId),
          users: current.users.map((user) => (user.id === company.usuario_id ? { ...user, noCompany: true } : user)),
        }
        return appendAudit(next, 'companies', companyId, 'DELETE', company, null)
      })
    },
    removeManagedCollaborator(collaboratorId) {
      commit((current) => {
        const collaborator = current.collaborators.find((item) => item.id === collaboratorId)
        if (!collaborator) return current
        const next = {
          ...current,
          collaborators: current.collaborators.filter((item) => item.id !== collaboratorId),
          users: current.users.filter((user) => user.id !== collaborator.usuario_id),
        }
        return appendAudit(next, 'collaborators', collaboratorId, 'DELETE', collaborator, null)
      })
    },
    resetData() {
      setData(cloneSeed())
    },
  }), [data])

  return <AdminDataContext.Provider value={value}>{children}</AdminDataContext.Provider>
}

export function useAdminData(): AdminDataContextValue {
  const context = useContext(AdminDataContext)
  if (!context) throw new Error('useAdminData must be used within AdminDataProvider')
  return context
}
