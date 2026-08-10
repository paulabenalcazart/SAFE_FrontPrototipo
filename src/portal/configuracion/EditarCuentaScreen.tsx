import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/auth/AuthContext'

export function EditarCuentaScreen() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
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
    </section>
  )
}
