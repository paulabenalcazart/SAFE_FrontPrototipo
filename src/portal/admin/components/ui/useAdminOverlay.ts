import { useEffect, useRef, type RefObject } from 'react'
import { acquireBodyScrollLock, acquireDialogLayer } from '@/portal/colaborador/solicitudes/dialogScrollLock'

const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useAdminOverlay(open: boolean, onClose: () => void): { dialogRef: RefObject<HTMLElement>; titleRef: RefObject<HTMLHeadingElement> } {
  const dialogRef = useRef<HTMLElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!open) return
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const releaseScrollLock = acquireBodyScrollLock()
    const layer = acquireDialogLayer()
    const frame = requestAnimationFrame(() => titleRef.current?.focus())
    const onKeyDown = (event: KeyboardEvent) => {
      if (!layer.esTope()) return
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const dialog = dialogRef.current
      if (!dialog) return
      const elements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter((element) => !element.hasAttribute('disabled'))
      if (!elements.length) {
        event.preventDefault()
        titleRef.current?.focus()
        return
      }
      const first = elements[0]
      const last = elements[elements.length - 1]
      const activeElement = document.activeElement
      const activeIndex = elements.indexOf(activeElement as HTMLElement)
      if (activeIndex === -1) {
        event.preventDefault()
        if (event.shiftKey) last.focus()
        else first.focus()
      } else if (event.shiftKey && activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('keydown', onKeyDown)
      layer.release()
      releaseScrollLock()
      const previous = previousFocusRef.current
      if (previous?.isConnected) previous.focus()
    }
  }, [open])

  return { dialogRef, titleRef }
}
