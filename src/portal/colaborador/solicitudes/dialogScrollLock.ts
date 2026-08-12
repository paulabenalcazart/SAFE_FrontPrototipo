let capaId = 0
const pilaCapas: number[] = []

/**
 * Pila ordenada de capas de diálogo. Cada diálogo modal adquiere una capa al montarse
 * y la libera al desmontarse; `esTope()` responde si esa capa es la superior en ese
 * instante. Sirve para que un diálogo cubierto por otro ignore por completo sus
 * handlers de teclado (Escape y trampa de Tab) mientras esté debajo.
 *
 * Es un concepto distinto del bloqueo de scroll (que es un simple contador): aquí
 * importa el orden, no la cantidad.
 */
export function acquireDialogLayer(): { id: number; esTope: () => boolean; release: () => void } {
  const id = ++capaId
  pilaCapas.push(id)
  let liberado = false
  return {
    id,
    esTope: () => pilaCapas[pilaCapas.length - 1] === id,
    release: () => {
      if (liberado) return
      liberado = true
      const indice = pilaCapas.indexOf(id)
      if (indice !== -1) pilaCapas.splice(indice, 1)
    },
  }
}

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
