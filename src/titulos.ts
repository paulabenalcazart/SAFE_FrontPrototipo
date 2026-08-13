const TITULOS_EXACTOS: Record<string, string> = {
  '/': 'SAFE Ecuador',
  '/como-funciona': 'Cómo funciona SAFE',
  '/planes': 'Planes SAFE',
  '/acerca': 'Acerca de SAFE',
  '/trabaja-con-safe': 'Trabaja con SAFE',
  '/postulacion': 'Postulación profesional SAFE',
  '/contacto': 'Contacto SAFE',
  '/terminos': 'Términos y condiciones SAFE',
  '/privacidad': 'Política de privacidad SAFE',
  '/login': 'Iniciar sesión SAFE',
  '/recuperar': 'Recuperar contraseña SAFE',
  '/signup': 'Crear cuenta SAFE',
  '/app': 'Portal SAFE',
  '/app/dashboard': 'Dashboard SAFE',
  '/app/admin/usuarios': 'Usuarios SAFE Admin',
  '/app/admin/parametros': 'Parámetros normativos SAFE',
  '/app/admin/planes-permisos': 'Planes y permisos SAFE',
  '/app/admin/alertas-contenido': 'Alertas y contenido SAFE',
  '/app/admin/incidencias-auditoria': 'Incidencias y auditoría SAFE',
  '/app/admin/alertas-seguridad': 'Alertas de seguridad SAFE',
  '/app/perfil': 'Mi perfil profesional SAFE',
  '/app/perfil/editar': 'Editar perfil profesional SAFE',
  '/app/perfil/vista-previa': 'Vista pública del perfil SAFE',
  '/app/perfil/resenas': 'Reseñas profesionales SAFE',
  '/app/solicitudes': 'Solicitudes y citas SAFE',
  '/app/empresa': 'Mi empresa SAFE',
  '/app/empresa/registrar': 'Registrar empresa SAFE',
  '/app/empresa/editar': 'Editar empresa SAFE',
  '/app/financiero': 'Gestión financiera SAFE',
  '/app/financiero/nuevo': 'Nueva carga financiera SAFE',
  '/app/financiero/comparar': 'Comparar periodos SAFE',
  '/app/indicadores': 'Indicadores financieros SAFE',
  '/app/indicadores/principales': 'Principales indicadores SAFE',
  '/app/indicadores/todos': 'Todos los indicadores SAFE',
  '/app/indicadores/comparar': 'Comparar indicadores SAFE',
  '/app/obligaciones': 'Obligaciones tributarias SAFE',
  '/app/simulador': 'Simulador SAFE',
  '/app/marketplace': 'Marketplace SAFE',
  '/app/plan': 'Plan y suscripción SAFE',
  '/app/plan/suscripcion': 'Administrar suscripción SAFE',
  '/app/plan/cambiar': 'Cambiar plan SAFE',
  '/app/plan/metodos-pago': 'Métodos de pago SAFE',
  '/app/plan/historial-pagos': 'Historial de pagos SAFE',
  '/app/configuracion': 'Configuración SAFE',
  '/app/configuracion/cuenta': 'Editar cuenta SAFE',
  '/app/tutoriales': 'Video tutoriales SAFE',
}
const TITULOS_DINAMICOS: { patron: RegExp; titulo: string }[] = [
  { patron: /^\/app\/solicitudes\/[^/]+$/, titulo: 'Detalle de solicitud SAFE' },
  { patron: /^\/app\/financiero\/[^/]+\/editar$/, titulo: 'Editar registro financiero SAFE' },
  { patron: /^\/app\/financiero\/[^/]+$/, titulo: 'Detalle financiero SAFE' },
  { patron: /^\/app\/obligaciones\/[^/]+$/, titulo: 'Detalle de obligación SAFE' },
  { patron: /^\/app\/simulador\/[^/]+$/, titulo: 'Resultado de simulación SAFE' },
  { patron: /^\/app\/marketplace\/[^/]+$/, titulo: 'Perfil de profesional SAFE' },
]

function normalizarPath(pathname: string): string {
  if (!pathname) return '/'
  const sinSlashFinal = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
  return sinSlashFinal || '/'
}

export function tituloParaRuta(pathname: string): string {
  const path = normalizarPath(pathname)
  const exacto = TITULOS_EXACTOS[path]
  if (exacto) return exacto

  return TITULOS_DINAMICOS.find(({ patron }) => patron.test(path))?.titulo ?? 'SAFE Ecuador'
}
