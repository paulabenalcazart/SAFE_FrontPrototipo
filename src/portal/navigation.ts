import type { AppRole } from '@/auth/AuthContext'
import { navItemsColaborador, navItemsEmpresa } from '@/portal/data/mock-portal-data'
import { navItemsAdmin } from '@/portal/admin/catalogo'
import type { NavItem } from '@/portal/types'

export function assertNever(value: never): never {
  throw new Error(`Rol no soportado: ${String(value)}`)
}

export function navItemsParaRol(role: AppRole): NavItem[] {
  switch (role) {
    case 'EMPRESA': return navItemsEmpresa
    case 'COLABORADOR': return navItemsColaborador
    case 'ADMIN': return navItemsAdmin
    default: return assertNever(role)
  }
}
