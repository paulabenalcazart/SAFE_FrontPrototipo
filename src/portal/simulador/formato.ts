import type { VariableEscenario } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'

export function formatValorVariable(v: VariableEscenario, valor: number | boolean): string {
  if (v.tipoDato === 'BOOLEANO') return valor ? 'Sí' : 'No'
  const numero = typeof valor === 'number' ? valor : 0
  if (v.tipoDato === 'MONEDA') return formatUSD(numero)
  if (v.tipoDato === 'PORCENTAJE') return `${numero}%`
  return `${numero}${v.unidad ? ` ${v.unidad}` : ''}`
}
