import type { VideoTutorial } from '@/portal/types'

export const CATEGORIAS_TUTORIAL = [
  'Todos',
  'Primeros pasos',
  'Estados Financieros',
  'Indicadores Financieros',
  'Obligaciones Tributarias',
  'Simulador',
  'Marketplace',
  'Mi Plan',
] as const

const CATALOGO: [string, string, string, string][] = [
  ['Crea tu cuenta y registra tu empresa', 'Primeros pasos', '4:12', 'Recorrido por el registro de empresa en cuatro pasos.'],
  ['Conoce tu dashboard', 'Primeros pasos', '3:40', 'Qué significa cada KPI y cómo leer el resumen financiero.'],
  ['Cambia de empresa activa', 'Primeros pasos', '2:05', 'Cómo funciona el selector global de empresa.'],
  ['Tu primera carga financiera', 'Estados Financieros', '8:24', 'Los diez pasos de la carga y qué revisar en cada uno.'],
  ['Corrige un periodo ya publicado', 'Estados Financieros', '5:31', 'Cómo crear una corrección y qué pasa con las versiones.'],
  ['Cuadra tu balance', 'Estados Financieros', '6:02', 'Qué hacer cuando el descuadre supera un dólar.'],
  ['Compara dos periodos financieros', 'Estados Financieros', '4:55', 'Lectura de variaciones absolutas y porcentuales.'],
  ['Elige tus indicadores principales', 'Indicadores Financieros', '3:18', 'Cómo seleccionar los cuatro indicadores de tu tablero.'],
  ['Interpreta el semáforo', 'Indicadores Financieros', '5:44', 'Qué significa saludable, en observación y crítico.'],
  ['Lee tu salud financiera', 'Indicadores Financieros', '4:26', 'Cómo se ponderan liquidez, solvencia, gestión y rentabilidad.'],
  ['Tu calendario tributario', 'Obligaciones Tributarias', '5:09', 'Cómo SAFE genera tus obligaciones aplicables.'],
  ['Marca una obligación como cumplida', 'Obligaciones Tributarias', '2:48', 'Registro de fecha de cumplimiento y notas.'],
  ['Configura recordatorios', 'Obligaciones Tributarias', '3:02', 'Días de antelación y aviso por correo.'],
  ['Simula una contratación', 'Simulador', '7:15', 'Variables, resultados y nivel de riesgo del escenario laboral.'],
  ['Contrata un profesional', 'Marketplace', '6:38', 'Búsqueda, perfil, reserva y pago con comisión SAFE.'],
  ['Administra tu plan', 'Mi Plan', '4:03', 'Cambio de plan, métodos de pago e historial.'],
]

export const VIDEO_TUTORIALES: VideoTutorial[] = CATALOGO.map(([titulo, categoria, duracion, descripcion], i) => ({
  id: `tut-${i}`,
  titulo,
  categoria,
  duracion,
  descripcion,
}))
