import type {
  ColaboradorMarketplace,
  EspecialidadProfesional,
  HorarioDisponibilidad,
  ModalidadAtencion,
  ResenaColaborador,
  ServicioProfesional,
} from "@/portal/types";

export type BloqueoAgenda = {
  colaboradorId: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
};

export const ESPECIALIDADES_PROFESIONALES: EspecialidadProfesional[] = [
  ["tributario", "TRIBUTARIO", "Tributario", "Tributación"],
  ["fiscalizacion", "FISCALIZACION", "Fiscalización", "Tributación"],
  ["laboral", "LABORAL", "Laboral", "Legal"],
  ["remuneraciones", "REMUNERACIONES", "Remuneraciones", "Laboral"],
  ["iess", "IESS", "IESS", "Laboral"],
  ["finanzas", "FINANZAS", "Finanzas", "Financiero"],
  ["presupuestos", "PRESUPUESTOS", "Presupuestos", "Financiero"],
  ["financiamiento", "FINANCIAMIENTO", "Financiamiento", "Financiero"],
  ["costos", "COSTOS", "Costos", "Contable"],
  ["societario", "SOCIETARIO", "Societario", "Legal"],
  ["mercantil", "MERCANTIL", "Mercantil", "Legal"],
  ["contabilidad", "CONTABILIDAD", "Contabilidad", "Contable"],
  ["niif", "NIIF", "NIIF", "Contable"],
  ["auditoria", "AUDITORIA", "Auditoría", "Contable"],
].map(([id, codigo, nombre, categoria]) => ({
  id: "esp-" + id,
  codigo,
  nombre,
  categoria,
}));

type ColaboradorSemilla = Omit<
  ColaboradorMarketplace,
  | "paisAtencion"
  | "zonaHoraria"
  | "estadoDisponibilidad"
  | "visibleMarketplace"
  | "estado"
>;
const crearColaborador = (
  datos: ColaboradorSemilla,
): ColaboradorMarketplace => ({
  ...datos,
  paisAtencion: "Ecuador",
  zonaHoraria: "America/Guayaquil",
  estadoDisponibilidad: "DISPONIBLE",
  visibleMarketplace: true,
  estado: "ACTIVO",
});

export const COLABORADORES_MARKETPLACE: ColaboradorMarketplace[] = [
  crearColaborador({
    id: "col-01",
    nombres: "María José",
    apellidos: "Ramírez Alvear",
    areaEspecializacion: "Tributario",
    profesion: "Abogada",
    trabajoActual: "Estudio Ramírez & Asociados",
    numeroLicencia: "FORO-G-18427",
    entidadEmisora: "Foro de Abogados del Guayas",
    descripcionProfesional:
      "Abogada experta en planificación y consultoría tributaria empresarial. Defensa en procesos de determinación del SRI.",
    modalidadAtencion: "VIRTUAL",
    ciudadAtencion: "Guayaquil",
    tarifaReferencial: 35,
    aniosExperiencia: 8,
    cvVisible: true,
    especialidadIds: ["esp-tributario", "esp-fiscalizacion"],
    especialidadPrincipalId: "esp-tributario",
    calificacionPromedio: 4.9,
    cantidadResenas: 98,
  }),
  crearColaborador({
    id: "col-02",
    nombres: "Felipe",
    apellidos: "Andrade Cordero",
    areaEspecializacion: "Laboral",
    profesion: "Asesor laboral",
    trabajoActual: "Andrade Consultores",
    descripcionProfesional:
      "Asesor en relaciones laborales, contratos y cumplimiento legal laboral para PYMES.",
    modalidadAtencion: "AMBAS",
    ciudadAtencion: "Quito",
    tarifaReferencial: 45,
    aniosExperiencia: 10,
    cvVisible: true,
    especialidadIds: ["esp-laboral", "esp-remuneraciones"],
    especialidadPrincipalId: "esp-laboral",
    calificacionPromedio: 4.8,
    cantidadResenas: 76,
  }),
  crearColaborador({
    id: "col-03",
    nombres: "Camila",
    apellidos: "Torres Benítez",
    areaEspecializacion: "Finanzas",
    profesion: "Analista financiera",
    trabajoActual: "Consultora independiente",
    descripcionProfesional:
      "Apoyo a empresas en análisis financiero, presupuestos y toma de decisiones estratégicas.",
    modalidadAtencion: "VIRTUAL",
    ciudadAtencion: "Cuenca",
    tarifaReferencial: 30,
    aniosExperiencia: 6,
    cvVisible: false,
    especialidadIds: ["esp-finanzas", "esp-presupuestos"],
    especialidadPrincipalId: "esp-finanzas",
    calificacionPromedio: 4.9,
    cantidadResenas: 64,
  }),
  crearColaborador({
    id: "col-04",
    nombres: "Andrés",
    apellidos: "Muñoz Salcedo",
    areaEspecializacion: "Societario",
    profesion: "Abogado",
    trabajoActual: "Muñoz Legal",
    numeroLicencia: "FORO-G-09815",
    entidadEmisora: "Foro de Abogados del Guayas",
    descripcionProfesional:
      "Abogado experto en derecho societario y mercantil. Asesoría integral a empresas y contratos comerciales.",
    modalidadAtencion: "PRESENCIAL",
    ciudadAtencion: "Guayaquil",
    tarifaReferencial: 28,
    aniosExperiencia: 7,
    cvVisible: false,
    especialidadIds: ["esp-societario", "esp-mercantil"],
    especialidadPrincipalId: "esp-societario",
    calificacionPromedio: 4.7,
    cantidadResenas: 52,
  }),
  crearColaborador({
    id: "col-05",
    nombres: "Valentina",
    apellidos: "Silva Erazo",
    areaEspecializacion: "Contabilidad",
    profesion: "Contadora",
    trabajoActual: "Silva Contadores",
    numeroLicencia: "CPA-MAN-09214",
    entidadEmisora: "Colegio de Contadores de Manabí",
    descripcionProfesional:
      "Contadora con experiencia en cierres mensuales, NIIF para PYMES y conciliaciones tributarias.",
    modalidadAtencion: "AMBAS",
    ciudadAtencion: "Manta",
    tarifaReferencial: 33,
    aniosExperiencia: 9,
    cvVisible: true,
    especialidadIds: ["esp-contabilidad", "esp-niif"],
    especialidadPrincipalId: "esp-contabilidad",
    calificacionPromedio: 4.8,
    cantidadResenas: 61,
  }),
  crearColaborador({
    id: "col-06",
    nombres: "Diego",
    apellidos: "Pérez Villamar",
    areaEspecializacion: "Remuneraciones",
    profesion: "Asesor laboral",
    trabajoActual: "Consultor independiente",
    descripcionProfesional:
      "Asesor en contratos y cumplimiento normativo ante el Ministerio del Trabajo y el IESS.",
    modalidadAtencion: "VIRTUAL",
    ciudadAtencion: "Guayaquil",
    tarifaReferencial: 27,
    aniosExperiencia: 5,
    cvVisible: false,
    especialidadIds: ["esp-remuneraciones", "esp-iess"],
    especialidadPrincipalId: "esp-remuneraciones",
    calificacionPromedio: 4.6,
    cantidadResenas: 41,
  }),
  crearColaborador({
    id: "col-07",
    nombres: "Paula",
    apellidos: "Benalcázar Ruiz",
    areaEspecializacion: "Tributario",
    profesion: "Contadora",
    trabajoActual: "BR Consultores",
    numeroLicencia: "CPA-P-21108",
    entidadEmisora: "Colegio de Contadores de Pichincha",
    descripcionProfesional:
      "Especialista en cumplimiento tributario de sociedades y anexos del SRI.",
    modalidadAtencion: "AMBAS",
    ciudadAtencion: "Quito",
    tarifaReferencial: 42,
    aniosExperiencia: 12,
    cvVisible: true,
    especialidadIds: ["esp-tributario", "esp-contabilidad"],
    especialidadPrincipalId: "esp-tributario",
    calificacionPromedio: 5,
    cantidadResenas: 112,
  }),
  crearColaborador({
    id: "col-08",
    nombres: "Sebastián",
    apellidos: "Vera Loor",
    areaEspecializacion: "Costos",
    profesion: "Analista financiero",
    trabajoActual: "Consultor independiente",
    descripcionProfesional:
      "Análisis de costos y estructura de precios para empresas manufactureras.",
    modalidadAtencion: "VIRTUAL",
    ciudadAtencion: "Portoviejo",
    tarifaReferencial: 24,
    aniosExperiencia: 4,
    cvVisible: false,
    especialidadIds: ["esp-costos", "esp-finanzas"],
    especialidadPrincipalId: "esp-costos",
    calificacionPromedio: 4.5,
    cantidadResenas: 29,
  }),
  crearColaborador({
    id: "col-09",
    nombres: "Gabriela",
    apellidos: "Mendoza Cruz",
    areaEspecializacion: "Laboral",
    profesion: "Abogada",
    trabajoActual: "Mendoza & Cruz",
    numeroLicencia: "FORO-A-06134",
    entidadEmisora: "Foro de Abogados del Azuay",
    descripcionProfesional:
      "Litigio laboral y auditoría de cumplimiento para empresas con más de 20 colaboradores.",
    modalidadAtencion: "PRESENCIAL",
    ciudadAtencion: "Cuenca",
    tarifaReferencial: 40,
    aniosExperiencia: 11,
    cvVisible: true,
    especialidadIds: ["esp-laboral", "esp-societario"],
    especialidadPrincipalId: "esp-laboral",
    calificacionPromedio: 4.9,
    cantidadResenas: 88,
  }),
  crearColaborador({
    id: "col-10",
    nombres: "Joaquín",
    apellidos: "Herrera Peña",
    areaEspecializacion: "NIIF",
    profesion: "Contador",
    trabajoActual: "Herrera Auditores",
    numeroLicencia: "CPA-GYE-22891",
    entidadEmisora: "Colegio de Contadores del Guayas",
    descripcionProfesional:
      "Implementación de NIIF para PYMES y preparación de estados financieros auditables.",
    modalidadAtencion: "AMBAS",
    ciudadAtencion: "Guayaquil",
    tarifaReferencial: 48,
    aniosExperiencia: 14,
    cvVisible: true,
    especialidadIds: ["esp-niif", "esp-auditoria"],
    especialidadPrincipalId: "esp-niif",
    calificacionPromedio: 4.7,
    cantidadResenas: 73,
  }),
  crearColaborador({
    id: "col-11",
    nombres: "Lucía",
    apellidos: "Cabrera Zamora",
    areaEspecializacion: "Financiamiento",
    profesion: "Asesora financiera",
    trabajoActual: "Cabrera Capital",
    descripcionProfesional:
      "Estructuración de solicitudes de crédito y proyecciones para banca y cooperativas.",
    modalidadAtencion: "VIRTUAL",
    ciudadAtencion: "Loja",
    tarifaReferencial: 38,
    aniosExperiencia: 8,
    cvVisible: true,
    especialidadIds: ["esp-financiamiento", "esp-finanzas"],
    especialidadPrincipalId: "esp-financiamiento",
    calificacionPromedio: 4.8,
    cantidadResenas: 57,
  }),
  crearColaborador({
    id: "col-12",
    nombres: "Mateo",
    apellidos: "Ibarra Nieto",
    areaEspecializacion: "Fiscalización",
    profesion: "Abogado",
    trabajoActual: "Ibarra Legal",
    numeroLicencia: "FORO-T-07642",
    entidadEmisora: "Foro de Abogados de Tungurahua",
    descripcionProfesional:
      "Defensa en procesos de determinación tributaria y reclamos administrativos.",
    modalidadAtencion: "AMBAS",
    ciudadAtencion: "Ambato",
    tarifaReferencial: 31,
    aniosExperiencia: 6,
    cvVisible: false,
    especialidadIds: ["esp-fiscalizacion", "esp-tributario"],
    especialidadPrincipalId: "esp-fiscalizacion",
    calificacionPromedio: 4.6,
    cantidadResenas: 44,
  }),
];

type ServicioSemilla = Omit<
  ServicioProfesional,
  "id" | "colaboradorId" | "activo"
>;
const crearServicios = (
  colaboradorId: string,
  definiciones: ServicioSemilla[],
): ServicioProfesional[] =>
  definiciones.map((servicio, index) => ({
    id: "srv-" + colaboradorId + "-" + String(index + 1).padStart(2, "0"),
    colaboradorId,
    ...servicio,
    activo: true,
  }));
const crearServicio = (
  nombre: string,
  descripcion: string,
  duracionEstimadaMinutos: number,
  tarifaReferencial: number,
  modalidad: ServicioProfesional["modalidad"],
): ServicioSemilla => ({
  nombre,
  descripcion,
  duracionEstimadaMinutos,
  tarifaReferencial,
  modalidad,
});
export const SERVICIOS_PROFESIONALES: ServicioProfesional[] = [
  ...crearServicios("col-01", [
    crearServicio(
      "Diagnóstico tributario integral",
      "Revisión inicial de obligaciones, riesgos y oportunidades tributarias.",
      60,
      35,
      "VIRTUAL",
    ),
    crearServicio(
      "Declaraciones y anexos SRI",
      "Acompañamiento para preparar declaraciones y anexos periódicos.",
      90,
      55,
      "VIRTUAL",
    ),
    crearServicio(
      "Planificación tributaria",
      "Plan preventivo de cumplimiento y organización fiscal para el siguiente periodo.",
      120,
      70,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-02", [
    crearServicio(
      "Consulta laboral preventiva",
      "Evaluación puntual de una situación laboral antes de tomar decisiones.",
      60,
      45,
      "VIRTUAL",
    ),
    crearServicio(
      "Revisión de contratos de trabajo",
      "Revisión de cláusulas, modalidad contractual y riesgos para la empresa.",
      90,
      65,
      "VIRTUAL",
    ),
    crearServicio(
      "Acompañamiento en desvinculación",
      "Orientación presencial para documentar una terminación laboral.",
      90,
      75,
      "PRESENCIAL",
    ),
  ]),
  ...crearServicios("col-03", [
    crearServicio(
      "Diagnóstico financiero",
      "Lectura ejecutiva de liquidez, rentabilidad y estructura financiera.",
      60,
      30,
      "VIRTUAL",
    ),
    crearServicio(
      "Flujo de caja proyectado",
      "Construcción guiada de una proyección de cobros y pagos.",
      90,
      50,
      "VIRTUAL",
    ),
    crearServicio(
      "Evaluación de inversión",
      "Comparación de escenarios, retorno esperado y principales riesgos.",
      120,
      65,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-04", [
    crearServicio(
      "Constitución o reforma de compañía",
      "Revisión de requisitos y documentos para constituciones o reformas.",
      90,
      55,
      "PRESENCIAL",
    ),
    crearServicio(
      "Consulta societaria",
      "Orientación sobre socios, administración, estatutos y decisiones corporativas.",
      60,
      28,
      "PRESENCIAL",
    ),
    crearServicio(
      "Preparación de junta de socios",
      "Estructuración de convocatoria, agenda, resoluciones y acta.",
      120,
      70,
      "PRESENCIAL",
    ),
  ]),
  ...crearServicios("col-05", [
    crearServicio(
      "Cierre contable mensual",
      "Revisión del cierre, ajustes pendientes y consistencia de saldos.",
      90,
      45,
      "VIRTUAL",
    ),
    crearServicio(
      "Revisión de conciliaciones",
      "Validación de conciliaciones bancarias y partidas pendientes.",
      60,
      33,
      "VIRTUAL",
    ),
    crearServicio(
      "Organización documental contable",
      "Sesión presencial para ordenar soportes y flujo documental.",
      120,
      60,
      "PRESENCIAL",
    ),
  ]),
  ...crearServicios("col-06", [
    crearServicio(
      "Auditoría de nómina",
      "Revisión de novedades, aportes, descuentos y consistencia de roles.",
      90,
      45,
      "VIRTUAL",
    ),
    crearServicio(
      "Implementación de roles de pago",
      "Diseño del proceso mensual de nómina y sus controles básicos.",
      60,
      27,
      "VIRTUAL",
    ),
    crearServicio(
      "Cálculo de liquidación de haberes",
      "Revisión guiada de rubros para una liquidación laboral.",
      60,
      32,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-07", [
    crearServicio(
      "Consulta tributaria especializada",
      "Análisis de una consulta fiscal concreta y sus alternativas.",
      60,
      42,
      "VIRTUAL",
    ),
    crearServicio(
      "Revisión de requerimiento del SRI",
      "Lectura presencial del requerimiento y plan de respuesta documental.",
      90,
      65,
      "PRESENCIAL",
    ),
    crearServicio(
      "Estrategia fiscal anual",
      "Planificación de hitos, riesgos y controles para el ejercicio fiscal.",
      120,
      80,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-08", [
    crearServicio(
      "Análisis de estructura de costos",
      "Clasificación de costos fijos y variables por línea de negocio.",
      90,
      40,
      "VIRTUAL",
    ),
    crearServicio(
      "Cálculo de punto de equilibrio",
      "Determinación del volumen mínimo de ventas y margen de seguridad.",
      60,
      24,
      "VIRTUAL",
    ),
    crearServicio(
      "Costeo de productos o servicios",
      "Diseño de una ficha de costo para fijar precios con mayor claridad.",
      120,
      55,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-09", [
    crearServicio(
      "Diagnóstico de relaciones laborales",
      "Revisión presencial de prácticas, documentos y riesgos laborales.",
      60,
      40,
      "PRESENCIAL",
    ),
    crearServicio(
      "Elaboración de reglamento interno",
      "Sesión de levantamiento y definición de políticas laborales.",
      120,
      75,
      "PRESENCIAL",
    ),
    crearServicio(
      "Mediación laboral",
      "Preparación y acompañamiento para una conversación de mediación.",
      90,
      65,
      "PRESENCIAL",
    ),
  ]),
  ...crearServicios("col-10", [
    crearServicio(
      "Implementación NIIF para PYMES",
      "Diagnóstico y hoja de ruta para aplicar NIIF para PYMES.",
      120,
      95,
      "VIRTUAL",
    ),
    crearServicio(
      "Diagnóstico de cumplimiento NIIF",
      "Revisión de políticas y principales brechas de presentación.",
      90,
      70,
      "VIRTUAL",
    ),
    crearServicio(
      "Taller de políticas contables",
      "Sesión presencial para definir políticas contables prioritarias.",
      120,
      85,
      "PRESENCIAL",
    ),
  ]),
  ...crearServicios("col-11", [
    crearServicio(
      "Perfil de financiamiento",
      "Evaluación de capacidad, destino y alternativas de financiamiento.",
      60,
      38,
      "VIRTUAL",
    ),
    crearServicio(
      "Preparación de carpeta de crédito",
      "Organización de información financiera y narrativa del negocio.",
      90,
      58,
      "VIRTUAL",
    ),
    crearServicio(
      "Evaluación de deuda e inversión",
      "Comparación del costo y efecto de distintas fuentes de recursos.",
      120,
      72,
      "VIRTUAL",
    ),
  ]),
  ...crearServicios("col-12", [
    crearServicio(
      "Revisión fiscal preventiva",
      "Control de soportes y señales de riesgo antes de una fiscalización.",
      90,
      50,
      "VIRTUAL",
    ),
    crearServicio(
      "Respuesta a auditoría tributaria",
      "Preparación presencial de argumentos y expediente de respuesta.",
      120,
      80,
      "PRESENCIAL",
    ),
    crearServicio(
      "Matriz de riesgos fiscales",
      "Identificación y priorización de riesgos fiscales del negocio.",
      60,
      31,
      "VIRTUAL",
    ),
  ]),
];

const crearHorarios = (
  colaboradorId: string,
  modalidad: ModalidadAtencion,
  dias: HorarioDisponibilidad["diaSemana"][],
  horaInicio: string,
  horaFin: string,
): HorarioDisponibilidad[] =>
  dias.map((diaSemana) => ({
    id: "hor-" + colaboradorId + "-" + diaSemana,
    colaboradorId,
    diaSemana,
    horaInicio,
    horaFin,
    modalidad,
    activo: true,
  }));
export const HORARIOS_DISPONIBILIDAD: HorarioDisponibilidad[] = [
  ...crearHorarios("col-01", "VIRTUAL", [1, 3, 5], "09:00", "13:00"),
  ...crearHorarios("col-02", "AMBAS", [2, 4, 6], "14:00", "18:00"),
  ...crearHorarios("col-03", "VIRTUAL", [1, 2, 4], "08:00", "12:00"),
  ...crearHorarios("col-04", "PRESENCIAL", [2, 4, 5], "09:00", "13:00"),
  ...crearHorarios("col-05", "AMBAS", [1, 3, 6], "10:00", "14:00"),
  ...crearHorarios("col-06", "VIRTUAL", [1, 4, 5], "09:00", "13:00"),
  ...crearHorarios("col-07", "AMBAS", [2, 3, 5], "13:00", "17:00"),
  ...crearHorarios("col-08", "VIRTUAL", [1, 3, 4], "08:00", "12:00"),
  ...crearHorarios("col-09", "PRESENCIAL", [2, 5, 6], "09:00", "14:00"),
  ...crearHorarios("col-10", "AMBAS", [1, 2, 4], "13:00", "18:00"),
  ...crearHorarios("col-11", "VIRTUAL", [3, 4, 5], "08:00", "12:00"),
  ...crearHorarios("col-12", "AMBAS", [1, 3, 6], "09:00", "13:00"),
];

type ResenaSemilla = Omit<ResenaColaborador, "id" | "colaboradorId" | "estado">;
const crearResenas = (
  colaboradorId: string,
  definiciones: ResenaSemilla[],
): ResenaColaborador[] =>
  definiciones.map((resena, index) => ({
    id: "res-" + colaboradorId + "-" + String(index + 1).padStart(2, "0"),
    colaboradorId,
    ...resena,
    estado: "PUBLICADA",
  }));
const crearResena = (
  autorEmpresa: string,
  calificacion: ResenaColaborador["calificacion"],
  comentario: string,
  fecha: string,
): ResenaSemilla => ({ autorEmpresa, calificacion, comentario, fecha });
export const RESENAS_COLABORADORES: ResenaColaborador[] = [
  ...crearResenas("col-01", [
    crearResena(
      "Textiles Andina S.A.",
      5,
      "Nos explicó cada pendiente del SRI con claridad y dejó un plan de trabajo concreto.",
      "2026-08-02",
    ),
    crearResena(
      "Café Sierra Norte",
      5,
      "La revisión preventiva detectó inconsistencias antes de presentar el anexo.",
      "2026-07-18",
    ),
    crearResena(
      "Distribuidora Pacífico",
      4,
      "Atención puntual y recomendaciones fáciles de aplicar.",
      "2026-06-29",
    ),
  ]),
  ...crearResenas("col-02", [
    crearResena(
      "Comercial del Valle Cía. Ltda.",
      5,
      "La revisión contractual fue muy detallada y práctica.",
      "2026-08-04",
    ),
    crearResena(
      "Constructora Horizonte",
      5,
      "Nos ayudó a ordenar el proceso de desvinculación sin improvisaciones.",
      "2026-07-21",
    ),
    crearResena(
      "Servicios Médicos Equinoccio",
      5,
      "Explicaciones claras y excelente seguimiento.",
      "2026-06-30",
    ),
  ]),
  ...crearResenas("col-03", [
    crearResena(
      "Panadería La Colina",
      5,
      "La proyección de caja nos permitió anticipar dos meses complicados.",
      "2026-07-30",
    ),
    crearResena(
      "Muebles Austro",
      4,
      "Muy buena guía para comparar alternativas de inversión.",
      "2026-06-17",
    ),
  ]),
  ...crearResenas("col-04", [
    crearResena(
      "Inversiones Río Guayas",
      5,
      "Ordenó la junta y los documentos societarios con mucha precisión.",
      "2026-07-25",
    ),
  ]),
  ...crearResenas("col-05", [
    crearResena(
      "Mariscos del Puerto",
      5,
      "Logramos cerrar el mes con conciliaciones claras y sin partidas pendientes.",
      "2026-08-01",
    ),
    crearResena(
      "Taller Montecristi",
      4,
      "Nos dejó un flujo documental sencillo para el equipo.",
      "2026-06-22",
    ),
  ]),
  ...crearResenas("col-06", [
    crearResena(
      "Logística Azul",
      5,
      "Corrigió diferencias de nómina y nos enseñó cómo prevenirlas.",
      "2026-07-27",
    ),
  ]),
  ...crearResenas("col-07", [
    crearResena(
      "Tecnología Páramo",
      5,
      "La respuesta al requerimiento quedó organizada y bien sustentada.",
      "2026-08-06",
    ),
    crearResena(
      "Alimentos Cayambe",
      5,
      "Excelente criterio tributario y comunicación muy directa.",
      "2026-07-11",
    ),
    crearResena(
      "Diseño Capital",
      4,
      "El plan fiscal anual nos dio prioridades concretas.",
      "2026-05-29",
    ),
  ]),
  ...crearResenas("col-08", [
    crearResena(
      "Calzado Manabí",
      5,
      "Ahora conocemos el costo real y el margen de cada línea.",
      "2026-07-14",
    ),
  ]),
  ...crearResenas("col-09", [
    crearResena(
      "Clínica Santa Ana",
      5,
      "Condujo la mediación con equilibrio y mucha preparación.",
      "2026-08-03",
    ),
    crearResena(
      "Hostería Tomebamba",
      4,
      "El reglamento quedó adaptado a nuestra operación real.",
      "2026-06-09",
    ),
  ]),
  ...crearResenas("col-10", [
    crearResena(
      "Importadora Central",
      5,
      "El diagnóstico NIIF fue profundo y entregó una ruta alcanzable.",
      "2026-07-28",
    ),
    crearResena(
      "Industrias Daule",
      5,
      "Dominio técnico y explicaciones comprensibles para gerencia.",
      "2026-06-13",
    ),
  ]),
  ...crearResenas("col-11", [
    crearResena(
      "AgroLoja",
      5,
      "La carpeta de crédito quedó completa y mejor presentada.",
      "2026-07-19",
    ),
  ]),
  ...crearResenas("col-12", [
    crearResena(
      "Ferretería Ambato",
      5,
      "Identificó riesgos documentales que no habíamos considerado.",
      "2026-07-23",
    ),
  ]),
];

export const BLOQUEOS_AGENDA: BloqueoAgenda[] = [
  ["col-01", "2026-08-14", "10:00", "11:00"],
  ["col-02", "2026-08-15", "15:30", "16:30"],
  ["col-03", "2026-08-17", "09:00", "10:00"],
  ["col-04", "2026-08-14", "11:00", "12:00"],
  ["col-05", "2026-08-15", "11:00", "12:00"],
  ["col-06", "2026-08-14", "10:00", "10:30"],
  ["col-07", "2026-08-14", "14:00", "15:30"],
  ["col-08", "2026-08-17", "10:00", "11:00"],
  ["col-09", "2026-08-15", "12:00", "13:00"],
  ["col-10", "2026-08-17", "14:00", "16:00"],
  ["col-11", "2026-08-14", "09:00", "10:00"],
  ["col-12", "2026-08-15", "10:00", "12:00"],
].map(([colaboradorId, fecha, horaInicio, horaFin]) => ({
  colaboradorId,
  fecha,
  horaInicio,
  horaFin,
}));

export const colaboradorMarketplacePorId = (
  id: string,
): ColaboradorMarketplace | undefined =>
  COLABORADORES_MARKETPLACE.find((colaborador) => colaborador.id === id);
export const especialidadProfesionalPorId = (
  id: string,
): EspecialidadProfesional | undefined =>
  ESPECIALIDADES_PROFESIONALES.find((especialidad) => especialidad.id === id);
export const especialidadesDeColaborador = (
  colaborador: ColaboradorMarketplace,
): EspecialidadProfesional[] =>
  colaborador.especialidadIds
    .map(especialidadProfesionalPorId)
    .filter(
      (especialidad): especialidad is EspecialidadProfesional =>
        especialidad !== undefined,
    );
export const serviciosActivosDeColaborador = (
  colaboradorId: string,
): ServicioProfesional[] =>
  SERVICIOS_PROFESIONALES.filter(
    (servicio) => servicio.colaboradorId === colaboradorId && servicio.activo,
  );
export const horariosActivosDeColaborador = (
  colaboradorId: string,
): HorarioDisponibilidad[] =>
  HORARIOS_DISPONIBILIDAD.filter(
    (horario) => horario.colaboradorId === colaboradorId && horario.activo,
  );
export const resenasPublicadasDeColaborador = (
  colaboradorId: string,
): ResenaColaborador[] =>
  RESENAS_COLABORADORES.filter(
    (resena) =>
      resena.colaboradorId === colaboradorId && resena.estado === "PUBLICADA",
  );
export const bloqueosDeColaborador = (colaboradorId: string): BloqueoAgenda[] =>
  BLOQUEOS_AGENDA.filter((bloqueo) => bloqueo.colaboradorId === colaboradorId);
