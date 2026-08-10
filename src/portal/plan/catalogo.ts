import { comparativa, planes } from '@/lib/plans-data'
import type { PlanCodigo } from '@/portal/types'

export type PlanCatalogo = {
  codigo: PlanCodigo
  nombre: string
  precio: number
  destacado: boolean
  empresas: string
  simulaciones: string
  soporte: string
  beneficios: string[]
}

const CODIGO_POR_NOMBRE: Record<string, PlanCodigo> = {
  'Plan Esencial': 'ESENCIAL',
  'Plan Crecimiento': 'CRECIMIENTO',
  'Plan Corporativo': 'CORPORATIVO',
}

export const PLANES: PlanCatalogo[] = planes.map((plan) => ({
  codigo: CODIGO_POR_NOMBRE[plan.nombre],
  nombre: plan.nombre,
  precio: plan.precio,
  destacado: plan.destacado,
  empresas: plan.empresas,
  simulaciones: plan.simulaciones,
  soporte: plan.soporte,
  beneficios: [...plan.beneficios],
}))

export function planPorCodigo(codigo: PlanCodigo): PlanCatalogo {
  const plan = PLANES.find((p) => p.codigo === codigo)
  if (!plan) throw new Error(`Plan no encontrado: ${codigo}`)
  return plan
}

export type FilaComparativaPlan = {
  modulo: string
  esencial: boolean
  crecimiento: boolean
  corporativo: boolean
}

export const COMPARATIVA_PLANES: FilaComparativaPlan[] = comparativa.map((fila) => ({ ...fila }))

export type PreguntaPlan = { pregunta: string; respuesta: string }

export const PREGUNTAS_PLAN: PreguntaPlan[] = [
  {
    pregunta: '¿Puedo cambiar mi plan cuando quiera?',
    respuesta:
      'Sí. El cambio se aplica en el siguiente ciclo de facturación y se conserva todo tu histórico.',
  },
  {
    pregunta: '¿Cómo funciona la renovación de mi suscripción?',
    respuesta: 'La renovación es mensual y automática mientras la renovación automática esté activa.',
  },
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta:
      'Tarjetas de crédito y débito procesadas mediante un gateway mock, en dólares estadounidenses.',
  },
  {
    pregunta: '¿Puedo cancelar mi suscripción?',
    respuesta:
      'Sí. La cancelación detiene la renovación y conservas el acceso hasta la fecha de fin del periodo pagado.',
  },
  {
    pregunta: '¿Cómo se calculan las cargas financieras?',
    respuesta:
      'Las cargas financieras provienen de los registros mensuales que ingresa tu empresa; no son cargos adicionales.',
  },
]
