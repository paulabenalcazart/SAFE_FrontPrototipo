# SAFE — Portal Financiero

## Stack

- React 18 + TypeScript (strict mode) + Vite 5
- Tailwind CSS v4, CSS-first theme in `src/index.css` (no `tailwind.config.*` file)
- React Router v6
- A small set of primitives under `src/components/ui` (`button`, `card`, `select`, `checkbox`, `label`, `switch`, `textarea`, `accordion`, `input`) — several Radix-backed (`select`, `checkbox`, `label`, `accordion`, `button`), the rest hand-rolled — not yet widely adopted outside the screens that already use them; see "UI conventions" below before adding new usages.
- `lucide-react` for icons
- `class-variance-authority` + `cn()` helper (`src/lib/utils.ts`) for conditional classnames

## Structure

- **Marketing site** (public, unauthenticated): `src/components/*Page.tsx` and sections (`Hero.tsx`, `Navbar.tsx`, `Footer.tsx`, etc.), routed from `src/App.tsx`.
- **Portal** (authenticated app): `src/portal/*`, one subdirectory per business module — `admin`, `colaborador`, `configuracion`, `dashboard`, `empresa`, `financiero`, `indicadores`, `marketplace`, `obligaciones`, `plan`, `simulador`, `tutoriales` — plus `src/portal/components` for widgets shared across modules (`Sidebar`, `Topbar`, `Pagination`, `AlertBox`, `SeverityIcon`, `KpiCard`, etc.), and `src/portal/data` for the central cross-module seed file (see Data conventions below).
- `src/portal/PortalDataContext.tsx` is the root data provider for the authenticated app; `src/portal/navigation.ts` builds the per-role nav item list.
- `src/auth/` holds the auth context and route guard (`RequireAuth.tsx`) — this is a prototype with mocked auth, not a real backend integration.

## Data conventions

This is a UI prototype: all data is mocked, and every module owns its data file(s) using one of two conventions.

- **`catalogo.ts`** — static reference/configuration data: dropdown options, nav item lists, service catalogs. Read-only, never mutated at runtime. Used by `admin/catalogo.ts`, `colaborador/tutoriales/catalogo.ts`, `configuracion/catalogo.ts`, `marketplace/catalogo.ts`, `obligaciones/catalogo.ts`, `plan/catalogo.ts`, `simulador/catalogo.ts`, `tutoriales/catalogo.ts`.
- **`semilla.ts` / `semilla.json` / `semilla-portal.ts`** — mock data simulating "live" transactional records for the demo (companies, requests, appointments, notifications, subscriptions). Used by `colaborador/semilla.ts`, `admin/data/semilla.json` (read directly by path in `scripts/admin-tests/seed.test.mjs` — update that reference if this file ever moves), and `portal/data/semilla-portal.ts` (the central cross-module seed, re-exported through `PortalDataContext`).

When adding new mock data to an existing or new module, follow whichever of these two shapes fits — do not invent a third naming pattern (e.g. `mock-*.ts`, `fixtures.ts`). (`src/lib/plans-data.ts` is a pre-existing exception shared between the marketing site and the portal — leave it as-is, don't fold it into `catalogo.ts`/`semilla` without a dedicated task.)

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
