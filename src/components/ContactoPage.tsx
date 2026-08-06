import { useState } from 'react'
import { ArrowUpRight, CheckCircle2, Mail, MapPin, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const INTERESES = [
  'Declaraciones del SRI',
  'Contabilidad y libros contables',
  'Facturación electrónica',
  'Nómina y roles de pago',
  'Reportes e indicadores financieros',
  'Simulador tributario',
  'Asesoría legal y contable',
  'Otro',
]

const MAPS_QUERY = encodeURIComponent('Universidad Espíritu Santo, Samborondón, Ecuador')
const MAPS_EMBED_SRC = `https://www.google.com/maps?q=${MAPS_QUERY}&output=embed`
const MAPS_DIRECTIONS_HREF = `https://www.google.com/maps/search/?api=1&query=${MAPS_QUERY}`

export function ContactoPage({ onIrPrivacidad }: { onIrPrivacidad?: () => void }) {
  const { ref, inView } = useReveal<HTMLElement>()
  const [enviado, setEnviado] = useState(false)

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(120%_90%_at_16%_-10%,var(--color-navy-100)_0%,rgba(227,237,247,0.5)_35%,rgba(227,237,247,0.15)_60%,rgba(255,255,255,0)_82%)]" />
      <div className="animate-safe-drift-a pointer-events-none absolute -right-20 top-10 hidden h-[300px] w-[300px] rounded-full bg-emerald-brand/[0.06] blur-3xl sm:block" />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:px-8 lg:py-24">
        <div className={cn('max-w-2xl', inView ? 'animate-safe-fade-up' : 'opacity-0')}>
          <h1 className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl lg:text-[2.75rem]">
            Hablemos de las finanzas de tu empresa
          </h1>
          <p className="mt-4 text-base leading-relaxed text-ink-700">
            Cuéntanos qué necesitas y un especialista de SAFE se pondrá en contacto contigo para
            resolver tus dudas o agendar una demo.
          </p>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
          <div
            className={cn('flex h-full flex-col', inView ? 'animate-safe-fade-up' : 'opacity-0')}
            style={inView ? { animationDelay: '100ms' } : undefined}
          >
            {!enviado ? (
              <form
                className="flex h-full flex-col"
                onSubmit={(e) => {
                  e.preventDefault()
                  setEnviado(true)
                }}
              >
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contacto-nombres">Nombres</Label>
                    <Input id="contacto-nombres" placeholder="María" className="mt-1.5 h-11" required />
                  </div>
                  <div>
                    <Label htmlFor="contacto-apellidos">Apellidos</Label>
                    <Input
                      id="contacto-apellidos"
                      placeholder="Cedeño"
                      className="mt-1.5 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="contacto-empresa">Nombre de la empresa</Label>
                  <Input
                    id="contacto-empresa"
                    placeholder="Mi Empresa S.A."
                    className="mt-1.5 h-11"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="contacto-email">Correo electrónico</Label>
                  <Input
                    id="contacto-email"
                    type="email"
                    autoComplete="email"
                    placeholder="tu@empresa.ec"
                    className="mt-1.5 h-11"
                    required
                  />
                </div>

                <div>
                  <Label>¿Qué te interesa?</Label>
                  <div className="mt-2.5 grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
                    {INTERESES.map((interes) => (
                      <div key={interes} className="flex items-center gap-2">
                        <Checkbox id={`interes-${interes}`} />
                        <Label
                          htmlFor={`interes-${interes}`}
                          className="text-sm font-normal text-ink-700"
                        >
                          {interes}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="contacto-mensaje">Cuéntanos más (opcional)</Label>
                  <Textarea
                    id="contacto-mensaje"
                    placeholder="¿Cuántas personas trabajan en tu empresa? ¿Qué te gustaría resolver con SAFE?"
                    className="mt-1.5"
                    rows={4}
                  />
                </div>

                <div className="flex items-start gap-2.5">
                  <Checkbox id="contacto-acepto" required className="mt-0.5" />
                  <Label
                    htmlFor="contacto-acepto"
                    className="text-sm font-normal leading-relaxed text-ink-700"
                  >
                    He leído y acepto la{' '}
                    <button
                      type="button"
                      onClick={onIrPrivacidad}
                      className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
                    >
                      Política de Privacidad
                    </button>{' '}
                    y el tratamiento de mis datos personales.
                  </Label>
                </div>
                </div>

                <div className="mt-auto pt-8">
                  <Button type="submit" size="lg" className="w-full hover:scale-[1.01]">
                    Enviar mensaje
                  </Button>
                </div>
              </form>
            ) : (
              <div className="animate-safe-pop-in rounded-2xl border border-navy-100 bg-navy-100/30 p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-soft text-emerald-deep">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-navy-900">
                  ¡Mensaje enviado!
                </h2>
                <p className="mt-2 text-sm text-ink-700">
                  Gracias por escribirnos. Un especialista de SAFE se pondrá en contacto contigo muy
                  pronto.
                </p>
                <Button
                  variant="outline"
                  size="lg"
                  className="mt-6 hover:scale-[1.01]"
                  onClick={() => setEnviado(false)}
                >
                  Enviar otro mensaje
                </Button>
              </div>
            )}
          </div>

          <div
            className={cn(inView ? 'animate-safe-fade-up' : 'opacity-0')}
            style={inView ? { animationDelay: '180ms' } : undefined}
          >
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-line shadow-[var(--shadow-float)] sm:aspect-square">
              <iframe
                title="Ubicación de SAFE en la UEES, Samborondón"
                src={MAPS_EMBED_SRC}
                className="h-full w-full grayscale-[15%] contrast-[1.05]"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    Universidad Espíritu Santo (UEES)
                  </p>
                  <p className="text-sm text-ink-700">
                    Km. 2.5 vía Samborondón, Samborondón, Ecuador
                  </p>
                  <a
                    href={MAPS_DIRECTIONS_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-navy-500 transition-colors hover:text-navy-600 hover:underline"
                  >
                    Cómo llegar
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Correo</p>
                  <a
                    href="mailto:contacto@safe.ec"
                    className="text-sm text-ink-700 transition-colors hover:text-navy-600 hover:underline"
                  >
                    contacto@safe.ec
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-navy-500" />
                <div>
                  <p className="text-sm font-semibold text-navy-900">Teléfono</p>
                  <a
                    href="tel:+593960000000"
                    className="text-sm text-ink-700 transition-colors hover:text-navy-600 hover:underline"
                  >
                    +593 96 000 0000
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
