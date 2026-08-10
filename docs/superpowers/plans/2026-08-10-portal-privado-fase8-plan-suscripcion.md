# Portal Privado — Fase 8 (Plan y suscripción) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo "Plan y suscripción" del portal privado —Mi plan, administrar suscripción, cambiar de plan, métodos de pago e historial de pagos— como prototipo frontend de alta fidelidad, autocontenido bajo `/app/plan`, sin tocar código de Fases 2–7 (salvo la lectura dinámica del plan en `Sidebar.tsx`, ya prevista).

**Architecture:** Los 3 planes se adaptan (no se duplican) desde `src/lib/plans-data.ts` en `plan/catalogo.ts`. `plan/calculo.ts` contiene toda la lógica determinista (módulos por plan, estadísticas de uso, detección de marca de tarjeta, validación de expiración/número/CVC, paginación de pagos) como funciones puras. `PortalDataContext` gana campos de cuenta (no indexados por empresa, porque la suscripción es de cuenta): plan activo, métodos de pago, historial de pagos, renovación automática y cancelación, con sus mutaciones. Los 3 modales comparten un hook `useAccessibleDialog` con el mismo mecanismo de foco/Escape/scroll-lock que `marketplace/ReservaModal.tsx`.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4 CSS-first, react-router-dom 6, lucide-react, shadcn/ui (`Button`, `Input`, `Label`, `Textarea`, `Accordion`). Sin backend, test runner, ESLint, localStorage ni dependencias nuevas.

## Global Constraints

- Trabajar sobre la rama `dylan_cd` y preservar cualquier cambio ajeno que aparezca durante la ejecución.
- Fuente normativa de alcance: `docs/superpowers/specs/2026-08-10-portal-privado-fase8-plan-suscripcion-design.md`.
- Módulo autocontenido: no modificar código de Fases 2–7 (`empresa/`, `financiero/`, `indicadores/`, `obligaciones/`, `simulador/`, `marketplace/`), salvo `Sidebar.tsx` (leer `planActivoCodigo` en vez del mock estático `planInfo`).
- `src/lib/plans-data.ts` no se modifica; `plan/catalogo.ts` lo adapta importándolo.
- `HOY_PLAN = '2026-08-13'`, igual patrón que `HOY_OBLIGACIONES`/`HOY_MARKETPLACE` en un solo módulo (`plan/calculo.ts`).
- Sin gating por plan en otras pantallas, sin validar límites de empresa al cambiar de plan, sin cobro mock del Marketplace — todo fuera de alcance de esta fase.
- Solo se persisten `marca`, `ultimosCuatro` y expiración de una tarjeta nueva; el número completo y el CVC nunca se guardan en estado.
- No se puede eliminar el único método de pago restante; al eliminar el predeterminado con otros disponibles, se promueve automáticamente el primero restante.
- Reutilizar `formatUSD` de `financiero/formato.ts` y `formatFecha` de `obligaciones/formato.ts`; no se duplica moneda/fecha.
- Toda lógica determinista va en funciones puras (`plan/calculo.ts`); componentes solo coordinan estado y render.
- No añadir dependencias, test runner, ESLint, localStorage ni persistencia fuera de memoria React.
- Ejecutar `npm run build` después de cada tarea. Para helpers puros usar scripts puntuales `npx tsx -e`.
- Cada tarea requiere revisión de cumplimiento del spec y luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                      # Modify: rutas /app/plan/*
└── portal/
    ├── types.ts                                 # Modify: tipos Plan y suscripción
    ├── PortalDataContext.tsx                    # Modify: campos de cuenta + mutaciones
    ├── data/
    │   └── mock-portal-data.ts                  # Modify: semilla de suscripción; quita planInfo
    ├── components/
    │   └── Sidebar.tsx                          # Modify: lee planActivoCodigo del contexto
    └── plan/
        ├── catalogo.ts                          # Create: planes adaptados + FAQ propia
        ├── calculo.ts                           # Create: HOY_PLAN + funciones puras
        ├── formato.ts                           # Create: formatExpiracion/formatUltimosCuatro
        ├── useAccessibleDialog.ts               # Create: hook de foco/Escape/scroll-lock compartido
        ├── PlanScreen.tsx                       # Create: "Mi plan"
        ├── AdministrarSuscripcionScreen.tsx     # Create
        ├── CambiarPlanScreen.tsx                # Create
        ├── MetodosPagoScreen.tsx                # Create
        ├── HistorialPagosScreen.tsx             # Create
        ├── CancelarSuscripcionModal.tsx         # Create
        ├── CambiarPlanModal.tsx                 # Create
        └── MetodoPagoModal.tsx                  # Create
```

---

### Task 1: Tipos del dominio Plan y suscripción

**Files:**
- Modify: `src/portal/types.ts`

**Interfaces:**
- Consumes: ningún contrato nuevo.
- Produces: `PlanCodigo`, `MarcaTarjeta`, `TipoMetodoPago`, `MetodoPago`, `NuevoMetodoPago`,
  `EstadoPagoSuscripcion`, `PagoSuscripcion` para todas las tareas posteriores.

- [ ] **Step 1: Agregar los tipos al final de `src/portal/types.ts`**

```ts
export type PlanCodigo = 'ESENCIAL' | 'CRECIMIENTO' | 'CORPORATIVO'

export type MarcaTarjeta = 'Visa' | 'Mastercard' | 'Tarjeta'
export type TipoMetodoPago = 'Tarjeta de crédito' | 'Tarjeta de débito'

export type MetodoPago = {
  id: string
  marca: MarcaTarjeta
  tipo: TipoMetodoPago
  ultimosCuatro: string
  mesExpiracion: number // 1-12
  anioExpiracion: number
  predeterminado: boolean
  estado: 'ACTIVO'
}

export type NuevoMetodoPago = {
  numeroTarjeta: string // solo se usa para derivar marca/ultimosCuatro, nunca se persiste completo
  mesExpiracion: number
  anioExpiracion: number
}

export type EstadoPagoSuscripcion = 'PAGADO' | 'RECHAZADO'

export type PagoSuscripcion = {
  id: string
  fecha: string // YYYY-MM-DD
  monto: number
  estado: EstadoPagoSuscripcion
  proveedor: string
  referencia: string
  factura: string | null
  mensaje: string | null
  planNombre: string
  createdAt: string // ISO datetime fijo del prototipo
}
```

- [ ] **Step 2: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0; Vite genera `dist/` sin errores de tipos ni imports no usados.

- [ ] **Step 3: Commit**

```bash
git add src/portal/types.ts
git commit -m "feat: agregar tipos de plan y suscripcion"
```

---

### Task 2: Catálogo de planes y preguntas frecuentes

**Files:**
- Create: `src/portal/plan/catalogo.ts`

**Interfaces:**
- Consumes: `PlanCodigo` de Task 1; `planes`, `comparativa` de `src/lib/plans-data.ts` (sin modificarlo).
- Produces: `PlanCatalogo`, `PLANES`, `planPorCodigo`, `FilaComparativaPlan`, `COMPARATIVA_PLANES`,
  `PreguntaPlan`, `PREGUNTAS_PLAN` para todas las tareas posteriores.

- [ ] **Step 1: Crear `src/portal/plan/catalogo.ts`**

```ts
import { comparativa, planes } from '@/lib/plans-data'
import type { PlanCodigo } from '@/portal/types'

export type PlanCatalogo = {
  codigo: PlanCodigo
  nombre: string
  precio: number
  destacado: boolean
  empresas: string
  simulaciones: string
  soporte: string
  beneficios: string[]
}

const CODIGO_POR_NOMBRE: Record<string, PlanCodigo> = {
  'Plan Esencial': 'ESENCIAL',
  'Plan Crecimiento': 'CRECIMIENTO',
  'Plan Corporativo': 'CORPORATIVO',
}

export const PLANES: PlanCatalogo[] = planes.map((plan) => ({
  codigo: CODIGO_POR_NOMBRE[plan.nombre],
  nombre: plan.nombre,
  precio: plan.precio,
  destacado: plan.destacado,
  empresas: plan.empresas,
  simulaciones: plan.simulaciones,
  soporte: plan.soporte,
  beneficios: [...plan.beneficios],
}))

export function planPorCodigo(codigo: PlanCodigo): PlanCatalogo {
  const plan = PLANES.find((p) => p.codigo === codigo)
  if (!plan) throw new Error(`Plan no encontrado: ${codigo}`)
  return plan
}

export type FilaComparativaPlan = {
  modulo: string
  esencial: boolean
  crecimiento: boolean
  corporativo: boolean
}

export const COMPARATIVA_PLANES: FilaComparativaPlan[] = comparativa.map((fila) => ({ ...fila }))

export type PreguntaPlan = { pregunta: string; respuesta: string }

export const PREGUNTAS_PLAN: PreguntaPlan[] = [
  {
    pregunta: '¿Puedo cambiar mi plan cuando quiera?',
    respuesta:
      'Sí. El cambio se aplica en el siguiente ciclo de facturación y se conserva todo tu histórico.',
  },
  {
    pregunta: '¿Cómo funciona la renovación de mi suscripción?',
    respuesta: 'La renovación es mensual y automática mientras la renovación automática esté activa.',
  },
  {
    pregunta: '¿Qué métodos de pago aceptan?',
    respuesta:
      'Tarjetas de crédito y débito procesadas mediante un gateway mock, en dólares estadounidenses.',
  },
  {
    pregunta: '¿Puedo cancelar mi suscripción?',
    respuesta:
      'Sí. La cancelación detiene la renovación y conservas el acceso hasta la fecha de fin del periodo pagado.',
  },
  {
    pregunta: '¿Cómo se calculan las cargas financieras?',
    respuesta:
      'Las cargas financieras provienen de los registros mensuales que ingresa tu empresa; no son cargos adicionales.',
  },
]
```

- [ ] **Step 2: Verificar el catálogo con un script puntual**

Run:

```bash
npx tsx -e "
import { PLANES, COMPARATIVA_PLANES, PREGUNTAS_PLAN, planPorCodigo } from './src/portal/plan/catalogo'

if (PLANES.length !== 3) throw new Error('Se esperaban 3 planes')
const codigos = PLANES.map((p) => p.codigo)
if (new Set(codigos).size !== 3) throw new Error('Codigos de plan duplicados')
if (planPorCodigo('CRECIMIENTO').nombre !== 'Plan Crecimiento') throw new Error('planPorCodigo CRECIMIENTO incorrecto')
if (COMPARATIVA_PLANES.length !== 9) throw new Error('Se esperaban 9 filas de comparativa')
if (PREGUNTAS_PLAN.length !== 5) throw new Error('Se esperaban 5 preguntas frecuentes')
console.log('OK: catalogo de planes valido')
"
```

Expected: imprime `OK: catalogo de planes valido` sin errores.

- [ ] **Step 3: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/portal/plan/catalogo.ts
git commit -m "feat: agregar catalogo de planes y preguntas frecuentes"
```

---

### Task 3: Lógica pura, formato y hook de diálogo accesible

**Files:**
- Create: `src/portal/plan/calculo.ts`
- Create: `src/portal/plan/formato.ts`
- Create: `src/portal/plan/useAccessibleDialog.ts`

**Interfaces:**
- Consumes: `PlanCodigo`, `MarcaTarjeta`, `PagoSuscripcion` de Task 1.
- Produces: `HOY_PLAN`, `ModuloPlan`, `modulosDelPlan`, `EstadisticaUso`, `estadisticasDeUso`,
  `detectarMarca`, `ExpiracionParseada`, `parseExpiracion`, `ErroresNuevoMetodo`, `validarNuevoMetodo`,
  `PaginaPagos`, `paginarPagos` (todo en `calculo.ts`); `formatExpiracion`, `formatUltimosCuatro` (en
  `formato.ts`); `useAccessibleDialog` (en `useAccessibleDialog.ts`) — usados por Tasks 5–10.

- [ ] **Step 1: Crear `src/portal/plan/calculo.ts`**

```ts
import type { MarcaTarjeta, PagoSuscripcion, PlanCodigo } from '@/portal/types'

export const HOY_PLAN = '2026-08-13'

export type ModuloPlan = { nombre: string; incluido: boolean }

export function modulosDelPlan(codigo: PlanCodigo): ModuloPlan[] {
  const noEsencial = codigo !== 'ESENCIAL'
  const corporativo = codigo === 'CORPORATIVO'
  return [
    { nombre: 'Dashboard', incluido: true },
    { nombre: 'Estados financieros', incluido: true },
    { nombre: 'Indicadores avanzados', incluido: noEsencial },
    { nombre: 'Simulador', incluido: noEsencial },
    { nombre: 'Marketplace', incluido: noEsencial },
    { nombre: 'Reportes consolidados', incluido: corporativo },
  ]
}

export type EstadisticaUso = { titulo: string; valor: string }

export function estadisticasDeUso(params: {
  registrosFinancieros: number
  indicadoresCalculados: number
  simulacionesRealizadas: number
  obligacionesCumplidas: number
}): EstadisticaUso[] {
  return [
    { titulo: 'Periodos financieros registrados', valor: String(params.registrosFinancieros) },
    { titulo: 'Indicadores calculados', valor: String(params.indicadoresCalculados) },
    { titulo: 'Simulaciones realizadas', valor: String(params.simulacionesRealizadas) },
    { titulo: 'Obligaciones cumplidas a tiempo', valor: String(params.obligacionesCumplidas) },
  ]
}

export function detectarMarca(numeroTarjeta: string): MarcaTarjeta {
  const limpio = numeroTarjeta.replace(/\s+/g, '')
  if (limpio.startsWith('4')) return 'Visa'
  if (limpio.startsWith('5')) return 'Mastercard'
  return 'Tarjeta'
}

const EXPIRACION_REGEX = /^(0[1-9]|1[0-2])\/(\d{2})$/

export type ExpiracionParseada = { mes: number | null; anio: number | null; error?: string }

export function parseExpiracion(expiracion: string): ExpiracionParseada {
  const match = EXPIRACION_REGEX.exec(expiracion.trim())
  if (!match) {
    return { mes: null, anio: null, error: 'Ingresa una expiración válida (MM/AA).' }
  }

  const mes = Number(match[1])
  const anio = 2000 + Number(match[2])
  const [anioHoy, mesHoy] = HOY_PLAN.split('-').map(Number)

  if (anio < anioHoy || (anio === anioHoy && mes < mesHoy)) {
    return { mes: null, anio: null, error: 'La tarjeta está vencida.' }
  }

  return { mes, anio }
}

export type ErroresNuevoMetodo = { numeroTarjeta?: string; expiracion?: string; cvc?: string }

export function validarNuevoMetodo(datos: {
  numeroTarjeta: string
  expiracion: string
  cvc: string
}): { errores: ErroresNuevoMetodo; mesExpiracion: number | null; anioExpiracion: number | null } {
  const errores: ErroresNuevoMetodo = {}
  const numeroLimpio = datos.numeroTarjeta.replace(/\s+/g, '')

  if (!/^\d{13,19}$/.test(numeroLimpio)) {
    errores.numeroTarjeta = 'Ingresa un número de tarjeta válido (13 a 19 dígitos).'
  }

  const { mes, anio, error } = parseExpiracion(datos.expiracion)
  if (error) errores.expiracion = error

  if (!/^\d{3,4}$/.test(datos.cvc.trim())) {
    errores.cvc = 'Ingresa un CVC válido (3 o 4 dígitos).'
  }

  return { errores, mesExpiracion: mes, anioExpiracion: anio }
}

export type PaginaPagos = { items: PagoSuscripcion[]; total: number; totalPaginas: number; pagina: number }

export function paginarPagos(params: {
  pagos: PagoSuscripcion[]
  paginaSolicitada: number
  porPagina?: number
}): PaginaPagos {
  const { pagos, paginaSolicitada, porPagina = 5 } = params
  const tamanioPagina = Number.isFinite(porPagina) && porPagina > 0 ? Math.floor(porPagina) : 5
  const total = pagos.length
  const totalPaginas = Math.ceil(total / tamanioPagina)

  if (totalPaginas === 0) {
    return { items: [], total, totalPaginas: 0, pagina: 0 }
  }

  const paginaEntera = Number.isFinite(paginaSolicitada) ? Math.floor(paginaSolicitada) : 1
  const pagina = Math.min(Math.max(paginaEntera, 1), totalPaginas)
  const inicio = (pagina - 1) * tamanioPagina

  return {
    items: pagos.slice(inicio, inicio + tamanioPagina),
    total,
    totalPaginas,
    pagina,
  }
}
```

- [ ] **Step 2: Crear `src/portal/plan/formato.ts`**

```ts
export function formatExpiracion(mes: number, anio: number): string {
  return `${String(mes).padStart(2, '0')}/${anio}`
}

export function formatUltimosCuatro(marca: string, ultimosCuatro: string): string {
  return `${marca} ···· ${ultimosCuatro}`
}
```

- [ ] **Step 3: Crear `src/portal/plan/useAccessibleDialog.ts`**

Hook compartido por `CancelarSuscripcionModal`, `CambiarPlanModal` y `MetodoPagoModal`. Reproduce el
mismo mecanismo de foco inicial, trampa de Tab, Escape y scroll lock que ya usa
`marketplace/ReservaModal.tsx`, generalizado para diálogos de un solo panel.

```ts
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useAccessibleDialog(abierto: boolean, onCerrar: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return

    const focoAnterior =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => titleRef.current?.focus())

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrarRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (elemento) =>
          !elemento.hasAttribute('disabled') && elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        titleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (
        event.shiftKey &&
        (activo === primero || activo === titleRef.current || !dialog.contains(activo))
      ) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (activo === ultimo || !dialog.contains(activo))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [abierto])

  return { dialogRef, titleRef }
}
```

- [ ] **Step 4: Verificar la lógica pura con un script puntual**

Run:

```bash
npx tsx -e "
import { modulosDelPlan, estadisticasDeUso, detectarMarca, parseExpiracion, validarNuevoMetodo, paginarPagos } from './src/portal/plan/calculo'

const esencial = modulosDelPlan('ESENCIAL')
if (esencial.find((m) => m.nombre === 'Simulador').incluido !== false) throw new Error('Esencial no deberia incluir Simulador')
const corporativo = modulosDelPlan('CORPORATIVO')
if (corporativo.find((m) => m.nombre === 'Reportes consolidados').incluido !== true) throw new Error('Corporativo deberia incluir Reportes consolidados')

const stats = estadisticasDeUso({ registrosFinancieros: 3, indicadoresCalculados: 46, simulacionesRealizadas: 2, obligacionesCumplidas: 5 })
if (stats.length !== 4) throw new Error('Se esperaban 4 estadisticas')

if (detectarMarca('4111 1111 1111 1111') !== 'Visa') throw new Error('Marca Visa incorrecta')
if (detectarMarca('5500 0000 0000 0004') !== 'Mastercard') throw new Error('Marca Mastercard incorrecta')
if (detectarMarca('3700 0000 0000 002') !== 'Tarjeta') throw new Error('Marca generica incorrecta')

const vencida = parseExpiracion('01/20')
if (!vencida.error) throw new Error('Expiracion vencida deberia fallar')
const valida = parseExpiracion('05/29')
if (valida.mes !== 5 || valida.anio !== 2029) throw new Error('Expiracion valida mal parseada')

const invalido = validarNuevoMetodo({ numeroTarjeta: '123', expiracion: '13/29', cvc: '12' })
if (!invalido.errores.numeroTarjeta || !invalido.errores.expiracion || !invalido.errores.cvc) {
  throw new Error('Validacion de metodo invalido no detecto todos los errores')
}
const valido = validarNuevoMetodo({ numeroTarjeta: '4111 1111 1111 1111', expiracion: '05/29', cvc: '123' })
if (Object.keys(valido.errores).length !== 0) throw new Error('Metodo valido no deberia tener errores')

const pagos = Array.from({ length: 7 }, (_, i) => ({
  id: String(i), fecha: '2026-0' + (i + 1) + '-10', monto: 59, estado: 'PAGADO',
  proveedor: 'x', referencia: 'r' + i, factura: null, mensaje: null, planNombre: 'x', createdAt: 'x',
}))
const pagina1 = paginarPagos({ pagos, paginaSolicitada: 1 })
if (pagina1.items.length !== 5 || pagina1.totalPaginas !== 2) throw new Error('Paginacion de pagos incorrecta')

console.log('OK: logica pura de Plan y suscripcion')
"
```

Expected: imprime `OK: logica pura de Plan y suscripcion` sin errores.

- [ ] **Step 5: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/portal/plan/calculo.ts src/portal/plan/formato.ts src/portal/plan/useAccessibleDialog.ts
git commit -m "feat: agregar logica pura, formato y hook de dialogo accesible del plan"
```

---

### Task 4: Datos semilla de suscripción

**Files:**
- Modify: `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: `MetodoPago`, `PagoSuscripcion`, `PlanCodigo` de Task 1.
- Produces: `planActivoCodigoSemilla`, `suscripcionSemilla`, `metodosPagoSemilla`, `historialPagosSemilla`
  para Task 5 (contexto) y todas las pantallas.

- [ ] **Step 1: Agregar los tipos nuevos al import existente de tipos**

En `src/portal/data/mock-portal-data.ts:16-28`, el bloque `import type { ... } from '../types'` gana
`MetodoPago`, `PagoSuscripcion` y `PlanCodigo`:

```ts
import type {
  ChartSeriesPoint,
  Empresa,
  Indicador,
  Kpi,
  MetodoPago,
  NavItem,
  Notificacion,
  Obligacion,
  ObligacionEmpresa,
  PagoSuscripcion,
  PlanCodigo,
  RegistroFinanciero,
  Simulacion,
  SolicitudContacto,
} from '../types'
```

- [ ] **Step 2: Agregar la semilla de suscripción al final del archivo**

No tocar todavía el export `planInfo` (línea 133-136) — Task 6 lo reemplaza y elimina en el mismo paso
en que `Sidebar.tsx` deja de importarlo, para que el build nunca quede roto entre tareas.

Después de `solicitudesContactoSemilla` (línea 619-622 actual), agregar:

```ts
export const planActivoCodigoSemilla: PlanCodigo = 'CRECIMIENTO'

export const suscripcionSemilla = {
  fechaInicio: '2026-02-10',
  proximaRenovacion: '2026-09-10',
  renovacionAutomatica: true,
  cancelada: false,
}

export const metodosPagoSemilla: MetodoPago[] = [
  {
    id: 'mp-1',
    marca: 'Visa',
    tipo: 'Tarjeta de crédito',
    ultimosCuatro: '5601',
    mesExpiracion: 5,
    anioExpiracion: 2029,
    predeterminado: true,
    estado: 'ACTIVO',
  },
  {
    id: 'mp-2',
    marca: 'Mastercard',
    tipo: 'Tarjeta de crédito',
    ultimosCuatro: '4477',
    mesExpiracion: 11,
    anioExpiracion: 2027,
    predeterminado: false,
    estado: 'ACTIVO',
  },
]

function crearPagoSuscripcion(params: {
  fecha: string
  estado: PagoSuscripcion['estado']
  referencia: string
  mensaje: string
}): PagoSuscripcion {
  return {
    id: crypto.randomUUID(),
    fecha: params.fecha,
    monto: 59,
    estado: params.estado,
    proveedor: 'Gateway mock SAFE',
    referencia: params.referencia,
    factura: params.estado === 'PAGADO' ? `FAC-${params.referencia.slice(-8)}` : null,
    mensaje: params.mensaje,
    planNombre: 'Plan Crecimiento',
    createdAt: `${params.fecha}T09:00:00-05:00`,
  }
}

export const historialPagosSemilla: PagoSuscripcion[] = [
  crearPagoSuscripcion({ fecha: '2026-08-10', estado: 'PAGADO', referencia: 'TXN-2026-0810', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-07-10', estado: 'PAGADO', referencia: 'TXN-2026-0710', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-06-10', estado: 'PAGADO', referencia: 'TXN-2026-0610', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({
    fecha: '2026-05-10',
    estado: 'RECHAZADO',
    referencia: 'TXN-2026-0510',
    mensaje: 'Fondos insuficientes. El sistema reintentó automáticamente al mes siguiente.',
  }),
  crearPagoSuscripcion({ fecha: '2026-04-10', estado: 'PAGADO', referencia: 'TXN-2026-0410', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-03-10', estado: 'PAGADO', referencia: 'TXN-2026-0310', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-02-10', estado: 'PAGADO', referencia: 'TXN-2026-0210', mensaje: 'Pago aprobado.' }),
]
```

- [ ] **Step 3: Verificar la semilla con un script puntual**

Run:

```bash
npx tsx -e "
import { planActivoCodigoSemilla, suscripcionSemilla, metodosPagoSemilla, historialPagosSemilla } from './src/portal/data/mock-portal-data'

if (planActivoCodigoSemilla !== 'CRECIMIENTO') throw new Error('planActivoCodigoSemilla incorrecto')
if (metodosPagoSemilla.length !== 2) throw new Error('Se esperaban 2 metodos de pago')
if (metodosPagoSemilla.filter((m) => m.predeterminado).length !== 1) throw new Error('Debe haber exactamente un metodo predeterminado')
if (historialPagosSemilla.length !== 7) throw new Error('Se esperaban 7 pagos')
if (new Set(historialPagosSemilla.map((p) => p.id)).size !== 7) throw new Error('IDs de pago duplicados')
if (!suscripcionSemilla.renovacionAutomatica || suscripcionSemilla.cancelada) throw new Error('Estado inicial de suscripcion incorrecto')
console.log('OK: semilla de suscripcion valida')
"
```

Expected: imprime `OK: semilla de suscripcion valida` sin errores.

- [ ] **Step 4: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0. `planInfo` (línea 133-136) sigue en el archivo sin usarse todavía fuera de
`Sidebar.tsx` — no genera error de build, solo queda pendiente de que Task 6 lo reemplace.

- [ ] **Step 5: Commit**

```bash
git add src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar datos semilla de plan y suscripcion"
```

---

### Task 5: Extender PortalDataContext con campos de cuenta y mutaciones

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `MetodoPago`, `NuevoMetodoPago`, `PagoSuscripcion`, `PlanCodigo` de Task 1;
  `planActivoCodigoSemilla`, `suscripcionSemilla`, `metodosPagoSemilla`, `historialPagosSemilla` de
  Task 4; `detectarMarca` de Task 3.
- Produces en `usePortalData()`: `planActivoCodigo`, `cambiarPlan`, `renovacionAutomatica`,
  `toggleRenovacionAutomatica`, `suscripcionCancelada`, `motivoCancelacion`, `cancelarSuscripcion`,
  `metodosPago`, `agregarMetodoPago`, `editarExpiracionMetodoPago`, `hacerMetodoPredeterminado`,
  `eliminarMetodoPago`, `historialPagos` — consumidos por Tasks 6–10.

- [ ] **Step 1: Ampliar los imports de tipos y datos semilla**

En `src/portal/PortalDataContext.tsx:2-9`, el import de tipos gana `MetodoPago`, `NuevoMetodoPago`,
`PagoSuscripcion`, `PlanCodigo`:

```ts
import type {
  Empresa,
  MetodoPago,
  NuevaSolicitudContacto,
  NuevoMetodoPago,
  ObligacionEmpresa,
  PagoSuscripcion,
  PlanCodigo,
  RegistroFinanciero,
  Simulacion,
  SolicitudContacto,
} from './types'
```

En `src/portal/PortalDataContext.tsx:10-18`, el import de `./data/mock-portal-data` gana la semilla de
suscripción:

```ts
import {
  empresaActiva as empresaSemilla,
  empresasDisponibles as empresasSemilla,
  registrosFinancierosSemilla,
  indicadoresPrincipalesSemilla,
  obligacionesEmpresaSemilla,
  simulacionesSemilla,
  solicitudesContactoSemilla,
  planActivoCodigoSemilla,
  suscripcionSemilla,
  metodosPagoSemilla,
  historialPagosSemilla,
} from './data/mock-portal-data'
```

Y se agrega el import de `detectarMarca`:

```ts
import { detectarMarca } from './plan/calculo'
```

- [ ] **Step 2: Extender `PortalDataContextValue` (después de `enviarSolicitudContacto`, línea 44)**

```ts
  planActivoCodigo: PlanCodigo
  cambiarPlan: (codigo: PlanCodigo) => void
  renovacionAutomatica: boolean
  toggleRenovacionAutomatica: () => void
  suscripcionCancelada: boolean
  motivoCancelacion: string | null
  cancelarSuscripcion: (motivo: string) => void
  metodosPago: MetodoPago[]
  agregarMetodoPago: (nuevo: NuevoMetodoPago) => MetodoPago | null
  editarExpiracionMetodoPago: (id: string, mes: number, anio: number) => void
  hacerMetodoPredeterminado: (id: string) => void
  eliminarMetodoPago: (id: string) => boolean
  historialPagos: PagoSuscripcion[]
```

- [ ] **Step 3: Agregar el estado nuevo (después de `solicitudesContacto`, línea 62-64)**

```ts
  const [planActivoCodigo, setPlanActivoCodigo] = useState<PlanCodigo>(planActivoCodigoSemilla)
  const [renovacionAutomatica, setRenovacionAutomatica] = useState(suscripcionSemilla.renovacionAutomatica)
  const [suscripcionCancelada, setSuscripcionCancelada] = useState(suscripcionSemilla.cancelada)
  const [motivoCancelacion, setMotivoCancelacion] = useState<string | null>(null)
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>(metodosPagoSemilla)
  const [historialPagos] = useState<PagoSuscripcion[]>(historialPagosSemilla)
```

- [ ] **Step 4: Agregar las mutaciones (después de `enviarSolicitudContacto`, antes del `return` del
      provider)**

```ts
  const cambiarPlan = (codigo: PlanCodigo) => {
    setPlanActivoCodigo(codigo)
  }

  const toggleRenovacionAutomatica = () => {
    setRenovacionAutomatica((current) => !current)
  }

  const cancelarSuscripcion = (motivo: string) => {
    setSuscripcionCancelada(true)
    setMotivoCancelacion(motivo.trim() || null)
  }

  const agregarMetodoPago = (nuevo: NuevoMetodoPago): MetodoPago | null => {
    const numeroLimpio = nuevo.numeroTarjeta.replace(/\s+/g, '')
    const expiracionValida =
      Number.isInteger(nuevo.mesExpiracion) &&
      nuevo.mesExpiracion >= 1 &&
      nuevo.mesExpiracion <= 12 &&
      Number.isInteger(nuevo.anioExpiracion)

    if (!/^\d{13,19}$/.test(numeroLimpio) || !expiracionValida) {
      return null
    }

    const metodo: MetodoPago = {
      id: crypto.randomUUID(),
      marca: detectarMarca(numeroLimpio),
      tipo: 'Tarjeta de crédito',
      ultimosCuatro: numeroLimpio.slice(-4),
      mesExpiracion: nuevo.mesExpiracion,
      anioExpiracion: nuevo.anioExpiracion,
      predeterminado: metodosPago.length === 0,
      estado: 'ACTIVO',
    }

    setMetodosPago((current) => [...current, metodo])
    return metodo
  }

  const editarExpiracionMetodoPago = (id: string, mes: number, anio: number) => {
    setMetodosPago((current) =>
      current.map((m) => (m.id === id ? { ...m, mesExpiracion: mes, anioExpiracion: anio } : m)),
    )
  }

  const hacerMetodoPredeterminado = (id: string) => {
    setMetodosPago((current) => current.map((m) => ({ ...m, predeterminado: m.id === id })))
  }

  const eliminarMetodoPago = (id: string): boolean => {
    if (metodosPago.length <= 1) return false

    const eraPredeterminado = metodosPago.find((m) => m.id === id)?.predeterminado ?? false

    setMetodosPago((current) => {
      const restantes = current.filter((m) => m.id !== id)
      if (eraPredeterminado && restantes.length > 0) {
        return restantes.map((m, index) => ({ ...m, predeterminado: index === 0 }))
      }
      return restantes
    })

    return true
  }
```

- [ ] **Step 5: Exponer los campos y mutaciones nuevos en el `value` del provider**

Dentro de `<PortalDataContext.Provider value={{ ... }}>`, después de `enviarSolicitudContacto,`:

```ts
        planActivoCodigo,
        cambiarPlan,
        renovacionAutomatica,
        toggleRenovacionAutomatica,
        suscripcionCancelada,
        motivoCancelacion,
        cancelarSuscripcion,
        metodosPago,
        agregarMetodoPago,
        editarExpiracionMetodoPago,
        hacerMetodoPredeterminado,
        eliminarMetodoPago,
        historialPagos,
```

- [ ] **Step 6: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0, sin errores de tipos en `PortalDataContext.tsx`.

- [ ] **Step 7: Commit**

```bash
git add src/portal/PortalDataContext.tsx
git commit -m "feat: extender PortalDataContext con plan y suscripcion"
```

---

### Task 6: Pantalla Mi plan, ruta y Sidebar dinámico

**Files:**
- Create: `src/portal/plan/PlanScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/portal/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `usePortalData()` de Task 5; `planPorCodigo`, `PREGUNTAS_PLAN` de Task 2; `modulosDelPlan`,
  `estadisticasDeUso` de Task 3; `formatExpiracion` de Task 3; `suscripcionSemilla` de Task 4;
  `formatUSD` de `financiero/formato.ts`; `formatFecha` de `obligaciones/formato.ts`; `listarIndicadores`
  de `financiero/calculo.ts`.
- Produces: `PlanScreen` (montado en `/app/plan`), consumido por Task 7 (botón "Mi plan" de vuelta).

- [ ] **Step 1: Crear `src/portal/plan/PlanScreen.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { listarIndicadores } from '@/portal/financiero/calculo'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { PREGUNTAS_PLAN, planPorCodigo } from './catalogo'
import { estadisticasDeUso, modulosDelPlan } from './calculo'
import { formatExpiracion } from './formato'

const TOTAL_INDICADORES_MVP = listarIndicadores().length

export function PlanScreen() {
  const navigate = useNavigate()
  const {
    planActivoCodigo,
    metodosPago,
    empresaActiva,
    registrosFinancieros,
    simulaciones,
    obligacionesEmpresa,
  } = usePortalData()

  const plan = planPorCodigo(planActivoCodigo)
  const metodoPredeterminado = metodosPago.find((m) => m.predeterminado)
  const modulos = modulosDelPlan(planActivoCodigo)

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const vigentes = registros.filter((r) => r.estado === 'VIGENTE').length
  const obligaciones = obligacionesEmpresa[empresaActiva.id] ?? []
  const cumplidas = obligaciones.filter((o) => o.fechaCumplimiento).length
  const sims = simulaciones[empresaActiva.id] ?? []

  const stats = estadisticasDeUso({
    registrosFinancieros: registros.length,
    indicadoresCalculados: TOTAL_INDICADORES_MVP * vigentes,
    simulacionesRealizadas: sims.length,
    obligacionesCumplidas: cumplidas,
  })

  const campos: { label: string; valor: string }[] = [
    { label: 'Plan activo', valor: plan.nombre },
    { label: 'Estado', valor: 'ACTIVA' },
    {
      label: 'Método de pago',
      valor: metodoPredeterminado ? metodoPredeterminado.tipo : 'Sin método registrado',
    },
    { label: 'Marca', valor: metodoPredeterminado ? metodoPredeterminado.marca : '--' },
    { label: 'Últimos cuatro', valor: metodoPredeterminado ? metodoPredeterminado.ultimosCuatro : '--' },
    {
      label: 'Expiración',
      valor: metodoPredeterminado
        ? formatExpiracion(metodoPredeterminado.mesExpiracion, metodoPredeterminado.anioExpiracion)
        : '--',
    },
    { label: 'Próxima renovación', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Precio', valor: formatUSD(plan.precio) },
    { label: 'Moneda', valor: 'USD' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">Mi plan</h1>
        <p className="mt-1.5 text-sm text-ink-700">
          Tu suscripción es una función de cuenta: se administra igual con o sin empresas registradas.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-emerald-soft px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-emerald-deep">
              Activa
            </span>
            <h2 className="mt-2 text-xl font-bold text-ink-900">{plan.nombre}</h2>
            <p className="mt-1 text-sm font-semibold text-navy-600">{formatUSD(plan.precio)} / mes</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button onClick={() => navigate('/app/plan/suscripcion')}>Administrar suscripción</Button>
            <Button variant="outline" onClick={() => navigate('/app/plan/metodos-pago')}>
              Actualizar tarjeta
            </Button>
            <Button variant="outline" onClick={() => navigate('/app/plan/historial-pagos')}>
              Historial de pagos
            </Button>
          </div>
        </div>
        <dl className="mt-4.5 grid grid-cols-1 gap-3.5 border-t border-line-soft pt-4 sm:grid-cols-3">
          {campos.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1 text-[13.5px] font-medium text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-base font-semibold text-ink-900">Beneficios de tu plan</h2>
          <ul className="mt-3 space-y-2">
            {plan.beneficios.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" aria-hidden="true" />
                {b}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-base font-semibold text-ink-900">Módulos y límites</h2>
          <div className="mt-3 space-y-2">
            {modulos.map((m) => (
              <div key={m.nombre} className="flex items-center justify-between gap-2.5">
                <span className="text-[13px] text-ink-700">{m.nombre}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                    m.incluido ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                  }`}
                >
                  {m.incluido ? 'Incluido' : 'No incluido'}
                </span>
              </div>
            ))}
          </div>
          <dl className="mt-3.5 space-y-2 border-t border-line-soft pt-3.5">
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Empresas</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.empresas}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Simulaciones</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.simulaciones}</dd>
            </div>
            <div className="flex justify-between gap-3 text-[13px]">
              <dt className="text-ink-500">Soporte</dt>
              <dd className="text-right font-semibold text-ink-900">{plan.soporte}</dd>
            </div>
          </dl>
        </section>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-ink-900">Estadísticas de uso</h2>
        <div className="mt-3 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.titulo}
              className="flex min-h-[110px] flex-col gap-2 rounded-xl border border-line bg-card p-4"
            >
              <p className="text-[12.5px] font-semibold leading-tight text-ink-500">{s.titulo}</p>
              <p className="num mt-auto font-display text-3xl font-bold text-ink-900">{s.valor}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <h2 className="border-b border-line-soft px-4.5 py-4 text-base font-semibold text-ink-900">
          Preguntas frecuentes
        </h2>
        <Accordion type="single" collapsible className="px-4.5">
          {PREGUNTAS_PLAN.map((f) => (
            <AccordionItem key={f.pregunta} value={f.pregunta}>
              <AccordionTrigger className="text-left text-sm font-medium text-ink-900">
                {f.pregunta}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-700">{f.respuesta}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Montar la ruta en `src/App.tsx`**

Agregar el import junto a los demás `Screen` del portal (después de la línea 42,
`import { PerfilProfesionalScreen } ...`):

```tsx
import { PlanScreen } from './portal/plan/PlanScreen'
```

Agregar la ruta dentro del bloque `<Route path="/app" ...>`, después de
`<Route path="marketplace/:id" element={<PerfilProfesionalScreen />} />` (línea 196):

```tsx
        <Route path="plan" element={<PlanScreen />} />
```

- [ ] **Step 3: Reescribir `src/portal/components/Sidebar.tsx` para leer el plan activo del contexto**

```tsx
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
```

- [ ] **Step 4: Quitar el export `planInfo`, ya sin consumidores**

En `src/portal/data/mock-portal-data.ts:133-136`, eliminar:

```ts
export const planInfo = {
  nombre: 'Plan Crecimiento',
  renovacion: 'Se renueva el 14 de sep. 2026',
}
```

- [ ] **Step 5: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0, sin errores de tipos ni imports rotos (el export `planInfo` ya no existe en
ningún archivo).

- [ ] **Step 6: Verificación manual en navegador**

Run: `npm run dev`, iniciar sesión y navegar a `/app/plan`.

Expected: se ve la tarjeta de plan activo (Plan Crecimiento, $59/mes, ACTIVA), los 9 campos, beneficios,
módulos y límites, las 4 estadísticas de uso con números reales (no todos en 0 para Textiles Andina
S.A.), y el acordeón de 5 preguntas frecuentes funcionando. El Sidebar muestra "Plan Crecimiento" y "Se
renueva el 10 sep 2026" en vez del mock estático anterior.

- [ ] **Step 7: Commit**

```bash
git add src/portal/plan/PlanScreen.tsx src/App.tsx src/portal/components/Sidebar.tsx src/portal/data/mock-portal-data.ts
git commit -m "feat: agregar pantalla Mi plan y Sidebar dinamico"
```

---

### Task 7: Administrar suscripción y modal Cancelar suscripción

**Files:**
- Create: `src/portal/plan/CancelarSuscripcionModal.tsx`
- Create: `src/portal/plan/AdministrarSuscripcionScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAccessibleDialog` de Task 3; `usePortalData()` de Task 5; `planPorCodigo` de Task 2;
  `suscripcionSemilla` de Task 4; `formatFecha`/`formatUSD`.
- Produces: `AdministrarSuscripcionScreen` (montada en `/app/plan/suscripcion`).

- [ ] **Step 1: Crear `src/portal/plan/CancelarSuscripcionModal.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { useAccessibleDialog } from './useAccessibleDialog'

export function CancelarSuscripcionModal({
  abierto,
  onCerrar,
}: {
  abierto: boolean
  onCerrar: () => void
}) {
  const navigate = useNavigate()
  const { cancelarSuscripcion } = usePortalData()
  const [motivo, setMotivo] = useState('')
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const confirmar = () => {
    cancelarSuscripcion(motivo)
    onCerrar()
    navigate('/app/plan/suscripcion')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancelar-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[440px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="cancelar-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Cancelar suscripción
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          La cancelación detiene la renovación automática. Conservas el acceso hasta el{' '}
          {formatFecha(suscripcionSemilla.proximaRenovacion)}.
        </p>
        <div className="mt-4">
          <label htmlFor="cancelar-motivo" className="text-[13px] font-medium text-ink-700">
            Motivo de la cancelación (opcional)
          </label>
          <Textarea
            id="cancelar-motivo"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Cuéntanos por qué cancelas"
            className="mt-1.5"
            rows={3}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Volver
          </Button>
          <Button className="bg-destructive text-white hover:bg-destructive/90" onClick={confirmar}>
            Confirmar cancelación
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/portal/plan/AdministrarSuscripcionScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import { planPorCodigo } from './catalogo'
import { CancelarSuscripcionModal } from './CancelarSuscripcionModal'

export function AdministrarSuscripcionScreen() {
  const navigate = useNavigate()
  const { planActivoCodigo, renovacionAutomatica, toggleRenovacionAutomatica, suscripcionCancelada } =
    usePortalData()
  const [modalAbierto, setModalAbierto] = useState(false)
  const plan = planPorCodigo(planActivoCodigo)

  const campos: { label: string; valor: string }[] = [
    { label: 'Plan', valor: plan.nombre },
    { label: 'Código', valor: plan.codigo },
    { label: 'Descripción', valor: `Suscripción mensual al ${plan.nombre} de SAFE.` },
    { label: 'Precio', valor: formatUSD(plan.precio) },
    { label: 'Moneda', valor: 'USD' },
    { label: 'Periodo de prueba', valor: 'No aplica' },
    { label: 'Soporte', valor: plan.soporte },
    { label: 'Estado', valor: suscripcionCancelada ? 'CANCELADA' : 'ACTIVA' },
    { label: 'Inicio', valor: formatFecha(suscripcionSemilla.fechaInicio) },
    { label: 'Fin del periodo', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Próxima renovación', valor: formatFecha(suscripcionSemilla.proximaRenovacion) },
    { label: 'Renovación automática', valor: renovacionAutomatica ? 'Activada' : 'Desactivada' },
    { label: 'Cancelación', valor: suscripcionCancelada ? 'Solicitada' : 'Sin solicitudes' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Administrar suscripción</h1>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <dl className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {campos.map((c) => (
            <div key={c.label}>
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1 text-[13.5px] text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4.5 flex flex-wrap gap-2.5 border-t border-line-soft pt-4">
          <Button onClick={() => navigate('/app/plan/cambiar')} disabled={suscripcionCancelada}>
            Cambiar plan
          </Button>
          <Button variant="outline" onClick={toggleRenovacionAutomatica} disabled={suscripcionCancelada}>
            {renovacionAutomatica ? 'Desactivar renovación automática' : 'Activar renovación automática'}
          </Button>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-danger-soft"
            onClick={() => setModalAbierto(true)}
            disabled={suscripcionCancelada}
          >
            Cancelar suscripción
          </Button>
        </div>
        {suscripcionCancelada && (
          <p className="mt-3 text-[13px] text-ink-700">
            Tu suscripción fue cancelada. Conservas el acceso hasta el{' '}
            {formatFecha(suscripcionSemilla.proximaRenovacion)}.
          </p>
        )}
      </section>

      <CancelarSuscripcionModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Montar la ruta en `src/App.tsx`**

Agregar el import junto a `PlanScreen`:

```tsx
import { AdministrarSuscripcionScreen } from './portal/plan/AdministrarSuscripcionScreen'
```

Agregar la ruta después de `<Route path="plan" element={<PlanScreen />} />`:

```tsx
        <Route path="plan/suscripcion" element={<AdministrarSuscripcionScreen />} />
```

- [ ] **Step 4: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Verificación manual en navegador**

Run: `npm run dev`, navegar a `/app/plan/suscripcion` desde "Administrar suscripción" en Mi plan.

Expected: se ven los 13 campos; "Desactivar renovación automática" cambia el label y persiste al volver
a entrar a la pantalla; "Cancelar suscripción" abre el modal, `Escape`/overlay/botón X lo cierran sin
cancelar, y "Confirmar cancelación" cancela, navega de vuelta y deshabilita los tres botones.

- [ ] **Step 6: Commit**

```bash
git add src/portal/plan/CancelarSuscripcionModal.tsx src/portal/plan/AdministrarSuscripcionScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla administrar suscripcion y modal de cancelacion"
```

---

### Task 8: Cambiar plan y modal Cambiar plan

**Files:**
- Create: `src/portal/plan/CambiarPlanModal.tsx`
- Create: `src/portal/plan/CambiarPlanScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAccessibleDialog` de Task 3; `usePortalData()` de Task 5; `PLANES`,
  `COMPARATIVA_PLANES`, `planPorCodigo` de Task 2; `formatUltimosCuatro` de Task 3; `suscripcionSemilla`
  de Task 4.
- Produces: `CambiarPlanScreen` (montada en `/app/plan/cambiar`).

- [ ] **Step 1: Crear `src/portal/plan/CambiarPlanModal.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/mock-portal-data'
import type { PlanCodigo } from '@/portal/types'
import { planPorCodigo } from './catalogo'
import { formatUltimosCuatro } from './formato'
import { useAccessibleDialog } from './useAccessibleDialog'

export function CambiarPlanModal({
  codigo,
  abierto,
  onCerrar,
}: {
  codigo: PlanCodigo
  abierto: boolean
  onCerrar: () => void
}) {
  const navigate = useNavigate()
  const { cambiarPlan, metodosPago } = usePortalData()
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  if (!abierto) return null

  const nuevoPlan = planPorCodigo(codigo)
  const metodoPredeterminado = metodosPago.find((m) => m.predeterminado)

  const confirmar = () => {
    cambiarPlan(codigo)
    onCerrar()
    navigate('/app/plan')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cambiar-plan-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[440px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="cambiar-plan-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            Cambiar a {nuevoPlan.nombre}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-700">
          El nuevo precio será {formatUSD(nuevoPlan.precio)} por mes y se cobrará con tu método
          predeterminado
          {metodoPredeterminado
            ? ` (${formatUltimosCuatro(metodoPredeterminado.marca, metodoPredeterminado.ultimosCuatro)})`
            : ''}{' '}
          en el siguiente ciclo, el {formatFecha(suscripcionSemilla.proximaRenovacion)}.
        </p>
        {!metodoPredeterminado && (
          <p role="alert" className="mt-2 text-[13px] font-semibold text-destructive">
            Agrega un método de pago para cambiar de plan.
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Volver
          </Button>
          <Button onClick={confirmar} disabled={!metodoPredeterminado}>
            Confirmar cambio
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/portal/plan/CambiarPlanScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import type { PlanCodigo } from '@/portal/types'
import { COMPARATIVA_PLANES, PLANES } from './catalogo'
import { CambiarPlanModal } from './CambiarPlanModal'

const COLUMNAS: { key: 'esencial' | 'crecimiento' | 'corporativo'; nombre: string }[] = [
  { key: 'esencial', nombre: 'Esencial' },
  { key: 'crecimiento', nombre: 'Crecimiento' },
  { key: 'corporativo', nombre: 'Corporativo' },
]

export function CambiarPlanScreen() {
  const navigate = useNavigate()
  const { planActivoCodigo } = usePortalData()
  const [planSeleccionado, setPlanSeleccionado] = useState<PlanCodigo | null>(null)

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Cambiar plan</h1>
        <p className="mt-1 text-sm text-ink-700">El cambio se aplica en el siguiente ciclo de facturación.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {PLANES.map((plan) => {
          const esActual = plan.codigo === planActivoCodigo
          return (
            <div
              key={plan.codigo}
              className={`flex flex-col gap-2.5 rounded-xl border bg-card p-4.5 ${
                esActual ? 'border-navy-600' : plan.destacado ? 'border-navy-500' : 'border-line'
              }`}
            >
              {(esActual || plan.destacado) && (
                <span className="w-fit rounded-full bg-navy-100 px-2.5 py-0.5 text-[11px] font-bold text-navy-700">
                  {esActual ? 'Plan actual' : 'Más contratado'}
                </span>
              )}
              <h2 className="text-lg font-bold text-ink-900">{plan.nombre}</h2>
              <p className="font-display text-3xl font-bold text-ink-900">
                {formatUSD(plan.precio)}
                <span className="text-[13px] font-medium text-ink-500"> /mes</span>
              </p>
              <p className="text-[12.5px] text-ink-700">{plan.empresas}</p>
              <p className="text-[12.5px] text-ink-700">{plan.simulaciones}</p>
              <p className="text-[12.5px] text-ink-700">{plan.soporte}</p>
              <ul className="mt-1.5 space-y-1.5">
                {plan.beneficios.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-700">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-brand" aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="mt-auto"
                disabled={esActual}
                onClick={() => setPlanSeleccionado(plan.codigo)}
              >
                {esActual ? 'Plan actual' : `Seleccionar ${plan.nombre}`}
              </Button>
            </div>
          )
        })}
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <h2 className="border-b border-line-soft px-4.5 py-4 text-base font-semibold text-ink-900">
          Comparativa de módulos
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-sm">
            <thead>
              <tr className="bg-surface text-left text-ink-500">
                <th scope="col" className="px-4.5 py-2.5 text-[11px] font-semibold uppercase">
                  Módulo
                </th>
                {COLUMNAS.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase"
                  >
                    {col.nombre}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARATIVA_PLANES.map((fila) => (
                <tr key={fila.modulo} className="border-t border-line-soft">
                  <td className="px-4.5 py-2.5 text-ink-900">{fila.modulo}</td>
                  {COLUMNAS.map((col) => (
                    <td key={col.key} className="px-2 py-2.5 text-center">
                      {fila[col.key] ? (
                        <Check className="mx-auto h-4 w-4 text-navy-600" aria-label="Incluido" />
                      ) : (
                        <Minus className="mx-auto h-4 w-4 text-ink-500/40" aria-label="No incluido" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {planSeleccionado && (
        <CambiarPlanModal codigo={planSeleccionado} abierto onCerrar={() => setPlanSeleccionado(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Montar la ruta en `src/App.tsx`**

Agregar el import junto a `AdministrarSuscripcionScreen`:

```tsx
import { CambiarPlanScreen } from './portal/plan/CambiarPlanScreen'
```

Agregar la ruta después de `<Route path="plan/suscripcion" element={<AdministrarSuscripcionScreen />} />`:

```tsx
        <Route path="plan/cambiar" element={<CambiarPlanScreen />} />
```

- [ ] **Step 4: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Verificación manual en navegador**

Run: `npm run dev`, navegar a `/app/plan/cambiar`.

Expected: 3 tarjetas (Esencial/Crecimiento/Corporativo), la del plan activo (Crecimiento) muestra "Plan
actual" y su botón está deshabilitado; seleccionar Esencial o Corporativo abre el modal con el precio y
método correctos; confirmar actualiza el plan activo, el Sidebar y vuelve a "Mi plan"; la tabla
comparativa muestra 9 filas y hace scroll horizontal en 390px.

- [ ] **Step 6: Commit**

```bash
git add src/portal/plan/CambiarPlanModal.tsx src/portal/plan/CambiarPlanScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla cambiar plan y su modal de confirmacion"
```

---

### Task 9: Métodos de pago y modal Agregar/Editar método

**Files:**
- Create: `src/portal/plan/MetodoPagoModal.tsx`
- Create: `src/portal/plan/MetodosPagoScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAccessibleDialog` de Task 3; `usePortalData()` de Task 5; `parseExpiracion`,
  `validarNuevoMetodo` de Task 3; `formatExpiracion` de Task 3.
- Produces: `MetodosPagoScreen` (montada en `/app/plan/metodos-pago`).

- [ ] **Step 1: Crear `src/portal/plan/MetodoPagoModal.tsx`**

```tsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePortalData } from '@/portal/PortalDataContext'
import type { MetodoPago } from '@/portal/types'
import { parseExpiracion, validarNuevoMetodo } from './calculo'
import { formatExpiracion } from './formato'
import { useAccessibleDialog } from './useAccessibleDialog'

type Props =
  | { modo: 'agregar'; metodo?: undefined; abierto: boolean; onCerrar: () => void }
  | { modo: 'editar'; metodo: MetodoPago; abierto: boolean; onCerrar: () => void }

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  )
}

export function MetodoPagoModal({ modo, metodo, abierto, onCerrar }: Props) {
  const { agregarMetodoPago, editarExpiracionMetodoPago } = usePortalData()
  const { dialogRef, titleRef } = useAccessibleDialog(abierto, onCerrar)

  const [numeroTarjeta, setNumeroTarjeta] = useState('')
  const [expiracion, setExpiracion] = useState(
    modo === 'editar' ? formatExpiracion(metodo.mesExpiracion, metodo.anioExpiracion) : '',
  )
  const [cvc, setCvc] = useState('')
  const [errores, setErrores] = useState<{ numeroTarjeta?: string; expiracion?: string; cvc?: string }>({})

  if (!abierto) return null

  const guardar = () => {
    if (modo === 'editar') {
      const resultado = parseExpiracion(expiracion)
      if (resultado.error || resultado.mes === null || resultado.anio === null) {
        setErrores({ expiracion: resultado.error })
        return
      }
      editarExpiracionMetodoPago(metodo.id, resultado.mes, resultado.anio)
      onCerrar()
      return
    }

    const resultado = validarNuevoMetodo({ numeroTarjeta, expiracion, cvc })
    if (
      Object.keys(resultado.errores).length > 0 ||
      resultado.mesExpiracion === null ||
      resultado.anioExpiracion === null
    ) {
      setErrores(resultado.errores)
      return
    }

    agregarMetodoPago({
      numeroTarjeta,
      mesExpiracion: resultado.mesExpiracion,
      anioExpiracion: resultado.anioExpiracion,
    })
    onCerrar()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={onCerrar}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="metodo-pago-modal-title"
        className="animate-safe-pop-in relative w-full max-w-[420px] rounded-2xl border border-line/70 bg-card p-5 shadow-[var(--shadow-float)]"
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            ref={titleRef}
            id="metodo-pago-modal-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            {modo === 'editar' ? 'Editar expiración de la tarjeta' : 'Agregar método de pago'}
          </h2>
          <button
            type="button"
            onClick={onCerrar}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900"
            aria-label="Cerrar"
          >
            <X className="h-4.5 w-4.5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 space-y-3.5">
          {modo === 'agregar' && (
            <div>
              <Label htmlFor="mp-numero">Número de tarjeta</Label>
              <Input
                id="mp-numero"
                value={numeroTarjeta}
                onChange={(e) => setNumeroTarjeta(e.target.value)}
                placeholder="4111 1111 1111 1111"
                className="mt-1.5"
              />
              <FieldError message={errores.numeroTarjeta} />
            </div>
          )}
          <div>
            <Label htmlFor="mp-expiracion">Expiración</Label>
            <Input
              id="mp-expiracion"
              value={expiracion}
              onChange={(e) => setExpiracion(e.target.value)}
              placeholder="MM/AA"
              className="mt-1.5"
            />
            <FieldError message={errores.expiracion} />
          </div>
          {modo === 'agregar' && (
            <div>
              <Label htmlFor="mp-cvc">CVC</Label>
              <Input
                id="mp-cvc"
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="mt-1.5"
              />
              <FieldError message={errores.cvc} />
            </div>
          )}
        </div>

        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="outline" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button onClick={guardar}>Guardar</Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Crear `src/portal/plan/MetodosPagoScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePortalData } from '@/portal/PortalDataContext'
import type { MetodoPago } from '@/portal/types'
import { formatExpiracion } from './formato'
import { MetodoPagoModal } from './MetodoPagoModal'

export function MetodosPagoScreen() {
  const navigate = useNavigate()
  const { metodosPago, hacerMetodoPredeterminado, eliminarMetodoPago } = usePortalData()
  const [modal, setModal] = useState<{ modo: 'agregar' } | { modo: 'editar'; metodo: MetodoPago } | null>(
    null,
  )
  const [errorEliminar, setErrorEliminar] = useState('')

  const eliminar = (id: string) => {
    const ok = eliminarMetodoPago(id)
    setErrorEliminar(ok ? '' : 'No puedes eliminar tu único método de pago.')
  }

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3.5">
          <h1 className="text-2xl font-bold text-ink-900">Métodos de pago</h1>
          <Button onClick={() => setModal({ modo: 'agregar' })}>Agregar método</Button>
        </div>
      </div>

      {errorEliminar && (
        <p role="alert" className="text-[13px] font-semibold text-destructive">
          {errorEliminar}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        {metodosPago.map((m) => (
          <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="num text-[15px] font-bold text-ink-900">
                {m.marca} ···· {m.ultimosCuatro}
              </strong>
              {m.predeterminado && (
                <span className="rounded-full bg-emerald-soft px-2.5 py-0.5 text-[11px] font-semibold text-emerald-deep">
                  Predeterminado
                </span>
              )}
            </div>
            <p className="text-[12.5px] text-ink-700">
              {m.tipo} · {formatExpiracion(m.mesExpiracion, m.anioExpiracion)} · {m.estado}
            </p>
            <p className="text-[11.5px] text-ink-500">
              Gateway mock SAFE · el token del proveedor nunca se muestra
            </p>
            <div className="mt-1.5 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setModal({ modo: 'editar', metodo: m })}>
                Editar expiración
              </Button>
              {!m.predeterminado && (
                <Button variant="outline" size="sm" onClick={() => hacerMetodoPredeterminado(m.id)}>
                  Hacer predeterminado
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-destructive text-destructive hover:bg-danger-soft"
                onClick={() => eliminar(m.id)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>

      {modal?.modo === 'agregar' && (
        <MetodoPagoModal modo="agregar" abierto onCerrar={() => setModal(null)} />
      )}
      {modal?.modo === 'editar' && (
        <MetodoPagoModal modo="editar" metodo={modal.metodo} abierto onCerrar={() => setModal(null)} />
      )}
    </div>
  )
}
```

- [ ] **Step 3: Montar la ruta en `src/App.tsx`**

Agregar el import junto a `CambiarPlanScreen`:

```tsx
import { MetodosPagoScreen } from './portal/plan/MetodosPagoScreen'
```

Agregar la ruta después de `<Route path="plan/cambiar" element={<CambiarPlanScreen />} />`:

```tsx
        <Route path="plan/metodos-pago" element={<MetodosPagoScreen />} />
```

- [ ] **Step 4: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 5: Verificación manual en navegador**

Run: `npm run dev`, navegar a `/app/plan/metodos-pago`.

Expected: 2 tarjetas (Visa predeterminada, Mastercard); agregar con datos inválidos muestra los 3
errores inline sin cerrar el modal; agregar con datos válidos (ej. `4242 4242 4242 4242`, `05/29`,
`123`) agrega una tercera tarjeta Visa; "Editar expiración" solo pide expiración y la actualiza;
"Hacer predeterminado" cambia cuál tiene el badge; eliminar el predeterminado promueve otro
automáticamente; intentar eliminar cuando solo queda una tarjeta muestra el error y no la elimina.
Nunca se muestra el número completo ni el CVC en la lista.

- [ ] **Step 6: Commit**

```bash
git add src/portal/plan/MetodoPagoModal.tsx src/portal/plan/MetodosPagoScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla metodos de pago y su modal"
```

---

### Task 10: Historial de pagos

**Files:**
- Create: `src/portal/plan/HistorialPagosScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `usePortalData()` de Task 5; `paginarPagos` de Task 3; `formatUSD`/`formatFecha`.
- Produces: `HistorialPagosScreen` (montada en `/app/plan/historial-pagos`).

- [ ] **Step 1: Crear `src/portal/plan/HistorialPagosScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import { paginarPagos } from './calculo'

export function HistorialPagosScreen() {
  const navigate = useNavigate()
  const { historialPagos } = usePortalData()
  const [pagina, setPagina] = useState(1)
  const [abierto, setAbierto] = useState<string | null>(null)

  const { items, totalPaginas, pagina: paginaActual } = paginarPagos({
    pagos: historialPagos,
    paginaSolicitada: pagina,
  })

  return (
    <div className="space-y-5">
      <div>
        <button
          type="button"
          onClick={() => navigate('/app/plan')}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Mi plan
        </button>
        <h1 className="mt-1.5 text-2xl font-bold text-ink-900">Historial de pagos</h1>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-ink-700">Sin pagos registrados.</p>
      ) : (
        <section className="overflow-hidden rounded-xl border border-line bg-card">
          {items.map((pago) => {
            const expandido = abierto === pago.id
            return (
              <div key={pago.id} className="border-b border-line-soft last:border-b-0">
                <button
                  type="button"
                  onClick={() => setAbierto(expandido ? null : pago.id)}
                  aria-expanded={expandido}
                  className="flex min-h-14 w-full flex-wrap items-center gap-3 px-4.5 py-3.5 text-left"
                >
                  <span className="num w-[100px] shrink-0 text-[13.5px] font-semibold text-ink-900">
                    {formatFecha(pago.fecha)}
                  </span>
                  <span className="num text-sm font-bold text-ink-900">{formatUSD(pago.monto)}</span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      pago.estado === 'PAGADO'
                        ? 'bg-emerald-soft text-emerald-deep'
                        : 'bg-danger-soft text-destructive'
                    }`}
                  >
                    {pago.estado}
                  </span>
                  <ChevronDown
                    className={`ml-auto h-4 w-4 text-ink-500 transition-transform ${
                      expandido ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {expandido && (
                  <dl className="grid grid-cols-1 gap-2.5 px-4.5 pb-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Proveedor</dt>
                      <dd className="text-[13px] text-ink-900">{pago.proveedor}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Referencia</dt>
                      <dd className="text-[13px] text-ink-900">{pago.referencia}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Factura</dt>
                      <dd className="text-[13px] text-ink-900">{pago.factura ?? 'Sin factura'}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Plan relacionado</dt>
                      <dd className="text-[13px] text-ink-900">{pago.planNombre}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-[11px] font-semibold uppercase text-ink-500">Mensaje</dt>
                      <dd className="text-[13px] text-ink-900">{pago.mensaje ?? '--'}</dd>
                    </div>
                  </dl>
                )}
              </div>
            )
          })}
        </section>
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPagina(n)}
              aria-current={n === paginaActual ? 'page' : undefined}
              className={`num grid h-9.5 min-w-9.5 place-items-center rounded-lg text-[12.5px] font-semibold ${
                n === paginaActual
                  ? 'bg-navy-600 text-white'
                  : 'border border-line bg-card text-ink-700 hover:bg-surface'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Montar la ruta en `src/App.tsx`**

Agregar el import junto a `MetodosPagoScreen`:

```tsx
import { HistorialPagosScreen } from './portal/plan/HistorialPagosScreen'
```

Agregar la ruta después de `<Route path="plan/metodos-pago" element={<MetodosPagoScreen />} />`, y
reemplazar el catch-all final para incluir el nuevo árbol de rutas (el `<Route path="*" ... />` no
cambia de posición, solo se agrega la ruta nueva antes de él):

```tsx
        <Route path="plan/historial-pagos" element={<HistorialPagosScreen />} />
```

- [ ] **Step 3: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Verificación manual en navegador**

Run: `npm run dev`, navegar a `/app/plan/historial-pagos`.

Expected: 7 pagos, paginados 5 + 2; expandir/colapsar cada fila muestra los 5 campos de detalle; el pago
de mayo tiene badge rojo `RECHAZADO` y mensaje sobre reintento; los demás tienen badge verde `PAGADO`;
cambiar de página actualiza la lista y el botón activo.

- [ ] **Step 5: Commit**

```bash
git add src/portal/plan/HistorialPagosScreen.tsx src/App.tsx
git commit -m "feat: agregar pantalla historial de pagos"
```

---

### Task 11: Verificación integral, accesibilidad y revisión final de Fase 8

**Files:**
- No crea ni modifica archivos nuevos; solo verifica el conjunto de Tasks 1–10.

**Interfaces:**
- Consumes: todas las pantallas, modales y el contexto extendido de Tasks 1–10.
- Produces: confirmación de que Fase 8 cumple el spec
  `docs/superpowers/specs/2026-08-10-portal-privado-fase8-plan-suscripcion-design.md` y queda lista
  para revisión.

- [ ] **Step 1: Recorrido completo en navegador (1440 px)**

Run: `npm run dev`, iniciar sesión como Textiles Andina S.A.

Verificar en orden:
1. Sidebar muestra "Plan Crecimiento" y "Se renueva el 10 sep 2026".
2. `/app/plan`: tarjeta activa, 9 campos, beneficios (5 del Plan Crecimiento), módulos (Simulador y
   Marketplace incluidos, Reportes consolidados no incluido), 4 estadísticas de uso con números > 0,
   acordeón de 5 preguntas.
3. Cambiar a "Comercial del Valle Cía. Ltda." con el `CompanySwitcher` del Topbar: el plan activo en
   `/app/plan` NO cambia (sigue Crecimiento); las 4 estadísticas de uso SÍ cambian (Comercial del Valle
   tiene menos periodos/simulaciones/obligaciones).
4. `/app/plan/suscripcion` → `/app/plan/cambiar` → seleccionar "Plan Corporativo" → confirmar en el
   modal → vuelve a `/app/plan` con "Plan Corporativo" activo y el Sidebar actualizado.
5. Volver a Crecimiento del mismo modo (para dejar la semilla original al terminar la sesión de prueba).
6. `/app/plan/metodos-pago`: agregar, editar, hacer predeterminado, eliminar (incluido el intento
   bloqueado de eliminar el último método).
7. `/app/plan/historial-pagos`: paginación y acordeón de detalle.
8. `/app/plan/suscripcion`: desactivar renovación automática, cancelar suscripción, confirmar que los
   tres botones quedan deshabilitados y aparece el aviso de acceso hasta la fecha de fin.

- [ ] **Step 2: Accesibilidad de los tres modales**

Para `CambiarPlanModal`, `CancelarSuscripcionModal` y `MetodoPagoModal`, verificar cada uno:
- Al abrir, el foco va al título del diálogo.
- `Tab`/`Shift+Tab` no se escapan del diálogo (trampa de foco).
- `Escape` cierra sin aplicar cambios.
- Click en el overlay cierra sin aplicar cambios.
- El scroll de `document.body` está bloqueado mientras el modal está abierto.
- Al cerrar, el foco regresa al elemento que abrió el modal.

- [ ] **Step 3: Responsive manual en 768 px y 390 px**

Verificar que la tabla comparativa de `/app/plan/cambiar` hace scroll horizontal sin romper el layout;
que las tarjetas de plan, métodos de pago y estadísticas de uso pasan a una columna; que los botones de
acción mantienen un alto mínimo de 40–44 px.

- [ ] **Step 4: Verificación final de build**

Run: `npm run build`

Expected: exit code 0, sin advertencias de TypeScript. Confirmar que no se agregó ningún test runner,
ESLint ni dependencia nueva (`git diff main -- package.json`, sin cambios).

- [ ] **Step 5: Revisión de alcance contra el spec**

Confirmar explícitamente, releyendo
`docs/superpowers/specs/2026-08-10-portal-privado-fase8-plan-suscripcion-design.md`:
- Ningún archivo de `src/portal/empresa/`, `financiero/`, `indicadores/`, `obligaciones/`,
  `simulador/` ni `marketplace/` fue modificado (`git diff main --stat` no debe listar rutas dentro de
  esas carpetas).
- `src/lib/plans-data.ts` no fue modificado.
- No se agregó gating por plan en ninguna otra pantalla, ni validación de límites de empresa al cambiar
  de plan, ni cobro mock del Marketplace.

- [ ] **Step 6: Commit final (si Step 1 dejó cambios de estado que requieran ajuste de semilla)**

Si el recorrido manual del Step 1 no dejó ningún archivo modificado (la app solo mutó estado en memoria
de React, que se pierde al recargar), no hay nada que commitear en este paso. Si se detectó y corrigió
algún hallazgo durante la verificación, commitear con:

```bash
git add -A
git commit -m "fix: corregir hallazgos de la revision final de Fase 8 (Plan y suscripcion)"
```

