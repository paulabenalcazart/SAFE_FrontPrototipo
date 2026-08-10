import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { useAccessibleDialog } from './useAccessibleDialog'

export function CancelarSuscripcionModal({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const navigate = useNavigate()
  const { cancelarSuscripcion } = usePortalData()
  const [motivo, setMotivo] = useState('')
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const confirmar = () => {
    cancelarSuscripcion(motivo)
    onCerrar()
    navigate('/app/plan/suscripcion')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={(event) => {
          event.preventDefault()
          onCerrar()
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[440px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="cancelar-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Cancelar suscripción
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          La cancelación detiene la renovación automática. Conservas el acceso hasta el{' '}
          {formatFecha(suscripcionSemilla.proximaRenovacion)}.
        </p>
        <div className="mt-4">
          <label htmlFor="cancelar-motivo" className="text-[13px] font-medium text-ink-700">
            Motivo de la cancelación (opcional)
          </label>
          <Textarea
            id="cancelar-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Cuéntanos por qué cancelas"
            className="mt-1.5"
            rows={3}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Volver
          </Button>
          <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmar}>
            Confirmar cancelación
          </Button>
        </div>
      </div>
    </div>
  )
}
