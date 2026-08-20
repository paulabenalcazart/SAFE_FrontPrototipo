import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, List, TriangleAlert } from 'lucide-react'
import { usePortalData } from '@/portal/PortalDataContext'
import type { EstadoObligacion, ObligacionEmpresa } from '@/portal/types'
import { formatPeriodo, formatUSD } from '@/portal/financiero/formato'
import { obligacionPorCodigo } from './catalogo'
import { diasHasta, estadoObligacion, HOY_OBLIGACIONES } from './calculo'
import { ESTADO_OBLIGACION_BADGE, ESTADO_OBLIGACION_LABEL, ESTADO_OBLIGACION_SWATCH } from './estado-estilo'
import { construirCeldasMes, diasSemanaLabels } from './calendario'
import { formatDias, formatFecha } from './formato'
import { AlertBox } from '@/portal/components/AlertBox'
import { SeverityIcon } from '@/portal/components/SeverityIcon'
import { Card } from '@/portal/components/Card'
import { Badge } from '@/portal/components/Badge'

type ObligacionVista = {
  obligacion: ObligacionEmpresa
  titulo: string
  formulario: string
  estado: EstadoObligacion
}

// Solo para la etiqueta del mes del calendario (mesLabel) — no se comparte con formatFecha en ./formato.
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

export function ObligacionesScreen() {
  const navigate = useNavigate()
  const { empresaActiva, obligacionesEmpresa } = usePortalData()
  const [vista, setVista] = useState<'calendario' | 'lista'>('calendario')
  const [filtroLista, setFiltroLista] = useState<'todas' | EstadoObligacion>('todas')
  const hoyDate = useMemo(() => new Date(`${HOY_OBLIGACIONES}T00:00:00`), [])
  const [mesMostrado, setMesMostrado] = useState({ anio: hoyDate.getFullYear(), mes: hoyDate.getMonth() + 1 })

  const items: ObligacionVista[] = useMemo(() => {
    const lista = obligacionesEmpresa[empresaActiva.id] ?? []
    return lista
      .map((o): ObligacionVista => {
        const catalogo = obligacionPorCodigo(o.obligacionCodigo)
        const nombreBase = catalogo?.nombre ?? o.obligacionCodigo
        return {
          obligacion: o,
          titulo: o.notas ? `${nombreBase} (${o.notas})` : nombreBase,
          formulario: catalogo?.formulario ?? '—',
          estado: estadoObligacion(o, HOY_OBLIGACIONES),
        }
      })
      .sort((a, b) => a.obligacion.fechaLimite.localeCompare(b.obligacion.fechaLimite))
  }, [obligacionesEmpresa, empresaActiva.id])

  const vencidas = items.filter((i) => i.estado === 'VENCIDA')
  const proximas = items.filter((i) => i.estado === 'PROXIMA')
  const pasadas = items.filter((i) => diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES) < 0)
  const cumplidasATiempo = pasadas.filter((i) => i.estado === 'CUMPLIDA')
  const cumplimientoPct = pasadas.length === 0 ? 100 : Math.round((cumplidasATiempo.length / pasadas.length) * 100)
  const montoVencido = vencidas.reduce((suma, i) => suma + (i.obligacion.montoEstimado ?? 0), 0)
  const proximaMasCercana = proximas[0]

  const kpis = [
    {
      titulo: 'Cumplimiento',
      valor: `${cumplimientoPct}%`,
      sub: `${cumplidasATiempo.length} de ${pasadas.length} cumplidas`,
    },
    {
      titulo: 'Próximas a vencer',
      valor: String(proximas.length),
      sub: proximaMasCercana
        ? `${proximaMasCercana.titulo} · ${formatFecha(proximaMasCercana.obligacion.fechaLimite)}`
        : 'Ninguna en los próximos 15 días',
    },
    {
      titulo: 'Vencidas',
      valor: String(vencidas.length),
      sub: vencidas.length === 0 ? 'Sin obligaciones vencidas' : `${formatUSD(montoVencido)} en mora`,
    },
  ]

  const irADetalle = (id: string) => navigate(`/app/obligaciones/${id}`)
  const irAMarketplace = () => navigate('/app/marketplace')

  const cambiarAListaFiltrada = (filtro: EstadoObligacion) => {
    setVista('lista')
    setFiltroLista(filtro)
  }

  const listaFiltrada = filtroLista === 'todas' ? items : items.filter((i) => i.estado === filtroLista)
  const prioridad = [...vencidas, ...proximas].slice(0, 3)

  const alertasVencidas = vencidas
    .map((i) => ({
      id: i.obligacion.id,
      etiqueta: 'Vencida',
      texto: `${i.titulo} venció hace ${formatDias(diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES))}.`,
      estado: i.estado,
    }))
    .slice(0, 4)

  const recomendacionesProximas = proximas
    .filter((i) => diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES) <= 5)
    .map((i) => ({
      id: i.obligacion.id,
      etiqueta: 'Próxima',
      texto: `${i.titulo} vence en ${formatDias(diasHasta(i.obligacion.fechaLimite, HOY_OBLIGACIONES))}.`,
      estado: i.estado,
    }))
    .slice(0, 4)

  const celdas = construirCeldasMes(mesMostrado.anio, mesMostrado.mes)
  const celdasConItems = celdas.map((c) => ({
    ...c,
    items: items.filter((i) => i.obligacion.fechaLimite === c.fecha),
  }))
  const mesLabel = `${MESES[mesMostrado.mes - 1].charAt(0).toUpperCase()}${MESES[mesMostrado.mes - 1].slice(1)} ${mesMostrado.anio}`

  const mesAnterior = () =>
    setMesMostrado((m) => (m.mes === 1 ? { anio: m.anio - 1, mes: 12 } : { anio: m.anio, mes: m.mes - 1 }))
  const mesSiguiente = () =>
    setMesMostrado((m) => (m.mes === 12 ? { anio: m.anio + 1, mes: 1 } : { anio: m.anio, mes: m.mes + 1 }))

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Obligaciones tributarias</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Calendario de vencimientos generado según tu tipo de contribuyente y el noveno dígito del RUC.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map((k) => (
          <Card key={k.titulo} className="flex min-h-[122px] flex-col gap-2">
            <p className="text-[12.5px] font-semibold text-ink-500">{k.titulo}</p>
            <p className="num mt-auto text-[26px] font-bold leading-none">{k.valor}</p>
            <p className="text-[12px] leading-snug text-ink-500">{k.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <Card as="section" padding="lg">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-semibold">Calendario de vencimientos</h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setVista('calendario')}
                aria-pressed={vista === 'calendario'}
                aria-label="Vista de calendario"
                title="Calendario"
                className={`grid h-9.5 w-9.5 place-items-center rounded-lg ${vista === 'calendario' ? 'border border-navy-600 bg-navy-100 text-navy-700' : 'border border-line bg-card text-ink-700'}`}
              >
                <CalendarDays className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setVista('lista')
                  setFiltroLista('todas')
                }}
                aria-pressed={vista === 'lista'}
                aria-label="Vista de lista"
                title="Lista"
                className={`grid h-9.5 w-9.5 place-items-center rounded-lg ${vista === 'lista' ? 'border border-navy-600 bg-navy-100 text-navy-700' : 'border border-line bg-card text-ink-700'}`}
              >
                <List className="h-4.5 w-4.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {vista === 'calendario' ? (
            <div className="mt-3.5">
              <div className="flex items-center justify-between gap-2.5">
                <button type="button" onClick={mesAnterior} aria-label="Mes anterior" className="grid h-9.5 w-9.5 place-items-center rounded-lg border border-line bg-card text-ink-700">
                  ←
                </button>
                <strong className="text-[14.5px]">{mesLabel}</strong>
                <button type="button" onClick={mesSiguiente} aria-label="Mes siguiente" className="grid h-9.5 w-9.5 place-items-center rounded-lg border border-line bg-card text-ink-700">
                  →
                </button>
              </div>
              <div className="mt-3 overflow-x-auto">
                <div className="grid min-w-[420px] grid-cols-7 gap-1.5">
                  {diasSemanaLabels().map((d) => (
                    <span key={d} className="pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-500">
                      {d}
                    </span>
                  ))}
                  {celdasConItems.map((c) => {
                    const esHoy = c.fecha === HOY_OBLIGACIONES
                    return (
                      <div
                        key={c.fecha}
                        className={`flex min-h-16 flex-col gap-0.5 rounded-lg border p-1 ${
                          esHoy ? 'border-navy-600 bg-navy-100' : 'border-line/70'
                        } ${!esHoy && c.delMes ? 'bg-card' : ''} ${!esHoy && !c.delMes ? 'bg-surface/60' : ''}`}
                      >
                        <span className={`text-[11px] ${esHoy ? 'font-bold text-navy-700' : 'text-ink-500'}`}>{c.numero}</span>
                        {c.items.map((i) => (
                          <button
                            key={i.obligacion.id}
                            type="button"
                            onClick={() => irADetalle(i.obligacion.id)}
                            title={`${i.titulo} · vence ${formatFecha(i.obligacion.fechaLimite)} · ${ESTADO_OBLIGACION_LABEL[i.estado]}`}
                            aria-label={`${i.titulo}, vence ${formatFecha(i.obligacion.fechaLimite)}, ${ESTADO_OBLIGACION_LABEL[i.estado]}`}
                            className={`truncate rounded px-1 py-0.5 text-left text-[10px] font-semibold ${ESTADO_OBLIGACION_BADGE[i.estado]}`}
                          >
                            {i.titulo}
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[11.5px] text-ink-700">
                {(['CUMPLIDA', 'PROXIMA', 'VENCIDA', 'PENDIENTE'] as EstadoObligacion[]).map((estado) => (
                  <span key={estado} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-sm border ${ESTADO_OBLIGACION_SWATCH[estado]}`} />
                    {estado === 'PENDIENTE' ? 'Pendiente / No aplica' : ESTADO_OBLIGACION_LABEL[estado]}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-3.5 flex flex-col gap-2.5">
              {filtroLista !== 'todas' && (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-2.5 py-1 text-[12px] font-semibold text-navy-700">
                    {ESTADO_OBLIGACION_LABEL[filtroLista]}
                    <button
                      type="button"
                      onClick={() => setFiltroLista('todas')}
                      aria-label="Quitar filtro y ver todas"
                      className="ml-0.5 text-navy-700"
                    >
                      ×
                    </button>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiltroLista('todas')}
                    className="text-[12px] font-semibold text-navy-500"
                  >
                    Ver todas
                  </button>
                </div>
              )}
              {listaFiltrada.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-ink-500">
                  {items.length === 0
                    ? 'No existen obligaciones generadas'
                    : 'Ninguna obligación coincide con el filtro seleccionado.'}
                </p>
              ) : (
                listaFiltrada.map((i) => (
                  <div key={i.obligacion.id} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-line/70 bg-card p-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold leading-snug">{i.titulo}</p>
                      <p className="mt-1 text-[12px] text-ink-500">
                        {i.formulario} · {formatPeriodo(i.obligacion.periodo)} · vence {formatFecha(i.obligacion.fechaLimite)}
                      </p>
                    </div>
                    <span className="num text-[13.5px] font-semibold">
                      {i.obligacion.montoEstimado !== undefined ? formatUSD(i.obligacion.montoEstimado) : '—'}
                    </span>
                    <Badge className={ESTADO_OBLIGACION_BADGE[i.estado]}>
                      {ESTADO_OBLIGACION_LABEL[i.estado]}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => irADetalle(i.obligacion.id)}
                      className="min-h-9.5 rounded-lg border border-line bg-card px-3 text-[12.5px] font-semibold text-navy-700"
                    >
                      Ver detalle
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </Card>

        <div className="flex flex-1 flex-col gap-4">
          <Card as="section" padding="lg" className="flex flex-1 flex-col">
            <h2 className="text-[16px] font-semibold">Atención prioritaria</h2>
            <div className="mt-3 flex flex-1 flex-col justify-center gap-2.5">
              {prioridad.length === 0 ? (
                <p className="text-[13px] text-ink-500">Sin obligaciones urgentes por ahora.</p>
              ) : (
                prioridad.map((i) => {
                  const [bg, fg] = ESTADO_OBLIGACION_BADGE[i.estado].split(' ')
                  return (
                    <div key={i.obligacion.id} className={`flex flex-wrap items-center gap-2.5 rounded-lg p-3 ${bg}`}>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-semibold leading-snug">{i.titulo}</p>
                        <p className={`mt-0.5 text-[12px] font-semibold ${fg}`}>
                          {i.estado === 'VENCIDA' ? 'Venció' : 'Vence'} {formatFecha(i.obligacion.fechaLimite)}
                        </p>
                      </div>
                      <button type="button" onClick={() => irADetalle(i.obligacion.id)} className="min-h-9.5 rounded-lg bg-navy-600 px-3 text-[12.5px] font-semibold text-white">
                        Ver detalle
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </Card>

          <Card as="section" padding="lg" className="flex flex-1 flex-col">
            <h2 className="text-[16px] font-semibold">Acciones rápidas</h2>
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => cambiarAListaFiltrada('CUMPLIDA')} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Ver historial de cumplidas
              </button>
              <button type="button" onClick={() => cambiarAListaFiltrada('VENCIDA')} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Ver vencidas
              </button>
              <button type="button" onClick={irAMarketplace} className="min-h-11 rounded-lg border border-line bg-card px-3.5 text-left text-[13.5px] font-semibold text-ink-900">
                Buscar asesor tributario
              </button>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Alertas</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {alertasVencidas.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin alertas: no tienes obligaciones vencidas.</p>
            ) : (
              alertasVencidas.map((a) => (
                <AlertBox key={a.id} icon={TriangleAlert} tono="critico" cornerLabel={a.etiqueta}>
                  <p className="text-[13px] leading-snug">{a.texto}</p>
                  <button
                    type="button"
                    onClick={() => irADetalle(a.id)}
                    className="mt-1.5 text-[12.5px] font-semibold text-navy-600"
                  >
                    Ver detalle
                  </button>
                </AlertBox>
              ))
            )}
          </div>
        </Card>
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Recomendaciones</h2>
          <div className="mt-3 flex flex-col gap-2.5">
            {recomendacionesProximas.length === 0 ? (
              <p className="text-[13px] text-ink-500">Sin recomendaciones por ahora.</p>
            ) : (
              recomendacionesProximas.map((r) => (
                <div key={r.id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border border-line/70 bg-surface p-3">
                  <SeverityIcon nivel="media" />
                  <p className="min-w-0 text-[13px] leading-snug">{r.texto}</p>
                  <button
                    type="button"
                    onClick={() => irADetalle(r.id)}
                    className="min-h-8.5 rounded-lg bg-navy-600 px-3 text-[12px] font-semibold text-white"
                  >
                    Ver detalle
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}
