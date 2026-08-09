# Portal Privado — Fase 7: Marketplace

Fecha: 2026-08-09

## Contexto

Las Fases 1–6 del portal privado ya están implementadas en la rama `dylan_cd`. Esta fase construye el
**Marketplace de profesionales**: un catálogo navegable, el perfil detallado de cada profesional y un
wizard para enviar una solicitud de contacto desde la empresa activa.

SAFE sigue siendo un **prototipo de alta fidelidad, solo frontend**: no hay API ni backend real y todo el
estado mutable vive en memoria de React. La postulación de profesionales ya existe en el sitio público
(`/trabaja-con-safe` y `/postulacion`) y no se duplica dentro del portal.

Roadmap: 1. Shell + Dashboard ✅ · 2. Mi Empresa ✅ · 3. Financiero ✅ · 4. Indicadores ✅ ·
5. Obligaciones tributarias ✅ · 6. Simulador ✅ · **7. Marketplace (esta fase)** ·
8. Plan y suscripción · 9. Configuración + tutoriales.

### Fuente de diseño

- Mockup local `SAFE Portal Privado.dc.html`, pantalla Marketplace (líneas 1937–2044), perfil de
  profesional (2048–2142), modal de reserva completo (2812–2922), catálogo/lógica (4542–4664) y lógica
  del modal (4904–5019).
- Documento crudo
  `docs/superpowers/specs/2026-08-07-portal-privado-fase7-marketplace-referencia.md`.
- Dump local `SAFE_dump.sql`, tablas `postulacion_profesional`, `colaborador`,
  `especialidad_profesional`, `colaborador_especialidad`, `servicio_profesional`,
  `horario_disponibilidad`, `solicitud_contacto`, `cita` y `resena_colaborador`; enum
  `modalidad_atencion_enum` (`VIRTUAL`, `PRESENCIAL`, `AMBAS`).

El HTML completo reveló que su paso 3 original sí simulaba tarjeta, comisión SAFE y la transición
`PENDIENTE_PAGO → PAGADA → ENVIADA`. Esa parte se recorta deliberadamente porque pertenece a Fase 8 y
contradice el alcance aprobado para esta fase.

## Enfoques considerados

1. **Dominio separado y alineado al SQL (elegido)**: catálogo global estático, funciones puras para
   consultar/ordenar/generar agenda y contexto React únicamente para solicitudes por empresa.
2. **Objetos completamente anidados por profesional**: menos búsquedas entre colecciones, pero duplica
   especialidades y mezcla catálogo, agenda y reseñas en un objeto difícil de mantener.
3. **Datos y lógica dentro de cada pantalla**: menor coste inicial, pero rompe el patrón de Fases 1–6,
   dificulta verificar funciones puras y hace imposible compartir el flujo listado/perfil/modal sin
   duplicación.

Se elige el primero por fidelidad al modelo, aislamiento de responsabilidades y facilidad de revisión.

## Decisiones de arquitectura

### Catálogo global; solo las solicitudes pertenecen a una empresa

En SQL, `colaborador`, sus especialidades, servicios, horarios y reseñas forman un catálogo global. Solo
`solicitud_contacto` contiene `empresa_id`. Por lo tanto:

- `marketplace/catalogo.ts` exporta profesionales, especialidades, servicios, horarios, reseñas recientes
  y bloqueos de agenda estáticos.
- `mock-portal-data.ts` exporta `solicitudesContactoSemilla: Record<string, SolicitudContacto[]>`, con
  entradas vacías para `emp-1` y `emp-2`.
- `PortalDataContext` mantiene `solicitudesContacto` y expone una única mutación
  `enviarSolicitudContacto(empresaId, nueva)`.

No se duplica el catálogo por `empresaId`: cambiar de empresa conserva los mismos resultados y perfiles,
pero una nueva solicitud se guarda exclusivamente bajo la empresa que estaba activa al enviarla.

### Doce profesionales y una muestra reciente de reseñas

Se conservan los 12 profesionales del mockup para que la paginación de 6 resultados produzca dos páginas
reales. Se preservan nombres, profesión, ciudad, modalidad, experiencia, tarifa, calificación agregada y
cantidad histórica de reseñas; se corrigen los contenidos genéricos del HTML:

| # | Profesional | Área principal | Modalidad | Ciudad | Tarifa/h |
|---|---|---|---|---|---:|
| 1 | María José Ramírez Alvear | Tributario | VIRTUAL | Guayaquil | 35 |
| 2 | Felipe Andrade Cordero | Laboral | AMBAS | Quito | 45 |
| 3 | Camila Torres Benítez | Finanzas | VIRTUAL | Cuenca | 30 |
| 4 | Andrés Muñoz Salcedo | Societario | PRESENCIAL | Guayaquil | 28 |
| 5 | Valentina Silva Erazo | Contabilidad | AMBAS | Manta | 33 |
| 6 | Diego Pérez Villamar | Remuneraciones | VIRTUAL | Guayaquil | 27 |
| 7 | Paula Benalcázar Ruiz | Tributario | AMBAS | Quito | 42 |
| 8 | Sebastián Vera Loor | Costos | VIRTUAL | Portoviejo | 24 |
| 9 | Gabriela Mendoza Cruz | Laboral | PRESENCIAL | Cuenca | 40 |
| 10 | Joaquín Herrera Peña | NIIF | AMBAS | Guayaquil | 48 |
| 11 | Lucía Cabrera Zamora | Financiamiento | VIRTUAL | Loja | 38 |
| 12 | Mateo Ibarra Nieto | Fiscalización | AMBAS | Ambato | 31 |

Cada profesional tiene exactamente 3 servicios coherentes con su dominio, horarios semanales y 1–3
reseñas recientes visibles. `calificacionPromedio` y `cantidadResenas` representan el agregado histórico
que en backend devolvería `vw_calificacion_colaborador`; las 1–3 reseñas sembradas son solo la muestra
reciente de la pantalla, no el universo usado para ese agregado.

El mockup repetía servicios tributarios, reseñas y credenciales jurídicas para todos. Esta fase los
personaliza: un asesor laboral no recibe servicios tributarios ni una credencial del Foro de Abogados.
La sección Credenciales usa los campos que sí existen o pueden derivarse del dump (`profesion`,
`numeroLicencia`, `entidadEmisora`, `trabajoActual`), sin inventar una tabla de credenciales múltiples.

### Destacados derivados, no un flag inexistente

SQL no tiene `destacado`. Los diez candidatos del carrusel se derivan ordenando profesionales visibles,
activos y disponibles por:

1. `calificacionPromedio` descendente;
2. `cantidadResenas` descendente;
3. nombre completo ascendente como desempate estable.

El carrusel muestra 3 tarjetas en desktop, 2 en tablet y 1 en móvil. Las flechas avanzan una posición y
quedan realmente `disabled` en los extremos; un listener de `matchMedia` actualiza el número visible y
reajusta el índice al cambiar de breakpoint.

### Sin gating por plan en Fase 7

El HTML condicionaba el candado al modo sin empresa (`tour`), mientras otras piezas del mockup sugerían
que Marketplace no estaba incluido en Plan Esencial. El repo todavía no implementa el dominio de Plan y
suscripción y ambas empresas semilla tienen una empresa activa válida. Para evitar adelantar Fase 8:

- ambas empresas pueden navegar, ver perfiles y enviar solicitudes;
- no se consulta `planInfo` ni se crea un límite `CONTACTOS_MENSUALES`;
- no aparece candado ni CTA para cambiar de plan.

Fase 8 podrá envolver `enviarSolicitudContacto` con sus propias reglas sin cambiar el catálogo.

### Una solicitud no es un pago ni una cita

El wizard crea `SolicitudContacto` directamente con estado literal `ENVIADA`. No crea `Pago`,
`MetodoPago` ni `Cita`, y no simula las transiciones `PENDIENTE_PAGO`/`PAGADA`. La fecha y hora son una
**preferencia solicitada**, no una cita confirmada. El mensaje final debe decir que la solicitud fue
enviada y que el profesional podrá responder; nunca “pago confirmado” ni “cita confirmada”.

El contacto del profesional continúa oculto. La nota del perfil se adapta a: “Tus datos de contacto se
mantienen protegidos; SAFE facilitará el contacto cuando el profesional acepte la solicitud”.

### Fecha ficticia única y agenda determinista

`marketplace/calculo.ts` exporta:

```ts
export const HOY_MARKETPLACE = '2026-08-13'
export const AHORA_MARKETPLACE = `${HOY_MARKETPLACE}T12:00:00-05:00`
```

Estas son las únicas referencias temporales fijas del módulo. Las cinco fechas ofrecidas se calculan
**después** de `HOY_MARKETPLACE` (la primera posible es 2026-08-14), para el **servicio seleccionado** y
con una búsqueda máxima de 30 días. Solo entra una fecha si contiene al menos un slot compatible donde el
servicio cabe completo y que no está bloqueado. Si en ese rango existen menos de cinco fechas, se
devuelven solo las encontradas. El cálculo usa fechas UTC para evitar que `America/Guayaquil` cambie el
día por parsing de `YYYY-MM-DD`.

Para un servicio y fecha seleccionados:

1. se obtienen las franjas del día compatibles con su modalidad;
2. se generan inicios incrementando por la duración del servicio;
3. solo se incluye un inicio si `inicio + duración <= fin`;
4. un slot cuyo intervalo se solape con un bloqueo estático se muestra atenuado y con
   `disabled`/`aria-disabled`.

Los bloqueos son fixtures de presentación que representan ocupaciones previas; no crean ni exponen el
dominio `Cita`. Su forma local en `catalogo.ts` es
`{ colaboradorId, fecha, horaInicio, horaFin }`; no se añade a `portal/types.ts`. No se muestran horarios
pasados.

Los 36 servicios sembrados tienen modalidad concreta `VIRTUAL` o `PRESENCIAL`; `AMBAS` describe al
profesional o una franja que admite cualquiera de las dos, pero no deja ambiguo cómo se prestará un
servicio. La matriz de agenda es:

- servicio VIRTUAL → horario VIRTUAL o AMBAS;
- servicio PRESENCIAL → horario PRESENCIAL o AMBAS;
- un horario de modalidad SQL `NULL` se normaliza a AMBAS al construir la proyección frontend.

La modalidad resumida se deriva siempre del servicio. `SolicitudContacto` no la duplica porque
`servicioId` ya la determina.

## Modelo de datos

`src/portal/types.ts` gana tipos mínimos recortados para lo que renderiza o muta esta fase:

```ts
export type ModalidadAtencion = 'VIRTUAL' | 'PRESENCIAL' | 'AMBAS'

export type EspecialidadProfesional = {
  id: string
  codigo: string
  nombre: string
  categoria: string
}

export type ColaboradorMarketplace = {
  id: string
  nombres: string
  apellidos: string
  areaEspecializacion: string
  profesion: string
  trabajoActual?: string
  numeroLicencia?: string
  entidadEmisora?: string
  descripcionProfesional: string
  modalidadAtencion: ModalidadAtencion
  paisAtencion: string
  ciudadAtencion: string
  zonaHoraria: string
  tarifaReferencial: number
  aniosExperiencia: number
  cvVisible: boolean
  estadoDisponibilidad: 'DISPONIBLE' | 'NO_DISPONIBLE'
  visibleMarketplace: boolean
  estado: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO'
  especialidadIds: string[]
  especialidadPrincipalId: string
  calificacionPromedio: number
  cantidadResenas: number
}

export type ServicioProfesional = {
  id: string
  colaboradorId: string
  nombre: string
  descripcion: string
  duracionEstimadaMinutos: number
  tarifaReferencial: number
  modalidad: Exclude<ModalidadAtencion, 'AMBAS'>
  activo: boolean
}

export type HorarioDisponibilidad = {
  id: string
  colaboradorId: string
  diaSemana: 1 | 2 | 3 | 4 | 5 | 6 | 7 // lunes = 1
  horaInicio: string // HH:mm
  horaFin: string   // HH:mm
  modalidad: ModalidadAtencion
  activo: boolean
}

export type ResenaColaborador = {
  id: string
  colaboradorId: string // proyección del join solicitud → colaborador
  autorEmpresa: string  // proyección del join solicitud → empresa
  calificacion: 1 | 2 | 3 | 4 | 5
  comentario: string
  fecha: string // YYYY-MM-DD
  estado: 'PUBLICADA' | 'OCULTA'
}

export type SolicitudContacto = {
  id: string
  colaboradorId: string
  servicioId: string
  fechaPreferida: string // YYYY-MM-DD
  horaPreferida: string  // HH:mm
  descripcion: string
  estado: 'ENVIADA'
  createdAt: string // ISO datetime fijo del prototipo
}

export type NuevaSolicitudContacto = Omit<SolicitudContacto, 'id' | 'estado' | 'createdAt'>
```

Campos del dump recortados porque la UI no los consume: IDs de usuario/postulación, URLs de CV/foto y
credencial, timestamps del catálogo, `approved_at`, `motivo_rechazo`, `fecha_respuesta`,
`contacto_liberado_at` y todos los campos de `cita`/pago. Los avatares usan iniciales, como el mockup, por
lo que `fotoPerfilUrl` tampoco entra en el tipo.

`ResenaColaborador` añade `colaboradorId` y `autorEmpresa` como read model explícito: en SQL se derivan de
`resena_colaborador → solicitud_contacto → colaborador/empresa`; no se afirma que sean columnas reales.

La semilla debe cumplir estas invariantes, verificadas con script puntual: IDs únicos; toda referencia a
colaborador/especialidad/servicio existe; los 12 profesionales son visibles, activos y disponibles;
`especialidadPrincipalId` pertenece a `especialidadIds`; `areaEspecializacion` coincide con el nombre de
esa especialidad principal; cada profesional tiene exactamente una principal, tres servicios activos de
modalidad concreta, al menos una franja semanal y entre una y tres reseñas recientes; horas y duraciones
son válidas; tarifas y experiencia son números finitos no negativos; `calificacionPromedio` está entre 1
y 5 y `cantidadResenas` es mayor o igual que la cantidad de reseñas `PUBLICADA` sembradas.

`PortalDataContext` gana:

```ts
solicitudesContacto: Record<string, SolicitudContacto[]>
enviarSolicitudContacto: (
  empresaId: string,
  nueva: NuevaSolicitudContacto,
) => SolicitudContacto | null
```

La clave del `Record` es la única fuente de verdad de empresa; `SolicitudContacto` no repite
`empresaId`. La mutación valida que el servicio exista, esté activo y pertenezca al colaborador, crea
internamente `id`, `estado: 'ENVIADA'` y `createdAt: AHORA_MARKETPLACE`, e inserta la solicitud al inicio
de la lista de la empresa. Si falla la integridad devuelve `null` y no muta. No hay actualizar, cancelar,
aceptar, rechazar ni finalizar porque no existe pantalla de historial/gestión en el mockup.

## Lógica pura (`marketplace/calculo.ts`)

Las pantallas no implementan filtros ni cálculos de fechas inline. Se exportan funciones puras para:

- filtrar el catálogo por visibilidad/estado/disponibilidad;
- buscar sin distinguir mayúsculas ni tildes por nombre, profesión, área, descripción, ciudad y
  especialidades;
- filtrar por especialidad, tarifa máxima, calificación mínima y modalidad;
- tratar el filtro VIRTUAL como VIRTUAL/AMBAS, PRESENCIAL como PRESENCIAL/AMBAS y AMBAS como coincidencia
  exacta de profesionales mixtos;
- ordenar por relevancia, mejor calificación, más reseñas, menor precio o mayor experiencia sin mutar el
  arreglo fuente;
- paginar de a 6 y devolver `total`, `totalPaginas` y `pagina` ajustada; con cero resultados no se dibuja
  una página “1” fantasma;
- derivar destacados;
- calcular próximas fechas y slots disponibles/ocupados;
- calcular iniciales de nombres compuestos.

“Relevancia” queda definida así: con búsqueda vacía ordena por calificación, cantidad de reseñas y nombre;
con texto asigna prioridad 3 a coincidencia exacta del nombre completo, 2 a coincidencia parcial en el
nombre, 1 a coincidencia en profesión/área/especialidad y 0 a coincidencia en descripción/ciudad; dentro
de la misma prioridad desempata por calificación, reseñas y nombre. Los otros cuatro órdenes usan su clave
nominal y nombre como desempate estable.

Los filtros regresan a página 1 cuando cambia búsqueda, especialidad, precio, calificación o modalidad.
“Limpiar filtros” reinicia búsqueda, los cuatro filtros, orden a Relevancia y página 1. Cambiar solo el
orden conserva la página si sigue siendo válida.

## Rutas, pantallas y componentes

Todo vive bajo `src/portal/marketplace/`.

### 1. Marketplace (`MarketplaceScreen.tsx`, `/app/marketplace`)

- Título/subtítulo del mockup.
- Tarjeta de búsqueda con input y cuatro selects: especialidad, precio máximo, calificación mínima y
  modalidad; botón “Limpiar filtros”.
- `DestacadosCarousel`: top diez derivados, tarjetas compactas y flechas accesibles.
- “Profesionales disponibles”: contador, orden y grid de 3/2/1 columnas.
- `ProfesionalCard`: iniciales, nombre, profesión/ubicación, chips de especialidades, experiencia,
  calificación histórica, descripción limitada a tres líneas, tarifa/modalidad y CTAs “Ver perfil” y
  “Solicitar contacto”.
- Estado vacío sin paginación y CTA “Limpiar filtros”.
- Paginación de 6 resultados con `aria-current="page"`, visible solo cuando `totalPaginas > 1`.

Los enlaces ya existentes desde Indicadores y Obligaciones continúan navegando a `/app/marketplace` sin
query params. Prefiltrar “Tributario” exigiría modificar contratos de Fases 4/5 y queda fuera de alcance.

### 2. Perfil (`PerfilProfesionalScreen.tsx`, `/app/marketplace/:id`)

- Volver a Marketplace.
- Header con iniciales, nombre, descripción, especialidades y CTA “Solicitar contacto”.
- Información profesional: área, profesión, trabajo actual, modalidad, país, ciudad, zona horaria,
  tarifa, experiencia, disponibilidad, calificación y estado informativo del CV (sin descarga en esta
  fase).
- Servicios específicos del profesional.
- Horarios semanales agrupados por día.
- Credenciales coherentes con regla fija: siempre “Perfil validado por SAFE · {profesión}”; si existen
  `numeroLicencia` y `entidadEmisora`, una segunda fila “Licencia {número} · {entidad}”; si no existen pero
  hay `trabajoActual`, la segunda fila es “Experiencia declarada · {trabajoActual}”. No se renderizan
  valores vacíos.
- 1–3 reseñas recientes `PUBLICADA`; `OCULTA` nunca se renderiza.
- ID inexistente: “Profesional no encontrado”. Profesional inactivo, oculto o `NO_DISPONIBLE` visitado
  por URL: “Profesional no disponible”. Ambos estados muestran botón para volver; nunca una pantalla
  vacía ni error de runtime.

### 3. Solicitud (`ReservaModal.tsx`)

El nombre de archivo conserva “Reserva” para corresponder al `modalReserva` del mockup, pero todo el copy
visible usa **solicitud** y aclara que fecha/hora son preferidas.

Wizard de tres pasos más éxito:

1. **Servicio**: tres opciones del profesional; la primera queda seleccionada al abrir. Cada opción
   muestra descripción, duración, tarifa y modalidad.
2. **Fecha y hora**: cinco fechas calculadas, slots del servicio y textarea obligatorio “Describe tu
   necesidad” (`maxLength=500`). Al entrar se selecciona la primera fecha disponible y ninguna hora; si
   no hay fechas, se muestra el estado sin disponibilidad. Fecha, hora y descripción recortada no vacía
   son requisitos. Cambiar la fecha limpia la hora; cambiar el servicio después de volver limpia fecha y
   hora, recalcula fechas y selecciona la primera nueva, pero conserva la descripción. El error aparece
   solo tras intentar continuar, no al entrar al paso, y usa textos separados para fecha, hora y
   descripción.
3. **Confirmar**: resumen de empresa activa, profesional, servicio, fecha, hora GMT-5, duración,
   modalidad, tarifa y necesidad. No hay comisión, neto, total adicional ni método de pago. CTA “Enviar
   solicitud”.
4. **Éxito no numerado**: mensaje “Solicitud enviada al profesional”, chip `ENVIADA`, el mismo resumen
   con la empresa que originó el envío y botón “Cerrar”.

Al enviar se llama al contexto con `NuevaSolicitudContacto` y el `empresaActiva.id` capturado en ese
momento. El contexto crea `crypto.randomUUID()`, `estado: 'ENVIADA'` y
`createdAt: AHORA_MARKETPLACE`. Un guard síncrono `useRef` impide el doble envío antes del rerender y un
estado visual deshabilita el botón. Si el contexto devuelve `null`, el modal permanece en Confirmar y
muestra “No pudimos enviar la solicitud. Vuelve a elegir el servicio e inténtalo otra vez”.

Cerrar por X, Cancelar, overlay o Escape descarta el draft y reinicia el wizard. Cambiar de empresa con el
modal abierto también lo cierra y resetea, evitando guardar una selección iniciada bajo otra empresa.

### Accesibilidad del modal

No se agrega una dependencia Dialog. El modal propio implementa:

- `role="dialog"`, `aria-modal="true"`, `aria-labelledby`;
- foco inicial al título del diálogo (`tabIndex=-1`), trampa de Tab, Escape para cerrar y restauración del
  foco al elemento que lo abrió;
- bloqueo temporal del scroll de `document.body`;
- botones ocupados realmente `disabled`, no handlers vacíos;
- errores con `role="alert"` y vínculo `aria-describedby`;
- botón X con nombre accesible.

El paso activo lleva `aria-current="step"`; al cambiar de paso se enfoca su encabezado. Una validación
fallida enfoca el primer grupo inválido y lo enlaza con `aria-describedby`. El éxito usa
`role="status" aria-live="polite"`, oculta el stepper y enfoca el encabezado de confirmación.

## Formato, estilo y responsive

- Reutilizar `formatUSD` de `financiero/formato.ts` y `formatFecha`/`capitalizar` de
  `obligaciones/formato.ts`.
- `marketplace/formato.ts` solo añade mapeos propios (`VIRTUAL → Virtual`, `PRESENCIAL → Presencial`,
  `AMBAS → Mixta`) y formato de horarios/estrellas; no duplica moneda/fecha.
- Usar los tokens actuales (`surface-card`, `border-line`, `bg-card`, `bg-surface`, navy para acciones y
  emerald solo para éxito). No se añaden colores decorativos ni dependencias.
- Targets interactivos de al menos 40–44 px, focus visible, texto no menor a 11 px y contraste del sistema.
- Desktop ≥1024: destacados/grid en 3 columnas, filtros en 4, información/reseñas en 3 y cuerpo del perfil
  en dos columnas. Tablet ≥768: destacados/grid/filtros/información en 2 y secciones del perfil apiladas.
  Móvil: una columna, header del perfil vertical, filtros/acciones a ancho completo y modal de ancho
  disponible con margen de 8 px. El diálogo usa `max-w-[560px] max-h-[88vh]`, cuerpo con scroll interno y
  footer sticky para que las acciones sigan alcanzables.
- Se conservan iniciales en lugar de inventar fotografías. No hace falta generar assets raster.

## Manejo de estados y errores

- Cero coincidencias: estado vacío + limpiar filtros; sin paginación.
- Profesional inexistente: “Profesional no encontrado”; inactivo, oculto o no disponible: “Profesional
  no disponible”.
- Profesional sin servicios activos: CTA deshabilitado y mensaje; el modal no abre.
- Sin fechas o slots disponibles: mensaje explícito y no se puede avanzar.
- Slot ocupado: visible pero `disabled`.
- Descripción vacía: error al intentar avanzar.
- Cambiar fecha invalida y limpia la hora anterior; nunca se envía un slot ajeno a la fecha activa.
- Cambio de servicio después de escoger fecha/hora: reinicia fecha y hora porque cambia la duración y la
  validez de slots; conserva la descripción.
- Cierre o cambio de empresa: descarta todo el draft.
- Toda mutación es en memoria; recargar la página restaura la semilla.

## Estructura de archivos

```text
src/
├── App.tsx                                      # rutas Marketplace y perfil
└── portal/
    ├── types.ts                                 # tipos del dominio
    ├── PortalDataContext.tsx                    # solicitudes por empresa + mutación
    ├── data/mock-portal-data.ts                 # solicitudesContactoSemilla
    └── marketplace/
        ├── catalogo.ts                          # catálogo global y fixtures de agenda
        ├── calculo.ts                           # filtros, orden, paginación y slots
        ├── formato.ts                           # labels propios del dominio
        ├── DestacadosCarousel.tsx
        ├── ProfesionalCard.tsx
        ├── ReservaModal.tsx
        ├── MarketplaceScreen.tsx
        └── PerfilProfesionalScreen.tsx
```

No se modifica Sidebar: `navItems` ya contiene Marketplace. No se modifica el sitio público de
postulación.

## Alcance recortado deliberadamente

- Sin simulación de cobro, comisión, tarjeta, método de pago ni transición `PENDIENTE_PAGO/PAGADA`.
- Sin cita confirmada, calendario de citas, historial de solicitudes o gestión del profesional.
- Sin gating por plan, límites mensuales ni CTA de upgrade (Fase 8).
- Sin nueva postulación ni cambios a `/trabaja-con-safe`/`/postulacion`.
- Sin prefiltrado desde Indicadores/Obligaciones.
- Sin motor de disponibilidad en tiempo real, API, zona horaria múltiple o sincronización de calendario.
- Sin fotografías ni uploads; se usan iniciales.
- Sin localStorage ni persistencia al recargar.

## Verificación

### Funciones puras (`npx tsx -e`)

- búsqueda sin tildes/mayúsculas;
- cada filtro y combinaciones;
- compatibilidad de modalidad `AMBAS`;
- los cinco órdenes y estabilidad;
- paginación 12→2 páginas, cero resultados→cero páginas y clamp de página;
- ranking de destacados;
- fechas posteriores a `HOY_MARKETPLACE`, condicionadas al servicio, con al menos un slot seleccionable,
  límite de búsqueda y sin fechas pasadas;
- slots respetan duración, fin de franja, modalidad y bloqueos.

### Navegador

- `/app/marketplace` muestra 12 profesionales, 6 por página, top destacados y cuatro filtros.
- Buscar/filtrar/ordenar/limpiar actualiza contador, grid, página y estado vacío.
- Carrusel muestra 3/2/1 elementos y deshabilita flechas en extremos.
- Navegación listado → perfil → volver; URL directa y perfil inexistente.
- Perfil muestra servicios/horarios/credenciales/reseñas específicos, no contenido genérico repetido.
- Modal: avanzar/retroceder, validación tardía, slots ocupados, resumen sin pago, envío y éxito.
- Enviar bajo `emp-1` y confirmar que el resumen de éxito identifica esa empresa; cambiar empresa con el
  modal abierto lo cierra y una nueva solicitud usa la nueva empresa. El aislamiento interno del
  `Record<empresaId, SolicitudContacto[]>` se revisa en código porque esta fase no agrega un historial.
- Escape, overlay, foco, scroll lock y navegación completa por teclado.
- Responsive manual en 1440, 768 y 390 px.

### Build

`npm run build` después de cada tarea y al cierre, sin errores de TypeScript. No se introduce test runner,
ESLint ni dependencia nueva.

## Fuera de alcance (Fase 7)

- Fase 8: Plan y suscripción, pagos, métodos, comisión y límites de contactos.
- Fase 9: Configuración, notificaciones reales y tutoriales.
- Portal del profesional para aceptar/rechazar solicitudes.
- Administración para aprobar postulaciones o editar el catálogo.
- Backend, autenticación adicional, correo, videollamada o integración con calendarios.
