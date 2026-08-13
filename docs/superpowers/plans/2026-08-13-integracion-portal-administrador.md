# Integración del portal administrador Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrar las nueve pantallas de `SAFE_Admin.zip` como el tercer rol autenticado `ADMIN`, accesible con `admin@safe-demo.ec`, sin alterar el comportamiento de Empresa o Colaborador.

**Architecture:** El dominio administrativo vive aislado en `src/portal/admin`, con provider en memoria, CSS encapsulado y módulos cargados de forma diferida. El router, `PortalLayout`, autenticación, títulos y navegación son los del frontend existente; el código independiente del ZIP sirve como fuente funcional, no como segunda aplicación.

**Tech Stack:** Node 24, React 18, TypeScript 5.6, Vite 5, Tailwind CSS 4, React Router 6, Lucide React y `node:test`. Sin dependencias nuevas ni backend.

## Global Constraints

- La rama de trabajo es `dylan_cd`; cada tarea termina con un commit local y no se hace push.
- Fuente extraída de solo referencia: `.superpowers/imports/safe-admin-source-20260813/SAFE_Admin`.
- Login ADMIN exacto: `admin@safe-demo.ec`; identidad Emilio Pino, iniciales EP.
- Signup siempre produce EMPRESA y nunca eleva a ADMIN.
- Datos administrativos en memoria; no usar `localStorage` ni `sessionStorage` para negocio ADMIN.
- No importar el router, layout, sidebar, topbar, `main.tsx`, favicon, logos ni resets CSS del ZIP.
- No contaminar `empresas`, `COLABORADORES_MARKETPLACE` ni el estado operativo de Empresa/Colaborador.
- Rutas exclusivas bajo `/app/admin/*` y protegidas con `RoleRoute allow={['ADMIN']}`.
- CSS administrativo encapsulado bajo `.admin-surface`; sin selectores globales ni otro `@import "tailwindcss"`.
- No añadir ni modificar animaciones/transiciones de landing, Empresa o Colaborador.
- Controles interactivos nuevos de al menos 44×44 px y texto visible no menor de 12 px.
- Tablas pueden hacer scroll horizontal dentro de su tarjeta; la página nunca debe desbordar horizontalmente.
- Overlays con foco inicial, trampa de Tab, Escape, bloqueo de scroll por capas y restauración de foco.
- Compatibilidad ES2020: sustituir `replaceAll` por `replace` con expresión global o `split/join`.
- Usar `AHORA_ADMIN = '2026-08-13T09:00:00-05:00'` para fechas creadas por el demo.
- Verificar 390, 768, 1024 y 1440 px en Chrome y Edge; smoke de los tres roles.

---

### Task 1: Dominio, semilla y pruebas puras administrativas

**Files:**
- Modify: `package.json`
- Create: `src/portal/admin/types.ts`
- Create: `src/portal/admin/catalogo.ts`
- Create: `src/portal/admin/data/semilla.json`
- Create: `src/portal/admin/data/AdminDataContext.tsx`
- Create: `src/portal/admin/lib/filtering.ts`
- Create: `src/portal/admin/lib/format.ts`
- Create: `src/portal/admin/lib/adminMetrics.ts`
- Create: `src/portal/admin/lib/exportExcel.ts`
- Create: `src/portal/admin/lib/documentos.ts`
- Create: `scripts/admin-tests/helpers.mjs`
- Create: `scripts/admin-tests/domain.test.mjs`
- Create: `scripts/admin-tests/seed.test.mjs`

**Interfaces:**
- Produces: `AdminData`, all administrative record types and `AdminCollectionKey`.
- Produces: `AdminDataProvider`, `useAdminData()` and mutation methods.
- Produces: `AHORA_ADMIN`, `ADMIN_DEMO_EMAIL`, `ADMIN_DEMO_USER` and `navItemsAdmin`.
- Produces: `matchesQuery`, `filterByField`, format helpers, `summarizePlans`, `filterSecurity`, `createExcelHtml`, `downloadExcel` and `esUrlAdminPermitida`.

- [ ] **Step 1: Add a portable Node test command**

Add these scripts without changing existing scripts:

```json
"test:admin": "node --test scripts/admin-tests/*.test.mjs",
"verify:admin": "node scripts/verify-admin-ui.mjs"
```

Create `helpers.mjs` with local package resolution:

```js
import fs from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const root = path.resolve(import.meta.dirname, '../..')

export async function importTs(relativePath) {
  const absolute = path.resolve(root, relativePath)
  const source = await fs.readFile(absolute, 'utf8')
  const result = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2020 },
  })
  const temporary = path.resolve(root, `.tmp-admin-${path.basename(relativePath).replace(/\W/g, '-')}.mjs`)
  await fs.writeFile(temporary, result.outputText)
  try {
    return await import(`${pathToFileURL(temporary).href}?v=${Date.now()}`)
  } finally {
    await fs.rm(temporary, { force: true })
  }
}
```

- [ ] **Step 2: Write RED tests for core helpers and seed invariants**

Cover accent-insensitive search, `Todos`, plan/security metrics, Excel escaping, allowed/blocked document protocols, required seed collections, unique IDs, valid references and exact admin identity. Run:

```powershell
npm run test:admin
```

Expected: FAIL because `src/portal/admin` does not exist.

- [ ] **Step 3: Port types, seed and pure helpers**

Copy the complete field coverage from source files:

```text
src/data/types.ts              -> src/portal/admin/types.ts
src/data/seed.json             -> src/portal/admin/data/semilla.json
src/lib/filtering.ts           -> src/portal/admin/lib/filtering.ts
src/lib/format.ts              -> src/portal/admin/lib/format.ts
src/lib/adminMetrics.ts        -> src/portal/admin/lib/adminMetrics.ts
src/lib/exportExcel.ts         -> src/portal/admin/lib/exportExcel.ts
```

Change the seed admin correo to `admin@safe-demo.ec`. Replace every ES2022-only `replaceAll`. Keep `createExcelHtml` pure; call `URL.revokeObjectURL(url)` after download. Add `documentos.ts` using only relative URLs and protocols `http:`, `https:` and `blob:`.

- [ ] **Step 4: Implement the in-memory provider**

Start from the source provider, remove all storage reads/writes, clone the seed for initial/reset state, and centralize immutable mutations. Every `upsertEntity`, `patchEntity`, `removeEntity`, settings update and high-level user workflow appends one audit record using `AHORA_ADMIN`, except mutations of `audits` itself.

Add high-level methods with exact behavior:

```ts
reviewApplication(id, 'APROBADA' | 'RECHAZADA', reason?): void
setManagedUserState(userId, 'ACTIVO' | 'SUSPENDIDO'): void
removeManagedCompany(companyId): void
removeManagedCollaborator(collaboratorId): void
```

Approving creates a linked user and collaborator only when that email has no account. Removing a company retains its owner as `noCompany: true`; removing a collaborator removes the linked user. `resetData` returns the complete seed.

- [ ] **Step 5: Run GREEN and build**

```powershell
npm run test:admin
npm run build
git diff --check
```

- [ ] **Step 6: Commit**

```powershell
git add package.json src/portal/admin scripts/admin-tests
git commit -m "feat: agregar dominio y datos del administrador"
```

---

### Task 2: Primitivas administrativas accesibles y CSS aislado

**Files:**
- Create: `src/portal/admin/admin.css`
- Create: `src/portal/admin/components/data/AdminDataTable.tsx`
- Create: `src/portal/admin/components/data/AdminFilterBar.tsx`
- Create: `src/portal/admin/components/data/AdminSelectFilter.tsx`
- Create: `src/portal/admin/components/ui/AdminButton.tsx`
- Create: `src/portal/admin/components/ui/AdminCard.tsx`
- Create: `src/portal/admin/components/ui/AdminDialog.tsx`
- Create: `src/portal/admin/components/ui/AdminDrawer.tsx`
- Create: `src/portal/admin/components/ui/AdminEmptyState.tsx`
- Create: `src/portal/admin/components/ui/AdminKpiCard.tsx`
- Create: `src/portal/admin/components/ui/AdminPageHeader.tsx`
- Create: `src/portal/admin/components/ui/AdminStatusBadge.tsx`
- Create: `src/portal/admin/components/ui/AdminTabs.tsx`
- Create: `src/portal/admin/components/ui/useAdminOverlay.ts`
- Create: `scripts/verify-admin-ui.mjs`

**Interfaces:**
- Consumes: global `Pagination`, `acquireBodyScrollLock` and `acquireDialogLayer`.
- Produces: admin-prefixed table/filter/UI primitives used by every screen.
- Produces: `useAdminOverlay(open, onClose)` returning `dialogRef` and `titleRef`.

- [ ] **Step 1: Write RED contracts**

`verify-admin-ui.mjs` must fail until it finds: one `.admin-surface` root, no `:root/html/body/@import` in `admin.css`, no unscoped normal selectors, 44 px button contracts, table `caption`/`scope`, and accessible overlay contracts.

```powershell
npm run verify:admin
```

- [ ] **Step 2: Port and rename primitives**

Use source `components/data/*` and `components/ui/*` as the functional baseline. Rename exports with `Admin` prefix and rewrite imports to `@/portal/admin/...`. `AdminDataTable` must use the existing conventional `Pagination`, reset to page 1 when the filtered row identity changes, expose a caption, use `scope="col"`, and label the actions column.

`AdminTabs` must expose `tablist`, `tab`, `aria-selected`, `aria-controls`, `tabpanel` ownership and ArrowLeft/ArrowRight/Home/End keyboard behavior.

- [ ] **Step 3: Implement stacked accessible overlays**

`useAdminOverlay` uses the existing layer/scroll-lock helpers, focuses the title with `requestAnimationFrame`, traps Tab/Shift+Tab only for the top layer, closes only the top layer on Escape, and restores prior focus. Dialog and Drawer associate titles with `aria-labelledby`, use 44 px close buttons and prevent backdrop clicks from leaking.

- [ ] **Step 4: Generate and audit scoped CSS**

Use the source rules after “Page primitives” as the baseline, but:

- prefix every selector with `.admin-surface`;
- remove shell/sidebar/topbar/mobile-nav/dropdown rules and all keyframes/animations;
- alias missing gray and SAFE tokens only inside `.admin-surface`;
- add `.dark .admin-surface` overrides;
- remove inline three-column KPI styles from future screens;
- normalize visible text to at least 12 px and interactive controls to 44 px;
- use the portal breakpoint `lg`/1024 px.

- [ ] **Step 5: Verify and commit**

```powershell
npm run verify:admin
npm run test:admin
npm run build
git diff --check
git add src/portal/admin/components src/portal/admin/admin.css scripts/verify-admin-ui.mjs
git commit -m "feat: agregar componentes accesibles del administrador"
```

---

### Task 3: Rol ADMIN, boundary diferido y shell compartido responsive

**Files:**
- Modify: `src/auth/AuthContext.tsx`
- Modify: `src/App.tsx`
- Modify: `src/titulos.ts`
- Modify: `src/portal/components/Sidebar.tsx`
- Modify: `src/portal/components/Topbar.tsx`
- Modify: `src/portal/components/AccountMenu.tsx`
- Modify: `src/portal/PortalLayout.tsx`
- Create: `src/portal/navigation.ts`
- Create: `src/portal/components/MobileNavigationDrawer.tsx`
- Create: `src/portal/admin/AdminDataBoundary.tsx`
- Create: `src/portal/admin/components/AdminTopbar.tsx`
- Create: `src/portal/admin/dashboard/AdminDashboardScreen.tsx`
- Create: `src/portal/admin/dashboard/AdminPlatformChart.tsx`
- Create: `src/portal/admin/dashboard/AdminRecentActivity.tsx`
- Create: `scripts/admin-tests/integration-contract.test.mjs`

**Interfaces:**
- Consumes: `ADMIN_DEMO_EMAIL`, `ADMIN_DEMO_USER`, `navItemsAdmin`, provider and admin UI primitives.
- Produces: `AppRole = 'EMPRESA' | 'COLABORADOR' | 'ADMIN'` and a functional admin dashboard at `/app/dashboard`.
- Produces: `navItemsParaRol(role)` shared by desktop and mobile navigation.

- [ ] **Step 1: Write RED integration contracts**

Assert source contracts for the ADMIN role, stored-session validation, exact demo email, separate login/signup functions, explicit three-role resolvers, lazy admin boundary, ADMIN title entries, role-scoped navigation, no “Mi plan” for ADMIN and mobile drawer accessibility.

- [ ] **Step 2: Extend authentication safely**

Accept ADMIN in `AppRole` and `readStoredUser`. Define `loginDemo` so normalized `admin@safe-demo.ec` selects `ADMIN_DEMO_USER`, collaborator email selects the collaborator, and all others select Empresa. Define a separate `signupEmpresaDemo` and pass it to `SignupPage`.

- [ ] **Step 3: Add the lazy role boundary**

`AdminDataBoundary` imports `admin.css`, wraps children in `AdminDataProvider`, and is loaded with `React.lazy`. A role-aware provider component mounts `AdminDataBoundary` only for ADMIN and `PortalDataProvider` for the other roles. Use an accessible loading status inside `Suspense`.

- [ ] **Step 4: Make the shared shell role-explicit**

Create `navItemsParaRol` with exhaustive role mapping. Keep the desktop sidebar unchanged in size, sticky behavior and empty lower area. Add a mobile menu button and `MobileNavigationDrawer` for all roles. Split the current non-admin topbar content from the lazy ADMIN topbar so ADMIN never invokes `usePortalData` and Empresa/Colaborador never load the admin seed.

ADMIN topbar shows `Administración SAFE`, open security alerts and the common `AccountMenu`. Account links by role:

```ts
ADMIN: ['/app/configuracion/cuenta', '/app/configuracion', '/app/tutoriales']
COLABORADOR: ['/app/configuracion/cuenta', '/app/tutoriales']
EMPRESA: ['/app/configuracion/cuenta', '/app/plan', '/app/tutoriales']
```

- [ ] **Step 5: Port dashboard and integrate the first route**

Port source Dashboard, PlatformChart and RecentActivity with admin imports and route paths. Replace the dashboard resolver with an exhaustive switch. Add dashboard titles without changing existing routes.

- [ ] **Step 6: Verify browser-independent contracts and commit**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check
git add src/auth src/App.tsx src/titulos.ts src/portal/PortalLayout.tsx src/portal/navigation.ts src/portal/components src/portal/admin
git commit -m "feat: integrar acceso y shell del administrador"
```

---

### Task 4: Gestión administrativa de usuarios y postulaciones

**Files:**
- Create: `src/portal/admin/usuarios/AdminUsersScreen.tsx`
- Create: `src/portal/admin/usuarios/AdminUserDetailDrawer.tsx`
- Create: `src/portal/admin/usuarios/AdminApplicationReviewDialog.tsx`
- Create: `src/portal/admin/usuarios/AdminRegistrationDialog.tsx`
- Create: `src/portal/admin/usuarios/userLogic.ts`
- Modify: `src/App.tsx`
- Modify: `src/titulos.ts`
- Modify: `src/portal/admin/catalogo.ts`
- Modify: `scripts/admin-tests/domain.test.mjs`
- Modify: `scripts/admin-tests/integration-contract.test.mjs`

**Interfaces:**
- Consumes: users/companies/collaborators/applications, relationship-aware context actions and admin primitives.
- Produces: `/app/admin/usuarios` with query tabs `companies|collaborators|applications|tour`.

- [ ] **Step 1: Write RED tests**

Test `deriveUserCounts`, unique email/RUC validation, approval relation creation, company-owner preservation, collaborator cascade removal, safe document URLs and route/title/nav contracts.

- [ ] **Step 2: Port the four-tab screen and drawers**

Preserve all source fields, filters, conventional pagination, export and actions. Replace inline KPI grid styles with responsive classes. Use `useDeferredValue` for the text search. Use safe document links instead of `#document`.

- [ ] **Step 3: Port registration and application review**

Use controlled forms with visible labels, required validation and inline `role="alert"`. New IDs use `crypto.randomUUID`; timestamps use `AHORA_ADMIN`. Approval calls `reviewApplication`; rejection requires a non-empty reason. Destructive actions always open confirmation.

- [ ] **Step 4: Add guarded route/nav/title and verify**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check
git add src/portal/admin/usuarios src/portal/admin/catalogo.ts src/App.tsx src/titulos.ts scripts/admin-tests
git commit -m "feat: integrar gestion administrativa de usuarios"
```

---

### Task 5: Parámetros normativos, planes y permisos

**Files:**
- Create: `src/portal/admin/parametros/AdminParametersScreen.tsx`
- Create: `src/portal/admin/parametros/AdminParameterFormDialog.tsx`
- Create: `src/portal/admin/parametros/parameterUtils.ts`
- Create: `src/portal/admin/parametros/schemas.ts`
- Create: `src/portal/admin/planes/AdminPlansScreen.tsx`
- Create: `src/portal/admin/planes/AdminPlanDialog.tsx`
- Modify: `src/App.tsx`
- Modify: `src/titulos.ts`
- Modify: `src/portal/admin/catalogo.ts`
- Create: `scripts/admin-tests/parameter-schemas.test.mjs`
- Create: `scripts/admin-tests/sql-alignment.test.mjs`

**Interfaces:**
- Produces: `/app/admin/parametros` and `/app/admin/planes-permisos`.
- Preserves all 18 parameter schema IDs and SQL-backed field names from the ZIP.

- [ ] **Step 1: Port RED schema and SQL tests**

Copy the exact required-field matrices from the source tests, update paths to `src/portal/admin/parametros/schemas.ts`, and run `npm run test:admin` expecting failure.

- [ ] **Step 2: Port parameters**

Port source schemas and utilities, replacing `replaceAll`. Preserve four areas, history, filters, export, typed form controls and nested scenario variables/results. Remove the screen’s manual audit insertion because the context now audits every mutation exactly once.

- [ ] **Step 3: Port plans**

Preserve plan metrics, management table, modules, limits and permissions for `USUARIO_EMPRESA`, `COLABORADOR` and `ADMINISTRADOR`. Validate unique code, non-negative price/limits and required name. Prevent deleting a plan with `users > 0`; explain the reason in the confirmation dialog.

- [ ] **Step 4: Add guarded routes/nav/titles and commit**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check
git add src/portal/admin/parametros src/portal/admin/planes src/portal/admin/catalogo.ts src/App.tsx src/titulos.ts scripts/admin-tests
git commit -m "feat: integrar parametros planes y permisos"
```

---

### Task 6: Comunicaciones, plantillas, incidencias y seguridad

**Files:**
- Create: `src/portal/admin/contenido/AdminContentScreen.tsx`
- Create: `src/portal/admin/contenido/AdminCommunicationDialog.tsx`
- Create: `src/portal/admin/contenido/AdminEmailTemplateDialog.tsx`
- Create: `src/portal/admin/auditoria/AdminAuditScreen.tsx`
- Create: `src/portal/admin/auditoria/AdminIncidentDrawer.tsx`
- Create: `src/portal/admin/auditoria/AdminSecurityAlertsScreen.tsx`
- Create: `src/portal/admin/auditoria/AdminSecurityAlertDrawer.tsx`
- Modify: `src/App.tsx`
- Modify: `src/titulos.ts`
- Modify: `src/portal/admin/catalogo.ts`
- Modify: `scripts/admin-tests/integration-contract.test.mjs`

**Interfaces:**
- Produces: content, audit and security routes under `/app/admin`.
- Keeps Security Alerts as a child route reachable from topbar/audit, not a sidebar item.

- [ ] **Step 1: Write RED route/workflow contracts**

Assert communication states/actions, exact template actions, four incident KPIs, both audit shortcuts, date filters, security subroute, prefixed links and confirm-before-delete behavior.

- [ ] **Step 2: Port content workflows**

Preserve tabs, KPIs, filters, export, view/edit/delete, draft/schedule/publish and template token insertion. Use fixed demo timestamps, controlled forms, inline validation and accessible preview/status feedback.

- [ ] **Step 3: Port audit and security workflows**

Preserve incident/log/audit tabs, range filters, export, drawers and resolution. Repoint all links to `/app/admin/...`; resolving an item uses context mutation and creates one audit entry.

- [ ] **Step 4: Add guarded routes/nav/titles and commit**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check
git add src/portal/admin/contenido src/portal/admin/auditoria src/portal/admin/catalogo.ts src/App.tsx src/titulos.ts scripts/admin-tests
git commit -m "feat: integrar contenido y auditoria administrativa"
```

---

### Task 7: Tutoriales y configuración administrativa

**Files:**
- Create: `src/portal/admin/tutoriales/AdminTutorialsScreen.tsx`
- Create: `src/portal/admin/tutoriales/AdminTutorialDialog.tsx`
- Create: `src/portal/admin/configuracion/AdminSettingsScreen.tsx`
- Modify: `src/App.tsx`
- Modify: `src/titulos.ts`
- Modify: `src/portal/admin/catalogo.ts`
- Modify: `scripts/admin-tests/integration-contract.test.mjs`

**Interfaces:**
- Produces: ADMIN resolution for `/app/tutoriales` and `/app/configuracion`.
- Reuses common `/app/configuracion/cuenta` for the personal account.

- [ ] **Step 1: Write RED resolver contracts**

Assert exhaustive three-role tutorial/configuration resolution, full ADMIN sections, no standalone admin logo asset, common account route and admin nav completion with exactly eight sidebar items.

- [ ] **Step 2: Port tutorials**

Preserve table, filters, conventional pagination, export, create/edit, publish/hide and confirmed delete. Validate URL, title, audience, module and duration. Use fixed timestamps and 44 px actions.

- [ ] **Step 3: Port settings**

Preserve identity/localization, security, notifications, templates and system information. Reuse the shared SAFE logo. Preview a selected logo only in memory with a revocable object URL. Save through `updateSettings`; expose `role="status"` feedback. Repoint template links.

- [ ] **Step 4: Finish routes/nav/titles and commit**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check
git add src/portal/admin/tutoriales src/portal/admin/configuracion src/portal/admin/catalogo.ts src/App.tsx src/titulos.ts scripts/admin-tests
git commit -m "feat: completar portal administrativo SAFE"
```

---

### Task 8: QA funcional, responsive y regresión multirrol

**Files:**
- Modify only files implicated by reproduced defects.
- Create ignored reports under `.superpowers/sdd/2026-08-13-integracion-portal-administrador/`.

**Interfaces:**
- Consumes: the complete integrated portal.
- Produces: final evidence and defect-fix commits only; no new feature scope.

- [ ] **Step 1: Run the complete static gate**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check b5e13d0..HEAD
rg -n "safe\.admin\.react|localStorage|sessionStorage|from '/|to=\"/(usuarios|parametros|planes-permisos|alertas-contenido|incidencias-auditoria|alertas-seguridad)'" src/portal/admin
```

The storage and absolute-route scan must have zero matches except intentional document/export browser APIs.

- [ ] **Step 2: Test browser flows**

Try the in-app browser first. If its Node runtime is unavailable, start isolated local Vite and Chrome/Edge CDP profiles. Test:

- anonymous redirect;
- ADMIN login with normalized casing/whitespace, reload and logout;
- Signup with admin email remains EMPRESA;
- forbidden-route matrix for all three roles;
- eight sidebar destinations plus Security Alerts;
- titles and active nav;
- mobile drawer at 390/768 and desktop sidebar at 1024/1440;
- filters/pagination/export and a reversible action in every module;
- overlay focus, Tab loop, Escape, stacked confirmation and focus return;
- light/dark, no page overflow, console/network/exceptions;
- smoke Empresa dashboard/financial/obligations/marketplace and Colaborador dashboard/profile/requests.

- [ ] **Step 3: Fix reproduced issues one at a time**

For each issue, capture failing evidence, apply the smallest scoped patch, rerun the affected flow plus build, request a review gate and commit:

```powershell
git commit -m "fix: corregir hallazgos de integracion administrativa"
```

- [ ] **Step 4: Final verification and review**

```powershell
npm run test:admin
npm run verify:admin
npm run build
git diff --check b5e13d0..HEAD
git status --short --branch
```

Request an independent final review for specification compliance, security boundaries, accessibility, responsive behavior and regressions. Correct every Critical or Important finding in separate commits and repeat the full gate.

