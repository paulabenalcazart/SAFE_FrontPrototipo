# SAFE — Paginación, perfil público y títulos por pantalla

**Fecha:** 2026-08-13
**Estado:** Aprobado por autorización del usuario para decidir e implementar sin checkpoints intermedios.

## Objetivo

Mejorar el uso del espacio en Solicitudes y citas, sustituir paginaciones extensas por un patrón convencional, completar la vista pública del profesional y asignar un título de documento específico a cada pantalla. Los cambios no alterarán animaciones, transiciones, rutas, datos mock ni flujos ya operativos.

## Alcance

### 1. Solicitudes y citas

- Mantener el orden móvil: solicitudes pendientes, próximas citas, KPI e historial.
- Conservar en escritorio la grilla de 7/5 columnas.
- Mostrar dos solicitudes pendientes por página para aproximar la altura del panel izquierdo a próximas citas más KPI y evitar el gran vacío lateral.
- Conservar búsqueda, aceptar, rechazar, detalle y deep links.
- Mantener seis filas por página en el historial.
- Usar el paginador compartido en pendientes e historial.

### 2. Paginación compartida

- Crear un helper puro que produzca números y elipsis sin renderizar todas las páginas cuando el total es alto.
- Mostrar como máximo siete tokens contando números y elipsis.
- Mantener siempre la primera página, la última página y el entorno de la actual.
- Incluir botones `Anterior` y `Siguiente`, ambos de al menos 44 px, con estado `disabled` correcto.
- Marcar la página actual con `aria-current="page"`.
- En móvil permitir que la leyenda textual se abrevie visualmente, sin quitar nombres accesibles.
- Reiniciar la página al cambiar búsqueda o filtros y limitarla si disminuye el total.

### 3. Vista pública y vista previa del profesional

- `PerfilProfesionalContenido` seguirá siendo la fuente común para Marketplace y la vista previa autenticada.
- El encabezado mantendrá identidad, descripción, especialidades, calificación, estado de disponibilidad y CTA solo en Marketplace.
- En modo vista previa no se mostrará ni el aviso superior “Vista previa. Así verán...” ni el badge “Vista previa del perfil”.
- Eliminar el bloque promocional `Credenciales`, incluyendo los textos “Perfil validado por SAFE” y “Experiencia declarada”.
- No perder información profesional: mostrar área, profesión, trabajo actual, modalidad, país, ciudad, zona horaria, tarifa, experiencia, disponibilidad, calificación y, cuando existan, número de licencia y entidad emisora.
- Añadir `Documentos públicos`:
  - CV: enlace si `cvVisible === true` y existe una URL permitida; estado explícito si está marcado como visible pero falta el archivo; indicar que no es público si `cvVisible === false`.
  - Credencial: enlace solo si existe una URL permitida; de lo contrario estado explícito.
- Admitir enlaces relativos, `http:`, `https:` y `blob:`; rechazar esquemas ejecutables o desconocidos.
- Mantener protegidos correo y teléfono: no son campos públicos del Marketplace.

### 4. Reseñas de la vista pública

- Extraer un panel enfocado y reutilizable dentro del perfil público.
- Mostrar seis reseñas por página, nunca todas a la vez.
- Filtros: calificación (todas o 1–5 estrellas) y orden (más recientes o mejor valoradas).
- Reiniciar a página 1 al cambiar filtros.
- Mostrar total filtrado, estado vacío y el paginador compartido.
- Aplicar el mismo paginador convencional a `TodasLasResenasScreen` para mantener coherencia.

### 5. Editar perfil

- Colocar inmediatamente después del encabezado un control destacado “Disponible para nuevas solicitudes”.
- El control alternará `estadoDisponibilidad` entre `DISPONIBLE` y `NO_DISPONIBLE` dentro del borrador y se persistirá con “Guardar cambios”, igual que los demás campos.
- Retirar el selector duplicado de disponibilidad de Información profesional.
- Retirar de la UI `Visible en el marketplace`; se conserva el campo interno para compatibilidad con el modelo, bajas y filtros existentes.
- Mantener el control de publicación del CV.

### 6. Perfil propio

- Retirar las etiquetas y campos “Visible en Marketplace” / “Visibilidad en marketplace”, porque para un profesional activo esa condición no aporta información accionable.
- Conservar disponibilidad como estado accionable y todos los demás datos.

### 7. Títulos de documento

- Crear un resolvedor puro por `pathname` y un componente sin UI que actualice `document.title` al navegar.
- `/` será la única ruta titulada exactamente `SAFE Ecuador`.
- Cada ruta pública y privada tendrá un título descriptivo distinto; las rutas con identificador usarán un título estable de detalle.
- Ejemplos obligatorios: `Dashboard SAFE`, `Obligaciones tributarias SAFE`, `Solicitudes y citas SAFE`, `Simulador SAFE` y `Acerca de SAFE`.
- Rutas desconocidas usarán `SAFE Ecuador` como fallback.

## Arquitectura

- `src/portal/components/Pagination.tsx`: presentación accesible del paginador.
- `src/portal/paginacion.ts`: helper puro de tokens, comprobable con `npx tsx`.
- `src/portal/marketplace/ResenasProfesionalPanel.tsx`: filtros, orden, página y cards de reseñas.
- `src/portal/marketplace/documentos.ts`: validación pura de URLs públicas.
- `src/titulos.ts`: tabla ordenada de rutas y resolvedor puro.
- `src/App.tsx`: monta el sincronizador de título; no cambia transiciones ni composición de rutas.

## Accesibilidad y responsive

- Controles interactivos de al menos 44×44 px.
- Labels visibles para filtros; `nav` con nombre accesible; `aria-current` en la página activa.
- Sin scroll horizontal de página en 390, 768, 1024 y 1440 px.
- La tabla del historial conserva su wrapper horizontal controlado en móvil.
- Orden del DOM coherente con la prioridad móvil.
- No se añadirán ni modificarán animaciones o transiciones.

## Verificación

- RED/GREEN con `npx tsx -e` para tokens de paginación, URL de documentos y títulos.
- `npm run build` después de cada bloque funcional.
- `git diff --check` y revisión de alcance tras cada commit.
- QA manual o automatizada en 390, 768, 1024 y 1440 px, incluyendo filtros, navegación de páginas, CV, disponibilidad, títulos y ausencia de overflow.
- Revisión final de consola y errores de red cuando el navegador local esté disponible.

## Fuera de alcance

- Cambiar animaciones, transiciones o CSS global de movimiento.
- Agregar backend, persistencia, carga real de archivos o dependencias.
- Cambiar reglas de acceso, autenticación, reserva, aceptación o rechazo.
- Refactorización general del repositorio.
