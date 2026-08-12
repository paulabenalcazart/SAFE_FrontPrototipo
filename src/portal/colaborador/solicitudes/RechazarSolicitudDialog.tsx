import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const MOTIVO_MIN = 10
const MOTIVO_MAX = 500

export function RechazarSolicitudDialog({
  solicitudId,
  onCerrar,
  onExito,
}: {
  solicitudId: string
  onCerrar: () => void
  onExito: () => void
}) {
  const { solicitudesColaborador, rechazarSolicitudColaborador } = usePortalData()
  const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)

  const [motivo, setMotivo] = useState('')
  const [tocado, setTocado] = useState(false)
  const [intentoEnvio, setIntentoEnvio] = useState(false)
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
        // This dialog has a single terminal state (no post-success step), so every close
        // affordance -- backdrop click, header X, Escape, Cancelar -- calls the same
        // onCerrar prop unconditionally.
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

  if (!solicitud) return null

  const motivoLimpio = motivo.trim()
  const esValido = motivoLimpio.length >= MOTIVO_MIN && motivoLimpio.length <= MOTIVO_MAX
  const mostrarError = (tocado || intentoEnvio) && !esValido

  const confirmar = () => {
    setIntentoEnvio(true)
    if (!esValido) return

    const exito = rechazarSolicitudColaborador(solicitud.id, motivo)
    if (!exito) {
      setError('No se pudo rechazar la solicitud. Puede que ya haya sido respondida.')
      return
    }
    setError(null)
    onExito()
  }

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
        aria-labelledby="rechazar-solicitud-titulo"
        className="animate-safe-pop-in relative flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-4 sm:px-6">
          <h2
            ref={dialogTitleRef}
            id="rechazar-solicitud-titulo"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Rechazar solicitud
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-4">
            <p className="text-sm text-ink-500">
              Cuéntale a la empresa por qué no puedes atender esta solicitud. El motivo será visible para
              ella.
            </p>
            <div>
              <label htmlFor="rechazar-motivo" className="text-xs font-semibold text-ink-700">
                Motivo de rechazo <span className="font-normal text-ink-500">(obligatorio)</span>
              </label>
              <Textarea
                id="rechazar-motivo"
                value={motivo}
                required
                maxLength={MOTIVO_MAX}
                rows={4}
                onChange={(event) => setMotivo(event.target.value)}
                onBlur={() => setTocado(true)}
                aria-invalid={mostrarError}
                aria-describedby={
                  mostrarError ? 'rechazar-motivo-ayuda rechazar-motivo-error' : 'rechazar-motivo-ayuda'
                }
                className={mostrarError ? 'border-destructive focus-visible:border-destructive' : undefined}
                placeholder="Explica brevemente el motivo del rechazo."
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                <p id="rechazar-motivo-ayuda" className="text-[11px] text-ink-500">
                  Mínimo {MOTIVO_MIN} caracteres.
                </p>
                <span className="num shrink-0 text-[11px] text-ink-500">
                  {motivoLimpio.length}/{MOTIVO_MAX}
                </span>
              </div>
              {mostrarError && (
                <p id="rechazar-motivo-error" role="alert" className="mt-2 text-xs text-destructive">
                  {motivoLimpio.length < MOTIVO_MIN
                    ? `Escribe al menos ${MOTIVO_MIN} caracteres.`
                    : `El motivo no puede superar los ${MOTIVO_MAX} caracteres.`}
                </p>
              )}
            </div>
            {error && (
              <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
          </div>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" size="lg" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="button" size="lg" onClick={confirmar} disabled={!esValido}>
            Confirmar
          </Button>
        </footer>
      </div>
    </div>
  )
}
