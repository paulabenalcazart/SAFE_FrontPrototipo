import type { RegistroFinanciero } from '@/portal/types'

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type CampoFinancieroKey = keyof Omit<
  RegistroFinanciero,
  'id' | 'periodo' | 'version' | 'estado' | 'observaciones' | 'createdAt' | 'updatedAt'
>

export type CampoDefinicion = {
  key: CampoFinancieroKey
  label: string
  hint?: string
  min?: number
}

export const PASOS: { n: WizardStep; label: string }[] = [
  { n: 1, label: 'Periodo' },
  { n: 2, label: 'Activo' },
  { n: 3, label: 'Pasivo' },
  { n: 4, label: 'Patrimonio' },
  { n: 5, label: 'Ingresos' },
  { n: 6, label: 'Costos' },
  { n: 7, label: 'Gastos' },
  { n: 8, label: 'Flujo de efectivo' },
  { n: 9, label: 'Complementario' },
  { n: 10, label: 'Revisión' },
]

export const PASOS_CAMPOS: Record<2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, CampoDefinicion[]> = {
  2: [
    { key: 'efectivoEquivalentes', label: 'Efectivo y equivalentes', min: 0 },
    { key: 'cuentasPorCobrar', label: 'Cuentas por cobrar', min: 0 },
    { key: 'inventarios', label: 'Inventarios', min: 0 },
    { key: 'otrosActivosCorrientes', label: 'Otros activos corrientes', min: 0 },
    { key: 'activoFijoNeto', label: 'Activo fijo neto', min: 0 },
    { key: 'otrosActivosNoCorrientes', label: 'Otros activos no corrientes', min: 0 },
  ],
  3: [
    { key: 'cuentasPorPagar', label: 'Cuentas por pagar', min: 0 },
    { key: 'deudaCortoPlazo', label: 'Deuda a corto plazo', min: 0 },
    { key: 'otrosPasivosCorrientes', label: 'Otros pasivos corrientes', min: 0 },
    { key: 'deudaLargoPlazo', label: 'Deuda a largo plazo', min: 0 },
    { key: 'otrosPasivosNoCorrientes', label: 'Otros pasivos no corrientes', min: 0 },
  ],
  4: [
    { key: 'capitalSocial', label: 'Capital social', min: 0 },
    { key: 'resultadosAcumulados', label: 'Resultados acumulados', hint: 'Puede ser negativo si hay pérdidas acumuladas' },
  ],
  5: [
    { key: 'ingresosOperacionales', label: 'Ingresos operacionales', min: 0 },
    { key: 'otrosIngresos', label: 'Otros ingresos', min: 0 },
  ],
  6: [{ key: 'costoVentas', label: 'Costo de ventas', min: 0 }],
  7: [
    { key: 'gastosAdministracion', label: 'Gastos de administración', min: 0 },
    { key: 'gastosVentas', label: 'Gastos de ventas', min: 0 },
    { key: 'otrosGastosOperacionales', label: 'Otros gastos operacionales', min: 0 },
    { key: 'gastosFinancieros', label: 'Gastos financieros', min: 0 },
    { key: 'impuestoRenta', label: 'Impuesto a la renta', min: 0 },
  ],
  8: [
    { key: 'flujoOperacion', label: 'Flujo de operación', hint: 'Puede ser negativo' },
    { key: 'flujoInversion', label: 'Flujo de inversión', hint: 'Puede ser negativo' },
    { key: 'flujoFinanciamiento', label: 'Flujo de financiamiento', hint: 'Puede ser negativo' },
  ],
  9: [
    { key: 'comprasPeriodo', label: 'Compras del periodo', min: 0 },
    { key: 'capex', label: 'Inversión en activos (CAPEX)', min: 0 },
    { key: 'depreciacion', label: 'Depreciación del periodo', min: 0 },
    { key: 'numeroEmpleadosPeriodo', label: 'Número de empleados', min: 0 },
    { key: 'costoLaboral', label: 'Costo laboral', min: 0 },
    { key: 'gastoID', label: 'Gasto en investigación y desarrollo', min: 0 },
    { key: 'unidadesVendidas', label: 'Unidades vendidas', min: 0 },
  ],
}

export function crearRegistroVacio(): RegistroFinanciero {
  return {
    id: crypto.randomUUID(),
    periodo: '',
    version: 1,
    estado: 'BORRADOR',
    observaciones: '',
    efectivoEquivalentes: 0,
    cuentasPorCobrar: 0,
    inventarios: 0,
    otrosActivosCorrientes: 0,
    activoFijoNeto: 0,
    otrosActivosNoCorrientes: 0,
    cuentasPorPagar: 0,
    deudaCortoPlazo: 0,
    otrosPasivosCorrientes: 0,
    deudaLargoPlazo: 0,
    otrosPasivosNoCorrientes: 0,
    capitalSocial: 0,
    resultadosAcumulados: 0,
    ingresosOperacionales: 0,
    otrosIngresos: 0,
    costoVentas: 0,
    gastosAdministracion: 0,
    gastosVentas: 0,
    otrosGastosOperacionales: 0,
    gastosFinancieros: 0,
    impuestoRenta: 0,
    flujoOperacion: 0,
    flujoInversion: 0,
    flujoFinanciamiento: 0,
    comprasPeriodo: 0,
    capex: 0,
    depreciacion: 0,
    numeroEmpleadosPeriodo: 0,
    costoLaboral: 0,
    gastoID: 0,
    unidadesVendidas: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
