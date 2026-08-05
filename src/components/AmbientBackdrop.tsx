import { cn } from '@/lib/utils'

export function AmbientBackdrop({ className }: { className?: string }) {
  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden="true">
      <div className="animate-safe-drift-a absolute -left-24 top-0 h-72 w-72 rounded-full bg-navy-100/70 blur-3xl" />
      <div className="animate-safe-drift-b absolute -right-16 top-1/4 h-80 w-80 rounded-full bg-emerald-brand/[0.07] blur-[100px]" />
      <div className="animate-safe-drift-a absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-amber-brand/[0.08] blur-[100px]" />
      <div
        className="absolute inset-x-0 top-0 h-full opacity-[0.05]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(55% 55% at 50% 0%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(55% 55% at 50% 0%, black 0%, transparent 75%)',
        }}
      />
    </div>
  )
}
