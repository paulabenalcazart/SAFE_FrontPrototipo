import type { ModalidadAtencion } from '@/portal/types'

const ETIQUETA_MODALIDAD: Record<ModalidadAtencion, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
  AMBAS: 'Virtual y presencial',
}

export function formatModalidadEtiqueta(modalidad: ModalidadAtencion): string {
  return ETIQUETA_MODALIDAD[modalidad]
}

export function formatEstadoDisponibilidad(estado: 'DISPONIBLE' | 'NO_DISPONIBLE'): string {
  return estado === 'DISPONIBLE' ? 'Disponible' : 'No disponible'
}

export function formatPrecioServicio(valor: number): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(valor)
}
