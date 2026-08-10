import {
  Building2,
  CalendarClock,
  Calculator,
  CreditCard,
  Gauge,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  ShieldCheck,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import type {
  ChartSeriesPoint,
  Empresa,
  Indicador,
  Kpi,
  MetodoPago,
  NavItem,
  Notificacion,
  Obligacion,
  ObligacionEmpresa,
  PagoSuscripcion,
  PlanCodigo,
  PreferenciaUsuario,
  RegistroFinanciero,
  Simulacion,
  SolicitudContacto,
} from '../types'
import { diaPorNovenoDigito, diasHasta, novenoDigito, HOY_OBLIGACIONES } from '../obligaciones/calculo'
import {
  pctCostoVariableSugerido,
  simularAumentoVentas,
  simularContratacionPersonal,
  ultimoRegistroVigente,
} from '../simulador/calculo'
import { utilidadNeta } from '../financiero/calculo'

export const empresaActiva: Empresa = {
  id: 'emp-1',
  nombre: 'Textiles Andina S.A.',
  ruc: '1792146739001',
  iniciales: 'TA',
  estado: 'Activa',
  plan: 'Plan Crecimiento',
  diagnostico: 'Saludable',
  diagnosticoFecha: '2 ago 2026',
  general: {
    razonSocial: 'Textiles Andina S.A.',
    tipoContribuyente: 'Persona Jurídica',
    fechaConstitucion: '14 mar 2016',
    numeroEmpleados: '38',
  },
  fiscal: {
    regimenTributario: 'Régimen General',
    actividadEconomica: 'C1410 - Fabricación de prendas de vestir',
    obligadoContabilidad: 'Sí',
    agenteRetencion: 'Sí',
  },
  contacto: {
    correo: 'contacto@textilesandina.ec',
    telefono: '+593 2 298 4410',
    sitioWeb: 'www.textilesandina.ec',
  },
  representante: {
    nombre: 'María Fernanda Torres',
    cedula: '1712345678',
  },
  ubicacion: {
    provincia: 'Pichincha',
    ciudad: 'Quito',
    direccion: 'Av. Eloy Alfaro N32-15 y Av. Amazonas',
  },
  meta: {
    fechaRegistroSafe: '3 ene 2026',
  },
}

export const empresasDisponibles: Empresa[] = [
  empresaActiva,
  {
    id: 'emp-2',
    nombre: 'Comercial del Valle Cía. Ltda.',
    ruc: '0992345678001',
    iniciales: 'CV',
    estado: 'Activa',
    plan: 'Plan Esencial',
    diagnostico: 'Atención',
    diagnosticoFecha: '28 jul 2026',
    general: {
      razonSocial: 'Comercial del Valle Cía. Ltda.',
      tipoContribuyente: 'Persona Jurídica',
      fechaConstitucion: '9 sep 2019',
      numeroEmpleados: '12',
    },
    fiscal: {
      regimenTributario: 'RIMPE Negocio Popular',
      actividadEconomica: 'G4711 - Venta al por menor en comercios no especializados',
      obligadoContabilidad: 'No',
      agenteRetencion: 'No',
    },
    contacto: {
      correo: 'ventas@comercialdelvalle.ec',
      telefono: '+593 4 220 5567',
      sitioWeb: '',
    },
    representante: {
      nombre: 'Jorge Andrés Salazar',
      cedula: '0912345678',
    },
    ubicacion: {
      provincia: 'Guayas',
      ciudad: 'Guayaquil',
      direccion: 'Calle 9na Este 210 y Vía a la Costa',
    },
    meta: {
      fechaRegistroSafe: '12 feb 2026',
    },
  },
]

export const navItems: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { key: 'empresa', label: 'Mi Empresa', path: '/app/empresa', icon: Building2 },
  { key: 'financiero', label: 'Financiero', path: '/app/financiero', icon: LineChart },
  { key: 'indicadores', label: 'Indicadores', path: '/app/indicadores', icon: Gauge },
  { key: 'obligaciones', label: 'Obligaciones', path: '/app/obligaciones', icon: Landmark },
  { key: 'simulador', label: 'Simulador', path: '/app/simulador', icon: Calculator },
  { key: 'marketplace', label: 'Marketplace', path: '/app/marketplace', icon: Store },
  { key: 'plan', label: 'Plan', path: '/app/plan', icon: CreditCard },
  { key: 'configuracion', label: 'Configuración', path: '/app/configuracion', icon: Settings },
]

export const kpis: Kpi[] = [
  {
    id: 'ingresos',
    titulo: 'Ingresos del mes',
    valor: '$48.230',
    sub: 'vs. mes anterior',
    icon: Wallet,
    badge: { texto: '+8,4%', tono: 'positivo' },
  },
  {
    id: 'obligaciones',
    titulo: 'Obligaciones al día',
    valor: '6 / 7',
    sub: '1 próxima a vencer',
    icon: ShieldCheck,
    badge: { texto: 'Atención', tono: 'atencion' },
  },
  {
    id: 'capital',
    titulo: 'Capital de trabajo',
    valor: '$112.540',
    sub: 'liquidez disponible',
    icon: TrendingUp,
  },
  {
    id: 'vencimiento',
    titulo: 'Próximo vencimiento',
    valor: '18 ago',
    sub: 'Declaración de IVA',
    icon: CalendarClock,
    badge: { texto: '5 días', tono: 'atencion' },
  },
]

export const indicadores: Indicador[] = [
  { id: 'liquidez', nombre: 'Liquidez corriente', valor: '1,8', unidad: 'veces', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
  { id: 'endeudamiento', nombre: 'Endeudamiento total', valor: '42', unidad: '%', tendencia: 'down', estado: 'Saludable', tono: 'positivo' },
  { id: 'margen', nombre: 'Margen neto', valor: '11,3', unidad: '%', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
  { id: 'roe', nombre: 'ROE', valor: '9,6', unidad: '%', tendencia: 'down', estado: 'Atención', tono: 'atencion' },
  { id: 'capital-trabajo', nombre: 'Capital de trabajo', valor: '$112.540', unidad: 'USD', tendencia: 'up', estado: 'Saludable', tono: 'positivo' },
]

export const obligaciones: Obligacion[] = [
  { id: 'iva', nombre: 'Declaración de IVA', periodo: 'Jul 2026', vence: '18 ago 2026', monto: '$1.240', estado: 'Próximo', tono: 'atencion' },
  { id: 'retencion', nombre: 'Retención en la fuente', periodo: 'Jul 2026', vence: '10 ago 2026', monto: '$310', estado: 'Al día', tono: 'positivo' },
  { id: 'renta', nombre: 'Impuesto a la Renta', periodo: '2025', vence: '22 abr 2026', monto: '$4.850', estado: 'Al día', tono: 'positivo' },
  { id: 'anticipo', nombre: 'Anticipo Impuesto a la Renta', periodo: '2026', vence: '14 jul 2026', monto: '$960', estado: 'Vencido', tono: 'critico' },
]

export const notificaciones: Notificacion[] = [
  { id: 'n1', titulo: 'IVA de julio vence pronto', mensaje: 'La declaración de IVA vence el 18 de agosto.', fecha: 'hace 2 h', leida: false },
  { id: 'n2', titulo: 'Anticipo IR vencido', mensaje: 'El anticipo del Impuesto a la Renta 2026 está vencido.', fecha: 'hace 1 día', leida: false },
  { id: 'n3', titulo: 'Nuevo indicador calculado', mensaje: 'Se actualizó tu liquidez corriente con datos de julio.', fecha: 'hace 3 días', leida: true },
]

export const chartSeries: ChartSeriesPoint[] = [
  { label: 'Ene', ingresos: 32, gastos: 24, utilidad: 8 },
  { label: 'Feb', ingresos: 35, gastos: 26, utilidad: 9 },
  { label: 'Mar', ingresos: 30, gastos: 25, utilidad: 5 },
  { label: 'Abr', ingresos: 38, gastos: 27, utilidad: 11 },
  { label: 'May', ingresos: 41, gastos: 29, utilidad: 12 },
  { label: 'Jun', ingresos: 39, gastos: 30, utilidad: 9 },
  { label: 'Jul', ingresos: 44, gastos: 31, utilidad: 13 },
  { label: 'Ago', ingresos: 48, gastos: 33, utilidad: 15 },
  { label: 'Sep', ingresos: 45, gastos: 32, utilidad: 13 },
  { label: 'Oct', ingresos: 47, gastos: 34, utilidad: 13 },
  { label: 'Nov', ingresos: 50, gastos: 35, utilidad: 15 },
  { label: 'Dic', ingresos: 53, gastos: 37, utilidad: 16 },
]

type CamposRegistro = Omit<
  RegistroFinanciero,
  'id' | 'periodo' | 'version' | 'estado' | 'observaciones' | 'createdAt' | 'updatedAt'
>

const REGISTRO_JULIO_BASE: CamposRegistro = {
  efectivoEquivalentes: 18400,
  cuentasPorCobrar: 26700,
  inventarios: 31200,
  otrosActivosCorrientes: 4100,
  activoFijoNeto: 96500,
  otrosActivosNoCorrientes: 8200,
  cuentasPorPagar: 22300,
  deudaCortoPlazo: 12000,
  otrosPasivosCorrientes: 5400,
  deudaLargoPlazo: 34000,
  otrosPasivosNoCorrientes: 3600,
  capitalSocial: 80000,
  resultadosAcumulados: 27800,
  ingresosOperacionales: 48200,
  otrosIngresos: 900,
  costoVentas: 27600,
  gastosAdministracion: 6800,
  gastosVentas: 4200,
  otrosGastosOperacionales: 1100,
  gastosFinancieros: 950,
  impuestoRenta: 1700,
  flujoOperacion: 9200,
  flujoInversion: -4500,
  flujoFinanciamiento: -2100,
  comprasPeriodo: 25000,
  capex: 4500,
  depreciacion: 1800,
  numeroEmpleadosPeriodo: 38,
  costoLaboral: 14200,
  gastoID: 0,
  unidadesVendidas: 9600,
}

type FactoresPeriodo = {
  activo: number
  pasivoCorriente: number
  pasivoNoCorriente: number
  ingresos: number
  gastos: number
}

function construirCampos(base: CamposRegistro, factores: FactoresPeriodo): CamposRegistro {
  const activoFields = [
    'efectivoEquivalentes', 'cuentasPorCobrar', 'inventarios', 'otrosActivosCorrientes',
    'activoFijoNeto', 'otrosActivosNoCorrientes',
  ] as const
  const pasivoCorrienteFields = ['cuentasPorPagar', 'deudaCortoPlazo', 'otrosPasivosCorrientes'] as const
  const pasivoNoCorrienteFields = ['deudaLargoPlazo', 'otrosPasivosNoCorrientes'] as const
  const ingresoFields = ['ingresosOperacionales', 'otrosIngresos'] as const
  const gastoFields = [
    'costoVentas', 'gastosAdministracion', 'gastosVentas',
    'otrosGastosOperacionales', 'gastosFinancieros', 'impuestoRenta',
  ] as const

  const resultado = { ...base }
  for (const k of activoFields) resultado[k] = Math.round(base[k] * factores.activo)
  for (const k of pasivoCorrienteFields) resultado[k] = Math.round(base[k] * factores.pasivoCorriente)
  for (const k of pasivoNoCorrienteFields) resultado[k] = Math.round(base[k] * factores.pasivoNoCorriente)
  for (const k of ingresoFields) resultado[k] = Math.round(base[k] * factores.ingresos)
  for (const k of gastoFields) resultado[k] = Math.round(base[k] * factores.gastos)

  resultado.flujoOperacion = Math.round(base.flujoOperacion * factores.ingresos)
  resultado.flujoInversion = Math.round(base.flujoInversion * factores.activo)
  resultado.flujoFinanciamiento = Math.round(base.flujoFinanciamiento * factores.pasivoNoCorriente)
  resultado.comprasPeriodo = Math.round(base.comprasPeriodo * factores.gastos)
  resultado.capex = Math.round(base.capex * factores.activo)
  resultado.depreciacion = Math.round(base.depreciacion * factores.activo)
  resultado.costoLaboral = Math.round(base.costoLaboral * factores.gastos)
  resultado.unidadesVendidas = Math.round(base.unidadesVendidas * factores.ingresos)
  // numeroEmpleadosPeriodo y gastoID quedan sin escalar (igual que en el esquema anterior)

  const activoCorriente = resultado.efectivoEquivalentes + resultado.cuentasPorCobrar + resultado.inventarios + resultado.otrosActivosCorrientes
  const activoNoCorriente = resultado.activoFijoNeto + resultado.otrosActivosNoCorrientes
  const activoTotal = activoCorriente + activoNoCorriente
  const pasivoCorriente = resultado.cuentasPorPagar + resultado.deudaCortoPlazo + resultado.otrosPasivosCorrientes
  const pasivoNoCorriente = resultado.deudaLargoPlazo + resultado.otrosPasivosNoCorrientes
  const pasivoTotal = pasivoCorriente + pasivoNoCorriente

  resultado.capitalSocial = base.capitalSocial
  resultado.resultadosAcumulados = activoTotal - pasivoTotal - resultado.capitalSocial

  return resultado
}

function crearRegistro(params: {
  periodo: string
  version: number
  estado: RegistroFinanciero['estado']
  observaciones: string
  campos: CamposRegistro
  fecha: string
}): RegistroFinanciero {
  return {
    id: crypto.randomUUID(),
    periodo: params.periodo,
    version: params.version,
    estado: params.estado,
    observaciones: params.observaciones,
    ...params.campos,
    createdAt: params.fecha,
    updatedAt: params.fecha,
  }
}

const CAMPOS_JUNIO_V2 = construirCampos(REGISTRO_JULIO_BASE, { activo: 0.96, pasivoCorriente: 0.97, pasivoNoCorriente: 0.98, ingresos: 0.95, gastos: 0.965 })

const registrosTextilesAndina: RegistroFinanciero[] = [
  crearRegistro({
    periodo: '2026-03-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Periodo estable, sin novedades.',
    campos: construirCampos(REGISTRO_JULIO_BASE, { activo: 0.84, pasivoCorriente: 0.88, pasivoNoCorriente: 0.91, ingresos: 0.80, gastos: 0.83 }),
    fecha: '2026-04-03T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-04-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Leve incremento en ventas de temporada.',
    campos: construirCampos(REGISTRO_JULIO_BASE, { activo: 0.89, pasivoCorriente: 0.91, pasivoNoCorriente: 0.93, ingresos: 0.86, gastos: 0.90 }),
    fecha: '2026-05-04T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-05-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Aumento de inventario para producción de invierno.',
    campos: construirCampos(REGISTRO_JULIO_BASE, { activo: 0.93, pasivoCorriente: 0.94, pasivoNoCorriente: 0.96, ingresos: 0.91, gastos: 0.95 }),
    fecha: '2026-06-03T15:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-06-01',
    version: 1,
    estado: 'REEMPLAZADO',
    observaciones: 'Carga inicial con cuentas por cobrar subestimadas.',
    campos: { ...CAMPOS_JUNIO_V2, cuentasPorCobrar: CAMPOS_JUNIO_V2.cuentasPorCobrar - 3000 },
    fecha: '2026-07-02T14:00:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-06-01',
    version: 2,
    estado: 'VIGENTE',
    observaciones: 'Corrección: cuentas por cobrar ajustadas tras conciliación con contabilidad.',
    campos: CAMPOS_JUNIO_V2,
    fecha: '2026-07-05T09:30:00.000Z',
  }),
  crearRegistro({
    periodo: '2026-07-01',
    version: 1,
    estado: 'VIGENTE',
    observaciones: 'Cierre de julio con inventario de temporada alta.',
    campos: construirCampos(REGISTRO_JULIO_BASE, { activo: 1.0, pasivoCorriente: 1.0, pasivoNoCorriente: 1.0, ingresos: 1.0, gastos: 1.0 }),
    fecha: '2026-08-03T16:15:00.000Z',
  }),
  {
    id: crypto.randomUUID(),
    periodo: '2026-08-01',
    version: 1,
    estado: 'BORRADOR',
    observaciones: '',
    efectivoEquivalentes: 19100,
    cuentasPorCobrar: 27500,
    inventarios: 32000,
    otrosActivosCorrientes: 4200,
    activoFijoNeto: 0,
    otrosActivosNoCorrientes: 0,
    cuentasPorPagar: 0,
    deudaCortoPlazo: 0,
    otrosPasivosCorrientes: 0,
    deudaLargoPlazo: 0,
    otrosPasivosNoCorrientes: 0,
    capitalSocial: 0,
    resultadosAcumulados: 0,
    ingresosOperacionales: 0,
    otrosIngresos: 0,
    costoVentas: 0,
    gastosAdministracion: 0,
    gastosVentas: 0,
    otrosGastosOperacionales: 0,
    gastosFinancieros: 0,
    impuestoRenta: 0,
    flujoOperacion: 0,
    flujoInversion: 0,
    flujoFinanciamiento: 0,
    comprasPeriodo: 0,
    capex: 0,
    depreciacion: 0,
    numeroEmpleadosPeriodo: 0,
    costoLaboral: 0,
    gastoID: 0,
    unidadesVendidas: 0,
    createdAt: '2026-08-06T11:00:00.000Z',
    updatedAt: '2026-08-06T11:00:00.000Z',
  },
]

export const registrosFinancierosSemilla: Record<string, RegistroFinanciero[]> = {
  'emp-1': registrosTextilesAndina,
  'emp-2': [],
}

export const indicadoresPrincipalesSemilla: Record<string, string[]> = {
  'emp-1': ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08'],
  'emp-2': ['LIQ_01', 'SOL_01', 'REN_04', 'REN_08'],
}

function fechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
}

function sumarMes(anio: number, mes: number): { anio: number; mes: number } {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 }
}

const DIA_TEXTILES_ANDINA = diaPorNovenoDigito(novenoDigito(empresaActiva.ruc))

function montoConVariacion(base: number, mes: number): number {
  // Variación determinística de hasta ±12% por mes, mismo criterio que construirCampos() arriba
  const factor = 1 + (((mes * 37) % 25) - 12) / 100
  return Math.round(base * factor)
}

function crearObligacionMensual(params: {
  obligacionCodigo: string
  anioPeriodo: number
  mesPeriodo: number
  monto: number
}): ObligacionEmpresa {
  const { anio: anioLimite, mes: mesLimite } = sumarMes(params.anioPeriodo, params.mesPeriodo)
  const fechaLimite = fechaISO(anioLimite, mesLimite, DIA_TEXTILES_ANDINA)
  const yaVencio = diasHasta(fechaLimite, HOY_OBLIGACIONES) < 0
  return {
    id: crypto.randomUUID(),
    obligacionCodigo: params.obligacionCodigo,
    periodo: fechaISO(params.anioPeriodo, params.mesPeriodo, 1),
    fechaLimite,
    montoEstimado: params.monto,
    fechaCumplimiento: yaVencio ? fechaLimite : undefined,
    recordatorioActivo: true,
  }
}

const MONTO_IVA_JULIO = 1240
const MONTO_RET_JULIO = 310

const obligacionesTextilesAndina: ObligacionEmpresa[] = []

for (let mes = 1; mes <= 12; mes++) {
  const montoIva = mes === 7 ? MONTO_IVA_JULIO : montoConVariacion(MONTO_IVA_JULIO, mes)
  const montoRet = mes === 7 ? MONTO_RET_JULIO : montoConVariacion(MONTO_RET_JULIO, mes)
  obligacionesTextilesAndina.push(
    crearObligacionMensual({ obligacionCodigo: 'IVA_MENSUAL', anioPeriodo: 2026, mesPeriodo: mes, monto: montoIva }),
    crearObligacionMensual({ obligacionCodigo: 'RET_FUENTE_MENSUAL', anioPeriodo: 2026, mesPeriodo: mes, monto: montoRet }),
  )
}

obligacionesTextilesAndina.push(
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'IR_SOCIEDADES',
    periodo: '2025-01-01',
    fechaLimite: fechaISO(2026, 4, DIA_TEXTILES_ANDINA),
    montoEstimado: 4850,
    fechaCumplimiento: fechaISO(2026, 4, DIA_TEXTILES_ANDINA),
    recordatorioActivo: true,
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'ANTICIPO_IR',
    periodo: '2026-07-01',
    fechaLimite: fechaISO(2026, 7, DIA_TEXTILES_ANDINA),
    montoEstimado: 960,
    recordatorioActivo: true,
    notas: '1ra cuota',
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'ANTICIPO_IR',
    periodo: '2026-09-01',
    fechaLimite: fechaISO(2026, 9, DIA_TEXTILES_ANDINA),
    montoEstimado: 960,
    recordatorioActivo: true,
    notas: '2da cuota',
  },
)

const obligacionesComercialDelValle: ObligacionEmpresa[] = [
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'CUOTA_RIMPE',
    periodo: '2026-01-01',
    fechaLimite: '2026-07-20',
    montoEstimado: 60,
    fechaCumplimiento: '2026-07-20',
    recordatorioActivo: true,
    notas: '1er semestre 2026',
  },
  {
    id: crypto.randomUUID(),
    obligacionCodigo: 'CUOTA_RIMPE',
    periodo: '2026-07-01',
    fechaLimite: '2027-01-20',
    montoEstimado: 60,
    recordatorioActivo: true,
    notas: '2do semestre 2026',
  },
]

export const obligacionesEmpresaSemilla: Record<string, ObligacionEmpresa[]> = {
  'emp-1': obligacionesTextilesAndina,
  'emp-2': obligacionesComercialDelValle,
}

const registroBaseTextiles = ultimoRegistroVigente(registrosFinancierosSemilla['emp-1'])
if (!registroBaseTextiles) {
  throw new Error('Se esperaba al menos un registro financiero VIGENTE para emp-1 en la semilla')
}

const pctCostoVariableBaseTextiles = pctCostoVariableSugerido(registroBaseTextiles)

const entradasLaboralBajo = {
  numeroContrataciones: 2,
  salarioMensual: 500,
  mesesSimular: 12,
  costoReclutamiento: 400,
  otrosBeneficios: 20,
  incluyeFondosReserva: false,
  ingresoAdicionalEsperado: 1400,
  mesesProductividadPlena: 2,
}

const entradasLaboralCritico = {
  numeroContrataciones: 3,
  salarioMensual: 600,
  mesesSimular: 6,
  costoReclutamiento: 500,
  otrosBeneficios: 0,
  incluyeFondosReserva: true,
  ingresoAdicionalEsperado: 0,
  mesesProductividadPlena: 1,
}

const entradasFinancieroTextiles = {
  incrementoPct: 8,
  mesesSimular: 12,
  inversionInicial: 800,
  gastoOperativoAdicional: 100,
  pctCostoVariable: pctCostoVariableBaseTextiles,
}

const simulacionesTextilesAndina: Simulacion[] = [
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-08-05',
    entradas: entradasLaboralBajo,
    resultado: simularContratacionPersonal(entradasLaboralBajo),
  },
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-07-20',
    entradas: entradasLaboralCritico,
    resultado: simularContratacionPersonal(entradasLaboralCritico),
  },
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'AUMENTO_VENTAS',
    fecha: '2026-08-10',
    entradas: entradasFinancieroTextiles,
    resultado: simularAumentoVentas(
      entradasFinancieroTextiles,
      registroBaseTextiles.ingresosOperacionales,
      utilidadNeta(registroBaseTextiles),
    ),
  },
]

const entradasLaboralComercialDelValle = {
  numeroContrataciones: 1,
  salarioMensual: 460,
  mesesSimular: 6,
  costoReclutamiento: 150,
  otrosBeneficios: 0,
  incluyeFondosReserva: false,
  ingresoAdicionalEsperado: 300,
  mesesProductividadPlena: 2,
}

const simulacionesComercialDelValle: Simulacion[] = [
  {
    id: crypto.randomUUID(),
    escenarioCodigo: 'CONTRATACION_PERSONAL',
    fecha: '2026-07-28',
    entradas: entradasLaboralComercialDelValle,
    resultado: simularContratacionPersonal(entradasLaboralComercialDelValle),
  },
]

export const simulacionesSemilla: Record<string, Simulacion[]> = {
  'emp-1': simulacionesTextilesAndina,
  'emp-2': simulacionesComercialDelValle,
}

export const solicitudesContactoSemilla: Record<string, SolicitudContacto[]> = {
  'emp-1': [],
  'emp-2': [],
}

export const planActivoCodigoSemilla: PlanCodigo = 'CRECIMIENTO'

export const suscripcionSemilla = {
  fechaInicio: '2026-02-10',
  proximaRenovacion: '2026-09-10',
  renovacionAutomatica: true,
  cancelada: false,
}

export const preferenciaUsuarioSemilla: PreferenciaUsuario = {
  notificacionesInternas: true,
  notificacionesCorreo: true,
  recordatoriosTributarios: true,
  notificacionesContacto: true,
  notificacionesSuscripcion: true,
  frecuenciaResumen: 'SEMANAL',
  modoGuiado: true,
}

export const metodosPagoSemilla: MetodoPago[] = [
  {
    id: 'mp-1',
    marca: 'Visa',
    tipo: 'Tarjeta de crédito',
    ultimosCuatro: '5601',
    mesExpiracion: 5,
    anioExpiracion: 2029,
    predeterminado: true,
    estado: 'ACTIVO',
  },
  {
    id: 'mp-2',
    marca: 'Mastercard',
    tipo: 'Tarjeta de crédito',
    ultimosCuatro: '4477',
    mesExpiracion: 11,
    anioExpiracion: 2027,
    predeterminado: false,
    estado: 'ACTIVO',
  },
]

function crearPagoSuscripcion(params: {
  fecha: string
  estado: PagoSuscripcion['estado']
  referencia: string
  mensaje: string
}): PagoSuscripcion {
  return {
    id: crypto.randomUUID(),
    fecha: params.fecha,
    monto: 59,
    estado: params.estado,
    proveedor: 'Gateway mock SAFE',
    referencia: params.referencia,
    factura: params.estado === 'PAGADO' ? `FAC-${params.referencia.slice(-8)}` : null,
    mensaje: params.mensaje,
    planNombre: 'Plan Crecimiento',
    createdAt: `${params.fecha}T09:00:00-05:00`,
  }
}

export const historialPagosSemilla: PagoSuscripcion[] = [
  crearPagoSuscripcion({ fecha: '2026-08-10', estado: 'PAGADO', referencia: 'TXN-2026-0810', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-07-10', estado: 'PAGADO', referencia: 'TXN-2026-0710', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-06-10', estado: 'PAGADO', referencia: 'TXN-2026-0610', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({
    fecha: '2026-05-10',
    estado: 'RECHAZADO',
    referencia: 'TXN-2026-0510',
    mensaje: 'Fondos insuficientes. El sistema reintentó automáticamente al mes siguiente.',
  }),
  crearPagoSuscripcion({ fecha: '2026-04-10', estado: 'PAGADO', referencia: 'TXN-2026-0410', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-03-10', estado: 'PAGADO', referencia: 'TXN-2026-0310', mensaje: 'Pago aprobado.' }),
  crearPagoSuscripcion({ fecha: '2026-02-10', estado: 'PAGADO', referencia: 'TXN-2026-0210', mensaje: 'Pago aprobado.' }),
]
