# Portal Privado — Fase 12 (Solicitudes y citas de Colaborador) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir `/app/solicitudes` completo: solicitudes pendientes con búsqueda y paginación (3/página),
4 KPIs, historial con búsqueda/filtro/paginación (6/página), detalle de solicitud (dialog desktop / sheet
móvil, con deep link `/app/solicitudes/:solicitudId`), y los flujos de aceptar (con creación de cita y
liberación de contacto) y rechazar (con motivo obligatorio).

**Architecture:** Consume las acciones `aceptarSolicitudColaborador`/`rechazarSolicitudColaborador` y el
estado `solicitudesColaborador`/`citasColaborador` que la Fase 10 ya dejó completos en `PortalDataContext`
(validación y transacción ya implementadas ahí) — esta fase es, en su mayoría, construcción de UI sobre
datos y acciones que ya existen.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4, react-router-dom 6,
lucide-react, shadcn/ui (`Button`, `Input`, `Textarea`, `Select`). Sin dependencias nuevas.

## Global Constraints

- Fuente normativa: `docs/superpowers/specs/2026-08-10-portal-privado-fase10-13-colaborador-design.md` y
  `SAFE_PROMPT_2_PERFIL_COLABORADOR.md`, Secciones 16-22.
- Requiere las Fases 10 y 11 completas y mergeadas.
- **Simplificación heredada de la Fase 7 (no introducida por esta fase):** `ServicioProfesional['modalidad']`
  es `Exclude<ModalidadAtencion, 'AMBAS'>` — un servicio individual nunca es "AMBAS" en este prototipo (la
  modalidad mixta es propiedad del colaborador en general, no del servicio). Por eso el flujo de "Aceptar
  solicitud" de la Sección 19.1 del prompt (que pide preguntar la modalidad cuando `servicio.modalidad ===
  'AMBAS'`) nunca se activa aquí: la modalidad de la cita siempre se deriva directo de `servicio.modalidad`,
  sin selector. No se construye UI para una rama inalcanzable.
- Sin flujo de pago real ni reembolso mock (ver "Alcance recortado" del spec de esta fase — no existe
  entidad `Pago` de solicitud en el repo).
- Mismas restricciones de arquitectura que las Fases 10-11: sin MSW, sin test runner, verificación manual.
- Ejecutar `npm run build` después de cada tarea. Cada tarea requiere revisión de cumplimiento del spec y
  luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                            # Modify: 2 rutas nuevas bajo RoleRoute COLABORADOR
└── portal/colaborador/solicitudes/
    ├── SolicitudesScreen.tsx                          # Create: composición de la pantalla completa
    ├── SolicitudPendienteCard.tsx                     # Create
    ├── SolicitudesPendientesPanel.tsx                 # Create: busqueda + paginacion 3/pagina
    ├── SolicitudesKpis.tsx                             # Create: 4 KPIs de la Seccion 21
    ├── HistorialSolicitudes.tsx                        # Create: busqueda + filtro + paginacion 6/pagina
    ├── DetalleSolicitudPanel.tsx                        # Create: dialog/sheet, Seccion 18
    ├── AceptarSolicitudDialog.tsx                       # Create: Seccion 19
    └── RechazarSolicitudDialog.tsx                      # Create: Seccion 20
```

---

### Task 1: `SolicitudesKpis` — los 4 KPIs de la Sección 21

**Files:**
- Create: `src/portal/colaborador/solicitudes/SolicitudesKpis.tsx`

**Interfaces:**
- Consumes: `contarSolicitudesPendientes`, `contarCitasConfirmadasTotales`, `contarCitasConfirmadasEsteMes`,
  `calcularTasaAceptacion` (todas ya creadas en `colaborador/calculo.ts`, Fase 10); `KpiCard` (existente).

- [ ] **Step 1:** Construir el componente con los 4 KPIs, íconos Lucide `Inbox`, `CalendarCheck2`,
  `CalendarClock`, `TrendingUp`:

```tsx
import { CalendarCheck2, CalendarClock, Inbox, TrendingUp } from 'lucide-react'
import { KpiCard } from '@/portal/components/KpiCard'
import type { Cita, SolicitudContacto } from '@/portal/types'
import {
  calcularTasaAceptacion,
  contarCitasConfirmadasEsteMes,
  contarCitasConfirmadasTotales,
  contarSolicitudesPendientes,
} from '@/portal/colaborador/calculo'
import { HOY_COLABORADOR_ISO } from '@/portal/colaborador/semilla'

export function SolicitudesKpis({ solicitudes, citas }: { solicitudes: SolicitudContacto[]; citas: Cita[] }) {
  const { tasa, respondidas } = calcularTasaAceptacion(solicitudes)

  const kpis = [
    {
      id: 'pendientes',
      titulo: 'Solicitudes pendientes',
      valor: String(contarSolicitudesPendientes(solicitudes)),
      sub: 'esperando tu respuesta',
      icon: Inbox,
    },
    {
      id: 'confirmadas-totales',
      titulo: 'Citas confirmadas totales',
      valor: String(contarCitasConfirmadasTotales(citas)),
      sub: 'próximas, sin completar',
      icon: CalendarCheck2,
    },
    {
      id: 'confirmadas-mes',
      titulo: 'Citas confirmadas este mes',
      valor: String(contarCitasConfirmadasEsteMes(citas, HOY_COLABORADOR_ISO)),
      sub: 'en el mes en curso',
      icon: CalendarClock,
    },
    {
      id: 'tasa-aceptacion',
      titulo: 'Tasa de aceptación',
      valor: tasa === null ? '—' : `${tasa}%`,
      sub: tasa === null ? 'Sin solicitudes respondidas' : `${respondidas} solicitudes respondidas`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-1">
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  )
}
```

  (Label visible exacto "Citas confirmadas este mes" — Sección 21.3 del prompt lo pide literal).
- [ ] **Step 2:** `npm run build` limpio.
- [ ] **Step 3:** Commit `feat: agregar KPIs de Solicitudes y citas de Colaborador`.

---

### Task 2: Búsqueda por empresa (helper compartido)

**Files:**
- Modify: `src/portal/colaborador/calculo.ts`

**Interfaces:**
- Produces: `buscarSolicitudesPorEmpresa`, usado por las Tareas 3 y 5.

- [ ] **Step 1:** Agregar la función de búsqueda (Sección 17: busca contra `empresa.nombre_comercial`/
  `empresa.razon_social`):

```ts
import type { Empresa } from '@/portal/types'

function normalizarTexto(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function buscarSolicitudesPorEmpresa<T extends { empresaId: string }>({
  items,
  busqueda,
  empresaPorId,
}: {
  items: T[]
  busqueda: string
  empresaPorId: (id: string) => Pick<Empresa, 'nombre' | 'general'> | undefined
}): T[] {
  const consulta = normalizarTexto(busqueda)
  if (consulta === '') return items
  return items.filter((item) => {
    const empresa = empresaPorId(item.empresaId)
    if (!empresa) return false
    return (
      normalizarTexto(empresa.nombre).includes(consulta) ||
      normalizarTexto(empresa.general.razonSocial).includes(consulta)
    )
  })
}
```

- [ ] **Step 2:** `npm run build` limpio.
- [ ] **Step 3:** Commit `feat: agregar busqueda de solicitudes por nombre de empresa`.

---

### Task 3: Solicitudes pendientes — `SolicitudPendienteCard` + `SolicitudesPendientesPanel`

**Files:**
- Create: `src/portal/colaborador/solicitudes/SolicitudPendienteCard.tsx`,
  `src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx`

**Interfaces:**
- Consumes: `empresaSolicitantePorId` (Fase 10 `colaborador/semilla`), `buscarSolicitudesPorEmpresa` (Task
  2), `serviciosColaborador`, `CompanyIdentity`, `formatFecha`.
- Produces: `onVerDetalle`, `onAceptar`, `onRechazar` callbacks hacia `SolicitudesScreen` (Task 8).

- [ ] **Step 1:** `SolicitudPendienteCard` — contenido exacto de la Sección 17.1: `CompanyIdentity`, Nombre
  de empresa, Responsable (`empresa.representante.nombre` — el prompt lo deriva de
  `solicitud.empresa_id → empresa.usuario_id → usuario`, pero en este prototipo `Empresa.representante.nombre`
  ya es el campo equivalente sembrado para ese propósito, sin necesitar una tabla `usuario` de empresa
  separada — ver el spec de la Fase 2, que ya modela `representante` así), Fecha solicitada
  (`fechaPreferida` + `horaPreferida`), Enviada el (`createdAt`), Servicio solicitado. Acciones: "Ver
  detalles de solicitud", "Aceptar solicitud", "Rechazar solicitud" — **no** mostrar "tipo de ayuda" (Sección
  17.1 lo prohíbe explícitamente) ni información financiera interna de la empresa:

```tsx
export function SolicitudPendienteCard({
  solicitud,
  onVerDetalle,
  onAceptar,
  onRechazar,
}: {
  solicitud: SolicitudContacto
  onVerDetalle: () => void
  onAceptar: () => void
  onRechazar: () => void
}) {
  const { serviciosColaborador } = usePortalData()
  const empresa = empresaSolicitantePorId(solicitud.empresaId)
  const servicio = serviciosColaborador.find((s) => s.id === solicitud.servicioId)

  return (
    <article className="rounded-xl border border-line/70 bg-surface p-3.5">
      <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa'} iniciales={empresa?.iniciales} />
      <dl className="mt-3 flex flex-col gap-1.5 text-[12.5px]">
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Responsable</dt>
          <dd className="text-ink-900">{empresa?.representante.nombre ?? '—'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Servicio solicitado</dt>
          <dd className="text-ink-900">{servicio?.nombre ?? 'Servicio por definir'}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Fecha solicitada</dt>
          <dd className="text-ink-900">{formatFecha(solicitud.fechaPreferida)} · {solicitud.horaPreferida}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-ink-500">Enviada el</dt>
          <dd className="text-ink-900">{formatFecha(solicitud.createdAt.slice(0, 10))}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={onVerDetalle}>Ver detalles</Button>
        <Button size="sm" onClick={onAceptar}>Aceptar solicitud</Button>
        <Button variant="destructive" size="sm" onClick={onRechazar}>Rechazar solicitud</Button>
      </div>
    </article>
  )
}
```

- [ ] **Step 2:** `SolicitudesPendientesPanel` — título "Solicitudes pendientes", `<Input type="search">`
  "Buscar por empresa", lista de `SolicitudPendienteCard` filtrada (`estado === 'ENVIADA'`, ordenada
  `createdAt DESC`, buscada con `buscarSolicitudesPorEmpresa`), paginada **3 por página** (Sección 17),
  controles Anterior/1,2,3.../Siguiente (reutilizar el patrón de paginación de `HistorialPagosScreen.tsx` o
  `MarketplaceScreen.tsx` de Fases previas si exponen un componente reutilizable; si no, un control simple
  local con `useState<number>`).
- [ ] **Step 3:** `npm run build` limpio.
- [ ] **Step 4:** Commit `feat: agregar panel de solicitudes pendientes de Colaborador`.

---

### Task 4: Historial de solicitudes

**Files:**
- Create: `src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx`

**Interfaces:**
- Consumes: `buscarSolicitudesPorEmpresa` (Task 2), `empresaSolicitantePorId`, `serviciosColaborador`.

- [ ] **Step 1:** Título "Historial de solicitudes", búsqueda "Buscar por empresa", filtro `<Select>` con las
  5 opciones exactas de la Sección 22 (Todas, Pendientes, Aceptadas, Rechazadas, Finalizadas), mapeando:

```ts
const FILTRO_A_ESTADOS: Record<string, EstadoSolicitudContacto[]> = {
  Todas: ['ENVIADA', 'ACEPTADA', 'CONTACTO_LIBERADO', 'RECHAZADA', 'FINALIZADA'],
  Pendientes: ['ENVIADA'],
  Aceptadas: ['ACEPTADA', 'CONTACTO_LIBERADO'],
  Rechazadas: ['RECHAZADA'],
  Finalizadas: ['FINALIZADA'],
}
```

  (nunca incluir `PENDIENTE_PAGO`/`PAGADA` en ningún filtro — Sección 22: "No mostrar `PENDIENTE_PAGO` o
  `PAGADA` al colaborador"; en este prototipo esos dos estados de hecho nunca se producen, ver
  "Alcance recortado" del spec de la Fase 10, así que el filtro es defensivo por completitud del tipo, no
  porque vayan a aparecer datos reales en ellos).
- [ ] **Step 2:** Tabla con columnas exactas: Empresa, Responsable, Fecha de solicitud, Fecha solicitada,
  Estado (badge con tono: ENVIADA=atencion, ACEPTADA/CONTACTO_LIBERADO/FINALIZADA=positivo,
  RECHAZADA=critico), Fecha de acción (`fechaRespuesta` formateada, o `"Sin acción"` si `null`/`undefined`),
  Detalle (botón que abre el mismo panel de detalle de la Tarea 5). Paginación **6 por página** (Sección 22).
- [ ] **Step 3:** Responsive: en móvil, mostrar solo Empresa / Fecha solicitada / Estado / Detalle como
  columnas de la tabla (usar `hidden sm:table-cell` en las demás `<td>`/`<th>`, patrón ya usado en tablas de
  fases anteriores como `IndicatorsTable.tsx`/`ObligationsTable.tsx`), el resto de campos se ve dentro del
  drawer de detalle al abrirlo — no convertir cada fila en una card grande (Sección 22 lo prohíbe
  explícitamente).
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Commit `feat: agregar historial de solicitudes de Colaborador`.

---

### Task 5: Detalle de solicitud (`DetalleSolicitudPanel`)

**Files:**
- Create: `src/portal/colaborador/solicitudes/DetalleSolicitudPanel.tsx`

**Interfaces:**
- Consumes: `solicitudesColaborador`, `serviciosColaborador`, `empresaSolicitantePorId`; se abre desde la
  card pendiente (Task 3), el historial (Task 4), o el deep link `/app/solicitudes/:solicitudId` (Task 8).

- [ ] **Step 1:** Dialog en desktop (520-640px de ancho, overlay con foco atrapado, cierre con Escape) / hoja
  full-screen en móvil — reutilizar el patrón de overlay ya usado por `ReservaModal.tsx` (Marketplace, Fase
  7) o `VideoModal.tsx` (Tutoriales, Fase 9) como referencia estructural (`role="dialog"`,
  `aria-modal="true"`, foco inicial en el título, retorno de foco al cerrar).
- [ ] **Step 2:** Validación de pertenencia antes de renderizar contenido (Sección 18, "Debe validar:
  `solicitud.colaborador_id === currentCollaboratorId`" — en este prototipo de un solo colaborador, esa
  condición siempre es verdadera para cualquier `solicitud` presente en `solicitudesColaborador`, que ya
  viene pre-filtrada por `colaboradorId` desde `PortalDataContext`, Fase 10; la validación real y visible
  ocurre al resolver el `id` de la URL contra ese arreglo ya filtrado):

```tsx
const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
if (!solicitud) {
  return (
    <div role="alert" className="p-6 text-center text-[13px] text-ink-500">
      No encontramos esa solicitud, o no te pertenece.
    </div>
  )
}
```

- [ ] **Step 3:** Bloque "Empresa solicitante" (18.1): `CompanyIdentity`, Nombre comercial (`empresa.nombre`),
  Razón social (`empresa.general.razonSocial`), RUC (`empresa.ruc`), Responsable
  (`empresa.representante.nombre`), Actividad económica (`empresa.fiscal.actividadEconomica` — ya es texto
  legible en el modelo existente, sin necesitar una resolución adicional de catálogo), Ciudad/Provincia
  (`empresa.ubicacion.ciudad`/`.provincia`). No mostrar balances/indicadores/obligaciones/plan.
- [ ] **Step 4:** Bloque "Solicitud" (18.2): Servicio solicitado (nombre), Descripción de la solicitud,
  Fecha enviada (`createdAt`), Fecha preferida, Hora preferida, Estado (badge legible). Si
  `solicitud.fechaRespuesta`, mostrar "Fecha de respuesta"; si `estado === 'RECHAZADA'`, mostrar "Motivo de
  rechazo" (`solicitud.motivoRechazo`); si `solicitud.contactoLiberadoAt`, mostrar "Fecha de liberación del
  contacto".
- [ ] **Step 5:** Bloque "Servicio" (18.3): si `servicio` existe, mostrar Nombre/Descripción/Duración
  estimada/Modalidad/Tarifa referencial/Moneda ("USD" fijo). Mientras `estado === 'ENVIADA'`, mostrar el
  indicador `"Pago verificado por SAFE"` (Sección 18.3) — no mostrar comisión ni datos de pago reales.
- [ ] **Step 6:** Bloque "Contacto liberado" (18.4): mientras `estado === 'ENVIADA'`, **no** mostrar ningún
  dato de contacto de la empresa. Cuando `estado` sea `'CONTACTO_LIBERADO'` o `'FINALIZADA'`, mostrar Correo
  del responsable / Teléfono del responsable si existe / Correo empresarial si existe / Teléfono empresarial
  si existe — en el modelo de `Empresa` sembrado por `EMPRESAS_SOLICITANTES_SEMILLA` (Fase 10) estos campos
  (`contacto.correo`, `contacto.telefono`) quedaron vacíos por ser datos de contacto reales que un
  prototipo no debe inventar con apariencia de dato verídico; mostrar en su lugar el texto
  `"Contacto disponible — SAFE liberó los datos de esta empresa."` cuando el campo esté vacío, en vez de una
  cadena vacía o `undefined` renderizado.
- [ ] **Step 7:** Botones de acción dentro del panel (solo si `estado === 'ENVIADA'`): "Aceptar solicitud"
  (abre `AceptarSolicitudDialog`, Task 6) y "Rechazar solicitud" (abre `RechazarSolicitudDialog`, Task 7).
- [ ] **Step 8:** `npm run build` limpio.
- [ ] **Step 9:** Commit `feat: agregar panel de detalle de solicitud de Colaborador`.

---

### Task 6: Aceptar solicitud (`AceptarSolicitudDialog`)

**Files:**
- Create: `src/portal/colaborador/solicitudes/AceptarSolicitudDialog.tsx`

**Interfaces:**
- Consumes: `aceptarSolicitudColaborador` de `usePortalData()` (Fase 10, ya valida y transacciona).

- [ ] **Step 1:** Dialog de confirmación (Sección 19) con resumen: Empresa, Servicio, Fecha solicitada, Hora
  solicitada, Duración, Modalidad — todos derivados de `solicitud`/`servicio`/`empresa`, sin selector de
  modalidad (ver nota de "Global Constraints" sobre `ServicioProfesional.modalidad` nunca siendo `'AMBAS'`
  en este prototipo — la modalidad mostrada es directamente `servicio.modalidad`).
- [ ] **Step 2:** Al confirmar, llamar `aceptarSolicitudColaborador(solicitud.id, servicio.modalidad)`. Si
  `resultado.ok === false`, mostrar `resultado.motivo` como error inline (`role="alert"`) sin cerrar el
  dialog — cubre en particular el mensaje exacto de la Sección 19.2: `"El horario solicitado ya no está
  disponible."` cuando falla la validación de bloque/solapamiento.
- [ ] **Step 3:** Si `resultado.ok === true`, cerrar el dialog de aceptación, cerrar también el panel de
  detalle (Task 5) si estaba abierto, y mostrar una confirmación breve (`role="status"`, auto-dismiss o
  botón "Cerrar") con el texto "Contacto liberado" (Sección 19.3, paso 13: "mostrar contacto liberado") antes
  de volver a la lista de pendientes actualizada.
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Verificación manual: aceptar una de las 12 solicitudes `ENVIADA` semilla → su estado pasa a
  `CONTACTO_LIBERADO`, aparece una cita `CONFIRMADA` nueva, los KPIs del Dashboard (Fase 10) y de esta
  pantalla (Task 1) se actualizan (11 pendientes en vez de 12, etc.), y no se puede volver a aceptar la misma
  solicitud (el botón deja de mostrarse porque `estado` ya no es `'ENVIADA'`).
- [ ] **Step 6:** Commit `feat: agregar flujo de aceptar solicitud de Colaborador`.

---

### Task 7: Rechazar solicitud (`RechazarSolicitudDialog`)

**Files:**
- Create: `src/portal/colaborador/solicitudes/RechazarSolicitudDialog.tsx`

**Interfaces:**
- Consumes: `rechazarSolicitudColaborador` de `usePortalData()` (Fase 10, ya valida longitud del motivo).

- [ ] **Step 1:** Dialog con `<Textarea>` "Motivo de rechazo", validación en vivo: requerido, mínimo 10
  caracteres, máximo 500 (Sección 20) — mostrar contador de caracteres y deshabilitar "Confirmar" mientras
  sea inválido.
- [ ] **Step 2:** Al confirmar, llamar `rechazarSolicitudColaborador(solicitud.id, motivo)`; si devuelve
  `false` (no debería ocurrir dado que la UI ya valida lo mismo client-side, pero se maneja por si el estado
  cambió entre que se abrió el dialog y se confirmó — p.ej. otra pestaña aceptó la solicitud mientras tanto),
  mostrar `"No se pudo rechazar la solicitud. Puede que ya haya sido respondida."` y no cerrar el dialog.
- [ ] **Step 3:** Si devuelve `true`, cerrar el dialog y el panel de detalle si estaba abierto, volver a la
  lista actualizada.
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Commit `feat: agregar flujo de rechazar solicitud de Colaborador`.

---

### Task 8: Composición `SolicitudesScreen` + rutas + deep link

**Files:**
- Create: `src/portal/colaborador/solicitudes/SolicitudesScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: todos los componentes de las Tareas 1-7.

- [ ] **Step 1:** Título "Solicitudes y citas", descripción exacta ("Revisa las solicitudes de empresas,
  acepta o rechaza nuevas coordinaciones y consulta tu historial."), orden exacto de la Sección 16: 1.
  Solicitudes pendientes + búsqueda, 2. 4 KPIs, 3. Historial. Layout desktop: grid con
  `xl:grid-cols-12`, panel de pendientes en `xl:col-span-8` (o 9), KPIs en `xl:col-span-4` (o 3, apilados
  verticalmente vía el `xl:grid-cols-1` que ya tiene `SolicitudesKpis`), Historial full-width debajo. Móvil:
  KPIs primero (2×2), luego pendientes, luego historial (Sección 16, permitido reordenar en móvil "si mejora
  la lectura").
- [ ] **Step 2:** Estado de qué solicitud está en detalle: `useParams<{ solicitudId?: string }>()` desde la
  ruta `/app/solicitudes/:solicitudId` — cuando hay `solicitudId`, renderizar `DetalleSolicitudPanel` abierto
  sobre `/app/solicitudes` (la pantalla `/solicitudes` se mantiene montada visualmente detrás, Sección 5.2:
  "`/solicitudes/:solicitudId` debe mantener visualmente la pantalla `/solicitudes` y abrir el detalle en
  dialog/drawer"). Al abrir el detalle desde una card/fila (sin deep link), usar `navigate` para actualizar
  la URL a `/app/solicitudes/:id` (así el deep link y el flujo interactivo comparten un único punto de
  verdad); al cerrar, `navigate('/app/solicitudes')`.
- [ ] **Step 3:** `App.tsx` — agregar las 2 rutas:

```tsx
<Route path="solicitudes" element={<RoleRoute allow={['COLABORADOR']}><SolicitudesScreen /></RoleRoute>} />
<Route path="solicitudes/:solicitudId" element={<RoleRoute allow={['COLABORADOR']}><SolicitudesScreen /></RoleRoute>} />
```

- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Verificación manual completa: buscar por nombre de empresa en pendientes e historial;
  paginar pendientes (3/página, 12 pendientes → 4 páginas) e historial (6/página); abrir detalle desde una
  card, desde una fila del historial, y por URL directa (`/app/solicitudes/sol-mfl-pend-001`); aceptar una
  solicitud y confirmar que el Dashboard (Fase 10) refleja el cambio sin recargar; rechazar otra con un
  motivo de 5 caracteres → bloqueado; con 15 caracteres → funciona. Responsive 390×844 y 1366×768.
- [ ] **Step 6:** Commit `feat: componer la pantalla Solicitudes y citas de Colaborador`.

---

### Task 9: Verificación final de la fase

**Files:** ninguno (solo verificación).

- [ ] **Step 1:** `rm -rf dist && npm run build` limpio.
- [ ] **Step 2:** Recorrido manual de los criterios de aceptación de la Sección 41 del prompt relacionados
  con Solicitudes: pendientes pagina 3, detalle usa datos de solicitud/empresa/servicio, aceptar crea cita y
  libera contacto, rechazar exige motivo, los 4 KPIs funcionan, historial pagina y filtra.
- [ ] **Step 3:** Regresión: Dashboard de Colaborador (Fase 10) y Perfil (Fase 11) siguen funcionando sin
  cambios tras aceptar/rechazar solicitudes desde esta pantalla (los KPIs del Dashboard deben reflejar los
  nuevos conteos, ya que ambos leen del mismo `PortalDataContext`).
- [ ] **Step 4:** Regresión de Empresa: Marketplace (`/app/marketplace`, Fase 7) sigue creando solicitudes
  nuevas normalmente (`ReservaModal` → `enviarSolicitudContacto`) — confirmar que una solicitud nueva creada
  desde ahí aparece, si su `colaboradorId` fuera `'col-mfl'`, en la bandeja de pendientes de Colaborador (no
  es un caso que la Empresa demo probablemente ejercite en el recorrido normal, pero confirma que ambos
  lados leen la misma fuente de verdad).
- [ ] **Step 5:** Si algo falla, es bloqueante — no continuar a la Fase 13 hasta resolverlo.
