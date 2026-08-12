import type { VideoTutorial } from '@/portal/types'

export const CATEGORIAS_TUTORIAL_COLABORADOR = [
  'Todos',
  'Dashboard',
  'Perfil profesional',
  'Solicitudes y citas',
  'Configuración',
] as const

const CATALOGO_COLABORADOR: [string, string, string, string][] = [
  ['Conoce tu Dashboard profesional', 'Dashboard', '3:24', 'Qué significa cada KPI y cómo leer tu disponibilidad.'],
  ['Interpreta tu rendimiento mensual', 'Dashboard', '4:10', 'Cómo leer las 4 métricas semanales y su comparación con el mes anterior.'],
  ['Administra tu disponibilidad desde el Dashboard', 'Dashboard', '2:55', 'Atajo directo a tus horarios de atención.'],
  ['Completa tu perfil profesional', 'Perfil profesional', '5:12', 'Información personal, profesional y credenciales.'],
  ['Administra tus especialidades', 'Perfil profesional', '3:48', 'Cómo marcar tu especialidad principal y agregar otras.'],
  ['Crea y administra tus servicios', 'Perfil profesional', '4:33', 'Ícono, duración, tarifa y modalidad de cada servicio.'],
  ['Configura tus horarios de atención', 'Perfil profesional', '4:02', 'Bloques por día, modalidad y solapamientos.'],
  ['Así ven tu perfil las empresas', 'Perfil profesional', '2:40', 'Qué se muestra y qué se protege en la vista previa.'],
  ['Responde a una solicitud nueva', 'Solicitudes y citas', '3:15', 'Ver detalle, aceptar y liberar el contacto.'],
  ['Rechaza una solicitud correctamente', 'Solicitudes y citas', '2:20', 'Cuándo y cómo explicar un rechazo.'],
  ['Consulta tu historial de solicitudes', 'Solicitudes y citas', '3:05', 'Filtros, búsqueda y paginación.'],
  ['Administra tus notificaciones', 'Configuración', '2:48', 'Correo y frecuencia por tipo de aviso.'],
  ['Seguridad de tu cuenta', 'Configuración', '3:00', 'Autenticación en dos pasos y cambio de contraseña.'],
]

export const VIDEO_TUTORIALES_COLABORADOR: VideoTutorial[] = CATALOGO_COLABORADOR.map(
  ([titulo, categoria, duracion, descripcion], i) => ({
    id: `tut-col-${i}`,
    titulo,
    categoria,
    duracion,
    descripcion,
    audiencia: 'COLABORADOR',
  }),
)
