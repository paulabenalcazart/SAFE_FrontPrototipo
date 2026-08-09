export type CeldaCalendario = {
  fecha: string // ISO 'YYYY-MM-DD'
  numero: number
  delMes: boolean
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function diasSemanaLabels(): string[] {
  return DIAS_SEMANA
}

export function construirCeldasMes(anio: number, mes: number): CeldaCalendario[] {
  const primerDiaMes = new Date(anio, mes - 1, 1)
  const offsetLunes = (primerDiaMes.getDay() + 6) % 7 // getDay(): 0=domingo..6=sábado -> 0=lunes..6=domingo
  const diasEnMes = new Date(anio, mes, 0).getDate()
  const totalCeldas = Math.ceil((offsetLunes + diasEnMes) / 7) * 7

  const celdas: CeldaCalendario[] = []
  for (let i = 0; i < totalCeldas; i++) {
    const numeroDia = i - offsetLunes + 1
    const fecha = new Date(anio, mes - 1, numeroDia)
    celdas.push({
      fecha: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
      numero: fecha.getDate(),
      delMes: fecha.getMonth() === mes - 1,
    })
  }
  return celdas
}
