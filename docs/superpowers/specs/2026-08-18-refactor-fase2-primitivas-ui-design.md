# Refactor SAFE — Fase 2: Primitivas de UI compartidas (Design)

## Contexto

Continuación del refactor de todo el proyecto (ver `docs/superpowers/specs/2026-08-18-refactor-fase1-fundamentos-design.md` para el mapa completo de las 4 fases). Fase 1 (fundamentos y convenciones de datos) está completa. Esta fase ataca la duplicación de UI real encontrada por grep sobre `src/portal`:

- **Patrón "card"**: la cadena exacta `rounded-xl border border-line bg-card p-4` aparece 79 veces en 32 archivos, con variaciones reales alrededor: tag `<div>` o `<section>`, padding `p-4` o `p-4.5` (`.5` variant), y clases extra por sitio (`flex flex-col gap-2`, `min-h-[130px]`, `sm:p-5`, `aria-labelledby`, etc.).
- **Patrón "badge/pill"**: la cadena exacta `rounded-full px-2.5 py-0.5` aparece 14 veces en 13 archivos, con tamaño de texto variable (`text-[11px]`, `text-[11.5px]`, `text-[12px]`) y un color/tono resuelto por un mapa dominio→clases propio de cada módulo (`TONE_BADGE_CLASSES`, `SEMAFORO_BADGE`, `ESTADO_BADGE`, `ESTADO_OBLIGACION_BADGE`, `ESTADO_TONO`).
- El componente `Card` que ya existe en `src/components/ui/card.tsx` (estilo shadcn, con `CardHeader`/`CardContent`/`CardFooter` a `p-6`) no lo usa ningún archivo del repo (confirmado por `grep -rln "components/ui/card" src` → sin resultados) y no calza con el patrón real (`p-4`/`p-4.5`, sin subdivisión header/content/footer).
- `Button` (`src/components/ui/button.tsx`), en cambio, ya está ampliamente adoptado (36 archivos entre marketing y portal) — no es parte del alcance de esta fase.

38 archivos únicos en 11 módulos del portal quedan tocados por al menos uno de los dos patrones (algunos por ambos): colaborador, components, configuracion, dashboard, empresa, financiero, indicadores, marketplace, obligaciones, plan, simulador.

Alcance confirmado con el usuario: crear ambas primitivas **y** adoptarlas en absolutamente todos los sitios actuales (no una migración parcial/piloto), porque el objetivo explícito es eliminar la duplicación real ahora, no dejarla para que fase 3 la arrastre.

## Decisiones de diseño

### 1. Ubicación: `src/portal/components/`, no `src/components/ui/`

Seguimos el precedente ya establecido por `AlertBox.tsx`, `KpiCard.tsx`, `SeverityIcon.tsx`, `Pagination.tsx`: primitivas de presentación específicas del portal viven en `src/portal/components/`. `src/components/ui/` queda reservado para los primitivos genéricos estilo shadcn (`button`, `select`, `checkbox`, etc.) que ya sigue esa convención Radix-first documentada en `CLAUDE.md`. `Card` y `Badge` no son ese tipo de primitivo — son wrappers delgados sobre clases Tailwind ya usadas en el portal, así que van con sus hermanos `portal/components`.

### 2. `Card`

```tsx
type CardProps = {
  as?: 'div' | 'section'
  padding?: 'default' | 'lg'
  className?: string
  children: ReactNode
} & React.HTMLAttributes<HTMLElement>

function Card({ as: Tag = 'div', padding = 'default', className, children, ...props }: CardProps) {
  return (
    <Tag
      className={cn(
        'rounded-xl border border-line bg-card',
        padding === 'lg' ? 'p-4.5' : 'p-4',
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

- `padding='default'` (p-4) y `padding='lg'` (p-4.5) son los dos únicos valores reales encontrados — no se inventan variantes hipotéticas.
- `as='section'` cubre los sitios que hoy usan `<section>` (paneles con `aria-labelledby`, bloques de nivel superior); `as='div'` (default) cubre el resto.
- `className` se mezcla con `cn()` (ya existe en `src/lib/utils.ts`, usa `tailwind-merge`) para preservar exactamente las clases extra de cada sitio (ej. `sm:p-5`, `min-h-[130px]`, `flex flex-col gap-2`) sin perder nada del layout actual.
- El resto de props (`aria-labelledby`, `id`, `onClick`, etc.) se reenvían via spread — varios sitios reales los usan.

### 3. `Badge`

```tsx
type BadgeSize = 'xs' | 'sm' | 'md'

const BADGE_SIZE_CLASS: Record<BadgeSize, string> = {
  xs: 'text-[11px]',
  sm: 'text-[11.5px]',
  md: 'text-[12px]',
}

function Badge({ size = 'sm', className, children }: { size?: BadgeSize; className?: string; children: ReactNode }) {
  return (
    <span className={cn('inline-block rounded-full px-2.5 py-0.5 font-semibold', BADGE_SIZE_CLASS[size], className)}>
      {children}
    </span>
  )
}
```

- `size` cubre los tres tamaños de texto reales encontrados (`xs`=11px, `sm`=11.5px — el más común, 7/14 sitios — `md`=12px).
- **El color/tono NO lo decide `Badge`.** Cada módulo ya tiene su propio mapa dominio→clases Tailwind de color (`TONE_BADGE_CLASSES` en dashboard/colaborador, `SEMAFORO_BADGE` en indicadores/financiero, `ESTADO_BADGE` en financiero, `ESTADO_OBLIGACION_BADGE` en obligaciones). Esos mapas se quedan exactamente donde están (no son parte de esta fase) y se siguen pasando a `Badge` vía `className`, ej. `<Badge className={TONE_BADGE_CLASSES[ind.tono]}>{...}</Badge>`. Forzar un enum de tono único entre módulos que hoy no comparten semántica de dominio sería un cambio de alcance mucho mayor que "extraer el wrapper visual repetido", y no es lo que se pidió.
- Se estandariza `inline-block` en los 14 sitios (9/14 ya lo tenían; los otros 5 son `<span>` sin él, que en la práctica renderiza igual para este caso — es una normalización cosmética sin riesgo, no un cambio de comportamiento).
- El único sitio con estilo distinto (`PlanScreen.tsx:73`, `font-bold uppercase tracking-wide` en vez de `font-semibold` plano) sigue siendo representable pasando esas clases extra por `className` (con `cn()`, `font-bold` sobrescribe `font-semibold` correctamente vía tailwind-merge).

### 4. Adopción completa (38 archivos, 11 módulos)

Todos los 79 sitios del patrón card y los 14 sitios del patrón badge se migran a los componentes nuevos, reemplazando la cadena de clases Tailwind repetida por `<Card ...>`/`<Badge ...>` con las mismas clases exactas expresadas como props. Cero cambio visual esperado — verificable por `npm run build` (no hay test runner de UI) y revisión manual en el dev server.

La lista exacta de archivos/líneas se reconfirma con grep al momento de escribir el plan de implementación (el código puede haber cambiado desde que se escribió este spec) — igual que se hizo en fase 1.

### 5. Limpieza: eliminar `src/components/ui/card.tsx`

Confirmado sin ningún import en el repo. Con las nuevas primitivas cubriendo el mismo rol, mantenerlo vivo solo crea confusión sobre cuál "Card" usar. Se elimina en esta fase (parte de "organización de carpetas", una de las motivaciones originales del refactor). `CardHeader`/`CardTitle`/`CardDescription`/`CardContent`/`CardFooter` (los sub-componentes exportados junto a `Card` en ese archivo) se eliminan con él — ningún archivo los importa tampoco.

## Fuera de alcance

- `Button` (`src/components/ui/button.tsx`): ya ampliamente adoptado (36 archivos), no forma parte de esta fase.
- Los mapas dominio→color (`TONE_BADGE_CLASSES`, `SEMAFORO_BADGE`, etc.): se quedan donde están, tal cual.
- Los 6 archivos grandes de fase 3 (`marketplace/catalogo.ts`, `ReservaModal.tsx`, `PortalDataContext.tsx`, `App.tsx`, `mock-portal-data.ts`/`semilla-portal.ts`): no se dividen aquí. `EditarPerfilScreen.tsx` sí se toca (tiene 6 sitios del patrón card) pero solo para la migración presentacional de esta fase, sin tocar su tamaño ni estructura general.
- No se cambia ningún dato mock ni lógica de negocio — cambio puramente presentacional.

## Verificación

- `npm run build` (tsc -b && vite build) debe pasar sin errores tras cada tanda de reemplazos.
- `npm run test:admin` no debería verse afectado (ninguno de los archivos que toca vive en `scripts/admin-tests`). Nota: ya existe una falla preexistente no relacionada (`AccountMenu.tsx`, ver ledger de fase 1) — no confundir con una regresión de esta fase.
- Revisión manual en el dev server de al menos una pantalla por módulo tocado, para confirmar que no cambió nada visualmente.
