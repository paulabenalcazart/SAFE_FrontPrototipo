import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useAuth, type AuthUser } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatEstadoDisponibilidad, formatModalidadEtiqueta } from '@/portal/colaborador/formato'
import { inicialesDeNombre } from '@/portal/colaborador/calculo'
import type { ColaboradorMarketplace, ModalidadAtencion } from '@/portal/types'

// Estado local del formulario. Copia editable de los campos de `usuario` y `colaborador` que Sección 13
// del prompt agrupa como "Editar perfil". Las Tareas 6-8 (especialidades, servicios, disponibilidad) NO
// forman parte de este tipo — viven en su propio estado dentro de sus propios componentes y se integran a
// este shell únicamente a través de la validación agregada en `handleGuardar`.
type FormularioPerfil = {
  nombres: string
  apellidos: string
  correo: string
  telefono: string
  pais: string
  ciudad: string
  areaEspecializacion: string
  profesion: string
  trabajoActual: string
  descripcionProfesional: string
  aniosExperiencia: number
  modalidadAtencion: ModalidadAtencion
  paisAtencion: string
  ciudadAtencion: string
  zonaHoraria: string
  tarifaReferencial: number
  cvVisible: boolean
  estadoDisponibilidad: 'DISPONIBLE' | 'NO_DISPONIBLE'
  visibleMarketplace: boolean
  fotoPerfilUrl?: string
  cvUrl?: string
  numeroLicencia?: string
  entidadEmisora?: string
  archivoCredencialUrl?: string
}

// Catálogo fijo — no existe un catálogo geográfico real en el repo, se usa una lista corta de las
// ciudades más grandes de Ecuador (aceptable para el prototipo).
const PAISES = ['Ecuador']
const CIUDADES_ECUADOR = [
  'Quito',
  'Guayaquil',
  'Cuenca',
  'Ambato',
  'Manta',
  'Loja',
  'Portoviejo',
  'Riobamba',
  'Machala',
  'Ibarra',
]

const MODALIDADES: ModalidadAtencion[] = ['VIRTUAL', 'PRESENCIAL', 'AMBAS']

const ZONAS_HORARIAS = [
  'America/Guayaquil',
  'America/Bogota',
  'America/Lima',
  'America/Mexico_City',
  'America/New_York',
]

const ESTADOS_DISPONIBILIDAD: FormularioPerfil['estadoDisponibilidad'][] = ['DISPONIBLE', 'NO_DISPONIBLE']

const MAX_FOTO_BYTES = 5 * 1024 * 1024
const MAX_ARCHIVO_BYTES = 10 * 1024 * 1024

function construirFormulario(user: AuthUser | null, colaborador: ColaboradorMarketplace): FormularioPerfil {
  return {
    nombres: user?.nombres ?? '',
    apellidos: user?.apellidos ?? '',
    correo: user?.correo ?? '',
    telefono: user?.telefono ?? '',
    pais: user?.pais ?? '',
    ciudad: user?.ciudad ?? '',
    areaEspecializacion: colaborador.areaEspecializacion,
    profesion: colaborador.profesion,
    trabajoActual: colaborador.trabajoActual ?? '',
    descripcionProfesional: colaborador.descripcionProfesional,
    aniosExperiencia: colaborador.aniosExperiencia,
    modalidadAtencion: colaborador.modalidadAtencion,
    paisAtencion: colaborador.paisAtencion,
    ciudadAtencion: colaborador.ciudadAtencion,
    zonaHoraria: colaborador.zonaHoraria,
    tarifaReferencial: colaborador.tarifaReferencial,
    cvVisible: colaborador.cvVisible,
    estadoDisponibilidad: colaborador.estadoDisponibilidad,
    visibleMarketplace: colaborador.visibleMarketplace,
    fotoPerfilUrl: colaborador.fotoPerfilUrl,
    cvUrl: colaborador.cvUrl,
    numeroLicencia: colaborador.numeroLicencia,
    entidadEmisora: colaborador.entidadEmisora,
    archivoCredencialUrl: colaborador.archivoCredencialUrl,
  }
}

function formulariosIguales(a: FormularioPerfil, b: FormularioPerfil): boolean {
  return (Object.keys(a) as (keyof FormularioPerfil)[]).every((clave) => a[clave] === b[clave])
}

function nombreArchivoDesdeUrl(url: string | undefined, fallback: string): string {
  if (!url) return fallback
  if (url.startsWith('blob:')) return fallback
  const partes = url.split('/')
  return partes[partes.length - 1] || fallback
}

// Validación de "Información personal" (13.2). Devuelve un objeto de errores por campo; vacío = válido.
function validarInformacionPersonal(f: FormularioPerfil): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!f.nombres.trim()) errores.nombres = 'Ingresa los nombres.'
  if (!f.apellidos.trim()) errores.apellidos = 'Ingresa los apellidos.'
  if (!/^\S+@\S+\.\S+$/.test(f.correo)) errores.correo = 'Ingresa un correo electrónico válido.'
  if (f.telefono.length > 30) errores.telefono = 'El teléfono no puede superar los 30 caracteres.'
  return errores
}

// Validación de "Información profesional" (13.3).
function validarInformacionProfesional(f: FormularioPerfil): Record<string, string> {
  const errores: Record<string, string> = {}
  if (!f.areaEspecializacion.trim()) errores.areaEspecializacion = 'Ingresa el área de especialización.'
  if (!f.profesion.trim()) errores.profesion = 'Ingresa la profesión.'
  if (!f.descripcionProfesional.trim()) errores.descripcionProfesional = 'Ingresa una descripción profesional.'
  if (!Number.isFinite(f.aniosExperiencia) || f.aniosExperiencia < 0) {
    errores.aniosExperiencia = 'Ingresa un número de años válido.'
  }
  if (!f.paisAtencion.trim()) errores.paisAtencion = 'Selecciona el país de atención.'
  if (!f.ciudadAtencion.trim()) errores.ciudadAtencion = 'Selecciona la ciudad de atención.'
  if (!f.zonaHoraria.trim()) errores.zonaHoraria = 'Selecciona una zona horaria.'
  if (!Number.isFinite(f.tarifaReferencial) || f.tarifaReferencial < 0) {
    errores.tarifaReferencial = 'Ingresa una tarifa referencial válida.'
  }
  return errores
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-destructive">
      {message}
    </p>
  )
}

export function EditarPerfilScreen() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const { colaboradorPerfil, actualizarColaboradorPerfil } = usePortalData()

  const [formularioInicial] = useState<FormularioPerfil>(() => construirFormulario(user, colaboradorPerfil))
  const [formulario, setFormulario] = useState<FormularioPerfil>(() => construirFormulario(user, colaboradorPerfil))
  const [errores, setErrores] = useState<Record<string, string>>({})

  const [errorFoto, setErrorFoto] = useState<string | undefined>(undefined)
  const [errorCv, setErrorCv] = useState<string | undefined>(undefined)
  const [errorCredencial, setErrorCredencial] = useState<string | undefined>(undefined)

  const apellidoParaCv = (user?.apellidos ?? colaboradorPerfil.apellidos ?? 'colaborador').split(' ')[0]
  const [nombreArchivoCv, setNombreArchivoCv] = useState<string>(() =>
    nombreArchivoDesdeUrl(colaboradorPerfil.cvUrl, `CV-${apellidoParaCv}.pdf`),
  )
  const [nombreArchivoCredencial, setNombreArchivoCredencial] = useState<string | undefined>(() =>
    colaboradorPerfil.archivoCredencialUrl
      ? nombreArchivoDesdeUrl(colaboradorPerfil.archivoCredencialUrl, 'credencial.pdf')
      : undefined,
  )

  const fotoInputRef = useRef<HTMLInputElement>(null)
  const cvInputRef = useRef<HTMLInputElement>(null)
  const credencialInputRef = useRef<HTMLInputElement>(null)

  const hayCambiosSinGuardar = useMemo(
    () => !formulariosIguales(formulario, formularioInicial),
    [formulario, formularioInicial],
  )

  if (!user) return null

  const actualizar = <K extends keyof FormularioPerfil>(clave: K, valor: FormularioPerfil[K]) => {
    setFormulario((f) => ({ ...f, [clave]: valor }))
  }

  const handleCancelar = () => {
    if (hayCambiosSinGuardar) {
      const confirmado = window.confirm('Tienes cambios sin guardar. ¿Deseas salir sin guardarlos?')
      if (!confirmado) return
    }
    navigate('/app/perfil')
  }

  const handleFotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_FOTO_BYTES) {
      setErrorFoto('La imagen no puede superar los 5 MB.')
      return
    }
    setErrorFoto(undefined)
    actualizar('fotoPerfilUrl', URL.createObjectURL(file))
  }

  const handleCvChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_ARCHIVO_BYTES) {
      setErrorCv('El archivo no puede superar los 10 MB.')
      return
    }
    setErrorCv(undefined)
    setNombreArchivoCv(file.name)
    actualizar('cvUrl', URL.createObjectURL(file))
  }

  const handleCredencialChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (file.size > MAX_ARCHIVO_BYTES) {
      setErrorCredencial('El archivo no puede superar los 10 MB.')
      return
    }
    setErrorCredencial(undefined)
    setNombreArchivoCredencial(file.name)
    actualizar('archivoCredencialUrl', URL.createObjectURL(file))
  }

  const handleQuitarCredencial = () => {
    setErrorCredencial(undefined)
    setNombreArchivoCredencial(undefined)
    actualizar('archivoCredencialUrl', undefined)
  }

  const handleGuardar = () => {
    const erroresPersonales = validarInformacionPersonal(formulario)
    const erroresProfesionales = validarInformacionProfesional(formulario)
    // Las Tareas 6-8 (especialidades, servicios, disponibilidad) agregan aquí sus propios objetos de
    // errores mediante spread, ej.: `...validarEspecialidades(...)`.
    const todosLosErrores: Record<string, string> = { ...erroresPersonales, ...erroresProfesionales }

    setErrores(todosLosErrores)
    if (Object.keys(todosLosErrores).length > 0) return

    updateUser({
      nombres: formulario.nombres,
      apellidos: formulario.apellidos,
      correo: formulario.correo,
      telefono: formulario.telefono,
      pais: formulario.pais,
      ciudad: formulario.ciudad,
    })
    actualizarColaboradorPerfil({
      nombres: formulario.nombres,
      apellidos: formulario.apellidos,
      areaEspecializacion: formulario.areaEspecializacion,
      profesion: formulario.profesion,
      trabajoActual: formulario.trabajoActual || undefined,
      descripcionProfesional: formulario.descripcionProfesional,
      aniosExperiencia: formulario.aniosExperiencia,
      modalidadAtencion: formulario.modalidadAtencion,
      paisAtencion: formulario.paisAtencion,
      ciudadAtencion: formulario.ciudadAtencion,
      zonaHoraria: formulario.zonaHoraria,
      tarifaReferencial: formulario.tarifaReferencial,
      cvVisible: formulario.cvVisible,
      estadoDisponibilidad: formulario.estadoDisponibilidad,
      visibleMarketplace: formulario.visibleMarketplace,
      fotoPerfilUrl: formulario.fotoPerfilUrl,
      cvUrl: formulario.cvUrl,
      numeroLicencia: formulario.numeroLicencia || undefined,
      entidadEmisora: formulario.entidadEmisora || undefined,
      archivoCredencialUrl: formulario.archivoCredencialUrl,
    })
    navigate('/app/perfil')
  }

  return (
    <section className="flex flex-col gap-4.5 pb-4">
      <div>
        <button
          type="button"
          onClick={handleCancelar}
          className="flex min-h-8 items-center gap-1.5 text-[13px] font-semibold text-navy-500 hover:text-navy-700"
        >
          <ArrowLeft className="h-[15px] w-[15px]" aria-hidden="true" />
          Perfil
        </button>
        <h1 className="mt-1.5 text-[28px] font-bold leading-tight">Editar perfil profesional</h1>
      </div>

      {hayCambiosSinGuardar && (
        <p
          role="status"
          className="rounded-lg bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-amber-deep"
        >
          Tienes cambios sin guardar.
        </p>
      )}

      {/* 13.1 Foto */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Foto de perfil</h2>
        <div className="mt-3.5 flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-navy-100 font-display text-[22px] font-bold text-navy-700"
          >
            {formulario.fotoPerfilUrl ? (
              <img src={formulario.fotoPerfilUrl} alt="" className="h-24 w-24 rounded-full object-cover" />
            ) : (
              inicialesDeNombre(`${formulario.nombres} ${formulario.apellidos}`)
            )}
          </span>
          <div>
            <input
              ref={fotoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFotoChange}
            />
            <Button type="button" variant="outline" onClick={() => fotoInputRef.current?.click()}>
              {formulario.fotoPerfilUrl ? 'Cambiar foto' : 'Subir foto'}
            </Button>
            <p className="mt-1.5 text-[12px] text-ink-500">JPG, PNG o WEBP. Máx. 5 MB.</p>
            <FieldError message={errorFoto} />
          </div>
        </div>
      </section>

      {/* 13.2 Información personal */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Información personal</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-3">
          <div>
            <Label htmlFor="perfil-nombres">Nombres</Label>
            <Input
              id="perfil-nombres"
              value={formulario.nombres}
              onChange={(e) => actualizar('nombres', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.nombres)}
            />
            <FieldError message={errores.nombres} />
          </div>
          <div>
            <Label htmlFor="perfil-apellidos">Apellidos</Label>
            <Input
              id="perfil-apellidos"
              value={formulario.apellidos}
              onChange={(e) => actualizar('apellidos', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.apellidos)}
            />
            <FieldError message={errores.apellidos} />
          </div>
          <div>
            <Label htmlFor="perfil-correo">Correo electrónico</Label>
            <Input
              id="perfil-correo"
              type="email"
              value={formulario.correo}
              onChange={(e) => actualizar('correo', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.correo)}
            />
            <FieldError message={errores.correo} />
          </div>
          <div>
            <Label htmlFor="perfil-telefono">Teléfono</Label>
            <Input
              id="perfil-telefono"
              value={formulario.telefono}
              maxLength={30}
              onChange={(e) => actualizar('telefono', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.telefono)}
            />
            <FieldError message={errores.telefono} />
          </div>
          <div>
            <Label htmlFor="perfil-pais">País</Label>
            <Select value={formulario.pais} onValueChange={(v) => actualizar('pais', v)}>
              <SelectTrigger id="perfil-pais" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAISES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="perfil-ciudad">Ciudad</Label>
            <Select value={formulario.ciudad} onValueChange={(v) => actualizar('ciudad', v)}>
              <SelectTrigger id="perfil-ciudad" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CIUDADES_ECUADOR.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* 13.3 Información profesional */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Información profesional</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-3">
          <div>
            <Label htmlFor="perfil-area">Área de especialización</Label>
            <Input
              id="perfil-area"
              value={formulario.areaEspecializacion}
              onChange={(e) => actualizar('areaEspecializacion', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.areaEspecializacion)}
            />
            <FieldError message={errores.areaEspecializacion} />
          </div>
          <div>
            <Label htmlFor="perfil-profesion">Profesión</Label>
            <Input
              id="perfil-profesion"
              value={formulario.profesion}
              onChange={(e) => actualizar('profesion', e.target.value)}
              className="mt-1.5"
              aria-invalid={Boolean(errores.profesion)}
            />
            <FieldError message={errores.profesion} />
          </div>
          <div>
            <Label htmlFor="perfil-trabajo-actual">Trabajo actual</Label>
            <Input
              id="perfil-trabajo-actual"
              value={formulario.trabajoActual}
              onChange={(e) => actualizar('trabajoActual', e.target.value)}
              className="mt-1.5"
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="perfil-anios">Años de experiencia</Label>
            <Input
              id="perfil-anios"
              type="number"
              min={0}
              value={formulario.aniosExperiencia}
              onChange={(e) => {
                const valor = e.target.value === '' ? 0 : Number(e.target.value)
                actualizar('aniosExperiencia', Number.isFinite(valor) ? valor : 0)
              }}
              className="mt-1.5"
              aria-invalid={Boolean(errores.aniosExperiencia)}
            />
            <FieldError message={errores.aniosExperiencia} />
          </div>
          <div>
            <Label htmlFor="perfil-modalidad">Modalidad de atención</Label>
            <Select
              value={formulario.modalidadAtencion}
              onValueChange={(v) => actualizar('modalidadAtencion', v as ModalidadAtencion)}
            >
              <SelectTrigger id="perfil-modalidad" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODALIDADES.map((m) => (
                  <SelectItem key={m} value={m}>
                    {formatModalidadEtiqueta(m)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="perfil-tarifa">Tarifa referencial (USD/hora)</Label>
            <Input
              id="perfil-tarifa"
              type="number"
              min={0}
              step="0.01"
              value={formulario.tarifaReferencial}
              onChange={(e) => {
                const valor = e.target.value === '' ? 0 : Number(e.target.value)
                actualizar('tarifaReferencial', Number.isFinite(valor) ? valor : 0)
              }}
              className="mt-1.5"
              aria-invalid={Boolean(errores.tarifaReferencial)}
            />
            <FieldError message={errores.tarifaReferencial} />
          </div>
          <div>
            <Label htmlFor="perfil-pais-atencion">País de atención</Label>
            <Select value={formulario.paisAtencion} onValueChange={(v) => actualizar('paisAtencion', v)}>
              <SelectTrigger id="perfil-pais-atencion" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAISES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errores.paisAtencion} />
          </div>
          <div>
            <Label htmlFor="perfil-ciudad-atencion">Ciudad de atención</Label>
            <Select value={formulario.ciudadAtencion} onValueChange={(v) => actualizar('ciudadAtencion', v)}>
              <SelectTrigger id="perfil-ciudad-atencion" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CIUDADES_ECUADOR.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errores.ciudadAtencion} />
          </div>
          <div>
            <Label htmlFor="perfil-zona-horaria">Zona horaria</Label>
            <Select value={formulario.zonaHoraria} onValueChange={(v) => actualizar('zonaHoraria', v)}>
              <SelectTrigger id="perfil-zona-horaria" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONAS_HORARIAS.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errores.zonaHoraria} />
          </div>
          <div>
            <Label htmlFor="perfil-estado-disponibilidad">Estado de disponibilidad</Label>
            <Select
              value={formulario.estadoDisponibilidad}
              onValueChange={(v) =>
                actualizar('estadoDisponibilidad', v as FormularioPerfil['estadoDisponibilidad'])
              }
            >
              <SelectTrigger id="perfil-estado-disponibilidad" className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS_DISPONIBILIDAD.map((estado) => (
                  <SelectItem key={estado} value={estado}>
                    {formatEstadoDisponibilidad(estado)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-4.5">
          <Label htmlFor="perfil-descripcion">Descripción profesional</Label>
          <Textarea
            id="perfil-descripcion"
            value={formulario.descripcionProfesional}
            onChange={(e) => actualizar('descripcionProfesional', e.target.value)}
            className="mt-1.5"
            rows={4}
            aria-invalid={Boolean(errores.descripcionProfesional)}
          />
          <FieldError message={errores.descripcionProfesional} />
        </div>

        <div className="mt-4.5 flex flex-col gap-3.5 border-t border-line-soft pt-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-semibold text-ink-900">Hoja de vida visible públicamente</p>
              <p className="text-[12px] text-ink-500">
                Permite que las empresas descarguen tu CV desde el marketplace.
              </p>
            </div>
            <Switch
              checked={formulario.cvVisible}
              onCheckedChange={() => actualizar('cvVisible', !formulario.cvVisible)}
              label="Hoja de vida visible públicamente"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[13.5px] font-semibold text-ink-900">Visible en el marketplace</p>
              <p className="text-[12px] text-ink-500">
                Controla si tu perfil aparece en las búsquedas del marketplace.
              </p>
            </div>
            <Switch
              checked={formulario.visibleMarketplace}
              onCheckedChange={() => actualizar('visibleMarketplace', !formulario.visibleMarketplace)}
              label="Visible en el marketplace"
            />
          </div>
        </div>
      </section>

      {/* 13.4 CV */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Hoja de vida (CV)</h2>
        <div className="mt-3.5 flex flex-wrap items-center gap-3 rounded-lg border border-line/70 bg-surface p-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-ink-900">{nombreArchivoCv}</p>
            <p className="text-[12px] text-ink-500">PDF</p>
          </div>
          <input
            ref={cvInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleCvChange}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => cvInputRef.current?.click()}>
            Reemplazar
          </Button>
        </div>
        <p className="mt-1.5 text-[12px] text-ink-500">Solo PDF. Máx. 10 MB. No puede quedar vacío.</p>
        <FieldError message={errorCv} />
      </section>

      {/* 13.5 Credenciales */}
      <section className="rounded-xl border border-line bg-card p-4.5">
        <h2 className="text-[16px] font-semibold text-ink-900">Credenciales</h2>
        <div className="mt-3.5 grid grid-cols-1 gap-4.5 sm:grid-cols-2">
          <div>
            <Label htmlFor="perfil-num-licencia">Número de licencia</Label>
            <Input
              id="perfil-num-licencia"
              value={formulario.numeroLicencia ?? ''}
              onChange={(e) => actualizar('numeroLicencia', e.target.value || undefined)}
              className="mt-1.5"
              placeholder="Opcional"
            />
          </div>
          <div>
            <Label htmlFor="perfil-entidad-emisora">Entidad emisora</Label>
            <Input
              id="perfil-entidad-emisora"
              value={formulario.entidadEmisora ?? ''}
              onChange={(e) => actualizar('entidadEmisora', e.target.value || undefined)}
              className="mt-1.5"
              placeholder="Opcional"
            />
          </div>
        </div>

        <div className="mt-4.5">
          <span className="text-sm font-medium text-ink-900">Archivo de credencial</span>
          <input
            ref={credencialInputRef}
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="hidden"
            onChange={handleCredencialChange}
          />
          {formulario.archivoCredencialUrl ? (
            <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border border-line/70 bg-surface p-3.5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-navy-100 text-navy-700">
                <FileText className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold text-ink-900">{nombreArchivoCredencial}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => credencialInputRef.current?.click()}
              >
                Reemplazar
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleQuitarCredencial}>
                Quitar
              </Button>
            </div>
          ) : (
            <div className="mt-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => credencialInputRef.current?.click()}
              >
                Cargar archivo
              </Button>
            </div>
          )}
          <p className="mt-1.5 text-[12px] text-ink-500">PDF, JPG o PNG. Máx. 10 MB.</p>
          <FieldError message={errorCredencial} />
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-wrap justify-end gap-2.5 border-t border-line bg-background py-3.5">
        <Button type="button" variant="outline" onClick={handleCancelar}>
          Cancelar
        </Button>
        <Button type="button" onClick={handleGuardar}>
          Guardar cambios
        </Button>
      </div>
    </section>
  )
}
