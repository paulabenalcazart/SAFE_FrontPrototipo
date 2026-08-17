import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Landmark, Lock, TrendingUp, Wallet } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { RegistroFinanciero } from '@/portal/types'
import { activoCorriente, balanceCuadrado, gastosTotales, pasivoCorriente, utilidadNeta } from './calculo'
import { EvolucionFinancieraChart } from './EvolucionFinancieraChart'
import { formatPeriodo, formatUSD } from './formato'

const ESTADO_BADGE: Record<RegistroFinanciero['estado'], string> = {
  BORRADOR: 'bg-amber-soft text-amber-deep',
  VIGENTE: 'bg-emerald-soft text-emerald-deep',
  REEMPLAZADO: 'bg-surface text-ink-700',
}

export function FinancieroScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()
  const [filtroEstado, setFiltroEstado] = useState<'todos' | RegistroFinanciero['estado']>('todos')
  const [busqueda, setBusqueda] = useState('')

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const elegiblesComparar = registros.filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
  const ultimoVigente = [...registros]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

  const filtrados = useMemo(() => {
    return [...registros]
      .filter((r) => (filtroEstado === 'todos' ? true : r.estado === filtroEstado))
      .filter((r) => formatPeriodo(r.periodo).toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)
  }, [registros, filtroEstado, busqueda])

  const alertas: string[] = []
  const borradores = registros.filter((r) => r.estado === 'BORRADOR')
  if (borradores.length > 0) {
    alertas.push(`Tienes ${borradores.length} carga(s) en borrador sin finalizar.`)
  }
  registros
    .filter((r) => r.estado === 'VIGENTE' && !balanceCuadrado(r))
    .forEach((r) => alertas.push(`El periodo ${formatPeriodo(r.periodo)} tiene un balance descuadrado.`))

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Estados financieros</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">
            Carga tus periodos mensuales, corrige versiones y compara la evolución del negocio.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={elegiblesComparar.length < 2}
            onClick={() => navigate('/app/financiero/comparar')}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700 disabled:opacity-50"
          >
            {elegiblesComparar.length < 2 && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
            Comparar periodos
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/financiero/nuevo')}
            className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
          >
            Nueva carga financiera
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="flex items-center gap-2.5 text-ink-500">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
              <TrendingUp className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="text-[12.5px] font-semibold text-ink-700">Ingresos del último periodo</p>
          </div>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(ultimoVigente.ingresosOperacionales) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="flex items-center gap-2.5 text-ink-500">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
              <Wallet className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="text-[12.5px] font-semibold text-ink-700">Utilidad neta del último periodo</p>
          </div>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(utilidadNeta(ultimoVigente)) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <div className="flex items-center gap-2.5 text-ink-500">
            <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
              <Landmark className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
            </span>
            <p className="text-[12.5px] font-semibold text-ink-700">Capital de trabajo</p>
          </div>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(activoCorriente(ultimoVigente) - pasivoCorriente(ultimoVigente)) : '—'}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex flex-wrap items-end gap-3 border-b border-line/70 bg-surface p-3.5">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
              className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
            >
              <option value="todos">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="BORRADOR">Borrador</option>
              <option value="REEMPLAZADO">Reemplazado</option>
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Buscar periodo</label>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Julio 2026"
              className="min-h-10 w-full rounded-md border border-line bg-card px-2.5 text-[13px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Periodo</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Versión</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Estado</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Ingresos</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Gastos</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Utilidad</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Balance</th>
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t border-line/70">
                  <td className="px-4.5 py-2.5 font-semibold whitespace-nowrap">{formatPeriodo(r.periodo)}</td>
                  <td className="num px-2 py-2.5 text-ink-700">v{r.version}</td>
                  <td className="px-2 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_BADGE[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="num px-2 py-2.5 text-right">{formatUSD(r.ingresosOperacionales)}</td>
                  <td className="num px-2 py-2.5 text-right">{formatUSD(gastosTotales(r))}</td>
                  <td className="num px-2 py-2.5 text-right font-semibold">{formatUSD(utilidadNeta(r))}</td>
                  <td className="px-2 py-2.5 text-[12.5px] font-semibold">
                    {balanceCuadrado(r) ? (
                      <span className="text-emerald-deep">✓ Cuadrado</span>
                    ) : (
                      <span className="text-destructive">⚠ Descuadrado</span>
                    )}
                  </td>
                  <td className="px-4.5 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/financiero/${r.id}`)}
                        className="min-h-8.5 rounded-md border border-line bg-card px-2.5 text-[12px] font-semibold text-ink-700"
                      >
                        Ver
                      </button>
                      {r.estado === 'BORRADOR' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/financiero/${r.id}/editar`)}
                          className="min-h-8.5 rounded-md border border-navy-600 bg-navy-600 px-2.5 text-[12px] font-semibold text-white"
                        >
                          Continuar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="px-4.5 py-8 text-center text-[13.5px] text-ink-500">
              {registros.length === 0
                ? 'Aún no hay periodos cargados para esta empresa.'
                : 'Ningún periodo coincide con los filtros.'}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EvolucionFinancieraChart registros={registros} />
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[17px] font-semibold">Alertas, validaciones y recomendaciones</h2>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {alertas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line p-3.5">
                <p className="text-[13px] leading-relaxed text-ink-700">
                  No hay alertas pendientes para {empresaActiva.nombre}.
                </p>
              </div>
            ) : (
              alertas.map((a) => (
                <div key={a} className="rounded-lg bg-amber-soft p-3">
                  <p className="text-[13px] leading-relaxed text-ink-900">{a}</p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
