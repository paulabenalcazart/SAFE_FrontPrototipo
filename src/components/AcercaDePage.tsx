import { useState } from 'react'
import { Eye, FileText, Mountain, ShieldCheck, TrendingUp } from 'lucide-react'
import { WindowFrame } from '@/components/WindowFrame'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const heroBars = [28, 40, 36, 52, 60, 72, 86]
const heroLine = [82, 70, 74, 56, 62, 38, 20]

function heroPath(points: number[]) {
  const step = 280 / (points.length - 1)
  return points.map((y, i) => `${i === 0 ? 'M' : 'L'}${i * step},${y}`).join(' ')
}

function AboutHero() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(120%_90%_at_16%_-10%,var(--color-navy-100)_0%,rgba(227,237,247,0.55)_35%,rgba(227,237,247,0.2)_60%,rgba(255,255,255,0)_82%)]" />
      <div className="animate-safe-drift-a pointer-events-none absolute -right-20 top-6 hidden h-[320px] w-[320px] rounded-full bg-emerald-brand/[0.07] blur-3xl sm:block" />
      <div className="animate-safe-drift-b pointer-events-none absolute -left-16 bottom-0 hidden h-[260px] w-[260px] rounded-full bg-navy-500/[0.06] blur-3xl sm:block" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(55% 55% at 20% 10%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(55% 55% at 20% 10%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto grid max-w-6xl gap-14 px-6 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-28">
        <div>
          <h1
            className={cn(
              'font-display text-3xl font-semibold leading-[1.15] text-navy-900 sm:text-4xl lg:text-[2.75rem]',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
          >
            Impulsamos el crecimiento de las MIPYMES con inteligencia financiera
          </h1>
          <p
            className={cn(
              'mt-5 max-w-xl text-base leading-relaxed text-ink-700',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '100ms' } : undefined}
          >
            SAFE es la plataforma que centraliza, analiza y transforma la información financiera y
            tributaria de tu empresa en decisiones inteligentes para crecer con seguridad.
          </p>
        </div>

        <div
          className={cn('relative mx-auto w-full max-w-md', inView ? 'animate-safe-fade-up' : 'opacity-0')}
          style={inView ? { animationDelay: '200ms' } : undefined}
        >
          <WindowFrame title="Panorama financiero" className="relative z-10">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-ink-500">Ingresos — últimos 7 meses</p>
              <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-xs font-semibold text-emerald-deep">
                +22%
              </span>
            </div>

            <div className="relative mt-4 h-32">
              <div className="absolute inset-0 flex items-end gap-1.5">
                {heroBars.map((h, i) => (
                  <span
                    key={i}
                    className="flex-1 rounded-t bg-navy-100 transition-[height] duration-700 ease-out"
                    style={{ height: inView ? `${h}%` : '0%', transitionDelay: `${260 + i * 60}ms` }}
                  />
                ))}
              </div>
              <svg viewBox="0 0 280 100" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <path
                  d={heroPath(heroLine)}
                  fill="none"
                  stroke="var(--color-emerald-brand)"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  style={{
                    strokeDasharray: 1,
                    strokeDashoffset: inView ? 0 : 1,
                    transition: 'stroke-dashoffset 1100ms var(--ease-expo-out) 420ms',
                  }}
                />
              </svg>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full bg-navy-100 px-3 py-1 text-xs font-medium text-navy-700">
                Liquidez 92%
              </span>
              <span className="rounded-full bg-emerald-soft px-3 py-1 text-xs font-medium text-emerald-deep">
                Cumplimiento 96%
              </span>
            </div>
          </WindowFrame>

          <span
            className={cn(
              'animate-safe-drift-b absolute -left-6 -top-6 z-20 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-white text-navy-700 shadow-[var(--shadow-float)]',
              inView ? 'animate-safe-pop-in' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '480ms' } : undefined}
          >
            <ShieldCheck className="h-6 w-6" />
          </span>

          <span
            className={cn(
              'animate-safe-drift-a absolute -right-5 -top-4 z-20 grid h-12 w-12 place-items-center rounded-full border border-line bg-white text-emerald-deep shadow-[var(--shadow-float)]',
              inView ? 'animate-safe-pop-in' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '560ms' } : undefined}
          >
            <TrendingUp className="h-5 w-5" />
          </span>

          <span
            className={cn(
              'absolute -bottom-6 -right-6 z-20 hidden h-14 w-14 place-items-center rounded-2xl border border-line bg-white text-navy-700 shadow-[var(--shadow-float)] sm:grid',
              inView ? 'animate-safe-pop-in' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '640ms' } : undefined}
          >
            <FileText className="h-6 w-6" />
          </span>
        </div>
      </div>
    </section>
  )
}

const cartaTexto = [
  'Empezamos SAFE en 2026 a partir de algo que veíamos todos los días: las MIPYMES ecuatorianas manejaban sus finanzas en hojas de cálculo sueltas, sin tiempo ni recursos para interpretar lo que esos números significaban.',
  'Al principio pensamos que bastaba con ordenar la información. Pero mientras hablábamos con dueños de negocio, entendimos algo más importante: la mayoría no necesitaba más reportes, necesitaba entender qué hacer con ellos antes de que venciera la próxima obligación con el SRI.',
  'Por eso construimos SAFE como una sola plataforma: estados financieros, indicadores, calendario tributario y un simulador de escenarios, conectados entre sí. No para reemplazar a un contador, sino para que cada decisión llegue con contexto.',
  'Hoy seguimos cerca de cada MIPYME que confía en nosotros, con la misma convicción con la que empezamos: la claridad financiera no debería ser un privilegio de las grandes empresas.',
] as const

const founderStats = [
  { label: 'Año de fundación', valor: '2026' },
  { label: 'Personas en el equipo', valor: '4' },
  { label: 'Módulos integrados', valor: '6' },
  { label: 'Enfoque', valor: 'MIPYMES EC' },
] as const

function FounderLetterSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_16rem] lg:gap-16">
        <div>
          <h2
            className={cn(
              'font-display text-2xl font-semibold text-ink-900',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
          >
            Una carta de César Moreta
          </h2>
          <div
            className={cn(
              'mt-6 space-y-5 text-base leading-relaxed text-ink-700',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
            style={inView ? { animationDelay: '80ms' } : undefined}
          >
            {cartaTexto.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <div
            className={cn('mt-8', inView ? 'animate-safe-fade-up' : 'opacity-0')}
            style={inView ? { animationDelay: '200ms' } : undefined}
          >
            <svg viewBox="0 0 300 100" className="h-16 w-52 text-navy-900" aria-hidden="true">
              <path
                d="M70,25 C40,15 15,35 20,55 C25,75 55,78 68,60 L75,20 L82,55 L90,20 L98,55 C130,50 180,60 220,50 C250,45 270,40 285,32"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                style={{
                  strokeDasharray: 1,
                  strokeDashoffset: inView ? 0 : 1,
                  transition: 'stroke-dashoffset 1600ms var(--ease-expo-out) 500ms',
                }}
              />
            </svg>
            <p className="mt-2 text-sm font-semibold text-ink-900">César Moreta</p>
            <p className="text-xs text-ink-500">Cofundador, SAFE</p>
          </div>
        </div>

        <div
          className={cn('lg:border-l lg:border-line lg:pl-10', inView ? 'animate-safe-fade-up' : 'opacity-0')}
          style={inView ? { animationDelay: '120ms' } : undefined}
        >
          {founderStats.map((s, i) => (
            <div
              key={s.label}
              className={cn('flex items-baseline justify-between gap-4 py-4', i > 0 && 'border-t border-line')}
            >
              <span className="text-sm text-ink-500">{s.label}</span>
              <span className="num text-lg font-semibold text-ink-900">{s.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const pilares = [
  {
    icon: Mountain,
    titulo: 'Misión',
    texto: 'Facilitar a las MIPYMES el acceso a herramientas financieras y tributarias inteligentes que les permitan tomar mejores decisiones, cumplir sus obligaciones y crecer de manera sostenible.',
  },
  {
    icon: Eye,
    titulo: 'Visión',
    texto: 'Ser la plataforma líder en inteligencia financiera para MIPYMES en América Latina, impulsando empresas más saludables, productivas y competitivas.',
  },
] as const

function MissionVisionSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-16 sm:px-8">
      <div
        className={cn(
          'relative overflow-hidden rounded-[2rem] bg-navy-900',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '22px 22px' }}
        />
        <div className="animate-safe-drift-b pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-navy-100/20 blur-3xl" />
        <div className="animate-safe-drift-a pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-navy-500/25 blur-3xl" />

        <div className="relative grid gap-10 p-8 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-white/10 sm:p-12 lg:p-14">
          {pilares.map((p, i) => (
            <div key={p.titulo} className={i === 0 ? 'sm:pr-10' : 'sm:pl-10'}>
              <span
                className={cn(
                  'grid h-12 w-12 place-items-center rounded-2xl',
                  i === 0 ? 'bg-navy-500/40 text-white' : 'bg-navy-100/25 text-navy-100',
                  inView ? 'animate-safe-pop-in' : 'opacity-0',
                )}
                style={inView ? { animationDelay: `${160 + i * 100}ms` } : undefined}
              >
                <p.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold text-white">{p.titulo}</h2>
              <p className="mt-3 text-sm leading-relaxed text-navy-100">{p.texto}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const porQueParrafos = [
  'La información financiera y tributaria de una MIPYME rara vez vive en un solo lugar: aparece repartida entre hojas de cálculo, comprobantes del SRI y recordatorios sueltos. Eso era manejable cuando el negocio era pequeño — a medida que crece, se vuelve un riesgo.',
  'SAFE conecta esa información en un mismo lugar: estados financieros, indicadores, calendario tributario y un simulador de escenarios que se alimentan entre sí. Cada dato que cargas una vez se refleja automáticamente en el resto de la plataforma.',
  'Hoy acompañamos a MIPYMES ecuatorianas que buscan crecer con orden, sin necesitar un equipo financiero completo para tomar decisiones informadas.',
] as const

function WhyExistsSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <h2
        className={cn(
          'text-center font-display text-2xl font-medium italic leading-snug text-navy-900 sm:text-3xl lg:text-4xl',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        "Tener números no es lo mismo que entenderlos."
      </h2>

      <div className="mt-16 grid gap-8 lg:grid-cols-[14rem_1fr] lg:gap-12">
        <p
          className={cn(
            'font-display text-xl font-semibold text-ink-900',
            inView ? 'animate-safe-fade-up' : 'opacity-0',
          )}
          style={inView ? { animationDelay: '80ms' } : undefined}
        >
          Por qué existe SAFE
        </p>
        <div className="grid gap-8 sm:grid-cols-3">
          {porQueParrafos.map((p, i) => (
            <p
              key={i}
              className={cn('text-sm leading-relaxed text-ink-700', inView ? 'animate-safe-fade-up' : 'opacity-0')}
              style={inView ? { animationDelay: `${140 + i * 90}ms` } : undefined}
            >
              {p}
            </p>
          ))}
        </div>
      </div>
    </section>
  )
}

const equipo = [
  { nombre: 'Paula Benalcázar', base: 'paula', rol: 'Desarrolladora' },
  { nombre: 'Fabián Rodas', base: 'fabian', rol: 'Desarrollador' },
  { nombre: 'Dylan Drouet', base: 'dylan', rol: 'Desarrollador' },
  { nombre: 'César Moreta', base: 'cesar', rol: 'CEO de Producto' },
] as const

const PHOTO_EXTENSIONS = ['jpg', 'jpeg'] as const

const AVATAR_TONES = [
  'bg-navy-100 text-navy-700',
  'bg-emerald-soft text-emerald-deep',
  'bg-amber-soft text-amber-deep',
  'bg-navy-100 text-navy-700',
]

function initials(nombre: string) {
  return nombre
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function TeamPhoto({ nombre, base, tone }: { nombre: string; base: string; tone: string }) {
  const [extIndex, setExtIndex] = useState(0)
  const [broken, setBroken] = useState(false)

  function handleError() {
    if (extIndex < PHOTO_EXTENSIONS.length - 1) {
      setExtIndex((i) => i + 1)
    } else {
      setBroken(true)
    }
  }

  return (
    <div className={cn('relative aspect-[3/4] w-full overflow-hidden rounded-2xl', broken && tone)}>
      {!broken ? (
        <img
          key={extIndex}
          src={`/team/${base}.${PHOTO_EXTENSIONS[extIndex]}`}
          alt={nombre}
          className="h-full w-full object-cover"
          onError={handleError}
        />
      ) : (
        <div className="grid h-full w-full place-items-center text-3xl font-semibold">{initials(nombre)}</div>
      )}
    </div>
  )
}

function TeamSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-16 text-center sm:px-8">
      <h2
        className={cn(
          'font-display text-3xl font-semibold text-ink-900',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        Equipo fundador
      </h2>
      <div className="mt-10 grid grid-cols-4 gap-4 sm:gap-6">
        {equipo.map((persona, i) => (
          <div
            key={persona.nombre}
            className={cn('flex flex-col items-center gap-3', inView ? 'animate-safe-pop-in' : 'opacity-0')}
            style={inView ? { animationDelay: `${120 + i * 90}ms` } : undefined}
          >
            <TeamPhoto nombre={persona.nombre} base={persona.base} tone={AVATAR_TONES[i % AVATAR_TONES.length]} />
            <div>
              <p className="text-sm font-medium text-ink-900">{persona.nombre}</p>
              <p className="text-xs text-ink-500">{persona.rol}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function AcercaDePage() {
  return (
    <>
      <AboutHero />
      <div className="view-tint relative">
        <FounderLetterSection />
        <WhyExistsSection />
        <MissionVisionSection />
        <TeamSection />
      </div>
    </>
  )
}
