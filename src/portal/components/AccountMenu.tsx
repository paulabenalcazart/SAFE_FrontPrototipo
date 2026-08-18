import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export function AccountMenu({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <div
      role="menu"
      className="animate-safe-fade-in absolute right-0 top-[calc(100%+8px)] z-30 w-64 rounded-xl border border-line bg-card p-1.5 shadow-[var(--shadow-float)]"
    >
      <div className="mb-1 border-b border-line/70 px-2.5 pb-2.5 pt-2">
        <div className="text-[13.5px] font-semibold text-ink-900">
          {user.nombres} {user.apellidos}
        </div>
        <div className="break-all text-[12px] text-ink-500">{user.correo}</div>
      </div>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          navigate('/app/configuracion/cuenta')
        }}
        className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-ink-900 hover:bg-surface"
      >
        Mi cuenta
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          navigate('/')
        }}
        className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-ink-900 hover:bg-surface"
      >
        Volver a inicio
      </button>
      <button
        type="button"
        role="menuitem"
        onClick={() => {
          onClose()
          logout()
          navigate('/')
        }}
        className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-destructive hover:bg-surface"
      >
        Cerrar sesión
      </button>
    </div>
  )
}
