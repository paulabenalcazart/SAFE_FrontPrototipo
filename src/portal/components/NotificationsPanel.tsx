import type { Tono } from '@/portal/types'
import { TONE_DOT_CLASSES } from '@/portal/tone'

export type PanelItem = {
  id: string
  titulo: string
  mensaje: string
  fecha: string
  tono: Tono
}

export function NotificationsPanel({
  title,
  items,
  emptyMessage,
  onClose,
}: {
  title: string
  items: PanelItem[]
  emptyMessage: string
  onClose: () => void
}) {
  return (
    <div
      role="menu"
      className="animate-safe-fade-in absolute right-0 top-[calc(100%+8px)] z-30 w-[340px] max-w-[calc(100vw-28px)] rounded-xl border border-line bg-card shadow-[var(--shadow-float)]"
    >
      <div className="flex items-center justify-between gap-2.5 border-b border-line/70 px-3.5 py-3">
        <strong className="text-[13.5px]">{title}</strong>
        <button
          type="button"
          onClick={onClose}
          className="text-[12.5px] font-semibold text-navy-500 hover:text-navy-600"
        >
          Cerrar
        </button>
      </div>
      <div className="max-h-80 overflow-auto">
        {items.length === 0 && (
          <p className="px-3.5 py-5 text-center text-[13px] leading-relaxed text-ink-500">{emptyMessage}</p>
        )}
        {items.map((item) => (
          <div key={item.id} className="border-b border-line/70 px-3.5 py-2.5 last:border-b-0">
            <div className="flex items-center gap-2">
              <span className={`h-[7px] w-[7px] shrink-0 rounded-full ${TONE_DOT_CLASSES[item.tono]}`} aria-hidden="true" />
              <span className="text-[13px] font-semibold text-ink-900">{item.titulo}</span>
              <span className="ml-auto whitespace-nowrap text-[11px] text-ink-500">{item.fecha}</span>
            </div>
            <p className="mt-1 pl-[15px] text-[12.5px] leading-relaxed text-ink-700">{item.mensaje}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
