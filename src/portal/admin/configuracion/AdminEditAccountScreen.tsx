import { useId, useState, type FormEvent } from 'react'
import { ArrowLeft, Save } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'

export function AdminEditAccountScreen() {
  const { data, updateAdminProfile } = useAdminData()
  const [nombres, setNombres] = useState(data.admin.nombres)
  const [apellidos, setApellidos] = useState(data.admin.apellidos)
  const [correo, setCorreo] = useState(data.admin.correo)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const baseId = useId().replace(/:/g, '')
  const idFor = (field: string) => `${baseId}-${field}`

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!nombres.trim() || !apellidos.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())) {
      setError('Completa nombres, apellidos y un correo válido.')
      return
    }
    setError('')
    updateAdminProfile({ nombres: nombres.trim(), apellidos: apellidos.trim(), correo: correo.trim() })
    setSaved(true)
  }

  return (
    <>
      <AdminPageHeader
        title="Mi cuenta"
        description="Actualiza tus datos de acceso como administrador."
        actions={
          <Link className="admin-button admin-button--secondary admin-button--md" to="/app/configuracion">
            <ArrowLeft aria-hidden="true" size={16} />
            Configuración
          </Link>
        }
      />
      <AdminCard className="mt-5 p-4">
        <form onSubmit={save}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="form-field">
              <label htmlFor={idFor('nombres')}>Nombres</label>
              <input id={idFor('nombres')} value={nombres} onChange={(event) => setNombres(event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor={idFor('apellidos')}>Apellidos</label>
              <input id={idFor('apellidos')} value={apellidos} onChange={(event) => setApellidos(event.target.value)} />
            </div>
            <div className="form-field md:col-span-2">
              <label htmlFor={idFor('correo')}>Correo electrónico</label>
              <input id={idFor('correo')} type="email" value={correo} onChange={(event) => setCorreo(event.target.value)} />
            </div>
          </div>
          {error && <p role="alert" className="mt-3 text-sm font-semibold text-destructive">{error}</p>}
          {saved && !error && (
            <p role="status" className="mt-3 text-sm font-semibold text-emerald-600">
              Cuenta actualizada correctamente.
            </p>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <AdminButton variant="primary" type="submit">
              <Save aria-hidden="true" size={16} />
              Guardar cambios
            </AdminButton>
          </div>
        </form>
      </AdminCard>
    </>
  )
}
