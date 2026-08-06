import {
  ArrowRight,
  Calendar,
  Check,
  FileSpreadsheet,
  FileText,
  Gauge,
  LayoutDashboard,
  Minus,
  SlidersHorizontal,
  Stethoscope,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { PageHero } from '@/components/PageHero'
import { useReveal } from '@/hooks/useReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'
import { comparativa, planes, planesFaqs } from '@/lib/plans-data'

function PlanCard({ p, i, inView }: { p: (typeof planes)[number]; i: number; inView: boolean }) {
  const price = useCountUp(p.precio, inView, 900)

  return (
    <article
      className={cn(
        'group/card relative flex h-full flex-col overflow-hidden transition-[transform,box-shadow,border-color] duration-300 ease-[var(--ease-expo-out)]',
        p.destacado
          ? 'rounded-[var(--radius-xl)] border border-white/10 bg-[linear-gradient(160deg,var(--safe-primary-900)_0%,var(--safe-primary-700)_55%,var(--safe-primary-600)_100%)] p-6 text-white shadow-[var(--shadow-float)] sm:p-7 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_-14px_oklch(0.28_0.076_253.5/0.55)]'
          : 'surface-card p-6 hover:-translate-y-1 hover:border-navy-500/30 hover:shadow-[var(--shadow-float)]',
        inView ? 'animate-safe-fade-up' : 'opacity-0',
      )}
      style={inView ? { animationDelay: `${i * 100}ms` } : undefined}
    >
      {p.destacado && (
        <>
          <div
            aria-hidden="true"
            className="animate-safe-drift-b pointer-events-none absolute -right-12 -top-16 h-56 w-56 rounded-full bg-navy-100/20 blur-3xl"
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
        <span className="absolute right-6 top-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-navy-100">
          Recomendado
        </span>
      )}

      <h2 className={cn('relative mt-3 text-lg font-semibold', p.destacado ? 'text-white' : 'text-ink-900')}>
        {p.nombre}
      </h2>
      <p className={cn('num relative mt-2 text-4xl font-bold', p.destacado ? 'text-white' : 'text-ink-900')}>
        ${Math.round(price)}
        <span className={cn('text-sm font-medium', p.destacado ? 'text-white/60' : 'text-ink-500')}> /mes</span>
      </p>
      <ul className={cn('relative mt-4 space-y-1 text-[13px]', p.destacado ? 'text-white/60' : 'text-ink-500')}>
        <li>{p.empresas}</li>
        <li>{p.simulaciones}</li>
        <li>{p.soporte}</li>
      </ul>
      <ul
        className={cn(
          'relative mt-5 flex-1 space-y-2 border-t pt-5 text-sm',
          p.destacado ? 'border-white/15 text-white/85' : 'border-line text-ink-700',
        )}
      >
        {p.beneficios.map((b) => (
          <li key={b} className="flex gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" /> {b}
          </li>
        ))}
      </ul>
      <Button
        className={cn(
          'group/btn relative mt-6 w-full transition-[transform,box-shadow] duration-200 ease-[var(--ease-expo-out)] hover:-translate-y-0.5',
          p.destacado &&
            'bg-navy-100 text-navy-900 shadow-[0_10px_28px_-10px_oklch(0.28_0.076_253.5/0.5)] hover:bg-white',
        )}
        variant={p.destacado ? 'default' : 'outline'}
      >
        Contratar {p.nombre}
        <ArrowRight className="h-4 w-4 transition-transform duration-200 ease-[var(--ease-expo-out)] group-hover/btn:translate-x-0.5" />
      </Button>
    </article>
  )
}

function PlanCards() {
  const { ref, inView } = useReveal<HTMLDivElement>()

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <div ref={ref} className="grid gap-5 lg:grid-cols-3">
          {planes.map((p, i) => (
            <PlanCard key={p.nombre} p={p} i={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  )
}

const moduleIcons: Record<string, typeof LayoutDashboard> = {
  'Dashboard financiero': LayoutDashboard,
  'Estados financieros': FileText,
  'Indicadores básicos': Gauge,
  'Indicadores avanzados y comparativos': TrendingUp,
  'Calendario de obligaciones del SRI': Calendar,
  'Simulador de escenarios': SlidersHorizontal,
  'Marketplace de profesionales': Users,
  'Reportes consolidados exportables': FileSpreadsheet,
  'Diagnóstico financiero trimestral': Stethoscope,
}

const columnas = [
  { key: 'esencial', nombre: 'Esencial', destacado: false },
  { key: 'crecimiento', nombre: 'Crecimiento', destacado: true },
  { key: 'corporativo', nombre: 'Corporativo', destacado: false },
] as const

function ComparisonTable() {
  const { ref, inView } = useReveal<HTMLDivElement>()

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
        <h2 className="font-display text-2xl font-semibold text-ink-900">Comparativa de módulos</h2>
        <div
          ref={ref}
          className={cn(
            'mt-6 overflow-hidden overflow-x-auto rounded-2xl border border-line bg-card shadow-[var(--shadow-card)]',
            inView ? 'animate-safe-fade-up' : 'opacity-0',
          )}
        >
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-navy-900">
                <th scope="col" className="px-5 py-4 text-left text-[12px] font-medium uppercase tracking-wide text-white/55">
                  Módulo
                </th>
                {columnas.map((col) => {
                  const plan = planes.find((p) => p.nombre.toLowerCase().includes(col.nombre.toLowerCase()))
                  return (
                    <th
                      key={col.key}
                      scope="col"
                      className="relative px-5 py-4 text-center align-bottom"
                    >
                      {col.destacado && (
                        <>
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-0 bottom-0 h-[3px] bg-emerald-brand"
                          />
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-brand">
                            Recomendado
                          </span>
                        </>
                      )}
                      <span
                        className={cn(
                          'block text-[13px] font-semibold',
                          col.destacado ? 'text-white' : 'text-white/75',
                        )}
                      >
                        {col.nombre}
                      </span>
                      {plan && (
                        <span className="num mt-0.5 block text-xs font-medium text-white/45">
                          ${plan.precio}/mes
                        </span>
                      )}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {comparativa.map((row, ri) => {
                const Icon = moduleIcons[row.modulo]
                const isLast = ri === comparativa.length - 1
                const rowDelay = 60 + ri * 55
                return (
                  <tr
                    key={row.modulo}
                    className="group/row transition-colors duration-200 ease-[var(--ease-expo-out)] hover:bg-navy-100/35"
                  >
                    <td
                      className={cn(
                        'px-5 py-3.5 text-ink-900',
                        !isLast && 'border-b border-line',
                      )}
                    >
                      <span
                        className={cn('flex items-center gap-2.5', inView ? 'animate-safe-pop-in' : 'opacity-0')}
                        style={inView ? { animationDelay: `${rowDelay}ms` } : undefined}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-navy-100 text-navy-700 transition-transform duration-200 ease-[var(--ease-expo-out)] group-hover/row:scale-110">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="font-medium">{row.modulo}</span>
                      </span>
                    </td>
                    {[row.esencial, row.crecimiento, row.corporativo].map((v, i) => (
                      <td
                        key={i}
                        className={cn(
                          'px-5 py-3.5 text-center transition-colors duration-200 ease-[var(--ease-expo-out)]',
                          !isLast && 'border-b border-line',
                          i === 1 &&
                            'border-x border-emerald-brand/20 bg-emerald-soft/25 group-hover/row:bg-emerald-soft/45',
                        )}
                      >
                        {v ? (
                          <span
                            className={cn(
                              'inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-soft transition-transform duration-200 ease-[var(--ease-expo-out)] group-hover/row:scale-110',
                              inView ? 'animate-safe-pop-in' : 'opacity-0',
                            )}
                            style={inView ? { animationDelay: `${rowDelay + 40}ms` } : undefined}
                          >
                            <Check className="h-3.5 w-3.5 text-emerald-deep" aria-label="Incluido" />
                          </span>
                        ) : (
                          <Minus className="mx-auto h-4 w-4 text-ink-500/40" aria-label="No incluido" />
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

function PlansFaq() {
  const { ref, inView } = useReveal<HTMLDivElement>()

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
      <h2 className="font-display text-2xl font-semibold text-ink-900">Preguntas frecuentes</h2>
      <div ref={ref} className={cn('mt-6', inView ? 'animate-safe-fade-up' : 'opacity-0')}>
        <Accordion type="single" collapsible>
          {planesFaqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-sm font-medium text-ink-900">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-700">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

export function PlanesPage() {
  return (
    <>
      <PageHero
        eyebrow="Planes"
        titulo="Elige el plan que acompaña el momento de tu empresa"
        texto="Todos los planes incluyen tu dashboard, tu calendario tributario y tu histórico financiero. Sin permanencia."
      />
      <div className="view-tint relative">
        <PlanCards />
        <ComparisonTable />
        <PlansFaq />
      </div>
    </>
  )
}
