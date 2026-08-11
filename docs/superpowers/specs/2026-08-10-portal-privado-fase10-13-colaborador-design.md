# Portal Privado — Fases 10-13: Perfil Colaborador

Fecha: 2026-08-10

## Contexto

Las Fases 1-9 (ver `docs/superpowers/specs/2026-08-06-portal-privado-fase1-design.md` a
`docs/superpowers/specs/2026-08-10-portal-privado-fase9-configuracion-tutoriales-design.md`) construyeron el
portal privado completo para el rol Empresa bajo `/app/*`: shell (Sidebar/Topbar), Dashboard, Mi Empresa,
Financiero, Indicadores, Obligaciones tributarias, Simulador, Marketplace (donde una Empresa navega y
contrata profesionales), Plan y suscripción, Configuración y Video tutoriales. Es un prototipo de alta
fidelidad **solo frontend**: sin backend, sin MSW, sin test runner (`package.json` solo tiene
`dev`/`build`/`preview`); los datos de negocio viven en `PortalDataContext` (React state, in-memory) y solo
la sesión de auth y el tema persisten en `localStorage`.

Este documento cubre la incorporación del **perfil privado Colaborador** — el profesional que las
Empresas contratan desde Marketplace — como una segunda identidad de sesión completa: Dashboard, Perfil
profesional (ver/editar/vista previa/reseñas), Solicitudes y citas, Configuración y Video tutoriales,
reutilizando el mismo shell, sistema visual y patrón de datos que Empresa. Se implementa en 4 fases:

- **Fase 10** — Rol/sesión + Shell role-aware + Dashboard Colaborador.
- **Fase 11** — Perfil profesional (ver, editar, vista previa pública, todas las reseñas).
- **Fase 12** — Solicitudes y citas (pendientes, detalle, aceptar/rechazar, historial, KPIs).
- **Fase 13** — Configuración Colaborador + Video tutoriales Colaborador.

Fuente normativa de alcance: `SAFE_PROMPT_2_PERFIL_COLABORADOR.md` (aportado por el usuario, no versionado en
el repo) y su apéndice visual. Ante cualquier duda de detalle no cubierto aquí, ese documento tiene
precedencia sobre las decisiones de implementación de esta fase, salvo las dos desviaciones deliberadas que
se documentan a continuación (acordadas explícitamente con el usuario antes de planear).

## Desviaciones deliberadas del prompt original

### 1. Rutas: se conserva el prefijo `/app/`

El prompt pide rutas sin prefijo (`/dashboard`, `/perfil`, `/solicitudes`, `/configuracion`, `/tutoriales`) y
prohíbe explícitamente `/app/...`. El repositorio actual, sin embargo, tiene las 9 fases de Empresa
construidas enteramente bajo `/app/*` (`/app/dashboard`, `/app/empresa`, `/app/financiero`, ...). Renombrar
esas rutas para cumplir la letra del prompt tocaría enlaces, breadcrumbs y navegación en las 9 fases ya
construidas — alto riesgo para cero beneficio funcional.

**Decisión (confirmada con el usuario):** Colaborador vive bajo el mismo prefijo: `/app/dashboard`,
`/app/perfil`, `/app/perfil/editar`, `/app/perfil/vista-previa`, `/app/perfil/resenas`, `/app/solicitudes`,
`/app/solicitudes/:solicitudId`, `/app/configuracion` (+ `/app/configuracion/cuenta`), `/app/tutoriales`. El
resolver por rol que pide la Sección 5.1 del prompt (mismo path, pantalla distinta según rol) se implementa
igual, solo que dentro de `/app/*`. El *intento* del prompt (rutas compartidas resueltas por rol, sin
duplicar URL) se cumple; solo cambia el prefijo literal.

### 2. Persistencia y pruebas: se mantiene el patrón liviano de las Fases 1-9

El prompt especifica una arquitectura `UI → domain API → client → MSW handler → repository mock
persistente` con mutaciones que sobreviven un refresh, más una suite de pruebas unitarias/integración/E2E y
scripts `npm run format|lint|typecheck|test|build|test:e2e`. El repositorio actual no tiene ninguna de esas
piezas — las Fases 1-9 decidieron explícitamente no construir un backend mock ni un test runner (ver
`docs/superpowers/specs/2026-08-10-portal-privado-fase9-configuracion-tutoriales-design.md`, sección
"Alcance recortado").

**Decisión (confirmada con el usuario):** Colaborador extiende `PortalDataContext` con el mismo patrón que
ya usa Empresa (estado de React, mutaciones síncronas, sin persistencia a través de refresh salvo lo que ya
persiste hoy — sesión de auth y tema en `localStorage`). No se agrega MSW, no se agrega repositorio mock
separado, no se agrega test runner. Cada mutación (aceptar solicitud, editar perfil, etc.) actualiza el
estado de React de forma inmutable, igual que `updateEmpresa`, `enviarSolicitudContacto`,
`actualizarPreferencia`, etc. ya hacen hoy. La verificación de cada fase es manual en navegador (`npm run
build` limpio + recorrido de la pantalla), no automatizada.

Como consecuencia, los criterios de aceptación del prompt relacionados con "mutaciones persisten tras
refresh" y con la suite de pruebas (`npm run test`, `test:e2e`) **no se cumplen literalmente** en estas
fases — es la misma limitación, ya aceptada, que tiene todo el resto del portal Empresa.

## Decisiones de arquitectura

### Rol y sesión: `AuthUser` gana `role`, `colaboradorId` y datos de contacto

`AuthContext` (`src/auth/AuthContext.tsx`) hoy modela una sola identidad (Empresa) sin campo de rol:

```ts
export type AuthUser = {
  nombres: string
  apellidos: string
  correo: string
  iniciales: string
  mfaHabilitado: boolean
}
```

Se extiende a:

```ts
export type AppRole = 'EMPRESA' | 'COLABORADOR'

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
  colaboradorId?: string // solo presente cuando role === 'COLABORADOR'
}
```

No se implementa `ADMINISTRADOR` (fuera de alcance, igual que en el prompt). `telefono`/`pais`/`ciudad` se
agregan porque el prompt los pide editables en "Información personal" de Colaborador (Sección 12.2/13.2) y
mapean 1:1 a la tabla `usuario`; Empresa no los muestra todavía en ninguna pantalla, pero llevarlos en
`AuthUser` (identidad única compartida por ambos roles) evita duplicar el mismo dato en dos sitios. Se
seedean con valores plausibles también para el usuario Empresa (`+593 2 298 4410` ya existe como teléfono de
la *empresa* en `mock-portal-data.ts`; el usuario Empresa se seedea con un teléfono personal separado,
Ecuador/Quito) para no dejar campos vacíos si algún componente compartido llegara a leerlos.

`updateUser`, `toggleMfa` se mantienen; `updateUser` amplía su `Pick` a incluir `telefono`.

### Login: se colige el rol del correo tipeado, sin rediseñar la pantalla

`LoginPage`/`SignupPage` (`src/components/LoginPage.tsx`, `SignupPage.tsx`) hoy ignoran lo que el usuario
escribe: el campo de correo es un `<Input>` no controlado y el botón siempre invoca `onIngresar()` sin
argumentos; `App.tsx` responde logueando siempre al mismo usuario Empresa hardcodeado. Es el "cambio interno
de autenticación/router estrictamente necesario" que el prompt permite (Sección 3.1): el campo de correo
pasa a ser controlado (mismo `<Input>`, mismo layout, cero cambio visual) y `onIngresar`/`onCrearCuenta` se
invocan con el valor tipeado. `PublicLayout` en `App.tsx` decide el rol:

```ts
const CORREO_COLABORADOR_DEMO = 'maria.lopez@safe-demo.ec'

function loginDemo(correoTipeado: string) {
  const esColaborador = correoTipeado.trim().toLowerCase() === CORREO_COLABORADOR_DEMO
  login(esColaborador ? usuarioColaboradorDemo : usuarioEmpresaDemo)
  navigate('/app/dashboard')
}
```

Cualquier otro correo (incluido vacío, ya que el campo sigue siendo `required` así que nunca llega vacío al
submit) loguea como Empresa — preserva el comportamiento actual para cualquiera que no conozca el correo
demo de Colaborador, que se documenta en el plan de Fase 10 para pruebas manuales.

### Routing: resolver por rol dentro de `/app/*`, sin duplicar URL

`App.tsx` gana un componente `RoleRoute` que redirige si el rol no coincide (usado en rutas exclusivas de un
rol), y 3 rutas comparten path pero resuelven pantalla distinta según `user.role`:

```tsx
function RoleRoute({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) return <Navigate to="/app/dashboard" replace />
  return <>{children}</>
}
```

```text
/app/dashboard      EMPRESA → DashboardScreen · COLABORADOR → CollaboratorDashboardScreen
/app/configuracion  EMPRESA → ConfiguracionScreen · COLABORADOR → CollaboratorSettingsScreen
  (+ /app/configuracion/cuenta se mantiene compartida sin cambios: mismo componente EditarCuentaScreen
  sirve a ambos roles, ya que solo edita nombres/apellidos/correo de AuthUser)
/app/tutoriales     EMPRESA → TutorialesScreen · COLABORADOR → CollaboratorTutorialsScreen
```

Todas las demás rutas de Empresa (`/app/empresa`, `/app/financiero`, `/app/indicadores`,
`/app/obligaciones`, `/app/simulador`, `/app/plan*`) se envuelven en `<RoleRoute allow={['EMPRESA']}>`.
`/app/marketplace*` se mantiene accesible solo a Empresa (Colaborador no compra en el Marketplace — el
prompt lo prohíbe explícitamente, Sección 1). Las rutas nuevas de Colaborador
(`/app/perfil`, `/app/perfil/editar`, `/app/perfil/vista-previa`, `/app/perfil/resenas`, `/app/solicitudes`,
`/app/solicitudes/:solicitudId`) se envuelven en `<RoleRoute allow={['COLABORADOR']}>`. El index
(`/app` → `dashboard`) y el catch-all (`/app/*` → `dashboard`) no cambian: ambos roles aterrizan en
`/app/dashboard`, que ya resuelve por rol.

### Shell: `Sidebar`/`Topbar`/`AccountMenu` se vuelven role-aware sin tocar el resultado visual de Empresa

Los tres componentes ya leen `useAuth()`/`usePortalData()` directamente (no reciben props de configuración
desde arriba) — el patrón establecido en el repo es que cada componente del shell resuelve su propio
contenido desde los contexts. Se preserva ese patrón: cada componente agrega una rama `role === 'COLABORADOR'`
al principio, y dentro de esa rama usa datasets/acciones distintos. La rama existente para Empresa no se
toca (mismo JSX, mismo `usePortalData()` que ya consumía).

- **`Sidebar`**: `navItems` pasa a resolverse por rol (`navItemsEmpresa` = el array actual sin cambios,
  renombrado; `navItemsColaborador` = nuevo array con las 5 entradas de la Sección 6 del prompt, iconos
  Lucide de la Sección 6.1). El footer de plan/renovación (`usePortalData().planActivoCodigo`,
  `suscripcionCancelada`) solo se renderiza cuando `role === 'EMPRESA'` — Colaborador no tiene plan
  (Sección 6: "No mostrar: plan; footer con renovación de plan").
- **`Topbar`**: `<CompanySwitcher />` solo se renderiza para Empresa; Colaborador muestra un `<span>` de
  texto estático `Perfil Colaborador` en su lugar (mismo contenedor, mismo `flex-1`, para no romper el
  layout responsive ya probado). La campana de alertas tributarias (`TriangleAlert`) solo se renderiza para
  Empresa — Colaborador no tiene alertas tributarias (Sección 7: "No mostrar: campana o icono de alertas
  tributarias"). La campana de notificaciones se mantiene para ambos roles, pero la fuente de datos cambia:
  Empresa sigue leyendo `notificaciones`/`obligaciones` de `mock-portal-data.ts` sin cambios; Colaborador lee
  `notificacionesColaborador` de `PortalDataContext` (Fase 10, ver más abajo). El resto (avatar, nombre,
  `AccountMenu`) es idéntico para ambos roles salvo el contenido del menú.
- **`AccountMenu`**: la lista de enlaces se resuelve por rol. Empresa conserva exactamente los 3 enlaces
  actuales (`Mi cuenta`, `Mi plan`, `Video tutoriales`). Colaborador ve `Mi cuenta` (mismo
  `/app/configuracion/cuenta`) y `Video tutoriales` (mismo `/app/tutoriales`, que resuelve a
  `CollaboratorTutorialsScreen` vía el resolver de arriba) — sin `Mi plan`, porque Colaborador no tiene
  suscripción.

No se crea un segundo `PortalLayout`: el `<Sidebar />`/`<Topbar />` compartido sigue siendo el único shell
para `/app/*`; solo cambia el contenido interno de esos 3 componentes según rol, cumpliendo la
Sección 3.2 del prompt ("Los componentes compartidos pueden refactorizarse para aceptar configuración por
rol, pero deben conservar exactamente el comportamiento y aspecto vigente del perfil Empresa").

### `CompanyIdentity`: componente compartido para mostrar una empresa sin logo

El prompt pide (Sección 10) un componente único `CompanyIdentity` para mostrar la empresa dentro del portal
Colaborador (nueva solicitud del Dashboard, cards de Solicitudes, historial, detalle, reseñas), con esta
regla: usar un asset frontend-only si existe, si no un monograma con iniciales de `nombre_comercial` (o
`razón_social` si el comercial es null). La tabla `empresa` no tiene logo, así que el componente nunca
recibe una URL de imagen real en este prototipo — siempre monograma.

Se crea `src/portal/components/CompanyIdentity.tsx`, deliberadamente desacoplado de la entidad `Empresa`
completa (recibe `{ nombre: string; iniciales?: string }`, no un objeto `Empresa`) para poder alimentarlo
tanto desde solicitudes/citas (que sí referencian una `Empresa` real vía `empresaId` — Fase 12) como desde
reseñas (que solo tienen un string libre `autorEmpresa`, ver más abajo) sin forzar una relación de datos que
hoy no existe:

```tsx
export function CompanyIdentity({
  nombre,
  iniciales,
  size = 'md',
}: {
  nombre: string
  iniciales?: string
  size?: 'sm' | 'md'
}) { /* monograma navy-100/navy-700, mismo lenguaje visual que Sidebar/AccountMenu */ }
```

Un helper puro `inicialesDeNombre(nombre: string): string` (en `src/portal/colaborador/calculo.ts`) deriva
las iniciales cuando el caller no las tiene precomputadas (reseñas); para solicitudes/citas se reutiliza
`Empresa.iniciales`, que ya existe en el modelo desde la Fase 1.

### Reseñas: se reutiliza el seed de Marketplace, sin inventar un join que no existe

`RESENAS_COLABORADORES` (`src/portal/marketplace/catalogo.ts`, creado en Fase 7) ya modela reseñas por
`colaboradorId` con `autorEmpresa: string` — un nombre libre, **no** una relación real a `solicitud_contacto`
ni a `Empresa`. El prompt exige (Sección 8.9) que la empresa autora se resuelva por join
`resena_colaborador.solicitud_contacto_id → solicitud_contacto.empresa_id → empresa`, y prohíbe inventar un
campo `empresa_id` directo en `resena_colaborador`.

**Decisión:** no se toca `RESENAS_COLABORADORES` ni su tipo `ResenaColaborador` (evita cualquier riesgo de
regresión en el perfil profesional de Marketplace, que ya renderiza estas reseñas para Empresa desde la Fase
7). Las pantallas nuevas de Colaborador (Dashboard, Perfil, Todas las reseñas — Fase 11) leen el mismo
`RESENAS_COLABORADORES` filtrado por `colaboradorId` + `estado === 'PUBLICADA'`, y usan `autorEmpresa` como
el nombre a mostrar en `CompanyIdentity` (con iniciales derivadas de ese string). No se agrega `empresaId` a
`ResenaColaborador` — cumple la letra de la restricción del prompt ("no inventar `empresa_id` dentro de
`resena_colaborador`") sin necesidad de construir un join que el resto del prototipo no soporta.

### Modelo de datos: extensión de `types.ts`

`ColaboradorMarketplace` (Fase 7) ya modela la mayoría de columnas de la tabla `colaborador` que el prompt
pide mostrar en el Perfil profesional (`areaEspecializacion`, `profesion`, `trabajoActual`,
`descripcionProfesional`, `modalidadAtencion`, `paisAtencion`, `ciudadAtencion`, `zonaHoraria`,
`tarifaReferencial`, `aniosExperiencia`, `cvVisible`, `estadoDisponibilidad`, `visibleMarketplace`, `estado`,
`numeroLicencia?`, `entidadEmisora?`, `especialidadIds`, `especialidadPrincipalId`,
`calificacionPromedio`, `cantidadResenas`). Faltan: `fotoPerfilUrl`, `cvUrl`, `archivoCredencialUrl`, y una
relación especialidad→años-de-experiencia (el prompt pide años de experiencia *por especialidad*, Sección
8.4 `colaborador_especialidad.anios_experiencia`; hoy solo existe `aniosExperiencia` general del
colaborador).

**Se agregan campos, no se quitan los existentes**, para no romper Marketplace/Fase 7:

```ts
export type EspecialidadColaboradorRelacion = {
  especialidadId: string
  esPrincipal: boolean
  aniosExperiencia: number
  activo: boolean
}

export type ColaboradorMarketplace = {
  // ...todos los campos existentes sin cambios...
  fotoPerfilUrl?: string
  cvUrl?: string
  archivoCredencialUrl?: string
  especialidades: EspecialidadColaboradorRelacion[] // nuevo — fuente de verdad para el editor de Colaborador
}
```

`especialidadIds`/`especialidadPrincipalId` (los campos planos que Marketplace ya filtra/ordena) **se
mantienen** como campos independientes, pero pasan a mantenerse sincronizados a mano con `especialidades`
en los 13 seeds (12 existentes + la nueva colaboradora demo): `especialidadIds = especialidades.filter(e =>
e.activo).map(e => e.especialidadId)`, `especialidadPrincipalId = especialidades.find(e =>
e.esPrincipal)!.especialidadId`. Cuando el editor de especialidades de Colaborador (Fase 11) mute
`especialidades`, la mutación en `PortalDataContext` recalcula también los dos campos planos en el mismo
`setState`, así que Marketplace (que solo lee los planos) sigue funcionando sin cambios en su código de
filtrado/orden. Se documenta como redundancia deliberada — la alternativa (derivar los planos en cada
lectura desde `especialidades`) tocaría `catalogo.ts`/`calculo.ts` de Marketplace, mayor superficie de
riesgo para una fase que debe dejar Empresa intacta.

`SolicitudContacto` (Fase 7) hoy es minimalista — vive en `Record<empresaId, SolicitudContacto[]>` dentro
de `PortalDataContext`, se crea siempre en estado `'ENVIADA'` desde `ReservaModal` (el flujo de pago de
Empresa es instantáneo/mock, nunca pasa por `PENDIENTE_PAGO`/`PAGADA` explícitos hoy) y no lleva
`empresaId` como campo propio (se infiere de la clave del Record). El prompt pide la máquina de estados
completa y el campo `empresa_id` explícito (Sección 8.7, necesario para que las pantallas de Colaborador
puedan mostrar la empresa sin depender del contexto de iteración del Record). Se extiende:

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
  empresaId: string // nuevo
  colaboradorId: string
  servicioId: string
  fechaPreferida: string
  horaPreferida: string
  descripcion: string
  estado: EstadoSolicitudContacto // antes: literal 'ENVIADA'
  fechaRespuesta?: string // nuevo
  motivoRechazo?: string // nuevo
  contactoLiberadoAt?: string // nuevo
  createdAt: string
}
```

`enviarSolicitudContacto` (Empresa, `PortalDataContext.tsx`) ya recibe `empresaId` como primer argumento —
solo se agrega `empresaId` al objeto literal que construye (una línea), sin cambiar su firma ni su
comportamiento visible. El resto de Fase 7 (Marketplace, `ReservaModal`) no referencia `estado` más que para
crear la solicitud, así que ampliar el union type no rompe nada existente (TypeScript sigue aceptando
`'ENVIADA'` como valor válido del union ampliado).

Se agrega `Cita` (no existía ninguna entidad de este tipo en el repo):

```ts
export type EstadoCita = 'PROGRAMADA' | 'CONFIRMADA' | 'COMPLETADA' | 'CANCELADA'

export type Cita = {
  id: string
  solicitudContactoId: string
  colaboradorId: string
  fechaInicio: string // ISO datetime
  fechaFin: string // ISO datetime
  modalidad: Exclude<ModalidadAtencion, 'AMBAS'>
  estado: EstadoCita
  enlaceReunion?: string
  ubicacion?: string
  motivoCancelacion?: string
  createdAt: string
}
```

Notificaciones y preferencias, exclusivas de Colaborador (sin equivalente previo en el repo):

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

Servicios (`ServicioProfesional`) y horarios (`HorarioDisponibilidad`), ambos ya definidos en Fase 7, se
reutilizan sin cambios de forma — Fase 11 los mutará (crear/editar/desactivar servicios, reescribir
horarios) usando exactamente esos tipos.

### `PortalDataContext`: nuevas franjas de estado, mismo patrón que las existentes

Un solo colaborador inicia sesión en este prototipo (no hay selector de colaborador, análogo a como no hay
selector de "usuario Empresa" — solo de empresa activa). Por eso las franjas nuevas son **arreglos planos**,
no `Record<colaboradorId, T[]>` como las franjas de Empresa (que sí necesitan esa forma porque
`CompanySwitcher` permite cambiar de empresa activa). El id del colaborador logueado
(`user.colaboradorId`) se usa para filtrar/anotar, pero el estado en sí no está indexado por él.

```ts
// Nuevas entradas en PortalDataContextValue:
colaboradorPerfil: ColaboradorMarketplace
actualizarColaboradorPerfil: (patch: Partial<ColaboradorMarketplace>) => void
actualizarEspecialidadesColaborador: (especialidades: EspecialidadColaboradorRelacion[]) => void
serviciosColaborador: ServicioProfesional[]
agregarServicioColaborador: (servicio: Omit<ServicioProfesional, 'id' | 'colaboradorId' | 'activo'>) => void
actualizarServicioColaborador: (id: string, patch: Partial<ServicioProfesional>) => void
desactivarServicioColaborador: (id: string) => void
horariosColaborador: HorarioDisponibilidad[]
guardarHorariosColaborador: (horarios: HorarioDisponibilidad[]) => void
solicitudesColaborador: SolicitudContacto[] // todas las solicitudes con colaboradorId === colaboradorPerfil.id, de cualquier empresa
aceptarSolicitudColaborador: (solicitudId: string, modalidad: Exclude<ModalidadAtencion,'AMBAS'>) => { ok: true; cita: Cita } | { ok: false; motivo: string }
rechazarSolicitudColaborador: (solicitudId: string, motivoRechazo: string) => boolean
citasColaborador: Cita[]
notificacionesColaborador: NotificacionColaborador[]
marcarNotificacionColaboradorLeida: (id: string) => void
marcarTodasNotificacionesColaboradorLeidas: () => void
preferenciasNotificacionColaborador: PreferenciaNotificacionColaborador[]
actualizarPreferenciaNotificacionColaborador: (
  categoria: CategoriaNotificacionColaborador,
  patch: Partial<Pick<PreferenciaNotificacionColaborador, 'correoActivo' | 'frecuencia'>>,
) => void
```

`solicitudesColaborador` **no** es una copia independiente de `solicitudesContacto` (el `Record<empresaId,
SolicitudContacto[]>` que ya existe) — se deriva de él con `useMemo` filtrando por `colaboradorId ===
colaboradorPerfil.id` y aplanando todas las claves de empresa. Así, `aceptarSolicitudColaborador`/
`rechazarSolicitudColaborador` mutan el mismo `solicitudesContacto` que Empresa ya usa (buscan la solicitud
en todas las claves del Record, la actualizan en su lugar), sin duplicar la fuente de verdad. Esto también
es lo que permite que aceptar una solicitud desde el lado Colaborador sea visible, en teoría, si Empresa
tuviera una pantalla que leyera esa misma solicitud (no la tiene hoy, pero la consistencia del modelo queda
correcta).

`aceptarSolicitudColaborador` implementa las validaciones de la Sección 19.2 del prompt (pertenencia,
`estado === 'ENVIADA'`, servicio existe/activo/pertenece al colaborador, fecha/hora preferida presentes y no
pasadas, corresponde a un bloque de `horariosColaborador` activo, sin solapamiento con otra cita no
cancelada del colaborador) y la transacción de la Sección 19.3 (solicitud → `ACEPTADA` → `CONTACTO_LIBERADO`
+ crear `Cita` con `estado: 'CONFIRMADA'`) en una sola función pura + una sola actualización de estado.
`rechazarSolicitudColaborador` implementa la Sección 20 (estado → `RECHAZADA`, exige motivo ≥10 caracteres
ya validado en la UI antes de llamar).

`colaboradorPerfil` se inicializa desde el nuevo seed de Marketplace (ver siguiente sección) buscando por
`user.colaboradorId` — si no se encuentra (no debería pasar con el seed controlado de este prototipo), se
usa el primer colaborador del catálogo como fallback defensivo, nunca se muestra una pantalla de error de
"perfil no encontrado" real (el prompt pide esa pantalla en Sección 4.1, pero como este prototipo garantiza
que el único usuario Colaborador seedeado siempre tiene su registro, se documenta como caso no alcanzable en
este prototipo — no se construye la UI de error para un estado que el propio seed nunca produce; ver
"Alcance recortado" de la Fase 10 para el detalle).

### Seeds de Colaborador

Se agrega la colaboradora demo **María Fernanda López Goncalves** (`colaboradorId: 'col-mfl'`) como una
entrada más de `COLABORADORES_MARKETPLACE` en `src/portal/marketplace/catalogo.ts` — así también aparece
para Empresa dentro de Marketplace, coherente con que es una profesional real del catálogo, no una entidad
paralela. Sus 3 especialidades (Planificación financiera, Finanzas corporativas, Análisis financiero) no
existen todavía en `ESPECIALIDADES_PROFESIONALES`; se agregan como 3 códigos nuevos bajo categoría
`Financiero` (mismo patrón que las 14 entradas existentes).

El resto de seeds exclusivos de Colaborador (servicios, horarios, solicitudes con distintos estados, citas,
reseñas ya cubiertas por `RESENAS_COLABORADORES`, notificaciones) se agregan en un módulo nuevo
`src/portal/colaborador/semilla.ts`, consumido únicamente por `PortalDataContext` — se detalla campo a
campo en el plan de Fase 10 (Tarea de seeds), incluyendo las 12 solicitudes `ENVIADA` + variedad de estados
resueltos que exige la Sección 35.8, y las notificaciones variadas de la Sección 35.9. Los servicios nuevos
de la colaboradora demo se agregan a `SERVICIOS_PROFESIONALES` (mismo array de Marketplace, con
`colaboradorId: 'col-mfl'`) y sus horarios a `HORARIOS_DISPONIBILIDAD` — de nuevo, reutilizando las mismas
colecciones que Marketplace ya expone, no arreglos paralelos.

### Cálculos: `src/portal/colaborador/calculo.ts`

Mismo patrón que `marketplace/calculo.ts`/`obligaciones/calculo.ts`: funciones puras, testeables a ojo,
sin acceso a Context. Cubre: conteos de KPIs del Dashboard (Sección 11.1), agrupación de disponibilidad por
día (11.2), tasa de aceptación (11.4 y 21.4), métricas de rendimiento mensual por semana (11.4), validación
+ transacción de aceptar solicitud (19.2/19.3, invocada por `PortalDataContext`), e `inicialesDeNombre` para
`CompanyIdentity`. Se detalla función por función en cada plan de fase, con su tipo de entrada/salida exacto,
para que cada fase pueda escribirlas sin re-derivar las fórmulas del prompt.

## Alcance recortado deliberadamente (aplica a las 4 fases)

- **Sin backend, sin MSW, sin test runner** — ver "Desviaciones deliberadas" arriba.
- **Sin pantalla de error "perfil no encontrado"** (prompt Sección 4.1) — el seed de este prototipo
  garantiza que el único usuario Colaborador siempre tiene `colaborador` asociado; construir la UI de un
  estado inalcanzable es alcance prematuro.
- **Sin flujo de pago real para solicitudes** — se conserva el atajo ya vigente de Fase 7 (Empresa crea la
  solicitud directo en `ENVIADA`, sin pasar por `PENDIENTE_PAGO`/`PAGADA`); el reembolso mock al rechazar
  (Sección 20, "si existe pago asociado aprobado → `pago.estado = REEMBOLSADO`") no tiene un `pago` real que
  marcar en este prototipo (no existe entidad `Pago` de solicitud en el repo, distinta de
  `PagoSuscripcion`), así que esa transición no se implementa — se documenta como no aplicable mientras no
  exista una entidad de pago de solicitud.
- **Sin recálculo de Marketplace al editar el perfil más allá de especialidades/servicios/horarios** — el
  editor de Colaborador (Fase 11) sí actualiza los campos que Marketplace lee (nombre, descripción, tarifa,
  modalidad, especialidades, servicios, horarios, disponibilidad, visibilidad), pero no se construye
  ninguna función de "recalcular ranking" nueva — Marketplace ya recalcula filtros/orden en cada render a
  partir del mismo estado, así que basta con que el editor mute el estado correcto.
- **Sin subir archivos reales** — los file pickers de foto/CV/credencial (Fase 11) generan una URL mock
  (`URL.createObjectURL` o un string determinístico) y la guardan en el campo correspondiente; no hay
  ninguna subida de red.

## Roadmap de archivos nuevos/compartidos entre las 4 fases

```text
src/
├── App.tsx                                        # Modify: RoleRoute, rutas Colaborador, login por correo
├── auth/AuthContext.tsx                            # Modify: role, colaboradorId, telefono/pais/ciudad
├── components/LoginPage.tsx                        # Modify: correo controlado
├── components/SignupPage.tsx                       # Modify: correo controlado
└── portal/
    ├── types.ts                                    # Modify: tipos nuevos/ampliados (ver arriba)
    ├── PortalDataContext.tsx                       # Modify: franjas de Colaborador
    ├── data/mock-portal-data.ts                    # Modify: navItemsColaborador
    ├── components/
    │   ├── Sidebar.tsx                             # Modify: nav + footer role-aware
    │   ├── Topbar.tsx                               # Modify: izquierda/alertas/notificaciones role-aware
    │   ├── AccountMenu.tsx                          # Modify: enlaces role-aware
    │   └── CompanyIdentity.tsx                      # Create
    ├── marketplace/catalogo.ts                      # Modify: colaboradora demo + especialidades nuevas + especialidades[] en los 13 seeds
    └── colaborador/
        ├── calculo.ts                               # Create: funciones puras (KPIs, validaciones, formato de apoyo)
        ├── semilla.ts                                # Create: solicitudes/citas/notificaciones/preferencias semilla
        ├── dashboard/CollaboratorDashboardScreen.tsx # Fase 10
        ├── perfil/*                                  # Fase 11
        ├── solicitudes/*                             # Fase 12
        ├── configuracion/CollaboratorSettingsScreen.tsx # Fase 13
        └── tutoriales/CollaboratorTutorialsScreen.tsx   # Fase 13
```

Cada plan de fase referencia este documento como fuente de las decisiones compartidas y solo detalla lo
específico de su alcance.
