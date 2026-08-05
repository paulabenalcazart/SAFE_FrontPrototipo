import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DashboardPreviewCard } from '@/components/DashboardPreviewCard'

const NOISE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>"
const NOISE_BG = `url("data:image/svg+xml,${encodeURIComponent(NOISE_SVG)}")`

type ShardPoint = [number, number]

function shardTriangles(points: ShardPoint[], center: ShardPoint) {
  return points.map((point, i) => {
    const next = points[(i + 1) % points.length]
    return `${center[0]},${center[1]} ${point[0]},${point[1]} ${next[0]},${next[1]}`
  })
}

function HeroShard({
  points,
  center,
  viewBox,
  fills,
  className,
}: {
  points: ShardPoint[]
  center: ShardPoint
  viewBox: string
  fills: string[]
  className: string
}) {
  return (
    <svg viewBox={viewBox} className={className} aria-hidden="true">
      {shardTriangles(points, center).map((triangle, i) => (
        <polygon
          key={i}
          points={triangle}
          className={fills[i % fills.length]}
          stroke="white"
          strokeOpacity={0.35}
          strokeWidth={1}
        />
      ))}
    </svg>
  )
}

const LEFT_SHARD_POINTS: ShardPoint[] = [
  [150, 0],
  [260, 30],
  [340, 110],
  [400, 230],
  [380, 340],
  [300, 440],
  [190, 520],
  [70, 480],
  [0, 360],
  [20, 200],
  [70, 90],
]

const RIGHT_SHARD_POINTS: ShardPoint[] = [
  [180, 0],
  [300, 60],
  [360, 170],
  [300, 300],
  [160, 360],
  [40, 300],
  [0, 160],
  [70, 50],
]

const LEFT_SHARD_FILLS = [
  'fill-navy-700/20',
  'fill-navy-500/18',
  'fill-navy-100/80',
  'fill-emerald-brand/18',
  'fill-navy-900/16',
  'fill-emerald-soft/75',
]

const RIGHT_SHARD_FILLS = [
  'fill-amber-brand/26',
  'fill-navy-500/16',
  'fill-emerald-brand/20',
  'fill-amber-soft/70',
]

export function Hero({ onVerPlanes }: { onVerPlanes?: () => void }) {
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), 500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[820px] bg-[radial-gradient(120%_90%_at_50%_-8%,var(--color-navy-100)_0%,rgba(227,237,247,0.6)_32%,rgba(227,237,247,0.24)_58%,rgba(255,255,255,0)_82%)]" />

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-multiply"
        style={{ backgroundImage: NOISE_BG }}
      />

      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[600px] opacity-[0.06]"
        style={{
          backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(58% 58% at 50% 18%, black 0%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(58% 58% at 50% 18%, black 0%, transparent 75%)',
        }}
      />

      <div className="animate-safe-drift-b pointer-events-none absolute -left-16 top-10 hidden h-[300px] w-[300px] rounded-full bg-navy-500/[0.06] blur-3xl sm:block lg:-left-4 lg:top-4 lg:h-[380px] lg:w-[380px]" />
      <HeroShard
        points={LEFT_SHARD_POINTS}
        center={[190, 260]}
        viewBox="0 0 420 520"
        fills={LEFT_SHARD_FILLS}
        className="animate-safe-shard-b pointer-events-none absolute -left-24 top-14 hidden h-[360px] w-[290px] sm:block lg:-left-14 lg:top-6 lg:h-[500px] lg:w-[400px]"
      />

      <div className="animate-safe-drift-a pointer-events-none absolute -right-10 top-2 hidden h-[220px] w-[220px] rounded-full bg-amber-brand/[0.09] blur-3xl sm:block lg:right-0 lg:h-[280px] lg:w-[280px]" />
      <HeroShard
        points={RIGHT_SHARD_POINTS}
        center={[175, 175]}
        viewBox="0 0 360 360"
        fills={RIGHT_SHARD_FILLS}
        className="animate-safe-shard-a pointer-events-none absolute -right-14 top-8 hidden h-[190px] w-[190px] sm:block lg:right-[1%] lg:top-2 lg:h-[280px] lg:w-[280px]"
      />

      <div className="animate-safe-drift-b pointer-events-none absolute left-1/2 top-[340px] h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-navy-500/[0.07] blur-[110px]" />

      <div className="relative mx-auto max-w-5xl px-6 pb-8 pt-10 text-center sm:px-8 lg:pb-10 lg:pt-14">
        <h1 className="animate-safe-fade-up text-3xl font-extrabold leading-[1.14] tracking-tight text-navy-900 sm:text-4xl lg:text-5xl">
          Gestiona las finanzas, impuestos y legal
          <br className="hidden sm:block" /> de tu MIPYMES en un solo lugar
        </h1>
        <p
          className="animate-safe-fade-up mx-auto mt-4 max-w-xl text-base leading-normal text-ink-700"
          style={{ animationDelay: '120ms' }}
        >
          SAFE reúne tu contabilidad, tus obligaciones con el SRI y tus trámites legales en una
          sola plataforma — pensada para MIPYMES ecuatorianas, no para corporaciones.
        </p>
        <div
          className="animate-safe-fade-up mt-6 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: '240ms' }}
        >
          <Button size="lg" className="hover:scale-[1.02]">
            Crear cuenta gratis
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-navy-500 text-navy-500 hover:scale-[1.02] hover:bg-navy-100 hover:text-navy-600"
            onClick={onVerPlanes}
          >
            Ver planes
          </Button>
        </div>
      </div>

      <div
        className="animate-safe-fade-up relative mx-auto max-w-5xl px-6 pb-10 sm:px-8 sm:pb-12 lg:pb-16"
        style={{ animationDelay: '360ms' }}
      >
        <div
          className="relative overflow-hidden rounded-xl bg-white"
          style={{
            boxShadow: '0 44px 90px -42px oklch(0.28 0.076 253.5 / 0.24)',
          }}
        >
          <div className="max-h-[380px] overflow-hidden sm:max-h-[420px] lg:max-h-[460px]">
            <DashboardPreviewCard inView={started} className="!border-transparent !shadow-none" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_10%_0%,var(--color-navy-100)_0%,rgba(255,255,255,0)_100%)] opacity-70 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(60%_100%_at_92%_0%,var(--color-amber-soft)_0%,rgba(255,255,255,0)_100%)] opacity-60 mix-blend-multiply" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-white/0 to-white sm:h-40" />
        </div>
      </div>
    </div>
  )
}
