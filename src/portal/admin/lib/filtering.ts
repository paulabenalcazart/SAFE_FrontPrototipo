export function normalizeText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .trim()
}

export function matchesQuery<T extends object>(record: T, query: string, fields: Array<keyof T>): boolean {
  const normalizedQuery = normalizeText(query)
  if (!normalizedQuery) return true
  return fields.some((field) => normalizeText(record[field]).includes(normalizedQuery))
}

export function filterByField<T extends object>(rows: T[], field: keyof T, value: unknown): T[] {
  if (value === undefined || value === null || value === '' || value === 'Todos') return rows
  return rows.filter((row) => String(row[field] ?? '') === String(value))
}

export function uniqueValues<T extends object>(rows: T[], field: keyof T): string[] {
  return [...new Set(rows.map((row) => String(row[field] ?? '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
}
