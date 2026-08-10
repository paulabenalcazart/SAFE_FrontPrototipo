import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePortalData } from '@/portal/PortalDataContext'
import type { MetodoPago } from '@/portal/types'
import { parseExpiracion, validarNuevoMetodo } from './calculo'
import { formatExpiracion } from './formato'
import { useAccessibleDialog } from './useAccessibleDialog'

type Props =
  | { modo: 'agregar'; metodo?: undefined; abierto: boolean; onCerrar: () => void }
  | { modo: 'editar'; metodo: MetodoPago; abierto: boolean; onCerrar: () => void }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  )
}

export function MetodoPagoModal({ modo, metodo, abierto, onCerrar }: Props) {
  const { agregarMetodoPago, editarExpiracionMetodoPago } = usePortalData()
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  const [expiracion, setExpiracion] = useState(
    modo === 'editar' ? formatExpiracion(metodo.mesExpiracion, metodo.anioExpiracion) : '',
  )
  const [cvc, setCvc] = useState('')
  const [errores, setErrores] = useState<{ numeroTarjeta?: string; expiracion?: string; cvc?: string }>({})

  if (!abierto) return null

  const guardar = () => {
    if (modo === 'editar') {
      const resultado = parseExpiracion(expiracion)
      if (resultado.error || resultado.mes === null || resultado.anio === null) {
        setErrores({ expiracion: resultado.error })
        return
      }
      editarExpiracionMetodoPago(metodo.id, resultado.mes, resultado.anio)
      onCerrar()
      return
    }

    const resultado = validarNuevoMetodo({ numeroTarjeta, expiracion, cvc })
    if (
      Object.keys(resultado.errores).length > 0 ||
      resultado.mesExpiracion === null ||
      resultado.anioExpiracion === null
    ) {
      setErrores(resultado.errores)
      return
    }

    agregarMetodoPago({
      numeroTarjeta,
      mesExpiracion: resultado.mesExpiracion,
      anioExpiracion: resultado.anioExpiracion,
    })
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="metodo-pago-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[420px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="metodo-pago-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            {modo === 'editar' ? 'Editar expiración de la tarjeta' : 'Agregar método de pago'}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {modo === 'agregar' && (
            <div>
              <Label htmlFor="mp-numero">Número de tarjeta</Label>
              <Input
                id="mp-numero"
                value={numeroTarjeta}
                onChange={(e) => setNumeroTarjeta(e.target.value)}
                placeholder="4111 1111 1111 1111"
                className="mt-1.5"
              />
              <FieldError message={errores.numeroTarjeta} />
            </div>
          )}
          <div>
            <Label htmlFor="mp-expiracion">Expiración</Label>
            <Input
              id="mp-expiracion"
              value={expiracion}
              onChange={(e) => setExpiracion(e.target.value)}
              placeholder="MM/AA"
              className="mt-1.5"
            />
            <FieldError message={errores.expiracion} />
          </div>
          {modo === 'agregar' && (
            <div>
              <Label htmlFor="mp-cvc">CVC</Label>
              <Input
                id="mp-cvc"
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="mt-1.5"
              />
              <FieldError message={errores.cvc} />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}
