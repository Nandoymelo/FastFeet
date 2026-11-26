import type { Notification } from '../../enterprise/entities/notification'

// Porta para o serviço externo que entrega a notificação (e-mail, SMS, push)
export abstract class NotificationSender {
  abstract send(notification: Notification): Promise<void>
}
