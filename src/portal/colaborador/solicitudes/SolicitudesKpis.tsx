import { CalendarCheck2, CalendarClock, Inbox, TrendingUp } from 'lucide-react'
import { KpiCard } from '@/portal/components/KpiCard'
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
    <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-1">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
