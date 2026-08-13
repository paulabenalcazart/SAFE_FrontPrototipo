import test from 'node:test'
import assert from 'node:assert/strict'
import { importTs } from './helpers.mjs'

test('parameter schemas retain the 18 SAFE SQL entities and four visible areas', async () => {
  const { parameterGroups } = await importTs('src/portal/admin/parametros/schemas.ts')
  const ids = parameterGroups.flatMap((group) => group.entities.map((entity) => entity.id))
  assert.deepEqual(ids, ['obligations','obligationRules','norms','normativeParams','financialConcepts','clusterConcepts','derivedMagnitudes','indicators','clusterIndicators','benchmarks','scenarios','scenarioVariables','scenarioResults','industryClusters','economicActivities','corporateStructures','taxpayerTypes','professionalSpecialties'])
  assert.deepEqual(parameterGroups.map((group) => group.label), ['Tributarios', 'Indicadores', 'Simulador', 'Otros catálogos'])
})
