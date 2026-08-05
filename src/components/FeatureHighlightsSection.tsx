import { SlidersHorizontal, Star, Store } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { AmbientBackdrop } from '@/components/AmbientBackdrop'

const profesionales = [
  { iniciales: 'AC', nombre: 'Andrea Cedeño', rol: 'Contadora', tono: 'bg-navy-100 text-navy-700' },
  {
    iniciales: 'MV',
    nombre: 'Martín Viteri',
    rol: 'Asesor financiero',
    tono: 'bg-emerald-soft text-emerald-deep',
  },
  { iniciales: 'SP', nombre: 'Sofía Paredes', rol: 'Abogada', tono: 'bg-amber-soft text-amber-deep' },
]

function MarketplaceCard({ inView }: { inView: boolean }) {
  return (
    <article className="surface-card flex h-full flex-col p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-float)] sm:p-8">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-100 text-navy-700">
        <Store className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink-900">Encuentra un profesional verificado</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        Contadores, abogados y asesores financieros listos para ayudarte, sin salir a buscarlos por
        tu cuenta.
      </p>

      <div className="mt-6 space-y-2.5">
        {profesionales.map((p, i) => (
          <div
            key={p.nombre}
            className={cn(
              'flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 transition-all duration-500 ease-out',
              inView ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0',
            )}
            style={{ transitionDelay: `${150 + i * 130}ms` }}
          >
            <span
              className={cn(
                'grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold',
                p.tono,
              )}
            >
              {p.iniciales}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{p.nombre}</p>
              <p className="text-xs text-ink-500">{p.rol}</p>
            </div>
            <div className="flex shrink-0 gap-0.5 text-amber-brand">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star key={s} className="h-3 w-3 fill-current" />
              ))}
            </div>
          </div>
        ))}

        <div
          className={cn(
            'flex justify-end transition-all delay-[550ms] duration-500 ease-out',
            inView ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
          )}
        >
          <div className="flex items-center gap-1.5 rounded-2xl rounded-br-sm bg-navy-500 px-3.5 py-2.5">
            {[0, 150, 300].map((d) => (
              <span
                key={d}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/80"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}

const puntosActual = [70, 64, 60, 55, 50]
const puntosOptimista = [70, 55, 40, 22, 8]

function toPath(puntos: number[]) {
  const step = 280 / (puntos.length - 1)
  return puntos.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * step},${y}`).join(' ')
}

function SimuladorCard({ inView }: { inView: boolean }) {
  return (
    <article className="surface-card flex h-full flex-col p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-float)] sm:p-8">
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-100 text-navy-700">
        <SlidersHorizontal className="h-5 w-5" />
      </span>
      <h3 className="mt-4 text-lg font-semibold text-ink-900">Simula antes de decidir</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-700">
        Compara escenarios de ingresos, gastos e impuestos antes de tomar una decisión importante.
      </p>

      <div className="mt-6 flex flex-1 flex-col rounded-xl border border-line bg-surface p-4">
        <div className="flex gap-2">
          <span className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium text-ink-500">
            Actual
          </span>
          <span className="rounded-full bg-navy-500 px-3 py-1 text-xs font-semibold text-white">
            Optimista
          </span>
        </div>

        <svg viewBox="0 0 280 100" className="mt-4 w-full flex-1" preserveAspectRatio="none">
          <path
            d={toPath(puntosActual)}
            fill="none"
            stroke="var(--color-line)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: inView ? 0 : 1,
              transition: 'stroke-dashoffset 900ms var(--ease-out, ease-out) 200ms',
            }}
          />
          <path
            d={toPath(puntosOptimista)}
            fill="none"
            stroke="var(--color-navy-500)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: inView ? 0 : 1,
              transition: 'stroke-dashoffset 1100ms var(--ease-out, ease-out) 350ms',
            }}
          />
        </svg>

        <p
          className={cn(
            'mt-2 text-xs font-medium text-emerald-deep transition-opacity duration-500',
            inView ? 'opacity-100' : 'opacity-0',
          )}
          style={{ transitionDelay: '1200ms' }}
        >
          +34% de utilidad proyectada vs. escenario actual
        </p>
      </div>
    </article>
  )
}

export function FeatureHighlightsSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative w-full overflow-hidden">
      <AmbientBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <MarketplaceCard inView={inView} />
          <SimuladorCard inView={inView} />
        </div>
      </div>
    </section>
  )
}
