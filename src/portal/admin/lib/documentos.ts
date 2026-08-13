const protocolosPermitidos = new Set(['http:', 'https:', 'blob:'])

export function esUrlAdminPermitida(url: string | null | undefined): boolean {
  const value = url?.trim()
  if (!value || value.includes('\\') || value.startsWith('//') || /^[a-zA-Z]:[\\/]/.test(value)) return false
  if (value.startsWith('/') || value.startsWith('./') || value.startsWith('../') || !value.includes(':')) return true
  try {
    return protocolosPermitidos.has(new URL(value).protocol)
  } catch {
    return false
  }
}
