import { useNavigate } from 'react-router-dom'
import type { Obligacion } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'
import { Badge } from '@/portal/components/Badge'

export function ObligationsTable({ obligaciones }: { obligaciones: Obligacion[] }) {
  const navigate = useNavigate()
  return (
    <section className="overflow-x-auto rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-4.5 py-3.5">
        <h2 className="text-[17px] font-semibold">Obligaciones próximas</h2>
        <button
          type="button"
          onClick={() => navigate('/app/obligaciones')}
          className="text-[12.5px] font-semibold text-navy-500"
        >
          Ver todas
        </button>
      </div>
      <table className="w-full min-w-[470px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-ink-500">
            <th scope="col" className="px-4.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Obligación
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Periodo
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Vence
            </th>
            <th scope="col" className="px-2 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Monto est.
            </th>
            <th scope="col" className="px-4.5 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {obligaciones.map((o) => (
            <tr key={o.id} className="border-t border-line/70">
              <td className="px-4.5 py-2.5 font-medium leading-snug">{o.nombre}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-ink-700">{o.periodo}</td>
              <td className="num whitespace-nowrap px-2 py-2.5">{o.vence}</td>
              <td className="num px-2 py-2.5 text-right">{o.monto}</td>
              <td className="px-4.5 py-2.5 text-right">
                <Badge className={TONE_BADGE_CLASSES[o.tono]}>
                  {o.estado}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
