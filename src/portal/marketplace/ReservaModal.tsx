import {
  Briefcase,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Send,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatUSD } from '@/portal/financiero/formato'
import type {
  ColaboradorMarketplace,
  ServicioProfesional,
  SolicitudContacto,
} from '@/portal/types'
import {
  bloqueosDeColaborador,
  horariosActivosDeColaborador,
  serviciosActivosDeColaborador,
} from './catalogo'
import {
  generarSlots,
  nombreCompleto,
  obtenerIniciales,
  proximasFechasDisponibles,
} from './calculo'
import {
  formatDuracion,
  formatFechaDisponible,
  formatMetaServicio,
  formatModalidad,
  formatRangoHorario,
} from './formato'

type PasoReserva = 1 | 2 | 3 | 'EXITO'

type ReservaModalProps = {
  abierto: boolean
  profesional: ColaboradorMarketplace
  onCerrar: () => void
}

type ResumenSolicitudProps = {
  empresaNombre: string
  colaborador: ColaboradorMarketplace
  servicio: ServicioProfesional
  fecha: string
  horaInicio: string
  horaFin: string
  descripcion: string
}

const PASOS = [
  { numero: 1, label: 'Servicio' },
  { numero: 2, label: 'Fecha y hora' },
  { numero: 3, label: 'Confirmar' },
] as const

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function ResumenSolicitud({
  empresaNombre,
  colaborador,
  servicio,
  fecha,
  horaInicio,
  horaFin,
  descripcion,
}: ResumenSolicitudProps) {
  return (
    <div className="space-y-4">
      <dl className="divide-y divide-line/70 overflow-hidden rounded-xl border border-line/70 bg-surface/50">
        <div className="flex gap-3 px-4 py-3">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Empresa</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{empresaNombre}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Profesional y servicio</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{nombreCompleto(colaborador)}</dd>
            <dd className="text-xs text-ink-500">{servicio.nombre}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Fecha preferida</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">{formatFechaDisponible(fecha)}</dd>
          </div>
        </div>
        <div className="flex gap-3 px-4 py-3">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" aria-hidden="true" />
          <div className="min-w-0">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Horario preferido</dt>
            <dd className="mt-0.5 text-sm font-medium text-ink-900">
              {formatRangoHorario({ horaInicio, horaFin })} · GMT-5
            </dd>
            <dd className="text-xs text-ink-500">
              {formatDuracion(servicio.duracionEstimadaMinutos)} · {formatModalidad(servicio.modalidad)}
            </dd>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <dt className="text-sm text-ink-500">Tarifa referencial</dt>
          <dd className="num text-sm font-semibold text-ink-900">
            {formatUSD(servicio.tarifaReferencial)}
          </dd>
        </div>
      </dl>

      <div className="rounded-xl border border-line/70 bg-card px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-500">Tu necesidad</p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink-700">{descripcion}</p>
      </div>

      <p className="text-xs leading-5 text-ink-500">
        Esta es una solicitud de contacto. La fecha y hora son preferidas y todavía no constituyen una cita confirmada.
      </p>
    </div>
  )
}

export function ReservaModal({ abierto, profesional, onCerrar }: ReservaModalProps) {
  const { empresaActiva, empresaActivaId, enviarSolicitudContacto } = usePortalData()
  const colaborador = profesional
  const colaboradorId = profesional.id

  const servicios = useMemo(
    () => serviciosActivosDeColaborador(colaboradorId),
    [colaboradorId],
  )
  const horarios = useMemo(
    () => horariosActivosDeColaborador(colaboradorId),
    [colaboradorId],
  )
  const bloqueos = useMemo(
    () => bloqueosDeColaborador(colaboradorId),
    [colaboradorId],
  )

  const [paso, setPaso] = useState<PasoReserva>(1)
  const [servicioId, setServicioId] = useState('')
  const [fechaSeleccionada, setFechaSeleccionada] = useState('')
  const [horaSeleccionada, setHoraSeleccionada] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [intentoPasoDos, setIntentoPasoDos] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState('')
  const [solicitudCreada, setSolicitudCreada] = useState<SolicitudContacto | null>(null)
  const [empresaOrigenNombre, setEmpresaOrigenNombre] = useState('')

  const dialogRef = useRef<HTMLDivElement>(null)
  const dialogTitleRef = useRef<HTMLHeadingElement>(null)
  const pasoTitleRef = useRef<HTMLHeadingElement>(null)
  const fechaGroupRef = useRef<HTMLDivElement>(null)
  const horaGroupRef = useRef<HTMLDivElement>(null)
  const descripcionRef = useRef<HTMLTextAreaElement>(null)
  const pasoAnteriorRef = useRef<PasoReserva | null>(null)
  const empresaAlAbrirRef = useRef<string | null>(null)
  const enviandoRef = useRef(false)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  const reiniciarDraft = useCallback(() => {
    setPaso(1)
    setServicioId(servicios[0]?.id ?? '')
    setFechaSeleccionada('')
    setHoraSeleccionada('')
    setDescripcion('')
    setIntentoPasoDos(false)
    setEnviando(false)
    setErrorEnvio('')
    setSolicitudCreada(null)
    setEmpresaOrigenNombre('')
    enviandoRef.current = false
    pasoAnteriorRef.current = null
  }, [servicios])

  const cerrar = useCallback(() => {
    reiniciarDraft()
    empresaAlAbrirRef.current = null
    onCerrarRef.current()
  }, [reiniciarDraft])

  useEffect(() => {
    if (!abierto) return
    reiniciarDraft()
    empresaAlAbrirRef.current = empresaActivaId
  }, [abierto, colaboradorId, reiniciarDraft])

  useEffect(() => {
    if (
      abierto &&
      empresaAlAbrirRef.current !== null &&
      empresaAlAbrirRef.current !== empresaActivaId
    ) {
      cerrar()
    }
  }, [abierto, cerrar, empresaActivaId])

  const servicioSeleccionado = useMemo(
    () => servicios.find((servicio) => servicio.id === servicioId),
    [servicioId, servicios],
  )

  const fechasDisponibles = useMemo(() => {
    if (!servicioSeleccionado) return []
    return proximasFechasDisponibles({
      servicio: servicioSeleccionado,
      horarios,
      bloqueos,
    })
  }, [bloqueos, horarios, servicioSeleccionado])

  useEffect(() => {
    if (!abierto || !servicioSeleccionado) return
    setFechaSeleccionada(fechasDisponibles[0] ?? '')
    setHoraSeleccionada('')
  }, [abierto, fechasDisponibles, servicioSeleccionado])

  const slots = useMemo(() => {
    if (!servicioSeleccionado || !fechaSeleccionada) return []
    return generarSlots({
      fecha: fechaSeleccionada,
      servicio: servicioSeleccionado,
      horarios,
      bloqueos,
    })
  }, [bloqueos, fechaSeleccionada, horarios, servicioSeleccionado])

  const slotSeleccionado = useMemo(
    () => slots.find((slot) => slot.horaInicio === horaSeleccionada && !slot.ocupado),
    [horaSeleccionada, slots],
  )

  useEffect(() => {
    if (!abierto) return

    const focoAnterior = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
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

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (elemento) =>
          !elemento.hasAttribute('disabled') &&
          elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        dialogTitleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (
        event.shiftKey &&
        (activo === primero || activo === dialogTitleRef.current || !dialog.contains(activo))
      ) {
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

  useEffect(() => {
    if (!abierto) {
      pasoAnteriorRef.current = null
      return
    }
    if (pasoAnteriorRef.current === null) {
      pasoAnteriorRef.current = paso
      return
    }
    if (pasoAnteriorRef.current !== paso) {
      const frame = window.requestAnimationFrame(() => pasoTitleRef.current?.focus())
      pasoAnteriorRef.current = paso
      return () => window.cancelAnimationFrame(frame)
    }
    pasoAnteriorRef.current = paso
  }, [abierto, paso])

  if (!abierto) return null

  const descripcionLimpia = descripcion.trim()
  const errorFecha = intentoPasoDos && !fechaSeleccionada
  const errorHora = intentoPasoDos && !slotSeleccionado
  const errorDescripcion = intentoPasoDos && !descripcionLimpia

  const seleccionarServicio = (id: string) => {
    if (id === servicioId) return
    setServicioId(id)
    setFechaSeleccionada('')
    setHoraSeleccionada('')
    setIntentoPasoDos(false)
    setErrorEnvio('')
  }

  const seleccionarFecha = (fecha: string) => {
    setFechaSeleccionada(fecha)
    setHoraSeleccionada('')
    setErrorEnvio('')
  }

  const continuarDesdeAgenda = () => {
    setIntentoPasoDos(true)

    if (!fechaSeleccionada) {
      fechaGroupRef.current?.focus()
      return
    }
    if (!slotSeleccionado) {
      horaGroupRef.current?.focus()
      return
    }
    if (!descripcionLimpia) {
      descripcionRef.current?.focus()
      return
    }

    setIntentoPasoDos(false)
    setPaso(3)
  }

  const enviar = () => {
    if (
      enviandoRef.current ||
      !servicioSeleccionado ||
      !slotSeleccionado ||
      !fechaSeleccionada ||
      !descripcionLimpia
    ) {
      return
    }

    enviandoRef.current = true
    setEnviando(true)
    setErrorEnvio('')

    const empresaNombre = empresaActiva.nombre
    const creada = enviarSolicitudContacto(empresaActivaId, {
      colaboradorId: colaborador.id,
      servicioId: servicioSeleccionado.id,
      fechaPreferida: fechaSeleccionada,
      horaPreferida: slotSeleccionado.horaInicio,
      descripcion: descripcionLimpia,
    })

    if (!creada) {
      enviandoRef.current = false
      setEnviando(false)
      setErrorEnvio('No pudimos enviar la solicitud. Vuelve a elegir el servicio e inténtalo otra vez.')
      return
    }

    setSolicitudCreada(creada)
    setEmpresaOrigenNombre(empresaNombre)
    setEnviando(false)
    setPaso('EXITO')
  }

  const fechaResumen = solicitudCreada?.fechaPreferida ?? fechaSeleccionada
  const horaResumen = solicitudCreada?.horaPreferida ?? slotSeleccionado?.horaInicio ?? ''
  const horaFinResumen = slotSeleccionado?.horaFin ?? horaResumen
  const descripcionResumen = solicitudCreada?.descripcion ?? descripcionLimpia

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
    >
      <div
        className="animate-safe-fade-in absolute inset-0 bg-navy-900/65 backdrop-blur-sm"
        aria-hidden="true"
        onMouseDown={cerrar}
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-modal-title"
        aria-describedby="reserva-modal-description"
        className="animate-safe-pop-in relative flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-2xl border border-line/70 bg-card shadow-[var(--shadow-float)]"
      >
        <header className="border-b border-line/70 px-4 py-4 sm:px-6">
          <div className="flex items-start gap-3">
            <div
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-navy-100 text-sm font-bold text-navy-700"
              aria-hidden="true"
            >
              {obtenerIniciales({
                nombres: colaborador.nombres,
                apellidos: colaborador.apellidos,
              })}
            </div>
            <div className="min-w-0 flex-1">
              <h2
                ref={dialogTitleRef}
                id="reserva-modal-title"
                tabIndex={-1}
                className="text-lg font-semibold text-ink-900 outline-none"
              >
                Solicitud con {nombreCompleto(colaborador)}
              </h2>
              <p id="reserva-modal-description" className="mt-1 text-xs leading-5 text-ink-500">
                Elige un servicio y una fecha preferida. El profesional confirmará la disponibilidad después.
              </p>
            </div>
            <button
              type="button"
              onClick={cerrar}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-surface hover:text-ink-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40"
              aria-label="Cerrar solicitud"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {paso !== 'EXITO' && (
            <ol className="mt-4 grid grid-cols-3 gap-2" aria-label="Progreso de la solicitud">
              {PASOS.map((item) => {
                const completado = typeof paso === 'number' && paso > item.numero
                const activo = paso === item.numero
                return (
                  <li
                    key={item.numero}
                    aria-current={activo ? 'step' : undefined}
                    className="min-w-0"
                  >
                    <div
                      className={[
                        'h-1.5 rounded-full transition-colors',
                        activo || completado ? 'bg-navy-600' : 'bg-line',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                    <p
                      className={[
                        'mt-1.5 truncate text-[11px] font-medium',
                        activo ? 'text-navy-700' : 'text-ink-500',
                      ].join(' ')}
                    >
                      {item.numero}. {item.label}
                    </p>
                  </li>
                )
              })}
            </ol>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          {paso === 1 && (
            <section aria-labelledby="reserva-paso-servicio">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-servicio"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Elige el servicio que necesitas
              </h3>
              <p className="mt-1 text-sm text-ink-500">La tarifa es referencial y no se cobra en este flujo.</p>

              {servicios.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                  Este profesional no tiene servicios disponibles por el momento.
                </div>
              ) : (
                <div className="mt-4 space-y-3" role="group" aria-label="Servicios disponibles">
                  {servicios.map((servicio) => {
                    const seleccionado = servicio.id === servicioId
                    return (
                      <button
                        key={servicio.id}
                        type="button"
                        aria-pressed={seleccionado}
                        onClick={() => seleccionarServicio(servicio.id)}
                        className={[
                          'min-h-11 w-full rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                          seleccionado
                            ? 'border-navy-500 bg-navy-100/60'
                            : 'border-line/70 bg-card hover:border-navy-500/50 hover:bg-surface/60',
                        ].join(' ')}
                      >
                        <span className="flex items-start justify-between gap-3">
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-ink-900">{servicio.nombre}</span>
                            <span className="mt-1 block text-xs leading-5 text-ink-500">{servicio.descripcion}</span>
                          </span>
                          <span
                            className={[
                              'mt-0.5 h-4 w-4 shrink-0 rounded-full border-2',
                              seleccionado ? 'border-navy-600 bg-navy-600 ring-2 ring-white' : 'border-line bg-white',
                            ].join(' ')}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="mt-3 block text-xs font-medium text-ink-700">
                          {formatMetaServicio(servicio)}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}
            </section>
          )}

          {paso === 2 && servicioSeleccionado && (
            <section aria-labelledby="reserva-paso-agenda">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-agenda"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Elige fecha y hora preferidas
              </h3>
              <p className="mt-1 text-sm text-ink-500">
                Horarios mostrados en GMT-5 · {colaborador.zonaHoraria}
              </p>

              <div
                ref={fechaGroupRef}
                tabIndex={-1}
                className="mt-5 outline-none"
                aria-describedby={errorFecha ? 'reserva-error-fecha' : undefined}
              >
                <p className="text-xs font-semibold text-ink-700">Fecha</p>
                {fechasDisponibles.length === 0 ? (
                  <div className="mt-2 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                    No encontramos fechas con horarios seleccionables durante los próximos 30 días.
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Fechas disponibles">
                    {fechasDisponibles.map((fecha) => (
                      <button
                        key={fecha}
                        type="button"
                        aria-pressed={fecha === fechaSeleccionada}
                        onClick={() => seleccionarFecha(fecha)}
                        className={[
                          'min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                          fecha === fechaSeleccionada
                            ? 'border-navy-600 bg-navy-600 text-white'
                            : 'border-line bg-card text-ink-700 hover:border-navy-500 hover:bg-navy-100/50',
                        ].join(' ')}
                      >
                        {formatFechaDisponible(fecha)}
                      </button>
                    ))}
                  </div>
                )}
                {errorFecha && (
                  <p id="reserva-error-fecha" role="alert" className="mt-2 text-xs text-destructive">
                    Elige una fecha para continuar.
                  </p>
                )}
              </div>

              <div
                ref={horaGroupRef}
                tabIndex={-1}
                className="mt-5 outline-none"
                aria-describedby={errorHora ? 'reserva-error-hora' : undefined}
              >
                <p className="text-xs font-semibold text-ink-700">Hora</p>
                {!fechaSeleccionada ? (
                  <p className="mt-2 text-sm text-ink-500">Primero elige una fecha.</p>
                ) : slots.length === 0 ? (
                  <p className="mt-2 rounded-xl border border-dashed border-line bg-surface p-4 text-sm text-ink-500">
                    No hay horarios disponibles para esta fecha.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Horarios disponibles">
                    {slots.map((slot) => {
                      const seleccionado = slot.horaInicio === horaSeleccionada && !slot.ocupado
                      return (
                        <button
                          key={`${fechaSeleccionada}-${slot.horaInicio}`}
                          type="button"
                          disabled={slot.ocupado}
                          aria-disabled={slot.ocupado}
                          aria-pressed={seleccionado}
                          onClick={() => setHoraSeleccionada(slot.horaInicio)}
                          className={[
                            'min-h-11 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40',
                            slot.ocupado
                              ? 'cursor-not-allowed border-line bg-surface text-ink-500/60 line-through'
                              : seleccionado
                                ? 'border-navy-600 bg-navy-600 text-white'
                                : 'border-line bg-card text-ink-700 hover:border-navy-500 hover:bg-navy-100/50',
                          ].join(' ')}
                        >
                          {formatRangoHorario({ horaInicio: slot.horaInicio, horaFin: slot.horaFin })}
                          {slot.ocupado && <span className="sr-only">, ocupado</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
                {errorHora && (
                  <p id="reserva-error-hora" role="alert" className="mt-2 text-xs text-destructive">
                    Elige una hora disponible para continuar.
                  </p>
                )}
              </div>

              <div className="mt-5">
                <label htmlFor="reserva-descripcion" className="text-xs font-semibold text-ink-700">
                  Describe tu necesidad
                </label>
                <Textarea
                  ref={descripcionRef}
                  id="reserva-descripcion"
                  value={descripcion}
                  maxLength={500}
                  rows={4}
                  onChange={(event) => setDescripcion(event.target.value)}
                  aria-invalid={errorDescripcion}
                  aria-describedby={
                    errorDescripcion
                      ? 'reserva-descripcion-ayuda reserva-error-descripcion'
                      : 'reserva-descripcion-ayuda'
                  }
                  className={errorDescripcion ? 'border-destructive focus-visible:border-destructive' : undefined}
                  placeholder="Cuéntale al profesional qué necesitas resolver y qué resultado esperas."
                />
                <div className="mt-1 flex items-start justify-between gap-3">
                  <p id="reserva-descripcion-ayuda" className="text-[11px] text-ink-500">
                    No incluyas contraseñas, datos bancarios ni información sensible.
                  </p>
                  <span className="num shrink-0 text-[11px] text-ink-500">{descripcion.length}/500</span>
                </div>
                {errorDescripcion && (
                  <p id="reserva-error-descripcion" role="alert" className="mt-2 text-xs text-destructive">
                    Describe brevemente tu necesidad para continuar.
                  </p>
                )}
              </div>
            </section>
          )}

          {paso === 3 && servicioSeleccionado && slotSeleccionado && (
            <section aria-labelledby="reserva-paso-confirmar">
              <h3
                ref={pasoTitleRef}
                id="reserva-paso-confirmar"
                tabIndex={-1}
                className="text-base font-semibold text-ink-900 outline-none"
              >
                Confirma tu solicitud
              </h3>
              <p className="mb-4 mt-1 text-sm text-ink-500">Revisa la información antes de enviarla.</p>
              <ResumenSolicitud
                empresaNombre={empresaActiva.nombre}
                colaborador={colaborador}
                servicio={servicioSeleccionado}
                fecha={fechaSeleccionada}
                horaInicio={slotSeleccionado.horaInicio}
                horaFin={slotSeleccionado.horaFin}
                descripcion={descripcionLimpia}
              />
              {errorEnvio && (
                <p role="alert" className="mt-4 rounded-lg bg-danger-soft px-3 py-2 text-sm text-destructive">
                  {errorEnvio}
                </p>
              )}
            </section>
          )}

          {paso === 'EXITO' && servicioSeleccionado && solicitudCreada && (
            <section role="status" aria-live="polite" aria-labelledby="reserva-exito-titulo">
              <div className="mb-5 text-center">
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-deep" aria-hidden="true" />
                <h3
                  ref={pasoTitleRef}
                  id="reserva-exito-titulo"
                  tabIndex={-1}
                  className="mt-3 text-lg font-semibold text-ink-900 outline-none"
                >
                  Solicitud enviada al profesional
                </h3>
                <span className="mt-2 inline-flex rounded-full bg-emerald-soft px-3 py-1 text-xs font-semibold text-emerald-deep">
                  ENVIADA
                </span>
                <p className="mt-3 text-sm leading-6 text-ink-500">
                  El profesional podrá revisar tu necesidad y responder por medio de SAFE.
                </p>
              </div>

              <ResumenSolicitud
                empresaNombre={empresaOrigenNombre}
                colaborador={colaborador}
                servicio={servicioSeleccionado}
                fecha={fechaResumen}
                horaInicio={horaResumen}
                horaFin={horaFinResumen}
                descripcion={descripcionResumen}
              />
            </section>
          )}
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line/70 bg-card px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
          {paso === 1 && (
            <>
              <Button type="button" variant="outline" size="lg" onClick={cerrar}>
                Cancelar
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={!servicioSeleccionado}
                onClick={() => setPaso(2)}
              >
                Continuar
              </Button>
            </>
          )}

          {paso === 2 && (
            <>
              <Button type="button" variant="outline" size="lg" onClick={() => setPaso(1)}>
                <ChevronLeft aria-hidden="true" />
                Atrás
              </Button>
              <Button
                type="button"
                size="lg"
                disabled={fechasDisponibles.length === 0}
                onClick={continuarDesdeAgenda}
              >
                Revisar solicitud
              </Button>
            </>
          )}

          {paso === 3 && (
            <>
              <Button
                type="button"
                variant="outline"
                size="lg"
                disabled={enviando}
                onClick={() => setPaso(2)}
              >
                <ChevronLeft aria-hidden="true" />
                Atrás
              </Button>
              <Button type="button" size="lg" disabled={enviando} onClick={enviar}>
                <Send aria-hidden="true" />
                {enviando ? 'Enviando…' : 'Enviar solicitud'}
              </Button>
            </>
          )}

          {paso === 'EXITO' && (
            <Button type="button" size="lg" onClick={cerrar}>
              Cerrar
            </Button>
          )}
        </footer>
      </div>
    </div>
  )
}
