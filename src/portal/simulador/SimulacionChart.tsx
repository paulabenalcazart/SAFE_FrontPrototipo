import type { SerieMensualSimulacion } from '@/portal/types'

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], min: number, max: number) {
  if (values.length < 2) return ''
  const rango = max - min || 1
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - ((value - min) / rango) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function SimulacionChart({ serie }: { serie: SerieMensualSimulacion[] }) {
  if (serie.length < 2) {
    return (
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[17px] font-semibold">Situación actual vs simulada</h2>
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[32ch] text-center text-[13px] text-ink-500">
            Simula al menos 2 meses para ver la comparación en el tiempo.
          </p>
        </div>
      </section>
    )
  }

  const costo = serie.map((s) => s.costoAcumulado)
  const ingreso = serie.map((s) => s.ingresoAcumulado)
  const utilidadActual = serie.map((s) => s.utilidadActual)
  const utilidadProyectada = serie.map((s) => s.utilidadProyectada)
  const todos = [...costo, ...ingreso, ...utilidadActual, ...utilidadProyectada, 0]
  const max = Math.max(...todos) * 1.15 || 1
  const min = Math.min(...todos) * 1.15
  const yTicks = [max, (max + min) / 2, min].map((v) => `$${Math.round(v / 1000)}k`)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[17px] font-semibold">Situación actual vs simulada</h2>

      <div className="mt-3.5 flex gap-2.5">
        <div
          className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 border-b border-l border-line/70" style={{ height: CHART_HEIGHT }}>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-label="Costo acumulado, ingreso adicional acumulado, utilidad actual y utilidad proyectada por mes"
          >
            <polyline points={buildPoints(costo, min, max)} fill="none" stroke="var(--color-destructive)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(ingreso, min, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(utilidadActual, min, max)} fill="none" stroke="var(--color-ink-500)" strokeWidth={4} strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(utilidadProyectada, min, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={5} strokeDasharray="16 8" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
        {serie.map((s) => (
          <span key={s.mes}>{s.mes.replace('Mes ', 'M')}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3 text-[12.5px] text-ink-700">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-destructive" aria-hidden="true" />
          Costo acumulado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
          Ingreso adicional acumulado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-ink-500" aria-hidden="true" />
          Utilidad actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
          Utilidad proyectada
        </span>
      </div>
    </section>
  )
}
