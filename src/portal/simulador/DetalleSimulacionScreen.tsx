import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { escenarioPorCodigo, VARIABLES_POR_ESCENARIO } from './catalogo'
import { NIVEL_RIESGO_BADGE, NIVEL_RIESGO_LABEL } from './estilo'
import { formatValorVariable } from './formato'

export function DetalleSimulacionScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, simulaciones } = usePortalData()

  const simulacion = (simulaciones[empresaActiva.id] ?? []).find((s) => s.id === id)

  if (!simulacion) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró esa simulación.</p>
        <button
          type="button"
          onClick={() => navigate('/app/simulador')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver al Simulador
        </button>
      </section>
    )
  }

  const catalogo = escenarioPorCodigo(simulacion.escenarioCodigo)
  const variables = VARIABLES_POR_ESCENARIO[simulacion.escenarioCodigo] ?? []

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/simulador')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
        >
          ← Simulador
        </button>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight">{catalogo?.nombre ?? simulacion.escenarioCodigo}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${NIVEL_RIESGO_BADGE[simulacion.resultado.nivelRiesgo]}`}>
            Riesgo {NIVEL_RIESGO_LABEL[simulacion.resultado.nivelRiesgo]}
          </span>
          <span className="text-[13px] text-ink-500">Ejecutada el {formatFecha(simulacion.fecha)} · solo lectura</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Variables ingresadas</h2>
          <dl className="mt-3 flex flex-col gap-2.5">
            {variables.map((v) => (
              <div key={v.codigo} className="flex justify-between gap-3 border-b border-line/70 pb-1.5">
                <dt className="text-[12.5px] text-ink-500">{v.label}</dt>
                <dd className="num m-0 text-[13.5px] font-semibold">
                  {formatValorVariable(v, simulacion.entradas[v.codigo])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Resultados</h2>
          <dl className="mt-3 flex flex-col gap-2.5">
            {simulacion.resultado.cards.map((c) => (
              <div key={c.titulo} className="flex justify-between gap-3 border-b border-line/70 pb-1.5">
                <dt className="text-[12.5px] text-ink-500">{c.titulo}</dt>
                <dd className="num m-0 text-[13.5px] font-semibold">
                  {c.formato === 'USD' ? formatUSD(c.valor) : `${c.valor.toFixed(1)}%`}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white"
            >
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/simulador')}
              className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13.5px] font-semibold text-ink-700"
            >
              Regresar al Simulador
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
