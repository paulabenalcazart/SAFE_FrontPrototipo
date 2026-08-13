export type TokenPaginacion = number | 'ellipsis-start' | 'ellipsis-end'

export function crearRangoPaginacion(paginaActual: number, totalPaginas: number): TokenPaginacion[] {
  const total = Number.isFinite(totalPaginas) ? Math.max(0, Math.floor(totalPaginas)) : 0
  if (total === 0) return []

  const paginaSolicitada = Number.isFinite(paginaActual) ? Math.floor(paginaActual) : 1
  const actual = Math.min(Math.max(1, paginaSolicitada), total)

  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1)
  if (actual <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', total]
  if (actual >= total - 3) {
    return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total]
  }

  return [1, 'ellipsis-start', actual - 1, actual, actual + 1, 'ellipsis-end', total]
}
