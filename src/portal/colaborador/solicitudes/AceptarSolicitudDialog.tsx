import { CheckCircle2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import { formatDuracion, formatModalidad } from '@/portal/marketplace/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-ink-900">{valor}</dd>
    </div>
  )
}

export function AceptarSolicitudDialog({
  solicitudId,
  onCerrar,
  onExito,
}: {
  solicitudId: string
  onCerrar: () => void
  onExito: () => void
}) {
  const { solicitudesColaborador, serviciosColaborador, aceptarSolicitudColaborador } = usePortalData()
  const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
  const servicio = solicitud ? serviciosColaborador.find((s) => s.id === solicitud.servicioId) : undefined
  const empresa = solicitud ? empresaSolicitantePorId(solicitud.empresaId) : undefined

  const [paso, setPaso] = useState<'CONFIRMAR' | 'EXITO'>('CONFIRMAR')
  const [error, setError] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

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
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [])

  useEffect(() => {
    dialogTitleRef.current?.focus()
  }, [paso])

  if (!solicitud || !servicio) return null

  const confirmar = () => {
    const resultado = aceptarSolicitudColaborador(solicitud.id, servicio.modalidad)
    if (!resultado.ok) {
      setError(resultado.motivo)
      return
    }
    setError(null)
    setPaso('EXITO')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={paso === 'CONFIRMAR' ? onCerrar : undefined}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="aceptar-solicitud-titulo"
        className="animate-safe-pop-in relative flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-4 sm:px-6">
          <h2
            ref={dialogTitleRef}
            id="aceptar-solicitud-titulo"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            {paso === 'CONFIRMAR' ? 'Aceptar solicitud' : 'Solicitud aceptada'}
          </h2>
          {paso === 'CONFIRMAR' && (
            <button
              type="button"
              onClick={onCerrar}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {paso === 'CONFIRMAR' ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-500">
                Revisa los datos antes de confirmar. Al aceptar, se liberará el contacto de la empresa y se
                creará una cita confirmada.
              </p>
              <div className="rounded-xl border border-line/70 bg-surface/50 p-4">
                <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa no encontrada'} iniciales={empresa?.iniciales} />
                <dl className="mt-4 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                  <Campo label="Servicio" valor={servicio.nombre} />
                  <Campo label="Fecha solicitada" valor={formatFecha(solicitud.fechaPreferida)} />
                  <Campo label="Hora solicitada" valor={solicitud.horaPreferida} />
                  <Campo label="Duración" valor={formatDuracion(servicio.duracionEstimadaMinutos)} />
                  <Campo label="Modalidad" valor={formatModalidad(servicio.modalidad)} />
                </dl>
              </div>
              {error && (
                <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div role="status" aria-live="polite" className="text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-deep" aria-hidden="true" />
              <p className="mt-3 text-base font-semibold text-ink-900">Contacto liberado</p>
              <p className="mt-2 text-sm leading-6 text-ink-500">
                La empresa ya puede ver tus datos de contacto y se creó una cita confirmada.
              </p>
            </div>
          )}
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          {paso === 'CONFIRMAR' ? (
            <>
              <Button type="button" variant="outline" size="lg" onClick={onCerrar}>
                Cancelar
              </Button>
              <Button type="button" size="lg" onClick={confirmar}>
                Confirmar
              </Button>
            </>
          ) : (
            <Button type="button" size="lg" onClick={onExito}>
              Cerrar
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
