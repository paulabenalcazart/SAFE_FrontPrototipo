const PROTOCOLOS_PERMITIDOS = new Set(['http:', 'https:', 'blob:'])

export function esUrlDocumentoPermitida(url?: string): boolean {
  if (!url?.trim()) return false

  try {
    return PROTOCOLOS_PERMITIDOS.has(new URL(url, 'https://safe.local').protocol)
  } catch {
    return false
  }
}
