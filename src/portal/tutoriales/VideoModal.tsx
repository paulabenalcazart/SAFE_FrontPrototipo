import { X } from 'lucide-react'
import { useAccessibleDialog } from '@/portal/plan/useAccessibleDialog'

export function VideoModal({
  titulo,
  onCerrar,
}: {
  titulo: string | null
  onCerrar: () => void
}) {
  const abierto = titulo !== null
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/70 backdrop-blur-sm"
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
        aria-labelledby="video-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[720px] overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line-soft px-4.5 py-3.5">
          <h2 ref={titleRef} id="video-modal-title" tabIndex={-1} className="text-base font-semibold text-ink-900 outline-none">
            {titulo}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-line text-ink-700 transition-colors hover:bg-surface"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <div className="grid aspect-video w-full place-items-center bg-surface">
          <p className="max-w-[80%] text-center font-mono text-xs text-ink-700">
            reproductor de video · reemplazar con el video real del tutorial
          </p>
        </div>
      </div>
    </div>
  )
}
