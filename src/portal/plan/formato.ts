export function formatExpiracion(mes: number, anio: number): string {
  return `${String(mes).padStart(2, '0')}/${anio}`
}

export function formatUltimosCuatro(marca: string, ultimosCuatro: string): string {
  return `${marca} ···· ${ultimosCuatro}`
}
