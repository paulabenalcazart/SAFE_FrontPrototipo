import { Button } from '@/components/ui/button'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { usePortalData } from '@/portal/PortalDataContext'
import { empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import { formatFecha } from '@/portal/obligaciones/formato'
import type { SolicitudContacto } from '@/portal/types'

export function SolicitudPendienteCard({
  solicitud,
  onVerDetalle,
  onAceptar,
  onRechazar,
}: {
  solicitud: SolicitudContacto
  onVerDetalle: () => void
  onAceptar: () => void
  onRechazar: () => void
}) {
  const { serviciosColaborador } = usePortalData()
  const empresa = empresaSolicitantePorId(solicitud.empresaId)
  const servicio = serviciosColaborador.find((s) => s.id === solicitud.servicioId)

  return (
    <article className="rounded-xl border border-line/70 bg-surface p-4 hover:border-navy-200 sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa no encontrada'} iniciales={empresa?.iniciales} />
        <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
          Pendiente
        </span>
      </div>

      <div className="mt-4 grid gap-3 rounded-xl border border-line/70 bg-card p-3.5 sm:grid-cols-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Servicio solicitado</p>
          <p className="mt-1 break-words text-[16px] font-semibold leading-snug text-ink-900">
            {servicio?.nombre ?? 'Servicio no encontrado'}
          </p>
        </div>
        <div className="min-w-0 sm:border-l sm:border-line sm:pl-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Fecha y hora</p>
          <p className="num mt-1 text-[16px] font-semibold leading-snug text-ink-900">
            {formatFecha(solicitud.fechaPreferida)} · {solicitud.horaPreferida}
          </p>
        </div>
      </div>

      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
        <div className="min-w-0">
          <dt className="text-ink-500">Responsable</dt>
          <dd className="mt-0.5 break-words font-medium text-ink-700">{empresa?.representante.nombre ?? '—'}</dd>
        </div>
        <div className="min-w-0">
          <dt className="text-ink-500">Enviada el</dt>
          <dd className="num mt-0.5 font-medium text-ink-700">{formatFecha(solicitud.createdAt.slice(0, 10))}</dd>
        </div>
      </dl>

      <div className="mt-4 grid gap-2 sm:grid-cols-[auto_auto_auto] sm:justify-start">
        <Button size="lg" className="h-11 w-full sm:w-auto" onClick={onAceptar}>Aceptar solicitud</Button>
        <Button variant="outline" size="lg" className="h-11 w-full sm:w-auto" onClick={onVerDetalle}>Ver detalles</Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-11 w-full text-destructive hover:bg-destructive/10 hover:text-destructive sm:w-auto"
          onClick={onRechazar}
        >
          Rechazar solicitud
        </Button>
      </div>
    </article>
  )
}
