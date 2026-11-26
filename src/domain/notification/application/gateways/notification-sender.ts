import type { Notification } from '../../enterprise/entities/notification'

export abstract class NotificationSender {
  abstract send(notification: Notification): Promise<void>
}
