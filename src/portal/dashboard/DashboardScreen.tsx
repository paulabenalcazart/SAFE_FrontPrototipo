import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'

export function DashboardScreen() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de {'Textiles Andina S.A.'} hoy.
        </p>
      </div>
      {/* Botón temporal: se reemplaza por el AccountMenu del Topbar en el Task 6 */}
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/')
        }}
        className="w-fit rounded-lg border border-line bg-card px-4 py-2 text-sm font-semibold text-ink-700"
      >
        Cerrar sesión (temporal)
      </button>
    </section>
  )
}
