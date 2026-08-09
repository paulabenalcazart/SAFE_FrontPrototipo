import { useEffect, useId, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColaboradorMarketplace, EspecialidadProfesional } from '@/portal/types'
import { ProfesionalCard } from './ProfesionalCard'

type DestacadosCarouselProps = {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  onVerPerfil: (profesionalId: string) => void
}

function cantidadVisibleActual(): 1 | 2 | 3 {
  if (typeof window === 'undefined') return 3
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 768px)').matches) return 2
  return 1
}

function useCantidadVisible(): 1 | 2 | 3 {
  const [cantidad, setCantidad] = useState<1 | 2 | 3>(cantidadVisibleActual)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const tablet = window.matchMedia('(min-width: 768px)')
    const actualizar = () => setCantidad(cantidadVisibleActual())

    desktop.addEventListener('change', actualizar)
    tablet.addEventListener('change', actualizar)
    actualizar()

    return () => {
      desktop.removeEventListener('change', actualizar)
      tablet.removeEventListener('change', actualizar)
    }
  }, [])

  return cantidad
}

export function DestacadosCarousel({
  profesionales,
  especialidades,
  onVerPerfil,
}: DestacadosCarouselProps) {
  const tituloId = useId()
  const cantidadVisible = useCantidadVisible()
  const [indice, setIndice] = useState(0)
  const maximo = Math.max(0, profesionales.length - cantidadVisible)

  useEffect(() => {
    setIndice((actual) => Math.min(actual, maximo))
  }, [maximo])

  if (profesionales.length === 0) return null

  const visibles = profesionales.slice(indice, indice + cantidadVisible)
  const inicioHumano = indice + 1
  const finHumano = indice + visibles.length

  return (
    <section aria-labelledby={tituloId}>
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 id={tituloId} className="text-[18px] font-semibold text-ink-900">
          Profesionales destacados
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndice((actual) => Math.max(0, actual - 1))}
            disabled={indice === 0}
            aria-label="Mostrar profesionales destacados anteriores"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIndice((actual) => Math.min(maximo, actual + 1))}
            disabled={indice >= maximo}
            aria-label="Mostrar profesionales destacados siguientes"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Mostrando profesionales {inicioHumano} a {finHumano} de {profesionales.length}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {visibles.map((profesional) => (
          <ProfesionalCard
            key={profesional.id}
            profesional={profesional}
            especialidades={especialidades.filter((especialidad) =>
              profesional.especialidadIds.includes(especialidad.id),
            )}
            compacta
            onVerPerfil={onVerPerfil}
          />
        ))}
      </div>
    </section>
  )
}
