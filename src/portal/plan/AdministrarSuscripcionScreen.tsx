import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
import { planPorCodigo } from './catalogo'
import { CancelarSuscripcionModal } from './CancelarSuscripcionModal'

export function AdministrarSuscripcionScreen() {
  const navigate = useNavigate()
  const { planActivoCodigo, renovacionAutomatica, toggleRenovacionAutomatica, suscripcionCancelada } =
    usePortalData()
  const [modalAbierto, setModalAbierto] = useState(false)
  const plan = planPorCodigo(planActivoCodigo)

  const campos: { label: string; valor: string }[] = [
    { label: 'Plan', valor: plan.nombre },
    { label: 'Código', valor: plan.codigo },
    { label: 'Descripción', valor: `Suscripción mensual al ${plan.nombre} de SAFE.` },
    { label: 'Precio', valor: formatUSD(plan.precio) },
    { label: 'Moneda', valor: 'USD' },
    { label: 'Periodo de prueba', valor: 'No aplica' },
    { label: 'Soporte', valor: plan.soporte },
    { label: 'Estado', valor: suscripcionCancelada ? 'CANCELADA' : 'ACTIVA' },
    { label: 'Inicio', valor: formatFecha(suscripcionSemilla.fechaInicio) },
    { label: 'Fin del periodo', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Próxima renovación', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Renovación automática', valor: renovacionAutomatica ? 'Activada' : 'Desactivada' },
    { label: 'Cancelación', valor: suscripcionCancelada ? 'Solicitada' : 'Sin solicitudes' },
  ]

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
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Administrar suscripción</h1>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {campos.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1 text-[13.5px] text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4.5 flex flex-wrap gap-2.5 border-t border-line-soft pt-4">
          <Button onClick={() => navigate('/app/plan/cambiar')} disabled={suscripcionCancelada}>
            Cambiar plan
          </Button>
          <Button variant="outline" onClick={toggleRenovacionAutomatica} disabled={suscripcionCancelada}>
            {renovacionAutomatica ? 'Desactivar renovación automática' : 'Activar renovación automática'}
          </Button>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-danger-soft"
            onClick={() => setModalAbierto(true)}
            disabled={suscripcionCancelada}
          >
            Cancelar suscripción
          </Button>
        </div>
        {suscripcionCancelada && (
          <p className="mt-3 text-[13px] text-ink-700">
            Tu suscripción fue cancelada. Conservas el acceso hasta el{' '}
            {formatFecha(suscripcionSemilla.proximaRenovacion)}.
          </p>
        )}
      </section>

      <CancelarSuscripcionModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
    </div>
  )
}
