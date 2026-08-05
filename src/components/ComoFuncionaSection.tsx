import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'
import { WindowFrame } from '@/components/WindowFrame'
import { AmbientBackdrop } from '@/components/AmbientBackdrop'

function StepNumber({ n }: { n: number }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -top-2 left-0 select-none font-display text-[5.5rem] font-extrabold leading-none text-navy-500/25 sm:-top-3 sm:text-[7rem]"
    >
      {n}
    </span>
  )
}

function ComoStep({
  number,
  reverse,
  title,
  text,
  bullets,
  children,
}: {
  number: number
  reverse?: boolean
  title: string
  text: string
  bullets: string[]
  children: ReactNode
}) {
  const { ref, inView } = useReveal<HTMLDivElement>()

  return (
    <div ref={ref} className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={cn('relative', reverse ? 'lg:order-2' : 'lg:order-1')}>
        <StepNumber n={number} />
        <div className={cn('relative pt-8', inView ? 'animate-safe-fade-up' : 'opacity-0')}>
          <h3 className="font-display text-2xl font-semibold text-navy-900">{title}</h3>
          <p className="mt-3 text-base leading-relaxed text-ink-700">{text}</p>
          <ul className="mt-5 flex flex-col gap-2.5">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-center gap-2.5 text-sm text-ink-900">
                <Check className="h-4 w-4 shrink-0 text-emerald-brand" />
                {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div
        className={cn(
          reverse ? 'lg:order-1' : 'lg:order-2',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
        style={inView ? { animationDelay: '140ms' } : undefined}
      >
        {children}
      </div>
    </div>
  )
}

const wizardDots = ['bg-navy-500', 'bg-navy-500', 'bg-line']

const empresaFields = ['Comercial Andina S.A.', 'RUC: 1792146739001', 'Comercio al por menor']

const uploadRows = [
  { name: 'Factura_0568.pdf', pct: 100, tone: 'bg-emerald-brand' },
  { name: 'Retenciones_julio.xlsx', pct: 72, tone: 'bg-navy-500' },
  { name: 'Comprobante_pago.pdf', pct: 45, tone: 'bg-navy-500' },
]

const obligacionRows = [
  { titulo: 'IVA · agosto 2026', periodo: 'Vence en 5 días', estado: 'Pendiente', tono: 'warning' as const },
  { titulo: 'Retenciones · agosto 2026', periodo: 'Presentado', estado: 'Al día', tono: 'positive' as const },
  { titulo: 'Impuesto a la renta · anual', periodo: 'Vence en 20 días', estado: 'Pendiente', tono: 'warning' as const },
]

const panelChartBars = [42, 55, 38, 64, 72, 88]

export function ComoFuncionaSection() {
  const { ref, inView } = useReveal<HTMLDivElement>()

  return (
    <section className="relative w-full overflow-hidden">
      <AmbientBackdrop />
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:py-28">
        <div ref={ref} className="mx-auto max-w-xl text-center">
          <h2
            className={cn(
              'font-display text-3xl font-semibold text-navy-900 sm:text-4xl',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
          >
            ¿Cómo funciona SAFE?
          </h2>
          <p
            className={cn(
              'mt-3 text-base leading-relaxed text-ink-700',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '80ms' } : undefined}
          >
            Desde el primer día, tu empresa tiene un panel completo de finanzas, impuestos y
            trámites legales — así se ve por dentro.
          </p>
        </div>

        <div className="mt-20 flex flex-col gap-24 sm:gap-28">
          <ComoStep
            number={1}
            title="Crea tu empresa"
            text="Regístrate y registra los datos básicos de tu negocio en minutos, sin papeleo ni visitas presenciales."
            bullets={[
              'Registro guiado paso a paso',
              'Sin costo de configuración',
              'Listo para usar en menos de 10 minutos',
            ]}
          >
            <WindowFrame title="Crear empresa — SAFE">
              <div className="mb-6 flex items-center gap-2.5">
                {wizardDots.map((tone, i) => (
                  <span key={i} className={cn('h-1.5 w-6 rounded-full', tone)} />
                ))}
              </div>
              <p className="text-sm font-semibold text-ink-900">Datos de tu empresa</p>
              <div className="mt-4 flex flex-col gap-3">
                {empresaFields.map((field) => (
                  <div
                    key={field}
                    className="rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink-500"
                  >
                    {field}
                  </div>
                ))}
              </div>
              <div className="mt-5 flex h-10 items-center justify-center rounded-lg bg-navy-900 text-sm font-semibold text-white">
                Continuar
              </div>
            </WindowFrame>
          </ComoStep>

          <ComoStep
            number={2}
            reverse
            title="Sube tus documentos"
            text="Comprobantes y datos contables se organizan automáticamente — sin hojas de cálculo."
            bullets={[
              'Lectura automática de facturas',
              'Clasificación contable sin esfuerzo',
              'Respaldo seguro en la nube',
            ]}
          >
            <WindowFrame title="Documentos — SAFE">
              <p className="text-sm font-semibold text-ink-900">Cargar comprobantes</p>
              <div className="mt-4 flex flex-col gap-4">
                {uploadRows.map((row) => (
                  <div key={row.name}>
                    <div className="mb-1.5 flex justify-between text-xs text-ink-500">
                      <span className="truncate pr-2 text-ink-700">{row.name}</span>
                      <span className="num shrink-0">{row.pct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <div
                        className={cn('h-full rounded-full', row.tone)}
                        style={{ width: `${row.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </WindowFrame>
          </ComoStep>

          <ComoStep
            number={3}
            title="SAFE calcula y avisa"
            text="Impuestos, indicadores y vencimientos listos, con alertas antes de cada fecha límite."
            bullets={[
              'Calendario de obligaciones al SRI',
              'Alertas antes de cada vencimiento',
              'Cálculos siempre actualizados',
            ]}
          >
            <WindowFrame title="Obligaciones — SAFE">
              <p className="text-sm font-semibold text-ink-900">Próximas obligaciones</p>
              <div className="mt-4 flex flex-col gap-2.5">
                {obligacionRows.map((row) => (
                  <div
                    key={row.titulo}
                    className="flex items-center justify-between rounded-lg border border-line bg-surface px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink-900">{row.titulo}</p>
                      <p className="text-xs text-ink-500">{row.periodo}</p>
                    </div>
                    <span
                      className={cn(
                        'ml-3 shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold',
                        row.tono === 'positive'
                          ? 'bg-emerald-soft text-emerald-deep'
                          : 'bg-amber-soft text-amber-deep',
                      )}
                    >
                      {row.estado}
                    </span>
                  </div>
                ))}
              </div>
            </WindowFrame>
          </ComoStep>

          <ComoStep
            number={4}
            reverse
            title="Decide con datos"
            text="Usa el simulador y los reportes para tomar mejores decisiones para tu negocio."
            bullets={[
              'Indicadores financieros en tiempo real',
              'Simulador de escenarios',
              'Reportes listos para compartir',
            ]}
          >
            <WindowFrame title="Panel de empresa — SAFE">
              <p className="text-sm font-semibold text-ink-900">Hola, María</p>
              <p className="text-xs text-ink-500">Comercial Andina S.A. · hoy, 4 de agosto de 2026</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-line bg-surface p-3">
                  <p className="num text-lg font-bold text-ink-900">$42.180</p>
                  <p className="text-xs text-ink-500">Ingresos del mes</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-deep">+12% vs mes anterior</p>
                </div>
                <div className="rounded-lg border border-line bg-surface p-3">
                  <p className="num text-lg font-bold text-ink-900">2</p>
                  <p className="text-xs text-ink-500">Obligaciones pendientes</p>
                  <p className="mt-0.5 text-xs font-medium text-amber-deep">1 vence en 3 días</p>
                </div>
              </div>
              <div className="mt-4 flex h-16 items-end gap-1.5">
                {panelChartBars.map((h, i) => (
                  <span key={i} className="flex-1 rounded-t bg-navy-500/80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </WindowFrame>
          </ComoStep>
        </div>
      </div>
    </section>
  )
}
