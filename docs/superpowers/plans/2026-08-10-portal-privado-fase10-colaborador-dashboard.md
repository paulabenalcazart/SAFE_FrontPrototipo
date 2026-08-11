# Portal Privado — Fase 10 (Rol Colaborador: sesión + shell + Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introducir el rol `COLABORADOR` como segunda identidad de sesión completa del portal privado —
login, modelo de datos, shell (Sidebar/Topbar/AccountMenu) role-aware, y el Dashboard Colaborador con sus 4
KPIs, disponibilidad, solicitud nueva y rendimiento mensual — todo derivado de un seed determinístico, sin
tocar el comportamiento visible del rol Empresa.

**Architecture:** Mismo patrón que las Fases 1-9: React Context (`PortalDataContext`) con estado en memoria,
sin backend/MSW/test runner (ver "Desviaciones deliberadas" en el spec de esta fase). Se reutiliza y amplía
el modelo de datos de Marketplace (Fase 7: `ColaboradorMarketplace`, `ServicioProfesional`,
`HorarioDisponibilidad`, `SolicitudContacto`) en lugar de crear una entidad paralela. El shell
(`Sidebar`/`Topbar`/`AccountMenu`) se vuelve role-aware leyendo `useAuth().user.role`, preservando intacta
la rama Empresa existente.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4 CSS-first,
react-router-dom 6, lucide-react. Sin dependencias nuevas.

## Global Constraints

- Trabajar sobre la rama `dylan_cd` y preservar cualquier cambio ajeno que aparezca durante la ejecución.
- Fuente normativa de alcance: `docs/superpowers/specs/2026-08-10-portal-privado-fase10-13-colaborador-design.md`
  (decisiones compartidas por las 4 fases) y `SAFE_PROMPT_2_PERFIL_COLABORADOR.md` (aportado por el usuario).
- Rutas bajo `/app/` (no rutas sin prefijo) — desviación deliberada del prompt, documentada y confirmada.
- Sin MSW, sin repositorio mock separado, sin test runner — desviación deliberada, documentada y confirmada.
  Verificación de cada tarea: `npm run build` limpio + recorrido manual en el navegador.
- No modificar el comportamiento ni el resultado visual de ninguna pantalla de Empresa ya construida
  (Fases 1-9). Los archivos compartidos (`Sidebar.tsx`, `Topbar.tsx`, `AccountMenu.tsx`, `types.ts`,
  `PortalDataContext.tsx`, `marketplace/catalogo.ts`, `App.tsx`, `AuthContext.tsx`) se **amplían**, nunca se
  reescriben ni se les quita código existente.
- El sidebar de Colaborador se agrega completo (5 secciones, orden fijo de la Sección 6 del prompt) en esta
  fase, aunque las rutas de `/app/perfil` y `/app/solicitudes` recién se implementen en las Fases 11 y 12: el
  catch-all `<Route path="*" element={<Navigate to="dashboard" replace />} />` ya existente hace que
  clickear esas dos entradas redirija a Dashboard hasta que su fase respectiva las implemente. Es un estado
  transitorio esperado entre fases, no un bug de esta fase.
- Fecha "hoy" fija del prototipo, reutilizada de Marketplace (`HOY_MARKETPLACE` en
  `src/portal/marketplace/calculo.ts`): `'2026-08-13'`. Todo cálculo de "este mes" en Colaborador usa esta
  misma fecha ancla, para quedar consistente con el resto del prototipo.
- Ejecutar `npm run build` después de cada tarea.
- Cada tarea requiere revisión de cumplimiento del spec y luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                      # Modify: RoleRoute, login por correo, resolver /app/dashboard
├── auth/AuthContext.tsx                         # Modify: AppRole, colaboradorId, telefono/pais/ciudad
├── components/LoginPage.tsx                     # Modify: correo controlado
├── components/SignupPage.tsx                    # Modify: correo controlado
└── portal/
    ├── types.ts                                 # Modify: tipos nuevos/ampliados de Colaborador
    ├── PortalDataContext.tsx                    # Modify: franjas de Colaborador
    ├── data/mock-portal-data.ts                 # Modify: navItemsEmpresa (rename) + navItemsColaborador
    ├── components/
    │   ├── Sidebar.tsx                          # Modify: nav + footer role-aware
    │   ├── Topbar.tsx                            # Modify: izquierda/alertas/notificaciones role-aware
    │   ├── AccountMenu.tsx                       # Modify: enlaces role-aware
    │   └── CompanyIdentity.tsx                   # Create
    ├── marketplace/catalogo.ts                   # Modify: especialidades[] + colaboradora demo + sus servicios/horarios
    └── colaborador/
        ├── calculo.ts                            # Create: KPIs, disponibilidad, rendimiento mensual
        ├── semilla.ts                            # Create: solicitudes/citas/notificaciones/preferencias
        └── dashboard/CollaboratorDashboardScreen.tsx  # Create
```

---

### Task 1: Tipos de dominio de Colaborador en `types.ts`

**Files:**
- Modify: `src/portal/types.ts`

**Interfaces:**
- Produces: `EspecialidadColaboradorRelacion`, `EstadoSolicitudContacto`, `Cita`, `EstadoCita`,
  `PrioridadNotificacionColaborador`, `NotificacionColaborador`, `CategoriaNotificacionColaborador`,
  `FrecuenciaNotificacionColaborador`, `PreferenciaNotificacionColaborador` — usados por todas las tareas
  siguientes de esta fase y por las Fases 11-13. `ColaboradorMarketplace` y `SolicitudContacto` amplían su
  forma existente (mismos nombres, campos nuevos).

- [ ] **Step 1:** Agregar `EspecialidadColaboradorRelacion` justo antes de `ColaboradorMarketplace`:

```ts
export type EspecialidadColaboradorRelacion = {
  especialidadId: string
  esPrincipal: boolean
  aniosExperiencia: number
  activo: boolean
}
```

- [ ] **Step 2:** Ampliar `ColaboradorMarketplace` (agregar los 4 campos al final del tipo existente, sin
  quitar ninguno de los actuales):

```ts
export type ColaboradorMarketplace = {
  // ...todos los campos existentes se mantienen sin cambios...
  fotoPerfilUrl?: string
  cvUrl?: string
  archivoCredencialUrl?: string
  especialidades: EspecialidadColaboradorRelacion[]
}
```

- [ ] **Step 3:** Ampliar `SolicitudContacto`: agregar `EstadoSolicitudContacto` y reemplazar el campo
  `estado: 'ENVIADA'` por `estado: EstadoSolicitudContacto`, agregando `empresaId` y los 3 campos opcionales:

```ts
export type EstadoSolicitudContacto =
  | 'PENDIENTE_PAGO'
  | 'PAGADA'
  | 'ENVIADA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'CONTACTO_LIBERADO'
  | 'FINALIZADA'

export type SolicitudContacto = {
  id: string
  empresaId: string
  colaboradorId: string
  servicioId: string
  fechaPreferida: string
  horaPreferida: string
  descripcion: string
  estado: EstadoSolicitudContacto
  fechaRespuesta?: string
  motivoRechazo?: string
  contactoLiberadoAt?: string
  createdAt: string
}
```

  `NuevaSolicitudContacto = Omit<SolicitudContacto, 'id' | 'estado' | 'createdAt'>` ya existe debajo y no
  necesita cambios — al ampliar `SolicitudContacto` con `empresaId`, el tipo derivado ya lo incluye
  automáticamente como campo requerido, lo cual es correcto porque `enviarSolicitudContacto` en
  `PortalDataContext` ya recibe `empresaId` como parámetro separado (Tarea 7 lo une en el objeto).

- [ ] **Step 4:** Agregar `Cita` y `EstadoCita`, después de `SolicitudContacto`/`NuevaSolicitudContacto`:

```ts
export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA'

export type Cita = {
  id: string
  solicitudContactoId: string
  colaboradorId: string
  fechaInicio: string
  fechaFin: string
  modalidad: Exclude<ModalidadAtencion, 'AMBAS'>
  estado: EstadoCita
  enlaceReunion?: string
  ubicacion?: string
  motivoCancelacion?: string
  createdAt: string
}
```

- [ ] **Step 5:** Agregar los tipos de notificaciones y preferencias de Colaborador, al final del archivo:

```ts
export type PrioridadNotificacionColaborador = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE'

export type NotificacionColaborador = {
  id: string
  tipo: string
  titulo: string
  mensaje: string
  prioridad: PrioridadNotificacionColaborador
  leida: boolean
  enlaceDestino?: string
  createdAt: string
}

export type CategoriaNotificacionColaborador =
  | 'NEW_REQUEST'
  | 'APPOINTMENT_REMINDER'
  | 'CANCELLATION_RESCHEDULE'
  | 'NEW_REVIEW'
  | 'PRODUCT_UPDATES'

export type FrecuenciaNotificacionColaborador = 'INMEDIATA' | 'DIARIA' | 'SEMANAL' | 'MENSUAL' | 'NINGUNA'

export type PreferenciaNotificacionColaborador = {
  categoria: CategoriaNotificacionColaborador
  correoActivo: boolean
  frecuencia: FrecuenciaNotificacionColaborador
}
```

- [ ] **Step 6:** `npm run build`. Fallará en `src/portal/marketplace/catalogo.ts` (los 12 colaboradores
  seed no tienen `especialidades`) y en cualquier lugar que construya un `SolicitudContacto` sin `empresaId`
  (`PortalDataContext.enviarSolicitudContacto`). Confirmar que **son exactamente esos dos** los únicos
  errores — es lo esperado, se resuelven en las Tareas 4 y 7. Si aparece un tercer error inesperado,
  detenerse e investigar antes de continuar.
- [ ] **Step 7:** Commit `feat: agregar tipos de dominio de Colaborador (especialidad, cita, notificacion)`.

---

### Task 2: `AuthContext` gana rol, `colaboradorId` y datos de contacto

**Files:**
- Modify: `src/auth/AuthContext.tsx`

**Interfaces:**
- Produces: `AppRole`, `AuthUser { role, colaboradorId?, telefono, pais, ciudad, ... }` para todas las tareas
  siguientes de esta fase y las Fases 11-13.

- [ ] **Step 1:** Agregar `export type AppRole = 'EMPRESA' | 'COLABORADOR'` antes de `AuthUser`.
- [ ] **Step 2:** Ampliar `AuthUser`:

```ts
export type AuthUser = {
  role: AppRole
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  pais: string
  ciudad: string
  iniciales: string
  mfaHabilitado: boolean
  colaboradorId?: string
}
```

- [ ] **Step 3:** Ampliar la firma de `updateUser` para incluir `telefono`, `pais` y `ciudad` en el `Pick`
  (la Fase 11 los necesita editables desde "Información personal", Sección 12.2/13.2 del prompt — son datos
  personales de `usuario`, distintos de `paisAtencion`/`ciudadAtencion` que viven en `colaboradorPerfil`):

```ts
updateUser: (
  patch: Partial<Pick<AuthUser, 'nombres' | 'apellidos' | 'correo' | 'telefono' | 'pais' | 'ciudad'>>,
) => void
```

  (el cuerpo de `updateUser` ya hace spread de `patch` sobre `current`, no necesita más cambios que la
  firma del tipo).
- [ ] **Step 4:** `readStoredUser`: el guard existente descarta sesiones sin `nombres`/`apellidos` string
  (pre-Fase 9). Ampliarlo para también descartar sesiones sin `role` válido, así una sesión guardada antes de
  esta fase no rompe el portal al recargar:

```ts
function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthUser>
    if (typeof parsed.nombres !== 'string' || typeof parsed.apellidos !== 'string') return null
    if (parsed.role !== 'EMPRESA' && parsed.role !== 'COLABORADOR') return null
    return parsed as AuthUser
  } catch {
    return null
  }
}
```

- [ ] **Step 5:** `npm run build`. Fallará en `src/App.tsx` (los 2 `login({...})` no tienen `role` ni
  `telefono`/`pais`/`ciudad`) — se resuelve en la Tarea 3.
- [ ] **Step 6:** Commit `feat: agregar rol y datos de contacto a AuthUser`.

---

### Task 3: Login por correo + `RoleRoute` + resolver de `/app/dashboard`

**Files:**
- Modify: `src/components/LoginPage.tsx`, `src/components/SignupPage.tsx`, `src/App.tsx`

**Interfaces:**
- Consumes: `AppRole`, `AuthUser` de Task 2.
- Produces: `RoleRoute` (usado también por las Fases 11-13 para envolver sus rutas exclusivas de rol).

- [ ] **Step 1:** `LoginPage.tsx` — hacer el campo de correo controlado y devolver su valor al confirmar,
  sin cambiar nada del layout/clases:

```tsx
export function LoginPage({
  onIngresar,
  onRecuperar,
  onIrInicio,
  onIrCrearCuenta,
}: {
  onIngresar?: (correo: string) => void
  onRecuperar: () => void
  onIrInicio?: () => void
  onIrCrearCuenta?: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [correo, setCorreo] = useState('')
  // ...
  <form
    className="mt-7 space-y-5"
    onSubmit={(e) => {
      e.preventDefault()
      onIngresar?.(correo)
    }}
  >
    <div>
      <Label htmlFor="login-email">Correo electrónico</Label>
      <Input
        id="login-email"
        type="email"
        autoComplete="email"
        placeholder="tu@empresa.ec"
        className="mt-1.5 h-11"
        value={correo}
        onChange={(e) => setCorreo(e.target.value)}
        required
      />
    </div>
    {/* resto del formulario sin cambios */}
```

- [ ] **Step 2:** `SignupPage.tsx` — mismo patrón: buscar el prop `onCrearCuenta` y su `<Input type="email">`
  de correo, hacerlo controlado, cambiar la firma a `onCrearCuenta?: (correo: string) => void` y pasar el
  valor tipeado en el submit. (Si `SignupPage` no captura contraseña/otros campos de forma controlada, no
  tocarlos — solo el campo de correo.)
- [ ] **Step 3:** `App.tsx` — reemplazar los 2 objetos `login({...})` hardcodeados por una función que decide
  el rol según el correo tipeado. Agregar antes de `PublicLayout`:

```ts
const CORREO_COLABORADOR_DEMO = 'maria.lopez@safe-demo.ec'

const usuarioEmpresaDemo: AuthUser = {
  role: 'EMPRESA',
  nombres: 'María Fernanda',
  apellidos: 'Torres',
  correo: 'maria.torres@textilesandina.ec',
  telefono: '+593 99 812 4410',
  pais: 'Ecuador',
  ciudad: 'Quito',
  iniciales: 'MT',
  mfaHabilitado: false,
}

const usuarioColaboradorDemo: AuthUser = {
  role: 'COLABORADOR',
  nombres: 'María Fernanda',
  apellidos: 'López Goncalves',
  correo: CORREO_COLABORADOR_DEMO,
  telefono: '+593 99 920 0113',
  pais: 'Ecuador',
  ciudad: 'Guayaquil',
  iniciales: 'ML',
  mfaHabilitado: false,
  colaboradorId: 'col-mfl',
}
```

  (importar `AuthUser` desde `./auth/AuthContext`). Dentro de `PublicLayout`, reemplazar los dos
  `onIngresar={() => { login({...}); navigate(...) }}` / `onCrearCuenta={() => { login({...}); ... }}` por:

```ts
const loginDemo = (correoTipeado: string) => {
  const esColaborador = correoTipeado.trim().toLowerCase() === CORREO_COLABORADOR_DEMO
  login(esColaborador ? usuarioColaboradorDemo : usuarioEmpresaDemo)
  navigate('/app/dashboard')
}
```

  y usar `onIngresar={loginDemo}` / `onCrearCuenta={loginDemo}` en los `<Route path="/login">` y
  `<Route path="/signup">`. Cualquier correo que no sea exactamente `maria.lopez@safe-demo.ec` (incluida la
  cadena vacía, que el campo `required` nunca deja llegar al submit) loguea como Empresa — preserva el
  comportamiento actual para quien no conozca el correo demo de Colaborador.
- [ ] **Step 4:** `App.tsx` — agregar el componente `RoleRoute` (después de los imports, antes de
  `PublicLayout`):

```tsx
import type { AppRole } from './auth/AuthContext'

function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}
```

  (agregar `import type { ReactNode } from 'react'` si no está ya importado — `App.tsx` ya usa `useEffect`
  de `'react'`, agregar `ReactNode` al mismo import type-only o uno nuevo).
- [ ] **Step 5:** `App.tsx` — envolver **todas** las rutas exclusivas de Empresa dentro de `<Route path="/app">`
  con `<RoleRoute allow={['EMPRESA']}>`. Son: `empresa`, `empresa/registrar`, `empresa/editar`, `financiero`
  y sus 4 sub-rutas, `indicadores` y sus 3 sub-rutas, `obligaciones` y su sub-ruta, `simulador` y su
  sub-ruta, `marketplace` y su sub-ruta, `plan` y sus 4 sub-rutas. Patrón (repetir para cada una, el
  `element` interior no cambia):

```tsx
<Route path="empresa" element={<RoleRoute allow={['EMPRESA']}><EmpresaScreen /></RoleRoute>} />
```

- [ ] **Step 6:** `App.tsx` — reemplazar la ruta `dashboard` fija por un resolver de rol. Crear
  `DashboardResolver` junto a `RoleRoute`:

```tsx
function DashboardResolver() {
  const { user } = useAuth()
  return user?.role === 'COLABORADOR' ? <CollaboratorDashboardScreen /> : <DashboardScreen />
}
```

  y cambiar `<Route path="dashboard" element={<DashboardScreen />} />` por
  `<Route path="dashboard" element={<DashboardResolver />} />`. Importar `CollaboratorDashboardScreen` desde
  `./portal/colaborador/dashboard/CollaboratorDashboardScreen` (se crea en la Tarea 9 de esta fase — hasta
  entonces este import fallará; ejecutar esta Tarea 3 completa recién después de la Tarea 9, o dejar un
  `DashboardResolver` temporal que solo devuelva `<DashboardScreen />` y completar el `if` en la Tarea 9). Se
  recomienda implementar este Step 6 al final, como parte de la Tarea 9 (Dashboard Colaborador), para no
  dejar un import roto entre tareas — el resto de los Steps de esta Tarea 3 (login por correo, `RoleRoute`,
  rutas Empresa envueltas) sí se completan y commitean aquí.
- [ ] **Step 7:** `npm run build`. Debe compilar limpio salvo el resolver de dashboard (ver Step 6 — si se
  deja pendiente, dejar temporalmente `<Route path="dashboard" element={<DashboardScreen />} />` sin tocar y
  no crear `DashboardResolver` todavía; se agrega en la Tarea 9).
- [ ] **Step 8:** Verificación manual: `npm run dev`, loguear con cualquier correo/contraseña de prueba en
  `/login` → debe seguir llegando a `/app/dashboard` con el usuario Empresa de siempre (regresión). Loguear
  con `maria.lopez@safe-demo.ec` (cualquier contraseña) → debe loguear como Colaborador (aunque el Dashboard
  Colaborador todavía no exista, esto se verifica en detalle en la Tarea 9).
- [ ] **Step 9:** Commit `feat: agregar login por correo y RoleRoute para el rol Colaborador`.

---

### Task 4: Colaboradora demo + especialidades en `marketplace/catalogo.ts`

**Files:**
- Modify: `src/portal/marketplace/catalogo.ts`

**Interfaces:**
- Consumes: `EspecialidadColaboradorRelacion`, `ColaboradorMarketplace` ampliado (Task 1).
- Produces: colaborador `id: 'col-mfl'` en `COLABORADORES_MARKETPLACE`, sus entradas en
  `SERVICIOS_PROFESIONALES`/`HORARIOS_DISPONIBILIDAD`, consumidos por la Tarea 7 (`PortalDataContext`) y por
  las Fases 11-12.

- [ ] **Step 1:** Agregar 3 especialidades nuevas a `ESPECIALIDADES_PROFESIONALES` (mismo array, mismo
  patrón `[id, codigo, nombre, categoria]`), agregando estas 3 filas al array de tuplas existente antes del
  `.map(...)`:

```ts
["planificacion-financiera", "PLANIFICACION_FINANCIERA", "Planificación financiera", "Financiero"],
["finanzas-corporativas", "FINANZAS_CORPORATIVAS", "Finanzas corporativas", "Financiero"],
["analisis-financiero", "ANALISIS_FINANCIERO", "Análisis financiero", "Financiero"],
```

- [ ] **Step 2:** Corregir `crearColaborador` para que derive `especialidades` automáticamente a partir de
  `especialidadIds`/`especialidadPrincipalId`/`aniosExperiencia` — así ninguno de los 12 colaboradores
  existentes necesita cambiar su literal. Reemplazar el bloque `ColaboradorSemilla`/`crearColaborador`:

```ts
type ColaboradorSemilla = Omit<
  ColaboradorMarketplace,
  | "paisAtencion"
  | "zonaHoraria"
  | "estadoDisponibilidad"
  | "visibleMarketplace"
  | "estado"
  | "especialidades"
>;
const crearColaborador = (
  datos: ColaboradorSemilla,
): ColaboradorMarketplace => ({
  ...datos,
  paisAtencion: "Ecuador",
  zonaHoraria: "America/Guayaquil",
  estadoDisponibilidad: "DISPONIBLE",
  visibleMarketplace: true,
  estado: "ACTIVO",
  especialidades: datos.especialidadIds.map((especialidadId) => ({
    especialidadId,
    esPrincipal: especialidadId === datos.especialidadPrincipalId,
    aniosExperiencia: datos.aniosExperiencia,
    activo: true,
  })),
});
```

  (`fotoPerfilUrl`/`cvUrl`/`archivoCredencialUrl` son opcionales en el tipo, así que no necesitan entrar en
  el `Omit` ni tener valor por defecto aquí — quedan `undefined` para los 12 colaboradores existentes, que
  no los usaban).
- [ ] **Step 3:** Agregar la colaboradora demo como literal completo (no vía `crearColaborador`, porque sus
  3 especialidades tienen años de experiencia distintos entre sí — 8/6/5 — algo que el auto-derive del Step
  2 no puede expresar). Agregar al final de `COLABORADORES_MARKETPLACE`, antes del `]` de cierre:

```ts
  {
    id: "col-mfl",
    nombres: "María Fernanda",
    apellidos: "López Goncalves",
    areaEspecializacion: "Finanzas",
    profesion: "Consultora Financiera",
    trabajoActual: "Asesora financiera independiente",
    descripcionProfesional:
      "Consultora financiera con 8 años de experiencia acompañando a PYMES ecuatorianas en planificación financiera, estructura de costos y análisis para toma de decisiones.",
    modalidadAtencion: "AMBAS",
    paisAtencion: "Ecuador",
    ciudadAtencion: "Guayaquil",
    zonaHoraria: "America/Guayaquil",
    tarifaReferencial: 35,
    aniosExperiencia: 8,
    cvVisible: true,
    estadoDisponibilidad: "DISPONIBLE",
    visibleMarketplace: true,
    estado: "ACTIVO",
    especialidades: [
      { especialidadId: "esp-planificacion-financiera", esPrincipal: true, aniosExperiencia: 8, activo: true },
      { especialidadId: "esp-finanzas-corporativas", esPrincipal: false, aniosExperiencia: 6, activo: true },
      { especialidadId: "esp-analisis-financiero", esPrincipal: false, aniosExperiencia: 5, activo: true },
    ],
    especialidadIds: ["esp-planificacion-financiera", "esp-finanzas-corporativas", "esp-analisis-financiero"],
    especialidadPrincipalId: "esp-planificacion-financiera",
    calificacionPromedio: 4.8,
    cantidadResenas: 39,
  },
```

  (`calificacionPromedio`/`cantidadResenas` quedan fijos aquí porque `ColaboradorMarketplace` los modela
  como columnas propias, no derivadas — igual que los otros 12 seeds; la Tarea 5 de esta fase agrega las 39
  reseñas reales a `RESENAS_COLABORADORES` para que el Dashboard/Perfil de Colaborador, que sí calculan el
  promedio a partir de las reseñas — Tarea 6 —, lleguen al mismo 4.8 de forma derivada).
- [ ] **Step 4:** Agregar sus 4 servicios a `SERVICIOS_PROFESIONALES`, usando el helper `crearServicios` ya
  existente (agregar antes del `]` de cierre del array, con `...crearServicios("col-mfl", [...])`):

```ts
  ...crearServicios("col-mfl", [
    crearServicio(
      "Diagnóstico financiero",
      "Lectura ejecutiva de liquidez, rentabilidad y estructura financiera del negocio.",
      60,
      35,
      "VIRTUAL",
    ),
    crearServicio(
      "Planificación financiera",
      "Plan financiero a 12 meses con metas, supuestos y seguimiento mensual.",
      90,
      55,
      "AMBAS" as never, // ver nota
      // corregido abajo
    ),
  ]),
```

  Nota: `ServicioProfesional['modalidad']` es `Exclude<ModalidadAtencion,'AMBAS'>` (un servicio individual no
  puede ser "AMBAS", eso es propiedad del colaborador en general — ver `types.ts`). Usar `"VIRTUAL"` o
  `"PRESENCIAL"` por servicio, no `"AMBAS"`. Los 4 servicios reales a crear (reemplaza el bloque anterior
  completo):

```ts
  ...crearServicios("col-mfl", [
    crearServicio(
      "Diagnóstico financiero",
      "Lectura ejecutiva de liquidez, rentabilidad y estructura financiera del negocio.",
      60,
      35,
      "VIRTUAL",
    ),
    crearServicio(
      "Planificación financiera",
      "Plan financiero a 12 meses con metas, supuestos y seguimiento mensual.",
      90,
      55,
      "VIRTUAL",
    ),
    crearServicio(
      "Revisión de flujo de caja",
      "Revisión guiada de cobros y pagos proyectados para anticipar meses críticos.",
      60,
      30,
      "VIRTUAL",
    ),
    crearServicio(
      "Asesoría para financiamiento",
      "Preparación de información financiera y alternativas para solicitar crédito.",
      90,
      45,
      "PRESENCIAL",
    ),
  ]),
```

- [ ] **Step 5:** Agregar sus horarios a `HORARIOS_DISPONIBILIDAD`. El helper `crearHorarios` existente solo
  admite un rango/modalidad por llamada para un conjunto de días — la semilla de la Sección 35.5 del prompt
  necesita bloques distintos por día (incluida una modalidad mixta miércoles/jueves y un bloque partido el
  lunes), así que se agregan como literales directos, con el mismo formato `id`/`colaboradorId`/etc. que ya
  produce `crearHorarios`, al final del array `HORARIOS_DISPONIBILIDAD`:

```ts
  {
    id: "hor-col-mfl-1a",
    colaboradorId: "col-mfl",
    diaSemana: 1,
    horaInicio: "08:00",
    horaFin: "12:00",
    modalidad: "VIRTUAL",
    activo: true,
  },
  {
    id: "hor-col-mfl-1b",
    colaboradorId: "col-mfl",
    diaSemana: 1,
    horaInicio: "14:00",
    horaFin: "17:00",
    modalidad: "PRESENCIAL",
    activo: true,
  },
  { id: "hor-col-mfl-2", colaboradorId: "col-mfl", diaSemana: 2, horaInicio: "08:00", horaFin: "17:00", modalidad: "VIRTUAL", activo: true },
  { id: "hor-col-mfl-3", colaboradorId: "col-mfl", diaSemana: 3, horaInicio: "08:00", horaFin: "12:00", modalidad: "AMBAS", activo: true },
  { id: "hor-col-mfl-4", colaboradorId: "col-mfl", diaSemana: 4, horaInicio: "09:00", horaFin: "17:00", modalidad: "AMBAS", activo: true },
  { id: "hor-col-mfl-5", colaboradorId: "col-mfl", diaSemana: 5, horaInicio: "08:00", horaFin: "15:00", modalidad: "VIRTUAL", activo: true },
  { id: "hor-col-mfl-6", colaboradorId: "col-mfl", diaSemana: 6, horaInicio: "09:00", horaFin: "12:00", modalidad: "VIRTUAL", activo: true },
```

  (sin bloque domingo — `diaSemana: 7` — queda "No disponible" por ausencia, tal como pide la Sección 35.5).
- [ ] **Step 6:** `npm run build` limpio.
- [ ] **Step 7:** Commit `feat: agregar colaboradora demo (col-mfl) con especialidades, servicios y horarios`.

---

### Task 5: Reseñas de la colaboradora demo en `RESENAS_COLABORADORES`

**Files:**
- Modify: `src/portal/marketplace/catalogo.ts`

**Interfaces:**
- Consumes: `crearResenas`/`crearResena` (helpers ya existentes en el mismo archivo).
- Produces: 39 reseñas `PUBLICADA` para `col-mfl` en `RESENAS_COLABORADORES`, consumidas por la Tarea 6
  (cálculo del promedio) y por la Fase 11 (sección de reseñas del Perfil).

- [ ] **Step 1:** Generar las 39 reseñas con un pool de empresas/comentarios cíclico (evita 39 literales a
  mano, mismo espíritu que los generadores de `semilla.ts` de la Tarea 6). Agregar antes de
  `export const RESENAS_COLABORADORES`:

```ts
const EMPRESAS_RESENA_MFL = [
  "Textiles Andina S.A.",
  "Comercial del Valle Cía. Ltda.",
  "Panadería La Colina",
  "Muebles Austro",
  "Logística Azul",
  "Ferretería Ambato",
  "Distribuidora Pacífico",
  "Café Sierra Norte",
  "Constructora Horizonte",
  "AgroLoja",
  "Calzado Manabí",
  "Importadora Central",
  "Hostería Tomebamba",
];

const COMENTARIOS_RESENA_MFL = [
  "Nos ayudó a ordenar el flujo de caja y anticipar dos meses complicados.",
  "El plan financiero quedó claro y con metas realistas para el equipo.",
  "Explicó cada indicador con ejemplos concretos de nuestro negocio.",
  "La preparación para el crédito fue detallada y nos dio confianza con el banco.",
  "Seguimiento puntual y recomendaciones fáciles de aplicar cada mes.",
  "Identificó gastos que no estábamos controlando y propuso ajustes simples.",
];

function crearResenasMasivas(
  colaboradorId: string,
  cantidad: number,
  fechaBase: string,
): ResenaColaborador[] {
  return Array.from({ length: cantidad }, (_, indice) => {
    const calificacion = indice % 5 === 0 ? 4 : 5; // ~80% 5 estrellas, ~20% 4 -> promedio 4.8
    const [anio, mes, dia] = fechaBase.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    fecha.setUTCDate(fecha.getUTCDate() - indice * 5);
    return {
      id: `res-${colaboradorId}-${String(indice + 1).padStart(3, "0")}`,
      colaboradorId,
      autorEmpresa: EMPRESAS_RESENA_MFL[indice % EMPRESAS_RESENA_MFL.length],
      calificacion: calificacion as ResenaColaborador["calificacion"],
      comentario: COMENTARIOS_RESENA_MFL[indice % COMENTARIOS_RESENA_MFL.length],
      fecha: fecha.toISOString().slice(0, 10),
      estado: "PUBLICADA",
    };
  });
}
```

- [ ] **Step 2:** Agregar `...crearResenasMasivas("col-mfl", 39, "2026-08-10")` como una entrada más dentro
  del array `RESENAS_COLABORADORES` (junto a los `...crearResenas("col-01", [...])`, etc. ya existentes).
- [ ] **Step 3:** Verificar a mano: 39 reseñas, `indice % 5 === 0` cubre índices 0,5,10,...,35 → 8 reseñas de
  4 estrellas, 31 de 5 estrellas. Promedio = (8×4 + 31×5)/39 = (32+155)/39 = 187/39 ≈ 4.795 → redondea a 4.8
  con un decimal, igual al `calificacionPromedio` fijo de la Tarea 4. Si el conteo de la fase de ejecución
  difiere (por ejemplo, se cambia `cantidad`), recalcular esta proporción para mantener el promedio en 4.8.
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Commit `feat: agregar 39 reseñas semilla de la colaboradora demo`.

---

### Task 6: `src/portal/colaborador/calculo.ts` — funciones puras

**Files:**
- Create: `src/portal/colaborador/calculo.ts`

**Interfaces:**
- Consumes: `SolicitudContacto`, `Cita`, `HorarioDisponibilidad`, `ResenaColaborador` (Task 1 + existentes).
- Produces: todas las funciones siguientes, usadas por la Tarea 9 (Dashboard) y por las Fases 11-12.

- [ ] **Step 1:** Crear el archivo con las funciones de KPIs simples:

```ts
import type { Cita, HorarioDisponibilidad, ResenaColaborador, SolicitudContacto } from '@/portal/types'

export function inicialesDeNombre(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  const primera = palabras[0]?.[0] ?? ''
  const segunda = palabras.length > 1 ? palabras[palabras.length - 1][0] : ''
  return `${primera}${segunda}`.toUpperCase()
}

export function contarSolicitudesPendientes(solicitudes: SolicitudContacto[]): number {
  return solicitudes.filter((s) => s.estado === 'ENVIADA').length
}

function mesDeIso(iso: string): string {
  return iso.slice(0, 7) // 'YYYY-MM'
}

export function contarCitasEsteMes(citas: Cita[], hoyIso: string): number {
  const mesActual = mesDeIso(hoyIso)
  return citas.filter(
    (c) => (c.estado === 'PROGRAMADA' || c.estado === 'CONFIRMADA') && mesDeIso(c.fechaInicio) === mesActual,
  ).length
}

export function contarServiciosCompletados(citas: Cita[]): number {
  return citas.filter((c) => c.estado === 'COMPLETADA').length
}

export function contarCitasConfirmadasTotales(citas: Cita[]): number {
  return citas.filter((c) => c.estado === 'CONFIRMADA').length
}

export function contarCitasConfirmadasEsteMes(citas: Cita[], hoyIso: string): number {
  const mesActual = mesDeIso(hoyIso)
  return citas.filter((c) => c.estado === 'CONFIRMADA' && mesDeIso(c.fechaInicio) === mesActual).length
}

export function calcularCalificacionPromedio(
  resenas: ResenaColaborador[],
): { promedio: number | null; cantidad: number } {
  const publicadas = resenas.filter((r) => r.estado === 'PUBLICADA')
  if (publicadas.length === 0) return { promedio: null, cantidad: 0 }
  const suma = publicadas.reduce((acc, r) => acc + r.calificacion, 0)
  return { promedio: Math.round((suma / publicadas.length) * 10) / 10, cantidad: publicadas.length }
}
```

- [ ] **Step 2:** Agregar la agrupación de disponibilidad por día (Sección 11.2 del prompt):

```ts
export type BloqueDisponibilidad = { horaInicio: string; horaFin: string; modalidad: HorarioDisponibilidad['modalidad'] }
export type DiaDisponibilidad = { diaSemana: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string; bloques: BloqueDisponibilidad[] }

const DIAS_SEMANA_LABEL: Record<DiaDisponibilidad['diaSemana'], string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  7: 'Domingo',
}

export function agruparDisponibilidadPorDia(horarios: HorarioDisponibilidad[]): DiaDisponibilidad[] {
  const dias: DiaDisponibilidad['diaSemana'][] = [1, 2, 3, 4, 5, 6, 7]
  return dias.map((diaSemana) => ({
    diaSemana,
    label: DIAS_SEMANA_LABEL[diaSemana],
    bloques: horarios
      .filter((h) => h.activo && h.diaSemana === diaSemana)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
      .map((h) => ({ horaInicio: h.horaInicio, horaFin: h.horaFin, modalidad: h.modalidad })),
  }))
}
```

- [ ] **Step 3:** Agregar la solicitud más reciente y la tasa de aceptación (Secciones 11.3, 11.4, 21.4):

```ts
export function obtenerSolicitudMasReciente(solicitudes: SolicitudContacto[]): SolicitudContacto | null {
  const pendientes = solicitudes
    .filter((s) => s.estado === 'ENVIADA')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return pendientes[0] ?? null
}

const ACEPTADAS: SolicitudContacto['estado'][] = ['ACEPTADA', 'CONTACTO_LIBERADO', 'FINALIZADA']

export function calcularTasaAceptacion(
  solicitudes: SolicitudContacto[],
): { tasa: number | null; aceptadas: number; respondidas: number } {
  const aceptadas = solicitudes.filter((s) => ACEPTADAS.includes(s.estado)).length
  const rechazadas = solicitudes.filter((s) => s.estado === 'RECHAZADA').length
  const respondidas = aceptadas + rechazadas
  if (respondidas === 0) return { tasa: null, aceptadas, respondidas }
  return { tasa: Math.round((aceptadas / respondidas) * 1000) / 10, aceptadas, respondidas }
}
```

- [ ] **Step 4:** Agregar el cálculo de rendimiento mensual (Sección 11.4 — 4 métricas por semana del mes
  actual, más comparación con el mes anterior):

```ts
export type ClaveMetricaRendimiento = 'SERVICIOS' | 'HORAS' | 'TIEMPO_RESPUESTA' | 'TASA_ACEPTACION'

export type PuntoSemanal = { semana: number; valor: number }

export type MetricaRendimiento = {
  clave: ClaveMetricaRendimiento
  titulo: string
  unidad: string
  serie: PuntoSemanal[]
  totalEsteMes: number
  totalMesAnterior: number
  variacion: number | null
  menorEsMejor: boolean
}

function semanaDelMes(iso: string): number {
  const dia = Number(iso.slice(8, 10))
  return Math.min(4, Math.ceil(dia / 7))
}

function mesAnteriorIso(hoyIso: string): string {
  const [anio, mes] = hoyIso.slice(0, 7).split('-').map(Number)
  const fecha = new Date(Date.UTC(anio, mes - 2, 1))
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`
}

function horasEntre(inicioIso: string, finIso: string): number {
  return (new Date(finIso).getTime() - new Date(inicioIso).getTime()) / 3_600_000
}

function serieSemanal(items: { fecha: string; valor: number }[], mes: string): PuntoSemanal[] {
  const porSemana = new Map<number, number>()
  for (const item of items) {
    if (mesDeIso(item.fecha) !== mes) continue
    const semana = semanaDelMes(item.fecha)
    porSemana.set(semana, (porSemana.get(semana) ?? 0) + item.valor)
  }
  return [1, 2, 3, 4]
    .filter((semana) => porSemana.has(semana))
    .map((semana) => ({ semana, valor: Math.round((porSemana.get(semana) ?? 0) * 10) / 10 }))
}

function variacionPct(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 1000) / 10
}

export function calcularRendimientoMensual({
  citas,
  solicitudes,
  hoyIso,
}: {
  citas: Cita[]
  solicitudes: SolicitudContacto[]
  hoyIso: string
}): MetricaRendimiento[] {
  const mesActual = mesDeIso(hoyIso)
  const mesPrevio = mesAnteriorIso(hoyIso)

  const completadas = citas.filter((c) => c.estado === 'COMPLETADA')
  const completadasPorMes = (mes: string) => completadas.filter((c) => mesDeIso(c.fechaInicio) === mes)

  const respondidas = solicitudes.filter((s) => s.fechaRespuesta)
  const respondidasPorMes = (mes: string) =>
    respondidas.filter((s) => mesDeIso(s.fechaRespuesta as string) === mes)

  // 1. Servicios completados
  const servTotal = (mes: string) => completadasPorMes(mes).length
  const servSerie = serieSemanal(completadas.map((c) => ({ fecha: c.fechaInicio, valor: 1 })), mesActual)

  // 2. Horas de asesoría
  const horasTotal = (mes: string) =>
    Math.round(completadasPorMes(mes).reduce((acc, c) => acc + horasEntre(c.fechaInicio, c.fechaFin), 0) * 10) / 10
  const horasSerie = serieSemanal(
    completadas.map((c) => ({ fecha: c.fechaInicio, valor: horasEntre(c.fechaInicio, c.fechaFin) })),
    mesActual,
  )

  // 3. Tiempo medio de respuesta (horas)
  const tiempoRespuestaTotal = (mes: string) => {
    const items = respondidasPorMes(mes)
    if (items.length === 0) return 0
    const suma = items.reduce((acc, s) => acc + horasEntre(s.createdAt, s.fechaRespuesta as string), 0)
    return Math.round((suma / items.length) * 10) / 10
  }
  const tiempoRespuestaSerie = serieSemanal(
    respondidas.map((s) => ({
      fecha: s.fechaRespuesta as string,
      valor: horasEntre(s.createdAt, s.fechaRespuesta as string),
    })),
    mesActual,
  )

  // 4. Tasa de aceptación (%)
  const tasaTotal = (mes: string) => {
    const items = respondidasPorMes(mes)
    const aceptadas = items.filter((s) => ACEPTADAS.includes(s.estado)).length
    return items.length === 0 ? 0 : Math.round((aceptadas / items.length) * 1000) / 10
  }
  const tasaSerie = (() => {
    const porSemana = new Map<number, { aceptadas: number; total: number }>()
    for (const s of respondidas) {
      if (mesDeIso(s.fechaRespuesta as string) !== mesActual) continue
      const semana = semanaDelMes(s.fechaRespuesta as string)
      const actual = porSemana.get(semana) ?? { aceptadas: 0, total: 0 }
      actual.total += 1
      if (ACEPTADAS.includes(s.estado)) actual.aceptadas += 1
      porSemana.set(semana, actual)
    }
    return [1, 2, 3, 4]
      .filter((semana) => porSemana.has(semana))
      .map((semana) => {
        const { aceptadas, total } = porSemana.get(semana) as { aceptadas: number; total: number }
        return { semana, valor: total === 0 ? 0 : Math.round((aceptadas / total) * 1000) / 10 }
      })
  })()

  return [
    {
      clave: 'SERVICIOS',
      titulo: 'Servicios completados',
      unidad: '',
      serie: servSerie,
      totalEsteMes: servTotal(mesActual),
      totalMesAnterior: servTotal(mesPrevio),
      variacion: variacionPct(servTotal(mesActual), servTotal(mesPrevio)),
      menorEsMejor: false,
    },
    {
      clave: 'HORAS',
      titulo: 'Horas de asesoría',
      unidad: 'h',
      serie: horasSerie,
      totalEsteMes: horasTotal(mesActual),
      totalMesAnterior: horasTotal(mesPrevio),
      variacion: variacionPct(horasTotal(mesActual), horasTotal(mesPrevio)),
      menorEsMejor: false,
    },
    {
      clave: 'TIEMPO_RESPUESTA',
      titulo: 'Tiempo medio de respuesta',
      unidad: 'h',
      serie: tiempoRespuestaSerie,
      totalEsteMes: tiempoRespuestaTotal(mesActual),
      totalMesAnterior: tiempoRespuestaTotal(mesPrevio),
      variacion: variacionPct(tiempoRespuestaTotal(mesActual), tiempoRespuestaTotal(mesPrevio)),
      menorEsMejor: true,
    },
    {
      clave: 'TASA_ACEPTACION',
      titulo: 'Tasa de aceptación',
      unidad: '%',
      serie: tasaSerie,
      totalEsteMes: tasaTotal(mesActual),
      totalMesAnterior: tasaTotal(mesPrevio),
      variacion: variacionPct(tasaTotal(mesActual), tasaTotal(mesPrevio)),
      menorEsMejor: false,
    },
  ]
}
```

- [ ] **Step 5:** `npm run build` limpio (este archivo no se consume todavía, pero debe compilar de forma
  aislada — TypeScript lo revisa igual aunque nada lo importe aún).
- [ ] **Step 6:** Commit `feat: agregar funciones de calculo de KPIs y rendimiento de Colaborador`.

---

### Task 7: `src/portal/colaborador/semilla.ts` — solicitudes, citas, notificaciones, preferencias

**Files:**
- Create: `src/portal/colaborador/semilla.ts`

**Interfaces:**
- Consumes: `Empresa`, `SolicitudContacto`, `Cita`, `NotificacionColaborador`,
  `PreferenciaNotificacionColaborador` (Task 1 + existentes); `SERVICIOS_PROFESIONALES` filtrado por
  `col-mfl` (Task 4).
- Produces: `EMPRESAS_SOLICITANTES_SEMILLA`, `empresaSolicitantePorId`, `SOLICITUDES_COLABORADOR_SEMILLA`,
  `CITAS_COLABORADOR_SEMILLA`, `NOTIFICACIONES_COLABORADOR_SEMILLA`,
  `PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA` — consumidos por la Tarea 8 (`PortalDataContext`) y por
  las Fases 11-13.

- [ ] **Step 1:** Empresas solicitantes semilla — **deliberadamente independientes** de
  `empresasDisponibles`/`PortalDataContext.empresas` (el switcher "Tus empresas" de Empresa no debe listar
  compañías ajenas a la sesión de Empresa logueada). Son solo datos de lectura para que las pantallas de
  Colaborador puedan mostrar identidad de empresa real (Sección 18.1 del prompt: nombre comercial, razón
  social, RUC, responsable, actividad económica, ciudad, provincia):

```ts
import type {
  Cita,
  Empresa,
  EstadoSolicitudContacto,
  NotificacionColaborador,
  PreferenciaNotificacionColaborador,
  SolicitudContacto,
} from '@/portal/types'
import { SERVICIOS_PROFESIONALES } from '@/portal/marketplace/catalogo'

function crearEmpresaSolicitante(datos: {
  id: string
  nombre: string
  ruc: string
  iniciales: string
  actividadEconomica: string
  provincia: string
  ciudad: string
  responsable: string
  cedulaResponsable: string
}): Empresa {
  return {
    id: datos.id,
    nombre: datos.nombre,
    ruc: datos.ruc,
    iniciales: datos.iniciales,
    estado: 'Activa',
    plan: 'Plan Crecimiento',
    general: {
      razonSocial: datos.nombre,
      tipoContribuyente: 'Persona Jurídica',
      fechaConstitucion: '',
      numeroEmpleados: '',
    },
    fiscal: {
      regimenTributario: 'Régimen General',
      actividadEconomica: datos.actividadEconomica,
      obligadoContabilidad: 'Sí',
      agenteRetencion: 'No',
    },
    contacto: { correo: '', telefono: '', sitioWeb: '' },
    representante: { nombre: datos.responsable, cedula: datos.cedulaResponsable },
    ubicacion: { provincia: datos.provincia, ciudad: datos.ciudad, direccion: '' },
    meta: { fechaRegistroSafe: '' },
  }
}

export const EMPRESAS_SOLICITANTES_SEMILLA: Empresa[] = [
  crearEmpresaSolicitante({
    id: 'sol-emp-01', nombre: 'Panadería La Colina', ruc: '0991234567001', iniciales: 'PL',
    actividadEconomica: 'C1071 - Elaboración de productos de panadería', provincia: 'Guayas', ciudad: 'Guayaquil',
    responsable: 'Juan Carlos Pérez', cedulaResponsable: '0912345001',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-02', nombre: 'Muebles Austro', ruc: '0192345678001', iniciales: 'MA',
    actividadEconomica: 'C3100 - Fabricación de muebles', provincia: 'Azuay', ciudad: 'Cuenca',
    responsable: 'Pedro Mora Ramírez', cedulaResponsable: '0102345002',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-03', nombre: 'Logística Azul', ruc: '0993456789001', iniciales: 'LA',
    actividadEconomica: 'H4923 - Transporte de carga por carretera', provincia: 'Guayas', ciudad: 'Guayaquil',
    responsable: 'José Roca Vintimilla', cedulaResponsable: '0912345003',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-04', nombre: 'Ferretería Ambato', ruc: '1892345678001', iniciales: 'FA',
    actividadEconomica: 'G4752 - Venta al por menor de artículos de ferretería', provincia: 'Tungurahua', ciudad: 'Ambato',
    responsable: 'Lucía Cabrera Zamora', cedulaResponsable: '1802345004',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-05', nombre: 'AgroLoja', ruc: '1192345678001', iniciales: 'AL',
    actividadEconomica: 'A0111 - Cultivo de cereales', provincia: 'Loja', ciudad: 'Loja',
    responsable: 'Mateo Ibarra Nieto', cedulaResponsable: '1102345005',
  }),
  crearEmpresaSolicitante({
    id: 'sol-emp-06', nombre: 'Hostería Tomebamba', ruc: '0193456789001', iniciales: 'HT',
    actividadEconomica: 'I5510 - Actividades de alojamiento', provincia: 'Azuay', ciudad: 'Cuenca',
    responsable: 'Gabriela Mendoza Cruz', cedulaResponsable: '0102345006',
  }),
]

export function empresaSolicitantePorId(id: string): Empresa | undefined {
  return EMPRESAS_SOLICITANTES_SEMILLA.find((e) => e.id === id)
}
```

- [ ] **Step 2:** Generador de solicitudes+citas históricas (`FINALIZADA` + `Cita` `COMPLETADA`), suficientes
  para que `contarServiciosCompletados` derive **38** de forma orgánica (Sección 35.6 del prompt), repartidas
  en los 7 meses previos al "hoy" del prototipo (`'2026-08-13'`):

```ts
const HOY_COLABORADOR = '2026-08-13'
const SERVICIOS_MFL = SERVICIOS_PROFESIONALES.filter((s) => s.colaboradorId === 'col-mfl')

function fechaIsoDesde(hoyIso: string, diasAtras: number): string {
  const fecha = new Date(`${hoyIso}T12:00:00-05:00`)
  fecha.setUTCDate(fecha.getUTCDate() - diasAtras)
  return fecha.toISOString().slice(0, 10)
}

function construirHistoricoFinalizado(cantidad: number): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const diasAtras = 20 + i * 5 // reparte ~38 citas entre ~20 y ~205 días atrás (7 meses)
    const fechaCita = fechaIsoDesde(HOY_COLABORADOR, diasAtras)
    const fechaSolicitud = fechaIsoDesde(HOY_COLABORADOR, diasAtras + 4)
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, diasAtras + 3)
    const solicitudId = `sol-mfl-hist-${String(i + 1).padStart(3, '0')}`
    const horaInicio = ['08:00', '09:00', '10:00', '14:00'][i % 4]
    const [h, m] = horaInicio.split(':').map(Number)
    const fin = new Date(`${fechaCita}T${horaInicio}:00-05:00`)
    fin.setUTCMinutes(fin.getUTCMinutes() + servicio.duracionEstimadaMinutos)

    solicitudes.push({
      id: solicitudId,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaCita,
      horaPreferida: horaInicio,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'FINALIZADA',
      fechaRespuesta: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:00:00-05:00`,
      contactoLiberadoAt: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:05:00-05:00`,
      createdAt: `${fechaSolicitud}T10:00:00-05:00`,
    })

    citas.push({
      id: `cita-mfl-hist-${String(i + 1).padStart(3, '0')}`,
      solicitudContactoId: solicitudId,
      colaboradorId: 'col-mfl',
      fechaInicio: `${fechaCita}T${horaInicio}:00-05:00`,
      fechaFin: fin.toISOString(),
      modalidad: servicio.modalidad,
      estado: 'COMPLETADA',
      createdAt: `${fechaRespuesta}T${String(9 + (i % 6)).padStart(2, '0')}:05:00-05:00`,
    })
  }

  return { solicitudes, citas }
}
```

- [ ] **Step 3:** Generador de solicitudes "en curso" (`CONTACTO_LIBERADO` con `Cita` `CONFIRMADA` futura —
  18 en total según la Sección 35.6, de las cuales 5 caen en agosto 2026 = "este mes"):

```ts
function construirEnCurso(cantidad: number, cantidadEsteMes: number): {
  solicitudes: SolicitudContacto[]
  citas: Cita[]
} {
  const solicitudes: SolicitudContacto[] = []
  const citas: Cita[] = []

  for (let i = 0; i < cantidad; i++) {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    // Las primeras `cantidadEsteMes` caen en agosto (después del 13); el resto, en septiembre/octubre.
    const diasAdelante = i < cantidadEsteMes ? 2 + i * 3 : 20 + (i - cantidadEsteMes) * 4
    const fechaCita = (() => {
      const fecha = new Date(`${HOY_COLABORADOR}T12:00:00-05:00`)
      fecha.setUTCDate(fecha.getUTCDate() + diasAdelante)
      return fecha.toISOString().slice(0, 10)
    })()
    const solicitudId = `sol-mfl-curso-${String(i + 1).padStart(3, '0')}`
    const horaInicio = ['09:00', '11:00', '14:00', '15:00'][i % 4]
    const fin = new Date(`${fechaCita}T${horaInicio}:00-05:00`)
    fin.setUTCMinutes(fin.getUTCMinutes() + servicio.duracionEstimadaMinutos)
    const fechaSolicitud = fechaIsoDesde(HOY_COLABORADOR, 6 - (i % 5))
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, 5 - (i % 5))

    solicitudes.push({
      id: solicitudId,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaCita,
      horaPreferida: horaInicio,
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'CONTACTO_LIBERADO',
      fechaRespuesta: `${fechaRespuesta}T11:00:00-05:00`,
      contactoLiberadoAt: `${fechaRespuesta}T11:05:00-05:00`,
      createdAt: `${fechaSolicitud}T09:00:00-05:00`,
    })

    citas.push({
      id: `cita-mfl-curso-${String(i + 1).padStart(3, '0')}`,
      solicitudContactoId: solicitudId,
      colaboradorId: 'col-mfl',
      fechaInicio: `${fechaCita}T${horaInicio}:00-05:00`,
      fechaFin: fin.toISOString(),
      modalidad: servicio.modalidad,
      estado: 'CONFIRMADA',
      createdAt: `${fechaRespuesta}T11:05:00-05:00`,
    })
  }

  return { solicitudes, citas }
}
```

- [ ] **Step 4:** Solicitudes pendientes (`ENVIADA`, 12, Sección 35.8) y rechazadas (`RECHAZADA`, 9, para que
  la tasa de aceptación derive ≈86%: 56 aceptadas / (56+9) = 86.15%):

```ts
function construirPendientes(cantidad: number): SolicitudContacto[] {
  return Array.from({ length: cantidad }, (_, i) => {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const diasAdelante = 3 + i * 2
    const fecha = new Date(`${HOY_COLABORADOR}T12:00:00-05:00`)
    fecha.setUTCDate(fecha.getUTCDate() + diasAdelante)
    const fechaCreacion = fechaIsoDesde(HOY_COLABORADOR, i % 4)
    return {
      id: `sol-mfl-pend-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fecha.toISOString().slice(0, 10),
      horaPreferida: ['08:00', '10:00', '13:00', '16:00'][i % 4],
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'ENVIADA' as EstadoSolicitudContacto,
      createdAt: `${fechaCreacion}T${String(9 + (i % 7)).padStart(2, '0')}:30:00-05:00`,
    }
  })
}

function construirRechazadas(cantidad: number): SolicitudContacto[] {
  const motivos = [
    'No tengo disponibilidad para la fecha solicitada.',
    'El servicio solicitado no corresponde a mi área de especialización.',
    'La empresa solicitó reagendar y no confirmó una nueva fecha.',
  ]
  return Array.from({ length: cantidad }, (_, i) => {
    const servicio = SERVICIOS_MFL[i % SERVICIOS_MFL.length]
    const empresa = EMPRESAS_SOLICITANTES_SEMILLA[i % EMPRESAS_SOLICITANTES_SEMILLA.length]
    const fechaCreacion = fechaIsoDesde(HOY_COLABORADOR, 15 + i * 6)
    const fechaRespuesta = fechaIsoDesde(HOY_COLABORADOR, 14 + i * 6)
    return {
      id: `sol-mfl-rech-${String(i + 1).padStart(3, '0')}`,
      empresaId: empresa.id,
      colaboradorId: 'col-mfl',
      servicioId: servicio.id,
      fechaPreferida: fechaIsoDesde(HOY_COLABORADOR, 10 + i * 6),
      horaPreferida: '10:00',
      descripcion: `Solicitud de ${servicio.nombre.toLowerCase()} para ${empresa.nombre}.`,
      estado: 'RECHAZADA' as EstadoSolicitudContacto,
      fechaRespuesta: `${fechaRespuesta}T12:00:00-05:00`,
      motivoRechazo: motivos[i % motivos.length],
      createdAt: `${fechaCreacion}T09:00:00-05:00`,
    }
  })
}

const historico = construirHistoricoFinalizado(38)
const enCurso = construirEnCurso(18, 5)
const pendientes = construirPendientes(12)
const rechazadas = construirRechazadas(9)

export const SOLICITUDES_COLABORADOR_SEMILLA: SolicitudContacto[] = [
  ...pendientes,
  ...enCurso.solicitudes,
  ...historico.solicitudes,
  ...rechazadas,
]

export const CITAS_COLABORADOR_SEMILLA: Cita[] = [...enCurso.citas, ...historico.citas]
```

- [ ] **Step 5:** Notificaciones semilla (Sección 35.9 — 5 tipos, prioridades y leído/no-leído variados):

```ts
export const NOTIFICACIONES_COLABORADOR_SEMILLA: NotificacionColaborador[] = [
  {
    id: 'notif-mfl-01',
    tipo: 'NEW_REQUEST',
    titulo: 'Nueva solicitud recibida',
    mensaje: 'Ferretería Ambato solicitó Diagnóstico financiero.',
    prioridad: 'ALTA',
    leida: false,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 0)}T08:30:00-05:00`,
  },
  {
    id: 'notif-mfl-02',
    tipo: 'APPOINTMENT_REMINDER',
    titulo: 'Recordatorio de cita',
    mensaje: 'Tienes una cita confirmada mañana a las 09:00.',
    prioridad: 'NORMAL',
    leida: false,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 0)}T07:00:00-05:00`,
  },
  {
    id: 'notif-mfl-03',
    tipo: 'CANCELLATION_RESCHEDULE',
    titulo: 'Cita cancelada',
    mensaje: 'Logística Azul canceló su cita del 5 de agosto.',
    prioridad: 'URGENTE',
    leida: true,
    enlaceDestino: '/app/solicitudes',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 5)}T11:15:00-05:00`,
  },
  {
    id: 'notif-mfl-04',
    tipo: 'NEW_REVIEW',
    titulo: 'Nueva reseña recibida',
    mensaje: 'Recibiste una reseña de 5 estrellas de Panadería La Colina.',
    prioridad: 'NORMAL',
    leida: true,
    enlaceDestino: '/app/perfil/resenas',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 3)}T16:00:00-05:00`,
  },
  {
    id: 'notif-mfl-05',
    tipo: 'PRODUCT_UPDATES',
    titulo: 'Novedades de SAFE',
    mensaje: 'Ahora puedes administrar tus horarios directamente desde el Dashboard.',
    prioridad: 'BAJA',
    leida: true,
    enlaceDestino: '/app/dashboard',
    createdAt: `${fechaIsoDesde(HOY_COLABORADOR, 10)}T09:00:00-05:00`,
  },
]
```

- [ ] **Step 6:** Preferencias de notificación semilla (Sección 26 — defaults exactos del prompt):

```ts
export const PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA: PreferenciaNotificacionColaborador[] = [
  { categoria: 'NEW_REQUEST', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'APPOINTMENT_REMINDER', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'CANCELLATION_RESCHEDULE', correoActivo: true, frecuencia: 'INMEDIATA' },
  { categoria: 'NEW_REVIEW', correoActivo: true, frecuencia: 'SEMANAL' },
  { categoria: 'PRODUCT_UPDATES', correoActivo: true, frecuencia: 'SEMANAL' },
]

export const HOY_COLABORADOR_ISO = HOY_COLABORADOR
```

- [ ] **Step 7:** `npm run build` limpio.
- [ ] **Step 8:** Verificación manual con un script rápido (o `console.log` temporal en el propio módulo,
  removido antes de comitear) confirmando: `SOLICITUDES_COLABORADOR_SEMILLA.length === 77` (12+18+38+9),
  `SOLICITUDES_COLABORADOR_SEMILLA.filter(s => s.estado === 'ENVIADA').length === 12`,
  `CITAS_COLABORADOR_SEMILLA.filter(c => c.estado === 'COMPLETADA').length === 38`,
  `CITAS_COLABORADOR_SEMILLA.filter(c => c.estado === 'CONFIRMADA').length === 18`. Si algún conteo no
  coincide, revisar los parámetros de `construirHistoricoFinalizado`/`construirEnCurso`/`construirPendientes`/
  `construirRechazadas` antes de continuar — las tareas siguientes (Dashboard, Solicitudes) dependen de que
  estas cifras cuadren con la Sección 35.6 del prompt.
- [ ] **Step 9:** Commit `feat: agregar semilla de solicitudes, citas, notificaciones y preferencias de Colaborador`.

---

### Task 8: `PortalDataContext` — franjas de estado de Colaborador

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: todo lo producido en Tasks 1, 4, 6, 7.
- Produces: `colaboradorPerfil`, `actualizarColaboradorPerfil`, `actualizarEspecialidadesColaborador`,
  `serviciosColaborador`, `agregarServicioColaborador` (devuelve el `ServicioProfesional` creado, para que la
  Fase 11 pueda asociarle un `iconKey` sin adivinar su `id`), `actualizarServicioColaborador`,
  `desactivarServicioColaborador`, `horariosColaborador`, `guardarHorariosColaborador`,
  `solicitudesColaborador`, `aceptarSolicitudColaborador`, `rechazarSolicitudColaborador`,
  `citasColaborador`, `notificacionesColaborador`, `marcarNotificacionColaboradorLeida`,
  `marcarTodasNotificacionesColaboradorLeidas`, `preferenciasNotificacionColaborador`,
  `actualizarPreferenciaNotificacionColaborador` — consumidos por la Tarea 9 y por las Fases 11-13.

- [ ] **Step 1:** Ampliar los imports de tipos y de datos semilla al inicio del archivo:

```ts
import type {
  // ...tipos existentes sin cambios...
  Cita,
  EspecialidadColaboradorRelacion,
  ModalidadAtencion,
  NotificacionColaborador,
  ServicioProfesional,
  CategoriaNotificacionColaborador,
  FrecuenciaNotificacionColaborador,
} from './types'
import {
  // ...imports existentes de mock-portal-data.ts sin cambios...
} from './data/mock-portal-data'
import {
  COLABORADORES_MARKETPLACE,
  HORARIOS_DISPONIBILIDAD,
  SERVICIOS_PROFESIONALES,
} from './marketplace/catalogo'
import {
  CITAS_COLABORADOR_SEMILLA,
  HOY_COLABORADOR_ISO,
  NOTIFICACIONES_COLABORADOR_SEMILLA,
  PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA,
  SOLICITUDES_COLABORADOR_SEMILLA,
} from './colaborador/semilla'
```

  (`HOY_OBLIGACIONES`, `SERVICIOS_PROFESIONALES` ya se importaban antes en otro punto del archivo — no
  duplicar el import de `SERVICIOS_PROFESIONALES`, unificarlo en el bloque de `marketplace/catalogo`).
- [ ] **Step 2:** Ampliar `solicitudesContacto` (el `Record<empresaId, SolicitudContacto[]>` ya existente)
  con las solicitudes de Colaborador, agrupadas por `empresaId` de la semilla — esto es lo que hace que
  `aceptarSolicitudColaborador`/`rechazarSolicitudColaborador` puedan mutar la misma estructura que Empresa
  usa. Cambiar la inicialización de `solicitudesContacto`:

```ts
const [solicitudesContacto, setSolicitudesContacto] = useState<Record<string, SolicitudContacto[]>>(() => {
  const inicial: Record<string, SolicitudContacto[]> = { ...solicitudesContactoSemilla }
  for (const solicitud of SOLICITUDES_COLABORADOR_SEMILLA) {
    inicial[solicitud.empresaId] = [...(inicial[solicitud.empresaId] ?? []), solicitud]
  }
  return inicial
})
```

  (`enviarSolicitudContacto`, ya existente, debe agregar `empresaId` al objeto que construye — buscar la
  línea `const solicitud: SolicitudContacto = { ...nueva, ... }` dentro de esa función y agregar `empresaId,`
  explícitamente al objeto literal, por ejemplo `const solicitud: SolicitudContacto = { ...nueva, empresaId, descripcion, id: crypto.randomUUID(), estado: 'ENVIADA', createdAt: AHORA_MARKETPLACE }`
  — la Tarea 1 corrigió `NuevaSolicitudContacto` para que **excluya** `empresaId` de su `Omit` (ya que
  `enviarSolicitudContacto` lo recibe como su primer parámetro por separado, no dentro de `nueva`), así que
  el spread `...nueva` ya NO trae `empresaId` y esta línea sí necesita el campo agregado a mano. Esto es
  precisamente el único error de compilación pre-existente que las Tareas 1-7 dejaron pendiente en este
  archivo — confirmar que corregir esta línea deja `npm run build` sin ningún error en todo el repositorio).
- [ ] **Step 3:** Agregar el estado de perfil/especialidades/servicios/horarios/citas/notificaciones,
  inicializado desde los seeds, después de la declaración de `preferencias`:

```ts
const [colaboradorPerfil, setColaboradorPerfil] = useState(
  () => COLABORADORES_MARKETPLACE.find((c) => c.id === 'col-mfl') ?? COLABORADORES_MARKETPLACE[0],
)
const [serviciosColaborador, setServiciosColaborador] = useState<ServicioProfesional[]>(() =>
  SERVICIOS_PROFESIONALES.filter((s) => s.colaboradorId === colaboradorPerfil.id),
)
const [horariosColaborador, setHorariosColaborador] = useState<HorarioDisponibilidad[]>(() =>
  HORARIOS_DISPONIBILIDAD.filter((h) => h.colaboradorId === colaboradorPerfil.id),
)
const [citasColaborador, setCitasColaborador] = useState<Cita[]>(CITAS_COLABORADOR_SEMILLA)
const [notificacionesColaborador, setNotificacionesColaborador] = useState<NotificacionColaborador[]>(
  NOTIFICACIONES_COLABORADOR_SEMILLA,
)
const [preferenciasNotificacionColaborador, setPreferenciasNotificacionColaborador] = useState<
  PreferenciaNotificacionColaborador[]
>(PREFERENCIAS_NOTIFICACION_COLABORADOR_SEMILLA)
```

  (`HorarioDisponibilidad`, `PreferenciaNotificacionColaborador` deben entrar también al bloque de `import
  type` del Step 1 — completar la lista).
- [ ] **Step 4:** Derivar `solicitudesColaborador` desde el mismo `solicitudesContacto` que usa Empresa
  (no duplicar estado), con `useMemo`:

```ts
const solicitudesColaborador = useMemo(
  () =>
    Object.values(solicitudesContacto)
      .flat()
      .filter((s) => s.colaboradorId === colaboradorPerfil.id),
  [solicitudesContacto, colaboradorPerfil.id],
)
```

- [ ] **Step 5:** Acciones de perfil/especialidades:

```ts
const actualizarColaboradorPerfil = (patch: Partial<typeof colaboradorPerfil>) => {
  setColaboradorPerfil((current) => ({ ...current, ...patch }))
}

const actualizarEspecialidadesColaborador = (especialidades: EspecialidadColaboradorRelacion[]) => {
  setColaboradorPerfil((current) => ({
    ...current,
    especialidades,
    especialidadIds: especialidades.filter((e) => e.activo).map((e) => e.especialidadId),
    especialidadPrincipalId:
      especialidades.find((e) => e.esPrincipal)?.especialidadId ?? current.especialidadPrincipalId,
  }))
}
```

- [ ] **Step 6:** Acciones de servicios:

```ts
const agregarServicioColaborador = (
  servicio: Omit<ServicioProfesional, 'id' | 'colaboradorId' | 'activo'>,
): ServicioProfesional => {
  const nuevo: ServicioProfesional = {
    ...servicio,
    id: crypto.randomUUID(),
    colaboradorId: colaboradorPerfil.id,
    activo: true,
  }
  setServiciosColaborador((current) => [...current, nuevo])
  return nuevo
}

const actualizarServicioColaborador = (id: string, patch: Partial<ServicioProfesional>) => {
  setServiciosColaborador((current) => current.map((s) => (s.id === id ? { ...s, ...patch } : s)))
}

const desactivarServicioColaborador = (id: string) => {
  setServiciosColaborador((current) => current.map((s) => (s.id === id ? { ...s, activo: false } : s)))
}
```

- [ ] **Step 7:** Acción de horarios:

```ts
const guardarHorariosColaborador = (horarios: HorarioDisponibilidad[]) => {
  setHorariosColaborador(horarios)
}
```

- [ ] **Step 8:** `aceptarSolicitudColaborador`/`rechazarSolicitudColaborador` — validaciones (Sección 19.2)
  y transacción (Sección 19.3) en una sola función pura de módulo (no dentro del componente, para poder
  testearla a ojo por separado) más un wrapper que hace el `setState`:

```ts
function validarYAceptar({
  solicitud,
  servicio,
  horarios,
  citasExistentes,
  modalidadElegida,
}: {
  solicitud: SolicitudContacto
  servicio: ServicioProfesional | undefined
  horarios: HorarioDisponibilidad[]
  citasExistentes: Cita[]
  modalidadElegida: Exclude<ModalidadAtencion, 'AMBAS'>
}): { ok: true; cita: Cita; solicitudActualizada: SolicitudContacto } | { ok: false; motivo: string } {
  if (solicitud.estado !== 'ENVIADA') return { ok: false, motivo: 'La solicitud ya fue respondida.' }
  if (!servicio || !servicio.activo || servicio.colaboradorId !== solicitud.colaboradorId) {
    return { ok: false, motivo: 'El servicio solicitado ya no está disponible.' }
  }
  if (!solicitud.fechaPreferida || !solicitud.horaPreferida) {
    return { ok: false, motivo: 'La solicitud no tiene fecha u hora preferida.' }
  }
  const inicio = new Date(`${solicitud.fechaPreferida}T${solicitud.horaPreferida}:00-05:00`)
  if (inicio.getTime() < Date.now() - 24 * 3_600_000) {
    // Margen de 24h para no invalidar seeds "de hoy" por diferencia de reloj del navegador.
    return { ok: false, motivo: 'La fecha solicitada ya pasó.' }
  }
  const fin = new Date(inicio.getTime() + servicio.duracionEstimadaMinutos * 60_000)

  const diaSemana = (((inicio.getUTCDay() + 6) % 7) + 1) as HorarioDisponibilidad['diaSemana']
  const horaHHMM = solicitud.horaPreferida
  const bloqueValido = horarios.some(
    (h) =>
      h.activo &&
      h.diaSemana === diaSemana &&
      (h.modalidad === 'AMBAS' || h.modalidad === modalidadElegida) &&
      h.horaInicio <= horaHHMM &&
      h.horaFin >= horaHHMM,
  )
  if (!bloqueValido) return { ok: false, motivo: 'El horario solicitado ya no está disponible.' }

  const seSolapaConOtraCita = citasExistentes.some((c) => {
    if (c.estado === 'CANCELADA') return false
    const inicioC = new Date(c.fechaInicio).getTime()
    const finC = new Date(c.fechaFin).getTime()
    return inicio.getTime() < finC && fin.getTime() > inicioC
  })
  if (seSolapaConOtraCita) return { ok: false, motivo: 'El horario solicitado ya no está disponible.' }

  const ahora = new Date().toISOString()
  const cita: Cita = {
    id: crypto.randomUUID(),
    solicitudContactoId: solicitud.id,
    colaboradorId: solicitud.colaboradorId,
    fechaInicio: inicio.toISOString(),
    fechaFin: fin.toISOString(),
    modalidad: modalidadElegida,
    estado: 'CONFIRMADA',
    createdAt: ahora,
  }
  const solicitudActualizada: SolicitudContacto = {
    ...solicitud,
    estado: 'CONTACTO_LIBERADO',
    fechaRespuesta: ahora,
    contactoLiberadoAt: ahora,
  }
  return { ok: true, cita, solicitudActualizada }
}
```

  Dentro del componente `PortalDataProvider`:

```ts
const aceptarSolicitudColaborador = (
  solicitudId: string,
  modalidadElegida: Exclude<ModalidadAtencion, 'AMBAS'>,
): { ok: true; cita: Cita } | { ok: false; motivo: string } => {
  const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
  if (!solicitud) return { ok: false, motivo: 'Solicitud no encontrada.' }
  const servicio = serviciosColaborador.find((s) => s.id === solicitud.servicioId)
  const resultado = validarYAceptar({
    solicitud,
    servicio,
    horarios: horariosColaborador,
    citasExistentes: citasColaborador,
    modalidadElegida,
  })
  if (!resultado.ok) return resultado

  setSolicitudesContacto((current) => ({
    ...current,
    [solicitud.empresaId]: current[solicitud.empresaId].map((s) =>
      s.id === solicitudId ? resultado.solicitudActualizada : s,
    ),
  }))
  setCitasColaborador((current) => [...current, resultado.cita])
  return { ok: true, cita: resultado.cita }
}

const rechazarSolicitudColaborador = (solicitudId: string, motivoRechazo: string): boolean => {
  const solicitud = solicitudesColaborador.find((s) => s.id === solicitudId)
  if (!solicitud || solicitud.estado !== 'ENVIADA') return false
  if (motivoRechazo.trim().length < 10 || motivoRechazo.trim().length > 500) return false

  setSolicitudesContacto((current) => ({
    ...current,
    [solicitud.empresaId]: current[solicitud.empresaId].map((s) =>
      s.id === solicitudId
        ? { ...s, estado: 'RECHAZADA' as const, fechaRespuesta: new Date().toISOString(), motivoRechazo: motivoRechazo.trim() }
        : s,
    ),
  }))
  return true
}
```

- [ ] **Step 9:** Acciones de notificaciones y preferencias:

```ts
const marcarNotificacionColaboradorLeida = (id: string) => {
  setNotificacionesColaborador((current) => current.map((n) => (n.id === id ? { ...n, leida: true } : n)))
}

const marcarTodasNotificacionesColaboradorLeidas = () => {
  setNotificacionesColaborador((current) => current.map((n) => ({ ...n, leida: true })))
}

const actualizarPreferenciaNotificacionColaborador = (
  categoria: CategoriaNotificacionColaborador,
  patch: Partial<Pick<PreferenciaNotificacionColaborador, 'correoActivo' | 'frecuencia'>>,
) => {
  setPreferenciasNotificacionColaborador((current) =>
    current.map((p) => (p.categoria === categoria ? { ...p, ...patch } : p)),
  )
}
```

- [ ] **Step 10:** Agregar los 20 nombres nuevos al tipo `PortalDataContextValue` y al objeto que entrega el
  `Provider` (mismo patrón que las franjas de Empresa ya listadas: agregar cada campo a la interfaz al
  principio del archivo, y cada valor/función al `<PortalDataContext.Provider value={{ ... }}>` al final).
  También exportar `HOY_COLABORADOR_ISO` reexportándolo o dejando que cada consumidor lo importe
  directamente desde `./colaborador/semilla` (no es necesario pasarlo por el Context, es una constante).
- [ ] **Step 11:** `npm run build` limpio.
- [ ] **Step 12:** Commit `feat: agregar franjas de estado de Colaborador a PortalDataContext`.

---

### Task 9: `CompanyIdentity` + Sidebar/Topbar/AccountMenu role-aware

**Files:**
- Create: `src/portal/components/CompanyIdentity.tsx`
- Modify: `src/portal/components/Sidebar.tsx`, `src/portal/components/Topbar.tsx`,
  `src/portal/components/AccountMenu.tsx`, `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: `inicialesDeNombre` (Task 6), `NotificacionColaborador`/`PortalDataContext` colaborador slices
  (Task 8), `AppRole`/`useAuth()` (Task 2).
- Produces: `CompanyIdentity` (usado por la Fase 12), `navItemsColaborador` (usado por la Tarea 10 de esta
  fase).

- [ ] **Step 1:** Crear `CompanyIdentity.tsx`:

```tsx
export function CompanyIdentity({
  nombre,
  iniciales,
  size = 'md',
}: {
  nombre: string
  iniciales?: string
  size?: 'sm' | 'md'
}) {
  const inicialesCalculadas =
    iniciales ??
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  const dimension = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]'

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-lg bg-navy-100 font-bold text-navy-700 ${dimension}`}
      >
        {inicialesCalculadas}
      </span>
      <span className="min-w-0 truncate text-[13.5px] font-semibold text-ink-900">{nombre}</span>
    </span>
  )
}
```

- [ ] **Step 2:** `mock-portal-data.ts` — renombrar el array `navItems` existente a `navItemsEmpresa` (buscar
  todos los usos del nombre `navItems` importado en el repo y actualizarlos — hoy solo `Sidebar.tsx` lo
  importa) y agregar `navItemsColaborador`:

```ts
export const navItemsEmpresa: NavItem[] = [
  // ...contenido existente de navItems, sin cambios...
]

export const navItemsColaborador: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { key: 'perfil', label: 'Perfil profesional', path: '/app/perfil', icon: UserRound },
  { key: 'solicitudes', label: 'Solicitudes y citas', path: '/app/solicitudes', icon: ClipboardList },
  { key: 'configuracion', label: 'Configuración', path: '/app/configuracion', icon: Settings },
  { key: 'tutoriales', label: 'Video tutoriales', path: '/app/tutoriales', icon: PlaySquare },
]
```

  agregar `ClipboardList`, `PlaySquare`, `UserRound` al import de `lucide-react` al inicio del archivo
  (`Settings`, `LayoutDashboard` ya están importados).
- [ ] **Step 3:** `Sidebar.tsx` — usar `useAuth()` para elegir el array de nav y ocultar el footer de plan
  para Colaborador:

```tsx
import { useAuth } from '@/auth/AuthContext'
import { navItemsColaborador, navItemsEmpresa, suscripcionSemilla } from '@/portal/data/mock-portal-data'
// ...

export function Sidebar() {
  const { user } = useAuth()
  const { planActivoCodigo, suscripcionCancelada } = usePortalData()
  const esColaborador = user?.role === 'COLABORADOR'
  const navItems = esColaborador ? navItemsColaborador : navItemsEmpresa
  const plan = planPorCodigo(planActivoCodigo)

  return (
    <nav /* ...sin cambios... */>
      {/* ...logo y navItems.map(...) sin cambios de estructura... */}
      {!esColaborador && (
        <div className="mt-auto border-t border-white/10 px-2.5 pb-1 pt-3.5 text-[11.5px] leading-relaxed text-white/70">
          <div className="font-semibold text-white">{plan.nombre}</div>
          <div>{suscripcionCancelada ? 'Suscripción cancelada' : `Se renueva el ${formatFecha(suscripcionSemilla.proximaRenovacion)}`}</div>
        </div>
      )}
    </nav>
  )
}
```

- [ ] **Step 4:** `Topbar.tsx` — ocultar `CompanySwitcher` y la campana de alertas tributarias para
  Colaborador; la campana de notificaciones cambia de fuente de datos según rol:

```tsx
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
// ...

export function Topbar() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const { user } = useAuth()
  const esColaborador = user?.role === 'COLABORADOR'
  const { notificacionesColaborador } = usePortalData()

  const notificationItems: PanelItem[] = esColaborador
    ? notificacionesColaborador.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fecha: n.createdAt,
        tono: n.leida ? 'neutro' : 'atencion',
      }))
    : notificaciones.map((n) => ({
        id: n.id,
        titulo: n.titulo,
        mensaje: n.mensaje,
        fecha: n.fecha,
        tono: n.leida ? 'neutro' : 'atencion',
      }))

  return (
    <header /* ...sin cambios... */>
      {esColaborador ? (
        <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-ink-900 sm:flex-none">
          Perfil Colaborador
        </span>
      ) : (
        <CompanySwitcher />
      )}

      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {!esColaborador && (
          <div className="relative">
            {/* ...botón + panel de alertas tributarias existente, sin cambios... */}
          </div>
        )}

        <div className="relative">
          {/* ...botón + panel de notificaciones existente, usando el `notificationItems` ya calculado arriba... */}
        </div>

        {/* ...separador, avatar, AccountMenu sin cambios estructurales... */}
      </div>
    </header>
  )
}
```

  (mover la constante módulo-level `alertItems`/`notificationItems` que hoy se calculan fuera del
  componente hacia adentro del cuerpo de `Topbar`, ya que `notificationItems` ahora depende de `esColaborador`
  — `alertItems` se queda igual que hoy, solo se renderiza condicionalmente).
- [ ] **Step 5:** `AccountMenu.tsx` — lista de enlaces por rol:

```tsx
import { useAuth } from '@/auth/AuthContext'

export function AccountMenu({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const enlaces =
    user.role === 'COLABORADOR'
      ? [
          { label: 'Mi cuenta', to: '/app/configuracion/cuenta' },
          { label: 'Video tutoriales', to: '/app/tutoriales' },
        ]
      : [
          { label: 'Mi cuenta', to: '/app/configuracion/cuenta' },
          { label: 'Mi plan', to: '/app/plan' },
          { label: 'Video tutoriales', to: '/app/tutoriales' },
        ]

  return (
    <div /* ...sin cambios... */>
      {/* ...encabezado con nombre/correo sin cambios... */}
      {enlaces.map((item) => (
        /* ...botón sin cambios, ahora mapea `enlaces` en vez de la lista fija... */
      ))}
      {/* ...botón Cerrar sesión sin cambios... */}
    </div>
  )
}
```

- [ ] **Step 6:** `npm run build` limpio.
- [ ] **Step 7:** Verificación manual: loguear como Empresa → Sidebar/Topbar/AccountMenu deben verse
  **exactamente** igual que antes de esta fase (regresión). Loguear como Colaborador
  (`maria.lopez@safe-demo.ec`) → Sidebar muestra las 5 entradas del prompt en orden, sin footer de plan;
  Topbar muestra "Perfil Colaborador" a la izquierda, sin campana de alertas, con campana de notificaciones
  (5 semilla, 2 no leídas); AccountMenu muestra "Mi cuenta"/"Video tutoriales", sin "Mi plan".
- [ ] **Step 8:** Commit `feat: hacer Sidebar, Topbar y AccountMenu role-aware para Colaborador`.

---

### Task 10: Dashboard Colaborador — `CollaboratorDashboardScreen`

**Files:**
- Create: `src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx`
- Modify: `src/App.tsx` (completar `DashboardResolver`, ver Tarea 3 Step 6)

**Interfaces:**
- Consumes: todas las funciones de `colaborador/calculo.ts` (Task 6), todas las franjas de
  `usePortalData()` de Colaborador (Task 8), `CompanyIdentity` (Task 9), `KpiCard` (existente).

- [ ] **Step 1:** Crear el componente con los 4 KPIs (Sección 11.1) reutilizando `KpiCard` (requiere armar
  objetos `Kpi` con `icon: LucideIcon` — `Inbox`, `CalendarCheck`, `CheckCircle2`, `Star` de `lucide-react`):

```tsx
import { CalendarCheck, CheckCircle2, Inbox, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { KpiCard } from '@/portal/components/KpiCard'
import { CompanyIdentity } from '@/portal/components/CompanyIdentity'
import { formatFecha } from '@/portal/obligaciones/formato'
import { formatUSD } from '@/portal/financiero/formato'
import { HOY_COLABORADOR_ISO, empresaSolicitantePorId } from '@/portal/colaborador/semilla'
import {
  agruparDisponibilidadPorDia,
  calcularCalificacionPromedio,
  calcularRendimientoMensual,
  calcularTasaAceptacion,
  contarCitasEsteMes,
  contarServiciosCompletados,
  contarSolicitudesPendientes,
  obtenerSolicitudMasReciente,
} from '@/portal/colaborador/calculo'
import { RESENAS_COLABORADORES } from '@/portal/marketplace/catalogo'
import { RendimientoMensualPanel } from './RendimientoMensualPanel'

export function CollaboratorDashboardScreen() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    colaboradorPerfil,
    solicitudesColaborador,
    citasColaborador,
    horariosColaborador,
    serviciosColaborador,
  } = usePortalData()

  const resenas = RESENAS_COLABORADORES.filter((r) => r.colaboradorId === colaboradorPerfil.id)
  const { promedio, cantidad } = calcularCalificacionPromedio(resenas)
  const disponibilidad = agruparDisponibilidadPorDia(horariosColaborador)
  const solicitudReciente = obtenerSolicitudMasReciente(solicitudesColaborador)
  const rendimiento = calcularRendimientoMensual({
    citas: citasColaborador,
    solicitudes: solicitudesColaborador,
    hoyIso: HOY_COLABORADOR_ISO,
  })

  const kpis = [
    {
      id: 'pendientes',
      titulo: 'Solicitudes pendientes',
      valor: String(contarSolicitudesPendientes(solicitudesColaborador)),
      sub: 'esperando tu respuesta',
      icon: Inbox,
    },
    {
      id: 'citas-mes',
      titulo: 'Citas este mes',
      valor: String(contarCitasEsteMes(citasColaborador, HOY_COLABORADOR_ISO)),
      sub: 'confirmadas o programadas',
      icon: CalendarCheck,
    },
    {
      id: 'completados',
      titulo: 'Servicios completados',
      valor: String(contarServiciosCompletados(citasColaborador)),
      sub: 'histórico',
      icon: CheckCircle2,
    },
    {
      id: 'calificacion',
      titulo: 'Calificación promedio',
      valor: promedio === null ? 'Sin reseñas' : `${promedio.toFixed(1)} / 5`,
      sub: promedio === null ? '' : `${cantidad} reseñas`,
      icon: Star,
    },
  ]

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">
          Hola, {user?.nombres.split(' ')[0]}
        </h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Este es el resumen de tu actividad profesional en SAFE hoy.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-7">
          <h2 className="text-[16px] font-semibold text-ink-900">Disponibilidad</h2>
          <div className="mt-3.5 overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-line-soft text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
                  <th className="py-2 pr-3">Día</th>
                  <th className="py-2 pr-3">Horario</th>
                  <th className="py-2 pr-3">Modalidad</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {disponibilidad.map((dia) => (
                  <tr key={dia.diaSemana} className="border-b border-line-soft/70 last:border-b-0">
                    <td className="py-2.5 pr-3 font-semibold text-ink-900">{dia.label}</td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {dia.bloques.length === 0
                        ? '—'
                        : dia.bloques.map((b) => `${b.horaInicio} - ${b.horaFin}`).join(', ')}
                    </td>
                    <td className="py-2.5 pr-3 text-ink-700">
                      {dia.bloques.length === 0
                        ? '—'
                        : Array.from(new Set(dia.bloques.map((b) => b.modalidad))).join(' / ')}
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          dia.bloques.length > 0 ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                        }`}
                      >
                        {dia.bloques.length > 0 ? 'Disponible' : 'No disponible'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            onClick={() => navigate('/app/perfil?seccion=disponibilidad')}
            className="mt-3.5 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            Administrar disponibilidad
          </button>
        </section>

        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-5">
          <h2 className="text-[16px] font-semibold text-ink-900">Solicitudes nuevas</h2>
          {solicitudReciente === null ? (
            <p className="mt-3.5 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
              No tienes solicitudes nuevas. Las nuevas solicitudes aparecerán aquí.
            </p>
          ) : (
            (() => {
              const empresa = empresaSolicitantePorId(solicitudReciente.empresaId)
              const servicio = serviciosColaborador.find((s) => s.id === solicitudReciente.servicioId)
              return (
                <div className="mt-3.5 rounded-xl border border-line/70 bg-surface p-3.5">
                  <CompanyIdentity nombre={empresa?.nombre ?? 'Empresa'} iniciales={empresa?.iniciales} />
                  <dl className="mt-3 flex flex-col gap-1.5 text-[13px]">
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Servicio solicitado</dt>
                      <dd className="text-ink-900">{servicio?.nombre ?? 'Servicio por definir'}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Fecha solicitada</dt>
                      <dd className="text-ink-900">
                        {formatFecha(solicitudReciente.fechaPreferida)} · {solicitudReciente.horaPreferida}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-ink-500">Enviada el</dt>
                      <dd className="text-ink-900">{formatFecha(solicitudReciente.createdAt.slice(0, 10))}</dd>
                    </div>
                  </dl>
                </div>
              )
            })()
          )}
          <button
            type="button"
            onClick={() => navigate('/app/solicitudes')}
            className="mt-3.5 min-h-11 w-full rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            Revisar solicitudes
          </button>
        </section>
      </div>

      <RendimientoMensualPanel metricas={rendimiento} />
    </section>
  )
}
```

  (el helper `formatUSD` importado no se usa directamente en este archivo — quitar el import si no se
  termina usando, para no dejar un import sin uso que rompa el build; se deja listado aquí solo como
  recordatorio de que está disponible si se decide mostrar precio en la card de solicitud nueva, lo cual el
  prompt no pide explícitamente en la Sección 11.3).
- [ ] **Step 2:** Crear `src/portal/colaborador/dashboard/RendimientoMensualPanel.tsx` — selector segmentado
  de 4 métricas (Sección 11.4), gráfico de línea simple (reutilizar el patrón SVG de
  `src/portal/dashboard/FinancialChart.tsx` si expone algo reutilizable; si no, un `<svg>` minimal con
  `<polyline>` sobre `metricas[activa].serie`) y tabla comparativa accesible debajo:

```tsx
import { useState } from 'react'
import type { MetricaRendimiento } from '@/portal/colaborador/calculo'

export function RendimientoMensualPanel({ metricas }: { metricas: MetricaRendimiento[] }) {
  const [activa, setActiva] = useState(metricas[0].clave)
  const metrica = metricas.find((m) => m.clave === activa) ?? metricas[0]
  const valores = metrica.serie.map((p) => p.valor)
  const maximo = Math.max(1, ...valores)

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 className="text-[16px] font-semibold text-ink-900">Rendimiento del mes</h2>
      <div className="mt-3.5 flex flex-wrap gap-2" role="tablist" aria-label="Métrica de rendimiento">
        {metricas.map((m) => (
          <button
            key={m.clave}
            type="button"
            role="tab"
            aria-selected={m.clave === activa}
            onClick={() => setActiva(m.clave)}
            className={`min-h-[38px] rounded-full border px-3.5 text-[12.5px] font-semibold transition-colors ${
              m.clave === activa
                ? 'border-navy-600 bg-navy-600 text-white'
                : 'border-line bg-card text-ink-700 hover:bg-surface'
            }`}
          >
            {m.titulo}
          </button>
        ))}
      </div>

      <div className="mt-4" role="img" aria-label={`Serie semanal de ${metrica.titulo.toLowerCase()}: ${metrica.serie.map((p) => `semana ${p.semana}, ${p.valor}${metrica.unidad}`).join('; ')}`}>
        {metrica.serie.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Sin datos de {metrica.titulo.toLowerCase()} este mes todavía.
          </p>
        ) : (
          <svg viewBox="0 0 300 120" className="h-32 w-full" aria-hidden="true">
            <polyline
              fill="none"
              stroke="var(--color-navy-600, #1d4ed8)"
              strokeWidth="2.5"
              points={metrica.serie
                .map((p, i) => {
                  const x = metrica.serie.length === 1 ? 150 : (i / (metrica.serie.length - 1)) * 280 + 10
                  const y = 110 - (p.valor / maximo) * 100
                  return `${x},${y}`
                })
                .join(' ')}
            />
            {metrica.serie.map((p, i) => {
              const x = metrica.serie.length === 1 ? 150 : (i / (metrica.serie.length - 1)) * 280 + 10
              const y = 110 - (p.valor / maximo) * 100
              return <circle key={p.semana} cx={x} cy={y} r={3.5} fill="var(--color-navy-600, #1d4ed8)" />
            })}
          </svg>
        )}
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[420px] border-collapse text-[13px]">
          <caption className="sr-only">Comparación de métricas de rendimiento con el mes anterior</caption>
          <thead>
            <tr className="border-b border-line-soft text-left text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <th className="py-2 pr-3">Métrica</th>
              <th className="py-2 pr-3">Este mes</th>
              <th className="py-2 pr-3">Mes anterior</th>
              <th className="py-2">Variación</th>
            </tr>
          </thead>
          <tbody>
            {metricas.map((m) => (
              <tr key={m.clave} className="border-b border-line-soft/70 last:border-b-0">
                <td className="py-2.5 pr-3 font-semibold text-ink-900">{m.titulo}</td>
                <td className="py-2.5 pr-3 text-ink-700">{m.totalEsteMes}{m.unidad}</td>
                <td className="py-2.5 pr-3 text-ink-700">{m.totalMesAnterior}{m.unidad}</td>
                <td className="py-2.5 text-ink-700">
                  {m.variacion === null ? (
                    '—'
                  ) : (
                    <span className={m.variacion === 0 ? '' : (m.variacion > 0) !== m.menorEsMejor ? 'text-emerald-deep' : 'text-destructive'}>
                      {m.variacion > 0 ? '+' : ''}
                      {m.variacion}%
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
```

- [ ] **Step 3:** Completar `DashboardResolver` en `App.tsx` (pendiente desde la Tarea 3 Step 6): importar
  `CollaboratorDashboardScreen` y confirmar que el componente devuelve `<CollaboratorDashboardScreen />`
  cuando `user?.role === 'COLABORADOR'`.
- [ ] **Step 4:** `npm run build` limpio.
- [ ] **Step 5:** Verificación manual con `npm run dev`: loguear como Colaborador
  (`maria.lopez@safe-demo.ec`) → `/app/dashboard` debe mostrar: 4 KPIs con valores derivados (12 pendientes,
  5 citas este mes, 38 completados, 4.8/5 · 39 reseñas), tabla de disponibilidad lunes-domingo con el patrón
  de la Tarea 4 Step 5, tarjeta de "Solicitudes nuevas" con la solicitud `ENVIADA` más reciente y su
  `CompanyIdentity`, y el panel de "Rendimiento del mes" con el selector de 4 métricas funcionando y su
  tabla comparativa. Probar en 390×844 y 1366×768 — sin scroll horizontal global, KPIs en 2×2 en móvil.
- [ ] **Step 6:** Regresión: loguear como Empresa → `/app/dashboard` debe verse y comportarse exactamente
  igual que antes de esta fase.
- [ ] **Step 7:** Commit `feat: agregar Dashboard de Colaborador con KPIs, disponibilidad y rendimiento mensual`.

---

### Task 11: Verificación final de la fase

**Files:** ninguno (solo verificación).

- [ ] **Step 1:** `npm run build` desde cero (`rm -rf dist && npm run build`) — debe compilar sin errores ni
  warnings de TypeScript.
- [ ] **Step 2:** Recorrido manual completo en `npm run dev`:
  - Login con correo/clave cualquiera → Empresa, Dashboard idéntico a antes de la fase.
  - Login con `maria.lopez@safe-demo.ec` → Colaborador, Dashboard nuevo funcionando.
  - Como Colaborador, intentar navegar manualmente a `/app/empresa`, `/app/financiero`, `/app/marketplace`,
    `/app/plan` → cada una debe redirigir a `/app/dashboard` (RoleRoute).
  - Como Empresa, intentar navegar manualmente a `/app/perfil`, `/app/solicitudes` → debe redirigir a
    `/app/dashboard` (RoleRoute) — aunque esas rutas ni siquiera existen todavía en `App.tsx` en esta fase
    (caen en el catch-all `*` → mismo resultado).
  - Sidebar/Topbar/AccountMenu de Empresa: clickear cada entrada, confirmar cero diferencia visual/funcional
    contra el estado pre-fase.
- [ ] **Step 3:** Si algo de la regresión de Empresa falla, es bloqueante — no continuar a la Fase 11 hasta
  resolverlo.
