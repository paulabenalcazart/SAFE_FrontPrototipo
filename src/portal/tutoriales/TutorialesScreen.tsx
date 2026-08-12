import { CATEGORIAS_TUTORIAL, VIDEO_TUTORIALES } from './catalogo'
import { TutorialesGrid } from './TutorialesGrid'

export function TutorialesScreen() {
  return (
    <TutorialesGrid
      titulo="Video tutoriales"
      descripcion="Aprende a usar SAFE con tutoriales prácticos y paso a paso."
      categorias={CATEGORIAS_TUTORIAL}
      tutoriales={VIDEO_TUTORIALES.filter((t) => t.audiencia === 'EMPRESA')}
    />
  )
}
