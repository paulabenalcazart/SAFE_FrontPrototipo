import { useMemo, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { buscarSolicitudesPorEmpresa } from '@/portal/colaborador/calculo'
import { empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import { formatFecha } from '@/portal/obligaciones/formato'
import { TONE_BADGE_CLASSES } from '@/portal/tone'
import type { EstadoSolicitudContacto, SolicitudContacto } from '@/portal/types'
import { ESTADO_LABEL, ESTADO_TONO } from './estado'

const POR_PAGINA = 6

const FILTRO_A_ESTADOS: Record<string, EstadoSolicitudContacto[]> = {
  Todas: ['ENVIADA', 'ACEPTADA', 'CONTACTO_LIBERADO', 'RECHAZADA', 'FINALIZADA'],
  Pendientes: ['ENVIADA'],
  Aceptadas: ['ACEPTADA', 'CONTACTO_LIBERADO'],
  Rechazadas: ['RECHAZADA'],
  Finalizadas: ['FINALIZADA'],
}

const OPCIONES_FILTRO = Object.keys(FILTRO_A_ESTADOS)

export function HistorialSolicitudes({
  solicitudes,
  onVerDetalle,
}: {
  solicitudes: SolicitudContacto[]
  onVerDetalle: (solicitud: SolicitudContacto) => void
}) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState<string>('Todas')
  const [pagina, setPagina] = useState(1)

  const porEstado = useMemo(() => {
    const estados = FILTRO_A_ESTADOS[filtro] ?? FILTRO_A_ESTADOS.Todas
    return solicitudes
      .filter((s) => estados.includes(s.estado))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [solicitudes, filtro])

  const filtradas = useMemo(
    () =>
      buscarSolicitudesPorEmpresa({
        items: porEstado,
        busqueda,
        empresaPorId: empresaSolicitantePorId,
      }),
    [porEstado, busqueda],
  )

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <section aria-labelledby="historial-solicitudes-titulo" className="flex flex-col gap-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="historial-solicitudes-titulo" className="text-[18px] font-semibold text-ink-900">
          Historial de solicitudes
        </h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <Input
            type="search"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por empresa"
            className="max-w-[240px]"
            aria-label="Buscar solicitudes por empresa"
          />
          <Select
            value={filtro}
            onValueChange={(v) => {
              setFiltro(v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="w-[160px]" aria-label="Filtrar solicitudes por estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OPCIONES_FILTRO.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filtradas.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6 text-center text-sm text-ink-500">
          {solicitudes.length === 0
            ? 'No tienes solicitudes en tu historial.'
            : 'Ninguna solicitud coincide con tu búsqueda.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
                  Empresa
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Responsable
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Fecha de solicitud
                </th>
                <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
                  Fecha solicitada
                </th>
                <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Fecha de acción
                </th>
                <th
                  scope="col"
                  className="px-4.5 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide"
                >
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((solicitud) => {
                const empresa = empresaSolicitantePorId(solicitud.empresaId)
                return (
                  <tr key={solicitud.id} className="border-t border-line/70">
                    <td className="px-4.5 py-2.5 font-medium leading-snug text-ink-900">
                      {empresa?.nombre ?? 'Empresa no encontrada'}
                    </td>
                    <td className="hidden px-2 py-2.5 text-ink-700 sm:table-cell">
                      {empresa?.representante.nombre ?? '—'}
                    </td>
                    <td className="num hidden whitespace-nowrap px-2 py-2.5 sm:table-cell">
                      {formatFecha(solicitud.createdAt.slice(0, 10))}
                    </td>
                    <td className="num whitespace-nowrap px-2 py-2.5">{formatFecha(solicitud.fechaPreferida)}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
                      >
                        {ESTADO_LABEL[solicitud.estado]}
                      </span>
                    </td>
                    <td className="num hidden whitespace-nowrap px-2 py-2.5 sm:table-cell">
                      {solicitud.fechaRespuesta ? formatFecha(solicitud.fechaRespuesta.slice(0, 10)) : 'Sin acción'}
                    </td>
                    <td className="px-4.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(solicitud)}
                        className="text-[12.5px] font-semibold text-navy-500 hover:text-navy-700"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPaginas > 1 && (
        <nav
          aria-label="Páginas del historial de solicitudes"
          className="flex flex-wrap justify-center gap-x-1.5 gap-y-1.5"
        >
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === paginaActual ? 'page' : undefined}
              aria-label={`Ir a la página ${n}`}
              className={`num grid h-9.5 min-w-9.5 place-items-center rounded-lg text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 ${
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
