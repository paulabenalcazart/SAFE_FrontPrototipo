import type { RegistroFinanciero } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { Card } from '@/portal/components/Card'

const CHART_HEIGHT = 200
const CHART_WIDTH = 560

function buildPoints(values: number[], max: number) {
  if (values.length < 2) return ''
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => `${(index * step).toFixed(1)},${(CHART_HEIGHT - (value / max) * CHART_HEIGHT).toFixed(1)}`)
    .join(' ')
}

export function RentabilidadHistoricaChart({ registros }: { registros: RegistroFinanciero[] }) {
  const ordenados = [...registros]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)

  return (
    <Card as="section" padding="lg">
      <h2 className="text-[16px] font-semibold">Rentabilidad histórica</h2>
      <p className="mt-1 text-[12px] text-ink-500">Margen neto (REN_04) y ROE (REN_08) · 12 periodos</p>

      {ordenados.length < 2 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[30ch] text-center text-[13px] text-ink-500">Sin periodos para graficar</p>
        </div>
      ) : (
        <>
          {(() => {
            const margen = ordenados.map((r) => calcularIndicadores(r).find((i) => i.codigo === 'REN_04')!.valor)
            const roe = ordenados.map((r) => calcularIndicadores(r).find((i) => i.codigo === 'REN_08')!.valor)
            const max = Math.max(...margen, ...roe) * 1.15
            const yTicks = [max, max / 2, 0].map((v) => `${Math.round(v * 100)}%`)

            return (
              <>
                <div className="mt-3.5 flex gap-2.5">
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
                      aria-label="Margen neto y ROE por periodo"
                    >
                      <polyline points={buildPoints(margen, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(roe, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
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
              Margen neto
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
              ROE
            </span>
          </div>
        </>
      )}
    </Card>
  )
}
