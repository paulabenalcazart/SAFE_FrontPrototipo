# Portal Privado — Fase 6 (Simulador) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Simulador" del portal privado — wizard de 3 pasos (Escenario → Variables → Resultado) con 2 escenarios reales (LABORAL "Contratación de personal", FINANCIERO "Aumento de ventas"), historial de simulaciones guardadas por empresa y una pantalla de detalle de solo lectura.

**Architecture:** Dos funciones puras de cálculo (`simulador/calculo.ts`) — una por escenario — comparten un helper genérico que arma la serie mensual (costo acumulado, ingreso acumulado, utilidad actual, utilidad proyectada) y una heurística de nivel de riesgo, mismo patrón de funciones puras que `financiero/calculo.ts` y `obligaciones/calculo.ts`. Un catálogo estático (`simulador/catalogo.ts`) describe los 4 escenarios del enum (2 implementados, 2 "Próximamente") y las variables editables de cada uno implementado. `PortalDataContext` gana `simulaciones` (historial por empresa) y `guardarSimulacion`. Dos pantallas nuevas bajo `src/portal/simulador/` consumen todo esto; el escenario FINANCIERO reutiliza `utilidadNeta()` de `financiero/calculo.ts` sobre el último `RegistroFinanciero` `VIGENTE` de la empresa activa.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, `react-router-dom`.

## Global Constraints

- Prototipo **solo frontend**, sin backend.
- `simulaciones` **no** persiste en `localStorage` — vive en memoria de React (mismo patrón que `obligacionesEmpresa`/`registrosFinancieros`).
- `HOY_SIMULADOR = '2026-08-13'` es una **única constante exportada** desde `simulador/calculo.ts` — mismo valor ficticio que `HOY_OBLIGACIONES` de Fase 5, ningún otro archivo hardcodea ese string.
- Solo 2 escenarios con fórmula real: `CONTRATACION_PERSONAL` (LABORAL) y `AUMENTO_VENTAS` (FINANCIERO). Los otros 2 códigos del catálogo (`CAMBIO_REGIMEN_TRIBUTARIO` TRIBUTARIO, `AUMENTO_CAPITAL` SOCIETARIO) tienen `implementado: false` — tarjetas deshabilitadas, sin fórmula.
- `AUMENTO_VENTAS` requiere que la empresa activa tenga al menos un `RegistroFinanciero` con `estado === 'VIGENTE'` — si no lo tiene (Comercial del Valle, `registrosFinancierosSemilla['emp-2'] = []`), la tarjeta aparece deshabilitada con motivo "Requiere registro financiero vigente" (no "Próximamente"). `CONTRATACION_PERSONAL` no tiene esta restricción, disponible para ambas empresas.
- Tasas fijas de la fórmula LABORAL: `SBU_REFERENCIA = 460`, `APORTE_PATRONAL_IESS = 0.1115`, `FONDOS_RESERVA = 0.0833`. Décimo tercero = `salario/12`, décimo cuarto = `SBU_REFERENCIA/12`.
- Riesgo: `neto = ingresoAcumulado(final) - costoAcumulado(final)`, `ratio = costoAcumulado(final)/ingresoAcumulado(final)` (Infinity si ingreso es 0). `neto < 0` → `CRITICO` si `ratio >= 2` o ingreso acumulado es 0, si no `ALTO`. `neto >= 0` → `BAJO` si `ratio <= 0.6`, si no `MEDIO`.
- Series: `costoAcumulado`/`ingresoAcumulado` son sumas acumuladas mes a mes; `utilidadActual`/`utilidadProyectada` son tasas del mes (no acumuladas) — `utilidadProyectada(t) = utilidadActualBase + ingresoDelMes(t) - costoDelMes(t)`.
- El repo no tiene test runner ni eslint — verificación vía `npm run build` (type-check) + scripts puntuales `npx tsx -e "..."` + revisión manual en el navegador con `npm run dev`. No agregar frameworks de testing ni librerías de PDF ("Exportar PDF" usa `window.print()`).
- Reusar tokens y convenciones ya establecidos: `border-line/70`, `bg-card`/`bg-surface`, botones de acción secundarios `min-h-11` + `text-sm`/`text-[13.5px]`, botones pequeños `min-h-9.5` + `text-[12.5px]`. Reusar `formatUSD` (`@/portal/financiero/formato`), `utilidadNeta` (`@/portal/financiero/calculo`) y `formatFecha` (`@/portal/obligaciones/formato`) — no duplicar.

---

## File Structure

```
src/
├── App.tsx                                       # Modify: 2 rutas nuevas (Tasks 7, 8)
├── portal/
│   ├── types.ts                                   # Modify: tipos de simulador (Task 1)
│   ├── PortalDataContext.tsx                      # Modify: simulaciones (Task 5)
│   ├── data/
│   │   └── mock-portal-data.ts                    # Modify: simulacionesSemilla (Task 4)
│   └── simulador/
│       ├── catalogo.ts                             # Create (Task 1): escenarios + variables por escenario
│       ├── calculo.ts                              # Create (Task 2): fórmulas LABORAL/FINANCIERO + series + riesgo
│       ├── estilo.ts                               # Create (Task 3): labels/colores por NivelRiesgo
│       ├── SimulacionChart.tsx                      # Create (Task 6): gráfico SVG de la serie mensual
│       ├── SimuladorScreen.tsx                      # Create (Task 7): wizard 3 pasos + historial
│       └── DetalleSimulacionScreen.tsx              # Create (Task 8): detalle de solo lectura
```

`simulador/` se agrupa aparte de `financiero/`/`obligaciones/` porque es su propio sub-módulo con 2 pantallas
relacionadas — mismo patrón que esas carpetas ya usan. `CONTRATACION_PERSONAL` no depende de
`RegistroFinanciero` en ningún punto (dominio aparte, igual criterio que `obligaciones/calculo.ts`);
`AUMENTO_VENTAS` sí reutiliza `financiero/calculo.ts` (`utilidadNeta`) pero no lo modifica.

---

### Task 1: Tipos de simulador + catálogo de escenarios y variables

**Files:**
- Modify: `src/portal/types.ts`
- Create: `src/portal/simulador/catalogo.ts`

**Interfaces:**
- Consumes: nada nuevo.
- Produces: tipos `CategoriaEscenario`, `TipoVariableEscenario`, `NivelRiesgo`, `EscenarioSimulacion`,
  `VariableEscenario`, `SerieMensualSimulacion`, `CardResultadoSimulacion`, `ResultadoSimulacion`,
  `Simulacion` (usados por todas las tasks siguientes); `ESCENARIOS_SIMULACION: EscenarioSimulacion[]`,
  `escenarioPorCodigo(codigo: string): EscenarioSimulacion | undefined`,
  `VARIABLES_POR_ESCENARIO: Record<string, VariableEscenario[]>` (usados por Tasks 4, 7, 8).

- [ ] **Step 1: Agregar los tipos de simulador al final de `src/portal/types.ts`**

```ts
export type CategoriaEscenario = 'FINANCIERO' | 'TRIBUTARIO' | 'LABORAL' | 'SOCIETARIO'
export type TipoVariableEscenario = 'NUMERO' | 'PORCENTAJE' | 'MONEDA' | 'FECHA' | 'TEXTO' | 'BOOLEANO'
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

export type EscenarioSimulacion = {
  codigo: string
  nombre: string
  categoria: CategoriaEscenario
  descripcion: string
  implementado: boolean
}

export type VariableEscenario = {
  codigo: string
  label: string
  tipoDato: TipoVariableEscenario
  unidad?: string
  valorMinimo?: number
  valorMaximo?: number
  hint?: string
  default: number | boolean
}

export type SerieMensualSimulacion = {
  mes: string
  costoAcumulado: number
  ingresoAcumulado: number
  utilidadActual: number
  utilidadProyectada: number
}

export type CardResultadoSimulacion = {
  titulo: string
  valor: number
  formato: 'USD' | 'PORCENTAJE'
  sub: string
}

export type ResultadoSimulacion = {
  cards: CardResultadoSimulacion[]
  serie: SerieMensualSimulacion[]
  nivelRiesgo: NivelRiesgo
  riesgoTexto: string
  recomendaciones: string[]
  supuestos: string[]
  limitaciones: string[]
}

export type Simulacion = {
  id: string
  escenarioCodigo: string
  fecha: string // ISO 'YYYY-MM-DD'
  entradas: Record<string, number | boolean>
  resultado: ResultadoSimulacion
}
```

- [ ] **Step 2: Crear `src/portal/simulador/catalogo.ts`**

```ts
import type { EscenarioSimulacion, VariableEscenario } from '@/portal/types'

export const ESCENARIOS_SIMULACION: EscenarioSimulacion[] = [
  {
    codigo: 'CONTRATACION_PERSONAL',
    nombre: 'Contratación de personal',
    categoria: 'LABORAL',
    descripcion: 'Evalúa el costo total y el impacto de contratar nuevo personal antes de decidir.',
    implementado: true,
  },
  {
    codigo: 'AUMENTO_VENTAS',
    nombre: 'Aumento de ventas',
    categoria: 'FINANCIERO',
    descripcion: 'Proyecta el impacto de un incremento sostenido en ventas sobre tu utilidad.',
    implementado: true,
  },
  {
    codigo: 'CAMBIO_REGIMEN_TRIBUTARIO',
    nombre: 'Cambio de régimen tributario',
    categoria: 'TRIBUTARIO',
    descripcion: 'Próximamente: compara tu carga tributaria entre regímenes.',
    implementado: false,
  },
  {
    codigo: 'AUMENTO_CAPITAL',
    nombre: 'Aumento de capital social',
    categoria: 'SOCIETARIO',
    descripcion: 'Próximamente: evalúa el impacto de un aumento de capital social.',
    implementado: false,
  },
]

export function escenarioPorCodigo(codigo: string): EscenarioSimulacion | undefined {
  return ESCENARIOS_SIMULACION.find((e) => e.codigo === codigo)
}

const SBU_REFERENCIA = 460

export const VARIABLES_CONTRATACION_PERSONAL: VariableEscenario[] = [
  { codigo: 'numeroContrataciones', label: 'Número de contrataciones', tipoDato: 'NUMERO', unidad: 'personas', valorMinimo: 1, valorMaximo: 50, default: 1 },
  { codigo: 'salarioMensual', label: 'Salario mensual por persona', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: SBU_REFERENCIA, default: SBU_REFERENCIA, hint: `Mínimo referencial: SBU $${SBU_REFERENCIA}` },
  { codigo: 'mesesSimular', label: 'Meses a simular', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 24, default: 12 },
  { codigo: 'costoReclutamiento', label: 'Costo de reclutamiento y capacitación inicial', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 300, hint: 'Se aplica una sola vez, en el primer mes' },
  { codigo: 'otrosBeneficios', label: 'Otros beneficios mensuales por persona', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  { codigo: 'incluyeFondosReserva', label: 'Incluye fondos de reserva', tipoDato: 'BOOLEANO', default: false, hint: 'Aplica legalmente solo a partir del segundo año de relación laboral' },
  { codigo: 'ingresoAdicionalEsperado', label: 'Ingreso adicional mensual esperado por contratación', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  { codigo: 'mesesProductividadPlena', label: 'Meses hasta alcanzar productividad plena', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 12, default: 3 },
]

export const VARIABLES_AUMENTO_VENTAS: VariableEscenario[] = [
  { codigo: 'incrementoPct', label: '% de incremento mensual de ventas', tipoDato: 'PORCENTAJE', unidad: '%', valorMinimo: 0, valorMaximo: 50, default: 5 },
  { codigo: 'mesesSimular', label: 'Meses a simular', tipoDato: 'NUMERO', unidad: 'meses', valorMinimo: 1, valorMaximo: 24, default: 12 },
  { codigo: 'inversionInicial', label: 'Inversión inicial en marketing', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 500, hint: 'Se aplica una sola vez, en el primer mes' },
  { codigo: 'gastoOperativoAdicional', label: 'Gasto operativo adicional mensual', tipoDato: 'MONEDA', unidad: 'USD', valorMinimo: 0, default: 0 },
  // El default real de esta variable no es estático: SimuladorScreen (Task 7) lo calcula a partir del
  // registro financiero vigente de la empresa activa (costoVentas/ingresosOperacionales) al construir el
  // draft inicial del paso 2. El `default: 0` de acá es solo un fallback si por algún motivo no hubiera
  // registro (en la práctica no ocurre: AUMENTO_VENTAS ya está deshabilitado sin registro vigente).
  { codigo: 'pctCostoVariable', label: '% del incremento que genera costo variable adicional', tipoDato: 'PORCENTAJE', unidad: '%', valorMinimo: 0, valorMaximo: 100, default: 0 },
]

export const VARIABLES_POR_ESCENARIO: Record<string, VariableEscenario[]> = {
  CONTRATACION_PERSONAL: VARIABLES_CONTRATACION_PERSONAL,
  AUMENTO_VENTAS: VARIABLES_AUMENTO_VENTAS,
}
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/portal/types.ts src/portal/simulador/catalogo.ts
git commit -m "feat: agregar tipos y catalogo de escenarios del simulador"
```

---

### Task 2: Motor de cálculo (`simulador/calculo.ts`)

**Files:**
- Create: `src/portal/simulador/calculo.ts`

**Interfaces:**
- Consumes: `NivelRiesgo`, `ResultadoSimulacion`, `SerieMensualSimulacion` (Task 1, tipos).
- Produces: `HOY_SIMULADOR: string`,
  `simularContratacionPersonal(entradas: Record<string, number | boolean>): ResultadoSimulacion`,
  `simularAumentoVentas(entradas: Record<string, number | boolean>, ingresosBase: number, utilidadActualBase: number): ResultadoSimulacion`
  (usados por Tasks 4, 7).

- [ ] **Step 1: Crear `src/portal/simulador/calculo.ts`**

```ts
import type { NivelRiesgo, ResultadoSimulacion, SerieMensualSimulacion } from '@/portal/types'

export const HOY_SIMULADOR = '2026-08-13'

const SBU_REFERENCIA = 460
const APORTE_PATRONAL_IESS = 0.1115
const FONDOS_RESERVA = 0.0833

function num(v: number | boolean | undefined, fallback = 0): number {
  return typeof v === 'number' ? v : fallback
}

function bool(v: number | boolean | undefined): boolean {
  return v === true
}

function construirSerie(params: {
  mesesSimular: number
  costoDelMes: (t: number) => number
  ingresoDelMes: (t: number) => number
  utilidadActualBase: number
}): SerieMensualSimulacion[] {
  const { mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase } = params
  let costoAcumulado = 0
  let ingresoAcumulado = 0
  const serie: SerieMensualSimulacion[] = []
  for (let t = 1; t <= mesesSimular; t++) {
    const costoMes = costoDelMes(t)
    const ingresoMes = ingresoDelMes(t)
    costoAcumulado += costoMes
    ingresoAcumulado += ingresoMes
    serie.push({
      mes: `Mes ${t}`,
      costoAcumulado,
      ingresoAcumulado,
      utilidadActual: utilidadActualBase,
      utilidadProyectada: utilidadActualBase + ingresoMes - costoMes,
    })
  }
  return serie
}

function calcularRiesgo(serie: SerieMensualSimulacion[]): { nivelRiesgo: NivelRiesgo; riesgoTexto: string } {
  const final = serie[serie.length - 1]
  const neto = final.ingresoAcumulado - final.costoAcumulado
  const ratio = final.ingresoAcumulado === 0 ? Infinity : final.costoAcumulado / final.ingresoAcumulado

  if (neto < 0) {
    if (ratio >= 2 || final.ingresoAcumulado === 0) {
      return {
        nivelRiesgo: 'CRITICO',
        riesgoTexto:
          'El costo total supera ampliamente el ingreso adicional proyectado — este escenario compromete seriamente la utilidad de la empresa.',
      }
    }
    return {
      nivelRiesgo: 'ALTO',
      riesgoTexto:
        'El costo total proyectado supera al ingreso adicional esperado — revisa las variables antes de comprometerte con este escenario.',
    }
  }
  if (ratio <= 0.6) {
    return {
      nivelRiesgo: 'BAJO',
      riesgoTexto: 'El escenario muestra un margen saludable entre el ingreso adicional proyectado y su costo.',
    }
  }
  return {
    nivelRiesgo: 'MEDIO',
    riesgoTexto: 'El escenario es positivo, pero el margen entre el costo y el ingreso adicional proyectado es ajustado.',
  }
}

export function simularContratacionPersonal(entradas: Record<string, number | boolean>): ResultadoSimulacion {
  const numeroContrataciones = num(entradas.numeroContrataciones, 1)
  const salarioMensual = num(entradas.salarioMensual, SBU_REFERENCIA)
  const mesesSimular = Math.max(num(entradas.mesesSimular, 12), 1)
  const costoReclutamiento = num(entradas.costoReclutamiento, 0)
  const otrosBeneficios = num(entradas.otrosBeneficios, 0)
  const incluyeFondosReserva = bool(entradas.incluyeFondosReserva)
  const ingresoAdicionalEsperado = num(entradas.ingresoAdicionalEsperado, 0)
  const mesesProductividadPlena = Math.max(num(entradas.mesesProductividadPlena, 3), 1)

  const costoMensualPorEmpleado =
    salarioMensual * (1 + APORTE_PATRONAL_IESS) +
    salarioMensual / 12 +
    SBU_REFERENCIA / 12 +
    (incluyeFondosReserva ? salarioMensual * FONDOS_RESERVA : 0) +
    otrosBeneficios

  const costoDelMes = (t: number) => costoMensualPorEmpleado * numeroContrataciones + (t === 1 ? costoReclutamiento : 0)
  const rampFactor = (t: number) => Math.min(t / mesesProductividadPlena, 1)
  const ingresoDelMes = (t: number) => numeroContrataciones * ingresoAdicionalEsperado * rampFactor(t)

  const serie = construirSerie({ mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase: 0 })
  const { nivelRiesgo, riesgoTexto } = calcularRiesgo(serie)
  const final = serie[serie.length - 1]

  return {
    cards: [
      { titulo: 'Costo total del periodo', valor: final.costoAcumulado, formato: 'USD', sub: `${mesesSimular} meses simulados` },
      { titulo: 'Ingreso adicional proyectado', valor: final.ingresoAcumulado, formato: 'USD', sub: `${numeroContrataciones} contratación(es)` },
      { titulo: 'Impacto neto en utilidad', valor: final.ingresoAcumulado - final.costoAcumulado, formato: 'USD', sub: 'Ingreso adicional menos costo total' },
      { titulo: 'Costo mensual por contratación', valor: costoMensualPorEmpleado, formato: 'USD', sub: 'En régimen estable, sin costo de reclutamiento' },
    ],
    serie,
    nivelRiesgo,
    riesgoTexto,
    recomendaciones: [
      nivelRiesgo === 'BAJO'
        ? 'El escenario muestra margen saludable — puedes proceder con la contratación.'
        : 'Considera reducir el número de contrataciones o extender el periodo de rampa antes de comprometerte.',
      'Confirma el salario con la tabla sectorial del Ministerio de Trabajo antes de decidir.',
      'Revisa si el ingreso adicional esperado por persona es realista para tu operación actual.',
    ],
    supuestos: [
      'Aporte patronal IESS: 11.15% del salario mensual.',
      'Décimo tercero y décimo cuarto calculados y provisionados mensualmente.',
      `SBU de referencia: $${SBU_REFERENCIA} (valor de referencia, no verificado contra el SBU oficial vigente).`,
      'Fondos de reserva (8.33%) solo se incluyen si activas la opción correspondiente.',
    ],
    limitaciones: [
      'No considera indemnizaciones ni costos de una eventual desvinculación.',
      'No sustituye asesoría laboral profesional.',
      'Asume salario y beneficios constantes durante todo el periodo simulado.',
    ],
  }
}

export function simularAumentoVentas(
  entradas: Record<string, number | boolean>,
  ingresosBase: number,
  utilidadActualBase: number,
): ResultadoSimulacion {
  const incrementoPct = num(entradas.incrementoPct, 0)
  const mesesSimular = Math.max(num(entradas.mesesSimular, 12), 1)
  const inversionInicial = num(entradas.inversionInicial, 0)
  const gastoOperativoAdicional = num(entradas.gastoOperativoAdicional, 0)
  const pctCostoVariable = num(entradas.pctCostoVariable, 0)

  const ingresoDelMes = (t: number) => ingresosBase * (incrementoPct / 100) * t
  const costoDelMes = (t: number) =>
    ingresoDelMes(t) * (pctCostoVariable / 100) + gastoOperativoAdicional + (t === 1 ? inversionInicial : 0)

  const serie = construirSerie({ mesesSimular, costoDelMes, ingresoDelMes, utilidadActualBase })
  const { nivelRiesgo, riesgoTexto } = calcularRiesgo(serie)
  const final = serie[serie.length - 1]

  return {
    cards: [
      { titulo: 'Costo total del periodo', valor: final.costoAcumulado, formato: 'USD', sub: `${mesesSimular} meses simulados` },
      { titulo: 'Ingreso adicional proyectado', valor: final.ingresoAcumulado, formato: 'USD', sub: `${incrementoPct}% de incremento mensual` },
      { titulo: 'Impacto neto en utilidad', valor: final.ingresoAcumulado - final.costoAcumulado, formato: 'USD', sub: 'Ingreso adicional menos costo total' },
      { titulo: 'Utilidad proyectada (último mes)', valor: final.utilidadProyectada, formato: 'USD', sub: 'Comparada con la utilidad neta actual' },
    ],
    serie,
    nivelRiesgo,
    riesgoTexto,
    recomendaciones: [
      nivelRiesgo === 'BAJO'
        ? 'El escenario muestra margen saludable — el incremento de ventas proyectado cubre ampliamente su costo.'
        : 'Revisa el porcentaje de incremento o el costo variable asociado antes de comprometer presupuesto.',
      'Contrasta el % de incremento mensual con el historial real de ventas de tu empresa.',
      'Confirma si el costo variable adicional refleja bien tu estructura de costos actual.',
    ],
    supuestos: [
      'Línea base tomada del último registro financiero vigente de la empresa.',
      'El crecimiento de ventas se proyecta de forma lineal, no compuesta.',
      '% de costo variable adicional aplicado directamente sobre el ingreso adicional proyectado.',
      'No considera estacionalidad ni variaciones de precio.',
    ],
    limitaciones: [
      'No sustituye asesoría financiera profesional.',
      'Asume que el resto de la estructura de costos permanece constante.',
      'La inversión inicial en marketing no garantiza el incremento de ventas proyectado.',
    ],
  }
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { simularContratacionPersonal, simularAumentoVentas } from './src/portal/simulador/calculo.ts'

const laboralBajo = simularContratacionPersonal({ numeroContrataciones: 2, salarioMensual: 500, mesesSimular: 12, costoReclutamiento: 400, otrosBeneficios: 20, incluyeFondosReserva: false, ingresoAdicionalEsperado: 1400, mesesProductividadPlena: 2 })
console.log('laboral riesgo (esperado BAJO o MEDIO)', laboralBajo.nivelRiesgo)

const laboralCritico = simularContratacionPersonal({ numeroContrataciones: 3, salarioMensual: 600, mesesSimular: 6, costoReclutamiento: 500, otrosBeneficios: 0, incluyeFondosReserva: true, ingresoAdicionalEsperado: 0, mesesProductividadPlena: 1 })
console.log('laboral riesgo (esperado CRITICO, ingreso 0)', laboralCritico.nivelRiesgo)

const financiero = simularAumentoVentas({ incrementoPct: 8, mesesSimular: 12, inversionInicial: 800, gastoOperativoAdicional: 100, pctCostoVariable: 40 }, 20000, 1500)
console.log('financiero cards', financiero.cards.map(c => c.titulo + '=' + c.valor.toFixed(2)))
console.log('financiero serie length (esperado 12)', financiero.serie.length)
"`

Expected: `laboral riesgo (esperado BAJO o MEDIO)` imprime `BAJO` o `MEDIO` (nunca ALTO/CRITICO, porque el
ingreso adicional es alto respecto al costo); `laboral riesgo (esperado CRITICO, ingreso 0)` imprime
`CRITICO` (ingreso acumulado es 0 al no haber `ingresoAdicionalEsperado`); `financiero serie length` imprime
`12`. Si `npx tsx` falla por el alias `@/`, confiar en `npm run build` (mismo criterio que Fase 5).

- [ ] **Step 4: Commit**

```bash
git add src/portal/simulador/calculo.ts
git commit -m "feat: agregar motor de calculo de escenarios del simulador"
```

---

### Task 3: Colores y etiquetas por nivel de riesgo (`simulador/estilo.ts`)

**Files:**
- Create: `src/portal/simulador/estilo.ts`

**Interfaces:**
- Consumes: `NivelRiesgo` (Task 1, tipo).
- Produces: `NIVEL_RIESGO_LABEL`, `NIVEL_RIESGO_BADGE` (ambos `Record<NivelRiesgo, string>`) — usados por
  Tasks 7, 8.

- [ ] **Step 1: Crear `src/portal/simulador/estilo.ts`**

```ts
import type { NivelRiesgo } from '@/portal/types'

export const NIVEL_RIESGO_LABEL: Record<NivelRiesgo, string> = {
  BAJO: 'Bajo',
  MEDIO: 'Medio',
  ALTO: 'Alto',
  CRITICO: 'Crítico',
}

// nivel_riesgo_enum tiene 4 valores (dump SAFE_dump.sql) — Tono de tone.ts solo cubre 4 casos genéricos
// que no mapean 1:1 a esta escala de severidad, por eso este módulo define su propio mapa de color.
export const NIVEL_RIESGO_BADGE: Record<NivelRiesgo, string> = {
  BAJO: 'bg-emerald-soft text-emerald-deep',
  MEDIO: 'bg-amber-soft text-amber-deep',
  ALTO: 'bg-danger-soft text-destructive',
  CRITICO: 'bg-destructive text-destructive-foreground',
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/portal/simulador/estilo.ts
git commit -m "feat: agregar labels y colores por nivel de riesgo del simulador"
```

---

### Task 4: Semilla de simulaciones por empresa (`simulacionesSemilla`)

**Files:**
- Modify: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: `Simulacion` (Task 1, tipo); `simularContratacionPersonal`, `simularAumentoVentas` (Task 2)
  desde `../simulador/calculo`; `utilidadNeta` (ya existe en `../financiero/calculo`);
  `registrosFinancierosSemilla` (ya definido más arriba en este mismo archivo, desde Fase 3).
- Produces: `simulacionesSemilla: Record<string, Simulacion[]>` (usado por Task 5).

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
  ObligacionEmpresa,
  RegistroFinanciero,
} from '../types'
import { diaPorNovenoDigito, diasHasta, novenoDigito, HOY_OBLIGACIONES } from '../obligaciones/calculo'
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
  Simulacion,
} from '../types'
import { diaPorNovenoDigito, diasHasta, novenoDigito, HOY_OBLIGACIONES } from '../obligaciones/calculo'
import { simularAumentoVentas, simularContratacionPersonal } from '../simulador/calculo'
import { utilidadNeta } from '../financiero/calculo'
```

- [ ] **Step 2: Agregar la construcción de la semilla al final de `src/portal/data/mock-portal-data.ts`**

```ts
const registroBaseTextiles = registrosFinancierosSemilla['emp-1']
  .filter((r) => r.estado === 'VIGENTE')
  .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

const pctCostoVariableBaseTextiles = Math.round(
  (registroBaseTextiles.costoVentas / registroBaseTextiles.ingresosOperacionales) * 100,
)

const entradasLaboralBajo = {
  numeroContrataciones: 2,
  salarioMensual: 500,
  mesesSimular: 12,
  costoReclutamiento: 400,
  otrosBeneficios: 20,
  incluyeFondosReserva: false,
  ingresoAdicionalEsperado: 1400,
  mesesProductividadPlena: 2,
}

const entradasLaboralCritico = {
  numeroContrataciones: 3,
  salarioMensual: 600,
  mesesSimular: 6,
  costoReclutamiento: 500,
  otrosBeneficios: 0,
  incluyeFondosReserva: true,
  ingresoAdicionalEsperado: 0,
  mesesProductividadPlena: 1,
}

const entradasFinancieroTextiles = {
  incrementoPct: 8,
  mesesSimular: 12,
  inversionInicial: 800,
  gastoOperativoAdicional: 100,
  pctCostoVariable: pctCostoVariableBaseTextiles,
}

const simulacionesTextilesAndina: Simulacion[] = [
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-08-05',
    entradas: entradasLaboralBajo,
    resultado: simularContratacionPersonal(entradasLaboralBajo),
  },
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-07-20',
    entradas: entradasLaboralCritico,
    resultado: simularContratacionPersonal(entradasLaboralCritico),
  },
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'AUMENTO_VENTAS',
    fecha: '2026-08-10',
    entradas: entradasFinancieroTextiles,
    resultado: simularAumentoVentas(
      entradasFinancieroTextiles,
      registroBaseTextiles.ingresosOperacionales,
      utilidadNeta(registroBaseTextiles),
    ),
  },
]

const entradasLaboralComercialDelValle = {
  numeroContrataciones: 1,
  salarioMensual: 460,
  mesesSimular: 6,
  costoReclutamiento: 150,
  otrosBeneficios: 0,
  incluyeFondosReserva: false,
  ingresoAdicionalEsperado: 300,
  mesesProductividadPlena: 2,
}

const simulacionesComercialDelValle: Simulacion[] = [
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-07-28',
    entradas: entradasLaboralComercialDelValle,
    resultado: simularContratacionPersonal(entradasLaboralComercialDelValle),
  },
]

export const simulacionesSemilla: Record<string, Simulacion[]> = {
  'emp-1': simulacionesTextilesAndina,
  'emp-2': simulacionesComercialDelValle,
}
```

Nota: `registrosFinancierosSemilla` ya está definido más arriba en este mismo archivo (Fase 3), así que
está disponible sin import adicional — solo se agregó el import de `Simulacion`, `simularAumentoVentas`/
`simularContratacionPersonal` y `utilidadNeta`.

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual con un script temporal**

Run: `npx tsx -e "
import { simulacionesSemilla } from './src/portal/data/mock-portal-data.ts'
console.log('emp-1 total', simulacionesSemilla['emp-1'].length)
console.log('emp-2 total', simulacionesSemilla['emp-2'].length)
console.log('emp-1 riesgos', simulacionesSemilla['emp-1'].map(s => s.resultado.nivelRiesgo))
"`

Expected: `emp-1 total 3`, `emp-2 total 1`, `emp-1 riesgos` incluye `CRITICO` en al menos una entrada (la de
`ingresoAdicionalEsperado: 0`). Si `npx tsx` no resuelve el alias `@/` usado dentro de
`simulador/calculo.ts`, confiar en `npm run build` (mismo criterio que Fase 5).

- [ ] **Step 5: Commit**

```bash
git add src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar semilla de simulaciones por empresa"
```

---

### Task 5: Extender `PortalDataContext` con `simulaciones`

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `simulacionesSemilla` (Task 4); `Simulacion` (Task 1, tipo).
- Produces: `usePortalData()` gana `simulaciones: Record<string, Simulacion[]>`,
  `guardarSimulacion(empresaId: string, sim: Simulacion): void` — usados por Tasks 7, 8.

- [ ] **Step 1: Reemplazar el contenido completo de `src/portal/PortalDataContext.tsx`**

```tsx
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Empresa, ObligacionEmpresa, RegistroFinanciero, Simulacion } from './types'
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
  obligacionesEmpresaSemilla,
  simulacionesSemilla,
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
  simulaciones: Record<string, Simulacion[]>
  guardarSimulacion: (empresaId: string, sim: Simulacion) => void
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
  const [simulaciones, setSimulaciones] = useState<Record<string, Simulacion[]>>(simulacionesSemilla)

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

  const guardarSimulacion = (empresaId: string, sim: Simulacion) => {
    setSimulaciones((current) => ({
      ...current,
      [empresaId]: [...(current[empresaId] ?? []), sim],
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
        simulaciones,
        guardarSimulacion,
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
git commit -m "feat: agregar simulaciones al PortalDataContext"
```

---

### Task 6: Gráfico de la simulación (`SimulacionChart.tsx`)

**Files:**
- Create: `src/portal/simulador/SimulacionChart.tsx`

**Interfaces:**
- Consumes: `SerieMensualSimulacion` (Task 1, tipo).
- Produces: componente `SimulacionChart({ serie }: { serie: SerieMensualSimulacion[] })` — usado por Task 7.

- [ ] **Step 1: Crear `src/portal/simulador/SimulacionChart.tsx`**

```tsx
import type { SerieMensualSimulacion } from '@/portal/types'

const CHART_HEIGHT = 220
const CHART_WIDTH = 640

function buildPoints(values: number[], min: number, max: number) {
  if (values.length < 2) return ''
  const rango = max - min || 1
  const step = CHART_WIDTH / (values.length - 1)
  return values
    .map((value, index) => {
      const x = index * step
      const y = CHART_HEIGHT - ((value - min) / rango) * CHART_HEIGHT
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export function SimulacionChart({ serie }: { serie: SerieMensualSimulacion[] }) {
  if (serie.length < 2) {
    return (
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[17px] font-semibold">Situación actual vs simulada</h2>
        <div className="mt-4 grid place-items-center rounded-lg border border-dashed border-line py-14">
          <p className="max-w-[32ch] text-center text-[13px] text-ink-500">
            Simula al menos 2 meses para ver la comparación en el tiempo.
          </p>
        </div>
      </section>
    )
  }

  const costo = serie.map((s) => s.costoAcumulado)
  const ingreso = serie.map((s) => s.ingresoAcumulado)
  const utilidadActual = serie.map((s) => s.utilidadActual)
  const utilidadProyectada = serie.map((s) => s.utilidadProyectada)
  const todos = [...costo, ...ingreso, ...utilidadActual, ...utilidadProyectada, 0]
  const max = Math.max(...todos) * 1.15 || 1
  const min = Math.min(...todos) * 1.15
  const yTicks = [max, (max + min) / 2, min].map((v) => `$${Math.round(v / 1000)}k`)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[17px] font-semibold">Situación actual vs simulada</h2>

      <div className="mt-3.5 flex gap-2.5">
        <div
          className="num flex flex-none flex-col justify-between py-0.5 text-right text-[11px] text-ink-500"
          style={{ height: CHART_HEIGHT }}
        >
          {yTicks.map((t, i) => (
            <span key={`${t}-${i}`}>{t}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1 border-b border-l border-line/70" style={{ height: CHART_HEIGHT }}>
          <svg
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-label="Costo acumulado, ingreso adicional acumulado, utilidad actual y utilidad proyectada por mes"
          >
            <polyline points={buildPoints(costo, min, max)} fill="none" stroke="var(--color-destructive)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(ingreso, min, max)} fill="none" stroke="var(--color-emerald-brand)" strokeWidth={6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(utilidadActual, min, max)} fill="none" stroke="var(--color-ink-500)" strokeWidth={4} strokeDasharray="10 8" vectorEffect="non-scaling-stroke" />
            <polyline points={buildPoints(utilidadProyectada, min, max)} fill="none" stroke="var(--color-navy-500)" strokeWidth={5} strokeDasharray="16 8" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
      </div>
      <div className="ml-[52px] mt-1.5 flex justify-between gap-1 overflow-hidden text-[11px] text-ink-500">
        {serie.map((s) => (
          <span key={s.mes}>{s.mes.replace('Mes ', 'M')}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-4 border-t border-line/70 pt-3 text-[12.5px] text-ink-700">
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-destructive" aria-hidden="true" />
          Costo acumulado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-emerald-brand" aria-hidden="true" />
          Ingreso adicional acumulado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-ink-500" aria-hidden="true" />
          Utilidad actual
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-[3px] w-[18px] rounded-sm bg-navy-500" aria-hidden="true" />
          Utilidad proyectada
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/portal/simulador/SimulacionChart.tsx
git commit -m "feat: agregar grafico de la simulacion"
```

---

### Task 7: Pantalla Simulador (`SimuladorScreen.tsx`) — wizard + historial + ruta

**Files:**
- Create: `src/portal/simulador/SimuladorScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `registrosFinancieros`, `simulaciones`, `guardarSimulacion`
  (Task 5); `ESCENARIOS_SIMULACION`, `escenarioPorCodigo`, `VARIABLES_POR_ESCENARIO` (Task 1);
  `HOY_SIMULADOR`, `simularContratacionPersonal`, `simularAumentoVentas` (Task 2); `NIVEL_RIESGO_LABEL`,
  `NIVEL_RIESGO_BADGE` (Task 3); `SimulacionChart` (Task 6); `formatUSD` (existente en
  `@/portal/financiero/formato`); `utilidadNeta` (existente en `@/portal/financiero/calculo`);
  `formatFecha` (existente en `@/portal/obligaciones/formato`).
- Produces: componente `SimuladorScreen` montado en la ruta `/app/simulador`.

- [ ] **Step 1: Crear `src/portal/simulador/SimuladorScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { EscenarioSimulacion, RegistroFinanciero, Simulacion } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'
import { utilidadNeta } from '@/portal/financiero/calculo'
import { formatFecha } from '@/portal/obligaciones/formato'
import { ESCENARIOS_SIMULACION, escenarioPorCodigo, VARIABLES_POR_ESCENARIO } from './catalogo'
import { HOY_SIMULADOR, simularAumentoVentas, simularContratacionPersonal } from './calculo'
import { NIVEL_RIESGO_BADGE, NIVEL_RIESGO_LABEL } from './estilo'
import { SimulacionChart } from './SimulacionChart'

type Paso = 1 | 2 | 3

function disponibilidadEscenario(
  escenario: EscenarioSimulacion,
  registroBase: RegistroFinanciero | undefined,
): { disponible: boolean; motivo?: string } {
  if (!escenario.implementado) return { disponible: false, motivo: 'Próximamente' }
  if (escenario.codigo === 'AUMENTO_VENTAS' && !registroBase) {
    return { disponible: false, motivo: 'Requiere registro financiero vigente' }
  }
  return { disponible: true }
}

export function SimuladorScreen() {
  const navigate = useNavigate()
  const { empresaActiva, registrosFinancieros, simulaciones, guardarSimulacion } = usePortalData()

  const [step, setStep] = useState<Paso>(1)
  const [maxStepReached, setMaxStepReached] = useState<Paso>(1)
  const [escenarioCodigo, setEscenarioCodigo] = useState<string | null>(null)
  const [entradas, setEntradas] = useState<Record<string, number | boolean>>({})
  const [resultadoActual, setResultadoActual] = useState<Simulacion['resultado'] | null>(null)

  const registroBase = [...(registrosFinancieros[empresaActiva.id] ?? [])]
    .filter((r) => r.estado === 'VIGENTE')
    .sort((a, b) => b.periodo.localeCompare(a.periodo))[0]

  const historial = [...(simulaciones[empresaActiva.id] ?? [])].sort((a, b) => b.fecha.localeCompare(a.fecha))

  const escenarioActivo = escenarioCodigo ? escenarioPorCodigo(escenarioCodigo) : undefined
  const variablesActivo = escenarioCodigo ? (VARIABLES_POR_ESCENARIO[escenarioCodigo] ?? []) : []

  const seleccionarEscenario = (codigo: string) => {
    const variables = VARIABLES_POR_ESCENARIO[codigo] ?? []
    const draft: Record<string, number | boolean> = {}
    for (const v of variables) draft[v.codigo] = v.default
    if (codigo === 'AUMENTO_VENTAS' && registroBase && registroBase.ingresosOperacionales !== 0) {
      draft.pctCostoVariable = Math.round((registroBase.costoVentas / registroBase.ingresosOperacionales) * 100)
    }
    setEscenarioCodigo(codigo)
    setEntradas(draft)
    setResultadoActual(null)
    setStep(2)
    setMaxStepReached((m) => (m < 2 ? 2 : m))
  }

  const actualizarVariable = (codigo: string, valor: number | boolean) => {
    setEntradas((current) => ({ ...current, [codigo]: valor }))
  }

  const handleEjecutar = () => {
    if (!escenarioCodigo) return
    const resultado =
      escenarioCodigo === 'CONTRATACION_PERSONAL'
        ? simularContratacionPersonal(entradas)
        : registroBase
          ? simularAumentoVentas(entradas, registroBase.ingresosOperacionales, utilidadNeta(registroBase))
          : null
    if (!resultado) return
    const nuevaSimulacion: Simulacion = {
      id: crypto.randomUUID(),
      escenarioCodigo,
      fecha: HOY_SIMULADOR,
      entradas,
      resultado,
    }
    guardarSimulacion(empresaActiva.id, nuevaSimulacion)
    setResultadoActual(resultado)
    setStep(3)
    setMaxStepReached(3)
  }

  const handleNuevaSimulacion = () => {
    setEscenarioCodigo(null)
    setEntradas({})
    setResultadoActual(null)
    setStep(1)
    setMaxStepReached(1)
  }

  const irAPaso = (n: Paso) => {
    if (n > maxStepReached) return
    setStep(n)
  }

  const pasos: { n: Paso; label: string }[] = [
    { n: 1, label: 'Escenario' },
    { n: 2, label: 'Variables' },
    { n: 3, label: 'Resultado' },
  ]

  const baselineLabel =
    escenarioCodigo === 'CONTRATACION_PERSONAL'
      ? 'Empleados actuales'
      : escenarioCodigo === 'AUMENTO_VENTAS'
        ? 'Ingresos mensuales base (último registro vigente)'
        : ''
  const baselineValor =
    escenarioCodigo === 'CONTRATACION_PERSONAL'
      ? empresaActiva.general.numeroEmpleados
      : escenarioCodigo === 'AUMENTO_VENTAS' && registroBase
        ? formatUSD(registroBase.ingresosOperacionales)
        : ''

  return (
    <section className="flex flex-col gap-4.5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <h1 className="text-[28px] font-bold leading-tight">Simulador</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-700">
            Evalúa escenarios financieros y tributarios antes de tomar decisiones importantes para tu empresa.
          </p>
        </div>
        {step === 3 && (
          <button
            type="button"
            onClick={handleNuevaSimulacion}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13.5px] font-semibold text-navy-700"
          >
            Nueva simulación
          </button>
        )}
      </div>

      <ol className="flex flex-wrap gap-5">
        {pasos.map((p) => (
          <li key={p.n} className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => irAPaso(p.n)}
              disabled={p.n > maxStepReached}
              aria-current={p.n === step}
              className={`grid h-7.5 w-7.5 place-items-center rounded-full border text-[13px] font-bold disabled:cursor-not-allowed ${
                p.n === step
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : p.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
            >
              {p.n}
            </button>
            <span className={`text-[13px] ${p.n === step ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>{p.label}</span>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <section className="rounded-xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">1. Escenario</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-700">Selecciona el tipo de escenario que deseas simular.</p>
          <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {ESCENARIOS_SIMULACION.map((e) => {
              const { disponible, motivo } = disponibilidadEscenario(e, registroBase)
              return (
                <div
                  key={e.codigo}
                  className={`flex flex-col gap-2 rounded-xl border border-line bg-card p-4 ${disponible ? '' : 'opacity-60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-full bg-navy-100 px-2.5 py-0.5 text-[10.5px] font-bold tracking-wide text-navy-700">
                      {e.categoria}
                    </span>
                    {!disponible && (
                      <span className="rounded-full bg-surface px-2.5 py-0.5 text-[11px] font-semibold text-ink-500">{motivo}</span>
                    )}
                  </div>
                  <h3 className="text-[16px] font-semibold">{e.nombre}</h3>
                  <p className="text-[13px] leading-relaxed text-ink-700">{e.descripcion}</p>
                  <span className="font-mono text-[10.5px] text-ink-500">{e.codigo}</span>
                  <button
                    type="button"
                    disabled={!disponible}
                    onClick={() => seleccionarEscenario(e.codigo)}
                    className="mt-auto w-fit min-h-9.5 rounded-lg border border-line bg-card px-3.5 text-[12.5px] font-semibold text-navy-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Simular este escenario
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {step === 2 && escenarioActivo && (
        <section className="rounded-xl border border-line bg-card p-5">
          <h2 className="text-lg font-semibold">2. Variables</h2>
          <p className="mt-1.5 text-[13.5px] text-ink-700">
            {escenarioActivo.nombre} · {escenarioActivo.categoria} · completa la información requerida para tu simulación.
          </p>
          <div className="mt-3.5 rounded-lg border border-line/70 bg-surface p-3.5">
            <p className="text-[12px] text-ink-500">{baselineLabel}</p>
            <p className="num mt-1.5 font-display text-xl font-bold">{baselineValor}</p>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            {variablesActivo.map((v) => (
              <div key={v.codigo} className="min-w-0">
                <label htmlFor={`sim-${v.codigo}`} className="mb-1.5 block text-[12.5px] font-semibold text-ink-700">
                  {v.label}
                </label>
                {v.tipoDato === 'BOOLEANO' ? (
                  <label className="flex min-h-11 items-center gap-2.5 rounded-lg border border-line bg-card px-3 text-[13.5px]">
                    <input
                      id={`sim-${v.codigo}`}
                      type="checkbox"
                      checked={Boolean(entradas[v.codigo])}
                      onChange={(e) => actualizarVariable(v.codigo, e.target.checked)}
                    />
                    {entradas[v.codigo] ? 'Sí' : 'No'}
                  </label>
                ) : (
                  <span className="flex items-center gap-2">
                    <input
                      id={`sim-${v.codigo}`}
                      type="number"
                      value={typeof entradas[v.codigo] === 'number' ? (entradas[v.codigo] as number) : 0}
                      min={v.valorMinimo}
                      max={v.valorMaximo}
                      onChange={(e) => actualizarVariable(v.codigo, Number(e.target.value))}
                      className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[14px]"
                    />
                    {v.unidad && <span className="min-w-7 shrink-0 text-[12px] text-ink-500">{v.unidad}</span>}
                  </span>
                )}
                {v.hint && <p className="mt-1.5 text-[11.5px] text-ink-500">{v.hint}</p>}
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={handleEjecutar}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Ejecutar simulación
            </button>
          </div>
        </section>
      )}

      {step === 3 && resultadoActual && escenarioActivo && (
        <section className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
            {resultadoActual.cards.map((c) => (
              <div key={c.titulo} className="flex min-h-[130px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
                <p className="text-[12.5px] font-semibold text-ink-500">{c.titulo}</p>
                <p className="num mt-auto text-[26px] font-bold leading-none">
                  {c.formato === 'USD' ? formatUSD(c.valor) : `${c.valor.toFixed(1)}%`}
                </p>
                <p className="text-[12px] leading-snug text-ink-500">{c.sub}</p>
              </div>
            ))}
          </div>

          <SimulacionChart serie={resultadoActual.serie} />

          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-3 py-1 text-[12.5px] font-bold ${NIVEL_RIESGO_BADGE[resultadoActual.nivelRiesgo]}`}>
              Riesgo {NIVEL_RIESGO_LABEL[resultadoActual.nivelRiesgo]}
            </span>
            <p className="text-[13px] text-ink-700">{resultadoActual.riesgoTexto}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-line bg-card p-4.5">
              <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
              <ol className="mt-3 flex flex-col gap-2.5 pl-5 text-[13px] leading-relaxed text-ink-900">
                {resultadoActual.recomendaciones.map((r) => (
                  <li key={r} className="list-decimal">
                    {r}
                  </li>
                ))}
              </ol>
            </section>
            <div className="flex flex-col gap-4">
              <section className="rounded-xl border border-line bg-card p-4.5">
                <h2 className="text-[16px] font-semibold">Supuestos del escenario</h2>
                <ul className="mt-3 flex flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-700">
                  {resultadoActual.supuestos.map((s) => (
                    <li key={s} className="list-disc">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="rounded-xl border border-line bg-surface p-4.5">
                <h2 className="text-[16px] font-semibold">Limitaciones</h2>
                <ul className="mt-3 flex flex-col gap-2 pl-5 text-[12.5px] leading-relaxed text-ink-700">
                  {resultadoActual.limitaciones.map((l) => (
                    <li key={l} className="list-disc">
                      {l}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
            >
              Regresar al Simulador
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Exportar PDF
            </button>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold">Historial de simulaciones</h2>
        <div className="mt-3 flex flex-col gap-2.5">
          {historial.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-ink-500">Todavía no has ejecutado ninguna simulación.</p>
          ) : (
            historial.map((s) => {
              const catalogo = escenarioPorCodigo(s.escenarioCodigo)
              return (
                <div key={s.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line/70 p-3">
                  <div className="min-w-0 flex-1 basis-[200px]">
                    <p className="text-[13.5px] font-semibold">{catalogo?.nombre ?? s.escenarioCodigo}</p>
                    <p className="mt-0.5 text-[12px] text-ink-500">
                      {formatFecha(s.fecha)} · {empresaActiva.nombre}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${NIVEL_RIESGO_BADGE[s.resultado.nivelRiesgo]}`}>
                    Riesgo {NIVEL_RIESGO_LABEL[s.resultado.nivelRiesgo]}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/simulador/${s.id}`)}
                    className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700"
                  >
                    Ver detalle
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-ink-700"
                  >
                    Exportar PDF
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>
    </section>
  )
}
```

- [ ] **Step 2: Crear `src/portal/simulador/formato.ts`**

Formatea el valor de una `VariableEscenario` según su `tipoDato` — usado por Task 8
(`DetalleSimulacionScreen`) para mostrar las variables ingresadas de una simulación guardada. No lo usa
`SimuladorScreen` (el paso 2 edita valores crudos en inputs numéricos/checkbox, no valores formateados).

```ts
import type { VariableEscenario } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'

export function formatValorVariable(v: VariableEscenario, valor: number | boolean): string {
  if (v.tipoDato === 'BOOLEANO') return valor ? 'Sí' : 'No'
  const numero = typeof valor === 'number' ? valor : 0
  if (v.tipoDato === 'MONEDA') return formatUSD(numero)
  if (v.tipoDato === 'PORCENTAJE') return `${numero}%`
  return `${numero}${v.unidad ? ` ${v.unidad}` : ''}`
}
```

- [ ] **Step 3: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los demás imports de pantallas del portal:

```tsx
import { SimuladorScreen } from './portal/simulador/SimuladorScreen'
```

Agregar la ruta dentro de `<Route path="/app" ...>`, después de `obligaciones/:id`:

```tsx
        <Route path="simulador" element={<SimuladorScreen />} />
```

- [ ] **Step 4: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 5: Verificación manual en el navegador**

Run: `npm run dev`, abrir `/app/simulador` con Textiles Andina (empresa activa por defecto).

Expected:
- Paso 1: 4 tarjetas — "Contratación de personal" (LABORAL) y "Aumento de ventas" (FINANCIERO) clicables sin
  badge; "Cambio de régimen tributario" (TRIBUTARIO) y "Aumento de capital social" (SOCIETARIO) con opacidad
  reducida y badge "Próximamente".
- Click en "Contratación de personal" → paso 2 con baseline "Empleados actuales" = `38`, 8 campos con los
  defaults del catálogo. Click "Ejecutar simulación" → paso 3 con 4 KPI cards, gráfico de 4 líneas, badge de
  riesgo, recomendaciones/supuestos/limitaciones, y la simulación aparece en "Historial de simulaciones"
  debajo.
- "Regresar al Simulador" → vuelve al paso 2 con los mismos valores (no los resetea). "Nueva simulación"
  (botón del header, visible solo en paso 3) → vuelve al paso 1 sin escenario seleccionado.
- Repetir con "Aumento de ventas": confirmar que el baseline muestra "Ingresos mensuales base" con un valor
  en USD, y que el campo "% del incremento que genera costo variable adicional" arranca con el porcentaje
  derivado del registro financiero (no en 0).
- Historial: al cargar la pantalla ya debe mostrar 3 simulaciones sembradas (2 LABORAL, 1 FINANCIERO) antes
  de ejecutar ninguna nueva, con al menos un badge "Riesgo Crítico".
- Cambiar a Comercial del Valle: confirmar que "Aumento de ventas" aparece deshabilitada con el motivo
  "Requiere registro financiero vigente" (distinto del "Próximamente" de TRIBUTARIO/SOCIETARIO), que
  "Contratación de personal" sigue disponible, y que el historial muestra 1 simulación sembrada.

- [ ] **Step 6: Commit**

```bash
git add src/portal/simulador/SimuladorScreen.tsx src/portal/simulador/formato.ts src/App.tsx
git commit -m "feat: agregar pantalla Simulador (wizard + historial)"
```

---

### Task 8: Pantalla Detalle de simulación (`DetalleSimulacionScreen.tsx`) + ruta

**Files:**
- Create: `src/portal/simulador/DetalleSimulacionScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` → `empresaActiva`, `simulaciones` (Task 5); `escenarioPorCodigo`,
  `VARIABLES_POR_ESCENARIO` (Task 1); `NIVEL_RIESGO_LABEL`, `NIVEL_RIESGO_BADGE` (Task 3);
  `formatValorVariable` (Task 7, `simulador/formato.ts`); `formatUSD` (existente en
  `@/portal/financiero/formato`); `formatFecha` (existente en `@/portal/obligaciones/formato`).
- Produces: componente `DetalleSimulacionScreen` montado en la ruta `/app/simulador/:id`.

- [ ] **Step 1: Crear `src/portal/simulador/DetalleSimulacionScreen.tsx`**

```tsx
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { escenarioPorCodigo, VARIABLES_POR_ESCENARIO } from './catalogo'
import { NIVEL_RIESGO_BADGE, NIVEL_RIESGO_LABEL } from './estilo'
import { formatValorVariable } from './formato'

export function DetalleSimulacionScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, simulaciones } = usePortalData()

  const simulacion = (simulaciones[empresaActiva.id] ?? []).find((s) => s.id === id)

  if (!simulacion) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró esa simulación.</p>
        <button
          type="button"
          onClick={() => navigate('/app/simulador')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver al Simulador
        </button>
      </section>
    )
  }

  const catalogo = escenarioPorCodigo(simulacion.escenarioCodigo)
  const variables = VARIABLES_POR_ESCENARIO[simulacion.escenarioCodigo] ?? []

  return (
    <section className="flex flex-col gap-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/simulador')}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
        >
          ← Simulador
        </button>
        <h1 className="mt-1.5 text-[26px] font-bold leading-tight">{catalogo?.nombre ?? simulacion.escenarioCodigo}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-2.5">
          <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${NIVEL_RIESGO_BADGE[simulacion.resultado.nivelRiesgo]}`}>
            Riesgo {NIVEL_RIESGO_LABEL[simulacion.resultado.nivelRiesgo]}
          </span>
          <span className="text-[13px] text-ink-500">Ejecutada el {formatFecha(simulacion.fecha)} · solo lectura</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Variables ingresadas</h2>
          <dl className="mt-3 flex flex-col gap-2.5">
            {variables.map((v) => (
              <div key={v.codigo} className="flex justify-between gap-3 border-b border-line/70 pb-1.5">
                <dt className="text-[12.5px] text-ink-500">{v.label}</dt>
                <dd className="num m-0 text-[13.5px] font-semibold">
                  {formatValorVariable(v, simulacion.entradas[v.codigo])}
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold">Resultados</h2>
          <dl className="mt-3 flex flex-col gap-2.5">
            {simulacion.resultado.cards.map((c) => (
              <div key={c.titulo} className="flex justify-between gap-3 border-b border-line/70 pb-1.5">
                <dt className="text-[12.5px] text-ink-500">{c.titulo}</dt>
                <dd className="num m-0 text-[13.5px] font-semibold">
                  {c.formato === 'USD' ? formatUSD(c.valor) : `${c.valor.toFixed(1)}%`}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-11 rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white"
            >
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={() => navigate('/app/simulador')}
              className="min-h-11 rounded-lg border border-line bg-card px-4 text-[13.5px] font-semibold text-ink-700"
            >
              Regresar al Simulador
            </button>
          </div>
        </section>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Agregar la ruta en `src/App.tsx`**

Agregar el import junto a los demás imports de pantallas del portal:

```tsx
import { DetalleSimulacionScreen } from './portal/simulador/DetalleSimulacionScreen'
```

Agregar la ruta dentro de `<Route path="/app" ...>`, justo después de `simulador`:

```tsx
        <Route path="simulador/:id" element={<DetalleSimulacionScreen />} />
```

- [ ] **Step 3: Verificar type-check**

Run: `npm run build`

Expected: compila sin errores.

- [ ] **Step 4: Verificación manual en el navegador**

Run: `npm run dev`, entrar a `/app/simulador` con Textiles Andina, click en "Ver detalle" de cualquier fila
del historial.

Expected: navega a `/app/simulador/:id`, muestra las variables ingresadas y resultados de esa simulación
exacta (sin controles editables), badge de riesgo coincide con el de la fila del historial. "Regresar al
Simulador" vuelve a `/app/simulador`. Navegar directo a `/app/simulador/no-existe`: confirmar el mensaje
"No se encontró esa simulación" con botón de volver, sin crashear.

- [ ] **Step 5: Commit**

```bash
git add src/portal/simulador/DetalleSimulacionScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla Detalle de simulacion"
```

---

## Verificación final end-to-end

- [ ] **Paso 1:** `npm run build` completo sin errores (type-check de las 8 tasks combinadas).
- [ ] **Paso 2:** `npm run dev`, recorrer con Textiles Andina: Sidebar → Simulador → paso 1 (4 tarjetas, 2
  disponibles + 2 "Próximamente") → "Contratación de personal" → paso 2 (baseline = empleados actuales,
  8 variables) → "Ejecutar simulación" → paso 3 (4 cards, gráfico, riesgo, recomendaciones/supuestos/
  limitaciones) → aparece en Historial.
- [ ] **Paso 3:** Repetir el flujo completo con "Aumento de ventas" (baseline = ingresos mensuales base,
  5 variables, % de costo variable precargado desde el registro financiero).
- [ ] **Paso 4:** Cambiar a Comercial del Valle: confirmar que "Aumento de ventas" está deshabilitada con
  motivo "Requiere registro financiero vigente", "Contratación de personal" sigue funcional de punta a
  punta, y el historial muestra su simulación sembrada.
- [ ] **Paso 5:** Desde el historial, "Ver detalle" de una simulación sembrada y de una recién ejecutada:
  confirmar que ambas muestran datos coherentes de solo lectura.
- [ ] **Paso 6:** Navegar directo a una URL de detalle inexistente (`/app/simulador/no-existe`): confirmar
  el mensaje de error sin crashear.
