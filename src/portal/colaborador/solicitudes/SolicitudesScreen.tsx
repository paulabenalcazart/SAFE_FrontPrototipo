import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { SolicitudContacto } from '@/portal/types'
import { SolicitudesKpis } from './SolicitudesKpis'
import { SolicitudesPendientesPanel } from './SolicitudesPendientesPanel'
import { HistorialSolicitudes } from './HistorialSolicitudes'
import { DetalleSolicitudPanel } from './DetalleSolicitudPanel'
import { AceptarSolicitudDialog } from './AceptarSolicitudDialog'
import { RechazarSolicitudDialog } from './RechazarSolicitudDialog'

export function SolicitudesScreen() {
  const navigate = useNavigate()
  const { solicitudId } = useParams<{ solicitudId?: string }>()
  const { solicitudesColaborador, citasColaborador } = usePortalData()

  const [accion, setAccion] = useState<{ tipo: 'aceptar' | 'rechazar'; solicitudId: string } | null>(null)

  const abrirDetalle = (solicitud: SolicitudContacto) => navigate(`/app/solicitudes/${solicitud.id}`)
  const cerrarDetalle = () => navigate('/app/solicitudes')

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-[28px] font-bold leading-tight text-ink-900">Solicitudes y citas</h1>
        <p className="mt-1.5 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-700">
          Revisa las solicitudes de empresas, acepta o rechaza nuevas coordinaciones y consulta tu historial.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="order-2 xl:order-1 xl:col-span-8">
          <SolicitudesPendientesPanel
            solicitudes={solicitudesColaborador}
            onVerDetalle={abrirDetalle}
            onAceptar={(solicitud) => setAccion({ tipo: 'aceptar', solicitudId: solicitud.id })}
            onRechazar={(solicitud) => setAccion({ tipo: 'rechazar', solicitudId: solicitud.id })}
          />
        </div>
        <div className="order-1 xl:order-2 xl:col-span-4">
          <SolicitudesKpis solicitudes={solicitudesColaborador} citas={citasColaborador} />
        </div>
      </div>

      <div className="order-3">
        <HistorialSolicitudes solicitudes={solicitudesColaborador} onVerDetalle={abrirDetalle} />
      </div>

      {solicitudId && (
        <DetalleSolicitudPanel
          solicitudId={solicitudId}
          onCerrar={cerrarDetalle}
          onAceptar={() => setAccion({ tipo: 'aceptar', solicitudId })}
          onRechazar={() => setAccion({ tipo: 'rechazar', solicitudId })}
        />
      )}

      {accion?.tipo === 'aceptar' && (
        <AceptarSolicitudDialog
          solicitudId={accion.solicitudId}
          onCerrar={() => setAccion(null)}
          onExito={() => {
            setAccion(null)
            navigate('/app/solicitudes')
          }}
        />
      )}

      {accion?.tipo === 'rechazar' && (
        <RechazarSolicitudDialog
          solicitudId={accion.solicitudId}
          onCerrar={() => setAccion(null)}
          onExito={() => {
            setAccion(null)
            navigate('/app/solicitudes')
          }}
        />
      )}
    </section>
  )
}
