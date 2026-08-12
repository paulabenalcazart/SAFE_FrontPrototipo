import type { RefObject } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { validarEspecialidades } from '@/portal/colaborador/calculo'
import { ESPECIALIDADES_PROFESIONALES, especialidadProfesionalPorId } from '@/portal/marketplace/catalogo'
import type { EspecialidadColaboradorRelacion } from '@/portal/types'

// Editor de especialidades del Colaborador (Sección 13.6). `EspecialidadProfesional` (catálogo del
// marketplace) no tiene un campo `activo` propio — solo `EspecialidadColaboradorRelacion` (la relación
// colaborador-especialidad) lo tiene. Por eso el combobox de "Agregar especialidad" lista todo el catálogo
// (`ESPECIALIDADES_PROFESIONALES`, sin filtrar por `.activo`, que no existe en ese tipo) y solo excluye las
// que ya están presentes en `value` para evitar duplicados desde la UI.
type EspecialidadesEditorProps = {
  value: EspecialidadColaboradorRelacion[]
  onChange: (value: EspecialidadColaboradorRelacion[]) => void
  headingRef?: RefObject<HTMLHeadingElement>
}

export function EspecialidadesEditor({ value, onChange, headingRef }: EspecialidadesEditorProps) {
  const disponibles = ESPECIALIDADES_PROFESIONALES.filter(
    (especialidad) => !value.some((relacion) => relacion.especialidadId === especialidad.id),
  )

  const mensajeError = validarEspecialidades(value)

  const handleAgregar = (especialidadId: string) => {
    if (!especialidadId || value.some((relacion) => relacion.especialidadId === especialidadId)) return
    onChange([...value, { especialidadId, esPrincipal: false, aniosExperiencia: 0, activo: true }])
  }

  const handleMarcarPrincipal = (especialidadId: string) => {
    onChange(value.map((relacion) => ({ ...relacion, esPrincipal: relacion.especialidadId === especialidadId })))
  }

  const handleAniosChange = (especialidadId: string, aniosExperiencia: number) => {
    onChange(
      value.map((relacion) =>
        relacion.especialidadId === especialidadId ? { ...relacion, aniosExperiencia } : relacion,
      ),
    )
  }

  const handleQuitar = (especialidadId: string) => {
    const objetivo = value.find((relacion) => relacion.especialidadId === especialidadId)
    const restantes = value.filter((relacion) => relacion.especialidadId !== especialidadId)
    // Si la especialidad quitada era la principal y quedan otras, no se reasigna automáticamente: se deja
    // en cero principales para que `validarEspecialidades` bloquee el guardado hasta que el usuario elija
    // explícitamente una nueva (Sección 13.6).
    onChange(objetivo?.esPrincipal ? restantes.map((relacion) => ({ ...relacion, esPrincipal: false })) : restantes)
  }

  return (
    <section className="rounded-xl border border-line bg-card p-4.5">
      <h2 ref={headingRef} tabIndex={-1} className="text-[16px] font-semibold text-ink-900 outline-none">
        Especialidades
      </h2>

      {value.length === 0 ? (
        <p className="mt-3.5 text-[13px] text-ink-500">Aún no has agregado especialidades.</p>
      ) : (
        <ul className="mt-3.5 flex flex-col gap-2.5">
          {value.map((relacion) => {
            const especialidad = especialidadProfesionalPorId(relacion.especialidadId)
            const nombre = especialidad?.nombre ?? relacion.especialidadId
            return (
              <li
                key={relacion.especialidadId}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-line/70 bg-surface p-3.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-semibold text-ink-900">{nombre}</p>
                  {relacion.esPrincipal && (
                    <span className="mt-1 inline-block rounded-full bg-navy-100 px-2 py-0.5 text-[11px] font-semibold text-navy-700">
                      Principal
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Label htmlFor={`especialidad-anios-${relacion.especialidadId}`} className="sr-only">
                    Años de experiencia en {nombre}
                  </Label>
                  <Input
                    id={`especialidad-anios-${relacion.especialidadId}`}
                    type="number"
                    min={0}
                    value={relacion.aniosExperiencia}
                    onChange={(e) => {
                      const valor = e.target.value === '' ? 0 : Number(e.target.value)
                      handleAniosChange(relacion.especialidadId, Number.isFinite(valor) ? valor : 0)
                    }}
                    className="w-20"
                  />
                  <span className="text-[12px] text-ink-500">años</span>
                </div>
                {!relacion.esPrincipal && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarcarPrincipal(relacion.especialidadId)}
                  >
                    Marcar como principal
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" onClick={() => handleQuitar(relacion.especialidadId)}>
                  Quitar
                </Button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="mt-4.5 border-t border-line-soft pt-4">
        <Label htmlFor="especialidad-agregar">Agregar especialidad</Label>
        {disponibles.length > 0 ? (
          <Select value="" onValueChange={handleAgregar}>
            <SelectTrigger id="especialidad-agregar" className="mt-1.5 sm:max-w-xs">
              <SelectValue placeholder="Selecciona una especialidad" />
            </SelectTrigger>
            <SelectContent>
              {disponibles.map((especialidad) => (
                <SelectItem key={especialidad.id} value={especialidad.id}>
                  {especialidad.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <p className="mt-1.5 text-[12px] text-ink-500">Ya agregaste todas las especialidades disponibles.</p>
        )}
      </div>

      {mensajeError && (
        <p role="alert" className="mt-3.5 text-xs font-semibold text-destructive">
          {mensajeError}
        </p>
      )}
    </section>
  )
}
