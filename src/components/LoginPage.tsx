import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { AuthPhotoPanel, LOGIN_PHOTOS } from '@/components/AuthPhotoPanel'
import { GoogleIcon } from '@/components/GoogleIcon'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import safeLogoDark from '@/assets/safe-logo-dark.png'

export function LoginPage({
  onIngresar,
  onRecuperar,
  onIrInicio,
  onIrCrearCuenta,
}: {
  onIngresar?: () => void
  onRecuperar: () => void
  onIrInicio?: () => void
  onIrCrearCuenta?: () => void
}) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="grid min-h-[100dvh] bg-surface/60 lg:grid-cols-2">
      <div className="flex items-center justify-center px-5 py-8 sm:px-10 sm:py-12 lg:bg-white lg:px-16 xl:px-24">
        <div className="animate-safe-fade-up w-full max-w-md rounded-2xl border border-line/80 bg-white p-6 shadow-[var(--shadow-card)] sm:p-8 lg:border-0 lg:p-0 lg:shadow-none">
          <button
            type="button"
            onClick={onIrInicio}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img src={safeLogoDark} alt="SAFE" className="h-8 w-auto" />
          </button>

          <h1 className="mt-8 font-display text-3xl font-extrabold text-navy-900">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-sm text-ink-700">Ingresa con tu correo corporativo.</p>

          <form
            className="mt-7 space-y-5"
            onSubmit={(e) => {
              e.preventDefault()
              onIngresar?.()
            }}
          >
            <div>
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="tu@empresa.ec"
                className="mt-1.5 h-11"
                required
              />
            </div>

            <div>
              <Label htmlFor="login-password">Contraseña</Label>
              <div className="relative mt-1.5">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
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

          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700">
                <Checkbox />
                Recuérdame
              </label>
              <button
                type="button"
                onClick={onRecuperar}
                className="text-sm font-semibold text-navy-500 transition-colors hover:text-navy-600 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>

            <Button type="submit" size="lg" className="w-full hover:scale-[1.01]">
              Ingresar
            </Button>

            <div className="flex items-center gap-3 text-xs text-ink-500">
              <span className="h-px flex-1 bg-line" />
              o continúa con
              <span className="h-px flex-1 bg-line" />
            </div>

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
            ¿No tienes cuenta?{' '}
            <button
              type="button"
              onClick={onIrCrearCuenta}
              className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
            >
              Crear cuenta
            </button>
          </p>
        </div>
      </div>

      <AuthPhotoPanel
        heading="Tu empresa, tus números y tus fechas del SRI, siempre a la vista"
        subheading="Todo tu cumplimiento tributario y financiero, organizado en un solo lugar."
        photos={LOGIN_PHOTOS}
      />
    </div>
  )
}
