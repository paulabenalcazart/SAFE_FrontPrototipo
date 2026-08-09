import type { LucideIcon } from 'lucide-react'

export type Tono = 'positivo' | 'atencion' | 'critico' | 'neutro'

export type Empresa = {
  id: string
  nombre: string
  ruc: string
  iniciales: string
  estado: string
  plan: string
  diagnostico?: string
  diagnosticoFecha?: string
  general: {
    razonSocial: string
    tipoContribuyente: 'Persona Natural' | 'Persona Jurídica'
    fechaConstitucion: string
    numeroEmpleados: string
  }
  fiscal: {
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
  meta: {
    fechaRegistroSafe: string
  }
}

export type Kpi = {
  id: string
  titulo: string
  valor: string
  sub: string
  icon: LucideIcon
  badge?: { texto: string; tono: Tono }
}

export type Indicador = {
  id: string
  nombre: string
  valor: string
  unidad: string
  tendencia: 'up' | 'down'
  estado: string
  tono: Tono
}

export type Obligacion = {
  id: string
  nombre: string
  periodo: string
  vence: string
  monto: string
  estado: string
  tono: Tono
}

export type Notificacion = {
  id: string
  titulo: string
  mensaje: string
  fecha: string
  leida: boolean
}

export type NavItem = {
  key: string
  label: string
  path: string
  icon: LucideIcon
}

export type ChartSeriesPoint = {
  label: string
  ingresos: number
  gastos: number
  utilidad: number
}

export type EstadoRegistroFinanciero = 'BORRADOR' | 'VIGENTE' | 'REEMPLAZADO'

export type RegistroFinanciero = {
  id: string
  periodo: string // ISO, primer día del mes: '2026-07-01'
  version: number
  estado: EstadoRegistroFinanciero
  observaciones: string
  // Activo
  efectivoEquivalentes: number
  cuentasPorCobrar: number
  inventarios: number
  otrosActivosCorrientes: number
  activoFijoNeto: number
  otrosActivosNoCorrientes: number
  // Pasivo
  cuentasPorPagar: number
  deudaCortoPlazo: number
  otrosPasivosCorrientes: number
  deudaLargoPlazo: number
  otrosPasivosNoCorrientes: number
  // Patrimonio
  capitalSocial: number
  resultadosAcumulados: number
  // Ingreso / Costo / Gasto
  ingresosOperacionales: number
  otrosIngresos: number
  costoVentas: number
  gastosAdministracion: number
  gastosVentas: number
  otrosGastosOperacionales: number
  gastosFinancieros: number
  impuestoRenta: number
  // Flujo de efectivo
  flujoOperacion: number
  flujoInversion: number
  flujoFinanciamiento: number
  // Complementario
  comprasPeriodo: number
  capex: number
  depreciacion: number
  numeroEmpleadosPeriodo: number
  costoLaboral: number
  gastoID: number
  unidadesVendidas: number
  createdAt: string
  updatedAt: string
}

export type FactorIndicador = 'LIQUIDEZ' | 'SOLVENCIA' | 'GESTION' | 'RENTABILIDAD'
export type SemaforoIndicador = 'VERDE' | 'AMARILLO' | 'ROJO'

export type IndicadorCalculado = {
  codigo: string
  factor: FactorIndicador
  nombre: string
  unidad: 'RATIO' | 'PORCENTAJE' | 'VECES' | 'DIAS'
  valor: number
  valorFormateado: string
  semaforo: SemaforoIndicador
  mejorSiMayor: boolean
}

export type SaludFinanciera = {
  puntaje: number // 0-100
  etiqueta: 'Saludable' | 'Estable' | 'En riesgo' | 'Crítico'
  factores: { factor: FactorIndicador; puntaje: number; peso: number }[] // 4 entradas
}

export type CategoriaObligacion = 'TRIBUTARIA' | 'LABORAL' | 'SOCIETARIA' | 'MUNICIPAL'
export type PeriodicidadObligacion = 'MENSUAL' | 'BIMESTRAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL' | 'EVENTUAL'
export type EstadoObligacion = 'PENDIENTE' | 'PROXIMA' | 'VENCIDA' | 'CUMPLIDA' | 'NO_APLICA'

export type ObligacionCatalogo = {
  codigo: string
  nombre: string
  categoria: CategoriaObligacion
  institucion: string
  periodicidad: PeriodicidadObligacion
  formulario: string
  usaNovenoDigito: boolean
  permiteMontoEstimado: boolean
}

export type ObligacionEmpresa = {
  id: string
  obligacionCodigo: string // FK -> ObligacionCatalogo.codigo
  periodo: string // ISO, primer día de mes
  fechaLimite: string // ISO 'YYYY-MM-DD'
  baseCalculo?: number
  montoEstimado?: number
  fechaCumplimiento?: string // ISO 'YYYY-MM-DD'; presencia = fue marcada cumplida
  recordatorioActivo: boolean
  notas?: string
}

export type CategoriaEscenario = 'FINANCIERO' | 'TRIBUTARIO' | 'LABORAL' | 'SOCIETARIO'
export type TipoVariableEscenario = 'NUMERO' | 'PORCENTAJE' | 'MONEDA' | 'FECHA' | 'TEXTO' | 'BOOLEANO'
export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO' | 'CRITICO'

export type EscenarioSimulacion = {
  codigo: string
  nombre: string
  categoria: CategoriaEscenario
  descripcion: string
  implementado: boolean
}

export type VariableEscenario = {
  codigo: string
  label: string
  tipoDato: TipoVariableEscenario
  unidad?: string
  valorMinimo?: number
  valorMaximo?: number
  hint?: string
  default: number | boolean
}

export type SerieMensualSimulacion = {
  mes: string
  costoAcumulado: number
  ingresoAcumulado: number
  utilidadActual: number
  utilidadProyectada: number
}

export type CardResultadoSimulacion = {
  titulo: string
  valor: number
  formato: 'USD' | 'PORCENTAJE'
  sub: string
}

export type ResultadoSimulacion = {
  cards: CardResultadoSimulacion[]
  serie: SerieMensualSimulacion[]
  nivelRiesgo: NivelRiesgo
  riesgoTexto: string
  recomendaciones: string[]
  supuestos: string[]
  limitaciones: string[]
}

export type Simulacion = {
  id: string
  escenarioCodigo: string
  fecha: string // ISO 'YYYY-MM-DD'
  entradas: Record<string, number | boolean>
  resultado: ResultadoSimulacion
}

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
