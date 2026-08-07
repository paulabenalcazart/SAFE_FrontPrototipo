export function formatUSD(valor: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatPorcentaje(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`
}

export function formatPeriodo(periodoISO: string): string {
  const [anio, mes] = periodoISO.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, 1)
  const texto = fecha.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
