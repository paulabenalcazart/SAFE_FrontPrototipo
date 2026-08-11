# Portal Privado — Fase 13 (Configuración + Video tutoriales de Colaborador) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completar el resolver de rol de `/app/configuracion` y `/app/tutoriales` (pendiente desde la Fase
10) con las pantallas de Colaborador: Configuración (cuenta, seguridad, notificaciones propias de
Colaborador, preferencias, privacidad y legal, opciones avanzadas) y Video tutoriales (tags y catálogo
exclusivos de Colaborador). Es la última fase del rollout — al terminarla, el portal Colaborador queda
completo según el prompt.

**Architecture:** Reutiliza componentes ya existentes sin cambiarlos (`Switch`, `Accordion`,
`DOCUMENTOS_LEGALES`, `EditarCuentaScreen`, `useTemaPreferencia`) y extiende `PortalDataContext` (Fase 10)
con las 5 preferencias de notificación de Colaborador ya modeladas ahí. Video tutoriales extrae la
composición visual de `TutorialesScreen.tsx` (Fase 9) a un componente compartido parametrizable, mismo
patrón de extracción quirúrgica que la Fase 11 usó para el perfil de Marketplace.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4, react-router-dom 6,
lucide-react, shadcn/ui (`Button`, `Input`, `Label`, `Select`, `Accordion`). Sin dependencias nuevas.

## Global Constraints

- Fuente normativa: `docs/superpowers/specs/2026-08-10-portal-privado-fase10-13-colaborador-design.md` y
  `SAFE_PROMPT_2_PERFIL_COLABORADOR.md`, Secciones 23-30.
- Requiere las Fases 10-12 completas y mergeadas. Esta es la última fase — al cerrarla, ejecutar la
  regresión completa de Empresa de la Sección 40 del prompt.
- `/app/configuracion/cuenta` (`EditarCuentaScreen`, Fase 9) es **compartida sin cambios** entre ambos roles
  — ya solo edita `nombres`/`apellidos`/`correo` de `AuthUser`, agnóstico de rol. No tocar ese archivo.
- Configuración de Colaborador **no** reutiliza `ConfiguracionScreen.tsx` de Empresa (Fase 9) como
  componente — es una pantalla propia, porque su lista de secciones y el layout de Notificaciones son
  distintos (Sección 26 del prompt: "Esta sección no usa la configuración de Empresa"). Sí reutiliza
  utilidades ya existentes (`Switch`, `Accordion`, `DOCUMENTOS_LEGALES`, `useTemaPreferencia`).
- Video tutoriales de Colaborador reutiliza la **composición** de `TutorialesScreen.tsx` (Fase 9) vía
  extracción a un componente compartido — no se construye una segunda UI de tutoriales desde cero, ni se
  mezclan tags/datos de Empresa con los de Colaborador.
- Mismas restricciones de arquitectura que las Fases 10-12: sin MSW, sin test runner, verificación manual.
- Ejecutar `npm run build` después de cada tarea. Cada tarea requiere revisión de cumplimiento del spec y
  luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                            # Modify: completar resolvers configuracion/tutoriales
└── portal/
    ├── types.ts                                        # Modify: VideoTutorial.audiencia
    ├── tutoriales/
    │   ├── catalogo.ts                                 # Modify: audiencia en catalogo existente
    │   ├── TutorialesGrid.tsx                           # Create: extraido de TutorialesScreen.tsx
    │   └── TutorialesScreen.tsx                         # Modify: delega en TutorialesGrid
    └── colaborador/
        ├── configuracion/
        │   ├── catalogo.ts                              # Create: catalogo de tutoriales + notificaciones default (ya en semilla.ts, Fase 10)
        │   ├── CollaboratorSettingsScreen.tsx            # Create
        │   └── EliminarCuentaColaboradorModal.tsx        # Create
        └── tutoriales/
            ├── catalogo.ts                               # Create: VIDEO_TUTORIALES_COLABORADOR + tags
            └── CollaboratorTutorialsScreen.tsx            # Create
```

---

### Task 1: `VideoTutorial.audiencia` + catálogo de tutoriales de Colaborador

**Files:**
- Modify: `src/portal/types.ts`, `src/portal/tutoriales/catalogo.ts`
- Create: `src/portal/colaborador/tutoriales/catalogo.ts`

**Interfaces:**
- Produces: `VideoTutorial.audiencia`, `VIDEO_TUTORIALES_COLABORADOR`, `CATEGORIAS_TUTORIAL_COLABORADOR` —
  usados por la Tarea 3.

- [ ] **Step 1:** `types.ts` — ampliar `VideoTutorial`:

```ts
export type AudienciaTutorial = 'EMPRESA' | 'COLABORADOR'

export type VideoTutorial = {
  id: string
  titulo: string
  categoria: string
  duracion: string
  descripcion: string
  audiencia: AudienciaTutorial
}
```

- [ ] **Step 2:** `tutoriales/catalogo.ts` (Fase 9, catálogo de Empresa) — agregar `audiencia: 'EMPRESA'` a
  cada entrada generada, sin cambiar ningún otro dato:

```ts
export const VIDEO_TUTORIALES: VideoTutorial[] = CATALOGO.map(([titulo, categoria, duracion, descripcion], i) => ({
  id: `tut-${i}`,
  titulo,
  categoria,
  duracion,
  descripcion,
  audiencia: 'EMPRESA',
}))
```

- [ ] **Step 3:** Crear `src/portal/colaborador/tutoriales/catalogo.ts` con los tags exactos de la Sección
  30.1 y al menos 12 tutoriales (Sección 35.10) distribuidos entre los 4 módulos del rol:

```ts
import type { VideoTutorial } from '@/portal/types'

export const CATEGORIAS_TUTORIAL_COLABORADOR = [
  'Todos',
  'Dashboard',
  'Perfil profesional',
  'Solicitudes y citas',
  'Configuración',
] as const

const CATALOGO_COLABORADOR: [string, string, string, string][] = [
  ['Conoce tu Dashboard profesional', 'Dashboard', '3:24', 'Qué significa cada KPI y cómo leer tu disponibilidad.'],
  ['Interpreta tu rendimiento mensual', 'Dashboard', '4:10', 'Cómo leer las 4 métricas semanales y su comparación con el mes anterior.'],
  ['Administra tu disponibilidad desde el Dashboard', 'Dashboard', '2:55', 'Atajo directo a tus horarios de atención.'],
  ['Completa tu perfil profesional', 'Perfil profesional', '5:12', 'Información personal, profesional y credenciales.'],
  ['Administra tus especialidades', 'Perfil profesional', '3:48', 'Cómo marcar tu especialidad principal y agregar otras.'],
  ['Crea y administra tus servicios', 'Perfil profesional', '4:33', 'Ícono, duración, tarifa y modalidad de cada servicio.'],
  ['Configura tus horarios de atención', 'Perfil profesional', '4:02', 'Bloques por día, modalidad y solapamientos.'],
  ['Así ven tu perfil las empresas', 'Perfil profesional', '2:40', 'Qué se muestra y qué se protege en la vista previa.'],
  ['Responde a una solicitud nueva', 'Solicitudes y citas', '3:15', 'Ver detalle, aceptar y liberar el contacto.'],
  ['Rechaza una solicitud correctamente', 'Solicitudes y citas', '2:20', 'Cuándo y cómo explicar un rechazo.'],
  ['Consulta tu historial de solicitudes', 'Solicitudes y citas', '3:05', 'Filtros, búsqueda y paginación.'],
  ['Administra tus notificaciones', 'Configuración', '2:48', 'Correo y frecuencia por tipo de aviso.'],
  ['Seguridad de tu cuenta', 'Configuración', '3:00', 'Autenticación en dos pasos y cambio de contraseña.'],
]

export const VIDEO_TUTORIALES_COLABORADOR: VideoTutorial[] = CATALOGO_COLABORADOR.map(
  ([titulo, categoria, duracion, descripcion], i) => ({
    id: `tut-col-${i}`,
    titulo,
    categoria,
    duracion,
    descripcion,
    audiencia: 'COLABORADOR',
  }),
)
```

  (13 tutoriales, ≥12 requeridos por la Sección 35.10; no se usa `'Primeros pasos'` como tag — Sección 30.1
  lo prohíbe explícitamente para esta ejecución).
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Commit `feat: agregar audiencia a VideoTutorial y catalogo de tutoriales de Colaborador`.

---

### Task 2: Extraer `TutorialesGrid` compartido + `CollaboratorTutorialsScreen`

**Files:**
- Create: `src/portal/tutoriales/TutorialesGrid.tsx`,
  `src/portal/colaborador/tutoriales/CollaboratorTutorialsScreen.tsx`
- Modify: `src/portal/tutoriales/TutorialesScreen.tsx`, `src/App.tsx`

**Interfaces:**
- Produces: `TutorialesGrid` — recibe `titulo`, `descripcion`, `categorias: readonly string[]`,
  `tutoriales: VideoTutorial[]`.

- [ ] **Step 1:** Crear `TutorialesGrid.tsx` moviendo tal cual el cuerpo de `TutorialesScreen.tsx` actual
  (todo el JSX y la lógica de `categoria`/`busqueda`/`cantidad`/`videoAbierto`), parametrizando el título, la
  descripción y las fuentes de datos:

```tsx
export function TutorialesGrid({
  titulo,
  descripcion,
  categorias,
  tutoriales,
}: {
  titulo: string
  descripcion: string
  categorias: readonly string[]
  tutoriales: VideoTutorial[]
}) {
  const [categoria, setCategoria] = useState<string>('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [cantidad, setCantidad] = useState(INICIAL)
  const [videoAbierto, setVideoAbierto] = useState<string | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    return tutoriales.filter(
      (t) =>
        (categoria === 'Todos' || t.categoria === categoria) &&
        (!q || t.titulo.toLowerCase().includes(q) || t.descripcion.toLowerCase().includes(q)),
    )
  }, [categoria, busqueda, tutoriales])

  const visibles = filtrados.slice(0, cantidad)
  const hayMas = cantidad < tutoriales.length && categoria === 'Todos' && !busqueda.trim()

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">{titulo}</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">{descripcion}</p>
      </div>
      {/* ...resto del JSX (Input de busqueda, botones de categoria, grid de cards, boton "Cargar mas",
          VideoModal) movido tal cual desde TutorialesScreen.tsx, usando `categorias` en vez de
          CATEGORIAS_TUTORIAL y `tutoriales`/`filtrados`/`visibles` locales a este componente... */}
    </section>
  )
}
```

  (`INICIAL`/`INCREMENTO` se mueven también a este archivo como constantes de módulo).
- [ ] **Step 2:** Reescribir `TutorialesScreen.tsx` (Empresa) para que delegue, filtrando el catálogo por
  `audiencia === 'EMPRESA'` (aunque hoy todas las entradas ya son de esa audiencia, filtrar explícitamente
  documenta la intención y blinda contra que alguien agregue una entrada de Colaborador al mismo array por
  error en el futuro):

```tsx
import { CATEGORIAS_TUTORIAL, VIDEO_TUTORIALES } from './catalogo'
import { TutorialesGrid } from './TutorialesGrid'

export function TutorialesScreen() {
  return (
    <TutorialesGrid
      titulo="Video tutoriales"
      descripcion="Aprende a usar SAFE con tutoriales prácticos y paso a paso."
      categorias={CATEGORIAS_TUTORIAL}
      tutoriales={VIDEO_TUTORIALES.filter((t) => t.audiencia === 'EMPRESA')}
    />
  )
}
```

- [ ] **Step 3:** **Verificación de no-regresión obligatoria:** `npm run dev`, `/app/tutoriales` como
  Empresa — debe verse y comportarse exactamente igual que antes de esta tarea (mismos 16 tutoriales, mismos
  8 tags, búsqueda, "Cargar más", modal de video).
- [ ] **Step 4:** Crear `CollaboratorTutorialsScreen.tsx`:

```tsx
import { CATEGORIAS_TUTORIAL_COLABORADOR, VIDEO_TUTORIALES_COLABORADOR } from './catalogo'
import { TutorialesGrid } from '@/portal/tutoriales/TutorialesGrid'

export function CollaboratorTutorialsScreen() {
  return (
    <TutorialesGrid
      titulo="Video tutoriales"
      descripcion="Aprende a usar SAFE con tutoriales prácticos y paso a paso para aprovechar al máximo tus herramientas como profesional."
      categorias={CATEGORIAS_TUTORIAL_COLABORADOR}
      tutoriales={VIDEO_TUTORIALES_COLABORADOR}
    />
  )
}
```

- [ ] **Step 5:** `App.tsx` — completar el resolver de `/app/tutoriales` (pendiente desde la Fase 10):

```tsx
function TutorialesResolver() {
  const { user } = useAuth()
  return user?.role === 'COLABORADOR' ? <CollaboratorTutorialsScreen /> : <TutorialesScreen />
}
```

  y cambiar `<Route path="tutoriales" element={<TutorialesScreen />} />` por
  `<Route path="tutoriales" element={<TutorialesResolver />} />`.
- [ ] **Step 6:** `npm run build` limpio.
- [ ] **Step 7:** Verificación manual: `/app/tutoriales` como Colaborador muestra los 5 tags exactos
  (Sección 30.1) y los 13 tutoriales de la Tarea 1, sin ningún tag ni video de Empresa.
- [ ] **Step 8:** Commit `feat: agregar Video tutoriales de Colaborador reutilizando la composicion de Empresa`.

---

### Task 3: `CollaboratorSettingsScreen` — Cuenta, Seguridad, Notificaciones, Preferencias

**Files:**
- Create: `src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useAuth()` (`user`, `toggleMfa`), `usePortalData()`
  (`preferenciasNotificacionColaborador`, `actualizarPreferenciaNotificacionColaborador`, `preferencias`,
  `actualizarPreferencia` — reutiliza `modoGuiado` de la franja genérica ya existente de Fase 9),
  `useTemaPreferencia`, `Switch`/`Select`/`Accordion` (existentes).

- [ ] **Step 1:** Título "Configuración", descripción "Administra tu cuenta, seguridad, notificaciones y
  preferencias." (Sección 23), 6 secciones en el orden exacto del prompt: Cuenta, Seguridad, Notificaciones,
  Preferencias, Privacidad y legal, Opciones avanzadas — **sin** sección de Suscripción/Plan.
- [ ] **Step 2:** Sección "Cuenta" — igual patrón visual que `ConfiguracionScreen.tsx` (Fase 9): `<dl>` con
  Nombres/Apellidos/Correo de `user`, botón "Editar cuenta" → `navigate('/app/configuracion/cuenta')` (ruta
  compartida, sin cambios).
- [ ] **Step 3:** Sección "Seguridad" — mismo patrón que `ConfiguracionScreen.tsx` (Fase 9): switch 2FA
  (`user.mfaHabilitado`/`toggleMfa`) y formulario de cambiar contraseña con las mismas validaciones (actual
  requerida, nueva ≥8 caracteres, nueva ≠ actual, confirmación = nueva) — este bloque es idéntico en
  Empresa y Colaborador porque ambos mapean 1:1 a `usuario.mfa_habilitado`/cambio de contraseña genérico; se
  reimplementa aquí (no se importa desde `ConfiguracionScreen.tsx`, que es un componente completo, no una
  sub-sección exportada) con el mismo código, sin inventar nueva lógica.
- [ ] **Step 4:** Sección "Notificaciones" — **layout propio** (Sección 26, tabla `Tipo de notificación |
  Correo | Frecuencia`), 5 filas exactas: Nuevas solicitudes de citas, Confirmaciones y recordatorios,
  Cancelaciones y reagendamiento, Nuevas valoraciones, Novedades y actualizaciones — mapeadas a
  `CategoriaNotificacionColaborador` (`NEW_REQUEST`, `APPOINTMENT_REMINDER`, `CANCELLATION_RESCHEDULE`,
  `NEW_REVIEW`, `PRODUCT_UPDATES`):

```tsx
const FILAS_NOTIFICACION: { categoria: CategoriaNotificacionColaborador; label: string }[] = [
  { categoria: 'NEW_REQUEST', label: 'Nuevas solicitudes de citas' },
  { categoria: 'APPOINTMENT_REMINDER', label: 'Confirmaciones y recordatorios' },
  { categoria: 'CANCELLATION_RESCHEDULE', label: 'Cancelaciones y reagendamiento' },
  { categoria: 'NEW_REVIEW', label: 'Nuevas valoraciones' },
  { categoria: 'PRODUCT_UPDATES', label: 'Novedades y actualizaciones' },
]

const OPCIONES_FRECUENCIA: { valor: FrecuenciaNotificacionColaborador; etiqueta: string }[] = [
  { valor: 'INMEDIATA', etiqueta: 'Inmediata' },
  { valor: 'DIARIA', etiqueta: 'Diaria' },
  { valor: 'SEMANAL', etiqueta: 'Semanal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
  { valor: 'NINGUNA', etiqueta: 'Ninguna' },
]
```

  Cada fila: `Switch` de correo (`checked={pref.correoActivo}`,
  `onCheckedChange={() => actualizarPreferenciaNotificacionColaborador(fila.categoria, { correoActivo: !pref.correoActivo })}`)
  + `Select` de frecuencia (`onValueChange={(v) => actualizarPreferenciaNotificacionColaborador(fila.categoria, { frecuencia: v as FrecuenciaNotificacionColaborador })}`).
  Responsive: en desktop tabla de 3 columnas; en móvil, cada fila se apila (label arriba, controles debajo)
  usando `flex-col sm:flex-row` por fila, mismo criterio que el resto de tablas del portal.
- [ ] **Step 5:** Sección "Preferencias" — **solo** Tema (`useTemaPreferencia`, idéntico a Empresa) y Modo
  guiado (`preferencias.modoGuiado`/`actualizarPreferencia`, misma franja genérica que Empresa ya usa desde
  la Fase 9 — es un campo de `preferencia_usuario` sin distinción de rol). **No** incluir modalidad de
  atención, disponibilidad, zona horaria ni condiciones de atención — esos viven en `/app/perfil` (Sección
  27 del prompt lo prohíbe explícitamente aquí).
- [ ] **Step 6:** Sección "Privacidad y legal" — reutilizar `DOCUMENTOS_LEGALES` de
  `src/portal/configuracion/catalogo.ts` (Fase 9, sin cambios) dentro de un `<Accordion>` idéntico en
  estructura al de `ConfiguracionScreen.tsx`.
- [ ] **Step 7:** Sección "Opciones avanzadas" — "Exportar mis datos" (botón que muestra un mensaje de
  confirmación listando lo exportado, Sección 29.1: usuario, colaborador, especialidades, servicios,
  disponibilidad, solicitudes, citas, reseñas, preferencias, notificaciones — mismo patrón de
  `handleExportar` que `ConfiguracionScreen.tsx` ya usa para Empresa) y "Eliminar cuenta" (abre
  `EliminarCuentaColaboradorModal`, Task 4).
- [ ] **Step 8:** `npm run build` limpio.
- [ ] **Step 9:** Commit `feat: agregar pantalla de Configuracion de Colaborador (cuenta, seguridad, notificaciones, preferencias)`.

---

### Task 4: Opciones avanzadas — `EliminarCuentaColaboradorModal`

**Files:**
- Create: `src/portal/colaborador/configuracion/EliminarCuentaColaboradorModal.tsx`
- Modify: `src/portal/PortalDataContext.tsx` (una acción nueva)

**Interfaces:**
- Consumes: `useAccessibleDialog` (existente, Fase 8), `actualizarColaboradorPerfil` (Fase 10).
- Produces: `desactivarCuentaColaborador` en `PortalDataContext`, usado solo por este modal.

- [ ] **Step 1:** `PortalDataContext.tsx` — agregar la acción de las consecuencias mock de la Sección 29.2
  (`colaborador.estado = INACTIVO`, `colaborador.visible_marketplace = false`; `usuario.estado`/`deleted_at`
  ya no existen como campos propios de `AuthUser` en este prototipo — no se modelaron por no tener ningún
  otro punto del portal que los lea, así que la consecuencia sobre `usuario` se reduce a cerrar sesión, que
  ya hace `logout()` en `AuthContext`):

```ts
const desactivarCuentaColaborador = () => {
  setColaboradorPerfil((current) => ({ ...current, estado: 'INACTIVO', visibleMarketplace: false }))
}
```

  Agregar `desactivarCuentaColaborador: () => void` al tipo `PortalDataContextValue` y al `Provider`.
- [ ] **Step 2:** Crear el modal — mismo patrón visual y de accesibilidad que
  `src/portal/configuracion/EliminarCuentaModal.tsx` (Fase 9: overlay, `useAccessibleDialog`, campo "Escribe
  ELIMINAR"), con copy propio (no financiero) y la secuencia de la Sección 29.2: al confirmar, llamar
  `desactivarCuentaColaborador()`, luego `logout()`, luego `navigate('/')` — **sin** borrar reseñas,
  solicitudes o citas históricas del estado (no se toca `solicitudesContacto`/`citasColaborador`, la
  desactivación es exclusivamente sobre `colaboradorPerfil`):

```tsx
const handleConfirmar = () => {
  if (!confirmado) return
  desactivarCuentaColaborador()
  onCerrar()
  logout()
  navigate('/')
}
```

  Texto de advertencia: "Se marcará tu cuenta profesional como inactiva y dejará de ser visible en el
  Marketplace. Tu historial de solicitudes, citas y reseñas se conserva. Escribe **ELIMINAR** para
  confirmar."
- [ ] **Step 3:** `npm run build` limpio.
- [ ] **Step 4:** Commit `feat: agregar eliminar cuenta de Colaborador con desactivacion mock`.

---

### Task 5: Completar el resolver `/app/configuracion` + verificación final de la fase

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `CollaboratorSettingsScreen` (Task 3).

- [ ] **Step 1:** `App.tsx` — completar `ConfiguracionResolver` (mismo patrón que `DashboardResolver`/
  `TutorialesResolver`):

```tsx
function ConfiguracionResolver() {
  const { user } = useAuth()
  return user?.role === 'COLABORADOR' ? <CollaboratorSettingsScreen /> : <ConfiguracionScreen />
}
```

  y cambiar `<Route path="configuracion" element={<ConfiguracionScreen />} />` por
  `<Route path="configuracion" element={<ConfiguracionResolver />} />`. La ruta
  `configuracion/cuenta` se mantiene sin cambios (compartida, Task 3 Step 2).
- [ ] **Step 2:** `rm -rf dist && npm run build` limpio.
- [ ] **Step 3:** Recorrido manual completo como Colaborador: `/app/configuracion` — las 6 secciones en
  orden, cambiar tema (afecta todo el shell), activar 2FA, cambiar preferencia de una categoría de
  notificación (correo + frecuencia), abrir un documento legal, exportar datos, intentar eliminar cuenta sin
  escribir "ELIMINAR" (bloqueado) y luego escribiéndolo (cierra sesión, vuelve a `/`).
- [ ] **Step 4:** Regresión completa de Empresa (Sección 40 del prompt — cierre de todo el rollout, no solo
  de esta fase): Dashboard Empresa, selector de empresa, Configuración Empresa, Tutoriales Empresa, todas
  las rutas empresariales (`/app/empresa`, `/app/financiero`, `/app/indicadores`, `/app/obligaciones`,
  `/app/simulador`, `/app/marketplace`, `/app/plan`), y las páginas públicas principales
  (`/`, `/como-funciona`, `/planes`, `/login`, `/signup`) — deben verse y comportarse exactamente igual que
  antes de iniciar la Fase 10.
- [ ] **Step 5:** Recorrido final de los criterios de aceptación de la Sección 41 del prompt que no se
  cubrieron ya en las verificaciones de las Fases 10-12 (rol real en sesión, sidebar de 5 secciones en el
  orden correcto, sin selector de empresa ni alertas tributarias para Colaborador, Configuración sin
  disponibilidad/modalidad/plan, notificaciones con las 5 categorías exactas, campana usa
  `notificacion_colaborador`, Tutoriales solo con módulos de Colaborador, móvil funcional en 360/390px,
  build limpio).
- [ ] **Step 6:** Commit `feat: completar resolver de rol para Configuracion` (si Step 1 no se comiteó ya
  como parte de la Tarea 3).
