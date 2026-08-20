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
import { Card } from '@/portal/components/Card'
import { formatFecha } from '@/portal/obligaciones/formato'
import { suscripcionSemilla } from '@/portal/data/semilla-portal'
import { planPorCodigo } from '@/portal/plan/catalogo'
import type { FrecuenciaResumen } from '@/portal/types'
import { DOCUMENTOS_LEGALES } from './catalogo'
import { useTemaPreferencia } from './useTemaPreferencia'
import { EliminarCuentaModal } from './EliminarCuentaModal'

const OPCIONES_RESUMEN: { valor: FrecuenciaResumen; etiqueta: string }[] = [
  { valor: 'NINGUNA', etiqueta: 'Ninguna' },
  { valor: 'SEMANAL', etiqueta: 'Semanal' },
  { valor: 'MENSUAL', etiqueta: 'Mensual' },
]

type PasswordForm = { actual: string; nueva: string; confirma: string }

export function ConfiguracionScreen() {
  const navigate = useNavigate()
  const { user, toggleMfa } = useAuth()
  const { preferencias, actualizarPreferencia, planActivoCodigo } = usePortalData()
  const [tema, setTema] = useTemaPreferencia()

  const [pwd, setPwd] = useState<PasswordForm>({ actual: '', nueva: '', confirma: '' })
  const [pwdVisible, setPwdVisible] = useState(false)
  const [pwdMensaje, setPwdMensaje] = useState<string | null>(null)
  const [exportarMensaje, setExportarMensaje] = useState<string | null>(null)
  const [documentoAbierto, setDocumentoAbierto] = useState<string | null>(null)
  const [eliminarAbierto, setEliminarAbierto] = useState(false)

  if (!user) return null

  const plan = planPorCodigo(planActivoCodigo)

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
      'Exportación generada: usuario, empresas, finanzas, indicadores, obligaciones, simulaciones, solicitudes, suscripción, pagos y preferencias.',
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

      <Card as="section" padding="lg">
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
      </Card>

      <Card as="section" padding="lg">
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
            <Label htmlFor="pwd-actual">Contraseña actual</Label>
            <Input
              id="pwd-actual"
              type={pwdVisible ? 'text' : 'password'}
              value={pwd.actual}
              onChange={(e) => setPwd((p) => ({ ...p, actual: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="pwd-nueva">Contraseña nueva</Label>
            <Input
              id="pwd-nueva"
              type={pwdVisible ? 'text' : 'password'}
              value={pwd.nueva}
              onChange={(e) => setPwd((p) => ({ ...p, nueva: e.target.value }))}
              className="mt-1.5"
            />
          </div>
          <div>
            <Label htmlFor="pwd-confirma">Confirma contraseña nueva</Label>
            <Input
              id="pwd-confirma"
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
      </Card>

      <Card as="section" padding="lg">
        <h2 className="text-[16px] font-semibold text-ink-900">Notificaciones</h2>
        <div className="mt-3.5 flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
            <p className="text-[13.5px] font-semibold text-ink-900">Notificaciones internas</p>
            <Switch
              checked={preferencias.notificacionesInternas}
              onCheckedChange={() => actualizarPreferencia('notificacionesInternas', !preferencias.notificacionesInternas)}
              label="Notificaciones internas"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
            <p className="text-[13.5px] font-semibold text-ink-900">Notificaciones por correo</p>
            <Switch
              checked={preferencias.notificacionesCorreo}
              onCheckedChange={() => actualizarPreferencia('notificacionesCorreo', !preferencias.notificacionesCorreo)}
              label="Notificaciones por correo"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
            <p className="text-[13.5px] text-ink-900">Alertas tributarias</p>
            <Switch
              checked={preferencias.recordatoriosTributarios}
              onCheckedChange={() => actualizarPreferencia('recordatoriosTributarios', !preferencias.recordatoriosTributarios)}
              label="Alertas tributarias"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
            <p className="text-[13.5px] text-ink-900">Solicitudes y contacto</p>
            <Switch
              checked={preferencias.notificacionesContacto}
              onCheckedChange={() => actualizarPreferencia('notificacionesContacto', !preferencias.notificacionesContacto)}
              label="Solicitudes y contacto"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-soft pb-3.5">
            <p className="text-[13.5px] text-ink-900">Suscripción y pagos</p>
            <Switch
              checked={preferencias.notificacionesSuscripcion}
              onCheckedChange={() => actualizarPreferencia('notificacionesSuscripcion', !preferencias.notificacionesSuscripcion)}
              label="Suscripción y pagos"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] text-ink-900">Resumen de actividad</p>
            </div>
            <Select
              value={preferencias.frecuenciaResumen}
              onValueChange={(v) => actualizarPreferencia('frecuenciaResumen', v as FrecuenciaResumen)}
            >
              <SelectTrigger className="w-[160px]" aria-label="Frecuencia de resumen">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPCIONES_RESUMEN.map((o) => (
                  <SelectItem key={o.valor} value={o.valor}>
                    {o.etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Card as="section" padding="lg">
        <h2 className="text-[16px] font-semibold text-ink-900">Preferencias</h2>
        <div className="mt-3.5 flex flex-wrap items-end gap-5">
          <div>
            <Label htmlFor="cfg-tema">Tema</Label>
            <Select value={tema} onValueChange={(v) => setTema(v as 'claro' | 'oscuro')}>
              <SelectTrigger id="cfg-tema" className="mt-1.5 w-[140px]">
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
      </Card>

      <Card as="section" padding="lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-ink-900">Suscripción</h2>
          <Button variant="outline" onClick={() => navigate('/app/plan')}>
            Administrar plan
          </Button>
        </div>
        <dl className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">Plan actual</dt>
            <dd className="mt-1 text-[13.5px] text-ink-900">{plan.nombre}</dd>
          </div>
          <div>
            <dt className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              Siguiente renovación
            </dt>
            <dd className="mt-1 text-[13.5px] text-ink-900">{formatFecha(suscripcionSemilla.proximaRenovacion)}</dd>
          </div>
        </dl>
      </Card>

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

      <EliminarCuentaModal abierto={eliminarAbierto} onCerrar={() => setEliminarAbierto(false)} />
    </section>
  )
}
