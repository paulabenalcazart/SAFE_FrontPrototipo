# Integración del portal administrador — Diseño

**Fecha:** 2026-08-13

**Estado:** aprobado por autorización autónoma del usuario

**Fuente funcional:** `SAFE_Admin.zip`

**Frontend destino:** `SAFE_FrontPrototipo`, rama `dylan_cd`

## 1. Objetivo

Integrar las nueve pantallas del proyecto SAFE Admin como un tercer perfil autenticado dentro del frontend existente. El resultado debe conservar intactos los perfiles Empresa y Colaborador, compartir autenticación, shell, navegación, títulos y sistema visual, y permitir recorrer y operar el demo administrativo con `admin@safe-demo.ec`.

La integración sigue siendo un prototipo frontend: no habrá backend, llamadas remotas ni persistencia de negocio. El estado administrativo se mantiene en memoria durante la sesión, igual que `PortalDataContext`.

## 2. Hallazgos de la auditoría

El ZIP contiene 51 archivos TypeScript/TSX, 42 vistas o componentes visuales, 9 rutas, 33 pruebas y una semilla de aproximadamente 70 KB. Cubre:

- Dashboard consolidado.
- Usuarios: empresas, colaboradores, postulaciones y usuarios sin empresa.
- Parámetros normativos y catálogos del modelo SQL.
- Planes, módulos, límites y permisos por rol.
- Comunicaciones y plantillas de correo.
- Incidencias, logs, auditoría y alertas de seguridad.
- Video tutoriales.
- Configuración global.

El código fuente solo depende de React, React Router, Lucide, TypeScript, Vite y Tailwind, ya disponibles en el frontend destino.

Defectos del proyecto de origen que no deben copiarse:

- `scripts/tests/helpers.mjs` referencia una instalación absoluta de TypeScript en Linux. Al sustituirla por resolución local portable, las 33 pruebas pasan.
- El build aislado no reconoce imports de PNG porque el ZIP no incluye `vite-env.d.ts`. El frontend destino ya tiene esa declaración.
- El provider administrativo persiste datos de negocio en `localStorage`, contrario al patrón en memoria del portal actual.
- El proyecto trae router, layout, sidebar, topbar, assets y resets CSS propios que duplicarían y contaminarían el frontend integrado.
- Los diálogos bloquean scroll y Escape, pero no atrapan ni restituyen foco.
- Varios controles miden menos de 44 px y existe microtexto menor de 12 px.
- Algunos enlaces internos son absolutos desde `/`, y algunos enlaces de documentos son simulaciones `#document`.

## 3. Enfoques considerados

### A. Integración nativa y aislada — seleccionado

Portar dominio, pantallas y lógica a `src/portal/admin/`; reutilizar el shell y router existentes; encapsular estilos bajo `.admin-surface`; cargar el módulo de forma diferida; y proteger las rutas con `ADMIN`.

Ventajas: coherencia real, sesión única, ausencia de colisiones CSS, menor impacto en el bundle inicial y guardas auditables. Conserva el valor funcional y las pruebas del ZIP sin mantener una segunda aplicación.

### B. Aplicación independiente montada bajo `/admin`

Conservaría casi intactos router, shell y CSS del ZIP. Es más rápido, pero duplicaría autenticación, navegación y diseño, además de dejar dos fuentes de verdad para SAFE. Se descarta.

### C. Reescritura total con componentes nuevos

Rehacer las 42 vistas únicamente con Tailwind ofrecería uniformidad máxima, pero desperdiciaría lógica validada y elevaría el riesgo de omitir campos y flujos. Se descarta por YAGNI.

## 4. Autenticación y roles

`AppRole` se amplía de `EMPRESA | COLABORADOR` a `EMPRESA | COLABORADOR | ADMIN`. Toda selección de pantalla o navegación debe ser explícita para los tres roles; queda prohibido usar el patrón “si no es Colaborador, entonces Empresa”.

Identidad demo:

```ts
{
  role: 'ADMIN',
  nombres: 'Emilio',
  apellidos: 'Pino',
  correo: 'admin@safe-demo.ec',
  telefono: '+593 2 600 0000',
  pais: 'Ecuador',
  ciudad: 'Quito',
  iniciales: 'EP',
  mfaHabilitado: true,
}
```

Reglas:

- El correo se normaliza con `trim().toLowerCase()`.
- `admin@safe-demo.ec` inicia ADMIN.
- `maria.lopez@safe-demo.ec` conserva COLABORADOR.
- Cualquier otro correo de login conserva el demo EMPRESA.
- El flujo Signup siempre crea una sesión EMPRESA, incluso si se escribe el correo demo de administrador. Esto evita elevación de rol desde el registro público.
- `readStoredUser` acepta y restaura ADMIN.
- `RequireAuth` sigue resolviendo solamente autenticación; `RoleRoute` resuelve autorización.

## 5. Rutas y títulos

Las rutas comunes se resuelven por rol y las rutas exclusivas quedan bajo un namespace administrativo:

| Destino | Ruta integrada | Título |
|---|---|---|
| Dashboard | `/app/dashboard` | `Dashboard SAFE` |
| Usuarios | `/app/admin/usuarios` | `Usuarios SAFE Admin` |
| Parámetros | `/app/admin/parametros` | `Parámetros normativos SAFE` |
| Planes y permisos | `/app/admin/planes-permisos` | `Planes y permisos SAFE` |
| Alertas y contenido | `/app/admin/alertas-contenido` | `Alertas y contenido SAFE` |
| Incidencias y auditoría | `/app/admin/incidencias-auditoria` | `Incidencias y auditoría SAFE` |
| Alertas de seguridad | `/app/admin/alertas-seguridad` | `Alertas de seguridad SAFE` |
| Tutoriales | `/app/tutoriales` | `Video tutoriales SAFE` |
| Configuración | `/app/configuracion` | `Configuración SAFE` |
| Cuenta personal | `/app/configuracion/cuenta` | `Editar cuenta SAFE` |

Todas las rutas `/app/admin/*` usan `RoleRoute allow={['ADMIN']}`. Empresa o Colaborador que intenten abrirlas vuelven a su dashboard. ADMIN que intente abrir rutas exclusivas de los otros roles también vuelve a `/app/dashboard`.

Los links internos del ZIP se reescriben a las rutas anteriores. No se portan `main.tsx`, `App.tsx`, `routes.tsx` ni `BrowserRouter` del proyecto externo.

## 6. Shell y navegación

El administrador usa `PortalLayout`, el sidebar fijo de 252 px, el topbar y el menú de cuenta del frontend actual.

Sidebar ADMIN, en este orden:

1. Dashboard.
2. Usuarios.
3. Parámetros normativos.
4. Planes y permisos.
5. Alertas y contenido.
6. Incidencias y auditoría.
7. Video tutoriales.
8. Configuración.

El final del sidebar permanece vacío para todos los perfiles, conforme a la decisión previa. No se añade tarjeta de usuario, plan ni footer.

El topbar ADMIN muestra “Administración SAFE”, alertas de seguridad abiertas y la cuenta de Emilio Pino. Nunca muestra CompanySwitcher, obligaciones tributarias, plan de Empresa ni notificaciones de Colaborador.

El menú de cuenta ADMIN ofrece Mi cuenta, Configuración del sistema, Video tutoriales y Cerrar sesión. No ofrece Mi plan.

Para no dejar ocho módulos inaccesibles por debajo de `lg`, el shell añade un drawer móvil compartido que consume los mismos `navItems` según rol. El drawer no cambia el sidebar desktop, cierra al navegar, con Escape o con el botón explícito, atrapa/restaura foco y solo permite scroll interno cuando la altura física no alcanza. Esta mejora se prueba en los tres roles.

## 7. Organización del código

```text
src/portal/admin/
  AdminDataBoundary.tsx
  admin.css
  types.ts
  data/
    AdminDataContext.tsx
    semilla.json
  components/
    data/
    ui/
    AdminTopbar.tsx
  dashboard/
  usuarios/
  parametros/
  planes/
  contenido/
  auditoria/
  tutoriales/
  configuracion/
  lib/
```

Los componentes administrativos reutilizables quedan dentro de `admin/components`; no se mezclan con primitivas globales salvo que exista un componente compatible. `Pagination` global y `useAccessibleDialog` se reutilizan directamente.

Los nombres de dominio visibles se mantienen en español. Los tipos conservan los nombres del modelo entregado cuando renombrarlos elevaría el riesgo de perder campos.

## 8. Datos y estado

`AdminDataContext` es un límite de dominio independiente montado únicamente para ADMIN. Esta separación evita que el catálogo global de empresas aparezca en `CompanySwitcher` o que los colaboradores administrativos muten el Marketplace del demo.

Reglas de estado:

- Semilla completa del ZIP, con el correo del admin actualizado a `admin@safe-demo.ec`.
- `useState` y actualizaciones inmutables durante la sesión.
- Sin `localStorage`, `sessionStorage` ni backend para datos administrativos.
- Al cerrar sesión o recargar, los cambios de negocio vuelven a la semilla, igual que el resto de datos del portal.
- `resetData` sigue disponible para pruebas y recuperación del demo.
- Las operaciones CRUD conservan las relaciones internas del ZIP.
- Una sola constante `AHORA_ADMIN = '2026-08-13T09:00:00-05:00'` reemplaza fechas ficticias dependientes del reloj cuando se registran acciones.
- Los IDs nuevos usan `crypto.randomUUID()`.

La configuración, planes, comunicaciones, plantillas, tutoriales, usuarios, postulaciones, parámetros, incidencias y alertas conservan sus acciones del proyecto fuente. Toda eliminación pide confirmación. Los formularios validan como mínimo los campos obligatorios visibles antes de persistir.

## 9. Carga y rendimiento

El administrador agrega una semilla y varias pantallas grandes. Para que Empresa y Colaborador no paguen ese costo inicial:

- `AdminDataBoundary` se carga con `React.lazy` solo para una sesión ADMIN.
- Las pantallas administrativas se dividen por módulo mediante imports diferidos.
- El CSS administrativo se importa desde el boundary diferido.
- No se copian logos, favicon, configuración Vite/Tailwind ni dependencias duplicadas.
- Las búsquedas trabajan sobre colecciones pequeñas; no se añade debounce ni virtualización sin necesidad.
- La exportación Excel se conserva como helper puro y genera el archivo localmente.

## 10. Sistema visual y responsive

La app del ZIP ya utiliza Inter, Plus Jakarta Sans, azul navy y los mismos tonos semánticos del portal. La integración conserva esa composición densa de operaciones, pero usa los tokens globales actuales.

`admin.css` no contiene `@import`, `:root`, `html`, `body` ni resets globales. Todas sus reglas visuales se limitan a descendientes de `.admin-surface`; por lo tanto, cargar y luego cerrar una sesión ADMIN no altera Empresa, Colaborador ni el landing.

Estándares obligatorios:

- Contraste AA y foco visible.
- Controles interactivos de al menos 44×44 px.
- Texto visible no menor de 12 px.
- SVG Lucide; sin emojis como iconos.
- Tablas con scroll horizontal dentro de su tarjeta, nunca overflow de página.
- Grillas que colapsan a una columna en móvil.
- Modales y drawers con `role="dialog"`, `aria-modal`, título asociado, foco inicial, trampa de Tab, Escape, bloqueo de scroll y retorno de foco.
- Labels asociados a inputs y errores junto al campo.
- Estados no comunicados únicamente por color.
- Compatibilidad con tema claro y oscuro mediante tokens semánticos.
- No se modifican las animaciones o transiciones existentes del landing ni de Empresa/Colaborador. No se añade una librería de movimiento.

Breakpoints de aceptación: 390, 768, 1024 y 1440 px.

## 11. Funcionalidad por módulo

### Dashboard

Cuatro KPIs, evolución mensual y actividad reciente. Sus accesos “Ver todos” abren Usuarios con la pestaña correcta.

### Usuarios

Pestañas Empresas, Colaboradores, Solicitudes y Usuarios sin empresa; filtros; paginación convencional; exportación; registro; detalle; suspensión/reactivación; aprobación/rechazo de postulaciones; y eliminación confirmada. Los detalles conservan los campos tributarios y profesionales, documentos, servicios, disponibilidad y reseñas disponibles en la semilla.

Los enlaces de documentos aceptan únicamente rutas relativas y protocolos `http:`, `https:` o `blob:`. Se bloquean `javascript:` y `data:`.

### Parámetros normativos

Conserva las cuatro áreas, los esquemas SQL entregados, filtros, formularios, historial de modificaciones y exportación. Variables y resultados de escenarios permanecen anidados en su escenario.

### Planes y permisos

Conserva KPIs, tabla, métricas, módulos, límites y permisos por rol, incluidos los códigos SQL `USUARIO_EMPRESA`, `COLABORADOR` y `ADMINISTRADOR`. Crear/editar/eliminar opera en memoria.

### Alertas y contenido

Conserva comunicaciones y plantillas, KPIs, filtros, vista, edición, borrador, programación, publicación, exportación y eliminación confirmada.

### Incidencias y auditoría

Conserva KPIs, tabs de incidencias/logs/auditoría, rango de fechas, exportación, detalle y resolución. Alertas de seguridad es una subpantalla, no un noveno ítem del sidebar.

### Tutoriales

Tabla con filtros, paginación, exportación, alta/edición, publicar/ocultar y eliminación confirmada.

### Configuración

Conserva identidad/localización, seguridad, notificaciones, plantillas e información del sistema. El logotipo seleccionado se previsualiza en memoria, sin upload real. El feedback de guardado es accesible y no depende solo de un timeout visual.

## 12. Pruebas y criterios de aceptación

### Automatizadas

- Portar las pruebas puras de filtrado, métricas, exportación, esquemas, alineación SQL, semilla y conteos con resolución local de TypeScript.
- Añadir contratos de integración para correo ADMIN, restauración de rol, separación Signup/Login, rutas protegidas, nav por rol, títulos y ausencia de rutas absolutas del ZIP.
- Verificador estático para las nueve pantallas, ocho items de sidebar, CSS encapsulado, controles mínimos y textos internos prohibidos.
- `npm run build` después de cada commit funcional.

### Navegador

- Login con `admin@safe-demo.ec`, recarga y logout.
- Signup con el mismo correo produce Empresa, nunca ADMIN.
- Matriz anónimo/Empresa/Colaborador/ADMIN sobre rutas permitidas y prohibidas.
- Navegación desktop y drawer móvil.
- Las nueve pantallas, títulos y links internos.
- Búsqueda, filtros, paginación, tabs, exportación y al menos una mutación reversible por dominio.
- Diálogos/drawers: foco, Tab, Shift+Tab, Escape, cierre explícito y retorno de foco.
- 390, 768, 1024 y 1440 px; tema claro y oscuro; cero overflow de página.
- Cero errores de consola, excepciones o respuestas HTTP fallidas.
- Smoke de los módulos críticos Empresa y Colaborador para confirmar ausencia de regresión.

La herramienta de navegador integrada se intentará primero. Si el runtime no está expuesto, se documentará y se usará Chrome/Edge local aislado mediante CDP, cerrando únicamente procesos y perfiles temporales creados para QA.

## 13. Fuera de alcance

- Backend, API, base de datos o autenticación real.
- Persistencia de negocio entre recargas.
- Envío real de correos o comunicaciones.
- Upload real de logos, documentos o videos.
- Integración bidireccional entre la semilla ADMIN y los datos Empresa/Colaborador.
- Cambios visuales o de movimiento al landing y módulos terminados, salvo el drawer móvil compartido necesario para navegación responsive.
- Refactor general del frontend fuera de los límites que consume esta integración.

## 14. Decisiones cerradas

- Se integran las nueve pantallas y todas las acciones presentes en el ZIP.
- Se usa el shell actual; no se monta una segunda aplicación.
- El role code de autenticación es `ADMIN`; los permisos internos conservan `ADMINISTRADOR`.
- El correo demo es exactamente `admin@safe-demo.ec` y el nombre es Emilio Pino.
- Estado administrativo separado y en memoria.
- Namespace de rutas `/app/admin/*` para módulos exclusivos.
- CSS encapsulado y carga diferida.
- Sidebar desktop sin contenido inferior.
- Paginación convencional compartida.
- Sin dependencias nuevas.
