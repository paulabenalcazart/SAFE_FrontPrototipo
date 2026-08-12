import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useAuth } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { DOCUMENTOS_LEGALES } from '@/portal/configuracion/catalogo'
import { useTemaPreferencia } from '@/portal/configuracion/useTemaPreferencia'
import type { CategoriaNotificacionColaborador, FrecuenciaNotificacionColaborador } from '@/portal/types'

const FILAS_NOTIFICACION: { categoria: CategoriaNotificacionColaborador; label: string }[] = [
  { categoria: 'NEW_REQUEST', label: 'Nuevas solicitudes de citas' },
  { categoria: 'APPOINTMENT_REMINDER', label: 'Confirmaciones y recordatorios' },
  { categoria: 'CANCELLATION_RESCHEDULE', label: 'Cancelaciones y reagendamiento' },
  { categoria: 'NEW_REVIEW', label: 'Nuevas valoraciones' },
  { categoria: 'PRODUCT_UPDATES', label: 'Novedades y actualizaciones' },
]

const OPCIONES_FRECUENCIA: { valor: FrecuenciaNotificacionColaborador; etiqueta: string }[] = [
  { valor: 'INMEDIATA', etiqueta: 'Inmediata' },
  { valor: 'DIARIA', etiqueta: 'Diaria' },
  { valor: 'SEMANAL', etiqueta: 'Semanal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
  { valor: 'NINGUNA', etiqueta: 'Ninguna' },
]

type PasswordForm = { actual: string; nueva: string; confirma: string }

export function CollaboratorSettingsScreen() {
  const navigate = useNavigate()
  const { user, toggleMfa } = useAuth()
  const { preferencias, actualizarPreferencia, preferenciasNotificacionColaborador, actualizarPreferenciaNotificacionColaborador } =
    usePortalData()
  const [tema, setTema] = useTemaPreferencia()

  const [pwd, setPwd] = useState<PasswordForm>({ actual: '', nueva: '', confirma: '' })
  const [pwdVisible, setPwdVisible] = useState(false)
  const [pwdMensaje, setPwdMensaje] = useState<string | null>(null)
  const [exportarMensaje, setExportarMensaje] = useState<string | null>(null)
  const [documentoAbierto, setDocumentoAbierto] = useState<string | null>(null)
  const [eliminarAbierto, setEliminarAbierto] = useState(false)

  if (!user) return null

  const errorPwd = (() => {
    if (!pwd.nueva && !pwd.confirma) return ''
    if (pwd.nueva && pwd.nueva.length < 8) return 'La contraseña nueva debe tener al menos 8 caracteres.'
    if (pwd.confirma && pwd.nueva !== pwd.confirma) return 'Las contraseñas no coinciden.'
    return ''
  })()

  const handleCambiarPwd = () => {
    if (!pwd.actual || !pwd.nueva || pwd.nueva !== pwd.confirma || pwd.nueva.length < 8) {
      setPwdMensaje('Revisa los campos de contraseña.')
      return
    }
    setPwd({ actual: '', nueva: '', confirma: '' })
    setPwdMensaje('Contraseña actualizada. La contraseña nunca se guarda en texto plano.')
  }

  const handleExportar = () => {
    setExportarMensaje(
      'Exportación generada: usuario, colaborador, especialidades, servicios, disponibilidad, solicitudes, citas, reseñas, preferencias y notificaciones.',
    )
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <h1 className="text-[28px] font-bold leading-tight">Configuración</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-700">
          Administra tu cuenta, seguridad, notificaciones y preferencias.
        </p>
      </div>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink-900">Cuenta</h2>
          <Button variant="outline" onClick={() => navigate('/app/configuracion/cuenta')}>
            Editar cuenta
          </Button>
        </div>
        <dl className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Nombres</dt>
            <dd className="mt-1 break-words text-[13.5px] text-ink-900">{user.nombres}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Apellidos</dt>
            <dd className="mt-1 break-words text-[13.5px] text-ink-900">{user.apellidos}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              Correo electrónico
            </dt>
            <dd className="mt-1 break-all text-[13.5px] text-ink-900">{user.correo}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Seguridad</h2>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-ink-900">Autenticación en dos pasos (2FA)</p>
            <p className="mt-1 text-[12.5px] text-ink-500">
              Se solicita un código al iniciar sesión desde un dispositivo nuevo.
            </p>
          </div>
          <Switch checked={user.mfaHabilitado} onCheckedChange={toggleMfa} label="Autenticación en dos pasos" />
        </div>

        <h3 className="mt-4 text-sm font-semibold text-ink-900">Cambiar contraseña</h3>
        <div className="mt-3 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          <div>
            <Label htmlFor="cfg-col-pwd-actual">Contraseña actual</Label>
            <Input
              id="cfg-col-pwd-actual"
              type={pwdVisible ? 'text' : 'password'}
              value={pwd.actual}
              onChange={(e) => setPwd((p) => ({ ...p, actual: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cfg-col-pwd-nueva">Contraseña nueva</Label>
            <Input
              id="cfg-col-pwd-nueva"
              type={pwdVisible ? 'text' : 'password'}
              value={pwd.nueva}
              onChange={(e) => setPwd((p) => ({ ...p, nueva: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="cfg-col-pwd-confirma">Confirma contraseña nueva</Label>
            <Input
              id="cfg-col-pwd-confirma"
              type={pwdVisible ? 'text' : 'password'}
              value={pwd.confirma}
              onChange={(e) => setPwd((p) => ({ ...p, confirma: e.target.value }))}
              className="mt-1.5"
            />
          </div>
        </div>
        {errorPwd && (
          <p role="alert" className="mt-2.5 text-[12.5px] font-semibold text-destructive">
            {errorPwd}
          </p>
        )}
        {pwdMensaje && (
          <p role="status" className="mt-2.5 rounded-lg bg-emerald-soft px-3.5 py-2.5 text-[13px] font-semibold text-emerald-deep">
            {pwdMensaje}
          </p>
        )}
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <Button onClick={handleCambiarPwd}>Cambiar contraseña</Button>
          <Button variant="outline" type="button" onClick={() => setPwdVisible((v) => !v)}>
            {pwdVisible ? (
              <>
                <EyeOff className="mr-1.5 h-4 w-4" aria-hidden="true" /> Ocultar contraseñas
              </>
            ) : (
              <>
                <Eye className="mr-1.5 h-4 w-4" aria-hidden="true" /> Mostrar contraseñas
              </>
            )}
          </Button>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Notificaciones</h2>
        <div className="mt-3.5 hidden grid-cols-[1fr,140px,180px] gap-3 border-b border-line-soft pb-2.5 sm:grid">
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
            Tipo de notificación
          </span>
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Correo</span>
          <span className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Frecuencia</span>
        </div>
        <div className="mt-2 flex flex-col divide-y divide-line-soft sm:mt-0">
          {FILAS_NOTIFICACION.map((fila) => {
            const pref = preferenciasNotificacionColaborador.find((p) => p.categoria === fila.categoria)
            if (!pref) return null
            return (
              <div
                key={fila.categoria}
                className="flex flex-col gap-2.5 py-3 sm:grid sm:grid-cols-[1fr,140px,180px] sm:items-center sm:gap-3"
              >
                <span className="text-[13.5px] font-medium text-ink-900">{fila.label}</span>
                <Switch
                  checked={pref.correoActivo}
                  onCheckedChange={() =>
                    actualizarPreferenciaNotificacionColaborador(fila.categoria, { correoActivo: !pref.correoActivo })
                  }
                  label={`Correo: ${fila.label}`}
                />
                <Select
                  value={pref.frecuencia}
                  onValueChange={(v) =>
                    actualizarPreferenciaNotificacionColaborador(fila.categoria, {
                      frecuencia: v as FrecuenciaNotificacionColaborador,
                    })
                  }
                >
                  <SelectTrigger aria-label={`Frecuencia: ${fila.label}`} className="w-full sm:w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_FRECUENCIA.map((opcion) => (
                      <SelectItem key={opcion.valor} value={opcion.valor}>
                        {opcion.etiqueta}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Preferencias</h2>
        <div className="mt-3.5 flex flex-wrap items-end gap-5">
          <div>
            <Label htmlFor="cfg-col-tema">Tema</Label>
            <Select value={tema} onValueChange={(v) => setTema(v as 'claro' | 'oscuro')}>
              <SelectTrigger id="cfg-col-tema" className="mt-1.5 w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claro">Claro</SelectItem>
                <SelectItem value="oscuro">Oscuro</SelectItem>
              </SelectContent>
            </Select>
            <p className="mt-1.5 text-[11.5px] text-ink-500">Frontend-only, se guarda en el navegador</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <p className="text-[13.5px] font-semibold text-ink-900">Modo guiado</p>
              <p className="mt-1 text-[11px] text-ink-500">Muestra ayudas contextuales en cada módulo.</p>
            </div>
            <Switch
              checked={preferencias.modoGuiado}
              onCheckedChange={() => actualizarPreferencia('modoGuiado', !preferencias.modoGuiado)}
              label="Modo guiado"
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-line bg-card">
        <h2 className="border-b border-line-soft px-4.5 py-4 text-[16px] font-semibold text-ink-900">
          Privacidad y legal
        </h2>
        <Accordion
          type="single"
          collapsible
          className="px-4.5"
          value={documentoAbierto ?? undefined}
          onValueChange={(v) => setDocumentoAbierto(v || null)}
        >
          {DOCUMENTOS_LEGALES.map((doc) => (
            <AccordionItem key={doc.id} value={doc.id}>
              <AccordionTrigger className="text-left text-sm font-medium text-ink-900">
                {doc.titulo}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-ink-700">
                <p>{doc.descripcion}</p>
                {doc.href && (
                  <a
                    href={doc.href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block font-semibold text-navy-600 hover:underline"
                  >
                    Ver documento completo →
                  </a>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      <section className="rounded-xl border border-line bg-surface p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Opciones avanzadas</h2>
        {exportarMensaje && (
          <p role="status" className="mt-3.5 rounded-lg bg-card px-3.5 py-2.5 text-[13px] font-semibold text-ink-700">
            {exportarMensaje}
          </p>
        )}
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={handleExportar}>
            Exportar mis datos
          </Button>
          <Button variant="destructive" onClick={() => setEliminarAbierto(true)}>
            Eliminar cuenta
          </Button>
        </div>
      </section>

      {/*
        Task 4 (Fase 13) crea EliminarCuentaColaboradorModal y la acción desactivarCuentaColaborador
        en PortalDataContext. Cuando ese archivo exista, reemplazar la línea de abajo por:
        <EliminarCuentaColaboradorModal abierto={eliminarAbierto} onCerrar={() => setEliminarAbierto(false)} />
        El estado `eliminarAbierto` y el botón "Eliminar cuenta" ya están cableados para esa modal.
      */}
      {eliminarAbierto && null}
    </section>
  )
}
