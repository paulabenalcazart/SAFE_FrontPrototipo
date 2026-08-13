import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface AdminTabItem<T extends string> { value: T; label: string; count?: number; disabled?: boolean }

export function AdminTabs<T extends string>({ items, value, onChange, ariaLabel, children }: { items: AdminTabItem<T>[]; value: T; onChange: (value: T) => void; ariaLabel: string; children?: ReactNode }) {
  const id = useId().replace(/:/g, '')
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([])
  const activeItem = items.find((item) => item.value === value)
  const select = (index: number) => {
    const item = items[index]
    if (!item || item.disabled) return
    onChange(item.value)
    buttonsRef.current[index]?.focus()
  }
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const enabled = items.map((item, itemIndex) => item.disabled ? -1 : itemIndex).filter((itemIndex) => itemIndex !== -1)
    const current = enabled.indexOf(index)
    if (current === -1) return
    let nextIndex: number | undefined
    if (event.key === 'ArrowLeft') nextIndex = enabled[(current - 1 + enabled.length) % enabled.length]
    if (event.key === 'ArrowRight') nextIndex = enabled[(current + 1) % enabled.length]
    if (event.key === 'Home') nextIndex = enabled[0]
    if (event.key === 'End') nextIndex = enabled[enabled.length - 1]
    if (nextIndex === undefined) return
    event.preventDefault()
    select(nextIndex)
  }
  const activePanelId = `${id}-panel-${activeItem?.value ?? value}`
  return <div className="admin-tabs-wrap"><div className="admin-tabs" role="tablist" aria-label={ariaLabel}>{items.map((item, index) => { const selected = value === item.value; const tabId = `${id}-tab-${item.value}`; return <button ref={(element) => { buttonsRef.current[index] = element }} key={item.value} id={tabId} type="button" role="tab" aria-selected={selected} aria-controls={`${id}-panel-${item.value}`} tabIndex={selected ? 0 : -1} disabled={item.disabled} className={cn('admin-tab', selected && 'is-active')} onClick={() => select(index)} onKeyDown={(event) => onKeyDown(event, index)}>{item.label}{typeof item.count === 'number' ? <span className="admin-tab__count">{item.count}</span> : null}</button>})}</div>{children !== undefined ? <div id={activePanelId} role="tabpanel" aria-labelledby={`${id}-tab-${activeItem?.value ?? value}`}>{children}</div> : null}</div>
}
