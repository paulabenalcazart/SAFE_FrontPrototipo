# Rediseño acotado de Colaborador y limpieza conservadora

Fecha: 2026-08-12

## Objetivo

Partir del commit estable `ec75f7a` y mejorar exclusivamente las vistas privadas de Colaborador **Perfil profesional** y **Solicitudes y citas**, además de hacer persistente el sidebar de escritorio con su parte inferior vacía para ambos roles. El trabajo incluye una auditoría técnica conservadora del frontend, sin cambios funcionales ni visuales en el resto del producto.

## Línea base Git

- `main`, `origin/main` y `dylan_cd` apuntan a `ec75f7a` al iniciar este trabajo.
- Los 18 commits locales del intento anterior se eliminan de `main`; no se modifica el remoto.
- La nueva implementación se reconstruye desde la línea base en commits pequeños.

## Límites innegociables

- No modificar `src/App.tsx`, `src/index.css`, `PortalLayout`, las vistas públicas, Marketplace ni la vista previa pública del profesional.
- No agregar, quitar ni ajustar animaciones o transiciones.
- No rediseñar diálogos/drawers de aceptar, rechazar o detalle; se conservan tal como existen en `ec75f7a`.
- No cambiar modelos de negocio, semillas, rutas, contextos ni flujos de aceptar/rechazar salvo el helper puro necesario para presentar próximas citas.
- No agregar dependencias.
- La limpieza no autoriza refactors masivos: solo se eliminan elementos rastreados y demostrablemente muertos mediante búsqueda de referencias más build limpio.

## 1. Perfil profesional

Archivo principal: `src/portal/colaborador/perfil/PerfilColaboradorScreen.tsx`.

### Composición

- Hero compacto con avatar, nombre, profesión, especialidad, calificación, disponibilidad y botones existentes `Vista previa`/`Editar perfil`.
- Franja de cuatro datos rápidos: experiencia, modalidad, tarifa referencial y ubicación.
- Grid principal `lg` de 12 columnas: contenido de 8 columnas y panel profesional de 4 columnas.
- Columna principal, en este orden: `Descripción profesional`, `Servicios ofrecidos`, `Especialidades`, `Datos de cuenta`, `Reseñas`.
- Columna derecha: `Información profesional`, con credenciales, archivos, visibilidad y disponibilidad.
- `Datos de cuenta` se ubica en la columna principal para aprovechar el espacio disponible y no generar la zona muerta observada en el diseño anterior.

### Responsive y accesibilidad

- Una columna en móvil; no se introducen anchos mínimos ni tablas horizontales para Especialidades.
- Servicios: una columna en móvil y dos desde `md`.
- Controles interactivos con mínimo 44 px, foco visible y textos de estado explícitos.
- Un único landmark `main`, provisto por `PortalLayout`; esta pantalla usa `section`/`div`.
- Se conservan todos los campos y enlaces actuales, incluyendo CV y credencial.

## 2. Solicitudes y citas

Carpeta: `src/portal/colaborador/solicitudes/`.

### Composición

- Encabezado existente y grid desktop `xl` 7/5.
- Columna izquierda: `Solicitudes pendientes`.
- Columna derecha: `Próximas citas` y, debajo, KPIs.
- `Historial de solicitudes` ocupa el ancho completo debajo.
- En móvil el orden DOM es: pendientes → próximas citas → KPIs → historial.

### Próximas citas

- Crear `ProximasCitasPanel.tsx`.
- Mostrar como máximo tres citas `CONFIRMADA` o `PROGRAMADA`, futuras respecto de `HOY_COLABORADOR_ISO`, ordenadas cronológicamente.
- Resolver empresa y servicio con los catálogos existentes.
- Enlace de reunión solo si es una URL absoluta `http:` o `https:` válida; si no, mostrar ubicación/modalidad sin enlace inseguro.
- Estado vacío claro cuando no existan citas próximas.

### Pendientes, KPIs e historial

- Mantener búsqueda, filtros, paginación, deep links y handlers actuales.
- Mejorar jerarquía, densidad y copy; tarjetas con acciones claras y objetivos táctiles de 44 px.
- Pendientes: 3 por página, con controles accesibles.
- Historial: 6 por página; conserva tabla responsive con ancho mínimo 560 px dentro de un contenedor `overflow-x-auto` porque es información tabular real.
- La búsqueda vacía ofrece `Limpiar búsqueda`, reinicia consulta y página.
- No se altera el estado en memoria ni el comportamiento de los overlays.

## 3. Sidebar

Archivo: `src/portal/components/Sidebar.tsx`.

- Solo escritorio (`lg`).
- `sticky top-0`, altura `100vh`/`100dvh` y `overflow-hidden`; permanece visible mientras el contenido principal se desplaza.
- Logo y navegación conservan rutas, iconos y estados.
- No se permite scroll interno.
- Se elimina por completo el footer inferior: no plan, renovación, tarjeta de usuario ni identidad para Empresa o Colaborador. El espacio inferior queda vacío.
- No se crea un componente auxiliar de tarjeta de usuario.

## 4. Limpieza conservadora

La auditoría cubre archivos rastreados, imports, exports, assets y dependencias declaradas. Un elemento solo se elimina si se cumplen todos estos criterios:

1. No tiene referencias estáticas ni de configuración.
2. No es una entrada convencional de Vite/Tailwind ni un asset servido desde `public`.
3. Su eliminación no exige cambiar comportamiento, rutas o diseño.
4. `npm run build` permanece limpio después de eliminarlo.

No se implementará lazy loading, división de chunks, cambios de bundler ni reorganización global en este trabajo: aunque podrían reducir el warning de bundle, tocarían `App.tsx` y ampliarían el riesgo más allá del alcance aprobado.

## 5. Verificación

- RED/GREEN mediante contratos estáticos y scripts `npx tsx -e` para el helper puro de citas.
- `npm run build` después de Perfil, Solicitudes/sidebar y limpieza.
- `git diff --check` y auditoría de archivos tocados.
- QA responsive en 390×844, 768×1024, 1024×768 y 1440×900.
- Recorrido Colaborador: Perfil, pendientes, próxima cita, filtros, paginación, detalle, aceptar y rechazar.
- Regresión Empresa: sidebar visible, navegación intacta y parte inferior vacía.
- Confirmar que `App.tsx` e `index.css` permanecen byte a byte iguales a `ec75f7a`.

## Fuera de alcance

- Vista previa del profesional y Marketplace.
- Paginación de reseñas públicas.
- Animaciones/transiciones.
- Optimización estructural del bundle.
- Nuevos tests runners, linting, backend o persistencia.
