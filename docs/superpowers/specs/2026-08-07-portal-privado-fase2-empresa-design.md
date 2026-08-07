# Portal Privado — Fase 2: Mi Empresa

Fecha: 2026-08-07

## Contexto

La Fase 1 (ver `docs/superpowers/specs/2026-08-06-portal-privado-fase1-design.md`) construyó el shell
del portal privado (Sidebar, Topbar con selector de empresa/alertas/notificaciones/cuenta) y la
pantalla de Dashboard, todo con datos mock estáticos. Esa fase dejó explícitamente pendiente el
módulo "Mi Empresa" y anotó dos puntos inertes a propósito:

- El botón "Registrar otra empresa" del `CompanySwitcher` (Topbar) solo cierra el dropdown, sin
  navegar — comentario en el código: *"se conecta a /app/empresa/registrar en la Fase 2"*.
- El botón "Editar empresa" del Dashboard/header de empresa no existía aún como pantalla real.
- El nombre de empresa mostrado en el saludo del Dashboard está hardcodeado
  (`"Textiles Andina S.A."` en `DashboardScreen.tsx`) en lugar de leerse de un estado compartido.

Esta fase implementa el módulo "Mi Empresa" completo: ver el perfil de la empresa activa, registrar
una empresa nueva (wizard de 4 pasos), y editarla. Sigue siendo un **prototipo de alta fidelidad, solo
frontend** — no hay backend ni API real; el "registro"/"edición" de empresas vive en memoria de React
para esta sesión del navegador (no persiste entre recargas — la Fase 1 sí usó `localStorage` para la
sesión de auth, pero los datos de negocio del portal, incluida `Empresa`, siguen siendo mock en memoria,
consistente con cómo Fase 1 dejó el resto de los datos del dashboard).

Roadmap general (heredado del spec de Fase 1): 1. Shell + Dashboard ✅ · **2. Mi Empresa (esta fase)**
· 3. Financiero · 4. Indicadores · 5. Obligaciones tributarias · 6. Simulador · 7. Marketplace ·
8. Plan y suscripción · 9. Configuración + tutoriales.

## Decisiones de arquitectura

### `PortalDataProvider`: primer estado compartido real del portal

Hasta ahora, todo el contenido del portal (`kpis`, `indicadores`, `obligaciones`, `empresaActiva`,
`empresasDisponibles`, etc.) vive en arrays/objetos estáticos importados directamente desde
`src/portal/data/mock-portal-data.ts`. Esta fase introduce el primer Context de datos del portal,
`PortalDataProvider` (`src/portal/PortalDataContext.tsx`), que envuelve `<PortalLayout>` dentro de la
rama `/app` (adentro de `<RequireAuth>`, junto a `AuthProvider` que ya envuelve toda la app desde la
Fase 1):

```ts
type PortalDataContextValue = {
  empresas: Empresa[]
  empresaActivaId: string
  empresaActiva: Empresa
  setEmpresaActiva: (id: string) => void
  addEmpresa: (empresa: Empresa) => void
  updateEmpresa: (id: string, patch: Partial<Empresa>) => void
}
```

Se inicializa con los mismos datos mock de la Fase 1 (`empresaActiva`/`empresasDisponibles` migran de
`mock-portal-data.ts` al estado inicial de este contexto). `Sidebar`, `Topbar`/`CompanySwitcher` y
`DashboardScreen` pasan a leer la empresa activa de este contexto en lugar de importar la constante
estática — esto es lo que hace que cambiar de empresa, registrar una nueva, y editarla se sientan
reales dentro del prototipo.

**Por qué ahora y no antes:** la Fase 1 evaluó explícitamente esta decisión y la descartó por YAGNI
("no se crea ese contexto ahora... un módulo estático de datos alcanza para esta fase") precisamente
porque no había ninguna pantalla que necesitara mutar la empresa activa. Esta fase sí la tiene.

### Alcance recortado deliberadamente

- **Recalcular KPIs/indicadores al editar datos fiscales:** el diseño muestra un aviso de que cambiar
  "datos sensibles" (régimen tributario, actividad económica, etc.) *"regenera obligaciones aplicables
  y recalcula el diagnóstico"*. Esta fase muestra el aviso (UI) pero **no** recalcula números reales de
  KPIs/indicadores/obligaciones — esa lógica de negocio no existe todavía (llega en las fases de
  Financiero/Indicadores/Obligaciones) y construirla ahora sería alcance prematuro.
- **Campos bloqueados por plan:** el diseño muestra algunos campos del perfil con un candado (bloqueados
  según el plan de suscripción). Este comportamiento depende de un sistema de permisos por plan que no
  existe aún — se difiere a la Fase 8 (Plan y suscripción). Todos los campos del perfil son visibles en
  esta fase.
- **Validación de RUC/cédula:** se valida que los campos requeridos no estén vacíos antes de avanzar de
  paso en el wizard; no se implementa el algoritmo de validación de dígito verificador de RUC/cédula
  ecuatoriano (es un dato mock, no hay backend que lo valide en producción tampoco).
- **Persistencia:** los datos de empresa (a diferencia de la sesión de auth) no se guardan en
  `localStorage` — viven en el estado de React mientras dura la sesión del navegador. Registrar una
  empresa y recargar la página la hace desaparecer. Esto es aceptable para un prototipo de alta
  fidelidad; se resolverá naturalmente cuando exista un backend real.

## Modelo de datos

Se amplía `Empresa` (hoy `{id, nombre, ruc, iniciales}`, pensado solo para el selector de la Fase 1) a
un perfil completo agrupado por categoría, con datos de dominio ecuatoriano (SRI):

```ts
type Empresa = {
  id: string
  nombre: string          // nombre comercial — usado por Sidebar/CompanySwitcher/Dashboard (ya existía)
  ruc: string              // ya existía
  iniciales: string        // ya existía
  estado: string            // 'Activa'
  plan: string
  diagnostico?: string      // 'Saludable' | 'Atención' | ...
  diagnosticoFecha?: string
  general: {
    razonSocial: string
    tipoContribuyente: 'Persona Natural' | 'Persona Jurídica'
    fechaConstitucion: string
    numeroEmpleados: string
  }
  fiscal: {                 // "datos sensibles" en Editar
    regimenTributario: string
    actividadEconomica: string
    obligadoContabilidad: 'Sí' | 'No'
    agenteRetencion: 'Sí' | 'No'
  }
  contacto: {
    correo: string
    telefono: string
    sitioWeb: string
  }
  representante: {
    nombre: string
    cedula: string
  }
  ubicacion: {
    provincia: string
    ciudad: string
    direccion: string
  }
  meta: {                    // "no editables"
    fechaRegistroSafe: string
  }
}
```

Los campos ya existentes (`id`, `nombre`, `ruc`, `iniciales`) mantienen su nombre para no romper el
código de la Fase 1 que ya los consume (`Sidebar`, `CompanySwitcher`, `Topbar`).

## Rutas y pantallas

```
/app/empresa            → EmpresaScreen (ver)
/app/empresa/registrar  → EmpresaRegistrarScreen (wizard, 4 pasos)
/app/empresa/editar     → EmpresaEditarScreen
```

Las 3 son rutas hijas de la misma rama `/app` protegida por `RequireAuth` + `PortalLayout` que ya
existe desde la Fase 1.

### 1. Ver empresa (`EmpresaScreen.tsx`)

- Header: iniciales grandes, nombre comercial + razón social, badges (estado / plan / diagnóstico +
  fecha), botón "Editar empresa" → navega a `/app/empresa/editar`.
- 3 tarjetas resumen: Régimen tributario, Actividad económica, Representante legal (título + valor
  principal + texto secundario).
- Tabs (General · Fiscal · Contacto · Ubicación · Representante) que filtran una grilla de campos de
  solo lectura (`dt`/`dd`) según la categoría activa — cada tab mapea directo a una de las 5 claves
  anidadas de `Empresa` (`general`, `fiscal`, `contacto`, `ubicacion`, `representante`).

### 2. Registrar empresa (`EmpresaRegistrarScreen.tsx`)

Wizard de 4 pasos con indicador de progreso (círculos numerados, paso activo resaltado). Estado local
del wizard: paso actual + borrador de formulario (`Partial<Empresa>` en construcción) + errores de
validación por campo. La empresa **no** se crea hasta confirmar en el paso 4.

- **Paso 1 — Datos generales:** razón social, nombre comercial, RUC, tipo de contribuyente (select),
  fecha de constitución, número de empleados.
- **Paso 2 — Datos fiscales:** régimen tributario (select), actividad económica (select/texto),
  obligado a llevar contabilidad (toggle Sí/No), agente de retención (toggle Sí/No).
- **Paso 3 — Contacto y representante:** correo, teléfono, sitio web, nombre del representante legal,
  cédula del representante, provincia (select), ciudad, dirección.
- **Paso 4 — Revisión:** resumen de solo lectura agrupado en 4 bloques (Datos generales · Datos
  fiscales · Contacto y ubicación · Representante legal). Botón "Registrar empresa" (reemplaza a
  "Siguiente" solo en este paso): valida que no falten campos requeridos de ningún paso anterior, llama
  `addEmpresa()` con un `id`/`iniciales` generados a partir del nombre, marca la nueva empresa como
  activa (`setEmpresaActiva`), y navega a `/app/empresa`.
- Botón "Atrás" disponible en todos los pasos excepto el primero (en el primero, "Atrás" vuelve a
  `/app/empresa` si ya hay una empresa activa, o a `/app/dashboard` si no).
- Validación: cada paso valida sus propios campos requeridos antes de permitir "Siguiente"; los errores
  se muestran bajo cada campo (`role="alert"`, mismo patrón visual que usan hoy Login/Signup).

### 3. Editar empresa (`EmpresaEditarScreen.tsx`)

- Formulario pre-cargado con los datos de `empresaActiva` (del contexto).
- Sección "Datos generales": todos los campos de `general`, `contacto`, `representante`, `ubicacion`
  editables libremente.
- Sección "Datos sensibles" (borde ámbar): campos de `fiscal`. Al modificar cualquiera de estos campos,
  aparece un aviso (`role="status"`, fondo ámbar) explicando que este cambio recalculará obligaciones y
  diagnóstico (solo el aviso — sin recálculo real, ver "Alcance recortado" arriba).
- Sección "No editables": `ruc`, `meta.fechaRegistroSafe`, `plan` — mostrados como texto plano, sin
  inputs.
- Footer sticky (se mantiene visible al hacer scroll) con "Cancelar" (vuelve a `/app/empresa` sin
  guardar) y "Guardar cambios" (llama `updateEmpresa()` con el diff y vuelve a `/app/empresa`).

## Estilo y componentes

Los formularios (wizard y edición) usan los componentes `ui/` ya existentes en el proyecto —
`Input`, `Label`, `Select`/`SelectTrigger`/`SelectContent`/`SelectItem`, `Textarea`, `Checkbox` de
`src/components/ui/` — los mismos que ya usan `LoginPage`/`SignupPage`, en vez de elementos HTML
crudos como hace el mockup `.dc.html` original. Esto mantiene consistencia visual y de accesibilidad
(estados de foco, disabled, etc. ya resueltos) con el resto del sitio.

El resto de la fidelidad visual (colores, spacing, badges de tono, cards, tabs) sigue el mismo patrón
que la Fase 1: tokens existentes de `src/index.css` / `src/portal/tone.ts`, sin agregar tokens nuevos.

## Conexiones que se cierran respecto a la Fase 1

- `CompanySwitcher` (Topbar): el botón "Registrar otra empresa" pasa de cerrar el dropdown sin hacer
  nada, a `navigate('/app/empresa/registrar')`. La lista de empresas y el check de la activa pasan a
  leer del `PortalDataProvider` en lugar de las constantes estáticas `empresaActiva`/`empresasDisponibles`.
- Seleccionar una empresa distinta en el `CompanySwitcher` ahora sí llama `setEmpresaActiva(id)` (antes
  solo cerraba el dropdown).
- `DashboardScreen`: el saludo ("Este es el estado financiero... de Textiles Andina S.A. hoy.") pasa de
  un string hardcodeado a interpolar `empresaActiva.nombre` del contexto.
- `Sidebar`: sin cambios funcionales (no muestra el nombre de empresa), pero ahora podría — fuera de
  alcance de esta fase, no se toca a menos que sea necesario.

## Testing / verificación

Mismo criterio que la Fase 1: el repo no tiene test runner ni eslint. Verificación vía `npm run build`
(type-check) + revisión manual en `npm run dev` (walkthrough: ver empresa → editar → guardar → volver
a ver refleja los cambios; registrar una empresa nueva desde el `CompanySwitcher` → queda activa y
seleccionable → el Dashboard refleja su nombre).

## Fuera de alcance (Fase 2)

- Recalcular KPIs/indicadores/obligaciones al cambiar datos fiscales (fases de Financiero/Indicadores).
- Campos bloqueados por plan de suscripción (Fase 8).
- Validación de algoritmo de RUC/cédula ecuatoriano.
- Persistencia de empresas entre recargas de página (no hay backend en esta etapa del prototipo).
- Cualquier otra de las pantallas del roadmap (Financiero, Indicadores, Obligaciones, Simulador,
  Marketplace, Plan, Configuración, tutoriales).
