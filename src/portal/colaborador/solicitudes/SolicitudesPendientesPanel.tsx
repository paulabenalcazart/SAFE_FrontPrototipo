import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { buscarSolicitudesPorEmpresa } from '@/portal/colaborador/calculo'
import { empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import type { SolicitudContacto } from '@/portal/types'
import { SolicitudPendienteCard } from './SolicitudPendienteCard'

const POR_PAGINA = 3

export function SolicitudesPendientesPanel({
  solicitudes,
  onVerDetalle,
  onAceptar,
  onRechazar,
}: {
  solicitudes: SolicitudContacto[]
  onVerDetalle: (solicitud: SolicitudContacto) => void
  onAceptar: (solicitud: SolicitudContacto) => void
  onRechazar: (solicitud: SolicitudContacto) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [pagina, setPagina] = useState(1)

  const pendientes = useMemo(
    () =>
      solicitudes
        .filter((s) => s.estado === 'ENVIADA')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [solicitudes],
  )

  const filtradas = useMemo(
    () =>
      buscarSolicitudesPorEmpresa({
        items: pendientes,
        busqueda,
        empresaPorId: empresaSolicitantePorId,
      }),
    [pendientes, busqueda],
  )

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <section aria-labelledby="solicitudes-pendientes-titulo" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="solicitudes-pendientes-titulo" className="text-[18px] font-semibold text-ink-900">
          Solicitudes pendientes
        </h2>
        <Input
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(1)
          }}
          placeholder="Buscar por empresa"
          className="max-w-[280px]"
          aria-label="Buscar solicitudes pendientes por empresa"
        />
      </div>

      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6 text-center text-sm text-ink-500">
          {pendientes.length === 0
            ? 'No tienes solicitudes pendientes.'
            : 'Ninguna solicitud coincide con tu búsqueda.'}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {visibles.map((solicitud) => (
            <SolicitudPendienteCard
              key={solicitud.id}
              solicitud={solicitud}
              onVerDetalle={() => onVerDetalle(solicitud)}
              onAceptar={() => onAceptar(solicitud)}
              onRechazar={() => onRechazar(solicitud)}
            />
          ))}
        </div>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === paginaActual ? 'page' : undefined}
              className={`num grid h-9.5 min-w-9.5 place-items-center rounded-lg text-[12.5px] font-semibold ${
                n === paginaActual
                  ? 'bg-navy-600 text-white'
                  : 'border border-line bg-card text-ink-700 hover:bg-surface'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
