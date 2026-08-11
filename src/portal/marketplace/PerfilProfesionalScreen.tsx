import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { ColaboradorMarketplace } from '@/portal/types'
import {
  colaboradorMarketplacePorId,
  horariosActivosDeColaborador,
  resenasPublicadasDeColaborador,
  serviciosActivosDeColaborador,
} from './catalogo'
import { PerfilProfesionalContenido } from './PerfilProfesionalContenido'
import { ReservaModal } from './ReservaModal'

function EstadoPerfil({
  titulo,
  descripcion,
  onVolver,
  tituloRef,
}: {
  titulo: string
  descripcion: string
  onVolver: () => void
  tituloRef: RefObject<HTMLHeadingElement>
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center">
        <div role="status">
          <h1
            ref={tituloRef}
            tabIndex={-1}
            className="text-[22px] font-bold text-ink-900 outline-none"
          >
            {titulo}
          </h1>
          <p className="mt-2 text-[13.5px] text-ink-500">{descripcion}</p>
        </div>
        <button
          type="button"
          onClick={onVolver}
          className="mt-4 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Volver a Marketplace
        </button>
      </div>
    </section>
  )
}

export function PerfilProfesionalScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [profesionalSolicitud, setProfesionalSolicitud] =
    useState<ColaboradorMarketplace | null>(null)
  const tituloPaginaRef = useRef<HTMLHeadingElement>(null)
  const profesional = id ? colaboradorMarketplacePorId(id) : undefined
  const volverAlMarketplace = () => navigate('/app/marketplace')

  useEffect(() => {
    window.scrollTo(0, 0)
    const frame = window.requestAnimationFrame(() => tituloPaginaRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [id])

  if (!profesional) {
    return (
      <EstadoPerfil
        titulo="Profesional no encontrado"
        descripcion="No encontramos un perfil profesional con ese identificador."
        onVolver={volverAlMarketplace}
        tituloRef={tituloPaginaRef}
      />
    )
  }

  if (
    profesional.estado !== 'ACTIVO' ||
    !profesional.visibleMarketplace ||
    profesional.estadoDisponibilidad !== 'DISPONIBLE'
  ) {
    return (
      <EstadoPerfil
        titulo="Profesional no disponible"
        descripcion="Este perfil ya no está disponible para recibir solicitudes en el Marketplace."
        onVolver={volverAlMarketplace}
        tituloRef={tituloPaginaRef}
      />
    )
  }

  const servicios = serviciosActivosDeColaborador(profesional.id)
  const horarios = horariosActivosDeColaborador(profesional.id)
  const resenas = resenasPublicadasDeColaborador(profesional.id)
  const puedeSolicitarContacto = servicios.length > 0

  return (
    <section className="flex flex-col gap-4.5">
      <nav aria-label="Migas de pan" className="flex min-h-10 items-center gap-2 text-[13px]">
        <button
          type="button"
          onClick={volverAlMarketplace}
          className="flex min-h-10 items-center gap-1.5 font-semibold text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Marketplace
        </button>
        <span aria-hidden="true" className="text-ink-500">
          /
        </span>
        <span aria-current="page" className="truncate text-ink-500">
          Perfil profesional
        </span>
      </nav>

      <PerfilProfesionalContenido
        profesional={profesional}
        servicios={servicios}
        horarios={horarios}
        resenas={resenas}
        modo="marketplace"
        onSolicitarContacto={() => setProfesionalSolicitud(profesional)}
        tituloRef={tituloPaginaRef}
      />

      {profesionalSolicitud && puedeSolicitarContacto && (
        <ReservaModal
          abierto
          profesional={profesionalSolicitud}
          onCerrar={() => setProfesionalSolicitud(null)}
        />
      )}
    </section>
  )
}
