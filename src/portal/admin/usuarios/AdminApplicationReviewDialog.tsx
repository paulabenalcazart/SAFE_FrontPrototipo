import { useEffect, useId, useState, type ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { esUrlAdminPermitida } from '@/portal/admin/lib/documentos'
import { formatDate, formatMoney } from '@/portal/admin/lib/format'
import type { ApplicationRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'

const days = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
function Row({ label, value }: { label: string; value: ReactNode }) { return <div className="detail-row"><dt>{label}</dt><dd>{value ?? '—'}</dd></div> }
function SafeDocument({ value, label }: { value: string | null; label: string }) { return value && esUrlAdminPermitida(value) ? <a className="document-link" href={value} target="_blank" rel="noreferrer">{label}<ExternalLink aria-hidden="true" size={13} /></a> : <span>—</span> }

export function AdminApplicationReviewDialog({ application, onClose }: { application: ApplicationRecord | null; onClose: () => void }) {
  const { reviewApplication } = useAdminData()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const reasonId = useId()
  useEffect(() => { setReason(application?.motivo_rechazo ?? ''); setError(''); setReviewing(false) }, [application])
  const pending = Boolean(application && ['PENDIENTE', 'EN_REVISION'].includes(application.estado))
  const approve = () => { if (application && !reviewing) { setReviewing(true); reviewApplication(application.id, 'APROBADA'); onClose() } }
  const reject = () => {
    if (!application || reviewing) return
    const trimmed = reason.trim()
    if (!trimmed) { setError('Escribe un motivo de rechazo antes de continuar.'); return }
    setReviewing(true)
    reviewApplication(application.id, 'RECHAZADA', reason.trim())
    onClose()
  }
  return <AdminDialog open={Boolean(application)} title={application ? `${application.nombres} ${application.apellidos}` : 'Solicitud profesional'} description="Revisa la información antes de validar al profesional." onClose={onClose} wide footer={application && pending ? <><AdminButton variant="danger" disabled={reviewing} onClick={reject}>Rechazar</AdminButton><AdminButton variant="success" disabled={reviewing} onClick={approve}>Aprobar profesional</AdminButton></> : <AdminButton onClick={onClose}>Cerrar</AdminButton>}>
    {application ? <div className="application-review">
      <div className="application-review__summary"><div><span>Estado de solicitud</span><AdminStatusBadge status={application.estado} /></div><div><span>Fecha de postulación</span><strong>{formatDate(application.created_at, true)}</strong></div>{application.reviewed_at ? <div><span>Fecha de revisión</span><strong>{formatDate(application.reviewed_at, true)}</strong></div> : null}</div>
      <section className="review-section"><h3>Información personal</h3><dl className="detail-list"><Row label="Nombres" value={application.nombres} /><Row label="Apellidos" value={application.apellidos} /><Row label="Correo" value={application.correo} /><Row label="Teléfono" value={application.telefono} /><Row label="País" value={application.pais} /><Row label="Ciudad" value={application.ciudad} /></dl></section>
      <section className="review-section"><h3>Información profesional</h3><dl className="detail-list"><Row label="Área" value={application.area_especializacion} /><Row label="Especialidad principal" value={application.especialidad_principal} /><Row label="Trabajo actual" value={application.trabajo_actual} /><Row label="Hoja de vida" value={<SafeDocument value={application.cv_url} label="Ver CV" />} /><Row label="Licencia" value={application.numero_licencia} /><Row label="Entidad emisora" value={application.entidad_emisora} /><Row label="Credencial" value={<SafeDocument value={application.archivo_credencial_url} label="Ver credencial" />} /><Row label="Cómo llegó a SAFE" value={application.como_llego_safe} /></dl><p>{application.descripcion_profesional || '—'}</p></section>
      <section className="review-section"><h3>Perfil y disponibilidad</h3><dl className="detail-list"><Row label="Modalidad" value={application.modalidad_atencion} /><Row label="Tarifa referencial" value={formatMoney(application.tarifa_referencial)} /><Row label="Disponibilidad" value={`${application.dias_disponibles.map((day) => days[day]).filter(Boolean).join(', ') || '—'} · ${application.hora_inicio_referencial ?? '—'} – ${application.hora_fin_referencial ?? '—'}`} /><Row label="Código de invitación" value={application.codigo_invitacion} /></dl></section>
      <section className="review-section"><h3>Consentimientos</h3><p>{application.acepta_validacion ? 'Validación de información aceptada.' : 'Validación de información pendiente.'}</p><p>{application.acepta_terminos ? 'Términos aceptados.' : 'Términos pendientes.'}</p></section>
      {pending ? <div className="form-field"><label htmlFor={reasonId}>Motivo de rechazo</label><textarea id={reasonId} aria-describedby={error ? `${reasonId}-error` : undefined} value={reason} onChange={(event) => { setReason(event.target.value); setError('') }} placeholder="Escribe una razón clara para comunicarla al profesional." />{error ? <p id={`${reasonId}-error`} role="alert">{error}</p> : null}</div> : application.motivo_rechazo ? <section className="review-section"><h3>Motivo de rechazo</h3><p>{application.motivo_rechazo}</p></section> : null}
    </div> : null}
  </AdminDialog>
}
