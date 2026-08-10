import { useEffect, useState } from 'react'

export type TemaPreferencia = 'claro' | 'oscuro'

const STORAGE_KEY = 'safe.portal.tema'

function leerTemaGuardado(): TemaPreferencia {
  const guardado = localStorage.getItem(STORAGE_KEY)
  return guardado === 'oscuro' ? 'oscuro' : 'claro'
}

function aplicarTema(tema: TemaPreferencia) {
  document.documentElement.classList.toggle('dark', tema === 'oscuro')
}

// Aplica el tema guardado apenas se carga el módulo (antes del primer render),
// para que no haya parpadeo al navegar directo a una ruta distinta de Configuración.
aplicarTema(leerTemaGuardado())

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
