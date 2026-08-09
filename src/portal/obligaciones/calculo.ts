import type { EstadoObligacion, ObligacionEmpresa } from '@/portal/types'

export const HOY_OBLIGACIONES = '2026-08-13'

const DIA_POR_NOVENO_DIGITO: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
}

export function novenoDigito(ruc: string): number {
  return Number(ruc.charAt(8))
}

export function diaPorNovenoDigito(digito: number): number {
  return DIA_POR_NOVENO_DIGITO[digito]
}

export function diasHasta(fechaLimite: string, hoy: string): number {
  const msPorDia = 1000 * 60 * 60 * 24
  const [ay, am, ad] = fechaLimite.split('-').map(Number)
  const [hy, hm, hd] = hoy.split('-').map(Number)
  const limite = Date.UTC(ay, am - 1, ad)
  const actual = Date.UTC(hy, hm - 1, hd)
  return Math.round((limite - actual) / msPorDia)
}

export function estadoObligacion(
  o: Pick<ObligacionEmpresa, 'fechaLimite' | 'fechaCumplimiento'>,
  hoy: string,
): EstadoObligacion {
  if (o.fechaCumplimiento) return 'CUMPLIDA'
  const dias = diasHasta(o.fechaLimite, hoy)
  if (dias < 0) return 'VENCIDA'
  if (dias <= 15) return 'PROXIMA'
  return 'PENDIENTE'
}
