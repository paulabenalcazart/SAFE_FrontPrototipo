import { CATEGORIAS_TUTORIAL_COLABORADOR, VIDEO_TUTORIALES_COLABORADOR } from './catalogo'
import { TutorialesGrid } from '@/portal/tutoriales/TutorialesGrid'

export function CollaboratorTutorialsScreen() {
  return (
    <TutorialesGrid
      titulo="Video tutoriales"
      descripcion="Aprende a usar SAFE con tutoriales prácticos y paso a paso para aprovechar al máximo tus herramientas como profesional."
      categorias={CATEGORIAS_TUTORIAL_COLABORADOR}
      tutoriales={VIDEO_TUTORIALES_COLABORADOR}
    />
  )
}
