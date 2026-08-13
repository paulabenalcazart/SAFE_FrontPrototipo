import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import { RESENAS_COLABORADORES } from '@/portal/marketplace/catalogo'
import { PerfilProfesionalContenido } from '@/portal/marketplace/PerfilProfesionalContenido'

export function VistaPreviaPerfilScreen() {
  const navigate = useNavigate()
  const { colaboradorPerfil, serviciosColaborador, horariosColaborador } = usePortalData()
  const resenas = RESENAS_COLABORADORES.filter(
    (r) => r.colaboradorId === colaboradorPerfil.id && r.estado === 'PUBLICADA',
  )

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <section className="flex flex-col gap-4.5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/app/perfil')}
          className="flex min-h-10 items-center gap-1.5 text-[13px] font-semibold text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a mi perfil
        </button>
      </div>
      <PerfilProfesionalContenido
        profesional={colaboradorPerfil}
        servicios={serviciosColaborador.filter((s) => s.activo)}
        horarios={horariosColaborador.filter((h) => h.activo)}
        resenas={resenas}
        modo="vista-previa"
      />
    </section>
  )
}
