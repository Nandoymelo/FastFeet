import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { right, type Either } from '@/core/types/either'
import { NotificationsRepository } from '../repositories/notifications-repository'
import { Injectable } from '@nestjs/common'
import { NotificationSender } from '../gateways/notification-sender'
import { Notification } from '../../enterprise/entities/notification'

export interface SendNotificationUseCaseRequest {
  recipientId: string
  title: string
  content: string
}

export type SendNotificationUseCaseResponse = Either<
  null,
  {
    notification: Notification
  }
>

@Injectable()
export class SendNotificationUseCase {
  constructor(
    private notificationsRepository: NotificationsRepository,
    private notificationSender: NotificationSender,
  ) {}

  async execute({
    recipientId,
    title,
    content,
  }: SendNotificationUseCaseRequest): Promise<SendNotificationUseCaseResponse> {
    const notification = Notification.create({
      recipientId: new UniqueEntityID(recipientId),
      title,
      content,
    })

    await this.notificationsRepository.create(notification)

    await this.notificationSender.send(notification)

    return right({
      notification,
    })
  }
}
