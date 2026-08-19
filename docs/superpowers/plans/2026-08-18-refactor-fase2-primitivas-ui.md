# Refactor SAFE — Fase 2: Primitivas de UI Compartidas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create two portal-scoped presentational primitives, `Card` and `Badge`, and adopt them at all 77 card-pattern and 14 badge-pattern call sites across 38 files in 11 portal modules, eliminating the duplication with zero visual change. Remove the unused shadcn-style `src/components/ui/card.tsx`.

**Architecture:** Two new leaf components in `src/portal/components/` (following the existing `AlertBox`/`KpiCard`/`SeverityIcon` precedent), each a thin wrapper over the exact Tailwind classes already used at every call site, merged via the existing `cn()` helper. Adoption is organized as one task per portal module (or small file group) so every task stays reviewable and independently buildable. Every task is presentation-only — no data, no business logic, no visual change.

**Tech Stack:** React 18.3, TypeScript 5.6 (strict), Tailwind CSS v4, `cn()` (`clsx` + `tailwind-merge`) from `src/lib/utils.ts`.

## Global Constraints

- **No visual change anywhere.** Every replacement must render the exact same classes as before — only how they're expressed (raw `className` string vs. component props) changes. No data values or business logic change.
- **No UI test runner exists in this repo.** Verification for every task is: edit → `npm run build` (tsc -b && vite build) → manual check in the dev server → commit.
- **`Card` transformation rule** (applies to all adoption tasks — read this once, apply everywhere):
  1. Add the import `import { Card } from '@/portal/components/Card'` to the file (alongside existing imports, alphabetically placed among other `@/portal/...` imports if the file already groups them that way — otherwise add it near the top with the other local imports).
  2. Every site matches one of these three base shapes before any extra classes/props:
     - `<div className="rounded-xl border border-line bg-card p-4">` → `<Card>` (no `as`, no `padding` — both defaults)
     - `<section className="rounded-xl border border-line bg-card p-4.5">` → `<Card as="section" padding="lg">`
     - `<section className="rounded-xl border border-line bg-card p-4">` → `<Card as="section">`
     - `<article className="rounded-xl border border-line bg-card p-4">` → `<Card as="article">`
     - (swap `padding="lg"` in for any of the above when the original padding utility is `p-4.5` instead of `p-4`)
  3. Any classes in the original `className` beyond `rounded-xl border border-line bg-card` and the padding utility (`p-4` or `p-4.5`) are extra layout classes (e.g. `flex flex-col gap-2`, `min-h-[130px]`, `sm:p-5`, `xl:col-span-7`, `lg:col-span-7`) — keep every one of them, in the same order, in a `className` prop on the new `<Card>` tag.
  4. Any other JSX attribute on the original tag (`key={...}`, `aria-labelledby="..."`, `aria-hidden`, etc.) carries over unchanged onto `<Card>`.
  5. Find the tag's matching closing tag (`</div>`, `</section>`, or `</article>` — whichever the original element was) and change it to `</Card>`. Do not touch anything between the opening and closing tags.
  6. If a file has multiple identical-looking card opening lines (e.g. several bare `<section className="rounded-xl border border-line bg-card p-4.5">` lines with no distinguishing prop), use enough surrounding context (the next line or two of unique content) to make each edit unambiguous — do not use a blind find-and-replace-all across a file that would touch the wrong site.
- **`Badge` transformation rule** (applies to all adoption tasks):
  1. Add the import `import { Badge } from '@/portal/components/Badge'`.
  2. Every site is a `<span className={\`{base classes} ${toneExpr}\`}>{children}</span>` where `{base classes}` is some combination of `inline-block` (optional), `rounded-full px-2.5 py-0.5`, a text-size utility (`text-[11px]`, `text-[11.5px]`, or `text-[12px]`), and a font-weight/style suffix (`font-semibold` in all but one site; `font-bold uppercase tracking-wide` at `PlanScreen.tsx:73`), and `toneExpr` is a JS expression (an object lookup or a ternary) that resolves to color classes.
  3. Replace with `<Badge size="{size}" className={toneExpr}>{children}</Badge>`, where `size` maps from the original text-size utility: `text-[11px]` → `"xs"`, `text-[11.5px]` → omit the `size` prop entirely (it's the default), `text-[12px]` → `"md"`.
  4. If the site's font-weight/style suffix is anything other than plain `font-semibold` (only `PlanScreen.tsx:73`, which has `font-bold uppercase tracking-wide`), prepend those classes to the `className` expression so they still win over `Badge`'s default `font-semibold` via `cn()`'s tailwind-merge (later class wins on conflicting utilities): `className={\`font-bold uppercase tracking-wide ${toneExpr}\`}`.
  5. Keep the children between the tags exactly as they were.
- **Do not touch** `admin/catalogo.ts`, `colaborador/semilla.ts`, `admin/data/semilla.json`, `src/portal/tone.ts`, or any of the domain→color lookup maps (`TONE_BADGE_CLASSES`, `SEMAFORO_BADGE`, `ESTADO_BADGE`, `ESTADO_OBLIGACION_BADGE`, `ESTADO_TONO`) — they stay exactly as they are, only referenced differently.
- **Do not touch** the 6 large files reserved for Fase 3 (`marketplace/catalogo.ts`, `marketplace/ReservaModal.tsx`, `PortalDataContext.tsx`, `App.tsx`, `data/semilla-portal.ts`) beyond what this plan explicitly lists. `colaborador/perfil/EditarPerfilScreen.tsx` **is** touched here (Task 13) — presentation-only, no structural change.

---

## Task 1: Create the `Card` primitive

**Files:**
- Create: `src/portal/components/Card.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils` (already exists).
- Produces: `Card({ as, padding, className, children, ...props }: CardProps)` — a React component. `CardProps = { as?: 'div' | 'section' | 'article'; padding?: 'default' | 'lg'; className?: string; children: ReactNode } & React.HTMLAttributes<HTMLElement>`. All 12 adoption tasks (Tasks 4–15) import this by name from `@/portal/components/Card`.

- [ ] **Step 1: Create the component**

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type CardProps = {
  as?: 'div' | 'section' | 'article'
  padding?: 'default' | 'lg'
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLElement>

export function Card({ as: Tag = 'div', padding = 'default', className, children, ...props }: CardProps) {
  return (
    <Tag
      className={cn('rounded-xl border border-line bg-card', padding === 'lg' ? 'p-4.5' : 'p-4', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (this file has no consumers yet, so it can only fail on a syntax/type error in the file itself).

- [ ] **Step 3: Commit**

```bash
git add src/portal/components/Card.tsx
git commit -m "feat(ui): add shared Card primitive"
```

---

## Task 2: Create the `Badge` primitive

**Files:**
- Create: `src/portal/components/Badge.tsx`

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces: `Badge({ size, className, children }: { size?: 'xs' | 'sm' | 'md'; className?: string; children: ReactNode })`. All adoption tasks that touch a badge site (Tasks 7, 9, 10, 11, 12, 14, 15) import this by name from `@/portal/components/Badge`.

- [ ] **Step 1: Create the component**

```tsx
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeSize = 'xs' | 'sm' | 'md'

const BADGE_SIZE_CLASS: Record<BadgeSize, string> = {
  xs: 'text-[11px]',
  sm: 'text-[11.5px]',
  md: 'text-[12px]',
}

export function Badge({
  size = 'sm',
  className,
  children,
}: {
  size?: BadgeSize
  className?: string
  children: ReactNode
}) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 font-semibold', BADGE_SIZE_CLASS[size], className)}>
      {children}
    </span>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/portal/components/Badge.tsx
git commit -m "feat(ui): add shared Badge primitive"
```

---

## Task 3: Remove the unused `src/components/ui/card.tsx`

**Files:**
- Delete: `src/components/ui/card.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing — confirms the file is dead code before removing it.

- [ ] **Step 1: Confirm nothing imports it**

Run: `grep -rn "components/ui/card" src`
Expected: no output. If this returns any hits, STOP and report back — the file is not actually unused and this task's premise is wrong; do not delete it.

- [ ] **Step 2: Delete the file**

```bash
git rm src/components/ui/card.tsx
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: succeeds with no errors (proves nothing referenced `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, or `CardFooter` from that file).

- [ ] **Step 4: Commit**

```bash
git commit -m "chore(ui): remove unused shadcn-style Card (superseded by portal/components/Card)"
```

---

## Task 4: Adopt Card in `simulador` (8 sites, 3 files)

**Files:**
- Modify: `src/portal/simulador/SimulacionChart.tsx:22,43`
- Modify: `src/portal/simulador/DetalleSimulacionScreen.tsx:54,67`
- Modify: `src/portal/simulador/SimuladorScreen.tsx:230,353,373,384`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card` (Task 1).

**Current state (confirmed by grep at plan-writing time — reconfirm with the same grep before editing, since line numbers may have drifted):**

```
src/portal/simulador/SimulacionChart.tsx:22:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/SimulacionChart.tsx:43:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/DetalleSimulacionScreen.tsx:54:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/DetalleSimulacionScreen.tsx:67:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/SimuladorScreen.tsx:230:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/SimuladorScreen.tsx:353:              <div key={c.titulo} className="flex min-h-[130px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
src/portal/simulador/SimuladorScreen.tsx:373:            <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/simulador/SimuladorScreen.tsx:384:              <section className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add the `Card` import to all 3 files**

```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — bare `<section>` at `p-4.5` (7 of the 8 sites: all except `SimuladorScreen.tsx:353`)**

Every one of these 7 sites has no extra classes and no other props — apply this exact transformation to each, using the Global Constraints rule 6 to disambiguate same-file duplicates by surrounding content (e.g. `SimulacionChart.tsx` has this line twice, at 22 and 43 — use the next 1-2 lines of each to target the right one):

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
And change that block's matching `</section>` to `</Card>`.

- [ ] **Step 3: Worked example — `<div>` with extra classes and a `key` (`SimuladorScreen.tsx:353`)**

Before:
```tsx
<div key={c.titulo} className="flex min-h-[130px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card key={c.titulo} className="flex min-h-[130px] flex-col gap-2">
```
And change that block's matching `</div>` to `</Card>`.

- [ ] **Step 4: Apply Steps 2–3 to all 8 listed sites**

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: succeeds with no errors.

- [ ] **Step 6: Manual check**

Run `npm run dev`, log in, open `/app/simulador` and run a simulation to reach the detail screen. Confirm every card-bordered box still looks identical (same padding, same border, same rounded corners) to before.

- [ ] **Step 7: Commit**

```bash
git add src/portal/simulador/SimulacionChart.tsx src/portal/simulador/DetalleSimulacionScreen.tsx src/portal/simulador/SimuladorScreen.tsx
git commit -m "refactor(simulador): adopt shared Card primitive"
```

---

## Task 5: Adopt Card in `empresa` (3 sites, 1 file)

**Files:**
- Modify: `src/portal/empresa/EmpresaScreen.tsx:99,106,113`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`.

**Current state:**

```
src/portal/empresa/EmpresaScreen.tsx:99:        <div className="rounded-xl border border-line bg-card p-4">
src/portal/empresa/EmpresaScreen.tsx:106:        <div className="rounded-xl border border-line bg-card p-4">
src/portal/empresa/EmpresaScreen.tsx:113:        <div className="rounded-xl border border-line bg-card p-4">
```

- [ ] **Step 1: Add the import**

```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — all 3 sites are identical bare `<div>` at `p-4`, no extra classes/props**

Before:
```tsx
<div className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card>
```
And change each matching `</div>` to `</Card>`. Since all 3 are textually identical, use the surrounding content (each one wraps a different KPI block) to target each edit individually — do not do a blind replace-all.

- [ ] **Step 3: Apply to all 3 sites**

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Manual check**

Open `/app/empresa`. Confirm the 3 info cards on the General tab look unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/portal/empresa/EmpresaScreen.tsx
git commit -m "refactor(empresa): adopt shared Card primitive"
```

---

## Task 6: Adopt Card in `marketplace` (7 sites, 4 files)

**Files:**
- Modify: `src/portal/marketplace/ResenasProfesionalPanel.tsx:33`
- Modify: `src/portal/marketplace/MarketplaceScreen.tsx:96`
- Modify: `src/portal/marketplace/PerfilProfesionalContenido.tsx:184,202,229,257`
- Modify: `src/portal/marketplace/ProfesionalCard.tsx:75`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`.

**Current state:**

```
src/portal/marketplace/ResenasProfesionalPanel.tsx:33:    <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="resenas-profesional-titulo">
src/portal/marketplace/MarketplaceScreen.tsx:96:      <section aria-labelledby="marketplace-filtros" className="rounded-xl border border-line bg-card p-4">
src/portal/marketplace/PerfilProfesionalContenido.tsx:184:      <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="informacion-publica-titulo">
src/portal/marketplace/PerfilProfesionalContenido.tsx:202:        <section className="flex flex-col rounded-xl border border-line bg-card p-4 sm:p-5 lg:col-span-7" aria-labelledby="servicios-publicos-titulo">
src/portal/marketplace/PerfilProfesionalContenido.tsx:229:          <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="horarios-publicos-titulo">
src/portal/marketplace/PerfilProfesionalContenido.tsx:257:          <section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="documentos-publicos-titulo">

src/portal/marketplace/ProfesionalCard.tsx (lines 73-76):
    <article
      aria-labelledby={tituloId}
      className="flex min-h-[330px] flex-col gap-2.5 rounded-xl border border-line bg-card p-4"
    >
```

- [ ] **Step 1: Add the import to all 4 files**

```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — `<section>` with `aria-labelledby` and `sm:p-5` extra (`ResenasProfesionalPanel.tsx:33`, `PerfilProfesionalContenido.tsx:184,229,257`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4 sm:p-5" aria-labelledby="resenas-profesional-titulo">
```
After:
```tsx
<Card as="section" className="sm:p-5" aria-labelledby="resenas-profesional-titulo">
```
(the base padding is `p-4`, the default, so `padding` is omitted; only the `sm:p-5` breakpoint override goes in `className`). Apply the same shape to `PerfilProfesionalContenido.tsx:184` (`aria-labelledby="informacion-publica-titulo"`), `:229` (`aria-labelledby="horarios-publicos-titulo"`), and `:257` (`aria-labelledby="documentos-publicos-titulo"`) — same transformation, different `aria-labelledby` value in each. Change each matching `</section>` to `</Card>`.

- [ ] **Step 3: Worked example — `<section>` with `aria-labelledby` before `className` and extra layout classes (`PerfilProfesionalContenido.tsx:202`)**

Before:
```tsx
<section className="flex flex-col rounded-xl border border-line bg-card p-4 sm:p-5 lg:col-span-7" aria-labelledby="servicios-publicos-titulo">
```
After:
```tsx
<Card as="section" className="flex flex-col sm:p-5 lg:col-span-7" aria-labelledby="servicios-publicos-titulo">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 4: Worked example — `<section>` with `aria-labelledby` before `className`, no extra padding variant (`MarketplaceScreen.tsx:96`)**

Before:
```tsx
<section aria-labelledby="marketplace-filtros" className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card as="section" aria-labelledby="marketplace-filtros">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 5: Worked example — `<article>` with multi-line attributes (`ProfesionalCard.tsx:73-76`)**

Before:
```tsx
    <article
      aria-labelledby={tituloId}
      className="flex min-h-[330px] flex-col gap-2.5 rounded-xl border border-line bg-card p-4"
    >
```
After:
```tsx
    <Card
      as="article"
      aria-labelledby={tituloId}
      className="flex min-h-[330px] flex-col gap-2.5"
    >
```
Change the matching `</article>` to `</Card>`.

- [ ] **Step 6: Apply Steps 2–5 to all 7 listed sites**

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Manual check**

Open `/app/marketplace`, the filter panel and a professional's public profile page. Confirm every bordered panel looks unchanged.

- [ ] **Step 9: Commit**

```bash
git add src/portal/marketplace/ResenasProfesionalPanel.tsx src/portal/marketplace/MarketplaceScreen.tsx src/portal/marketplace/PerfilProfesionalContenido.tsx src/portal/marketplace/ProfesionalCard.tsx
git commit -m "refactor(marketplace): adopt shared Card primitive"
```

---

## Task 7: Adopt Card and Badge in `indicadores` (10 card sites + 2 badge sites, 6 files)

**Files:**
- Modify: `src/portal/indicadores/CompararIndicadoresScreen.tsx:97,127,153`
- Modify: `src/portal/indicadores/IndicadoresScreen.tsx:164,200,221,240`
- Modify: `src/portal/indicadores/IndicadoresPrincipalesScreen.tsx:62,99`
- Modify: `src/portal/indicadores/TodosIndicadoresScreen.tsx:179`
- Modify: `src/portal/indicadores/LiquidezHistoricaChart.tsx:24`
- Modify: `src/portal/indicadores/RentabilidadHistoricaChart.tsx:23`

**Interfaces:**
- Consumes: `Card`, `Badge` from `@/portal/components/Card` and `@/portal/components/Badge`.

**Current state:**

```
src/portal/indicadores/CompararIndicadoresScreen.tsx:97:      <section className="rounded-xl border border-line bg-card p-4">
src/portal/indicadores/CompararIndicadoresScreen.tsx:127:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/CompararIndicadoresScreen.tsx:153:                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[f.semaforoB]}`}>{f.semaforoB}</span>
src/portal/indicadores/IndicadoresScreen.tsx:164:            <div key={i.codigo} className="flex min-h-[216px] flex-col gap-2 rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/IndicadoresScreen.tsx:200:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/IndicadoresScreen.tsx:221:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/IndicadoresScreen.tsx:240:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/IndicadoresPrincipalesScreen.tsx:62:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/IndicadoresPrincipalesScreen.tsx:99:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/TodosIndicadoresScreen.tsx:179:                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>{i.semaforo}</span>
src/portal/indicadores/LiquidezHistoricaChart.tsx:24:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/indicadores/RentabilidadHistoricaChart.tsx:23:    <section className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add imports**

In `CompararIndicadoresScreen.tsx` and `TodosIndicadoresScreen.tsx`:
```tsx
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'
```
In `IndicadoresScreen.tsx`, `IndicadoresPrincipalesScreen.tsx`, `LiquidezHistoricaChart.tsx`, `RentabilidadHistoricaChart.tsx` (Card only):
```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — bare `<section>` at `p-4.5` (8 sites: `CompararIndicadoresScreen.tsx:127`, `IndicadoresScreen.tsx:200,221,240`, `IndicadoresPrincipalesScreen.tsx:62,99`, `LiquidezHistoricaChart.tsx:24`, `RentabilidadHistoricaChart.tsx:23`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`. Use surrounding content to disambiguate the 3 occurrences within `IndicadoresScreen.tsx` and the 2 within `IndicadoresPrincipalesScreen.tsx`.

- [ ] **Step 3: Worked example — bare `<section>` at `p-4` (`CompararIndicadoresScreen.tsx:97`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card as="section">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 4: Worked example — `<div>` with extra classes and `key` at `p-4.5` (`IndicadoresScreen.tsx:164`)**

Before:
```tsx
<div key={i.codigo} className="flex min-h-[216px] flex-col gap-2 rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card key={i.codigo} padding="lg" className="flex min-h-[216px] flex-col gap-2">
```
Change the matching `</div>` to `</Card>`.

- [ ] **Step 5: Worked example — Badge with `SEMAFORO_BADGE` lookup, `text-[11px]` size (both badge sites — `CompararIndicadoresScreen.tsx:153` and `TodosIndicadoresScreen.tsx:179`)**

Before:
```tsx
<span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[f.semaforoB]}`}>{f.semaforoB}</span>
```
After:
```tsx
<Badge size="xs" className={SEMAFORO_BADGE[f.semaforoB]}>{f.semaforoB}</Badge>
```
Apply the same shape to `TodosIndicadoresScreen.tsx:179`, replacing `f.semaforoB` with `i.semaforo` (that file's actual variable name — keep whatever the original expression was, only the wrapper changes).

- [ ] **Step 6: Apply Steps 2–5 to all 12 listed sites (10 card + 2 badge)**

- [ ] **Step 7: Verify build**

Run: `npm run build`

- [ ] **Step 8: Manual check**

Open `/app/indicadores`, `/app/indicadores/todos`, `/app/indicadores/principales`, and `/app/indicadores/comparar` (reachable once 2+ comparable periods exist per prior plans). Confirm every card and every semáforo badge looks unchanged.

- [ ] **Step 9: Commit**

```bash
git add src/portal/indicadores/CompararIndicadoresScreen.tsx src/portal/indicadores/IndicadoresScreen.tsx src/portal/indicadores/IndicadoresPrincipalesScreen.tsx src/portal/indicadores/TodosIndicadoresScreen.tsx src/portal/indicadores/LiquidezHistoricaChart.tsx src/portal/indicadores/RentabilidadHistoricaChart.tsx
git commit -m "refactor(indicadores): adopt shared Card and Badge primitives"
```

---

## Task 8: Adopt Card in `configuracion` (5 sites, 1 file)

**Files:**
- Modify: `src/portal/configuracion/ConfiguracionScreen.tsx:76,101,172,238,268`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`.

**Current state:**

```
src/portal/configuracion/ConfiguracionScreen.tsx:76:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/configuracion/ConfiguracionScreen.tsx:101:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/configuracion/ConfiguracionScreen.tsx:172:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/configuracion/ConfiguracionScreen.tsx:238:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/configuracion/ConfiguracionScreen.tsx:268:      <section className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add the import**

```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: All 5 sites are identical bare `<section>` at `p-4.5` — apply this transformation to each, using surrounding content to disambiguate**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`.

- [ ] **Step 3: Verify build**

Run: `npm run build`

- [ ] **Step 4: Manual check**

Open `/app/configuracion` and its sub-tabs (Cuenta, Notificaciones, Seguridad, Suscripción, etc.). Confirm every section card looks unchanged.

- [ ] **Step 5: Commit**

```bash
git add src/portal/configuracion/ConfiguracionScreen.tsx
git commit -m "refactor(configuracion): adopt shared Card primitive"
```

---

## Task 9: Adopt Card and Badge in `dashboard` (1 card site + 2 badge sites, 3 files)

**Files:**
- Modify: `src/portal/dashboard/FinancialChart.tsx:32`
- Modify: `src/portal/dashboard/IndicatorsTable.tsx:47`
- Modify: `src/portal/dashboard/ObligationsTable.tsx:48`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card` (only `FinancialChart.tsx`), `Badge` from `@/portal/components/Badge` (`IndicatorsTable.tsx`, `ObligationsTable.tsx`).

**Current state:**

```
src/portal/dashboard/FinancialChart.tsx:32:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/dashboard/IndicatorsTable.tsx:47:                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ind.tono]}`}
src/portal/dashboard/ObligationsTable.tsx:48:                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[o.tono]}`}
```

- [ ] **Step 1: Add imports**

In `FinancialChart.tsx`:
```tsx
import { Card } from '@/portal/components/Card'
```
In `IndicatorsTable.tsx` and `ObligationsTable.tsx`:
```tsx
import { Badge } from '@/portal/components/Badge'
```

- [ ] **Step 2: Card — bare `<section>` at `p-4.5` (`FinancialChart.tsx:32`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 3: Worked example — Badge, `className` as a standalone multi-line prop on a bare `<span>` (confirmed: this `<span>` has no other purpose than rendering the badge), `TONE_BADGE_CLASSES` lookup, `text-[11.5px]` (default size) (`IndicatorsTable.tsx:46-50`)**

Before:
```tsx
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ind.tono]}`}
                >
                  {ind.estado}
                </span>
```
After:
```tsx
                <Badge className={TONE_BADGE_CLASSES[ind.tono]}>
                  {ind.estado}
                </Badge>
```
Apply the identical transformation to `ObligationsTable.tsx:47-51`, replacing `TONE_BADGE_CLASSES[ind.tono]` and `{ind.estado}` with that file's own variable names (`TONE_BADGE_CLASSES[o.tono]` and `{o.estado}`).

- [ ] **Step 4: Verify build**

Run: `npm run build`

- [ ] **Step 5: Manual check**

Open `/app/dashboard`. Confirm the financial chart card and the indicator/obligation status badges in the two summary tables look unchanged.

- [ ] **Step 6: Commit**

```bash
git add src/portal/dashboard/FinancialChart.tsx src/portal/dashboard/IndicatorsTable.tsx src/portal/dashboard/ObligationsTable.tsx
git commit -m "refactor(dashboard): adopt shared Card and Badge primitives"
```

---

## Task 10: Adopt Card and Badge in `financiero` (13 card sites + 2 badge sites, 4 files)

**Files:**
- Modify: `src/portal/financiero/FinancieroScreen.tsx:86,97,108,173,237`
- Modify: `src/portal/financiero/EvolucionFinancieraChart.tsx:27`
- Modify: `src/portal/financiero/CompararPeriodosScreen.tsx:112,154,173,200`
- Modify: `src/portal/financiero/DetalleRegistroScreen.tsx:93,106,127,139,163`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`, `Badge` from `@/portal/components/Badge`.

**Current state:**

```
src/portal/financiero/FinancieroScreen.tsx:86:        <div className="rounded-xl border border-line bg-card p-4">
src/portal/financiero/FinancieroScreen.tsx:97:        <div className="rounded-xl border border-line bg-card p-4">
src/portal/financiero/FinancieroScreen.tsx:108:        <div className="rounded-xl border border-line bg-card p-4">
src/portal/financiero/FinancieroScreen.tsx:173:                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_BADGE[r.estado]}`}>
src/portal/financiero/FinancieroScreen.tsx:237:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/EvolucionFinancieraChart.tsx:27:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/CompararPeriodosScreen.tsx:112:      <section className="rounded-xl border border-line bg-card p-4">
src/portal/financiero/CompararPeriodosScreen.tsx:154:            <div key={k.titulo} className="rounded-xl border border-line bg-card p-4">
src/portal/financiero/CompararPeriodosScreen.tsx:173:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/CompararPeriodosScreen.tsx:200:        <section key={seccion.titulo} className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/DetalleRegistroScreen.tsx:93:        <section key={grupo.titulo} className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/DetalleRegistroScreen.tsx:106:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/DetalleRegistroScreen.tsx:127:                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>
src/portal/financiero/DetalleRegistroScreen.tsx:139:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/financiero/DetalleRegistroScreen.tsx:163:        <section className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add imports to all 4 files**

```tsx
import { Card } from '@/portal/components/Card'
```
Add `import { Badge } from '@/portal/components/Badge'` as well in `FinancieroScreen.tsx` and `DetalleRegistroScreen.tsx`.

- [ ] **Step 2: Worked example — bare `<div>` at `p-4` (`FinancieroScreen.tsx:86,97,108`, identical, disambiguate by surrounding KPI content)**

Before:
```tsx
<div className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card>
```
Change each matching `</div>` to `</Card>`.

- [ ] **Step 3: Worked example — bare `<section>` at `p-4.5` (`FinancieroScreen.tsx:237`, `EvolucionFinancieraChart.tsx:27`, `CompararPeriodosScreen.tsx:173`, `DetalleRegistroScreen.tsx:106,139,163`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`.

- [ ] **Step 4: Worked example — bare `<section>` at `p-4` (`CompararPeriodosScreen.tsx:112`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card as="section">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 5: Worked example — `<div>` with `key`, no extra classes, `p-4` (`CompararPeriodosScreen.tsx:154`)**

Before:
```tsx
<div key={k.titulo} className="rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card key={k.titulo}>
```
Change the matching `</div>` to `</Card>`.

- [ ] **Step 6: Worked example — `<section>` with `key`, no extra classes, `p-4.5` (`CompararPeriodosScreen.tsx:200`, `DetalleRegistroScreen.tsx:93`)**

Before:
```tsx
<section key={seccion.titulo} className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" key={seccion.titulo} padding="lg">
```
Change the matching `</section>` to `</Card>`. Apply the same shape to `DetalleRegistroScreen.tsx:93` (`key={grupo.titulo}`).

- [ ] **Step 7: Worked example — Badge, `ESTADO_BADGE` lookup, `text-[11.5px]` (default size) (`FinancieroScreen.tsx:173`)**

Before:
```tsx
<span className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_BADGE[r.estado]}`}>
```
(closing `</span>` stays paired, children unchanged)
After:
```tsx
<Badge className={ESTADO_BADGE[r.estado]}>
```
(closing tag becomes `</Badge>`)

- [ ] **Step 8: Worked example — Badge, `SEMAFORO_BADGE` lookup, `text-[11px]` (`size="xs"`) (`DetalleRegistroScreen.tsx:127`)**

Before:
```tsx
<span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${SEMAFORO_BADGE[i.semaforo]}`}>
```
After:
```tsx
<Badge size="xs" className={SEMAFORO_BADGE[i.semaforo]}>
```
(closing tag becomes `</Badge>`)

- [ ] **Step 9: Apply Steps 2–8 to all 15 listed sites (13 card + 2 badge)**

- [ ] **Step 10: Verify build**

Run: `npm run build`

- [ ] **Step 11: Manual check**

Open `/app/financiero`, a period detail page, and `/app/financiero/comparar`. Confirm every card and every estado/semáforo badge looks unchanged.

- [ ] **Step 12: Commit**

```bash
git add src/portal/financiero/FinancieroScreen.tsx src/portal/financiero/EvolucionFinancieraChart.tsx src/portal/financiero/CompararPeriodosScreen.tsx src/portal/financiero/DetalleRegistroScreen.tsx
git commit -m "refactor(financiero): adopt shared Card and Badge primitives"
```

---

## Task 11: Adopt Card and Badge in `obligaciones` (7 card sites + 1 badge site, 2 files)

**Files:**
- Modify: `src/portal/obligaciones/ObligacionesScreen.tsx:133,142,268,286,312,330,351`
- Modify: `src/portal/obligaciones/DetalleObligacionScreen.tsx:151`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`, `Badge` from `@/portal/components/Badge`.

**Current state:**

```
src/portal/obligaciones/ObligacionesScreen.tsx:133:          <div key={k.titulo} className="flex min-h-[122px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
src/portal/obligaciones/ObligacionesScreen.tsx:142:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/obligaciones/ObligacionesScreen.tsx:268:                    <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_OBLIGACION_BADGE[i.estado]}`}>
src/portal/obligaciones/ObligacionesScreen.tsx:286:          <section className="flex flex-1 flex-col rounded-xl border border-line bg-card p-4.5">
src/portal/obligaciones/ObligacionesScreen.tsx:312:          <section className="flex flex-1 flex-col rounded-xl border border-line bg-card p-4.5">
src/portal/obligaciones/ObligacionesScreen.tsx:330:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/obligaciones/ObligacionesScreen.tsx:351:        <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/obligaciones/DetalleObligacionScreen.tsx:151:        <section key={g.titulo} className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add imports**

In `ObligacionesScreen.tsx`:
```tsx
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'
```
In `DetalleObligacionScreen.tsx`:
```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — `<div>` with `key` and extra classes, `p-4` (`ObligacionesScreen.tsx:133`)**

Before:
```tsx
<div key={k.titulo} className="flex min-h-[122px] flex-col gap-2 rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card key={k.titulo} className="flex min-h-[122px] flex-col gap-2">
```
Change the matching `</div>` to `</Card>`.

- [ ] **Step 3: Worked example — bare `<section>` at `p-4.5` (`ObligacionesScreen.tsx:142,330,351`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`.

- [ ] **Step 4: Worked example — `<section>` with extra classes, `p-4.5` (`ObligacionesScreen.tsx:286,312`, both identical)**

Before:
```tsx
<section className="flex flex-1 flex-col rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg" className="flex flex-1 flex-col">
```
Change each matching `</section>` to `</Card>` (use surrounding content to target each of the 2 occurrences individually).

- [ ] **Step 5: Worked example — `<section>` with `key`, `p-4.5` (`DetalleObligacionScreen.tsx:151`)**

Before:
```tsx
<section key={g.titulo} className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" key={g.titulo} padding="lg">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 6: Worked example — Badge, `ESTADO_OBLIGACION_BADGE` lookup, `text-[11.5px]` (default size), no `inline-block` in source (`ObligacionesScreen.tsx:268`)**

Before:
```tsx
<span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${ESTADO_OBLIGACION_BADGE[i.estado]}`}>
```
After:
```tsx
<Badge className={ESTADO_OBLIGACION_BADGE[i.estado]}>
```
(closing tag becomes `</Badge>`; `Badge` always renders `inline-block` regardless of whether the original site had it — see Global Constraints Badge rule)

- [ ] **Step 7: Apply Steps 2–6 to all 8 listed sites**

- [ ] **Step 8: Verify build**

Run: `npm run build`

- [ ] **Step 9: Manual check**

Open `/app/obligaciones` (calendar and list views) and an obligation detail page. Confirm every card and every estado badge looks unchanged.

- [ ] **Step 10: Commit**

```bash
git add src/portal/obligaciones/ObligacionesScreen.tsx src/portal/obligaciones/DetalleObligacionScreen.tsx
git commit -m "refactor(obligaciones): adopt shared Card and Badge primitives"
```

---

## Task 12: Adopt Card and Badge in `KpiCard.tsx` (1 card site + 1 badge site, 1 file)

**Files:**
- Modify: `src/portal/components/KpiCard.tsx:6,17`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`, `Badge` from `@/portal/components/Badge`.

**Current state (full file, 22 lines):**

```tsx
import type { Kpi } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-line bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 text-ink-500">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
          <kpi.icon className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="text-[12.5px] font-semibold leading-tight text-ink-700">{kpi.titulo}</span>
      </div>
      <span className="num mt-auto font-display text-2xl font-bold text-ink-900">{kpi.valor}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink-500">{kpi.sub}</span>
        {kpi.badge && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[kpi.badge.tono]}`}>
            {kpi.badge.texto}
          </span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 1: Rewrite the file**

```tsx
import type { Kpi } from '@/portal/types'
import { TONE_BADGE_CLASSES } from '@/portal/tone'
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="flex flex-col gap-2.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2.5 text-ink-500">
        <span className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
          <kpi.icon className="h-[17px] w-[17px]" strokeWidth={1.7} aria-hidden="true" />
        </span>
        <span className="text-[12.5px] font-semibold leading-tight text-ink-700">{kpi.titulo}</span>
      </div>
      <span className="num mt-auto font-display text-2xl font-bold text-ink-900">{kpi.valor}</span>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12.5px] text-ink-500">{kpi.sub}</span>
        {kpi.badge && <Badge className={TONE_BADGE_CLASSES[kpi.badge.tono]}>{kpi.badge.texto}</Badge>}
      </div>
    </Card>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`

- [ ] **Step 3: Manual check**

Open `/app/dashboard` (KpiCard renders the top KPI row). Confirm all 3-4 KPI cards, including any with a badge, look unchanged.

- [ ] **Step 4: Commit**

```bash
git add src/portal/components/KpiCard.tsx
git commit -m "refactor(components): adopt shared Card and Badge primitives in KpiCard"
```

---

## Task 13: Adopt Card in `colaborador/perfil` (10 sites, 5 files)

**Files:**
- Modify: `src/portal/colaborador/perfil/ServiciosEditor.tsx:67`
- Modify: `src/portal/colaborador/perfil/EditarPerfilScreen.tsx:430,476,507,596,775,801`
- Modify: `src/portal/colaborador/perfil/EspecialidadesEditor.tsx:55`
- Modify: `src/portal/colaborador/perfil/TodasLasResenasScreen.tsx:66`
- Modify: `src/portal/colaborador/perfil/DisponibilidadEditor.tsx:160`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`.

**Current state:**

```
src/portal/colaborador/perfil/ServiciosEditor.tsx:67:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EditarPerfilScreen.tsx (lines 427-431):
      <section
        aria-labelledby="disponibilidad-solicitudes-titulo"
        className="rounded-xl border border-line bg-card p-4 sm:p-5"
      >
src/portal/colaborador/perfil/EditarPerfilScreen.tsx:476:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EditarPerfilScreen.tsx:507:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EditarPerfilScreen.tsx:596:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EditarPerfilScreen.tsx:775:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EditarPerfilScreen.tsx:801:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/EspecialidadesEditor.tsx:55:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/TodasLasResenasScreen.tsx:66:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/perfil/DisponibilidadEditor.tsx:160:    <section className="rounded-xl border border-line bg-card p-4.5">
```

- [ ] **Step 1: Add the import to all 5 files**

```tsx
import { Card } from '@/portal/components/Card'
```

- [ ] **Step 2: Worked example — bare `<section>` at `p-4.5` (8 of the 10 sites: `ServiciosEditor.tsx:67`, `EditarPerfilScreen.tsx:476,507,596,775,801`, `EspecialidadesEditor.tsx:55`, `TodasLasResenasScreen.tsx:66`, `DisponibilidadEditor.tsx:160`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`. `EditarPerfilScreen.tsx` has 5 of these identical lines (476, 507, 596, 775, 801) — use surrounding content to target each individually.

- [ ] **Step 3: Worked example — multi-line `<section>` with `aria-labelledby` and `sm:p-5` extra (`EditarPerfilScreen.tsx:427-431`)**

Before:
```tsx
      <section
        aria-labelledby="disponibilidad-solicitudes-titulo"
        className="rounded-xl border border-line bg-card p-4 sm:p-5"
      >
```
After:
```tsx
      <Card
        as="section"
        aria-labelledby="disponibilidad-solicitudes-titulo"
        className="sm:p-5"
      >
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 4: Apply Steps 2–3 to all 10 listed sites**

- [ ] **Step 5: Verify build**

Run: `npm run build`

- [ ] **Step 6: Manual check**

Log in as a colaborador and open the "Editar perfil" screen (all its tabs/sections), plus the "Ver todas las reseñas" screen. Confirm every card looks unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/portal/colaborador/perfil/ServiciosEditor.tsx src/portal/colaborador/perfil/EditarPerfilScreen.tsx src/portal/colaborador/perfil/EspecialidadesEditor.tsx src/portal/colaborador/perfil/TodasLasResenasScreen.tsx src/portal/colaborador/perfil/DisponibilidadEditor.tsx
git commit -m "refactor(colaborador): adopt shared Card primitive in perfil screens"
```

---

## Task 14: Adopt Card and Badge in remaining `colaborador` files (7 card sites + 3 badge sites, 5 files)

**Files:**
- Modify: `src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx:82,107,178,229`
- Modify: `src/portal/colaborador/dashboard/RendimientoMensualPanel.tsx:11`
- Modify: `src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx:91,119,140`
- Modify: `src/portal/colaborador/solicitudes/DetalleSolicitudPanel.tsx:217`
- Modify: `src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx:191`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`, `Badge` from `@/portal/components/Badge`.

**Current state:**

```
src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx:82:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx:107:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx:178:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx:229:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/dashboard/RendimientoMensualPanel.tsx:11:    <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx:91:        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-7">
src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx (lines 115-121):
                    <td className="py-2.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          dia.bloques.length > 0 ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                        }`}
                      >
                        {dia.bloques.length > 0 ? 'Disponible' : 'No disponible'}
                      </span>
src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx:140:        <section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-5">
src/portal/colaborador/solicitudes/DetalleSolicitudPanel.tsx:217:                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx:191:                        className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
```

- [ ] **Step 1: Add imports**

In `CollaboratorSettingsScreen.tsx` and `RendimientoMensualPanel.tsx` (Card only):
```tsx
import { Card } from '@/portal/components/Card'
```
In `CollaboratorDashboardScreen.tsx` (both):
```tsx
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'
```
In `DetalleSolicitudPanel.tsx` and `HistorialSolicitudes.tsx` (Badge only):
```tsx
import { Badge } from '@/portal/components/Badge'
```

- [ ] **Step 2: Worked example — bare `<section>` at `p-4.5` (`CollaboratorSettingsScreen.tsx:82,107,178,229`, `RendimientoMensualPanel.tsx:11`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`. `CollaboratorSettingsScreen.tsx` has 4 identical occurrences — use surrounding content to target each individually.

- [ ] **Step 3: Worked example — `<section>` with extra breakpoint classes, `p-4.5` (`CollaboratorDashboardScreen.tsx:91,140`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5 xl:col-span-7">
```
After:
```tsx
<Card as="section" padding="lg" className="xl:col-span-7">
```
Change the matching `</section>` to `</Card>`. Apply the same shape to line 140, replacing `xl:col-span-7` with `xl:col-span-5`.

- [ ] **Step 4: Worked example — Badge with a ternary tone expression instead of a lookup, `text-[11.5px]` (default size) (`CollaboratorDashboardScreen.tsx:115-121`)**

Before:
```tsx
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          dia.bloques.length > 0 ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                        }`}
                      >
                        {dia.bloques.length > 0 ? 'Disponible' : 'No disponible'}
                      </span>
```
After:
```tsx
                      <Badge
                        className={dia.bloques.length > 0 ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'}
                      >
                        {dia.bloques.length > 0 ? 'Disponible' : 'No disponible'}
                      </Badge>
```

- [ ] **Step 5: Worked example — Badge, nested lookup `TONE_BADGE_CLASSES[ESTADO_TONO[...]]`, bare `<span>` with no other purpose, `text-[11.5px]` → default size (`DetalleSolicitudPanel.tsx:216-220`)**

Before:
```tsx
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
                      >
                        {ESTADO_LABEL[solicitud.estado]}
                      </span>
```
After:
```tsx
                      <Badge className={TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}>
                        {ESTADO_LABEL[solicitud.estado]}
                      </Badge>
```

- [ ] **Step 6: Worked example — same nested lookup, bare `<span>`, `text-[12px]` → `size="md"` (`HistorialSolicitudes.tsx:190-194`)**

Before:
```tsx
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}`}
                      >
                        {ESTADO_LABEL[solicitud.estado]}
                      </span>
```
After:
```tsx
                      <Badge size="md" className={TONE_BADGE_CLASSES[ESTADO_TONO[solicitud.estado]]}>
                        {ESTADO_LABEL[solicitud.estado]}
                      </Badge>
```

- [ ] **Step 7: Apply Steps 2–6 to all 10 listed sites (7 card + 3 badge)**

- [ ] **Step 8: Verify build**

Run: `npm run build`

- [ ] **Step 9: Manual check**

Log in as a colaborador and open Configuración, the Dashboard (availability table), and Solicitudes (a request's detail panel and the history list). Confirm every card and every estado badge looks unchanged.

- [ ] **Step 10: Commit**

```bash
git add src/portal/colaborador/configuracion/CollaboratorSettingsScreen.tsx src/portal/colaborador/dashboard/RendimientoMensualPanel.tsx src/portal/colaborador/dashboard/CollaboratorDashboardScreen.tsx src/portal/colaborador/solicitudes/DetalleSolicitudPanel.tsx src/portal/colaborador/solicitudes/HistorialSolicitudes.tsx
git commit -m "refactor(colaborador): adopt shared Card and Badge primitives in remaining screens"
```

---

## Task 15: Adopt Card and Badge in `plan` (5 card sites + 3 badge sites, 3 files)

**Files:**
- Modify: `src/portal/plan/HistorialPagosScreen.tsx:46,89`
- Modify: `src/portal/plan/PlanScreen.tsx:73,116,143,150,183`
- Modify: `src/portal/plan/MetodosPagoScreen.tsx:48`

**Interfaces:**
- Consumes: `Card` from `@/portal/components/Card`, `Badge` from `@/portal/components/Badge`.

**Current state:**

```
src/portal/plan/HistorialPagosScreen.tsx:46:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/plan/HistorialPagosScreen.tsx (lines 88-94):
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      pago.estado === 'PAGADO'
                        ? 'bg-emerald-soft text-emerald-deep'
                        : 'bg-danger-soft text-destructive'
                    }`}
                  >
src/portal/plan/PlanScreen.tsx (lines 71-77):
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                suscripcionCancelada ? 'bg-surface text-ink-500' : 'bg-emerald-soft text-emerald-deep'
              }`}
            >
src/portal/plan/PlanScreen.tsx:116:        <section className="relative flex-1 overflow-hidden rounded-xl border border-line bg-card p-4.5">
src/portal/plan/PlanScreen.tsx:143:      <section className="rounded-xl border border-line bg-card p-4.5">
src/portal/plan/PlanScreen.tsx (lines 149-154):
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  m.incluido ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                }`}
              >
src/portal/plan/PlanScreen.tsx (lines 181-185):
              <div
                key={s.titulo}
                className="flex min-h-[110px] flex-col justify-center gap-2 rounded-xl border border-line bg-card p-4"
              >
src/portal/plan/MetodosPagoScreen.tsx:48:          <div key={m.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
```

- [ ] **Step 1: Add imports to all 3 files**

```tsx
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'
```

- [ ] **Step 2: Worked example — bare `<section>` at `p-4.5` (`HistorialPagosScreen.tsx:46`, `PlanScreen.tsx:143`)**

Before:
```tsx
<section className="rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg">
```
Change each matching `</section>` to `</Card>`.

- [ ] **Step 3: Worked example — `<section>` with extra classes, `p-4.5` (`PlanScreen.tsx:116`)**

Before:
```tsx
<section className="relative flex-1 overflow-hidden rounded-xl border border-line bg-card p-4.5">
```
After:
```tsx
<Card as="section" padding="lg" className="relative flex-1 overflow-hidden">
```
Change the matching `</section>` to `</Card>`.

- [ ] **Step 4: Worked example — `<div>` with `key`, extra classes, `p-4`, multi-line attributes (`PlanScreen.tsx:181-185`)**

Before:
```tsx
              <div
                key={s.titulo}
                className="flex min-h-[110px] flex-col justify-center gap-2 rounded-xl border border-line bg-card p-4"
              >
```
After:
```tsx
              <Card
                key={s.titulo}
                className="flex min-h-[110px] flex-col justify-center gap-2"
              >
```
Change the matching `</div>` to `</Card>`.

- [ ] **Step 5: Worked example — `<div>` with `key`, extra classes, `p-4`, single line (`MetodosPagoScreen.tsx:48`)**

Before:
```tsx
<div key={m.id} className="flex flex-col gap-2 rounded-xl border border-line bg-card p-4">
```
After:
```tsx
<Card key={m.id} className="flex flex-col gap-2">
```
Change the matching `</div>` to `</Card>`.

- [ ] **Step 6: Worked example — Badge with ternary tone, `text-[11.5px]` (default size) (`HistorialPagosScreen.tsx:88-94`)**

Before:
```tsx
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${
                      pago.estado === 'PAGADO'
                        ? 'bg-emerald-soft text-emerald-deep'
                        : 'bg-danger-soft text-destructive'
                    }`}
                  >
```
After:
```tsx
                  <Badge
                    className={
                      pago.estado === 'PAGADO'
                        ? 'bg-emerald-soft text-emerald-deep'
                        : 'bg-danger-soft text-destructive'
                    }
                  >
```
Change the matching `</span>` to `</Badge>`.

- [ ] **Step 7: Worked example — Badge with the one style-override site (`font-bold uppercase tracking-wide` instead of `font-semibold`), ternary tone, `text-[11px]` → `size="xs"` (`PlanScreen.tsx:71-77`)**

Before:
```tsx
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${
                suscripcionCancelada ? 'bg-surface text-ink-500' : 'bg-emerald-soft text-emerald-deep'
              }`}
            >
```
After:
```tsx
            <Badge
              size="xs"
              className={`font-bold uppercase tracking-wide ${suscripcionCancelada ? 'bg-surface text-ink-500' : 'bg-emerald-soft text-emerald-deep'}`}
            >
```
Change the matching `</span>` to `</Badge>`. (Per the Global Constraints Badge rule, `font-bold` here overrides `Badge`'s default `font-semibold` via `cn()`'s tailwind-merge.)

- [ ] **Step 8: Worked example — Badge with ternary tone, `text-[11px]` → `size="xs"` (`PlanScreen.tsx:149-154`)**

Before:
```tsx
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  m.incluido ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                }`}
              >
```
After:
```tsx
              <Badge
                size="xs"
                className={m.incluido ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'}
              >
```
Change the matching `</span>` to `</Badge>`.

- [ ] **Step 9: Apply Steps 2–8 to all 8 listed sites (5 card + 3 badge)**

- [ ] **Step 10: Verify build**

Run: `npm run build`

- [ ] **Step 11: Manual check**

Open `/app/plan`, `/app/plan/historial-pagos`, and `/app/plan/metodos-pago`. Confirm every card and every badge (estado de pago, activa/cancelada, incluido/no incluido) looks unchanged.

- [ ] **Step 12: Commit**

```bash
git add src/portal/plan/HistorialPagosScreen.tsx src/portal/plan/PlanScreen.tsx src/portal/plan/MetodosPagoScreen.tsx
git commit -m "refactor(plan): adopt shared Card and Badge primitives"
```

---

## Final check (after all 15 tasks)

- [ ] **Confirm no raw pattern remains**

Run: `grep -rn "rounded-xl border border-line bg-card p-4" src/portal` and `grep -rn "rounded-full px-2.5 py-0.5" src/portal`
Expected: both return no output — every site was migrated to `Card`/`Badge`.

- [ ] **Confirm both primitives are actually used**

Run: `grep -rl "portal/components/Card'" src/portal | wc -l` and `grep -rl "portal/components/Badge'" src/portal | wc -l`
Expected: 32+ and 13+ respectively (one or more per file that had at least one site).
