import { useEffect, useId, useState, type FormEvent } from 'react'
import { Stepper } from '@/components/Stepper'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import type { AdminData, PlanRecord } from '@/portal/admin/types'

type NumericPlanField = 'precio_mensual' | 'dias_prueba' | 'orden_visualizacion'
type PlanErrors = Record<string, string>
const DEFAULT_LIMITS = { EMPRESAS: 1, SIMULACIONES_MENSUALES: 3, CONTACTOS_MARKETPLACE: 2, CONTACTOS_MENSUALES: 2, INFORMES_MENSUALES: 2 }
const steps = ['Información general', 'Precio y configuración', 'Módulos y límites']
const fieldStep: Record<string, number> = { nombre: 0, codigo: 0, orden_visualizacion: 0, precio_mensual: 1, dias_prueba: 1 }
const stepFor = (field: string) => field.startsWith('limit-') ? 2 : fieldStep[field] ?? 0

function blankPlan(data: AdminData): PlanRecord {
  return { id: crypto.randomUUID(), codigo: 'NUEVO_PLAN', nombre: 'Nuevo plan', descripcion: '', precio_mensual: 0, moneda: 'USD', dias_prueba: 14, nivel_soporte: 'ESTANDAR', renovacion_automatica_default: true, orden_visualizacion: data.plans.length + 1, activo: true, updated_at: AHORA_ADMIN, users: 0, modules: ['EMPRESAS', 'FINANZAS'], limits: { ...DEFAULT_LIMITS } }
}

export function AdminPlanDialog({ plan, open, onClose, data, existingPlans, onSave }: {
  plan: PlanRecord | null
  open: boolean
  onClose: () => void
  data: AdminData
  existingPlans: PlanRecord[]
  onSave: (plan: PlanRecord) => void
}) {
  const [form, setForm] = useState<PlanRecord>(() => blankPlan(data))
  const [errors, setErrors] = useState<PlanErrors>({})
  const [step, setStep] = useState(0)
  const baseId = useId().replace(/:/g, '')
  const formId = `${baseId}-form`
  useEffect(() => { if (open) { setForm(plan ? JSON.parse(JSON.stringify(plan)) as PlanRecord : blankPlan(data)); setErrors({}); setStep(0) } }, [data, open, plan])
  const idFor = (field: string) => `${baseId}-${field}`
  const errorFor = (field: string) => errors[field] ? <p id={`${idFor(field)}-error`} role="alert">{errors[field]}</p> : null
  const set = <K extends keyof PlanRecord>(key: K, value: PlanRecord[K]) => setForm((current) => ({ ...current, [key]: value }))
  const setNumeric = (field: NumericPlanField, value: string) => set(field, value as unknown as number)
  const setLimit = (code: string, value: string) => setForm((current) => ({ ...current, limits: { ...current.limits, [code]: value as unknown as number } }))
  const toggleModule = (code: string) => set('modules', form.modules.includes(code) ? form.modules.filter((item) => item !== code) : [...form.modules, code])
  const validate = () => {
    const next: PlanErrors = {}
    const normalizedCode = form.codigo.trim().toLocaleUpperCase('es')
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.'
    if (!normalizedCode) next.codigo = 'El código es obligatorio.'
    else if (existingPlans.some((item) => item.id !== form.id && item.codigo.trim().toLocaleUpperCase('es') === normalizedCode)) next.codigo = 'Ya existe un plan con este código.'
    for (const field of ['precio_mensual', 'dias_prueba', 'orden_visualizacion'] as NumericPlanField[]) {
      const value = Number(form[field])
      if (!Number.isFinite(value) || value < 0) next[field] = 'Ingresa un número finito mayor o igual a cero.'
    }
    for (const [code, raw] of Object.entries(form.limits)) {
      const value = Number(raw)
      if (!Number.isFinite(value) || value < 0) next[`limit-${code}`] = 'El límite debe ser un número finito mayor o igual a cero.'
    }
    setErrors(next)
    const first = Object.keys(next)[0]
    if (first) { setStep(stepFor(first)); requestAnimationFrame(() => document.getElementById(idFor(first))?.focus()) }
    return Object.keys(next).length === 0
  }
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validate()) return
    onSave({ ...form, codigo: form.codigo.trim().toLocaleUpperCase('es'), nombre: form.nombre.trim(), descripcion: form.descripcion.trim(), precio_mensual: Number(form.precio_mensual), dias_prueba: Number(form.dias_prueba), orden_visualizacion: Number(form.orden_visualizacion), limits: Object.fromEntries(Object.entries(form.limits).map(([code, value]) => [code, Number(value)])), updated_at: AHORA_ADMIN, users: plan?.users ?? 0 })
    onClose()
  }
  const textField = (field: 'nombre' | 'codigo', label: string) => <div className="form-field"><label htmlFor={idFor(field)}>{label}</label><input id={idFor(field)} value={form[field]} onChange={(event) => set(field, event.target.value)} aria-describedby={errors[field] ? `${idFor(field)}-error` : undefined} />{errorFor(field)}</div>
  const numberField = (field: NumericPlanField, label: string) => <div className="form-field"><label htmlFor={idFor(field)}>{label}</label><input id={idFor(field)} type="number" min="0" value={form[field]} onChange={(event) => setNumeric(field, event.target.value)} aria-describedby={errors[field] ? `${idFor(field)}-error` : undefined} />{errorFor(field)}</div>
  const isLast = step === steps.length - 1
  return <AdminDialog open={open} title={plan ? `Editar ${plan.nombre}` : 'Crear plan'} description="Configura precio, límites y módulos disponibles." onClose={onClose} wide footer={<>
    <AdminButton onClick={onClose}>Cancelar</AdminButton>
    {step > 0 ? <AdminButton type="button" onClick={() => setStep((current) => current - 1)}>Anterior</AdminButton> : null}
    {isLast ? <AdminButton variant="primary" type="submit" form={formId}>Guardar plan</AdminButton> : <AdminButton variant="primary" type="button" onClick={() => setStep((current) => current + 1)}>Siguiente</AdminButton>}
  </>}>
    <Stepper steps={steps} current={step} />
    <form id={formId} onSubmit={save} className="mt-6">
      {step === 0 ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {textField('nombre', 'Nombre')}{textField('codigo', 'Código')}
        <div className="form-field md:col-span-2"><label htmlFor={idFor('descripcion')}>Descripción</label><textarea id={idFor('descripcion')} value={form.descripcion} onChange={(event) => set('descripcion', event.target.value)} /></div>
        <div className="form-field"><label htmlFor={idFor('moneda')}>Moneda</label><select id={idFor('moneda')} value={form.moneda} onChange={(event) => set('moneda', event.target.value)}><option value="USD">USD</option></select></div>
        <div className="form-field"><label htmlFor={idFor('nivel_soporte')}>Nivel de soporte</label><select id={idFor('nivel_soporte')} value={form.nivel_soporte} onChange={(event) => set('nivel_soporte', event.target.value)}><option value="GENERAL">GENERAL</option><option value="ESTANDAR">ESTANDAR</option><option value="PRIORITARIO">PRIORITARIO</option><option value="PRIORITARIO_DEDICADO">PRIORITARIO DEDICADO</option><option value="DEDICADO">DEDICADO</option></select></div>
        {numberField('orden_visualizacion', 'Orden de visualización')}
      </div> : null}
      {step === 1 ? <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {numberField('precio_mensual', 'Precio mensual')}{numberField('dias_prueba', 'Días de prueba')}
        <div className="form-field flex flex-col gap-2 md:col-span-2">
          <label htmlFor={idFor('renovacion')} className="flex min-h-11 items-center gap-2"><input id={idFor('renovacion')} type="checkbox" checked={form.renovacion_automatica_default} onChange={(event) => set('renovacion_automatica_default', event.target.checked)} />Renovación automática predeterminada</label>
          <label htmlFor={idFor('activo')} className="flex min-h-11 items-center gap-2"><input id={idFor('activo')} type="checkbox" checked={form.activo} onChange={(event) => set('activo', event.target.checked)} />Plan activo</label>
        </div>
      </div> : null}
      {step === 2 ? <div className="grid grid-cols-1 gap-6">
        <fieldset className="form-field"><legend>Módulos habilitados</legend><div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{data.modules.map((module) => { const selected = form.modules.includes(module.codigo); return <label className="flex min-h-11 items-center gap-2" htmlFor={idFor(`module-${module.codigo}`)} key={module.codigo}><input id={idFor(`module-${module.codigo}`)} type="checkbox" checked={selected} onChange={() => toggleModule(module.codigo)} />{module.nombre}</label> })}</div></fieldset>
        <fieldset className="form-field"><legend>Límites del plan</legend><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{Object.entries({ ...DEFAULT_LIMITS, ...form.limits }).map(([code]) => { const field = `limit-${code}`; return <div className="form-field" key={code}><label htmlFor={idFor(field)}>{code.replace(/_/g, ' ').toLocaleLowerCase('es')}</label><input id={idFor(field)} type="number" min="0" value={form.limits[code] ?? DEFAULT_LIMITS[code as keyof typeof DEFAULT_LIMITS] ?? 0} onChange={(event) => setLimit(code, event.target.value)} aria-describedby={errors[field] ? `${idFor(field)}-error` : undefined} />{errorFor(field)}</div> })}</div></fieldset>
      </div> : null}
    </form>
  </AdminDialog>
}
