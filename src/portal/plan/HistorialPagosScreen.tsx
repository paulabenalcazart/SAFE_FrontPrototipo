import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, CreditCard } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'
import { planPorCodigo } from './catalogo'
import { paginarPagos } from './calculo'
import { formatExpiracion } from './formato'

export function HistorialPagosScreen() {
  const navigate = useNavigate()
  const { historialPagos, metodosPago, planActivoCodigo } = usePortalData()
  const metodoPredeterminado = metodosPago.find((m) => m.predeterminado)
  const plan = planPorCodigo(planActivoCodigo)
  const [pagina, setPagina] = useState(1)
  const [abierto, setAbierto] = useState<string | null>(null)

  const { items, totalPaginas, pagina: paginaActual } = paginarPagos({
    pagos: historialPagos,
    paginaSolicitada: pagina,
  })

  // El primer pago de cada página aparece desplegado por defecto, para que el
  // usuario intuya que las filas son interactivas.
  useEffect(() => {
    setAbierto(items[0]?.id ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paginaActual])

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Historial de pagos</h1>
      </div>

      <Card as="section" padding="lg">
        <p className="text-[12.5px] font-semibold text-ink-500">Tu próximo pago</p>
        <p className="mt-1.5 text-[15px] font-semibold text-ink-900">
          <span className="num text-xl font-bold text-navy-600">{formatUSD(plan.precio)}</span>
          {' '}el {formatFecha(suscripcionSemilla.proximaRenovacion)}
        </p>
        {metodoPredeterminado && (
          <div className="mt-3 flex items-center gap-2.5 text-[13px] text-ink-700">
            <CreditCard className="h-4.5 w-4.5 shrink-0 text-ink-500" aria-hidden="true" />
            {metodoPredeterminado.marca} ***{metodoPredeterminado.ultimosCuatro} ·{' '}
            {formatExpiracion(metodoPredeterminado.mesExpiracion, metodoPredeterminado.anioExpiracion)}
          </div>
        )}
        <div className="mt-3.5 border-t border-line-soft pt-3.5">
          <button
            type="button"
            onClick={() => navigate('/app/plan/metodos-pago')}
            className="text-[13px] font-semibold text-navy-600"
          >
            Cambiar método de pago
          </button>
        </div>
      </Card>

      {items.length === 0 ? (
        <p className="text-sm text-ink-700">Sin pagos registrados.</p>
      ) : (
        <section className="overflow-hidden rounded-xl border border-line bg-card">
          {items.map((pago) => {
            const expandido = abierto === pago.id
            return (
              <div key={pago.id} className="border-b border-line-soft last:border-b-0">
                <button
                  type="button"
                  onClick={() => setAbierto(expandido ? null : pago.id)}
                  aria-expanded={expandido}
                  className="flex min-h-14 w-full flex-wrap items-center gap-3 px-4.5 py-3.5 text-left"
                >
                  <span className="num w-[100px] shrink-0 text-[13.5px] font-semibold text-ink-900">
                    {formatFecha(pago.fecha)}
                  </span>
                  <span className="num text-sm font-bold text-ink-900">{formatUSD(pago.monto)}</span>
                  <Badge
                    className={
                      pago.estado === 'PAGADO'
                        ? 'bg-emerald-soft text-emerald-deep'
                        : 'bg-danger-soft text-destructive'
                    }
                  >
                    {pago.estado}
                  </Badge>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 text-ink-500 transition-transform ${
                      expandido ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {expandido && (
                  <dl className="grid grid-cols-1 gap-2.5 px-4.5 pb-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Proveedor</dt>
                      <dd className="text-[13px] text-ink-900">{pago.proveedor}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Referencia</dt>
                      <dd className="text-[13px] text-ink-900">{pago.referencia}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Factura</dt>
                      <dd className="text-[13px] text-ink-900">{pago.factura ?? 'Sin factura'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Plan relacionado</dt>
                      <dd className="text-[13px] text-ink-900">{pago.planNombre}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Mensaje</dt>
                      <dd className="text-[13px] text-ink-900">{pago.mensaje ?? '--'}</dd>
                    </div>
                  </dl>
                )}
              </div>
            )
          })}
        </section>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === paginaActual ? 'page' : undefined}
              className={`num grid h-9.5 min-w-9.5 place-items-center rounded-lg text-[12.5px] font-semibold ${
                n === paginaActual
                  ? 'bg-navy-600 text-white'
                  : 'border border-line bg-card text-ink-700 hover:bg-surface'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
