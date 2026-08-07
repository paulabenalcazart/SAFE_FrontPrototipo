import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronDown, Plus } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'

export function CompanySwitcher() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { empresas, empresaActiva, setEmpresaActiva } = usePortalData()

  return (
    <div className="relative min-w-0 flex-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex min-h-11 max-w-[260px] items-center gap-2.5 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-left"
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-navy-100 text-[11px] font-bold text-navy-700">
          {empresaActiva.iniciales}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-semibold text-ink-900">{empresaActiva.nombre}</span>
          <span className="block truncate text-[11px] text-ink-500">RUC {empresaActiva.ruc}</span>
        </span>
        <ChevronDown className="ml-auto h-[15px] w-[15px] shrink-0 text-ink-500" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="animate-safe-fade-in absolute left-0 top-[calc(100%+8px)] z-30 w-[296px] rounded-xl border border-line bg-card p-1.5 shadow-[var(--shadow-float)]"
        >
          <div className="px-2.5 pb-1.5 pt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
            Tus empresas
          </div>
          {empresas.map((empresa) => (
            <button
              key={empresa.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setEmpresaActiva(empresa.id)
                setOpen(false)
              }}
              className="flex min-h-11 w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-surface"
            >
              <span className="grid h-6.5 w-6.5 shrink-0 place-items-center rounded-md bg-navy-100 text-[10.5px] font-bold text-navy-700">
                {empresa.iniciales}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink-900">{empresa.nombre}</span>
                <span className="block text-[11.5px] text-ink-500">RUC {empresa.ruc}</span>
              </span>
              {empresa.id === empresaActiva.id && (
                <Check className="h-[17px] w-[17px] text-emerald-deep" aria-hidden="true" />
              )}
            </button>
          ))}
          <div className="mt-1 border-t border-line/70 pt-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                navigate('/app/empresa/registrar')
              }}
              className="flex min-h-11 w-full items-center gap-2 rounded-lg px-2.5 text-[13.5px] font-semibold text-navy-600 hover:bg-surface"
            >
              <Plus className="h-[17px] w-[17px]" aria-hidden="true" />
              Registrar otra empresa
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
