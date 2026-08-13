import { CalendarDays, Link as LinkIcon, MapPin } from 'lucide-react'
import { obtenerProximasCitas } from '@/portal/colaborador/calculo'
import { formatModalidadEtiqueta } from '@/portal/colaborador/formato'
import { empresaSolicitantePorId, HOY_COLABORADOR_ISO } from '@/portal/colaborador/semilla'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { usePortalData } from '@/portal/PortalDataContext'
import type { Cita, SolicitudContacto } from '@/portal/types'

const ZONA_HORARIA = 'America/Guayaquil'

function fechaCita(iso: string): { dia: string; mes: string } {
  const partes = new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA_HORARIA,
    day: '2-digit',
    month: 'short',
  }).formatToParts(new Date(iso))

  return {
    dia: partes.find((parte) => parte.type === 'day')?.value ?? '—',
    mes: partes.find((parte) => parte.type === 'month')?.value.replace('.', '') ?? '',
  }
}

function rangoHorario(inicio: string, fin: string): string {
  const formato = new Intl.DateTimeFormat('es-EC', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  return `${formato.format(new Date(inicio))} – ${formato.format(new Date(fin))}`
}

function etiquetaEstado(estado: Cita['estado']): string {
  return estado === 'CONFIRMADA' ? 'Confirmada' : 'Programada'
}

function esEnlaceSeguro(enlace: string): boolean {
  try {
    const url = new URL(enlace)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function ProximasCitasPanel({ citas, solicitudes }: { citas: Cita[]; solicitudes: SolicitudContacto[] }) {
  const { serviciosColaborador } = usePortalData()
  const proximasCitas = obtenerProximasCitas(citas, HOY_COLABORADOR_ISO)

  return (
    <section aria-labelledby="proximas-citas-titulo" className="surface-card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <CalendarDays aria-hidden="true" className="h-5 w-5 text-navy-600" />
          <h2 id="proximas-citas-titulo" className="text-[18px] font-semibold text-ink-900">
            Próximas citas
          </h2>
        </div>
        <span
          aria-label={`${proximasCitas.length} citas próximas`}
          className="num rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-bold text-navy-700"
        >
          {proximasCitas.length}
        </span>
      </div>

      {proximasCitas.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">No tienes citas próximas.</p>
      ) : (
        <ol className="mt-4 divide-y divide-line/70">
          {proximasCitas.map((cita) => {
            const solicitud = solicitudes.find((item) => item.id === cita.solicitudContactoId)
            const empresa = solicitud ? empresaSolicitantePorId(solicitud.empresaId) : undefined
            const servicio = solicitud ? serviciosColaborador.find((item) => item.id === solicitud.servicioId) : undefined
            const fecha = fechaCita(cita.fechaInicio)
            const enlaceReunion = cita.enlaceReunion && esEnlaceSeguro(cita.enlaceReunion) ? cita.enlaceReunion : null

            return (
              <li key={cita.id} className="py-4 first:pt-0 last:pb-0">
                <article className="flex gap-3.5">
                  <time
                    dateTime={cita.fechaInicio}
                    className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-navy-100 text-navy-700"
                  >
                    <span className="num text-[17px] font-bold leading-none">{fecha.dia}</span>
                    <span className="text-[12px] font-bold uppercase leading-tight">{fecha.mes}</span>
                  </time>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                      <p className="num text-[13px] font-semibold text-ink-900">{rangoHorario(cita.fechaInicio, cita.fechaFin)}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[12px] font-semibold ${
                          cita.estado === 'CONFIRMADA'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {etiquetaEstado(cita.estado)}
                      </span>
                    </div>
                    <div className="mt-2">
                      <CompanyIdentity
                        size="sm"
                        nombre={empresa?.nombre ?? 'Empresa no encontrada'}
                        iniciales={empresa?.iniciales}
                      />
                    </div>
                    <p className="mt-1.5 text-[12.5px] text-ink-700">
                      {servicio?.nombre ?? 'Servicio no encontrado'} · {formatModalidadEtiqueta(cita.modalidad)}
                    </p>
                    {cita.ubicacion && (
                      <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-600">
                        <MapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {cita.ubicacion}
                      </p>
                    )}
                    {enlaceReunion && (
                      <a
                        href={enlaceReunion}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-[12.5px] font-semibold text-navy-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
                      >
                        <LinkIcon aria-hidden="true" className="h-4 w-4" />
                        Abrir enlace de reunión
                        <span className="sr-only"> (se abre en una nueva pestaña)</span>
                      </a>
                    )}
                  </div>
                </article>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
