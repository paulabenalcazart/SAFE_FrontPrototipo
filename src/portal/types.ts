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
