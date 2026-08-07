# Portal Privado — Fase 2 (Mi Empresa) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Mi Empresa" del portal privado (ver / registrar / editar), reemplazando el mock estático de empresa de la Fase 1 por un `PortalDataProvider` real que permite cambiar de empresa activa, registrar una nueva, y editarla.

**Architecture:** Se amplía el tipo `Empresa` a un perfil completo agrupado por categoría (general/fiscal/contacto/representante/ubicación/meta). Un nuevo Context (`PortalDataProvider`) envuelve `<PortalLayout>` dentro de la rama `/app` y expone `empresas`, `empresaActiva`, `setEmpresaActiva`, `addEmpresa`, `updateEmpresa`. Tres pantallas nuevas (`EmpresaScreen`, `EmpresaRegistrarScreen`, `EmpresaEditarScreen`) bajo `/app/empresa*` consumen ese contexto. Se cierran dos conexiones que la Fase 1 dejó inertes a propósito: el botón "Registrar otra empresa" del `CompanySwitcher` y el saludo hardcodeado del Dashboard.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, `react-router-dom` (ya instalado desde la Fase 1), componentes `ui/` existentes (`Input`, `Label`, `Select`, `Textarea`) de `src/components/ui/`, `lucide-react`.

## Global Constraints

- Prototipo **solo frontend**, sin backend — spec: "no hay backend ni API real".
- Los datos de empresa (a diferencia de la sesión de auth) **no** persisten en `localStorage` — viven en memoria de React mientras dura la sesión del navegador. Recargar la página los resetea a los datos semilla.
- El tipo `Empresa` mantiene sus campos existentes (`id`, `nombre`, `ruc`, `iniciales`) sin romper el código de la Fase 1 que ya los usa; se le agregan campos nuevos, no se renombran los existentes.
- **No** se recalculan KPIs/indicadores/obligaciones al editar datos fiscales — solo se muestra un aviso (UI). Esa lógica de negocio llega en fases futuras (Financiero/Indicadores/Obligaciones).
- **No** se implementa el bloqueo de campos por plan de suscripción (candados del mockup) — se difiere a la Fase 8.
- **No** se valida el dígito verificador de RUC/cédula — solo que los campos requeridos no estén vacíos.
- Los formularios usan los componentes `ui/` ya existentes (`Input`, `Label`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue`, `Textarea` de `src/components/ui/`) — los mismos que usan `LoginPage`/`SignupPage` — no HTML crudo.
- El repo no tiene test runner ni eslint — verificación vía `npm run build` (type-check) + revisión manual/navegador. No agregar frameworks de testing en esta fase.
- Nueva empresa: `id` vía `crypto.randomUUID()`; `iniciales` derivadas de las primeras letras de las 2 primeras palabras del nombre comercial.
- Reusar tokens de color existentes (`--color-navy-*`, `--color-emerald-*`, `--color-amber-*`, `--color-ink-*`, `--color-line`, `--color-surface`, `--color-destructive`); no agregar tokens nuevos.

---

## File Structure

```
src/
├── App.tsx                                # Modify: PortalDataProvider (Task 2) + 3 rutas nuevas (Tasks 5,6,7)
├── portal/
│   ├── types.ts                           # Modify: ampliar Empresa (Task 1)
│   ├── PortalDataContext.tsx              # Create (Task 2): Provider + usePortalData()
│   ├── data/
│   │   └── mock-portal-data.ts            # Modify: ampliar empresaActiva/empresasDisponibles (Task 1)
│   ├── components/
│   │   └── CompanySwitcher.tsx            # Modify: consumir contexto (Task 3)
│   ├── dashboard/
│   │   └── DashboardScreen.tsx            # Modify: nombre de empresa dinámico (Task 3)
│   └── empresa/
│       ├── empresa-form-options.ts        # Create (Task 4): listas de opciones para selects
│       ├── EmpresaScreen.tsx              # Create (Task 5): ver empresa
│       ├── EmpresaRegistrarScreen.tsx     # Create (Task 6): wizard de registro (4 pasos)
│       └── EmpresaEditarScreen.tsx        # Create (Task 7): editar empresa
```

`empresa/` se agrupa aparte de `components/`/`dashboard/` porque es su propio sub-módulo con 3
pantallas relacionadas que comparten el mismo modelo de datos — mismo patrón que usó `dashboard/` en
la Fase 1.

---

### Task 1: Ampliar el tipo `Empresa` + datos mock

**Files:**
- Modify: `src/portal/types.ts`
- Modify: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: el tipo `Empresa` ampliado (usado por todas las tasks siguientes); `empresaActiva`/`empresasDisponibles` con el perfil completo (usados como semilla por la Task 2).

- [ ] **Step 1: Reemplazar el tipo `Empresa` en `src/portal/types.ts`**

Reemplazar el bloque actual:

```ts
export type Empresa = {
  id: string
  nombre: string
  ruc: string
  iniciales: string
}
```

por:

```ts
export type Empresa = {
  id: string
  nombre: string
  ruc: string
  iniciales: string
  estado: string
  plan: string
  diagnostico?: string
  diagnosticoFecha?: string
  general: {
    razonSocial: string
    tipoContribuyente: 'Persona Natural' | 'Persona Jurídica'
    fechaConstitucion: string
    numeroEmpleados: string
  }
  fiscal: {
    regimenTributario: string
    actividadEconomica: string
    obligadoContabilidad: 'Sí' | 'No'
    agenteRetencion: 'Sí' | 'No'
  }
  contacto: {
    correo: string
    telefono: string
    sitioWeb: string
  }
  representante: {
    nombre: string
    cedula: string
  }
  ubicacion: {
    provincia: string
    ciudad: string
    direccion: string
  }
  meta: {
    fechaRegistroSafe: string
  }
}
```

El resto de `types.ts` (`Tono`, `Kpi`, `Indicador`, `Obligacion`, `Notificacion`, `NavItem`,
`ChartSeriesPoint`) no cambia.

- [ ] **Step 2: Ampliar `empresaActiva`/`empresasDisponibles` en `src/portal/data/mock-portal-data.ts`**

Reemplazar las líneas 26-36 actuales (la definición de `empresaActiva` y `empresasDisponibles`) por:

```ts
export const empresaActiva: Empresa = {
  id: 'emp-1',
  nombre: 'Textiles Andina S.A.',
  ruc: '1792146739001',
  iniciales: 'TA',
  estado: 'Activa',
  plan: 'Plan Crecimiento',
  diagnostico: 'Saludable',
  diagnosticoFecha: '2 ago 2026',
  general: {
    razonSocial: 'Textiles Andina S.A.',
    tipoContribuyente: 'Persona Jurídica',
    fechaConstitucion: '14 mar 2016',
    numeroEmpleados: '38',
  },
  fiscal: {
    regimenTributario: 'Régimen General',
    actividadEconomica: 'C1410 - Fabricación de prendas de vestir',
    obligadoContabilidad: 'Sí',
    agenteRetencion: 'Sí',
  },
  contacto: {
    correo: 'contacto@textilesandina.ec',
    telefono: '+593 2 298 4410',
    sitioWeb: 'www.textilesandina.ec',
  },
  representante: {
    nombre: 'María Fernanda Torres',
    cedula: '1712345678',
  },
  ubicacion: {
    provincia: 'Pichincha',
    ciudad: 'Quito',
    direccion: 'Av. Eloy Alfaro N32-15 y Av. Amazonas',
  },
  meta: {
    fechaRegistroSafe: '3 ene 2026',
  },
}

export const empresasDisponibles: Empresa[] = [
  empresaActiva,
  {
    id: 'emp-2',
    nombre: 'Comercial del Valle Cía. Ltda.',
    ruc: '0992345678001',
    iniciales: 'CV',
    estado: 'Activa',
    plan: 'Plan Esencial',
    diagnostico: 'Atención',
    diagnosticoFecha: '28 jul 2026',
    general: {
      razonSocial: 'Comercial del Valle Cía. Ltda.',
      tipoContribuyente: 'Persona Jurídica',
      fechaConstitucion: '9 sep 2019',
      numeroEmpleados: '12',
    },
    fiscal: {
      regimenTributario: 'RIMPE Negocio Popular',
      actividadEconomica: 'G4711 - Venta al por menor en comercios no especializados',
      obligadoContabilidad: 'No',
      agenteRetencion: 'No',
    },
    contacto: {
      correo: 'ventas@comercialdelvalle.ec',
      telefono: '+593 4 220 5567',
      sitioWeb: '',
    },
    representante: {
      nombre: 'Jorge Andrés Salazar',
      cedula: '0912345678',
    },
    ubicacion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Calle 9na Este 210 y Vía a la Costa',
    },
    meta: {
      fechaRegistroSafe: '12 feb 2026',
    },
  },
]
```

El resto del archivo (`navItems`, `planInfo`, `kpis`, `indicadores`, `obligaciones`, `notificaciones`,
`chartSeries`) no cambia.

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores. `CompanySwitcher.tsx` y `DashboardScreen.tsx` (que ya importan
`empresaActiva`/`empresasDisponibles`) siguen compilando porque los campos que ya usaban
(`nombre`, `ruc`, `iniciales`) no cambiaron — solo se agregaron campos nuevos.

- [ ] **Step 4: Commit**

```bash
git add src/portal/types.ts src/portal/data/mock-portal-data.ts
git commit -m "feat: ampliar el tipo Empresa a un perfil completo"
```

---

### Task 2: `PortalDataProvider` + wiring en App.tsx

**Files:**
- Create: `src/portal/PortalDataContext.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `Empresa` (Task 1); `empresaActiva`/`empresasDisponibles` como semilla (Task 1).
- Produces: `usePortalData(): { empresas: Empresa[]; empresaActivaId: string; empresaActiva: Empresa; setEmpresaActiva(id: string): void; addEmpresa(empresa: Empresa): void; updateEmpresa(id: string, patch: Partial<Empresa>): void }` — usado por las Tasks 3, 5, 6, 7.

- [ ] **Step 1: Crear `src/portal/PortalDataContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa } from './types'
import { empresaActiva as empresaSemilla, empresasDisponibles as empresasSemilla } from './data/mock-portal-data'

type PortalDataContextValue = {
  empresas: Empresa[]
  empresaActivaId: string
  empresaActiva: Empresa
  setEmpresaActiva: (id: string) => void
  addEmpresa: (empresa: Empresa) => void
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasSemilla)
  const [empresaActivaId, setEmpresaActivaId] = useState(empresaSemilla.id)

  const empresaActiva = useMemo(
    () => empresas.find((e) => e.id === empresaActivaId) ?? empresas[0],
    [empresas, empresaActivaId],
  )

  const addEmpresa = (empresa: Empresa) => {
    setEmpresas((current) => [...current, empresa])
  }

  const updateEmpresa = (id: string, patch: Partial<Empresa>) => {
    setEmpresas((current) => current.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }

  return (
    <PortalDataContext.Provider
      value={{
        empresas,
        empresaActivaId,
        empresaActiva,
        setEmpresaActiva: setEmpresaActivaId,
        addEmpresa,
        updateEmpresa,
      }}
    >
      {children}
    </PortalDataContext.Provider>
  )
}

export function usePortalData() {
  const ctx = useContext(PortalDataContext)
  if (!ctx) throw new Error('usePortalData debe usarse dentro de <PortalDataProvider>')
  return ctx
}
```

- [ ] **Step 2: Envolver `<PortalLayout />` en `<PortalDataProvider>` dentro de `src/App.tsx`**

Agregar el import junto a los existentes:

```tsx
import { PortalDataProvider } from './portal/PortalDataContext'
```

En `export default function App()`, reemplazar el `element` de la ruta `"/app"`:

```tsx
        element={
          <RequireAuth>
            <PortalLayout />
          </RequireAuth>
        }
```

por:

```tsx
        element={
          <RequireAuth>
            <PortalDataProvider>
              <PortalLayout />
            </PortalDataProvider>
          </RequireAuth>
        }
```

Nada más cambia en `App.tsx` en esta task — ningún componente consume el contexto todavía (eso
empieza en la Task 3), así que el Dashboard debe verse y comportarse exactamente igual que al final de
la Fase 1.

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, iniciar sesión, confirmar que `/app/dashboard` se ve y funciona exactamente igual
que antes de este cambio (el provider está montado pero nada lo usa todavía).

- [ ] **Step 5: Commit**

```bash
git add src/portal/PortalDataContext.tsx src/App.tsx
git commit -m "feat: agregar PortalDataProvider y montarlo en la rama /app"
```

---

### Task 3: Conectar CompanySwitcher y el saludo del Dashboard al contexto

**Files:**
- Modify: `src/portal/components/CompanySwitcher.tsx`
- Modify: `src/portal/dashboard/DashboardScreen.tsx`

**Interfaces:**
- Consumes: `usePortalData()` (Task 2).
- Produces: nada nuevo — cierra la conexión que la Fase 1 dejó inerte a propósito.

- [ ] **Step 1: Reemplazar `src/portal/components/CompanySwitcher.tsx` completo**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'

export function CompanySwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { empresas, empresaActiva, setEmpresaActiva } = usePortalData()

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
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setEmpresaActiva(empresa.id)
                setOpen(false)
              }}
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
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/app/empresa/registrar')
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 text-[13.5px] font-semibold text-navy-600 hover:bg-surface"
            >
              <Plus className="h-[17px] w-[17px]" aria-hidden="true" />
              Registrar otra empresa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

Cambios respecto a la versión de la Fase 1: ya no importa `empresaActiva`/`empresasDisponibles` de
`mock-portal-data.ts` — usa `usePortalData()`. El botón "Registrar otra empresa" ahora sí navega. Cada
fila de empresa ahora sí llama `setEmpresaActiva(empresa.id)`.

- [ ] **Step 2: Actualizar el saludo de `src/portal/dashboard/DashboardScreen.tsx`**

Agregar el import:

```tsx
import { usePortalData } from '@/portal/PortalDataContext'
```

Dentro de `DashboardScreen`, agregar junto a `const { user } = useAuth()`:

```tsx
const { empresaActiva } = usePortalData()
```

Reemplazar el párrafo hardcodeado:

```tsx
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de Textiles Andina S.A. hoy.
        </p>
```

por:

```tsx
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el estado financiero y tributario de {empresaActiva.nombre} hoy.
        </p>
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, iniciar sesión, en `/app/dashboard`:
- El saludo dice "...de Textiles Andina S.A. hoy." (empresa activa por defecto).
- Abrir el selector de empresa del Topbar, hacer click en "Comercial del Valle Cía. Ltda." — el
  selector se cierra, ahora muestra "Comercial del Valle..." como activa, y el saludo del Dashboard
  cambia a "...de Comercial del Valle Cía. Ltda. hoy." sin recargar la página.
- Abrir el selector de nuevo, click en "Registrar otra empresa" — navega a `/app/empresa/registrar`
  (la pantalla aún no existe, así que el contenido del `<Outlet/>` puede verse en blanco; eso es
  esperado, se construye en la Task 6).

- [ ] **Step 5: Commit**

```bash
git add src/portal/components/CompanySwitcher.tsx src/portal/dashboard/DashboardScreen.tsx
git commit -m "feat: conectar CompanySwitcher y el saludo del dashboard al PortalDataProvider"
```

---

### Task 4: Opciones compartidas para los formularios de empresa

**Files:**
- Create: `src/portal/empresa/empresa-form-options.ts`

**Interfaces:**
- Produces: `TIPO_CONTRIBUYENTE_OPTIONS`, `REGIMEN_TRIBUTARIO_OPTIONS`, `ACTIVIDAD_ECONOMICA_OPTIONS`, `PROVINCIA_OPTIONS`, `SI_NO_OPTIONS` — usados por las Tasks 6 y 7.

- [ ] **Step 1: Crear `src/portal/empresa/empresa-form-options.ts`**

```ts
export const TIPO_CONTRIBUYENTE_OPTIONS = ['Persona Natural', 'Persona Jurídica'] as const

export const REGIMEN_TRIBUTARIO_OPTIONS = [
  'RIMPE Emprendedor',
  'RIMPE Negocio Popular',
  'Régimen General',
] as const

export const ACTIVIDAD_ECONOMICA_OPTIONS = [
  'C1410 - Fabricación de prendas de vestir',
  'G4711 - Venta al por menor en comercios no especializados',
  'G4620 - Venta al por mayor de materias primas agropecuarias',
  'I5610 - Actividades de restaurantes y servicio móvil de comidas',
  'J6202 - Consultoría informática y actividades relacionadas',
  'M6920 - Actividades de contabilidad y auditoría',
  'F4100 - Construcción de edificios',
  'H4923 - Transporte de carga por carretera',
] as const

export const PROVINCIA_OPTIONS = [
  'Azuay',
  'Bolívar',
  'Cañar',
  'Carchi',
  'Chimborazo',
  'Cotopaxi',
  'El Oro',
  'Esmeraldas',
  'Galápagos',
  'Guayas',
  'Imbabura',
  'Loja',
  'Los Ríos',
  'Manabí',
  'Morona Santiago',
  'Napo',
  'Orellana',
  'Pastaza',
  'Pichincha',
  'Santa Elena',
  'Santo Domingo de los Tsáchilas',
  'Sucumbíos',
  'Tungurahua',
  'Zamora Chinchipe',
] as const

export const SI_NO_OPTIONS = ['Sí', 'No'] as const
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores (el archivo no es importado por nadie todavía, eso es correcto).

- [ ] **Step 3: Commit**

```bash
git add src/portal/empresa/empresa-form-options.ts
git commit -m "feat: agregar opciones compartidas para los formularios de empresa"
```

---

### Task 5: Pantalla "Ver empresa"

**Files:**
- Create: `src/portal/empresa/EmpresaScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` (Task 2); `Empresa` type (Task 1).
- Produces: `<EmpresaScreen/>` montado en `/app/empresa`.

- [ ] **Step 1: Crear `src/portal/empresa/EmpresaScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { Empresa } from '@/portal/types'

type TabKey = 'general' | 'fiscal' | 'contacto' | 'ubicacion' | 'representante'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'representante', label: 'Representante' },
]

function buildCampos(empresa: Empresa, tab: TabKey): { label: string; valor: string }[] {
  switch (tab) {
    case 'general':
      return [
        { label: 'Razón social', valor: empresa.general.razonSocial },
        { label: 'Nombre comercial', valor: empresa.nombre },
        { label: 'RUC', valor: empresa.ruc },
        { label: 'Tipo de contribuyente', valor: empresa.general.tipoContribuyente },
        { label: 'Fecha de constitución', valor: empresa.general.fechaConstitucion },
        { label: 'Número de empleados', valor: empresa.general.numeroEmpleados },
      ]
    case 'fiscal':
      return [
        { label: 'Régimen tributario', valor: empresa.fiscal.regimenTributario },
        { label: 'Actividad económica', valor: empresa.fiscal.actividadEconomica },
        { label: 'Obligado a llevar contabilidad', valor: empresa.fiscal.obligadoContabilidad },
        { label: 'Agente de retención', valor: empresa.fiscal.agenteRetencion },
      ]
    case 'contacto':
      return [
        { label: 'Correo', valor: empresa.contacto.correo },
        { label: 'Teléfono', valor: empresa.contacto.telefono },
        { label: 'Sitio web', valor: empresa.contacto.sitioWeb || 'No registrado' },
      ]
    case 'ubicacion':
      return [
        { label: 'Provincia', valor: empresa.ubicacion.provincia },
        { label: 'Ciudad', valor: empresa.ubicacion.ciudad },
        { label: 'Dirección', valor: empresa.ubicacion.direccion },
      ]
    case 'representante':
      return [
        { label: 'Nombre', valor: empresa.representante.nombre },
        { label: 'Cédula', valor: empresa.representante.cedula },
      ]
  }
}

export function EmpresaScreen() {
  const { empresaActiva } = usePortalData()
  const [tab, setTab] = useState<TabKey>('general')
  const navigate = useNavigate()

  const campos = buildCampos(empresaActiva, tab)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4.5 rounded-xl border border-line bg-card p-5">
        <span className="grid h-19 w-19 shrink-0 place-items-center rounded-2xl bg-navy-100 font-display text-2xl font-bold text-navy-700">
          {empresaActiva.iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{empresaActiva.nombre}</h1>
          <p className="mt-1 text-sm text-ink-700">{empresaActiva.general.razonSocial}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-[11.5px] font-semibold text-emerald-deep">
              {empresaActiva.estado}
            </span>
            <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700">
              {empresaActiva.plan}
            </span>
            {empresaActiva.diagnostico && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-700">
                Salud financiera: {empresaActiva.diagnostico}
              </span>
            )}
            {empresaActiva.diagnosticoFecha && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-500">
                Último diagnóstico: {empresaActiva.diagnosticoFecha}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/empresa/editar')}
          className="rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy-700"
        >
          Editar empresa
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Régimen tributario</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.fiscal.regimenTributario}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">
            Obligado a contabilidad: {empresaActiva.fiscal.obligadoContabilidad}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Actividad económica</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.fiscal.actividadEconomica}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">
            Agente de retención: {empresaActiva.fiscal.agenteRetencion}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Representante legal</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.representante.nombre}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">Cédula: {empresaActiva.representante.cedula}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex flex-wrap gap-1.5 border-b border-line/70 bg-surface p-3.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`min-h-9.5 rounded-full border px-3.5 text-[13px] font-semibold ${
                tab === t.key ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-card text-ink-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <dl className="grid grid-cols-1 gap-3.5 p-4.5 sm:grid-cols-2">
          {campos.map((c) => (
            <div key={c.label} className="min-w-0">
              <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1.5 break-words text-sm leading-relaxed text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los existentes:

```tsx
import { EmpresaScreen } from './portal/empresa/EmpresaScreen'
```

Dentro de la ruta `"/app"`, agregar después de `<Route path="dashboard" element={<DashboardScreen />} />`:

```tsx
        <Route path="empresa" element={<EmpresaScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, iniciar sesión, ir a `/app/empresa` (o click en "Mi Empresa" en el Sidebar):
confirmar header con iniciales/nombre/badges, 3 tarjetas resumen, y las 5 tabs (General/Fiscal/
Contacto/Ubicación/Representante) cambiando el contenido de la grilla de campos al hacer click. El
botón "Editar empresa" navega a `/app/empresa/editar` (pantalla en blanco por ahora, se construye en
la Task 7).

- [ ] **Step 5: Commit**

```bash
git add src/portal/empresa/EmpresaScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Ver empresa"
```

---

### Task 6: Wizard "Registrar empresa"

**Files:**
- Create: `src/portal/empresa/EmpresaRegistrarScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` (Task 2); `Empresa` type (Task 1); opciones de `empresa-form-options.ts` (Task 4); componentes `Input`/`Label`/`Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue` de `@/components/ui/*`.
- Produces: `<EmpresaRegistrarScreen/>` montado en `/app/empresa/registrar`.

- [ ] **Step 1: Crear `src/portal/empresa/EmpresaRegistrarScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalData } from '@/portal/PortalDataContext'
import type { Empresa } from '@/portal/types'
import {
  ACTIVIDAD_ECONOMICA_OPTIONS,
  PROVINCIA_OPTIONS,
  REGIMEN_TRIBUTARIO_OPTIONS,
  SI_NO_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
} from './empresa-form-options'

type WizardStep = 1 | 2 | 3 | 4

type FormDraft = Pick<Empresa, 'nombre' | 'ruc' | 'general' | 'fiscal' | 'contacto' | 'representante' | 'ubicacion'>

const EMPTY_DRAFT: FormDraft = {
  nombre: '',
  ruc: '',
  general: { razonSocial: '', tipoContribuyente: 'Persona Natural', fechaConstitucion: '', numeroEmpleados: '' },
  fiscal: { regimenTributario: '', actividadEconomica: '', obligadoContabilidad: 'No', agenteRetencion: 'No' },
  contacto: { correo: '', telefono: '', sitioWeb: '' },
  representante: { nombre: '', cedula: '' },
  ubicacion: { provincia: '', ciudad: '', direccion: '' },
}

const STEPS: { n: WizardStep; label: string }[] = [
  { n: 1, label: 'Datos generales' },
  { n: 2, label: 'Datos fiscales' },
  { n: 3, label: 'Contacto y representante' },
  { n: 4, label: 'Revisión' },
]

function validateStep1(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.general.razonSocial.trim()) errors.razonSocial = 'La razón social es obligatoria.'
  if (!draft.nombre.trim()) errors.nombre = 'El nombre comercial es obligatorio.'
  if (!draft.ruc.trim()) errors.ruc = 'El RUC es obligatorio.'
  if (!draft.general.fechaConstitucion.trim()) errors.fechaConstitucion = 'La fecha de constitución es obligatoria.'
  if (!draft.general.numeroEmpleados.trim()) errors.numeroEmpleados = 'Indica el número de empleados.'
  return errors
}

function validateStep2(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.fiscal.regimenTributario) errors.regimenTributario = 'Selecciona un régimen tributario.'
  if (!draft.fiscal.actividadEconomica) errors.actividadEconomica = 'Selecciona una actividad económica.'
  return errors
}

function validateStep3(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.contacto.correo.trim()) errors.correo = 'El correo es obligatorio.'
  if (!draft.contacto.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.'
  if (!draft.representante.nombre.trim()) errors.representanteNombre = 'El nombre del representante es obligatorio.'
  if (!draft.representante.cedula.trim()) errors.representanteCedula = 'La cédula del representante es obligatoria.'
  if (!draft.ubicacion.provincia) errors.provincia = 'Selecciona una provincia.'
  if (!draft.ubicacion.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria.'
  if (!draft.ubicacion.direccion.trim()) errors.direccion = 'La dirección es obligatoria.'
  return errors
}

function buildIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  const letras = palabras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '')
  return letras.join('') || '??'
}

function ReviewGroup({ titulo, items }: { titulo: string; items: { label: string; valor: string }[] }) {
  return (
    <div className="rounded-lg border border-line/70 bg-surface p-4">
      <h3 className="text-sm font-semibold text-navy-700">{titulo}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className="min-w-0">
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{i.label}</dt>
            <dd className="mt-1 break-words text-[13.5px] leading-relaxed">{i.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  )
}

export function EmpresaRegistrarScreen() {
  const navigate = useNavigate()
  const { empresas, addEmpresa, setEmpresaActiva } = usePortalData()
  const [step, setStep] = useState<WizardStep>(1)
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateGeneral = (patch: Partial<FormDraft['general']>) =>
    setDraft((d) => ({ ...d, general: { ...d.general, ...patch } }))
  const updateFiscal = (patch: Partial<FormDraft['fiscal']>) =>
    setDraft((d) => ({ ...d, fiscal: { ...d.fiscal, ...patch } }))
  const updateContacto = (patch: Partial<FormDraft['contacto']>) =>
    setDraft((d) => ({ ...d, contacto: { ...d.contacto, ...patch } }))
  const updateRepresentante = (patch: Partial<FormDraft['representante']>) =>
    setDraft((d) => ({ ...d, representante: { ...d.representante, ...patch } }))
  const updateUbicacion = (patch: Partial<FormDraft['ubicacion']>) =>
    setDraft((d) => ({ ...d, ubicacion: { ...d.ubicacion, ...patch } }))

  const handleNext = () => {
    const stepErrors = step === 1 ? validateStep1(draft) : step === 2 ? validateStep2(draft) : validateStep3(draft)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    setStep((s) => (s < 4 ? ((s + 1) as WizardStep) : s))
  }

  const handleBack = () => {
    if (step === 1) {
      navigate(empresas.length > 0 ? '/app/empresa' : '/app/dashboard')
      return
    }
    setErrors({})
    setStep((s) => ((s - 1) as WizardStep))
  }

  const handleConfirmar = () => {
    const allErrors = { ...validateStep1(draft), ...validateStep2(draft), ...validateStep3(draft) }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setStep(1)
      return
    }
    const id = crypto.randomUUID()
    const nuevaEmpresa: Empresa = {
      id,
      nombre: draft.nombre,
      ruc: draft.ruc,
      iniciales: buildIniciales(draft.nombre),
      estado: 'Activa',
      plan: 'Plan Esencial',
      general: draft.general,
      fiscal: draft.fiscal,
      contacto: draft.contacto,
      representante: draft.representante,
      ubicacion: draft.ubicacion,
      meta: {
        fechaRegistroSafe: new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
      },
    }
    addEmpresa(nuevaEmpresa)
    setEmpresaActiva(id)
    navigate('/app/empresa')
  }

  return (
    <section className="flex flex-col gap-4.5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Registrar empresa</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Cuatro pasos. La empresa se crea solo cuando confirmes en la revisión.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2.5 sm:gap-4.5">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-center gap-2">
            <span
              className={`grid h-7.5 w-7.5 place-items-center rounded-full border text-[13px] font-bold ${
                s.n === step
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : s.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
            >
              {s.n}
            </span>
            <span className={`text-[13px] ${s.n === step ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">{STEPS[step - 1].label}</h2>

        {step === 1 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-razon-social">Razón social</Label>
              <Input
                id="reg-razon-social"
                value={draft.general.razonSocial}
                onChange={(e) => updateGeneral({ razonSocial: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.razonSocial} />
            </div>
            <div>
              <Label htmlFor="reg-nombre-comercial">Nombre comercial</Label>
              <Input
                id="reg-nombre-comercial"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                className="mt-1.5"
              />
              <FieldError message={errors.nombre} />
            </div>
            <div>
              <Label htmlFor="reg-ruc">RUC</Label>
              <Input
                id="reg-ruc"
                value={draft.ruc}
                onChange={(e) => setDraft((d) => ({ ...d, ruc: e.target.value }))}
                className="mt-1.5"
              />
              <FieldError message={errors.ruc} />
            </div>
            <div>
              <Label htmlFor="reg-tipo-contribuyente">Tipo de contribuyente</Label>
              <Select
                value={draft.general.tipoContribuyente}
                onValueChange={(v) => updateGeneral({ tipoContribuyente: v as Empresa['general']['tipoContribuyente'] })}
              >
                <SelectTrigger id="reg-tipo-contribuyente" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_CONTRIBUYENTE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reg-fecha-constitucion">Fecha de constitución</Label>
              <Input
                id="reg-fecha-constitucion"
                placeholder="Ej. 14 mar 2016"
                value={draft.general.fechaConstitucion}
                onChange={(e) => updateGeneral({ fechaConstitucion: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.fechaConstitucion} />
            </div>
            <div>
              <Label htmlFor="reg-num-empleados">Número de empleados</Label>
              <Input
                id="reg-num-empleados"
                type="number"
                min="0"
                value={draft.general.numeroEmpleados}
                onChange={(e) => updateGeneral({ numeroEmpleados: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.numeroEmpleados} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 flex flex-col gap-4.5">
            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="reg-regimen">Régimen tributario</Label>
                <Select value={draft.fiscal.regimenTributario} onValueChange={(v) => updateFiscal({ regimenTributario: v })}>
                  <SelectTrigger id="reg-regimen" className="mt-1.5">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMEN_TRIBUTARIO_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.regimenTributario} />
              </div>
              <div>
                <Label htmlFor="reg-actividad">Actividad económica</Label>
                <Select value={draft.fiscal.actividadEconomica} onValueChange={(v) => updateFiscal({ actividadEconomica: v })}>
                  <SelectTrigger id="reg-actividad" className="mt-1.5">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVIDAD_ECONOMICA_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.actividadEconomica} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-900">Obligado a llevar contabilidad</span>
                <div className="flex gap-2">
                  {SI_NO_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateFiscal({ obligadoContabilidad: o })}
                      aria-pressed={draft.fiscal.obligadoContabilidad === o}
                      className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                        draft.fiscal.obligadoContabilidad === o
                          ? 'border-navy-600 bg-navy-600 text-white'
                          : 'border-line bg-card text-ink-700'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-900">Agente de retención</span>
                <div className="flex gap-2">
                  {SI_NO_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateFiscal({ agenteRetencion: o })}
                      aria-pressed={draft.fiscal.agenteRetencion === o}
                      className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                        draft.fiscal.agenteRetencion === o
                          ? 'border-navy-600 bg-navy-600 text-white'
                          : 'border-line bg-card text-ink-700'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-correo">Correo</Label>
              <Input
                id="reg-correo"
                type="email"
                value={draft.contacto.correo}
                onChange={(e) => updateContacto({ correo: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.correo} />
            </div>
            <div>
              <Label htmlFor="reg-telefono">Teléfono</Label>
              <Input
                id="reg-telefono"
                value={draft.contacto.telefono}
                onChange={(e) => updateContacto({ telefono: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.telefono} />
            </div>
            <div>
              <Label htmlFor="reg-sitio-web">Sitio web (opcional)</Label>
              <Input
                id="reg-sitio-web"
                value={draft.contacto.sitioWeb}
                onChange={(e) => updateContacto({ sitioWeb: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="reg-rep-nombre">Nombre del representante legal</Label>
              <Input
                id="reg-rep-nombre"
                value={draft.representante.nombre}
                onChange={(e) => updateRepresentante({ nombre: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.representanteNombre} />
            </div>
            <div>
              <Label htmlFor="reg-rep-cedula">Cédula del representante</Label>
              <Input
                id="reg-rep-cedula"
                value={draft.representante.cedula}
                onChange={(e) => updateRepresentante({ cedula: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.representanteCedula} />
            </div>
            <div>
              <Label htmlFor="reg-provincia">Provincia</Label>
              <Select value={draft.ubicacion.provincia} onValueChange={(v) => updateUbicacion({ provincia: v })}>
                <SelectTrigger id="reg-provincia" className="mt-1.5">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIA_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.provincia} />
            </div>
            <div>
              <Label htmlFor="reg-ciudad">Ciudad</Label>
              <Input
                id="reg-ciudad"
                value={draft.ubicacion.ciudad}
                onChange={(e) => updateUbicacion({ ciudad: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.ciudad} />
            </div>
            <div>
              <Label htmlFor="reg-direccion">Dirección</Label>
              <Input
                id="reg-direccion"
                value={draft.ubicacion.direccion}
                onChange={(e) => updateUbicacion({ direccion: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.direccion} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 flex flex-col gap-4">
            <ReviewGroup
              titulo="Datos generales"
              items={[
                { label: 'Razón social', valor: draft.general.razonSocial },
                { label: 'Nombre comercial', valor: draft.nombre },
                { label: 'RUC', valor: draft.ruc },
                { label: 'Tipo de contribuyente', valor: draft.general.tipoContribuyente },
                { label: 'Fecha de constitución', valor: draft.general.fechaConstitucion },
                { label: 'Número de empleados', valor: draft.general.numeroEmpleados },
              ]}
            />
            <ReviewGroup
              titulo="Datos fiscales"
              items={[
                { label: 'Régimen tributario', valor: draft.fiscal.regimenTributario },
                { label: 'Actividad económica', valor: draft.fiscal.actividadEconomica },
                { label: 'Obligado a llevar contabilidad', valor: draft.fiscal.obligadoContabilidad },
                { label: 'Agente de retención', valor: draft.fiscal.agenteRetencion },
              ]}
            />
            <ReviewGroup
              titulo="Contacto y ubicación"
              items={[
                { label: 'Correo', valor: draft.contacto.correo },
                { label: 'Teléfono', valor: draft.contacto.telefono },
                { label: 'Sitio web', valor: draft.contacto.sitioWeb || 'No registrado' },
                { label: 'Provincia', valor: draft.ubicacion.provincia },
                { label: 'Ciudad', valor: draft.ubicacion.ciudad },
                { label: 'Dirección', valor: draft.ubicacion.direccion },
              ]}
            />
            <ReviewGroup
              titulo="Representante legal"
              items={[
                { label: 'Nombre', valor: draft.representante.nombre },
                { label: 'Cédula', valor: draft.representante.cedula },
              ]}
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
          >
            Atrás
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmar}
              className="min-h-11 rounded-lg bg-emerald-brand px-4.5 text-sm font-semibold text-white"
            >
              Registrar empresa
            </button>
          )}
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los existentes:

```tsx
import { EmpresaRegistrarScreen } from './portal/empresa/EmpresaRegistrarScreen'
```

Dentro de la ruta `"/app"`, agregar después de `<Route path="empresa" element={<EmpresaScreen />} />`:

```tsx
        <Route path="empresa/registrar" element={<EmpresaRegistrarScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, iniciar sesión, ir a `/app/empresa/registrar` (o desde el `CompanySwitcher` →
"Registrar otra empresa"):
- El indicador de 4 pasos se ve arriba; "Datos generales" está activo.
- Click en "Siguiente" sin llenar nada → deben aparecer mensajes de error bajo cada campo requerido y
  el paso NO avanza.
- Llenar el paso 1 completo → "Siguiente" avanza al paso 2 ("Datos fiscales"), con los selects y los
  toggles Sí/No de "Obligado a llevar contabilidad"/"Agente de retención".
- Llenar el paso 2 → "Siguiente" avanza al paso 3 ("Contacto y representante").
- Llenar el paso 3 → "Siguiente" avanza al paso 4 ("Revisión"), mostrando los 4 bloques de resumen con
  todos los datos ingresados.
- Click en "Atrás" en cualquier paso vuelve al anterior sin perder lo ya ingresado.
- Click en "Registrar empresa" en el paso 4 → navega a `/app/empresa` mostrando la empresa recién
  creada como activa; abrir el `CompanySwitcher` del Topbar y confirmar que la nueva empresa aparece
  en la lista con el check de activa.

- [ ] **Step 5: Commit**

```bash
git add src/portal/empresa/EmpresaRegistrarScreen.tsx src/App.tsx
git commit -m "feat: agregar wizard de Registrar empresa"
```

---

### Task 7: Pantalla "Editar empresa"

**Files:**
- Create: `src/portal/empresa/EmpresaEditarScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` (Task 2); opciones de `empresa-form-options.ts` (Task 4); componentes `ui/*`.
- Produces: `<EmpresaEditarScreen/>` montado en `/app/empresa/editar`.

- [ ] **Step 1: Crear `src/portal/empresa/EmpresaEditarScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalData } from '@/portal/PortalDataContext'
import {
  ACTIVIDAD_ECONOMICA_OPTIONS,
  PROVINCIA_OPTIONS,
  REGIMEN_TRIBUTARIO_OPTIONS,
  SI_NO_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
} from './empresa-form-options'

export function EmpresaEditarScreen() {
  const navigate = useNavigate()
  const { empresaActiva, updateEmpresa } = usePortalData()
  const [nombre, setNombre] = useState(empresaActiva.nombre)
  const [general, setGeneral] = useState(empresaActiva.general)
  const [contacto, setContacto] = useState(empresaActiva.contacto)
  const [representante, setRepresentante] = useState(empresaActiva.representante)
  const [ubicacion, setUbicacion] = useState(empresaActiva.ubicacion)
  const [fiscal, setFiscal] = useState(empresaActiva.fiscal)
  const [sensiblesTocados, setSensiblesTocados] = useState(false)

  const updateFiscal = (patch: Partial<typeof fiscal>) => {
    setFiscal((f) => ({ ...f, ...patch }))
    setSensiblesTocados(true)
  }

  const handleGuardar = () => {
    updateEmpresa(empresaActiva.id, { nombre, general, contacto, representante, ubicacion, fiscal })
    navigate('/app/empresa')
  }

  const handleCancelar = () => {
    navigate('/app/empresa')
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Editar empresa</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Los campos sensibles cambian el cálculo de obligaciones e indicadores y requieren confirmación.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-[17px] font-semibold">Datos generales</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-nombre-comercial">Nombre comercial</Label>
            <Input id="edit-nombre-comercial" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="edit-razon-social">Razón social</Label>
            <Input
              id="edit-razon-social"
              value={general.razonSocial}
              onChange={(e) => setGeneral((g) => ({ ...g, razonSocial: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-tipo-contribuyente">Tipo de contribuyente</Label>
            <Select
              value={general.tipoContribuyente}
              onValueChange={(v) => setGeneral((g) => ({ ...g, tipoContribuyente: v as typeof g.tipoContribuyente }))}
            >
              <SelectTrigger id="edit-tipo-contribuyente" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_CONTRIBUYENTE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-fecha-constitucion">Fecha de constitución</Label>
            <Input
              id="edit-fecha-constitucion"
              value={general.fechaConstitucion}
              onChange={(e) => setGeneral((g) => ({ ...g, fechaConstitucion: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-num-empleados">Número de empleados</Label>
            <Input
              id="edit-num-empleados"
              type="number"
              min="0"
              value={general.numeroEmpleados}
              onChange={(e) => setGeneral((g) => ({ ...g, numeroEmpleados: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-correo">Correo</Label>
            <Input
              id="edit-correo"
              type="email"
              value={contacto.correo}
              onChange={(e) => setContacto((c) => ({ ...c, correo: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-telefono">Teléfono</Label>
            <Input
              id="edit-telefono"
              value={contacto.telefono}
              onChange={(e) => setContacto((c) => ({ ...c, telefono: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-sitio-web">Sitio web</Label>
            <Input
              id="edit-sitio-web"
              value={contacto.sitioWeb}
              onChange={(e) => setContacto((c) => ({ ...c, sitioWeb: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-rep-nombre">Representante legal</Label>
            <Input
              id="edit-rep-nombre"
              value={representante.nombre}
              onChange={(e) => setRepresentante((r) => ({ ...r, nombre: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-rep-cedula">Cédula del representante</Label>
            <Input
              id="edit-rep-cedula"
              value={representante.cedula}
              onChange={(e) => setRepresentante((r) => ({ ...r, cedula: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-provincia">Provincia</Label>
            <Select value={ubicacion.provincia} onValueChange={(v) => setUbicacion((u) => ({ ...u, provincia: v }))}>
              <SelectTrigger id="edit-provincia" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVINCIA_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-ciudad">Ciudad</Label>
            <Input
              id="edit-ciudad"
              value={ubicacion.ciudad}
              onChange={(e) => setUbicacion((u) => ({ ...u, ciudad: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="edit-direccion">Dirección</Label>
            <Input
              id="edit-direccion"
              value={ubicacion.direccion}
              onChange={(e) => setUbicacion((u) => ({ ...u, direccion: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-brand bg-card p-5">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-[18px] w-[18px] text-amber-deep" aria-hidden="true" />
          <h2 className="text-[17px] font-semibold">Datos sensibles</h2>
        </div>
        <p className="mt-2 text-sm text-ink-700">
          Cambiarlos regenera obligaciones aplicables y recalcula el diagnóstico. Se confirma antes de guardar.
        </p>
        {sensiblesTocados && (
          <p role="status" className="mt-3.5 rounded-lg bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-amber-deep">
            Cambiaste datos fiscales. Al guardar, se recalcularán las obligaciones y el diagnóstico de esta empresa.
          </p>
        )}
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-regimen">Régimen tributario</Label>
            <Select value={fiscal.regimenTributario} onValueChange={(v) => updateFiscal({ regimenTributario: v })}>
              <SelectTrigger id="edit-regimen" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIMEN_TRIBUTARIO_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-actividad">Actividad económica</Label>
            <Select value={fiscal.actividadEconomica} onValueChange={(v) => updateFiscal({ actividadEconomica: v })}>
              <SelectTrigger id="edit-actividad" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVIDAD_ECONOMICA_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4.5 flex flex-wrap gap-6">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-900">Obligado a llevar contabilidad</span>
            <div className="flex gap-2">
              {SI_NO_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => updateFiscal({ obligadoContabilidad: o })}
                  aria-pressed={fiscal.obligadoContabilidad === o}
                  className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                    fiscal.obligadoContabilidad === o
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-900">Agente de retención</span>
            <div className="flex gap-2">
              {SI_NO_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => updateFiscal({ agenteRetencion: o })}
                  aria-pressed={fiscal.agenteRetencion === o}
                  className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                    fiscal.agenteRetencion === o
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4.5">
        <h2 className="text-[15px] font-semibold text-ink-700">No editables</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">RUC</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.ruc}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">Fecha de registro en SAFE</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.meta.fechaRegistroSafe}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">Plan</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.plan}</dd>
          </div>
        </dl>
      </section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-line bg-background py-3.5">
        <button
          type="button"
          onClick={handleCancelar}
          className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
        >
          Guardar cambios
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los existentes:

```tsx
import { EmpresaEditarScreen } from './portal/empresa/EmpresaEditarScreen'
```

Dentro de la ruta `"/app"`, agregar después de `<Route path="empresa/registrar" element={<EmpresaRegistrarScreen />} />`:

```tsx
        <Route path="empresa/editar" element={<EmpresaEditarScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, iniciar sesión, ir a `/app/empresa` → click "Editar empresa":
- El formulario aparece precargado con los datos de la empresa activa.
- Cambiar un campo de "Datos generales" (ej. teléfono) — no aparece ningún aviso.
- Cambiar el "Régimen tributario" (dato sensible) — aparece el aviso ámbar de recálculo.
- Click "Cancelar" → vuelve a `/app/empresa` sin que el cambio se haya guardado (los datos siguen
  siendo los originales).
- Repetir la edición, esta vez click "Guardar cambios" → vuelve a `/app/empresa` y el campo editado
  refleja el nuevo valor en la tab correspondiente.

- [ ] **Step 5: Commit**

```bash
git add src/portal/empresa/EmpresaEditarScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Editar empresa"
```

---

### Task 8: QA final, build y documentación

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: toda la Fase 2 ya construida.
- Produces: nada nuevo — solo verificación y documentación.

- [ ] **Step 1: Walkthrough completo manual**

Run: `npm run dev` y verificar, en orden:
1. Iniciar sesión → `/app/dashboard` muestra el saludo con la empresa activa por defecto (Textiles
   Andina S.A.).
2. Ir a `/app/empresa` (Sidebar → "Mi Empresa") → perfil completo con 5 tabs funcionando.
3. "Editar empresa" → cambiar un dato general y uno sensible (aparece el aviso) → "Guardar cambios" →
   vuelve a `/app/empresa` reflejando ambos cambios.
4. Volver a editar → esta vez "Cancelar" → confirmar que NO se guardó nada de esa segunda edición.
5. Topbar → `CompanySwitcher` → cambiar a "Comercial del Valle Cía. Ltda." → `/app/empresa` y el
   saludo del Dashboard reflejan el cambio de empresa activa.
6. Topbar → `CompanySwitcher` → "Registrar otra empresa" → completar el wizard de 4 pasos (probar que
   "Siguiente" bloquea con campos vacíos) → confirmar en el paso de Revisión → la nueva empresa queda
   activa y aparece en el selector.
7. `npm run build` limpio, sin errores ni warnings de TypeScript.

- [ ] **Step 2: Documentar la Fase 2 en `README.md`**

Agregar, dentro de la sección `## Portal privado (/app)` ya existente (agregada en la Fase 1), un
párrafo nuevo al final de esa sección:

```markdown

**Fase 2 (Mi Empresa):** agrega `src/portal/PortalDataContext.tsx`, el primer estado compartido real
del portal — reemplaza el mock estático de empresa de la Fase 1 por un contexto que permite cambiar de
empresa activa, registrar una nueva (`/app/empresa/registrar`, wizard de 4 pasos) y editarla
(`/app/empresa/editar`), todo en `src/portal/empresa/`. Los datos de empresa, a diferencia de la sesión
de auth, no persisten en `localStorage` — viven en memoria de React mientras dura la sesión del
navegador.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: documentar la Fase 2 del portal privado en el README"
```

---

## Self-Review Notes

- **Cobertura del spec:** tipo `Empresa` ampliado (Task 1), `PortalDataProvider` (Task 2), conexión de
  `CompanySwitcher`/saludo del Dashboard (Task 3), las 3 pantallas del módulo (Tasks 5-7) con sus rutas,
  formularios con componentes `ui/` existentes, aviso de datos sensibles sin recálculo real (Task 7),
  sin campos bloqueados por plan, sin persistencia en `localStorage` de datos de negocio — todo cubierto
  y sin huecos frente al spec de la Fase 2.
- **Placeholders:** ninguno — cada step trae código completo y funcional.
- **Consistencia de tipos:** `Empresa` se define una vez en `types.ts` (Task 1) y sus campos anidados
  (`general`, `fiscal`, `contacto`, `representante`, `ubicacion`, `meta`) se usan con el mismo nombre en
  `mock-portal-data.ts`, `PortalDataContext.tsx`, `CompanySwitcher.tsx`, `DashboardScreen.tsx`,
  `EmpresaScreen.tsx`, `EmpresaRegistrarScreen.tsx` y `EmpresaEditarScreen.tsx`. `usePortalData()` se
  define una vez (Task 2) y se consume con la misma forma (`empresaActiva`, `empresas`,
  `setEmpresaActiva`, `addEmpresa`, `updateEmpresa`) en todas las tasks siguientes. Las constantes de
  `empresa-form-options.ts` (Task 4) se importan con los mismos nombres en las Tasks 6 y 7.
