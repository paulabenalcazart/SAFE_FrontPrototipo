import { useState } from 'react'
import { Card } from '@/portal/components/Card'
import type { MetricaRendimiento } from '@/portal/colaborador/calculo'

export function RendimientoMensualPanel({ metricas }: { metricas: MetricaRendimiento[] }) {
  const [activa, setActiva] = useState(metricas[0].clave)
  const metrica = metricas.find((m) => m.clave === activa) ?? metricas[0]
  const valores = metrica.serie.map((p) => p.valor)
  const maximo = Math.max(1, ...valores)

  return (
    <Card as="section" padding="lg">
      <h2 className="text-[16px] font-semibold text-ink-900">Rendimiento del mes</h2>
      <div className="mt-3.5 flex flex-wrap gap-2" role="tablist" aria-label="Métrica de rendimiento">
        {metricas.map((m) => (
          <button
            key={m.clave}
            type="button"
            role="tab"
            aria-selected={m.clave === activa}
            onClick={() => setActiva(m.clave)}
            className={`min-h-[38px] rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${
              m.clave === activa
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-line bg-card text-ink-700 hover:bg-surface'
            }`}
          >
            {m.titulo}
          </button>
        ))}
      </div>

      <div className="mt-4" role="img" aria-label={`Serie semanal de ${metrica.titulo.toLowerCase()}: ${metrica.serie.map((p) => `semana ${p.semana}, ${p.valor}${metrica.unidad}`).join('; ')}`}>
        {metrica.serie.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Sin datos de {metrica.titulo.toLowerCase()} este mes todavía.
          </p>
        ) : (
          <svg viewBox="0 0 300 120" className="h-32 w-full" aria-hidden="true">
            <polyline
              fill="none"
              stroke="var(--color-navy-600, #1d4ed8)"
              strokeWidth="2.5"
              points={metrica.serie
                .map((p, i) => {
                  const x = metrica.serie.length === 1 ? 150 : (i / (metrica.serie.length - 1)) * 280 + 10
                  const y = 110 - (p.valor / maximo) * 100
                  return `${x},${y}`
                })
                .join(' ')}
            />
            {metrica.serie.map((p, i) => {
              const x = metrica.serie.length === 1 ? 150 : (i / (metrica.serie.length - 1)) * 280 + 10
              const y = 110 - (p.valor / maximo) * 100
              return <circle key={p.semana} cx={x} cy={y} r={3.5} fill="var(--color-navy-600, #1d4ed8)" />
            })}
          </svg>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <caption className="sr-only">Comparación de métricas de rendimiento con el mes anterior</caption>
          <thead>
            <tr className="border-b border-line-soft text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="py-2 pr-3">Métrica</th>
              <th className="py-2 pr-3">Este mes</th>
              <th className="py-2 pr-3">Mes anterior</th>
              <th className="py-2">Variación</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((m) => (
              <tr key={m.clave} className="border-b border-line-soft/70 last:border-b-0">
                <td className="py-2.5 pr-3 font-semibold text-ink-900">{m.titulo}</td>
                <td className="py-2.5 pr-3 text-ink-700">{m.totalEsteMes}{m.unidad}</td>
                <td className="py-2.5 pr-3 text-ink-700">{m.totalMesAnterior}{m.unidad}</td>
                <td className="py-2.5 text-ink-700">
                  {m.variacion === null ? (
                    '—'
                  ) : (
                    <span className={m.variacion === 0 ? '' : (m.variacion > 0) !== m.menorEsMejor ? 'text-emerald-deep' : 'text-destructive'}>
                      {m.variacion > 0 ? '+' : ''}
                      {m.variacion}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
