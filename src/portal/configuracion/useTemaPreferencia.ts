import { useState } from 'react'

export type TemaPreferencia = 'claro' | 'oscuro'

const STORAGE_KEY = 'safe.portal.tema'

function leerTemaGuardado(): TemaPreferencia {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return guardado === 'oscuro' ? 'oscuro' : 'claro'
}

export function useTemaPreferencia() {
  const [tema, setTemaState] = useState<TemaPreferencia>(() => leerTemaGuardado())

  const setTema = (siguiente: TemaPreferencia) => {
    setTemaState(siguiente)
    localStorage.setItem(STORAGE_KEY, siguiente)
  }

  return [tema, setTema] as const
}
