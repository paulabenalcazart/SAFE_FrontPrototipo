import { useEffect, useRef, useState } from 'react'

export function useReveal<T extends HTMLElement>(options?: IntersectionObserverInit) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    // Content must remain available even when the observer is unavailable.
    // Do not use the OS motion preference here: this landing has an explicit
    // animation design and must behave consistently across supported devices.
    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const revealFallback = window.setTimeout(() => setInView(true), 900)
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -15% 0px', ...options },
    )
    observer.observe(node)
    return () => {
      window.clearTimeout(revealFallback)
      observer.disconnect()
    }
  }, [])

  return { ref, inView }
}
