# Portal Privado — Fase 8: Plan y suscripción

Fecha: 2026-08-10

## Contexto

Las Fases 1–7 del portal privado ya están implementadas en la rama `dylan_cd`. Esta fase construye
**Plan y suscripción**: la pantalla "Mi plan" (resumen, beneficios, módulos, uso, FAQ), administrar
suscripción (renovación automática, cancelar), cambiar de plan (comparativa de los 3 tiers), métodos de
pago (agregar/editar/eliminar/predeterminado) e historial de pagos.

SAFE sigue siendo un **prototipo de alta fidelidad, solo frontend**: no hay API, backend ni pasarela de
pago real; todo el estado mutable vive en memoria de React y se pierde al recargar.

Roadmap: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · 4. Indicadores ✅ ·
5. Obligaciones tributarias ✅ · 6. Simulador ✅ · 7. Marketplace ✅ ·
**8. Plan y suscripción (esta fase)** · 9. Configuración + tutoriales.

### Fuente de diseño

- Mockup local `SAFE Portal Privado.dc.html`, pantallas "Plan" (líneas 2146–2234), "Administrar
  suscripción" (2238–2262), "Cambiar plan" (2265–2323), "Métodos de pago" (2326–2357), "Historial de
  pagos" (2360–2396); lógica de datos (`planVals()`, líneas ~4694–4790) y modal genérico de confirmación
  (`confirmCfg()`, líneas ~5040–5112), que también renderiza los modales de Cambiar plan, Cancelar
  suscripción y Agregar/Editar método.
- Dump local `SAFE_dump.sql`, tablas `plan`, `modulo`, `plan_modulo`, `plan_limite`, `metodo_pago`,
  `suscripcion`, `pago`.
- Catálogo de planes ya existente en el sitio público, `src/lib/plans-data.ts` (`planes`,
  `comparativa`): Plan Esencial ($29), Plan Crecimiento ($59, destacado), Plan Corporativo ($119).

La lectura completa del HTML (no solo el markup, también su lógica JS embebida) reveló dos hallazgos que
cambian el alcance frente a lo que sugerían los specs de fases anteriores:

1. **No existe gating por plan en ninguna otra pantalla del prototipo.** Los "candados" que las Fases
   2/4/6 mencionan como diferidos a esta fase son en realidad el gate de `modal: 'tour'` ("necesitas
   registrar una empresa"), ya implementado en cada una de esas fases, sin relación con el plan
   contratado. La única lógica de plan real del mockup vive contenida en las 5 pantallas de esta fase.
2. `suscripcion.usuario_id` en el dump confirma que la suscripción es **de cuenta, no de empresa**: "Tu
   suscripción es una función de cuenta: se administra igual con o sin empresas registradas" (texto
   literal de la pantalla "Mi plan").

Ambos hallazgos fueron confirmados con la usuaria antes de diseñar: esta fase es un **módulo
autocontenido** — no modifica código de Fases 2/4/6/7 ya revisado, ni agrega gating por plan en otras
pantallas, ni retoma el cobro mock de `solicitud_contacto` del Marketplace (`PENDIENTE_PAGO → PAGADA`)
que la Fase 7 dejó fuera de su alcance. Ese cobro del marketplace queda fuera de esta fase también.

## Enfoques considerados

1. **Campos planos en `PortalDataContext`, sin indexar por empresa (elegido)**: `planActivoCodigo`,
   `metodosPago`, `historialPagos`, `renovacionAutomatica`, `suscripcionCancelada` conviven junto a
   `empresas` (ya de cuenta, no per-empresa) en el mismo contexto.
2. **`SubscriptionContext` separado**: más puro semánticamente (la suscripción no es un dato de empresa),
   pero agrega un segundo provider en `App.tsx` para un puñado de campos que caben sin fricción en el
   contexto existente.
3. **Estado local en `PlanScreen` sin contexto**: más simple de escribir, pero el nav item de Sidebar
   (`planInfo.nombre`) y cualquier pantalla futura que necesite leer el plan activo no podrían acceder a
   él sin prop drilling o duplicar estado.

Se elige el (1): es la extensión más chica sobre el patrón ya establecido, y el hecho de que
`PortalDataContext` ya mezcle datos de cuenta (`empresas`, la lista) con datos por-empresa
(`registrosFinancieros`, indexado) hace natural sumar más campos de cuenta sin romper la forma del
contexto.

## Decisiones de arquitectura

### Catálogo de planes: adaptar, no duplicar, `src/lib/plans-data.ts`

`src/lib/plans-data.ts` ya es la fuente de verdad de los 3 tiers (nombre, precio, beneficios,
comparativa) usada por el sitio público (`PlanesPage.tsx`, `PlansSection.tsx`). `plan/catalogo.ts`
importa `planes` y `comparativa` de ahí y les agrega únicamente lo que el sitio público no necesita:
un `codigo: PlanCodigo` (`'ESENCIAL' | 'CRECIMIENTO' | 'CORPORATIVO'`, derivado del nombre) para que el
portal privado pueda referenciar el plan activo con una clave estable en vez de comparar strings de
nombre. `src/lib/plans-data.ts` no se modifica — el sitio público sigue funcionando exactamente igual.

### Plan activo: cuenta, no empresa

`planActivoCodigo` vive en `PortalDataContext` como campo plano (no `Record<empresaId, …>`). Cambiar de
empresa activa con `CompanySwitcher` no cambia el plan mostrado en "Mi plan" — es intencional y coincide
con el texto del mockup. El nav item de Sidebar (`mock-portal-data.ts:129`, ya define
`{ key: 'plan', path: '/app/plan' }`) y `planInfo.nombre` (hoy hardcodeado a `'Plan Crecimiento'`) pasan a
leer `planActivoCodigo` desde el contexto en lugar del mock estático.

### "Estadísticas de uso" son datos reales de la empresa activa, no mock fijo

El mockup muestra 4 stats ("Periodos financieros registrados", "Indicadores calculados", "Simulaciones
realizadas", "Obligaciones cumplidas a tiempo"). Siguiendo el mismo criterio que Financiero/Indicadores
(no inventar números fijos cuando el dato ya existe en el contexto), `PlanScreen` los deriva en vivo de
`PortalDataContext` **para la empresa activa**: `registrosFinancieros[empresaActivaId].length`,
`simulaciones[empresaActivaId].length`, obligaciones con `estado === 'CUMPLIDA'` en
`obligacionesEmpresa[empresaActivaId]`, e indicadores calculados con la misma fórmula que ya usa Fase 4
(catálogo MVP × registros vigentes). Es la única sección de esta fase que sí varía con la empresa activa;
el resto de "Mi plan" (plan, beneficios, métodos, historial) es de cuenta.

### Cambiar de plan no valida límites — fiel al mockup

`cambiarPlan(codigo)` hace el swap directo (mismo comportamiento que
`modalCambiarPlanConfirmar` del mockup: cierra el modal, actualiza `planActivoCodigo`, muestra un toast).
No se agrega validación de "tu empresa actual excede el límite del plan nuevo" — el mockup interactivo no
lo hace, y como esta fase no toca Fases 2–7, no hay de dónde derivar esa regla sin inventarla. Queda
anotado como posible mejora futura, fuera de esta fase.

### Métodos de pago: solo se persiste lo que el dump permite mostrar

`metodo_pago.token_proveedor` nunca se expone (el propio mockup lo aclara: "el token del proveedor nunca
se muestra"). Al agregar una tarjeta, el formulario mock pide número/expiración/CVC pero solo se guardan
`marca` (heurística simple por primer dígito: `4` → Visa, `5` → Mastercard, cualquier otro → "Tarjeta"),
`ultimosCuatro` y expiración — igual que el comentario literal del mockup ("Solo se persisten token mock,
marca, últimos cuatro y expiración"). "Editar" solo permite cambiar la expiración (título del mockup:
"Editar expiración de la tarjeta"), no reemplaza el número. No eliminar el único método restante ni el
predeterminado si es el único: si se elimina el predeterminado habiendo otros, se promueve
automáticamente el primero restante.

### Fecha fija del módulo, igual patrón que las fases anteriores

`plan/calculo.ts` exporta `export const HOY_PLAN = '2026-08-13'`, la misma fecha ficticia ya usada como
"hoy" en `obligaciones/calculo.ts` y `marketplace/calculo.ts`. Se usa para: validar que la expiración de
una tarjeta nueva/editada no esté vencida, y como referencia al mostrar "próxima renovación".

## Modelo de datos

`src/portal/types.ts` gana:

```ts
export type PlanCodigo = 'ESENCIAL' | 'CRECIMIENTO' | 'CORPORATIVO'

export type MetodoPago = {
  id: string
  marca: 'Visa' | 'Mastercard' | 'Tarjeta'
  tipo: 'Tarjeta de crédito' | 'Tarjeta de débito'
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
  tipo: MetodoPago['tipo']
}

export type PagoSuscripcion = {
  id: string
  fecha: string // YYYY-MM-DD
  monto: number
  estado: 'PAGADO' | 'RECHAZADO'
  proveedor: string
  referencia: string
  factura: string | null
  mensaje: string | null
  planNombre: string
  createdAt: string
}
```

`PortalDataContext` gana, como campos de cuenta (no indexados por empresa):

```ts
planActivoCodigo: PlanCodigo
cambiarPlan: (codigo: PlanCodigo) => void

renovacionAutomatica: boolean
toggleRenovacionAutomatica: () => void
suscripcionCancelada: boolean
cancelarSuscripcion: (motivo: string) => void

metodosPago: MetodoPago[]
agregarMetodoPago: (nuevo: NuevoMetodoPago) => MetodoPago | null
editarExpiracionMetodoPago: (id: string, mes: number, anio: number) => void
hacerMetodoPredeterminado: (id: string) => void
eliminarMetodoPago: (id: string) => boolean

historialPagos: PagoSuscripcion[]
```

`agregarMetodoPago` valida número (13–19 dígitos tras quitar espacios), expiración (`MM/AA`, no vencida
contra `HOY_PLAN`) y CVC (3–4 dígitos) en el propio modal antes de llamar al contexto; si la validación de
negocio falla en el contexto (caso defensivo, no debería ocurrir con el modal validando antes) devuelve
`null` sin mutar. `eliminarMetodoPago` devuelve `false` (sin mutar) si es el único método restante.

## Lógica pura (`plan/calculo.ts`)

- `camposPlanActivo(codigo, metodoPredeterminado, proximaRenovacion)` → los 9 pares label/valor de "Mi
  plan" (plan, estado, método, marca, últimos cuatro, expiración, próxima renovación, precio, moneda).
- `modulosDelPlan(codigo)` → los 6 módulos con su estado incluido/no incluido, misma condición que el
  mockup (`codigo !== 'ESENCIAL'` para Indicadores avanzados/Simulador/Marketplace,
  `codigo === 'CORPORATIVO'` para Reportes consolidados).
- `estadisticasDeUso(empresaId, portalData)` → las 4 stats derivadas descritas arriba.
- `detectarMarca(numeroTarjeta)` → heurística de marca por primer dígito.
- `validarNuevoMetodo(datos)` → errores de número/expiración/CVC, reutilizado por el modal antes de mutar.
- `paginar(pagos, porPagina)` → igual patrón que Marketplace, sin página fantasma con cero resultados.

## Rutas, pantallas y componentes

Todo vive bajo `src/portal/plan/`, rutas anidadas bajo `/app/plan` (patrón ya usado por
Empresa/Financiero/Marketplace):

### 1. Mi plan (`PlanScreen.tsx`, `/app/plan`)

- Tarjeta de plan activo: badge "ACTIVA", nombre, precio, botones "Administrar suscripción" / "Actualizar
  tarjeta" (va a Métodos de pago) / "Historial de pagos".
- Grid de campos (`camposPlanActivo`).
- Dos columnas: "Beneficios de tu plan" (lista con check) y "Módulos y límites" (`modulosDelPlan` +
  límites de empresas/simulaciones/soporte del plan activo).
- "Estadísticas de uso": 4 tarjetas KPI (`estadisticasDeUso` de la empresa activa).
- FAQ acordeón (5 preguntas del mockup, contenido propio de esta pantalla — no reutiliza `planesFaqs` del
  sitio público porque responde otras preguntas: mecánica de cambio/renovación/métodos/cancelación/cálculo
  de cargas, no las FAQs de marketing).

### 2. Administrar suscripción (`AdministrarSuscripcionScreen.tsx`, `/app/plan/suscripcion`)

- Volver a "Mi plan".
- Grid de 13 campos (plan, código, descripción, precio, moneda, periodo de prueba, soporte, estado,
  inicio, fin del periodo, próxima renovación, renovación automática, cancelación).
- Botones: "Cambiar plan" (navega a `/app/plan/cambiar`), toggle de renovación automática (label dinámico
  "Desactivar"/"Activar renovación automática"), "Cancelar suscripción" (abre `CancelarSuscripcionModal`).

### 3. Cambiar plan (`CambiarPlanScreen.tsx`, `/app/plan/cambiar`)

- Volver a "Mi plan". Aviso: "El cambio se aplica en el siguiente ciclo de facturación."
- 3 tarjetas (Esencial/Crecimiento/Corporativo) desde `plan/catalogo.ts`: badge ("Plan actual" o "Más
  contratado" en Crecimiento), precio, empresas/simulaciones/soporte, beneficios, CTA. La tarjeta del plan
  activo muestra "Plan actual" y CTA deshabilitado; las demás abren `CambiarPlanModal`.
- Tabla comparativa de 9 módulos × 3 planes (✓/—), adaptada de `comparativa` en `src/lib/plans-data.ts`.

### 4. Métodos de pago (`MetodosPagoScreen.tsx`, `/app/plan/metodos-pago`)

- Volver a "Mi plan". Botón "Agregar método" (abre `MetodoPagoModal` en modo agregar).
- Tarjetas por método: marca + últimos 4, badge "Predeterminado" si aplica, tipo/expiración/estado, nota
  "el token del proveedor nunca se muestra", botones "Editar expiración" / "Hacer predeterminado" /
  "Eliminar".

### 5. Historial de pagos (`HistorialPagosScreen.tsx`, `/app/plan/historial-pagos`)

- Volver a "Mi plan".
- Lista acordeón paginada (5 por página): fecha, monto, badge de estado (verde PAGADO / rojo RECHAZADO);
  al expandir muestra tipo, moneda, proveedor, referencia, confirmación, factura, mensaje, creación,
  actualización, plan relacionado.

### Modales

- **`CambiarPlanModal.tsx`**: "Cambiar a {plan}", texto con el nuevo precio y "se cobrará con tu método
  predeterminado ({marca} ···· {últimos 4}) en el siguiente ciclo, el {próxima renovación}", CTA
  "Confirmar cambio".
- **`CancelarSuscripcionModal.tsx`**: texto "conservas el acceso hasta {fin del periodo}", textarea
  opcional "Motivo de la cancelación", CTA "Confirmar cancelación" (rojo).
- **`MetodoPagoModal.tsx`**: compartido agregar/editar. Agregar: número de tarjeta, expiración, CVC (los
  tres con validación, ver `validarNuevoMetodo`). Editar: solo expiración. CTA "Guardar", toast "Método
  guardado. Solo se persisten token mock, marca, últimos cuatro y expiración." (agregar) o "Expiración
  actualizada." (editar).

Los tres modales siguen el mismo patrón de accesibilidad ya establecido en `marketplace/ReservaModal.tsx`:
`role="dialog"`, `aria-modal`, foco inicial y trampa de Tab, Escape para cerrar, scroll lock, botones
`disabled` reales, errores con `role="alert"`.

## Formato, estilo y responsive

- Reutilizar `formatUSD` de `financiero/formato.ts` y `formatFecha` de `obligaciones/formato.ts`; no se
  duplica moneda/fecha.
- `plan/formato.ts` solo añade `formatExpiracion(mes, anio)` (`"MM/AAAA"`) y `formatMarcaTarjeta`.
- Tokens y accesibilidad ya establecidos (`surface-card`, `border-line`, navy para acciones, emerald para
  éxito, rojo para cancelar/eliminar); targets ≥ 40–44 px, focus visible.
- Desktop ≥1024: dos columnas en beneficios/módulos, 4 KPIs de uso, 3 tarjetas de plan en fila, grid de
  campos con 3 columnas. Tablet ≥768: 2 columnas. Móvil: una columna, tabla comparativa con scroll
  horizontal (`overflow-x:auto`, igual que el mockup).

## Manejo de estados y errores

- Sin métodos de pago: "Cambiar plan" y "Agregar método" quedan disponibles pero el CTA de confirmación de
  cambio de plan se deshabilita con mensaje "Agrega un método de pago para cambiar de plan" (no hay método
  predeterminado que cobrar — regla mínima no cubierta explícitamente por el mockup pero necesaria para
  evitar un estado inconsistente).
- Eliminar el único método restante: bloqueado, mensaje explicativo, sin mutar.
- Número de tarjeta/expiración/CVC inválidos: error inline al intentar guardar, no al escribir.
- Expiración vencida (contra `HOY_PLAN`): error específico "La tarjeta está vencida".
- Cancelar sin motivo: permitido (el campo es opcional en el mockup).
- Historial vacío (no debería ocurrir con la semilla, pero por completitud): mensaje "Sin pagos
  registrados" sin paginación.
- Toda mutación es en memoria; recargar la página restaura la semilla.

## Datos semilla (`mock-portal-data.ts` / `plan/catalogo.ts`)

- `planActivoCodigo` inicial: `'CRECIMIENTO'` (coincide con `planInfo` actual del Sidebar).
- Suscripción: inicio `2026-02-10`, próxima renovación `2026-09-10`, renovación automática activa, sin
  cancelación.
- 2 métodos de pago: Visa ····5601 predeterminada (expira 05/2029, coincide con el mockup), Mastercard
  ····4477 secundaria (expira 11/2027).
- 7 pagos de historial, uno por mes de febrero a agosto 2026 (coincide con el ciclo mensual desde el
  inicio de la suscripción hasta `HOY_PLAN`), monto $59 (Crecimiento). El de mayo queda `RECHAZADO` (para
  ejercitar ambos estados visuales) y el de junio, `PAGADO` normal — sin agregar un octavo registro de
  "reintento", para no romper el conteo de 7. Paginado: 5 + 2.

## Estructura de archivos

```text
src/
├── App.tsx                                      # rutas de Plan y suscripción
└── portal/
    ├── types.ts                                 # PlanCodigo, MetodoPago, PagoSuscripcion, etc.
    ├── PortalDataContext.tsx                    # campos de cuenta + mutaciones
    ├── data/mock-portal-data.ts                 # semilla de suscripción/métodos/historial
    ├── components/Sidebar.tsx                   # planInfo.nombre lee planActivoCodigo del contexto
    └── plan/
        ├── catalogo.ts                          # planes adaptados de src/lib/plans-data.ts + FAQ propia
        ├── calculo.ts                           # HOY_PLAN + funciones puras
        ├── formato.ts                           # wrappers propios de esta fase
        ├── PlanScreen.tsx
        ├── AdministrarSuscripcionScreen.tsx
        ├── CambiarPlanScreen.tsx
        ├── MetodosPagoScreen.tsx
        ├── HistorialPagosScreen.tsx
        ├── CambiarPlanModal.tsx
        ├── CancelarSuscripcionModal.tsx
        └── MetodoPagoModal.tsx
```

`src/lib/plans-data.ts` no se modifica.

## Alcance recortado deliberadamente

- Sin gating por plan en Financiero/Indicadores/Simulador/Marketplace — no se toca código de Fases 2–7.
- Sin cobro mock del Marketplace (`solicitud_contacto` `PENDIENTE_PAGO → PAGADA`) — queda fuera de esta
  fase también, pese a que el spec de Fase 7 lo mencionó como pendiente para "Fase 8"; no hay pantalla de
  reserva involucrada aquí.
- Sin validación de "tu empresa excede el límite del nuevo plan" al cambiar de plan.
- Sin pasarela de pago real, sin re-intento de cobro fallido desde la UI, sin descarga de factura (PDF).
- Sin "Eliminar cuenta" (pertenece a Configuración, Fase 9, aunque el mockup la resuelve con el mismo
  modal de confirmación genérico).
- Sin `localStorage` ni persistencia entre recargas.

## Verificación

### Funciones puras (`npx tsx -e`)

- `modulosDelPlan` para los 3 códigos coincide con la matriz del mockup.
- `estadisticasDeUso` cambia al cambiar de empresa activa (usa datos de Fases 3/4/6/5, no fijos).
- `detectarMarca` para números que empiezan en 4/5/otro.
- `validarNuevoMetodo`: número corto/largo, expiración mal formada, expiración vencida, CVC inválido.
- `paginar`: 7 pagos → 2 páginas (5+2), cero pagos → cero páginas.

### Navegador

- `/app/plan` muestra plan activo, beneficios, módulos, 4 KPIs de uso reales de la empresa activa, FAQ.
- Cambiar de empresa activa con `CompanySwitcher` no cambia el plan mostrado, sí cambia las 4 KPIs de uso.
- Administrar suscripción: toggle de renovación automática cambia label y persiste; cancelar suscripción
  muestra el modal, confirma y actualiza el estado de cancelación.
- Cambiar plan: seleccionar un plan distinto abre el modal con precio/método/fecha correctos; confirmar
  actualiza `planActivoCodigo`, el Sidebar y vuelve a "Mi plan"; el plan activo no tiene CTA.
- Métodos de pago: agregar con datos válidos/inválidos, editar expiración, hacer predeterminado, eliminar
  (bloqueado si es el único), no se muestra el número completo ni el CVC en ningún momento.
- Historial de pagos: paginación 5+2, expandir/colapsar cada fila, badges de color correctos por estado.
- Escape, overlay, foco y navegación por teclado en los tres modales.
- Responsive manual en 1440, 768 y 390 px, incluida la tabla comparativa con scroll horizontal en móvil.

### Build

`npm run build` después de cada tarea y al cierre, sin errores de TypeScript. No se introduce test runner,
ESLint ni dependencia nueva.

## Fuera de alcance (Fase 8)

- Fase 9: Configuración, notificaciones reales, tutoriales, eliminar cuenta.
- Cobro real del Marketplace (`solicitud_contacto`), portal del profesional, administración de postulaciones.
- Backend, autenticación adicional, pasarela de pago real, generación de PDF de factura.
