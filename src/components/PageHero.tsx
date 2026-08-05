export function PageHero({
  eyebrow,
  titulo,
  texto,
}: {
  eyebrow: string
  titulo: string
  texto: string
}) {
  return (
    <section className="relative overflow-hidden bg-navy-900 px-6 py-16 sm:px-8 lg:py-20">
      <img
        src="https://images.unsplash.com/photo-1556740758-90de374c12ad?w=1600&q=60&auto=format&fit=crop"
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-[2px]"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,var(--color-navy-900)_18%,rgba(11,29,58,0.75)_55%,rgba(11,29,58,0.55)_100%)]" />

      <div className="relative mx-auto max-w-4xl">
        <span className="animate-safe-fade-up inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-navy-100">
          {eyebrow}
        </span>
        <h1
          className="animate-safe-fade-up mt-4 max-w-2xl font-display text-3xl font-semibold leading-tight text-white sm:text-4xl lg:text-[2.75rem]"
          style={{ animationDelay: '80ms' }}
        >
          {titulo}
        </h1>
        <p
          className="animate-safe-fade-up mt-4 max-w-2xl text-base leading-relaxed text-navy-100"
          style={{ animationDelay: '160ms' }}
        >
          {texto}
        </p>
      </div>
    </section>
  )
}
