# SAFE — Landing page

Landing comercial de **SAFE**, una plataforma que centraliza finanzas, obligaciones tributarias (SRI) y trámites legales para MIPYMES ecuatorianas. Este repo es la reconstrucción del landing (`SAFE_Renovado`) a partir del mockup de diseño original del proyecto y de varios prototipos de referencia, implementada como una SPA de una sola página con navegación por estado entre "Inicio" y "¿Cómo funciona?".

## Stack técnico

- **React 18** + **TypeScript**
- **Vite 5** como bundler y dev server
- **Tailwind CSS v4** (config "CSS-first" vía `@theme inline` en `src/index.css`, sin `tailwind.config.js`)
- Componentes de UI al estilo **shadcn/ui** (`Button`, `Card`) usando `class-variance-authority`, `@radix-ui/react-slot` y el helper `cn()` (`clsx` + `tailwind-merge`)
- **lucide-react** para iconografía
- Sin librería de routing: la navegación entre páginas se maneja con un `useState<Page>` simple en `App.tsx`

## Estructura del proyecto

```
src/
├── App.tsx                  # Layout raíz + switch de página (inicio / como)
├── main.tsx                 # Entry point de React
├── index.css                # Design tokens (colores oklch, tipografía, radios, sombras) y utilidades custom
├── lib/utils.ts              # Helper cn() para merge de clases Tailwind
├── hooks/
│   ├── useReveal.ts          # Reveal-on-scroll vía IntersectionObserver (dispara animaciones una sola vez)
│   └── useCountUp.ts         # Animación de conteo numérico (easing cúbico) para KPIs
└── components/
    ├── Navbar.tsx             # Barra de navegación (Inicio, ¿Cómo funciona?, Planes, Acerca de, Trabaja con SAFE)
    ├── Hero.tsx                # Hero de "Inicio": título, CTA y la card de preview del dashboard flotando encima de un fondo con degradados, blur y formas decorativas (shards SVG)
    ├── AmbientBackdrop.tsx     # Fondo decorativo reutilizable (blobs con blur + textura de puntos)
    ├── WindowFrame.tsx         # Contenedor tipo "ventana de macOS" (barra con 3 puntos) reutilizado en varios mockups de producto
    ├── DashboardPreviewCard.tsx # Card de preview del dashboard (capital, KPIs, gráfico de barras, obligaciones) con conteo animado
    ├── FeatureHighlightsSection.tsx # Dos cards: Marketplace de profesionales (con rating y "chat escribiendo") y Simulador (gráfico de líneas animado)
    ├── ModulesSection.tsx      # Grid "Todo lo que tu empresa necesita" (6 módulos)
    ├── PlansSection.tsx        # 3 planes de precio (Esencial / Crecimiento / Corporativo) con botones alineados
    ├── ReasonsSection.tsx      # "¿Por qué elegir SAFE?" (4 razones con iconos)
    ├── FinalCtaSection.tsx     # CTA final sobre fondo navy oscuro
    ├── ComoFuncionaSection.tsx # Página "¿Cómo funciona?": flujo de 4 pasos, cada uno con su propio mockup en WindowFrame
    ├── Footer.tsx               # Footer con columnas de enlaces y datos de la empresa
    └── ui/
        ├── button.tsx           # Button estilo shadcn (variantes: default, secondary, outline, ghost, link, destructive)
        └── card.tsx              # Card / CardHeader / CardContent / CardFooter estilo shadcn
```

## Sistema de diseño

Todo el theming vive en `src/index.css`, usando `@theme inline` de Tailwind v4 (no hay archivo de config JS separado):

- **Colores de marca** en `oklch`: `navy-900/700/600/500/100` (azul marino, columna vertebral de la UI), `emerald-brand/deep/soft` (positivo / cumplido), `amber-brand/deep/soft` (atención / pendiente), más `ink-900/700/500` para texto y `line`/`surface` para bordes y fondos neutros.
- **Tipografía**: `Inter` para texto general (`font-sans`), `Plus Jakarta Sans` para títulos (`font-display`), cargadas por `@import` de Google Fonts al inicio del CSS.
- **Utilidades custom**: `surface-card` (card blanca con borde + sombra estándar), `hero-gradient`, `num` (tabular numbers para cifras), `page-title` / `section-title`.
- **Animaciones**: keyframes `safe-fade-up` (entrada estándar de todas las secciones), `safe-drift-a/b` (blobs de fondo flotando) y las de los shards decorativos del Hero.

## Cómo prenderlo

Requisitos: **Node.js 18+** (probado con Node 24) y npm.

```bash
# 1. Instalar dependencias
npm install

# 2. Levantar el servidor de desarrollo (http://localhost:5173)
npm run dev

# 3. (opcional) Build de producción
npm run build

# 4. (opcional) Previsualizar el build de producción
npm run preview
```

No hay variables de entorno ni backend — todo el contenido (planes, módulos, KPIs de la preview, etc.) está hardcodeado directamente en los componentes como datos de ejemplo.

## Notas

- Las animaciones de scroll (`useReveal`) usan `IntersectionObserver` con `rootMargin` negativo para que no se disparen apenas la sección asoma en el viewport — solo cuando el usuario realmente se desplaza hacia ella.
- Los botones "Contratar", "Comparar planes", los enlaces del Footer, etc. son visuales por ahora (no hay routing real ni backend conectado) — es un landing de producto, no la app autenticada.

## Portal privado (`/app`)

A partir de agosto de 2026, el repo también incluye la Fase 1 del **portal privado** (la app
autenticada de SAFE, post-login), importado como prototipo de alta fidelidad desde Claude Design.
Ver el spec completo en `docs/superpowers/specs/2026-08-06-portal-privado-fase1-design.md`.

- **Routing real:** todo el sitio (público, auth y portal) usa `react-router-dom`. El portal vive bajo
  `/app/*` y está protegido por una sesión mock (`src/auth/AuthContext.tsx`, persistida en
  `localStorage`) — cualquier envío de los formularios de Login/Signup crea la sesión y navega a
  `/app/dashboard`; sin sesión, `/app/*` redirige a `/login`.
- **Estructura:** `src/portal/` contiene el shell (`PortalLayout`, `Sidebar`, `Topbar` y sus
  dropdowns) y `src/portal/dashboard/` la primera pantalla (KPIs, gráfico de resumen financiero,
  tablas de indicadores y obligaciones). Todo el contenido viene de
  `src/portal/data/mock-portal-data.ts` — datos de ejemplo, no hay backend conectado.
- **Pendiente:** las otras 25 pantallas del portal (Mi Empresa, Financiero, Indicadores completos,
  Obligaciones, Simulador, Marketplace, Plan, Configuración, tutoriales) se implementan en fases
  posteriores, cada una con su propio spec y plan.

**Fase 2 (Mi Empresa):** agrega `src/portal/PortalDataContext.tsx`, el primer estado compartido real
del portal — reemplaza el mock estático de empresa de la Fase 1 por un contexto que permite cambiar de
empresa activa, registrar una nueva (`/app/empresa/registrar`, wizard de 4 pasos) y editarla
(`/app/empresa/editar`), todo en `src/portal/empresa/`. Los datos de empresa, a diferencia de la sesión
de auth, no persisten en `localStorage` — viven en memoria de React mientras dura la sesión del
navegador.

**Fase 3 (Financiero):** agrega `src/portal/financiero/`, el módulo de estados financieros — listar
periodos, cargar uno nuevo (wizard de 10 pasos que espeja el balance/estado de resultados/flujo de
efectivo), ver el detalle de un registro y comparar dos periodos. Introduce el primer motor de cálculo
real del portal (`src/portal/financiero/calculo.ts`): magnitudes contables (activo total, patrimonio,
utilidad neta, etc.) y un catálogo de 23 indicadores financieros (liquidez, solvencia, gestión,
rentabilidad) con fórmulas reales de la Superintendencia de Compañías del Ecuador, calculados en vivo
sobre lo que el usuario carga — no son datos mock fijos como en las fases anteriores. `PortalDataContext`
se extiende con `registrosFinancieros`, indexado por empresa; solo Textiles Andina S.A. arranca con
historial sembrado (Comercial del Valle Cía. Ltda. usa el estado vacío del mockup).
