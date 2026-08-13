import { useState } from 'react'
import { ArrowLeft, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { Pagination } from '@/portal/components/Pagination'
import { RESENAS_COLABORADORES } from '@/portal/marketplace/catalogo'
import { calcularCalificacionPromedio } from '@/portal/colaborador/calculo'
import { formatFecha } from '@/portal/obligaciones/formato'
import type { ResenaColaborador } from '@/portal/types'

const POR_PAGINA = 6
const NIVELES_ESTRELLAS = [5, 4, 3, 2, 1] as const

function distribucionEstrellas(resenas: ResenaColaborador[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  for (const r of resenas) distribucion[r.calificacion] += 1
  return distribucion
}

export function TodasLasResenasScreen() {
  const navigate = useNavigate()
  const { colaboradorPerfil } = usePortalData()
  const [pagina, setPagina] = useState<number>(1)
  const [filtro, setFiltro] = useState<0 | 1 | 2 | 3 | 4 | 5>(0)

  const resenasPublicadas = RESENAS_COLABORADORES.filter(
    (r) => r.colaboradorId === colaboradorPerfil.id && r.estado === 'PUBLICADA',
  )
  const { promedio, cantidad } = calcularCalificacionPromedio(resenasPublicadas)
  const distribucion = distribucionEstrellas(resenasPublicadas)

  const resenasFiltradas = resenasPublicadas
    .filter((r) => filtro === 0 || r.calificacion === filtro)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))

  const totalPaginas = Math.max(1, Math.ceil(resenasFiltradas.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const visibles = resenasFiltradas.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA)

  function cambiarFiltro(valor: 0 | 1 | 2 | 3 | 4 | 5) {
    setFiltro(valor)
    setPagina(1)
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/perfil')}
          className="flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mi perfil
        </button>
      </div>

      <div>
        <h1 className="text-[28px] font-bold leading-tight text-ink-900">Todas las reseñas</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Lo que las empresas dicen sobre tu trabajo en SAFE.
        </p>
      </div>

      {/* Cabecera: promedio, total y distribución */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span
            role="img"
            aria-label={`Calificación ${promedio?.toFixed(1) ?? 'sin datos'} de 5, ${cantidad} reseñas`}
            className="flex items-center gap-1.5 text-[20px] font-bold text-ink-900"
          >
            <Star className="h-5 w-5 fill-amber-deep text-amber-deep" aria-hidden="true" />
            {promedio === null ? 'Sin reseñas' : promedio.toFixed(1)}
          </span>
          <span className="text-[13px] text-ink-500">
            {cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'}
          </span>
        </div>

        <div className="mt-4 flex flex-col gap-1.5">
          {NIVELES_ESTRELLAS.map((estrella) => {
            const conteo = distribucion[estrella]
            const porcentaje = cantidad === 0 ? 0 : Math.round((conteo / cantidad) * 100)
            return (
              <div key={estrella} className="flex items-center gap-2.5 text-[12.5px]">
                <span className="w-[68px] shrink-0 text-ink-700">
                  {estrella} estrella{estrella !== 1 ? 's' : ''}
                </span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface">
                  <span
                    className="block h-full rounded-full bg-amber-deep"
                    style={{ width: `${porcentaje}%` }}
                  />
                </span>
                <span className="w-6 shrink-0 text-right text-ink-500">{conteo}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {([0, 5, 4, 3, 2, 1] as const).map((valor) => (
          <button
            key={valor}
            type="button"
            onClick={() => cambiarFiltro(valor)}
            aria-pressed={filtro === valor}
            className={`min-h-[38px] rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${
              filtro === valor
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-line bg-card text-ink-700 hover:bg-surface'
            }`}
          >
            {valor === 0 ? 'Todas' : `${valor} estrella${valor !== 1 ? 's' : ''}`}
          </button>
        ))}
      </div>

      {/* Lista paginada */}
      {visibles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-card p-6 text-center text-[13px] text-ink-500">
          No hay reseñas con este filtro.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibles.map((resena) => (
            <article key={resena.id} className="rounded-xl border border-line/70 bg-card p-3.5">
              <CompanyIdentity nombre={resena.autorEmpresa} size="sm" />
              <span role="img" className="mt-2 flex" aria-label={`${resena.calificacion} de 5 estrellas`}>
                {Array.from({ length: 5 }, (_, indice) => (
                  <Star
                    key={indice}
                    aria-hidden="true"
                    className={`h-3.5 w-3.5 ${indice < resena.calificacion ? 'fill-amber-deep text-amber-deep' : 'text-line'}`}
                  />
                ))}
              </span>
              <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{resena.comentario}</p>
              <p className="mt-2 text-[11.5px] text-ink-500">{formatFecha(resena.fecha)}</p>
            </article>
          ))}
        </div>
      )}

      <Pagination
        paginaActual={paginaSegura}
        totalPaginas={totalPaginas}
        onChange={setPagina}
        ariaLabel="Páginas de todas las reseñas"
      />
    </section>
  )
}
