import { AlertsNotificationsScreen } from './AlertsNotificationsScreen'
import { useNotificationItems } from './useTopbarItems'

export function NotificacionesScreen() {
  const items = useNotificationItems()
  return (
    <AlertsNotificationsScreen
      titulo="Notificaciones"
      descripcion="Historial de novedades de tu cuenta en SAFE."
      items={items}
      emptyMessage="Aún no hay notificaciones."
    />
  )
}
