import { useMemo, useState } from 'react'
import { Play } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { VideoTutorial } from '@/portal/types'
import { VideoModal } from './VideoModal'

const INCREMENTO = 3
const INICIAL = 9

export function TutorialesGrid({
  titulo,
  descripcion,
  categorias,
  tutoriales,
}: {
  titulo: string
  descripcion: string
  categorias: readonly string[]
  tutoriales: VideoTutorial[]
}) {
  const [categoria, setCategoria] = useState<string>('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [cantidad, setCantidad] = useState(INICIAL)
  const [videoAbierto, setVideoAbierto] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tutoriales.filter(
      (t) =>
        (categoria === 'Todos' || t.categoria === categoria) &&
        (!q || t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)),
    )
  }, [categoria, busqueda, tutoriales])

  const visibles = filtrados.slice(0, cantidad)
  const hayMas = cantidad < tutoriales.length && categoria === 'Todos' && !busqueda.trim()

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">{titulo}</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">{descripcion}</p>
      </div>

      <Input
        type="search"
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value)
          setCantidad(INICIAL)
        }}
        placeholder="Buscar por título o descripción"
        className="max-w-[520px]"
        aria-label="Buscar tutoriales"
      />

      <div className="flex flex-wrap gap-2">
        {categorias.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setCategoria(c)
              setCantidad(INICIAL)
            }}
            aria-pressed={categoria === c}
            className={`min-h-[38px] rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${
              categoria === c
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-line bg-card text-ink-700 hover:bg-surface'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="rounded-xl border border-line bg-card p-6 text-center text-sm text-ink-500">
          No encontramos tutoriales con esos filtros.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibles.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setVideoAbierto(t.titulo)}
              className="flex flex-col overflow-hidden rounded-xl border border-line bg-card text-left text-ink-900 transition-shadow hover:shadow-[var(--shadow-card)]"
            >
              <span className="relative block aspect-video w-full bg-surface">
                <span aria-hidden="true" className="absolute inset-0 grid place-items-center">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-white/90 text-navy-700">
                    <Play className="h-5 w-5 fill-current" aria-hidden="true" />
                  </span>
                </span>
                <span className="absolute bottom-2 right-2 rounded-md bg-navy-900/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-white">
                  {t.duracion}
                </span>
              </span>
              <span className="flex flex-col gap-1.5 p-3.5">
                <span className="text-sm font-semibold leading-snug">{t.titulo}</span>
                <span className="text-xs text-ink-500">{t.categoria}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {hayMas && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={() => setCantidad((c) => c + INCREMENTO)}>
            Cargar más tutoriales
          </Button>
        </div>
      )}

      <VideoModal titulo={videoAbierto} onCerrar={() => setVideoAbierto(null)} />
    </section>
  )
}
