import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador } from '@/portal/types'
import { listarIndicadores } from '@/portal/financiero/calculo'
import { DESCRIPCION_INDICADOR } from './descripciones'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const CATALOGO = listarIndicadores()

export function IndicadoresPrincipalesScreen() {
  const navigate = useNavigate()
  const { empresaActiva, indicadoresPrincipales, setIndicadoresPrincipales } = usePortalData()
  const [seleccion, setSeleccion] = useState<string[]>(indicadoresPrincipales[empresaActiva.id] ?? [])
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    setSeleccion(indicadoresPrincipales[empresaActiva.id] ?? [])
    setMensaje('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaActiva.id])

  const agregar = (codigo: string) => {
    if (seleccion.includes(codigo) || seleccion.length >= 4) return
    setSeleccion((s) => [...s, codigo])
    setMensaje('')
  }

  const quitar = (codigo: string) => {
    setSeleccion((s) => s.filter((c) => c !== codigo))
    setMensaje('')
  }

  const guardar = () => {
    if (seleccion.length !== 4) {
      setMensaje('Elige exactamente cuatro indicadores.')
      return
    }
    setIndicadoresPrincipales(empresaActiva.id, seleccion)
    setMensaje('Guardado.')
  }

  const slotsVacios = Array.from({ length: Math.max(0, 4 - seleccion.length) }, (_, i) => seleccion.length + i + 1)

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Indicadores principales</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">Elige exactamente cuatro indicadores. Se guardan por empresa.</p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Seleccionados</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {seleccion.map((codigo, index) => {
            const ind = CATALOGO.find((i) => i.codigo === codigo)!
            return (
              <div key={codigo} className="relative rounded-lg border border-navy-500 bg-card p-3.5">
                <span className="text-[11px] font-bold text-navy-600">{index + 1}</span>
                <p className="mt-1.5 text-[14px] font-semibold leading-tight">{ind.nombre}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-500">
                  {FACTOR_LABEL[ind.factor]} · {ind.codigo}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(codigo)}
                  aria-label="Quitar indicador"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-line bg-card text-ink-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )
          })}
          {slotsVacios.map((n) => (
            <div key={n} className="grid min-h-[96px] place-items-center rounded-lg border border-dashed border-line bg-surface p-3.5">
              <span className="text-[12.5px] text-ink-500">Slot {n} disponible</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3.5">
          <p className="text-[12.5px] text-ink-500">{mensaje}</p>
          <button type="button" onClick={guardar} className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white">
            Guardar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Todos los indicadores MVP</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOGO.map((ind) => {
            const seleccionado = seleccion.includes(ind.codigo)
            const deshabilitado = seleccionado || seleccion.length >= 4
            return (
              <div
                key={ind.codigo}
                className="flex flex-col gap-1.5 rounded-lg border border-line bg-card p-3.5"
                style={{ opacity: deshabilitado && !seleccionado ? 0.6 : 1 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10.5px] font-semibold text-navy-700">
                    {FACTOR_LABEL[ind.factor]}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-500">{ind.codigo}</span>
                </div>
                <p className="text-[14px] font-semibold leading-tight">{ind.nombre}</p>
                <p className="text-[12.5px] leading-snug text-ink-700">{DESCRIPCION_INDICADOR[ind.codigo]}</p>
                <span className="text-[11.5px] text-ink-500">{ind.unidad}</span>
                <button
                  type="button"
                  onClick={() => agregar(ind.codigo)}
                  disabled={deshabilitado}
                  className="mt-auto min-h-8.5 w-fit rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700 disabled:opacity-50"
                >
                  {seleccionado ? 'Agregado' : 'Agregar'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </section>
  )
}
