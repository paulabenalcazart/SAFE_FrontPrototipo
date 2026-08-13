export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-EC').format(value)
}

export function formatMoney(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-EC', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value)
}

export function formatDate(value: string | number | Date | null | undefined, withTime = false): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return new Intl.DateTimeFormat('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }).format(date)
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remaining = seconds % 60
  return `${minutes}:${String(remaining).padStart(2, '0')}`
}

export function titleCase(value: unknown): string {
  const text = String(value ?? '').replace(/_/g, ' ').toLocaleLowerCase('es')
  return text.replace(/(^|\s)\S/g, (letter) => letter.toLocaleUpperCase('es'))
}

export function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Sí' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
