import { useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Clock, Star } from 'lucide-react'
import type { ColaboradorMarketplace } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import {
  colaboradorMarketplacePorId,
  especialidadesDeColaborador,
  horariosActivosDeColaborador,
  resenasPublicadasDeColaborador,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  formatDuracion,
  formatModalidad,
  formatRangoHorario,
  formatResumenCalificacion,
  formatTarifaHora,
} from './formato'
import { obtenerIniciales } from './calculo'
import { ReservaModal } from './ReservaModal'

const DIAS_SEMANA: { dia: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string }[] = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 7, label: 'Domingo' },
]

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

  const especialidades = especialidadesDeColaborador(profesional)
  const servicios = serviciosActivosDeColaborador(profesional.id)
  const horarios = horariosActivosDeColaborador(profesional.id)
  const resenas = resenasPublicadasDeColaborador(profesional.id)
  const puedeSolicitarContacto = servicios.length > 0
  const resumenCalificacion = formatResumenCalificacion({
    calificacion: profesional.calificacionPromedio,
    cantidadResenas: profesional.cantidadResenas,
  })

  const horariosPorDia = DIAS_SEMANA.map(({ dia, label }) => ({
    dia,
    label,
    franjas: horarios.filter((horario) => horario.diaSemana === dia),
  })).filter((grupo) => grupo.franjas.length > 0)

  const credenciales: { titulo: string; detalle: string }[] = [
    { titulo: 'Perfil validado por SAFE', detalle: profesional.profesion },
  ]
  if (profesional.numeroLicencia && profesional.entidadEmisora) {
    credenciales.push({
      titulo: `Licencia ${profesional.numeroLicencia}`,
      detalle: profesional.entidadEmisora,
    })
  } else if (profesional.trabajoActual) {
    credenciales.push({
      titulo: 'Experiencia declarada',
      detalle: profesional.trabajoActual,
    })
  }

  const campos = [
    { label: 'Área', valor: profesional.areaEspecializacion },
    { label: 'Profesión', valor: profesional.profesion },
    { label: 'Trabajo actual', valor: profesional.trabajoActual ?? 'Independiente' },
    { label: 'Modalidad', valor: formatModalidad(profesional.modalidadAtencion) },
    { label: 'País', valor: profesional.paisAtencion },
    { label: 'Ciudad', valor: profesional.ciudadAtencion },
    { label: 'Zona horaria', valor: profesional.zonaHoraria },
    { label: 'Tarifa referencial', valor: formatTarifaHora(profesional.tarifaReferencial) },
    { label: 'Experiencia', valor: `${profesional.aniosExperiencia} años` },
    { label: 'Disponibilidad', valor: `${horarios.length} franjas semanales` },
    { label: 'Calificación', valor: resumenCalificacion },
    {
      label: 'Hoja de vida',
      valor: profesional.cvVisible ? 'Disponible para empresas' : 'No compartida',
    },
  ]

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

      <header className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 md:flex-row md:items-center">
        <span
          aria-hidden="true"
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy-100 font-display text-[24px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0 flex-1">
          <h1
            ref={tituloPaginaRef}
            tabIndex={-1}
            className="text-[25px] font-bold leading-tight text-ink-900 outline-none"
          >
            {profesional.nombres} {profesional.apellidos}
          </h1>
          <p className="mt-1 text-[13px] font-medium text-ink-500">
            {profesional.profesion} · {profesional.ciudadAtencion}, {profesional.paisAtencion}
          </p>
          <div
            className="mt-2.5 flex flex-wrap items-center gap-1.5"
            aria-label="Especialidades y calificación"
          >
            {especialidades.map((especialidad) => (
              <span
                key={especialidad.id}
                className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700"
              >
                {especialidad.nombre}
              </span>
            ))}
            <span
              role="img"
              className="ml-1 flex items-center gap-1 text-[12.5px] text-ink-700"
              aria-label={resumenCalificacion}
            >
              <Star
                className="h-3.5 w-3.5 fill-amber-deep text-amber-deep"
                aria-hidden="true"
              />
              <span aria-hidden="true">
                {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas}{' '}
                reseñas)
              </span>
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={!puedeSolicitarContacto}
          onClick={() => {
            if (puedeSolicitarContacto) setProfesionalSolicitud(profesional)
          }}
          className="min-h-11 w-full rounded-lg bg-navy-600 px-4.5 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {puedeSolicitarContacto ? 'Solicitar contacto' : 'Sin servicios disponibles'}
        </button>
      </header>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Acerca de</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
          {profesional.descripcionProfesional}
        </p>
        <p className="mt-4 rounded-lg bg-surface px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-700">
          Tus datos de contacto se mantienen protegidos; SAFE facilitará el contacto cuando el
          profesional acepte la solicitud.
        </p>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Resumen profesional</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-5.5 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
          {campos.map((campo) => (
            <div key={campo.label} className="min-w-0">
              <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                {campo.label}
              </dt>
              <dd className="mt-1 break-words text-[13.5px] text-ink-900">{campo.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold text-ink-900">Servicios</h2>
          {servicios.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-500">
              Este profesional no tiene servicios activos por ahora.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2.5">
              {servicios.map((servicio) => (
                <article
                  key={servicio.id}
                  className="rounded-xl border border-line/70 bg-surface p-3.5"
                >
                  <h3 className="text-[13.5px] font-semibold text-ink-900">{servicio.nombre}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">
                    {servicio.descripcion}
                  </p>
                  <p className="mt-2 text-[12px] font-semibold text-navy-600">
                    {formatDuracion(servicio.duracionEstimadaMinutos)} ·{' '}
                    {formatUSD(servicio.tarifaReferencial)} · {formatModalidad(servicio.modalidad)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink-900">
              <Clock className="h-4.5 w-4.5 text-navy-600" aria-hidden="true" />
              Horarios de disponibilidad
            </h2>
            {horariosPorDia.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-500">
                Este profesional no tiene horarios activos por ahora.
              </p>
            ) : (
              <dl className="mt-3 flex flex-col gap-2.5">
                {horariosPorDia.map((grupo) => (
                  <div
                    key={grupo.dia}
                    className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4"
                  >
                    <dt className="text-[13px] text-ink-500">{grupo.label}</dt>
                    <dd className="m-0 text-[13px] text-ink-900 sm:text-right">
                      {grupo.franjas.map((franja) => (
                        <span key={franja.id} className="block">
                          {formatRangoHorario({
                            horaInicio: franja.horaInicio,
                            horaFin: franja.horaFin,
                          })}{' '}
                          · {formatModalidad(franja.modalidad)}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </section>

          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold text-ink-900">Experiencia</h2>
            <p className="mt-2 text-[13.5px] text-ink-900">
              {profesional.aniosExperiencia} años de experiencia
            </p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              {profesional.trabajoActual ?? 'Profesional independiente'}
            </p>
          </section>

          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold text-ink-900">Formación</h2>
            <p className="mt-2 text-[13.5px] text-ink-900">{profesional.profesion}</p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Área de especialización: {profesional.areaEspecializacion}
            </p>
          </section>

          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold text-ink-900">Credenciales</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {credenciales.map((credencial) => (
                <div
                  key={`${credencial.titulo}-${credencial.detalle}`}
                  className="flex items-start gap-2.5"
                >
                  <BadgeCheck
                    className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-deep"
                    aria-hidden="true"
                  />
                  <p className="text-[13px] leading-relaxed text-ink-700">
                    <strong className="font-semibold text-ink-900">{credencial.titulo}</strong> ·{' '}
                    {credencial.detalle}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Reseñas</h2>
        {resenas.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Este profesional aún no tiene reseñas publicadas.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {resenas.map((resena) => (
              <article key={resena.id} className="rounded-xl border border-line/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink-900">
                    {resena.autorEmpresa}
                  </h3>
                  <span
                    role="img"
                    className="flex"
                    aria-label={`${resena.calificacion} de 5 estrellas`}
                  >
                    {Array.from({ length: 5 }, (_, indice) => (
                      <Star
                        key={indice}
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 ${
                          indice < resena.calificacion
                            ? 'fill-amber-deep text-amber-deep'
                            : 'text-line'
                        }`}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">
                  {resena.comentario}
                </p>
                <p className="mt-2 text-[11.5px] text-ink-500">
                  {formatFecha(resena.fecha)}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

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
