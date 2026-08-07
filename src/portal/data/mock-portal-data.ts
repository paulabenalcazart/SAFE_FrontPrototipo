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
  NavItem,
  Notificacion,
  Obligacion,
} from '../types'

export const empresaActiva: Empresa = {
  id: 'emp-1',
  nombre: 'Textiles Andina S.A.',
  ruc: '1792146739001',
  iniciales: 'TA',
}

export const empresasDisponibles: Empresa[] = [
  empresaActiva,
  { id: 'emp-2', nombre: 'Comercial del Valle Cía. Ltda.', ruc: '0992345678001', iniciales: 'CV' },
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

export const planInfo = {
  nombre: 'Plan Crecimiento',
  renovacion: 'Se renueva el 14 de sep. 2026',
}

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
