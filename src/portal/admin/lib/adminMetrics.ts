export function summarizePlans(rows: Array<{ activo: boolean; users: number }>) {
  return { active: rows.filter((row) => row.activo).length, users: rows.reduce((sum, row) => sum + row.users, 0) }
}

export function filterSecurity<T extends { gravedad: string; estado: string }>(rows: T[], severity: string, status: string): T[] {
  return rows.filter((row) => (severity === 'Todos' || row.gravedad === severity) && (status === 'Todos' || row.estado === status))
}
