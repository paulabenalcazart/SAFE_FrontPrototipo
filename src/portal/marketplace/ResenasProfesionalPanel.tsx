import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'
import { Pagination } from '@/portal/components/Pagination'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { formatFecha } from '@/portal/obligaciones/formato'
import type { ResenaColaborador } from '@/portal/types'

const POR_PAGINA = 6

type OrdenResenas = 'RECIENTES' | 'MEJOR_VALORADAS'

export function ResenasProfesionalPanel({ resenas }: { resenas: ResenaColaborador[] }) {
  const [pagina, setPagina] = useState(1)
  const [calificacion, setCalificacion] = useState(0)
  const [orden, setOrden] = useState<OrdenResenas>('RECIENTES')

  const filtradas = useMemo(() => {
    const resultado = resenas.filter((resena) => calificacion === 0 || resena.calificacion === calificacion)

    return resultado.sort((a, b) => {
      if (orden === 'MEJOR_VALORADAS' && b.calificacion !== a.calificacion) {
        return b.calificacion - a.calificacion
      }
      return b.fecha.localeCompare(a.fecha)
    })
  }, [calificacion, orden, resenas])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  return (
    <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="resenas-profesional-titulo">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="resenas-profesional-titulo" className="text-[18px] font-semibold text-ink-900">
            Reseñas
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            {filtradas.length} {filtradas.length === 1 ? 'opinión publicada' : 'opiniones publicadas'}
          </p>
        </div>

        {resenas.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[430px]">
            <div>
              <label htmlFor="resenas-calificacion" className="mb-1.5 block text-xs font-semibold text-ink-700">
                Calificación
              </label>
              <select
                id="resenas-calificacion"
                value={calificacion}
                onChange={(event) => {
                  setCalificacion(Number(event.target.value))
                  setPagina(1)
                }}
                className="h-11 w-full rounded-lg border border-line bg-card px-3 text-[14px] text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
              >
                <option value={0}>Todas las calificaciones</option>
                {[5, 4, 3, 2, 1].map((nivel) => (
                  <option key={nivel} value={nivel}>
                    {nivel} {nivel === 1 ? 'estrella' : 'estrellas'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="resenas-orden" className="mb-1.5 block text-xs font-semibold text-ink-700">
                Ordenar por
              </label>
              <select
                id="resenas-orden"
                value={orden}
                onChange={(event) => {
                  setOrden(event.target.value as OrdenResenas)
                  setPagina(1)
                }}
                className="h-11 w-full rounded-lg border border-line bg-card px-3 text-[14px] text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
              >
                <option value="RECIENTES">Más recientes</option>
                <option value="MEJOR_VALORADAS">Mejor valoradas</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {visibles.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
          {resenas.length === 0
            ? 'Este profesional aún no tiene reseñas publicadas.'
            : 'No hay reseñas con la calificación seleccionada.'}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibles.map((resena) => (
            <article key={resena.id} className="min-w-0 rounded-xl border border-line/70 bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <CompanyIdentity nombre={resena.autorEmpresa} size="sm" />
                <span role="img" className="flex" aria-label={`${resena.calificacion} de 5 estrellas`}>
                  {Array.from({ length: 5 }, (_, indice) => (
                    <Star
                      key={indice}
                      aria-hidden="true"
                      className={`h-4 w-4 ${
                        indice < resena.calificacion ? 'fill-amber-deep text-amber-deep' : 'text-line'
                      }`}
                    />
                  ))}
                </span>
              </div>
              <p className="mt-3 break-words text-[13px] leading-relaxed text-ink-700">{resena.comentario}</p>
              <p className="mt-3 text-xs text-ink-500">{formatFecha(resena.fecha)}</p>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Pagination
          paginaActual={paginaActual}
          totalPaginas={totalPaginas}
          onChange={setPagina}
          ariaLabel="Páginas de reseñas del profesional"
        />
      </div>
    </section>
  )
}
