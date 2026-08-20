import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador, IndicadorCalculado } from '@/portal/types'
import { calcularIndicadores, calcularSaludFinanciera } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { DESCRIPCION_INDICADOR } from './descripciones'
import { RentabilidadHistoricaChart } from './RentabilidadHistoricaChart'
import { LiquidezHistoricaChart } from './LiquidezHistoricaChart'
import { Droplet, Gauge, HelpCircle, ShieldCheck, TrendingUp, TriangleAlert } from 'lucide-react'
import { AlertBox } from '@/portal/components/AlertBox'
import { SeverityIcon } from '@/portal/components/SeverityIcon'
import { Card } from '@/portal/components/Card'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const FACTOR_ICON: Record<FactorIndicador, typeof TrendingUp> = {
  LIQUIDEZ: Droplet,
  SOLVENCIA: ShieldCheck,
  GESTION: Gauge,
  RENTABILIDAD: TrendingUp,
}

const DEFAULT_INDICADORES_PRINCIPALES = ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08']

const ESPECIALIDAD_POR_FACTOR: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Contador',
  SOLVENCIA: 'Asesor financiero',
  GESTION: 'Contador',
  RENTABILIDAD: 'Asesor financiero',
}

function formatVariacion(dif: number, unidad: IndicadorCalculado['unidad']): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return `${dif >= 0 ? '+' : ''}${(dif * 100).toFixed(1)} pp`
    case 'DIAS':
      return `${dif >= 0 ? '+' : ''}${Math.round(dif)} días`
    default:
      return `${dif >= 0 ? '+' : ''}${dif.toFixed(2)}`
  }
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

  const codigosPrincipales = indicadoresPrincipales[empresaActiva.id] ?? DEFAULT_INDICADORES_PRINCIPALES
  const indicadores = calcularIndicadores(registro)
  const principales = codigosPrincipales
    .map((codigo) => indicadores.find((i) => i.codigo === codigo))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

  const anterior = [...registros]
    .filter((r) => r.estado === 'VIGENTE' && r.periodo < registro.periodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  const indicadoresAnterior = anterior ? calcularIndicadores(anterior) : []

  const variacionTexto = (codigo: string, valorActual: number, mejorSiMayor: boolean, unidad: IndicadorCalculado['unidad']) => {
    const previo = indicadoresAnterior.find((i) => i.codigo === codigo)
    if (!previo) return { texto: 'Sin periodo anterior', fg: 'text-ink-500' }
    const dif = valorActual - previo.valor
    const favorable = mejorSiMayor ? dif >= 0 : dif <= 0
    return {
      texto: `${formatVariacion(dif, unidad)} vs. periodo anterior`,
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
            onClick={() => navigate('/app/indicadores/comparar')}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-ink-700"
          >
            Comparar periodos
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/indicadores/principales')}
            className="min-h-11 rounded-lg bg-navy-600 px-3.5 text-[13.5px] font-semibold text-white"
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
          const variacion = variacionTexto(i.codigo, i.valor, i.mejorSiMayor, i.unidad)
          const FactorIcon = FACTOR_ICON[i.factor]
          const numeroColor =
            i.semaforo === 'VERDE' ? 'text-emerald-deep' : i.semaforo === 'AMARILLO' ? 'text-amber-deep' : 'text-destructive'
          return (
            <Card key={i.codigo} padding="lg" className="flex min-h-[216px] flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <FactorIcon className="h-4.5 w-4.5 shrink-0 text-navy-600" aria-hidden="true" />
                  <h3 className="truncate text-[14.5px] font-semibold leading-tight">{i.nombre}</h3>
                </div>
                <button
                  type="button"
                  title={DESCRIPCION_INDICADOR[i.codigo]}
                  aria-label={`Qué es ${i.nombre}`}
                  className="shrink-0 text-ink-500"
                >
                  <HelpCircle className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <span className={`num font-display text-[28px] font-bold leading-none ${numeroColor}`}>
                {i.valorFormateado}
              </span>
              <span className={`text-[12px] font-semibold text-ink-700`}>{variacion.texto}</span>
              <button
                type="button"
                onClick={() => navigate('/app/indicadores/todos')}
                className="mt-auto w-fit text-[12.5px] font-semibold text-navy-700 underline"
              >
                Ver más
              </button>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RentabilidadHistoricaChart registros={registros} />
        <LiquidezHistoricaChart registros={registros} />
      </div>

      <Card as="section" padding="lg">
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
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Alertas financieras</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {rojos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin alertas para este periodo.</p>
            ) : (
              rojos.map((i) => (
                <AlertBox key={i.codigo} icon={TriangleAlert} tono="critico" cornerLabel="Riesgo">
                  <p className="text-[13px] leading-snug">
                    {i.nombre} está en {i.valorFormateado}, fuera del rango saludable.
                  </p>
                  <button type="button" onClick={irAMarketplace} className="mt-1.5 text-[12.5px] font-semibold text-navy-600">
                    Buscar {ESPECIALIDAD_POR_FACTOR[i.factor]}
                  </button>
                </AlertBox>
              ))
            )}
          </div>
        </Card>
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {amarillos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin recomendaciones para este periodo.</p>
            ) : (
              amarillos.map((i) => (
                <div key={i.codigo} className="flex items-start gap-3 rounded-lg border border-line/70 bg-surface p-3">
                  <SeverityIcon nivel="media" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] leading-snug">
                      {i.nombre} está en {i.valorFormateado} — cerca del límite saludable.
                    </p>
                    <div className="mt-2 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={irAMarketplace}
                        className="min-h-8.5 rounded-lg bg-navy-600 px-3 text-[12px] font-semibold text-white"
                      >
                        Buscar profesional
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}
