import type { ReactNode } from 'react'
import { Star } from 'lucide-react'
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
    <dl className="mt-3 grid grid-cols-1 gap-x-5.5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {campos.map((campo) => (
        <div key={campo.label} className="min-w-0">
          <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{campo.label}</dt>
          <dd className="mt-1 break-words text-[13.5px] text-ink-900">{campo.valor}</dd>
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

  // --- 12.3 Información profesional ---
  const otrasEspecialidades = colaboradorPerfil.especialidades
    .filter((relacion) => !relacion.esPrincipal)
    .map((relacion) => especialidadProfesionalPorId(relacion.especialidadId)?.nombre)
    .filter((nombre): nombre is string => Boolean(nombre))
    .join(', ')

  const nombreArchivoCv = colaboradorPerfil.cvUrl ? colaboradorPerfil.cvUrl.split('/').pop() : null

  const camposPersonales: Campo[] = [
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
    {
      label: 'Hoja de vida',
      valor: colaboradorPerfil.cvUrl ? (
        <>
          {nombreArchivoCv}{' '}
          <a
            href={colaboradorPerfil.cvUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-navy-600 hover:underline"
          >
            Ver
          </a>
        </>
      ) : (
        'No cargada'
      ),
    },
    { label: 'Hoja de vida visible públicamente', valor: colaboradorPerfil.cvVisible ? 'Sí' : 'No' },
    { label: 'Años de experiencia', valor: `${colaboradorPerfil.aniosExperiencia} años` },
    { label: 'Modalidad de atención', valor: formatModalidadEtiqueta(colaboradorPerfil.modalidadAtencion) },
    { label: 'País de atención', valor: colaboradorPerfil.paisAtencion },
    { label: 'Ciudad de atención', valor: colaboradorPerfil.ciudadAtencion },
    { label: 'Zona horaria', valor: colaboradorPerfil.zonaHoraria },
    { label: 'Tarifa referencial', valor: formatTarifaHora(colaboradorPerfil.tarifaReferencial) },
    ...(colaboradorPerfil.numeroLicencia
      ? [{ label: 'Número de licencia', valor: colaboradorPerfil.numeroLicencia }]
      : []),
    ...(colaboradorPerfil.entidadEmisora
      ? [{ label: 'Entidad emisora', valor: colaboradorPerfil.entidadEmisora }]
      : []),
    {
      label: 'Credencial profesional',
      valor: colaboradorPerfil.archivoCredencialUrl ? (
        <>
          Cargada{' '}
          <a
            href={colaboradorPerfil.archivoCredencialUrl}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-navy-600 hover:underline"
          >
            Ver
          </a>
        </>
      ) : (
        'No cargada'
      ),
    },
    { label: 'Visibilidad en marketplace', valor: colaboradorPerfil.visibleMarketplace ? 'Sí' : 'No' },
    { label: 'Estado de disponibilidad', valor: formatEstadoDisponibilidad(colaboradorPerfil.estadoDisponibilidad) },
  ]

  // --- 12.5 Servicios ofrecidos ---
  const serviciosActivos = serviciosColaborador.filter((servicio) => servicio.activo)

  // --- 12.6 Horarios de atención ---
  const disponibilidad = agruparDisponibilidadPorDia(horariosColaborador)

  // --- 12.7 Reseñas (3 más recientes) ---
  const resenasRecientes = resenas
    .filter((r) => r.estado === 'PUBLICADA')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 3)

  return (
    <section className="flex flex-col gap-4.5">
      {/* 12.1 Cabecera */}
      <header className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 md:flex-row md:items-center">
        <span
          aria-hidden="true"
          className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-100 font-display text-[24px] font-bold text-navy-700"
        >
          {colaboradorPerfil.fotoPerfilUrl ? (
            <img src={colaboradorPerfil.fotoPerfilUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            inicialesDeNombre(`${colaboradorPerfil.nombres} ${colaboradorPerfil.apellidos}`)
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[25px] font-bold leading-tight text-ink-900">
            {colaboradorPerfil.nombres} {colaboradorPerfil.apellidos}
          </h1>
          <p className="mt-1 text-[14px] text-ink-700">{colaboradorPerfil.profesion}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">{especialidadPrincipal?.nombre}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[13px]">
            <span
              role="img"
              aria-label={`Calificación ${promedio?.toFixed(1) ?? 'sin datos'} de 5, ${cantidad} reseñas`}
              className="flex items-center gap-1 font-semibold text-ink-900"
            >
              <Star className="h-4 w-4 fill-amber-deep text-amber-deep" aria-hidden="true" />
              {promedio === null ? 'Sin reseñas' : `${promedio.toFixed(1)} (${cantidad} reseñas)`}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${colaboradorPerfil.estadoDisponibilidad === 'DISPONIBLE' ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'}`}
            >
              {formatEstadoDisponibilidad(colaboradorPerfil.estadoDisponibilidad)}
            </span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => navigate('/app/perfil/vista-previa')}>
            Vista previa
          </Button>
          <Button onClick={() => navigate('/app/perfil/editar')}>Editar perfil</Button>
        </div>
      </header>

      {/* 12.2 Información personal */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Información personal</h2>
        <CamposDl campos={camposPersonales} />
      </section>

      {/* 12.3 Información profesional */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Información profesional</h2>
        <CamposDl campos={camposProfesionales} />
        <div className="mt-4">
          <h3 className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
            Descripción profesional
          </h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-700">
            {colaboradorPerfil.descripcionProfesional}
          </p>
        </div>
      </section>

      {/* 12.4 Especialidades */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Especialidades</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-line-soft text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                <th className="py-2 pr-3">Especialidad</th>
                <th className="py-2 pr-3">Principal</th>
                <th className="py-2 pr-3">Años de experiencia</th>
                <th className="py-2">Estado</th>
              </tr>
            </thead>
            <tbody>
              {colaboradorPerfil.especialidades.map((relacion) => {
                const especialidad = especialidadProfesionalPorId(relacion.especialidadId)
                return (
                  <tr key={relacion.especialidadId} className="border-b border-line-soft/70 last:border-b-0">
                    <td className="py-2.5 pr-3 font-semibold text-ink-900">
                      {especialidad?.nombre ?? 'Especialidad'}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {relacion.esPrincipal ? (
                        <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[11.5px] font-semibold text-navy-700">
                          Principal
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-700">{relacion.aniosExperiencia} años</td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${relacion.activo ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'}`}
                      >
                        {relacion.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* 12.5 Servicios ofrecidos */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Servicios ofrecidos</h2>
        {serviciosActivos.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Aún no tienes servicios activos. Agrégalos desde Editar perfil.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {serviciosActivos.map((servicio) => {
              const LucideIcon = ICONO_SERVICIO[iconosServicio[servicio.id] ?? 'accounting']
              return (
                <article key={servicio.id} className="rounded-xl border border-line/70 bg-surface p-3.5">
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden="true"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700"
                    >
                      <LucideIcon className="h-4 w-4" />
                    </span>
                    <h3 className="text-[13.5px] font-semibold text-ink-900">{servicio.nombre}</h3>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{servicio.descripcion}</p>
                  <p className="mt-2 text-[12px] font-semibold text-navy-600">
                    {formatDuracion(servicio.duracionEstimadaMinutos)} · {formatPrecioServicio(servicio.tarifaReferencial)}{' '}
                    · {formatModalidad(servicio.modalidad)}
                  </p>
                </article>
              )
            })}
          </div>
        )}
      </section>

      {/* 12.6 Horarios de atención */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Horarios de atención</h2>
        <dl className="mt-3 flex flex-col gap-2.5">
          {disponibilidad.map((dia) => (
            <div key={dia.diaSemana} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
              <dt className="text-[13px] text-ink-500">{dia.label}</dt>
              <dd className="m-0 flex flex-col gap-1 text-[13px] text-ink-900 sm:items-end">
                {dia.bloques.length === 0
                  ? 'No disponible'
                  : dia.bloques.map((bloque, indice) => (
                      <span key={indice} className="flex flex-wrap items-center gap-x-2">
                        <span>
                          {bloque.horaInicio} - {bloque.horaFin}
                        </span>
                        <span className="text-ink-500">{formatModalidadEtiqueta(bloque.modalidad)}</span>
                      </span>
                    ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-[12.5px] text-ink-500">Zona horaria: {colaboradorPerfil.zonaHoraria}</p>
      </section>

      {/* 12.7 Reseñas */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-[16px] font-semibold text-ink-900">Reseñas</h2>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/perfil/resenas')}>
            Ver todas las reseñas
          </Button>
        </div>
        {resenasRecientes.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Aún no tienes reseñas publicadas.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {resenasRecientes.map((resena) => (
              <article key={resena.id} className="rounded-xl border border-line/70 p-3.5">
                <CompanyIdentity nombre={resena.autorEmpresa} size="sm" />
                <span
                  role="img"
                  className="mt-2 flex"
                  aria-label={`${resena.calificacion} de 5 estrellas`}
                >
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
      </section>
    </section>
  )
}
