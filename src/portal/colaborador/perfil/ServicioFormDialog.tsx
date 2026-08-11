import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ETIQUETA_ICONO_SERVICIO, type ServiceIconKey } from '@/portal/colaborador/iconos-servicio'
import type { ServicioProfesional } from '@/portal/types'

// Dialog de creación/edición de un servicio del Colaborador (Sección 13.7). Reutiliza el mismo patrón de
// overlay/estructura/focus-trap que `ReservaModal.tsx` (Marketplace, Fase 7): backdrop con blur que cierra
// al hacer click, tarjeta centrada con foco atrapado (Escape cierra, Tab cicla dentro del dialog, se
// restaura el foco anterior al cerrar) y bloqueo de scroll del body mientras está abierto. En móvil
// (< `sm`) la tarjeta ocupa toda la pantalla (hoja full-screen); desde `sm` en adelante se centra como un
// dialog clásico — mismas clases base, con overrides `sm:` para el look de escritorio.
//
// Nota de modalidad (Sección 13.7): a diferencia de la modalidad del Colaborador en general (que sí admite
// "Virtual y presencial"/AMBAS, Tarea 5), la modalidad de un servicio individual (`ServicioProfesional`)
// es `Exclude<ModalidadAtencion,'AMBAS'>` — solo Virtual o Presencial, nunca mixta. Por eso este componente
// no usa `formatModalidadEtiqueta` (que incluye "Virtual y presencial") y en su lugar define sus propias
// dos etiquetas.
type ModalidadServicio = ServicioProfesional['modalidad']

const ETIQUETA_MODALIDAD_SERVICIO: Record<ModalidadServicio, string> = {
  VIRTUAL: 'Virtual',
  PRESENCIAL: 'Presencial',
}

const ICONOS_KEYS = Object.keys(ETIQUETA_ICONO_SERVICIO) as ServiceIconKey[]
const MAX_NOMBRE = 160

export type ServicioFormValues = {
  iconKey: ServiceIconKey
  nombre: string
  descripcion: string
  duracionEstimadaMinutos: number
  tarifaReferencial: number
  modalidad: ModalidadServicio
}

type ServicioFormDialogProps = {
  abierto: boolean
  servicio?: ServicioProfesional | null
  iconKeyInicial?: ServiceIconKey
  onCerrar: () => void
  onConfirmar: (valores: ServicioFormValues) => void
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function valoresIniciales(
  servicio: ServicioProfesional | null | undefined,
  iconKeyInicial: ServiceIconKey | undefined,
): ServicioFormValues {
  if (servicio) {
    return {
      iconKey: iconKeyInicial ?? 'accounting',
      nombre: servicio.nombre,
      descripcion: servicio.descripcion,
      duracionEstimadaMinutos: servicio.duracionEstimadaMinutos,
      tarifaReferencial: servicio.tarifaReferencial,
      modalidad: servicio.modalidad,
    }
  }
  return {
    iconKey: iconKeyInicial ?? 'accounting',
    nombre: '',
    descripcion: '',
    duracionEstimadaMinutos: 60,
    tarifaReferencial: 0,
    modalidad: 'VIRTUAL',
  }
}

export function ServicioFormDialog({
  abierto,
  servicio,
  iconKeyInicial,
  onCerrar,
  onConfirmar,
}: ServicioFormDialogProps) {
  const modoEdicion = Boolean(servicio)

  const [valores, setValores] = useState<ServicioFormValues>(() => valoresIniciales(servicio, iconKeyInicial))
  const [intentoGuardar, setIntentoGuardar] = useState(false)

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return
    setValores(valoresIniciales(servicio, iconKeyInicial))
    setIntentoGuardar(false)
    // Solo se debe reinicializar el formulario cuando el dialog se abre, no en cada cambio de props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto])

  const cerrar = useCallback(() => {
    onCerrarRef.current()
  }, [])

  useEffect(() => {
    if (!abierto) return

    const focoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => dialogTitleRef.current?.focus())

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        cerrar()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (elemento) => !elemento.hasAttribute('disabled') && elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        dialogTitleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (event.shiftKey && (activo === primero || activo === dialogTitleRef.current || !dialog.contains(activo))) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (activo === ultimo || !dialog.contains(activo))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [abierto, cerrar])

  const errores = useMemo(() => {
    const errs: Record<string, string> = {}
    if (!valores.nombre.trim()) errs.nombre = 'Ingresa el nombre del servicio.'
    else if (valores.nombre.length > MAX_NOMBRE) errs.nombre = `El nombre no puede superar los ${MAX_NOMBRE} caracteres.`
    if (!Number.isInteger(valores.duracionEstimadaMinutos) || valores.duracionEstimadaMinutos < 1) {
      errs.duracionEstimadaMinutos = 'Ingresa una duración válida en minutos (mínimo 1).'
    }
    if (!Number.isFinite(valores.tarifaReferencial) || valores.tarifaReferencial < 0) {
      errs.tarifaReferencial = 'Ingresa una tarifa válida.'
    }
    return errs
  }, [valores])

  if (!abierto) return null

  const actualizar = <K extends keyof ServicioFormValues>(clave: K, valor: ServicioFormValues[K]) => {
    setValores((v) => ({ ...v, [clave]: valor }))
  }

  const handleGuardar = () => {
    setIntentoGuardar(true)
    if (Object.keys(errores).length > 0) return
    onConfirmar({ ...valores, nombre: valores.nombre.trim(), descripcion: valores.descripcion.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={cerrar}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="servicio-dialog-title"
        className="animate-safe-pop-in relative flex h-full max-h-full w-full flex-col overflow-hidden border border-line/70 bg-card shadow-[var(--shadow-float)] sm:h-auto sm:max-h-[88vh] sm:max-w-[560px] sm:rounded-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-line/70 px-4 py-4 sm:px-6">
          <h2
            ref={dialogTitleRef}
            id="servicio-dialog-title"
            tabIndex={-1}
            className="text-lg font-semibold text-ink-900 outline-none"
          >
            {modoEdicion ? 'Editar servicio' : 'Agregar servicio'}
          </h2>
          <button
            type="button"
            onClick={cerrar}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4.5">
            <div>
              <Label htmlFor="servicio-icono">Icono</Label>
              <Select value={valores.iconKey} onValueChange={(v) => actualizar('iconKey', v as ServiceIconKey)}>
                <SelectTrigger id="servicio-icono" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICONOS_KEYS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {ETIQUETA_ICONO_SERVICIO[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="servicio-nombre">Nombre</Label>
              <Input
                id="servicio-nombre"
                value={valores.nombre}
                maxLength={MAX_NOMBRE}
                required
                onChange={(e) => actualizar('nombre', e.target.value)}
                className="mt-1.5"
                aria-invalid={intentoGuardar && Boolean(errores.nombre)}
              />
              {intentoGuardar && errores.nombre && (
                <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                  {errores.nombre}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="servicio-descripcion">Descripción</Label>
              <Textarea
                id="servicio-descripcion"
                value={valores.descripcion}
                onChange={(e) => actualizar('descripcion', e.target.value)}
                className="mt-1.5"
                rows={3}
                placeholder="Opcional"
              />
            </div>

            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="servicio-duracion">Duración estimada (minutos)</Label>
                <Input
                  id="servicio-duracion"
                  type="number"
                  min={1}
                  step={1}
                  required
                  value={valores.duracionEstimadaMinutos}
                  onChange={(e) => {
                    const valor = e.target.value === '' ? 0 : Math.trunc(Number(e.target.value))
                    actualizar('duracionEstimadaMinutos', Number.isFinite(valor) ? valor : 0)
                  }}
                  className="mt-1.5"
                  aria-invalid={intentoGuardar && Boolean(errores.duracionEstimadaMinutos)}
                />
                <p className="mt-1.5 text-[12px] text-ink-500">Ejemplo: 60 = 1 hora</p>
                {intentoGuardar && errores.duracionEstimadaMinutos && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                    {errores.duracionEstimadaMinutos}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="servicio-tarifa">Tarifa</Label>
                <Input
                  id="servicio-tarifa"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={valores.tarifaReferencial}
                  onChange={(e) => {
                    const valor = e.target.value === '' ? 0 : Number(e.target.value)
                    actualizar('tarifaReferencial', Number.isFinite(valor) ? valor : 0)
                  }}
                  className="mt-1.5"
                  aria-invalid={intentoGuardar && Boolean(errores.tarifaReferencial)}
                />
                {intentoGuardar && errores.tarifaReferencial && (
                  <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
                    {errores.tarifaReferencial}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="servicio-moneda">Moneda</Label>
                <Input id="servicio-moneda" value="USD" readOnly disabled className="mt-1.5" />
              </div>

              <div>
                <Label htmlFor="servicio-modalidad">Modalidad</Label>
                <Select
                  value={valores.modalidad}
                  onValueChange={(v) => actualizar('modalidad', v as ModalidadServicio)}
                >
                  <SelectTrigger id="servicio-modalidad" className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ETIQUETA_MODALIDAD_SERVICIO) as ModalidadServicio[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {ETIQUETA_MODALIDAD_SERVICIO[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" size="lg" onClick={cerrar}>
            Cancelar
          </Button>
          <Button type="button" size="lg" onClick={handleGuardar}>
            {modoEdicion ? 'Guardar cambios' : 'Agregar servicio'}
          </Button>
        </footer>
      </div>
    </div>
  )
}
