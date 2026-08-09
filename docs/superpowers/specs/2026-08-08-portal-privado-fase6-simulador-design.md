# Portal Privado — Fase 6: Simulador

Fecha: 2026-08-08

## Contexto

Las Fases 1 (Shell + Dashboard), 2 (Mi Empresa), 3 (Financiero), 4 (Indicadores) y 5 (Obligaciones
tributarias) ya están implementadas. Esta fase construye el **Simulador**: un wizard de 3 pasos que permite
evaluar un escenario financiero o laboral antes de tomar una decisión, con historial de simulaciones
guardadas y una pantalla de detalle de solo lectura por simulación.

Roadmap general: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · 4. Indicadores ✅ ·
5. Obligaciones tributarias ✅ · **6. Simulador (esta fase)** · 7. Marketplace (en curso, rama de Paula) ·
8. Plan y suscripción · 9. Configuración + tutoriales.

Sigue siendo un **prototipo de alta fidelidad, solo frontend** — no hay backend ni API real.

### Fuente de diseño

Mockup `SAFE Portal Privado.dc.html` (proyecto de Claude Design `176601a0-5331-452b-a1ac-dc590a7fa146`,
inaccesible por MCP en esta cuenta — se trabajó desde una copia local del archivo), secciones
`data-screen-label`: "Simulador" (líneas 1712-1889: selección de escenario, variables, resultado con
gráfico, historial) y "Detalle de simulación" (líneas 1893-1934: variables ingresadas + resultados,
solo lectura). Dump `SAFE_dump.sql` (copia local), tablas `escenario_simulacion`, `variable_escenario`,
`resultado_escenario`, `simulacion`, `entrada_simulacion`, `resultado_simulacion`; enums
`categoria_escenario_enum` (FINANCIERO/TRIBUTARIO/LABORAL/SOCIETARIO), `tipo_variable_escenario_enum`
(NUMERO/PORCENTAJE/MONEDA/FECHA/TEXTO/BOOLEANO), `nivel_riesgo_enum` (BAJO/MEDIO/ALTO/CRITICO). Ninguna
de las tablas de simulación tenía datos sembrados — el catálogo de escenarios de esta fase es inventado
para el prototipo, igual que el catálogo tributario de Fase 5.

## Decisiones de arquitectura

### Alcance: 2 escenarios reales, 2 categorías "Próximamente"

El mockup muestra 4 tarjetas de escenario (`simEscenarios`, `hint-placeholder-count="4"`, una por
categoría del enum), con campos `op` (opacidad) y `badge` que ya contemplan estados deshabilitados. Por
YAGNI, y porque no hay ninguna fórmula tributaria/societaria "qué pasa si" respaldada en otras fases (a
diferencia de laboral/financiero, ver abajo), esta fase implementa **fórmula real solo para LABORAL y
FINANCIERO**:

- **LABORAL — "Contratación de personal"**: es literalmente el escenario que el mockup trae hardcodeado
  como texto de ejemplo en el paso 2 ("Contratación de personal · LABORAL · completa la información
  requerida para tu simulación" — texto estático, no `{{ }}`), no un placeholder genérico.
- **FINANCIERO — "Aumento de ventas"**: reutiliza `utilidadNeta()`/`ingresosOperacionales` ya calculados en
  `financiero/calculo.ts` sobre el último `RegistroFinanciero` `VIGENTE` de la empresa.
- **TRIBUTARIO** y **SOCIETARIO**: tarjetas visibles, deshabilitadas (`opacity` reducida, sin `onClick`),
  badge "Próximamente" — mismo criterio que Fase 5 solo pobló la categoría TRIBUTARIA de las 4 del enum de
  obligaciones, documentando el resto como fuera de alcance.

`resultado_escenario.formula` (columna TEXT pensada para un motor de reglas evaluado por el backend) **no
se implementa como motor dinámico** — cada escenario es una función pura en `simulador/calculo.ts`, mismo
criterio que Fase 5 con `regla_obligacion` (no hay un "motor de reglas" en vivo, sería sobre-ingeniería
para un prototipo con 2 empresas fijas).

### FINANCIERO requiere datos reales — no disponible para Comercial del Valle

`registrosFinancierosSemilla['emp-2'] = []` (decisión ya tomada en Fase 3, no se toca en esta fase). El
escenario FINANCIERO deriva su línea base (`ingresosBase`, `utilidadActualBase`) del último
`RegistroFinanciero` `VIGENTE` de la empresa activa — si no existe ninguno, la tarjeta de ese escenario
aparece deshabilitada con badge "Próximamente" y un motivo distinto al de TRIBUTARIO/SOCIETARIO
("Requiere al menos un registro financiero vigente" vs. "Disponible próximamente"), calculado en runtime
con `estaDisponible(escenario, ctx)`, no como flag estático del catálogo. **LABORAL no tiene esta
restricción** — es autocontenido (ver abajo), disponible para ambas empresas.

### LABORAL es autocontenido — no depende de `RegistroFinanciero`

El baseline mostrado en el paso 2 (`simBaseline`/`simBaselineLabel`) para LABORAL es el número de
empleados actual de la empresa (`empresa.general.numeroEmpleados`), no una cifra financiera — mismo
criterio de independencia entre dominios que ya usó Fase 5 (`obligaciones/calculo.ts` no depende de
`RegistroFinanciero`). Por esto LABORAL está disponible para las dos empresas semilla sin excepción.

### Fórmula LABORAL — tasas reales de Ecuador (con disclaimer)

8 variables (coincide con `hint-placeholder-count="8"` del mockup, que además muestra este escenario como
ejemplo):

| Código | Label | Tipo | Default | Rango |
|---|---|---|---|---|
| `numeroContrataciones` | Número de contrataciones | NUMERO | 1 | 1-50 |
| `salarioMensual` | Salario mensual por persona | MONEDA | 460 | ≥ 460 (SBU) |
| `mesesSimular` | Meses a simular | NUMERO | 12 | 1-24 |
| `costoReclutamiento` | Costo de reclutamiento y capacitación inicial | MONEDA | 300 | ≥ 0 |
| `otrosBeneficios` | Otros beneficios mensuales por persona | MONEDA | 0 | ≥ 0 |
| `incluyeFondosReserva` | Incluye fondos de reserva (aplica solo tras 1 año) | BOOLEANO | false | — |
| `ingresoAdicionalEsperado` | Ingreso adicional mensual esperado por contratación | MONEDA | 0 | ≥ 0 |
| `mesesProductividadPlena` | Meses hasta alcanzar productividad plena | NUMERO | 3 | 1-12 |

```ts
const SBU_REFERENCIA = 460 // valor de referencia, no verificado contra el SBU oficial vigente
const APORTE_PATRONAL_IESS = 0.1115
const FONDOS_RESERVA = 0.0833

costoMensualPorEmpleado =
  salarioMensual * (1 + APORTE_PATRONAL_IESS)
  + salarioMensual / 12                                    // décimo tercero
  + SBU_REFERENCIA / 12                                     // décimo cuarto
  + (incluyeFondosReserva ? salarioMensual * FONDOS_RESERVA : 0)
  + otrosBeneficios

costoDelMes(t) = costoMensualPorEmpleado * numeroContrataciones + (t === 1 ? costoReclutamiento : 0)
rampFactor(t)  = min(t / mesesProductividadPlena, 1)
ingresoDelMes(t) = numeroContrataciones * ingresoAdicionalEsperado * rampFactor(t)
utilidadActualBase = 0   // baseline: no contratar no cuesta ni genera nada adicional
```

4 KPI cards de resultado (`ResultadoSimulacion.cards`):

| # | Título | Valor | Formato |
|---|---|---|---|
| 1 | Costo total del periodo | `costoAcumulado(final)` | USD |
| 2 | Ingreso adicional proyectado | `ingresoAcumulado(final)` | USD |
| 3 | Impacto neto en utilidad | `ingresoAcumulado(final) - costoAcumulado(final)` (puede ser negativo) | USD |
| 4 | Costo mensual por contratación | `costoMensualPorEmpleado` (un mes en régimen estable, no acumulado) | USD |

### Fórmula FINANCIERO — "Aumento de ventas"

7 variables:

| Código | Label | Tipo | Default | Rango |
|---|---|---|---|---|
| `incrementoPct` | % de incremento mensual de ventas | PORCENTAJE | 5 | 0-50 |
| `mesesSimular` | Meses a simular | NUMERO | 12 | 1-24 |
| `inversionInicial` | Inversión inicial en marketing | MONEDA | 500 | ≥ 0 |
| `gastoOperativoAdicional` | Gasto operativo adicional mensual | MONEDA | 0 | ≥ 0 |
| `pctCostoVariable` | % del incremento que genera costo variable adicional | PORCENTAJE | ver nota abajo | 0-100 |

`pctCostoVariable` es la **única** variable cuyo default no viene fijo del catálogo — se calcula al entrar
al paso 2 con `Math.round((ultimoRegistroVigente.costoVentas / ultimoRegistroVigente.ingresosOperacionales) * 100)`
sobre el registro base de la empresa activa (redondeado a entero, clamp 0-100 si el registro tuviera
`ingresosOperacionales` en 0). `SimuladorScreen` la resuelve al construir el draft inicial del paso 2 para
FINANCIERO, en vez de leerla de `VARIABLES_POR_ESCENARIO` como las demás — el catálogo la define sin
`default` (o con `default: 0` como fallback si por algún motivo no hay registro, aunque en la práctica no
ocurre: FINANCIERO ya está deshabilitado sin registro vigente, ver arriba).

```ts
ingresosBase = ultimoRegistroVigente.ingresosOperacionales
utilidadActualBase = utilidadNeta(ultimoRegistroVigente)   // de financiero/calculo.ts

ingresoDelMes(t) = ingresosBase * (incrementoPct / 100) * t        // ramp lineal, no compuesto
costoDelMes(t)   = ingresoDelMes(t) * (pctCostoVariable / 100)
                   + gastoOperativoAdicional
                   + (t === 1 ? inversionInicial : 0)
```

4 KPI cards de resultado (`ResultadoSimulacion.cards`):

| # | Título | Valor | Formato |
|---|---|---|---|
| 1 | Costo total del periodo | `costoAcumulado(final)` | USD |
| 2 | Ingreso adicional proyectado | `ingresoAcumulado(final)` | USD |
| 3 | Impacto neto en utilidad | `ingresoAcumulado(final) - costoAcumulado(final)` (puede ser negativo) | USD |
| 4 | Utilidad proyectada (último mes) | `utilidadProyectada(final)` | USD |

### Series compartidas y riesgo (`simulador/calculo.ts`)

Ambos escenarios producen su serie mensual con el mismo helper genérico, dado `costoDelMes`/`ingresoDelMes`
por mes y `utilidadActualBase`:

```ts
costoAcumulado(t)     = Σ costoDelMes(1..t)
ingresoAcumulado(t)   = Σ ingresoDelMes(1..t)
utilidadActual(t)     = utilidadActualBase                              // tasa plana, no acumulada
utilidadProyectada(t) = utilidadActualBase + ingresoDelMes(t) - costoDelMes(t)   // tasa del mes, no acumulada
```

Nomenclatura coincide con la leyenda del mockup: "Costo **acumulado**" / "Ingreso adicional **acumulado**"
(series acumuladas) vs. "Utilidad actual" / "Utilidad proyectada" (tasas mensuales, sin la palabra
acumulado) — son magnitudes de naturaleza distinta y no deben sumarse entre sí.

Riesgo (heurística simple, documentada como tal — no es un modelo actuarial):

```ts
neto = ingresoAcumulado(final) - costoAcumulado(final)
ratio = ingresoAcumulado(final) === 0 ? Infinity : costoAcumulado(final) / ingresoAcumulado(final)

nivelRiesgo =
  neto < 0
    ? (ratio >= 2 || ingresoAcumulado(final) === 0 ? 'CRITICO' : 'ALTO')
    : (ratio <= 0.6 ? 'BAJO' : 'MEDIO')
```

### Recomendaciones, supuestos y limitaciones — generados por reglas simples, no inventados por IA

`simRecomendaciones` (hasta 3), `simSupuestos` (4) y `simLimitaciones` (3) se generan con reglas
deterministas por escenario + nivel de riesgo (mismo patrón que las alertas de Fase 4/5, if/else sobre
umbrales), no texto libre. Ejemplos:

- Recomendaciones LABORAL: si `nivelRiesgo` es ALTO/CRITICO → "Considera reducir el número de
  contrataciones o extender el periodo de rampa antes de comprometerte."; si BAJO → "El escenario muestra
  margen saludable — puedes proceder con la contratación."; siempre → "Confirma el salario con la tabla
  sectorial del Ministerio de Trabajo antes de decidir."
- Supuestos LABORAL (4, fijos): aporte patronal IESS 11.15%, décimo tercero y décimo cuarto calculados
  mensualmente, SBU de referencia $460 (no verificado), fondos de reserva 8.33% solo si se activa el
  interruptor.
- Limitaciones LABORAL (3, fijos): no considera indemnizaciones por desvinculación, no sustituye asesoría
  laboral profesional, asume salario y beneficios constantes durante todo el periodo simulado.
- Supuestos/limitaciones FINANCIERO análogos, referenciando el registro financiero base usado y aclarando
  que el crecimiento es lineal (no compuesto) y no considera estacionalidad.

## Modelo de datos

`src/portal/types.ts` gana:

```ts
export type CategoriaEscenario = 'FINANCIERO' | 'TRIBUTARIO' | 'LABORAL' | 'SOCIETARIO'
export type TipoVariableEscenario = 'NUMERO' | 'PORCENTAJE' | 'MONEDA' | 'FECHA' | 'TEXTO' | 'BOOLEANO'
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

export type EscenarioSimulacion = {
  codigo: string
  nombre: string
  categoria: CategoriaEscenario
  descripcion: string
  implementado: boolean // false para TRIBUTARIO/SOCIETARIO (sin fórmula en esta fase)
}

export type VariableEscenario = {
  codigo: string
  label: string
  tipoDato: TipoVariableEscenario
  unidad?: string // sufijo visual: '%', 'USD', 'meses', 'personas'
  valorMinimo?: number
  valorMaximo?: number
  hint?: string
  default: number | boolean
}

export type SerieMensualSimulacion = {
  mes: string // 'Mes 1', 'Mes 2', ...
  costoAcumulado: number
  ingresoAcumulado: number
  utilidadActual: number
  utilidadProyectada: number
}

export type ResultadoSimulacion = {
  cards: { titulo: string; valor: number; formato: 'USD' | 'PORCENTAJE'; sub: string }[]
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

`VariableEscenario`/`EscenarioSimulacion` no se modelan como tablas separadas con FK — son catálogos
estáticos en `simulador/catalogo.ts` (mismo patrón que `obligaciones/catalogo.ts`), no hay
`resultado_escenario` como tabla propia: las `cards`/`serie` de `ResultadoSimulacion` las produce
directamente la función de cálculo de cada escenario (igual que `calcularIndicadores()` en Fase 4 no
expone un "catálogo de resultados" separado de `IndicadorCalculado`).

`PortalDataContext` gana:

```ts
simulaciones: Record<string, Simulacion[]> // historial por empresa, más reciente primero
guardarSimulacion: (empresaId: string, sim: Simulacion) => void
```

No hay `actualizarSimulacion`/`eliminarSimulacion` — el detalle es de solo lectura (el mockup lo dice
explícitamente: "Ejecutada el … · solo lectura"). "Ejecutar simulación" (paso 2 → 3) guarda automáticamente
la entrada en el historial — no hay un botón "Guardar" separado en el mockup.

## Rutas y pantallas

Todas bajo `src/portal/simulador/`. La ruta base `/app/simulador` ya existe como nav item desde la Fase 1
(`navItems`), solo falta la pantalla.

### 1. Simulador (`SimuladorScreen.tsx`, `/app/simulador`)

Wizard de 3 pasos con estado local (`useState<1|2|3>`), mismo patrón de stepper clicable que
`NuevaCargaScreen` (`irAPaso` deshabilitado más allá de `maxStepReached`). El bloque "Historial de
simulaciones" se renderiza **siempre**, debajo del paso activo (en el mockup vive fuera de los `sc-if` de
paso — visible en los 3 pasos).

- **Paso 1 — Escenario**: grid de 4 tarjetas (`simEscenarios`), una por `EscenarioSimulacion`. Para
  LABORAL y FINANCIERO-si-disponible: tarjeta interactiva, botón "Simular este escenario" → paso 2 con
  `escenarioCodigo` fijado y `entradas` reseteadas a los defaults del catálogo. Para TRIBUTARIO/SOCIETARIO
  y para FINANCIERO-sin-registro-vigente: tarjeta con `opacity` reducida, sin `onClick`, badge
  "Próximamente" (texto del badge distingue el motivo: "Próximamente" vs. "Requiere registro financiero").
- **Paso 2 — Variables**: caja de baseline arriba (`simBaselineLabel`/`simBaseline`, texto y valor según
  escenario — headcount para LABORAL, "Ingresos mensuales base" para FINANCIERO), grid de inputs según
  `VARIABLES_POR_ESCENARIO[escenarioCodigo]` (number/checkbox según `tipoDato`, con `min`/`max`/hint).
  Botones: "Atrás" (→ paso 1, resetea selección), "Ejecutar simulación" (calcula `ResultadoSimulacion` con
  la función del escenario, arma un `Simulacion` con `id: crypto.randomUUID()`, `fecha: HOY_SIMULADOR`,
  llama `guardarSimulacion`, pasa a paso 3). No se implementa el botón "bloqueado"/tour
  (`simEjecutarBloqueo`, `simEjecutarTour`) — su `hint-placeholder-val` es `false` (oculto por defecto en
  el mockup) y no hay ninguna regla de plan/suscripción implementada aún (Fase 8) que lo active; se deja
  fuera de alcance, mismo criterio que otros estados condicionalmente ocultos por defecto que fases
  anteriores no implementaron sin respaldo (ej. `NO_APLICA` en Fase 5).
- **Paso 3 — Resultado**: 4 `simCards` (KPIs), gráfico `SimulacionChart` (4 polylines: costo acumulado
  rojo, ingreso acumulado esmeralda, utilidad actual gris punteado, utilidad proyectada navy punteado —
  mismo patrón SVG que `EvolucionFinancieraChart`), badge de riesgo + texto, "Recomendaciones",
  "Supuestos del escenario", "Limitaciones". Botones: "Regresar al Simulador" (→ paso 2, mantiene
  `entradas` para ajustar y re-ejecutar), "Exportar PDF" (`window.print()` — sin librería nueva, mismo
  criterio "barato y real" que Fase 5 usó para recordatorios). "Nueva simulación" en el header superior
  (solo visible en paso 3) reinicia todo a paso 1.
- **Historial de simulaciones**: lista de `simulaciones[empresaActiva.id]`, más reciente primero, cada
  fila con nombre del escenario (`catalogo.nombre`), fecha (`formatFecha` de `obligaciones/formato.ts`,
  reusado), empresa, badge de riesgo, botones "Ver detalle" (→ `/app/simulador/:id`) y "Exportar PDF".
  Estado vacío (`simHistorialVacio`) si la empresa activa no tiene ninguna simulación guardada.

### 2. Detalle de simulación (`DetalleSimulacionScreen.tsx`, `/app/simulador/:id`)

- Header: botón volver, título (`catalogo.nombre` del escenario), badge de riesgo, "Ejecutada el
  {fecha} · solo lectura".
- Dos columnas: "Variables ingresadas" (`dt`/`dd` de `simulacion.entradas`, formateadas según
  `tipoDato` — MONEDA con `formatUSD`, PORCENTAJE con `%`, BOOLEANO como "Sí"/"No") y "Resultados"
  (`dt`/`dd` de `simulacion.resultado.cards`). Botones "Exportar PDF" y "Regresar al Simulador" (→
  `/app/simulador`).
- Simulación no encontrada → mensaje + botón volver, mismo patrón que `DetalleObligacionScreen`.

### 3. Dashboard — sin cambios

El Dashboard de Fase 1 no referencia Simulador en ningún KPI/tabla existente — no hay enlace que conectar
(a diferencia de Fase 5, que conectó "Ver todas" de Obligaciones). Sin cambios en esta fase.

## Semilla de datos

`src/portal/data/mock-portal-data.ts` gana `simulacionesSemilla: Record<string, Simulacion[]>`,
construida llamando directamente a las funciones de `simulador/calculo.ts` con entradas de ejemplo (no
números tipeados a mano) — mismo criterio que `DIA_TEXTILES_ANDINA` se computa con la fórmula real en vez
de hardcodearse:

- **Textiles Andina**: 3 simulaciones — 2 LABORAL (una con resultado BAJO riesgo, una con ALTO/CRITICO
  para mostrar variedad de badges) + 1 FINANCIERO.
- **Comercial del Valle**: 1 simulación LABORAL (es el único escenario disponible para esta empresa).

`HOY_SIMULADOR = '2026-08-13'` (misma fecha ficticia que `HOY_OBLIGACIONES`, para continuidad narrativa),
usada como `fecha` de las simulaciones sembradas (con offsets de días hacia atrás para que el historial
no muestre todas el mismo día) y como `fecha` por defecto al ejecutar una nueva simulación en vivo.

## Estilo y componentes

Mismos tokens ya establecidos (`border-line/70`, `bg-card`/`bg-surface`, `min-h-11` + `text-sm` para
botones secundarios, `min-h-8.5` + `text-[12px]` para botones pequeños). `NivelRiesgo` usa su propio mapa
de color en `simulador/estilo.ts` (`NIVEL_RIESGO_BADGE`, `NIVEL_RIESGO_LABEL`) — no reutiliza `Tono`
porque el dominio (4 niveles: BAJO/MEDIO/ALTO/CRITICO) no mapea 1:1 a los 4 valores de `Tono`
(positivo/atencion/critico/neutro); se define: BAJO→emerald, MEDIO→amber, ALTO→red/destructive,
CRITICO→red oscuro con borde (variante más intensa, mismo criterio de "un color más para el nivel más
grave" que otras fases no necesitaron pero el enum de 4 niveles sí exige). `SimulacionChart.tsx` reutiliza
el patrón SVG de `EvolucionFinancieraChart.tsx` (viewBox fijo, `polyline` con `vector-effect:non-scaling-stroke`,
ticks Y en `[max, max/2, 0]`).

## Alcance recortado deliberadamente

- **Solo 2 escenarios con fórmula real** (LABORAL "Contratación de personal", FINANCIERO "Aumento de
  ventas") — TRIBUTARIO y SOCIETARIO quedan como tarjetas "Próximamente" sin fórmula.
- **FINANCIERO no disponible para Comercial del Valle** — requiere un `RegistroFinanciero` `VIGENTE`, que
  esa empresa no tiene (decisión ya tomada en Fase 3, no se modifica aquí).
- **Sin motor de reglas dinámico**: `resultado_escenario.formula` (TEXT) no se evalúa en runtime — cada
  escenario es una función pura hardcodeada.
- **Sin botón de "bloqueo por plan"** (`simEjecutarBloqueo`/`simEjecutarTour`) — oculto por defecto en el
  mockup, sin ninguna regla de Fase 8 (Plan y suscripción) implementada aún que lo active.
- **"Exportar PDF" usa `window.print()`** — no genera un PDF real ni agrega una librería nueva.
- **Crecimiento lineal, no compuesto** en ambos escenarios — simplificación explícita, documentada como
  limitación visible en la propia pantalla de resultado.
- **SBU de referencia ($460) y tasas de IESS no verificadas contra la normativa vigente al momento de
  usar el prototipo** — mismo disclaimer epistémico que los benchmarks sectoriales de Fase 4 y el
  catálogo tributario de Fase 5.
- **Sin recálculo del Dashboard** — el Dashboard de Fase 1 no tiene ningún enlace a Simulador, no se
  toca.

## Testing / verificación

- `npm run dev`, entrar a `/app/simulador` con Textiles Andina: confirmar 4 tarjetas en paso 1 (LABORAL y
  FINANCIERO clicables, TRIBUTARIO/SOCIETARIO deshabilitadas con badge "Próximamente"), completar paso 2
  de LABORAL con los defaults, ejecutar, confirmar las 4 KPI cards, el gráfico con 4 líneas, el badge de
  riesgo coherente con la fórmula, y que la simulación aparece en "Historial de simulaciones".
  Verificar lo mismo para FINANCIERO.
- Cambiar a Comercial del Valle: confirmar que la tarjeta FINANCIERO aparece deshabilitada con el motivo
  "Requiere registro financiero vigente" (distinto del texto de TRIBUTARIO/SOCIETARIO), y que LABORAL
  sigue disponible y funcional.
- Click en "Ver detalle" de una fila del historial → `/app/simulador/:id`: confirmar variables ingresadas
  y resultados coinciden con lo ejecutado, sin controles editables.
- "Regresar al Simulador" desde el resultado: confirmar que vuelve al paso 2 con las mismas variables
  (no las resetea). "Nueva simulación": confirmar que reinicia a paso 1.
- `npm run build` sin errores de TypeScript.

## Fuera de alcance (Fase 6)

- Fase 8 (Plan y suscripción), Fase 9 (Configuración): sin relación de código con esta fase — el gating
  por plan del botón "Ejecutar simulación" queda documentado como pendiente si Fase 8 lo requiere.
- Fase 7 (Marketplace): sin ningún enlace desde Simulador en el mockup, no aplica el patrón catch-all que
  sí usaron Fase 4/5.
- Escenarios TRIBUTARIO y SOCIETARIO: el enum los define, esta fase no los puebla con fórmula real.
