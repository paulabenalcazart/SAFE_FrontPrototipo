# Refactor SAFE — Fase 1: Fundamentos y Convenciones Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align `src/portal/data/mock-portal-data.ts` with the existing `semilla`/`catalogo` naming convention already used across the portal, and write the first `CLAUDE.md` documenting that convention plus the project's structure and commands — with zero changes to any mock data value and zero UI changes.

**Architecture:** Two independent, sequential tasks: (1) a pure rename of one data file plus updating its 10 known importers, verified by the existing type-check/build pipeline since there is no UI test runner; (2) a new documentation file with no code impact. Neither task touches component code, mock data values, or `admin/data/semilla.json` (referenced by path string in `scripts/admin-tests/seed.test.mjs` and intentionally out of scope).

**Tech Stack:** React 18.3, TypeScript 5.6 (strict), Vite 5, `tsc -b` for type-checking.

## Global Constraints

- No data value may change — this is a pure rename/documentation phase. `src/portal/data/mock-portal-data.ts`'s content must be byte-identical after the move except for its new path.
- No UI test runner exists in this repo (confirmed: no Vitest/Jest/Playwright dependency, no `*.test.*`/`*.spec.*` under `src/`). Verification for each task is: edit → `npm run build` (runs `tsc -b && vite build`, catches type/compile errors) → manual check in the dev server where applicable → commit.
- `npm run test:admin` (Node's built-in test runner over `scripts/admin-tests/*.test.mjs`) must continue to pass unchanged — nothing in this plan touches `src/portal/admin/data/semilla.json` or the admin domain logic it tests.
- Do not touch `admin/catalogo.ts`, `colaborador/semilla.ts`, or `admin/data/semilla.json` — they already follow the correct convention documented in this phase.

---

## Task 1: Rename `mock-portal-data.ts` to `semilla-portal.ts` and update its importers

**Files:**
- Rename: `src/portal/data/mock-portal-data.ts` → `src/portal/data/semilla-portal.ts`
- Modify: `src/portal/PortalDataContext.tsx:37`
- Modify: `src/portal/components/useTopbarItems.ts:2`
- Modify: `src/portal/configuracion/ConfiguracionScreen.tsx:13`
- Modify: `src/portal/dashboard/DashboardScreen.tsx:3`
- Modify: `src/portal/navigation.ts:2`
- Modify: `src/portal/plan/AdministrarSuscripcionScreen.tsx:8`
- Modify: `src/portal/plan/CambiarPlanModal.tsx:7`
- Modify: `src/portal/plan/CancelarSuscripcionModal.tsx:8`
- Modify: `src/portal/plan/HistorialPagosScreen.tsx:7`
- Modify: `src/portal/plan/PlanScreen.tsx:14`

**Interfaces:**
- Consumes: nothing new — every export name from the old file (`empresaActiva`, `suscripcionSemilla`, `navItemsColaborador`, `navItemsEmpresa`, `notificaciones`, `obligaciones`, `chartSeries`, `indicadores`, `kpis`, etc.) is unchanged; only the module path changes.
- Produces: the same exports, now importable from `@/portal/data/semilla-portal` (or `./data/semilla-portal` relative to `src/portal/PortalDataContext.tsx`).

- [ ] **Step 1: Rename the file with git, preserving history**

```bash
git mv src/portal/data/mock-portal-data.ts src/portal/data/semilla-portal.ts
```

- [ ] **Step 2: Update the import in each of the 9 files using the `@/` alias**

In each file below, replace the substring `@/portal/data/mock-portal-data` with `@/portal/data/semilla-portal`, leaving the rest of the import line (the named imports being pulled in) untouched:

`src/portal/components/useTopbarItems.ts:2`
```ts
import { notificaciones, obligaciones } from '@/portal/data/semilla-portal'
```

`src/portal/configuracion/ConfiguracionScreen.tsx:13`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

`src/portal/dashboard/DashboardScreen.tsx:3`
```ts
import { chartSeries, indicadores, kpis, obligaciones } from '@/portal/data/semilla-portal'
```

`src/portal/navigation.ts:2`
```ts
import { navItemsColaborador, navItemsEmpresa } from '@/portal/data/semilla-portal'
```

`src/portal/plan/AdministrarSuscripcionScreen.tsx:8`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

`src/portal/plan/CambiarPlanModal.tsx:7`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

`src/portal/plan/CancelarSuscripcionModal.tsx:8`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

`src/portal/plan/HistorialPagosScreen.tsx:7`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

`src/portal/plan/PlanScreen.tsx:14`
```ts
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
```

- [ ] **Step 3: Update the one relative import in `PortalDataContext.tsx`**

`src/portal/PortalDataContext.tsx:37` currently ends the multi-line `import { ... } from './data/mock-portal-data'` statement. Replace just the path:

```ts
} from './data/semilla-portal'
```

- [ ] **Step 4: Confirm no other references remain**

Run: `grep -rn "mock-portal-data" src`
Expected: no output (empty result).

- [ ] **Step 5: Verify the build**

Run: `npm run build`
Expected: succeeds with no TypeScript or Vite errors.

- [ ] **Step 6: Verify admin tests are unaffected**

Run: `npm run test:admin`
Expected: passes exactly as it did before this change (this task does not touch `admin/data/semilla.json` or any admin domain file).

- [ ] **Step 7: Manual spot-check in the dev server**

Run: `npm run dev`, log in, and open `/app/dashboard` and `/app/plan` (both consume data re-exported through the renamed file via `PortalDataContext`). Confirm the KPI cards, chart, indicators, obligations, and subscription/plan details still render with the same mock values as before the rename — nothing should look different since no data changed, only its file path.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor(portal): rename mock-portal-data.ts to semilla-portal.ts

Aligns the central portal mock/seed file with the semilla naming
convention already used by colaborador/semilla.ts and
admin/data/semilla.json. No data values changed."
```

---

## Task 2: Create `CLAUDE.md` documenting stack, structure, and conventions

**Files:**
- Create: `CLAUDE.md`

**Interfaces:**
- Consumes: nothing (documentation only).
- Produces: nothing consumed by code — this is the canonical reference for where future mock data, types, and screens should live, referenced by later refactor phases.

- [ ] **Step 1: Create `CLAUDE.md` at the repo root**

```markdown
# SAFE — Portal Financiero

## Stack

- React 18 + TypeScript (strict mode) + Vite 5
- Tailwind CSS v4, CSS-first theme in `src/index.css` (no `tailwind.config.*` file)
- React Router v6
- A small set of Radix UI-based primitives under `src/components/ui` (`button`, `card`, `select`, `checkbox`, `label`, `switch`, `textarea`, `accordion`, `input`) — not yet widely adopted outside the screens that already use them; see "UI conventions" below before adding new usages.
- `lucide-react` for icons
- `class-variance-authority` + `cn()` helper (`src/lib/utils.ts`) for conditional classnames

## Structure

- **Marketing site** (public, unauthenticated): `src/components/*Page.tsx` and sections (`Hero.tsx`, `Navbar.tsx`, `Footer.tsx`, etc.), routed from `src/App.tsx`.
- **Portal** (authenticated app): `src/portal/*`, one subdirectory per business module — `admin`, `colaborador`, `configuracion`, `dashboard`, `empresa`, `financiero`, `indicadores`, `marketplace`, `obligaciones`, `plan`, `simulador`, `tutoriales` — plus `src/portal/components` for widgets shared across modules (`Sidebar`, `Topbar`, `Pagination`, `AlertBox`, `SeverityIcon`, `KpiCard`, etc.).
- `src/portal/PortalDataContext.tsx` is the root data provider for the authenticated app; `src/portal/navigation.ts` builds the per-role nav item list.
- `src/auth/` holds the auth context and route guard (`RequireAuth.tsx`) — this is a prototype with mocked auth, not a real backend integration.

## Data conventions

This is a UI prototype: all data is mocked, and every module owns its data file(s) using one of two conventions.

- **`catalogo.ts`** — static reference/configuration data: dropdown options, nav item lists, service catalogs. Read-only, never mutated at runtime. Used by `admin/catalogo.ts`, `colaborador/tutoriales/catalogo.ts`, `configuracion/catalogo.ts`, `marketplace/catalogo.ts`, `obligaciones/catalogo.ts`, `plan/catalogo.ts`, `simulador/catalogo.ts`, `tutoriales/catalogo.ts`.
- **`semilla.ts` / `semilla.json` / `semilla-portal.ts`** — mock data simulating "live" transactional records for the demo (companies, requests, appointments, notifications, subscriptions). Used by `colaborador/semilla.ts`, `admin/data/semilla.json` (read directly by path in `scripts/admin-tests/seed.test.mjs` — update that reference if this file ever moves), and `portal/data/semilla-portal.ts` (the central cross-module seed, re-exported through `PortalDataContext`).

When adding new mock data to an existing or new module, follow whichever of these two shapes fits — do not invent a third naming pattern (e.g. `mock-*.ts`, `fixtures.ts`).

## Type conventions

- `src/portal/types.ts` — domain types shared by 2+ modules (`Empresa`, `Indicador`, `Notificacion`, `NavItem`, etc.). Add here only when a type is genuinely cross-module.
- `src/portal/<modulo>/types.ts` — types specific to one module, not shared elsewhere (see `src/portal/admin/types.ts`). Not every module needs one — only create it when a module's local types outgrow inline definitions.

## UI conventions

Most portal screens hand-write Tailwind classes directly rather than composing shared components — this is a deliberate, current-state choice to keep per-screen diffs small and self-contained, not an oversight. Do not introduce `src/components/ui/*` primitives into a screen that doesn't already use them unless the task at hand specifically calls for it (e.g. a dedicated UI-consolidation phase). This may change as shared primitives are deliberately extracted in future refactor phases — check `docs/superpowers/specs/` and `docs/superpowers/plans/` for the current state of that work before assuming otherwise.

## Commands

- `npm run dev` — start the Vite dev server
- `npm run build` — `tsc -b && vite build`; this is the only automated compile/type check in the repo (no Vitest/Jest/Playwright, no UI test runner)
- `npm run test:admin` — Node's built-in test runner over `scripts/admin-tests/*.test.mjs` (admin domain logic: seed data shape, parameter schemas, SQL-alignment contracts — not UI)
- `npm run verify:admin` — `scripts/verify-admin-ui.mjs`, a standalone admin UI verification script
- `npm run preview` — preview the production build

## Further reading

Design and implementation history for both the original portal build-out and ongoing refactor phases live in `docs/superpowers/specs/` and `docs/superpowers/plans/`. Check there before starting new structural work — this file documents *current state*, those documents record *why* it got that way and what's planned next.
```

- [ ] **Step 2: Verify the file is valid Markdown and matches current repo state**

Run: `grep -rn "mock-portal-data" CLAUDE.md`
Expected: no output — confirms Step 1 of this task was written after Task 1's rename, referencing `semilla-portal.ts` correctly.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add CLAUDE.md documenting stack, structure, and data/type conventions"
```
