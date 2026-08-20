import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Pagination } from '@/portal/components/Pagination'
import { Badge } from '@/portal/components/Badge'
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
    <section
      aria-labelledby="historial-solicitudes-titulo"
      className="surface-card flex min-w-0 flex-col gap-4 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="historial-solicitudes-titulo" className="text-[18px] font-semibold text-ink-900">
          Historial de solicitudes
        </h2>
        <span className="text-[12px] font-medium text-ink-500">{filtradas.length} resultados</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <div className="min-w-0">
          <label htmlFor="buscar-historial-solicitudes" className="mb-1.5 block text-[12px] font-semibold text-ink-700">
            Buscar por empresa
          </label>
          <Input
            id="buscar-historial-solicitudes"
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
        <div className="min-w-0">
          <label id="filtro-estado-solicitudes-label" className="mb-1.5 block text-[12px] font-semibold text-ink-700">
            Estado
          </label>
          <Select
            value={filtro}
            onValueChange={(v) => {
              setFiltro(v)
              setPagina(1)
            }}
          >
            <SelectTrigger className="h-11 w-full" aria-labelledby="filtro-estado-solicitudes-label">
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
        <div className="rounded-xl border border-line bg-card p-6 text-center">
          <p className="text-sm text-ink-500">
            {solicitudes.length === 0
              ? 'No tienes solicitudes en tu historial.'
              : 'Ninguna solicitud coincide con los filtros aplicados.'}
          </p>
          {solicitudes.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="mt-4 h-11"
              onClick={() => {
                setBusqueda('')
                setFiltro('Todas')
                setPagina(1)
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-card">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead className="bg-surface">
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[12px] font-semibold uppercase tracking-wide">
                  Empresa
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[12px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Responsable
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[12px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Fecha de solicitud
                </th>
                <th scope="col" className="px-2 py-2.5 text-[12px] font-semibold uppercase tracking-wide">
                  Fecha solicitada
                </th>
                <th scope="col" className="px-2 py-2.5 text-[12px] font-semibold uppercase tracking-wide">
                  Estado
                </th>
                <th
                  scope="col"
                  className="hidden px-2 py-2.5 text-[12px] font-semibold uppercase tracking-wide sm:table-cell"
                >
                  Fecha de acción
                </th>
                <th
                  scope="col"
                  className="px-4.5 py-2.5 text-right text-[12px] font-semibold uppercase tracking-wide"
                >
                  Detalle
                </th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((solicitud) => {
                const empresa = empresaSolicitantePorId(solicitud.empresaId)
                return (
                  <tr key={solicitud.id} className="border-t border-line/70 hover:bg-surface focus-within:bg-surface">
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
                      <Badge size="md" className={TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}>
                        {ESTADO_LABEL[solicitud.estado]}
                      </Badge>
                    </td>
                    <td className="num hidden whitespace-nowrap px-2 py-2.5 sm:table-cell">
                      {solicitud.fechaRespuesta ? formatFecha(solicitud.fechaRespuesta.slice(0, 10)) : 'Sin acción'}
                    </td>
                    <td className="px-4.5 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onVerDetalle(solicitud)}
                        className="inline-flex min-h-11 items-center rounded-lg px-2 text-[12.5px] font-semibold text-navy-600 hover:bg-navy-100 hover:text-navy-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
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

      <Pagination
        paginaActual={paginaActual}
        totalPaginas={totalPaginas}
        onChange={setPagina}
        ariaLabel="Páginas del historial de solicitudes"
      />
    </section>
  )
}
