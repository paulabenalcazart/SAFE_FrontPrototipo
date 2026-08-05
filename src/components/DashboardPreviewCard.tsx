import { CalendarClock, Gauge, ShieldCheck, TrendingUp } from 'lucide-react'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'

const kpis = [
  {
    icon: TrendingUp,
    label: 'Ingresos del mes',
    target: 42180,
    format: 'currency' as const,
    trend: '+12% vs mes anterior',
    accent: 'positive' as const,
  },
  {
    icon: CalendarClock,
    label: 'Obligaciones pendientes',
    target: 2,
    format: 'integer' as const,
    trend: '1 vence en 3 días',
    accent: 'warning' as const,
  },
  {
    icon: Gauge,
    label: 'Salud financiera',
    target: 87,
    format: 'score' as const,
    trend: 'Saludable',
    accent: 'positive' as const,
  },
  {
    icon: ShieldCheck,
    label: 'Cumplimiento SRI',
    target: 96,
    format: 'percent' as const,
    trend: 'Al día',
    accent: 'positive' as const,
  },
]

const chartBars = [42, 55, 38, 64, 72, 88]

const obligaciones = [
  { nombre: 'IVA · octubre 2026', estado: 'Pendiente', tono: 'warning' as const },
  { nombre: 'Retenciones · octubre 2026', estado: 'Al día', tono: 'positive' as const },
]

function formatKpiValue(format: (typeof kpis)[number]['format'], value: number) {
  if (format === 'currency') {
    return `$${Math.round(value).toLocaleString('es-EC')}`
  }
  if (format === 'percent') {
    return `${Math.round(value)}%`
  }
  if (format === 'score') {
    return `${Math.round(value)}/100`
  }
  return `${Math.round(value)}`
}

function KpiTile({ kpi, inView, delay }: { kpi: (typeof kpis)[number]; inView: boolean; delay: number }) {
  const value = useCountUp(kpi.target, inView, delay)
  const Icon = kpi.icon

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <span
        className={cn(
          'grid h-9 w-9 place-items-center rounded-lg',
          kpi.accent === 'positive' ? 'bg-emerald-soft text-emerald-deep' : 'bg-amber-soft text-amber-deep',
        )}
      >
        <Icon className="h-4 w-4" />
      </span>
      <p className="num mt-3 text-xl font-bold text-ink-900">{formatKpiValue(kpi.format, value)}</p>
      <p className="mt-0.5 text-xs text-ink-500">{kpi.label}</p>
      <p
        className={cn(
          'mt-1 text-xs font-medium',
          kpi.accent === 'positive' ? 'text-emerald-deep' : 'text-amber-deep',
        )}
      >
        {kpi.trend}
      </p>
    </div>
  )
}

export function DashboardPreviewCard({ inView, className }: { inView: boolean; className?: string }) {
  const capital = useCountUp(186420, inView, 1100)

  return (
    <div className={cn('surface-card overflow-hidden text-left', className)}>
      <div className="flex items-center gap-2 border-b border-line bg-surface px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#f4645c]/70" />
        <span className="h-3 w-3 rounded-full bg-[#fdbc40]/70" />
        <span className="h-3 w-3 rounded-full bg-[#34c749]/70" />
        <span className="flex-1 text-center text-xs font-medium text-ink-500">
          Panel de empresa — SAFE
        </span>
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-100 text-sm font-semibold text-navy-700">
              M
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-900">Hola, María</p>
              <p className="text-xs text-ink-500">Comercial Andina S.A. · hoy, 4 de agosto de 2026</p>
            </div>
          </div>
          <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
            Este mes
          </span>
        </div>

        <div className="mt-8 border-t border-line pt-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
            Capital bajo control
          </p>
          <div className="mt-2 flex flex-wrap items-baseline gap-3">
            <span className="num font-display text-4xl font-bold text-ink-900 sm:text-5xl">
              ${Math.round(capital).toLocaleString('es-EC')}
            </span>
            <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-semibold text-emerald-deep">
              +8.4%
            </span>
            <span className="text-xs text-ink-500">vs. mes anterior</span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiTile key={kpi.label} kpi={kpi} inView={inView} delay={900 + i * 120} />
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-line bg-surface p-4">
          <p className="text-xs font-medium text-ink-500">Ingresos — últimos 6 meses</p>
          <div className="mt-4 flex h-28 items-end gap-2">
            {chartBars.map((h, i) => (
              <span
                key={i}
                className="flex-1 rounded-t bg-navy-500/80 transition-[height] duration-700 ease-out"
                style={{
                  height: inView ? `${h}%` : '0%',
                  transitionDelay: `${300 + i * 70}ms`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {obligaciones.map((o) => (
            <div
              key={o.nombre}
              className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3"
            >
              <span className="text-sm font-medium text-ink-900">{o.nombre}</span>
              <span
                className={cn(
                  'rounded-full px-2.5 py-1 text-xs font-semibold',
                  o.tono === 'positive'
                    ? 'bg-emerald-soft text-emerald-deep'
                    : 'bg-amber-soft text-amber-deep',
                )}
              >
                {o.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
