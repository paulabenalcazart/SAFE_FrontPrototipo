import {
  CalendarClock,
  FileSpreadsheet,
  Gauge,
  LayoutDashboard,
  SlidersHorizontal,
  Store,
} from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const modulos = [
  {
    icon: LayoutDashboard,
    titulo: 'Dashboard',
    texto: 'Tu salud financiera y tu cumplimiento tributario en un vistazo.',
  },
  {
    icon: FileSpreadsheet,
    titulo: 'Estados financieros',
    texto: 'Carga tus periodos y construye tu histórico sin hojas sueltas.',
  },
  {
    icon: Gauge,
    titulo: 'Indicadores',
    texto: 'Liquidez, rentabilidad y endeudamiento calculados automáticamente.',
  },
  {
    icon: CalendarClock,
    titulo: 'Obligaciones tributarias',
    texto: 'Calendario del SRI con alertas antes de cada vencimiento.',
  },
  {
    icon: SlidersHorizontal,
    titulo: 'Simulador',
    texto: 'Prueba escenarios antes de tomar una decisión importante.',
  },
  {
    icon: Store,
    titulo: 'Marketplace',
    texto: 'Contadores, abogados y asesores verificados cuando los necesites.',
  },
]

export function ModulesSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <h2
        className={cn(
          'font-display text-3xl font-semibold text-ink-900',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        Todo lo que tu empresa necesita
      </h2>
      <p
        className={cn(
          'mt-2 max-w-2xl text-sm text-ink-700',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
        style={inView ? { animationDelay: '80ms' } : undefined}
      >
        Seis módulos conectados entre sí: lo que cargas una vez alimenta tus indicadores, tus
        alertas tributarias y tus simulaciones.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {modulos.map((m, i) => (
          <article
            key={m.titulo}
            className={cn(
              'surface-card p-6 transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-float)]',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
            style={inView ? { animationDelay: `${160 + i * 80}ms` } : undefined}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-navy-100 text-navy-700">
              <m.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-4 text-base font-semibold text-ink-900">{m.titulo}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{m.texto}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
