# Portal Privado — Fase 1 (Shell + Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrar el sitio a react-router-dom, agregar una sesión mock, y construir el shell del portal privado (sidebar + topbar) con la pantalla de Dashboard, con datos mock, siguiendo el mockup `SAFE Portal Privado.dc.html`.

**Architecture:** `BrowserRouter` en `main.tsx` envuelve toda la app. `App.tsx` define un único árbol `<Routes>`: rutas públicas (`/`, `/planes`, ...) y de auth (`/login`, `/signup`, `/recuperar`) siguen usando los componentes de página existentes; `/app/*` es una rama nueva protegida por `<RequireAuth>` que renderiza `<PortalLayout>` (sidebar + topbar + `<Outlet>`) con `<DashboardScreen>` como primera pantalla hija. Un `AuthContext` mock (sin backend) guarda `{nombre, correo, iniciales}` en `localStorage`. Todo el contenido del portal viene de un módulo de datos estático tipado (`src/portal/data/mock-portal-data.ts`).

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4 (tokens en `src/index.css`), `react-router-dom` v6 (nuevo), `lucide-react` (ya instalado) para íconos.

## Global Constraints

- Prototipo **solo frontend**, sin backend ni API real — todo el contenido es mock estático (spec: "no hay backend ni API real").
- Reusar los tokens de color existentes en `src/index.css` (`--color-navy-*`, `--color-emerald-*`, `--color-amber-*`, `--color-ink-*`, `--color-line`, `--color-surface`, `--color-destructive`); no duplicar tokens `--sf-*` del archivo de diseño.
- La migración a `react-router-dom` cubre **todo** el sitio (público + auth + portal privado), no solo `/app`.
- Auth mock vía Context + `localStorage`; `<RequireAuth>` protege todas las rutas `/app/*` redirigiendo a `/login` si no hay sesión.
- El Dashboard arranca con una **empresa activa con datos** (no el estado "sin empresa"/tour).
- El repo no tiene test runner ni eslint configurado — verificación via `npm run build` (type-check) + revisión manual en `npm run dev`. No agregar frameworks de testing en esta fase.
- Íconos con `lucide-react` (dependencia existente); logos ya descargados en `src/assets/safe-logo-dark.png` y `src/assets/safe-logo-light.png`.
- Copys en español, dominio tributario/financiero ecuatoriano (SRI, IVA, Impuesto a la Renta, RUC).

---

## File Structure

```
src/
├── main.tsx                          # Modify: BrowserRouter + AuthProvider
├── App.tsx                           # Modify: rutas públicas/auth (Task 2), rutas /app (Task 4)
├── index.css                         # Modify: token --color-danger-soft (Task 3)
├── auth/
│   ├── AuthContext.tsx               # Create (Task 4)
│   └── RequireAuth.tsx               # Create (Task 4)
├── assets/
│   ├── safe-logo-dark.png            # Ya existe (descargado del proyecto de diseño)
│   └── safe-logo-light.png           # Ya existe
└── portal/
    ├── types.ts                      # Create (Task 3)
    ├── tone.ts                       # Create (Task 3)
    ├── PortalLayout.tsx              # Create (Task 4), Modify (Task 5, Task 6)
    ├── data/
    │   └── mock-portal-data.ts       # Create (Task 3)
    ├── components/
    │   ├── Sidebar.tsx                # Create (Task 5)
    │   ├── Topbar.tsx                 # Create (Task 6)
    │   ├── CompanySwitcher.tsx        # Create (Task 6)
    │   ├── NotificationsPanel.tsx     # Create (Task 6)
    │   ├── AccountMenu.tsx            # Create (Task 6)
    │   └── KpiCard.tsx                # Create (Task 7)
    └── dashboard/
        ├── DashboardScreen.tsx        # Create (Task 4), Modify (Task 6, 7, 8, 9)
        ├── FinancialChart.tsx         # Create (Task 8)
        ├── IndicatorsTable.tsx        # Create (Task 9)
        └── ObligationsTable.tsx       # Create (Task 9)
```

`portal/` se separa de `components/` (sitio público) porque son productos distintos. Cada tabla/gráfico del dashboard es su propio archivo porque se reutilizarán en fases futuras (Financiero, Indicadores) con más datos y variantes.

---

### Task 1: Instalar react-router-dom y envolver la app en BrowserRouter

**Files:**
- Modify: `package.json` (via `npm install`)
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `BrowserRouter` disponible en todo el árbol de React para las siguientes tasks.

- [ ] **Step 1: Instalar la dependencia**

```bash
npm install react-router-dom@^6.26.0
```

- [ ] **Step 2: Envolver `<App />` en `<BrowserRouter>`**

Reemplazar el contenido completo de `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 3: Verificar que la app sigue funcionando igual que antes**

Run: `npm run dev`

Expected: la app carga en `http://localhost:5173` sin errores en consola. Como `App.tsx` todavía usa `useState<Page>` (no se ha tocado), la landing debe verse y navegar exactamente igual que antes de este cambio.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/main.tsx
git commit -m "feat: agregar react-router-dom y envolver la app en BrowserRouter"
```

---

### Task 2: Migrar App.tsx a rutas reales (sitio público + auth)

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: componentes de página existentes (`Hero`, `LoginPage`, `SignupPage`, etc.) con las mismas props que ya tienen hoy — no se modifican esos archivos.
- Produces: `NAV_KEY_TO_PATH` (mapa de keys de página a paths) reutilizado en Task 4 para agregar la rama `/app`.

- [ ] **Step 1: Reemplazar `src/App.tsx` completo**

```tsx
import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { ComoFuncionaSection } from './components/ComoFuncionaSection'
import { FeatureHighlightsSection } from './components/FeatureHighlightsSection'
import { ModulesSection } from './components/ModulesSection'
import { PlansSection } from './components/PlansSection'
import { PlanesPage } from './components/PlanesPage'
import { AcercaDePage } from './components/AcercaDePage'
import { ReasonsSection } from './components/ReasonsSection'
import { TrabajaConSafePage } from './components/TrabajaConSafePage'
import { PostulacionPage } from './components/PostulacionPage'
import { LoginPage } from './components/LoginPage'
import { ForgotPasswordPage } from './components/ForgotPasswordPage'
import { SignupPage } from './components/SignupPage'
import { ContactoPage } from './components/ContactoPage'
import { TerminosPage } from './components/TerminosPage'
import { PrivacidadPage } from './components/PrivacidadPage'
import { Footer } from './components/Footer'

export const NAV_KEY_TO_PATH: Record<string, string> = {
  inicio: '/',
  como: '/como-funciona',
  planes: '/planes',
  acerca: '/acerca',
  trabaja: '/trabaja-con-safe',
  postulacion: '/postulacion',
  login: '/login',
  recuperar: '/recuperar',
  signup: '/signup',
  contacto: '/contacto',
  terminos: '/terminos',
  privacidad: '/privacidad',
}

const PATH_TO_NAV_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_KEY_TO_PATH).map(([key, path]) => [path, key]),
)

function PublicLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const activePage = PATH_TO_NAV_KEY[location.pathname] ?? 'inicio'
  const isAuthPage = activePage === 'login' || activePage === 'recuperar' || activePage === 'signup'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  const handleNavigate = (key: string) => {
    const path = NAV_KEY_TO_PATH[key]
    if (path) navigate(path)
  }

  const goToPlanes = () => handleNavigate('planes')
  const goToPostulacion = () => handleNavigate('postulacion')

  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      {!isAuthPage && <Navbar activePage={activePage} onNavigate={handleNavigate} />}
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Hero onVerPlanes={goToPlanes} />
              <div className="view-tint relative">
                <FeatureHighlightsSection />
                <ModulesSection />
                <PlansSection onVerPlanes={goToPlanes} />
                <ReasonsSection />
              </div>
            </>
          }
        />
        <Route path="/como-funciona" element={<ComoFuncionaSection />} />
        <Route path="/planes" element={<PlanesPage />} />
        <Route path="/acerca" element={<AcercaDePage />} />
        <Route path="/trabaja-con-safe" element={<TrabajaConSafePage onPostular={goToPostulacion} />} />
        <Route
          path="/postulacion"
          element={
            <PostulacionPage
              onVolver={() => handleNavigate('inicio')}
              onIrPrivacidad={() => handleNavigate('privacidad')}
            />
          }
        />
        <Route
          path="/contacto"
          element={<ContactoPage onIrPrivacidad={() => handleNavigate('privacidad')} />}
        />
        <Route path="/terminos" element={<TerminosPage />} />
        <Route path="/privacidad" element={<PrivacidadPage />} />
        <Route
          path="/login"
          element={
            <LoginPage
              onIngresar={() => handleNavigate('inicio')}
              onRecuperar={() => handleNavigate('recuperar')}
              onIrInicio={() => handleNavigate('inicio')}
              onIrCrearCuenta={() => handleNavigate('signup')}
            />
          }
        />
        <Route
          path="/recuperar"
          element={
            <ForgotPasswordPage
              onVolver={() => handleNavigate('login')}
              onIrInicio={() => handleNavigate('inicio')}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignupPage
              onCrearCuenta={() => handleNavigate('inicio')}
              onIrLogin={() => handleNavigate('login')}
              onIrInicio={() => handleNavigate('inicio')}
              onIrTerminos={() => handleNavigate('terminos')}
              onIrPrivacidad={() => handleNavigate('privacidad')}
            />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!isAuthPage && <Footer onNavigate={handleNavigate} />}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/*" element={<PublicLayout />} />
    </Routes>
  )
}
```

Nota: por ahora `onIngresar` y `onCrearCuenta` solo navegan a `inicio` (comportamiento temporal idéntico al actual). Se conectan a la sesión mock real en el Task 4.

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Verificación manual en el navegador**

Run: `npm run dev`, abrir `http://localhost:5173` y:
- Confirmar que la URL cambia al navegar (`/planes`, `/acerca`, `/trabaja-con-safe`, `/contacto`, `/login`, `/signup`, `/recuperar`, etc.) usando el Navbar y los botones de las páginas.
- Confirmar que el botón "atrás" del navegador funciona (vuelve a la página anterior).
- Recargar la página en `/planes` y confirmar que carga directo esa página (no un 404 de Vite — el dev server de Vite ya sirve `index.html` para cualquier ruta por defecto).

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: migrar navegacion publica y de auth a react-router-dom"
```

---

### Task 3: Tokens de diseño + capa de datos mock del portal

**Files:**
- Modify: `src/index.css`
- Create: `src/portal/types.ts`
- Create: `src/portal/tone.ts`
- Create: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Produces: tipos `Empresa`, `Tono`, `Kpi`, `Indicador`, `Obligacion`, `Notificacion`, `NavItem`, `ChartSeriesPoint` (en `types.ts`); `TONE_BADGE_CLASSES: Record<Tono, string>` y `TONE_DOT_CLASSES: Record<Tono, string>` (en `tone.ts`); `empresaActiva`, `empresasDisponibles`, `navItems`, `planInfo`, `kpis`, `indicadores`, `obligaciones`, `notificaciones`, `chartSeries` (en `mock-portal-data.ts`) — usados por todas las tasks siguientes.

- [ ] **Step 1: Agregar el token `danger-soft` a `src/index.css`**

En el bloque `@theme inline { ... }` (alrededor de la línea 55, junto a `--color-amber-soft`), agregar:

```css
  --color-danger-soft: var(--safe-danger-soft);
```

En el bloque `:root { ... }` (alrededor de la línea 99, junto a `--safe-danger`), agregar:

```css
  --safe-danger-soft: oklch(0.95 0.032 22);
```

- [ ] **Step 2: Crear `src/portal/types.ts`**

```tsx
import type { LucideIcon } from 'lucide-react'

export type Tono = 'positivo' | 'atencion' | 'critico' | 'neutro'

export type Empresa = {
  id: string
  nombre: string
  ruc: string
  iniciales: string
}

export type Kpi = {
  id: string
  titulo: string
  valor: string
  sub: string
  icon: LucideIcon
  badge?: { texto: string; tono: Tono }
}

export type Indicador = {
  id: string
  nombre: string
  valor: string
  unidad: string
  tendencia: 'up' | 'down'
  estado: string
  tono: Tono
}

export type Obligacion = {
  id: string
  nombre: string
  periodo: string
  vence: string
  monto: string
  estado: string
  tono: Tono
}

export type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

export type NavItem = {
  key: string
  label: string
  path: string
  icon: LucideIcon
}

export type ChartSeriesPoint = {
  label: string
  ingresos: number
  gastos: number
  utilidad: number
}
```

- [ ] **Step 3: Crear `src/portal/tone.ts`**

```tsx
import type { Tono } from './types'

export const TONE_BADGE_CLASSES: Record<Tono, string> = {
  positivo: 'bg-emerald-soft text-emerald-deep',
  atencion: 'bg-amber-soft text-amber-deep',
  critico: 'bg-danger-soft text-destructive',
  neutro: 'bg-surface text-ink-700',
}

export const TONE_DOT_CLASSES: Record<Tono, string> = {
  positivo: 'bg-emerald-brand',
  atencion: 'bg-amber-brand',
  critico: 'bg-destructive',
  neutro: 'bg-ink-500',
}
```

- [ ] **Step 4: Crear `src/portal/data/mock-portal-data.ts`**

```tsx
import {
  Building2,
  CalendarClock,
  Calculator,
  CreditCard,
  Gauge,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type {
  ChartSeriesPoint,
  Empresa,
  Indicador,
  Kpi,
  NavItem,
  Notificacion,
  Obligacion,
} from '../types'

export const empresaActiva: Empresa = {
  id: 'emp-1',
  nombre: 'Textiles Andina S.A.',
  ruc: '1792146739001',
  iniciales: 'TA',
}

export const empresasDisponibles: Empresa[] = [
  empresaActiva,
  { id: 'emp-2', nombre: 'Comercial del Valle Cía. Ltda.', ruc: '0992345678001', iniciales: 'CV' },
]

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { key: 'empresa', label: 'Mi Empresa', path: '/app/empresa', icon: Building2 },
  { key: 'financiero', label: 'Financiero', path: '/app/financiero', icon: LineChart },
  { key: 'indicadores', label: 'Indicadores', path: '/app/indicadores', icon: Gauge },
  { key: 'obligaciones', label: 'Obligaciones', path: '/app/obligaciones', icon: Landmark },
  { key: 'simulador', label: 'Simulador', path: '/app/simulador', icon: Calculator },
  { key: 'marketplace', label: 'Marketplace', path: '/app/marketplace', icon: Store },
  { key: 'plan', label: 'Plan', path: '/app/plan', icon: CreditCard },
  { key: 'configuracion', label: 'Configuración', path: '/app/configuracion', icon: Settings },
]

export const planInfo = {
  nombre: 'Plan Crecimiento',
  renovacion: 'Se renueva el 14 de sep. 2026',
}

export const kpis: Kpi[] = [
  {
    id: 'ingresos',
    titulo: 'Ingresos del mes',
    valor: '$48.230',
    sub: 'vs. mes anterior',
    icon: Wallet,
    badge: { texto: '+8,4%', tono: 'positivo' },
  },
  {
    id: 'obligaciones',
    titulo: 'Obligaciones al día',
    valor: '6 / 7',
    sub: '1 próxima a vencer',
    icon: ShieldCheck,
    badge: { texto: 'Atención', tono: 'atencion' },
  },
  {
    id: 'capital',
    titulo: 'Capital de trabajo',
    valor: '$112.540',
    sub: 'liquidez disponible',
    icon: TrendingUp,
  },
  {
    id: 'vencimiento',
    titulo: 'Próximo vencimiento',
    valor: '18 ago',
    sub: 'Declaración de IVA',
    icon: CalendarClock,
    badge: { texto: '5 días', tono: 'atencion' },
  },
]

export const indicadores: Indicador[] = [
  { id: 'liquidez', nombre: 'Liquidez corriente', valor: '1,8', unidad: 'veces', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
  { id: 'endeudamiento', nombre: 'Endeudamiento total', valor: '42', unidad: '%', tendencia: 'down', estado: 'Saludable', tono: 'positivo' },
  { id: 'margen', nombre: 'Margen neto', valor: '11,3', unidad: '%', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
  { id: 'roe', nombre: 'ROE', valor: '9,6', unidad: '%', tendencia: 'down', estado: 'Atención', tono: 'atencion' },
  { id: 'capital-trabajo', nombre: 'Capital de trabajo', valor: '$112.540', unidad: 'USD', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
]

export const obligaciones: Obligacion[] = [
  { id: 'iva', nombre: 'Declaración de IVA', periodo: 'Jul 2026', vence: '18 ago 2026', monto: '$1.240', estado: 'Próximo', tono: 'atencion' },
  { id: 'retencion', nombre: 'Retención en la fuente', periodo: 'Jul 2026', vence: '10 ago 2026', monto: '$310', estado: 'Al día', tono: 'positivo' },
  { id: 'renta', nombre: 'Impuesto a la Renta', periodo: '2025', vence: '22 abr 2026', monto: '$4.850', estado: 'Al día', tono: 'positivo' },
  { id: 'anticipo', nombre: 'Anticipo Impuesto a la Renta', periodo: '2026', vence: '14 jul 2026', monto: '$960', estado: 'Vencido', tono: 'critico' },
]

export const notificaciones: Notificacion[] = [
  { id: 'n1', titulo: 'IVA de julio vence pronto', mensaje: 'La declaración de IVA vence el 18 de agosto.', fecha: 'hace 2 h', leida: false },
  { id: 'n2', titulo: 'Anticipo IR vencido', mensaje: 'El anticipo del Impuesto a la Renta 2026 está vencido.', fecha: 'hace 1 día', leida: false },
  { id: 'n3', titulo: 'Nuevo indicador calculado', mensaje: 'Se actualizó tu liquidez corriente con datos de julio.', fecha: 'hace 3 días', leida: true },
]

export const chartSeries: ChartSeriesPoint[] = [
  { label: 'Ene', ingresos: 32, gastos: 24, utilidad: 8 },
  { label: 'Feb', ingresos: 35, gastos: 26, utilidad: 9 },
  { label: 'Mar', ingresos: 30, gastos: 25, utilidad: 5 },
  { label: 'Abr', ingresos: 38, gastos: 27, utilidad: 11 },
  { label: 'May', ingresos: 41, gastos: 29, utilidad: 12 },
  { label: 'Jun', ingresos: 39, gastos: 30, utilidad: 9 },
  { label: 'Jul', ingresos: 44, gastos: 31, utilidad: 13 },
  { label: 'Ago', ingresos: 48, gastos: 33, utilidad: 15 },
  { label: 'Sep', ingresos: 45, gastos: 32, utilidad: 13 },
  { label: 'Oct', ingresos: 47, gastos: 34, utilidad: 13 },
  { label: 'Nov', ingresos: 50, gastos: 35, utilidad: 15 },
  { label: 'Dic', ingresos: 53, gastos: 37, utilidad: 16 },
]
```

- [ ] **Step 5: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores. Estos archivos todavía no son importados por nadie (`noUnusedLocals`/`noUnusedParameters` en `tsconfig.json` solo aplican a variables/parámetros dentro de un archivo, no a exports no usados entre archivos), así que esto no rompe el build.

- [ ] **Step 6: Commit**

```bash
git add src/index.css src/portal/types.ts src/portal/tone.ts src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar token danger-soft y capa de datos mock del portal privado"
```

---

### Task 4: Auth mock + shell mínimo del portal + ruta /app/dashboard

**Files:**
- Create: `src/auth/AuthContext.tsx`
- Create: `src/auth/RequireAuth.tsx`
- Create: `src/portal/PortalLayout.tsx`
- Create: `src/portal/dashboard/DashboardScreen.tsx`
- Modify: `src/main.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `NAV_KEY_TO_PATH` (Task 2, ya exportado desde `App.tsx`).
- Produces: `AuthUser` type y `useAuth(): { user: AuthUser | null; login(user: AuthUser): void; logout(): void }` (usado por Task 6 y Task 2's `PublicLayout`); `<RequireAuth>` (wrapper de rutas); `<PortalLayout>` con un `<Outlet/>` (Task 5 y 6 lo extienden); `<DashboardScreen>` montado en `/app/dashboard` (Task 6-9 lo extienden).

- [ ] **Step 1: Crear `src/auth/AuthContext.tsx`**

```tsx
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

export type AuthUser = {
  nombre: string
  correo: string
  iniciales: string
}

type AuthContextValue = {
  user: AuthUser | null
  login: (user: AuthUser) => void
  logout: () => void
}

const STORAGE_KEY = 'safe.auth.user'

const AuthContext = createContext<AuthContextValue | null>(null)

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStoredUser())

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [user])

  const login = (nextUser: AuthUser) => setUser(nextUser)
  const logout = () => setUser(null)

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
```

- [ ] **Step 2: Crear `src/auth/RequireAuth.tsx`**

```tsx
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 3: Crear `src/portal/PortalLayout.tsx` (versión mínima, sin Sidebar/Topbar todavía)**

```tsx
import { Outlet } from 'react-router-dom'

export function PortalLayout() {
  return (
    <div className="flex min-h-screen bg-background text-ink-900" style={{ fontSize: 14 }}>
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Crear `src/portal/dashboard/DashboardScreen.tsx` (versión mínima)**

```tsx
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
```

- [ ] **Step 5: Envolver `<App />` en `<AuthProvider>` en `src/main.tsx`**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import './index.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 6: Agregar la rama `/app` a `src/App.tsx` y conectar login/signup a la sesión mock**

En `src/App.tsx`, agregar estos imports junto a los existentes:

```tsx
import { useAuth } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { PortalLayout } from './portal/PortalLayout'
import { DashboardScreen } from './portal/dashboard/DashboardScreen'
```

Dentro de `PublicLayout`, agregar `const { login } = useAuth()` junto a las otras llamadas a hooks (después de `const navigate = useNavigate()`), y reemplazar los handlers `onIngresar` y `onCrearCuenta`:

```tsx
onIngresar={() => {
  login({ nombre: 'María Fernanda Torres', correo: 'maria.torres@textilesandina.ec', iniciales: 'MT' })
  navigate('/app/dashboard')
}}
```

```tsx
onCrearCuenta={() => {
  login({ nombre: 'María Fernanda Torres', correo: 'maria.torres@textilesandina.ec', iniciales: 'MT' })
  navigate('/app/dashboard')
}}
```

Reemplazar `export default function App()` completo:

```tsx
export default function App() {
  return (
    <Routes>
      <Route
        path="/app"
        element={
          <RequireAuth>
            <PortalLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardScreen />} />
      </Route>
      <Route path="/*" element={<PublicLayout />} />
    </Routes>
  )
}
```

- [ ] **Step 7: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 8: Verificación manual end-to-end**

Run: `npm run dev` y:
- Ir a `/app/dashboard` directamente sin sesión → debe redirigir a `/login`.
- Iniciar sesión (cualquier correo/contraseña, el form no valida credenciales) → debe navegar a `/app/dashboard` y mostrar "Hola, María".
- Recargar la página en `/app/dashboard` → debe seguir mostrando el dashboard (sesión persistida en `localStorage`).
- Click en "Cerrar sesión (temporal)" → debe volver a `/` y, si se visita `/app/dashboard` de nuevo, redirigir a `/login`.
- Repetir el flujo desde `/signup`.

- [ ] **Step 9: Commit**

```bash
git add src/auth src/portal/PortalLayout.tsx src/portal/dashboard/DashboardScreen.tsx src/main.tsx src/App.tsx
git commit -m "feat: agregar sesion mock, RequireAuth y ruta /app/dashboard"
```

---

### Task 5: Sidebar del portal

**Files:**
- Create: `src/portal/components/Sidebar.tsx`
- Modify: `src/portal/PortalLayout.tsx`

**Interfaces:**
- Consumes: `navItems`, `planInfo` (Task 3); logos `@/assets/safe-logo-light.png`.
- Produces: `<Sidebar />` montado en `PortalLayout`.

- [ ] **Step 1: Crear `src/portal/components/Sidebar.tsx`**

```tsx
import { NavLink } from 'react-router-dom'
import safeLogoLight from '@/assets/safe-logo-light.png'
import { navItems, planInfo } from '@/portal/data/mock-portal-data'

export function Sidebar() {
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
        <div className="font-semibold text-white">{planInfo.nombre}</div>
        <div>{planInfo.renovacion}</div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Montar el Sidebar en `src/portal/PortalLayout.tsx`**

Reemplazar el contenido de `PortalLayout.tsx`:

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'

export function PortalLayout() {
  return (
    <div className="flex min-h-screen bg-background text-ink-900" style={{ fontSize: 14 }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` — expected: compila sin errores.

Run: `npm run dev`, iniciar sesión y confirmar en `/app/dashboard`:
- Sidebar navy oscuro de 252px con el logo claro de SAFE arriba.
- 9 items de navegación con íconos (Dashboard resaltado como activo).
- Info del plan al pie del sidebar.
- Click en otros items (ej. "Mi Empresa") no debe romper nada — el área de contenido queda en blanco porque esas rutas se construyen en fases futuras; eso es esperado en esta fase.

- [ ] **Step 4: Commit**

```bash
git add src/portal/components/Sidebar.tsx src/portal/PortalLayout.tsx
git commit -m "feat: agregar Sidebar del portal privado"
```

---

### Task 6: Topbar (selector de empresa, alertas, notificaciones, cuenta)

**Files:**
- Create: `src/portal/components/CompanySwitcher.tsx`
- Create: `src/portal/components/NotificationsPanel.tsx`
- Create: `src/portal/components/AccountMenu.tsx`
- Create: `src/portal/components/Topbar.tsx`
- Modify: `src/portal/PortalLayout.tsx`
- Modify: `src/portal/dashboard/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `empresaActiva`, `empresasDisponibles`, `obligaciones`, `notificaciones` (Task 3); `TONE_DOT_CLASSES` (Task 3); `useAuth()` (Task 4).
- Produces: `<Topbar />` montado en `PortalLayout`; `PanelItem` type (usado internamente por `NotificationsPanel`).

- [ ] **Step 1: Crear `src/portal/components/CompanySwitcher.tsx`**

```tsx
import { useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { empresaActiva, empresasDisponibles } from '@/portal/data/mock-portal-data'

export function CompanySwitcher() {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative min-w-0 flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex min-h-11 max-w-[260px] items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-100 text-[11px] font-bold text-navy-700">
          {empresaActiva.iniciales}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink-900">{empresaActiva.nombre}</span>
          <span className="block truncate text-[11px] text-ink-500">RUC {empresaActiva.ruc}</span>
        </span>
        <ChevronDown className="ml-auto h-[15px] w-[15px] shrink-0 text-ink-500" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-safe-fade-in absolute left-0 top-[calc(100%+8px)] z-30 w-[296px] rounded-xl border border-line bg-card p-1.5 shadow-[var(--shadow-float)]"
        >
          <div className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            Tus empresas
          </div>
          {empresasDisponibles.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface"
            >
              <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-md bg-navy-100 text-[10.5px] font-bold text-navy-700">
                {empresa.iniciales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink-900">{empresa.nombre}</span>
                <span className="block text-[11.5px] text-ink-500">RUC {empresa.ruc}</span>
              </span>
              {empresa.id === empresaActiva.id && (
                <Check className="h-[17px] w-[17px] text-emerald-deep" aria-hidden="true" />
              )}
            </button>
          ))}
          <div className="mt-1 border-t border-line/70 pt-1.5">
            {/* "Registrar otra empresa" se conecta a /app/empresa/registrar en la Fase 2 */}
            <button
              type="button"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex min-h-11 w-full items-center rounded-lg px-2.5 text-[13.5px] font-semibold text-navy-600 hover:bg-surface"
            >
              + Registrar otra empresa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/portal/components/NotificationsPanel.tsx`**

```tsx
import type { Tono } from '@/portal/types'
import { TONE_DOT_CLASSES } from '@/portal/tone'

export type PanelItem = {
  id: string
  titulo: string
  mensaje: string
  fecha: string
  tono: Tono
}

export function NotificationsPanel({
  title,
  items,
  emptyMessage,
  onClose,
}: {
  title: string
  items: PanelItem[]
  emptyMessage: string
  onClose: () => void
}) {
  return (
    <div
      role="menu"
      className="animate-safe-fade-in absolute right-0 top-[calc(100%+8px)] z-30 w-[340px] max-w-[calc(100vw-28px)] rounded-xl border border-line bg-card shadow-[var(--shadow-float)]"
    >
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-3.5 py-3">
        <strong className="text-[13.5px]">{title}</strong>
        <button
          type="button"
          onClick={onClose}
          className="text-[12.5px] font-semibold text-navy-500 hover:text-navy-600"
        >
          Cerrar
        </button>
      </div>
      <div className="max-h-80 overflow-auto">
        {items.length === 0 && (
          <p className="px-3.5 py-5 text-center text-[13px] leading-relaxed text-ink-500">{emptyMessage}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="border-b border-line/70 px-3.5 py-2.5 last:border-b-0">
            <div className="flex items-center gap-2">
              <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT_CLASSES[item.tono]}`} aria-hidden="true" />
              <span className="text-[13px] font-semibold text-ink-900">{item.titulo}</span>
              <span className="ml-auto whitespace-nowrap text-[11px] text-ink-500">{item.fecha}</span>
            </div>
            <p className="mt-1 pl-[15px] text-[12.5px] leading-relaxed text-ink-700">{item.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Crear `src/portal/components/AccountMenu.tsx`**

```tsx
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
        <div className="text-[13.5px] font-semibold text-ink-900">{user.nombre}</div>
        <div className="break-all text-[12px] text-ink-500">{user.correo}</div>
      </div>
      {/* "Configuración de cuenta" navega a /app/configuracion en la Fase 9 */}
      <button
        type="button"
        role="menuitem"
        onClick={onClose}
        className="block min-h-11 w-full rounded-lg px-2.5 text-left text-[13.5px] font-medium text-ink-900 hover:bg-surface"
      >
        Configuración de cuenta
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
```

- [ ] **Step 4: Crear `src/portal/components/Topbar.tsx`**

```tsx
import { useState } from 'react'
import { Bell, ChevronDown, TriangleAlert } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { notificaciones, obligaciones } from '@/portal/data/mock-portal-data'
import { AccountMenu } from './AccountMenu'
import { CompanySwitcher } from './CompanySwitcher'
import { NotificationsPanel, type PanelItem } from './NotificationsPanel'

type OpenPanel = 'alerts' | 'notifications' | 'account' | null

const alertItems: PanelItem[] = obligaciones
  .filter((o) => o.tono !== 'positivo')
  .map((o) => ({ id: o.id, titulo: o.nombre, mensaje: `Vence ${o.vence} · ${o.monto}`, fecha: o.estado, tono: o.tono }))

const notificationItems: PanelItem[] = notificaciones.map((n) => ({
  id: n.id,
  titulo: n.titulo,
  mensaje: n.mensaje,
  fecha: n.fecha,
  tono: n.leida ? 'neutro' : 'atencion',
}))

export function Topbar() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const { user } = useAuth()

  const togglePanel = (panel: OpenPanel) => setOpenPanel((current) => (current === panel ? null : panel))

  return (
    <header className="sticky top-0 z-20 flex min-h-[60px] items-center gap-3 border-b border-line bg-card px-4">
      <CompanySwitcher />

      <div className="ml-auto flex items-center gap-1.5">
        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('alerts')}
            aria-label="Alertas prioritarias"
            className="relative grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface"
          >
            <TriangleAlert className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
            {alertItems.length > 0 && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-amber-brand px-1 text-[10px] font-bold text-navy-900">
                {alertItems.length}
              </span>
            )}
          </button>
          {openPanel === 'alerts' && (
            <NotificationsPanel
              title="Alertas prioritarias"
              items={alertItems}
              emptyMessage="No tienes alertas pendientes."
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('notifications')}
            aria-label="Notificaciones"
            className="relative grid h-11 w-11 place-items-center rounded-lg text-ink-700 hover:bg-surface"
          >
            <Bell className="h-[19px] w-[19px]" strokeWidth={1.7} aria-hidden="true" />
            {notificationItems.some((n) => n.tono === 'atencion') && (
              <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-navy-500 px-1 text-[10px] font-bold text-white">
                {notificationItems.filter((n) => n.tono === 'atencion').length}
              </span>
            )}
          </button>
          {openPanel === 'notifications' && (
            <NotificationsPanel
              title="Notificaciones"
              items={notificationItems}
              emptyMessage="Aún no hay notificaciones."
              onClose={() => setOpenPanel(null)}
            />
          )}
        </div>

        <span aria-hidden="true" className="mx-1 h-6.5 w-px bg-line" />

        <div className="relative">
          <button
            type="button"
            onClick={() => togglePanel('account')}
            aria-haspopup="true"
            aria-expanded={openPanel === 'account'}
            className="flex min-h-11 items-center gap-2 rounded-lg px-1.5 py-1 hover:bg-surface"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-navy-600 text-[12px] font-bold text-white">
              {user?.iniciales}
            </span>
            <span className="whitespace-nowrap text-[13.5px] font-semibold text-ink-900">
              {user?.nombre.split(' ')[0]}
            </span>
            <ChevronDown className="h-[15px] w-[15px] text-ink-500" aria-hidden="true" />
          </button>
          {openPanel === 'account' && <AccountMenu onClose={() => setOpenPanel(null)} />}
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 5: Montar el Topbar en `src/portal/PortalLayout.tsx`**

```tsx
import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'

export function PortalLayout() {
  return (
    <div className="flex min-h-screen bg-background text-ink-900" style={{ fontSize: 14 }}>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Quitar el botón temporal de logout de `DashboardScreen.tsx`**

Reemplazar el contenido de `src/portal/dashboard/DashboardScreen.tsx`:

```tsx
import { useAuth } from '@/auth/AuthContext'

export function DashboardScreen() {
  const { user } = useAuth()
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de Textiles Andina S.A. hoy.
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Verificar**

Run: `npm run build` — expected: compila sin errores.

Run: `npm run dev`, iniciar sesión y en `/app/dashboard`:
- El topbar muestra el selector de empresa, dos campanas (con contador ámbar en alertas y navy en notificaciones), y el menú de cuenta con las iniciales del usuario.
- Click en el selector de empresa abre/cierra el dropdown con la lista de empresas y el check en la activa.
- Click en la campana de alertas muestra las obligaciones no "Al día".
- Click en la campana de notificaciones muestra las 3 notificaciones mock.
- Click en el menú de cuenta muestra nombre/correo y el botón "Cerrar sesión" (que sí funciona: vuelve a `/` y protege `/app/dashboard` de nuevo).

- [ ] **Step 8: Commit**

```bash
git add src/portal/components src/portal/PortalLayout.tsx src/portal/dashboard/DashboardScreen.tsx
git commit -m "feat: agregar Topbar con selector de empresa, alertas, notificaciones y cuenta"
```

---

### Task 7: KPIs del Dashboard

**Files:**
- Create: `src/portal/components/KpiCard.tsx`
- Modify: `src/portal/dashboard/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `Kpi` type y `kpis` data (Task 3); `TONE_BADGE_CLASSES` (Task 3).
- Produces: `<KpiCard kpi={kpi} />` reutilizable.

- [ ] **Step 1: Crear `src/portal/components/KpiCard.tsx`**

```tsx
import type { Kpi } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 text-ink-500">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
          <kpi.icon className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="text-[12.5px] font-semibold leading-tight text-ink-700">{kpi.titulo}</span>
      </div>
      <span className="num mt-auto font-display text-2xl font-bold text-ink-900">{kpi.valor}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink-500">{kpi.sub}</span>
        {kpi.badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[kpi.badge.tono]}`}>
            {kpi.badge.texto}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Agregar el grid de KPIs a `DashboardScreen.tsx`**

Reemplazar el contenido de `src/portal/dashboard/DashboardScreen.tsx`:

```tsx
import { useAuth } from '@/auth/AuthContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { kpis } from '@/portal/data/mock-portal-data'

export function DashboardScreen() {
  const { user } = useAuth()
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de Textiles Andina S.A. hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verificar**

Run: `npm run build` — expected: compila sin errores.

Run: `npm run dev`, en `/app/dashboard`: confirmar que aparecen 4 tarjetas KPI (Ingresos del mes, Obligaciones al día, Capital de trabajo, Próximo vencimiento) con ícono, valor grande y badge de color donde aplica, en grid responsivo (1 columna en mobile, 4 en desktop).

- [ ] **Step 4: Commit**

```bash
git add src/portal/components/KpiCard.tsx src/portal/dashboard/DashboardScreen.tsx
git commit -m "feat: agregar KPIs del dashboard"
```

---

### Task 8: Gráfico "Resumen financiero"

**Files:**
- Create: `src/portal/dashboard/FinancialChart.tsx`
- Modify: `src/portal/dashboard/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `ChartSeriesPoint` type y `chartSeries` data (Task 3).
- Produces: `<FinancialChart data={chartSeries} />`.

- [ ] **Step 1: Crear `src/portal/dashboard/FinancialChart.tsx`**

```tsx
import { useState } from 'react'
import type { ChartSeriesPoint } from '@/portal/types'

type ChartView = 'tendencia' | 'mensual' | 'comparativo'

const VIEWS: { id: ChartView; label: string }[] = [
  { id: 'tendencia', label: 'Tendencia' },
  { id: 'mensual', label: 'Por mes' },
  { id: 'comparativo', label: 'Ingresos vs. gastos vs. utilidad' },
]

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], max: number) {
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - (value / max) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function FinancialChart({ data }: { data: ChartSeriesPoint[] }) {
  const [view, setView] = useState<ChartView>('tendencia')
  const max = Math.max(...data.map((d) => Math.max(d.ingresos, d.gastos, d.utilidad))) * 1.15
  const yTicks = [max, max / 2, 0].map((value) => `$${Math.round(value)}k`)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[19px] font-semibold">Resumen financiero</h2>
        <div className="flex flex-wrap gap-1.5">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              aria-pressed={view === v.id}
              className={`min-h-9 rounded-full border px-3.5 text-[12.5px] font-semibold ${
                view === v.id ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-card text-ink-700'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex gap-2.5">
        <div
          className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((tick) => (
            <span key={tick}>{tick}</span>
          ))}
        </div>

        <div
          className="relative min-w-0 flex-1 border-b border-l border-line/70"
          style={{ height: CHART_HEIGHT }}
        >
          {view === 'tendencia' && (
            <svg
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-label="Ingresos y gastos mensuales"
            >
              <polyline
                points={buildPoints(data.map((d) => d.ingresos), max)}
                fill="none"
                stroke="var(--color-navy-500)"
                strokeWidth={6}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              <polyline
                points={buildPoints(data.map((d) => d.gastos), max)}
                fill="none"
                stroke="var(--color-emerald-brand)"
                strokeWidth={6}
                strokeDasharray="14 10"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          )}

          {view === 'mensual' && (
            <div className="absolute inset-0 flex items-end gap-1.5 px-0.5 py-1">
              {data.map((d) => (
                <span
                  key={d.label}
                  title={`${d.label}: $${d.ingresos}k`}
                  className="flex-1 rounded-t bg-navy-500"
                  style={{ height: `${(d.ingresos / max) * 100}%` }}
                />
              ))}
            </div>
          )}

          {view === 'comparativo' && (
            <div className="absolute inset-0 flex items-end gap-2 px-0.5 py-1">
              {data.map((d) => (
                <span key={d.label} className="flex h-full flex-1 items-end gap-0.5">
                  <span className="flex-1 rounded-t bg-navy-500" style={{ height: `${(d.ingresos / max) * 100}%` }} />
                  <span className="flex-1 rounded-t bg-emerald-brand" style={{ height: `${(d.gastos / max) * 100}%` }} />
                  <span className="flex-1 rounded-t bg-amber-brand" style={{ height: `${(d.utilidad / max) * 100}%` }} />
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
        {data.map((d) => (
          <span key={d.label}>{d.label}</span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3">
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
          <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
          Ingresos
        </span>
        <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
          <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
          Gastos
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Montar el gráfico en `DashboardScreen.tsx`**

Agregar el import y el componente después del grid de KPIs:

```tsx
import { FinancialChart } from './FinancialChart'
import { chartSeries, kpis } from '@/portal/data/mock-portal-data'
```

```tsx
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <FinancialChart data={chartSeries} />
```

- [ ] **Step 3: Verificar**

Run: `npm run build` — expected: compila sin errores.

Run: `npm run dev`, en `/app/dashboard`: confirmar que la sección "Resumen financiero" muestra el gráfico de líneas (Ingresos sólida navy, Gastos punteada verde) con eje Y y etiquetas de mes en el eje X, y que los toggles "Tendencia" / "Por mes" / "Ingresos vs. gastos vs. utilidad" cambian la visualización (línea → barras → barras agrupadas).

- [ ] **Step 4: Commit**

```bash
git add src/portal/dashboard/FinancialChart.tsx src/portal/dashboard/DashboardScreen.tsx
git commit -m "feat: agregar grafico de resumen financiero al dashboard"
```

---

### Task 9: Tablas de Indicadores y Obligaciones

**Files:**
- Create: `src/portal/dashboard/IndicatorsTable.tsx`
- Create: `src/portal/dashboard/ObligationsTable.tsx`
- Modify: `src/portal/dashboard/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `Indicador`/`Obligacion` types y `indicadores`/`obligaciones` data (Task 3); `TONE_BADGE_CLASSES` (Task 3).
- Produces: dashboard completo de la Fase 1.

- [ ] **Step 1: Crear `src/portal/dashboard/IndicatorsTable.tsx`**

```tsx
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { Indicador } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function IndicatorsTable({ indicadores }: { indicadores: Indicador[] }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-4.5 py-3.5">
        <h2 className="text-[17px] font-semibold">Indicadores clave</h2>
        <span className="text-[12.5px] font-semibold text-navy-500">Ver todos</span>
      </div>
      <table className="w-full min-w-[430px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-ink-500">
            <th scope="col" className="px-4.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Indicador
            </th>
            <th scope="col" className="px-2 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Valor
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Unidad
            </th>
            <th scope="col" className="px-2 py-2.5 text-center text-[11.5px] font-semibold uppercase tracking-wide">
              Tend.
            </th>
            <th scope="col" className="px-4.5 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {indicadores.map((ind) => (
            <tr key={ind.id} className="border-t border-line/70">
              <td className="px-4.5 py-2.5 font-medium">{ind.nombre}</td>
              <td className="num px-2 py-2.5 text-right font-semibold">{ind.valor}</td>
              <td className="px-2 py-2.5 text-[12.5px] text-ink-500">{ind.unidad}</td>
              <td className="px-2 py-2.5 text-center">
                {ind.tendencia === 'up' ? (
                  <TrendingUp className="inline h-[15px] w-[15px] text-emerald-deep" aria-label="Tendencia al alza" />
                ) : (
                  <TrendingDown className="inline h-[15px] w-[15px] text-destructive" aria-label="Tendencia a la baja" />
                )}
              </td>
              <td className="px-4.5 py-2.5 text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ind.tono]}`}
                >
                  {ind.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
```

- [ ] **Step 2: Crear `src/portal/dashboard/ObligationsTable.tsx`**

```tsx
import type { Obligacion } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function ObligationsTable({ obligaciones }: { obligaciones: Obligacion[] }) {
  return (
    <section className="overflow-x-auto rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-4.5 py-3.5">
        <h2 className="text-[17px] font-semibold">Obligaciones próximas</h2>
        <span className="text-[12.5px] font-semibold text-navy-500">Ver todas</span>
      </div>
      <table className="w-full min-w-[470px] border-collapse text-[13px]">
        <thead>
          <tr className="text-left text-ink-500">
            <th scope="col" className="px-4.5 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Obligación
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Periodo
            </th>
            <th scope="col" className="px-2 py-2.5 text-[11.5px] font-semibold uppercase tracking-wide">
              Vence
            </th>
            <th scope="col" className="px-2 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Monto est.
            </th>
            <th scope="col" className="px-4.5 py-2.5 text-right text-[11.5px] font-semibold uppercase tracking-wide">
              Estado
            </th>
          </tr>
        </thead>
        <tbody>
          {obligaciones.map((o) => (
            <tr key={o.id} className="border-t border-line/70">
              <td className="px-4.5 py-2.5 font-medium leading-snug">{o.nombre}</td>
              <td className="whitespace-nowrap px-2 py-2.5 text-ink-700">{o.periodo}</td>
              <td className="num whitespace-nowrap px-2 py-2.5">{o.vence}</td>
              <td className="num px-2 py-2.5 text-right">{o.monto}</td>
              <td className="px-4.5 py-2.5 text-right">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[o.tono]}`}
                >
                  {o.estado}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
```

- [ ] **Step 3: Montar ambas tablas en `DashboardScreen.tsx` (versión final del componente)**

Reemplazar el contenido completo de `src/portal/dashboard/DashboardScreen.tsx`:

```tsx
import { useAuth } from '@/auth/AuthContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { chartSeries, indicadores, kpis, obligaciones } from '@/portal/data/mock-portal-data'
import { FinancialChart } from './FinancialChart'
import { IndicatorsTable } from './IndicatorsTable'
import { ObligationsTable } from './ObligationsTable'

export function DashboardScreen() {
  const { user } = useAuth()
  const firstName = user?.nombre.split(' ')[0] ?? ''

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Hola, {firstName}</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de Textiles Andina S.A. hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <FinancialChart data={chartSeries} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <IndicatorsTable indicadores={indicadores} />
        <ObligationsTable obligaciones={obligaciones} />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Verificar**

Run: `npm run build` — expected: compila sin errores.

Run: `npm run dev`, en `/app/dashboard`: confirmar que debajo del gráfico aparecen, en grid de 2 columnas (desktop) o apiladas (mobile), la tabla "Indicadores clave" (5 filas, con flechas de tendencia y badges de estado) y la tabla "Obligaciones próximas" (4 filas, con badges Al día/Próximo/Vencido en verde/ámbar/rojo).

- [ ] **Step 5: Commit**

```bash
git add src/portal/dashboard/IndicatorsTable.tsx src/portal/dashboard/ObligationsTable.tsx src/portal/dashboard/DashboardScreen.tsx
git commit -m "feat: agregar tablas de indicadores y obligaciones al dashboard"
```

---

### Task 10: QA final, build y documentación

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: toda la Fase 1 ya construida.
- Produces: nada nuevo — solo verificación y documentación.

- [ ] **Step 1: Walkthrough completo manual**

Run: `npm run dev` y verificar, en orden:
1. `/` carga la landing pública normalmente, Navbar navega por URL a todas las secciones públicas.
2. `/login` sin sesión funciona; enviar el form (cualquier dato) navega a `/app/dashboard`.
3. En `/app/dashboard`: Sidebar (9 items, logo, plan), Topbar (empresa, alertas, notificaciones, cuenta) y el contenido (saludo, 4 KPIs, gráfico con 3 toggles, 2 tablas) se ven como en el mockup `SAFE Portal Privado.dc.html` importado (colores, spacing, tipografía).
4. Recargar `/app/dashboard` mantiene la sesión (no rebota a `/login`).
5. Cerrar sesión desde el menú de cuenta vuelve a `/` y bloquea `/app/dashboard` de nuevo (redirige a `/login`).
6. Repetir el login desde `/signup`.
7. Probar en una ventana angosta (mobile): el Sidebar se oculta (`hidden lg:flex`) — anotar esto como conocido, ya que el drawer mobile del sidebar es parte de fases futuras, no de esta.

- [ ] **Step 2: Verificar build de producción**

Run: `npm run build`

Expected: `tsc -b` y `vite build` completan sin errores ni warnings de TypeScript.

- [ ] **Step 3: Documentar la Fase 1 en `README.md`**

Agregar una sección nueva al final de `README.md` (después de "## Notas"):

```markdown
## Portal privado (`/app`)

A partir de agosto de 2026, el repo también incluye la Fase 1 del **portal privado** (la app
autenticada de SAFE, post-login), importado como prototipo de alta fidelidad desde Claude Design.
Ver el spec completo en `docs/superpowers/specs/2026-08-06-portal-privado-fase1-design.md`.

- **Routing real:** todo el sitio (público, auth y portal) usa `react-router-dom`. El portal vive bajo
  `/app/*` y está protegido por una sesión mock (`src/auth/AuthContext.tsx`, persistida en
  `localStorage`) — cualquier envío de los formularios de Login/Signup crea la sesión y navega a
  `/app/dashboard`; sin sesión, `/app/*` redirige a `/login`.
- **Estructura:** `src/portal/` contiene el shell (`PortalLayout`, `Sidebar`, `Topbar` y sus
  dropdowns) y `src/portal/dashboard/` la primera pantalla (KPIs, gráfico de resumen financiero,
  tablas de indicadores y obligaciones). Todo el contenido viene de
  `src/portal/data/mock-portal-data.ts` — datos de ejemplo, no hay backend conectado.
- **Pendiente:** las otras 25 pantallas del portal (Mi Empresa, Financiero, Indicadores completos,
  Obligaciones, Simulador, Marketplace, Plan, Configuración, tutoriales) se implementan en fases
  posteriores, cada una con su propio spec y plan.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: documentar la Fase 1 del portal privado en el README"
```

---

## Self-Review Notes

- **Cobertura del spec:** routing completo (Task 1-2, 4), auth mock + RequireAuth (Task 4), estructura de carpetas `auth/` + `portal/` (Tasks 3-9 tal cual el spec), Sidebar/Topbar/dropdowns (Tasks 5-6), KPIs/gráfico/tablas con datos mock ecuatorianos (Tasks 3, 7-9), reutilización de tokens existentes + un token nuevo `danger-soft` (Task 3), logos ya descargados (Task 5), verificación vía `npm run build` + manual (todas las tasks), documentación (Task 10). Sin huecos frente al spec de la Fase 1.
- **Placeholders:** ninguno — cada step trae código completo, sin "TBD" ni "similar a la task N".
- **Consistencia de tipos:** `Tono` se define una vez en `types.ts` y se reusa en `Kpi`, `Indicador`, `Obligacion`, `PanelItem`, `TONE_BADGE_CLASSES`, `TONE_DOT_CLASSES` sin renombrar. `AuthUser`/`useAuth()` se definen en Task 4 y se consumen igual (mismo nombre de campos `nombre`/`correo`/`iniciales`) en `App.tsx`, `Topbar.tsx`, `AccountMenu.tsx`, `DashboardScreen.tsx`. `navItems`/`planInfo`/`kpis`/`indicadores`/`obligaciones`/`notificaciones`/`chartSeries`/`empresaActiva`/`empresasDisponibles` se definen una sola vez en `mock-portal-data.ts` (Task 3) y se importan igual en todas las tasks siguientes.
