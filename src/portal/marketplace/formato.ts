import { formatUSD } from '@/portal/financiero/formato'
import { capitalizar, formatFecha } from '@/portal/obligaciones/formato'
import type { ModalidadAtencion, ServicioProfesional } from '@/portal/types'

const ETIQUETA_MODALIDAD: Record<ModalidadAtencion, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
  AMBAS: 'Mixta',
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function formatModalidad(modalidad: ModalidadAtencion): string {
  return ETIQUETA_MODALIDAD[modalidad]
}

export function formatDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const minutosRestantes = minutos % 60
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`
}

export function formatRangoHorario({
  horaInicio,
  horaFin,
}: {
  horaInicio: string
  horaFin: string
}): string {
  return `${horaInicio} – ${horaFin}`
}

export function formatFechaDisponible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${capitalizar(DIAS_CORTOS[diaSemana].toLocaleUpperCase('es'))} · ${formatFecha(fecha)}`
}

export function formatEstrellas(calificacion: number): string {
  const llenas = Math.round(Math.min(5, Math.max(0, calificacion)))
  return `${'★'.repeat(llenas)}${'☆'.repeat(5 - llenas)}`
}

export function formatResumenCalificacion({
  calificacion,
  cantidadResenas,
}: {
  calificacion: number
  cantidadResenas: number
}): string {
  return `${calificacion.toFixed(1)} (${cantidadResenas} ${cantidadResenas === 1 ? 'reseña' : 'reseñas'})`
}

export function formatTarifaHora(tarifa: number): string {
  return `${formatUSD(tarifa)}/hora`
}

export function formatMetaServicio(
  servicio: Pick<
    ServicioProfesional,
    'duracionEstimadaMinutos' | 'modalidad' | 'tarifaReferencial'
  >,
): string {
  return `${formatDuracion(servicio.duracionEstimadaMinutos)} · ${formatModalidad(servicio.modalidad)} · ${formatUSD(servicio.tarifaReferencial)}`
}
