import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { Switch } from '@/components/ui/switch'
import type { EscenarioSimulacion, RegistroFinanciero, Simulacion } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'
import { utilidadNeta } from '@/portal/financiero/calculo'
import { formatFecha } from '@/portal/obligaciones/formato'
import { ESCENARIOS_SIMULACION, escenarioPorCodigo, VARIABLES_POR_ESCENARIO } from './catalogo'
import {
  HOY_SIMULADOR,
  pctCostoVariableSugerido,
  simularAumentoVentas,
  simularContratacionPersonal,
  ultimoRegistroVigente,
} from './calculo'
import { NIVEL_RIESGO_BADGE, NIVEL_RIESGO_LABEL } from './estilo'
import { SimulacionChart } from './SimulacionChart'
import { SeverityIcon } from '@/portal/components/SeverityIcon'
import { Building2, Landmark, TrendingUp, UserPlus } from 'lucide-react'

const ESCENARIO_ICON: Record<string, typeof TrendingUp> = {
  CONTRATACION_PERSONAL: UserPlus,
  AUMENTO_VENTAS: TrendingUp,
  CAMBIO_REGIMEN_TRIBUTARIO: Landmark,
  AUMENTO_CAPITAL: Building2,
}

const RIESGO_A_SEVERIDAD: Record<Simulacion['resultado']['nivelRiesgo'], 'baja' | 'media' | 'alta' | 'critica'> = {
  BAJO: 'baja',
  MEDIO: 'media',
  ALTO: 'alta',
  CRITICO: 'critica',
}

type Paso = 1 | 2 | 3

function disponibilidadEscenario(
  escenario: EscenarioSimulacion,
  registroBase: RegistroFinanciero | undefined,
): { disponible: boolean; motivo?: string } {
  if (!escenario.implementado) return { disponible: false, motivo: 'Próximamente' }
  if (escenario.codigo === 'AUMENTO_VENTAS' && !registroBase) {
    return { disponible: false, motivo: 'Requiere registro financiero vigente' }
  }
  return { disponible: true }
}

export function SimuladorScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros, simulaciones, guardarSimulacion } = usePortalData()

  const [step, setStep] = useState<Paso>(1)
  const [maxStepReached, setMaxStepReached] = useState<Paso>(1)
  const [escenarioCodigo, setEscenarioCodigo] = useState<string | null>(null)
  const [entradas, setEntradas] = useState<Record<string, number | boolean>>({})
  const [resultadoActual, setResultadoActual] = useState<Simulacion['resultado'] | null>(null)

  // Si la empresa activa cambia (p. ej. desde el CompanySwitcher del Topbar) mientras el wizard
  // está en el paso 2 o 3, el estado local (congelado por useState) queda desincronizado de la
  // empresa nueva — mismo problema que NuevaCargaScreen.tsx resuelve para su draft. Sin este
  // efecto, "Ejecutar simulación" podría ser un no-op silencioso (p. ej. AUMENTO_VENTAS sin
  // registro financiero vigente en la empresa nueva) o el paso 3 podría seguir mostrando el
  // resultado de la empresa anterior mientras el Historial de abajo ya muestra la empresa nueva.
  useEffect(() => {
    setStep(1)
    setMaxStepReached(1)
    setEscenarioCodigo(null)
    setEntradas({})
    setResultadoActual(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaActiva.id])

  const registroBase = ultimoRegistroVigente(registrosFinancieros[empresaActiva.id] ?? [])

  const historial = [...(simulaciones[empresaActiva.id] ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const escenarioActivo = escenarioCodigo ? escenarioPorCodigo(escenarioCodigo) : undefined
  const variablesActivo = escenarioCodigo ? (VARIABLES_POR_ESCENARIO[escenarioCodigo] ?? []) : []

  const seleccionarEscenario = (codigo: string) => {
    const variables = VARIABLES_POR_ESCENARIO[codigo] ?? []
    const draft: Record<string, number | boolean> = {}
    for (const v of variables) draft[v.codigo] = v.default
    if (codigo === 'AUMENTO_VENTAS' && registroBase) {
      draft.pctCostoVariable = pctCostoVariableSugerido(registroBase)
    }
    setEscenarioCodigo(codigo)
    setEntradas(draft)
    setResultadoActual(null)
    setStep(2)
    setMaxStepReached((m) => (m < 2 ? 2 : m))
  }

  const actualizarVariable = (codigo: string, valor: number | boolean) => {
    setEntradas((current) => ({ ...current, [codigo]: valor }))
  }

  const handleEjecutar = () => {
    if (!escenarioCodigo) return
    const resultado =
      escenarioCodigo === 'CONTRATACION_PERSONAL'
        ? simularContratacionPersonal(entradas)
        : registroBase
          ? simularAumentoVentas(entradas, registroBase.ingresosOperacionales, utilidadNeta(registroBase))
          : null
    if (!resultado) return
    const nuevaSimulacion: Simulacion = {
      id: crypto.randomUUID(),
      escenarioCodigo,
      fecha: HOY_SIMULADOR,
      entradas,
      resultado,
    }
    guardarSimulacion(empresaActiva.id, nuevaSimulacion)
    setResultadoActual(resultado)
    setStep(3)
    setMaxStepReached(3)
  }

  const handleNuevaSimulacion = () => {
    setEscenarioCodigo(null)
    setEntradas({})
    setResultadoActual(null)
    setStep(1)
    setMaxStepReached(1)
  }

  const irAPaso = (n: Paso) => {
    if (n > maxStepReached || (n === 3 && !resultadoActual)) return
    setStep(n)
  }

  const pasos: { n: Paso; label: string }[] = [
    { n: 1, label: 'Escenario' },
    { n: 2, label: 'Variables' },
    { n: 3, label: 'Resultado' },
  ]

  const baselineLabel =
    escenarioCodigo === 'CONTRATACION_PERSONAL'
      ? 'Empleados actuales'
      : escenarioCodigo === 'AUMENTO_VENTAS'
        ? 'Ingresos mensuales base (último registro vigente)'
        : ''
  const baselineValor =
    escenarioCodigo === 'CONTRATACION_PERSONAL'
      ? empresaActiva.general.numeroEmpleados
      : escenarioCodigo === 'AUMENTO_VENTAS' && registroBase
        ? formatUSD(registroBase.ingresosOperacionales)
        : ''

  return (
    <section className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Simulador</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">
            Evalúa escenarios financieros y tributarios antes de tomar decisiones importantes para tu empresa.
          </p>
        </div>
        {step === 3 && (
          <button
            type="button"
            onClick={handleNuevaSimulacion}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13.5px] font-semibold text-navy-700"
          >
            Nueva simulación
          </button>
        )}
      </div>

      <ol className="flex flex-wrap gap-5">
        {pasos.map((p) => (
          <li key={p.n} className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => irAPaso(p.n)}
              disabled={p.n > maxStepReached}
              aria-current={p.n === step}
              className={`grid h-7.5 w-7.5 place-items-center rounded-full border text-[13px] font-bold disabled:cursor-not-allowed ${
                p.n === step
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : p.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
            >
              {p.n}
            </button>
            <span className={`text-[13px] ${p.n === step ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>{p.label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="rounded-xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">1. Escenario</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-700">Selecciona el tipo de escenario que deseas simular.</p>
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {ESCENARIOS_SIMULACION.map((e) => {
              const { disponible, motivo } = disponibilidadEscenario(e, registroBase)
              const EscenarioIcon = ESCENARIO_ICON[e.codigo] ?? TrendingUp
              return (
                <button
                  key={e.codigo}
                  type="button"
                  disabled={!disponible}
                  onClick={() => seleccionarEscenario(e.codigo)}
                  className={`flex flex-col items-center gap-3 rounded-xl border border-line bg-card p-5 text-center disabled:cursor-not-allowed ${
                    disponible ? 'hover:border-navy-600' : 'opacity-60'
                  }`}
                >
                  <span className="self-end text-[10.5px] font-bold uppercase tracking-wide text-ink-500">
                    {disponible ? e.categoria : `${e.categoria} · ${motivo}`}
                  </span>
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-navy-100 text-navy-700">
                    <EscenarioIcon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <h3 className="text-[16px] font-semibold">{e.nombre}</h3>
                  <p className="text-[13px] leading-relaxed text-ink-700">{e.descripcion}</p>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Historial de simulaciones</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {historial.length === 0 ? (
              <p className="py-6 text-center text-[13px] text-ink-500">Todavía no has ejecutado ninguna simulación.</p>
            ) : (
              historial.map((s) => {
                const catalogo = escenarioPorCodigo(s.escenarioCodigo)
                return (
                  <div key={s.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line/70 p-3">
                    <div className="min-w-0 flex-1 basis-[200px]">
                      <p className="text-[13.5px] font-semibold">{catalogo?.nombre ?? s.escenarioCodigo}</p>
                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {formatFecha(s.fecha)} · {empresaActiva.nombre}
                      </p>
                    </div>
                    <span className="flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-700">
                      <SeverityIcon nivel={RIESGO_A_SEVERIDAD[s.resultado.nivelRiesgo]} />
                      Riesgo {NIVEL_RIESGO_LABEL[s.resultado.nivelRiesgo]}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/simulador/${s.id}`)}
                      className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700"
                    >
                      Ver detalle
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="min-h-9.5 rounded-lg bg-navy-600 px-3 text-[12.5px] font-semibold text-white"
                    >
                      Exportar PDF
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </section>
      )}

      {step === 2 && escenarioActivo && (
        <div className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1fr_280px] lg:items-start">
          <section className="rounded-xl border border-line bg-card p-5">
            <h2 className="text-lg font-semibold">2. Variables</h2>
            <p className="mt-1.5 text-[13.5px] text-ink-700">
              Completa la información requerida para tu simulación.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              {variablesActivo.map((v) => (
                <div key={v.codigo} className="min-w-0">
                  <label htmlFor={`sim-${v.codigo}`} className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                    {v.label}
                  </label>
                  {v.tipoDato === 'BOOLEANO' ? (
                    <div id={`sim-${v.codigo}`} className="flex min-h-11 w-full items-center justify-between gap-2.5 rounded-lg border border-line bg-card px-3 text-[13.5px]">
                      <span>{entradas[v.codigo] ? 'Sí' : 'No'}</span>
                      <Switch
                        checked={Boolean(entradas[v.codigo])}
                        onCheckedChange={() => actualizarVariable(v.codigo, !entradas[v.codigo])}
                        label={v.label}
                      />
                    </div>
                  ) : (
                    <div className="flex min-h-11 w-full items-center gap-2 rounded-lg border border-line bg-card px-3">
                      <input
                        id={`sim-${v.codigo}`}
                        type="number"
                        value={typeof entradas[v.codigo] === 'number' ? (entradas[v.codigo] as number) : 0}
                        min={v.valorMinimo}
                        max={v.valorMaximo}
                        onChange={(e) => {
                          const parsed = Number(e.target.value)
                          actualizarVariable(v.codigo, Number.isFinite(parsed) ? parsed : 0)
                        }}
                        className="min-w-0 flex-1 bg-transparent text-[14px] focus:outline-none"
                      />
                      {v.unidad && <span className="shrink-0 text-[12px] text-ink-500">{v.unidad}</span>}
                    </div>
                  )}
                  {v.hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{v.hint}</p>}
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
              >
                Atrás
              </button>
              <button
                type="button"
                onClick={handleEjecutar}
                className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
              >
                Ejecutar simulación
              </button>
            </div>
          </section>

          <aside className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4.5 lg:sticky lg:top-4.5">
            <div>
              <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide text-navy-700">
                {escenarioActivo.categoria}
              </span>
              <h3 className="mt-2 text-[15px] font-semibold leading-tight">{escenarioActivo.nombre}</h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{escenarioActivo.descripcion}</p>
            </div>
            <div className="rounded-lg border border-line/70 bg-card p-3.5">
              <p className="text-[12px] text-ink-500">{baselineLabel}</p>
              <p className="num mt-1.5 font-display text-xl font-bold">{baselineValor}</p>
            </div>
          </aside>
        </div>
      )}

      {step === 3 && resultadoActual && escenarioActivo && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {resultadoActual.cards.map((c) => (
              <div key={c.titulo} className="flex min-h-[130px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
                <p className="text-[12.5px] font-semibold text-ink-500">{c.titulo}</p>
                <p className="num mt-auto text-[26px] font-bold leading-none">
                  {c.formato === 'USD' ? formatUSD(c.valor) : `${c.valor.toFixed(1)}%`}
                </p>
                <p className="text-[12px] leading-snug text-ink-500">{c.sub}</p>
              </div>
            ))}
          </div>

          <SimulacionChart serie={resultadoActual.serie} />

          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${NIVEL_RIESGO_BADGE[resultadoActual.nivelRiesgo]}`}>
              Riesgo {NIVEL_RIESGO_LABEL[resultadoActual.nivelRiesgo]}
            </span>
            <p className="text-[13px] text-ink-700">{resultadoActual.riesgoTexto}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-card p-4.5">
              <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
              <ol className="mt-3 flex flex-col gap-2.5 pl-5 text-[13px] leading-relaxed text-ink-900">
                {resultadoActual.recomendaciones.map((r) => (
                  <li key={r} className="list-decimal">
                    {r}
                  </li>
                ))}
              </ol>
            </section>
            <div className="flex flex-col gap-4">
              <section className="rounded-xl border border-line bg-card p-4.5">
                <h2 className="text-[16px] font-semibold">Supuestos del escenario</h2>
                <ul className="mt-3 flex flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-700">
                  {resultadoActual.supuestos.map((s) => (
                    <li key={s} className="list-disc">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-line bg-surface p-4.5">
                <h2 className="text-[16px] font-semibold">Limitaciones</h2>
                <ul className="mt-3 flex flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-700">
                  {resultadoActual.limitaciones.map((l) => (
                    <li key={l} className="list-disc">
                      {l}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
            >
              Regresar al Simulador
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Exportar PDF
            </button>
          </div>
        </section>
      )}
    </section>
  )
}
