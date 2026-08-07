import type { RegistroFinanciero } from '@/portal/types'
import { utilidadNeta, gastosTotales } from './calculo'
import { formatPeriodo } from './formato'

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], max: number) {
  if (values.length < 2) return ''
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - (value / max) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function EvolucionFinancieraChart({ registros }: { registros: RegistroFinanciero[] }) {
  const ordenados = [...registros]
    .filter((r) => r.estado !== 'BORRADOR')
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[17px] font-semibold">Evolución financiera</h2>
      <p className="mt-1 text-[12.5px] text-ink-500">Últimos {ordenados.length || 0} periodos vigentes</p>

      {ordenados.length < 2 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[32ch] text-center text-[13px] text-ink-500">
            Sin periodos vigentes para graficar
          </p>
        </div>
      ) : (
        <>
          {(() => {
            const ingresos = ordenados.map((r) => r.ingresosOperacionales)
            const gastos = ordenados.map((r) => gastosTotales(r))
            const utilidad = ordenados.map((r) => utilidadNeta(r))
            const max = Math.max(...ingresos, ...gastos, ...utilidad) * 1.15
            const yTicks = [max, max / 2, 0].map((v) => `$${Math.round(v / 1000)}k`)

            return (
              <>
                <div className="mt-4 flex gap-2.5">
                  <div
                    className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
                    style={{ height: CHART_HEIGHT }}
                  >
                    {yTicks.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div
                    className="relative min-w-0 flex-1 border-b border-l border-line/70"
                    style={{ height: CHART_HEIGHT }}
                  >
                    <svg
                      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full"
                      aria-label="Ingresos, gastos y utilidad neta por periodo"
                    >
                      <polyline points={buildPoints(ingresos, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(gastos, max)} fill="none" stroke="var(--color-amber-brand)" strokeWidth={6} strokeDasharray="14 10" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(utilidad, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
                <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
                  {ordenados.map((r) => (
                    <span key={r.id}>{formatPeriodo(r.periodo).slice(0, 3)}</span>
                  ))}
                </div>
              </>
            )
          })()}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3">
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
              Ingresos
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-amber-brand" aria-hidden="true" />
              Gastos totales
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
              Utilidad neta
            </span>
          </div>
        </>
      )}
    </section>
  )
}
