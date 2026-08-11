import { CalendarCheck, CheckCircle2, Inbox, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { formatFecha } from '@/portal/obligaciones/formato'
import { HOY_COLABORADOR_ISO, empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import {
  agruparDisponibilidadPorDia,
  calcularCalificacionPromedio,
  calcularRendimientoMensual,
  contarCitasEsteMes,
  contarServiciosCompletados,
  contarSolicitudesPendientes,
  obtenerSolicitudMasReciente,
} from '@/portal/colaborador/calculo'
import { RESENAS_COLABORADORES } from '@/portal/marketplace/catalogo'
import { RendimientoMensualPanel } from './RendimientoMensualPanel'

export function CollaboratorDashboardScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    colaboradorPerfil,
    solicitudesColaborador,
    citasColaborador,
    horariosColaborador,
    serviciosColaborador,
  } = usePortalData()

  const resenas = RESENAS_COLABORADORES.filter((r) => r.colaboradorId === colaboradorPerfil.id)
  const { promedio, cantidad } = calcularCalificacionPromedio(resenas)
  const disponibilidad = agruparDisponibilidadPorDia(horariosColaborador)
  const solicitudReciente = obtenerSolicitudMasReciente(solicitudesColaborador)
  const rendimiento = calcularRendimientoMensual({
    citas: citasColaborador,
    solicitudes: solicitudesColaborador,
    hoyIso: HOY_COLABORADOR_ISO,
  })

  const kpis = [
    {
      id: 'pendientes',
      titulo: 'Solicitudes pendientes',
      valor: String(contarSolicitudesPendientes(solicitudesColaborador)),
      sub: 'esperando tu respuesta',
      icon: Inbox,
    },
    {
      id: 'citas-mes',
      titulo: 'Citas este mes',
      valor: String(contarCitasEsteMes(citasColaborador, HOY_COLABORADOR_ISO)),
      sub: 'confirmadas o programadas',
      icon: CalendarCheck,
    },
    {
      id: 'completados',
      titulo: 'Servicios completados',
      valor: String(contarServiciosCompletados(citasColaborador)),
      sub: 'histórico',
      icon: CheckCircle2,
    },
    {
      id: 'calificacion',
      titulo: 'Calificación promedio',
      valor: promedio === null ? 'Sin reseñas' : `${promedio.toFixed(1)} / 5`,
      sub: promedio === null ? '' : `${cantidad} reseñas`,
      icon: Star,
    },
  ]

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">
          Hola, {user?.nombres.split(' ')[0]}
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el resumen de tu actividad profesional en SAFE hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-7">
          <h2 className="text-[16px] font-semibold text-ink-900">Disponibilidad</h2>
          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-3">Día</th>
                  <th className="py-2 pr-3">Horario</th>
                  <th className="py-2 pr-3">Modalidad</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {disponibilidad.map((dia) => (
                  <tr key={dia.diaSemana} className="border-b border-line-soft/70 last:border-b-0">
                    <td className="py-2.5 pr-3 font-semibold text-ink-900">{dia.label}</td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {dia.bloques.length === 0
                        ? '—'
                        : dia.bloques.map((b) => `${b.horaInicio} - ${b.horaFin}`).join(', ')}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {dia.bloques.length === 0
                        ? '—'
                        : Array.from(new Set(dia.bloques.map((b) => b.modalidad))).join(' / ')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          dia.bloques.length > 0 ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                        }`}
                      >
                        {dia.bloques.length > 0 ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/perfil?seccion=disponibilidad')}
            className="mt-3.5 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            Administrar disponibilidad
          </button>
        </section>

        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-5">
          <h2 className="text-[16px] font-semibold text-ink-900">Solicitudes nuevas</h2>
          {solicitudReciente === null ? (
            <p className="mt-3.5 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
              No tienes solicitudes nuevas. Las nuevas solicitudes aparecerán aquí.
            </p>
          ) : (
            (() => {
              const empresa = empresaSolicitantePorId(solicitudReciente.empresaId)
              const servicio = serviciosColaborador.find((s) => s.id === solicitudReciente.servicioId)
              return (
                <div className="mt-3.5 rounded-xl border border-line/70 bg-surface p-3.5">
                  <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa'} iniciales={empresa?.iniciales} />
                  <dl className="mt-3 flex flex-col gap-1.5 text-[13px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Servicio solicitado</dt>
                      <dd className="text-ink-900">{servicio?.nombre ?? 'Servicio por definir'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Fecha solicitada</dt>
                      <dd className="text-ink-900">
                        {formatFecha(solicitudReciente.fechaPreferida)} · {solicitudReciente.horaPreferida}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Enviada el</dt>
                      <dd className="text-ink-900">{formatFecha(solicitudReciente.createdAt.slice(0, 10))}</dd>
                    </div>
                  </dl>
                </div>
              )
            })()
          )}
          <button
            type="button"
            onClick={() => navigate('/app/solicitudes')}
            className="mt-3.5 min-h-11 w-full rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            Revisar solicitudes
          </button>
        </section>
      </div>

      <RendimientoMensualPanel metricas={rendimiento} />
    </section>
  )
}
