import { Button } from '@/components/ui/button'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

export function FinalCtaSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="bg-navy-900 py-20">
      <div
        className={cn(
          'mx-auto max-w-2xl px-6 text-center sm:px-8',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        <h2 className="font-display text-3xl font-semibold text-white">
          Empieza a gestionar tu PYME con confianza
        </h2>
        <p className="mt-3 text-base text-navy-100">
          Encuentra el plan ideal para el tamaño de tu negocio.
        </p>
        <Button size="lg" className="mt-7 transition-transform duration-200 hover:scale-[1.02]">
          Ver planes
        </Button>
      </div>
    </section>
  )
}
