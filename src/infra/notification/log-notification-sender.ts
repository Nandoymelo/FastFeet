import { NotificationSender } from '@/domain/notification/application/gateways/notification-sender'
import type { Notification } from '@/domain/notification/enterprise/entities/notification'
import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class LogNotificationSender implements NotificationSender {
  private readonly logger = new Logger(LogNotificationSender.name)

  async send(notification: Notification): Promise<void> {
    this.logger.log(
      `[simulação] para o destinatário ${notification.recipientId.toString()}: ${notification.title} - ${notification.content}`,
    )
  }
}
