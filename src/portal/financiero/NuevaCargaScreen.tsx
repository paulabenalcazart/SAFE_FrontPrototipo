import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import type { RegistroFinanciero } from '@/portal/types'
import { activoTotal, descuadreBalance, pasivoTotal, patrimonio, utilidadNeta } from './calculo'
import { formatUSD } from './formato'
import { crearRegistroVacio, PASOS, PASOS_CAMPOS, type CampoDefinicion, type WizardStep } from './wizard-steps'

function validarPaso(paso: WizardStep, draft: RegistroFinanciero): Record<string, string> {
  const errores: Record<string, string> = {}
  if (paso === 1) {
    if (!draft.periodo) errores.periodo = 'Selecciona el periodo.'
    return errores
  }
  if (paso === 10) return errores
  const campos = PASOS_CAMPOS[paso]
  for (const campo of campos) {
    const valor = draft[campo.key]
    if (typeof campo.min === 'number' && valor < campo.min) {
      errores[campo.key] = `${campo.label} no puede ser menor a ${campo.min}.`
    }
  }
  return errores
}

function CamposPaso({
  campos,
  draft,
  errores,
  onChange,
}: {
  campos: CampoDefinicion[]
  draft: RegistroFinanciero
  errores: Record<string, string>
  onChange: (key: CampoDefinicion['key'], value: number) => void
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
      {campos.map((campo) => (
        <div key={campo.key}>
          <Label htmlFor={`nc-${campo.key}`}>{campo.label}</Label>
          <Input
            id={`nc-${campo.key}`}
            type="number"
            step="0.01"
            min={campo.min}
            value={draft[campo.key]}
            onChange={(e) => onChange(campo.key, Number(e.target.value))}
            className="mt-1.5"
          />
          {campo.hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{campo.hint}</p>}
          {errores[campo.key] && (
            <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
              {errores[campo.key]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function NuevaCargaScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, registrosFinancieros, addRegistroFinanciero, updateRegistroFinanciero } = usePortalData()

  const registroExistente = id
    ? (registrosFinancieros[empresaActiva.id] ?? []).find((r) => r.id === id)
    : undefined

  const [draft, setDraft] = useState<RegistroFinanciero>(registroExistente ?? crearRegistroVacio())
  const [step, setStep] = useState<WizardStep>(1)
  const [maxStepReached, setMaxStepReached] = useState<WizardStep>(1)
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Si la empresa activa cambia (p. ej. desde el CompanySwitcher del Topbar) o la ruta
  // apunta a un :id distinto, el draft local (congelado por useState) queda desincronizado
  // de `registroExistente` (que sí se recalcula en cada render). Sin este efecto, "Guardar
  // borrador" podría persistir el draft de la empresa anterior en la empresa nueva.
  useEffect(() => {
    setDraft(registroExistente ?? crearRegistroVacio())
    setStep(1)
    setMaxStepReached(1)
    setErrores({})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaActiva.id, id])

  const esEdicion = Boolean(registroExistente)

  const actualizarCampo = (key: CampoDefinicion['key'], value: number) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const handleContinuar = () => {
    const erroresPaso = validarPaso(step, draft)
    setErrores(erroresPaso)
    if (Object.keys(erroresPaso).length > 0) return
    const siguiente = Math.min(step + 1, 10) as WizardStep
    setStep(siguiente)
    setMaxStepReached((m) => (siguiente > m ? siguiente : m))
  }

  const handleAtras = () => {
    if (step === 1) {
      navigate('/app/financiero')
      return
    }
    setErrores({})
    setStep((s) => (s - 1) as WizardStep)
  }

  const irAPaso = (n: WizardStep) => {
    if (n > maxStepReached) return
    setErrores({})
    setStep(n)
  }

  const persistir = (registro: RegistroFinanciero) => {
    if (esEdicion) {
      updateRegistroFinanciero(empresaActiva.id, registro.id, registro)
    } else {
      addRegistroFinanciero(empresaActiva.id, registro)
    }
  }

  const handleGuardarBorrador = () => {
    persistir({ ...draft, estado: 'BORRADOR', updatedAt: new Date().toISOString() })
    navigate('/app/financiero')
  }

  const descuadre = descuadreBalance(draft)
  const cuadrado = Math.abs(descuadre) < 0.01

  const handleFinalizar = () => {
    if (!cuadrado) return
    const registroFinal: RegistroFinanciero = { ...draft, estado: 'VIGENTE', updatedAt: new Date().toISOString() }
    persistir(registroFinal)
    navigate(`/app/financiero/${registroFinal.id}`)
  }

  const pasoActual = PASOS[step - 1]

  return (
    <section className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Nueva carga financiera</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">{empresaActiva.nombre} · diez pasos · moneda USD</p>
        </div>
        <span className="rounded-full bg-navy-100 px-3 py-1 text-[12.5px] font-bold text-navy-700">
          Paso {step} de 10
        </span>
      </div>

      <ol className="flex items-center">
        {PASOS.map((p, i) => (
          <li key={p.n} className={`flex items-center ${i < PASOS.length - 1 ? 'flex-1' : ''}`}>
            <button
              type="button"
              onClick={() => irAPaso(p.n)}
              disabled={p.n > maxStepReached}
              aria-current={p.n === step}
              className={`grid h-8.5 w-8.5 shrink-0 place-items-center rounded-full border text-[13px] font-bold disabled:cursor-not-allowed ${
                p.n === step
                  ? 'border-navy-600 bg-navy-600 text-white ring-4 ring-navy-100'
                  : p.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
              title={p.label}
            >
              {p.n}
            </button>
            {i < PASOS.length - 1 && (
              <span
                aria-hidden="true"
                className={`mx-1 h-0.5 flex-1 rounded-full ${p.n < step ? 'bg-emerald-brand' : 'bg-line'}`}
              />
            )}
          </li>
        ))}
      </ol>

      <div className="grid grid-cols-1 gap-4.5 lg:grid-cols-[1fr_280px] lg:items-start">
      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">
          {pasoActual.label} <span className="font-normal text-ink-500">· {step} / 10</span>
        </h2>

        {step === 1 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nc-periodo">Periodo</Label>
              <Input
                id="nc-periodo"
                type="month"
                value={draft.periodo ? draft.periodo.slice(0, 7) : ''}
                onChange={(e) => setDraft((d) => ({ ...d, periodo: e.target.value ? `${e.target.value}-01` : '' }))}
                className="mt-1.5"
              />
              {errores.periodo && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                  {errores.periodo}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="nc-moneda">Moneda</Label>
              <Input id="nc-moneda" value="USD" readOnly className="mt-1.5 bg-surface text-ink-500" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="nc-observaciones">Observaciones</Label>
              <Textarea
                id="nc-observaciones"
                rows={3}
                value={draft.observaciones}
                onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {step >= 2 && step <= 9 && (
          <CamposPaso campos={PASOS_CAMPOS[step as 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9]} draft={draft} errores={errores} onChange={actualizarCampo} />
        )}

        {step === 7 && (
          <div className="mt-4 rounded-lg border border-line/70 bg-surface p-3.5">
            <p className="text-[12.5px] text-ink-500">Utilidad neta calculada esperada</p>
            <p className="num mt-1.5 font-display text-xl font-bold">{formatUSD(utilidadNeta(draft))}</p>
          </div>
        )}

        {step === 10 && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Activo total</p>
                <p className="num mt-1.5 text-[15px] font-semibold">{formatUSD(activoTotal(draft))}</p>
              </div>
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Pasivo + patrimonio</p>
                <p className="num mt-1.5 text-[15px] font-semibold">
                  {formatUSD(pasivoTotal(draft) + patrimonio(draft))}
                </p>
              </div>
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Utilidad neta</p>
                <p className="num mt-1.5 text-[15px] font-semibold">{formatUSD(utilidadNeta(draft))}</p>
              </div>
            </div>
            <p
              className={`rounded-lg p-3.5 text-[13px] font-semibold leading-relaxed ${
                cuadrado ? 'bg-emerald-soft text-emerald-deep' : 'bg-danger-soft text-destructive'
              }`}
            >
              {cuadrado
                ? 'El balance cuadra: activo total = pasivo + patrimonio.'
                : `El balance no cuadra. Diferencia de ${formatUSD(Math.abs(descuadre))} — revisa los pasos anteriores antes de finalizar.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
          <button
            type="button"
            onClick={handleAtras}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleGuardarBorrador}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
          >
            Guardar borrador
          </button>
          {step < 10 ? (
            <button
              type="button"
              onClick={handleContinuar}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizar}
              disabled={!cuadrado}
              className="min-h-11 rounded-lg bg-emerald-brand px-4.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Finalizar carga
            </button>
          )}
        </div>
      </section>

      <aside className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-4.5 lg:sticky lg:top-4.5">
        <h3 className="text-[13px] font-semibold text-ink-700">Resumen en vivo</h3>
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-card p-3">
            <span className="text-[12px] text-ink-500">Activo total</span>
            <span className="num text-[13.5px] font-semibold">{formatUSD(activoTotal(draft))}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-card p-3">
            <span className="text-[12px] text-ink-500">Pasivo + patrimonio</span>
            <span className="num text-[13.5px] font-semibold">{formatUSD(pasivoTotal(draft) + patrimonio(draft))}</span>
          </div>
          <div className="flex items-center justify-between gap-2 rounded-lg bg-card p-3">
            <span className="text-[12px] text-ink-500">Utilidad neta</span>
            <span className="num text-[13.5px] font-semibold">{formatUSD(utilidadNeta(draft))}</span>
          </div>
        </div>
        <p
          className={`rounded-lg p-3 text-[12px] font-semibold leading-relaxed ${
            cuadrado ? 'bg-emerald-soft text-emerald-deep' : 'bg-danger-soft text-destructive'
          }`}
        >
          {cuadrado ? 'El balance cuadra hasta este punto.' : `Diferencia actual: ${formatUSD(Math.abs(descuadre))}`}
        </p>
      </aside>
      </div>
    </section>
  )
}
