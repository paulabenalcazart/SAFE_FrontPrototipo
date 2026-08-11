import type {
  ColaboradorMarketplace,
  EspecialidadProfesional,
  HorarioDisponibilidad,
  ModalidadAtencion,
  ServicioProfesional,
} from '@/portal/types'
import type { BloqueoAgenda } from './catalogo'

export const HOY_MARKETPLACE = '2026-08-13'
export const AHORA_MARKETPLACE = `${HOY_MARKETPLACE}T12:00:00-05:00`

export type OrdenMarketplace =
  | 'RELEVANCIA'
  | 'MEJOR_CALIFICADOS'
  | 'MAS_RESENAS'
  | 'MENOR_PRECIO'
  | 'MAYOR_EXPERIENCIA'

export type FiltrosMarketplace = {
  busqueda: string
  especialidadId: string
  tarifaMaxima: number | null
  calificacionMinima: number | null
  modalidad: ModalidadAtencion | ''
  orden: OrdenMarketplace
}

export type PaginaMarketplace = {
  items: ColaboradorMarketplace[]
  total: number
  totalPaginas: number
  pagina: number
}

export type SlotMarketplace = {
  horaInicio: string
  horaFin: string
  ocupado: boolean
}

export const FILTROS_INICIALES: FiltrosMarketplace = {
  busqueda: '',
  especialidadId: '',
  tarifaMaxima: null,
  calificacionMinima: null,
  modalidad: '',
  orden: 'RELEVANCIA',
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function nombreCompleto(profesional: ColaboradorMarketplace): string {
  return `${profesional.nombres} ${profesional.apellidos}`.replace(/\s+/g, ' ').trim()
}

function esPublicable(profesional: ColaboradorMarketplace): boolean {
  return (
    profesional.visibleMarketplace &&
    profesional.estado === 'ACTIVO' &&
    profesional.estadoDisponibilidad === 'DISPONIBLE'
  )
}

function nombresEspecialidades(
  profesional: ColaboradorMarketplace,
  especialidades: EspecialidadProfesional[],
): string[] {
  const porId = new Map(especialidades.map((especialidad) => [especialidad.id, especialidad.nombre]))
  return profesional.especialidadIds
    .map((especialidadId) => porId.get(especialidadId))
    .filter((nombre): nombre is string => nombre !== undefined)
}

function coincideModalidad(
  modalidadProfesional: ModalidadAtencion,
  filtro: ModalidadAtencion | '',
): boolean {
  if (filtro === '') return true
  if (filtro === 'AMBAS') return modalidadProfesional === 'AMBAS'
  return modalidadProfesional === filtro || modalidadProfesional === 'AMBAS'
}

export function filtrarProfesionales({
  profesionales,
  especialidades,
  filtros,
}: {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  filtros: FiltrosMarketplace
}): ColaboradorMarketplace[] {
  const consulta = normalizar(filtros.busqueda)

  return profesionales.filter((profesional) => {
    if (!esPublicable(profesional)) return false
    if (
      filtros.especialidadId !== '' &&
      !profesional.especialidadIds.includes(filtros.especialidadId)
    ) {
      return false
    }
    if (filtros.tarifaMaxima !== null && profesional.tarifaReferencial > filtros.tarifaMaxima) {
      return false
    }
    if (
      filtros.calificacionMinima !== null &&
      profesional.calificacionPromedio < filtros.calificacionMinima
    ) {
      return false
    }
    if (!coincideModalidad(profesional.modalidadAtencion, filtros.modalidad)) return false
    if (consulta === '') return true

    const campos = [
      nombreCompleto(profesional),
      profesional.profesion,
      profesional.areaEspecializacion,
      profesional.descripcionProfesional,
      profesional.ciudadAtencion,
      ...nombresEspecialidades(profesional, especialidades),
    ]

    return campos.some((campo) => normalizar(campo).includes(consulta))
  })
}

function compararNombre(a: ColaboradorMarketplace, b: ColaboradorMarketplace): number {
  const comparacionNombre = nombreCompleto(a).localeCompare(nombreCompleto(b), 'es', {
    sensitivity: 'base',
  })
  if (comparacionNombre !== 0) return comparacionNombre
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

function compararRanking(a: ColaboradorMarketplace, b: ColaboradorMarketplace): number {
  return (
    b.calificacionPromedio - a.calificacionPromedio ||
    b.cantidadResenas - a.cantidadResenas ||
    compararNombre(a, b)
  )
}

function puntajeRelevancia(
  profesional: ColaboradorMarketplace,
  especialidades: EspecialidadProfesional[],
  consultaNormalizada: string,
): number {
  const nombre = normalizar(nombreCompleto(profesional))
  if (nombre === consultaNormalizada) return 3
  if (nombre.includes(consultaNormalizada)) return 2

  const camposPrincipales = [
    profesional.profesion,
    profesional.areaEspecializacion,
    ...nombresEspecialidades(profesional, especialidades),
  ]
  if (camposPrincipales.some((campo) => normalizar(campo).includes(consultaNormalizada))) return 1

  return 0
}

export function ordenarProfesionales({
  profesionales,
  especialidades,
  orden,
  busqueda = '',
}: {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  orden: OrdenMarketplace
  busqueda?: string
}): ColaboradorMarketplace[] {
  const consulta = normalizar(busqueda)

  return [...profesionales].sort((a, b) => {
    switch (orden) {
      case 'MEJOR_CALIFICADOS':
        return b.calificacionPromedio - a.calificacionPromedio || compararNombre(a, b)
      case 'MAS_RESENAS':
        return b.cantidadResenas - a.cantidadResenas || compararNombre(a, b)
      case 'MENOR_PRECIO':
        return a.tarifaReferencial - b.tarifaReferencial || compararNombre(a, b)
      case 'MAYOR_EXPERIENCIA':
        return b.aniosExperiencia - a.aniosExperiencia || compararNombre(a, b)
      case 'RELEVANCIA':
        if (consulta === '') return compararRanking(a, b)
        return (
          puntajeRelevancia(b, especialidades, consulta) -
            puntajeRelevancia(a, especialidades, consulta) || compararRanking(a, b)
        )
    }
  })
}

export function paginar({
  profesionales,
  paginaSolicitada,
  porPagina = 6,
}: {
  profesionales: ColaboradorMarketplace[]
  paginaSolicitada: number
  porPagina?: number
}): PaginaMarketplace {
  const tamanioPagina = Number.isFinite(porPagina) && porPagina > 0 ? Math.floor(porPagina) : 6
  const total = profesionales.length
  const totalPaginas = Math.ceil(total / tamanioPagina)

  if (totalPaginas === 0) {
    return { items: [], total, totalPaginas: 0, pagina: 0 }
  }

  const paginaEntera = Number.isFinite(paginaSolicitada) ? Math.floor(paginaSolicitada) : 1
  const pagina = Math.min(Math.max(paginaEntera, 1), totalPaginas)
  const inicio = (pagina - 1) * tamanioPagina

  return {
    items: profesionales.slice(inicio, inicio + tamanioPagina),
    total,
    totalPaginas,
    pagina,
  }
}

export function derivarDestacados({
  profesionales,
  cantidad = 10,
}: {
  profesionales: ColaboradorMarketplace[]
  cantidad?: number
}): ColaboradorMarketplace[] {
  const limite = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 10
  return profesionales.filter(esPublicable).sort(compararRanking).slice(0, limite)
}

function fechaUtc(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia))
}

function fechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = fechaUtc(fecha)
  resultado.setUTCDate(resultado.getUTCDate() + dias)
  return fechaIso(resultado)
}

export function diaSemanaIso(fecha: string): HorarioDisponibilidad['diaSemana'] {
  const diaUtc = fechaUtc(fecha).getUTCDay()
  return (diaUtc === 0 ? 7 : diaUtc) as HorarioDisponibilidad['diaSemana']
}

function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number)
  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return Number.NaN
  }
  return horas * 60 + minutos
}

function minutosAHora(minutosTotales: number): string {
  const horas = Math.floor(minutosTotales / 60)
  const minutos = minutosTotales % 60
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

function horarioCompatible(
  horario: HorarioDisponibilidad,
  servicio: { modalidad: ServicioProfesional['modalidad'] },
): boolean {
  return horario.modalidad === 'AMBAS' || horario.modalidad === servicio.modalidad
}

function seSolapan(inicioA: number, finA: number, inicioB: number, finB: number): boolean {
  return inicioA < finB && finA > inicioB
}

export function generarSlots({
  servicio,
  fecha,
  horarios,
  bloqueos,
}: {
  servicio: ServicioProfesional
  fecha: string
  horarios: HorarioDisponibilidad[]
  bloqueos: BloqueoAgenda[]
}): SlotMarketplace[] {
  if (!servicio.activo || fecha < HOY_MARKETPLACE || servicio.duracionEstimadaMinutos <= 0) return []

  const diaSemana = diaSemanaIso(fecha)
  const minutoActual = horaAMinutos(AHORA_MARKETPLACE.slice(11, 16))
  const slots: SlotMarketplace[] = []
  const vistos = new Set<string>()

  const franjas = horarios.filter(
    (horario) =>
      horario.activo &&
      horario.colaboradorId === servicio.colaboradorId &&
      horario.diaSemana === diaSemana &&
      horarioCompatible(horario, servicio),
  )

  for (const franja of franjas) {
    const inicioFranja = horaAMinutos(franja.horaInicio)
    const finFranja = horaAMinutos(franja.horaFin)
    if (!Number.isFinite(inicioFranja) || !Number.isFinite(finFranja) || inicioFranja >= finFranja) {
      continue
    }

    for (
      let inicio = inicioFranja;
      inicio + servicio.duracionEstimadaMinutos <= finFranja;
      inicio += servicio.duracionEstimadaMinutos
    ) {
      if (fecha === HOY_MARKETPLACE && inicio < minutoActual) continue

      const fin = inicio + servicio.duracionEstimadaMinutos
      const horaInicio = minutosAHora(inicio)
      const horaFin = minutosAHora(fin)
      const clave = `${horaInicio}-${horaFin}`
      if (vistos.has(clave)) continue

      const ocupado = bloqueos.some((bloqueo) => {
        if (bloqueo.colaboradorId !== servicio.colaboradorId || bloqueo.fecha !== fecha) return false
        const inicioBloqueo = horaAMinutos(bloqueo.horaInicio)
        const finBloqueo = horaAMinutos(bloqueo.horaFin)
        return (
          Number.isFinite(inicioBloqueo) &&
          Number.isFinite(finBloqueo) &&
          seSolapan(inicio, fin, inicioBloqueo, finBloqueo)
        )
      })

      vistos.add(clave)
      slots.push({ horaInicio, horaFin, ocupado })
    }
  }

  return slots.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
}

export function proximasFechasDisponibles({
  servicio,
  horarios,
  bloqueos,
  cantidad = 5,
  diasMaximos = 30,
  desde = HOY_MARKETPLACE,
}: {
  servicio: ServicioProfesional
  horarios: HorarioDisponibilidad[]
  bloqueos: BloqueoAgenda[]
  cantidad?: number
  diasMaximos?: number
  desde?: string
}): string[] {
  const limite = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 5
  const alcance = Number.isFinite(diasMaximos) ? Math.max(0, Math.floor(diasMaximos)) : 30
  const fechaBase = desde < HOY_MARKETPLACE ? HOY_MARKETPLACE : desde
  const fechas: string[] = []

  for (let desplazamiento = 1; desplazamiento <= alcance && fechas.length < limite; desplazamiento++) {
    const fecha = sumarDias(fechaBase, desplazamiento)
    if (generarSlots({ servicio, fecha, horarios, bloqueos }).some((slot) => !slot.ocupado)) {
      fechas.push(fecha)
    }
  }

  return fechas
}

export function obtenerIniciales({
  nombres,
  apellidos,
}: {
  nombres: string
  apellidos: string
}): string {
  const primerNombre = nombres.trim().split(/\s+/)[0] ?? ''
  const primerApellido = apellidos.trim().split(/\s+/)[0] ?? ''
  return `${Array.from(primerNombre)[0] ?? ''}${Array.from(primerApellido)[0] ?? ''}`.toLocaleUpperCase(
    'es',
  )
}
