export const planes = [
  {
    nombre: 'Plan Esencial',
    precio: 29,
    destacado: false,
    empresas: '1 empresa',
    simulaciones: '5 simulaciones / mes',
    soporte: 'Soporte general',
    beneficios: [
      'Dashboard financiero',
      'Estados financieros',
      'Indicadores básicos',
      'Calendario de obligaciones del SRI',
    ],
  },
  {
    nombre: 'Plan Crecimiento',
    precio: 59,
    destacado: true,
    empresas: '3 empresas',
    simulaciones: '20 simulaciones / mes',
    soporte: 'Soporte prioritario',
    beneficios: [
      'Todo lo del Plan Esencial',
      'Indicadores avanzados y comparativos',
      'Simulador de escenarios',
      'Acceso al marketplace de profesionales',
      'Alertas tributarias personalizadas',
    ],
  },
  {
    nombre: 'Plan Corporativo',
    precio: 119,
    destacado: false,
    empresas: '10 empresas (cobro adicional por empresa extra)',
    simulaciones: 'Simulaciones ilimitadas',
    soporte: 'Soporte prioritario dedicado',
    beneficios: [
      'Todo lo del Plan Crecimiento',
      'Reportes exportables y consolidados',
      'Diagnóstico financiero trimestral',
      'Acompañamiento de un asesor SAFE',
    ],
  },
] as const

export const comparativa = [
  { modulo: 'Dashboard financiero', esencial: true, crecimiento: true, corporativo: true },
  { modulo: 'Estados financieros', esencial: true, crecimiento: true, corporativo: true },
  { modulo: 'Indicadores básicos', esencial: true, crecimiento: true, corporativo: true },
  {
    modulo: 'Indicadores avanzados y comparativos',
    esencial: false,
    crecimiento: true,
    corporativo: true,
  },
  { modulo: 'Calendario de obligaciones del SRI', esencial: true, crecimiento: true, corporativo: true },
  { modulo: 'Simulador de escenarios', esencial: false, crecimiento: true, corporativo: true },
  { modulo: 'Marketplace de profesionales', esencial: false, crecimiento: true, corporativo: true },
  {
    modulo: 'Reportes consolidados exportables',
    esencial: false,
    crecimiento: false,
    corporativo: true,
  },
  {
    modulo: 'Diagnóstico financiero trimestral',
    esencial: false,
    crecimiento: false,
    corporativo: true,
  },
] as const

export const planesFaqs = [
  {
    q: '¿Puedo cambiar de plan en cualquier momento?',
    a: 'Sí. El cambio se aplica desde el siguiente periodo de facturación y conservas todo tu histórico.',
  },
  {
    q: '¿Qué pasa si necesito registrar más empresas?',
    a: 'El Plan Corporativo incluye 10 empresas y permite agregar empresas adicionales con un cobro extra por cada una.',
  },
  {
    q: '¿SAFE presenta mis declaraciones ante el SRI?',
    a: 'No. SAFE te muestra qué debes declarar, cuándo y un monto estimado; la presentación la realiza tu empresa o tu contador.',
  },
  {
    q: '¿Los profesionales del marketplace tienen costo aparte?',
    a: 'Sí. Cada profesional define su tarifa referencial y la coordinación final de la cita ocurre directamente entre las partes.',
  },
] as const
