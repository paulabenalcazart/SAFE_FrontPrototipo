import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  Empresa,
  MetodoPago,
  NuevaSolicitudContacto,
  NuevoMetodoPago,
  ObligacionEmpresa,
  PagoSuscripcion,
  PlanCodigo,
  RegistroFinanciero,
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
} from './data/mock-portal-data'
import { HOY_OBLIGACIONES } from './obligaciones/calculo'
import { SERVICIOS_PROFESIONALES } from './marketplace/catalogo'
import { AHORA_MARKETPLACE } from './marketplace/calculo'
import { detectarMarca } from './plan/calculo'

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
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

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
  const [solicitudesContacto, setSolicitudesContacto] = useState<Record<string, SolicitudContacto[]>>(
    solicitudesContactoSemilla,
  )
  const [planActivoCodigo, setPlanActivoCodigo] = useState<PlanCodigo>(planActivoCodigoSemilla)
  const [renovacionAutomatica, setRenovacionAutomatica] = useState(suscripcionSemilla.renovacionAutomatica)
  const [suscripcionCancelada, setSuscripcionCancelada] = useState(suscripcionSemilla.cancelada)
  const [motivoCancelacion, setMotivoCancelacion] = useState<string | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>(metodosPagoSemilla)
  const [historialPagos] = useState<PagoSuscripcion[]>(historialPagosSemilla)

  const empresaActiva = useMemo(
    () => empresas.find((e) => e.id === empresaActivaId) ?? empresas[0],
    [empresas, empresaActivaId],
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
