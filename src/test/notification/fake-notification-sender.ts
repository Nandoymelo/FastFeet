import type { NotificationSender } from '@/domain/notification/application/gateways/notification-sender'
import type { Notification } from '@/domain/notification/enterprise/entities/notification'

export class FakeNotificationSender implements NotificationSender {
  sent: Notification[] = []

  async send(notification: Notification) {
    this.sent.push(notification)
  }
}
