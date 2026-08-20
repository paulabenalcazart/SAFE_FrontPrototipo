import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/portal/components/Card'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatMetaServicio } from '@/portal/marketplace/formato'
import { ICONO_SERVICIO, type ServiceIconKey } from '@/portal/colaborador/iconos-servicio'
import type { ServicioProfesional } from '@/portal/types'
import { ServicioFormDialog, type ServicioFormValues } from './ServicioFormDialog'

// Editor de servicios del Colaborador (Sección 13.7). Lista TODOS los servicios (activos e inactivos, con
// badge de estado) — a diferencia de `PerfilColaboradorScreen` (Tarea 2), que solo muestra los activos en
// la vista previa pública. Las mutaciones son inmediatas contra `PortalDataContext` (mismo patrón que las
// acciones de reserva de Marketplace, Fase 7): no hay estado de formulario local que "guardar" junto al
// resto de `EditarPerfilScreen`.
export function ServiciosEditor() {
  const {
    serviciosColaborador,
    agregarServicioColaborador,
    actualizarServicioColaborador,
    desactivarServicioColaborador,
    solicitudesColaborador,
    iconosServicio,
    establecerIconoServicio,
  } = usePortalData()

  const [dialogAbierto, setDialogAbierto] = useState(false)
  const [servicioEnEdicion, setServicioEnEdicion] = useState<ServicioProfesional | null>(null)

  const abrirCreacion = () => {
    setServicioEnEdicion(null)
    setDialogAbierto(true)
  }

  const abrirEdicion = (servicio: ServicioProfesional) => {
    setServicioEnEdicion(servicio)
    setDialogAbierto(true)
  }

  const cerrarDialog = () => {
    setDialogAbierto(false)
    setServicioEnEdicion(null)
  }

  const confirmarDialog = (valores: ServicioFormValues) => {
    const { iconKey, ...datosServicio } = valores
    if (servicioEnEdicion) {
      actualizarServicioColaborador(servicioEnEdicion.id, datosServicio)
      establecerIconoServicio(servicioEnEdicion.id, iconKey)
    } else {
      const creado = agregarServicioColaborador(datosServicio)
      establecerIconoServicio(creado.id, iconKey)
    }
    cerrarDialog()
  }

  const handleDesactivar = (servicio: ServicioProfesional) => {
    const tieneHistorial = solicitudesColaborador.some((s) => s.servicioId === servicio.id)
    if (tieneHistorial) {
      const confirmado = window.confirm(
        'Este servicio tiene solicitudes históricas. ¿Deseas desactivarlo de todas formas?',
      )
      if (!confirmado) return
    }
    desactivarServicioColaborador(servicio.id)
  }

  return (
    <Card as="section" padding="lg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[16px] font-semibold text-ink-900">Servicios</h2>
        <Button type="button" onClick={abrirCreacion}>
          Agregar servicio
        </Button>
      </div>

      {serviciosColaborador.length === 0 ? (
        <p className="mt-3.5 text-[13px] text-ink-500">Aún no has agregado servicios.</p>
      ) : (
        <ul className="mt-3.5 flex flex-col gap-2.5">
          {serviciosColaborador.map((servicio) => {
            const iconKey: ServiceIconKey = iconosServicio[servicio.id] ?? 'accounting'
            const LucideIcon = ICONO_SERVICIO[iconKey]
            return (
              <li
                key={servicio.id}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line/70 bg-surface p-3.5"
              >
                <span
                  aria-hidden="true"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700"
                >
                  <LucideIcon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-[13.5px] font-semibold text-ink-900">{servicio.nombre}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                        servicio.activo ? 'bg-emerald-soft text-emerald-deep' : 'bg-surface text-ink-500'
                      }`}
                    >
                      {servicio.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  {servicio.descripcion && (
                    <p className="mt-0.5 truncate text-[12.5px] text-ink-500">{servicio.descripcion}</p>
                  )}
                  <p className="mt-1 text-[12px] font-medium text-navy-600">{formatMetaServicio(servicio)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button type="button" variant="outline" size="sm" onClick={() => abrirEdicion(servicio)}>
                    Editar
                  </Button>
                  {servicio.activo && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleDesactivar(servicio)}>
                      Desactivar
                    </Button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ServicioFormDialog
        abierto={dialogAbierto}
        servicio={servicioEnEdicion}
        iconKeyInicial={servicioEnEdicion ? (iconosServicio[servicioEnEdicion.id] ?? 'accounting') : 'accounting'}
        onCerrar={cerrarDialog}
        onConfirmar={confirmarDialog}
      />
    </Card>
  )
}
