import { NavLink } from 'react-router-dom'
import safeLogoLight from '@/assets/safe-logo-light.png'
import { navItems, suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatFecha } from '@/portal/obligaciones/formato'
import { planPorCodigo } from '@/portal/plan/catalogo'

export function Sidebar() {
  const { planActivoCodigo } = usePortalData()
  const plan = planPorCodigo(planActivoCodigo)

  return (
    <nav
      aria-label="Navegación principal"
      className="hidden w-[252px] shrink-0 flex-col gap-0.5 border-r border-white/10 bg-navy-900 p-3 lg:flex"
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-4.5 pt-1">
        <img src={safeLogoLight} alt="SAFE" className="block h-7 w-auto" />
      </div>

      <div className="flex flex-col gap-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.path}
            className={({ isActive }) =>
              `flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-white/10 font-semibold text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <item.icon className="h-[19px] w-[19px] shrink-0" strokeWidth={1.7} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

      <div className="mt-auto border-t border-white/10 px-2.5 pb-1 pt-3.5 text-[11.5px] leading-relaxed text-white/70">
        <div className="font-semibold text-white">{plan.nombre}</div>
        <div>Se renueva el {formatFecha(suscripcionSemilla.proximaRenovacion)}</div>
      </div>
    </nav>
  )
}
