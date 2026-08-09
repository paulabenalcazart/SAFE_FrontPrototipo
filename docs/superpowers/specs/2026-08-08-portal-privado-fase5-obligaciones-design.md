# Portal Privado — Fase 5: Obligaciones tributarias

Fecha: 2026-08-08

## Contexto

Las Fases 1 (Shell + Dashboard), 2 (Mi Empresa), 3 (Financiero) y 4 (Indicadores) ya están implementadas.
Esta fase construye el módulo de **obligaciones tributarias**: un calendario/lista de vencimientos generado
según el tipo de contribuyente de la empresa y el noveno dígito de su RUC, más una pantalla de detalle por
obligación con acciones (marcar como cumplida, configurar recordatorio).

Roadmap general: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · 4. Indicadores ✅ ·
**5. Obligaciones tributarias (esta fase)** · 6. Simulador · 7. Marketplace (en curso, rama de Paula) ·
8. Plan y suscripción · 9. Configuración + tutoriales.

Sigue siendo un **prototipo de alta fidelidad, solo frontend** — no hay backend ni API real. Introduce su
propio módulo de cálculo puro (`src/portal/obligaciones/calculo.ts`), independiente del motor de Financiero/
Indicadores (`financiero/calculo.ts`) porque el dominio no comparte datos con él — ni un solo campo de
`RegistroFinanciero` participa en generar o evaluar una obligación tributaria.

### Fuente de diseño

Mismo mockup `SAFE Portal Privado.dc.html` (proyecto de Claude Design `176601a0-5331-452b-a1ac-dc590a7fa146`),
secciones `data-screen-label`: "Obligaciones tributarias" (calendario/lista + KPIs + prioridad + acciones +
alertas) y "Detalle de obligación" (grupos de campos + acciones). Dump `SAFE_dump.sql`: tablas `obligacion`
(catálogo), `regla_obligacion` (reglas de generación por tipo de contribuyente/noveno dígito) y
`obligacion_empresa` (instancia por empresa/periodo, con su enum de estado `PENDIENTE/PROXIMA/VENCIDA/
CUMPLIDA/NO_APLICA` — se reutiliza literal). Ninguna de las dos tablas tenía datos sembrados — el catálogo y
las reglas de esta fase son inventados para el prototipo, aunque las fechas resultantes siguen la fórmula
real del SRI (ver abajo).

## Decisiones de arquitectura

### Alcance: solo categoría TRIBUTARIA

El dump modela `categoria_obligacion_enum` con 4 valores (`TRIBUTARIA`, `LABORAL`, `SOCIETARIA`,
`MUNICIPAL`), pero el título de la pantalla ("Obligaciones tributarias") y su subtítulo ("generado según tu
tipo de contribuyente y el noveno dígito del RUC") apuntan exclusivamente al mecanismo del SRI. Por YAGNI y
para no inventar reglas laborales/municipales sin respaldo en el mockup, el catálogo de esta fase **solo
incluye TRIBUTARIA**. El campo `categoria` en los tipos queda tipado con las 4 opciones del enum (fidelidad
al dump), pero el catálogo estático nunca puebla las otras 3 — igual criterio que Fase 4 tipó `unidad` con 4
opciones aunque el catálogo de indicadores solo usara algunas por indicador.

### Catálogo de obligaciones (`src/portal/obligaciones/catalogo.ts`)

5 entradas estáticas, todas `categoria: 'TRIBUTARIA'`, institución `SRI`:

| Código | Nombre | Formulario | Periodicidad | Usa noveno dígito | Permite monto estimado |
|---|---|---|---|---|---|
| `IVA_MENSUAL` | Declaración de IVA | Formulario 104 | MENSUAL | Sí | Sí |
| `RET_FUENTE_MENSUAL` | Retención en la fuente del Impuesto a la Renta | Formulario 103 | MENSUAL | Sí | Sí |
| `IR_SOCIEDADES` | Impuesto a la Renta — Sociedades | Formulario 101 | ANUAL | Sí | Sí |
| `ANTICIPO_IR` | Anticipo Impuesto a la Renta | Débito automático SRI | SEMESTRAL | Sí | Sí |
| `CUOTA_RIMPE` | Cuota RIMPE Negocio Popular | Pago cuota RIMPE | SEMESTRAL | No | Sí |

`ANTICIPO_IR` se etiqueta `SEMESTRAL` como aproximación del enum a "dos cuotas al año" (jul/sep), aunque en
la realidad no están espaciadas 6 meses — es la opción más cercana del enum de 6 valores, no hay un valor
"bianual con cuotas custom"; se documenta aquí para que quien lea el código no asuma literalidad semestral.

### Fórmula del noveno dígito (real, tabla del SRI)

Función pura `diaPorNovenoDigito(digito: number): number` en `obligaciones/calculo.ts`, con la tabla oficial
de vencimientos mensuales del SRI:

| Noveno dígito | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 |
|---|---|---|---|---|---|---|---|---|---|---|
| Día límite | 10 | 12 | 14 | 16 | 18 | 20 | 22 | 24 | 26 | 28 |

`novenoDigito(ruc: string): number` extrae el dígito 9 del RUC (índice 8, 0-based). Esta tabla se aplica a:
- **IVA / Retención**: día calculado, mes siguiente al periodo declarado.
- **IR Sociedades**: día calculado, abril del año siguiente al ejercicio fiscal.
- **Anticipo IR**: día calculado, aplicado en julio (1ra cuota) y septiembre (2da cuota) del año fiscal.

`CUOTA_RIMPE` **no** usa el noveno dígito (fecha fija aproximada) — el régimen RIMPE Negocio Popular paga una
cuota fija por semestre, no escalonada por RUC; los valores exactos de fecha/monto son inventados para este
prototipo y no están verificados contra la normativa vigente (mismo disclaimer epistémico que los benchmarks
sectoriales de Fase 4).

### Catálogo por empresa: Textiles Andina completo, Comercial del Valle reducido

- **Textiles Andina S.A.** (RUC `1792146739001`, noveno dígito = `3` → día **14**, Régimen General,
  obligada a contabilidad, agente de retención — perfil fiscal ya definido en Fase 1/2): recibe **todo** el
  catálogo tributario general — 12 periodos de IVA + 12 de Retención (todo el año 2026) + 1 Impuesto a la
  Renta (ejercicio 2025, vence abril 2026) + 2 cuotas de Anticipo IR (2026) = **27 obligaciones**.
- **Comercial del Valle Cía. Ltda.** (RIMPE Negocio Popular, no obligada a contabilidad, no agente de
  retención — perfil fiscal ya definido en Fase 1/2): en el régimen real, RIMPE Negocio Popular no declara
  IVA/Renta mensual — paga una cuota fija. Por fidelidad a ese perfil ya establecido, recibe **solo 2
  `CUOTA_RIMPE`** (una por semestre de 2026) en vez del catálogo completo. Esto reemplaza el "estado vacío"
  que otras fases usaron para esta empresa (Fase 3/4 la dejaron sin registros/indicadores) por un catálogo
  real y distinto — las obligaciones tributarias no dependen de tener registros financieros cargados.

### "Hoy" de la ficción: 13 de agosto de 2026

Constante fija `HOY = '2026-08-13'` en `obligaciones/calculo.ts`, usada para: derivar `estado`, decidir el
mes por defecto del calendario (agosto 2026) y ordenar "Atención prioritaria". Se eligió esa fecha (no la
fecha real de esta sesión) por continuidad narrativa con el KPI ya hardcodeado del Dashboard de Fase 1
("Próximo vencimiento 18 ago · 5 días", que implica un "hoy" ficticio de 13 ago) — mismo criterio que Fase 4
usó con el `diagnostico` estático: **dos fuentes de fecha conviven sin sincronizarse**, esta fase no reescribe
el mock del Dashboard.

Con `HOY = 2026-08-13`, el periodo de julio de IVA/Retención de Textiles Andina (fecha límite 14 ago 2026,
noveno dígito 3) queda a **1 día** — estado PRÓXIMA, la obligación más urgente del catálogo. La 1ra cuota de
Anticipo IR (fecha límite 14 jul 2026) se deja **deliberadamente sin marcar cumplida** → estado VENCIDA,
haciendo eco (sin sincronizar código) del mock estático del Dashboard de Fase 1, que ya dice "Anticipo
Impuesto a la Renta … Vencido".

**Todas las demás obligaciones sembradas con `fechaLimite` anterior a `HOY`** (los periodos de enero a junio
de IVA/Retención, y el Impuesto a la Renta 2025) se siembran **con `fechaCumplimiento` fijada** — es decir,
`CUMPLIDA` — porque una pyme que ya lleva 8 meses en el portal y no tiene ninguna otra señal de mora no
tendría 14 obligaciones vencidas simultáneas; la única vencida deliberada es la señalada arriba. Los periodos
con `fechaLimite` posterior a `HOY` (agosto en adelante) no llevan `fechaCumplimiento` — se derivan como
PROXIMA o PENDIENTE según la regla de 15 días, nunca se marcan cumplidas de antemano (no tendría sentido:
aún no vencen).

### Montos estimados: cifras fijas para julio, variación simple para el resto

`montoEstimado` es un valor inventado (no hay fórmula real que lo derive de datos financieros en esta fase —
eso requeriría acoplar `RegistroFinanciero`, fuera de alcance, ver arriba). Para los periodos de **julio**
de IVA (`$1.240`), Retención (`$310`), el Impuesto a la Renta 2025 (`$4.850`) y la 1ra cuota de Anticipo IR
(`$960`), se reutilizan **las mismas cifras** que ya aparecen en el mock estático del Dashboard de Fase 1
(`kpis`/`obligaciones` en `mock-portal-data.ts`) — una coincidencia narrativa deliberada, no una sincronización
de código (son literales nuevos en la semilla de esta fase, no una referencia al array del Dashboard). Para
el resto de los 11 periodos de IVA y 11 de Retención, y la 2da cuota de Anticipo IR, se aplica una variación
simple determinística (±10-15% sobre la cifra de julio, con signo alternado por mes) — mismo criterio de
"variación con factores" que ya usó `construirCampos()` en la semilla de `RegistroFinanciero` de Fase 3, sin
pretender precisión contable real. `CUOTA_RIMPE` usa una cifra fija inventada (ej. `$60`, monto típico de
cuota RIMPE para un negocio popular pequeño) igual en ambas ocurrencias. `baseCalculo` **no se puebla** en
esta fase (queda `undefined` en toda la semilla) — el campo existe en el tipo por fidelidad al dump
(`obligacion_empresa.base_calculo`), pero no hay ningún dato base real del que derivarlo sin acoplar
Financiero; la pantalla de detalle debe mostrar "—" cuando esté ausente, mismo patrón que otros campos
opcionales ya usan en `DetalleRegistroScreen`.

### Estado derivado, no almacenado

`obligacion_empresa.estado` en el dump es una columna; aquí se modela como **función pura**
`estadoObligacion(o: ObligacionEmpresa, hoy: string): EstadoObligacion` en `obligaciones/calculo.ts` — mismo
patrón que `calcularIndicadores`/`calcularSaludFinanciera` de Fase 3/4 (derivar en vez de guardar):

1. Si `o.fechaCumplimiento` está presente → `CUMPLIDA`.
2. Si no, y `o.fechaLimite < hoy` → `VENCIDA`.
3. Si no, y `o.fechaLimite - hoy ≤ 15 días` → `PROXIMA`.
4. Si no → `PENDIENTE`.

`NO_APLICA` (quinto valor del enum) no lo produce esta función — no hay ninguna regla en el catálogo de esta
fase que derive en "no aplica" para las dos empresas semilla; el tipo lo incluye por fidelidad al enum del
dump, pero el mapa de color/leyenda lo soporta por si una fase futura lo necesita (ver Estilo abajo).

### Solo dos mutaciones reales: marcar cumplida y recordatorio

Igual que el resto del portal (`updateEmpresa`, `updateRegistroFinanciero`), `PortalDataContext` gana:

```ts
marcarObligacionCumplida(empresaId: string, id: string): void // fija fechaCumplimiento = HOY
toggleRecordatorioObligacion(empresaId: string, id: string): void // invierte recordatorioActivo
```

No hay una pantalla real de "configuración de recordatorios" (canal, antelación, etc.) — el mockup solo
muestra un botón "Configurar recordatorio" en el detalle, sin una pantalla dedicada en el mapa de 26
pantallas. Se implementa como un toggle real sobre `recordatorioActivo` (el botón cambia de "Configurar
recordatorio" a "Recordatorio activado" y viceversa) — interactividad real sin inventar un subsistema de
notificaciones que el mockup no pide.

### Color de estado propio del módulo, no el `Tono` compartido

El resto del portal usa `Tono` (`positivo`→emerald, `atencion`→amber, `critico`→destructive, `neutro`→gris,
ver `tone.ts`). La leyenda del calendario en el mockup, sin embargo, pinta **"Cumplida" en navy** (no
emerald) — `var(--sf-navy-100)`/`var(--sf-navy-600)`, junto a Próxima=amber, Vencida=red, Pendiente/No
aplica=gris con borde. Por fidelidad exacta al mockup (no es un accidente de placeholder — el HTML fija esos
4 colores literales, no variables `{{ }}`), esta fase define su propio mapa
`ESTADO_OBLIGACION_STYLE: Record<EstadoObligacion, { bg: string; fg: string }>` en vez de reusar
`TONE_BADGE_CLASSES`, y lo usa consistentemente en calendario, lista, prioridad y alertas de este módulo:

| Estado | Color |
|---|---|
| CUMPLIDA | navy (`bg-navy-100` / `text-navy-700`) |
| PROXIMA | amber (`bg-amber-soft` / `text-amber-deep`) |
| VENCIDA | destructive (`bg-danger-soft` / `text-destructive`) |
| PENDIENTE | gris neutro (`bg-surface` / `text-ink-700`) |
| NO_APLICA | gris neutro con borde punteado (`bg-surface` / `text-ink-500`) |

## Modelo de datos

`src/portal/types.ts` gana:

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
  periodo: string // ISO, primer día de mes (mismo criterio que RegistroFinanciero.periodo); anual/semestral usa el mes representativo del ejercicio/cuota
  fechaLimite: string // ISO 'YYYY-MM-DD'
  baseCalculo?: number
  montoEstimado?: number
  fechaCumplimiento?: string // ISO 'YYYY-MM-DD'; presencia = fue marcada cumplida
  recordatorioActivo: boolean
  notas?: string
}
```

`Obligacion` (tipo ya existente, usado por el `ObligationsTable` estático del Dashboard de Fase 1) **no se
toca ni se reutiliza** — es un tipo distinto y más simple (`nombre/periodo/vence/monto/estado/tono` como
strings ya formateados) que sigue sirviendo solo al mock del Dashboard; mezclarlo con `ObligacionEmpresa`
acoplaría dos fuentes de datos que esta fase decidió mantener separadas (ver Dashboard abajo).

## Rutas y pantallas

Todas bajo `src/portal/obligaciones/`. La ruta base `/app/obligaciones` ya existe como nav item desde la
Fase 1 (`navItems`), solo falta la pantalla.

### 1. Resumen (`ObligacionesScreen.tsx`, `/app/obligaciones`)

- 3 KPIs (`oblKpis`): **Cumplimiento** (% de obligaciones con `fechaLimite` pasada que están CUMPLIDA, sub:
  "N de M cumplidas a tiempo"), **Próximas a vencer** (conteo de PROXIMA, sub: nombre + fecha de la más
  cercana), **Vencidas** (conteo de VENCIDA + suma de `montoEstimado`, sub: monto total; si 0, mensaje
  positivo "Sin obligaciones vencidas").
- Toggle de vista (`oblVistas`, 2 botones: Calendario / Lista), Calendario por defecto.
  - **Calendario**: navegación mes anterior/siguiente (por defecto agosto 2026, mes de `HOY`), grilla de
    semanas Lun–Dom con un botón-badge por obligación cuyo `fechaLimite` cae ese día, coloreado por
    `ESTADO_OBLIGACION_STYLE`; leyenda de los 4 colores debajo. La grilla es dinámica (5 o 6 semanas según el
    mes) — el `hint-placeholder-count="35"` del mockup es solo un tamaño de skeleton, no un contrato de 5
    semanas fijas.
  - **Lista**: tarjetas ordenadas por `fechaLimite` ascendente, cada una con nombre, formulario, periodo,
    fecha, monto, badge de estado y botón "Ver detalle" → `/app/obligaciones/:id`. Estado vacío
    (`oblListaVacia`) si la empresa activa no tiene ninguna obligación (defensivo — no ocurre con ninguna de
    las 2 empresas semilla, pero es gratis de mantener y sigue el mismo patrón defensivo que
    `TodosIndicadoresScreen` usa para "ningún indicador coincide").
- "Atención prioritaria" (`oblPrioridad`, hasta 3): VENCIDA primero (ordenadas por más antigua), luego
  PROXIMA (por más cercana); mensaje `oblPrioridadVacia` si no hay ninguna.
- "Acciones rápidas" (`oblAccionesRapidas`, 3 botones): "Ver historial de cumplidas" (cambia a vista Lista +
  filtro interno CUMPLIDA), "Ver vencidas" (vista Lista + filtro VENCIDA), "Buscar asesor tributario" →
  `/app/marketplace` (mismo patrón de catch-all sin romper navegación que ya usa Fase 4 con Marketplace de
  Fase 7 en curso).
- "Alertas y recomendaciones" (`oblAlertas`, hasta 4): una alerta por cada VENCIDA (texto con días de mora) +
  una por cada PROXIMA a ≤5 días (texto con días restantes), cap total de 4 — mismo patrón de generación que
  las alertas/recomendaciones de indicadores en Fase 4. Si no hay ninguna, mensaje neutro "Estás al día con
  tus obligaciones tributarias."

### 2. Detalle de obligación (`DetalleObligacionScreen.tsx`, `/app/obligaciones/:id`)

- Header: botón volver, nombre de la obligación (`oblDetTitulo`, ej. "Declaración de IVA — Jul 2026"), badge
  de estado, formulario.
- Botón "Marcar como cumplida" (`oblDetPuedeCumplir`: visible solo si el estado actual no es CUMPLIDA ni
  NO_APLICA) → `marcarObligacionCumplida`. Botón "Configurar recordatorio" → `toggleRecordatorioObligacion`,
  cambia su propia etiqueta según `recordatorioActivo`.
- 4 grupos de campos (`oblDetGrupos`), mismo patrón visual (`dt`/`dd`) que `DetalleRegistroScreen`:
  1. **Información general**: categoría, institución, periodicidad, formulario, usa noveno dígito (Sí/No).
  2. **Periodo y fecha límite**: periodo, fecha límite, días restantes/vencida hace N días, noveno dígito del
     RUC aplicado (si `usaNovenoDigito`).
  3. **Monto**: base de cálculo, monto estimado (o "No aplica" si la obligación no permite monto estimado).
  4. **Estado y recordatorio**: estado, fecha de cumplimiento (si aplica), recordatorio activo (Sí/No),
     notas.

### 3. Dashboard (`dashboard/DashboardScreen.tsx`, `dashboard/ObligationsTable.tsx`) — cambio mínimo

Solo se conecta el "Ver todas" (hoy un `<span>` sin `onClick`) a un `<button onClick={() => navigate('/app/obligaciones')}>`. Los datos de esa tarjeta siguen siendo el mock estático `obligaciones` de
`mock-portal-data.ts` (mismo para ambas empresas) — **no** se reemplazan por `obligacionesEmpresa` calculado;
mismo criterio de Fase 3/4 de no ampliar el alcance de esta fase tocando el Dashboard más allá de lo mínimo
para no dejar un enlace roto.

## Estilo y componentes

Mismos tokens y convenciones ya establecidos (`border-line/70`, `bg-card`/`bg-surface`, controles de filtro
`min-h-10` + `text-[13px]`, botones de acción secundarios `min-h-11` + `text-sm`, botones pequeños `min-h-8.5`
+ `text-[12px]`). El calendario es un componente nuevo (sin librería de fechas — cálculo con `Date` nativo,
mismo criterio que `formatPeriodo` en `financiero/formato.ts`), vive junto a las pantallas en
`obligaciones/` sin extraer una abstracción de "calendario genérico" reusable (YAGNI, ningún otro módulo del
portal necesita un calendario).

## Alcance recortado deliberadamente

- **Solo categoría TRIBUTARIA** — sin obligaciones LABORAL/SOCIETARIA/MUNICIPAL (ver arriba).
- **Sin pantalla de configuración de recordatorios** (canal, antelación, horario) — solo un toggle
  activo/inactivo en el detalle.
- **`NO_APLICA` no se produce** con los datos semilla actuales — el tipo lo soporta, ninguna obligación
  semilla lo usa.
- **`CUOTA_RIMPE` con fecha/monto aproximados, no verificados** contra normativa SRI vigente — mismo
  disclaimer que los benchmarks sectoriales de Fase 4.
- **El Dashboard de Fase 1 no se recalcula** — solo se conecta su enlace "Ver todas"; sigue mostrando datos
  mock independientes de `obligacionesEmpresa`.
- **Sin recordatorios reales** (push, correo) — es un booleano visual, mismo criterio que otros botones
  "visuales por ahora" ya documentados en el README del landing.
- **Sin generación dinámica en tiempo de ejecución**: el catálogo por empresa se construye una vez como
  semilla estática (`obligacionesEmpresaSemilla` en `mock-portal-data.ts`), igual que
  `registrosFinancierosSemilla` de Fase 3 — no hay un "motor de reglas" (`regla_obligacion` del dump) que
  evalúe condiciones en vivo; sería sobre-ingeniería para un prototipo con 2 empresas fijas.

## Testing / verificación

- `npm run dev`, entrar a `/app/obligaciones` con Textiles Andina: confirmar 3 KPIs coherentes, calendario en
  agosto 2026 con el periodo de julio de IVA/Retención marcado como Próxima (14 ago), leyenda de 4 colores,
  Atención prioritaria mostrando primero la cuota vencida de Anticipo IR, y al menos una alerta.
- Cambiar a vista Lista: confirmar orden por fecha límite ascendente y que "Ver historial de cumplidas"/"Ver
  vencidas" filtran correctamente.
- Click en una obligación (calendario o lista) → `/app/obligaciones/:id`: confirmar los 4 grupos de campos,
  "Marcar como cumplida" (verificar que desaparece tras marcarla y el estado cambia a Cumplida/navy en la
  lista/calendario) y el toggle de "Configurar recordatorio".
- Cambiar a Comercial del Valle: confirmar que solo aparecen las 2 `CUOTA_RIMPE`, sin IVA/Retención/Renta.
- Dashboard: confirmar que "Ver todas" en la tarjeta "Obligaciones próximas" navega a `/app/obligaciones` (y
  que la tarjeta en sí sigue mostrando su mock estático, sin cambios).

## Fuera de alcance (Fase 5)

- Fase 6 (Simulador), Fase 8 (Plan y suscripción), Fase 9 (Configuración): sin relación de código con esta
  fase.
- Fase 7 (Marketplace): el botón "Buscar asesor tributario" apunta ahí, pero la pantalla la construye Paula
  por separado (mismo catch-all que ya usa Fase 4).
- Obligaciones LABORAL/SOCIETARIA/MUNICIPAL: el enum las define, esta fase no las puebla.
