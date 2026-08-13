# Paginación, perfil público y títulos Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mejorar Solicitudes y citas, completar la vista pública del profesional, unificar la paginación y dar un título específico a cada ruta sin tocar animaciones ni flujos existentes.

**Architecture:** La lógica repetible vive en helpers puros (`paginacion.ts`, `documentos.ts`, `titulos.ts`) y la UI compartida en componentes pequeños. Las pantallas conservan fuentes de datos, handlers y rutas; solo cambia la composición y el estado local derivable.

**Tech Stack:** React 18, TypeScript, Vite 5, Tailwind CSS v4, react-router-dom y Lucide React. Sin test runner; RED/GREEN mediante `npx tsx -e`, comprobaciones estáticas y `npm run build`.

## Global Constraints

- `/` es la única ruta cuyo título es exactamente `SAFE Ecuador`.
- No añadir dependencias, backend, persistencia ni carga real de archivos.
- No añadir, quitar ni modificar clases de animación o transición.
- Mantener rutas, contextos, overlays y handlers existentes.
- Controles nuevos con área interactiva mínima de 44×44 px.
- Verificar 390, 768, 1024 y 1440 px sin overflow horizontal de página.
- Cada tarea funcional termina con build, revisión de diff y commit local; no hacer push.

---

### Task 1: Paginación convencional compartida

**Files:**
- Create: `src/portal/paginacion.ts`
- Create: `src/portal/components/Pagination.tsx`

**Interfaces:**
- Produces: `type TokenPaginacion = number | 'ellipsis-start' | 'ellipsis-end'`
- Produces: `crearRangoPaginacion(paginaActual: number, totalPaginas: number): TokenPaginacion[]`
- Produces: `Pagination({ paginaActual, totalPaginas, onChange, ariaLabel? })`

- [ ] **Step 1: Ejecutar RED del helper ausente**

```powershell
npx tsx -e "import { crearRangoPaginacion } from './src/portal/paginacion.ts'; console.log(crearRangoPaginacion(1, 13))"
```

Esperado: FAIL porque el módulo no existe.

- [ ] **Step 2: Implementar el helper puro**

```ts
export type TokenPaginacion = number | 'ellipsis-start' | 'ellipsis-end'

export function crearRangoPaginacion(paginaActual: number, totalPaginas: number): TokenPaginacion[] {
  const total = Math.max(0, Math.floor(totalPaginas))
  if (total === 0) return []
  const actual = Math.min(Math.max(1, Math.floor(paginaActual)), total)
  if (total <= 7) return Array.from({ length: total }, (_, indice) => indice + 1)
  if (actual <= 4) return [1, 2, 3, 4, 5, 'ellipsis-end', total]
  if (actual >= total - 3) return [1, 'ellipsis-start', total - 4, total - 3, total - 2, total - 1, total]
  return [1, 'ellipsis-start', actual - 1, actual, actual + 1, 'ellipsis-end', total]
}
```

- [ ] **Step 3: Ejecutar GREEN de casos límite**

```powershell
npx tsx -e "import assert from 'node:assert/strict'; import { crearRangoPaginacion as r } from './src/portal/paginacion.ts'; assert.deepEqual(r(1,0),[]); assert.deepEqual(r(1,4),[1,2,3,4]); assert.deepEqual(r(1,13),[1,2,3,4,5,'ellipsis-end',13]); assert.deepEqual(r(7,13),[1,'ellipsis-start',6,7,8,'ellipsis-end',13]); assert.deepEqual(r(13,13),[1,'ellipsis-start',9,10,11,12,13]); console.log('pagination helper PASS')"
```

- [ ] **Step 4: Implementar `Pagination`**

Renderizar `nav`, botones Anterior/Siguiente con ChevronLeft/ChevronRight, tokens numéricos y elipsis no interactivas. Usar `aria-current="page"`, labels descriptivos, controles de 44 px y cero clases de movimiento.

- [ ] **Step 5: Verificar y commitear**

```powershell
npm run build
git diff --check
git add src/portal/paginacion.ts src/portal/components/Pagination.tsx
git commit -m "feat: agregar paginacion convencional compartida"
```

---

### Task 2: Solicitudes y citas sin espacio lateral muerto

**Files:**
- Modify: `src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx`
- Modify: `src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx`
- Modify: `src/portal/colaborador/solicitudes/SolicitudesScreen.tsx`
- Preserve unchanged: overlays, `SolicitudPendienteCard.tsx`, `ProximasCitasPanel.tsx`, handlers and routes

**Interfaces:**
- Consumes: `Pagination`
- Preserves: `onVerDetalle`, `onAceptar`, `onRechazar`

- [ ] **Step 1: Ejecutar RED estático**

```powershell
$pending = Get-Content -Raw src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx
$history = Get-Content -Raw src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx
if ($pending -notmatch 'const POR_PAGINA = 2') { throw 'RED: pendientes aún no equilibra las columnas' }
if ($history -notmatch '<Pagination') { throw 'RED: historial aún expone todas las páginas' }
```

Esperado: FAIL en ambos contratos.

- [ ] **Step 2: Equilibrar pendientes**

Cambiar `POR_PAGINA` de 3 a 2 y sustituir el nav local por `Pagination`. Mantener búsqueda, reset, conteo y la composición 7/5 con orden DOM actual.

- [ ] **Step 3: Modernizar historial**

Sustituir `Array.from({ length: totalPaginas })` por `Pagination`. Mantener seis filas, filtros, búsqueda, tabla responsive y estado vacío.

- [ ] **Step 4: Ejecutar GREEN y build**

```powershell
rg -n "const POR_PAGINA = 2|<Pagination|POR_PAGINA = 6" src/portal/colaborador/solicitudes
rg -n "Array.from\(\{ length: totalPaginas" src/portal/colaborador/solicitudes
npm run build
git diff --check
```

El segundo `rg` debe devolver cero coincidencias.

- [ ] **Step 5: Commit**

```powershell
git add src/portal/colaborador/solicitudes/SolicitudesPendientesPanel.tsx src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx src/portal/colaborador/solicitudes/SolicitudesScreen.tsx
git commit -m "feat: optimizar solicitudes y su paginacion"
```

---

### Task 3: Documentos y reseñas del perfil público

**Files:**
- Create: `src/portal/marketplace/documentos.ts`
- Create: `src/portal/marketplace/ResenasProfesionalPanel.tsx`
- Modify: `src/portal/marketplace/PerfilProfesionalContenido.tsx`
- Modify: `src/portal/colaborador/perfil/VistaPreviaPerfilScreen.tsx`
- Modify: `src/portal/colaborador/perfil/TodasLasResenasScreen.tsx`

**Interfaces:**
- Produces: `esUrlDocumentoPermitida(url?: string): boolean`
- Produces: `ResenasProfesionalPanel({ resenas }: { resenas: ResenaColaborador[] })`
- Consumes: `Pagination`

- [ ] **Step 1: Ejecutar RED de URL**

```powershell
npx tsx -e "import { esUrlDocumentoPermitida } from './src/portal/marketplace/documentos.ts'; console.log(esUrlDocumentoPermitida('/cv/demo.pdf'))"
```

Esperado: FAIL porque el módulo no existe.

- [ ] **Step 2: Implementar política de enlaces**

```ts
const PROTOCOLOS_PERMITIDOS = new Set(['http:', 'https:', 'blob:'])

export function esUrlDocumentoPermitida(url?: string): boolean {
  if (!url?.trim()) return false
  try {
    return PROTOCOLOS_PERMITIDOS.has(new URL(url, 'https://safe.local').protocol)
  } catch {
    return false
  }
}
```

- [ ] **Step 3: Ejecutar GREEN de URL**

```powershell
npx tsx -e "import assert from 'node:assert/strict'; import { esUrlDocumentoPermitida as e } from './src/portal/marketplace/documentos.ts'; assert.equal(e('/cv/demo.pdf'),true); assert.equal(e('https://safe.ec/cv.pdf'),true); assert.equal(e('blob:https://safe.ec/abc'),true); assert.equal(e('javascript:alert(1)'),false); assert.equal(e(undefined),false); console.log('document links PASS')"
```

- [ ] **Step 4: Crear panel de reseñas**

Estado local `pagina`, `filtroCalificacion` (0–5) y `orden` (`RECIENTES`/`MEJOR_VALORADAS`). Derivar con `useMemo`, seis por página, página limitada y reset al cambiar filtros. Mostrar labels, conteo, grilla, vacío y `Pagination`.

- [ ] **Step 5: Completar contenido público**

Quitar el bloque promocional Credenciales y el badge de vista previa. Mantener CTA solo en Marketplace. Añadir estado de disponibilidad, campos completos (incluyendo licencia/entidad si existen), sección `Documentos públicos` con CV/credencial y el panel de reseñas. No mostrar correo ni teléfono.

- [ ] **Step 6: Limpiar vista previa y reseñas propias**

Retirar el banner de `VistaPreviaPerfilScreen`; mantener Volver. Sustituir la paginación de `TodasLasResenasScreen` por `Pagination`.

- [ ] **Step 7: Verificar y commitear**

```powershell
rg -n "Vista previa\.|Vista previa del perfil|Perfil validado por SAFE|Experiencia declarada" src/portal/colaborador/perfil/VistaPreviaPerfilScreen.tsx src/portal/marketplace/PerfilProfesionalContenido.tsx
rg -n "Documentos públicos|Hoja de vida|Archivo de credencial|ResenasProfesionalPanel|<Pagination" src/portal/marketplace src/portal/colaborador/perfil/TodasLasResenasScreen.tsx
npm run build
git diff --check
git add src/portal/marketplace/documentos.ts src/portal/marketplace/ResenasProfesionalPanel.tsx src/portal/marketplace/PerfilProfesionalContenido.tsx src/portal/colaborador/perfil/VistaPreviaPerfilScreen.tsx src/portal/colaborador/perfil/TodasLasResenasScreen.tsx
git commit -m "feat: completar vista publica del profesional"
```

El primer `rg` debe devolver cero coincidencias.

---

### Task 4: Disponibilidad prioritaria y visibilidad simplificada

**Files:**
- Modify: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx`
- Modify: `src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx`

**Interfaces:**
- Preserves: `estadoDisponibilidad` in `FormularioPerfil` and `actualizarColaboradorPerfil`
- Preserves internally: `visibleMarketplace` in global type; no visible control

- [ ] **Step 1: Ejecutar RED estático**

```powershell
$edit = Get-Content -Raw src/portal/colaborador/perfil/EditarPerfilScreen.tsx
$profile = Get-Content -Raw src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx
if ($edit -match 'Visible en el marketplace') { throw 'RED: control redundante aún visible' }
if ($profile -match 'Visible en Marketplace|Visibilidad en marketplace') { throw 'RED: etiqueta redundante aún visible' }
```

Esperado: FAIL.

- [ ] **Step 2: Priorizar disponibilidad**

Insertar tras el encabezado una card compacta con estado, explicación y `Switch`; alternar el borrador. Retirar selector duplicado y control Marketplace. Quitar `visibleMarketplace` de `FormularioPerfil`, constructor y patch de guardado sin tocar el tipo global ni bajas.

- [ ] **Step 3: Limpiar perfil propio**

Retirar badge y campo de visibilidad Marketplace; conservar disponibilidad y demás información.

- [ ] **Step 4: Verificar y commitear**

```powershell
rg -n "Disponible para nuevas solicitudes|estadoDisponibilidad" src/portal/colaborador/perfil/EditarPerfilScreen.tsx
rg -n "Visible en Marketplace|Oculto en Marketplace|Visibilidad en marketplace|Visible en el marketplace" src/portal/colaborador/perfil
npm run build
git diff --check
git add src/portal/colaborador/perfil/EditarPerfilScreen.tsx src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx
git commit -m "feat: simplificar disponibilidad del perfil"
```

El segundo `rg` debe devolver cero coincidencias de UI.

---

### Task 5: Títulos únicos por ruta

**Files:**
- Create: `src/titulos.ts`
- Modify: `src/App.tsx`

**Interfaces:**
- Produces: `tituloParaRuta(pathname: string): string`
- Produces inside App: `DocumentTitle(): null`

- [ ] **Step 1: Ejecutar RED**

```powershell
npx tsx -e "import { tituloParaRuta } from './src/titulos.ts'; console.log(tituloParaRuta('/app/solicitudes'))"
```

Esperado: FAIL porque el módulo no existe.

- [ ] **Step 2: Crear tabla ordenada**

Cubrir todas las rutas declaradas en `App.tsx`, evaluando específicas antes de dinámicas y normalizando slash final. Contratos mínimos:

```ts
tituloParaRuta('/') === 'SAFE Ecuador'
tituloParaRuta('/acerca') === 'Acerca de SAFE'
tituloParaRuta('/app/dashboard') === 'Dashboard SAFE'
tituloParaRuta('/app/obligaciones') === 'Obligaciones tributarias SAFE'
tituloParaRuta('/app/simulador') === 'Simulador SAFE'
tituloParaRuta('/app/solicitudes') === 'Solicitudes y citas SAFE'
tituloParaRuta('/ruta-inexistente') === 'SAFE Ecuador'
```

- [ ] **Step 3: Ejecutar GREEN**

```powershell
npx tsx -e "import assert from 'node:assert/strict'; import { tituloParaRuta as t } from './src/titulos.ts'; assert.equal(t('/'),'SAFE Ecuador'); assert.equal(t('/acerca'),'Acerca de SAFE'); assert.equal(t('/app/dashboard'),'Dashboard SAFE'); assert.equal(t('/app/obligaciones/obl-1'),'Detalle de obligación SAFE'); assert.equal(t('/app/simulador'),'Simulador SAFE'); assert.equal(t('/app/solicitudes/sol-1'),'Detalle de solicitud SAFE'); assert.equal(t('/desconocida'),'SAFE Ecuador'); console.log('document titles PASS')"
```

- [ ] **Step 4: Sincronizar documento**

Crear `DocumentTitle` en `App.tsx` con `useLocation`/`useEffect`, asignar `document.title` y montarlo una vez como hermano de `Routes`. No alterar rutas ni clases.

- [ ] **Step 5: Verificar y commitear**

```powershell
rg -n "DocumentTitle|tituloParaRuta|document.title" src/App.tsx src/titulos.ts
npm run build
git diff --check
git add src/titulos.ts src/App.tsx
git commit -m "feat: asignar titulo a cada pantalla"
```

---

### Task 6: Verificación integral

**Files:**
- No production changes unless a reproducible in-scope issue is found.
- Optional ignored report: `.superpowers/sdd/2026-08-13-paginacion-perfil-titulos/qa-report.md`

- [ ] **Step 1: Repetir los tres scripts GREEN**

Ejecutar exactamente los scripts de Tasks 1, 3 y 5.

- [ ] **Step 2: Auditoría de alcance**

```powershell
git diff --check ec75f7a..HEAD
git log -S'animation' --oneline 06e9ada..HEAD -- src
git log -S'transition' --oneline 06e9ada..HEAD -- src
npm run build
```

Los logs de movimiento deben estar vacíos.

- [ ] **Step 3: QA responsive y funcional**

En 390, 768, 1024 y 1440 px verificar Solicitudes, búsqueda/reset, historial/filtros, detalle/overlays; perfil propio; disponibilidad y guardado; vista previa con documentos/filtros/paginación; Marketplace con CTA sin datos privados; títulos públicos/privados/dinámicos; ausencia de overflow y errores de consola/red.

- [ ] **Step 4: Revisión final**

```powershell
git status --short --branch
git log --oneline --reverse 06e9ada..HEAD
```

Solicitar revisión independiente y corregir solo hallazgos reproducibles dentro del alcance, en commit separado.

