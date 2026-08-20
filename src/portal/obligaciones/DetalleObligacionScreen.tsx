import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { formatPeriodo, formatUSD } from '@/portal/financiero/formato'
import { obligacionPorCodigo } from './catalogo'
import { diasHasta, estadoObligacion, HOY_OBLIGACIONES, novenoDigito } from './calculo'
import { ESTADO_OBLIGACION_BADGE, ESTADO_OBLIGACION_LABEL } from './estado-estilo'
import { capitalizar, formatDias, formatFecha } from './formato'
import { ConfigurarRecordatorioDialog } from './ConfigurarRecordatorioDialog'
import { DesactivarRecordatorioDialog } from './DesactivarRecordatorioDialog'
import { Card } from '@/portal/components/Card'

export function DetalleObligacionScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const {
    empresaActiva,
    obligacionesEmpresa,
    marcarObligacionCumplida,
    activarRecordatorioObligacion,
    desactivarRecordatorioObligacion,
  } = usePortalData()
  const [configurarAbierto, setConfigurarAbierto] = useState(false)
  const [desactivarAbierto, setDesactivarAbierto] = useState(false)

  const obligaciones = obligacionesEmpresa[empresaActiva.id] ?? []
  const obligacion = obligaciones.find((o) => o.id === id)

  if (!obligacion) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró esa obligación.</p>
        <button
          type="button"
          onClick={() => navigate('/app/obligaciones')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Obligaciones tributarias
        </button>
      </section>
    )
  }

  const catalogo = obligacionPorCodigo(obligacion.obligacionCodigo)
  const nombreBase = catalogo?.nombre ?? obligacion.obligacionCodigo
  const tituloBase = obligacion.notas ? `${nombreBase} (${obligacion.notas})` : nombreBase
  const titulo = `${tituloBase} — ${formatPeriodo(obligacion.periodo)}`
  const estado = estadoObligacion(obligacion, HOY_OBLIGACIONES)
  const dias = diasHasta(obligacion.fechaLimite, HOY_OBLIGACIONES)
  const puedeCumplir = estado !== 'CUMPLIDA' && estado !== 'NO_APLICA'

  const grupos = [
    {
      titulo: 'Información general',
      items: [
        { label: 'Categoría', valor: catalogo ? capitalizar(catalogo.categoria) : '—' },
        { label: 'Institución', valor: catalogo?.institucion ?? '—' },
        { label: 'Periodicidad', valor: catalogo ? capitalizar(catalogo.periodicidad) : '—' },
        { label: 'Formulario', valor: catalogo?.formulario ?? '—' },
        { label: 'Usa noveno dígito', valor: catalogo?.usaNovenoDigito ? 'Sí' : 'No' },
      ],
    },
    {
      titulo: 'Periodo y fecha límite',
      items: [
        { label: 'Periodo', valor: formatPeriodo(obligacion.periodo) },
        { label: 'Fecha límite', valor: formatFecha(obligacion.fechaLimite) },
        {
          label: dias < 0 ? 'Vencida hace' : 'Días restantes',
          valor: formatDias(dias),
        },
        ...(catalogo?.usaNovenoDigito
          ? [{ label: 'Noveno dígito del RUC aplicado', valor: String(novenoDigito(empresaActiva.ruc)) }]
          : []),
      ],
    },
    {
      titulo: 'Monto',
      items: [
        { label: 'Base de cálculo', valor: obligacion.baseCalculo !== undefined ? formatUSD(obligacion.baseCalculo) : '—' },
        {
          label: 'Monto estimado',
          valor: catalogo?.permiteMontoEstimado && obligacion.montoEstimado !== undefined ? formatUSD(obligacion.montoEstimado) : 'No aplica',
        },
      ],
    },
    {
      titulo: 'Estado y recordatorio',
      items: [
        { label: 'Estado', valor: ESTADO_OBLIGACION_LABEL[estado] },
        { label: 'Fecha de cumplimiento', valor: obligacion.fechaCumplimiento ? formatFecha(obligacion.fechaCumplimiento) : '—' },
        {
          label: 'Recordatorio activo',
          valor: obligacion.recordatorioActivo
            ? `Sí · ${obligacion.diasAnticipacion ?? 7} días antes`
            : 'No',
        },
        { label: 'Notas', valor: obligacion.notas ?? '—' },
      ],
    },
  ]

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/obligaciones')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
          >
            ← Obligaciones tributarias
          </button>
          <h1 className="mt-1.5 text-[26px] font-bold leading-tight">{titulo}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <span className={`rounded-full px-2.5 py-1 text-[11.5px] font-semibold ${ESTADO_OBLIGACION_BADGE[estado]}`}>
              {ESTADO_OBLIGACION_LABEL[estado]}
            </span>
            <span className="text-[13px] text-ink-500">{catalogo?.formulario}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {puedeCumplir && (
            <button
              type="button"
              onClick={() => marcarObligacionCumplida(empresaActiva.id, obligacion.id)}
              className="min-h-11 rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white"
            >
              Marcar como cumplida
            </button>
          )}
          {puedeCumplir && (
            <button
              type="button"
              onClick={() => (obligacion.recordatorioActivo ? setDesactivarAbierto(true) : setConfigurarAbierto(true))}
              aria-pressed={obligacion.recordatorioActivo}
              className={`min-h-11 rounded-lg border px-4 text-[13.5px] font-semibold ${
                obligacion.recordatorioActivo
                  ? 'border-navy-500/30 bg-navy-100 text-navy-700'
                  : 'border-line bg-card text-ink-700'
              }`}
            >
              {obligacion.recordatorioActivo
                ? `Recordatorio activado · ${obligacion.diasAnticipacion ?? 7}d antes`
                : 'Configurar recordatorio'}
            </button>
          )}
        </div>
      </div>

      {grupos.map((g) => (
        <Card as="section" key={g.titulo} padding="lg">
          <h2 className="text-[16px] font-semibold">{g.titulo}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {g.items.map((i) => (
              <div key={i.label} className="min-w-0">
                <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{i.label}</dt>
                <dd className="mt-1 text-[13.5px] leading-snug">{i.valor}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}

      <ConfigurarRecordatorioDialog
        abierto={configurarAbierto}
        valorInicial={obligacion.diasAnticipacion}
        onCerrar={() => setConfigurarAbierto(false)}
        onGuardar={(dias) => activarRecordatorioObligacion(empresaActiva.id, obligacion.id, dias)}
      />
      <DesactivarRecordatorioDialog
        abierto={desactivarAbierto}
        onCerrar={() => setDesactivarAbierto(false)}
        onConfirmar={() => desactivarRecordatorioObligacion(empresaActiva.id, obligacion.id)}
      />
    </section>
  )
}
