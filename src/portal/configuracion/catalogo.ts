import type { DocumentoLegal } from '@/portal/types'

export const DOCUMENTOS_LEGALES: DocumentoLegal[] = [
  {
    id: 'privacidad',
    titulo: 'Política de privacidad',
    descripcion: 'Cómo SAFE recopila, usa y protege tus datos y los de tu empresa.',
    href: '/privacidad',
  },
  {
    id: 'terminos',
    titulo: 'Términos y condiciones',
    descripcion: 'Las condiciones de uso de la plataforma y del marketplace de profesionales.',
    href: '/terminos',
  },
  {
    id: 'descargo',
    titulo: 'Descargo de responsabilidad',
    descripcion:
      'SAFE es una herramienta de apoyo. Los cálculos e indicadores no sustituyen la asesoría de un profesional contable o tributario.',
  },
]
