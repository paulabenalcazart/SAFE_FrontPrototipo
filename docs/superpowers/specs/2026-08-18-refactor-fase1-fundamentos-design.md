# Refactor SAFE — Fase 1: Fundamentos y convenciones (Design)

## Contexto general del refactor (todas las fases)

Se acordó un refactor de todo el proyecto (marketing + portal), **sin quitar ningún dato mock existente**, dividido en 4 fases independientes, cada una con su propio spec → plan → implementación:

1. **Fase 1 — Fundamentos y convenciones** (este documento): documentar y unificar la convención de nombres de datos mock/semilla y de organización de tipos que ya existen implícitamente en el código.
2. **Fase 2 — Primitivas de UI compartidas**: extraer/adoptar componentes compartidos (`Card`, `Badge`, etc.) para los patrones que hoy se repiten a mano en decenas de pantallas (33 archivos repiten el patrón de card `rounded-xl border border-line bg-card p-4`; 13 repiten el patrón de badge/pill `rounded-full px-2.5 py-0.5`).
3. **Fase 3 — Reducción de archivos grandes por módulo**: partir en piezas más chicas (dato vs componente vs hook) los 6 archivos más grandes del repo: `src/portal/marketplace/catalogo.ts` (1014 líneas), `src/portal/colaborador/perfil/EditarPerfilScreen.tsx` (899), `src/portal/marketplace/ReservaModal.tsx` (826), `src/portal/data/mock-portal-data.ts` (710, ver fase 1 para su rename), `src/portal/PortalDataContext.tsx` (620), `src/App.tsx` (591). Se apoya en las primitivas creadas en fase 2.
4. **Fase 4 — Sitio de marketing** (`src/components`, `src/App.tsx` rutas públicas): limpieza equivalente a fase 2/3 mismo criterio, de menor prioridad por tener menos duplicación y ser más chico.

El orden y alcance de estas 4 fases fue confirmado por el usuario. Este documento cubre únicamente el diseño de la **Fase 1**.

## Fase 1 — Objetivo

Documentar y unificar las convenciones de datos mock/semilla y de organización de tipos que ya existen *implícitamente* en el código, para que las fases 2 y 3 (y cualquier trabajo futuro, humano o agente) tengan una regla escrita a la que atenerse. Es una fase de bajo riesgo: casi no toca código, no mueve archivos grandes, no crea componentes de UI nuevos, y **no modifica ni elimina ningún dato mock** — solo renombra un archivo y actualiza sus imports.

## Estado actual (evidencia)

- Convención `catalogo.ts` (datos de referencia/configuración estáticos: opciones de formulario, nav items, listados) ya es el patrón dominante: la siguen `admin/catalogo.ts`, `colaborador/tutoriales/catalogo.ts`, `configuracion/catalogo.ts`, `marketplace/catalogo.ts`, `obligaciones/catalogo.ts`, `plan/catalogo.ts`, `simulador/catalogo.ts`, `tutoriales/catalogo.ts`.
- Convención `semilla.ts`/`semilla.json` (datos mock que simulan registros "vivos" de la demo — empresas, solicitudes, citas, notificaciones) ya la siguen `colaborador/semilla.ts` y `admin/data/semilla.json`.
- La excepción es `src/portal/data/mock-portal-data.ts` (710 líneas): contiene exactamente el mismo tipo de dato "vivo" (empresa activa, indicadores, notificaciones, KPIs, etc.) que un archivo `semilla.ts`, pero con un nombre distinto (`mock-portal-data.ts`) y en su propia carpeta (`src/portal/data/`) en vez de vivir junto a su módulo.
- Tipos: `src/portal/types.ts` concentra los tipos de dominio compartidos entre 2+ módulos (Empresa, Indicador, Notificacion, NavItem, etc.) — patrón correcto y ya usado consistentemente. `src/portal/admin/types.ts` es el único ejemplo de `types.ts` por módulo, para tipos que no se comparten fuera de admin — también un patrón válido.
- No existe hoy ningún `CLAUDE.md`/`AGENTS.md` en la raíz del repo documentando stack, estructura o convenciones.
- `admin/data/semilla.json` se referencia por ruta de string literal en `scripts/admin-tests/seed.test.mjs:8` — no se toca en esta fase, pero cualquier fase futura que renombre ese archivo debe actualizar esa ruta también.

## Cambios de esta fase

### 1. Rename: `mock-portal-data.ts` → `semilla-portal.ts`

- Mover `src/portal/data/mock-portal-data.ts` a `src/portal/data/semilla-portal.ts`, mismo contenido exacto (ningún dato se agrega, quita ni modifica).
- Actualizar los imports en los ~10 archivos que lo referencian (confirmados por grep): `src/portal/navigation.ts`, `src/portal/PortalDataContext.tsx`, `src/portal/plan/AdministrarSuscripcionScreen.tsx`, `src/portal/plan/HistorialPagosScreen.tsx`, `src/portal/plan/CancelarSuscripcionModal.tsx`, `src/portal/plan/PlanScreen.tsx`, `src/portal/plan/CambiarPlanModal.tsx`, `src/portal/configuracion/ConfiguracionScreen.tsx`, `src/portal/dashboard/DashboardScreen.tsx`, `src/portal/components/useTopbarItems.ts`. (La lista exacta de imports a actualizar debe reconfirmarse con grep al momento de implementar, por si el código cambió desde que se escribió este spec.)
- `colaborador/semilla.ts` y `admin/data/semilla.json` no se tocan (ya siguen el patrón correcto).

### 2. Documentar la convención (no reorganizar tipos existentes)

- No se mueve, fusiona ni renombra ningún tipo existente en `portal/types.ts` ni `admin/types.ts`.
- Se documenta la regla para trabajo futuro:
  - `catalogo.ts`: datos de referencia/configuración estáticos.
  - `semilla.ts` / `semilla.json` / `semilla-portal.ts`: datos mock que simulan registros transaccionales/"vivos" de la demo.
  - `portal/types.ts`: tipos de dominio compartidos entre 2+ módulos.
  - `<modulo>/types.ts`: tipos específicos de un módulo, solo si ese módulo los necesita (no es obligatorio crear uno por módulo).

### 3. Crear `CLAUDE.md` en la raíz

Contenido a incluir:
- Stack: React 18 + TypeScript + Vite + Tailwind v4 (CSS-first, sin `tailwind.config.*`), React Router, componentes Radix UI ligeros bajo `src/components/ui`.
- Estructura de carpetas: sitio de marketing (`src/components`, rutas públicas de `App.tsx`) vs portal autenticado (`src/portal/*`, un subdirectorio por módulo).
- Convención catalogo/semilla/types descrita arriba.
- Comandos: `npm run dev`, `npm run build` (tsc -b && vite build — es la única verificación automática de tipos/compilación, no hay test runner de UI), `npm run test:admin` (tests de dominio del admin en Node, no de UI), `npm run verify:admin`.
- Nota explícita: la UI sigue un patrón de Tailwind "a mano" por pantalla con adopción deliberadamente baja de componentes compartidos fuera de los casos ya extraídos — no forzar la adopción de `Card`/`Button`/etc. en archivos que no los usan ya, excepto en el trabajo específico de fase 2/3 de este refactor.
- Referencia a este documento y a los específicos de fase 2/3/4 una vez existan, para que quien retome el refactor sepa dónde está el mapa completo.

## Fuera de alcance de esta fase

- No se dividen archivos grandes (fase 3).
- No se crean ni adoptan componentes de UI nuevos (fase 2).
- No se toca `src/components` (marketing, fase 4).
- No se modifica `admin/data/semilla.json` ni el test que lo lee.
- Ningún dato mock se agrega, quita ni cambia de valor — solo cambia la ruta de un archivo.

## Verificación

- `npm run build` (tsc -b && vite build) debe pasar sin errores tras el rename e imports actualizados.
- `npm run test:admin` debe seguir pasando sin cambios (no toca `admin/data/semilla.json`).
- Revisión manual rápida en el dev server de una pantalla que consuma `semilla-portal.ts` (ej. `/app/dashboard` o `/app/plan`) para confirmar que los datos siguen apareciendo igual que antes del rename.
