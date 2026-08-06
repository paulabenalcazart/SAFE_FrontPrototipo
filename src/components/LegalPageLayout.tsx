import type { ReactNode } from 'react'

export function LegalPageLayout({
  titulo,
  actualizado,
  intro,
  children,
}: {
  titulo: string
  actualizado: string
  intro: string
  children: ReactNode
}) {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(120%_90%_at_16%_-10%,var(--color-navy-100)_0%,rgba(227,237,247,0.5)_35%,rgba(227,237,247,0.15)_60%,rgba(255,255,255,0)_82%)]" />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:py-20">
        <h1 className="font-display text-3xl font-semibold leading-tight text-navy-900 sm:text-4xl">
          {titulo}
        </h1>
        <p className="mt-3 text-sm text-ink-500">Última actualización: {actualizado}</p>
        <p className="mt-6 text-base leading-relaxed text-ink-700">{intro}</p>

        <div className="mt-10 space-y-10 border-t border-line pt-10">{children}</div>
      </div>
    </section>
  )
}

export function LegalSection({
  id,
  titulo,
  children,
}: {
  id?: string
  titulo: string
  children: ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-xl font-bold text-navy-900">{titulo}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-ink-700">{children}</div>
    </section>
  )
}
