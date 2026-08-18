import { useState, type ReactNode } from 'react'
import { ArrowLeft, ExternalLink, Star, Trash2 } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { esUrlAdminPermitida } from '@/portal/admin/lib/documentos'
import { formatDate, formatMoney } from '@/portal/admin/lib/format'
import type { CollaboratorRecord, UserRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminCard } from '@/portal/admin/components/ui/AdminCard'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminPageHeader } from '@/portal/admin/components/ui/AdminPageHeader'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'

export type AdminUserFullDetailTarget = { kind: 'collaborator'; record: CollaboratorRecord } | { kind: 'user'; record: UserRecord }

const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function Row({ label, value }: { label: string; value: ReactNode }) {
  return <div className="detail-row"><dt>{label}</dt><dd>{value ?? '—'}</dd></div>
}
function Bool({ value }: { value: boolean }) { return <span>{value ? 'Sí' : 'No'}</span> }
function SafeLink({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value || !esUrlAdminPermitida(value)) return <span>—</span>
  return <a className="text-link min-h-11 inline-flex items-center gap-1" href={value} target="_blank" rel="noreferrer">{label ?? value}<ExternalLink aria-hidden="true" size={13} /></a>
}
function initials(nombres: string, apellidos: string) {
  return `${nombres.trim().charAt(0)}${apellidos.trim().charAt(0)}`.toUpperCase() || '—'
}

export function AdminUserFullDetail({ target, onClose }: { target: AdminUserFullDetailTarget; onClose: () => void }) {
  const { data, setManagedUserState, removeManagedCollaborator, removeEntity } = useAdminData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const user = target.kind === 'user' ? target.record : data.users.find((item) => item.id === target.record.usuario_id) ?? null
  const deleteLabel = target.kind === 'collaborator' ? 'Eliminar perfil profesional' : 'Eliminar cuenta'
  const confirm = () => {
    if (target.kind === 'collaborator') removeManagedCollaborator(target.record.id)
    else if (user) removeEntity('users', user.id)
    setConfirmDelete(false)
    onClose()
  }

  return (
    <>
      <AdminPageHeader
        title={target.kind === 'collaborator' ? 'Detalle de colaborador' : 'Detalle de usuario'}
        description="Perfil no editable."
        actions={
          <button type="button" className="admin-button admin-button--secondary admin-button--md" onClick={onClose}>
            <ArrowLeft aria-hidden="true" size={16} />
            Volver
          </button>
        }
      />
      <AdminCard className="mt-3 p-5">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-navy-600 text-lg font-bold text-white" aria-hidden="true">
            {user ? initials(user.nombres, user.apellidos) : '—'}
          </span>
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{user ? `${user.nombres} ${user.apellidos}` : '—'}</h2>
            <p className="text-sm text-ink-600">Perfil no editable</p>
          </div>
        </div>

        {target.kind === 'collaborator' ? (
          <dl className="detail-list mt-5 !grid-cols-2 border-t border-line pt-5 sm:!grid-cols-4">
            <Row label="Calificación promedio" value={`${target.record.rating.toFixed(1)} estrellas`} />
            <Row label="Último acceso" value={formatDate(user?.ultimo_acceso, true)} />
            <Row label="Veces contactada" value={`${target.record.reviews} veces`} />
            <Row label="Fecha de aprobación" value={formatDate(target.record.approved_at)} />
          </dl>
        ) : null}
      </AdminCard>

      <section className="drawer-section mt-5"><h3>Información personal</h3><dl className="detail-list">
        <Row label="Nombres" value={user?.nombres} />
        <Row label="Teléfono" value={user?.telefono} />
        <Row label="Apellidos" value={user?.apellidos} />
        <Row label="País" value={user?.pais} />
        <Row label="Correo electrónico" value={user?.correo} />
        <Row label="Ciudad" value={user?.ciudad} />
      </dl></section>

      {target.kind === 'collaborator' ? (
        <>
          <section className="drawer-section mt-5"><h3>Información profesional</h3><dl className="detail-list">
            <Row label="Área de especialización" value={target.record.area_especializacion} />
            <Row label="Especialidad principal" value={target.record.specialties[0] ?? target.record.area_especializacion} />
            <Row label="Descripción profesional" value={target.record.descripcion_profesional} />
            <Row label="Experiencia" value={`${target.record.anios_experiencia} años`} />
            <Row label="Modalidad" value={target.record.modalidad_atencion} />
            <Row label="Tarifa" value={formatMoney(target.record.tarifa_referencial)} />
            <Row label="Licencia" value={target.record.numero_licencia} />
            <Row label="Entidad emisora" value={target.record.entidad_emisora} />
            <Row label="CV" value={target.record.cv_visible ? <SafeLink value={target.record.cv_url} label="Ver CV" /> : 'No público'} />
            <Row label="Credencial" value={<SafeLink value={target.record.archivo_credencial_url} label="Ver credencial" />} />
            <Row label="Marketplace" value={<Bool value={target.record.visible_marketplace} />} />
            <Row label="Disponibilidad" value={<AdminStatusBadge status={target.record.estado_disponibilidad} />} />
          </dl></section>
          <section className="drawer-section mt-5"><h3>Especialidades</h3><p>{target.record.specialties.join(', ') || '—'}</p></section>
          <section className="drawer-section mt-5"><h3>Horarios activos</h3><div className="compact-list">{target.record.schedules.filter((item) => item.active).length ? target.record.schedules.filter((item) => item.active).map((item) => <div className="compact-list__row" key={`${item.day}-${item.start}`}><strong>{days[item.day] ?? '—'}</strong><span>{item.start} – {item.end}</span><small>{item.modality}</small></div>) : '—'}</div></section>
          <section className="drawer-section mt-5"><h3>Servicios</h3>{target.record.services.length ? target.record.services.map((service) => <p key={service.name}><strong>{service.name}</strong> · {service.duration} min · {formatMoney(service.price)}</p>) : <p>—</p>}</section>
          <section className="drawer-section mt-5"><h3>Reseñas</h3><p>{target.record.rating.toFixed(1)} <Star aria-hidden="true" size={13} /> · {target.record.reviews} reseñas</p>{target.record.reviewItems.map((review) => <p key={`${review.company}-${review.date}`}><strong>{review.company}</strong> · {review.rating}/5 · {review.comment} · {formatDate(review.date)}</p>)}</section>
        </>
      ) : (
        <section className="drawer-section mt-5"><h3>Cuenta</h3><dl className="detail-list">
          <Row label="Estado" value={user ? <AdminStatusBadge status={user.estado} /> : '—'} />
          <Row label="Correo verificado" value={user ? <Bool value={user.correo_verificado} /> : '—'} />
          <Row label="MFA" value={user ? <Bool value={user.mfa_habilitado} /> : '—'} />
          <Row label="Registro" value={formatDate(user?.created_at)} />
        </dl></section>
      )}

      {user ? (
        <div className="mt-5 flex flex-wrap justify-between gap-2">
          <AdminButton variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden="true" size={16} />{deleteLabel}</AdminButton>
          <AdminButton variant={user.estado === 'ACTIVO' ? 'danger' : 'success'} onClick={() => setManagedUserState(user.id, user.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO')}>{user.estado === 'ACTIVO' ? 'Suspender acceso' : 'Reactivar acceso'}</AdminButton>
        </div>
      ) : null}

      <AdminDialog open={confirmDelete} title="Confirmar eliminación" description="Esta acción no se puede deshacer durante la sesión." onClose={() => setConfirmDelete(false)} footer={<><AdminButton onClick={() => setConfirmDelete(false)}>Cancelar</AdminButton><AdminButton variant="danger" onClick={confirm}>{deleteLabel}</AdminButton></>}>
        <p>{target.kind === 'collaborator' ? 'El perfil profesional y su cuenta asociada serán eliminados.' : 'La cuenta será eliminada de SAFE.'}</p>
      </AdminDialog>
    </>
  )
}
