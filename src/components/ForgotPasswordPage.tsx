import { useState } from 'react'
import { ArrowLeft, Mail, MailCheck } from 'lucide-react'
import { AuthPhotoPanel, LOGIN_PHOTOS } from '@/components/AuthPhotoPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import safeLogoDark from '@/assets/safe-logo-dark.png'

export function ForgotPasswordPage({
  onVolver,
  onIrInicio,
}: {
  onVolver: () => void
  onIrInicio?: () => void
}) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

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

          <button
            type="button"
            onClick={onVolver}
            className="mt-8 flex items-center gap-1.5 text-sm font-medium text-ink-700 transition-colors hover:text-navy-600"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a iniciar sesión
          </button>

          {!sent ? (
            <>
              <h1 className="mt-5 font-display text-3xl font-extrabold text-navy-900">
                Recuperar contraseña
              </h1>
              <p className="mt-2 text-sm text-ink-700">
                Ingresa tu correo corporativo y te enviaremos un enlace para restablecerla.
              </p>

              <form
                className="mt-7 space-y-5"
                onSubmit={(e) => {
                  e.preventDefault()
                  setSent(true)
                }}
              >
                <div>
                  <Label htmlFor="recovery-email">Correo electrónico</Label>
                  <Input
                    id="recovery-email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@empresa.ec"
                    className="mt-1.5 h-11"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" size="lg" className="w-full hover:scale-[1.01]">
                  Enviar enlace de recuperación
                </Button>
              </form>
            </>
          ) : (
            <div className="animate-safe-pop-in mt-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-soft text-emerald-deep">
                <MailCheck className="h-7 w-7" />
              </div>
              <h1 className="mt-5 font-display text-2xl font-extrabold text-navy-900">
                Revisa tu correo
              </h1>
              <p className="mt-2 text-sm text-ink-700">
                Si <span className="font-semibold text-navy-900">{email || 'tu correo'}</span> está
                registrado en SAFE, enviamos un enlace para restablecer tu contraseña.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2 hover:scale-[1.01]"
                  onClick={() => setSent(false)}
                >
                  <Mail className="h-4 w-4" />
                  Reenviar enlace
                </Button>
                <Button size="lg" className="flex-1 hover:scale-[1.01]" onClick={onVolver}>
                  Volver a iniciar sesión
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthPhotoPanel
        heading="Tu empresa, tus números y tus fechas del SRI, siempre a la vista"
        subheading="Recuperar el acceso toma menos de un minuto."
        photos={LOGIN_PHOTOS}
      />
    </div>
  )
}
