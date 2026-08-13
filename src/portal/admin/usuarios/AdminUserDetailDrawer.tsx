import { useMemo, useState, type ReactNode } from 'react'
import { ExternalLink, Star, Trash2 } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { esUrlAdminPermitida } from '@/portal/admin/lib/documentos'
import { formatDate, formatMoney } from '@/portal/admin/lib/format'
import type { CollaboratorRecord, CompanyRecord, UserRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminDrawer } from '@/portal/admin/components/ui/AdminDrawer'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'

export type AdminUserDetailTarget = { kind: 'company'; record: CompanyRecord } | { kind: 'collaborator'; record: CollaboratorRecord } | { kind: 'user'; record: UserRecord } | null
const days = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

function Row({ label, value }: { label: string; value: ReactNode }) { return <div className="detail-row"><dt>{label}</dt><dd>{value ?? '—'}</dd></div> }
function Bool({ value }: { value: boolean }) { return <span>{value ? 'Sí' : 'No'}</span> }
function SafeLink({ value, label }: { value: string | null | undefined; label?: string }) {
  if (!value || !esUrlAdminPermitida(value)) return <span>—</span>
  return <a className="text-link" href={value} target="_blank" rel="noreferrer">{label ?? value}<ExternalLink aria-hidden="true" size={13} /></a>
}

export function AdminUserDetailDrawer({ target, onClose }: { target: AdminUserDetailTarget; onClose: () => void }) {
  const { data, setManagedUserState, removeManagedCompany, removeManagedCollaborator, removeEntity } = useAdminData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const user = useMemo(() => {
    if (!target) return null
    return target.kind === 'user' ? data.users.find((item) => item.id === target.record.id) ?? target.record : data.users.find((item) => item.id === target.record.usuario_id) ?? null
  }, [data.users, target])
  const title = target?.kind === 'company' ? target.record.nombre_comercial : user ? `${user.nombres} ${user.apellidos}` : ''
  const subtitle = target?.kind === 'company' ? target.record.ruc : target?.kind === 'collaborator' ? target.record.profesion : user?.correo
  const classification = (rows: Array<Record<string, unknown>>, id: string | null) => rows.find((row) => row.id === id)?.nombre as string | undefined
  const deleteLabel = target?.kind === 'company' ? 'Eliminar empresa' : target?.kind === 'collaborator' ? 'Eliminar perfil profesional' : 'Eliminar cuenta'
  const close = () => { setConfirmDelete(false); onClose() }
  const confirm = () => {
    if (!target) return
    if (target.kind === 'company') removeManagedCompany(target.record.id)
    if (target.kind === 'collaborator') removeManagedCollaborator(target.record.id)
    if (target.kind === 'user' && user) removeEntity('users', user.id)
    close()
  }

  return <><AdminDrawer open={Boolean(target)} title={title} subtitle={subtitle ?? undefined} onClose={close} footer={user ? <div className="flex flex-wrap justify-between gap-2"><AdminButton variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden="true" size={16} />{deleteLabel}</AdminButton><AdminButton variant={user.estado === 'ACTIVO' ? 'danger' : 'success'} onClick={() => setManagedUserState(user.id, user.estado === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO')}>{user.estado === 'ACTIVO' ? 'Suspender acceso' : 'Reactivar acceso'}</AdminButton></div> : undefined}>
    {target?.kind === 'company' ? <>
      <section className="drawer-section"><h3>Información general</h3><dl className="detail-list"><Row label="Razón social" value={target.record.razon_social} /><Row label="RUC" value={target.record.ruc} /><Row label="Correo empresarial" value={target.record.correo_empresarial} /><Row label="Teléfono" value={target.record.telefono_empresarial} /><Row label="Dirección" value={[target.record.direccion, target.record.ciudad, target.record.provincia].filter(Boolean).join(', ')} /><Row label="Sitio web" value={<SafeLink value={target.record.sitio_web} />} /><Row label="Fecha de constitución" value={formatDate(target.record.fecha_constitucion)} /><Row label="Estado" value={<AdminStatusBadge status={target.record.estado} />} /></dl></section>
      <section className="drawer-section"><h3>Clasificación empresarial</h3><dl className="detail-list"><Row label="Actividad económica" value={classification(data.economicActivities, target.record.actividad_economica_id)} /><Row label="Cluster de industria" value={classification(data.industryClusters, target.record.cluster_id)} /><Row label="Estructura societaria" value={classification(data.corporateStructures, target.record.estructura_societaria_id)} /><Row label="Tipo de contribuyente" value={classification(data.taxpayerTypes, target.record.tipo_contribuyente_id)} /><Row label="Giro de negocio" value={target.record.giro_negocio} /><Row label="Tamaño" value={target.record.tamano_empresa} /><Row label="Etapa del negocio" value={target.record.etapa_negocio} /><Row label="Número de empleados" value={target.record.numero_empleados} /></dl></section>
      <section className="drawer-section"><h3>Perfil tributario</h3><dl className="detail-list"><Row label="Lleva contabilidad" value={<Bool value={target.record.lleva_contabilidad} />} /><Row label="Declara impuestos" value={<Bool value={target.record.declara_impuestos} />} /><Row label="Objetivo principal" value={target.record.objetivo_principal} /><Row label="Meta financiera" value={target.record.meta_financiera} /></dl></section>
      <section className="drawer-section"><h3>Plan y actividad en SAFE</h3><dl className="detail-list"><Row label="Plan" value={target.record.plan} /><Row label="Suscripción" value={<AdminStatusBadge status={target.record.subscriptionState} />} /><Row label="Próxima renovación" value={formatDate(target.record.renewal)} /><Row label="Simulaciones utilizadas" value={target.record.simulationsUsed} /><Row label="Contactos en marketplace" value={target.record.marketplaceContacts} /><Row label="Última carga financiera" value={formatDate(target.record.lastFinancialUpload)} /><Row label="Registro en SAFE" value={formatDate(target.record.created_at)} /></dl></section>
    </> : null}
    {target?.kind === 'collaborator' ? <>
      <section className="drawer-section"><h3>Cuenta</h3><dl className="detail-list"><Row label="Nombre" value={user ? `${user.nombres} ${user.apellidos}` : '—'} /><Row label="Correo" value={user?.correo} /><Row label="Teléfono" value={user?.telefono} /><Row label="Ubicación" value={user ? `${user.ciudad}, ${user.pais}` : '—'} /><Row label="Estado" value={user ? <AdminStatusBadge status={user.estado} /> : '—'} /><Row label="Aprobación" value={formatDate(target.record.approved_at, true)} /></dl></section>
      <section className="drawer-section"><h3>Perfil profesional</h3><dl className="detail-list"><Row label="Área" value={target.record.area_especializacion} /><Row label="Profesión" value={target.record.profesion} /><Row label="Trabajo actual" value={target.record.trabajo_actual} /><Row label="Descripción" value={target.record.descripcion_profesional} /><Row label="Experiencia" value={`${target.record.anios_experiencia} años`} /><Row label="Modalidad" value={target.record.modalidad_atencion} /><Row label="Tarifa" value={formatMoney(target.record.tarifa_referencial)} /><Row label="Licencia" value={target.record.numero_licencia} /><Row label="Entidad emisora" value={target.record.entidad_emisora} /><Row label="CV" value={target.record.cv_visible ? <SafeLink value={target.record.cv_url} label="Ver CV" /> : 'No público'} /><Row label="Credencial" value={<SafeLink value={target.record.archivo_credencial_url} label="Ver credencial" />} /><Row label="Marketplace" value={<Bool value={target.record.visible_marketplace} />} /><Row label="Disponibilidad" value={<AdminStatusBadge status={target.record.estado_disponibilidad} />} /></dl></section>
      <section className="drawer-section"><h3>Especialidades</h3><p>{target.record.specialties.join(', ') || '—'}</p></section>
      <section className="drawer-section"><h3>Horarios activos</h3><div className="compact-list">{target.record.schedules.filter((item) => item.active).length ? target.record.schedules.filter((item) => item.active).map((item) => <div className="compact-list__row" key={`${item.day}-${item.start}`}><strong>{days[item.day] ?? '—'}</strong><span>{item.start} – {item.end}</span><small>{item.modality}</small></div>) : '—'}</div></section>
      <section className="drawer-section"><h3>Servicios</h3>{target.record.services.length ? target.record.services.map((service) => <p key={service.name}><strong>{service.name}</strong> · {service.duration} min · {formatMoney(service.price)}</p>) : <p>—</p>}</section>
      <section className="drawer-section"><h3>Reseñas</h3><p>{target.record.rating.toFixed(1)} <Star aria-hidden="true" size={13} /> · {target.record.reviews} reseñas</p>{target.record.reviewItems.map((review) => <p key={`${review.company}-${review.date}`}><strong>{review.company}</strong> · {review.rating}/5 · {review.comment} · {formatDate(review.date)}</p>)}</section>
    </> : null}
    {target?.kind === 'user' && user ? <section className="drawer-section"><h3>Información general</h3><dl className="detail-list"><Row label="Estado" value={<AdminStatusBadge status={user.estado} />} /><Row label="Correo" value={user.correo} /><Row label="Teléfono" value={user.telefono} /><Row label="Ubicación" value={`${user.ciudad}, ${user.pais}`} /><Row label="Correo verificado" value={<Bool value={user.correo_verificado} />} /><Row label="MFA" value={<Bool value={user.mfa_habilitado} />} /><Row label="Último acceso" value={formatDate(user.ultimo_acceso, true)} /><Row label="Registro" value={formatDate(user.created_at)} /></dl></section> : null}
  </AdminDrawer><AdminDialog open={confirmDelete} title="Confirmar eliminación" description="Esta acción no se puede deshacer durante la sesión." onClose={() => setConfirmDelete(false)} footer={<><AdminButton onClick={() => setConfirmDelete(false)}>Cancelar</AdminButton><AdminButton variant="danger" onClick={confirm}>{deleteLabel}</AdminButton></>}><p>{target?.kind === 'company' ? 'La empresa será eliminada y su propietario conservará la cuenta sin empresa.' : target?.kind === 'collaborator' ? 'El perfil profesional y su cuenta asociada serán eliminados.' : 'La cuenta será eliminada de SAFE.'}</p></AdminDialog></>
}
