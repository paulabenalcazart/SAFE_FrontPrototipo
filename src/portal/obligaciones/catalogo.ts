import type { ObligacionCatalogo } from '@/portal/types'

export const OBLIGACIONES_CATALOGO: ObligacionCatalogo[] = [
  {
    codigo: 'IVA_MENSUAL',
    nombre: 'Declaración de IVA',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'MENSUAL',
    formulario: 'Formulario 104',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'RET_FUENTE_MENSUAL',
    nombre: 'Retención en la fuente del Impuesto a la Renta',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'MENSUAL',
    formulario: 'Formulario 103',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'IR_SOCIEDADES',
    nombre: 'Impuesto a la Renta — Sociedades',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'ANUAL',
    formulario: 'Formulario 101',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'ANTICIPO_IR',
    nombre: 'Anticipo Impuesto a la Renta',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'SEMESTRAL',
    formulario: 'Débito automático SRI',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'CUOTA_RIMPE',
    nombre: 'Cuota RIMPE Negocio Popular',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'SEMESTRAL',
    formulario: 'Pago cuota RIMPE',
    usaNovenoDigito: false,
    permiteMontoEstimado: true,
  },
]

export function obligacionPorCodigo(codigo: string): ObligacionCatalogo | undefined {
  return OBLIGACIONES_CATALOGO.find((o) => o.codigo === codigo)
}
