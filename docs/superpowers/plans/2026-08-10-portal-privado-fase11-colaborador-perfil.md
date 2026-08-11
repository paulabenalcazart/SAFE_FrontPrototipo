# Portal Privado — Fase 11 (Perfil profesional de Colaborador) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el módulo Perfil profesional de Colaborador completo: ver perfil (`/app/perfil`),
editar perfil (`/app/perfil/editar` — información personal/profesional, CV, credenciales, especialidades,
servicios, disponibilidad), vista previa pública (`/app/perfil/vista-previa`, reutilizando la presentación
de Marketplace de la Fase 7) y todas las reseñas (`/app/perfil/resenas`).

**Architecture:** Continúa sobre la Fase 10 (rol/sesión, shell, `PortalDataContext` con las franjas de
Colaborador ya wireadas). La vista previa reutiliza la UI de perfil profesional de Marketplace mediante una
extracción quirúrgica de su JSX a un componente compartido, sin alterar el resultado visual de Marketplace
para Empresa. El editor de perfil es una sola pantalla con secciones ancladas (no sub-rutas), consistente
con la Sección 12/13 del prompt.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4, react-router-dom 6,
lucide-react, shadcn/ui (`Button`, `Input`, `Label`, `Textarea`, `Select`, `Switch`). Sin dependencias
nuevas.

## Global Constraints

- Fuente normativa: `docs/superpowers/specs/2026-08-10-portal-privado-fase10-13-colaborador-design.md` y
  `SAFE_PROMPT_2_PERFIL_COLABORADOR.md`, Secciones 12-15.
- Requiere la Fase 10 completa y mergeada (rol/sesión, shell, `colaboradorPerfil` y sus franjas en
  `PortalDataContext`, `CompanyIdentity`, seeds).
- Mismas restricciones de arquitectura que la Fase 10: sin MSW, sin test runner, verificación manual.
- El editor de perfil (`/app/perfil/editar`) es una sola pantalla; las secciones del prompt (12.2 a 13.8) son
  anclas dentro de la misma página, no rutas nuevas — el prompt lo exige explícitamente ("La página es larga
  y seccionada. No convertir cada sección en una ruta del sidebar").
- La Vista previa (`/app/perfil/vista-previa`) **reutiliza** la presentación visual de
  `src/portal/marketplace/PerfilProfesionalScreen.tsx` (Fase 7) — no se construye una segunda UI de perfil
  profesional desde cero. Cualquier cambio a ese archivo debe dejar el Marketplace de Empresa
  pixel-idéntico a como está hoy (comparar antes/después).
- Subida de archivos (foto/CV/credencial) es mock: `URL.createObjectURL(file)` guardado en el campo
  correspondiente, sin red. Tipos/tamaños se validan en el cliente según la Sección 13.1/13.4/13.5 del
  prompt.
- Ejecutar `npm run build` después de cada tarea. Cada tarea requiere revisión de cumplimiento del spec y
  luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                          # Modify: 4 rutas nuevas bajo RoleRoute COLABORADOR
└── portal/
    ├── colaborador/
    │   ├── calculo.ts                               # Modify: validaciones de especialidades/servicios/horarios
    │   ├── formato.ts                                # Create: helpers de formato específicos de Colaborador
    │   └── perfil/
    │       ├── PerfilColaboradorScreen.tsx           # Create: /app/perfil (ver)
    │       ├── VistaPreviaPerfilScreen.tsx           # Create: /app/perfil/vista-previa
    │       ├── TodasLasResenasScreen.tsx             # Create: /app/perfil/resenas
    │       ├── EditarPerfilScreen.tsx                # Create: /app/perfil/editar (shell + secciones simples)
    │       ├── EspecialidadesEditor.tsx              # Create
    │       ├── ServiciosEditor.tsx                   # Create
    │       ├── ServicioFormDialog.tsx                # Create
    │       └── DisponibilidadEditor.tsx              # Create
    └── marketplace/
        ├── PerfilProfesionalContenido.tsx            # Create: extraído de PerfilProfesionalScreen.tsx
        └── PerfilProfesionalScreen.tsx                # Modify: delega en PerfilProfesionalContenido
```

---

### Task 1: Validaciones de perfil en `colaborador/calculo.ts` + `colaborador/formato.ts`

**Files:**
- Modify: `src/portal/colaborador/calculo.ts`
- Create: `src/portal/colaborador/formato.ts`

**Interfaces:**
- Produces: `validarEspecialidades`, `haySolapamientoHorario`, `validarBloqueHorario`,
  `modalidadesCompatibles`, `agruparHorariosEditor` (calculo.ts); `formatEstadoDisponibilidad`,
  `formatModalidadEtiqueta` (formato.ts) — usados por las Tareas 2-8.

- [ ] **Step 1:** En `calculo.ts`, agregar validación de especialidades (Sección 13.6 del prompt: máximo una
  principal, al menos una activa, sin duplicados, años ≥ 0):

```ts
import type { EspecialidadColaboradorRelacion } from '@/portal/types'

export function validarEspecialidades(especialidades: EspecialidadColaboradorRelacion[]): string | null {
  const activas = especialidades.filter((e) => e.activo)
  if (activas.length === 0) return 'Debes tener al menos una especialidad activa.'
  const principales = activas.filter((e) => e.esPrincipal)
  if (principales.length !== 1) return 'Debes marcar exactamente una especialidad como principal.'
  const ids = activas.map((e) => e.especialidadId)
  if (new Set(ids).size !== ids.length) return 'No puedes repetir la misma especialidad.'
  if (especialidades.some((e) => e.aniosExperiencia < 0)) {
    return 'Los años de experiencia no pueden ser negativos.'
  }
  return null
}
```

- [ ] **Step 2:** Agregar validación de bloques de disponibilidad (Sección 13.8: fin > inicio, sin solapar
  bloques del mismo día, modalidad compatible con `modalidad_atencion` general):

```ts
import type { HorarioDisponibilidad, ModalidadAtencion } from '@/portal/types'

export function modalidadesCompatibles(modalidadAtencion: ModalidadAtencion): HorarioDisponibilidad['modalidad'][] {
  if (modalidadAtencion === 'VIRTUAL') return ['VIRTUAL']
  if (modalidadAtencion === 'PRESENCIAL') return ['PRESENCIAL']
  return ['VIRTUAL', 'PRESENCIAL', 'AMBAS']
}

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function haySolapamientoHorario(
  bloques: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>[],
  candidato: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>,
  ignorarIndice?: number,
): boolean {
  const inicioC = horaAMinutos(candidato.horaInicio)
  const finC = horaAMinutos(candidato.horaFin)
  return bloques.some((b, i) => {
    if (i === ignorarIndice) return false
    const inicio = horaAMinutos(b.horaInicio)
    const fin = horaAMinutos(b.horaFin)
    return inicioC < fin && finC > inicio
  })
}

export function validarBloqueHorario(bloque: Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin'>): string | null {
  if (horaAMinutos(bloque.horaFin) <= horaAMinutos(bloque.horaInicio)) {
    return 'La hora de fin debe ser posterior a la hora de inicio.'
  }
  return null
}
```

- [ ] **Step 3:** `npm run build` limpio (funciones nuevas, todavía sin consumidores).
- [ ] **Step 4:** Crear `formato.ts`:

```ts
import type { ModalidadAtencion } from '@/portal/types'

const ETIQUETA_MODALIDAD: Record<ModalidadAtencion, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
  AMBAS: 'Virtual y presencial',
}

export function formatModalidadEtiqueta(modalidad: ModalidadAtencion): string {
  return ETIQUETA_MODALIDAD[modalidad]
}

export function formatEstadoDisponibilidad(estado: 'DISPONIBLE' | 'NO_DISPONIBLE'): string {
  return estado === 'DISPONIBLE' ? 'Disponible' : 'No disponible'
}
```

  (nota: `src/portal/marketplace/formato.ts` ya tiene un `ETIQUETA_MODALIDAD` casi igual pero con
  `AMBAS: 'Mixta'` en vez de `'Virtual y presencial'` — el prompt exige la etiqueta exacta
  `"Virtual y presencial"` para Colaborador (Sección 13.3), distinta de la de Marketplace; por eso este
  archivo nuevo no reutiliza el de Marketplace para esa etiqueta puntual. El resto de helpers de
  `marketplace/formato.ts` — `formatDuracion`, `formatRangoHorario`, `formatTarifaHora`,
  `formatResumenCalificacion` — sí se reutilizan tal cual desde ese archivo en las tareas siguientes, sin
  duplicarlos aquí).
- [ ] **Step 5:** `npm run build` limpio.
- [ ] **Step 6:** Commit `feat: agregar validaciones de perfil y formato de Colaborador`.

---

### Task 2: Ver perfil — `PerfilColaboradorScreen` (`/app/perfil`)

**Files:**
- Create: `src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx`
- Modify: `src/App.tsx` (agregar la ruta)

**Interfaces:**
- Consumes: `colaboradorPerfil`, `serviciosColaborador`, `horariosColaborador` de `usePortalData()`;
  `especialidadProfesionalPorId`, `RESENAS_COLABORADORES` de `marketplace/catalogo`;
  `agruparDisponibilidadPorDia`, `calcularCalificacionPromedio` de `colaborador/calculo`; `formatModalidad`,
  `formatDuracion`, `formatMetaServicio`, `formatResumenCalificacion` de `marketplace/formato`;
  `CompanyIdentity`.

- [ ] **Step 1:** Construir la pantalla siguiendo el orden exacto de la Sección 12 del prompt: cabecera
  (12.1), información personal (12.2, desde `useAuth().user`), información profesional (12.3), especialidades
  (12.4), servicios ofrecidos (12.5), horarios de atención (12.6), reseñas — 3 más recientes (12.7).
  Cabecera:

```tsx
<header className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 md:flex-row md:items-center">
  <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-100 font-display text-[24px] font-bold text-navy-700">
    {colaboradorPerfil.fotoPerfilUrl ? (
      <img src={colaboradorPerfil.fotoPerfilUrl} alt="" className="h-full w-full object-cover" />
    ) : (
      inicialesDeNombre(`${colaboradorPerfil.nombres} ${colaboradorPerfil.apellidos}`)
    )}
  </span>
  <div className="min-w-0 flex-1">
    <h1 className="text-[25px] font-bold leading-tight text-ink-900">
      {colaboradorPerfil.nombres} {colaboradorPerfil.apellidos}
    </h1>
    <p className="mt-1 text-[14px] text-ink-700">{colaboradorPerfil.profesion}</p>
    <p className="mt-0.5 text-[13px] text-ink-500">{especialidadPrincipal?.nombre}</p>
    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-[13px]">
      <span role="img" aria-label={`Calificación ${promedio?.toFixed(1) ?? 'sin datos'} de 5, ${cantidad} reseñas`} className="flex items-center gap-1 font-semibold text-ink-900">
        <Star className="h-4 w-4 fill-amber-deep text-amber-deep" aria-hidden="true" />
        {promedio === null ? 'Sin reseñas' : `${promedio.toFixed(1)} (${cantidad} reseñas)`}
      </span>
      <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${colaboradorPerfil.estadoDisponibilidad === 'DISPONIBLE' ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'}`}>
        {formatEstadoDisponibilidad(colaboradorPerfil.estadoDisponibilidad)}
      </span>
    </div>
  </div>
  <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
    <Button variant="outline" onClick={() => navigate('/app/perfil/vista-previa')}>Vista previa</Button>
    <Button onClick={() => navigate('/app/perfil/editar')}>Editar perfil</Button>
  </div>
</header>
```

  (`especialidadPrincipal` = `especialidadProfesionalPorId(colaboradorPerfil.especialidadPrincipalId)`;
  `promedio`/`cantidad` = `calcularCalificacionPromedio(resenas)` con `resenas =
  RESENAS_COLABORADORES.filter(r => r.colaboradorId === colaboradorPerfil.id)`; `inicialesDeNombre` de
  `colaborador/calculo.ts`, Fase 10).
- [ ] **Step 2:** Sección "Información personal" (12.2) — `<dl>` de 2-3 columnas con Nombres, Apellidos,
  Correo electrónico, Teléfono, País, Ciudad, todos de `useAuth().user` — mismo patrón `<dt>`/`<dd>` que
  `PerfilProfesionalScreen.tsx` de Marketplace ya usa (Fase 7) para "Información profesional".
- [ ] **Step 3:** Sección "Información profesional" (12.3) — `<dl>` con: Área de especialización, Profesión,
  Especialidad principal (nombre resuelto), Otras especialidades (nombres, separados por coma, excluyendo la
  principal), Trabajo actual, Descripción profesional (bloque de texto aparte, no en la `<dl>`), Hoja de
  vida (filename derivado de `cvUrl` con acción "Ver" si existe, o "No cargada"), Hoja de vida visible
  públicamente (Sí/No desde `cvVisible`), Años de experiencia, Modalidad de atención
  (`formatModalidadEtiqueta`), País de atención, Ciudad de atención, Zona horaria, Tarifa referencial
  (`formatTarifaHora` de `marketplace/formato`), Número de licencia (si existe), Entidad emisora (si existe),
  Credencial profesional (estado: "Cargada"/"No cargada" + acción "Ver" si `archivoCredencialUrl` existe),
  Visibilidad en marketplace (Sí/No desde `visibleMarketplace`), Estado de disponibilidad
  (`formatEstadoDisponibilidad`). No mostrar ningún id (`colaboradorId`, `especialidadId`, etc.) — solo
  nombres/valores legibles.
- [ ] **Step 4:** Sección "Especialidades" (12.4) — tabla o lista con columnas Especialidad, Principal
  (etiqueta "Principal" solo en la fila correspondiente), Años de experiencia, Estado (Activa/Inactiva desde
  `activo`), iterando `colaboradorPerfil.especialidades` resueltas contra `ESPECIALIDADES_PROFESIONALES` vía
  `especialidadProfesionalPorId`.
- [ ] **Step 5:** Sección "Servicios ofrecidos" (12.5) — grid de cards (reutilizar clases de
  `PerfilProfesionalScreen.tsx` Fase 7 para las cards de servicio), filtrando `serviciosColaborador` por
  `activo`, mostrando nombre, `formatDuracion`, `formatUSD(tarifaReferencial)` (formato `$XX.XX`, no
  "Desde:" — usar `Intl.NumberFormat` con 2 decimales, distinto del `formatUSD` de `financiero/formato.ts`
  que redondea a 0 decimales; agregar un `formatPrecioServicio` local en este archivo o en
  `colaborador/formato.ts`: `new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(valor)`),
  modalidad, descripción. Si no hay servicios activos: `"Aún no tienes servicios activos. Agrégalos desde Editar perfil."`.
- [ ] **Step 6:** Sección "Horarios de atención" (12.6) — usar `agruparDisponibilidadPorDia(horariosColaborador)`,
  mostrar lunes-domingo, cada bloque como `"08:00 - 12:00   Virtual"`; día sin bloques → `"No disponible"`;
  debajo, texto auxiliar `Zona horaria: {colaboradorPerfil.zonaHoraria}`.
- [ ] **Step 7:** Sección "Reseñas" (12.7) — 3 más recientes (`estado === 'PUBLICADA'`, `sort by fecha desc`,
  `slice(0,3)`), cada card con `CompanyIdentity` (nombre = `resena.autorEmpresa`), estrellas, fecha
  (`formatFecha`), comentario. Botón `"Ver todas las reseñas"` → `navigate('/app/perfil/resenas')`. Vacío:
  `"Aún no tienes reseñas publicadas."`.
- [ ] **Step 8:** `App.tsx` — agregar la ruta, envuelta en `RoleRoute`:

```tsx
<Route path="perfil" element={<RoleRoute allow={['COLABORADOR']}><PerfilColaboradorScreen /></RoleRoute>} />
```

- [ ] **Step 9:** `npm run build` limpio.
- [ ] **Step 10:** Verificación manual: `/app/perfil` como Colaborador muestra las 7 secciones en orden, con
  datos derivados del seed de la Fase 10 (María Fernanda López Goncalves, 3 especialidades, 4 servicios, 6
  días con horario + domingo "No disponible", 3 de las 39 reseñas). Responsive en 390×844: header apilado,
  foto centrada, servicios 1 columna.
- [ ] **Step 11:** Commit `feat: agregar pantalla Ver perfil profesional de Colaborador`.

---

### Task 3: Vista previa pública — extracción compartida con Marketplace

**Files:**
- Create: `src/portal/marketplace/PerfilProfesionalContenido.tsx`,
  `src/portal/colaborador/perfil/VistaPreviaPerfilScreen.tsx`
- Modify: `src/portal/marketplace/PerfilProfesionalScreen.tsx`, `src/App.tsx`

**Interfaces:**
- Produces: `PerfilProfesionalContenido` — recibe el mismo `profesional`/`servicios`/`horarios`/`resenas`
  que `PerfilProfesionalScreen` ya resuelve, más `modo: 'marketplace' | 'vista-previa'` y
  `onSolicitarContacto?: () => void`.

- [ ] **Step 1:** Crear `PerfilProfesionalContenido.tsx` moviendo tal cual el JSX que hoy vive dentro del
  `return (...)` de `PerfilProfesionalScreen.tsx` **desde** la sección `<header>` (línea ~179 del archivo
  actual) **hasta** el cierre de la sección de Reseñas (antes del `{profesionalSolicitud && ...}` del modal
  de reserva) — sin cambiar ninguna clase ni texto. La firma:

```tsx
export function PerfilProfesionalContenido({
  profesional,
  servicios,
  horarios,
  resenas,
  modo,
  onSolicitarContacto,
}: {
  profesional: ColaboradorMarketplace
  servicios: ServicioProfesional[]
  horarios: HorarioDisponibilidad[]
  resenas: ResenaColaborador[]
  modo: 'marketplace' | 'vista-previa'
  onSolicitarContacto?: () => void
}) {
  const especialidades = especialidadesDeColaborador(profesional)
  const puedeSolicitarContacto = modo === 'marketplace' && servicios.length > 0
  // ...resto del cuerpo movido tal cual desde PerfilProfesionalScreen...
}
```

  Dentro del JSX movido, el único cambio de comportamiento (no de markup) es en el botón de la cabecera:

```tsx
{modo === 'marketplace' ? (
  <button
    type="button"
    disabled={!puedeSolicitarContacto}
    onClick={onSolicitarContacto}
    className="min-h-11 w-full rounded-lg bg-navy-600 px-4.5 text-[14px] font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
  >
    {puedeSolicitarContacto ? 'Solicitar contacto' : 'Sin servicios disponibles'}
  </button>
) : (
  <span className="rounded-full bg-navy-100 px-3.5 py-1.5 text-[12.5px] font-semibold text-navy-700 md:self-start">
    Vista previa del perfil
  </span>
)}
```

  Y en la sección "Información profesional" (el `<dl>` de `campos`), agregar una fila de CV **solo** en modo
  `vista-previa` (Sección 14: "CV únicamente si `cv_visible = true`"), sin tocar el array `campos` existente
  usado en modo `marketplace`:

```tsx
const camposBase = [ /* ...exactamente los mismos 12 campos que ya arma PerfilProfesionalScreen hoy... */ ]
const campos =
  modo === 'vista-previa' && profesional.cvVisible && profesional.cvUrl
    ? [...camposBase, { label: 'Hoja de vida', valor: 'Disponible' }]
    : camposBase
```

- [ ] **Step 2:** Reescribir `PerfilProfesionalScreen.tsx` para que delegue en el componente extraído,
  conservando el manejo de `EstadoPerfil` (no encontrado / no disponible), el `<nav>` de migas de pan, el
  `useRef`/`useEffect` de foco, y el `<ReservaModal>`:

```tsx
export function PerfilProfesionalScreen() {
  // ...misma lógica de useState/useParams/useEffect/EstadoPerfil que hoy...
  return (
    <section className="flex flex-col gap-4.5">
      <nav aria-label="Migas de pan" /* ...sin cambios... */ />
      <PerfilProfesionalContenido
        profesional={profesional}
        servicios={servicios}
        horarios={horarios}
        resenas={resenas}
        modo="marketplace"
        onSolicitarContacto={() => setProfesionalSolicitud(profesional)}
      />
      {profesionalSolicitud && puedeSolicitarContacto && (
        <ReservaModal abierto profesional={profesionalSolicitud} onCerrar={() => setProfesionalSolicitud(null)} />
      )}
    </section>
  )
}
```

  (el `<h1 ref={tituloPaginaRef} tabIndex={-1}>` con foco programático que hoy está dentro del `<header>`
  extraído debe seguir recibiendo esa `ref` — pasarla como prop `tituloRef` a `PerfilProfesionalContenido`,
  igual que ya se le pasa a `EstadoPerfil`).
- [ ] **Step 3:** **Verificación de no-regresión obligatoria antes de continuar:** `npm run dev`, abrir
  `/app/marketplace`, entrar al perfil de cualquiera de los 12 profesionales existentes (`col-01` a
  `col-12`), comparar contra una captura o memoria del estado antes de este cambio — debe verse y
  comportarse exactamente igual (breadcrumb, cabecera, botón "Solicitar contacto" habilitado/deshabilitado
  según servicios, secciones de información/servicios/horarios/credenciales/reseñas, `ReservaModal`).
- [ ] **Step 4:** Crear `VistaPreviaPerfilScreen.tsx`:

```tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { RESENAS_COLABORADORES } from '@/portal/marketplace/catalogo'
import { PerfilProfesionalContenido } from '@/portal/marketplace/PerfilProfesionalContenido'

export function VistaPreviaPerfilScreen() {
  const navigate = useNavigate()
  const { colaboradorPerfil, serviciosColaborador, horariosColaborador } = usePortalData()
  const resenas = RESENAS_COLABORADORES.filter(
    (r) => r.colaboradorId === colaboradorPerfil.id && r.estado === 'PUBLICADA',
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <section className="flex flex-col gap-4.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/perfil')}
          className="flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mi perfil
        </button>
      </div>
      <div role="status" className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 text-[13px] text-navy-800">
        <strong className="font-semibold">Vista previa.</strong> Así verán tu perfil las empresas en SAFE.
      </div>
      <PerfilProfesionalContenido
        profesional={colaboradorPerfil}
        servicios={serviciosColaborador.filter((s) => s.activo)}
        horarios={horariosColaborador.filter((h) => h.activo)}
        resenas={resenas}
        modo="vista-previa"
      />
    </section>
  )
}
```

  (importar `ArrowLeft` de `lucide-react`).
- [ ] **Step 5:** `App.tsx` — agregar la ruta:

```tsx
<Route path="perfil/vista-previa" element={<RoleRoute allow={['COLABORADOR']}><VistaPreviaPerfilScreen /></RoleRoute>} />
```

- [ ] **Step 6:** `npm run build` limpio.
- [ ] **Step 7:** Verificación manual: `/app/perfil/vista-previa` como Colaborador muestra el mismo layout
  que un perfil de Marketplace, con el banner "Vista previa" en vez del botón "Solicitar contacto", sin
  mostrar correo/teléfono/ids en ningún punto (ya no se mostraban en Marketplace tampoco, así que esto es
  gratis por herencia del componente extraído).
- [ ] **Step 8:** Commit `feat: reutilizar la presentacion de Marketplace para la vista previa de Colaborador`.

---

### Task 4: Todas las reseñas — `TodasLasResenasScreen` (`/app/perfil/resenas`)

**Files:**
- Create: `src/portal/colaborador/perfil/TodasLasResenasScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `RESENAS_COLABORADORES`, `colaboradorPerfil`, `calcularCalificacionPromedio`, `CompanyIdentity`.

- [ ] **Step 1:** Construir la pantalla (Sección 15 del prompt): título "Todas las reseñas"; header con
  calificación promedio, total de reseñas y distribución 5/4/3/2/1 estrellas (barra horizontal simple por
  cada nivel, con conteo); filtros "Todas"/"5 estrellas".."1 estrella" (botones tipo los tags de
  Tutoriales); lista paginada, 6 por página; cada card: `CompanyIdentity`, calificación con estrellas, fecha,
  comentario. Solo `estado === 'PUBLICADA'`.
- [ ] **Step 2:** Cálculo de distribución local en el archivo (no amerita ir a `calculo.ts` por ser
  puramente de presentación de esta pantalla):

```ts
function distribucionEstrellas(resenas: ResenaColaborador[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const distribucion = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<1 | 2 | 3 | 4 | 5, number>
  for (const r of resenas) distribucion[r.calificacion] += 1
  return distribucion
}
```

- [ ] **Step 3:** Paginación con `useState<number>` de página + `useState<0|1|2|3|4|5>` de filtro (0 =
  "Todas"), `slice((pagina-1)*6, pagina*6)` sobre el arreglo ya filtrado y ordenado `created_at DESC` (campo
  `fecha` del tipo `ResenaColaborador`, formato ISO `YYYY-MM-DD`, comparable con `localeCompare` o
  `String < String`).
- [ ] **Step 4:** `App.tsx` — agregar la ruta:

```tsx
<Route path="perfil/resenas" element={<RoleRoute allow={['COLABORADOR']}><TodasLasResenasScreen /></RoleRoute>} />
```

- [ ] **Step 5:** `npm run build` limpio.
- [ ] **Step 6:** Verificación manual: 39 reseñas semilla, 7 páginas (6×6 + 1×3), filtro por estrellas
  reduce correctamente, distribución numérica cuadra con el conteo real (8 de 4★, 31 de 5★, según la Tarea 5
  de la Fase 10).
- [ ] **Step 7:** Commit `feat: agregar pantalla de todas las reseñas de Colaborador`.

---

### Task 5: Editar perfil — shell y secciones simples (`EditarPerfilScreen`)

**Files:**
- Create: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `colaboradorPerfil`, `actualizarColaboradorPerfil`, `useAuth().user`/`updateUser` de Fase 10.
- Produces: el shell de formulario (estado local, guardar, cancelar, indicador de cambios sin guardar) que
  las Tareas 6-8 completan con especialidades/servicios/disponibilidad.

- [ ] **Step 1:** Estado local del formulario — copia editable de los campos de `usuario` (nombres,
  apellidos, correo, teléfono, país, ciudad) y de `colaborador` (área, profesión, trabajo actual,
  descripción, años, modalidad, país/ciudad de atención, zona horaria, tarifa, `cvVisible`,
  `estadoDisponibilidad`, `visibleMarketplace`, foto/CV/credencial), inicializado desde
  `useAuth().user`/`colaboradorPerfil` con `useState`, comparado contra los valores originales para derivar
  `hayCambiosSinGuardar`:

```tsx
type FormularioPerfil = {
  nombres: string; apellidos: string; correo: string; telefono: string; pais: string; ciudad: string
  areaEspecializacion: string; profesion: string; trabajoActual: string; descripcionProfesional: string
  aniosExperiencia: number; modalidadAtencion: ModalidadAtencion; paisAtencion: string; ciudadAtencion: string
  zonaHoraria: string; tarifaReferencial: number; cvVisible: boolean
  estadoDisponibilidad: 'DISPONIBLE' | 'NO_DISPONIBLE'; visibleMarketplace: boolean
  fotoPerfilUrl?: string; cvUrl?: string; numeroLicencia?: string; entidadEmisora?: string; archivoCredencialUrl?: string
}
```

  (`ModalidadAtencion` desde `@/portal/types`).
- [ ] **Step 2:** Título "Editar perfil profesional", banner de "Cambios sin guardar" (`role="status"`)
  cuando `hayCambiosSinGuardar`, y footer sticky con `Guardar cambios`/`Cancelar` (Sección 13 del prompt).
  `Cancelar` navega a `/app/perfil` sin persistir; si `hayCambiosSinGuardar`, usar `window.confirm` (única
  excepción a "no usar diálogos nativos" del resto del prototipo, aceptable aquí por ser la única forma
  simple de "prevención de pérdida accidental" sin agregar una librería de diálogo nueva) antes de salir. Si
  el usuario navega con el botón "Cancelar" y no hay cambios, navega directo.
- [ ] **Step 3:** Sección "Foto" (13.1) — file picker con `<input type="file" accept="image/jpeg,image/png,image/webp">`,
  validar `file.size <= 5 * 1024 * 1024`, si excede mostrar error inline y no aceptar el archivo; al
  aceptar, `setFormulario(f => ({ ...f, fotoPerfilUrl: URL.createObjectURL(file) }))`; preview circular
  (`<img className="h-24 w-24 rounded-full object-cover">` o el monograma si no hay foto).
- [ ] **Step 4:** Sección "Información personal" (13.2) — campos `nombres`/`apellidos`/`correo`/`telefono`
  (`<Input>`), `pais`/`ciudad` (usar `<Select>` simple con un catálogo corto fijo de países/ciudades de
  Ecuador — no existe un catálogo geográfico en el repo; usar una lista fija de las ~10 ciudades más grandes
  de Ecuador ya usadas como `ciudadAtencion` en los seeds de Marketplace: Quito, Guayaquil, Cuenca, Ambato,
  Manta, Loja, Portoviejo — es aceptable para un prototipo, no se requiere un catálogo geográfico real).
  Validar: nombres/apellidos requeridos, correo con formato válido (regex simple `/^\S+@\S+\.\S+$/`),
  teléfono máx 30 caracteres. Mostrar error inline bajo cada campo inválido al intentar guardar.
- [ ] **Step 5:** Sección "Información profesional" (13.3) — el resto de campos simples (área, profesión,
  trabajo actual, descripción como `<Textarea>`, años como `<Input type="number" min={0}>`, modalidad como
  `<Select>` con las 3 opciones y etiquetas exactas (`formatModalidadEtiqueta`), país/ciudad de atención,
  zona horaria (`<Select>` con al menos `America/Guayaquil`), tarifa como `<Input type="number" min={0} step="0.01">`,
  `cvVisible`/`estadoDisponibilidad`/`visibleMarketplace` como controles `Switch`/`Select` según la Sección
  13.3).
- [ ] **Step 6:** Sección "CV" (13.4) — file picker `accept="application/pdf"`, máx 10 MB; mostrar nombre de
  archivo actual (derivado de la URL o un nombre fijo tipo `CV-{apellido}.pdf` si es mock) + "Reemplazar";
  **no permitir "Eliminar"** si dejaría `cvUrl` vacío (el prompt: "`cv_url` es NOT NULL, no permitir dejarlo
  vacío") — el botón "Reemplazar" siempre exige seleccionar un archivo nuevo antes de aceptar el cambio, no
  hay botón de eliminar independiente.
- [ ] **Step 7:** Sección "Credenciales" (13.5) — `numeroLicencia`/`entidadEmisora` (`<Input>`, opcionales),
  `archivoCredencialUrl` con file picker `accept="application/pdf,image/jpeg,image/png"`, máx 10 MB. Estos sí
  pueden quedar vacíos (no son NOT NULL).
- [ ] **Step 8:** Validación agregada + guardar: al hacer click en "Guardar cambios", correr todas las
  validaciones (personales + las de especialidades/servicios/disponibilidad que las Tareas 6-8 exponen vía
  props/callbacks); si hay errores, mostrarlos y no guardar; si no, llamar
  `updateUser({ nombres, apellidos, correo, telefono, pais, ciudad })` (Fase 10, `AuthContext`) y
  `actualizarColaboradorPerfil({ ...resto de campos de colaborador... })` (Fase 10, `PortalDataContext`), y
  navegar a `/app/perfil`.
- [ ] **Step 9:** `App.tsx` — agregar la ruta:

```tsx
<Route path="perfil/editar" element={<RoleRoute allow={['COLABORADOR']}><EditarPerfilScreen /></RoleRoute>} />
```

- [ ] **Step 10:** `npm run build` limpio.
- [ ] **Step 11:** Commit `feat: agregar shell de Editar perfil de Colaborador (personal, profesional, CV, credenciales)`.

---

### Task 6: Editor de especialidades (`EspecialidadesEditor`)

**Files:**
- Create: `src/portal/colaborador/perfil/EspecialidadesEditor.tsx`
- Modify: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx` (integrar el componente)

**Interfaces:**
- Consumes: `EspecialidadColaboradorRelacion`, `validarEspecialidades` (Task 1), `ESPECIALIDADES_PROFESIONALES`
  filtrado por `activo` (`marketplace/catalogo`).
- Produces: componente controlado `{ value: EspecialidadColaboradorRelacion[]; onChange: (v) => void }`,
  integrado dentro de `EditarPerfilScreen` (Task 5) como una sección más del mismo formulario.

- [ ] **Step 1:** Renderizar una tabla/lista con columnas Especialidad, Años de experiencia (`<Input type="number">`
  editable inline), Principal (radio/botón "Marcar como principal"), Quitar. Botón "Agregar especialidad"
  abre un `<Select>`/combobox con `ESPECIALIDADES_PROFESIONALES.filter(e => e.activo)` excluyendo las ya
  presentes en `value` (evita duplicados desde la UI, además de la validación de `validarEspecialidades`).
- [ ] **Step 2:** "Marcar como principal": al clickear, actualizar `value` para que solo esa entrada tenga
  `esPrincipal: true` y todas las demás `false` (nunca cero principales entre las activas).
- [ ] **Step 3:** "Quitar": si la especialidad quitada era la principal y quedan otras activas, forzar al
  usuario a elegir una nueva principal antes de poder guardar (Sección 13.6: "al quitar la principal y
  existir otras, obligar a seleccionar otra antes de guardar") — implementarlo marcando `esPrincipal: false`
  en todas tras quitar, de forma que `validarEspecialidades` (Task 1) falle con
  `"Debes marcar exactamente una especialidad como principal."` hasta que el usuario elija una, bloqueando
  el guardado general del formulario (Task 5 Step 8 ya corre esta validación antes de guardar).
- [ ] **Step 4:** Mostrar el mensaje de `validarEspecialidades(value)` bajo la sección cuando no sea `null`.
- [ ] **Step 5:** Integrar en `EditarPerfilScreen`: estado `especialidades` inicializado desde
  `colaboradorPerfil.especialidades`, pasado a `<EspecialidadesEditor value={especialidades} onChange={setEspecialidades} />`;
  al guardar (Task 5 Step 8), si `validarEspecialidades(especialidades)` no es `null`, bloquear guardado con
  ese mensaje; si es válido, llamar `actualizarEspecialidadesColaborador(especialidades)` (Fase 10,
  `PortalDataContext`) junto con el resto de cambios.
- [ ] **Step 6:** `npm run build` limpio.
- [ ] **Step 7:** Verificación manual: agregar una especialidad nueva, marcarla principal, quitar la
  original — el formulario no debe permitir guardar hasta que haya exactamente una principal entre las
  activas.
- [ ] **Step 8:** Commit `feat: agregar editor de especialidades al perfil de Colaborador`.

---

### Task 7: Editor de servicios (`ServiciosEditor` + `ServicioFormDialog`)

**Files:**
- Create: `src/portal/colaborador/perfil/ServiciosEditor.tsx`,
  `src/portal/colaborador/perfil/ServicioFormDialog.tsx`
- Modify: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx`

**Interfaces:**
- Consumes: `serviciosColaborador`, `agregarServicioColaborador`, `actualizarServicioColaborador`,
  `desactivarServicioColaborador` de `usePortalData()` (Fase 10); `solicitudesColaborador` (para el aviso de
  confirmación al desactivar un servicio con historial).

- [ ] **Step 1:** `ServiciosEditor` lista todos los servicios (activos e inactivos, con badge de estado),
  botón "Agregar servicio" (Sección 13.7) que abre `ServicioFormDialog` en modo creación; cada fila tiene
  "Editar" (abre el mismo dialog en modo edición, precargado) y "Desactivar" (solo si `activo`).
- [ ] **Step 2:** "Desactivar": si existe alguna `solicitudesColaborador` histórica con ese `servicioId`,
  mostrar `window.confirm('Este servicio tiene solicitudes históricas. ¿Deseas desactivarlo de todas formas?')`
  antes de llamar `desactivarServicioColaborador(id)`; si no hay historial, desactivar directo.
- [ ] **Step 3:** `ServicioFormDialog` — dialog en desktop (usar el patrón de dialog ya existente en el
  repo, ej. `ReservaModal.tsx` de Marketplace como referencia de overlay/estructura) y hoja full-screen en
  móvil (breakpoint `sm`), con los campos exactos de la Sección 13.7: Icono (`<Select>` con las 8 opciones de
  `ServiceIconKey`, ver Task 1 de esta tarea para el tipo), Nombre (`required`, máx 160), Descripción
  (`<Textarea>` opcional), Duración estimada (`<Input type="number" min={1}>`, entero > 0, `required`, con
  texto de ayuda "Ejemplo: 60 = 1 hora"), Tarifa (`<Input type="number" min={0} step="0.01">`, `required`),
  Moneda (texto fijo "USD", read-only), Modalidad (`<Select>` con las 3 etiquetas — nota: el tipo
  `ServicioProfesional['modalidad']` es `Exclude<ModalidadAtencion,'AMBAS'>`, así que aquí solo van
  "Virtual"/"Presencial", **no** "Virtual y presencial" — un servicio individual siempre es una modalidad
  concreta, la mixta es propiedad del colaborador en general, no del servicio).
- [ ] **Step 4:** Definir `ServiceIconKey` y su mapeo Lucide (Sección 12.5 del prompt) en un archivo nuevo
  `src/portal/colaborador/iconos-servicio.ts`:

```ts
import { BarChart3, Calculator, FileSearch, Landmark, Scale, BriefcaseBusiness, TrendingUp, ReceiptText, type LucideIcon } from 'lucide-react'

export type ServiceIconKey = 'analytics' | 'calculator' | 'documents' | 'tax' | 'legal' | 'business' | 'growth' | 'accounting'

export const ICONO_SERVICIO: Record<ServiceIconKey, LucideIcon> = {
  analytics: BarChart3,
  calculator: Calculator,
  documents: FileSearch,
  tax: Landmark,
  legal: Scale,
  business: BriefcaseBusiness,
  growth: TrendingUp,
  accounting: ReceiptText,
}

export const ETIQUETA_ICONO_SERVICIO: Record<ServiceIconKey, string> = {
  analytics: 'Análisis',
  calculator: 'Cálculo',
  documents: 'Documentos',
  tax: 'Tributario',
  legal: 'Legal',
  business: 'Negocios',
  growth: 'Crecimiento',
  accounting: 'Contabilidad',
}
```

  Persistir `iconKey` en un `Record<servicioId, ServiceIconKey>` separado dentro de `PortalDataContext`
  (**no** como columna de `ServicioProfesional`, que mapea a la tabla SQL real — el prompt exige
  explícitamente "Persistir `iconKey` en el repository mock de UI, no como columna SQL"): agregar
  `iconosServicio: Record<string, ServiceIconKey>` + `establecerIconoServicio(servicioId, iconKey)` a
  `PortalDataContext` (mismo patrón `setState` que el resto de franjas), inicializado con un ícono por
  defecto (`'accounting'`) para los 4 servicios semilla de la Tarea 4 de la Fase 10 (ej. Diagnóstico
  financiero → `'analytics'`, Planificación financiera → `'growth'`, Revisión de flujo de caja →
  `'calculator'`, Asesoría para financiamiento → `'business'`).
- [ ] **Step 5:** Al confirmar el dialog en modo creación, llamar
  `const creado = agregarServicioColaborador({ nombre, descripcion, duracionEstimadaMinutos, tarifaReferencial, modalidad })`
  (la Fase 10 ya la dejó devolviendo el `ServicioProfesional` creado) y luego
  `establecerIconoServicio(creado.id, iconKey)`. En modo edición, llamar
  `actualizarServicioColaborador(id, patch)` + `establecerIconoServicio(id, iconKey)`.
- [ ] **Step 6:** Integrar `ServiciosEditor` en `EditarPerfilScreen` como una sección más (no requiere estado
  de formulario local — las mutaciones de servicio son inmediatas contra `PortalDataContext`, igual que en
  Marketplace/Fase 7 las acciones de reserva son inmediatas).
- [ ] **Step 7:** `npm run build` limpio.
- [ ] **Step 8:** Verificación manual: agregar un servicio nuevo con ícono "Cálculo", verificar que aparece
  en `/app/perfil` (Tarea 2) con el ícono Lucide correspondiente; desactivar un servicio con historial →
  confirma con el mensaje esperado; el servicio desactivado deja de aparecer en la vista previa
  (`serviciosColaborador.filter(s => s.activo)`, Tarea 3) pero sigue en el editor con badge "Inactivo".
- [ ] **Step 9:** Commit `feat: agregar editor de servicios con iconos frontend-only al perfil de Colaborador`.

---

### Task 8: Editor de disponibilidad (`DisponibilidadEditor`)

**Files:**
- Create: `src/portal/colaborador/perfil/DisponibilidadEditor.tsx`
- Modify: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx`, `src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx`

**Interfaces:**
- Consumes: `horariosColaborador`, `guardarHorariosColaborador` de `usePortalData()`;
  `haySolapamientoHorario`, `validarBloqueHorario`, `modalidadesCompatibles` (Task 1).

- [ ] **Step 1:** Editor semanal (Sección 13.8): por cada uno de los 7 días, un toggle "Disponible" +
  lista de bloques (hora inicio, hora fin, modalidad, botón eliminar) + "Agregar bloque". El estado local es
  `HorarioDisponibilidad[]` completo (los 7 días, editable), inicializado desde `horariosColaborador` al
  montar.
- [ ] **Step 2:** "Agregar bloque" en un día: agrega un bloque nuevo con valores por defecto
  (`horaInicio: '09:00'`, `horaFin: '10:00'`, `modalidad`: la primera de
  `modalidadesCompatibles(formulario.modalidadAtencion)` — leído desde el estado de "Información
  profesional" de `EditarPerfilScreen`, Tarea 5, pasado como prop). Antes de agregar, correr
  `validarBloqueHorario` + `haySolapamientoHorario` contra los bloques existentes del mismo día; si falla,
  mostrar el error inline junto al día y no agregar.
- [ ] **Step 3:** Editar un bloque existente (cambiar hora/modalidad): misma validación en cada cambio,
  usando `ignorarIndice` para no comparar el bloque contra sí mismo.
- [ ] **Step 4:** Validar compatibilidad de modalidad del bloque contra la modalidad general (Sección 13.8:
  tabla de compatibilidad) — si `formulario.modalidadAtencion` cambia a un valor que ya no admite la
  modalidad de algún bloque existente, marcar esos bloques con error y bloquear el guardado hasta corregirlos
  (no borrarlos automáticamente, para no perder datos sin que el usuario lo decida).
- [ ] **Step 5:** Día sin bloques → mostrar "No disponible" en el resumen de esa fila (el toggle
  "Disponible" en `false` simplemente vacía los bloques de ese día al desactivarlo; volver a activarlo no
  restaura bloques previos automáticamente, empieza vacío — comportamiento simple y predecible).
- [ ] **Step 6:** Al guardar el formulario general (`EditarPerfilScreen`, Task 5 Step 8), si hay algún error
  de disponibilidad pendiente, bloquear el guardado; si no, llamar
  `guardarHorariosColaborador(horariosEditados)`.
- [ ] **Step 7:** Soporte de deep-link con foco (Sección 11.2/13.8: "La entrada desde `Administrar
  disponibilidad` debe enfocar esta sección"): `EditarPerfilScreen` lee `useSearchParams()` — si
  `seccion === 'disponibilidad'`, hacer `scrollIntoView({ behavior: 'smooth' })` + `focus()` sobre el
  `<h2>` de la sección Disponibilidad al montar (mismo patrón de foco por `ref` + `requestAnimationFrame`
  que ya usa `PerfilProfesionalScreen.tsx` de Marketplace).
- [ ] **Step 8:** Actualizar el botón "Administrar disponibilidad" del Dashboard (creado en la Fase 10,
  Tarea 10) — ya navega a `/app/perfil?seccion=disponibilidad`, confirmar que ahora sí llega a una ruta real
  y hace scroll/foco correctamente (antes de esta tarea, `/app/perfil/editar` no existía completo).
- [ ] **Step 9:** `npm run build` limpio.
- [ ] **Step 10:** Verificación manual: intentar agregar un bloque que se solapa con uno existente → error,
  no se agrega. Cambiar modalidad general a "Virtual" con un bloque "Presencial" existente → error visible,
  guardado bloqueado hasta corregir. Desde el Dashboard, clickear "Administrar disponibilidad" → llega a
  Editar perfil con foco/scroll en la sección correcta.
- [ ] **Step 11:** Commit `feat: agregar editor de disponibilidad semanal al perfil de Colaborador`.

---

### Task 9: Verificación final de la fase

**Files:** ninguno (solo verificación).

- [ ] **Step 1:** `rm -rf dist && npm run build` limpio.
- [ ] **Step 2:** Recorrido manual completo de las 4 rutas (`/app/perfil`, `/app/perfil/editar`,
  `/app/perfil/vista-previa`, `/app/perfil/resenas`) en 390×844 y 1366×768 — sin scroll horizontal global,
  servicios en 1/2/3 columnas según breakpoint, reseñas en 1/3 columnas.
- [ ] **Step 3:** Regresión obligatoria de Marketplace (Fase 7): recorrer `/app/marketplace` como Empresa y
  entrar a 2-3 perfiles de profesionales — deben verse y comportarse exactamente igual que antes de esta
  fase (la Tarea 3 ya lo verificó al extraer el componente compartido; repetir aquí como cierre de fase).
- [ ] **Step 4:** Regresión del Dashboard de Colaborador (Fase 10): el botón "Administrar disponibilidad"
  ahora debe funcionar de punta a punta (antes de esta fase llevaba a una ruta inexistente).
- [ ] **Step 5:** Si algo de las regresiones falla, es bloqueante — no continuar a la Fase 12 hasta
  resolverlo.
