import { useEffect, useState } from 'react'

export type TemaPreferencia = 'claro' | 'oscuro'

const STORAGE_KEY = 'safe.portal.tema'

// El tema oscuro solo debe afectar al portal privado (/app), nunca al sitio publico:
// la clase "dark" se aplica sobre este contenedor, no sobre <html>, para que el resto
// del CSS del portal (ink-*/line/surface) invierta pero el marketing site no.
export const PORTAL_SHELL_ID = 'portal-shell'

function leerTemaGuardado(): TemaPreferencia {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return guardado === 'oscuro' ? 'oscuro' : 'claro'
}

function aplicarTema(tema: TemaPreferencia) {
  document.getElementById(PORTAL_SHELL_ID)?.classList.toggle('dark', tema === 'oscuro')
}

export function useTemaPreferencia() {
  const [tema, setTemaState] = useState<TemaPreferencia>(() => leerTemaGuardado())

  useEffect(() => {
    aplicarTema(tema)
  }, [tema])

  const setTema = (siguiente: TemaPreferencia) => {
    setTemaState(siguiente)
    localStorage.setItem(STORAGE_KEY, siguiente)
  }

  return [tema, setTema] as const
}
