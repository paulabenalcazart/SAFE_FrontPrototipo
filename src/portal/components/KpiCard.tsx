import type { Kpi } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 text-ink-500">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
          <kpi.icon className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="text-[12.5px] font-semibold leading-tight text-ink-700">{kpi.titulo}</span>
      </div>
      <span className="num mt-auto font-display text-2xl font-bold text-ink-900">{kpi.valor}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink-500">{kpi.sub}</span>
        {kpi.badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[kpi.badge.tono]}`}>
            {kpi.badge.texto}
          </span>
        )}
      </div>
    </div>
  )
}
