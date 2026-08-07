import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortalData } from '@/portal/PortalDataContext'
import type { Empresa } from '@/portal/types'

type TabKey = 'general' | 'fiscal' | 'contacto' | 'ubicacion' | 'representante'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'general', label: 'General' },
  { key: 'fiscal', label: 'Fiscal' },
  { key: 'contacto', label: 'Contacto' },
  { key: 'ubicacion', label: 'Ubicación' },
  { key: 'representante', label: 'Representante' },
]

function buildCampos(empresa: Empresa, tab: TabKey): { label: string; valor: string }[] {
  switch (tab) {
    case 'general':
      return [
        { label: 'Razón social', valor: empresa.general.razonSocial },
        { label: 'Nombre comercial', valor: empresa.nombre },
        { label: 'RUC', valor: empresa.ruc },
        { label: 'Tipo de contribuyente', valor: empresa.general.tipoContribuyente },
        { label: 'Fecha de constitución', valor: empresa.general.fechaConstitucion },
        { label: 'Número de empleados', valor: empresa.general.numeroEmpleados },
      ]
    case 'fiscal':
      return [
        { label: 'Régimen tributario', valor: empresa.fiscal.regimenTributario },
        { label: 'Actividad económica', valor: empresa.fiscal.actividadEconomica },
        { label: 'Obligado a llevar contabilidad', valor: empresa.fiscal.obligadoContabilidad },
        { label: 'Agente de retención', valor: empresa.fiscal.agenteRetencion },
      ]
    case 'contacto':
      return [
        { label: 'Correo', valor: empresa.contacto.correo },
        { label: 'Teléfono', valor: empresa.contacto.telefono },
        { label: 'Sitio web', valor: empresa.contacto.sitioWeb || 'No registrado' },
      ]
    case 'ubicacion':
      return [
        { label: 'Provincia', valor: empresa.ubicacion.provincia },
        { label: 'Ciudad', valor: empresa.ubicacion.ciudad },
        { label: 'Dirección', valor: empresa.ubicacion.direccion },
      ]
    case 'representante':
      return [
        { label: 'Nombre', valor: empresa.representante.nombre },
        { label: 'Cédula', valor: empresa.representante.cedula },
      ]
  }
}

export function EmpresaScreen() {
  const { empresaActiva } = usePortalData()
  const [tab, setTab] = useState<TabKey>('general')
  const navigate = useNavigate()

  const campos = buildCampos(empresaActiva, tab)

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4.5 rounded-xl border border-line bg-card p-5">
        <span className="grid h-19 w-19 shrink-0 place-items-center rounded-2xl bg-navy-100 font-display text-2xl font-bold text-navy-700">
          {empresaActiva.iniciales}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-tight">{empresaActiva.nombre}</h1>
          <p className="mt-1 text-sm text-ink-700">{empresaActiva.general.razonSocial}</p>
          <div className="mt-2.5 flex flex-wrap gap-2">
            <span className="rounded-full bg-emerald-soft px-2.5 py-1 text-[11.5px] font-semibold text-emerald-deep">
              {empresaActiva.estado}
            </span>
            <span className="rounded-full bg-navy-100 px-2.5 py-1 text-[11.5px] font-semibold text-navy-700">
              {empresaActiva.plan}
            </span>
            {empresaActiva.diagnostico && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-semibold text-ink-700">
                Salud financiera: {empresaActiva.diagnostico}
              </span>
            )}
            {empresaActiva.diagnosticoFecha && (
              <span className="rounded-full bg-surface px-2.5 py-1 text-[11.5px] font-medium text-ink-500">
                Último diagnóstico: {empresaActiva.diagnosticoFecha}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/empresa/editar')}
          className="rounded-lg border border-line bg-card px-4 py-2.5 text-sm font-semibold text-navy-700"
        >
          Editar empresa
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Régimen tributario</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.fiscal.regimenTributario}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">
            Obligado a contabilidad: {empresaActiva.fiscal.obligadoContabilidad}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Actividad económica</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.fiscal.actividadEconomica}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">
            Agente de retención: {empresaActiva.fiscal.agenteRetencion}
          </p>
        </div>
        <div className="rounded-xl border border-line bg-card p-4">
          <p className="text-[12.5px] font-semibold text-ink-500">Representante legal</p>
          <p className="mt-2 text-[15px] font-semibold leading-snug">{empresaActiva.representante.nombre}</p>
          <p className="mt-1.5 text-[12.5px] text-ink-500">Cédula: {empresaActiva.representante.cedula}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <div className="flex flex-wrap gap-1.5 border-b border-line/70 bg-surface p-3.5">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={tab === t.key}
              className={`min-h-9.5 rounded-full border px-3.5 text-[13px] font-semibold ${
                tab === t.key ? 'border-navy-600 bg-navy-600 text-white' : 'border-line bg-card text-ink-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <dl className="grid grid-cols-1 gap-3.5 p-4.5 sm:grid-cols-2">
          {campos.map((c) => (
            <div key={c.label} className="min-w-0">
              <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{c.label}</dt>
              <dd className="mt-1.5 break-words text-sm leading-relaxed text-ink-900">{c.valor}</dd>
            </div>
          ))}
        </dl>
      </section>
    </section>
  )
}
