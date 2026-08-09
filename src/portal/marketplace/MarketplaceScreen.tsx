import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColaboradorMarketplace } from '@/portal/types'
import {
  COLABORADORES_MARKETPLACE,
  ESPECIALIDADES_PROFESIONALES,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  FILTROS_INICIALES,
  derivarDestacados,
  filtrarProfesionales,
  ordenarProfesionales,
  paginar,
  type FiltrosMarketplace,
  type OrdenMarketplace,
} from './calculo'
import { DestacadosCarousel } from './DestacadosCarousel'
import { ProfesionalCard } from './ProfesionalCard'
import { ReservaModal } from './ReservaModal'

const OPCIONES_ORDEN: { value: OrdenMarketplace; label: string }[] = [
  { value: 'RELEVANCIA', label: 'Relevancia' },
  { value: 'MEJOR_CALIFICADOS', label: 'Mejor calificados' },
  { value: 'MAS_RESENAS', label: 'Más reseñas' },
  { value: 'MENOR_PRECIO', label: 'Menor precio' },
  { value: 'MAYOR_EXPERIENCIA', label: 'Mayor experiencia' },
]

export function MarketplaceScreen() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<FiltrosMarketplace>(FILTROS_INICIALES)
  const [pagina, setPagina] = useState(1)
  const [profesionalSolicitud, setProfesionalSolicitud] =
    useState<ColaboradorMarketplace | null>(null)

  const destacados = useMemo(
    () => derivarDestacados({ profesionales: COLABORADORES_MARKETPLACE }),
    [],
  )

  const filtrados = useMemo(
    () => filtrarProfesionales({
      profesionales: COLABORADORES_MARKETPLACE,
      especialidades: ESPECIALIDADES_PROFESIONALES,
      filtros,
    }),
    [filtros],
  )

  const ordenados = useMemo(
    () => ordenarProfesionales({
      profesionales: filtrados,
      especialidades: ESPECIALIDADES_PROFESIONALES,
      orden: filtros.orden,
      busqueda: filtros.busqueda,
    }),
    [filtrados, filtros.busqueda, filtros.orden],
  )

  const resultado = useMemo(
    () => paginar({ profesionales: ordenados, paginaSolicitada: pagina, porPagina: 6 }),
    [ordenados, pagina],
  )

  const actualizarFiltros = (
    patch: Partial<FiltrosMarketplace>,
    reiniciarPagina = true,
  ) => {
    setFiltros((actuales) => ({ ...actuales, ...patch }))
    if (reiniciarPagina) setPagina(1)
  }

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES)
    setPagina(1)
  }

  const filtrosActivos =
    filtros.busqueda !== '' ||
    filtros.especialidadId !== '' ||
    filtros.tarifaMaxima !== null ||
    filtros.calificacionMinima !== null ||
    filtros.modalidad !== '' ||
    filtros.orden !== 'RELEVANCIA'

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Marketplace de profesionales</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Contadores, abogados y asesores financieros verificados para acompañar a tu empresa.
        </p>
      </div>

      <section aria-labelledby="marketplace-filtros" className="rounded-xl border border-line bg-card p-4">
        <h2 id="marketplace-filtros" className="sr-only">Buscar y filtrar profesionales</h2>
        <label htmlFor="marketplace-busqueda" className="sr-only">
          Buscar por nombre, especialidad o palabra clave
        </label>
        <input
          id="marketplace-busqueda"
          type="search"
          value={filtros.busqueda}
          onChange={(event) => actualizarFiltros({ busqueda: event.target.value })}
          placeholder="Buscar por nombre, especialidad o palabra clave"
          className="min-h-11.5 w-full rounded-xl border border-line bg-card px-3.5 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-navy-500/40"
        />

        <div className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="marketplace-especialidad" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Especialidad
            </label>
            <select
              id="marketplace-especialidad"
              value={filtros.especialidadId}
              onChange={(event) => actualizarFiltros({ especialidadId: event.target.value })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              {ESPECIALIDADES_PROFESIONALES.map((especialidad) => (
                <option key={especialidad.id} value={especialidad.id}>{especialidad.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-precio" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Precio máximo
            </label>
            <select
              id="marketplace-precio"
              value={filtros.tarifaMaxima ?? ''}
              onChange={(event) => actualizarFiltros({
                tarifaMaxima: event.target.value ? Number(event.target.value) : null,
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Cualquier tarifa</option>
              <option value="30">Hasta $30/h</option>
              <option value="40">Hasta $40/h</option>
              <option value="50">Hasta $50/h</option>
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-calificacion" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Calificación mínima
            </label>
            <select
              id="marketplace-calificacion"
              value={filtros.calificacionMinima ?? ''}
              onChange={(event) => actualizarFiltros({
                calificacionMinima: event.target.value ? Number(event.target.value) : null,
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              <option value="4.5">Desde 4.5</option>
              <option value="4.8">Desde 4.8</option>
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-modalidad" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Modalidad
            </label>
            <select
              id="marketplace-modalidad"
              value={filtros.modalidad}
              onChange={(event) => actualizarFiltros({
                modalidad: event.target.value as FiltrosMarketplace['modalidad'],
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="AMBAS">Mixta</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiarFiltros}
          disabled={!filtrosActivos}
          className="mt-3 min-h-10 w-full rounded-lg px-2 text-[13px] font-semibold text-navy-600 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 sm:w-auto"
        >
          Limpiar filtros
        </button>
      </section>

      <DestacadosCarousel
        profesionales={destacados}
        especialidades={ESPECIALIDADES_PROFESIONALES}
        onVerPerfil={(id) => navigate(`/app/marketplace/${id}`)}
      />

      <section aria-labelledby="marketplace-disponibles">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="marketplace-disponibles" className="text-[18px] font-semibold text-ink-900">
              Profesionales disponibles
            </h2>
            <p className="mt-1 text-[13px] text-ink-500" aria-live="polite">
              {resultado.total}{' '}
              {resultado.total === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="marketplace-orden"
              className="mb-1.5 block text-[11.5px] font-semibold text-ink-500 sm:text-right"
            >
              Ordenar por
            </label>
            <select
              id="marketplace-orden"
              value={filtros.orden}
              onChange={(event) =>
                actualizarFiltros({ orden: event.target.value as OrdenMarketplace }, false)
              }
              className="min-h-10 w-full rounded-lg border border-line bg-card px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-navy-500/40 sm:w-auto"
            >
              {OPCIONES_ORDEN.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {resultado.total === 0 ? (
          <div
            role="status"
            className="mt-3.5 rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center"
          >
            <p className="text-[14px] font-semibold text-ink-900">
              Ningún profesional coincide con tu búsqueda.
            </p>
            <p className="mt-1.5 text-[13px] text-ink-500">
              Prueba otra combinación o restablece los filtros.
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-4 min-h-11 w-full rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 sm:w-auto"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resultado.items.map((profesional) => (
              <ProfesionalCard
                key={profesional.id}
                profesional={profesional}
                especialidades={ESPECIALIDADES_PROFESIONALES.filter((especialidad) =>
                  profesional.especialidadIds.includes(especialidad.id),
                )}
                onVerPerfil={(id) => navigate(`/app/marketplace/${id}`)}
                onSolicitarContacto={setProfesionalSolicitud}
                puedeSolicitarContacto={
                  serviciosActivosDeColaborador(profesional.id).length > 0
                }
              />
            ))}
          </div>
        )}

        {resultado.totalPaginas > 1 && (
          <nav aria-label="Páginas de profesionales" className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: resultado.totalPaginas }, (_, indice) => indice + 1).map(
              (numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={() => setPagina(numero)}
                  aria-current={resultado.pagina === numero ? 'page' : undefined}
                  aria-label={`Ir a la página ${numero}`}
                  className={`min-h-10 min-w-10 rounded-lg border px-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 ${
                    resultado.pagina === numero
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {numero}
                </button>
              ),
            )}
          </nav>
        )}
      </section>

      {profesionalSolicitud && (
        <ReservaModal
          abierto
          profesional={profesionalSolicitud}
          onCerrar={() => setProfesionalSolicitud(null)}
        />
      )}
    </section>
  )
}
