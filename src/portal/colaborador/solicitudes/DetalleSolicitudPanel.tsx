import { ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import { formatUSD } from '@/portal/financiero/formato'
import { formatDuracion, formatModalidad } from '@/portal/marketplace/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { TONE_BADGE_CLASSES } from '@/portal/tone'
import type { EstadoSolicitudContacto, Tono } from '@/portal/types'
import { acquireBodyScrollLock } from './dialogScrollLock'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const ESTADO_TONO: Record<EstadoSolicitudContacto, Tono> = {
  ENVIADA: 'atencion',
  ACEPTADA: 'positivo',
  CONTACTO_LIBERADO: 'positivo',
  FINALIZADA: 'positivo',
  RECHAZADA: 'critico',
  PENDIENTE_PAGO: 'neutro',
  PAGADA: 'neutro',
}

const ESTADO_LABEL: Record<EstadoSolicitudContacto, string> = {
  ENVIADA: 'Enviada',
  ACEPTADA: 'Aceptada',
  CONTACTO_LIBERADO: 'Contacto liberado',
  FINALIZADA: 'Finalizada',
  RECHAZADA: 'Rechazada',
  PENDIENTE_PAGO: 'Pendiente de pago',
  PAGADA: 'Pagada',
}

const FALLBACK_CONTACTO = 'Contacto disponible — SAFE liberó los datos de esta empresa.'

function Fila({ label, valor, multilinea = false }: { label: string; valor: string; multilinea?: boolean }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className={`mt-0.5 text-sm text-ink-900 ${multilinea ? 'whitespace-pre-wrap leading-6' : ''}`}>{valor}</dd>
    </div>
  )
}

function Campo({ label, valor }: { label: string; valor: string | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900">{valor || '—'}</dd>
    </div>
  )
}

export function DetalleSolicitudPanel({
  solicitudId,
  onCerrar,
  onAceptar,
  onRechazar,
}: {
  solicitudId: string
  onCerrar: () => void
  onAceptar?: () => void
  onRechazar?: () => void
}) {
  const { solicitudesColaborador, serviciosColaborador } = usePortalData()
  const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
  const empresa = solicitud ? empresaSolicitantePorId(solicitud.empresaId) : undefined
  const servicio = solicitud ? serviciosColaborador.find((s) => s.id === solicitud.servicioId) : undefined

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const liberarBloqueoScroll = acquireBodyScrollLock()

    const frame = window.requestAnimationFrame(() => dialogTitleRef.current?.focus())

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrarRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (elemento) =>
          !elemento.hasAttribute('disabled') &&
          elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        dialogTitleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (
        event.shiftKey &&
        (activo === primero || activo === dialogTitleRef.current || !dialog.contains(activo))
      ) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (activo === ultimo || !dialog.contains(activo))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      liberarBloqueoScroll()
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [])

  const mostrarContacto = solicitud?.estado === 'CONTACTO_LIBERADO' || solicitud?.estado === 'FINALIZADA'
  const mostrarAcciones = solicitud?.estado === 'ENVIADA' && (Boolean(onAceptar) || Boolean(onRechazar))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onCerrar}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-solicitud-titulo"
        className="animate-safe-pop-in relative flex max-h-[88vh] w-full max-w-[600px] flex-col overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-4 sm:px-6">
          <h2
            ref={dialogTitleRef}
            id="detalle-solicitud-titulo"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            {solicitud ? `Solicitud de ${empresa?.nombre ?? 'la empresa'}` : 'Detalle de solicitud'}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
            aria-label="Cerrar detalle de solicitud"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {!solicitud ? (
            <div role="alert" className="p-6 text-center text-[13px] text-ink-500">
              No encontramos esa solicitud, o no te pertenece.
            </div>
          ) : (
            <div className="space-y-5">
              <section aria-labelledby="detalle-empresa-titulo">
                <h3
                  id="detalle-empresa-titulo"
                  className="text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                >
                  Empresa solicitante
                </h3>
                <div className="mt-2 rounded-xl border border-line/70 bg-surface/50 p-4">
                  <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa no encontrada'} iniciales={empresa?.iniciales} />
                  <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    <Campo label="Razón social" valor={empresa?.general.razonSocial} />
                    <Campo label="RUC" valor={empresa?.ruc} />
                    <Campo label="Responsable" valor={empresa?.representante.nombre} />
                    <Campo label="Actividad económica" valor={empresa?.fiscal.actividadEconomica} />
                    <Campo label="Ciudad" valor={empresa?.ubicacion.ciudad} />
                    <Campo label="Provincia" valor={empresa?.ubicacion.provincia} />
                  </dl>
                </div>
              </section>

              <section aria-labelledby="detalle-datos-titulo">
                <h3
                  id="detalle-datos-titulo"
                  className="text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                >
                  Solicitud
                </h3>
                <dl className="mt-2 divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-surface/50">
                  <Fila label="Servicio solicitado" valor={servicio?.nombre ?? 'Servicio no encontrado'} />
                  <Fila label="Descripción de la solicitud" valor={solicitud.descripcion} multilinea />
                  <Fila label="Fecha enviada" valor={formatFecha(solicitud.createdAt.slice(0, 10))} />
                  <Fila label="Fecha preferida" valor={formatFecha(solicitud.fechaPreferida)} />
                  <Fila label="Hora preferida" valor={solicitud.horaPreferida} />
                  <div className="flex items-center justify-between gap-3 px-4 py-3">
                    <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Estado</dt>
                    <dd>
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
                      >
                        {ESTADO_LABEL[solicitud.estado]}
                      </span>
                    </dd>
                  </div>
                  {solicitud.fechaRespuesta && (
                    <Fila label="Fecha de respuesta" valor={formatFecha(solicitud.fechaRespuesta.slice(0, 10))} />
                  )}
                  {solicitud.estado === 'RECHAZADA' && solicitud.motivoRechazo && (
                    <Fila label="Motivo de rechazo" valor={solicitud.motivoRechazo} multilinea />
                  )}
                  {solicitud.contactoLiberadoAt && (
                    <Fila
                      label="Fecha de liberación del contacto"
                      valor={formatFecha(solicitud.contactoLiberadoAt.slice(0, 10))}
                    />
                  )}
                </dl>
              </section>

              {servicio && (
                <section aria-labelledby="detalle-servicio-titulo">
                  <h3
                    id="detalle-servicio-titulo"
                    className="text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                  >
                    Servicio
                  </h3>
                  <dl className="mt-2 divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-surface/50">
                    <Fila label="Nombre" valor={servicio.nombre} />
                    <Fila label="Descripción" valor={servicio.descripcion} multilinea />
                    <Fila label="Duración estimada" valor={formatDuracion(servicio.duracionEstimadaMinutos)} />
                    <Fila label="Modalidad" valor={formatModalidad(servicio.modalidad)} />
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                        Tarifa referencial
                      </dt>
                      <dd className="num text-sm font-semibold text-ink-900">
                        {formatUSD(servicio.tarifaReferencial)}
                      </dd>
                    </div>
                    <Fila label="Moneda" valor="USD" />
                  </dl>
                  {solicitud.estado === 'ENVIADA' && (
                    <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-soft px-3 py-1.5 text-xs font-medium text-emerald-deep">
                      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                      Pago verificado por SAFE
                    </p>
                  )}
                </section>
              )}

              {mostrarContacto && (
                <section aria-labelledby="detalle-contacto-titulo">
                  <h3
                    id="detalle-contacto-titulo"
                    className="text-[11px] font-semibold uppercase tracking-wide text-ink-500"
                  >
                    Contacto liberado
                  </h3>
                  <dl className="mt-2 divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-surface/50">
                    <Fila label="Correo empresarial" valor={empresa?.contacto.correo || FALLBACK_CONTACTO} />
                    <Fila label="Teléfono empresarial" valor={empresa?.contacto.telefono || FALLBACK_CONTACTO} />
                  </dl>
                </section>
              )}
            </div>
          )}
        </div>

        {mostrarAcciones && (
          <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
            {onRechazar && (
              <Button type="button" variant="destructive" size="lg" onClick={onRechazar}>
                Rechazar solicitud
              </Button>
            )}
            {onAceptar && (
              <Button type="button" size="lg" onClick={onAceptar}>
                Aceptar solicitud
              </Button>
            )}
          </footer>
        )}
      </div>
    </div>
  )
}
