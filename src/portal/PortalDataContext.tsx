import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  Cita,
  CategoriaNotificacionColaborador,
  ColaboradorMarketplace,
  Empresa,
  EspecialidadColaboradorRelacion,
  HorarioDisponibilidad,
  MetodoPago,
  ModalidadAtencion,
  NotificacionColaborador,
  NuevaSolicitudContacto,
  NuevoMetodoPago,
  ObligacionEmpresa,
  PagoSuscripcion,
  PlanCodigo,
  PreferenciaNotificacionColaborador,
  PreferenciaUsuario,
  RegistroFinanciero,
  ServicioProfesional,
  Simulacion,
  SolicitudContacto,
} from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
  obligacionesEmpresaSemilla,
  simulacionesSemilla,
  solicitudesContactoSemilla,
  planActivoCodigoSemilla,
  suscripcionSemilla,
  metodosPagoSemilla,
  historialPagosSemilla,
  preferenciaUsuarioSemilla,
} from './data/mock-portal-data'
import { HOY_OBLIGACIONES } from './obligaciones/calculo'
import {
  COLABORADORES_MARKETPLACE,
  HORARIOS_DISPONIBILIDAD,
  SERVICIOS_PROFESIONALES,
} from './marketplace/catalogo'
import { AHORA_MARKETPLACE, diaSemanaIso } from './marketplace/calculo'
import { detectarMarca } from './plan/calculo'
import {
  CITAS_COLABORADOR_SEMILLA,
  NOTIFICACIONES_COLABORADOR_SEMILLA,
  PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA,
  SOLICITUDES_COLABORADOR_SEMILLA,
} from './colaborador/semilla'
import type { ServiceIconKey } from './colaborador/iconos-servicio'

// Iconos por defecto para los 4 servicios semilla del colaborador de prueba (col-mfl), definidos por
// Sección 12.5/13.7 del prompt. `iconKey` es un concepto puramente de UI — no existe columna SQL para él en
// `ServicioProfesional` (que sí mapea a una tabla real) — por eso vive en su propia franja de estado aquí,
// igual que el resto de datos "mock" del portal.
const ICONOS_SERVICIO_SEMILLA: Record<string, ServiceIconKey> = {
  'srv-col-mfl-01': 'analytics',
  'srv-col-mfl-02': 'growth',
  'srv-col-mfl-03': 'calculator',
  'srv-col-mfl-04': 'business',
}

type PortalDataContextValue = {
  empresas: Empresa[]
  empresaActivaId: string
  empresaActiva: Empresa
  setEmpresaActiva: (id: string) => void
  addEmpresa: (empresa: Empresa) => void
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void
  registrosFinancieros: Record<string, RegistroFinanciero[]>
  addRegistroFinanciero: (empresaId: string, registro: RegistroFinanciero) => void
  updateRegistroFinanciero: (empresaId: string, id: string, patch: Partial<RegistroFinanciero>) => void
  indicadoresPrincipales: Record<string, string[]>
  setIndicadoresPrincipales: (empresaId: string, codigos: string[]) => void
  obligacionesEmpresa: Record<string, ObligacionEmpresa[]>
  marcarObligacionCumplida: (empresaId: string, id: string) => void
  toggleRecordatorioObligacion: (empresaId: string, id: string) => void
  simulaciones: Record<string, Simulacion[]>
  guardarSimulacion: (empresaId: string, sim: Simulacion) => void
  solicitudesContacto: Record<string, SolicitudContacto[]>
  enviarSolicitudContacto: (
    empresaId: string,
    nueva: NuevaSolicitudContacto,
  ) => SolicitudContacto | null
  planActivoCodigo: PlanCodigo
  cambiarPlan: (codigo: PlanCodigo) => void
  renovacionAutomatica: boolean
  toggleRenovacionAutomatica: () => void
  suscripcionCancelada: boolean
  motivoCancelacion: string | null
  cancelarSuscripcion: (motivo: string) => void
  metodosPago: MetodoPago[]
  agregarMetodoPago: (nuevo: NuevoMetodoPago) => MetodoPago | null
  editarExpiracionMetodoPago: (id: string, mes: number, anio: number) => void
  hacerMetodoPredeterminado: (id: string) => void
  eliminarMetodoPago: (id: string) => boolean
  historialPagos: PagoSuscripcion[]
  preferencias: PreferenciaUsuario
  actualizarPreferencia: <K extends keyof PreferenciaUsuario>(clave: K, valor: PreferenciaUsuario[K]) => void
  colaboradorPerfil: ColaboradorMarketplace
  actualizarColaboradorPerfil: (patch: Partial<ColaboradorMarketplace>) => void
  actualizarEspecialidadesColaborador: (especialidades: EspecialidadColaboradorRelacion[]) => void
  desactivarCuentaColaborador: () => void
  serviciosColaborador: ServicioProfesional[]
  agregarServicioColaborador: (
    servicio: Omit<ServicioProfesional, 'id' | 'colaboradorId' | 'activo'>,
  ) => ServicioProfesional
  actualizarServicioColaborador: (id: string, patch: Partial<ServicioProfesional>) => void
  desactivarServicioColaborador: (id: string) => void
  iconosServicio: Record<string, ServiceIconKey>
  establecerIconoServicio: (servicioId: string, iconKey: ServiceIconKey) => void
  horariosColaborador: HorarioDisponibilidad[]
  guardarHorariosColaborador: (horarios: HorarioDisponibilidad[]) => void
  solicitudesColaborador: SolicitudContacto[]
  aceptarSolicitudColaborador: (
    solicitudId: string,
    modalidadElegida: Exclude<ModalidadAtencion, 'AMBAS'>,
  ) => { ok: true; cita: Cita } | { ok: false; motivo: string }
  rechazarSolicitudColaborador: (solicitudId: string, motivoRechazo: string) => boolean
  citasColaborador: Cita[]
  notificacionesColaborador: NotificacionColaborador[]
  marcarNotificacionColaboradorLeida: (id: string) => void
  marcarTodasNotificacionesColaboradorLeidas: () => void
  preferenciasNotificacionColaborador: PreferenciaNotificacionColaborador[]
  actualizarPreferenciaNotificacionColaborador: (
    categoria: CategoriaNotificacionColaborador,
    patch: Partial<Pick<PreferenciaNotificacionColaborador, 'correoActivo' | 'frecuencia'>>,
  ) => void
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

function horaHHMMAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number)
  return horas * 60 + minutos
}

function validarYAceptar({
  solicitud,
  servicio,
  horarios,
  citasExistentes,
  modalidadElegida,
}: {
  solicitud: SolicitudContacto
  servicio: ServicioProfesional | undefined
  horarios: HorarioDisponibilidad[]
  citasExistentes: Cita[]
  modalidadElegida: Exclude<ModalidadAtencion, 'AMBAS'>
}): { ok: true; cita: Cita; solicitudActualizada: SolicitudContacto } | { ok: false; motivo: string } {
  if (solicitud.estado !== 'ENVIADA') return { ok: false, motivo: 'La solicitud ya fue respondida.' }
  if (!servicio || !servicio.activo || servicio.colaboradorId !== solicitud.colaboradorId) {
    return { ok: false, motivo: 'El servicio solicitado ya no está disponible.' }
  }
  if (!solicitud.fechaPreferida || !solicitud.horaPreferida) {
    return { ok: false, motivo: 'La solicitud no tiene fecha u hora preferida.' }
  }
  if (modalidadElegida !== servicio.modalidad) {
    return { ok: false, motivo: 'La modalidad elegida no corresponde a la del servicio solicitado.' }
  }
  const inicio = new Date(`${solicitud.fechaPreferida}T${solicitud.horaPreferida}:00-05:00`)
  if (inicio.getTime() < Date.now() - 24 * 3_600_000) {
    // Margen de 24h para no invalidar seeds "de hoy" por diferencia de reloj del navegador.
    return { ok: false, motivo: 'La fecha solicitada ya pasó.' }
  }
  const fin = new Date(inicio.getTime() + servicio.duracionEstimadaMinutos * 60_000)

  const diaSemana = diaSemanaIso(solicitud.fechaPreferida)
  const minutoInicio = horaHHMMAMinutos(solicitud.horaPreferida)
  const minutoFin = minutoInicio + servicio.duracionEstimadaMinutos
  // La duración completa del servicio debe entrar dentro del bloque, no solo su hora de inicio.
  const bloqueValido = horarios.some(
    (h) =>
      h.activo &&
      h.diaSemana === diaSemana &&
      (h.modalidad === 'AMBAS' || h.modalidad === modalidadElegida) &&
      horaHHMMAMinutos(h.horaInicio) <= minutoInicio &&
      minutoFin <= horaHHMMAMinutos(h.horaFin),
  )
  if (!bloqueValido) return { ok: false, motivo: 'El horario solicitado ya no está disponible.' }

  const seSolapaConOtraCita = citasExistentes.some((c) => {
    if (c.estado === 'CANCELADA') return false
    const inicioC = new Date(c.fechaInicio).getTime()
    const finC = new Date(c.fechaFin).getTime()
    return inicio.getTime() < finC && fin.getTime() > inicioC
  })
  if (seSolapaConOtraCita) return { ok: false, motivo: 'El horario solicitado ya no está disponible.' }

  const ahora = new Date().toISOString()
  const cita: Cita = {
    id: crypto.randomUUID(),
    solicitudContactoId: solicitud.id,
    colaboradorId: solicitud.colaboradorId,
    fechaInicio: inicio.toISOString(),
    fechaFin: fin.toISOString(),
    modalidad: modalidadElegida,
    estado: 'CONFIRMADA',
    createdAt: ahora,
  }
  const solicitudActualizada: SolicitudContacto = {
    ...solicitud,
    estado: 'CONTACTO_LIBERADO',
    fechaRespuesta: ahora,
    contactoLiberadoAt: ahora,
  }
  return { ok: true, cita, solicitudActualizada }
}

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasSemilla)
  const [empresaActivaId, setEmpresaActivaId] = useState(empresaSemilla.id)
  const [registrosFinancieros, setRegistrosFinancieros] = useState<Record<string, RegistroFinanciero[]>>(
    registrosFinancierosSemilla,
  )
  const [indicadoresPrincipales, setIndicadoresPrincipalesState] = useState<Record<string, string[]>>(
    indicadoresPrincipalesSemilla,
  )
  const [obligacionesEmpresa, setObligacionesEmpresa] = useState<Record<string, ObligacionEmpresa[]>>(
    obligacionesEmpresaSemilla,
  )
  const [simulaciones, setSimulaciones] = useState<Record<string, Simulacion[]>>(simulacionesSemilla)
  const [solicitudesContacto, setSolicitudesContacto] = useState<Record<string, SolicitudContacto[]>>(() => {
    const inicial: Record<string, SolicitudContacto[]> = { ...solicitudesContactoSemilla }
    for (const solicitud of SOLICITUDES_COLABORADOR_SEMILLA) {
      inicial[solicitud.empresaId] = [...(inicial[solicitud.empresaId] ?? []), solicitud]
    }
    return inicial
  })
  const [planActivoCodigo, setPlanActivoCodigo] = useState<PlanCodigo>(planActivoCodigoSemilla)
  const [renovacionAutomatica, setRenovacionAutomatica] = useState(suscripcionSemilla.renovacionAutomatica)
  const [suscripcionCancelada, setSuscripcionCancelada] = useState(suscripcionSemilla.cancelada)
  const [motivoCancelacion, setMotivoCancelacion] = useState<string | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>(metodosPagoSemilla)
  const [historialPagos] = useState<PagoSuscripcion[]>(historialPagosSemilla)
  const [preferencias, setPreferencias] = useState<PreferenciaUsuario>(preferenciaUsuarioSemilla)

  const [colaboradorPerfil, setColaboradorPerfil] = useState(
    () => COLABORADORES_MARKETPLACE.find((c) => c.id === 'col-mfl') ?? COLABORADORES_MARKETPLACE[0],
  )
  const [serviciosColaborador, setServiciosColaborador] = useState<ServicioProfesional[]>(() =>
    SERVICIOS_PROFESIONALES.filter((s) => s.colaboradorId === colaboradorPerfil.id),
  )
  const [iconosServicio, setIconosServicio] = useState<Record<string, ServiceIconKey>>(
    ICONOS_SERVICIO_SEMILLA,
  )
  const [horariosColaborador, setHorariosColaborador] = useState<HorarioDisponibilidad[]>(() =>
    HORARIOS_DISPONIBILIDAD.filter((h) => h.colaboradorId === colaboradorPerfil.id),
  )
  const [citasColaborador, setCitasColaborador] = useState<Cita[]>(CITAS_COLABORADOR_SEMILLA)
  const [notificacionesColaborador, setNotificacionesColaborador] = useState<NotificacionColaborador[]>(
    NOTIFICACIONES_COLABORADOR_SEMILLA,
  )
  const [preferenciasNotificacionColaborador, setPreferenciasNotificacionColaborador] = useState<
    PreferenciaNotificacionColaborador[]
  >(PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA)

  const empresaActiva = useMemo(
    () => empresas.find((e) => e.id === empresaActivaId) ?? empresas[0],
    [empresas, empresaActivaId],
  )

  const solicitudesColaborador = useMemo(
    () =>
      Object.values(solicitudesContacto)
        .flat()
        .filter((s) => s.colaboradorId === colaboradorPerfil.id),
    [solicitudesContacto, colaboradorPerfil.id],
  )

  const addEmpresa = (empresa: Empresa) => {
    setEmpresas((current) => [...current, empresa])
  }

  const updateEmpresa = (id: string, patch: Partial<Empresa>) => {
    setEmpresas((current) => current.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  const addRegistroFinanciero = (empresaId: string, registro: RegistroFinanciero) => {
    setRegistrosFinancieros((current) => ({
      ...current,
      [empresaId]: [...(current[empresaId] ?? []), registro],
    }))
  }

  const updateRegistroFinanciero = (empresaId: string, id: string, patch: Partial<RegistroFinanciero>) => {
    setRegistrosFinancieros((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const setIndicadoresPrincipales = (empresaId: string, codigos: string[]) => {
    setIndicadoresPrincipalesState((current) => ({ ...current, [empresaId]: codigos }))
  }

  const marcarObligacionCumplida = (empresaId: string, id: string) => {
    setObligacionesEmpresa((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((o) =>
        o.id === id ? { ...o, fechaCumplimiento: HOY_OBLIGACIONES } : o,
      ),
    }))
  }

  const toggleRecordatorioObligacion = (empresaId: string, id: string) => {
    setObligacionesEmpresa((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((o) =>
        o.id === id ? { ...o, recordatorioActivo: !o.recordatorioActivo } : o,
      ),
    }))
  }

  const guardarSimulacion = (empresaId: string, sim: Simulacion) => {
    setSimulaciones((current) => ({
      ...current,
      [empresaId]: [sim, ...(current[empresaId] ?? [])],
    }))
  }

  const enviarSolicitudContacto = (
    empresaId: string,
    nueva: NuevaSolicitudContacto,
  ): SolicitudContacto | null => {
    const empresaExiste = empresas.some((empresa) => empresa.id === empresaId)
    const servicio = SERVICIOS_PROFESIONALES.find(
      (item) =>
        item.id === nueva.servicioId &&
        item.colaboradorId === nueva.colaboradorId &&
        item.activo,
    )
    const descripcion = nueva.descripcion.trim()

    if (
      !empresaExiste ||
      !servicio ||
      !nueva.fechaPreferida ||
      !nueva.horaPreferida ||
      !descripcion
    ) {
      return null
    }

    const solicitud: SolicitudContacto = {
      ...nueva,
      empresaId,
      descripcion,
      id: crypto.randomUUID(),
      estado: 'ENVIADA',
      createdAt: AHORA_MARKETPLACE,
    }

    setSolicitudesContacto((current) => ({
      ...current,
      [empresaId]: [solicitud, ...(current[empresaId] ?? [])],
    }))

    return solicitud
  }

  const cambiarPlan = (codigo: PlanCodigo) => {
    setPlanActivoCodigo(codigo)
  }

  const toggleRenovacionAutomatica = () => {
    setRenovacionAutomatica((current) => !current)
  }

  const cancelarSuscripcion = (motivo: string) => {
    setSuscripcionCancelada(true)
    setMotivoCancelacion(motivo.trim() || null)
    setRenovacionAutomatica(false)
  }

  const agregarMetodoPago = (nuevo: NuevoMetodoPago): MetodoPago | null => {
    const numeroLimpio = nuevo.numeroTarjeta.replace(/\s+/g, '')
    const expiracionValida =
      Number.isInteger(nuevo.mesExpiracion) &&
      nuevo.mesExpiracion >= 1 &&
      nuevo.mesExpiracion <= 12 &&
      Number.isInteger(nuevo.anioExpiracion)

    if (!/^\d{13,19}$/.test(numeroLimpio) || !expiracionValida) {
      return null
    }

    const metodo: MetodoPago = {
      id: crypto.randomUUID(),
      marca: detectarMarca(numeroLimpio),
      tipo: 'Tarjeta de crédito',
      ultimosCuatro: numeroLimpio.slice(-4),
      mesExpiracion: nuevo.mesExpiracion,
      anioExpiracion: nuevo.anioExpiracion,
      predeterminado: metodosPago.length === 0,
      estado: 'ACTIVO',
    }

    setMetodosPago((current) => [...current, metodo])
    return metodo
  }

  const editarExpiracionMetodoPago = (id: string, mes: number, anio: number) => {
    setMetodosPago((current) =>
      current.map((m) => (m.id === id ? { ...m, mesExpiracion: mes, anioExpiracion: anio } : m)),
    )
  }

  const hacerMetodoPredeterminado = (id: string) => {
    setMetodosPago((current) => current.map((m) => ({ ...m, predeterminado: m.id === id })))
  }

  const eliminarMetodoPago = (id: string): boolean => {
    if (metodosPago.length <= 1) return false

    const eraPredeterminado = metodosPago.find((m) => m.id === id)?.predeterminado ?? false

    setMetodosPago((current) => {
      const restantes = current.filter((m) => m.id !== id)
      if (eraPredeterminado && restantes.length > 0) {
        return restantes.map((m, index) => ({ ...m, predeterminado: index === 0 }))
      }
      return restantes
    })

    return true
  }

  const actualizarPreferencia = <K extends keyof PreferenciaUsuario>(clave: K, valor: PreferenciaUsuario[K]) => {
    setPreferencias((current) => ({ ...current, [clave]: valor }))
  }

  const actualizarColaboradorPerfil = (patch: Partial<typeof colaboradorPerfil>) => {
    setColaboradorPerfil((current) => ({ ...current, ...patch }))
  }

  const actualizarEspecialidadesColaborador = (especialidades: EspecialidadColaboradorRelacion[]) => {
    setColaboradorPerfil((current) => ({
      ...current,
      especialidades,
      especialidadIds: especialidades.filter((e) => e.activo).map((e) => e.especialidadId),
      especialidadPrincipalId:
        especialidades.find((e) => e.esPrincipal)?.especialidadId ?? current.especialidadPrincipalId,
    }))
  }

  const desactivarCuentaColaborador = () => {
    setColaboradorPerfil((current) => ({ ...current, estado: 'INACTIVO', visibleMarketplace: false }))
  }

  const agregarServicioColaborador = (
    servicio: Omit<ServicioProfesional, 'id' | 'colaboradorId' | 'activo'>,
  ): ServicioProfesional => {
    const nuevo: ServicioProfesional = {
      ...servicio,
      id: crypto.randomUUID(),
      colaboradorId: colaboradorPerfil.id,
      activo: true,
    }
    setServiciosColaborador((current) => [...current, nuevo])
    return nuevo
  }

  const actualizarServicioColaborador = (id: string, patch: Partial<ServicioProfesional>) => {
    setServiciosColaborador((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const desactivarServicioColaborador = (id: string) => {
    setServiciosColaborador((current) => current.map((s) => (s.id === id ? { ...s, activo: false } : s)))
  }

  const establecerIconoServicio = (servicioId: string, iconKey: ServiceIconKey) => {
    setIconosServicio((current) => ({ ...current, [servicioId]: iconKey }))
  }

  const guardarHorariosColaborador = (horarios: HorarioDisponibilidad[]) => {
    setHorariosColaborador(horarios)
  }

  const aceptarSolicitudColaborador = (
    solicitudId: string,
    modalidadElegida: Exclude<ModalidadAtencion, 'AMBAS'>,
  ): { ok: true; cita: Cita } | { ok: false; motivo: string } => {
    const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
    if (!solicitud) return { ok: false, motivo: 'Solicitud no encontrada.' }
    const servicio = serviciosColaborador.find((s) => s.id === solicitud.servicioId)
    const resultado = validarYAceptar({
      solicitud,
      servicio,
      horarios: horariosColaborador,
      citasExistentes: citasColaborador,
      modalidadElegida,
    })
    if (!resultado.ok) return resultado

    setSolicitudesContacto((current) => ({
      ...current,
      [solicitud.empresaId]: current[solicitud.empresaId].map((s) =>
        s.id === solicitudId ? resultado.solicitudActualizada : s,
      ),
    }))
    setCitasColaborador((current) => [...current, resultado.cita])
    return { ok: true, cita: resultado.cita }
  }

  const rechazarSolicitudColaborador = (solicitudId: string, motivoRechazo: string): boolean => {
    const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
    if (!solicitud || solicitud.estado !== 'ENVIADA') return false
    if (motivoRechazo.trim().length < 10 || motivoRechazo.trim().length > 500) return false

    setSolicitudesContacto((current) => ({
      ...current,
      [solicitud.empresaId]: current[solicitud.empresaId].map((s) =>
        s.id === solicitudId
          ? { ...s, estado: 'RECHAZADA' as const, fechaRespuesta: new Date().toISOString(), motivoRechazo: motivoRechazo.trim() }
          : s,
      ),
    }))
    return true
  }

  const marcarNotificacionColaboradorLeida = (id: string) => {
    setNotificacionesColaborador((current) => current.map((n) => (n.id === id ? { ...n, leida: true } : n)))
  }

  const marcarTodasNotificacionesColaboradorLeidas = () => {
    setNotificacionesColaborador((current) => current.map((n) => ({ ...n, leida: true })))
  }

  const actualizarPreferenciaNotificacionColaborador = (
    categoria: CategoriaNotificacionColaborador,
    patch: Partial<Pick<PreferenciaNotificacionColaborador, 'correoActivo' | 'frecuencia'>>,
  ) => {
    setPreferenciasNotificacionColaborador((current) =>
      current.map((p) => (p.categoria === categoria ? { ...p, ...patch } : p)),
    )
  }

  return (
    <PortalDataContext.Provider
      value={{
        empresas,
        empresaActivaId,
        empresaActiva,
        setEmpresaActiva: setEmpresaActivaId,
        addEmpresa,
        updateEmpresa,
        registrosFinancieros,
        addRegistroFinanciero,
        updateRegistroFinanciero,
        indicadoresPrincipales,
        setIndicadoresPrincipales,
        obligacionesEmpresa,
        marcarObligacionCumplida,
        toggleRecordatorioObligacion,
        simulaciones,
        guardarSimulacion,
        solicitudesContacto,
        enviarSolicitudContacto,
        planActivoCodigo,
        cambiarPlan,
        renovacionAutomatica,
        toggleRenovacionAutomatica,
        suscripcionCancelada,
        motivoCancelacion,
        cancelarSuscripcion,
        metodosPago,
        agregarMetodoPago,
        editarExpiracionMetodoPago,
        hacerMetodoPredeterminado,
        eliminarMetodoPago,
        historialPagos,
        preferencias,
        actualizarPreferencia,
        colaboradorPerfil,
        actualizarColaboradorPerfil,
        actualizarEspecialidadesColaborador,
        desactivarCuentaColaborador,
        serviciosColaborador,
        agregarServicioColaborador,
        actualizarServicioColaborador,
        desactivarServicioColaborador,
        iconosServicio,
        establecerIconoServicio,
        horariosColaborador,
        guardarHorariosColaborador,
        solicitudesColaborador,
        aceptarSolicitudColaborador,
        rechazarSolicitudColaborador,
        citasColaborador,
        notificacionesColaborador,
        marcarNotificacionColaboradorLeida,
        marcarTodasNotificacionesColaboradorLeidas,
        preferenciasNotificacionColaborador,
        actualizarPreferenciaNotificacionColaborador,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  )
}

export function usePortalData() {
  const ctx = useContext(PortalDataContext)
  if (!ctx) throw new Error('usePortalData debe usarse dentro de <PortalDataProvider>')
  return ctx
}
