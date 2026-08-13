import type { ReactNode } from 'react'
import { CheckCircle2, ExternalLink, FileText, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { Button } from '@/components/ui/button'
import { RESENAS_COLABORADORES, especialidadProfesionalPorId } from '@/portal/marketplace/catalogo'
import { agruparDisponibilidadPorDia, calcularCalificacionPromedio, inicialesDeNombre } from '@/portal/colaborador/calculo'
import { formatDuracion, formatModalidad, formatTarifaHora } from '@/portal/marketplace/formato'
import { formatEstadoDisponibilidad, formatModalidadEtiqueta, formatPrecioServicio } from '@/portal/colaborador/formato'
import { ICONO_SERVICIO } from '@/portal/colaborador/iconos-servicio'
import { formatFecha } from '@/portal/obligaciones/formato'

type Campo = { label: string; valor: ReactNode }

function CamposDl({ campos }: { campos: Campo[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-5 gap-y-4 sm:grid-cols-2">
      {campos.map((campo) => (
        <div key={campo.label} className="min-w-0 border-b border-line-soft pb-3 last:border-b-0 sm:last:border-b">
          <dt className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{campo.label}</dt>
          <dd className="mt-1 break-words text-[14px] leading-relaxed text-ink-900">{campo.valor}</dd>
        </div>
      ))}
    </dl>
  )
}

export function PerfilColaboradorScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { colaboradorPerfil, serviciosColaborador, horariosColaborador, iconosServicio } = usePortalData()

  const especialidadPrincipal = especialidadProfesionalPorId(colaboradorPerfil.especialidadPrincipalId)
  const resenas = RESENAS_COLABORADORES.filter((r) => r.colaboradorId === colaboradorPerfil.id)
  const { promedio, cantidad } = calcularCalificacionPromedio(resenas)

  const otrasEspecialidades = colaboradorPerfil.especialidades
    .filter((relacion) => !relacion.esPrincipal)
    .map((relacion) => especialidadProfesionalPorId(relacion.especialidadId)?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre))
    .join(', ')

  const nombreArchivoCv = colaboradorPerfil.cvUrl ? colaboradorPerfil.cvUrl.split('/').pop() : null
  const nombreArchivoCredencial = colaboradorPerfil.archivoCredencialUrl
    ? colaboradorPerfil.archivoCredencialUrl.split('/').pop()
    : null

  const enlaceArchivo = (url: string, texto: string) => (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-navy-600 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 focus-visible:ring-offset-2"
    >
      {texto}
      <ExternalLink className="h-4 w-4" aria-hidden="true" />
    </a>
  )

  const camposCuenta: Campo[] = [
    { label: 'Nombres', valor: user?.nombres ?? '—' },
    { label: 'Apellidos', valor: user?.apellidos ?? '—' },
    { label: 'Correo electrónico', valor: user?.correo ?? '—' },
    { label: 'Teléfono', valor: user?.telefono ?? '—' },
    { label: 'País', valor: user?.pais ?? '—' },
    { label: 'Ciudad', valor: user?.ciudad ?? '—' },
  ]

  const camposProfesionales: Campo[] = [
    { label: 'Área de especialización', valor: colaboradorPerfil.areaEspecializacion },
    { label: 'Profesión', valor: colaboradorPerfil.profesion },
    { label: 'Especialidad principal', valor: especialidadPrincipal?.nombre ?? '—' },
    { label: 'Otras especialidades', valor: otrasEspecialidades || '—' },
    { label: 'Trabajo actual', valor: colaboradorPerfil.trabajoActual ?? 'No especificado' },
    { label: 'Años de experiencia', valor: `${colaboradorPerfil.aniosExperiencia} años` },
    { label: 'Modalidad de atención', valor: formatModalidadEtiqueta(colaboradorPerfil.modalidadAtencion) },
    { label: 'País de atención', valor: colaboradorPerfil.paisAtencion },
    { label: 'Ciudad de atención', valor: colaboradorPerfil.ciudadAtencion },
    { label: 'Zona horaria', valor: colaboradorPerfil.zonaHoraria },
    { label: 'Tarifa referencial', valor: formatTarifaHora(colaboradorPerfil.tarifaReferencial) },
    { label: 'Número de licencia', valor: colaboradorPerfil.numeroLicencia ?? 'No especificado' },
    { label: 'Entidad emisora', valor: colaboradorPerfil.entidadEmisora ?? 'No especificada' },
    {
      label: 'Hoja de vida',
      valor: colaboradorPerfil.cvUrl
        ? enlaceArchivo(colaboradorPerfil.cvUrl, nombreArchivoCv ?? 'Ver hoja de vida')
        : 'No cargada',
    },
    { label: 'Hoja de vida visible públicamente', valor: colaboradorPerfil.cvVisible ? 'Sí' : 'No' },
    {
      label: 'Credencial profesional',
      valor: colaboradorPerfil.archivoCredencialUrl
        ? enlaceArchivo(colaboradorPerfil.archivoCredencialUrl, nombreArchivoCredencial ?? 'Ver credencial')
        : 'No cargada',
    },
    { label: 'Estado de disponibilidad', valor: formatEstadoDisponibilidad(colaboradorPerfil.estadoDisponibilidad) },
  ]

  const serviciosActivos = serviciosColaborador.filter((servicio) => servicio.activo)
  const disponibilidad = agruparDisponibilidadPorDia(horariosColaborador)
  const resenasRecientes = resenas
    .filter((r) => r.estado === 'PUBLICADA')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 3)

  return (
    <section className="flex min-w-0 flex-col gap-5">
      <header className="surface-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 md:flex-row md:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border-4 border-card bg-navy-100 shadow-sm">
            {colaboradorPerfil.fotoPerfilUrl ? (
              <img
                src={colaboradorPerfil.fotoPerfilUrl}
                alt={`Foto de perfil de ${colaboradorPerfil.nombres} ${colaboradorPerfil.apellidos}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid h-full w-full place-items-center font-display text-[28px] font-bold text-navy-700"
              >
                {inicialesDeNombre(`${colaboradorPerfil.nombres} ${colaboradorPerfil.apellidos}`)}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">
              {colaboradorPerfil.nombres} {colaboradorPerfil.apellidos}
            </h1>
            <p className="mt-2 text-[16px] font-semibold text-ink-700">{colaboradorPerfil.profesion}</p>
            <p className="mt-1 text-[14px] text-ink-500">{especialidadPrincipal?.nombre ?? 'Sin especialidad principal'}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-[14px]">
              <span
                role="img"
                aria-label={`Calificación ${promedio?.toFixed(1) ?? 'sin datos'} de 5, ${cantidad} reseñas`}
                className="inline-flex items-center gap-1 font-semibold text-ink-900"
              >
                <Star className="h-4 w-4 fill-amber-deep text-amber-deep" aria-hidden="true" />
                {promedio === null ? 'Sin reseñas' : `${promedio.toFixed(1)} (${cantidad} reseñas)`}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-semibold ${
                  colaboradorPerfil.estadoDisponibilidad === 'DISPONIBLE'
                    ? 'bg-emerald-soft text-emerald-deep'
                    : 'bg-surface text-ink-700'
                }`}
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                {formatEstadoDisponibilidad(colaboradorPerfil.estadoDisponibilidad)}
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto sm:flex-row md:flex-col xl:flex-row">
            <Button
              variant="outline"
              className="min-h-11 w-full px-4 focus-visible:ring-2 focus-visible:ring-navy-500/40 sm:w-auto"
              onClick={() => navigate('/app/perfil/vista-previa')}
            >
              Vista previa
            </Button>
            <Button
              className="min-h-11 w-full px-4 focus-visible:ring-2 focus-visible:ring-navy-500/40 sm:w-auto"
              onClick={() => navigate('/app/perfil/editar')}
            >
              Editar perfil
            </Button>
          </div>
        </div>

        <dl className="grid grid-cols-2 border-t border-line bg-surface sm:grid-cols-4">
          {[
            { label: 'Experiencia', valor: `${colaboradorPerfil.aniosExperiencia} años` },
            { label: 'Modalidad', valor: formatModalidadEtiqueta(colaboradorPerfil.modalidadAtencion) },
            { label: 'Tarifa', valor: formatTarifaHora(colaboradorPerfil.tarifaReferencial) },
            { label: 'Ciudad', valor: colaboradorPerfil.ciudadAtencion },
          ].map((dato, indice) => (
            <div
              key={dato.label}
              className={`min-w-0 border-line-soft p-4 ${indice < 2 ? 'border-b' : ''} ${
                indice % 2 === 0 ? 'border-r' : ''
              } ${indice < 3 ? 'sm:border-r' : 'sm:border-r-0'} sm:border-b-0`}
            >
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-ink-500">{dato.label}</dt>
              <dd className="mt-1 break-words text-[14px] font-semibold text-ink-900">{dato.valor}</dd>
            </div>
          ))}
        </dl>
      </header>

      <div className="grid min-w-0 gap-5 lg:grid-cols-12 lg:items-start">
        <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
          <section className="surface-card p-5 sm:p-6" aria-labelledby="perfil-descripcion">
            <h2 id="perfil-descripcion" className="text-[20px] font-semibold text-ink-900">Descripción profesional</h2>
            <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-ink-700">
              {colaboradorPerfil.descripcionProfesional}
            </p>
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="perfil-servicios">
            <h2 id="perfil-servicios" className="text-[20px] font-semibold text-ink-900">Servicios ofrecidos</h2>
            {serviciosActivos.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-line p-5 text-center text-[14px] text-ink-500">
                Aún no tienes servicios activos. Agrégalos desde Editar perfil.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {serviciosActivos.map((servicio) => {
                  const LucideIcon = ICONO_SERVICIO[iconosServicio[servicio.id] ?? 'accounting']
                  return (
                    <article key={servicio.id} className="min-w-0 rounded-xl border border-line bg-surface p-4">
                      <div className="flex items-start gap-3">
                        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
                          <LucideIcon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="break-words text-[16px] font-semibold text-ink-900">{servicio.nombre}</h3>
                          <p className="mt-1 text-[12px] font-semibold text-navy-600">
                            {formatDuracion(servicio.duracionEstimadaMinutos)} · {formatPrecioServicio(servicio.tarifaReferencial)} · {formatModalidad(servicio.modalidad)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 break-words text-[14px] leading-relaxed text-ink-700">{servicio.descripcion}</p>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="perfil-especialidades">
            <h2 id="perfil-especialidades" className="text-[20px] font-semibold text-ink-900">Especialidades</h2>
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {colaboradorPerfil.especialidades.map((relacion) => {
                const especialidad = especialidadProfesionalPorId(relacion.especialidadId)
                return (
                  <li key={relacion.especialidadId} className="min-w-0 rounded-xl border border-line bg-surface p-4">
                    <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
                      <h3 className="min-w-0 break-words text-[16px] font-semibold text-ink-900">
                        {especialidad?.nombre ?? 'Especialidad'}
                      </h3>
                      {relacion.esPrincipal ? (
                        <span className="rounded-full bg-navy-100 px-3 py-1 text-[12px] font-semibold text-navy-700">Principal</span>
                      ) : null}
                    </div>
                    <dl className="mt-3 grid grid-cols-2 gap-3">
                      <div>
                        <dt className="text-[12px] text-ink-500">Experiencia</dt>
                        <dd className="mt-1 text-[14px] font-semibold text-ink-900">{relacion.aniosExperiencia} años</dd>
                      </div>
                      <div>
                        <dt className="text-[12px] text-ink-500">Estado</dt>
                        <dd className="mt-1 text-[14px] font-semibold text-ink-900">{relacion.activo ? 'Activa' : 'Inactiva'}</dd>
                      </div>
                    </dl>
                  </li>
                )
              })}
            </ul>
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="perfil-cuenta">
            <h2 id="perfil-cuenta" className="text-[20px] font-semibold text-ink-900">Datos de cuenta</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-500">Información privada de tu cuenta</p>
            <div className="mt-5">
              <CamposDl campos={camposCuenta} />
            </div>
          </section>

          <section className="surface-card p-5 sm:p-6" aria-labelledby="perfil-resenas">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 id="perfil-resenas" className="text-[20px] font-semibold text-ink-900">Reseñas</h2>
                <p className="mt-1 text-[14px] text-ink-500">Las tres opiniones publicadas más recientes.</p>
              </div>
              <Button
                variant="outline"
                className="min-h-11 w-full px-4 focus-visible:ring-2 focus-visible:ring-navy-500/40 sm:w-auto"
                onClick={() => navigate('/app/perfil/resenas')}
              >
                Ver todas
              </Button>
            </div>
            {resenasRecientes.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-line p-5 text-center text-[14px] text-ink-500">
                Aún no tienes reseñas publicadas.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                {resenasRecientes.map((resena) => (
                  <article key={resena.id} className="min-w-0 rounded-xl border border-line bg-surface p-4">
                    <CompanyIdentity nombre={resena.autorEmpresa} size="sm" />
                    <span role="img" className="mt-3 flex" aria-label={`${resena.calificacion} de 5 estrellas`}>
                      {Array.from({ length: 5 }, (_, indice) => (
                        <Star
                          key={indice}
                          aria-hidden="true"
                          className={`h-4 w-4 ${indice < resena.calificacion ? 'fill-amber-deep text-amber-deep' : 'text-line'}`}
                        />
                      ))}
                    </span>
                    <p className="mt-3 break-words text-[14px] leading-relaxed text-ink-700">{resena.comentario}</p>
                    <p className="mt-3 text-[12px] text-ink-500">{formatFecha(resena.fecha)}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-5 lg:col-span-4" aria-labelledby="perfil-profesional">
          <section className="surface-card p-5" aria-labelledby="perfil-horario">
            <h2 id="perfil-horario" className="text-[20px] font-semibold text-ink-900">Horario de atención</h2>
            <dl className="mt-4 flex flex-col divide-y divide-line-soft">
              {disponibilidad.map((dia) => (
                <div key={dia.diaSemana} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] gap-3 py-3 first:pt-0 last:pb-0">
                  <dt className="text-[14px] font-semibold text-ink-700">{dia.label}</dt>
                  <dd className="m-0 min-w-0 text-right text-[14px] text-ink-900">
                    {dia.bloques.length === 0
                      ? 'No disponible'
                      : dia.bloques.map((bloque, indice) => (
                          <span key={indice} className="block break-words">
                            {bloque.horaInicio}–{bloque.horaFin}
                            <span className="block text-[12px] text-ink-500">{formatModalidadEtiqueta(bloque.modalidad)}</span>
                          </span>
                        ))}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-t border-line-soft pt-4 text-[12px] text-ink-500">
              Zona horaria: <span className="font-semibold text-ink-700">{colaboradorPerfil.zonaHoraria}</span>
            </p>
          </section>

          <section className="surface-card p-5" aria-labelledby="perfil-profesional">
            <div className="flex items-center gap-3">
              <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
                <FileText className="h-5 w-5" />
              </span>
              <h2 id="perfil-profesional" className="text-[20px] font-semibold leading-tight text-ink-900">
                Información profesional
              </h2>
            </div>
            <div className="mt-5">
              <CamposDl campos={camposProfesionales} />
            </div>
          </section>

        </aside>
      </div>
    </section>
  )
}
