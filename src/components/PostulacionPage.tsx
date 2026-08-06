import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, FileText, Mail, ShieldCheck, Upload, X } from 'lucide-react'
import { Stepper } from '@/components/Stepper'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

const pasos = ['Datos personales', 'Perfil profesional', 'Atención y disponibilidad', 'Confirmación']
const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function FormField({
  label,
  id,
  type = 'text',
  placeholder,
  className,
}: {
  label: string
  id: string
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} placeholder={placeholder} className="mt-1.5" />
    </div>
  )
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function CvUpload() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function pickFile(f: File | null | undefined) {
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setPreviewUrl(URL.createObjectURL(f))
    }
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(null)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <Label htmlFor="cv">Hoja de vida (PDF)</Label>
      <input
        ref={inputRef}
        id="cv"
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => pickFile(e.target.files?.[0])}
      />

      {!file ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            pickFile(e.dataTransfer.files?.[0])
          }}
          className={cn(
            'mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors duration-200',
            dragOver ? 'border-navy-500 bg-navy-100/60' : 'border-line bg-surface hover:border-navy-400 hover:bg-navy-100/30',
          )}
        >
          <span className="grid h-10 w-10 place-items-center rounded-full bg-navy-100 text-navy-700">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-ink-900">Arrastra tu hoja de vida o haz clic para elegirla</span>
          <span className="text-xs text-ink-500">Solo PDF</span>
        </button>
      ) : (
        <div className="animate-safe-pop-in mt-1.5 overflow-hidden rounded-lg border border-line">
          <div className="flex items-center gap-3 bg-surface p-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
              <FileText className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-900">{file.name}</p>
              <p className="text-xs text-ink-500">{formatFileSize(file.size)} · PDF</p>
            </div>
            <button
              type="button"
              aria-label="Quitar archivo"
              onClick={clearFile}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-ink-500 transition-colors hover:bg-line/70 hover:text-ink-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {previewUrl && (
            <iframe
              src={`${previewUrl}#toolbar=0`}
              title={`Vista previa de ${file.name}`}
              className="h-72 w-full border-t border-line bg-white sm:h-80"
            />
          )}
        </div>
      )}
    </div>
  )
}

function PasoDatosPersonales() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <FormField label="Nombres" id="nombres" />
      <FormField label="Apellidos" id="apellidos" />
      <FormField label="Correo electrónico" id="correo" type="email" />
      <FormField label="Teléfono" id="telefono" />
      <div>
        <Label htmlFor="pais">País</Label>
        <Select defaultValue="ecuador">
          <SelectTrigger id="pais" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ecuador">Ecuador</SelectItem>
            <SelectItem value="colombia">Colombia</SelectItem>
            <SelectItem value="peru">Perú</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FormField label="Ciudad" id="ciudad" placeholder="Ej. Guayaquil" />
    </div>
  )
}

function PasoPerfilProfesional() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="area">Área de especialización</Label>
        <Select defaultValue="contable">
          <SelectTrigger id="area" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contable">Contabilidad y tributación</SelectItem>
            <SelectItem value="legal">Derecho societario y laboral</SelectItem>
            <SelectItem value="financiero">Planificación financiera</SelectItem>
            <SelectItem value="auditoria">Auditoría y control</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FormField label="Especialidad principal" id="especialidad" placeholder="Ej. Tributación internacional" />
      <FormField
        label="Trabajo actual"
        id="trabajo"
        className="sm:col-span-2"
        placeholder="Ej. Socia en Cedeño & Asociados"
      />
      <div className="sm:col-span-2">
        <CvUpload />
      </div>
    </div>
  )
}

function PasoAtencion() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor="como-llego">¿Cómo llegaste a SAFE?</Label>
        <Select defaultValue="redes">
          <SelectTrigger id="como-llego" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="redes">Redes sociales</SelectItem>
            <SelectItem value="referido">Referido por un colega</SelectItem>
            <SelectItem value="empresa">A través de una empresa cliente</SelectItem>
            <SelectItem value="otro">Otro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FormField label="Número de licencia / matrícula" id="licencia" />
      <FormField label="Entidad emisora" id="entidad" />
      <div className="sm:col-span-2">
        <Label htmlFor="descripcion">Descripción profesional</Label>
        <Textarea
          id="descripcion"
          className="mt-1.5"
          rows={3}
          placeholder="Cuéntanos sobre tu experiencia y enfoque de trabajo"
        />
      </div>
      <div>
        <Label htmlFor="modalidad">Modalidad de atención</Label>
        <Select defaultValue="ambas">
          <SelectTrigger id="modalidad" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="virtual">Virtual</SelectItem>
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="ambas">Virtual y presencial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FormField label="Tarifa referencial por hora (USD)" id="tarifa" placeholder="Ej. 45" />
      <div className="sm:col-span-2">
        <Label>Días disponibles</Label>
        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-3">
          {dias.map((d) => (
            <div key={d} className="flex items-center gap-2">
              <Checkbox id={`dia-${d}`} defaultChecked={!['Sábado', 'Domingo'].includes(d)} />
              <Label htmlFor={`dia-${d}`} className="text-sm font-normal text-ink-700">
                {d}
              </Label>
            </div>
          ))}
        </div>
      </div>
      <FormField label="Horario desde" id="horario-desde" placeholder="09:00" />
      <FormField label="Horario hasta" id="horario-hasta" placeholder="17:00" />
    </div>
  )
}

function PasoConfirmacion({
  onEnviar,
  onIrPrivacidad,
}: {
  onEnviar: () => void
  onIrPrivacidad?: () => void
}) {
  const [acepto, setAcepto] = useState(false)

  return (
    <div className="space-y-6 text-center">
      <span className="animate-safe-pop-in mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-soft text-emerald-deep">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h2 className="section-title">Tu postulación está lista para enviarse</h2>
      <p className="mx-auto max-w-xl text-sm text-ink-700">
        Antes de enviar, revisa que la información de los pasos anteriores sea correcta. Una vez enviada, el
        Administrador de SAFE revisará y validará tu perfil.
      </p>

      <div className="mx-auto grid max-w-xl gap-3 text-left sm:grid-cols-2">
        <div className="surface-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-100 text-navy-700">
            <ShieldCheck className="h-4.5 w-4.5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-900">1. Revisión</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
            El equipo de Administración de SAFE revisa tus datos, licencia y hoja de vida.
          </p>
        </div>
        <div className="surface-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-float)]">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-navy-100 text-navy-700">
            <Mail className="h-4.5 w-4.5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink-900">2. Notificación</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-700">
            Si tu perfil es validado, recibirás tus credenciales de acceso por correo electrónico. Si no cumple los
            requisitos, te enviaremos un correo con el motivo del rechazo.
          </p>
        </div>
      </div>

      <p className="mx-auto max-w-xl rounded-lg bg-amber-soft px-4 py-3 text-[13px] leading-relaxed text-amber-deep">
        Verifica cuidadosamente tu información antes de enviar tu postulación: una vez enviada no podrás editarla
        hasta recibir una respuesta.
      </p>

      <div className="mx-auto flex max-w-xl items-start gap-2.5 text-left">
        <Checkbox
          id="postulacion-acepto"
          checked={acepto}
          onCheckedChange={(v) => setAcepto(v === true)}
          className="mt-0.5"
        />
        <Label
          htmlFor="postulacion-acepto"
          className="text-sm font-normal leading-relaxed text-ink-700"
        >
          He leído y acepto la{' '}
          <button
            type="button"
            onClick={onIrPrivacidad}
            className="font-semibold text-navy-500 hover:text-navy-600 hover:underline"
          >
            Política de Privacidad
          </button>{' '}
          y autorizo el tratamiento de mis datos personales y de mi hoja de vida para fines de
          validación profesional.
        </Label>
      </div>

      <Button size="lg" className="hover:scale-[1.01]" disabled={!acepto} onClick={onEnviar}>
        Enviar postulación
      </Button>
    </div>
  )
}

function PasoEnviado({ onVolver }: { onVolver: () => void }) {
  return (
    <div className="animate-safe-fade-up space-y-5 py-6 text-center">
      <span className="animate-safe-pop-in mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-soft text-emerald-deep">
        <CheckCircle2 className="h-10 w-10" />
      </span>
      <h2 className="font-display text-2xl font-semibold text-ink-900">¡Postulación enviada!</h2>
      <p className="mx-auto max-w-md text-sm leading-relaxed text-ink-700">
        Recibimos tu información. El equipo de SAFE la revisará y te escribirá al correo que registraste con el
        resultado.
      </p>
      <Button size="lg" variant="outline" onClick={onVolver}>
        Volver al inicio
      </Button>
    </div>
  )
}

export function PostulacionPage({
  onVolver,
  onIrPrivacidad,
}: {
  onVolver?: () => void
  onIrPrivacidad?: () => void
}) {
  const [paso, setPaso] = useState(0)
  const [enviado, setEnviado] = useState(false)

  return (
    <section className="relative w-full overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[620px] bg-[radial-gradient(100%_80%_at_50%_-10%,var(--color-navy-100)_0%,rgba(227,237,247,0.5)_35%,rgba(227,237,247,0)_75%)]" />
      <div className="animate-safe-drift-a pointer-events-none absolute -left-24 top-10 hidden h-[300px] w-[300px] rounded-full bg-navy-500/[0.06] blur-3xl sm:block" />
      <div className="animate-safe-drift-b pointer-events-none absolute -right-20 top-24 hidden h-[260px] w-[260px] rounded-full bg-emerald-brand/[0.06] blur-3xl sm:block" />

      <div className="relative mx-auto max-w-3xl px-6 py-16 sm:px-8 lg:py-20">
        {!enviado ? (
          <>
            <h1 className="page-title">Postúlate como profesional colaborador</h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-700">
              Completa el siguiente formulario para unirte a la red de profesionales de SAFE. Tu postulación será
              revisada por el equipo de Administración.
            </p>

            <div className="surface-card mt-8 p-6 sm:p-8">
              <Stepper steps={pasos} current={paso} />

              <div key={paso} className="animate-safe-fade-up mt-8">
                {paso === 0 && <PasoDatosPersonales />}
                {paso === 1 && <PasoPerfilProfesional />}
                {paso === 2 && <PasoAtencion />}
                {paso === 3 && (
                  <PasoConfirmacion onEnviar={() => setEnviado(true)} onIrPrivacidad={onIrPrivacidad} />
                )}
              </div>

              {paso < pasos.length - 1 && (
                <div className="mt-8 flex items-center justify-between border-t border-line pt-5">
                  <Button
                    variant="outline"
                    onClick={() => setPaso((p) => Math.max(0, p - 1))}
                    disabled={paso === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    className="hover:scale-[1.01]"
                    onClick={() => setPaso((p) => Math.min(pasos.length - 1, p + 1))}
                  >
                    {paso === pasos.length - 2 ? 'Revisar y enviar' : 'Siguiente'}
                  </Button>
                </div>
              )}
              {paso === pasos.length - 1 && (
                <div className="mt-6 flex items-center justify-start border-t border-line pt-5">
                  <Button variant="outline" onClick={() => setPaso((p) => Math.max(0, p - 1))}>
                    Anterior
                  </Button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="surface-card p-6 sm:p-8">
            <PasoEnviado onVolver={() => onVolver?.()} />
          </div>
        )}
      </div>
    </section>
  )
}
