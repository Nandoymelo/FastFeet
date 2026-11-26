import { OnOrderChangeStatus } from '@/domain/notification/application/subscribre/on-order-change-status'
import { SendNotificationUseCase } from '@/domain/notification/application/use-cases/send-notification'
import { Module } from '@nestjs/common'
import { DatabaseModule } from '../database/prisma/database.module'
import { NotificationSender } from '@/domain/notification/application/gateways/notification-sender'
import { LogNotificationSender } from '../notification/log-notification-sender'

@Module({
  imports: [DatabaseModule],
  providers: [
    OnOrderChangeStatus,
    SendNotificationUseCase,
    { provide: NotificationSender, useClass: LogNotificationSender },
  ],
})
export class EventsModule {}
