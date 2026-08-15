import { AlertsNotificationsScreen } from './AlertsNotificationsScreen'
import { useAlertItems } from './useTopbarItems'

export function AlertasScreen() {
  const items = useAlertItems()
  return (
    <AlertsNotificationsScreen
      titulo="Alertas prioritarias"
      descripcion="Obligaciones y vencimientos que requieren tu atención."
      items={items}
      emptyMessage="No tienes alertas pendientes."
    />
  )
}
