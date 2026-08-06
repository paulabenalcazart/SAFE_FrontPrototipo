import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { AuthPhotoPanel, SIGNUP_PHOTOS } from '@/components/AuthPhotoPanel'
import { GoogleIcon } from '@/components/GoogleIcon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupPage({
  onCrearCuenta,
  onIrLogin,
  onIrInicio,
  onIrTerminos,
  onIrPrivacidad,
}: {
  onCrearCuenta?: () => void
  onIrLogin: () => void
  onIrInicio?: () => void
  onIrTerminos?: () => void
  onIrPrivacidad?: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthPhotoPanel
        heading="Ordena las finanzas, los impuestos y lo legal de tu PYME"
        subheading="Crea tu cuenta primero; puedes registrar tu empresa cuando tengas los datos a la mano."
        photos={SIGNUP_PHOTOS}
      />

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="animate-safe-fade-up w-full max-w-md">
          <button
            type="button"
            onClick={onIrInicio}
            className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 font-display text-sm font-extrabold text-white">
              S
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-navy-900">
              SAFE
            </span>
          </button>

          <h1 className="mt-8 font-display text-3xl font-extrabold text-navy-900">Crear cuenta</h1>
          <p className="mt-2 text-sm text-ink-700">Es gratis y toma menos de un minuto.</p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              onCrearCuenta?.()
            }}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="signup-nombres">Nombres</Label>
                <Input id="signup-nombres" placeholder="Mateo" className="mt-1.5 h-11" required />
              </div>
              <div>
                <Label htmlFor="signup-apellidos">Apellidos</Label>
                <Input id="signup-apellidos" placeholder="Villacís" className="mt-1.5 h-11" required />
              </div>
            </div>

            <div>
              <Label htmlFor="signup-email">Correo electrónico</Label>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="mateo.villacis@empresa.ec"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="signup-password">Contraseña</Label>
              <div className="relative mt-1.5">
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-500 transition-colors hover:text-navy-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox id="signup-acepto" required className="mt-0.5" />
              <Label htmlFor="signup-acepto" className="text-sm font-normal leading-relaxed text-ink-700">
                Acepto los{' '}
                <button
                  type="button"
                  onClick={onIrTerminos}
                  className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
                >
                  Términos y Condiciones
                </button>{' '}
                y la{' '}
                <button
                  type="button"
                  onClick={onIrPrivacidad}
                  className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
                >
                  Política de Privacidad
                </button>
                , incluyendo el tratamiento de mis datos personales.
              </Label>
            </div>

            <Button type="submit" size="lg" className="w-full hover:scale-[1.01]">
              Crear cuenta
            </Button>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full gap-2.5 hover:scale-[1.01]"
            >
              <GoogleIcon className="h-4.5 w-4.5" />
              Continuar con Google
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-700">
            ¿Ya tienes cuenta?{' '}
            <button
              type="button"
              onClick={onIrLogin}
              className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
