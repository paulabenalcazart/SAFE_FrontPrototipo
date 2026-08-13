# Rediseño acotado de Colaborador y limpieza conservadora — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar Perfil profesional y Solicitudes y citas desde `ec75f7a`, fijar un sidebar sin footer y retirar solo elementos inequívocamente muertos, sin modificar animaciones ni otras pantallas.

**Architecture:** Se conserva el modelo React/contexto/rutas existente. El perfil se recompone dentro de su único screen; Solicitudes reutiliza los componentes y handlers existentes y agrega un panel presentacional de próximas citas respaldado por un helper puro. El sidebar solo cambia su layout desktop. La limpieza es una auditoría evidence-first y puede terminar sin cambios si no existe una eliminación segura.

**Tech Stack:** React 18, TypeScript 5.6, Vite 5, Tailwind CSS v4, react-router-dom 6, Lucide React.

## Global Constraints

- Base funcional: `ec75f7a`; `main` ya fue alineada con `origin/main` antes del primer commit nuevo.
- No modificar `src/App.tsx`, `src/index.css`, `src/portal/PortalLayout.tsx`, Marketplace, páginas públicas ni vista previa pública.
- No agregar, quitar ni ajustar animaciones/transiciones.
- No modificar los overlays `DetalleSolicitudPanel`, `AceptarSolicitudDialog` ni `RechazarSolicitudDialog`.
- No cambiar rutas, semillas, modelos de negocio ni contratos del contexto.
- No agregar dependencias ni un test runner.
- Viewports de aceptación: 390×844, 768×1024, 1024×768 y 1440×900.
- Controles interactivos nuevos o modificados: mínimo 44×44 px, foco visible y label accesible.

---

### Task 1: Reorganizar Perfil profesional

**Files:**
- Modify: `src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx`

**Interfaces:**
- Consumes: `useAuth()`, `usePortalData()`, `RESENAS_COLABORADORES`, helpers de `colaborador/calculo.ts` y formatos existentes.
- Produces: el mismo export `PerfilColaboradorScreen(): JSX.Element`; no cambia rutas ni estado.

- [ ] **Step 1: Escribir contrato RED estático**

Ejecutar:

```powershell
$p = Get-Content -Raw src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx
@('Descripción profesional','Servicios ofrecidos','Especialidades','Datos de cuenta','Reseñas','Información profesional') |
  ForEach-Object { if (-not $p.Contains($_)) { throw "Falta sección: $_" } }
if ($p -notmatch 'lg:grid-cols-12' -or $p -notmatch 'lg:col-span-8' -or $p -notmatch 'lg:col-span-4') {
  throw 'Falta composición 8/4'
}
```

Resultado esperado en la base: FAIL por ausencia de la composición 8/4 y los títulos nuevos.

- [ ] **Step 2: Reemplazar la composición visual conservando datos**

Estructura obligatoria del return:

```tsx
<section className="flex flex-col gap-5">
  <header>{/* identidad, calificación, disponibilidad y acciones existentes */}</header>
  <dl className="grid grid-cols-2 sm:grid-cols-4">{/* 4 datos rápidos */}</dl>
  <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-12 lg:items-start">
    <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
      <section aria-labelledby="perfil-descripcion">Descripción profesional</section>
      <section aria-labelledby="perfil-servicios">Servicios ofrecidos</section>
      <section aria-labelledby="perfil-especialidades">Especialidades</section>
      <section aria-labelledby="perfil-cuenta">Datos de cuenta</section>
      <section aria-labelledby="perfil-resenas">Reseñas</section>
    </div>
    <aside className="min-w-0 lg:col-span-4" aria-labelledby="perfil-profesional">
      Información profesional
    </aside>
  </div>
</section>
```

Requisitos de contenido:

- Conservar los seis datos de `AuthUser`.
- Conservar todos los campos profesionales, CV, credencial, visibilidades, disponibilidad, siete días de horario, servicios y tres reseñas.
- Especialidades se renderiza como cards/lista responsive, nunca como tabla con `min-w-*`.
- No introducir `<main>` local ni `position: sticky` en el aside.

- [ ] **Step 3: Ejecutar GREEN y build**

```powershell
$p = Get-Content -Raw src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx
@('Descripción profesional','Servicios ofrecidos','Especialidades','Datos de cuenta','Reseñas','Información profesional') |
  ForEach-Object { if (-not $p.Contains($_)) { throw "Falta sección: $_" } }
if ($p -match '<main' -or $p -match 'min-w-\[480px\]' -or $p -match '<table') { throw 'Patrón responsive prohibido' }
npm run build
```

Resultado esperado: PASS; 0 errores TypeScript/Vite.

- [ ] **Step 4: Commit**

```powershell
git add src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx
git commit -m "feat: redisenar perfil profesional de colaborador"
```

---

### Task 2: Agregar agenda de próximas citas

**Files:**
- Modify: `src/portal/colaborador/calculo.ts`
- Create: `src/portal/colaborador/solicitudes/ProximasCitasPanel.tsx`

**Interfaces:**
- Produces: `obtenerProximasCitas(citas: Cita[], ahoraIso: string, limite?: number): Cita[]`.
- Produces: `ProximasCitasPanel({ citas }: { citas: Cita[] }): JSX.Element`.

- [ ] **Step 1: RED del helper puro**

```powershell
npx tsx -e "import { obtenerProximasCitas } from './src/portal/colaborador/calculo.ts'; console.log(obtenerProximasCitas)"
```

Resultado esperado: FAIL porque el export aún no existe.

- [ ] **Step 2: Implementar helper mínimo**

```ts
export function obtenerProximasCitas(citas: Cita[], hoyIso: string, limite = 3): Cita[] {
  const inicioDelDia = Date.parse(`${hoyIso}T00:00:00-05:00`)
  return citas
    .filter(
      (cita) =>
        (cita.estado === 'CONFIRMADA' || cita.estado === 'PROGRAMADA') &&
        Date.parse(cita.fechaInicio) >= inicioDelDia,
    )
    .sort((a, b) => Date.parse(a.fechaInicio) - Date.parse(b.fechaInicio))
    .slice(0, Math.max(0, Math.trunc(limite)))
}
```

- [ ] **Step 3: Implementar panel**

El panel debe:

- resolver empresa y servicio con `empresaSolicitantePorId`/`serviciosColaborador`;
- usar `HOY_COLABORADOR_ISO` como reloj fijo;
- mostrar máximo tres citas y un empty state;
- aceptar enlace de reunión solo con:

```ts
function urlHttpSegura(valor?: string): string | null {
  if (!valor) return null
  try {
    const url = new URL(valor)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}
```

- incluir `target="_blank"`, `rel="noreferrer"` y texto accesible contextual.

- [ ] **Step 4: GREEN del helper y build**

```powershell
npx tsx -e "import { obtenerProximasCitas } from './src/portal/colaborador/calculo.ts'; const base={solicitudContactoId:'s',colaboradorId:'c',fechaFin:'2026-08-15T11:00:00-05:00',modalidad:'VIRTUAL',enlaceReunion:'',ubicacion:'',createdAt:'2026-08-01T00:00:00-05:00'} as const; const citas=[{...base,id:'2',estado:'CONFIRMADA',fechaInicio:'2026-08-15T10:00:00-05:00'},{...base,id:'1',estado:'PROGRAMADA',fechaInicio:'2026-08-14T10:00:00-05:00'},{...base,id:'x',estado:'CANCELADA',fechaInicio:'2026-08-13T10:00:00-05:00'}] as never[]; const r=obtenerProximasCitas(citas,'2026-08-13'); if(r.map(x=>x.id).join(',')!=='1,2') throw new Error('agenda'); console.log('agenda: ok')"
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/portal/colaborador/calculo.ts src/portal/colaborador/solicitudes/ProximasCitasPanel.tsx
git commit -m "feat: agregar agenda de proximas citas"
```

---

### Task 3: Rediseñar Solicitudes y citas

**Files:**
- Modify: `src/portal/colaborador/solicitudes/SolicitudesScreen.tsx`
- Modify: `src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx`
- Modify: `src/portal/colaborador/solicitudes/SolicitudPendienteCard.tsx`
- Modify: `src/portal/colaborador/solicitudes/SolicitudesKpis.tsx`
- Modify: `src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx`

**Interfaces:**
- Consumes: `ProximasCitasPanel` de Task 2 y handlers/rutas actuales.
- Preserva: `DetalleSolicitudPanel`, `AceptarSolicitudDialog`, `RechazarSolicitudDialog`, deep link `solicitudId` y mutaciones de contexto.

- [ ] **Step 1: RED de composición**

```powershell
$s = Get-Content -Raw src/portal/colaborador/solicitudes/SolicitudesScreen.tsx
if ($s -notmatch 'ProximasCitasPanel' -or $s -notmatch 'xl:grid-cols-12' -or $s -notmatch 'xl:col-span-7' -or $s -notmatch 'xl:col-span-5') {
  throw 'Composición 7/5 y agenda ausentes'
}
```

- [ ] **Step 2: Componer screen 7/5**

```tsx
<div className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">
  <div className="min-w-0 xl:col-span-7">
    <SolicitudesPendientesPanel {...handlersExistentes} />
  </div>
  <div className="flex min-w-0 flex-col gap-5 xl:col-span-5">
    <ProximasCitasPanel citas={citasColaborador} />
    <SolicitudesKpis solicitudes={solicitudesColaborador} citas={citasColaborador} />
  </div>
</div>
<HistorialSolicitudes solicitudes={solicitudesColaborador} onVerDetalle={abrirDetalle} />
```

El orden anterior también es el orden móvil.

- [ ] **Step 3: Pulir componentes sin cambiar su lógica**

- Pendientes: card blanca, jerarquía Empresa → servicio → metadatos → acciones; buscador de 44 px; `Limpiar búsqueda` reinicia texto y página.
- Acciones: `Ver detalles`, `Aceptar solicitud`, `Rechazar solicitud`; mínimo 44 px y `gap-2`.
- KPIs: grid 2×2 en móvil y desktop dentro de la columna, sin cambiar cálculos.
- Historial: encabezado/buscador/filtro responsivos, tabla `min-w-[560px]` dentro de `overflow-x-auto`, paginación de 44 px y empty state con limpiar filtros.
- No tocar el contenido ni clases de los tres overlays existentes.

- [ ] **Step 4: GREEN, handlers y build**

```powershell
$s = Get-Content -Raw src/portal/colaborador/solicitudes/SolicitudesScreen.tsx
@('DetalleSolicitudPanel','AceptarSolicitudDialog','RechazarSolicitudDialog','navigate(') |
  ForEach-Object { if (-not $s.Contains($_)) { throw "Contrato perdido: $_" } }
if ($s -notmatch 'ProximasCitasPanel' -or $s -notmatch 'xl:col-span-7' -or $s -notmatch 'xl:col-span-5') { throw 'Layout incompleto' }
npm run build
```

- [ ] **Step 5: Commit**

```powershell
git add src/portal/colaborador/solicitudes/SolicitudesScreen.tsx src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx src/portal/colaborador/solicitudes/SolicitudPendienteCard.tsx src/portal/colaborador/solicitudes/SolicitudesKpis.tsx src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx
git commit -m "feat: redisenar solicitudes y citas de colaborador"
```

---

### Task 4: Fijar sidebar y vaciar footer

**Files:**
- Modify: `src/portal/components/Sidebar.tsx`

**Interfaces:**
- Preserva: `navItemsEmpresa`, `navItemsColaborador`, rutas, iconos y estilos activo/inactivo.
- Elimina del componente: dependencias de plan/suscripción y cualquier footer por rol.

- [ ] **Step 1: RED**

```powershell
$s = Get-Content -Raw src/portal/components/Sidebar.tsx
if ($s -match 'sticky top-0' -and $s -notmatch 'Se renueva|suscripcionSemilla|planPorCodigo') { throw 'RED no reproducido' }
```

- [ ] **Step 2: Aplicar layout exacto**

```tsx
<nav
  aria-label="Navegación principal"
  className="sticky top-0 hidden h-screen h-dvh w-[252px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-navy-900 p-3 lg:flex"
>
  <div>{/* logo existente */}</div>
  <div className="flex min-h-0 flex-1 flex-col gap-0.5">
    {/* NavLink existentes */}
  </div>
</nav>
```

No agregar `overflow-y-auto`, plan, renovación, usuario ni tarjeta inferior.

- [ ] **Step 3: GREEN y build**

```powershell
$s = Get-Content -Raw src/portal/components/Sidebar.tsx
if ($s -notmatch 'sticky top-0' -or $s -notmatch 'h-dvh' -or $s -notmatch 'overflow-hidden') { throw 'Sidebar no persistente' }
if ($s -match 'Se renueva|suscripcionSemilla|planPorCodigo|SidebarUserCard|mt-auto') { throw 'Footer no vacío' }
npm run build
```

- [ ] **Step 4: Commit**

```powershell
git add src/portal/components/Sidebar.tsx
git commit -m "fix: fijar sidebar sin contenido inferior"
```

---

### Task 5: Limpieza conservadora evidence-first

**Files:**
- Modify/Delete: solo elementos rastreados que superen todos los criterios del spec.

- [ ] **Step 1: Crear inventario**

```powershell
git ls-files | Sort-Object
rg -n "from ['\"]|import ['\"]|url\(" src vite.config.ts index.html package.json
git status --ignored --short
```

- [ ] **Step 2: Auditar candidatos**

Para cada candidato, registrar:

```text
ruta/paquete → referencias encontradas → rol de entrada/configuración → decisión conservar/eliminar
```

No eliminar por heurística archivos de `public`, entrypoints, CSS, tipos exportados o archivos usados por rutas dinámicas. No modificar `package-lock.json` salvo que una dependencia declarada quede demostrablemente sin uso y sea eliminada también de `package.json`.

- [ ] **Step 3: Eliminar solo candidatos inequívocos**

Usar `apply_patch` por archivo. Si no existe ninguno, documentar `0 eliminaciones seguras` y no crear un commit vacío.

- [ ] **Step 4: Build y commit condicional**

```powershell
npm run build
git diff --check
git status --short
```

Si hubo cambios:

```powershell
git add -u -- .
git diff --cached --name-only
git commit -m "chore: retirar artefactos frontend sin uso"
```

---

### Task 6: Verificación final y regresión

**Files:** ninguno de producción.

- [ ] **Step 1: Verificar allowlist y ausencia de movimiento**

```powershell
git diff --name-only ec75f7a..HEAD
git diff --exit-code ec75f7a -- src/App.tsx src/index.css src/portal/PortalLayout.tsx
git log -S"animation" --oneline ec75f7a..HEAD -- src
git log -S"transition" --oneline ec75f7a..HEAD -- src
```

Los dos últimos comandos deben devolver vacío; el diff de los tres archivos protegidos debe ser 0.

- [ ] **Step 2: Build final**

```powershell
npm run build
git diff --check
```

- [ ] **Step 3: QA responsive**

Recorrer 390×844, 768×1024, 1024×768 y 1440×900:

- Perfil: hero, 4 datos, 8/4, Datos de cuenta sin espacio muerto, servicios, especialidades, reseñas, enlaces.
- Solicitudes: pendientes, limpiar búsqueda, agenda, KPIs, historial/filtro/paginación.
- Deep link, detalle, aceptar y rechazar conservan el flujo previo.
- Sidebar Empresa y Colaborador: fijo, sin scroll propio, área inferior vacía.
- Cero overflow horizontal de página; solo la tabla de historial puede desplazarse dentro de su contenedor.

- [ ] **Step 4: Revisión final**

Solicitar revisión read-only del rango `ec75f7a..HEAD`; corregir Critical/Important y volver a ejecutar build.
