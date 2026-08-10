import { useAuth } from '@/auth/AuthContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { chartSeries, indicadores, kpis, obligaciones } from '@/portal/data/mock-portal-data'
import { usePortalData } from '@/portal/PortalDataContext'
import { FinancialChart } from './FinancialChart'
import { IndicatorsTable } from './IndicatorsTable'
import { ObligationsTable } from './ObligationsTable'

export function DashboardScreen() {
  const { user } = useAuth()
  const { empresaActiva } = usePortalData()
  const firstName = user?.nombres.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de {empresaActiva.nombre} hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <FinancialChart data={chartSeries} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <IndicatorsTable indicadores={indicadores} />
        <ObligationsTable obligaciones={obligaciones} />
      </div>
    </section>
  )
}
