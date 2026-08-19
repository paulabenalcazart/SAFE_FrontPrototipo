import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
import type { PlanCodigo } from '@/portal/types'
import { planPorCodigo } from './catalogo'
import { formatUltimosCuatro } from './formato'
import { useAccessibleDialog } from './useAccessibleDialog'

export function CambiarPlanModal({
  codigo,
  abierto,
  onCerrar,
}: {
  codigo: PlanCodigo
  abierto: boolean
  onCerrar: () => void
}) {
  const navigate = useNavigate()
  const { cambiarPlan, metodosPago } = usePortalData()
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const nuevoPlan = planPorCodigo(codigo)
  const metodoPredeterminado = metodosPago.find((m) => m.predeterminado)

  const confirmar = () => {
    cambiarPlan(codigo)
    onCerrar()
    navigate('/app/plan')
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
        aria-labelledby="cambiar-plan-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[440px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="cambiar-plan-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Cambiar a {nuevoPlan.nombre}
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
          El nuevo precio será {formatUSD(nuevoPlan.precio)} por mes y se cobrará con tu método
          predeterminado
          {metodoPredeterminado
            ? ` (${formatUltimosCuatro(metodoPredeterminado.marca, metodoPredeterminado.ultimosCuatro)})`
            : ''}{' '}
          en el siguiente ciclo, el {formatFecha(suscripcionSemilla.proximaRenovacion)}.
        </p>
        {!metodoPredeterminado && (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-destructive">
            Agrega un método de pago para cambiar de plan.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Volver
          </Button>
          <Button onClick={confirmar} disabled={!metodoPredeterminado}>
            Confirmar cambio
          </Button>
        </div>
      </div>
    </div>
  )
}
