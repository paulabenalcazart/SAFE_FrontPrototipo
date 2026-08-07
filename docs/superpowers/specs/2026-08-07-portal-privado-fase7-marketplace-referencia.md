# Portal Privado — Fase 7 (Marketplace): material de referencia para arrancar

Fecha: 2026-08-07

> Este documento **no es un spec** — es el material crudo (mockup + esquema SQL) que ya se extrajo del
> proyecto de diseño mientras se investigaba la Fase 3 (Financiero), para que quien tome la Fase 7 no tenga
> que releer todo el diseño desde cero. El primer paso real sigue siendo correr el ciclo normal
> **brainstorming → spec → plan** (skills `superpowers:brainstorming` y `superpowers:writing-plans`) sobre
> este material, igual que se hizo para las Fases 1-3.

## Contexto

Roadmap general: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero (en curso, rama
`dylan/fase-3-financiero`) · 4. Indicadores · 5. Obligaciones tributarias · 6. Simulador ·
**7. Marketplace (esta fase)** · 8. Plan y suscripción · 9. Configuración + tutoriales.

La Fase 7 se eligió para avanzar en paralelo a la Fase 3 porque es la única fase restante sin ningún
acoplamiento a `registro_financiero` ni al motor de cálculo de la Fase 3 — dominio completamente aparte
(colaboradores/profesionales, no datos financieros de la empresa). Rama sugerida: `paula/fase-7-marketplace`,
creada desde `main` sin dependencias de la rama de Fase 3.

Fuente de diseño: mismo proyecto de Claude Design que las fases anteriores
(`https://claude.ai/design/p/176601a0-5331-452b-a1ac-dc590a7fa146`), archivo `SAFE Portal Privado.dc.html`.
Dos pantallas relevantes (`data-screen-label="Marketplace"` y `data-screen-label="Perfil de profesional"`) más
un modal (`modalReserva`) — resumidos abajo. **El motor de diseño solo se leyó una vez, en esta sesión de
Dylan; para verlo con el detalle completo (estilos exactos, columnas responsive, etc.) hace falta acceso al
mismo proyecto de Claude Design vía `/design-login` y el MCP `claude_design`.**

## Pantalla 1: Marketplace (`data-screen-label="Marketplace"`)

- Buscador de texto libre + fila de filtros dinámicos (`mktFiltros`, cada uno un `<select>` — ej.
  especialidad, modalidad, tarifa) con botón "Limpiar filtros".
- Carrusel "Profesionales destacados" (`mktDestacados`, 3 placeholder): tarjeta compacta con iniciales,
  nombre, especialidad, calificación + reseñas, botón "Ver".
- Grid "Profesionales disponibles" (`mktGrid`, 6 placeholder) con selector "Ordenar por" y contador de
  resultados. Cada tarjeta: iniciales, nombre, profesión + ubicación, chips de especialidades, años de
  experiencia + calificación, descripción (clamped a 3 líneas), tarifa + modalidad, botones "Ver perfil" /
  "Reservar" (este último con candado si está bloqueado por plan — mismo patrón que otras fases).
- Estado vacío (`mktVacio`) y paginación (`mktPags`).

## Pantalla 2: Perfil de profesional (`data-screen-label="Perfil de profesional"`)

- Header: iniciales grandes, nombre, descripción, chips de especialidades, botón "Reservar servicio".
- Sección "Información profesional": grid de pares label/valor (`mktPerfilCampos`, 10 placeholder —
  candidatos: profesión, modalidad de atención, país/ciudad, zona horaria, años de experiencia, tarifa
  referencial) + una nota de contacto (`mktPerfilContacto`).
- "Servicios" (`mktPerfilServicios`, 3): nombre, descripción, meta (duración/tarifa).
- "Horarios de disponibilidad" (`mktPerfilHorarios`, 5): día → rango horario.
- "Credenciales" (`mktPerfilCredenciales`, 2): título + entidad emisora, con ícono de check.
- "Reseñas" (`mktPerfilResenas`, 3): autor, estrellas, comentario, fecha.

## Modal "Reservar con {profesional}" (`modalReserva`)

Wizard corto de 3 pasos dentro de un modal (`reservaPasos`):

1. **Elegir servicio** (`reservaEs1`): lista de botones seleccionables (`reservaServicios`) con nombre,
   descripción y meta (duración/tarifa) de cada `servicio_profesional`.
2. **Elegir fecha y hora** (`reservaEs2`): chips de días disponibles (`reservaDias`), chips de horas
   disponibles (`reservaHoras`, algunas pueden verse atenuadas/ocupadas vía `h.op`), nota de zona horaria
   (`reservaZona`), y un textarea "Describe tu necesidad" (`reservaNota`).
3. **Confirmar** — el mockup se cortó en la lectura antes de este paso; al abrir el proyecto de diseño de
   nuevo, revisar el resto de `modalReserva` (después de `reservaNota` en el archivo) para ver el resumen
   final y el botón de confirmación exactos.

## Modelo de datos (de `SAFE_dump.sql`, mismo proyecto de diseño, archivo `uploads/SAFE_dump (1).sql`)

Tablas relevantes para esta fase (con sus campos principales):

- **`postulacion_profesional`**: formulario de postulación de un profesional nuevo (nombres, apellidos,
  correo, teléfono, país/ciudad, área de especialización, CV, licencia/entidad emisora, descripción,
  `modalidad_atencion_enum`, tarifa referencial, días/horas disponibles, `estado` PENDIENTE/EN_REVISION/
  APROBADA/RECHAZADA). **Fuera de alcance de esta fase** — es el flujo de alta de un profesional nuevo
  (probablemente parte de "Trabaja con SAFE" en el sitio público, no del portal privado); no hay pantalla
  para esto en el mockup del portal.
  - Nota: en `src/components/TrabajaConSafePage.tsx` y `PostulacionPage.tsx` (sitio público, ya existentes)
    puede que ya exista algo relacionado — revisar antes de asumir que se construye desde cero.
- **`colaborador`**: el profesional ya aprobado y visible en el marketplace — profesión, descripción,
  modalidad de atención, país/ciudad, zona horaria (default `America/Guayaquil`), tarifa referencial, años
  de experiencia, foto de perfil, `estado_disponibilidad` (DISPONIBLE/NO_DISPONIBLE), `visible_marketplace`,
  `estado` (ACTIVO/SUSPENDIDO/INACTIVO). Esta es la entidad central de ambas pantallas.
- **`especialidad_profesional`** + **`colaborador_especialidad`** (tabla puente): catálogo de especialidades
  (código, nombre, categoría) y cuáles tiene cada colaborador, con `es_principal` y años de experiencia.
- **`servicio_profesional`**: los servicios que ofrece un colaborador (nombre, descripción, duración
  estimada en minutos, tarifa referencial en USD, modalidad) — alimenta la sección "Servicios" del perfil y
  el paso 1 del modal de reserva.
- **`horario_disponibilidad`**: franjas semanales de un colaborador (día 1-7, hora inicio/fin, modalidad) —
  alimenta "Horarios de disponibilidad" del perfil.
- **`solicitud_contacto`**: lo que genera el modal de reserva — empresa, colaborador, servicio, fecha/hora
  preferida, descripción, `estado` (PENDIENTE_PAGO/PAGADA/ENVIADA/ACEPTADA/RECHAZADA/CONTACTO_LIBERADO/
  FINALIZADA). El flujo de pago real (`PENDIENTE_PAGO`→`PAGADA`) depende de la Fase 8 (Plan y suscripción) —
  para esta fase probablemente baste simular la solicitud quedando en `ENVIADA` sin cobro real, a decidir en
  el brainstorming.
- **`cita`**: la cita ya confirmada a partir de una `solicitud_contacto` (fecha/hora inicio-fin, modalidad,
  enlace de reunión o ubicación, estado PROGRAMADA/CONFIRMADA/COMPLETADA/CANCELADA). El mockup no muestra una
  pantalla de "mis citas" explícita en las 26 pantallas originales — confirmar si hace falta o si queda fuera
  de alcance.
- **`resena_colaborador`**: reseña 1-5 estrellas + comentario, ligada 1:1 a una `solicitud_contacto` —
  alimenta la sección "Reseñas" del perfil.

## Sugerencia de arranque para Paula

En una sesión de Claude Code sobre este mismo repo (rama `paula/fase-7-marketplace` creada desde `main`):

> "Quiero implementar la Fase 7 (Marketplace) del portal privado de SAFE. Lee
> `docs/superpowers/specs/2026-08-07-portal-privado-fase7-marketplace-referencia.md` para el contexto ya
> reunido (mockup + modelo de datos), y sigue el flujo brainstorming → spec → plan como en las Fases 1-3
> (`docs/superpowers/specs/` y `docs/superpowers/plans/` tienen los precedentes). Voy a necesitar acceso al
> proyecto de Claude Design (`https://claude.ai/design/p/176601a0-5331-452b-a1ac-dc590a7fa146`) para leer el
> detalle exacto del modal de reserva y las pantallas — ayúdame a confirmar que tengo acceso antes de
> continuar."

Puntos a decidir en su brainstorming (no resueltos aquí a propósito, son su alcance):

- Si el modal de reserva "cobra" de verdad simulando la Fase 8, o si la solicitud queda simplemente en
  `ENVIADA` sin tocar pagos.
- Si se construye una pantalla de postulación de profesional nuevo en esta fase o se confirma que ya existe
  en el sitio público y queda fuera de alcance.
- Cuántos colaboradores/servicios/reseñas mock sembrar para que el marketplace se vea poblado.
