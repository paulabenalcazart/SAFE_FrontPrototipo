import type { MarcaTarjeta, PagoSuscripcion, PlanCodigo } from '@/portal/types'

export const HOY_PLAN = '2026-08-13'

export type ModuloPlan = { nombre: string; incluido: boolean }

export function modulosDelPlan(codigo: PlanCodigo): ModuloPlan[] {
  const noEsencial = codigo !== 'ESENCIAL'
  const corporativo = codigo === 'CORPORATIVO'
  return [
    { nombre: 'Dashboard', incluido: true },
    { nombre: 'Estados financieros', incluido: true },
    { nombre: 'Indicadores avanzados', incluido: noEsencial },
    { nombre: 'Simulador', incluido: noEsencial },
    { nombre: 'Marketplace', incluido: noEsencial },
    { nombre: 'Reportes consolidados', incluido: corporativo },
  ]
}

export type EstadisticaUso = { titulo: string; valor: string }

export function estadisticasDeUso(params: {
  registrosFinancieros: number
  indicadoresCalculados: number
  simulacionesRealizadas: number
  obligacionesCumplidas: number
}): EstadisticaUso[] {
  return [
    { titulo: 'Periodos financieros procesados', valor: String(params.registrosFinancieros) },
    { titulo: 'Indicadores calculados por SAFE', valor: String(params.indicadoresCalculados) },
    { titulo: 'Simulaciones ejecutadas', valor: String(params.simulacionesRealizadas) },
    { titulo: 'Cumplimientos registrados', valor: String(params.obligacionesCumplidas) },
  ]
}

export function detectarMarca(numeroTarjeta: string): MarcaTarjeta {
  const limpio = numeroTarjeta.replace(/\s+/g, '')
  if (limpio.startsWith('4')) return 'Visa'
  if (limpio.startsWith('5')) return 'Mastercard'
  return 'Tarjeta'
}

const EXPIRACION_REGEX = /^(0[1-9]|1[0-2])\/(\d{2})$/

export type ExpiracionParseada = { mes: number | null; anio: number | null; error?: string }

export function parseExpiracion(expiracion: string): ExpiracionParseada {
  const match = EXPIRACION_REGEX.exec(expiracion.trim())
  if (!match) {
    return { mes: null, anio: null, error: 'Ingresa una expiración válida (MM/AA).' }
  }

  const mes = Number(match[1])
  const anio = 2000 + Number(match[2])
  const [anioHoy, mesHoy] = HOY_PLAN.split('-').map(Number)

  if (anio < anioHoy || (anio === anioHoy && mes < mesHoy)) {
    return { mes: null, anio: null, error: 'La tarjeta está vencida.' }
  }

  return { mes, anio }
}

export type ErroresNuevoMetodo = { numeroTarjeta?: string; expiracion?: string; cvc?: string }

export function validarNuevoMetodo(datos: {
  numeroTarjeta: string
  expiracion: string
  cvc: string
}): { errores: ErroresNuevoMetodo; mesExpiracion: number | null; anioExpiracion: number | null } {
  const errores: ErroresNuevoMetodo = {}
  const numeroLimpio = datos.numeroTarjeta.replace(/\s+/g, '')

  if (!/^\d{13,19}$/.test(numeroLimpio)) {
    errores.numeroTarjeta = 'Ingresa un número de tarjeta válido (13 a 19 dígitos).'
  }

  const { mes, anio, error } = parseExpiracion(datos.expiracion)
  if (error) errores.expiracion = error

  if (!/^\d{3,4}$/.test(datos.cvc.trim())) {
    errores.cvc = 'Ingresa un CVC válido (3 o 4 dígitos).'
  }

  return { errores, mesExpiracion: mes, anioExpiracion: anio }
}

export type PaginaPagos = { items: PagoSuscripcion[]; total: number; totalPaginas: number; pagina: number }

export function paginarPagos(params: {
  pagos: PagoSuscripcion[]
  paginaSolicitada: number
  porPagina?: number
}): PaginaPagos {
  const { pagos, paginaSolicitada, porPagina = 5 } = params
  const tamanioPagina = Number.isFinite(porPagina) && porPagina > 0 ? Math.floor(porPagina) : 5
  const total = pagos.length
  const totalPaginas = Math.ceil(total / tamanioPagina)

  if (totalPaginas === 0) {
    return { items: [], total, totalPaginas: 0, pagina: 0 }
  }

  const paginaEntera = Number.isFinite(paginaSolicitada) ? Math.floor(paginaSolicitada) : 1
  const pagina = Math.min(Math.max(paginaEntera, 1), totalPaginas)
  const inicio = (pagina - 1) * tamanioPagina

  return {
    items: pagos.slice(inicio, inicio + tamanioPagina),
    total,
    totalPaginas,
    pagina,
  }
}
