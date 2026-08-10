import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { listarIndicadores } from '@/portal/financiero/calculo'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { PREGUNTAS_PLAN, planPorCodigo } from './catalogo'
import { estadisticasDeUso, modulosDelPlan } from './calculo'
import { formatExpiracion } from './formato'

const TOTAL_INDICADORES_MVP = listarIndicadores().length

export function PlanScreen() {
  const navigate = useNavigate()
  const {
    planActivoCodigo,
    metodosPago,
    empresaActiva,
    registrosFinancieros,
    simulaciones,
    obligacionesEmpresa,
    suscripcionCancelada,
  } = usePortalData()

  const plan = planPorCodigo(planActivoCodigo)
  const metodoPredeterminado = metodosPago.find((m) => m.predeterminado)
  const modulos = modulosDelPlan(planActivoCodigo)

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const vigentes = registros.filter((r) => r.estado === 'VIGENTE').length
  const obligaciones = obligacionesEmpresa[empresaActiva.id] ?? []
  const cumplidas = obligaciones.filter((o) => o.fechaCumplimiento).length
  const sims = simulaciones[empresaActiva.id] ?? []

  const stats = estadisticasDeUso({
    registrosFinancieros: registros.length,
    indicadoresCalculados: TOTAL_INDICADORES_MVP * vigentes,
    simulacionesRealizadas: sims.length,
    obligacionesCumplidas: cumplidas,
  })

  const campos: { label: string; valor: string }[] = [
    { label: 'Plan activo', valor: plan.nombre },
    { label: 'Estado', valor: suscripcionCancelada ? 'CANCELADA' : 'ACTIVA' },
    {
      label: 'Método de pago',
      valor: metodoPredeterminado ? metodoPredeterminado.tipo : 'Sin método registrado',
    },
    { label: 'Marca', valor: metodoPredeterminado ? metodoPredeterminado.marca : '--' },
    { label: 'Últimos cuatro', valor: metodoPredeterminado ? metodoPredeterminado.ultimosCuatro : '--' },
    {
      label: 'Expiración',
      valor: metodoPredeterminado
        ? formatExpiracion(metodoPredeterminado.mesExpiracion, metodoPredeterminado.anioExpiracion)
        : '--',
    },
    { label: 'Próxima renovación', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Precio', valor: formatUSD(plan.precio) },
    { label: 'Moneda', valor: 'USD' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Mi plan</h1>
        <p className="mt-1.5 text-sm text-ink-700">
          Tu suscripción es una función de cuenta: se administra igual con o sin empresas registradas.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                suscripcionCancelada ? 'bg-surface text-ink-500' : 'bg-emerald-soft text-emerald-deep'
              }`}
            >
              {suscripcionCancelada ? 'Cancelada' : 'Activa'}
            </span>
            <h2 className="mt-2 text-xl font-bold text-ink-900">{plan.nombre}</h2>
            <p className="mt-1 text-sm font-semibold text-navy-600">{formatUSD(plan.precio)} / mes</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => navigate('/app/plan/suscripcion')}>Administrar suscripción</Button>
            <Button variant="outline" onClick={() => navigate('/app/plan/metodos-pago')}>
              Actualizar tarjeta
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/plan/historial-pagos')}>
              Historial de pagos
            </Button>
          </div>
        </div>
        <dl className="mt-4.5 grid grid-cols-1 gap-3.5 border-t border-line-soft pt-4 sm:grid-cols-3">
          {campos.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1 text-[13.5px] font-medium text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-base font-semibold text-ink-900">Beneficios de tu plan</h2>
          <ul className="mt-3 space-y-2">
            {plan.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-base font-semibold text-ink-900">Módulos y límites</h2>
          <div className="mt-3 space-y-2">
            {modulos.map((m) => (
              <div key={m.nombre} className="flex items-center justify-between gap-2.5">
                <span className="text-[13px] text-ink-700">{m.nombre}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    m.incluido ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                  }`}
                >
                  {m.incluido ? 'Incluido' : 'No incluido'}
                </span>
              </div>
            ))}
          </div>
          <dl className="mt-3.5 space-y-2 border-t border-line-soft pt-3.5">
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Empresas</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.empresas}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Simulaciones</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.simulaciones}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Soporte</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.soporte}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900">Estadísticas de uso</h2>
        <div className="mt-3 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.titulo}
              className="flex min-h-[110px] flex-col gap-2 rounded-xl border border-line bg-card p-4"
            >
              <p className="text-[12.5px] font-semibold leading-tight text-ink-500">{s.titulo}</p>
              <p className="num mt-auto font-display text-3xl font-bold text-ink-900">{s.valor}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <h2 className="border-b border-line-soft px-4.5 py-4 text-base font-semibold text-ink-900">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="px-4.5">
          {PREGUNTAS_PLAN.map((f) => (
            <AccordionItem key={f.pregunta} value={f.pregunta}>
              <AccordionTrigger className="text-left text-sm font-medium text-ink-900">
                {f.pregunta}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-700">{f.respuesta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}
