import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { IndicadorCalculado, RegistroFinanciero } from '@/portal/types'
import { activoTotal, calcularIndicadores, gastosTotales, utilidadNeta } from './calculo'
import { formatPeriodo, formatUSD } from './formato'
import { PASOS_CAMPOS } from './wizard-steps'

const INDICADORES_PRINCIPALES = ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08']

// paso 2 = Activo, paso 5 = Ingreso -> un aumento es positivo
// paso 3 = Pasivo, paso 7 = Gasto -> un aumento es negativo
const SECCIONES_CONCEPTO: { titulo: string; pasos: (2 | 3 | 5 | 7)[] }[] = [
  { titulo: 'Activo', pasos: [2] },
  { titulo: 'Pasivo', pasos: [3] },
  { titulo: 'Ingresos y gastos', pasos: [5, 7] },
]

function variacion(a: number, b: number, mejorSiMayor = true): { dif: number; pct: number; fg: string } {
  const dif = b - a
  const pct = a === 0 ? 0 : dif / Math.abs(a)
  const esFavorable = mejorSiMayor ? dif >= 0 : dif <= 0
  return { dif, pct, fg: esFavorable ? 'text-emerald-deep' : 'text-destructive' }
}

function formatVariacionIndicador(dif: number, unidad: IndicadorCalculado['unidad']): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return `${(dif * 100).toFixed(1)} pp`
    case 'DIAS':
      return `${Math.round(dif)} días`
    case 'RATIO':
    case 'VECES':
    default:
      return dif.toFixed(2)
  }
}

export function CompararPeriodosScreen() {
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
        <p className="text-[14px] text-ink-700">
          Necesitas al menos 2 periodos vigentes o reemplazados para comparar.
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Estados financieros
        </button>
      </section>
    )
  }

  const etiqueta = (r: RegistroFinanciero) => `${formatPeriodo(r.periodo)} (v${r.version})`
  const mismoRegistro = idA === idB

  const kpisResumen = [
    { titulo: 'Ingresos', a: registroA.ingresosOperacionales, b: registroB.ingresosOperacionales, mejorSiMayor: true },
    { titulo: 'Gastos totales', a: gastosTotales(registroA), b: gastosTotales(registroB), mejorSiMayor: false },
    { titulo: 'Utilidad neta', a: utilidadNeta(registroA), b: utilidadNeta(registroB), mejorSiMayor: true },
    { titulo: 'Activo total', a: activoTotal(registroA), b: activoTotal(registroB), mejorSiMayor: true },
  ]

  const indicadoresA = calcularIndicadores(registroA)
  const indicadoresB = calcularIndicadores(registroB)
  const filasIndicadores = INDICADORES_PRINCIPALES.map((codigo) => {
    const iA = indicadoresA.find((i) => i.codigo === codigo)!
    const iB = indicadoresB.find((i) => i.codigo === codigo)!
    const { dif, fg } = variacion(iA.valor, iB.valor, iA.mejorSiMayor)
    return { nombre: iA.nombre, a: iA.valorFormateado, b: iB.valorFormateado, dif: formatVariacionIndicador(dif, iA.unidad), fg }
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
        >
          ← Estados financieros
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Comparar periodos</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          {etiqueta(registroA)} frente a {etiqueta(registroB)} · solo registros vigentes
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo A</label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo B</label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {mismoRegistro && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft p-3 text-[13px] font-semibold text-destructive">
            Selecciona dos periodos distintos para comparar.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpisResumen.map((k) => {
          const { dif, fg } = variacion(k.a, k.b, k.mejorSiMayor)
          return (
            <div key={k.titulo} className="rounded-xl border border-line bg-card p-4">
              <p className="text-[12.5px] font-semibold text-ink-500">{k.titulo}</p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="num text-[13px] text-ink-500">{formatUSD(k.a)}</span>
                <span aria-hidden="true" className="text-ink-500">→</span>
                <span className="num font-display text-xl font-bold">{formatUSD(k.b)}</span>
              </div>
              <p className={`num mt-1.5 text-[13px] font-semibold ${fg}`}>
                {dif >= 0 ? '+' : ''}
                {formatUSD(dif)}
              </p>
            </div>
          )
        })}
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Indicadores principales</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Variación</th>
              </tr>
            </thead>
            <tbody>
              {filasIndicadores.map((f) => (
                <tr key={f.nombre} className="border-t border-line/70">
                  <td className="px-2 py-2 font-medium">{f.nombre}</td>
                  <td className="num px-2 py-2 text-right">{f.a}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{f.b}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.dif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {SECCIONES_CONCEPTO.map((seccion) => (
        <section key={seccion.titulo} className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">{seccion.titulo}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-ink-500">
                  <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Concepto</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Variación</th>
                </tr>
              </thead>
              <tbody>
                {seccion.pasos
                  .flatMap((paso) => PASOS_CAMPOS[paso].map((campo) => ({ campo, paso })))
                  .map(({ campo, paso }) => {
                  const a = registroA[campo.key] as number
                  const b = registroB[campo.key] as number
                  // Activo (2) e Ingreso (5): un aumento es favorable. Pasivo (3) y Gasto (7): un aumento no lo es.
                  const mejorSiMayor = paso === 2 || paso === 5
                  const { dif, fg } = variacion(a, b, mejorSiMayor)
                  return (
                    <tr key={campo.key} className="border-t border-line/70">
                      <td className="px-2 py-2 font-medium">{campo.label}</td>
                      <td className="num px-2 py-2 text-right">{formatUSD(a)}</td>
                      <td className="num px-2 py-2 text-right font-semibold">{formatUSD(b)}</td>
                      <td className={`num px-2 py-2 text-right ${fg}`}>
                        {dif >= 0 ? '+' : ''}
                        {formatUSD(dif)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </section>
  )
}
