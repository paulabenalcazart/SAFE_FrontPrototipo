import type { Cita, Empresa, EspecialidadColaboradorRelacion, HorarioDisponibilidad, ModalidadAtencion, ResenaColaborador, SolicitudContacto } from '@/portal/types'

export function inicialesDeNombre(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = palabras[0]?.[0] ?? ''
  const segunda = palabras.length > 1 ? palabras[palabras.length - 1][0] : ''
  return `${primera}${segunda}`.toUpperCase()
}

export function contarSolicitudesPendientes(solicitudes: SolicitudContacto[]): number {
  return solicitudes.filter((s) => s.estado === 'ENVIADA').length
}

function mesDeIso(iso: string): string {
  return iso.slice(0, 7) // 'YYYY-MM'
}

export function contarCitasEsteMes(citas: Cita[], hoyIso: string): number {
  const mesActual = mesDeIso(hoyIso)
  return citas.filter(
    (c) => (c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA') && mesDeIso(c.fechaInicio) === mesActual,
  ).length
}

export function contarServiciosCompletados(citas: Cita[]): number {
  return citas.filter((c) => c.estado === 'COMPLETADA').length
}

export function contarCitasConfirmadasTotales(citas: Cita[]): number {
  return citas.filter((c) => c.estado === 'CONFIRMADA').length
}

export function contarCitasConfirmadasEsteMes(citas: Cita[], hoyIso: string): number {
  const mesActual = mesDeIso(hoyIso)
  return citas.filter((c) => c.estado === 'CONFIRMADA' && mesDeIso(c.fechaInicio) === mesActual).length
}

export function calcularCalificacionPromedio(
  resenas: ResenaColaborador[],
): { promedio: number | null; cantidad: number } {
  const publicadas = resenas.filter((r) => r.estado === 'PUBLICADA')
  if (publicadas.length === 0) return { promedio: null, cantidad: 0 }
  const suma = publicadas.reduce((acc, r) => acc + r.calificacion, 0)
  return { promedio: Math.round((suma / publicadas.length) * 10) / 10, cantidad: publicadas.length }
}

export type BloqueDisponibilidad = { horaInicio: string; horaFin: string; modalidad: HorarioDisponibilidad['modalidad'] }
export type DiaDisponibilidad = { diaSemana: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string; bloques: BloqueDisponibilidad[] }

const DIAS_SEMANA_LABEL: Record<DiaDisponibilidad['diaSemana'], string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

export function agruparDisponibilidadPorDia(horarios: HorarioDisponibilidad[]): DiaDisponibilidad[] {
  const dias: DiaDisponibilidad['diaSemana'][] = [1, 2, 3, 4, 5, 6, 7]
  return dias.map((diaSemana) => ({
    diaSemana,
    label: DIAS_SEMANA_LABEL[diaSemana],
    bloques: horarios
      .filter((h) => h.activo && h.diaSemana === diaSemana)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .map((h) => ({ horaInicio: h.horaInicio, horaFin: h.horaFin, modalidad: h.modalidad })),
  }))
}

export function obtenerSolicitudMasReciente(solicitudes: SolicitudContacto[]): SolicitudContacto | null {
  const pendientes = solicitudes
    .filter((s) => s.estado === 'ENVIADA')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return pendientes[0] ?? null
}

const ACEPTADAS: SolicitudContacto['estado'][] = ['ACEPTADA', 'CONTACTO_LIBERADO', 'FINALIZADA']

export function calcularTasaAceptacion(
  solicitudes: SolicitudContacto[],
): { tasa: number | null; aceptadas: number; respondidas: number } {
  const aceptadas = solicitudes.filter((s) => ACEPTADAS.includes(s.estado)).length
  const rechazadas = solicitudes.filter((s) => s.estado === 'RECHAZADA').length
  const respondidas = aceptadas + rechazadas
  if (respondidas === 0) return { tasa: null, aceptadas, respondidas }
  return { tasa: Math.round((aceptadas / respondidas) * 1000) / 10, aceptadas, respondidas }
}

export type ClaveMetricaRendimiento = 'SERVICIOS' | 'HORAS' | 'TIEMPO_RESPUESTA' | 'TASA_ACEPTACION'

export type PuntoSemanal = { semana: number; valor: number }

export type MetricaRendimiento = {
  clave: ClaveMetricaRendimiento
  titulo: string
  unidad: string
  serie: PuntoSemanal[]
  totalEsteMes: number
  totalMesAnterior: number
  variacion: number | null
  menorEsMejor: boolean
}

function semanaDelMes(iso: string): number {
  const dia = Number(iso.slice(8, 10))
  return Math.min(4, Math.ceil(dia / 7))
}

function mesAnteriorIso(hoyIso: string): string {
  const [anio, mes] = hoyIso.slice(0, 7).split('-').map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 2, 1))
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`
}

function horasEntre(inicioIso: string, finIso: string): number {
  return (new Date(finIso).getTime() - new Date(inicioIso).getTime()) / 3_600_000
}

function serieSemanal(items: { fecha: string; valor: number }[], mes: string): PuntoSemanal[] {
  const porSemana = new Map<number, number>()
  for (const item of items) {
    if (mesDeIso(item.fecha) !== mes) continue
    const semana = semanaDelMes(item.fecha)
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + item.valor)
  }
  return [1, 2, 3, 4]
    .filter((semana) => porSemana.has(semana))
    .map((semana) => ({ semana, valor: Math.round((porSemana.get(semana) ?? 0) * 10) / 10 }))
}

/**
 * Variante de `serieSemanal` para métricas que son un promedio (no una suma).
 * Agrupa por semana del mes y divide entre la cantidad de items de esa semana,
 * de modo que el punto del gráfico sea comparable con el promedio mensual.
 */
function serieSemanalPromedio(items: { fecha: string; valor: number }[], mes: string): PuntoSemanal[] {
  const porSemana = new Map<number, { suma: number; cantidad: number }>()
  for (const item of items) {
    if (mesDeIso(item.fecha) !== mes) continue
    const semana = semanaDelMes(item.fecha)
    const actual = porSemana.get(semana) ?? { suma: 0, cantidad: 0 }
    actual.suma += item.valor
    actual.cantidad += 1
    porSemana.set(semana, actual)
  }
  return [1, 2, 3, 4]
    .filter((semana) => porSemana.has(semana))
    .map((semana) => {
      const { suma, cantidad } = porSemana.get(semana) as { suma: number; cantidad: number }
      return { semana, valor: cantidad === 0 ? 0 : Math.round((suma / cantidad) * 10) / 10 }
    })
}

function variacionPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 1000) / 10
}

export function calcularRendimientoMensual({
  citas,
  solicitudes,
  hoyIso,
}: {
  citas: Cita[]
  solicitudes: SolicitudContacto[]
  hoyIso: string
}): MetricaRendimiento[] {
  const mesActual = mesDeIso(hoyIso)
  const mesPrevio = mesAnteriorIso(hoyIso)

  const completadas = citas.filter((c) => c.estado === 'COMPLETADA')
  const completadasPorMes = (mes: string) => completadas.filter((c) => mesDeIso(c.fechaInicio) === mes)

  const respondidas = solicitudes.filter((s) => s.fechaRespuesta)
  const respondidasPorMes = (mes: string) =>
    respondidas.filter((s) => mesDeIso(s.fechaRespuesta as string) === mes)

  // 1. Servicios completados
  const servTotal = (mes: string) => completadasPorMes(mes).length
  const servSerie = serieSemanal(completadas.map((c) => ({ fecha: c.fechaInicio, valor: 1 })), mesActual)

  // 2. Horas de asesoría
  const horasTotal = (mes: string) =>
    Math.round(completadasPorMes(mes).reduce((acc, c) => acc + horasEntre(c.fechaInicio, c.fechaFin), 0) * 10) / 10
  const horasSerie = serieSemanal(
    completadas.map((c) => ({ fecha: c.fechaInicio, valor: horasEntre(c.fechaInicio, c.fechaFin) })),
    mesActual,
  )

  // 3. Tiempo medio de respuesta (horas)
  const tiempoRespuestaTotal = (mes: string) => {
    const items = respondidasPorMes(mes)
    if (items.length === 0) return 0
    const suma = items.reduce((acc, s) => acc + horasEntre(s.createdAt, s.fechaRespuesta as string), 0)
    return Math.round((suma / items.length) * 10) / 10
  }
  const tiempoRespuestaSerie = serieSemanalPromedio(
    respondidas.map((s) => ({
      fecha: s.fechaRespuesta as string,
      valor: horasEntre(s.createdAt, s.fechaRespuesta as string),
    })),
    mesActual,
  )

  // 4. Tasa de aceptación (%)
  const tasaTotal = (mes: string) => {
    const items = respondidasPorMes(mes)
    const aceptadas = items.filter((s) => ACEPTADAS.includes(s.estado)).length
    return items.length === 0 ? 0 : Math.round((aceptadas / items.length) * 1000) / 10
  }
  const tasaSerie = (() => {
    const porSemana = new Map<number, { aceptadas: number; total: number }>()
    for (const s of respondidas) {
      if (mesDeIso(s.fechaRespuesta as string) !== mesActual) continue
      const semana = semanaDelMes(s.fechaRespuesta as string)
      const actual = porSemana.get(semana) ?? { aceptadas: 0, total: 0 }
      actual.total += 1
      if (ACEPTADAS.includes(s.estado)) actual.aceptadas += 1
      porSemana.set(semana, actual)
    }
    return [1, 2, 3, 4]
      .filter((semana) => porSemana.has(semana))
      .map((semana) => {
        const { aceptadas, total } = porSemana.get(semana) as { aceptadas: number; total: number }
        return { semana, valor: total === 0 ? 0 : Math.round((aceptadas / total) * 1000) / 10 }
      })
  })()

  return [
    {
      clave: 'SERVICIOS',
      titulo: 'Servicios completados',
      unidad: '',
      serie: servSerie,
      totalEsteMes: servTotal(mesActual),
      totalMesAnterior: servTotal(mesPrevio),
      variacion: variacionPct(servTotal(mesActual), servTotal(mesPrevio)),
      menorEsMejor: false,
    },
    {
      clave: 'HORAS',
      titulo: 'Horas de asesoría',
      unidad: 'h',
      serie: horasSerie,
      totalEsteMes: horasTotal(mesActual),
      totalMesAnterior: horasTotal(mesPrevio),
      variacion: variacionPct(horasTotal(mesActual), horasTotal(mesPrevio)),
      menorEsMejor: false,
    },
    {
      clave: 'TIEMPO_RESPUESTA',
      titulo: 'Tiempo medio de respuesta',
      unidad: 'h',
      serie: tiempoRespuestaSerie,
      totalEsteMes: tiempoRespuestaTotal(mesActual),
      totalMesAnterior: tiempoRespuestaTotal(mesPrevio),
      variacion: variacionPct(tiempoRespuestaTotal(mesActual), tiempoRespuestaTotal(mesPrevio)),
      menorEsMejor: true,
    },
    {
      clave: 'TASA_ACEPTACION',
      titulo: 'Tasa de aceptación',
      unidad: '%',
      serie: tasaSerie,
      totalEsteMes: tasaTotal(mesActual),
      totalMesAnterior: tasaTotal(mesPrevio),
      variacion: variacionPct(tasaTotal(mesActual), tasaTotal(mesPrevio)),
      menorEsMejor: false,
    },
  ]
}

export function validarEspecialidades(especialidades: EspecialidadColaboradorRelacion[]): string | null {
  const activas = especialidades.filter((e) => e.activo)
  if (activas.length === 0) return 'Debes tener al menos una especialidad activa.'
  const principales = activas.filter((e) => e.esPrincipal)
  if (principales.length !== 1) return 'Debes marcar exactamente una especialidad como principal.'
  const ids = activas.map((e) => e.especialidadId)
  if (new Set(ids).size !== ids.length) return 'No puedes repetir la misma especialidad.'
  if (especialidades.some((e) => e.aniosExperiencia < 0)) {
    return 'Los años de experiencia no pueden ser negativos.'
  }
  return null
}

export function modalidadesCompatibles(modalidadAtencion: ModalidadAtencion): HorarioDisponibilidad['modalidad'][] {
  if (modalidadAtencion === 'VIRTUAL') return ['VIRTUAL']
  if (modalidadAtencion === 'PRESENCIAL') return ['PRESENCIAL']
  return ['VIRTUAL', 'PRESENCIAL', 'AMBAS']
}

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN
  return h * 60 + m
}

export function haySolapamientoHorario(
  bloques: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>[],
  candidato: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>,
  ignorarIndice?: number,
): boolean {
  const inicioC = horaAMinutos(candidato.horaInicio)
  const finC = horaAMinutos(candidato.horaFin)
  return bloques.some((b, i) => {
    if (i === ignorarIndice) return false
    const inicio = horaAMinutos(b.horaInicio)
    const fin = horaAMinutos(b.horaFin)
    return inicioC < fin && finC > inicio
  })
}

export function validarBloqueHorario(bloque: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>): string | null {
  const inicio = horaAMinutos(bloque.horaInicio)
  const fin = horaAMinutos(bloque.horaFin)
  if (!Number.isFinite(inicio) || !Number.isFinite(fin)) {
    return 'Ingresa una hora válida.'
  }
  if (fin <= inicio) {
    return 'La hora de fin debe ser posterior a la hora de inicio.'
  }
  return null
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function buscarSolicitudesPorEmpresa<T extends { empresaId: string }>({
  items,
  busqueda,
  empresaPorId,
}: {
  items: T[]
  busqueda: string
  empresaPorId: (id: string) => Pick<Empresa, 'nombre' | 'general'> | undefined
}): T[] {
  const consulta = normalizarTexto(busqueda)
  if (consulta === '') return items
  return items.filter((item) => {
    const empresa = empresaPorId(item.empresaId)
    if (!empresa) return false
    return (
      normalizarTexto(empresa.nombre).includes(consulta) ||
      normalizarTexto(empresa.general.razonSocial).includes(consulta)
    )
  })
}
