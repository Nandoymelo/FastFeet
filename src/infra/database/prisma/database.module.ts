import { Global, Module } from '@nestjs/common'
import { PrismaService } from './prisma.service'
import { UsersRepository } from '@/domain/fastFee/application/repositories/user-repository'
import { PrismaUsersRepository } from './repositories/prisma-users-repository'

@Global()
@Module({
  providers: [
    PrismaService,
    { provide: UsersRepository, useClass: PrismaUsersRepository },
  ],
  exports: [PrismaService, UsersRepository],
})
export class DatabaseModule {}
