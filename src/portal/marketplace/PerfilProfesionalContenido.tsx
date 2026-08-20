import { type RefObject } from 'react'
import { Clock, ExternalLink, FileText, Star } from 'lucide-react'
import type {
  ColaboradorMarketplace,
  HorarioDisponibilidad,
  ResenaColaborador,
  ServicioProfesional,
} from '@/portal/types'
import { formatEstadoDisponibilidad } from '@/portal/colaborador/formato'
import { formatUSD } from '@/portal/financiero/formato'
import { especialidadesDeColaborador } from './catalogo'
import {
  formatDuracion,
  formatModalidad,
  formatRangoHorario,
  formatResumenCalificacion,
  formatTarifaHora,
} from './formato'
import { obtenerIniciales } from './calculo'
import { esUrlDocumentoPermitida } from './documentos'
import { ResenasProfesionalPanel } from './ResenasProfesionalPanel'
import { Card } from '@/portal/components/Card'

const DIAS_SEMANA: { dia: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string }[] = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 7, label: 'Domingo' },
]

function nombreDocumento(url: string, fallback: string): string {
  if (url.startsWith('blob:')) return fallback
  const ruta = url.split(/[?#]/)[0]
  const nombre = ruta.split('/').pop()
  return nombre || fallback
}
export function PerfilProfesionalContenido({
  profesional,
  servicios,
  horarios,
  resenas,
  modo,
  onSolicitarContacto,
  tituloRef,
}: {
  profesional: ColaboradorMarketplace
  servicios: ServicioProfesional[]
  horarios: HorarioDisponibilidad[]
  resenas: ResenaColaborador[]
  modo: 'marketplace' | 'vista-previa'
  onSolicitarContacto?: () => void
  tituloRef?: RefObject<HTMLHeadingElement>
}) {
  const especialidades = especialidadesDeColaborador(profesional)
  const puedeSolicitarContacto = modo === 'marketplace' && servicios.length > 0
  const nombreCompleto = `${profesional.nombres} ${profesional.apellidos}`
  const resumenCalificacion = formatResumenCalificacion({
    calificacion: profesional.calificacionPromedio,
    cantidadResenas: profesional.cantidadResenas,
  })

  const horariosPorDia = DIAS_SEMANA.map(({ dia, label }) => ({
    dia,
    label,
    franjas: horarios.filter((horario) => horario.diaSemana === dia),
  })).filter((grupo) => grupo.franjas.length > 0)

  const campos = [
    { label: 'Área', valor: profesional.areaEspecializacion },
    { label: 'Profesión', valor: profesional.profesion },
    { label: 'Trabajo actual', valor: profesional.trabajoActual ?? 'Independiente' },
    { label: 'Modalidad', valor: formatModalidad(profesional.modalidadAtencion) },
    { label: 'País de atención', valor: profesional.paisAtencion },
    { label: 'Ciudad de atención', valor: profesional.ciudadAtencion },
    { label: 'Zona horaria', valor: profesional.zonaHoraria },
    { label: 'Tarifa referencial', valor: formatTarifaHora(profesional.tarifaReferencial) },
    { label: 'Experiencia', valor: `${profesional.aniosExperiencia} años` },
    { label: 'Disponibilidad semanal', valor: `${horarios.length} franjas` },
    { label: 'Calificación', valor: resumenCalificacion },
    ...(profesional.numeroLicencia
      ? [{ label: 'Número de licencia', valor: profesional.numeroLicencia }]
      : []),
    ...(profesional.entidadEmisora
      ? [{ label: 'Entidad emisora', valor: profesional.entidadEmisora }]
      : []),
  ]

  const cvEnlazable =
    profesional.cvVisible &&
    Boolean(profesional.cvUrl) &&
    esUrlDocumentoPermitida(profesional.cvUrl)
  const credencialEnlazable =
    Boolean(profesional.archivoCredencialUrl) &&
    esUrlDocumentoPermitida(profesional.archivoCredencialUrl)

  return (
    <>
      <header className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 md:flex-row md:items-center">
        {profesional.fotoPerfilUrl ? (
          <img
            src={profesional.fotoPerfilUrl}
            alt={`Foto de ${nombreCompleto}`}
            className="h-20 w-20 shrink-0 rounded-full bg-navy-100 object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy-100 font-display text-[24px] font-bold text-navy-700"
          >
            {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1
              ref={tituloRef}
              tabIndex={-1}
              className="text-[25px] font-bold leading-tight text-ink-900 outline-none"
            >
              {nombreCompleto}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                profesional.estadoDisponibilidad === 'DISPONIBLE'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-surface text-ink-700'
              }`}
            >
              {formatEstadoDisponibilidad(profesional.estadoDisponibilidad)}
            </span>
          </div>

          <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-700">
            {profesional.descripcionProfesional}
          </p>

          <div
            role="group"
            className="mt-2.5 flex flex-wrap items-center gap-1.5"
            aria-label="Especialidades y calificación"
          >
            {especialidades.map((especialidad) => {
              const esPrincipal = especialidad.id === profesional.especialidadPrincipalId
              return (
                <span
                  key={especialidad.id}
                  className="rounded-full bg-navy-100 px-2.5 py-1 text-xs font-semibold text-navy-700"
                >
                  {especialidad.nombre}
                  {esPrincipal ? ' · Principal' : ''}
                </span>
              )
            })}
            <span
              role="img"
              className="ml-1 flex items-center gap-1 text-[13px] text-ink-700"
              aria-label={`Calificación ${profesional.calificacionPromedio.toFixed(1)} de 5, ${
                profesional.cantidadResenas
              } ${profesional.cantidadResenas === 1 ? 'reseña' : 'reseñas'}`}
            >
              <Star className="h-4 w-4 fill-amber-deep text-amber-deep" aria-hidden="true" />
              <span aria-hidden="true">
                {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas} reseñas)
              </span>
            </span>
          </div>
        </div>

        {modo === 'marketplace' && (
          <button
            type="button"
            disabled={!puedeSolicitarContacto}
            onClick={onSolicitarContacto}
            className="min-h-11 w-full rounded-lg bg-navy-600 px-4.5 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
          >
            {puedeSolicitarContacto ? 'Solicitar contacto' : 'Sin servicios disponibles'}
          </button>
        )}
      </header>

      <Card as="section" className="sm:p-5" aria-labelledby="informacion-publica-titulo">
        <h2 id="informacion-publica-titulo" className="text-[18px] font-semibold text-ink-900">
          Información profesional
        </h2>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-3">
          {campos.map((campo) => (
            <div key={campo.label} className="min-w-0 border-b border-line-soft pb-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{campo.label}</dt>
              <dd className="mt-1 break-words text-[14px] text-ink-900">{campo.valor}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-lg bg-surface px-3.5 py-3 text-[13px] leading-relaxed text-ink-700">
          Los datos personales de contacto se mantienen protegidos y solo se comparten mediante el flujo seguro de SAFE.
        </p>
      </Card>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-12">
        <Card as="section" className="flex flex-col sm:p-5 lg:col-span-7" aria-labelledby="servicios-publicos-titulo">
          <h2 id="servicios-publicos-titulo" className="text-[18px] font-semibold text-ink-900">
            Servicios
          </h2>
          {servicios.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-500">
              Este profesional no tiene servicios activos por ahora.
            </p>
          ) : (
            <div className="mt-4 grid flex-1 auto-rows-min gap-3 sm:grid-cols-2">
              {servicios.map((servicio) => (
                <article key={servicio.id} className="min-w-0 rounded-xl border border-line/70 bg-surface p-4">
                  <h3 className="break-words text-[14px] font-semibold text-ink-900">{servicio.nombre}</h3>
                  <p className="mt-2 break-words text-[13px] leading-relaxed text-ink-700">
                    {servicio.descripcion}
                  </p>
                  <p className="mt-3 text-xs font-semibold text-navy-600">
                    {formatDuracion(servicio.duracionEstimadaMinutos)} ·{' '}
                    {formatUSD(servicio.tarifaReferencial)} · {formatModalidad(servicio.modalidad)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </Card>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-span-5" aria-label="Disponibilidad y documentos públicos">
          <Card as="section" className="sm:p-5" aria-labelledby="horarios-publicos-titulo">
            <h2 id="horarios-publicos-titulo" className="flex items-center gap-2 text-[18px] font-semibold text-ink-900">
              <Clock className="h-5 w-5 text-navy-600" aria-hidden="true" />
              Horarios de disponibilidad
            </h2>
            {horariosPorDia.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-500">
                Este profesional no tiene horarios activos por ahora.
              </p>
            ) : (
              <dl className="mt-4 flex flex-col divide-y divide-line-soft">
                {horariosPorDia.map((grupo) => (
                  <div key={grupo.dia} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0 sm:flex-row sm:justify-between sm:gap-4">
                    <dt className="text-[13px] font-medium text-ink-500">{grupo.label}</dt>
                    <dd className="m-0 text-[13px] text-ink-900 sm:text-right">
                      {grupo.franjas.map((franja) => (
                        <span key={franja.id} className="block">
                          {formatRangoHorario({ horaInicio: franja.horaInicio, horaFin: franja.horaFin })}{' '}
                          · {formatModalidad(franja.modalidad)}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>

          <Card as="section" className="sm:p-5" aria-labelledby="documentos-publicos-titulo">
            <h2 id="documentos-publicos-titulo" className="text-[18px] font-semibold text-ink-900">
              Documentos públicos
            </h2>
            <div className="mt-4 flex flex-col divide-y divide-line-soft">
              <article className="flex min-w-0 items-start gap-3 pb-4">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink-900">Hoja de vida (CV)</h3>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {cvEnlazable
                      ? 'Publicada para empresas'
                      : profesional.cvVisible
                        ? 'Marcada como pública · archivo no cargado'
                        : 'No publicada'}
                  </p>
                  {cvEnlazable && profesional.cvUrl && (
                    <a
                      href={profesional.cvUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-2 text-[13px] font-semibold text-navy-700 hover:bg-navy-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
                    >
                      <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">{nombreDocumento(profesional.cvUrl, 'Ver hoja de vida')}</span>
                      <span className="sr-only"> (se abre en una nueva pestaña)</span>
                    </a>
                  )}
                </div>
              </article>

              <article className="flex min-w-0 items-start gap-3 pt-4">
                <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[14px] font-semibold text-ink-900">Credencial profesional</h3>
                  <p className="mt-1 text-[13px] text-ink-500">
                    {credencialEnlazable ? 'Documento publicado' : 'No cargada'}
                  </p>
                  {credencialEnlazable && profesional.archivoCredencialUrl && (
                    <a
                      href={profesional.archivoCredencialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex min-h-11 max-w-full items-center gap-2 rounded-lg px-2 text-[13px] font-semibold text-navy-700 hover:bg-navy-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
                    >
                      <ExternalLink aria-hidden="true" className="h-4 w-4 shrink-0" />
                      <span className="truncate">
                        {nombreDocumento(profesional.archivoCredencialUrl, 'Ver credencial')}
                      </span>
                      <span className="sr-only"> (se abre en una nueva pestaña)</span>
                    </a>
                  )}
                </div>
              </article>
            </div>
          </Card>
        </aside>
      </div>

      <ResenasProfesionalPanel resenas={resenas} />
    </>
  )
}
