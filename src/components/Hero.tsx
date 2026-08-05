import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { DashboardPreviewCard } from '@/components/DashboardPreviewCard'
import { useScrollProgress } from '@/hooks/useScrollProgress'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

const PREVIEW_NATURAL_W = 1040

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
  const { ref: trackRef, progress } = useScrollProgress<HTMLDivElement>()
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewNaturalH, setPreviewNaturalH] = useState(720)

  useEffect(() => {
    if (previewRef.current) {
      setPreviewNaturalH(previewRef.current.offsetHeight)
    }
  }, [])

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1024
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 768

  const availW = Math.min(viewportW - 64, 1360)
  const availH = viewportH * 0.82
  const finalScale = Math.min(availW / PREVIEW_NATURAL_W, availH / previewNaturalH)
  const boxWMax = PREVIEW_NATURAL_W * finalScale
  const boxHMax = previewNaturalH * finalScale

  const boxW = lerp(72, boxWMax, progress)
  const boxH = lerp(72, boxHMax, progress)
  const textOpacity = 1 - Math.min(Math.max(progress / 0.35, 0), 1)
  const contentOpacity = Math.min(Math.max((progress - 0.5) / 0.35, 0), 1)
  const shadowAlpha = (0.24 * contentOpacity).toFixed(3)

  const previewScale = Math.min(boxW / PREVIEW_NATURAL_W, boxH / previewNaturalH)
  const previewScaledW = PREVIEW_NATURAL_W * previewScale
  const previewScaledH = previewNaturalH * previewScale

  return (
    <div className="relative w-full bg-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-x-0 top-0 h-[820px] bg-[radial-gradient(120%_90%_at_50%_-8%,var(--color-navy-100)_0%,rgba(227,237,247,0.6)_32%,rgba(227,237,247,0.24)_58%,rgba(255,255,255,0)_82%)]" />

        <div
          className="absolute inset-0 opacity-[0.05] mix-blend-multiply"
          style={{ backgroundImage: NOISE_BG }}
        />

        <div
          className="absolute inset-x-0 top-0 h-[600px] opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(var(--color-navy-900) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
            maskImage: 'radial-gradient(58% 58% at 50% 18%, black 0%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(58% 58% at 50% 18%, black 0%, transparent 75%)',
          }}
        />

        <div className="animate-safe-drift-b absolute -left-16 top-10 hidden h-[300px] w-[300px] rounded-full bg-navy-500/[0.06] blur-3xl sm:block lg:-left-4 lg:top-4 lg:h-[380px] lg:w-[380px]" />
        <HeroShard
          points={LEFT_SHARD_POINTS}
          center={[190, 260]}
          viewBox="0 0 420 520"
          fills={LEFT_SHARD_FILLS}
          className="animate-safe-shard-b absolute -left-24 top-14 hidden h-[360px] w-[290px] sm:block lg:-left-14 lg:top-6 lg:h-[500px] lg:w-[400px]"
        />

        <div className="animate-safe-drift-a absolute -right-10 top-2 hidden h-[220px] w-[220px] rounded-full bg-amber-brand/[0.09] blur-3xl sm:block lg:right-0 lg:h-[280px] lg:w-[280px]" />
        <HeroShard
          points={RIGHT_SHARD_POINTS}
          center={[175, 175]}
          viewBox="0 0 360 360"
          fills={RIGHT_SHARD_FILLS}
          className="animate-safe-shard-a absolute -right-14 top-8 hidden h-[190px] w-[190px] sm:block lg:right-[1%] lg:top-2 lg:h-[280px] lg:w-[280px]"
        />

        <div className="animate-safe-drift-b absolute left-1/2 top-[340px] h-[320px] w-[720px] -translate-x-1/2 rounded-full bg-navy-500/[0.07] blur-[110px]" />
      </div>

      <div ref={trackRef} className="relative" style={{ height: '260vh' }}>
        <div className="sticky top-0 h-screen overflow-hidden">
          <div
            className="absolute left-1/2 overflow-hidden rounded-xl bg-surface"
            style={{
              top: '36%',
              width: `${boxW}px`,
              height: `${boxH}px`,
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 44px 90px -42px oklch(0.28 0.076 253.5 / ${shadowAlpha})`,
            }}
          >
            <div
              className="absolute"
              style={{
                width: `${PREVIEW_NATURAL_W}px`,
                left: `${(boxW - previewScaledW) / 2}px`,
                top: `${(boxH - previewScaledH) / 2}px`,
                transform: `scale(${previewScale})`,
                transformOrigin: 'top left',
                opacity: contentOpacity,
              }}
            >
              <div ref={previewRef} className="relative">
                <DashboardPreviewCard
                  inView={progress > 0.9}
                  className="!border-transparent !shadow-none"
                />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(70%_100%_at_10%_0%,var(--color-navy-100)_0%,rgba(255,255,255,0)_100%)] opacity-70 mix-blend-multiply" />
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[radial-gradient(60%_100%_at_92%_0%,var(--color-amber-soft)_0%,rgba(255,255,255,0)_100%)] opacity-60 mix-blend-multiply" />
              </div>
            </div>
          </div>

          <div
            className="absolute left-1/2 w-full max-w-5xl px-6 text-center"
            style={{ top: 'calc(36% + 80px)', transform: 'translateX(-50%)', opacity: textOpacity }}
          >
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
        </div>
      </div>
    </div>
  )
}
