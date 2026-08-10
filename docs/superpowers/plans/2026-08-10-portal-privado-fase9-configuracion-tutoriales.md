# Portal Privado — Fase 9 (Configuración + tutoriales) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir Configuración (cuenta, seguridad, notificaciones, preferencias, resumen de
suscripción, privacidad y legal, opciones avanzadas) y Video tutoriales, la última fase del roadmap del
portal privado, como prototipo frontend de alta fidelidad bajo `/app/configuracion` y `/app/tutoriales`,
completando los dos puntos de integración (`AccountMenu`, nav item `configuracion`) que fases anteriores
dejaron explícitamente pendientes.

**Architecture:** Identidad de usuario (`nombres`, `apellidos`, `correo`, `mfaHabilitado`) se extiende en
`AuthContext` (mapea 1:1 a la tabla `usuario`). Preferencias de cuenta (notificaciones, resumen, modo
guiado) se agregan como campo plano a `PortalDataContext`, mismo patrón que la Fase 8 usó para plan y
métodos de pago. Tema es una preferencia cosmética en `localStorage`, sin re-skin real (los tokens `.dark`
existentes no cubren las clases `ink-*`/`navy-*`/`line`/`surface` que usa el portal). Tutoriales y
documentos legales son catálogos estáticos locales, mismo patrón que `plan/catalogo.ts`. Un componente
`Switch` reutilizable nuevo cubre los 7 toggles de esta fase.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4 CSS-first,
react-router-dom 6, lucide-react, shadcn/ui (`Button`, `Input`, `Label`, `Textarea`, `Accordion`,
`Select`). Sin backend, test runner, ESLint ni dependencias nuevas.

## Global Constraints

- Trabajar sobre la rama `dylan_cd` y preservar cualquier cambio ajeno que aparezca durante la ejecución.
- Fuente normativa de alcance: `docs/superpowers/specs/2026-08-10-portal-privado-fase9-configuracion-tutoriales-design.md`.
- Módulo autocontenido: no modificar código de Fases 2–8, salvo los puntos de integración ya previstos por
  esas fases (`AccountMenu.tsx` ya tiene el comentario `// Fase 9`; `mock-portal-data.ts` ya define el nav
  item `configuracion`) y la extensión mínima de `Topbar.tsx`/`DashboardScreen.tsx` para derivar `nombre`
  desde `nombres`+`apellidos`.
- Sin dark mode real, sin sistema de tours contextuales, sin filtrado real de notificaciones del header,
  sin página real de "Descargo de responsabilidad", sin exportación de datos real, sin backend de
  contraseña, sin reproductor de video real — todo documentado como alcance recortado en el spec.
- "Mi cuenta" y "Editar cuenta" son la misma pantalla/ruta (`/app/configuracion/cuenta`), alcanzable desde
  `AccountMenu` y desde el botón "Editar cuenta" de Configuración.
- El `Switch` nuevo es un botón `role="switch"` controlado, sin dependencia nueva (no Radix).
- Ejecutar `npm run build` después de cada tarea.
- Cada tarea requiere revisión de cumplimiento del spec y luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                      # Modify: 2 login() + 3 rutas nuevas
├── auth/
│   └── AuthContext.tsx                          # Modify: nombres/apellidos/mfaHabilitado + updateUser/toggleMfa
├── components/ui/
│   └── switch.tsx                               # Create: control reutilizable role="switch"
└── portal/
    ├── types.ts                                 # Modify: PreferenciaUsuario, DocumentoLegal, VideoTutorial
    ├── PortalDataContext.tsx                    # Modify: preferencias + actualizarPreferencia
    ├── data/
    │   └── mock-portal-data.ts                  # Modify: preferenciaUsuarioSemilla
    ├── components/
    │   ├── AccountMenu.tsx                      # Modify: 3 enlaces + logout
    │   ├── Topbar.tsx                           # Modify: derivar nombre completo
    │   └── ...
    ├── dashboard/
    │   └── DashboardScreen.tsx                  # Modify: derivar primer nombre
    ├── configuracion/
    │   ├── catalogo.ts                          # Create: DOCUMENTOS_LEGALES
    │   ├── useTemaPreferencia.ts                # Create: hook localStorage
    │   ├── ConfiguracionScreen.tsx               # Create
    │   ├── EditarCuentaScreen.tsx                # Create
    │   └── EliminarCuentaModal.tsx               # Create
    └── tutoriales/
        ├── catalogo.ts                          # Create: VIDEO_TUTORIALES + CATEGORIAS_TUTORIAL
        ├── TutorialesScreen.tsx                  # Create
        └── VideoModal.tsx                        # Create
```

---

### Task 1: Tipos de dominio + `Switch` reutilizable

**Files:**
- Modify: `src/portal/types.ts`
- Create: `src/components/ui/switch.tsx`

**Interfaces:**
- Produces: `FrecuenciaResumen`, `PreferenciaUsuario`, `DocumentoLegal`, `VideoTutorial` para todas las
  tareas posteriores; `Switch` (props `checked: boolean`, `onCheckedChange: () => void`, `label?: string`
  para `aria-label`) para las Tareas 3 y 5.

- [ ] **Step 1:** Agregar los tipos al final de `src/portal/types.ts` (ver bloque `Modelo de datos` del
  spec: `FrecuenciaResumen`, `PreferenciaUsuario`, `DocumentoLegal`, `VideoTutorial`).
- [ ] **Step 2:** Crear `switch.tsx`: botón `type="button" role="switch" aria-checked={checked}`,
  `min-h-11` de área de toque, píldora 46×26px (`bg-emerald-brand` on / `bg-line` off), círculo blanco
  animado con `transition-transform` (equivalente Tailwind al `left: 2px/22px` del mockup).
- [ ] **Step 3:** `npm run build` limpio.
- [ ] **Step 4:** Commit `feat: agregar tipos de configuracion y componente switch`.

---

### Task 2: Extender `AuthContext` con identidad completa

**Files:**
- Modify: `src/auth/AuthContext.tsx`, `src/App.tsx` (2 llamadas a `login(...)`),
  `src/portal/components/Topbar.tsx`, `src/portal/dashboard/DashboardScreen.tsx`,
  `src/portal/components/AccountMenu.tsx`

**Interfaces:**
- Produces: `AuthUser { nombres, apellidos, correo, iniciales, mfaHabilitado }`,
  `updateUser(patch: Partial<Pick<AuthUser,'nombres'|'apellidos'|'correo'>>): void`, `toggleMfa(): void`
  para las Tareas 3 y 4.

- [ ] **Step 1:** Cambiar el tipo `AuthUser` y recalcular `iniciales` dentro de `updateUser` (mismas
  reglas que ya arma `iniciales` en los `login(...)` actuales: primera letra de nombres + primera letra de
  apellidos, mayúsculas).
- [ ] **Step 2:** Agregar `updateUser` y `toggleMfa` a `AuthContextValue` y al provider; ambos disparan el
  `useEffect` de persistencia a `localStorage` ya existente sin tocarlo.
- [ ] **Step 3:** Actualizar los 2 `login({...})` en `App.tsx` para pasar `nombres: 'María Fernanda',
  apellidos: 'Torres'` en vez de `nombre` combinado; agregar `mfaHabilitado: false`.
- [ ] **Step 4:** `Topbar.tsx`, `DashboardScreen.tsx`, `AccountMenu.tsx`: reemplazar `user.nombre` por
  `` `${user.nombres} ${user.apellidos}` `` (o extraer un pequeño helper `nombreCompleto(user)` si se
  repite en más de 2 sitios) — sin cambiar el comportamiento visible.
- [ ] **Step 5:** `npm run build` limpio; verificar en navegador que Topbar y Dashboard siguen mostrando
  "María" correctamente.
- [ ] **Step 6:** Commit `feat: separar nombres y apellidos en AuthContext y agregar mfa`.

---

### Task 3: Preferencias de cuenta en `PortalDataContext`

**Files:**
- Modify: `src/portal/PortalDataContext.tsx`, `src/portal/data/mock-portal-data.ts`

**Interfaces:**
- Consumes: `PreferenciaUsuario` de Task 1.
- Produces: `preferencias: PreferenciaUsuario`,
  `actualizarPreferencia<K extends keyof PreferenciaUsuario>(clave: K, valor: PreferenciaUsuario[K]): void`
  para la Tarea 5.

- [ ] **Step 1:** Agregar `preferenciaUsuarioSemilla` a `mock-portal-data.ts` (defaults `TRUE`/
  `'SEMANAL'`, igual que el `DEFAULT` de la tabla `preferencia_usuario`).
- [ ] **Step 2:** Agregar `preferencias`/`actualizarPreferencia` al contexto (mismo patrón `setState`
  inmutable que `editarExpiracionMetodoPago`).
- [ ] **Step 3:** `npm run build` limpio.
- [ ] **Step 4:** Commit `feat: agregar preferencias de cuenta a PortalDataContext`.

---

### Task 4: Pantalla Configuración

**Files:**
- Create: `src/portal/configuracion/catalogo.ts`, `src/portal/configuracion/useTemaPreferencia.ts`,
  `src/portal/configuracion/ConfiguracionScreen.tsx`
- Modify: `src/App.tsx` (ruta `configuracion`)

**Interfaces:**
- Consumes: `AuthContext` (Task 2), `PortalDataContext.preferencias`/`actualizarPreferencia` (Task 3),
  `Switch` (Task 1), `planPorCodigo`/`suscripcionSemilla` (Fase 8).
- Produces: ruta `/app/configuracion` navegable desde el nav item ya existente.

- [ ] **Step 1:** `configuracion/catalogo.ts`: `DOCUMENTOS_LEGALES: DocumentoLegal[]` (Política de
  privacidad → `href: '/privacidad'`, Términos y condiciones → `href: '/terminos'`, Descargo de
  responsabilidad → sin `href`, texto placeholder del mockup).
- [ ] **Step 2:** `useTemaPreferencia.ts`: hook `localStorage['safe.portal.tema']`, default `'claro'`,
  `[tema, setTema]`.
- [ ] **Step 3:** `ConfiguracionScreen.tsx` con las 7 secciones descritas en el spec (Cuenta, Seguridad,
  Notificaciones, Preferencias, Suscripción, Privacidad y legal, Opciones avanzadas). Confirmaciones
  inline `role="status"` (mismo patrón que `EmpresaEditarScreen`), sin toast global.
- [ ] **Step 4:** Ruta `configuracion` en `App.tsx` (ya puede existir un placeholder — reemplazar por el
  componente real).
- [ ] **Step 5:** `npm run build` limpio; navegar y probar los 7 switches, el formulario de contraseña
  (casos: muy corta, no coincide, válida) y el select de resumen/tema.
- [ ] **Step 6:** Commit `feat: agregar pantalla de configuracion`.

---

### Task 5: Editar cuenta + Eliminar cuenta

**Files:**
- Create: `src/portal/configuracion/EditarCuentaScreen.tsx`, `src/portal/configuracion/EliminarCuentaModal.tsx`
- Modify: `src/App.tsx` (ruta `configuracion/cuenta`), `src/portal/configuracion/ConfiguracionScreen.tsx`
  (abrir el modal desde "Eliminar cuenta")

**Interfaces:**
- Consumes: `AuthContext.updateUser`/`logout` (Task 2), `useAccessibleDialog` (Fase 8,
  `plan/useAccessibleDialog.ts`).

- [ ] **Step 1:** `EditarCuentaScreen.tsx`: formulario nombres/apellidos/correo, Cancelar vuelve a
  `/app/configuracion` sin guardar, Guardar llama `updateUser(...)` y vuelve con confirmación.
- [ ] **Step 2:** `EliminarCuentaModal.tsx`: campo de texto que debe decir `ELIMINAR` exactamente, botón
  deshabilitado hasta que coincida; al confirmar, `logout()` + `navigate('/')`.
- [ ] **Step 3:** Ruta `configuracion/cuenta` en `App.tsx`.
- [ ] **Step 4:** `npm run build` limpio; probar Editar cuenta desde el botón de Configuración y verificar
  que el flujo de Eliminar cuenta cierra sesión correctamente.
- [ ] **Step 5:** Commit `feat: agregar pantalla editar cuenta y modal eliminar cuenta`.

---

### Task 6: Video tutoriales

**Files:**
- Create: `src/portal/tutoriales/catalogo.ts`, `src/portal/tutoriales/TutorialesScreen.tsx`,
  `src/portal/tutoriales/VideoModal.tsx`
- Modify: `src/App.tsx` (ruta `tutoriales`)

**Interfaces:**
- Consumes: `useAccessibleDialog` (Fase 8).
- Produces: ruta `/app/tutoriales`.

- [ ] **Step 1:** `tutoriales/catalogo.ts`: `VIDEO_TUTORIALES` (16 items, copiados del array `all` de
  `tutGrid` en el mockup, líneas 4871–4888) + `CATEGORIAS_TUTORIAL` (8, incluye `'Todos'`).
- [ ] **Step 2:** `TutorialesScreen.tsx`: buscador + chips de categoría + grid + "Cargar más" (estado
  local `count` inicial 9, +3 por clic, tope 16, oculto si hay filtro/búsqueda activos).
- [ ] **Step 3:** `VideoModal.tsx`: diálogo con título + placeholder `aspect-video`.
- [ ] **Step 4:** Ruta `tutoriales` en `App.tsx`.
- [ ] **Step 5:** `npm run build` limpio; probar búsqueda, filtro por categoría y paginación incremental.
- [ ] **Step 6:** Commit `feat: agregar pantalla video tutoriales`.

---

### Task 7: Completar `AccountMenu`

**Files:**
- Modify: `src/portal/components/AccountMenu.tsx`

- [ ] **Step 1:** Reemplazar el botón único (con el comentario `// Fase 9`) por 3 `<Link>`/botones de
  navegación ("Mi cuenta" → `/app/configuracion/cuenta`, "Mi plan" → `/app/plan`, "Video tutoriales" →
  `/app/tutoriales`) + "Cerrar sesión" ya existente, todos cerrando el menú (`onClose`) al navegar.
- [ ] **Step 2:** `npm run build` limpio; probar los 3 enlaces desde el header.
- [ ] **Step 3:** Commit `feat: completar menu de cuenta con enlaces de configuracion, plan y tutoriales`.

---

### Task 8: Verificación integral y revisión final

**Files:** ninguno nuevo — solo fixes que surjan de la verificación.

- [ ] **Step 1:** Recorrido completo en navegador: Configuración (los 7 toggles persisten al navegar y
  volver, contraseña con los 3 casos de validación, exportar, eliminar cuenta con el campo `ELIMINAR`
  exacto), Editar cuenta desde los dos puntos de entrada, Video tutoriales (buscar, filtrar, cargar más,
  modal), `AccountMenu` completo, responsive (390/768/1440), accesibilidad básica (foco visible, Escape
  cierra modales, `aria-checked`/`aria-expanded` correctos).
- [ ] **Step 2:** Revisión de rama completa (spec vs. implementación) buscando hallazgos cruzados entre
  tareas, igual que el Task 11 de la Fase 8.
- [ ] **Step 3:** Corregir hallazgos, `npm run build` limpio.
- [ ] **Step 4:** Commit final de fixes si aplica: `fix: corregir hallazgos de la revision final de Fase 9`.
