import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePortalData } from '@/portal/PortalDataContext'
import {
  ACTIVIDAD_ECONOMICA_OPTIONS,
  PROVINCIA_OPTIONS,
  REGIMEN_TRIBUTARIO_OPTIONS,
  SI_NO_OPTIONS,
  TIPO_CONTRIBUYENTE_OPTIONS,
} from './empresa-form-options'

export function EmpresaEditarScreen() {
  const navigate = useNavigate()
  const { empresaActiva, updateEmpresa } = usePortalData()
  const [nombre, setNombre] = useState(empresaActiva.nombre)
  const [general, setGeneral] = useState(empresaActiva.general)
  const [contacto, setContacto] = useState(empresaActiva.contacto)
  const [representante, setRepresentante] = useState(empresaActiva.representante)
  const [ubicacion, setUbicacion] = useState(empresaActiva.ubicacion)
  const [fiscal, setFiscal] = useState(empresaActiva.fiscal)
  const [sensiblesTocados, setSensiblesTocados] = useState(false)

  const updateFiscal = (patch: Partial<typeof fiscal>) => {
    setFiscal((f) => ({ ...f, ...patch }))
    setSensiblesTocados(true)
  }

  const handleGuardar = () => {
    updateEmpresa(empresaActiva.id, { nombre, general, contacto, representante, ubicacion, fiscal })
    navigate('/app/empresa')
  }

  const handleCancelar = () => {
    navigate('/app/empresa')
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Editar empresa</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Los campos sensibles cambian el cálculo de obligaciones e indicadores y requieren confirmación.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-5">
        <h2 className="text-[17px] font-semibold">Datos generales</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-nombre-comercial">Nombre comercial</Label>
            <Input id="edit-nombre-comercial" value={nombre} onChange={(e) => setNombre(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="edit-razon-social">Razón social</Label>
            <Input
              id="edit-razon-social"
              value={general.razonSocial}
              onChange={(e) => setGeneral((g) => ({ ...g, razonSocial: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-tipo-contribuyente">Tipo de contribuyente</Label>
            <Select
              value={general.tipoContribuyente}
              onValueChange={(v) => setGeneral((g) => ({ ...g, tipoContribuyente: v as typeof g.tipoContribuyente }))}
            >
              <SelectTrigger id="edit-tipo-contribuyente" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPO_CONTRIBUYENTE_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-fecha-constitucion">Fecha de constitución</Label>
            <Input
              id="edit-fecha-constitucion"
              value={general.fechaConstitucion}
              onChange={(e) => setGeneral((g) => ({ ...g, fechaConstitucion: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-num-empleados">Número de empleados</Label>
            <Input
              id="edit-num-empleados"
              type="number"
              min="0"
              value={general.numeroEmpleados}
              onChange={(e) => setGeneral((g) => ({ ...g, numeroEmpleados: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-correo">Correo</Label>
            <Input
              id="edit-correo"
              type="email"
              value={contacto.correo}
              onChange={(e) => setContacto((c) => ({ ...c, correo: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-telefono">Teléfono</Label>
            <Input
              id="edit-telefono"
              value={contacto.telefono}
              onChange={(e) => setContacto((c) => ({ ...c, telefono: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-sitio-web">Sitio web</Label>
            <Input
              id="edit-sitio-web"
              value={contacto.sitioWeb}
              onChange={(e) => setContacto((c) => ({ ...c, sitioWeb: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-rep-nombre">Representante legal</Label>
            <Input
              id="edit-rep-nombre"
              value={representante.nombre}
              onChange={(e) => setRepresentante((r) => ({ ...r, nombre: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-rep-cedula">Cédula del representante</Label>
            <Input
              id="edit-rep-cedula"
              value={representante.cedula}
              onChange={(e) => setRepresentante((r) => ({ ...r, cedula: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="edit-provincia">Provincia</Label>
            <Select value={ubicacion.provincia} onValueChange={(v) => setUbicacion((u) => ({ ...u, provincia: v }))}>
              <SelectTrigger id="edit-provincia" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVINCIA_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-ciudad">Ciudad</Label>
            <Input
              id="edit-ciudad"
              value={ubicacion.ciudad}
              onChange={(e) => setUbicacion((u) => ({ ...u, ciudad: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="edit-direccion">Dirección</Label>
            <Input
              id="edit-direccion"
              value={ubicacion.direccion}
              onChange={(e) => setUbicacion((u) => ({ ...u, direccion: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-amber-brand bg-card p-5">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="h-[18px] w-[18px] text-amber-deep" aria-hidden="true" />
          <h2 className="text-[17px] font-semibold">Datos sensibles</h2>
        </div>
        <p className="mt-2 text-sm text-ink-700">
          Cambiarlos regenera obligaciones aplicables y recalcula el diagnóstico. Se confirma antes de guardar.
        </p>
        {sensiblesTocados && (
          <p role="status" className="mt-3.5 rounded-lg bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-amber-deep">
            Cambiaste datos fiscales. Al guardar, se recalcularán las obligaciones y el diagnóstico de esta empresa.
          </p>
        )}
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="edit-regimen">Régimen tributario</Label>
            <Select value={fiscal.regimenTributario} onValueChange={(v) => updateFiscal({ regimenTributario: v })}>
              <SelectTrigger id="edit-regimen" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIMEN_TRIBUTARIO_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-actividad">Actividad económica</Label>
            <Select value={fiscal.actividadEconomica} onValueChange={(v) => updateFiscal({ actividadEconomica: v })}>
              <SelectTrigger id="edit-actividad" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACTIVIDAD_ECONOMICA_OPTIONS.map((o) => (
                  <SelectItem key={o} value={o}>
                    {o}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-4.5 flex flex-wrap gap-6">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-900">Obligado a llevar contabilidad</span>
            <div className="flex gap-2">
              {SI_NO_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => updateFiscal({ obligadoContabilidad: o })}
                  aria-pressed={fiscal.obligadoContabilidad === o}
                  className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                    fiscal.obligadoContabilidad === o
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium text-ink-900">Agente de retención</span>
            <div className="flex gap-2">
              {SI_NO_OPTIONS.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => updateFiscal({ agenteRetencion: o })}
                  aria-pressed={fiscal.agenteRetencion === o}
                  className={`min-h-11 min-w-[74px] rounded-lg border text-sm font-semibold ${
                    fiscal.agenteRetencion === o
                      ? 'border-navy-600 bg-navy-600 text-white'
                      : 'border-line bg-card text-ink-700'
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4.5">
        <h2 className="text-[15px] font-semibold text-ink-700">No editables</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">RUC</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.ruc}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">Fecha de registro en SAFE</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.meta.fechaRegistroSafe}</dd>
          </div>
          <div>
            <dt className="font-mono text-[11.5px] text-ink-500">Plan</dt>
            <dd className="mt-1 text-[13.5px]">{empresaActiva.plan}</dd>
          </div>
        </dl>
      </section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-line bg-background py-3.5">
        <button
          type="button"
          onClick={handleCancelar}
          className="min-h-11 rounded-lg border border-line bg-card px-4 text-sm font-semibold text-ink-700"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleGuardar}
          className="min-h-11 rounded-lg bg-navy-600 px-4.5 text-sm font-semibold text-white"
        >
          Guardar cambios
        </button>
      </div>
    </section>
  )
}
