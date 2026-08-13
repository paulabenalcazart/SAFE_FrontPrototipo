import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
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
    <section
      aria-labelledby="solicitudes-pendientes-titulo"
      className="surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="solicitudes-pendientes-titulo" className="text-[18px] font-semibold text-ink-900">
          Solicitudes pendientes
        </h2>
        <span
          aria-label={`${filtradas.length} solicitudes pendientes mostradas`}
          className="num rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-bold text-navy-700"
        >
          {filtradas.length}
        </span>
      </div>

      <div>
        <label htmlFor="buscar-solicitudes-pendientes" className="mb-1.5 block text-[12px] font-semibold text-ink-700">
          Buscar por empresa
        </label>
        <Input
          id="buscar-solicitudes-pendientes"
          type="search"
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value)
            setPagina(1)
          }}
          placeholder="Nombre de la empresa"
          className="h-11"
        />
      </div>

      {filtradas.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <p className="text-sm text-ink-500">
            {pendientes.length === 0
              ? 'No tienes solicitudes pendientes.'
              : 'No encontramos solicitudes pendientes para esa búsqueda.'}
          </p>
          {pendientes.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-4 h-11"
              onClick={() => {
                setBusqueda('')
                setPagina(1)
              }}
            >
              Limpiar búsqueda
            </Button>
          )}
        </div>
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
        <nav
          aria-label="Páginas de solicitudes pendientes"
          className="flex flex-wrap justify-center gap-x-1.5 gap-y-1.5"
        >
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === paginaActual ? 'page' : undefined}
              aria-label={`Ir a la página ${n}`}
              className={`num grid h-11 min-w-11 place-items-center rounded-lg text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 ${
                n === paginaActual
                  ? 'bg-navy-600 text-white'
                  : 'border border-line bg-card text-ink-700 hover:bg-surface'
              }`}
            >
              {n}
            </button>
          ))}
        </nav>
      )}
    </section>
  )
}
