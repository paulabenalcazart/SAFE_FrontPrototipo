import { CalendarCheck2, CalendarClock, Inbox, TrendingUp } from 'lucide-react'
import type { Cita, SolicitudContacto } from '@/portal/types'
import {
  calcularTasaAceptacion,
  contarCitasConfirmadasEsteMes,
  contarCitasConfirmadasTotales,
  contarSolicitudesPendientes,
} from '@/portal/colaborador/calculo'
import { HOY_COLABORADOR_ISO } from '@/portal/colaborador/semilla'

export function SolicitudesKpis({ solicitudes, citas }: { solicitudes: SolicitudContacto[]; citas: Cita[] }) {
  const { tasa, respondidas } = calcularTasaAceptacion(solicitudes)

  const kpis = [
    {
      id: 'pendientes',
      titulo: 'Solicitudes pendientes',
      valor: String(contarSolicitudesPendientes(solicitudes)),
      sub: 'esperando tu respuesta',
      icon: Inbox,
    },
    {
      id: 'confirmadas-totales',
      titulo: 'Citas confirmadas totales',
      valor: String(contarCitasConfirmadasTotales(citas)),
      sub: 'próximas, sin completar',
      icon: CalendarCheck2,
    },
    {
      id: 'confirmadas-mes',
      titulo: 'Citas confirmadas este mes',
      valor: String(contarCitasConfirmadasEsteMes(citas, HOY_COLABORADOR_ISO)),
      sub: 'en el mes en curso',
      icon: CalendarClock,
    },
    {
      id: 'tasa-aceptacion',
      titulo: 'Tasa de aceptación',
      valor: tasa === null ? '—' : `${tasa}%`,
      sub: tasa === null ? 'Sin solicitudes respondidas' : `${respondidas} solicitudes respondidas`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {kpis.map((kpi) => (
        <article
          key={kpi.id}
          className="flex min-w-0 flex-col rounded-xl border border-line bg-card p-3 shadow-[var(--shadow-card)] sm:p-4"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
              <kpi.icon aria-hidden="true" className="h-[18px] w-[18px]" strokeWidth={1.7} />
            </span>
            <span className="min-w-0 break-words text-[12px] font-semibold leading-snug text-ink-700">
              {kpi.titulo}
            </span>
          </div>
          <strong className="num mt-3 font-display text-[24px] font-bold leading-none text-ink-900">
            {kpi.valor}
          </strong>
          <span className="mt-2 break-words text-[12px] leading-snug text-ink-500">{kpi.sub}</span>
        </article>
      ))}
    </div>
  )
}
