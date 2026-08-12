import type { EstadoSolicitudContacto, Tono } from '@/portal/types'

/** Tono de badge por estado de solicitud, compartido por el historial y el detalle. */
export const ESTADO_TONO: Record<EstadoSolicitudContacto, Tono> = {
  ENVIADA: 'atencion',
  ACEPTADA: 'positivo',
  CONTACTO_LIBERADO: 'positivo',
  FINALIZADA: 'positivo',
  RECHAZADA: 'critico',
  PENDIENTE_PAGO: 'neutro',
  PAGADA: 'neutro',
}

/** Etiqueta visible en español por estado de solicitud. */
export const ESTADO_LABEL: Record<EstadoSolicitudContacto, string> = {
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  CONTACTO_LIBERADO: 'Contacto liberado',
  FINALIZADA: 'Finalizada',
  RECHAZADA: 'Rechazada',
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGADA: 'Pagada',
}
