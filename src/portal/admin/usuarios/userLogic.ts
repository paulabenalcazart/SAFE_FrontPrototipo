export interface UserCategoryShape { role: string; noCompany?: boolean }

export function deriveUserCounts(users: UserCategoryShape[]) {
  return {
    company: users.filter((user) => user.role === 'USUARIO_EMPRESA' && !user.noCompany).length,
    noCompany: users.filter((user) => user.role === 'USUARIO_EMPRESA' && Boolean(user.noCompany)).length,
    collaborators: users.filter((user) => user.role === 'COLABORADOR').length,
  }
}

export function normalizeAdminEmail(value: string): string {
  return value.trim().toLowerCase()
}

export function hasDuplicateEmail(rows: Array<{ id: string; correo: string }>, correo: string, excludeId?: string): boolean {
  const normalized = normalizeAdminEmail(correo)
  return Boolean(normalized) && rows.some((row) => row.id !== excludeId && normalizeAdminEmail(row.correo) === normalized)
}

export function hasDuplicateRuc(rows: Array<{ id: string; ruc: string }>, ruc: string, excludeId?: string): boolean {
  const normalized = ruc.trim()
  return Boolean(normalized) && rows.some((row) => row.id !== excludeId && row.ruc.trim() === normalized)
}
