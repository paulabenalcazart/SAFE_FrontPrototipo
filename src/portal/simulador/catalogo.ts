import type { EscenarioSimulacion, VariableEscenario } from '@/portal/types'

export const ESCENARIOS_SIMULACION: EscenarioSimulacion[] = [
  {
    codigo: 'CONTRATACION_PERSONAL',
    nombre: 'Contratación de personal',
    categoria: 'LABORAL',
    descripcion: 'Evalúa el costo total y el impacto de contratar nuevo personal antes de decidir.',
    implementado: true,
  },
  {
    codigo: 'AUMENTO_VENTAS',
    nombre: 'Aumento de ventas',
    categoria: 'FINANCIERO',
    descripcion: 'Proyecta el impacto de un incremento sostenido en ventas sobre tu utilidad.',
    implementado: true,
  },
  {
    codigo: 'CAMBIO_REGIMEN_TRIBUTARIO',
    nombre: 'Cambio de régimen tributario',
    categoria: 'TRIBUTARIO',
    descripcion: 'Próximamente: compara tu carga tributaria entre regímenes.',
    implementado: false,
  },
  {
    codigo: 'AUMENTO_CAPITAL',
    nombre: 'Aumento de capital social',
    categoria: 'SOCIETARIO',
    descripcion: 'Próximamente: evalúa el impacto de un aumento de capital social.',
    implementado: false,
  },
]

export function escenarioPorCodigo(codigo: string): EscenarioSimulacion | undefined {
  return ESCENARIOS_SIMULACION.find((e) => e.codigo === codigo)
}

const SBU_REFERENCIA = 460

export const VARIABLES_CONTRATACION_PERSONAL: VariableEscenario[] = [
  { codigo: 'numeroContrataciones', label: 'Número de contrataciones', tipoDato: 'NUMERO', unidad: 'personas', valorMinimo: 1, valorMaximo: 50, default: 1 },
  { codigo: 'salarioMensual', label: 'Salario mensual por persona', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: SBU_REFERENCIA, default: SBU_REFERENCIA, hint: `Mínimo referencial: SBU $${SBU_REFERENCIA}` },
  { codigo: 'mesesSimular', label: 'Meses a simular', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 24, default: 12 },
  { codigo: 'costoReclutamiento', label: 'Costo de reclutamiento y capacitación inicial', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 300, hint: 'Se aplica una sola vez, en el primer mes' },
  { codigo: 'otrosBeneficios', label: 'Otros beneficios mensuales por persona', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  { codigo: 'incluyeFondosReserva', label: 'Incluye fondos de reserva', tipoDato: 'BOOLEANO', default: false, hint: 'Aplica legalmente solo a partir del segundo año de relación laboral' },
  { codigo: 'ingresoAdicionalEsperado', label: 'Ingreso adicional mensual esperado por contratación', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  { codigo: 'mesesProductividadPlena', label: 'Meses hasta alcanzar productividad plena', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 12, default: 3 },
]

export const VARIABLES_AUMENTO_VENTAS: VariableEscenario[] = [
  { codigo: 'incrementoPct', label: '% de incremento mensual de ventas', tipoDato: 'PORCENTAJE', unidad: '%', valorMinimo: 0, valorMaximo: 50, default: 5 },
  { codigo: 'mesesSimular', label: 'Meses a simular', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 24, default: 12 },
  { codigo: 'inversionInicial', label: 'Inversión inicial en marketing', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 500, hint: 'Se aplica una sola vez, en el primer mes' },
  { codigo: 'gastoOperativoAdicional', label: 'Gasto operativo adicional mensual', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  // El default real de esta variable no es estático: SimuladorScreen (Task 7) lo calcula a partir del
  // registro financiero vigente de la empresa activa (costoVentas/ingresosOperacionales) al construir el
  // draft inicial del paso 2. El `default: 0` de acá es solo un fallback si por algún motivo no hubiera
  // registro (en la práctica no ocurre: AUMENTO_VENTAS ya está deshabilitado sin registro vigente).
  { codigo: 'pctCostoVariable', label: '% del incremento que genera costo variable adicional', tipoDato: 'PORCENTAJE', unidad: '%', valorMinimo: 0, valorMaximo: 100, default: 0 },
]

export const VARIABLES_POR_ESCENARIO: Record<string, VariableEscenario[]> = {
  CONTRATACION_PERSONAL: VARIABLES_CONTRATACION_PERSONAL,
  AUMENTO_VENTAS: VARIABLES_AUMENTO_VENTAS,
}
