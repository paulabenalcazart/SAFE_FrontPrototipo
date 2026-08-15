import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccessibleDialog } from '@/portal/plan/useAccessibleDialog'

const OPCIONES_ANTICIPACION = [1, 3, 5, 7, 15, 30]

export function ConfigurarRecordatorioDialog({
  abierto,
  valorInicial,
  onCerrar,
  onGuardar,
}: {
  abierto: boolean
  valorInicial?: number
  onCerrar: () => void
  onGuardar: (dias: number) => void
}) {
  const [dias, setDias] = useState(valorInicial ?? 7)
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const confirmar = () => {
    if (!Number.isFinite(dias) || dias < 1) return
    onGuardar(dias)
    onCerrar()
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
        aria-labelledby="configurar-recordatorio-titulo"
        className="animate-safe-pop-in relative w-full max-w-[420px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="configurar-recordatorio-titulo"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Configurar recordatorio
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
          Elige con cuántos días de anticipación al vencimiento quieres que te avisemos.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {OPCIONES_ANTICIPACION.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setDias(opcion)}
              aria-pressed={dias === opcion}
              className={`min-h-9 rounded-lg border px-3 text-[12.5px] font-semibold ${
                dias === opcion
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-line bg-card text-ink-700'
              }`}
            >
              {opcion} {opcion === 1 ? 'día' : 'días'}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <Label htmlFor="recordatorio-dias-custom">O ingresa un número de días personalizado</Label>
          <Input
            id="recordatorio-dias-custom"
            type="number"
            min={1}
            max={90}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="mt-1.5"
          />
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={confirmar} disabled={!Number.isFinite(dias) || dias < 1}>
            Activar recordatorio
          </Button>
        </div>
      </div>
    </div>
  )
}
