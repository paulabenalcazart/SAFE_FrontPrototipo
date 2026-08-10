import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import type { MetodoPago } from '@/portal/types'
import { formatExpiracion } from './formato'
import { MetodoPagoModal } from './MetodoPagoModal'

export function MetodosPagoScreen() {
  const navigate = useNavigate()
  const { metodosPago, hacerMetodoPredeterminado, eliminarMetodoPago } = usePortalData()
  const [modal, setModal] = useState<{ modo: 'agregar' } | { modo: 'editar'; metodo: MetodoPago } | null>(
    null,
  )
  const [errorEliminar, setErrorEliminar] = useState('')

  const eliminar = (id: string) => {
    const ok = eliminarMetodoPago(id)
    setErrorEliminar(ok ? '' : 'No puedes eliminar tu único método de pago.')
  }

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
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3.5">
          <h1 className="text-2xl font-bold text-ink-900">Métodos de pago</h1>
          <Button onClick={() => setModal({ modo: 'agregar' })}>Agregar método</Button>
        </div>
      </div>

      {errorEliminar && (
        <p role="alert" className="text-[13px] font-semibold text-destructive">
          {errorEliminar}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {metodosPago.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="num text-[15px] font-bold text-ink-900">
                {m.marca} ···· {m.ultimosCuatro}
              </strong>
              {m.predeterminado && (
                <span className="rounded-full bg-emerald-soft px-2.5 py-0.5 text-[11px] font-semibold text-emerald-deep">
                  Predeterminado
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-ink-700">
              {m.tipo} · {formatExpiracion(m.mesExpiracion, m.anioExpiracion)} · {m.estado}
            </p>
            <p className="text-[11.5px] text-ink-500">
              Gateway mock SAFE · el token del proveedor nunca se muestra
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setModal({ modo: 'editar', metodo: m })}>
                Editar expiración
              </Button>
              {!m.predeterminado && (
                <Button variant="outline" size="sm" onClick={() => hacerMetodoPredeterminado(m.id)}>
                  Hacer predeterminado
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-danger-soft"
                onClick={() => eliminar(m.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modal?.modo === 'agregar' && (
        <MetodoPagoModal modo="agregar" abierto onCerrar={() => setModal(null)} />
      )}
      {modal?.modo === 'editar' && (
        <MetodoPagoModal modo="editar" metodo={modal.metodo} abierto onCerrar={() => setModal(null)} />
      )}
    </div>
  )
}
