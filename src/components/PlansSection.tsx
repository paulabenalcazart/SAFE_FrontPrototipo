import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const planes = [
  {
    nombre: 'Plan Esencial',
    precio: 29,
    empresas: '1 empresa',
    beneficios: [
      'Dashboard financiero',
      'Carga de estados financieros',
      'Indicadores básicos',
      'Calendario de obligaciones',
    ],
    destacado: false,
  },
  {
    nombre: 'Plan Crecimiento',
    precio: 59,
    empresas: '3 empresas',
    beneficios: [
      'Todo lo del Plan Esencial',
      'Indicadores avanzados y comparativos',
      'Simulador de escenarios',
      'Acceso al marketplace de profesionales',
      'Alertas tributarias personalizadas',
    ],
    destacado: true,
  },
  {
    nombre: 'Plan Corporativo',
    precio: 119,
    empresas: '10 empresas (cobro adicional por empresa extra)',
    beneficios: [
      'Todo lo del Plan Crecimiento',
      'Reportes exportables y consolidados',
      'Diagnóstico financiero trimestral',
      'Acompañamiento de un asesor SAFE',
    ],
    destacado: false,
  },
]

export function PlansSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-8">
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
          <Button variant="outline" className="transition-transform duration-200 hover:scale-[1.02]">
            Comparar planes
          </Button>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {planes.map((p, i) => (
            <article
              key={p.nombre}
              className={cn(
                'surface-card flex h-full flex-col p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-float)]',
                p.destacado && 'border-navy-500 ring-2 ring-navy-500/25',
                inView ? 'animate-safe-fade-up' : 'opacity-0',
              )}
              style={inView ? { animationDelay: `${120 + i * 100}ms` } : undefined}
            >
              {p.destacado && (
                <span className="inline-flex rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-700">
                  Más contratado
                </span>
              )}
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{p.nombre}</h3>
              <p className="num mt-2 text-4xl font-bold text-ink-900">
                ${p.precio}
                <span className="text-sm font-medium text-ink-500"> /mes</span>
              </p>
              <p className="mt-1 text-[13px] text-ink-500">{p.empresas}</p>
              <ul className="mt-5 mb-6 space-y-2 text-sm text-ink-700">
                {p.beneficios.map((b) => (
                  <li key={b} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-auto w-full transition-transform duration-200 hover:scale-[1.02]"
                variant={p.destacado ? 'default' : 'outline'}
              >
                Contratar
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
