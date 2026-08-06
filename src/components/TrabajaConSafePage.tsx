import { useEffect, useState } from 'react'
import {
  BadgeCheck,
  Calculator,
  CheckCircle2,
  Scale,
  Star,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WindowFrame } from '@/components/WindowFrame'
import { useReveal } from '@/hooks/useReveal'
import { cn } from '@/lib/utils'

const rotatingPhrases = [
  { texto: 'asesoría legal', decoracion: 'decoration-navy-500' },
  { texto: 'asesoría contable', decoracion: 'decoration-emerald-brand' },
  { texto: 'asesoría financiera', decoracion: 'decoration-amber-brand' },
] as const

function RotatingWords() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % rotatingPhrases.length)
    }, 2400)
    return () => window.clearInterval(id)
  }, [])

  const current = rotatingPhrases[index]

  return (
    <span
      key={index}
      className={cn(
        'animate-safe-fade-up inline-block underline decoration-2 underline-offset-4',
        current.decoracion,
      )}
    >
      {current.texto}
    </span>
  )
}

const marqueeTiles = [
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=7', h: 'h-40' },
  { kind: 'icon', icon: Scale },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=11', h: 'h-56' },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=13', h: 'h-44' },
  { kind: 'icon', icon: Calculator },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=26', h: 'h-52' },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=32', h: 'h-40' },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=44', h: 'h-56' },
  { kind: 'icon', icon: TrendingUp },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=52', h: 'h-44' },
  { kind: 'photo', src: 'https://i.pravatar.cc/400?img=60', h: 'h-52' },
] as const

function ProfessionalsMarquee() {
  return (
    <div className="relative mt-14 overflow-hidden pb-20 lg:pb-28">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-white to-transparent sm:w-40" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-white to-transparent sm:w-40" />
      <div className="animate-safe-marquee flex w-max items-end gap-5 hover:[animation-play-state:paused]">
        {[...marqueeTiles, ...marqueeTiles].map((t, i) =>
          t.kind === 'icon' ? (
            <div key={i} aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center self-center text-ink-500">
              <t.icon className="h-6 w-6" />
            </div>
          ) : (
            <div
              key={i}
              aria-hidden={i >= marqueeTiles.length}
              className={cn('w-32 shrink-0 overflow-hidden rounded-2xl shadow-[var(--shadow-card)] sm:w-36', t.h)}
            >
              <img src={t.src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            'h-3.5 w-3.5',
            i < Math.round(rating) ? 'fill-amber-brand text-amber-brand' : 'fill-line text-line',
          )}
        />
      ))}
    </div>
  )
}

function TrabajaHero({ onPostular }: { onPostular?: () => void }) {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(90%_70%_at_50%_-10%,var(--color-navy-100)_0%,rgba(227,237,247,0.5)_35%,rgba(227,237,247,0)_75%)]" />
      <div className="animate-safe-drift-a pointer-events-none absolute -left-20 top-10 hidden h-[300px] w-[300px] rounded-full bg-navy-500/[0.06] blur-3xl sm:block" />
      <div className="animate-safe-drift-b pointer-events-none absolute -right-16 top-6 hidden h-[260px] w-[260px] rounded-full bg-amber-brand/[0.08] blur-3xl sm:block" />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(55% 55% at 50% 10%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(55% 55% at 50% 10%, black 0%, transparent 75%)',
        }}
      />

      <div className="relative mx-auto max-w-4xl px-6 pt-16 text-center sm:px-8 lg:pt-20">
        <h1
          className={cn(
            'font-display text-4xl font-semibold leading-[1.1] text-navy-900 sm:text-5xl lg:text-6xl',
            inView ? 'animate-safe-fade-up' : 'opacity-0',
          )}
        >
          Conecta con MIPYMES que necesitan tu
          <br />
          <RotatingWords />
        </h1>
        <p
          className={cn(
            'mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-700',
            inView ? 'animate-safe-fade-up' : 'opacity-0',
          )}
          style={inView ? { animationDelay: '100ms' } : undefined}
        >
          SAFE te conecta directo con esas empresas — sin licitaciones, sin cartera fría y con
          solicitudes que ya llegan calificadas para tu especialidad.
        </p>
        <div
          className={cn('mx-auto mt-6 max-w-xs', inView ? 'animate-safe-fade-up' : 'opacity-0')}
          style={inView ? { animationDelay: '200ms' } : undefined}
        >
          <Button size="lg" className="w-full hover:scale-[1.01]" onClick={onPostular}>
            Postularme ahora
          </Button>
        </div>
      </div>

      <ProfessionalsMarquee />
    </section>
  )
}

const roles = [
  {
    base: 'abogados',
    icon: Scale,
    titulo: 'Abogados',
    texto:
      'Constitución de sociedades, contratos y cumplimiento legal para MIPYMES en crecimiento. Acompañas cada decisión que involucra un riesgo legal, desde el primer contrato hasta la expansión.',
    tono: 'bg-navy-100 text-navy-700',
    panel: 'bg-[linear-gradient(160deg,var(--safe-primary-100)_0%,var(--safe-primary-100)_55%,white_120%)]',
  },
  {
    base: 'contadores',
    icon: Calculator,
    titulo: 'Contadores',
    texto:
      'Estados financieros, declaraciones al SRI y cierre contable mensual. Mantienes al día la salud fiscal de negocios que no pueden darse el lujo de un error o un atraso.',
    tono: 'bg-emerald-soft text-emerald-deep',
    panel: 'bg-[linear-gradient(160deg,var(--safe-emerald-100)_0%,var(--safe-emerald-100)_55%,white_120%)]',
  },
  {
    base: 'asesores',
    icon: TrendingUp,
    titulo: 'Asesores financieros',
    texto:
      'Planeación financiera, indicadores de gestión y estrategia de crecimiento. Ayudas a convertir números sueltos en decisiones que hacen crecer el negocio con orden.',
    tono: 'bg-amber-soft text-amber-deep',
    panel: 'bg-[linear-gradient(160deg,var(--safe-amber-100)_0%,var(--safe-amber-100)_55%,white_120%)]',
  },
] as const

const ROLE_PHOTO_EXTENSIONS = ['jpg', 'jpeg'] as const

function RolePanel({ role }: { role: (typeof roles)[number] }) {
  const [extIndex, setExtIndex] = useState(0)
  const [broken, setBroken] = useState(false)

  function handleError() {
    if (extIndex < ROLE_PHOTO_EXTENSIONS.length - 1) {
      setExtIndex((i) => i + 1)
    } else {
      setBroken(true)
    }
  }

  return (
    <div
      className={cn(
        'relative h-full min-h-[22rem] overflow-hidden rounded-[var(--radius-xl)] border border-line shadow-[var(--shadow-card)] lg:h-[26rem]',
        broken && role.panel,
      )}
    >
      {!broken ? (
        <img
          key={extIndex}
          src={`/roles/${role.base}.${ROLE_PHOTO_EXTENSIONS[extIndex]}`}
          alt={role.titulo}
          onError={handleError}
          className="h-full w-full object-cover object-top"
        />
      ) : (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="animate-safe-drift-a pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/40 blur-3xl" />
          <div className="animate-safe-drift-b pointer-events-none absolute -bottom-12 -left-10 h-56 w-56 rounded-full bg-white/30 blur-3xl" />

          <div className="relative flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
            <span
              className={cn(
                'animate-safe-pop-in grid h-20 w-20 place-items-center rounded-3xl bg-white shadow-[var(--shadow-float)]',
                role.tono.split(' ')[1],
              )}
            >
              <role.icon className="h-9 w-9" />
            </span>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-ink-700">{role.titulo}</p>
          </div>
        </>
      )}
    </div>
  )
}

function RolesSection() {
  const { ref, inView } = useReveal<HTMLElement>()
  const [active, setActive] = useState(0)

  useEffect(() => {
    if (!inView) return
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % roles.length)
    }, 4200)
    return () => window.clearInterval(id)
  }, [inView, active])

  const role = roles[active]

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <h2
        className={cn(
          'font-display text-3xl font-semibold text-ink-900',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
      >
        ¿Quién puede postularse?
      </h2>
      <p
        className={cn('mt-2 max-w-xl text-sm text-ink-700', inView ? 'animate-safe-fade-up' : 'opacity-0')}
        style={inView ? { animationDelay: '80ms' } : undefined}
      >
        Profesionales independientes o firmas pequeñas que ya asesoran a MIPYMES ecuatorianas.
      </p>

      <div
        className={cn(
          'mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8',
          inView ? 'animate-safe-fade-up' : 'opacity-0',
        )}
        style={inView ? { animationDelay: '140ms' } : undefined}
      >
        <div className="surface-card flex h-full min-h-[22rem] flex-col justify-center p-8 sm:p-10 lg:h-[26rem]">
          <div className="flex gap-2" role="tablist" aria-label="Categorías de profesionales">
            {roles.map((r, i) => (
              <button
                key={r.titulo}
                type="button"
                role="tab"
                aria-selected={i === active}
                aria-label={r.titulo}
                onClick={() => setActive(i)}
                className={cn(
                  'grid h-11 w-11 place-items-center rounded-xl border transition-all duration-200 ease-[var(--ease-expo-out)]',
                  i === active
                    ? cn(r.tono, 'border-transparent')
                    : 'border-line text-ink-400 hover:border-navy-300 hover:text-ink-700',
                )}
              >
                <r.icon className="h-5 w-5" />
              </button>
            ))}
          </div>

          <h3
            key={role.titulo}
            className="animate-safe-fade-up mt-6 font-display text-2xl font-semibold text-ink-900 sm:text-3xl"
          >
            {role.titulo}
          </h3>
          <p
            key={`desc-${role.titulo}`}
            className="animate-safe-fade-up mt-3 max-w-md text-sm leading-relaxed text-ink-700 sm:text-base"
          >
            {role.texto}
          </p>
        </div>

        <div key={`panel-${role.titulo}`} className="animate-safe-fade-in">
          <RolePanel role={role} />
        </div>
      </div>
    </section>
  )
}

const beneficios = [
  'Recibe solicitudes calificadas de MIPYMES reales, no leads fríos.',
  'Tú defines tus tarifas y tu disponibilidad.',
  'Perfil verificado que genera confianza desde el primer contacto.',
  'Sin comisiones ocultas ni intermediarios en la negociación.',
  'Historial y reseñas que construyen tu reputación.',
  'Acceso a herramientas de SAFE para dar seguimiento a tus clientes.',
] as const

const perfiles = [
  {
    iniciales: 'MG',
    nombre: 'María Gómez',
    rol: 'Contadora · CPA',
    rating: 4.9,
    resenas: 32,
    empresas: 18,
    ciudad: 'Quito',
    tono: 'bg-navy-100 text-navy-700',
  },
  {
    iniciales: 'AV',
    nombre: 'Andrés Villacís',
    rol: 'Abogado societario',
    rating: 5.0,
    resenas: 27,
    empresas: 24,
    ciudad: 'Guayaquil',
    tono: 'bg-emerald-soft text-emerald-deep',
  },
  {
    iniciales: 'LF',
    nombre: 'Lucía Fernández',
    rol: 'Asesora financiera',
    rating: 4.8,
    resenas: 19,
    empresas: 15,
    ciudad: 'Cuenca',
    tono: 'bg-amber-soft text-amber-deep',
  },
] as const

function MarketplaceCarousel() {
  const [active, setActive] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((i) => (i + 1) % perfiles.length)
    }, 3800)
    return () => window.clearInterval(id)
  }, [])

  const p = perfiles[active]

  return (
    <WindowFrame title="Perfil profesional" className="relative">
      <div key={active} className="animate-safe-fade-in flex items-center gap-3">
        <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold', p.tono)}>
          {p.iniciales}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink-900">{p.nombre}</p>
          <p className="truncate text-xs text-ink-500">{p.rol}</p>
        </div>
        <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-soft px-2.5 py-1 text-[11px] font-semibold text-emerald-deep">
          <BadgeCheck className="h-3 w-3" />
          Verificado
        </span>
      </div>

      <div key={`stats-${active}`} className="animate-safe-fade-in mt-4 flex items-center gap-2">
        <Stars rating={p.rating} />
        <span className="num text-xs font-semibold text-ink-900">{p.rating.toFixed(1)}</span>
        <span className="text-xs text-ink-500">({p.resenas} reseñas)</span>
      </div>

      <div key={`grid-${active}`} className="animate-safe-fade-in mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-surface p-3">
          <p className="num text-xl font-bold text-ink-900">{p.empresas}</p>
          <p className="text-[11px] text-ink-500">Empresas atendidas</p>
        </div>
        <div className="rounded-xl bg-surface p-3">
          <p className="text-xl font-bold text-ink-900">{p.ciudad}</p>
          <p className="text-[11px] text-ink-500">Atiende remoto</p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1.5">
        {perfiles.map((item, i) => (
          <button
            key={item.nombre}
            type="button"
            aria-label={`Ver perfil de ${item.nombre}`}
            onClick={() => setActive(i)}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 ease-[var(--ease-expo-out)]',
              i === active ? 'w-6 bg-navy-500' : 'w-1.5 bg-line hover:bg-navy-300',
            )}
          />
        ))}
      </div>
    </WindowFrame>
  )
}

function BenefitsSection() {
  const { ref, inView } = useReveal<HTMLElement>()

  return (
    <section ref={ref} className="mx-auto max-w-6xl px-6 py-20 sm:px-8">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
        <div>
          <h2
            className={cn(
              'font-display text-3xl font-semibold text-ink-900',
              inView ? 'animate-safe-fade-up' : 'opacity-0',
            )}
          >
            Beneficios de trabajar con SAFE
          </h2>
          <ul className="mt-6 space-y-3">
            {beneficios.map((b, i) => (
              <li
                key={b}
                className={cn(
                  'flex items-start gap-2.5 text-sm leading-relaxed text-ink-700',
                  inView ? 'animate-safe-fade-up' : 'opacity-0',
                )}
                style={inView ? { animationDelay: `${100 + i * 70}ms` } : undefined}
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-brand" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={cn('relative mx-auto w-full max-w-md', inView ? 'animate-safe-fade-up' : 'opacity-0')}
          style={inView ? { animationDelay: '160ms' } : undefined}
        >
          <MarketplaceCarousel />
        </div>
      </div>
    </section>
  )
}

export function TrabajaConSafePage({ onPostular }: { onPostular?: () => void }) {
  return (
    <>
      <TrabajaHero onPostular={onPostular} />
      <div className="view-tint relative">
        <RolesSection />
        <BenefitsSection />
      </div>
    </>
  )
}
