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
    <article className="rounded-xl border border-line/70 bg-surface p-3.5">
      <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa'} iniciales={empresa?.iniciales} />
      <dl className="mt-3 flex flex-col gap-1.5 text-[12.5px]">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Responsable</dt>
          <dd className="text-ink-900">{empresa?.representante.nombre ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Servicio solicitado</dt>
          <dd className="text-ink-900">{servicio?.nombre ?? 'Servicio por definir'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Fecha solicitada</dt>
          <dd className="text-ink-900">{formatFecha(solicitud.fechaPreferida)} · {solicitud.horaPreferida}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Enviada el</dt>
          <dd className="text-ink-900">{formatFecha(solicitud.createdAt.slice(0, 10))}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onVerDetalle}>Ver detalles</Button>
        <Button size="sm" onClick={onAceptar}>Aceptar solicitud</Button>
        <Button variant="destructive" size="sm" onClick={onRechazar}>Rechazar solicitud</Button>
      </div>
    </article>
  )
}
