import { ChevronLeft, ChevronRight } from 'lucide-react'
import { crearRangoPaginacion } from '@/portal/paginacion'

type PaginationProps = {
  paginaActual: number
  totalPaginas: number
  onChange: (pagina: number) => void
  ariaLabel?: string
}

const claseBoton =
  'num inline-flex h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 disabled:cursor-not-allowed disabled:opacity-45'

export function Pagination({
  paginaActual,
  totalPaginas,
  onChange,
  ariaLabel = 'Paginación',
}: PaginationProps) {
  if (totalPaginas <= 1) return null

  const pagina = Math.min(Math.max(1, paginaActual), totalPaginas)
  const tokens = crearRangoPaginacion(pagina, totalPaginas)

  return (
    <nav aria-label={ariaLabel} className="flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={pagina === 1}
        onClick={() => onChange(pagina - 1)}
        aria-label="Ir a la página anterior"
        className={`${claseBoton} border-line bg-card text-ink-700 hover:bg-surface`}
      >
        <ChevronLeft aria-hidden="true" className="h-4 w-4 sm:mr-1" />
        <span className="hidden sm:inline">Anterior</span>
      </button>

      <div className="flex items-center gap-1.5">
        {tokens.map((token) =>
          typeof token === 'number' ? (
            <button
              key={token}
              type="button"
              onClick={() => onChange(token)}
              aria-current={token === pagina ? 'page' : undefined}
              aria-label={`Ir a la página ${token}`}
              className={`${claseBoton} ${
                token === pagina
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : 'border-line bg-card text-ink-700 hover:bg-surface'
              }`}
            >
              {token}
            </button>
          ) : (
            <span
              key={token}
              aria-hidden="true"
              className="num grid h-11 min-w-7 place-items-center text-[13px] font-semibold text-ink-500"
            >
              …
            </span>
          ),
        )}
      </div>

      <button
        type="button"
        disabled={pagina === totalPaginas}
        onClick={() => onChange(pagina + 1)}
        aria-label="Ir a la página siguiente"
        className={`${claseBoton} border-line bg-card text-ink-700 hover:bg-surface`}
      >
        <span className="hidden sm:inline">Siguiente</span>
        <ChevronRight aria-hidden="true" className="h-4 w-4 sm:ml-1" />
      </button>
    </nav>
  )
}
