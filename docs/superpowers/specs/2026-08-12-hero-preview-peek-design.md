# Hero — Preview "asomando" abajo (rediseño de la animación de entrada)

Fecha: 2026-08-12

## Contexto

`src/components/Hero.tsx` anima el `DashboardPreviewCard` con scroll-driven animation: un track de `260vh` con un contenedor `sticky top-0 h-screen overflow-hidden`, donde `progress` (0→1, calculado por `useScrollProgress`) controla:

- `boxW`/`boxH`: tamaño de la caja que envuelve el preview, interpolado de 72×72px (progress=0) a `boxWMax`/`boxHMax` (tamaño "enfocado", ajustado al viewport).
- `boxTopPercent`: posición vertical de la caja, de 36% a 50% (siempre centrada vía `translate(-50%,-50%)`).
- `textOpacity`: el texto del hero se desvanece de 1 a 0 durante progress 0→0.35.
- `contentOpacity`: el contenido interno del preview aparece (fade-in) durante progress 0.5→0.85, porque a progress=0 la caja es un cuadrado de 72px sin espacio para mostrar contenido legible.

Hoy, en reposo (progress=0), el usuario ve el texto del hero centrado y un cuadrado casi invisible (72px, sin contenido) detrás. Se quiere cambiar ese estado de reposo para que el preview aparezca "asomando" desde abajo del viewport (recortado por el `overflow-hidden` del contenedor sticky), a su tamaño final, con el texto reposicionado arriba — imitando una referencia visual provista por el usuario (captura de una landing con el texto arriba y una card de dashboard parcialmente cortada por el borde inferior de la pantalla).

## Objetivo

Mantener el mismo mecanismo de scroll-driven animation (mismo track de 260vh, mismo hook, mismas curvas de opacidad de texto y de sombra) pero cambiar la geometría de reposo del preview: en vez de nacer como un cuadrado invisible detrás del texto, nace a tamaño final, anclado justo debajo del bloque de texto, con su parte inferior recortada por el borde del viewport. Al hacer scroll, el preview sube y se centra (mismo punto final que hoy), dando la sensación de "traerlo a foco".

## Alcance

- Modificar únicamente `src/components/Hero.tsx`.
- No se toca `useScrollProgress.ts`, `DashboardPreviewCard.tsx`, el fondo decorativo (shards/gradientes/ruido), ni ninguna otra página o componente.
- No se agregan dependencias nuevas.

## Diseño

### Texto

- Se reposiciona el bloque de texto (título, párrafo, botones) a una posición fija más alta en el hero — aproximadamente bajo el navbar, con espacio de respiro (target visual: similar a la referencia, el texto ocupa la franja superior del hero sin la caja detrás).
- Se agrega un `useRef` (`textRef`) sobre el contenedor del bloque de texto para medir su altura renderizada (`offsetHeight`) — necesario para calcular dónde debe empezar el preview en el estado de reposo.
- La curva de `textOpacity` (fade 0→0.35 de progress) se mantiene sin cambios.

### Preview

- El tamaño de la caja (`boxW`/`boxH`) deja de interpolar entre 72px y el tamaño final: se fija en `boxWMax`/`boxHMax` (el mismo tamaño "enfocado" de hoy) durante todo el rango de progress. El "zoom" ya no viene de un cambio de tamaño de la caja.
- Se agrega una escala sutil adicional sobre el contenido, interpolada de `0.94` (progress=0) a `1.0` (progress=1), aplicada vía `transform: scale(...)` combinado con el posicionamiento existente — para conservar una sensación de "acercamiento" aunque la caja ya no cambie de tamaño en píxeles.
- Posición vertical: se reemplaza `boxTopPercent` (36%→50%, siempre centrado) por un cálculo en píxeles:
  - `boxCenterY0` (progress=0): el techo de la caja se ancla justo debajo del texto (`textBottomY + gap`, con `gap` ≈ 32-40px), salvo que eso deje menos de `MIN_PEEK_PX` (100px) visibles antes del borde inferior del viewport — en ese caso se ajusta para garantizar esos 100px mínimos visibles (clamp).
  - `boxCenterY1` (progress=1): el centro vertical del viewport (`viewportH * 0.5`), igual al punto final de hoy.
  - `boxCenterY = lerp(boxCenterY0, boxCenterY1, progress)`, usado como `top: ${boxCenterY}px` combinado con `transform: translate(-50%, -50%) scale(...)`.
- `contentOpacity` deja de ser una curva 0.5→0.85: el contenido del `DashboardPreviewCard` es visible (opacity 1) en todo el rango de progress, porque desde progress=0 la caja ya tiene tamaño completo y el contenido es legible.
- `shadowAlpha` cambia de depender de `contentOpacity` a interpolar directamente con `progress` (ej. `lerp(0.10, 0.24, progress)`), para que la sombra se profundice gradualmente a medida que el preview "toma foco", en vez de aparecer recién a partir de progress=0.5.

### Responsive / franja mínima garantizada

- `MIN_PEEK_PX = 100` (aprox.): si el texto ocupa mucho alto vertical (pantallas bajas, o texto largo en mobile), el cálculo de `boxCenterY0` se clampa para que el borde superior de la caja nunca quede a menos de `MIN_PEEK_PX` del borde inferior del viewport — es decir, siempre se ve al menos una franja del preview al cargar la página, en cualquier resolución.
- El ancho de la caja sigue el mismo cálculo de `finalScale`/`availW` que ya existe (ajustado al viewport, cap de 1360px) — no cambia.

### Qué se mantiene igual

- El track de `260vh` y el contenedor `sticky top-0 h-screen overflow-hidden`.
- `useScrollProgress` sin cambios.
- El fondo decorativo (shards, gradientes, ruido, blobs animados).
- `DashboardPreviewCard` sin cambios internos.
- Botones, copy, y el resto de la página (`¿Cómo funciona?`, `Planes`, etc.) sin cambios.

## Fuera de alcance

- No se ajustan los breakpoints de `DashboardPreviewCard` en sí.
- No se cambia el largo del track de scroll (260vh) ni la velocidad de la animación.
- No se agrega ningún control de accesibilidad nuevo más allá de lo que ya existe (el componente no tenía manejo especial de `prefers-reduced-motion` antes de este cambio, y no se agrega en este alcance).

## Verificación

Sin test runner ni navegador disponible en este entorno de trabajo — verificación por:
- `npm run build` limpio.
- Trazado de código: confirmar que a progress=0 el cálculo de `boxCenterY0` efectivamente posiciona la caja con su techo bajo el texto (o clamped a `MIN_PEEK_PX`), y que a progress=1 coincide exactamente con el estado final de hoy (centrado, tamaño completo, sombra máxima).
- El usuario probará visualmente en su propio entorno (`npm run dev`) antes de cualquier push — no se hace push hasta su confirmación explícita.
