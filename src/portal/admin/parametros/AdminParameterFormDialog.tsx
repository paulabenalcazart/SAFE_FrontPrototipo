import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AHORA_ADMIN } from '@/portal/admin/catalogo'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import type { AdminData, EntityRecord } from '@/portal/admin/types'
import { displayValue } from '@/portal/admin/lib/format'
import { getParameterRows } from './parameterUtils'
import { isRequiredParameterValueBlank, type FormFieldSchema, type ParameterEntityId, type ParameterEntitySchema } from './schemas'

type FieldErrors = Record<string, string>

function initialValues(schema: ParameterEntitySchema, record: EntityRecord | null): Record<string, unknown> {
  return Object.fromEntries(schema.fields.map((field) => [
    field.key,
    record?.[field.key] ?? field.defaultValue ?? (field.type === 'checkbox' ? false : ''),
  ]))
}

function relationOptions(data: AdminData, source: ParameterEntityId | 'modules', labelKey = 'nombre') {
  if (source === 'modules') {
    return data.modules.map((row) => ({ value: row.codigo, label: row.nombre || row.codigo }))
  }
  return getParameterRows(data, source).map((row) => ({
    value: row.id,
    label: String(row[labelKey] ?? row.codigo ?? row.id),
  }))
}

function Field({ field, value, data, error, id, onChange }: {
  field: FormFieldSchema
  value: unknown
  data: AdminData
  error?: string
  id: string
  onChange: (value: unknown) => void
}) {
  const errorId = `${id}-error`
  const describedBy = error ? errorId : undefined
  if (field.type === 'checkbox') {
    return <div className={field.full ? 'form-field md:col-span-2' : 'form-field'}><label htmlFor={id} className="flex min-h-11 items-center gap-2"><input id={id} type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(event.target.checked)} aria-describedby={describedBy} />{field.label}</label>{error ? <p id={errorId} role="alert">{error}</p> : null}</div>
  }
  if (field.type === 'radio') {
    return <fieldset className={field.full ? 'form-field md:col-span-2' : 'form-field'} aria-describedby={describedBy}><legend>{field.label}</legend><div className="flex flex-wrap gap-2">{(field.options ?? []).map((option) => <label key={option} className="flex min-h-11 items-center gap-2"><input type="radio" name={id} value={option} checked={value === option} onChange={() => onChange(option)} aria-checked={value === option} />{option}</label>)}</div>{error ? <p id={errorId} role="alert">{error}</p> : null}</fieldset>
  }
  if (field.type === 'multiselect') {
    const options = field.optionsFrom ? relationOptions(data, field.optionsFrom, field.labelKey) : (field.options ?? []).map((option) => ({ value: option, label: option }))
    const selected = Array.isArray(value) ? value.map(String) : []
    return <div className={field.full ? 'form-field md:col-span-2' : 'form-field'}><label htmlFor={id}>{field.label}</label><select id={id} multiple value={selected} onChange={(event) => onChange(Array.from(event.currentTarget.selectedOptions, (option) => option.value))} aria-describedby={describedBy}>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <p id={errorId} role="alert">{error}</p> : null}</div>
  }
  if (field.type === 'select') {
    const options = field.optionsFrom
      ? relationOptions(data, field.optionsFrom, field.labelKey)
      : (field.options ?? []).map((option) => ({ value: option, label: option || 'Sin selección' }))
    return <div className={field.full ? 'form-field md:col-span-2' : 'form-field'}><label htmlFor={id}>{field.label}</label><select id={id} required={field.required} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy}>{field.nullable ? <option value="">Sin relación</option> : <option value="">Seleccionar</option>}{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{error ? <p id={errorId} role="alert">{error}</p> : null}</div>
  }
  if (field.type === 'textarea' || field.type === 'json') {
    const shown = field.type === 'json' && typeof value === 'object' && value !== null
      ? JSON.stringify(value, null, 2)
      : displayValue(value) === '—' ? '' : String(value ?? '')
    return <div className={field.full ? 'form-field md:col-span-2' : 'form-field'}><label htmlFor={id}>{field.label}</label><textarea id={id} required={field.required} value={shown} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy} />{error ? <p id={errorId} role="alert">{error}</p> : null}</div>
  }
  return <div className={field.full ? 'form-field md:col-span-2' : 'form-field'}><label htmlFor={id}>{field.label}</label><input id={id} required={field.required} type={field.type ?? 'text'} value={String(value ?? '')} onChange={(event) => onChange(event.target.value)} aria-describedby={describedBy} />{error ? <p id={errorId} role="alert">{error}</p> : null}</div>
}

export function AdminParameterFormDialog({ open, onClose, schema, record, data, onSave }: {
  open: boolean
  onClose: () => void
  schema: ParameterEntitySchema
  record: EntityRecord | null
  data: AdminData
  onSave: (row: EntityRecord) => void
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => initialValues(schema, record))
  const [errors, setErrors] = useState<FieldErrors>({})
  const baseId = useId().replace(/:/g, '')
  const fieldRefs = useRef<Record<string, HTMLElement | null>>({})
  const title = useMemo(() => record ? `Editar ${schema.singular}` : `Crear ${schema.singular}`, [record, schema.singular])
  useEffect(() => { if (open) { setValues(initialValues(schema, record)); setErrors({}) } }, [open, record, schema])
  const idFor = (key: string) => `${baseId}-${key}`
  const submit = () => {
    const nextValues: Record<string, unknown> = {}
    const nextErrors: FieldErrors = {}
    for (const field of schema.fields) {
      let value = values[field.key]
      if (field.required && isRequiredParameterValueBlank(value)) {
        nextErrors[field.key] = `${field.label} es obligatorio.`
      }
      if (field.type === 'number') {
        if (value === '' || value === null || value === undefined) value = null
        else {
          const number = Number(value)
          if (!Number.isFinite(number)) nextErrors[field.key] = `${field.label} debe ser un número válido.`
          else value = number
        }
      }
      if (field.type === 'json' && typeof value === 'string') {
        try { value = value.trim() ? JSON.parse(value) : null } catch { nextErrors[field.key] = `${field.label} debe contener JSON válido.` }
      }
      if (field.nullable && value === '') value = null
      nextValues[field.key] = value
    }
    setErrors(nextErrors)
    const firstError = Object.keys(nextErrors)[0]
    if (firstError) {
      requestAnimationFrame(() => document.getElementById(idFor(firstError))?.focus())
      return
    }
    onSave({ ...(record ?? { id: crypto.randomUUID(), created_at: AHORA_ADMIN }), ...nextValues, updated_at: AHORA_ADMIN })
  }
  return <AdminDialog open={open} title={title} description={schema.description} onClose={onClose} wide footer={<><AdminButton onClick={onClose}>Cancelar</AdminButton><AdminButton variant="primary" onClick={submit}>Guardar cambios</AdminButton></>}><div className="grid grid-cols-1 gap-4 md:grid-cols-2">{schema.fields.map((field) => <div key={field.key} ref={(element) => { fieldRefs.current[field.key] = element }} className={field.full ? 'md:col-span-2' : ''}><Field field={field} value={values[field.key]} data={data} error={errors[field.key]} id={idFor(field.key)} onChange={(value) => { setValues((current) => ({ ...current, [field.key]: value })); setErrors((current) => { const copy = { ...current }; delete copy[field.key]; return copy }) }} /></div>)}</div></AdminDialog>
}
