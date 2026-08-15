import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'

export function EditarCuentaScreen() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { empresas, empresaActiva, setEmpresaActiva } = usePortalData()
  const [nombres, setNombres] = useState(user?.nombres ?? '')
  const [apellidos, setApellidos] = useState(user?.apellidos ?? '')
  const [correo, setCorreo] = useState(user?.correo ?? '')

  if (!user) return null

  const handleCancelar = () => navigate('/app/configuracion')

  const handleGuardar = () => {
    updateUser({ nombres, apellidos, correo })
    navigate('/app/configuracion')
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <button
          type="button"
          onClick={handleCancelar}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-[15px] w-[15px]" aria-hidden="true" />
          Configuración
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Editar cuenta</h1>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-3">
          <div>
            <Label htmlFor="cuenta-nombres">Nombres</Label>
            <Input
              id="cuenta-nombres"
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cuenta-apellidos">Apellidos</Label>
            <Input
              id="cuenta-apellidos"
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cuenta-correo">Correo electrónico</Label>
            <Input
              id="cuenta-correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>
        <div className="mt-4.5 flex flex-wrap justify-end gap-2.5 border-t border-line-soft pt-4">
          <Button variant="outline" onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button onClick={handleGuardar}>Guardar</Button>
        </div>
      </section>

      {user.role === 'EMPRESA' && (
      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-[16px] font-semibold">Tus empresas</h2>
        <p className="mt-1 text-[13px] text-ink-700">Empresas asociadas a tu cuenta.</p>
        <div className="mt-3.5 flex flex-col gap-2">
          {empresas.map((empresa) => (
            <div
              key={empresa.id}
              className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line/70 p-3"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-navy-100 text-[12px] font-bold text-navy-700">
                {empresa.iniciales}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink-900">{empresa.nombre}</p>
                <p className="truncate text-[11.5px] text-ink-500">RUC {empresa.ruc}</p>
              </div>
              {empresa.id === empresaActiva.id ? (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-soft px-2.5 py-1 text-[11.5px] font-semibold text-emerald-deep">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                  Empresa actual
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setEmpresaActiva(empresa.id)}
                  className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700"
                >
                  Cambiar a esta empresa
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/empresa/registrar')}
          className="mt-3.5 flex min-h-10 items-center gap-2 text-[13.5px] font-semibold text-navy-600 hover:text-navy-700"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Registrar otra empresa
        </button>
      </section>
      )}
    </section>
  )
}
