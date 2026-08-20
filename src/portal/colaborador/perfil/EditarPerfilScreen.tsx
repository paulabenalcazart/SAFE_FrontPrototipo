import { useEffect, useMemo, useRef, useState, type ChangeEvent, type RefObject } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, FileText } from 'lucide-react'
import { useAuth, type AuthUser } from '@/auth/AuthContext'
import { usePortalData } from '@/portal/PortalDataContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/portal/components/Card'
import { formatEstadoDisponibilidad, formatModalidadEtiqueta } from '@/portal/colaborador/formato'
import { inicialesDeNombre, validarEspecialidades } from '@/portal/colaborador/calculo'
import { EspecialidadesEditor } from '@/portal/colaborador/perfil/EspecialidadesEditor'
import { ServiciosEditor } from '@/portal/colaborador/perfil/ServiciosEditor'
import { DisponibilidadEditor } from '@/portal/colaborador/perfil/DisponibilidadEditor'
import type {
  ColaboradorMarketplace,
  EspecialidadColaboradorRelacion,
  HorarioDisponibilidad,
  ModalidadAtencion,
} from '@/portal/types'

// Estado local del formulario. Copia editable de los campos de `usuario` y `colaborador` que Sección 13
// del prompt agrupa como "Editar perfil". Las Tareas 6-8 (especialidades, servicios, disponibilidad) NO
// forman parte de este tipo — viven en su propio estado (o, en el caso de servicios, sin estado local
// alguno — sus mutaciones son inmediatas contra `PortalDataContext`, Tarea 7) dentro de sus propios
// componentes. Especialidades se integra a este shell a través de la validación agregada en
// `handleGuardar`; servicios no necesita esa compuerta porque cada acción del editor ya persiste al
// instante.
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

function especialidadesIguales(a: EspecialidadColaboradorRelacion[], b: EspecialidadColaboradorRelacion[]): boolean {
  if (a.length !== b.length) return false
  return a.every((relacion, indice) => {
    const otra = b[indice]
    return (
      relacion.especialidadId === otra.especialidadId &&
      relacion.esPrincipal === otra.esPrincipal &&
      relacion.aniosExperiencia === otra.aniosExperiencia &&
      relacion.activo === otra.activo
    )
  })
}

// A diferencia de `especialidadesIguales` (comparación por índice), los horarios pueden reordenarse al
// agregar/quitar bloques (Tarea 8: `DisponibilidadEditor` hace `filter`/`[...value, nuevo]`), así que la
// comparación se hace por `id` en vez de por posición.
function horariosIguales(a: HorarioDisponibilidad[], b: HorarioDisponibilidad[]): boolean {
  if (a.length !== b.length) return false
  const porId = new Map(b.map((h) => [h.id, h]))
  return a.every((h) => {
    const otro = porId.get(h.id)
    if (!otro) return false
    return (
      h.diaSemana === otro.diaSemana &&
      h.horaInicio === otro.horaInicio &&
      h.horaFin === otro.horaFin &&
      h.modalidad === otro.modalidad &&
      h.activo === otro.activo
    )
  })
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
  const [searchParams] = useSearchParams()
  const { user, updateUser } = useAuth()
  const {
    colaboradorPerfil,
    actualizarColaboradorPerfil,
    actualizarEspecialidadesColaborador,
    horariosColaborador,
    guardarHorariosColaborador,
  } = usePortalData()

  const [formularioInicial] = useState<FormularioPerfil>(() => construirFormulario(user, colaboradorPerfil))
  const [formulario, setFormulario] = useState<FormularioPerfil>(() => construirFormulario(user, colaboradorPerfil))
  const [errores, setErrores] = useState<Record<string, string>>({})

  // Tarea 6: especialidades. Vive en su propio estado (fuera de `FormularioPerfil`) y se integra al guardado
  // general vía `handleGuardar` — ver comentario ahí.
  const [especialidadesIniciales] = useState<EspecialidadColaboradorRelacion[]>(() => colaboradorPerfil.especialidades)
  const [especialidades, setEspecialidades] = useState<EspecialidadColaboradorRelacion[]>(
    () => colaboradorPerfil.especialidades,
  )

  // Tarea 8: disponibilidad. Mismo patrón de estado propio + integración a `handleGuardar` que
  // especialidades. `disponibilidadValida` es la compuerta booleana que reporta `DisponibilidadEditor` vía
  // `onValidityChange` — a diferencia de especialidades, la validez depende de `formulario.modalidadAtencion`
  // además del propio arreglo, así que no puede derivarse con una función pura desde aquí.
  const [horariosIniciales] = useState<HorarioDisponibilidad[]>(() => horariosColaborador)
  const [horarios, setHorarios] = useState<HorarioDisponibilidad[]>(() => horariosColaborador)
  const [disponibilidadValida, setDisponibilidadValida] = useState(true)
  const disponibilidadHeadingRef = useRef<HTMLHeadingElement>(null)

  // Encabezados de cada sección "bloqueante" del guardado (Tarea 9, hallazgo de feedback de guardado).
  // `handleGuardar` usa estos refs para hacer scroll + foco a la primera sección que impide guardar, mismo
  // patrón que el deep-link `?seccion=disponibilidad` de más abajo.
  const informacionPersonalHeadingRef = useRef<HTMLHeadingElement>(null)
  const informacionProfesionalHeadingRef = useRef<HTMLHeadingElement>(null)
  const especialidadesHeadingRef = useRef<HTMLHeadingElement>(null)

  // Nombres de las secciones que están bloqueando el guardado en el intento más reciente (vacío si no hubo
  // intento bloqueado, o si el guardado tuvo éxito). Alimenta el banner de resumen junto al footer sticky.
  const [seccionesBloqueando, setSeccionesBloqueando] = useState<string[]>([])

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
    () =>
      !formulariosIguales(formulario, formularioInicial) ||
      !especialidadesIguales(especialidades, especialidadesIniciales) ||
      !horariosIguales(horarios, horariosIniciales),
    [formulario, formularioInicial, especialidades, especialidadesIniciales, horarios, horariosIniciales],
  )

  // Tarea 8: soporte de deep-link con foco (Sección 11.2/13.8). El botón "Administrar disponibilidad" del
  // Dashboard navega aquí con `?seccion=disponibilidad` — al montar (o si cambia el query param), hace
  // scroll + foco sobre el `<h2>` de la sección Disponibilidad, mismo patrón de `ref` +
  // `requestAnimationFrame` que `PerfilProfesionalScreen.tsx` usa para su título.
  useEffect(() => {
    if (searchParams.get('seccion') !== 'disponibilidad') return
    const frame = window.requestAnimationFrame(() => {
      disponibilidadHeadingRef.current?.scrollIntoView({ behavior: 'smooth' })
      disponibilidadHeadingRef.current?.focus()
    })
    return () => window.cancelAnimationFrame(frame)
  }, [searchParams])

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
    // Tarea 7 (servicios) no agrega nada aquí — sus mutaciones son inmediatas contra `PortalDataContext`
    // (ver comentario en el tipo `FormularioPerfil`). Tarea 6 (especialidades) usa `validarEspecialidades`,
    // que devuelve un mensaje único en vez de un Record — `EspecialidadesEditor` ya muestra ese mensaje en
    // vivo bajo su propia sección, así que aquí solo se usa como compuerta booleana para bloquear el
    // guardado, sin duplicar el mensaje en `errores`. Tarea 8 (disponibilidad) sigue el mismo patrón de
    // compuerta booleana, pero vía `disponibilidadValida` (reportado por `DisponibilidadEditor` a través de
    // `onValidityChange` — ver comentario junto a su declaración) en vez de una función pura, porque su
    // validez depende también de `formulario.modalidadAtencion`.
    const errorEspecialidades = validarEspecialidades(especialidades)
    const todosLosErrores: Record<string, string> = { ...erroresPersonales, ...erroresProfesionales }

    setErrores(todosLosErrores)

    // Resumen de guardado bloqueado (hallazgo de la revisión final): además de las compuertas booleanas de
    // arriba, se arma la lista de nombres de sección bloqueante (en el mismo orden en que aparecen en la
    // página) para mostrarla en un banner junto al footer sticky, y se hace scroll + foco al encabezado de
    // la primera sección bloqueante — igual que el deep-link `?seccion=disponibilidad` de más abajo.
    const bloqueos: { nombre: string; ref: RefObject<HTMLHeadingElement> }[] = []
    if (Object.keys(erroresPersonales).length > 0) {
      bloqueos.push({ nombre: 'Información personal', ref: informacionPersonalHeadingRef })
    }
    if (Object.keys(erroresProfesionales).length > 0) {
      bloqueos.push({ nombre: 'Información profesional', ref: informacionProfesionalHeadingRef })
    }
    if (errorEspecialidades) {
      bloqueos.push({ nombre: 'Especialidades', ref: especialidadesHeadingRef })
    }
    if (!disponibilidadValida) {
      bloqueos.push({ nombre: 'Disponibilidad', ref: disponibilidadHeadingRef })
    }

    if (bloqueos.length > 0) {
      setSeccionesBloqueando(bloqueos.map((b) => b.nombre))
      const primeraRef = bloqueos[0].ref
      window.requestAnimationFrame(() => {
        primeraRef.current?.scrollIntoView({ behavior: 'smooth' })
        primeraRef.current?.focus()
      })
      return
    }

    setSeccionesBloqueando([])

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
      fotoPerfilUrl: formulario.fotoPerfilUrl,
      cvUrl: formulario.cvUrl,
      numeroLicencia: formulario.numeroLicencia || undefined,
      entidadEmisora: formulario.entidadEmisora || undefined,
      archivoCredencialUrl: formulario.archivoCredencialUrl,
    })
    actualizarEspecialidadesColaborador(especialidades)
    guardarHorariosColaborador(horarios)
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

      <Card
        as="section"
        aria-labelledby="disponibilidad-solicitudes-titulo"
        className="sm:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="disponibilidad-solicitudes-titulo" className="text-[16px] font-semibold text-ink-900">
                Disponible para nuevas solicitudes
              </h2>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  formulario.estadoDisponibilidad === 'DISPONIBLE'
                    ? 'bg-emerald-soft text-emerald-deep'
                    : 'bg-surface text-ink-700'
                }`}
              >
                {formatEstadoDisponibilidad(formulario.estadoDisponibilidad)}
              </span>
            </div>
            <p className="mt-1.5 max-w-[70ch] text-[13px] leading-relaxed text-ink-500">
              Indica si puedes recibir nuevas solicitudes. El cambio se aplica cuando guardas el perfil.
            </p>
          </div>
          <Switch
            checked={formulario.estadoDisponibilidad === 'DISPONIBLE'}
            onCheckedChange={() =>
              actualizar(
                'estadoDisponibilidad',
                formulario.estadoDisponibilidad === 'DISPONIBLE' ? 'NO_DISPONIBLE' : 'DISPONIBLE',
              )
            }
            label="Disponible para nuevas solicitudes"
            className="h-11 w-[66px] [&>span]:left-1.5 [&>span]:top-[11px] [&[aria-checked=true]>span]:translate-x-7"
          />
        </div>
      </Card>

      {hayCambiosSinGuardar && (
        <p
          role="status"
          className="rounded-lg bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-amber-deep"
        >
          Tienes cambios sin guardar.
        </p>
      )}

      {/* 13.1 Foto */}
      <Card as="section" padding="lg">
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
      </Card>

      {/* 13.2 Información personal */}
      <Card as="section" padding="lg">
        <h2
          ref={informacionPersonalHeadingRef}
          tabIndex={-1}
          className="text-[16px] font-semibold text-ink-900 outline-none"
        >
          Información personal
        </h2>
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
      </Card>

      {/* 13.3 Información profesional */}
      <Card as="section" padding="lg">
        <h2
          ref={informacionProfesionalHeadingRef}
          tabIndex={-1}
          className="text-[16px] font-semibold text-ink-900 outline-none"
        >
          Información profesional
        </h2>
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
        </div>
      </Card>

      {/* 13.6 Especialidades */}
      <EspecialidadesEditor value={especialidades} onChange={setEspecialidades} headingRef={especialidadesHeadingRef} />

      {/* 13.7 Servicios */}
      <ServiciosEditor />

      {/* 13.4 CV */}
      <Card as="section" padding="lg">
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
      </Card>

      {/* 13.5 Credenciales */}
      <Card as="section" padding="lg">
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
      </Card>

      {/* 13.8 Disponibilidad */}
      <DisponibilidadEditor
        value={horarios}
        onChange={setHorarios}
        modalidadAtencion={formulario.modalidadAtencion}
        colaboradorId={colaboradorPerfil.id}
        onValidityChange={setDisponibilidadValida}
        headingRef={disponibilidadHeadingRef}
      />

      <div className="sticky bottom-0 flex flex-col gap-2.5 border-t border-line bg-background py-3.5">
        {seccionesBloqueando.length > 0 && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-destructive">
            No se pudo guardar. Revisa: {seccionesBloqueando.join(', ')}.
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={handleCancelar}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleGuardar}>
            Guardar cambios
          </Button>
        </div>
      </div>
    </section>
  )
}
