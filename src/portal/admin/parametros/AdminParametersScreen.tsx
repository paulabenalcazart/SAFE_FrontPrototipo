import { useDeferredValue, useMemo, useState } from 'react'
import { Download, Edit3, History, Plus, RefreshCcw } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AdminDataTable, type AdminTableColumn } from '@/portal/admin/components/data/AdminDataTable'
import { AdminFilterBar } from '@/portal/admin/components/data/AdminFilterBar'
import { AdminSelectFilter } from '@/portal/admin/components/data/AdminSelectFilter'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'
import { AdminTabs } from '@/portal/admin/components/ui/AdminTabs'
import { downloadExcel } from '@/portal/admin/lib/exportExcel'
import { normalizeText, uniqueValues } from '@/portal/admin/lib/filtering'
import { displayValue, formatDate } from '@/portal/admin/lib/format'
import type { AdminData, AuditRecord, EntityRecord } from '@/portal/admin/types'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminParameterFormDialog } from './AdminParameterFormDialog'
import { getCollectionKey, getParameterRows } from './parameterUtils'
import { parameterGroups, type ColumnSchema, type ParameterEntityId, type ParameterEntitySchema } from './schemas'

type AreaId = 'tax' | 'indicators' | 'simulator' | 'catalogs'
type Area = { id: AreaId; label: string; description: string; entities: ParameterEntityId[] }

const areas: Area[] = [
  { id: 'tax', label: 'Tributarios', description: 'Obligaciones, normas, reglas de aplicabilidad y valores normativos.', entities: ['obligations', 'obligationRules', 'norms', 'normativeParams'] },
  { id: 'indicators', label: 'Indicadores', description: 'Conceptos financieros, fórmulas, indicadores y referencias por industria.', entities: ['financialConcepts', 'clusterConcepts', 'derivedMagnitudes', 'indicators', 'clusterIndicators', 'benchmarks'] },
  { id: 'simulator', label: 'Simulador', description: 'Escenarios, variables de entrada y resultados configurables.', entities: ['scenarios', 'scenarioVariables', 'scenarioResults'] },
  { id: 'catalogs', label: 'Otros catálogos', description: 'Catálogos maestros usados por reglas, perfiles y clasificaciones.', entities: ['industryClusters', 'economicActivities', 'corporateStructures', 'taxpayerTypes', 'professionalSpecialties'] },
]
const schemas = parameterGroups.flatMap((group) => group.entities)
const schemaById = (id: ParameterEntityId): ParameterEntitySchema => schemas.find((schema) => schema.id === id) ?? schemas[0]

function relationLabel(data: AdminData, relation: ParameterEntityId | 'modules' | undefined, id: unknown, labelKey = 'nombre') {
  if (!relation || !id) return '—'
  if (relation === 'modules') return data.modules.find((item) => item.codigo === id)?.nombre ?? String(id)
  const row = getParameterRows(data, relation).find((item) => item.id === id)
  return row ? String(row[labelKey] ?? row.codigo ?? row.id) : String(id)
}

function displayCell(row: EntityRecord, column: ColumnSchema, data: AdminData) {
  const value = row[column.key]
  const secondary = column.secondaryKey ? row[column.secondaryKey] : undefined
  if (column.type === 'status') return <AdminStatusBadge status={typeof value === 'boolean' ? (value ? 'ACTIVO' : 'INACTIVO') : String(value ?? '—')} />
  if (column.type === 'boolean') return value ? 'Sí' : 'No'
  if (column.type === 'date') return formatDate(String(value ?? ''))
  if (column.type === 'relation') return relationLabel(data, column.relationTo, value, column.labelKey)
  return secondary ? <div><strong>{displayValue(value)}</strong><small>{displayValue(secondary)}</small></div> : displayValue(value)
}

function saveNestedScenario(data: AdminData, entityId: 'scenarioVariables' | 'scenarioResults', record: EntityRecord, patchEntity: ReturnType<typeof useAdminData>['patchEntity']) {
  const scenarioId = String(record.escenario_id ?? '')
  const scenario = data.scenarios.find((item) => item.id === scenarioId)
  if (!scenario) return
  const field = entityId === 'scenarioVariables' ? 'variables' : 'results'
  const current = Array.isArray(scenario[field]) ? scenario[field] as EntityRecord[] : []
  const clean = { ...record }
  delete clean.escenario_id
  const next = current.some((item) => item.id === record.id)
    ? current.map((item) => item.id === record.id ? clean : item)
    : [clean, ...current]
  patchEntity('scenarios', scenarioId, { [field]: next })
}

export function AdminParametersScreen() {
  const { data, upsertEntity, patchEntity } = useAdminData()
  const [areaId, setAreaId] = useState<AreaId>('tax')
  const [entityByArea, setEntityByArea] = useState<Record<AreaId, ParameterEntityId>>({ tax: 'obligations', indicators: 'indicators', simulator: 'scenarios', catalogs: 'industryClusters' })
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [editing, setEditing] = useState<EntityRecord | null | undefined>()
  const [auditSearch, setAuditSearch] = useState('')
  const deferredAuditSearch = useDeferredValue(auditSearch)
  const [auditAction, setAuditAction] = useState('Todos')
  const [auditTable, setAuditTable] = useState('Todos')
  const area = areas.find((item) => item.id === areaId) ?? areas[0]
  const schema = schemaById(entityByArea[area.id])
  const rows = useMemo(() => {
    const query = normalizeText(deferredSearch)
    const source = getParameterRows(data, schema.id)
    return query ? source.filter((row) => schema.searchKeys.some((key) => normalizeText(row[key]).includes(query))) : source
  }, [data, deferredSearch, schema])
  const columns: AdminTableColumn<EntityRecord>[] = schema.columns.map((column) => ({ id: column.key, header: column.label, cell: (row) => displayCell(row, column, data) }))
  const relevantTables = useMemo(() => new Set(schemas.map((item) => getCollectionKey(item.id) ?? 'scenarios')), [])
  const auditRows = useMemo(() => data.audits.filter((audit) => {
    if (!relevantTables.has(audit.tabla_afectada as never)) return false
    const matchesSearch = !deferredAuditSearch || normalizeText(`${audit.tabla_afectada} ${audit.accion} ${audit.registro_id}`).includes(normalizeText(deferredAuditSearch))
    return matchesSearch && (auditAction === 'Todos' || audit.accion === auditAction) && (auditTable === 'Todos' || audit.tabla_afectada === auditTable)
  }), [auditAction, auditTable, data.audits, deferredAuditSearch, relevantTables])
  const auditColumns: AdminTableColumn<AuditRecord>[] = [
    { id: 'date', header: 'Fecha', cell: (row) => formatDate(row.created_at || AHORA_ADMIN, true) },
    { id: 'user', header: 'Usuario', cell: () => <div><strong>{data.admin.nombres} {data.admin.apellidos}</strong><small>Administrador SAFE</small></div> },
    { id: 'action', header: 'Cambio realizado', cell: (row) => <AdminStatusBadge status={row.accion} /> },
    { id: 'table', header: 'Entidad', cell: (row) => row.tabla_afectada.replace(/_/g, ' ') },
    { id: 'detail', header: 'Detalle', cell: (row) => <div><span>{row.registro_id}</span><small>{row.valores_nuevos ? Object.keys(row.valores_nuevos).slice(0, 3).join(' · ') : row.valores_anteriores ? `Eliminado: ${Object.keys(row.valores_anteriores).slice(0, 3).join(' · ')}` : 'Sin valores nuevos'}</small></div> },
  ]
  const selectEntity = (next: ParameterEntityId) => { setEntityByArea((current) => ({ ...current, [area.id]: next })); setSearch('') }
  const save = (record: EntityRecord) => {
    if (schema.id === 'scenarioVariables' || schema.id === 'scenarioResults') saveNestedScenario(data, schema.id, record, patchEntity)
    else { const key = getCollectionKey(schema.id); if (key) upsertEntity(key, record) }
    setEditing(undefined)
  }
  const exportRows = rows.map((row) => schema.columns.map((column) => column.type === 'relation' ? relationLabel(data, column.relationTo, row[column.key], column.labelKey) : displayValue(row[column.key])))
  return <><AdminPageHeader title="Parámetros normativos" description="Centraliza la configuración tributaria, financiera y de simulación que utiliza SAFE." /><AdminCard className="mt-5"><AdminTabs ariaLabel="Áreas de parámetros" value={areaId} onChange={(value) => { setAreaId(value); setSearch('') }} items={areas.map((item) => ({ value: item.id, label: item.label }))}><div className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2>{area.label}</h2><p>{area.description}</p></div><div className="flex items-center gap-2"><History aria-hidden="true" size={16} /><span>{area.entities.reduce((total, id) => total + getParameterRows(data, id).length, 0)} registros configurados</span></div></div><div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={`Catálogos de ${area.label}`}>{area.entities.map((id) => { const item = schemaById(id); return <AdminButton key={id} className="min-h-11" aria-pressed={id === schema.id} variant={id === schema.id ? 'primary' : 'ghost'} onClick={() => selectEntity(id)}>{item.title} ({getParameterRows(data, id).length})</AdminButton> })}</div><div className="mt-5 flex flex-wrap items-start justify-between gap-3"><div><h3>{schema.title}</h3><p>{schema.description}</p></div><AdminButton variant="primary" onClick={() => setEditing(null)}><Plus aria-hidden="true" size={15} />Nuevo</AdminButton></div><AdminFilterBar search={search} onSearch={setSearch} searchPlaceholder={`Buscar en ${schema.title.toLocaleLowerCase('es')}`} actions={<><AdminButton size="sm" variant="ghost" onClick={() => setSearch('')}><RefreshCcw aria-hidden="true" size={15} />Limpiar</AdminButton><AdminButton size="sm" onClick={() => downloadExcel(schema.title, schema.columns.map((column) => column.label), exportRows, `safe-${schema.id}`)}><Download aria-hidden="true" size={15} />Exportar Excel</AdminButton></>} /><AdminDataTable rows={rows} columns={columns} rowKey={(row) => row.id} caption={`${schema.title}: parámetros administrados`} pageSize={7} renderActions={(row) => <AdminButton size="icon" variant="ghost" onClick={() => setEditing(row)} aria-label={`Editar ${schema.singular}`}><Edit3 aria-hidden="true" size={16} /></AdminButton>} actionsLabel="Acciones" /></div></AdminTabs></AdminCard><section className="mt-6"><div><h2>Historial de modificaciones</h2><p>Consulta cambios auditados sobre parámetros y catálogos.</p></div><AdminCard className="mt-3"><AdminFilterBar search={auditSearch} onSearch={setAuditSearch} searchPlaceholder="Buscar cambio o registro"><AdminSelectFilter label="Acción" value={auditAction} options={['Todos', ...uniqueValues(data.audits, 'accion')]} onChange={setAuditAction} /><AdminSelectFilter label="Entidad" value={auditTable} options={['Todos', ...uniqueValues(data.audits.filter((audit) => relevantTables.has(audit.tabla_afectada as never)), 'tabla_afectada')]} onChange={setAuditTable} /></AdminFilterBar><AdminDataTable rows={auditRows} columns={auditColumns} rowKey={(row) => row.id} caption="Historial de modificaciones de parámetros" pageSize={6} /></AdminCard></section><AdminParameterFormDialog open={editing !== undefined} onClose={() => setEditing(undefined)} schema={schema} record={editing ?? null} data={data} onSave={save} /></>
}
