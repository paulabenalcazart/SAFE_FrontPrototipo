import { useState } from 'react'
import type { ChartSeriesPoint } from '@/portal/types'
import { Card } from '@/portal/components/Card'

type ChartView = 'tendencia' | 'mensual' | 'comparativo'

const VIEWS: { id: ChartView; label: string }[] = [
  { id: 'tendencia', label: 'Tendencia' },
  { id: 'mensual', label: 'Por mes' },
  { id: 'comparativo', label: 'Ingresos vs. gastos vs. utilidad' },
]

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], max: number) {
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - (value / max) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function FinancialChart({ data }: { data: ChartSeriesPoint[] }) {
  const [view, setView] = useState<ChartView>('tendencia')
  const max = Math.max(...data.map((d) => Math.max(d.ingresos, d.gastos, d.utilidad))) * 1.15
  const yTicks = [max, max / 2, 0].map((value) => `$${Math.round(value)}k`)

  return (
    <Card as="section" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px] font-semibold">Resumen financiero</h2>
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={`min-h-9 rounded-full border px-3.5 text-[12.5px] font-semibold ${
                view === v.id ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-card text-ink-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <div
          className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div
          className="relative min-w-0 flex-1 border-b border-l border-line/70"
          style={{ height: CHART_HEIGHT }}
        >
          {view === 'tendencia' && (
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-label="Ingresos y gastos mensuales"
            >
              <polyline
                points={buildPoints(data.map((d) => d.ingresos), max)}
                fill="none"
                stroke="var(--color-navy-500)"
                strokeWidth={6}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={buildPoints(data.map((d) => d.gastos), max)}
                fill="none"
                stroke="var(--color-emerald-brand)"
                strokeWidth={6}
                strokeDasharray="14 10"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {view === 'mensual' && (
            <div className="absolute inset-0 flex items-end gap-1.5 px-0.5 py-1">
              {data.map((d) => (
                <span
                  key={d.label}
                  title={`${d.label}: $${d.ingresos}k`}
                  className="flex-1 rounded-t bg-navy-500"
                  style={{ height: `${(d.ingresos / max) * 100}%` }}
                />
              ))}
            </div>
          )}

          {view === 'comparativo' && (
            <div className="absolute inset-0 flex items-end gap-2 px-0.5 py-1">
              {data.map((d) => (
                <span key={d.label} className="flex h-full flex-1 items-end gap-0.5">
                  <span className="flex-1 rounded-t bg-navy-500" style={{ height: `${(d.ingresos / max) * 100}%` }} />
                  <span className="flex-1 rounded-t bg-emerald-brand" style={{ height: `${(d.gastos / max) * 100}%` }} />
                  <span className="flex-1 rounded-t bg-amber-brand" style={{ height: `${(d.utilidad / max) * 100}%` }} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3">
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
          <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
          <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
          Gastos
        </span>
      </div>
    </Card>
  )
}
