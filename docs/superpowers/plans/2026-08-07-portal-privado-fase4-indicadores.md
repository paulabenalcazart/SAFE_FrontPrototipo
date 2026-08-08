# Portal Privado — Fase 4 (Indicadores) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Indicadores" del portal privado — un resumen con 4 indicadores personalizables, benchmarking sectorial real, un puntaje de salud financiera ponderado por factor, una tabla completa de los 23 indicadores MVP filtrable, y comparación de dos periodos sobre esos 23 indicadores.

**Architecture:** Se extiende el motor puro de la Fase 3 (`src/portal/financiero/calculo.ts`) con `calcularSaludFinanciera()` (pondera por factor, no por indicador individual) y `listarIndicadores()` (catálogo estático sin depender de un registro). Un módulo de datos nuevo, `src/portal/indicadores/benchmarks.ts`, siembra la mediana sectorial por indicador (23 valores). `PortalDataContext` gana `indicadoresPrincipales: Record<empresaId, string[]>` — mismo patrón que `registrosFinancieros`. Cuatro pantallas nuevas bajo `src/portal/indicadores/` consumen todo esto; ninguna toca el Dashboard de Fase 1 ni las pantallas de Financiero de Fase 3.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, `react-router-dom`, `lucide-react`.

## Global Constraints

- Prototipo **solo frontend**, sin backend.
- `indicadoresPrincipales` **no** persiste en `localStorage` — vive en memoria de React (mismo patrón que `registrosFinancieros` de Fase 3).
- Semilla de `indicadoresPrincipales` para **ambas** empresas: `['LIQ_01', 'SOL_01', 'REN_04', 'REN_08']`.
- `calcularSaludFinanciera` pondera por **factor**, no por indicador individual: Liquidez 25% · Solvencia 25% · Gestión 20% · Rentabilidad 30%. Puntaje por semáforo: VERDE=100, AMARILLO=55, ROJO=15 (promedio simple dentro de cada factor). Etiqueta: ≥80 "Saludable", 60-79 "Estable", 40-59 "En riesgo", <40 "Crítico".
- Benchmarks: **solo la mediana** por indicador (no la distribución completa de percentiles) — los 23 valores exactos están en la Task 1 de este plan, tomados verbatim del spec.
- "Buscar profesional" navega a `/app/marketplace` — esa ruta no existe todavía en esta rama (la construye Paula en Fase 7); no romper nada si el `Outlet` no encuentra ninguna ruta hija ahí.
- Sin columna/botón de "Detalle" no-operativo en "Todos los indicadores" ni en "Comparar indicadores" — se omite directamente, no se deja un botón sin destino.
- El repo no tiene test runner ni eslint — verificación vía `npm run build` (type-check) + revisión manual. No agregar frameworks de testing.
- Reusar tokens y convenciones ya establecidos: `border-line/70` (no `border-line-soft`, no existe), `bg-card`/`bg-surface`, paleta navy/emerald/amber/destructive, controles de filtro con `min-h-10` + `text-[13px]` (mismo tamaño que los filtros de `FinancieroScreen`), botones de acción secundarios con `min-h-11` + `text-sm`, botones de tabla pequeños con `min-h-8.5` + `text-[12px]`, links de texto sin borde con `text-[12.5px] font-semibold text-navy-500`/`text-navy-600` sin `min-h` explícito (mismo patrón que "Ver" en `DetalleRegistroScreen`).

---

## File Structure

```
src/
├── App.tsx                                            # Modify: 4 rutas nuevas (Tasks 4, 5, 6, 7)
├── portal/
│   ├── types.ts                                        # Modify: SaludFinanciera (Task 1)
│   ├── PortalDataContext.tsx                           # Modify: indicadoresPrincipales (Task 3)
│   ├── data/
│   │   └── mock-portal-data.ts                          # Modify: indicadoresPrincipalesSemilla (Task 1)
│   ├── financiero/
│   │   └── calculo.ts                                   # Modify: calcularSaludFinanciera + listarIndicadores (Task 2)
│   └── indicadores/
│       ├── benchmarks.ts                                 # Create (Task 1): mediana sectorial, 23 valores
│       ├── descripciones.ts                              # Create (Task 1): descripción corta, 23 valores
│       ├── RentabilidadHistoricaChart.tsx                 # Create (Task 4): margen neto + ROE, 12 periodos
│       ├── LiquidezHistoricaChart.tsx                     # Create (Task 4): liquidez vs. benchmark
│       ├── IndicadoresScreen.tsx                          # Create (Task 4): Resumen
│       ├── IndicadoresPrincipalesScreen.tsx                # Create (Task 5): elegir 4
│       ├── TodosIndicadoresScreen.tsx                      # Create (Task 6): tabla completa
│       └── CompararIndicadoresScreen.tsx                   # Create (Task 7): comparar 2 periodos
```

`indicadores/` se agrupa aparte de `financiero/` porque es su propio sub-módulo con 4 pantallas relacionadas
— mismo patrón que ya usaron `dashboard/`, `empresa/` y `financiero/` en fases anteriores. Reusa (no
duplica) el motor de `financiero/calculo.ts` y `financiero/formato.ts`.

---

### Task 1: Tipo `SaludFinanciera` + `benchmarks.ts` + `descripciones.ts` + datos semilla

**Files:**
- Modify: `src/portal/types.ts`
- Modify: `src/portal/data/mock-portal-data.ts`
- Create: `src/portal/indicadores/benchmarks.ts`
- Create: `src/portal/indicadores/descripciones.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: el tipo `SaludFinanciera` (usado por la Task 2); `BENCHMARKS_SECTORIALES: Record<string, number>`
  (usado por las Tasks 4 y 6); `DESCRIPCION_INDICADOR: Record<string, string>` (usado por las Tasks 4 y 5);
  `indicadoresPrincipalesSemilla: Record<string, string[]>` (usado como semilla por la Task 3).

- [ ] **Step 1: Agregar el tipo `SaludFinanciera` al final de `src/portal/types.ts`**

```ts
export type SaludFinanciera = {
  puntaje: number // 0-100
  etiqueta: 'Saludable' | 'Estable' | 'En riesgo' | 'Crítico'
  factores: { factor: FactorIndicador; puntaje: number; peso: number }[] // 4 entradas
}
```

- [ ] **Step 2: Crear `src/portal/indicadores/benchmarks.ts`**

Mediana sectorial (clúster de Textiles Andina — fabricación de prendas de vestir) por cada uno de los 23
indicadores MVP:

```ts
export const BENCHMARKS_SECTORIALES: Record<string, number> = {
  LIQ_01: 1.6,
  LIQ_02: 1.0,
  SOL_01: 0.5,
  SOL_02: 1.2,
  SOL_03: 0.9,
  SOL_04: 0.55,
  SOL_05: 0.45,
  SOL_06: 4.0,
  SOL_07: 2.3,
  GES_01: 6.0,
  GES_02: 0.7,
  GES_03: 0.35,
  GES_04: 60,
  GES_06: 0.3,
  GES_07: 0.04,
  REN_01: 0.05,
  REN_02: 0.38,
  REN_03: 0.12,
  REN_04: 0.09,
  REN_05: 0.1,
  REN_07: 0.06,
  REN_08: 0.11,
  REN_09: 0.05,
}
```

- [ ] **Step 3: Crear `src/portal/indicadores/descripciones.ts`**

```ts
export const DESCRIPCION_INDICADOR: Record<string, string> = {
  LIQ_01: 'Capacidad para cubrir pasivos corrientes',
  LIQ_02: 'Liquidez sin depender del inventario',
  SOL_01: 'Participación de acreedores en los activos',
  SOL_02: 'Deuda frente a recursos propios',
  SOL_03: 'Cobertura del activo fijo con patrimonio',
  SOL_04: 'Proporción corriente de la deuda',
  SOL_05: 'Proporción no corriente de la deuda',
  SOL_06: 'Capacidad para cubrir gastos financieros',
  SOL_07: 'Activos por unidad de patrimonio',
  GES_01: 'Veces que rota la cartera',
  GES_02: 'Ventas generadas por activo fijo',
  GES_03: 'Eficiencia de los activos',
  GES_04: 'Días promedio de cobranza',
  GES_06: 'Peso de gastos operativos',
  GES_07: 'Peso de gastos financieros',
  REN_01: 'Capacidad de activos para producir utilidad',
  REN_02: 'Rentabilidad antes de gastos operativos',
  REN_03: 'Rentabilidad de la operación',
  REN_04: 'Utilidad neta por venta',
  REN_05: 'Rentabilidad operativa de recursos propios',
  REN_07: 'Rentabilidad operativa de activos',
  REN_08: 'Rentabilidad neta del patrimonio',
  REN_09: 'Rentabilidad neta de activos',
}
```

- [ ] **Step 4: Agregar `indicadoresPrincipalesSemilla` al final de `src/portal/data/mock-portal-data.ts`**

```ts
export const indicadoresPrincipalesSemilla: Record<string, string[]> = {
  'emp-1': ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08'],
  'emp-2': ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08'],
}
```

- [ ] **Step 5: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/portal/types.ts src/portal/data/mock-portal-data.ts src/portal/indicadores/benchmarks.ts src/portal/indicadores/descripciones.ts
git commit -m "feat: agregar tipo SaludFinanciera, benchmarks sectoriales y descripciones de indicadores"
```

---

### Task 2: Extender `calculo.ts` con `calcularSaludFinanciera` + `listarIndicadores`

**Files:**
- Modify: `src/portal/financiero/calculo.ts`

**Interfaces:**
- Consumes: `SaludFinanciera` (Task 1); `CATALOGO_INDICADORES`, `calcularIndicadores` (ya existen en este
  archivo desde Fase 3).
- Produces: `calcularSaludFinanciera(r: RegistroFinanciero): SaludFinanciera` (usado por la Task 4);
  `DescripcionIndicador` (tipo) y `listarIndicadores(): DescripcionIndicador[]` (usado por la Task 5).

- [ ] **Step 1: Ampliar el import de tipos en la línea 1 de `src/portal/financiero/calculo.ts`**

Reemplazar:

```ts
import type { FactorIndicador, IndicadorCalculado, RegistroFinanciero, SemaforoIndicador } from '@/portal/types'
```

por:

```ts
import type {
  FactorIndicador,
  IndicadorCalculado,
  RegistroFinanciero,
  SaludFinanciera,
  SemaforoIndicador,
} from '@/portal/types'
```

- [ ] **Step 2: Agregar `calcularSaludFinanciera` y `listarIndicadores` al final del archivo**

```ts
const PESO_FACTOR: Record<FactorIndicador, number> = {
  LIQUIDEZ: 0.25,
  SOLVENCIA: 0.25,
  GESTION: 0.2,
  RENTABILIDAD: 0.3,
}

function puntajeSemaforo(semaforo: SemaforoIndicador): number {
  switch (semaforo) {
    case 'VERDE':
      return 100
    case 'AMARILLO':
      return 55
    case 'ROJO':
      return 15
  }
}

export function calcularSaludFinanciera(r: RegistroFinanciero): SaludFinanciera {
  const indicadores = calcularIndicadores(r)
  const factores = (Object.keys(PESO_FACTOR) as FactorIndicador[]).map((factor) => {
    const delFactor = indicadores.filter((i) => i.factor === factor)
    const puntaje = delFactor.reduce((suma, i) => suma + puntajeSemaforo(i.semaforo), 0) / delFactor.length
    return { factor, puntaje, peso: PESO_FACTOR[factor] }
  })
  const puntaje = factores.reduce((suma, f) => suma + f.puntaje * f.peso, 0)
  const etiqueta: SaludFinanciera['etiqueta'] =
    puntaje >= 80 ? 'Saludable' : puntaje >= 60 ? 'Estable' : puntaje >= 40 ? 'En riesgo' : 'Crítico'
  return { puntaje, etiqueta, factores }
}

export type DescripcionIndicador = Pick<IndicadorCalculado, 'codigo' | 'factor' | 'nombre' | 'unidad' | 'mejorSiMayor'>

export function listarIndicadores(): DescripcionIndicador[] {
  return CATALOGO_INDICADORES.map((def) => ({
    codigo: def.codigo,
    factor: def.factor,
    nombre: def.nombre,
    unidad: def.unidad,
    mejorSiMayor: def.mejorSiMayor,
  }))
}
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { calcularSaludFinanciera, listarIndicadores } from './src/portal/financiero/calculo.ts'
import { registrosFinancierosSemilla } from './src/portal/data/mock-portal-data.ts'
const julio = registrosFinancierosSemilla['emp-1'].find(r => r.periodo === '2026-07-01' && r.estado === 'VIGENTE')
const salud = calcularSaludFinanciera(julio)
console.log('puntaje', Math.round(salud.puntaje), 'etiqueta', salud.etiqueta)
console.log('factores', salud.factores.map(f => f.factor + ':' + Math.round(f.puntaje)))
console.log('catalogo length', listarIndicadores().length)
"`

Si `npx tsx` falla por no poder resolver el alias `@/`, no es bloqueante (ver nota de la Fase 3) — confiar en
`npm run build`. Expected si corre: `puntaje` cercano a `72`, `etiqueta 'Estable'`, `catalogo length 23`.

- [ ] **Step 5: Commit**

```bash
git add src/portal/financiero/calculo.ts
git commit -m "feat: agregar calcularSaludFinanciera y listarIndicadores al motor de calculo"
```

---

### Task 3: Extender `PortalDataContext` con `indicadoresPrincipales`

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `indicadoresPrincipalesSemilla` (Task 1).
- Produces: `usePortalData()` gana `indicadoresPrincipales: Record<string, string[]>`,
  `setIndicadoresPrincipales(empresaId: string, codigos: string[]): void` — usados por las Tasks 4 y 5.

- [ ] **Step 1: Reemplazar el contenido de `src/portal/PortalDataContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa, RegistroFinanciero } from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
} from './data/mock-portal-data'

type PortalDataContextValue = {
  empresas: Empresa[]
  empresaActivaId: string
  empresaActiva: Empresa
  setEmpresaActiva: (id: string) => void
  addEmpresa: (empresa: Empresa) => void
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void
  registrosFinancieros: Record<string, RegistroFinanciero[]>
  addRegistroFinanciero: (empresaId: string, registro: RegistroFinanciero) => void
  updateRegistroFinanciero: (empresaId: string, id: string, patch: Partial<RegistroFinanciero>) => void
  indicadoresPrincipales: Record<string, string[]>
  setIndicadoresPrincipales: (empresaId: string, codigos: string[]) => void
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasSemilla)
  const [empresaActivaId, setEmpresaActivaId] = useState(empresaSemilla.id)
  const [registrosFinancieros, setRegistrosFinancieros] = useState<Record<string, RegistroFinanciero[]>>(
    registrosFinancierosSemilla,
  )
  const [indicadoresPrincipales, setIndicadoresPrincipalesState] = useState<Record<string, string[]>>(
    indicadoresPrincipalesSemilla,
  )

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

  const addRegistroFinanciero = (empresaId: string, registro: RegistroFinanciero) => {
    setRegistrosFinancieros((current) => ({
      ...current,
      [empresaId]: [...(current[empresaId] ?? []), registro],
    }))
  }

  const updateRegistroFinanciero = (empresaId: string, id: string, patch: Partial<RegistroFinanciero>) => {
    setRegistrosFinancieros((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }))
  }

  const setIndicadoresPrincipales = (empresaId: string, codigos: string[]) => {
    setIndicadoresPrincipalesState((current) => ({ ...current, [empresaId]: codigos }))
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
        registrosFinancieros,
        addRegistroFinanciero,
        updateRegistroFinanciero,
        indicadoresPrincipales,
        setIndicadoresPrincipales,
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

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Verificación manual**

Run: `npm run dev`, iniciar sesión, confirmar que `/app/dashboard`, `/app/empresa` y las 4 pantallas de
`/app/financiero` se ven y funcionan exactamente igual que antes de este cambio.

- [ ] **Step 4: Commit**

```bash
git add src/portal/PortalDataContext.tsx
git commit -m "feat: extender PortalDataContext con indicadoresPrincipales"
```

---

### Task 4: Pantalla "Indicadores" (Resumen) + 2 gráficos + ruta

**Files:**
- Create: `src/portal/indicadores/RentabilidadHistoricaChart.tsx`
- Create: `src/portal/indicadores/LiquidezHistoricaChart.tsx`
- Create: `src/portal/indicadores/IndicadoresScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `registrosFinancieros`, `indicadoresPrincipales` (Task 3);
  `calcularIndicadores`, `calcularSaludFinanciera` (Task 2); `BENCHMARKS_SECTORIALES` (Task 1);
  `DESCRIPCION_INDICADOR` (Task 1); `formatPeriodo` (`financiero/formato.ts`, ya existe).
- Produces: ruta `/app/indicadores` montada (reemplaza el nav item "Indicadores" que desde Fase 1 no tenía
  pantalla).

- [ ] **Step 1: Crear `src/portal/indicadores/RentabilidadHistoricaChart.tsx`**

```tsx
import type { RegistroFinanciero } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'

const CHART_HEIGHT = 200
const CHART_WIDTH = 560

function buildPoints(values: number[], max: number) {
  if (values.length < 2) return ''
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => `${(index * step).toFixed(1)},${(CHART_HEIGHT - (value / max) * CHART_HEIGHT).toFixed(1)}`)
    .join(' ')
}

export function RentabilidadHistoricaChart({ registros }: { registros: RegistroFinanciero[] }) {
  const ordenados = [...registros]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[16px] font-semibold">Rentabilidad histórica</h2>
      <p className="mt-1 text-[12px] text-ink-500">Margen neto (REN_04) y ROE (REN_08) · 12 periodos</p>

      {ordenados.length < 2 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[30ch] text-center text-[13px] text-ink-500">Sin periodos para graficar</p>
        </div>
      ) : (
        <>
          {(() => {
            const margen = ordenados.map((r) => calcularIndicadores(r).find((i) => i.codigo === 'REN_04')!.valor)
            const roe = ordenados.map((r) => calcularIndicadores(r).find((i) => i.codigo === 'REN_08')!.valor)
            const max = Math.max(...margen, ...roe) * 1.15
            const yTicks = [max, max / 2, 0].map((v) => `${Math.round(v * 100)}%`)

            return (
              <>
                <div className="mt-3.5 flex gap-2.5">
                  <div
                    className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
                    style={{ height: CHART_HEIGHT }}
                  >
                    {yTicks.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </div>
                  <div
                    className="relative min-w-0 flex-1 border-b border-l border-line/70"
                    style={{ height: CHART_HEIGHT }}
                  >
                    <svg
                      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                      preserveAspectRatio="none"
                      className="absolute inset-0 h-full w-full"
                      aria-label="Margen neto y ROE por periodo"
                    >
                      <polyline points={buildPoints(margen, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(roe, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    </svg>
                  </div>
                </div>
                <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
                  {ordenados.map((r) => (
                    <span key={r.id}>{formatPeriodo(r.periodo).slice(0, 3)}</span>
                  ))}
                </div>
              </>
            )
          })()}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3">
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
              Margen neto
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
              ROE
            </span>
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Crear `src/portal/indicadores/LiquidezHistoricaChart.tsx`**

```tsx
import type { RegistroFinanciero } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { BENCHMARKS_SECTORIALES } from './benchmarks'

const CHART_HEIGHT = 200
const CHART_WIDTH = 560

function buildPoints(values: number[], max: number) {
  if (values.length < 2) return ''
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => `${(index * step).toFixed(1)},${(CHART_HEIGHT - (value / max) * CHART_HEIGHT).toFixed(1)}`)
    .join(' ')
}

export function LiquidezHistoricaChart({ registros }: { registros: RegistroFinanciero[] }) {
  const ordenados = [...registros]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)
  const benchmark = BENCHMARKS_SECTORIALES.LIQ_01

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[16px] font-semibold">Liquidez histórica</h2>
      <p className="mt-1 text-[12px] text-ink-500">Liquidez corriente (LIQ_01) contra la mediana del clúster</p>

      {ordenados.length < 2 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[30ch] text-center text-[13px] text-ink-500">Sin periodos para graficar</p>
        </div>
      ) : (
        <>
          {(() => {
            const liquidez = ordenados.map((r) => calcularIndicadores(r).find((i) => i.codigo === 'LIQ_01')!.valor)
            const max = Math.max(...liquidez, benchmark) * 1.15
            const bench = ordenados.map(() => benchmark)
            const yTicks = [max, max / 2, 0].map((v) => v.toFixed(1))

            return (
              <div className="mt-3.5 flex gap-2.5">
                <div
                  className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
                  style={{ height: CHART_HEIGHT }}
                >
                  {yTicks.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
                <div className="relative min-w-0 flex-1 border-b border-l border-line/70" style={{ height: CHART_HEIGHT }}>
                  <svg
                    viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full"
                    aria-label="Liquidez corriente contra la mediana del clúster"
                  >
                    <polyline points={buildPoints(bench, max)} fill="none" stroke="var(--color-ink-500)" strokeWidth={4} strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
                    <polyline points={buildPoints(liquidez, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                  </svg>
                </div>
              </div>
            )
          })()}
          <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3">
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
              Tu empresa
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-ink-500" aria-hidden="true" />
              Mediana del clúster
            </span>
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Crear `src/portal/indicadores/IndicadoresScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador } from '@/portal/types'
import { calcularIndicadores, calcularSaludFinanciera } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { DESCRIPCION_INDICADOR } from './descripciones'
import { RentabilidadHistoricaChart } from './RentabilidadHistoricaChart'
import { LiquidezHistoricaChart } from './LiquidezHistoricaChart'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const SEMAFORO_BADGE: Record<'VERDE' | 'AMARILLO' | 'ROJO', string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

const ESPECIALIDAD_POR_FACTOR: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Contador',
  SOLVENCIA: 'Asesor financiero',
  GESTION: 'Contador',
  RENTABILIDAD: 'Asesor financiero',
}

function colorPuntaje(puntaje: number): string {
  if (puntaje >= 80) return 'bg-emerald-brand'
  if (puntaje >= 60) return 'bg-navy-500'
  if (puntaje >= 40) return 'bg-amber-brand'
  return 'bg-destructive'
}

export function IndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros, indicadoresPrincipales } = usePortalData()

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const elegibles = [...registros]
    .filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)

  const [periodoId, setPeriodoId] = useState(elegibles[0]?.id ?? '')
  const registro = elegibles.find((r) => r.id === periodoId) ?? elegibles[0]

  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Indicadores financieros</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">
            {empresaActiva.nombre} todavía no tiene periodos financieros cargados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/financiero/nuevo')}
          className="min-h-11 w-fit rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
        >
          Nueva carga financiera
        </button>
      </section>
    )
  }

  const codigosPrincipales = indicadoresPrincipales[empresaActiva.id] ?? []
  const indicadores = calcularIndicadores(registro)
  const principales = codigosPrincipales
    .map((codigo) => indicadores.find((i) => i.codigo === codigo))
    .filter((i): i is NonNullable<typeof i> => Boolean(i))

  const anterior = [...registros]
    .filter((r) => r.estado === 'VIGENTE' && r.periodo < registro.periodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  const indicadoresAnterior = anterior ? calcularIndicadores(anterior) : []

  const variacionTexto = (codigo: string, valorActual: number, mejorSiMayor: boolean) => {
    const previo = indicadoresAnterior.find((i) => i.codigo === codigo)
    if (!previo) return { texto: 'Sin periodo anterior', fg: 'text-ink-500' }
    const dif = valorActual - previo.valor
    const favorable = mejorSiMayor ? dif >= 0 : dif <= 0
    return {
      texto: `${dif >= 0 ? '+' : ''}${dif.toFixed(2)} vs. periodo anterior`,
      fg: favorable ? 'text-emerald-deep' : 'text-destructive',
    }
  }

  const salud = calcularSaludFinanciera(registro)
  const rojos = indicadores.filter((i) => i.semaforo === 'ROJO')
  const amarillos = indicadores.filter((i) => i.semaforo === 'AMARILLO').slice(0, 3)
  const irAMarketplace = () => navigate('/app/marketplace')

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Indicadores financieros</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">Periodo analizado: {formatPeriodo(registro.periodo)}</p>
        </div>
        <div className="flex flex-wrap items-end gap-2.5">
          <select
            value={registro.id}
            onChange={(e) => setPeriodoId(e.target.value)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            {elegibles.map((r) => (
              <option key={r.id} value={r.id}>
                {formatPeriodo(r.periodo)} (v{r.version})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => navigate('/app/financiero/comparar')}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-ink-700"
          >
            Comparar periodos
          </button>
          <button
            type="button"
            onClick={() => navigate('/app/indicadores/principales')}
            className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-[13.5px] font-semibold text-ink-700"
          >
            Cambiar indicadores principales
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 className="text-[18px] font-semibold">Indicadores principales</h2>
        <button type="button" onClick={() => navigate('/app/indicadores/todos')} className="text-[13px] font-semibold text-navy-500">
          Ver todos los indicadores
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {principales.map((i) => {
          const variacion = variacionTexto(i.codigo, i.valor, i.mejorSiMayor)
          return (
            <div key={i.codigo} className="flex min-h-[216px] flex-col gap-2 rounded-xl border border-line bg-card p-4.5">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[11px] font-semibold text-navy-700">
                  {FACTOR_LABEL[i.factor]}
                </span>
                <span className="font-mono text-[10.5px] text-ink-500">{i.codigo}</span>
              </div>
              <h3 className="text-[14.5px] font-semibold leading-tight">{i.nombre}</h3>
              <span className="num font-display text-[28px] font-bold leading-none">{i.valorFormateado}</span>
              <span className={`inline-block w-fit rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>
                {i.semaforo}
              </span>
              <span className={`text-[12px] font-semibold ${variacion.fg}`}>{variacion.texto}</span>
              <p className="line-clamp-3 text-[12.5px] leading-snug text-ink-700">{DESCRIPCION_INDICADOR[i.codigo]}</p>
              <button
                type="button"
                onClick={() => navigate('/app/indicadores/todos')}
                className="mt-auto min-h-8.5 w-fit rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700"
              >
                Ver detalle
              </button>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RentabilidadHistoricaChart registros={registros} />
        <LiquidezHistoricaChart registros={registros} />
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-[16px] font-semibold">Salud financiera</h2>
          <span className="num font-display text-[26px] font-bold">{Math.round(salud.puntaje)}</span>
          <span className="text-[13px] text-ink-700">{salud.etiqueta}</span>
        </div>
        <div className="mt-3.5 flex flex-col gap-2.5">
          {salud.factores.map((f) => (
            <div key={f.factor} className="flex items-center gap-3">
              <span className="w-[100px] flex-none text-[12.5px] font-semibold">{FACTOR_LABEL[f.factor]}</span>
              <span className="h-[9px] flex-1 overflow-hidden rounded-full bg-surface">
                <span className={`block h-full rounded-full ${colorPuntaje(f.puntaje)}`} style={{ width: `${Math.round(f.puntaje)}%` }} />
              </span>
              <span className="num w-10 flex-none text-right text-[12.5px] font-semibold">{Math.round(f.puntaje)}</span>
              <span className="w-11 flex-none text-right text-[11.5px] text-ink-500">{Math.round(f.peso * 100)}%</span>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Alertas financieras</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {rojos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin alertas para este periodo.</p>
            ) : (
              rojos.map((i) => (
                <div key={i.codigo} className="rounded-lg bg-danger-soft p-3">
                  <span className="rounded-full bg-card px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-destructive">
                    Riesgo
                  </span>
                  <p className="mt-2 text-[13px] leading-snug">
                    {i.nombre} está en {i.valorFormateado}, fuera del rango saludable.
                  </p>
                  <button type="button" onClick={irAMarketplace} className="mt-1.5 text-[12.5px] font-semibold text-navy-600">
                    Buscar {ESPECIALIDAD_POR_FACTOR[i.factor]}
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {amarillos.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin recomendaciones para este periodo.</p>
            ) : (
              amarillos.map((i) => (
                <div key={i.codigo} className="rounded-lg border border-line/70 bg-surface p-3">
                  <p className="text-[13px] leading-snug">
                    {i.nombre} está en {i.valorFormateado} — cerca del límite saludable.
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[11.5px] text-ink-500">Prioridad media</span>
                    <button type="button" onClick={irAMarketplace} className="text-[12.5px] font-semibold text-navy-600">
                      Buscar profesional
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los existentes (después de la línea de `CompararPeriodosScreen`):

```tsx
import { IndicadoresScreen } from './portal/indicadores/IndicadoresScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `financiero/:id`:

```tsx
        <Route path="indicadores" element={<IndicadoresScreen />} />
```

- [ ] **Step 5: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 6: Verificación manual**

Run: `npm run dev`, iniciar sesión, ir a `/app/indicadores` (o clic en "Indicadores" en el sidebar):
confirmar 4 cards principales (LIQ_01, SOL_01, REN_04, REN_08) con valores/semáforos coherentes con lo que
ya mostraba `DetalleRegistroScreen` de Fase 3 para julio 2026, los 2 gráficos históricos con datos, "Salud
financiera" con puntaje cercano a 72 ("Estable") y 4 barras, y al menos una alerta en la sección de Gestión
(los indicadores GES_01-04 salen en rojo con los datos semilla). Cambiar de empresa a Comercial del Valle y
confirmar el estado vacío con el botón "Nueva carga financiera".

- [ ] **Step 7: Commit**

```bash
git add src/portal/indicadores/RentabilidadHistoricaChart.tsx src/portal/indicadores/LiquidezHistoricaChart.tsx src/portal/indicadores/IndicadoresScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Indicadores (resumen)"
```

---

### Task 5: Pantalla "Elegir indicadores principales" + ruta

**Files:**
- Create: `src/portal/indicadores/IndicadoresPrincipalesScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `indicadoresPrincipales`, `setIndicadoresPrincipales`
  (Task 3); `listarIndicadores` (Task 2); `DESCRIPCION_INDICADOR` (Task 1).
- Produces: ruta `/app/indicadores/principales` montada.

- [ ] **Step 1: Crear `src/portal/indicadores/IndicadoresPrincipalesScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador } from '@/portal/types'
import { listarIndicadores } from '@/portal/financiero/calculo'
import { DESCRIPCION_INDICADOR } from './descripciones'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const CATALOGO = listarIndicadores()

export function IndicadoresPrincipalesScreen() {
  const navigate = useNavigate()
  const { empresaActiva, indicadoresPrincipales, setIndicadoresPrincipales } = usePortalData()
  const [seleccion, setSeleccion] = useState<string[]>(indicadoresPrincipales[empresaActiva.id] ?? [])
  const [mensaje, setMensaje] = useState('')

  const agregar = (codigo: string) => {
    if (seleccion.includes(codigo) || seleccion.length >= 4) return
    setSeleccion((s) => [...s, codigo])
    setMensaje('')
  }

  const quitar = (codigo: string) => {
    setSeleccion((s) => s.filter((c) => c !== codigo))
    setMensaje('')
  }

  const guardar = () => {
    if (seleccion.length !== 4) {
      setMensaje('Elige exactamente cuatro indicadores.')
      return
    }
    setIndicadoresPrincipales(empresaActiva.id, seleccion)
    setMensaje('Guardado.')
  }

  const slotsVacios = Array.from({ length: Math.max(0, 4 - seleccion.length) }, (_, i) => seleccion.length + i + 1)

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Indicadores principales</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">Elige exactamente cuatro indicadores. Se guardan por empresa.</p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Seleccionados</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {seleccion.map((codigo, index) => {
            const ind = CATALOGO.find((i) => i.codigo === codigo)!
            return (
              <div key={codigo} className="relative rounded-lg border border-navy-500 bg-card p-3.5">
                <span className="text-[11px] font-bold text-navy-600">{index + 1}</span>
                <p className="mt-1.5 text-[14px] font-semibold leading-tight">{ind.nombre}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-500">
                  {FACTOR_LABEL[ind.factor]} · {ind.codigo}
                </p>
                <button
                  type="button"
                  onClick={() => quitar(codigo)}
                  aria-label="Quitar indicador"
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full border border-line bg-card text-ink-700"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            )
          })}
          {slotsVacios.map((n) => (
            <div key={n} className="grid min-h-[96px] place-items-center rounded-lg border border-dashed border-line bg-surface p-3.5">
              <span className="text-[12.5px] text-ink-500">Slot {n} disponible</span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line/70 pt-3.5">
          <p className="text-[12.5px] text-ink-500">{mensaje}</p>
          <button type="button" onClick={guardar} className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white">
            Guardar
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Todos los indicadores MVP</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {CATALOGO.map((ind) => {
            const seleccionado = seleccion.includes(ind.codigo)
            const deshabilitado = seleccionado || seleccion.length >= 4
            return (
              <div
                key={ind.codigo}
                className="flex flex-col gap-1.5 rounded-lg border border-line bg-card p-3.5"
                style={{ opacity: deshabilitado && !seleccionado ? 0.6 : 1 }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-full bg-navy-100 px-2 py-0.5 text-[10.5px] font-semibold text-navy-700">
                    {FACTOR_LABEL[ind.factor]}
                  </span>
                  <span className="font-mono text-[10.5px] text-ink-500">{ind.codigo}</span>
                </div>
                <p className="text-[14px] font-semibold leading-tight">{ind.nombre}</p>
                <p className="text-[12.5px] leading-snug text-ink-700">{DESCRIPCION_INDICADOR[ind.codigo]}</p>
                <span className="text-[11.5px] text-ink-500">{ind.unidad}</span>
                <button
                  type="button"
                  onClick={() => agregar(ind.codigo)}
                  disabled={deshabilitado}
                  className="mt-auto min-h-8.5 w-fit rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700 disabled:opacity-50"
                >
                  {seleccionado ? 'Agregado' : 'Agregar'}
                </button>
              </div>
            )
          })}
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto al de `IndicadoresScreen`:

```tsx
import { IndicadoresPrincipalesScreen } from './portal/indicadores/IndicadoresPrincipalesScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `indicadores`:

```tsx
        <Route path="indicadores/principales" element={<IndicadoresPrincipalesScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, ir a `/app/indicadores`, clic en "Cambiar indicadores principales": confirmar los 4
slots llenos con LIQ_01/SOL_01/REN_04/REN_08, quitar uno (aparece un slot vacío), agregar un indicador
distinto desde "Todos los indicadores MVP" (el botón "Agregar" de los ya seleccionados debe decir
"Agregado" y estar deshabilitado; con 4 llenos, el resto de los botones "Agregar" quedan deshabilitados),
guardar, volver a "Indicadores" y confirmar que las 4 cards reflejan la nueva selección. Repetir con
Comercial del Valle (sin registros financieros) y confirmar que la pantalla funciona igual — no depende de
tener datos cargados.

- [ ] **Step 5: Commit**

```bash
git add src/portal/indicadores/IndicadoresPrincipalesScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Elegir indicadores principales"
```

---

### Task 6: Pantalla "Todos los indicadores" + ruta

**Files:**
- Create: `src/portal/indicadores/TodosIndicadoresScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `registrosFinancieros` (Task 3); `calcularIndicadores`
  (ya existe); `BENCHMARKS_SECTORIALES` (Task 1).
- Produces: ruta `/app/indicadores/todos` montada.

- [ ] **Step 1: Crear `src/portal/indicadores/TodosIndicadoresScreen.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingDown, TrendingUp } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador, SemaforoIndicador } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'
import { BENCHMARKS_SECTORIALES } from './benchmarks'

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

const INDICADORES_FASE2 = [
  { codigo: 'SOL_08', nombre: 'Apalancamiento financiero', formula: '(UAI / Patrimonio) / (UAII / Activo total)' },
  { codigo: 'SOL_09', nombre: 'Fortaleza patrimonial', formula: 'Capital social / Patrimonio' },
  { codigo: 'SOL_10', nombre: 'Endeudamiento patrimonial corriente', formula: 'Pasivo corriente / Patrimonio' },
  { codigo: 'SOL_11', nombre: 'Endeudamiento patrimonial no corriente', formula: 'Pasivo no corriente / Patrimonio' },
  { codigo: 'SOL_12', nombre: 'Apalancamiento a corto y largo plazo', formula: '(Pasivo corriente + Pasivo no corriente) / Patrimonio' },
  { codigo: 'GES_05', nombre: 'Periodo medio de pago', formula: 'Cuentas por pagar × 365 / Compras del periodo' },
  { codigo: 'REN_06', nombre: 'Rentabilidad financiera', formula: '(Ingresos/Activo) × (UAII/Ingresos) × (Activo/Patrimonio) × (UAI/UAII) × (Utilidad neta/UAI)' },
]

function formatBenchmark(codigo: string, unidad: 'RATIO' | 'PORCENTAJE' | 'VECES' | 'DIAS'): string {
  const valor = BENCHMARKS_SECTORIALES[codigo]
  if (valor === undefined) return '—'
  if (unidad === 'PORCENTAJE') return `${(valor * 100).toFixed(1)}%`
  if (unidad === 'DIAS') return `${Math.round(valor)} días`
  if (unidad === 'VECES') return `${valor.toFixed(2)}x`
  return valor.toFixed(2)
}

export function TodosIndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()
  const [busqueda, setBusqueda] = useState('')
  const [factorFiltro, setFactorFiltro] = useState<'todos' | FactorIndicador>('todos')
  const [semaforoFiltro, setSemaforoFiltro] = useState<'todos' | SemaforoIndicador>('todos')
  const [fase2Abierta, setFase2Abierta] = useState(false)

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const registro = [...registros].filter((r) => r.estado === 'VIGENTE').sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <p className="text-[14px] text-ink-700">{empresaActiva.nombre} todavía no tiene periodos vigentes.</p>
      </section>
    )
  }

  const anterior = [...registros]
    .filter((r) => r.estado === 'VIGENTE' && r.periodo < registro.periodo)
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]
  const indicadoresAnterior = anterior ? calcularIndicadores(anterior) : []

  const indicadores = calcularIndicadores(registro)
  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return indicadores.filter((i) => {
      if (factorFiltro !== 'todos' && i.factor !== factorFiltro) return false
      if (semaforoFiltro !== 'todos' && i.semaforo !== semaforoFiltro) return false
      return !q || i.nombre.toLowerCase().includes(q) || i.codigo.toLowerCase().includes(q)
    })
  }, [indicadores, factorFiltro, semaforoFiltro, busqueda])

  const grupos = (['LIQUIDEZ', 'SOLVENCIA', 'GESTION', 'RENTABILIDAD'] as FactorIndicador[])
    .map((factor) => ({ factor, items: filtrados.filter((i) => i.factor === factor) }))
    .filter((g) => g.items.length > 0)

  const tendencia = (codigo: string, valorActual: number, mejorSiMayor: boolean) => {
    const previo = indicadoresAnterior.find((i) => i.codigo === codigo)
    if (!previo) return null
    const sube = valorActual > previo.valor
    return { sube, favorable: mejorSiMayor ? sube : !sube }
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Todos los indicadores</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">Solo indicadores en fase MVP. {formatPeriodo(registro.periodo)}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Buscar</label>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Nombre o código"
            className="min-h-10 w-full rounded-md border border-line bg-card px-2.5 text-[13px]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Factor</label>
          <select
            value={factorFiltro}
            onChange={(e) => setFactorFiltro(e.target.value as typeof factorFiltro)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            <option value="todos">Todos</option>
            <option value="LIQUIDEZ">Liquidez</option>
            <option value="SOLVENCIA">Solvencia</option>
            <option value="GESTION">Gestión</option>
            <option value="RENTABILIDAD">Rentabilidad</option>
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Semáforo</label>
          <select
            value={semaforoFiltro}
            onChange={(e) => setSemaforoFiltro(e.target.value as typeof semaforoFiltro)}
            className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
          >
            <option value="todos">Todos</option>
            <option value="VERDE">Verde</option>
            <option value="AMARILLO">Amarillo</option>
            <option value="ROJO">Rojo</option>
          </select>
        </div>
      </div>

      {grupos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-10 text-center text-[13.5px] text-ink-500">
          Ningún indicador coincide con los filtros.
        </p>
      ) : (
        grupos.map((g) => (
          <section key={g.factor} className="overflow-hidden rounded-xl border border-line bg-card">
            <h2 className="border-b border-line/70 bg-surface px-4.5 py-3.5 text-[16px] font-semibold">{FACTOR_LABEL[g.factor]}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-[13px]">
                <thead>
                  <tr className="text-left text-ink-500">
                    <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase">Indicador</th>
                    <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase">Valor</th>
                    <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase">Unidad</th>
                    <th scope="col" className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase">Tendencia</th>
                    <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase">Semáforo</th>
                    <th scope="col" className="px-4.5 py-2.5 text-right text-[11px] font-semibold uppercase">Benchmark</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((i) => {
                    const t = tendencia(i.codigo, i.valor, i.mejorSiMayor)
                    return (
                      <tr key={i.codigo} className="border-t border-line/70">
                        <td className="px-4.5 py-2.5">
                          <span className="block font-semibold">{i.nombre}</span>
                          <span className="font-mono text-[10.5px] text-ink-500">{i.codigo}</span>
                        </td>
                        <td className="num px-2 py-2.5 text-right font-semibold">{i.valorFormateado}</td>
                        <td className="px-2 py-2.5 text-[12.5px] text-ink-700">{i.unidad}</td>
                        <td className="px-2 py-2.5 text-center">
                          {t ? (
                            t.sube ? (
                              <TrendingUp className={`inline h-[15px] w-[15px] ${t.favorable ? 'text-emerald-deep' : 'text-destructive'}`} aria-label="Sube vs. periodo anterior" />
                            ) : (
                              <TrendingDown className={`inline h-[15px] w-[15px] ${t.favorable ? 'text-emerald-deep' : 'text-destructive'}`} aria-label="Baja vs. periodo anterior" />
                            )
                          ) : (
                            <span className="text-[11.5px] text-ink-500">—</span>
                          )}
                        </td>
                        <td className="px-2 py-2.5">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>{i.semaforo}</span>
                        </td>
                        <td className="num px-4.5 py-2.5 text-right text-ink-700">{formatBenchmark(i.codigo, i.unidad)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <button
          type="button"
          onClick={() => setFase2Abierta((v) => !v)}
          aria-expanded={fase2Abierta}
          className="flex w-full items-center justify-between gap-2.5 bg-surface px-4.5 py-3.5 text-left"
        >
          <span className="font-display text-[16px] font-semibold">Próximamente</span>
          <span className="text-[12.5px] text-ink-500">Indicadores de fase 2 · sin valor y no seleccionables</span>
        </button>
        {fase2Abierta && (
          <div className="grid grid-cols-1 gap-3 p-4.5 sm:grid-cols-2">
            {INDICADORES_FASE2.map((f) => (
              <div key={f.codigo} className="rounded-lg border border-dashed border-line bg-surface p-3.5">
                <span className="font-mono text-[10.5px] text-ink-500">{f.codigo}</span>
                <p className="mt-1.5 text-[13.5px] font-semibold leading-tight">{f.nombre}</p>
                <p className="mt-1.5 break-words text-[11.5px] text-ink-500">{f.formula}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los de indicadores:

```tsx
import { TodosIndicadoresScreen } from './portal/indicadores/TodosIndicadoresScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `indicadores/principales`:

```tsx
        <Route path="indicadores/todos" element={<TodosIndicadoresScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, ir a `/app/indicadores/todos`: confirmar las 4 tablas por factor (2+7+6+8 = 23 filas en
total), que filtrar por búsqueda/factor/semáforo funciona, que la columna Tendencia muestra flechas (julio
2026 tiene un periodo anterior — junio 2026 v2 — así que debe haber tendencia en todas las filas), que la
columna Benchmark tiene un valor para los 23, y que expandir "Próximamente" muestra los 7 indicadores
FASE_2 con su fórmula en texto, sin valor ni semáforo.

- [ ] **Step 5: Commit**

```bash
git add src/portal/indicadores/TodosIndicadoresScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Todos los indicadores"
```

---

### Task 7: Pantalla "Comparar indicadores" + ruta

**Files:**
- Create: `src/portal/indicadores/CompararIndicadoresScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `registrosFinancieros` (Task 3); `calcularIndicadores`
  (ya existe); `formatPeriodo` (ya existe).
- Produces: ruta `/app/indicadores/comparar` montada. Última pantalla del módulo.

- [ ] **Step 1: Crear `src/portal/indicadores/CompararIndicadoresScreen.tsx`**

Este componente incluye desde el principio el `useEffect` que resincroniza `idA`/`idB` al cambiar de
empresa activa — la Fase 3 (`CompararPeriodosScreen`) tuvo que agregarlo como fix en su revisión final
porque el selector de empresa (Topbar) puede cambiar la empresa activa sin salir de la pantalla; aquí se
incluye directamente para no repetir ese bug.

```tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { IndicadorCalculado, RegistroFinanciero, SemaforoIndicador } from '@/portal/types'
import { calcularIndicadores } from '@/portal/financiero/calculo'
import { formatPeriodo } from '@/portal/financiero/formato'

function variacion(a: number, b: number, mejorSiMayor: boolean): { dif: number; fg: string } {
  const dif = b - a
  const favorable = mejorSiMayor ? dif >= 0 : dif <= 0
  return { dif, fg: favorable ? 'text-emerald-deep' : 'text-destructive' }
}

function formatDif(dif: number, unidad: IndicadorCalculado['unidad']): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return `${(dif * 100).toFixed(1)} pp`
    case 'DIAS':
      return `${Math.round(dif)} días`
    default:
      return dif.toFixed(2)
  }
}

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

export function CompararIndicadoresScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()

  const opciones = (registrosFinancieros[empresaActiva.id] ?? [])
    .filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)

  const [idA, setIdA] = useState(opciones[1]?.id ?? opciones[0]?.id ?? '')
  const [idB, setIdB] = useState(opciones[0]?.id ?? '')

  useEffect(() => {
    setIdA(opciones[1]?.id ?? opciones[0]?.id ?? '')
    setIdB(opciones[0]?.id ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empresaActiva.id])

  const registroA = opciones.find((r) => r.id === idA)
  const registroB = opciones.find((r) => r.id === idB)

  if (opciones.length < 2 || !registroA || !registroB) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">Necesitas al menos 2 periodos vigentes o reemplazados para comparar.</p>
        <button
          type="button"
          onClick={() => navigate('/app/indicadores')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Indicadores
        </button>
      </section>
    )
  }

  const etiqueta = (r: RegistroFinanciero) => `${formatPeriodo(r.periodo)} (v${r.version})`
  const indicadoresA = calcularIndicadores(registroA)
  const indicadoresB = calcularIndicadores(registroB)
  const filas = indicadoresA.map((iA) => {
    const iB = indicadoresB.find((i) => i.codigo === iA.codigo)!
    const { dif, fg } = variacion(iA.valor, iB.valor, iA.mejorSiMayor)
    const pct = iA.valor === 0 ? 0 : dif / Math.abs(iA.valor)
    return {
      codigo: iA.codigo,
      nombre: iA.nombre,
      a: iA.valorFormateado,
      b: iB.valorFormateado,
      dif: formatDif(dif, iA.unidad),
      pct: `${(pct * 100).toFixed(1)}%`,
      fg,
      semaforoB: iB.semaforo,
    }
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button type="button" onClick={() => navigate('/app/indicadores')} className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500">
          ← Indicadores
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Comparar indicadores</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          {etiqueta(registroA)} frente a {etiqueta(registroB)}
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo A</label>
            <select value={idA} onChange={(e) => setIdA(e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]">
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo B</label>
            <select value={idB} onChange={(e) => setIdB(e.target.value)} className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]">
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {idA === idB && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft p-3 text-[13px] font-semibold text-destructive">
            Selecciona dos periodos distintos para comparar.
          </p>
        )}
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Todos los indicadores MVP</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Diferencia</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">%</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Semáforo B</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.codigo} className="border-t border-line/70">
                  <td className="px-2 py-2">
                    <span className="block font-medium">{f.nombre}</span>
                    <span className="font-mono text-[10.5px] text-ink-500">{f.codigo}</span>
                  </td>
                  <td className="num px-2 py-2 text-right">{f.a}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{f.b}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.dif}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.pct}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[f.semaforoB]}`}>{f.semaforoB}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los de indicadores:

```tsx
import { CompararIndicadoresScreen } from './portal/indicadores/CompararIndicadoresScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `indicadores/todos`:

```tsx
        <Route path="indicadores/comparar" element={<CompararIndicadoresScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, ir a `/app/indicadores/comparar`: confirmar los 2 selectores con las 6 opciones (5
vigente + 1 reemplazado), la tabla de 23 filas con diferencia formateada según la unidad de cada indicador
(pp para porcentaje, días para DIAS), colores de variación correctos (ej. un aumento en SOL_01 debe salir
en rojo, un aumento en REN_08 en verde), y semáforo de B. Cambiar de empresa activa desde el Topbar estando
en esta pantalla y confirmar que los selectores se resincronizan solos (no quedan con ids de la empresa
anterior).

- [ ] **Step 5: Commit**

```bash
git add src/portal/indicadores/CompararIndicadoresScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Comparar indicadores"
```

---

### Task 8: QA final, build y documentación

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: nada nuevo — cierra la fase.

- [ ] **Step 1: Recorrido manual completo**

Run: `npm run dev`, iniciar sesión, y verificar en orden:

1. `/app/indicadores`: 4 cards principales, 2 gráficos, salud financiera (~72, "Estable"), alertas de
   Gestión, recomendaciones.
2. Cambiar los indicadores principales, guardar, confirmar que el Resumen refleja el cambio.
3. `/app/indicadores/todos`: 23 filas en 4 grupos, filtros funcionando, sección "Próximamente" con 7
   indicadores FASE_2.
4. `/app/indicadores/comparar`: comparar julio 2026 vs. junio 2026 v2, confirmar la tabla completa.
5. Cambiar a Comercial del Valle Cía. Ltda.: confirmar estado vacío en Resumen y Todos los indicadores, y
   el aviso de "necesitas al menos 2 periodos" en Comparar indicadores.
6. Confirmar que `/app/dashboard`, `/app/empresa` y las 4 pantallas de `/app/financiero` (Fases 1-3) siguen
   funcionando exactamente igual que antes de esta fase — no se rompió nada existente.

- [ ] **Step 2: Build de producción**

Run: `npm run build`

Expected: compila sin errores ni warnings de TypeScript.

- [ ] **Step 3: Actualizar `README.md`**

Agregar, después del párrafo de "Fase 3 (Financiero)" en la sección "Portal privado (`/app`)" de
`README.md`, un párrafo nuevo:

```markdown
**Fase 4 (Indicadores):** agrega `src/portal/indicadores/`, el módulo de indicadores financieros — un
resumen con los 4 indicadores principales personalizables por empresa, gráficos históricos de rentabilidad
y liquidez (esta última contra la mediana del clúster), un puntaje de salud financiera ponderado por factor
(liquidez/solvencia/gestión/rentabilidad), alertas y recomendaciones con enlace al Marketplace; una tabla
completa de los 23 indicadores MVP filtrable y agrupada por factor, con tendencia vs. el periodo anterior y
benchmark sectorial, más una sección "Próximamente" con los 7 indicadores de fase 2 del modelo (mostrados
sin calcular); y comparación de dos periodos sobre los 23 indicadores. Extiende el motor de cálculo de la
Fase 3 (`calculo.ts`) con `calcularSaludFinanciera()` y `listarIndicadores()`, y agrega un módulo de datos
nuevo (`benchmarks.ts`) con la mediana sectorial por indicador — igual que los umbrales de semáforo de la
Fase 3, son valores inventados para este prototipo, no datos reales de mercado.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: documentar la Fase 4 (Indicadores) del portal privado en el README"
```

---

## Self-Review Notes

- **Cobertura del spec:** las 4 pantallas (Resumen, Elegir indicadores principales, Todos los indicadores,
  Comparar indicadores), el benchmark sectorial (mediana por indicador), la salud financiera ponderada por
  factor, el selector de 4 indicadores principales persistido en `PortalDataContext`, la sección
  "Próximamente" con los 7 indicadores FASE_2, y el link a Marketplace están cada uno cubiertos por una
  task. El alcance recortado del spec (sin distribución completa de percentiles, sin pantalla de detalle
  por indicador, sin modelo completo de diagnóstico) no requiere tasks propias — son omisiones deliberadas.
- **Consistencia de tipos:** `SaludFinanciera` (Task 1) se usa con la misma forma en `calcularSaludFinanciera`
  (Task 2) y `IndicadoresScreen` (Task 4). `DescripcionIndicador`/`listarIndicadores` (Task 2) se consumen
  igual en `IndicadoresPrincipalesScreen` (Task 5). Los nombres de función del motor de cálculo
  (`calcularIndicadores`, `calcularSaludFinanciera`, `listarIndicadores`) se usan con la misma firma en las
  Tasks 4, 5, 6 y 7 — verificado que ninguna task usa un nombre distinto para la misma función.
- **Lección de la revisión final de Fase 3 aplicada desde el diseño:** `CompararIndicadoresScreen` (Task 7)
  incluye el `useEffect` de resincronización al cambiar de empresa activa desde el primer commit, en vez de
  necesitar una ronda de fix como pasó con `CompararPeriodosScreen` en Fase 3. `IndicadoresScreen` (Task 4)
  no necesita ese mismo `useEffect` porque su selector de periodo ya se autocorrige solo (`elegibles.find(...)
  ?? elegibles[0]`) sin guardar ningún dato derivado de la empresa anterior — no hay riesgo de id-colisión
  como en el wizard de Fase 3, porque esta pantalla nunca escribe en el contexto.
- **Placeholders:** ningún paso usa "TBD"/"similar a la Task N sin código"/"agregar validación" sin mostrar
  el código real. La única corrección de transcripción señalada explícitamente (Task 6, firma de
  `formatBenchmark`) está marcada y resuelta en el propio texto de la task, no dejada como ambigüedad.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-07-portal-privado-fase4-indicadores.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
