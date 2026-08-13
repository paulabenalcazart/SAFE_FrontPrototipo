import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'

const requiredCollections = ['users', 'companies', 'collaborators', 'applications', 'plans', 'obligations', 'obligationRules', 'norms', 'normativeParams', 'financialConcepts', 'clusterConcepts', 'derivedMagnitudes', 'indicators', 'clusterIndicators', 'benchmarks', 'scenarios', 'communications', 'securityAlerts', 'incidents', 'logs', 'audits', 'tutorials', 'emailTemplates', 'settings']

async function readSeed() {
  return JSON.parse(await fs.readFile('src/portal/admin/data/semilla.json', 'utf8'))
}

test('seed exposes every administrator collection and exact demo identity', async () => {
  const seed = await readSeed()
  for (const key of requiredCollections) assert.ok(key in seed, `missing ${key}`)
  assert.deepEqual(seed.admin, { id: 'usr-admin-001', nombres: 'Emilio', apellidos: 'Pino', correo: 'admin@safe-demo.ec', iniciales: 'EP', role: 'ADMINISTRADOR' })
})

test('seed collection IDs are unique and references resolve', async () => {
  const seed = await readSeed()
  for (const key of requiredCollections) {
    if (!Array.isArray(seed[key])) continue
    const ids = seed[key].map((record) => record.id).filter(Boolean)
    assert.equal(new Set(ids).size, ids.length, `${key} contains duplicate IDs`)
  }
  const userIds = new Set(seed.users.map((user) => user.id))
  const applicationIds = new Set(seed.applications.map((application) => application.id))
  for (const company of seed.companies) assert.ok(userIds.has(company.usuario_id), `company ${company.id} owner missing`)
  for (const collaborator of seed.collaborators) {
    assert.ok(userIds.has(collaborator.usuario_id), `collaborator ${collaborator.id} user missing`)
    assert.ok(applicationIds.has(collaborator.postulacion_id), `collaborator ${collaborator.id} application missing`)
  }
})
