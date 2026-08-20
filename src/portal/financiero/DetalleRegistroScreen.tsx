import { useNavigate, useParams } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import { Badge } from '@/portal/components/Badge'
import { Card } from '@/portal/components/Card'
import type { FactorIndicador, SemaforoIndicador } from '@/portal/types'
import { activoTotal, calcularDiagnostico, calcularIndicadores, patrimonio, pasivoTotal, utilidadNeta } from './calculo'
import { formatPeriodo, formatUSD } from './formato'
import { PASOS_CAMPOS } from './wizard-steps'

const SEMAFORO_BADGE: Record<SemaforoIndicador, string> = {
  VERDE: 'bg-emerald-soft text-emerald-deep',
  AMARILLO: 'bg-amber-soft text-amber-deep',
  ROJO: 'bg-danger-soft text-destructive',
}

const FACTOR_LABEL: Record<FactorIndicador, string> = {
  LIQUIDEZ: 'Liquidez',
  SOLVENCIA: 'Solvencia',
  GESTION: 'Gestión',
  RENTABILIDAD: 'Rentabilidad',
}

const GRUPOS_BLOQUE: { titulo: string; pasos: (2 | 3 | 4 | 5 | 6 | 7 | 8 | 9)[] }[] = [
  { titulo: 'Activo', pasos: [2] },
  { titulo: 'Pasivo', pasos: [3] },
  { titulo: 'Patrimonio', pasos: [4] },
  { titulo: 'Ingresos y costos', pasos: [5, 6] },
  { titulo: 'Gastos', pasos: [7] },
  { titulo: 'Flujo de efectivo', pasos: [8] },
  { titulo: 'Complementario', pasos: [9] },
]

export function DetalleRegistroScreen() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { empresaActiva, registrosFinancieros } = usePortalData()

  const registros = registrosFinancieros[empresaActiva.id] ?? []
  const registro = registros.find((r) => r.id === id)

  if (!registro) {
    return (
      <section className="flex flex-col gap-4">
        <p className="text-[14px] text-ink-700">No se encontró ese registro financiero.</p>
        <button
          type="button"
          onClick={() => navigate('/app/financiero')}
          className="min-h-11 w-fit rounded-lg border border-line bg-card px-4 text-sm font-semibold text-navy-700"
        >
          Volver a Estados financieros
        </button>
      </section>
    )
  }

  const indicadores = calcularIndicadores(registro)
  const diagnostico = calcularDiagnostico(registro)
  const otrasVersiones = registros
    .filter((r) => r.periodo === registro.periodo && r.id !== registro.id)
    .sort((a, b) => b.version - a.version)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3.5">
        <div>
          <button
            type="button"
            onClick={() => navigate('/app/financiero')}
            className="flex items-center gap-1.5 text-[13px] font-semibold text-navy-500"
          >
            ← Estados financieros
          </button>
          <h1 className="mt-1.5 text-[28px] font-bold leading-tight">{formatPeriodo(registro.periodo)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700">
              {registro.estado}
            </span>
            <span className="text-[13px] text-ink-500">v{registro.version} · solo lectura</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {registro.estado === 'BORRADOR' && (
            <button
              type="button"
              onClick={() => navigate(`/app/financiero/${registro.id}/editar`)}
              className="min-h-11 rounded-lg bg-navy-600 px-4 text-[13.5px] font-semibold text-white"
            >
              Continuar carga
            </button>
          )}
        </div>
      </div>

      {GRUPOS_BLOQUE.map((grupo) => (
        <Card as="section" key={grupo.titulo} padding="lg">
          <h2 className="text-[16px] font-semibold">{grupo.titulo}</h2>
          <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {grupo.pasos.flatMap((paso) => PASOS_CAMPOS[paso]).map((campo) => (
              <div key={campo.key} className="flex items-center justify-between gap-3 border-b border-line/70 pb-2">
                <dt className="text-[12.5px] text-ink-500">{campo.label}</dt>
                <dd className="num text-[13.5px] font-semibold">{formatUSD(registro[campo.key] as number)}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}

      <Card as="section" padding="lg">
        <h2 className="text-[16px] font-semibold">Indicadores calculados</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[13px]">
            <thead>
              <tr className="text-left text-ink-500">
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Código</th>
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Indicador</th>
                <th scope="col" className="px-2 py-2 text-[11px] font-semibold uppercase">Factor</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Valor</th>
                <th scope="col" className="px-2 py-2 text-right text-[11px] font-semibold uppercase">Semáforo</th>
              </tr>
            </thead>
            <tbody>
              {indicadores.map((i) => (
                <tr key={i.codigo} className="border-t border-line/70">
                  <td className="px-2 py-2 font-mono text-[11.5px] text-ink-500">{i.codigo}</td>
                  <td className="px-2 py-2 font-medium">{i.nombre}</td>
                  <td className="px-2 py-2 text-ink-700">{FACTOR_LABEL[i.factor]}</td>
                  <td className="num px-2 py-2 text-right font-semibold">{i.valorFormateado}</td>
                  <td className="px-2 py-2 text-right">
                    <Badge size="xs" className={SEMAFORO_BADGE[i.semaforo]}>
                      {i.semaforo}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Diagnóstico</h2>
          <ul className="mt-3 flex flex-col gap-2">
            {diagnostico.map((linea) => (
              <li key={linea} className="text-[13.5px] leading-relaxed text-ink-700">
                {linea}
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-1 gap-2 border-t border-line/70 pt-3 sm:grid-cols-3">
            <div>
              <dt className="text-[11.5px] text-ink-500">Activo total</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(activoTotal(registro))}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-500">Pasivo + patrimonio</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(pasivoTotal(registro) + patrimonio(registro))}</dd>
            </div>
            <div>
              <dt className="text-[11.5px] text-ink-500">Utilidad neta</dt>
              <dd className="num text-[13.5px] font-semibold">{formatUSD(utilidadNeta(registro))}</dd>
            </div>
          </dl>
        </Card>
        <Card as="section" padding="lg">
          <h2 className="text-[16px] font-semibold">Historial de versiones</h2>
          {otrasVersiones.length === 0 ? (
            <p className="mt-3 text-[13px] text-ink-500">No hay otras versiones para este periodo.</p>
          ) : (
            <ol className="mt-3 flex flex-col gap-2.5">
              {otrasVersiones.map((v) => (
                <li key={v.id} className="rounded-lg border border-line/70 bg-surface p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-[13.5px]">v{v.version}</strong>
                    <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                      {v.estado}
                    </span>
                    <button
                      type="button"
                      onClick={() => navigate(`/app/financiero/${v.id}`)}
                      className="ml-auto text-[12.5px] font-semibold text-navy-500"
                    >
                      Ver
                    </button>
                  </div>
                  {v.observaciones && (
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-700">{v.observaciones}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </section>
  )
}
