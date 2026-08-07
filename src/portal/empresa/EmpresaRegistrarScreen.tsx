import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalData } from '@/portal/PortalDataContext'
import type { Empresa } from '@/portal/types'
import {
  ACTIVIDAD_ECONOMICA_OPTIONS,
  PROVINCIA_OPTIONS,
  REGIMEN_TRIBUTARIO_OPTIONS,
  SI_NO_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
} from './empresa-form-options'

type WizardStep = 1 | 2 | 3 | 4

type FormDraft = Pick<Empresa, 'nombre' | 'ruc' | 'general' | 'fiscal' | 'contacto' | 'representante' | 'ubicacion'>

const EMPTY_DRAFT: FormDraft = {
  nombre: '',
  ruc: '',
  general: { razonSocial: '', tipoContribuyente: 'Persona Natural', fechaConstitucion: '', numeroEmpleados: '' },
  fiscal: { regimenTributario: '', actividadEconomica: '', obligadoContabilidad: 'No', agenteRetencion: 'No' },
  contacto: { correo: '', telefono: '', sitioWeb: '' },
  representante: { nombre: '', cedula: '' },
  ubicacion: { provincia: '', ciudad: '', direccion: '' },
}

const STEPS: { n: WizardStep; label: string }[] = [
  { n: 1, label: 'Datos generales' },
  { n: 2, label: 'Datos fiscales' },
  { n: 3, label: 'Contacto y representante' },
  { n: 4, label: 'Revisión' },
]

function validateStep1(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.general.razonSocial.trim()) errors.razonSocial = 'La razón social es obligatoria.'
  if (!draft.nombre.trim()) errors.nombre = 'El nombre comercial es obligatorio.'
  if (!draft.ruc.trim()) errors.ruc = 'El RUC es obligatorio.'
  if (!draft.general.fechaConstitucion.trim()) errors.fechaConstitucion = 'La fecha de constitución es obligatoria.'
  if (!draft.general.numeroEmpleados.trim()) errors.numeroEmpleados = 'Indica el número de empleados.'
  return errors
}

function validateStep2(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.fiscal.regimenTributario) errors.regimenTributario = 'Selecciona un régimen tributario.'
  if (!draft.fiscal.actividadEconomica) errors.actividadEconomica = 'Selecciona una actividad económica.'
  return errors
}

function validateStep3(draft: FormDraft) {
  const errors: Record<string, string> = {}
  if (!draft.contacto.correo.trim()) errors.correo = 'El correo es obligatorio.'
  if (!draft.contacto.telefono.trim()) errors.telefono = 'El teléfono es obligatorio.'
  if (!draft.representante.nombre.trim()) errors.representanteNombre = 'El nombre del representante es obligatorio.'
  if (!draft.representante.cedula.trim()) errors.representanteCedula = 'La cédula del representante es obligatoria.'
  if (!draft.ubicacion.provincia) errors.provincia = 'Selecciona una provincia.'
  if (!draft.ubicacion.ciudad.trim()) errors.ciudad = 'La ciudad es obligatoria.'
  if (!draft.ubicacion.direccion.trim()) errors.direccion = 'La dirección es obligatoria.'
  return errors
}

function buildIniciales(nombre: string): string {
  const palabras = nombre.trim().split(/\s+/).filter(Boolean)
  const letras = palabras.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '')
  return letras.join('') || '??'
}

function ReviewGroup({ titulo, items }: { titulo: string; items: { label: string; valor: string }[] }) {
  return (
    <div className="rounded-lg border border-line/70 bg-surface p-4">
      <h3 className="text-sm font-semibold text-navy-700">{titulo}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {items.map((i) => (
          <div key={i.label} className="min-w-0">
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{i.label}</dt>
            <dd className="mt-1 break-words text-[13.5px] leading-relaxed">{i.valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  )
}

export function EmpresaRegistrarScreen() {
  const navigate = useNavigate()
  const { empresas, addEmpresa, setEmpresaActiva } = usePortalData()
  const [step, setStep] = useState<WizardStep>(1)
  const [draft, setDraft] = useState<FormDraft>(EMPTY_DRAFT)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const updateGeneral = (patch: Partial<FormDraft['general']>) =>
    setDraft((d) => ({ ...d, general: { ...d.general, ...patch } }))
  const updateFiscal = (patch: Partial<FormDraft['fiscal']>) =>
    setDraft((d) => ({ ...d, fiscal: { ...d.fiscal, ...patch } }))
  const updateContacto = (patch: Partial<FormDraft['contacto']>) =>
    setDraft((d) => ({ ...d, contacto: { ...d.contacto, ...patch } }))
  const updateRepresentante = (patch: Partial<FormDraft['representante']>) =>
    setDraft((d) => ({ ...d, representante: { ...d.representante, ...patch } }))
  const updateUbicacion = (patch: Partial<FormDraft['ubicacion']>) =>
    setDraft((d) => ({ ...d, ubicacion: { ...d.ubicacion, ...patch } }))

  const handleNext = () => {
    const stepErrors = step === 1 ? validateStep1(draft) : step === 2 ? validateStep2(draft) : validateStep3(draft)
    setErrors(stepErrors)
    if (Object.keys(stepErrors).length > 0) return
    setStep((s) => (s < 4 ? ((s + 1) as WizardStep) : s))
  }

  const handleBack = () => {
    if (step === 1) {
      navigate(empresas.length > 0 ? '/app/empresa' : '/app/dashboard')
      return
    }
    setErrors({})
    setStep((s) => ((s - 1) as WizardStep))
  }

  const handleConfirmar = () => {
    const allErrors = { ...validateStep1(draft), ...validateStep2(draft), ...validateStep3(draft) }
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors)
      setStep(1)
      return
    }
    const id = crypto.randomUUID()
    const nuevaEmpresa: Empresa = {
      id,
      nombre: draft.nombre,
      ruc: draft.ruc,
      iniciales: buildIniciales(draft.nombre),
      estado: 'Activa',
      plan: 'Plan Esencial',
      general: draft.general,
      fiscal: draft.fiscal,
      contacto: draft.contacto,
      representante: draft.representante,
      ubicacion: draft.ubicacion,
      meta: {
        fechaRegistroSafe: new Date().toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' }),
      },
    }
    addEmpresa(nuevaEmpresa)
    setEmpresaActiva(id)
    navigate('/app/empresa')
  }

  return (
    <section className="flex flex-col gap-4.5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Registrar empresa</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Cuatro pasos. La empresa se crea solo cuando confirmes en la revisión.
        </p>
      </div>

      <ol className="flex flex-wrap gap-2.5 sm:gap-4.5">
        {STEPS.map((s) => (
          <li key={s.n} className="flex items-center gap-2">
            <span
              className={`grid h-7.5 w-7.5 place-items-center rounded-full border text-[13px] font-bold ${
                s.n === step
                  ? 'border-navy-600 bg-navy-600 text-white'
                  : s.n < step
                    ? 'border-emerald-brand bg-emerald-soft text-emerald-deep'
                    : 'border-line bg-card text-ink-500'
              }`}
            >
              {s.n}
            </span>
            <span className={`text-[13px] ${s.n === step ? 'font-semibold text-ink-900' : 'text-ink-500'}`}>
              {s.label}
            </span>
          </li>
        ))}
      </ol>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-lg font-semibold">{STEPS[step - 1].label}</h2>

        {step === 1 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-razon-social">Razón social</Label>
              <Input
                id="reg-razon-social"
                value={draft.general.razonSocial}
                onChange={(e) => updateGeneral({ razonSocial: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.razonSocial} />
            </div>
            <div>
              <Label htmlFor="reg-nombre-comercial">Nombre comercial</Label>
              <Input
                id="reg-nombre-comercial"
                value={draft.nombre}
                onChange={(e) => setDraft((d) => ({ ...d, nombre: e.target.value }))}
                className="mt-1.5"
              />
              <FieldError message={errors.nombre} />
            </div>
            <div>
              <Label htmlFor="reg-ruc">RUC</Label>
              <Input
                id="reg-ruc"
                value={draft.ruc}
                onChange={(e) => setDraft((d) => ({ ...d, ruc: e.target.value }))}
                className="mt-1.5"
              />
              <FieldError message={errors.ruc} />
            </div>
            <div>
              <Label htmlFor="reg-tipo-contribuyente">Tipo de contribuyente</Label>
              <Select
                value={draft.general.tipoContribuyente}
                onValueChange={(v) => updateGeneral({ tipoContribuyente: v as Empresa['general']['tipoContribuyente'] })}
              >
                <SelectTrigger id="reg-tipo-contribuyente" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIPO_CONTRIBUYENTE_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reg-fecha-constitucion">Fecha de constitución</Label>
              <Input
                id="reg-fecha-constitucion"
                placeholder="Ej. 14 mar 2016"
                value={draft.general.fechaConstitucion}
                onChange={(e) => updateGeneral({ fechaConstitucion: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.fechaConstitucion} />
            </div>
            <div>
              <Label htmlFor="reg-num-empleados">Número de empleados</Label>
              <Input
                id="reg-num-empleados"
                type="number"
                min="0"
                value={draft.general.numeroEmpleados}
                onChange={(e) => updateGeneral({ numeroEmpleados: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.numeroEmpleados} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 flex flex-col gap-4.5">
            <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
              <div>
                <Label htmlFor="reg-regimen">Régimen tributario</Label>
                <Select value={draft.fiscal.regimenTributario} onValueChange={(v) => updateFiscal({ regimenTributario: v })}>
                  <SelectTrigger id="reg-regimen" className="mt-1.5">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {REGIMEN_TRIBUTARIO_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.regimenTributario} />
              </div>
              <div>
                <Label htmlFor="reg-actividad">Actividad económica</Label>
                <Select value={draft.fiscal.actividadEconomica} onValueChange={(v) => updateFiscal({ actividadEconomica: v })}>
                  <SelectTrigger id="reg-actividad" className="mt-1.5">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTIVIDAD_ECONOMICA_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>
                        {o}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError message={errors.actividadEconomica} />
              </div>
            </div>
            <div className="flex flex-wrap gap-6">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-900">Obligado a llevar contabilidad</span>
                <div className="flex gap-2">
                  {SI_NO_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateFiscal({ obligadoContabilidad: o })}
                      aria-pressed={draft.fiscal.obligadoContabilidad === o}
                      className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                        draft.fiscal.obligadoContabilidad === o
                          ? 'border-navy-600 bg-navy-600 text-white'
                          : 'border-line bg-card text-ink-700'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className="mb-1.5 block text-sm font-medium text-ink-900">Agente de retención</span>
                <div className="flex gap-2">
                  {SI_NO_OPTIONS.map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => updateFiscal({ agenteRetencion: o })}
                      aria-pressed={draft.fiscal.agenteRetencion === o}
                      className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                        draft.fiscal.agenteRetencion === o
                          ? 'border-navy-600 bg-navy-600 text-white'
                          : 'border-line bg-card text-ink-700'
                      }`}
                    >
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
            <div>
              <Label htmlFor="reg-correo">Correo</Label>
              <Input
                id="reg-correo"
                type="email"
                value={draft.contacto.correo}
                onChange={(e) => updateContacto({ correo: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.correo} />
            </div>
            <div>
              <Label htmlFor="reg-telefono">Teléfono</Label>
              <Input
                id="reg-telefono"
                value={draft.contacto.telefono}
                onChange={(e) => updateContacto({ telefono: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.telefono} />
            </div>
            <div>
              <Label htmlFor="reg-sitio-web">Sitio web (opcional)</Label>
              <Input
                id="reg-sitio-web"
                value={draft.contacto.sitioWeb}
                onChange={(e) => updateContacto({ sitioWeb: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="reg-rep-nombre">Nombre del representante legal</Label>
              <Input
                id="reg-rep-nombre"
                value={draft.representante.nombre}
                onChange={(e) => updateRepresentante({ nombre: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.representanteNombre} />
            </div>
            <div>
              <Label htmlFor="reg-rep-cedula">Cédula del representante</Label>
              <Input
                id="reg-rep-cedula"
                value={draft.representante.cedula}
                onChange={(e) => updateRepresentante({ cedula: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.representanteCedula} />
            </div>
            <div>
              <Label htmlFor="reg-provincia">Provincia</Label>
              <Select value={draft.ubicacion.provincia} onValueChange={(v) => updateUbicacion({ provincia: v })}>
                <SelectTrigger id="reg-provincia" className="mt-1.5">
                  <SelectValue placeholder="Selecciona una opción" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCIA_OPTIONS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.provincia} />
            </div>
            <div>
              <Label htmlFor="reg-ciudad">Ciudad</Label>
              <Input
                id="reg-ciudad"
                value={draft.ubicacion.ciudad}
                onChange={(e) => updateUbicacion({ ciudad: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.ciudad} />
            </div>
            <div>
              <Label htmlFor="reg-direccion">Dirección</Label>
              <Input
                id="reg-direccion"
                value={draft.ubicacion.direccion}
                onChange={(e) => updateUbicacion({ direccion: e.target.value })}
                className="mt-1.5"
              />
              <FieldError message={errors.direccion} />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="mt-4 flex flex-col gap-4">
            <ReviewGroup
              titulo="Datos generales"
              items={[
                { label: 'Razón social', valor: draft.general.razonSocial },
                { label: 'Nombre comercial', valor: draft.nombre },
                { label: 'RUC', valor: draft.ruc },
                { label: 'Tipo de contribuyente', valor: draft.general.tipoContribuyente },
                { label: 'Fecha de constitución', valor: draft.general.fechaConstitucion },
                { label: 'Número de empleados', valor: draft.general.numeroEmpleados },
              ]}
            />
            <ReviewGroup
              titulo="Datos fiscales"
              items={[
                { label: 'Régimen tributario', valor: draft.fiscal.regimenTributario },
                { label: 'Actividad económica', valor: draft.fiscal.actividadEconomica },
                { label: 'Obligado a llevar contabilidad', valor: draft.fiscal.obligadoContabilidad },
                { label: 'Agente de retención', valor: draft.fiscal.agenteRetencion },
              ]}
            />
            <ReviewGroup
              titulo="Contacto y ubicación"
              items={[
                { label: 'Correo', valor: draft.contacto.correo },
                { label: 'Teléfono', valor: draft.contacto.telefono },
                { label: 'Sitio web', valor: draft.contacto.sitioWeb || 'No registrado' },
                { label: 'Provincia', valor: draft.ubicacion.provincia },
                { label: 'Ciudad', valor: draft.ubicacion.ciudad },
                { label: 'Dirección', valor: draft.ubicacion.direccion },
              ]}
            />
            <ReviewGroup
              titulo="Representante legal"
              items={[
                { label: 'Nombre', valor: draft.representante.nombre },
                { label: 'Cédula', valor: draft.representante.cedula },
              ]}
            />
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-end gap-2.5 border-t border-line/70 pt-4">
          <button
            type="button"
            onClick={handleBack}
            className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
          >
            Atrás
          </button>
          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
            >
              Siguiente
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmar}
              className="min-h-11 rounded-lg bg-emerald-brand px-4.5 text-sm font-semibold text-white"
            >
              Registrar empresa
            </button>
          )}
        </div>
      </section>
    </section>
  )
}
