import { useEffect, useRef, useState } from 'react'

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)
  const ticking = useRef(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }

    function measure() {
      const rect = node!.getBoundingClientRect()
      const total = rect.height - window.innerHeight
      const scrolled = -rect.top
      setProgress(total > 0 ? Math.min(Math.max(scrolled / total, 0), 1) : 0)
      ticking.current = false
    }

    function onScroll() {
      if (ticking.current) return
      ticking.current = true
      requestAnimationFrame(measure)
    }

    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return { ref, progress }
}
