import {
  BellRing,
  FileWarning,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UsersRound,
  Video,
} from 'lucide-react'
import type { NavItem } from '@/portal/types'

export const AHORA_ADMIN = '2026-08-13T09:00:00-05:00'
export const ADMIN_DEMO_EMAIL = 'admin@safe-demo.ec'
export const ADMIN_DEMO_USER = {
  role: 'ADMIN' as const,
  nombres: 'Emilio',
  apellidos: 'Pino',
  correo: ADMIN_DEMO_EMAIL,
  telefono: '+593 2 600 0000',
  pais: 'Ecuador',
  ciudad: 'Quito',
  iniciales: 'EP',
  mfaHabilitado: true,
}

export const navItemsAdmin: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { key: 'usuarios', label: 'Usuarios', path: '/app/admin/usuarios', icon: UsersRound },
  { key: 'parametros', label: 'Parámetros normativos', path: '/app/admin/parametros', icon: SlidersHorizontal },
  { key: 'planes-permisos', label: 'Planes y permisos', path: '/app/admin/planes-permisos', icon: ShieldCheck },
  { key: 'alertas-contenido', label: 'Alertas y contenido', path: '/app/admin/alertas-contenido', icon: BellRing },
  { key: 'incidencias-auditoria', label: 'Incidencias y auditoría', path: '/app/admin/incidencias-auditoria', icon: FileWarning },
  { key: 'tutoriales', label: 'Video tutoriales', path: '/app/tutoriales', icon: Video },
  { key: 'configuracion', label: 'Configuración', path: '/app/configuracion', icon: Settings },
]
