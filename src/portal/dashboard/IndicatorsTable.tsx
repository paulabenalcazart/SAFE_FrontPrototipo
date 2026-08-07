import { TrendingDown, TrendingUp } from 'lucide-react'
import type { Indicador } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function IndicatorsTable({ indicadores }: { indicadores: Indicador[] }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-4.5 py-3.5">
        <h2 className="text-[17px] font-semibold">Indicadores clave</h2>
        <span className="text-[12.5px] font-semibold text-navy-500">Ver todos</span>
      </div>
      <table className="w-full min-w-[430px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-ink-500">
            <th scope="col" className="px-4.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Indicador
            </th>
            <th scope="col" className="px-2 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Valor
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Unidad
            </th>
            <th scope="col" className="px-2 py-2.5 text-center text-[11.5px] font-semibold uppercase tracking-wide">
              Tend.
            </th>
            <th scope="col" className="px-4.5 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {indicadores.map((ind) => (
            <tr key={ind.id} className="border-t border-line/70">
              <td className="px-4.5 py-2.5 font-medium">{ind.nombre}</td>
              <td className="num px-2 py-2.5 text-right font-semibold">{ind.valor}</td>
              <td className="px-2 py-2.5 text-[12.5px] text-ink-500">{ind.unidad}</td>
              <td className="px-2 py-2.5 text-center">
                {ind.tendencia === 'up' ? (
                  <TrendingUp className="inline h-[15px] w-[15px] text-emerald-deep" aria-label="Tendencia al alza" />
                ) : (
                  <TrendingDown className="inline h-[15px] w-[15px] text-destructive" aria-label="Tendencia a la baja" />
                )}
              </td>
              <td className="px-4.5 py-2.5 text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ind.tono]}`}
                >
                  {ind.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
