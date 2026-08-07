# Portal Privado — Fase 1: Shell + Dashboard

Fecha: 2026-08-06

## Contexto

Se importó desde Claude Design (`claude.ai/design/p/176601a0-5331-452b-a1ac-dc590a7fa146`) el archivo
`SAFE Portal Privado.dc.html`: un mockup de alta fidelidad del **portal privado** de SAFE (la app
autenticada, post-login), separado del landing público que ya existe en este repo. El mockup usa
exactamente los mismos tokens de color (oklch) que `src/index.css`, confirmando que es la continuación
visual del mismo sistema de diseño.

El archivo `.dc.html` describe **26 pantallas** distintas (Dashboard, Mi Empresa, Registrar/Editar
empresa, Estados financieros, Nueva carga financiera, Detalle de registro, Comparar periodos,
Indicadores, Todos los indicadores, Comparar indicadores, Obligaciones tributarias, Detalle de
obligación, Simulador, Detalle de simulación, Marketplace, Perfil de profesional, Plan, Administrar
suscripción, Cambiar plan, Métodos de pago, Historial de pagos, Configuración, Editar cuenta, Video
tutoriales) más varios modales (cumplir obligación, configurar recordatorio, reservar con
profesional). Es demasiado para una sola fase de implementación, así que este spec cubre **solo la
Fase 1** del roadmap de 9 fases (ver más abajo); las fases 2-9 se especifican y planifican por
separado cuando les toque.

Es un **prototipo de alta fidelidad, solo frontend**: no hay backend ni API real. Todo el contenido se
sirve desde datos mock hardcodeados, siguiendo la misma convención que ya usa el landing público
(`README.md`: "No hay variables de entorno ni backend").

Una nota sobre el archivo de diseño: la barra superior gris oscuro con el texto "SAFE PROTOTIPO DE
DISEÑO" y los selectores de Perfil / Vista / Tema / Densidad / Navegación, junto con la barra de
ruta/viewport justo debajo del "shell", son **controles del propio editor de Claude Design** para
previsualizar variantes — no son parte de la UI real del producto y no se implementan.

## Roadmap (9 fases)

1. **Shell + Dashboard** ← esta fase
2. Mi Empresa (ver / editar / registrar)
3. Financiero (estados financieros, nueva carga, detalle, comparar periodos)
4. Indicadores (resumen, todos, comparar)
5. Obligaciones tributarias (lista, detalle, modales de cumplir/recordatorio)
6. Simulador (+ detalle de simulación)
7. Marketplace (+ perfil de profesional, modal de reserva)
8. Plan y suscripción (plan actual, cambiar plan, métodos de pago, historial)
9. Configuración + video tutoriales

Cada fase reutiliza el shell construido en la Fase 1 y sigue el mismo ciclo spec → plan →
implementación.

## Decisiones de arquitectura

### Routing: migrar todo a react-router-dom

Hoy la navegación es un `useState<Page>` manual en `App.tsx`, sin URLs reales. Se migra **todo** el
sitio (público + auth + portal privado) a `react-router-dom` con rutas reales:

```
/                    → Hero + secciones (inicio)
/como-funciona
/planes
/acerca
/trabaja-con-safe
/postulacion
/contacto
/terminos
/privacidad
/login
/recuperar
/signup
/app                 → redirige a /app/dashboard
/app/dashboard       → RequireAuth + PortalLayout (Fase 1)
/app/...             → resto de pantallas del portal (fases 2-9, no existen aún)
```

Los componentes de página existentes (`Hero`, `LoginPage`, etc.) se mantienen: solo cambia cómo se
navega entre ellos (`navigate()` / `<Link>` en vez de `onNavigate` callbacks manuales donde tenga
sentido). Se elige migrar todo el sitio (no solo `/app`) porque el login necesita hacer
`navigate('/app/dashboard')` de forma nativa tras autenticar, y tener dos sistemas de navegación
conviviendo (uno con router, otro con `useState`) sería una costura innecesaria.

### Auth mock: Context + localStorage

`AuthContext` expone `{ user: { nombre, correo, iniciales } | null, login(user), logout() }`. Login y
Signup exitosos llaman `login(mockUser)` (sin validar credenciales, igual que hoy) y navegan a
`/app/dashboard`. La sesión persiste en `localStorage` para sobrevivir refresh.

`<RequireAuth>` envuelve las rutas `/app/*`: sin `user`, redirige a `/login`.

### Estado inicial del Dashboard: empresa activa con datos

El usuario mock arranca **con una empresa ya registrada** y datos financieros de ejemplo cargados
(KPIs, gráfico, tablas llenas) — se prioriza mostrar el portal en su máxima expresión visual. El
estado "sin empresa" (banner de onboarding, tablas vacías) se implementa en la Fase 2, como parte del
flujo de "Registrar empresa"; los tipos de datos quedan preparados para soportarlo (empresa activa
nullable) sin necesitar refactor.

## Estructura de carpetas

```
src/
├── auth/
│   ├── AuthContext.tsx        # user mock, login(), logout(), persistido en localStorage
│   └── RequireAuth.tsx        # wrapper de ruta: sin user → <Navigate to="/login">
│
├── portal/
│   ├── PortalLayout.tsx        # shell: <Sidebar/> + área derecha con <Topbar/> + <Outlet/>
│   ├── components/
│   │   ├── Sidebar.tsx          # logo, nav items, info de plan (footer)
│   │   ├── Topbar.tsx           # selector de empresa, alertas, notificaciones, menú de cuenta
│   │   ├── CompanySwitcher.tsx  # dropdown "empresa activa" + lista + "Registrar empresa"
│   │   ├── NotificationsPanel.tsx
│   │   ├── AccountMenu.tsx
│   │   └── KpiCard.tsx          # tarjeta KPI reutilizable (icono, título, valor, badge)
│   ├── dashboard/
│   │   ├── DashboardScreen.tsx     # compone las piezas de abajo
│   │   ├── FinancialChart.tsx      # gráfico con toggle de vistas (líneas/barras/barras agrupadas)
│   │   ├── IndicatorsTable.tsx     # tabla "Indicadores clave"
│   │   └── ObligationsTable.tsx    # tabla "Obligaciones próximas"
│   ├── data/
│   │   └── mock-portal-data.ts  # empresa activa, KPIs, series del gráfico, indicadores,
│   │                             # obligaciones, notificaciones, nav items
│   └── types.ts                 # tipos compartidos (Empresa, Kpi, Indicador, Obligacion, Notificacion...)
├── assets/
│   ├── safe-logo-dark.png       # ya descargado del proyecto de diseño
│   └── safe-logo-light.png      # ya descargado del proyecto de diseño
```

`portal/` se separa de `components/` (marketing site) porque son productos distintos con audiencias
distintas (visitante vs. usuario autenticado); mezclarlos sería confuso ya con 26 pantallas futuras
por venir. Cada tabla/gráfico del dashboard es su propio componente porque en fases futuras
(Financiero, Indicadores) se reutilizan con más datos y variantes.

## Estilo

Todo se traduce de los estilos inline del `.dc.html` a Tailwind, usando los tokens que **ya existen**
en `src/index.css` (`--color-navy-900`, `--color-emerald-brand`, `--color-amber-brand`, `--color-ink-900`,
etc. — son los mismos valores oklch que el diseño llama `--sf-navy-900`, `--sf-em-600`...). No se
agregan tokens `--sf-*` duplicados.

## Datos mock

Contenido con dominio SRI/financiero ecuatoriano (coherente con el resto del proyecto):

- **KPIs** (4 cards): Ingresos del mes, Obligaciones al día, Capital de trabajo, Próximo vencimiento —
  ícono, valor, texto secundario, badge de variación.
- **Indicadores clave** (tabla, 5 filas): Liquidez corriente, Endeudamiento total, Margen neto, ROE,
  Capital de trabajo — valor, unidad, tendencia (↑/↓), estado (Saludable/Atención/Crítico).
- **Obligaciones próximas** (tabla, 4 filas): Declaración de IVA, Retención en la fuente, Impuesto a la
  Renta, Anticipo IR — periodo, fecha de vencimiento, monto estimado, estado (Al día/Próximo/Vencido).
- **Notificaciones** (2-3) y **empresas del selector** (2-3), con timestamps relativos.

El selector de empresa en el Topbar es funcional en su UI (abre/cierra, lista, marca la activa) pero
cambiar de empresa no recalcula el dashboard todavía — se conecta en la Fase 2 cuando exista un
`PortalDataContext` real. No se crea ese contexto ahora (YAGNI): un módulo estático de datos alcanza
para esta fase.

## Fidelidad visual

- Layout, spacing, radios, sombras y colores: 1:1 con el `.dc.html` (sidebar fijo 252px, topbar
  sticky, cards con mismo padding/border/radius, badges de estado con los mismos colores semánticos).
- **Gráfico "Resumen financiero":** el diseño define 3 formas visuales (líneas de 2 series, barras
  simples, barras agrupadas de 3 series) según el toggle activo. Se implementan como SVG/divs inline
  igual que el diseño original (sin librería de charts — es simple y evita una dependencia nueva),
  las 3 vistas alternan sobre el mismo dataset mock.
- **Íconos:** el `.dc.html` deja los `path` de los SVG de íconos como placeholders vacíos (son parte
  de la plantilla del editor de diseño, no datos reales). Se usa `lucide-react` (ya es dependencia del
  proyecto), eligiendo el ícono más afín por cada sección de navegación (Dashboard, Mi Empresa,
  Financiero, Indicadores, Obligaciones, Simulador, Marketplace, Plan, Configuración).
- **Logos:** `safe-logo-dark.png` / `safe-logo-light.png` ya descargados a `src/assets/` desde el
  proyecto de diseño — el sidebar (fondo navy oscuro) usa el logo claro.

## Testing / verificación

El repo no tiene tests ni eslint configurados (no hay `vitest`, `jest`, `@testing-library`, ni
`.eslintrc*`). La verificación de esta fase sigue la misma convención que el resto del proyecto:

- `tsc -b` (vía `npm run build`) para chequeo de tipos.
- Revisión visual manual en el navegador con `npm run dev`, comparando contra el mockup importado.

## Fuera de alcance (Fase 1)

- Las 25 pantallas restantes del portal (se especifican en sus propias fases).
- Estado "sin empresa registrada" del Dashboard (banner de onboarding, tablas vacías) — Fase 2.
- Cambiar de empresa activa recalculando datos del dashboard — Fase 2+.
- Cualquier integración con backend real — este es un prototipo frontend-only.
