import { useAuth } from '@/auth/AuthContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { kpis } from '@/portal/data/mock-portal-data'

export function DashboardScreen() {
  const { user } = useAuth()
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de Textiles Andina S.A. hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  )
}
