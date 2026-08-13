import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'

const source = fs.readFileSync(path.join(process.cwd(), 'src/portal/admin/parametros/schemas.ts'), 'utf8')
const requiredFields = {
  norms:['nombre','tipo','institucion','numero','url_fuente','fecha_publicacion','fecha_vigencia','estado'],
  obligations:['codigo','nombre','descripcion','categoria','institucion','periodicidad','usa_noveno_digito','permite_monto_estimado','activo'],
  obligationRules:['obligacion_id','norma_legal_id','nombre','descripcion','tipo_contribuyente_id','estructura_societaria_id','actividad_economica_id','cluster_id','tamano_empresa','requiere_contabilidad','requiere_declaracion_impuestos','noveno_digito_desde','noveno_digito_hasta','formula_fecha','formula_fecha_validada','formula_monto','formula_monto_validada','prioridad','vigente_desde','vigente_hasta','activo'],
  normativeParams:['norma_legal_id','codigo','nombre','categoria','descripcion','tipo_valor','valor','unidad','fuente','vigente_desde','vigente_hasta','activo'],
  financialConcepts:['codigo','nombre','bloque','descripcion','tipo_dato','unidad','es_universal','obligatorio','regla_validacion','orden_visualizacion','activo'],
  clusterConcepts:['cluster_id','concepto_financiero_id','obligatorio'],
  derivedMagnitudes:['cluster_id','codigo','nombre','expresion','version','formula_validada','descripcion','activo'],
  indicators:['codigo','factor','nombre','descripcion','formula','formula_validada','interpretacion','unidad','fuente','fase','version_formula','peso_salud_financiera','activo'],
  clusterIndicators:['cluster_id','indicador_id','es_principal','activo'],
  benchmarks:['indicador_id','cluster_id','banda_tamano','periodo_referencia','fuente','percentil_10','percentil_25','percentil_50','percentil_75','percentil_90','cantidad_muestra','vigente_desde','vigente_hasta','activo'],
  scenarios:['codigo','nombre','categoria','descripcion','activo'],
  scenarioVariables:['escenario_id','codigo','nombre','descripcion','tipo_dato','unidad','valor_minimo','valor_maximo','obligatoria','orden_visualizacion','activo'],
  scenarioResults:['escenario_id','codigo','nombre','descripcion','formula','formula_validada','tipo_resultado','unidad','orden_visualizacion','activo'],
  industryClusters:['codigo','nombre','descripcion','activo'],
  economicActivities:['cluster_predeterminado_id','codigo_ciiu','nombre','descripcion','sector','categoria','activo'],
  corporateStructures:['codigo','nombre','descripcion','tipo_persona','activo'],
  taxpayerTypes:['codigo','nombre','descripcion','tipo_persona','regimen_tributario','obligado_contabilidad','contribuyente_especial','agente_retencion','gran_contribuyente','declara_iva','periodicidad_iva','declara_renta','emite_factura','activo'],
  professionalSpecialties:['codigo','nombre','categoria','descripcion','activo'],
}

function entityBlock(id) {
  const match = source.match(new RegExp(`const ${id}: ParameterEntitySchema = \\{([\\s\\S]*?)(?=\\nconst |\\nexport const parameterGroups)`))
  assert.ok(match, `No se encontró el esquema explícito ${id}`)
  const fieldsIndex = match[1].indexOf('fields:')
  assert.ok(fieldsIndex >= 0, `No se encontraron campos para ${id}`)
  return match[1].slice(fieldsIndex)
}

test('parameter form schemas retain every business field from the SAFE SQL model', () => {
  for (const [entity, fields] of Object.entries(requiredFields)) {
    const block = entityBlock(entity)
    for (const field of fields) assert.match(block, new RegExp(`key:\\s*['"]${field}['"]`), `${entity}.${field}`)
  }
})
