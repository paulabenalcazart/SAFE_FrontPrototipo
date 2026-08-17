import { useNavigate } from 'react-router-dom'
import { CalendarDays, Check, CreditCard, Crown, Receipt, Tag, Trophy } from 'lucide-react'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Mi plan</h1>
        <p className="mt-1.5 text-sm text-ink-700">
          Tu suscripción es una función de cuenta: se administra igual con o sin empresas registradas.
        </p>
      </div>

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 sm:flex-row sm:items-stretch">
        <div className="flex flex-1 items-start gap-3.5">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-navy-100 text-navy-700">
            <Crown className="h-6.5 w-6.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                suscripcionCancelada ? 'bg-surface text-ink-500' : 'bg-emerald-soft text-emerald-deep'
              }`}
            >
              {suscripcionCancelada ? 'Cancelada' : 'Activa'}
            </span>
            <h2 className="mt-1.5 text-xl font-bold text-ink-900">{plan.nombre}</h2>
            <p className="mt-1 text-[13px] text-ink-700">
              {metodoPredeterminado
                ? `${metodoPredeterminado.marca} ***${metodoPredeterminado.ultimosCuatro} | ${formatExpiracion(
                    metodoPredeterminado.mesExpiracion,
                    metodoPredeterminado.anioExpiracion,
                  )}`
                : 'Sin método de pago registrado'}
            </p>
          </div>
        </div>

        <div className="hidden w-px self-stretch bg-line-soft/70 sm:block" aria-hidden="true" />
        <div className="h-px bg-line-soft/70 sm:hidden" aria-hidden="true" />

        <div className="flex flex-1 flex-col justify-center gap-3">
          <div className="flex items-center gap-2.5">
            <CalendarDays className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Próxima renovación</p>
              <p className="text-[13.5px] font-semibold text-ink-900">{formatFecha(suscripcionSemilla.proximaRenovacion)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <Tag className="h-4 w-4 shrink-0 text-ink-500" aria-hidden="true" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Precio</p>
              <p className="text-[13.5px] font-semibold text-ink-900">{formatUSD(plan.precio)} / mes</p>
            </div>
          </div>
          <Button onClick={() => navigate('/app/plan/suscripcion')} className="w-fit">
            Administrar suscripción
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <section className="relative flex-1 overflow-hidden rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-base font-semibold text-ink-900">Beneficios de tu plan</h2>
          <ul className="mt-3 space-y-2">
            {plan.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
          <Trophy
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-3 -right-3 h-20 w-20 text-ink-300 opacity-15"
          />
        </section>
        <div className="flex flex-row gap-2.5 lg:w-56 lg:flex-col">
          <Button variant="outline" onClick={() => navigate('/app/plan/metodos-pago')} className="flex-1 justify-start gap-2 lg:flex-none">
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Actualizar tarjeta
          </Button>
          <Button variant="outline" onClick={() => navigate('/app/plan/historial-pagos')} className="flex-1 justify-start gap-2 lg:flex-none">
            <Receipt className="h-4 w-4" aria-hidden="true" />
            Historial de pagos
          </Button>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-base font-semibold text-ink-900">Módulos y límites</h2>
        <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
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
        <dl className="mt-3.5 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line-soft pt-3.5 sm:grid-cols-3">
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
