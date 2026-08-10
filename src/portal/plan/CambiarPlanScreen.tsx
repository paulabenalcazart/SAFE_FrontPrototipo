import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import type { PlanCodigo } from '@/portal/types'
import { COMPARATIVA_PLANES, PLANES } from './catalogo'
import { CambiarPlanModal } from './CambiarPlanModal'

const COLUMNAS: { key: 'esencial' | 'crecimiento' | 'corporativo'; nombre: string }[] = [
  { key: 'esencial', nombre: 'Esencial' },
  { key: 'crecimiento', nombre: 'Crecimiento' },
  { key: 'corporativo', nombre: 'Corporativo' },
]

export function CambiarPlanScreen() {
  const navigate = useNavigate()
  const { planActivoCodigo } = usePortalData()
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanCodigo | null>(null)

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Cambiar plan</h1>
        <p className="mt-1 text-sm text-ink-700">El cambio se aplica en el siguiente ciclo de facturación.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = plan.codigo === planActivoCodigo
          return (
            <div
              key={plan.codigo}
              className={`flex flex-col gap-2.5 rounded-xl border bg-card p-4.5 ${
                esActual ? 'border-navy-600' : plan.destacado ? 'border-navy-500' : 'border-line'
              }`}
            >
              {(esActual || plan.destacado) && (
                <span className="w-fit rounded-full bg-navy-100 px-2.5 py-0.5 text-[11px] font-bold text-navy-700">
                  {esActual ? 'Plan actual' : 'Más contratado'}
                </span>
              )}
              <h2 className="text-lg font-bold text-ink-900">{plan.nombre}</h2>
              <p className="font-display text-3xl font-bold text-ink-900">
                {formatUSD(plan.precio)}
                <span className="text-[13px] font-medium text-ink-500"> /mes</span>
              </p>
              <p className="text-[12.5px] text-ink-700">{plan.empresas}</p>
              <p className="text-[12.5px] text-ink-700">{plan.simulaciones}</p>
              <p className="text-[12.5px] text-ink-700">{plan.soporte}</p>
              <ul className="mt-1.5 space-y-1.5">
                {plan.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-brand" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-auto"
                disabled={esActual}
                onClick={() => setPlanSeleccionado(plan.codigo)}
              >
                {esActual ? 'Plan actual' : `Seleccionar ${plan.nombre}`}
              </Button>
            </div>
          )
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <h2 className="border-b border-line-soft px-4.5 py-4 text-base font-semibold text-ink-900">
          Comparativa de módulos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase">
                  Módulo
                </th>
                {COLUMNAS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase"
                  >
                    {col.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARATIVA_PLANES.map((fila) => (
                <tr key={fila.modulo} className="border-t border-line-soft">
                  <td className="px-4.5 py-2.5 text-ink-900">{fila.modulo}</td>
                  {COLUMNAS.map((col) => (
                    <td key={col.key} className="px-2 py-2.5 text-center">
                      {fila[col.key] ? (
                        <Check className="mx-auto h-4 w-4 text-navy-600" aria-label="Incluido" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-ink-500/40" aria-label="No incluido" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {planSeleccionado && (
        <CambiarPlanModal codigo={planSeleccionado} abierto onCerrar={() => setPlanSeleccionado(null)} />
      )}
    </div>
  )
}
