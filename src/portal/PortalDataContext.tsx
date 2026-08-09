import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa, ObligacionEmpresa, RegistroFinanciero } from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
  obligacionesEmpresaSemilla,
} from './data/mock-portal-data'
import { HOY_OBLIGACIONES } from './obligaciones/calculo'

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
