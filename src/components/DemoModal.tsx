import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Maximize2, Pause, Play, Volume2, X } from 'lucide-react'

const DURATION_SECONDS = 38

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = Math.floor(totalSeconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function DemoModal({
  open,
  onClose,
  title,
  icon: Icon,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  icon: React.ComponentType<{ className?: string }>
  children: ReactNode
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => {
    if (!open) return
    setProgress(0)
    setPlaying(true)
  }, [open, title])

  useEffect(() => {
    if (!open || !playing) return
    const tick = window.setInterval(() => {
      setProgress((p) => {
        const next = p + 100 / (DURATION_SECONDS * 4)
        if (next >= 100) {
          setPlaying(false)
          return 100
        }
        return next
      })
    }, 250)
    return () => window.clearInterval(tick)
  }, [open, playing])

  useEffect(() => {
    if (!open) return

    const previouslyFocused = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  const currentSeconds = (progress / 100) * DURATION_SECONDS

  const togglePlay = () => {
    if (progress >= 100) {
      setProgress(0)
      setPlaying(true)
    } else {
      setPlaying((p) => !p)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-modal-title"
    >
      <div
        aria-hidden="true"
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="animate-safe-pop-in relative w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-[var(--shadow-float)]">
        <div className="relative aspect-video w-full overflow-hidden bg-[#0b1220]">
          <div
            aria-hidden="true"
            className="animate-safe-drift-a pointer-events-none absolute left-1/4 top-1/3 h-[420px] w-[420px] rounded-full bg-navy-500/25 blur-[110px]"
          />
          <div
            aria-hidden="true"
            className="animate-safe-drift-b pointer-events-none absolute bottom-0 right-1/4 h-[360px] w-[360px] rounded-full bg-emerald-brand/15 blur-[100px]"
          />

          <div className="relative flex h-full w-full items-center justify-center p-6 sm:p-10">
            <div className="w-full max-w-md overflow-hidden rounded-lg bg-card text-left shadow-2xl">
              <div className="p-4 sm:p-5">{children}</div>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/70 to-transparent"
          />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 py-3 sm:px-5">
            <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-white/90">
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/80 transition-colors duration-150 hover:bg-white/10 hover:text-white"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent"
          />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-2 sm:px-5">
            <button
              type="button"
              aria-label="Buscar en el video"
              className="group/bar block h-3 w-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const pct = ((e.clientX - rect.left) / rect.width) * 100
                setProgress(Math.min(100, Math.max(0, pct)))
              }}
            >
              <span className="block h-1 w-full overflow-hidden rounded-full bg-white/25 transition-[height] duration-150 group-hover/bar:h-1.5">
                <span
                  className="block h-full rounded-full bg-emerald-brand"
                  style={{ width: `${progress}%` }}
                />
              </span>
            </button>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="grid h-8 w-8 place-items-center rounded-full text-white transition-colors duration-150 hover:bg-white/10"
                  aria-label={playing ? 'Pausar' : 'Reproducir'}
                >
                  {playing ? (
                    <Pause className="h-4 w-4 fill-white" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-0.5 fill-white" />
                  )}
                </button>
                <span className="num text-xs text-white/75">
                  {formatTime(currentSeconds)} / {formatTime(DURATION_SECONDS)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-white/75">
                <Volume2 className="h-4 w-4" aria-hidden="true" />
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>

        <p className="bg-[#0b0f19] px-4 py-2 text-center text-[11px] text-white/40">
          Vista simulada de la interfaz — SAFE aún no publica grabaciones reales.
        </p>
      </div>
    </div>
  )
}
