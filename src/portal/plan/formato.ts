export function formatExpiracion(mes: number, anio: number): string {
  return `${String(mes).padStart(2, '0')}/${anio}`
}

export function formatExpiracionCorta(mes: number, anio: number): string {
  return `${String(mes).padStart(2, '0')}/${String(anio).slice(-2)}`
}

export function formatUltimosCuatro(marca: string, ultimosCuatro: string): string {
  return `${marca} ···· ${ultimosCuatro}`
}
