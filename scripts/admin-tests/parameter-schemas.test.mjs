import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { importTs } from './helpers.mjs'

const root = path.resolve(import.meta.dirname, '../..')
const source = (relativePath) => fs.readFile(path.join(root, relativePath), 'utf8')

test('parameter schemas retain the 18 SAFE SQL entities and four visible areas', async () => {
  const { parameterGroups } = await importTs('src/portal/admin/parametros/schemas.ts')
  const ids = parameterGroups.flatMap((group) => group.entities.map((entity) => entity.id))
  assert.deepEqual(ids, ['norms','obligations','obligationRules','normativeParams','financialConcepts','clusterConcepts','derivedMagnitudes','indicators','clusterIndicators','benchmarks','scenarios','scenarioVariables','scenarioResults','industryClusters','economicActivities','corporateStructures','taxpayerTypes','professionalSpecialties'])
  assert.equal(parameterGroups.length, 5)
})

test('parameter utilities flatten scenario children without mutating source rows', async () => {
  const { getParameterRows, getCollectionKey } = await importTs('src/portal/admin/parametros/parameterUtils.ts')
  const variable = { id: 'var-1', codigo: 'VENTAS' }
  const result = { id: 'res-1', codigo: 'MARGEN' }
  const scenario = { id: 'sce-1', nombre: 'Base', variables: [variable], results: [result] }
  const data = { scenarios: [scenario], norms: [{ id: 'norm-1' }] }
  assert.deepEqual(getParameterRows(data, 'scenarioVariables'), [{ id: 'var-1', codigo: 'VENTAS', escenario_id: 'sce-1' }])
  assert.deepEqual(getParameterRows(data, 'scenarioResults'), [{ id: 'res-1', codigo: 'MARGEN', escenario_id: 'sce-1' }])
  assert.deepEqual(getParameterRows(data, 'scenarios')[0], { ...scenario, variableCount: 1, resultCount: 1 })
  assert.deepEqual(variable, { id: 'var-1', codigo: 'VENTAS' })
  assert.equal(getCollectionKey('scenarioVariables'), null)
  assert.equal(getCollectionKey('scenarioResults'), null)
  assert.equal(getCollectionKey('norms'), 'norms')
})

test('parameter form renders relations, JSON and field-level validation accessibly', async () => {
  const dialog = await source('src/portal/admin/parametros/AdminParameterFormDialog.tsx')
  for (const token of ['relationOptions', 'getParameterRows(data', 'field.optionsFrom', "field.type === 'json'", "field.type === 'radio'", "field.type === 'multiselect'", 'multiple', 'aria-checked', '<textarea', 'JSON.parse', 'Number.isFinite', 'crypto.randomUUID()', 'AHORA_ADMIN', 'role="alert"', 'aria-describedby', 'htmlFor={id}']) assert.match(dialog, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(dialog, /Date\.now|new Date|replaceAll|style=|localStorage|sessionStorage/)
})

test('parameter screen keeps filtered export, nested scenario writes and audit history', async () => {
  const screen = await source('src/portal/admin/parametros/AdminParametersScreen.tsx')
  for (const token of ['useAdminData', 'useDeferredValue', 'AdminTabs', 'AdminDataTable', 'AdminFilterBar', 'AdminSelectFilter', 'downloadExcel', 'getParameterRows', 'getCollectionKey', 'patchEntity', "patchEntity('scenarios'", "upsertEntity(key", 'data.audits', 'tabla_afectada', 'valores_anteriores', 'valores_nuevos', 'formatDate', 'AHORA_ADMIN', 'pageSize={7}', 'pageSize={6}', 'caption=', 'actionsLabel="Acciones"']) assert.match(screen, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(screen, /upsertEntity\('audits'|Date\.now|new Date|replaceAll|gridTemplateColumns|localStorage|sessionStorage/)
})

test('plans expose complete validated CRUD, metrics, details and read-only RBAC', async () => {
  const [screen, dialog] = await Promise.all([source('src/portal/admin/planes/AdminPlansScreen.tsx'), source('src/portal/admin/planes/AdminPlanDialog.tsx')])
  for (const token of ['summarizePlans', 'formatMoney', 'formatDate', 'downloadExcel', 'AdminKpiCard', 'AdminDataTable', 'AdminDialog', "'plans'", "'usage'", "'permissions'", 'Última actualización', 'Módulos configurables', 'Ver plan', 'Ilimitad', 'Object.entries(viewing.limits)', "if (plan.users > 0)", "removeEntity('plans'", 'USUARIO_EMPRESA', 'COLABORADOR', 'ADMINISTRADOR', 'admin.auditoria', 'data.modules']) assert.match(screen, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  for (const token of ['existingPlans', 'data.modules', 'crypto.randomUUID()', 'AHORA_ADMIN', 'Number.isFinite', 'precio_mensual', 'dias_prueba', 'orden_visualizacion', 'nivel_soporte', 'renovacion_automatica_default', 'modules', 'limits', 'CONTACTOS_MENSUALES', 'INFORMES_MENSUALES', 'aria-pressed', 'min-h-11', 'htmlFor=', 'role="alert"']) assert.match(dialog, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  assert.doesNotMatch(`${screen}\n${dialog}`, /Date\.now|new Date|replaceAll|style=|localStorage|sessionStorage/)
})
