import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

const warn = (error: unknown): void => console.warn('[haptics]', error)

export function tapHaptic(): void {
  if (!Capacitor.isNativePlatform()) return
  Haptics.impact({ style: ImpactStyle.Light }).catch(warn)
}

export function resultHaptic(success: boolean): void {
  if (!Capacitor.isNativePlatform()) return
  Haptics.notification({ type: success ? NotificationType.Success : NotificationType.Warning }).catch(warn)
}
