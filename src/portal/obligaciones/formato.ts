const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

export function formatFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return `${dia} ${MESES_CORTO[mes - 1]} ${anio}`
}

export function formatDias(n: number): string {
  const abs = Math.abs(n)
  return `${abs} ${abs === 1 ? 'día' : 'días'}`
}

export function capitalizar(texto: string): string {
  return texto.charAt(0) + texto.slice(1).toLowerCase()
}
