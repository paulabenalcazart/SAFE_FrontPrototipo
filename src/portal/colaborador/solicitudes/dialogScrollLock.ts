let lockCount = 0

export function acquireBodyScrollLock(): () => void {
  if (lockCount === 0) {
    document.body.style.overflow = 'hidden'
  }
  lockCount += 1
  let liberado = false
  return () => {
    if (liberado) return
    liberado = true
    lockCount -= 1
    if (lockCount === 0) {
      document.body.style.overflow = ''
    }
  }
}
