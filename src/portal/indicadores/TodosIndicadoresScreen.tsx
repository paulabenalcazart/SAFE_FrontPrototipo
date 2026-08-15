import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador, SemaforoIndicador } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { BENCHMARKS_SECTORIALES } from './benchmarks'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

function formatBenchmark(codigo: string, unidad: 'RATIO' | 'PORCENTAJE' | 'VECES' | 'DIAS'): string {
  const valor = BENCHMARKS_SECTORIALES[codigo]
  if (valor === undefined) return '—'
  if (unidad === 'PORCENTAJE') return `${(valor * 100).toFixed(1)}%`
  if (unidad === 'DIAS') return `${Math.round(valor)} días`
  if (unidad === 'VECES') return `${valor.toFixed(2)}x`
  return valor.toFixed(2)
}

export function TodosIndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()
  const [busqueda, setBusqueda] = useState('')
  const [factorFiltro, setFactorFiltro] = useState<'todos' | FactorIndicador>('todos')
  const [semaforoFiltro, setSemaforoFiltro] = useState<'todos' | SemaforoIndicador>('todos')

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const registro = [...registros].filter((r) => r.estado === 'VIGENTE').sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

  // Compute anterior before early return (plain derivation, safe when registro is undefined)
  const anterior = [...registros]
    .filter((r) => r.estado === 'VIGENTE' && r.periodo < (registro?.periodo ?? ''))
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  const indicadoresAnterior = anterior ? calcularIndicadores(anterior) : []

  // Memoize calcularIndicadores result on registro (MUST be unconditional, before early return)
  const indicadores = useMemo(() => {
    return registro ? calcularIndicadores(registro) : []
  }, [registro])

  // Memoize filtrados with stable indicadores reference (MUST be unconditional, before early return)
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return indicadores.filter((i) => {
      if (factorFiltro !== 'todos' && i.factor !== factorFiltro) return false
      if (semaforoFiltro !== 'todos' && i.semaforo !== semaforoFiltro) return false
      return !q || i.nombre.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
    })
  }, [indicadores, factorFiltro, semaforoFiltro, busqueda])

  // Early return for empty state - now safe because all hooks have already run
  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <p className="text-[14px] text-ink-700">{empresaActiva.nombre} todavía no tiene periodos vigentes.</p>
      </section>
    )
  }

  const grupos = (['LIQUIDEZ', 'SOLVENCIA', 'GESTION', 'RENTABILIDAD'] as FactorIndicador[])
    .map((factor) => ({ factor, items: filtrados.filter((i) => i.factor === factor) }))
    .filter((g) => g.items.length > 0)

  const tendencia = (codigo: string, valorActual: number, mejorSiMayor: boolean) => {
    const previo = indicadoresAnterior.find((i) => i.codigo === codigo)
    if (!previo) return null
    const sube = valorActual > previo.valor
    return { sube, favorable: mejorSiMayor ? sube : !sube }
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Todos los indicadores</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">Solo indicadores en fase MVP. {formatPeriodo(registro.periodo)}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Buscar</label>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o código"
            className="min-h-10 w-full rounded-md border border-line bg-card px-2.5 text-[13px]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Factor</label>
          <select
            value={factorFiltro}
            onChange={(e) => setFactorFiltro(e.target.value as typeof factorFiltro)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            <option value="todos">Todos</option>
            <option value="LIQUIDEZ">Liquidez</option>
            <option value="SOLVENCIA">Solvencia</option>
            <option value="GESTION">Gestión</option>
            <option value="RENTABILIDAD">Rentabilidad</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Semáforo</label>
          <select
            value={semaforoFiltro}
            onChange={(e) => setSemaforoFiltro(e.target.value as typeof semaforoFiltro)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            <option value="todos">Todos</option>
            <option value="VERDE">Verde</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="ROJO">Rojo</option>
          </select>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-10 text-center text-[13.5px] text-ink-500">
          Ningún indicador coincide con los filtros.
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.factor} className="overflow-hidden rounded-xl border border-line bg-card">
            <h2 className="border-b border-line/70 bg-surface px-4.5 py-3.5 text-[16px] font-semibold">{FACTOR_LABEL[g.factor]}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-ink-500">
                    <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase">Indicador</th>
                    <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase">Valor</th>
                    <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase">Unidad</th>
                    <th scope="col" className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase">Tendencia</th>
                    <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase">Semáforo</th>
                    <th scope="col" className="px-4.5 py-2.5 text-right text-[11px] font-semibold uppercase">Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((i) => {
                    const t = tendencia(i.codigo, i.valor, i.mejorSiMayor)
                    return (
                      <tr key={i.codigo} className="border-t border-line/70">
                        <td className="px-4.5 py-2.5">
                          <span className="block font-semibold">{i.nombre}</span>
                          <span className="font-mono text-[10.5px] text-ink-500">{i.codigo}</span>
                        </td>
                        <td className="num px-2 py-2.5 text-right font-semibold">{i.valorFormateado}</td>
                        <td className="px-2 py-2.5 text-[12.5px] text-ink-700">{i.unidad}</td>
                        <td className="px-2 py-2.5 text-center">
                          {t ? (
                            t.sube ? (
                              <TrendingUp className={`inline h-[15px] w-[15px] ${t.favorable ? 'text-emerald-deep' : 'text-destructive'}`} aria-label="Sube vs. periodo anterior" />
                            ) : (
                              <TrendingDown className={`inline h-[15px] w-[15px] ${t.favorable ? 'text-emerald-deep' : 'text-destructive'}`} aria-label="Baja vs. periodo anterior" />
                            )
                          ) : (
                            <span className="text-[11.5px] text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>{i.semaforo}</span>
                        </td>
                        <td className="num px-4.5 py-2.5 text-right text-ink-700">{formatBenchmark(i.codigo, i.unidad)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </section>
  )
}
