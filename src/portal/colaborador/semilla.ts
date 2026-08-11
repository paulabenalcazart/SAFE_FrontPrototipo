import type {
  Cita,
  Empresa,
  EstadoSolicitudContacto,
  NotificacionColaborador,
  PreferenciaNotificacionColaborador,
  ServicioProfesional,
  SolicitudContacto,
} from '@/portal/types'
import { SERVICIOS_PROFESIONALES } from '@/portal/marketplace/catalogo'

function crearEmpresaSolicitante(datos: {
  id: string
  nombre: string
  ruc: string
  iniciales: string
  actividadEconomica: string
  provincia: string
  ciudad: string
  responsable: string
  cedulaResponsable: string
}): Empresa {
  return {
    id: datos.id,
    nombre: datos.nombre,
    ruc: datos.ruc,
    iniciales: datos.iniciales,
    estado: 'Activa',
    plan: 'Plan Crecimiento',
    general: {
      razonSocial: datos.nombre,
      tipoContribuyente: 'Persona Jurídica',
      fechaConstitucion: '',
      numeroEmpleados: '',
    },
    fiscal: {
      regimenTributario: 'Régimen General',
      actividadEconomica: datos.actividadEconomica,
      obligadoContabilidad: 'Sí',
      agenteRetencion: 'No',
    },
    contacto: { correo: '', telefono: '', sitioWeb: '' },
    representante: { nombre: datos.responsable, cedula: datos.cedulaResponsable },
    ubicacion: { provincia: datos.provincia, ciudad: datos.ciudad, direccion: '' },
    meta: { fechaRegistroSafe: '' },
  }
}

export const EMPRESAS_SOLICITANTES_SEMILLA: Empresa[] = [
  crearEmpresaSolicitante({
    id: 'sol-emp-01', nombre: 'Panadería La Colina', ruc: '0991234567001', iniciales: 'PL',
    actividadEconomica: 'C1071 - Elaboración de productos de panadería', provincia: 'Guayas', ciudad: 'Guayaquil',
    responsable: 'Juan Carlos Pérez', cedulaResponsable: '0912345001',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-02', nombre: 'Muebles Austro', ruc: '0192345678001', iniciales: 'MA',
    actividadEconomica: 'C3100 - Fabricación de muebles', provincia: 'Azuay', ciudad: 'Cuenca',
    responsable: 'Pedro Mora Ramírez', cedulaResponsable: '0102345002',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-03', nombre: 'Logística Azul', ruc: '0993456789001', iniciales: 'LA',
    actividadEconomica: 'H4923 - Transporte de carga por carretera', provincia: 'Guayas', ciudad: 'Guayaquil',
    responsable: 'José Roca Vintimilla', cedulaResponsable: '0912345003',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-04', nombre: 'Ferretería Ambato', ruc: '1892345678001', iniciales: 'FA',
    actividadEconomica: 'G4752 - Venta al por menor de artículos de ferretería', provincia: 'Tungurahua', ciudad: 'Ambato',
    responsable: 'Lucía Cabrera Zamora', cedulaResponsable: '1802345004',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-05', nombre: 'AgroLoja', ruc: '1192345678001', iniciales: 'AL',
    actividadEconomica: 'A0111 - Cultivo de cereales', provincia: 'Loja', ciudad: 'Loja',
    responsable: 'Mateo Ibarra Nieto', cedulaResponsable: '1102345005',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-06', nombre: 'Hostería Tomebamba', ruc: '0193456789001', iniciales: 'HT',
    actividadEconomica: 'I5510 - Actividades de alojamiento', provincia: 'Azuay', ciudad: 'Cuenca',
    responsable: 'Gabriela Mendoza Cruz', cedulaResponsable: '0102345006',
  }),
]

export function empresaSolicitantePorId(id: string): Empresa | undefined {
  return EMPRESAS_SOLICITANTES_SEMILLA.find((e) => e.id === id)
}

const HOY_COLABORADOR = '2026-08-13'
const SERVICIOS_MFL = SERVICIOS_PROFESIONALES.filter((s) => s.colaboradorId === 'col-mfl')

function desplazarDias(fechaIso: string, dias: number): string {
  const fecha = new Date(`${fechaIso}T12:00:00-05:00`)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return fecha.toISOString().slice(0, 10)
}

function fechaIsoDesde(hoyIso: string, diasAtras: number): string {
  return desplazarDias(hoyIso, -diasAtras)
}

/** Día ISO de la semana (1 = lunes … 7 = domingo) de una fecha `YYYY-MM-DD`. */
function diaSemanaDeIso(fechaIso: string): number {
  const dia = new Date(`${fechaIso}T12:00:00-05:00`).getUTCDay()
  return dia === 0 ? 7 : dia
}

/** Mueve la fecha hacia atrás (-1) o hacia adelante (+1) hasta caer en `diaSemana`. */
function ajustarADiaSemana(fechaIso: string, diaSemana: number, direccion: -1 | 1): string {
  const actual = diaSemanaDeIso(fechaIso)
  const delta = direccion === 1 ? (diaSemana - actual + 7) % 7 : (actual - diaSemana + 7) % 7
  return desplazarDias(fechaIso, direccion * delta)
}

type RanuraDisponible = { diaSemana: number; hora: string }

/**
 * Combinaciones (día de semana, hora de inicio) válidas para cada servicio de `col-mfl`.
 *
 * Verificadas contra `HORARIOS_DISPONIBILIDAD` de `col-mfl`:
 *   lun 08:00-12:00 VIRTUAL · lun 14:00-17:00 PRESENCIAL · mar 08:00-17:00 VIRTUAL
 *   mié 08:00-12:00 AMBAS   · jue 09:00-17:00 AMBAS      · vie 08:00-15:00 VIRTUAL
 *   sáb 09:00-12:00 VIRTUAL (no hay atención los domingos)
 *
 * En cada ranura la duración completa del servicio entra antes del `horaFin` del bloque
 * y la modalidad del bloque es compatible con la modalidad del servicio.
 */
const RANURAS_POR_SERVICIO: Record<string, RanuraDisponible[]> = {
  // Diagnóstico financiero · 60 min · VIRTUAL
  'srv-col-mfl-01': [
    { diaSemana: 1, hora: '08:00' },
    { diaSemana: 2, hora: '10:00' },
    { diaSemana: 3, hora: '09:00' },
    { diaSemana: 4, hora: '11:00' },
    { diaSemana: 5, hora: '13:00' },
    { diaSemana: 6, hora: '10:00' },
  ],
  // Planificación financiera · 90 min · VIRTUAL
  'srv-col-mfl-02': [
    { diaSemana: 2, hora: '08:00' },
    { diaSemana: 4, hora: '09:00' },
    { diaSemana: 5, hora: '10:00' },
    { diaSemana: 1, hora: '09:00' },
    { diaSemana: 3, hora: '10:00' },
    { diaSemana: 2, hora: '14:00' },
  ],
  // Revisión de flujo de caja · 60 min · VIRTUAL
  'srv-col-mfl-03': [
    { diaSemana: 5, hora: '08:00' },
    { diaSemana: 3, hora: '11:00' },
    { diaSemana: 4, hora: '15:00' },
    { diaSemana: 2, hora: '12:00' },
    { diaSemana: 6, hora: '09:00' },
    { diaSemana: 1, hora: '10:00' },
  ],
  // Asesoría para financiamiento · 90 min · PRESENCIAL (solo bloques PRESENCIAL o AMBAS)
  'srv-col-mfl-04': [
    { diaSemana: 1, hora: '14:00' },
    { diaSemana: 4, hora: '10:00' },
    { diaSemana: 3, hora: '08:00' },
    { diaSemana: 4, hora: '13:00' },
    { diaSemana: 1, hora: '15:00' },
    { diaSemana: 4, hora: '09:00' },
  ],
}

const RANURAS_POR_DEFECTO = RANURAS_POR_SERVICIO['srv-col-mfl-01']

type IntervaloOcupado = { inicio: number; fin: number }

/**
 * Elige una ranura válida para `servicio` cercana a `fechaBase` y la reserva en `ocupados`
 * para que dos citas/solicitudes del mismo colaborador nunca se solapen. Si la ranura ya
 * está tomada, salta a la misma ranura de la semana siguiente/anterior (sigue siendo válida
 * porque conserva el día de la semana y la hora).
 */
function reservarRanura({
  servicio,
  indiceRanura,
  fechaBase,
  direccion,
  ocupados,
}: {
  servicio: ServicioProfesional
  indiceRanura: number
  fechaBase: string
  direccion: -1 | 1
  ocupados: IntervaloOcupado[]
}): { fecha: string; hora: string } {
  const ranuras = RANURAS_POR_SERVICIO[servicio.id] ?? RANURAS_POR_DEFECTO
  const ranura = ranuras[indiceRanura % ranuras.length]
  let fecha = ajustarADiaSemana(fechaBase, ranura.diaSemana, direccion)
  for (let intento = 0; intento < 60; intento++) {
    const inicio = new Date(`${fecha}T${ranura.hora}:00-05:00`).getTime()
    const fin = inicio + servicio.duracionEstimadaMinutos * 60_000
    if (!ocupados.some((o) => inicio < o.fin && fin > o.inicio)) {
      ocupados.push({ inicio, fin })
      return { fecha, hora: ranura.hora }
    }
    fecha = desplazarDias(fecha, direccion * 7)
  }
  return { fecha, hora: ranura.hora }
}

function construirHistoricoFinalizado(cantidad: number, ocupados: IntervaloOcupado[]): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    // Las 4 primeras caen en agosto (antes de HOY) para que el panel "Rendimiento del mes"
    // tenga datos en la pestaña por defecto; el resto se reparte en los ~6 meses previos.
    const diasAtras = i < 4 ? 1 + i * 2 : 20 + (i - 4) * 5
    const { fecha: fechaCita, hora: horaInicio } = reservarRanura({
      servicio,
      indiceRanura: Math.floor(i / SERVICIOS_MFL.length),
      fechaBase: fechaIsoDesde(HOY_COLABORADOR, diasAtras),
      direccion: -1,
      ocupados,
    })
    const fechaSolicitud = desplazarDias(fechaCita, -4)
    const fechaRespuesta = desplazarDias(fechaCita, -3)
    const solicitudId = `sol-mfl-hist-${String(i + 1).padStart(3, '0')}`
    const fin = new Date(`${fechaCita}T${horaInicio}:00-05:00`)
    fin.setUTCMinutes(fin.getUTCMinutes() + servicio.duracionEstimadaMinutos)

    solicitudes.push({
      id: solicitudId,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaCita,
      horaPreferida: horaInicio,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'FINALIZADA',
      fechaRespuesta: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:00:00-05:00`,
      contactoLiberadoAt: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:05:00-05:00`,
      createdAt: `${fechaSolicitud}T10:00:00-05:00`,
    })

    citas.push({
      id: `cita-mfl-hist-${String(i + 1).padStart(3, '0')}`,
      solicitudContactoId: solicitudId,
      colaboradorId: 'col-mfl',
      fechaInicio: `${fechaCita}T${horaInicio}:00-05:00`,
      fechaFin: fin.toISOString(),
      modalidad: servicio.modalidad,
      estado: 'COMPLETADA',
      createdAt: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:05:00-05:00`,
    })
  }

  return { solicitudes, citas }
}

function construirEnCurso(cantidad: number, cantidadEsteMes: number, ocupados: IntervaloOcupado[]): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    // Las primeras `cantidadEsteMes` caen en agosto (después del 13); el resto, en septiembre/octubre.
    const diasAdelante = i < cantidadEsteMes ? 2 + i * 2 : 20 + (i - cantidadEsteMes) * 4
    const { fecha: fechaCita, hora: horaInicio } = reservarRanura({
      servicio,
      indiceRanura: Math.floor(i / SERVICIOS_MFL.length),
      fechaBase: desplazarDias(HOY_COLABORADOR, diasAdelante),
      direccion: 1,
      ocupados,
    })
    const solicitudId = `sol-mfl-curso-${String(i + 1).padStart(3, '0')}`
    const fin = new Date(`${fechaCita}T${horaInicio}:00-05:00`)
    fin.setUTCMinutes(fin.getUTCMinutes() + servicio.duracionEstimadaMinutos)
    // Las respuestas se reparten entre el 3 y el 12 de agosto (semanas 1 y 2 del mes)
    // para que la serie semanal del panel de rendimiento tenga más de un punto.
    const diasRespuesta = 1 + (i % 10)
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, diasRespuesta)
    const fechaSolicitud = fechaIsoDesde(HOY_COLABORADOR, diasRespuesta + 1)
    const horaRespuesta = String(9 + (i % 5)).padStart(2, '0')

    solicitudes.push({
      id: solicitudId,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaCita,
      horaPreferida: horaInicio,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'CONTACTO_LIBERADO',
      fechaRespuesta: `${fechaRespuesta}T${horaRespuesta}:00:00-05:00`,
      contactoLiberadoAt: `${fechaRespuesta}T${horaRespuesta}:05:00-05:00`,
      createdAt: `${fechaSolicitud}T09:00:00-05:00`,
    })

    citas.push({
      id: `cita-mfl-curso-${String(i + 1).padStart(3, '0')}`,
      solicitudContactoId: solicitudId,
      colaboradorId: 'col-mfl',
      fechaInicio: `${fechaCita}T${horaInicio}:00-05:00`,
      fechaFin: fin.toISOString(),
      modalidad: servicio.modalidad,
      estado: 'CONFIRMADA',
      createdAt: `${fechaRespuesta}T${horaRespuesta}:05:00-05:00`,
    })
  }

  return { solicitudes, citas }
}

function construirPendientes(cantidad: number, ocupados: IntervaloOcupado[]): SolicitudContacto[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    // Fechas cercanas (a partir de pasado mañana) y siempre dentro de un bloque disponible,
    // para que aceptar cualquiera de estas solicitudes sea un camino feliz válido.
    const { fecha, hora } = reservarRanura({
      servicio,
      indiceRanura: Math.floor(i / SERVICIOS_MFL.length) + 3,
      fechaBase: desplazarDias(HOY_COLABORADOR, 3 + i),
      direccion: 1,
      ocupados,
    })
    const fechaCreacion = fechaIsoDesde(HOY_COLABORADOR, i % 4)
    return {
      id: `sol-mfl-pend-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fecha,
      horaPreferida: hora,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'ENVIADA' as EstadoSolicitudContacto,
      createdAt: `${fechaCreacion}T${String(9 + (i % 7)).padStart(2, '0')}:30:00-05:00`,
    }
  })
}

function construirRechazadas(cantidad: number): SolicitudContacto[] {
  const motivos = [
    'No tengo disponibilidad para la fecha solicitada.',
    'El servicio solicitado no corresponde a mi área de especialización.',
    'La empresa solicitó reagendar y no confirmó una nueva fecha.',
  ]
  return Array.from({ length: cantidad }, (_, i) => {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const fechaCreacion = fechaIsoDesde(HOY_COLABORADOR, 15 + i * 6)
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, 14 + i * 6)
    // Nunca llegaron a agendarse, pero la fecha/hora pedida igual respeta la disponibilidad
    // real (no se reservan en `ocupados` porque no ocupan agenda).
    const { fecha, hora } = reservarRanura({
      servicio,
      indiceRanura: i,
      fechaBase: fechaIsoDesde(HOY_COLABORADOR, 10 + i * 6),
      direccion: -1,
      ocupados: [],
    })
    return {
      id: `sol-mfl-rech-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fecha,
      horaPreferida: hora,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'RECHAZADA' as EstadoSolicitudContacto,
      fechaRespuesta: `${fechaRespuesta}T12:00:00-05:00`,
      motivoRechazo: motivos[i % motivos.length],
      createdAt: `${fechaCreacion}T09:00:00-05:00`,
    }
  })
}

// Agenda compartida: garantiza que ninguna cita/solicitud generada se solape con otra.
const AGENDA_OCUPADA: IntervaloOcupado[] = []
const historico = construirHistoricoFinalizado(38, AGENDA_OCUPADA)
const enCurso = construirEnCurso(18, 5, AGENDA_OCUPADA)
const pendientes = construirPendientes(12, AGENDA_OCUPADA)
const rechazadas = construirRechazadas(9)

export const SOLICITUDES_COLABORADOR_SEMILLA: SolicitudContacto[] = [
  ...pendientes,
  ...enCurso.solicitudes,
  ...historico.solicitudes,
  ...rechazadas,
]

export const CITAS_COLABORADOR_SEMILLA: Cita[] = [...enCurso.citas, ...historico.citas]

export const NOTIFICACIONES_COLABORADOR_SEMILLA: NotificacionColaborador[] = [
  {
    id: 'notif-mfl-01',
    tipo: 'NEW_REQUEST',
    titulo: 'Nueva solicitud recibida',
    mensaje: 'Ferretería Ambato solicitó Diagnóstico financiero.',
    prioridad: 'ALTA',
    leida: false,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 0)}T08:30:00-05:00`,
  },
  {
    id: 'notif-mfl-02',
    tipo: 'APPOINTMENT_REMINDER',
    titulo: 'Recordatorio de cita',
    mensaje: 'Tienes una cita confirmada mañana a las 09:00.',
    prioridad: 'NORMAL',
    leida: false,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 0)}T07:00:00-05:00`,
  },
  {
    id: 'notif-mfl-03',
    tipo: 'CANCELLATION_RESCHEDULE',
    titulo: 'Cita cancelada',
    mensaje: 'Logística Azul canceló su cita del 5 de agosto.',
    prioridad: 'URGENTE',
    leida: true,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 5)}T11:15:00-05:00`,
  },
  {
    id: 'notif-mfl-04',
    tipo: 'NEW_REVIEW',
    titulo: 'Nueva reseña recibida',
    mensaje: 'Recibiste una reseña de 5 estrellas de Panadería La Colina.',
    prioridad: 'NORMAL',
    leida: true,
    enlaceDestino: '/app/perfil/resenas',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 3)}T16:00:00-05:00`,
  },
  {
    id: 'notif-mfl-05',
    tipo: 'PRODUCT_UPDATES',
    titulo: 'Novedades de SAFE',
    mensaje: 'Ahora puedes administrar tus horarios directamente desde el Dashboard.',
    prioridad: 'BAJA',
    leida: true,
    enlaceDestino: '/app/dashboard',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 10)}T09:00:00-05:00`,
  },
]

export const PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA: PreferenciaNotificacionColaborador[] = [
  { categoria: 'NEW_REQUEST', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'APPOINTMENT_REMINDER', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'CANCELLATION_RESCHEDULE', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'NEW_REVIEW', correoActivo: true, frecuencia: 'SEMANAL' },
  { categoria: 'PRODUCT_UPDATES', correoActivo: true, frecuencia: 'SEMANAL' },
]

export const HOY_COLABORADOR_ISO = HOY_COLABORADOR
