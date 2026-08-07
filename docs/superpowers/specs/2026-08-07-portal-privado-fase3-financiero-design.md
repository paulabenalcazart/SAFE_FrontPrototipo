# Portal Privado — Fase 3: Financiero

Fecha: 2026-08-07

## Contexto

Las Fases 1 (Shell + Dashboard, ver `docs/superpowers/specs/2026-08-06-portal-privado-fase1-design.md`) y 2
(Mi Empresa, ver `docs/superpowers/specs/2026-08-07-portal-privado-fase2-empresa-design.md`) ya están
implementadas. La Fase 2 dejó explícitamente pendiente "recalcular KPIs/indicadores/obligaciones al editar
datos fiscales", anotando que esa lógica de negocio "llega en las fases de Financiero/Indicadores/Obligaciones".
Esta fase, la primera en construir esa lógica real, implementa el módulo **Financiero** completo.

Roadmap general (heredado del spec de Fase 1): 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ ·
**3. Financiero (esta fase)** · 4. Indicadores · 5. Obligaciones tributarias · 6. Simulador ·
7. Marketplace · 8. Plan y suscripción · 9. Configuración + tutoriales.

Sigue siendo un **prototipo de alta fidelidad, solo frontend** — no hay backend ni API real. A diferencia de
Fases 1-2, esta fase sí calcula números de verdad (ver más abajo) a partir de lo que el usuario ingresa, pero
todo el cálculo ocurre en el navegador sobre datos mock; no hay persistencia en `localStorage` (igual que los
datos de empresa de la Fase 2, vive en memoria de React mientras dura la sesión).

### Fuentes de diseño

- Mockup de alta fidelidad `SAFE Portal Privado.dc.html` (proyecto de Claude Design
  `176601a0-5331-452b-a1ac-dc590a7fa146`), sección "Estados financieros" / "Nueva carga financiera" /
  "Detalle de registro financiero" / "Comparar periodos" (uso exacto de layout, copys y componentes).
- `SAFE_dump.sql` (subido al mismo proyecto de diseño): esquema PostgreSQL real del backend planeado. Esta
  fase usa, en particular:
  - `registro_financiero`: los ~25 campos que se cargan por periodo (activo, pasivo, patrimonio, ingresos,
    costos, gastos, flujo de efectivo).
  - `concepto_financiero` con `bloque_financiero_enum` ('ACTIVO', 'PASIVO', 'PATRIMONIO', 'INGRESO', 'COSTO',
    'GASTO', 'FLUJO_EFECTIVO', 'COMPLEMENTARIO'): agrupa los campos del wizard.
  - `magnitud_derivada` e `indicador` (con sus fórmulas reales, `factor_indicador_enum`:
    LIQUIDEZ/SOLVENCIA/GESTION/RENTABILIDAD) — semillas ya incluidas en el dump con las fórmulas de la
    Superintendencia de Compañías, Valores y Seguros del Ecuador.

### Trabajo en paralelo con Fase 7 (Marketplace)

Dylan implementa esta Fase 3 en la rama `dylan/fase-3-financiero`. En paralelo, Paula implementa la Fase 7
(Marketplace) en `paula/fase-7-marketplace` — se eligió esa fase (y no la 4, 5 o 6) porque es la única de las
restantes sin ningún acoplamiento a `registro_financiero` ni al motor de cálculo de esta fase (tablas
`postulacion_profesional`, `colaborador`, `especialidad_profesional`, `servicio_profesional`,
`solicitud_contacto`, `cita`, `resena_colaborador` — dominio completamente aparte). Ambas ramas parten de
`main` sin dependencias entre sí; el único roce esperado al mergear son las líneas nuevas de `<Route>` en
`src/App.tsx`, resueltas manualmente sin conflicto real. La Fase 4 (Indicadores) sí depende del motor de
cálculo que construye esta fase, así que se planifica después, una vez esta fase esté en `main`.

## Decisiones de arquitectura

### `PortalDataContext` se extiende con `registrosFinancieros`

Seguimos el mismo patrón que la Fase 2 introdujo con `empresaActiva`/`addEmpresa`/`updateEmpresa`: el estado de
periodos financieros vive en el `PortalDataProvider`, indexado por empresa (no solo por la empresa activa),
para que cambiar de empresa en el `CompanySwitcher` muestre los datos correctos sin recargar nada:

```ts
type PortalDataContextValue = {
  // ...lo existente de Fase 1-2
  registrosFinancieros: Record<string, RegistroFinanciero[]> // key = empresa.id
  addRegistroFinanciero: (empresaId: string, registro: RegistroFinanciero) => void
  updateRegistroFinanciero: (empresaId: string, id: string, patch: Partial<RegistroFinanciero>) => void
}
```

**Solo Textiles Andina S.A. (`emp-1`, la empresa activa por defecto) arranca con historial sembrado** (7
registros: 5 `VIGENTE` de meses recientes, 1 `BORRADOR` a medio llenar, 1 `REEMPLAZADO` para poblar el
historial de versiones). Comercial del Valle Cía. Ltda. (`emp-2`) arranca **sin registros** — el mockup ya
contempla un estado vacío explícito (`finVacio`/`finVacioMsg` en la pantalla de listado, "Sin periodos
vigentes para graficar" en el gráfico), así que usamos ese caso real para no inventar un segundo dataset
completo por YAGNI, y de paso probamos el estado vacío del mockup con una empresa real del prototipo.

### Motor de cálculo real (`src/portal/financiero/calculo.ts`)

Esta es la pieza central y nueva de la fase. En vez de un intérprete genérico de fórmulas (sería
sobre-ingeniería para un prototipo frontend), se traducen las fórmulas del SQL directamente a funciones TS
puras y tipadas sobre `RegistroFinanciero`:

- **11 magnitudes derivadas** (`activoCorriente`, `activoNoCorriente`, `activoTotal`, `pasivoCorriente`,
  `pasivoNoCorriente`, `pasivoTotal`, `patrimonio`, `utilidadBruta`, `utilidadOperacional`, `uaii`, `uai`),
  cada una una función `(r: RegistroFinanciero) => number` que replica exactamente la fórmula del dump
  (ej. `activoTotal = activoCorriente(r) + activoNoCorriente(r)`).
- **Catálogo de los 23 indicadores marcados `fase = 'MVP'`** en el dump (2 de Liquidez, 7 de Solvencia, 6 de
  Gestión, 8 de Rentabilidad — se excluyen los 7 marcados `FASE_2` en el propio dump, ej. `SOL_08`
  "Apalancamiento financiero", por ser el propio dato fuente el que los marca como fuera de alcance todavía).
  Cada entrada: `{ codigo, factor, nombre, unidad, formulaTexto, calcular: (r) => number, semaforo: (valor) => 'VERDE'|'AMARILLO'|'ROJO' }`.
  `formulaTexto` guarda la fórmula en notación legible (ej. `"Activo corriente / Pasivo corriente"`) para
  mostrarla como referencia si hace falta; `calcular` es la función real usada en pantalla.
- **Semáforos con umbrales fijos razonables** por indicador (ej. liquidez corriente: verde ≥ 1.5, amarillo
  1.0–1.5, rojo < 1.0), no contra percentiles sectoriales — el dump sí modela eso (`benchmark_indicador`,
  `resultado_indicador.percentil_sectorial`) pero requiere datos de benchmark por industria/tamaño que no
  existen todavía; comparar contra el sector es trabajo natural de la Fase 4 (Indicadores), no de esta.
- **Diagnóstico simple**: 2-3 líneas de texto (estado general, principal fortaleza, principal riesgo)
  derivadas heurísticamente de qué semáforos salieron rojos/verdes — no se modela la tabla completa
  `diagnostico_empresarial`/`detalle_diagnostico` (con `nivel_riesgo`, `prioridad`, `requiere_profesional`,
  etc.), que es más de lo que el mockup de esta fase muestra (`detDiagnostico` es solo una lista `dt`/`dd`).
- **Balance cuadrado**: `Math.abs(activoTotal(r) - (pasivoTotal(r) + patrimonio(r))) < 0.01` (tolerancia de
  1 centavo por redondeo de punto flotante), validado de verdad en el paso de Revisión del wizard — así el
  aviso de descuadre del mockup (`ncCuadreMsg`/`ncCuadreBg`) refleja datos reales, no un mock fijo.

Este módulo no importa nada de React ni de las pantallas — son funciones puras sobre datos, pensadas para que
la Fase 4 las reutilice tal cual (import directo, sin recalcular ni duplicar fórmulas).

### Wizard de 10 pasos mapeado 1:1 a los bloques del dump

El mockup dice "diez pasos". El dump usa `bloque_financiero_enum` (8 valores: ACTIVO, PASIVO, PATRIMONIO,
INGRESO, COSTO, GASTO, FLUJO_EFECTIVO, COMPLEMENTARIO) para clasificar los conceptos financieros extensibles
de `concepto_financiero` — no están literalmente aplicados campo por campo sobre las columnas fijas de
`registro_financiero`, pero la misma categorización aplica conceptualmente a esas columnas (son el mismo
dominio contable) y encaja 1:1 con la estructura de pasos del wizard. El mapeo usado aquí, verificado contra
las condiciones del mockup
(`ncEsPaso1`, `ncTieneCampos`, `ncEsPaso7`, `ncEsRevision`):

| # | Paso | Bloque / contenido | Campos |
|---|---|---|---|
| 1 | Periodo | metadata | `periodo` (input month), `moneda` (USD, solo lectura), `observaciones`; caja de "campos automáticos" (empresa, cluster, tamaño, etapa, versión — solo lectura) |
| 2 | Activo | ACTIVO | efectivo y equivalentes, cuentas por cobrar, inventarios, otros activos corrientes, activo fijo neto, otros activos no corrientes |
| 3 | Pasivo | PASIVO | cuentas por pagar, deuda corto plazo, otros pasivos corrientes, deuda largo plazo, otros pasivos no corrientes |
| 4 | Patrimonio | PATRIMONIO | capital social, resultados acumulados |
| 5 | Ingresos | INGRESO | ingresos operacionales, otros ingresos |
| 6 | Costos | COSTO | costo de ventas |
| 7 | Gastos | GASTO | gastos de administración, gastos de ventas, otros gastos operacionales, gastos financieros, impuesto a la renta — **al completar este paso se muestra "Utilidad neta calculada esperada"** (`ncEsPaso7`), calculada en vivo con el motor de cálculo |
| 8 | Flujo de efectivo | FLUJO_EFECTIVO | flujo de operación, flujo de inversión, flujo de financiamiento |
| 9 | Complementario | COMPLEMENTARIO | compras del periodo, CAPEX, depreciación, número de empleados, costo laboral, gasto en I+D, unidades vendidas |
| 10 | Revisión | — | resumen de todo lo ingresado (`ncRevision`) + mensaje de cuadre de balance (`ncCuadreMsg`) + botón "Finalizar carga" |

Cada paso permite "Guardar borrador" (crea/actualiza el registro con `estado: 'BORRADOR'`) o "Continuar"; el
paso 10 tiene "Finalizar carga" (`estado: 'VIGENTE'`, deshabilitado si el balance no cuadra — mismo patrón que
`ncFinalizarOp` en el mockup).

## Modelo de datos

`src/portal/types.ts` gana:

```ts
export type EstadoRegistroFinanciero = 'BORRADOR' | 'VIGENTE' | 'REEMPLAZADO'

export type RegistroFinanciero = {
  id: string
  periodo: string // ISO, primer día del mes: '2026-07-01'
  version: number
  estado: EstadoRegistroFinanciero
  observaciones?: string
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

export type IndicadorCalculado = {
  codigo: string
  factor: 'LIQUIDEZ' | 'SOLVENCIA' | 'GESTION' | 'RENTABILIDAD'
  nombre: string
  unidad: string
  valor: number
  valorFormateado: string
  semaforo: 'VERDE' | 'AMARILLO' | 'ROJO'
}
```

`utilidad_neta` y `descuadre_balance`/`balance_cuadrado` del dump **no** se guardan como campos — se derivan
siempre con el motor de cálculo a partir de los campos de arriba, para que nunca queden desincronizados.

## Rutas y pantallas

Todas bajo `src/portal/financiero/`, siguiendo la convención de carpeta por módulo que dejó `src/portal/empresa/`.

### 1. Estados financieros (`FinancieroScreen.tsx`, `/app/financiero`)

- 3 KPIs de cabecera (último periodo vigente: ingresos, utilidad neta, capital de trabajo).
- Botones de acción: "Nueva carga financiera" (→ wizard), "Comparar periodos" (deshabilitado con candado si
  hay menos de 2 registros vigentes — reutiliza el patrón `a.bloq`/`a.op` del mockup).
- Tabla de periodos con filtros (año, estado, búsqueda) — columnas periodo, versión, estado, ingresos, gastos,
  utilidad, balance (✓ cuadrado / ⚠ descuadrado), última actualización, acciones (Ver, Comparar, Continuar si
  es borrador).
- Gráfico "Evolución financiera" (líneas: ingresos, gastos, utilidad neta) sobre los últimos 12 periodos
  vigentes — mismo componente visual que `FinancialChart` del Dashboard (Fase 1), reutilizado con los datos
  reales de `registrosFinancieros` en vez de `chartSeries` mock.
- Panel de alertas: descuadres de balance, borradores pendientes, variaciones grandes mes a mes.
- Estado vacío completo (Comercial del Valle): mensaje + solo el botón "Nueva carga financiera" habilitado.

### 2. Nueva carga financiera (`NuevaCargaScreen.tsx`, `/app/financiero/nuevo`, también reentra en
`/app/financiero/:id/editar` para continuar un borrador)

Wizard de 10 pasos descrito arriba. Navegación por los círculos numerados del mockup (clic salta de paso si ya
se completaron los anteriores). Guardar borrador es posible desde cualquier paso.

### 3. Detalle de registro financiero (`DetalleRegistroScreen.tsx`, `/app/financiero/:id`)

- Grupos de solo-lectura por bloque (activo, pasivo, patrimonio, ingresos/costos/gastos, flujo de efectivo,
  complementario) — reutiliza los mismos labels del wizard.
- Tabla "Indicadores calculados": los 23 indicadores MVP con código, nombre, factor, valor, semáforo.
- "Diagnóstico": 2-3 líneas heurísticas.
- "Historial de versiones": otros registros del mismo `periodo` (distintas `version`), con link para ver cada
  una.
- Si `estado === 'BORRADOR'`: botón "Continuar carga" (retoma el wizard en el primer paso incompleto).

### 4. Comparar periodos (`CompararPeriodosScreen.tsx`, `/app/financiero/comparar`)

- 2 selects (Periodo A / Periodo B) sobre los registros `VIGENTE` o `REEMPLAZADO` de la empresa activa; aviso
  si se elige el mismo periodo dos veces.
- KPIs de variación (ingresos, gastos, utilidad neta, activo total) formato "A → B" + diferencia.
- Tabla "Indicadores principales": 4 indicadores headline (liquidez corriente, endeudamiento del activo,
  margen neto, ROE) con valor A, valor B, variación absoluta, variación %, interpretación en texto corto.
- Secciones adicionales por bloque (activo, pasivo, ingresos/gastos) con la misma tabla A/B/variación a nivel
  de concepto, no solo indicador.

## Estilo y componentes

Mismos tokens y utilidades ya establecidos (`surface-card`, colores `navy`/`emerald`/`amber`/`red` de
`src/index.css`), mismos componentes reutilizados de Fase 1-2 donde aplique (`WindowFrame` no aplica aquí — es
del landing público; los componentes de tabla/KPI del portal privado sí, ej. patrón de `KpiCard`).

## Alcance recortado deliberadamente

- **Sin benchmarking sectorial real** (percentiles contra otras empresas del cluster) — umbrales fijos por
  indicador, como se explicó arriba. Se difiere a Fase 4.
- **Sin recalcular obligaciones tributarias** a partir de los nuevos datos financieros (ej. IVA estimado) —
  eso es la Fase 5 (Obligaciones), que además depende de `regla_obligacion`/`parametro_normativo`, fuera de
  esta fase.
- **Sin diagnóstico empresarial completo** (`diagnostico_empresarial`/`detalle_diagnostico` con niveles de
  riesgo, prioridad, recomendación de especialidad) — solo el resumen simple de 2-3 líneas que pide el mockup
  de esta fase.
- **Validación de campos**: solo que los campos requeridos del paso no estén vacíos y sean números no
  negativos (igual que el check `ck_registro_financiero_no_negativos` del dump) antes de avanzar — no se
  replica ninguna otra regla de negocio del backend.
- **Persistencia**: los registros financieros, igual que los datos de empresa de la Fase 2, no se guardan en
  `localStorage` — viven en el estado de React mientras dura la sesión del navegador.
- **Comercial del Valle sin historial propio** — decisión ya explicada arriba (usa el estado vacío del
  mockup en vez de inventar un segundo dataset).

## Testing / verificación

- `npm run dev`, entrar a `/app/financiero`: ver los 5 registros vigentes de Textiles Andina en la tabla,
  filtrar por año/estado/búsqueda, ver el gráfico de evolución con 3 series.
- Cambiar de empresa a Comercial del Valle Cía. Ltda. desde el `CompanySwitcher`: confirmar el estado vacío
  (tabla y gráfico) y que "Comparar periodos" queda deshabilitado con candado.
- Completar el wizard de "Nueva carga financiera" para un periodo nuevo de Textiles Andina de punta a punta:
  confirmar que "Utilidad neta calculada esperada" del paso 7 cambia en vivo al editar gastos, que el paso de
  Revisión muestra el mensaje de cuadre correcto, y que al finalizar el nuevo periodo aparece en la lista.
- Guardar un borrador a medio wizard, volver a "Estados financieros", confirmar que aparece con estado
  Borrador y que "Continuar carga" retoma en el paso correcto.
- Abrir el Detalle de un registro vigente: confirmar que los 23 indicadores se ven con semáforo coherente
  (ej. liquidez corriente ~1.8 en Textiles Andina debería salir verde, consistente con el KPI ya mostrado en
  el Dashboard de Fase 1).
- Ir a "Comparar periodos", elegir dos periodos vigentes distintos: confirmar variaciones correctas; elegir el
  mismo periodo dos veces y confirmar el aviso.

## Fuera de alcance (Fase 3)

- Fase 4 (Indicadores): pantallas dedicadas de resumen/todos los indicadores/comparar indicadores,
  benchmarking sectorial.
- Fase 5 (Obligaciones tributarias): cálculo real de montos de obligaciones a partir de datos financieros.
- Fase 6 (Simulador): proyecciones "qué pasa si" sobre el estado financiero actual.
- Cualquier otra pantalla del roadmap (Marketplace, Plan, Configuración) — Marketplace avanza en paralelo en
  la rama de Paula, sin relación de código con esta fase.
