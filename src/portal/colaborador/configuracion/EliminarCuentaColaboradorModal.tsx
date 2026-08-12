import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { useAccessibleDialog } from '@/portal/plan/useAccessibleDialog'

const TEXTO_CONFIRMACION = 'ELIMINAR'

export function EliminarCuentaColaboradorModal({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { desactivarCuentaColaborador } = usePortalData()
  const [texto, setTexto] = useState('')
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const confirmado = texto === TEXTO_CONFIRMACION

  const handleConfirmar = () => {
    if (!confirmado) return
    desactivarCuentaColaborador()
    onCerrar()
    logout()
    navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={(event) => {
          event.preventDefault()
          onCerrar()
        }}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="eliminar-cuenta-title"
        className="animate-safe-pop-in relative w-full max-w-[460px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="eliminar-cuenta-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Eliminar cuenta
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
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          Se marcará tu cuenta profesional como inactiva y dejará de ser visible en el Marketplace. Tu
          historial de solicitudes, citas y reseñas se conserva. Escribe <strong>ELIMINAR</strong> para
          confirmar.
        </p>
        <div className="mt-4">
          <Label htmlFor="eliminar-texto">Escribe ELIMINAR</Label>
          <Input
            id="eliminar-texto"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="ELIMINAR"
            className="mt-1.5"
          />
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variant="destructive" disabled={!confirmado} onClick={handleConfirmar}>
            Eliminar cuenta
          </Button>
        </div>
      </div>
    </div>
  )
}
