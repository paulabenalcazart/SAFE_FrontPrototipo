# Portal Privado — Fase 4: Indicadores

Fecha: 2026-08-07

## Contexto

Las Fases 1 (Shell + Dashboard), 2 (Mi Empresa) y 3 (Financiero) ya están implementadas. La Fase 3 introdujo
el primer motor de cálculo real del portal (`src/portal/financiero/calculo.ts`): magnitudes contables y un
catálogo de 23 indicadores financieros (fase `MVP` del dump SQL) con fórmulas reales, calculados en vivo
sobre los registros financieros que el usuario carga. Esa fase dejó dos cosas explícitamente para después:
**benchmarking sectorial** (comparar contra el clúster/industria) y el **puntaje ponderado de salud
financiera** — ambos porque requerían datos (percentiles de benchmark, pesos por factor) que el dump SQL
modela pero no siembra, y porque son el corazón temático de esta fase.

Roadmap general: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · **4. Indicadores (esta
fase)** · 5. Obligaciones tributarias · 6. Simulador · 7. Marketplace (en curso, rama de Paula) · 8. Plan y
suscripción · 9. Configuración + tutoriales.

Sigue siendo un **prototipo de alta fidelidad, solo frontend** — no hay backend ni API real. El motor de
cálculo de Fase 3 (`calculo.ts`) se reutiliza tal cual, sin duplicar fórmulas; esta fase lo extiende con una
nueva función pura de salud financiera en ese mismo módulo, y con un módulo de datos nuevo (`benchmarks.ts`,
en `src/portal/indicadores/`) para los valores de benchmark sectorial — son datos, no lógica, así que viven
aparte del motor de cálculo en vez de mezclarse con él.

### Fuente de diseño

Mismo mockup `SAFE Portal Privado.dc.html` (proyecto de Claude Design `176601a0-5331-452b-a1ac-dc590a7fa146`),
sección `data-screen-label`: "Indicadores" (resumen), "Indicadores principales" (selector de 4), "Todos los
indicadores" (tabla completa) y "Comparar indicadores" (comparación de 2 periodos sobre los 23). Mismo dump
`SAFE_dump.sql`: tablas `benchmark_indicador` (percentiles por indicador/clúster/tamaño) e `indicador.
peso_salud_financiera` inspiraron el diseño de benchmarking y salud financiera de abajo, aunque ninguna de
las dos tenía datos sembrados — los valores concretos son inventados para este prototipo (ver más abajo).

## Decisiones de arquitectura

### Benchmark sectorial: solo la mediana, no la distribución completa

El dump modela `benchmark_indicador` con 5 percentiles (10/25/50/75/90) por indicador/clúster/tamaño de
empresa. El mockup, sin embargo, **solo muestra la mediana** ("mediana del clúster" en el gráfico de
liquidez histórica, columna "Benchmark" en la tabla de todos los indicadores) — ningún elemento de UI
expone p10/p25/p75/p90. Por YAGNI, este prototipo siembra **un solo número (mediana) por cada uno de los 23
indicadores MVP**, para el clúster de Textiles Andina (fabricación de prendas de vestir), en un módulo nuevo
`src/portal/indicadores/benchmarks.ts`. Si una fase futura necesita la distribución completa, se amplía esa
misma tabla sin tocar las pantallas.

Valores de benchmark (mediana sectorial inventada, con la métrica real de Textiles Andina en julio 2026 al
lado como referencia — mezcla deliberada de indicadores donde la empresa está mejor y peor que el sector,
para que Alertas/Recomendaciones tengan contenido real que mostrar):

| Código | Benchmark (mediana) | Textiles Andina jul-26 |
|---|---|---|
| LIQ_01 | 1.6 | 2.03 |
| LIQ_02 | 1.0 | 1.24 |
| SOL_01 | 0.50 | 0.42 |
| SOL_02 | 1.2 | 0.72 |
| SOL_03 | 0.9 | 1.12 |
| SOL_04 | 0.55 | 0.51 |
| SOL_05 | 0.45 | 0.49 |
| SOL_06 | 4.0 | 8.95 |
| SOL_07 | 2.3 | 1.72 |
| GES_01 | 6.0 | 1.81 |
| GES_02 | 0.7 | 0.50 |
| GES_03 | 0.35 | 0.26 |
| GES_04 | 60 | 202.19 |
| GES_06 | 0.30 | 0.228 |
| GES_07 | 0.04 | 0.0197 |
| REN_01 | 0.05 | 0.0365 |
| REN_02 | 0.38 | 0.4274 |
| REN_03 | 0.12 | 0.1764 |
| REN_04 | 0.09 | 0.1401 |
| REN_05 | 0.10 | 0.0788 |
| REN_07 | 0.06 | 0.0459 |
| REN_08 | 0.11 | 0.0626 |
| REN_09 | 0.05 | 0.0365 |

Nota: con estos valores, Gestión (GES_01-04) sale claramente débil frente al sector (rotación de cartera y
periodo de cobranza muy por debajo/encima de la mediana) — es intencional, da contenido real y no forzado a
las Alertas/Recomendaciones de la pantalla de Resumen.

### Salud financiera: puntaje ponderado por factor, no por indicador

El mockup muestra exactamente **4 barras** en "Salud financiera" (`indSaludFactores`), una por factor
(Liquidez/Solvencia/Gestión/Rentabilidad) — no 23 barras por indicador. Aunque el dump modela
`peso_salud_financiera` a nivel de indicador individual, la UI real solo necesita granularidad de factor, así
que `calcularSaludFinanciera()` (nueva función en `calculo.ts`) pondera a ese nivel:

1. Cada indicador aporta un puntaje 0-100 según su semáforo ya calculado: VERDE=100, AMARILLO=55, ROJO=15.
2. El puntaje de un factor es el promedio de sus indicadores.
3. El puntaje general es la suma ponderada de los 4 factores, con pesos fijos:
   **Liquidez 25% · Solvencia 25% · Gestión 20% · Rentabilidad 30%** (rentabilidad pesa un poco más porque
   es el resultado final del negocio; los pesos son una decisión de producto razonable para este prototipo,
   no un valor normativo).
4. Etiqueta según el puntaje, reusando el vocabulario del enum `estado_salud_enum` del dump: **Saludable**
   (≥80) · **Estable** (60-79) · **En riesgo** (40-59) · **Crítico** (<40).

Con los datos semilla de Textiles Andina (julio 2026), esto da Liquidez=100, Solvencia≈74.3, Gestión≈35.8,
Rentabilidad≈71.9 → puntaje general ≈72.3 → **"Estable"**. Esto es independiente del campo estático
`Empresa.diagnostico` ("Saludable") que Fase 1/2 ya mockearon en el Dashboard — igual que Fase 3 no tocó el
Dashboard, esta fase tampoco lo sincroniza; son dos fuentes de "salud" que conviven (una estática de Fase 1,
una real de Fase 4), consistente con el patrón ya establecido de no expandir alcance fuera de la pantalla que
se está construyendo.

### "Indicadores principales" (4 elegidos): nuevo estado en `PortalDataContext`

Igual que `registrosFinancieros` en Fase 3, se agrega `indicadoresPrincipales: Record<empresaId, string[]>`
(array de 4 códigos) + `setIndicadoresPrincipales(empresaId, codigos)`. Semilla para ambas empresas:
`['LIQ_01', 'SOL_01', 'REN_04', 'REN_08']` — los mismos 4 que ya eran "indicadores principales" en el
`CompararPeriodosScreen` de Fase 3, por continuidad. Vive en memoria de React, no en `localStorage` (mismo
patrón que toda la data de negocio del portal).

### Tendencia (flecha vs. periodo anterior)

Tanto el Resumen (variación bajo cada card) como "Todos los indicadores" (columna Tendencia) comparan el
valor de un indicador contra el mismo indicador calculado sobre el periodo `VIGENTE` cronológicamente
anterior de la misma empresa. Es una función local a cada pantalla (mismo patrón que `variacion()` en
`CompararPeriodosScreen` de Fase 3, no un módulo compartido nuevo — el cálculo es de 3 líneas y solo lo usan
estas pantallas), que además usa `mejorSiMayor` (ya expuesto en `IndicadorCalculado` desde el fix de la
revisión final de Fase 3) para decidir si la tendencia es favorable o no.

### Recomendaciones: especialidad sugerida heurística, no el modelo completo de diagnóstico

El dump modela `diagnostico_empresarial`/`detalle_diagnostico` con niveles de riesgo, prioridad y
"especialidad recomendada" por cada hallazgo — mucho más de lo que el mockup de esta fase pide. Esta fase
solo necesita, por cada indicador en ROJO, un texto de alerta + una especialidad sugerida para el botón
"Buscar profesional", vía un mapeo fijo factor→especialidad:

| Factor | Especialidad sugerida |
|---|---|
| LIQUIDEZ | Contador |
| SOLVENCIA | Asesor financiero |
| GESTION | Contador |
| RENTABILIDAD | Asesor financiero |

"Buscar profesional" navega a `/app/marketplace` (la Fase 7 de Paula, en curso en paralelo). Esa ruta no
existe todavía en esta rama; para que navegar ahí no expulse al usuario del portal (el `Outlet` de `/app`
tiene un catch-all que redirige a `/app/dashboard` en vez de dejar caer la navegación al layout público), en
cuanto la rama de Paula se integre, el botón funciona sin tocar código de esta fase.

## Modelo de datos

`src/portal/types.ts` gana:

```ts
export type SaludFinanciera = {
  puntaje: number // 0-100
  etiqueta: 'Saludable' | 'Estable' | 'En riesgo' | 'Crítico'
  factores: { factor: FactorIndicador; puntaje: number; peso: number }[] // 4 entradas
}
```

`IndicadorCalculado` no cambia (ya tiene `mejorSiMayor` desde el fix de Fase 3).

## Rutas y pantallas

Todas bajo `src/portal/indicadores/`, mismo patrón de carpeta por módulo que `financiero/`. La ruta base
`/app/indicadores` ya existe como nav item desde la Fase 1 (`navItems`), solo falta la pantalla.

### 1. Resumen (`IndicadoresScreen.tsx`, `/app/indicadores`)

- Selector de periodo (entre los `VIGENTE`/`REEMPLAZADO` de la empresa activa) — por defecto el más
  reciente vigente.
- 4 cards de "Indicadores principales" (según `indicadoresPrincipales[empresaActiva.id]`): factor, código,
  nombre, valor+unidad, semáforo, variación vs. periodo anterior, descripción corta, botón "Ver detalle"
  (navega a `/app/indicadores/todos` con ese indicador resaltado — para esta fase, simplemente navega a
  "Todos los indicadores"; no hay pantalla de detalle de un solo indicador en el mockup).
  Botón "Cambiar indicadores principales" → `/app/indicadores/principales`.
- Link "Ver todos los indicadores" → `/app/indicadores/todos`.
- Gráfico "Rentabilidad histórica": margen neto (REN_04) y ROE (REN_08), últimos 12 periodos vigentes —
  mismo patrón visual de 2 líneas que ya usan Fase 1/3.
- Gráfico "Liquidez histórica": liquidez corriente (LIQ_01) de la empresa vs. la mediana del clúster
  (línea punteada, valor fijo desde `benchmarks.ts`) — mismo patrón visual, con la línea de benchmark plana.
- "Salud financiera": puntaje + etiqueta + 4 barras de progreso (una por factor, ancho = puntaje del factor).
- "Alertas financieras": una tarjeta por cada indicador en ROJO, con texto + botón a Marketplace filtrado
  por la especialidad sugerida del factor.
- "Recomendaciones": una tarjeta por cada indicador en AMARILLO (hasta 3), texto más suave que las alertas,
  mismo botón a Marketplace.
- Estado vacío (Comercial del Valle, sin registros): mensaje central, sin cards ni gráficos.

### 2. Elegir indicadores principales (`IndicadoresPrincipalesScreen.tsx`, `/app/indicadores/principales`)

- Grid de 4 slots: los seleccionados (con botón de quitar) + slots vacíos si hay menos de 4.
- Grid "Todos los indicadores MVP" (23) con botón "Agregar" — deshabilitado si el indicador ya está
  seleccionado o si los 4 slots están llenos.
- Botón "Guardar" → `setIndicadoresPrincipales(empresaActiva.id, seleccion)`, requiere exactamente 4;
  mensaje de validación si no.

### 3. Todos los indicadores (`TodosIndicadoresScreen.tsx`, `/app/indicadores/todos`)

- Filtros: búsqueda (nombre/código), factor, semáforo.
- 4 tablas agrupadas por factor (Liquidez/Solvencia/Gestión/Rentabilidad), columnas: indicador+código,
  valor, unidad, tendencia, semáforo, benchmark — sin columna de acción "Detalle" (el mockup la tiene, pero
  no hay pantalla de detalle a la que navegar en esta fase; se omite la columna en vez de dejar un botón sin
  destino, ver alcance recortado).
- Sección colapsable "Próximamente": los 7 indicadores `FASE_2` del dump (SOL_08-12, GES_05, REN_06),
  mostrando solo código/nombre/fórmula (texto), sin valor ni semáforo — no se calculan.

### 4. Comparar indicadores (`CompararIndicadoresScreen.tsx`, `/app/indicadores/comparar`)

- Mismo selector de 2 periodos que `CompararPeriodosScreen` de Fase 3 (registros `VIGENTE`/`REEMPLAZADO`).
- Una sola tabla con los 23 indicadores (orden del catálogo, que ya agrupa por factor), columnas: indicador,
  periodo A, periodo B, diferencia (formateada por unidad, mismo helper que el fix de Fase 3), %, tendencia,
  semáforo de B.

## Estilo y componentes

Mismos tokens y convenciones ya establecidos (`border-line/70`, `bg-card`/`bg-surface`, paleta
navy/emerald/amber/destructive). Los dos gráficos nuevos siguen el mismo patrón de SVG + `polyline` que
`EvolucionFinancieraChart` (Fase 3) — cada uno su propio componente, sin extraer una abstracción compartida
nueva (mismo criterio YAGNI que ya se aplicó al no unificar los gráficos de Fase 1 y Fase 3).

## Alcance recortado deliberadamente

- **Sin distribución completa de benchmark** (solo mediana) — ver arriba.
- **Salud financiera ponderada por factor**, no por indicador individual — ver arriba.
- **Sin pantalla de detalle por indicador**: el mockup tiene botones "Ver detalle"/"Detalle" que en un
  producto real llevarían a una vista dedicada por indicador (histórico propio, fórmula explicada, etc.) —
  no existe esa pantalla en el mapa de 26 pantallas original más allá de estos botones, así que se define
  como fuera de alcance; el botón "Ver detalle" de las 4 cards principales navega a "Todos los indicadores"
  (destino razonable), y la columna/acción "Detalle" de "Todos los indicadores" y "Comparar indicadores"
  se omite directamente (no se renderiza) en vez de dejar un botón sin destino.
- **"Buscar profesional" navega a una ruta que aún no existe** (`/app/marketplace`, Fase 7 en curso) — un
  catch-all dentro de `/app` la redirige a `/app/dashboard` sin sacar al usuario del portal, ver arriba.
- **Sin el modelo completo de diagnóstico empresarial** (niveles de riesgo, prioridad, tabla de detalle) —
  solo alertas/recomendaciones heurísticas simples.
- **Sin recalcular obligaciones ni simulaciones** — Fases 5 y 6.
- Sin persistencia en `localStorage`.

## Testing / verificación

- `npm run dev`, entrar a `/app/indicadores` con Textiles Andina: confirmar las 4 cards principales (LIQ_01,
  SOL_01, REN_04, REN_08) con semáforo/valor coherentes con Fase 3, el gráfico de rentabilidad con 2 líneas,
  el de liquidez con la línea de benchmark punteada, salud financiera con puntaje ≈72 ("Estable") y 4 barras,
  y al menos una alerta (Gestión, por los indicadores en rojo) con botón a Marketplace.
- Ir a "Cambiar indicadores principales", cambiar la selección a 4 distintos, guardar, confirmar que el
  Resumen refleja el cambio.
- Ir a "Todos los indicadores": confirmar las 4 tablas por factor (2+7+6+8=23 filas), filtrar por
  búsqueda/factor/semáforo, expandir "Próximamente" y confirmar los 7 indicadores FASE_2 sin valor.
- Ir a "Comparar indicadores", elegir dos periodos vigentes: confirmar la tabla de 23 filas con
  diferencia/tendencia/semáforo correctos.
- Cambiar a Comercial del Valle: confirmar estado vacío en Resumen y que "Comparar indicadores" muestra el
  mismo aviso de "necesitas al menos 2 periodos" que ya usa Fase 3.

## Fuera de alcance (Fase 4)

- Fase 5 (Obligaciones tributarias), Fase 6 (Simulador): sin relación de código con esta fase.
- Fase 7 (Marketplace): el botón "Buscar profesional" apunta ahí, pero la pantalla la construye Paula por
  separado.
- Fase 8 (Plan y suscripción): cualquier bloqueo de indicadores por plan de suscripción.
