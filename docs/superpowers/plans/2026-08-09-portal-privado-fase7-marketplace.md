# Portal Privado — Fase 7 (Marketplace) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el Marketplace privado completo —catálogo, filtros, perfil y envío de solicitudes por empresa— como prototipo frontend de alta fidelidad, sin pagos, citas ni backend.

**Architecture:** El catálogo profesional es global, estático y normalizado en `marketplace/catalogo.ts`; `marketplace/calculo.ts` contiene toda la búsqueda, orden, paginación y agenda como funciones puras. Solo `SolicitudContacto` es mutable y se guarda en `PortalDataContext` bajo `Record<empresaId, SolicitudContacto[]>`; listado, perfil y modal consumen esos contratos sin duplicar lógica.

**Tech Stack:** Node 24, React 18, TypeScript 5.6 estricto, Vite 5, Tailwind CSS 4 CSS-first, react-router-dom 6, lucide-react y primitivas UI existentes. Sin backend, test runner, ESLint, localStorage ni dependencias nuevas.

## Global Constraints

- Trabajar sobre la rama `dylan_cd` y preservar cualquier cambio ajeno que aparezca durante la ejecución.
- Fuente normativa de alcance: `docs/superpowers/specs/2026-08-09-portal-privado-fase7-marketplace-design.md`.
- Catálogo global: exactamente 12 profesionales activos, visibles y disponibles; 3 servicios concretos por profesional; 1–3 reseñas recientes; solicitudes únicamente por empresa.
- `HOY_MARKETPLACE = '2026-08-13'` y `AHORA_MARKETPLACE = '2026-08-13T12:00:00-05:00'`, derivados en un solo módulo.
- Toda solicitud nueva termina directamente en `ENVIADA`; prohibido crear pago, método de pago, comisión, cita o transición `PENDIENTE_PAGO`/`PAGADA`.
- Sin gating por plan, candados, límites de contactos ni navegación de upgrade; corresponde a Fase 8.
- La postulación pública existente queda intacta; no crear ruta ni pantalla privada de postulación.
- Reutilizar `formatUSD` de `financiero/formato.ts` y `formatFecha`/`capitalizar` de `obligaciones/formato.ts`.
- Toda lógica determinista va en funciones puras; componentes solo coordinan estado y render.
- No añadir dependencias, test runner, ESLint, localStorage ni persistencia fuera de memoria React.
- Ejecutar `npm run build` después de cada tarea. Para helpers puros usar scripts puntuales `npx tsx -e`.
- Cada tarea requiere revisión de cumplimiento del spec y luego revisión de calidad antes de aceptarse.

## File Structure

```text
src/
├── App.tsx                                      # Modify: rutas listado/perfil
└── portal/
    ├── types.ts                                 # Modify: tipos Marketplace
    ├── PortalDataContext.tsx                    # Modify: solicitudes por empresa
    ├── data/
    │   └── mock-portal-data.ts                  # Modify: semilla vacía de solicitudes
    └── marketplace/
        ├── catalogo.ts                          # Create: catálogo global + bloqueos agenda
        ├── calculo.ts                           # Create: búsqueda/filtros/orden/paginación/slots
        ├── formato.ts                           # Create: labels propios del dominio
        ├── ProfesionalCard.tsx                  # Create: tarjeta reutilizable
        ├── DestacadosCarousel.tsx               # Create: carrusel 3/2/1
        ├── ReservaModal.tsx                     # Create: wizard accesible y envío
        ├── MarketplaceScreen.tsx                # Create: listado completo
        └── PerfilProfesionalScreen.tsx          # Create: detalle completo
```

---

### Task 1: Tipos del dominio Marketplace

**Files:**
- Modify: `src/portal/types.ts`

**Interfaces:**
- Consumes: ningún contrato nuevo.
- Produces: `ModalidadAtencion`, `EspecialidadProfesional`, `ColaboradorMarketplace`,
  `ServicioProfesional`, `HorarioDisponibilidad`, `ResenaColaborador`, `SolicitudContacto` y
  `NuevaSolicitudContacto` para todas las tareas posteriores.

- [ ] **Step 1: Agregar los tipos al final de `src/portal/types.ts`**

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
  diaSemana: 1 | 2 | 3 | 4 | 5 | 6 | 7
  horaInicio: string
  horaFin: string
  modalidad: ModalidadAtencion
  activo: boolean
}

export type ResenaColaborador = {
  id: string
  colaboradorId: string
  autorEmpresa: string
  calificacion: 1 | 2 | 3 | 4 | 5
  comentario: string
  fecha: string
  estado: 'PUBLICADA' | 'OCULTA'
}

export type SolicitudContacto = {
  id: string
  colaboradorId: string
  servicioId: string
  fechaPreferida: string
  horaPreferida: string
  descripcion: string
  estado: 'ENVIADA'
  createdAt: string
}

export type NuevaSolicitudContacto = Omit<SolicitudContacto, 'id' | 'estado' | 'createdAt'>
```

- [ ] **Step 2: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0; Vite genera `dist/` sin errores de tipos ni imports no usados.

- [ ] **Step 3: Commit**

```bash
git add src/portal/types.ts
git commit -m "feat: agregar tipos del marketplace"
```

---

### Task 2: Catálogo global normalizado y fixtures de agenda

**Files:**
- Create: `src/portal/marketplace/catalogo.ts`

**Interfaces:**
- Consumes: tipos de Marketplace de Task 1.
- Produces: `BloqueoAgenda`, `ESPECIALIDADES_PROFESIONALES`,
  `COLABORADORES_MARKETPLACE`, `SERVICIOS_PROFESIONALES`, `HORARIOS_DISPONIBILIDAD`,
  `RESENAS_COLABORADORES`, `BLOQUEOS_AGENDA` y selectores por profesional.

- [ ] **Step 1: Crear `src/portal/marketplace/catalogo.ts` con el catálogo completo**

```ts
import type {
  ColaboradorMarketplace,
  EspecialidadProfesional,
  HorarioDisponibilidad,
  ModalidadAtencion,
  ResenaColaborador,
  ServicioProfesional,
} from '@/portal/types'

export type BloqueoAgenda = {
  colaboradorId: string
  fecha: string
  horaInicio: string
  horaFin: string
}

export const ESPECIALIDADES_PROFESIONALES: EspecialidadProfesional[] = [
  { id: 'esp-tributario', codigo: 'TRIBUTARIO', nombre: 'Tributario', categoria: 'Tributación' },
  { id: 'esp-fiscalizacion', codigo: 'FISCALIZACION', nombre: 'Fiscalización', categoria: 'Tributación' },
  { id: 'esp-laboral', codigo: 'LABORAL', nombre: 'Laboral', categoria: 'Legal' },
  { id: 'esp-remuneraciones', codigo: 'REMUNERACIONES', nombre: 'Remuneraciones', categoria: 'Laboral' },
  { id: 'esp-iess', codigo: 'IESS', nombre: 'IESS', categoria: 'Laboral' },
  { id: 'esp-finanzas', codigo: 'FINANZAS', nombre: 'Finanzas', categoria: 'Financiero' },
  { id: 'esp-presupuestos', codigo: 'PRESUPUESTOS', nombre: 'Presupuestos', categoria: 'Financiero' },
  { id: 'esp-financiamiento', codigo: 'FINANCIAMIENTO', nombre: 'Financiamiento', categoria: 'Financiero' },
  { id: 'esp-costos', codigo: 'COSTOS', nombre: 'Costos', categoria: 'Contable' },
  { id: 'esp-societario', codigo: 'SOCIETARIO', nombre: 'Societario', categoria: 'Legal' },
  { id: 'esp-mercantil', codigo: 'MERCANTIL', nombre: 'Mercantil', categoria: 'Legal' },
  { id: 'esp-contabilidad', codigo: 'CONTABILIDAD', nombre: 'Contabilidad', categoria: 'Contable' },
  { id: 'esp-niif', codigo: 'NIIF', nombre: 'NIIF', categoria: 'Contable' },
  { id: 'esp-auditoria', codigo: 'AUDITORIA', nombre: 'Auditoría', categoria: 'Contable' },
]

type ColaboradorSemilla = Omit<
  ColaboradorMarketplace,
  'paisAtencion' | 'zonaHoraria' | 'estadoDisponibilidad' | 'visibleMarketplace' | 'estado'
>

function crearColaborador(datos: ColaboradorSemilla): ColaboradorMarketplace {
  return {
    ...datos,
    paisAtencion: 'Ecuador',
    zonaHoraria: 'America/Guayaquil',
    estadoDisponibilidad: 'DISPONIBLE',
    visibleMarketplace: true,
    estado: 'ACTIVO',
  }
}

export const COLABORADORES_MARKETPLACE: ColaboradorMarketplace[] = [
  crearColaborador({
    id: 'col-01',
    nombres: 'María José',
    apellidos: 'Ramírez Alvear',
    areaEspecializacion: 'Tributario',
    profesion: 'Abogada',
    trabajoActual: 'Estudio Ramírez & Asociados',
    numeroLicencia: 'FORO-G-18427',
    entidadEmisora: 'Foro de Abogados del Guayas',
    descripcionProfesional: 'Abogada experta en planificación y consultoría tributaria empresarial. Defensa en procesos de determinación del SRI.',
    modalidadAtencion: 'VIRTUAL',
    ciudadAtencion: 'Guayaquil',
    tarifaReferencial: 35,
    aniosExperiencia: 8,
    cvVisible: true,
    especialidadIds: ['esp-tributario', 'esp-fiscalizacion'],
    especialidadPrincipalId: 'esp-tributario',
    calificacionPromedio: 4.9,
    cantidadResenas: 98,
  }),
  crearColaborador({
    id: 'col-02',
    nombres: 'Felipe',
    apellidos: 'Andrade Cordero',
    areaEspecializacion: 'Laboral',
    profesion: 'Asesor laboral',
    trabajoActual: 'Andrade Consultores',
    descripcionProfesional: 'Asesor en relaciones laborales, contratos y cumplimiento legal laboral para PYMES.',
    modalidadAtencion: 'AMBAS',
    ciudadAtencion: 'Quito',
    tarifaReferencial: 45,
    aniosExperiencia: 10,
    cvVisible: true,
    especialidadIds: ['esp-laboral', 'esp-remuneraciones'],
    especialidadPrincipalId: 'esp-laboral',
    calificacionPromedio: 4.8,
    cantidadResenas: 76,
  }),
  crearColaborador({
    id: 'col-03',
    nombres: 'Camila',
    apellidos: 'Torres Benítez',
    areaEspecializacion: 'Finanzas',
    profesion: 'Analista financiera',
    trabajoActual: 'Consultora independiente',
    descripcionProfesional: 'Apoyo a empresas en análisis financiero, presupuestos y toma de decisiones estratégicas.',
    modalidadAtencion: 'VIRTUAL',
    ciudadAtencion: 'Cuenca',
    tarifaReferencial: 30,
    aniosExperiencia: 6,
    cvVisible: false,
    especialidadIds: ['esp-finanzas', 'esp-presupuestos'],
    especialidadPrincipalId: 'esp-finanzas',
    calificacionPromedio: 4.9,
    cantidadResenas: 64,
  }),
  crearColaborador({
    id: 'col-04',
    nombres: 'Andrés',
    apellidos: 'Muñoz Salcedo',
    areaEspecializacion: 'Societario',
    profesion: 'Abogado',
    trabajoActual: 'Muñoz Legal',
    numeroLicencia: 'FORO-G-09815',
    entidadEmisora: 'Foro de Abogados del Guayas',
    descripcionProfesional: 'Abogado experto en derecho societario y mercantil. Asesoría integral a empresas y contratos comerciales.',
    modalidadAtencion: 'PRESENCIAL',
    ciudadAtencion: 'Guayaquil',
    tarifaReferencial: 28,
    aniosExperiencia: 7,
    cvVisible: false,
    especialidadIds: ['esp-societario', 'esp-mercantil'],
    especialidadPrincipalId: 'esp-societario',
    calificacionPromedio: 4.7,
    cantidadResenas: 52,
  }),
  crearColaborador({
    id: 'col-05',
    nombres: 'Valentina',
    apellidos: 'Silva Erazo',
    areaEspecializacion: 'Contabilidad',
    profesion: 'Contadora',
    trabajoActual: 'Silva Contadores',
    numeroLicencia: 'CPA-MAN-09214',
    entidadEmisora: 'Colegio de Contadores de Manabí',
    descripcionProfesional: 'Contadora con experiencia en cierres mensuales, NIIF para PYMES y conciliaciones tributarias.',
    modalidadAtencion: 'AMBAS',
    ciudadAtencion: 'Manta',
    tarifaReferencial: 33,
    aniosExperiencia: 9,
    cvVisible: true,
    especialidadIds: ['esp-contabilidad', 'esp-niif'],
    especialidadPrincipalId: 'esp-contabilidad',
    calificacionPromedio: 4.8,
    cantidadResenas: 61,
  }),
  crearColaborador({
    id: 'col-06',
    nombres: 'Diego',
    apellidos: 'Pérez Villamar',
    areaEspecializacion: 'Remuneraciones',
    profesion: 'Asesor laboral',
    trabajoActual: 'Consultor independiente',
    descripcionProfesional: 'Asesor en contratos y cumplimiento normativo ante el Ministerio del Trabajo y el IESS.',
    modalidadAtencion: 'VIRTUAL',
    ciudadAtencion: 'Guayaquil',
    tarifaReferencial: 27,
    aniosExperiencia: 5,
    cvVisible: false,
    especialidadIds: ['esp-remuneraciones', 'esp-iess'],
    especialidadPrincipalId: 'esp-remuneraciones',
    calificacionPromedio: 4.6,
    cantidadResenas: 41,
  }),
  crearColaborador({
    id: 'col-07',
    nombres: 'Paula',
    apellidos: 'Benalcázar Ruiz',
    areaEspecializacion: 'Tributario',
    profesion: 'Contadora',
    trabajoActual: 'BR Consultores',
    numeroLicencia: 'CPA-P-21108',
    entidadEmisora: 'Colegio de Contadores de Pichincha',
    descripcionProfesional: 'Especialista en cumplimiento tributario de sociedades y anexos del SRI.',
    modalidadAtencion: 'AMBAS',
    ciudadAtencion: 'Quito',
    tarifaReferencial: 42,
    aniosExperiencia: 12,
    cvVisible: true,
    especialidadIds: ['esp-tributario', 'esp-contabilidad'],
    especialidadPrincipalId: 'esp-tributario',
    calificacionPromedio: 5,
    cantidadResenas: 112,
  }),
  crearColaborador({
    id: 'col-08',
    nombres: 'Sebastián',
    apellidos: 'Vera Loor',
    areaEspecializacion: 'Costos',
    profesion: 'Analista financiero',
    trabajoActual: 'Consultor independiente',
    descripcionProfesional: 'Análisis de costos y estructura de precios para empresas manufactureras.',
    modalidadAtencion: 'VIRTUAL',
    ciudadAtencion: 'Portoviejo',
    tarifaReferencial: 24,
    aniosExperiencia: 4,
    cvVisible: false,
    especialidadIds: ['esp-costos', 'esp-finanzas'],
    especialidadPrincipalId: 'esp-costos',
    calificacionPromedio: 4.5,
    cantidadResenas: 29,
  }),
  crearColaborador({
    id: 'col-09',
    nombres: 'Gabriela',
    apellidos: 'Mendoza Cruz',
    areaEspecializacion: 'Laboral',
    profesion: 'Abogada',
    trabajoActual: 'Mendoza & Cruz',
    numeroLicencia: 'FORO-A-06134',
    entidadEmisora: 'Foro de Abogados del Azuay',
    descripcionProfesional: 'Litigio laboral y auditoría de cumplimiento para empresas con más de 20 colaboradores.',
    modalidadAtencion: 'PRESENCIAL',
    ciudadAtencion: 'Cuenca',
    tarifaReferencial: 40,
    aniosExperiencia: 11,
    cvVisible: true,
    especialidadIds: ['esp-laboral', 'esp-societario'],
    especialidadPrincipalId: 'esp-laboral',
    calificacionPromedio: 4.9,
    cantidadResenas: 88,
  }),
  crearColaborador({
    id: 'col-10',
    nombres: 'Joaquín',
    apellidos: 'Herrera Peña',
    areaEspecializacion: 'NIIF',
    profesion: 'Contador',
    trabajoActual: 'Herrera Auditores',
    numeroLicencia: 'CPA-GYE-22891',
    entidadEmisora: 'Colegio de Contadores del Guayas',
    descripcionProfesional: 'Implementación de NIIF para PYMES y preparación de estados financieros auditables.',
    modalidadAtencion: 'AMBAS',
    ciudadAtencion: 'Guayaquil',
    tarifaReferencial: 48,
    aniosExperiencia: 14,
    cvVisible: true,
    especialidadIds: ['esp-niif', 'esp-auditoria'],
    especialidadPrincipalId: 'esp-niif',
    calificacionPromedio: 4.7,
    cantidadResenas: 73,
  }),
  crearColaborador({
    id: 'col-11',
    nombres: 'Lucía',
    apellidos: 'Cabrera Zamora',
    areaEspecializacion: 'Financiamiento',
    profesion: 'Asesora financiera',
    trabajoActual: 'Cabrera Capital',
    descripcionProfesional: 'Estructuración de solicitudes de crédito y proyecciones para banca y cooperativas.',
    modalidadAtencion: 'VIRTUAL',
    ciudadAtencion: 'Loja',
    tarifaReferencial: 38,
    aniosExperiencia: 8,
    cvVisible: true,
    especialidadIds: ['esp-financiamiento', 'esp-finanzas'],
    especialidadPrincipalId: 'esp-financiamiento',
    calificacionPromedio: 4.8,
    cantidadResenas: 57,
  }),
  crearColaborador({
    id: 'col-12',
    nombres: 'Mateo',
    apellidos: 'Ibarra Nieto',
    areaEspecializacion: 'Fiscalización',
    profesion: 'Abogado',
    trabajoActual: 'Ibarra Legal',
    numeroLicencia: 'FORO-T-07642',
    entidadEmisora: 'Foro de Abogados de Tungurahua',
    descripcionProfesional: 'Defensa en procesos de determinación tributaria y reclamos administrativos.',
    modalidadAtencion: 'AMBAS',
    ciudadAtencion: 'Ambato',
    tarifaReferencial: 31,
    aniosExperiencia: 6,
    cvVisible: false,
    especialidadIds: ['esp-fiscalizacion', 'esp-tributario'],
    especialidadPrincipalId: 'esp-fiscalizacion',
    calificacionPromedio: 4.6,
    cantidadResenas: 44,
  }),
]

type ServicioSemilla = Omit<ServicioProfesional, 'id' | 'colaboradorId' | 'activo'>

function crearServicios(colaboradorId: string, definiciones: ServicioSemilla[]): ServicioProfesional[] {
  return definiciones.map((servicio, index) => ({
    id: 'srv-' + colaboradorId + '-' + String(index + 1).padStart(2, '0'),
    colaboradorId,
    ...servicio,
    activo: true,
  }))
}

export const SERVICIOS_PROFESIONALES: ServicioProfesional[] = [
  ...crearServicios('col-01', [
    { nombre: 'Diagnóstico tributario integral', descripcion: 'Revisión inicial de obligaciones, riesgos y oportunidades tributarias.', duracionEstimadaMinutos: 60, tarifaReferencial: 35, modalidad: 'VIRTUAL' },
    { nombre: 'Declaraciones y anexos SRI', descripcion: 'Acompañamiento para preparar declaraciones y anexos periódicos.', duracionEstimadaMinutos: 90, tarifaReferencial: 55, modalidad: 'VIRTUAL' },
    { nombre: 'Planificación tributaria', descripcion: 'Plan preventivo de cumplimiento y organización fiscal para el siguiente periodo.', duracionEstimadaMinutos: 120, tarifaReferencial: 70, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-02', [
    { nombre: 'Consulta laboral preventiva', descripcion: 'Evaluación puntual de una situación laboral antes de tomar decisiones.', duracionEstimadaMinutos: 60, tarifaReferencial: 45, modalidad: 'VIRTUAL' },
    { nombre: 'Revisión de contratos de trabajo', descripcion: 'Revisión de cláusulas, modalidad contractual y riesgos para la empresa.', duracionEstimadaMinutos: 90, tarifaReferencial: 65, modalidad: 'VIRTUAL' },
    { nombre: 'Acompañamiento en desvinculación', descripcion: 'Orientación presencial para documentar una terminación laboral.', duracionEstimadaMinutos: 90, tarifaReferencial: 75, modalidad: 'PRESENCIAL' },
  ]),
  ...crearServicios('col-03', [
    { nombre: 'Diagnóstico financiero', descripcion: 'Lectura ejecutiva de liquidez, rentabilidad y estructura financiera.', duracionEstimadaMinutos: 60, tarifaReferencial: 30, modalidad: 'VIRTUAL' },
    { nombre: 'Flujo de caja proyectado', descripcion: 'Construcción guiada de una proyección de cobros y pagos.', duracionEstimadaMinutos: 90, tarifaReferencial: 50, modalidad: 'VIRTUAL' },
    { nombre: 'Evaluación de inversión', descripcion: 'Comparación de escenarios, retorno esperado y principales riesgos.', duracionEstimadaMinutos: 120, tarifaReferencial: 65, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-04', [
    { nombre: 'Constitución o reforma de compañía', descripcion: 'Revisión de requisitos y documentos para constituciones o reformas.', duracionEstimadaMinutos: 90, tarifaReferencial: 55, modalidad: 'PRESENCIAL' },
    { nombre: 'Consulta societaria', descripcion: 'Orientación sobre socios, administración, estatutos y decisiones corporativas.', duracionEstimadaMinutos: 60, tarifaReferencial: 28, modalidad: 'PRESENCIAL' },
    { nombre: 'Preparación de junta de socios', descripcion: 'Estructuración de convocatoria, agenda, resoluciones y acta.', duracionEstimadaMinutos: 120, tarifaReferencial: 70, modalidad: 'PRESENCIAL' },
  ]),
  ...crearServicios('col-05', [
    { nombre: 'Cierre contable mensual', descripcion: 'Revisión del cierre, ajustes pendientes y consistencia de saldos.', duracionEstimadaMinutos: 90, tarifaReferencial: 45, modalidad: 'VIRTUAL' },
    { nombre: 'Revisión de conciliaciones', descripcion: 'Validación de conciliaciones bancarias y partidas pendientes.', duracionEstimadaMinutos: 60, tarifaReferencial: 33, modalidad: 'VIRTUAL' },
    { nombre: 'Organización documental contable', descripcion: 'Sesión presencial para ordenar soportes y flujo documental.', duracionEstimadaMinutos: 120, tarifaReferencial: 60, modalidad: 'PRESENCIAL' },
  ]),
  ...crearServicios('col-06', [
    { nombre: 'Auditoría de nómina', descripcion: 'Revisión de novedades, aportes, descuentos y consistencia de roles.', duracionEstimadaMinutos: 90, tarifaReferencial: 45, modalidad: 'VIRTUAL' },
    { nombre: 'Implementación de roles de pago', descripcion: 'Diseño del proceso mensual de nómina y sus controles básicos.', duracionEstimadaMinutos: 60, tarifaReferencial: 27, modalidad: 'VIRTUAL' },
    { nombre: 'Cálculo de liquidación de haberes', descripcion: 'Revisión guiada de rubros para una liquidación laboral.', duracionEstimadaMinutos: 60, tarifaReferencial: 32, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-07', [
    { nombre: 'Consulta tributaria especializada', descripcion: 'Análisis de una consulta fiscal concreta y sus alternativas.', duracionEstimadaMinutos: 60, tarifaReferencial: 42, modalidad: 'VIRTUAL' },
    { nombre: 'Revisión de requerimiento del SRI', descripcion: 'Lectura presencial del requerimiento y plan de respuesta documental.', duracionEstimadaMinutos: 90, tarifaReferencial: 65, modalidad: 'PRESENCIAL' },
    { nombre: 'Estrategia fiscal anual', descripcion: 'Planificación de hitos, riesgos y controles para el ejercicio fiscal.', duracionEstimadaMinutos: 120, tarifaReferencial: 80, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-08', [
    { nombre: 'Análisis de estructura de costos', descripcion: 'Clasificación de costos fijos y variables por línea de negocio.', duracionEstimadaMinutos: 90, tarifaReferencial: 40, modalidad: 'VIRTUAL' },
    { nombre: 'Cálculo de punto de equilibrio', descripcion: 'Determinación del volumen mínimo de ventas y margen de seguridad.', duracionEstimadaMinutos: 60, tarifaReferencial: 24, modalidad: 'VIRTUAL' },
    { nombre: 'Costeo de productos o servicios', descripcion: 'Diseño de una ficha de costo para fijar precios con mayor claridad.', duracionEstimadaMinutos: 120, tarifaReferencial: 55, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-09', [
    { nombre: 'Diagnóstico de relaciones laborales', descripcion: 'Revisión presencial de prácticas, documentos y riesgos laborales.', duracionEstimadaMinutos: 60, tarifaReferencial: 40, modalidad: 'PRESENCIAL' },
    { nombre: 'Elaboración de reglamento interno', descripcion: 'Sesión de levantamiento y definición de políticas laborales.', duracionEstimadaMinutos: 120, tarifaReferencial: 75, modalidad: 'PRESENCIAL' },
    { nombre: 'Mediación laboral', descripcion: 'Preparación y acompañamiento para una conversación de mediación.', duracionEstimadaMinutos: 90, tarifaReferencial: 65, modalidad: 'PRESENCIAL' },
  ]),
  ...crearServicios('col-10', [
    { nombre: 'Implementación NIIF para PYMES', descripcion: 'Diagnóstico y hoja de ruta para aplicar NIIF para PYMES.', duracionEstimadaMinutos: 120, tarifaReferencial: 95, modalidad: 'VIRTUAL' },
    { nombre: 'Diagnóstico de cumplimiento NIIF', descripcion: 'Revisión de políticas y principales brechas de presentación.', duracionEstimadaMinutos: 90, tarifaReferencial: 70, modalidad: 'VIRTUAL' },
    { nombre: 'Taller de políticas contables', descripcion: 'Sesión presencial para definir políticas contables prioritarias.', duracionEstimadaMinutos: 120, tarifaReferencial: 85, modalidad: 'PRESENCIAL' },
  ]),
  ...crearServicios('col-11', [
    { nombre: 'Perfil de financiamiento', descripcion: 'Evaluación de capacidad, destino y alternativas de financiamiento.', duracionEstimadaMinutos: 60, tarifaReferencial: 38, modalidad: 'VIRTUAL' },
    { nombre: 'Preparación de carpeta de crédito', descripcion: 'Organización de información financiera y narrativa del negocio.', duracionEstimadaMinutos: 90, tarifaReferencial: 58, modalidad: 'VIRTUAL' },
    { nombre: 'Evaluación de deuda e inversión', descripcion: 'Comparación del costo y efecto de distintas fuentes de recursos.', duracionEstimadaMinutos: 120, tarifaReferencial: 72, modalidad: 'VIRTUAL' },
  ]),
  ...crearServicios('col-12', [
    { nombre: 'Revisión fiscal preventiva', descripcion: 'Control de soportes y señales de riesgo antes de una fiscalización.', duracionEstimadaMinutos: 90, tarifaReferencial: 50, modalidad: 'VIRTUAL' },
    { nombre: 'Respuesta a auditoría tributaria', descripcion: 'Preparación presencial de argumentos y expediente de respuesta.', duracionEstimadaMinutos: 120, tarifaReferencial: 80, modalidad: 'PRESENCIAL' },
    { nombre: 'Matriz de riesgos fiscales', descripcion: 'Identificación y priorización de riesgos fiscales del negocio.', duracionEstimadaMinutos: 60, tarifaReferencial: 31, modalidad: 'VIRTUAL' },
  ]),
]

function crearHorarios(
  colaboradorId: string,
  modalidad: ModalidadAtencion,
  dias: HorarioDisponibilidad['diaSemana'][],
  horaInicio: string,
  horaFin: string,
): HorarioDisponibilidad[] {
  return dias.map((diaSemana) => ({
    id: 'hor-' + colaboradorId + '-' + diaSemana,
    colaboradorId,
    diaSemana,
    horaInicio,
    horaFin,
    modalidad,
    activo: true,
  }))
}

export const HORARIOS_DISPONIBILIDAD: HorarioDisponibilidad[] = [
  ...crearHorarios('col-01', 'VIRTUAL', [1, 3, 5], '09:00', '13:00'),
  ...crearHorarios('col-02', 'AMBAS', [2, 4, 6], '14:00', '18:00'),
  ...crearHorarios('col-03', 'VIRTUAL', [1, 2, 4], '08:00', '12:00'),
  ...crearHorarios('col-04', 'PRESENCIAL', [2, 4, 5], '09:00', '13:00'),
  ...crearHorarios('col-05', 'AMBAS', [1, 3, 6], '10:00', '14:00'),
  ...crearHorarios('col-06', 'VIRTUAL', [1, 4, 5], '09:00', '13:00'),
  ...crearHorarios('col-07', 'AMBAS', [2, 3, 5], '13:00', '17:00'),
  ...crearHorarios('col-08', 'VIRTUAL', [1, 3, 4], '08:00', '12:00'),
  ...crearHorarios('col-09', 'PRESENCIAL', [2, 5, 6], '09:00', '14:00'),
  ...crearHorarios('col-10', 'AMBAS', [1, 2, 4], '13:00', '18:00'),
  ...crearHorarios('col-11', 'VIRTUAL', [3, 4, 5], '08:00', '12:00'),
  ...crearHorarios('col-12', 'AMBAS', [1, 3, 6], '09:00', '13:00'),
]

type ResenaSemilla = Omit<ResenaColaborador, 'id' | 'colaboradorId' | 'estado'>

function crearResenas(colaboradorId: string, definiciones: ResenaSemilla[]): ResenaColaborador[] {
  return definiciones.map((resena, index) => ({
    id: 'res-' + colaboradorId + '-' + String(index + 1).padStart(2, '0'),
    colaboradorId,
    ...resena,
    estado: 'PUBLICADA',
  }))
}

export const RESENAS_COLABORADORES: ResenaColaborador[] = [
  ...crearResenas('col-01', [
    { autorEmpresa: 'Textiles Andina S.A.', calificacion: 5, comentario: 'Nos explicó cada pendiente del SRI con claridad y dejó un plan de trabajo concreto.', fecha: '2026-08-02' },
    { autorEmpresa: 'Café Sierra Norte', calificacion: 5, comentario: 'La revisión preventiva detectó inconsistencias antes de presentar el anexo.', fecha: '2026-07-18' },
    { autorEmpresa: 'Distribuidora Pacífico', calificacion: 4, comentario: 'Atención puntual y recomendaciones fáciles de aplicar.', fecha: '2026-06-29' },
  ]),
  ...crearResenas('col-02', [
    { autorEmpresa: 'Comercial del Valle Cía. Ltda.', calificacion: 5, comentario: 'La revisión contractual fue muy detallada y práctica.', fecha: '2026-08-04' },
    { autorEmpresa: 'Constructora Horizonte', calificacion: 5, comentario: 'Nos ayudó a ordenar el proceso de desvinculación sin improvisaciones.', fecha: '2026-07-21' },
    { autorEmpresa: 'Servicios Médicos Equinoccio', calificacion: 5, comentario: 'Explicaciones claras y excelente seguimiento.', fecha: '2026-06-30' },
  ]),
  ...crearResenas('col-03', [
    { autorEmpresa: 'Panadería La Colina', calificacion: 5, comentario: 'La proyección de caja nos permitió anticipar dos meses complicados.', fecha: '2026-07-30' },
    { autorEmpresa: 'Muebles Austro', calificacion: 4, comentario: 'Muy buena guía para comparar alternativas de inversión.', fecha: '2026-06-17' },
  ]),
  ...crearResenas('col-04', [
    { autorEmpresa: 'Inversiones Río Guayas', calificacion: 5, comentario: 'Ordenó la junta y los documentos societarios con mucha precisión.', fecha: '2026-07-25' },
  ]),
  ...crearResenas('col-05', [
    { autorEmpresa: 'Mariscos del Puerto', calificacion: 5, comentario: 'Logramos cerrar el mes con conciliaciones claras y sin partidas pendientes.', fecha: '2026-08-01' },
    { autorEmpresa: 'Taller Montecristi', calificacion: 4, comentario: 'Nos dejó un flujo documental sencillo para el equipo.', fecha: '2026-06-22' },
  ]),
  ...crearResenas('col-06', [
    { autorEmpresa: 'Logística Azul', calificacion: 5, comentario: 'Corrigió diferencias de nómina y nos enseñó cómo prevenirlas.', fecha: '2026-07-27' },
  ]),
  ...crearResenas('col-07', [
    { autorEmpresa: 'Tecnología Páramo', calificacion: 5, comentario: 'La respuesta al requerimiento quedó organizada y bien sustentada.', fecha: '2026-08-06' },
    { autorEmpresa: 'Alimentos Cayambe', calificacion: 5, comentario: 'Excelente criterio tributario y comunicación muy directa.', fecha: '2026-07-11' },
    { autorEmpresa: 'Diseño Capital', calificacion: 4, comentario: 'El plan fiscal anual nos dio prioridades concretas.', fecha: '2026-05-29' },
  ]),
  ...crearResenas('col-08', [
    { autorEmpresa: 'Calzado Manabí', calificacion: 5, comentario: 'Ahora conocemos el costo real y el margen de cada línea.', fecha: '2026-07-14' },
  ]),
  ...crearResenas('col-09', [
    { autorEmpresa: 'Clínica Santa Ana', calificacion: 5, comentario: 'Condujo la mediación con equilibrio y mucha preparación.', fecha: '2026-08-03' },
    { autorEmpresa: 'Hostería Tomebamba', calificacion: 4, comentario: 'El reglamento quedó adaptado a nuestra operación real.', fecha: '2026-06-09' },
  ]),
  ...crearResenas('col-10', [
    { autorEmpresa: 'Importadora Central', calificacion: 5, comentario: 'El diagnóstico NIIF fue profundo y entregó una ruta alcanzable.', fecha: '2026-07-28' },
    { autorEmpresa: 'Industrias Daule', calificacion: 5, comentario: 'Dominio técnico y explicaciones comprensibles para gerencia.', fecha: '2026-06-13' },
  ]),
  ...crearResenas('col-11', [
    { autorEmpresa: 'AgroLoja', calificacion: 5, comentario: 'La carpeta de crédito quedó completa y mejor presentada.', fecha: '2026-07-19' },
  ]),
  ...crearResenas('col-12', [
    { autorEmpresa: 'Ferretería Ambato', calificacion: 5, comentario: 'Identificó riesgos documentales que no habíamos considerado.', fecha: '2026-07-23' },
  ]),
]

export const BLOQUEOS_AGENDA: BloqueoAgenda[] = [
  { colaboradorId: 'col-01', fecha: '2026-08-14', horaInicio: '10:00', horaFin: '11:00' },
  { colaboradorId: 'col-02', fecha: '2026-08-15', horaInicio: '15:30', horaFin: '16:30' },
  { colaboradorId: 'col-03', fecha: '2026-08-17', horaInicio: '09:00', horaFin: '10:00' },
  { colaboradorId: 'col-04', fecha: '2026-08-14', horaInicio: '11:00', horaFin: '12:00' },
  { colaboradorId: 'col-05', fecha: '2026-08-15', horaInicio: '11:00', horaFin: '12:00' },
  { colaboradorId: 'col-06', fecha: '2026-08-14', horaInicio: '10:00', horaFin: '10:30' },
  { colaboradorId: 'col-07', fecha: '2026-08-14', horaInicio: '14:00', horaFin: '15:30' },
  { colaboradorId: 'col-08', fecha: '2026-08-17', horaInicio: '10:00', horaFin: '11:00' },
  { colaboradorId: 'col-09', fecha: '2026-08-15', horaInicio: '12:00', horaFin: '13:00' },
  { colaboradorId: 'col-10', fecha: '2026-08-17', horaInicio: '14:00', horaFin: '16:00' },
  { colaboradorId: 'col-11', fecha: '2026-08-14', horaInicio: '09:00', horaFin: '10:00' },
  { colaboradorId: 'col-12', fecha: '2026-08-15', horaInicio: '10:00', horaFin: '12:00' },
]

export function colaboradorMarketplacePorId(id: string): ColaboradorMarketplace | undefined {
  return COLABORADORES_MARKETPLACE.find((colaborador) => colaborador.id === id)
}

export function especialidadProfesionalPorId(id: string): EspecialidadProfesional | undefined {
  return ESPECIALIDADES_PROFESIONALES.find((especialidad) => especialidad.id === id)
}

export function especialidadesDeColaborador(
  colaborador: ColaboradorMarketplace,
): EspecialidadProfesional[] {
  return colaborador.especialidadIds
    .map(especialidadProfesionalPorId)
    .filter((especialidad): especialidad is EspecialidadProfesional => especialidad !== undefined)
}

export function serviciosActivosDeColaborador(colaboradorId: string): ServicioProfesional[] {
  return SERVICIOS_PROFESIONALES.filter(
    (servicio) => servicio.colaboradorId === colaboradorId && servicio.activo,
  )
}

export function horariosActivosDeColaborador(colaboradorId: string): HorarioDisponibilidad[] {
  return HORARIOS_DISPONIBILIDAD.filter(
    (horario) => horario.colaboradorId === colaboradorId && horario.activo,
  )
}

export function resenasPublicadasDeColaborador(colaboradorId: string): ResenaColaborador[] {
  return RESENAS_COLABORADORES.filter(
    (resena) => resena.colaboradorId === colaboradorId && resena.estado === 'PUBLICADA',
  )
}

export function bloqueosDeColaborador(colaboradorId: string): BloqueoAgenda[] {
  return BLOQUEOS_AGENDA.filter((bloqueo) => bloqueo.colaboradorId === colaboradorId)
}
```

- [ ] **Step 2: Verificar las invariantes exactas del catálogo**

Run:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { BLOQUEOS_AGENDA, COLABORADORES_MARKETPLACE, ESPECIALIDADES_PROFESIONALES, HORARIOS_DISPONIBILIDAD, RESENAS_COLABORADORES, SERVICIOS_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts"; assert.equal(COLABORADORES_MARKETPLACE.length,12); assert.equal(SERVICIOS_PROFESIONALES.length,36); assert.equal(HORARIOS_DISPONIBILIDAD.length,36); assert.equal(RESENAS_COLABORADORES.length,22); assert.equal(BLOQUEOS_AGENDA.length,12); const colIds=new Set(COLABORADORES_MARKETPLACE.map((x)=>x.id)); const esp=new Map(ESPECIALIDADES_PROFESIONALES.map((x)=>[x.id,x])); const ids=[...ESPECIALIDADES_PROFESIONALES,...COLABORADORES_MARKETPLACE,...SERVICIOS_PROFESIONALES,...HORARIOS_DISPONIBILIDAD,...RESENAS_COLABORADORES].map((x)=>x.id); assert.equal(new Set(ids).size,ids.length); for(const c of COLABORADORES_MARKETPLACE){assert.equal(c.visibleMarketplace,true);assert.equal(c.estado,"ACTIVO");assert.equal(c.estadoDisponibilidad,"DISPONIBLE");assert.ok(c.especialidadIds.includes(c.especialidadPrincipalId));assert.equal(esp.get(c.especialidadPrincipalId)?.nombre,c.areaEspecializacion);assert.equal(SERVICIOS_PROFESIONALES.filter((s)=>s.colaboradorId===c.id&&s.activo).length,3);const r=RESENAS_COLABORADORES.filter((x)=>x.colaboradorId===c.id&&x.estado==="PUBLICADA");assert.ok(r.length>=1&&r.length<=3);assert.ok(c.cantidadResenas>=r.length);assert.ok(c.calificacionPromedio>=1&&c.calificacionPromedio<=5);assert.ok(Number.isFinite(c.tarifaReferencial)&&c.tarifaReferencial>=0);for(const e of c.especialidadIds)assert.ok(esp.has(e));} for(const s of SERVICIOS_PROFESIONALES){assert.ok(colIds.has(s.colaboradorId));assert.notEqual(s.modalidad,"AMBAS");assert.ok(s.duracionEstimadaMinutos>0&&s.tarifaReferencial>=0);assert.ok(HORARIOS_DISPONIBILIDAD.some((h)=>h.colaboradorId===s.colaboradorId&&h.activo&&(h.modalidad==="AMBAS"||h.modalidad===s.modalidad)));} console.log("OK catalogo marketplace");'
```

Expected: `OK catalogo marketplace`.

Run the complementary reference/range validation:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { BLOQUEOS_AGENDA, COLABORADORES_MARKETPLACE, HORARIOS_DISPONIBILIDAD, RESENAS_COLABORADORES } from "./src/portal/marketplace/catalogo.ts"; const colaboradores=new Set(COLABORADORES_MARKETPLACE.map((x)=>x.id)); const hora=/^(?:[01]\d|2[0-3]):[0-5]\d$/; const fecha=/^\d{4}-\d{2}-\d{2}$/; for(const c of COLABORADORES_MARKETPLACE){assert.ok(Number.isFinite(c.aniosExperiencia)&&c.aniosExperiencia>=0);assert.equal(Boolean(c.numeroLicencia),Boolean(c.entidadEmisora));} const felipe=COLABORADORES_MARKETPLACE.find((x)=>x.id==="col-02");assert.ok(felipe);assert.equal(felipe.numeroLicencia,undefined);assert.equal(felipe.entidadEmisora,undefined);for(const h of HORARIOS_DISPONIBILIDAD){assert.ok(colaboradores.has(h.colaboradorId));assert.match(h.horaInicio,hora);assert.match(h.horaFin,hora);assert.ok(h.horaInicio<h.horaFin);assert.ok(h.diaSemana>=1&&h.diaSemana<=7);}for(const r of RESENAS_COLABORADORES){assert.ok(colaboradores.has(r.colaboradorId));assert.match(r.fecha,fecha);assert.ok(r.calificacion>=1&&r.calificacion<=5);}for(const b of BLOQUEOS_AGENDA){assert.ok(colaboradores.has(b.colaboradorId));assert.match(b.fecha,fecha);assert.match(b.horaInicio,hora);assert.match(b.horaFin,hora);assert.ok(b.horaInicio<b.horaFin);}console.log("OK referencias y rangos del catalogo");'
```

Expected: `OK referencias y rangos del catalogo`.

- [ ] **Step 3: Verificar el build**

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 4: Commit**

```bash
git add src/portal/marketplace/catalogo.ts
git commit -m "feat: agregar catalogo global del marketplace"
```
 
---
 
### Task 3: Lógica pura y formato del Marketplace

**Files:**
- Create: `src/portal/marketplace/calculo.ts`
- Create: `src/portal/marketplace/formato.ts`

**Interfaces:**
- Consumes: `ColaboradorMarketplace`, `EspecialidadProfesional`, `HorarioDisponibilidad`,
  `ModalidadAtencion` y `ServicioProfesional` de Task 1; `BloqueoAgenda` y las colecciones de catálogo de
  Task 2; `formatUSD`, `formatFecha` y `capitalizar` de módulos existentes.
- Produces: `OrdenMarketplace`, `FiltrosMarketplace`, `PaginaMarketplace`, `SlotMarketplace`,
  `FILTROS_INICIALES`, `HOY_MARKETPLACE`, `AHORA_MARKETPLACE`, `nombreCompleto`,
  `filtrarProfesionales`, `ordenarProfesionales`, `paginar`, `derivarDestacados`, `generarSlots`,
  `proximasFechasDisponibles`, `obtenerIniciales`, `formatModalidad`, `formatDuracion`,
  `formatRangoHorario`, `formatFechaDisponible`, `formatEstrellas`, `formatResumenCalificacion`,
  `formatTarifaHora` y `formatMetaServicio` para listado, perfil y modal.

- [ ] **Step 1: Crear `src/portal/marketplace/calculo.ts` con filtros, órdenes y agenda determinista**

```ts
import type {
  ColaboradorMarketplace,
  EspecialidadProfesional,
  HorarioDisponibilidad,
  ModalidadAtencion,
  ServicioProfesional,
} from '@/portal/types'
import type { BloqueoAgenda } from './catalogo'

export const HOY_MARKETPLACE = '2026-08-13'
export const AHORA_MARKETPLACE = `${HOY_MARKETPLACE}T12:00:00-05:00`

export type OrdenMarketplace =
  | 'RELEVANCIA'
  | 'MEJOR_CALIFICADOS'
  | 'MAS_RESENAS'
  | 'MENOR_PRECIO'
  | 'MAYOR_EXPERIENCIA'

export type FiltrosMarketplace = {
  busqueda: string
  especialidadId: string
  tarifaMaxima: number | null
  calificacionMinima: number | null
  modalidad: ModalidadAtencion | ''
  orden: OrdenMarketplace
}

export type PaginaMarketplace = {
  items: ColaboradorMarketplace[]
  total: number
  totalPaginas: number
  pagina: number
}

export type SlotMarketplace = {
  horaInicio: string
  horaFin: string
  ocupado: boolean
}

export const FILTROS_INICIALES: FiltrosMarketplace = {
  busqueda: '',
  especialidadId: '',
  tarifaMaxima: null,
  calificacionMinima: null,
  modalidad: '',
  orden: 'RELEVANCIA',
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export function nombreCompleto(profesional: ColaboradorMarketplace): string {
  return `${profesional.nombres} ${profesional.apellidos}`.replace(/\s+/g, ' ').trim()
}

function esPublicable(profesional: ColaboradorMarketplace): boolean {
  return (
    profesional.visibleMarketplace &&
    profesional.estado === 'ACTIVO' &&
    profesional.estadoDisponibilidad === 'DISPONIBLE'
  )
}

function nombresEspecialidades(
  profesional: ColaboradorMarketplace,
  especialidades: EspecialidadProfesional[],
): string[] {
  const porId = new Map(especialidades.map((especialidad) => [especialidad.id, especialidad.nombre]))
  return profesional.especialidadIds
    .map((especialidadId) => porId.get(especialidadId))
    .filter((nombre): nombre is string => nombre !== undefined)
}

function coincideModalidad(
  modalidadProfesional: ModalidadAtencion,
  filtro: ModalidadAtencion | '',
): boolean {
  if (filtro === '') return true
  if (filtro === 'AMBAS') return modalidadProfesional === 'AMBAS'
  return modalidadProfesional === filtro || modalidadProfesional === 'AMBAS'
}

export function filtrarProfesionales({
  profesionales,
  especialidades,
  filtros,
}: {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  filtros: FiltrosMarketplace
}): ColaboradorMarketplace[] {
  const consulta = normalizar(filtros.busqueda)

  return profesionales.filter((profesional) => {
    if (!esPublicable(profesional)) return false
    if (
      filtros.especialidadId !== '' &&
      !profesional.especialidadIds.includes(filtros.especialidadId)
    ) {
      return false
    }
    if (filtros.tarifaMaxima !== null && profesional.tarifaReferencial > filtros.tarifaMaxima) {
      return false
    }
    if (
      filtros.calificacionMinima !== null &&
      profesional.calificacionPromedio < filtros.calificacionMinima
    ) {
      return false
    }
    if (!coincideModalidad(profesional.modalidadAtencion, filtros.modalidad)) return false
    if (consulta === '') return true

    const campos = [
      nombreCompleto(profesional),
      profesional.profesion,
      profesional.areaEspecializacion,
      profesional.descripcionProfesional,
      profesional.ciudadAtencion,
      ...nombresEspecialidades(profesional, especialidades),
    ]

    return campos.some((campo) => normalizar(campo).includes(consulta))
  })
}

function compararNombre(a: ColaboradorMarketplace, b: ColaboradorMarketplace): number {
  return nombreCompleto(a).localeCompare(nombreCompleto(b), 'es', { sensitivity: 'base' })
}

function compararRanking(a: ColaboradorMarketplace, b: ColaboradorMarketplace): number {
  return (
    b.calificacionPromedio - a.calificacionPromedio ||
    b.cantidadResenas - a.cantidadResenas ||
    compararNombre(a, b)
  )
}

function puntajeRelevancia(
  profesional: ColaboradorMarketplace,
  especialidades: EspecialidadProfesional[],
  consultaNormalizada: string,
): number {
  const nombre = normalizar(nombreCompleto(profesional))
  if (nombre === consultaNormalizada) return 3
  if (nombre.includes(consultaNormalizada)) return 2

  const camposPrincipales = [
    profesional.profesion,
    profesional.areaEspecializacion,
    ...nombresEspecialidades(profesional, especialidades),
  ]
  if (camposPrincipales.some((campo) => normalizar(campo).includes(consultaNormalizada))) return 1

  return 0
}

export function ordenarProfesionales({
  profesionales,
  especialidades,
  orden,
  busqueda = '',
}: {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  orden: OrdenMarketplace
  busqueda?: string
}): ColaboradorMarketplace[] {
  const consulta = normalizar(busqueda)

  return [...profesionales].sort((a, b) => {
    switch (orden) {
      case 'MEJOR_CALIFICADOS':
        return b.calificacionPromedio - a.calificacionPromedio || compararNombre(a, b)
      case 'MAS_RESENAS':
        return b.cantidadResenas - a.cantidadResenas || compararNombre(a, b)
      case 'MENOR_PRECIO':
        return a.tarifaReferencial - b.tarifaReferencial || compararNombre(a, b)
      case 'MAYOR_EXPERIENCIA':
        return b.aniosExperiencia - a.aniosExperiencia || compararNombre(a, b)
      case 'RELEVANCIA':
        if (consulta === '') return compararRanking(a, b)
        return (
          puntajeRelevancia(b, especialidades, consulta) -
            puntajeRelevancia(a, especialidades, consulta) || compararRanking(a, b)
        )
    }
  })
}

export function paginar({
  profesionales,
  paginaSolicitada,
  porPagina = 6,
}: {
  profesionales: ColaboradorMarketplace[]
  paginaSolicitada: number
  porPagina?: number
}): PaginaMarketplace {
  const tamanioPagina =
    Number.isFinite(porPagina) && porPagina > 0 ? Math.floor(porPagina) : 6
  const total = profesionales.length
  const totalPaginas = Math.ceil(total / tamanioPagina)

  if (totalPaginas === 0) {
    return { items: [], total, totalPaginas: 0, pagina: 0 }
  }

  const paginaEntera = Number.isFinite(paginaSolicitada) ? Math.floor(paginaSolicitada) : 1
  const pagina = Math.min(Math.max(paginaEntera, 1), totalPaginas)
  const inicio = (pagina - 1) * tamanioPagina

  return {
    items: profesionales.slice(inicio, inicio + tamanioPagina),
    total,
    totalPaginas,
    pagina,
  }
}

export function derivarDestacados({
  profesionales,
  cantidad = 10,
}: {
  profesionales: ColaboradorMarketplace[]
  cantidad?: number
}): ColaboradorMarketplace[] {
  const limite = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 10
  return profesionales.filter(esPublicable).sort(compararRanking).slice(0, limite)
}

function fechaUtc(fecha: string): Date {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia))
}

function fechaIso(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

function sumarDias(fecha: string, dias: number): string {
  const resultado = fechaUtc(fecha)
  resultado.setUTCDate(resultado.getUTCDate() + dias)
  return fechaIso(resultado)
}

function diaSemanaIso(fecha: string): HorarioDisponibilidad['diaSemana'] {
  const diaUtc = fechaUtc(fecha).getUTCDay()
  return (diaUtc === 0 ? 7 : diaUtc) as HorarioDisponibilidad['diaSemana']
}

function horaAMinutos(hora: string): number {
  const [horas, minutos] = hora.split(':').map(Number)
  if (
    !Number.isInteger(horas) ||
    !Number.isInteger(minutos) ||
    horas < 0 ||
    horas > 23 ||
    minutos < 0 ||
    minutos > 59
  ) {
    return Number.NaN
  }
  return horas * 60 + minutos
}

function minutosAHora(minutosTotales: number): string {
  const horas = Math.floor(minutosTotales / 60)
  const minutos = minutosTotales % 60
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`
}

function horarioCompatible(
  horario: HorarioDisponibilidad,
  servicio: ServicioProfesional,
): boolean {
  return horario.modalidad === 'AMBAS' || horario.modalidad === servicio.modalidad
}

function seSolapan(
  inicioA: number,
  finA: number,
  inicioB: number,
  finB: number,
): boolean {
  return inicioA < finB && finA > inicioB
}

export function generarSlots({
  servicio,
  fecha,
  horarios,
  bloqueos,
}: {
  servicio: ServicioProfesional
  fecha: string
  horarios: HorarioDisponibilidad[]
  bloqueos: BloqueoAgenda[]
}): SlotMarketplace[] {
  if (!servicio.activo || fecha < HOY_MARKETPLACE || servicio.duracionEstimadaMinutos <= 0) return []

  const diaSemana = diaSemanaIso(fecha)
  const minutoActual = horaAMinutos(AHORA_MARKETPLACE.slice(11, 16))
  const slots: SlotMarketplace[] = []
  const vistos = new Set<string>()

  const franjas = horarios.filter(
    (horario) =>
      horario.activo &&
      horario.colaboradorId === servicio.colaboradorId &&
      horario.diaSemana === diaSemana &&
      horarioCompatible(horario, servicio),
  )

  for (const franja of franjas) {
    const inicioFranja = horaAMinutos(franja.horaInicio)
    const finFranja = horaAMinutos(franja.horaFin)
    if (!Number.isFinite(inicioFranja) || !Number.isFinite(finFranja) || inicioFranja >= finFranja) {
      continue
    }

    for (
      let inicio = inicioFranja;
      inicio + servicio.duracionEstimadaMinutos <= finFranja;
      inicio += servicio.duracionEstimadaMinutos
    ) {
      if (fecha === HOY_MARKETPLACE && inicio < minutoActual) continue

      const fin = inicio + servicio.duracionEstimadaMinutos
      const horaInicio = minutosAHora(inicio)
      const horaFin = minutosAHora(fin)
      const clave = `${horaInicio}-${horaFin}`
      if (vistos.has(clave)) continue

      const ocupado = bloqueos.some((bloqueo) => {
        if (bloqueo.colaboradorId !== servicio.colaboradorId || bloqueo.fecha !== fecha) return false
        const inicioBloqueo = horaAMinutos(bloqueo.horaInicio)
        const finBloqueo = horaAMinutos(bloqueo.horaFin)
        return (
          Number.isFinite(inicioBloqueo) &&
          Number.isFinite(finBloqueo) &&
          seSolapan(inicio, fin, inicioBloqueo, finBloqueo)
        )
      })

      vistos.add(clave)
      slots.push({ horaInicio, horaFin, ocupado })
    }
  }

  return slots.sort((a, b) => a.horaInicio.localeCompare(b.horaInicio))
}

export function proximasFechasDisponibles({
  servicio,
  horarios,
  bloqueos,
  cantidad = 5,
  diasMaximos = 30,
  desde = HOY_MARKETPLACE,
}: {
  servicio: ServicioProfesional
  horarios: HorarioDisponibilidad[]
  bloqueos: BloqueoAgenda[]
  cantidad?: number
  diasMaximos?: number
  desde?: string
}): string[] {
  const limite = Number.isFinite(cantidad) ? Math.max(0, Math.floor(cantidad)) : 5
  const alcance = Number.isFinite(diasMaximos) ? Math.max(0, Math.floor(diasMaximos)) : 30
  const fechaBase = desde < HOY_MARKETPLACE ? HOY_MARKETPLACE : desde
  const fechas: string[] = []

  for (let desplazamiento = 1; desplazamiento <= alcance && fechas.length < limite; desplazamiento++) {
    const fecha = sumarDias(fechaBase, desplazamiento)
    if (generarSlots({ servicio, fecha, horarios, bloqueos }).some((slot) => !slot.ocupado)) {
      fechas.push(fecha)
    }
  }

  return fechas
}

export function obtenerIniciales({ nombres, apellidos }: { nombres: string; apellidos: string }): string {
  const primerNombre = nombres.trim().split(/\s+/)[0] ?? ''
  const primerApellido = apellidos.trim().split(/\s+/)[0] ?? ''
  return `${Array.from(primerNombre)[0] ?? ''}${Array.from(primerApellido)[0] ?? ''}`.toLocaleUpperCase(
    'es',
  )
}
```

- [ ] **Step 2: Crear `src/portal/marketplace/formato.ts` reutilizando los helpers existentes**

```ts
import { formatUSD } from '@/portal/financiero/formato'
import { capitalizar, formatFecha } from '@/portal/obligaciones/formato'
import type { ModalidadAtencion, ServicioProfesional } from '@/portal/types'

const ETIQUETA_MODALIDAD: Record<ModalidadAtencion, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
  AMBAS: 'Mixta',
}

const DIAS_CORTOS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']

export function formatModalidad(modalidad: ModalidadAtencion): string {
  return ETIQUETA_MODALIDAD[modalidad]
}

export function formatDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} min`
  const horas = Math.floor(minutos / 60)
  const minutosRestantes = minutos % 60
  return minutosRestantes === 0 ? `${horas} h` : `${horas} h ${minutosRestantes} min`
}

export function formatRangoHorario({
  horaInicio,
  horaFin,
}: {
  horaInicio: string
  horaFin: string
}): string {
  return `${horaInicio} – ${horaFin}`
}

export function formatFechaDisponible(fecha: string): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay()
  return `${capitalizar(DIAS_CORTOS[diaSemana])} · ${formatFecha(fecha)}`
}

export function formatEstrellas(calificacion: number): string {
  const llenas = Math.round(Math.min(5, Math.max(0, calificacion)))
  return `${'★'.repeat(llenas)}${'☆'.repeat(5 - llenas)}`
}

export function formatResumenCalificacion({
  calificacion,
  cantidadResenas,
}: {
  calificacion: number
  cantidadResenas: number
}): string {
  return `${calificacion.toFixed(1)} (${cantidadResenas} ${cantidadResenas === 1 ? 'reseña' : 'reseñas'})`
}

export function formatTarifaHora(tarifa: number): string {
  return `${formatUSD(tarifa)}/hora`
}

export function formatMetaServicio(
  servicio: Pick<
    ServicioProfesional,
    'duracionEstimadaMinutos' | 'modalidad' | 'tarifaReferencial'
  >,
): string {
  return `${formatDuracion(servicio.duracionEstimadaMinutos)} · ${formatModalidad(servicio.modalidad)} · ${formatUSD(servicio.tarifaReferencial)}`
}
```

- [ ] **Step 3: Verificar búsqueda, filtros, órdenes, paginación y destacados**

Run:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { COLABORADORES_MARKETPLACE, ESPECIALIDADES_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts"; import { derivarDestacados, FILTROS_INICIALES, filtrarProfesionales, ordenarProfesionales, paginar } from "./src/portal/marketplace/calculo.ts"; const filtrar=(cambios={})=>filtrarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,filtros:{...FILTROS_INICIALES,...cambios}}); assert.deepEqual(filtrar({busqueda:"maria jose ramirez"}).map((x)=>x.id),["col-01"]); assert.deepEqual(filtrar({busqueda:"CUENCA"}).map((x)=>x.id).sort(),["col-03","col-09"]); assert.deepEqual(filtrar({especialidadId:"esp-laboral"}).map((x)=>x.id).sort(),["col-02","col-09"]); assert.equal(filtrar({tarifaMaxima:30}).length,4); assert.equal(filtrar({calificacionMinima:4.9}).length,4); assert.equal(filtrar({modalidad:"VIRTUAL"}).length,10); assert.equal(filtrar({modalidad:"PRESENCIAL"}).length,7); assert.equal(filtrar({modalidad:"AMBAS"}).length,5); assert.deepEqual(filtrar({especialidadId:"esp-laboral",modalidad:"PRESENCIAL",tarifaMaxima:42}).map((x)=>x.id),["col-09"]); const idsFuente=COLABORADORES_MARKETPLACE.map((x)=>x.id); const relevancia=ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"RELEVANCIA"}); assert.deepEqual(relevancia.slice(0,4).map((x)=>x.id),["col-07","col-01","col-09","col-03"]); assert.equal(ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"RELEVANCIA",busqueda:"maria jose ramirez alvear"})[0].id,"col-01"); assert.deepEqual(ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"MEJOR_CALIFICADOS"}).slice(0,4).map((x)=>x.id),["col-07","col-03","col-09","col-01"]); assert.equal(ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"MAS_RESENAS"})[0].id,"col-07"); assert.equal(ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"MENOR_PRECIO"})[0].id,"col-08"); assert.equal(ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"MAYOR_EXPERIENCIA"})[0].id,"col-10"); assert.deepEqual(COLABORADORES_MARKETPLACE.map((x)=>x.id),idsFuente); assert.deepEqual(paginar({profesionales:relevancia,paginaSolicitada:1}),{items:relevancia.slice(0,6),total:12,totalPaginas:2,pagina:1}); assert.equal(paginar({profesionales:relevancia,paginaSolicitada:99}).pagina,2); assert.deepEqual(paginar({profesionales:[],paginaSolicitada:1}),{items:[],total:0,totalPaginas:0,pagina:0}); const destacados=derivarDestacados({profesionales:COLABORADORES_MARKETPLACE}); assert.equal(destacados.length,10); assert.deepEqual(destacados.slice(0,4).map((x)=>x.id),["col-07","col-01","col-09","col-03"]); console.log("OK consultas marketplace");'
```

Expected: `OK consultas marketplace`.

Run the publicability exclusions independently of the all-public seed:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { COLABORADORES_MARKETPLACE, ESPECIALIDADES_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts"; import { FILTROS_INICIALES, filtrarProfesionales } from "./src/portal/marketplace/calculo.ts"; const base=COLABORADORES_MARKETPLACE[0];const oculto={...base,id:"sintetico-oculto",visibleMarketplace:false};const suspendido={...base,id:"sintetico-suspendido",estado:"SUSPENDIDO" as const};const noDisponible={...base,id:"sintetico-no-disponible",estadoDisponibilidad:"NO_DISPONIBLE" as const};const resultado=filtrarProfesionales({profesionales:[base,oculto,suspendido,noDisponible],especialidades:ESPECIALIDADES_PROFESIONALES,filtros:FILTROS_INICIALES});assert.deepEqual(resultado.map((x)=>x.id),[base.id]);console.log("OK exclusion de perfiles no publicables");'
```

Expected: `OK exclusion de perfiles no publicables`.

- [ ] **Step 4: Verificar fechas, slots, bloqueos y formatos**

Run:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { BLOQUEOS_AGENDA, HORARIOS_DISPONIBILIDAD, SERVICIOS_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts"; import { generarSlots, HOY_MARKETPLACE, obtenerIniciales, proximasFechasDisponibles } from "./src/portal/marketplace/calculo.ts"; import { formatDuracion, formatEstrellas, formatFechaDisponible, formatMetaServicio, formatModalidad, formatRangoHorario, formatResumenCalificacion, formatTarifaHora } from "./src/portal/marketplace/formato.ts"; const servicio60=SERVICIOS_PROFESIONALES.find((x)=>x.colaboradorId==="col-01"&&x.duracionEstimadaMinutos===60); const servicio90=SERVICIOS_PROFESIONALES.find((x)=>x.colaboradorId==="col-01"&&x.duracionEstimadaMinutos===90); assert.ok(servicio60); assert.ok(servicio90); const slots=generarSlots({servicio:servicio60,fecha:"2026-08-14",horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA}); assert.deepEqual(slots.map((x)=>`${x.horaInicio}:${x.ocupado}`),["09:00:false","10:00:true","11:00:false","12:00:false"]); assert.equal(generarSlots({servicio:servicio60,fecha:"2026-08-12",horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA}).length,0); const fechas60=proximasFechasDisponibles({servicio:servicio60,horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA}); const fechas90=proximasFechasDisponibles({servicio:servicio90,horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA}); assert.deepEqual(fechas60,["2026-08-14","2026-08-17","2026-08-19","2026-08-21","2026-08-24"]); assert.deepEqual(fechas90,["2026-08-17","2026-08-19","2026-08-21","2026-08-24","2026-08-26"]); assert.ok(fechas60.every((fecha)=>fecha>HOY_MARKETPLACE&&fecha<="2026-09-12")); assert.equal(proximasFechasDisponibles({servicio:servicio60,horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA,cantidad:2}).length,2); assert.deepEqual(proximasFechasDisponibles({servicio:{...servicio60,modalidad:"PRESENCIAL"},horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA}),[]); assert.equal(obtenerIniciales({nombres:"María José",apellidos:"Ramírez Alvear"}),"MR"); assert.equal(formatModalidad("AMBAS"),"Mixta"); assert.equal(formatDuracion(90),"1 h 30 min"); assert.equal(formatRangoHorario({horaInicio:"09:00",horaFin:"10:30"}),"09:00 – 10:30"); assert.equal(formatEstrellas(4.9),"★★★★★"); assert.equal(formatResumenCalificacion({calificacion:4.9,cantidadResenas:98}),"4.9 (98 reseñas)"); assert.equal(formatFechaDisponible("2026-08-14"),"Vie · 14 ago 2026"); assert.match(formatTarifaHora(35),/35/); assert.match(formatMetaServicio(servicio60),/1 h · Virtual · .*35/); console.log("OK agenda y formato marketplace");'
```

Expected: `OK agenda y formato marketplace`.

- [ ] **Step 5: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0; Vite genera `dist/` sin errores de tipos ni imports no usados.

- [ ] **Step 6: Commit**

```bash
git add src/portal/marketplace/calculo.ts src/portal/marketplace/formato.ts
git commit -m "feat: agregar logica pura del marketplace"
```

---

### Task 4: Guardar solicitudes de contacto por empresa

**Files:**
- Modify: `src/portal/data/mock-portal-data.ts`
- Modify: `src/portal/PortalDataContext.tsx`

**Interfaces:**
- Consumes: `SolicitudContacto`, `NuevaSolicitudContacto`, `AHORA_MARKETPLACE`,
  `SERVICIOS_PROFESIONALES` y las empresas actuales del contexto.
- Produces: `solicitudesContacto: Record<string, SolicitudContacto[]>` y
  `enviarSolicitudContacto(empresaId, nueva): SolicitudContacto | null`.

- [ ] **Step 1: Añadir la semilla vacía de solicitudes por empresa**

Agregar `SolicitudContacto` al import de tipos de `src/portal/data/mock-portal-data.ts` y este bloque al
final del archivo:

```ts
export const solicitudesContactoSemilla: Record<string, SolicitudContacto[]> = {
  'emp-1': [],
  'emp-2': [],
}
```

- [ ] **Step 2: Extender el contrato y el estado de `PortalDataContext`**

Reemplazar el import de tipos por:

```ts
import type {
  Empresa,
  NuevaSolicitudContacto,
  ObligacionEmpresa,
  RegistroFinanciero,
  Simulacion,
  SolicitudContacto,
} from './types'
```

Agregar `solicitudesContactoSemilla` al import de `./data/mock-portal-data` y añadir:

```ts
import { SERVICIOS_PROFESIONALES } from './marketplace/catalogo'
import { AHORA_MARKETPLACE } from './marketplace/calculo'
```

Agregar al tipo `PortalDataContextValue`:

```ts
solicitudesContacto: Record<string, SolicitudContacto[]>
enviarSolicitudContacto: (
  empresaId: string,
  nueva: NuevaSolicitudContacto,
) => SolicitudContacto | null
```

Agregar junto al resto de los estados:

```ts
const [solicitudesContacto, setSolicitudesContacto] = useState<
  Record<string, SolicitudContacto[]>
>(solicitudesContactoSemilla)
```

- [ ] **Step 3: Implementar la mutación con validación de integridad**

Agregar después de `guardarSimulacion`:

```ts
const enviarSolicitudContacto = (
  empresaId: string,
  nueva: NuevaSolicitudContacto,
): SolicitudContacto | null => {
  const empresaExiste = empresas.some((empresa) => empresa.id === empresaId)
  const servicio = SERVICIOS_PROFESIONALES.find(
    (item) =>
      item.id === nueva.servicioId &&
      item.colaboradorId === nueva.colaboradorId &&
      item.activo,
  )
  const descripcion = nueva.descripcion.trim()

  if (
    !empresaExiste ||
    !servicio ||
    !nueva.fechaPreferida ||
    !nueva.horaPreferida ||
    !descripcion
  ) {
    return null
  }

  const solicitud: SolicitudContacto = {
    ...nueva,
    descripcion,
    id: crypto.randomUUID(),
    estado: 'ENVIADA',
    createdAt: AHORA_MARKETPLACE,
  }

  setSolicitudesContacto((current) => ({
    ...current,
    [empresaId]: [solicitud, ...(current[empresaId] ?? [])],
  }))

  return solicitud
}
```

Exponer al final del `value` del provider:

```ts
solicitudesContacto,
enviarSolicitudContacto,
```

No agregar localStorage, pagos, citas, cambios de estado ni historial visual.

- [ ] **Step 4: Verificar y confirmar**

Run: `npm run build`

Expected: exit code 0; el contexto compila y las semillas siguen separadas por `empresaId`.

```bash
git add src/portal/data/mock-portal-data.ts src/portal/PortalDataContext.tsx
git commit -m "feat: guardar solicitudes del marketplace por empresa"
```

---

### Task 5: Tarjeta reutilizable y carrusel responsive de destacados

**Files:**
- Create: `src/portal/marketplace/ProfesionalCard.tsx`
- Create: `src/portal/marketplace/DestacadosCarousel.tsx`

**Interfaces:**
- Consumes: `ColaboradorMarketplace` y `EspecialidadProfesional` de Task 1; `obtenerIniciales` de
  `marketplace/calculo.ts`; `formatModalidad`, `formatResumenCalificacion` y `formatTarifaHora` de
  `marketplace/formato.ts` (Task 3).
- Produces:
  - `ProfesionalCard({ profesional, especialidades, compacta?, onVerPerfil, onSolicitarContacto?, puedeSolicitarContacto? })`.
  - `DestacadosCarousel({ profesionales, especialidades, onVerPerfil })`, con ventana 3/2/1 y controles
    realmente deshabilitados en los extremos.

- [ ] **Step 1: Crear `src/portal/marketplace/ProfesionalCard.tsx`**

```tsx
import { useId } from 'react'
import { MapPin, Star } from 'lucide-react'
import type { ColaboradorMarketplace, EspecialidadProfesional } from '@/portal/types'
import { obtenerIniciales } from './calculo'
import { formatModalidad, formatResumenCalificacion, formatTarifaHora } from './formato'

export type ProfesionalCardProps = {
  profesional: ColaboradorMarketplace
  especialidades: EspecialidadProfesional[]
  compacta?: boolean
  onVerPerfil: (profesionalId: string) => void
  onSolicitarContacto?: (profesional: ColaboradorMarketplace) => void
  puedeSolicitarContacto?: boolean
}

export function ProfesionalCard({
  profesional,
  especialidades,
  compacta = false,
  onVerPerfil,
  onSolicitarContacto,
  puedeSolicitarContacto = false,
}: ProfesionalCardProps) {
  const tituloId = useId()
  const especialidadPrincipal =
    especialidades.find((especialidad) => especialidad.id === profesional.especialidadPrincipalId)?.nombre ??
    profesional.areaEspecializacion
  const resumenCalificacion = formatResumenCalificacion({
    calificacion: profesional.calificacionPromedio,
    cantidadResenas: profesional.cantidadResenas,
  })

  if (compacta) {
    return (
      <article
        aria-labelledby={tituloId}
        className="flex min-h-[112px] items-center gap-3 rounded-xl border border-line bg-card p-3.5"
      >
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-navy-100 text-[15px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={tituloId} className="truncate text-[14px] font-semibold text-ink-900">
            {profesional.nombres} {profesional.apellidos}
          </h3>
          <p className="mt-0.5 truncate text-[12px] text-ink-500">{especialidadPrincipal}</p>
          <p className="mt-1 flex flex-wrap items-center gap-1 text-[12px] text-ink-700">
            <Star className="h-3.5 w-3.5 fill-amber-deep text-amber-deep" aria-hidden="true" />
            <span aria-label={resumenCalificacion}>
              {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas})
            </span>
            <span aria-hidden="true">·</span>
            <span>{formatTarifaHora(profesional.tarifaReferencial)}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onVerPerfil(profesional.id)}
          aria-label={`Ver perfil de ${profesional.nombres} ${profesional.apellidos}`}
          className="min-h-10 shrink-0 rounded-lg border border-line bg-card px-3 text-[12px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Ver
        </button>
      </article>
    )
  }

  return (
    <article
      aria-labelledby={tituloId}
      className="flex min-h-[330px] flex-col gap-2.5 rounded-xl border border-line bg-card p-4"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-13 w-13 shrink-0 place-items-center rounded-full bg-navy-100 text-[16px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0">
          <h3 id={tituloId} className="text-[15px] font-semibold leading-snug text-ink-900">
            {profesional.nombres} {profesional.apellidos}
          </h3>
          <p className="mt-0.5 flex items-center gap-1 text-[12.5px] text-ink-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">
              {profesional.profesion} · {profesional.ciudadAtencion}, {profesional.paisAtencion}
            </span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5" aria-label="Especialidades">
        {especialidades.map((especialidad) => (
          <span
            key={especialidad.id}
            className="rounded-full bg-navy-100 px-2.5 py-1 text-[11px] font-semibold text-navy-700"
          >
            {especialidad.nombre}
          </span>
        ))}
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-700">
        <span>{profesional.aniosExperiencia} años de experiencia</span>
        <span aria-hidden="true">·</span>
        <Star className="h-3.5 w-3.5 fill-amber-deep text-amber-deep" aria-hidden="true" />
        <span aria-label={resumenCalificacion}>
          {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas} reseñas)
        </span>
      </p>

      <p className="line-clamp-3 text-[12.5px] leading-relaxed text-ink-700">
        {profesional.descripcionProfesional}
      </p>

      <p className="mt-auto text-[13.5px] font-bold text-ink-900">
        {formatTarifaHora(profesional.tarifaReferencial)}
        <span className="ml-1.5 text-[11.5px] font-medium text-ink-500">
          · {formatModalidad(profesional.modalidadAtencion)}
        </span>
      </p>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => onVerPerfil(profesional.id)}
          className="min-h-11 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Ver perfil
        </button>
        {onSolicitarContacto && (
          <button
            type="button"
            disabled={!puedeSolicitarContacto}
            onClick={() => {
              if (puedeSolicitarContacto) onSolicitarContacto(profesional)
            }}
            className="min-h-11 rounded-lg bg-navy-600 px-3 text-[12.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            {puedeSolicitarContacto ? 'Solicitar contacto' : 'Sin servicios activos'}
          </button>
        )}
      </div>
      {onSolicitarContacto && !puedeSolicitarContacto && (
        <p className="text-[11.5px] text-ink-500">
          Este profesional no tiene servicios activos por el momento.
        </p>
      )}
    </article>
  )
}
```

- [ ] **Step 2: Crear `src/portal/marketplace/DestacadosCarousel.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ColaboradorMarketplace, EspecialidadProfesional } from '@/portal/types'
import { ProfesionalCard } from './ProfesionalCard'

type DestacadosCarouselProps = {
  profesionales: ColaboradorMarketplace[]
  especialidades: EspecialidadProfesional[]
  onVerPerfil: (profesionalId: string) => void
}

function cantidadVisibleActual(): 1 | 2 | 3 {
  if (typeof window === 'undefined') return 3
  if (window.matchMedia('(min-width: 1024px)').matches) return 3
  if (window.matchMedia('(min-width: 768px)').matches) return 2
  return 1
}

function useCantidadVisible(): 1 | 2 | 3 {
  const [cantidad, setCantidad] = useState<1 | 2 | 3>(cantidadVisibleActual)

  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const tablet = window.matchMedia('(min-width: 768px)')
    const actualizar = () => setCantidad(cantidadVisibleActual())

    desktop.addEventListener('change', actualizar)
    tablet.addEventListener('change', actualizar)
    actualizar()

    return () => {
      desktop.removeEventListener('change', actualizar)
      tablet.removeEventListener('change', actualizar)
    }
  }, [])

  return cantidad
}

export function DestacadosCarousel({
  profesionales,
  especialidades,
  onVerPerfil,
}: DestacadosCarouselProps) {
  const cantidadVisible = useCantidadVisible()
  const [indice, setIndice] = useState(0)
  const maximo = Math.max(0, profesionales.length - cantidadVisible)

  useEffect(() => {
    setIndice((actual) => Math.min(actual, maximo))
  }, [maximo])

  if (profesionales.length === 0) return null

  const visibles = profesionales.slice(indice, indice + cantidadVisible)
  const inicioHumano = indice + 1
  const finHumano = indice + visibles.length

  return (
    <section aria-labelledby="marketplace-destacados">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <h2 id="marketplace-destacados" className="text-[18px] font-semibold text-ink-900">
          Profesionales destacados
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setIndice((actual) => Math.max(0, actual - 1))}
            disabled={indice === 0}
            aria-label="Mostrar profesionales destacados anteriores"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setIndice((actual) => Math.min(maximo, actual + 1))}
            disabled={indice >= maximo}
            aria-label="Mostrar profesionales destacados siguientes"
            className="grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-ink-700 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Mostrando profesionales {inicioHumano} a {finHumano} de {profesionales.length}
      </p>

      <div className="mt-3 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {visibles.map((profesional) => (
          <ProfesionalCard
            key={profesional.id}
            profesional={profesional}
            especialidades={especialidades.filter((especialidad) =>
              profesional.especialidadIds.includes(especialidad.id),
            )}
            compacta
            onVerPerfil={onVerPerfil}
          />
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Verificar TypeScript y producción**

Run: `npm run build`

Expected: exit code 0; Vite genera `dist/` sin errores de tipos, imports ni clases.

- [ ] **Step 4: Commit**

```bash
git add src/portal/marketplace/ProfesionalCard.tsx src/portal/marketplace/DestacadosCarousel.tsx
git commit -m "feat: agregar tarjetas y carrusel del marketplace"
```

---

### Task 6: Modal accesible para enviar una solicitud

**Files:**
- Create: `src/portal/marketplace/ReservaModal.tsx`

**Interfaces:**
- Consumes from Task 1: `ColaboradorMarketplace`, `ServicioProfesional` and `SolicitudContacto`.
- Consumes from Task 2: `serviciosActivosDeColaborador(id)`, `horariosActivosDeColaborador(id)` and
  `bloqueosDeColaborador(id)`.
- Consumes from Task 3:
  - `proximasFechasDisponibles({ servicio, horarios, bloqueos, cantidad?, diasMaximos?, desde? }): string[]`.
  - `generarSlots({ servicio, fecha, horarios, bloqueos }): SlotMarketplace[]`.
  - `SlotMarketplace` has `{ horaInicio, horaFin, ocupado }`.
  - `nombreCompleto(colaborador)` and `obtenerIniciales({ nombres, apellidos })`.
  - `formatModalidad`, `formatDuracion`, `formatRangoHorario({ horaInicio, horaFin })`,
    `formatFechaDisponible` and `formatMetaServicio`; `formatUSD` comes from the existing financial helper.
- Consumes from Task 4: `usePortalData()` exposes `empresaActiva`, `empresaActivaId` and
  `enviarSolicitudContacto(empresaId, nueva): SolicitudContacto | null`.
- Produces: `ReservaModal({ abierto, profesional, onCerrar })`, reused by Marketplace and professional profile;
  `profesional` is non-null whenever the component is mounted.

- [ ] **Step 1: Create `src/portal/marketplace/ReservaModal.tsx`**

```tsx
import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Send,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import type {
  ColaboradorMarketplace,
  ServicioProfesional,
  SolicitudContacto,
} from '@/portal/types'
import {
  bloqueosDeColaborador,
  horariosActivosDeColaborador,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  generarSlots,
  nombreCompleto,
  obtenerIniciales,
  proximasFechasDisponibles,
} from './calculo'
import {
  formatDuracion,
  formatFechaDisponible,
  formatMetaServicio,
  formatModalidad,
  formatRangoHorario,
} from './formato'

type PasoReserva = 1 | 2 | 3 | 'EXITO'

type ReservaModalProps = {
  abierto: boolean
  profesional: ColaboradorMarketplace
  onCerrar: () => void
}

type ResumenSolicitudProps = {
  empresaNombre: string
  colaborador: ColaboradorMarketplace
  servicio: ServicioProfesional
  fecha: string
  horaInicio: string
  horaFin: string
  descripcion: string
}

const PASOS = [
  { numero: 1, label: 'Servicio' },
  { numero: 2, label: 'Fecha y hora' },
  { numero: 3, label: 'Confirmar' },
] as const

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function ResumenSolicitud({
  empresaNombre,
  colaborador,
  servicio,
  fecha,
  horaInicio,
  horaFin,
  descripcion,
}: ResumenSolicitudProps) {
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-surface/50">
        <div className="flex gap-3 px-4 py-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Empresa</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{empresaNombre}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Profesional y servicio</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{nombreCompleto(colaborador)}</dd>
            <dd className="text-xs text-ink-500">{servicio.nombre}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Fecha preferida</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{formatFechaDisponible(fecha)}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Horario preferido</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">
              {formatRangoHorario({ horaInicio, horaFin })} · GMT-5
            </dd>
            <dd className="text-xs text-ink-500">
              {formatDuracion(servicio.duracionEstimadaMinutos)} · {formatModalidad(servicio.modalidad)}
            </dd>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-ink-500">Tarifa referencial</dt>
          <dd className="num text-sm font-semibold text-ink-900">
            {formatUSD(servicio.tarifaReferencial)}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-line/70 bg-card px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Tu necesidad</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-700">{descripcion}</p>
      </div>

      <p className="text-xs leading-5 text-ink-500">
        Esta es una solicitud de contacto. La fecha y hora son preferidas y todavía no constituyen una cita confirmada.
      </p>
    </div>
  )
}

export function ReservaModal({ abierto, profesional, onCerrar }: ReservaModalProps) {
  const { empresaActiva, empresaActivaId, enviarSolicitudContacto } = usePortalData()
  const colaborador = profesional
  const colaboradorId = profesional.id

  const servicios = useMemo(
    () => serviciosActivosDeColaborador(colaboradorId),
    [colaboradorId],
  )
  const horarios = useMemo(
    () => horariosActivosDeColaborador(colaboradorId),
    [colaboradorId],
  )
  const bloqueos = useMemo(
    () => bloqueosDeColaborador(colaboradorId),
    [colaboradorId],
  )

  const [paso, setPaso] = useState<PasoReserva>(1)
  const [servicioId, setServicioId] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [intentoPasoDos, setIntentoPasoDos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [solicitudCreada, setSolicitudCreada] = useState<SolicitudContacto | null>(null)
  const [empresaOrigenNombre, setEmpresaOrigenNombre] = useState('')

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const pasoTitleRef = useRef<HTMLHeadingElement>(null)
  const fechaGroupRef = useRef<HTMLDivElement>(null)
  const horaGroupRef = useRef<HTMLDivElement>(null)
  const descripcionRef = useRef<HTMLTextAreaElement>(null)
  const pasoAnteriorRef = useRef<PasoReserva | null>(null)
  const empresaAlAbrirRef = useRef<string | null>(null)
  const enviandoRef = useRef(false)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  const reiniciarDraft = useCallback(() => {
    setPaso(1)
    setServicioId(servicios[0]?.id ?? '')
    setFechaSeleccionada('')
    setHoraSeleccionada('')
    setDescripcion('')
    setIntentoPasoDos(false)
    setEnviando(false)
    setErrorEnvio('')
    setSolicitudCreada(null)
    setEmpresaOrigenNombre('')
    enviandoRef.current = false
    pasoAnteriorRef.current = null
  }, [servicios])

  const cerrar = useCallback(() => {
    reiniciarDraft()
    empresaAlAbrirRef.current = null
    onCerrarRef.current()
  }, [reiniciarDraft])

  useEffect(() => {
    if (!abierto) return
    reiniciarDraft()
    empresaAlAbrirRef.current = empresaActivaId
  }, [abierto, colaboradorId, reiniciarDraft])

  useEffect(() => {
    if (
      abierto &&
      empresaAlAbrirRef.current !== null &&
      empresaAlAbrirRef.current !== empresaActivaId
    ) {
      cerrar()
    }
  }, [abierto, cerrar, empresaActivaId])

  const servicioSeleccionado = useMemo(
    () => servicios.find((servicio) => servicio.id === servicioId),
    [servicioId, servicios],
  )

  const fechasDisponibles = useMemo(() => {
    if (!servicioSeleccionado) return []
    return proximasFechasDisponibles({
      servicio: servicioSeleccionado,
      horarios,
      bloqueos,
    })
  }, [bloqueos, colaborador, horarios, servicioSeleccionado])

  useEffect(() => {
    if (!abierto || !servicioSeleccionado) return
    setFechaSeleccionada(fechasDisponibles[0] ?? '')
    setHoraSeleccionada('')
  }, [abierto, fechasDisponibles, servicioSeleccionado])

  const slots = useMemo(() => {
    if (!servicioSeleccionado || !fechaSeleccionada) return []
    return generarSlots({
      fecha: fechaSeleccionada,
      servicio: servicioSeleccionado,
      horarios,
      bloqueos,
    })
  }, [bloqueos, colaborador, fechaSeleccionada, horarios, servicioSeleccionado])

  const slotSeleccionado = useMemo(
    () => slots.find((slot) => slot.horaInicio === horaSeleccionada && !slot.ocupado),
    [horaSeleccionada, slots],
  )

  useEffect(() => {
    if (!abierto) return

    const focoAnterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => dialogTitleRef.current?.focus())

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cerrar()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (elemento) =>
          !elemento.hasAttribute('disabled') &&
          elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        dialogTitleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (event.shiftKey && (activo === primero || !dialog.contains(activo))) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (activo === ultimo || !dialog.contains(activo))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [abierto, cerrar])

  useEffect(() => {
    if (!abierto) {
      pasoAnteriorRef.current = null
      return
    }
    if (pasoAnteriorRef.current === null) {
      pasoAnteriorRef.current = paso
      return
    }
    if (pasoAnteriorRef.current !== paso) {
      const frame = window.requestAnimationFrame(() => pasoTitleRef.current?.focus())
      pasoAnteriorRef.current = paso
      return () => window.cancelAnimationFrame(frame)
    }
    pasoAnteriorRef.current = paso
  }, [abierto, paso])

  if (!abierto) return null

  const descripcionLimpia = descripcion.trim()
  const errorFecha = intentoPasoDos && !fechaSeleccionada
  const errorHora = intentoPasoDos && !slotSeleccionado
  const errorDescripcion = intentoPasoDos && !descripcionLimpia

  const seleccionarServicio = (id: string) => {
    if (id === servicioId) return
    setServicioId(id)
    setFechaSeleccionada('')
    setHoraSeleccionada('')
    setIntentoPasoDos(false)
    setErrorEnvio('')
  }

  const seleccionarFecha = (fecha: string) => {
    setFechaSeleccionada(fecha)
    setHoraSeleccionada('')
    setErrorEnvio('')
  }

  const continuarDesdeAgenda = () => {
    setIntentoPasoDos(true)

    if (!fechaSeleccionada) {
      fechaGroupRef.current?.focus()
      return
    }
    if (!slotSeleccionado) {
      horaGroupRef.current?.focus()
      return
    }
    if (!descripcionLimpia) {
      descripcionRef.current?.focus()
      return
    }

    setIntentoPasoDos(false)
    setPaso(3)
  }

  const enviar = () => {
    if (
      enviandoRef.current ||
      !servicioSeleccionado ||
      !slotSeleccionado ||
      !fechaSeleccionada ||
      !descripcionLimpia
    ) {
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    setErrorEnvio('')

    const empresaNombre = empresaActiva.nombre
    const creada = enviarSolicitudContacto(empresaActivaId, {
      colaboradorId: colaborador.id,
      servicioId: servicioSeleccionado.id,
      fechaPreferida: fechaSeleccionada,
      horaPreferida: slotSeleccionado.horaInicio,
      descripcion: descripcionLimpia,
    })

    if (!creada) {
      enviandoRef.current = false
      setEnviando(false)
      setErrorEnvio('No pudimos enviar la solicitud. Vuelve a elegir el servicio e inténtalo otra vez.')
      return
    }

    setSolicitudCreada(creada)
    setEmpresaOrigenNombre(empresaNombre)
    setEnviando(false)
    setPaso('EXITO')
  }

  const fechaResumen = solicitudCreada?.fechaPreferida ?? fechaSeleccionada
  const horaResumen = solicitudCreada?.horaPreferida ?? slotSeleccionado?.horaInicio ?? ''
  const horaFinResumen = slotSeleccionado?.horaFin ?? horaResumen
  const descripcionResumen = solicitudCreada?.descripcion ?? descripcionLimpia

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
    >
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={cerrar}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-modal-title"
        aria-describedby="reserva-modal-description"
        className="animate-safe-pop-in relative flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <header className="border-b border-line/70 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy-100 text-sm font-bold text-navy-700"
              aria-hidden="true"
            >
              {obtenerIniciales({
                nombres: colaborador.nombres,
                apellidos: colaborador.apellidos,
              })}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                ref={dialogTitleRef}
                id="reserva-modal-title"
                tabIndex={-1}
                className="text-lg font-semibold text-ink-900 outline-none"
              >
                Solicitud con {nombreCompleto(colaborador)}
              </h2>
              <p id="reserva-modal-description" className="mt-1 text-xs leading-5 text-ink-500">
                Elige un servicio y una fecha preferida. El profesional confirmará la disponibilidad después.
              </p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
              aria-label="Cerrar solicitud"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {paso !== 'EXITO' && (
            <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Progreso de la solicitud">
              {PASOS.map((item) => {
                const completado = typeof paso === 'number' && paso > item.numero
                const activo = paso === item.numero
                return (
                  <li
                    key={item.numero}
                    aria-current={activo ? 'step' : undefined}
                    className="min-w-0"
                  >
                    <div
                      className={[
                        'h-1.5 rounded-full transition-colors',
                        activo || completado ? 'bg-navy-600' : 'bg-line',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                    <p
                      className={[
                        'mt-1.5 truncate text-[11px] font-medium',
                        activo ? 'text-navy-700' : 'text-ink-500',
                      ].join(' ')}
                    >
                      {item.numero}. {item.label}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {paso === 1 && (
            <section aria-labelledby="reserva-paso-servicio">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-servicio"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Elige el servicio que necesitas
              </h3>
              <p className="mt-1 text-sm text-ink-500">La tarifa es referencial y no se cobra en este flujo.</p>

              {servicios.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                  Este profesional no tiene servicios disponibles por el momento.
                </div>
              ) : (
                <div className="mt-4 space-y-3" role="group" aria-label="Servicios disponibles">
                  {servicios.map((servicio) => {
                    const seleccionado = servicio.id === servicioId
                    return (
                      <button
                        key={servicio.id}
                        type="button"
                        aria-pressed={seleccionado}
                        onClick={() => seleccionarServicio(servicio.id)}
                        className={[
                          'min-h-11 w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                          seleccionado
                            ? 'border-navy-500 bg-navy-100/60'
                            : 'border-line/70 bg-card hover:border-navy-500/50 hover:bg-surface/60',
                        ].join(' ')}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink-900">{servicio.nombre}</span>
                            <span className="mt-1 block text-xs leading-5 text-ink-500">{servicio.descripcion}</span>
                          </span>
                          <span
                            className={[
                              'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2',
                              seleccionado ? 'border-navy-600 bg-navy-600 ring-2 ring-white' : 'border-line bg-white',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="mt-3 block text-xs font-medium text-ink-700">
                          {formatMetaServicio(servicio)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {paso === 2 && servicioSeleccionado && (
            <section aria-labelledby="reserva-paso-agenda">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-agenda"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Elige fecha y hora preferidas
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                Horarios mostrados en GMT-5 · {colaborador.zonaHoraria}
              </p>

              <div
                ref={fechaGroupRef}
                tabIndex={-1}
                className="mt-5 outline-none"
                aria-describedby={errorFecha ? 'reserva-error-fecha' : undefined}
              >
                <p className="text-xs font-semibold text-ink-700">Fecha</p>
                {fechasDisponibles.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                    No encontramos fechas con horarios seleccionables durante los próximos 30 días.
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Fechas disponibles">
                    {fechasDisponibles.map((fecha) => (
                      <button
                        key={fecha}
                        type="button"
                        aria-pressed={fecha === fechaSeleccionada}
                        onClick={() => seleccionarFecha(fecha)}
                        className={[
                          'min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                          fecha === fechaSeleccionada
                            ? 'border-navy-600 bg-navy-600 text-white'
                            : 'border-line bg-card text-ink-700 hover:border-navy-500 hover:bg-navy-100/50',
                        ].join(' ')}
                      >
                        {formatFechaDisponible(fecha)}
                      </button>
                    ))}
                  </div>
                )}
                {errorFecha && (
                  <p id="reserva-error-fecha" role="alert" className="mt-2 text-xs text-destructive">
                    Elige una fecha para continuar.
                  </p>
                )}
              </div>

              <div
                ref={horaGroupRef}
                tabIndex={-1}
                className="mt-5 outline-none"
                aria-describedby={errorHora ? 'reserva-error-hora' : undefined}
              >
                <p className="text-xs font-semibold text-ink-700">Hora</p>
                {!fechaSeleccionada ? (
                  <p className="mt-2 text-sm text-ink-500">Primero elige una fecha.</p>
                ) : slots.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Horarios disponibles">
                    {slots.map((slot) => {
                      const seleccionado = slot.horaInicio === horaSeleccionada && !slot.ocupado
                      return (
                        <button
                          key={`${fechaSeleccionada}-${slot.horaInicio}`}
                          type="button"
                          disabled={slot.ocupado}
                          aria-disabled={slot.ocupado}
                          aria-pressed={seleccionado}
                          onClick={() => setHoraSeleccionada(slot.horaInicio)}
                          className={[
                            'min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                            slot.ocupado
                              ? 'cursor-not-allowed border-line bg-surface text-ink-500/60 line-through'
                              : seleccionado
                                ? 'border-navy-600 bg-navy-600 text-white'
                                : 'border-line bg-card text-ink-700 hover:border-navy-500 hover:bg-navy-100/50',
                          ].join(' ')}
                        >
                          {formatRangoHorario({ horaInicio: slot.horaInicio, horaFin: slot.horaFin })}
                          {slot.ocupado && <span className="sr-only">, ocupado</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errorHora && (
                  <p id="reserva-error-hora" role="alert" className="mt-2 text-xs text-destructive">
                    Elige una hora disponible para continuar.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="reserva-descripcion" className="text-xs font-semibold text-ink-700">
                  Describe tu necesidad
                </label>
                <Textarea
                  ref={descripcionRef}
                  id="reserva-descripcion"
                  value={descripcion}
                  maxLength={500}
                  rows={4}
                  onChange={(event) => setDescripcion(event.target.value)}
                  aria-invalid={errorDescripcion}
                  aria-describedby={
                    errorDescripcion
                      ? 'reserva-descripcion-ayuda reserva-error-descripcion'
                      : 'reserva-descripcion-ayuda'
                  }
                  className={errorDescripcion ? 'border-destructive focus-visible:border-destructive' : undefined}
                  placeholder="Cuéntale al profesional qué necesitas resolver y qué resultado esperas."
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p id="reserva-descripcion-ayuda" className="text-[11px] text-ink-500">
                    No incluyas contraseñas, datos bancarios ni información sensible.
                  </p>
                  <span className="num shrink-0 text-[11px] text-ink-500">{descripcion.length}/500</span>
                </div>
                {errorDescripcion && (
                  <p id="reserva-error-descripcion" role="alert" className="mt-2 text-xs text-destructive">
                    Describe brevemente tu necesidad para continuar.
                  </p>
                )}
              </div>
            </section>
          )}

          {paso === 3 && servicioSeleccionado && slotSeleccionado && (
            <section aria-labelledby="reserva-paso-confirmar">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-confirmar"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Confirma tu solicitud
              </h3>
              <p className="mb-4 mt-1 text-sm text-ink-500">Revisa la información antes de enviarla.</p>
              <ResumenSolicitud
                empresaNombre={empresaActiva.nombre}
                colaborador={colaborador}
                servicio={servicioSeleccionado}
                fecha={fechaSeleccionada}
                horaInicio={slotSeleccionado.horaInicio}
                horaFin={slotSeleccionado.horaFin}
                descripcion={descripcionLimpia}
              />
              {errorEnvio && (
                <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
                  {errorEnvio}
                </p>
              )}
            </section>
          )}

          {paso === 'EXITO' && servicioSeleccionado && solicitudCreada && (
            <section role="status" aria-live="polite" aria-labelledby="reserva-exito-titulo">
              <div className="mb-5 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-deep" aria-hidden="true" />
                <h3
                  ref={pasoTitleRef}
                  id="reserva-exito-titulo"
                  tabIndex={-1}
                  className="mt-3 text-lg font-semibold text-ink-900 outline-none"
                >
                  Solicitud enviada al profesional
                </h3>
                <span className="mt-2 inline-flex rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald-deep">
                  ENVIADA
                </span>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  El profesional podrá revisar tu necesidad y responder por medio de SAFE.
                </p>
              </div>

              <ResumenSolicitud
                empresaNombre={empresaOrigenNombre}
                colaborador={colaborador}
                servicio={servicioSeleccionado}
                fecha={fechaResumen}
                horaInicio={horaResumen}
                horaFin={horaFinResumen}
                descripcion={descripcionResumen}
              />
            </section>
          )}
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          {paso === 1 && (
            <>
              <Button type="button" variant="outline" size="lg" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={!servicioSeleccionado}
                onClick={() => setPaso(2)}
              >
                Continuar
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <Button type="button" variant="outline" size="lg" onClick={() => setPaso(1)}>
                <ChevronLeft aria-hidden="true" />
                Atrás
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={fechasDisponibles.length === 0}
                onClick={continuarDesdeAgenda}
              >
                Revisar solicitud
              </Button>
            </>
          )}

          {paso === 3 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={enviando}
                onClick={() => setPaso(2)}
              >
                <ChevronLeft aria-hidden="true" />
                Atrás
              </Button>
              <Button type="button" size="lg" disabled={enviando} onClick={enviar}>
                <Send aria-hidden="true" />
                {enviando ? 'Enviando…' : 'Enviar solicitud'}
              </Button>
            </>
          )}

          {paso === 'EXITO' && (
            <Button type="button" size="lg" onClick={cerrar}>
              Cerrar
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript and production build**

Run: `npm run build`

Expected: exit code 0; `ReservaModal.tsx` has no unused imports, nullable access errors or signature
mismatches with Tasks 1–5.

- [ ] **Step 3: Review the modal contract before integration**

Confirm in `ReservaModal.tsx`:

- The only mutation is `enviarSolicitudContacto`; there is no payment, commission or appointment state.
- The request stores the selected slot's `horaInicio`, while copy consistently calls it a preference.
- Service changes clear date/hour; date changes clear hour; closing and company changes reset the draft.
- A synchronous `useRef` guard prevents duplicate submission before React rerenders.
- The dialog traps Tab, closes with Escape/overlay/X, restores focus and body scroll, focuses step headings,
  exposes separate validation errors, and uses a polite live region for success.
- Occupied slots are native `disabled` controls and also expose `aria-disabled`.

- [ ] **Step 4: Commit**

```bash
git add src/portal/marketplace/ReservaModal.tsx
git commit -m "feat: agregar flujo accesible de solicitud"
```

### Task 7: Pantalla de listado, filtros, orden y paginación

**Files:**
- Create: `src/portal/marketplace/MarketplaceScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes:
  - `COLABORADORES_MARKETPLACE`, `ESPECIALIDADES_PROFESIONALES` y
    `serviciosActivosDeColaborador` de Task 2.
  - `FiltrosMarketplace`, `OrdenMarketplace`, `FILTROS_INICIALES`, `filtrarProfesionales`,
    `ordenarProfesionales`, `paginar` y `derivarDestacados` de Task 3.
  - `ProfesionalCard` y `DestacadosCarousel` de Task 5.
  - `ReservaModal` de Task 6 con contrato exacto
    `ReservaModal({ abierto, profesional, onCerrar })`, donde `profesional` es no-null.
- Produces: `MarketplaceScreen` y su ruta `/app/marketplace`; abre el wizard sin cambiar URL. Task 8
  consume esta ruta ya funcional y añade únicamente el detalle `marketplace/:id`.

- [ ] **Step 1: Crear `src/portal/marketplace/MarketplaceScreen.tsx`**

```tsx
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ColaboradorMarketplace } from '@/portal/types'
import {
  COLABORADORES_MARKETPLACE,
  ESPECIALIDADES_PROFESIONALES,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  FILTROS_INICIALES,
  derivarDestacados,
  filtrarProfesionales,
  ordenarProfesionales,
  paginar,
  type FiltrosMarketplace,
  type OrdenMarketplace,
} from './calculo'
import { DestacadosCarousel } from './DestacadosCarousel'
import { ProfesionalCard } from './ProfesionalCard'
import { ReservaModal } from './ReservaModal'

const OPCIONES_ORDEN: { value: OrdenMarketplace; label: string }[] = [
  { value: 'RELEVANCIA', label: 'Relevancia' },
  { value: 'MEJOR_CALIFICADOS', label: 'Mejor calificados' },
  { value: 'MAS_RESENAS', label: 'Más reseñas' },
  { value: 'MENOR_PRECIO', label: 'Menor precio' },
  { value: 'MAYOR_EXPERIENCIA', label: 'Mayor experiencia' },
]

export function MarketplaceScreen() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState<FiltrosMarketplace>(FILTROS_INICIALES)
  const [pagina, setPagina] = useState(1)
  const [profesionalSolicitud, setProfesionalSolicitud] =
    useState<ColaboradorMarketplace | null>(null)

  const destacados = useMemo(
    () => derivarDestacados({ profesionales: COLABORADORES_MARKETPLACE }),
    [],
  )

  const filtrados = useMemo(
    () => filtrarProfesionales({
      profesionales: COLABORADORES_MARKETPLACE,
      especialidades: ESPECIALIDADES_PROFESIONALES,
      filtros,
    }),
    [filtros],
  )

  const ordenados = useMemo(
    () => ordenarProfesionales({
      profesionales: filtrados,
      especialidades: ESPECIALIDADES_PROFESIONALES,
      orden: filtros.orden,
      busqueda: filtros.busqueda,
    }),
    [filtrados, filtros.busqueda, filtros.orden],
  )

  const resultado = useMemo(
    () => paginar({ profesionales: ordenados, paginaSolicitada: pagina, porPagina: 6 }),
    [ordenados, pagina],
  )

  const actualizarFiltros = (patch: Partial<FiltrosMarketplace>) => {
    setFiltros((actuales) => ({ ...actuales, ...patch }))
    setPagina(1)
  }

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES)
    setPagina(1)
  }

  const filtrosActivos =
    filtros.busqueda !== '' ||
    filtros.especialidadId !== '' ||
    filtros.tarifaMaxima !== null ||
    filtros.calificacionMinima !== null ||
    filtros.modalidad !== '' ||
    filtros.orden !== 'RELEVANCIA'

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Marketplace de profesionales</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Contadores, abogados y asesores financieros verificados para acompañar a tu empresa.
        </p>
      </div>

      <section aria-labelledby="marketplace-filtros" className="rounded-xl border border-line bg-card p-4">
        <h2 id="marketplace-filtros" className="sr-only">Buscar y filtrar profesionales</h2>
        <label htmlFor="marketplace-busqueda" className="sr-only">
          Buscar por nombre, especialidad o palabra clave
        </label>
        <input
          id="marketplace-busqueda"
          type="search"
          value={filtros.busqueda}
          onChange={(event) => actualizarFiltros({ busqueda: event.target.value })}
          placeholder="Buscar por nombre, especialidad o palabra clave"
          className="min-h-11.5 w-full rounded-xl border border-line bg-card px-3.5 text-[14px] text-ink-900 placeholder:text-ink-500 focus:outline-none focus:ring-2 focus:ring-navy-500/40"
        />

        <div className="mt-3 grid grid-cols-1 items-end gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="marketplace-especialidad" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Especialidad
            </label>
            <select
              id="marketplace-especialidad"
              value={filtros.especialidadId}
              onChange={(event) => actualizarFiltros({ especialidadId: event.target.value })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              {ESPECIALIDADES_PROFESIONALES.map((especialidad) => (
                <option key={especialidad.id} value={especialidad.id}>{especialidad.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-precio" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Precio máximo
            </label>
            <select
              id="marketplace-precio"
              value={filtros.tarifaMaxima ?? ''}
              onChange={(event) => actualizarFiltros({
                tarifaMaxima: event.target.value ? Number(event.target.value) : null,
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Cualquier tarifa</option>
              <option value="30">Hasta $30/h</option>
              <option value="40">Hasta $40/h</option>
              <option value="50">Hasta $50/h</option>
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-calificacion" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Calificación mínima
            </label>
            <select
              id="marketplace-calificacion"
              value={filtros.calificacionMinima ?? ''}
              onChange={(event) => actualizarFiltros({
                calificacionMinima: event.target.value ? Number(event.target.value) : null,
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              <option value="4.5">Desde 4.5</option>
              <option value="4.8">Desde 4.8</option>
            </select>
          </div>

          <div>
            <label htmlFor="marketplace-modalidad" className="mb-1.5 block text-[11.5px] font-semibold text-ink-500">
              Modalidad
            </label>
            <select
              id="marketplace-modalidad"
              value={filtros.modalidad}
              onChange={(event) => actualizarFiltros({
                modalidad: event.target.value as FiltrosMarketplace['modalidad'],
              })}
              className="min-h-11 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-navy-500/40"
            >
              <option value="">Todas</option>
              <option value="VIRTUAL">Virtual</option>
              <option value="PRESENCIAL">Presencial</option>
              <option value="AMBAS">Mixta</option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={limpiarFiltros}
          disabled={!filtrosActivos}
          className="mt-3 min-h-10 rounded-lg px-2 text-[13px] font-semibold text-navy-600 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          Limpiar filtros
        </button>
      </section>

      <DestacadosCarousel
        profesionales={destacados}
        especialidades={ESPECIALIDADES_PROFESIONALES}
        onVerPerfil={(id) => navigate(`/app/marketplace/${id}`)}
      />

      <section aria-labelledby="marketplace-disponibles">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="marketplace-disponibles" className="text-[18px] font-semibold text-ink-900">
              Profesionales disponibles
            </h2>
            <p className="mt-1 text-[13px] text-ink-500" aria-live="polite">
              {resultado.total}{' '}
              {resultado.total === 1 ? 'profesional encontrado' : 'profesionales encontrados'}
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <label
              htmlFor="marketplace-orden"
              className="mb-1.5 block text-[11.5px] font-semibold text-ink-500 sm:text-right"
            >
              Ordenar por
            </label>
            <select
              id="marketplace-orden"
              value={filtros.orden}
              onChange={(event) =>
                actualizarFiltros({ orden: event.target.value as OrdenMarketplace })
              }
              className="min-h-10 w-full rounded-lg border border-line bg-card px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-navy-500/40 sm:w-auto"
            >
              {OPCIONES_ORDEN.map((opcion) => (
                <option key={opcion.value} value={opcion.value}>
                  {opcion.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {resultado.total === 0 ? (
          <div
            role="status"
            className="mt-3.5 rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center"
          >
            <p className="text-[14px] font-semibold text-ink-900">
              Ningún profesional coincide con tu búsqueda.
            </p>
            <p className="mt-1.5 text-[13px] text-ink-500">
              Prueba otra combinación o restablece los filtros.
            </p>
            <button
              type="button"
              onClick={limpiarFiltros}
              className="mt-4 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <div className="mt-3.5 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {resultado.items.map((profesional) => (
              <ProfesionalCard
                key={profesional.id}
                profesional={profesional}
                especialidades={ESPECIALIDADES_PROFESIONALES.filter((especialidad) =>
                  profesional.especialidadIds.includes(especialidad.id),
                )}
                onVerPerfil={(id) => navigate(`/app/marketplace/${id}`)}
                onSolicitarContacto={setProfesionalSolicitud}
                puedeSolicitarContacto={
                  serviciosActivosDeColaborador(profesional.id).length > 0
                }
              />
            ))}
          </div>
        )}

        {resultado.totalPaginas > 1 && (
          <nav aria-label="Páginas de profesionales" className="mt-4 flex justify-center gap-1.5">
            {Array.from({ length: resultado.totalPaginas }, (_, indice) => indice + 1).map(
              (numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={() => setPagina(numero)}
                  aria-current={resultado.pagina === numero ? 'page' : undefined}
                  aria-label={`Ir a la página ${numero}`}
                  className={`min-h-10 min-w-10 rounded-lg border px-2 text-[12.5px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 ${
                    resultado.pagina === numero
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {numero}
                </button>
              ),
            )}
          </nav>
        )}
      </section>

      {profesionalSolicitud && (
        <ReservaModal
          abierto
          profesional={profesionalSolicitud}
          onCerrar={() => setProfesionalSolicitud(null)}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 2: Registrar el listado en `src/App.tsx`**

Aplicar exactamente este diff:

```diff
@@
 import { SimuladorScreen } from './portal/simulador/SimuladorScreen'
 import { DetalleSimulacionScreen } from './portal/simulador/DetalleSimulacionScreen'
+import { MarketplaceScreen } from './portal/marketplace/MarketplaceScreen'
@@
         <Route path="simulador" element={<SimuladorScreen />} />
         <Route path="simulador/:id" element={<DetalleSimulacionScreen />} />
+        <Route path="marketplace" element={<MarketplaceScreen />} />
         <Route path="*" element={<Navigate to="dashboard" replace />} />
```

No modificar `navItems`: Marketplace ya apunta a `/app/marketplace`.

- [ ] **Step 3: Verificar TypeScript, ruta del listado y producción**

Run: `npm run build`

Expected: exit code 0; `MarketplaceScreen`, tarjetas, carrusel y contrato de `ReservaModal` compilan.

Run:

```powershell
rg -n 'MarketplaceScreen|path="marketplace"' src/App.tsx
```

Expected: aparece el import de `MarketplaceScreen` y la ruta base antes del catch-all.

- [ ] **Step 4: Revisión manual focalizada**

Con la app ya levantada para revisión manual, abrir `/app/marketplace` y comprobar exactamente:

1. 12 resultados iniciales, 6 tarjetas y 2 botones de página.
2. Búsqueda `fiscalizacion` encuentra a Mateo pese a omitir la tilde.
3. Modalidad Virtual incluye perfiles `VIRTUAL` y `AMBAS`; Mixta incluye solo `AMBAS`.
4. “Hasta $30/h” y “Desde 4.8” se combinan con AND.
5. Un filtro sin coincidencias oculta paginación y “Limpiar filtros” restaura Relevancia/página 1.
6. Carrusel visible 3/2/1 en 1440/768/390 y flechas deshabilitadas en extremos.
7. “Ver perfil” cambia la URL; “Solicitar contacto” abre el modal sin cambiarla.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/portal/marketplace/MarketplaceScreen.tsx
git commit -m "feat: agregar listado del marketplace"
```

---

### Task 8: Perfil profesional, ruta de detalle y verificación integrada

**Files:**
- Create: `src/portal/marketplace/PerfilProfesionalScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes:
  - tipos de Marketplace de Task 1;
  - `colaboradorMarketplacePorId`, `especialidadesDeColaborador`,
    `serviciosActivosDeColaborador`, `horariosActivosDeColaborador` y
    `resenasPublicadasDeColaborador` de Task 2;
  - helpers de formato de Task 3;
  - `ReservaModal({ abierto, profesional, onCerrar })` de Task 6.
- Produces: `PerfilProfesionalScreen` y la ruta `/app/marketplace/:id`; conserva la ruta base registrada
  por Task 7 y completa la navegación listado → perfil → listado.

- [ ] **Step 1: Crear `src/portal/marketplace/PerfilProfesionalScreen.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BadgeCheck, Clock, Star } from 'lucide-react'
import type { ColaboradorMarketplace } from '@/portal/types'
import { formatUSD } from '@/portal/financiero/formato'
import { formatFecha } from '@/portal/obligaciones/formato'
import {
  colaboradorMarketplacePorId,
  especialidadesDeColaborador,
  horariosActivosDeColaborador,
  resenasPublicadasDeColaborador,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  formatDuracion,
  formatModalidad,
  formatRangoHorario,
  formatResumenCalificacion,
  formatTarifaHora,
} from './formato'
import { obtenerIniciales } from './calculo'
import { ReservaModal } from './ReservaModal'

const DIAS_SEMANA: { dia: 1 | 2 | 3 | 4 | 5 | 6 | 7; label: string }[] = [
  { dia: 1, label: 'Lunes' },
  { dia: 2, label: 'Martes' },
  { dia: 3, label: 'Miércoles' },
  { dia: 4, label: 'Jueves' },
  { dia: 5, label: 'Viernes' },
  { dia: 6, label: 'Sábado' },
  { dia: 7, label: 'Domingo' },
]

export function PerfilProfesionalScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [profesionalSolicitud, setProfesionalSolicitud] =
    useState<ColaboradorMarketplace | null>(null)
  const profesional = id ? colaboradorMarketplacePorId(id) : undefined

  if (!profesional) {
    return (
      <section className="flex flex-col gap-4">
        <div role="status" className="rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center">
          <h1 className="text-[22px] font-bold text-ink-900">Profesional no encontrado</h1>
          <p className="mt-2 text-[13.5px] text-ink-500">
            No encontramos un perfil profesional con ese identificador.
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/marketplace')}
            className="mt-4 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700"
          >
            Volver a Marketplace
          </button>
        </div>
      </section>
    )
  }

  if (
    profesional.estado !== 'ACTIVO' ||
    !profesional.visibleMarketplace ||
    profesional.estadoDisponibilidad !== 'DISPONIBLE'
  ) {
    return (
      <section className="flex flex-col gap-4">
        <div role="status" className="rounded-xl border border-dashed border-line bg-card px-5 py-10 text-center">
          <h1 className="text-[22px] font-bold text-ink-900">Profesional no disponible</h1>
          <p className="mt-2 text-[13.5px] text-ink-500">
            Este perfil ya no está disponible para recibir solicitudes en el Marketplace.
          </p>
          <button
            type="button"
            onClick={() => navigate('/app/marketplace')}
            className="mt-4 min-h-11 rounded-lg border border-line bg-card px-4 text-[13px] font-semibold text-navy-700"
          >
            Volver a Marketplace
          </button>
        </div>
      </section>
    )
  }

  const especialidades = especialidadesDeColaborador(profesional)
  const servicios = serviciosActivosDeColaborador(profesional.id)
  const horarios = horariosActivosDeColaborador(profesional.id)
  const resenas = resenasPublicadasDeColaborador(profesional.id)
  const resumenCalificacion = formatResumenCalificacion({
    calificacion: profesional.calificacionPromedio,
    cantidadResenas: profesional.cantidadResenas,
  })

  const horariosPorDia = DIAS_SEMANA.map(({ dia, label }) => ({
    dia,
    label,
    franjas: horarios.filter((horario) => horario.diaSemana === dia),
  })).filter((grupo) => grupo.franjas.length > 0)

  const credenciales: { titulo: string; detalle: string }[] = [
    { titulo: 'Perfil validado por SAFE', detalle: profesional.profesion },
  ]
  if (profesional.numeroLicencia && profesional.entidadEmisora) {
    credenciales.push({
      titulo: `Licencia ${profesional.numeroLicencia}`,
      detalle: profesional.entidadEmisora,
    })
  } else if (profesional.trabajoActual) {
    credenciales.push({
      titulo: 'Experiencia declarada',
      detalle: profesional.trabajoActual,
    })
  }

  const campos = [
    { label: 'Área', valor: profesional.areaEspecializacion },
    { label: 'Profesión', valor: profesional.profesion },
    { label: 'Trabajo actual', valor: profesional.trabajoActual ?? 'Independiente' },
    { label: 'Modalidad', valor: formatModalidad(profesional.modalidadAtencion) },
    { label: 'País', valor: profesional.paisAtencion },
    { label: 'Ciudad', valor: profesional.ciudadAtencion },
    { label: 'Zona horaria', valor: profesional.zonaHoraria },
    { label: 'Tarifa referencial', valor: formatTarifaHora(profesional.tarifaReferencial) },
    { label: 'Experiencia', valor: `${profesional.aniosExperiencia} años` },
    { label: 'Disponibilidad', valor: `${horarios.length} franjas semanales` },
    { label: 'Calificación', valor: resumenCalificacion },
    { label: 'Hoja de vida', valor: profesional.cvVisible ? 'Disponible para empresas' : 'No compartida' },
  ]

  return (
    <section className="flex flex-col gap-4.5">
      <button
        type="button"
        onClick={() => navigate('/app/marketplace')}
        className="flex min-h-10 w-fit items-center gap-1.5 text-[13px] font-semibold text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Marketplace
      </button>

      <header className="flex flex-col gap-4 rounded-xl border border-line bg-card p-5 md:flex-row md:items-center">
        <span
          aria-hidden="true"
          className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-navy-100 font-display text-[24px] font-bold text-navy-700"
        >
          {obtenerIniciales({ nombres: profesional.nombres, apellidos: profesional.apellidos })}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-[25px] font-bold leading-tight text-ink-900">
            {profesional.nombres} {profesional.apellidos}
          </h1>
          <p className="mt-1.5 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-700">
            {profesional.descripcionProfesional}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {especialidades.map((especialidad) => (
              <span key={especialidad.id} className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700">
                {especialidad.nombre}
              </span>
            ))}
            <span className="ml-1 flex items-center gap-1 text-[12.5px] text-ink-700" aria-label={resumenCalificacion}>
              <Star className="h-3.5 w-3.5 fill-amber-deep text-amber-deep" aria-hidden="true" />
              {profesional.calificacionPromedio.toFixed(1)} ({profesional.cantidadResenas} reseñas)
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={servicios.length === 0}
          onClick={() => setProfesionalSolicitud(profesional)}
          className="min-h-11 w-full rounded-lg bg-navy-600 px-4.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 md:w-auto"
        >
          {servicios.length === 0 ? 'Sin servicios disponibles' : 'Solicitar contacto'}
        </button>
      </header>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Información profesional</h2>
        <dl className="mt-3 grid grid-cols-1 gap-x-5.5 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
          {campos.map((campo) => (
            <div key={campo.label} className="min-w-0">
              <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{campo.label}</dt>
              <dd className="mt-1 break-words text-[13.5px] text-ink-900">{campo.valor}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 rounded-lg bg-surface px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-700">
          Tus datos de contacto se mantienen protegidos; SAFE facilitará el contacto cuando el profesional acepte la solicitud.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-line bg-card p-4.5">
          <h2 className="text-[16px] font-semibold text-ink-900">Servicios</h2>
          {servicios.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-line p-4 text-[13px] text-ink-500">
              Este profesional no tiene servicios activos por ahora.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-2.5">
              {servicios.map((servicio) => (
                <article key={servicio.id} className="rounded-xl border border-line/70 bg-surface p-3.5">
                  <h3 className="text-[13.5px] font-semibold text-ink-900">{servicio.nombre}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{servicio.descripcion}</p>
                  <p className="mt-2 text-[12px] font-semibold text-navy-600">
                    {formatDuracion(servicio.duracionEstimadaMinutos)} · {formatUSD(servicio.tarifaReferencial)} · {formatModalidad(servicio.modalidad)}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="flex items-center gap-2 text-[16px] font-semibold text-ink-900">
              <Clock className="h-4.5 w-4.5 text-navy-600" aria-hidden="true" />
              Horarios de disponibilidad
            </h2>
            <dl className="mt-3 flex flex-col gap-2.5">
              {horariosPorDia.map((grupo) => (
                <div key={grupo.dia} className="flex flex-col gap-1 sm:flex-row sm:justify-between sm:gap-4">
                  <dt className="text-[13px] text-ink-500">{grupo.label}</dt>
                  <dd className="m-0 text-[13px] text-ink-900 sm:text-right">
                    {grupo.franjas.map((franja) => (
                      <span key={franja.id} className="block">
                        {formatRangoHorario({ horaInicio: franja.horaInicio, horaFin: franja.horaFin })} · {formatModalidad(franja.modalidad)}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-card p-4.5">
            <h2 className="text-[16px] font-semibold text-ink-900">Credenciales</h2>
            <div className="mt-3 flex flex-col gap-2.5">
              {credenciales.map((credencial) => (
                <div key={`${credencial.titulo}-${credencial.detalle}`} className="flex items-start gap-2.5">
                  <BadgeCheck className="mt-0.5 h-4.5 w-4.5 shrink-0 text-emerald-deep" aria-hidden="true" />
                  <p className="text-[13px] leading-relaxed text-ink-700">
                    <strong className="font-semibold text-ink-900">{credencial.titulo}</strong> · {credencial.detalle}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Reseñas</h2>
        {resenas.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-line p-5 text-center text-[13px] text-ink-500">
            Este profesional aún no tiene reseñas publicadas.
          </p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
            {resenas.map((resena) => (
              <article key={resena.id} className="rounded-xl border border-line/70 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-[13px] font-semibold text-ink-900">{resena.autorEmpresa}</h3>
                  <span className="flex" aria-label={`${resena.calificacion} de 5 estrellas`}>
                    {Array.from({ length: 5 }, (_, indice) => (
                      <Star
                        key={indice}
                        aria-hidden="true"
                        className={`h-3.5 w-3.5 ${
                          indice < resena.calificacion
                            ? 'fill-amber-deep text-amber-deep'
                            : 'text-line'
                        }`}
                      />
                    ))}
                  </span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{resena.comentario}</p>
                <p className="mt-2 text-[11.5px] text-ink-500">{formatFecha(resena.fecha)}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {profesionalSolicitud && (
        <ReservaModal
          abierto
          profesional={profesionalSolicitud}
          onCerrar={() => setProfesionalSolicitud(null)}
        />
      )}
    </section>
  )
}
```

- [ ] **Step 2: Registrar el perfil en `src/App.tsx`**

Aplicar exactamente este diff:

```diff
@@
 import { SimuladorScreen } from './portal/simulador/SimuladorScreen'
 import { DetalleSimulacionScreen } from './portal/simulador/DetalleSimulacionScreen'
 import { MarketplaceScreen } from './portal/marketplace/MarketplaceScreen'
+import { PerfilProfesionalScreen } from './portal/marketplace/PerfilProfesionalScreen'
@@
         <Route path="simulador" element={<SimuladorScreen />} />
         <Route path="simulador/:id" element={<DetalleSimulacionScreen />} />
         <Route path="marketplace" element={<MarketplaceScreen />} />
+        <Route path="marketplace/:id" element={<PerfilProfesionalScreen />} />
         <Route path="*" element={<Navigate to="dashboard" replace />} />
```

No volver a añadir ni mover la ruta base: Task 7 ya dejó `/app/marketplace` compilable y navegable.

- [ ] **Step 3: Verificar selectores y rutas con comandos concretos**

Run:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { colaboradorMarketplacePorId, especialidadesDeColaborador, horariosActivosDeColaborador, resenasPublicadasDeColaborador, serviciosActivosDeColaborador } from "./src/portal/marketplace/catalogo.ts"; const p=colaboradorMarketplacePorId("col-01"); assert.ok(p); assert.ok(especialidadesDeColaborador(p).length>=1); assert.equal(serviciosActivosDeColaborador(p.id).length,3); assert.ok(horariosActivosDeColaborador(p.id).length>=1); assert.ok(resenasPublicadasDeColaborador(p.id).length>=1); assert.equal(colaboradorMarketplacePorId("no-existe"),undefined); console.log("OK selectores perfil");'
```

Expected: `OK selectores perfil`.

Run:

```powershell
rg -n "PerfilProfesionalScreen|marketplace/:id" src/App.tsx
```

Expected: aparece el import de `PerfilProfesionalScreen` y la ruta `marketplace/:id` entre la ruta base y
el catch-all.

- [ ] **Step 4: Verificar el build integrado**

Run: `npm run build`

Expected: exit code 0; no errores de TypeScript, imports, hooks ni rutas.

- [ ] **Step 5: Revisión manual final del módulo**

Con la app levantada para revisión manual:

1. Abrir `/app/marketplace`, recorrer ambas páginas y entrar a perfiles desde grid y carrusel.
2. Probar URL directa `/app/marketplace/col-01` y `/app/marketplace/no-existe`.
3. Confirmar información, 3 servicios, horarios, credenciales y reseñas específicos del profesional.
4. Abrir solicitud desde listado y perfil; avanzar/retroceder; cerrar con X, overlay y Escape.
5. Confirmar que el paso final dice “Enviar solicitud”, termina en `ENVIADA` y no contiene pago, comisión,
   método de pago ni cita.
6. Enviar con `emp-1`, cambiar a `emp-2` y comprobar aislamiento; cambiar empresa con un modal abierto lo
   cierra y restablece.
7. Recorrer todo por teclado y comprobar restauración de foco, trampa de Tab, errores anunciados y scroll
   bloqueado mientras el diálogo está abierto.
8. Revisar 1440, 768 y 390 px: perfil 3/2/1 columnas de información/reseñas, cuerpo 2/1 y CTA móvil ancho.

- [ ] **Step 6: Revisar whitespace y build una última vez**

Run:

```powershell
git diff --check
npm run build
```

Expected: ambos comandos terminan con exit code 0.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/portal/marketplace/PerfilProfesionalScreen.tsx
git commit -m "feat: agregar perfil y rutas del marketplace"
```

### Task 9: Verificación integral, accesibilidad y revisión final de Fase 7

**Files:**
- Review: `src/portal/marketplace/*.ts`
- Review: `src/portal/marketplace/*.tsx`
- Review: `src/portal/PortalDataContext.tsx`
- Review: `src/portal/data/mock-portal-data.ts`
- Review: `src/App.tsx`
- Modify únicamente los archivos anteriores si la revisión descubre defectos.

- [ ] **Step 1: Ejecutar todas las verificaciones deterministas**

Run the complete catalog smoke check:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { BLOQUEOS_AGENDA,COLABORADORES_MARKETPLACE,ESPECIALIDADES_PROFESIONALES,HORARIOS_DISPONIBILIDAD,RESENAS_COLABORADORES,SERVICIOS_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts";assert.equal(COLABORADORES_MARKETPLACE.length,12);assert.equal(SERVICIOS_PROFESIONALES.length,36);assert.equal(HORARIOS_DISPONIBILIDAD.length,36);assert.equal(RESENAS_COLABORADORES.length,22);assert.equal(BLOQUEOS_AGENDA.length,12);const ids=new Set(COLABORADORES_MARKETPLACE.map((x)=>x.id));for(const c of COLABORADORES_MARKETPLACE){assert.equal(c.estado,"ACTIVO");assert.equal(c.estadoDisponibilidad,"DISPONIBLE");assert.equal(c.visibleMarketplace,true);assert.ok(ESPECIALIDADES_PROFESIONALES.some((e)=>e.id===c.especialidadPrincipalId));assert.equal(SERVICIOS_PROFESIONALES.filter((s)=>s.colaboradorId===c.id&&s.activo).length,3);assert.ok(Number.isFinite(c.aniosExperiencia)&&c.aniosExperiencia>=0);}for(const x of [...HORARIOS_DISPONIBILIDAD,...RESENAS_COLABORADORES])assert.ok(ids.has(x.colaboradorId));for(const x of BLOQUEOS_AGENDA)assert.ok(ids.has(x.colaboradorId));console.log("OK catalogo integral");'
```

Run the query/pagination/publicability smoke check:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { COLABORADORES_MARKETPLACE,ESPECIALIDADES_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts";import { FILTROS_INICIALES,derivarDestacados,filtrarProfesionales,ordenarProfesionales,paginar } from "./src/portal/marketplace/calculo.ts";const filtrados=filtrarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,filtros:{...FILTROS_INICIALES,busqueda:"fiscalizacion"}});assert.deepEqual(filtrados.map((x)=>x.id),["col-12"]);const ordenados=ordenarProfesionales({profesionales:COLABORADORES_MARKETPLACE,especialidades:ESPECIALIDADES_PROFESIONALES,orden:"RELEVANCIA"});assert.deepEqual([paginar({profesionales:ordenados,paginaSolicitada:1}).items.length,paginar({profesionales:ordenados,paginaSolicitada:2}).items.length],[6,6]);assert.equal(paginar({profesionales:[],paginaSolicitada:1}).totalPaginas,0);assert.equal(derivarDestacados({profesionales:COLABORADORES_MARKETPLACE}).length,10);const oculto={...COLABORADORES_MARKETPLACE[0],id:"oculto",visibleMarketplace:false};assert.equal(filtrarProfesionales({profesionales:[oculto],especialidades:ESPECIALIDADES_PROFESIONALES,filtros:FILTROS_INICIALES}).length,0);console.log("OK consultas integrales");'
```

Run the agenda/format smoke check and production build:

```powershell
npx tsx -e 'import assert from "node:assert/strict"; import { BLOQUEOS_AGENDA,HORARIOS_DISPONIBILIDAD,SERVICIOS_PROFESIONALES } from "./src/portal/marketplace/catalogo.ts";import { generarSlots,HOY_MARKETPLACE,proximasFechasDisponibles } from "./src/portal/marketplace/calculo.ts";import { formatDuracion,formatModalidad } from "./src/portal/marketplace/formato.ts";const servicio=SERVICIOS_PROFESIONALES.find((x)=>x.id==="srv-col-01-01");assert.ok(servicio);const fechas=proximasFechasDisponibles({servicio,horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA});assert.equal(fechas.length,5);assert.ok(fechas.every((x)=>x>HOY_MARKETPLACE));const slots=generarSlots({servicio,fecha:fechas[0],horarios:HORARIOS_DISPONIBILIDAD,bloqueos:BLOQUEOS_AGENDA});assert.ok(slots.some((x)=>!x.ocupado));assert.equal(formatDuracion(90),"1 h 30 min");assert.equal(formatModalidad("AMBAS"),"Mixta");console.log("OK agenda integral");'
npm run build
```

Expected: todos los scripts imprimen sus mensajes `OK`; build termina con exit code 0 sin errores ni
warnings nuevos atribuibles a Marketplace.

- [ ] **Step 2: Buscar fugas de alcance y tipos inseguros**

```powershell
rg -n "TBD|TODO|FIXME|PENDIENTE_PAGO|PAGADA|metodo_pago|tipo_pago|comision|localStorage|\bany\b" src/portal/marketplace src/portal/PortalDataContext.tsx src/portal/data/mock-portal-data.ts src/App.tsx
rg -n "formatUSD|formatFecha|capitalizar" src/portal/marketplace
```

Expected: primera búsqueda sin coincidencias de producción; segunda muestra imports desde los helpers
existentes y ningún reemplazo local de moneda/fecha.

- [ ] **Step 3: Revisar manualmente en navegador desktop y móvil**

Levantar el proyecto:

```powershell
npm run dev -- --host 127.0.0.1
```

Comprobar en `/app/marketplace`:

- 12 profesionales, seis por página y dos páginas; contador, orden y `aria-current` correctos.
- búsqueda sin tildes/mayúsculas, cuatro filtros combinables, reset a página 1, limpiar y estado vacío.
- carrusel muestra 3/2/1 tarjetas a anchos desktop/tablet/móvil, sin controles Tab fuera de viewport.
- tarjetas conservan los nombres, profesión, experiencia, calificación/reseñas, tarifa, modalidad y ciudad
  del mockup; ambos CTA funcionan.

Comprobar en dos perfiles y en una URL inexistente:

- información, credenciales, tres servicios, horarios agrupados y 1–3 reseñas propias.
- CTA abre el mismo modal; perfil inexistente y no publicable tienen estado seguro con retorno.

Comprobar el modal desde listado y perfil:

- Escape, X, overlay y cancelar cierran; foco queda atrapado, se restaura y el fondo no desplaza.
- paso 1 preselecciona servicio; paso 2 primera fecha pero ninguna hora; ocupados están deshabilitados.
- validación tardía separada, contador `0/500`, cambio de fecha limpia hora y cambio de servicio recalcula.
- confirmación muestra empresa, profesional, servicio, fecha/hora preferidas GMT-5, duración, modalidad y
  tarifa; no aparecen pagos ni cita confirmada.
- doble clic no duplica; éxito dice “Solicitud enviada”; al cerrar y reabrir se reinicia; cambiar empresa
  cierra un borrador y cada empresa conserva su arreglo independiente.

- [ ] **Step 4: Solicitar revisión amplia y corregir todos los hallazgos importantes en una sola ola**

La revisión final debe comparar el rango completo de implementación contra el spec, revisar responsive,
accesibilidad, integridad de solicitudes y ausencia de subsistemas de Fase 8. Si hay hallazgos, crear un
solo commit de corrección y una re-revisión acotada.

- [ ] **Step 5: Verificación fresca y commit de correcciones, si existen**

Después de cualquier corrección, repetir scripts relevantes, `npm run build` y el recorrido de navegador
afectado. Si hubo cambios:

```bash
git add src/App.tsx src/portal/PortalDataContext.tsx src/portal/data/mock-portal-data.ts src/portal/marketplace
git commit -m "fix: corregir hallazgos de la revision final de Fase 7"
```

Expected final: worktree limpio salvo archivos del usuario que ya estuvieran modificados antes de la fase;
ningún hallazgo crítico/importante abierto.
