import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { UsersRepository } from '@/domain/fastFee/application/repositories/user-repository'
import { PrismaUsersRepository } from './repositories/prisma-users-repository'
import { RecipientRepository } from '@/domain/fastFee/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './repositories/prisma-recipients-repository'
import { OrdersRepository } from '@/domain/fastFee/application/repositories/orders-repository'
import { PrismaOrdersRepository } from './repositories/prisma-orders-repository'
import { NotificationsRepository } from '@/domain/notification/application/repositories/notifications-repository'
import { PrismaNotificationsRepository } from './repositories/prisma-notifications-repository'

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    { provide: RecipientRepository, useClass: PrismaRecipientsRepository },
    { provide: OrdersRepository, useClass: PrismaOrdersRepository },
    {
      provide: NotificationsRepository,
      useClass: PrismaNotificationsRepository,
    },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    RecipientRepository,
    OrdersRepository,
    NotificationsRepository,
  ],
})
export class DatabaseModule {}
