import { useState } from 'react'
import { ExternalLink, Trash2 } from 'lucide-react'
import { useAdminData } from '@/portal/admin/data/AdminDataContext'
import { esUrlAdminPermitida } from '@/portal/admin/lib/documentos'
import { formatDate } from '@/portal/admin/lib/format'
import type { CollaboratorRecord, CompanyRecord, UserRecord } from '@/portal/admin/types'
import { AdminButton } from '@/portal/admin/components/ui/AdminButton'
import { AdminDialog } from '@/portal/admin/components/ui/AdminDialog'
import { AdminDrawer } from '@/portal/admin/components/ui/AdminDrawer'
import { AdminStatusBadge } from '@/portal/admin/components/ui/AdminStatusBadge'

export type AdminUserDetailTarget = { kind: 'company'; record: CompanyRecord } | { kind: 'collaborator'; record: CollaboratorRecord } | { kind: 'user'; record: UserRecord } | null

function Row({ label, value }: { label: string; value: React.ReactNode }) { return <div className="detail-row"><dt>{label}</dt><dd>{value ?? '—'}</dd></div> }
function SafeLink({ value }: { value: string | null | undefined }) {
  if (!value || !esUrlAdminPermitida(value)) return <span>—</span>
  return <a className="text-link min-h-11 inline-flex items-center gap-1" href={value} target="_blank" rel="noreferrer">{value}<ExternalLink aria-hidden="true" size={13} /></a>
}

export function AdminUserDetailDrawer({ target, onClose }: { target: { kind: 'company'; record: CompanyRecord } | null; onClose: () => void }) {
  const { data, removeManagedCompany } = useAdminData()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const classification = (rows: Array<Record<string, unknown>>, id: string | null) => rows.find((row) => row.id === id)?.nombre as string | undefined
  const close = () => { setConfirmDelete(false); onClose() }
  const confirm = () => {
    if (!target) return
    removeManagedCompany(target.record.id)
    close()
  }

  return <><AdminDrawer open={Boolean(target)} title={target?.record.nombre_comercial ?? ''} subtitle={target?.record.ruc} onClose={close} footer={target ? <div className="flex flex-wrap justify-between gap-2"><AdminButton variant="ghost" onClick={() => setConfirmDelete(true)}><Trash2 aria-hidden="true" size={16} />Eliminar empresa</AdminButton></div> : undefined}>
    {target ? <>
      <section className="drawer-section"><h3>Información general</h3><dl className="detail-list"><Row label="Razón social" value={target.record.razon_social} /><Row label="RUC" value={target.record.ruc} /><Row label="Correo empresarial" value={target.record.correo_empresarial} /><Row label="Teléfono" value={target.record.telefono_empresarial} /><Row label="Dirección" value={[target.record.direccion, target.record.ciudad, target.record.provincia].filter(Boolean).join(', ')} /><Row label="Sitio web" value={<SafeLink value={target.record.sitio_web} />} /><Row label="Fecha de constitución" value={formatDate(target.record.fecha_constitucion)} /><Row label="Estado" value={<AdminStatusBadge status={target.record.estado} />} /></dl></section>
      <section className="drawer-section"><h3>Clasificación empresarial</h3><dl className="detail-list"><Row label="Actividad económica" value={classification(data.economicActivities, target.record.actividad_economica_id)} /><Row label="Cluster de industria" value={classification(data.industryClusters, target.record.cluster_id)} /><Row label="Estructura societaria" value={classification(data.corporateStructures, target.record.estructura_societaria_id)} /><Row label="Tipo de contribuyente" value={classification(data.taxpayerTypes, target.record.tipo_contribuyente_id)} /><Row label="Giro de negocio" value={target.record.giro_negocio} /><Row label="Tamaño" value={target.record.tamano_empresa} /><Row label="Etapa del negocio" value={target.record.etapa_negocio} /><Row label="Número de empleados" value={target.record.numero_empleados} /></dl></section>
      <section className="drawer-section"><h3>Perfil tributario</h3><dl className="detail-list"><Row label="Lleva contabilidad" value={target.record.lleva_contabilidad ? 'Sí' : 'No'} /><Row label="Declara impuestos" value={target.record.declara_impuestos ? 'Sí' : 'No'} /><Row label="Objetivo principal" value={target.record.objetivo_principal} /><Row label="Meta financiera" value={target.record.meta_financiera} /></dl></section>
      <section className="drawer-section"><h3>Plan y actividad en SAFE</h3><dl className="detail-list"><Row label="Plan" value={target.record.plan} /><Row label="Suscripción" value={<AdminStatusBadge status={target.record.subscriptionState} />} /><Row label="Próxima renovación" value={formatDate(target.record.renewal)} /><Row label="Simulaciones utilizadas" value={target.record.simulationsUsed} /><Row label="Contactos en marketplace" value={target.record.marketplaceContacts} /><Row label="Última carga financiera" value={formatDate(target.record.lastFinancialUpload)} /><Row label="Registro en SAFE" value={formatDate(target.record.created_at)} /></dl></section>
    </> : null}
  </AdminDrawer><AdminDialog open={confirmDelete} title="Confirmar eliminación" description="Esta acción no se puede deshacer durante la sesión." onClose={() => setConfirmDelete(false)} footer={<><AdminButton onClick={() => setConfirmDelete(false)}>Cancelar</AdminButton><AdminButton variant="danger" onClick={confirm}>Eliminar empresa</AdminButton></>}><p>La empresa será eliminada y su propietario conservará la cuenta sin empresa.</p></AdminDialog></>
}
