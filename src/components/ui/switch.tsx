import { cn } from '@/lib/utils'

export function Switch({
  checked,
  onCheckedChange,
  label,
  disabled,
  className,
}: {
  checked: boolean
  onCheckedChange: () => void
  label?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onCheckedChange}
      className={cn(
        'relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-emerald-brand' : 'bg-line',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'absolute left-0.5 top-0.5 h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform duration-150',
          checked ? 'translate-x-5' : 'translate-x-0',
        )}
      />
    </button>
  )
}
