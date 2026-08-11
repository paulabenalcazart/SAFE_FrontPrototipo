import { BarChart3, Calculator, FileSearch, Landmark, Scale, BriefcaseBusiness, TrendingUp, ReceiptText, type LucideIcon } from 'lucide-react'

export type ServiceIconKey = 'analytics' | 'calculator' | 'documents' | 'tax' | 'legal' | 'business' | 'growth' | 'accounting'

export const ICONO_SERVICIO: Record<ServiceIconKey, LucideIcon> = {
  analytics: BarChart3,
  calculator: Calculator,
  documents: FileSearch,
  tax: Landmark,
  legal: Scale,
  business: BriefcaseBusiness,
  growth: TrendingUp,
  accounting: ReceiptText,
}

export const ETIQUETA_ICONO_SERVICIO: Record<ServiceIconKey, string> = {
  analytics: 'Análisis',
  calculator: 'Cálculo',
  documents: 'Documentos',
  tax: 'Tributario',
  legal: 'Legal',
  business: 'Negocios',
  growth: 'Crecimiento',
  accounting: 'Contabilidad',
}
