export function CompanyIdentity({
  nombre,
  iniciales,
  size = 'md',
}: {
  nombre: string
  iniciales?: string
  size?: 'sm' | 'md'
}) {
  const inicialesCalculadas =
    iniciales ??
    nombre
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
  const dimension = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-10 w-10 text-[13px]'

  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={`grid shrink-0 place-items-center rounded-lg bg-navy-100 font-bold text-navy-700 ${dimension}`}
      >
        {inicialesCalculadas}
      </span>
      <span className="min-w-0 truncate text-[13.5px] font-semibold text-ink-900">{nombre}</span>
    </span>
  )
}
