import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AmbientBackdrop } from '@/components/AmbientBackdrop'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'
import { planes } from '@/lib/plans-data'

function PlanCard({ p, i, inView }: { p: (typeof planes)[number]; i: number; inView: boolean }) {
  const price = useCountUp(p.precio, inView, 900)

  return (
    <article
      className={cn(
        'group/card relative flex h-full flex-col overflow-hidden p-6 transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-expo-out)]',
        p.destacado
          ? 'rounded-[var(--radius-xl)] border border-white/10 bg-[linear-gradient(160deg,var(--safe-primary-900)_0%,var(--safe-primary-700)_55%,var(--safe-primary-600)_100%)] text-white shadow-[0_28px_60px_-20px_oklch(0.28_0.076_253.5/0.5)] lg:-my-3 lg:hover:-translate-y-2 hover:shadow-[0_32px_68px_-16px_oklch(0.28_0.076_253.5/0.6)]'
          : 'surface-card hover:-translate-y-1 hover:border-navy-500/30 hover:shadow-[var(--shadow-float)]',
        inView ? 'animate-safe-fade-up' : 'opacity-0',
      )}
      style={inView ? { animationDelay: `${120 + i * 100}ms` } : undefined}
    >
      {p.destacado && (
        <>
          <div
            aria-hidden="true"
            className="animate-safe-drift-b pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-emerald-brand/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="animate-safe-drift-a pointer-events-none absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-navy-500/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        </>
      )}

      {p.destacado && (
        <span className="absolute right-6 top-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-brand/90">
          Más contratado
        </span>
      )}

      <h3 className={cn('relative mt-3 text-lg font-semibold', p.destacado ? 'text-white' : 'text-ink-900')}>
        {p.nombre}
      </h3>
      <p
        className={cn(
          'num relative mt-2 font-bold',
          p.destacado ? 'text-4xl text-white lg:text-5xl' : 'text-4xl text-ink-900',
        )}
      >
        ${Math.round(price)}
        <span className={cn('text-sm font-medium', p.destacado ? 'text-white/60' : 'text-ink-500')}> /mes</span>
      </p>
      <p className={cn('relative mt-1 text-[13px]', p.destacado ? 'text-white/60' : 'text-ink-500')}>
        {p.empresas}
      </p>
      <ul className={cn('relative mt-5 mb-6 space-y-2 text-sm', p.destacado ? 'text-white/85' : 'text-ink-700')}>
        {p.beneficios.map((b) => (
          <li key={b} className="flex gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
            {b}
          </li>
        ))}
      </ul>
      <Button
        className={cn(
          'group/btn relative mt-auto w-full transition-[transform,box-shadow] duration-200 ease-[var(--ease-expo-out)] hover:-translate-y-0.5',
          p.destacado &&
            'bg-emerald-brand text-navy-900 shadow-[0_10px_28px_-10px_oklch(0.68_0.14_165/0.5)] hover:bg-emerald-brand/90',
        )}
        variant={p.destacado ? 'default' : 'outline'}
      >
        Contratar
        <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-expo-out)] group-hover/btn:translate-x-0.5" />
      </Button>
    </article>
  )
}

export function PlansSection({ onVerPlanes }: { onVerPlanes?: () => void }) {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative overflow-hidden bg-surface py-20">
      <AmbientBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 sm:px-8">
        <div
          className={cn(
            'flex flex-wrap items-end justify-between gap-3',
            inView ? 'animate-safe-fade-up' : 'opacity-0',
          )}
        >
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink-900">
              Planes para cada etapa
            </h2>
            <p className="mt-2 text-sm text-ink-700">Cambia de plan cuando tu empresa lo necesite.</p>
          </div>
          <Button
            variant="outline"
            className="group transition-[transform,box-shadow] duration-200 ease-[var(--ease-expo-out)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]"
            onClick={onVerPlanes}
          >
            Comparar planes
            <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-expo-out)] group-hover:translate-x-0.5" />
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {planes.map((p, i) => (
            <PlanCard key={p.nombre} p={p} i={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}
