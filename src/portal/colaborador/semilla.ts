import type {
  Cita,
  Empresa,
  EstadoSolicitudContacto,
  NotificacionColaborador,
  PreferenciaNotificacionColaborador,
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

function fechaIsoDesde(hoyIso: string, diasAtras: number): string {
  const fecha = new Date(`${hoyIso}T12:00:00-05:00`)
  fecha.setUTCDate(fecha.getUTCDate() - diasAtras)
  return fecha.toISOString().slice(0, 10)
}

function construirHistoricoFinalizado(cantidad: number): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const diasAtras = 20 + i * 5 // reparte ~38 citas entre ~20 y ~205 días atrás (7 meses)
    const fechaCita = fechaIsoDesde(HOY_COLABORADOR, diasAtras)
    const fechaSolicitud = fechaIsoDesde(HOY_COLABORADOR, diasAtras + 4)
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, diasAtras + 3)
    const solicitudId = `sol-mfl-hist-${String(i + 1).padStart(3, '0')}`
    const horaInicio = ['08:00', '09:00', '10:00', '14:00'][i % 4]
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

function construirEnCurso(cantidad: number, cantidadEsteMes: number): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    // Las primeras `cantidadEsteMes` caen en agosto (después del 13); el resto, en septiembre/octubre.
    const diasAdelante = i < cantidadEsteMes ? 2 + i * 3 : 20 + (i - cantidadEsteMes) * 4
    const fechaCita = (() => {
      const fecha = new Date(`${HOY_COLABORADOR}T12:00:00-05:00`)
      fecha.setUTCDate(fecha.getUTCDate() + diasAdelante)
      return fecha.toISOString().slice(0, 10)
    })()
    const solicitudId = `sol-mfl-curso-${String(i + 1).padStart(3, '0')}`
    const horaInicio = ['09:00', '11:00', '14:00', '15:00'][i % 4]
    const fin = new Date(`${fechaCita}T${horaInicio}:00-05:00`)
    fin.setUTCMinutes(fin.getUTCMinutes() + servicio.duracionEstimadaMinutos)
    const fechaSolicitud = fechaIsoDesde(HOY_COLABORADOR, 6 - (i % 5))
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, 5 - (i % 5))

    solicitudes.push({
      id: solicitudId,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaCita,
      horaPreferida: horaInicio,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'CONTACTO_LIBERADO',
      fechaRespuesta: `${fechaRespuesta}T11:00:00-05:00`,
      contactoLiberadoAt: `${fechaRespuesta}T11:05:00-05:00`,
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
      createdAt: `${fechaRespuesta}T11:05:00-05:00`,
    })
  }

  return { solicitudes, citas }
}

function construirPendientes(cantidad: number): SolicitudContacto[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const diasAdelante = 3 + i * 2
    const fecha = new Date(`${HOY_COLABORADOR}T12:00:00-05:00`)
    fecha.setUTCDate(fecha.getUTCDate() + diasAdelante)
    const fechaCreacion = fechaIsoDesde(HOY_COLABORADOR, i % 4)
    return {
      id: `sol-mfl-pend-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fecha.toISOString().slice(0, 10),
      horaPreferida: ['08:00', '10:00', '13:00', '16:00'][i % 4],
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
    return {
      id: `sol-mfl-rech-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaIsoDesde(HOY_COLABORADOR, 10 + i * 6),
      horaPreferida: '10:00',
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'RECHAZADA' as EstadoSolicitudContacto,
      fechaRespuesta: `${fechaRespuesta}T12:00:00-05:00`,
      motivoRechazo: motivos[i % motivos.length],
      createdAt: `${fechaCreacion}T09:00:00-05:00`,
    }
  })
}

const historico = construirHistoricoFinalizado(38)
const enCurso = construirEnCurso(18, 5)
const pendientes = construirPendientes(12)
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
