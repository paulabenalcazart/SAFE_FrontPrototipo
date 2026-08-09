# Portal Privado — Fase 5 (Obligaciones tributarias) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Obligaciones tributarias" del portal privado — catálogo tributario del SRI, generación por empresa según noveno dígito del RUC, pantalla de resumen (KPIs + calendario/lista + prioridad + acciones rápidas + alertas) y pantalla de detalle con acciones (marcar cumplida, configurar recordatorio).

**Architecture:** Motor de cálculo puro nuevo (`src/portal/obligaciones/calculo.ts`) que deriva el estado de cada obligación (`PENDIENTE/PROXIMA/VENCIDA/CUMPLIDA/NO_APLICA`) a partir de su fecha límite y una fecha "hoy" fija — mismo patrón de funciones puras que `financiero/calculo.ts`, sin acoplarse a él. Un catálogo estático (`obligaciones/catalogo.ts`) describe las 5 obligaciones tributarias soportadas; una semilla en `data/mock-portal-data.ts` construye las instancias por empresa usando ese catálogo + la fórmula del noveno dígito. `PortalDataContext` gana el estado `obligacionesEmpresa` y dos mutaciones (marcar cumplida, toggle recordatorio). Dos pantallas nuevas bajo `src/portal/obligaciones/` consumen todo esto; el Dashboard de Fase 1 solo gana un enlace funcional.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, `react-router-dom`, `lucide-react`.

## Global Constraints

- Prototipo **solo frontend**, sin backend.
- `obligacionesEmpresa` **no** persiste en `localStorage` — vive en memoria de React (mismo patrón que `registrosFinancieros`/`indicadoresPrincipales`).
- `HOY_OBLIGACIONES = '2026-08-13'` es una **única constante exportada** desde `obligaciones/calculo.ts` — ningún otro archivo hardcodea ese string; siempre se importa.
- Catálogo: **solo categoría TRIBUTARIA**, 5 códigos exactos: `IVA_MENSUAL`, `RET_FUENTE_MENSUAL`, `IR_SOCIEDADES`, `ANTICIPO_IR`, `CUOTA_RIMPE`.
- Fórmula del noveno dígito (tabla SRI real): `{1:10,2:12,3:14,4:16,5:18,6:20,7:22,8:24,9:26,0:28}`.
- Textiles Andina (RUC `1792146739001`, noveno dígito `3` → día `14`): recibe 12 `IVA_MENSUAL` + 12 `RET_FUENTE_MENSUAL` (periodos 2026-01 a 2026-12) + 1 `IR_SOCIEDADES` (ejercicio 2025, vence 2026-04-14) + 2 `ANTICIPO_IR` (1ra cuota vence 2026-07-14, 2da cuota vence 2026-09-14) = **27 registros**.
- Comercial del Valle: solo 2 `CUOTA_RIMPE` (1er semestre vence 2026-07-20 cumplida, 2do semestre vence 2027-01-20 pendiente) = **2 registros**.
- Montos de julio (IVA `$1.240`, Retención `$310`, Renta 2025 `$4.850`, Anticipo 1ra cuota `$960`) son cifras fijas; el resto usa variación determinística. `CUOTA_RIMPE` usa `$60` fijo. `baseCalculo` queda `undefined` en toda la semilla.
- Todos los registros pasados (fecha límite < `HOY_OBLIGACIONES`) se siembran **cumplidos**, excepto la 1ra cuota de `ANTICIPO_IR` de Textiles Andina, que queda deliberadamente **vencida**.
- Colores de estado **propios del módulo** (`ESTADO_OBLIGACION_LABEL`/`BADGE`/`SWATCH` en `obligaciones/estado-estilo.ts`) — no reusar `Tono`/`TONE_BADGE_CLASSES` de `tone.ts`: el mockup pinta "Cumplida" en navy, no emerald.
- El repo no tiene test runner ni eslint — verificación vía `npm run build` (type-check) + scripts puntuales `npx tsx -e "..."` + revisión manual en el navegador con `npm run dev`. No agregar frameworks de testing.
- Reusar tokens y convenciones ya establecidos: `border-line/70`, `bg-card`/`bg-surface`, controles de filtro `min-h-10` + `text-[13px]`, botones de acción secundarios `min-h-11` + `text-sm`/`text-[13.5px]`, botones pequeños `min-h-8.5`/`min-h-9.5` + `text-[12px]`/`text-[12.5px]`.

---

## File Structure

```
src/
├── App.tsx                                       # Modify: 2 rutas nuevas (Tasks 5, 6)
├── portal/
│   ├── types.ts                                   # Modify: tipos de obligaciones (Task 1)
│   ├── PortalDataContext.tsx                      # Modify: obligacionesEmpresa (Task 3)
│   ├── data/
│   │   └── mock-portal-data.ts                    # Modify: obligacionesEmpresaSemilla (Task 2)
│   ├── dashboard/
│   │   └── ObligationsTable.tsx                   # Modify: conectar "Ver todas" (Task 7)
│   └── obligaciones/
│       ├── catalogo.ts                             # Create (Task 1): catálogo estático (5 códigos)
│       ├── calculo.ts                              # Create (Task 1): noveno dígito, estadoObligacion, HOY_OBLIGACIONES
│       ├── estado-estilo.ts                        # Create (Task 4): labels/colores por EstadoObligacion
│       ├── calendario.ts                           # Create (Task 5): grilla de celdas del mes (pura)
│       ├── ObligacionesScreen.tsx                  # Create (Task 5): Resumen
│       └── DetalleObligacionScreen.tsx             # Create (Task 6): Detalle
```

`obligaciones/` se agrupa aparte de `financiero/` e `indicadores/` porque es su propio sub-módulo con 2
pantallas relacionadas — mismo patrón que ya usaron esas carpetas. No depende de `financiero/calculo.ts` ni
de `RegistroFinanciero` en ningún punto — dominio completamente aparte.

---

### Task 1: Tipos de obligaciones + catálogo + motor de cálculo puro

**Files:**
- Modify: `src/portal/types.ts`
- Create: `src/portal/obligaciones/catalogo.ts`
- Create: `src/portal/obligaciones/calculo.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: tipos `CategoriaObligacion`, `PeriodicidadObligacion`, `EstadoObligacion`, `ObligacionCatalogo`,
  `ObligacionEmpresa` (usados por todas las tasks siguientes); `OBLIGACIONES_CATALOGO: ObligacionCatalogo[]`
  y `obligacionPorCodigo(codigo: string): ObligacionCatalogo | undefined` (usados por Tasks 2, 5, 6);
  `HOY_OBLIGACIONES: string`, `novenoDigito(ruc: string): number`, `diaPorNovenoDigito(digito: number): number`,
  `diasHasta(fechaLimite: string, hoy: string): number`,
  `estadoObligacion(o: Pick<ObligacionEmpresa, 'fechaLimite' | 'fechaCumplimiento'>, hoy: string): EstadoObligacion`
  (usados por Tasks 2, 3, 5, 6).

- [ ] **Step 1: Agregar los tipos de obligaciones al final de `src/portal/types.ts`**

```ts
export type CategoriaObligacion = 'TRIBUTARIA' | 'LABORAL' | 'SOCIETARIA' | 'MUNICIPAL'
export type PeriodicidadObligacion = 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'EVENTUAL'
export type EstadoObligacion = 'PENDIENTE' | 'PROXIMA' | 'VENCIDA' | 'CUMPLIDA' | 'NO_APLICA'

export type ObligacionCatalogo = {
  codigo: string
  nombre: string
  categoria: CategoriaObligacion
  institucion: string
  periodicidad: PeriodicidadObligacion
  formulario: string
  usaNovenoDigito: boolean
  permiteMontoEstimado: boolean
}

export type ObligacionEmpresa = {
  id: string
  obligacionCodigo: string // FK -> ObligacionCatalogo.codigo
  periodo: string // ISO, primer día de mes
  fechaLimite: string // ISO 'YYYY-MM-DD'
  baseCalculo?: number
  montoEstimado?: number
  fechaCumplimiento?: string // ISO 'YYYY-MM-DD'; presencia = fue marcada cumplida
  recordatorioActivo: boolean
  notas?: string
}
```

- [ ] **Step 2: Crear `src/portal/obligaciones/catalogo.ts`**

```ts
import type { ObligacionCatalogo } from '@/portal/types'

export const OBLIGACIONES_CATALOGO: ObligacionCatalogo[] = [
  {
    codigo: 'IVA_MENSUAL',
    nombre: 'Declaración de IVA',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'MENSUAL',
    formulario: 'Formulario 104',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'RET_FUENTE_MENSUAL',
    nombre: 'Retención en la fuente del Impuesto a la Renta',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'MENSUAL',
    formulario: 'Formulario 103',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'IR_SOCIEDADES',
    nombre: 'Impuesto a la Renta — Sociedades',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'ANUAL',
    formulario: 'Formulario 101',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'ANTICIPO_IR',
    nombre: 'Anticipo Impuesto a la Renta',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'SEMESTRAL',
    formulario: 'Débito automático SRI',
    usaNovenoDigito: true,
    permiteMontoEstimado: true,
  },
  {
    codigo: 'CUOTA_RIMPE',
    nombre: 'Cuota RIMPE Negocio Popular',
    categoria: 'TRIBUTARIA',
    institucion: 'SRI',
    periodicidad: 'SEMESTRAL',
    formulario: 'Pago cuota RIMPE',
    usaNovenoDigito: false,
    permiteMontoEstimado: true,
  },
]

export function obligacionPorCodigo(codigo: string): ObligacionCatalogo | undefined {
  return OBLIGACIONES_CATALOGO.find((o) => o.codigo === codigo)
}
```

- [ ] **Step 3: Crear `src/portal/obligaciones/calculo.ts`**

```ts
import type { EstadoObligacion, ObligacionEmpresa } from '@/portal/types'

export const HOY_OBLIGACIONES = '2026-08-13'

const DIA_POR_NOVENO_DIGITO: Record<number, number> = {
  1: 10, 2: 12, 3: 14, 4: 16, 5: 18, 6: 20, 7: 22, 8: 24, 9: 26, 0: 28,
}

export function novenoDigito(ruc: string): number {
  return Number(ruc.charAt(8))
}

export function diaPorNovenoDigito(digito: number): number {
  return DIA_POR_NOVENO_DIGITO[digito]
}

export function diasHasta(fechaLimite: string, hoy: string): number {
  const msPorDia = 1000 * 60 * 60 * 24
  const [ay, am, ad] = fechaLimite.split('-').map(Number)
  const [hy, hm, hd] = hoy.split('-').map(Number)
  const limite = Date.UTC(ay, am - 1, ad)
  const actual = Date.UTC(hy, hm - 1, hd)
  return Math.round((limite - actual) / msPorDia)
}

export function estadoObligacion(
  o: Pick<ObligacionEmpresa, 'fechaLimite' | 'fechaCumplimiento'>,
  hoy: string,
): EstadoObligacion {
  if (o.fechaCumplimiento) return 'CUMPLIDA'
  const dias = diasHasta(o.fechaLimite, hoy)
  if (dias < 0) return 'VENCIDA'
  if (dias <= 15) return 'PROXIMA'
  return 'PENDIENTE'
}
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { novenoDigito, diaPorNovenoDigito, diasHasta, estadoObligacion, HOY_OBLIGACIONES } from './src/portal/obligaciones/calculo.ts'
console.log('noveno digito', novenoDigito('1792146739001'))
console.log('dia por digito 3', diaPorNovenoDigito(3))
console.log('dias hasta 2026-08-14', diasHasta('2026-08-14', HOY_OBLIGACIONES))
console.log('estado proxima', estadoObligacion({ fechaLimite: '2026-08-14' }, HOY_OBLIGACIONES))
console.log('estado vencida', estadoObligacion({ fechaLimite: '2026-07-14' }, HOY_OBLIGACIONES))
console.log('estado cumplida', estadoObligacion({ fechaLimite: '2026-07-14', fechaCumplimiento: '2026-07-14' }, HOY_OBLIGACIONES))
"`

Si `npx tsx` falla por no poder resolver el alias `@/`, no es bloqueante — el import de tipos se elimina en
tiempo de compilación y no debería requerir resolución en runtime; si aun así falla, confiar en `npm run
build` (mismo criterio que Fase 3/4). Expected si corre: `noveno digito 3`, `dia por digito 3 14`,
`dias hasta 2026-08-14 1`, `estado proxima 'PROXIMA'`, `estado vencida 'VENCIDA'`, `estado cumplida
'CUMPLIDA'`.

- [ ] **Step 6: Commit**

```bash
git add src/portal/types.ts src/portal/obligaciones/catalogo.ts src/portal/obligaciones/calculo.ts
git commit -m "feat: agregar tipos, catalogo tributario y motor de calculo de obligaciones"
```

---

### Task 2: Semilla de obligaciones por empresa (`obligacionesEmpresaSemilla`)

**Files:**
- Modify: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: `ObligacionEmpresa` (Task 1, tipo); `diaPorNovenoDigito`, `diasHasta`, `novenoDigito`,
  `HOY_OBLIGACIONES` (Task 1, funciones/constante) desde `../obligaciones/calculo`.
- Produces: `obligacionesEmpresaSemilla: Record<string, ObligacionEmpresa[]>` (usado por Task 3).

- [ ] **Step 1: Ampliar los imports al inicio de `src/portal/data/mock-portal-data.ts`**

Reemplazar el bloque de import de tipos:

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

por:

```ts
import type {
  ChartSeriesPoint,
  Empresa,
  Indicador,
  Kpi,
  NavItem,
  Notificacion,
  Obligacion,
  ObligacionEmpresa,
  RegistroFinanciero,
} from '../types'
import { diaPorNovenoDigito, diasHasta, novenoDigito, HOY_OBLIGACIONES } from '../obligaciones/calculo'
```

- [ ] **Step 2: Agregar la construcción de la semilla al final de `src/portal/data/mock-portal-data.ts`**

```ts
function fechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function sumarMes(anio: number, mes: number): { anio: number; mes: number } {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 }
}

const DIA_TEXTILES_ANDINA = diaPorNovenoDigito(novenoDigito(empresaActiva.ruc))

function montoConVariacion(base: number, mes: number): number {
  // Variación determinística de hasta ±12% por mes, mismo criterio que construirCampos() arriba
  const factor = 1 + (((mes * 37) % 25) - 12) / 100
  return Math.round(base * factor)
}

function crearObligacionMensual(params: {
  obligacionCodigo: string
  anioPeriodo: number
  mesPeriodo: number
  monto: number
}): ObligacionEmpresa {
  const { anio: anioLimite, mes: mesLimite } = sumarMes(params.anioPeriodo, params.mesPeriodo)
  const fechaLimite = fechaISO(anioLimite, mesLimite, DIA_TEXTILES_ANDINA)
  const yaVencio = diasHasta(fechaLimite, HOY_OBLIGACIONES) < 0
  return {
    id: crypto.randomUUID(),
    obligacionCodigo: params.obligacionCodigo,
    periodo: fechaISO(params.anioPeriodo, params.mesPeriodo, 1),
    fechaLimite,
    montoEstimado: params.monto,
    fechaCumplimiento: yaVencio ? fechaLimite : undefined,
    recordatorioActivo: true,
  }
}

const MONTO_IVA_JULIO = 1240
const MONTO_RET_JULIO = 310

const obligacionesTextilesAndina: ObligacionEmpresa[] = []

for (let mes = 1; mes <= 12; mes++) {
  const montoIva = mes === 7 ? MONTO_IVA_JULIO : montoConVariacion(MONTO_IVA_JULIO, mes)
  const montoRet = mes === 7 ? MONTO_RET_JULIO : montoConVariacion(MONTO_RET_JULIO, mes)
  obligacionesTextilesAndina.push(
    crearObligacionMensual({ obligacionCodigo: 'IVA_MENSUAL', anioPeriodo: 2026, mesPeriodo: mes, monto: montoIva }),
    crearObligacionMensual({ obligacionCodigo: 'RET_FUENTE_MENSUAL', anioPeriodo: 2026, mesPeriodo: mes, monto: montoRet }),
  )
}

obligacionesTextilesAndina.push(
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'IR_SOCIEDADES',
    periodo: '2025-01-01',
    fechaLimite: '2026-04-14',
    montoEstimado: 4850,
    fechaCumplimiento: '2026-04-14',
    recordatorioActivo: true,
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'ANTICIPO_IR',
    periodo: '2026-07-01',
    fechaLimite: '2026-07-14',
    montoEstimado: 960,
    recordatorioActivo: true,
    notas: '1ra cuota',
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'ANTICIPO_IR',
    periodo: '2026-09-01',
    fechaLimite: '2026-09-14',
    montoEstimado: 960,
    recordatorioActivo: true,
    notas: '2da cuota',
  },
)

const obligacionesComercialDelValle: ObligacionEmpresa[] = [
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'CUOTA_RIMPE',
    periodo: '2026-01-01',
    fechaLimite: '2026-07-20',
    montoEstimado: 60,
    fechaCumplimiento: '2026-07-20',
    recordatorioActivo: true,
    notas: '1er semestre 2026',
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'CUOTA_RIMPE',
    periodo: '2026-07-01',
    fechaLimite: '2027-01-20',
    montoEstimado: 60,
    recordatorioActivo: true,
    notas: '2do semestre 2026',
  },
]

export const obligacionesEmpresaSemilla: Record<string, ObligacionEmpresa[]> = {
  'emp-1': obligacionesTextilesAndina,
  'emp-2': obligacionesComercialDelValle,
}
```

Nota: `empresaActiva` ya está definido más arriba en este mismo archivo (línea ~27), así que
`empresaActiva.ruc` está disponible sin import adicional.

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { obligacionesEmpresaSemilla } from './src/portal/data/mock-portal-data.ts'
console.log('emp-1 total', obligacionesEmpresaSemilla['emp-1'].length)
console.log('emp-2 total', obligacionesEmpresaSemilla['emp-2'].length)
const anticipo1 = obligacionesEmpresaSemilla['emp-1'].find(o => o.obligacionCodigo === 'ANTICIPO_IR' && o.notas === '1ra cuota')
console.log('anticipo cuota1', anticipo1?.fechaLimite, anticipo1?.fechaCumplimiento)
const julioIva = obligacionesEmpresaSemilla['emp-1'].find(o => o.obligacionCodigo === 'IVA_MENSUAL' && o.periodo === '2026-07-01')
console.log('iva julio', julioIva?.fechaLimite, julioIva?.montoEstimado, julioIva?.fechaCumplimiento)
"`

Expected: `emp-1 total 27`, `emp-2 total 2`, `anticipo cuota1 2026-07-14 undefined`,
`iva julio 2026-08-14 1240 undefined`. Si `npx tsx` no resuelve el alias `@/` (usado dentro de
`obligaciones/calculo.ts`), confiar en `npm run build` para este paso (mismo criterio que Task 1).

- [ ] **Step 5: Commit**

```bash
git add src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar semilla de obligaciones tributarias por empresa"
```

---

### Task 3: Extender `PortalDataContext` con `obligacionesEmpresa`

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `obligacionesEmpresaSemilla` (Task 2); `HOY_OBLIGACIONES` (Task 1) desde `./obligaciones/calculo`;
  `ObligacionEmpresa` (Task 1, tipo).
- Produces: `usePortalData()` gana `obligacionesEmpresa: Record<string, ObligacionEmpresa[]>`,
  `marcarObligacionCumplida(empresaId: string, id: string): void`,
  `toggleRecordatorioObligacion(empresaId: string, id: string): void` — usados por Tasks 5, 6, 7.

- [ ] **Step 1: Reemplazar el contenido completo de `src/portal/PortalDataContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa, ObligacionEmpresa, RegistroFinanciero } from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
  obligacionesEmpresaSemilla,
} from './data/mock-portal-data'
import { HOY_OBLIGACIONES } from './obligaciones/calculo'

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
  obligacionesEmpresa: Record<string, ObligacionEmpresa[]>
  marcarObligacionCumplida: (empresaId: string, id: string) => void
  toggleRecordatorioObligacion: (empresaId: string, id: string) => void
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
  const [obligacionesEmpresa, setObligacionesEmpresa] = useState<Record<string, ObligacionEmpresa[]>>(
    obligacionesEmpresaSemilla,
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

  const marcarObligacionCumplida = (empresaId: string, id: string) => {
    setObligacionesEmpresa((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((o) =>
        o.id === id ? { ...o, fechaCumplimiento: HOY_OBLIGACIONES } : o,
      ),
    }))
  }

  const toggleRecordatorioObligacion = (empresaId: string, id: string) => {
    setObligacionesEmpresa((current) => ({
      ...current,
      [empresaId]: (current[empresaId] ?? []).map((o) =>
        o.id === id ? { ...o, recordatorioActivo: !o.recordatorioActivo } : o,
      ),
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
        indicadoresPrincipales,
        setIndicadoresPrincipales,
        obligacionesEmpresa,
        marcarObligacionCumplida,
        toggleRecordatorioObligacion,
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

- [ ] **Step 3: Commit**

```bash
git add src/portal/PortalDataContext.tsx
git commit -m "feat: agregar obligacionesEmpresa al PortalDataContext"
```

---

### Task 4: Colores y etiquetas por estado (`estado-estilo.ts`)

**Files:**
- Create: `src/portal/obligaciones/estado-estilo.ts`

**Interfaces:**
- Consumes: `EstadoObligacion` (Task 1, tipo).
- Produces: `ESTADO_OBLIGACION_LABEL`, `ESTADO_OBLIGACION_BADGE`, `ESTADO_OBLIGACION_SWATCH` (todos
  `Record<EstadoObligacion, string>`) — usados por Tasks 5, 6.

- [ ] **Step 1: Crear `src/portal/obligaciones/estado-estilo.ts`**

```ts
import type { EstadoObligacion } from '@/portal/types'

export const ESTADO_OBLIGACION_LABEL: Record<EstadoObligacion, string> = {
  PENDIENTE: 'Pendiente',
  PROXIMA: 'Próxima',
  VENCIDA: 'Vencida',
  CUMPLIDA: 'Cumplida',
  NO_APLICA: 'No aplica',
}

// Colores propios de este módulo (no reusar Tono/TONE_BADGE_CLASSES): el mockup pinta
// "Cumplida" en navy, no emerald — ver leyenda del calendario en el spec de Fase 5.
export const ESTADO_OBLIGACION_BADGE: Record<EstadoObligacion, string> = {
  CUMPLIDA: 'bg-navy-100 text-navy-700',
  PROXIMA: 'bg-amber-soft text-amber-deep',
  VENCIDA: 'bg-danger-soft text-destructive',
  PENDIENTE: 'bg-surface text-ink-700',
  NO_APLICA: 'bg-surface text-ink-500',
}

export const ESTADO_OBLIGACION_SWATCH: Record<EstadoObligacion, string> = {
  CUMPLIDA: 'bg-navy-100 border-navy-600',
  PROXIMA: 'bg-amber-soft border-amber-brand',
  VENCIDA: 'bg-danger-soft border-destructive',
  PENDIENTE: 'bg-surface border-line',
  NO_APLICA: 'bg-surface border-line',
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/portal/obligaciones/estado-estilo.ts
git commit -m "feat: agregar labels y colores de estado para obligaciones"
```

---

### Task 5: Pantalla de Resumen (`ObligacionesScreen.tsx`) + calendario + ruta

**Files:**
- Create: `src/portal/obligaciones/calendario.ts`
- Create: `src/portal/obligaciones/ObligacionesScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `obligacionesEmpresa` (Task 3); `obligacionPorCodigo`
  (Task 1); `diasHasta`, `estadoObligacion`, `HOY_OBLIGACIONES` (Task 1); `ESTADO_OBLIGACION_LABEL`,
  `ESTADO_OBLIGACION_BADGE`, `ESTADO_OBLIGACION_SWATCH` (Task 4); `formatPeriodo`, `formatUSD` (ya existen en
  `@/portal/financiero/formato` desde Fase 3).
- Produces: componente `ObligacionesScreen` montado en la ruta `/app/obligaciones`; `construirCeldasMes(anio:
  number, mes: number): CeldaCalendario[]` y `diasSemanaLabels(): string[]` (usados solo dentro de esta
  pantalla, pero exportados por si Task 6 los necesitara).

- [ ] **Step 1: Crear `src/portal/obligaciones/calendario.ts`**

```ts
export type CeldaCalendario = {
  fecha: string // ISO 'YYYY-MM-DD'
  numero: number
  delMes: boolean
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function diasSemanaLabels(): string[] {
  return DIAS_SEMANA
}

export function construirCeldasMes(anio: number, mes: number): CeldaCalendario[] {
  const primerDiaMes = new Date(anio, mes - 1, 1)
  const offsetLunes = (primerDiaMes.getDay() + 6) % 7 // getDay(): 0=domingo..6=sábado -> 0=lunes..6=domingo
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const totalCeldas = Math.ceil((offsetLunes + diasEnMes) / 7) * 7

  const celdas: CeldaCalendario[] = []
  for (let i = 0; i < totalCeldas; i++) {
    const numeroDia = i - offsetLunes + 1
    const fecha = new Date(anio, mes - 1, numeroDia)
    celdas.push({
      fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
      numero: fecha.getDate(),
      delMes: fecha.getMonth() === mes - 1,
    })
  }
  return celdas
}
```

- [ ] **Step 2: Crear `src/portal/obligaciones/ObligacionesScreen.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { EstadoObligacion, ObligacionEmpresa } from '@/portal/types'
import { formatPeriodo, formatUSD } from '@/portal/financiero/formato'
import { obligacionPorCodigo } from './catalogo'
import { diasHasta, estadoObligacion, HOY_OBLIGACIONES } from './calculo'
import { ESTADO_OBLIGACION_BADGE, ESTADO_OBLIGACION_LABEL, ESTADO_OBLIGACION_SWATCH } from './estado-estilo'
import { construirCeldasMes, diasSemanaLabels } from './calendario'

type ObligacionVista = {
  obligacion: ObligacionEmpresa
  titulo: string
  formulario: string
  estado: EstadoObligacion
}

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function formatFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return `${dia} ${MESES[mes - 1].slice(0, 3)} ${anio}`
}

export function ObligacionesScreen() {
  const navigate = useNavigate()
  const { empresaActiva, obligacionesEmpresa } = usePortalData()
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario')
  const [filtroLista, setFiltroLista] = useState<'todas' | EstadoObligacion>('todas')
  const hoyDate = useMemo(() => new Date(`${HOY_OBLIGACIONES}T00:00:00`), [])
  const [mesMostrado, setMesMostrado] = useState({ anio: hoyDate.getFullYear(), mes: hoyDate.getMonth() + 1 })

  const items: ObligacionVista[] = useMemo(() => {
    const lista = obligacionesEmpresa[empresaActiva.id] ?? []
    return lista
      .map((o) => {
        const catalogo = obligacionPorCodigo(o.obligacionCodigo)
        if (!catalogo) return null
        return {
          obligacion: o,
          titulo: o.notas ? `${catalogo.nombre} (${o.notas})` : catalogo.nombre,
          formulario: catalogo.formulario,
          estado: estadoObligacion(o, HOY_OBLIGACIONES),
        }
      })
      .filter((i): i is ObligacionVista => i !== null)
      .sort((a, b) => a.obligacion.fechaLimite.localeCompare(b.obligacion.fechaLimite))
  }, [obligacionesEmpresa, empresaActiva.id])

  const vencidas = items.filter((i) => i.estado === 'VENCIDA')
  const proximas = items.filter((i) => i.estado === 'PROXIMA')
  const pasadas = items.filter((i) => diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES) < 0)
  const cumplidasATiempo = pasadas.filter((i) => i.estado === 'CUMPLIDA')
  const cumplimientoPct = pasadas.length === 0 ? 100 : Math.round((cumplidasATiempo.length / pasadas.length) * 100)
  const montoVencido = vencidas.reduce((suma, i) => suma + (i.obligacion.montoEstimado ?? 0), 0)
  const proximaMasCercana = proximas[0]

  const kpis = [
    {
      titulo: 'Cumplimiento',
      valor: `${cumplimientoPct}%`,
      sub: `${cumplidasATiempo.length} de ${pasadas.length} cumplidas a tiempo`,
    },
    {
      titulo: 'Próximas a vencer',
      valor: String(proximas.length),
      sub: proximaMasCercana
        ? `${proximaMasCercana.titulo} · ${formatFecha(proximaMasCercana.obligacion.fechaLimite)}`
        : 'Ninguna en los próximos 15 días',
    },
    {
      titulo: 'Vencidas',
      valor: String(vencidas.length),
      sub: vencidas.length === 0 ? 'Sin obligaciones vencidas' : `${formatUSD(montoVencido)} en mora`,
    },
  ]

  const irADetalle = (id: string) => navigate(`/app/obligaciones/${id}`)
  const irAMarketplace = () => navigate('/app/marketplace')

  const cambiarAListaFiltrada = (filtro: EstadoObligacion) => {
    setVista('lista')
    setFiltroLista(filtro)
  }

  const listaFiltrada = filtroLista === 'todas' ? items : items.filter((i) => i.estado === filtroLista)
  const prioridad = [...vencidas, ...proximas].slice(0, 3)

  const alertas = [
    ...vencidas.map((i) => ({
      id: i.obligacion.id,
      etiqueta: 'Vencida',
      texto: `${i.titulo} venció hace ${Math.abs(diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES))} días.`,
      bg: 'bg-danger-soft',
      fg: 'text-destructive',
    })),
    ...proximas
      .filter((i) => diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES) <= 5)
      .map((i) => ({
        id: i.obligacion.id,
        etiqueta: 'Próxima',
        texto: `${i.titulo} vence en ${diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES)} días.`,
        bg: 'bg-amber-soft',
        fg: 'text-amber-deep',
      })),
  ].slice(0, 4)

  const celdas = construirCeldasMes(mesMostrado.anio, mesMostrado.mes)
  const celdasConItems = celdas.map((c) => ({
    ...c,
    items: items.filter((i) => i.obligacion.fechaLimite === c.fecha),
  }))
  const mesLabel = `${MESES[mesMostrado.mes - 1].charAt(0).toUpperCase()}${MESES[mesMostrado.mes - 1].slice(1)} ${mesMostrado.anio}`

  const mesAnterior = () =>
    setMesMostrado((m) => (m.mes === 1 ? { anio: m.anio - 1, mes: 12 } : { anio: m.anio, mes: m.mes - 1 }))
  const mesSiguiente = () =>
    setMesMostrado((m) => (m.mes === 12 ? { anio: m.anio + 1, mes: 1 } : { anio: m.anio, mes: m.mes + 1 }))

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Obligaciones tributarias</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Calendario de vencimientos generado según tu tipo de contribuyente y el noveno dígito del RUC.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.titulo} className="flex min-h-[122px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
            <p className="text-[12.5px] font-semibold text-ink-500">{k.titulo}</p>
            <p className="mt-auto text-[16px] font-bold leading-tight">{k.valor}</p>
            <p className="text-[12.5px] leading-snug text-ink-500">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold">Calendario de vencimientos</h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setVista('calendario')}
                aria-pressed={vista === 'calendario'}
                className={`min-h-9.5 rounded-lg px-3.5 text-[12.5px] font-semibold ${vista === 'calendario' ? 'border border-navy-600 bg-navy-100 text-navy-700' : 'border border-line bg-card text-ink-700'}`}
              >
                Calendario
              </button>
              <button
                type="button"
                onClick={() => setVista('lista')}
                aria-pressed={vista === 'lista'}
                className={`min-h-9.5 rounded-lg px-3.5 text-[12.5px] font-semibold ${vista === 'lista' ? 'border border-navy-600 bg-navy-100 text-navy-700' : 'border border-line bg-card text-ink-700'}`}
              >
                Lista
              </button>
            </div>
          </div>

          {vista === 'calendario' ? (
            <div className="mt-3.5">
              <div className="flex items-center justify-between gap-2.5">
                <button type="button" onClick={mesAnterior} aria-label="Mes anterior" className="grid h-9.5 w-9.5 place-items-center rounded-lg border border-line bg-card text-ink-700">
                  ←
                </button>
                <strong className="text-[14.5px]">{mesLabel}</strong>
                <button type="button" onClick={mesSiguiente} aria-label="Mes siguiente" className="grid h-9.5 w-9.5 place-items-center rounded-lg border border-line bg-card text-ink-700">
                  →
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1.5">
                {diasSemanaLabels().map((d) => (
                  <span key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                    {d}
                  </span>
                ))}
                {celdasConItems.map((c) => (
                  <div
                    key={c.fecha}
                    className={`flex min-h-16 flex-col gap-0.5 rounded-lg border border-line/70 p-1 ${c.delMes ? 'bg-card' : 'bg-surface/60'}`}
                  >
                    <span className="text-[11px] text-ink-500">{c.numero}</span>
                    {c.items.map((i) => (
                      <button
                        key={i.obligacion.id}
                        type="button"
                        onClick={() => irADetalle(i.obligacion.id)}
                        className={`truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold ${ESTADO_OBLIGACION_BADGE[i.estado]}`}
                      >
                        {i.titulo}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-ink-700">
                {(['CUMPLIDA', 'PROXIMA', 'VENCIDA', 'PENDIENTE'] as EstadoObligacion[]).map((estado) => (
                  <span key={estado} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm border ${ESTADO_OBLIGACION_SWATCH[estado]}`} />
                    {estado === 'PENDIENTE' ? 'Pendiente / No aplica' : ESTADO_OBLIGACION_LABEL[estado]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3.5 flex flex-col gap-2.5">
              {listaFiltrada.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-500">No existen obligaciones generadas</p>
              ) : (
                listaFiltrada.map((i) => (
                  <div key={i.obligacion.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line/70 bg-card p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold leading-snug">{i.titulo}</p>
                      <p className="mt-1 text-[12px] text-ink-500">
                        {i.formulario} · {formatPeriodo(i.obligacion.periodo)} · vence {formatFecha(i.obligacion.fechaLimite)}
                      </p>
                    </div>
                    <span className="num text-[13.5px] font-semibold">
                      {i.obligacion.montoEstimado !== undefined ? formatUSD(i.obligacion.montoEstimado) : '—'}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_OBLIGACION_BADGE[i.estado]}`}>
                      {ESTADO_OBLIGACION_LABEL[i.estado]}
                    </span>
                    <button
                      type="button"
                      onClick={() => irADetalle(i.obligacion.id)}
                      className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700"
                    >
                      Ver detalle
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold">Atención prioritaria</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {prioridad.length === 0 ? (
                <p className="text-[13px] text-ink-500">Sin obligaciones urgentes por ahora.</p>
              ) : (
                prioridad.map((i) => (
                  <div key={i.obligacion.id} className={`flex flex-wrap items-center gap-2.5 rounded-lg p-3 ${i.estado === 'VENCIDA' ? 'bg-danger-soft' : 'bg-amber-soft'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold leading-snug">{i.titulo}</p>
                      <p className={`mt-0.5 text-[12px] font-semibold ${i.estado === 'VENCIDA' ? 'text-destructive' : 'text-amber-deep'}`}>
                        {i.estado === 'VENCIDA' ? 'Venció' : 'Vence'} {formatFecha(i.obligacion.fechaLimite)}
                      </p>
                    </div>
                    <button type="button" onClick={() => irADetalle(i.obligacion.id)} className="min-h-9.5 rounded-lg bg-card px-3 text-[12.5px] font-semibold text-navy-700">
                      Ver detalle
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold">Acciones rápidas</h2>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => cambiarAListaFiltrada('CUMPLIDA')} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Ver historial de cumplidas
              </button>
              <button type="button" onClick={() => cambiarAListaFiltrada('VENCIDA')} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Ver vencidas
              </button>
              <button type="button" onClick={irAMarketplace} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Buscar asesor tributario
              </button>
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Alertas y recomendaciones</h2>
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {alertas.length === 0 ? (
            <p className="text-[13px] text-ink-500 sm:col-span-2">Estás al día con tus obligaciones tributarias.</p>
          ) : (
            alertas.map((a) => (
              <div key={a.id} className={`flex flex-wrap items-center gap-2.5 rounded-lg p-3 ${a.bg}`}>
                <span className={`rounded-full bg-card px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide ${a.fg}`}>{a.etiqueta}</span>
                <p className="min-w-0 flex-1 text-[13px] leading-snug">{a.texto}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 3: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los demás imports de pantallas del portal:

```tsx
import { ObligacionesScreen } from './portal/obligaciones/ObligacionesScreen'
```

Agregar la ruta dentro de `<Route path="/app" ...>`, después de `indicadores/comparar`:

```tsx
        <Route path="obligaciones" element={<ObligacionesScreen />} />
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual en el navegador**

Run: `npm run dev`, abrir `/app/obligaciones` con Textiles Andina (empresa activa por defecto).

Expected:
- 3 KPIs: Cumplimiento (`93%`, `13 de 14 cumplidas a tiempo` — de las 14 obligaciones con fecha límite ya
  pasada respecto a `HOY_OBLIGACIONES` [12 mensuales de enero a junio + IR Sociedades + Anticipo IR 1ra
  cuota], todas cumplidas menos el Anticipo IR vencido), Próximas a vencer (`2`, mostrando la Declaración
  de IVA de julio venciendo el 14 ago 2026), Vencidas (`1`, `$960 en mora`).
- Calendario en "Agosto 2026" (mes de `HOY_OBLIGACIONES`), con un badge el día 14 (IVA + Retención de julio,
  color amber/"Próxima").
- Leyenda de 4 colores debajo del calendario.
- "Atención prioritaria" muestra primero el Anticipo IR vencido (rojo), luego las 2 obligaciones de julio
  (amber).
- Cambiar a Comercial del Valle (selector de empresa en el Topbar): confirmar que solo aparecen 2
  `Cuota RIMPE Negocio Popular` en el calendario/lista.
- Click en "Lista": confirmar orden por fecha límite ascendente. Click en "Ver vencidas": confirma que solo
  muestra el Anticipo IR vencido.

- [ ] **Step 6: Commit**

```bash
git add src/portal/obligaciones/calendario.ts src/portal/obligaciones/ObligacionesScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Resumen de Obligaciones tributarias"
```

---

### Task 6: Pantalla de Detalle (`DetalleObligacionScreen.tsx`) + ruta

**Files:**
- Create: `src/portal/obligaciones/DetalleObligacionScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `obligacionesEmpresa`, `marcarObligacionCumplida`,
  `toggleRecordatorioObligacion` (Task 3); `obligacionPorCodigo` (Task 1); `diasHasta`, `estadoObligacion`,
  `HOY_OBLIGACIONES` (Task 1); `ESTADO_OBLIGACION_LABEL`, `ESTADO_OBLIGACION_BADGE` (Task 4); `formatPeriodo`,
  `formatUSD` (existentes en `@/portal/financiero/formato`).
- Produces: componente `DetalleObligacionScreen` montado en la ruta `/app/obligaciones/:id`.

- [ ] **Step 1: Crear `src/portal/obligaciones/DetalleObligacionScreen.tsx`**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatPeriodo, formatUSD } from '@/portal/financiero/formato'
import { obligacionPorCodigo } from './catalogo'
import { diasHasta, estadoObligacion, HOY_OBLIGACIONES } from './calculo'
import { ESTADO_OBLIGACION_BADGE, ESTADO_OBLIGACION_LABEL } from './estado-estilo'

const MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function formatFecha(iso: string): string {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return `${dia} ${MESES_CORTO[mes - 1]} ${anio}`
}

function capitalizar(texto: string): string {
  return texto.charAt(0) + texto.slice(1).toLowerCase()
}

export function DetalleObligacionScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, obligacionesEmpresa, marcarObligacionCumplida, toggleRecordatorioObligacion } = usePortalData()

  const obligaciones = obligacionesEmpresa[empresaActiva.id] ?? []
  const obligacion = obligaciones.find((o) => o.id === id)

  if (!obligacion) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró esa obligación.</p>
        <button
          type="button"
          onClick={() => navigate('/app/obligaciones')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Obligaciones tributarias
        </button>
      </section>
    )
  }

  const catalogo = obligacionPorCodigo(obligacion.obligacionCodigo)
  const titulo = catalogo ? (obligacion.notas ? `${catalogo.nombre} (${obligacion.notas})` : catalogo.nombre) : obligacion.obligacionCodigo
  const estado = estadoObligacion(obligacion, HOY_OBLIGACIONES)
  const dias = diasHasta(obligacion.fechaLimite, HOY_OBLIGACIONES)
  const puedeCumplir = estado !== 'CUMPLIDA' && estado !== 'NO_APLICA'

  const grupos = [
    {
      titulo: 'Información general',
      items: [
        { label: 'Categoría', valor: catalogo ? capitalizar(catalogo.categoria) : '—' },
        { label: 'Institución', valor: catalogo?.institucion ?? '—' },
        { label: 'Periodicidad', valor: catalogo ? capitalizar(catalogo.periodicidad) : '—' },
        { label: 'Formulario', valor: catalogo?.formulario ?? '—' },
        { label: 'Usa noveno dígito', valor: catalogo?.usaNovenoDigito ? 'Sí' : 'No' },
      ],
    },
    {
      titulo: 'Periodo y fecha límite',
      items: [
        { label: 'Periodo', valor: formatPeriodo(obligacion.periodo) },
        { label: 'Fecha límite', valor: formatFecha(obligacion.fechaLimite) },
        {
          label: dias < 0 ? 'Vencida hace' : 'Días restantes',
          valor: `${Math.abs(dias)} días`,
        },
      ],
    },
    {
      titulo: 'Monto',
      items: [
        { label: 'Base de cálculo', valor: obligacion.baseCalculo !== undefined ? formatUSD(obligacion.baseCalculo) : '—' },
        {
          label: 'Monto estimado',
          valor: catalogo?.permiteMontoEstimado && obligacion.montoEstimado !== undefined ? formatUSD(obligacion.montoEstimado) : 'No aplica',
        },
      ],
    },
    {
      titulo: 'Estado y recordatorio',
      items: [
        { label: 'Estado', valor: ESTADO_OBLIGACION_LABEL[estado] },
        { label: 'Fecha de cumplimiento', valor: obligacion.fechaCumplimiento ? formatFecha(obligacion.fechaCumplimiento) : '—' },
        { label: 'Recordatorio activo', valor: obligacion.recordatorioActivo ? 'Sí' : 'No' },
        { label: 'Notas', valor: obligacion.notas ?? '—' },
      ],
    },
  ]

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/obligaciones')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
          >
            ← Obligaciones tributarias
          </button>
          <h1 className="mt-1.5 text-[26px] font-bold leading-tight">{titulo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${ESTADO_OBLIGACION_BADGE[estado]}`}>
              {ESTADO_OBLIGACION_LABEL[estado]}
            </span>
            <span className="text-[13px] text-ink-500">{catalogo?.formulario}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {puedeCumplir && (
            <button
              type="button"
              onClick={() => marcarObligacionCumplida(empresaActiva.id, obligacion.id)}
              className="min-h-11 rounded-lg bg-emerald-deep px-4 text-[13.5px] font-semibold text-white"
            >
              Marcar como cumplida
            </button>
          )}
          <button
            type="button"
            onClick={() => toggleRecordatorioObligacion(empresaActiva.id, obligacion.id)}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13.5px] font-semibold text-ink-700"
          >
            {obligacion.recordatorioActivo ? 'Recordatorio activado ✓' : 'Configurar recordatorio'}
          </button>
        </div>
      </div>

      {grupos.map((g) => (
        <section key={g.titulo} className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">{g.titulo}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {g.items.map((i) => (
              <div key={i.label} className="min-w-0">
                <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{i.label}</dt>
                <dd className="mt-1 text-[13.5px] leading-snug">{i.valor}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto al de `ObligacionesScreen`:

```tsx
import { DetalleObligacionScreen } from './portal/obligaciones/DetalleObligacionScreen'
```

Agregar la ruta justo después de `obligaciones`:

```tsx
        <Route path="obligaciones/:id" element={<DetalleObligacionScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual en el navegador**

Run: `npm run dev`, entrar a `/app/obligaciones`, click en la obligación vencida (Anticipo IR, "Atención
prioritaria").

Expected:
- 4 grupos de campos con la info correcta (Categoría "Tributaria", Formulario "Débito automático SRI",
  Periodicidad "Semestral", "Vencida hace 30 días", Monto estimado `$960`, Estado "Vencida").
- Botón "Marcar como cumplida" visible; al hacer click, navegar de vuelta a `/app/obligaciones` y confirmar
  que esa obligación ahora aparece como "Cumplida" (navy) en el calendario/lista y ya no en "Atención
  prioritaria" ni en el KPI de Vencidas.
- Click en "Configurar recordatorio" en el detalle de cualquier otra obligación: confirmar que el botón
  cambia a "Recordatorio activado ✓" y vuelve a "Configurar recordatorio" al hacer click de nuevo.
- Entrar a una obligación ya cumplida (ej. IVA de enero): confirmar que el botón "Marcar como cumplida" no
  aparece.

- [ ] **Step 5: Commit**

```bash
git add src/portal/obligaciones/DetalleObligacionScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Detalle de obligacion"
```

---

### Task 7: Conectar "Ver todas" en el Dashboard

**Files:**
- Modify: `src/portal/dashboard/ObligationsTable.tsx`

**Interfaces:**
- Consumes: `useNavigate` de `react-router-dom` (ya usado en otras pantallas del portal).
- Produces: nada nuevo — solo hace navegable un elemento existente.

- [ ] **Step 1: Reemplazar el contenido completo de `src/portal/dashboard/ObligationsTable.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import type { Obligacion } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function ObligationsTable({ obligaciones }: { obligaciones: Obligacion[] }) {
  const navigate = useNavigate()
  return (
    <section className="overflow-x-auto rounded-xl border border-line bg-card">
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-4.5 py-3.5">
        <h2 className="text-[17px] font-semibold">Obligaciones próximas</h2>
        <button
          type="button"
          onClick={() => navigate('/app/obligaciones')}
          className="text-[12.5px] font-semibold text-navy-500"
        >
          Ver todas
        </button>
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

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Verificación manual en el navegador**

Run: `npm run dev`, entrar a `/app/dashboard`, click en "Ver todas" de la tarjeta "Obligaciones próximas".

Expected: navega a `/app/obligaciones`. La tarjeta del Dashboard sigue mostrando las mismas 4 filas mock de
siempre (sin cambios en sus datos).

- [ ] **Step 4: Commit**

```bash
git add src/portal/dashboard/ObligationsTable.tsx
git commit -m "feat: conectar Ver todas del Dashboard a Obligaciones tributarias"
```

---

## Verificación final end-to-end

- [ ] **Paso 1:** `npm run build` completo sin errores (type-check de las 7 tasks combinadas).
- [ ] **Paso 2:** `npm run dev`, recorrer con Textiles Andina: Dashboard → "Ver todas" → Obligaciones
  (calendario agosto 2026, KPIs, prioridad, alertas) → click en la obligación vencida → "Marcar como
  cumplida" → confirmar que desaparece de "Vencidas" → volver, cambiar a vista Lista, filtrar por
  "Ver historial de cumplidas".
- [ ] **Paso 3:** Cambiar a Comercial del Valle: confirmar que Obligaciones solo muestra las 2 cuotas RIMPE,
  sin IVA/Retención/Renta.
- [ ] **Paso 4:** Navegar directo a una URL de detalle inexistente (`/app/obligaciones/no-existe`): confirmar
  el mensaje "No se encontró esa obligación" con botón de volver, sin crashear.
