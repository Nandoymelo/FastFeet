import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { UsersRepository } from '@/domain/fastFee/application/repositories/user-repository'
import { PrismaUsersRepository } from './repositories/prisma-users-repository'
import { RecipientRepository } from '@/domain/fastFee/application/repositories/recipients-repository'
import { PrismaRecipientsRepository } from './repositories/prisma-recipients-repository'
import { OrdersRepository } from '@/domain/fastFee/application/repositories/orders-repository'
import { PrismaOrdersRepository } from './repositories/prisma-orders-repository'

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
    { provide: RecipientRepository, useClass: PrismaRecipientsRepository },
    { provide: OrdersRepository, useClass: PrismaOrdersRepository },
  ],
  exports: [
    PrismaService,
    UsersRepository,
    RecipientRepository,
    OrdersRepository,
  ],
})
export class DatabaseModule {}
