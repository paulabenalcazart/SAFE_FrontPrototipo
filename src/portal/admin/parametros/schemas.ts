export type ParameterGroupId = 'normative' | 'financial' | 'indicators' | 'simulator' | 'catalogs'
export type ParameterEntityId =
  | 'norms' | 'obligations' | 'obligationRules' | 'normativeParams'
  | 'financialConcepts' | 'clusterConcepts' | 'derivedMagnitudes'
  | 'indicators' | 'clusterIndicators' | 'benchmarks'
  | 'scenarios' | 'scenarioVariables' | 'scenarioResults'
  | 'industryClusters' | 'economicActivities' | 'corporateStructures' | 'taxpayerTypes' | 'professionalSpecialties'

export type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'url' | 'checkbox' | 'radio' | 'select' | 'multiselect' | 'json'
export type CellType = 'text' | 'status' | 'boolean' | 'date' | 'number' | 'relation' | 'json'

export function isRequiredParameterValueBlank(value: unknown): boolean {
  return value === null || value === undefined || (typeof value === 'string' && value.trim() === '')
}

export interface FormFieldSchema {
  key: string
  label: string
  type?: FieldType
  required?: boolean
  full?: boolean
  options?: string[]
  optionsFrom?: ParameterEntityId | 'modules'
  labelKey?: string
  nullable?: boolean
  defaultValue?: unknown
}

export interface ColumnSchema {
  key: string
  label: string
  type?: CellType
  relationTo?: ParameterEntityId | 'modules'
  labelKey?: string
  secondaryKey?: string
}

export interface ParameterEntitySchema {
  id: ParameterEntityId
  title: string
  singular: string
  description: string
  searchKeys: string[]
  columns: ColumnSchema[]
  fields: FormFieldSchema[]
}

export interface ParameterGroupSchema {
  id: ParameterGroupId
  label: string
  description: string
  entities: ParameterEntitySchema[]
}

const norms: ParameterEntitySchema = {
  id: 'norms', title: 'Normas legales', singular: 'norma legal', description: 'Fuentes legales que sustentan obligaciones y parámetros.', searchKeys: ['nombre','institucion','numero','tipo'],
  columns: [
    { key:'nombre', label:'Norma' }, { key:'tipo', label:'Tipo' }, { key:'institucion', label:'Institución' },
    { key:'numero', label:'Número' }, { key:'fecha_vigencia', label:'Vigencia', type:'date' }, { key:'estado', label:'Estado', type:'status' },
  ],
  fields: [
    { key:'nombre', label:'Nombre', required:true }, { key:'tipo', label:'Tipo', required:true }, { key:'institucion', label:'Institución', required:true },
    { key:'numero', label:'Número' }, { key:'url_fuente', label:'URL de fuente', type:'url', full:true },
    { key:'fecha_publicacion', label:'Fecha de publicación', type:'date' }, { key:'fecha_vigencia', label:'Fecha de vigencia', type:'date' },
    { key:'estado', label:'Estado', type:'select', options:['VIGENTE','DEROGADA','BORRADOR'], defaultValue:'VIGENTE' },
  ],
}

const obligations: ParameterEntitySchema = {
  id:'obligations', title:'Obligaciones', singular:'obligación', description:'Obligaciones tributarias, laborales, societarias y municipales.', searchKeys:['codigo','nombre','institucion','categoria'],
  columns:[
    {key:'codigo',label:'Código'}, {key:'nombre',label:'Obligación',secondaryKey:'descripcion'}, {key:'categoria',label:'Categoría'}, {key:'institucion',label:'Institución'},
    {key:'periodicidad',label:'Periodicidad'}, {key:'usa_noveno_digito',label:'Noveno dígito',type:'boolean'}, {key:'permite_monto_estimado',label:'Monto estimado',type:'boolean'}, {key:'activo',label:'Estado',type:'status'},
  ],
  fields:[
    {key:'codigo',label:'Código',required:true}, {key:'nombre',label:'Nombre',required:true}, {key:'categoria',label:'Categoría',type:'select',options:['TRIBUTARIA','LABORAL','SOCIETARIA','MUNICIPAL'],defaultValue:'TRIBUTARIA'},
    {key:'institucion',label:'Institución'}, {key:'periodicidad',label:'Periodicidad',type:'select',options:['MENSUAL','BIMESTRAL','TRIMESTRAL','SEMESTRAL','ANUAL','EVENTUAL'],defaultValue:'MENSUAL'},
    {key:'descripcion',label:'Descripción',type:'textarea',full:true}, {key:'usa_noveno_digito',label:'Usa noveno dígito',type:'checkbox'},
    {key:'permite_monto_estimado',label:'Permite monto estimado',type:'checkbox'}, {key:'activo',label:'Activo',type:'checkbox',defaultValue:true},
  ],
}

const obligationRules: ParameterEntitySchema = {
  id:'obligationRules', title:'Reglas de obligación', singular:'regla de obligación', description:'Criterios de aplicabilidad, fechas, montos y vigencias.', searchKeys:['nombre','descripcion','formula_fecha','formula_monto'],
  columns:[
    {key:'nombre',label:'Regla',secondaryKey:'descripcion'}, {key:'obligacion_id',label:'Obligación',type:'relation',relationTo:'obligations',labelKey:'nombre'},
    {key:'norma_legal_id',label:'Norma',type:'relation',relationTo:'norms',labelKey:'nombre'}, {key:'tipo_contribuyente_id',label:'Contribuyente',type:'relation',relationTo:'taxpayerTypes',labelKey:'nombre'},
    {key:'prioridad',label:'Prioridad',type:'number'}, {key:'vigente_desde',label:'Desde',type:'date'}, {key:'activo',label:'Estado',type:'status'},
  ],
  fields:[
    {key:'obligacion_id',label:'Obligación',type:'select',optionsFrom:'obligations',labelKey:'nombre',required:true}, {key:'norma_legal_id',label:'Norma legal',type:'select',optionsFrom:'norms',labelKey:'nombre',nullable:true},
    {key:'nombre',label:'Nombre',required:true}, {key:'descripcion',label:'Descripción',type:'textarea',full:true}, {key:'tipo_contribuyente_id',label:'Tipo de contribuyente',type:'select',optionsFrom:'taxpayerTypes',labelKey:'nombre',nullable:true},
    {key:'estructura_societaria_id',label:'Estructura societaria',type:'select',optionsFrom:'corporateStructures',labelKey:'nombre',nullable:true}, {key:'actividad_economica_id',label:'Actividad económica',type:'select',optionsFrom:'economicActivities',labelKey:'nombre',nullable:true},
    {key:'cluster_id',label:'Cluster',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',nullable:true}, {key:'tamano_empresa',label:'Tamaño de empresa',type:'select',options:['','MICRO','PEQUENA','MEDIANA','GRANDE'],nullable:true},
    {key:'noveno_digito_desde',label:'Noveno dígito desde',type:'number'}, {key:'noveno_digito_hasta',label:'Noveno dígito hasta',type:'number'}, {key:'requiere_contabilidad',label:'Requiere contabilidad',type:'checkbox'},
    {key:'requiere_declaracion_impuestos',label:'Requiere declaración de impuestos',type:'checkbox'}, {key:'formula_fecha',label:'Fórmula de fecha',type:'textarea',full:true}, {key:'formula_fecha_validada',label:'Fórmula de fecha validada',type:'checkbox'},
    {key:'formula_monto',label:'Fórmula de monto',type:'textarea',full:true}, {key:'formula_monto_validada',label:'Fórmula de monto validada',type:'checkbox'},
    {key:'prioridad',label:'Prioridad',type:'number',defaultValue:1}, {key:'vigente_desde',label:'Vigente desde',type:'date'}, {key:'vigente_hasta',label:'Vigente hasta',type:'date',nullable:true}, {key:'activo',label:'Activo',type:'checkbox',defaultValue:true},
  ],
}

const normativeParams: ParameterEntitySchema = {
  id:'normativeParams', title:'Parámetros normativos', singular:'parámetro normativo', description:'Tasas, valores y tablas que utilizan las reglas de cálculo.', searchKeys:['codigo','nombre','categoria','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Parámetro',secondaryKey:'descripcion'},{key:'categoria',label:'Categoría'},{key:'tipo_valor',label:'Tipo'},{key:'valor',label:'Valor',type:'json'},{key:'norma_legal_id',label:'Norma',type:'relation',relationTo:'norms',labelKey:'nombre'},{key:'vigente_desde',label:'Desde',type:'date'},{key:'activo',label:'Estado',type:'status'}],
  fields:[
    {key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'categoria',label:'Categoría',type:'select',options:['TRIBUTARIO','LABORAL','SOCIETARIO','MUNICIPAL'],required:true},{key:'tipo_valor',label:'Tipo de valor',type:'select',options:['NUMERO','PORCENTAJE','MONTO','TEXTO','TABLA'],defaultValue:'NUMERO'},
    {key:'valor',label:'Valor',type:'json',full:true},{key:'unidad',label:'Unidad'},{key:'norma_legal_id',label:'Norma legal',type:'select',optionsFrom:'norms',labelKey:'nombre',nullable:true},{key:'fuente',label:'Fuente',full:true},
    {key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'vigente_desde',label:'Vigente desde',type:'date'},{key:'vigente_hasta',label:'Vigente hasta',type:'date',nullable:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true},
  ],
}

const financialConcepts: ParameterEntitySchema = {
  id:'financialConcepts', title:'Conceptos financieros', singular:'concepto financiero', description:'Campos que estructuran las cargas y validaciones financieras.', searchKeys:['codigo','nombre','bloque','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Concepto',secondaryKey:'descripcion'},{key:'bloque',label:'Bloque'},{key:'tipo_dato',label:'Tipo'},{key:'unidad',label:'Unidad'},{key:'obligatorio',label:'Obligatorio',type:'boolean'},{key:'orden_visualizacion',label:'Orden',type:'number'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'bloque',label:'Bloque',required:true},{key:'tipo_dato',label:'Tipo de dato',type:'select',options:['NUMERICO','TEXTO','PORCENTAJE','ENTERO'],defaultValue:'MONEDA'},{key:'unidad',label:'Unidad'},{key:'es_universal',label:'Universal',type:'checkbox'},{key:'obligatorio',label:'Obligatorio',type:'checkbox'},{key:'orden_visualizacion',label:'Orden de visualización',type:'number'},{key:'regla_validacion',label:'Regla de validación',type:'json',full:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const clusterConcepts: ParameterEntitySchema = {
  id:'clusterConcepts', title:'Conceptos por cluster', singular:'concepto por cluster', description:'Activa conceptos financieros para cada segmento de industria.', searchKeys:['id'],
  columns:[{key:'cluster_id',label:'Cluster',type:'relation',relationTo:'industryClusters',labelKey:'nombre'},{key:'concepto_financiero_id',label:'Concepto',type:'relation',relationTo:'financialConcepts',labelKey:'nombre'},{key:'obligatorio',label:'Obligatorio',type:'boolean'}],
  fields:[{key:'cluster_id',label:'Cluster',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',required:true},{key:'concepto_financiero_id',label:'Concepto financiero',type:'select',optionsFrom:'financialConcepts',labelKey:'nombre',required:true},{key:'obligatorio',label:'Obligatorio',type:'checkbox'}],
}

const derivedMagnitudes: ParameterEntitySchema = {
  id:'derivedMagnitudes', title:'Magnitudes derivadas', singular:'magnitud derivada', description:'Fórmulas derivadas utilizadas por indicadores y diagnósticos.', searchKeys:['codigo','nombre','descripcion','expresion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Magnitud',secondaryKey:'descripcion'},{key:'cluster_id',label:'Cluster',type:'relation',relationTo:'industryClusters',labelKey:'nombre'},{key:'version',label:'Versión'},{key:'formula_validada',label:'Validación',type:'boolean'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'cluster_id',label:'Cluster',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',nullable:true},{key:'expresion',label:'Expresión',type:'textarea',full:true,required:true},{key:'version',label:'Versión',required:true},{key:'formula_validada',label:'Fórmula validada',type:'checkbox'},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const indicators: ParameterEntitySchema = {
  id:'indicators', title:'Indicadores', singular:'indicador', description:'Indicadores financieros y pesos utilizados en diagnóstico.', searchKeys:['codigo','nombre','descripcion','interpretacion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Indicador',secondaryKey:'descripcion'},{key:'unidad',label:'Unidad'},{key:'fase',label:'Fase'},{key:'version_formula',label:'Versión'},{key:'peso_salud_financiera',label:'Peso',type:'number'},{key:'formula_validada',label:'Validación',type:'boolean'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'formula',label:'Fórmula',type:'textarea',full:true,required:true},{key:'formula_validada',label:'Fórmula validada',type:'checkbox'},{key:'unidad',label:'Unidad'},{key:'factor',label:'Factor',type:'select',options:['LIQUIDEZ','SOLVENCIA','GESTION','RENTABILIDAD'],required:true},{key:'fase',label:'Fase'},{key:'version_formula',label:'Versión de fórmula'},{key:'interpretacion',label:'Interpretación',type:'textarea',full:true},{key:'peso_salud_financiera',label:'Peso salud financiera',type:'number'},{key:'fuente',label:'Fuente'},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const clusterIndicators: ParameterEntitySchema = {
  id:'clusterIndicators', title:'Indicadores por cluster', singular:'indicador por cluster', description:'Define indicadores principales y activos según industria.', searchKeys:['id'],
  columns:[{key:'cluster_id',label:'Cluster',type:'relation',relationTo:'industryClusters',labelKey:'nombre'},{key:'indicador_id',label:'Indicador',type:'relation',relationTo:'indicators',labelKey:'nombre'},{key:'es_principal',label:'Principal',type:'boolean'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'cluster_id',label:'Cluster',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',required:true},{key:'indicador_id',label:'Indicador',type:'select',optionsFrom:'indicators',labelKey:'nombre',required:true},{key:'es_principal',label:'Es principal',type:'checkbox'},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const benchmarks: ParameterEntitySchema = {
  id:'benchmarks', title:'Benchmarks', singular:'benchmark', description:'Percentiles de referencia para comparar desempeño por cluster y tamaño.', searchKeys:['fuente','periodo_referencia','banda_tamano'],
  columns:[{key:'cluster_id',label:'Cluster',type:'relation',relationTo:'industryClusters',labelKey:'nombre'},{key:'indicador_id',label:'Indicador',type:'relation',relationTo:'indicators',labelKey:'nombre'},{key:'banda_tamano',label:'Tamaño'},{key:'periodo_referencia',label:'Periodo'},{key:'percentil_50',label:'P50',type:'number'},{key:'cantidad_muestra',label:'Muestra',type:'number'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'cluster_id',label:'Cluster',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',required:true},{key:'indicador_id',label:'Indicador',type:'select',optionsFrom:'indicators',labelKey:'nombre',required:true},{key:'banda_tamano',label:'Banda de tamaño',required:true},{key:'periodo_referencia',label:'Periodo de referencia',type:'date',required:true},{key:'percentil_10',label:'Percentil 10',type:'number'},{key:'percentil_25',label:'Percentil 25',type:'number'},{key:'percentil_50',label:'Percentil 50',type:'number'},{key:'percentil_75',label:'Percentil 75',type:'number'},{key:'percentil_90',label:'Percentil 90',type:'number'},{key:'cantidad_muestra',label:'Cantidad de muestra',type:'number'},{key:'fuente',label:'Fuente',full:true},{key:'vigente_desde',label:'Vigente desde',type:'date'},{key:'vigente_hasta',label:'Vigente hasta',type:'date',nullable:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const scenarios: ParameterEntitySchema = {
  id:'scenarios', title:'Escenarios', singular:'escenario', description:'Escenarios disponibles para simulaciones empresariales.', searchKeys:['codigo','nombre','categoria','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Escenario',secondaryKey:'descripcion'},{key:'categoria',label:'Categoría'},{key:'variableCount',label:'Variables',type:'number'},{key:'resultCount',label:'Resultados',type:'number'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'categoria',label:'Categoría',type:'select',options:['FINANCIERO','TRIBUTARIO','LABORAL','SOCIETARIO'],required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const scenarioVariables: ParameterEntitySchema = {
  id:'scenarioVariables', title:'Variables de escenario', singular:'variable de escenario', description:'Variables de entrada definidas por cada escenario.', searchKeys:['codigo','nombre','tipo_dato'],
  columns:[{key:'escenario_id',label:'Escenario',type:'relation',relationTo:'scenarios',labelKey:'nombre'},{key:'codigo',label:'Código'},{key:'nombre',label:'Variable'},{key:'tipo_dato',label:'Tipo'},{key:'unidad',label:'Unidad'},{key:'obligatoria',label:'Requerida',type:'boolean'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'escenario_id',label:'Escenario',type:'select',optionsFrom:'scenarios',labelKey:'nombre',required:true},{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'tipo_dato',label:'Tipo de dato',type:'select',options:['NUMERO','PORCENTAJE','MONEDA','FECHA','TEXTO','BOOLEANO'],defaultValue:'NUMERO'},{key:'unidad',label:'Unidad'},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'valor_minimo',label:'Valor mínimo',type:'number'},{key:'valor_maximo',label:'Valor máximo',type:'number'},{key:'orden_visualizacion',label:'Orden',type:'number'},{key:'obligatoria',label:'Requerida',type:'checkbox',defaultValue:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const scenarioResults: ParameterEntitySchema = {
  id:'scenarioResults', title:'Resultados de escenario', singular:'resultado de escenario', description:'Resultados calculados y presentados al finalizar una simulación.', searchKeys:['codigo','nombre','tipo_resultado'],
  columns:[{key:'escenario_id',label:'Escenario',type:'relation',relationTo:'scenarios',labelKey:'nombre'},{key:'codigo',label:'Código'},{key:'nombre',label:'Resultado'},{key:'tipo_resultado',label:'Tipo'},{key:'unidad',label:'Unidad'},{key:'orden_visualizacion',label:'Orden',type:'number'},{key:'formula_validada',label:'Validación',type:'boolean'}],
  fields:[{key:'escenario_id',label:'Escenario',type:'select',optionsFrom:'scenarios',labelKey:'nombre',required:true},{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'tipo_resultado',label:'Tipo de resultado',type:'select',options:['NUMERO','MONEDA','PORCENTAJE','TEXTO'],defaultValue:'NUMERO'},{key:'unidad',label:'Unidad'},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'formula',label:'Fórmula',type:'textarea',full:true},{key:'formula_validada',label:'Fórmula validada',type:'checkbox'},{key:'orden_visualizacion',label:'Orden',type:'number'},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const industryClusters: ParameterEntitySchema = {
  id:'industryClusters', title:'Clusters de industria', singular:'cluster de industria', description:'Segmentos sectoriales utilizados por benchmarks, conceptos e indicadores.', searchKeys:['codigo','nombre','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Cluster',secondaryKey:'descripcion'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const economicActivities: ParameterEntitySchema = {
  id:'economicActivities', title:'Actividades económicas', singular:'actividad económica', description:'Catálogo CIIU y asociación predeterminada con clusters.', searchKeys:['codigo_ciiu','nombre','sector','categoria'],
  columns:[{key:'codigo_ciiu',label:'CIIU'},{key:'nombre',label:'Actividad',secondaryKey:'descripcion'},{key:'sector',label:'Sector'},{key:'categoria',label:'Categoría'},{key:'cluster_predeterminado_id',label:'Cluster',type:'relation',relationTo:'industryClusters',labelKey:'nombre'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo_ciiu',label:'Código CIIU',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'sector',label:'Sector'},{key:'categoria',label:'Categoría'},{key:'cluster_predeterminado_id',label:'Cluster predeterminado',type:'select',optionsFrom:'industryClusters',labelKey:'nombre',nullable:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const corporateStructures: ParameterEntitySchema = {
  id:'corporateStructures', title:'Estructuras societarias', singular:'estructura societaria', description:'Formas jurídicas utilizadas en reglas de aplicabilidad.', searchKeys:['codigo','nombre','tipo_persona','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Estructura',secondaryKey:'descripcion'},{key:'tipo_persona',label:'Tipo de persona'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'tipo_persona',label:'Tipo de persona',type:'select',options:['NATURAL','JURIDICA']},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const taxpayerTypes: ParameterEntitySchema = {
  id:'taxpayerTypes', title:'Tipos de contribuyente', singular:'tipo de contribuyente', description:'Regímenes y obligaciones estructuradas por tipo de contribuyente.', searchKeys:['codigo','nombre','regimen_tributario','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Contribuyente',secondaryKey:'descripcion'},{key:'tipo_persona',label:'Persona'},{key:'regimen_tributario',label:'Régimen'},{key:'periodicidad_iva',label:'IVA'},{key:'obligado_contabilidad',label:'Contabilidad',type:'boolean'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'tipo_persona',label:'Tipo de persona',type:'select',options:['NATURAL','JURIDICA']},{key:'regimen_tributario',label:'Régimen tributario'},{key:'periodicidad_iva',label:'Periodicidad IVA',type:'select',options:['NO_APLICA','MENSUAL','SEMESTRAL','ANUAL']},{key:'obligado_contabilidad',label:'Obligado a llevar contabilidad',type:'checkbox'},{key:'declara_iva',label:'Declara IVA',type:'checkbox'},{key:'declara_renta',label:'Declara renta',type:'checkbox'},{key:'emite_factura',label:'Emite factura',type:'checkbox'},{key:'agente_retencion',label:'Agente de retención',type:'checkbox'},{key:'contribuyente_especial',label:'Contribuyente especial',type:'checkbox'},{key:'gran_contribuyente',label:'Gran contribuyente',type:'checkbox'},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

const professionalSpecialties: ParameterEntitySchema = {
  id:'professionalSpecialties', title:'Especialidades profesionales', singular:'especialidad profesional', description:'Especialidades habilitadas para perfiles y postulaciones profesionales.', searchKeys:['codigo','nombre','categoria','descripcion'],
  columns:[{key:'codigo',label:'Código'},{key:'nombre',label:'Especialidad',secondaryKey:'descripcion'},{key:'categoria',label:'Categoría'},{key:'activo',label:'Estado',type:'status'}],
  fields:[{key:'codigo',label:'Código',required:true},{key:'nombre',label:'Nombre',required:true},{key:'categoria',label:'Categoría'},{key:'descripcion',label:'Descripción',type:'textarea',full:true},{key:'activo',label:'Activo',type:'checkbox',defaultValue:true}],
}

export const parameterGroups: ParameterGroupSchema[] = [
  { id:'normative', label:'Normativa', description:'Obligaciones, reglas, normas y valores normativos.', entities:[norms, obligations, obligationRules, normativeParams] },
  { id:'financial', label:'Motor financiero', description:'Conceptos y fórmulas que estructuran la información financiera.', entities:[financialConcepts, clusterConcepts, derivedMagnitudes] },
  { id:'indicators', label:'Indicadores y benchmarks', description:'Indicadores, configuración por industria y referencias comparativas.', entities:[indicators, clusterIndicators, benchmarks] },
  { id:'simulator', label:'Simulador', description:'Escenarios, variables de entrada y resultados calculados.', entities:[scenarios, scenarioVariables, scenarioResults] },
  { id:'catalogs', label:'Catálogos base', description:'Catálogos maestros utilizados por reglas y relaciones del sistema.', entities:[industryClusters, economicActivities, corporateStructures, taxpayerTypes, professionalSpecialties] },
]
