import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador } from '@/portal/types'
import { calcularIndicadores, calcularSaludFinanciera } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { DESCRIPCION_INDICADOR } from './descripciones'
import { RentabilidadHistoricaChart } from './RentabilidadHistoricaChart'
import { LiquidezHistoricaChart } from './LiquidezHistoricaChart'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const SEMAFORO_BADGE: Record<'VERDE' | 'AMARILLO' | 'ROJO', string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

const ESPECIALIDAD_POR_FACTOR: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Contador',
  SOLVENCIA: 'Asesor financiero',
  GESTION: 'Contador',
  RENTABILIDAD: 'Asesor financiero',
}

function colorPuntaje(puntaje: number): string {
  if (puntaje >= 80) return 'bg-emerald-brand'
  if (puntaje >= 60) return 'bg-navy-500'
  if (puntaje >= 40) return 'bg-amber-brand'
  return 'bg-destructive'
}

export function IndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros, indicadoresPrincipales } = usePortalData()

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const elegibles = [...registros]
    .filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)

  const [periodoId, setPeriodoId] = useState(elegibles[0]?.id ?? '')
  const registro = elegibles.find((r) => r.id === periodoId) ?? elegibles[0]

  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Indicadores financieros</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">
            {empresaActiva.nombre} todavía no tiene periodos financieros cargados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/financiero/nuevo')}
          className="min-h-11 w-fit rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
        >
          Nueva carga financiera
        </button>
      </section>
    )
  }

  const codigosPrincipales = indicadoresPrincipales[empresaActiva.id] ?? []
  const indicadores = calcularIndicadores(registro)
  const principales = codigosPrincipales
    .map((codigo) => indicadores.find((i) => i.codigo === codigo))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

  const anterior = [...registros]
    .filter((r) => r.estado === 'VIGENTE' && r.periodo < registro.periodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  const indicadoresAnterior = anterior ? calcularIndicadores(anterior) : []

  const variacionTexto = (codigo: string, valorActual: number, mejorSiMayor: boolean) => {
    const previo = indicadoresAnterior.find((i) => i.codigo === codigo)
    if (!previo) return { texto: 'Sin periodo anterior', fg: 'text-ink-500' }
    const dif = valorActual - previo.valor
    const favorable = mejorSiMayor ? dif >= 0 : dif <= 0
    return {
      texto: `${dif >= 0 ? '+' : ''}${dif.toFixed(2)} vs. periodo anterior`,
      fg: favorable ? 'text-emerald-deep' : 'text-destructive',
    }
  }

  const salud = calcularSaludFinanciera(registro)
  const rojos = indicadores.filter((i) => i.semaforo === 'ROJO')
  const amarillos = indicadores.filter((i) => i.semaforo === 'AMARILLO').slice(0, 3)
  const irAMarketplace = () => navigate('/app/marketplace')

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Indicadores financieros</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">Periodo analizado: {formatPeriodo(registro.periodo)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <select
            value={registro.id}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            {elegibles.map((r) => (
              <option key={r.id} value={r.id}>
                {formatPeriodo(r.periodo)} (v{r.version})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => navigate('/app/financiero/comparar')}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-ink-700"
          >
            Comparar periodos
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/indicadores/principales')}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-ink-700"
          >
            Cambiar indicadores principales
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-[18px] font-semibold">Indicadores principales</h2>
        <button type="button" onClick={() => navigate('/app/indicadores/todos')} className="text-[13px] font-semibold text-navy-500">
          Ver todos los indicadores
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {principales.map((i) => {
          const variacion = variacionTexto(i.codigo, i.valor, i.mejorSiMayor)
          return (
            <div key={i.codigo} className="flex min-h-[216px] flex-col gap-2 rounded-xl border border-line bg-card p-4.5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[11px] font-semibold text-navy-700">
                  {FACTOR_LABEL[i.factor]}
                </span>
                <span className="font-mono text-[10.5px] text-ink-500">{i.codigo}</span>
              </div>
              <h3 className="text-[14.5px] font-semibold leading-tight">{i.nombre}</h3>
              <span className="num font-display text-[28px] font-bold leading-none">{i.valorFormateado}</span>
              <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>
                {i.semaforo}
              </span>
              <span className={`text-[12px] font-semibold ${variacion.fg}`}>{variacion.texto}</span>
              <p className="line-clamp-3 text-[12.5px] leading-snug text-ink-700">{DESCRIPCION_INDICADOR[i.codigo]}</p>
              <button
                type="button"
                onClick={() => navigate('/app/indicadores/todos')}
                className="mt-auto min-h-8.5 w-fit rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700"
              >
                Ver detalle
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RentabilidadHistoricaChart registros={registros} />
        <LiquidezHistoricaChart registros={registros} />
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-[16px] font-semibold">Salud financiera</h2>
          <span className="num font-display text-[26px] font-bold">{Math.round(salud.puntaje)}</span>
          <span className="text-[13px] text-ink-700">{salud.etiqueta}</span>
        </div>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {salud.factores.map((f) => (
            <div key={f.factor} className="flex items-center gap-3">
              <span className="w-[100px] flex-none text-[12.5px] font-semibold">{FACTOR_LABEL[f.factor]}</span>
              <span className="h-[9px] flex-1 overflow-hidden rounded-full bg-surface">
                <span className={`block h-full rounded-full ${colorPuntaje(f.puntaje)}`} style={{ width: `${Math.round(f.puntaje)}%` }} />
              </span>
              <span className="num w-10 flex-none text-right text-[12.5px] font-semibold">{Math.round(f.puntaje)}</span>
              <span className="w-11 flex-none text-right text-[11.5px] text-ink-500">{Math.round(f.peso * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Alertas financieras</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {rojos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin alertas para este periodo.</p>
            ) : (
              rojos.map((i) => (
                <div key={i.codigo} className="rounded-lg bg-danger-soft p-3">
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-destructive">
                    Riesgo
                  </span>
                  <p className="mt-2 text-[13px] leading-snug">
                    {i.nombre} está en {i.valorFormateado}, fuera del rango saludable.
                  </p>
                  <button type="button" onClick={irAMarketplace} className="mt-1.5 text-[12.5px] font-semibold text-navy-600">
                    Buscar {ESPECIALIDAD_POR_FACTOR[i.factor]}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {amarillos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin recomendaciones para este periodo.</p>
            ) : (
              amarillos.map((i) => (
                <div key={i.codigo} className="rounded-lg border border-line/70 bg-surface p-3">
                  <p className="text-[13px] leading-snug">
                    {i.nombre} está en {i.valorFormateado} — cerca del límite saludable.
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] text-ink-500">Prioridad media</span>
                    <button type="button" onClick={irAMarketplace} className="text-[12.5px] font-semibold text-navy-600">
                      Buscar profesional
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
