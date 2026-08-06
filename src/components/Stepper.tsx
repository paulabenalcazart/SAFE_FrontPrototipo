import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-start">
      {steps.map((step, i) => {
        const isDone = i < current
        const isCurrent = i === current

        return (
          <div key={step} className={cn('flex items-center', i < steps.length - 1 && 'flex-1')}>
            <div className="flex flex-col items-center gap-2 text-center">
              <span
                className={cn(
                  'grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all duration-300 ease-[var(--ease-expo-out)]',
                  isDone && 'bg-emerald-brand text-white',
                  isCurrent && 'scale-110 bg-navy-500 text-white shadow-[0_0_0_5px_var(--color-navy-100)]',
                  !isDone && !isCurrent && 'border border-line text-ink-400',
                )}
              >
                {isDone ? <Check key="check" className="animate-safe-pop-in h-4 w-4" /> : i + 1}
              </span>
              <span
                className={cn(
                  'max-w-[5.5rem] text-[11px] font-medium leading-tight transition-colors duration-300 sm:max-w-none sm:text-xs',
                  isCurrent ? 'text-ink-900' : isDone ? 'text-ink-700' : 'text-ink-400',
                )}
              >
                {step}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="mx-2 mt-[18px] h-[2px] flex-1 overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-emerald-brand transition-[width] duration-500 ease-[var(--ease-expo-out)]"
                  style={{ width: isDone ? '100%' : '0%' }}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
