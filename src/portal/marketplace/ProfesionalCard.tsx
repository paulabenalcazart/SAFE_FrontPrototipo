import { useId } from 'react'
import { MapPin, Star } from 'lucide-react'
import type { ColaboradorMarketplace, EspecialidadProfesional } from '@/portal/types'
import { obtenerIniciales } from './calculo'
import { formatModalidad, formatResumenCalificacion, formatTarifaHora } from './formato'

export type ProfesionalCardProps = {
  profesional: ColaboradorMarketplace
  especialidades: EspecialidadProfesional[]
  compacta?: boolean
  onVerPerfil: (profesionalId: string) => void
  onSolicitarContacto?: (profesional: ColaboradorMarketplace) => void
  puedeSolicitarContacto?: boolean
}

export function ProfesionalCard({
  profesional,
  especialidades,
  compacta = false,
  onVerPerfil,
  onSolicitarContacto,
  puedeSolicitarContacto = false,
}: ProfesionalCardProps) {
  const tituloId = useId()
  const especialidadPrincipal =
    especialidades.find((especialidad) => especialidad.id === profesional.especialidadPrincipalId)
      ?.nombre ?? profesional.areaEspecializacion
  const resumenCalificacion = formatResumenCalificacion({
    calificacion: profesional.calificacionPromedio,
    cantidadResenas: profesional.cantidadResenas,
  })

  if (compacta) {
    return (
      <article
        aria-labelledby={tituloId}
        className="flex min-h-[112px] items-center gap-3 rounded-xl border border-line bg-card p-3.5"
      >
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-100 text-[15px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={tituloId} className="truncate text-[14px] font-semibold text-ink-900">
            {profesional.nombres} {profesional.apellidos}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{especialidadPrincipal}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[12px] text-ink-700">
            <Star className="h-3.5 w-3.5 fill-amber-deep text-amber-deep" aria-hidden="true" />
            <span aria-label={resumenCalificacion}>
              {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas})
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatTarifaHora(profesional.tarifaReferencial)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onVerPerfil(profesional.id)}
          aria-label={`Ver perfil de ${profesional.nombres} ${profesional.apellidos}`}
          className="min-h-10 shrink-0 rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Ver
        </button>
      </article>
    )
  }

  return (
    <article
      aria-labelledby={tituloId}
      className="flex min-h-[330px] flex-col gap-2.5 rounded-xl border border-line bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-navy-100 text-[16px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0">
          <h3 id={tituloId} className="text-[15px] font-semibold leading-snug text-ink-900">
            {profesional.nombres} {profesional.apellidos}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {profesional.profesion} · {profesional.ciudadAtencion},{' '}
              {profesional.paisAtencion}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Especialidades">
        {especialidades.map((especialidad) => (
          <span
            key={especialidad.id}
            className="rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700"
          >
            {especialidad.nombre}
          </span>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-700">
        <span>{profesional.aniosExperiencia} años de experiencia</span>
        <span aria-hidden="true">·</span>
        <Star className="h-3.5 w-3.5 fill-amber-deep text-amber-deep" aria-hidden="true" />
        <span aria-label={resumenCalificacion}>
          {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas} reseñas)
        </span>
      </p>

      <p className="line-clamp-3 text-[12.5px] leading-relaxed text-ink-700">
        {profesional.descripcionProfesional}
      </p>

      <p className="mt-auto text-[13.5px] font-bold text-ink-900">
        {formatTarifaHora(profesional.tarifaReferencial)}
        <span className="ml-1.5 text-[11.5px] font-medium text-ink-500">
          · {formatModalidad(profesional.modalidadAtencion)}
        </span>
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onVerPerfil(profesional.id)}
          className="min-h-11 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Ver perfil
        </button>
        {onSolicitarContacto && (
          <button
            type="button"
            disabled={!puedeSolicitarContacto}
            onClick={() => {
              if (puedeSolicitarContacto) onSolicitarContacto(profesional)
            }}
            className="min-h-11 rounded-lg bg-navy-600 px-3 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            {puedeSolicitarContacto ? 'Solicitar contacto' : 'Sin servicios activos'}
          </button>
        )}
      </div>
      {onSolicitarContacto && !puedeSolicitarContacto && (
        <p className="text-[11.5px] text-ink-500">
          Este profesional no tiene servicios activos por el momento.
        </p>
      )}
    </article>
  )
}
