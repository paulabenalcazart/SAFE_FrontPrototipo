# Portal Privado — Fase 3 (Financiero) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Financiero" del portal privado (Estados financieros, Nueva carga financiera, Detalle de registro, Comparar periodos), con un motor de cálculo real (magnitudes contables + 23 indicadores financieros con fórmulas reales) que calcula utilidad neta, balance cuadrado e indicadores a partir de lo que el usuario ingresa.

**Architecture:** `RegistroFinanciero` (nuevo tipo) espeja los ~31 campos numéricos de un periodo financiero. `PortalDataContext` se extiende con `registrosFinancieros: Record<empresaId, RegistroFinanciero[]>` — mismo patrón que `empresas`/`addEmpresa`/`updateEmpresa` de la Fase 2. Un módulo puro nuevo, `src/portal/financiero/calculo.ts` (sin imports de React), calcula magnitudes derivadas (activo total, patrimonio, utilidad neta, etc.) y el catálogo de 23 indicadores MVP sobre cualquier `RegistroFinanciero` — reutilizable tal cual por la Fase 4. Cuatro pantallas nuevas bajo `src/portal/financiero/` consumen el contexto y el motor de cálculo.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, `react-router-dom`, componentes `ui/` existentes (`Input`, `Label`, `Select`, `Textarea`) de `src/components/ui/`, `lucide-react`.

## Global Constraints

- Prototipo **solo frontend**, sin backend — spec: "no hay backend ni API real".
- Los registros financieros, igual que los datos de empresa de la Fase 2, **no** persisten en `localStorage` — viven en memoria de React mientras dura la sesión del navegador.
- **Solo Textiles Andina S.A. (`emp-1`)** arranca con historial sembrado (7 registros). Comercial del Valle Cía. Ltda. (`emp-2`) arranca sin registros — usa el estado vacío del mockup.
- `utilidadNeta` y `balanceCuadrado` **nunca se guardan como campos** — siempre se derivan con las funciones de `calculo.ts` a partir de los ~31 campos base, para que nunca queden desincronizados.
- Semáforos de indicadores con **umbrales fijos por indicador** (constantes en el catálogo), no contra percentiles sectoriales — eso es trabajo de la Fase 4.
- **No** se recalculan obligaciones tributarias a partir de estos datos (Fase 5) ni se modela `diagnostico_empresarial`/`detalle_diagnostico` completo — solo un resumen heurístico de 2-3 líneas.
- Validación de campos numéricos: mínimo 0 en todos excepto `resultadosAcumulados`, `flujoOperacion`, `flujoInversion`, `flujoFinanciamiento` (pueden ser negativos) — antes de avanzar de paso en el wizard.
- El repo no tiene test runner ni eslint — verificación vía `npm run build` (type-check) + revisión manual en el navegador. No agregar frameworks de testing en esta fase.
- Reusar tokens de color existentes (`--color-navy-*`, `--color-emerald-*`, `--color-amber-*`, `--color-ink-*`, `--color-line`, `--color-surface`, `--color-destructive`) y las clases utilitarias ya usadas en `dashboard/`/`empresa/` (`surface-card` no aplica al portal — el portal privado usa clases Tailwind directas con esos tokens, ver `EmpresaScreen.tsx`); no agregar tokens nuevos.
- Los formularios usan los componentes `ui/` ya existentes (`Input`, `Label`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`/`SelectValue`, `Textarea`) — no HTML crudo para inputs.
- Nuevo registro: `id` vía `crypto.randomUUID()`.

---

## File Structure

```
src/
├── App.tsx                                     # Modify: 4 rutas nuevas (Tasks 4, 5, 6, 7)
├── portal/
│   ├── types.ts                                 # Modify: RegistroFinanciero, EstadoRegistroFinanciero, IndicadorCalculado (Task 1)
│   ├── PortalDataContext.tsx                    # Modify: registrosFinancieros + acciones (Task 3)
│   ├── data/
│   │   └── mock-portal-data.ts                  # Modify: registrosFinancierosSemilla (Task 1)
│   └── financiero/
│       ├── calculo.ts                            # Create (Task 2): magnitudes + 23 indicadores + diagnóstico + balance
│       ├── formato.ts                            # Create (Task 2): formatUSD / formatPorcentaje / formatPeriodo
│       ├── FinancieroScreen.tsx                  # Create (Task 4): "Estados financieros" (lista, KPIs, alertas)
│       ├── EvolucionFinancieraChart.tsx          # Create (Task 4): gráfico de 3 líneas (ingresos/gastos/utilidad)
│       ├── wizard-steps.ts                       # Create (Task 5): metadata de los 10 pasos del wizard
│       ├── NuevaCargaScreen.tsx                  # Create (Task 5): wizard "Nueva carga financiera"
│       ├── DetalleRegistroScreen.tsx             # Create (Task 6): "Detalle de registro financiero"
│       └── CompararPeriodosScreen.tsx            # Create (Task 7): "Comparar periodos"
```

`financiero/` se agrupa aparte de `dashboard/`/`empresa/` porque es su propio sub-módulo con 4 pantallas
relacionadas que comparten el mismo modelo de datos y el mismo motor de cálculo — mismo patrón que ya
usaron `dashboard/` (Fase 1) y `empresa/` (Fase 2).

---

### Task 1: Tipos `RegistroFinanciero`/`IndicadorCalculado` + datos mock semilla

**Files:**
- Modify: `src/portal/types.ts`
- Modify: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: `EstadoRegistroFinanciero`, `RegistroFinanciero`, `IndicadorCalculado` (usados por todas las tasks siguientes); `registrosFinancierosSemilla: Record<string, RegistroFinanciero[]>` (usado como semilla por la Task 3).

- [ ] **Step 1: Agregar los tipos nuevos al final de `src/portal/types.ts`**

```ts
export type EstadoRegistroFinanciero = 'BORRADOR' | 'VIGENTE' | 'REEMPLAZADO'

export type RegistroFinanciero = {
  id: string
  periodo: string // ISO, primer día del mes: '2026-07-01'
  version: number
  estado: EstadoRegistroFinanciero
  observaciones: string
  // Activo
  efectivoEquivalentes: number
  cuentasPorCobrar: number
  inventarios: number
  otrosActivosCorrientes: number
  activoFijoNeto: number
  otrosActivosNoCorrientes: number
  // Pasivo
  cuentasPorPagar: number
  deudaCortoPlazo: number
  otrosPasivosCorrientes: number
  deudaLargoPlazo: number
  otrosPasivosNoCorrientes: number
  // Patrimonio
  capitalSocial: number
  resultadosAcumulados: number
  // Ingreso / Costo / Gasto
  ingresosOperacionales: number
  otrosIngresos: number
  costoVentas: number
  gastosAdministracion: number
  gastosVentas: number
  otrosGastosOperacionales: number
  gastosFinancieros: number
  impuestoRenta: number
  // Flujo de efectivo
  flujoOperacion: number
  flujoInversion: number
  flujoFinanciamiento: number
  // Complementario
  comprasPeriodo: number
  capex: number
  depreciacion: number
  numeroEmpleadosPeriodo: number
  costoLaboral: number
  gastoID: number
  unidadesVendidas: number
  createdAt: string
  updatedAt: string
}

export type FactorIndicador = 'LIQUIDEZ' | 'SOLVENCIA' | 'GESTION' | 'RENTABILIDAD'
export type SemaforoIndicador = 'VERDE' | 'AMARILLO' | 'ROJO'

export type IndicadorCalculado = {
  codigo: string
  factor: FactorIndicador
  nombre: string
  unidad: 'RATIO' | 'PORCENTAJE' | 'VECES' | 'DIAS'
  valor: number
  valorFormateado: string
  semaforo: SemaforoIndicador
}
```

- [ ] **Step 2: Agregar los campos numéricos base de Textiles Andina y el generador de semilla en `src/portal/data/mock-portal-data.ts`**

Agregar el import de `RegistroFinanciero` junto a los tipos ya importados (línea 15-23):

```ts
import type {
  ChartSeriesPoint,
  Empresa,
  Indicador,
  Kpi,
  NavItem,
  Notificacion,
  Obligacion,
  RegistroFinanciero,
} from '../types'
```

Agregar al final del archivo (después de `chartSeries`):

```ts
type CamposRegistro = Omit<
  RegistroFinanciero,
  'id' | 'periodo' | 'version' | 'estado' | 'observaciones' | 'createdAt' | 'updatedAt'
>

const REGISTRO_JULIO_BASE: CamposRegistro = {
  efectivoEquivalentes: 18400,
  cuentasPorCobrar: 26700,
  inventarios: 31200,
  otrosActivosCorrientes: 4100,
  activoFijoNeto: 96500,
  otrosActivosNoCorrientes: 8200,
  cuentasPorPagar: 22300,
  deudaCortoPlazo: 12000,
  otrosPasivosCorrientes: 5400,
  deudaLargoPlazo: 34000,
  otrosPasivosNoCorrientes: 3600,
  capitalSocial: 80000,
  resultadosAcumulados: 27800,
  ingresosOperacionales: 48200,
  otrosIngresos: 900,
  costoVentas: 27600,
  gastosAdministracion: 6800,
  gastosVentas: 4200,
  otrosGastosOperacionales: 1100,
  gastosFinancieros: 950,
  impuestoRenta: 1700,
  flujoOperacion: 9200,
  flujoInversion: -4500,
  flujoFinanciamiento: -2100,
  comprasPeriodo: 25000,
  capex: 4500,
  depreciacion: 1800,
  numeroEmpleadosPeriodo: 38,
  costoLaboral: 14200,
  gastoID: 0,
  unidadesVendidas: 9600,
}

function escalarCampos(base: CamposRegistro, factor: number): CamposRegistro {
  const escalado = Object.fromEntries(
    Object.entries(base).map(([key, valor]) => [key, Math.round(valor * factor)]),
  ) as unknown as CamposRegistro
  return { ...escalado, numeroEmpleadosPeriodo: base.numeroEmpleadosPeriodo }
}

function crearRegistro(params: {
  periodo: string
  version: number
  estado: RegistroFinanciero['estado']
  observaciones: string
  campos: CamposRegistro
  fecha: string
}): RegistroFinanciero {
  return {
    id: crypto.randomUUID(),
    periodo: params.periodo,
    version: params.version,
    estado: params.estado,
    observaciones: params.observaciones,
    ...params.campos,
    createdAt: params.fecha,
    updatedAt: params.fecha,
  }
}

const registrosTextilesAndina: RegistroFinanciero[] = [
  crearRegistro({
    periodo: '2026-03-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Periodo estable, sin novedades.',
    campos: escalarCampos(REGISTRO_JULIO_BASE, 0.86),
    fecha: '2026-04-03T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-04-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Leve incremento en ventas de temporada.',
    campos: escalarCampos(REGISTRO_JULIO_BASE, 0.9),
    fecha: '2026-05-04T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-05-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Aumento de inventario para producción de invierno.',
    campos: escalarCampos(REGISTRO_JULIO_BASE, 0.94),
    fecha: '2026-06-03T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-06-01',
    version: 1,
    estado: 'REEMPLAZADO',
    observaciones: 'Carga inicial con cuentas por cobrar subestimadas.',
    campos: { ...escalarCampos(REGISTRO_JULIO_BASE, 0.97), cuentasPorCobrar: escalarCampos(REGISTRO_JULIO_BASE, 0.97).cuentasPorCobrar - 3000 },
    fecha: '2026-07-02T14:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-06-01',
    version: 2,
    estado: 'VIGENTE',
    observaciones: 'Corrección: cuentas por cobrar ajustadas tras conciliación con contabilidad.',
    campos: escalarCampos(REGISTRO_JULIO_BASE, 0.97),
    fecha: '2026-07-05T09:30:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-07-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Cierre de julio con inventario de temporada alta.',
    campos: REGISTRO_JULIO_BASE,
    fecha: '2026-08-03T16:15:00.000Z',
  }),
  {
    id: crypto.randomUUID(),
    periodo: '2026-08-01',
    version: 1,
    estado: 'BORRADOR',
    observaciones: '',
    efectivoEquivalentes: 19100,
    cuentasPorCobrar: 27500,
    inventarios: 32000,
    otrosActivosCorrientes: 4200,
    activoFijoNeto: 0,
    otrosActivosNoCorrientes: 0,
    cuentasPorPagar: 0,
    deudaCortoPlazo: 0,
    otrosPasivosCorrientes: 0,
    deudaLargoPlazo: 0,
    otrosPasivosNoCorrientes: 0,
    capitalSocial: 0,
    resultadosAcumulados: 0,
    ingresosOperacionales: 0,
    otrosIngresos: 0,
    costoVentas: 0,
    gastosAdministracion: 0,
    gastosVentas: 0,
    otrosGastosOperacionales: 0,
    gastosFinancieros: 0,
    impuestoRenta: 0,
    flujoOperacion: 0,
    flujoInversion: 0,
    flujoFinanciamiento: 0,
    comprasPeriodo: 0,
    capex: 0,
    depreciacion: 0,
    numeroEmpleadosPeriodo: 0,
    costoLaboral: 0,
    gastoID: 0,
    unidadesVendidas: 0,
    createdAt: '2026-08-06T11:00:00.000Z',
    updatedAt: '2026-08-06T11:00:00.000Z',
  },
]

export const registrosFinancierosSemilla: Record<string, RegistroFinanciero[]> = {
  'emp-1': registrosTextilesAndina,
  'emp-2': [],
}
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/portal/types.ts src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar tipos RegistroFinanciero/IndicadorCalculado y datos semilla"
```

---

### Task 2: Motor de cálculo (`calculo.ts`) + formateadores (`formato.ts`)

**Files:**
- Create: `src/portal/financiero/calculo.ts`
- Create: `src/portal/financiero/formato.ts`

**Interfaces:**
- Consumes: `RegistroFinanciero`, `IndicadorCalculado`, `FactorIndicador`, `SemaforoIndicador` (Task 1).
- Produces:
  - `formato.ts`: `formatUSD(valor: number): string`, `formatPorcentaje(valor: number): string`, `formatPeriodo(periodoISO: string): string` — usados por todas las pantallas (Tasks 4, 5, 6, 7).
  - `calculo.ts`: magnitudes (`activoCorriente`, `activoNoCorriente`, `activoTotal`, `pasivoCorriente`, `pasivoNoCorriente`, `pasivoTotal`, `patrimonio`, `utilidadBruta`, `utilidadOperacional`, `uaii`, `uai`, `utilidadNeta`, todas `(r: RegistroFinanciero) => number`), `gastosTotales(r): number`, `balanceCuadrado(r): boolean`, `descuadreBalance(r): number`, `calcularIndicadores(r: RegistroFinanciero): IndicadorCalculado[]`, `calcularDiagnostico(r: RegistroFinanciero): string[]` — usados por Tasks 4, 5, 6, 7 (y por la futura Fase 4).

- [ ] **Step 1: Crear `src/portal/financiero/formato.ts`**

```ts
export function formatUSD(valor: number): string {
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(valor)
}

export function formatPorcentaje(valor: number): string {
  return `${(valor * 100).toFixed(1)}%`
}

export function formatPeriodo(periodoISO: string): string {
  const [anio, mes] = periodoISO.split('-').map(Number)
  const fecha = new Date(anio, mes - 1, 1)
  const texto = fecha.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
```

- [ ] **Step 2: Crear `src/portal/financiero/calculo.ts` — magnitudes derivadas**

```ts
import type { FactorIndicador, IndicadorCalculado, RegistroFinanciero, SemaforoIndicador } from '@/portal/types'
import { formatPorcentaje } from './formato'

function div(a: number, b: number): number {
  return b === 0 ? 0 : a / b
}

export function activoCorriente(r: RegistroFinanciero): number {
  return r.efectivoEquivalentes + r.cuentasPorCobrar + r.inventarios + r.otrosActivosCorrientes
}

export function activoNoCorriente(r: RegistroFinanciero): number {
  return r.activoFijoNeto + r.otrosActivosNoCorrientes
}

export function activoTotal(r: RegistroFinanciero): number {
  return activoCorriente(r) + activoNoCorriente(r)
}

export function pasivoCorriente(r: RegistroFinanciero): number {
  return r.cuentasPorPagar + r.deudaCortoPlazo + r.otrosPasivosCorrientes
}

export function pasivoNoCorriente(r: RegistroFinanciero): number {
  return r.deudaLargoPlazo + r.otrosPasivosNoCorrientes
}

export function pasivoTotal(r: RegistroFinanciero): number {
  return pasivoCorriente(r) + pasivoNoCorriente(r)
}

export function patrimonio(r: RegistroFinanciero): number {
  return r.capitalSocial + r.resultadosAcumulados
}

export function utilidadBruta(r: RegistroFinanciero): number {
  return r.ingresosOperacionales - r.costoVentas
}

export function utilidadOperacional(r: RegistroFinanciero): number {
  return utilidadBruta(r) - r.gastosAdministracion - r.gastosVentas - r.otrosGastosOperacionales
}

export function uaii(r: RegistroFinanciero): number {
  return utilidadOperacional(r)
}

export function uai(r: RegistroFinanciero): number {
  return uaii(r) + r.otrosIngresos - r.gastosFinancieros
}

export function utilidadNeta(r: RegistroFinanciero): number {
  return uai(r) - r.impuestoRenta
}

export function gastosTotales(r: RegistroFinanciero): number {
  return (
    r.costoVentas +
    r.gastosAdministracion +
    r.gastosVentas +
    r.otrosGastosOperacionales +
    r.gastosFinancieros +
    r.impuestoRenta
  )
}

export function descuadreBalance(r: RegistroFinanciero): number {
  return activoTotal(r) - (pasivoTotal(r) + patrimonio(r))
}

export function balanceCuadrado(r: RegistroFinanciero): boolean {
  return Math.abs(descuadreBalance(r)) < 0.01
}
```

- [ ] **Step 3: Agregar el catálogo de 23 indicadores MVP y `calcularIndicadores` al final de `calculo.ts`**

```ts
type DefinicionIndicador = {
  codigo: string
  factor: FactorIndicador
  nombre: string
  unidad: IndicadorCalculado['unidad']
  calcular: (r: RegistroFinanciero) => number
  bueno: number
  regular: number
  mejorSiMayor: boolean
}

const CATALOGO_INDICADORES: DefinicionIndicador[] = [
  // Liquidez
  { codigo: 'LIQ_01', factor: 'LIQUIDEZ', nombre: 'Liquidez corriente', unidad: 'RATIO', calcular: (r) => div(activoCorriente(r), pasivoCorriente(r)), bueno: 1.5, regular: 1.0, mejorSiMayor: true },
  { codigo: 'LIQ_02', factor: 'LIQUIDEZ', nombre: 'Prueba ácida', unidad: 'RATIO', calcular: (r) => div(activoCorriente(r) - r.inventarios, pasivoCorriente(r)), bueno: 1.0, regular: 0.7, mejorSiMayor: true },
  // Solvencia (MVP: SOL_01 a SOL_07; SOL_08-12 quedan marcados FASE_2 en el dump y fuera de esta fase)
  { codigo: 'SOL_01', factor: 'SOLVENCIA', nombre: 'Endeudamiento del activo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoTotal(r), activoTotal(r)), bueno: 0.4, regular: 0.6, mejorSiMayor: false },
  { codigo: 'SOL_02', factor: 'SOLVENCIA', nombre: 'Endeudamiento patrimonial', unidad: 'RATIO', calcular: (r) => div(pasivoTotal(r), patrimonio(r)), bueno: 1.0, regular: 2.0, mejorSiMayor: false },
  { codigo: 'SOL_03', factor: 'SOLVENCIA', nombre: 'Endeudamiento del activo fijo', unidad: 'RATIO', calcular: (r) => div(patrimonio(r), r.activoFijoNeto), bueno: 1.0, regular: 0.75, mejorSiMayor: true },
  { codigo: 'SOL_04', factor: 'SOLVENCIA', nombre: 'Endeudamiento a corto plazo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoCorriente(r), pasivoTotal(r)), bueno: 0.5, regular: 0.7, mejorSiMayor: false },
  { codigo: 'SOL_05', factor: 'SOLVENCIA', nombre: 'Endeudamiento a largo plazo', unidad: 'PORCENTAJE', calcular: (r) => div(pasivoNoCorriente(r), pasivoTotal(r)), bueno: 0.5, regular: 0.3, mejorSiMayor: true },
  { codigo: 'SOL_06', factor: 'SOLVENCIA', nombre: 'Cobertura de intereses', unidad: 'RATIO', calcular: (r) => div(utilidadOperacional(r), r.gastosFinancieros), bueno: 3, regular: 1.5, mejorSiMayor: true },
  { codigo: 'SOL_07', factor: 'SOLVENCIA', nombre: 'Apalancamiento', unidad: 'RATIO', calcular: (r) => div(activoTotal(r), patrimonio(r)), bueno: 1.5, regular: 2.5, mejorSiMayor: false },
  // Gestión (MVP: GES_01-04, 06, 07; GES_05 queda marcado FASE_2 en el dump)
  { codigo: 'GES_01', factor: 'GESTION', nombre: 'Rotación de cartera', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, r.cuentasPorCobrar), bueno: 8, regular: 4, mejorSiMayor: true },
  { codigo: 'GES_02', factor: 'GESTION', nombre: 'Rotación de activo fijo', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, r.activoFijoNeto), bueno: 2, regular: 1, mejorSiMayor: true },
  { codigo: 'GES_03', factor: 'GESTION', nombre: 'Rotación de ventas', unidad: 'VECES', calcular: (r) => div(r.ingresosOperacionales, activoTotal(r)), bueno: 1, regular: 0.5, mejorSiMayor: true },
  { codigo: 'GES_04', factor: 'GESTION', nombre: 'Periodo medio de cobranza', unidad: 'DIAS', calcular: (r) => div(r.cuentasPorCobrar * 365, r.ingresosOperacionales), bueno: 30, regular: 60, mejorSiMayor: false },
  { codigo: 'GES_06', factor: 'GESTION', nombre: 'Impacto de gastos de administración y ventas', unidad: 'PORCENTAJE', calcular: (r) => div(r.gastosAdministracion + r.gastosVentas, r.ingresosOperacionales), bueno: 0.2, regular: 0.35, mejorSiMayor: false },
  { codigo: 'GES_07', factor: 'GESTION', nombre: 'Impacto de la carga financiera', unidad: 'PORCENTAJE', calcular: (r) => div(r.gastosFinancieros, r.ingresosOperacionales), bueno: 0.05, regular: 0.1, mejorSiMayor: false },
  // Rentabilidad (MVP: REN_01-05, 07-09; REN_06 queda marcado FASE_2 en el dump)
  { codigo: 'REN_01', factor: 'RENTABILIDAD', nombre: 'Rentabilidad neta del activo', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), activoTotal(r)), bueno: 0.08, regular: 0.03, mejorSiMayor: true },
  { codigo: 'REN_02', factor: 'RENTABILIDAD', nombre: 'Margen bruto', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadBruta(r), r.ingresosOperacionales), bueno: 0.35, regular: 0.2, mejorSiMayor: true },
  { codigo: 'REN_03', factor: 'RENTABILIDAD', nombre: 'Margen operacional', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), r.ingresosOperacionales), bueno: 0.15, regular: 0.05, mejorSiMayor: true },
  { codigo: 'REN_04', factor: 'RENTABILIDAD', nombre: 'Rentabilidad neta de ventas', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), r.ingresosOperacionales), bueno: 0.1, regular: 0.04, mejorSiMayor: true },
  { codigo: 'REN_05', factor: 'RENTABILIDAD', nombre: 'Rentabilidad operacional del patrimonio', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), patrimonio(r)), bueno: 0.15, regular: 0.05, mejorSiMayor: true },
  { codigo: 'REN_07', factor: 'RENTABILIDAD', nombre: 'Rentabilidad operacional del activo', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadOperacional(r), activoTotal(r)), bueno: 0.1, regular: 0.04, mejorSiMayor: true },
  { codigo: 'REN_08', factor: 'RENTABILIDAD', nombre: 'ROE', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), patrimonio(r)), bueno: 0.15, regular: 0.06, mejorSiMayor: true },
  { codigo: 'REN_09', factor: 'RENTABILIDAD', nombre: 'ROA', unidad: 'PORCENTAJE', calcular: (r) => div(utilidadNeta(r), activoTotal(r)), bueno: 0.08, regular: 0.03, mejorSiMayor: true },
]

function calcularSemaforo(valor: number, def: DefinicionIndicador): SemaforoIndicador {
  if (def.mejorSiMayor) {
    if (valor >= def.bueno) return 'VERDE'
    if (valor >= def.regular) return 'AMARILLO'
    return 'ROJO'
  }
  if (valor <= def.bueno) return 'VERDE'
  if (valor <= def.regular) return 'AMARILLO'
  return 'ROJO'
}

function formatearValor(unidad: IndicadorCalculado['unidad'], valor: number): string {
  switch (unidad) {
    case 'PORCENTAJE':
      return formatPorcentaje(valor)
    case 'DIAS':
      return `${Math.round(valor)} días`
    case 'VECES':
      return `${valor.toFixed(2)}x`
    case 'RATIO':
      return valor.toFixed(2)
  }
}

export function calcularIndicadores(r: RegistroFinanciero): IndicadorCalculado[] {
  return CATALOGO_INDICADORES.map((def) => {
    const valor = def.calcular(r)
    return {
      codigo: def.codigo,
      factor: def.factor,
      nombre: def.nombre,
      unidad: def.unidad,
      valor,
      valorFormateado: formatearValor(def.unidad, valor),
      semaforo: calcularSemaforo(valor, def),
    }
  })
}

export function calcularDiagnostico(r: RegistroFinanciero): string[] {
  const indicadores = calcularIndicadores(r)
  const rojos = indicadores.filter((i) => i.semaforo === 'ROJO')
  const verdes = indicadores.filter((i) => i.semaforo === 'VERDE')
  const lineas: string[] = []

  if (rojos.length === 0) {
    lineas.push('Estado general: Saludable — ningún indicador está en zona de riesgo.')
  } else if (rojos.length <= 2) {
    lineas.push(`Estado general: Atención — ${rojos.length} indicador(es) fuera de rango saludable.`)
  } else {
    lineas.push(`Estado general: En riesgo — ${rojos.length} indicadores fuera de rango saludable.`)
  }

  if (verdes.length > 0) {
    lineas.push(`Principal fortaleza: ${verdes[0].nombre} en ${verdes[0].valorFormateado}.`)
  }
  if (rojos.length > 0) {
    lineas.push(`Principal riesgo: ${rojos[0].nombre} en ${rojos[0].valorFormateado}.`)
  }
  if (!balanceCuadrado(r)) {
    lineas.push('El balance de este registro no cuadra — revisa los valores cargados.')
  }
  return lineas
}
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { calcularIndicadores, balanceCuadrado, utilidadNeta } from './src/portal/financiero/calculo.ts'
import { registrosFinancierosSemilla } from './src/portal/data/mock-portal-data.ts'
const julio = registrosFinancierosSemilla['emp-1'].find(r => r.periodo === '2026-07-01' && r.estado === 'VIGENTE')
console.log('balanceCuadrado', balanceCuadrado(julio))
console.log('utilidadNeta', utilidadNeta(julio))
console.log(calcularIndicadores(julio).find(i => i.codigo === 'LIQ_01'))
"`

Si `npx tsx` no está disponible, agregarlo temporalmente con `npm install --no-save tsx` antes de correr el
comando. Expected: `balanceCuadrado true`, `utilidadNeta` un número positivo cercano a 6750, y el indicador
`LIQ_01` con `semaforo: 'VERDE'` (liquidez corriente de Textiles Andina en julio es ~2.03, por encima del
umbral `bueno: 1.5`).

- [ ] **Step 6: Commit**

```bash
git add src/portal/financiero/calculo.ts src/portal/financiero/formato.ts
git commit -m "feat: agregar motor de calculo financiero (magnitudes + 23 indicadores MVP)"
```

---

### Task 3: Extender `PortalDataContext` con `registrosFinancieros`

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `RegistroFinanciero` (Task 1), `registrosFinancierosSemilla` (Task 1).
- Produces: `usePortalData()` gana `registrosFinancieros: Record<string, RegistroFinanciero[]>`, `addRegistroFinanciero(empresaId: string, registro: RegistroFinanciero): void`, `updateRegistroFinanciero(empresaId: string, id: string, patch: Partial<RegistroFinanciero>): void` — usados por Tasks 4, 5, 6, 7.

- [ ] **Step 1: Reemplazar el contenido de `src/portal/PortalDataContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa, RegistroFinanciero } from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
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
}

const PortalDataContext = createContext<PortalDataContextValue | null>(null)

export function PortalDataProvider({ children }: { children: ReactNode }) {
  const [empresas, setEmpresas] = useState<Empresa[]>(empresasSemilla)
  const [empresaActivaId, setEmpresaActivaId] = useState(empresaSemilla.id)
  const [registrosFinancieros, setRegistrosFinancieros] = useState<Record<string, RegistroFinanciero[]>>(
    registrosFinancierosSemilla,
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

Run: `npm run dev`, iniciar sesión, confirmar que `/app/dashboard` y `/app/empresa` se ven y funcionan
exactamente igual que antes de este cambio (el contexto tiene datos nuevos pero nada los consume todavía).

- [ ] **Step 4: Commit**

```bash
git add src/portal/PortalDataContext.tsx
git commit -m "feat: extender PortalDataContext con registrosFinancieros"
```

---

### Task 4: Pantalla "Estados financieros" + rutas base

**Files:**
- Create: `src/portal/financiero/EvolucionFinancieraChart.tsx`
- Create: `src/portal/financiero/FinancieroScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `registrosFinancieros` (Task 3); `activoCorriente`, `pasivoCorriente`, `utilidadNeta`, `gastosTotales`, `balanceCuadrado` (Task 2, `calculo.ts`); `formatUSD`, `formatPeriodo` (Task 2, `formato.ts`).
- Produces: ruta `/app/financiero` montada; `EvolucionFinancieraChart` reutilizable por otras pantallas si hiciera falta (no lo hace en esta fase).

- [ ] **Step 1: Crear `src/portal/financiero/EvolucionFinancieraChart.tsx`**

```tsx
import type { RegistroFinanciero } from '@/portal/types'
import { utilidadNeta, gastosTotales } from './calculo'
import { formatPeriodo } from './formato'

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], max: number) {
  if (values.length < 2) return ''
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - (value / max) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function EvolucionFinancieraChart({ registros }: { registros: RegistroFinanciero[] }) {
  const ordenados = [...registros]
    .filter((r) => r.estado !== 'BORRADOR')
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .slice(-12)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[17px] font-semibold">Evolución financiera</h2>
      <p className="mt-1 text-[12.5px] text-ink-500">Últimos {ordenados.length || 0} periodos vigentes</p>

      {ordenados.length < 2 ? (
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[32ch] text-center text-[13px] text-ink-500">
            Sin periodos vigentes para graficar
          </p>
        </div>
      ) : (
        <>
          {(() => {
            const ingresos = ordenados.map((r) => r.ingresosOperacionales)
            const gastos = ordenados.map((r) => gastosTotales(r))
            const utilidad = ordenados.map((r) => utilidadNeta(r))
            const max = Math.max(...ingresos, ...gastos, ...utilidad) * 1.15
            const yTicks = [max, max / 2, 0].map((v) => `$${Math.round(v / 1000)}k`)

            return (
              <>
                <div className="mt-4 flex gap-2.5">
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
                      aria-label="Ingresos, gastos y utilidad neta por periodo"
                    >
                      <polyline points={buildPoints(ingresos, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(gastos, max)} fill="none" stroke="var(--color-amber-brand)" strokeWidth={6} strokeDasharray="14 10" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                      <polyline points={buildPoints(utilidad, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
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
              Ingresos
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-amber-brand" aria-hidden="true" />
              Gastos totales
            </span>
            <span className="flex items-center gap-1.5 text-[12.5px] text-ink-700">
              <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
              Utilidad neta
            </span>
          </div>
        </>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Crear `src/portal/financiero/FinancieroScreen.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { RegistroFinanciero } from '@/portal/types'
import { activoCorriente, balanceCuadrado, gastosTotales, pasivoCorriente, utilidadNeta } from './calculo'
import { EvolucionFinancieraChart } from './EvolucionFinancieraChart'
import { formatPeriodo, formatUSD } from './formato'

const ESTADO_BADGE: Record<RegistroFinanciero['estado'], string> = {
  BORRADOR: 'bg-amber-soft text-amber-deep',
  VIGENTE: 'bg-emerald-soft text-emerald-deep',
  REEMPLAZADO: 'bg-surface text-ink-700',
}

export function FinancieroScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()
  const [filtroEstado, setFiltroEstado] = useState<'todos' | RegistroFinanciero['estado']>('todos')
  const [busqueda, setBusqueda] = useState('')

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const elegiblesComparar = registros.filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
  const ultimoVigente = [...registros]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

  const filtrados = useMemo(() => {
    return [...registros]
      .filter((r) => (filtroEstado === 'todos' ? true : r.estado === filtroEstado))
      .filter((r) => formatPeriodo(r.periodo).toLowerCase().includes(busqueda.toLowerCase()))
      .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)
  }, [registros, filtroEstado, busqueda])

  const alertas: string[] = []
  const borradores = registros.filter((r) => r.estado === 'BORRADOR')
  if (borradores.length > 0) {
    alertas.push(`Tienes ${borradores.length} carga(s) en borrador sin finalizar.`)
  }
  registros
    .filter((r) => r.estado === 'VIGENTE' && !balanceCuadrado(r))
    .forEach((r) => alertas.push(`El periodo ${formatPeriodo(r.periodo)} tiene un balance descuadrado.`))

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Estados financieros</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Carga tus periodos mensuales, corrige versiones y compara la evolución del negocio.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Ingresos del último periodo</p>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(ultimoVigente.ingresosOperacionales) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Utilidad neta del último periodo</p>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(utilidadNeta(ultimoVigente)) : '—'}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Capital de trabajo</p>
          <p className="num mt-2 font-display text-2xl font-bold">
            {ultimoVigente ? formatUSD(activoCorriente(ultimoVigente) - pasivoCorriente(ultimoVigente)) : '—'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={() => navigate('/app/financiero/nuevo')}
          className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
        >
          Nueva carga financiera
        </button>
        <button
          type="button"
          disabled={elegiblesComparar.length < 2}
          onClick={() => navigate('/app/financiero/comparar')}
          className="flex min-h-11 items-center gap-2 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700 disabled:opacity-50"
        >
          {elegiblesComparar.length < 2 && <Lock className="h-3.5 w-3.5" aria-hidden="true" />}
          Comparar periodos
        </button>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex flex-wrap items-end gap-3 border-b border-line/70 bg-surface p-3.5">
          <div>
            <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Estado</label>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
              className="min-h-10 rounded-md border border-line bg-card px-2.5 text-[13px]"
            >
              <option value="todos">Todos</option>
              <option value="VIGENTE">Vigente</option>
              <option value="BORRADOR">Borrador</option>
              <option value="REEMPLAZADO">Reemplazado</option>
            </select>
          </div>
          <div className="min-w-0 flex-1">
            <label className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">Buscar periodo</label>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. Julio 2026"
              className="min-h-10 w-full rounded-md border border-line bg-card px-2.5 text-[13px]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Periodo</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Versión</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Estado</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Ingresos</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Gastos</th>
                <th scope="col" className="px-2 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Utilidad</th>
                <th scope="col" className="px-2 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Balance</th>
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r) => (
                <tr key={r.id} className="border-t border-line/70">
                  <td className="px-4.5 py-2.5 font-semibold whitespace-nowrap">{formatPeriodo(r.periodo)}</td>
                  <td className="num px-2 py-2.5 text-ink-700">v{r.version}</td>
                  <td className="px-2 py-2.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_BADGE[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                  <td className="num px-2 py-2.5 text-right">{formatUSD(r.ingresosOperacionales)}</td>
                  <td className="num px-2 py-2.5 text-right">{formatUSD(gastosTotales(r))}</td>
                  <td className="num px-2 py-2.5 text-right font-semibold">{formatUSD(utilidadNeta(r))}</td>
                  <td className="px-2 py-2.5 text-[12.5px] font-semibold">
                    {balanceCuadrado(r) ? (
                      <span className="text-emerald-deep">✓ Cuadrado</span>
                    ) : (
                      <span className="text-destructive">⚠ Descuadrado</span>
                    )}
                  </td>
                  <td className="px-4.5 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/financiero/${r.id}`)}
                        className="min-h-8.5 rounded-md border border-line bg-card px-2.5 text-[12px] font-semibold text-ink-700"
                      >
                        Ver
                      </button>
                      {r.estado === 'BORRADOR' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/app/financiero/${r.id}/editar`)}
                          className="min-h-8.5 rounded-md border border-navy-600 bg-navy-600 px-2.5 text-[12px] font-semibold text-white"
                        >
                          Continuar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtrados.length === 0 && (
            <p className="px-4.5 py-8 text-center text-[13.5px] text-ink-500">
              {registros.length === 0
                ? 'Aún no hay periodos cargados para esta empresa.'
                : 'Ningún periodo coincide con los filtros.'}
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <EvolucionFinancieraChart registros={registros} />
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[17px] font-semibold">Alertas, validaciones y recomendaciones</h2>
          <div className="mt-3.5 flex flex-col gap-2.5">
            {alertas.length === 0 ? (
              <div className="rounded-lg border border-dashed border-line p-3.5">
                <p className="text-[13px] leading-relaxed text-ink-700">
                  No hay alertas pendientes para {empresaActiva.nombre}.
                </p>
              </div>
            ) : (
              alertas.map((a) => (
                <div key={a} className="rounded-lg bg-amber-soft p-3">
                  <p className="text-[13px] leading-relaxed text-ink-900">{a}</p>
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

- [ ] **Step 3: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los existentes (después de la línea 28):

```tsx
import { FinancieroScreen } from './portal/financiero/FinancieroScreen'
```

Agregar la ruta dentro del bloque `<Route path="/app" ...>` (después de la línea 168, `empresa/editar`):

```tsx
        <Route path="financiero" element={<FinancieroScreen />} />
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual**

Run: `npm run dev`, iniciar sesión, ir a `/app/financiero` (o clic en "Financiero" en el sidebar):
confirmar 3 KPIs con datos de julio, tabla con 7 filas (5 vigente, 1 borrador, 1 reemplazado) ordenadas
por periodo descendente, filtro por estado y búsqueda funcionando, gráfico de evolución con 3 líneas, y
que "Comparar periodos" está habilitado (hay 6 registros elegibles). Cambiar de empresa a Comercial del
Valle desde el `CompanySwitcher` y confirmar tabla vacía, gráfico con mensaje "Sin periodos vigentes para
graficar", y "Comparar periodos" deshabilitado con ícono de candado.

- [ ] **Step 6: Commit**

```bash
git add src/portal/financiero/EvolucionFinancieraChart.tsx src/portal/financiero/FinancieroScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Estados financieros"
```

---

### Task 5: Wizard "Nueva carga financiera" (10 pasos)

**Files:**
- Create: `src/portal/financiero/wizard-steps.ts`
- Create: `src/portal/financiero/NuevaCargaScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `RegistroFinanciero` (Task 1); `usePortalData()` → `empresaActiva`, `registrosFinancieros`, `addRegistroFinanciero`, `updateRegistroFinanciero` (Task 3); `utilidadNeta`, `balanceCuadrado`, `descuadreBalance`, `activoTotal`, `pasivoTotal`, `patrimonio` (Task 2); `formatUSD` (Task 2).
- Produces: `WizardStep` (`1|2|...|10`), `CampoFinancieroKey`, `PASOS: { n: WizardStep; label: string }[]`, `PASOS_CAMPOS: Record<2|3|4|5|6|7|8|9, CampoDefinicion[]>` — reusados por Tasks 6 y 7 para mostrar los mismos labels de campo.

- [ ] **Step 1: Crear `src/portal/financiero/wizard-steps.ts`**

```ts
import type { RegistroFinanciero } from '@/portal/types'

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type CampoFinancieroKey = keyof Omit<
  RegistroFinanciero,
  'id' | 'periodo' | 'version' | 'estado' | 'observaciones' | 'createdAt' | 'updatedAt'
>

export type CampoDefinicion = {
  key: CampoFinancieroKey
  label: string
  hint?: string
  min?: number
}

export const PASOS: { n: WizardStep; label: string }[] = [
  { n: 1, label: 'Periodo' },
  { n: 2, label: 'Activo' },
  { n: 3, label: 'Pasivo' },
  { n: 4, label: 'Patrimonio' },
  { n: 5, label: 'Ingresos' },
  { n: 6, label: 'Costos' },
  { n: 7, label: 'Gastos' },
  { n: 8, label: 'Flujo de efectivo' },
  { n: 9, label: 'Complementario' },
  { n: 10, label: 'Revisión' },
]

export const PASOS_CAMPOS: Record<2 | 3 | 4 | 5 | 6 | 7 | 8 | 9, CampoDefinicion[]> = {
  2: [
    { key: 'efectivoEquivalentes', label: 'Efectivo y equivalentes', min: 0 },
    { key: 'cuentasPorCobrar', label: 'Cuentas por cobrar', min: 0 },
    { key: 'inventarios', label: 'Inventarios', min: 0 },
    { key: 'otrosActivosCorrientes', label: 'Otros activos corrientes', min: 0 },
    { key: 'activoFijoNeto', label: 'Activo fijo neto', min: 0 },
    { key: 'otrosActivosNoCorrientes', label: 'Otros activos no corrientes', min: 0 },
  ],
  3: [
    { key: 'cuentasPorPagar', label: 'Cuentas por pagar', min: 0 },
    { key: 'deudaCortoPlazo', label: 'Deuda a corto plazo', min: 0 },
    { key: 'otrosPasivosCorrientes', label: 'Otros pasivos corrientes', min: 0 },
    { key: 'deudaLargoPlazo', label: 'Deuda a largo plazo', min: 0 },
    { key: 'otrosPasivosNoCorrientes', label: 'Otros pasivos no corrientes', min: 0 },
  ],
  4: [
    { key: 'capitalSocial', label: 'Capital social', min: 0 },
    { key: 'resultadosAcumulados', label: 'Resultados acumulados', hint: 'Puede ser negativo si hay pérdidas acumuladas' },
  ],
  5: [
    { key: 'ingresosOperacionales', label: 'Ingresos operacionales', min: 0 },
    { key: 'otrosIngresos', label: 'Otros ingresos', min: 0 },
  ],
  6: [{ key: 'costoVentas', label: 'Costo de ventas', min: 0 }],
  7: [
    { key: 'gastosAdministracion', label: 'Gastos de administración', min: 0 },
    { key: 'gastosVentas', label: 'Gastos de ventas', min: 0 },
    { key: 'otrosGastosOperacionales', label: 'Otros gastos operacionales', min: 0 },
    { key: 'gastosFinancieros', label: 'Gastos financieros', min: 0 },
    { key: 'impuestoRenta', label: 'Impuesto a la renta', min: 0 },
  ],
  8: [
    { key: 'flujoOperacion', label: 'Flujo de operación', hint: 'Puede ser negativo' },
    { key: 'flujoInversion', label: 'Flujo de inversión', hint: 'Puede ser negativo' },
    { key: 'flujoFinanciamiento', label: 'Flujo de financiamiento', hint: 'Puede ser negativo' },
  ],
  9: [
    { key: 'comprasPeriodo', label: 'Compras del periodo', min: 0 },
    { key: 'capex', label: 'Inversión en activos (CAPEX)', min: 0 },
    { key: 'depreciacion', label: 'Depreciación del periodo', min: 0 },
    { key: 'numeroEmpleadosPeriodo', label: 'Número de empleados', min: 0 },
    { key: 'costoLaboral', label: 'Costo laboral', min: 0 },
    { key: 'gastoID', label: 'Gasto en investigación y desarrollo', min: 0 },
    { key: 'unidadesVendidas', label: 'Unidades vendidas', min: 0 },
  ],
}

export function crearRegistroVacio(): RegistroFinanciero {
  return {
    id: crypto.randomUUID(),
    periodo: '',
    version: 1,
    estado: 'BORRADOR',
    observaciones: '',
    efectivoEquivalentes: 0,
    cuentasPorCobrar: 0,
    inventarios: 0,
    otrosActivosCorrientes: 0,
    activoFijoNeto: 0,
    otrosActivosNoCorrientes: 0,
    cuentasPorPagar: 0,
    deudaCortoPlazo: 0,
    otrosPasivosCorrientes: 0,
    deudaLargoPlazo: 0,
    otrosPasivosNoCorrientes: 0,
    capitalSocial: 0,
    resultadosAcumulados: 0,
    ingresosOperacionales: 0,
    otrosIngresos: 0,
    costoVentas: 0,
    gastosAdministracion: 0,
    gastosVentas: 0,
    otrosGastosOperacionales: 0,
    gastosFinancieros: 0,
    impuestoRenta: 0,
    flujoOperacion: 0,
    flujoInversion: 0,
    flujoFinanciamiento: 0,
    comprasPeriodo: 0,
    capex: 0,
    depreciacion: 0,
    numeroEmpleadosPeriodo: 0,
    costoLaboral: 0,
    gastoID: 0,
    unidadesVendidas: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 2: Crear `src/portal/financiero/NuevaCargaScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import type { RegistroFinanciero } from '@/portal/types'
import { activoTotal, descuadreBalance, pasivoTotal, patrimonio, utilidadNeta } from './calculo'
import { formatUSD } from './formato'
import { crearRegistroVacio, PASOS, PASOS_CAMPOS, type CampoDefinicion, type WizardStep } from './wizard-steps'

function validarPaso(paso: WizardStep, draft: RegistroFinanciero): Record<string, string> {
  const errores: Record<string, string> = {}
  if (paso === 1) {
    if (!draft.periodo) errores.periodo = 'Selecciona el periodo.'
    return errores
  }
  if (paso === 10) return errores
  const campos = PASOS_CAMPOS[paso]
  for (const campo of campos) {
    const valor = draft[campo.key]
    if (typeof campo.min === 'number' && valor < campo.min) {
      errores[campo.key] = `${campo.label} no puede ser menor a ${campo.min}.`
    }
  }
  return errores
}

function CamposPaso({
  campos,
  draft,
  errores,
  onChange,
}: {
  campos: CampoDefinicion[]
  draft: RegistroFinanciero
  errores: Record<string, string>
  onChange: (key: CampoDefinicion['key'], value: number) => void
}) {
  return (
    <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
      {campos.map((campo) => (
        <div key={campo.key}>
          <Label htmlFor={`nc-${campo.key}`}>{campo.label}</Label>
          <Input
            id={`nc-${campo.key}`}
            type="number"
            step="0.01"
            min={campo.min}
            value={draft[campo.key]}
            onChange={(e) => onChange(campo.key, Number(e.target.value))}
            className="mt-1.5"
          />
          {campo.hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{campo.hint}</p>}
          {errores[campo.key] && (
            <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
              {errores[campo.key]}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function NuevaCargaScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, registrosFinancieros, addRegistroFinanciero, updateRegistroFinanciero } = usePortalData()

  const registroExistente = id
    ? (registrosFinancieros[empresaActiva.id] ?? []).find((r) => r.id === id)
    : undefined

  const [draft, setDraft] = useState<RegistroFinanciero>(registroExistente ?? crearRegistroVacio())
  const [step, setStep] = useState<WizardStep>(1)
  const [maxStepReached, setMaxStepReached] = useState<WizardStep>(1)
  const [errores, setErrores] = useState<Record<string, string>>({})

  const esEdicion = Boolean(registroExistente)

  const actualizarCampo = (key: CampoDefinicion['key'], value: number) => {
    setDraft((d) => ({ ...d, [key]: value }))
  }

  const handleContinuar = () => {
    const erroresPaso = validarPaso(step, draft)
    setErrores(erroresPaso)
    if (Object.keys(erroresPaso).length > 0) return
    const siguiente = Math.min(step + 1, 10) as WizardStep
    setStep(siguiente)
    setMaxStepReached((m) => (siguiente > m ? siguiente : m))
  }

  const handleAtras = () => {
    if (step === 1) {
      navigate('/app/financiero')
      return
    }
    setErrores({})
    setStep((s) => (s - 1) as WizardStep)
  }

  const irAPaso = (n: WizardStep) => {
    if (n > maxStepReached) return
    setErrores({})
    setStep(n)
  }

  const persistir = (registro: RegistroFinanciero) => {
    if (esEdicion) {
      updateRegistroFinanciero(empresaActiva.id, registro.id, registro)
    } else {
      addRegistroFinanciero(empresaActiva.id, registro)
    }
  }

  const handleGuardarBorrador = () => {
    persistir({ ...draft, estado: 'BORRADOR', updatedAt: new Date().toISOString() })
    navigate('/app/financiero')
  }

  const descuadre = descuadreBalance(draft)
  const cuadrado = Math.abs(descuadre) < 0.01

  const handleFinalizar = () => {
    if (!cuadrado) return
    const registroFinal: RegistroFinanciero = { ...draft, estado: 'VIGENTE', updatedAt: new Date().toISOString() }
    persistir(registroFinal)
    navigate(`/app/financiero/${registroFinal.id}`)
  }

  const pasoActual = PASOS[step - 1]

  return (
    <section className="flex flex-col gap-4.5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Nueva carga financiera</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">{empresaActiva.nombre} · diez pasos · moneda USD</p>
      </div>

      <ol className="flex flex-wrap gap-2">
        {PASOS.map((p) => (
          <li key={p.n}>
            <button
              type="button"
              onClick={() => irAPaso(p.n)}
              disabled={p.n > maxStepReached}
              aria-current={p.n === step}
              className={`grid h-8.5 w-8.5 place-items-center rounded-full border text-[13px] font-bold disabled:cursor-not-allowed ${
                p.n === step
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : p.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
              title={p.label}
            >
              {p.n}
            </button>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">{pasoActual.label}</h2>

        {step === 1 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="nc-periodo">Periodo</Label>
              <Input
                id="nc-periodo"
                type="month"
                value={draft.periodo ? draft.periodo.slice(0, 7) : ''}
                onChange={(e) => setDraft((d) => ({ ...d, periodo: e.target.value ? `${e.target.value}-01` : '' }))}
                className="mt-1.5"
              />
              {errores.periodo && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                  {errores.periodo}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="nc-moneda">Moneda</Label>
              <Input id="nc-moneda" value="USD" readOnly className="mt-1.5 bg-surface text-ink-500" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="nc-observaciones">Observaciones</Label>
              <Textarea
                id="nc-observaciones"
                rows={3}
                value={draft.observaciones}
                onChange={(e) => setDraft((d) => ({ ...d, observaciones: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>
        )}

        {step >= 2 && step <= 9 && (
          <CamposPaso campos={PASOS_CAMPOS[step]} draft={draft} errores={errores} onChange={actualizarCampo} />
        )}

        {step === 7 && (
          <div className="mt-4 rounded-lg border border-line/70 bg-surface p-3.5">
            <p className="text-[12.5px] text-ink-500">Utilidad neta calculada esperada</p>
            <p className="num mt-1.5 font-display text-xl font-bold">{formatUSD(utilidadNeta(draft))}</p>
          </div>
        )}

        {step === 10 && (
          <div className="mt-4 flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Activo total</p>
                <p className="num mt-1.5 text-[15px] font-semibold">{formatUSD(activoTotal(draft))}</p>
              </div>
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Pasivo + patrimonio</p>
                <p className="num mt-1.5 text-[15px] font-semibold">
                  {formatUSD(pasivoTotal(draft) + patrimonio(draft))}
                </p>
              </div>
              <div className="rounded-lg border border-line/70 bg-surface p-3.5">
                <p className="text-[12.5px] text-ink-500">Utilidad neta</p>
                <p className="num mt-1.5 text-[15px] font-semibold">{formatUSD(utilidadNeta(draft))}</p>
              </div>
            </div>
            <p
              className={`rounded-lg p-3.5 text-[13px] font-semibold leading-relaxed ${
                cuadrado ? 'bg-emerald-soft text-emerald-deep' : 'bg-danger-soft text-destructive'
              }`}
            >
              {cuadrado
                ? 'El balance cuadra: activo total = pasivo + patrimonio.'
                : `El balance no cuadra. Diferencia de ${formatUSD(Math.abs(descuadre))} — revisa los pasos anteriores antes de finalizar.`}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
          <button
            type="button"
            onClick={handleAtras}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleGuardarBorrador}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
          >
            Guardar borrador
          </button>
          {step < 10 ? (
            <button
              type="button"
              onClick={handleContinuar}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalizar}
              disabled={!cuadrado}
              className="min-h-11 rounded-lg bg-emerald-brand px-4.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Finalizar carga
            </button>
          )}
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 3: Agregar las rutas en `src/App.tsx`**

Agregar el import junto al de `FinancieroScreen`:

```tsx
import { NuevaCargaScreen } from './portal/financiero/NuevaCargaScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `financiero`:

```tsx
        <Route path="financiero/nuevo" element={<NuevaCargaScreen />} />
        <Route path="financiero/:id/editar" element={<NuevaCargaScreen />} />
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual — carga nueva completa**

Run: `npm run dev`, ir a `/app/financiero`, clic en "Nueva carga financiera". Completar el periodo
(ej. septiembre 2026) y avanzar por los 10 pasos con valores de ejemplo (pueden ser simples, ej. activo
100000 repartido en efectivo, pasivo 40000 en cuentas por pagar, patrimonio 60000 en capital social).
Confirmar que en el paso 7 "Utilidad neta calculada esperada" cambia en vivo al editar los gastos, que en
el paso 10 el mensaje de cuadre es correcto según los números ingresados, y que "Finalizar carga" está
deshabilitado si no cuadra. Ajustar valores hasta que cuadre, finalizar, y confirmar que redirige al
Detalle del nuevo registro y que este aparece en la lista de `/app/financiero`.

- [ ] **Step 6: Verificación manual — borrador**

Desde `/app/financiero`, clic en "Continuar" sobre la fila de agosto 2026 (Borrador). Confirmar que el
wizard carga los valores ya guardados (efectivo/cuentas por cobrar/inventarios/otros activos corrientes
del paso 2), completar el resto y usar "Guardar borrador" a mitad de camino: confirmar que vuelve a la
lista y el registro sigue en estado Borrador con los nuevos valores.

- [ ] **Step 7: Commit**

```bash
git add src/portal/financiero/wizard-steps.ts src/portal/financiero/NuevaCargaScreen.tsx src/App.tsx
git commit -m "feat: agregar wizard Nueva carga financiera (10 pasos)"
```

---

### Task 6: Pantalla "Detalle de registro financiero"

**Files:**
- Create: `src/portal/financiero/DetalleRegistroScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PASOS_CAMPOS` (Task 5, para los labels de cada bloque); `usePortalData()` → `empresaActiva`, `registrosFinancieros` (Task 3); `calcularIndicadores`, `calcularDiagnostico`, `activoTotal`, `pasivoTotal`, `patrimonio`, `utilidadNeta` (Task 2); `formatUSD`, `formatPeriodo` (Task 2).
- Produces: ruta `/app/financiero/:id` montada.

- [ ] **Step 1: Crear `src/portal/financiero/DetalleRegistroScreen.tsx`**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { FactorIndicador, SemaforoIndicador } from '@/portal/types'
import { activoTotal, calcularDiagnostico, calcularIndicadores, patrimonio, pasivoTotal, utilidadNeta } from './calculo'
import { formatPeriodo, formatUSD } from './formato'
import { PASOS_CAMPOS } from './wizard-steps'

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const GRUPOS_BLOQUE: { titulo: string; pasos: (2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] }[] = [
  { titulo: 'Activo', pasos: [2] },
  { titulo: 'Pasivo', pasos: [3] },
  { titulo: 'Patrimonio', pasos: [4] },
  { titulo: 'Ingresos y costos', pasos: [5, 6] },
  { titulo: 'Gastos', pasos: [7] },
  { titulo: 'Flujo de efectivo', pasos: [8] },
  { titulo: 'Complementario', pasos: [9] },
]

export function DetalleRegistroScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, registrosFinancieros } = usePortalData()

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const registro = registros.find((r) => r.id === id)

  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró ese registro financiero.</p>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Estados financieros
        </button>
      </section>
    )
  }

  const indicadores = calcularIndicadores(registro)
  const diagnostico = calcularDiagnostico(registro)
  const otrasVersiones = registros
    .filter((r) => r.periodo === registro.periodo && r.id !== registro.id)
    .sort((a, b) => b.version - a.version)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/financiero')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
          >
            ← Estados financieros
          </button>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight">{formatPeriodo(registro.periodo)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700">
              {registro.estado}
            </span>
            <span className="text-[13px] text-ink-500">v{registro.version} · solo lectura</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {registro.estado === 'BORRADOR' && (
            <button
              type="button"
              onClick={() => navigate(`/app/financiero/${registro.id}/editar`)}
              className="min-h-11 rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white"
            >
              Continuar carga
            </button>
          )}
        </div>
      </div>

      {GRUPOS_BLOQUE.map((grupo) => (
        <section key={grupo.titulo} className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">{grupo.titulo}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {grupo.pasos.flatMap((paso) => PASOS_CAMPOS[paso]).map((campo) => (
              <div key={campo.key} className="flex items-center justify-between gap-3 border-b border-line/70 pb-2">
                <dt className="text-[12.5px] text-ink-500">{campo.label}</dt>
                <dd className="num text-[13.5px] font-semibold">{formatUSD(registro[campo.key] as number)}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Indicadores calculados</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Código</th>
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Factor</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Valor</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((i) => (
                <tr key={i.codigo} className="border-t border-line/70">
                  <td className="px-2 py-2 font-mono text-[11.5px] text-ink-500">{i.codigo}</td>
                  <td className="px-2 py-2 font-medium">{i.nombre}</td>
                  <td className="px-2 py-2 text-ink-700">{FACTOR_LABEL[i.factor]}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{i.valorFormateado}</td>
                  <td className="px-2 py-2 text-right">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>
                      {i.semaforo}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Diagnóstico</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {diagnostico.map((linea) => (
              <li key={linea} className="text-[13.5px] leading-relaxed text-ink-700">
                {linea}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-line/70 pt-3 sm:grid-cols-3">
            <div>
              <dt className="text-[11.5px] text-ink-500">Activo total</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(activoTotal(registro))}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-500">Pasivo + patrimonio</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(pasivoTotal(registro) + patrimonio(registro))}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-500">Utilidad neta</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(utilidadNeta(registro))}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Historial de versiones</h2>
          {otrasVersiones.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-500">No hay otras versiones para este periodo.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2.5">
              {otrasVersiones.map((v) => (
                <li key={v.id} className="rounded-lg border border-line/70 bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[13.5px]">v{v.version}</strong>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                      {v.estado}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/financiero/${v.id}`)}
                      className="ml-auto text-[12.5px] font-semibold text-navy-500"
                    >
                      Ver
                    </button>
                  </div>
                  {v.observaciones && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{v.observaciones}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los anteriores:

```tsx
import { DetalleRegistroScreen } from './portal/financiero/DetalleRegistroScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, después de `financiero/:id/editar`:

```tsx
        <Route path="financiero/:id" element={<DetalleRegistroScreen />} />
```

Nota: en React Router, rutas hermanas como `financiero/:id/editar` y `financiero/:id` no compiten entre sí
(el matcher exige el segmento completo), así que el orden entre ellas no importa aquí — pero por claridad se
deja `financiero/:id` después de las rutas más específicas (`nuevo`, `:id/editar`).

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, desde `/app/financiero` clic en "Ver" del registro de julio 2026 (vigente): confirmar
los 7 grupos de bloques con valores correctos, la tabla de 23 indicadores con semáforos coherentes (ej.
`LIQ_01` en verde, valor ~2.03), diagnóstico con al menos 2 líneas, y que no hay otras versiones (julio
solo tiene v1). Luego ver el registro de junio 2026 vigente (v2): confirmar que "Historial de versiones"
muestra la v1 (Reemplazado) con su observación, y que se puede navegar a verla.

- [ ] **Step 5: Commit**

```bash
git add src/portal/financiero/DetalleRegistroScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Detalle de registro financiero"
```

---

### Task 7: Pantalla "Comparar periodos"

**Files:**
- Create: `src/portal/financiero/CompararPeriodosScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `PASOS_CAMPOS` (Task 5); `usePortalData()` → `empresaActiva`, `registrosFinancieros` (Task 3); `calcularIndicadores`, `activoTotal`, `gastosTotales`, `utilidadNeta` (Task 2); `formatUSD`, `formatPeriodo` (Task 2).
- Produces: ruta `/app/financiero/comparar` montada. Última pantalla del módulo — cierra la Fase 3.

- [ ] **Step 1: Crear `src/portal/financiero/CompararPeriodosScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { RegistroFinanciero } from '@/portal/types'
import { activoTotal, calcularIndicadores, gastosTotales, utilidadNeta } from './calculo'
import { formatPeriodo, formatUSD } from './formato'
import { PASOS_CAMPOS } from './wizard-steps'

const INDICADORES_PRINCIPALES = ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08']

const SECCIONES_CONCEPTO: { titulo: string; pasos: (2 | 3 | 5 | 7)[] }[] = [
  { titulo: 'Activo', pasos: [2] },
  { titulo: 'Pasivo', pasos: [3] },
  { titulo: 'Ingresos y gastos', pasos: [5, 7] },
]

function variacion(a: number, b: number): { dif: number; pct: number; fg: string } {
  const dif = b - a
  const pct = a === 0 ? 0 : dif / Math.abs(a)
  return { dif, pct, fg: dif >= 0 ? 'text-emerald-deep' : 'text-destructive' }
}

export function CompararPeriodosScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros } = usePortalData()

  const opciones = (registrosFinancieros[empresaActiva.id] ?? [])
    .filter((r) => r.estado === 'VIGENTE' || r.estado === 'REEMPLAZADO')
    .sort((a, b) => b.periodo.localeCompare(a.periodo) || b.version - a.version)

  const [idA, setIdA] = useState(opciones[1]?.id ?? opciones[0]?.id ?? '')
  const [idB, setIdB] = useState(opciones[0]?.id ?? '')

  const registroA = opciones.find((r) => r.id === idA)
  const registroB = opciones.find((r) => r.id === idB)

  if (opciones.length < 2 || !registroA || !registroB) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">
          Necesitas al menos 2 periodos vigentes o reemplazados para comparar.
        </p>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Estados financieros
        </button>
      </section>
    )
  }

  const etiqueta = (r: RegistroFinanciero) => `${formatPeriodo(r.periodo)} (v${r.version})`
  const mismoRegistro = idA === idB

  const kpisResumen = [
    { titulo: 'Ingresos', a: registroA.ingresosOperacionales, b: registroB.ingresosOperacionales },
    { titulo: 'Gastos totales', a: gastosTotales(registroA), b: gastosTotales(registroB) },
    { titulo: 'Utilidad neta', a: utilidadNeta(registroA), b: utilidadNeta(registroB) },
    { titulo: 'Activo total', a: activoTotal(registroA), b: activoTotal(registroB) },
  ]

  const indicadoresA = calcularIndicadores(registroA)
  const indicadoresB = calcularIndicadores(registroB)
  const filasIndicadores = INDICADORES_PRINCIPALES.map((codigo) => {
    const iA = indicadoresA.find((i) => i.codigo === codigo)!
    const iB = indicadoresB.find((i) => i.codigo === codigo)!
    const { dif, fg } = variacion(iA.valor, iB.valor)
    return { nombre: iA.nombre, a: iA.valorFormateado, b: iB.valorFormateado, dif: dif.toFixed(2), fg }
  })

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
        >
          ← Estados financieros
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Comparar periodos</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          {etiqueta(registroA)} frente a {etiqueta(registroB)} · solo registros vigentes
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo A</label>
            <select
              value={idA}
              onChange={(e) => setIdA(e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">Periodo B</label>
            <select
              value={idB}
              onChange={(e) => setIdB(e.target.value)}
              className="min-h-11 w-full rounded-md border border-line bg-card px-2.5 text-[14px]"
            >
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {etiqueta(o)}
                </option>
              ))}
            </select>
          </div>
        </div>
        {mismoRegistro && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft p-3 text-[13px] font-semibold text-destructive">
            Selecciona dos periodos distintos para comparar.
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpisResumen.map((k) => {
          const { dif, fg } = variacion(k.a, k.b)
          return (
            <div key={k.titulo} className="rounded-xl border border-line bg-card p-4">
              <p className="text-[12.5px] font-semibold text-ink-500">{k.titulo}</p>
              <div className="mt-2.5 flex items-baseline gap-2">
                <span className="num text-[13px] text-ink-500">{formatUSD(k.a)}</span>
                <span aria-hidden="true" className="text-ink-500">→</span>
                <span className="num font-display text-xl font-bold">{formatUSD(k.b)}</span>
              </div>
              <p className={`num mt-1.5 text-[13px] font-semibold ${fg}`}>
                {dif >= 0 ? '+' : ''}
                {formatUSD(dif)}
              </p>
            </div>
          )
        })}
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Indicadores principales</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Variación</th>
              </tr>
            </thead>
            <tbody>
              {filasIndicadores.map((f) => (
                <tr key={f.nombre} className="border-t border-line/70">
                  <td className="px-2 py-2 font-medium">{f.nombre}</td>
                  <td className="num px-2 py-2 text-right">{f.a}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{f.b}</td>
                  <td className={`num px-2 py-2 text-right ${f.fg}`}>{f.dif}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {SECCIONES_CONCEPTO.map((seccion) => (
        <section key={seccion.titulo} className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">{seccion.titulo}</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-[13px]">
              <thead>
                <tr className="text-left text-ink-500">
                  <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Concepto</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo A</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Periodo B</th>
                  <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Variación</th>
                </tr>
              </thead>
              <tbody>
                {seccion.pasos.flatMap((paso) => PASOS_CAMPOS[paso]).map((campo) => {
                  const a = registroA[campo.key] as number
                  const b = registroB[campo.key] as number
                  const { dif, fg } = variacion(a, b)
                  return (
                    <tr key={campo.key} className="border-t border-line/70">
                      <td className="px-2 py-2 font-medium">{campo.label}</td>
                      <td className="num px-2 py-2 text-right">{formatUSD(a)}</td>
                      <td className="num px-2 py-2 text-right font-semibold">{formatUSD(b)}</td>
                      <td className={`num px-2 py-2 text-right ${fg}`}>
                        {dif >= 0 ? '+' : ''}
                        {formatUSD(dif)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los anteriores:

```tsx
import { CompararPeriodosScreen } from './portal/financiero/CompararPeriodosScreen'
```

Agregar dentro del bloque `<Route path="/app" ...>`, antes de `financiero/:id` (para que `comparar` no sea
interpretado como un `:id`):

```tsx
        <Route path="financiero/comparar" element={<CompararPeriodosScreen />} />
```

El bloque de rutas de `/app` queda así, en este orden (los estáticos `nuevo`/`comparar` y el compuesto
`:id/editar` antes del genérico `:id`):

```tsx
        <Route path="financiero" element={<FinancieroScreen />} />
        <Route path="financiero/nuevo" element={<NuevaCargaScreen />} />
        <Route path="financiero/comparar" element={<CompararPeriodosScreen />} />
        <Route path="financiero/:id/editar" element={<NuevaCargaScreen />} />
        <Route path="financiero/:id" element={<DetalleRegistroScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual**

Run: `npm run dev`, desde `/app/financiero` clic en "Comparar periodos": confirmar que los selects A/B
tienen las 6 opciones (5 vigente + 1 reemplazado), que por defecto muestra dos periodos distintos, que los
4 KPIs de variación y la tabla de 4 indicadores principales calculan correctamente, que las 3 secciones por
bloque (Activo/Pasivo/Ingresos y gastos) muestran variación concepto por concepto, y que elegir el mismo
periodo en A y B muestra el aviso. Confirmar además que el botón "Ver" en junio 2026 v1 (Reemplazado) desde
el Detalle permite llegar aquí y comparar esa versión con la v2 corregida — la diferencia en "Cuentas por
cobrar" debe reflejar el ajuste de $3.000 hecho en la Task 1.

- [ ] **Step 5: Commit**

```bash
git add src/portal/financiero/CompararPeriodosScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Comparar periodos"
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

1. `/app/financiero`: 3 KPIs, tabla de 7 registros, gráfico de evolución, panel de alertas mostrando "1
   carga(s) en borrador sin finalizar".
2. Completar el wizard de nueva carga de punta a punta para un periodo nuevo y confirmar que aparece en
   la lista como Vigente.
3. Continuar el borrador de agosto 2026, guardarlo de nuevo como borrador, confirmar que sigue en la lista.
4. Ver el detalle de julio 2026: 7 bloques, 23 indicadores, diagnóstico, sin otras versiones.
5. Ver el detalle de junio 2026 v2: confirmar que el historial de versiones muestra la v1 reemplazada.
6. Comparar julio 2026 vs. junio 2026 v2: confirmar KPIs, indicadores principales y secciones por concepto.
7. Cambiar a Comercial del Valle Cía. Ltda.: confirmar estado vacío en las 4 pantallas de Financiero
   (`/app/financiero` sin filas, `/app/financiero/comparar` con el mensaje de "necesitas al menos 2
   periodos").
8. Confirmar que `/app/dashboard`, `/app/empresa` y sus sub-rutas siguen funcionando exactamente igual que
   al final de la Fase 2 (no se rompió nada existente).

- [ ] **Step 2: Build de producción**

Run: `npm run build`

Expected: compila sin errores ni warnings de TypeScript.

- [ ] **Step 3: Actualizar `README.md`**

Agregar, después del párrafo de "Fase 2 (Mi Empresa)" en la sección "Portal privado (`/app`)" de
`README.md`, un párrafo nuevo:

```markdown
**Fase 3 (Financiero):** agrega `src/portal/financiero/`, el módulo de estados financieros — listar
periodos, cargar uno nuevo (wizard de 10 pasos que espeja el balance/estado de resultados/flujo de
efectivo), ver el detalle de un registro y comparar dos periodos. Introduce el primer motor de cálculo
real del portal (`src/portal/financiero/calculo.ts`): magnitudes contables (activo total, patrimonio,
utilidad neta, etc.) y un catálogo de 23 indicadores financieros (liquidez, solvencia, gestión,
rentabilidad) con fórmulas reales de la Superintendencia de Compañías del Ecuador, calculados en vivo
sobre lo que el usuario carga — no son datos mock fijos como en las fases anteriores. `PortalDataContext`
se extiende con `registrosFinancieros`, indexado por empresa; solo Textiles Andina S.A. arranca con
historial sembrado (Comercial del Valle Cía. Ltda. usa el estado vacío del mockup).
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: documentar la Fase 3 (Financiero) del portal privado en el README"
```

---

## Self-Review Notes

- **Cobertura del spec:** las 4 pantallas (Estados financieros, Nueva carga financiera, Detalle de
  registro, Comparar periodos), el motor de cálculo (magnitudes + 23 indicadores MVP + semáforos +
  diagnóstico + balance cuadrado), la extensión de `PortalDataContext`, el wizard de 10 pasos mapeado a
  los bloques, y los 7 registros semilla (5 vigente/1 borrador/1 reemplazado solo para Textiles Andina)
  están cada uno cubiertos por una task. El alcance recortado del spec (sin benchmarking sectorial, sin
  recalcular obligaciones, sin diagnóstico empresarial completo, sin validación de RUC) no requiere tasks
  propias — son omisiones deliberadas, no trabajo pendiente.
- **Consistencia de tipos:** `CampoFinancieroKey` (Task 5) se deriva de `RegistroFinanciero` (Task 1) por
  `Omit`, así que cualquier campo nuevo agregado al tipo en el futuro no rompe `wizard-steps.ts` en
  silencio — hay que agregarlo explícitamente a `PASOS_CAMPOS` o TypeScript lo dejará fuera del wizard sin
  error (aceptable: no todos los campos futuros tendrían que ser parte del wizard). Los nombres de función
  del motor de cálculo (`activoTotal`, `pasivoTotal`, `patrimonio`, `utilidadNeta`, `gastosTotales`,
  `balanceCuadrado`, `calcularIndicadores`, `calcularDiagnostico`) se usan con la misma firma en las Tasks
  4, 5, 6 y 7 — verificado que ninguna task usa un nombre distinto para la misma función.
  Los valores devueltos por `calcularSemaforo`/`calcularIndicadores` (Task 2) usan literalmente los tipos
  `SemaforoIndicador`/`FactorIndicador`/`IndicadorCalculado['unidad']` definidos en `types.ts` (Task 1).
- **Balance cuadrado en la semilla:** los 6 registros generados por escala lineal de `REGISTRO_JULIO_BASE`
  preservan la igualdad Activo = Pasivo + Patrimonio (escalar ambos lados de una igualdad por el mismo
  factor la preserva), excepto el de junio v1 (Reemplazado), al que se le resta $3.000 a propósito de
  `cuentasPorCobrar` para que quede descuadrado — es intencional, sirve para mostrar el badge "⚠
  Descuadrado" en la lista y el aviso correspondiente en el Detalle/QA (Task 8, paso 5 verifica el
  historial de versiones, no el descuadre en sí; queda cubierto implícitamente por la Task 6, paso 4, que
  sí revisa el balance del vigente de julio).
- **Placeholders:** ningún paso usa "TBD"/"similar a la Task N sin código"/"agregar validación" sin mostrar
  el código real — todas las tasks incluyen el archivo completo o el diff exacto a aplicar.

---

**Plan complete and saved to `docs/superpowers/plans/2026-08-07-portal-privado-fase3-financiero.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
