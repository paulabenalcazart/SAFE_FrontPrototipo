import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { IndicadorCalculado, RegistroFinanciero, SemaforoIndicador } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'

function variacion(a: number, b: number, mejorSiMayor: boolean): { dif: number; fg: string } {
  const dif = b - a
  const favorable = mejorSiMayor ? dif >= 0 : dif <= 0
  return { dif, fg: favorable ? 'text-emerald-deep' : 'text-destructive' }
}

function formatDif(dif: number, unidad: IndicadorCalculado['unidad']): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return `${(dif * 100).toFixed(1)} pp`
    case 'DIAS':
      return `${Math.round(dif)} días`
    default:
      return dif.toFixed(2)
  }
}

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

export function CompararIndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()

  const opciones = (registrosFinancieros[empresaActiva.id] ?? [])
    .filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)

  const [idA, setIdA] = useState(opciones[1]?.id ?? opciones[0]?.id ?? '')
  const [idB, setIdB] = useState(opciones[0]?.id ?? '')

  useEffect(() => {
    setIdA(opciones[1]?.id ?? opciones[0]?.id ?? '')
    setIdB(opciones[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaActiva.id])

  const registroA = opciones.find((r) => r.id === idA)
  const registroB = opciones.find((r) => r.id === idB)

  if (opciones.length < 2 || !registroA || !registroB) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">Necesitas al menos 2 periodos vigentes o reemplazados para comparar.</p>
        <button
          type="button"
          onClick={() => navigate('/app/indicadores')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Indicadores
        </button>
      </section>
    )
  }

  const etiqueta = (r: RegistroFinanciero) => `${formatPeriodo(r.periodo)} (v${r.version})`
  const indicadoresA = calcularIndicadores(registroA)
  const indicadoresB = calcularIndicadores(registroB)
  const filas = indicadoresA.map((iA) => {
    const iB = indicadoresB.find((i) => i.codigo === iA.codigo)!
    const { dif, fg } = variacion(iA.valor, iB.valor, iA.mejorSiMayor)
    const pct = iA.valor === 0 ? 0 : dif / Math.abs(iA.valor)
    return {
      codigo: iA.codigo,
      nombre: iA.nombre,
      a: iA.valorFormateado,
      b: iB.valorFormateado,
      dif: formatDif(dif, iA.unidad),
      pct: `${(pct * 100).toFixed(1)}%`,
      fg,
      semaforoB: iB.semaforo,
    }
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Comparar indicadores</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          {etiqueta(registroA)} frente a {etiqueta(registroB)}
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo A</label>
            <select value={idA} onChange={(e) => setIdA(e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]">
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo B</label>
            <select value={idB} onChange={(e) => setIdB(e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]">
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {idA === idB && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft p-3 text-[13px] font-semibold text-destructive">
            Selecciona dos periodos distintos para comparar.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Todos los indicadores MVP</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Diferencia</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">%</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Semáforo B</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.codigo} className="border-t border-line/70">
                  <td className="px-2 py-2">
                    <span className="block font-medium">{f.nombre}</span>
                    <span className="font-mono text-[10.5px] text-ink-500">{f.codigo}</span>
                  </td>
                  <td className="num px-2 py-2 text-right">{f.a}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{f.b}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.dif}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.pct}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[f.semaforoB]}`}>{f.semaforoB}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
