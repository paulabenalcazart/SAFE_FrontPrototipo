# Portal Privado — Fase 9: Configuración + tutoriales

Fecha: 2026-08-10

## Contexto

Las Fases 1–8 del portal privado ya están implementadas en la rama `dylan_cd`. Esta es la **última fase**
del roadmap: construye **Configuración** (cuenta, seguridad, notificaciones, preferencias, resumen de
suscripción, privacidad y legal, opciones avanzadas) y **Video tutoriales** (catálogo filtrable de videos
con reproductor mock).

SAFE sigue siendo un **prototipo de alta fidelidad, solo frontend**: no hay API, backend ni envío real de
correos; todo el estado mutable vive en memoria de React (o `localStorage` para lo explícitamente
marcado como tal) y se pierde al recargar salvo lo persistido.

Roadmap: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · 4. Indicadores ✅ ·
5. Obligaciones tributarias ✅ · 6. Simulador ✅ · 7. Marketplace ✅ · 8. Plan y suscripción ✅ ·
**9. Configuración + tutoriales (esta fase, última)**.

### Fuente de diseño

- Mockup local `SAFE Portal Privado.dc.html`, pantallas "Configuración" (líneas 2398–2550), "Editar
  cuenta" (2552–2576) y "Video tutoriales" (2578–2618); lógica de datos (`cfgVals()`, líneas ~4793–4897)
  y los modales "Eliminar cuenta" (dentro de `confirmCfg()`, líneas ~5087–5094) y "Video" (2946–2961).
  El menú de cuenta del header (`cuentaMenu`, líneas 3441–3446) también es parte de esta fase: enlaza
  "Mi cuenta", "Mi plan" y "Video tutoriales".
- Dump local `SAFE_dump.sql`, tablas `usuario`, `preferencia_usuario`, `documento_legal`,
  `aceptacion_legal`, `video_tutorial`.
- Código ya existente que esta fase completa: `src/portal/components/AccountMenu.tsx` tiene un botón
  "Configuración de cuenta" con el comentario literal `// navega a /app/configuracion en la Fase 9`;
  `src/portal/data/mock-portal-data.ts` ya define el nav item `{ key: 'configuracion', path:
  '/app/configuracion' }`; `src/index.css` ya trae variables `.dark` preparadas ("no prioritario en esta
  fase", comentario de una fase anterior).

La lectura completa del HTML y del dump reveló varios hallazgos que fijan el alcance real de esta fase:

1. **"Mi cuenta" y "Editar cuenta" son la misma pantalla en el mockup.** `isCfgCuenta` es verdadero tanto
   para `sub === 'cuenta'` (entrada desde el menú de cuenta) como para `sub === 'cuenta-editar'` (entrada
   desde el botón "Editar cuenta" de Configuración), y ambas renderizan exactamente el mismo formulario
   "Editar cuenta". No hay una pantalla de "Mi cuenta" de solo lectura separada del formulario de edición
   más allá de la sección "Cuenta" ya visible en Configuración. Por eso esta fase implementa **una sola
   ruta** `/app/configuracion/cuenta`, alcanzable desde ambos puntos de entrada.
2. **Los toggles de Notificaciones, Tema y Modo guiado son preferencias inertes en el propio mockup.**
   `cfgVals()` actualiza el estado (`prefs`) al togglear, pero ningún otro `get` del componente lee esos
   valores para cambiar de comportamiento — ni la lista de notificaciones, ni el tema visual (`sbBg` usa
   `navStyle`, no `theme`), ni ninguna pantalla usa `modo_guiado` para mostrar ayudas. Son controles
   "de settings" que persisten su propio valor y ya está: no hay un sistema de tours contextuales ni un
   re-skin de tema en ninguna parte del prototipo. Esta fase replica ese mismo alcance: los toggles
   funcionan y persisten, pero no gatillan lógica cruzada en otras pantallas ya construidas.
3. **`.dark` en `src/index.css` originalmente no cubría los tokens que usa el portal — corregido durante
   esta fase, a partir de un reporte de la usuaria de que el selector de Tema no hacía nada.** Los
   componentes del portal usan casi exclusivamente
   `text-ink-900`, `bg-navy-*`, `border-line`, `bg-surface` (mapeados a
   `--gray-900`/`--safe-primary-*`/`--gray-300`/`--gray-100`), y el bloque `.dark` original no redefinía
   ninguna de esas variables — solo los tokens base de shadcn (`--background`, `--card`, etc.). Como la
   escala neutra (`--gray-900/700/500/300/100`) es la única que el portal invierte con el tema — la marca
   (`--safe-primary-*`, sidebar y botones navy) se mantiene igual en ambos temas a propósito — extender
   `.dark` con esos 5 tokens re-pinta todo el portal sin tocar los ~40 archivos de pantallas. También se
   corrigieron `input.tsx`/`textarea.tsx`/`select.tsx`/`checkbox.tsx`, que traían `bg-white` fijo en vez del
   token `bg-card`. Ver decisión "Tema" más abajo.
4. **No existe una página real de "Descargo de responsabilidad".** El footer del portal ya enlaza
   `/terminos` y `/privacidad` (páginas completas, reutilizadas del sitio público). No hay equivalente
   para el descargo. La sección "Privacidad y legal" enlaza a esas dos páginas reales en vez de duplicar
   texto placeholder, y mantiene el placeholder solo para "Descargo de responsabilidad" (no hay contenido
   real de donde tomarlo).
5. **La lista de notificaciones del header (`Topbar.tsx` + `mock-portal-data.ts`) es estática desde la
   Fase 1** y no tiene navegación por clic ni categorías. Cablear las 5 categorías de
   `cfgNotisGlobales`/`cfgNotisFilas` a un filtrado real de ese panel sería una extensión no pedida por el
   mockup (que tampoco lo hace) y tocaría código de shell fuera de esta fase. Queda fuera de alcance,
   igual que el criterio de autocontención de la Fase 8.

Todos estos hallazgos definen una fase **autocontenida**: no modifica el comportamiento de Fases 1–8 ya
revisadas, solo construye las dos pantallas nuevas y completa los dos puntos de integración que otras
fases dejaron explícitamente pendientes (el botón de `AccountMenu` y el nav item de `configuracion`).

## Enfoques considerados

1. **Identidad en `AuthContext`, preferencias de cuenta en `PortalDataContext` (elegido)**: `nombres`,
   `apellidos`, `correo` y `mfaHabilitado` viven en `AuthUser` (mapean 1:1 a columnas de `usuario`);
   `preferencias` (notificaciones, resumen, modo guiado) vive en `PortalDataContext` junto a los demás
   campos de cuenta que ya conviven ahí desde la Fase 8 (`planActivoCodigo`, `metodosPago`, etc.).
2. **Todo en un `SettingsContext` nuevo**: agrupa mejor semánticamente pero introduce un tercer provider
   solo para ~10 campos, cuando ya hay precedente (Fase 8) de sumar campos de cuenta a
   `PortalDataContext` sin fricción.
3. **Todo en `AuthContext`**: técnicamente posible, pero mezclaría "quién eres" (identidad, sesión) con
   "cómo quieres que se comporte la app" (preferencias de notificación/resumen), que es justo la
   separación que ya existe en el dump (`usuario` vs. `preferencia_usuario`, tablas distintas).

Se elige el (1): seguir la separación del propio dump (identidad vs. preferencias) y el patrón ya
establecido en la Fase 8 de sumar campos de cuenta al contexto existente en vez de crear providers nuevos
por fase.

## Decisiones de arquitectura

### Identidad de usuario: extender `AuthUser`, no crear un modelo paralelo

`AuthUser` hoy es `{ nombre, correo, iniciales }`. La pantalla "Editar cuenta" del mockup edita
`nombres`/`apellidos`/`correo` por separado. Se extiende `AuthUser` a
`{ nombres, apellidos, correo, iniciales, mfaHabilitado }` y se deriva `nombre` (`` `${nombres}
${apellidos}` ``) en los tres puntos que hoy lo consumen (`Topbar.tsx`, `DashboardScreen.tsx`,
`AccountMenu.tsx`) — ningún componente pierde funcionalidad, solo cambia de dónde arman el string. Los dos
`login(...)` de `App.tsx` (login y registro demo) pasan a construir `{ nombres: 'María Fernanda',
apellidos: 'Torres', ... }` en vez del string plano. `AuthContext` suma `updateUser(patch)` (recalcula
`iniciales` si cambian nombres/apellidos) y `toggleMfa()`; ambos persisten vía el `useEffect` de
`localStorage` que ya existe.

### Contraseña: se valida y se "confirma", nunca se guarda

Igual que el mockup, el formulario de cambio de contraseña vive como estado local del componente (no en
ningún contexto): pedir actual/nueva/confirmar, validar longitud ≥ 8 y coincidencia, mostrar/ocultar en
texto plano, y al confirmar limpiar los campos y mostrar el mensaje "Contraseña actualizada. La
contraseña nunca se guarda en texto plano." No hay `password_hash` mock que actualizar — no existe una
contraseña real en ningún lado del prototipo (el login demo no la valida), así que no hay nada que
persistir.

### Preferencias de cuenta: nuevo bloque en `PortalDataContext`, sin efectos cruzados

`preferencias: PreferenciaUsuario` (booleans de notificación ×5, `frecuenciaResumen`, `modoGuiado`) se
agrega como campo plano de cuenta, con `actualizarPreferencia(clave, valor)`. Semilla en
`mock-portal-data.ts` (`preferenciaUsuarioSemilla`) con los mismos defaults `TRUE`/`'SEMANAL'` que el
`DEFAULT` de la tabla `preferencia_usuario`. Ningún otro componente (Topbar, notificaciones) lee este
estado — ver hallazgo 2 y 5 arriba.

### Tema: dark mode real, activado por inversión de la escala neutra

Un hook `useTemaPreferencia()` (en `configuracion/`) lee/escribe `localStorage['safe.portal.tema']`
(`'claro' | 'oscuro'`, default `'claro'`) y expone `[tema, setTema]`; en un `useEffect` sobre `tema`
aplica `classList.toggle('dark', ...)` **sobre el contenedor raíz de `PortalLayout`**
(`id="portal-shell"`), no sobre `<html>`. `PortalLayout` también llama el hook (ignorando el setter) para
aplicar el tema guardado apenas se monta el portal, sin depender de que el usuario visite Configuración
primero. El `<select>` de Preferencias lo usa y conserva la nota "Frontend-only, se guarda en el
navegador" del mockup — sigue siendo cierto, solo que ahora la preferencia sí repinta la app.

**Alcance del tema: solo el portal privado (`/app/*`), nunca el sitio público.** Aplicar `.dark` sobre
`<html>` oscurecía también landing, login, planes, etc. — reportado por la usuaria al probar el toggle.
Como `.dark` es una clase CSS normal (no `:root`), acotarla al contenedor de `PortalLayout` basta: las
variables que redefine solo cascadean a sus descendientes en el DOM. El único caso que se escapa de ese
árbol es el popover de `Select` (Radix lo monta con un portal a `document.body` por defecto), así que
`SelectContent` pasa `container={document.getElementById('portal-shell') ?? undefined}` para que el
dropdown también quede dentro del scope oscuro cuando se abre dentro del portal, y sin efecto (`undefined`
→ fallback a `document.body`) en cualquier `Select` del sitio público.

`src/index.css` gana 5 variables nuevas dentro de `.dark`: `--gray-900/700/500/300/100`, la escala neutra
detrás de `ink-*`/`line`/`surface` (ver hallazgo 3). Deliberadamente **no** se toca `--safe-primary-*`
(navy de marca): el sidebar y los botones primarios se mantienen navy en ambos temas, igual que la
mayoría de dashboards con una marca de color fijo — invertir la marca no estaba pedido ni por el mockup ni
por la usuaria. `input.tsx`/`textarea.tsx`/`select.tsx`/`checkbox.tsx` cambian `bg-white` fijo por
`bg-card` para que los controles de formulario también inviertan (en claro `--card` sigue siendo blanco
puro, cero cambio visual).

### Privacidad y legal: reutilizar páginas reales cuando existen

El acordeón de "Privacidad y legal" usa el mismo componente `Accordion` de `src/components/ui` ya
adoptado en `PlanScreen` (FAQ). "Política de privacidad" y "Términos y condiciones" muestran una
descripción corta y un enlace `Ver documento completo →` a `/privacidad` y `/terminos` (`target="_blank"`,
páginas reales y completas del sitio público). "Descargo de responsabilidad" no tiene página real (ver
hallazgo 4): muestra el mismo texto placeholder del mockup, sin enlace.

### Video tutoriales: catálogo estático local, sin `PortalDataContext`

Los 16 tutoriales (título, categoría, duración, descripción) son datos de catálogo fijos — no dependen de
la empresa activa ni cambian en runtime — así que viven en un archivo de datos local del módulo
(`tutoriales/catalogo.ts`), igual patrón que `plan/catalogo.ts` en la Fase 8. Filtro de categoría + texto
+ paginación incremental (9 iniciales, +3 por clic, tope 16) es estado local del componente, como en el
mockup (`tutCat`, `tutQ`, `tutCount`). El modal de "reproductor" es un placeholder visual (mismo texto que
el mockup: "reproductor de video · reemplazar con el video real del tutorial") — no hay videos reales que
embeber.

### Eliminar cuenta: confirmación por texto + logout real, mismo patrón de modales de la Fase 8

Sigue el patrón de componente dedicado por modal (no un sistema `confirmCfg()` genérico) que ya usan
`CancelarSuscripcionModal`/`CambiarPlanModal`/`MetodoPagoModal`: `EliminarCuentaModal.tsx` con
`useAccessibleDialog`, campo de texto que debe decir exactamente `ELIMINAR` (botón deshabilitado hasta
que coincida, igual que `confirmCfg.eliminarCuenta.bloqueado` en el mockup), y al confirmar cierra el
modal, llama `logout()` de `AuthContext` (mismo mecanismo que ya usa "Cerrar sesión" en `AccountMenu`) y
navega a `/`. No hay soft-delete real que simular más allá de cerrar la sesión — coincide con el texto del
mockup ("Se marcará tu cuenta para eliminación... Se cerraría la sesión").

### Fecha fija del módulo: no aplica

A diferencia de Financiero/Obligaciones/Simulador, esta fase no tiene lógica sensible a "hoy" (no hay
vencimientos ni periodos). No se introduce una nueva constante `HOY_*`.

## Modelo de datos

### `src/auth/AuthContext.tsx` — extender `AuthUser`

```ts
export type AuthUser = {
  nombres: string
  apellidos: string
  correo: string
  iniciales: string
  mfaHabilitado: boolean
}
```

Nuevos métodos en `AuthContextValue`: `updateUser(patch: Partial<Pick<AuthUser, 'nombres' | 'apellidos' |
'correo'>>): void` (recalcula `iniciales`) y `toggleMfa(): void`.

### `src/portal/types.ts` — agregar

```ts
export type FrecuenciaResumen = 'NINGUNA' | 'SEMANAL' | 'MENSUAL'

export type PreferenciaUsuario = {
  notificacionesInternas: boolean
  notificacionesCorreo: boolean
  recordatoriosTributarios: boolean
  notificacionesContacto: boolean
  notificacionesSuscripcion: boolean
  frecuenciaResumen: FrecuenciaResumen
  modoGuiado: boolean
}

export type DocumentoLegal = {
  id: string
  titulo: string
  descripcion: string
  href?: string // '/privacidad' | '/terminos'; ausente para Descargo
}

export type VideoTutorial = {
  id: string
  titulo: string
  categoria: string
  duracion: string // 'm:ss', ya formateado como en el mockup
  descripcion: string
}
```

### `PortalDataContext` — nuevos campos

- `preferencias: PreferenciaUsuario`
- `actualizarPreferencia: <K extends keyof PreferenciaUsuario>(clave: K, valor: PreferenciaUsuario[K]) => void`

### `mock-portal-data.ts` — nueva semilla

```ts
export const preferenciaUsuarioSemilla: PreferenciaUsuario = {
  notificacionesInternas: true,
  notificacionesCorreo: true,
  recordatoriosTributarios: true,
  notificacionesContacto: true,
  notificacionesSuscripcion: true,
  frecuenciaResumen: 'SEMANAL',
  modoGuiado: true,
}
```

## Rutas, pantallas y componentes

### 1. Configuración (`ConfiguracionScreen.tsx`, `/app/configuracion`)

Siete secciones en tarjetas apiladas, igual estructura que el mockup:

- **Cuenta**: nombres, apellidos, correo en solo lectura (`<dl>`) + botón "Editar cuenta" →
  `/app/configuracion/cuenta`.
- **Seguridad**: switch de 2FA (`AuthContext.mfaHabilitado`/`toggleMfa`) + formulario de cambiar
  contraseña (estado local, validación descrita arriba) + botón mostrar/ocultar.
- **Notificaciones**: 2 switches globales (internas, correo) + 3 switches de fila (tributarios, contacto,
  suscripción) + `<select>` de frecuencia de resumen. Todo contra `preferencias`/`actualizarPreferencia`.
- **Preferencias**: `<select>` de Tema (`useTemaPreferencia`) + switch de Modo guiado.
- **Suscripción**: plan actual (`planPorCodigo(planActivoCodigo).nombre`) + próxima renovación
  (`suscripcionSemilla.proximaRenovacion` formateada, mismo dato que usa `Sidebar`/`PlanScreen` desde la
  Fase 8) + botón "Administrar plan" → `/app/plan`.
- **Privacidad y legal**: `Accordion` con los 3 documentos (ver decisión arriba).
- **Opciones avanzadas**: botón "Exportar mis datos" (banner `role="status"` inline con el mismo texto del
  mockup, sin generar archivo real) + botón "Eliminar cuenta" (abre `EliminarCuentaModal`).

Cada toggle/guardado exitoso muestra su confirmación con el patrón `role="status"` inline ya usado en
`EmpresaEditarScreen` (Fase 2) — no existe un sistema de toast global en el proyecto, no se introduce uno
nuevo solo para esta fase.

### 2. Editar cuenta (`EditarCuentaScreen.tsx`, `/app/configuracion/cuenta`)

Formulario con nombres/apellidos/correo (estado local inicializado desde `AuthContext.user`), botones
Cancelar (vuelve a `/app/configuracion` sin guardar) y Guardar (`updateUser(...)`, banner de confirmación,
vuelve a `/app/configuracion`). Alcanzable desde el botón "Editar cuenta" de Configuración y desde "Mi
cuenta" en `AccountMenu`.

### 3. Video tutoriales (`TutorialesScreen.tsx`, `/app/tutoriales`)

Buscador de texto + 8 chips de categoría + grid de tarjetas (miniatura placeholder con ícono de play +
duración, título, categoría) + "Cargar más tutoriales" (paginación incremental, se oculta con filtro/
búsqueda activos, igual que `tutHayMas` del mockup). Clic en una tarjeta abre `VideoModal` con el título
del tutorial.

### Modales

- **`EliminarCuentaModal.tsx`**: ver decisión de arquitectura arriba.
- **`VideoModal.tsx`**: diálogo simple (`useAccessibleDialog`) con título del tutorial y placeholder de
  reproductor (`aspect-video`, texto centrado), sin controles reales.

### `AccountMenu.tsx` — completar

Reemplaza el botón único "Configuración de cuenta" (con el comentario `// Fase 9` ya presente) por tres
enlaces + logout, calcando `cuentaMenu` del mockup:

- "Mi cuenta" → `/app/configuracion/cuenta`
- "Mi plan" → `/app/plan`
- "Video tutoriales" → `/app/tutoriales`
- "Cerrar sesión" (ya existente, sin cambios)

### Sidebar / navegación

`navItems` en `mock-portal-data.ts` ya incluye `configuracion` — sin cambios. **No** se agrega
`tutoriales` a `navItems`: el mockup solo lo expone desde `cuentaMenu`, igual que esta fase.

## Rutas nuevas en `App.tsx`

```tsx
<Route path="configuracion" element={<ConfiguracionScreen />} />
<Route path="configuracion/cuenta" element={<EditarCuentaScreen />} />
<Route path="tutoriales" element={<TutorialesScreen />} />
```

## Componente nuevo: `Switch`

No existe un control de switch reutilizable en `src/components/ui`. Se agrega `switch.tsx` (botón
`role="switch"` `aria-checked`, estilo con la píldora de 46×26px del mockup traducida a Tailwind: fondo
`bg-emerald-brand`/`bg-line`, círculo blanco que se desliza) para los 7 usos de esta fase (2FA, modo
guiado, 5 de notificaciones). Sin dependencia nueva (no Radix): un botón controlado simple, igual criterio
de "extensión mínima" que el resto del proyecto.

## Formato, estilo y responsive

Mismas convenciones que Fases 1–8: tarjetas `border border-line rounded-xl bg-card p-4.5`, `page-title`/
`section-title` utilities, grid responsive de 1 columna en móvil, `min-h-11` en controles interactivos,
`role="alert"`/`role="status"` para mensajes, `focus-visible` heredado de los componentes base.

## Datos semilla y catálogo

- `mock-portal-data.ts`: `preferenciaUsuarioSemilla`.
- `configuracion/catalogo.ts`: `DOCUMENTOS_LEGALES: DocumentoLegal[]` (3 items).
- `tutoriales/catalogo.ts`: `VIDEO_TUTORIALES: VideoTutorial[]` (16 items, copiados 1:1 del array `all`
  de `tutGrid` en el mockup) + `CATEGORIAS_TUTORIAL: string[]` (8 items, incluye `'Todos'`).

## Estructura de archivos

```
src/portal/configuracion/
  ConfiguracionScreen.tsx
  EditarCuentaScreen.tsx
  EliminarCuentaModal.tsx
  useTemaPreferencia.ts
  catalogo.ts
src/portal/tutoriales/
  TutorialesScreen.tsx
  VideoModal.tsx
  catalogo.ts
src/components/ui/switch.tsx
```

Modificados: `src/auth/AuthContext.tsx`, `src/App.tsx` (2 `login(...)` + 3 rutas nuevas),
`src/portal/components/AccountMenu.tsx`, `src/portal/components/Topbar.tsx` (derivar `nombre`),
`src/portal/dashboard/DashboardScreen.tsx` (derivar `nombre`), `src/portal/types.ts`,
`src/portal/PortalDataContext.tsx`, `src/portal/data/mock-portal-data.ts`.

## Alcance recortado deliberadamente

- Dark mode invierte la escala neutra (`ink`/`line`/`surface`) y los controles de formulario; la marca
  (navy/emerald/amber) se mantiene igual en ambos temas a propósito (hallazgo 3).
- Sin sistema de tours/ayudas contextuales: el switch de Modo guiado persiste pero no dispara nada.
- Sin filtrado real de notificaciones del header por las preferencias de esta fase (hallazgo 5).
- Sin página real de "Descargo de responsabilidad": placeholder, igual que el mockup.
- Sin exportación de datos real: banner de confirmación, sin archivo generado.
- Sin backend de contraseña: se valida y se "confirma" la UX, no hay hash que actualizar.
- Sin reproductor de video real: placeholder visual, igual que el mockup.

## Verificación

- `npx tsc --noEmit` y `npx vite build` en verde tras cada tarea.
- Navegador: recorrer Configuración (los 7 toggles, cambio de contraseña con validaciones, exportar,
  eliminar cuenta con el campo `ELIMINAR`), Editar cuenta desde los dos puntos de entrada, Video
  tutoriales (buscar, filtrar por categoría, cargar más, abrir modal), `AccountMenu` con los 3 enlaces
  nuevos, y confirmar que `Topbar`/`DashboardScreen` siguen mostrando el primer nombre correctamente tras
  el cambio de `AuthUser`.

## Fuera de alcance (Fase 9)

- Tours contextuales, exportación de datos real, backend de autenticación/contraseña, reproductor de
  video real, filtrado de notificaciones del header por preferencia — todos documentados arriba como
  decisiones deliberadas, no como pendientes.
- Cualquier cambio a Fases 1–8 ya revisadas y mergeadas: esta fase es autocontenida, salvo los dos puntos
  de integración que esas fases dejaron pendientes explícitamente (`AccountMenu`, nav item de
  `configuracion`) y el fix de dark mode en `src/index.css` + `src/components/ui/{input,textarea,select,checkbox}.tsx`,
  compartidos por las 9 fases — necesario para que el selector de Tema de esta fase funcione de verdad;
  no cambia nada visible en tema claro.
