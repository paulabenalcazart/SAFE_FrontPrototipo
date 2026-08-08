import type {
  FactorIndicador,
  IndicadorCalculado,
  RegistroFinanciero,
  SaludFinanciera,
  SemaforoIndicador,
} from '@/portal/types'
import { formatPorcentaje } from './formato'

function div(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

export function activoCorriente(r: RegistroFinanciero): number {
  return r.efectivoEquivalentes + r.cuentasPorCobrar + r.inventarios + r.otrosActivosCorrientes
}

export function activoNoCorriente(r: RegistroFinanciero): number {
  return r.activoFijoNeto + r.otrosActivosNoCorrientes
}

export function activoTotal(r: RegistroFinanciero): number {
  return activoCorriente(r) + activoNoCorriente(r)
}

export function pasivoCorriente(r: RegistroFinanciero): number {
  return r.cuentasPorPagar + r.deudaCortoPlazo + r.otrosPasivosCorrientes
}

export function pasivoNoCorriente(r: RegistroFinanciero): number {
  return r.deudaLargoPlazo + r.otrosPasivosNoCorrientes
}

export function pasivoTotal(r: RegistroFinanciero): number {
  return pasivoCorriente(r) + pasivoNoCorriente(r)
}

export function patrimonio(r: RegistroFinanciero): number {
  return r.capitalSocial + r.resultadosAcumulados
}

export function utilidadBruta(r: RegistroFinanciero): number {
  return r.ingresosOperacionales - r.costoVentas
}

export function utilidadOperacional(r: RegistroFinanciero): number {
  return utilidadBruta(r) - r.gastosAdministracion - r.gastosVentas - r.otrosGastosOperacionales
}

export function uaii(r: RegistroFinanciero): number {
  return utilidadOperacional(r)
}

export function uai(r: RegistroFinanciero): number {
  return uaii(r) + r.otrosIngresos - r.gastosFinancieros
}

export function utilidadNeta(r: RegistroFinanciero): number {
  return uai(r) - r.impuestoRenta
}

export function gastosTotales(r: RegistroFinanciero): number {
  return (
    r.costoVentas +
    r.gastosAdministracion +
    r.gastosVentas +
    r.otrosGastosOperacionales +
    r.gastosFinancieros +
    r.impuestoRenta
  )
}

export function descuadreBalance(r: RegistroFinanciero): number {
  return activoTotal(r) - (pasivoTotal(r) + patrimonio(r))
}

export function balanceCuadrado(r: RegistroFinanciero): boolean {
  return Math.abs(descuadreBalance(r)) < 0.01
}

type DefinicionIndicador = {
  codigo: string
  factor: FactorIndicador
  nombre: string
  unidad: IndicadorCalculado['unidad']
  calcular: (r: RegistroFinanciero) => number
  bueno: number
  regular: number
  mejorSiMayor: boolean
}

const CATALOGO_INDICADORES: DefinicionIndicador[] = [
  // Liquidez
  { codigo: 'LIQ_01', factor: 'LIQUIDEZ', nombre: 'Liquidez corriente', unidad: 'RATIO', calcular: (r) => div(activoCorriente(r), pasivoCorriente(r)), bueno: 1.5, regular: 1.0, mejorSiMayor: true },
  { codigo: 'LIQ_02', factor: 'LIQUIDEZ', nombre: 'Prueba ácida', unidad: 'RATIO', calcular: (r) => div(activoCorriente(r) - r.inventarios, pasivoCorriente(r)), bueno: 1.0, regular: 0.7, mejorSiMayor: true },
  // Solvencia (MVP: SOL_01 a SOL_07; SOL_08-12 quedan marcados FASE_2 en el dump y fuera de esta fase)
  { codigo: 'SOL_01', factor: 'SOLVENCIA', nombre: 'Endeudamiento del activo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoTotal(r), activoTotal(r)), bueno: 0.4, regular: 0.6, mejorSiMayor: false },
  { codigo: 'SOL_02', factor: 'SOLVENCIA', nombre: 'Endeudamiento patrimonial', unidad: 'RATIO', calcular: (r) => div(pasivoTotal(r), patrimonio(r)), bueno: 1.0, regular: 2.0, mejorSiMayor: false },
  { codigo: 'SOL_03', factor: 'SOLVENCIA', nombre: 'Endeudamiento del activo fijo', unidad: 'RATIO', calcular: (r) => div(patrimonio(r), r.activoFijoNeto), bueno: 1.0, regular: 0.75, mejorSiMayor: true },
  { codigo: 'SOL_04', factor: 'SOLVENCIA', nombre: 'Endeudamiento a corto plazo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoCorriente(r), pasivoTotal(r)), bueno: 0.5, regular: 0.7, mejorSiMayor: false },
  { codigo: 'SOL_05', factor: 'SOLVENCIA', nombre: 'Endeudamiento a largo plazo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoNoCorriente(r), pasivoTotal(r)), bueno: 0.5, regular: 0.3, mejorSiMayor: true },
  { codigo: 'SOL_06', factor: 'SOLVENCIA', nombre: 'Cobertura de intereses', unidad: 'RATIO', calcular: (r) => div(utilidadOperacional(r), r.gastosFinancieros), bueno: 3, regular: 1.5, mejorSiMayor: true },
  { codigo: 'SOL_07', factor: 'SOLVENCIA', nombre: 'Apalancamiento', unidad: 'RATIO', calcular: (r) => div(activoTotal(r), patrimonio(r)), bueno: 1.5, regular: 2.5, mejorSiMayor: false },
  // Gestión (MVP: GES_01-04, 06, 07; GES_05 queda marcado FASE_2 en el dump)
  { codigo: 'GES_01', factor: 'GESTION', nombre: 'Rotación de cartera', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, r.cuentasPorCobrar), bueno: 8, regular: 4, mejorSiMayor: true },
  { codigo: 'GES_02', factor: 'GESTION', nombre: 'Rotación de activo fijo', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, r.activoFijoNeto), bueno: 2, regular: 1, mejorSiMayor: true },
  { codigo: 'GES_03', factor: 'GESTION', nombre: 'Rotación de ventas', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, activoTotal(r)), bueno: 1, regular: 0.5, mejorSiMayor: true },
  { codigo: 'GES_04', factor: 'GESTION', nombre: 'Periodo medio de cobranza', unidad: 'DIAS', calcular: (r) => div(r.cuentasPorCobrar * 365, r.ingresosOperacionales), bueno: 30, regular: 60, mejorSiMayor: false },
  { codigo: 'GES_06', factor: 'GESTION', nombre: 'Impacto de gastos de administración y ventas', unidad: 'PORCENTAJE', calcular: (r) => div(r.gastosAdministracion + r.gastosVentas, r.ingresosOperacionales), bueno: 0.2, regular: 0.35, mejorSiMayor: false },
  { codigo: 'GES_07', factor: 'GESTION', nombre: 'Impacto de la carga financiera', unidad: 'PORCENTAJE', calcular: (r) => div(r.gastosFinancieros, r.ingresosOperacionales), bueno: 0.05, regular: 0.1, mejorSiMayor: false },
  // Rentabilidad (MVP: REN_01-05, 07-09; REN_06 queda marcado FASE_2 en el dump)
  { codigo: 'REN_01', factor: 'RENTABILIDAD', nombre: 'Rentabilidad neta del activo', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), activoTotal(r)), bueno: 0.08, regular: 0.03, mejorSiMayor: true },
  { codigo: 'REN_02', factor: 'RENTABILIDAD', nombre: 'Margen bruto', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadBruta(r), r.ingresosOperacionales), bueno: 0.35, regular: 0.2, mejorSiMayor: true },
  { codigo: 'REN_03', factor: 'RENTABILIDAD', nombre: 'Margen operacional', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), r.ingresosOperacionales), bueno: 0.15, regular: 0.05, mejorSiMayor: true },
  { codigo: 'REN_04', factor: 'RENTABILIDAD', nombre: 'Rentabilidad neta de ventas', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), r.ingresosOperacionales), bueno: 0.1, regular: 0.04, mejorSiMayor: true },
  { codigo: 'REN_05', factor: 'RENTABILIDAD', nombre: 'Rentabilidad operacional del patrimonio', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), patrimonio(r)), bueno: 0.15, regular: 0.05, mejorSiMayor: true },
  { codigo: 'REN_07', factor: 'RENTABILIDAD', nombre: 'Rentabilidad operacional del activo', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), activoTotal(r)), bueno: 0.1, regular: 0.04, mejorSiMayor: true },
  { codigo: 'REN_08', factor: 'RENTABILIDAD', nombre: 'ROE', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), patrimonio(r)), bueno: 0.15, regular: 0.06, mejorSiMayor: true },
  { codigo: 'REN_09', factor: 'RENTABILIDAD', nombre: 'ROA', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), activoTotal(r)), bueno: 0.08, regular: 0.03, mejorSiMayor: true },
]

function calcularSemaforo(valor: number, def: DefinicionIndicador): SemaforoIndicador {
  if (def.mejorSiMayor) {
    if (valor >= def.bueno) return 'VERDE'
    if (valor >= def.regular) return 'AMARILLO'
    return 'ROJO'
  }
  if (valor <= def.bueno) return 'VERDE'
  if (valor <= def.regular) return 'AMARILLO'
  return 'ROJO'
}

function formatearValor(unidad: IndicadorCalculado['unidad'], valor: number): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return formatPorcentaje(valor)
    case 'DIAS':
      return `${Math.round(valor)} días`
    case 'VECES':
      return `${valor.toFixed(2)}x`
    case 'RATIO':
      return valor.toFixed(2)
  }
}

export function calcularIndicadores(r: RegistroFinanciero): IndicadorCalculado[] {
  return CATALOGO_INDICADORES.map((def) => {
    const valor = def.calcular(r)
    return {
      codigo: def.codigo,
      factor: def.factor,
      nombre: def.nombre,
      unidad: def.unidad,
      valor,
      valorFormateado: formatearValor(def.unidad, valor),
      semaforo: calcularSemaforo(valor, def),
      mejorSiMayor: def.mejorSiMayor,
    }
  })
}

export function calcularDiagnostico(r: RegistroFinanciero): string[] {
  const indicadores = calcularIndicadores(r)
  const rojos = indicadores.filter((i) => i.semaforo === 'ROJO')
  const verdes = indicadores.filter((i) => i.semaforo === 'VERDE')
  const lineas: string[] = []

  if (rojos.length === 0) {
    lineas.push('Estado general: Saludable — ningún indicador está en zona de riesgo.')
  } else if (rojos.length <= 2) {
    lineas.push(`Estado general: Atención — ${rojos.length} indicador(es) fuera de rango saludable.`)
  } else {
    lineas.push(`Estado general: En riesgo — ${rojos.length} indicadores fuera de rango saludable.`)
  }

  if (verdes.length > 0) {
    lineas.push(`Principal fortaleza: ${verdes[0].nombre} en ${verdes[0].valorFormateado}.`)
  }
  if (rojos.length > 0) {
    lineas.push(`Principal riesgo: ${rojos[0].nombre} en ${rojos[0].valorFormateado}.`)
  }
  if (!balanceCuadrado(r)) {
    lineas.push('El balance de este registro no cuadra — revisa los valores cargados.')
  }
  return lineas
}

const PESO_FACTOR: Record<FactorIndicador, number> = {
  LIQUIDEZ: 0.25,
  SOLVENCIA: 0.25,
  GESTION: 0.2,
  RENTABILIDAD: 0.3,
}

function puntajeSemaforo(semaforo: SemaforoIndicador): number {
  switch (semaforo) {
    case 'VERDE':
      return 100
    case 'AMARILLO':
      return 55
    case 'ROJO':
      return 15
  }
}

export function calcularSaludFinanciera(r: RegistroFinanciero): SaludFinanciera {
  const indicadores = calcularIndicadores(r)
  const factores = (Object.keys(PESO_FACTOR) as FactorIndicador[]).map((factor) => {
    const delFactor = indicadores.filter((i) => i.factor === factor)
    const puntaje = delFactor.reduce((suma, i) => suma + puntajeSemaforo(i.semaforo), 0) / delFactor.length
    return { factor, puntaje, peso: PESO_FACTOR[factor] }
  })
  const puntaje = factores.reduce((suma, f) => suma + f.puntaje * f.peso, 0)
  const etiqueta: SaludFinanciera['etiqueta'] =
    puntaje >= 80 ? 'Saludable' : puntaje >= 60 ? 'Estable' : puntaje >= 40 ? 'En riesgo' : 'Crítico'
  return { puntaje, etiqueta, factores }
}

export type DescripcionIndicador = Pick<IndicadorCalculado, 'codigo' | 'factor' | 'nombre' | 'unidad' | 'mejorSiMayor'>

export function listarIndicadores(): DescripcionIndicador[] {
  return CATALOGO_INDICADORES.map((def) => ({
    codigo: def.codigo,
    factor: def.factor,
    nombre: def.nombre,
    unidad: def.unidad,
    mejorSiMayor: def.mejorSiMayor,
  }))
}
