# Hero — Preview asomando abajo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rediseñar el estado de reposo de la animación scroll-driven del Hero para que el `DashboardPreviewCard` nazca a tamaño final, anclado justo debajo del bloque de texto y recortado por el borde inferior del viewport, en vez de nacer como un cuadrado invisible de 72px detrás del texto — manteniendo el mismo mecanismo de scroll (mismo track, mismo hook, mismas curvas de fade) y llegando al mismo estado final (centrado, tamaño completo) que existe hoy.

**Architecture:** Un solo archivo (`src/components/Hero.tsx`) cambia su lógica de geometría: el tamaño de la caja del preview deja de interpolar (queda fijo en el tamaño final) y en su lugar se interpola su posición vertical en píxeles, desde un punto anclado bajo el texto (con clamp para garantizar una franja mínima visible) hasta el centro del viewport. Se agrega una escala sutil (0.94→1.0) sobre la caja para conservar la sensación de "zoom a foco".

**Tech Stack:** React 18, TypeScript 5.6, Tailwind CSS 4, Vite 5. Sin dependencias nuevas.

## Global Constraints

- Fuente normativa: `docs/superpowers/specs/2026-08-12-hero-preview-peek-design.md`.
- Solo se modifica `src/components/Hero.tsx`. No se toca `useScrollProgress.ts`, `DashboardPreviewCard.tsx`, `Navbar.tsx`, ni ninguna otra página.
- Sin test runner en este repo (`package.json` solo tiene `dev`/`build`/`preview`) — verificación es `npm run build` limpio más trazado de código de los valores en progress=0 y progress=1, no hay navegador disponible en este entorno de ejecución. El usuario probará visualmente con `npm run dev` en su propio entorno antes de decidir si se hace push (no hacer push como parte de este plan).
- El navbar (`Navbar.tsx`) es `sticky top-0` con `z-50` y ocupa aproximadamente 80px de alto — el bloque de texto del Hero debe posicionarse debajo de esa franja, replicando el mismo compensador `80px` que ya usaba el código anterior (`calc(36% + 80px)`).

---

### Task 1: Reposicionar el preview y el texto del Hero

**Files:**
- Modify: `src/components/Hero.tsx:95-232` (todo el cuerpo de la función `Hero`)

**Interfaces:**
- No expone ni consume nada de otros módulos más allá de lo que `Hero.tsx` ya importaba (`useScrollProgress`, `DashboardPreviewCard`, `Button`). No hay tareas posteriores que dependan de esta.

- [ ] **Step 1: Leer el archivo actual completo antes de editar**

Confirmar que las líneas 95-237 de `src/components/Hero.tsx` coinciden con lo documentado en el spec (la función `Hero` completa, desde `export function Hero(...)` hasta su cierre). Si el archivo cambió desde que se escribió este plan, ajustar los números de línea de los siguientes steps en consecuencia — el contenido a reemplazar es el que se muestra a continuación, no los números de línea en sí.

- [ ] **Step 2: Reemplazar el cuerpo de la función `Hero`**

Reemplazar desde `export function Hero({ onVerPlanes }: { onVerPlanes?: () => void }) {` hasta el `return (` que le sigue (la sección de cálculos, antes del JSX) con:

```tsx
const NAVBAR_HEIGHT_PX = 80
const TEXT_TOP_GAP_PX = 56
const GAP_TEXT_TO_PREVIEW_PX = 32
const MIN_PEEK_PX = 100

export function Hero({ onVerPlanes }: { onVerPlanes?: () => void }) {
  const { ref: trackRef, progress } = useScrollProgress<HTMLDivElement>()
  const previewRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const [previewNaturalH, setPreviewNaturalH] = useState(720)
  const [textHeight, setTextHeight] = useState(300)

  useEffect(() => {
    if (previewRef.current) {
      setPreviewNaturalH(previewRef.current.offsetHeight)
    }
    if (textRef.current) {
      setTextHeight(textRef.current.offsetHeight)
    }
  }, [])

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768

  const availW = Math.min(viewportW - 64, 1360)
  const availH = viewportH * 0.82
  const finalScale = Math.min(availW / PREVIEW_NATURAL_W, availH / previewNaturalH)
  const boxW = PREVIEW_NATURAL_W * finalScale
  const boxH = previewNaturalH * finalScale

  const boxScale = lerp(0.94, 1, progress)
  const textOpacity = 1 - Math.min(Math.max(progress / 0.35, 0), 1)
  const shadowAlpha = lerp(0.1, 0.24, progress).toFixed(3)

  const textTopPx = NAVBAR_HEIGHT_PX + TEXT_TOP_GAP_PX
  const boxTopY0 = Math.min(
    textTopPx + textHeight + GAP_TEXT_TO_PREVIEW_PX,
    viewportH - MIN_PEEK_PX,
  )
  const boxCenterY0 = boxTopY0 + boxH / 2
  const boxCenterY1 = viewportH * 0.5
  const boxCenterY = lerp(boxCenterY0, boxCenterY1, progress)

  return (
```

Esto elimina las variables `boxW`/`boxH` interpoladas (72px→máximo), `contentOpacity`, `previewScale`, `previewScaledW`, `previewScaledH` y `boxTopPercent` que existían antes — ya no se usan porque la caja ahora tiene tamaño fijo (`boxW`/`boxH` = tamaño final siempre) y el contenido interno se escala siempre con `finalScale` directamente (ver Step 3).

- [ ] **Step 3: Reemplazar el JSX de la caja del preview**

Dentro del `return`, reemplazar el bloque que empieza en `<div ref={trackRef} className="relative" style={{ height: '260vh' }}>` hasta su `</div>` de cierre (el que contiene la caja del preview y el bloque de texto) con:

```tsx
      <div ref={trackRef} className="relative" style={{ height: '260vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="absolute left-1/2 overflow-hidden rounded-xl bg-surface"
            style={{
              top: `${boxCenterY}px`,
              width: `${boxW}px`,
              height: `${boxH}px`,
              transform: `translate(-50%, -50%) scale(${boxScale})`,
              boxShadow: `0 44px 90px -42px oklch(0.28 0.076 253.5 / ${shadowAlpha})`,
            }}
          >
            <div
              className="absolute left-0 top-0"
              style={{
                width: `${PREVIEW_NATURAL_W}px`,
                transform: `scale(${finalScale})`,
                transformOrigin: 'top left',
              }}
            >
              <div ref={previewRef} className="relative">
                <DashboardPreviewCard inView className="!border-transparent !shadow-none" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_10%_0%,var(--color-navy-100)_0%,rgba(255,255,255,0)_100%)] opacity-70 mix-blend-multiply" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(60%_100%_at_92%_0%,var(--color-amber-soft)_0%,rgba(255,255,255,0)_100%)] opacity-60 mix-blend-multiply" />
              </div>
            </div>
          </div>

          <div
            ref={textRef}
            className="absolute left-1/2 w-full max-w-5xl px-6 text-center"
            style={{ top: `${textTopPx}px`, transform: 'translateX(-50%)', opacity: textOpacity }}
          >
            <h1 className="animate-safe-fade-up text-3xl font-extrabold leading-[1.14] tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
              Gestiona las finanzas, impuestos y legal
              <br className="hidden sm:block" /> de tu MIPYMES en un solo lugar
            </h1>
            <p
              className="animate-safe-fade-up mx-auto mt-4 max-w-xl text-base leading-normal text-ink-700"
              style={{ animationDelay: '120ms' }}
            >
              SAFE reúne tu contabilidad, tus obligaciones con el SRI y tus trámites legales en una
              sola plataforma — pensada para MIPYMES ecuatorianas, no para corporaciones.
            </p>
            <div
              className="animate-safe-fade-up mt-6 flex flex-wrap items-center justify-center gap-3"
              style={{ animationDelay: '240ms' }}
            >
              <Button size="lg" className="hover:scale-[1.02]">
                Crear cuenta gratis
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-navy-500 text-navy-500 hover:scale-[1.02] hover:bg-navy-100 hover:text-navy-600"
                onClick={onVerPlanes}
              >
                Ver planes
              </Button>
            </div>
          </div>
        </div>
      </div>
```

Nota: el `<div className="absolute left-0 top-0" ...>` que envuelve el contenido interno del preview ya no necesita el centrado manual (`left`/`top` calculados a partir de `previewScaledW`/`previewScaledH`) que existía antes — al ser `boxW`/`boxH` siempre iguales al tamaño final, el contenido escalado con `finalScale` llena exactamente la caja, así que basta anclarlo en `(0,0)`.

`DashboardPreviewCard` pasa de `inView={progress > 0.9}` a `inView` (siempre `true`): antes el conteo animado de cifras y las barras del gráfico esperaban a que la caja casi terminara de crecer para dispararse (tenía sentido porque el contenido era ilegible hasta ese punto); ahora el contenido es legible desde `progress = 0` (la tarjeta ya está a tamaño completo, solo recortada), así que la animación de conteo debe dispararse apenas se monta el componente.

- [ ] **Step 4: `npm run build` limpio**

Ejecutar:
```bash
npm run build
```
Debe compilar sin errores de TypeScript ni de Vite (puede persistir el warning preexistente de tamaño de chunk, no relacionado con este cambio).

- [ ] **Step 5: Verificación por trazado de código (sin navegador disponible)**

Confirmar a mano, sustituyendo valores de ejemplo (viewport 1440×900, texto de altura aproximada 300px):

- En `progress = 0`: `boxScale = 0.94`, `shadowAlpha = "0.100"`, `textOpacity = 1`, `boxTopY0 = min(80+56+300+32, 900-100) = min(468, 800) = 468`, `boxCenterY0 = 468 + boxH/2` (con `boxH` dependiente del `finalScale` calculado) — confirmar que esto coloca el techo de la caja (`boxCenterY0 - boxH/2 = 468`) claramente por debajo del bloque de texto (que termina en `80+56+300 = 436`, con el gap de 32px hasta 468) y que el borde inferior de la caja queda fuera del viewport (recortado por `overflow-hidden` del contenedor `sticky top-0 h-screen`), dejando como mínimo `MIN_PEEK_PX = 100` px visibles si el texto fuera más alto de lo esperado.
- En `progress = 1`: `boxScale = 1`, `shadowAlpha = "0.240"`, `textOpacity = 0`, `boxCenterY = boxCenterY1 = viewportH * 0.5 = 450` — este es exactamente el mismo estado final (centrado, tamaño completo, sombra máxima) que producía el código anterior en `progress = 1` (`boxTopPercent = 50`, `boxW/boxH` en su máximo, `contentOpacity = 1` → `shadowAlpha = 0.24`).
- Confirmar que ningún cálculo puede producir `NaN`: `previewNaturalH` y `textHeight` tienen valores por defecto (720 y 300) antes de que el `useEffect` de medición corra, así que el primer render siempre tiene números válidos.

- [ ] **Step 6: Commit**

```bash
git add src/components/Hero.tsx
git commit -m "feat: rediseñar animación de entrada del Hero (preview asomando abajo del texto)"
```

No hacer push — el usuario revisará visualmente con `npm run dev` antes de decidir.

---

### Task 2: Verificación final

**Files:** ninguno (solo verificación).

- [ ] **Step 1:** `npm run build` limpio (repetido como cierre, debe seguir pasando tras el commit).
- [ ] **Step 2:** Reportar al usuario que el cambio está listo para probar con `npm run dev`, y recordar que no se hace push hasta su confirmación explícita.
