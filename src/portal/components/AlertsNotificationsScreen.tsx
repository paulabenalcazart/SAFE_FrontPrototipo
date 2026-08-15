import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import type { PanelItem } from './NotificationsPanel'
import { TONE_DOT_CLASSES } from '@/portal/tone'

export function AlertsNotificationsScreen({
  titulo,
  descripcion,
  items,
  emptyMessage,
}: {
  titulo: string
  descripcion: string
  items: PanelItem[]
  emptyMessage: string
}) {
  const navigate = useNavigate()

  return (
    <section className="flex flex-col gap-4.5">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Volver
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">{titulo}</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">{descripcion}</p>
      </div>

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line py-10 text-center text-[13.5px] text-ink-500">
          {emptyMessage}
        </p>
      ) : (
        <section className="overflow-hidden rounded-xl border border-line bg-card">
          {items.map((item) => (
            <div key={item.id} className="border-b border-line/70 px-4.5 py-3.5 last:border-b-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT_CLASSES[item.tono]}`} aria-hidden="true" />
                <span className="text-[14px] font-semibold text-ink-900">{item.titulo}</span>
                <span className="ml-auto whitespace-nowrap text-[12px] text-ink-500">{item.fecha}</span>
              </div>
              <p className="mt-1.5 pl-4 text-[13px] leading-relaxed text-ink-700">{item.mensaje}</p>
            </div>
          ))}
        </section>
      )}
    </section>
  )
}
