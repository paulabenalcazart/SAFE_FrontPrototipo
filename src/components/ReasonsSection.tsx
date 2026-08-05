import { Clock, Home, Lightbulb, ShieldCheck } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const razones = [
  {
    icon: ShieldCheck,
    titulo: 'Seguro y confiable',
    texto: 'Tus datos financieros protegidos con los mismos estándares que un banco.',
  },
  {
    icon: Clock,
    titulo: 'Ahorra tiempo',
    texto: 'Automatiza tareas que antes tomaban horas de hojas de cálculo.',
  },
  {
    icon: Lightbulb,
    titulo: 'Toma mejores decisiones',
    texto: 'Información clara para decidir con datos, no con intuición.',
  },
  {
    icon: Home,
    titulo: 'Hecho para MIPYMES',
    texto: 'Pensado para la realidad de un pequeño negocio ecuatoriano, no de una corporación.',
  },
]

export function ReasonsSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <h2
        className={cn(
          'text-center font-display text-3xl font-semibold text-ink-900',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        ¿Por qué elegir SAFE?
      </h2>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {razones.map((r, i) => (
          <div
            key={r.titulo}
            className={cn(
              'rounded-xl p-5 text-center transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[var(--shadow-float)]',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
            style={inView ? { animationDelay: `${120 + i * 90}ms` } : undefined}
          >
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-soft text-emerald-deep">
              <r.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-3.5 text-sm font-semibold text-ink-900">{r.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{r.texto}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
