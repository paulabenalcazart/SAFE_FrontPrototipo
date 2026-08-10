import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

export function useAccessibleDialog(abierto: boolean, onCerrar: () => void) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onCerrarRef = useRef(onCerrar)

  useEffect(() => {
    onCerrarRef.current = onCerrar
  }, [onCerrar])

  useEffect(() => {
    if (!abierto) return

    const focoAnterior =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const frame = window.requestAnimationFrame(() => titleRef.current?.focus())

    const manejarTeclado = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCerrarRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const dialog = dialogRef.current
      if (!dialog) return

      const focusables = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (elemento) =>
          !elemento.hasAttribute('disabled') && elemento.getAttribute('aria-hidden') !== 'true',
      )

      if (focusables.length === 0) {
        event.preventDefault()
        titleRef.current?.focus()
        return
      }

      const primero = focusables[0]
      const ultimo = focusables[focusables.length - 1]
      const activo = document.activeElement

      if (
        event.shiftKey &&
        (activo === primero || activo === titleRef.current || !dialog.contains(activo))
      ) {
        event.preventDefault()
        ultimo.focus()
      } else if (!event.shiftKey && (activo === ultimo || !dialog.contains(activo))) {
        event.preventDefault()
        primero.focus()
      }
    }

    document.addEventListener('keydown', manejarTeclado)

    return () => {
      window.cancelAnimationFrame(frame)
      document.removeEventListener('keydown', manejarTeclado)
      document.body.style.overflow = overflowAnterior
      if (focoAnterior?.isConnected) focoAnterior.focus()
    }
  }, [abierto])

  return { dialogRef, titleRef }
}
