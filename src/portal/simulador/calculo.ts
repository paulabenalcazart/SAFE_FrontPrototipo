import type { NivelRiesgo, ResultadoSimulacion, SerieMensualSimulacion } from '@/portal/types'

export const HOY_SIMULADOR = '2026-08-13'

const SBU_REFERENCIA = 460
const APORTE_PATRONAL_IESS = 0.1115
const FONDOS_RESERVA = 0.0833

function num(v: number | boolean | undefined, fallback = 0): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: number | boolean | undefined): boolean {
  return v === true
}

function construirSerie(params: {
  mesesSimular: number
  costoDelMes: (t: number) => number
  ingresoDelMes: (t: number) => number
  utilidadActualBase: number
}): SerieMensualSimulacion[] {
  const { mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase } = params
  let costoAcumulado = 0
  let ingresoAcumulado = 0
  const serie: SerieMensualSimulacion[] = []
  for (let t = 1; t <= mesesSimular; t++) {
    const costoMes = costoDelMes(t)
    const ingresoMes = ingresoDelMes(t)
    costoAcumulado += costoMes
    ingresoAcumulado += ingresoMes
    serie.push({
      mes: `Mes ${t}`,
      costoAcumulado,
      ingresoAcumulado,
      utilidadActual: utilidadActualBase,
      utilidadProyectada: utilidadActualBase + ingresoMes - costoMes,
    })
  }
  return serie
}

function calcularRiesgo(serie: SerieMensualSimulacion[]): { nivelRiesgo: NivelRiesgo; riesgoTexto: string } {
  const final = serie[serie.length - 1]
  const neto = final.ingresoAcumulado - final.costoAcumulado
  const ratio = final.ingresoAcumulado === 0 ? Infinity : final.costoAcumulado / final.ingresoAcumulado

  if (neto < 0) {
    if (ratio >= 2 || final.ingresoAcumulado === 0) {
      return {
        nivelRiesgo: 'CRITICO',
        riesgoTexto:
          'El costo total supera ampliamente el ingreso adicional proyectado — este escenario compromete seriamente la utilidad de la empresa.',
      }
    }
    return {
      nivelRiesgo: 'ALTO',
      riesgoTexto:
        'El costo total proyectado supera al ingreso adicional esperado — revisa las variables antes de comprometerte con este escenario.',
    }
  }
  if (ratio <= 0.6) {
    return {
      nivelRiesgo: 'BAJO',
      riesgoTexto: 'El escenario muestra un margen saludable entre el ingreso adicional proyectado y su costo.',
    }
  }
  return {
    nivelRiesgo: 'MEDIO',
    riesgoTexto: 'El escenario es positivo, pero el margen entre el costo y el ingreso adicional proyectado es ajustado.',
  }
}

export function simularContratacionPersonal(entradas: Record<string, number | boolean>): ResultadoSimulacion {
  const numeroContrataciones = num(entradas.numeroContrataciones, 1)
  const salarioMensual = num(entradas.salarioMensual, SBU_REFERENCIA)
  const mesesSimular = Math.max(num(entradas.mesesSimular, 12), 1)
  const costoReclutamiento = num(entradas.costoReclutamiento, 0)
  const otrosBeneficios = num(entradas.otrosBeneficios, 0)
  const incluyeFondosReserva = bool(entradas.incluyeFondosReserva)
  const ingresoAdicionalEsperado = num(entradas.ingresoAdicionalEsperado, 0)
  const mesesProductividadPlena = Math.max(num(entradas.mesesProductividadPlena, 3), 1)

  const costoMensualPorEmpleado =
    salarioMensual * (1 + APORTE_PATRONAL_IESS) +
    salarioMensual / 12 +
    SBU_REFERENCIA / 12 +
    (incluyeFondosReserva ? salarioMensual * FONDOS_RESERVA : 0) +
    otrosBeneficios

  const costoDelMes = (t: number) => costoMensualPorEmpleado * numeroContrataciones + (t === 1 ? costoReclutamiento : 0)
  const rampFactor = (t: number) => Math.min(t / mesesProductividadPlena, 1)
  const ingresoDelMes = (t: number) => numeroContrataciones * ingresoAdicionalEsperado * rampFactor(t)

  const serie = construirSerie({ mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase: 0 })
  const { nivelRiesgo, riesgoTexto } = calcularRiesgo(serie)
  const final = serie[serie.length - 1]

  return {
    cards: [
      { titulo: 'Costo total del periodo', valor: final.costoAcumulado, formato: 'USD', sub: `${mesesSimular} meses simulados` },
      { titulo: 'Ingreso adicional proyectado', valor: final.ingresoAcumulado, formato: 'USD', sub: `${numeroContrataciones} contratación(es)` },
      { titulo: 'Impacto neto en utilidad', valor: final.ingresoAcumulado - final.costoAcumulado, formato: 'USD', sub: 'Ingreso adicional menos costo total' },
      { titulo: 'Costo mensual por contratación', valor: costoMensualPorEmpleado, formato: 'USD', sub: 'En régimen estable, sin costo de reclutamiento' },
    ],
    serie,
    nivelRiesgo,
    riesgoTexto,
    recomendaciones: [
      nivelRiesgo === 'BAJO'
        ? 'El escenario muestra margen saludable — puedes proceder con la contratación.'
        : 'Considera reducir el número de contrataciones o extender el periodo de rampa antes de comprometerte.',
      'Confirma el salario con la tabla sectorial del Ministerio de Trabajo antes de decidir.',
      'Revisa si el ingreso adicional esperado por persona es realista para tu operación actual.',
    ],
    supuestos: [
      'Aporte patronal IESS: 11.15% del salario mensual.',
      'Décimo tercero y décimo cuarto calculados y provisionados mensualmente.',
      `SBU de referencia: $${SBU_REFERENCIA} (valor de referencia, no verificado contra el SBU oficial vigente).`,
      'Fondos de reserva (8.33%) solo se incluyen si activas la opción correspondiente.',
    ],
    limitaciones: [
      'No considera indemnizaciones ni costos de una eventual desvinculación.',
      'No sustituye asesoría laboral profesional.',
      'Asume salario y beneficios constantes durante todo el periodo simulado.',
    ],
  }
}

export function simularAumentoVentas(
  entradas: Record<string, number | boolean>,
  ingresosBase: number,
  utilidadActualBase: number,
): ResultadoSimulacion {
  const incrementoPct = num(entradas.incrementoPct, 0)
  const mesesSimular = Math.max(num(entradas.mesesSimular, 12), 1)
  const inversionInicial = num(entradas.inversionInicial, 0)
  const gastoOperativoAdicional = num(entradas.gastoOperativoAdicional, 0)
  const pctCostoVariable = num(entradas.pctCostoVariable, 0)

  const ingresoDelMes = (t: number) => ingresosBase * (incrementoPct / 100) * t
  const costoDelMes = (t: number) =>
    ingresoDelMes(t) * (pctCostoVariable / 100) + gastoOperativoAdicional + (t === 1 ? inversionInicial : 0)

  const serie = construirSerie({ mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase })
  const { nivelRiesgo, riesgoTexto } = calcularRiesgo(serie)
  const final = serie[serie.length - 1]

  return {
    cards: [
      { titulo: 'Costo total del periodo', valor: final.costoAcumulado, formato: 'USD', sub: `${mesesSimular} meses simulados` },
      { titulo: 'Ingreso adicional proyectado', valor: final.ingresoAcumulado, formato: 'USD', sub: `${incrementoPct}% de incremento mensual` },
      { titulo: 'Impacto neto en utilidad', valor: final.ingresoAcumulado - final.costoAcumulado, formato: 'USD', sub: 'Ingreso adicional menos costo total' },
      { titulo: 'Utilidad proyectada (último mes)', valor: final.utilidadProyectada, formato: 'USD', sub: 'Comparada con la utilidad neta actual' },
    ],
    serie,
    nivelRiesgo,
    riesgoTexto,
    recomendaciones: [
      nivelRiesgo === 'BAJO'
        ? 'El escenario muestra margen saludable — el incremento de ventas proyectado cubre ampliamente su costo.'
        : 'Revisa el porcentaje de incremento o el costo variable asociado antes de comprometer presupuesto.',
      'Contrasta el % de incremento mensual con el historial real de ventas de tu empresa.',
      'Confirma si el costo variable adicional refleja bien tu estructura de costos actual.',
    ],
    supuestos: [
      'Línea base tomada del último registro financiero vigente de la empresa.',
      'El crecimiento de ventas se proyecta de forma lineal, no compuesta.',
      '% de costo variable adicional aplicado directamente sobre el ingreso adicional proyectado.',
      'No considera estacionalidad ni variaciones de precio.',
    ],
    limitaciones: [
      'No sustituye asesoría financiera profesional.',
      'Asume que el resto de la estructura de costos permanece constante.',
      'La inversión inicial en marketing no garantiza el incremento de ventas proyectado.',
    ],
  }
}
