import { useEffect, useState, type RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { formatModalidadEtiqueta } from '@/portal/colaborador/formato'
import { haySolapamientoHorario, modalidadesCompatibles, validarBloqueHorario } from '@/portal/colaborador/calculo'
import type { HorarioDisponibilidad, ModalidadAtencion } from '@/portal/types'

const DIAS: { diaSemana: HorarioDisponibilidad['diaSemana']; label: string }[] = [
  { diaSemana: 1, label: 'Lunes' },
  { diaSemana: 2, label: 'Martes' },
  { diaSemana: 3, label: 'Miércoles' },
  { diaSemana: 4, label: 'Jueves' },
  { diaSemana: 5, label: 'Viernes' },
  { diaSemana: 6, label: 'Sábado' },
  { diaSemana: 7, label: 'Domingo' },
]

// Editor de disponibilidad semanal del Colaborador (Sección 13.8). El estado local `value` es el arreglo
// completo de `HorarioDisponibilidad` (los 7 días, editable) — controlado por `EditarPerfilScreen` (Tarea
// 5), igual que `EspecialidadesEditor` (Tarea 6). A diferencia de esa validación (una función pura sobre el
// arreglo), la validez de disponibilidad depende también de `modalidadAtencion` (compatibilidad de
// modalidad por bloque, Sección 13.8) — por eso se expone mediante el callback `onValidityChange`, que el
// padre usa como compuerta booleana en `handleGuardar`, en vez de recalcularla él mismo con una función
// pura como hace con `validarEspecialidades`.
type DisponibilidadEditorProps = {
  value: HorarioDisponibilidad[]
  onChange: (value: HorarioDisponibilidad[]) => void
  modalidadAtencion: ModalidadAtencion
  colaboradorId: string
  onValidityChange: (valido: boolean) => void
  headingRef?: RefObject<HTMLHeadingElement>
}

function bloquesDelDia(value: HorarioDisponibilidad[], dia: HorarioDisponibilidad['diaSemana']): HorarioDisponibilidad[] {
  return value.filter((h) => h.diaSemana === dia)
}

// Candidato por defecto para "Agregar bloque": en vez de proponer siempre 09:00-10:00 (que colisiona con
// cualquier disponibilidad ya sembrada en ese horario), se propone empezar justo donde termina el último
// bloque existente del día, con una duración de 1 hora, recortada para no pasar de las 23:00. Con el día
// vacío se mantiene el valor histórico 09:00-10:00.
function siguienteBloquePorDefecto(bloquesDia: HorarioDisponibilidad[]): { horaInicio: string; horaFin: string } {
  if (bloquesDia.length === 0) return { horaInicio: '09:00', horaFin: '10:00' }
  const ultimoFin = bloquesDia.reduce((max, b) => (b.horaFin > max ? b.horaFin : max), '00:00')
  if (ultimoFin >= '22:00') return { horaInicio: ultimoFin, horaFin: '23:00' }
  const [h, m] = ultimoFin.split(':').map(Number)
  const finMinutos = Math.min(23 * 60, h * 60 + m + 60)
  const horaFin = `${String(Math.floor(finMinutos / 60)).padStart(2, '0')}:${String(finMinutos % 60).padStart(2, '0')}`
  return { horaInicio: ultimoFin, horaFin }
}

export function DisponibilidadEditor({
  value,
  onChange,
  modalidadAtencion,
  colaboradorId,
  onValidityChange,
  headingRef,
}: DisponibilidadEditorProps) {
  // Estado puramente de UI: qué días están "expandidos" (mostrando su lista de bloques + "Agregar bloque").
  // Inicializado desde `value` al montar, pero luego evoluciona de forma independiente — apagar el toggle
  // vacía los bloques del día (Sección 13.8), volver a encenderlo empieza vacío sin restaurar nada.
  const [diasActivos, setDiasActivos] = useState<Record<number, boolean>>(() => {
    const inicial: Record<number, boolean> = {}
    for (const { diaSemana } of DIAS) {
      inicial[diaSemana] = bloquesDelDia(value, diaSemana).length > 0
    }
    return inicial
  })

  // Errores transitorios de la acción "Agregar bloque" / editar un bloque (rango inválido o solapamiento).
  // No bloquean el guardado del formulario general por sí mismos: la acción que los provoca simplemente no
  // se aplica (el bloque inválido nunca entra a `value`), así que no hay estado inválido persistente que
  // reportar al padre.
  const [erroresPorDia, setErroresPorDia] = useState<Record<number, string | undefined>>({})

  // Compatibilidad de modalidad (Sección 13.8: tabla de compatibilidad) — derivada de `value` +
  // `modalidadAtencion`, no de estado local. Si `modalidadAtencion` cambia y deja de admitir la modalidad de
  // un bloque existente, ese bloque se marca con error y el guardado del formulario general queda bloqueado
  // hasta que el usuario lo corrija (no se borra automáticamente).
  const compatibles = modalidadesCompatibles(modalidadAtencion)
  const idsIncompatibles = new Set(value.filter((h) => !compatibles.includes(h.modalidad)).map((h) => h.id))

  useEffect(() => {
    onValidityChange(idsIncompatibles.size === 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, modalidadAtencion])

  const handleToggleDia = (dia: HorarioDisponibilidad['diaSemana']) => {
    const activo = diasActivos[dia]
    if (activo) {
      onChange(value.filter((h) => h.diaSemana !== dia))
      setErroresPorDia((e) => ({ ...e, [dia]: undefined }))
    }
    setDiasActivos((d) => ({ ...d, [dia]: !activo }))
  }

  const handleAgregarBloque = (dia: HorarioDisponibilidad['diaSemana']) => {
    const bloquesDia = bloquesDelDia(value, dia)
    const candidato = siguienteBloquePorDefecto(bloquesDia)

    const errorRango = validarBloqueHorario(candidato)
    if (errorRango) {
      setErroresPorDia((e) => ({ ...e, [dia]: errorRango }))
      return
    }
    if (haySolapamientoHorario(bloquesDia, candidato)) {
      setErroresPorDia((e) => ({ ...e, [dia]: 'Este horario se solapa con un bloque existente.' }))
      return
    }

    setErroresPorDia((e) => ({ ...e, [dia]: undefined }))
    const nuevo: HorarioDisponibilidad = {
      id: crypto.randomUUID(),
      colaboradorId,
      diaSemana: dia,
      horaInicio: candidato.horaInicio,
      horaFin: candidato.horaFin,
      modalidad: compatibles[0],
      activo: true,
    }
    onChange([...value, nuevo])
    setDiasActivos((d) => ({ ...d, [dia]: true }))
  }

  const handleActualizarBloque = (
    id: string,
    patch: Partial<Pick<HorarioDisponibilidad, 'horaInicio' | 'horaFin' | 'modalidad'>>,
  ) => {
    const bloque = value.find((h) => h.id === id)
    if (!bloque) return
    const candidato = { ...bloque, ...patch }
    const bloquesDia = bloquesDelDia(value, bloque.diaSemana)
    const indice = bloquesDia.findIndex((h) => h.id === id)

    const errorRango = validarBloqueHorario(candidato)
    if (errorRango) {
      setErroresPorDia((e) => ({ ...e, [bloque.diaSemana]: errorRango }))
      return
    }
    if (haySolapamientoHorario(bloquesDia, candidato, indice)) {
      setErroresPorDia((e) => ({ ...e, [bloque.diaSemana]: 'Este horario se solapa con un bloque existente.' }))
      return
    }

    setErroresPorDia((e) => ({ ...e, [bloque.diaSemana]: undefined }))
    onChange(value.map((h) => (h.id === id ? candidato : h)))
  }

  const handleEliminarBloque = (id: string) => {
    const bloque = value.find((h) => h.id === id)
    onChange(value.filter((h) => h.id !== id))
    if (bloque) setErroresPorDia((e) => ({ ...e, [bloque.diaSemana]: undefined }))
  }

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 ref={headingRef} tabIndex={-1} className="text-[16px] font-semibold text-ink-900 outline-none">
        Disponibilidad
      </h2>
      <p className="mt-1 text-[12px] text-ink-500">
        Configura tus bloques de disponibilidad semanal por día. Un día sin bloques aparece como "No disponible".
      </p>

      <div className="mt-3.5 flex flex-col gap-3">
        {DIAS.map(({ diaSemana, label }) => {
          const bloquesDia = bloquesDelDia(value, diaSemana)
          const activo = diasActivos[diaSemana]
          return (
            <div key={diaSemana} className="rounded-lg border border-line/70 bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-ink-900">{label}</p>
                  <p className="text-[12px] text-ink-500">
                    {bloquesDia.length === 0
                      ? 'No disponible'
                      : bloquesDia.map((b) => `${b.horaInicio} - ${b.horaFin}`).join(', ')}
                  </p>
                </div>
                <Switch
                  checked={activo}
                  onCheckedChange={() => handleToggleDia(diaSemana)}
                  label={`Disponible los ${label}`}
                />
              </div>

              {activo && (
                <div className="mt-3.5 flex flex-col gap-2.5 border-t border-line-soft pt-3.5">
                  {bloquesDia.map((bloque) => {
                    const incompatible = idsIncompatibles.has(bloque.id)
                    const opcionesModalidad = Array.from(new Set([...compatibles, bloque.modalidad]))
                    return (
                      <div key={bloque.id} className="flex flex-col gap-2 rounded-md border border-line/60 bg-card p-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Label htmlFor={`disp-inicio-${bloque.id}`} className="sr-only">
                            Hora de inicio, {label}
                          </Label>
                          <Input
                            id={`disp-inicio-${bloque.id}`}
                            type="time"
                            value={bloque.horaInicio}
                            onChange={(e) => handleActualizarBloque(bloque.id, { horaInicio: e.target.value })}
                            className="w-[7.5rem]"
                          />
                          <span aria-hidden="true" className="text-[12px] text-ink-500">
                            a
                          </span>
                          <Label htmlFor={`disp-fin-${bloque.id}`} className="sr-only">
                            Hora de fin, {label}
                          </Label>
                          <Input
                            id={`disp-fin-${bloque.id}`}
                            type="time"
                            value={bloque.horaFin}
                            onChange={(e) => handleActualizarBloque(bloque.id, { horaFin: e.target.value })}
                            className="w-[7.5rem]"
                          />
                          <Label htmlFor={`disp-modalidad-${bloque.id}`} className="sr-only">
                            Modalidad, {label}
                          </Label>
                          <Select
                            value={bloque.modalidad}
                            onValueChange={(v) =>
                              handleActualizarBloque(bloque.id, { modalidad: v as ModalidadAtencion })
                            }
                          >
                            <SelectTrigger
                              id={`disp-modalidad-${bloque.id}`}
                              className="w-44"
                              aria-invalid={incompatible}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {opcionesModalidad.map((m) => (
                                <SelectItem key={m} value={m}>
                                  {formatModalidadEtiqueta(m)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEliminarBloque(bloque.id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                        {incompatible && (
                          <p role="alert" className="text-xs font-semibold text-destructive">
                            "{formatModalidadEtiqueta(bloque.modalidad)}" ya no es compatible con tu modalidad de
                            atención general ({formatModalidadEtiqueta(modalidadAtencion)}). Cambia la modalidad de
                            este bloque o quítalo para poder guardar.
                          </p>
                        )}
                      </div>
                    )
                  })}

                  <div>
                    <Button type="button" variant="outline" size="sm" onClick={() => handleAgregarBloque(diaSemana)}>
                      Agregar bloque
                    </Button>
                  </div>
                  {erroresPorDia[diaSemana] && (
                    <p role="alert" className="text-xs font-semibold text-destructive">
                      {erroresPorDia[diaSemana]}
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
