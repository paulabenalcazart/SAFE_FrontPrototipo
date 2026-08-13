import { NavLink } from 'react-router-dom'
import safeLogoLight from '@/assets/safe-logo-light.png'
import { useAuth } from '@/auth/AuthContext'
import { navItemsParaRol } from '@/portal/navigation'

export function Sidebar() {
  const { user } = useAuth()
  const navItems = user ? navItemsParaRol(user.role) : []

  return (
    <nav
      aria-label="Navegación principal"
      className="sticky top-0 hidden h-screen h-dvh w-[252px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-navy-900 p-3 lg:flex"
    >
      <div className="flex items-center gap-2.5 px-2.5 pb-4.5 pt-1">
        <img src={safeLogoLight} alt="SAFE" className="block h-7 w-auto" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-0.5">
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

    </nav>
  )
}
